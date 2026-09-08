// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project sites live under /<repo>/; keep paths base-aware so a
  // custom domain swap later is a one-line change. See src/lib/url.ts.
  site: 'https://example.github.io',
  base: '/i-ve-learned',
  trailingSlash: 'never',
  markdown: {
    shikiConfig: {
      // 低饱和极简主题，匹配纸感设计（代码块背景在 global.css 中透明化）
      theme: 'min-light',
      wrap: true,
    },
  },
  integrations: [
    sitemap(),
    // OG 图见 src/pages/og/[...route].ts（astro-og-canvas 端点模式）
  ],
  vite: {
    plugins: [tailwindcss()],
    // Tailwind v4 OKLCH colors can be rewritten incorrectly by Lightning CSS.
    build: {
      cssMinify: 'esbuild',
    },
  },
});
