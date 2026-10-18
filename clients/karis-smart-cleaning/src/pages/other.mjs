import { esc, relLink, icons, miles, telHref, waHref } from '../lib.mjs';
import { businessSchema } from '../layout.mjs';
import { picture, areaMap } from '../partials.mjs';

const COMPANIES_HOUSE = (n) => `https://find-and-update.company-information.service.gov.uk/company/${n}`;

export const areas = {
  path: 'areas/',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const { site, services } = ctx;
    const hub = site.areas.find((a) => a.hub) || site.areas[0];
    const body = `
<section class="page-hero">
  <div class="wrap page-hero-split">
    <div>
      <p class="eyebrow">Areas we cover</p>
      <h1 class="display rv">Cleaning across <em>Guildford</em> and the villages around it</h1>
      <p class="lead rv">We are based in ${esc(hub.name)} and clean homes and workplaces in ${site.areas.length - 1} nearby towns and villages. Just outside? Ask anyway and we will tell you honestly whether we can help.</p>
      <div class="cta-row rv"><a class="btn btn-lg magnetic" href="${L('quote/')}" data-track="quote_cta" data-cta="areas-hero">Get a free quote ${icons.arrow}</a></div>
    </div>
    ${areaMap(ctx, page)}
  </div>
</section>
<section class="section section-tight">
  <div class="wrap area-list">
    ${site.areas.map((a) => {
      const d = miles(hub, a);
      return `<article class="area-card rv" id="${a.slug}" aria-labelledby="area-${a.slug}-h">
      <header>
        <p class="mono area-dist">${a.hub ? 'Our base' : `About ${Math.max(1, Math.round(d))} miles from ${esc(hub.name)}`}</p>
        <h2 id="area-${a.slug}-h">Cleaners in ${esc(a.name)}</h2>
      </header>
      <p>${esc(a.summary)}</p>
      ${a.note ? `<p class="area-note">${esc(a.note)}</p>` : ''}
      <ul class="area-svcs" role="list">${services.map((s) => `<li><a href="${L(`services/${s.slug}/`)}">${esc(s.name)}</a></li>`).join('')}</ul>
    </article>`;
    }).join('\n    ')}
  </div>
</section>`;
    return {
      title: 'Areas We Cover | Cleaners in Guildford, Godalming & Woking',
      description: `Cleaners covering ${site.areas.map((a) => a.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Home, office and end of tenancy cleaning from a Guildford-based team.`,
      breadcrumbs: [{ name: 'Areas we cover', path: page.path }],
      body,
      schema: [businessSchema(ctx)],
    };
  },
};

export const about = {
  path: 'about/',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const b = ctx.site.business;
    const body = `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">About us</p>
    <h1 class="display rv">A local cleaning company that <em>does it properly</em></h1>
    <p class="lead rv">Karis Smart Cleaning is a ${esc(b.baseTown)}-based cleaning company looking after homes and workplaces across ${esc(b.baseTown)}, Godalming, Woking and the surrounding villages.</p>
  </div>
</section>
<section class="section section-tight">
  <div class="wrap about-grid">
    <div class="prose rv">
      <h2 class="display display-sm">How we <em>work</em></h2>
      <p>Good cleaning is not complicated, but it does need care and consistency. That is why every job starts with a conversation about what you want done, and a checklist we both agree on.</p>
      <p>From there, we work through it room by room. Regular customers get the same standard every visit, and if your needs change you can tell us at any time. One-off cleans, such as deep cleans and end of tenancy cleans, follow a more detailed checklist that you can see before you book.</p>
      <p>We quote clearly, in writing, so you always know what is included and what it costs before anything is booked.</p>
      <h2 class="display display-sm">Who we <em>clean for</em></h2>
      <p>Households who want their weekends back. Tenants, landlords and letting agents between tenancies. Offices, studios and small commercial premises that want a clean, welcoming workplace. If you are not sure which service fits, tell us about the space and we will recommend one.</p>
    </div>
    <aside class="company-card rv" aria-labelledby="co-h">
      <h2 id="co-h" class="mono">Company details</h2>
      <dl>
        <div><dt>Registered name</dt><dd>${esc(b.legalName)}</dd></div>
        <div><dt>Company number</dt><dd>${esc(b.companyNumber)}</dd></div>
        <div><dt>Registered in</dt><dd>${esc(b.registeredIn)}</dd></div>
        <div><dt>Registered office</dt><dd>${esc(b.registeredOffice)}</dd></div>
      </dl>
      <p><a class="text-link" href="${COMPANIES_HOUSE(b.companyNumber)}" rel="noopener">View our Companies House record ${icons.arrow}</a></p>
      ${b.social?.facebook ? `<p><a class="text-link" href="${esc(b.social.facebook)}" rel="noopener" data-track="facebook_click">Find us on Facebook ${icons.arrow}</a></p>` : ''}
    </aside>
  </div>
</section>
<section class="section section-tight">
  <div class="wrap">
    <figure class="wide-figure rv">${picture(page, 'room-overview', 'Illustrated cut-away model of a home showing a kitchen, bathroom, living room and bedroom', { sizes: '100vw' })}<figcaption class="mono">Every clean, room by room. <a href="${L('')}#inside">Explore the house</a></figcaption></figure>
  </div>
</section>`;
    return {
      title: 'About Karis Smart Cleaning | Guildford Cleaning Company',
      description: 'Karis Smart Cleaning is a Guildford-based cleaning company for homes and workplaces. Agreed checklists, clear written quotes and the same standard every visit.',
      breadcrumbs: [{ name: 'About', path: page.path }],
      body,
      schema: [businessSchema(ctx)],
    };
  },
};

