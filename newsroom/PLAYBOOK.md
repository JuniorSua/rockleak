# RockLeak newsroom playbook

The newsroom runs inside Claude Code on the owner's Claude subscription (no API keys). T3 Code's scheduler
starts a fresh run three times a day on ProDesktop, which is always on. Times are Eastern:

| Run | Time | Job |
| --- | --- | --- |
| `morning` | 9:00 AM | **Set up the day.** Publish the one story people will be talking about today. Also write a short plan for the later runs. |
| `evening` | 5:00 PM | **What happened today.** Publish the day's most important development. |
| `night` | 10:00 PM | **Before bed.** Publish what moved tonight, or a close-call race (see 1), or nothing. |

Each published story is a **drop**. RockLeak should feel like a release, not a feed: rare, important and complete.
A reader who doesn't follow politics should be able to catch one drop and feel set for the day.

At most one drop per run. **Publishing nothing is a valid outcome.** A thin or niche drop hurts the brand more
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

## 1. Pick what matters (every run)

1. Read the brief. Then run 3–6 web searches for US political news it may miss:
   - breaking news and court rulings
   - new polls
   - voting rules, ballots and deadlines
   - claims going viral, especially false or misleading ones that outlets are now fact-checking
2. Ask of each candidate: **would someone who doesn't follow politics need to know this today?** Score it on:
   - **Everyone's talking about it**: it leads the wire on both sides, or it's driving the conversation on X.
   - **People are confused**: false or misleading claims are spreading, for example about how a state counts its votes. Our "What's true?" is the value.
   - **It affects the reader**: their vote, ballot, deadlines, money, rights or safety.
   - **Close call**: the race is in the brief's "Close calls" list.
     - Once a day, if a close call is listed and no drop covered that race in the last 3 days, one drop should explain it.
     - Say who each platform favors and by how much, why traders might disagree, and what the polls and money say.
     - Rate the claims going around the race.
     - Put both platforms' contracts in `markets`.
   - **A hard question**: a lot of people are asking it (on X, on talk shows, in comments, in "People also ask"), but outlets dance around it or only one side asks it.
     - RockLeak's edge is to ask it plainly and answer it with the record, even when the answer is "no" or "nobody knows yet".
     - Look for it in the wire (what one side keeps asking and the other ignores), on X, and in the claims going around.
     - Find at least one real instance of people asking it. That becomes `question.askedBy`.
   - **Records nobody reported** (the Dig) are a bonus. Use them to add a fact others missed. Publish one on its own only if it would matter to a regular reader.
   - **Skip**:
     - inside-baseball that a regular reader wouldn't care about
     - anything already published, unless there's a real new fact
     - anything resting on one anonymous source or on social posts alone
3. **Morning only.** Write `newsroom/desk/<date>/plan.md` with 2–4 ranked candidates for the day. For each, include:
   - a working headline
   - why it matters to a regular person, in one line
   - the 2–4 sources to pull
   - which outlets have it (left, center, right)
   - legal or fairness risks
4. **Evening and night.** Read `plan.md`, if there is one, and the fresh brief. Something bigger that broke since the plan was written outranks it. On the night run, prefer what moved during the day.
5. Pick the single best candidate. Write `<dir>/pick.md` with the pick and one sentence on why a regular reader needs it.

## 2. Report, write, approve, publish (every run)

### 2a. Report (you, the desk chief)
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

### 2b. Debate (4 sub-agents in parallel)
1. Build each prompt with `pnpm newsroom prompt <Grant|Rosa|Mercer|Vex> <dir>/ledger.json`. It prints the persona,
   the numbered ledger and the exact reply format. Use each output as that sub-agent's whole prompt.
2. Launch all four in ONE message with the Agent tool, `model: "sonnet"`.
3. Save the four JSON replies, in the order Grant, Rosa, Mercer, Vex, as `<dir>/debate.json`. This is an array of
   4 objects with `position`, `argument`, `concedes`, `acceptsFacts` and `challenges`.
4. If an analyst challenges a fact, re-check that fact. If the challenge holds, fix or downgrade it in `ledger.json`.

### 2c. Write (you, as Quill)
Write as Quill, using Quill's system prompt in personas.ts. The reader doesn't follow politics and may be 19, so be plain, concrete and short.
The story page leads with the short version and the key facts. Everything else sits under "Go deeper".

