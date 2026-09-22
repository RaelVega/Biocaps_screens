import * as v from 'valibot';

/** Forma de `contenido/contenido.json`. Los campos que empiezan con «_» son notas para humanos y se ignoran. */

const texto = v.pipe(v.string(), v.minLength(1));
const titulo = v.tuple([texto, texto]);
const id = v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/, 'id en minúsculas, números y guiones'));

export const esquemaContenido = v.object({
  version: v.number(),
  marco: v.object({ pie: texto, botonSiguiente: texto, botonFinalizar: texto, logo: id }),
  pantallas: v.object({
    ingrediente: v.object({ titulo }),
    suplemento: v.object({ titulo }),
    capsula: v.object({ titulo }),
    cantidad: v.object({ titulo }),
    etiqueta: v.object({ titulo }),
    nombre: v.object({ titulo }),
    color: v.object({ titulo }),
    fabricacion: v.object({ texto }),
    terminado: v.object({ titulo }),
    qr: v.object({ escanea: texto, catalogo: titulo, logo: id, fondo: id, url: v.nullable(v.pipe(v.string(), v.url())) }),
  }),
  categorias: v.pipe(v.array(v.object({ id, nombre: texto })), v.minLength(1)),
  suplementos: v.pipe(v.array(v.object({ id, categoria: id, nombre: texto })), v.minLength(1)),
  formas: v.pipe(v.array(v.object({ id, nombre: texto, tamanos: texto, imagen: id })), v.minLength(1)),
  formaPorSuplemento: v.record(id, v.array(id)),
  presentaciones: v.pipe(v.array(v.object({ id: v.string(), rotulo: texto, nombre: texto, imagen: id })), v.minLength(1)),
  estilos: v.pipe(v.array(v.object({ id, nombre: texto, etiquetaPlana: id })), v.minLength(1)),
  colores: v.pipe(v.array(v.object({ id, nombre: texto, imagen: id })), v.minLength(1)),
  frascoFinal: v.pipe(v.string(), v.includes('{estilo}'), v.includes('{color}')),
  nombreProducto: v.object({ maxCaracteres: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))) }),
});

export type ContenidoBiocaps = v.InferOutput<typeof esquemaContenido>;

export const esquemaManifiesto = v.object({
  version: v.number(),
  imagenes: v.record(v.string(), v.object({ archivo: v.string(), ancho: v.number(), alto: v.number() })),
  videos: v.record(v.string(), v.object({ archivo: v.string() })),
  fuentes: v.record(v.string(), v.object({ archivo: v.string(), familia: v.string() })),
});

export type Manifiesto = v.InferOutput<typeof esquemaManifiesto>;

/**
 * Coherencia entre archivos, que el esquema solo no puede ver: ids repetidos,
 * referencias a categorías o formas que no existen, imágenes que no están en
 * el manifiesto. Devuelve la lista de problemas (vacía si todo cuadra).
 */
export function validarReferencias(contenido: ContenidoBiocaps, manifiesto: Manifiesto): string[] {
  const problemas: string[] = [];
  const repetidos = (lista: { id: string }[], que: string): void => {
    const vistos = new Set<string>();
    for (const { id: valor } of lista) {
      if (vistos.has(valor)) problemas.push(`${que} repetido: ${valor}`);
      vistos.add(valor);
    }
  };
  repetidos(contenido.categorias, 'categoría');
  repetidos(contenido.suplementos, 'suplemento');
  repetidos(contenido.formas, 'forma');
  repetidos(contenido.presentaciones, 'presentación');
  repetidos(contenido.estilos, 'estilo');
  repetidos(contenido.colores, 'color');

  const categorias = new Set(contenido.categorias.map((c) => c.id));
  const formas = new Set(contenido.formas.map((f) => f.id));
  const suplementos = new Set(contenido.suplementos.map((s) => s.id));

  for (const s of contenido.suplementos) {
    if (!categorias.has(s.categoria)) problemas.push(`el suplemento ${s.id} apunta a la categoría inexistente ${s.categoria}`);
  }
  for (const c of contenido.categorias) {
    if (!contenido.suplementos.some((s) => s.categoria === c.id)) problemas.push(`la categoría ${c.id} no tiene suplementos`);
  }
  for (const [suplemento, lista] of Object.entries(contenido.formaPorSuplemento)) {
    if (!suplementos.has(suplemento)) problemas.push(`formaPorSuplemento nombra un suplemento inexistente: ${suplemento}`);
    for (const forma of lista) if (!formas.has(forma)) problemas.push(`el suplemento ${suplemento} apunta a la forma inexistente ${forma}`);
  }

  const imagen = (idImagen: string, donde: string): void => {
    if (!manifiesto.imagenes[idImagen]) problemas.push(`${donde}: la imagen «${idImagen}» no está en el manifiesto`);
  };
  imagen(contenido.marco.logo, 'marco.logo');
  imagen(contenido.pantallas.qr.logo, 'pantallas.qr.logo');
  imagen(contenido.pantallas.qr.fondo, 'pantallas.qr.fondo');
  for (const f of contenido.formas) imagen(f.imagen, `forma ${f.id}`);
  for (const p of contenido.presentaciones) imagen(p.imagen, `presentación ${p.id}`);
  for (const e of contenido.estilos) imagen(e.etiquetaPlana, `estilo ${e.id}`);
  for (const c of contenido.colores) imagen(c.imagen, `color ${c.id}`);
  for (const e of contenido.estilos) {
    for (const c of contenido.colores) {
      imagen(contenido.frascoFinal.replace('{estilo}', e.id).replace('{color}', c.id), `frasco final ${e.id} ${c.id}`);
    }
  }
  return problemas;
}
