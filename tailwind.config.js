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
                background: '#FAF2D7',
                foreground: '#382512',
                accent: '#BB4321',
                olive: '#80914E',
                mustard: '#EAB24A',
            },
            boxShadow: {
                'retro': '4px 4px 0px 0px #382512',
                'retro-hover': '2px 2px 0px 0px #382512',
            }
        }
    },
    plugins: [],
}
