# RockLeak: the vision

> **Bedrock facts. Every side.**
> A political news site where AI agents read every side's coverage, check it against the primary record, pull the
> betting odds, argue about it in public, and publish only what survives.

**The name:** *Rock* is bedrock, the hard facts that don't move no matter who is talking. *Leak* is the WikiLeaks
spirit: truth breaking through spin and showing you the documents. The style is Politico (insider, fast, punchy),
with an investigative "leak desk" edge.

---

## 1. Why this, why now

- People don't trust any single outlet. On the same event, Fox, CNN and Politico often run three different stories.
- Tools like Ground News and AllSides show you *who* covered a story. **Nobody tells you what is actually true,
  with receipts, and then shows you how each side spun it.**
- X is where news breaks and where most misinformation spreads. Community Notes helps, but it stays on X and lags.
- Prediction markets (Kalshi, Polymarket) are now a mainstream signal, but nobody puts them next to the facts.
- The midterms are **Nov 3, 2026**. Political attention is at its peak, and that's the launch window.

## 2. The formula: the "RockLeak File"

Every story is a **File** with the same sections, in the same order, so readers learn the format:

| Section | What it is | Why it hooks people |
|---|---|---|
| **Headline** | Catchy, curiosity-driving, *literally true* | Drives clicks without clickbait |
| **The Bottom Line** | 2–3 sentences: what is actually true | The answer people came for |
| **The Ledger** | One numbered list of core facts, each with a verdict and a receipt (link) | The "leak": show the documents |
| **The Story** | The article, Politico-style, neutral and punchy | Depth |
| **Claims, Checked** | The viral claims about this story, each rated | Shareable "is it true?" cards |
| **How They Spun It** | Each outlet's headline, from left to right, plus the frame it used | Entertaining and eye-opening |
| **The Panel Debates** | Grant (right), Rosa (left), Mercer (center) and Vex (outsider) argue from the same facts. **Each must concede something.** | The entertainment layer: personalities and drama |
| **Where all four agree** | The consensus | The "truth" payoff |
| **The Odds** | Live Kalshi and Polymarket prices tied to the story | "What does the money say?" |
| **The Pulse on X** | What's trending, what people claim, Community Notes | Real-time relevance |
| **Still Unknown** | Shown as redacted "CLASSIFIED" items we'll update | Brings readers back |
| **Agreement score** | 0–100: how much the panel converged | The new metric: one number for how settled a story is |

**Core principle:** one set of facts, multiple valid perspectives. Facts are never debated. Their *meaning* is.

## 3. The newsroom (AI agents)

| Agent | Job | Powered by |
|---|---|---|
| **The Wire** | Reads 21 outlets' political feeds every few minutes and clusters same-event headlines; flags **blindspots** (one side not covering a story) | RSS + Google News discovery |
| **The Pulse** | Searches X for trends, viral claims and Community Notes | Grok (xAI `x_search`) |
| **The Odds** | Live midterm markets | Kalshi + Polymarket public APIs |
| **The Record** | Verifies against primary sources: Congress.gov, FEC, Federal Register, CourtListener, BLS/CBO, transcripts | Claude + web search + government APIs |
| **The Panel** | Grant, Rosa, Mercer and Vex debate from the same ledger | Claude (one model, four personas) |
| **Quill** | The editor: writes the File from the ledger and the debate | Claude |
| **The Red Team** | A separate pass that hunts for unsupported sentences and oversold headlines | Claude |
| **Human editor** | Approves before anything goes live; logs corrections | You |

*Later:* run one or more personas on a different model (e.g. Grok for Vex, an open model for another) so the panel
isn't one model arguing with itself. That's genuine multi-AI debate.

## 4. Coverage baseline (start here, then set the cadence)

**Beat #1: American politics, midterms first.**

What we monitor continuously:
1. **Midterms 2026:** House/Senate control and the ~15 competitive Senate races (TX, ME, NC, MI, GA, OH, IA, AK, NH…), plus governor races.
2. **Congress:** votes, bills, shutdown and appropriations fights.
3. **White House:** executive orders (Federal Register), statements, rallies.
4. **Courts:** Supreme Court and major federal rulings (CourtListener).
5. **Money:** FEC filings. *The pre-general reports land around Oct 22, a natural first data story.*
6. **Viral claims:** whatever political claim is blowing up on X.

