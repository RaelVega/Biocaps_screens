/// <reference types="vitest/config" />
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const RAIZ = import.meta.dirname;
const { version } = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf8')) as { version: string };

/**
 * `contenido/` vive fuera del bundler para poder sustituir textos e imágenes
 * sin recompilar. En desarrollo Vite ya la sirve desde la raíz del proyecto;
 * al construir se copia tal cual a `dist/contenido/`.
 */
function copiarContenido(): Plugin {
  return {
    name: 'copiar-contenido',
    apply: 'build',
    closeBundle() {
      const origen = resolve(RAIZ, 'contenido');
      if (existsSync(origen)) cpSync(origen, resolve(RAIZ, 'dist/contenido'), { recursive: true });
      cpSync(resolve(RAIZ, 'cascaras/web/_headers'), resolve(RAIZ, 'dist/_headers'));
    },
  };
}

/** Todo local: ninguna vía puede cargar nada de fuera. Los estilos en línea son de Motion. */
const POLITICA_CONTENIDO = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

/** La CSP solo se inyecta en la build: el servidor de desarrollo necesita scripts en línea. */
function politicaContenido(): Plugin {
  return {
    name: 'politica-contenido',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: POLITICA_CONTENIDO }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig({
  plugins: [react(), copiarContenido(), politicaContenido()],
  define: { __VERSION__: JSON.stringify(version) },
  // Rutas relativas: la misma build funciona en app://, en localhost y en una subruta de Netlify.
  base: './',
  publicDir: false,
  build: { target: 'chrome120', assetsInlineLimit: 0 },
  server: { host: 'localhost', port: 5173, strictPort: true },
  preview: { host: 'localhost', port: 4173, strictPort: true },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
