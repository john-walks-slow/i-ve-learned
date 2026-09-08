// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project sites live under /<repo>/; keep paths base-aware so a
  // custom domain swap later is a one-line change. See src/lib/url.ts.
  site: 'https://example.github.io',
  base: '/i-ve-learned',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
    // Tailwind v4 OKLCH colors can be rewritten incorrectly by Lightning CSS.
    build: {
      cssMinify: 'esbuild',
    },
  },
});
