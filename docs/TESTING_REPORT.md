# Testing report (Phase A, Milestone 7)

All results were produced in a sandbox with headless Chromium (Playwright) and your production CSP applied. **Nothing was tested on the live Netlify site, a real phone, or with real Netlify form delivery.**

| Suite | Command | Result |
|---|---|---|
| Build + link/asset check + claims/privacy lint + content parity | `npm test` | Pass: 72 pages, 4,533 link/asset references (509 external, not fetched), 0 broken, 19 PDFs, 40 index records |
| Browser end-to-end (51 checks) | `python3 tests/e2e.py` | 51/51 pass: layout at 10 widths, CSP/console errors, 5 forms (validation, mocked submission, honeypot, error path, WhatsApp), 10 deep links, tabs keyboard use, nav fit, real fonts, no third-party requests |
| Gallery (19 checks) | `python3 tests/gallery.py` (gallery is now published in the normal build) | 19/19 pass |
| Accessibility (axe-core) | `python3 tests/a11y.py [--preview]` | 0 violations, 17 page types x 2 widths (+ gallery in preview) |
| Lighthouse (mobile, simulated) | run manually | Home 98, course 100, contact 100, institutional 100, library 100 performance; accessibility 100, best practices 100, SEO 100 on all; CLS 0 to 0.003; pages 214-248 KB. Gallery page (preview) 95 performance (LCP about 2.9 s) |
| Content parity vs production | `npm run parity` | 72 pages identical in text and links except intentionally changed pages; 19 PDFs and syllabus JSON identical |

## Defects found and fixed during Phase A (examples)
Silent no-op patch that made a parity test pass for the wrong reason (caught and redone); nav overflowing at 1240-1280 px (breakpoint now measured with real fonts); filter chips rendering "undefined"; oversized form spacing; lightbox under the nav; low-contrast note in a light section; missing keyboard access to scrollable tables; heading order in module panels; missing landmark for floating buttons; CSP that would have blocked self-hosted fonts; large grey blur blobs in photos; face-detection misses found by full-size review.

## Not tested / known limits
Real Netlify form delivery and notification e-mails; real phones and Safari/Firefox; the 509 external links; Lighthouse gallery LCP could be improved further; face detection is imperfect, so photo review by a person is required before approval.
