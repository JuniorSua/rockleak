# RockLeak: Logo Exploration v1

Open `board.html` in a browser to see every concept at 512 / 64 / 32 / 16 px, with light and dark lockups, a browser tab and app icons. `board.png` is a full-page render of the same board.

**Tagline (recommended):** **Bedrock facts. Every side.** This is the brand promise. It names both pillars: hard facts ("rock") and nonpartisanship ("every side").
**Editorial / campaign line:** **Truth, cracked open.** Use it for investigations, promos and the "leak" vertical. It's punchier, but alone it says nothing about being nonpartisan.

## Files

```
brand/
  board.html                 self-contained presentation board (SVGs inlined as data URIs)
  board.png                  headless-Chromium render of the board
  logos/concept-N-<name>-mark.svg          512x512 icon mark, transparent, for light backgrounds
  logos/concept-N-<name>-mark-dark.svg     same mark recoloured for dark backgrounds (favicon dark mode / app icon)
  logos/concept-N-<name>-lockup.svg        1200x300 mark + ROCKLEAK wordmark, transparent, for light backgrounds
  logos/concept-N-<name>-lockup-dark.svg   same, with the near-black background rect included
  tools/build_brand.py       generator for everything above (python3 -I brand/tools/build_brand.py)
```

Every SVG is hand-built vector, with no rasters, no external references and no `<text>`. The **ROCKLEAK wordmark is a custom heavy grotesque drawn as outlines**: 100-unit cap height, 22-unit stems, 19-unit horizontals, hand-kerned. It looks identical everywhere and needs no font.

## Palette

| Role | Name | Hex |
|---|---|---|
| Primary ink / dark background | Bedrock Ink | `#0B0D10` |
| Dark UI surface | Graphite | `#1C2027` |
| Secondary text | Slate | `#5B6573` |
| Rules, muted UI | Stone | `#AEB5BF` |
| Light background / ink on dark | Newsprint | `#F4F2ED` |
| Signal accent | Signal Red | `#E5252A` |
| Signal accent | Leak Blue | `#2E6FF2` |
| Glow tint (crack core) | Leak Blue tint | `#9CC0FF` |

**Rule:** red and blue are near-equal in lightness and are never used alone at brand level. Every concept pairs one with the other, either in the mark or in the wordmark, so the brand never reads as one party.

## Typography

- **Logo:** the custom outlined wordmark (in the SVGs). Don't retype it in a font.
- **Headlines:** a heavy, tight grotesque. **Inter Tight** (Black/ExtraBold) or **Archivo** (ExtraBold) are free. Paid: Söhne Breit, GT America Condensed. Use tight tracking (-2% to -3%).
- **Body:** a sturdy text serif for the "paper of record" tone: **Source Serif 4** (free), or Tiempos Text (paid).
- **Data, document IDs, "LEAK" / "VERIFIED" labels:** **IBM Plex Mono**. This gives the investigative "document" edge.

## Concepts

### 1. Fault Line (`concept-1-faultline`)
A faceted block of bedrock split top to bottom by a fault glowing Leak Blue. A single drop of that light falls from its base. The rock is the hard facts; the crack is the truth breaking through.
- **Signals:** truth / bedrock (strong), leak (strong), politics (via red/blue wordmark only), world (none).
- **Strengths:** tells the whole name in one image (ROCK + LEAK). The silhouette is distinctive. It works on dark (granite) and light (basalt). Red wordmark plus blue mark keeps the balance.
- **Risks:** the faceted low-poly style can date quickly. At 16 px the crack becomes a thin line. The jagged blue fault can read as a lightning bolt ("energy/tech") if drawn carelessly. No explicit politics cue.

