# Deep dive: how professional atlases are structured

Fully verified 2026-07-16 (104 agents, 9 synthesized findings; 1 over-absolute
claim refuted). Applied to maps.princexizor.ddns.net — turning the map viewer
into an *atlas*.

## What makes an atlas an atlas (confirmed, high)
- An atlas is a **systematic** collection: deliberately selected scales, a
  dedicated region, a dedicated goal (ICA Commission on Atlases; Hake 2002,
  Kraak & Ormeling 2010 — with the verifier's nuance that "selected scales"
  means deliberate selection, not necessarily a strict ordered hierarchy).
- Maps organize along **thematic content, spatial extent, temporal viewpoint**
  in a **unified map language** (Voženílek 2015). Our cartographic key
  (ring-dots, ◉ double-rings, dotted roads, solid rivers) is that language —
  every new layer (war overlays, trade lanes, party route) should reuse it.
- A *digital* atlas earns the name via a purpose-built GUI and a **narrative
  faculty** (Atlas of Switzerland; van Elzakker/Ormeling's Atlas Information
  Systems). Session-log reviews, party-route playback, and era states ARE our
  narrative faculty. The Swiss atlas's **two-level structure** — thematic start
  screen (table of contents), then map screen with layer bar + toolbar — is the
  digital analogue of plate organization and worth adopting: a landing view of
  themes (Realms · Roads & Trade · The War · The Party's Road · The Lexicon)
  that open the map preconfigured.

## The gazetteer (confirmed, high — our oldest feature)
- Atlases have paired name indexes with map locations **since Ptolemy**; every
  atlas index is a gazetteer (Losang, ICC 2021).
- The minimal schema is a triple: **name, category, footprint** (Hill 2000, the
  Alexandria Digital Library paper; later standards extend, never dispute it).
  One gazetteer JSON (name, kind, px coords/bounds, region, wiki link, Patrinaic
  etymology) should unify search, markers, and the lexicon page.
- **leaflet-search** (confirmed) drives exactly this as a Leaflet control —
  searching marker metadata by property, or an external JSON source — no
  separate index database needed.

## Technical substrate (confirmed; one phrasing refuted)
- CRS.Simple officially targets large hand-drawn/game rasters; the established
  multi-scale pipeline is gdal2tiles-leaflet + leaflet-rastercoords with
  pyramid depth ≥ zoom 5 for 4390×2188 (details in accurate-mapping.md). The
  refuted variant was only the claim that tiling is *the* required way to serve
  the image — pipeline yes, dogma no.
- **Practitioner precedent confirmed**: a published D&D Leaflet atlas uses this
  exact stack end-to-end — CRS.Simple pyramid, narrow zoom band, setMaxBounds
  clamp, and thematic marker classes as toggleable L.layerGroups.

## Marginalia (confirmed, medium)
The cartographic "map surround" inventory — title, legend, orientation, scale
bar, border, credits, insets — carried as compact overlaid panels with the map
at the top of the visual hierarchy. We have title/legend/key; missing: an
in-world **scale bar** (needs the units-per-league calibration) and a colophon.

## Open questions (nothing survived)
- **Imhof's actual label-placement rules** and which are enforceable in Leaflet
  (collision plugins? pre-baked label positions?) — the base raster already
  carries hand-drawn names, so this mostly matters for overlay labels.
- Mapping the professional atlas **editorial workflow** (compilation manuscript,
  plate spec, proof cycles, editions) onto this repo's versioning of atlas data.
- Expressing scale hierarchy with only one source raster: zoom-dependent
  layer/label tiers vs hand-authored inset maps for dense regions (Leponnia).
- Whether to trace region boundaries/roads as vector overlays (toggleable,
  searchable, gazetteer footprints) or leave them in the raster, given the
  printed key already draws them.
