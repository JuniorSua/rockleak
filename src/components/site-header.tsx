import Link from "next/link";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { Logo } from "@/components/logo";
import { OddsTicker } from "@/components/odds-ticker";

const SECTIONS = [
  { href: "/", label: "Front Page" },
  { href: "/wire", label: "The Wire" },
  { href: "/odds", label: "The Odds" },
  { href: "/panel", label: "The Panel" },
  { href: "/method", label: "How We Check" },
  { href: "/brand", label: "Brand Lab" },
];

export function SiteHeader() {
  return (
    <header>
      {/* Leak Desk bar: countdown + live odds ticker */}
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-1.5 kicker">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-2 w-2 animate-pulse rounded-full bg-signal" />
            Leak Desk
          </span>
          <span className="whitespace-nowrap text-white/80">
            <Countdown />
          </span>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <Suspense fallback={<span className="text-white/40">Loading odds…</span>}>
              <OddsTicker />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 py-5">
          <span className="hidden byline sm:block">Bedrock facts. Every side.</span>
          <Link href="/" aria-label="RockLeak home" className="col-start-2">
            <Logo size="lg" />
          </Link>
          <span className="col-start-3 flex justify-end">
            <Link href="/method" className="hidden byline text-ink! hover:text-signal! sm:block">
              How we check
            </Link>
          </span>
        </div>
      </div>

      {/* Section nav */}
      <nav className="sticky top-0 z-40 border-y border-rule bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-5 py-3 text-[0.95rem]">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="whitespace-nowrap hover:text-signal">
              {s.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
