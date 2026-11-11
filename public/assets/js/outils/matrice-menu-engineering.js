/* Staff Meal : matrice de menu engineering (étoiles, vaches à lait, énigmes, poids morts).
   Classification of Kasavana and Smith: a dish is popular when its share of the category's sales
   reaches 70 % of an equal share; it is profitable when its unit margin reaches the sales-weighted
   average margin of the category. Runs entirely in the browser: nothing is stored or sent anywhere. */
(() => {
  'use strict';

  const form = document.querySelector('[data-matrice]');
  if (!form) return;
  const box = form.closest('.calc') || document;
  const view = document.querySelector('[data-matrix-view]');

  const NBSP = ' ';
  const MAX_DISHES = 12;
  const FAMILIES = {
    etoile: 'Étoile',
    vache: 'Vache à lait',
    enigme: 'Énigme',
    poids: 'Poids mort',
  };
  const rowsEl = form.querySelector('[data-rows]');
  const template = document.getElementById('me-row');
  const addBtn = form.querySelector('[data-add]');
  const live = box.querySelector('[data-live]');
  const out = (key) => document.querySelector(`[data-out="${key}"]`);

  const parseNum = (value) => {
    const s = String(value || '').replace(/[\s  €]/g, '').replace(',', '.');
    if (s === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const fmt = (n, digits) => n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/\s/g, NBSP);
  const eur = (n) => `${fmt(n, 2)}${NBSP}€`;
  const short = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/\s/g, NBSP);
  const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const groups = () => Array.from(rowsEl.querySelectorAll('[data-row]'));

  let seq = groups().length;
  let ready = false;
  let timer = 0;
  const announce = (text) => {
    if (!ready) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (live) live.textContent = text; }, 700);
  };

  const labelRow = (g, index) => {
    const label = g.querySelector('[data-name]').value.trim() || `plat ${index + 1}`;
    g.querySelector('[data-name]').setAttribute('aria-label', `Plat ${index + 1}`);
    g.querySelector('[data-price]').setAttribute('aria-label', `Prix de vente hors taxes de ${label}, en euros`);
    g.querySelector('[data-cost]').setAttribute('aria-label', `Coût matière de ${label}, en euros`);
    g.querySelector('[data-qty]').setAttribute('aria-label', `Ventes de ${label} sur la période`);
    g.querySelector('[data-remove]').setAttribute('aria-label', `Retirer ${label}`);
  };
  const relabel = () => {
    groups().forEach(labelRow);
    const full = groups().length >= MAX_DISHES;
    addBtn.disabled = full;
    addBtn.textContent = full ? `${MAX_DISHES} plats au plus` : 'Ajouter un plat';
  };

  const checkField = (input) => {
    const v = parseNum(input.value);
    if (input.value.trim() !== '' && (Number.isNaN(v) || v < 0)) { input.setAttribute('aria-invalid', 'true'); return NaN; }
    input.removeAttribute('aria-invalid');
    return v;
  };

  const compute = () => {
    const dishes = [];
    groups().forEach((g, i) => {
      const name = g.querySelector('[data-name]').value.trim() || `Plat ${i + 1}`;
      const price = checkField(g.querySelector('[data-price]'));
      const cost = checkField(g.querySelector('[data-cost]'));
      const qtyRaw = checkField(g.querySelector('[data-qty]'));
      if (!(price > 0) || Number.isNaN(qtyRaw)) return;
      const qty = Math.round(qtyRaw);
      dishes.push({ name, margin: price - (cost > 0 ? cost : 0), qty });
    });

    const families = { etoile: [], vache: [], enigme: [], poids: [] };
    const total = dishes.reduce((n, d) => n + d.qty, 0);
    const body = view.querySelector('[data-out="lignes"]');
    body.textContent = '';

    if (dishes.length < 2 || total === 0) {
      ['seuil', 'marge', 'ventes'].forEach((k) => { out(k).textContent = '—'; });
      Object.keys(families).forEach((k) => { out(`n-${k}`).textContent = '0'; out(`l-${k}`).textContent = '—'; });
      announce('Indiquez au moins deux plats, avec leur prix et leurs ventes.');
      return;
    }

    const threshold = (0.7 / dishes.length) * 100;
    const avgMargin = dishes.reduce((n, d) => n + d.margin * d.qty, 0) / total;
    dishes.forEach((d) => {
      d.share = (d.qty / total) * 100;
      const popular = d.share >= threshold;
      const profitable = d.margin >= avgMargin;
      d.family = popular ? (profitable ? 'etoile' : 'vache') : (profitable ? 'enigme' : 'poids');
      families[d.family].push(d.name);
      const tr = el('tr');
      tr.appendChild(el('th', d.name)).setAttribute('scope', 'row');
      tr.appendChild(el('td', `${fmt(d.share, 1)}${NBSP}%`));
      tr.appendChild(el('td', eur(d.margin)));
      tr.appendChild(el('td', FAMILIES[d.family]));
      body.appendChild(tr);
    });

    out('seuil').textContent = `${short(threshold)}${NBSP}% des ventes`;
    out('marge').textContent = eur(avgMargin);
    out('ventes').textContent = fmt(total, 0);
    Object.keys(families).forEach((k) => {
      out(`n-${k}`).textContent = String(families[k].length);
      out(`l-${k}`).textContent = families[k].length ? families[k].join(', ') : 'aucun plat';
    });
    const count = (k, one, many) => `${families[k].length} ${families[k].length > 1 ? many : one}`;
    announce(`${count('etoile', 'étoile', 'étoiles')}, ${count('vache', 'vache à lait', 'vaches à lait')}, ${count('enigme', 'énigme', 'énigmes')}, ${count('poids', 'poids mort', 'poids morts')}. Seuil de popularité : ${short(threshold)} % des ventes ; marge moyenne pondérée : ${eur(avgMargin)}.`);
  };

  const addRow = (focus) => {
    if (groups().length >= MAX_DISHES) return;
    const g = template.content.firstElementChild.cloneNode(true);
    seq++;
    g.querySelectorAll('input').forEach((f, i) => { f.id = `me-${seq}-${i}`; });
    rowsEl.appendChild(g);
    relabel();
    if (focus) g.querySelector('[data-name]').focus();
  };

  form.addEventListener('input', (e) => {
    const g = e.target.closest('[data-row]');
    if (g && e.target.matches('[data-name]')) labelRow(g, groups().indexOf(g));
    compute();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.matches('[data-add]')) {
      addRow(true);
    } else if (btn.matches('[data-remove]')) {
      const g = btn.closest('[data-row]');
      const list = groups();
      const next = list[list.indexOf(g) + 1] || list[list.indexOf(g) - 1];
      g.remove();
      relabel();
      compute();
      const target = next ? next.querySelector('[data-name]') : addBtn;
      if (target) target.focus();
    } else if (btn.matches('[data-reset]')) {
      groups().forEach((g) => g.remove());
      addRow(false);
      addRow(false);
      addRow(false);
      addRow(false);
      compute();
      groups()[0].querySelector('[data-name]').focus();
    }
  });

  relabel();
  compute();
  ready = true;
})();
