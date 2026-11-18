/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet Tropical Candy (Colorblind Friendly)
        ambercandy: '#E58606',  // Tombol utama & status waspada
        indigocandy: '#5D69B1', // Upload QR & edukasi
        mintcandy: '#52BCA3',   // Aksen sekunder & tombol salin
        limecandy: '#99C945',   // Status aman
        orchidcandy: '#CC61B0', // Badge tipe & aksen kontras
        deepteal: '#24796C',    // Header utama & teks

        // Warna netral & risiko tinggi
        cocoa: '#193531',       // Teks gelap kontras
        cream: '#F4FAF8',       // Latar lembut
        danger: '#C2492F',      // Merah-terakota khusus status "Risiko tinggi"

        // Alias kompatibilitas
        sage: '#99C945',
        honey: '#E58606',
        peach: '#CC61B0',
      },
      fontFamily: {
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
