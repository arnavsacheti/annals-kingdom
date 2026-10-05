# Deep dive: mobile at the table — phones, poor wifi, and keeping the filigree

Verified 2026-10-04 against the atlas (`maps-site/index.html`) and the sim (`index.html`). Web claims survived only where
no verification lens refuted them (lens corrections applied); code facts survived only where the anchor check held
(spec-gap F12, F18, F19 dropped for anchor drift, re-read directly where they still matter); capture problems survived
only where the re-measure confirmed them. **All measurements are Chromium phone emulation (iPhone 13 390x664 DPR 3,
Pixel 7 412x839 DPR 2.625, desktop 1366x768) against localhost `server.js`, with SwiftShader software GL for the sim — not
real devices.** The "iPhone" profile is Chromium with an iPhone user agent, not WebKit. Full brief, defect table with
anchors and acceptance criteria: `../mobile/README.md`; machine-readable form: `../mobile/inputs.json`. Feeds
`docs/filigree/` and `docs/street/`.

## What phones get today (measured, emulated)
**Atlas**
- **Bytes.** First load 729,636 B / 37 req on iPhone (661 KB Pixel, 597 KB desktop). A repeat visit refetches **all of it**
  (0 cache hits). Nothing is gzipped (index.html 211,860 B → 66,752 B at gzip -9).
- **Time.** First tile 204 ms, ready 408 ms unthrottled. On slow 4G + 4x CPU: 2.5 s / 4.1 s, CDN latency **not** included.
- **Street zoom.** `art/overlay-Epeshu.jpg` is 2,171,881 B in one hit, no low-res step: 61-68% of a 3.2-3.6 MB session.
- **Layout.** Chrome covers 29% of the map at the whole chart on iPhone, 85-86% with layers open. "The Whole Chart" shows
  only 36-37% of the chart width on iPhone, 29-30% on Pixel (desktop 97-98%).
- **Touch.** About 98% of interactive elements are under 44 px. 89-113 pins and 0 labels at the whole chart (hover:none),
  97-106 pin pairs under 22 px apart. A tap on the Epēshu pin at z4.55 opened the **Lektān faction card** (badge stacked on it).
- **Sheet.** Place card is 50% of the screen and about 15 screens long. The closed sheet leaks 22 px over the footer and
  the document scrolls (974 vs 664). The Contents heading is clipped and unreachable on the short iPhone viewport.
- **Pyramid.** 860 tiles, about 9 MB per era, baseline JPEG Q88 at 256 px. Console clean except the blocked Google Fonts request.

**Sim (seed epeshu)**
- **Scene.** Phones draw about 994k tris in 25 calls and 48,568 trees, the same as desktop. A phone renders about 85% of desktop pixels.
- **Degrade ladder never fired.** rAF measured 1.06-1.56 fps under SwiftShader while `ANNALS.stats().fps` read 26-37 and
  degradeStep stayed 0 (dt is clamped, so the ladder is blind to a slow device). JS per tick is 3-9 ms: the frame is GPU-bound.
- **Payload.** index.html 1.2 MB raw (749,705 B gzip, not served); three.js r128 from cdnjs; render-blocking fonts.
- **Touch.** 11 of 13 visible controls are under 44 px. Top HUD occupies 15-22% of the screen. One-finger orbit works but
  panning cannot be found without the mouse-worded hint.
- **Unmeasured:** real phone GPU frame times, thermal behaviour, WebKit gestures, `100dvh`/safe-area.

## Verified practice (sources)
- **Label placement.** MapLibre v8 style spec: lower `symbol-sort-key` places first, a colliding later label is dropped,
  `text-padding` 2 px, `text-variable-anchor-offset` tries anchors in order (offset in ems, order is ours). Leaflet has no
  collision engine, so the atlas builds a ranked greedy bbox test. OSM Bright size ramps are not phone recommendations. High.
- **Touch targets.** WCAG 2.2 AA 2.5.8 is 24x24 CSS px with a spacing exception and an **Essential exception naming dense map
  pins**; culling pins is a UX choice, not compliance. Apple 44 pt / Material 48 dp are secondary-sourced. Medium.
- **Bottom sheets.** Material standard sheet: no scrim, map stays live, half-expanded 0.5, max 640 dp, handle at least 48 dp. Medium; not an Apple/Google Maps spec.
- **Leaflet 1.9.4 on touch.** Tap opens non-permanent and sticky tooltips (only hover-out is lost). TapHold fires `contextmenu`
  at 600 ms, `tapTolerance` 15 px. `zoomSnap:0` never snaps a pinch. `detectRetina` halves tiles for **any DPR > 1**. High.
- **Streaming defaults are desktop-sized.** 3DTilesRendererJS errorTarget 16, LRU 8,000 items / ~430 MB (byte limits need three r166+, not
  our r128), download queue 25; Cesium SSE 16, cache 512 MB. Phone values (SSE 32-64, ~100-150 MB) are proposals. High for defaults.
- **three r128** handles context loss/restore itself and exposes `shadowMap.autoUpdate`/`needsUpdate` (benefit unmeasured). High for the API.
- **HTTP caching (MDN).** Explicit `Cache-Control` everywhere; versioned assets `max-age=31536000, immutable`. High.
- **Storage (MDN).** Safari deletes script-written data after 7 days without interaction; `storage.persist()` is the lever; MDN does
  **not** say a Home Screen install exempts a site. High / medium.
