import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Meridian Supply", template: "%s · Meridian Supply" },
  description:
    "Business purchasing, contract pricing, quotes, and approvals in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="shell">
            <Link className="brand" href="/">
              MERIDIAN
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/catalog">Catalog</Link>
              <Link href="/quick-order">Quick order</Link>
              <Link href="/quotes">Quotes</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/approvals">Approvals</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
