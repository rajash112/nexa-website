# NEXA website – how to deploy this final version (start here)

This folder is the **complete, final website** (all pages, PDFs, fonts, forms, and the 20 approved gallery photos).
Netlify builds it for you: build command `npm run build`, publish folder `dist` (already set in `netlify.toml`). **No environment variables or secrets are needed.**

I (the assistant) cannot log in to your GitHub or Netlify, so you do the push. Total time: about 10–15 minutes.

---------------------------------------------------------------------
## BEFORE YOU START (2 minutes)
1. **Keep a backup of the live site:** the production ZIP you downloaded from Netlify. Netlify also keeps every old deploy, so rollback is one click.
2. Decide how to push: **Option 1 (GitHub Desktop, easiest)** or **Option 2 (command line)**. Do NOT use the GitHub website "Upload files" button: it allows only 100 files per upload and this project has more.

---------------------------------------------------------------------
## OPTION 1 – GitHub Desktop (easiest)
1. Install **GitHub Desktop** (desktop.github.com) and sign in.
2. **File → Clone repository →** choose `rajash112/nexa-website` → Clone.
3. **Branch → New branch…** → name it `phase-a` → Create.
4. Click **Repository → Show in Explorer/Finder**. Open that folder.
5. **Delete everything in it except the hidden `.git` folder** (this also removes the old `index.html`).
6. Unzip `nexa-website-FINAL.zip` and **copy all its files and folders into that repo folder** (so `package.json`, `netlify.toml`, `src`, `scripts` … sit directly in the repo folder, not inside another folder).
7. Back in GitHub Desktop you will see all the changes. Type a summary: `NEXA website Phase A final` → **Commit to phase-a**.
8. Click **Publish branch** (top bar).

## OPTION 2 – Command line (Git installed)
```bash
git clone https://github.com/rajash112/nexa-website.git
cd nexa-website
git checkout -b phase-a
# delete everything except the .git folder, then copy the unzipped files in
# (Windows PowerShell: Get-ChildItem -Force | Where-Object Name -ne ".git" | Remove-Item -Recurse -Force)
# (Mac/Linux: find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +)
# now copy ALL files from the unzipped nexa-website-FINAL folder into this folder
git add -A
git commit -m "NEXA website Phase A final"
git push -u origin phase-a
```

---------------------------------------------------------------------
## STEP 3 – Let Netlify build a PREVIEW (your live site is NOT touched yet)
1. Netlify → your site → **Site configuration → Build & deploy → Continuous deployment → Branches and deploy previews**.
2. Turn on **Branch deploys** and add the branch `phase-a`. Save.
3. Go to **Deploys**. A new deploy for `phase-a` starts. Wait until it says **Published/Ready** and open its preview link.
4. If the build fails with a Node error: **Site configuration → Environment variables → Add** `NODE_VERSION` = `20`, then **Trigger deploy**.

## STEP 4 – Check the preview (5 minutes)
- Open: Home, About, Courses, one course page, Syllabus Library, University Syllabi, For Institutions, Resources, Projects, **NEXA in Action** (gallery – click a photo, use arrow keys), Contact, Privacy.
- Old links still work: `/contact/?course=python-programming`, `/syllabus/?type=official&inst=GIET`.
- Look at it on your phone.
- Download two PDFs.
- **Send one test enquiry from each of the 5 tabs** on the Contact page (Course, Institution, Internship, Workshop, Software).

## STEP 5 – Set up form notifications (important)
1. Netlify → your site → **Forms**. You should see 5 forms: `nexa-enquiry`, `nexa-institution-enquiry`, `nexa-internship-enquiry`, `nexa-workshop-enquiry`, `nexa-software-enquiry`.
2. For **each of the four new forms**: **Settings & notifications → Form notifications → Add notification → Email notification** → your e-mail address. (The old form's notification does NOT cover the new ones.)
3. Confirm your test enquiries arrived, then delete them from the Forms page.
4. If forms are missing: **Site configuration → Forms → Enable form detection**, then redeploy.

## STEP 6 – Go live
1. On GitHub, open a **Pull request** from `phase-a` into `main` → **Merge pull request**.
2. Netlify automatically builds and publishes `main` = your live site.
   (Alternative: Netlify **Deploys →** the `phase-a` deploy → **Publish deploy**.)
3. Open your live site and repeat a quick check, including one test enquiry.

## STEP 7 – After going live
- Google Search Console → submit `https://nexaeduacademy.netlify.app/sitemap.xml`.
- Optional link check: `npx linkinator https://nexaeduacademy.netlify.app --recurse` (about 500 external links have never been checked).
- If you add a custom domain later, change `url` in `src/data/site.js` and redeploy (canonical links and the sitemap use it).

---------------------------------------------------------------------
## IF SOMETHING GOES WRONG – instant rollback
Netlify → **Deploys** → click your **last good deploy** → **Publish deploy**. Done in seconds. (On GitHub you can also revert the merge.)

## KNOWN LIMITS (be aware)
- Live form delivery and real-phone behaviour were **not** tested by me; Steps 4–5 are where you confirm them.
- The old fake testimonials still exist in your GitHub repo's **history**. Make the repository **private** (Settings → General → Danger zone → Change visibility) or rewrite history. The published photos are also in the repo now.
- The 19 curricula are NEXA-authored **drafts pending trainer review**; the site says so.
- Nothing in the site claims placements, partnerships, ratings or student counts. Keep it that way.

## Remove or change something later
- Remove a photo: `npm run gallery:approve -- nia-07 --revoke` then rebuild/push.
- Everything about the project: `README.md` and the `docs/` folder.
