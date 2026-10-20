# RockLeak architecture

```
                    ┌────────────────────────── SOURCES ───────────────────────────┐
                    │ 21 outlet feeds   X (via Grok)   Kalshi   Polymarket   Gov APIs│
                    └──────┬───────────────┬───────────┬──────────┬───────────┬────┘
                           │               │           │          │           │
                     ┌─────▼────┐    ┌─────▼────┐ ┌────▼──────────▼───┐ ┌─────▼─────┐
  1 every 1-15 min   │ The Wire │    │The Pulse │ │     The Odds      │ │The Record │  4 research
                     │ feeds.ts │    │ pulse.ts │ │    markets.ts     │ │ claude.ts │    + ledger
                     └─────┬────┘    └─────┬────┘ └─────────┬─────────┘ └─────┬─────┘
                           └──── story cluster ─────────────┴──── fact ledger ┘
                                                  │
                         ┌────────────────────────▼─────────────────────────┐
  5 parallel             │ The Panel: Grant · Rosa · Mercer · Vex             │
                         │ (same ledger, structured output, forced concession) │
                         └────────────────────────┬─────────────────────────┘
                                         ┌────────▼────────┐   ┌──────────────┐
  6 / 7                                  │ Quill (editor)  ├──►│  Red Team    │
                                         └────────┬────────┘   └──────┬───────┘
                                                  └───── draft File ──┘
                                                           │
  8                                          Human review → publish → site
```

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js 16 (App Router, Cache Components) on Vercel | Live data cached ~1 min with `"use cache"` + `cacheLife("minutes")` |
| Styling | Tailwind CSS v4 | Brand tokens in `src/app/globals.css` |
| LLM: research, panel, editor | Claude Opus 5.5 (`claude-opus-5-5`) via `@anthropic-ai/sdk` | Structured outputs (Zod), server-side web search, server-side refusal fallback |
| LLM: X / Twitter | Grok (`grok-4.7`) via xAI Responses API + `x_search` tool | ~$5 per 1k posts fetched |
| Markets | Kalshi public API, Polymarket Gamma API | No auth needed for reads |
| Storage (prototype) | `content/seed-stories.json` | Seed Files, produced by hand by the research agents |
| Storage (next) | Postgres (Neon via the Vercel Marketplace) | Tables: `files`, `ledger_facts`, `sources`, `debate_turns`, `corrections`, `wire_items` |
| Scheduling | Vercel Cron → `/api/cron/newsroom` | Hobby plan allows daily crons only; Pro plan for hourly |

## Code map

```
src/lib/types.ts            Domain model (Story/File, Ledger, Coverage, Markets…)
src/lib/sources.ts          Outlet registry: feed URLs + lean labels (verified 2026-10-20)
src/lib/feeds.ts            The Wire: fetch + parse RSS, cluster headlines, blindspots
src/lib/markets.ts          The Odds: Kalshi + Polymarket
src/lib/agents/personas.ts  Grant, Rosa, Mercer, Vex, Quill (system prompts)
src/lib/agents/pulse.ts     The Pulse: Grok x_search
src/lib/agents/claude.ts    Claude helpers: structured() and research() with web search
src/lib/agents/schemas.ts   Zod schemas for every hand-off
src/lib/agents/viral.ts     The Viral Desk + its accuracy check
src/lib/agents/pipeline.ts  The newsroom, end to end
src/lib/dig.ts              The Dig: official records nobody has reported (FEC, Federal Register, Congress, courts)
src/lib/seo.ts              NewsArticle / ClaimReview / FAQPage structured data
src/app/api/*               wire, odds, pipeline (status/run), cron/newsroom
src/app/story/[slug]        The File page
```

## API

| Route | Method | What |
|---|---|---|
| `/api/wire` | GET | Current story clusters from all feeds |
| `/api/odds` | GET | Current midterm markets |
| `/api/dig` | GET | Unreported leads from official records |
| `/api/pipeline` | GET | Which agents are configured |
| `/api/pipeline` | POST | Run the newsroom on the top cluster (`Authorization: Bearer $CRON_SECRET`). Returns a draft File plus the Red Team report. **Publishes nothing.** |
| `/api/cron/newsroom` | GET | Vercel Cron entry point |

## Environment variables

| Name | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | The Record, the Panel, Quill, the Red Team |
| `XAI_API_KEY` | The Pulse (optional; the pipeline runs without it) |
| `XAI_MODEL` | Override the Grok model (default `grok-4.7`) |
| `CRON_SECRET` | Protects pipeline runs |
| `DATA_GOV_API_KEY` | FEC + Congress.gov for The Dig (free; DEMO_KEY runs out after ~10 calls/day) |
| `SITE_URL` | Canonical domain for SEO (defaults to the Vercel URL) |

## Known limits of the prototype

- The full pipeline has **not been run end to end yet**: it needs API keys. The code type-checks against the SDK, but expect prompt tuning on the first runs.
- Drafts aren't stored yet; `/api/pipeline` returns them as JSON.
- Headline clustering is keyword-based. Good enough to spot big stories; an LLM pass can refine it later.
- The CNN, AP, Reuters, Axios, Washington Post and Newsmax feeds are dead, blocked or nonexistent, so those outlets are discovered via Google News RSS (discovery only, under Google's terms).
- Outlet lean labels follow AllSides / Ad Fontes conventions and should be re-checked.
- Vercel function limit: the pipeline can take several minutes, so `maxDuration = 300`. A queue or Vercel Workflow is the next step.
