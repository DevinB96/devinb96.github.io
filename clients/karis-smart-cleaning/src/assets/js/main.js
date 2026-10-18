// Karis Smart Cleaning: site interactions. Everything here is progressive enhancement;
// the HTML works without it.
import { track, initConsent } from './analytics.js';

const cfg = JSON.parse(document.getElementById('karis-config')?.textContent || '{}');
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// Module URLs in the config are relative to the page, so resolve them against it (not this file).
const mod = (name) => new URL(cfg.modules[name], document.baseURI).href;

// Hero entrance once fonts are ready (or after 600ms so nothing waits on the network).
Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 600))]).then(() =>
  requestAnimationFrame(() => document.body.classList.add('is-loaded')));

/* Header: scrolled state, mobile menu, services disclosure */
const hdr = $('#hdr');
const menuBtn = $('#menuBtn');
const onScroll = () => hdr?.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  if (!menuBtn) return;
  if (open) $('#nav').style.setProperty('--menu-top', `${Math.max(0, hdr.getBoundingClientRect().bottom)}px`);
  menuBtn.setAttribute('aria-expanded', String(open));
  hdr.classList.toggle('menu-open', open);
  document.body.classList.toggle('menu-lock', open);
  menuBtn.querySelector('.sr').textContent = open ? 'Close menu' : 'Menu';
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
$$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (hdr?.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  $$('.has-sub.is-open').forEach((li) => { li.classList.remove('is-open'); li.querySelector('.sub-btn').setAttribute('aria-expanded', 'false'); });
});
$$('.sub-btn').forEach((btn) => btn.addEventListener('click', () => {
  const li = btn.closest('.has-sub');
  const open = !li.classList.contains('is-open');
  li.classList.toggle('is-open', open);
  btn.setAttribute('aria-expanded', String(open));
}));
document.addEventListener('click', (e) => {
  $$('.has-sub.is-open').forEach((li) => { if (!li.contains(e.target) && !hdr.classList.contains('menu-open')) { li.classList.remove('is-open'); li.querySelector('.sub-btn').setAttribute('aria-expanded', 'false'); } });
});

/* Scroll reveals */
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
$$('.rv, .step, .map, .glint').forEach((el) => io.observe(el));

/* Statement: words light up as it scrolls through the viewport */
$$('[data-split]').forEach((el) => {
  if (reduced) return;
  const text = el.textContent.trim();
  el.innerHTML = `<span class="sr">${text}</span>` + text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  const spans = $$('.w', el);
  const update = () => {
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
  };
  addEventListener('scroll', update, { passive: true });
  update();
});

/* Counting facts */
$$('[data-count]').forEach((el) => {
  if (reduced) return;
  const target = +el.dataset.count;
  const cio = new IntersectionObserver((entries) => {
    const e = entries[entries.length - 1];
    if (!e.isIntersecting) return;
    cio.disconnect();
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  cio.observe(el);
});

/* Magnetic buttons and depth-aware cards (fine pointers only) */
if (finePointer && !reduced) {
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      btn.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
  $$('.svc-link, .rel-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* Sticky mobile CTA: after the hero, hidden when the footer CTA is on screen */
const sticky = $('#stickyCta');
if (sticky) {
  const band = $('.cta-band');
  let bandVisible = false;
  if (band) new IntersectionObserver((entries) => { bandVisible = entries[entries.length - 1].isIntersecting; upd(); }).observe(band);
  const upd = () => sticky.classList.toggle('is-on', scrollY > innerHeight * 0.6 && !bandVisible && !hdr.classList.contains('menu-open'));
  addEventListener('scroll', upd, { passive: true });
  upd();
}

/* Click tracking for calls, emails and CTAs */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) track(el.dataset.track, { cta_location: el.dataset.cta || '', link_url: el.href || '' });
});

/* Cinematic hero light */
const heroCanvas = $('#heroCanvas');
if (heroCanvas) {
  // Start after the page has loaded so the shader never competes with the first paint.
  const go = () => import(mod('hero')).then((m) => m.start(heroCanvas, { reduced })).catch(() => {});
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 200));
  document.readyState === 'complete' ? idle() : addEventListener('load', idle, { once: true });
}

/* Inside the clean: level tabs, room steps, 3D maquette */
const inside = $('#inside');
if (inside) initInside(inside);

