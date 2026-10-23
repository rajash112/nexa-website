// NEXA static site generator. Plain Node (ESM). Only runtime dependency: pdfkit.
// Everything on the site is rendered from src/data/*.js so web pages and PDFs stay consistent.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { site, primary, waLink, mailLink, categories } from '../src/data/site.js';
import { coursesA } from '../src/data/courses-a.js';
import { coursesB } from '../src/data/courses-b.js';
import { institutions, officialSyllabi } from '../src/data/institutions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const out = (p, content) => { const f = path.join(DIST, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const warnings = [];

/* ---------- data normalisation + validation ---------- */
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
const courses = [...coursesA, ...coursesB].map((c) => {
  let w = 1;
  const modules = c.modules.map(([title, weeks, topics, lab], i) => {
    const m = { n: i + 1, title, weeks, topics: topics.split(';').map((t) => t.trim()).filter(Boolean), lab, from: w, to: w + weeks - 1 };
    w += weeks; return m;
  });
  const total = w - 1;
  if (total !== c.weeks) warnings.push(`${c.slug}: module weeks sum to ${total}, expected ${c.weeks}`);
  if (c.mini.length < 2) warnings.push(`${c.slug}: fewer than 2 mini-projects`);
  return { ...c, modules, category: catById[c.cat], url: `/courses/${c.slug}/`, syUrl: `/syllabus/${c.slug}/`, pdfUrl: `/pdfs/nexa-${c.slug}-syllabus.pdf`, version: '1.0', reviewed: site.buildDate, duration: `${c.weeks} Weeks` };
});
const bySlug = Object.fromEntries(courses.map((c) => [c.slug, c]));
courses.forEach((c) => c.related.forEach((r) => { if (!bySlug[r]) warnings.push(`${c.slug}: unknown related slug ${r}`); }));
if (courses.length !== 19) warnings.push(`expected 19 courses, found ${courses.length}`);
const instById = Object.fromEntries(institutions.map((i) => [i.id, i]));

const ASSESS = [['Weekly lab work and coding assignments', '30%'], ['Two mini-projects', '20%'], ['Mid-course practical / quiz', '15%'], ['Capstone project and demonstration', '25%'], ['Participation, documentation and code/peer review', '10%']];

/* ---------- layout ---------- */
const NAV = [['/', 'Home'], ['/about/', 'About NEXA'], ['/courses/', 'Courses'], ['/syllabus/', 'Syllabus Library'], ['/institutions/', 'College & University Syllabi'], ['/resources/', 'Learning Resources'], ['/projects/', 'Projects'], ['/contact/', 'Contact Us']];
const isActive = (cur, href) => (href === '/' ? cur === '/' : cur.startsWith(href));
const p0 = primary();
const socialLinks = Object.entries(site.social).filter(([, u]) => u).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(k[0].toUpperCase() + k.slice(1))}</a>`);

function layout({ title, desc, path: cur, body, noindex = false, jsonld = null, ogType = 'website' }) {
  const canon = site.url + cur;
  const full = title.includes('NEXA') ? title : `${title} | NEXA Education Academy`;
  const nav = NAV.map(([h, t]) => `<li><a href="${h}"${isActive(cur, h) ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  const mnav = NAV.map(([h, t]) => `<a href="${h}"${isActive(cur, h) ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow">'}
<meta name="theme-color" content="#020a14">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="NEXA Education Academy"><meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${site.url}/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head><body>
<a class="skip" href="#main">Skip to main content</a>
<canvas id="bgc" aria-hidden="true"></canvas>
<nav class="top" aria-label="Main navigation">
<a class="n-logo" href="/" aria-label="NEXA Education Academy – home"><img src="/assets/logo.jpg" alt="NEXA logo" width="85" height="42"></a>
<ul class="n-links">${nav}</ul>
<a class="btn btn-p btn-sm n-cta" href="/contact/">Enquire Now</a>
<button class="n-ham" id="ham" aria-label="Open menu" aria-expanded="false" aria-controls="mmenu">☰</button>
</nav>
<div id="mmenu">${mnav}<a href="/contact/">Enquire Now</a></div>
<main id="main">
${body}
</main>
<a id="fwa" href="${waLink('Hello NEXA, I would like to know more about your courses.')}" target="_blank" rel="noopener noreferrer" aria-label="Chat with NEXA on WhatsApp" title="Chat on WhatsApp">💬</a>
<button id="totop" aria-label="Back to top" type="button">↑</button>
<footer>
<div class="ft-grid">
<div><img src="/assets/logo.jpg" alt="NEXA logo" width="93" height="46"><p>${esc(site.tagline)} Courses and syllabi for school and college students across India.</p>${socialLinks.length ? `<p style="margin-top:12px">${socialLinks.join(' · ')}</p>` : ''}</div>
<div><h2>Courses</h2><ul>${categories.map((c) => `<li><a href="/courses/#cat-${c.id}">${esc(c.name)}</a></li>`).join('')}<li><a href="/courses/">All 19 courses</a></li></ul></div>
<div><h2>Explore</h2><ul><li><a href="/syllabus/">Syllabus Library</a></li><li><a href="/institutions/">College &amp; University Syllabi</a></li><li><a href="/resources/">Learning Resources</a></li><li><a href="/projects/">Projects</a></li><li><a href="/about/">About NEXA</a></li><li><a href="/privacy/">Privacy</a></li></ul></div>
<div><h2>Contact</h2><ul>${site.contacts.map((c) => `<li><a href="tel:${c.phone}">${c.phoneDisplay}</a> <span style="color:var(--txt2);font-size:.8rem">(${esc(c.name.split(' ')[0])})</span></li>`).join('')}<li><a href="${mailLink()}">${esc(p0.email)}</a></li><li><a href="${waLink()}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li><li>${esc(site.location)}</li></ul></div>
</div>
<div class="ft-bot"><span>© ${new Date().getFullYear()} ${esc(site.fullName)}. All rights reserved.</span><span>Made in India 🇮🇳</span></div>
</footer>
<script src="/js/main.js" defer></script>
</body></html>`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([h, t], i) => (h && i < items.length - 1 ? `<a href="${h}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`)).join(' › ')}</nav>`;
const phead = (cr, h1, sub) => `<section class="phead"><div class="wrap">${crumbs(cr)}<h1 class="sh">${h1}</h1>${sub ? `<p class="ssub">${sub}</p>` : ''}</div></section>`;
const waCourse = (c) => waLink(`Hello NEXA, I would like to enquire about the ${c.title} course.`);

function courseCard(c, i = 0) {
  return `<article class="card hov course-card a-${c.accent}" data-text="${esc((c.title + ' ' + c.description + ' ' + c.badge + ' ' + c.category.name).toLowerCase())}">
