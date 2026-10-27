// Home Staff Meal : révélations discrètes et calculateur ROI.

const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

/* ------------------------------------------------------------------
   Calculateur — cadre une discussion, ne promet rien.
   Les hypothèses sont affichées sous le bloc et le taux de coût
   matière est choisi par le visiteur, pas asséné par nous.
   ------------------------------------------------------------------ */
const roiSitesInput = document.getElementById('roi-sites');
const roiEmpInput = document.getElementById('roi-emp');
const roiCaInput = document.getElementById('roi-ca');
const roiFcInput = document.getElementById('roi-fc');

const euro = new Intl.NumberFormat('fr-FR');
// 30 min par jour et par établissement, 6 jours sur 7, 52 semaines.
const HEURES_PAR_SITE_AN = 0.5 * 6 * 52;
const SEUIL_ICP_EMPLOYES = 15;

function updateROI() {
  const sites = parseInt(roiSitesInput.value, 10);
  const employes = parseInt(roiEmpInput.value, 10);
  const ca = parseInt(roiCaInput.value, 10);
  const points = parseInt(roiFcInput.value, 10) / 10; // 10 => 1,0 point

  document.getElementById('sites-val').textContent = sites;
  document.getElementById('emp-val').textContent = employes;
  document.getElementById('ca-val').textContent = euro.format(ca) + ' €';
  document.getElementById('fc-val').textContent = points.toFixed(1).replace('.', ',') + ' pt';

  const caAnnuelReseau = ca * 12 * sites;
  const economieMatiere = caAnnuelReseau * (points / 100);
  const heures = Math.round(sites * HEURES_PAR_SITE_AN);

  document.getElementById('res-matiere').textContent = '+ ' + euro.format(Math.round(economieMatiere)) + ' €';
  document.getElementById('res-temps').textContent = euro.format(heures) + ' h / an';
  document.getElementById('res-total').textContent = euro.format(caAnnuelReseau) + ' €';

  const verdict = document.getElementById('icp-verdict');
  const dansLaCible = employes >= SEUIL_ICP_EMPLOYES;
  verdict.classList.toggle('in', dansLaCible);
  verdict.innerHTML = dansLaCible
    ? '<span>Vous êtes dans la cible.</span>À partir de ' + SEUIL_ICP_EMPLOYES + ' employés, vous ne pouvez plus tout voir vous-même : c\'est là que l\'outil se rentabilise.'
    : '<span>Franchement, pas encore.</span>En dessous de ' + SEUIL_ICP_EMPLOYES + ' employés, vous voyez encore tout le monde tous les jours. Gardez notre boîte à outils gratuite et revenez quand l\'équipe aura grandi.';
}

if (roiSitesInput && roiEmpInput && roiCaInput && roiFcInput) {
  [roiSitesInput, roiEmpInput, roiCaInput, roiFcInput].forEach((el) => el.addEventListener('input', updateROI));
  updateROI();
}

/* ------------------------------------------------------------------
   Démo vivante du hero, façon Notion : deux collègues (curseurs nommés)
   travaillent dans l'app. Léa coche une tâche sur mobile, le tableau de
   bord de la direction suit ; Camille commente puis résout une alerte.
   La scène boucle, se met en pause hors écran et ne tourne pas si
   l'utilisateur demande moins d'animations.
   ------------------------------------------------------------------ */
