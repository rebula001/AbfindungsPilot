import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

/**
 * PrimeIcons liefert seine @font-face-Regel mit fünf Formaten aus
 * (eot, woff2, woff, ttf, svg) — Stand 2026 reicht woff2 für >97 % aller
 * Browser. Dieses Mini-Plugin schreibt die CSS-Regel beim Laden so um,
 * dass nur die woff2-Variante referenziert wird; dadurch werden eot/woff/
 * ttf/svg vom Bundler nicht mehr emittiert (~597 KB Ersparnis).
 */
function primeIconsWoff2Only(): Plugin {
  return {
    name: 'primeicons-woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('primeicons') || !id.endsWith('.css')) return null;
      return code.replace(
        /@font-face\s*\{[^}]*\}/,
        `@font-face {
    font-family: 'primeicons';
    font-display: block;
    src: url('./fonts/primeicons.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
}`
      );
    }
  };
}

function manualChunks(id: string): string | undefined {
  if (!id.includes('/node_modules/')) return undefined;
  if (id.includes('/node_modules/@vue/') || id.includes('/node_modules/vue/')) return 'vendor-vue';
  if (id.includes('/node_modules/primevue/') || id.includes('/node_modules/@primevue/')) return 'vendor-primevue';
  if (id.includes('/node_modules/@primeuix/') || id.includes('/node_modules/primeicons/')) return 'vendor-primeui';
  if (id.includes('/node_modules/vue-i18n/') || id.includes('/node_modules/@intlify/')) return 'vendor-i18n';
  return 'vendor';
}

// https://vite.dev/config/
export default defineConfig({
  // Basis-URL für Asset-Pfade.
  // - Lokal (dev / preview): "/" (Standard)
  // - GitHub Pages Project-Page: "/AbfindungsPilot/" -> wird vom Deploy-Workflow
  //   per VITE_BASE_PATH injiziert, damit der Build dieselbe Konfig nutzt.
  // (cast: vite.config läuft in Node, hat aber keine @types/node-Abhängigkeit)
  base: (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.VITE_BASE_PATH ?? '/',
  plugins: [vue(), tailwindcss(), primeIconsWoff2Only()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks
      }
    }
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts']
    }
  }
});
