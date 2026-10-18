// Small helpers shared by the layout and page templates.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Join template parts, dropping false/null/undefined so conditionals read cleanly.
export const join = (parts, sep = '') => parts.filter((p) => p !== false && p != null && p !== '').join(sep);

// Relative link from the page at `from` (e.g. "services/deep-cleaning/") to `to`.
// An absolute `from` (starting with "/") produces root-relative links, used by the 404 page.
export function relLink(from, to) {
  if (/^(https?:|mailto:|tel:|#)/.test(to)) return to;
  if (from.startsWith('/')) return from + (to === './' ? '' : to);
  const depth = from.split('/').filter(Boolean).length;
  const prefix = depth ? '../'.repeat(depth) : './';
  if (to === '' || to === './') return prefix;
  return prefix + to;
}

export const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

export const telHref = (phone) => 'tel:' + String(phone).replace(/[^\d+]/g, '');
export const waHref = (num) => 'https://wa.me/' + String(num).replace(/[^\d]/g, '');

// Straight-line distance in miles, used for honest "about N miles from Guildford" notes.
export function miles(a, b) {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const icons = {
  arrow: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  mail: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  facebook: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8.5V7c0-.8.5-1.2 1.2-1.2H17V2.6h-2.6C11.6 2.6 10.6 4.4 10.6 7v1.5H8.4v3.3h2.2v9.6H14v-9.6h2.6l.5-3.3H14Z" fill="currentColor"/></svg>',
  whatsapp: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .4-.1.6l-.5.6c.6 1.1 1.5 2 2.7 2.6l.6-.6c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5v.5c0 .4-.2.7-.6.9-.6.3-1.6.4-3.1-.3a8.5 8.5 0 0 1-3.7-3.6c-.6-1.3-.4-2.4 0-2.9Z" fill="currentColor"/></svg>',
};

// The Karis mark: a rounded tile with a light-catching arc, like a single squeegee pass.
export const logoMark = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="var(--spruce)"/><path d="M11 28.5c4.5-9.5 11.5-14.5 19-16" fill="none" stroke="var(--citrus)" stroke-width="3.2" stroke-linecap="round"/><circle cx="29.5" cy="12.6" r="2.4" fill="var(--paper)"/></svg>`;
