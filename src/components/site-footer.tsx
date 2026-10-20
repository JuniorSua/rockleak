import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            RockLeak reads every side, checks the receipts against primary sources, pulls the prediction-market odds,
            and lets a panel of AI analysts argue it out. We publish what survives.
          </p>
          <p className="mt-4 kicker text-amber">Prototype edition · every story pending human review</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="kicker text-white">Read</p>
          <Link className="block hover:text-white" href="/">Front page</Link>
          <Link className="block hover:text-white" href="/wire">The Wire</Link>
          <Link className="block hover:text-white" href="/odds">The Odds</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="kicker text-white">How it works</p>
          <Link className="block hover:text-white" href="/panel">The Panel</Link>
          <Link className="block hover:text-white" href="/method">Method &amp; standards</Link>
          <Link className="block hover:text-white" href="/brand">Brand lab</Link>
        </div>
      </div>
    </footer>
  );
}
