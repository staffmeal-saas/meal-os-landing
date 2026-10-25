/** @type {import('tailwindcss').Config} */
/*
  Staff Meal — DA v2 (octobre 2026), grammaire Notion : blanc dominant,
  encre #191919, un seul accent bleu #2383E2, Inter partout.
  Les NOMS de tokens sont gardés (background, paper, accent…) pour que les
  40 pages basculent sans retoucher leur HTML : seules les valeurs changent.
  Les mêmes valeurs vivent en variables CSS dans shell.css.
*/
module.exports = {
    content: ["./*.html"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
                display: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
                // L'ancienne manuscrite devient un sur-titre (voir .font-script dans input.css)
                script: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
            },
            colors: {
                background: '#ffffff',   // fond de page
                paper: '#f7f7f5',        // surfaces et cartes
                'cream-dark': '#e7e7e4', // séparateurs, surfaces enfoncées
                foreground: '#191919',   // encre
                'ink-soft': '#4f4f4b',   // texte secondaire
                'ink-faint': '#787774',  // texte tertiaire
                accent: '#2383e2',       // bleu, action et mise en avant
                'accent-dark': '#1269bd',
                'accent-soft': '#eaf3fc',
                leaf: '#0f7b6c',         // validé, preuve
                olive: '#0f7b6c',        // alias historique du site
                mustard: '#e9a23b',      // avertissement
                pause: '#a7d6ff',        // surlignage
                'pause-soft': '#eaf3fc',
            },
            boxShadow: {
                'flat': '0 2px 10px rgba(25,25,25,0.06)',
                'mark': '0 14px 40px rgba(25,25,25,0.08)',
                'none': 'none',
            }
        }
    },
    plugins: [],
}
