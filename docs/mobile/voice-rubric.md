# Voice rubric (UG9)

The only rubric for new player-facing text on the mobile track. It is applied to the strings listed under "Player-visible strings" in [README.md](README.md) and to nothing else: labels, titles, aria-labels, hint text and tidings. A unit that adds a string adds it to that table in the same change. The checks that need no judgement run in code (`node tools/mobile-capture.js --accept`, gate UG9); the voice read is a model read with one verdict per string.

## What a string must do

The voice is the chronicle's: bronze-age Nīmlad, the nine Kembar, years counted After the Binding. A string passes when all of these hold.

1. **Banned vocabulary.** It matches neither `VOCAB` nor `VOCAB_ST`. `VOCAB` is the regex constant in `.claude/workflows/filigree-1-research.js` (the line that starts `const VOCAB =`); `VOCAB_ST` is derived from it in the street config region and read by `tools/street-drift.js`. The check runs the regex read from those files. It never retypes it here, so this page cannot drift from them.
2. **Interface jargon.** It contains none of: tap, click, swipe, pinch, drawer, modal, menu, toggle, dismiss, app, download, install, offline mode, dark mode, theme, settings. (Internal names, ids and code comments may keep these words; the player never reads them. "Coach" never appears in the hint card.)
3. **Years.** A year appears only as A.B., counted After the Binding (the campaign present is 1374 A.B.). Never a bare Gregorian year, never "AD", "CE", "BC".
4. **Table words.** The words are table words: chart, court, ink, lit, keep, furl, mark, unroll, draw, sheet, card, ledger. A string reads as something a cartographer or a court scribe would write, not as software.
5. **Canon names are exempt.** Wiki canon names (for example the faction "The Lektān Priesthood") are exempt from the `VOCAB` grep and from the jargon list. They are written exactly as the wiki writes them, macrons included.

## The read

A sonnet/low reader gets the rubric, the string and its surface, and returns one `pass` or `fail` per string, with the offending word when it fails. The unit passes with 0 fails. The reader judges register only (rules 3 and 4 and the feel of rule 1); it does not rewrite strings, and it does not see the implementer's diff.

## Fixed forms (not re-read, only checked for exact match)

| surface | string |
|---|---|
| sheet handle | Draw the sheet up or down |
| layers control | Layers of the chart |
| close control of a sheet or the place card | Close the card |
| full-chart close, coarse pointers | Close the chart |
| full-chart close, fine pointers only | Close the chart (Esc) |
| court tab | ❦ Return the court (title: Bring back the court; fine pointers: Bring back the court (H)) |
| Night ink on / off | Night ink: lit by Tamar's dark hour / Day ink |

The visible rows never use "Save", "Download", "Install" or "Offline mode"; sizes are rounded and read from the offline manifest.
