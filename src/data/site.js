// Central site configuration. EVERY contact value below was taken from the
// original index.html. Nothing is invented. To add a missing channel
// (Instagram, LinkedIn, YouTube ...) fill the matching field in `social`;
// empty fields are simply not rendered.
export const site = {
  name: 'NEXA',
  fullName: 'NEXA – Next-Gen Education & Expertise Academy',
  shortName: 'NEXA Education Academy',
  url: 'https://nexaeduacademy.netlify.app',
  tagline: 'Building future-ready minds, one skill at a time.',
  version: '2.0.0',
  buildDate: '2026-10-22',
  contacts: [
    { name: 'Ashish Raj', role: 'Co-Founder & CEO', phone: '+918969689751', phoneDisplay: '+91 89696 89751', whatsapp: '918969689751', email: 'ashishraj112.ashu@gmail.com' },
    { name: 'Akshat', role: 'Co-Founder & CTO', phone: '+919335699920', phoneDisplay: '+91 93356 99920', whatsapp: '919335699920', email: '' }
  ],
  primary: 0,
  location: 'Lucknow / Varanasi, Uttar Pradesh, India',
  hours: ['Monday – Saturday: 9:00 AM – 7:00 PM IST', 'Sunday: By appointment only'],
  // Leave '' until the real profile URL is supplied. The original site had href="#" placeholders.
  social: { instagram: '', linkedin: '', youtube: '', facebook: '', x: '' },
  // Netlify Forms handles submissions; see README. Notification e-mail is set in the Netlify UI.
  formName: 'nexa-enquiry'
};

export const primary = () => site.contacts[site.primary];
export const waLink = (text = '', idx = site.primary) =>
  `https://wa.me/${site.contacts[idx].whatsapp}` + (text ? `?text=${encodeURIComponent(text)}` : '');
export const mailLink = (subject = '', body = '') => {
  const e = primary().email;
  const q = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join('&');
  return `mailto:${e}${q ? '?' + q : ''}`;
};

export const categories = [
  { id: 'A', slug: 'programming-languages', name: 'Programming Languages', icon: '💻' },
  { id: 'B', slug: 'web-development', name: 'Web Development', icon: '🌐' },
  { id: 'C', slug: 'ai-ml-data', name: 'AI, ML & Data', icon: '🤖' },
  { id: 'D', slug: 'emerging-technologies', name: 'Emerging Technologies', icon: '🛡️' }
];
