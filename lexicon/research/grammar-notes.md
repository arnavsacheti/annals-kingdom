# Notes from the DM's reference grammar (lexicon/PaternicGrammar.pdf, 2026-07-16)

"Classical Paternic: A Reference Grammar (in Part)" — endonym on the title page:
*Peternekh Haga Dum (Iendāned)*. 32 pages; the DM estimates it at ~a tenth of the
theoretical complete document. Full text extract: `grammar-extract.txt`.

## Rules now implemented in the sim's name generator (index.html `patJoin`)
- **Vowel hiatus is illegal** (§2.2.1); colliding vowels resolve by a 10×10 chart
  (short+short cells like a+u→au, e+i→ē; any long/diphthong second vowel wins;
  otherwise a long first vowel survives). Resolution cascades at morpheme seams —
  so *Laego+on → Laegōn*, *Nē+ila → Nēla*, and the pre-grammar output *Nēila*
  (illegal hiatus) can no longer be minted.
- **Degemination** (§2.2.2): identical consonants colliding at a seam merge
  (*Kās+Sāsh → Kāsāsh*).
- **Nasal + alveolar fricative** (§2.2.2): a nasal before s/z deletes and the vowel
  before it lengthens in compensation (*Nen+Sāshīn → Nēsāshīn*).
- `-(i)on` 'town' is now encoded as surface `-on`: *Tamar+on → Tamaron* directly, and
  hiatus resolution handles vowel-final stems (*Laego+on → Laegōn*) — no connector
  vowel needed, which sidesteps the paradox of a vowel "connector" creating hiatus.

## Not implemented (noted for the future)
- Syllable structure max CCVC; the only legal CC onsets are plosive+rhotic (§2.2) —
  worth a validity pass over generated names if odd clusters ever appear; epenthetic
  /e/ is the canonical repair.
- Stress assignment (penult if long, else antepenult) — irrelevant to orthography.
- Full noun morphology: 8 cases (incl. ergative), animacy, 8 declensions with
  principal parts; adjectives decline and PRECEDE the head noun except in
  **place names, where postpositive adjectives are typical** (§5.1, §9.1 — directly
  relevant if we ever mint adjective+noun place names: 'Mīth Rhūs' style is canon).
- Verb system: ten tenses; the **narrative tense** is "chiefly used for events that
  happened in the distant past, legends and myths, and in narratives" — the Annals
  chronicle is, in-world, written in the narrative tense. Nice lore, no code impact.
- Strictly postpositional; postposition *hoth* 'below, under' — cf. the Aura-Hōth
  reading in canon-etym.json.

## Vocabulary confirmations
- *agos* 'land' appears as a standalone example word — the toponymic -(g)os suffix is
  transparently this noun grammaticalized.
- Grammar example sentences use lexicon words the sim also uses: *balakh* 'ship',
  *zōr* 'fire (animate!)', *gimīl* 'star', *māgor* 'king', *hag* 'mouth, language'
  (animate), *khar* 'house', *nor* 'ground' (cf. -(n)or), *lazh* 'valley'.
- Naming: the grammar consistently says "Classical Paternic" (the PolyGlot save says
  "Classical Patrinaic"); the DM uses both. The endonym per DM chat is *Peternek Hag*;
  the grammar's title page has the fuller *Peternekh Haga Dum* (inflected forms of the
  same phrase). The lexicon page keeps the DM's chat form.
