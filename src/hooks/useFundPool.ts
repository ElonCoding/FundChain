"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseEther } from "viem";
import { FUND_POOL_ABI } from "@/lib/contracts/abi";
import { CONTRACT_ADDRESSES, avalancheFuji } from "@/lib/contracts/chains";
import type { Pool } from "@/lib/types";

/* ──────────────────────────────────────────────────────────
 *  Resolve the deployed contract address for current chain
 * ────────────────────────────────────────────────────────── */

function useFundPoolAddress(): `0x${string}` {
  // Default to Fuji for now; can be dynamic based on chainId
  return CONTRACT_ADDRESSES.fundPool[avalancheFuji.id];
}

/* ──────────────────────────────────────────────────────────
 *  Read: Get pool count
 * ────────────────────────────────────────────────────────── */

export function usePoolCount() {
  const address = useFundPoolAddress();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "getPoolCount",
  });
}

/* ──────────────────────────────────────────────────────────
 *  Read: Get a single pool by ID
 * ────────────────────────────────────────────────────────── */

export function usePool(poolId: bigint) {
  const address = useFundPoolAddress();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "getPool",
    args: [poolId],
  });
}

/* ──────────────────────────────────────────────────────────
 *  Read: Get pool participants
 * ────────────────────────────────────────────────────────── */

export function usePoolParticipants(poolId: bigint) {
  const address = useFundPoolAddress();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "getPoolParticipants",
    args: [poolId],
  });
}

/* ──────────────────────────────────────────────────────────
 *  Read: Check if current user contributed to a pool
 * ────────────────────────────────────────────────────────── */

export function useIsParticipant(poolId: bigint) {
  const address = useFundPoolAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "isParticipant",
    args: [poolId, userAddress!],
    query: { enabled: !!userAddress },
  });
}

/* ──────────────────────────────────────────────────────────
 *  Read: User's created pools
 * ────────────────────────────────────────────────────────── */

export function useUserCreatedPools() {
  const address = useFundPoolAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "getUserCreatedPools",
    args: [userAddress!],
    query: { enabled: !!userAddress },
  });
}

/* ──────────────────────────────────────────────────────────
 *  Read: User's contributed pools
 * ────────────────────────────────────────────────────────── */

export function useUserContributedPools() {
  const address = useFundPoolAddress();
  const { address: userAddress } = useAccount();
  return useReadContract({
    address,
    abi: FUND_POOL_ABI,
    functionName: "getUserContributedPools",
    args: [userAddress!],
    query: { enabled: !!userAddress },
  });
}

/* ──────────────────────────────────────────────────────────
 *  Write: Create a new pool
 * ────────────────────────────────────────────────────────── */

export function useCreatePool() {
  const address = useFundPoolAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function createPool(params: {
    title: string;
    description: string;
    groupId: string;
    contributionAmount: string; // in AVAX (e.g. "0.1")
    goalAmount: string; // in AVAX (e.g. "5.0"), "0" for unlimited
    deadline: number; // unix timestamp, 0 for none
  }) {
    writeContract({
      address,
      abi: FUND_POOL_ABI,
      functionName: "createPool",
      args: [
        params.title,
        params.description,
        params.groupId,
        parseEther(params.contributionAmount),
        parseEther(params.goalAmount),
        BigInt(params.deadline),
      ],
    });
  }

  return { createPool, hash, isPending, isConfirming, isSuccess, error };
}

/* ──────────────────────────────────────────────────────────
 *  Write: Contribute to a pool
 * ────────────────────────────────────────────────────────── */

export function useContribute() {
  const address = useFundPoolAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function contribute(poolId: bigint, amountWei: bigint) {
    writeContract({
      address,
      abi: FUND_POOL_ABI,
      functionName: "contribute",
      args: [poolId],
      value: amountWei,
    });
  }

  return { contribute, hash, isPending, isConfirming, isSuccess, error };
}

/* ──────────────────────────────────────────────────────────
 *  Write: Withdraw funds (creator only)
 * ────────────────────────────────────────────────────────── */

export function useWithdrawFunds() {
  const address = useFundPoolAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function withdraw(poolId: bigint) {
    writeContract({
      address,
      abi: FUND_POOL_ABI,
      functionName: "withdrawFunds",
      args: [poolId],
    });
  }

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

/* ──────────────────────────────────────────────────────────
 *  Write: Cancel pool + refund (creator only)
 * ────────────────────────────────────────────────────────── */

export function useCancelPool() {
  const address = useFundPoolAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function cancelPool(poolId: bigint) {
    writeContract({
      address,
      abi: FUND_POOL_ABI,
      functionName: "cancelPool",
      args: [poolId],
    });
  }

  return { cancelPool, hash, isPending, isConfirming, isSuccess, error };
}
