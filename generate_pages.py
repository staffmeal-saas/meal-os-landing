import os
import re

def update_file(filename, title, desc, main_content):
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace title and meta
    content = re.sub(
        r'<title>.*?</title>',
        f'<title>{title}</title>',
        content,
        flags=re.DOTALL
    )
    
    # Replace main description
    content = re.sub(
        r'<meta name="description"\s+content=".*?">',
        f'<meta name="description"\n        content="{desc}">',
        content,
        count=1,
        flags=re.DOTALL
    )
    
    # Replace OG and Twitter descriptions
    content = re.sub(
        r'<meta property="og:description"\s+content=".*?">',
        f'<meta property="og:description"\n        content="{desc}">',
        content,
        count=1,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<meta property="twitter:description"\s+content=".*?">',
        f'<meta property="twitter:description"\n        content="{desc}">',
        content,
        count=1,
        flags=re.DOTALL
    )

    # Replaces OG & Twitter tags titles
    content = re.sub(
        r'<meta property="og:title" content=".*?">',
        f'<meta property="og:title" content="{title}">',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<meta property="twitter:title" content=".*?">',
        f'<meta property="twitter:title" content="{title}">',
        content,
        flags=re.DOTALL
    )

    # Replace canonical and other URLs
    content = re.sub(
        r'<meta property="og:url" content="https://www\.mealos\.com/">',
        f'<meta property="og:url" content="https://staffmeal-app.netlify.app/{filename}">',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<meta property="twitter:url" content="https://www\.mealos\.com/">',
        f'<meta property="twitter:url" content="https://staffmeal-app.netlify.app/{filename}">',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<link rel="canonical" href="https://www\.mealos\.com/">',
        f'<link rel="canonical" href="https://staffmeal-app.netlify.app/{filename}">',
        content,
        flags=re.DOTALL
    )

    # Replace main section
    content = re.sub(
        r'<main>.*?</main>',
        f'<main>\n{main_content}\n    </main>',
        content,
        flags=re.DOTALL
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)


skello_main = """
        <section class="relative min-h-[70vh] flex items-center justify-center pt-32 pb-20 px-4 md:px-12 bg-background overflow-hidden border-b border-foreground">
            <div class="blob-1" style="top: 20%; right: 10%;"></div>
            <div class="max-w-4xl mx-auto w-full text-center relative z-10 reveal">
                <div class="inline-flex items-center gap-2 bg-[#f4eedf] border-2 border-foreground rounded-full px-4 py-2 mb-6 transform -rotate-2 shadow-[2px_2px_0px_#181410]">
                    <span class="font-sans font-bold text-sm tracking-wide">Comparatif 2026 : Logiciels RH Restauration</span>
                </div>
                <h1 class="text-chunky text-5xl md:text-7xl mb-6 mt-4">Skello <span class="text-mustard font-display mx-2">VS</span> Staff Meal</h1>
                <p class="font-display italic font-bold text-3xl mb-8">L'alternative tout-en-un pour vos opérations.</p>
                <p class="font-sans font-medium text-lg max-w-2xl mx-auto leading-snug mb-10 opacity-80">
                    Skello est le spécialiste du planning. Staff Meal est le spécialiste du restaurant. Pourquoi multiplier les abonnements quand une seule plateforme peut gérer vos plannings, centraliser vos fiches techniques, automatiser l'HACCP et garantir votre communication interne ?
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="#demo" class="btn-retro">Tester Staff Meal (50 places)</a>
                </div>
            </div>
        </section>
        
        <section class="max-w-5xl mx-auto px-4 md:px-12 py-16 reveal delay-1">
            <h2 class="text-center font-display font-black text-3xl md:text-4xl mb-12">Au-delà du planning...</h2>
            <div class="card-retro overflow-hidden bg-paper">
                <div class="grid grid-cols-2 lg:grid-cols-3 bg-foreground text-background p-4 text-center font-sans font-bold text-lg uppercase tracking-wider">
                    <div class="hidden lg:block border-r-2 border-background/20">Fonctionnalités Clés</div>
                    <div class="text-[#f4eedf]/60 border-r-2 border-background/20">Skello</div>
                    <div class="text-mustard">Staff Meal</div>
                </div>
                <div class="divide-y-2 divide-foreground/10 font-sans font-medium text-lg">
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Plannings & RH</div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 bg-[#f4eedf] text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Standardisation HACCP</div><div class="text-accent/50 flex justify-center"><i data-lucide="x" class="w-6 h-6"></i></div><div class="font-bold text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 bg-[#f4eedf] text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Rendements & Recettes</div><div class="text-accent/50 flex justify-center"><i data-lucide="x" class="w-6 h-6"></i></div><div class="font-bold text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                </div>
            </div>
        </section>
"""

