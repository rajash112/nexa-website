# NEXA in Action – photo workflow and privacy rules

## Status
All 20 photographs are **approved by the site owner and published** (`manifest.json`: `"approved": true`). The build copies them to `/assets/gallery/`, builds `/nexa-in-action/`, adds the strips on Home, About and Institutional Solutions and a footer link.

To take the gallery down again: `npm run gallery:approve -- all --revoke`, then `npm run build` and redeploy. To remove a single photo: `npm run gallery:approve -- nia-07 --revoke`.

To preview: `npm run build:preview` (adds the gallery and the strips on Home, About and Institutional Solutions).
To publish **after** you have confirmed publication permission: `npm run gallery:approve -- all` (or list ids, e.g. `nia-01 nia-02`), then `npm test`, then update the shared-chrome baseline with `node scripts/content-parity.mjs --accept-chrome` and accept the new pages as the checks tell you. Undo with `npm run gallery:approve -- all --revoke`.

## Rules applied to the web copies (originals are never modified)
- GPS Map Camera overlay cropped out per image (located by OCR, cut well above the stamp text, map thumbnail and the small GPS badge).
- No EXIF/GPS/XMP/ICC metadata. Neutral file names (no original names, dates or camera tags). Verified by `scripts/lint-claims.mjs` and an OCR check for residual location text.
- Faces: automatic detection plus a manual review of every photo at near-full size. Detected and hand-marked faces are blurred; where blurring would leave an ugly blob the edge of the frame was cropped instead. Wide shots with people mostly seen from behind were preferred.
- Captions are generic ("Classroom Training Session"); one category ("Classroom Sessions"). No institution names, dates, topics or trainer identities anywhere.
- WebP at 480 / 960 / 1600 px, `srcset`, lazy loading, explicit width/height (no layout shift).

## Limits you should know about
- Face detection is imperfect. Every photo was also reviewed by eye, but **please review the contact sheet yourself before approving**. Remove any photo you are not comfortable with, and tell me which.
- Of 160 originals only 20 met the bar. Most of the second folder shows students' faces clearly and was held back. More photos can be added once permission is confirmed or after tighter edits.
- The pipeline scripts in `tools/photos/` were written for the folder layout used during preparation; adjust the paths to rerun them.
