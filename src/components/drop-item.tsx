import Image from "next/image";
import Link from "next/link";
import { VERDICT_META, dropLabel, etTime } from "@/lib/format";
import { dropNumber } from "@/lib/stories";
import type { Story } from "@/lib/types";

/** The small picture beside a drop: its photo, or its big number when it has no photo. */
function Thumb({ story }: { story: Story }) {
  const box = "relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg sm:h-[124px] sm:w-[186px]";
  if (story.image)
    return (
      <div className={`${box} bg-paper`}>
        <Image src={story.image.src} alt={story.image.alt} fill sizes="(min-width: 640px) 186px, 88px" className="object-cover object-[50%_30%]" />
      </div>
    );
  if (!story.stat) return null;
  const long = story.stat.value.length > 6;
  return (
    <div className={`${box} flex items-center justify-center bg-ink px-2 text-white`}>
      <div className="sheen absolute inset-x-0 top-0 h-1" />
      <span className={`headline text-center leading-none ${long ? "text-lg sm:text-2xl" : "text-[1.7rem] sm:text-5xl"}`}>{story.stat.value}</span>
    </div>
  );
}

/** "● 6 confirmed · ◭ 1 misleading · ✕ 1 false" across the story's facts and claims. */
function TruthLine({ story }: { story: Story }) {
  const all = [...story.coreFacts, ...story.claims];
  const counts = (["confirmed", "misleading", "false"] as const)
    .map((v) => [v, all.filter((x) => x.verdict === v).length] as const)
    .filter(([, n]) => n > 0);
  if (!counts.length) return null;
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 text-xs font-semibold">
      {counts.map(([v, n]) => (
        <span key={v} style={{ color: VERDICT_META[v].color }}>
          {VERDICT_META[v].icon} {n} {VERDICT_META[v].label.toLowerCase()}
        </span>
      ))}
    </p>
  );
}

/** One entry in the stacked feed: number and time, title, a short teaser. */
export function DropItem({ story }: { story: Story }) {
  return (
    <article>
      <Link href={`/story/${story.slug}`} className="group flex gap-4 py-7 sm:gap-7">
        <div className="min-w-0 flex-1">
          <p className="mono text-[0.68rem] uppercase tracking-wider text-muted">
            <span className="font-bold text-ink">{dropLabel(dropNumber(story))}</span> · {etTime(story.publishedAt)} ·{" "}
            {story.question ? <span className="font-bold text-accent">The question</span> : story.kicker}
          </p>
          <h3 className="headline mt-2 text-[1.4rem] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-[1.8rem]">
            {story.headline}
          </h3>
          <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-ink/70">{story.dek}</p>
          {story.question ? (
            <p className="mt-3 text-xs font-semibold text-accent">
              What the record says <span aria-hidden>→</span>
            </p>
          ) : (
            <TruthLine story={story} />
          )}
        </div>
        <Thumb story={story} />
      </Link>
    </article>
  );
}
