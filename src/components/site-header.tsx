import Link from "next/link";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Drops" },
  { href: "/midterms", label: "Odds" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-ink bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" aria-label="RockLeak home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold sm:gap-7">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/70 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
