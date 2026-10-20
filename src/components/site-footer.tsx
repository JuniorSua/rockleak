import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            We check political news against the official record, show how every side spun it, and dig up what nobody
            else is reporting. Written with AI, checked against sources, approved by people.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Read</p>
          <Link className="block text-muted hover:text-ink" href="/">Front page</Link>
          <Link className="block text-muted hover:text-ink" href="/midterms">Midterms 2026</Link>
          <Link className="block text-muted hover:text-ink" href="/unreported">Unreported</Link>
          <Link className="block text-muted hover:text-ink" href="/wire">The Wire</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">About</p>
          <Link className="block text-muted hover:text-ink" href="/about">How it works</Link>
          <Link className="block text-muted hover:text-ink" href="/about#standards">Standards</Link>
          <Link className="block text-muted hover:text-ink" href="/about#corrections">Corrections</Link>
          <Link className="block text-muted hover:text-ink" href="/brand">Brand lab</Link>
        </div>
      </div>
    </footer>
  );
}
