#!/usr/bin/env node
// pgd2lexicon.js — extract the campaign conlang out of a PolyGlot .pgd save.
//   node tools/pgd2lexicon.js lexicon/PatrinaicRevamp.pgd            → writes lexicon/patrinaic.json
//   node tools/pgd2lexicon.js lexicon/PatrinaicRevamp.pgd --emit-js  → prints the PATRINAIC const for index.html
// A .pgd is a ZIP whose PGDictionary.xml holds the lexicon; this reads only that
// entry (central directory + inflateRawSync), no dependencies.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');

function readZipEntry(file, wanted){
  const buf = fs.readFileSync(file);
  // EOCD: scan back for PK\x05\x06 (comment can pad the tail)
  let e = buf.length - 22;
  while(e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if(e < 0) throw new Error('not a zip: ' + file);
  let n = buf.readUInt16LE(e + 10), off = buf.readUInt32LE(e + 16);
  for(let i = 0; i < n; i++){
    if(buf.readUInt32LE(off) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(off + 10);
    const csize  = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), cmtLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if(name === wanted){
      const lNameLen = buf.readUInt16LE(lho + 26), lExtraLen = buf.readUInt16LE(lho + 28);
      const data = buf.subarray(lho + 30 + lNameLen + lExtraLen, lho + 30 + lNameLen + lExtraLen + csize);
      return method === 0 ? Buffer.from(data) : zlib.inflateRawSync(data);
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  throw new Error(wanted + ' not found in ' + file);
}

const unent = s => (s || '')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (s, t) => { const m = s.match(new RegExp('<' + t + '>([\\s\\S]*?)</' + t + '>')); return m ? unent(m[1]) : ''; };
const stripHtml = s => unent(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function parse(xml){
  const lang = tag(xml, 'langName');
  const lexXml = (xml.match(/<lexicon>([\s\S]*?)<\/lexicon>/) || ['',''])[1];
  const words = [];
  const re = /<word>([\s\S]*?)<\/word>/g;
  let m;
  while((m = re.exec(lexXml))){
    const w = m[1];
    words.push({
      id: +tag(w, 'wordId'),
      con: tag(w, 'conWord'),
      loc: tag(w, 'localWord'),
      pron: tag(w, 'pronunciation'),
      def: stripHtml(tag(w, 'definition'))
    });
  }
  const ety = [];
  const er = /<EtymologyInternalRelation>(\d+)<EtymologyInternalChild>(\d+)<\/EtymologyInternalChild><\/EtymologyInternalRelation>/g;
  while((m = er.exec(xml))) ety.push([+m[1], +m[2]]);
  return { lang, saved: tag(xml, 'DictSaveDate'), words, ety };
}

// ---- toponym curation: real roots the sim may compound into place names ----
// Matched against the PRIMARY gloss only (first comma term of localWord), so
// homonyms like Iger 'carry, bear' don't land in the beast column.
const DOMAINS = {
  terrain: 'height hill hillock mountain peak crag cliff valley plain meadow field forest wood glade grove tree marsh swamp fen reed river stream brook spring well lake pond sea ocean marine coast shore beach bay gulf island harbor harbour haven dock ford rock stone marble sand clay earth cave grotto snow ice',
  built: 'wall tower gate bridge road market temple shrine altar hall mill port quay town city fort fortress camp granary',
  resource: 'copper bronze tin iron gold silver salt grain wheat barley wine oil olive fish wool honey cow cattle sheep goat horse ox bull vine fig date',
  beast: 'wolf bear lion eagle hawk falcon swan crane serpent snake boar stag deer fox raven crow gull heron owl',
  quality: 'white black red golden grey green blue bright dark old ancient new far high tall deep cold warm still swift great huge little small fair holy snowy hidden twin rich',
  world: 'sun moon star sky dawn dusk night storm wind rain fire ash smoke king queen lord crown god oath victory glory peace war'
};
const ROOT_OK = /^[A-Za-zĀ-ſ']{2,9}$/;   // one clean con-word, macrons allowed
const RESERVED = ['Nīmlad'];             // canon proper nouns the sim must not mint

function curate(words){
  const seen = new Set(), roots = [];
  for(const w of words){
    if(w.con.startsWith('-') || w.con.includes('(') || !ROOT_OK.test(w.con)) continue;
    if(RESERVED.indexOf(w.con) >= 0) continue;
    const first = (w.loc.split(',')[0] || '').trim().toLowerCase();
    for(const dom in DOMAINS){
      if(DOMAINS[dom].split(' ').indexOf(first) >= 0){
        const key = w.con.toLowerCase();
        if(!seen.has(key)){ seen.add(key); roots.push({ w: w.con, g: first, d: dom }); }
        break;
      }
    }
  }
  roots.sort((a, b) => a.w < b.w ? -1 : 1);
  return roots;
}

function emitJs(lang, roots){
  const rows = roots.map(r => `['${r.w.replace(/'/g, "\\'")}','${r.g.replace(/'/g, "\\'")}']`);
  const lines = [];
  for(let i = 0; i < rows.length; i += 8) lines.push('  ' + rows.slice(i, i + 8).join(','));
  return [
    `// ${lang} toponym roots [conWord, gloss] — generated by tools/pgd2lexicon.js from the`,
    `// campaign PolyGlot dictionary in lexicon/; regenerate with --emit-js, do not hand-edit.`,
    `const PATRINAIC_ROOTS = [`, lines.join(',\n'), `];`,
    `// attested derivational affixes: [suffix, connector-if-vowel-final, gloss-pattern]`,
    `// -(g)os 'land of' · -(n)or (archaic) 'land of' · -ban 'place of' · -ila diminutive`,
    `const PATRINAIC_SUFS = { grand: [['os','g','%-land'],['or','n','%-land']],`,
    `                         common: [['ban','','%-stead'],['ila','','little %'],['os','g','%-land']] };`
  ].join('\n');
}

const [,, pgdPath, flag] = process.argv;
if(!pgdPath){ console.error('usage: node tools/pgd2lexicon.js <file.pgd> [--emit-js]'); process.exit(1); }
const xml = readZipEntry(pgdPath, 'PGDictionary.xml').toString('utf8');
const dict = parse(xml);
const roots = curate(dict.words);
if(flag === '--emit-js'){
  console.log(emitJs(dict.lang, roots));
} else {
  const out = path.join(path.dirname(pgdPath), 'patrinaic.json');
  fs.writeFileSync(out, JSON.stringify({ lang: dict.lang, saved: dict.saved, words: dict.words, ety: dict.ety }, null, 1));
  console.error(`${dict.lang}: ${dict.words.length} words, ${dict.ety.length} etymology links, ${roots.length} toponym roots → ${out}`);
}
