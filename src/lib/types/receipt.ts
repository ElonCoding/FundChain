export interface TxReceiptMetadata {
  hash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: "success" | "reverted";
  timestamp: number;
}
