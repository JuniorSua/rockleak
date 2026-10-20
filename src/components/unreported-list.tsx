import { getLeads } from "@/lib/dig";
import { shortDate } from "@/lib/format";

// Official records that no outlet in our Wire has covered yet. These are records, not
// conclusions: we say what the filing shows and link to it.

export async function UnreportedList({ limit = 6, compact = false }: { limit?: number; compact?: boolean }) {
  const leads = (await getLeads()).filter((l) => l.novelty >= 0.5).slice(0, limit);
  if (!leads.length) return <p className="text-sm text-muted">Nothing new in the records right now. We check every hour.</p>;
  return (
    <ol className="divide-y divide-rule">
      {leads.map((l) => (
        <li key={l.id} className="py-5 first:pt-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="kicker text-accent">{l.source}</span>
            <span>{l.kind}</span>
            {l.date && <span>· {shortDate(l.date)}</span>}
            <span className="font-semibold text-ink">
              · {l.coveredBy.length === 0 ? "No coverage in the last 48 hours" : `Barely covered (${l.coveredBy.length} outlet${l.coveredBy.length > 1 ? "s" : ""})`}
            </span>
          </div>
          <a href={l.url} target="_blank" rel="noreferrer" className={`headline mt-1.5 block leading-snug hover:underline ${compact ? "text-xl" : "text-2xl"}`}>
            {l.title}
          </a>
          {!compact && <p className="mt-1.5 max-w-3xl leading-relaxed text-ink/75">{l.detail}</p>}
          <a href={l.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs font-semibold text-accent hover:underline">
            See the official record →
          </a>
        </li>
      ))}
    </ol>
  );
}
