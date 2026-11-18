/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: '#ABC270',      // hijau
        honey: '#FEC868',     // kuning
        peach: '#FDA769',     // oranye
        cocoa: '#473C33',     // cokelat tua
        cream: '#FDFCF0',     // latar halaman
        danger: '#C2492F',    // merah-terakota khusus status "Risiko tinggi"
      },
      fontFamily: {
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
