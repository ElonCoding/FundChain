# FundChain API & Hook Reference

- `useAllPools()`: Fetches all on-chain pools in batch multicall.
- `usePool(id)`: Individual pool state reader.
- `useContributions(offset, limit)`: Ledger audit trail pagination.
- `useCreateEventPool()`: Mutates state to deploy an event collection.
- `useCreateLuckyDrawPool()`: Deploys a lottery prize pool.