function contactAlternatives(ctx, L) {
  const b = ctx.site.business;
  const items = [
    b.phone && `<li><a href="${telHref(b.phone)}" data-track="phone_click">${icons.phone}<span><strong>Call us</strong>${esc(b.phoneDisplay || b.phone)}</span></a></li>`,
    b.whatsapp && `<li><a href="${waHref(b.whatsapp)}" rel="noopener" data-track="whatsapp_click">${icons.whatsapp}<span><strong>WhatsApp</strong>Message us</span></a></li>`,
    b.email && `<li><a href="mailto:${esc(b.email)}" data-track="email_click">${icons.mail}<span><strong>Email</strong>${esc(b.email)}</span></a></li>`,
    b.social?.facebook && `<li><a href="${esc(b.social.facebook)}" rel="noopener" data-track="facebook_click">${icons.facebook}<span><strong>Facebook</strong>Message us on Facebook</span></a></li>`,
  ].filter(Boolean);
  return items.length ? `<div class="alt-contact"><h2 class="mono">Prefer to talk?</h2><ul role="list">${items.join('')}</ul></div>` : '';
}

const opt = (v, label = v) => `<option value="${esc(v)}">${esc(label)}</option>`;

export const quote = {
  path: 'quote/',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const { site, services, env, siteUrl } = ctx;
    const ajax = env.formEndpoint;
    const plain = ajax.replace('/ajax/', '/');
    const subject = site.forms.subject + (env.formSubjectSuffix || '');
    const body = `
<section class="quote-sec">
  <div class="wrap quote-grid">
    <div class="quote-aside">
      <p class="eyebrow">Free quote</p>
      <h1 class="display">Get a free <em>cleaning quote</em></h1>
      <p class="lead">Tell us about the space. It takes about two minutes, and there is no obligation.</p>
      <ol class="next-steps" role="list">
        <li><span class="mono">01</span><div><strong>You send the form</strong><p>The more detail you share, the more accurate your quote.</p></div></li>
        <li><span class="mono">02</span><div><strong>We reply with a clear quote</strong><p>A price and the checklist it covers, so you know exactly what is included.</p></div></li>
        <li><span class="mono">03</span><div><strong>You decide</strong><p>Book if it suits you. No pressure, and no follow-up you did not ask for.</p></div></li>
      </ol>
      ${contactAlternatives(ctx, L)}
    </div>

    <div class="quote-card">
      <form class="quote-form" id="quoteForm" action="${esc(plain)}" method="POST" data-endpoint="${esc(ajax)}" novalidate>
        <input type="hidden" name="_subject" value="${esc(subject)}">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_next" value="${esc(siteUrl)}quote/thank-you/">
        <input type="hidden" name="Page" value="" data-page-url>
        <div class="hp" aria-hidden="true"><label for="f-company-website">Leave this empty</label><input type="text" id="f-company-website" name="_honey" tabindex="-1" autocomplete="off"></div>

        <fieldset class="fs">
          <legend><span class="mono">1</span>What needs cleaning?</legend>
          <div class="svc-pick">
            ${services.map((s, i) => `<label class="pick"><input type="radio" name="Service" value="${esc(s.name)}" data-slug="${s.slug}"${i === 0 ? ' checked' : ''}><span><strong>${esc(s.name)}</strong></span></label>`).join('\n            ')}
            <label class="pick"><input type="radio" name="Service" value="Not sure yet" data-slug="not-sure"><span><strong>Not sure yet</strong></span></label>
          </div>
        </fieldset>

        <fieldset class="fs">
          <legend><span class="mono">2</span>About the property</legend>
          <div class="grid-2">
            <div class="field"><label for="f-type">Property type</label>
              <select id="f-type" name="Property type" class="input">
                <option value="">Select</option>
                ${[['Flat or apartment'], ['Terraced house'], ['Semi-detached house'], ['Detached house'], ['Bungalow'], ['Office or commercial'], ['Other']].map(([v]) => opt(v)).join('')}
              </select></div>
            <div class="field"><label for="f-postcode">Postcode <span class="req" aria-hidden="true">*</span></label>
              <input id="f-postcode" name="Postcode" type="text" class="input" autocomplete="postal-code" required maxlength="8" aria-describedby="f-postcode-err">
              <p class="err" id="f-postcode-err" hidden>Please enter your postcode, for example GU1 1AA.</p></div>
            <div class="field" data-home-only><label for="f-beds">Bedrooms</label>
              <select id="f-beds" name="Bedrooms" class="input"><option value="">Select</option>${['Studio', '1', '2', '3', '4', '5', '6 or more'].map((v) => opt(v)).join('')}</select></div>
            <div class="field" data-home-only><label for="f-baths">Bathrooms</label>
              <select id="f-baths" name="Bathrooms" class="input"><option value="">Select</option>${['1', '2', '3', '4 or more'].map((v) => opt(v)).join('')}</select></div>
          </div>
          <div class="field" data-frequency>
            <span class="label" id="f-freq-l">How often?</span>
            <div class="chips" role="radiogroup" aria-labelledby="f-freq-l">
              ${['One-off', 'Weekly', 'Fortnightly', 'Monthly', 'Not sure'].map((v, i) => `<label class="chip"><input type="radio" name="Frequency" value="${v}"${i === 1 ? ' checked' : ''}><span>${v}</span></label>`).join('')}
            </div>
          </div>
          <div class="field"><label for="f-date">Preferred start date <span class="opt">(optional)</span></label>
            <input id="f-date" name="Preferred date" type="date" class="input"></div>
        </fieldset>

        <fieldset class="fs">
          <legend><span class="mono">3</span>Your details</legend>
          <div class="grid-2">
            <div class="field"><label for="f-name">Name <span class="req" aria-hidden="true">*</span></label>
              <input id="f-name" name="Name" type="text" class="input" autocomplete="name" required aria-describedby="f-name-err">
              <p class="err" id="f-name-err" hidden>Please tell us your name.</p></div>
            <div class="field"><label for="f-email">Email <span class="req" aria-hidden="true">*</span></label>
              <input id="f-email" name="email" type="email" class="input" autocomplete="email" required aria-describedby="f-email-err">
              <p class="err" id="f-email-err" hidden>Please enter a valid email address.</p></div>
            <div class="field"><label for="f-phone">Phone <span class="opt">(optional)</span></label>
              <input id="f-phone" name="Phone" type="tel" class="input" autocomplete="tel"></div>
            <div class="field">
              <span class="label" id="f-contact-l">Best way to reach you</span>
              <div class="chips" role="radiogroup" aria-labelledby="f-contact-l">
                ${['Email', 'Phone', 'Either'].map((v, i) => `<label class="chip"><input type="radio" name="Preferred contact" value="${v}"${i === 0 ? ' checked' : ''}><span>${v}</span></label>`).join('')}
              </div>
            </div>
          </div>
          <div class="field"><label for="f-msg">Anything else we should know? <span class="opt">(optional)</span></label>
            <textarea id="f-msg" name="Message" class="input" rows="4" placeholder="For example: pets, parking, access, rooms to focus on, or extras like inside the oven."></textarea></div>
        </fieldset>

        <p class="form-privacy">We use your details only to reply to this enquiry and, if you go ahead, to arrange your clean. See our <a href="${L('privacy/')}">privacy notice</a>.</p>
        <button type="submit" class="btn btn-lg btn-block" data-submit>Send my quote request ${icons.arrow}</button>
        <div class="form-status" role="status" aria-live="polite"></div>
      </form>
      <div class="form-success" id="formSuccess" hidden tabindex="-1">
        <span class="success-mark" aria-hidden="true">${icons.check}</span>
        <h2 class="display display-sm">Thank you. Your request is <em>on its way.</em></h2>
        <p>We will reply with a clear quote as soon as we can. If anything changes in the meantime, just send another request with the details.</p>
        <p><a class="text-link" href="${L('')}">Back to the home page ${icons.arrow}</a></p>
      </div>
    </div>
  </div>
</section>`;
    return {
      title: 'Get a Free Cleaning Quote | Karis Smart Cleaning, Guildford',
      description: 'Request a free, no-obligation cleaning quote for your home or workplace in Guildford, Godalming, Woking or nearby villages. It takes about two minutes.',
      breadcrumbs: [{ name: 'Get a quote', path: page.path }],
      bodyClass: 'page-quote',
      hideCtaBand: true,
      hideStickyCta: true,
      body,
      schema: [businessSchema(ctx)],
    };
  },
};

