import Link from "next/link";

/** Politico-style column label: a red ring + small caps, with an optional "more" link. */
export function ColumnHead({ title, href, live = false }: { title: string; href?: string; live?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="flex items-center gap-2.5 text-[0.72rem] font-bold uppercase tracking-[0.14em]">
        <span className={`h-2.5 w-2.5 rounded-full border-2 border-signal ${live ? "animate-pulse bg-signal" : ""}`} />
        {title}
      </span>
      {href && (
        <Link href={href} className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-muted hover:text-signal">
          More →
        </Link>
      )}
    </div>
  );
}
