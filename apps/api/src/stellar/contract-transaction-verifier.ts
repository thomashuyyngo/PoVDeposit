import { Inject, Injectable } from "@nestjs/common";
import { rpc, scValToNative } from "@stellar/stellar-sdk";

type RpcReader = Pick<rpc.Server, "getTransaction" | "getEvents">;
export const STELLAR_RPC = Symbol("STELLAR_RPC");

@Injectable()
export class ContractTransactionVerifier {
  constructor(@Inject(STELLAR_RPC) private readonly server: RpcReader) {}

  async verifyFunding(transactionHash: string, bookingId: string) {
    return this.verifyEvent(transactionHash, bookingId, "booking_funded");
  }

  async verifyCheckIn(transactionHash: string, bookingId: string) {
    return this.verifyEvent(transactionHash, bookingId, "renter_checked_in");
  }

  async verifySettlement(transactionHash: string, bookingId: string) {
    return this.verifyEvent(transactionHash, bookingId, "visit_confirmed");
  }

  private async verifyEvent(transactionHash: string, bookingId: string, expectedEvent: string) {
    const contractId = process.env.ESCROW_CONTRACT_ID;
    if (!contractId) throw new Error("ESCROW_CONTRACT_ID is not configured");
    const transaction = await this.server.getTransaction(transactionHash);
    if (transaction.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error("Transaction is not successful on Stellar Testnet");
    }
    const { events } = await this.server.getEvents({
      startLedger: transaction.ledger,
      endLedger: transaction.ledger + 1,
      filters: [{ type: "contract", contractIds: [contractId] }],
    });
    const matched = events.some((event) => {
      if (!event.inSuccessfulContractCall || event.txHash !== transactionHash) return false;
      const topics = event.topic.map((topic) => scValToNative(topic) as unknown);
      return topics[0] === expectedEvent && String(topics[1]) === bookingId;
    });
    if (!matched) throw new Error(`Transaction does not contain the expected ${expectedEvent} event`);
    return { ledger: transaction.ledger, confirmedAt: new Date(transaction.createdAt * 1000).toISOString() };
  }
}
