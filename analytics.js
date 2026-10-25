// Mesure d'audience Staff Meal : Plausible auto-hébergé (stats.staff-meal.com), sans cookie.
// Le script et les événements passent par staff-meal.com/s/* (proxy Netlify + Edge Function,
// voir netlify.toml), ce qui évite les bloqueurs de publicité et garde l'IP réelle du visiteur.
// Chaque nom d'événement correspond à un objectif créé dans Plausible : le renommer ici sans
// le renommer là-bas fait disparaître ses chiffres du dashboard.
// Aucune donnée saisie par le visiteur n'est envoyée (seulement des noms de champs et des compteurs).
(() => {
  const page = location.pathname;
  const ignored = (() => {
    try { if (localStorage.getItem('plausible_ignore') === 'true') return true; } catch (e) { /* stockage indisponible */ }
    return navigator.webdriver === true || location.hostname !== 'staff-meal.com';
  })();

  const clip = (text, max = 60) => (text || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const track = (name, props) => {
    if (typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
  };
  // Envoi qui survit à la fermeture de l'onglet (abandon de formulaire, temps passé)
  const beacon = (name, props) => {
    if (ignored) return;
    const body = JSON.stringify({ n: name, u: location.href, d: 'staff-meal.com', r: document.referrer || null, p: props || {} });
    if (navigator.sendBeacon) navigator.sendBeacon('/s/event', new Blob([body], { type: 'text/plain' }));
    else fetch('/s/event', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } });
  };

  // Parcours dans l'onglet : pages vues et durée depuis l'arrivée sur le site
  const visit = (() => {
    const now = Date.now();
    let data = { start: now, pages: 0 };
    try { data = JSON.parse(sessionStorage.getItem('sm_visit')) || data; } catch (e) { /* première page ou stockage bloqué */ }
    data.pages += 1;
    try { sessionStorage.setItem('sm_visit', JSON.stringify(data)); } catch (e) { /* idem */ }
    return data;
  })();
  const bucket = (ms) => {
    const s = ms / 1000;
    if (s < 30) return 'moins de 30 s';
    if (s < 120) return '30 s à 2 min';
    if (s < 300) return '2 à 5 min';
    if (s < 900) return '5 à 15 min';
    return 'plus de 15 min';
  };
  const journey = () => ({ temps_sur_le_site: bucket(Date.now() - visit.start), pages_vues: String(Math.min(visit.pages, 10)) + (visit.pages >= 10 ? '+' : '') });

  // Contexte d'un élément : zone de la page et section qui le contient
  const zoneOf = (el) => {
    if (el.closest('.announcement')) return 'bandeau';
    if (el.closest('.main-nav, .header-actions, header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('aside, .sidebar')) return 'encart';
    return 'contenu';
  };
  const sectionOf = (el) => {
    const tagged = el.closest('[data-section]');
    if (tagged) return tagged.dataset.section;
    const s = el.closest('section, aside, header, footer, article');
    if (!s) return 'page';
    if (s.dataset.section) return s.dataset.section;
    const h = s.querySelector('h2, h1, h3');
    return clip(h ? h.textContent : (s.id || s.className.split(' ')[0] || s.tagName.toLowerCase()), 50);
  };
  const typeOf = (href) => {
    if (/#(demo|candidature)$/.test(href)) return 'CTA postuler';
    if (href.startsWith('tel:')) return 'téléphone';
    if (href.startsWith('mailto:')) return 'email';
    if (href.includes('boite-a-outils') || href.startsWith('outils/') || href.includes('/outils/')) return 'boîte à outils';
    if (/^https?:\/\//.test(href) && !href.includes('staff-meal.com')) return 'externe';
    if (href.includes('app.staff-meal.com')) return 'app';
    if (href.startsWith('#') || href.startsWith('/#')) return 'ancre';
    return 'interne';
  };

  // 1. Tous les clics sur un lien ou un bouton, avec de quoi savoir lequel convertit
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button, summary');
    if (!el || el.closest('[aria-hidden="true"]')) return;
    const href = el.getAttribute('href') || '';
    // Première ligne visible seulement (une carte contient titre + description)
    const firstLine = (el.innerText || el.textContent || '').split('\n').map((l) => l.trim()).find(Boolean);
    const label = clip(el.getAttribute('aria-label') || firstLine) || '(icône)';
    const ctx = { emplacement: zoneOf(el), section: sectionOf(el), page };

    if (el.tagName === 'A') {
      const type = typeOf(href);
      track('Clic', { texte: label, destination: clip(href, 100), type, ...ctx });
      if (type === 'CTA postuler') track('Clic Postuler', { ...ctx, texte: label, ...journey() });
      else if (type === 'boîte à outils') track('Clic boîte à outils', ctx);
    } else if (el.id === 'menu-toggle') {
      if (el.getAttribute('aria-expanded') !== 'true') track('Menu mobile ouvert', { page });
    } else if (el.tagName === 'BUTTON' && el.type !== 'submit') {
      track('Clic', { texte: label, destination: '(bouton)', type: 'bouton', ...ctx });
    }
  });

  // 2. Clic rageur : 3 clics en moins d'une seconde au même endroit (bug ou élément qui semble cliquable)
  const rage = { el: null, n: 0, t: 0, done: new Set() };
  document.addEventListener('click', (e) => {
    const now = Date.now();
    if (e.target === rage.el && now - rage.t < 1000) rage.n += 1; else { rage.el = e.target; rage.n = 1; }
    rage.t = now;
    if (rage.n === 3 && !rage.done.has(e.target)) {
      rage.done.add(e.target);
      const t = e.target;
      track('Clic rageur', { element: clip(t.textContent, 40) || t.tagName.toLowerCase(), section: sectionOf(t), page });
    }
  });

  // 3. Questions FAQ ouvertes : les objections réelles des prospects
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.tagName === 'DETAILS' && d.open) track('FAQ ouverte', { question: clip(d.querySelector('summary')?.textContent.replace('＋', ''), 90), page });
  }, true);
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.faq-item');
    if (item) setTimeout(() => { if (item.classList.contains('active')) track('FAQ ouverte', { question: clip(item.querySelector('h3')?.textContent, 90), page }); }, 0);
  });

  // 4. Formulaires : commencé, envoyé, abandonné (jusqu'où, sans jamais lire les valeurs)
  const FORMS = {
    'candidature-beta': 'Candidature envoyée',
    'acces-boite-a-outils': 'Accès boîte à outils',
    'evenements-invitations': 'Inscription invitations',
  };
  const forms = new Map();
  const fieldsOf = (form) => [...form.querySelectorAll('input, select, textarea')].filter((f) => f.type !== 'hidden' && f.name && f.name !== 'bot-field');
  document.addEventListener('focusin', (e) => {
    const form = e.target.closest('form[name]');
    const name = form && form.getAttribute('name');
    if (!FORMS[name]) return;
    const state = forms.get(form) || { name, last: '', sent: false, startedAt: Date.now() };
    if (!forms.has(form)) { forms.set(form, state); track('Formulaire commencé', { formulaire: name, page }); }
    state.last = e.target.name || state.last;
  });
  document.addEventListener('submit', (e) => {
    const name = e.target.getAttribute('name');
    if (!FORMS[name]) return;
    const state = forms.get(e.target);
    if (state) state.sent = true;
    track(FORMS[name], { page, ...journey(), temps_de_saisie: state ? bucket(Date.now() - state.startedAt) : 'inconnu' });
  }, true);
  window.addEventListener('pagehide', () => {
    forms.forEach((state, form) => {
      if (state.sent) return;
      const fields = fieldsOf(form);
      const filled = fields.filter((f) => f.value && f.value.trim()).length;
      beacon('Formulaire abandonné', { formulaire: state.name, dernier_champ: state.last || 'aucun', champs_remplis: `${filled}/${fields.length}`, page });
      state.sent = true;
    });
  });

  // 5. Outils et calculateurs : première utilisation sur la page (hors formulaires de contact)
  let toolTracked = false;
  document.addEventListener('input', (e) => {
    if (toolTracked || e.target.closest('form[name]')) return;
    toolTracked = true;
    if (e.target.id && e.target.id.startsWith('roi-')) track('Calculateur ROI utilisé', { page });
    else track('Outil utilisé', { outil: clip(document.title.split('|')[0], 60), page });
  });

  // 6. Sections réellement vues (au moins 40 % de la section, ou la moitié de l'écran)
  const HOME_SECTIONS = {
    '.hero': 'Hero', '#produit': 'Démo produit', '.problems': 'Problèmes', '.compare': 'Avant / après', '.two-views': 'Deux usages',
    '#modules': 'Les 9 modules', '#multisite': 'Multi-site', '#roi-calculator': 'Calculateur ROI', '.letter': "Mot de l'équipe",
    '#procede': "Protocole d'adhésion", '.integration': 'Connecteurs', '#faq': 'FAQ', '.resources': 'Les quatre sujets', '#demo': 'Formulaire candidature',
  };
  const ready = () => {
    Object.entries(HOME_SECTIONS).forEach(([sel, label]) => { const el = document.querySelector(sel); if (el) el.dataset.section = label; });
    const sections = [...document.querySelectorAll('main section, main [data-section]')];
    if ('IntersectionObserver' in window && sections.length) {
      const seen = new Set();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const big = en.intersectionRect.height >= window.innerHeight * 0.5;
          if ((en.intersectionRatio >= 0.4 || big) && !seen.has(en.target)) {
            seen.add(en.target);
            io.unobserve(en.target);
            const s = en.target;
            const label = s.dataset.section || clip(s.querySelector('h2, h1, h3')?.textContent, 50) || s.id || 'section sans titre';
            track('Section vue', { section: label, page });
          }
        });
      }, { threshold: [0, 0.4, 0.6] });
      sections.forEach((s) => io.observe(s));
    }
    // Pages guides : le contenu est un <article>, on suit chaque intertitre lu (profondeur de lecture)
    if (!document.querySelector('[data-live-demo]') && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          track('Section vue', { section: clip(en.target.textContent, 50), page });
        });
      }, { threshold: 1 });
      document.querySelectorAll('main article h2').forEach((h) => io.observe(h));
    }

    // 7. Lecture complète : le visiteur arrive jusqu'au footer
    const footer = document.querySelector('footer');
    if (footer && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { track('Lecture complète', { page, ...journey() }); io.disconnect(); }
      });
      io.observe(footer);
    }

    // 8. Démo animée du hero regardée au moins 8 secondes d'affilée
    const demo = document.querySelector('[data-live-demo]');
    if (demo && 'IntersectionObserver' in window) {
      let timer = null;
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          timer = timer || setTimeout(() => { track('Démo animée vue', { page }); io.disconnect(); }, 8000);
        } else { clearTimeout(timer); timer = null; }
      }, { threshold: 0.5 });
      io.observe(demo);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

  // 9. Texte copié (intérêt pour un contenu), une fois par page
  let copied = false;
  document.addEventListener('copy', () => {
    if (copied) return;
    copied = true;
    track('Texte copié', { section: sectionOf(document.getSelection()?.anchorNode?.parentElement || document.body), page });
  });

  // 10. Erreurs JavaScript vécues par les visiteurs (3 max par page)
  let errors = 0;
  window.addEventListener('error', (e) => {
    if (errors >= 3 || !e.message || e.message === 'Script error.') return;
    errors += 1;
    track('Erreur JS', { message: clip(e.message, 100), fichier: clip((e.filename || '').split('/').pop(), 40), page });
  });

  // 11. Page 404 : on garde le chemin demandé pour repérer les liens cassés
  if (/introuvable/i.test(document.title)) track('404', { chemin: page + location.search, depuis: clip(document.referrer, 100) || 'direct' });
})();
