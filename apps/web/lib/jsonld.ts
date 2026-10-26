import { SITE_DESCRIPTION } from "@/lib/brand";
import { FACTS } from "@/lib/docs/content";

/** schema.org graph for the whole site: organization, website and the web application. */
export function siteJsonLd(site: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        name: "nata",
        url: `${site}/`,
        logo: `${site}/icons/512`,
        sameAs: [FACTS.repo],
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: `${site}/`,
        name: "nata",
        description: SITE_DESCRIPTION,
        inLanguage: ["en", "pt", "es"],
        publisher: { "@id": `${site}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${site}/#app`,
        name: "nata",
        url: `${site}/`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any (progressive web app)",
        description: SITE_DESCRIPTION,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        codeRepository: FACTS.repo,
        publisher: { "@id": `${site}/#organization` },
      },
    ],
  };
}

/** Serializes JSON-LD for an inline script tag without letting the data close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
