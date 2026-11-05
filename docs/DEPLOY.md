# Deployment guide, checklist and rollback

**Nothing in this package has been deployed. Do not replace the production site until you have checked a preview.**

## 1. Before you deploy
- [ ] Read `docs/FEATURES.md` (what is and is not done) and `docs/TESTING_REPORT.md`.
- [ ] Decide the open items listed in section 6.
- [ ] Gallery: all 20 photos are approved and will be published at `/nexa-in-action/`. Once pushed, the photo files are in your repository too, so a public repo exposes them (they are public on the website anyway).
- [ ] Run locally: `npm install && npm test` (must say *All checks passed*, *Claims lint OK*, *Content parity OK*).

## 2. Netlify settings (already in `netlify.toml`)
| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20 or newer (set `NODE_VERSION=20` in Site settings → Environment if your default is older) |
| Environment variables | **none required** |

## 3. Safe deploy path (recommended)
1. Put this source on a **new branch** (e.g. `phase-a`) in your repo. Do not merge into `main` yet.
2. In Netlify → Site configuration → Build & deploy → Branches, enable **branch deploys** (or deploy previews). Netlify builds the branch at its own URL and leaves production untouched.
3. On the preview URL, run the post-deploy checks below.
4. When satisfied, merge to `main` (or in Netlify → Deploys → the preview deploy → **Publish deploy**).

(Alternative without Git: run `npm run build`, then drag the `dist` folder onto a *separate, new* Netlify site to preview it.)

## 4. Post-deploy checks (on the preview, then on production)
- [ ] Home, About, Courses, a course page, Syllabus Library (search + filters), University Syllabi, Institutional Solutions, Resources, Projects, Contact, Privacy all load; 404 page works for a bad URL.
- [ ] Old deep links work: `/contact/?course=python-programming`, `/contact/?topic=institution-partnership`, `/syllabus/?type=official&inst=GIET`.
- [ ] Submit **one test enquiry from each of the five tabs** on the Contact page; confirm each appears in Netlify → Forms and that e-mail notifications arrive. Delete the test submissions.
- [ ] WhatsApp buttons open `wa.me` with the right number on a real phone.
- [ ] Download two PDFs and open them.
- [ ] Check on a real phone and a laptop (menu, forms, lightbox if the gallery is approved).
- [ ] Run an external-link checker (for example `npx linkinator https://<preview-url> --recurse`). About 500 external links, mostly official documentation, have **never been checked**.
- [ ] Submit the sitemap in Google Search Console after going live.

## 5. Form notifications (important)
Netlify only creates the four new forms after the first successful deploy. **Add an e-mail notification to each one** (Forms → Form notifications): `nexa-institution-enquiry`, `nexa-internship-enquiry`, `nexa-workshop-enquiry`, `nexa-software-enquiry`. The existing `nexa-enquiry` notification does not cover them. Also check your plan's monthly form-submission limit. Details: `docs/FORMS.md`.

## 6. Open decisions
1. Photos: approved by you; remove any single photo later with `npm run gallery:approve -- <id> --revoke`.
2. Which logo is official: the site's current one or the new "N" logo seen in the founder portrait.
3. Founder title: the portrait says "Founder & CEO", the site says "Co-Founder & CEO".
4. Blockchain and DevOps levels: the live site says Intermediate (an earlier build changed them from Advanced). Kept as live.
5. This package has the old single-page site and its notes removed. The **git history** of your existing repository still contains them (including fabricated testimonials), so make the repository private or rewrite that history before relying on it publicly.
6. The curricula are NEXA-authored **drafts pending trainer review**; the label stays until trainers review them.

## 7. Rollback
- **Fastest (Netlify):** Deploys → pick the last good production deploy → **Publish deploy**. This is instant and needs no Git change. Netlify keeps all earlier deploys.
- **Git:** `git revert` the merge commit on `main`, or reset `main` to the previous tag (create one before merging: `git tag production-before-phase-a`).
- Keep the downloaded deploy ZIP of the current production site as an offline backup.
