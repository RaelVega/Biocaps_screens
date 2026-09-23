/// <reference types="vitest/config" />
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const RAIZ = import.meta.dirname;
const { version } = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf8')) as { version: string };

/**
 * Variantes de la experiencia (ver «Propuesta de Rael» en CLAUDE.md). Se elige
 * al construir con `--mode propuesta` o `VITE_VARIANTE=propuesta`: la build de
 * una variante no lleva ni una línea de la otra.
 */
const VARIANTES = {
  pdf: { app: 'src/marca/App.tsx', puertoDev: 5173, puertoPreview: 4173, sustituye: {} },
  propuesta: {
    app: 'src/propuesta/App.tsx',
    puertoDev: 5174,
    puertoPreview: 4174,
    // Las pantallas del PDF que la propuesta reutiliza llevan ATRÁS junto a SIGUIENTE sin copiarlas.
    sustituye: { 'src/marca/componentes/BotonPrimario.tsx': 'src/propuesta/componentes/Navegacion.tsx' },
  },
} as const satisfies Record<string, { app: string; puertoDev: number; puertoPreview: number; sustituye: Record<string, string> }>;
type Variante = keyof typeof VARIANTES;

function leerVariante(mode: string): Variante {
  // `VITE_VARIANTE` (p. ej. en Netlify) manda; si no, `--mode propuesta` elige la propuesta.
  const valor = loadEnv(mode, RAIZ, 'VITE_')['VITE_VARIANTE'] ?? (mode in VARIANTES ? mode : 'pdf');
  if (!(valor in VARIANTES)) throw new Error(`VITE_VARIANTE desconocida: «${valor}» (válidas: ${Object.keys(VARIANTES).join(', ')})`);
  return valor as Variante;
}

/** Lo que una variante sustituye o añade encima de `contenido/`. La versión del PDF no superpone nada. */
function dirSuperposicion(variante: Variante): string | null {
  return variante === 'pdf' ? null : resolve(RAIZ, 'variantes', variante, 'contenido');
}

/**
 * `contenido/` vive fuera del bundler para poder sustituir textos e imágenes
 * sin recompilar. Al construir se copia tal cual a `dist/contenido/` y, encima,
 * la superposición de la variante. En desarrollo Vite sirve `contenido/` desde
 * la raíz del proyecto y un middleware antepone la superposición.
 */
function copiarContenido(variante: Variante): Plugin {
  const superposicion = dirSuperposicion(variante);
  const prefijoSuperposicion = superposicion ? `/variantes/${variante}/contenido` : null;
  return {
    name: 'copiar-contenido',
    configureServer(servidor) {
      if (!superposicion || !prefijoSuperposicion) return;
      servidor.middlewares.use((peticion, _respuesta, siguiente) => {
        const [ruta = '', consulta] = (peticion.url ?? '').split('?');
        if (ruta.startsWith('/contenido/')) {
          const relativa = decodeURIComponent(ruta.slice('/contenido'.length));
          if (existsSync(resolve(superposicion, `.${relativa}`))) {
            peticion.url = `${prefijoSuperposicion}${ruta.slice('/contenido'.length)}${consulta === undefined ? '' : `?${consulta}`}`;
          }
        }
        siguiente();
      });
    },
    closeBundle() {
      const origen = resolve(RAIZ, 'contenido');
      const destino = resolve(RAIZ, 'dist/contenido');
      if (existsSync(origen)) cpSync(origen, destino, { recursive: true });
      if (superposicion && existsSync(superposicion)) {
        cpSync(superposicion, destino, { recursive: true, filter: (archivo) => !archivo.endsWith('.gitkeep') });
      }
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

/**
 * Sustituye módulos de `src/marca/` por los de la variante, solo cuando los
 * importa código de `src/marca/`. El módulo sustituto exporta lo mismo con la
 * misma firma (lo comprueba tsc al compilar la variante). La versión del PDF
 * no sustituye nada.
 */
function sustituirModulos(sustituye: Readonly<Record<string, string>>): Plugin {
  const mapa = new Map(Object.entries(sustituye).map(([original, sustituto]) => [resolve(RAIZ, original), resolve(RAIZ, sustituto)]));
  const marca = resolve(RAIZ, 'src/marca');
  return {
    name: 'sustituir-modulos',
    enforce: 'pre',
    async resolveId(fuente, importador, opciones) {
      if (mapa.size === 0 || !importador || relative(marca, importador).startsWith('..')) return null;
      const resuelto = await this.resolve(fuente, importador, { ...opciones, skipSelf: true });
      return (resuelto && mapa.get(resuelto.id)) ?? null;
    },
  };
}

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

export default defineConfig(({ mode }) => {
  const variante = leerVariante(mode);
  const { app, puertoDev, puertoPreview, sustituye } = VARIANTES[variante];
  return {
    plugins: [sustituirModulos(sustituye), react(), copiarContenido(variante), politicaContenido()],
    define: { __VERSION__: JSON.stringify(version), __VARIANTE__: JSON.stringify(variante) },
    // `@variante/App` es la única puerta a la experiencia: apunta a la de la variante elegida.
    resolve: { alias: { '@variante/App': resolve(RAIZ, app) } },
    // Rutas relativas: la misma build funciona en app://, en localhost y en una subruta de Netlify.
    base: './',
    publicDir: false,
    build: { target: 'chrome120', assetsInlineLimit: 0 },
    server: { host: 'localhost', port: puertoDev, strictPort: true },
    preview: { host: 'localhost', port: puertoPreview, strictPort: true },
    test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
  };
});
