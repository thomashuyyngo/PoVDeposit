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





export interface Booking {
  booking_id: u64;
  check_in_deadline: u64;
  check_in_proof_hash: Option<Buffer>;
  confirmation_deadline: u64;
  deposit_amount: i128;
  evidence_hash: Buffer;
  host: string;
  renter: string;
  response_hash: Option<Buffer>;
  state: BookingState;
  visit_time: u64;
}

export type BookingState = {tag: "Created", values: void} | {tag: "Funded", values: void} | {tag: "CancelledByRenter", values: void} | {tag: "CancelledByHost", values: void} | {tag: "CheckedIn", values: void} | {tag: "VisitConfirmed", values: void} | {tag: "RenterNoShow", values: void} | {tag: "HostNoShow", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void} | {tag: "Released", values: void} | {tag: "Expired", values: void};


export interface EscrowConfig {
  accepted_asset: string;
  admin: string;
  arbitrator: string;
  check_in_window: u64;
  confirmation_window: u64;
  fee_recipient: string;
  max_deposit: i128;
  min_deposit: i128;
  paused: boolean;
  platform_fee_bps: u32;
  version: u32;
}


export const ContractError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"BookingAlreadyExists"},
  4: {message:"BookingNotFound"},
  5: {message:"InvalidBookingState"},
  6: {message:"UnauthorizedRenter"},
  7: {message:"UnauthorizedHost"},
  8: {message:"UnauthorizedParticipant"},
  9: {message:"UnauthorizedArbitrator"},
  10: {message:"UnauthorizedAdmin"},
  11: {message:"InvalidDeposit"},
  12: {message:"InvalidDeadlines"},
  13: {message:"OutsideCheckInWindow"},
  14: {message:"PlatformPaused"},
  15: {message:"InvalidResolution"},
  16: {message:"InvalidConfig"},
  17: {message:"ArithmeticOverflow"}
}















export type DisputeResolution = {tag: "Refund", values: void} | {tag: "Release", values: void} | {tag: "Split", values: readonly [i128]};

