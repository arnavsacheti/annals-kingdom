# Polish backlog — the meshed world and both sites

Worked by scheduled polish runs: each run takes the TOP unchecked item only, implements
it per `.claude/CLAUDE.md` process (delegate substantive edits to an opus agent, verify
in-browser or via the CDP fallback, zero console errors), checks it off with a one-line
result note, adds any newly discovered gaps to the bottom, cuts a patch release
(`vX.Y.Z-alpha.N+1`), and pushes (auto-deploys the Pages demo). One item per run —
resist scope creep. If another workflow holds the target file, take the next
non-conflicting item instead.

## Queue

- [ ] **Terrain continuity (USER FLAG)** — generated plans must MELD with the atlas
  under them, not float over it. (a) Derive each plan's land/water from the atlas
  pixels beneath its footprint: sample the atlas tile region around the anchor,
  classify land vs water by tint (the warmth threshold trick from the terrain lab),
  and build the plan's land blob + coastline FROM that mask so the drawn coast
  continues through the plan at the right angle and curve — replace the synthetic
  compass-side shoreline. (b) Locally fade the atlas HARDER directly under the
  footprint (radial patch on top of the global base-opacity ramp) so the magnified
  printed town label/dot don't fight the plan. (c) Irregular seeded alpha vignette on
  the canvas edge + tint the surround toward the sampled atlas hue, so the plan
  dissolves instead of ending in a hard square (seen east of Kardunash/Drāmūz).
- [ ] **Route continuity (USER FLAG)** — ways and routes should roughly line up with
  the plans: compute per-city approach bearings from every world polyline that ends at
  or passes within the footprint (party route, named ways, sea lanes → data pass over
  their pts), feed them into the generator so gates + main streets open on those
  bearings and quays face the lane; and let a short road/route stub persist into the
  street tier to the city edge so the connection reads visually.
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
- [ ] **Riverside cities** — Kolens is canon 'riverside' but the generator only knows
  seas: add a river mode (traits `river: {side}`), a winding watercourse through or
  beside the plan with a bridge or two, quays optional.
- [ ] **Generated POI variety** — beyond market/temple/gate/docks/inn: seeded wells,
  shrines, yards, gallows, springs; kind-weighted; all ✶.
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

- [x] **Off-frame points visible (USER FLAG)** — clampToFrame at every render site;
  4 off-chart markers now edge-pinned with direction chevrons + "beyond the charted …"
  cards; journey lands wps 3–5 fully in-frame; BONUS: fixed a pre-existing crSpline
  Barry–Goldman denominator bug that sprayed leg tails ±40k px. (v0.8.1-alpha.1)
