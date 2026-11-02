"""Génère les modèles téléchargeables (PDF, Excel, Word) depuis content/modeles/<slug>.json.

Usage :
  uv run --no-project --with openpyxl --with python-docx python tools/build_modeles.py [content/modeles/<slug>.json ...]

Sans argument, reconstruit tous les modèles. Sortie dans modeles/<slug>.<ext>.
Le PDF est imprimé par Chrome headless depuis une page HTML A4, comme le questionnaire
client mystère. Format du JSON : voir tools/MODELE_FORMAT.md.
"""

import html
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Emu, Pt, RGBColor
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "modeles"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WORDMARK = ROOT / "assets/brand/wordmark.svg"
FOOT = "Modèle gratuit Staff Meal, à reprendre et adapter librement. Version en ligne et mode d'emploi : staff-meal.com/{slug}.html"
INK = "191919"
ACCENT = "1269BD"


def check(data: dict, path: Path) -> None:
    """Mêmes garde-fous que les pages : pas de cadratin, pas de « IA »."""
    raw = json.dumps(data, ensure_ascii=False)
    if "—" in raw:
        raise SystemExit(f"{path.name} : tiret cadratin interdit")
    if re.search(r"\b(IA|AI)\b", raw):
        raise SystemExit(f"{path.name} : mention « IA » interdite")
    for s in data["sections"]:
        for r in s.get("rows", []):
            if len(r) > len(s.get("head", [])):
                raise SystemExit(
                    f"{path.name} : ligne plus longue que l'en-tête dans « {s['h']} »"
                )


def rows_of(section: dict) -> list[list[str]]:
    """Lignes complétées à la largeur de l'en-tête, plus les lignes vides demandées."""
    n = len(section.get("head", []))
    rows = [list(r) + [""] * (n - len(r)) for r in section.get("rows", [])]
    rows += [[""] * n for _ in range(section.get("blank_rows", 0))]
    return rows


def cell_text(c: str) -> str:
    return c.replace("[ ]", "☐")


# ---------------------------------------------------------------- PDF

CSS = """
@page {{ size: A4 {orient}; margin: 11mm 10mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #191919; font-size: 9pt; line-height: 1.35; margin: 0; }}
.top {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #191919; padding-bottom: 5px; margin-bottom: 8px; }}
.top img {{ height: 15px; }}
.top span {{ font-size: 8pt; color: #666; }}
h1 {{ font-size: 16pt; letter-spacing: -0.02em; margin: 2px 0 2px; }}
.sub {{ color: #555; margin: 0 0 6px; }}
h2 {{ font-size: 11pt; margin: 12px 0 4px; color: #1269bd; break-after: avoid; }}
p {{ margin: 3px 0; color: #37352f; }}
.fields {{ display: grid; grid-template-columns: repeat({nf}, 1fr); gap: 4px 14px; margin: 6px 0 8px; }}
.fields div {{ border-bottom: 1px solid #999; padding: 10px 0 2px; font-size: 8pt; color: #666; }}
table {{ width: 100%; border-collapse: collapse; margin: 3px 0 6px; table-layout: fixed; }}
tr {{ break-inside: avoid; }}
th {{ text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .03em; color: #fff; background: #191919; padding: 4px 4px; border: 1px solid #191919; }}
td {{ border: 1px solid #c9c9c5; padding: 4px; vertical-align: top; height: 7mm; font-size: 8.5pt; overflow-wrap: anywhere; }}
.notes {{ margin-top: 10px; font-size: 7.5pt; color: #555; }}
.foot {{ margin-top: 8px; font-size: 7.5pt; color: #888; border-top: 1px solid #e7e7e4; padding-top: 5px; }}
"""


def build_pdf(data: dict, dest: Path) -> None:
    e = html.escape
    parts = []
    for s in data["sections"]:
        parts.append(f"<h2>{e(s['h'])}</h2>")
        parts += [f"<p>{e(p)}</p>" for p in s.get("p", [])]
        if s.get("head"):
            w = s.get("widths") or [1] * len(s["head"])
            tot = sum(w)
            cols = "".join(f'<col style="width:{100 * x / tot:.2f}%">' for x in w)
            head = "".join(f"<th>{e(h)}</th>" for h in s["head"])
            body = "".join(
                "<tr>" + "".join(f"<td>{e(cell_text(c))}</td>" for c in r) + "</tr>"
                for r in rows_of(s)
            )
            parts.append(
                f"<table><colgroup>{cols}</colgroup><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"
            )
    fields = "".join(f"<div>{e(f)}</div>" for f in data.get("fields", []))
    notes = "".join(f"<p>{e(n)}</p>" for n in data.get("notes", []))
    css = CSS.format(
        orient=data.get("orientation", "portrait"),
        nf=max(1, len(data.get("fields", []))),
    )
    page = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{e(data["title"])}</title><style>{css}</style></head><body>
<div class="top"><img src="{WORDMARK.as_uri()}" alt="Staff Meal"><span>staff-meal.com</span></div>
<h1>{e(data["title"])}</h1>{f'<p class="sub">{e(data["subtitle"])}</p>' if data.get("subtitle") else ""}
{f'<div class="fields">{fields}</div>' if fields else ""}
{"".join(parts)}
{f'<div class="notes">{notes}</div>' if notes else ""}
<p class="foot">{e(FOOT.format(slug=data["slug"]))}</p>
</body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "modele.html"
        src.write_text(page, encoding="utf-8")
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                "--allow-file-access-from-files",
                f"--print-to-pdf={dest}",
                src.as_uri(),
            ],
            check=True,
            capture_output=True,
        )


