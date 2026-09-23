import * as v from 'valibot';

/** Forma de `propuesta.json`: textos y datos que solo usa la variante «propuesta». */

const texto = v.pipe(v.string(), v.minLength(1));
const titulo = v.tuple([texto, texto]);
const campo = v.object({ etiqueta: texto, maxCaracteres: v.pipe(v.number(), v.integer(), v.minValue(1)) });

export const esquemaPropuesta = v.object({
  version: v.number(),
  navegacion: v.object({ atras: texto, inicio: texto }),
  capsula: v.object({ puedeContener: texto }),
  exportacion: v.object({
    hecha: v.pipe(v.string(), v.includes('{n}')),
    destinoEjecutable: texto,
    destinoNavegador: texto,
    fallo: texto,
    falloDetalle: texto,
  }),
  leads: v.object({
    titulo,
    campos: v.object({ nombre: campo, correo: campo, empresa: campo }),
    omitir: texto,
    consentimiento: texto,
    tecladoCorreo: v.object({ filas: v.pipe(v.array(v.pipe(v.array(texto), v.minLength(1))), v.minLength(1)) }),
    dominios: v.pipe(v.array(v.pipe(v.string(), v.regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'dominio en minúsculas, sin «@»'))), v.minLength(1)),
    terminaciones: v.pipe(v.array(v.pipe(v.string(), v.regex(/^(\.[a-z]{2,})+$/, 'terminación como «.com» o «.com.mx»'))), v.minLength(1)),
    maxSugerencias: v.pipe(v.number(), v.integer(), v.minValue(1)),
  }),
});

export type TextosPropuesta = v.InferOutput<typeof esquemaPropuesta>;
