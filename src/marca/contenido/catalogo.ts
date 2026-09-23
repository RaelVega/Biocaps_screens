import type { ContenidoBiocaps } from './esquema';

/** Consultas de negocio sobre el contenido. Todo lo que decide qué se puede elegir vive aquí. */
export interface Catalogo {
  readonly contenido: ContenidoBiocaps;
  /**
   * Suplementos que el visitante puede elegir en una categoría. Los que no
   * tienen forma en la matriz (hoy: Multivitamínico A-1 / A-4) no se muestran
   * hasta que llegue el dato (decisión de Rael, 23-09): así PAG 04 siempre
   * llega con una sola cápsula. Cuando el dato esté en contenido.json, vuelven solos.
   */
  suplementosDe(categoria: string): ContenidoBiocaps['suplementos'];
  /** Formas de cápsula válidas para un suplemento: la forma la decide el suplemento, no el visitante. */
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
    suplementosDe: (categoria) => contenido.suplementos.filter((s) => s.categoria === categoria && (contenido.formaPorSuplemento[s.id] ?? []).length > 0),
    formasValidas: (suplemento) => [...(contenido.formaPorSuplemento[suplemento] ?? [])],
    frascoFinal: (estilo, color) => contenido.frascoFinal.replace('{estilo}', estilo).replace('{color}', color),
    existe: (que, valor) => conjuntos[que].has(valor),
  };
}
