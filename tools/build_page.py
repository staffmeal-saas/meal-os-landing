"""Génère une page de contenu staff-meal.com à partir d'un fichier JSON.

Usage : uv run --no-project python tools/build_page.py content/<slug>.json [...]

Le gabarit (header, footer, scripts, versions CSS/JS) est relu à chaque fois depuis
haccp-restaurant.html, pour que les pages générées suivent la coque du site sans copie
à maintenir. Format du JSON : voir tools/PAGE_FORMAT.md.
"""

import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://staff-meal.com"
TEMPLATE = ROOT / "haccp-restaurant.html"

P = "font-sans text-base md:text-lg text-ink-soft leading-relaxed mb-4"
H2 = "text-chunky text-3xl md:text-4xl mt-14 mb-5"


def esc(text: str) -> str:
    """Échappe un texte brut (attributs, JSON-LD visible)."""
    return html.escape(text, quote=True)


def strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def grab(pattern: str, text: str) -> str:
    """Premier groupe d'une regex obligatoire dans le gabarit (erreur claire si le gabarit a changé)."""
    m = re.search(pattern, text, re.DOTALL)
    if m is None:
        raise ValueError(f"gabarit {TEMPLATE.name} : motif introuvable {pattern!r}")
    return m.group(1)


def shell_parts() -> dict[str, str]:
    """Récupère dans la page gabarit tout ce qui n'est pas du contenu."""
    t = TEMPLATE.read_text(encoding="utf-8")
    head_assets = grab(r'(    <link rel="icon".*?)    <script type="application/ld\+json">', t)
    tail_head = grab(r'(    <link rel="stylesheet" href="/shell\.css.*?)</head>', t)
    top = grab(r"(<body.*?</header>)", t)
    footer = grab(r"(<footer.*?</footer>)", t)
    scripts = grab(r"</footer>\s*(.*?)</body>", t)
    return {
        "head_assets": head_assets,
        "tail_head": tail_head,
        "top": top,
        "footer": footer,
        "scripts": scripts,
    }


def render_block(block: dict) -> str:
    if "p" in block:
        return f'<p class="{P}">{block["p"]}</p>'
    if "ul" in block:
        items = "".join(f'<li class="mb-2">{li}</li>' for li in block["ul"])
        return f'<ul class="list-disc pl-6 {P}">{items}</ul>'
    if "ol" in block:
        items = "".join(f'<li class="mb-2">{li}</li>' for li in block["ol"])
        return f'<ol class="list-decimal pl-6 {P}">{items}</ol>'
    if "table" in block:
        tb = block["table"]
        head = "".join(
            f'<th class="text-left font-bold text-foreground p-3 border-b border-cream-dark">{c}</th>'
            for c in tb["head"]
        )
        rows = "".join(
            "<tr>"
            + "".join(
                f'<td class="p-3 border-b border-cream-dark align-top">{c}</td>'
                for c in r
            )
            + "</tr>"
            for r in tb["rows"]
        )
        caption = (
            f'<caption class="text-left text-sm text-ink-faint mb-2">{tb["caption"]}</caption>'
            if tb.get("caption")
            else ""
        )
        return (
            f'<div class="overflow-x-auto my-6"><table class="w-full text-sm md:text-base text-ink-soft border-collapse">'
            f"{caption}<thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>"
        )
    if "callout" in block:
        return f'<div class="card-retro bg-paper p-6 my-6"><p class="font-sans text-base md:text-lg text-foreground leading-relaxed">{block["callout"]}</p></div>'
    if "h3" in block:
        return f'<h3 class="font-sans font-bold text-xl md:text-2xl text-foreground mt-8 mb-3">{block["h3"]}</h3>'
    if "html" in block:
        return block["html"]
    raise ValueError(f"bloc inconnu : {list(block)}")


