# Polish backlog — the meshed world and both sites

Worked by scheduled polish runs: each run takes the TOP unchecked item only, implements
it per `.claude/CLAUDE.md` process (delegate substantive edits to an opus agent, verify
in-browser or via the CDP fallback, zero console errors), checks it off with a one-line
result note, adds any newly discovered gaps to the bottom, cuts a patch release
(`vX.Y.Z-alpha.N+1`), and pushes (auto-deploys the Pages demo). One item per run —
resist scope creep. If another workflow holds the target file, take the next
non-conflicting item instead.

## Queue

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

- [x] **Layers panel intrusiveness (USER FLAG) + era control** — the 16-row layers
  panel now collapses to the standard icon on all sizes (expands on hover/tap), and
  the era panel is a compact current-age chip that expands on tap and re-folds after
  a pick. (v0.9.9-alpha.1)

- [x] **Generated POI variety** — oddity pool widened to eight (springs, wash-stones,
  tithe-yards, beacon posts, plague-stones…) and towns gain one civic institution
  (gallows hill, horse fair, tithe-barn, muster ground, counting-house); all ✶,
  ruin branch untouched. (v0.9.8-alpha.1)

- [x] **Lake biome** — Penthelon's footprint anchor was floating IN the Five Fingers
  (wiki marker position; 14% land); snapped to the charted shore, biome 'lake' set
  (canon), and lake styling added: fishing-stake rows in the shallows joining the
  Lakemen stilt-piers. The mask supplies the true lakeshore. (v0.9.7-alpha.1)

- [x] **Riverside cities** — seeded winding rivers rasterized into the shared water
  field (lanes, buildings, fields, and rubble all stop at the banks automatically);
  bridges where primaries cross; market/gates/temple nudged to dry ground; the
  Kolens Connection placed on its riverbank; Ion Ephel's Tungril hugs the ruin
  toward the sea. Controls byte-identical. (v0.9.6-alpha.1)

- [x] **Crossfade palette match** — verified already delivered by the terrain-melding
  run (§c surround tint toward the sampled atlas hue, in code at the vignette block);
  no further change needed. (closed in run 9)
- [x] **Overlay pre-warm** — approaching within six footprints below the descend
  threshold now pre-bakes the city plan via requestIdleCallback; verified Kanae
  pre-registered at z6.0 with distant cities untouched and instant overlay on
  descent. (v0.9.5-alpha.1)

- [x] **Addressable alleys** — lane graphs with T-junctions and two widths replace the
  jittered infill; every building fronts a walkable lane (gate → street → alley →
  door); ruins byte-identical, determinism proven at both async stages. (v0.9.4-alpha.1)
- [x] **Line tap targets + chart labels (USER FLAG)** — 16px invisible hit-lines over
  ways and lanes (click verified opening the Sun Road card); chart cartouches read
  their typed label (the Seat says BUILDING PLAN, not CITY CHART). Shipped alongside
  the Sun Road canon re-trace and the chart curation. (v0.9.4-alpha.1)

- [x] **Census follow-ups** — wide-crop re-read of the 13 quarantined names recovered
  4 towns (Netho, Nīs Garnata, Ūmak-nūs-Ion, Nhandar Khezīn; Ītor Hāspira was already
  in) and 7 confirmed non-towns; Clickerhall snapped 40px to its true printed dot;
  full-atlas template match proved the three known double-ring glyphs are the only
  ones — an honest negative. (v0.9.2-alpha.1)

- [x] **All named cities anchored (USER FLAG)** — 306 detected dots transcribed by a
  7-agent fan-out (167 towns high-confidence, 126 false positives skipped, 13 low-
  confidence quarantined); all integrated with trace provenance, four approximate
  anchors snapped to their true printed dots, "Lesser settlements" tier-C sub-toggle
  keeps the continental view clean; Hemdok Laego descends onto a mask-true plan.
  (v0.9.0-alpha.1)

- [x] **Epēshu roundel doubling** — all 19 POI coords corrected to the true printed
  badge centers (blob detection for 9, contact-sheet measurement for 10 after an
  int16 luminance overflow and tree-blob false matches were run down); live markers
  are now invisible interactive halos over the print, revealed on hover. Deep-link
  click targets land exactly. (v0.8.5-alpha.1)

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
