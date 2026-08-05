/** @type {import('tailwindcss').Config} */
/*
  Staff Meal — tokens repris tels quels de l'app en prod (~/projects/staffmeal/src/index.css).
  Orange Coup de feu = action · Crème Papier = fonds · Encre = trait/texte
  Vert Frais = validé/vivant · Bleu Pause = respiration
  Ne pas diverger de l'app : le site et le produit doivent être la même marque.
*/
module.exports = {
    content: ["./*.html"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Familjen Grotesk"', '"Familjen-fallback"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['"Familjen Grotesk"', '"Familjen-fallback"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                script: ['"Shantell Sans"', '"Shantell-fallback"', 'cursive'],
            },
            colors: {
                background: '#f4eedf',   // crème, fond de page
                paper: '#fbf8ee',        // surfaces et cartes
                'cream-dark': '#e9e1cb', // séparateurs, surfaces enfoncées
                foreground: '#181410',   // encre
                'ink-soft': '#4a443c',   // texte secondaire
                'ink-faint': '#7d766b',  // texte tertiaire
                accent: '#f0481c',       // orange coup de feu, action
                'accent-dark': '#d33c13',
                'accent-soft': '#fde8e0',
                leaf: '#4c6b27',         // validé, preuve
                olive: '#4c6b27',        // alias historique du site
                mustard: '#b3720f',      // avertissement
                pause: '#a9c6da',        // respiration
                'pause-soft': '#e9f1f7',
            },
            boxShadow: {
                'flat': '0px 2px 4px rgba(24,20,16,0.06)',
                'mark': '0 6px 16px rgba(24,20,16,0.18)',
                'none': 'none',
            }
        }
    },
    plugins: [],
}
