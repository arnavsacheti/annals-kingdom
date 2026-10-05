# Research digests

Deep-research dives (web search fan-out → source fetch → 3-vote adversarial
verification → synthesis) completed 2026-07-16 in service of the sim and the
maps-site atlas. Verification is complete across the first five digests below:
**50 synthesized findings survived** (high/medium confidence, votes recorded per
finding), **13 over-absolute or wrong claims were refuted**, and each digest ends
with the open questions where *no* claim survived — genuine gaps, not
oversights. The sixth, `cartographic-filigree.md`, was verified on 2026-10-04 by
a different method (16 tasks, two verification lenses per claim) and is outside
those counts.

- `atlas-structure.md` — what makes an atlas an atlas; the gazetteer triple; the
  two-level Swiss-atlas GUI pattern; missing scale bar
- `map-interface-design.md` — game-wiki playbook (layer toggles, zoom bands,
  deep links), clustering caution, concrete a11y fixes with issue numbers
- `accurate-mapping.md` — CRS.Simple discipline, the TMS/XYZ y-flip, gdal2tiles
  vs libvips, confirmed U-Net+watershed and mapKurator extraction pipelines
- `town-generation.md` — the confirmed roads→parcels→massing→roofs pipeline,
  Pompeii precedent for chart-matched towns, preindustrial semantic growth
- `web-performance.md` — frame budgeting (INP, Long Animation Frames), draw-call
  hygiene with measurements, Leaflet tile knobs, the raster pipeline zoom math
- `cartographic-filigree.md` — the Collison/Azlen filigree thread and the geo.admin stack decoded; why the
  zoom feels smooth (Leaflet 1.9.4 vs the atlas); the Swiss layers in fiction; the `EPESHU_HF` relief window
  (verified 2026-10-04, feeds `docs/filigree/`)
- `filigree-for-the-table.pdf` — the owner's brief (v2, 8 pages) for the table map; not a digest.
  Authoritative input to `docs/filigree/`, which splits it into four jobs.
- `streamed-streets.md` — the 3D city post (owner's paraphrase) decoded into r128 methods (screen-space-error
  refine, a bounded queue + LRU that stays coarse, 250 ms fades, render-only IDM spacing) and bronze-age readings
  (fords and one-lane bridges in turn, toll halts, gates at the dark hour, the herald's tidings); verified
  2026-10-04 by two lenses per claim, outside the counts above; feeds `docs/street/`
- `mobile-at-the-table.md` — what phones get today (Chromium phone emulation with software GL, not real devices), verified
  mobile practice (label placement, touch targets, sheets, caching, storage), eleven principles, the atlas/sim defect
  summary and the ruling overrides (R2 R7 R12 R14 R18 ST8 overridden; R6 ST7 ST9 ST19 kept); verified 2026-10-04 by
  verification lenses, outside the counts above; full brief in `../mobile/README.md`, data in `../mobile/inputs.json`
