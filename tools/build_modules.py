"""Génère les 9 pages produit des modules à partir de content/modules.json.

Usage : uv run --no-project python tools/build_modules.py

Chaque page porte la vidéo de démonstration du module (videos/<video>.mp4, filmée
dans l'application sur un établissement de démonstration), ses chapitres
cliquables, ses bénéfices, ses fonctions, une FAQ et le maillage vers les autres
modules. Les assets partagés sont shell.css, home.css, modules.css et modules.js.
"""

import html
import json
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://staff-meal.com"
ASSET_V = "20261027"
UPLOAD_DATE = "2026-10-26"

Module = dict[str, Any]


def esc(text: str) -> str:
    """Échappe un texte pour du HTML (attributs compris)."""
    return html.escape(text, quote=True)


def video_duration(path: Path) -> float | None:
    """Durée de la vidéo en secondes, via ffprobe s'il est installé."""
    try:
        out = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        return float(out)
    except (OSError, subprocess.CalledProcessError, ValueError):
        return None


def iso_duration(seconds: float) -> str:
    """Durée ISO 8601 (PT0M44S) pour le JSON-LD VideoObject."""
    total = round(seconds)
    return f"PT{total // 60}M{total % 60}S"


def clock(seconds: int) -> str:
    """0:06, 1:12…"""
    return f"{seconds // 60}:{seconds % 60:02d}"


def json_ld(m: Module, duration: float | None) -> str:
    """Graphe JSON-LD : page, vidéo, fil d'Ariane et FAQ."""
    url = f"{SITE}/{m['slug']}.html"
    video: dict[str, Any] = {
        "@type": "VideoObject",
        "@id": f"{url}#video",
        "name": f"Démo du module {m['name']} de Staff Meal",
        "description": m["video_alt"],
        "thumbnailUrl": f"{SITE}/videos/{m['video']}.jpg",
        "contentUrl": f"{SITE}/videos/{m['video']}.mp4",
        "uploadDate": UPLOAD_DATE,
        "inLanguage": "fr-FR",
        "hasPart": [
            {"@type": "Clip", "name": label, "startOffset": t, "url": f"{url}#t={t}"}
            for t, label in m["chapters"]
        ],
    }
    if duration:
        video["duration"] = iso_duration(duration)
    graph = [
        {
            "@type": "WebPage",
            "@id": url,
            "url": url,
            "name": m["title"],
            "description": m["description"],
            "inLanguage": "fr-FR",
            "isPartOf": {"@type": "WebSite", "name": "Staff Meal", "url": f"{SITE}/"},
            "video": {"@id": f"{url}#video"},
        },
        video,
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": f"{SITE}/",
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Modules",
                    "item": f"{SITE}/#modules",
                },
                {"@type": "ListItem", "position": 3, "name": m["name"], "item": url},
            ],
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a},
                }
                for q, a in m["faq"]
            ],
        },
    ]
    return json.dumps(
        {"@context": "https://schema.org", "@graph": graph},
        ensure_ascii=False,
        indent=2,
    )


def video_size(path: Path) -> tuple[int, int]:
    """Largeur et hauteur de la vidéo (réserve la place avant chargement)."""
    try:
        out = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v",
                "-show_entries",
                "stream=width,height",
                "-of",
                "csv=p=0",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        w, h = out.split(",")
        return int(w), int(h)
    except (OSError, subprocess.CalledProcessError, ValueError):
        return (720, 1558)


def device(m: Module) -> str:
    """Cadre téléphone ou navigateur autour de la vidéo."""
    v = m["video"]
    w, h = video_size(ROOT / "videos" / f"{v}.mp4")
    video = (
        f'<video class="mod-video" src="/videos/{v}.mp4" poster="/videos/{v}.jpg" width="{w}" height="{h}" muted playsinline loop '
        f'preload="metadata" aria-label="{esc(m["video_alt"])}"></video>'
        '<button class="mod-play" type="button" aria-label="Lire la démo"><i data-lucide="play"></i></button>'
    )
    if m["mode"] == "mobile":
        return f'<div class="mod-device mod-phone">{video}</div>'
    bar = (
        '<div class="mod-browser-bar" aria-hidden="true"><span></span><span></span><span></span>'
        "<em>app.staff-meal.com</em></div>"
    )
    return f'<div class="mod-device mod-browser">{bar}<div class="mod-screen">{video}</div></div>'


