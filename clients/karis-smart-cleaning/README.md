# Karis Smart Cleaning website

Marketing website for **Karis Smart Cleaning Services Ltd**, a cleaning company in Guildford, Surrey
(Companies House 15459605). Built by Brooks Process Solutions.

- **Preview:** <https://devinb96.github.io/karis-smart-cleaning/> (live once this branch is merged to `main`).
  The preview is `noindex`, shows a preview banner, and sends quote requests to the agency's inbox.
- **Production:** not deployed yet. See [docs/launch.md](docs/launch.md).

## What is in the site

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | Cinematic hero, quick quote, services, the 3D "Inside the clean" walkthrough, process, areas map, FAQs |
| Services | `/services/` | All services and a regular / deep / end of tenancy comparison table |
| Service pages (5) | `/services/<slug>/` | Regular, deep, end of tenancy, office and window cleaning: checklist, extras, FAQs |
| Areas we cover | `/areas/` | Map and a short section for each of the 7 towns and villages (no doorway pages) |
| About | `/about/` | How the company works, and its Companies House details |
| Get a quote | `/quote/` | The main conversion: a three-part quote form |
| Thank you | `/quote/thank-you/` | Shown after a no-JavaScript form submission (noindex) |
| Privacy, Cookies | `/privacy/`, `/cookies/` | UK GDPR privacy notice and cookie notice |
| 404 | `/404.html` | Not-found page (used by the production host) |

Signature features:

- **Hero light** (`src/assets/js/hero-light.js`): a single WebGL shader of morning sun through a window,
  with leaf shadows and one "squeegee" sweep of light on load. Falls back to a static CSS version.
- **Inside the clean** (`src/assets/js/maquette.js`): a procedural Three.js architectural model of a home.
  Scrolling assembles it (exploded view), lifts the roof, then visits each room while the walls in front drop
  away and labels mark what gets cleaned. A switch shows a regular, deep or end of tenancy clean (the
  furniture clears and moving boxes appear for end of tenancy). All checklist content is plain HTML, so it
  works and is indexable without WebGL; reduced-motion and low-data visitors see still renders instead.
- **Still images** are rendered from the same 3D model (`tools/render.mjs`), so the art direction is
  consistent and nothing is passed off as a photo of a real job. Each is labelled as an illustration.

## Folder layout

```
clients/karis-smart-cleaning/
  build.mjs            static site generator (no dependencies)
  content/             everything editable: business details, services, FAQs, areas, room checklists
  src/layout.mjs       head, header, footer, structured data
  src/partials.mjs     shared sections (service cards, map, FAQs, process)
  src/pages/           page templates
  src/assets/          CSS, JavaScript, fonts (self-hosted), images, vendored three.js r169
  tools/render.mjs     renders the still images, social cards and icons from the 3D model
  tools/check.mjs      link, anchor, heading, metadata and JSON-LD checker
  docs/                strategy, launch, maintenance and sign-off documents
karis-smart-cleaning/  the built preview (generated; do not edit by hand)
```

## Common tasks

Requires Node 18 or later. There is nothing to install for the build itself.

```bash
cd clients/karis-smart-cleaning

node build.mjs                    # rebuild the preview into ../../karis-smart-cleaning
node tools/check.mjs              # check the preview build
node build.mjs --env production   # launch build into ./dist (set siteUrl and formEndpoint first)
node tools/check.mjs dist --external
node tools/render.mjs             # re-render all images (needs Playwright + Chromium)
node tools/render.mjs svc-deep    # re-render one image and its social card
```

### Editing content

Edit the JSON in `content/`, then rebuild. Empty values are hidden on the site, never shown as placeholders.

- `content/site.json`: business details, phone, email, WhatsApp, opening hours, Google Business Profile
  and review links, areas, home page FAQs, testimonials, analytics ID, and the preview/production settings.
  - Add a phone number and every page gains tap-to-call buttons (header, footer, sticky mobile bar, quote page)
    and the number is added to the structured data.
  - Add testimonials as `{ "quote": "...", "name": "...", "area": "Godalming", "source": "Google" }` and a reviews
    section appears on the home page. Only use genuine reviews, with the customer's permission.
  - Opening hours use schema.org `OpeningHoursSpecification` objects.
- `content/services.json`: each service's name, SEO title and description, intro, checklist, extras and FAQs.
- `content/rooms.json`: the room-by-room checklist in the 3D section. `hotspot` names a label anchor in
  `maquette.js` (`worktop`, `hob`, `sink`, `hood`, `fridge`, `bath`, `mirror`, `basin`, `shelf`, `rug`, `sofa`,
  `window`, `bed`, `bedside`, `wardrobe`).

### Analytics

Set `analytics.ga4MeasurementId` in `content/site.json`. A consent banner then appears, Google Analytics loads
only after "Accept", and the cookie notice and privacy notice update automatically. See
[docs/launch.md](docs/launch.md#analytics-and-search-console) for the events that are tracked.

## Documents

- [docs/strategy.md](docs/strategy.md): research, positioning, creative direction, keyword map, local SEO and Google Business Profile plan
- [docs/launch.md](docs/launch.md): hosting, domain, forms, analytics, Search Console, go-live checklist and rollback
- [docs/maintenance.md](docs/maintenance.md): monthly maintenance routine, service boundaries and SEO packages
- [docs/client-sign-off.md](docs/client-sign-off.md): facts and copy that Karis Smart Cleaning must confirm before launch

## Licences

three.js (MIT, `src/assets/vendor/three.LICENSE.txt`). Instrument Serif and Hanken Grotesk (SIL Open Font
Licence, `src/assets/fonts/*-OFL.txt`). All imagery is rendered from the project's own 3D model.
