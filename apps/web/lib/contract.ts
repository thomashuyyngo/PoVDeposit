import { signTransaction } from "@stellar/freighter-api";
import {
  Contract,
  Horizon,
  nativeToScVal,
  rpc,
  TransactionBuilder,
  type xdr,
} from "@stellar/stellar-sdk";

export const walletStorageKey = "pov-deposit:last-public-wallet";

export const escrowMethods = {
  booking: "booking",
  cancelBooking: "cancel_booking",
  confirmVisit: "confirm_visit",
  createBooking: "create_booking",
  fundBooking: "fund_booking",
  initialize: "initialize",
} as const;

export type EscrowMethod = (typeof escrowMethods)[keyof typeof escrowMethods];

export type StellarConfig = {
  network: string;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  contractId: string;
};

export function escrowOperation(contractId: string, method: EscrowMethod, args: xdr.ScVal[]) {
  return new Contract(contractId).call(method, ...args);
}

export function bookingArguments(input: {
  bookingId: string;
  renter: string;
  host: string;
  depositAmount: string;
  visitTime: number;
}) {
  return [
    nativeToScVal(BigInt(input.bookingId), { type: "u64" }),
    nativeToScVal(input.renter, { type: "address" }),
    nativeToScVal(input.host, { type: "address" }),
    nativeToScVal(BigInt(input.depositAmount), { type: "i128" }),
    nativeToScVal(BigInt(input.visitTime), { type: "u64" }),
  ];
}

export async function invokeEscrow(
  config: StellarConfig,
  method: EscrowMethod,
  args: xdr.ScVal[],
  address: string,
) {
  const horizon = new Horizon.Server(config.horizonUrl);
  const server = new rpc.Server(config.rpcUrl);
  const account = await horizon.loadAccount(address);
  const transaction = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(escrowOperation(config.contractId, method, args))
    .setTimeout(180)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) throw new Error(simulation.error);
  const prepared = rpc.assembleTransaction(transaction, simulation).build();
  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: config.networkPassphrase,
    address,
  });
  if (signed.error || !signed.signedTxXdr) throw new Error(signed.error || "Wallet signature was rejected.");
  const submitted = await server.sendTransaction(
    TransactionBuilder.fromXDR(signed.signedTxXdr, config.networkPassphrase),
  );
  if (submitted.status === "ERROR") throw new Error("Soroban transaction was rejected.");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await server.getTransaction(submitted.hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { transactionHash: submitted.hash };
    }
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Soroban transaction failed.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Soroban confirmation timed out.");
}
