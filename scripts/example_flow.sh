#!/usr/bin/env bash
# Example: create a manifest and fund it, exercising the full contract flow
# from the command line against a deployed testnet contract. Useful for
# generating real proof-of-interaction transactions during user onboarding.
#
# Usage:
#   ./scripts/example_flow.sh <contract-id> <buyer-identity> <stakeholder-identity>

set -euo pipefail

CONTRACT_ID="${1:?Usage: example_flow.sh <contract-id> <buyer-identity> <stakeholder-identity>}"
BUYER="${2:?Missing buyer identity}"
STAKEHOLDER="${3:?Missing stakeholder identity}"
NETWORK="testnet"

BUYER_ADDR=$(stellar keys address "$BUYER")
STAKEHOLDER_ADDR=$(stellar keys address "$STAKEHOLDER")

# Use the native XLM SAC on testnet for the payment token.
TOKEN_ID=$(stellar contract id asset --asset native --network "$NETWORK")

echo "==> Creating manifest (buyer=$BUYER_ADDR, stakeholder=$STAKEHOLDER_ADDR)"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$BUYER" \
  --network "$NETWORK" \
  -- create_manifest \
  --creator "$BUYER_ADDR" \
  --buyer "$BUYER_ADDR" \
  --token "$TOKEN_ID" \
  --label "Demo shipment" \
  --stakeholders "[{\"address\":\"$STAKEHOLDER_ADDR\",\"role\":\"Farmer\",\"share_bps\":10000}]"

echo "==> Funding manifest #0 with 10 XLM (100000000 stroops)"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$BUYER" \
  --network "$NETWORK" \
  -- fund_and_distribute \
  --buyer "$BUYER_ADDR" \
  --manifest_id 0 \
  --amount 100000000

echo "==> Settlement:"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$BUYER" \
  --network "$NETWORK" \
  -- get_settlement --manifest_id 0
