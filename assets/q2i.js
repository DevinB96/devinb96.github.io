/* Quote to Invoice: helpers shared by the trader app (app.html) and the customer page (view.html).
   Money, dates, document totals, message templates, FAQ matching and the customer link format.

   Customer link: view.html#<kind><base64url data>. Kind 'z' is deflate-raw compressed JSON,
   kind 'j' is plain JSON (for browsers without CompressionStream). The data never reaches a
   server: everything after # stays in the browser. Fields:
     v   format version (1)          t   'q' quote or 'i' invoice
     b   business {n name, w who (person), p phone, e email, a address, s website, vn VAT number}
     c   customer {n name, a address}
     no  document number             j   job title
     d   issue date (YYYY-MM-DD)     x   valid until (quote) or due date (invoice)
     sd  date of supply (invoice)    it  line items [[description, qty, unit price ex VAT]]
     vr  VAT rate % (0 = no VAT)     dp  deposit % (quote)      pd  deposit already paid £ (invoice)
     nt  notes                       bk  bank {an account name, sc sort code, ac account number}
     pl  online payment link         f   FAQs [[question, answer]] */
(function () {
  'use strict';

  /* ---------- money ---------- */
  const round2 = n => Math.round((+n || 0) * 100) / 100;
  const money = n => '£' + round2(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Prices are entered without VAT. vatRate is 0 when the business isn't VAT registered.
  // The deposit is a share of the total including VAT, rounded to whole pounds.
  function totals(items, vatRate, depositPct, depositPaid) {
    const subtotal = round2((items || []).reduce((s, it) => s + lineTotal(it), 0));
    const vat = round2(subtotal * (+vatRate || 0) / 100);
    const total = round2(subtotal + vat);
    const deposit = +depositPct > 0 ? Math.round(total * depositPct / 100) : 0;
    const paid = round2(depositPaid);
    return { subtotal, vat, total, deposit, paid, balance: round2(total - paid) };
  }
  function lineTotal(it) { return round2((+it.qty || 0) * (+it.unit || 0)); }

  /* ---------- dates (local calendar days as YYYY-MM-DD) ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  function parse(s) { const p = String(s).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  const today = () => iso(new Date());
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + (+n || 0)); return iso(d); }
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const fmtDate = (s, opts) => s ? parse(s).toLocaleDateString('en-GB', opts || { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const fmtLong = s => fmtDate(s, { day: 'numeric', month: 'long', year: 'numeric' });
  function fmtTime(t) {
    if (!t) return '';
    const p = t.split(':').map(Number), h = p[0] % 12 || 12;
    return h + (p[1] ? ':' + pad(p[1]) : '') + (p[0] < 12 ? 'am' : 'pm');
  }

  /* ---------- text ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Swap {placeholders} for values. Unknown ones are left visible so a typo is easy to spot.
  function fill(tpl, vars) {
    return String(tpl || '')
      .replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m)
      .replace(/[ \t]+\n/g, '\n').replace(/([^\s]) {2,}/g, '$1 ').replace(/\n{3,}/g, '\n\n').trim();
  }
  const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || '').trim()) ? String(u).trim() : '';

  /* ---------- phone, text and email links ---------- */
  function intlPhone(p) {
    const d = String(p || '').replace(/[^\d+]/g, '');
    if (d[0] === '+') return d.slice(1);
    if (d.slice(0, 2) === '00') return d.slice(2);
    if (d[0] === '0') return '44' + d.slice(1); // UK numbers
    return d;
  }
  const telHref = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  const smsHref = (p, body) => 'sms:' + String(p || '').replace(/[^\d+]/g, '') + '?&body=' + encodeURIComponent(body);
  const waHref = (p, body) => 'https://wa.me/' + intlPhone(p) + '?text=' + encodeURIComponent(body);
  const mailHref = (e, subject, body) => 'mailto:' + encodeURIComponent(String(e || '').trim()).replace(/%40/g, '@') +
    '?subject=' + encodeURIComponent(subject || '') + '&body=' + encodeURIComponent(body);

  /* ---------- FAQ matching ----------
     Scores each FAQ by the words it shares with the customer's message: keywords count most,
     then words in the question, then words in the answer. Words match on a shared stem, so
     "insured" finds "insurance" and "guaranteed" finds "guarantee". */
  const STOP = new Set(('a about after again all also am an and any are as at be been before being but by can could ' +
    'did do does doing done for from get got had has have hello hi how i id if ill im in into is it its ive just know ' +
    'let like me might more much my need no not of ok on one or our out please quick quote re should so some than ' +
    'thank thanks that the their them then there these they this to too up us was we well were what whats when where ' +
    'which who why will with would yes you youre your').split(' '));
  function stems(text) {
    return (String(text || '').toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) || [])
      .filter(w => !STOP.has(w))
      .map(w => w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w);
  }
  const same = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0));
  function matchFaqs(message, faqs, max) {
    const words = [...new Set(stems(message))];
    if (!words.length) return [];
    return (faqs || []).map(f => {
      const fields = [[stems(f.keywords), 3], [stems(f.q), 2], [stems(f.a), 0.5]];
      let score = 0;
      words.forEach(w => {
        let best = 0;
        fields.forEach(([list, weight]) => { if (weight > best && list.some(x => same(w, x))) best = weight; });
        score += best;
      });
      return { faq: f, score };
    }).filter(r => r.score >= 2).sort((a, b) => b.score - a.score).slice(0, max || 3);
  }

  /* ---------- customer links ---------- */
  function b64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(str) {
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  const pipe = (bytes, stream) => new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(b => new Uint8Array(b));
  async function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) {
      try { return 'z' + b64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* fall back to plain */ }
    }
    return 'j' + b64(bytes);
  }
  async function decode(str) {
    const kind = str[0], bytes = unb64(str.slice(1));
    if (kind === 'z') {
      if (!window.DecompressionStream) throw new Error('old-browser');
      return JSON.parse(new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw'))));
    }
    if (kind === 'j') return JSON.parse(new TextDecoder().decode(bytes));
    throw new Error('bad-link');
  }

  window.Q2I = {
    round2, money, totals, lineTotal,
    today, addDays, daysBetween, fmtDate, fmtLong, fmtTime,
    esc, fill, safeUrl,
    intlPhone, telHref, smsHref, waHref, mailHref,
    matchFaqs, encode, decode
  };
})();