koust_main = """
        <section class="relative min-h-[70vh] flex items-center justify-center pt-32 pb-20 px-4 md:px-12 bg-[#f4eedf] overflow-hidden border-b border-foreground">
            <div class="max-w-4xl mx-auto w-full text-center relative z-10 reveal">
                <div class="inline-flex items-center gap-2 bg-[#D5DCD0] border-2 border-foreground rounded-full px-4 py-2 mb-6">
                    <span class="font-sans font-bold text-sm tracking-wide">Comparatif 2026 : Food Cost & Marges</span>
                </div>
                <h1 class="text-chunky text-5xl md:text-7xl mb-6 mt-4">Koust <span class="text-accent font-display mx-2">VS</span> Staff Meal</h1>
                <p class="font-display italic font-bold text-3xl mb-8">Maîtrisez vos marges sans l'usine à gaz.</p>
                <p class="font-sans font-medium text-lg max-w-2xl mx-auto leading-snug mb-10 opacity-80">
                    Koust est puissant pour gérer vos stocks très précisément. Mais il faut un ingénieur pour l'utiliser en cuisine. Staff Meal propose une approche "terrain", simple, pour contrôler son Food Cost tout en intégrant RH et HACCP que Koust n'a pas !
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="#demo" class="btn-retro alt">Postuler (50 places réservées)</a>
                </div>
            </div>
        </section>

        <section class="max-w-5xl mx-auto px-4 md:px-12 py-16 reveal delay-1">
            <div class="card-retro overflow-hidden bg-paper">
                <div class="grid grid-cols-2 lg:grid-cols-3 bg-foreground text-background p-4 text-center font-sans font-bold text-lg uppercase tracking-wider">
                    <div class="hidden lg:block border-r-2 border-background/20">Fonctionnalités</div>
                    <div class="text-[#f4eedf]/60 border-r-2 border-background/20">Koust</div>
                    <div class="text-mustard">Staff Meal</div>
                </div>
                <div class="divide-y-2 divide-foreground/10 font-sans font-medium text-lg">
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Fiches Recettes & Marges</div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Complexité</div><div class="text-accent flex justify-center font-bold">Élevée/Technique</div><div class="text-olive flex justify-center font-bold">Très Intuitive</div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 bg-[#D5DCD0] text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Communication & Equipe</div><div class="text-accent/50 flex justify-center"><i data-lucide="x" class="w-6 h-6"></i></div><div class="font-bold text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                </div>
            </div>
        </section>
"""

combo_main = """
        <section class="relative min-h-[70vh] flex items-center justify-center pt-32 pb-20 px-4 md:px-12 bg-paper overflow-hidden border-b border-foreground">
            <div class="blob-1 bg-olive" style="width: 300px; height: 300px; top: -50px; left: -50px;"></div>
            <div class="max-w-4xl mx-auto w-full text-center relative z-10 reveal">
                <div class="inline-flex items-center gap-2 bg-[#f4eedf] border-2 border-foreground rounded-full px-4 py-2 mb-6">
                    <span class="font-sans font-bold text-sm tracking-wide">Comparatif 2026 : Outils Opérationnels</span>
                </div>
                <h1 class="text-chunky text-5xl md:text-7xl mb-6 mt-4">Combo <span class="text-mustard font-display mx-2">VS</span> Staff Meal</h1>
                <p class="font-display italic font-bold text-3xl mb-8">Plus qu'une simple pointeuse connectée.</p>
                <p class="font-sans font-medium text-lg max-w-2xl mx-auto leading-snug mb-10 opacity-80">
                    Combo connecte vos équipes au planning. C'est déjà bien. Mais Staff Meal ajoute à cela le suivi opérationnel, l'hygiène HACCP, et le suivi financier (Food Cost). Ne payez pas une plateforme juste pour des plannings.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="#demo" class="btn-retro">Tester Staff Meal (50 places)</a>
                </div>
            </div>
        </section>

        <section class="max-w-5xl mx-auto px-4 md:px-12 py-16 reveal delay-1">
            <div class="card-retro overflow-hidden bg-paper">
                <div class="grid grid-cols-2 lg:grid-cols-3 bg-foreground text-background p-4 text-center font-sans font-bold text-lg uppercase tracking-wider">
                    <div class="hidden lg:block border-r-2 border-background/20">Gestion Restauration</div>
                    <div class="text-[#f4eedf]/60 border-r-2 border-background/20">Combo</div>
                    <div class="text-mustard">Staff Meal</div>
                </div>
                <div class="divide-y-2 divide-foreground/10 font-sans font-medium text-lg">
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Planning & Paie</div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Messagerie Equipe</div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div><div class="text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 bg-[#f4eedf] text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Contrôle Ratios/Recettes</div><div class="text-accent/50 flex justify-center"><i data-lucide="x" class="w-6 h-6"></i></div><div class="font-bold text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                    <div class="grid grid-cols-2 lg:grid-cols-3 p-4 md:p-6 bg-[#f4eedf] text-center lg:text-left items-center"><div class="hidden lg:block font-bold">Hygiène & Audit</div><div class="text-accent/50 flex justify-center"><i data-lucide="x" class="w-6 h-6"></i></div><div class="font-bold text-olive flex justify-center"><i data-lucide="check" class="w-6 h-6"></i></div></div>
                </div>
            </div>
        </section>
"""

