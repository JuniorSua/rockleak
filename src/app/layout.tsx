import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif-display", subsets: ["latin"] });
const headline = Barlow_Semi_Condensed({ variable: "--font-headline", subsets: ["latin"], weight: ["600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "RockLeak — Bedrock facts. Every side.", template: "%s · RockLeak" },
  description:
    "AI-powered political reporting: we read every side, check the receipts, pull the betting odds, let the panel debate, and publish only what survives.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${headline.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
