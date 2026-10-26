import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider, T } from "@/lib/i18n";
import { Onboarding } from "@/components/Onboarding";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_DESCRIPTION, TAGLINE } from "@/lib/brand";
import { jsonLdString, siteJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";

const site = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: `nata: ${TAGLINE.replace(/\.$/, "").toLowerCase()}`, template: "%s | nata" },
  description: SITE_DESCRIPTION,
  applicationName: "nata",
  keywords: ["nata", "Stellar", "Soroban", "pay-per-visit", "proof of visit", "cashback", "x402", "MCP", "Lisbon", "azulejo"],
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "nata",
    title: `nata: ${TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "./",
    locale: "en_US",
    alternateLocale: ["pt_PT", "es_ES"],
  },
  twitter: { card: "summary_large_image", title: `nata: ${TAGLINE}`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "nata" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d4ba0" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1424" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd(site)) }} />
        <I18nProvider>
          <SiteHeader />
          <Onboarding />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">{children}</main>
          <footer className="mt-8">
            <div className="azulejo-band" aria-hidden />
            <p className="mx-auto w-full max-w-2xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-muted">
              <T k="footer.testnet" />
            </p>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
