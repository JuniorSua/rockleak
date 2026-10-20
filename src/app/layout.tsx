import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE, jsonLd } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif-display", subsets: ["latin"] });
const headline = Barlow_Semi_Condensed({ variable: "--font-headline", subsets: ["latin"], weight: ["600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: ${TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, title: `${SITE_NAME}: ${TAGLINE}`, description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: `${SITE_NAME}: ${TAGLINE}`, description: DESCRIPTION },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

const ORG = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/mark.svg`,
  slogan: TAGLINE,
  publishingPrinciples: `${SITE_URL}/about`,
  correctionsPolicy: `${SITE_URL}/about#corrections`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${headline.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ORG)} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
