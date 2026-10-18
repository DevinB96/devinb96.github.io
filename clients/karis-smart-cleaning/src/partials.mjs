// Reusable page sections.
import { esc, relLink, icons, miles } from './lib.mjs';

// Responsive render: <name>-800.webp and <name>-1600.webp exist for every image.
export function picture(page, name, alt, { sizes = '(min-width: 900px) 50vw, 100vw', eager = false, cls = '' } = {}) {
  const L = (to) => relLink(page.path, to);
  const src = (w) => L(`assets/img/${name}-${w}.webp`);
  return `<img class="${cls}" src="${src(800)}" srcset="${src(800)} 800w, ${src(1600)} 1600w" sizes="${sizes}" width="1600" height="1200" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

export function faqList(faqs, id = 'faq-list') {
  return `<div class="faq" id="${id}">
  ${faqs.map((f) => `<details class="faq-item">
    <summary><h3>${esc(f.q)}</h3><span class="faq-icon" aria-hidden="true">${icons.plus}</span></summary>
    <div class="faq-a"><p>${esc(f.a)}</p></div>
  </details>`).join('\n  ')}
</div>`;
}

export const faqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export function serviceCards(ctx, page, { feature = true } = {}) {
  const L = (to) => relLink(page.path, to);
  return `<ul class="svc-grid${feature ? ' svc-grid-feature' : ''}" role="list">
  ${ctx.services.map((s, i) => `<li class="svc-card rv" style="--d:${i * 70}ms">
    <a href="${L(`services/${s.slug}/`)}" class="svc-link">
      <div class="svc-media">${picture(page, s.image, s.imageAlt, { sizes: feature && i === 0 ? '(min-width: 900px) 58vw, 100vw' : '(min-width: 900px) 30vw, 100vw' })}</div>
      <div class="svc-body">
        <span class="svc-num mono">0${i + 1}</span>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.short)}</p>
        <span class="svc-more">Explore ${esc(s.name.toLowerCase())} ${icons.arrow}</span>
      </div>
    </a>
  </li>`).join('\n  ')}
</ul>`;
}

// Stylised, geographically faithful map of the service area (equirectangular, cos(lat) corrected).
export function areaMap(ctx, page, { link = true } = {}) {
  const L = (to) => relLink(page.path, to);
  const areas = ctx.site.areas;
  const hub = areas.find((a) => a.hub) || areas[0];
  const lonMin = -0.67, lonMax = -0.43, latMin = 51.12, latMax = 51.345;
  const k = Math.cos(51.23 * Math.PI / 180);
  const W = 520, H = Math.round(W * (latMax - latMin) / ((lonMax - lonMin) * k));
  const xy = (a) => [((a.lon - lonMin) / (lonMax - lonMin)) * W, ((latMax - a.lat) / (latMax - latMin)) * H];
  const [hx, hy] = xy(hub);
  const pxPerMile = W / ((lonMax - lonMin) * k * 69.17);
  const rings = [2, 5, 8].map((m) => `<circle class="map-ring" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${(m * pxPerMile).toFixed(1)}"/><text class="map-ring-t" x="${(hx + m * pxPerMile * 0.707 + 4).toFixed(1)}" y="${(hy - m * pxPerMile * 0.707).toFixed(1)}">${m} mi</text>`).join('');
  // Label placement nudges so nearby villages do not collide.
  const nudge = { shalford: [10, -2, 'start'], bramley: [-10, 4, 'end'], wonersh: [10, 10, 'start'], godalming: [-10, 4, 'end'], woking: [10, 4, 'start'], cranleigh: [10, 4, 'start'], guildford: [-12, -8, 'end'] };
  const dots = areas.map((a, i) => {
    const [x, y] = xy(a);
    const [dx, dy, anchor] = nudge[a.slug] || [10, 4, 'start'];
    const d = miles(hub, a);
    const label = `${a.name}${a.hub ? '' : `, about ${Math.max(1, Math.round(d))} miles from ${hub.name}`}`;
    const inner = `<g class="map-pin${a.hub ? ' is-hub' : ''}" style="--d:${i * 90}ms">
      ${a.hub ? '' : `<line class="map-line" x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`}
      <circle class="map-dot-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${a.hub ? 16 : 10}"/>
      <circle class="map-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${a.hub ? 6.5 : 4.5}"/>
      <text class="map-label" x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(a.name)}</text>
    </g>`;
    return link ? `<a href="${L(`areas/#${a.slug}`)}" aria-label="${esc(label)}">${inner}</a>` : `<g role="img" aria-label="${esc(label)}">${inner}</g>`;
  });
  return `<figure class="map rv">
  <svg viewBox="-60 -20 ${W + 120} ${H + 40}" role="group" aria-label="Map of the areas Karis Smart Cleaning covers around ${esc(hub.name)}">
    <defs><radialGradient id="mapGlow"><stop offset="0" stop-color="var(--citrus)" stop-opacity=".35"/><stop offset="1" stop-color="var(--citrus)" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${(9 * pxPerMile).toFixed(1)}" fill="url(#mapGlow)"/>
    ${rings}
    ${dots.join('\n    ')}
  </svg>
  <figcaption class="mono">Straight-line distances from ${esc(hub.name)}. Map is schematic.</figcaption>
</figure>`;
}

export function processSteps() {
  const steps = [
    ['Tell us about the space', 'Two minutes on our quote form: your postcode, the type of clean and the size of the property.'],
    ['Get a clear quote', 'We reply with a price and the checklist it covers, so you know exactly what is included before anything is booked.'],
    ['Come home to clean', 'We clean to the agreed checklist. If anything is not right, tell us and we will put it right.'],
  ];
  return `<ol class="steps" role="list">
  ${steps.map(([h, p], i) => `<li class="step rv" style="--d:${i * 110}ms"><span class="step-n mono">0${i + 1}</span><h3>${h}</h3><p>${p}</p></li>`).join('\n  ')}
</ol>`;
}
