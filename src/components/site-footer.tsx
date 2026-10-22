import Link from "next/link";
import { TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="mx-auto flex max-w-3xl flex-wrap items-baseline justify-between gap-4 px-5 py-8 text-sm">
        <p className="text-muted">
          <span className="font-semibold text-ink">RockLeak</span> · {TAGLINE}
        </p>
        <nav className="flex gap-5 text-muted">
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/about#truth" className="hover:text-ink">How we check</Link>
          <Link href="/about#corrections" className="hover:text-ink">Corrections</Link>
        </nav>
      </div>
    </footer>
  );
}
