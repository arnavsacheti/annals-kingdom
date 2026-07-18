#!/usr/bin/env node
// build-gazetteer.js — compile maps-site/data/gazetteer.json, the atlas's unified
// place-name index (the classic atlas gazetteer: name + category + footprint,
// enriched with wiki slugs and Patrinaic etymologies).
//   node tools/build-gazetteer.js
// Sources: maps-site/data/{maps_markers,city-anchors,wiki-places}.json and the
// DM-ruled etymologies below (lexicon/research/canon-etym.json + dm-rulings.md).
'use strict';
const fs = require('fs');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Canon etymologies per the DM's rulings (see lexicon/research/dm-rulings.md);
// keys are folded names, lex = the root headword to deep-link in lexicon.html?q=.
// Only high/medium-grounded entries, current spellings.
const ETYM = {
  'sokundo':        { etym: 'white-stone',              lex: 'sok' },
  'pharzeban':      { etym: 'gilt-place',               lex: 'pharze' },
  'tamaron':        { etym: 'moon-town',                lex: 'tamar' },
  'aldorus':        { etym: 'the height',               lex: 'aldor' },
  'mith mirdanak':  { etym: 'the town of the artisans', lex: 'mīth' },
  'patrinor':       { etym: 'Patrin-land',              lex: 'patrin' },
  'magosh':         { etym: 'of the city-states',       lex: 'māgos' },
  'nimlad':         { etym: 'earth, the world',         lex: 'nīmlad' },
  'aura-hoth':      { etym: 'roaring foothills',        lex: 'aur' }
};

const markers = read('maps-site/data/maps_markers.json');
const anchors = read('maps-site/data/city-anchors.json');
const wiki    = read('maps-site/data/wiki-places.json');

const wikiBy = {};
wiki.forEach(p => { wikiBy[fold(p.title)] = p.slug; });

const entries = [], seen = new Set();
function add(name, kind, x, y){
  const key = fold(name);
  if(seen.has(key)) return; seen.add(key);
  const e = { name, kind, x, y };
  if(wikiBy[key]) e.wiki = wikiBy[key];
  if(ETYM[key]){ e.etym = ETYM[key].etym; e.lex = ETYM[key].lex; }
  entries.push(e);
}
markers.forEach(m => add(m.name, m.type, m.x, m.y));
for(const name in anchors){
  const a = anchors[name];
  if(a && a.atlasX !== undefined) add(name, a.kind || 'settlement', a.atlasX, a.atlasY);
}
entries.sort((a, b) => fold(a.name) < fold(b.name) ? -1 : 1);

fs.writeFileSync('maps-site/data/gazetteer.json', JSON.stringify(entries, null, 1));
console.error(`gazetteer: ${entries.length} places (${entries.filter(e=>e.wiki).length} with wiki pages, ` +
  `${entries.filter(e=>e.etym).length} with etymologies) → maps-site/data/gazetteer.json`);
