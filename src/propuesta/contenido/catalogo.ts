import type { Catalogo } from '../../marca/contenido/catalogo';
import type { ContenidoBiocaps } from '../../marca/contenido/esquema';

type Suplemento = ContenidoBiocaps['suplementos'][number];
type Categoria = ContenidoBiocaps['categorias'][number];

/**
 * En la propuesta la cápsula se elige primero y decide lo demás. Todo sale de
 * la misma matriz `formaPorSuplemento` del PDF, leída al revés: qué
 * suplementos caben en cada forma. Un suplemento sin forma en la matriz (hoy:
 * Multivitamínico A-1 / A-4) no aparece bajo ninguna cápsula: no se inventa.
 */
export interface CatalogoPropuesta extends Catalogo {
  suplementosPorForma(forma: string): Suplemento[];
  /** Categorías con al menos un suplemento de esa forma, en el orden del contenido. */
  categoriasPorForma(forma: string): Categoria[];
  suplementosDeCategoriaYForma(categoria: string, forma: string): Suplemento[];
}

export function crearCatalogoPropuesta(base: Catalogo): CatalogoPropuesta {
  const { contenido } = base;
  const admite = (suplemento: Suplemento, forma: string): boolean => (contenido.formaPorSuplemento[suplemento.id] ?? []).includes(forma);

  return {
    ...base,
    suplementosPorForma: (forma) => contenido.suplementos.filter((s) => admite(s, forma)),
    categoriasPorForma: (forma) => contenido.categorias.filter((c) => contenido.suplementos.some((s) => s.categoria === c.id && admite(s, forma))),
    suplementosDeCategoriaYForma: (categoria, forma) => contenido.suplementos.filter((s) => s.categoria === categoria && admite(s, forma)),
  };
}
