# Mobile at the table: operator guide

This is the guide to the mobile track: the work that keeps the quality of the atlas and the sim and fits both to a phone held at the table. Read it before you run, review or edit any Mobile item. The queue itself lives in [POLISH.md](../../POLISH.md). The sister guides are [docs/filigree/README.md](../filigree/README.md) and [docs/street/README.md](../street/README.md).

## 1. Purpose and the rule

The owner asked to act on the to-do list and to "retain this quality but improve the site for mobile users". The rule over everything is **delay, never drop**:

- every class the desktop shows stays reachable on a phone;
- a phone budget never removes, delays or shrinks anything on the desktop;
- nothing touches the seed, `W.rng`, the sim, canon names or the chronicle voice (bronze-age Nīmlad, the Kembar, years counted A.B.).

A phone may reveal a name, a tier or a detail later than a desktop. It never loses one. Phone presentation (lower shadow resolution, no antialias on the phone class) is an accepted scale: nothing is removed, and the desktop and tablet are unchanged.

The full reasoning is kept in `docs/research/mobile-at-the-table.md` (written by Mobile 0). Agents never run git. The central session commits each unit as a WIP commit, never mid-edit, and cuts one release per POLISH item (see section 9).

## 2. Universal gates UG1-UG11

Every unit's acceptance starts with these. They are scored in code by `node tools/mobile-capture.js --accept docs/mobile/accept/<unit>.json`, not judged by a model.

| gate | check |
| UG1 | The CLAUDE.md inline-script syntax one-liner passes on `index.html` **and** `maps-site/index.html`. |
| UG2 | 0 console errors and 0 page errors on iphone13, pixel7, desktop and desktop2x, for the sim (`#s=epeshu`, `#s=tamar1374`) and the atlas (Contents, The Whole Chart). The blocked Google Fonts/CDN hosts are filtered only until D3/D4 remove them. |
| UG3 | Determinism. The `simDays(400)` fingerprint for epeshu and tamar1374, run twice, equals B0 on **all five profiles** (iphone13, pixel7, landscape, desktop, desktop2x) with the auto-detected class. After S-U3 it is also taken under `?dc=desktop` and `?dc=phone` and under the host-property matrix (`navigator.hardwareConcurrency` x `deviceMemory` pinned to {2,4,8} x {1,2,4,8}), and must be equal in every case. After S-U4 a live-loop check on the virtual clock at speed > 0 (60 fps; the 30 fps phone cap; a forced ladder step-down and step-up; a hidden/resume cycle), each stopped at the same `W.dayTicked`, gives identical sha256 fingerprints; `W.rng.gen/hist/amb` cursors are unchanged by any class, viewport or ladder step. It runs on atlas units too.<br>Clock tokens are counted by OCCURRENCES, not lines (`grep -oE`): `index.html` stays at exactly 37 occurrences of `Math[.]random\|Date[.]now\|new Date[(][)]\|performance[.]now` (35 lines) and of the wide pattern that adds `Date[(]`, `Date[.]parse`, `Intl[.]DateTimeFormat`, `crypto[.]getRandomValues` and `requestIdleCallback` (also 37); the per-line token multiset equals B0 apart from lines a unit declares. `maps-site/index.html` stays at 1 (narrow) and 2 (wide). The ladder takes time only from the rAF timestamp argument. No new code names `W.rng`.<br>Atlas: the diff touches none of `xmur3`, `mulberry32`, `genCityCanvas`, `washMake` or `sampleCityMask`, and cityCanvasSha is equal to B0 **and equal across all five profiles** (viewport and DPR must not leak into the seeded city canvas). |
| UG4 | Every flag-1 anchor of the eight scripts is found. `/* FILIGREE */` and `/* STREET */` occur 0 times. `grep -ci tithe maps-site/index.html` is unchanged (that rename belongs to Filigree 3). `node tools/street-drift.js` exits 0. |
| UG5 | `Object.keys(ANNALS.stats())` deep-equals `['fps','calls','tris','buildings','trees','seed','realm','treasury','pop','agents','chron']`. Device state lives in `ANNALS.device()`. |
| UG6 | The keydown handler's sha is unchanged (range: `window.addEventListener('keydown'` to its matching `});`, braces matched from the first `{`, as Street 1 defines it; `inputs/metrics.md` section 10). `camera.near = clamp(R*0.02, 0.5, 50)` is unchanged. `let fpsAvg = 60, degradeStep` and `const wantShadow = R < 1650 && degradeStep < 3 && shadowsOn;` are present. degradeStep keeps 1/2/3. |
| UG7 | The atlas `.leaflet-pane` list equals B0: no unit calls `createPane` (Filigree 2 freezes `pre_filigree_panes`). After A-U2, `ATLAS.tiers()` equals the pinned values everywhere. |
| UG8 | **Desktop identity** on 1366x768@1 **and** 1440x900@2. Metrics equal the reference except the unit's declared keys; shots differ ≤ 0.5% outside the declared regions; the desktop click fixture is equal; sim renderer params and calls/tris at 3 views (virtual clock) are equal. |
| UG9 | New player-facing strings are listed. They get 0 hits for `VOCAB` and `VOCAB_ST`, and pass a sonnet/low voice read (bronze-age Nīmlad, the Kembar, A.B.). |
| UG10 | First-view bytes and requests on iphone13 never grow beyond the unit's declared amount. |
| UG11 | **Pipeline integrity, scored in code.** sha256 of every `.claude/workflows/*.js` and of `tools/street-drift.js`, before versus after each implementer or fixer run, is unchanged. The loop rejects any unit whose `files` include a `.claude/` path, and `mobile-build.js` refuses to write under `.claude/` at all (script and loop files are central-session only). |

