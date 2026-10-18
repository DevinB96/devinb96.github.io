# Launch: hosting, forms, analytics and go-live

## Recommended setup

| Item | Recommendation | Owner |
| --- | --- | --- |
| Domain | Registered in the client's name (for example via Cloudflare Registrar), agency added as a member | Client |
| Hosting | Cloudflare Pages, free plan: global CDN, HTTPS, compression and one-click rollback | Agency account, client added |
| Source | A private GitHub repository for this project (copy `clients/karis-smart-cleaning/`) | Agency |
| Email | Google Workspace or Microsoft 365 on the client's domain (for example hello@...) | Client |
| Forms | FormSubmit (free) sending to the client's inbox | Client inbox |
| Analytics | Google Analytics 4 property owned by the client, agency as editor | Client |
| Search | Google Search Console domain property owned by the client, agency as full user | Client |

Ongoing costs to budget for: domain (around £10 to £15 a year), business email (from around £5 per user per month).
Hosting, forms, analytics and Search Console are free at this site's scale.

## Step by step

1. **Confirm content.** Work through [client-sign-off.md](client-sign-off.md). Add phone, email, opening hours and
   social links to `content/site.json`.
2. **Domain and email.** Register the domain in the client's name and set up business email.
3. **Form endpoint.** Submit any form once to `https://formsubmit.co/<client email>`. FormSubmit emails an activation
   link and then issues a private alias. Put `https://formsubmit.co/ajax/<alias>` in
   `environments.production.formEndpoint`. The alias keeps the email address out of the page source.
4. **Production settings.** In `content/site.json` set `environments.production.siteUrl` to the live URL with a
   trailing slash, for example `https://www.example.co.uk/`.
5. **Repository.** Create a private repo containing this folder. Keep `content/`, `src/`, `tools/`, `build.mjs`
   and `docs/`.
6. **Cloudflare Pages.** Create a project from the repo with build command `node build.mjs --env production` and
   output directory `dist`. Set the environment variable `NODE_VERSION` to `20`.
7. **Custom domain.** Add the apex and `www` in Pages; choose one as canonical (match `siteUrl`) and redirect the
   other with a Cloudflare redirect rule.
8. **Test on the live domain** (see the checklist below).
9. **Search Console.** Add a domain property (DNS TXT record), submit `sitemap.xml`, request indexing for the home page.
10. **Google Business Profile.** Link the website and quote page (see [strategy.md](strategy.md#6-local-seo-and-google-business-profile)).
11. **Retire the preview.** Delete `/karis-smart-cleaning/` from the agency's GitHub Pages site, or leave it
    `noindex`. Its canonical URLs point at the preview, so it must not stay indexable once the real site is live.

This is a new website with no previous URLs, so no redirects are needed. If the client later finds an old site or
listing URLs, map them to the new pages with Cloudflare redirect rules.

## Analytics and Search Console

Set `analytics.ga4MeasurementId` to the GA4 measurement ID (`G-XXXXXXX`) and rebuild. Behaviour:

- Nothing loads and no cookies are set until the visitor accepts (UK GDPR and PECR). Consent Mode v2 defaults are
  all denied.
- A consent banner appears on the first visit; "Cookie settings" in the footer reopens it.
- The cookie notice and privacy notice automatically list Google Analytics.

### Measurement plan

| Event | When it fires | Use |
| --- | --- | --- |
| `generate_lead` | Quote form sent successfully (`service` parameter) | **Primary conversion.** Mark as a key event in GA4 |
| `form_start` | First interaction with the quote form | Form drop-off rate |
| `quote_cta` | Any "Get a free quote" button (`cta_location`: header, hero, sticky, process, footer-band, service-hero, areas-hero) | Which calls to action work |
| `quick_quote_submit` | Home page quick quote "Continue" | Hero engagement |
| `phone_click` | Any tap-to-call link (once a number is set) | Secondary conversion, mark as key event |
| `email_click`, `whatsapp_click`, `facebook_click` | Contact links | Secondary conversions |

Report monthly in a Looker Studio dashboard combining GA4 (leads by source, landing page and service) and Search
Console (clicks, impressions, queries, pages). Do not report estimated traffic as measured results.

## Go-live checklist

- [ ] All items in [client-sign-off.md](client-sign-off.md) confirmed
- [ ] `node build.mjs --env production` and `node tools/check.mjs dist --external` pass with no problems
- [ ] Preview banner gone, pages say `index, follow`, `robots.txt` allows crawling and lists the sitemap
- [ ] A real quote request arrives in the client's inbox; the reply-to address is the customer's email
- [ ] The no-JavaScript fallback (`/quote/thank-you/`) works after a form post
- [ ] Phone links dial the right number on a phone
- [ ] Checked on iPhone Safari, Android Chrome, desktop Chrome, Safari, Firefox and Edge
- [ ] 3D section runs smoothly on a mid-range phone; reduced-motion setting shows the still images
- [ ] Rich Results Test passes for the home page and a service page
- [ ] PageSpeed Insights run for mobile and desktop and results recorded as the baseline
- [ ] GA4 consent banner works (if analytics is enabled) and `generate_lead` shows in DebugView
- [ ] Search Console verified and sitemap submitted
- [ ] Uptime monitor created (for example UptimeRobot, free)

## Backups, rollback and recovery

- **Code and content:** every change is a Git commit. The repository is the backup; GitHub keeps full history.
- **Deployments:** Cloudflare Pages keeps every deployment. To roll back, open the project, Deployments, choose the
  last good deployment and select "Rollback to this deployment". It takes effect in seconds.
- **Bad change in the repo:** `git revert <commit>` and push. Cloudflare rebuilds automatically.
- **Hosting outage:** the site is plain static files. Run `node build.mjs --env production` and upload `dist/` to
  any static host (GitHub Pages, Netlify), then repoint DNS.
- **Lost access:** the client owns the domain, email, GA4 and Search Console, so the site can always be rebuilt
  from the repository and moved.
