"use client";

import { useState } from "react";
import { nativeToScVal } from "@stellar/stellar-sdk";
import {
  actionLabel,
  availableActions,
  fetchBooking,
  postBookingAction,
  type Booking,
  type BookingAction,
} from "../lib/booking";
import {
  escrowMethods,
  invokeEscrow,
  walletStorageKey,
  type StellarConfig,
} from "../lib/contract";

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function stellarConfig(): Promise<StellarConfig> {
  const response = await fetch("/api/stellar-config");
  const config = await response.json() as StellarConfig;
  if (!response.ok || !config.contractId) throw new Error("Escrow contract is not configured.");
  return config;
}

export function BookingActions() {
  const [reference, setReference] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState("Enter a booking reference to manage it.");
  const [busy, setBusy] = useState(false);

  const wallet = typeof window === "undefined" ? null : localStorage.getItem(walletStorageKey);

  const load = async () => {
    setBusy(true);
    try {
      const loaded = await fetchBooking(reference.trim());
      setBooking(loaded);
      setStatus(`Booking is ${loaded.state}.`);
    } catch (error) {
      setBooking(null);
      setStatus(error instanceof Error ? error.message : "Could not load the booking.");
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: BookingAction) => {
    if (!booking || !wallet) return;
    setBusy(true);
    try {
      let updated: Booking;
      if (action === "check-in") {
        // No contract call moves funds here, so the renter commits a proof hash
        // that the host can check against the visit before releasing the deposit.
        setStatus("Recording the check-in proof…");
        const proofHash = await sha256(`${booking.id}:${booking.onChainBookingId}:${wallet}`);
        updated = await postBookingAction(booking.id, action, { actor: wallet, proofHash });
      } else {
        const method = action === "confirm" ? escrowMethods.confirmVisit : escrowMethods.cancelBooking;
        setStatus("Approve the escrow call in Freighter…");
        const config = await stellarConfig();
        const { transactionHash } = await invokeEscrow(config, method, [
          nativeToScVal(wallet, { type: "address" }),
          nativeToScVal(BigInt(booking.onChainBookingId), { type: "u64" }),
        ], wallet);
        setStatus("Waiting for the ledger to confirm…");
        updated = await postBookingAction(booking.id, action, { actor: wallet, transactionHash });
      }
      setBooking(updated);
      setStatus(`Booking is ${updated.state}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The escrow rejected that action.");
    } finally {
      setBusy(false);
    }
  };

  const actions = booking ? availableActions(booking, wallet) : [];

  return (
    <div className="booking-actions">
      <label className="search">
        <span className="sr-only">Booking reference</span>
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Booking reference"
        />
      </label>
      <button type="button" onClick={load} disabled={busy || !reference.trim()}>Load booking</button>

      {booking ? (
        <dl className="details">
          <div><dt>State</dt><dd>{booking.state}</dd></div>
          <div><dt>Deposit</dt><dd>{booking.depositAmount} stroops</dd></div>
          <div><dt>Visit</dt><dd>{new Date(booking.visitTime).toLocaleString()}</dd></div>
        </dl>
      ) : null}

      {booking && !wallet ? <p aria-live="polite">Connect Freighter to act on this booking.</p> : null}
      {booking && wallet && !actions.length
        ? <p aria-live="polite">This wallet has no action available in state {booking.state}.</p>
        : null}

      {actions.map((action) => (
        <button key={action} type="button" onClick={() => run(action)} disabled={busy}>
          {actionLabel(action)}
        </button>
      ))}

      <p aria-live="polite">{status}</p>
    </div>
  );
}
