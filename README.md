# Brooks Process Solutions website

Static site for Brooks Process Solutions, served by GitHub Pages from `main`.

The current site sells one package to trades and home improvement firms: **Never Miss an Enquiry**
(instant enquiry replies, missed-call text back, quote follow-up, review requests and a Google
Business Profile tidy-up).

## Files

- `index.html`: the home page (the trades package)
- `assets/styles.css`: shared styles (the theme)
- `assets/sector.css`: extra components (workflow rows, tool chips) used by the home page
- `assets/site.js`: home page interactions: menu, missed-jobs calculator, contact form and Cal.com booking
- `websites.html`: website build offer for any local business (build fee plus monthly care plan; prices given on calls, not on the page)
- `results.html`, `assets/results.*`: example client results dashboard
- `app.html`, `assets/app.*`: **Quote to Invoice**, the app for trades firms (see below)
- `view.html`, `assets/view.*`: the customer's copy of a quote or invoice, opened from a link the app sends
- `assets/q2i.js`: helpers shared by the app and the customer page (money, dates, FAQ matching, link format)
- `privacy.html`: privacy policy, linked from the forms and the footer
- `trades.html`, `professional-services.html`: redirects to the home page (old links keep working)
- `404.html`: not-found page
- `archive/consultancy-v1/`: archived copy of the earlier AI consultancy site (Audit, Sprint, Partner),
  hidden from search engines. It still runs on `assets/main.js`.

## Settings in `assets/site.js`

| Setting | What it does |
| --- | --- |
| `CONTACT_EMAIL` | Where enquiries go, and the address in the "email us directly" fallback |
| `FORM_ENDPOINT` | FormSubmit endpoint, using the private alias so the email address isn't in the page |
| `MAKE_WEBHOOK` | Make webhook that copies every enquiry into HubSpot |
| `BOOKING_URL` | Cal.com link embedded in the booking section |

`assets/main.js` has its own copy of these settings for the archived site. Change both if any of them change.

## Quote to Invoice (`app.html`)

A phone-friendly app that takes a trades job from quote to paid:

1. **Quote**: line items, VAT, deposit and notes. The customer gets a link to a clean quote they can
   accept by WhatsApp, text or email, with common questions answered underneath.
2. **Follow up**: chasers on day 3, 7 and 14 (editable) appear on the Today list until the customer
   replies, accepts or the quote is marked lost.
3. **Book**: start date, times and days on site. Sends the confirmation (with a deposit request if
   one is due), adds it to Google, Apple or Outlook calendars, and offers a day-before reminder and an
   "on my way" text.
4. **Invoice**: the quote becomes an invoice in one tap, with room for extras. The customer's link
   shows bank details and an optional card payment link. Payment reminders come up on the due date,
   then weekly.
5. **FAQs**: paste a customer's question and the app finds the matching saved answers and writes the
   reply. Ticked FAQs also appear on quotes and invoices.

How it works:

- Data is saved in the browser on that device only (localStorage). Settings has a backup download and
  restore. Nothing is sent to a server.
- The app never sends messages itself. It writes each one and opens the trader's own WhatsApp,
  messages or email app, so every message is checked before it goes. Tapping a channel logs it as sent,
  with Undo.
- Quotes and invoices travel inside the link (`view.html#...`, compressed), so customers need no
  account and no server stores them. Anyone with the link can see that document.
- "Load example jobs" in Settings (or on first run) fills the app with a demo electrician's jobs at
  every stage.
