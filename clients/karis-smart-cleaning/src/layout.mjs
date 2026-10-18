// Page shell: <head>, header, footer and the structured data every page shares.
import { esc, join, relLink, jsonLd, telHref, waHref, icons, logoMark } from './lib.mjs';

export function businessSchema(ctx) {
  const { site, services, siteUrl } = ctx;
  const b = site.business;
  const sameAs = [b.social?.facebook, b.googleBusinessProfileUrl].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': siteUrl + '#business',
    name: b.name,
    legalName: b.legalName,
    url: siteUrl,
    logo: siteUrl + 'assets/img/logo-512.png',
    image: siteUrl + 'assets/img/og-default.jpg',
    description: 'Home and office cleaning in Guildford, Godalming, Woking and the surrounding Surrey villages: regular, deep, end of tenancy, office and window cleaning.',
    ...(b.phone && { telephone: b.phone }),
    ...(b.email && { email: b.email }),
    address: { '@type': 'PostalAddress', addressLocality: b.baseTown, addressRegion: b.county, addressCountry: 'GB' },
    areaServed: site.areas.map((a) => ({ '@type': 'Place', name: `${a.name}, ${b.county}` })),
    identifier: { '@type': 'PropertyValue', propertyID: 'Companies House company number', value: b.companyNumber },
    ...(sameAs.length && { sameAs }),
    ...(b.openingHours?.length && { openingHoursSpecification: b.openingHours }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cleaning services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: `${siteUrl}services/${s.slug}/` },
      })),
    },
  };
}

function breadcrumbSchema(ctx, crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: ctx.siteUrl + c.path })),
  };
}

