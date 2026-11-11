/* Staff Meal : générateur de fiche technique de recette.
   Runs entirely in the browser: nothing is sent anywhere and nothing is kept on the device
   (no cookie, no storage), as the privacy policy says. No dependency.
   A price may keep its unit, as on the invoice ("14,50 €/kg"). A field that cannot be read is
   flagged (border, and a message tied to it with aria-describedby) and its line stays out of
   the cost until it is corrected; the result panel says so.
   Printing uses a hidden frame that holds only the recipe sheet and the site stylesheet;
   the brigade version leaves out purchase prices and costs (every [data-prix] element). */
(() => {
  'use strict';

  const form = document.querySelector('[data-fiche]');
  if (!form) return;
  const box = form.closest('.calc') || document;
  const sheet = document.querySelector('[data-sheet]');

  const NBSP = ' ';
  const rowsEl = form.querySelector('[data-rows]');
  const template = document.getElementById('ft-row');
  const live = box.querySelector('[data-live]');
  const warnBox = box.querySelector('[data-warn]');
  const out = (key) => box.querySelector(`[data-out="${key}"]`);
  const pv = (key) => sheet.querySelector(`[data-pv="${key}"]`);

  // price is given per kg for g and kg, per litre for cl and L, per piece otherwise
  const UNITS = {
    kg: { factor: 1, basis: 'kg', price: '€/kg' },
    g: { factor: 0.001, basis: 'kg', price: '€/kg' },
    L: { factor: 1, basis: 'L', price: '€/L' },
    cl: { factor: 0.01, basis: 'L', price: '€/L' },
    pièce: { factor: 1, basis: 'pièce', price: '€/pièce' },
  };
  // words that may follow a number, and the unit they name
  const UNIT_WORDS = {
    kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogramme: 'kg', kilogrammes: 'kg',
    g: 'g', gr: 'g', grs: 'g', gramme: 'g', grammes: 'g',
    l: 'L', lt: 'L', litre: 'L', litres: 'L',
    cl: 'cl', centilitre: 'cl', centilitres: 'cl',
    ml: 'ml', millilitre: 'ml', millilitres: 'ml',
    pce: 'pièce', pces: 'pièce', pc: 'pièce', pcs: 'pièce', pièce: 'pièce', pièces: 'pièce', piece: 'pièce', pieces: 'pièce',
    u: 'pièce', unité: 'pièce', unités: 'pièce', unite: 'pièce', unites: 'pièce',
  };
  // currency and tax words: understood on a price, never on a quantity
  const MONEY = new Set(['€', 'eur', 'euro', 'euros', 'ht', 'h.t.', 'h.t', 'hors', 'taxe', 'taxes']);
  // "per" words: "14,50 € le kilo", "14,50 €/kg", "0,40 € la pièce"
  const PER_WORDS = new Set(['/', 'par', 'le', 'la', 'les', 'l’', 'au', 'aux', 'à', 'un', 'une']);
  const PER = { kg: 'au kilo', g: 'au gramme', L: 'au litre', cl: 'au centilitre', ml: 'au millilitre', pièce: 'à la pièce' };
  const IN = { kg: 'en kilos', g: 'en grammes', L: 'en litres', cl: 'en centilitres', ml: 'en millilitres', pièce: 'en pièces' };
  const PICK = { kg: 'kg ou g', L: 'L ou cl', pièce: 'pce' };
  const SHOWN = { kg: 'kg', g: 'g', L: 'L', cl: 'cl', pièce: 'pce' };
  const PORTION_WORDS = new Set(['portion', 'portions', 'part', 'parts', 'pers', 'pers.', 'personne', 'personnes', 'couvert', 'couverts']);
  const GRAM_WORDS = new Set(['g', 'gr', 'grs', 'gramme', 'grammes']);

  const fmt = (n, digits) => n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/\s/g, NBSP);
  const qty = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 3 }).replace(/\s/g, NBSP);
  const eur = (n) => `${fmt(n, 2)}${NBSP}€`;
  const pct = (n) => `${fmt(n, n % 1 ? 1 : 0)}${NBSP}%`;
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };

  // ------------------------------------------------------------------ reading what is typed
  // "14,50", "14.5", "1 450,00", "1.450,00", "1,450.00", ",5" -> a number, or NaN
  const toNumber = (text) => {
    const commas = (text.match(/,/g) || []).length;
    const points = (text.match(/\./g) || []).length;
    let decimal = '';
    if (commas && points) decimal = text.lastIndexOf(',') > text.lastIndexOf('.') ? ',' : '.';
    else if (commas === 1) decimal = ',';
    else if (points === 1) decimal = '.';
    const at = decimal ? text.lastIndexOf(decimal) : -1;
    const whole = at >= 0 ? text.slice(0, at) : text;
    const part = at >= 0 ? text.slice(at + 1) : '';
    // grouping separators (space, point or comma) only between groups of three digits
    if (/[ .,]/.test(whole) ? !/^\d{1,3}(?:[ .,]\d{3})+$/.test(whole) : !/^\d*$/.test(whole)) return NaN;
    if (at >= 0 && !/^\d+$/.test(part)) return NaN;
    if (!whole && !part) return NaN;
    return Number(`${whole.replace(/\D/g, '') || '0'}.${part || '0'}`);
  };

  // the number at the start of a field, and the words that follow it
  const readNumber = (raw) => {
    const text = String(raw || '').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
    if (!text) return { empty: true };
    const m = /^(-?) ?(?:€ ?)?((?:\d+|(?=[.,]\d))(?:[ .,]\d+)*)(.*)$/.exec(text);
    if (!m) return { unread: true };
    const n = toNumber(m[2]);
    if (Number.isNaN(n)) return { unread: true };
    const words = m[3].replace(/€/g, ' € ').replace(/\//g, ' / ').replace(/['’]/g, '’ ').split(' ').filter(Boolean);
    return { value: m[1] ? -n : n, words };
  };

  // what the words after a number say: a unit, a currency, "TTC", or something not understood
  const readWords = (words) => {
    const r = { unit: null, money: false, ttc: false, unknown: false };
    words.forEach((w) => {
      if (w === 'ttc') r.ttc = true;
      else if (MONEY.has(w)) r.money = true;
      else if (PER_WORDS.has(w)) return;
      else if (UNIT_WORDS[w] && !r.unit) r.unit = UNIT_WORDS[w];
      else r.unknown = true;
    });
    return r;
  };

  const readPrice = (raw, unit) => {
    const n = readNumber(raw);
    if (n.empty) return { empty: true };
    const unread = { error: `Prix non compris${NBSP}: écrivez un nombre, par exemple 14,50 ou 14,50${NBSP}€/kg.` };
    if (n.unread) return unread;
    const w = readWords(n.words);
    if (w.unknown) return unread;
    if (w.ttc) return { error: `Prix TTC${NBSP}: le calcul attend le prix hors taxes, celui de la facture.` };
    if (n.value < 0) return { error: 'Un prix ne peut pas être négatif.' };
    const basis = (UNITS[unit] || UNITS.kg).basis;
    if (w.unit && w.unit !== basis) {
      if (PICK[w.unit]) return { error: `Prix ${PER[w.unit]}, mais la quantité est ${IN[unit]}${NBSP}: choisissez ${PICK[w.unit]} dans l’unité, ou indiquez le prix ${PER[basis]}.` };
      return { error: `Prix ${PER[w.unit]}${NBSP}: pour une quantité ${IN[unit]}, indiquez le prix ${PER[basis]}.` };
    }
    return { value: n.value };
  };

  const readQuantity = (raw, unit) => {
    const n = readNumber(raw);
    if (n.empty) return { empty: true };
    const w = n.unread ? null : readWords(n.words);
    if (!w || w.unknown || w.ttc) return { error: `Quantité non comprise${NBSP}: écrivez un nombre, par exemple 0,5.` };
    if (w.money) return { error: `Quantité non comprise${NBSP}: le prix s’écrit dans la colonne Prix HT.` };
    if (n.value < 0) return { error: 'Une quantité ne peut pas être négative.' };
    if (w.unit && w.unit !== unit) {
      if (w.unit === 'ml') return { error: `Quantité en millilitres${NBSP}: choisissez cl dans l’unité, et écrivez la quantité en centilitres.` };
      return { error: `Quantité ${IN[w.unit]}, mais l’unité choisie est ${SHOWN[unit]}${NBSP}: changez l’unité dans la liste.` };
    }
    return { value: n.value };
  };

  // the three fields above the ingredients: a number, with the unit of their label if wanted
  const readPortions = (raw) => {
    const n = readNumber(raw);
    if (n.empty) return { empty: true };
    const ok = !n.unread && n.words.every((w) => PORTION_WORDS.has(w)) && Number.isInteger(n.value) && n.value >= 1;
    return ok ? { value: n.value } : { error: 'Écrivez un nombre entier de portions, par exemple 10.' };
  };
  const readWeight = (raw) => {
    const n = readNumber(raw);
    if (n.empty) return { empty: true };
    const kilos = !n.unread && n.words.length === 1 && UNIT_WORDS[n.words[0]] === 'kg';
    const ok = !n.unread && (kilos || n.words.every((w) => GRAM_WORDS.has(w))) && n.value > 0;
    return ok ? { value: kilos ? n.value * 1000 : n.value } : { error: `Poids d’une portion en grammes${NBSP}: écrivez un nombre, par exemple 250.` };
  };
  const readTarget = (raw) => {
    const n = readNumber(raw);
    if (n.empty) return { empty: true };
    const ok = !n.unread && n.words.every((w) => w === '%') && n.value > 0 && n.value < 100;
    return ok ? { value: n.value } : { error: `Ratio matière visé${NBSP}: un pourcentage inférieur à 100, par exemple 30.` };
  };

  // ------------------------------------------------------------------ flagging a field
  // the field being typed in: a new message waits until it is left (change event),
  // an existing one follows the typing and goes as soon as the value reads
  let editing = null;
  const describe = (input, id, on) => {
    const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== id);
    if (on) ids.push(id);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  };
  // shows or clears the message of a field; true when the field is flagged
  const flag = (input, message, place) => {
    const id = `${input.id}-msg`;
    let msg = document.getElementById(id);
    if (!message || (!msg && input === editing)) {
      if (msg) msg.remove();
      input.removeAttribute('aria-invalid');
      describe(input, id, false);
      return false;
    }
    if (!msg) {
      msg = el('p', undefined, 'ft-err');
      msg.id = id;
      place(msg);
    }
    msg.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    describe(input, id, true);
    return true;
  };
  const underField = (input) => (msg) => input.closest('.f').appendChild(msg);
  // an ingredient's messages go on a line of their own, under its quantity and price
  const underRow = (group, first) => (msg) => {
    let td = group.querySelector('.ft-msg td');
    if (!td) {
      const tr = el('tr', undefined, 'ft-msg');
      td = el('td');
      td.colSpan = 4;
      tr.appendChild(td);
      group.appendChild(tr);
    }
    if (first) td.prepend(msg);
    else td.appendChild(msg);
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

  const labelRow = (tr, index) => {
    const label = tr.querySelector('[data-name]').value.trim() || `ingrédient ${index + 1}`;
    tr.querySelector('[data-name]').setAttribute('aria-label', `Ingrédient ${index + 1}`);
    tr.querySelector('[data-qty]').setAttribute('aria-label', `Quantité brute de ${label}`);
    tr.querySelector('[data-unit]').setAttribute('aria-label', `Unité de ${label}`);
    tr.querySelector('[data-price]').setAttribute('aria-label', `Prix d’achat hors taxes de ${label}, par kilo, litre ou pièce selon l’unité`);
    tr.querySelector('[data-remove]').setAttribute('aria-label', `Retirer ${label}`);
  };
  const relabel = () => groups().forEach(labelRow);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // a cell of the printable sheet; roles keep the table readable when the phone layout restyles it
  const cell = (tag, text, cls, prix) => {
    const c = el(tag, text, cls);
    c.setAttribute('role', tag === 'th' ? 'rowheader' : 'cell');
    if (tag === 'th') c.scope = 'row';
    if (prix) c.setAttribute('data-prix', '');
    return c;
  };

  // ------------------------------------------------------------------ the calculation
  const compute = () => {
    const name = form.elements.nom.value.trim() || 'Nouvelle recette';
    const portionsRead = readPortions(form.elements.portions.value);
    const weightRead = readWeight(form.elements.poids.value);
    const targetRead = readTarget(form.elements.cible.value);
    flag(form.elements.portions, portionsRead.error, underField(form.elements.portions));
    flag(form.elements.poids, weightRead.error, underField(form.elements.poids));
    flag(form.elements.cible, targetRead.error, underField(form.elements.cible));
    const portions = portionsRead.value;
    const weight = weightRead.value;
    const target = targetRead.value;
    const vat = Number(form.elements.tva.value) / 100;

    const lines = [];
    let total = 0;
    let flagged = 0;
    let waiting = 0;
    groups().forEach((group) => {
      const qtyInput = group.querySelector('[data-qty]');
      const priceInput = group.querySelector('[data-price]');
      const unit = group.querySelector('[data-unit]').value;
      const ingredient = group.querySelector('[data-name]').value.trim();
      const q = readQuantity(qtyInput.value, unit);
      const p = readPrice(priceInput.value, unit);
      const qtyFlagged = flag(qtyInput, q.error, underRow(group, true));
      const priceFlagged = flag(priceInput, p.error, underRow(group, false));
      if (!ingredient && q.empty && p.empty) return;
      const u = UNITS[unit] || UNITS.kg;
      const counted = q.value > 0 && p.value >= 0;
      const cost = counted ? q.value * u.factor * p.value : NaN;
      if (counted) total += cost;
      else if (qtyFlagged || priceFlagged) flagged += 1;
      else waiting += 1;
      lines.push({ ingredient: ingredient || '—', q: q.value, unit, price: p.value, priceUnit: u.price, cost, counted });
    });
    form.querySelectorAll('.ft-msg').forEach((tr) => { if (!tr.querySelector('.ft-err')) tr.remove(); });

    const perPortion = portions ? total / portions : NaN;
    const priceHt = portions && target && total > 0 ? perPortion / (target / 100) : NaN;
    const portionsText = portions ? `${portions}${NBSP}portion${portions > 1 ? 's' : ''}` : '';

    out('portion').textContent = portions ? eur(perPortion) : '—';
    out('total').textContent = portions ? `${eur(total)} HT pour ${portionsText}` : `${eur(total)} HT`;
    out('cible').textContent = target ? pct(target) : '—';
    out('prixHt').textContent = Number.isFinite(priceHt) ? eur(priceHt) : '—';
    out('prixTtc').textContent = Number.isFinite(priceHt) ? eur(priceHt * (1 + vat)) : '—';
    out('tva').textContent = pct(vat * 100);

    // what is left out of the result, said next to it
    const warnings = [];
    if (flagged) {
      warnings.push(flagged > 1
        ? `${flagged} ingrédients signalés ne sont pas comptés dans le coût${NBSP}: corrigez leur quantité ou leur prix.`
        : `1 ingrédient signalé n’est pas compté dans le coût${NBSP}: corrigez sa quantité ou son prix.`);
    }
    if (waiting) {
      warnings.push(waiting > 1
        ? `${waiting} ingrédients ne sont pas encore comptés${NBSP}: il leur manque une quantité ou un prix.`
        : `1 ingrédient n’est pas encore compté${NBSP}: il lui manque une quantité ou un prix.`);
    }
    if (!portions) warnings.push('Indiquez le nombre de portions pour obtenir le coût par portion.');
    if (targetRead.error) warnings.push('Corrigez le ratio matière visé pour obtenir le prix de vente.');
    if (warnBox) {
      warnBox.textContent = '';
      warnings.forEach((w) => warnBox.appendChild(el('p', w)));
      warnBox.hidden = !warnings.length;
    }

    // the printable sheet
    pv('nom').textContent = name;
    pv('date').textContent = today;
    pv('rendement').textContent = portions ? `${portionsText}${weight > 0 ? ` de ${qty(weight)}${NBSP}g` : ''}` : 'à compléter';
    const body = pv('lignes');
    body.textContent = '';
    lines.forEach((l) => {
      const tr = el('tr');
      tr.setAttribute('role', 'row');
      const unitShown = l.unit === 'pièce' && l.q >= 2 ? 'pièces' : l.unit;
      tr.appendChild(cell('th', l.ingredient));
      tr.appendChild(cell('td', l.q > 0 ? `${qty(l.q)}${NBSP}${unitShown}` : '—', 'ft-q'));
      tr.appendChild(cell('td', l.price >= 0 ? `${fmt(l.price, 2)}${NBSP}${l.priceUnit}` : '—', l.price >= 0 ? 'ft-p' : 'ft-p ft-none', true));
      tr.appendChild(cell('td', l.counted ? eur(l.cost) : '—', 'ft-c', true));
      body.appendChild(tr);
    });
    const totalRow = el('tr', undefined, 'ft-total');
    totalRow.setAttribute('role', 'row');
    totalRow.setAttribute('data-prix', '');
    totalRow.appendChild(cell('th', flagged || waiting ? 'Total des ingrédients chiffrés' : 'Total de la recette'));
    totalRow.appendChild(cell('td', ''));
    totalRow.appendChild(cell('td', ''));
    totalRow.appendChild(cell('td', undefined, 'ft-c')).appendChild(el('strong', eur(total)));
    body.appendChild(totalRow);
    pv('portion').textContent = portions ? eur(perPortion) : '—';
    pv('prixHt').textContent = Number.isFinite(priceHt) ? eur(priceHt) : '—';
    pv('cible').textContent = target ? pct(target) : '—';

    const allergens = Array.from(form.querySelectorAll('[name="allergene"]:checked')).map((c) => c.value);
    pv('allergenes').textContent = allergens.length ? allergens.join(', ') : 'aucun allergène coché';

    const steps = form.elements.progression.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const list = pv('progression');
    list.textContent = '';
    steps.forEach((s) => list.appendChild(el('li', s)));
    if (!steps.length) list.appendChild(el('li', 'À compléter.'));
    pv('remarques').textContent = form.elements.remarques.value.trim() || 'À compléter.';

    const result = portions ? `coût de ${eur(perPortion)} hors taxes par portion` : `coût de ${eur(total)} hors taxes pour la recette`;
    const sale = Number.isFinite(priceHt) ? `, prix de vente de ${eur(priceHt)} hors taxes pour un ratio matière de ${pct(target)}` : '';
    announce(`${name}${NBSP}: ${result}${sale}.${warnings.length ? ` ${warnings.join(' ')}` : ''}`);
  };

  const addRow = (focus) => {
    const tr = template.content.firstElementChild.cloneNode(true);
    seq++;
    tr.querySelectorAll('input, select').forEach((f, i) => { f.id = `ft-${seq}-${i}`; });
    rowsEl.appendChild(tr);
    relabel();
    if (focus) tr.querySelector('[data-name]').focus();
  };

  // ------------------------------------------------------------------ printing
  const printSheet = (brigade) => {
    const css = document.querySelector('link[rel="stylesheet"][href*="site.css"]');
    const name = form.elements.nom.value.trim() || 'Nouvelle recette';
    const frame = document.createElement('iframe');
    frame.className = 'sr';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.title = 'Fiche technique à imprimer';
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    doc.open();
    doc.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title></title></head><body><main class="wrap"></main></body></html>');
    doc.close();
    // the title is the default name of the PDF
    doc.title = brigade ? `Fiche technique pour la brigade · ${name}` : `Fiche technique · ${name}`;
    if (css) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = css.href;
      doc.head.appendChild(link);
    }
    const copy = sheet.cloneNode(true);
    copy.removeAttribute('data-sheet');
    if (brigade) {
      copy.querySelectorAll('[data-prix]').forEach((n) => n.remove());
      const kind = copy.querySelector('[data-pv="kind"]');
      if (kind) kind.textContent = 'Fiche technique pour la brigade';
    }
    doc.querySelector('main').appendChild(doc.importNode(copy, true));
    const go = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
    const link = doc.querySelector('link');
    if (link) {
      link.addEventListener('load', go, { once: true });
      link.addEventListener('error', go, { once: true });
    } else {
      go();
    }
  };

  // ------------------------------------------------------------------ events
  form.addEventListener('input', (e) => {
    const group = e.target.closest('[data-row]');
    if (group && e.target.matches('[data-name]')) labelRow(group, groups().indexOf(group));
    editing = e.target;
    compute();
    editing = null;
  });
  form.addEventListener('change', () => compute());
  form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.matches('[data-add]')) {
      addRow(true);
    } else if (btn.matches('[data-remove]')) {
      const tr = btn.closest('[data-row]');
      const list = groups();
      const next = list[list.indexOf(tr) + 1] || list[list.indexOf(tr) - 1];
      tr.remove();
      relabel();
      compute();
      const target = next ? next.querySelector('[data-name]') : form.querySelector('[data-add]');
      if (target) target.focus();
    } else if (btn.matches('[data-reset]')) {
      groups().forEach((g) => g.remove());
      ['nom', 'poids', 'progression', 'remarques'].forEach((k) => { form.elements[k].value = ''; });
      form.elements.portions.value = '1';
      form.querySelectorAll('[name="allergene"]').forEach((c) => { c.checked = false; });
      addRow(false);
      addRow(false);
      addRow(false);
      compute();
      form.elements.nom.focus();
    }
  });
  box.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => {
    compute();
    printSheet(b.getAttribute('data-print') === 'brigade');
  }));

  relabel();
  compute();
  ready = true;
})();
