"use client";

import { useEffect, useState } from "react";

type Slot = { id: string; startsAt: string; endsAt: string };

type Property = {
  id: string;
  slug: string;
  title: string;
  description: string;
  district: string;
  host?: { address?: string };
  images?: Array<{ url: string; altText: string }>;
  slots?: Slot[];
};

/** A listing without a host address still renders; the page is not worth losing over one field. */
function hostLabel(property: Property): string {
  const address = property.host?.address;
  if (!address) return "Not published";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

type State =
  | { status: "loading" }
  | { status: "ready"; property: Property }
  | { status: "failed"; message: string };

export function PropertyDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch(`/api/properties/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Listing unavailable (HTTP ${response.status})`);
        return response.json() as Promise<Property>;
      })
      .then((property) => { if (active) setState({ status: "ready", property }); })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "failed",
          message: error instanceof Error ? error.message : "Listing unavailable",
        });
      });
    return () => { active = false; };
  }, [slug]);

  if (state.status === "loading") return <p className="empty-state">Loading the listing…</p>;
  if (state.status === "failed") return <p className="empty-state">{state.message}</p>;

  const { property } = state;
  return (
    <>
      <dl className="details">
        <div><dt>Area</dt><dd>{property.district}</dd></div>
        <div><dt>Host</dt><dd>{hostLabel(property)}</dd></div>
        <div><dt>About</dt><dd>{property.description}</dd></div>
      </dl>
      <h2>Available viewing times</h2>
      {property.slots?.length ? (
        <ul className="slot-list">
          {property.slots.map((slot) => (
            <li key={slot.id}>{new Date(slot.startsAt).toLocaleString()}</li>
          ))}
        </ul>
      ) : <p className="empty-state">Every slot on this listing is taken.</p>}
    </>
  );
}
