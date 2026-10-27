"""Génère questionnaire-client-mystere-restaurant.pdf depuis content/questionnaire-client-mystere.json.

Usage : uv run --no-project python tools/build_questionnaire_pdf.py

Construit une page HTML imprimable (A4, colonne vide pour noter) puis l'imprime en PDF
avec Chrome en mode headless. Le contenu suit la page web : le JSON est la seule source.
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SKIP_SECTIONS = ("Exemple de calcul",)

CSS = """
@page { size: A4; margin: 14mm 12mm; }
* { box-sizing: border-box; }
body { font-family: Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #191919; font-size: 9.5pt; line-height: 1.4; }
.top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #191919; padding-bottom: 6px; margin-bottom: 10px; }
.brand { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 12pt; }
.mark { width: 20px; height: 20px; border-radius: 4px; background: #191919; color: #fff; display: grid; place-items: center; font-family: Georgia, serif; font-style: italic; }
h1 { font-size: 18pt; letter-spacing: -0.02em; margin: 4px 0 8px; }
h2 { font-size: 12pt; margin: 14px 0 4px; color: #1269bd; break-after: avoid; }
p, li { margin: 3px 0; color: #37352f; }
.fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; margin: 8px 0 12px; }
.fields div { border-bottom: 1px solid #999; padding: 10px 0 2px; font-size: 8.5pt; color: #666; }
table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; break-inside: auto; }
tr { break-inside: avoid; }
th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .04em; color: #666; border-bottom: 1.5px solid #191919; padding: 4px 5px; }
td { border-bottom: 1px solid #e7e7e4; padding: 5px; vertical-align: top; }
td.note { width: 22mm; border-left: 1px solid #e7e7e4; }
.callout { background: #f7f7f5; border-radius: 6px; padding: 8px 10px; margin: 6px 0; }
.foot { margin-top: 14px; font-size: 8pt; color: #888; border-top: 1px solid #e7e7e4; padding-top: 6px; }
"""


def block_html(block: dict, with_note_column: bool) -> str:
    if "p" in block:
        return f"<p>{block['p']}</p>"
    if "ul" in block or "ol" in block:
        tag = "ul" if "ul" in block else "ol"
        return f"<{tag}>" + "".join(f"<li>{li}</li>" for li in block[tag]) + f"</{tag}>"
    if "callout" in block:
        return f'<div class="callout">{block["callout"]}</div>'
    if "table" in block:
        tb = block["table"]
        note = with_note_column and "Question" in tb["head"]
        head = "".join(f"<th>{h}</th>" for h in tb["head"]) + (
            "<th>Noté</th>" if note else ""
        )
        rows = "".join(
            "<tr>"
            + "".join(f"<td>{c}</td>" for c in r)
            + ('<td class="note"></td>' if note else "")
            + "</tr>"
            for r in tb["rows"]
        )
        caption = (
            f"<p><strong>{tb['caption']}</strong></p>" if tb.get("caption") else ""
        )
        return f"{caption}<table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>"
    return ""  # blocs purement web (bouton PDF, etc.)


def main() -> None:
    data = json.loads(
        (ROOT / "content/questionnaire-client-mystere.json").read_text(encoding="utf-8")
    )
    parts = []
    for sec in data["sections"]:
        if sec["h2"].startswith(SKIP_SECTIONS):
            continue
        blocks = "".join(block_html(b, with_note_column=True) for b in sec["blocks"])
        parts.append(f"<h2>{sec['h2']}</h2>{blocks}")
    body = re.sub(r'<a [^>]*class="btn-retro"[^>]*>.*?</a>', "", "".join(parts))
    page = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Questionnaire client mystère restaurant</title><style>{CSS}</style></head><body>
<div class="top"><div class="brand"><span class="mark">S</span>Staff Meal</div><span>staff-meal.com</span></div>
<h1>Questionnaire client mystère restaurant</h1>
<div class="fields"><div>Établissement</div><div>Date et heure de la visite</div><div>Nombre de couverts</div><div>Visiteur</div><div>Service (midi / soir)</div><div>Score final / 100</div></div>
{body}
<p class="foot">Modèle gratuit Staff Meal, à reprendre et adapter librement. Version en ligne et méthode complète : staff-meal.com/questionnaire-client-mystere.html</p>
</body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "questionnaire.html"
        src.write_text(page, encoding="utf-8")
        out = ROOT / "questionnaire-client-mystere-restaurant.pdf"
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={out}",
                src.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
    print(f"{out.name} : {out.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
