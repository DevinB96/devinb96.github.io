/* Quote to Invoice: the customer's copy of a quote or invoice (view.html).
   The whole document travels in the link after # (format in q2i.js), so nothing is fetched or
   stored. Anyone can make such a link, so every value is checked and escaped before it's shown. */
(function () {
  'use strict';
  const Q = window.Q2I;
  const { money, totals, today, fmtLong, esc } = Q;
  const root = document.getElementById('doc');

  /* ---------- reading the link ---------- */
  const str = (v, max) => v == null ? '' : String(v).slice(0, max || 600);
  const num = v => { const n = +v; return isFinite(n) ? n : 0; };
  const day = v => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
  function clean(d) {
    d = d && typeof d === 'object' ? d : {};
    const b = d.b || {}, c = d.c || {}, bk = d.bk && typeof d.bk === 'object' ? d.bk : null;
    return {
      quote: d.t !== 'i', preview: !!d.pv,
      biz: { name: str(b.n), who: str(b.w), phone: str(b.p, 40), email: str(b.e, 200), address: str(b.a), site: str(b.s, 200), vat: str(b.vn, 40) },
      cust: { name: str(c.n), address: str(c.a) },
      no: str(d.no, 40), job: str(d.j), issued: day(d.d), until: day(d.x), supply: day(d.sd),
      items: (Array.isArray(d.it) ? d.it : []).slice(0, 200).filter(Array.isArray).map(r => ({ desc: str(r[0], 2000), qty: num(r[1]), unit: num(r[2]) })),
      vat: Math.min(100, Math.max(0, num(d.vr))), depositPct: Math.min(100, Math.max(0, num(d.dp))), paid: Math.max(0, num(d.pd)),
      notes: str(d.nt, 5000),
      bank: bk ? { name: str(bk.an), sort: str(bk.sc, 20), acc: str(bk.ac, 20) } : null,
      payLink: Q.safeUrl(d.pl),
      faqs: (Array.isArray(d.f) ? d.f : []).slice(0, 40).filter(Array.isArray).map(f => [str(f[0]), str(f[1], 3000)]).filter(f => f[0] && f[1])
    };
  }

  /* ---------- helpers ---------- */
  const nl = s => esc(s).replace(/\r?\n/g, '<br>');
  function site(s) {
    const url = Q.safeUrl(/^https?:\/\//i.test(s) ? s : 'https://' + s);
    return s && url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(s.replace(/^https?:\/\//i, '').replace(/\/$/, '')) + '</a>' : '';
  }
  // Ready-written replies to the business, by WhatsApp, text or email.
  function channels(d, text, subject, verb) {
    const out = [];
    if (d.biz.phone) {
      out.push('<a class="btn" href="' + esc(Q.waHref(d.biz.phone, text)) + '" target="_blank" rel="noopener">' + verb + ' by WhatsApp</a>');
      out.push('<a class="btn" href="' + esc(Q.smsHref(d.biz.phone, text)) + '">' + verb + ' by text</a>');
    }
    if (d.biz.email) out.push('<a class="btn" href="' + esc(Q.mailHref(d.biz.email, subject, text)) + '">' + verb + ' by email</a>');
    return out.join('');
  }
  function copyRow(label, value) {
    return '<div><dt>' + label + '</dt><dd><span>' + esc(value) + '</span><button class="copy" type="button" data-copy="' + esc(value) + '" aria-label="Copy ' + label.toLowerCase() + '">Copy</button></dd></div>';
  }

  /* ---------- the document ---------- */
  function render(d) {
    const t = totals(d.items, d.vat, d.quote ? d.depositPct : 0, d.quote ? 0 : d.paid);
    const kind = d.quote ? 'Quote' : 'Invoice';
    const who = d.biz.who || d.biz.name || 'us';
    const first = d.cust.name.trim().split(/\s+/)[0];
    document.title = kind + (d.no ? ' ' + d.no : '') + (d.biz.name ? ' from ' + d.biz.name : '');
    const contact = [
      d.biz.phone && '<a href="' + esc(Q.telHref(d.biz.phone)) + '">' + esc(d.biz.phone) + '</a>',
      d.biz.email && '<a href="mailto:' + esc(d.biz.email) + '">' + esc(d.biz.email) + '</a>',
      site(d.biz.site)
    ].filter(Boolean).join('<br>');
    const row = (k, v, cls) => '<div' + (cls ? ' class="' + cls + '"' : '') + '><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    const sums = (d.vat ? row('Subtotal', money(t.subtotal)) + row('VAT at ' + d.vat + '%', money(t.vat)) : '') +
      row(d.vat ? 'Total including VAT' : 'Total', money(t.total), d.quote || !t.paid ? 'total' : '') +
      (d.quote ? '' : t.paid ? row('Less deposit paid', '&minus;' + money(t.paid)) + row('Balance due', money(t.balance), 'total') : '');

    let money_ = '';
    if (d.quote && t.deposit) {
      money_ = '<div class="box"><h3>Deposit</h3><p>A deposit of <b>' + money(t.deposit) + '</b> secures your start date. It comes off the final invoice.</p>' +
        (d.bank ? '<dl class="bank">' + copyRow('Account name', d.bank.name) + copyRow('Sort code', d.bank.sort) + copyRow('Account number', d.bank.acc) + copyRow('Reference', d.no) + '</dl>' : '') + '</div>';
    }
    if (!d.quote) {
      money_ = '<div class="box"><h3>How to pay</h3><p>Please pay <b>' + money(t.balance) + '</b>' + (d.until ? ' by <b>' + esc(fmtLong(d.until)) + '</b>' : '') + '.</p>' +
        (d.bank ? '<dl class="bank">' + copyRow('Account name', d.bank.name) + copyRow('Sort code', d.bank.sort) + copyRow('Account number', d.bank.acc) + copyRow('Reference', d.no) + '</dl>' : '') +
        (d.payLink ? '<p class="no-print"><a class="btn dark" href="' + esc(d.payLink) + '" target="_blank" rel="noopener">Pay ' + money(t.balance) + ' by card</a></p>' : '') +
        (!d.bank && !d.payLink ? '<p>' + esc(who) + ' will let you know how to pay.</p>' : '') + '</div>';
    }

    let reply = '';
    if (d.quote) {
      const yes = 'Hi ' + who + ', I’d like to go ahead with quote ' + d.no + (d.job ? ' for ' + d.job : '') + ' (' + money(t.total) + '). Please let me know your next available dates.' + (first ? ' Thanks, ' + first : '');
      const ask = 'Hi ' + who + ', I have a question about quote ' + d.no + (d.job ? ' for ' + d.job : '') + ': ';
      const expired = d.until && d.until < today();
      reply = '<section class="reply no-print" aria-labelledby="replyH"><h2 id="replyH">Happy to go ahead?</h2>' +
        (expired ? '<p class="warn">The price on this quote was held until ' + esc(fmtLong(d.until)) + '. You can still say yes, and ' + esc(who) + ' will confirm it’s current.</p>' : '') +
        (d.biz.phone || d.biz.email
          ? '<p>Let ' + esc(who) + ' know with a quick message. It’s written for you, so just press send.</p><div class="ch">' + channels(d, yes, 'Yes to quote ' + d.no, 'Accept') + '</div>' +
            '<p class="small">Got a question first?' + (d.faqs.length ? ' Have a look at the answers below, or ask' : ' Ask') + ' ' + esc(who) + ' directly:</p><div class="ch quiet">' + channels(d, ask, 'Question about quote ' + d.no, 'Ask') + '</div>'
          : '<p>To accept, reply to the message this link came in.</p>') + '</section>';
    } else if (d.biz.phone || d.biz.email) {
      const paid = 'Hi ' + who + ', I’ve paid invoice ' + d.no + ' (' + money(t.balance) + ').' + (first ? ' Thanks, ' + first : '');
      reply = '<section class="reply no-print" aria-labelledby="replyH"><h2 id="replyH">Paid already?</h2><p>Let ' + esc(who) + ' know, so they can tick it off.</p>' +
        '<div class="ch quiet">' + channels(d, paid, 'Paid: invoice ' + d.no, 'Tell them') + '</div></section>';
    }

    const faqs = d.faqs.length ? '<section class="faqs no-print" aria-labelledby="faqH"><h2 id="faqH">Common questions</h2>' +
      (d.faqs.length > 5 ? '<input type="search" id="faqSearch" placeholder="Search the questions" aria-label="Search the questions">' : '') +
      '<div class="faq-items">' + d.faqs.map(f => '<details><summary>' + esc(f[0]) + '</summary><p>' + nl(f[1]) + '</p></details>').join('') + '</div>' +
      '<p class="small" id="faqNone" hidden>No answer matches that. Ask ' + esc(who) + ' using the buttons above.</p></section>' : '';

    root.innerHTML =
      (d.preview ? '<p class="banner no-print">Preview: this is what your customer will see. It hasn’t been sent.</p>' : '') +
      '<div class="tools no-print"><button class="btn" type="button" id="printBtn">Save as PDF or print</button></div>' +
      '<article class="sheet">' +
        '<header class="doc-head"><div class="from">' +
          '<p class="biz">' + esc(d.biz.name || d.biz.who) + '</p>' +
          (d.biz.address ? '<p>' + nl(d.biz.address) + '</p>' : '') + (contact ? '<p>' + contact + '</p>' : '') +
          (d.biz.vat ? '<p>VAT no. ' + esc(d.biz.vat) + '</p>' : '') +
        '</div><div class="meta"><h1>' + kind + '</h1><dl>' +
          (d.no ? row(kind + ' no.', esc(d.no)) : '') + (d.issued ? row('Date', esc(fmtLong(d.issued))) : '') +
          (!d.quote && d.supply ? row('Work done', esc(fmtLong(d.supply))) : '') +
          (d.until ? row(d.quote ? 'Price held until' : 'Payment due', esc(fmtLong(d.until))) : '') +
        '</dl></div></header>' +
        '<div class="for"><span class="lbl">' + (d.quote ? 'Prepared for' : 'Bill to') + '</span><p><b>' + esc(d.cust.name) + '</b>' + (d.cust.address ? '<br>' + nl(d.cust.address) : '') + '</p></div>' +
        (d.job ? '<h2 class="job">' + esc(d.job) + '</h2>' : '') +
        '<table class="lines"><thead><tr><th>Description</th><th class="n hide-s">Qty</th><th class="n hide-s">Price' + (d.vat ? ' ex VAT' : '') + '</th><th class="n">Amount</th></tr></thead><tbody>' +
        d.items.map(it => '<tr><td>' + nl(it.desc) + '<span class="sub">' + it.qty + ' &times; ' + money(it.unit) + '</span></td>' +
          '<td class="n hide-s">' + it.qty + '</td><td class="n hide-s">' + money(it.unit) + '</td><td class="n">' + money(Q.lineTotal(it)) + '</td></tr>').join('') +
        '</tbody></table>' +
        '<dl class="sums">' + sums + '</dl>' +
        (d.notes ? '<div class="notes"><span class="lbl">Notes</span><p>' + nl(d.notes) + '</p></div>' : '') +
        money_ +
      '</article>' + reply + faqs +
      '<p class="foot">' + kind + ' from ' + esc(d.biz.name || who) + '.</p>';
  }
  function fail(msg) {
    document.title = 'Can’t open this document';
    root.innerHTML = '<article class="sheet fail"><h1>Can’t open this</h1><p>' + esc(msg) + '</p></article>';
  }

  async function start() {
    const raw = location.hash.slice(1);
    if (!raw) return fail('This link is missing its details. Ask whoever sent it to send it again.');
    try {
      render(clean(await Q.decode(raw)));
    } catch (e) {
      fail(e.message === 'old-browser'
        ? 'Your browser is too old to open this. Please try a different browser, or update this one.'
        : 'This link looks incomplete. It may have been cut short when it was copied. Ask whoever sent it to send it again.');
    }
  }

  /* ---------- interactions ---------- */
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]');
    if (c && navigator.clipboard) {
      navigator.clipboard.writeText(c.dataset.copy).then(() => {
        c.textContent = 'Copied';
        setTimeout(() => { c.textContent = 'Copy'; }, 1600);
      });
    }
    if (e.target.id === 'printBtn') window.print();
  });
  root.addEventListener('input', e => {
    if (e.target.id !== 'faqSearch') return;
    const words = e.target.value.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    let shown = 0;
    root.querySelectorAll('.faq-items details').forEach(el => {
      const hit = words.every(w => el.textContent.toLowerCase().indexOf(w) !== -1);
      el.hidden = !hit;
      if (hit) shown++;
    });
    document.getElementById('faqNone').hidden = shown > 0;
  });
  window.addEventListener('hashchange', start);
  start();
})();
