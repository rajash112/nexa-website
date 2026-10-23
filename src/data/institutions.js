// OFFICIAL SYLLABUS RECORDS
// -------------------------------------------------------------------
// Rule: nothing here is invented. Each `pdfUrl` below was read from the
// official institution page named in `sourceUrl` on `lastVerifiedAt`.
// What was verified is ONLY that the link is published by the institution.
// The PDF contents have NOT yet been opened and cross-checked, so no record
// is marked "verified". Status values:
//   source_located  = official link found on official portal; contents not yet extracted
//   needs_check     = official link found but file name/title look inconsistent
//   pending         = no exact official document located yet
// Subject-level data (subjectCode, semester, credits, units ...) is added to a
// record only after it is extracted from the PDF and cross-checked.

export const institutions = [
  {
    id: 'giet', name: 'GIET University, Gunupur', shortName: 'GIET University',
    state: 'Odisha', officialWebsite: 'https://www.giet.edu/',
    syllabusSourceUrl: 'https://www.giet.edu/academics/syllabus/',
    notes: 'Syllabus portal lists PDFs per programme and regulation year. Regulation year is not the same as admission batch; batch mapping needs the academic-regulations documents.'
  },
  {
    id: 'ltsu', name: 'Lamrin Tech Skills University Punjab', shortName: 'LTSU Punjab',
    state: 'Punjab', officialWebsite: 'https://www.ltsu.ac.in/',
    syllabusSourceUrl: 'https://www.ltsu.ac.in/university-school-of-computing',
    notes: 'The University School of Computing page links programme study-scheme PDFs for PGDCA, MCA and BCA. A B.Tech CSE (industry-integrated) syllabus PDF was not located on the pages checked.'
  }
];

const GS = 'https://www.giet.edu/academics/syllabus/';
const LS = 'https://www.ltsu.ac.in/university-school-of-computing';
const D = '2026-10-22';
const g = (id, title, degree, branch, reg, pdfUrl, extra = {}) => ({
  id, type: 'official', institutionId: 'giet', title, degree, branch, programme: `${degree} ${branch}`,
  regulation: reg, session: null, sourceUrl: GS, pdfUrl, verification: 'source_located', lastVerifiedAt: D, version: null, ...extra
});
const l = (id, title, degree, branch, session, pdfUrl, verification = 'source_located', extra = {}) => ({
  id, type: 'official', institutionId: 'ltsu', title, degree, branch, programme: `${degree}${branch ? ' ' + branch : ''}`,
  regulation: null, session, sourceUrl: LS, pdfUrl, verification, lastVerifiedAt: D, version: null, ...extra
});
const W = 'https://www.giet.edu/wp-content/uploads/';

