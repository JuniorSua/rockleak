import Link from "next/link";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { Logo } from "@/components/logo";
import { MarketsLine } from "@/components/markets-line";

const NAV = [
  { href: "/midterms", label: "Midterms" },
  { href: "/unreported", label: "Unreported" },
  { href: "/wire", label: "The Wire" },
  { href: "/about", label: "How it works" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-white">
      {/* Quiet status line: countdown + the two numbers everyone wants */}
      <div className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-hidden whitespace-nowrap px-5 py-1.5 text-xs text-muted">
          <Countdown />
          <span className="text-rule">|</span>
          <Suspense fallback={<span>Loading odds…</span>}>
            <MarketsLine />
          </Suspense>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" aria-label="RockLeak home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-[0.95rem] font-medium md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/80 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex gap-6 overflow-x-auto px-5 pb-3 text-sm font-medium md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-ink/80">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