### 2. Cracked R (`concept-2-monogram`)
A chiselled, faceted-cornered R monogram, fractured through its bowl. One red drop falls out of the break into the space under the bowl. It's the "Politico P / Axios A" move, but with a story built into the letter.
- **Signals:** authority / institution (strong), leak (strong), bedrock (chiselled corners), politics/world (via palette and wordmark).
- **Strengths:** the best small-size performance of the five (crisp at 16-32 px, reads as "R" with a red dot). Most ownable and trademarkable. Pairs naturally with the wordmark. Easy to animate (the drop falls) and easy to extend (the crack as a graphic device across the site).
- **Risks:** monograms need repetition to build recognition. Some may read the red drop as blood, so keep it a clean geometric drop and never add splatter. The crack cuts must stay precise or it looks like a stencil.

### 3. Split World (`concept-3-splitworld`)
A faceted stone globe forced apart along a zigzag fault: the left half in blue facets, the right in red, with light showing through the break. It's world news plus "every side": the truth sits in the gap between the two.
- **Signals:** world (strong), every side / nonpartisan (strong, explicitly), leak (crack), bedrock (faceted stone).
- **Strengths:** the most colourful and memorable at small sizes. Reads as a globe even at 16 px. Says "covers both sides" without words. A good fit for the tagline.
- **Risks:** it can read as "America divided / polarisation" rather than "both sides". Red-white-blue in a split circle invites Pepsi and party-logo comparisons. It's the hardest mark to put in one colour (needs a mono version with tonal facets).

### 4. Capitol Bedrock (`concept-4-capitol`)
The Capitol dome chiselled from stone in faceted gores, cracked from the lantern down through the colonnade. One red drop leaks beneath, under a band of blue stars. It's the most literal "leaks from Washington" image.
- **Signals:** politics / Washington (strongest), leak (strong), bedrock (chiselled dome), world (none).
- **Strengths:** instantly says "US politics". Strong storytelling for launch campaigns. Nonpartisan, since the dome is an institution, not a party.
- **Risks:** Capitol domes are common in political branding (think tanks, PACs, Roll Call), so it's the least ownable. Fine detail (columns, stars) collapses at 32 px and below, so it would need a simplified favicon (dome + crack + drop, no stars). The stars can look decorative.

### 5. Redacted (`concept-5-redacted`)
The American flag re-read as a redacted document: black redaction bars stand in for stripes, with a blue canton and one white star. One bar has snapped on a clean diagonal, with Signal Red light spilling out of the break. In the lockup, LEAK sits reversed out of its own redaction bar.
- **Signals:** politics / America (strong), leak / investigative (strongest), truth (crack), world (none).
- **Strengths:** the most "investigative" personality of the five. The flag reads at 16 px. The redaction-bar system gives a ready-made visual language for the site (section heads, "declassified" labels, pull quotes). The lockup is the most typographically distinctive.
- **Risks:** a flag-based logo can feel patriotic/partisan-coded to some readers, and flag-etiquette critics may object. The redaction idea is used by other investigative outlets. The red break is small, so the "leak" is subtle at icon size.

## Ranked recommendation

1. **Cracked R.** The best balance of authority, story and scalability. It works as a favicon, app icon and social avatar on day one, and the crack + drop become a reusable brand device. Pair it with "Bedrock facts. Every side."
2. **Fault Line.** The purest expression of the name. Use it if the brand wants a symbol rather than a letter. It's a strong fallback, or a hero illustration alongside #1.
3. **Split World.** The most memorable and the most on-message for "every side". Test it with readers for the "divided America" reading before choosing it.
4. **Redacted.** The richest investigative system (lockup + bar language). Consider borrowing its "LEAK in a redaction bar" treatment as a sub-brand for an investigations vertical, whichever mark wins.
5. **Capitol Bedrock.** The clearest "politics" signal, but the least ownable and the weakest at small sizes.

### Next steps before finalising
- Test the top 2-3 at real sizes in context (site masthead, X/Bluesky avatar, push notification, YouTube watermark).
- Make one-colour (all ink / all white) versions of the chosen mark, and a simplified 16 px favicon cut.
- Run a trademark and likeness search on the chosen direction (especially #3 against Pepsi and party marks, and #4 against existing dome marks).
