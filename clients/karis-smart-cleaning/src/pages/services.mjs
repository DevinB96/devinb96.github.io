import { esc, relLink, icons } from '../lib.mjs';
import { businessSchema } from '../layout.mjs';
import { picture, faqList, faqSchema, serviceCards, processSteps } from '../partials.mjs';

const yes = `<span class="cmp-yes">${icons.check}<span class="sr">Included</span></span>`;
const no = '<span class="cmp-no" aria-label="Not included">&ndash;</span>';
const req = '<span class="cmp-req">On request</span>';

function compareTable(page) {
  const L = (to) => relLink(page.path, to);
  const rows = [
    ['Best for', 'Keeping on top of things', 'A one-off reset', 'Moving out or in'],
    ['How often', 'Weekly, fortnightly or monthly', 'One-off', 'One-off'],
    ['Kitchen and bathroom surfaces', yes, yes, yes],
    ['Dusting, vacuuming and mopping', yes, yes, yes],
    ['Limescale, grout and sealant', no, yes, yes],
    ['Skirting boards, doors and frames', no, yes, yes],
    ['Behind and under movable furniture', no, yes, yes],
    ['Inside the oven and fridge', req, req, yes],
    ['Inside cupboards and wardrobes', no, req, yes],
  ];
  return `<div class="cmp-wrap rv">
  <table class="cmp">
    <caption class="sr">Comparison of regular, deep and end of tenancy cleaning</caption>
    <thead><tr><th scope="col"><span class="sr">Feature</span></th>
      <th scope="col"><a href="${L('services/regular-home-cleaning/')}">Regular clean</a></th>
      <th scope="col"><a href="${L('services/deep-cleaning/')}">Deep clean</a></th>
      <th scope="col"><a href="${L('services/end-of-tenancy-cleaning/')}">End of tenancy</a></th></tr></thead>
    <tbody>${rows.map(([h, ...c]) => `<tr><th scope="row">${h}</th>${c.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
</div>`;
}

export const hub = {
  path: 'services/',
  render(ctx) {
    const page = this;
    const body = `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Services</p>
    <h1 class="display rv">Cleaning services in <em>Guildford</em></h1>
    <p class="lead rv">Five services for homes and workplaces across Guildford, Godalming, Woking and the surrounding villages. Every one starts from a clear checklist that you can tailor.</p>
  </div>
</section>
<section class="section section-tight">
  <div class="wrap">${serviceCards(ctx, page, { feature: false })}</div>
</section>
<section class="section compare" aria-labelledby="cmp-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Which clean do I need?</p>
      <h2 id="cmp-h" class="display rv">Regular, deep or <em>end of tenancy?</em></h2>
      <p class="section-sub rv">A quick guide to how our home cleans differ. Not sure? Choose “Not sure yet” on the quote form and we will recommend one.</p>
    </div>
    ${compareTable(page)}
  </div>
</section>
<section class="section process" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">How it works</p><h2 id="how-h" class="display rv">Three steps to a <em>cleaner</em> week.</h2></div>
    ${processSteps()}
  </div>
</section>`;
    return {
      title: 'Cleaning Services in Guildford & Surrey | Karis Smart Cleaning',
      description: 'Regular, deep, end of tenancy, office and window cleaning in Guildford, Godalming, Woking and nearby villages. Compare services and get a free quote.',
      breadcrumbs: [{ name: 'Services', path: 'services/' }],
      body,
      schema: [businessSchema(ctx)],
    };
  },
};

export function servicePage(svc) {
  return {
    path: `services/${svc.slug}/`,
    render(ctx) {
      const page = this;
      const L = (to) => relLink(page.path, to);
      const { site, services, siteUrl } = ctx;
      const b = site.business;
      const related = svc.related.map((slug) => services.find((s) => s.slug === slug)).filter(Boolean);
      const areaNames = site.areas.map((a) => a.name);
      const body = `
<section class="svc-hero">
  <div class="wrap svc-hero-grid">
    <div class="svc-hero-copy">
      <p class="eyebrow">Service</p>
      <h1 class="display rv">${esc(svc.h1).replace(/ in (Guildford)$/, ' <em>in $1</em>')}</h1>
      <p class="lead rv">${esc(svc.lede)}</p>
      <div class="cta-row rv">
        <a class="btn btn-lg magnetic" href="${L(`quote/?service=${svc.slug}`)}" data-track="quote_cta" data-cta="service-hero">Get a free quote ${icons.arrow}</a>
        <a class="btn btn-lg btn-outline" href="#included">What is included</a>
      </div>
    </div>
    <div class="svc-hero-media rv">
      <div class="glint">${picture(page, svc.image, svc.imageAlt, { eager: true, sizes: '(min-width: 900px) 48vw, 100vw' })}</div>
      <p class="media-note mono">Illustration</p>
    </div>
  </div>
</section>

<section class="section section-tight">
  <div class="wrap svc-intro">
    <div class="prose rv">${svc.intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <aside class="ideal rv" aria-labelledby="ideal-h">
      <h2 id="ideal-h" class="mono">Ideal for</h2>
      <ul role="list">${svc.idealFor.map((x) => `<li>${icons.check}${esc(x)}</li>`).join('')}</ul>
    </aside>
  </div>
</section>

<section class="section included" id="included" aria-labelledby="inc-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">The checklist</p>
      <h2 id="inc-h" class="display rv">What is <em>included</em></h2>
      <p class="section-sub rv">Our standard checklist for ${esc(svc.name.toLowerCase())}. Add or remove tasks when you request a quote.</p>
    </div>
    <div class="inc-grid">
      ${svc.includes.map((g, i) => `<div class="inc-card rv" style="--d:${i * 80}ms"><h3>${esc(g.group)}</h3><ul class="checklist" role="list">${g.items.map((it) => `<li>${icons.check}<span>${esc(it)}</span></li>`).join('')}</ul></div>`).join('\n      ')}
    </div>
    ${svc.extras?.length ? `<div class="extras rv"><h3 class="mono">Popular extras</h3><ul role="list">${svc.extras.map((x) => `<li>${icons.plus}${esc(x)}</li>`).join('')}</ul></div>` : ''}
  </div>
</section>

<section class="section process" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">How it works</p><h2 id="how-h" class="display rv">From quote to <em>clean.</em></h2></div>
    ${processSteps()}
  </div>
</section>

<section class="section section-tight svc-areas" aria-labelledby="svc-areas-h">
  <div class="wrap svc-areas-inner rv">
    <h2 id="svc-areas-h" class="mono">Available in</h2>
    <ul class="area-chips" role="list">${site.areas.map((a) => `<li><a href="${L(`areas/#${a.slug}`)}">${icons.pin}${esc(a.name)}</a></li>`).join('')}</ul>
  </div>
</section>

<section class="section faq-sec" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div>
      <p class="eyebrow">Questions</p>
      <h2 id="faq-h" class="display rv">${esc(svc.name)}: <em>your questions</em></h2>
    </div>
    ${faqList(svc.faqs)}
  </div>
</section>

<section class="section related" aria-labelledby="rel-h">
  <div class="wrap">
    <h2 id="rel-h" class="display display-sm rv">Often booked <em>with</em></h2>
    <ul class="rel-grid" role="list">${related.map((r) => `<li class="rv"><a class="rel-card" href="${L(`services/${r.slug}/`)}"><div class="rel-media">${picture(page, r.image, r.imageAlt, { sizes: '(min-width: 900px) 40vw, 100vw' })}</div><div><h3>${esc(r.name)}</h3><p>${esc(r.short)}</p><span class="svc-more">Explore ${icons.arrow}</span></div></a></li>`).join('')}</ul>
  </div>
</section>`;
      return {
        title: svc.seoTitle,
        description: svc.metaDescription,
        breadcrumbs: [{ name: 'Services', path: 'services/' }, { name: svc.name, path: page.path }],
        ogImage: `${svc.image}-og.jpg`,
        body,
        schema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${siteUrl}${page.path}#service`,
            name: svc.name,
            serviceType: svc.name,
            description: svc.metaDescription,
            url: siteUrl + page.path,
            provider: { '@id': siteUrl + '#business' },
            areaServed: areaNames.map((n) => ({ '@type': 'Place', name: `${n}, ${b.county}` })),
          },
          businessSchema(ctx),
          faqSchema(svc.faqs),
        ],
      };
    },
  };
}
