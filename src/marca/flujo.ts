import { crearMaquina, type DefinicionFlujo, type Maquina } from '../motor/maquina/maquina';
import type { Catalogo } from './contenido/catalogo';

/** Pasos del flujo del PDF de marketing (PAG 01–11; 6.1–6.5 es `etiquetaDetalle`). */
export type PasoBiocaps =
  | 'portada'
  | 'ingrediente'
  | 'suplemento'
  | 'capsula'
  | 'cantidad'
  | 'etiqueta'
  | 'etiquetaDetalle'
  | 'nombre'
  | 'color'
  | 'fabricacion'
  | 'terminado'
  | 'qr';

export interface SesionBiocaps {
  readonly categoria: string | null;
  readonly suplemento: string | null;
  readonly capsula: string | null;
  readonly cantidad: string | null;
  readonly estilo: string | null;
  readonly nombre: string;
  readonly color: string | null;
}

export const SESION_INICIAL: SesionBiocaps = Object.freeze({
  categoria: null,
  suplemento: null,
  capsula: null,
  cantidad: null,
  estilo: null,
  nombre: '',
  color: null,
});

/** Tope de seguridad cuando el contenido aún no fija `nombreProducto.maxCaracteres`. */
const TOPE_NOMBRE = 40;
/** Lo que puede escribir el teclado propio de PAG 07: mayúsculas, acentos, Ñ, números y poca puntuación. */
const CARACTERES_NOMBRE = /^[A-ZÁÉÍÓÚÜÑ0-9 &.'-]*$/;

/** Normaliza lo escrito: mayúsculas en español, sin espacios al inicio ni espacios dobles. */
export function normalizarNombre(texto: string): string {
  return texto.toLocaleUpperCase('es-MX').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
}

export function crearFlujoBiocaps(catalogo: Catalogo): DefinicionFlujo<PasoBiocaps, SesionBiocaps> {
  const maxNombre = catalogo.contenido.nombreProducto.maxCaracteres ?? TOPE_NOMBRE;

  return {
    orden: ['portada', 'ingrediente', 'suplemento', 'capsula', 'cantidad', 'etiqueta', 'etiquetaDetalle', 'nombre', 'color', 'fabricacion', 'terminado', 'qr'],
    sesionInicial: SESION_INICIAL,
    pasos: {
      portada: { tipo: 'portada' },

      ingrediente: {
        tipo: 'eleccion',
        // Cambiar de categoría invalida lo que dependía de ella.
        elegir: (s, valor) => (catalogo.existe('categoria', valor) ? { ...s, categoria: valor, suplemento: null, capsula: null } : null),
        puedeAvanzar: (s) => s.categoria !== null,
      },

      suplemento: {
        tipo: 'eleccion',
        elegir: (s, valor) => {
          if (!catalogo.suplementosDe(s.categoria ?? '').some((sup) => sup.id === valor)) return null;
          // La forma la decide el suplemento: si hay una sola válida, queda elegida.
          const formas = catalogo.formasValidas(valor);
          return { ...s, suplemento: valor, capsula: formas.length === 1 ? (formas[0] ?? null) : null };
        },
        puedeAvanzar: (s) => s.suplemento !== null,
      },

      capsula: {
        tipo: 'eleccion',
        elegir: (s, valor) => (s.suplemento !== null && catalogo.formasValidas(s.suplemento).includes(valor) ? { ...s, capsula: valor } : null),
        puedeAvanzar: (s) => s.capsula !== null,
      },

      cantidad: {
        tipo: 'eleccion',
        elegir: (s, valor) => (catalogo.existe('presentacion', valor) ? { ...s, cantidad: valor } : null),
        puedeAvanzar: (s) => s.cantidad !== null,
      },

      etiqueta: {
        tipo: 'eleccion',
        elegir: (s, valor) => (catalogo.existe('estilo', valor) ? { ...s, estilo: valor } : null),
        puedeAvanzar: (s) => s.estilo !== null,
      },

      etiquetaDetalle: { tipo: 'informativo' },

      nombre: {
        tipo: 'texto',
        escribir: (s, texto) => {
          const nombre = normalizarNombre(texto);
          if (nombre.length > maxNombre || !CARACTERES_NOMBRE.test(nombre)) return null;
          return { ...s, nombre };
        },
        puedeAvanzar: (s) => s.nombre.trim().length > 0,
      },

      color: {
        tipo: 'eleccion',
        elegir: (s, valor) => (catalogo.existe('color', valor) ? { ...s, color: valor } : null),
        puedeAvanzar: (s) => s.color !== null,
      },

      fabricacion: { tipo: 'automatico' },
      terminado: { tipo: 'informativo' },
      qr: { tipo: 'cierre' },
    },
  };
}

export function crearMaquinaBiocaps(catalogo: Catalogo): Maquina<PasoBiocaps, SesionBiocaps> {
  return crearMaquina(crearFlujoBiocaps(catalogo));
}
