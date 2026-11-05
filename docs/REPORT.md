# NEXA upgrade – audit, coverage and status report (2026-10-22)

## 1. Audit of the original repository
* Contents: `README.md` (empty heading) and a single 538 KB `index.html`. Plain HTML/CSS/JS, no build, no `netlify.toml`.
* 5 inline base64 copies of the same 70 KB logo (≈ 350 KB wasted) → now one optimised file.
* Routes: one page, anchors only. Nav had 7 anchors; no course pages, syllabus, PDFs.
* Real contact data found and preserved: Ashish +91 89696 89751 (also WhatsApp), Akshat +91 93356 99920 (WhatsApp), e-mail ashishraj112.ashu@gmail.com, Lucknow / Varanasi, office hours Mon–Sat 9–7 IST.
* Defects fixed: contact form showed "Message Sent!" without sending anything; every "Enroll" button was inert; 3 social links were `href="#"`; custom cursor (`cursor:none`) hurt accessibility; no focus styles; unlabeled form fields; unverifiable stats/testimonials (see `docs/removed-unverified-content.md`).
* Deployment method of the live site could not be inspected (only the ZIP was supplied; GitHub/Netlify were not accessed).

## 2. Course inventory vs. original
All 19 requested courses already existed on the original page. Titles, durations and descriptions were preserved. Changes: names normalised (e.g. "HTML + CSS" → "HTML5 and CSS3", "Blockchain Basics" → "Blockchain Fundamentals"); levels of **Blockchain** and **DevOps** changed Advanced → Intermediate because their prerequisites/content support Intermediate. Revert in the data files if you disagree. Fees/batch dates are not on the site (none were supplied).

## 3. Syllabus coverage (honest)
| Institution | Records | Status |
|---|---|---|
| GIET University, Gunupur | 15 | 14 official PDF links read from `giet.edu/academics/syllabus/` (B.Tech 1st yr 2022-26; CSE 2017/18/19; CST 2019; IT 2017/18; BCA/MCA R2020 annexures; M.Tech CSE 2017/18/19) = **source located**. 1 = B.Tech CSE AI/ML **pending** (no such PDF on that page). |
| LTSU Punjab | 6 | 4 official study-scheme PDFs from the University School of Computing page (PGDCA 2026, MCA 2025&26, BCA AI-ML, BCA CS) = **source located**. BCA (10+2) link points to a file named `mca-sem1.pdf` = **needs check**. B.Tech CSE (IBM) = **pending** (no PDF found). |
| NEXA curricula | 19 | NEXA-authored v1.0, status "draft – trainer review pending". |

**Verified (contents opened and cross-checked): 0.** I confirmed only that the links are published by the universities; I did not open the PDFs, so no subject codes, credits, units or marks are shown. Regulation years are not admission batches; mapping needs GIET's academic-regulation documents. Other institutions and AICTE model curricula were not added (no verified source). Next step for a human/agent: open each PDF, extract subject tables, add subject-level records, then flip to `verified`.

## 4. Functionality checklist (tested = automated browser run in this build environment, Chromium)
| Element | Expected action | Result |
|---|---|---|
| Desktop nav (8 items + Enquire) | Routes to each page, active state | Built; link-checker passes; visually checked |
| Mobile menu | Opens/closes, Esc closes, `aria-expanded` | **Tested – pass** |
| Course category chips + search | Filter course cards | **Tested – pass** (category) |
| Syllabus Library search/filters/sort/reset | Filters 40 records; empty state | **Tested – pass** (search, type, empty) |
| View Full Syllabus / View PDF / Download PDF | Page / official PDF in new tab / local PDF | Links verified to exist (local); external official PDFs **not fetched** from sandbox |
| NEXA PDFs (19) | Valid PDF | **Tested** – `%PDF`, A4, text layer, visual check of Python PDF |
| Enquiry form validation | Inline accessible errors | **Tested – pass** |
| Form submit | POST to Netlify | Flow **tested against local mock only**; real delivery **unverified until deployed** |
| WhatsApp / tel / mailto | Correct numbers, prefilled text | Format checked by script; **not tested on a phone** |
| FAQ accordions | Native `<details>` | Built |
| Back-to-top, floating WhatsApp | Scroll / open chat | Built |
| Footer links | All internal links resolve | **Tested – pass** (4,153 refs, 0 broken) |
| `href="#"` placeholders | None | **Tested – 0** |

## 5. Not done / needs you
1. Push to GitHub and deploy (not possible from here). Commands in README.
2. Netlify: confirm form detection and add notification e-mail; consider reCAPTCHA.
3. Extract and verify official syllabus contents (largest remaining task).
4. Supply: real social URLs, Akshat's e-mail (optional), fee/batch info, certificate policy, any real testimonials/student projects/statistics with proof.
5. Trainer review of the 19 curricula (written by AI-assisted drafting; status shown as draft). Hardware cost for IoT, cloud free-tier terms, etc. to be confirmed.
6. External reference URLs (≈70) were written from knowledge and not fetched; run a link checker (e.g. `npx linkinspector` or lychee) after deploy.
7. Not run: Lighthouse, screen-reader test, real-device test, contrast audit tool. Colours were chosen for high contrast but not measured.
8. CSP header in `netlify.toml` is strict (no inline scripts). If a future change breaks something, check the browser console.
9. Privacy page is a draft for your review.
10. Fonts load from Google Fonts (disclosed on the privacy page); self-host if you want zero third-party requests.
