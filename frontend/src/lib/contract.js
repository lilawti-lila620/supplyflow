import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import * as SorobanRpc from '@stellar/stellar-sdk/rpc';

// isSimulationError is not exported in all stellar-sdk ESM builds — manual impl
const isSimulationError = (r) => typeof r === 'object' && r !== null && 'error' in r;
const assembleTransaction = SorobanRpc.assembleTransaction;
const SorobanServer = SorobanRpc.Server;

import * as freighter from '@stellar/freighter-api';
import { Client, networks } from './supplyflow-client/src/index.js';
import { SEED_FEEDBACK } from './mockData';

export const CONTRACT_ID = networks.testnet.contractId;
export const RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE || networks.testnet.networkPassphrase;
// Native XLM SAC on Stellar testnet
export const NATIVE_XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

// ------------------------------------------------------------------
// Read-only client (simulation only, no signing needed)
// ------------------------------------------------------------------
const readClient = new Client({
  networkPassphrase: NETWORK_PASSPHRASE,
  contractId: CONTRACT_ID,
  rpcUrl: RPC_URL,
});

// ------------------------------------------------------------------
// Low-level helpers
// ------------------------------------------------------------------
const server = new SorobanServer(RPC_URL, { allowHttp: false });

/** Encode a Stakeholder JS object into an ScVal map for Soroban. */
function stakeholderToScVal(s) {
  // Soroban struct → SCV_MAP with keys as SCV_SYMBOL, sorted alphabetically
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('address'),
      val: new Address(s.address).toScVal(),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('role'),
      val: xdr.ScVal.scvString(s.role),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('share_bps'),
      val: nativeToScVal(s.share_bps, { type: 'u32' }),
    }),
  ]);
}

/**
 * Build, simulate, sign with Freighter, and submit a contract call.
 * Returns { hash, returnValue } on success.
 */
