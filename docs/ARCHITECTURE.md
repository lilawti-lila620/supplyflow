# Architecture

## Design goals

1. **Atomicity over trust.** The contract either pays every stakeholder their exact
   agreed share, or nothing happens. This is enforced structurally (a single Soroban
   invocation performing N token transfers inside one transaction), not by policy.
2. **Immutable, verifiable rules.** Stakeholder shares are fixed at manifest creation
   and cannot be changed by the admin, the creator, or the platform after the fact.
3. **Minimal on-chain surface.** Only payment-critical data (addresses, shares,
   settlement records) touches the ledger. Invoices, shipping documents, and buyer/
   seller identity details stay off-chain.

## Data model

```
Manifest {
  id: u64
  creator: Address        // who defined the split (exporter / cooperative)
  buyer: Address           // who will fund it
  token: Address           // Stellar Asset Contract used for payment
  label: String
  stakeholders: Vec<Stakeholder>
  status: Open | Settled | Cancelled
  created_at: u64
}

Stakeholder {
  address: Address
  role: String              // "Farmer Collective", "Transporter", ...
  share_bps: u32             // basis points, all shares sum to 10_000
}

Settlement {
  manifest_id: u64
  total_amount: i128
  payouts: Vec<PayoutRecord> // per-stakeholder amount actually transferred
  settled_at: u64
}
```

## Distribution algorithm

Given a funded `amount` and `N` stakeholders with basis-point shares `b_1..b_N`
(summing to 10,000):

```
for i in 0..N-1:
    payout[i] = floor(amount * b_i / 10_000)

payout[N-1] = amount - sum(payout[0..N-1])   // remainder absorbed by the last stakeholder
```

This guarantees `sum(payout) == amount` exactly, with no dust left in the contract
and no rounding drift across repeated settlements — verified by the
`rounding_remainder_reconciles_exactly` test.

## Failure modes and how they're handled

| Scenario | Behavior |
|---|---|
| Shares don't sum to 10,000 bps | `create_manifest` rejects with `SharesMustSumTo10000` before any funds move |
| Duplicate stakeholder address | Rejected at creation (`DuplicateStakeholder`) |
| Buyer tries to fund twice | Second call rejected (`ManifestAlreadySettled`) |
| Non-buyer tries to fund | Rejected (`NotAuthorized`) — `buyer.require_auth()` plus an explicit buyer match |
| One stakeholder's transfer would fail (e.g. frozen trustline) | Entire transaction reverts — no partial payout |
| Emergency stop | Admin can `set_paused(true)`, blocking new manifests and fundings; admin can never redirect or withhold funds already in flight, since token transfers are always to the stakeholder addresses locked in at creation |

## Frontend ↔ contract boundary

`frontend/src/lib/contract.js` exposes exactly the functions the Soroban contract
exposes, with matching argument and return shapes:

```
listManifests()            -> Manifest[]
getManifest(id)             -> Manifest
createManifest({...})       -> u64 (manifest id)
fundAndDistribute({...})    -> Settlement
cancelManifest(id)          -> void
```

Until `VITE_CONTRACT_ID` is set, this layer is served by a local ledger simulation
(`localStorage`-backed) that enforces the *same* invariants as the Rust contract
(share-sum validation, atomic split with the same rounding rule, no double-settlement).
This lets the product be fully evaluated and used for onboarding before every
environment has a funded Testnet identity, and swapping in the live contract requires
no UI changes — only wiring the same function bodies to `@stellar/stellar-sdk`
`Contract` calls signed via Freighter.