function head(ctx, page) {
  const { siteUrl, env, asset } = ctx;
  const canonical = siteUrl + page.path;
  const ogImage = siteUrl + 'assets/img/' + (page.ogImage || 'og-default.jpg');
  const L = (to) => relLink(page.linkFrom || page.path, to);
  const robots = env.noindex || page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
${page.noCanonical ? '' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta name="theme-color" content="#f5f1ea">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_GB">
<meta property="og:site_name" content="${esc(ctx.site.business.name)}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${L(asset('img/favicon.svg'))}" type="image/svg+xml">
<link rel="icon" href="${L('assets/img/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${L('assets/img/apple-touch-icon.png')}">
<link rel="manifest" href="${L('site.webmanifest')}">
<link rel="preload" href="${L('assets/fonts/instrument-serif-latin-400-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${L('assets/fonts/hanken-grotesk-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${L(asset('css/site.css'))}">
${page.preload || ''}
<script>document.documentElement.classList.add('js')</script>
${(page.schema || []).map(jsonLd).join('\n')}
</head>`;
}

function header(ctx, page) {
  const { site, services, env } = ctx;
  const b = site.business;
  const L = (to) => relLink(page.linkFrom || page.path, to);
  const cur = (p) => (page.path === p || (p && page.path.startsWith(p)) ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">Skip to content</a>
${env.banner ? `<div class="preview-bar" role="note"><p>${esc(env.banner)}</p></div>` : ''}
<header class="hdr" id="hdr">
  <div class="wrap hdr-bar">
    <a class="brand" href="${L('')}">${logoMark}<span class="brand-word">Karis <small>Smart Cleaning</small></span></a>
    <nav class="nav" id="nav" aria-label="Main">
      <ul class="nav-list">
        <li class="has-sub">
          <a href="${L('services/')}"${cur('services/')}>Services</a>
          <button class="sub-btn" type="button" aria-expanded="false" aria-controls="sub-services"><span class="sr">Show services</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <div class="sub" id="sub-services">
            <ul>
              ${services.map((s) => `<li><a href="${L(`services/${s.slug}/`)}"${cur(`services/${s.slug}/`)}><strong>${esc(s.name)}</strong><span>${esc(s.short)}</span></a></li>`).join('\n              ')}
            </ul>
          </div>
        </li>
        <li><a href="${L('areas/')}"${cur('areas/')}>Areas we cover</a></li>
        <li><a href="${L('about/')}"${cur('about/')}>About</a></li>
      </ul>
      <div class="nav-actions">
        ${b.phone ? `<a class="nav-phone" href="${telHref(b.phone)}" data-track="phone_click">${icons.phone}<span>${esc(b.phoneDisplay || b.phone)}</span></a>` : ''}
        <a class="btn btn-sm" href="${L('quote/')}" data-track="quote_cta" data-cta="header">Get a free quote</a>
      </div>
    </nav>
    <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="nav"><span class="sr">Menu</span><i></i><i></i></button>
  </div>
</header>`;
}

function crumbsHtml(page) {
  if (!page.breadcrumbs) return '';
  const L = (to) => relLink(page.linkFrom || page.path, to);
  const items = page.breadcrumbs.map((c, i, all) =>
    i === all.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${L(c.path)}">${esc(c.name)}</a></li>`);
  return `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${items.join('')}</ol></nav>`;
}

function footer(ctx, page) {
  const { site, services, buildYear } = ctx;
  const b = site.business;
  const L = (to) => relLink(page.linkFrom || page.path, to);
  const contact = join([
    b.phone && `<li><a href="${telHref(b.phone)}" data-track="phone_click">${icons.phone}${esc(b.phoneDisplay || b.phone)}</a></li>`,
    b.email && `<li><a href="mailto:${esc(b.email)}" data-track="email_click">${icons.mail}${esc(b.email)}</a></li>`,
    b.whatsapp && `<li><a href="${waHref(b.whatsapp)}" rel="noopener" data-track="whatsapp_click">${icons.whatsapp}WhatsApp</a></li>`,
    b.social?.facebook && `<li><a href="${esc(b.social.facebook)}" rel="noopener" data-track="facebook_click">${icons.facebook}Facebook</a></li>`,
    `<li><a href="${L('quote/')}">${icons.arrow}Request a quote online</a></li>`,
  ]);
  const band = page.hideCtaBand ? '' : `
<section class="cta-band" aria-labelledby="cta-band-h">
  <div class="cta-band-light" aria-hidden="true"></div>
  <div class="wrap cta-band-inner">
    <p class="eyebrow">Free, no-obligation quote</p>
    <h2 id="cta-band-h" class="display">Ready for a <em>cleaner,</em> calmer week?</h2>
    <p class="cta-band-copy">Tell us about your home or workplace in a couple of minutes. We will reply with a clear quote and exactly what is included.</p>
    <div class="cta-row">
      <a class="btn btn-lg btn-citrus magnetic" href="${L('quote/')}" data-track="quote_cta" data-cta="footer-band">Get a free quote ${icons.arrow}</a>
      ${b.phone ? `<a class="btn btn-lg btn-ghost-light" href="${telHref(b.phone)}" data-track="phone_click">${icons.phone}Call ${esc(b.phoneDisplay || b.phone)}</a>` : ''}
    </div>
  </div>
</section>`;
  return `${band}
<footer class="ftr">
  <div class="wrap ftr-grid">
    <div class="ftr-brand">
      <a class="brand brand-light" href="${L('')}">${logoMark}<span class="brand-word">Karis <small>Smart Cleaning</small></span></a>
      <p>Home and office cleaning in ${esc(b.baseTown)} and the surrounding ${esc(b.county)} villages.</p>
    </div>
    <div>
      <h2 class="ftr-h">Services</h2>
      <ul>${services.map((s) => `<li><a href="${L(`services/${s.slug}/`)}">${esc(s.name)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="ftr-h">Areas we cover</h2>
      <ul>${site.areas.map((a) => `<li><a href="${L(`areas/#${a.slug}`)}">${esc(a.name)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="ftr-h">Get in touch</h2>
      <ul class="ftr-contact">${contact}</ul>
      <h2 class="ftr-h ftr-h-sub">Company</h2>
      <ul>
        <li><a href="${L('about/')}">About us</a></li>
        <li><a href="${L('privacy/')}">Privacy notice</a></li>
        <li><a href="${L('cookies/')}">Cookies</a></li>
        ${site.analytics.ga4MeasurementId ? '<li><button class="linklike" type="button" data-consent-open>Cookie settings</button></li>' : ''}
      </ul>
    </div>
  </div>
  <div class="wrap ftr-legal">
    <p>${esc(b.legalName)} is a private limited company registered in ${esc(b.registeredIn)}, company number ${esc(b.companyNumber)}. Registered office: ${esc(b.registeredOffice)}.</p>
    <p>&copy; ${buildYear} ${esc(b.legalName)}${site.credit?.label ? ` <span aria-hidden="true">&middot;</span> <a href="${esc(site.credit.url)}" rel="noopener">${esc(site.credit.label)}</a>` : ''}</p>
  </div>
</footer>
${page.hideStickyCta ? '' : `<div class="sticky-cta" id="stickyCta">
  <a class="btn btn-block" href="${L('quote/')}" data-track="quote_cta" data-cta="sticky">Get a free quote</a>
  ${b.phone ? `<a class="btn btn-icon btn-outline" href="${telHref(b.phone)}" data-track="phone_click" aria-label="Call ${esc(b.name)}">${icons.phone}</a>` : ''}
</div>`}`;
}

export function render(ctx, page) {
  const { site, env, asset } = ctx;
  const L = (to) => relLink(page.linkFrom || page.path, to);
  const crumbs = page.breadcrumbs ? [{ name: 'Home', path: '' }, ...page.breadcrumbs] : null;
  const schema = [...(page.schema || [])];
  if (crumbs) schema.push(breadcrumbSchema(ctx, crumbs));
  const pageFull = { ...page, schema, breadcrumbs: crumbs };
  const config = {
    base: L(''),
    assets: L('assets/'),
    modules: { hero: L(asset('js/hero-light.js')), maquette: L(asset('js/maquette.js')), quote: L(asset('js/quote-form.js')) },
    form: { endpoint: env.formEndpoint, subject: site.forms.subject + (env.formSubjectSuffix || '') },
    ga4: site.analytics.ga4MeasurementId,
    email: site.business.email,
    facebook: site.business.social?.facebook || '',
  };
  return `${head(ctx, pageFull)}
<body class="${esc(page.bodyClass || '')}">
${header(ctx, pageFull)}
<main id="main">
${crumbsHtml(pageFull)}
${page.body}
</main>
${footer(ctx, pageFull)}
<script type="application/json" id="karis-config">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>
<script type="module" src="${L(asset('js/main.js'))}"></script>
${page.scripts || ''}
</body>
</html>
`;
}
