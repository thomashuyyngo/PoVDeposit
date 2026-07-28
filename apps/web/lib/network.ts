export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

export function isTestnet(network: { network?: string; networkPassphrase?: string }) {
  return network.network === "TESTNET" || network.networkPassphrase === TESTNET_PASSPHRASE;
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
