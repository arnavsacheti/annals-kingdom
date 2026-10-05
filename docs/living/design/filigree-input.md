# Filigree 2 input from the living chart: none

**Decision: none.** The living-chart shape adds no block to `docs/filigree/todo-inputs.json`, edits no filigree file,
and asks nothing of Filigree 2. Every existing key of `docs/filigree/todo-inputs.json` stays byte-identical because the
file is not touched at all.

## Proof that Filigree 2 would not read an appended block (from `filigree-2-plan.js`, 2026-10-05)

1. `grep -n "todo-inputs" .claude/workflows/filigree-2-plan.js` prints exactly one line, and it is a comment:
   `34:const DOCS = REPO + '/docs/filigree'   // static inputs (dossier, todo-inputs, rulings.json, README) always come from the repo`.
   No prompt, task string or path constant names the file.
2. The document inputs Filigree 2 does name are:
   - `const DOSSIER = DOCS + '/research-dossier.md'` (line 203);
   - `const REUSE = DOCS + '/README.md § "7. Reuse map"'` (line 204);
   - the density bible `density-bible.{md,json}` under its OUTABS (the chain it re-hashes at preflight);
   - `rulings_overrides = the "overrides" object of ${DOCS}/rulings.json` (line 535), merged only for the keys
     R1..R22 (`rulingsMerge` in the prelude dies on any other id).
3. The only reader of `docs/filigree/todo-inputs.json` is `filigree-1-research.js` (its INPUTS list at line 278 and
   the prompts at lines 367 and 440). The existing "mobile" block says the same in its own `_meta.read_by`: "Filigree 2
   reads the bible, not this file, so these criteria reach the sheet spec only through the bible."

So an appended "living" block would be inert for Filigree 2. It could reach the sheet spec only through a Filigree 1
re-integration (delete `docs/filigree/gates/1-research.json` and re-run), which re-synthesises the density bible and
changes its sha; every Street job after Street 1 then refuses with `the filigree density bible changed since Street 1;
re-run street-1-research`. That cost buys nothing, because none of the three "cheap now" inputs the research proposed
(shape C) is needed:

| proposed Filigree 2 input | why it is not needed |
|---|---|
| reserve a living pane or z-slot (UG7) | the living canvas is a child of the existing `pJTrail` pane (z 416); no `createPane`, the pane list is unchanged (LC13) |
| state the presentation-clock rule | UG3 already binds `maps-site/index.html`; LC12 binds `maps-site/living.js` and `maps-site/living/**` through `tools/living-measure.js --static` (zero clock tokens) |
| reserve a versioned field in R12's `notices=` snapshot | the living track ships its own snapshot `maps-site/living/traffic.json` and only reads `notices=` for shut ways (LC6); R12 stays filigree-owned and untouched |

A ruling route is closed too: changing an R text is forbidden by the brief, and `rulingsMerge` refuses unknown ids.