# Append common footer to all main blocks
common_footer = """
        <section id="demo" class="py-24 px-4 md:px-12 bg-foreground border-t border-foreground">
            <div class="max-w-5xl mx-auto card-retro bg-paper md:p-0 flex flex-col md:flex-row overflow-hidden reveal">
                <div class="md:w-5/12 bg-accent text-background p-10 md:p-12 relative border-b md:border-b-0 md:border-r border-foreground border-dashed flex flex-col justify-center">
                    <div class="absolute inset-0 bg-foreground opacity-5" style="background-image: radial-gradient(circle, #000 2px, transparent 2px); background-size: 10px 10px;"></div>
                    <div class="relative z-10">
                        <p class="font-script text-mustard text-3xl mb-2 transform -rotate-3">Ne payez plus 5 fois</p>
                        <h2 class="text-chunky text-4xl mb-6">Passez à<br>l'étape supérieure.</h2>
                        <p class="font-sans font-medium opacity-90 mb-8">
                            Rejoignez la bêta de Staff Meal. L'outil ultime.
                        </p>
                    </div>
                </div>
                <div class="md:w-7/12 p-10 md:p-16 bg-background flex items-center justify-center">
                    <form class="space-y-6 w-full max-w-sm">
                        <!-- Same form -->
                        <div>
                            <label class="font-sans font-bold text-sm uppercase tracking-wider mb-2 block ml-2">Nom de l'établissement</label>
                            <input type="text" class="input-retro" placeholder="ex: Le Petit Bistro">
                        </div>
                        <div>
                            <label class="font-sans font-bold text-sm uppercase tracking-wider mb-2 block ml-2">Téléphone</label>
                            <input type="text" class="input-retro" placeholder="06 00 00 00 00">
                        </div>
                        <div>
                            <label class="font-sans font-bold text-sm uppercase tracking-wider mb-2 block ml-2">Email</label>
                            <input type="email" class="input-retro" placeholder="chef@restaurant.com">
                        </div>
                        <div class="pt-4">
                            <button type="submit" class="btn-retro w-full hover:bg-olive hover:text-white transition-colors">Postuler (2 min)</button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
"""

update_file(
    'staffmeal-vs-skello.html', 
    'Skello vs Staff Meal : La Meilleure Alternative (2026)', 
    "Découvrez pourquoi Staff Meal est la meilleure alternative à Skello. Gérez vos plannings, vos normes HACCP et vos équipes avec un seul outil tout-en-un.", 
    skello_main + common_footer
)

update_file(
    'staffmeal-vs-koust.html', 
    'Koust vs Staff Meal : Simplifiez vos fiches recettes (2026)', 
    "L'alternative terrain à Koust. Contrôlez vos rendements, votre food cost et formez votre équipe avec Staff Meal, plus simple et tout-en-un.", 
    koust_main + common_footer
)

update_file(
    'staffmeal-vs-combo.html', 
    'Combo (ex Snapshift) vs Staff Meal : Le comparatif (2026)', 
    "L'alternative idéale à Combo. Gérez les plannings et les pointages, mais intégrez aussi HACCP, pertes et opérations grâce à Staff Meal.", 
    combo_main + common_footer
)

print("Pages comparatives générées avec succès.")
