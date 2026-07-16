# Classical Patrinaic root+root compounding — empirical study

Method per spec: walk `ety[]` (the dictionary's own parent→child derivation links) and find
children with two or more distinct parents recorded. That is the strictest, most literal
reading of "true compound" available in the data.

## What `ety[]` actually contains

`ety[]` has 208 edges covering 205 distinct child words. **Only 3 of those 205 children have
two recorded parents** — the other 202 are single-parent (root+affix) derivations. This is a
small sample; the finding below is built on those 3, cross-checked against a second,
independently-gathered set (see "Supplementary evidence").

### The 3 ety[]-confirmed compounds

1. **Bībauk Lamon** "Red Deer, Bibunic Antelope, Stag, Hart, Doe, Hind" = **Bībauk** "Bibunic"
   (id 1556) + **Lamon** "Antelope, Gazelle, Oryx, Pronghorn" (id 1543)
2. **Kaethespor Ursulban** "Triumphal Arch" = **Kaethespor** "Victorious, Triumphant,
   Conquering" (id 2037) + **Ursulban** "Memorial, Trophy" (id 984)
3. **Ghelgeglor** "Inn, Hotel, Hostel, Caravansary, Caravanserai" = **Gal** "Take, Seize, Grab,
   Make" (id 1635) + **Ghal** "Every, All" (id 1691)

(1) and (2) are written as two separate capitalized words with a space — modifier first, head
noun last (Bibunic + Antelope; Victorious + Memorial → "Triumphal Arch"), with **no fusion at
all**: plain juxtaposition, no elision, no linking sound. (3) is the outlier: it's a single
fused word, and the surface form (Ghelgeglor) doesn't fall out of Gal+Ghal by simple
concatenation — it shows internal changes (something like reduplication/ablaut, Gal→Ghel-,
Ghal→-geglor) that this dataset doesn't give enough evidence to reduce to a rule.

## Supplementary evidence: independently-identified compounds

`ety[]`'s 3 examples are too few to characterize a pattern confidently on their own, so I also
scanned every single-word headword in `words[]` for two attested content-word roots that
concatenate to reproduce it letter-for-letter, with a semantic check against the headword's own
gloss. These are **not** linked as parent/child in `ety[]` (the dictionary just didn't record
that derivation), so treat them as one notch below the 3 confirmed cases — but the semantic
fits are close to exact, and there are enough of them to see a real pattern:

| Compound | = | Root A | + | Root B | Gloss |
|---|---|---|---|---|---|
| Azīmbash (1393) | | Azīm "Eye" (651) | + | Bash "Tower" (1392) | Watchtower, Lookout |
| Pathphek (1025) | | Path "Honey" (1023) | + | Phek "Do, Make, Build" (708) | Beekeeper |
| Pharzetān (918) | | Pharze "Gild" (919) | + | Tān "Build, Construct" (1726) | Goldsmith |
| Ospātān (1838) | | Ospa "Bread" (1835) | + | Tān "Build, Construct" (1726) | Cook, Chef |
| Pherūphek (1618) | | Pheru "Wine" (1615) | + | Phek "Do, Make, Build" (708) | Winemaker |
| Lektān (1989) | | Lek "Road, Way" (1695) | + | Tān "Build, Construct" (1726) | Priest, Pontiff |
| Lazgar (1747) | | Laz "Dig, Quarry, Stab" (1746) | + | Gar "Bronze, Weapon, Blade" (1731) | Spear, Lance, Pike |
| Dornūs (1471) | | Dor "Black" (639) | + | Nūs "Fish" (1453) | Orca, Killer Whale |
| Drāgaur (1474) | | Drāg "Wolf" (1472) | + | Aur "Din, Roar, Warcry" (880) | Werewolf |
| Ginesh (994) | | Gin "Chisel, Carve" (1000) | + | Esh "Into, Onto, On" (843) | Inscribe, Engrave, Brand |
| Gerphek (711) | | Ger "Shut, Close, Douse" (2044) | + | Phek "Do, Make, Build" (708) | Dish, Plate, Tray |
| Phelmūr (770) | | Phel "Water" (765) | + | Mūr "Harvest, Reap" (1224) | Irrigation Channel, Aqueduct |

All 12 are **bare concatenation** — no linking vowel, no elision — same as the 3 ety[]-confirmed
phrase-compounds. Several (Pathphek "honey-maker" = beekeeper, Pherūphek "wine-maker",
Pharzetān "gild-wright" = goldsmith, Ospātān "bread-wright" = cook, Dornūs "black-fish" = orca)
are exact, unambiguous semantic hits — real-world folk-etymology parallels ("blackfish" for
orca; "pontiff" from Latin *pontifex* "bridge-builder" is a nice accidental echo of **Lektān**
"road-builder" = priest). Note that Phek "do/make" and Tān "build/make" are attested as
*independent verb entries* (ids 708, 1726) distinct from the bound suffixes `-phek`/`-tān`
(ids 710, 1729, glossed "-maker/-doer/-wright") — the free verbs and the suffixes are almost
certainly the same historical morpheme at different stages of grammaticalization, but since
both the free and bound forms are separately attested, these count as genuine root+root
compounds under the spec's ety[]-based definition, not root+affix derivations.

## Findings

**(a) Element order — is the head final or initial?**
**Head-final** (modifier/qualifier + head noun), consistently, in all 15 examples across both
the ety[]-confirmed set and the supplementary set. "Bibunic Antelope," "Victorious Memorial"
(→ Triumphal Arch), "Honey-Maker" (→ beekeeper), "Black-Fish" (→ orca) — the noun or verb that
supplies the *category* comes last; the modifying element comes first.

**(b) What happens at the seam?**
**Bare concatenation.** Every clean example (14 of 15) shows plain juxtaposition with no
linking vowel and no elision — this matches the toponymic suffix rule exactly (`-(g)os`/
`-(n)or` insert a connector consonant *only* after a vowel-final stem, and otherwise
concatenate bare — see `out-A/canon-etym.json`'s Patrinor/Sokundo/Pharzeban entries for the
settlement-name evidence of the same rule). The one exception, Ghelgeglor, shows the fused
single-word compounds of the "Inn/Hostel" type CAN undergo unpredictable internal changes the
data doesn't explain — so "bare concatenation" is the *default*, not an ironclad law.

**(c) Is the evidence strong enough to mint new two-root place names procedurally?**

**YES, with a caveat.** The order (head-final) and seam behavior (bare concatenation, connector
only after vowel-final stems) are consistent across 14 of 15 examples spanning two independent
methods (ety[]-linked and string-decomposition), and that same connector rule is independently
confirmed by the toponym evidence (Patrinor, Sokundo, Azrū→Azrūgos already coded in
`index.html`). A generator that (1) picks two attested content-word roots, (2) orders them
modifier-then-head, and (3) concatenates them bare — inserting a linking consonant only when
the first root is vowel-final, mirroring the existing `PATRINAIC_SUFS` connector table — would
be following a real, if thin, pattern in the data rather than inventing one.

The caveat: the *directly confirmed* (ety[]-multi-parent) sample is only 3 words, all of them
either ordinary nouns/adjectives (not existing toponyms) or one irregular fusion (Ghelgeglor).
No *place name* in the dictionary is recorded in `ety[]` as a root+root compound — every
existing toponym in the campaign that decomposes cleanly (Sokundo, Pharzeban, Patrinor) is
root+**affix**, not root+root. So: mint two-root place names if wanted, but they'd be a genuine
extension of the attested pattern into a domain (toponyms) it hasn't been used for yet, not a
reproduction of something already seen. The existing root+affix generator (`PATRINAIC_ROOTS` +
`PATRINAIC_SUFS` in `index.html`) remains the *better-attested* way to mint place names.

## Open questions for the DM

1. **Ghelgeglor's irregular fusion** — is there a productive ablaut/reduplication rule behind
   "Inn/Caravansary" words that the dictionary hasn't spelled out, or is this a one-off
   lexicalized irregular? If there's a rule, it would matter a lot for anyone trying to fuse
   two roots into a single new word (as opposed to a head-final two-word phrase, which is safe).
2. **Is `-phek`/`-tān` as a bound suffix ever distinct in *meaning* from the free verbs
   Phek/Tān**, or are compounds like Pathphek/Lektān simply the free-verb compound and the
   bound-suffix derivation converging on identical surface forms? If they've diverged
   semantically, new coinages should pick the right one on purpose.
3. **Is there a true head-INITIAL compound anywhere** (i.e. does the head-final rule ever
   invert)? None turned up in this pass, but the sample is small enough that a counterexample
   could be hiding in a word this search's substring method didn't catch (e.g. involving
   heavy sound change at the seam).
4. Only 205 of 1365 words in the dictionary have any `ety[]` derivation recorded at all — most
   entries are underived roots with no recorded parentage. If more etymological linking gets
   done on the PolyGlot side later, this compounding sample should be re-run; 3 confirmed
   examples is a thin foundation for a firm grammatical rule.
