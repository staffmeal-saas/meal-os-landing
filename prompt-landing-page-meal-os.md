# PROMPT — Génération Landing Page Meal OS

---

## CONTEXTE

Tu es un expert en web design, CRO (Conversion Rate Optimization) et développement frontend. Tu vas créer une landing page complète pour **Meal OS**, une suite d'applications modulaire destinée aux restaurateurs.

**Meal OS** est un système d'exploitation pour restaurants. Son slogan : **"Gérez votre restaurant comme un chef."**

Le produit est une plateforme SaaS à 200€/mois composée de 9 modules interconnectés. Le différenciateur principal est l'onboarding sur site par un consultant (pas de self-service). La cible : restaurateurs indépendants et petites chaînes en France.

---

## DIRECTION ARTISTIQUE — RÉFÉRENCE OBLIGATOIRE

### Design de référence principal
S'inspirer **très fortement** du site [https://www.themobilefirstcompany.com](https://www.themobilefirstcompany.com) pour :

- **L'énergie visuelle** : Design bold, vivant, pas corporate. Mélange de profondeur, textures et éléments graphiques forts.
- **La composition spatiale** : Sections généreuses avec beaucoup de whitespace, éléments qui se chevauchent légèrement, asymétrie maîtrisée, layouts qui cassent la grille classique.
- **La typographie audacieuse** : Titres très grands (display font), hiérarchie typographique forte avec un contraste marqué entre les tailles.
- **Les micro-détails** : Badges, étiquettes, éléments décoratifs qui ajoutent de la personnalité.

### Animations — Reproduire le style de The Mobile First Company
Implémenter les types d'animations suivants, directement inspirés du site de référence :

1. **Scroll-triggered reveal** : Les sections et éléments apparaissent au scroll avec des animations staggered (fade-in + translate-Y + légère rotation pour certains éléments). Utiliser `IntersectionObserver` pour déclencher les animations quand les éléments entrent dans le viewport.

2. **Parallax subtil** : Certains éléments de fond (illustrations, formes décoratives) se déplacent à une vitesse différente du scroll, créant de la profondeur. Pas de parallax lourd — juste un décalage subtil.

3. **Hover states expressifs** : Les cartes de modules doivent avoir des hover states riches — scale légère, changement de shadow, mouvement d'un élément interne (icône qui bouge, badge qui pulse).

4. **Compteur animé / ticker** : Pour les chiffres clés, animer le comptage (counter animation) quand la section entre dans le viewport.

5. **Marquee / défilement infini** : Un bandeau défilant horizontal (type ticker tape) avec les noms des modules ou des bénéfices clés, similaire à l'effet "let's breathe / you are on mobile first" du site de référence.

6. **Entrance staggerée des cards** : Quand la section modules apparaît, les cards apparaissent une par une avec un délai progressif (stagger de 100-150ms entre chaque).

7. **Smooth scroll** : Navigation fluide entre les sections via les ancres du menu.

8. **Header qui se transforme au scroll** : Le header devient plus compact et prend un background blur/glass quand l'utilisateur scrolle.

### Images de référence
L'utilisateur fournira des photos (images du produit, de l'univers restaurant, mockups). **Tu DOIS** :
- Intégrer ces images dans le design comme éléments visuels principaux
- Les traiter avec des styles cohérents (border-radius, shadows, overlays)
- Ne PAS utiliser de placeholders génériques si des images sont fournies
- Si aucune image n'est fournie, utiliser des placeholders avec des `background-color` solides et des icônes, PAS des images stock

---

## STRUCTURE DE LA PAGE

