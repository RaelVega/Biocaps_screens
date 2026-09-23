import { useStore } from 'zustand';
import { useRecursos, type Recursos } from '../marca/estado';
import type { Manifiesto } from '../marca/contenido/esquema';
import type { AlmacenFlujo } from '../motor/maquina/almacen';
import type { EstadoFlujo } from '../motor/maquina/maquina';
import type { CatalogoPropuesta } from './contenido/catalogo';
import type { TextosPropuesta } from './contenido/esquema';
import type { PasoPropuesta, SesionPropuesta } from './flujo';

export interface RecursosPropuesta {
  almacen: AlmacenFlujo<PasoPropuesta, SesionPropuesta>;
  catalogo: CatalogoPropuesta;
  manifiesto: Manifiesto;
  textos: TextosPropuesta;
}

/**
 * La propuesta reutiliza las pantallas del PDF, que leen los recursos con los
 * tipos de `marca/`. Es seguro: la sesión de la propuesta amplía la del PDF,
 * el catálogo amplía el del PDF y esas pantallas solo despachan eventos del
 * motor. Este es el único punto donde se cruzan los tipos.
 */
export function comoRecursosDeMarca(recursos: RecursosPropuesta): Recursos {
  return recursos as unknown as Recursos;
}

export function useRecursosPropuesta(): RecursosPropuesta {
  return useRecursos() as unknown as RecursosPropuesta;
}

/** Lee del flujo de la propuesta. El selector debe devolver un valor estable (primitivo o parte del estado). */
export function useFlujoPropuesta<T>(selector: (flujo: EstadoFlujo<PasoPropuesta, SesionPropuesta>) => T): T {
  const { almacen } = useRecursosPropuesta();
  return useStore(almacen, (estado) => selector(estado.flujo));
}

export function useTextosPropuesta(): TextosPropuesta {
  return useRecursosPropuesta().textos;
}
