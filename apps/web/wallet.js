export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const message = (value) => typeof value === "string" ? value : value?.message || "Wallet request failed";

export function abbreviateAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isTestnet(network) {
  return network?.network === "TESTNET" || network?.networkPassphrase === TESTNET_PASSPHRASE;
}

export function walletAvailability(scope = globalThis) {
  return {
    freighter: typeof scope.freighterApi?.requestAccess === "function",
    rabet: typeof scope.rabet?.connect === "function",
  };
}

export async function connectWallet(kind, scope = globalThis) {
  if (kind === "freighter") {
    const api = scope.freighterApi;
    if (!api?.requestAccess) throw new Error("Freighter extension is not installed");
    const access = await api.requestAccess();
    if (access?.error || !access?.address) throw new Error(message(access?.error));
    const network = api.getNetwork ? await api.getNetwork() : null;
    if (!isTestnet(network)) throw new Error("Switch Freighter to Stellar Testnet before connecting");
    return { kind, address: access.address, signing: "signTransaction", network: "TESTNET" };
  }

  const api = scope.rabet;
  if (!api?.connect) throw new Error("Rabet extension is not installed");
  const access = await api.connect();
  if (access?.error || !access?.publicKey) throw new Error(message(access?.error));
  return { kind, address: access.publicKey, signing: "sign", network: "TESTNET_REQUESTED" };
}

export function disconnectWallet(kind, scope = globalThis) {
  if (kind === "rabet" && typeof scope.rabet?.disconnect === "function") return scope.rabet.disconnect();
  return Promise.resolve();
}