export const officialSyllabi = [
  g('giet-btech-1st-year-2022-26', 'B.Tech Syllabus – 1st Year (2022-26)', 'B.Tech', 'Not specified (first-year document)', 'Admission batch 2022-26', W + '2022/08/2022-26-B.-TECH-SYLLABUS-1ST-YEAR.pdf', { session: '2022-26' }),
  g('giet-btech-cse-r2017', 'B.Tech CSE – Regulation 2017 Syllabus', 'B.Tech', 'Computer Science & Engineering', 'Regulation 2017', W + '2020/01/B.Tech-CSE-Regulation-2017-Syllabus.pdf'),
  g('giet-btech-cse-r2018', 'B.Tech CSE – Regulation 2018 Syllabus', 'B.Tech', 'Computer Science & Engineering', 'Regulation 2018', W + '2020/01/B.Tech-CSE-Regulation-2018-Syllabus.pdf'),
  g('giet-btech-cse-r2019', 'B.Tech CSE – Regulation 2019 Syllabus', 'B.Tech', 'Computer Science & Engineering', 'Regulation 2019', W + '2020/01/B.Tech-CSE-Regulation-2019-Syllabus.pdf'),
  g('giet-btech-cst-r2019', 'B.Tech CST – Regulation 2019 Syllabus', 'B.Tech', 'Computer Science & Technology (as titled on portal)', 'Regulation 2019', W + '2020/01/B.Tech-CST-Regulation-2019-Syllabus.pdf'),
  g('giet-btech-it-r2017', 'B.Tech IT – Regulation 2017 Syllabus', 'B.Tech', 'Information Technology', 'Regulation 2017', W + '2020/01/B.Tech-IT-Regulation-2017-Syllabus.pdf'),
  g('giet-btech-it-r2018', 'B.Tech IT – Regulation 2018 Syllabus', 'B.Tech', 'Information Technology', 'Regulation 2018', W + '2020/01/B.Tech-IT-Regulation-2018-Syllabus.pdf'),
  g('giet-bca-r2020-2a', 'BCA – Regulation 2020 Syllabus (Annexure 2A)', 'BCA', 'Computer Applications', 'Regulation 2020', W + '2020/08/BCA-R20_ANNEXURE-2A.pdf'),
  g('giet-bca-r2020-3a', 'BCA – Regulation 2020 Syllabus (Annexure 3A)', 'BCA', 'Computer Applications', 'Regulation 2020', W + '2020/08/BCA-R20_ANNEXURE-3A.pdf'),
  g('giet-mca-r2020-2a', 'MCA – Regulation 2020 Syllabus (Annexure 2A)', 'MCA', 'Computer Applications', 'Regulation 2020', W + '2020/08/MCA-R20_ANNEXURE-2A.pdf'),
  g('giet-mca-r2020-3a', 'MCA – Regulation 2020 Syllabus (Annexure 3A)', 'MCA', 'Computer Applications', 'Regulation 2020', W + '2020/08/MCA-R20_ANNEXURE-3A.pdf'),
  g('giet-mtech-cse-r2017', 'M.Tech CSE – Regulation 2017 Syllabus', 'M.Tech', 'Computer Science & Engineering', 'Regulation 2017', W + '2020/02/M.Tech-CSE-Regulation-2017-Syllabus.pdf'),
  g('giet-mtech-cse-r2018', 'M.Tech CSE – Regulation 2018 Syllabus', 'M.Tech', 'Computer Science & Engineering', 'Regulation 2018', W + '2020/02/M.Tech-CSE-Regulation-2018-Syllabus.pdf'),
  g('giet-mtech-cse-r2019', 'M.Tech CSE – Regulation 2019 Syllabus', 'M.Tech', 'Computer Science & Engineering', 'Regulation 2019', W + '2020/02/M.Tech-CSE-Regulation-2019-Syllabus.pdf'),
  g('giet-btech-cse-aiml-pending', 'B.Tech CSE (AI/ML specialisation) – syllabus', 'B.Tech', 'CSE – AI/ML specialisation', 'Not located', null, { verification: 'pending', note: 'No separate AI/ML syllabus PDF is listed on the GIET syllabus portal page that was checked. It may be published elsewhere (programme page or academic-regulations documents). Not confirmed.' }),

  l('ltsu-pgdca-2026', 'PGDCA – Study Scheme (2026)', 'PGDCA', '', '2026 (per file name)', 'https://www.ltsu.ac.in/assets/frontend/pdf/PGDCA-2026.pdf'),
  l('ltsu-mca-2025-26', 'MCA – Study Scheme (2025 & 2026)', 'MCA', '', '2025 & 2026 (per file name)', 'https://www.ltsu.ac.in/assets/frontend/pdf/MCA-2025&26.pdf'),
  l('ltsu-bca-aiml-2025-26', 'BCA (AI & ML) – Study Scheme (2025 & 2026)', 'BCA', 'Artificial Intelligence & Machine Learning', '2025 & 2026 (per file name)', 'https://www.ltsu.ac.in/assets/frontend/pdf/BCA-AI-ML-2025-&-2026.pdf'),
  l('ltsu-bca-cs-2025-26', 'BCA (Computer Science) – Study Scheme (2025 & 2026)', 'BCA', 'Computer Science', '2025 & 2026 (per file name)', 'https://www.ltsu.ac.in/assets/frontend/pdf/BCA-CS-2025-&-2026.pdf'),
  l('ltsu-bca-10plus2-needs-check', 'BCA (10+2 entry) – Study Scheme link', 'BCA', '', 'Not specified', 'https://www.ltsu.ac.in/uploads/mca-sem1.pdf', 'needs_check', { note: 'The official page links this BCA (10+2 entry) row to a file named "mca-sem1.pdf", which suggests a possible wrong or placeholder link on the university page. Confirm with the university before relying on it.' }),
  l('ltsu-btech-cse-ibm-pending', 'B.Tech CSE (industry-integrated, IBM) – syllabus', 'B.Tech', 'Computer Science & Engineering', 'AY 2026-27 admission (per university notice)', null, 'pending', { sourceUrl: 'https://www.ltsu.ac.in/graduated-courses', note: 'The LTSU home page mentions an IBM industry-integrated B.Tech CSE programme, but no syllabus PDF for it was found on the pages checked. Pending until the exact document is located.' })
];
