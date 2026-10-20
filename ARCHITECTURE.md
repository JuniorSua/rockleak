# RockLeak architecture

## How the newsroom actually runs (subscription mode)

The live newsroom runs **inside Claude Code on the owner's Claude subscription**. No Anthropic API key is needed.
T3 Code's scheduler starts a fresh Claude Code run on ProDesktop, the always-on home PC, three times a day (Eastern):

| 9:00 AM | morning | Plans the day: 3–5 ranked candidates. Publishes nothing. |
|---|---|---|
| 5:00 PM | evening | Reports, debates, writes and approves **one** story, then publishes it (or nothing). |
| 10:00 PM | night | Same, for the day's biggest development or the next candidate. |

Each run follows [`newsroom/PLAYBOOK.md`](newsroom/PLAYBOOK.md):

1. `pnpm newsroom brief` collects the wire, the Dig and the odds from this site's own APIs.
2. Claude researches the story with web search.
3. Four sub-agents debate it (Grant, Rosa, Mercer, Vex).
4. Quill writes the draft.
5. **Plumb**, a separate neutral sub-agent, checks it against [`newsroom/STANDARDS.md`](newsroom/STANDARDS.md):
   - opens the sources
   - runs a swap-the-parties symmetry test
   - approves it, sends it back for revision, or rejects it
6. `pnpm newsroom publish` validates the story against `src/lib/story-schema.ts`. It refuses any story without
   Plumb's sign-off, then writes `content/stories.json`.
7. `scripts/deploy.sh` deploys the committed HEAD to Vercel. The run then checks that the story URL is live.

Working files (briefs, plans, drafts, rejected stories) stay on the PC in `newsroom/desk/`, which is gitignored.
To pull a story: `pnpm newsroom unpublish <slug> "<reason>"`, then commit, push and deploy.

The API pipeline below (`src/lib/agents/*`, `/api/pipeline`) is the same newsroom written for API keys. It stays
in place as an option but nothing calls it on a schedule.

## API-key pipeline (optional)

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
  8                                     Plumb (standards) → publish → site
```

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js 16 (App Router, Cache Components) on Vercel | Live data cached ~1 min with `"use cache"` + `cacheLife("minutes")` |
| Styling | Tailwind CSS v4 | Brand tokens in `src/app/globals.css` |
| LLM: research, panel, editor | Claude Opus 5.5 (`claude-opus-5-5`) via `@anthropic-ai/sdk` | Structured outputs (Zod), server-side web search, server-side refusal fallback |
| LLM: X / Twitter | Grok (`grok-4.7`) via xAI Responses API + `x_search` tool | ~$5 per 1k posts fetched |
| Markets | Kalshi public API, Polymarket Gamma API | No auth needed for reads |
| Storage (now) | `content/stories.json` | Written only by `pnpm newsroom publish` (schema-checked, needs Plumb's approval) |
| Storage (next) | Postgres (Neon via the Vercel Marketplace) | Tables: `files`, `ledger_facts`, `sources`, `debate_turns`, `corrections`, `wire_items` |
| Scheduling | T3 Code scheduled tasks on ProDesktop (9am / 5pm / 10pm ET) | Runs Claude Code on the subscription; `/api/cron/newsroom` remains for API-key mode |

## Code map

```
src/lib/types.ts            Domain model (Story/File, Ledger, Coverage, Markets…)
src/lib/sources.ts          Outlet registry: feed URLs + lean labels (verified 2026-10-20)
src/lib/feeds.ts            The Wire: fetch + parse RSS, cluster headlines, blindspots
src/lib/markets.ts          The Odds: Kalshi + Polymarket
src/lib/agents/personas.ts  Grant, Rosa, Mercer, Vex, Quill, Plumb (system prompts)
src/lib/story-schema.ts     Zod schema every published story must pass
scripts/newsroom.mts        Desk tool: brief, agreement, check, publish, unpublish, list
scripts/deploy.sh           Deploy committed HEAD to Vercel production
newsroom/PLAYBOOK.md        What each scheduled run does
newsroom/STANDARDS.md       Plumb's approval checklist
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
| `/api/cron/newsroom` | GET | API-key mode entry point (not scheduled) |

## Environment variables

| Name | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | API-key mode only. The subscription newsroom doesn't need it |
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
