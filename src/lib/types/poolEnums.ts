export enum PoolTypeEnum {
  EventPayout = 0,
  LuckyDraw = 1,
}

export enum PoolStatusEnum {
  Active = 0,
  Completed = 1,
  Cancelled = 2,
  Withdrawn = 3,
}

export type PoolFilterType = "all" | "active" | "completed" | "cancelled";
