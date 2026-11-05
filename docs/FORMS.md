# Enquiry forms – Netlify setup

All five forms are **Netlify Forms** on `/contact/` (no extra service, no secrets). Netlify detects them from the built HTML on each deploy.

| Tab | Form name (Netlify) | Notes |
|---|---|---|
| Course | `nexa-enquiry` | **Original form name kept**, so your existing submission history stays continuous |
| Institution | `nexa-institution-enquiry` | New |
| Internship | `nexa-internship-enquiry` | New |
| Workshop | `nexa-workshop-enquiry` | New |
| Software | `nexa-software-enquiry` | New |

## After the first deploy of this version
1. Netlify dashboard → your site → **Forms**: confirm all five forms are listed (the four new ones appear after the first successful deploy).
2. **Forms → Form notifications**: add an e-mail notification for **each of the four new forms**. Notifications are configured per form, so the existing one will not cover them.
3. Check your plan's monthly form-submission limit (Netlify → Billing / Usage).
4. Submit one test enquiry from each tab and confirm it arrives. Delete test submissions afterwards.

## Behaviour
- Honeypot field `bot-field` plus a required consent checkbox on every form.
- JavaScript validates and submits with `fetch`; without JavaScript the form posts normally to `/contact/success/`.
- On failure the form says the message was **not** sent and offers a pre-filled WhatsApp fallback.
- Deep links: `?course=<slug>`, `?topic=<old topic>` and `?enquiry=institution|internship|workshop|software|course` open the matching tab.
