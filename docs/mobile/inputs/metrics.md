# Mobile measuring stick: definitions (M1.1 copies this to docs/mobile/metrics.md)

Everything a unit's acceptance measures is defined here once. `inputs/capture.js` and `inputs/probe.js` are the verified scratchpad harness that M1.1 promotes; `inputs/brief.md` is the research brief the reference numbers come from; `inputs/*-metrics.json` are the raw baseline captures (sandbox, the sandbox's Chromium (/opt/pw-browsers chromium-1194) under SwiftShader, Google Fonts and unpkg hosts blocked or stubbed). Where a number below differs from a fresh capture by more than 5%, the fresh capture is recorded as B0 and the unit text reads B0 (units never hard-code a sandbox number except as "was").

## 1. Counting rules (bytes, requests, foreign origins)
- `bytes` / `requests` / `max_asset` count only responses served by the app's own server (CDP `Network.loadingFinished.encodedDataLength`). Requests fulfilled by a Playwright route (the Leaflet and three.js stubs under `--cdn-dir`) and requests aborted by a route (fonts.googleapis.com, fonts.gstatic.com) are excluded from all three and listed in `routed[]` / `aborted[]` with their fulfilled body length. This is how the reference numbers were taken: 729,636 B / 37 requests = index 211,860 + data JSON about 216 KB + tiles 289,647 (20 requests) + the rest; the Leaflet stub is NOT in it.
- `foreign_origins` = distinct origins other than the server's that were requested, routed or aborted. Today the atlas shows 3 (fonts.googleapis.com, fonts.gstatic.com, unpkg.com) and the sim shows cdnjs.cloudflare.com plus the two Google hosts.
- Repeat visit method: the same browser context, first `page.goto(url)` settled (Contents shown, network idle + 400 ms), then a second `page.goto(url)` to the same URL (not `reload`, not a new context). `cache_hits` = requests that were answered 304, or reported by CDP `Network.requestServedFromCache`, or served by a worker. Reference: 0 hits.
- Byte targets in units are "transferred" bytes as above; "raw" means file size on disk.

## 2. Profiles and pinned host properties
| key | viewport @dpr | notes |
|---|---|---|
| iphone13 | 390x664 @3 | Playwright `devices['iPhone 13']` with the viewport height overridden to 664 (Safari with browser chrome); touch, coarse pointer |
| pixel7 | 412x839 @2.625 | `devices['Pixel 7']`, touch |
| landscape | 844x340 @3 | reported; gated only where a unit says |
| desktop | 1366x768 @1 | fine pointer, no touch |
| desktop2x | 1440x900 @2 | fine pointer |

Every profile pins `navigator.hardwareConcurrency` and `navigator.deviceMemory` with an init script (`Object.defineProperty(navigator, ...)`). Defaults: hardwareConcurrency 8, deviceMemory 8 on every profile. `--hw-cores N` and `--device-memory M` override both; the host's real values are never read. The capture JSON records the pinned values.

## 3. Emulation mechanisms (sandbox is Chromium only: no WebKit, no phone GPU)
| need | mechanism | status |
|---|---|---|
| CPU throttle | CDP `Emulation.setCPUThrottlingRate({rate:k})` (`--cpu k`) | recorded, never gated on time |
| network throttle | CDP `Network.emulateNetworkConditions` (`--throttle slow4g` = 1.6 Mbps down, 750 Kbps up, 150 ms RTT) | recorded, never gated on time |
| safe-area insets | CDP `Emulation.setSafeAreaInsetsOverride({insets:{top:47,bottom:34,left:0,right:0}})` so `env(safe-area-inset-*)` resolves | sandbox-verifiable if the command exists in the pinned Chromium; if not, the inset bullets are `proposal until Mobile 15` and the tool records `safe_area:'unavailable'` |
| on-screen keyboard | none. `visualViewport` height is changed with `Emulation.setDeviceMetricsOverride` (height 300) which exercises the layout code path only | the real iOS keyboard is `proposal until Mobile 15` |
| Save-Data | init script defining `navigator.connection = {saveData:true, effectiveType:'4g', addEventListener(){}}` plus request header `Save-Data: on` | sandbox-verifiable |
| WebGL context loss | `WEBGL_lose_context` extension `loseContext()` / `restoreContext()` | if `getExtension('WEBGL_lose_context')` is null under SwiftShader the tool records `ctxloss:'unavailable'` and the context-loss bullets are `proposal until Mobile 15` |
| wake lock, storage.persist | Chromium under automation: `navigator.wakeLock.request` may reject; the bullets assert the row exists iff `'wakeLock' in navigator && isSecureContext` and that a rejection is handled without a console error | persistence and real locking are `proposal until Mobile 15` |
| service worker | origin `http://localhost:<PORT>` with `?sw=1` (the guard excludes localhost and `navigator.webdriver` otherwise). The production path (HTTPS host, no flag) is tested as a pure function `shouldRegister({hostname, isSecureContext, webdriver, search})` under node | see the matrix in D7 |
| virtual clock | the street probe's recipe: `requestAnimationFrame`, `performance.now` and `Date.now` on a fixed timeline, seeded `Math.random`; `ANNALS.hold(1e12)`, speed 0 for fingerprints | deterministic |
| real clock | wall time in SwiftShader | informational only: `degradeStep` and `fps_median` under the real clock are recorded, never gated (SwiftShader frame time says nothing about phones) |

