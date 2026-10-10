import type { Metadata } from "next";

/**
 * Full-page SEO package: canonical, robots, Open Graph, Twitter, and structured data.
 *
 * Render as the first metadata block in each route:
 *   export const metadata: Metadata = {
 *     ...SEO.default(page),
 *   };
 */
const SITE_URL = process.env.SPL_SITE_URL ?? "https://spl-trading.workers.dev";
const APP_NAME = "SPL Trading";

/** Default page metadata, merged with each route's page-level metadata. */
export const SEO = {
  default: (page: {
    title: string;
    description: string;
    path?: string;
    type?: "website" | "article";
  }) => {
    const path = page.path ?? "";
    const ogUrl = `${SITE_URL}${path}`;
    return {
      title: page.title,
      description: page.description,
      alternates: { canonical: `${SITE_URL}${path}` },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
      },
      openGraph: {
        type: page.type ?? "website",
        locale: "en_US",
        siteName: APP_NAME,
        title: page.title,
        description: page.description,
        url: ogUrl,
        images: [
          {
            url: `${SITE_URL}/og.png`,
            width: 1200,
            height: 630,
            alt: page.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        site: "@SPLTrading",
        creator: "@SPLTrading",
        title: page.title,
        description: page.description,
        images: [`${SITE_URL}/og.png`],
      },
      icons: {
        icon: "/favicon.ico",
        apple: "/apple-touch-icon.png",
      },
      other: {
        "application-name": APP_NAME,
        "apple-mobile-web-app-title": APP_NAME,
        "apple-mobile-web-app-capable": "yes",
        "mobile-web-app-capable": "yes",
        "theme-color": "#0f172a",
      },
    } satisfies Metadata;
  },

  /** JSON-LD structured data for the organization. */
  jsonLd: () => {
    const base = `${SITE_URL}`;
    const data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: base,
      logo: `${base}/favicon.ico`,
      description:
        "SPL Trading is a trader cabinet for USDT deposits and payouts — fund with USDT on BEP-20, manage payout accounts, and read every movement in a plain itemised ledger.",
      potentialAction: [
        {
          "@type": "RegisterAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/auth/sign-up` },
          description: "Create a trader account.",
        },
        {
          "@type": "LoginAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/auth/sign-in` },
          description: "Sign in to your trader cabinet.",
        },
      ],
    };
    return JSON.stringify(data);
  },
};

/** Inject structured data into the page head. */
export function JsonLd({ children }: { children: React.ReactNode }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: children as string }} />
  );
}

/** Site-wide structured data injected once in the layout. */
export function SiteJsonLd() {
  return <JsonLd>{SEO.jsonLd()}</JsonLd>;
}