function initInside(section) {
  const tabs = $$('.level-tab', section);
  const pill = $('.level-pill', section);
  const link = $('[data-level-link]', section);
  const services = JSON.parse($('#maquette').dataset.services);
  const names = { regular: 'Regular clean', deep: 'Deep clean', tenancy: 'End of tenancy' };
  const linkLabels = { regular: 'About regular cleaning', deep: 'About deep cleaning', tenancy: 'About end of tenancy cleaning' };
  const steps = $$('.room-step', section);
  const hudRoom = $('[data-hud-room]', section);
  const hudLevel = $('[data-hud-level]', section);
  const maq = $('#maquette');
  let scene = null;
  let level = 'regular';
  let room = 'overview';

  const placePill = () => {
    const t = tabs.find((x) => x.getAttribute('aria-checked') === 'true');
    if (!t || !pill) return;
    pill.style.width = t.offsetWidth + 'px';
    pill.style.transform = `translateX(${t.offsetLeft - 5}px)`;
  };
  const counts = () => steps.forEach((s) => {
    const n = $$(`.checklist li[data-in~="${level}"]`, s).length;
    const c = $('.room-count', s);
    if (c) c.textContent = `${n} tasks in ${{ regular: 'a regular clean', deep: 'a deep clean', tenancy: 'an end of tenancy clean' }[level]}`;
  });
  function setLevel(next, focus) {
    level = next;
    section.dataset.level = next;
    tabs.forEach((t) => { const on = t.dataset.level === next; t.setAttribute('aria-checked', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    placePill();
    counts();
    $$('.checklist li', section).forEach((li) => { li.classList.remove('pop'); if (li.dataset.in.split(' ').includes(next)) { void li.offsetWidth; li.classList.add('pop'); } });
    if (link) { link.href = link.href.replace(/services\/[^/]+\//, `services/${services[next]}/`); link.firstChild.textContent = `${linkLabels[next]} `; }
    hudLevel.textContent = names[next];
    scene?.setLevel(next);
  }
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', () => setLevel(t.dataset.level));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      setLevel(tabs[(i + d + tabs.length) % tabs.length].dataset.level, true);
    });
  });
  addEventListener('resize', placePill);
  document.fonts?.ready.then(placePill);
  placePill();
  counts();

  // Active room = the step nearest the middle of the viewport.
  const still = $('.maquette-still', maq);
  const setRoom = (id) => {
    if (id === room) return;
    room = id;
    steps.forEach((s) => s.classList.toggle('is-active', s.dataset.room === id));
    hudRoom.textContent = $(`.room-step[data-room="${id}"] h3`, section).textContent;
    if (scene) scene.setRoom(id);
    else if (still) {
      still.style.opacity = '0.25';
      setTimeout(() => {
        const base = still.dataset.stillBase;
        still.srcset = `${base}${id}-800.webp 800w, ${base}${id}-1600.webp 1600w`;
        still.src = `${base}${id}-1600.webp`;
        still.onload = () => { still.style.opacity = ''; };
      }, reduced ? 0 : 250);
    }
  };
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setRoom(e.target.dataset.room); });
  }, { rootMargin: matchMedia('(max-width: 899px)').matches ? '-68% 0px -28% 0px' : '-45% 0px -45% 0px' });
  steps.forEach((s) => sio.observe(s));
  steps[0].classList.add('is-active');

  // Load the 3D scene only on capable devices, and only when the section is near.
  const conn = navigator.connection;
  const lowData = conn && (conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || ''));
  if (reduced || lowData || !window.WebGL2RenderingContext) return;
  const lio = new IntersectionObserver((entries) => {
    const e = entries[entries.length - 1];
    if (!e.isIntersecting) return;
    lio.disconnect();
    import(mod('maquette')).then(async (m) => {
      scene = await m.mount(maq, { data: JSON.parse(maq.dataset.scene), level, room, section });
      maq.classList.add('is-3d');
      const toggle = $('.maquette-toggle', maq);
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        const paused = scene.toggleMotion();
        toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
      });
    }).catch((err) => { console.warn('3D scene unavailable, using stills.', err); });
  }, { rootMargin: '600px 0px' });
  lio.observe(section);
}

/* Quote form */
const form = $('#quoteForm');
if (form) import(mod('quote')).then((m) => m.init(form, cfg, track));

initConsent(cfg);
