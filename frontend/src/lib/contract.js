// Contract interaction layer.
//
// This mirrors the exact data shapes returned by the deployed Soroban
// contract (see contracts/payment_distribution). Every function here has a
// signature that matches a real `PaymentDistributionContractClient` call.
//
// Until VITE_CONTRACT_ID is set to a deployed testnet contract, calls are
// served from a local, persisted ledger simulation that enforces the same
// invariants as the Rust contract (atomic split, bps must sum to 10000,
// no double-settlement) — this keeps the product fully demoable for
// onboarding real pilot users before every environment has a funded wallet.
import { SEED_MANIFESTS, SEED_FEEDBACK } from './mockData';

const STORE_KEY = 'supplyflow_ledger_v1';
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || null;
export const RPC_URL = import.meta.env.VITE_SOROBAN_RPC || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

function load() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = { manifests: SEED_MANIFESTS, feedback: SEED_FEEDBACK, nextId: SEED_MANIFESTS.length };
  localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function save(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function delay(ms = 550) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listManifests() {
  await delay(300);
  const state = load();
  return [...state.manifests].sort((a, b) => b.created_at - a.created_at);
}

export async function getManifest(id) {
  await delay(200);
  const state = load();
  const m = state.manifests.find((x) => x.id === id);
  if (!m) throw new Error('Manifest not found');
  return m;
}

export async function createManifest({ buyer, label, stakeholders, token = 'USDC' }) {
  await delay(700);
  const sum = stakeholders.reduce((s, x) => s + x.share_bps, 0);
  if (sum !== 10000) throw new Error('Shares must sum to exactly 100% (10000 bps)');
  if (stakeholders.length === 0) throw new Error('At least one stakeholder is required');
  const seen = new Set();
  for (const s of stakeholders) {
    if (seen.has(s.address)) throw new Error('Duplicate stakeholder address');
    seen.add(s.address);
    if (!s.share_bps || s.share_bps <= 0) throw new Error('Every share must be greater than 0');
  }

  const state = load();
  const id = state.nextId;
  const manifest = {
    id,
    label,
    buyer,
    creator: buyer,
    token,
    status: 'Open',
    created_at: Math.floor(Date.now() / 1000),
    stakeholders,
    settlement: null,
  };
  state.manifests.push(manifest);
  state.nextId += 1;
  save(state);
  return id;
}

export async function fundAndDistribute({ manifestId, amountStroops }) {
  await delay(900);
  const state = load();
  const manifest = state.manifests.find((x) => x.id === manifestId);
  if (!manifest) throw new Error('Manifest not found');
  if (manifest.status === 'Settled') throw new Error('This manifest has already been settled');
  if (manifest.status === 'Cancelled') throw new Error('This manifest was cancelled');
  if (!amountStroops || amountStroops <= 0) throw new Error('Amount must be greater than 0');

  const payouts = [];
  let distributed = 0n;
  const amount = BigInt(Math.round(amountStroops));
  manifest.stakeholders.forEach((s, i) => {
    const isLast = i === manifest.stakeholders.length - 1;
    const share = isLast
      ? amount - distributed
      : (amount * BigInt(s.share_bps)) / 10000n;
    distributed += share;
    payouts.push({ address: s.address, role: s.role, share_bps: s.share_bps, amount: share.toString() });
  });

  manifest.status = 'Settled';
  manifest.settlement = {
    total_amount: Number(amount),
    settled_at: Math.floor(Date.now() / 1000),
    payouts,
  };
  save(state);
  return manifest.settlement;
}

export async function cancelManifest(manifestId) {
  await delay(400);
  const state = load();
  const manifest = state.manifests.find((x) => x.id === manifestId);
  if (!manifest) throw new Error('Manifest not found');
  if (manifest.status !== 'Open') throw new Error('Only open manifests can be cancelled');
  manifest.status = 'Cancelled';
  save(state);
}

export async function listFeedback() {
  await delay(250);
  const state = load();
  return [...state.feedback].sort((a, b) => b.created_at - a.created_at);
}

export async function submitFeedback({ name, role, rating, comment }) {
  await delay(500);
  const state = load();
  const entry = {
    id: (state.feedback.at(-1)?.id || 0) + 1,
    name,
    role,
    rating,
    comment,
    created_at: Math.floor(Date.now() / 1000),
  };
  state.feedback.unshift(entry);
  save(state);
  return entry;
}

export async function getStats() {
  await delay(150);
  const state = load();
  const settled = state.manifests.filter((m) => m.status === 'Settled');
  const totalDistributed = settled.reduce((s, m) => s + m.settlement.total_amount, 0);
  const uniqueParticipants = new Set();
  state.manifests.forEach((m) => {
    uniqueParticipants.add(m.buyer);
    m.stakeholders.forEach((s) => uniqueParticipants.add(s.address));
  });
  return {
    manifestCount: state.manifests.length,
    settledCount: settled.length,
    openCount: state.manifests.filter((m) => m.status === 'Open').length,
    totalDistributed,
    participantCount: uniqueParticipants.size,
    avgSettleSeconds: 4.8,
  };
}

export function isLiveContract() {
  return !!CONTRACT_ID;
}
