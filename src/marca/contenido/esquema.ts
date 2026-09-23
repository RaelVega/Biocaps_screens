import * as v from 'valibot';

/** Forma de `contenido/contenido.json`. Los campos que empiezan con «_» son notas para humanos y se ignoran. */

const texto = v.pipe(v.string(), v.minLength(1));
const titulo = v.tuple([texto, texto]);
const id = v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/, 'id en minúsculas, números y guiones'));

const color = v.pipe(v.string(), v.hexColor());

/** Dónde y cómo se dibuja el nombre sobre una imagen (en píxeles de esa imagen). */
const rotulado = v.object({
  caja: v.tuple([v.number(), v.number(), v.pipe(v.number(), v.minValue(1)), v.pipe(v.number(), v.minValue(1))]),
  rotacion: v.picklist([0, -90, 90]),
  fuente: texto,
  peso: v.pipe(v.number(), v.minValue(100), v.maxValue(900)),
  italica: v.boolean(),
  color,
  alineacion: v.picklist(['izquierda', 'centro', 'derecha']),
  maxLineas: v.pipe(v.number(), v.integer(), v.minValue(1)),
  cuerpoInicial: v.pipe(v.number(), v.minValue(1)),
  cuerpoMinimo: v.pipe(v.number(), v.minValue(1)),
  interlineado: v.pipe(v.number(), v.minValue(0.5)),
});

export type Rotulado = v.InferOutput<typeof rotulado>;

export const esquemaContenido = v.object({
  version: v.number(),
  marco: v.object({
    pie: texto,
    botonSiguiente: texto,
    botonFinalizar: texto,
    logo: id,
    aviso: v.object({ titulo: texto, texto }),
    error: v.object({ titulo: texto, texto }),
  }),
  pantallas: v.object({
    ingrediente: v.object({ titulo }),
    suplemento: v.object({ titulo }),
    capsula: v.object({ titulo }),
    cantidad: v.object({ titulo }),
    etiqueta: v.object({ titulo }),
    nombre: v.object({
      titulo,
      teclado: v.object({ filas: v.pipe(v.array(v.pipe(v.array(texto), v.minLength(1))), v.minLength(1)), borrar: texto, espacio: texto }),
    }),
    color: v.object({ titulo }),
    fabricacion: v.object({ texto }),
    terminado: v.object({ titulo }),
    qr: v.object({ escanea: texto, catalogo: titulo, logo: id, fondo: id, codigo: id, url: v.nullable(v.pipe(v.string(), v.url())) }),
  }),
  categorias: v.pipe(v.array(v.object({ id, nombre: texto })), v.minLength(1)),
  suplementos: v.pipe(v.array(v.object({ id, categoria: id, nombre: texto })), v.minLength(1)),
  formas: v.pipe(v.array(v.object({ id, nombre: texto, tamanos: texto, imagen: id })), v.minLength(1)),
  formaPorSuplemento: v.record(id, v.array(id)),
  presentaciones: v.pipe(v.array(v.object({ id: v.string(), rotulo: texto, nombre: texto, imagen: id })), v.minLength(1)),
  /**
   * `rotuladoPlano.caja`: px de la etiqueta plana (PAG 07).
   * `rotuladoFrasco.caja`: px del frasco terminado (PAG 10), con caja[0] = desplazamiento del centro
   * de la caja respecto al centro del frasco (los 6 colores de un estilo no miden lo mismo de ancho).
   */
  estilos: v.pipe(v.array(v.object({ id, nombre: texto, etiquetaPlana: id, rotuladoPlano: rotulado, rotuladoFrasco: rotulado })), v.minLength(1)),
  colores: v.pipe(v.array(v.object({ id, nombre: texto, imagen: id })), v.minLength(1)),
  frascoFinal: v.pipe(v.string(), v.includes('{estilo}'), v.includes('{color}')),
  nombreProducto: v.object({ maxCaracteres: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))) }),
});

export type ContenidoBiocaps = v.InferOutput<typeof esquemaContenido>;

const rectangulo = v.object({ x: v.number(), y: v.number(), ancho: v.number(), alto: v.number() });

export const esquemaManifiesto = v.object({
  version: v.number(),
  imagenes: v.record(
    v.string(),
    v.object({ archivo: v.string(), ancho: v.number(), alto: v.number(), cuerpo: v.optional(rectangulo) }),
  ),
  videos: v.record(v.string(), v.object({ archivo: v.string() })),
  fuentes: v.record(v.string(), v.object({ archivo: v.string(), familia: v.string() })),
});

export type Manifiesto = v.InferOutput<typeof esquemaManifiesto>;
export type ImagenManifiesto = Manifiesto['imagenes'][string];

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
  imagen(contenido.pantallas.qr.codigo, 'pantallas.qr.codigo');
  for (const f of contenido.formas) imagen(f.imagen, `forma ${f.id}`);
  for (const p of contenido.presentaciones) imagen(p.imagen, `presentación ${p.id}`);
  for (const e of contenido.estilos) imagen(e.etiquetaPlana, `estilo ${e.id}`);
  for (const c of contenido.colores) imagen(c.imagen, `color ${c.id}`);
  // Las tarjetas se colocan por su cuerpo: sin él no se pueden alinear con el PDF.
  for (const idImagen of [...contenido.formas.map((f) => f.imagen), ...contenido.presentaciones.map((p) => p.imagen), ...contenido.colores.map((c) => c.imagen)]) {
    if (manifiesto.imagenes[idImagen] && !manifiesto.imagenes[idImagen].cuerpo) problemas.push(`la imagen «${idImagen}» no tiene cuerpo medido (medirCuerpo en la ingesta)`);
  }
  for (const e of contenido.estilos) {
    const plano = manifiesto.imagenes[e.etiquetaPlana];
    const [x, y, w, h] = e.rotuladoPlano.caja;
    if (plano && (x < 0 || y < 0 || x + w > plano.ancho || y + h > plano.alto)) problemas.push(`la caja del nombre del estilo ${e.id} se sale de su etiqueta plana`);
    for (const r of [e.rotuladoPlano, e.rotuladoFrasco]) {
      if (r.cuerpoMinimo > r.cuerpoInicial) problemas.push(`el estilo ${e.id} tiene cuerpoMinimo mayor que cuerpoInicial`);
    }
    // La caja del frasco tiene que caber en el más angosto de sus 6 colores.
    const [dx, yf, wf, hf] = e.rotuladoFrasco.caja;
    for (const c of contenido.colores) {
      const frasco = manifiesto.imagenes[contenido.frascoFinal.replace('{estilo}', e.id).replace('{color}', c.id)];
      if (frasco && (Math.abs(dx) + wf / 2 > frasco.ancho / 2 || yf < 0 || yf + hf > frasco.alto)) {
        problemas.push(`la caja del nombre del estilo ${e.id} se sale del frasco ${c.id}`);
      }
    }
  }
  for (const e of contenido.estilos) {
    for (const c of contenido.colores) {
      imagen(contenido.frascoFinal.replace('{estilo}', e.id).replace('{color}', c.id), `frasco final ${e.id} ${c.id}`);
    }
  }
  return problemas;
}
