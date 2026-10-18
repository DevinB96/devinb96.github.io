// Consent-first Google Analytics 4. Nothing loads, and no cookies are set, until the visitor
// accepts. With no measurement ID configured (content/site.json), this module does nothing.
const KEY = 'karis-consent';
let id = '';
let loaded = false;
let enabled = false;
let cookiesUrl = 'cookies/';

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode: ask again next visit */ } };

export function track(name, params = {}) {
  if (enabled) gtag('event', name, params);
}

function grant() {
  enabled = true;
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', id);
}

function deny() {
  enabled = false;
  gtag('consent', 'update', { analytics_storage: 'denied' });
  // Remove any analytics cookies set before the visitor changed their mind.
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga')).forEach((n) => {
    const host = location.hostname.split('.').slice(-2).join('.');
    for (const domain of ['', `; domain=.${host}`, `; domain=${location.hostname}`]) document.cookie = `${n}=; Max-Age=0; path=/${domain}`;
  });
}

function banner() {
  document.querySelector('.consent')?.remove();
  const el = document.createElement('section');
  el.className = 'consent';
  el.setAttribute('aria-labelledby', 'consent-h');
  el.innerHTML = `<h2 id="consent-h">Analytics cookies</h2>
    <p>We would like to use Google Analytics cookies to understand which pages are useful. They are off unless you accept. <a href="${cookiesUrl}">Cookie notice</a></p>
    <div class="cta-row"><button type="button" class="btn btn-outline" data-c="denied">Reject</button><button type="button" class="btn" data-c="granted">Accept</button></div>`;
  el.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-c]')?.dataset.c;
    if (!choice) return;
    save(choice);
    choice === 'granted' ? grant() : deny();
    el.remove();
  });
  document.body.appendChild(el);
  el.querySelector('[data-c="granted"]').focus({ preventScroll: true });
}

export function initConsent(cfg) {
  id = cfg.ga4 || '';
  if (!id) return;
  cookiesUrl = `${cfg.base}cookies/`;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  const saved = read();
  if (saved === 'granted') grant();
  else if (!saved) banner();
  document.addEventListener('click', (e) => { if (e.target.closest('[data-consent-open]')) banner(); });
}
