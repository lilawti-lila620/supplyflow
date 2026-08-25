import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBBLDCSB24PLZNXCKFBCUA2LZ7TO22FKVL5H6ZPUMEQRTYO4NYWYEUUA",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Paused", values: void} | {tag: "ManifestCount", values: void} | {tag: "Manifest", values: readonly [u64]} | {tag: "Settlement", values: readonly [u64]} | {tag: "ParticipantManifests", values: readonly [string]};


export interface Manifest {
  buyer: string;
  created_at: u64;
  creator: string;
  id: u64;
  label: string;
  stakeholders: Array<Stakeholder>;
  status: ManifestStatus;
  token: string;
}


export interface Settlement {
  manifest_id: u64;
  payouts: Array<PayoutRecord>;
  settled_at: u64;
  total_amount: i128;
  tx_memo: string;
}


export interface Stakeholder {
  address: string;
  role: string;
  share_bps: u32;
}


export interface PayoutRecord {
  address: string;
  amount: i128;
  role: string;
  share_bps: u32;
}

export type ManifestStatus = {tag: "Open", values: void} | {tag: "Settled", values: void} | {tag: "Cancelled", values: void};

export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"NotAuthorized"},
  4: {message:"ManifestAlreadyExists"},
  5: {message:"ManifestNotFound"},
  6: {message:"SharesMustSumTo10000"},
  7: {message:"NoStakeholders"},
  8: {message:"TooManyStakeholders"},
  9: {message:"ManifestAlreadySettled"},
  10: {message:"ManifestCancelled"},
  11: {message:"ZeroAmount"},
  12: {message:"DuplicateStakeholder"},
  13: {message:"ContractPaused"},
  14: {message:"InvalidShare"}
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time setup. `admin` can pause the contract in an emergency but can
   * never touch funds or override a manifest's stakeholders once created.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_paused transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_paused: ({admin, paused}: {admin: string, paused: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_manifest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_manifest: ({manifest_id}: {manifest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Manifest>>>

  /**
   * Construct and simulate a get_settlement transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_settlement: ({manifest_id}: {manifest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Settlement>>>

  /**
   * Construct and simulate a manifest_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  manifest_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a cancel_manifest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Creator can cancel an unfunded manifest (e.g. order fell through).
   */
  cancel_manifest: ({creator, manifest_id}: {creator: string, manifest_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_manifest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a payment manifest: the fixed revenue-sharing rule for one
   * order/shipment. Shares are locked in at creation and are immutable —
   * this is what makes the distribution independently verifiable.
   */
  create_manifest: ({creator, buyer, token, label, stakeholders}: {creator: string, buyer: string, token: string, label: string, stakeholders: Array<Stakeholder>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a list_manifests_for transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_manifests_for: ({participant}: {participant: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a fund_and_distribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund a manifest and atomically distribute the payment to every
   * stakeholder in a single transaction. Either every participant is paid
   * their exact agreed share, or the whole call reverts — no partial
   * settlements are possible.
   */
  fund_and_distribute: ({buyer, manifest_id, amount}: {buyer: string, manifest_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAIxPbmUtdGltZSBzZXR1cC4gYGFkbWluYCBjYW4gcGF1c2UgdGhlIGNvbnRyYWN0IGluIGFuIGVtZXJnZW5jeSBidXQgY2FuCm5ldmVyIHRvdWNoIGZ1bmRzIG9yIG92ZXJyaWRlIGEgbWFuaWZlc3QncyBzdGFrZWhvbGRlcnMgb25jZSBjcmVhdGVkLgAAAAppbml0aWFsaXplAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAKc2V0X3BhdXNlZAAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAMZ2V0X21hbmlmZXN0AAAAAQAAAAAAAAALbWFuaWZlc3RfaWQAAAAABgAAAAEAAAPpAAAH0AAAAAhNYW5pZmVzdAAAAAM=",
        "AAAAAAAAAAAAAAAOZ2V0X3NldHRsZW1lbnQAAAAAAAEAAAAAAAAAC21hbmlmZXN0X2lkAAAAAAYAAAABAAAD6QAAB9AAAAAKU2V0dGxlbWVudAAAAAAAAw==",
        "AAAAAAAAAAAAAAAObWFuaWZlc3RfY291bnQAAAAAAAAAAAABAAAABg==",
        "AAAAAAAAAEJDcmVhdG9yIGNhbiBjYW5jZWwgYW4gdW5mdW5kZWQgbWFuaWZlc3QgKGUuZy4gb3JkZXIgZmVsbCB0aHJvdWdoKS4AAAAAAA9jYW5jZWxfbWFuaWZlc3QAAAAAAgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAttYW5pZmVzdF9pZAAAAAAGAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAMZDcmVhdGUgYSBwYXltZW50IG1hbmlmZXN0OiB0aGUgZml4ZWQgcmV2ZW51ZS1zaGFyaW5nIHJ1bGUgZm9yIG9uZQpvcmRlci9zaGlwbWVudC4gU2hhcmVzIGFyZSBsb2NrZWQgaW4gYXQgY3JlYXRpb24gYW5kIGFyZSBpbW11dGFibGUg4oCUCnRoaXMgaXMgd2hhdCBtYWtlcyB0aGUgZGlzdHJpYnV0aW9uIGluZGVwZW5kZW50bHkgdmVyaWZpYWJsZS4AAAAAAA9jcmVhdGVfbWFuaWZlc3QAAAAABQAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAFbGFiZWwAAAAAAAAQAAAAAAAAAAxzdGFrZWhvbGRlcnMAAAPqAAAH0AAAAAtTdGFrZWhvbGRlcgAAAAABAAAD6QAAAAYAAAAD",
        "AAAAAAAAAAAAAAASbGlzdF9tYW5pZmVzdHNfZm9yAAAAAAABAAAAAAAAAAtwYXJ0aWNpcGFudAAAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAAOFGdW5kIGEgbWFuaWZlc3QgYW5kIGF0b21pY2FsbHkgZGlzdHJpYnV0ZSB0aGUgcGF5bWVudCB0byBldmVyeQpzdGFrZWhvbGRlciBpbiBhIHNpbmdsZSB0cmFuc2FjdGlvbi4gRWl0aGVyIGV2ZXJ5IHBhcnRpY2lwYW50IGlzIHBhaWQKdGhlaXIgZXhhY3QgYWdyZWVkIHNoYXJlLCBvciB0aGUgd2hvbGUgY2FsbCByZXZlcnRzIOKAlCBubyBwYXJ0aWFsCnNldHRsZW1lbnRzIGFyZSBwb3NzaWJsZS4AAAAAAAATZnVuZF9hbmRfZGlzdHJpYnV0ZQAAAAADAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAAC21hbmlmZXN0X2lkAAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGUGF1c2VkAAAAAAAAAAAAAAAAAA1NYW5pZmVzdENvdW50AAAAAAAAAQAAAAAAAAAITWFuaWZlc3QAAAABAAAABgAAAAEAAAAAAAAAClNldHRsZW1lbnQAAAAAAAEAAAAGAAAAAQAAAAAAAAAUUGFydGljaXBhbnRNYW5pZmVzdHMAAAABAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAACE1hbmlmZXN0AAAACAAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAVsYWJlbAAAAAAAABAAAAAAAAAADHN0YWtlaG9sZGVycwAAA+oAAAfQAAAAC1N0YWtlaG9sZGVyAAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADk1hbmlmZXN0U3RhdHVzAAAAAAAAAAAABXRva2VuAAAAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAAClNldHRsZW1lbnQAAAAAAAUAAAAAAAAAC21hbmlmZXN0X2lkAAAAAAYAAAAAAAAAB3BheW91dHMAAAAD6gAAB9AAAAAMUGF5b3V0UmVjb3JkAAAAAAAAAApzZXR0bGVkX2F0AAAAAAAGAAAAAAAAAAx0b3RhbF9hbW91bnQAAAALAAAAAAAAAAd0eF9tZW1vAAAAABA=",
        "AAAAAQAAAAAAAAAAAAAAC1N0YWtlaG9sZGVyAAAAAAMAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAEcm9sZQAAABAAAAAAAAAACXNoYXJlX2JwcwAAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADFBheW91dFJlY29yZAAAAAQAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAARyb2xlAAAAEAAAAAAAAAAJc2hhcmVfYnBzAAAAAAAABA==",
        "AAAAAgAAAAAAAAAAAAAADk1hbmlmZXN0U3RhdHVzAAAAAAADAAAAAAAAAAAAAAAET3BlbgAAAAAAAAAAAAAAB1NldHRsZWQAAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADgAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAMAAAAAAAAAFU1hbmlmZXN0QWxyZWFkeUV4aXN0cwAAAAAAAAQAAAAAAAAAEE1hbmlmZXN0Tm90Rm91bmQAAAAFAAAAAAAAABRTaGFyZXNNdXN0U3VtVG8xMDAwMAAAAAYAAAAAAAAADk5vU3Rha2Vob2xkZXJzAAAAAAAHAAAAAAAAABNUb29NYW55U3Rha2Vob2xkZXJzAAAAAAgAAAAAAAAAFk1hbmlmZXN0QWxyZWFkeVNldHRsZWQAAAAAAAkAAAAAAAAAEU1hbmlmZXN0Q2FuY2VsbGVkAAAAAAAACgAAAAAAAAAKWmVyb0Ftb3VudAAAAAAACwAAAAAAAAAURHVwbGljYXRlU3Rha2Vob2xkZXIAAAAMAAAAAAAAAA5Db250cmFjdFBhdXNlZAAAAAAADQAAAAAAAAAMSW52YWxpZFNoYXJlAAAADg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        set_paused: this.txFromJSON<Result<void>>,
        get_manifest: this.txFromJSON<Result<Manifest>>,
        get_settlement: this.txFromJSON<Result<Settlement>>,
        manifest_count: this.txFromJSON<u64>,
        cancel_manifest: this.txFromJSON<Result<void>>,
        create_manifest: this.txFromJSON<Result<u64>>,
        list_manifests_for: this.txFromJSON<Array<u64>>,
        fund_and_distribute: this.txFromJSON<Result<void>>
  }
}