## 3. Player-visible strings

Only this list is voice-read (against `docs/mobile/voice-rubric.md`) and grepped for the filigree `VOCAB` and street `VOCAB_ST` regexes. A unit that adds a label, title, aria-label, hint or tidings string must add it here in the same change. Wiki canon names (for example the faction "The Lektān Priesthood") are exempt from the VOCAB grep.

Avoid these words in visible text (internal names may keep them): menu, drawer, modal, dismiss, toggle, tap, pinch, swipe, download, install, offline mode, dark mode, theme, save. "Coach" never appears in the hint card.

| unit | surface | string |
|---|---|---|
| A-U8, A-U9, S-U8 | sheet handle (aria-label and title) | Draw the sheet up or down |
| A-U8 | layers control | Layers of the chart |
| A-U8, A-U9 | close control of a sheet or the place card | Close the card |
| S-U2 | court tab, 44 px, on the sim (coarse pointer) | ❦ Return the court |
| S-U2 | court tab title on coarse pointers (replaces the old "tap the map edge") | Bring back the court |
| S-U2 | court tab title on fine pointers | Bring back the court (H) |
| S-U2 | full-chart close button, coarse pointers | Close the chart |
| S-U2 | full-chart close button, fine pointers only | Close the chart (Esc) |
| S-U4 | ladder notice in the sim | The court dims its lamps to keep pace. |
| S-U9 | first-touch hint card, coarse pointers, shown once | One finger turns the sky · two fingers walk the land · draw two fingers together to come near · touch to look · touch twice to journey |
| S-U9 | per-pointer hint text | the fine-pointer wording is chosen by the unit and added to this table before it lands; it differs from the coarse text |
| S-U10 | Night ink control, on | Night ink: lit by Tamar's dark hour |
| S-U10 | Night ink control, off | Day ink |
| D7 | atlas freshness notice | A newer chart has been drawn — unroll it |
| D8 | sim freshness notice | A newer chronicle has been set down — unroll it |
| D9 | atlas drawer row (size shown first, then a press) | Keep this chart for the table — about <n> MB |
| D9 | atlas wake-lock row (absent where unsupported) | Keep the chart lit |
| D10 | sim ledger World tab row (size shown first) | Keep the realm for the table — about <n> MB |
| D10 | sim ledger World tab row (absent where unsupported) | Keep the chronicle lit |
| R12 (filigree) | the notices label, everywhere it shows | the herald's tidings |
| R12 (filigree) | stale notices, with the snapshot's own A.B. date and never the device clock | last cried, <n> A.B. |
| R12 (filigree) | an offline snapshot of the tidings | marked "as last cried" |
| R14 (filigree) | the era layer on a phone | the Elder Chart (never "old survey" to the player) |

`<n>` is a rounded size read from the offline manifest. The visible rows never use "Save", "Download", "Install" or "Offline mode".

## 4. Hard ordering constraints

These are also encoded in `units.json` as `kind: central` steps, `depends_on`, `owner_gate` and the loop's hold flag.

