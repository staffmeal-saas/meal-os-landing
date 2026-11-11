/* Staff Meal : calculateur de food cost (ratio matière).
   Runs entirely in the browser: nothing is stored or sent anywhere. No dependency. */
(() => {
  'use strict';

  const form = document.querySelector('[data-foodcost]');
  if (!form) return;
  const box = form.closest('.calc') || document;

  const NBSP = ' ';
  const rowsEl = form.querySelector('[data-rows]');
  const template = document.getElementById('fc-row');
  const live = box.querySelector('[data-live]');
  const out = (key) => box.querySelector(`[data-out="${key}"]`);

  // French number input: "4,57", "4.57", "1 200" are all accepted
  const parseNum = (value) => {
    const s = String(value || '').replace(/[\s  ]/g, '').replace(',', '.');
    if (s === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const fmt = (n, digits) => n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/\s/g, NBSP);
  const eur = (n) => `${fmt(n, 2)}${NBSP}€`;
  const pct = (n) => `${fmt(n, 1)}${NBSP}%`;

  let seq = rowsEl.querySelectorAll('tr').length;

  const labelRow = (tr, index) => {
    const name = tr.querySelector('[data-name]');
    const cost = tr.querySelector('[data-cost]');
    const del = tr.querySelector('[data-remove]');
    const label = name.value.trim() || `ingrédient ${index + 1}`;
    name.setAttribute('aria-label', `Ingrédient ${index + 1}`);
    cost.setAttribute('aria-label', `Coût hors taxes de ${label}, pour une portion, en euros`);
    del.setAttribute('aria-label', `Retirer ${label}`);
  };
  const relabel = () => rowsEl.querySelectorAll('tr').forEach(labelRow);

  // results are announced after the visitor's changes, never on page load
  let ready = false;
  let timer = 0;
  const announce = (text) => {
    if (!ready) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (live) live.textContent = text; }, 700);
  };

  const compute = () => {
    let cost = 0;
    let invalid = 0;
    rowsEl.querySelectorAll('[data-cost]').forEach((input) => {
      const v = parseNum(input.value);
      if (input.value.trim() === '') { input.removeAttribute('aria-invalid'); return; }
      if (Number.isNaN(v) || v < 0) { input.setAttribute('aria-invalid', 'true'); invalid++; return; }
      input.removeAttribute('aria-invalid');
      cost += v;
    });
    const vat = parseNum(form.elements.tva.value) / 100;
    const ttc = parseNum(form.elements.prix.value);
    const target = parseNum(form.elements.cible.value);
    const dish = form.elements.plat.value.trim() || 'ce plat';

    out('cost').textContent = eur(cost);
    if (!(ttc > 0) || !(cost > 0)) {
      out('ratio').textContent = '—';
      ['ht', 'marge', 'coef', 'cibleHt', 'ecart'].forEach((k) => { out(k).textContent = '—'; });
      out('cibleTtc').textContent = '';
      announce(cost > 0 ? 'Indiquez un prix de vente pour obtenir le ratio matière.' : 'Indiquez le coût des ingrédients pour obtenir le ratio matière.');
      return;
    }
    const ht = ttc / (1 + vat);
    const ratio = (cost / ht) * 100;
    const margin = ht - cost;
    const coef = ht / cost;
    out('ratio').textContent = pct(ratio);
    out('ht').textContent = eur(ht);
    out('marge').textContent = eur(margin);
    out('coef').textContent = fmt(coef, 2);
    if (target > 0 && target < 100) {
      const needHt = cost / (target / 100);
      out('cibleHt').textContent = `${eur(needHt)} HT`;
      out('cibleTtc').textContent = `(${eur(needHt * (1 + vat))} TTC)`;
      const gap = ratio - target;
      const pts = `${fmt(Math.abs(gap), 1)}${NBSP}point${Math.abs(gap) >= 2 ? 's' : ''}`;
      out('ecart').textContent = Math.abs(gap) < 0.05 ? 'Sur la cible' : `${pts} ${gap > 0 ? 'au-dessus' : 'en dessous'}`;
    } else {
      out('cibleHt').textContent = '—';
      out('cibleTtc').textContent = '';
      out('ecart').textContent = '—';
    }
    announce(`${dish} : ratio matière de ${pct(ratio)}, marge brute de ${eur(margin)} hors taxes par portion.${invalid ? ' Un coût saisi n’est pas un nombre : il n’est pas compté.' : ''}`);
  };

  const addRow = (focus) => {
    const tr = template.content.firstElementChild.cloneNode(true);
    seq++;
    const name = tr.querySelector('[data-name]');
    const cost = tr.querySelector('[data-cost]');
    name.id = `fc-n${seq}`;
    cost.id = `fc-c${seq}`;
    rowsEl.appendChild(tr);
    relabel();
    if (focus) name.focus();
    return tr;
  };

  form.addEventListener('input', (e) => {
    if (e.target.matches('[data-name]')) labelRow(e.target.closest('tr'), Array.from(rowsEl.children).indexOf(e.target.closest('tr')));
    compute();
  });
  form.addEventListener('change', compute);
  form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.matches('[data-add]')) {
      addRow(true);
    } else if (btn.matches('[data-remove]')) {
      const tr = btn.closest('tr');
      const next = tr.nextElementSibling || tr.previousElementSibling;
      tr.remove();
      relabel();
      compute();
      const target = next ? next.querySelector('[data-name]') : form.querySelector('[data-add]');
      if (target) target.focus();
    } else if (btn.matches('[data-reset]')) {
      rowsEl.innerHTML = '';
      form.elements.plat.value = '';
      form.elements.prix.value = '';
      addRow(false);
      addRow(false);
      addRow(false);
      compute();
      form.elements.plat.focus();
    }
  });

  relabel();
  compute();
  ready = true;
})();
