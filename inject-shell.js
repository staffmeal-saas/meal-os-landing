const fs = require('fs');
const path = require('path');

const files = [
    'food-cost-calculator.html',
    'matrice-menu-engineering.html',
    'calculateur-gaspillage-alimentaire.html',
    'generateur-fiche-technique.html',
    'generateur-reponse-avis-google.html',
    'prime-cost-calculator.html'
];

const cssInjection = `
        /* Dashboard App specific layout */
        .sidebar { width: 260px; height: 100vh; position: fixed; left: 0; top: 0; background: white; border-right: 3px solid theme('colors.foreground'); padding: 2rem 1.5rem; display: flex; flex-direction: column; z-index: 100;}
        .app-main { margin-left: 260px; padding: 2rem; min-height: 100vh; padding-top: 2rem; }
        
        @media (max-width: 1024px) {
            .sidebar { transform: translateX(-100%); z-index: 100; transition: transform 0.3s ease; }
            .sidebar.open { transform: translateX(0); }
            .app-main { margin-left: 0; padding: 1.5rem; padding-top: 5rem;}
        }

        .nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; font-family: theme('fontFamily.sans'); font-weight: 700; opacity: 0.7; transition: all 0.2s; border: 2px solid transparent;}
        .nav-link:hover { opacity: 1; background: rgba(0,0,0,0.05); }
        .nav-link.active { opacity: 1; background: theme('colors.mustard'); border-color: theme('colors.foreground'); color: theme('colors.foreground'); box-shadow: 2px 2px 0px 0px theme('colors.foreground');}
        
        @media print {
            .sidebar, .lg\\:hidden { display: none !important; }
            .app-main { margin-left: 0 !important; padding: 0 !important; }
        }
`;

