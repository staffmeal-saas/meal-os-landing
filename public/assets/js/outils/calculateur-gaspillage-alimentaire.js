/* Staff Meal : calculateur de gaspillage alimentaire.
   Runs entirely in the browser: nothing is stored or sent anywhere. No dependency. */
(() => {
  'use strict';

  const form = document.querySelector('[data-gaspillage]');
  if (!form) return;
  const box = form.closest('.calc') || document;

  const NBSP = ' ';
  // ADEME, collective catering (July 2016 study, cited in the 2017 guide):
  // full cost of waste 0.68 EUR per meal, raw materials alone 0.27 EUR per meal
  const FULL_COST_FACTOR = 0.68 / 0.27;

  const live = box.querySelector('[data-live]');
  const out = (key) => box.querySelector(`[data-out="${key}"]`);
  const parseNum = (value) => {
    const s = String(value || '').replace(/[\s  €]/g, '').replace(',', '.');
    if (s === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const fmt = (n, digits) => n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/\s/g, NBSP);
  const eur = (n) => `${fmt(Math.round(n), 0)}${NBSP}€`;
  const roundTo = (n, step) => Math.round(n / step) * step;

  // results are announced after the visitor's changes, never on page load
  let ready = false;
  let timer = 0;
  const announce = (text) => {
    if (!ready) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (live) live.textContent = text; }, 700);
  };

  const compute = () => {
    const caInput = form.elements.ca;
    const ca = parseNum(caInput.value);
    const fc = Number(form.elements.matiere.value);
    const waste = Number(form.elements.perte.value);

    out('matiere').textContent = `${fmt(fc, 0)}${NBSP}%`;
    out('perte').textContent = `${fmt(waste, 1)}${NBSP}%`;
    form.elements.matiere.setAttribute('aria-valuetext', `${fmt(fc, 0)} % du chiffre d’affaires`);
    form.elements.perte.setAttribute('aria-valuetext', `${fmt(waste, 1)} % des achats de matières`);

    if (!(ca > 0)) {
      caInput.setAttribute('aria-invalid', caInput.value.trim() === '' ? 'false' : 'true');
      ['an', 'mois', 'achats', 'points', 'complet'].forEach((k) => { out(k).textContent = '—'; });
      announce('Indiquez votre chiffre d’affaires mensuel hors taxes.');
      return;
    }
    caInput.removeAttribute('aria-invalid');
    const purchases = ca * (fc / 100);
    const month = purchases * (waste / 100);
    const year = month * 12;
    const points = (fc / 100) * (waste / 100) * 100;
    const full = roundTo(year * FULL_COST_FACTOR, 100);

    out('an').textContent = fmt(Math.round(year), 0);
    out('mois').textContent = eur(month);
    out('achats').textContent = eur(purchases);
    out('points').textContent = `${fmt(points, 1)}${NBSP}point${points >= 2 ? 's' : ''}`;
    out('complet').textContent = `environ ${eur(full)}`;
    announce(`Vos pertes coûtent environ ${eur(year)} par an au prix d’achat, soit ${eur(month)} par mois et ${out('points').textContent} de chiffre d’affaires.`);
  };

  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });
  compute();
  ready = true;
})();