def hero_loop(m: Module) -> str:
    """Boucle muette de 12 s façon Notion (videos/hero-<video>.mp4) sous le titre. Vide si absente."""
    v = m["video"]
    if not (ROOT / "videos" / f"hero-{v}.mp4").exists():
        return ""
    return (
        '<figure class="mod-loop">'
        f'<video class="mod-loop-video" src="/videos/hero-{v}.mp4" poster="/videos/hero-{v}.jpg" width="2160" height="1350" '
        f'autoplay muted loop playsinline preload="auto" aria-label="Aperçu animé du module {esc(m["name"])} dans l\'application"></video>'
        "</figure>"
    )


def page(m: Module, modules: list[Module]) -> str:
    """HTML complet d'une page module."""
    url = f"{SITE}/{m['slug']}.html"
    duration = video_duration(ROOT / "videos" / f"{m['video']}.mp4")
    chapters = "".join(
        f'<li><button type="button" data-t="{t}"><time>{clock(t)}</time><span>{esc(label)}</span></button></li>'
        for t, label in m["chapters"]
    )
    benefits = "".join(
        f'<article class="mod-benefit reveal"><span>{i:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></article>'
        for i, (t, d) in enumerate(m["benefits"], 1)
    )
    features = "".join(
        f'<li><i data-lucide="check"></i><span>{esc(f)}</span></li>'
        for f in m["features"]
    )
    faq = "".join(
        f"<details><summary>{esc(q)}<span>+</span></summary><p>{esc(a)}</p></details>"
        for q, a in m["faq"]
    )
    others = "".join(
        f'<a class="mod-other" href="/{o["slug"]}.html"><i data-lucide="{o["icon"]}"></i>'
        f"<span><small>{esc(o['pillar'])}</small><b>{esc(o['name'])}</b>{esc(o['short'])}</span></a>"
        for o in modules
        if o["slug"] != m["slug"]
    )
    guide_href, guide_label = m["guide"]
    t, d = esc(m["title"]), esc(m["description"])
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{t}</title>
    <meta name="description" content="{d}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="{url}">
    <meta name="theme-color" content="#ffffff">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Staff Meal">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{t}">
    <meta property="og:description" content="{d}">
    <meta property="og:image" content="{SITE}/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:video" content="{SITE}/videos/{m["video"]}.mp4">
    <meta property="og:video:type" content="video/mp4">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{t}">
    <meta name="twitter:description" content="{d}">
    <meta name="twitter:image" content="{SITE}/og-image.jpg">
    <link rel="icon" href="/assets/brand/mark.svg?v=20261027" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/assets/brand/mark.png?v=20261027">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
    <link rel="stylesheet" href="/shell.css?v=20261027">
    <link rel="stylesheet" href="/home.css?v=20261025e">
    <link rel="stylesheet" href="/modules.css?v={ASSET_V}">
    <link rel="preload" as="image" href="/videos/{m["video"]}.jpg">
    <script type="application/ld+json">
{json_ld(m, duration)}
</script>
    <script defer data-domain="staff-meal.com" data-api="/s/event" src="/s/script"></script>
    <script>window.plausible = window.plausible || function () {{ (window.plausible.q = window.plausible.q || []).push(arguments) }}</script>
    <script defer src="/analytics.js?v=20261027"></script>
