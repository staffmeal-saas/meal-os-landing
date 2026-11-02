# Format d'un modèle téléchargeable (content/modeles/<slug>.json → /modeles/<slug>.pdf|.xlsx|.docx)

Généré par `uv run --no-project --with openpyxl --with python-docx python tools/build_modeles.py content/modeles/<slug>.json`.
Le JSON est la seule source : les trois formats en sortent, identiques sur le fond.

```json
{
  "slug": "plan-de-nettoyage-cuisine",
  "title": "Plan de nettoyage et de désinfection",
  "subtitle": "Cuisine professionnelle, à afficher en plonge",
  "orientation": "landscape",
  "formats": ["pdf", "xlsx", "docx"],
  "fields": ["Établissement", "Semaine du", "Responsable hygiène"],
  "sections": [
    {
      "h": "Tous les jours",
      "p": ["Texte libre optionnel, une entrée = un paragraphe."],
      "head": ["Zone / équipement", "Fréquence", "Produit", "Méthode", "L", "M", "M", "J", "V", "S", "D"],
      "widths": [3, 2, 2, 4, 1, 1, 1, 1, 1, 1, 1],
      "rows": [["Plans de travail", "Après chaque usage", "Détergent désinfectant", "Racler, laver, rincer, désinfecter"]],
      "blank_rows": 2
    }
  ],
  "notes": ["Pied de page : rappel réglementaire court, source."]
}
```

- `orientation` : `portrait` ou `landscape`.
- Une section peut n'avoir que `p` (document texte, ex. trame de PMS) ou que le tableau.
- Une ligne plus courte que `head` est complétée par des cases vides (à remplir ou cocher).
- `blank_rows` : lignes vides ajoutées en fin de tableau pour que l'établissement complète.
- `widths` : poids relatifs des colonnes (optionnel).
- Une cellule commençant par `[ ]` s'imprime comme une case à cocher.
- Pas de tiret cadratin, pas de « IA ».
