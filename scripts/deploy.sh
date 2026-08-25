#!/bin/bash
set -e

echo "==> Building contracts..."
stellar contract build

# Ensure deployer keys exist
if ! stellar keys ls | grep -q "deployer"; then
    echo "Generating deployer keys..."
    stellar keys generate deployer --network testnet --fund
fi

DEPLOYER="deployer"
WASM_PATH="target/wasm32v1-none/release/supplyflow_payment_distribution.wasm"

echo "==> Deploying Payment Distribution Contract..."
CONTRACT_ID=$(stellar contract deploy --wasm "$WASM_PATH" --source $DEPLOYER --network testnet)
echo "Payment Distribution Contract deployed at: $CONTRACT_ID"

echo "==> Initializing contract..."
ADMIN_ADDRESS=$(stellar keys address "$DEPLOYER")
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$DEPLOYER" \
  --network testnet \
  -- initialize --admin "$ADMIN_ADDRESS"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " PAYMENT_DISTRIBUTION_CONTRACT_ID: $CONTRACT_ID"
echo "=================================================="
