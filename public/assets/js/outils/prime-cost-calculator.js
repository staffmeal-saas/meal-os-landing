/* Staff Meal : calculateur de prime cost (coût matière + coût du personnel).
   Runs entirely in the browser: nothing is stored or sent anywhere. No dependency. */
(() => {
  'use strict';

  const form = document.querySelector('[data-primecost]');
  if (!form) return;
  const box = form.closest('.calc') || document;

  const NBSP = ' ';
  const rowsEl = form.querySelector('[data-rows]');
  const template = document.getElementById('pc-row');
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
  const pct = (n) => `${fmt(n, 1)}${NBSP}%`;

  let seq = rowsEl.querySelectorAll('tr').length;
  let ready = false;
  let timer = 0;
  const announce = (text) => {
    if (!ready) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (live) live.textContent = text; }, 700);
  };

  const labelRow = (tr, index) => {
    const name = tr.querySelector('[data-name]');
    const cost = tr.querySelector('[data-cost]');
    const del = tr.querySelector('[data-remove]');
    const label = name.value.trim() || `ligne ${index + 1}`;
    name.setAttribute('aria-label', `Poste ou ligne de paie ${index + 1}`);
    cost.setAttribute('aria-label', `Coût employeur du mois pour ${label}, en euros`);
    del.setAttribute('aria-label', `Retirer ${label}`);
  };
  const relabel = () => rowsEl.querySelectorAll('tr').forEach(labelRow);

  const checkField = (input) => {
    const v = parseNum(input.value);
    if (input.value.trim() !== '' && (Number.isNaN(v) || v < 0)) { input.setAttribute('aria-invalid', 'true'); return NaN; }
    input.removeAttribute('aria-invalid');
    return v;
  };

  const compute = () => {
    const ca = checkField(form.elements.ca);
    const food = checkField(form.elements.matiere);
    let staff = 0;
    rowsEl.querySelectorAll('[data-cost]').forEach((input) => {
      const v = checkField(input);
      if (v > 0) staff += v;
    });
    out('personnel').textContent = eur(staff);
    if (!(ca > 0)) {
      ['prime', 'primeEur', 'matiereRatio', 'personnelRatio', 'reste', 'resteRatio'].forEach((k) => { out(k).textContent = '—'; });
      announce('Indiquez le chiffre d’affaires hors taxes du mois.');
      return;
    }
    const foodCost = food > 0 ? food : 0;
    const prime = foodCost + staff;
    const primeRatio = (prime / ca) * 100;
    const rest = ca - prime;
    out('prime').textContent = pct(primeRatio);
    out('primeEur').textContent = `${eur(prime)} sur ${eur(ca)}`;
    out('matiereRatio').textContent = pct((foodCost / ca) * 100);
    out('personnelRatio').textContent = pct((staff / ca) * 100);
    out('reste').textContent = eur(rest);
    out('resteRatio').textContent = `(${pct((rest / ca) * 100)})`;
    announce(`Prime cost de ${pct(primeRatio)} : ${eur(prime)} sur ${eur(ca)} de chiffre d’affaires. Il reste ${eur(rest)} pour les autres charges et le résultat.`);
  };

  const addRow = (focus) => {
    const tr = template.content.firstElementChild.cloneNode(true);
    seq++;
    tr.querySelector('[data-name]').id = `pc-n${seq}`;
    tr.querySelector('[data-cost]').id = `pc-c${seq}`;
    rowsEl.appendChild(tr);
    relabel();
    if (focus) tr.querySelector('[data-name]').focus();
  };

  form.addEventListener('input', (e) => {
    const tr = e.target.closest('tr');
    if (tr && e.target.matches('[data-name]')) labelRow(tr, Array.from(rowsEl.children).indexOf(tr));
    compute();
  });
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
      form.elements.ca.value = '';
      form.elements.matiere.value = '';
      addRow(false);
      addRow(false);
      addRow(false);
      compute();
      form.elements.ca.focus();
    }
  });

  relabel();
  compute();
  ready = true;
})();
