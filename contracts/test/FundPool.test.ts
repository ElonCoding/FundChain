import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("FundPool", function () {
  // ── Deploy fixture ──────────────────────────────────────
  async function deployFundPoolFixture() {
    const [owner, contributor1, contributor2, other] = await ethers.getSigners();
    const FundPool = await ethers.getContractFactory("FundPool");
    const fundPool = await FundPool.deploy();
    return { fundPool, owner, contributor1, contributor2, other };
  }

  const CONTRIBUTION = ethers.parseEther("0.1");
  const GOAL         = ethers.parseEther("1.0");

  // ── Pool creation ───────────────────────────────────────
  describe("createPool", function () {
    it("should create a pool with correct parameters", async function () {
      const { fundPool, owner } = await loadFixture(deployFundPoolFixture);

      await fundPool.createPool(
        "Test Pool",
        "A test description",
        "group-123",
        CONTRIBUTION,
        GOAL,
        0n,
      );

      const pool = await fundPool.getPool(0n);
      expect(pool.title).to.equal("Test Pool");
      expect(pool.creator).to.equal(owner.address);
      expect(pool.contributionAmount).to.equal(CONTRIBUTION);
      expect(pool.goalAmount).to.equal(GOAL);
      expect(pool.status).to.equal(0); // Active
    });

    it("should reject empty title", async function () {
      const { fundPool } = await loadFixture(deployFundPoolFixture);
      await expect(
        fundPool.createPool("", "desc", "group-1", CONTRIBUTION, GOAL, 0n)
      ).to.be.revertedWith("FundPool: title required");
    });

    it("should reject zero contribution amount", async function () {
      const { fundPool } = await loadFixture(deployFundPoolFixture);
      await expect(
        fundPool.createPool("Test", "desc", "group-1", 0n, GOAL, 0n)
      ).to.be.revertedWith("FundPool: contribution must be > 0");
    });

    it("should emit PoolCreated event", async function () {
      const { fundPool } = await loadFixture(deployFundPoolFixture);
      await expect(
        fundPool.createPool("Test Pool", "desc", "group-1", CONTRIBUTION, GOAL, 0n)
      ).to.emit(fundPool, "PoolCreated").withArgs(0n, await (await ethers.getSigners())[0].getAddress(), "Test Pool", CONTRIBUTION, GOAL, "group-1");
    });
  });

  // ── Contributions ───────────────────────────────────────
  describe("contribute", function () {
    async function poolReadyFixture() {
      const base = await deployFundPoolFixture();
      await base.fundPool.createPool("Pool", "desc", "g1", CONTRIBUTION, GOAL, 0n);
      return base;
    }

    it("should accept correct contribution amount", async function () {
      const { fundPool, contributor1 } = await loadFixture(poolReadyFixture);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });
      const pool = await fundPool.getPool(0n);
      expect(pool.totalCollected).to.equal(CONTRIBUTION);
      expect(pool.participantCount).to.equal(1n);
    });

    it("should record contributor as participant", async function () {
      const { fundPool, contributor1 } = await loadFixture(poolReadyFixture);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });
      expect(await fundPool.isParticipant(0n, contributor1.address)).to.be.true;
    });

    it("should reject duplicate contributions", async function () {
      const { fundPool, contributor1 } = await loadFixture(poolReadyFixture);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });
      await expect(
        fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION })
      ).to.be.revertedWith("FundPool: already contributed");
    });

    it("should reject incorrect contribution amount", async function () {
      const { fundPool, contributor1 } = await loadFixture(poolReadyFixture);
      await expect(
        fundPool.connect(contributor1).contribute(0n, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("FundPool: incorrect contribution amount");
    });

    it("should emit ContributionMade event", async function () {
      const { fundPool, contributor1 } = await loadFixture(poolReadyFixture);
      await expect(
        fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION })
      ).to.emit(fundPool, "ContributionMade").withArgs(0n, contributor1.address, CONTRIBUTION, CONTRIBUTION);
    });

    it("should auto-complete pool when goal is reached", async function () {
      const { fundPool } = await loadFixture(deployFundPoolFixture);
      // Pool where goal = 1 contribution
      await fundPool.createPool("Small Pool", "desc", "g1", CONTRIBUTION, CONTRIBUTION, 0n);
      const [, c1] = await ethers.getSigners();
      await fundPool.connect(c1).contribute(0n, { value: CONTRIBUTION });
      const pool = await fundPool.getPool(0n);
      expect(pool.status).to.equal(1); // Completed
    });
  });

  // ── Withdrawals ─────────────────────────────────────────
  describe("withdrawFunds", function () {
    it("should allow creator to withdraw funds", async function () {
      const { fundPool, owner, contributor1 } = await loadFixture(deployFundPoolFixture);
      await fundPool.createPool("Pool", "desc", "g1", CONTRIBUTION, GOAL, 0n);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });

      const before = await ethers.provider.getBalance(owner.address);
      const tx     = await fundPool.withdrawFunds(0n);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after   = await ethers.provider.getBalance(owner.address);

      expect(after).to.equal(before + CONTRIBUTION - gasUsed);
    });

    it("should not allow non-creator to withdraw", async function () {
      const { fundPool, contributor1 } = await loadFixture(deployFundPoolFixture);
      await fundPool.createPool("Pool", "desc", "g1", CONTRIBUTION, GOAL, 0n);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });
      await expect(
        fundPool.connect(contributor1).withdrawFunds(0n)
      ).to.be.revertedWith("FundPool: caller is not pool creator");
    });
  });

  // ── Cancellation ────────────────────────────────────────
  describe("cancelPool", function () {
    it("should refund all participants on cancel", async function () {
      const { fundPool, contributor1, contributor2 } = await loadFixture(deployFundPoolFixture);
      await fundPool.createPool("Pool", "desc", "g1", CONTRIBUTION, GOAL, 0n);
      await fundPool.connect(contributor1).contribute(0n, { value: CONTRIBUTION });
      await fundPool.connect(contributor2).contribute(0n, { value: CONTRIBUTION });

      const c1Before = await ethers.provider.getBalance(contributor1.address);
      await fundPool.cancelPool(0n);
      const c1After = await ethers.provider.getBalance(contributor1.address);

      // contributor1 received refund (may differ slightly from gas if they paid gas on cancellation — they didn't here)
      expect(c1After).to.be.greaterThan(c1Before);
    });
  });
});
