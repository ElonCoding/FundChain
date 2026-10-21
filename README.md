<div align="center">

# ⛓️ FundChain

### Enterprise Web3 Messaging & Community Pooling dApp

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Avalanche](https://img.shields.io/badge/Avalanche-C--Chain-E84142?style=for-the-badge&logo=avalanche)](https://www.avax.network/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-FFF100?style=for-the-badge&logo=hardhat)](https://hardhat.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-3.7-1C1E27?style=for-the-badge)](https://wagmi.sh/)

**FundChain** is a full-stack, production-grade dApp that seamlessly combines encrypted Web3 messaging with on-chain community fund pooling — deployed on the Avalanche C-Chain. Users connect their wallets, chat in real-time with their contacts, and participate in transparent, trustless funding pools (event-based or lucky-draw style) governed entirely by smart contracts.

[Features](#-features) &bull; [Architecture](#%EF%B8%8F-architecture) &bull; [Quick Start](#-quick-start) &bull; [Smart Contracts](#-smart-contracts) &bull; [Environment Variables](#-environment-variables)

</div>

---

## ✨ Features

| Category | Capability |
|---|---|
| 💬 **Messaging** | Real-time 1-on-1 and group chat powered by Supabase Realtime subscriptions |
| 🔗 **Web3 Identity** | Wallet-first authentication via WalletConnect v2 and MetaMask |
| 💰 **Fund Pools** | On-chain community pools — event-based and lucky-draw mechanics |
| 📞 **Contact Management** | Add contacts by wallet address with live online presence indicators |
| 🔔 **Live Notifications** | Instant in-app notifications for messages and pool events |
| 🎨 **UI/UX** | Full dark-mode, glassmorphism design with smooth micro-animations |
| 🔒 **Security** | Supabase Row Level Security (RLS) enforced on every table |
| 📱 **Phone Auth** | SMS OTP onboarding via Supabase Phone Auth |
| 🔍 **Contract Verified** | Deployed and verifiable on Snowtrace (Fuji Testnet) |

---

## 🏗️ Architecture

```
fundchain-app/
├── src/                            # Next.js 16 App Router — Frontend
│   ├── app/                        # Root layout, global CSS, main page
│   ├── components/
│   │   ├── chat/                   # ChatList, ChatWindow, MessageBubble
│   │   ├── contacts/               # ContactsView, AddContact dialog
│   │   ├── funds/                  # FundsDashboard, PoolCard, CreatePool
│   │   ├── layout/                 # SidebarNav, TopBar
│   │   ├── onboarding/             # OnboardingScreen (wallet + OTP flow)
│   │   ├── settings/               # SettingsView, profile editor
│   │   ├── ui/                     # Reusable atoms (Button, Modal, CallModal)
│   │   └── wallet/                 # ConnectButton, WalletCard
│   ├── contexts/                   # React context providers
│   ├── hooks/                      # useSupabaseChat, useConversations, etc.
│   ├── lib/
│   │   ├── supabase.ts             # Typed Supabase client + all DB helpers
│   │   ├── contracts/              # ABI files + chain address mapping
│   │   ├── database.types.ts       # Auto-generated Supabase DB types
│   │   ├── types.ts                # Shared TypeScript types
│   │   └── utils.ts                # Utility helpers
│   └── providers/                  # Wagmi + TanStack Query root providers
│
├── contracts/                      # Hardhat — Smart Contracts
│   ├── FundPool.sol                # Core pooling contract (event + lucky draw)
│   ├── FlexibleCommunityPool.sol   # Extended pool with Chainlink VRF
│   ├── scripts/
│   │   └── deploy.ts               # Deployment script (Fuji + Mainnet)
│   ├── test/
│   │   └── FundPool.test.ts        # Hardhat/Mocha full test suite
│   ├── hardhat.config.ts           # Network config (Fuji, Avalanche Mainnet)
│   └── package.json                # Contracts-only dependencies
│
├── supabase-schema.sql             # STAR Run this in Supabase SQL Editor first!
├── .env.example                    # Template for all required env variables
├── package.json                    # Frontend dependencies
└── next.config.ts                  # Next.js configuration
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.4 | React framework with App Router |
| [React](https://react.dev/) | 19.3 | UI library |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first styling |
| [Wagmi](https://wagmi.sh/) | 3.7 | React hooks for Ethereum/EVM |
| [Viem](https://viem.sh/) | 2.57 | Low-level EVM primitives |
| [Ethers.js](https://ethers.org/) | 6.17 | Contract interaction helpers |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2.118 | Real-time DB + Auth client |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server-state management |
| TypeScript | 5.x | Full type safety |

### Smart Contracts

| Technology | Version | Purpose |
|---|---|---|
| [Solidity](https://soliditylang.org/) | 0.8.20 | Smart contract language |
| [Hardhat](https://hardhat.org/) | 2.22 | Compile, test, deploy framework |
| [Chainlink Contracts](https://github.com/smartcontractkit/chainlink) | 1.2 | VRF for lucky-draw randomness |
| [Avalanche C-Chain](https://www.avax.network/) | — | Target EVM-compatible network |

### Backend / Infrastructure

| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL + Realtime subscriptions + Phone Auth |
| [WalletConnect v2](https://walletconnect.com/) | Multi-wallet connection protocol |
| [Snowtrace](https://snowtrace.io/) | Avalanche block explorer + contract verification |

---

## 🚀 Quick Start

### Prerequisites

Make sure the following are installed:

- **Node.js** >= 18.x &mdash; [nodejs.org](https://nodejs.org/)
- **npm** >= 9.x (bundled with Node.js)
- **Git**
- **MetaMask** browser extension (or any WalletConnect-compatible wallet)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/fundchain-app.git
cd fundchain-app
```

---

### Step 2 — Set Up Supabase (Required for Chat)

> **JUDGES — THIS IS THE KEY STEP FOR REAL-TIME CHAT:**
> The messaging, contacts, and user profile features are entirely powered by Supabase.
> You MUST paste your Supabase `URL` and `anon key` into `.env.local` (Step 3) for these features to work.
> The dApp will load without it, but chat/contacts will be disabled.

1. Go to [supabase.com](https://supabase.com/) and create a **free account**.
2. Click **New Project** (any region, any password).
3. Once provisioned, open **SQL Editor** in the left sidebar.
4. Click **New Query**, paste the **entire contents** of [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**.
   - This creates the `profiles`, `conversations`, `messages`, and `participants` tables with all indexes and RLS policies.
5. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 3 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and fill in:

```env
# ─── WalletConnect ───────────────────────────────────────────────────────────
# Get your free Project ID at: https://cloud.walletconnect.com
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id_here

# ─── Supabase ────────────────────────────────────────────────────────────────
# JUDGES: Paste YOUR Supabase project credentials below to enable real-time chat
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ─── Contract Addresses ───────────────────────────────────────────────────────
# Pre-filled after running the deploy script (optional — see Smart Contracts section)
NEXT_PUBLIC_FUNDPOOL_FUJI=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_FUNDPOOL_MAINNET=0x0000000000000000000000000000000000000000
```

> A WalletConnect Project ID is required for the multi-wallet connect modal.
> Get one free (30 seconds) at [cloud.walletconnect.com](https://cloud.walletconnect.com).

---

### Step 4 — Install Frontend Dependencies

```bash
# Run from the project root — fundchain-app/
npm install
```

---

### Step 5 — Start the Dev Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. You should see the FundChain onboarding screen.

---

## 📜 Smart Contracts

The Hardhat project is in the `contracts/` directory and is a self-contained npm workspace.

### Install Contract Dependencies

```bash
cd contracts
npm install
```

### Compile

```bash
npm run compile
# or: npx hardhat compile
```

### Run Tests

```bash
npm test
# or: npx hardhat test
```

Expected output: all tests in `test/FundPool.test.ts` should pass.

### Deploy to Fuji Testnet (Optional)

> The contracts are already deployed — judges do NOT need to redeploy.
> Follow these steps only if you want a fresh personal deployment.

1. Create `contracts/.env`:

```env
DEPLOYER_PRIVATE_KEY=0x<your_deployer_wallet_private_key>
SNOWTRACE_API_KEY=<your_snowtrace_api_key_for_verification>
```

2. Fund your deployer wallet with Fuji AVAX from the [Avalanche Faucet](https://faucet.avax.network/).

3. Deploy:

```bash
npm run deploy:fuji
```

4. The script will print the deployed contract address. Copy it into your root `.env.local`:

```env
NEXT_PUBLIC_FUNDPOOL_FUJI=0x<printed_address>
```

5. Optionally verify on Snowtrace:

```bash
npm run verify:fuji -- <deployed_address>
```

---

## 🔑 Environment Variables — Full Reference

| Variable | Required | Where to Get It |
|---|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | Yes | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for chat) | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for chat) | Supabase → Project Settings → API |
| `NEXT_PUBLIC_FUNDPOOL_FUJI` | Optional | Output of `npm run deploy:fuji` |
| `NEXT_PUBLIC_FUNDPOOL_MAINNET` | Optional | Output of `npm run deploy:mainnet` |
| `DEPLOYER_PRIVATE_KEY` | Contracts only | Your deployer wallet private key |
| `SNOWTRACE_API_KEY` | Contracts only | [snowtrace.io/myapikey](https://snowtrace.io/myapikey) |

---

## 🌐 Network Information

| Network | Chain ID | RPC URL | Explorer |
|---|---|---|---|
| Avalanche Fuji Testnet | 43113 | `https://api.avax-test.network/ext/bc/C/rpc` | [testnet.snowtrace.io](https://testnet.snowtrace.io) |
| Avalanche C-Chain Mainnet | 43114 | `https://api.avax.network/ext/bc/C/rpc` | [snowtrace.io](https://snowtrace.io) |

---

## 📁 Key Files for Judges

| File | Purpose |
|---|---|
| `supabase-schema.sql` | Run this in Supabase SQL Editor to bootstrap the full database |
| `.env.example` | Template for all required environment variables |
| `contracts/FundPool.sol` | Core on-chain pooling smart contract |
| `contracts/FlexibleCommunityPool.sol` | Extended pool with Chainlink VRF lucky-draw |
| `contracts/test/FundPool.test.ts` | Full automated Hardhat test suite |
| `src/lib/supabase.ts` | All Supabase DB + Auth helper functions |
| `src/providers/` | Wagmi + TanStack Query root provider configuration |

---

## 🧪 Judge Testing Checklist

After completing setup, verify each feature works end-to-end:

- [ ] **Wallet Connect** — Click "Connect Wallet", select MetaMask or WalletConnect option
- [ ] **Onboarding** — Enter a display name and complete SMS OTP or wallet-only profile setup
- [ ] **Real-time Chat** — Open two browser windows with different wallet addresses, send messages
- [ ] **Contacts** — Search and add a contact by wallet address
- [ ] **Fund Pools** — Browse pools, create a new pool, contribute AVAX
- [ ] **Settings** — Update display name and profile preferences
- [ ] **Smart Contracts** — Run `npm test` inside `contracts/` to verify all unit tests pass

---

## 📄 License

This project is submitted as part of a hackathon/academic evaluation.
All rights reserved by the authors.

---

<div align="center">

Built with Next.js &bull; Wagmi &bull; Supabase &bull; Hardhat &bull; Avalanche

</div>