## 4. Metric formulas
- `doc_scroll` = `document.scrollingElement.scrollHeight`; compared with `innerHeight`.
- `chrome_cover.<state>` = area of the union of the bounding rects of all visible fixed or absolute chrome elements (everything inside `body` that is not inside `#map .leaflet-pane`, intersected with the viewport) divided by viewport area, for state whole (The Whole Chart, drawer closed or at peek as the unit says), layers (layers list open), peek (drawer at peek).
- `share_visible` = the visible fraction of the chart rectangle's width times height: intersection of the viewport (in atlas px through `map.getBounds()`) with the full chart rectangle, divided by the chart rectangle area, at The Whole Chart view.
- `contents.kickerTop` / `titleTop` = `getBoundingClientRect().top` of the Contents kicker and title (reference -26 and -8 on iphone13).
- `hover_ungated` = number of CSSOM style rules containing `:hover` that are NOT nested inside an `@media (hover:hover)` rule (walk `document.styleSheets[*].cssRules`; same-origin sheets only). Reference 29.
- `targets_under_44` = visible interactive controls (control inventory below) whose border box is below 44x44 CSS px; markers count by their pad size (the larger of glyph and pad rect). Ratio is that count divided by the inventory size. Reference 123 of 127 on iphone13.
- `min_font_px` = smallest computed `font-size` among visible text nodes of the chrome (not map tile art).
- `wrong_card` / `wrong_taps` = taps at each interactive glyph's drawn centre; wrong when the tap opens a card (or `location.hash`) other than that glyph's; a chooser listing the glyph counts as right.
- `share`/`phone.overlaps` follow the filigree capture contract.
- `calls`, `tris` = `renderer.info.render.calls` / `.triangles` at the street probe's three fixed views under the virtual clock.
- `fps_median` = median of the per-second frame counts over the report window, from the rAF timestamp argument only.
- `clock_tokens`: see section 6.
- `cityCanvasSha` = sha256 of the seeded city canvas bytes (`genCityCanvas` output) and must be equal across all five profiles.
- Fingerprint = sha256 of canonical JSON `{clock, dayTicked, settlements, agents, chron, treasury, routeVolume}` after speed 0, `ANNALS.hold(1e12)`, `ANNALS.simDays(400)`, taken for `#s=epeshu` and `#s=tamar1374`, twice.

## 5. Control inventory, reach, primary actions
- Inventory = every element matching `a[href], button, input, select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"]), .leaflet-control a, .leaflet-marker-icon.leaflet-interactive` that is visible and hit-testable in some state reachable from the initial view. A control's id is `role + ":" + accessible name` (aria-label, else title, else text trimmed to 24 characters).
- `docs/mobile/controls.json` is captured on `desktop` (1366x768) in B0 and lists every id with `primary:true|false`.
- `reach` of a control on a phone = the smallest number of taps (BFS over disclosure controls: `aria-expanded`, drawer handle, layers toggle) after which `document.elementFromPoint` at its centre returns it. A-U8 requires reach <= 2 for every id in controls.json.
- Primary actions (`primary:true`): atlas = search field, zoom in, zoom out, drawer handle, layers toggle, card close, card first action; sim = pause, the five speed buttons, Hide the court, Return the court, the ledger open control, Close the chart. "Bottom 25%" means the control's centre lies in the bottom quarter of `innerHeight`.

