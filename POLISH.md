# Polish backlog — the meshed world and both sites

Worked by scheduled polish runs: each run takes the TOP unchecked item only, implements
it per `.claude/CLAUDE.md` process (delegate substantive edits to an opus agent, verify
in-browser or via the CDP fallback, zero console errors), checks it off with a one-line
result note, adds any newly discovered gaps to the bottom, cuts a patch release
(`vX.Y.Z-alpha.N+1`), and pushes (auto-deploys the Pages demo). One item per run —
resist scope creep. If another workflow holds the target file, take the next
non-conflicting item instead.

## Queue

- [ ] **Epēshu roundel doubling** — the real chart has its own printed number badges
  and the engine adds live POI roundels ~28 px offset from them at depth. Suppress the
  seam: either align the engine markers to the printed badges exactly (per-POI pixel
  nudge table) or fade engine roundels where the print already carries the number.
- [ ] **Addressable alleys** — generated plans fake alleys as gaps between building
  cells. Add a true lane graph pass (minor streets branching between spokes/ring,
  buildings snapped to lane frontages) so the warren is traceable turn by turn.
- [ ] **Crossfade palette match** — sample the atlas terrain tone around each city
  anchor and tint the generated surround toward it so the z6.8–7.8 fade band doesn't
  shift hue.
- [ ] **Overlay pre-warm** — first approach to a generated city can jank on the
  synchronous 2048² draw. Pre-generate the nearest unbuilt city during idle (rIC) once
  the camera is within ~6 footprints.
- [ ] **Lake biome** — Penthelon is canonically on the Five Fingers LAKE, currently
  approximated as 'riverine'; add a lake enum (shore on the mask's water, no tide
  marks, fishing-stake rows) when the river mode lands.
- [ ] **Riverside cities** — Kolens is canon 'riverside' but the generator only knows
  seas: add a river mode (traits `river: {side}`), a winding watercourse through or
  beside the plan with a bridge or two, quays optional.
- [ ] **Generated POI variety** — beyond market/temple/gate/docks/inn: seeded wells,
  shrines, yards, gallows, springs; kind-weighted; all ✶.
- [ ] **Era control on small phones** — "The Atlas Through the Ages" panel eats ~1/3
  of an iPhone SE viewport; collapse it to a single chip/button that expands on tap
  below 640px (verified bulky in the 375×667 emulation sweep).
- [ ] **Notch safe-areas** — add viewport-fit=cover + env(safe-area-inset-*) padding
  on the header/dock so notched phones in landscape don't clip controls.
- [ ] **Trackpad gesture feel** — after real-finger feedback: tune the sim's pan gain
  and the atlas handler's pinch sensitivity so both apps feel identical.
- [ ] **Region-chart zoom-through** — evaluate footprint-anchoring the REGION MapArt
  (Rhusagos, Relkor…) at mid zooms the way cities anchor at street zooms; keep modal
  where the geometry doesn't fit.
- [ ] **Uncharted-band softening** — the parchment grain pops in abruptly near z6.8 in
  open country; ease it with the same opacity ramp the base uses.
- [ ] **Data fetch cache-busting** — append the app VERSION to data/*.json fetch URLs
  so local demos never show stale cards after a data edit (Pages ETags already handle
  the deployed site).
- [ ] **Tier-hidden markers intercept clicks** — invisible (tier-faded) route waypoints
  still capture pointer events and can steal clicks from markers beneath them
  (pre-existing Leaflet pane quirk): set pointer-events none on faded panes.
- [ ] **Sim ↔ atlas continuity** — matching deep-link vocabulary both ways
  (sim `#goto=` ↔ atlas `#chart=`), so cross-links can land on the same place.

## Done

(check items off above and move them here with a one-line result + version)

- [x] **Cultural & historical texture (USER QUESTION → PASS)** — 28 cities now carry
  biome/condition/hinterland with per-claim provenance (Hordon arid per canon's
  "semi-arid island"; Ion Ephel ruin at the Tungril's mouth; 14 lesser Leponnian
  towns faded under the post-Sack decline, ✶-flagged); generator renders frost/arid/
  wooded grounds, gap-toothed faded towns with wall breaches, Lakemen stilt-piers,
  Goblin-Dwarf burrow-holds, Hord longhouse ruins, port-leaning hinterland roads;
  three new canon anchors (Hordon, Clickerhall, Ion Ephel); default-trait cities
  byte-identical. (v0.8.4-alpha.1)

- [x] **Route continuity (USER FLAG)** — per-city approach bearings from every
  world polyline: gates open exactly where roads arrive (Tamaron's Sun-Road gate
  points at Epēshu within 3.6°), quays bias toward their sea lanes on the true
  waterline, street-tier stubs carry the arrival into the plan; control cities
  bit-identical to baseline; Drāmūz honestly sea-only (no land route in data).
  (v0.8.3-alpha.1)

- [x] **Terrain continuity (USER FLAG)** — generated plans now derive land/water from
  the atlas pixels beneath them (border-connected flood drops label ink; Kardunash's
  coast continues on the true west; Sokundo follows the drawn strait over its authored
  bearing); parchment wash under every plan kills the giant-label fight; seeded
  irregular vignette ends the hard square edge. Deterministic, zero errors.
  (v0.8.2-alpha.1)

- [x] **Off-frame points visible (USER FLAG)** — clampToFrame at every render site;
  4 off-chart markers now edge-pinned with direction chevrons + "beyond the charted …"
  cards; journey lands wps 3–5 fully in-frame; BONUS: fixed a pre-existing crSpline
  Barry–Goldman denominator bug that sprayed leg tails ±40k px. (v0.8.1-alpha.1)
