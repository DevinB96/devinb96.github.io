/* Quote to Invoice (app.html): quote, follow up, book, invoice and answer FAQs, for a trades firm.
   Everything is saved in this browser only (localStorage), so Settings offers a backup download.
   The app never sends anything by itself: it writes each message and opens the trader's own
   WhatsApp, messages or email app with it filled in. Quotes and invoices reach customers as links
   to view.html, with the document carried inside the link (see q2i.js). */
(function () {
  'use strict';
  const Q = window.Q2I;
  const { money, totals, today, addDays, daysBetween, fmtDate, fmtLong, fmtTime, esc, fill } = Q;
  const KEY = 'bps-quote-to-invoice-v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const clone = o => JSON.parse(JSON.stringify(o));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const view = $('#view');

  /* ---------- defaults ---------- */
  const SETTINGS = {
    myName: '', business: '', phone: '', email: '', address: '', website: '',
    vatRegistered: false, vatNumber: '', vatRate: 20,
    depositPct: 25, quoteValidDays: 30, paymentTermsDays: 14,
    quotePrefix: 'Q-', nextQuote: 1, invoicePrefix: 'INV-', nextInvoice: 1,
    bankName: '', sortCode: '', accountNumber: '', paymentLink: '',
    followUps: [
      { days: 3, text: 'Hi {first_name}, just checking the quote for {job} came through OK. Happy to answer any questions or talk through options.\n\n{sign_off}\n\nYour quote: {link}' },
      { days: 7, text: 'Hi {first_name}, hope you’re well. I’m planning my diary for the next few weeks. If you’d like to go ahead with {job}, let me know and I’ll send you some dates.\n\n{sign_off}\n\nYour quote: {link}' },
      { days: 14, text: 'Hi {first_name}, last check-in from me about {job}. If now isn’t the right time, no problem at all. Just let me know either way so I can plan my diary. The price is held until {valid_until}.\n\n{sign_off}\n\nYour quote: {link}' }
    ],
    templates: {
      quote: 'Hi {first_name},\n\nThanks for your time. Here’s your quote for {job}: {total}{vat_note}. The link below has the full breakdown, and you can accept it there too.\n\nAny questions, just reply to this message.\n\n{sign_off}\n\nYour quote: {link}',
      booking: 'Hi {first_name}, great news, you’re booked in for {job}. I’ll be with you on {start_date} at {start_time}{duration_note}.\n\n{deposit_note}I’ll send you a reminder the day before.\n\n{sign_off}',
      reminder: 'Hi {first_name}, just a reminder that I’ll be with you tomorrow, {start_date}, at {start_time} for {job}. If there’s anything I should know about parking or access, just reply here.\n\n{sign_off}',
      onMyWay: 'Hi {first_name}, I’m on my way to you now for {job}. See you shortly.\n\n{sign_off}',
      invoice: 'Hi {first_name},\n\nThanks for choosing {business}. Here’s your invoice {invoice_number} for {job}. The amount due is {amount_due}, by {due_date}. The link below has the payment details and a copy you can save.\n\n{sign_off}\n\nYour invoice: {link}',
      paymentReminder: 'Hi {first_name}, a friendly reminder that invoice {invoice_number} for {amount_due} was due on {due_date}. If you’ve already paid, thank you, and please ignore this message.\n\n{sign_off}\n\nPayment details: {link}',
      faqReply: 'Hi {first_name},\n\n{answer}\n\n{sign_off}',
      signOff: 'Thanks,\n{my_name}\n{business}'
    }
  };
  const SUBJECTS = {
    quote: 'Your quote for {job} from {business}',
    followUp: 'Your quote for {job}',
    booking: 'Booking confirmed: {job} on {start_date}',
    reminder: 'See you tomorrow: {job}',
    onMyWay: 'On my way',
    invoice: 'Invoice {invoice_number} from {business}',
    paymentReminder: 'Reminder: invoice {invoice_number}',
    faqReply: 'Your question about {job}'
  };
  const FAQS = [
    ['Do you need a deposit?', '{deposit_answer} The rest is due within {payment_terms} days of the job being finished.', 'deposit, upfront, advance, pay first, secure, booking fee', true, false],
    ['When can you start?', 'I’m usually booking a couple of weeks ahead. As soon as you accept the quote I’ll send you the first dates I have free and confirm them in writing.', 'start, available, availability, soon, date, book, diary, wait, earliest', true, false],
    ['Is the work guaranteed?', 'Yes. All my workmanship is guaranteed for 12 months, and parts carry the manufacturer’s warranty. If anything isn’t right, call me and I’ll come back and sort it.', 'guarantee, warranty, go wrong, problem, comeback, fault, broken', true, false],
    ['Does the price include VAT?', 'The quote shows the full price you’ll pay. If VAT applies, it’s shown as its own line and included in the total.', 'vat, tax, include, inclusive, plus, extra', false, true],
    ['What if the job costs more than quoted?', 'The price is fixed for the work described on the quote. If I find something unexpected, or you’d like changes, I’ll explain the cost and get your OK before doing any extra work.', 'extra, more, increase, change, variation, additional, unexpected, hidden, fixed', true, false],
    ['How can I pay?', 'Bank transfer is easiest. The details are on your invoice, and please use the invoice number as the reference. Payment is due within {payment_terms} days.', 'pay, payment, card, cash, bank, transfer, methods, invoice, due', false, true],
    ['Are you insured?', 'Yes, I have public liability insurance and I’m happy to send you a copy of the certificate.', 'insurance, insured, liability, cover, covered', false, false],
    ['How long is the quote valid?', 'The price on your quote is held for {quote_valid_days} days from the date on it.', 'valid, expire, expiry, how long, price, hold, still', false, false],
    ['Will you tidy up and take the waste away?', 'Yes. I use dust sheets, tidy up at the end of each day and take away all the waste from the job, unless the quote says otherwise.', 'mess, tidy, clean, dust, rubbish, waste, skip, dirt', false, false],
    ['Do I need to be at home?', 'Someone needs to let me in on the first morning. After that, plenty of customers leave a key, whatever suits you.', 'home, in, access, keys, key, present, work, out', false, false],
    ['Will I get a certificate?', 'Yes. You’ll get every certificate the work needs, and I’ll notify Building Control where that’s required.', 'certificate, certification, paperwork, building control, regs, regulations, compliance', false, false],
    ['Can I change the date or cancel?', 'Of course, just let me know as early as you can and I’ll find you a new date. If materials have already been ordered for your job, I may need to charge for those.', 'cancel, reschedule, postpone, change, move, date, rearrange', false, false]
  ].map((f, i) => ({ id: 'faq' + (i + 1), q: f[0], a: f[1], keywords: f[2], onQuote: f[3], onInvoice: f[4] }));
  const PLACEHOLDERS = [
    ['first_name', 'Customer’s first name'], ['name', 'Customer’s full name'], ['job', 'Job title'],
    ['business', 'Your business name'], ['my_name', 'Your first name'], ['phone', 'Your mobile'],
    ['quote_number', 'Quote number'], ['total', 'Quote total'], ['vat_note', '“ including VAT” if you charge VAT'],
    ['deposit', 'Deposit amount'], ['valid_until', 'Date the quote price runs out'],
    ['start_date', 'Booked start date'], ['start_time', 'Arrival time'], ['duration_note', '“, for about 3 days” on longer jobs'],
    ['deposit_note', 'Deposit request with your bank details, or a thank-you once it’s paid'],
    ['invoice_number', 'Invoice number'], ['amount_due', 'Amount left to pay'], ['due_date', 'Invoice due date'],
    ['link', 'Link to the quote or invoice'], ['sign_off', 'Your sign-off (set below)'], ['answer', 'The FAQ answers you pick (question replies only)']
  ];
  const TEMPLATES = [
    ['quote', 'Sending a quote', 'Put {link} somewhere in the message. It opens the quote.'],
    ['booking', 'Booking confirmation', 'Sent when you book the job in.'],
    ['reminder', 'Day-before reminder', 'Offered the day before the job starts.'],
    ['onMyWay', 'On my way', 'For the morning of the job.'],
    ['invoice', 'Sending an invoice', 'Put {link} in the message. It opens the invoice and payment details.'],
    ['paymentReminder', 'Payment reminder', 'Offered on the due date, then once a week while it’s unpaid.'],
    ['faqReply', 'Answering a question', '{answer} becomes the FAQ answers you pick.'],
    ['signOff', 'Sign-off', 'Used wherever a message says {sign_off}.']
  ];
  const EXAMPLE_BUSINESS = {
    myName: 'Alex', business: 'Example Electrical', phone: '07700 900000', email: 'hello@example.com',
    address: '1 High Street, Guildford GU1 3AA', website: 'www.example.com',
    vatRegistered: true, vatNumber: 'GB 123 4567 89', vatRate: 20,
    bankName: 'Example Electrical Ltd', sortCode: '12-34-56', accountNumber: '12345678', nextQuote: 102, nextInvoice: 44
  };
  const STATUS = { draft: 'Draft quote', quoted: 'Quote sent', won: 'Accepted', booked: 'Booked', invoiced: 'Invoiced', paid: 'Paid', lost: 'Lost' };
  const STEPS = ['Quote', 'Follow up', 'Book', 'Invoice', 'Paid'];
  const STEP_OF = { draft: 0, quoted: 1, won: 2, booked: 3, invoiced: 4, paid: 5 };
  const LOST_REASONS = ['No reply', 'Price', 'Went with someone else', 'Timing, maybe later', 'Changed their mind', 'Other'];
  const VIA = { whatsapp: ' by WhatsApp', text: ' by text', email: ' by email' };
  const via = ch => VIA[ch] || '';

  /* ---------- state ---------- */
  let storageOk = true;
  let state = load();
  const ui = { filter: 'all', search: '', editQuote: {}, rebook: {}, askText: '', askJob: '', focus: '' };
  let route = { view: 'today', id: null };
  let composing = null;

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { storageOk = false; }
    return normalise(saved);
  }
  function normalise(saved) {
    saved = saved && typeof saved === 'object' ? saved : {};
    const ss = saved.settings || {};
    const s = Object.assign(clone(SETTINGS), ss);
    s.templates = Object.assign(clone(SETTINGS.templates), ss.templates || {});
    if (!Array.isArray(s.followUps)) s.followUps = clone(SETTINGS.followUps);
    return {
      settings: s,
      faqs: Array.isArray(saved.faqs) ? saved.faqs : clone(FAQS),
      jobs: (Array.isArray(saved.jobs) ? saved.jobs : []).map(fixJob),
      exampleSettings: !!saved.exampleSettings,
      lastBackup: saved.lastBackup || ''
    };
  }
  function fixJob(j) {
    j.customer = Object.assign({ name: '', phone: '', email: '', address: '' }, j.customer);
    j.quote = Object.assign({ number: '', items: [], notes: '', depositPct: 0, validDays: 30 }, j.quote);
    if (j.invoice) j.invoice.reminders = j.invoice.reminders || [];
    j.title = j.title || '';
    j.followUps = j.followUps || [];
    j.log = j.log || [];
    return j;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; } catch (e) { storageOk = false; }
    $('#storageWarn').hidden = storageOk;
  }
  // Apply a change, save, redraw, and offer Undo.
  function change(label, fn) {
    const before = JSON.stringify(state);
    fn();
    save();
    render();
    toast(label, () => { state = normalise(JSON.parse(before)); save(); render(); toast('Undone'); });
  }

  /* ---------- job helpers ---------- */
  const job = id => state.jobs.find(j => j.id === id) || null;
  const currentJob = () => route.view === 'job' ? job(route.id) : null;
  function log(j, text) { j.log.unshift({ at: new Date().toISOString(), text }); j.updatedAt = Date.now(); }
  const currentVat = () => state.settings.vatRegistered ? +state.settings.vatRate || 0 : 0;
  // A document keeps the VAT rate it was sent with. Unsent ones follow the current setting.
  const docVat = d => d && d.sentOn ? +d.vatRate || 0 : currentVat();
  const quoteTotals = j => totals(j.quote.items, docVat(j.quote), j.quote.depositPct);
  const invoiceTotals = j => totals(j.invoice.items, docVat(j.invoice), 0, j.invoice.depositPaid);
  const jobValue = j => j.invoice ? invoiceTotals(j).total : quoteTotals(j).total;
  const docNumber = (prefix, n) => prefix + String(n).padStart(4, '0');
  const bookingEnd = j => addDays(j.booking.date, (+j.booking.days || 1) - 1);
  const invoiceDue = j => addDays(j.invoice.issuedOn, +j.invoice.termsDays || 0);
  const realLines = items => items.filter(i => String(i.desc).trim() || +i.unit);
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
  const bankReady = () => !!(state.settings.sortCode && state.settings.accountNumber);

  function nextFollowUp(j) {
    const steps = state.settings.followUps, i = j.followUps.length;
    if (i >= steps.length || !j.quote.sentOn) return null;
    let due = addDays(j.quote.sentOn, +steps[i].days || 0);
    const last = j.followUps[i - 1];
    if (last && daysBetween(last.on, due) < 2) due = addDays(last.on, 2); // keep chasers at least 2 days apart
    return { step: i, of: steps.length, due, text: steps[i].text };
  }
  const lastContact = j => (j.followUps.length ? j.followUps[j.followUps.length - 1].on : j.quote.sentOn);

  function isBlank(j) {
    const c = j.customer;
    return j.status === 'draft' && !j.title && !c.name && !c.phone && !c.email && !realLines(j.quote.items).length;
  }

  // Values for {placeholders} in messages and FAQ answers. Works without a job too.
  function vars(j, extra) {
    const s = state.settings;
    const v = {
      business: s.business || 'us', my_name: s.myName, phone: s.phone, email: s.email,
      payment_terms: s.paymentTermsDays, quote_valid_days: s.quoteValidDays, deposit_pct: s.depositPct,
      first_name: 'there', name: '', job: 'your job',
      deposit_answer: +s.depositPct > 0
        ? 'For most jobs I ask for a ' + s.depositPct + '% deposit to secure your start date, and it comes off the final invoice.'
        : 'There’s no deposit to pay.'
    };
    if (j) {
      const c = j.customer, q = j.quote, qt = quoteTotals(j);
      v.name = c.name;
      v.first_name = c.name.trim().split(/\s+/)[0] || 'there';
      v.job = j.title || 'your job';
      v.quote_number = q.number;
      v.total = money(qt.total);
      v.vat_note = docVat(q) ? ' including VAT' : '';
      v.deposit = money(qt.deposit);
      v.deposit_pct = +q.depositPct || 0;
      v.valid_until = fmtLong(addDays(q.sentOn || today(), q.validDays));
      v.deposit_answer = qt.deposit
        ? 'Yes, a deposit of ' + money(qt.deposit) + ' secures your start date, and it comes off the final invoice.'
        : 'There’s no deposit to pay for this job.';
      if (j.booking) {
        const b = j.booking;
        v.start_date = fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' });
        v.start_time = fmtTime(b.start);
        v.days = b.days;
        v.duration_note = b.days > 1 ? ', for about ' + b.days + ' days' : '';
        v.deposit_note = depositNote(j, qt);
      }
      if (j.invoice) {
        v.invoice_number = j.invoice.number;
        v.amount_due = money(invoiceTotals(j).balance);
        v.due_date = fmtLong(addDays(j.invoice.issuedOn || today(), j.invoice.termsDays));
      }
    }
    v.sign_off = fill(s.templates.signOff, Object.assign({}, v, { business: s.business }));
    return Object.assign(v, extra);
  }
  function depositNote(j, qt) {
    if (!qt.deposit) return '';
    if (j.booking.depositPaid) return 'Thanks for your deposit of ' + money(qt.deposit) + '.\n\n';
    const s = state.settings;
    const bank = bankReady() ? ' by bank transfer to ' + (s.bankName || s.business) + ', sort code ' + s.sortCode +
      ', account ' + s.accountNumber + ', with ' + j.quote.number + ' as the reference' : '';
    return 'To secure the date, please pay the ' + money(qt.deposit) + ' deposit' + bank + '.\n\n';
  }

  // The customer-facing link (format described in q2i.js).
  async function docLink(j, type, preview) {
    const s = state.settings, isInv = type === 'i', d = isInv ? j.invoice : j.quote, v = vars(j);
    const issued = (isInv ? d.issuedOn : d.sentOn) || today();
    const data = {
      v: 1, t: type,
      b: { n: s.business, w: s.myName, p: s.phone, e: s.email, a: s.address, s: s.website, vn: s.vatRegistered ? s.vatNumber : '' },
      c: { n: j.customer.name, a: j.customer.address },
      no: d.number, j: j.title, d: issued,
      x: addDays(issued, isInv ? d.termsDays : d.validDays),
      it: realLines(d.items).map(i => [i.desc, +i.qty || 0, +i.unit || 0]),
      vr: docVat(d), nt: d.notes || '',
      f: state.faqs.filter(f => (isInv ? f.onInvoice : f.onQuote) && f.q && f.a).map(f => [fill(f.q, v), fill(f.a, v)])
    };
    if (isInv) { data.sd = d.supplyDate; data.pd = +d.depositPaid || 0; data.pl = Q.safeUrl(s.paymentLink); }
    else data.dp = +d.depositPct || 0;
    if ((isInv || quoteTotals(j).deposit) && bankReady()) data.bk = { an: s.bankName || s.business, sc: s.sortCode, ac: s.accountNumber };
    if (preview) data.pv = 1;
    return new URL('view.html', location.href).href + '#' + await Q.encode(data);
  }
  // Open a quote or invoice in a new tab. The tab opens straight away so pop-up blockers allow it.
  function openDoc(j, type, preview) {
    const w = window.open('', '_blank');
    let doc = j;
    if (preview) {
      doc = clone(j);
      const s = state.settings, d = type === 'q' ? doc.quote : doc.invoice;
      if (!d.number) d.number = type === 'q' ? docNumber(s.quotePrefix, s.nextQuote) : docNumber(s.invoicePrefix, s.nextInvoice);
      if (type === 'i' && !d.issuedOn) d.issuedOn = today();
    }
    docLink(doc, type, preview).then(url => {
      if (w) { w.opener = null; w.location.href = url; } else location.assign(url);
    });
  }

  /* ---------- the to-do list ---------- */
  function todo() {
    const t = today(), out = [];
    const add = (j, due, title, btn, kind) => out.push({ j, due, title, btn, kind });
    state.jobs.forEach(j => {
      if (j.status === 'draft') add(j, j.createdOn || t, 'Finish and send the quote', 'Open quote', 'open');
      if (j.status === 'quoted' && !j.followPaused) {
        const nf = nextFollowUp(j);
        if (nf && nf.due <= t) add(j, nf.due, 'Send follow-up ' + (nf.step + 1) + ' of ' + nf.of, 'Write follow-up', 'follow');
        if (!nf) {
          const due = addDays(lastContact(j), 7);
          if (due <= t && !(j.quietUntil > t)) add(j, due, 'No reply after the last follow-up. Keep it open or mark it lost?', 'Decide', 'open');
        }
      }
      if (j.status === 'won') {
        if (j.invoice) add(j, j.wonOn || t, 'Finish and send the invoice', 'Open invoice', 'open');
        else add(j, j.wonOn || t, 'They said yes. Book the job in', 'Book it in', 'open');
      }
      if (j.status === 'booked') {
        const b = j.booking, end = bookingEnd(j);
        if (b.date === addDays(t, 1) && !b.reminderSent) add(j, t, 'Starts tomorrow. Send a reminder', 'Write reminder', 'remind');
        if (b.date === t && !b.onMyWaySent) add(j, t, 'On site today at ' + fmtTime(b.start), 'On my way text', 'omw');
        if (end <= t) add(j, end, j.invoice ? 'Finish and send the invoice' : 'Job finished? Send the invoice', j.invoice ? 'Open invoice' : 'Create invoice', 'invoice');
      }
      if (j.status === 'invoiced') {
        const due = invoiceDue(j), last = j.invoice.reminders[j.invoice.reminders.length - 1];
        const next = last ? addDays(last, 7) : due;
        if (next <= t) add(j, next, 'Invoice ' + j.invoice.number + ' is unpaid (' + money(invoiceTotals(j).balance) + ')', 'Write reminder', 'chase');
      }
    });
    return out.sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
  }
  function nextText(j) {
    const t = today();
    switch (j.status) {
      case 'draft': return 'Not sent yet';
      case 'quoted': {
        if (j.followPaused) return 'They replied. Follow-ups paused';
        const nf = nextFollowUp(j);
        return nf ? 'Follow-up ' + (nf.step + 1) + (nf.due <= t ? ' due now' : ' on ' + fmtDate(nf.due)) : 'All follow-ups sent';
      }
      case 'won': return j.invoice ? 'Invoice not sent yet' : 'Needs booking in';
      case 'booked': return fmtDate(j.booking.date) + ', ' + fmtTime(j.booking.start);
      case 'invoiced': { const due = invoiceDue(j); return due < t ? 'Overdue since ' + fmtDate(due) : 'Due ' + fmtDate(due); }
      case 'paid': return 'Paid ' + fmtDate(j.invoice.paidOn);
      case 'lost': return j.lostReason || 'Lost';
    }
    return '';
  }

  /* ---------- small templates ---------- */
  const fact = (k, v) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>';
  const fld = (label, inner, hint) => '<label class="fld"><span class="mono">' + label + '</span>' + inner + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
  const dueLabel = due => {
    const late = daysBetween(due, today());
    return late > 0 ? '<span class="due late">' + (late === 1 ? '1 day late' : late + ' days late') + '</span>'
      : late === 0 ? '<span class="due now">Today</span>' : '<span class="due">' + esc(fmtDate(due)) + '</span>';
  };

  /* ---------- views ---------- */
  function renderToday() {
    const s = state.settings, t = today(), list = todo();
    const by = st => state.jobs.filter(j => j.status === st);
    const sum = (arr, f) => arr.reduce((n, j) => n + f(j), 0);
    const quoted = by('quoted'), won = by('won'), invoiced = by('invoiced');
    const booked = by('booked').sort((a, b) => a.booking.date < b.booking.date ? -1 : 1);
    const upcoming = booked.filter(j => bookingEnd(j) >= t).slice(0, 6);
    const overdue = invoiced.filter(j => invoiceDue(j) < t).length;
    const stat = (label, value, sub, filter, warn) =>
      '<a class="stat' + (warn ? ' warn' : '') + '" href="#jobs" data-filter="' + filter + '"><span class="mono">' + label + '</span><b>' + esc(value) + '</b><small>' + esc(sub) + '</small></a>';
    view.innerHTML =
      '<div class="page-head"><span class="mono tag">' + esc(fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' })) + '</span><h1>Today</h1></div>' +
      (!s.business ? '<div class="card welcome"><h2 class="card-h">Welcome. Let’s get you set up.</h2>' +
        '<p>Add your business details once and every quote, invoice and message uses them. It takes about two minutes.</p>' +
        '<div class="btn-row"><a class="btn" href="#settings">Add my details &rarr;</a>' +
        (state.jobs.length ? '' : '<button class="btn out" type="button" data-act="example">Try it with example jobs</button>') + '</div></div>' : '') +
      '<div class="stats">' +
        stat('Quotes out', money(sum(quoted, j => quoteTotals(j).total)), plural(quoted.length, 'quote') + ' waiting', 'quoted') +
        stat('To book in', String(won.length), won.length ? 'accepted, not booked' : 'nothing waiting', 'won') +
        stat('Booked', String(booked.length), upcoming[0] ? 'next ' + fmtDate(upcoming[0].booking.date) : 'no jobs booked', 'booked') +
        stat('Owed to you', money(sum(invoiced, j => invoiceTotals(j).balance)), overdue ? overdue + ' overdue' : plural(invoiced.length, 'invoice') + ' out', 'invoiced', overdue) +
      '</div>' +
      '<h2 class="sec-h">To do' + (list.length ? ' <span class="count">' + list.length + '</span>' : '') + '</h2>' +
      (list.length ? '<ul class="acts">' + list.map(a =>
        '<li class="act">' + dueLabel(a.due) +
        '<div class="what"><b>' + esc(a.title) + '</b><a href="#job/' + a.j.id + '">' + esc(a.j.title || 'Untitled job') + ' · ' + esc(a.j.customer.name || 'no customer yet') + '</a></div>' +
        '<button class="btn sm" type="button" data-act="todo" data-kind="' + a.kind + '" data-id="' + a.j.id + '">' + esc(a.btn) + '</button></li>').join('') + '</ul>'
        : '<div class="empty-state"><p>Nothing to chase right now. Every quote, job and invoice is up to date.</p><button class="btn" type="button" data-act="new">+ New quote</button></div>') +
      (upcoming.length ? '<h2 class="sec-h">Coming up</h2><ul class="upcoming">' + upcoming.map(j =>
        '<li><a href="#job/' + j.id + '"><span class="mono">' + esc(fmtDate(j.booking.date)) + '</span><b>' + esc(j.title) + '</b><span>' +
        esc(fmtTime(j.booking.start) + (j.booking.days > 1 ? ', ' + j.booking.days + ' days' : '') + ' · ' + j.customer.name) + '</span></a></li>').join('') + '</ul>' : '');
  }

  function renderJobs() {
    const counts = {};
    state.jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    const chips = [['all', 'All', state.jobs.length]].concat(Object.keys(STATUS).filter(k => counts[k] || ui.filter === k).map(k => [k, STATUS[k], counts[k] || 0]));
    view.innerHTML =
      '<div class="page-head"><span class="mono tag">' + plural(state.jobs.length, 'job') + '</span><h1>Jobs</h1></div>' +
      '<div class="toolbar"><input type="search" id="jobSearch" placeholder="Search by customer, job or number" aria-label="Search jobs" value="' + esc(ui.search) + '">' +
      '<div class="filters" role="group" aria-label="Show jobs by stage">' + chips.map(c =>
        '<button class="chip" type="button" data-act="filter" data-f="' + c[0] + '" aria-pressed="' + (ui.filter === c[0]) + '">' + c[1] + '<span class="n">' + c[2] + '</span></button>').join('') +
      '</div></div><ul class="job-list" id="jobList"></ul>';
    paintJobList();
  }
  function paintJobList() {
    const q = ui.search.trim().toLowerCase();
    const rows = state.jobs
      .filter(j => ui.filter === 'all' || j.status === ui.filter)
      .filter(j => !q || [j.title, j.customer.name, j.customer.address, j.quote.number, j.invoice && j.invoice.number].join(' ').toLowerCase().indexOf(q) !== -1)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    $('#jobList').innerHTML = rows.length ? rows.map(j =>
      '<li><a class="job-row" href="#job/' + j.id + '">' +
      '<span class="t">' + esc(j.title || 'Untitled job') + '</span>' +
      '<span class="pill s-' + j.status + '">' + STATUS[j.status] + '</span>' +
      '<span class="c">' + esc(j.customer.name || 'No customer yet') + (j.quote.number ? ' · ' + esc(j.quote.number) : '') + '</span>' +
      '<span class="v">' + money(jobValue(j)) + '</span>' +
      '<span class="nx">' + esc(nextText(j)) + '</span></a></li>').join('')
      : '<li class="empty-state"><p>' + (state.jobs.length ? 'No jobs match.' : 'No jobs yet. Everything starts with a quote.') + '</p>' +
        (state.jobs.length ? '' : '<button class="btn" type="button" data-act="new">+ New quote</button>') + '</li>';
  }

  function renderJob(id) {
    const j = job(id);
    if (!j) {
      view.innerHTML = '<div class="page-head"><h1>Job not found</h1><p>It may have been deleted. <a href="#jobs">Back to all jobs</a></p></div>';
      return;
    }
    const step = STEP_OF[j.status];
    view.innerHTML =
      '<div class="page-head job-head"><a class="back mono" href="#jobs">&larr; All jobs</a>' +
      '<h1 id="jobTitle">' + esc(j.title || 'New quote') + '</h1>' +
      (j.status === 'lost' ? '<p class="pill s-lost">Lost</p>'
        : '<ol class="track" aria-label="Progress">' + STEPS.map((s, i) =>
          '<li class="' + (i < step ? 'done' : i === step ? 'now' : '') + '"' + (i === step ? ' aria-current="step"' : '') + '>' + s + '</li>').join('') + '</ol>') +
      '</div><div class="job-grid"><div class="col-main">' + stagePanels(j) + '</div>' +
      '<aside class="col-side">' + (j.status === 'draft' ? '' : detailsCard(j)) + sideCard(j) + logCard(j) + '</aside></div>';
  }
  function stagePanels(j) {
    switch (j.status) {
      case 'draft': return detailsCard(j) + quoteEditor(j, false);
      case 'quoted': return ui.editQuote[j.id] ? quoteEditor(j, true) : quoteCard(j) + followCard(j) + decideCard();
      case 'won': return j.invoice ? invoiceEditor(j) : bookingForm(j);
      case 'booked': return (ui.rebook[j.id] ? bookingForm(j) : bookedCard(j)) + (j.invoice ? invoiceEditor(j) : '');
      case 'invoiced': return invoiceCard(j);
      case 'paid': return paidCard(j);
      case 'lost': return lostCard(j) + quoteCard(j);
    }
    return '';
  }

  function detailsCard(j) {
    const c = j.customer;
    const quick = [
      c.phone && '<a href="' + esc(Q.telHref(c.phone)) + '">Call</a>',
      c.phone && '<a href="' + esc(Q.waHref(c.phone, '')) + '" target="_blank" rel="noopener">WhatsApp</a>',
      c.email && '<a href="' + esc(Q.mailHref(c.email, j.title, '')) + '">Email</a>'
    ].filter(Boolean).join('');
    return '<div class="card"><h2 class="card-h">Customer and job</h2>' +
      fld('Customer name', '<input data-cust="name" autocomplete="off" value="' + esc(c.name) + '">') +
      '<div class="two">' + fld('Mobile', '<input data-cust="phone" type="tel" autocomplete="off" value="' + esc(c.phone) + '">') +
      fld('Email', '<input data-cust="email" type="email" autocomplete="off" value="' + esc(c.email) + '">') + '</div>' +
      fld('Address', '<textarea data-cust="address" rows="2">' + esc(c.address) + '</textarea>') +
      fld('Job', '<input data-job="title" placeholder="e.g. Kitchen rewire" value="' + esc(j.title) + '">') +
      (quick ? '<div class="quick">' + quick + '</div>' : '') + '</div>';
  }

  function itemsEditor(j, doc) {
    const vr = docVat(j[doc]);
    return '<div class="items" role="group" aria-label="Line items">' +
      '<div class="item head mono" aria-hidden="true"><span>Description</span><span>Qty</span><span>Price' + (vr ? ' ex VAT' : '') + '</span><span>Total</span><span></span></div>' +
      j[doc].items.map((it, i) =>
        '<div class="item"><textarea rows="1" data-doc="' + doc + '" data-item="' + i + '" data-ik="desc" aria-label="Line ' + (i + 1) + ' description" placeholder="e.g. Supply and fit double socket">' + esc(it.desc) + '</textarea>' +
        '<label class="mini"><span class="mono">Qty</span><input type="number" min="0" step="any" inputmode="decimal" data-doc="' + doc + '" data-item="' + i + '" data-ik="qty" value="' + esc(it.qty) + '"></label>' +
        '<label class="mini"><span class="mono">Price £</span><input type="number" min="0" step="0.01" inputmode="decimal" data-doc="' + doc + '" data-item="' + i + '" data-ik="unit" value="' + esc(it.unit) + '"></label>' +
        '<span class="lt" data-lt="' + doc + '-' + i + '">' + money(Q.lineTotal(it)) + '</span>' +
        '<button class="x" type="button" data-act="del-item" data-doc="' + doc + '" data-i="' + i + '" aria-label="Remove line ' + (i + 1) + '">&times;</button></div>').join('') +
      '<button class="link add" type="button" data-act="add-item" data-doc="' + doc + '">+ Add a line</button></div>';
  }
  function sumsHtml(j, doc) {
    const isQ = doc === 'quote', d = j[doc], t = isQ ? quoteTotals(j) : invoiceTotals(j), vr = docVat(d);
    const row = (k, v, cls) => '<div' + (cls ? ' class="' + cls + '"' : '') + '><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    return (vr ? row('Subtotal', money(t.subtotal)) + row('VAT at ' + vr + '%', money(t.vat)) : '') +
      row(vr ? 'Total including VAT' : 'Total', money(t.total), isQ || !t.paid ? 'total' : '') +
      (isQ ? (t.deposit ? row('Deposit to book (' + (+d.depositPct) + '%)', money(t.deposit)) : '')
        : (t.paid ? row('Less deposit paid', '&minus;' + money(t.paid)) + row('Balance due', money(t.balance), 'total') : ''));
  }
  function paintSums(j, doc) {
    const box = $('#sums-' + doc);
    if (box) box.innerHTML = sumsHtml(j, doc);
    if ($('#jobValue')) $('#jobValue').textContent = money(jobValue(j));
    j[doc].items.forEach((it, i) => { const el = $('[data-lt="' + doc + '-' + i + '"]'); if (el) el.textContent = money(Q.lineTotal(it)); });
  }

  function quoteEditor(j, editing) {
    const q = j.quote;
    return '<div class="card"><h2 class="card-h">' + (editing ? 'Edit the quote' : 'Quote') + '<span class="mono">' + (q.number ? esc(q.number) : 'Numbered when sent') + '</span></h2>' +
      itemsEditor(j, 'quote') +
      '<div class="two">' +
        fld('Deposit to book (%)', '<input type="number" min="0" max="100" step="1" inputmode="numeric" data-doc="quote" data-dk="depositPct" value="' + esc(q.depositPct) + '">') +
        fld('Price held for (days)', '<input type="number" min="1" step="1" inputmode="numeric" data-doc="quote" data-dk="validDays" value="' + esc(q.validDays) + '">') +
      '</div>' +
      fld('Notes for the customer', '<textarea data-doc="quote" data-dk="notes" rows="3" placeholder="What’s included, what isn’t, materials, access">' + esc(q.notes) + '</textarea>') +
      '<dl class="sums" id="sums-quote">' + sumsHtml(j, 'quote') + '</dl>' +
      (!docVat(q) && !q.sentOn ? '<p class="hint">No VAT added. If you’re VAT registered, switch it on in <a href="#settings">Settings</a>.</p>' : '') +
      '<div class="btn-row"><button class="btn" type="button" data-act="send-quote">' + (editing ? 'Send the new quote' : 'Send quote') + ' &rarr;</button>' +
      '<button class="btn out" type="button" data-act="preview" data-t="q">Preview</button>' +
      (editing ? '<button class="link" type="button" data-act="cancel-edit">Cancel changes</button>' : '') + '</div></div>';
  }
  function quoteCard(j) {
    const q = j.quote, t = quoteTotals(j), exp = addDays(q.sentOn, q.validDays);
    return '<div class="card"><h2 class="card-h">Quote ' + esc(q.number) + '<span class="mono">Sent ' + esc(fmtDate(q.sentOn)) + '</span></h2>' +
      '<dl class="facts">' + fact('Total', money(t.total) + (docVat(q) ? ' inc VAT' : '')) +
      (t.deposit ? fact('Deposit to book', money(t.deposit)) : '') +
      fact(exp < today() ? 'Price expired' : 'Price held until', fmtDate(exp, { day: 'numeric', month: 'long' })) + '</dl>' +
      '<div class="btn-row"><button class="btn out sm" type="button" data-act="view-doc" data-t="q">View quote</button>' +
      (j.status === 'quoted' ? '<button class="btn out sm" type="button" data-act="edit-quote">Change and resend</button>' : '') + '</div></div>';
  }
  function followCard(j) {
    const steps = state.settings.followUps, t = today(), nf = nextFollowUp(j);
    const rows = steps.map((st, i) => {
      const done = j.followUps[i];
      let status = 'Due ' + fmtDate(addDays(j.quote.sentOn, +st.days || 0)), cls = '';
      if (done) { status = 'Sent ' + fmtDate(done.on) + via(done.ch); cls = 'done'; }
      else if (nf && nf.step === i) {
        status = j.followPaused ? 'Paused' : nf.due < t ? 'Was due ' + fmtDate(nf.due) : nf.due === t ? 'Due today' : 'Due ' + fmtDate(nf.due);
        if (!j.followPaused && nf.due <= t) cls = 'is-due';
      }
      return '<li class="' + cls + '"><span class="n">' + (i + 1) + '</span><div><b>Follow-up ' + (i + 1) + '</b><span>' + esc(status) + '</span></div></li>';
    }).join('');
    let foot;
    if (j.followPaused) foot = '<p class="hint">Paused because the customer got back to you. Turn them back on if they go quiet again.</p><div class="btn-row"><button class="btn out sm" type="button" data-act="resume">Turn follow-ups back on</button></div>';
    else if (nf) foot = '<div class="btn-row"><button class="btn sm" type="button" data-act="follow-now">Write follow-up ' + (nf.step + 1) + (nf.due > t ? ' now' : '') + '</button>' +
      '<button class="btn out sm" type="button" data-act="pause">They replied, pause these</button></div>';
    else foot = '<p class="hint">All follow-ups sent. If they don’t get back to you, mark the quote as lost below, or keep it open for another week.</p>' +
      '<div class="btn-row"><button class="btn out sm" type="button" data-act="keep-open">Keep it open another week</button></div>';
    return '<div class="card"><h2 class="card-h">Follow-ups<span class="mono">Stop when they reply</span></h2>' +
      (steps.length ? '<ol class="fu-list">' + rows + '</ol>' : '<p class="hint">No follow-ups set up. Add some in <a href="#settings">Settings</a>.</p>') + foot + '</div>';
  }
  function decideCard() {
    return '<div class="card"><h2 class="card-h">Did they say yes?</h2>' +
      '<div class="btn-row"><button class="btn" type="button" data-act="won">Yes, they accepted &check;</button></div>' +
      '<div class="lost-row">' + fld('Or mark it lost', '<select id="lostReason">' + LOST_REASONS.map(r => '<option>' + r + '</option>').join('') + '</select>') +
      '<button class="btn out sm" type="button" data-act="lost">Mark lost</button></div></div>';
  }
  function lostCard(j) {
    return '<div class="card"><h2 class="card-h">Lost<span class="mono">' + esc(fmtDate(j.lostOn)) + '</span></h2>' +
      '<p>Reason: ' + esc(j.lostReason || 'not given') + '.</p>' +
      '<div class="btn-row"><button class="btn out sm" type="button" data-act="reopen">Reopen the quote</button></div></div>';
  }

  function bookingForm(j) {
    const b = j.booking || {}, t = quoteTotals(j), re = !!ui.rebook[j.id];
    return '<div class="card"><h2 class="card-h">' + (re ? 'Change the date' : 'Book the job in') +
      (j.wonOn && !re ? '<span class="mono">Accepted ' + esc(fmtDate(j.wonOn)) + '</span>' : '') + '</h2>' +
      (re ? '' : '<p>Pick a start date and the confirmation is written for you.</p>') +
      '<div class="three">' +
        fld('Start date', '<input type="date" id="bkDate" value="' + esc(b.date || '') + '">') +
        fld('Arrive at', '<input type="time" id="bkStart" value="' + esc(b.start || '08:00') + '">') +
        fld('Finish about', '<input type="time" id="bkEnd" value="' + esc(b.end || '16:00') + '">') +
      '</div><div class="two">' +
        fld('Days on site', '<input type="number" id="bkDays" min="1" step="1" inputmode="numeric" value="' + esc(b.days || 1) + '">') +
        (t.deposit ? '<label class="check"><input type="checkbox" id="bkDeposit"' + (b.depositPaid ? ' checked' : '') + '> The ' + money(t.deposit) + ' deposit is already paid</label>' : '<span></span>') +
      '</div><div class="btn-row">' +
        '<button class="btn" type="button" data-act="book" data-send="1">' + (re ? 'Save and tell the customer' : 'Book and send confirmation') + ' &rarr;</button>' +
        '<button class="btn out" type="button" data-act="book">' + (re ? 'Save without a message' : 'Book without a message') + '</button>' +
        (re ? '<button class="link" type="button" data-act="cancel-rebook">Cancel</button>' : '') +
      '</div>' +
      (!re && !j.invoice ? '<p class="hint">Job already done? <button class="link" type="button" data-act="start-invoice">Skip booking and invoice now</button></p>' : '') + '</div>';
  }
  function calendar(j) {
    const b = j.booking, c = j.customer;
    const day = b.date.replace(/-/g, '');
    const hm = t => t.replace(':', '') + '00';
    const start = b.start || '08:00';
    let end = b.end || '';
    if (!end || end <= start) {
      const m = Math.min(+start.slice(0, 2) * 60 + +start.slice(3) + 60, 23 * 60 + 59);
      end = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    }
    const title = [j.title, c.name].filter(Boolean).join(' · ');
    const details = [c.name, c.phone, c.email, j.quote.number && 'Quote ' + j.quote.number].filter(Boolean).join('\n');
    const place = (c.address || '').replace(/\s*\n\s*/g, ', ');
    const rrule = b.days > 1 ? 'RRULE:FREQ=DAILY;COUNT=' + b.days : '';
    const google = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + day + 'T' + hm(start) + '/' + day + 'T' + hm(end) + '&details=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent(place) + (rrule ? '&recur=' + encodeURIComponent(rrule) : '');
    const ic = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Brooks Process Solutions//Quote to Invoice//EN', 'BEGIN:VEVENT',
      'UID:' + j.id + '-' + day + '@quote-to-invoice', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d+/g, ''),
      'DTSTART:' + day + 'T' + hm(start), 'DTEND:' + day + 'T' + hm(end)]
      .concat(rrule ? [rrule] : [], ['SUMMARY:' + ic(title), 'LOCATION:' + ic(place), 'DESCRIPTION:' + ic(details), 'END:VEVENT', 'END:VCALENDAR']).join('\r\n');
    return { google, ics };
  }
  function bookedCard(j) {
    const b = j.booking, qt = quoteTotals(j), end = bookingEnd(j);
    return '<div class="card"><h2 class="card-h">Booked<span class="mono">' + esc(fmtDate(b.date)) + '</span></h2>' +
      '<dl class="facts">' + fact('Start', fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + fmtTime(b.start)) +
      fact('Finish about', fmtTime(b.end) + (b.days > 1 ? ' on ' + fmtDate(end) : '')) +
      (b.days > 1 ? fact('Days on site', String(b.days)) : '') +
      (qt.deposit ? fact('Deposit', money(qt.deposit) + (b.depositPaid ? ' paid' : ' not paid yet')) : '') + '</dl>' +
      '<div class="btn-row"><a class="btn out sm" href="' + esc(calendar(j).google) + '" target="_blank" rel="noopener">Add to Google Calendar</a>' +
      '<button class="btn out sm" type="button" data-act="ics">Add to Apple or Outlook calendar</button></div>' +
      '<div class="btn-row"><button class="btn sm" type="button" data-act="remind">' + (b.reminderSent ? 'Send another reminder' : 'Day-before reminder') + '</button>' +
      '<button class="btn sm" type="button" data-act="omw">On my way text</button>' +
      (qt.deposit && !b.depositPaid ? '<button class="btn out sm" type="button" data-act="deposit-paid">Deposit received</button>' : '') +
      '<button class="link" type="button" data-act="rebook">Change the date</button></div>' +
      (j.invoice ? '' : '<div class="next"><p><b>Job finished?</b> Turn the quote into an invoice. You can add any extras before it goes.</p>' +
        '<button class="btn" type="button" data-act="start-invoice">Create the invoice &rarr;</button></div>') + '</div>';
  }

  function invoiceEditor(j) {
    const inv = j.invoice;
    return '<div class="card"><h2 class="card-h">Invoice<span class="mono">' + (inv.number ? esc(inv.number) : 'Numbered when sent') + '</span></h2>' +
      '<p>Copied from the quote. Add any extra work, or change the lines, before you send it.</p>' +
      itemsEditor(j, 'invoice') +
      '<div class="three">' +
        fld('Deposit already paid (£)', '<input type="number" min="0" step="0.01" inputmode="decimal" data-doc="invoice" data-dk="depositPaid" value="' + esc(inv.depositPaid) + '">') +
        fld('Payment due in (days)', '<input type="number" min="0" step="1" inputmode="numeric" data-doc="invoice" data-dk="termsDays" value="' + esc(inv.termsDays) + '">') +
        fld('Date the work finished', '<input type="date" data-doc="invoice" data-dk="supplyDate" value="' + esc(inv.supplyDate) + '">') +
      '</div>' +
      fld('Notes for the customer', '<textarea data-doc="invoice" data-dk="notes" rows="2" placeholder="e.g. Thanks for your business. Your certificate will follow by email.">' + esc(inv.notes) + '</textarea>') +
      '<dl class="sums" id="sums-invoice">' + sumsHtml(j, 'invoice') + '</dl>' +
      (bankReady() || Q.safeUrl(state.settings.paymentLink) ? '' : '<p class="hint warn">Add your bank details in <a href="#settings">Settings</a> so customers know how to pay.</p>') +
      '<div class="btn-row"><button class="btn" type="button" data-act="send-invoice">Send invoice &rarr;</button>' +
      '<button class="btn out" type="button" data-act="preview" data-t="i">Preview</button>' +
      (inv.number ? '' : '<button class="link" type="button" data-act="drop-invoice">Discard invoice</button>') + '</div></div>';
  }
  function invoiceCard(j) {
    const inv = j.invoice, it = invoiceTotals(j), due = invoiceDue(j), late = daysBetween(due, today()), rem = inv.reminders;
    return '<div class="card"><h2 class="card-h">Invoice ' + esc(inv.number) + '<span class="mono">Sent ' + esc(fmtDate(inv.sentOn)) + '</span></h2>' +
      '<dl class="facts">' + fact('Amount due', money(it.balance)) +
      fact('Due', fmtDate(due, { day: 'numeric', month: 'long' }) + (late > 0 ? ', ' + plural(late, 'day') + ' overdue' : '')) +
      fact('Reminders', rem.length ? rem.length + ' sent, last ' + fmtDate(rem[rem.length - 1]) : 'None yet') + '</dl>' +
      '<div class="btn-row"><button class="btn sm" type="button" data-act="chase">Payment reminder</button>' +
      '<button class="btn out sm" type="button" data-act="resend-invoice">Resend invoice</button>' +
      '<button class="btn out sm" type="button" data-act="view-doc" data-t="i">View invoice</button></div>' +
      '<div class="paid-row">' + fld('Paid on', '<input type="date" id="paidOn" value="' + today() + '">') +
      '<button class="btn" type="button" data-act="paid">Mark as paid &check;</button></div></div>';
  }
  function paidCard(j) {
    const inv = j.invoice;
    return '<div class="card done-card"><h2 class="card-h">Paid in full<span class="mono">' + esc(fmtDate(inv.paidOn)) + '</span></h2>' +
      '<dl class="facts">' + fact('Invoice', inv.number) + fact('Amount', money(invoiceTotals(j).total)) + fact('Paid on', fmtLong(inv.paidOn)) + '</dl>' +
      '<div class="btn-row"><button class="btn out sm" type="button" data-act="view-doc" data-t="i">View invoice</button></div></div>';
  }
  function sideCard(j) {
    return '<div class="card side"><span class="mono">Job value</span><b class="big" id="jobValue">' + money(jobValue(j)) + '</b>' +
      '<dl class="facts">' + (j.quote.number ? fact('Quote', j.quote.number) : '') + (j.invoice && j.invoice.number ? fact('Invoice', j.invoice.number) : '') +
      fact('Started', fmtDate(j.createdOn)) + '</dl>' +
      '<div class="btn-row"><button class="btn out sm" type="button" data-act="ask">Customer asked a question?</button></div>' +
      '<button class="link danger" type="button" data-act="delete">Delete this job</button></div>';
  }
  function logCard(j) {
    const stamp = at => new Date(at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    return '<div class="card side"><h2 class="card-h">Activity</h2><ol class="log">' +
      (j.log.length ? j.log.map(l => '<li><time datetime="' + esc(l.at) + '">' + esc(stamp(l.at)) + '</time>' + esc(l.text) + '</li>').join('') : '<li>Nothing yet</li>') + '</ol></div>';
  }

  function renderFaqs() {
    view.innerHTML =
      '<div class="page-head"><span class="mono tag">Answers ready to send</span><h1>FAQs</h1></div>' +
      '<div class="card"><h2 class="card-h">Answer a customer’s question</h2><div class="asker" id="pageAsker"></div></div>' +
      '<h2 class="sec-h">Your saved answers <span class="count">' + state.faqs.length + '</span></h2>' +
      '<p class="hint wide">Customer questions are matched against these. The ones you tick also appear on your quotes or invoices, so customers can find the answer themselves. ' +
      'Answers can use {deposit_answer}, {payment_terms}, {quote_valid_days}, {business} and {phone}.</p>' +
      '<div class="faq-list">' + state.faqs.map(f =>
        '<div class="card faq-ed" id="faq-' + f.id + '">' +
        fld('Question', '<input data-faq="' + f.id + '" data-fk="q" value="' + esc(f.q) + '">') +
        fld('Answer', '<textarea data-faq="' + f.id + '" data-fk="a" rows="3">' + esc(f.a) + '</textarea>') +
        fld('Other words customers use', '<input data-faq="' + f.id + '" data-fk="keywords" placeholder="e.g. upfront, pay first" value="' + esc(f.keywords) + '">') +
        '<div class="checks"><label class="check"><input type="checkbox" data-faq="' + f.id + '" data-fk="onQuote"' + (f.onQuote ? ' checked' : '') + '> Show on quotes</label>' +
        '<label class="check"><input type="checkbox" data-faq="' + f.id + '" data-fk="onInvoice"' + (f.onInvoice ? ' checked' : '') + '> Show on invoices</label>' +
        '<button class="link danger" type="button" data-act="del-faq" data-id="' + f.id + '">Delete</button></div></div>').join('') + '</div>' +
      '<button class="btn out" type="button" data-act="add-faq">+ Add a question</button>';
    mountAsker($('#pageAsker'), ui.askJob);
  }
  function mountAsker(box, jobId) {
    const jobs = state.jobs.filter(j => j.status !== 'lost' || j.id === jobId).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    box.innerHTML =
      fld('What did they ask?', '<textarea class="ask-text" rows="3" placeholder="Paste their message, e.g. “Do you need a deposit, and when could you start?”">' + esc(ui.askText) + '</textarea>') +
      fld('Which job is it about?', '<select class="ask-job"><option value="">Not about a particular job</option>' + jobs.map(j =>
        '<option value="' + j.id + '"' + (j.id === jobId ? ' selected' : '') + '>' + esc((j.title || 'Untitled job') + (j.customer.name ? ' · ' + j.customer.name : '')) + '</option>').join('') + '</select>') +
      '<div class="ask-results" aria-live="polite"></div>' +
      '<div class="btn-row"><button class="btn" type="button" data-act="ask-reply">Write the reply &rarr;</button></div>';
    paintAsker(box);
  }
  function paintAsker(box) {
    const text = $('.ask-text', box).value, j = job($('.ask-job', box).value), res = $('.ask-results', box);
    if (!text.trim()) { res.innerHTML = '<p class="hint">Matching answers from your FAQs show up here as you type.</p>'; return; }
    const m = Q.matchFaqs(text, state.faqs, 4), v = vars(j);
    res.innerHTML = m.length
      ? '<p class="mono">Best matches. Tick the ones to include</p>' + m.map((r, i) =>
        '<label class="match"><input type="checkbox" value="' + r.faq.id + '"' + (i === 0 || r.score >= m[0].score * 0.75 ? ' checked' : '') + '>' +
        '<span><b>' + esc(fill(r.faq.q, v)) + '</b>' + esc(fill(r.faq.a, v)) + '</span></label>').join('')
      : '<p class="hint">No saved answer matches that. Write your own reply, then <button class="link" type="button" data-act="ask-save">save the question as a new FAQ</button> so the answer’s ready next time.</p>';
  }
  function askReply(box) {
    const j = job($('.ask-job', box).value), v = vars(j);
    const picked = $$('.ask-results input:checked', box).map(i => state.faqs.find(f => f.id === i.value)).filter(Boolean);
    const dlg = box.closest('dialog');
    if (dlg) dlg.close();
    compose({
      title: 'Reply to their question', job: j, kind: 'faqReply',
      vars: Object.assign(v, { answer: picked.map(f => fill(f.a, v)).join('\n\n') }),
      done: 'Reply logged on the job',
      onSent: j && (ch => log(j, 'Answered a question' + (picked.length ? ' (' + picked.map(f => f.q).join('; ') + ')' : '') + via(ch)))
    });
  }

  function renderSettings() {
    const s = state.settings;
    const input = (key, o) => {
      o = o || {};
      return o.rows ? '<textarea data-set="' + key + '" rows="' + o.rows + '">' + esc(s[key]) + '</textarea>'
        : '<input data-set="' + key + '" type="' + (o.type || 'text') + '"' + (o.type === 'number' ? ' min="0" inputmode="numeric"' : '') +
          (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' value="' + esc(s[key]) + '">';
    };
    const exampleJobs = state.jobs.some(j => j.example);
    view.innerHTML =
      '<div class="page-head"><span class="mono tag">Saved as you type</span><h1>Settings</h1></div>' +
      '<div class="set-grid">' +
      '<div class="card"><h2 class="card-h">Your business</h2><p class="hint">Shown on every quote and invoice.</p>' +
        '<div class="two">' + fld('Your first name', input('myName'), 'Signs off your messages') + fld('Business name', input('business')) + '</div>' +
        '<div class="two">' + fld('Mobile', input('phone', { type: 'tel' }), 'Customers can accept quotes by WhatsApp or text to this') + fld('Email', input('email', { type: 'email' })) + '</div>' +
        fld('Business address', input('address', { rows: 2 })) + fld('Website', input('website', { ph: 'www.yourbusiness.co.uk' })) + '</div>' +
      '<div class="card"><h2 class="card-h">Getting paid</h2><p class="hint">Shown on invoices, and on quotes that ask for a deposit.</p>' +
        fld('Account name', input('bankName')) +
        '<div class="two">' + fld('Sort code', input('sortCode', { ph: '12-34-56' })) + fld('Account number', input('accountNumber')) + '</div>' +
        fld('Card payment link (optional)', input('paymentLink', { type: 'url', ph: 'https://' }), 'A payment link from Stripe, SumUp, Square or similar. Invoices show it as a Pay by card button.') + '</div>' +
      '<div class="card"><h2 class="card-h">VAT</h2>' +
        '<label class="check"><input type="checkbox" data-set="vatRegistered"' + (s.vatRegistered ? ' checked' : '') + '> I’m VAT registered</label>' +
        (s.vatRegistered ? '<div class="two">' + fld('VAT number', input('vatNumber')) + fld('VAT rate (%)', input('vatRate', { type: 'number' })) + '</div>'
          : '<p class="hint">Quotes and invoices go out with no VAT added.</p>') + '</div>' +
      '<div class="card"><h2 class="card-h">Quotes and invoices</h2>' +
        '<div class="two">' + fld('Deposit to book (%)', input('depositPct', { type: 'number' }), 'For new quotes. 0 for none.') + fld('Quote price held for (days)', input('quoteValidDays', { type: 'number' })) + '</div>' +
        '<div class="two">' + fld('Payment due in (days)', input('paymentTermsDays', { type: 'number' })) + '<span></span></div>' +
        '<div class="two">' + fld('Quote number starts with', input('quotePrefix')) + fld('Next quote number', input('nextQuote', { type: 'number' })) + '</div>' +
        '<div class="two">' + fld('Invoice number starts with', input('invoicePrefix')) + fld('Next invoice number', input('nextInvoice', { type: 'number' })) + '</div>' +
        '<p class="hint">Invoice numbers need to run in order with no gaps. Only change the next number when you first start, to carry on from your old system.</p></div>' +
      '</div>' +
      '<h2 class="sec-h">Quote follow-ups</h2>' +
      '<p class="hint wide">Offered after a quote goes out, until the customer replies or says yes. Each one shows up on your Today list when it’s due.</p>' +
      '<div class="fu-ed">' + s.followUps.map((fu, i) =>
        '<div class="card"><div class="fu-top">' + fld('Follow-up ' + (i + 1) + ': days after the quote', '<input type="number" min="1" inputmode="numeric" data-fu="' + i + '" data-fk="days" value="' + esc(fu.days) + '">') +
        '<button class="link danger" type="button" data-act="del-fu" data-i="' + i + '">Remove</button></div>' +
        fld('Message', '<textarea data-fu="' + i + '" data-fk="text" rows="5">' + esc(fu.text) + '</textarea>') + '</div>').join('') + '</div>' +
      '<button class="btn out" type="button" data-act="add-fu">+ Add a follow-up</button>' +
      '<h2 class="sec-h">Messages</h2>' +
      '<p class="hint wide">Written once in your words, then filled in for each customer. You can still change any message before it goes.</p>' +
      '<details class="ph"><summary>Words in {curly brackets} that get filled in</summary><dl>' +
        PLACEHOLDERS.map(p => '<div><dt>{' + p[0] + '}</dt><dd>' + esc(p[1]) + '</dd></div>').join('') + '</dl></details>' +
      '<div class="tpl-grid">' + TEMPLATES.map(t =>
        '<div class="card">' + fld(t[1], '<textarea data-tpl="' + t[0] + '" rows="' + (t[0] === 'signOff' ? 3 : 7) + '">' + esc(s.templates[t[0]]) + '</textarea>', esc(t[2])) +
        '<button class="link" type="button" data-act="reset-tpl" data-k="' + t[0] + '">Back to the original wording</button></div>').join('') + '</div>' +
      '<h2 class="sec-h">Your data</h2>' +
      '<div class="card"><p>Everything is saved in this browser, on this device only. Nothing is uploaded. Download a backup now and then, and use it to move to a new phone or computer.' +
        (state.lastBackup ? ' Last backup: ' + esc(fmtLong(state.lastBackup)) + '.' : '') + '</p>' +
        '<div class="btn-row"><button class="btn" type="button" data-act="export">Download a backup</button>' +
        '<button class="btn out" type="button" data-act="import">Restore from a backup</button><input type="file" id="importFile" accept="application/json,.json" hidden></div>' +
        '<div class="btn-row">' + (exampleJobs ? '<button class="btn out sm" type="button" data-act="clear-example">Remove the example jobs</button>'
          : '<button class="btn out sm" type="button" data-act="example">Load example jobs</button>') +
        '<button class="link danger" type="button" data-act="wipe">Delete everything</button></div></div>';
  }

  /* ---------- sending ---------- */
  function compose(o) {
    composing = o;
    const c = (o.job && o.job.customer) || {};
    $('#cmpTitle').textContent = o.title;
    $('#cmpTo').textContent = o.job ? 'To ' + ([c.name, c.phone, c.email].filter(Boolean).join(' · ') || 'the customer') : '';
    $('#cmpSubj').value = fill(SUBJECTS[o.kind] || '', o.vars);
    $('#cmpText').value = fill(o.text != null ? o.text : state.settings.templates[o.kind], o.vars);
    const chans = [['whatsapp', 'WhatsApp']].concat(c.phone ? [['text', 'Text message']] : [], [['email', 'Email']]);
    $('#cmpSend').innerHTML = chans.map(ch => '<a class="btn" data-ch="' + ch[0] + '" href="#"' + (ch[0] === 'whatsapp' ? ' target="_blank" rel="noopener"' : '') + '>' + ch[1] + '</a>').join('') +
      (navigator.share ? '<button class="btn out" type="button" data-ch="share">Share&hellip;</button>' : '');
    $('#cmpHint').textContent = c.phone || c.email ? 'Opens your own app with the message filled in. Check it, then press send there.'
      : 'No mobile or email saved' + (o.job ? ' for this customer' : '') + ', so you’ll pick who to send it to.';
    $('#cmpMark').hidden = !o.onSent;
    paintChannels();
    $('#composer').showModal();
    $('#cmpText').setSelectionRange(0, 0);
    $('#cmpText').scrollTop = 0;
  }
  function paintChannels() {
    const o = composing;
    if (!o) return;
    const c = (o.job && o.job.customer) || {}, text = $('#cmpText').value, subj = $('#cmpSubj').value;
    $$('#cmpSend a').forEach(a => {
      a.href = a.dataset.ch === 'whatsapp' ? (c.phone ? Q.waHref(c.phone, text) : 'https://wa.me/?text=' + encodeURIComponent(text))
        : a.dataset.ch === 'text' ? Q.smsHref(c.phone, text) : Q.mailHref(c.email, subj, text);
    });
  }
  function sent(ch) {
    const o = composing;
    composing = null;
    $('#composer').close();
    if (o && o.onSent) change(o.done || 'Logged as sent', () => o.onSent(ch));
  }

  function checkQuote(j) {
    if (!j.customer.name.trim()) return ['Add the customer’s name first.', '[data-cust="name"]'];
    if (!j.title.trim()) return ['Give the job a short name, like “Kitchen rewire”.', '[data-job="title"]'];
    const lines = realLines(j.quote.items);
    if (!lines.length) return ['Add at least one line with a price.', '[data-ik="desc"]'];
    if (lines.some(i => !String(i.desc).trim())) return ['One of the lines has a price but no description.', '[data-ik="desc"]'];
    if (quoteTotals(j).total <= 0) return ['The quote comes to £0. Add your prices first.', '[data-ik="unit"]'];
    return null;
  }
  function problem(p) {
    toast(p[0]);
    const el = $(p[1], view);
    if (el) el.focus();
  }
  async function sendQuote(j) {
    const p = checkQuote(j);
    if (p) return problem(p);
    const s = state.settings, resend = j.status !== 'draft';
    j.quote.items = realLines(j.quote.items);
    if (!j.quote.number) j.quote.number = docNumber(s.quotePrefix, s.nextQuote++);
    save();
    render();
    const tmp = clone(j);
    tmp.quote.sentOn = today();
    tmp.quote.vatRate = currentVat();
    const link = await docLink(tmp, 'q');
    compose({
      title: (resend ? 'Send the new quote ' : 'Send quote ') + j.quote.number, job: j, kind: 'quote', vars: vars(tmp, { link }),
      done: resend ? 'New quote sent. Follow-ups start again.' : 'Quote sent. Follow-ups will show on your Today list.',
      onSent(ch) {
        j.quote.sentOn = tmp.quote.sentOn;
        j.quote.vatRate = tmp.quote.vatRate;
        if (resend) { j.followUps = []; j.followPaused = false; delete j.quietUntil; }
        delete ui.editQuote[j.id];
        j.status = 'quoted';
        log(j, (resend ? 'Updated quote ' : 'Quote ') + j.quote.number + ' sent' + via(ch) + ', ' + money(quoteTotals(j).total));
      }
    });
  }
  async function sendFollowUp(j) {
    const nf = nextFollowUp(j);
    if (!nf) return;
    const link = await docLink(j, 'q');
    compose({
      title: 'Follow-up ' + (nf.step + 1) + ' of ' + nf.of, job: j, kind: 'followUp', text: nf.text, vars: vars(j, { link }),
      done: 'Follow-up ' + (nf.step + 1) + ' logged',
      onSent(ch) { j.followUps.push({ on: today(), ch }); log(j, 'Follow-up ' + (nf.step + 1) + ' sent' + via(ch)); }
    });
  }
  function readBooking() {
    return {
      date: $('#bkDate').value, start: $('#bkStart').value || '08:00', end: $('#bkEnd').value,
      days: Math.max(1, Math.round(+$('#bkDays').value || 1)), depositPaid: $('#bkDeposit') ? $('#bkDeposit').checked : false
    };
  }
  function book(j, send) {
    const f = readBooking();
    if (!f.date) { toast('Pick a start date first.'); $('#bkDate').focus(); return; }
    const moved = !!(j.booking && j.booking.date);
    const apply = ch => {
      const changedDate = moved && j.booking.date !== f.date;
      j.booking = Object.assign({}, j.booking, f);
      if (!moved || changedDate) { j.booking.reminderSent = false; j.booking.onMyWaySent = false; }
      if (j.status === 'won') j.status = 'booked';
      delete ui.rebook[j.id];
      log(j, (moved ? 'Moved to ' : 'Booked for ') + fmtDate(f.date) + ' at ' + fmtTime(f.start) + (ch ? ', confirmation sent' + via(ch) : ''));
    };
    if (!send) return change(moved ? 'Booking updated' : 'Job booked in', () => apply());
    const tmp = clone(j);
    tmp.booking = Object.assign({}, j.booking, f);
    compose({ title: moved ? 'New date for the customer' : 'Booking confirmation', job: j, kind: 'booking', vars: vars(tmp), done: moved ? 'Booking updated' : 'Job booked in', onSent: apply });
  }
  function sendReminder(j) {
    compose({ title: 'Day-before reminder', job: j, kind: 'reminder', vars: vars(j), done: 'Reminder logged',
      onSent(ch) { j.booking.reminderSent = true; log(j, 'Reminder sent' + via(ch)); } });
  }
  function sendOnMyWay(j) {
    compose({ title: 'On my way', job: j, kind: 'onMyWay', vars: vars(j), done: '“On my way” logged',
      onSent(ch) { j.booking.onMyWaySent = true; log(j, '“On my way” sent' + via(ch)); } });
  }
  function startInvoice(j) {
    const qt = quoteTotals(j);
    j.invoice = {
      number: '', items: clone(j.quote.items), notes: '',
      depositPaid: j.booking && j.booking.depositPaid ? qt.deposit : 0,
      termsDays: state.settings.paymentTermsDays, supplyDate: j.booking ? bookingEnd(j) : today(), reminders: []
    };
    log(j, 'Invoice started');
    save();
    render();
    const ed = $('#sums-invoice');
    if (ed) ed.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function sendInvoice(j, resend) {
    const s = state.settings, inv = j.invoice;
    if (!resend) {
      const lines = realLines(inv.items);
      if (!lines.length || invoiceTotals(j).total <= 0) return toast('Add at least one line with a price.');
      if (lines.some(i => !String(i.desc).trim())) return toast('One of the lines has a price but no description.');
      inv.items = lines;
      if (!inv.number) inv.number = docNumber(s.invoicePrefix, s.nextInvoice++);
      save();
      render();
    }
    const tmp = clone(j);
    if (!resend) { tmp.invoice.issuedOn = today(); tmp.invoice.vatRate = currentVat(); tmp.invoice.sentOn = today(); }
    const link = await docLink(tmp, 'i');
    compose({
      title: (resend ? 'Resend invoice ' : 'Send invoice ') + inv.number, job: j, kind: 'invoice', vars: vars(tmp, { link }),
      done: resend ? 'Invoice resent' : 'Invoice sent. Payment reminders will show when it’s due.',
      onSent(ch) {
        if (!resend) {
          inv.issuedOn = tmp.invoice.issuedOn; inv.vatRate = tmp.invoice.vatRate; inv.sentOn = tmp.invoice.sentOn;
          j.status = 'invoiced';
        }
        log(j, 'Invoice ' + inv.number + (resend ? ' resent' : ' sent') + via(ch) + ', ' + money(invoiceTotals(j).balance) + ' due');
      }
    });
  }
  async function sendPaymentReminder(j) {
    const link = await docLink(j, 'i');
    compose({ title: 'Payment reminder', job: j, kind: 'paymentReminder', vars: vars(j, { link }), done: 'Payment reminder logged',
      onSent(ch) { j.invoice.reminders.push(today()); log(j, 'Payment reminder sent' + via(ch)); } });
  }

  function newQuote() {
    const s = state.settings;
    const j = fixJob({
      id: uid(), status: 'draft', createdOn: today(), updatedAt: Date.now(),
      quote: { number: '', items: [{ desc: '', qty: 1, unit: '' }], notes: '', depositPct: s.depositPct, validDays: s.quoteValidDays }
    });
    state.jobs.unshift(j);
    save();
    ui.focus = '[data-cust="name"]';
    location.hash = '#job/' + j.id;
  }
  function openAsker(j) {
    ui.askText = '';
    mountAsker($('#dlgAsker'), j ? j.id : '');
    $('#askDlg').showModal();
    $('.ask-text', $('#dlgAsker')).focus();
  }

  /* ---------- example data ---------- */
  function addExample() {
    if (!state.settings.business) { Object.assign(state.settings, EXAMPLE_BUSINESS); state.exampleSettings = true; }
    const d = n => addDays(today(), n);
    const at = (n, h) => new Date(d(n) + 'T' + String(h).padStart(2, '0') + ':00:00').toISOString();
    const vr = currentVat();
    const q = (number, sentOn, items, depositPct, notes) => ({ number, items, depositPct, notes: notes || '', validDays: 30, sentOn, vatRate: vr });
    const people = {
      sarah: { name: 'Sarah Mitchell', phone: '07700 900123', email: 'sarah.mitchell@example.com', address: '14 Meadow Close, Guildford GU1 2AB' },
      tom: { name: 'Tom Bradley', phone: '07700 900456', email: 'tom.bradley@example.com', address: '3 Orchard Way, Woking GU21 4QP' },
      priya: { name: 'Priya Shah', phone: '07700 900789', email: 'priya.shah@example.com', address: '27 Station Road, Godalming GU7 1EU' },
      james: { name: 'James Carter', phone: '07700 900321', email: 'james.carter@example.com', address: '8 Hillside Avenue, Farnham GU9 7LR' },
      helen: { name: 'Helen Price', phone: '07700 900654', email: 'helen.price@example.com', address: '52 Church Lane, Cranleigh GU6 8AS' },
      mark: { name: 'Mark Ellis', phone: '07700 900987', email: 'mark.ellis@example.com', address: '19 Park View, Haslemere GU27 1JA' },
      olivia: { name: 'Olivia Turner', phone: '07700 900111', email: 'olivia.turner@example.com', address: '5 The Green, Shere GU5 9HE' },
      dan: { name: 'Dan Hughes', phone: '07700 900222', email: 'dan.hughes@example.com', address: '41 Mill Lane, Bramley GU5 0HL' }
    };
    const socket = [{ desc: 'Outdoor double socket, IP66, supply and fit', qty: 2, unit: 140 }];
    const eicr = [{ desc: 'Electrical safety check (EICR) for a 3-bed rental, with report', qty: 1, unit: 180 }];
    const jobs = [
      { title: 'Kitchen rewire', status: 'quoted', createdOn: d(-5), customer: people.sarah,
        quote: q('Q-0101', d(-4), [
          { desc: 'Rewire kitchen: new ring final, cooker circuit and isolators', qty: 1, unit: 1450 },
          { desc: 'Double sockets with USB, supply and fit', qty: 6, unit: 65 },
          { desc: 'LED downlights, supply and fit', qty: 8, unit: 45 }], 25,
          'Includes making good the chases ready for plastering. Electrical Installation Certificate on completion.'),
        log: [{ at: at(-4, 16), text: 'Quote Q-0101 sent by WhatsApp' }] },
      { title: 'Garage power and lighting', status: 'quoted', createdOn: d(-8), customer: people.tom,
        quote: q('Q-0100', d(-7), [
          { desc: 'Armoured supply from the house, and a garage consumer unit', qty: 1, unit: 980 },
          { desc: 'LED batten lights', qty: 4, unit: 55 }, { desc: 'Double sockets', qty: 4, unit: 60 }], 25),
        followUps: [{ on: d(-4), ch: 'whatsapp' }],
        log: [{ at: at(-4, 8), text: 'Follow-up 1 sent by WhatsApp' }, { at: at(-7, 17), text: 'Quote Q-0100 sent by email' }] },
      { title: 'Consumer unit upgrade', status: 'won', createdOn: d(-12), wonOn: d(-1), customer: people.priya,
        quote: q('Q-0098', d(-10), [
          { desc: 'New consumer unit with RCBOs, supply and fit', qty: 1, unit: 650 },
          { desc: 'Testing and certification', qty: 1, unit: 120 }], 0, 'The power will be off for about five hours on the day.'),
        followUps: [{ on: d(-7), ch: 'text' }],
        log: [{ at: at(-1, 12), text: 'Customer accepted the quote' }, { at: at(-7, 9), text: 'Follow-up 1 sent by text' }, { at: at(-10, 18), text: 'Quote Q-0098 sent by WhatsApp' }] },
      { title: 'Garden lighting', status: 'booked', createdOn: d(-18), wonOn: d(-12), customer: people.james,
        quote: q('Q-0095', d(-16), [
          { desc: 'Outdoor spike lights with armoured cable, supply and fit', qty: 6, unit: 85 },
          { desc: 'Weatherproof switched spur', qty: 1, unit: 95 }], 25),
        followUps: [{ on: d(-13), ch: 'whatsapp' }],
        booking: { date: d(1), start: '08:00', end: '16:00', days: 1, depositPaid: true },
        log: [{ at: at(-12, 19), text: 'Booked for ' + fmtDate(d(1)) + ' at 8am, confirmation sent by WhatsApp' }, { at: at(-12, 18), text: 'Customer accepted the quote' }] },
      { title: 'EV charger install', status: 'booked', createdOn: d(-25), wonOn: d(-20), customer: people.helen,
        quote: q('Q-0091', d(-24), [
          { desc: '7kW smart EV charger, supply and fit', qty: 1, unit: 895 },
          { desc: 'Extra cable run (per metre over 10m)', qty: 6, unit: 18 }], 25),
        booking: { date: d(-1), start: '08:30', end: '15:00', days: 1, depositPaid: true, reminderSent: true, onMyWaySent: true },
        log: [{ at: at(-1, 8), text: '“On my way” sent by text' }, { at: at(-2, 17), text: 'Reminder sent by WhatsApp' }] },
      { title: 'Outdoor sockets', status: 'invoiced', createdOn: d(-35), wonOn: d(-30), customer: people.mark,
        quote: q('Q-0088', d(-34), socket, 0),
        booking: { date: d(-22), start: '09:00', end: '13:00', days: 1 },
        invoice: { number: 'INV-0042', items: socket.concat([{ desc: 'Extra: replace cracked garden wall light', qty: 1, unit: 75 }]), notes: '',
          depositPaid: 0, termsDays: 14, supplyDate: d(-22), issuedOn: d(-21), sentOn: d(-21), vatRate: vr, reminders: [] },
        log: [{ at: at(-21, 18), text: 'Invoice INV-0042 sent by email' }] },
      { title: 'Landlord safety check', status: 'paid', createdOn: d(-30), wonOn: d(-28), customer: people.olivia,
        quote: q('Q-0089', d(-29), eicr, 0),
        booking: { date: d(-14), start: '10:00', end: '13:00', days: 1 },
        invoice: { number: 'INV-0043', items: eicr, notes: '', depositPaid: 0, termsDays: 14, supplyDate: d(-14), issuedOn: d(-14), sentOn: d(-14), paidOn: d(-6), vatRate: vr, reminders: [] },
        log: [{ at: at(-6, 11), text: 'Paid in full' }, { at: at(-14, 17), text: 'Invoice INV-0043 sent by email' }] },
      { title: 'Loft lighting', status: 'lost', createdOn: d(-24), lostOn: d(-6), lostReason: 'Went with someone else', customer: people.dan,
        quote: q('Q-0093', d(-21), [{ desc: 'Loft lighting with switch at hatch, and two sockets', qty: 1, unit: 340 }], 0),
        followUps: [{ on: d(-18), ch: 'whatsapp' }, { on: d(-14), ch: 'whatsapp' }, { on: d(-7), ch: 'email' }],
        log: [{ at: at(-6, 10), text: 'Marked as lost: Went with someone else' }] }
    ];
    jobs.forEach((j, i) => { j.id = uid() + i; j.example = true; j.updatedAt = Date.now() - i * 60000; state.jobs.push(fixJob(j)); });
  }
  function clearExample() {
    state.jobs = state.jobs.filter(j => !j.example);
    if (state.exampleSettings) {
      Object.keys(EXAMPLE_BUSINESS).forEach(k => { state.settings[k] = SETTINGS[k]; });
      state.exampleSettings = false;
    }
  }

  /* ---------- backup ---------- */
  function exportData() {
    state.lastBackup = today();
    save();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    a.download = 'quote-to-invoice-backup-' + today() + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    render();
  }
  function importData(file) {
    file.text().then(text => {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.jobs) || !data.settings) throw new Error('not a backup');
      if (!confirm('Replace everything in the app with this backup from ' + plural(data.jobs.length, 'job') + '?')) return;
      change('Backup restored', () => { state = normalise(data); });
    }).catch(() => toast('That file isn’t a Quote to Invoice backup.'));
  }
  function downloadIcs(j) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([calendar(j).ics], { type: 'text/calendar' }));
    a.download = ((j.title || 'job').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'job') + '.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, undo) {
    const t = $('#toast');
    t.hidden = false;
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button class="link" type="button">Undo</button>' : '');
    if (undo) t.querySelector('button').addEventListener('click', () => { t.hidden = true; undo(); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, undo ? 8000 : 4500);
  }

  /* ---------- events ---------- */
  const ACTS = {
    new: () => newQuote(),
    todo: b => {
      const j = job(b.dataset.id);
      if (!j) return;
      ({
        open: () => { location.hash = '#job/' + j.id; },
        follow: () => sendFollowUp(j),
        remind: () => sendReminder(j),
        omw: () => sendOnMyWay(j),
        invoice: () => { if (!j.invoice) startInvoice(j); ui.focus = '#sums-invoice'; location.hash = '#job/' + j.id; },
        chase: () => sendPaymentReminder(j)
      })[b.dataset.kind]();
    },
    filter: b => { ui.filter = b.dataset.f; renderJobs(); },
    'add-item': (b, j) => {
      j[b.dataset.doc].items.push({ desc: '', qty: 1, unit: '' });
      save(); render();
      const last = $$('[data-doc="' + b.dataset.doc + '"][data-ik="desc"]').pop();
      if (last) last.focus();
    },
    'del-item': (b, j) => { j[b.dataset.doc].items.splice(+b.dataset.i, 1); save(); render(); },
    'send-quote': (b, j) => sendQuote(j),
    preview: (b, j) => openDoc(j, b.dataset.t, true),
    'view-doc': (b, j) => openDoc(j, b.dataset.t),
    'edit-quote': (b, j) => { ui.editQuote[j.id] = clone(j.quote); render(); },
    'cancel-edit': (b, j) => { j.quote = ui.editQuote[j.id]; delete ui.editQuote[j.id]; save(); render(); },
    'follow-now': (b, j) => sendFollowUp(j),
    pause: (b, j) => change('Follow-ups paused', () => { j.followPaused = true; log(j, 'Customer replied. Follow-ups paused'); }),
    resume: (b, j) => change('Follow-ups back on', () => { j.followPaused = false; log(j, 'Follow-ups turned back on'); }),
    'keep-open': (b, j) => change('Kept open. It’ll come back to your Today list in a week.', () => { j.quietUntil = addDays(today(), 7); }),
    won: (b, j) => change('Marked as accepted. Now book it in.', () => { j.status = 'won'; j.wonOn = today(); log(j, 'Customer accepted the quote'); }),
    lost: (b, j) => {
      const r = $('#lostReason').value;
      change('Marked as lost', () => { j.status = 'lost'; j.lostOn = today(); j.lostReason = r; log(j, 'Marked as lost: ' + r); });
    },
    reopen: (b, j) => change('Quote reopened', () => { j.status = 'quoted'; delete j.quietUntil; log(j, 'Quote reopened'); }),
    book: (b, j) => book(j, !!b.dataset.send),
    rebook: (b, j) => { ui.rebook[j.id] = true; render(); },
    'cancel-rebook': (b, j) => { delete ui.rebook[j.id]; render(); },
    remind: (b, j) => sendReminder(j),
    omw: (b, j) => sendOnMyWay(j),
    ics: (b, j) => downloadIcs(j),
    'deposit-paid': (b, j) => change('Deposit marked as paid', () => { j.booking.depositPaid = true; log(j, 'Deposit of ' + money(quoteTotals(j).deposit) + ' received'); }),
    'start-invoice': (b, j) => startInvoice(j),
    'drop-invoice': (b, j) => change('Invoice discarded', () => { delete j.invoice; log(j, 'Invoice discarded'); }),
    'send-invoice': (b, j) => sendInvoice(j),
    'resend-invoice': (b, j) => sendInvoice(j, true),
    chase: (b, j) => sendPaymentReminder(j),
    paid: (b, j) => {
      const on = $('#paidOn').value || today();
      change('Marked as paid. Nice one.', () => { j.invoice.paidOn = on; j.status = 'paid'; log(j, 'Paid in full, ' + money(invoiceTotals(j).balance)); });
    },
    ask: (b, j) => openAsker(j),
    'ask-reply': b => askReply(b.closest('.asker')),
    'ask-save': b => {
      const box = b.closest('.asker'), f = { id: uid(), q: $('.ask-text', box).value.trim().slice(0, 160), a: '', keywords: '', onQuote: false, onInvoice: false };
      state.faqs.push(f);
      save();
      const dlg = box.closest('dialog');
      if (dlg) dlg.close();
      ui.askText = '';
      ui.focus = '#faq-' + f.id + ' [data-fk="a"]';
      if (route.view === 'faqs') { render(); focusPending(); } else location.hash = '#faqs';
    },
    delete: (b, j) => {
      if (!confirm('Delete “' + (j.title || 'this job') + '” and everything about it?')) return;
      change('Job deleted', () => { state.jobs = state.jobs.filter(x => x !== j); });
      location.hash = '#jobs';
    },
    'add-faq': () => {
      const f = { id: uid(), q: '', a: '', keywords: '', onQuote: false, onInvoice: false };
      state.faqs.push(f); save(); render();
      $('#faq-' + f.id + ' input').focus();
    },
    'del-faq': b => change('Question deleted', () => { state.faqs = state.faqs.filter(f => f.id !== b.dataset.id); }),
    'add-fu': () => {
      const fus = state.settings.followUps, last = fus[fus.length - 1];
      fus.push({ days: last ? (+last.days || 0) + 7 : 3, text: last ? last.text : SETTINGS.followUps[0].text });
      save(); render();
    },
    'del-fu': b => change('Follow-up removed', () => { state.settings.followUps.splice(+b.dataset.i, 1); }),
    'reset-tpl': b => change('Original wording back', () => { state.settings.templates[b.dataset.k] = SETTINGS.templates[b.dataset.k]; }),
    export: () => exportData(),
    import: () => $('#importFile').click(),
    example: () => { change('Example jobs added', addExample); if (route.view !== 'today') location.hash = '#today'; },
    'clear-example': () => change('Example jobs removed', clearExample),
    wipe: () => {
      if (!confirm('Delete every job, FAQ and setting from this device? Download a backup first if you might need them.')) return;
      change('Everything deleted', () => { state = normalise(null); });
    },
    'close-dlg': b => b.closest('dialog').close()
  };

  document.addEventListener('click', e => {
    const f = e.target.closest('[data-filter]');
    if (f) ui.filter = f.dataset.filter;
    const b = e.target.closest('[data-act]');
    if (!b || !ACTS[b.dataset.act]) return;
    const j = currentJob();
    if (!j && ['todo', 'filter', 'new', 'ask-reply', 'ask-save', 'close-dlg', 'add-faq', 'del-faq', 'add-fu', 'del-fu', 'reset-tpl',
      'export', 'import', 'example', 'clear-example', 'wipe'].indexOf(b.dataset.act) === -1) return;
    ACTS[b.dataset.act](b, j, e);
  });

  document.addEventListener('input', e => {
    const t = e.target, d = t.dataset;
    if (t.id === 'jobSearch') { ui.search = t.value; paintJobList(); return; }
    const box = t.closest('.asker');
    if (box) {
      if (t.classList.contains('ask-text')) ui.askText = t.value;
      if (t.classList.contains('ask-job')) ui.askJob = t.value;
      if (t.classList.contains('ask-text') || t.classList.contains('ask-job')) paintAsker(box);
      return;
    }
    if (t.tagName === 'TEXTAREA' && t.rows === 1) autosize(t);
    const val = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (t.value === '' ? '' : +t.value) : t.value;
    if (d.set) {
      state.settings[d.set] = val;
      save();
      if (d.set === 'vatRegistered') render();
      return;
    }
    if (d.tpl) { state.settings.templates[d.tpl] = val; save(); return; }
    if (d.fu != null) { state.settings.followUps[+d.fu][d.fk] = val; save(); return; }
    if (d.faq) { const f = state.faqs.find(x => x.id === d.faq); if (f) { f[d.fk] = val; save(); } return; }
    const j = currentJob();
    if (!j) return;
    if (d.cust) j.customer[d.cust] = val;
    else if (d.job) { j[d.job] = val; if (d.job === 'title') $('#jobTitle').textContent = val || 'New quote'; }
    else if (d.doc) {
      if (d.item != null) j[d.doc].items[+d.item][d.ik] = val;
      else j[d.doc][d.dk] = val;
      paintSums(j, d.doc);
    } else return;
    j.updatedAt = Date.now();
    save();
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'importFile' && e.target.files[0]) { importData(e.target.files[0]); e.target.value = ''; }
  });

  // Composer: each channel is a real link, so the phone opens the right app. Record it once tapped.
  $('#cmpText').addEventListener('input', paintChannels);
  $('#cmpSubj').addEventListener('input', paintChannels);
  $('#cmpSend').addEventListener('click', e => {
    const el = e.target.closest('[data-ch]');
    if (!el) return;
    if (el.dataset.ch === 'share') {
      navigator.share({ title: $('#cmpSubj').value, text: $('#cmpText').value }).then(() => sent('share'), () => {});
      return;
    }
    setTimeout(() => sent(el.dataset.ch), 0); // let the link open first
  });
  $('#cmpCopy').addEventListener('click', () => {
    const text = $('#cmpText').value;
    const done = () => toast('Copied. Paste it into your message, then tap “I sent it another way”.');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => { $('#cmpText').select(); document.execCommand('copy'); done(); });
    else { $('#cmpText').select(); document.execCommand('copy'); done(); }
  });
  $('#cmpMark').addEventListener('click', () => sent('other'));
  $('#composer').addEventListener('close', () => { composing = null; });

  function autosize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; }
  function focusPending() {
    if (!ui.focus) return;
    const el = $(ui.focus);
    ui.focus = '';
    if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
  }

  /* ---------- routing ---------- */
  function render() {
    ({ today: renderToday, jobs: renderJobs, job: () => renderJob(route.id), faqs: renderFaqs, settings: renderSettings })[route.view]();
    const tab = route.view === 'job' ? 'jobs' : route.view;
    $$('.appnav a').forEach(a => {
      const on = a.dataset.view === tab;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const n = todo().length;
    $('#todoCount').textContent = n || '';
    $('#todoCount').hidden = !n;
    $$('textarea[rows="1"]', view).forEach(autosize);
  }
  function go() {
    const prev = route, parts = (location.hash.slice(1) || 'today').split('/');
    route = { view: ['today', 'jobs', 'job', 'faqs', 'settings'].indexOf(parts[0]) === -1 ? 'today' : parts[0], id: parts[1] || null };
    if (prev.view === 'job' && prev.id !== route.id) {
      const old = job(prev.id);
      if (old && isBlank(old)) { state.jobs = state.jobs.filter(j => j !== old); save(); }
    }
    if ($('#composer').open) $('#composer').close();
    if ($('#askDlg').open) $('#askDlg').close();
    render();
    window.scrollTo(0, 0);
    focusPending();
  }
  window.addEventListener('hashchange', go);
  window.addEventListener('storage', e => { if (e.key === KEY) { state = load(); render(); } });
  go();
  save();
})();