<span class="ico" aria-hidden="true">${c.icon}</span><span class="tag">${esc(c.badge)}</span>
<h3><a href="${c.url}" style="color:inherit;text-decoration:none">${esc(c.title)}</a></h3><p>${esc(c.description)}</p>
<div class="meta"><div><b>${esc(c.level)}</b>Level</div><div><b>${c.duration}</b>Duration</div><div><b>${esc(c.outcome)}</b>Outcome</div></div>
<div class="foot"><a class="btn btn-p btn-sm" href="${c.url}">View course &amp; syllabus</a><a class="btn btn-o btn-sm" href="/contact/?course=${c.slug}">Enquire</a></div></article>`;
}

/* ---------- pages ---------- */
function home() {
  const feat = ['python-programming', 'html5-css3', 'full-stack-web-development-mern', 'artificial-intelligence-machine-learning', 'data-science', 'cybersecurity'].map((s) => bySlug[s]);
  const faqs = [
    ['How do I enrol or ask about a batch?', `Use the <a href="/contact/">enquiry form</a>, call <a href="tel:${p0.phone}">${p0.phoneDisplay}</a> or message us on <a href="${waLink()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>. Batch dates, fees and mode are confirmed directly by NEXA.`],
    ['Which courses does NEXA list?', `${courses.length} course tracks across programming languages, web development, AI/ML/data and emerging technologies. Durations range from ${Math.min(...courses.map((c) => c.weeks))} to ${Math.max(...courses.map((c) => c.weeks))} weeks. See <a href="/courses/">all courses</a>.`],
    ['Is a NEXA curriculum the same as a university syllabus?', 'No. NEXA professional curricula are written by NEXA and are labelled <em>NEXA-authored</em>. Official university syllabi are labelled separately, link to the university’s own PDF, and show a verification status.'],
    ['Are the university syllabi complete and verified?', 'Not yet. Each official record shows exactly what has been checked. At present the library links official documents published by GIET University and LTSU Punjab; subject-level extraction is in progress and records are marked accordingly.'],
    ['Can I download a syllabus?', 'Yes. Every NEXA course has a downloadable PDF generated from the same data as its web page. Official syllabi open the university’s own PDF in a new tab.'],
    ['Do I need prior experience?', 'Each course page lists its level and prerequisites. HTML5/CSS3, Python, C and Data Analytics are beginner-friendly.']
  ];
  const nOff = officialSyllabi.length;
  const body = `
<section class="hero"><div class="wrap hero-grid">
<div class="reveal"><div class="badge">● Enquiries open – ask us about the next batch</div>
<div class="brandmark" aria-hidden="true">NEXA</div><div class="brandsub">Next-Gen Education &amp; Expertise Academy</div>
<h1>Learn skills. <span class="gt">Read the syllabus.</span> Build real projects.</h1>
<p class="lead">NEXA helps school and college students learn Python, C, C++, Java, web development, AI/ML, cybersecurity, IoT and more – with detailed module-by-module syllabi you can read and download before you enrol.</p>
<div class="row"><a class="btn btn-p" href="/courses/">Explore Courses</a><a class="btn btn-o" href="/syllabus/">Browse Syllabus</a></div>
<div class="facts"><div class="fact"><b>${courses.length}</b><span>course tracks</span></div><div class="fact"><b>${courses.length}</b><span>downloadable curricula (PDF)</span></div><div class="fact"><b>${nOff}</b><span>official syllabus records indexed</span></div></div></div>
<div class="hero-vis reveal"><img src="/assets/logo.jpg" alt="NEXA – Next-Gen Education and Expertise Academy logo" width="640" height="317"></div>
</div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap"><div class="center reveal"><div class="stag">Featured learning tracks</div><h2 class="sh">Popular <span class="gt">courses</span></h2><p class="ssub">Start with a focused track. Each one lists modules, labs, projects and a capstone.</p></div>
<div class="grid g3" style="margin-top:34px">${feat.map(courseCard).join('')}</div>
<p class="center" style="margin-top:30px"><a class="btn btn-o" href="/courses/">See all ${courses.length} courses</a></p></div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap"><div class="grid g2" style="align-items:center">
<div class="reveal"><div class="stag">Syllabus Library</div><h2 class="sh">Search syllabi <span class="gt">before you decide</span></h2>
<p class="ssub">Filter by institution, programme, branch, session or type. NEXA curricula and official university syllabi are clearly separated, and every record shows its source and verification status.</p>
<div class="row" style="margin-top:20px"><a class="btn btn-p" href="/syllabus/">Open Syllabus Library</a><a class="btn btn-o" href="/institutions/">College &amp; University Syllabi</a></div></div>
<div class="reveal"><ul class="ticks card"><li>${courses.length} NEXA professional curricula with week-wise plans and PDFs</li><li>${officialSyllabi.filter((s) => s.institutionId === 'giet').length} GIET University syllabus documents linked from the official portal</li><li>${officialSyllabi.filter((s) => s.institutionId === 'ltsu').length} LTSU Punjab records (computing programmes)</li><li>Honest statuses: “official link located”, “pending”, “needs checking”</li></ul></div></div></div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap"><div class="center reveal"><div class="stag">Learning process</div><h2 class="sh">How learning works <span class="gt">at NEXA</span></h2></div>
<div class="steps reveal" style="margin-top:30px"><div class="step"><h3>Pick a track</h3><p>Compare level, duration and prerequisites on each course page.</p></div><div class="step"><h3>Read the syllabus</h3><p>See every module, lab and assessment up front, and download the PDF.</p></div><div class="step"><h3>Practise in labs</h3><p>Each module has a lab or coding assignment so concepts are applied immediately.</p></div><div class="step"><h3>Build projects</h3><p>Two mini-projects and a capstone per course produce work you can show.</p></div></div></div></section>
<section class="sec-sm"><div class="wrap"><div class="grid g3">
<div class="card reveal"><span class="ico">🎓</span><h3>Grassroots focus</h3><p>We start with school and college students so strong foundations are built early.</p></div>
<div class="card reveal"><span class="ico">🔬</span><h3>Project-based learning</h3><p>Every course defines mini-projects and a capstone, listed openly on the <a href="/projects/">Projects page</a>.</p></div>
<div class="card reveal"><span class="ico">📋</span><h3>Custom programmes for institutions</h3><p>Schools and colleges can ask for tailored workshops and curricula. <a href="/contact/?topic=institution-partnership">Talk to us</a>.</p></div></div></div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap" style="max-width:860px"><div class="center reveal"><div class="stag">FAQ</div><h2 class="sh">Frequently asked <span class="gt">questions</span></h2></div><div style="margin-top:28px">${faqs.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="dbody"><p>${a}</p></div></details>`).join('')}</div></div></section>
<section class="sec-sm"><div class="wrap"><div class="card center reveal" style="padding:44px"><h2 class="sh">Ready to start <span class="gt">learning?</span></h2><p class="ssub">Send an enquiry or talk to us directly – we reply to every message.</p><div class="row" style="justify-content:center;margin-top:22px"><a class="btn btn-p" href="/contact/">Send an enquiry</a><a class="btn btn-wa" href="${waLink('Hello NEXA, I would like to know more about your courses.')}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a><a class="btn btn-o" href="tel:${p0.phone}">📞 Call ${p0.phoneDisplay}</a></div></div></div></section>`;
  return layout({ title: 'NEXA – Next-Gen Education & Expertise Academy | Courses & Syllabus Library', desc: 'NEXA Education Academy: 19 tech courses with downloadable syllabi, a searchable syllabus library and links to official GIET University and LTSU Punjab syllabus documents.', path: '/', body, jsonld: { '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: site.fullName, alternateName: 'NEXA Education Academy', url: site.url, logo: site.url + '/assets/logo.jpg', areaServed: 'IN', address: { '@type': 'PostalAddress', addressRegion: 'Uttar Pradesh', addressCountry: 'IN' } } });
}

function about() {
  const body = phead([['/', 'Home'], ['/about/', 'About NEXA']], 'About <span class="gt">NEXA</span>', 'Next-Gen Education &amp; Expertise Academy – a tech education academy building coding, AI and real-world skills from an early stage.') + `
<section class="sec-sm"><div class="wrap"><div class="grid g2">
<div class="card"><h2 class="sh-sm">Mission</h2><p>We train school and college students in coding, AI and real-world skills from an early stage – bridging the gap between classroom theory and industry practice.</p></div>
<div class="card"><h2 class="sh-sm">Vision</h2><p>Revolutionise education from the grassroots level. Every student, regardless of background, deserves access to next-generation skills.</p></div></div>
<div class="grid g3" style="margin-top:20px">
<div class="card"><span class="ico">📚</span><h3>Learning approach</h3><p>Every course is split into sequenced modules with stated outcomes, so a learner always knows what comes next and why. Curricula are versioned and published openly.</p></div>
<div class="card"><span class="ico">🛠️</span><h3>Practical training</h3><p>Each module pairs concepts with a lab or coding assignment, and courses list the tools to install before day one.</p></div>
<div class="card"><span class="ico">🚀</span><h3>Project-based learning</h3><p>Two mini-projects and a capstone per course. See them all on the <a href="/projects/">Projects page</a>.</p></div></div></div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap"><div class="center"><div class="stag">The team</div><h2 class="sh">Meet our <span class="gt">founders</span></h2></div>
<div class="grid g2" style="margin-top:28px;max-width:860px;margin-inline:auto">
<div class="card center"><h3>Ashish Raj</h3><span class="tag">Co-Founder &amp; CEO</span><p>Tech educator and developer focused on curriculum design, partnerships and NEXA’s direction.</p><div class="foot" style="justify-content:center"><a class="btn btn-o btn-sm" href="${mailLink('Enquiry for NEXA')}">E-mail</a><a class="btn btn-o btn-sm" href="${waLink('', 0)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>
<div class="card center"><h3>Akshat</h3><span class="tag">Co-Founder &amp; CTO</span><p>Full-stack developer and AI enthusiast guiding NEXA’s technical direction and course content.</p><div class="foot" style="justify-content:center"><a class="btn btn-o btn-sm" href="${waLink('', 1)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="btn btn-o btn-sm" href="tel:${site.contacts[1].phone}">Call</a></div></div></div></div></section>
<div class="dvd"></div>
<section class="sec"><div class="wrap"><div class="center"><div class="stag">What we offer</div><h2 class="sh">Services for <span class="gt">students &amp; institutions</span></h2></div>
<div class="grid g3" style="margin-top:28px">
<div class="card"><span class="ico">🏫</span><h3>School &amp; college programmes</h3><p>Industry-style tech training delivered to institutions, with a curriculum tailored to student level and academic calendar.</p><div class="foot"><a class="btn btn-o btn-sm" href="/contact/?topic=institution-partnership">Partner with NEXA</a></div></div>
<div class="card"><span class="ico">🧑‍💻</span><h3>Internship programmes</h3><p>Guided practical experience on projects, mentored by NEXA trainers.</p><div class="foot"><a class="btn btn-o btn-sm" href="/contact/?topic=internship-program">Ask about internships</a></div></div>
<div class="card"><span class="ico">⚡</span><h3>Workshops &amp; bootcamps</h3><p>One-day workshops to multi-week bootcamps on Python, web development, AI and cybersecurity.</p><div class="foot"><a class="btn btn-o btn-sm" href="/contact/?topic=workshop-bootcamp">Ask about workshops</a></div></div>
<div class="card"><span class="ico">🖥️</span><h3>Website development</h3><p>Modern, responsive websites for local businesses and startups, built by supervised student developers.</p><div class="foot"><a class="btn btn-o btn-sm" href="/contact/?topic=website-development">Request a quote</a></div></div></div>
<div class="note info" style="margin-top:24px"><strong>Transparency note.</strong> NEXA does not claim university affiliation or accreditation on this site. University syllabi shown in the library belong to those universities and are linked from their official pages.</div></div></section>`;
  return layout({ title: 'About NEXA', desc: 'About NEXA Education Academy: mission, vision, learning approach, practical and project-based training, founders and services for students and institutions.', path: '/about/', body });
}

function coursesPage() {
  const body = phead([['/', 'Home'], ['/courses/', 'Courses']], 'All <span class="gt">courses</span>', `${courses.length} course tracks in four categories. Each has a full syllabus and downloadable PDF.`) + `
<section class="sec-sm"><div class="wrap">
<div class="fg" style="max-width:420px"><label for="course-q">Search courses</label><input id="course-q" type="search" placeholder="e.g. Python, React, security" autocomplete="off"></div>
<div class="chips" role="group" aria-label="Filter by category"><button class="chip" data-cat="all" aria-pressed="true" type="button">All</button>${categories.map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="false" type="button">${c.icon} ${esc(c.name)}</button>`).join('')}</div>
<p class="count" id="course-count" aria-live="polite">${courses.length} courses shown</p>
${categories.map((c) => `<div data-cgroup="${c.id}" id="cat-${c.id}"><h2 class="cat-title">${c.icon} ${esc(c.name)}</h2><div class="grid g3">${courses.filter((x) => x.cat === c.id).map(courseCard).join('')}</div></div>`).join('')}
<div class="note info" style="margin-top:36px">Batch dates, fees and delivery mode are confirmed by NEXA on enquiry – <a href="/contact/">contact us</a>.</div></div></section>`;
  return layout({ title: 'Courses – Programming, Web, AI/ML, Cybersecurity & More', desc: 'Browse all 19 NEXA courses: Python, C, C++, Java, JavaScript, web development, MERN, AI/ML, data science, cybersecurity, IoT, cloud, Flutter, blockchain and DevOps.', path: '/courses/', body });
}

const li = (a) => `<li>${esc(a)}</li>`;
function modulesHtml(c, open = 0) {
  return c.modules.map((m, i) => `<details${i < open ? ' open' : ''}><summary><span>Module ${m.n}: ${esc(m.title)}</span><span class="wk">${m.from === m.to ? 'Week ' + m.from : `Weeks ${m.from}–${m.to}`}</span></summary><div class="dbody"><h4>Topics</h4><ul>${m.topics.map(li).join('')}</ul><h4>Lab / assignment</h4><p>${esc(m.lab)}</p></div></details>`).join('');
}
const refsHtml = (c) => `<ul class="ticks">${c.refs.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a></li>`).join('')}</ul>`;
const relHtml = (c) => `<div class="grid g3">${c.related.map((s) => bySlug[s]).map((r) => `<a class="card hov" href="${r.url}"><span class="ico">${r.icon}</span><h3>${esc(r.title)}</h3><p>${esc(r.level)} · ${r.duration}</p></a>`).join('')}</div>`;

function coursePage(c) {
  const body = phead([['/', 'Home'], ['/courses/', 'Courses'], [c.url, c.title]], `${c.icon} ${esc(c.title)}`, esc(c.description)) + `
<section class="sec-sm"><div class="wrap">
<div class="kv"><div>Category<b>${esc(c.category.name)}</b></div><div>Level<b>${esc(c.level)}</b></div><div>Duration<b>${c.duration}</b></div><div>Theory / practical<b>${esc(c.balance)}</b></div><div>Modules<b>${c.modules.length}</b></div><div>Syllabus version<b>${c.version}</b></div></div>
<div class="row"><a class="btn btn-p" href="/contact/?course=${c.slug}">Enquire / Register interest</a><a class="btn btn-o" href="${c.syUrl}">Full syllabus</a><a class="btn btn-o" href="${c.pdfUrl}" download>Download syllabus PDF</a><a class="btn btn-wa" href="${waCourse(c)}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a></div>
<div class="note info">Batch dates, fees and delivery mode for this course are confirmed by NEXA on enquiry.</div>
<div class="grid g2" style="margin-top:20px"><div class="card"><h2 class="sh-sm">Learning outcomes</h2><ul class="ticks">${c.outcomes.map(li).join('')}</ul></div>
<div class="card"><h2 class="sh-sm">Who it is for</h2><p>${esc(c.audience)}</p><h3 style="margin-top:16px">Prerequisites</h3><ul class="ticks">${c.prereq.map(li).join('')}</ul></div></div>
<h2 class="sh-sm" style="margin-top:36px">Modules and topics</h2>${modulesHtml(c, 1)}
<div class="grid g2" style="margin-top:26px"><div class="card"><h2 class="sh-sm">Mini-projects</h2><ul class="ticks">${c.mini.map(li).join('')}</ul><h3 style="margin-top:16px">Capstone project</h3><p>${esc(c.capstone)}</p></div>
<div class="card"><h2 class="sh-sm">Tools &amp; technologies</h2><ul class="ticks">${c.tools.map(li).join('')}</ul><p style="margin-top:12px"><strong>Setup:</strong> ${esc(c.setup)}</p></div></div>
<div class="grid g2" style="margin-top:20px"><div class="card"><h2 class="sh-sm">Assessment</h2><p>Suggested scheme (NEXA may adjust per batch): ${ASSESS.map(([a, b]) => `${a} ${b}`).join('; ')}.</p></div><div class="card"><h2 class="sh-sm">Official documentation &amp; resources</h2>${refsHtml(c)}</div></div>
<h2 class="sh-sm" style="margin-top:36px">Related courses</h2>${relHtml(c)}</div></section>`;
  return layout({ title: `${c.title} Course – Syllabus, Modules & Projects`, desc: `${c.title}: ${c.description} ${c.duration}, ${c.level} level, ${c.modules.length} modules with labs, mini-projects and a capstone. Download the syllabus PDF.`, path: c.url, body, ogType: 'article', jsonld: { '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.description, provider: { '@type': 'EducationalOrganization', name: site.fullName, url: site.url }, educationalLevel: c.level, timeRequired: `P${c.weeks}W` } });
}

function nexaSyllabusPage(c) {
  const body = phead([['/', 'Home'], ['/syllabus/', 'Syllabus Library'], [c.syUrl, c.title]], `${esc(c.title)} <span class="gt">Syllabus</span>`, 'NEXA Professional Curriculum – authored by NEXA, not an official university syllabus.') + `
<section class="sec-sm"><div class="wrap">
<div><span class="tag purple">NEXA Professional Curriculum</span><span class="tag purple">Version ${c.version}</span><span class="tag warn">NEXA-authored draft – trainer review pending</span></div>
<div class="kv"><div>Institution<b>NEXA Education Academy</b></div><div>Duration<b>${c.duration}</b></div><div>Level<b>${esc(c.level)}</b></div><div>Last reviewed<b>${c.reviewed}</b></div><div>Subject code<b>Not applicable</b></div><div>Credits<b>Not applicable</b></div></div>
<div class="row"><a class="btn btn-p" href="${c.pdfUrl}" download>Download PDF</a><a class="btn btn-o" href="${c.pdfUrl}" target="_blank" rel="noopener noreferrer">View PDF</a><a class="btn btn-o" href="${c.url}">Course page</a><a class="btn btn-o" href="/contact/?course=${c.slug}">Enquire</a></div>
<h2 class="sh-sm" style="margin-top:34px">1. Overview</h2><p class="ssub">${esc(c.description)}</p>
<h2 class="sh-sm" style="margin-top:28px">2. Course objectives and learning outcomes</h2><ul class="ticks">${c.outcomes.map(li).join('')}</ul>
<h2 class="sh-sm" style="margin-top:28px">3. Prerequisites and audience</h2><ul class="ticks">${c.prereq.map(li).join('')}</ul><p class="ssub" style="margin-top:8px">${esc(c.audience)}</p>
<h2 class="sh-sm" style="margin-top:28px">4. Units and topic-wise breakdown</h2>${modulesHtml(c, 1)}
<h2 class="sh-sm" style="margin-top:28px">5. Suggested week-wise teaching plan</h2><div class="tbl-wrap"><table><caption class="sr">Week-wise plan</caption><thead><tr><th>Week(s)</th><th>Module</th><th>Lab / assignment</th></tr></thead><tbody>${c.modules.map((m) => `<tr><td>${m.from === m.to ? m.from : m.from + '–' + m.to}</td><td>${esc(m.title)}</td><td>${esc(m.lab)}</td></tr>`).join('')}</tbody></table></div>
<h2 class="sh-sm" style="margin-top:28px">6. Projects</h2><ul class="ticks">${c.mini.map((m) => `<li>Mini-project: ${esc(m)}</li>`).join('')}<li><strong>Capstone:</strong> ${esc(c.capstone)}</li></ul>
<h2 class="sh-sm" style="margin-top:28px">7. Assessment scheme (suggested)</h2><div class="tbl-wrap"><table><thead><tr><th>Component</th><th>Weight</th></tr></thead><tbody>${ASSESS.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>
<h2 class="sh-sm" style="margin-top:28px">8. Tools, setup and official references</h2><ul class="ticks">${c.tools.map(li).join('')}</ul><p style="margin:10px 0;color:var(--txt2)"><strong>Setup:</strong> ${esc(c.setup)}</p>${refsHtml(c)}
<h2 class="sh-sm" style="margin-top:28px">9. Source and version</h2><p class="ssub">Authored by NEXA from the structured data used to generate the web page and the PDF. Version ${c.version}, last reviewed ${c.reviewed}. Official source link: not applicable (this is not a university syllabus).</p>
<h2 class="sh-sm" style="margin-top:28px">10. PDF</h2><object class="pdfview" data="${c.pdfUrl}" type="application/pdf" aria-label="${esc(c.title)} syllabus PDF"><p style="padding:20px;color:#000">Your browser cannot display the PDF inline. <a href="${c.pdfUrl}" style="color:#00539b">Download the PDF</a>.</p></object>
<h2 class="sh-sm" style="margin-top:28px">11. Related subjects</h2>${relHtml(c)}</div></section>`;
  return layout({ title: `${c.title} Syllabus (NEXA Curriculum v${c.version}) – PDF`, desc: `Complete NEXA ${c.title} syllabus: ${c.modules.length} modules, week-wise plan, labs, projects, assessment and references. Downloadable PDF.`, path: c.syUrl, body });
}

const VTXT = { verified: 'Verified', source_located: 'Official link located – contents not yet extracted', needs_check: 'Link needs checking', pending: 'Verification pending' };
function officialPage(s) {
  const inst = instById[s.institutionId];
  const body = phead([['/', 'Home'], ['/syllabus/', 'Syllabus Library'], [`/syllabus/${s.id}/`, s.title]], esc(s.title), `Official source record – ${esc(inst.name)}`) + `
<section class="sec-sm"><div class="wrap">
<div><span class="tag">Official University Syllabus</span><span class="tag ${s.verification === 'pending' ? 'gray' : 'warn'}">${VTXT[s.verification]}</span></div>
<div class="kv"><div>Institution<b>${esc(inst.name)}</b></div><div>Programme<b>${esc(s.programme)}</b></div><div>Branch<b>${esc(s.branch || 'Not specified')}</b></div><div>Regulation<b>${esc(s.regulation || 'Not specified')}</b></div><div>Academic session / batch<b>${esc(s.session || 'Not specified')}</b></div><div>Version<b>${esc(s.version || 'Not specified')}</b></div><div>Link last checked<b>${s.lastVerifiedAt}</b></div><div>Subject codes / credits<b>Not yet extracted</b></div></div>
<div class="row">${s.pdfUrl ? `<a class="btn btn-p" href="${esc(s.pdfUrl)}" target="_blank" rel="noopener noreferrer">View official PDF ↗</a>` : '<span class="tag gray">No official PDF located yet</span>'}<a class="btn btn-o" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source page ↗</a><a class="btn btn-o" href="/contact/?topic=syllabus-request">Request help with this syllabus</a></div>
${s.note ? `<div class="note"><strong>Note:</strong> ${esc(s.note)}</div>` : ''}
<div class="note info"><strong>What “${VTXT[s.verification]}” means.</strong> ${s.verification === 'source_located' ? 'The link to this document was found on the university’s own page on ' + s.lastVerifiedAt + '. NEXA has not yet opened the PDF to extract and cross-check subject names, codes, units, credits and marks, so those details are intentionally not shown here. We do not host or alter the university’s file.' : 'This record exists so students can see what has and has not been located. No syllabus content is shown because none has been verified.'}</div>
<h2 class="sh-sm" style="margin-top:28px">Sections not yet available for this record</h2><p class="ssub">Overview, units and topics, practical syllabus, credits and L-T-P, assessment scheme and recommended books will be published here only after they are extracted from the official PDF and cross-checked. Until then, please read the official document linked above.</p>
<h2 class="sh-sm" style="margin-top:28px">Related</h2><div class="grid g3"><a class="card hov" href="/institutions/"><h3>All institutions</h3><p>Coverage and sources</p></a><a class="card hov" href="/syllabus/?inst=${s.institutionId === 'giet' ? 'GIET' : 'Lamrin'}"><h3>More from ${esc(inst.shortName)}</h3><p>Browse this institution’s records</p></a><a class="card hov" href="/courses/"><h3>NEXA courses</h3><p>Skill-based professional curricula</p></a></div></div></section>`;
  return layout({ title: `${s.title} – ${inst.shortName}`, desc: `Official source record for ${s.title} at ${inst.name}. Verification status: ${VTXT[s.verification]}.`, path: `/syllabus/${s.id}/`, body, noindex: true });
}

function libraryPage() {
  const body = phead([['/', 'Home'], ['/syllabus/', 'Syllabus Library']], 'Syllabus <span class="gt">Library</span>', 'Search NEXA professional curricula and official college and university syllabus sources. Every record shows its type, source and verification status.') + `
<section class="sec-sm"><div class="wrap">
<div class="note info"><strong>Two kinds of records.</strong> <em>NEXA Professional Curriculum</em> is written by NEXA. <em>Official University Syllabus</em> records point to the university’s own document – NEXA does not alter or re-publish those files.</div>
<div id="lib-status" class="note info" role="status">Loading syllabus library…</div>
<div id="lib" hidden>
<div class="filters" role="search" aria-label="Syllabus filters">
<div class="fg full"><label for="f-q">Search by subject, title, institution or subject code</label><input id="f-q" type="search" placeholder="e.g. Python, B.Tech CSE, MCA" autocomplete="off"></div>
<div class="fg"><label for="f-type">Syllabus type</label><select id="f-type"><option value="">All types</option><option value="official">Official University Syllabus</option><option value="nexa">NEXA Professional Curriculum</option></select></div>
<div class="fg"><label for="f-inst">Institution or university</label><select id="f-inst"></select></div>
<div class="fg"><label for="f-degree">Programme or degree</label><select id="f-degree"></select></div>
<div class="fg"><label for="f-branch">Branch or specialization</label><select id="f-branch"></select></div>
<div class="fg"><label for="f-session">Academic session / regulation</label><select id="f-session"></select></div>
<div class="fg"><label for="f-sem">Semester or year</label><select id="f-sem"></select></div>
<div class="fg"><label for="f-sort">Sort by</label><select id="f-sort"><option value="title">Title (A–Z)</option><option value="inst">Institution</option></select></div>
<div class="fg"><span class="lbl">&nbsp;</span><button type="button" class="btn btn-o btn-sm" id="f-reset">Clear filters</button></div>
</div>
<p class="count" id="lib-count" aria-live="polite"></p><div class="grid g2" id="lib-list"></div>
<div class="note" style="margin-top:20px"><strong>Subject-level filters.</strong> Subject name, subject code and semester filters fill in automatically once subject-level records are added. At present official records are programme-level documents, so those fields show “Not specified” rather than invented values.</div></div>
<noscript><div class="note">JavaScript is needed for live filtering. You can still browse <a href="/courses/">courses</a> and <a href="/institutions/">official sources by institution</a>.</div></noscript></div></section>`;
  return layout({ title: 'Syllabus Library – Search & Download College and Course Syllabi', desc: 'Searchable syllabus library: NEXA professional curricula with PDFs and official GIET University and LTSU Punjab syllabus sources with honest verification status.', path: '/syllabus/', body });
}

function institutionsPage() {
  const nex = (id) => officialSyllabi.filter((s) => s.institutionId === id);
  const rows = (id) => nex(id).map((s) => `<tr><td><a href="/syllabus/${s.id}/">${esc(s.title)}</a></td><td>${esc(s.regulation || s.session || 'Not specified')}</td><td>${VTXT[s.verification]}</td><td>${s.pdfUrl ? `<a href="${esc(s.pdfUrl)}" target="_blank" rel="noopener noreferrer">Official PDF ↗</a>` : '—'}</td></tr>`).join('');
  const body = phead([['/', 'Home'], ['/institutions/', 'College & University Syllabi']], 'College &amp; University <span class="gt">Syllabi</span>', 'Official syllabus sources by institution, with an honest report of what has and has not been verified.') + `
<section class="sec-sm"><div class="wrap">
<div class="note"><strong>Coverage report (${site.buildDate}).</strong> ${institutions.length} institutions, ${officialSyllabi.length} records. Verified (contents extracted and cross-checked): <strong>${officialSyllabi.filter((s) => s.verification === 'verified').length}</strong>. Official link located: <strong>${officialSyllabi.filter((s) => s.verification === 'source_located').length}</strong>. Needs checking: <strong>${officialSyllabi.filter((s) => s.verification === 'needs_check').length}</strong>. Pending: <strong>${officialSyllabi.filter((s) => s.verification === 'pending').length}</strong>. NEXA does not cover all Indian colleges or universities; the directory is designed to be extended one verified institution at a time.</div>
${institutions.map((i) => `<h2 class="cat-title">${esc(i.name)}</h2><div class="card"><p>${esc(i.notes)}</p><div class="row" style="margin-top:12px"><a class="btn btn-o btn-sm" href="${esc(i.officialWebsite)}" target="_blank" rel="noopener noreferrer">Official website ↗</a><a class="btn btn-o btn-sm" href="${esc(i.syllabusSourceUrl)}" target="_blank" rel="noopener noreferrer">Official syllabus source ↗</a><a class="btn btn-p btn-sm" href="/syllabus/?inst=${i.id === 'giet' ? 'GIET' : 'Lamrin'}">Filter in library</a></div></div><div class="tbl-wrap" style="margin-top:16px"><table><thead><tr><th>Record</th><th>Regulation / session</th><th>Status</th><th>Official PDF</th></tr></thead><tbody>${rows(i.id)}</tbody></table></div>`).join('')}
<h2 class="cat-title">Add another institution</h2><div class="card"><p>Studying elsewhere? Tell us your university, programme and admission year. We add an institution only when its official syllabus document can be located and checked. AICTE model curricula may be used as a reference, but are never presented as a specific university’s adopted syllabus without evidence.</p><div class="foot"><a class="btn btn-p btn-sm" href="/contact/?topic=syllabus-request">Request a syllabus</a></div></div></div></section>`;
  return layout({ title: 'College & University Syllabi – GIET University & LTSU Punjab Sources', desc: 'Official syllabus sources for GIET University Gunupur and Lamrin Tech Skills University Punjab with verification status and coverage report.', path: '/institutions/', body });
}

function resourcesPage() {
  const seen = new Set();
  const group = (cat) => {
    const items = courses.filter((c) => c.cat === cat.id).flatMap((c) => c.refs.map(([t, u]) => ({ t, u, course: c.title }))).filter((r) => !seen.has(cat.id + r.u) && seen.add(cat.id + r.u));
    return `<h2 class="cat-title">${cat.icon} ${esc(cat.name)}</h2><div class="grid g2">${items.map((r) => `<a class="card hov" href="${esc(r.u)}" target="_blank" rel="noopener noreferrer"><h3>${esc(r.t)} ↗</h3><p>Used in: ${esc(r.course)}</p></a>`).join('')}</div>`;
  };
  const body = phead([['/', 'Home'], ['/resources/', 'Learning Resources']], 'Learning <span class="gt">Resources</span>', 'Official documentation and standards used in NEXA courses, plus every downloadable curriculum PDF.') + `
<section class="sec-sm"><div class="wrap"><div class="note info">External links open the publisher’s own site. NEXA does not control their content.</div>
<h2 class="cat-title">📄 Downloadable NEXA curriculum PDFs</h2><div class="grid g3">${courses.map((c) => `<div class="card"><h3>${esc(c.title)}</h3><p>${c.duration} · v${c.version}</p><div class="foot"><a class="btn btn-o btn-sm" href="${c.pdfUrl}" download>Download PDF</a><a class="btn btn-o btn-sm" href="${c.syUrl}">Read online</a></div></div>`).join('')}</div>
${categories.map(group).join('')}
<h2 class="cat-title">🏛️ Official syllabus portals</h2><div class="grid g2"><a class="card hov" href="https://www.giet.edu/academics/syllabus/" target="_blank" rel="noopener noreferrer"><h3>GIET University syllabus portal ↗</h3></a><a class="card hov" href="https://www.ltsu.ac.in/university-school-of-computing" target="_blank" rel="noopener noreferrer"><h3>LTSU University School of Computing ↗</h3></a></div></div></section>`;
  return layout({ title: 'Learning Resources – Documentation & Curriculum PDFs', desc: 'Official documentation links and downloadable syllabus PDFs for NEXA courses in programming, web, AI/ML, cybersecurity, IoT, cloud and DevOps.', path: '/resources/', body });
}

function projectsPage() {
  const body = phead([['/', 'Home'], ['/projects/', 'Projects']], 'Practical <span class="gt">projects</span>', 'Mini-projects and capstones defined in each NEXA curriculum.') + `
<section class="sec-sm"><div class="wrap"><div class="note info"><strong>About this page.</strong> These are the projects each course is designed around. They are curriculum projects, not a claim about completed student work. Showcases of real student projects will be added once NEXA supplies them.</div>
${categories.map((cat) => `<h2 class="cat-title">${cat.icon} ${esc(cat.name)}</h2><div class="grid g2">${courses.filter((c) => c.cat === cat.id).map((c) => `<div class="card a-${c.accent}"><span class="tag">${esc(c.title)}</span><h3>Mini-projects</h3><ul class="ticks">${c.mini.map(li).join('')}</ul><h3 style="margin-top:14px">Capstone</h3><p>${esc(c.capstone)}</p><div class="foot"><a class="btn btn-o btn-sm" href="${c.syUrl}">See syllabus</a><a class="btn btn-o btn-sm" href="/contact/?course=${c.slug}">Enquire</a></div></div>`).join('')}</div>`).join('')}
<div class="card center" style="margin-top:36px"><h2 class="sh-sm">Need a website or software project built?</h2><p>NEXA also builds websites for local businesses with supervised student developers.</p><div class="foot" style="justify-content:center"><a class="btn btn-p" href="/contact/?topic=website-development">Request a quote</a></div></div></div></section>`;
  return layout({ title: 'Projects – Mini-projects & Capstones in Every Course', desc: 'Mini-projects and capstone projects included in each NEXA course across programming, web, AI/ML, data, cybersecurity, IoT, cloud and DevOps.', path: '/projects/', body });
}

function contactPage() {
  const opts = [['Courses', courses.map((c) => [c.title, c.slug])], ['Services', [['School/College Partnership', 'institution-partnership'], ['Website Development', 'website-development'], ['Internship Program', 'internship-program'], ['Workshop / Bootcamp', 'workshop-bootcamp']]], ['Syllabus', [['Syllabus request / correction', 'syllabus-request']]], ['Other', [['General enquiry', 'general']]]];
  const body = phead([['/', 'Home'], ['/contact/', 'Contact Us']], 'Contact <span class="gt">NEXA</span>', 'Ready to enrol, partner or just explore? Reach out – we reply to every enquiry.') + `
<section class="sec-sm"><div class="wrap ct-grid">
<div><h2 class="sh-sm">Contact us directly</h2>
${site.contacts.map((c) => `<div class="ct-item"><span class="ct-ico" aria-hidden="true">📞</span><div><strong style="color:var(--txt)">${esc(c.name)} (${esc(c.role.split('&')[1]?.trim() || c.role)})</strong><br><a href="tel:${c.phone}">${c.phoneDisplay}</a> · <a href="${waLink('Hello NEXA, I would like to know more about your courses.', site.contacts.indexOf(c))}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>`).join('')}
<div class="ct-item"><span class="ct-ico" aria-hidden="true">✉️</span><div><strong style="color:var(--txt)">Email</strong><br><a href="${mailLink('Enquiry from NEXA website')}">${esc(p0.email)}</a></div></div>
<div class="ct-item"><span class="ct-ico" aria-hidden="true">📍</span><div><strong style="color:var(--txt)">Location</strong><br>${esc(site.location)}</div></div>
<div class="card" style="margin-top:20px"><h2 class="sh-sm">Office hours</h2><p>${site.hours.join('<br>')}</p></div>
<p style="margin-top:16px"><a class="btn btn-wa" href="${waLink('Hello NEXA, I would like to know more about your courses.')}" target="_blank" rel="noopener noreferrer">💬 Chat on WhatsApp</a></p></div>
<div class="form-card"><h2 class="sh-sm">Send an enquiry</h2>
<form id="enquiry" name="${site.formName}" method="POST" action="/contact/success/" data-netlify="true" netlify-honeypot="bot-field" novalidate>
<input type="hidden" name="form-name" value="${site.formName}">
<p class="hp" aria-hidden="true"><label>Do not fill this in: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
<div class="f-row"><div class="fg"><label for="name">Full name <span class="req" aria-hidden="true">*</span></label><input id="name" name="name" autocomplete="name" required aria-describedby="err-name"><span class="err" id="err-name" aria-live="polite"></span></div>
<div class="fg"><label for="email">Email <span class="req" aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required aria-describedby="err-email"><span class="err" id="err-email" aria-live="polite"></span></div></div>
<div class="f-row"><div class="fg"><label for="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="10-digit mobile number" aria-describedby="err-phone"><span class="err" id="err-phone" aria-live="polite"></span></div>
<div class="fg"><label for="institution">School / college (optional)</label><input id="institution" name="institution" autocomplete="organization"></div></div>
<div class="fg"><label for="topic">Course or subject of interest <span class="req" aria-hidden="true">*</span></label><select id="topic" name="topic" required aria-describedby="err-topic"><option value="">Select a course or topic</option>${opts.map(([g, os]) => `<optgroup label="${g}">${os.map(([t, s]) => `<option value="${esc(t)}" data-slug="${s}">${esc(t)}</option>`).join('')}</optgroup>`).join('')}</select><span class="err" id="err-topic" aria-live="polite"></span></div>
<div class="fg"><label for="message">Message <span class="req" aria-hidden="true">*</span></label><textarea id="message" name="message" required aria-describedby="err-message" placeholder="Tell us about yourself or your institution…"></textarea><span class="err" id="err-message" aria-live="polite"></span></div>
<div class="chk"><input type="checkbox" id="consent" name="consent" value="yes" required aria-describedby="err-consent"><label for="consent" style="font-weight:400">I agree that NEXA may use these details to reply to my enquiry. See the <a href="/privacy/">privacy information</a>. <span class="req" aria-hidden="true">*</span></label></div><span class="err" id="err-consent" aria-live="polite"></span>
<div class="row"><button type="submit" class="btn btn-p">Send message</button><button type="button" class="btn btn-wa" id="wa-send" data-wa="${p0.whatsapp}">Send via WhatsApp instead</button></div>
<div id="form-status" class="status" aria-live="polite"></div>
</form><noscript><div class="note">Without JavaScript the form still submits normally.</div></noscript></div></div></section>`;
  return layout({ title: 'Contact NEXA – Enquiries, Courses & Partnerships', desc: 'Contact NEXA Education Academy by phone, WhatsApp, email or enquiry form for course admissions, school and college partnerships, workshops and syllabus requests.', path: '/contact/', body });
}

const successPage = () => layout({ title: 'Enquiry received', desc: 'Thank you for contacting NEXA Education Academy.', path: '/contact/success/', noindex: true, body: phead([['/', 'Home'], ['/contact/success/', 'Enquiry received']], 'Thank <span class="gt">you</span>', 'Your enquiry was submitted. We will reply by e-mail or phone.') + `<section class="sec-sm"><div class="wrap"><div class="row"><a class="btn btn-p" href="/courses/">Explore courses</a><a class="btn btn-o" href="/syllabus/">Browse syllabus</a></div></div></section>` });

const privacyPage = () => layout({ title: 'Privacy Information', desc: 'How NEXA Education Academy handles enquiry and contact data submitted through this website.', path: '/privacy/', body: phead([['/', 'Home'], ['/privacy/', 'Privacy']], 'Privacy <span class="gt">information</span>', 'Plain-language summary for visitors and students.') + `<section class="sec-sm"><div class="wrap" style="max-width:820px"><div class="note"><strong>Draft for owner review.</strong> This summary describes how the site is built. NEXA should review and confirm it, including retention period and a deletion contact, before relying on it as a formal policy.</div>
<h2 class="sh-sm">What we collect</h2><p class="ssub">Only what you type into the enquiry form: name, e-mail, optional phone number, optional school or college, course of interest, message and your consent. The site has no accounts, no advertising trackers and no analytics scripts.</p>
<h2 class="sh-sm" style="margin-top:22px">How it is used</h2><p class="ssub">To reply to your enquiry. We do not sell your information.</p>
<h2 class="sh-sm" style="margin-top:22px">Where it goes</h2><p class="ssub">Form submissions are handled by Netlify Forms (our hosting provider) and delivered to NEXA. If you contact us by phone, WhatsApp or e-mail, that service’s own privacy terms also apply.</p>
<h2 class="sh-sm" style="margin-top:22px">Your choices</h2><p class="ssub">To ask us to correct or delete your enquiry, e-mail <a href="${mailLink('Data request')}">${esc(p0.email)}</a>.</p>
<h2 class="sh-sm" style="margin-top:22px">Fonts</h2><p class="ssub">Page fonts are loaded from Google Fonts, which may receive your IP address when a page loads.</p></div></section>` });

const notFound = () => layout({ title: 'Page not found', desc: 'The page you requested could not be found.', path: '/404.html', noindex: true, body: phead([['/', 'Home']], '404 – page <span class="gt">not found</span>', 'The page may have moved. Try one of these instead.') + `<section class="sec-sm"><div class="wrap"><div class="row"><a class="btn btn-p" href="/">Home</a><a class="btn btn-o" href="/courses/">Courses</a><a class="btn btn-o" href="/syllabus/">Syllabus Library</a><a class="btn btn-o" href="/contact/">Contact</a></div></div></section>` });

/* ---------- PDF generation ---------- */
const clean = (s) => String(s ?? '').replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, '?');
function makePdf(c, file) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 54, right: 54 }, bufferPages: true, info: { Title: `${c.title} – NEXA Professional Curriculum v${c.version}`, Author: 'NEXA Education Academy', Subject: 'NEXA-authored curriculum', Keywords: c.title } });
    const s = fs.createWriteStream(file); doc.pipe(s); s.on('finish', resolve); s.on('error', reject);
    const W = doc.page.width - 108, ink = '#0b1b2e', accent = '#0a6fb5', mute = '#44566b';
    const H = (t, sz = 14) => { if (doc.y > doc.page.height - 130) doc.addPage(); doc.moveDown(.8).font('Helvetica-Bold').fontSize(sz).fillColor(accent).text(clean(t)); doc.moveDown(.25).font('Helvetica').fontSize(10).fillColor(ink); };
    const P = (t) => doc.font('Helvetica').fontSize(10).fillColor(ink).text(clean(t), { width: W, lineGap: 2 });
    const B = (t, ind = 0) => doc.font('Helvetica').fontSize(10).fillColor(ink).text('•  ' + clean(t), doc.page.margins.left + ind, doc.y, { width: W - ind, lineGap: 2 });
    // cover band
    doc.rect(0, 0, doc.page.width, 150).fill('#020a14');
    try { doc.image(path.join(SRC, 'assets/logo.jpg'), 54, 20, { height: 110 }); } catch { /* logo optional */ }
    doc.fillColor('#9db5cc').font('Helvetica').fontSize(9).text('NEXA-AUTHORED CURRICULUM', 330, 60, { width: 210, align: 'right' }).text('Not an official university syllabus', 330, 74, { width: 210, align: 'right' });
    doc.y = 175; doc.x = 54;
    doc.font('Helvetica-Bold').fontSize(24).fillColor(ink).text(clean(c.title), { width: W });
    doc.font('Helvetica').fontSize(12).fillColor(mute).text('Professional curriculum and syllabus', { width: W });
    doc.moveDown(.8);
    const meta = [['Document type', 'NEXA-authored Curriculum'], ['Version', `${c.version} (draft pending trainer review)`], ['Last reviewed', c.reviewed], ['Category', c.category.name], ['Level', c.level], ['Duration', `${c.duration} (${c.modules.length} modules)`], ['Theory / practical', c.balance], ['Institution / programme', 'NEXA Education Academy – not applicable'], ['Official source link', 'Not applicable (NEXA-authored)']];
    meta.forEach(([k, v]) => { const y = doc.y; doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(k, 54, y, { width: 150 }); doc.font('Helvetica').fillColor(ink).text(clean(v), 210, y, { width: W - 156 }); doc.moveDown(.2); });
    H('Table of contents', 13);
    const toc = ['1. Course description, audience and prerequisites', '2. Learning outcomes', ...c.modules.map((m) => `    Module ${m.n}: ${m.title} (${m.from === m.to ? 'Week ' + m.from : 'Weeks ' + m.from + '-' + m.to})`), '3. Week-wise teaching plan', '4. Projects', '5. Assessment plan', '6. Tools and setup', '7. References and source URLs'];
    toc.forEach((t) => P(t));
    doc.addPage(); doc.y = 60;
    H('1. Course description, audience and prerequisites'); P(c.description); doc.moveDown(.4); P('Target audience: ' + c.audience); doc.moveDown(.4); doc.font('Helvetica-Bold').text('Prerequisites'); c.prereq.forEach((x) => B(x));
    H('2. Learning outcomes'); c.outcomes.forEach((x) => B(x));
    H('Module-by-module syllabus', 14);
    c.modules.forEach((m) => {
      if (doc.y > doc.page.height - 190) doc.addPage();
      doc.moveDown(.6).font('Helvetica-Bold').fontSize(11.5).fillColor(ink).text(clean(`Module ${m.n}: ${m.title}`), { width: W });
      doc.font('Helvetica-Oblique').fontSize(9).fillColor(mute).text(m.from === m.to ? `Week ${m.from}` : `Weeks ${m.from}-${m.to}`);
      doc.moveDown(.2).font('Helvetica-Bold').fontSize(10).fillColor(ink).text('Topics'); m.topics.forEach((t) => B(t, 10));
      doc.moveDown(.2).font('Helvetica-Bold').fontSize(10).text('Laboratory / coding assignment'); P(m.lab);
    });
    H('3. Suggested week-wise teaching plan');
    c.modules.forEach((m) => P(`${m.from === m.to ? 'Week ' + m.from : 'Weeks ' + m.from + '-' + m.to}: ${m.title}. Lab: ${m.lab}`));
    H('4. Projects'); doc.font('Helvetica-Bold').text('Mini-projects'); c.mini.forEach((x) => B(x)); doc.moveDown(.3).font('Helvetica-Bold').text('Capstone project'); P(c.capstone);
    H('5. Assessment plan (suggested)'); ASSESS.forEach(([a, b]) => B(`${a}: ${b}`)); P('NEXA may adjust the scheme per batch.');
    H('6. Tools and setup'); c.tools.forEach((x) => B(x)); doc.moveDown(.3); P('Setup guidance: ' + c.setup);
    H('7. References and source URLs'); c.refs.forEach(([t, u]) => B(`${t} - ${u}`));
    doc.moveDown(1).font('Helvetica-Oblique').fontSize(9).fillColor(mute).text(`Generated from the same structured data as ${site.url}${c.syUrl}. Contact: ${p0.phoneDisplay} | ${p0.email}`, { width: W });
    const n = doc.bufferedPageRange().count;
    for (let i = 0; i < n; i++) { doc.switchToPage(i); doc.page.margins.bottom = 0; doc.font('Helvetica').fontSize(8).fillColor(mute).text(`NEXA Education Academy - ${clean(c.title)} - NEXA-authored Curriculum v${c.version}   |   Page ${i + 1} of ${n}`, 54, doc.page.height - 40, { width: W, align: 'center', lineBreak: false }); }
    doc.end();
  });
}

/* ---------- run ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const d of ['css', 'js', 'assets']) fs.cpSync(path.join(SRC, d), path.join(DIST, d), { recursive: true });

out('index.html', home()); out('about/index.html', about()); out('courses/index.html', coursesPage());
out('syllabus/index.html', libraryPage()); out('institutions/index.html', institutionsPage()); out('resources/index.html', resourcesPage());
out('projects/index.html', projectsPage()); out('contact/index.html', contactPage()); out('contact/success/index.html', successPage());
out('privacy/index.html', privacyPage()); out('404.html', notFound());
courses.forEach((c) => { out(`courses/${c.slug}/index.html`, coursePage(c)); out(`syllabus/${c.slug}/index.html`, nexaSyllabusPage(c)); });
officialSyllabi.forEach((s) => out(`syllabus/${s.id}/index.html`, officialPage(s)));

const index = { generated: site.buildDate, records: [
  ...courses.map((c) => ({ id: c.slug, type: 'nexa', title: `${c.title} – NEXA Professional Curriculum`, institution: 'NEXA Education Academy', degree: 'NEXA Professional Curriculum', programme: 'NEXA Professional Curriculum', branch: c.category.name, session: `Version ${c.version} (${c.reviewed.slice(0, 4)})`, semester: null, code: null, credits: null, verification: 'nexa_draft', version: c.version, url: c.syUrl, pdfUrl: c.pdfUrl, external: false })),
  ...officialSyllabi.map((s) => ({ id: s.id, type: 'official', title: s.title, institution: instById[s.institutionId].name, degree: s.degree, programme: s.programme, branch: s.branch || null, session: s.regulation || s.session || null, semester: null, code: null, credits: null, verification: s.verification, url: `/syllabus/${s.id}/`, pdfUrl: s.pdfUrl, external: true }))
] };
out('data/syllabus-index.json', JSON.stringify(index));

const urls = ['/', '/about/', '/courses/', '/syllabus/', '/institutions/', '/resources/', '/projects/', '/contact/', '/privacy/', ...courses.flatMap((c) => [c.url, c.syUrl])];
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${site.url}${u}</loc><lastmod>${site.buildDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);

fs.mkdirSync(path.join(DIST, 'pdfs'), { recursive: true });
for (const c of courses) await makePdf(c, path.join(DIST, c.pdfUrl));

console.log(`Built ${courses.length} course pages, ${courses.length} NEXA syllabus pages, ${officialSyllabi.length} official records, ${courses.length} PDFs -> dist/`);
if (warnings.length) { console.error('DATA WARNINGS:\n - ' + warnings.join('\n - ')); process.exitCode = 1; }
