import { crearFlujoBiocaps, SESION_INICIAL, type PasoBiocaps, type SesionBiocaps } from '../marca/flujo';
import { crearMaquina, type DefinicionFlujo, type Maquina, type ReglasPaso } from '../motor/maquina/maquina';
import type { CatalogoPropuesta } from './contenido/catalogo';
import type { TextosPropuesta } from './contenido/esquema';
import { caracteresValidos, leadCompleto, normalizarCampo, type CampoLead } from './leads/campos';

/** Los pasos del PDF más la pantalla de leads. */
export type PasoPropuesta = PasoBiocaps | 'leads';

export interface LeadSesion {
  readonly nombre: string;
  readonly correo: string;
  readonly empresa: string;
  /** El visitante tocó OMITIR: se avanza sin datos. */
  readonly omitido: boolean;
}

export interface SesionPropuesta extends SesionBiocaps {
  readonly lead: LeadSesion;
}

const LEAD_VACIO: LeadSesion = Object.freeze({ nombre: '', correo: '', empresa: '', omitido: false });

export const SESION_INICIAL_PROPUESTA: SesionPropuesta = Object.freeze({ ...SESION_INICIAL, lead: LEAD_VACIO });

/** Valor de `elegir` que usa el botón OMITIR de la pantalla de leads. */
export const OMITIR_LEAD = 'omitir';

/**
 * Orden de la propuesta: la cápsula va primero y filtra ingrediente y
 * suplemento; los leads van tras el color, justo antes de la fabricación.
 */
export const ORDEN_PROPUESTA: readonly PasoPropuesta[] = [
  'portada',
  'capsula',
  'ingrediente',
  'suplemento',
  'cantidad',
  'etiqueta',
  'etiquetaDetalle',
  'nombre',
  'color',
  'leads',
  'fabricacion',
  'terminado',
  'qr',
];

/** Reutiliza una regla del flujo del PDF conservando los campos propios de la sesión de la propuesta. */
function heredar(reglas: ReglasPaso<SesionBiocaps>): ReglasPaso<SesionPropuesta> {
  const { elegir, escribir, puedeAvanzar } = reglas;
  return {
    tipo: reglas.tipo,
    ...(elegir && {
      elegir: (s: SesionPropuesta, valor: string) => {
        const nueva = elegir(s, valor);
        return nueva && { ...s, ...nueva };
      },
    }),
    ...(escribir && {
      escribir: (s: SesionPropuesta, texto: string, campo?: string) => {
        const nueva = escribir(s, texto, campo);
        return nueva && { ...s, ...nueva };
      },
    }),
    ...(puedeAvanzar && { puedeAvanzar }),
  };
}

export function crearFlujoPropuesta(catalogo: CatalogoPropuesta, textos: TextosPropuesta): DefinicionFlujo<PasoPropuesta, SesionPropuesta> {
  const pdf = crearFlujoBiocaps(catalogo).pasos;
  const { campos } = textos.leads;
  /** La única categoría de una forma (redonda → Marinos, twist-off → Faciales), o null si hay varias. */
  const categoriaUnica = (forma: string | null): string | null => {
    const categorias = catalogo.categoriasPorForma(forma ?? '');
    return categorias.length === 1 ? (categorias[0]?.id ?? null) : null;
  };

  return {
    orden: ORDEN_PROPUESTA,
    sesionInicial: SESION_INICIAL_PROPUESTA,
    pasos: {
      portada: { tipo: 'portada' },

      capsula: {
        tipo: 'eleccion',
        elegir: (s, valor) => {
          if (!catalogo.existe('forma', valor) || catalogo.suplementosPorForma(valor).length === 0) return null;
          if (valor === s.capsula) return s;
          // Cambiar de cápsula invalida lo que ya no cabe en ella; con una sola categoría, esa queda elegida.
          const unica = categoriaUnica(valor);
          const categoria = unica ?? (catalogo.categoriasPorForma(valor).some((c) => c.id === s.categoria) ? s.categoria : null);
          const suplemento = catalogo.suplementosDeCategoriaYForma(categoria ?? '', valor).some((sup) => sup.id === s.suplemento) ? s.suplemento : null;
          return { ...s, capsula: valor, categoria, suplemento };
        },
        puedeAvanzar: (s) => s.capsula !== null,
      },

      ingrediente: {
        tipo: 'eleccion',
        elegir: (s, valor) => {
          if (!catalogo.categoriasPorForma(s.capsula ?? '').some((c) => c.id === valor)) return null;
          return valor === s.categoria ? s : { ...s, categoria: valor, suplemento: null };
        },
        puedeAvanzar: (s) => s.categoria !== null,
        omitir: (s) => categoriaUnica(s.capsula) !== null,
      },

      suplemento: {
        tipo: 'eleccion',
        elegir: (s, valor) => (catalogo.suplementosDeCategoriaYForma(s.categoria ?? '', s.capsula ?? '').some((sup) => sup.id === valor) ? { ...s, suplemento: valor } : null),
        puedeAvanzar: (s) => s.suplemento !== null,
      },

      cantidad: heredar(pdf.cantidad),
      etiqueta: heredar(pdf.etiqueta),
      etiquetaDetalle: heredar(pdf.etiquetaDetalle),
      nombre: heredar(pdf.nombre),
      color: heredar(pdf.color),

      leads: {
        tipo: 'texto',
        escribir: (s, texto, campo) => {
          if (campo !== 'nombre' && campo !== 'correo' && campo !== 'empresa') return null;
          const valor = normalizarCampo(campo, texto);
          if (valor.length > campos[campo].maxCaracteres || !caracteresValidos(campo, valor)) return null;
          return { ...s, lead: { ...s.lead, [campo satisfies CampoLead]: valor, omitido: false } };
        },
        // OMITIR borra lo escrito: el visitante decidió no dejar datos.
        elegir: (s, valor) => (valor === OMITIR_LEAD ? { ...s, lead: { ...LEAD_VACIO, omitido: true } } : null),
        puedeAvanzar: (s) => s.lead.omitido || leadCompleto(s.lead),
      },

      fabricacion: heredar(pdf.fabricacion),
      terminado: heredar(pdf.terminado),
      qr: heredar(pdf.qr),
    },
  };
}

export function crearMaquinaPropuesta(catalogo: CatalogoPropuesta, textos: TextosPropuesta): Maquina<PasoPropuesta, SesionPropuesta> {
  return crearMaquina(crearFlujoPropuesta(catalogo, textos));
}