def render(data: dict) -> str:
    s = shell_parts()
    slug = data["slug"]
    url = f"{SITE}/{slug}.html"
    today = date.today().isoformat()
    published = data.get("datePublished", today)
    title, desc = data["title"], data["description"]

    crumbs = [("Accueil", f"{SITE}/")] + [
        (n, f"{SITE}{h}" if h else url) for n, h in data["breadcrumb"]
    ]
    jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": data["h1"],
            "description": desc,
            "inLanguage": "fr-FR",
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "datePublished": published,
            "dateModified": today,
            "author": {
                "@type": "Organization",
                "name": "Staff Meal",
                "url": f"{SITE}/",
            },
            "publisher": {
                "@type": "Organization",
                "name": "Staff Meal",
                "url": f"{SITE}/",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{SITE}/assets/brand/mark.png?v=20261027",
                },
            },
            "image": f"{SITE}/og-image.jpg",
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
                for i, (n, u) in enumerate(crumbs)
            ],
        },
    ]
    if data.get("faq"):
        jsonld.append(
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": strip_tags(f["q"]),
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": strip_tags(f["a"]),
                        },
                    }
                    for f in data["faq"]
                ],
            }
        )
    ld = "\n".join(
        f'    <script type="application/ld+json">\n{json.dumps(j, ensure_ascii=False, indent=2)}\n</script>'
        for j in jsonld
    )

    crumb_html = "\n".join(
        (
            f'                <li><a href="{h or "/"}" class="hover:text-accent">{esc(n)}</a></li>\n                <li>/</li>'
            if h is not None
            else f'                <li class="text-foreground">{esc(n)}</li>'
        )
        for n, h in [("Accueil", "/")] + [(n, h) for n, h in data["breadcrumb"]]
    )

    body = []
    for sec in data["sections"]:
        body.append(f'            <h2 class="{H2}">{sec["h2"]}</h2>')
        body += ["                " + render_block(b) for b in sec["blocks"]]

    if data.get("related"):
        body.append(
            f'            <h2 class="text-chunky text-3xl md:text-4xl mt-16 mb-6">{data.get("related_title", "Pour aller plus loin")}</h2>'
        )
        body.append('            <div class="grid gap-4 mb-14">')
        for r in data["related"]:
            body.append(
                f'                <a href="{r["href"]}" class="card-retro p-6 block hover:border-accent transition-colors">'
                f'<p class="font-sans font-bold text-lg mb-1">{r["title"]} <span class="text-accent">→</span></p>'
                f'<p class="font-sans text-sm text-ink-soft leading-relaxed">{r["desc"]}</p></a>'
            )
        body.append("            </div>")

    body.append(f"""            <div class="card-retro !bg-foreground text-background p-8 md:p-10 my-12 text-center">
                <p class="font-script text-accent text-3xl mb-3">{data.get("cta_kicker", "et si l'outil le faisait")}</p>
                <h2 class="text-chunky text-3xl md:text-4xl mb-4">Staff Meal</h2>
                <p class="font-sans text-background/70 mb-7 max-w-lg mx-auto">{data.get("cta_text", "L'application d'exploitation des restaurants à partir de 15 employés. Cinquante établissements accompagnés sur place.")}</p>
                <a href="/#demo" class="btn-retro">Postuler à la bêta</a>
            </div>""")

    if data.get("faq"):
        body.append(
            '            <h2 class="text-chunky text-3xl md:text-4xl mt-14 mb-6">Questions fréquentes</h2>\n            <div class="space-y-4 mb-10">'
        )
        for f in data["faq"]:
            body.append(f"""                <div class="faq-item card-retro p-6 cursor-pointer">
                    <div class="flex justify-between items-center">
                        <h3 class="font-sans font-bold text-lg pr-8">{f["q"]}</h3>
                        <div class="faq-icon w-8 h-8 flex items-center justify-center"><i data-lucide="plus" class="w-5 h-5"></i></div>
                    </div>
                    <div class="faq-answer"><p class="font-sans font-medium text-ink-soft pt-4 border-t border-foreground/10 mt-4 leading-relaxed">{f["a"]}</p></div>
                </div>""")
        body.append("            </div>")

    if data.get("sources"):
        items = "".join(
            f'<li class="mb-1"><a href="{esc(x["url"])}" rel="noopener" target="_blank" class="underline hover:text-accent">{esc(x["label"])}</a></li>'
            for x in data["sources"]
        )
        body.append(
            f'            <h2 class="font-sans font-bold text-lg mt-12 mb-3">Sources</h2>\n            <ul class="list-disc pl-6 font-sans text-sm text-ink-faint leading-relaxed mb-10">{items}</ul>'
        )

    page = f'''<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <title>{esc(title)}</title>
    <meta name="description" content="{esc(desc)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="{url}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ffffff">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Staff Meal">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{esc(title)}">
    <meta property="og:description" content="{esc(desc)}">
    <meta property="og:image" content="{SITE}/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{esc(title)}">
    <meta name="twitter:description" content="{esc(desc)}">
    <meta name="twitter:image" content="{SITE}/og-image.jpg">
{s["head_assets"]}{ld}
{s["tail_head"]}</head>

{s["top"]}

    <main id="main" class="pt-14">
        <nav aria-label="Fil d'ariane" class="max-w-3xl mx-auto px-4 md:px-12 mb-6">
            <ol class="flex flex-wrap gap-2 font-sans text-xs uppercase tracking-widest text-ink-faint">
{crumb_html}
            </ol>
        </nav>

        <article class="max-w-3xl mx-auto px-4 md:px-12 pb-16">
            <p class="font-script text-accent text-3xl mb-2">{data["kicker"]}</p>
            <h1 class="text-chunky text-4xl md:text-6xl mb-6">{data["h1"]}</h1>
            <p class="font-sans text-lg md:text-xl text-ink-soft leading-relaxed">{data["lede"]}</p>
            <p class="font-sans text-xs text-ink-faint mt-4">Mis à jour le {date.today().strftime("%d/%m/%Y")}</p>

{chr(10).join(body)}
        </article>
    </main>

    {s["footer"]}

    {s["scripts"]}</body>

</html>
'''
    return nbsp(page)


