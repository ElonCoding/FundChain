# FundChain Architecture

## Overview
FundChain is a decentralized funding and real-time social coordination platform built on Avalanche Fuji C-Chain and Supabase.

### Core Components
1. **Smart Contracts (Solidity)**:
   - FlexibleCommunityPool: Manages Event Payout and Lucky Draw pools.
   - Transparent deposit, goal tracking, and immutable audit logs.
2. **Frontend (Next.js 16 App Router & Wagmi v2)**:
   - Reactive on-chain state querying via Multicall.
   - Inter font typography, custom design system matching FundChain Brand Kit.
3. **Database & Realtime (Supabase)**:
   - Ephemeral profiles, group and direct messaging channels with instant broadcast.
