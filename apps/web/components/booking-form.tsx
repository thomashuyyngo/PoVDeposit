"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  renter: z.string().regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar public address."),
  host: z.string().regex(/^G[A-Z2-7]{55}$/, "Enter a valid host public address."),
  depositXlm: z.number().positive().max(100),
  rulesAccepted: z.literal(true, { error: "Accept the disclosed deposit rules." }),
});
type Fields = z.infer<typeof schema>;

export function BookingForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: async (fields: Fields) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          renter: fields.renter,
          host: fields.host,
          deposit: Math.round(fields.depositXlm * 10_000_000),
        }),
      });
      const body = await response.json() as { id?: string; state?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Booking request failed.");
      return body;
    },
  });

  return (
    <form className="booking-form" onSubmit={handleSubmit((fields) => mutation.mutate(fields))}>
      <label>Renter public address<input {...register("renter")} placeholder="G…" autoComplete="off" />{errors.renter && <small role="alert">{errors.renter.message}</small>}</label>
      <label>Host public address<input {...register("host")} placeholder="G…" autoComplete="off" />{errors.host && <small role="alert">{errors.host.message}</small>}</label>
      <label>Deposit in XLM<input {...register("depositXlm", { valueAsNumber: true })} type="number" min="0.0000001" max="100" step="0.0000001" defaultValue="0.5" />{errors.depositXlm && <small role="alert">{errors.depositXlm.message}</small>}</label>
      <label className="check"><input {...register("rulesAccepted")} type="checkbox" />I understand the attendance, no-show and dispute settlement rules.</label>
      {errors.rulesAccepted && <small role="alert">{errors.rulesAccepted.message}</small>}
      <button className="primary" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Creating…" : "Create pending booking"}</button>
      <p className="form-status" role="status" aria-live="polite">
        {mutation.isError ? mutation.error.message : mutation.data ? `Booking ${mutation.data.id} · ${mutation.data.state}` : "No funds move until you review and sign in your wallet."}
      </p>
    </form>
  );
}
