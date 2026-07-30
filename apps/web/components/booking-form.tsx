"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { nativeToScVal } from "@stellar/stellar-sdk";
import {
  bookingArguments,
  escrowMethods,
  invokeEscrow,
  type StellarConfig,
  walletStorageKey,
} from "../lib/contract";

const schema = z.object({
  selection: z.string().min(1, "Choose an available viewing time."),
  renter: z.string().regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar public address."),
  depositXlm: z.number().positive().max(100),
  rulesAccepted: z.literal(true, { error: "Accept the disclosed deposit rules." }),
});
type Fields = z.infer<typeof schema>;
type Property = {
  id: string;
  slug: string;
  title: string;
  host: { address: string };
  slots: Array<{ id: string; startsAt: string }>;
};

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function BookingForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({ resolver: zodResolver(schema) });
  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Could not load viewing times.");
      return response.json() as Promise<Property[]>;
    },
  });
  const mutation = useMutation({
    mutationFn: async (fields: Fields) => {
      const [propertyId, slotId] = fields.selection.split(":");
      const property = properties.data?.find((item) => item.id === propertyId);
      const slot = property?.slots.find((item) => item.id === slotId);
      if (!property || !slot) throw new Error("Selected viewing time is no longer available.");
      const renter = localStorage.getItem(walletStorageKey);
      if (!renter) throw new Error("Connect Freighter before creating a booking.");
      if (renter !== fields.renter) throw new Error("Renter address must match the connected Freighter account.");
      const evidenceHash = await sha256(`${property.id}:${slot.id}:${fields.renter}`);
      const depositAmount = String(Math.round(fields.depositXlm * 10_000_000));
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingId: property.slug,
          renter: fields.renter,
          host: property.host.address,
          depositAmount,
          visitTime: slot.startsAt,
          evidenceHash,
        }),
      });
      const body = await response.json() as {
        id?: string;
        onChainBookingId?: string;
        state?: string;
        error?: string;
      };
      if (!response.ok || !body.id || !body.onChainBookingId) {
        throw new Error(body.error || "Booking request failed.");
      }
      const configResponse = await fetch("/api/stellar-config");
      const config = await configResponse.json() as StellarConfig;
      if (!configResponse.ok || !config.contractId) throw new Error("Escrow contract is not configured.");
      const created = await invokeEscrow(config, escrowMethods.createBooking, bookingArguments({
        bookingId: body.onChainBookingId,
        renter,
        host: property.host.address,
        depositAmount,
        visitTime: Math.floor(new Date(slot.startsAt).getTime() / 1_000),
      }), renter);
      const funded = await invokeEscrow(config, escrowMethods.fundBooking, [
        nativeToScVal(renter, { type: "address" }),
        nativeToScVal(BigInt(body.onChainBookingId), { type: "u64" }),
      ], renter);
      const fundedResponse = await fetch(`/api/bookings/${body.id}/fund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: funded.transactionHash }),
      });
      if (!fundedResponse.ok) {
        const failure = await fundedResponse.json() as { message?: string };
        throw new Error(failure.message || "On-chain funding could not be verified.");
      }
      return {
        ...body,
        state: "FUNDED",
        createTransactionHash: created.transactionHash,
        fundingTransactionHash: funded.transactionHash,
      };
    },
  });

  return (
    <form className="booking-form" onSubmit={handleSubmit((fields) => mutation.mutate(fields))}>
      <label>Property and viewing time
        <select {...register("selection")} defaultValue="">
          <option disabled value="">{properties.isLoading ? "Loading times…" : "Choose a time"}</option>
          {properties.data?.flatMap((property) => property.slots.map((slot) => (
            <option key={slot.id} value={`${property.id}:${slot.id}`}>
              {property.title} · {new Date(slot.startsAt).toLocaleString()}
            </option>
          )))}
        </select>
        {errors.selection && <small role="alert">{errors.selection.message}</small>}
      </label>
      <label>Renter public address<input {...register("renter")} placeholder="G…" autoComplete="off" />{errors.renter && <small role="alert">{errors.renter.message}</small>}</label>
      <label>Deposit in XLM<input {...register("depositXlm", { valueAsNumber: true })} type="number" min="0.0000001" max="100" step="0.0000001" defaultValue="0.5" />{errors.depositXlm && <small role="alert">{errors.depositXlm.message}</small>}</label>
      <label className="check"><input {...register("rulesAccepted")} type="checkbox" />I understand the attendance, no-show and dispute settlement rules.</label>
      {errors.rulesAccepted && <small role="alert">{errors.rulesAccepted.message}</small>}
      <button className="primary" disabled={mutation.isPending || properties.isLoading} type="submit">{mutation.isPending ? "Creating…" : "Create pending booking"}</button>
      <p className="form-status" role="status" aria-live="polite">
        {properties.isError
          ? properties.error.message
          : mutation.isError
            ? mutation.error.message
            : mutation.data
              ? `Booking ${mutation.data.id} · ${mutation.data.state}\nCreate ${mutation.data.createTransactionHash}\nFund ${mutation.data.fundingTransactionHash}`
              : "No funds move until you review and sign in your wallet."}
      </p>
    </form>
  );
}
