module.exports = {
  content: ['./src/**/*.{js,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disabilita il reset CSS di Tailwind per evitare conflitti con Home Assistant
  },
  important: true, // Assicura che le classi Tailwind abbiano priorità
};