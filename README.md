<img src="public/brand/mark.svg" width="72" height="72" alt="RockLeak">

# RockLeak

**Bedrock facts. Every side.** An AI newsroom for American politics: agents read every side's coverage, check it
against the primary record, pull Kalshi and Polymarket odds, debate it in public, and publish only what survives.

- **Vision:** [VISION.md](VISION.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Brand options:** [brand/README.md](brand/README.md) (also at `/brand` on the site)

## Run locally

```bash
pnpm install
cp .env.example .env.local   # add keys to run the agent pipeline (the site works without them)
pnpm dev
```

The site's Wire and Odds pages pull live data with no keys. The agent pipeline (`POST /api/pipeline`) needs
`ANTHROPIC_API_KEY` (and optionally `XAI_API_KEY`) plus `CRON_SECRET`.

The newsroom itself runs on a Claude subscription through scheduled Claude Code runs (9am, 5pm and 10pm ET). See
[`newsroom/PLAYBOOK.md`](newsroom/PLAYBOOK.md). Every story must pass Plumb, the neutral standards editor
([`newsroom/STANDARDS.md`](newsroom/STANDARDS.md)), before `pnpm newsroom publish` will accept it.
