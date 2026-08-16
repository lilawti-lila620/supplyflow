# User Onboarding Log — TEMPLATE

The hackathon requires **proof of 10+ real user wallet interactions**. This file is a
template — fill it in with real data as you onboard real people (or run the demo
with distinct testnet identities standing in for real stakeholders you've spoken to).
Do not submit this file with placeholder rows still in it.

For each interaction, capture:

- The person's role in the supply chain (in their own words is fine)
- The wallet address they used (Freighter or demo mode)
- What they did in the app (created a manifest, funded one, viewed a settlement)
- A transaction hash or timestamp you can point to as evidence
- Optionally, a screenshot of their wallet extension showing the interaction

## Log

| # | Name / handle | Role | Wallet address (short) | Action | Tx hash / evidence | Date |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

## How to generate real interactions quickly

1. Deploy the contract to Testnet (`./scripts/deploy.sh`) and set `VITE_CONTRACT_ID`.
2. Ask each pilot user to install [Freighter](https://www.freighter.app/) and fund a
   Testnet account via [friendbot](https://friendbot.stellar.org/).
3. Walk them through creating or funding a manifest for a real (or realistic) shipment
   relevant to their role.
4. Record the resulting transaction hash from the Freighter confirmation or from
   [Stellar Expert testnet explorer](https://stellar.expert/explorer/testnet).
