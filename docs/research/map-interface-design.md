# Deep dive: digital map interface design

Fully verified 2026-07-16 (105 agents, 12 synthesized findings; 3 claims refuted).
Applied to the maps-site atlas: Leaflet 1.9, fixed raster map, ~120 settlement
markers, traced roads/rivers, region polygons, party-route playback, review cards.

## Foundation (confirmed)
- **CRS.Simple** is the documented approach for exactly this atlas; think in map
  units, calibrate bounds, negative minZoom. The wiki's pixel-coordinate marker
  convention maps cleanly onto a pixel-unit grid.
- **No clustering at our scale**: markercluster's ceiling is 10k-50k markers, and
  peer-reviewed work (Meier 2016) found the conventional cluster pattern has real
  comprehension shortcomings — don't adopt it uncritically. Zoom-threshold layer
  gating + category toggles are the proven alternatives.

## Adopt: the game-wiki playbook (confirmed, medium-high)
- **Category layer checkboxes** docked on the map edge (Fextralife Elden Ring):
  settlements / ruins / landmarks / party route / reviews as toggleable classes.
- **Zoom-band marker layers** (Fandom MapsExtended): major cities always visible,
  villages past a threshold — print-atlas label density, digitized.
- **Substring search doubling as a marker index**; ours can also search Patrinaic
  lexicon glosses.
- **Full view-state URL serialization** (marker id, center, zoom, active base
  map) for shareable deep links — matches the sim's `#s=seed&goto=` idiom.
- **Base-map swapping from a sidebar that doubles as the legend** for
  tiles-imperial / tiles-war variants.
- **Hover affordances for dense fields** (confirmed this round): raise the
  hovered marker's z-order + show a title tooltip, without opening the popup.

## Fix: accessibility (confirmed, with specifics)
- Leaflet's keyboard pan/zoom + focusable markers come free — preserve them
  (Google Maps embed isn't even keyboard-pannable per the 11-tool WCAG audit).
- Every marker gets a unique `alt` (`{alt: 'Epēshu'}`); divIcon markers carry the
  label in their HTML instead.
- Add `role` + `aria-label` to the map container — WCAG 4.1.2 failure otherwise;
  Leaflet issue #9119 remains open, authors must do it themselves.
- Enlarge controls: Leaflet defaults are 26×26 px (30 px touch) vs the 44 pt /
  48 dp platform guidance; every audited tool failed target-size. (The claimed
  focus-visible failure was **refuted** — but custom focus styling is still
  cheap insurance.)
- Interactive review-card content in **popups, never tooltips** — tooltips can
  receive focus since 1.8 but focus can never move *into* them.
- Vector overlays (roads/rivers/regions) are not focusable and carry no
  accessible names (issue #7822 open) — any interactive vector needs custom
  focus/labeling or a parallel list-panel access path.

## Refuted this round
- The "8192² imageOverlay causes performance problems" claim died in
  verification — so whether our 4390×2188 needs tiling *for the overlay case*
  is genuinely open (the tiling pipeline is still confirmed best practice for
  multi-scale serving; see accurate-mapping.md).
- markercluster knob details (maxClusterRadius/disableClusteringAtZoom) — moot,
  since we're not clustering.

## Open questions (nothing survived verification)
- Popup vs side-panel evidence, and **animated route playback** UX (scrubbers,
  reduced-motion, screen-reader narration of a moving route) — the party-route
  feature is designing in the dark; prototype and user-test.
- Dark/print styling for a fixed hand-drawn raster (CSS filter inversion vs a
  night-variant raster vs chrome-only theming).
- Whether zoom-layer gating actually beats clustering for low-count,
  high-semantic-value marker sets — untested in the literature.