export const thanks = {
  path: 'quote/thank-you/',
  render() {
    const L = (to) => relLink(this.path, to);
    return {
      title: 'Thank you | Karis Smart Cleaning',
      description: 'Your quote request has been sent.',
      noindex: true,
      hideCtaBand: true,
      body: `<section class="page-hero"><div class="wrap narrow">
  <span class="success-mark" aria-hidden="true">${icons.check}</span>
  <h1 class="display">Thank you. Your request is <em>on its way.</em></h1>
  <p class="lead">We will reply with a clear quote as soon as we can.</p>
  <div class="cta-row"><a class="btn btn-lg" href="${L('')}">Back to the home page ${icons.arrow}</a><a class="btn btn-lg btn-outline" href="${L('services/')}">Browse services</a></div>
</div></section>`,
    };
  },
};

export const privacy = {
  path: 'privacy/',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const b = ctx.site.business;
    const contactLine = b.email
      ? `email <a href="mailto:${esc(b.email)}">${esc(b.email)}</a> or write to us at our registered office: ${esc(b.registeredOffice)}`
      : `write to us at our registered office: ${esc(b.registeredOffice)}${b.social?.facebook ? `, or message us on <a href="${esc(b.social.facebook)}" rel="noopener">Facebook</a>` : ''}`;
    const ga = ctx.site.analytics.ga4MeasurementId;
    const body = `
<section class="page-hero page-hero-compact"><div class="wrap narrow">
  <p class="eyebrow">Legal</p>
  <h1 class="display">Privacy notice</h1>
  <p class="lead">How ${esc(b.legalName)} collects and uses your personal information.</p>
  <p class="mono updated">Last updated ${ctx.buildDateLong}</p>
</div></section>
<section class="section section-tight"><div class="wrap narrow prose legal">
  <h2>Who we are</h2>
  <p>${esc(b.legalName)} (“we”, “us”) is the controller of the personal information described in this notice. We are a private limited company registered in ${esc(b.registeredIn)}, company number ${esc(b.companyNumber)}, registered office ${esc(b.registeredOffice)}.</p>
  <p>To contact us about your data, ${contactLine}.</p>

  <h2>What we collect</h2>
  <p>When you request a quote, we collect the details you enter: your name, email address, phone number (if given), postcode, the type of property and clean, your preferred date and anything you add in the message box. If you become a customer, we also hold the information needed to arrange and carry out your cleans, such as your address, access arrangements and payment records.</p>

  <h2>How we use it, and our lawful basis</h2>
  <ul>
    <li><strong>To reply to your enquiry and prepare a quote.</strong> This is a step you have asked us to take before entering into a contract (UK GDPR Article 6(1)(b)).</li>
    <li><strong>To provide and manage the services you book.</strong> This is necessary to perform our contract with you (Article 6(1)(b)).</li>
    <li><strong>To keep business and tax records.</strong> This is a legal obligation (Article 6(1)(c)).</li>
    ${ga ? '<li><strong>To understand how our website is used.</strong> Only if you accept analytics cookies (consent, Article 6(1)(a)). See our <a href="' + L('cookies/') + '">cookie notice</a>.</li>' : ''}
  </ul>
  <p>We do not sell your information, and we do not use it for marketing unless you have asked us to.</p>

  <h2>Who we share it with</h2>
  <p>We use trusted service providers to run our business, who process information on our behalf and only as we instruct. These include our website host, the service that delivers website form submissions to our inbox, and our email provider${ga ? ', and Google Analytics if you accept analytics cookies' : ''}. Some providers may process data outside the UK; where they do, we rely on appropriate safeguards such as the UK International Data Transfer Agreement or an adequacy decision.</p>

  <h2>How long we keep it</h2>
  <p>If you request a quote but do not become a customer, we delete your enquiry within 12 months. Customer records are kept for as long as we provide services to you and then for up to six years, to meet our legal and tax obligations.</p>

  <h2>Your rights</h2>
  <p>You have the right to access the personal information we hold about you, to ask us to correct or delete it, to restrict or object to how we use it, and to ask for a copy in a portable format. To use any of these rights, contact us using the details above. We will respond within one month.</p>
  <p>If you are unhappy with how we have handled your information, you can complain to the Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener">ico.org.uk</a> or on 0303 123 1113. We would appreciate the chance to put things right first.</p>

  <h2>Cookies</h2>
  <p>See our <a href="${L('cookies/')}">cookie notice</a> for details of the cookies this website uses.</p>
</div></section>`;
    return {
      title: 'Privacy Notice | Karis Smart Cleaning',
      description: `How ${b.legalName} collects, uses and protects your personal information, and your rights under UK data protection law.`,
      breadcrumbs: [{ name: 'Privacy notice', path: page.path }],
      hideCtaBand: true,
      body,
    };
  },
};