**Breaking-news triggers** (any one of these opens a new File):
- The Wire sees the same event in **≥5 outlets from both sides within 60 minutes**.
- A tracked market moves **≥5 points within an hour**.
- Grok sees a political term spiking on X, or a **Community Note on a high-reach post** by a candidate or official.
- A primary-source event: a roll-call vote, a ruling in a tracked case, a new executive order, an FEC filing deadline.

**Proposed cadence** (to decide after a week of watching the Wire):
- *Continuous:* Wire every 5–15 min, Odds every minute, Pulse hourly.
- *Daily 7am ET:* **"The Drop"**, a morning briefing of the 5 biggest Files (site + newsletter + X thread).
- *As triggered:* breaking Files, aiming for under 2 hours from trigger to a human-approved File.
- *Weekly:* a long-form Panel debate (podcast/video-friendly).
- *Nov 3:* an **election-night live desk** with markets vs. results vs. claims, in real time.

## 5. Going viral (traffic → trust → money)

- **Headline formulas** that are catchy and true: "The $64 Million Question in Texas", "Fox Says X. CNN Says Y. The Record Says Z."
- **Shareable cards:** every Claim and every "How They Spun It" block exports as an image for X, Instagram and TikTok.
- **Panel clips:** the four personas become recurring characters with avatars and voices, suited to short video and the podcast.
- **Spin Leaderboard:** a running tally of which outlets' claims held up, which is controversial and shareable.
- **"Markets vs. Polls vs. Facts"** chart for every race. Election-night traffic magnet.
- **The owner's podcast:** we track its episodes as a source, and invite its hosts to "challenge the Panel".

**Monetization path:** free site + newsletter → sponsorships for The Drop → a **RockLeak Pro** membership (alerts,
race dashboards, full debate transcripts, archive) → an API/data license for the fact ledger. *(Prediction-market
affiliate links are possible but have legal and state restrictions; review before using.)*

## 6. Trust rules (non-negotiable)

1. No invented quotes, numbers or events. If it's not in the ledger with a receipt, it doesn't run.
2. Headlines must be literally true. The Red Team fails anything that oversells.
3. A human approves every File before it goes live, and **especially any claim of wrongdoing by a named person**. AI-written content is *not* protected by Section 230; defamation risk is real.
4. We link to outlets and quote only briefly. We never republish their articles.
5. AI is labeled clearly. Personas are openly AI and never pose as real people. Several states require AI labels on election content.
6. Corrections are dated and visible on the File.
7. X is a **signal, not a source of truth**: great for leads and gauging what people believe; facts still need primary records.

## 7. Roadmap

| Phase | When | What |
|---|---|---|
| **0: Prototype** | *Now (done)* | Site, live Wire, live Odds, File format, Panel, pipeline code, brand options |
| **1: Midterm sprint** | Oct 20 – Nov 3 | Add API keys, store drafts in a database, add an admin review screen, publish The Drop daily, social cards, election-night desk |
| **2: Trust engine** | Nov – Dec | Corrections log, Spin Leaderboard, primary-source connectors (Congress.gov, FEC, CourtListener), the podcast as a source, multi-model panel |
| **3: Grow** | 2027 | Newsletter + Pro membership, more beats (economy, world), video/podcast Panel, mobile app |

## 8. Decisions for the owner

1. **Logo:** pick a concept in the Brand lab (`/brand`).
2. **API keys:** Anthropic (Claude) and xAI (Grok) are needed to run the newsroom. Roughly **$2–5 per File** at first (estimated, not yet measured).
3. **Domain:** e.g. rockleak.com / rockleak.news.
4. **Podcast:** send the name and website so we can add it as a tracked source.
5. **Human review:** who approves Files before they publish?
6. **Persona names and looks:** keep Grant / Rosa / Mercer / Vex / Quill, or rename them?