1. Write `<dir>/article.json` with these fields:
   - `slug`: lowercase-with-dashes, under 90 characters.
   - `category`: one of midterms, congress, white-house, courts, economy, campaigns, foreign-policy.
   - `kicker`: 40 characters max, e.g. "SENATE 2026".
   - `headline` (100 characters max; aim for 70):
     - intriguing and literally true: open a curiosity gap with a specific true detail
     - the most surprising TRUE thing goes first
     - numbers beat adjectives
     - no "slams"
     - a question headline is allowed only with a `question` (below), and the headline must equal `question.text`
   - `question` (optional; required for a question headline): the hard question this drop answers.
     - `text`: 100 max, asked plainly, ending in "?"
     - `answer`: yes, no, partly, or unknown ("Nobody knows yet"), exactly as the record supports
     - `short`: 220 max, the answer in 1–2 sentences, with the key number or record
     - `askedBy`: 160 max, who is actually asking it, e.g. "Trending on X; raised by Fox's Bret Baier and CNN's Jake Tapper"
     - The answer shows right under the question, before anything else, so the question creates curiosity without accusing anyone.
     - Good questions:
       - "Can Trump Legally Waive a Sanctions Law the Senate Passed 86-11?" (yes, and the story shows how)
       - "Did Noncitizens Swing Michigan's Vote?" (whatever the record shows)
       - "Who's Paying for the $1.2 Million Against Husted?" (nobody knows yet, and the story says why)
     - Bad questions:
       - "Is Ilhan Omar Hiding Something?" This insinuates, no record raises it, and it can't be answered.
       - "Why Did X Lie About Y?" It assumes the lie.
       - Any question about a named person's crime, health or private life that no official record or credible outlets on both sides already raise.
     - Use the symmetry test: would we ask the same question about the other side's figure in the same spot?
   - `dek` (320 max; aim for 200): the teaser under the headline in the feed. Two short sentences.
   - `tldr`, the short version every drop opens with. Each part is 1–2 sentences:
     - `what`: **What happened?** Plain facts, no jargon.
     - `why`: **Why does it matter to me?** Speak to the reader: what it changes for their vote, money or rights, or what happens next. Don't exaggerate.
     - `truth`: **What's true?** Lead with the verdicts: what's confirmed, what's false or misleading, what's unproven.
   - `body` (5–9 short paragraphs): the full story, for readers who tap "Go deeper".
   - `bottomLine`, `consensus` (what all four analysts accept), `newAngle` (what other coverage missed).
   - `status`: verified, developing or contested.
   - `stat` {value (14 max), label (160 max)}: one big number backed by a confirmed fact. It stands in for a photo.
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
2. **Photo (optional).** Drops can carry a free-license photo from Wikimedia Commons.
   - Search: WebFetch `https://commons.wikimedia.org/w/index.php?search=<terms>&title=Special:MediaSearch&type=image`.
   - Good: official portraits (often public domain), the building or place involved, public events.
   - Never use:
     - private people or minors
     - news-agency or press photos
     - AI-generated images
     - a photo whose expression or setting implies something the facts don't support
   - Attach it with `pnpm newsroom image <dir> "File:<name>" "<alt text>"`. The tool reads the license and author from Commons and refuses anything that isn't CC0, public domain, CC BY or CC BY-SA.
   - If nothing fits, skip it. The stat card stands in.
3. **Debate turns are published.** Read them against the ledger.
   - If a turn states something the ledger doesn't support, add a corrected `debate` array to article.json: [{persona, position, argument, concedes}] × 4, in the same order.
   - Fix accuracy only, never the analyst's view.
4. Run `pnpm newsroom assemble <dir>`. It merges the ledger, the article and the debate into `draft.json`, computes the agreement score, and runs `check`. Fix anything `check` reports in ledger.json or article.json, then run assemble again.

### 2d. Approve (Plumb, the neutral standards editor)
Launch ONE fresh sub-agent with the Agent tool, at the default model, not sonnet. Its prompt must include:
- Plumb's system prompt from `src/lib/agents/personas.ts`
- the full text of `newsroom/STANDARDS.md`
- the paths to `<dir>/draft.json` and `content/stories.json` (to check that it's new)
- the FEC and blocked-site notes from 2a
- "Review this draft. You did not write it and you owe its writer nothing."

Plumb opens the sources itself and replies with the JSON in STANDARDS.md. Save it as `<dir>/review.json`.

- **APPROVE**: `pnpm newsroom review <dir>/draft.json <dir>/review.json <edition>`, then go to 2e.
- **APPROVE_WITH_EDITS**: Plumb has approved, subject to wording fixes.
  1. Apply each `requiredFixes` item to ledger.json or article.json.
  2. If a fix breaks a length limit, shorten it but keep its meaning.
  3. Run assemble again.
  4. Run `pnpm newsroom review …`, then go to 2e.
- **REVISE**: the story has a substance problem.
  1. Apply every fix.
  2. Run assemble again.
  3. Launch a NEW Plumb for round 2. Give it everything above plus round 1's `review.json` and a list of what you changed. Save its verdict as `review-2.json`.
  - Round 2 must decide APPROVE, APPROVE_WITH_EDITS or REJECT. There's no third round.
- **REJECT**: don't publish. Keep the draft in the desk. If there's time, you may try the plan's next candidate once (section 1, step 5 onward). Otherwise publish nothing.

### 2e. Publish
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
- **Published:** the headline, as a [link](https://rockleak-roan.vercel.app/story/slug), plus one line on why a regular reader needs it.
- **Or nothing published:** say why (Plumb rejected it, with the reason, or nothing cleared the bar).
- Plumb's one-line note.
- Anything the owner should know or decide.

Also append the same lines to `newsroom/desk/log.md` with the date and edition.

## Hard rules
- Nothing reaches `content/stories.json` except through `pnpm newsroom publish`, after Plumb approves. The exceptions are `unpublish` and `image <slug>`, and only when the owner asks.
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
- It stops after 2d.
- It never runs publish, commits, pushes or deploys, and never writes to `log.md`.