export const cookies = {
  path: 'cookies/',
  render(ctx) {
    const page = this;
    const L = (to) => relLink(page.path, to);
    const ga = ctx.site.analytics.ga4MeasurementId;
    const body = `
<section class="page-hero page-hero-compact"><div class="wrap narrow">
  <p class="eyebrow">Legal</p>
  <h1 class="display">Cookie notice</h1>
  <p class="mono updated">Last updated ${ctx.buildDateLong}</p>
</div></section>
<section class="section section-tight"><div class="wrap narrow prose legal">
  ${ga ? `
  <p>Cookies are small files stored on your device. We only use analytics cookies if you accept them, and you can change your choice at any time.</p>
  <h2>Cookies we use</h2>
  <div class="table-wrap"><table class="legal-table">
    <thead><tr><th scope="col">Name</th><th scope="col">Provider</th><th scope="col">Purpose</th><th scope="col">Duration</th></tr></thead>
    <tbody>
      <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distinguishes visitors so we can count visits and see which pages are useful</td><td>2 years</td></tr>
      <tr><td><code>_ga_${esc(ga.replace(/^G-/, ''))}</code></td><td>Google Analytics</td><td>Keeps track of the current visit</td><td>2 years</td></tr>
    </tbody>
  </table></div>
  <h2>Your choice</h2>
  <p>Analytics cookies are off until you choose “Accept”. To change your choice, use the button below or the “Cookie settings” link at the foot of every page.</p>
  <p><button class="btn" type="button" data-consent-open>Cookie settings</button></p>
  <p>We also store your choice itself in your browser’s local storage, so we do not ask again on every page. This is strictly necessary and does not track you.</p>` : `
  <p>This website does not set any cookies, and it does not use analytics or advertising trackers.</p>
  <p>If we add analytics in future, we will only turn it on if you agree, and we will update this notice first.</p>`}
  <p>Read our <a href="${L('privacy/')}">privacy notice</a> for more about how we handle personal information.</p>
</div></section>`;
    return {
      title: 'Cookie Notice | Karis Smart Cleaning',
      description: 'Which cookies the Karis Smart Cleaning website uses, and how to control them.',
      breadcrumbs: [{ name: 'Cookies', path: page.path }],
      hideCtaBand: true,
      body,
    };
  },
};

// Served for any missing URL, so links are absolute from the site root.
export const notFound = {
  path: '404.html',
  file: '404.html',
  render(ctx) {
    const base = ctx.basePath;
    return {
      title: 'Page not found | Karis Smart Cleaning',
      description: 'This page could not be found.',
      noindex: true,
      noCanonical: true,
      hideCtaBand: true,
      hideStickyCta: true,
      linkFrom: base,
      body: `<section class="page-hero nf"><div class="wrap narrow">
  <p class="eyebrow mono">Error 404</p>
  <h1 class="display">This corner is <em>already clean.</em></h1>
  <p class="lead">We could not find the page you were looking for. It may have moved, or the link may be mistyped.</p>
  <div class="cta-row"><a class="btn btn-lg" href="${base}">Back to the home page ${icons.arrow}</a><a class="btn btn-lg btn-outline" href="${base}quote/">Get a free quote</a></div>
</div></section>`,
    };
  },
};
