import type { Metadata } from "next";
import { Suspense } from "react";
import { UnreportedList } from "@/components/unreported-list";

export const metadata: Metadata = {
  title: "Unreported: Official Political Records Nobody Is Covering",
  description:
    "New campaign-finance filings, executive orders, court records and votes that no major outlet has reported yet, linked straight to the official record.",
  alternates: { canonical: "/unreported" },
};

export default function UnreportedPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="kicker text-accent">Unreported · Updated hourly</p>
      <h1 className="headline mt-3 text-[2.6rem] md:text-[3.4rem]">On the record. Not in the news.</h1>
      <p className="dek mt-4 text-xl">
        Every hour we scan official records (campaign-finance filings, executive orders, court dockets, votes) and check
        them against everything 21 outlets are reporting. These are the ones none of them has covered in the last 48 hours.
      </p>
      <p className="mt-4 rounded-xl bg-paper p-4 text-sm leading-relaxed text-ink/75">
        These are raw public records, not stories yet. Each links to the original filing so you can see it yourself. When
        one checks out as news, our newsroom turns it into a fact-checked story.
      </p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-sm text-muted">Digging through the records…</p>}>
          <UnreportedList limit={30} />
        </Suspense>
      </div>
    </div>
  );
}
