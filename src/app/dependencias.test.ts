import { describe, expect, it } from 'vitest';

/**
 * Reglas de dependencia entre carpetas (CLAUDE.md): el motor no conoce ninguna
 * marca y la versión del PDF no depende de la propuesta. Así la propuesta
 * puede cambiar cualquier cosa sin tocar la versión aprobada.
 */
const FUENTES = {
  motor: import.meta.glob<string>('../motor/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  marca: import.meta.glob<string>('../marca/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
};
const IMPORTACION = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

/** Carpeta de `src/` (o alias) a la que apunta cada importación de los archivos de `origen`. */
function destinos(origen: keyof typeof FUENTES): { archivo: string; destino: string }[] {
  return Object.entries(FUENTES[origen]).flatMap(([archivo, codigo]) =>
    [...codigo.matchAll(IMPORTACION)].map(([, ruta = '']) => {
      if (!ruta.startsWith('.')) return { archivo, destino: ruta };
      // `archivo` es relativo a src/app/: se resuelve contra una base ficticia y se toma la carpeta de src/.
      const absoluta = new URL(ruta, new URL(archivo, 'http://x/src/app/')).pathname;
      return { archivo, destino: absoluta.split('/')[2] ?? '' };
    }),
  );
}

describe('dependencias entre carpetas', () => {
  it('lee los archivos de las dos carpetas', () => {
    expect(Object.keys(FUENTES.motor).length).toBeGreaterThan(10);
    expect(Object.keys(FUENTES.marca).length).toBeGreaterThan(10);
    expect(destinos('marca').some(({ destino }) => destino === 'motor')).toBe(true);
  });

  it('src/motor no importa de ninguna marca ni de la propuesta', () => {
    const prohibidas = destinos('motor').filter(({ destino }) => ['marca', 'propuesta', '@variante'].some((d) => destino.startsWith(d)));
    expect(prohibidas).toEqual([]);
  });

  it('src/marca (versión del PDF) no importa de la propuesta', () => {
    const prohibidas = destinos('marca').filter(({ destino }) => destino.startsWith('propuesta') || destino.startsWith('@variante'));
    expect(prohibidas).toEqual([]);
  });
});
