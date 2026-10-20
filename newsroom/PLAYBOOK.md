# RockLeak newsroom playbook

The newsroom runs inside Claude Code on the owner's Claude subscription (no API keys). T3 Code's scheduler
starts a fresh run three times a day on ProDesktop, which is always on. Times are Eastern:

| Run | Time | Job |
| --- | --- | --- |
| `morning` | 9:00 AM | **Plan the day.** Read overnight news and records; pick 3–5 candidates. Publishes nothing. |
| `evening` | 5:00 PM | **Publish one story**, usually the plan's #1, unless something bigger broke. |
| `night` | 10:00 PM | **Publish one story**: the day's most important development, or the next-best candidate. |

At most one story per run. **Publishing nothing is a valid outcome.** A thin or shaky story hurts the brand more
than a quiet evening does.

Working files go in `newsroom/desk/<YYYY-MM-DD>/` (gitignored, so they stay on this PC). Use the ET date: `TZ=America/New_York date +%F`.
Each story gets its own folder, `<dir>` = `newsroom/desk/<date>/<edition>/`.

---

## 0. Before anything (every run)

1. **Work only in `/home/junior/.t3/projects/rockleak`.** If you started anywhere else, such as a T3 worktree under
   `~/.t3/worktrees/`, `cd` there and stay there. Don't create worktrees or branches. Run `git status -sb`.
   - If the branch is **not** `foundation`, stop. Someone is working on another branch. Report it and do nothing else.
   - Uncommitted changes outside `content/` and `newsroom/` are someone else's work in progress. Don't touch, stage, stash or commit them.
2. Run `git pull --ff-only origin foundation`. If that fails because of local changes, carry on. Publishing only commits `content/stories.json`.
3. Run `pnpm newsroom brief <edition>` to get the wire (21 outlets, left to right), the Dig (official records, flagged when no outlet has covered them), live odds and what's already published.

## 1. Morning run: plan the day

1. Read the brief. Then run 3–6 web searches for overnight US political news it may miss:
   - breaking news
   - court rulings
   - new polls
   - FEC filings
   - X/Twitter storms that outlets are now writing about
2. Score each candidate. **Newness counts most.** RockLeak's edge is what nobody has reported, or what everyone missed:
   - **Unreported**: an official record no outlet has covered (Dig leads with novelty 1), or a fact buried in a filing.
   - **Missed angle**: a story everyone covers where the record shows something the coverage leaves out or gets wrong.
   - **Big and contested**: dominant on every side but framed very differently. Our fact-check plus a side-by-side comparison is the value.
   - **Midterms**: Election Day is Nov 3, 2026. Races, money, voting rules and odds all count.
   - **Skip** anything already published unless there's a real new fact. Also skip anything that rests on one anonymous source or on social posts alone.
3. Write `newsroom/desk/<date>/plan.md`. For each candidate (ranked) include:
   - a working headline
   - why it's new, in one line
   - the 2–4 official sources to pull
   - which outlets have it (left, center, right)
   - legal or fairness risks
   - "ready by 5pm?" yes or no
4. Do a light check on #1 and #2. Confirm the key record exists and says what the lead claims. Note anything that changes the ranking.
5. Final reply: the ranked list with one line each. No publishing.

## 2. Evening and night runs: report, write, approve, publish

### 2a. Pick
Read `plan.md`, if there is one, and the fresh brief. Pick the single best candidate. A big development since the plan was written can outrank it. On the night run, prefer what moved during the day. Write `<dir>/pick.md` with the pick and one sentence on why.

### 2b. Report (you, the desk chief)
Research with WebSearch and WebFetch. Go to primary records first:
- FEC, congress.gov, Senate and House roll calls, court dockets (CourtListener)
- the Federal Register, agency releases, official statements and transcripts

Then outlets on the left, center and right.

**FEC records:**
- Use the FEC API through the site, which holds the data.gov key:
  `pnpm newsroom fec schedules/schedule_e/ committee_id=C00901223 sort=-expenditure_date per_page=20`
  - Other paths: `committee/<id>/`, `committee/<id>/filings/`, `schedules/schedule_a/`, `candidate/<id>/`.
  - The committee ID is inside Dig lead IDs (`fec-ie-<COMMITTEE>-<CANDIDATE>-<S|O>`).
  - The limit is 60 calls a minute. The command prints how many are left.
- Filing images on `docquery.fec.gov` block WebFetch. If you need the filing itself, try these:
  - Raw filing: `curl -sA "Mozilla/5.0" https://docquery.fec.gov/dcdev/posted/<filing id>.fec`
  - PDF: `curl -sA "Mozilla/5.0" -o /tmp/f.pdf https://docquery.fec.gov/pdf/<last 3 digits of image#>/<image#>/<image#>.pdf`, then open it with Read.