- **Hold first.** Do not start Street 1 or Filigree 2 (full runs) until Mobile 0 is written, Filigree 1 is re-integrated, Mobile 2 has landed, and both mobile lanes have passed review. A Street 1 run earlier would freeze views on the pre-mobile sim and stamp the default bible's sha; a Filigree 2 run earlier would leave the Filigree 3 capture tool without `--phone` and `net`. Plan-mode previews are read-only and harmless.
- **No app-file edit while any Filigree 1 agent runs.** Its integrator and blank-hex appliers grep both `index.html` and `maps-site/index.html`. `M1.1` and `M1.3` (read-only on the app) may run beside Filigree 1.
- **Units editing an app file wait for the Filigree 1 gate.** Every unit whose files include `index.html` or `maps-site/index.html` is held until `docs/filigree/gates/1-research.json` exists, passes, and records R2/R7/R12/R14/R18 as overridden (none `default`). The loop checks this before its snapshot step. `D3` and `D4` depend on `F1` explicitly.
- **Mobile 0 first, then Filigree 1 re-integration (Path B).** `M0` writes both rulings files and both "mobile" blocks, unchecks the Filigree 1 box in POLISH.md and deletes `docs/filigree/gates/1-research.json`. `F1` is then a fresh `filigree-1-research` run with the default `resume:true`: the ledger skips the research and only Synthesize, the blank-hex gate and Record re-run. Path C (a full re-run, about 97 agents, bound 224) needs the owner's approval first.
- **Script edits are central.** `M2` lands SE1a, SE2a, SE2b and SE10 before Filigree 2 and Street 2 ever run. Script edits touch job bodies only, never a prelude or the street config region, never `filigree-1-research.js` or `street-1-research.js`, and only for a job that has never run. No workflow agent edits `.claude/` (UG11). SE4 and SE6 must land before Filigree 4 or Street 4 runs; until then those calls pass an explicit `--phone 390x844@3`.
- **The whole atlas lane lands before Filigree 2; the whole sim lane lands before Street 1** (and so before Filigree 3, which holds both app files). Filigree 2 freezes the atlas panes and stamps sheet bands on `ATLAS.tiers()`; Street 1 freezes views, `STATS_KEYS` and the keydown sha from the live `index.html`.
- **Mobile 3 comes before the lanes split.** `server.js`, `DEPLOY.md` and `pages.yml` are shared, and every lane measures bytes through `server.js`.
- **Each lane is strictly sequential; the two lanes are independent.** Atlas: `maps-site/**`. Sim: `index.html`, root `vendor/`, `sw.js`. A unit holds exactly one app file as its writable path.
- **A19 owner gate.** `docs/mobile/owner-answers.json` holds q1 and q2. If q1 is recorded, `A-U2` runs with that pin; the loop never assumes the recommended answer. If q1 is absent, `A-U2` and `A-U10` are marked `deferred-5b`, "Mobile 5b" is queued directly above Filigree 2, and dependants treat a deferred unit as satisfied. Filigree 2 stays held while either is deferred (G9 fails for Filigree 2 purposes).
- **Rebase trigger.** Before each unit the loop compares the sha256 of the app files with `app_sha` in `docs/mobile/state.json`. A difference the loop did not make (for example "Traced road network" landing mid-lane) is recorded under `rebase`, and the references are re-taken first.
- **Manifests.** The last app-file edit of each lane (`A-U7`, `S-U10`) regenerates its offline manifest and runs `--check`; `G9` and `G14` re-check.
- **Street 1 freezes under `?dc=desktop`.** `G14` runs `node tools/street-drift.js` and `--self-test`, the `sim_after_mobile_pass` grep, and keeps `ANNALS.device()` out of `stats()` and out of the probe's `STATS_KEYS`.
- **Mobile 15 is owner-run**, any time after Mobile 9 and 14, and before any default flip. Leave it unchecked and take the next item.

Run order:

```
Mobile 0 (central) -> Filigree 1 re-integration (Path B)  ||  Mobile 1-2
  -> Filigree 2 mode:'plan' preview
Mobile 3 -> ATLAS LANE: Mobile 4 -> 5 -> 6 -> 7 -> 8 -> Mobile 9 review
         -> SIM LANE:   Mobile 10 -> 11 -> 12 -> 13 -> Mobile 14 review
Filigree 2 (needs Mobile 9 + 14, Filigree 1 passed)  ||  Street 1 (needs Mobile 14, Filigree 1 re-integrated)
  -> Street 2 mode:'plan' preview -> Street 2
Mobile 15 (owner) any time after Mobile 9 + 14, before any default flip
Queue continues: Traced road network, general items, SE3 -> Filigree 3 -> SE4 -> Filigree 4 -> Mobile later (atlas)
                 SE5 -> Street 3 -> SE6 -> Street 4 -> Mobile later (sim)
```

"Traced road network" stays the top POLISH item. It may run when no mobile atlas unit holds `maps-site/index.html`; if it lands mid-lane, references are rebased before the next atlas unit. It must be checked before Filigree 3's slice B (R11).

## 5. The unit loop

`.claude/workflows/mobile-build.js` (args `{item, date}`) runs one POLISH item, units strictly in order; `mobile-review.js` (args `{item | lane, date}`) reviews. Both are written by the central session only and checked by `tools/mobile-loop-check.js`. Per unit:

