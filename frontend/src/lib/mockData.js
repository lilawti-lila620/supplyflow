// Realistic *fictional* seed data so the app tells a complete story on first
// load, mirroring shapes the Soroban contract actually returns (Manifest /
// Settlement / Stakeholder), so swapping the mock layer for live RPC calls
// requires no changes to any component.
//
// IMPORTANT: none of the names, quotes, or wallet activity below are real.
// This is placeholder content for local development and demos only — do not
// present it as evidence of real users, real feedback, or real wallet
// interactions in a hackathon or grant submission. Replace it with genuine
// data collected from real pilot users (see docs/USER_ONBOARDING.md and
// docs/FEEDBACK_SUMMARY.md).

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

function addr(seed) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let out = 'G';
  let s = seed;
  for (let i = 0; i < 55; i++) {
    s = (s * 16807) % 2147483647;
    out += chars[s % chars.length];
  }
  return out;
}

export const SEED_MANIFESTS = [
  {
    id: 0,
    label: 'Arabica Lot #KL-114 — Kilimanjaro Cooperative',
    buyer: addr(101),
    creator: addr(101),
    token: 'USDC',
    status: 'Settled',
    created_at: now - 9 * DAY,
    stakeholders: [
      { address: addr(1), role: 'Farmer Collective', share_bps: 5500 },
      { address: addr(2), role: 'Cooperative', share_bps: 1500 },
      { address: addr(3), role: 'Transporter', share_bps: 1000 },
      { address: addr(4), role: 'Dry Mill / QC', share_bps: 1000 },
      { address: addr(5), role: 'Exporter', share_bps: 1000 },
    ],
    settlement: { total_amount: 48_500_0000000, settled_at: now - 9 * DAY + 3600 },
  },
  {
    id: 1,
    label: 'Cocoa Shipment #AB-77 — Ashanti Growers Union',
    buyer: addr(102),
    creator: addr(102),
    token: 'USDC',
    status: 'Settled',
    created_at: now - 6 * DAY,
    stakeholders: [
      { address: addr(6), role: 'Farmer Collective', share_bps: 6000 },
      { address: addr(7), role: 'Cooperative', share_bps: 1500 },
      { address: addr(8), role: 'Transporter', share_bps: 1500 },
      { address: addr(9), role: 'Exporter', share_bps: 1000 },
    ],
    settlement: { total_amount: 72_300_0000000, settled_at: now - 6 * DAY + 5400 },
  },
  {
    id: 2,
    label: 'Woven Textile Batch #TX-9 — Anatolia Weavers Guild',
    buyer: addr(103),
    creator: addr(103),
    token: 'USDC',
    status: 'Open',
    created_at: now - 2 * DAY,
    stakeholders: [
      { address: addr(10), role: 'Artisan Weavers', share_bps: 6500 },
      { address: addr(11), role: 'Cooperative', share_bps: 1500 },
      { address: addr(12), role: 'Distributor', share_bps: 2000 },
    ],
    settlement: null,
  },
  {
    id: 3,
    label: 'Fresh Catch Batch #FS-212 — Coastal Fisheries Alliance',
    buyer: addr(104),
    creator: addr(104),
    token: 'USDC',
    status: 'Settled',
    created_at: now - 1 * DAY,
    stakeholders: [
      { address: addr(13), role: 'Fisher Crew', share_bps: 5000 },
      { address: addr(14), role: 'Cold Chain / Processor', share_bps: 2500 },
      { address: addr(15), role: 'Distributor', share_bps: 2500 },
    ],
    settlement: { total_amount: 19_800_0000000, settled_at: now - 1 * DAY + 1800 },
  },
];

export const SEED_FEEDBACK = [
  {
    id: 1,
    name: 'Amara N.',
    role: 'Cooperative treasurer',
    rating: 5,
    comment:
      'For the first time our farmers can check their own payout on their phone instead of waiting on our monthly statement.',
    created_at: now - 4 * DAY,
  },
  {
    id: 2,
    name: 'Diego R.',
    role: 'Independent transporter',
    rating: 5,
    comment: 'Payment lands the moment the buyer settles. No more chasing the exporter for my cut.',
    created_at: now - 3 * DAY,
  },
  {
    id: 3,
    name: 'Sofia T.',
    role: 'Exporter, coffee lots',
    rating: 4,
    comment: 'Cuts a lot of reconciliation work. Would like bulk manifest creation for recurring routes next.',
    created_at: now - 2 * DAY,
  },
];
