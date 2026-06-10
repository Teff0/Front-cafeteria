/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#E07B39', dark: '#C4621F', light: '#FFF3EB' },
        secondary: { DEFAULT: '#3D8F5F', dark: '#2A6B47', light: '#ECFDF5' },
        accent:    '#F4B942',
        espresso:  { DEFAULT: '#1C1917', soft: '#44403C', muted: '#78716C' },
        cream:     { DEFAULT: '#FFFDF8', border: '#E7E5E4' },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 12px rgba(28,25,23,.08)',
        float: '0 8px 32px rgba(28,25,23,.14)',
      },
    },
  },
  plugins: [],
}