1. Accept-author writes `docs/mobile/accept/<id>.json` from the unit's acceptance bullets.
2. Snapshot the unit's files.
3. Implementer (the unit's model and effort).
4. UG1, then the measurer (haiku/low runs the tool; the script scores).
5. At most 2 fix rounds, fed the failing keys.
6. Reviewer lenses: desktop identity, delay-not-drop and class parity, determinism (sim), voice.
7. Refute each finding, fix, then a fresh re-review; at most 2 cycles.
8. Record `docs/mobile/captures/<id>.json` and `docs/mobile/state.json`.

On failure the unit restores from its snapshot, the item stays unchecked with the failing numbers, and its dependants are skipped. Baselines: B0 (before any app edit, twice), R1 (desktop reference after D3 and D4, because the vendored fonts now render), `docs/mobile/final.json` (after Mobile 9 and 14), and a rebase whenever a non-mobile commit changes an app file mid-lane.

## 6. Lanes and items (Mobile 0-15)

Two lanes edit disjoint files, so they may run as two workflows from the central session. The atlas lane edits `maps-site/index.html` (Mobile 4-8, review Mobile 9). The sim lane edits `index.html` (Mobile 10-13, review Mobile 14). Mobile 0-3 are shared groundwork; Mobile 15 is the owner's.

Deferred, each with a named POLISH home (delay, never drop): the camera view offset S15 (below Street 4), the ranked label budget for census pins A12 part b (below Filigree 4), far-instance thinning and the shadow freeze (below Street 4), pre-rendered night tiles (only if `A-U12` fails), WebP rasters and the one-finger pan (owner-gated). Contingency inserts: SE1b above Filigree 2, SE2c above Street 2, "Mobile 5b" above Filigree 2.

| item | name | lane | units | note |
|---|---|---|---|---|
| Mobile 0 | Rulings, phone criteria, filigree re-integration | central | `M0`, `F1` | First. The four rulings/todo-inputs files, POLISH edits and the research copy; then Filigree 1 is re-run (Path B). |
| Mobile 1 | The measuring stick | sim+atlas (read-only) | `M1.1`, `M1.2`, `M1.3` | `tools/mobile-capture.js`, baseline B0 (twice), the saved loop. May run beside Filigree 1. |
| Mobile 2 | Script edits before the jobs ever run | central | `M2` | SE1a, SE2a, SE2b, SE10. Job bodies only. |
| Mobile 3 | Delivery foundations | shared | `D1`, `D2`, `D6` | server.js headers, DEPLOY.md and pages.yml, the offline-manifest tool. First user-facing cut. |
| Mobile 4 | Atlas: vendored, versioned, framed | atlas | `D3`, `D5`, `A-U1` |  |
| Mobile 5 | Atlas: bands and taps | atlas | `A-U2`, `A-U3`, `A-U4` | A-U2 needs owner question 1. |
| Mobile 6 | Atlas: the table drawer and the Whole Chart | atlas | `A-U8`, `A-U10`, `A-U11` | A-U10 reads owner question 2. |
| Mobile 7 | Atlas: kept for the table (worker) | atlas | `D7`, `D9` |  |
| Mobile 8 | Atlas: card sheet, touch parity, search, zoom, night measurement | atlas | `A-U9`, `A-U5`, `A-U6`, `A-U7`, `A-U12` |  |
| Mobile 9 | Atlas lane review (MR-A) | atlas | `G9` | Five blind lenses; must pass before Filigree 2. |
| Mobile 10 | Sim: vendored, reach and escape | sim | `D4`, `S-U1`, `S-U2` |  |
| Mobile 11 | Sim: device classes and honest frames | sim | `S-U3`, `S-U4`, `S-U5` |  |
| Mobile 12 | Sim: kept for the table and kept lit | sim | `D8`, `D10` |  |
| Mobile 13 | Sim: resize, phone layout, ledger sheet, first touch, night ink | sim | `S-U6`, `S-U7`, `S-U8`, `S-U9`, `S-U10` |  |
| Mobile 14 | Sim lane review (MR-S) | sim | `G14` | Must pass before Street 1. |
| Mobile 15 | Real-device pass (OWNER-RUN) | owner | none (owner-run) | iPhone (Safari) and Android (Chrome), at the table. Blocked by Mobile 9 and 14; before any default flip (R18, ST7). |

| unit | run | kind | model/effort | defects | depends on | what |
|---|---|---|---|---|---|---|
| `M0` | Mobile 0 | central | central | none | none | write the four Mobile 0 files, the POLISH edits and the research copy; uncheck Filigree 1; delete docs/filigree/gates/1-research.json (Path B) |
| `F1` | Mobile 0 | central | central | none | M0 | re-run Filigree 1 with the rulings and the filigree mobile block (Path B in section 4; Path C only with the owner's approval) |
| `M1.1` | Mobile 1 | tool | sonnet/high | none | M0 | The measuring stick: tools/mobile-capture.js |
| `M1.2` | Mobile 1 | data | sonnet/low | none | M1.1 | Baseline B0 before any app edit (twice) |
| `M1.3` | Mobile 1 | central | central | none | M1.1 | Saved loop: .claude/workflows/mobile-build.js and mobile-review.js (written by the central session only; never by a workflow agent) |
| `M2` | Mobile 2 | central | central | none | M0 | script edits SE1a, SE2a, SE2b and SE10 (script-edits.json) before Filigree 2 and Street 2 ever run |
| `D1` | Mobile 3 | config | sonnet/medium | A8, S6 | M1.2 | server.js: gzip, MIME, ETag/304, Cache-Control, HEAD, PORT env |
| `D2` | Mobile 3 | config | sonnet/medium | A8, S6 | D1 | REWRITE the existing DEPLOY.md (nginx/Caddy, deny/allowlist, HTTPS, kill switch, TILES_V rule) + pages.yml staging |
| `D6` | Mobile 3 | tool | sonnet/medium | A10, S6 | D1 | tools/build-offline-manifest.js (--atlas / --sim / --check) |
| `D3` | Mobile 4 | config | sonnet/medium | A9 | D1, F1 | Atlas: vendor Leaflet 1.9.4 and the OFL fonts |
| `D5` | Mobile 4 | logic | sonnet/medium | A8 | D3 | Atlas: versioned rasters (?t=TILES_V) |
| `A-U1` | Mobile 4 | css | sonnet/medium | A1, A11, A14 | D5 | Atlas: the frame (closed sheet clipped, Contents heading safe, safe areas, dvh) |
| `A-U2` | Mobile 5 | logic | opus/high (owner gate) | A19 | A-U1 | Atlas: absolute reveal bands (A19), pinned to the earlier desktop |
| `A-U3` | Mobile 5 | logic | opus/high | A2 | A-U2 | Atlas: one coarse-pointer tap resolver and a chooser; faded glyphs never take a tap |
| `A-U4` | Mobile 5 | css | sonnet/high | A3 | A-U3 | Atlas: 44 px touch targets and invisible marker pads |
| `A-U8` | Mobile 6 | logic | opus/high | A4, A6, A16, A21 | A-U4 | Atlas: the table drawer (one-row header, thumb-zone cluster, layers inside, landscape side sheet) |
| `A-U10` | Mobile 6 | logic | sonnet/high (owner gate) | A5 | A-U8, A-U2 | Atlas: The Whole Chart fits a portrait phone (letterboxed fit-width) |
| `A-U11` | Mobile 6 | logic | sonnet/medium | A7 | A-U10 | Atlas: 720 px overlay previews before the full plate |
| `D7` | Mobile 7 | logic | opus/high | A10 | A-U11, D6 | Atlas worker maps-site/sw.js + sw-kill.js + guarded registration |
| `D9` | Mobile 7 | logic | sonnet/high | A10, A20 | D7 | Atlas: "Keep this chart for the table" (size first) and "Keep the chart lit" |
| `A-U9` | Mobile 8 | logic | sonnet/high | A13 | D9 | Atlas: the place card as a peek / half / full standard sheet |
| `A-U5` | Mobile 8 | logic | sonnet/high | A15, A12 | A-U9 | Atlas: touch parity (hover gated, halo ring, realm tap, long-press name, census pads) |
| `A-U6` | Mobile 8 | css | sonnet/medium | A17 | A-U5 | Atlas: search at 16 px with 44 px rows above the keyboard |
| `A-U7` | Mobile 8 | logic | sonnet/medium | A18 | A-U6 | Atlas: half-step zoom buttons on touch; Save-Data idle tiles |
| `A-U12` | Mobile 8 | data | haiku/low | A22 | A-U7 | Atlas: night-mode pinch measured on phones (no edit) |
| `G9` | Mobile 9 | central | central | none | A-U12 | atlas lane complete before Filigree 2 |
| `D4` | Mobile 10 | config | sonnet/medium | S6 | D1, F1 | Sim: vendor three r128 and IM Fell English |
| `S-U1` | Mobile 10 | css | sonnet/medium | S5, S13 | D4 | Sim: 44 px controls, HUD 13 px, page zoom allowed |
| `S-U2` | Mobile 10 | logic | sonnet/medium | S4, S11 | S-U1 | Sim: "Return the court" tab and a close button on the full chart |
| `S-U3` | Mobile 11 | logic | opus/high | S2 | S-U2 | Sim: device classes chosen once at load (creation-time levers only) |
| `S-U4` | Mobile 11 | logic | opus/high | S1, S16 | S-U3 | Sim: the honest ladder (real frame time, recovery, 30 fps phone cap) + ANNALS.device() / deviceReport() |
| `S-U5` | Mobile 11 | logic | opus/high | S3, S8 | S-U4 | Sim: survive WebGL context loss; pause while hidden |
| `D8` | Mobile 12 | logic | opus/high | S6 | S-U5, D6 | Sim worker sw.js + sw-kill.js + guarded registration |
| `D10` | Mobile 12 | logic | sonnet/high | S6, S17 | D8 | Sim: "Keep the realm for the table" (size first) and "Keep the chronicle lit" |
| `S-U6` | Mobile 13 | logic | sonnet/medium | S9, S14 | D10 | Sim: debounced resize with the class pixel ratio; capped graphs canvas |
| `S-U7` | Mobile 13 | css | sonnet/high | S10 | S-U6 | Sim: speed controls in a bottom bar on portrait phones; compact landscape HUD |
| `S-U8` | Mobile 13 | css | sonnet/high | S12 | S-U7 | Sim: the ledger as a three-stop sheet |
| `S-U9` | Mobile 13 | logic | sonnet/medium | S7 | S-U8 | Sim: first-touch hint card and per-pointer hint text |
| `S-U10` | Mobile 13 | css | sonnet/high | S18 | S-U9 | Sim: Night ink for the HUD, ledger and sheets |
| `G14` | Mobile 14 | central | central | none | S-U10, G9, F1 | sim lane complete before Street 1 (Street 1 freezes under ?dc=desktop) |

## 7. Owner questions and where answers live

Answers are recorded in `docs/mobile/owner-answers.json`, created by Mobile 0 with nulls:

```json
{"q1": "a" | "b" | "c" | null, "q1_values": {"B": n, "C": n} | null, "q2": "a" | "b" | null}
```

- **q1, the A19 tier pin** (gates `A-U2`, and so A5 and Filigree 2): (a) pin to the earlier of the two desktops, the recommended answer, so the 1x desktop reveals tier C 0.58 zoom earlier and tier B 0.17 earlier and no desktop gets anything later; (b) pin to the 1x desktop values, which delays the retina desktops and breaks "never delay a desktop"; (c) a value between, written as `q1_values` `{"B": n, "C": n}`. `A-U2` stops for the owner if any desktop moves later by more than 0.35. If q1 is null, `A-U2` and `A-U10` are `deferred-5b`.
- **q2, the Whole Chart on a portrait phone** (`A-U10`): (a) fit-width letterbox, the default; (b) keep fill-height with an overview inset. If q2 is null and `A-U2` ran, the default (a) ships.

The other questions in the plan (sign-off of the rulings, HTTPS certificates for the two hosts, the Street 4 phone-file gate, who runs Mobile 15, WebP and one-finger pan, Path C approval) are not recorded in that file: sign-off goes into each rulings file's `confirmed` list, which no script reads.

## 8. Rulings

Rulings live in [docs/filigree/rulings.json](../filigree/rulings.json) and [docs/street/rulings.json](../street/rulings.json); the phone criteria live in the "mobile" blocks at the end of [docs/filigree/todo-inputs.json](../filigree/todo-inputs.json) and [docs/street/todo-inputs.json](../street/todo-inputs.json). `confirmed` stays `[]`: sign-off is the owner's act.

Every override is append-only: the default text verbatim, then the mobile clauses, so a drift review is a `startsWith` check.

Adopted:

| id | one line |
|---|---|
| R2 | Label thresholds are absolute zooms that no viewport or pixel ratio moves; a phone's held-back name appears by its desktop threshold + 0.5 zoom or the end of its sheet's band, never smaller than on the desktop and never below 12 px on touch. |
| R7 | Touch reaches a halo by tap and peeks its name by long-press; glyph centres within 22 px decide, a chooser opens for two or more, and faded or tier-hidden glyphs never take a tap. |
| R12 | Each app keeps its last notices snapshot and shows it offline marked as last cried with the snapshot's own A.B. date, never the device clock. It keeps the label "the herald's tidings" (the override is append-only, so the default label and its stale form "last cried, <n> A.B." stand). |
| R14 | Elder Chart tiles are fetched, and kept offline, only while that layer is on, and the touch swipe moves by a handle at least 44 px wide, never by a map drag. |
| R18 | On touch the toggle row lives in the table drawer at least 44 px tall; coarse pointers flip only after Job 4's phone checks at 390x664@3 pass. |
| ST8 | The desktop run gates the desktop flip; the phone class is forced with `?dc=phone` at 390x664 and its real-phone bar is median fps >= 27 at the 30 fps cap, filed under `docs/street/device-phone/`. |

Rejected (default texts kept):

| id | one line |
|---|---|
| R6 | Its override turns P-fade-ms into an agent-read answer and loosens SG2.16, dropping a Street 2 baked check; its phone content moves to FM6. |
| ST7 | Its override swaps baked `street` parameters for agent-read answers; the 44 px rows move to SM6 and the desktop-first flip lives in ST8. |
| ST9 | Its override loosens SG2.16 `max_jobs_frame`; the content moves to SM1/SM8, `/device_classes` and SG2.17. |
| ST19 | Its override replaces the baked quality ladder with an agent-read list; the content moves to SM2 and SM3. |

R12's label stays "the herald's tidings" in every surface and in this guide.

## 9. Releases and rollback

- Filigree 1's re-integration, with the Mobile 0 files, is the docs cut `v0.11.0-alpha.2`. Mobile 1 is `alpha.3`, Mobile 2 `alpha.4`, Mobile 3 `v0.12.0-alpha.1`, and every later item `alpha.N+1`. One cut per item; the orchestrator serializes cuts, and nothing mobile sits unpushed across a filigree or street cut.
- A unit restores from its snapshot. After a push, the orchestrator reverts the unit's changes in a re-cut. Workers are rolled back by deploying `sw-kill.js` as `sw.js` (see [DEPLOY.md](../../DEPLOY.md)).
- A ruling regret after Street 1 (R12, R18 or ST8 are cited there) means a Street 1 re-run, which is why the texts are final.

Chromium-only caveat: there is no WebKit, phone GPU or thermal data in the sandbox. Phone-class speed, battery, real HTTPS workers, wake lock, `storage.persist()` and the ladder numbers stay proposals until Mobile 15.

## 10. Files of the track

`docs/mobile/` holds this guide, `owner-answers.json`, `state.json`, `baseline.json`, `final.json`, `gates.md`, `metrics.md`, `voice-rubric.md`, `script-baseline.json`, `accept/`, `captures/` and `fixtures/`; screenshots go in the git-ignored `docs/mobile/shots/` (`<unit>/` for a unit, `<output name or adhoc>-<tree sha>/` for any other run; each shot record carries the sha256 of its files and UG8 refuses a file that no longer matches). Several of these appear as their units land. The capture harness is `tools/mobile-capture.js`.

## 11. Instrument

`tools/mobile-capture.js` is the measuring stick (unit M1.1). It promotes the scratchpad harness kept in `docs/mobile/inputs/` (`capture.js`, `probe.js`, the baseline JSON, `brief.md`) into the repo. Every metric is the formula in [metrics.md](metrics.md); the gate table is [gates.md](gates.md); string review is [voice-rubric.md](voice-rubric.md); `controls.json` is the control inventory captured on desktop 1366x768. The tool is read-only on the repo: it writes only `--out`, `--controls` and the git-ignored `docs/mobile/shots/`. It never takes port 8544 and never runs git.

```
NODE_PATH=/opt/node22/lib/node_modules node tools/mobile-capture.js [--atlas] [--sim] [--profiles iphone13,pixel7,landscape,desktop,desktop2x]
    [--unit ID] [--out F] [--controls F] [--cdn-dir D] [--clock virtual|real] [--cpu K] [--throttle slow4g] [--hw-cores N] [--device-memory M]
    [--sw allow] [--save-data] [--query dc=phone] [--seeds epeshu,tamar1374] [--tap-n 12] [--phone WxH@D] [--extras safe_area,keyboard,ctxloss]
    [--night-loaf] [--real-clock] [--no-shots] [--jobs N] [--port N | --url U | --server spawn]
node tools/mobile-capture.js --accept docs/mobile/accept/<unit>.json [--capture F] [--ref NAME=F] [--allow-stale]
node tools/mobile-capture.js --lint-accept FILE      node tools/mobile-capture.js --compare A.json B.json
node tools/mobile-capture.js --mutate-only --mutate-html maps-site/index.html      node tools/mobile-capture.js --self-test
```

- **Sandbox.** Playwright from `NODE_PATH`; Chromium is the only engine. `--cdn-dir` routes the two CDN globs to disk (a directory holding `leaflet-1.9.4.tgz` and `three-0.128.0.tgz`, or `leaflet/dist` and `three/build`); the Google Fonts hosts are aborted. The default server is in-process and byte-equal to today's `server.js`; `--server spawn` runs `PORT=<free> node server.js` once D1 lands.
- **Contexts.** Every context uses `serviceWorkers:'block'` (`--sw allow` adds `?sw=1`) and pins `navigator.hardwareConcurrency` / `deviceMemory` to 8 and 8 (`--hw-cores`, `--device-memory`); the pins are recorded in `meta.pinned` and in each profile's `env`.
- **Clocks.** The sim always runs on the virtual clock (rAF, `performance.now`, `Date.now`, `new Date()` on a fixed timeline, `Math.random` from a seeded copy of the sim's `xmur3` and `sfc32`), with no frame pumped before `ANNALS.ready`. The atlas pumps the same clock on a timer when `--clock virtual` (the default). Real-clock results (`--real-clock`, `--night-loaf`, wall times) live under `timing` and are informational.
- **Output.** `meta` (shas, pins, switches), `repo` (syntax, clock tokens by occurrence with the per-line multiset, keydown sha, `camera.near` and ladder literals, flag-1 anchors of the eight scripts read at run time, `STATS_KEYS` read from `street-1-research.js`, the `.claude/workflows/*.js` and `street-drift.js` shas, atlas function shas), then `atlas.<profile>` and `sim.<profile>`. Sim fingerprints are `sim.<profile>.seeds.<seed>.fingerprint` (speed 0, `ANNALS.hold(1e12)`, `simDays(400)`, sha256 of the canonical record) next to `rng_next` (the next value of `W.rng.gen/hist/amb/det`, taken last). `--compare` strips `meta`, `timing` and `shots` and diffs the rest.
- **Shots** are css-pixel PNGs, taken with reduced motion, animations disabled and the clock frozen; one over 300 KB is box-reduced by the smallest integer factor that fits for viewing, records its `scale`, and keeps the css-px original beside it as `<name>.full.png` (`full_path`). The image diff (UG8, `shot_diff` checks) only ever reads full-resolution files; a reduced shot without a `full_path` fails the diff.
- **`--accept`** scores a capture against the accept file. With no `--capture` (and no `capture` field in the file) it takes a fresh capture of the file's profiles and surfaces first; a capture of another tree is refused as stale unless `--allow-stale`. References: `B0` is `docs/mobile/baseline.json`, `R1` and `final` are `docs/mobile/captures/<name>.json`, `--ref NAME=F` overrides. Beyond the listed checks it scores every gate it can in code (UG1-UG8, UG10, UG11; UG9 runs the `VOCAB`, jargon and README-listing checks, and the voice read stays a model step) and applies the rule that any key not under `declared_change_keys` equals the baseline. `--lint-accept` rejects an unknown op or gate, an unlisted gate without a `waive` reason, a declared key broader than `surface.profile.key`, a mask over 35% of the viewport a declared clock line shorter than 12 characters, and a file whose `profiles` do not cover its gates (UG3 needs iphone13, pixel7, landscape, desktop and desktop2x; UG2 needs iphone13, pixel7, desktop and desktop2x). Scoring also fails a gate whose profile is missing from the capture, and a check on a `chrome_cover.peek` or `.half` key fails unless the capture holds a measured number there. Exit code 1 on any failure, with `{unit, pass, failing:[{key, op, expected, got}]}` on stdout.

Where the tool chose a reading of metrics.md:

- The inventory selector also takes `#drawerHandle`, `[data-sheet-handle]` and `.sheet-handle` (a div today, named a primary action in section 5), and drawer tabs count as disclosure controls so that "Hide the court" has reach 2.
- `chrome_cover` skips `pointer-events:none` wrappers and counts their interactive children (the Leaflet corner boxes paint nothing); `hover_ungated` skips cross-origin sheets; `top_occupancy` is the lowest bottom edge of fixed chrome that starts in the top 30% of the viewport and is under 35% tall.
- `cityCanvasSha` hashes the generated plans of Tamaron, Sokundo and Kanae after `ATLAS.descend`; `tiers_derived` computes B and C from the fit zoom and `TIER_CEIL` until A-U2 adds `ATLAS.tiers()`.
- Own card in the tap fixture is a whole-name match on the folded name from the card hash (`#place=` / `#faction=` / `#company=`), else on the card title or its part before a dash; chooser rows match a whole row or a whole dash segment. The one alias is an origin flag (`Hometown of X` / `Haunt of X` opens `#company=X`). Lepon is not Leponnia or Lepon the Old, and Epēshu is not The Senate of Epēshu.
- `declared_clock_lines` are whole lines, keyed on the sha of the whole trimmed line; each must exist in B0 or the capture. Each listing covers one changed copy of its line (list a line three times to add three copies); more changed copies than listings fail `UG3.declared_clock_lines`. Only the covered copies leave the count and the multiset, so a declaration never hides an undeclared token, and never a further copy of the declared line.
- `chrome_cover.peek` / `.half`: a sheet exists when the surface exposes `window.ATLAS.sheet.stop` / `window.ANNALS.sheet.stop`, or a shown `[data-sheet-handle]`, `.sheet-handle` or `#sheetHandle` inside `#panel` (atlas, card open) or `#drawer` (sim, ledger open). The stop is driven by the hook, else by tapping the handle until the sheet reports the stop through `data-sheet-stop` / `data-stop` on its `[data-sheet]` element (or the root) or a class `peek|half|full`, `sheet-<stop>` or `is-<stop>`. The value is the measured cover, `'no-sheet'` while none exists (B0), or `'unmeasured: ...'` when a sheet exists but the stop was not reached; it is never null. A-U9 and S-U8 provide the hook or those markers.
- The keydown range is 19 lines today (`window.addEventListener('keydown'` to its `});`); the 23 in metrics.md section 10 was approximate.

B0 reproduction on the unchanged tree (two runs agree on every non-timing key; the measured value is B0, units read B0):

| key | brief | measured |
|---|---|---|
| iphone13 atlas first load | 729,636 B / 37 | 729,636 B / 37 |
| pixel7 and desktop first load | 661,199 B / 32 and 597,108 B / 32 | same |
| repeat-visit cache hits | 0 | 0 |
| `doc_scroll` vs `innerHeight` (iphone13, whole chart) | 974 vs 664 | 974 vs 664 |
| Contents kicker and title top (iphone13) | -26 and -8 | -26 and -8 |
| `share_visible` (iphone13, pixel7) | 0.36-0.37, 0.29-0.30 | 0.360, 0.292 |
| Epēshu tap at z4.55 (iphone13) | opens the Lektān faction card | `#faction=The Lektān Priesthood` |
| `hover_ungated` | 29 | 29 |
| `chrome_cover.whole` (iphone13) | 0.29 | 0.254: the brief divides by the 553 px map stage; the metrics.md formula divides by the viewport and reads 0.254; the two cover the same pixels to about 5% |
| sim `targets_under_44` (iphone13) | 11 of 13 | 14 of 14: the 13 controls the brief lists plus the ledger handle, each under 44 in a dimension; no border-box rule yields 11 |

Findings the plan did not expect:

- `cityCanvasSha` is equal on iphone13, pixel7, landscape and desktop2x but different on desktop 1366x768@1, with or without the atlas mask tiles. Faking `devicePixelRatio` or `L.Browser.retina` does not change it, so the likely cause is canvas text hinting at a device scale factor of 1. UG3 therefore compares each profile to B0 and checks equality within the dpr>1 class; a 1x desktop is its own class. If the owner wants all five equal, that is a fix to the generator, not to the tool.
- The sim's `W.rng` streams are closures, so a cursor cannot be read without consuming a value; `rng_next` is the value drawn last, after the fingerprint.