- Schedule E dates mean different things:
  - `dissemination_date`: when the ad first ran
  - `expenditure_date`: when it was paid, which can be after the filing
  - `filing_date`: when the FEC received it
- One filing can list several lines, such as support for one candidate and opposition to another. Count the money once.
- A record you can't open isn't confirmed. Pick something you can verify instead.

**Sites that block WebFetch (403):** for example the Columbus Dispatch, cleveland.com, Axios and many local outlets. Try these in order:
1. The site's RSS feed (`/feed/`), which often has the full text.
2. The same AP story on another site.
3. `curl -sA "Mozilla/5.0" <url>`.
4. A different outlet.

Write `ledger.json`. It's the fact base for everything that follows, and `assemble` copies it into the story unchanged:
```json
{ "coreFacts": [{ "text", "verdict", "sources": [{ "label", "url", "tier" }] }],
  "claims": [{ "claim", "claimant", "verdict", "explanation", "sources": [...] }],
  "coverage": [{ "outlet", "lean", "headline", "url", "framing" }],
  "xPulse": { "summary", "trending": [] },
  "markets": [{ "platform", "question", "probability", "url", "asOf" }],
  "stillUnknown": [] }
```
- `coreFacts`:
  - 5–8 facts, each with a verdict and at least 1 source.
  - Use primary sources where they exist, marked `tier: "primary"`.
  - **A fact's text says only what its sources say.** Your own caveats and inferences go in `stillUnknown` or in a claim's `explanation`, never inside a fact attributed to someone else.
- `claims`: 2–5 things politicians, campaigns or viral posts are saying, each rated.
- `coverage`:
  - 4–8 outlets, from at least two sides of the spectrum.
  - Use each outlet's own article URL. Open the Google News redirect to find it.
  - `lean` is one of left, lean-left, center, lean-right, right.
- **X reaction:**
  - Search for notable posts, Community Notes, or reporting about the reaction on X.
  - If you find nothing reliable, write `xPulse.summary` as "No notable X reaction beyond the outlets above." with `trending: []`.
  - Posts are leads, never proof.
- `markets`:
  - Odds for this story's race or question, from the brief.
  - If the brief doesn't have them, search kalshi.com and polymarket.com.
  - Label each contract exactly, for example "Polymarket · Ohio Senate · Democratic Party".
  - `probability` is 0–1. Set `asOf` to now.
  - Leave the list empty rather than using an unrelated market.

### 2c. Debate (4 sub-agents in parallel)
1. Build each prompt with `pnpm newsroom prompt <Grant|Rosa|Mercer|Vex> <dir>/ledger.json`. It prints the persona,
   the numbered ledger and the exact reply format. Use each output as that sub-agent's whole prompt.
2. Launch all four in ONE message with the Agent tool, `model: "sonnet"`.
3. Save the four JSON replies, in the order Grant, Rosa, Mercer, Vex, as `<dir>/debate.json`. This is an array of
   4 objects with `position`, `argument`, `concedes`, `acceptsFacts` and `challenges`.
4. If an analyst challenges a fact, re-check that fact. If the challenge holds, fix or downgrade it in `ledger.json`.

### 2d. Write (you, as Quill)
Write as Quill, using Quill's system prompt in personas.ts. The reader doesn't follow politics, so be plain, concrete and short.

1. Write `<dir>/article.json` with these fields:
   - `slug`: lowercase-with-dashes, under 90 characters.
   - `category`: one of midterms, congress, white-house, courts, economy, campaigns, foreign-policy.
   - `kicker`: 40 characters max, e.g. "SENATE 2026".
   - `headline` (120 characters max):
     - catchy and literally true
     - the most surprising TRUE thing goes first
     - numbers beat adjectives
     - no question headlines, no "slams"
   - `dek` (320 max), `body` (5–9 short paragraphs), `bottomLine`, `consensus` (what all four analysts accept).
   - `status`: verified, developing or contested.
   - `stat` {value (14 max), label (160 max)}: one big number backed by a confirmed fact.
   - `tldr` {what, why, truth}, and `newAngle` (what other coverage missed).
   - `seo`:
     - title of 60 characters max
     - description of 160 max
     - keywords people actually search for
     - 3–5 FAQ entries answered from the ledger
   - `social`:
     - 3–5 headline variants {text, score, rationale}
     - an xPost of 270 max
     - a thread of 3–5 posts, each 280 max
     - a shortVideoHook
     - shareCardText
   - **Never put a person's name in an SEO keyword next to an unproven allegation.**
   - Leave out `publishedAt`, `review`, the ledger fields and `agreementScore`. They're added for you.