export interface Client {
  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  booking: ({booking_id}: {booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Booking>>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  unpause: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a check_in transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_in: ({renter, booking_id, proof_hash}: {renter: string, booking_id: u64, proof_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Result<EscrowConfig>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({config}: {config: EscrowConfig}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_booking: ({booking_id}: {booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Booking>>>

  /**
   * Construct and simulate a fund_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_booking: ({renter, booking_id}: {renter: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a open_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  open_dispute: ({actor, booking_id, evidence_hash}: {actor: string, booking_id: u64, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a confirm_visit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  confirm_visit: ({host, booking_id}: {host: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_config: ({admin, new_config}: {admin: string, new_config: EscrowConfig}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_booking: ({renter, booking_id}: {renter: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_by_host transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_by_host: ({host, booking_id}: {host: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_booking: ({booking_id, renter, host, deposit_amount, visit_time, check_in_deadline, confirmation_deadline, evidence_hash}: {booking_id: u64, renter: string, host: string, deposit_amount: i128, visit_time: u64, check_in_deadline: u64, confirmation_deadline: u64, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a expire_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  expire_booking: ({booking_id}: {booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a refund_booking transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  refund_booking: ({arbitrator, booking_id}: {arbitrator: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({arbitrator, booking_id, resolution}: {arbitrator: string, booking_id: u64, resolution: DisputeResolution}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_by_renter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_by_renter: ({renter, booking_id}: {renter: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a upgrade_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade_contract: ({admin, wasm_hash}: {admin: string, wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a respond_to_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  respond_to_dispute: ({actor, booking_id, evidence_hash}: {actor: string, booking_id: u64, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a report_host_no_show transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  report_host_no_show: ({renter, booking_id}: {renter: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a report_renter_no_show transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  report_renter_no_show: ({host, booking_id}: {host: string, booking_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAB0Jvb2tpbmcAAAAACwAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAAAAAARY2hlY2tfaW5fZGVhZGxpbmUAAAAAAAAGAAAAAAAAABNjaGVja19pbl9wcm9vZl9oYXNoAAAAA+gAAAPuAAAAIAAAAAAAAAAVY29uZmlybWF0aW9uX2RlYWRsaW5lAAAAAAAABgAAAAAAAAAOZGVwb3NpdF9hbW91bnQAAAAAAAsAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAAEaG9zdAAAABMAAAAAAAAABnJlbnRlcgAAAAAAEwAAAAAAAAANcmVzcG9uc2VfaGFzaAAAAAAAA+gAAAPuAAAAIAAAAAAAAAAFc3RhdGUAAAAAAAfQAAAADEJvb2tpbmdTdGF0ZQAAAAAAAAAKdmlzaXRfdGltZQAAAAAABg==",
        "AAAAAgAAAAAAAAAAAAAADEJvb2tpbmdTdGF0ZQAAAAwAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAABkZ1bmRlZAAAAAAAAAAAAAAAAAARQ2FuY2VsbGVkQnlSZW50ZXIAAAAAAAAAAAAAAAAAAA9DYW5jZWxsZWRCeUhvc3QAAAAAAAAAAAAAAAAJQ2hlY2tlZEluAAAAAAAAAAAAAAAAAAAOVmlzaXRDb25maXJtZWQAAAAAAAAAAAAAAAAADFJlbnRlck5vU2hvdwAAAAAAAAAAAAAACkhvc3ROb1Nob3cAAAAAAAAAAAAAAAAACERpc3B1dGVkAAAAAAAAAAAAAAAIUmVmdW5kZWQAAAAAAAAAAAAAAAhSZWxlYXNlZAAAAAAAAAAAAAAAB0V4cGlyZWQA",
        "AAAAAQAAAAAAAAAAAAAADEVzY3Jvd0NvbmZpZwAAAAsAAAAAAAAADmFjY2VwdGVkX2Fzc2V0AAAAAAATAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACmFyYml0cmF0b3IAAAAAABMAAAAAAAAAD2NoZWNrX2luX3dpbmRvdwAAAAAGAAAAAAAAABNjb25maXJtYXRpb25fd2luZG93AAAAAAYAAAAAAAAADWZlZV9yZWNpcGllbnQAAAAAAAATAAAAAAAAAAttYXhfZGVwb3NpdAAAAAALAAAAAAAAAAttaW5fZGVwb3NpdAAAAAALAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAAAAAAAEHBsYXRmb3JtX2ZlZV9icHMAAAAEAAAAAAAAAAd2ZXJzaW9uAAAAAAQ=",
        "AAAABQAAAAAAAAAAAAAADERlcG9zaXRTcGxpdAAAAAEAAAANZGVwb3NpdF9zcGxpdAAAAAAAAAMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAABAAAAAAAAAA1yZW50ZXJfYW1vdW50AAAAAAAACwAAAAAAAAAAAAAAC2hvc3RfYW1vdW50AAAAAAsAAAAAAAAAAg==",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAARAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAABRCb29raW5nQWxyZWFkeUV4aXN0cwAAAAMAAAAAAAAAD0Jvb2tpbmdOb3RGb3VuZAAAAAAEAAAAAAAAABNJbnZhbGlkQm9va2luZ1N0YXRlAAAAAAUAAAAAAAAAElVuYXV0aG9yaXplZFJlbnRlcgAAAAAABgAAAAAAAAAQVW5hdXRob3JpemVkSG9zdAAAAAcAAAAAAAAAF1VuYXV0aG9yaXplZFBhcnRpY2lwYW50AAAAAAgAAAAAAAAAFlVuYXV0aG9yaXplZEFyYml0cmF0b3IAAAAAAAkAAAAAAAAAEVVuYXV0aG9yaXplZEFkbWluAAAAAAAACgAAAAAAAAAOSW52YWxpZERlcG9zaXQAAAAAAAsAAAAAAAAAEEludmFsaWREZWFkbGluZXMAAAAMAAAAAAAAABRPdXRzaWRlQ2hlY2tJbldpbmRvdwAAAA0AAAAAAAAADlBsYXRmb3JtUGF1c2VkAAAAAAAOAAAAAAAAABFJbnZhbGlkUmVzb2x1dGlvbgAAAAAAAA8AAAAAAAAADUludmFsaWRDb25maWcAAAAAAAAQAAAAAAAAABJBcml0aG1ldGljT3ZlcmZsb3cAAAAAABE=",
        "AAAABQAAAAAAAAAAAAAADUJvb2tpbmdGdW5kZWQAAAAAAAABAAAADmJvb2tpbmdfZnVuZGVkAAAAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADURpc3B1dGVPcGVuZWQAAAAAAAABAAAADmRpc3B1dGVfb3BlbmVkAAAAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAANZXZpZGVuY2VfaGFzaAAAAAAAA+4AAAAgAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADkJvb2tpbmdDcmVhdGVkAAAAAAABAAAAD2Jvb2tpbmdfY3JlYXRlZAAAAAAEAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAGcmVudGVyAAAAAAATAAAAAAAAAAAAAAAEaG9zdAAAABMAAAAAAAAAAAAAAA5kZXBvc2l0X2Ftb3VudAAAAAAACwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADkJvb2tpbmdFeHBpcmVkAAAAAAABAAAAD2Jvb2tpbmdfZXhwaXJlZAAAAAABAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAADkNvbnRyYWN0UGF1c2VkAAAAAAABAAAAD2NvbnRyYWN0X3BhdXNlZAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADk5vU2hvd1JlcG9ydGVkAAAAAAABAAAAEG5vX3Nob3dfcmVwb3J0ZWQAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAFc3RhdGUAAAAAAAfQAAAADEJvb2tpbmdTdGF0ZQAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADlZpc2l0Q29uZmlybWVkAAAAAAABAAAAD3Zpc2l0X2NvbmZpcm1lZAAAAAABAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAAD0RlcG9zaXRSZWZ1bmRlZAAAAAABAAAAEGRlcG9zaXRfcmVmdW5kZWQAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAD0RlcG9zaXRSZWxlYXNlZAAAAAABAAAAEGRlcG9zaXRfcmVsZWFzZWQAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAD0Rpc3B1dGVSZXNvbHZlZAAAAAABAAAAEGRpc3B1dGVfcmVzb2x2ZWQAAAACAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAAAAAAAAKcmVzb2x1dGlvbgAAAAAH0AAAABFEaXNwdXRlUmVzb2x1dGlvbgAAAAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAD1JlbnRlckNoZWNrZWRJbgAAAAABAAAAEXJlbnRlcl9jaGVja2VkX2luAAAAAAAAAgAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAAAAAAACnByb29mX2hhc2gAAAAAA+4AAAAgAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEEJvb2tpbmdDYW5jZWxsZWQAAAABAAAAEWJvb2tpbmdfY2FuY2VsbGVkAAAAAAAAAgAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAAAAAAABXN0YXRlAAAAAAAH0AAAAAxCb29raW5nU3RhdGUAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAEENvbnRyYWN0VW5wYXVzZWQAAAABAAAAEWNvbnRyYWN0X3VucGF1c2VkAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEERpc3B1dGVSZXNwb25kZWQAAAABAAAAEWRpc3B1dGVfcmVzcG9uZGVkAAAAAAAAAgAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAAC",
        "AAAAAgAAAAAAAAAAAAAAEURpc3B1dGVSZXNvbHV0aW9uAAAAAAAAAwAAAAAAAAAAAAAABlJlZnVuZAAAAAAAAAAAAAAAAAAHUmVsZWFzZQAAAAABAAAAAAAAAAVTcGxpdAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAHYm9va2luZwAAAAABAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAA+kAAAfQAAAAB0Jvb2tpbmcAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAIY2hlY2tfaW4AAAADAAAAAAAAAAZyZW50ZXIAAAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAAAAAAACnByb29mX2hhc2gAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAPpAAAH0AAAAAxFc2Nyb3dDb25maWcAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAGY29uZmlnAAAAAAfQAAAADEVzY3Jvd0NvbmZpZwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2Jvb2tpbmcAAAAAAQAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAPpAAAH0AAAAAdCb29raW5nAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAMZnVuZF9ib29raW5nAAAAAgAAAAAAAAAGcmVudGVyAAAAAAATAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAMb3Blbl9kaXNwdXRlAAAAAwAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAAAAAA1ldmlkZW5jZV9oYXNoAAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAANY29uZmlybV92aXNpdAAAAAAAAAIAAAAAAAAABGhvc3QAAAATAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAANdXBkYXRlX2NvbmZpZwAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAKbmV3X2NvbmZpZwAAAAAH0AAAAAxFc2Nyb3dDb25maWcAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAOY2FuY2VsX2Jvb2tpbmcAAAAAAAIAAAAAAAAABnJlbnRlcgAAAAAAEwAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAOY2FuY2VsX2J5X2hvc3QAAAAAAAIAAAAAAAAABGhvc3QAAAATAAAAAAAAAApib29raW5nX2lkAAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAOY3JlYXRlX2Jvb2tpbmcAAAAAAAgAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAAAAAAABnJlbnRlcgAAAAAAEwAAAAAAAAAEaG9zdAAAABMAAAAAAAAADmRlcG9zaXRfYW1vdW50AAAAAAALAAAAAAAAAAp2aXNpdF90aW1lAAAAAAAGAAAAAAAAABFjaGVja19pbl9kZWFkbGluZQAAAAAAAAYAAAAAAAAAFWNvbmZpcm1hdGlvbl9kZWFkbGluZQAAAAAAAAYAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAOZXhwaXJlX2Jvb2tpbmcAAAAAAAEAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAOcmVmdW5kX2Jvb2tpbmcAAAAAAAIAAAAAAAAACmFyYml0cmF0b3IAAAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAMAAAAAAAAACmFyYml0cmF0b3IAAAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAAAAAAACnJlc29sdXRpb24AAAAAB9AAAAARRGlzcHV0ZVJlc29sdXRpb24AAAAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAQY2FuY2VsX2J5X3JlbnRlcgAAAAIAAAAAAAAABnJlbnRlcgAAAAAAEwAAAAAAAAAKYm9va2luZ19pZAAAAAAABgAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAQdXBncmFkZV9jb250cmFjdAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJd2FzbV9oYXNoAAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAScmVzcG9uZF90b19kaXNwdXRlAAAAAAADAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAATcmVwb3J0X2hvc3Rfbm9fc2hvdwAAAAACAAAAAAAAAAZyZW50ZXIAAAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAVcmVwb3J0X3JlbnRlcl9ub19zaG93AAAAAAAAAgAAAAAAAAAEaG9zdAAAABMAAAAAAAAACmJvb2tpbmdfaWQAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    pause: this.txFromJSON<Result<void>>,
        booking: this.txFromJSON<Result<Booking>>,
        unpause: this.txFromJSON<Result<void>>,
        check_in: this.txFromJSON<Result<void>>,
        get_config: this.txFromJSON<Result<EscrowConfig>>,
        initialize: this.txFromJSON<Result<void>>,
        get_booking: this.txFromJSON<Result<Booking>>,
        fund_booking: this.txFromJSON<Result<void>>,
        open_dispute: this.txFromJSON<Result<void>>,
        confirm_visit: this.txFromJSON<Result<void>>,
        update_config: this.txFromJSON<Result<void>>,
        cancel_booking: this.txFromJSON<Result<void>>,
        cancel_by_host: this.txFromJSON<Result<void>>,
        create_booking: this.txFromJSON<Result<void>>,
        expire_booking: this.txFromJSON<Result<void>>,
        refund_booking: this.txFromJSON<Result<void>>,
        resolve_dispute: this.txFromJSON<Result<void>>,
        cancel_by_renter: this.txFromJSON<Result<void>>,
        upgrade_contract: this.txFromJSON<Result<void>>,
        respond_to_dispute: this.txFromJSON<Result<void>>,
        report_host_no_show: this.txFromJSON<Result<void>>,
        report_renter_no_show: this.txFromJSON<Result<void>>
  }
}