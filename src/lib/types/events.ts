export interface PoolCreatedEventPayload {
  poolId: bigint;
  creator: string;
  poolType: number;
  title: string;
  contributionAmount: bigint;
  groupId: string;
}

export interface ContributionMadeEventPayload {
  poolId: bigint;
  contributor: string;
  amount: bigint;
  newTotal: bigint;
}

export interface WinnerPickedEventPayload {
  poolId: bigint;
  winner: string;
  prizeAmount: bigint;
}
