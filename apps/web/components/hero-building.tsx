"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./building-scene").then((module) => module.BuildingScene), {
  ssr: false,
  loading: () => <div className="building-scene building-fallback" aria-label="Apartment escrow journey loading" />,
});

export function HeroBuilding() {
  return <Scene />;
}
