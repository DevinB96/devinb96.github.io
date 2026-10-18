// Quote form: prefill, adaptive fields, inline validation and AJAX submission.
// Without JavaScript the form posts normally and the provider redirects to /quote/thank-you/.
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i; // full postcode or outward code (e.g. GU1)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 2500; // bots submit instantly; people do not

export function init(form, cfg, track) {
  const t0 = Date.now();
  const $ = (s) => form.querySelector(s);
  const status = $('.form-status');
  const submit = $('[data-submit]');
  const success = document.getElementById('formSuccess');
  const params = new URLSearchParams(location.search);

  const pre = params.get('service');
  const preRadio = pre && form.querySelector(`input[name="Service"][data-slug="${CSS.escape(pre)}"]`);
  if (preRadio) preRadio.checked = true;
  const pc = (params.get('postcode') || '').trim().toUpperCase().slice(0, 8);
  if (pc) $('#f-postcode').value = pc;
  $('[data-page-url]').value = location.origin + location.pathname;

  // Adapt fields to the chosen service.
  const freq = $('[data-frequency]');
  function adapt() {
    const slug = form.querySelector('input[name="Service"]:checked')?.dataset.slug;
    const office = slug === 'office-cleaning';
    form.querySelectorAll('[data-home-only]').forEach((el) => { el.hidden = office; el.querySelectorAll('select').forEach((s) => { s.disabled = office; }); });
    const oneOff = slug === 'deep-cleaning' || slug === 'end-of-tenancy-cleaning';
    freq.hidden = oneOff;
    freq.querySelectorAll('input').forEach((i) => { i.disabled = oneOff; });
    if (office) $('#f-type').value = 'Office or commercial';
    else if ($('#f-type').value === 'Office or commercial') $('#f-type').selectedIndex = 0;
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'Service') adapt(); });
  adapt();

  // In page order, so the first problem found is the first one on screen.
  const rules = {
    'f-postcode': (v) => POSTCODE.test(v.trim()),
    'f-name': (v) => v.trim().length > 1,
    'f-email': (v) => EMAIL.test(v.trim()),
  };
  function check(id) {
    const input = document.getElementById(id);
    const ok = rules[id](input.value);
    input.setAttribute('aria-invalid', String(!ok));
    document.getElementById(`${id}-err`).hidden = ok;
    return ok;
  }
  Object.keys(rules).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => { if (input.value) check(id); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(id); });
  });

  let started = false;
  form.addEventListener('focusin', () => { if (!started) { started = true; track('form_start', { form_id: 'quote' }); } });

  const showSuccess = () => {
    form.hidden = true;
    success.hidden = false;
    success.focus();
    success.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error');
    const bad = Object.keys(rules).filter((id) => !check(id));
    if (bad.length) {
      document.getElementById(bad[0]).focus();
      status.textContent = bad.length === 1 ? 'Please check the highlighted field.' : `Please check the ${bad.length} highlighted fields.`;
      return;
    }
    // Honeypot filled or impossibly fast: look successful, send nothing.
    if ($('#f-company-website').value || Date.now() - t0 < MIN_FILL_MS) { showSuccess(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    submit.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !(json.success === true || json.success === 'true')) throw new Error(json.message || `HTTP ${res.status}`);
      track('generate_lead', { form_id: 'quote', service: data.Service || '' });
      showSuccess();
    } catch (err) {
      status.classList.add('is-error');
      const alt = cfg.email
        ? ` You can also email us at <a href="mailto:${cfg.email}">${cfg.email}</a>.`
        : cfg.facebook ? ` You can also <a href="${cfg.facebook}" rel="noopener">message us on Facebook</a>.` : '';
      status.innerHTML = `Sorry, your request did not send. Please check your connection and try again.${alt}`;
      console.warn('Quote form error:', err);
    } finally {
      submit.removeAttribute('aria-busy');
    }
  });
}
