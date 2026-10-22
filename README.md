<img src="public/brand/mark.svg" width="72" height="72" alt="RockLeak">

# RockLeak

**Politics, minus the noise.** An AI newsroom for American politics: agents found the day's essential story, checked
it against the primary record, argued it from every side, and published only what a neutral AI standards editor
approved, alongside live Kalshi and Polymarket odds.

**Live (archived):** [rockleak-roan.vercel.app](https://rockleak-roan.vercel.app) · **Case study:**
[docs/CASE_STUDY.md](docs/CASE_STUDY.md)

> **Status:** finished. The newsroom published 10 drops from Oct 20–22, 2026, ahead of the midterms. The scheduled
> runs are switched off and the site is kept as an archive. The odds page still updates live.

| Homepage | A "question" drop | Live odds |
|---|---|---|
| ![Homepage](docs/screenshots/home-mobile.png) | ![Question drop](docs/screenshots/question-story.png) | ![Odds](docs/screenshots/odds.png) |

## What it does

- **Drops, not a feed.** A few checked stories a day, each answering *What happened?*, *Why does it matter to me?*
  and *What's true?*, with the short version up front and the full detail one tap away.
- **Every fact has a receipt.** Each key fact is rated (confirmed, likely, misleading, false) and linked to its
  source: court orders, FEC filings, state election data.
- **The Question.** Drops can lead with the hard question people are asking, answered right underneath from the
  record.
- **Live odds.** Kalshi and Polymarket favorites side by side, with close calls (favorite at 60% or less, or the
  markets disagree) flagged.

## How the newsroom worked

Scheduled Claude Code runs (9 AM, 5 PM and 10 PM ET) followed [`newsroom/PLAYBOOK.md`](newsroom/PLAYBOOK.md):
brief → pick → report → a four-agent debate (right, left, center, outsider) → write → **Plumb**, a neutral standards
editor ([`newsroom/STANDARDS.md`](newsroom/STANDARDS.md)) → publish. `pnpm newsroom publish` validates every story
against a schema and refuses anything Plumb hasn't approved. Details are in [ARCHITECTURE.md](ARCHITECTURE.md) and
the original pitch is in [VISION.md](VISION.md).

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Zod · Claude (Claude Code and the
Anthropic SDK) · Kalshi and Polymarket public APIs · FEC and Congress.gov APIs · Wikimedia Commons · Vercel

## Run locally

```bash
pnpm install
pnpm dev
```

The site, the published drops and the live odds work with no keys. To run the optional API-key agent pipeline
(`POST /api/pipeline`), copy `.env.example` to `.env.local` and add `ANTHROPIC_API_KEY` and `CRON_SECRET`
(`XAI_API_KEY` and `DATA_GOV_API_KEY` are optional).
