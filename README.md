# SupplyFlow

**Transparent multi-party payment distribution for supply chains, built on Stellar + Soroban.**

SupplyFlow replaces manual, centrally-controlled revenue splitting with a Soroban smart
contract that distributes a buyer's payment to every stakeholder in a supply chain —
farmers, cooperatives, transporters, processors, exporters — atomically, in one
transaction, according to shares that are locked in on-chain and independently
verifiable by anyone.

> Built for Level 4 — Production-Ready MVP.

---

## Table of contents

- [Problem](#problem)
- [How SupplyFlow solves it](#how-supplyflow-solves-it)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Smart contract](#smart-contract)
- [Frontend](#frontend)
- [User onboarding & pilot](#user-onboarding--pilot)
- [Feedback summary](#feedback-summary)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)

## Problem

Small producers sell through supply chains involving buyers, transporters, cooperatives,
exporters, and distributors. Buyers pay the full amount, but the split of that payment
across every participant is usually handled by a centralized accounting process or
manual bank transfers. Producers have no independent way to verify:

- that the agreed revenue-share percentages were actually followed,
- when they were paid and how much,
- that a payment wasn't partially settled or delayed by an intermediary.

This erodes trust and disproportionately hurts the smallest, least powerful
participants in the chain — the farmers and artisans actually producing the goods.

## How SupplyFlow solves it

Every buyer payment is routed through a **payment manifest**: a Soroban contract
record that locks in every stakeholder's wallet address and revenue share
(in basis points, summing to exactly 100%) *before* any money moves.

When the buyer funds the manifest, the contract:

1. Reads the locked-in stakeholder list.
2. Calculates each participant's exact share of the payment.
3. Transfers every share **in the same transaction** — if any transfer would fail,
   the entire distribution reverts. There is no partial settlement.
4. Records a permanent, queryable settlement record (amounts, timestamp, payouts).

Because the split logic and the settlement history both live on-chain, any
stakeholder — or an outside auditor — can verify their payout without trusting the
exporter's bookkeeping.

Product data (invoices, shipping documents, customer details) stays off-chain.
Only payment-critical data is recorded on-chain: participant addresses, share
percentages, transaction records, and settlement status.

## Architecture

```
┌──────────────────┐        create_manifest        ┌───────────────────────────┐
│   Cooperative /   │ ─────────────────────────────▶│                           │
│   Exporter (UI)   │                                │                           │
└──────────────────┘                                │                           │
                                                      │   Soroban contract:      │
┌──────────────────┐       fund_and_distribute       │   PaymentDistribution    │
│      Buyer        │ ─────────────────────────────▶│                           │
│   (Freighter)      │                                │  • locks stakeholder     │
└──────────────────┘                                │    shares (bps)          │
                                                      │  • atomic multi-transfer │
┌──────────────────┐       get_manifest /            │  • permanent settlement  │
│  Farmer / Coop /   │◀──────────────────────────────│    record                │
│  Transporter (UI)   │      get_settlement            │                           │
└──────────────────┘                                └───────────────────────────┘
                                                                  │
                                                         token.transfer() × N
                                                                  ▼
                                                   Stakeholder wallets (Stellar)
```

The **React frontend** talks to the contract through a thin client layer
(`frontend/src/lib/contract.js`) whose function signatures mirror the deployed
contract 1:1, so pointing the app at a live deployment is a one-line env var
change (`VITE_CONTRACT_ID`) with zero component changes.

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Rust, Soroban SDK 21, deployed to Stellar Testnet |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Wallet | Freighter API (with a labeled demo-wallet fallback for onboarding without an installed extension) |
| Charts / analytics | Recharts |
| Chain interaction | `@stellar/stellar-sdk`, `@stellar/freighter-api` |

## Repository structure

```
supplyflow/
├── contracts/
│   └── payment_distribution/     # Soroban smart contract (Rust)
│       ├── src/
│       │   ├── lib.rs            # Contract entry points
│       │   ├── types.rs          # Manifest / Stakeholder / Settlement types
│       │   ├── errors.rs         # Contract error codes
│       │   └── test.rs           # Unit tests
│       └── Cargo.toml
├── frontend/                     # React + Vite + Tailwind app
│   ├── src/
│   │   ├── pages/                # Landing, Dashboard, Create, Detail, Analytics, Feedback
│   │   ├── components/           # Nav, ManifestCard, SplitManifestDiagram, etc.
│   │   └── lib/                  # contract client, wallet layer, formatting
│   └── package.json
├── scripts/
│   ├── deploy.sh                 # Build, optimize, deploy, initialize the contract
│   └── example_flow.sh           # End-to-end CLI demo of the contract
├── docs/
│   └── ARCHITECTURE.md
└── Cargo.toml                    # Workspace root
```

## Getting started

### Prerequisites

- Node.js 18+
- Rust + `wasm32-unknown-unknown` target (for contract builds)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) (for contract deployment)
- [Freighter wallet extension](https://www.freighter.app/) (optional — the app falls
  back to a demo wallet if it isn't installed)

### Run the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs fully functional out of the box against a local ledger simulation that
enforces the same rules as the deployed contract (atomic splits, 100% share
requirement, no double-settlement) — useful for onboarding pilot users and demoing
before every environment has a funded testnet wallet.

### Deploy the contract to Testnet

```bash
stellar keys generate admin --network testnet --fund
./scripts/deploy.sh admin
```

Copy the printed contract ID into `frontend/.env` as `VITE_CONTRACT_ID` to point the
UI at your live deployment.

## Smart contract

See [`contracts/payment_distribution/src/lib.rs`](contracts/payment_distribution/src/lib.rs).

Key entry points:

| Function | Description |
|---|---|
| `initialize(admin)` | One-time setup. Admin can pause the contract but can never touch funds or override a manifest's locked-in shares. |
| `create_manifest(creator, buyer, token, label, stakeholders)` | Locks in the stakeholder list and shares (must sum to exactly 10,000 bps). Returns the manifest ID. |
| `fund_and_distribute(buyer, manifest_id, amount)` | Atomically splits `amount` across every stakeholder per their locked-in share and records the settlement. |
| `cancel_manifest(creator, manifest_id)` | Cancels an unfunded manifest. |
| `get_manifest` / `get_settlement` / `list_manifests_for` | Read-only queries — anyone can verify a distribution without trusting the platform. |

Run the test suite (from an environment with a current Rust toolchain):

```bash
cd contracts/payment_distribution
cargo test
```

Tests cover: full lifecycle atomic splitting, share-sum validation, rounding-remainder
reconciliation (payouts always sum exactly to the funded amount), and cancellation
guards.

## Frontend

- **Landing** — product overview and the signature "split manifest" visual.
- **Dashboard** — live manifest list with status filters and aggregate stats.
- **Create Manifest** — stakeholder form with live share validation and a real-time
  preview of the payment split diagram.
- **Manifest Detail** — fund & distribute flow, settlement receipt, per-stakeholder
  payout breakdown.
- **Analytics** — cumulative value distributed, settlement status breakdown, and
  value distributed by stakeholder role.
- **Feedback** — pilot user feedback collection and display.

Every page includes loading states, empty states, and error states with retry, and
the layout is responsive down to mobile.

## User onboarding & pilot

The hackathon requires proof of 10+ real wallet interactions. This repo does **not**
fabricate that evidence — you need to generate it yourself by having real people
(or your own set of distinct testnet identities acting on behalf of real
stakeholders) create/fund manifests through the running app. Use
[`docs/USER_ONBOARDING.md`](docs/USER_ONBOARDING.md) as a template to log each
interaction (wallet address, action, transaction hash, timestamp) as you collect it.

## Feedback summary

Structured feedback is collected in-app at `/feedback`. Once you've gathered real
responses from onboarded users, summarize them in
[`docs/FEEDBACK_SUMMARY.md`](docs/FEEDBACK_SUMMARY.md) (a template is included).

## Screenshots

See [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md) for the checklist and where to drop
captures for submission (product UI, mobile responsive views, analytics dashboard).

## Roadmap

- Multi-token support beyond the native asset (USDC via Circle's Stellar rails)
- Recurring manifest templates for repeat shipments
- Dispute-flagging (off-chain evidence hash pinned on-chain, no fund freeze)
- Mobile app wrapper for low-connectivity regions