const htmlInjection = `
    <!-- Mobile Header -->
    <div class="lg:hidden fixed top-0 w-full left-0 bg-white border-b-3 border-foreground px-4 py-3 flex items-center justify-between z-40 no-print" style="box-shadow: 4px 4px 0px 0px #382512;">
        <a href="boite-a-outils-dashboard.html" class="logo-handwritten text-3xl">meal OS</a>
        <button id="menuToggle" class="p-2"><i data-lucide="menu"></i></button>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar bg-background no-print" id="sidebar">
        <div class="flex items-center justify-between mb-10">
            <a href="boite-a-outils-dashboard.html" class="logo-handwritten text-4xl">meal OS</a>
            <button id="closeMenu" class="lg:hidden"><i data-lucide="x"></i></button>
        </div>

        <nav class="space-y-2 flex-grow overflow-y-auto pb-4">
            <div class="text-xs font-black uppercase tracking-widest opacity-40 mb-3 px-3">Espace Restaurant</div>
            <a href="boite-a-outils-dashboard.html" class="nav-link active">
                <i data-lucide="layout-grid" class="w-5 h-5"></i> Outils Gratuits
            </a>
            
            <div class="pt-6 mt-6 border-t-2 border-foreground/10">
                <div class="text-xs font-black uppercase tracking-widest opacity-40 mb-3 px-3 flex items-center justify-between">
                    Meal OS Complet <span class="bg-accent text-white text-[8px] px-1 py-0.5 rounded uppercase">Pro</span>
                </div>
                <a href="#" class="nav-link flex items-center justify-between group pro-link" data-pro-module="haccp" style="opacity: 0.5;">
                    <div class="flex items-center gap-3"><i data-lucide="clipboard-check" class="w-5 h-5"></i> Audit HACCP</div>
                    <i data-lucide="lock" class="w-3 h-3 opacity-30 group-hover:text-accent group-hover:opacity-100 transition-colors"></i>
                </a>
                <a href="#" class="nav-link flex items-center justify-between group pro-link" data-pro-module="ops" style="opacity: 0.5;">
                    <div class="flex items-center gap-3"><i data-lucide="book" class="w-5 h-5"></i> Manuel OPS</div>
                    <i data-lucide="lock" class="w-3 h-3 opacity-30 group-hover:text-accent group-hover:opacity-100 transition-colors"></i>
                </a>
                <a href="#" class="nav-link flex items-center justify-between group pro-link" data-pro-module="rh" style="opacity: 0.5;">
                    <div class="flex items-center gap-3"><i data-lucide="users" class="w-5 h-5"></i> Gestion RH</div>
                    <i data-lucide="lock" class="w-3 h-3 opacity-30 group-hover:text-accent group-hover:opacity-100 transition-colors"></i>
                </a>
                <a href="#" class="nav-link flex items-center justify-between group pro-link" data-pro-module="maintenance" style="opacity: 0.5;">
                    <div class="flex items-center gap-3"><i data-lucide="wrench" class="w-5 h-5"></i> Maintenance</div>
                    <i data-lucide="lock" class="w-3 h-3 opacity-30 group-hover:text-accent group-hover:opacity-100 transition-colors"></i>
                </a>
            </div>

            <div class="pt-6 mt-6 border-t-2 border-foreground/10">
                <div class="text-xs font-black uppercase tracking-widest opacity-40 mb-3 px-3">Ressources</div>
                <a href="resources.html" class="nav-link">
                    <i data-lucide="book-open" class="w-5 h-5"></i> Articles & Guides
                </a>
            </div>
        </nav>

        <div class="mt-auto border-t-2 border-foreground/10 pt-6">
            <div class="flex items-center gap-3 px-2">
                <div class="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-display font-black text-xl" id="avatarInitials">U</div>
                <div class="overflow-hidden">
                    <div class="font-bold text-sm truncate w-full" id="sidebarName">Utilisateur</div>
                    <div class="text-xs opacity-60 truncate w-full" id="sidebarRestaurant">Restaurant</div>
                </div>
            </div>
            <a href="index.html" class="mt-4 text-xs font-bold uppercase tracking-wider text-accent hover:underline px-2 flex items-center gap-1 w-full justify-start"><i data-lucide="arrow-left" class="w-3 h-3"></i> Retour au site</a>
        </div>
    </aside>

    <!-- Soft Paywall Modal -->
    <div id="proModalOverlay" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
        <!-- Backdrop blur -->
        <div class="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"></div>
        
        <!-- Modal Card -->
        <div class="card-retro bg-white p-8 max-w-lg w-full relative z-10 transform transition-all duration-300 scale-95 opacity-0" id="proModalCard">
            <button id="closeProModal" class="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            
            <div class="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border-2 border-accent text-accent mx-auto">
                <i data-lucide="lock" class="w-8 h-8" id="proModalIcon"></i>
            </div>
            
            <h2 class="font-display font-black text-3xl mb-3 text-center" id="proModalTitle">Fonctionnalité Premium</h2>
            <p class="font-sans text-center font-medium opacity-80 mb-6" id="proModalDesc">Découvrez la puissance de Meal OS Pro.</p>
            
            <div class="bg-mustard/20 border-2 border-mustard rounded-lg p-4 mb-8 text-sm font-medium text-center">
                <span class="font-black uppercase tracking-wider text-xs block mb-1">🎁 Accès exclusif</span>
                Réservé aux établissements partenaires Meal OS.
            </div>
            
            <div class="flex flex-col gap-3">
                <!-- Calendly Link -->
                <a href="#" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/mealos/15min'});return false;" class="btn-retro w-full group text-center">
                    Voir ce module en action <i data-lucide="arrow-right" class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"></i>
                </a>
                <button id="cancelProModal" class="btn-retro alt w-full border-transparent hover:border-transparent hover:bg-black/5 shadow-none group-hover:translate-y-0 text-sm opacity-70">
                    Non merci, je reste sur l'outil gratuit
                </button>
            </div>
        </div>
    </div>

    <!-- Calendly link widget begin -->
    <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
    <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
    <!-- Calendly link widget end -->

    <!-- Pro Modal Logic -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const proModalOverlay = document.getElementById('proModalOverlay');
            const proModalCard = document.getElementById('proModalCard');
            const proModalTitle = document.getElementById('proModalTitle');
            const proModalDesc = document.getElementById('proModalDesc');
            const proModalIcon = document.getElementById('proModalIcon');
            
            const proTitles = {
                'haccp': { title: "Fini la panique lors des contrôles.", desc: "Digitalisez vos relevés de températures et vos protocoles de nettoyage. Soyez 100% prêt à tout moment.", icon: "clipboard-check" },
                'ops': { title: "Vos standards, respectés par tous.", desc: "Créez vos checklists d'ouverture et de fermeture. Fini les petites erreurs du quotidien.", icon: "book" },
                'rh': { title: "Vos plannings créés en 3 min.", desc: "Centralisez les plannings, absences et documents RH de toute votre équipe en un seul endroit.", icon: "users" },
                'maintenance': { title: "Ne laissez plus vos machines vous lâcher.", desc: "Anticipez les pannes et planifiez les interventions pour protéger votre précieux matériel.", icon: "wrench" },
            };

            function openProModal(moduleKey) {
                if(proTitles[moduleKey]) {
                    proModalTitle.textContent = proTitles[moduleKey].title;
                    proModalDesc.textContent = proTitles[moduleKey].desc;
                    proModalIcon.setAttribute('data-lucide', proTitles[moduleKey].icon);
                    if(typeof lucide !== 'undefined') lucide.createIcons();
                }
                
                proModalOverlay.classList.remove('hidden');
                setTimeout(() => {
                    proModalCard.classList.remove('scale-95', 'opacity-0');
                }, 10);
            }

            function closeProModalFunc() {
                proModalCard.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    proModalOverlay.classList.add('hidden');
                }, 300);
            }

            document.querySelectorAll('.pro-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openProModal(link.getAttribute('data-pro-module'));
                });
            });

            document.getElementById('closeProModal').addEventListener('click', closeProModalFunc);
            document.getElementById('cancelProModal').addEventListener('click', closeProModalFunc);
        });
    </script>

    <main class="app-main">
`;

