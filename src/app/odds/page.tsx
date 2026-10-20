import type { Metadata } from "next";
import { Suspense } from "react";
import { OddsBoard } from "@/components/odds-board";

export const metadata: Metadata = { title: "The Odds" };

export default function OddsPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="kicker text-signal">The Odds · live</p>
      <h1 className="headline mt-3 text-5xl">Where the money says the midterms are going</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink/75">
        Live prices from Kalshi (U.S.-regulated) and Polymarket. A price of 62¢ means traders put the odds at about 62%.
        Markets react faster than polls, but they show what people expect, not what&apos;s true. We show both platforms
        side by side so you can see when they disagree.
      </p>
      <Suspense fallback={<p className="mt-10 kicker text-muted">Pulling the markets…</p>}>
        <OddsBoard />
      </Suspense>
      <p className="mt-10 text-xs text-muted">
        Data: Kalshi public market-data API (bid/ask midpoint) and Polymarket Gamma API. Refreshed every minute. Not
        betting advice. Polymarket&apos;s international exchange is not available to U.S. users.
      </p>
    </div>
  );
}