# ---------------------------------------------------------------- Excel


def build_xlsx(data: dict, dest: Path) -> None:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "Modèle"
    thin = Side(style="thin", color="C9C9C5")
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    wrap = Alignment(wrap_text=True, vertical="top")
    ncols = max([len(s.get("head", [])) for s in data["sections"]] + [4])

    ws.cell(1, 1, data["title"]).font = Font(bold=True, size=16, color=INK)
    r = 2
    if data.get("subtitle"):
        ws.cell(r, 1, data["subtitle"]).font = Font(italic=True, color="555555")
        r += 1
    for f in data.get("fields", []):
        ws.cell(r, 1, f).font = Font(bold=True, color="666666")
        ws.cell(r, 2).border = Border(bottom=Side(style="thin", color="999999"))
        r += 1
    r += 1
    widths = [10] * ncols
    for s in data["sections"]:
        ws.cell(r, 1, s["h"]).font = Font(bold=True, size=12, color=ACCENT)
        r += 1
        for p in s.get("p", []):
            ws.cell(r, 1, p).alignment = Alignment(wrap_text=False)
            r += 1
        if s.get("head"):
            for j, h in enumerate(s["head"], 1):
                c = ws.cell(r, j, h)
                c.font = Font(bold=True, color="FFFFFF")
                c.fill = PatternFill("solid", fgColor=INK)
                c.alignment = wrap
                c.border = box
            r += 1
            w = s.get("widths") or [1] * len(s["head"])
            for j, x in enumerate(w):
                widths[j] = max(widths[j], min(60, 6 + 6 * x))
            for row in rows_of(s):
                for j, val in enumerate(row, 1):
                    c = ws.cell(r, j, cell_text(val))
                    c.alignment = wrap
                    c.border = box
                ws.row_dimensions[r].height = 30
                r += 1
        r += 1
    for n in data.get("notes", []):
        ws.cell(r, 1, n).font = Font(size=9, color="555555")
        r += 1
    ws.cell(r + 1, 1, FOOT.format(slug=data["slug"])).font = Font(
        size=9, color="888888"
    )
    for j, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.page_setup.orientation = data.get("orientation", "portrait")
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    setup = ws.sheet_properties.pageSetUpPr
    if setup is not None:
        setup.fitToPage = True
    wb.save(dest)


# ---------------------------------------------------------------- Word


def shade(cell, hex_color: str) -> None:
    tc = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc.append(shd)


def build_docx(data: dict, dest: Path) -> None:
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21)
    if data.get("orientation") == "landscape":
        sec.orientation = WD_ORIENT.LANDSCAPE
        sec.page_width, sec.page_height = sec.page_height, sec.page_width
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Cm(1.3))
    style = doc.styles["Normal"]
    style.font.name = "Arial"  # type: ignore[attr-defined]
    style.font.size = Pt(9.5)  # type: ignore[attr-defined]
    usable = int(sec.page_width or 0) - int(sec.left_margin or 0) - int(sec.right_margin or 0)

    t = doc.add_paragraph()
    run = t.add_run(data["title"])
    run.bold = True
    run.font.size = Pt(18)
    if data.get("subtitle"):
        doc.add_paragraph(data["subtitle"]).runs[0].italic = True
    for f in data.get("fields", []):
        doc.add_paragraph(f"{f} : ____________________________")
    for s in data["sections"]:
        h = doc.add_paragraph()
        hr = h.add_run(s["h"])
        hr.bold = True
        hr.font.size = Pt(12)
        hr.font.color.rgb = RGBColor.from_string(ACCENT)
        for p in s.get("p", []):
            doc.add_paragraph(p)
        if s.get("head"):
            rows = rows_of(s)
            tb = doc.add_table(rows=1 + len(rows), cols=len(s["head"]))
            tb.style = "Table Grid"
            tb.alignment = WD_TABLE_ALIGNMENT.CENTER
            w = s.get("widths") or [1] * len(s["head"])
            tot = sum(w)
            for j, hd in enumerate(s["head"]):
                c = tb.rows[0].cells[j]
                c.text = hd
                c.paragraphs[0].runs[0].bold = True
                c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                shade(c, INK)
            for i, row in enumerate(rows, 1):
                for j, val in enumerate(row):
                    tb.rows[i].cells[j].text = cell_text(val)
            for j, x in enumerate(w):
                for row in tb.rows:
                    row.cells[j].width = Emu(int(usable * x / tot))
    for n in data.get("notes", []):
        p = doc.add_paragraph(n)
        p.runs[0].font.size = Pt(8)
    f = doc.add_paragraph(FOOT.format(slug=data["slug"]))
    f.runs[0].font.size = Pt(8)
    f.runs[0].font.color.rgb = RGBColor(0x88, 0x88, 0x88)
    doc.save(str(dest))


BUILDERS = {"pdf": build_pdf, "xlsx": build_xlsx, "docx": build_docx}


def main() -> None:
    paths = [Path(a) for a in sys.argv[1:]] or sorted(
        (ROOT / "content/modeles").glob("*.json")
    )
    OUT.mkdir(exist_ok=True)
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        check(data, path)
        for fmt in data.get("formats", ["pdf"]):
            dest = OUT / f"{data['slug']}.{fmt}"
            BUILDERS[fmt](data, dest)
            print(f"modeles/{dest.name} : {dest.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
