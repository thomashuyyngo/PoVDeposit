export type StellarNetwork = "PUBLIC" | "TESTNET";

const PASSPHRASES: Record<StellarNetwork, string> = {
  PUBLIC: "Public Global Stellar Network ; September 2015",
  TESTNET: "Test SDF Network ; September 2015",
};

const HORIZON_BY_NETWORK: Record<StellarNetwork, string> = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
};

const RPC_BY_NETWORK: Record<StellarNetwork, string> = {
  PUBLIC: "https://stellar.api.onfinality.io/public",
  TESTNET: "https://soroban-testnet.stellar.org",
};

export type StellarSettings = {
  network: StellarNetwork;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  contractId: string;
};

/**
 * Resolves one coherent view of the ledger the deployment talks to. Every default
 * follows the selected network, because handing the browser a Mainnet passphrase
 * next to testnet endpoints makes the wallet sign for one chain and submit to
 * another, which fails after the user has already approved the transaction.
 */
export function readStellarSettings(env: NodeJS.ProcessEnv = process.env): StellarSettings {
  const network: StellarNetwork = env.STELLAR_NETWORK?.trim().toUpperCase() === "TESTNET"
    ? "TESTNET"
    : "PUBLIC";
  const networkPassphrase = env.STELLAR_NETWORK_PASSPHRASE?.trim() || PASSPHRASES[network];
  if (networkPassphrase !== PASSPHRASES[network]) {
    throw new Error(`STELLAR_NETWORK_PASSPHRASE does not belong to ${network}`);
  }

  const horizonUrl = env.STELLAR_HORIZON_URL?.trim() || HORIZON_BY_NETWORK[network];
  if (new URL(horizonUrl).hostname !== new URL(HORIZON_BY_NETWORK[network]).hostname) {
    throw new Error(`STELLAR_HORIZON_URL must serve ${network}`);
  }

  return {
    network,
    networkPassphrase,
    rpcUrl: env.STELLAR_RPC_URL?.trim() || RPC_BY_NETWORK[network],
    horizonUrl,
    contractId: env.ESCROW_CONTRACT_ID?.trim() || "",
  };
}
