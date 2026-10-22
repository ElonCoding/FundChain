"use client";

import { useMemo } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { FLEXIBLE_POOL_ABI } from "@/lib/contracts/flexibleAbi";
import { avalancheFuji, avalancheMainnet, CONTRACT_ADDRESSES } from "@/lib/contracts/chains";

/* ──────────────────────────────────────────────────────────
 *  Chain-aware contract address resolver
 * ────────────────────────────────────────────────────────── */

function useContractAddress(): `0x${string}` {
  const chainId = useChainId();
  if (chainId === avalancheMainnet.id) {
    return CONTRACT_ADDRESSES.flexiblePool[avalancheMainnet.id];
  }
  return CONTRACT_ADDRESSES.flexiblePool[avalancheFuji.id];
}

/* ──────────────────────────────────────────────────────────
 *  Re-usable tx state builder
 * ────────────────────────────────────────────────────────── */

function useTxBundle() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  return { writeContract, hash, isPending, isConfirming, isSuccess, error, reset };
}

/* ══════════════════════════════════════════════════════════
 *  READS
 * ══════════════════════════════════════════════════════════ */

export function usePoolCount() {
  const address = useContractAddress();
  return useReadContract({ address, abi: FLEXIBLE_POOL_ABI, functionName: "getPoolCount" });
}

export function useAllPools() {
  const address = useContractAddress();
  const { data: poolCount, isLoading: isCountLoading, refetch: refetchCount } = usePoolCount();

  const count = poolCount ? Number(poolCount) : 0;
  const contracts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      address,
      abi: FLEXIBLE_POOL_ABI,
      functionName: "getPool" as const,
      args: [BigInt(i)],
    }));
  }, [address, count]);

  const { data: rawPools, isLoading: isPoolsLoading, refetch: refetchPools } = useReadContracts({
    contracts,
    query: {
      enabled: count > 0,
    },
  });

  const pools = useMemo(() => {
    if (!rawPools) return [];
    return rawPools
      .map((r, idx) => {
        if (r.status !== "success" || !r.result) return null;
        const p: any = r.result;
        return {
          id: Number(p.id ?? idx),
          creator: p.creator as string,
          poolType: Number(p.poolType) === 1 ? ("luckydraw" as const) : ("event" as const),
          title: p.title || `Pool #${idx}`,
          description: p.description || "",
          groupId: p.groupId as string,
          contributionAmount: p.contributionAmount && p.contributionAmount > BigInt(0)
            ? formatEther(p.contributionAmount) + " AVAX"
            : "Flexible",
          contributionWei: p.contributionAmount ?? BigInt(0),
          minContributionWei: p.minContribution ?? BigInt(0),
          maxContributionWei: p.maxContribution ?? BigInt(0),
          recipientAddress: p.recipientAddress || "",
          totalCollected: formatEther(p.totalCollected ?? BigInt(0)) + " AVAX",
          totalCollectedWei: p.totalCollected ?? BigInt(0),
          participantCount: Number(p.participantCount ?? 0),
          createdAt: p.createdAt && Number(p.createdAt) > 0
            ? new Date(Number(p.createdAt) * 1000).toISOString()
            : new Date().toISOString(),
          deadline: p.deadline && Number(p.deadline) > 0
            ? new Date(Number(p.deadline) * 1000).toISOString()
            : null,
          status: (Number(p.status) === 1
            ? "completed"
            : Number(p.status) === 2
            ? "cancelled"
            : Number(p.status) === 3
            ? "withdrawn"
            : "active") as "active" | "completed" | "cancelled" | "withdrawn",
          winner: p.winner && p.winner !== "0x0000000000000000000000000000000000000000" ? p.winner : null,
          // Compatibility fields with MockPoolDisplay
          creatorFull: p.creator,
          goalAmount: p.contributionAmount && p.contributionAmount > BigInt(0)
            ? (parseFloat(formatEther(p.contributionAmount)) * 10).toFixed(2) + " AVAX"
            : "5.0 AVAX",
          maxParticipants: 100,
          contributionMode: p.contributionAmount && p.contributionAmount > BigInt(0) ? ("fixed" as const) : ("flexible" as const),
          groupChatId: p.groupId || `chat-pool-${idx}`,
          participants: [],
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [rawPools]);

  return {
    pools,
    poolCount: count,
    isLoading: isCountLoading || (count > 0 && isPoolsLoading),
    refetch: () => {
      refetchCount();
      refetchPools();
    },
  };
}

export function usePool(poolId: bigint, enabled = true) {
  const address = useContractAddress();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "getPool",
    args: [poolId],
    query: { enabled },
  });
}

export function usePoolParticipants(poolId: bigint) {
  const address = useContractAddress();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "getPoolParticipants",
    args: [poolId],
  });
}

