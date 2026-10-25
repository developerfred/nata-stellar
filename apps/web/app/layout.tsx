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
  themeColor: "#1d4ba0",
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
