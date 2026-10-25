import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider, T } from "@/lib/i18n";
import { Onboarding } from "@/components/Onboarding";
import { SiteHeader } from "@/components/SiteHeader";

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
        <I18nProvider>
          <SiteHeader />
          <Onboarding />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
          <footer className="mx-auto w-full max-w-2xl px-4 pb-8 text-xs text-muted">
            <T k="footer.testnet" />
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
