# Strategy: research, creative direction and SEO

Prepared October 2026. This document separates **verified facts** from **assumptions**. Anything marked as an
assumption is in [client-sign-off.md](client-sign-off.md) for Karis Smart Cleaning to confirm.

## 1. Research

### Verified (public sources)

| Fact | Source |
| --- | --- |
| Registered name: KARIS SMART CLEANING SERVICES LTD, company number 15459605, active private limited company | Companies House register |
| Incorporated 1 February 2024 (originally as another name; changed to the current name in August 2024) | Companies House, via North Data and Endole |
| Registered office: 2 Hillside Court, Harvey Road, Guildford, England, GU1 3NA | Companies House |
| SIC codes: 81210 general cleaning of buildings, 81221 window cleaning, 81222 specialised cleaning, 81299 other cleaning | Companies House |
| Facebook page "Karis smart cleaning service", Guildford, listing Guildford, Woking, Wonersh, Shalford, Cranleigh, Bramley and Godalming as areas covered | facebook.com/p/Karis-smart-cleaning-service-100077431834450 |

The research tools for this project could read search results but could not open Companies House or Facebook
directly, so the details above should be checked against the live pages before launch.

### Not found

No website, Google Business Profile, phone number, email address, opening hours, prices, reviews or photographs
could be found. The site is built so that each of these appears automatically once added to `content/site.json`,
and nothing is invented in the meantime.

### Assumptions used in the build

- The five services follow the company's registered activities: regular home cleaning, deep cleaning, end of
  tenancy cleaning, office and commercial cleaning, and window cleaning.
- Frequencies (weekly, fortnightly, monthly), checklists and "popular extras" reflect normal practice for UK
  domestic cleaners and need confirming.
- Quotes are free and given in writing before work is booked.

## 2. Positioning

**A local, accountable cleaner that agrees exactly what will be done, then does it properly.**

The Guildford market is crowded with franchises and national platforms that sell on price and availability. A
small local company cannot win on scale, so the site sells clarity and care instead:

- **The checklist is the product.** Every service page, and the 3D walkthrough, shows precisely what is
  included. This answers the biggest unspoken worry when hiring a cleaner ("what will they actually do?").
- **Local and verifiable.** Company details on every page and a link to the Companies House record build
  trust honestly, without unverified badges.
- **Calm, premium, not clinical.** Warm linen, deep spruce and a citrus accent: a home that feels looked after,
  rather than the blue bubbles and sparkles typical of the category.

**Audience:** busy households and professionals across Guildford and the surrounding villages (often time-poor,
quality-conscious, willing to pay for reliability); tenants, landlords and letting agents (including student lets
around the University of Surrey); small offices and studios.

**Primary conversion:** a quote request. Secondary: phone call (once a number is added), Facebook message.

## 3. Creative direction

| Element | Choice | Why |
| --- | --- | --- |
| Display type | Instrument Serif | Elegant, editorial and calm; distinctive in a category full of rounded sans-serifs |
| Text type | Hanken Grotesk (variable) | Clear, friendly, very readable at small sizes |
| Primary | Spruce `#17352f` | Trust and quality, connected to the Surrey Hills landscape |
| Secondary | Sage `#8fa99b` | Fresh and soft |
| Accent | Citrus `#e7cf63` | A clean, lemon-fresh highlight used sparingly (calls to action, labels) |
| Background | Linen `#f5f1ea`, Paper `#fbfaf7`, Mist `#ebeee9` | Warm and domestic rather than clinical white |

**Hero:** morning sun falling through a window onto a linen wall and floor, leaves moving outside, and a single
sweep of light when the page opens, like a squeegee pass on glass. It conveys "come home to clean" without stock
photography, loads after the headline, and pauses when off screen.

**Signature experience, "Lift the roof":** a 3D architectural model of a home assembles as you scroll (an exploded
view coming together), the roof lifts away, and the camera visits each room while the walls drop and labels mark
what is cleaned. Switching between regular, deep and end of tenancy cleans changes the checklist, and the end of
tenancy view empties the furniture and adds moving boxes. It is the exploded-view technique adapted to a service
business: it explains the offer, rather than decorating it.

