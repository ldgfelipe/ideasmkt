// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ideasmkt.web.app',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    react(),
    sitemap({
      // El panel de administración y el login no deben indexarse.
      filter: (page) => !page.includes('/admin') && !page.includes('/login')
    })
  ]
});
