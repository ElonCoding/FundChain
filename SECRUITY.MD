# Security Policy

## Supported Versions

Critical security patches released only for active versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**Do not file public issues for security vulnerabilities.**

Report security vulnerabilities privately via:
- **Email**: `security@fundchain.app` (or contact repository maintainers)
- **GitHub Security Advisory**: [Report Vulnerability](https://github.com/ElonCoding/FundChain/security/advisories/new)

### Include in Report:
1. Vulnerability description & impact vector.
2. Step-by-step reproduction steps / Proof of Concept (PoC).
3. Affected components:
   - Smart contracts (Avalanche C-Chain / Solidity)
   - Next.js Web App / Client hooks
   - Supabase RLS / Realtime messaging channels
4. Recommended remediation (if known).

---

## Response Timeline

- **Initial acknowledgment**: Within 48 hours.
- **Triage & severity rating**: Within 5 business days.
- **Fix deployment & public disclosure**: Coordinated timeline following mitigation verification.

---

## Scope & Critical Areas

### In Scope
- **Smart Contracts**: Reentrancy, access control bypass, funds draining, math overflow/underflow, flash-loan vulnerabilities.
- **Supabase Backend**: Row Level Security (RLS) bypass, unauthorized DB read/write, token leakage.
- **Frontend / Client**: XSS, CSRF, wallet connection hijack, secret exfiltration (`NEXT_PUBLIC_*` misuse).

### Out of Scope
- Denial of Service attacks requiring massive botnet volume (DDoS).
- Attacks requiring physical access to user devices or compromised private keys / seed phrases.
- Third-party dependency vulnerabilities without direct exploitability in FundChain.
- Testnet faucet spamming or non-impactful gas griefing.

---

## Web3 & Key Hygiene Guidelines

- **Never commit `.env` or `.env.local` containing private keys or secret service tokens.**
- Use burner wallets for Fuji testnet testing.
- Verify contract addresses and chain IDs before signing transactions.
