export type StellarNetwork = "PUBLIC" | "TESTNET";

type NetworkProfile = {
  network: StellarNetwork;
  label: string;
  horizonUrl: string;
  explorerBase: string;
};

const PROFILES: Record<StellarNetwork, NetworkProfile> = {
  PUBLIC: {
    network: "PUBLIC",
    label: "Mainnet",
    horizonUrl: "https://horizon.stellar.org",
    explorerBase: "https://stellar.expert/explorer/public",
  },
  TESTNET: {
    network: "TESTNET",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    explorerBase: "https://stellar.expert/explorer/testnet",
  },
};

/**
 * NEXT_PUBLIC_STELLAR_NETWORK is inlined at build time, so this resolves once and
 * every caller — wallet gate, payment submission, explorer links — agrees on the
 * same ledger. Mainnet stays the default so an unset variable cannot quietly send
 * a production build at the test network.
 */
export function stellarProfile(
  raw: string | undefined = process.env.NEXT_PUBLIC_STELLAR_NETWORK,
): NetworkProfile {
  return raw?.trim().toUpperCase() === "TESTNET" ? PROFILES.TESTNET : PROFILES.PUBLIC;
}

export function explorerTransactionUrl(hash: string, profile = stellarProfile()): string {
  return `${profile.explorerBase}/tx/${hash}`;
}
