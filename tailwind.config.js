/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.html"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Outfit"', '"Outfit-fallback"', 'sans-serif'],
                display: ['"Fraunces"', '"Fraunces-fallback"', 'serif'],
                script: ['"Caveat"', '"Caveat-fallback"', 'cursive'],
            },
            colors: {
                background: '#FFFFFF',
                foreground: '#000000',
                accent: '#E30613',
            },
            boxShadow: {
                'flat': '0px 2px 4px rgba(0,0,0,0.05)',
                'none': 'none',
            }
        }
    },
    plugins: [],
}
