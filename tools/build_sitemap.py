"""Régénère sitemap.xml à partir des pages HTML indexables du site.

Usage : uv run --no-project python tools/build_sitemap.py

Une page entre dans le sitemap si elle a une balise canonical vers staff-meal.com et
pas de noindex. lastmod = date de dernière modification du fichier, pour que Google
voie réellement les pages mises à jour.
"""

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://staff-meal.com"


def indexable(path: Path) -> str | None:
    """URL canonique de la page si elle doit être indexée, sinon None."""
    html = path.read_text(encoding="utf-8")
    robots = re.search(r'<meta name="robots"\s+content="([^"]*)"', html)
    if robots and "noindex" in robots.group(1):
        return None
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if not canonical or not canonical.group(1).startswith(SITE):
        return None
    return canonical.group(1)


def main() -> None:
    entries: list[tuple[str, str]] = []
    for page in sorted(ROOT.glob("*.html")):
        url = indexable(page)
        if url:
            entries.append((url, date.fromtimestamp(page.stat().st_mtime).isoformat()))
    # La home en premier, le reste par ordre alphabétique
    entries.sort(key=lambda e: (e[0] != f"{SITE}/", e[0]))
    body = "\n".join(
        f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{d}</lastmod>\n  </url>"
        for u, d in entries
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n'
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"sitemap.xml : {len(entries)} URL")


if __name__ == "__main__":
    main()
