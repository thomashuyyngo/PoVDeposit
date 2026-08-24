import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingActions } from "../../components/booking-actions";
import { PropertyDetail } from "../../components/property-detail";
import { PropertyList } from "../../components/property-list";
import { BookingForm } from "../../components/booking-form";
import { pageContent, staticPaths } from "../../lib/pages";
import { stellarProfile } from "../../lib/stellar-network";

// Check-in, attendance, cancellation and the receipt all act on a booking that
// already exists, so they carry the live escrow controls rather than prose alone.
const BOOKING_ACTION_PAGES = new Set(["check-in", "attendance", "cancel", "booking/receipt"]);

export function generateStaticParams() {
  return staticPaths;
}

export default async function DetailPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  const content = pageContent[path];
  if (!content) notFound();
  return (
    <main className="section-page">
      <section className="section-hero">
        <span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.copy}</p>
        <div className="step-grid">{content.actions.map((action, index) => <article key={action}><b>0{index + 1}</b><h2>{action}</h2><p>{index === 0 ? "Start with the current verified state." : index === 1 ? "Review all conditions before continuing." : "Complete the action with an auditable result."}</p></article>)}</div>
      </section>
      {path === "book" && <section className="form-panel"><div><span className="eyebrow">Live booking desk</span><h2>Create a pending booking</h2><p>The API creates only an intent. Funding is confirmed from a verified Mainnet transaction, never from the browser alone.</p></div><BookingForm /></section>}
      {path === "properties" && <section className="form-panel"><div><span className="eyebrow">Live listings</span><h2>Properties open for viewing</h2></div><PropertyList /></section>}
      {path.startsWith("properties/") && <section className="form-panel"><div><span className="eyebrow">Live listing</span><h2>What this property offers</h2></div><PropertyDetail slug={path.slice("properties/".length)} /></section>}
      {BOOKING_ACTION_PAGES.has(path) && <section className="form-panel"><div><span className="eyebrow">Live escrow desk</span><h2>Act on a booking</h2><p>Load a booking to see its escrow state. Only the move the contract allows for your wallet in that state is offered.</p></div><BookingActions /></section>}
      <section className="state-strip"><span><b>Network</b> Stellar {stellarProfile().label}</span><span><b>Settlement</b> Contract-enforced</span><span><b>Privacy</b> Public addresses only</span><Link href="/help/">Need help? →</Link></section>
    </main>
  );
}
