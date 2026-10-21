import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("─────────────────────────────────────────");
  console.log("  FundPool Deployment");
  console.log("─────────────────────────────────────────");
  console.log(`  Network  : ${network.name} (chainId: ${network.chainId})`);
  console.log(`  Deployer : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} AVAX`);
  console.log("─────────────────────────────────────────\n");

  console.log("Deploying FundPool contract...");
  const FundPool = await ethers.getContractFactory("FundPool");
  const fundPool = await FundPool.deploy();
  await fundPool.waitForDeployment();

  const address = await fundPool.getAddress();
  const deployTx = fundPool.deploymentTransaction();

  console.log(`\n✅ FundPool deployed successfully!`);
  console.log(`   Contract address : ${address}`);
  console.log(`   Transaction hash : ${deployTx?.hash}`);
  console.log(`\n📝 Update your .env.local:`);

  if (network.chainId === 43113n) {
    console.log(`   NEXT_PUBLIC_FUNDPOOL_FUJI=${address}`);
    console.log(`\n🔍 View on SnowTrace Testnet:`);
    console.log(`   https://testnet.snowtrace.io/address/${address}`);
    console.log(`\n📋 Also update src/lib/contracts/chains.ts:`);
    console.log(`   [avalancheFuji.id]: "${address}"`);
  } else if (network.chainId === 43114n) {
    console.log(`   NEXT_PUBLIC_FUNDPOOL_MAINNET=${address}`);
    console.log(`\n🔍 View on SnowTrace:`);
    console.log(`   https://snowtrace.io/address/${address}`);
    console.log(`\n📋 Also update src/lib/contracts/chains.ts:`);
    console.log(`   [avalancheMainnet.id]: "${address}"`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("  To verify the contract run:");
  console.log(`  npx hardhat verify --network ${network.chainId === 43113n ? "fuji" : "mainnet"} ${address}`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
