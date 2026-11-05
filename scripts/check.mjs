// Post-build checks: internal links/assets exist, no placeholder hrefs, PDFs are real, tel/mailto/wa formats sane.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(DIST); const html = files.filter((f) => f.endsWith('.html')); const errs = []; let nLinks = 0, nExt = 0;
const exists = (u) => { const p = u.split('#')[0].split('?')[0]; if (!p) return true; const f = path.join(DIST, p); return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html'))); };
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8'); const rel = path.relative(DIST, f);
  if (/href="#"/.test(s)) errs.push(`${rel}: placeholder href="#"`);
  if (/<h1/.test(s) === false && !rel.includes('404')) errs.push(`${rel}: missing h1`);
  for (const m of s.matchAll(/(?:href|src|data|action)="([^"]+)"/g)) {
    const u = m[1]; nLinks++;
    if (u.startsWith('http') ) { nExt++; if (u.startsWith('http://')) errs.push(`${rel}: insecure link ${u}`); continue; }
    if (u.startsWith('tel:')) { if (!/^tel:\+\d{10,13}$/.test(u)) errs.push(`${rel}: bad tel ${u}`); continue; }
    if (u.startsWith('mailto:')) { if (!/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i.test(u)) errs.push(`${rel}: bad mailto ${u}`); continue; }
    if (u.startsWith('#') || u.startsWith('data:')) continue;
    if (u.startsWith('/')) { if (!exists(u)) errs.push(`${rel}: broken internal ${u}`); }
  }
  for (const m of s.matchAll(/target="_blank"(?![^>]*noopener)/g)) errs.push(`${rel}: _blank without noopener`);
  for (const m of s.matchAll(/https:\/\/wa\.me\/(\d+)/g)) if (!/^91\d{10}$/.test(m[1])) errs.push(`${rel}: odd wa.me number ${m[1]}`);
}
const pdfs = files.filter((f) => f.endsWith('.pdf'));
for (const f of pdfs) { const b = fs.readFileSync(f); if (b.slice(0, 5).toString() !== '%PDF-' || b.length < 5000) errs.push(`${path.relative(DIST, f)}: invalid/too small PDF`); }
const idx = JSON.parse(fs.readFileSync(path.join(DIST, 'data/syllabus-index.json'), 'utf8'));
for (const r of idx.records) { if (!exists(r.url)) errs.push(`index: missing page ${r.url}`); if (r.pdfUrl && !r.external && !exists(r.pdfUrl)) errs.push(`index: missing pdf ${r.pdfUrl}`); }
console.log(`Checked ${html.length} pages, ${nLinks} link/asset refs (${nExt} external, not fetched), ${pdfs.length} PDFs, ${idx.records.length} index records.`);
if (errs.length) { console.error('FAILED:\n - ' + errs.join('\n - ')); process.exit(1); } else console.log('All checks passed.');
