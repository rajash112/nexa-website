// Content parity: visible text and link set of every page must match the recorded production baseline.
// Ignores only decorative glyphs (emoji, menu/close/arrow-up symbols, flags) so icon upgrades pass but any wording/link change fails.
// Shared chrome (nav, mobile menu, floating buttons, footer) is compared separately: it must be identical on every page and match the chrome baseline (update deliberately with --accept-chrome).
// Also requires data/*.json byte-identical and PDFs identical by page count + text. Use --record <deployDir> to (re)create the baseline deliberately.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const sha = (s) => createHash('sha256').update(s).digest('hex');
const GLYPH = /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u2190-\u21FF\u200d\ufe0f]/gu;
const CHROME = [/<nav class="top"[\s\S]*?<\/nav>/, /<div id="mmenu">[\s\S]*?<\/div>/, /<a id="fwa"[\s\S]*?<\/a>/, /<button id="totop"[\s\S]*?<\/button>/, /<footer>[\s\S]*?<\/footer>/];
const chromeOf = (h) => CHROME.map((r) => (h.match(r) || [''])[0]).join('\n');
const strip = (h) => CHROME.reduce((s, r) => s.replace(r, ' '), h);
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(GLYPH, '').replace(/\s+/g, ' ').trim();
const hrefs = (h) => [...h.matchAll(/(?:href|src|action)="([^"]*)"/g)].map((m) => m[1]).filter((u) => !u.includes('fonts.g') && !u.includes('/assets/fonts/')).sort();
const pdf = (p) => sha(execFileSync('pdfinfo', [p]).toString().split('Pages:')[1].trim().split(/\s/)[0] + execFileSync('pdftotext', ['-layout', p, '-']).toString());
const snap = (root) => { const o = { pages: {}, bin: {}, chrome: {} }; for (const p of walk(root)) { const r = relative(root, p).split('\\').join('/'); if (r === 'netlify.toml') continue;
  if (r.endsWith('.html')) { const h = readFileSync(p, 'utf8'), c = chromeOf(h), s = strip(h); o.pages[r] = { text: sha(text(s)), links: sha(hrefs(s).join('|')) }; if (r !== '404.html') o.chrome[r] = { text: sha(text(c)), links: sha(hrefs(c).join('|')) }; }
  else if (r.endsWith('.pdf')) o.bin[r] = pdf(p); else if (r.endsWith('.json')) o.bin[r] = sha(readFileSync(p)); } return o; };
if (process.argv[2] === '--record') { mkdirSync('tests', { recursive: true }); const s0 = snap(process.argv[3]); s0.chromeBaseline = s0.chrome['index.html']; delete s0.chrome; writeFileSync('tests/baseline-content.json', JSON.stringify(s0, null, 1)); console.log('baseline recorded from', process.argv[3]); process.exit(0); }
if (process.argv[2] === '--accept-chrome') { const bl = JSON.parse(readFileSync('tests/baseline-content.json', 'utf8')), s = snap('dist'); bl.chromeBaseline = s.chrome['index.html']; writeFileSync('tests/baseline-content.json', JSON.stringify(bl, null, 1)); console.log('accepted new shared chrome (nav/footer) baseline'); process.exit(0); }
if (process.argv[2] === '--accept') { // deliberate, reviewed change: refresh baseline for named pages only
  const bl = JSON.parse(readFileSync('tests/baseline-content.json', 'utf8')), s = snap('dist');
  for (const r of process.argv.slice(3)) { if (!s.pages[r]) throw new Error('no such page ' + r); bl.pages[r] = s.pages[r]; }
  writeFileSync('tests/baseline-content.json', JSON.stringify(bl, null, 1)); console.log('accepted new baseline for:', process.argv.slice(3).join(', ')); process.exit(0); }
const base = JSON.parse(readFileSync('tests/baseline-content.json', 'utf8')), now = snap('dist'), bad = [];
for (const [r, v] of Object.entries(base.pages)) { const n = now.pages[r]; if (!n) bad.push('missing page ' + r); else { if (n.text !== v.text) bad.push('TEXT changed ' + r); if (n.links !== v.links) bad.push('LINKS changed ' + r); } }
for (const r of Object.keys(now.pages)) if (!base.pages[r]) bad.push('new page ' + r);
for (const [r, v] of Object.entries(now.chrome)) { if (v.text !== base.chromeBaseline.text || v.links !== base.chromeBaseline.links) bad.push('CHROME (nav/footer) differs from baseline on ' + r); }
for (const [r, v] of Object.entries(base.bin)) if (now.bin[r] !== v) bad.push('changed/missing ' + r);
if (bad.length) { console.log(bad.length + ' difference(s):\n' + bad.slice(0, 40).join('\n')); process.exit(1); }
console.log(`Content parity OK: ${Object.keys(now.pages).length} pages (text + links), ${Object.keys(now.bin).length} PDFs/data files match production.`);
