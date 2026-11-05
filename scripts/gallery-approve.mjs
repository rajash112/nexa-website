// Marks gallery photos as approved for publication.
// Usage: node scripts/gallery-approve.mjs all | <id> [<id> ...] [--revoke]
import fs from 'node:fs';
const f = 'gallery-candidates/manifest.json';
if (!fs.existsSync(f)) { console.error('gallery-candidates/manifest.json not found. Unzip the photos into the project root first.'); process.exit(1); }
const m = JSON.parse(fs.readFileSync(f, 'utf8')), args = process.argv.slice(2);
const revoke = args.includes('--revoke'), ids = args.filter((a) => a !== '--revoke');
if (!ids.length) { console.log('Usage: node scripts/gallery-approve.mjs all | <id> ... [--revoke]'); process.exit(1); }
let n = 0; for (const g of m.items) if (ids.includes('all') || ids.includes(g.id)) { g.approved = !revoke; n++; }
fs.writeFileSync(f, JSON.stringify(m, null, 1));
console.log(`${revoke ? 'Revoked' : 'Approved'} ${n} photo(s). Approved now: ${m.items.filter((g) => g.approved).length}/${m.items.length}`);
