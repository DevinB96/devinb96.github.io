import { esc, relLink, icons } from '../lib.mjs';
import { businessSchema } from '../layout.mjs';
import { picture, faqList, faqSchema, serviceCards, areaMap, processSteps } from '../partials.mjs';

const levelLabel = { regular: 'Regular', deep: 'Deep', tenancy: 'End of tenancy' };

function insideSection(ctx, page) {
  const L = (to) => relLink(page.path, to);
  const { rooms } = ctx;
  const svcFor = Object.fromEntries(rooms.levels.map((l) => [l.id, l.service]));
  const sceneData = rooms.rooms.map((r) => ({
    id: r.id,
    hotspots: r.items.filter((i) => i.hotspot).map((i) => ({ key: i.hotspot, t: i.t, in: i.in })),
  }));
  const steps = rooms.rooms.map((r, i) => `
      <li class="room-step" data-room="${r.id}">
        <div class="room-card">
          <p class="room-n mono"><span>0${i + 1}</span> / 0${rooms.rooms.length}</p>
          <h3>${esc(r.name)}</h3>
          <p class="room-intro">${esc(r.intro)}</p>
          <ul class="checklist" role="list">
            ${r.items.map((it) => `<li data-in="${it.in.join(' ')}"${it.in.includes('regular') ? '' : ' class="is-extra"'}>${icons.check}<span>${esc(it.t)}</span><small class="in-tags">${it.in.map((l) => levelLabel[l]).join(', ')}</small></li>`).join('\n            ')}
          </ul>
          <p class="room-count mono" aria-live="polite"></p>
        </div>
      </li>`).join('');
  return `
<section class="inside" id="inside" aria-labelledby="inside-h" data-level="regular">
  <div class="wrap inside-head">
    <div>
      <p class="eyebrow">Inside the clean</p>
      <h2 id="inside-h" class="display rv">Lift the roof. <em>See exactly</em> what we clean.</h2>
    </div>
    <div class="inside-intro rv">
      <p>Pick a type of clean, then scroll through the house room by room. Everything listed is part of that clean as standard, and you can add or remove tasks when we quote.</p>
      <div class="level-tabs" role="radiogroup" aria-label="Type of clean">
        ${rooms.levels.map((l, i) => `<button type="button" role="radio" class="level-tab" data-level="${l.id}" aria-checked="${i === 0}">${esc(l.name)}</button>`).join('')}
        <span class="level-pill" aria-hidden="true"></span>
      </div>
      <p class="level-link"><a class="text-link" href="${L(`services/${svcFor.regular}/`)}" data-level-link>About regular cleaning ${icons.arrow}</a></p>
    </div>
  </div>
  <div class="wrap inside-stage">
    <div class="inside-sticky">
      <div class="maquette" id="maquette" data-scene='${esc(JSON.stringify(sceneData))}' data-services='${esc(JSON.stringify(svcFor))}'>
        <img class="maquette-still" src="${L('assets/img/room-overview-1600.webp')}" srcset="${L('assets/img/room-overview-800.webp')} 800w, ${L('assets/img/room-overview-1600.webp')} 1600w" sizes="(min-width: 900px) 58vw, 100vw" width="1600" height="1200" alt="Illustrated cut-away model of a home showing a kitchen, bathroom, living room and bedroom" loading="lazy" decoding="async" data-still-base="${L('assets/img/room-')}">
        <div class="maquette-hotspots" aria-hidden="true"></div>
        <p class="maquette-hud mono" aria-hidden="true"><span data-hud-room>The whole home</span><span data-hud-level>Regular clean</span></p>
        <button type="button" class="maquette-toggle mono" hidden>Pause motion</button>
      </div>
    </div>
    <ol class="inside-steps" role="list">
      <li class="room-step" data-room="overview">
        <div class="room-card room-card-intro">
          <p class="room-n mono"><span>00</span> / 0${rooms.rooms.length}</p>
          <h3>The whole home</h3>
          <p class="room-intro">Every clean follows a room-by-room checklist. Scroll on to open each room and see what is included.</p>
        </div>
      </li>${steps}
    </ol>
  </div>
</section>`;
}