## 6. Clock tokens
- Pattern P = `Math[.]random|Date[.]now|new Date[(][)]|performance[.]now`; wide pattern W = `Math[.]random|Date[.]now|new Date[(]|Date[(]|Date[.]parse|performance[.]now|Intl[.]DateTimeFormat|crypto[.]getRandomValues|requestIdleCallback`.
- `clock_tokens` is counted by OCCURRENCES (`grep -oE ... | wc -l`), not lines. Baseline (this tree): `index.html` P = 37 occurrences on 35 lines, W = 37; `maps-site/index.html` P = 1, W = 2 (`requestIdleCallback` at about line 2010 and `performance.now` at about line 3181).
- The gate is: occurrences in `index.html` stay exactly 37 (P and W) and the per-line multiset of matched tokens (line text, token, count) is identical to B0 apart from lines a unit declares; maps-site stays at its W baseline. The ladder, the hidden-pause handler and the wake-lock code take time only from the rAF timestamp argument.

## 7. Image diff and desktop identity
- One function: decode both PNG shots at the same size; a pixel differs when `max(|dR|,|dG|,|dB|) > 8`; `diff` = differing pixels outside the declared regions divided by all pixels. Default tolerance 0.5%. Declared regions are rectangles in the accept file (`mask`). Shots are taken with `animations:'disabled'`, `prefers-reduced-motion: reduce`, the virtual clock frozen, and tile layers settled.
- "Identical" for computed-style or DOM snapshots = deep equality of `{selector, rect, computed font-size, color, display, visibility}` records for the control inventory, ignoring keys the accept file lists under `declared_change_keys`.
- Desktop identity (UG8) runs on desktop and desktop2x.

## 8. The `--accept` file
`docs/mobile/accept/<unit-id>.json`. Authored BEFORE the implementer runs, by the loop's accept-author step (a sonnet/medium agent that sees only the unit's acceptance bullets and this file, never the implementer's diff) or by the central session; the implementer receives it read-only. M1.1 delivers `--accept` scoring and `--lint-accept <file>` (schema check).

```json
{
  "unit": "A-U1",
  "profiles": ["iphone13", "pixel7", "desktop", "desktop2x"],
  "clock": "virtual",
  "gates": ["UG1","UG2","UG3","UG4","UG5","UG6","UG7","UG8","UG9","UG10","UG11"],
  "declared_change_keys": ["atlas.iphone13.doc_scroll", "atlas.pixel7.doc_scroll"],
  "mask": [{"profile": "desktop", "rect": [0, 0, 0, 0], "why": "none"}],
  "checks": [
    {"key": "atlas.iphone13.doc_scroll", "op": "==", "value": 664, "was": 974},
    {"key": "atlas.iphone13.contents.kickerTop", "op": ">=", "value": 0, "was": -26},
    {"key": "atlas.desktop.shot_diff", "op": "<=", "value": 0.005, "ref": "R1"},
    {"key": "atlas.desktop.metrics", "op": "deep-equals", "ref": "R1", "except": ["declared_change_keys"]}
  ]
}
```
Ops: `==`, `!=`, `<`, `<=`, `>`, `>=`, `between` (value `[lo,hi]`), `within` (value, `tol` as a fraction), `deep-equals`, `absent`. `ref` names a baseline (`B0`, `R1`, `final`, or a unit id's capture); a check with `ref` and no `value` compares to that baseline's same key. A key not listed in `declared_change_keys` must equal its B0/R1 value or the unit fails. Output: `{unit, pass, failing:[{key, op, expected, got}]}` and exit code 1 on any failure.

## 9. Voice rubric (UG9)
`docs/mobile/voice-rubric.md` is the only rubric. Player-visible strings (labels, titles, aria-labels, hint text, tidings) are enumerated in `docs/mobile/README.md` under "Player-visible strings"; only that list is voice-read. A string passes when: it matches neither `VOCAB` nor `VOCAB_ST` (`VOCAB` is the const at `.claude/workflows/filigree-1-research.js:97`; `VOCAB_ST` is derived from it in the street config region and read by `tools/street-drift.js:138`; the voice read runs the regex from those files, it does not retype it); it contains none of: tap, click, swipe, pinch, drawer, modal, menu, toggle, dismiss, app, download, install, offline mode, dark mode, theme, settings; years appear only as A.B.; the words are table words (chart, court, ink, lit, keep, furl, mark). The wiki canon names (for example "The Lektān Priesthood", a faction name) are exempt from the VOCAB grep and from the jargon list. A sonnet/low reader returns one pass/fail per string with the offending word; the unit passes with 0 fails.

## 10. The keydown sha
Range: the text of `index.html` from `window.addEventListener('keydown'` to its matching `});`, found by a node script that matches braces starting at the first `{` after the anchor (the definition Street 1's `keydown_sha` uses, `street-1-research.js` line 588); sha256 of that text. Today the range is 23 lines (about lines 6103-6125).
