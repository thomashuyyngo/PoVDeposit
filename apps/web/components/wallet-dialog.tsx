"use client";

import { getNetwork, isConnected, requestAccess } from "@stellar/freighter-api";
import { useEffect, useRef, useState } from "react";
import { isExpectedNetwork, shortAddress } from "../lib/network";
import { walletStorageKey } from "../lib/escrow-transaction";

type Rabet = {
  connect?: () => Promise<{ publicKey?: string; error?: string }>;
  disconnect?: () => Promise<void>;
};

declare global {
  interface Window { rabet?: Rabet }
}

type WalletSession = { kind: "Freighter" | "Rabet"; address: string };
const expectedNetwork = "PUBLIC";
const networkLabel = expectedNetwork === "PUBLIC" ? "Mainnet" : "Testnet";

export function WalletDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [status, setStatus] = useState(`Choose a wallet. ${networkLabel} is required.`);

  useEffect(() => {
    const address = localStorage.getItem(walletStorageKey);
    if (address) setStatus(`Previous public address ${shortAddress(address)}. Reconnect to authorize.`);
  }, []);

  async function connectFreighter() {
    const connection = await isConnected();
    if (!connection.isConnected) throw new Error("Install or unlock Freighter first.");
    const network = await getNetwork();
    if (!isExpectedNetwork(network, expectedNetwork)) throw new Error(`Switch Freighter to Stellar ${networkLabel}.`);
    const access = await requestAccess();
    if (access.error || !access.address) throw new Error(access.error || "Wallet access was rejected.");
    return { kind: "Freighter", address: access.address } as const;
  }

  async function connectRabet() {
    if (typeof window.rabet?.connect !== "function") throw new Error("Install or unlock Rabet first.");
    const access = await window.rabet.connect();
    if (access.error || !access.publicKey) throw new Error(access.error || "Wallet access was rejected.");
    return { kind: "Rabet", address: access.publicKey } as const;
  }

  async function connect(kind: "Freighter" | "Rabet") {
    setStatus(`Waiting for ${kind}…`);
    try {
      const next = kind === "Freighter" ? await connectFreighter() : await connectRabet();
      localStorage.setItem(walletStorageKey, next.address);
      setSession(next);
      setStatus(`${next.kind} connected to ${networkLabel}.`);
      dialog.current?.close();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  }

  async function disconnect() {
    if (session?.kind === "Rabet") await window.rabet?.disconnect?.();
    localStorage.removeItem(walletStorageKey);
    setSession(null);
    setStatus("Wallet disconnected.");
  }

  return (
    <>
      <button className="wallet-trigger" type="button" onClick={() => dialog.current?.showModal()}>
        {session ? `${session.kind} ${shortAddress(session.address)}` : "Connect wallet"}
      </button>
      <dialog className="wallet-modal" ref={dialog} aria-labelledby="wallet-title">
        <div className="modal-head">
          <div><span className="eyebrow">Stellar {networkLabel}</span><h2 id="wallet-title">Connect a wallet</h2></div>
          <button className="icon-button" type="button" aria-label="Close wallet dialog" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <p>Only your public address is stored. The extension handles every approval and signature.</p>
        <button className="wallet-option" type="button" onClick={() => void connect("Freighter")}><strong>Freighter</strong><span>Browser extension →</span></button>
        <button className="wallet-option" type="button" onClick={() => void connect("Rabet")}><strong>Rabet</strong><span>Browser extension →</span></button>
        <p className="wallet-status" role="status" aria-live="polite">{status}</p>
        {session && <button className="text-button" type="button" onClick={() => void disconnect()}>Disconnect current wallet</button>}
      </dialog>
    </>
  );
}
