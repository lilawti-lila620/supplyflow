#![no_std]

mod errors;
mod types;

pub use errors::Error;
pub use types::*;

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

#[contract]
pub struct PaymentDistributionContract;

#[contractimpl]
impl PaymentDistributionContract {
    /// One-time setup. `admin` can pause the contract in an emergency but can
    /// never touch funds or override a manifest's stakeholders once created.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::ManifestCount, &0u64);
        Ok(())
    }

    /// Create a payment manifest: the fixed revenue-sharing rule for one
    /// order/shipment. Shares are locked in at creation and are immutable —
    /// this is what makes the distribution independently verifiable.
    pub fn create_manifest(
        env: Env,
        creator: Address,
        buyer: Address,
        token: Address,
        label: String,
        stakeholders: Vec<Stakeholder>,
    ) -> Result<u64, Error> {
        creator.require_auth();
        Self::require_not_paused(&env)?;

        if stakeholders.is_empty() {
            return Err(Error::NoStakeholders);
        }
        if stakeholders.len() > MAX_STAKEHOLDERS {
            return Err(Error::TooManyStakeholders);
        }

        let mut sum: u32 = 0;
        let mut seen: Vec<Address> = Vec::new(&env);
        for s in stakeholders.iter() {
            if s.share_bps == 0 {
                return Err(Error::InvalidShare);
            }
            for existing in seen.iter() {
                if existing == s.address {
                    return Err(Error::DuplicateStakeholder);
                }
            }
            seen.push_back(s.address.clone());
            sum = sum
                .checked_add(s.share_bps)
                .ok_or(Error::InvalidShare)?;
        }
        if sum != BPS_DENOMINATOR {
            return Err(Error::SharesMustSumTo10000);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ManifestCount)
            .unwrap_or(0u64);

        let manifest = Manifest {
            id,
            creator: creator.clone(),
            buyer: buyer.clone(),
            token,
            label,
            stakeholders: stakeholders.clone(),
            status: ManifestStatus::Open,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Manifest(id), &manifest);
        env.storage()
            .instance()
            .set(&DataKey::ManifestCount, &(id + 1));

        // Index this manifest against every participant (buyer + all
        // stakeholders) so their dashboards can list it without a scan.
        Self::index_participant(&env, &buyer, id);
        for s in stakeholders.iter() {
            Self::index_participant(&env, &s.address, id);
        }

        env.events()
            .publish((String::from_str(&env, "manifest_created"), id), buyer);

        Ok(id)
    }

    /// Fund a manifest and atomically distribute the payment to every
    /// stakeholder in a single transaction. Either every participant is paid
    /// their exact agreed share, or the whole call reverts — no partial
    /// settlements are possible.
    pub fn fund_and_distribute(
        env: Env,
        buyer: Address,
        manifest_id: u64,
        amount: i128,
    ) -> Result<(), Error> {
        buyer.require_auth();
        Self::require_not_paused(&env)?;

        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        let mut manifest: Manifest = env
            .storage()
            .persistent()
            .get(&DataKey::Manifest(manifest_id))
            .ok_or(Error::ManifestNotFound)?;

        match manifest.status {
            ManifestStatus::Settled => return Err(Error::ManifestAlreadySettled),
            ManifestStatus::Cancelled => return Err(Error::ManifestCancelled),
            ManifestStatus::Open => {}
        }
        if manifest.buyer != buyer {
            return Err(Error::NotAuthorized);
        }

        let token_client = token::Client::new(&env, &manifest.token);
        let mut payouts: Vec<PayoutRecord> = Vec::new(&env);
        let mut distributed: i128 = 0;
        let last_index = manifest.stakeholders.len() - 1;

        for (i, s) in manifest.stakeholders.iter().enumerate() {
            // Give any rounding remainder to the final stakeholder so the
            // sum of payouts always equals `amount` exactly.
            let share_amount: i128 = if i as u32 == last_index {
                amount - distributed
            } else {
                (amount * s.share_bps as i128) / BPS_DENOMINATOR as i128
            };
            distributed += share_amount;

            token_client.transfer(&buyer, &s.address, &share_amount);

            payouts.push_back(PayoutRecord {
                address: s.address.clone(),
                role: s.role.clone(),
                share_bps: s.share_bps,
                amount: share_amount,
            });
        }

        manifest.status = ManifestStatus::Settled;
        env.storage()
            .persistent()
            .set(&DataKey::Manifest(manifest_id), &manifest);

        let settlement = Settlement {
            manifest_id,
            total_amount: amount,
            payouts,
            settled_at: env.ledger().timestamp(),
            tx_memo: String::from_str(&env, "supplyflow-settlement"),
        };
        env.storage()
            .persistent()
            .set(&DataKey::Settlement(manifest_id), &settlement);

        env.events().publish(
            (String::from_str(&env, "manifest_settled"), manifest_id),
            amount,
        );

        Ok(())
    }

    /// Creator can cancel an unfunded manifest (e.g. order fell through).
    pub fn cancel_manifest(env: Env, creator: Address, manifest_id: u64) -> Result<(), Error> {
        creator.require_auth();

        let mut manifest: Manifest = env
            .storage()
            .persistent()
            .get(&DataKey::Manifest(manifest_id))
            .ok_or(Error::ManifestNotFound)?;

        if manifest.creator != creator {
            return Err(Error::NotAuthorized);
        }
        match manifest.status {
            ManifestStatus::Settled => return Err(Error::ManifestAlreadySettled),
            ManifestStatus::Cancelled => return Err(Error::ManifestCancelled),
            ManifestStatus::Open => {}
        }

        manifest.status = ManifestStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Manifest(manifest_id), &manifest);
        Ok(())
    }

    pub fn get_manifest(env: Env, manifest_id: u64) -> Result<Manifest, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Manifest(manifest_id))
            .ok_or(Error::ManifestNotFound)
    }

    pub fn get_settlement(env: Env, manifest_id: u64) -> Result<Settlement, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Settlement(manifest_id))
            .ok_or(Error::ManifestNotFound)
    }

    pub fn list_manifests_for(env: Env, participant: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::ParticipantManifests(participant))
            .unwrap_or(Vec::new(&env))
    }

    pub fn manifest_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ManifestCount)
            .unwrap_or(0u64)
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if stored_admin != admin {
            return Err(Error::NotAuthorized);
        }
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    fn require_not_paused(env: &Env) -> Result<(), Error> {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }

    fn index_participant(env: &Env, participant: &Address, manifest_id: u64) {
        let key = DataKey::ParticipantManifests(participant.clone());
        let mut list: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
        // Avoid duplicate index entries if buyer == a stakeholder somehow.
        if !list.iter().any(|x| x == manifest_id) {
            list.push_back(manifest_id);
            env.storage().persistent().set(&key, &list);
        }
    }
}

mod test;
