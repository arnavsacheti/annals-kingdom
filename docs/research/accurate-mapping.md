# Deep dive: accurate mapping of fictional raster maps

Fully verified 2026-07-16 (105 agents, 11 synthesized findings; 3 over-absolute
claims refuted). Applied to the atlas over PatrinorModern.png (4390×2188) and
maps-site/tiles*/.

## Coordinate discipline (all confirmed, high)
- **CRS.Simple**: 1 map unit = 1 pixel at zoom 0; negative minZoom for whole-map
  views; one CRS per map, set at creation. Standard pattern: `crs: L.CRS.Simple`
  → `L.imageOverlay(url, bounds)` → `fitBounds` (tile pyramid instead of a
  single overlay for large rasters).
- **[y, x] ordering** ([northing, easting], like [lat, lng]) — the canonical fix
  is the tutorial's own `xy()` wrapper. Mirrored-coordinate bugs are usually this.
- **Map units ≠ image pixels**: calibrate by measuring pixel distance between
  known reference points and extrapolating units-per-pixel (bounds may include
  margins). Once unit-calibrated, distance measurement is a multiply by the
  units-per-league constant.
- **TMS vs XYZ y-flip** is the canonical tile pitfall: gdal2tiles emits TMS
  (y=0 south) by default; fixes are `--xyz` (GDAL ≥3.1), Leaflet's `tms: true`,
  or gdal2tiles-leaflet's `-l` flag (origin at NW corner). Our wiki's
  lat-from-bottom-edge convention is this same inversion — handled once,
  documented forever.

## Tiling pipelines (both confirmed)
- **gdal2tiles**: `raster` profile tiles fully ungeoreferenced images (other
  profiles abort without georeferencing); 256 px tiles default (`--tilesize`
  ≥3.1); PNG default, WEBP ≥3.6 (lossy q75 / `--webp-lossless`), JPEG ≥3.9
  (no alpha — black edge tiles).
- **libvips dzsave**: `--layout google` emits Leaflet-compatible top-left-origin
  XYZ pyramids, fast and low-memory in a single scan — the better tool if the
  scan is ever upscaled.
- The complete pixel-coordinate workflow (gdal2tiles-leaflet + leaflet-
  rastercoords `unproject()` for markers authored in image pixels) is confirmed
  as *a* documented end-to-end recipe. Refuted as over-absolute: that the
  rastercoords plugin is *required*, that the depth formula is a hard failure
  bound, and one specific command-line transcription — treat these as defaults,
  not laws.

## Vectorization & label extraction (upgraded from leads to confirmed)
- **Two-stage pipeline for scanned maps** (peer-reviewed benchmark, PLOS ONE):
  U-Net-family edge filtering → **classical Meyer watershed** for closed-shape
  extraction — U-Nets generalized better than transformer edge detectors, and
  the classical watershed beat the end-to-end deep one. Relevant to tracing
  region boundaries/blocks from the atlas scan.
- **mapKurator** (Chiang et al., SIGSPATIAL 2023): end-to-end ML pipeline for
  detecting, post-processing, and linking text labels on large historical map
  scans where generic OCR fails — the exact shape of our settlement-label
  sweeps over PatrinorModern.png.

## Open questions (nothing survived)
- Off-by-half-tile registration and resampling-blur tradeoffs (kernel choice,
  overzoom strategy) — no quantitative comparison survived verification.
- How well U-Net/mapKurator transfer to a *single hand-drawn fantasy map*
  without corpus training data — few-shot vs interactive tracing is untested.
- WEBP vs PNG vs JPEG for line-art/parchment scans specifically, and the raster
  size where a pyramid measurably beats a single imageOverlay.
- Scale bars and distance measurement under CRS.Simple with fictional units —
  which measurement plugins accept a custom distance function.
