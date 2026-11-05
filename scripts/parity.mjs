// Parity test: dist/ must match the recorded production baseline (tests/baseline-manifest.json).
// Non-PDF files are compared byte-for-byte; PDFs by page count + extracted text (PDFKit embeds a timestamp).
// After an intentional change, regenerate the baseline deliberately - never to "make the test pass".
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const man = JSON.parse(readFileSync('tests/baseline-manifest.json', 'utf8'));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const problems = [], seen = new Set();
for (const p of walk('dist')) {
  const r = relative('dist', p).split('\\').join('/'); seen.add(r);
  if (r.endsWith('.pdf')) {
    const exp = man.pdf_text[r]; if (!exp) { problems.push('new PDF: ' + r); continue; }
    const pages = execFileSync('pdfinfo', [p]).toString().split('Pages:')[1].trim().split(/\s/)[0];
    const text = execFileSync('pdftotext', ['-layout', p, '-']).toString();
    if (sha(pages + text) !== exp) problems.push('PDF content changed: ' + r);
  } else if (!(r in man.files)) problems.push('new file: ' + r);
  else if (sha(readFileSync(p)) !== man.files[r]) problems.push('changed: ' + r);
}
for (const r of [...Object.keys(man.files), ...Object.keys(man.pdf_text)]) if (!seen.has(r)) problems.push('missing: ' + r);
if (problems.length) { console.log(problems.length + ' difference(s) from production baseline:\n' + problems.join('\n')); process.exit(1); }
console.log('Parity OK: dist matches production baseline (' + seen.size + ' files).');
