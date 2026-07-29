import Link from "next/link";
import { HeroBuilding } from "../components/hero-building";
import { RecentActivity } from "../components/recent-activity";

const properties = [
  ["Modern 2-bed apartment", "Greenway · Horizon District", "0.5 XLM", "2 bed · 2 bath · 78 m²"],
  ["City studio with balcony", "Riverside · Central District", "0.3 XLM", "Studio · 1 bath · 42 m²"],
  ["Spacious 1-bed residence", "Lakeside · North Point", "0.4 XLM", "1 bed · 1 bath · 60 m²"],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="network-pill">⌁ Stellar Mainnet</span>
          <h1>Book the viewing.<br /><em>Keep the deposit fair.</em></h1>
          <p>A transparent escrow for rental appointments. Review the rule, lock a small deposit, prove the visit and receive the contract-defined outcome.</p>
          <div className="hero-actions"><Link className="primary" href="/properties/">Browse properties</Link><Link className="secondary" href="/book/">Review deposit rules</Link></div>
        </div>
        <HeroBuilding />
      </section>

      <section className="workspace" aria-label="Product overview">
        <article className="panel property-panel">
          <div className="panel-title"><div><span className="eyebrow">Property search</span><h2>Find a property to view</h2></div><Link href="/properties/">View all →</Link></div>
          <label className="search"><span className="sr-only">Search listings</span><input placeholder="Search by area, address or keyword" /></label>
          <div className="property-list">{properties.map(([title, area, deposit, facts], index) =>
            <Link className="property-row" href="/properties/modern-apartment/" key={title}>
              <span className={`property-thumb property-${index + 1}`} aria-hidden="true" />
              <span><strong>{title}</strong><small>{area}</small><small>{facts}</small></span>
              <span className="deposit"><strong>{deposit}</strong><small>Suggested deposit</small></span>
            </Link>
          )}</div>
        </article>

        <article className="panel rules-panel">
          <span className="eyebrow">Visible before signing</span><h2>Deposit rules. Plain and fair.</h2>
          {[
            ["01", "You set the time", "Choose an available viewing slot."],
            ["02", "Deposit held in escrow", "The contract holds native Mainnet XLM."],
            ["03", "Check in to confirm", "Use a short-lived QR or manual code."],
            ["04", "Refund or fair resolution", "Attend for a refund; disputes pause settlement."],
          ].map(([number, title, copy]) => <div className="rule" key={number}><b>{number}</b><span><strong>{title}</strong><small>{copy}</small></span></div>)}
        </article>

        <article className="panel timeline-panel">
          <span className="eyebrow">Booking state</span><h2>Your booking</h2>
          <div className="booking-summary"><span>Modern 2-bed apartment</span><strong>0.5 XLM</strong></div>
          <ol className="timeline"><li className="done">Booked<small>Slot reserved</small></li><li className="active">Deposit locked<small>Escrow is active</small></li><li>Check in<small>At the property</small></li><li>Refund<small>After confirmation</small></li></ol>
          <Link className="secondary wide" href="/booking/receipt/">View booking details</Link>
        </article>

        <article className="panel host-panel">
          <span className="eyebrow">Host workflow</span><h2>Run trustworthy visits</h2>
          <ul><li>Create an approved listing</li><li>Publish conflict-free slots</li><li>Confirm attendance</li><li>Release the contract outcome</li></ul>
          <Link className="secondary wide" href="/host/">Open host workspace</Link>
        </article>
      </section>
      <section className="docs-banner"><div><span><strong>Verified Mainnet activity</strong><small>Recent contract-backed bookings recorded by the application.</small></span></div><RecentActivity /></section>
      <section className="docs-banner"><div><span className="doc-icon">▤</span><span><strong>Documentation & guides</strong><small>Understand the flow, rules and protections.</small></span></div><Link className="primary" href="/docs/">Read the docs →</Link></section>
    </main>
  );
}
