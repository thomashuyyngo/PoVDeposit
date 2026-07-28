export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const message = (value) => typeof value === "string" ? value : value?.message || "Wallet request failed";

export function abbreviateAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isTestnet(network) {
  return network?.network === "TESTNET" || network?.networkPassphrase === TESTNET_PASSPHRASE;
}

async function freighter(scope) {
  const api = scope.__freighterSdk?.freighterApi || scope.__freighterSdk || scope.freighterApi;
  if (!api) throw new Error("Freighter browser API did not load");
  if (typeof api.isConnected !== "function" || typeof api.requestAccess !== "function") {
    throw new Error("Freighter SDK did not load correctly");
  }
  const connection = await api.isConnected();
  if (connection?.error || !connection?.isConnected) throw new Error("Freighter extension is not installed or is locked");
  return api;
}

export async function walletAvailability(scope = globalThis) {
  let freighterInstalled = false;
  try { await freighter(scope); freighterInstalled = true; } catch { /* show installation guidance */ }
  return { freighter: freighterInstalled, rabet: typeof scope.rabet?.connect === "function" };
}

export async function connectWallet(kind, scope = globalThis) {
  if (kind === "freighter") {
    const api = await freighter(scope);
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