export default {
  path: '',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const { site, services } = ctx;
    const b = site.business;
    const testimonials = site.testimonials || [];
    const body = `
<section class="hero" id="top" aria-labelledby="hero-h">
  <div class="hero-bg" aria-hidden="true">
    <div class="hero-fallback"></div>
    <canvas class="hero-canvas" id="heroCanvas"></canvas>
    <div class="hero-grain"></div>
  </div>
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow hero-in" style="--d:0ms"><span class="eyebrow-dot" aria-hidden="true"></span>Home &amp; office cleaning in ${esc(b.baseTown)}, ${esc(b.county)}</p>
      <h1 id="hero-h" class="display hero-h1"><span class="ln"><span class="hero-in" style="--d:80ms">Come home</span></span> <span class="ln"><span class="hero-in" style="--d:180ms">to <em>clean.</em></span></span></h1>
      <p class="lead hero-in" style="--d:300ms">Regular, deep and end of tenancy cleaning for homes and workplaces across Guildford, Godalming, Woking and the villages in between. One clear checklist, agreed with you and done properly.</p>
      <div class="cta-row hero-in" style="--d:400ms">
        <a class="btn btn-lg magnetic" href="${L('quote/')}" data-track="quote_cta" data-cta="hero">Get a free quote ${icons.arrow}</a>
        <a class="btn btn-lg btn-outline" href="#inside">See what is included</a>
      </div>
      <ul class="hero-facts hero-in" style="--d:500ms" role="list">
        <li>${icons.check}Registered UK company</li>
        <li>${icons.check}Based in ${esc(b.baseTown)}</li>
        <li>${icons.check}Homes &amp; workplaces</li>
      </ul>
    </div>
    <form class="qq hero-in" style="--d:450ms" action="${L('quote/')}" method="get" aria-labelledby="qq-h" data-quick-quote>
      <p class="qq-kicker mono">Quick quote</p>
      <h2 id="qq-h" class="qq-h">What needs cleaning?</h2>
      <fieldset class="chips">
        <legend class="sr">Type of clean</legend>
        ${services.map((s, i) => `<label class="chip"><input type="radio" name="service" value="${s.slug}"${i === 0 ? ' checked' : ''}><span>${esc(s.name.replace(' and commercial', ''))}</span></label>`).join('\n        ')}
      </fieldset>
      <label class="field-label" for="qq-postcode">Your postcode</label>
      <div class="qq-row">
        <input id="qq-postcode" name="postcode" type="text" inputmode="text" autocomplete="postal-code" placeholder="e.g. GU1" maxlength="8" class="input">
        <button class="btn" type="submit" data-track="quick_quote_submit">Continue ${icons.arrow}</button>
      </div>
      <p class="qq-note">Free and no obligation. We reply with a clear price.</p>
    </form>
  </div>
  <a class="scroll-cue mono" href="#intro" aria-label="Scroll to introduction"><span aria-hidden="true"></span>Scroll</a>
</section>

<section class="intro" id="intro" aria-label="About Karis Smart Cleaning">
  <div class="wrap intro-grid">
    <p class="eyebrow">Karis Smart Cleaning</p>
    <p class="statement" data-split>We look after homes and workplaces across ${esc(b.baseTown)} and the villages around it. We agree exactly what you want done, then we do it properly: every room, every visit.</p>
    <dl class="facts">
      <div class="rv" style="--d:0ms"><dt data-count="${site.areas.length}">${site.areas.length}</dt><dd>towns and villages covered around ${esc(b.baseTown)}</dd></div>
      <div class="rv" style="--d:90ms"><dt data-count="${services.length}">${services.length}</dt><dd>cleaning services, from family homes to offices</dd></div>
      <div class="rv" style="--d:180ms"><dt>1</dt><dd>checklist, agreed with you before we start</dd></div>
    </dl>
  </div>
</section>

<section class="section services" id="services" aria-labelledby="services-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Services</p>
      <h2 id="services-h" class="display rv">Cleaning for every kind of <em>space.</em></h2>
      <p class="section-sub rv">From a weekly routine to a full reset before you hand back the keys. Each service starts from a clear checklist you can tailor.</p>
    </div>
    ${serviceCards(ctx, page)}
  </div>
</section>
${insideSection(ctx, page)}

<section class="section process" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">How it works</p>
      <h2 id="how-h" class="display rv">Three steps to a <em>cleaner</em> week.</h2>
    </div>
    ${processSteps()}
    <div class="center-cta rv"><a class="btn btn-lg magnetic" href="${L('quote/')}" data-track="quote_cta" data-cta="process">Start with a free quote ${icons.arrow}</a></div>
  </div>
</section>

<section class="section areas-home" id="areas" aria-labelledby="areas-h">
  <div class="wrap areas-grid">
    <div>
      <p class="eyebrow">Areas we cover</p>
      <h2 id="areas-h" class="display rv">Local to ${esc(b.baseTown)}, and the <em>villages</em> around it.</h2>
      <p class="section-sub rv">We clean across ${site.areas.map((a) => esc(a.name)).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Just outside? Ask anyway and we will tell you honestly whether we can help.</p>
      <ul class="area-chips" role="list">${site.areas.map((a) => `<li><a href="${L(`areas/#${a.slug}`)}">${icons.pin}${esc(a.name)}</a></li>`).join('')}</ul>
      <p><a class="text-link" href="${L('areas/')}">More about the areas we cover ${icons.arrow}</a></p>
    </div>
    ${areaMap(ctx, page)}
  </div>
</section>

<section class="section standards" aria-labelledby="standards-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">What you can expect</p>
      <h2 id="standards-h" class="display rv">Simple promises, <em>kept.</em></h2>
    </div>
    <ul class="std-grid" role="list">
      <li class="std rv" style="--d:0ms"><span class="std-n mono">A</span><h3>One agreed checklist</h3><p>Before we start, we agree what you want done. It is the same list every visit, and you can change it at any time.</p></li>
      <li class="std rv" style="--d:80ms"><span class="std-n mono">B</span><h3>Clear quotes</h3><p>You get a price and a list of exactly what it covers before anything is booked. No vague estimates.</p></li>
      <li class="std rv" style="--d:160ms"><span class="std-n mono">C</span><h3>Local and accountable</h3><p>A registered company based in ${esc(b.baseTown)}. Our company details are published at the foot of every page.</p></li>
      <li class="std rv" style="--d:240ms"><span class="std-n mono">D</span><h3>Homes and workplaces</h3><p>From flats and family homes to offices, studios and small commercial premises.</p></li>
    </ul>
  </div>
</section>
${testimonials.length ? `
<section class="section reviews" aria-labelledby="reviews-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Reviews</p><h2 id="reviews-h" class="display rv">In our customers’ <em>words.</em></h2></div>
    <ul class="review-grid" role="list">${testimonials.map((t) => `<li class="review rv"><blockquote><p>${esc(t.quote)}</p></blockquote><p class="review-by">${esc(t.name)}${t.area ? `, ${esc(t.area)}` : ''}${t.source ? ` <span class="mono">via ${esc(t.source)}</span>` : ''}</p></li>`).join('')}</ul>
    ${b.googleReviewUrl ? `<p class="center-cta"><a class="text-link" href="${esc(b.googleReviewUrl)}" rel="noopener">Read more reviews on Google ${icons.arrow}</a></p>` : ''}
  </div>
</section>` : ''}

<section class="section faq-sec" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div>
      <p class="eyebrow">Questions</p>
      <h2 id="faq-h" class="display rv">Good to <em>know.</em></h2>
      <p class="section-sub rv">Something else on your mind? Add it to your quote request and we will answer it with your quote.</p>
    </div>
    ${faqList(site.faqs)}
  </div>
</section>`;
    return {
      title: 'Cleaners in Guildford for Homes & Offices | Karis Smart Cleaning',
      ogTitle: 'Karis Smart Cleaning: home and office cleaning in Guildford',
      description: 'Regular, deep, end of tenancy, office and window cleaning across Guildford, Godalming, Woking and nearby villages. Clear checklists and free quotes.',
      bodyClass: 'page-home',
      body,
      preload: `<link rel="modulepreload" href="${L(ctx.asset('js/hero-light.js'))}">`,
      schema: [
        businessSchema(ctx),
        { '@context': 'https://schema.org', '@type': 'WebSite', '@id': ctx.siteUrl + '#website', url: ctx.siteUrl, name: b.name, publisher: { '@id': ctx.siteUrl + '#business' }, inLanguage: 'en-GB' },
        faqSchema(site.faqs),
      ],
    };
  },
};
