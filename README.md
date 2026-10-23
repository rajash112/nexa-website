# NEXA Education Academy – website v2

Static site generated from structured data. Plain HTML/CSS/JS output (same stack as the original single-file site), one build dependency (`pdfkit`).

## Quick start
```bash
npm install
npm run dev      # builds to dist/ and serves http://localhost:8080
npm test         # build + link/PDF/contact-format checks
```
Requires Node 18+ (Netlify uses Node 20 via `netlify.toml`).

## Project structure
| Path | Purpose |
|---|---|
| `src/data/site.js` | **Contact details & social links** (single source of truth) |
| `src/data/courses-a.js`, `courses-b.js` | All 19 course curricula (modules, labs, projects, refs) |
| `src/data/institutions.js` | Institutions + official syllabus records and verification status |
| `scripts/build.mjs` | Generates every page, the PDFs, sitemap, robots and `data/syllabus-index.json` |
| `scripts/check.mjs` | Post-build checks (broken links, `href="#"`, PDFs, tel/mailto/WhatsApp format) |
| `src/css`, `src/js`, `src/assets` | Design system, behaviour, logo/favicon/OG image |
| `legacy/index.original.html` | Untouched backup of the original site |
| `docs/` | Report, checklist, archived removed content |

## Editing content
* **Add/edit a course:** edit the data file, run `npm run build`. Module weeks must add up to `weeks` (the build fails otherwise). Page, syllabus page, PDF, sitemap and library entry update together.
* **Add an official syllabus:** add a record in `officialSyllabi`. Use `verification: 'verified'` only after you have opened the PDF and cross-checked extracted subjects. Never invent codes/credits.
* **Add social links:** fill `site.social.*` in `site.js`; empty ones are not rendered.

## Contact form (Netlify Forms)
The form `nexa-enquiry` is detected by Netlify at deploy time (honeypot `bot-field` included).
1. Deploy to Netlify. 2. Site → **Forms** → confirm `nexa-enquiry` appears.
3. **Forms → Settings & usage → Form notifications → Add email notification** and enter the address that should receive enquiries (e.g. the existing NEXA email).
4. Optional stronger spam protection: enable Netlify reCAPTCHA/Akismet in the same screen.
No API keys exist in this code. Submissions do not work on `localhost`; the site shows an honest failure message plus WhatsApp/email fallbacks if the POST fails.

## Deploy
Netlify settings: build command `npm run build`, publish directory `dist` (already in `netlify.toml`).

Git steps (recommended – feature branch, no force-push):
```bash
git clone https://github.com/rajash112/nexa-website.git && cd nexa-website
git checkout -b feature/syllabus-platform
# copy this project's files over the clone (keep .git), then:
npm install && npm test
git add . && git commit -m "Upgrade NEXA into syllabus & learning platform"
git push -u origin feature/syllabus-platform
```
Open a Pull Request; Netlify will create a **Deploy Preview**. Review it, then merge to the default branch to publish. Alternative: drag-and-drop the pre-built `dist/` folder onto Netlify.

See `docs/REPORT.md` for audit, coverage, checklist and open items.
