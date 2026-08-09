import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://proof-of-worth.netlify.app',
  compressHTML: true,
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