(() => {
  const stage = document.querySelector('[data-live-demo]');
  if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ARROW = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M2 1.5 15.5 9 9.4 10.4 6.6 16.3Z" fill="currentColor" stroke="white" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  let visible = false;

  const wait = (ms) => new Promise((resolve) => {
    let left = ms;
    const tick = () => {
      if (visible) left -= 100;
      if (left <= 0) resolve(); else setTimeout(tick, 100);
    };
    setTimeout(tick, 100);
  });

  const makeCursor = (name, color) => {
    const el = document.createElement('div');
    el.className = 'live-cursor';
    el.style.color = color;
    el.style.setProperty('--c', color);
    el.innerHTML = ARROW + '<span style="background:' + color + '">' + name + '</span>';
    el.setAttribute('aria-hidden', 'true');
    stage.appendChild(el);
    return el;
  };

  // Position d'un élément dans le repère de la scène (fonctionne aussi avec le zoom mobile)
  const spot = (el, fx = 0.5, fy = 0.5) => {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width * fx, y: r.top - s.top + r.height * fy };
  };
  const moveTo = (cursor, p) => { cursor.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; };
  // Le curseur sort par un côté en s'effaçant (jamais visible au repos)
  const park = (cursor, side) => {
    const s = stage.getBoundingClientRect();
    cursor.classList.remove('on');
    moveTo(cursor, { x: side === 'right' ? s.width - 40 : 20, y: s.height * 0.75 });
  };
  const click = async (cursor) => {
    cursor.classList.remove('click');
    void cursor.offsetWidth;
    cursor.classList.add('click');
    await wait(250);
  };

  const countTo = (el, to, suffix = '', from = 0, ms = 900) => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const typeInto = async (el, text) => {
    el.textContent = '';
    for (const ch of text) {
      el.textContent += ch;
      await wait(55);
    }
  };

  const snapshot = {
    dash: stage.querySelector('.dashboard-window').innerHTML,
    phone: stage.querySelector('.phone-window').innerHTML,
  };
  const lea = makeCursor('Léa · Cuisine', '#0f7b6c');
  const camille = makeCursor('Camille · Direction', '#2383e2');
  const comment = document.createElement('div');
  comment.className = 'live-comment';
  comment.setAttribute('aria-hidden', 'true');
  comment.innerHTML = '<b><i>C</i>Camille</b><p></p>';
  stage.appendChild(comment);

  const intro = () => {
    stage.classList.add('live-intro');
    void stage.offsetWidth;
    requestAnimationFrame(() => stage.classList.remove('live-intro'));
    stage.querySelectorAll('[data-count]').forEach((el) => countTo(el, Number(el.dataset.count), el.dataset.suffix || ''));
  };

  const scene = async () => {
    const q = (sel) => stage.querySelector(sel);
    park(lea, 'right');
    park(camille, 'left');
    await wait(1400);

    // 1. Léa coche une tâche de la fermeture HACCP sur son téléphone
    lea.classList.add('on');
    moveTo(lea, spot(q('#phone-haccp'), 0.55, 0.55));
    await wait(1400);
    await click(lea);
    const phoneCard = q('#phone-haccp');
    phoneCard.classList.add('pop');
    phoneCard.querySelector('small').textContent = '5 / 7 tâches · reste 44 min';
    phoneCard.querySelector('u').style.setProperty('--w', '71%');

    // 2. Le tableau de bord de la direction suit en direct
    await wait(500);
    const row = q('#row-haccp');
    row.querySelector('small').textContent = '5/7 · 22:30 à 01:00';
    row.querySelector('i').style.setProperty('--w', '71%');
    countTo(q('#kpi-done'), 88, ' %', 86, 700);
    q('#kpi-done-sub').textContent = '44/50 tâches';
    q('#bar-today').style.setProperty('--h', '88%');
    const feed = q('#feed');
    const item = document.createElement('div');
    item.className = 'activity enter';
    item.innerHTML = '<i><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/> <path d="m9 14 2 2 4-4"/></svg></i><p><b>Léa</b> a relevé la chambre froide · 3,1 °C<small>à l’instant</small></p>';
    feed.querySelector('.panel-title').after(item);
    const items = feed.querySelectorAll('.activity');
    if (items.length > 3) items[items.length - 1].remove();
    await wait(900);
    park(lea, 'right');

    // 3. Camille commente l'alerte maintenance puis la résout
    await wait(600);
    const alert = q('#alert-maint');
    camille.classList.add('on');
    moveTo(camille, spot(alert, 0.2, 0.5));
    await wait(1400);
    // Le commentaire s'ouvre vers la gauche pour ne pas passer sous le téléphone
    const at = spot(alert, 0.2, 1);
    comment.style.left = Math.max(8, at.x - comment.offsetWidth + 24) + 'px';
    comment.style.top = (at.y + 8) + 'px';
    comment.classList.add('on');
    await typeInto(comment.querySelector('p'), 'Technicien passé, four OK.');
    await wait(900);
    await click(camille);
    comment.classList.remove('on');
    alert.classList.add('resolved');
    alert.innerHTML = '<i><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/> <path d="m9 12 2 2 4-4"/></svg></i><p><b>Maintenance résolue</b><small>Four mixte · par Camille</small></p>';
    q('#alert-count').textContent = '1 ouverte';

    // 4. Camille a vu la tâche de Léa (sauté si le téléphone cache la ligne, en mobile)
    await wait(700);
    const target = spot(item, 0.15, 0.5);
    const phone = spot(q('.phone-window'), 0, 0);
    if (!(target.x > phone.x && target.y > phone.y)) {
      moveTo(camille, target);
      await wait(1300);
      await click(camille);
      item.querySelector('b').insertAdjacentHTML('afterend', '<span class="seen">Vu</span>');
      await wait(900);
    }
    park(camille, 'left');
    await wait(3500);

    // 5. Retour à l'état initial, puis on rejoue
    stage.classList.add('live-reset');
    await wait(400);
    stage.querySelector('.dashboard-window').innerHTML = snapshot.dash;
    stage.querySelector('.phone-window').innerHTML = snapshot.phone;
    comment.querySelector('p').textContent = '';
    stage.classList.remove('live-reset');
  };

  let started = false;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !started) {
      started = true;
      intro();
      (async () => { for (;;) await scene(); })();
    }
  }, { threshold: 0.25 }).observe(stage);
})();

// ---------------------------------------------------------------
// Lot Kitchen (27/10/2026)
// ---------------------------------------------------------------
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chiffres qui comptent : défilent de 0 à leur valeur quand le bandeau entre à l'écran.
document.querySelectorAll('.facts-grid b[data-n]').forEach((el) => {
  const target = Number(el.dataset.n);
  const textNode = el.firstChild;
  if (calm || !('IntersectionObserver' in window) || !textNode) return;
  textNode.nodeValue = '0';
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      textNode.nodeValue = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(el);
});