def nbsp(page: str) -> str:
    """Espaces insécables typographiques dans le corps (« + 3 °C » ne se coupe plus en fin de ligne)."""
    head, sep, body = page.partition("<body")
    body = re.sub(r"(\d) (°C|%|€|g\b|kg\b|min\b|h\b|jours?\b|mois\b|points?\b)", "\\1&nbsp;\\2", body)
    body = re.sub(r"([+−≤≥<>]) (\d)", "\\1&nbsp;\\2", body)
    return head + sep + body


def check(data: dict) -> list[str]:
    """Garde-fous éditoriaux appliqués avant d'écrire la page."""
    problems = []
    flat = json.dumps(data, ensure_ascii=False)
    if not 30 <= len(data["title"]) <= 62:
        problems.append(f"title {len(data['title'])} car. (30-62)")
    if not 120 <= len(data["description"]) <= 160:
        problems.append(f"description {len(data['description'])} car. (120-160)")
    if "—" in flat:
        problems.append("tiret cadratin interdit")
    if re.search(r"\b(IA|AI)\b|intelligence artificielle", flat):
        problems.append("mention IA interdite sur ce site")
    words = len(
        strip_tags(
            " ".join(
                [data["lede"]]
                + [
                    b.get("p", "") + " ".join(b.get("ul", []) + b.get("ol", []))
                    for s in data["sections"]
                    for b in s["blocks"]
                ]
            )
        ).split()
    )
    if words < 900:
        problems.append(f"corps trop court : {words} mots (min 900)")
    return problems


if __name__ == "__main__":
    for path in [a for a in sys.argv[1:] if not a.startswith("--")]:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        issues = check(data)
        if issues and "--force" not in sys.argv:
            print(f"✗ {path} : " + " ; ".join(issues))
            continue
        out = ROOT / f"{data['slug']}.html"
        out.write_text(render(data), encoding="utf-8")
        print(
            f"✓ {out.name}"
            + (f" (avec réserves : {'; '.join(issues)})" if issues else "")
        )