**Imagery:** every image is rendered from the same model, so the visual language is consistent and honest.
Nothing implies a photograph of a real job. Recommended next step: a half-day shoot of the team at work, kit,
and before-and-after details, to add alongside (not instead of) the illustrations.

## 4. Information architecture and keyword map

No keyword volume tool was available for this project, so the map is built on search intent and should be
validated in Google Keyword Planner and, after launch, Search Console.

| Page | URL | Primary query | Supporting queries |
| --- | --- | --- | --- |
| Home | `/` | cleaners Guildford | cleaning company Guildford, cleaning services Guildford |
| Services hub | `/services/` | cleaning services Guildford | which type of clean do I need |
| Regular | `/services/regular-home-cleaning/` | house cleaning Guildford | domestic cleaners Guildford, weekly / fortnightly cleaner |
| Deep | `/services/deep-cleaning/` | deep cleaning Guildford | one-off clean, spring clean Guildford |
| End of tenancy | `/services/end-of-tenancy-cleaning/` | end of tenancy cleaning Guildford | move out clean Guildford, student house cleaning Guildford |
| Office | `/services/office-cleaning/` | office cleaning Guildford | commercial cleaners Guildford, office cleaners Woking |
| Windows | `/services/window-cleaning/` | window cleaning Guildford | window cleaner Godalming |
| Areas | `/areas/` | cleaners Godalming, cleaners Woking, cleaners Cranleigh | cleaners Bramley, Shalford, Wonersh |
| Quote | `/quote/` | cleaning quote Guildford | |

Each page targets one intent, so pages do not compete with each other. Separate town pages (for example
"cleaners Woking") should only be added once there is genuinely local content for them: real jobs, reviews and
photos from that town. Thin copies of the same page with the town name swapped are doorway pages and can harm
rankings.

## 5. On-page and technical SEO (implemented)

- Unique title (under 60 characters where possible) and meta description (under 160) on every page.
- One `<h1>` per page and a logical heading structure; descriptive URLs; breadcrumbs with `BreadcrumbList` data.
- Static HTML: all content, including the 3D checklists, is in the page source and readable without JavaScript.
- Canonical tags, `sitemap.xml`, `robots.txt` and a custom 404, all generated from one site URL setting.
- Structured data: `LocalBusiness` (service-area business with areas served, Companies House identifier, Facebook
  profile, offer catalogue), `Service` on each service page, `FAQPage`, `WebSite` and `BreadcrumbList`.
- Open Graph and Twitter cards with a 1200 x 630 image for every service.
- Internal links: header services menu, service cards, "often booked with", area chips and footer.
- Performance: self-hosted fonts with preload, responsive WebP images with fixed dimensions (no layout shift),
  lazy loading, the hero shader deferred until after load, and three.js only loaded near the 3D section on
  capable devices. Lab results on the production build (Lighthouse, mobile): Accessibility 100, Best Practices
  100 and SEO 100 on the home page, Performance 97 to 98 on inner pages, cumulative layout shift 0. The home page
  scored 79 for Performance in a test environment that renders WebGL in software; real devices with a GPU should
  do better, but confirm with field data in Search Console once live.

## 6. Local SEO and Google Business Profile

No Google Business Profile was found. Recommended (owner's authorisation required for every change):

1. **Create or claim the profile** as a service-area business with the address hidden, since the registered
   office is not a customer-facing premises.
2. **Categories:** primary "House cleaning service"; secondary as offered: "Commercial cleaning service",
   "Window cleaning service". Pick from the options Google offers in the profile editor.
3. **Service areas:** Guildford, Godalming, Woking, Shalford, Bramley, Wonersh, Cranleigh (matching the website).
4. **Name, phone and website** exactly as on the website. Link the website home page; use the quote page as the
   appointment link.
5. **Services:** add the five services with the same names and short descriptions as the website.
6. **Photos:** real team, van or kit, and before-and-after shots (with customers' permission). Add a few each month.
7. **Reviews:** after each completed job, send the "leave a review" link. Never incentivise or write reviews, and
   reply to every review. Add genuine reviews to the website's `testimonials` list with permission.
8. **Consistency:** make Facebook, Yell, Bark, Checkatrade or any other listing match the same details.

Google Maps rankings cannot be guaranteed; they depend mainly on distance, relevance and prominence (reviews,
links and activity).
