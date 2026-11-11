/* Staff Meal : comportements du site (menu, accordéons, calculateur, formulaires, animations).
   Aucun framework, aucune dépendance. Chaque bloc ne s'active que si son balisage est présent. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- mesure (Plausible, production seulement)
  const track = (name, props) => {
    if (typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
  };
  const moduleName = document.body.dataset.module || '';

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a, button');
    if (!link) return;
    const ev = link.getAttribute('data-event');
    if (ev) track(ev, { page: location.pathname });
    const href = link.getAttribute('href') || '';
    if (/demander-une-demo/.test(href) || /#demo$/.test(href)) {
      // every "Demander une démo" button, with the page it sits on (decision D27)
      track('Clic démo', { page: location.pathname });
      if (moduleName) track('Démo depuis un module', { module: moduleName });
    }
  });

  // ---------------------------------------------------------------- menu sur téléphone
  const toggle = $('[data-menu-toggle]');
  const mobileNav = $('#menu-mobile');
  const setMobile = (open) => {
    if (!toggle || !mobileNav) return;
    mobileNav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => setMobile(!mobileNav.classList.contains('open')));
    $$('[data-menu-close]').forEach((el) => el.addEventListener('click', () => setMobile(false)));
    // the focus never goes under the open menu: leaving the header closes it
    const header = toggle.closest('header');
    if (header) {
      header.addEventListener('focusout', (e) => {
        if (mobileNav.classList.contains('open') && e.relatedTarget && !header.contains(e.relatedTarget)) setMobile(false);
      });
    }
  }

  // ---------------------------------------------------------------- grands panneaux du menu
  const panels = $$('.mnav details.mi');
  const closePanels = (except) => panels.forEach((d) => { if (d !== except) d.open = false; });
  panels.forEach((d) => {
    d.addEventListener('toggle', () => { if (d.open) closePanels(d); });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mnav')) closePanels(null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = panels.find((d) => d.open);
    if (open) {
      open.open = false;
      const s = open.querySelector('summary');
      if (s) s.focus();
    }
    if (mobileNav && mobileNav.classList.contains('open')) {
      setMobile(false);
      if (toggle) toggle.focus();
    }
  });
  // focus leaving a panel closes it (keyboard users)
  panels.forEach((d) => {
    d.addEventListener('focusout', (e) => {
      if (d.open && e.relatedTarget && !d.contains(e.relatedTarget)) d.open = false;
    });
  });

  // Homepage discovery: progressive panels, with links as the no-script fallback.
  $$('[data-solution-tabs]').forEach((box) => {
    const tabs = $$('[data-solution-tab]', box);
    const panels = $$('[data-solution-panel]', box);
    const tablist = $('[data-solution-tablist]', box);
    if (!tablist || tabs.length !== panels.length || !tabs.length) return;
    tablist.setAttribute('role', 'tablist');
    const activate = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    };
    const fromHash = () => {
      const target = document.getElementById(location.hash.slice(1));
      const index = panels.findIndex((panel) => target && (panel === target || panel.contains(target)));
      if (index >= 0) activate(index);
      return index;
    };
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].tabIndex = 0;
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        activate(i);
        history.replaceState(null, '', '#' + panels[i].id);
      });
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        activate(next, true);
        history.replaceState(null, '', '#' + panels[next].id);
      });
    });
    activate(0);
    fromHash();
    window.addEventListener('hashchange', fromHash);
  });

  // ---------------------------------------------------------------- accordéons : une réponse ouverte à la fois
  $$('.faq').forEach((faq, k) => {
    const items = $$(':scope > details', faq);
    // native exclusive accordion where supported, toggle handler elsewhere
    items.forEach((d) => { if (!d.hasAttribute('name')) d.setAttribute('name', `faq-${k}`); });
    items.forEach((d) => d.addEventListener('toggle', () => {
      if (!d.open) return;
      items.forEach((o) => { if (o !== d) o.open = false; });
      const q = d.querySelector('summary');
      track('FAQ ouverte', { question: q ? q.textContent.trim().slice(0, 80) : '' });
    }));
  });

  // ---------------------------------------------------------------- calculateur du temps gagné (calculs du V2)
  const NNBSP = ' ';
  const fr = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, NNBSP);
  const roundTo = (n, k) => Math.round(n / k) * k;
  const compute = (sites, emp, to, hourly = 17) => {
    sites = Number.isFinite(sites) ? Math.max(1, Math.min(500, sites)) : 1;
    emp = Number.isFinite(emp) ? Math.max(1, Math.min(100000, emp)) : 1;
    to = Number.isFinite(to) ? Math.max(0, Math.min(100, to)) : 40;
    hourly = Number.isFinite(hourly) && hourly >= 1 ? Math.min(500, hourly) : 17;
    // 50 h d'encadrement par arrivant (-30 %), 22 % de départs en moins (Gallup),
    // 10 min par salarié et par jour, 15 min par site et par jour, 2 h par mois et par site pour le coût des recettes, 17 € de l'heure
    const hires = emp * to / 100;
    const avoided = hires * 0.22;
    const train = (hires - avoided) * 50 * 0.30;
    const dep = avoided * 50;
    const team = emp * (10 / 60) * 220;
    const mgmt = sites * 0.25 * 6 * 52;
    const rec = sites * 2 * 12;
    const total = train + dep + team + mgmt + rec;
    const eur = total * hourly;
    const eurTxt = 'environ ' + fr(roundTo(eur, eur >= 10000 ? 1000 : 100)) + ' €';
    return {
      sites: String(sites), emp: String(emp), toLabel: to + ' %',
      sitesText: sites + (sites > 1 ? ' établissements' : ' établissement'),
      empText: emp + ' salariés', toText: to + ' % par an',
      train: fr(roundTo(train, 10)) + ' h', dep: fr(roundTo(dep, 10)) + ' h',
      depN: avoided >= 0.95 ? '(' + fr(avoided) + ' par an)' : '(moins d’un par an)',
      team: fr(roundTo(team, 10)) + ' h', mgmt: fr(roundTo(mgmt, 10)) + ' h', rec: fr(roundTo(rec, 10)) + ' h',
      total: fr(roundTo(total, 10)), eur: eurTxt,
      live: 'Estimation\u00a0: ' + fr(roundTo(total, 10)) + ' heures par an, soit ' + eurTxt + '.',
    };
  };
  $$('[data-calc]').forEach((form) => {
    const box = form.closest('.calc') || form.parentElement;
    const input = (k) => $(`[data-calc-input="${k}"]`, form);
    let used = false;
    const update = () => {
      const v = compute(Number(input('sites').value), Number(input('emp').value), Number(input('to').value), Number(input('hourly')?.value ?? 17));
      $$('[data-calc-out]', box).forEach((el) => { el.textContent = v[el.getAttribute('data-calc-out')]; });
      $$('[data-calc-valuetext]', box).forEach((el) => el.setAttribute('aria-valuetext', v[el.getAttribute('data-calc-valuetext')]));
    };
    form.addEventListener('input', () => {
      update();
      if (!used) { used = true; track('Calculateur utilisé', { page: location.pathname }); }
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    update();
  });

  // ---------------------------------------------------------------- accueil : les écrans de l'application, module par module
  // Des onglets qui avancent seuls ; la barre de l'onglet actif mène la danse. Un clic, une flèche du clavier
  // ou le bouton arrêtent le défilement ; rien ne bouge seul quand le visiteur a demandé moins d'animations.
  $$('[data-showcase]').forEach((box) => {
    const tabs = $$('[role="tab"]', box);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const pause = $('[data-sc-pause]', box);
    if (!tabs.length || panels.some((x) => !x)) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0;
    let auto = !reduce;
    const select = (k, focus) => {
      i = (k + tabs.length) % tabs.length;
      tabs.forEach((t, j) => {
        const on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        panels[j].classList.toggle('on', on);
      });
      if (focus) tabs[i].focus();
      const row = tabs[i].parentElement;
      if (row.scrollWidth > row.clientWidth) {
        row.scrollTo({ left: tabs[i].offsetLeft - (row.clientWidth - tabs[i].clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    const setPause = () => {
      if (!pause) return;
      pause.setAttribute('aria-pressed', auto ? 'false' : 'true');
      pause.setAttribute('aria-label', auto ? 'Arrêter le défilement des écrans' : 'Relancer le défilement des écrans');
    };
    const stop = () => { auto = false; box.classList.remove('is-auto'); setPause(); };
    const play = () => { auto = true; box.classList.add('is-auto'); setPause(); };
    tabs.forEach((t, j) => {
      t.addEventListener('click', () => { stop(); select(j); });
      t.addEventListener('keydown', (e) => {
        const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        stop();
        select(k, true);
      });
      const bar = $('i', t);
      if (bar) bar.addEventListener('animationend', () => { if (auto) select(i + 1); });
    });
    box.addEventListener('mouseenter', () => box.classList.add('is-paused'));
    box.addEventListener('mouseleave', () => box.classList.remove('is-paused'));
    box.addEventListener('focusin', () => box.classList.add('is-paused'));
    box.addEventListener('focusout', () => box.classList.remove('is-paused'));
    if (pause) {
      pause.hidden = reduce;
      pause.addEventListener('click', () => (auto ? stop() : play()));
    }
    if (auto) play();
  });

  // ---------------------------------------------------------------- tarifs : le simulateur
  // Monthly pricing uses cumulative user tiers: 8 EUR through 20, 7 EUR through 50, then 6 EUR.
  // The slider and numeric input share the same user count; the same inputs feed the time estimate.
  $$('[data-pricing]').forEach((box) => {
    const BASE = { annual: 149, monthly: 249 };
    const TIERS = [[20, 8], [50, 7], [Infinity, 6]];
    const KNOTS = [[0, 1], [100, 20], [200, 50], [300, 500]];
    const sitesIn = $('[data-p-sites]', box);
    const empIn = $('[data-p-emp]', box);
    const range = $('[data-p-range]', box);
    const detail = $('[data-p-detail]', box);
    const total = $('[data-p-total]', box);
    const over = $('[data-p-over]', box);
    const live = $('[data-p-live]', box);
    const copies = $$('[data-p-total-copy]');
    const billing = $$('[data-p-billing]', box);
    if (!sitesIn || !empIn || !range || !detail || !total) return;
    const NB = ' ';
    const euro = (n) => fr(n) + NB + '€';
    const plural = (n, w) => fr(n) + ' ' + w + (n > 1 ? 's' : '');
    const int = (v, fallback) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 ? n : fallback; };
    const toEmp = (pos) => {
      for (let k = 1; k < KNOTS.length; k++) {
        const [p1, e1] = KNOTS[k - 1];
        const [p2, e2] = KNOTS[k];
        if (pos <= p2) return Math.round(e1 + ((pos - p1) * (e2 - e1)) / (p2 - p1));
      }
      return KNOTS[KNOTS.length - 1][1];
    };
    const toPos = (e) => {
      for (let k = 1; k < KNOTS.length; k++) {
        const [p1, e1] = KNOTS[k - 1];
        const [p2, e2] = KNOTS[k];
        if (e <= e2) return p1 + ((e - e1) * (p2 - p1)) / (e2 - e1);
      }
      return KNOTS[KNOTS.length - 1][0];
    };
    const render = () => {
      const monthly = billing.some((input) => input.checked && input.value === 'monthly');
      const basePrice = monthly ? BASE.monthly : BASE.annual;
      const plan = monthly ? 'formule mensuelle' : 'formule annuelle';
      $$('[data-p-base]').forEach((el) => { el.textContent = fr(basePrice); });
      $$('[data-p-plan]').forEach((el) => { el.textContent = plan; });
      const sites = Math.min(500, int(sitesIn.value, 1));
      const emp = Math.min(100000, int(empIn.value, 1));
      range.setAttribute('aria-valuetext', plural(emp, 'utilisateur'));
      const lines = [[plural(sites, 'établissement') + ' × ' + basePrice + NB + '€', sites * basePrice]];
      let prev = 0;
      let left = emp;
      for (const [cap, price] of TIERS) {
        const n = Math.min(left, cap - prev);
        if (n <= 0) break;
        lines.push([plural(n, 'utilisateur') + ' × ' + price + NB + '€', n * price]);
        left -= n;
        prev = cap;
      }
      const sum = lines.reduce((a, l) => a + l[1], 0);
      if (over) over.hidden = true;
      detail.hidden = false;
      total.textContent = fr(sum);
      $$('[data-p-annual]', box).forEach((el) => { el.textContent = fr(sum * 12); });
      total.parentElement.classList.remove('is-quote');
      copies.forEach((el) => { el.textContent = fr(sum); });
      detail.innerHTML = lines.map(([label, amount]) => '<li><span>' + label + '</span><b class="num">' + euro(amount) + '</b></li>').join('');
      if (live) live.textContent = euro(sum) + ' HT par mois pour ' + plural(sites, 'établissement') + ' et ' + plural(emp, 'utilisateur') + ', ' + plan + '.';
    };
    range.addEventListener('input', () => { empIn.value = String(toEmp(Number(range.value))); render(); });
    empIn.addEventListener('input', () => { range.value = String(toPos(Math.min(int(empIn.value, 1), 500))); render(); });
    sitesIn.addEventListener('input', render);
    billing.forEach((input) => input.addEventListener('change', render));
    const step = (d) => { sitesIn.value = String(Math.min(500, Math.max(1, int(sitesIn.value, 1) + d))); sitesIn.dispatchEvent(new Event('input', { bubbles: true })); };
    const minus = $('[data-p-minus]', box);
    const plus = $('[data-p-plus]', box);
    if (minus) minus.addEventListener('click', () => step(-1));
    if (plus) plus.addEventListener('click', () => step(1));
    const form = $('form', box);
    if (form) form.addEventListener('submit', (e) => e.preventDefault());
    let used = false;
    box.addEventListener('input', () => { if (!used) { used = true; track('Simulateur de prix utilisé', { page: location.pathname }); } });
    render();
  });

  // ---------------------------------------------------------------- page d'où vient le visiteur (paramètre « origine », sinon page précédente du site)
  const sourcePage = () => {
    const param = new URLSearchParams(location.search).get('origine');
    if (param) return param;
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin) return new URL(document.referrer).pathname;
    } catch (err) { /* referrer illisible */ }
    return '';
  };
  // what the previous page already tells us is preselected; the visitor can change it
  const PRESET_TYPE = {
    '/pour-qui-hotels': 'Hôtel', '/digitaliser-haccp-hotel': 'Hôtel',
    '/pour-qui-groupes-multi-sites': 'Groupe de plusieurs établissements',
    '/pour-qui-boulangeries': 'Boulangerie, pâtisserie',
    '/pour-qui-franchises-concepts': 'Réseau de franchise', '/client-mystere-franchise-reseau': 'Réseau de franchise',
  };
  const PRESET_PRIORITY = {
    '/module-recettes-food-cost': 'recettes', '/pour-qui-maitriser-cout-matiere': 'recettes',
    '/module-formations': 'formation', '/module-onboarding': 'formation', '/pour-qui-former-nouveaux-arrivants': 'formation',
    '/module-checklists-haccp': 'hygiene', '/module-hygiene-haccp': 'hygiene', '/pour-qui-hygiene-au-quotidien': 'hygiene',
    '/module-communication': 'communication', '/module-client-mystere': 'service', '/module-maintenance': 'maintenance',
    '/module-multi-site': 'multisite', '/pour-qui-piloter-plusieurs-sites': 'multisite', '/pour-qui-groupes-multi-sites': 'multisite',
  };
  const preset = (form, from) => {
    const key = from.replace(/\.html$/, '').replace(/\/$/, '');
    const type = $('select[name="type"]', form);
    if (type && !type.value && PRESET_TYPE[key]) type.value = PRESET_TYPE[key];
    const box = PRESET_PRIORITY[key] && $(`input[name="priorites"][value="${PRESET_PRIORITY[key]}"]`, form);
    if (box) box.checked = true;
  };

  // ---------------------------------------------------------------- demande de démo : préparation locale, envoi choisi dans la messagerie
  $$('form[data-demo-email]').forEach((form) => {
    const fields = $('[data-demo-fields]', form);
    const status = $('[data-demo-mail-status]', form);
    const recipient = form.getAttribute('data-recipient');
    if (!fields || !recipient) return;
    fields.hidden = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = String(data.get('nom') || '').trim();
      const email = String(data.get('email') || '').trim();
      const phone = String(data.get('telephone') || '').trim();
      const body = `Bonjour Issam,\n\nJe souhaite découvrir Staff Meal pour mon établissement.\n\nNom : ${name}\nE-mail : ${email}${phone ? `\nTéléphone : ${phone}` : ''}\n\nMes priorités (à compléter si vous le souhaitez) :\n\nMerci.`;
      const mail = `mailto:${recipient}?subject=${encodeURIComponent('Demande de démonstration Staff Meal')}&body=${encodeURIComponent(body)}`;
      // Never report a sent message: the visitor sends it in their own mail application.
      window.location.href = mail;
      if (status) status.hidden = false;
    });
  });

  // ---------------------------------------------------------------- formulaires en trois étapes (Netlify Forms)
  $$('form[data-steps]').forEach((form) => {
    const steps = $$('[data-step]', form);
    const title = $('[data-step-title]', form);
    const count = $('[data-step-count]', form);
    const bar = $('[data-step-bar]', form);
    const back = $('[data-step-back]', form);
    const next = $('[data-step-next]', form);
    const eventName = form.getAttribute('data-event-step');
    let current = 0;
    const origin = $('[data-origin]', form);
    const from = sourcePage();
    if (origin) origin.value = (from || 'direct') + ' > ' + location.pathname;
    if (from) preset(form, from);
    const show = (i, silent) => {
      current = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      const legend = steps[i] && steps[i].querySelector('legend');
      if (title && legend) title.textContent = legend.textContent.trim();
      if (count) count.textContent = `Étape ${i + 1} sur ${steps.length}`;
      if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
      if (back) back.hidden = i === 0;
      if (next) next.textContent = i === steps.length - 1 ? (next.getAttribute('data-final-label') || 'Envoyer') : 'Continuer';
      if (eventName && !silent) track(eventName, { etape: String(i + 1) });
    };
    const valid = (i) => {
      const fields = $$('input, select, textarea', steps[i]).filter((f) => f.type !== 'hidden');
      for (const f of fields) {
        if (!f.checkValidity()) {
          f.reportValidity();
          f.focus();
          return false;
        }
      }
      return true;
    };
    if (!steps.length || !next) return;
    // with the script, each step is validated here; without it, the browser validates the whole form
    form.noValidate = true;
    form.classList.add('is-stepped');
    // step 1 counts when the visitor starts filling the form, not each time a page that holds it loads
    show(0, true);
    let started = false;
    form.addEventListener('focusin', () => {
      if (started) return;
      started = true;
      if (eventName) track(eventName, { etape: '1' });
    });
    if (back) back.addEventListener('click', () => { show(Math.max(0, current - 1)); const f = $('input, select', steps[current]); if (f) f.focus(); });
    form.addEventListener('submit', (e) => {
      if (!valid(current)) { e.preventDefault(); return; }
      if (current < steps.length - 1) {
        e.preventDefault();
        show(current + 1);
        const f = $('input, select', steps[current]);
        if (f) f.focus();
      }
      // dernière étape valide : envoi normal vers Netlify, puis page de remerciement
    });
  });

  // ---------------------------------------------------------------- page de démo : une ligne propre au module d'où vient le visiteur
  const originLines = $$('[data-origin-line]');
  if (originLines.length) {
    const from = sourcePage().replace(/\.html$/, '');
    const line = originLines.find((el) => el.getAttribute('data-origin-line').replace(/\.html$/, '') === from);
    if (line) line.hidden = false;
  }

  // ---------------------------------------------------------------- manuel : cinq scènes, lecture unique et commandes accessibles
  $$('[data-manual-demo]').forEach((box) => {
    const scenes = $$('[data-demo-scene]', box);
    const steps = $$('[data-demo-step]', box);
    const toggle = $('[data-demo-toggle]', box);
    const caption = $('[data-demo-caption]', box);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const author = box.dataset.demoAuthor || 'Karim';
    const authorPhrase = /^[aeiouyhàâéèêëîïôöùûü]/i.test(author) ? 'd’' + author : 'de ' + author;
    const captions = [`${author} propose une idée.`, `Le responsable échange avec ${author}.`, 'L’idée est retenue avec un motif.', 'Le responsable valide et publie.', `La contribution ${authorPhrase} est reconnue.`];
    if (scenes.length !== captions.length || steps.length !== scenes.length || !toggle || !caption) return;
    $('[data-demo-controls]', box).hidden = false;
    let current = 0;
    let playing = !motion.matches;
    let visible = false;
    let timer;
    let started = 0;
    let remaining = 5000;
    const clear = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, remaining - (performance.now() - started));
      }
    };
    const label = () => {
      toggle.textContent = playing ? 'Pause' : current === scenes.length - 1 ? 'Revoir la démo' : 'Lire la démo';
      toggle.setAttribute('aria-label', playing ? 'Mettre la démo en pause' : toggle.textContent);
    };
    const show = (index) => {
      clear();
      current = index;
      remaining = 5000;
      scenes.forEach((scene, i) => { scene.hidden = i !== current; });
      steps.forEach((step, i) => {
        if (i === current) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      caption.textContent = `${current + 1} / ${scenes.length} · ${captions[current]}`;
      label();
    };
    const schedule = () => {
      clear();
      if (!playing || !visible || document.hidden) return;
      started = performance.now();
      timer = setTimeout(() => {
        timer = undefined;
        if (current === scenes.length - 1) {
          playing = false;
          label();
          return;
        }
        show(current + 1);
        schedule();
      }, remaining);
    };
    steps.forEach((step, index) => step.addEventListener('click', () => {
      playing = false;
      show(index);
    }));
    toggle.addEventListener('click', () => {
      if (playing) { playing = false; clear(); }
      else {
        playing = true;
        if (current === scenes.length - 1) show(0);
        schedule();
      }
      label();
    });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', (event) => {
      if (event.matches) { playing = false; clear(); label(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        schedule();
      }, { threshold: 0.3 }).observe(box);
    } else { visible = true; schedule(); }
    label();
  });

  // ---------------------------------------------------------------- animations des modules et vidéo de démonstration
  $$('[data-anim]').forEach((box) => {
    const video = $('video', box);
    const btn = $('[data-anim-toggle]', box);
    if (!video) return;
    const label = (playing) => {
      if (!btn) return;
      btn.setAttribute('aria-pressed', String(!playing));
      btn.setAttribute('aria-label', playing ? 'Mettre l’animation en pause' : 'Lire l’animation');
      btn.classList.toggle('is-paused', !playing);
    };
    const load = () => {
      $$('source[data-src]', video).forEach((s) => { s.src = s.getAttribute('data-src'); s.removeAttribute('data-src'); });
      if (video.getAttribute('data-src')) { video.src = video.getAttribute('data-src'); video.removeAttribute('data-src'); }
      video.load();
    };
    const start = () => {
      if (reduceMotion) { label(false); return; }
      const p = video.play();
      if (p && p.catch) p.catch(() => label(false));
      label(true);
    };
    if ('IntersectionObserver' in window && video.hasAttribute('data-lazy')) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { io.disconnect(); load(); start(); }
      }, { rootMargin: '200px' });
      io.observe(box);
    } else {
      if (video.hasAttribute('data-lazy')) load();
      start();
    }
    if (btn) btn.addEventListener('click', () => {
      if (video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); label(true); }
      else { video.pause(); label(false); }
    });
  });
  $$('video[data-demo]').forEach((v) => {
    let sent = false;
    v.addEventListener('play', () => { if (!sent) { sent = true; track('Démo vidéo', { page: location.pathname }); } });
  });

  // ---------------------------------------------------------------- filtres (success stories, bibliothèque)
  $$('[data-filters]').forEach((bar) => {
    const scope = document.getElementById(bar.getAttribute('data-filters'));
    if (!scope) return;
    const buttons = $$('[data-filter]', bar);
    bar.hidden = false;
    buttons.forEach((b) => b.addEventListener('click', () => {
      const value = b.getAttribute('data-filter');
      buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      $$('[data-type]', scope).forEach((item) => {
        const types = (item.getAttribute('data-type') || '').split(/\s+/);
        item.hidden = value !== 'tout' && !types.includes(value);
      });
    }));
  });
})();
