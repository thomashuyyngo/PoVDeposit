"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Property = {
  id: string;
  slug: string;
  title: string;
  description: string;
  district: string;
  slots: Array<{ id: string; startsAt: string }>;
};

type State =
  | { status: "loading" }
  | { status: "ready"; properties: Property[] }
  | { status: "failed"; message: string };

export function PropertyList() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch("/api/properties")
      .then((response) => {
        if (!response.ok) throw new Error(`Listings unavailable (HTTP ${response.status})`);
        return response.json() as Promise<Property[]>;
      })
      .then((properties) => { if (active) setState({ status: "ready", properties }); })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "failed",
          message: error instanceof Error ? error.message : "Listings unavailable",
        });
      });
    return () => { active = false; };
  }, []);

  if (state.status === "loading") return <p className="empty-state">Loading listings…</p>;
  if (state.status === "failed") return <p className="empty-state">{state.message}</p>;
  if (!state.properties.length) return <p className="empty-state">No approved listings are published yet.</p>;

  return (
    <div className="property-list">
      {state.properties.map((property, index) => (
        <Link className="property-row" href={`/properties/${property.slug}/`} key={property.id}>
          <span className={`property-thumb property-${(index % 3) + 1}`} aria-hidden="true" />
          <span>
            <strong>{property.title}</strong>
            <small>{property.district}</small>
            <small>{property.description}</small>
          </span>
          <span className="deposit">
            <strong>{property.slots.length}</strong>
            <small>{property.slots.length === 1 ? "open slot" : "open slots"}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
