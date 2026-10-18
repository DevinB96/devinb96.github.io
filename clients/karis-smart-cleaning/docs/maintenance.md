# Maintenance and SEO services

## Care plan (template for the agreement)

Starting fee: 10% of the build price per month, adjusted to the agreed scope. Fill in the bracketed values per client.

| Included | Detail |
| --- | --- |
| Hosting management | Cloudflare Pages project, DNS, HTTPS and uptime monitoring |
| Updates | Security and library updates (three.js, fonts), browser compatibility fixes |
| Monthly checks | The routine below, with a short written report |
| Content edits | Up to [3] minor edits a month (text, prices, FAQs, opening hours, a testimonial, an image); unused edits do not roll over |
| Response times | Site down: same working day. Broken form or contact details: within [1] working day. Edits: within [3] working days |
| Support channel | Email to [agency address]; urgent issues by phone |
| Backups | Continuous via Git history and Cloudflare deployment history; restore tested quarterly |

Not included (quoted separately at [£ per hour or day]): redesigns, new page types or features, new 3D scenes,
photography, copywriting for new pages, SEO packages (below), third-party subscriptions (domain, email, paid tools).

**Ownership and cancellation.** The client owns the domain, business email, Google Analytics, Search Console and
Google Business Profile. Either side can end the plan with [30] days' notice; on cancellation the agency hands over
the repository, a production build and access to every account.

## Monthly routine

Run on the first working day of each month and record the results in the report.

1. **Uptime and hosting.** Review the uptime monitor; confirm the domain and SSL certificate are not close to expiry.
2. **Updates.** Check for three.js security advisories. The site has no npm runtime dependencies.
3. **Backups.** Confirm the latest deployment matches the latest commit. Each quarter, test a rollback.
4. **Broken links.** `node build.mjs --env production && node tools/check.mjs dist --external`
5. **Forms.** Send a test quote request and confirm it arrives in the client's inbox.
6. **Calls to action.** Tap-to-call, email, WhatsApp, Facebook and booking links work.
7. **Mobile.** Spot-check the home page, a service page and the quote form on a real phone.
8. **Speed.** PageSpeed Insights for the home page and one service page (mobile). Note LCP, INP and CLS from field
   data once available; investigate anything outside LCP 2.5s, INP 200ms, CLS 0.1.
9. **Search Console.** Indexing issues, Core Web Vitals report, manual actions, security issues.
10. **Content.** Make the agreed edits, then rebuild and run the checker.
11. **Google Business Profile** (if in scope). Profile details still match the site; new reviews answered.
12. **Report.** Send the monthly report (template below).

## SEO packages (optional, priced separately)

| Package | Includes |
| --- | --- |
| Local SEO | Google Business Profile support and posts, review-request process, local keyword tracking for the 7 areas, service-page improvements, local competitor review |
| SEO Growth | Everything in Local, plus keyword research, one new piece of helpful content or service improvement a month, internal linking, quarterly technical audit, conversion improvements |
| Reporting only | Monthly dashboard and commentary, no implementation |

Content ideas that suit this business (only where genuinely useful): an end of tenancy checklist for Guildford
student lets, "what a deep clean includes", "how often should windows be cleaned", and real before-and-after
project write-ups by town. Never guarantee first-page rankings or a number of leads.

## Monthly report template

```
Karis Smart Cleaning: website report, [Month Year]

Summary: [two sentences on what happened and what matters]

Leads
- Quote requests (generate_lead): [n] (last month [n])
- Calls from the website (phone_click): [n]
- Top lead sources: [organic / Google Business Profile / direct / social]

Search (Google Search Console)
- Clicks: [n]   Impressions: [n]   Average position: [n]
- Top queries: [query, clicks]
- Top pages: [page, clicks]

Health
- Uptime: [99.x%]   Broken links: [0]   Form test: [passed on date]
- Core Web Vitals (mobile, field data): LCP [ ] INP [ ] CLS [ ]

Work completed
- [edits, fixes, updates]

Recommendations for next month
- [1 to 3 specific actions]
```
