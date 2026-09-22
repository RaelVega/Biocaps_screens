import type { ContenidoBiocaps } from './esquema';

/** Consultas de negocio sobre el contenido. Todo lo que decide qué se puede elegir vive aquí. */
export interface Catalogo {
  readonly contenido: ContenidoBiocaps;
  suplementosDe(categoria: string): ContenidoBiocaps['suplementos'];
  /**
   * Formas de cápsula válidas para un suplemento: la forma la decide el
   * suplemento, no el visitante. Si la matriz no tiene dato para ese
   * suplemento (hoy: Multivitamínico A-1 / A-4), se permiten todas para no
   * dejar al visitante sin salida.
   */
  formasValidas(suplemento: string): string[];
  /** Id de manifiesto del frasco terminado para la combinación elegida. */
  frascoFinal(estilo: string, color: string): string;
  existe(que: 'categoria' | 'suplemento' | 'forma' | 'presentacion' | 'estilo' | 'color', valor: string): boolean;
}

export function crearCatalogo(contenido: ContenidoBiocaps): Catalogo {
  const todasLasFormas = contenido.formas.map((f) => f.id);
  const conjuntos = {
    categoria: new Set(contenido.categorias.map((c) => c.id)),
    suplemento: new Set(contenido.suplementos.map((s) => s.id)),
    forma: new Set(todasLasFormas),
    presentacion: new Set(contenido.presentaciones.map((p) => p.id)),
    estilo: new Set(contenido.estilos.map((e) => e.id)),
    color: new Set(contenido.colores.map((c) => c.id)),
  };

  return {
    contenido,
    suplementosDe: (categoria) => contenido.suplementos.filter((s) => s.categoria === categoria),
    formasValidas(suplemento) {
      const definidas = contenido.formaPorSuplemento[suplemento] ?? [];
      return definidas.length > 0 ? [...definidas] : [...todasLasFormas];
    },
    frascoFinal: (estilo, color) => contenido.frascoFinal.replace('{estilo}', estilo).replace('{color}', color),
    existe: (que, valor) => conjuntos[que].has(valor),
  };
}
