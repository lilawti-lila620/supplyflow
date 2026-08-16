use soroban_sdk::{contracttype, Address, String, Vec};

/// Basis points denominator. 10_000 bps == 100%.
pub const BPS_DENOMINATOR: u32 = 10_000;
pub const MAX_STAKEHOLDERS: u32 = 20;

#[derive(Clone)]
#[contracttype]
pub struct Stakeholder {
    pub address: Address,
    pub role: String,
    pub share_bps: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum ManifestStatus {
    Open,
    Settled,
    Cancelled,
}

#[derive(Clone)]
#[contracttype]
pub struct Manifest {
    pub id: u64,
    pub creator: Address,
    pub buyer: Address,
    pub token: Address,
    pub label: String,
    pub stakeholders: Vec<Stakeholder>,
    pub status: ManifestStatus,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct PayoutRecord {
    pub address: Address,
    pub role: String,
    pub share_bps: u32,
    pub amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Settlement {
    pub manifest_id: u64,
    pub total_amount: i128,
    pub payouts: Vec<PayoutRecord>,
    pub settled_at: u64,
    pub tx_memo: String,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    ManifestCount,
    Manifest(u64),
    Settlement(u64),
    ParticipantManifests(Address),
}
