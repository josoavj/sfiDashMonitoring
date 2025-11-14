// Try to load the new Tailwind PostCSS adapter if available, otherwise fall back to the
// legacy `tailwindcss` plugin. This helps in environments where versions differ.
let tailwindPlugin;
try {
  tailwindPlugin = require('@tailwindcss/postcss');
} catch (err) {
  // fallback to classic tailwindcss plugin
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  tailwindPlugin = require('tailwindcss');
}

module.exports = {
  plugins: [
    tailwindPlugin,
    require('autoprefixer'),
  ],
};