</head>
<body>
    <a class="skip-link" href="#main">Aller au contenu</a>
    <div class="announcement"><span class="announcement-star" aria-hidden="true">✦</span>Bêta privée · 50 établissements accompagnés sur le terrain<a href="/#demo">Voir le programme <span aria-hidden="true">→</span></a></div>
    <header class="site-header" id="navbar">
      <a class="brand" href="/" aria-label="Staff Meal, accueil"><img class="brand-word" src="/assets/brand/wordmark.svg" alt="" width="136" height="24"></a>
      <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span></span><span></span><span class="sr-only">Ouvrir le menu</span></button>
      <nav class="main-nav" id="main-nav" aria-label="Navigation principale"><a href="/#produit">Produit</a><a href="/#modules">Modules</a><a href="/resources.html">Ressources</a><a href="/evenements.html">Événements</a><a href="/#faq">Questions</a><a href="/a-propos.html">À propos</a><a class="nav-cta" href="/#demo">Postuler (50 places)</a></nav>
      <div class="header-actions"><a class="text-link" href="https://app.staff-meal.com/login">Connexion</a><a class="button button-primary button-small" href="/#demo">Postuler (50 places)</a></div>
    </header>

    <main id="main" class="mod-page" data-module="{esc(m["name"])}">
      <section class="mod-intro">
        <div class="mod-hero-copy">
          <nav class="mod-crumb" aria-label="Fil d'Ariane"><a href="/#modules">Modules</a><span aria-hidden="true">/</span><span>{esc(m["pillar"])}</span></nav>
          <p class="eyebrow"><i data-lucide="{m["icon"]}"></i>{esc(m["name"])}</p>
          <h1>{esc(m["h1"])}</h1>
          <p class="mod-lede">{esc(m["lede"])}</p>
          <div class="mod-actions"><a class="button button-primary" href="/#demo">Postuler (50 places)</a><a class="button button-secondary" href="#demo-video"><i data-lucide="play"></i>Voir la démo</a></div>
        </div>
        {hero_loop(m)}
      </section>

      <section class="mod-hero mod-hero-{m["mode"]}" aria-labelledby="demo-title">
        <div class="mod-hero-copy mod-demo-head"><p class="eyebrow"><i data-lucide="play"></i>La démo complète</p><h2 id="demo-title">Filmée dans l'application, sans montage.</h2></div>
        <figure class="mod-player" id="demo-video">
          {device(m)}
          <div class="mod-progress" aria-hidden="true"><i></i></div>
          <figcaption>Filmé dans l'application Staff Meal, sur un établissement de démonstration.</figcaption>
        </figure>
        <div class="mod-chapters-wrap">
          <p class="mod-chapters-title">Dans la vidéo</p>
          <ol class="mod-chapters">{chapters}</ol>
        </div>
      </section>

      <section class="section-shell mod-section" aria-labelledby="benefits-title">
        <div class="section-heading compact reveal"><p class="eyebrow">Ce que ça change</p><h2 id="benefits-title">Sur le terrain, concrètement.</h2></div>
        <div class="mod-benefits">{benefits}</div>
      </section>

      <section class="section-shell mod-section mod-features" aria-labelledby="features-title">
        <div class="section-heading compact reveal"><p class="eyebrow">Le module en détail</p><h2 id="features-title">Ce qu'il fait.</h2>
          <p class="mod-guide">Pour aller plus loin : <a href="{guide_href}">{esc(guide_label)} <span aria-hidden="true">→</span></a></p></div>
        <ul class="mod-feature-list reveal">{features}</ul>
      </section>

      <section class="section-shell faq mod-section" aria-labelledby="faq-title"><div class="section-heading reveal"><p class="eyebrow">Questions</p><h2 id="faq-title">Avant de vous lancer.</h2></div><div class="faq-list reveal">{faq}</div></section>

      <section class="section-shell mod-section" aria-labelledby="others-title">
        <div class="section-heading compact reveal"><p class="eyebrow">Une seule app</p><h2 id="others-title">Les autres modules.</h2></div>
        <div class="mod-others">{others}</div>
      </section>

      <section class="mod-cta"><div><p class="eyebrow">Club fermé</p><h2>Faites partie des 50 pionniers.</h2><p>Cinquante établissements accompagnés sur place, qui décident de ce qui se construit ensuite.</p></div><a class="button button-primary" href="/#demo">Postuler au programme (2 min)</a></section>
    </main>

    <footer class="site-footer"><div class="footer-brand"><a class="brand" href="/"><img class="brand-word" src="/assets/brand/wordmark-white.svg" alt="Staff Meal" width="136" height="24"></a><p>Le même service,<br>à chaque service.</p></div><div class="footer-links"><div><b>Comparatifs</b><a href="/staffmeal-vs-skello.html">Staff Meal et Skello</a><a href="/staffmeal-vs-koust.html">Staff Meal vs Koust</a><a href="/staffmeal-vs-combo.html">Staff Meal vs Combo</a></div><div><b>Ressources</b><a href="/resources.html">Outils gratuits</a><a href="/evenements.html">Événements</a><a href="/#demo">Nous contacter</a></div><div><b>Produit</b><a href="/#produit">Aperçu</a><a href="/#modules">Les 9 modules</a><a href="/#faq">Questions</a><a href="https://app.staff-meal.com/login">Connexion</a></div></div><div class="footer-bottom"><span>© 2026 Staff Meal</span><span>Pour les restaurateurs, par des restaurateurs.</span></div></footer>

    <script src="/shell.js?v=20261025c" defer></script>
    <script src="/modules.js?v={ASSET_V}" defer></script>
    <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js" defer></script>
    <script>
        window.addEventListener('load', () => {{
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }});
    </script>
</body>
</html>
"""


def main() -> None:
    modules: list[Module] = json.loads(
        (ROOT / "content" / "modules.json").read_text(encoding="utf-8")
    )
    for m in modules:
        for bad in ("—", " IA ", " AI "):
            blob = json.dumps(m, ensure_ascii=False)
            if bad in blob:
                raise SystemExit(f"{m['slug']} : contenu interdit « {bad.strip()} »")
        (ROOT / f"{m['slug']}.html").write_text(page(m, modules), encoding="utf-8")
        print(f"{m['slug']}.html")


if __name__ == "__main__":
    main()