### Section 1 — HERO
- **Badge visuel "Le Différenciateur"** : "Le programme Bêta est ouvert : 50 places uniquement." (bien visible, au-dessus du titre, pour créer l'urgence)
- **Headline** : "Gérez votre restaurant comme un chef." (grande typo display, animation d'entrée lettre par lettre ou mot par mot)
- **Sous-titre** : "Plannings, stocks, maintenance, HACCP, communication — tout au même endroit, enfin." (fade-in décalé après le titre)
- **CTA principal** : "Postuler à la Bêta Privée" (bouton proéminent, hover animé, focus sur l'exclusivité)
- **CTA secondaire** : "Découvrir les modules" (lien ancre vers la section modules, style texte + flèche)
- **Élément visuel** : Un mockup de l'interface Meal OS ou une composition d'écrans montrant plusieurs modules (si des images/mockups sont fournis, les utiliser ici)
- **Pas de mention de prix dans le hero**

### Section 2 — BANDEAU DÉFILANT (Marquee)
- Un ticker tape horizontal en défilement continu avec les 9 noms de modules séparés par des points ou étoiles : "Audit HACCP ✦ Client Mystères ✦ Communication ✦ Formation ✦ Gestion du Personnel ✦ Maintenance ✦ Manuel OPS ✦ Recette ✦ TodoList"
- Style : fond contrasté (sombre si le hero est clair), typo uppercase bold

### Section 3 — PROBLÈME / IDENTIFICATION
- **Titre de section** : "On sait ce que c'est, le quotidien d'un restaurateur. Et on sait ce que ça vous coûte."
- 4 cards ou blocs visuels présentant les pain points (avec focus sur l'impact financier et l'équipe) :
  1. "Vos fiches HACCP traînent dans un classeur que personne n'ouvre" → **Risque d'amende et fermeture.**
  2. "Vos recettes sont dans la tête de votre chef, pas dans un système" → **Marge non maîtrisée et gaspillage.**
  3. "Vous découvrez les problèmes de service par les avis Google" → **Perte de clientèle et baisse de CA.**
  4. "Les tâches du jour se perdent entre le briefing et le coup de feu" → **Désorganisation et turnover.**
- **Transition** : Une phrase de liaison vers la solution — "Et si un seul système pouvait sécuriser vos marges et votre qualité de service ?"
- Animation : Cards qui apparaissent en stagger au scroll

### Section 4 — LES 9 MODULES (Section principale)
Organiser les modules en **3 piliers**. Chaque pilier est une sous-section avec un titre, et contient 3 modules.

**Pilier 1 — "Opérations"** (couleur d'accent #1)
Sous-titre : "Le quotidien, sous contrôle."
- **TodoList** — Gestion des tâches quotidiennes. "Chaque service commence avec une liste claire. Plus rien ne passe entre les mailles."
- **Manuel OPS** — Procédures opérationnelles. "Les standards de votre maison accessibles à toute l'équipe = une qualité de service constante = de meilleurs avis locaux."
- **Maintenance** — Équipement & maintenance. "Anticipez les pannes. Planifiez les interventions. Protégez votre matériel."

**Pilier 2 — "Qualité"** (couleur d'accent #2)
Sous-titre : "L'excellence, mesurable."
- **Audit HACCP** — Conformité hygiène. "Digitalisez vos contrôles. Soyez prêts pour chaque inspection, sans stress."
- **Client Mystères** — Évaluation qualité de service. "Mesurez l'expérience réelle. Corrigez le tir en interne avant de perdre des étoiles sur Google."
- **Recette** — Fiches recettes & coûts matière. "Chaque plat chiffré. Chaque grammage standardisé. Votre marge, maîtrisée."

**Pilier 3 — "Équipe"** (couleur d'accent #3)
Sous-titre : "L'humain, au centre."
- **Communication & Messagerie** — Communication interne. "Un seul canal pour toute l'équipe. Fini les 12 groupes WhatsApp."
- **Formation** — Montée en compétences. "Formez sans arrêter le service. Suivez la progression de chaque membre."
- **Gestion du Personnel** — Plannings, présences, RH. "Plannings, absences, documents RH — tout centralisé, tout simple."

**Design de chaque module :**
- Icône distinctive (utiliser Lucide icons ou équivalent)
- Nom du module en bold
- Une phrase de bénéfice (pas de feature technique)
- Card avec hover state expressif
- Si des screenshots/mockups sont fournis, les intégrer dans chaque card

**Design des piliers :**
- Chaque pilier a sa propre couleur d'accent (subtile, en arrière-plan ou en bordure)
- Les piliers sont visuellement distincts mais cohérents
- Transition fluide entre les piliers

### Section 5 — LE PROGRAMME BÊTA (Comment ça marche)
- **Titre** : "Rejoignez l'avant-garde. 50 places seulement."
- 3 étapes en timeline horizontale (desktop) / verticale (mobile) :
  1. **"Candidature"** — "On sélectionne 50 restaurants partenaires avec qui on va co-construire l'outil final sur le terrain."
  2. **"Onboarding sur site (VIP)"** — "Un consultant configure Meal OS avec votre équipe, sur place. Pas de tutoriels YouTube." ← Mettre en avant avec un badge fort "Notre différence"
  3. **"Invitation Keynote"** — "Vous serez nos invités d'honneur lors de la Keynote de lancement officiel de l'application."
- Animation : Les étapes se révèlent séquentiellement au scroll

### Section 6 — SOCIAL PROOF / CHIFFRES
- Si des témoignages ou logos sont disponibles, les afficher ici
- Sinon, prévoir des emplacements pour :
  - 3 métriques clés animées (compteurs orientés R.O.I) : ex. "+15% de marge additionnelle", "20 heures économisées par mois", "-20% de pertes matières"
  - Logos de partenaires / certifications
  - Zone témoignage avec photo, nom, établissement, citation

### Section 7 — INTÉGRATIONS & ÉCOSYSTÈME (Nouveau point fort)
- **Titre** : "Meal OS se connecte à ce que vous utilisez déjà."
- **Sous-titre** : "Pas de silos. Fini la double saisie."
- **Visuels/Logos** : Zone dédiée affichant les outils compatibles de caisse et livraison (ex: Zelty, L'Addition, Lightspeed, UberEats, Deliveroo, Skello, etc.) avec un effet de ticker (défilement continu).
- **Message clé** : Rassurer le restaurateur sur l'absence de coupure dans sa chaîne digitale actuelle.

### Section 8 — FAQ
- **Titre** : "Vos questions, nos réponses."
- Accordéon (expand/collapse) avec les questions suivantes :
  1. "Combien de temps prend la mise en place ?"
  2. "Est-ce compatible avec mon système de caisse ?"
  3. "Et si mon équipe n'est pas à l'aise avec la tech ?"
  4. "Puis-je choisir seulement certains modules ?"
  5. "Comment fonctionne le support ?"
  6. "Mes données sont-elles sécurisées ?"
- **NE PAS mentionner l'OPCO ni le financement dans la FAQ**
- Animation : Smooth expand/collapse avec rotation de la flèche

### Section 9 — CTA FINAL (Closing)
- **Titre** : "Faites partie des 50 pionniers."
- **Sous-titre** : "Rejoignez le programme de bêta-testeurs Meal OS. 50 places disponibles, intégration VIP sur place, et votre invitation pour notre future Keynote."
- **CTA** : "Postuler au programme (- de 2 min)" (gros bouton)
- **Contact alternatif** : Numéro de téléphone et/ou WhatsApp
- Design : Section sombre avec typographie grande, ambiance de closing très exclusive (type "club fermé").

### HEADER (sticky)
- Logo Meal OS (à gauche)
- Navigation minimale : "Modules" (ancre) | "Programme Bêta" (ancre) | "FAQ" (ancre)
- CTA header : "Postuler (50 places)" (bouton à droite)
- Au scroll : le header se réduit en hauteur, prend un background glass/blur
- Mobile : burger menu

### FOOTER
- Logo Meal OS
- Liens légaux : Mentions légales | CGV | Politique de confidentialité
- Réseaux sociaux (icônes)
- Contact : email, téléphone
- Copyright
- Design sobre, pas de footer massif

---

## SPÉCIFICATIONS TECHNIQUES

### Stack
- **React (JSX)** avec Tailwind CSS
- Ou **HTML/CSS/JS** vanilla si la complexité le justifie
- Les animations doivent être en **CSS pur** autant que possible (transitions, keyframes, IntersectionObserver pour les triggers)
- Pour les animations plus complexes (parallax, stagger), utiliser du JS vanilla léger

### Responsive
- **Mobile-first** obligatoire — Les restaurateurs consultent majoritairement sur mobile entre deux services
- Breakpoints : mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Les CTA doivent être "thumb-friendly" sur mobile (min 48px de hauteur)
- Les sections doivent être plus courtes sur mobile

### Performance
- Pas de vidéo en autoplay lourde
- Images optimisées (lazy loading)
- Animations CSS plutôt que JS quand possible
- Le site doit charger rapidement sur un réseau mobile moyen

### Typographie
- **Display font** : Choisir une Google Font avec du caractère (éviter Inter, Roboto, Arial). Suggestions : Space Grotesk, Sora, Outfit, Clash Display, Satoshi, General Sans, ou toute font qui a de la personnalité.
- **Body font** : Lisible, neutre mais pas fade. DM Sans, Plus Jakarta Sans, ou similaire.
- Hiérarchie forte : le titre hero doit être très grand (clamp entre 3rem et 6rem)

### Palette de couleurs
- **Fond principal** : Blanc cassé ou gris très clair (#FAFAF8 ou similaire)
- **Texte principal** : Noir profond (#1A1A1A)
- **Couleur primaire** : Un vert profond ou un bleu nuit (évocateur de la restauration sans être cliché)
- **3 couleurs d'accent** pour les 3 piliers de modules (subtiles, pas criardes)
- **CTA** : Couleur chaude et contrastée (orange, corail, ou rouge sombre)
- Éviter les gradients violets, les bleus électriques et tout ce qui fait "template SaaS générique"

---

## CONTENU TEXTUEL

Tout le contenu est en **français**. Le ton est :
- **Direct et concret** — Pas de bullshit corporate, pas de "solutions innovantes"
- **Empathique** — On connaît la réalité du terrain
- **Confiant sans être arrogant** — "On sait que ça marche" plutôt que "leader du marché"
- Tutoiement ou vouvoiement cohérent (privilégier le **vouvoiement** pour la crédibilité B2B)

---

## RÈGLES ABSOLUES

1. **PAS de mention OPCO** ni de financement formation — ne pas en parler du tout
2. **PAS de prix affiché** sur la landing page
3. **PAS de "essai gratuit"** — le modèle est basé sur la démo + onboarding
4. **PAS d'images stock** — utiliser les images fournies ou des placeholders stylisés
5. **PAS de design générique** — chaque choix doit être intentionnel et cohérent avec l'univers restaurant
6. **Chaque scroll de 2 sections doit avoir un CTA visible** — le visiteur ne doit jamais remonter pour agir
7. **Le code doit être production-ready** — propre, commenté, responsive, performant

---

## LIVRABLES ATTENDUS

Un fichier unique (React JSX ou HTML) contenant :
- La landing page complète avec toutes les sections décrites
- Les animations et interactions
- Le responsive design
- Les placeholders pour les images (avec instructions claires sur où les remplacer)
- Les FAQ fonctionnelles (accordéon)
- Le header sticky avec transformation au scroll

---

## IMAGES FOURNIES

[INSÉRER ICI LES IMAGES QUE TU SOUHAITES INTÉGRER — mockups de l'interface, photos de restaurants, logo Meal OS, etc.]

Consignes pour l'intégration des images :
- Respecter l'atmosphère et le style des images fournies
- Adapter la palette de couleurs de la page pour être cohérente avec les images
- Utiliser les images comme éléments de design principaux, pas comme décoration secondaire
- Si des mockups d'interface sont fournis, les mettre en avant dans le hero et la section modules
