# Refonte du site Meal OS vers Staff Meal

Date : 2026-08-05
Statut : validé, prêt pour plan d'implémentation

## Contexte

Le site a été construit du 14 au 17 mars 2026 sous la marque **Meal OS**, comme site d'acquisition d'un SaaS de gestion de restaurant. Il est en ligne sur GitHub Pages (https://staffmeal-saas.github.io/meal-os-landing/), repo `staffmeal-saas/meal-os-landing`, déployé par GitHub Action à chaque push sur `main`.

Depuis, le produit a été reconstruit et vit sous la marque **Staff Meal** (https://staff-meal-f1c61.web.app). Le site n'a pas suivi : il annonce une marque qui n'existe plus, une direction artistique abandonnée, et un périmètre fonctionnel qui ne correspond plus au produit.

Objectif : aligner les 24 pages du site sur le produit et la marque réels.

## État des lieux

### Écart de marque

| | Site (mars) | App (aujourd'hui) |
|---|---|---|
| Nom | Meal OS | Staff Meal |
| Fond | blanc `#FFFFFF` | crème `#f4eedf` |
| Texte | noir `#000000` | encre `#181410` |
| Accent | rouge `#E30613` | orange `#f0481c` |
| Typos | Outfit, Fraunces, Caveat | Familjen Grotesk, Shantell Sans |
| Logo | wordmark manuscrit incliné | mascotte (le barbu au bonnet) |

### Écart de produit

Le site annonce 9 modules en 3 piliers. Trois problèmes :

1. **E-Réputation** est annoncée comme module et n'existe pas dans l'app.
2. Les plus gros chantiers depuis mars sont absents : Client Mystère v2, intégration Skello, calculateur de production, les 6 briques IA, le multi-site et le dashboard réseau.
3. L'ICP a été tranché le 7 juillet (cible ≥ 15 employés, indé sous 15 explicitement disqualifié) et le site parle encore large.

### Défauts bloquants trouvés

1. **Le formulaire bêta ne va nulle part.** Pas d'attribut `action`, pas de `data-netlify`, aucun handler JS. Le CTA principal du site est inopérant sur les 24 pages.
2. **La page `meal-os-vs-skello.html` attaque Skello comme concurrent** alors que l'app s'y synchronise depuis le 2 août (planning importé, tâches ciblées par poste et par service).
3. **Le `canonical` et les balises Open Graph pointent vers `www.mealos.com`**, domaine qui ne répond pas.
4. **Témoignage fabriqué** dans la section ROI (« Julien B., gérant de brasserie à Lyon »). À retirer ou remplacer par un élément vrai.

### État du dépôt

Le dernier commit est du 15 mars (`7890ad9`). **27 fichiers sont modifiés en local et jamais commités** (travail des 16 et 17 mars). La version en ligne correspond au commit, pas au disque. Le travail local est la base de référence pour la refonte, il est plus récent.

## Décisions

| Sujet | Décision |
|---|---|
| Marque | **Staff Meal**, alignée sur l'app. Une seule marque partout. |
| Périmètre | **Les 24 pages**, plus le générateur `generate_pages.py`. |
| Direction artistique | **Tokens de l'app, registre marketing wana.** |
| Page Skello | **Comparatif honnête + intégration.** URL conservée. |
| Formulaire | **Netlify Forms.** Le site migre de GitHub Pages vers Netlify. |

## Direction artistique

Source unique de vérité : `~/projects/staffmeal/src/index.css`. Le brand kit de mai (`~/Downloads/staffmeal-brand-kit/`, DM Sans + Playfair + bleu) est une piste abandonnée, à ne pas utiliser.

Référence de mise en page : `~/Brain/references/branding-da/branding/wana-food-product-range-retro-red-cream.png`. Ce qu'on en reprend : bandeau plein de couleur de marque en tête de page, wordmark en crème dedans, personnage de marque dans le coin du bandeau, fond crème sur toute la page, titre display surdimensionné, respiration généreuse.

### Tokens

```css
--color-cream: #f4eedf;      /* fond de page */
--color-paper: #fbf8ee;      /* surfaces, cartes */
--color-ink: #181410;        /* texte principal */
--color-ink-soft: #4a443c;   /* texte secondaire */
--color-brand: #f0481c;      /* action */
--color-brand-dark: #d33c13; /* hover */
--color-leaf: #4c6b27;       /* preuve, validé */
--color-pause: #a9c6da;      /* respiration */
```

Typographie : **Familjen Grotesk** (400 à 700) pour titres et corps, **Shantell Sans** (500 à 800) pour les accroches manuscrites. Shantell Sans prend exactement le rôle que Caveat tenait sur le site actuel, donc la substitution est directe.

### Identité visuelle

- **Mascotte** : `~/projects/staffmeal/public/brand/mascot.png` et `mascot-mark.png`, à copier dans le site. Elle remplace le wordmark manuscrit « meal OS » incliné.
- **Stickers** : les 14 stickers feutre de `~/projects/staffmeal/src/brand/Stickers.tsx` (tomate, carotte, feuille, couverts, bol, bouteille, pain, toque, horloge, trombone, piment, étincelle, personne, visage) sont extraits en SVG inline et servent de respirations entre les sections. Ils compensent la disparition des bordures 1px qui structuraient l'ancienne page.

### Ce qui est conservé

La structure de la page est validée et ne change pas : hero, les 3 piliers numérotés P-01 / P-02 / P-03, le calculateur ROI, le procédé en 3 étapes, la section écosystème, la FAQ, le bloc de candidature. Ce qui change est le registre visuel et le contenu, pas l'ossature.

## Contenu

### Les 9 modules réactualisés

| Pilier | Modules |
|---|---|
| **P-01 Opérations** | To-Do et checklists HACCP avec preuve photo · Manuel opératoire · Maintenance (tickets, parc, timeline) |
| **P-02 Qualité** | Audit HACCP scoring · **Client Mystère** (remplace E-Réputation) · Recettes, food cost et calculateur de production |
| **P-03 Équipe** | Formations et certification vérifiable · Communication (fil d'actu, messagerie, annuaire) · Gestion d'équipe et multi-site |

### Sections enrichies plutôt qu'un 10e module

- **Écosystème** devient la section Intégrations et nomme **Skello** comme premier connecteur, avec le registre de connecteurs derrière.
- **Bandeau transversal** pour ce qui traverse tous les modules : les 6 briques IA, le multi-site avec dashboard réseau consolidé, la PWA installable, les notifications push.

### Positionnement

L'ICP du PRD du 7 juillet remplace le discours de mars : cible **≥ 15 employés**, segments multi-franchisés, gros restos mono-site et petites chaînes. L'indé sous 15 employés est hors cible et le site doit le dire plutôt que de le laisser croire.

Conséquence sur le **calculateur ROI** : les deux curseurs actuels (CA mensuel, food cost) raisonnent en restaurant unique. Il faut ajouter le **nombre d'employés** et le **nombre d'établissements**, qui sont les axes de qualification commerciale et de tarification retenus.

Le témoignage fabriqué est retiré. S'il faut un élément de preuve à cet endroit, il vient des chiffres réels du produit, pas d'un client inventé.

## Portée technique

Les 24 pages partagent `style.css` et `tailwind.config.js`, donc les tokens se propagent d'eux-mêmes une fois le design system réécrit.

Répartition :

1. `tailwind.config.js` et `input.css` : nouveaux tokens, nouvelles polices.
2. `style.css` : régénéré depuis `input.css`.
3. `index.html` : refonte complète, DA et contenu.
4. Les 22 autres pages : header et footer alignés, naming Meal OS vers Staff Meal, promesses obsolètes corrigées.
5. `generate_pages.py` : mis à jour pour que la prochaine génération sorte déjà à la bonne DA.

### Formulaire

Migration de GitHub Pages vers Netlify. Le dépôt contient déjà `netlify.toml` et un `.netlify/state.json` pointant sur le site `03244cbe-3869-4cfc-baed-432520949cfa`.

Le formulaire reçoit `data-netlify="true"`, un champ `form-name`, et un piège à robots. Le déploiement Netlify se fait avec `--site` explicite, jamais vide, conformément à la règle posée après l'incident d'écrasement de `hum-voice`.

Le site de référence devient l'URL Netlify. Le workflow GitHub Pages est retiré, et une page de redirection est laissée à l'ancienne adresse pour ne pas casser les liens déjà partagés.

### SEO

- Les 3 pages `meal-os-vs-*.html` sont renommées `staffmeal-vs-*.html`, avec une **redirection 301** déclarée dans `netlify.toml` depuis l'ancienne URL. Le passage sur Netlify rend ces redirections gratuites, ce qui n'était pas possible sur GitHub Pages : l'URL colle enfin à la marque sans perdre le référencement acquis.
- `meal-os-vs-skello.html` change d'angle : Skello gère le planning, Staff Meal gère l'exécution du service, et les deux se branchent ensemble. L'intention de recherche comparative est servie sans mentir sur la relation entre les deux produits.
- Le `canonical` et les balises Open Graph passent de `www.mealos.com` à l'URL réellement servie.
- Le titre et la description de chaque page sont revus au nom Staff Meal.

## Ce qui n'est pas dans ce périmètre

- Le repo `~/staff-meal-os` (boilerplate Next.js de janvier), sans rapport.
- L'app elle-même. Sa DA est la source, elle ne bouge pas.
- L'achat d'un nom de domaine. À trancher séparément.

## Critères de réussite

1. Aucune occurrence de « Meal OS » dans le contenu visible des 24 pages.
2. Les couleurs et polices du site correspondent exactement aux tokens de `src/index.css` de l'app.
3. Le formulaire de candidature enregistre réellement une soumission, vérifié en live.
4. Chaque module annoncé sur le site existe dans l'app, et chaque chantier majeur de l'app est représenté sur le site.
5. Aucun témoignage ni chiffre inventé.
6. Le site est en ligne et vérifié en HTTP.
