#!/usr/bin/env node
// tools/mobile-loop-check.js — read-only meta/parse check for the saved mobile loop scripts (M1.3).
// Same logic as metaCheck in tools/street-drift.js: meta a pure literal, name = file stem, JOB line (if present) = stem,
// phases declared ⊇ phases used, no clock/random/require/import in the body, AsyncFunction parse.
// Usage: node tools/mobile-loop-check.js [--json] [--repo <dir>] [file ...]   exit 0 ok, 1 fault, 2 no mobile scripts
'use strict'
const fs = require('fs'), path = require('path')

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes('--json')
const ri = argv.indexOf('--repo')
const REPO = path.resolve(ri >= 0 ? argv[ri + 1] || '' : path.join(__dirname, '..'))
const files = argv.filter((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1))
const AF = Object.getPrototypeOf(async function () {}).constructor
const FORBID = /\b(Date\.now|Math\.random|performance\.now)\s*\(|new Date\s*\(\s*\)|\brequire\s*\(|^\s*import\s/m

function metaEnd(s) {   // index just past the closing brace of "export const meta = {...}"
  let d = 0, q = null
  for (let i = s.indexOf('{'); i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue }
    if (c === "'" || c === '"') q = c
    else if (c === '{') d++
    else if (c === '}' && --d === 0) return i + 1
  }
  return -1
}

function metaCheck(file, stem) {
  const s = fs.readFileSync(file, 'utf8'), errs = []
  if (!s.startsWith('export const meta = {')) errs.push('line 1 must be "export const meta = {"')
  try { new AF('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', s.replace(/^export const meta/m, 'const meta')) } catch (e) { errs.push('parse: ' + e.message) }
  const i = s.indexOf('\nconst JOB = ')
  let j = i
  if (i < 0) { j = metaEnd(s); if (j < 0) { errs.push('meta literal does not close'); return errs } }
  const metaSrc = s.slice(0, j)
  if (/`|\$\{|\.\.\./.test(metaSrc)) errs.push('meta is not a pure literal (template, interpolation or spread)')
  let meta = null
  try { meta = new Function(metaSrc.replace(/^export const meta/, 'const meta') + ';return meta')() } catch (e) { errs.push('meta: ' + e.message); return errs }
  if (!meta || typeof meta !== 'object') { errs.push('meta is not an object'); return errs }
  if (meta.name !== stem) errs.push('meta.name ' + JSON.stringify(meta.name) + ' != ' + stem)
  if (i >= 0 && !s.slice(i).startsWith("\nconst JOB = '" + stem + "'")) errs.push('JOB must be ' + stem)
  const titles = new Set((meta.phases || []).map(p => p.title))
  const used = new Set([...s.matchAll(/phase\('([^']+)'\)|phase: '([^']+)'/g)].map(m => m[1] || m[2]))
  for (const u of used) if (!titles.has(u)) errs.push('phase not in meta: ' + u)
  for (const t of titles) if (!used.has(t)) errs.push('meta phase unused: ' + t)
  if (FORBID.test(s.slice(j))) errs.push('forbidden token (clock, random, require or import) in the body')
  return errs
}

const targets = (files.length ? files.map(f => path.resolve(f)) : (() => {
  const d = path.join(REPO, '.claude', 'workflows')
  return fs.existsSync(d) ? fs.readdirSync(d).filter(f => /^mobile-.*\.js$/.test(f)).sort().map(f => path.join(d, f)) : []
})())
let res
if (!targets.length) res = {ok: false, code: 2, checks: [{id: 'L-', ok: false, detail: 'no mobile scripts in ' + path.join(REPO, '.claude', 'workflows')}]}
else {
  const checks = targets.map(f => {
    let e
    try { e = metaCheck(f, path.basename(f, '.js')) } catch (x) { e = [x.message] }
    return {id: 'L1', ok: !e.length, detail: path.basename(f) + (e.length ? ': ' + e.join('; ') : ': meta ok')}
  })
  const ok = checks.every(c => c.ok)
  res = {ok, code: ok ? 0 : 1, checks}
}
if (JSON_OUT) process.stdout.write(JSON.stringify({ok: res.ok, checks: res.checks}) + '\n')
else { for (const c of res.checks) console.log((c.ok ? 'ok   ' : 'FAIL ') + c.id + ' ' + c.detail); console.log(res.ok ? 'mobile loop check: ok' : 'mobile loop check: FAIL') }
process.exitCode = res.code
