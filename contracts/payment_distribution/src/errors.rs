use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    ManifestAlreadyExists = 4,
    ManifestNotFound = 5,
    SharesMustSumTo10000 = 6,
    NoStakeholders = 7,
    TooManyStakeholders = 8,
    ManifestAlreadySettled = 9,
    ManifestCancelled = 10,
    ZeroAmount = 11,
    DuplicateStakeholder = 12,
    ContractPaused = 13,
    InvalidShare = 14,
}
