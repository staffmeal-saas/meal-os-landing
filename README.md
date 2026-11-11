# staff-meal.com

Site public Staff Meal, servi par Netlify (projet `staffmeal-app`) depuis `public/`.

- `public/` : build statique du site v3 (sources dans `staffmeal-saas/staffmeal-site`, préversion GitHub Pages `DamienHoward/staffmeal-site-public`), adapté pour la racine du domaine : chemins `/staffmeal-site-public/` retirés, `noindex` retiré (sauf 404 et pages merci), Plausible branché, sitemap et llms.txt régénérés, fichiers de vérification Google et IndexNow ajoutés.
- `netlify.toml` : 301 historiques (staff-meal.fr, meal-os-*, URL sans extension, anciennes pages outils), proxy Plausible `/s/script`, cache.
- `netlify/edge-functions/plausible-event.ts` : `/s/event` avec l'IP réelle du visiteur.

Deploy : `npx netlify deploy --prod` depuis ce dossier, après `npx netlify status` (doit afficher staffmeal-app).
L'ancien site (v2) est dans l'historique git, branche `refonte-da-v2`.
