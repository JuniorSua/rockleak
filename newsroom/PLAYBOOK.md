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
Read `plan.md`, if there is one, and the fresh brief. Pick the single best candidate. A big development since the plan was written can outrank it. On the night run, prefer what moved during the day. Write `newsroom/desk/<date>/<edition>/pick.md` with the pick and one sentence on why.

### 2b. Report (you, the desk chief)
Research with WebSearch and WebFetch. Go to primary records first:
- FEC, congress.gov, Senate and House roll calls, court dockets (CourtListener)
- the Federal Register, agency releases, official statements and transcripts

FEC tips:
- `docquery.fec.gov` filing images block automated readers.
- Query the FEC API through the site, which holds the data.gov key:
  `pnpm newsroom fec schedules/schedule_e/ committee_id=C00901223 sort=-expenditure_date per_page=20`
  Other paths that work: `committee/<id>/`, `schedules/schedule_a/`, `filings/`, `candidate/<id>/`. It prints
  how many calls remain this minute (the limit is 60 a minute). If it nears 0, wait a minute.
- An FEC record you can't open isn't confirmed. Pick a candidate you can verify instead.

Then outlets on the left, center and right. Write `ledger.json`:
- `coreFacts` (5–8): each with a verdict and at least 1 source. Use primary sources wherever they exist. Mark them `tier: "primary"`.
- `claims` (2–5): what politicians, campaigns and viral posts are saying, each rated.
- `coverage` (4–8): how outlets framed it, from at least two sides of the spectrum. Use each outlet's own article URL. Open the Google News redirect to find it.
- `stillUnknown`.
- **X reaction:** search for notable posts, Community Notes, or reporting about the reaction on X. If you find nothing reliable, write `xPulse.summary` as "No notable X reaction beyond the outlets above." with `trending: []`. Posts are leads, never proof.
- `markets`: any relevant odds from the brief, with `asOf` set to now.

### 2c. Debate (4 sub-agents in parallel)
Launch four sub-agents with the Agent tool, in ONE message, using `model: "sonnet"`. Each one gets:
- the system prompt for Grant, Rosa, Mercer or Vex, copied verbatim from `src/lib/agents/personas.ts`, and SHARED_RULES
- the full ledger
- an instruction to return ONLY JSON: `{"position","argument","concedes","acceptsFacts":[indexes],"challenges":[{"factIndex","reason"}]}`

Save the four replies in order (Grant, Rosa, Mercer, Vex) as `debate.json`. Then:
- If any analyst challenges a fact, re-check that fact. Fix or downgrade its verdict if the challenge holds.
- Compute the score with `pnpm newsroom agreement newsroom/desk/<date>/<edition>/debate.json <factCount>`.

### 2d. Write (you, as Quill)
Write the story as Quill: copy the Quill system prompt from personas.ts. The reader doesn't follow politics. Be plain, concrete and short. Output `draft.json`, matching the `Story` type in `src/lib/types.ts` and the existing stories in `content/stories.json`:
- `slug`: lowercase-with-dashes, under 90 characters.
- `publishedAt`: now, ISO with offset.
- `headline` (120 characters max):
  - catchy and literally true
  - the most surprising TRUE thing goes first
  - numbers beat adjectives
  - no question headlines, no "slams"
- `dek`, `body` (5–9 short paragraphs), `bottomLine`, `consensus` (what all four analysts accept).
- `debate`: the four turns without acceptsFacts/challenges. `agreementScore` comes from 2c.
- `stat`: one big number backed by a confirmed fact. `value` is 14 characters max.
- `tldr` {what, why, truth}, and `newAngle` (what other coverage missed).
- `seo`:
  - title of 60 characters max
  - description of 155 characters max
  - keywords people actually search for
  - 3–5 FAQ entries answered from the ledger
- `social`:
  - 3 headline variants with a score and rationale
  - an xPost of 270 characters max
  - a 3–5 post thread
  - a shortVideoHook
  - shareCardText
- **Never put a person's name in an SEO keyword next to an unproven allegation.**
- `status`: verified, developing or contested.
- Leave out `review`. Plumb adds it.

Run `pnpm newsroom check newsroom/desk/<date>/<edition>/draft.json` and fix everything it reports.

### 2e. Approve (Plumb, the neutral standards editor)
Launch ONE fresh sub-agent with the Agent tool, at the default model, not sonnet. Give it:
- Plumb's system prompt from personas.ts
- the full text of `newsroom/STANDARDS.md`
- the path to `draft.json`
- the instruction: "Review this draft. You did not write it and you owe its writer nothing."

Plumb must actually open the sources (WebFetch) behind the headline, the stat and every `confirmed` fact. Plumb returns the JSON verdict described in STANDARDS.md. Save it as `review.json`.
- **APPROVE**: add `review` to the draft:
  - approvedBy "Plumb"
  - approvedAt now
  - notes: Plumb's one-line summary
  - edition
- **REVISE**: make exactly the fixes Plumb lists, run `check` again, then send it back to a NEW Plumb sub-agent. Allow only one revision round. If it isn't approved after that, treat it as rejected.
- **REJECT**: don't publish. Keep the draft in the desk. If time allows, you may try the plan's next candidate once (2a onward). Otherwise publish nothing.

### 2f. Publish
1. `pnpm newsroom publish newsroom/desk/<date>/<edition>/draft.json`. This re-checks the draft and refuses anything without Plumb's approval.
2. `git add content/stories.json && git commit -m "Publish: <headline>" -- content/stories.json`
   - Commit only that file.
   - End the message with the Co-Authored-By line used in this repo's history.
3. `git push origin foundation`. If it's rejected, run `git pull --rebase --autostash origin foundation`, then push again.
4. `scripts/deploy.sh`. This deploys the committed HEAD to Vercel production. Uncommitted edits never ship.
   If it says FAILED, wait 2 minutes and run it once more. A slow government API can time out a build, and a failed build leaves the old site live.
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
  4. Run `scripts/deploy.sh`.
