import { Client, networks, Errors } from './supplyflow-client/src/index.js';
import * as freighter from '@stellar/freighter-api';
import { SEED_FEEDBACK } from './mockData';

export const CONTRACT_ID = networks.testnet.contractId;
export const RPC_URL = import.meta.env.VITE_SOROBAN_RPC || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || networks.testnet.networkPassphrase;
export const NATIVE_XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

function getClient(publicKey) {
  return new Client({
    networkPassphrase: NETWORK_PASSPHRASE,
    contractId: CONTRACT_ID,
    rpcUrl: RPC_URL,
    publicKey: publicKey || undefined,
  });
}

// Read-only client for simulations (no signing needed)
const readClient = new Client({
  networkPassphrase: NETWORK_PASSPHRASE,
  contractId: CONTRACT_ID,
  rpcUrl: RPC_URL,
});

async function signAndSend(txBuilder, publicKey) {
  const { built } = txBuilder;
  // If the transaction builder doesn't automatically sign with Freighter, we do it manually.
  // The signAndSend method on the builder takes an options object with signTransaction.
  const tx = await txBuilder.signAndSend({
    signTransaction: async (txXdr) => {
      const signed = await freighter.signTransaction(txXdr, {
        network: 'TESTNET',
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signed;
    },
    publicKey,
  });

  const { result, hash } = tx;

  if (result && typeof result === 'object' && 'isErr' in result && result.isErr()) {
    const err = result.unwrapErr();
    const message = Errors[err.message] ? Errors[err.message].message : err.message;
    throw new Error(`Contract error: ${message}`);
  }
  
  const unwrapped = result && typeof result === 'object' && 'unwrap' in result ? result.unwrap() : result;
  return { result: unwrapped, hash };
}

function convertManifest(m) {
  return {
    id: Number(m.id),
    creator: m.creator,
    buyer: m.buyer,
    token: m.token,
    label: m.label,
    stakeholders: m.stakeholders.map(s => ({
      address: s.address,
      role: s.role,
      share_bps: Number(s.share_bps)
    })),
    status: m.status.tag,
    created_at: Number(m.created_at),
    settlement: null
  };
}

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
          const sTx = await readClient.get_settlement({ manifest_id: BigInt(i) });
          if (sTx.result.isOk()) {
            const s = sTx.result.unwrap();
            m.settlement = {
              total_amount: Number(s.total_amount),
              settled_at: Number(s.settled_at),
              payouts: s.payouts.map(p => ({
                address: p.address,
                role: p.role,
                share_bps: Number(p.share_bps),
                amount: p.amount.toString()
              }))
            };
          }
        }
        manifests.push(m);
      }
    } catch (e) {
      console.error("Failed to fetch manifest", i, e);
    }
  }
  
  return manifests.sort((a, b) => b.created_at - a.created_at);
}

export async function getManifest(id) {
  const tx = await readClient.get_manifest({ manifest_id: BigInt(id) });
  if (tx.result.isErr()) {
    throw new Error('Manifest not found');
  }
  
  const m = convertManifest(tx.result.unwrap());
  
  if (m.status === 'Settled') {
    const sTx = await readClient.get_settlement({ manifest_id: BigInt(id) });
    if (sTx.result.isOk()) {
      const s = sTx.result.unwrap();
      m.settlement = {
        total_amount: Number(s.total_amount),
        settled_at: Number(s.settled_at),
        payouts: s.payouts.map(p => ({
          address: p.address,
          role: p.role,
          share_bps: Number(p.share_bps),
          amount: p.amount.toString()
        }))
      };
    }
  }
  
  return m;
}

export async function createManifest({ buyer, label, stakeholders, token = NATIVE_XLM }) {
  const sum = stakeholders.reduce((s, x) => s + x.share_bps, 0);
  if (sum !== 10000) throw new Error('Shares must sum to exactly 100% (10000 bps)');
  if (stakeholders.length === 0) throw new Error('At least one stakeholder is required');
  
  // Create a client with the caller's publicKey so the SDK can build the transaction correctly
  const client = getClient(buyer);
  const txBuilder = await client.create_manifest({
    creator: buyer,
    buyer: buyer,
    token: token,
    label,
    stakeholders
  });

  const { result, hash } = await signAndSend(txBuilder, buyer);
  return { id: Number(result), hash };
}

export async function fundAndDistribute({ manifestId, amountStroops, buyer }) {
  const amount = BigInt(Math.round(amountStroops));
  if (amount <= 0n) throw new Error('Amount must be greater than 0');

  // Create a client with the caller's publicKey so the SDK can build the transaction correctly
  const client = getClient(buyer);
  const txBuilder = await client.fund_and_distribute({
    buyer: buyer,
    manifest_id: BigInt(manifestId),
    amount
  });
  
  const { hash } = await signAndSend(txBuilder, buyer);
  
  // Fetch settlement to return
  const sTx = await readClient.get_settlement({ manifest_id: BigInt(manifestId) });
  if (sTx.result.isOk()) {
    const s = sTx.result.unwrap();
    return {
      settlement: {
        total_amount: Number(s.total_amount),
        settled_at: Number(s.settled_at),
        payouts: s.payouts.map(p => ({
          address: p.address,
          role: p.role,
          share_bps: Number(p.share_bps),
          amount: p.amount.toString()
        }))
      },
      hash
    };
  }
  
  return { settlement: null, hash };
}

export async function cancelManifest(manifestId, creator) {
  // Create a client with the caller's publicKey so the SDK can build the transaction correctly
  const client = getClient(creator);
  const txBuilder = await client.cancel_manifest({
    creator,
    manifest_id: BigInt(manifestId)
  });
  
  const { hash } = await signAndSend(txBuilder, creator);
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