export function useIsParticipant(poolId: bigint) {
  const address = useContractAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "isParticipant",
    args: [poolId, userAddress!],
    query: { enabled: !!userAddress },
  });
}

export function useContributionByUser(poolId: bigint) {
  const address = useContractAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "getContributionByUser",
    args: [poolId, userAddress!],
    query: { enabled: !!userAddress },
  });
}

export function useUserCreatedPools() {
  const address = useContractAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "getUserCreatedPools",
    args: [userAddress!],
    query: { enabled: !!userAddress },
  });
}

export function useContributions(offset: bigint = BigInt(0), limit: bigint = BigInt(50)) {
  const address = useContractAddress();
  return useReadContract({
    address, abi: FLEXIBLE_POOL_ABI,
    functionName: "getContributions",
    args: [offset, limit],
  });
}

/* ══════════════════════════════════════════════════════════
 *  WRITES — Pool Creation
 * ══════════════════════════════════════════════════════════ */

export interface EventPoolParams {
  title: string;
  description: string;
  groupId: string;
  /** Fixed amount in AVAX string, e.g. "0.1". Set "" for flexible mode. */
  contributionAmount: string;
  minContribution: string;   // "0" if fixed
  maxContribution: string;   // "0" for unlimited
  recipientAddress: `0x${string}` | "";
  deadline: number;          // unix ts, 0 for none
}

export function useCreateEventPool() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function createEventPool(p: EventPoolParams) {
    const fixedWei = p.contributionAmount ? parseEther(p.contributionAmount) : BigInt(0);
    const minWei   = p.minContribution    ? parseEther(p.minContribution)    : BigInt(0);
    const maxWei   = p.maxContribution    ? parseEther(p.maxContribution)    : BigInt(0);
    const recipient = (p.recipientAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`;

    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "createEventPool",
      args: [p.title, p.description, p.groupId, fixedWei, minWei, maxWei, recipient, BigInt(p.deadline)],
    });
  }

  return { createEventPool, hash, isPending, isConfirming, isSuccess, error, reset };
}

export interface LuckyDrawPoolParams {
  title: string;
  description: string;
  groupId: string;
  contributionAmount: string;
  minContribution: string;
  maxContribution: string;
  deadline: number;
}

export function useCreateLuckyDrawPool() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function createLuckyDrawPool(p: LuckyDrawPoolParams) {
    const fixedWei = p.contributionAmount ? parseEther(p.contributionAmount) : BigInt(0);
    const minWei   = p.minContribution    ? parseEther(p.minContribution)    : BigInt(0);
    const maxWei   = p.maxContribution    ? parseEther(p.maxContribution)    : BigInt(0);

    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "createLuckyDrawPool",
      args: [p.title, p.description, p.groupId, fixedWei, minWei, maxWei, BigInt(p.deadline)],
    });
  }

  return { createLuckyDrawPool, hash, isPending, isConfirming, isSuccess, error, reset };
}

/* ══════════════════════════════════════════════════════════
 *  WRITES — Contributions
 * ══════════════════════════════════════════════════════════ */

export function useContribute() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function contribute(poolId: bigint, amountWei: bigint) {
    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "contribute",
      args: [poolId],
      value: amountWei,
    });
  }

  return { contribute, hash, isPending, isConfirming, isSuccess, error, reset };
}

/* ══════════════════════════════════════════════════════════
 *  WRITES — Admin Actions
 * ══════════════════════════════════════════════════════════ */

/**
 * Picks a pseudo-random winner for a LuckyDraw pool.
 * Only the pool creator can call this.
 */
export function usePickWinner() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function pickWinner(poolId: bigint) {
    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "pickRandomWinner",
      args: [poolId],
    });
  }

  return { pickWinner, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Transfers all funds to the designated recipient (or override address).
 * EventPayout pools only — creator calls this.
 */
export function usePayoutToRecipient() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function payoutToRecipient(poolId: bigint, recipientOverride: `0x${string}` = "0x0000000000000000000000000000000000000000") {
    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "payoutToRecipient",
      args: [poolId, recipientOverride],
    });
  }

  return { payoutToRecipient, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Creator self-withdraw (sends to caller wallet).
 */
export function useWithdrawFunds() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function withdraw(poolId: bigint) {
    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "withdrawFunds",
      args: [poolId],
    });
  }

  return { withdraw, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Cancel a pool and refund all participants.
 */
export function useCancelPool() {
  const address = useContractAddress();
  const { writeContract, hash, isPending, isConfirming, isSuccess, error, reset } = useTxBundle();

  function cancelPool(poolId: bigint) {
    writeContract({
      address, abi: FLEXIBLE_POOL_ABI,
      functionName: "cancelPool",
      args: [poolId],
    });
  }

  return { cancelPool, hash, isPending, isConfirming, isSuccess, error, reset };
}