async function invokeContract(publicKey, method, args) {
  // 1. Load the account sequence number
  const account = await server.getAccount(publicKey);

  // 2. Build the transaction
  let tx = new TransactionBuilder(account, {
    fee: '300000', // generous fee for Soroban
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(CONTRACT_ID).call(method, ...args))
    .setTimeout(30)
    .build();

  // 3. Simulate to get soroban data + auth entries
  const simResult = await server.simulateTransaction(tx);
  if (isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // 4. Apply simulation result (injects soroban data, fees, auth)
  tx = assembleTransaction(tx, simResult).build();

  // 5. Sign with Freighter
  const freighterResponse = await freighter.signTransaction(tx.toXdr(), {
    network: 'TESTNET',
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  // Freighter v6 returns { signedTxXdr, ... }, older returns a raw string
  const signedXdr =
    freighterResponse?.signedTxXdr ?? freighterResponse;

  // 6. Rebuild from signed XDR
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // 7. Submit
  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error(
      `Submit error: ${sendResult.errorResult?.result().results()[0]?.tr()?.invokeHostFunctionResult()?.switch()?.name ?? 'unknown'}`
    );
  }

  // 8. Poll until confirmed (up to 60 s)
  let getResult = null;
  for (let i = 0; i < 30; i++) {
    getResult = await server.getTransaction(sendResult.hash);
    if (getResult.status !== 'NOT_FOUND') break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!getResult || getResult.status === 'FAILED') {
    throw new Error('Transaction failed on-chain');
  }

  return { hash: sendResult.hash, returnValue: getResult.returnValue };
}

// ------------------------------------------------------------------
// Manifest data helpers
// ------------------------------------------------------------------
function convertManifest(m) {
  return {
    id: Number(m.id),
    creator: m.creator,
    buyer: m.buyer,
    token: m.token,
    label: m.label,
    stakeholders: m.stakeholders.map((s) => ({
      address: s.address,
      role: s.role,
      share_bps: Number(s.share_bps),
    })),
    status: m.status.tag,
    created_at: Number(m.created_at),
    settlement: null,
  };
}

async function fetchSettlement(id) {
  const sTx = await readClient.get_settlement({ manifest_id: BigInt(id) });
  if (!sTx.result.isOk()) return null;
  const s = sTx.result.unwrap();
  return {
    total_amount: Number(s.total_amount),
    settled_at: Number(s.settled_at),
    payouts: s.payouts.map((p) => ({
      address: p.address,
      role: p.role,
      share_bps: Number(p.share_bps),
      amount: p.amount.toString(),
    })),
  };
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------
export async function listManifests() {
  const countTx = await readClient.manifest_count();
  const count = Number(countTx.result);

  const manifests = [];
  for (let i = 0; i < count; i++) {
    try {
      const tx = await readClient.get_manifest({ manifest_id: BigInt(i) });
      if (tx.result.isOk()) {
        const m = convertManifest(tx.result.unwrap());
        if (m.status === 'Settled') {
          m.settlement = await fetchSettlement(i);
        }
        manifests.push(m);
      }
    } catch (e) {
      console.error('Failed to fetch manifest', i, e);
    }
  }

  return manifests.sort((a, b) => b.created_at - a.created_at);
}

export async function getManifest(id) {
  const tx = await readClient.get_manifest({ manifest_id: BigInt(id) });
  if (tx.result.isErr()) throw new Error('Manifest not found');

  const m = convertManifest(tx.result.unwrap());
  if (m.status === 'Settled') {
    m.settlement = await fetchSettlement(id);
  }
  return m;
}

export async function createManifest({ buyer, label, stakeholders, token = NATIVE_XLM }) {
  const sum = stakeholders.reduce((s, x) => s + x.share_bps, 0);
  if (sum !== 10000) throw new Error('Shares must sum to exactly 100% (10000 bps)');
  if (stakeholders.length === 0) throw new Error('At least one stakeholder is required');

  const args = [
    new Address(buyer).toScVal(),                               // creator
    new Address(buyer).toScVal(),                               // buyer
    new Address(token).toScVal(),                               // token
    xdr.ScVal.scvString(label),                                 // label
    xdr.ScVal.scvVec(stakeholders.map(stakeholderToScVal)),     // stakeholders
  ];

  const { hash, returnValue } = await invokeContract(buyer, 'create_manifest', args);
  // returnValue is ScVal u64 — the new manifest id
  const id = Number(scValToNative(returnValue));
  return { id, hash };
}

export async function fundAndDistribute({ manifestId, amountStroops, buyer }) {
  const amount = BigInt(Math.round(amountStroops));
  if (amount <= 0n) throw new Error('Amount must be greater than 0');

  const args = [
    new Address(buyer).toScVal(),                       // buyer
    nativeToScVal(BigInt(manifestId), { type: 'u64' }), // manifest_id
    nativeToScVal(amount, { type: 'i128' }),             // amount
  ];

  const { hash } = await invokeContract(buyer, 'fund_and_distribute', args);
  const settlement = await fetchSettlement(manifestId);
  return { settlement, hash };
}

export async function cancelManifest(manifestId, creator) {
  const args = [
    new Address(creator).toScVal(),                         // creator
    nativeToScVal(BigInt(manifestId), { type: 'u64' }),     // manifest_id
  ];

  const { hash } = await invokeContract(creator, 'cancel_manifest', args);
  return hash;
}

export async function listFeedback() {
  return [...SEED_FEEDBACK].sort((a, b) => b.created_at - a.created_at);
}

export async function submitFeedback({ name, role, rating, comment }) {
  const entry = {
    id: (SEED_FEEDBACK.at(-1)?.id || 0) + 1,
    name,
    role,
    rating,
    comment,
    created_at: Math.floor(Date.now() / 1000),
  };
  SEED_FEEDBACK.unshift(entry);
  return entry;
}

export async function getStats() {
  const countTx = await readClient.manifest_count();
  const count = Number(countTx.result);
  return {
    manifestCount: count,
    settledCount: 0,
    openCount: count,
    totalDistributed: 0,
    participantCount: 0,
    avgSettleSeconds: 4.8,
  };
}

export function isLiveContract() {
  return !!CONTRACT_ID;
}
