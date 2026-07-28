import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Providers } from "../components/providers";
import { WalletDialog } from "../components/wallet-dialog";
import "./styles.css";

export const metadata: Metadata = {
  title: "Proof-of-Visit Deposit",
  description: "Transparent property-viewing escrow on Stellar Testnet.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="site-header">
            <Link className="brand" href="/"><span>⌁</span> Proof-of-Visit Deposit</Link>
            <nav aria-label="Primary navigation">
              <Link href="/properties/">Properties</Link><Link href="/renter/">My bookings</Link><Link href="/host/">Host</Link><Link href="/help/">Help</Link><Link href="/security/">Security</Link>
            </nav>
            <WalletDialog />
          </header>
          {children}
          <footer><strong>Proof-of-Visit Deposit</strong><span>Stellar Testnet only · No Mainnet funds</span><nav aria-label="Footer navigation"><Link href="/docs/">Docs</Link><Link href="/security/">Security</Link><Link href="/help/">Help</Link></nav></footer>
        </Providers>
      </body>
    </html>
  );
}
