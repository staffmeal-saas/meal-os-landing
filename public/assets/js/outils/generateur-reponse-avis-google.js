/* Staff Meal: generator of replies to negative Google reviews.
   Everything happens in the browser: no request, nothing stored, nothing sent.
   Each reply follows the method of the page: acknowledge, recognise or restore the facts
   without arguing, state the action, offer to continue in private, sign with a first name. */
(() => {
  'use strict';

  const form = document.querySelector('[data-avis-form]');
  const out = document.querySelector('[data-avis-out]');
  if (!form || !out) return;
  const live = document.querySelector('[data-avis-live]');
  const copyBtn = document.querySelector('[data-avis-copy]');

  const NBSP = ' ';
  const field = (name) => form.elements.namedItem(name);

  // {action}: the reader's own sentence when given, otherwise a commitment the restaurant can keep
  const TEMPLATES = {
    attente: {
      empathique: {
        text: 'merci d’avoir pris le temps de nous écrire. Vous avez attendu trop longtemps, et nous le regrettons sincèrement. {action} Si vous le souhaitez, écrivez-nous directement' + NBSP + ': nous serions heureux de vous recevoir à nouveau.',
        action: 'Nous revoyons avec l’équipe l’organisation de ce service pour que cela ne se reproduise pas.',
      },
      ferme: {
        text: 'merci pour votre retour. Ce jour-là, le service a pris du retard, et ce n’est pas le rythme que nous voulons tenir. {action} Pour en parler, écrivez-nous directement.',
        action: 'Nous revoyons l’organisation de ce service avec l’équipe.',
      },
    },
    prix: {
      empathique: {
        text: 'merci d’avoir pris le temps de nous écrire. Nous comprenons que l’addition ne corresponde pas à ce que vous attendiez, et votre remarque compte pour nous. {action} Si vous souhaitez en parler, écrivez-nous directement.',
        action: 'Nous la transmettons à l’équipe qui prépare la carte.',
      },
      ferme: {
        text: 'merci pour votre retour. Nos prix sont affichés à l’entrée et sur la carte, avant toute commande. {action} Nous respectons votre avis, et nous restons à votre disposition pour en parler directement.',
        action: 'Ils reflètent nos choix de produits et de préparation.',
      },
    },
    service: {
      empathique: {
        text: 'merci d’avoir pris le temps de nous écrire. L’accueil que vous décrivez n’est pas celui que nous voulons offrir, et nous en sommes désolés. {action} Écrivez-nous directement si vous souhaitez nous en dire plus' + NBSP + ': nous serions heureux de vous recevoir à nouveau.',
        action: 'Nous en parlons avec l’équipe de salle avant le prochain service.',
      },
      ferme: {
        text: 'merci pour votre retour. Nous attendons de chacun en salle un accueil attentif, même en plein service, et nous regrettons que cela n’ait pas été le cas lors de votre visite. {action} Pour en parler, écrivez-nous directement.',
        action: 'Nous en parlons avec l’équipe de salle avant le prochain service.',
      },
    },
    qualite: {
      empathique: {
        text: 'merci d’avoir pris le temps de nous écrire. Nous sommes désolés que votre plat n’ait pas été à la hauteur. {action} Écrivez-nous directement si vous le souhaitez' + NBSP + ': nous aimerions vous recevoir à nouveau.',
        action: 'Votre remarque est transmise au chef, qui revoit ce plat avec la brigade.',
      },
      ferme: {
        text: 'merci pour votre retour. Ce que vous décrivez ne correspond pas à ce que nous voulons servir. {action} Si une assiette ne vous convient pas, dites-le en salle sur le moment' + NBSP + ': c’est là que nous pouvons la reprendre.',
        action: 'Le chef revoit ce plat avec la brigade.',
      },
    },
    // only what choosing this motif tells us: no trace of the visit. No checks the user did not
    // enter (booking, till), no judgement on the facts described.
    faux: {
      empathique: {
        text: 'merci pour votre message. Nous ne retrouvons pas trace de votre visite. {action} Si nous faisons erreur, écrivez-nous directement avec la date et l’heure' + NBSP + ': nous voulons comprendre ce qui s’est passé.',
        action: '',
      },
      ferme: {
        text: 'nous ne retrouvons pas trace de votre visite. {action} Si elle a bien eu lieu, écrivez-nous directement avec la date et l’heure' + NBSP + ': nous regarderons ensemble ce qui s’est passé.',
        action: '',
      },
    },
  };

  const clean = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  // the reader's sentence: capital letter, final full stop, typographic apostrophe
  const sentence = (value) => {
    let s = clean(value, 240).replace(/'/g, '’');
    if (!s) return '';
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[.!?…]$/.test(s)) s += '.';
    return s;
  };

  const build = () => {
    const motif = TEMPLATES[field('motif').value] ? field('motif').value : 'service';
    const tonInput = form.querySelector('input[name="ton"]:checked');
    const ton = tonInput && tonInput.value === 'ferme' ? 'ferme' : 'empathique';
    const tpl = TEMPLATES[motif][ton];
    const nom = clean(field('nom').value, 60);
    const action = sentence(field('action').value) || tpl.action;
    const signature = clean(field('signature').value, 60).replace(/'/g, '’') || 'L’équipe';
    const hello = nom ? `Bonjour ${nom},` : 'Bonjour,';
    const body = tpl.text.replace('{action}', action).replace(/\s{2,}/g, ' ').trim();
    return `${hello} ${body}\n${signature}`;
  };

  const render = () => {
    out.textContent = build();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    render();
  });
  // a new motif or tone shows its reply at once; text fields update on submit or when they lose focus
  form.addEventListener('change', render);

  const say = (message) => {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => { live.textContent = message; }, 60);
  };

  const selectOutput = () => {
    const range = document.createRange();
    range.selectNodeContents(out);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  if (copyBtn) {
    const label = copyBtn.textContent;
    copyBtn.addEventListener('click', () => {
      const text = out.textContent;
      const done = () => {
        copyBtn.textContent = 'Réponse copiée';
        say('Réponse copiée dans le presse-papiers.');
        window.setTimeout(() => { copyBtn.textContent = label; }, 2000);
      };
      const fallback = () => {
        selectOutput();
        say('Le texte de la réponse est sélectionné' + NBSP + ': copiez-le avec le raccourci de votre appareil.');
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  }
})();
