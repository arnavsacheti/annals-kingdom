# DM rulings on the canon-etymology open questions (2026-07-16)

Answers from the campaign DM to the questions raised in `canon-etym.json` /
`compounding.md`, and what changed in the repo because of them.

1. **Tamaron** = Tamar + **-ion** 'town' → "moon-town". The suffix was missing from the
   PolyGlot save. Encoded in the sim as `['on','i','%-town']` (bare `-on` after consonant
   stems, matching Tamar+ion → Tamaron; connector `i` after vowel stems by analogy with
   -(g)os/-(n)or). Canon etym updated from "moon-land" to "moon-town".
2. **Epēshu** is the pre-Patrin native word for the land (historic sound changes since the
   Patrin migration). It stays unglossed in the sim — a substrate name, not Patrinaic.
   The dictionary's own external-origin data includes an "Unknown Substrate" tongue,
   consistent with this.
3. **Leponnia** is an anglicization and does not reflect the actual language. No sim change.
4. **Mīth Mīrdak** was a mistake — canon is now **Mīth Mirdānak** "(town) of the artisans".
   Renamed in index.html (with etym 'the town of the artisans') and in
   maps-site/data/city-traits.json / city-anchors.json.
5. The "only 208 etymology links" finding was an extractor bug, not a data gap:
   tools/pgd2lexicon.js originally read only single-child internal relations and ignored
   external parents. Fixed — the save actually carries **1,848 internal pairs + 355
   external-origin links; 1,346 of 1,365 words have etymology.** External origins name the
   language family: Proto-Paternic, Proto-Patrinaic, Ghahuric/Ghahurese/Ghahurene, Bibunic,
   Old Gemenite, Sārmathic, Unknown Substrate. (This also confirmed the chronicle's
   "old Paternic" flavor line was correct as written; the earlier harmonization to
   "Patrinaic" was reverted.)
6. The dictionary is a work in progress; re-run the compounding study
   (`compounding.md`) against the richer ety data when convenient.
7. (2026-07-16, follow-up) The language's endonym is **Peternek Hag**, literally
   "Language of the Patrin". *Hag* 'mouth, language, speech, voice' is attested
   (the genitive-first, head-final order matches the compounding evidence);
   *Peternek* is the Patrin ethnonym in a form not yet in the PolyGlot save.
   The maps-site lexicon page is titled with it.

Note: `PaternicDictionary_1.pgd` (received alongside these answers) is byte-for-byte the
same save as `PatrinaicRevamp.pgd` (same DictSaveDate, identical lexicon), so it is not
stored separately.

## Open question for the DM (atlas)

8. **Map scale**: what real distance does PatrinorModern.png cover — px per league
   (or any two places with a canon distance between them)? Needed before the atlas
   can carry an honest scale bar and distance measurement (see
   docs/research/atlas-structure.md, marginalia). One canon fact calibrates
   everything.
