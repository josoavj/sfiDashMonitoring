module.exports = {
  // Use the new PostCSS adapter package for Tailwind
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
};