2. **Debate turns are published.** Read them against the ledger.
   - If a turn states something the ledger doesn't support, add a corrected `debate` array to article.json: [{persona, position, argument, concedes}] × 4, in the same order.
   - Fix accuracy only, never the analyst's view.
3. Run `pnpm newsroom assemble <dir>`. It merges the ledger, the article and the debate into `draft.json`, computes the agreement score, and runs `check`. Fix anything `check` reports in ledger.json or article.json, then run assemble again.

### 2e. Approve (Plumb, the neutral standards editor)
Launch ONE fresh sub-agent with the Agent tool, at the default model, not sonnet. Its prompt must include:
- Plumb's system prompt from `src/lib/agents/personas.ts`
- the full text of `newsroom/STANDARDS.md`
- the paths to `<dir>/draft.json` and `content/stories.json` (to check that it's new)
- the FEC and blocked-site notes from 2b
- "Review this draft. You did not write it and you owe its writer nothing."

Plumb opens the sources itself and replies with the JSON in STANDARDS.md. Save it as `<dir>/review.json`.

- **APPROVE**: `pnpm newsroom review <dir>/draft.json <dir>/review.json <edition>`, then go to 2f.
- **APPROVE_WITH_EDITS**: Plumb has approved, subject to wording fixes.
  1. Apply each `requiredFixes` item to ledger.json or article.json.
  2. If a fix breaks a length limit, shorten it but keep its meaning.
  3. Run assemble again.
  4. Run `pnpm newsroom review …`, then go to 2f.
- **REVISE**: the story has a substance problem.
  1. Apply every fix.
  2. Run assemble again.
  3. Launch a NEW Plumb for round 2. Give it everything above plus round 1's `review.json` and a list of what you changed. Save its verdict as `review-2.json`.
  - Round 2 must decide APPROVE, APPROVE_WITH_EDITS or REJECT. There's no third round.
- **REJECT**: don't publish. Keep the draft in the desk. If there's time, you may try the plan's next candidate once (2a onward). Otherwise publish nothing.

### 2f. Publish
1. `pnpm newsroom publish <dir>/draft.json`. This re-checks the draft, refuses it without Plumb's approval, and stamps the real publish time.
2. `git add content/stories.json && git commit -m "Publish: <headline>" -- content/stories.json`
   - Commit only that file.
   - End the message with the Co-Authored-By line used in this repo's history.
3. `git push origin foundation`. If it's rejected, run `git pull --rebase --autostash origin foundation`, then push again.
4. `scripts/deploy.sh --content-only`. This ships the last deployed code plus the new `content/`, so no one's untested code goes live with a story.
   - If it says FAILED, wait 2 minutes and run it once more. A slow government API can time out a build, and a failed build leaves the old site live.
5. Verify: `curl -s https://rockleak-roan.vercel.app/story/<slug>` returns 200 and contains the headline. Retry every 60 seconds, up to 5 times.
   - If it never goes live, say so plainly in the report.
   - Never claim it's live without that check.

## 3. Report (final reply of every run)
The owner reads this on an iPhone. Keep it to 6 lines or fewer, with markdown links and no jargon:
- **Published:** the headline, as a [link](https://rockleak-roan.vercel.app/story/slug), plus one line on why it's new.
- **Or nothing published:** say why (Plumb rejected it, with the reason, or nothing cleared the bar).
- Plumb's one-line note.
- Anything the owner should know or decide.

Also append the same lines to `newsroom/desk/log.md` with the date and edition.

## Hard rules
- Nothing reaches `content/stories.json` except through `pnpm newsroom publish`, after Plumb approves.
- Don't edit site code during a newsroom run. If something is broken, report it.
- Never run `git checkout`, `git switch`, `git reset`, `git stash` (except via `--autostash`), or force-push.
- To take a story down when the owner asks:
  1. `pnpm newsroom unpublish <slug> "<reason>"`
  2. Commit `content/stories.json`.
  3. Push.
  4. Run `scripts/deploy.sh --content-only`.

## Cleanup (last step of every run)
T3 may start a scheduled run in a fresh worktree under `~/.t3/worktrees/rockleak/`, which you then leave.
Before your final reply, remove the worktree you started in, but only if all of these are true:
- it's under `~/.t3/worktrees/rockleak/`
- `git -C <path> status --porcelain` prints nothing
- its branch starts with `t3/`

Run `git worktree remove <path> && git branch -d <branch>` from the main checkout. Never touch any other worktree.

## Practice runs
A practice run follows the evening steps with `practice` as the edition:
- `pnpm newsroom brief practice` writes its brief to `newsroom/desk/<date>/practice/`, and `<dir>` is that folder.
- It stops after 2e.
- It never runs publish, commits, pushes or deploys, and never writes to `log.md`.
