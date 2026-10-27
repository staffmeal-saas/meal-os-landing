# Format d'une page de contenu (content/<slug>.json → <slug>.html)

Générée par `uv run --no-project python tools/build_page.py content/<slug>.json`.

```json
{
  "slug": "digitaliser-haccp-restauration-collective",
  "title": "≤ 62 caractères, requête principale au début",
  "description": "120 à 160 caractères, la réponse + la promesse de la page",
  "kicker": "accroche courte en minuscules (affichée en sur-titre bleu)",
  "h1": "Titre visible, contient la requête principale",
  "lede": "2-3 phrases : la réponse directe à la question de la requête (answer-first)",
  "breadcrumb": [["Hygiène et conformité", "/haccp-restaurant.html"], ["Restauration collective", null]],
  "datePublished": "2026-10-25",
  "sections": [
    {"h2": "Intertitre", "blocks": [
      {"p": "Paragraphe. HTML autorisé : <strong>, <a href=\"/page.html\">"},
      {"ul": ["puce", "puce"]}, {"ol": ["étape", "étape"]},
      {"h3": "Sous-titre"},
      {"table": {"caption": "optionnel", "head": ["Col 1", "Col 2"], "rows": [["a", "b"]]}},
      {"callout": "Encadré à retenir"}
    ]}
  ],
  "faq": [{"q": "Question telle qu'on la tape", "a": "Réponse en 2-4 phrases"}],
  "related": [{"href": "/haccp-restaurant.html", "title": "Titre", "desc": "Une phrase"}],
  "sources": [{"label": "Arrêté du 21 décembre 2009 (Légifrance)", "url": "https://www.legifrance.gouv.fr/..."}],
  "cta_kicker": "optionnel", "cta_text": "optionnel"
}
```

Garde-fous automatiques (la page n'est pas écrite sinon) : title 30-62 car., description 120-160,
corps ≥ 900 mots, aucun tiret cadratin, aucune mention « IA ».
