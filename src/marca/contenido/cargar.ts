import { cargarJson, ErrorContenido } from '../../motor/contenido/cargar';
import { crearCatalogo, type Catalogo } from './catalogo';
import { esquemaContenido, esquemaManifiesto, validarReferencias, type Manifiesto } from './esquema';

export interface ContenidoCargado {
  catalogo: Catalogo;
  manifiesto: Manifiesto;
}

/** Lee y valida `contenido.json` y `manifiesto.json`. Cualquier incoherencia sale como error legible, nunca como pantalla en blanco. */
export async function cargarContenidoBiocaps(): Promise<ContenidoCargado> {
  const [contenido, manifiesto] = await Promise.all([cargarJson('contenido.json', esquemaContenido), cargarJson('manifiesto.json', esquemaManifiesto)]);
  const problemas = validarReferencias(contenido, manifiesto);
  if (problemas.length > 0) {
    throw new ErrorContenido(`El contenido no cuadra (${problemas.length}): ${problemas.slice(0, 5).join('; ')}`);
  }
  return { catalogo: crearCatalogo(contenido), manifiesto };
}
