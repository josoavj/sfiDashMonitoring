// When using the @tailwindcss/vite plugin, Tailwind's transform is handled by Vite.
// Keep PostCSS config minimal to only run autoprefixer so we avoid duplicate Tailwind
// processing. If you prefer PostCSS-driven Tailwind, restore the tailwind plugin here.
module.exports = {
  plugins: [
    require('autoprefixer')
  ]
};