- **Tile format (local, not perceptual).** 512 px tiles cut requests 4x; WebP q80 about 0.55x of JPEG on 12 tiles; AVIF ink-smear rests on MAE only. Medium / low.
- **Unverified leads, measure first:** iOS canvas cap about 384 MB, sustained-GPU drops of 20-60%, three.js phone rules of thumb, `navigator.vibrate` absent on iOS, Network Information API is Chromium-only.

## Principles
1. **Delay, never drop.** Same classes of ink and names as desktop; a budget may move a lower-rank name to a higher zoom, never remove it. No name below 12 px on coarse pointers (11 italic).
2. **Thresholds in absolute zoom; budgets in CSS px.** DPR picks sharpness only. Today atlas tiers ride on viewport-dependent `fitZoom` (1.95 iPhone vs 2.35 Pixel) — defect A19.
3. **One question per view; the full sheet is one tap away.** One "table drawer" bottom sheet; chrome at most 12% of the map at the whole chart.
4. **Tap reveals what hover reveals.** `:hover` gated by `(hover:hover)`; long-press peeks; taps resolve by distance to the glyph centre (one glyph within 22 px opens, two or more raise a chooser).
5. **Three-stop bottom sheets** (peek ~120 px, half, full), no scrim, 48 px handle, closed sheet hidden.
6. **Hit areas grow, glyphs do not.** 44 px padded hit areas; pads never decide a tap.
7. **Device classes for the street view** (phone/tablet/desktop; not the spec's LOD `tiers`), chosen at load, never touching the seed; ladder on real frame time with hysteresis and upward recovery; antialias off for the phone class.
8. **Bytes are a budget.** Compressed, versioned, immutable; no asset over 500 KB without a low-res step; proposed first atlas view at most 400 KB gzip.
9. **Offline plates.** Service worker precaches the shell, tiles cache-first from a versioned root; "Keep for the table" with `storage.persist()`, offered every visit, both origins, HTTPS required.
10. **The phone is a gate.** Every density gate also passes at 390x664 portrait and about 844x340 landscape at DPR 3, with reduced motion and night mode.
11. **Live through the session.** Pause on `visibilitychange`, survive context loss without regenerating the world, debounce resize, keep idle frames cheap.

## Defect summary (full table with anchors: `../mobile/README.md` §4)
- **Atlas A1-A22.** Major: A1 closed-sheet leak (S), A2 wrong-entity taps (M), A3 sub-44 px targets (M), A4 chrome cover (M), A5 whole-chart
  zoom (M), A6 layers panel (M), A7 2.17 MB overlay (M), A8 no compression or cache headers (S), A9 three foreign origins (S),
  A10 no offline (L), A19 `fitZoom`-dependent tiers (M, lands first). The rest are minor: clipped heading, unlabeled pins, 15-screen card,
  safe-area/dvh, sticky hover, landscape, 14 px search, tile cost, wake lock, reach, night-mode cost (uncaptured).
- **Sim S1-S18.** Major: S1 blind ladder (S), S2 no geometry reduction (M), S3 no context-loss handling (M), S4 hide-court restore (S),
  S5 sub-44 px controls (S), S6 uncompressed, CDN, no SW (S). The rest are minor: touch hint, pause when hidden, DPR on resize,
  landscape HUD, full-chart close, ledger sheet, viewport lock, graphs DPR, camera offset, 30 fps idle cap, wake lock, dark UI.
- **Order.** Sim S-items land before Street 3 holds `index.html` (S1-S3, S16 are prerequisites); atlas A-items before Filigree 3 holds
  `maps-site/index.html`; A8, A9, A10, S6 are delivery work outside both programs and can go first.

## Rulings outcome
- **Overridden, append-only:** R2 (delay-not-drop, 12 px floor), R7 (tap path for halos, glyph-centre rule), R12 (per-surface tidings
  snapshot on device), R14 (old survey fetched only when on), R18 (default-off toggle, per-device-class flip), ST8 (deterministic
  counts per device class; owner-run phone run filed under `docs/street/device-phone/`, not `device/`).
- **Kept as written:** R6, ST7, ST9, ST19.
- **Beyond overrides.** The channel replaces existing texts only; new ids and gate keys are refused. Phone viewports in slice gates, a byte
  metric, the hard-coded `['SV1','SV2']` phone list, probe device flags and a `/device_classes` spec shape need script or tool edits
  (`../mobile/README.md` §5.3). Overrides at Street 1 stamp time and Filigree 1 preflight must land before those jobs run.

## Open questions (nothing survived)
- **No real-device data:** phone GPU frame times, thermal behaviour, WebKit gestures, `100dvh`/safe-area, layers-control tap behaviour. Who runs the first pass?
- **Label budget figure:** no source gives labels per area; it needs tuning on a real phone against Filigree densities.
- **iOS eviction:** is "Keep for the table" enough if `storage.persist()` support on iOS is unverified?
- **HTTPS:** do `maps.` and `sim.princexizor.ddns.net` have certificates? Service workers, Cache API, `persist()` and Wake Lock all need them; iOS Wake Lock is unverified.
- **Hosting:** can the home server take compressed, cached traffic for a table of phones? Production nginx headers were not inspected.
- **WebP/512 px tiles:** visual check on ink-dense tiles needed; AVIF not recommended without a perceptual check.
- **Phone-class ladder bar:** the 28 fps step-down floor and 50 fps recovery bar are unmeasured, and the 844x340 landscape viewport is proposed, not captured.
- **Defaults:** do phones get filigree and street defaults with desktops, or later per device class? One-finger pan at altitude? Drop `user-scalable=no`? Haptics?