// Piliers en onglets : chaque onglet joue la boucle de son module, puis passe au suivant.
// Un clic (ou les flèches du clavier) reprend la main : la boucle tourne alors sur place.
const pillarTabs = document.querySelector('[data-pillar-tabs]');
if (pillarTabs) {
  const tabs = [...pillarTabs.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const videos = [...pillarTabs.querySelectorAll('.pt-video')];
  const fills = tabs.map((t) => t.querySelector('u'));
  let current = 0, auto = !calm, visible = false;

  const load = (v) => { if (!v.src) v.src = v.dataset.src; };
  const show = (i, focus = false) => {
    current = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; panels[k].hidden = k !== i; fills[k].style.transform = 'scaleX(0)'; });
    videos.forEach((v, k) => { v.classList.toggle('on', k === i); if (k !== i) v.pause(); });
    const v = videos[i];
    load(v); v.loop = !auto; v.currentTime = 0;
    if (visible && !calm) v.play().catch(() => {});
    if (focus) tabs[i].focus();
  };
  videos.forEach((v, k) => v.addEventListener('ended', () => { if (auto && k === current) show((current + 1) % tabs.length); }));
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { auto = false; show(i); });
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) { e.preventDefault(); auto = false; show((current + d + tabs.length) % tabs.length, true); }
    });
  });
  // La barre sous l'onglet actif suit la lecture de la boucle
  const tick = () => {
    const v = videos[current];
    if (v.duration) fills[current].style.transform = `scaleX(${auto ? v.currentTime / v.duration : 1})`;
    requestAnimationFrame(tick);
  };
  if (!calm) requestAnimationFrame(tick);
  if (calm) { videos.forEach((v) => { v.controls = true; }); load(videos[0]); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      const v = videos[current];
      if (visible && !calm) { load(v); v.play().catch(() => {}); } else v.pause();
    }, { threshold: 0.35 }).observe(pillarTabs.querySelector('.pt-frame'));
  } else { visible = true; show(0); }
}

// Candidature en 3 étapes : une question à la fois, même formulaire Netlify à l'arrivée.
const stepForm = document.querySelector('form[data-steps]');
if (stepForm) {
  const steps = [...stepForm.querySelectorAll('.step')];
  const bars = [...stepForm.querySelectorAll('.step-bar i')];
  const title = stepForm.querySelector('[data-step-title]');
  const count = stepForm.querySelector('[data-step-count]');
  const back = stepForm.querySelector('[data-step-back]');
  const next = stepForm.querySelector('[data-step-next]');
  const finalLabel = next.textContent;
  let at = 0;
  const render = (focus) => {
    steps.forEach((s, i) => { s.hidden = i !== at; });
    bars.forEach((b, i) => b.classList.toggle('on', i <= at));
    title.textContent = steps[at].dataset.step;
    count.textContent = `${at + 1}/${steps.length}`;
    back.hidden = at === 0;
    next.textContent = at === steps.length - 1 ? finalLabel : 'Continuer';
    if (focus) steps[at].querySelector('input')?.focus();
  };
  stepForm.classList.add('is-steps');
  stepForm.noValidate = true; // les champs des étapes cachées bloqueraient la validation native
  stepForm.addEventListener('submit', (e) => {
    const fields = [...steps[at].querySelectorAll('input')];
    if (!fields.every((f) => f.reportValidity())) { e.preventDefault(); return; }
    if (at === steps.length - 1) {
      // Dernière étape : on revérifie tout, puis envoi normal vers Netlify
      const bad = steps.findIndex((s) => [...s.querySelectorAll('input')].some((f) => !f.checkValidity()));
      if (bad === -1) return;
      e.preventDefault(); at = bad; render(true); steps[at].querySelector('input:invalid')?.reportValidity();
      return;
    }
    e.preventDefault();
    at += 1; render(true);
    if (typeof window.plausible === 'function') window.plausible('Candidature étape', { props: { etape: String(at + 1) } });
  });
  back.addEventListener('click', () => { at = Math.max(0, at - 1); render(true); });
  render(false);
}

// CTA collant mobile : visible une fois le hero passé, caché quand le formulaire est à l'écran.
const sticky = document.querySelector('[data-sticky-cta]');
const heroEl = document.querySelector('.hero');
const applyEl = document.getElementById('demo');
if (sticky && heroEl && applyEl && 'IntersectionObserver' in window) {
  let pastHero = false, onForm = false;
  const sync = () => sticky.classList.toggle('show', pastHero && !onForm);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(heroEl);
  // Caché dès que le formulaire arrive à l'écran, et après (footer compris)
  new IntersectionObserver(([e]) => { onForm = e.isIntersecting || e.boundingClientRect.top < 0; sync(); }, { threshold: 0.15 }).observe(applyEl);
}
