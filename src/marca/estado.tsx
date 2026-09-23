import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { urlContenido } from '../motor/contenido/cargar';
import type { AlmacenFlujo } from '../motor/maquina/almacen';
import type { EstadoFlujo, EventoFlujo } from '../motor/maquina/maquina';
import type { Catalogo } from './contenido/catalogo';
import type { ImagenManifiesto, Manifiesto } from './contenido/esquema';
import type { PasoBiocaps, SesionBiocaps } from './flujo';

export interface Recursos {
  almacen: AlmacenFlujo<PasoBiocaps, SesionBiocaps>;
  catalogo: Catalogo;
  manifiesto: Manifiesto;
}

const ContextoRecursos = createContext<Recursos | null>(null);

export function ProveedorRecursos({ recursos, children }: { recursos: Recursos; children: ReactNode }): ReactNode {
  return <ContextoRecursos.Provider value={recursos}>{children}</ContextoRecursos.Provider>;
}

export function useRecursos(): Recursos {
  const recursos = useContext(ContextoRecursos);
  if (!recursos) throw new Error('useRecursos fuera de ProveedorRecursos');
  return recursos;
}

/** Lee del flujo. El selector debe devolver un valor estable (primitivo o parte del estado), nunca un objeto nuevo. */
export function useFlujo<T>(selector: (flujo: EstadoFlujo<PasoBiocaps, SesionBiocaps>) => T): T {
  const { almacen } = useRecursos();
  return useStore(almacen, (estado) => selector(estado.flujo));
}

export function useDespachar(): (evento: EventoFlujo) => void {
  const { almacen } = useRecursos();
  return useStore(almacen, (estado) => estado.despachar);
}

export function useContenido(): Catalogo['contenido'] {
  return useRecursos().catalogo.contenido;
}

export interface ImagenResuelta extends ImagenManifiesto {
  url: string;
}

/** Imagen del manifiesto con su URL resuelta. Lanza si no existe: el contenido ya se validó al arrancar. */
export function useImagen(id: string): ImagenResuelta {
  const imagen = useRecursos().manifiesto.imagenes[id];
  if (!imagen) throw new Error(`La imagen «${id}» no está en el manifiesto`);
  return { ...imagen, url: urlContenido(imagen.archivo) };
}