const jsInjection = `
    <!-- App Shell Logic -->
    <script>
        const menuToggleApp = document.getElementById('menuToggle');
        const closeMenuApp = document.getElementById('closeMenu');
        const sidebarApp = document.getElementById('sidebar');

        if(menuToggleApp) menuToggleApp.addEventListener('click', () => sidebarApp.classList.add('open'));
        if(closeMenuApp) closeMenuApp.addEventListener('click', () => sidebarApp.classList.remove('open'));

        const userAppStr = localStorage.getItem('mealos_tools_user');
        if (userAppStr) {
            const userApp = JSON.parse(userAppStr);
            if(document.getElementById('sidebarName')) document.getElementById('sidebarName').textContent = userApp.firstName + ' ' + userApp.lastName;
            if(document.getElementById('sidebarRestaurant')) document.getElementById('sidebarRestaurant').textContent = userApp.restaurant;
            if(document.getElementById('avatarInitials')) document.getElementById('avatarInitials').textContent = userApp.firstName ? userApp.firstName.charAt(0).toUpperCase() : 'U';
        }
    </script>
</body>
`;

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        let changed = false;

        // Force replace HTML layout: Find old HTML layout.
        const regexHeaderMain = /<!-- Mobile Header -->[\s\S]*?<main class="app-main">/i;
        if (regexHeaderMain.test(content)) {
            content = content.replace(regexHeaderMain, htmlInjection);
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(fullPath, content);
            console.log('Updated ' + file);
        } else {
            console.log('No changes needed for ' + file);
        }
    } else {
        console.log('File not found: ' + file);
    }
});
