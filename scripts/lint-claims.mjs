// Guards NEXA's "no unverified claims" rule: fails the build if risky phrases appear in any page.
import { readFileSync, readdirSync, statSync } from 'node:fs'; import { join } from 'node:path';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const BAN = [/placement guarantee/i, /guaranteed (job|placement)/i, /100% placement/i, /\btestimonial/i, /students? trained/i, /\bISO[- ]?\d{4}/i, /rated \d/i, /\d+\s*\+?\s*(happy|placed|alumni)/i];
const bad = [];
for (const p of walk('dist').filter((f) => f.endsWith('.html'))) { const t = readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/g, ''); for (const r of BAN) if (r.test(t)) bad.push(`${p}: ${r}`); }
// Gallery privacy: published photos must carry no EXIF/GPS metadata
const gdir = 'dist/assets/gallery';
if (readdirSync('dist/assets').includes('gallery')) for (const f of readdirSync(gdir)) { const b = readFileSync(join(gdir, f)); if (b.includes('EXIF') || b.includes('GPS') || b.includes('XMP ')) bad.push(`${gdir}/${f}: contains EXIF/GPS/XMP metadata`); }
if (bad.length) { console.log('Unverified-claim lint failed:\n' + bad.join('\n')); process.exit(1); }
console.log('Claims lint OK: no banned phrases in dist.');
