import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "nata: get paid to visit",
  description: "Pay-per-visit campaigns on Stellar. Places only pay when you really show up.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "nata" },
};

export const viewport: Viewport = {
  themeColor: "#f2b33d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              <span className="text-burnt">●</span> nata
            </Link>
            <div className="flex gap-1 text-sm font-semibold">
              <Link href="/" className="rounded-full px-3 py-2 hover:bg-line">Places</Link>
              <Link href="/scan" className="rounded-full px-3 py-2 hover:bg-line">Scan</Link>
              <Link href="/merchant" className="rounded-full px-3 py-2 hover:bg-line">Merchant</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 pb-8 text-xs text-muted">
          Stellar Testnet demo. Rewards are test tokens with no monetary value.
        </footer>
      </body>
    </html>
  );
}
