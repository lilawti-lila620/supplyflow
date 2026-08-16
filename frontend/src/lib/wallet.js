// Wallet layer: talks to the Freighter browser extension when it's present,
// and otherwise falls back to a clearly-labelled demo signer so the product
// can be evaluated (and by real cooperative members onboarded during the
// pilot) without every reviewer needing a funded testnet wallet installed.
import * as freighter from '@stellar/freighter-api';

const DEMO_KEY = 'supplyflow_demo_wallet';

function randomStellarLikeAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let out = 'G';
  for (let i = 0; i < 55; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getOrCreateDemoWallet() {
  let addr = localStorage.getItem(DEMO_KEY);
  if (!addr) {
    addr = randomStellarLikeAddress();
    localStorage.setItem(DEMO_KEY, addr);
  }
  return addr;
}

export async function isFreighterAvailable() {
  try {
    const res = await freighter.isConnected();
    return !!res?.isConnected;
  } catch {
    return false;
  }
}

export async function connectWallet() {
  const available = await isFreighterAvailable();
  if (available) {
    const access = await freighter.requestAccess();
    if (access?.error) throw new Error(access.error);
    const { address } = await freighter.getAddress();
    return { address, mode: 'freighter' };
  }
  // Demo mode: deterministic per-browser address so returning users keep
  // their manifest history without installing a wallet extension.
  const address = getOrCreateDemoWallet();
  return { address, mode: 'demo' };
}

export function disconnectWallet() {
  localStorage.removeItem(DEMO_KEY);
}

export async function getNetwork() {
  try {
    const res = await freighter.getNetwork();
    return res?.network || 'TESTNET';
  } catch {
    return 'TESTNET (demo)';
  }
}
