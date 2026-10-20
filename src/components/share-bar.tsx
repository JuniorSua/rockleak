"use client";

import { useState } from "react";

/** Share to X, native share sheet (phones), or copy the link. */
export function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const x = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const btn = "rounded-full border border-rule px-3.5 py-1.5 text-xs font-semibold hover:border-ink";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={x} target="_blank" rel="noreferrer" className={btn}>
        Post on X
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          if (navigator.share) {
            await navigator.share({ title: text, url }).catch(() => {});
          } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
      >
        {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}
