# Completed and pending features (end of Phase A)

## Completed (Phase A)
- Design system: navy / electric blue / cyan palette, Inter + Manrope + Space Grotesk (self-hosted), Lucide icons (inline), off-white section style, reduced-motion support, no third-party requests.
- Redesigned Home (new hero, ecosystem panel, services, methodology, FAQ) and About (founders with portrait).
- Courses: category + level filters and search; all 19 courses, PDFs and detail pages preserved; sticky summary panel on course and syllabus pages.
- Syllabus Library framed as the NEXA Curriculum Hub: clear split between NEXA-authored and official records, status legend with live counts. `/institutions/` unchanged as the official-syllabus source page.
- Resources and Projects: search and filters; projects labelled "NEXA curriculum project".
- New `/institutional-solutions/` page; Contact page with five separate Netlify enquiry forms (course, institution, internship, workshop, software) with validation, honeypot, consent, WhatsApp fallback and deep links.
- NEXA in Action gallery (masonry, keyboard-accessible lightbox) with 20 privacy-processed photos (approved and published).
- SEO: unique titles/descriptions/canonicals preserved, Open Graph, BreadcrumbList JSON-LD on all pages with breadcrumbs, Course and EducationalOrganization JSON-LD, sitemap, robots.txt.
- Accessibility: 0 axe-core violations (WCAG 2.1 A/AA + best practice) on 17 page types at mobile and desktop; Lighthouse accessibility 100.
- Tooling: content-parity test against production, claims/privacy lint, link checker, 51 + 20 browser checks, axe scan.

## Not done: needs information or content from you
- Trainers page, Team, growth journey, "latest updates / announcements", student experience / genuine testimonials, completed-by-NEXA / student / client projects, project detail pages (problem, solution, links), extra resource categories (practice questions, interview prep, developer tools), extra courses (Django, Flask, Linux, Ethical Hacking, Generative AI and others): all need verified content. None has been invented.
- Verified details for each photo batch (topic, institution, dates); more photos once permission is confirmed.
- Social media links, Google Analytics / Search Console / error monitoring (these need accounts and a deliberate CSP change; not added).
- Certificates, downloadable scorecards (need Phase B/C).

## Not started: later phases
- **Phase B:** Supabase (auth, database, storage), admin panel, enquiry database, e-mail notifications.
- **Phase C:** NEXA Pathway (roadmaps with real progress) and NEXA SkillCheck MCQ assessments.
- **Phase D:** sandboxed coding assessments, trainer and institution dashboards.
