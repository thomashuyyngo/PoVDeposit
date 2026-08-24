"use client";

import { useEffect, useState } from "react";
import { explorerTransactionUrl } from "../lib/stellar-network";

type Activity = {
  id: string;
  renter: string;
  state: string;
  fundingTransactionHash?: string;
  settlementTransactionHash?: string;
};

export function RecentActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  useEffect(() => {
    fetch("/api/bookings/activity/recent")
      .then((response) => response.ok ? response.json() : [])
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  if (!items.length) return <p>No verified Mainnet bookings yet.</p>;
  return <div className="activity-list">{items.map((item) => {
    const hash = item.settlementTransactionHash || item.fundingTransactionHash;
    return <a href={hash ? explorerTransactionUrl(hash) : undefined} key={item.id} target="_blank" rel="noreferrer">
      <strong>{item.state}</strong><span>{item.renter.slice(0, 8)}…{item.renter.slice(-6)}</span>
    </a>;
  })}</div>;
}
