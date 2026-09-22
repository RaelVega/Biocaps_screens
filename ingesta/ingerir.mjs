// Ingesta: del espejo de Drive (assets-fuente/, nunca se renombra) a contenido/.
// Lee ingesta/equivalencias.json, genera los WebP al tamaño de pantalla,
// reescribe contenido/manifiesto.json y deja los mockups de referencia en
// pruebas/visual/referencias/. contenido/img/ es propiedad de este script:
// se vacía en cada corrida.
//
// Uso: npm run ingesta   (ORIGEN_ASSETS=/otra/ruta para usar otro espejo)
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIGEN = path.resolve(RAIZ, process.env.ORIGEN_ASSETS ?? 'assets-fuente');
const DIR_IMG = path.join(RAIZ, 'contenido/img');
const DIR_REFERENCIAS = path.join(RAIZ, 'pruebas/visual/referencias');
const WEBP = { quality: 90, alphaQuality: 100, effort: 6 };

const equivalencias = JSON.parse(readFileSync(path.join(RAIZ, 'ingesta/equivalencias.json'), 'utf8'));

/**
 * macOS guarda los acentos descompuestos (NFD) y el JSON los trae compuestos
 * (NFC): se compara cada tramo de la ruta normalizado, nunca la cadena tal cual.
 */
function resolverRuta(relativa) {
  let actual = ORIGEN;
  for (const tramo of relativa.split('/')) {
    const buscado = tramo.normalize('NFC');
    const hallado = readdirSync(actual).find((nombre) => nombre.normalize('NFC') === buscado);
    if (!hallado) {
      const parecidos = readdirSync(actual)
        .filter((nombre) => nombre.normalize('NFC').toLowerCase().includes(buscado.slice(0, 6).toLowerCase()))
        .slice(0, 5);
      throw new Error(`No existe «${relativa}» en ${ORIGEN} (falla en «${tramo}»; parecidos: ${parecidos.join(' · ') || 'ninguno'})`);
    }
    actual = path.join(actual, hallado);
  }
  return actual;
}

function nombreSalida(id) {
  return `biocaps_${id.replaceAll('-', '_')}_v1.webp`;
}

/** Color más frecuente dentro de un rectángulo (el fondo lila de la tarjeta). */
function colorDominante(datos, ancho, [x, y, w, h]) {
  const cuenta = new Map();
  for (let fila = y; fila < y + h; fila++) {
    for (let col = x; col < x + w; col++) {
      const i = (fila * ancho + col) * 4;
      const clave = (datos[i] << 24) | (datos[i + 1] << 16) | (datos[i + 2] << 8) | datos[i + 3];
      cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
    }
  }
  const [clave] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
  return [(clave >>> 24) & 255, (clave >>> 16) & 255, (clave >>> 8) & 255, clave & 255];
}

/** Rellena con el color de fondo las zonas con texto incrustado: ese texto se escribe en vivo desde el JSON. */
function borrarTexto(datos, ancho, rectangulos) {
  for (const rect of rectangulos) {
    const color = colorDominante(datos, ancho, rect);
    const [x, y, w, h] = rect;
    for (let fila = y; fila < y + h; fila++) {
      for (let col = x; col < x + w; col++) datos.set(color, (fila * ancho + col) * 4);
    }
  }
}

/**
 * Cambia el color de un detalle sobre fondo plano (p. ej. la barrita de PAG 05)
 * conservando el suavizado: cada píxel se mezcla entre el fondo y el color nuevo
 * según lo lejos que estaba del fondo. El fondo se toma de la franja justo debajo.
 */
function recolorear(datos, ancho, [x, y, w, h, hex]) {
  const fondo = colorDominante(datos, ancho, [x, y + h + 4, w, 8]).slice(0, 3);
  const objetivo = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const distancia = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(datos[i + c] - fondo[c])));
  let maxima = 1;
  for (let fila = y; fila < y + h; fila++) {
    for (let col = x; col < x + w; col++) maxima = Math.max(maxima, distancia((fila * ancho + col) * 4));
  }
  for (let fila = y; fila < y + h; fila++) {
    for (let col = x; col < x + w; col++) {
      const i = (fila * ancho + col) * 4;
      const t = distancia(i) / maxima;
      for (let c = 0; c < 3; c++) datos[i + c] = Math.round(fondo[c] + t * (objetivo[c] - fondo[c]));
    }
  }
}

/** «Color a alfa» (como el de GIMP): quita el color de fondo conservando los bordes suavizados. */
function colorAAlfa(datos, hex) {
  const clave = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  for (let i = 0; i < datos.length; i += 4) {
    let alfa = 0;
    for (let c = 0; c < 3; c++) {
      const p = datos[i + c];
      const k = clave[c];
      const a = p > k ? (p - k) / (255 - k) : p < k ? (k - p) / k : 0;
      alfa = Math.max(alfa, a);
    }
    if (alfa > 0) {
      for (let c = 0; c < 3; c++) datos[i + c] = Math.round((datos[i + c] - clave[c]) / alfa + clave[c]);
    }
    datos[i + 3] = Math.round(datos[i + 3] * alfa);
  }
}

async function procesarImagen(pieza) {
  const ruta = resolverRuta(pieza.origen);
  let imagen = sharp(ruta).ensureAlpha();
  if (pieza.recorte) {
    const [left, top, width, height] = pieza.recorte;
    imagen = imagen.extract({ left, top, width, height });
  }

  if (pieza.borrarTexto || pieza.colorAAlfa || pieza.recolorear) {
    const { data, info } = await imagen.raw().toBuffer({ resolveWithObject: true });
    if (pieza.borrarTexto) borrarTexto(data, info.width, pieza.borrarTexto);
    for (const zona of pieza.recolorear ?? []) recolorear(data, info.width, zona);
    if (pieza.colorAAlfa) colorAAlfa(data, pieza.colorAAlfa);
    imagen = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  }

  if (pieza.recortarTransparente) {
    // Recorta al contorno opaco: cada render trae márgenes distintos.
    imagen = sharp(await imagen.png().toBuffer()).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 });
  }

  const medida = pieza.alto ? { height: pieza.alto } : { width: pieza.ancho };
  const archivo = nombreSalida(pieza.id);
  const info = await imagen.resize({ ...medida, kernel: 'lanczos3' }).webp(WEBP).toFile(path.join(DIR_IMG, archivo));
  return { archivo: `img/${archivo}`, ancho: info.width, alto: info.height, bytes: info.size };
}

function piezasFrascosFinales() {
  const { alto, estilos, colores } = equivalencias.frascosFinales;
  const piezas = [];
  for (const [estilo, def] of Object.entries(estilos)) {
    for (const color of colores) {
      const archivo = def.archivos?.[color] ?? def.patron?.replace('{color}', color);
      if (!archivo) throw new Error(`Falta el frasco ${estilo} ${color} en equivalencias.json`);
      piezas.push({ id: `frasco-final-${estilo}-${color}`, origen: `${def.carpeta}/${archivo}`, recortarTransparente: true, alto });
    }
  }
  return piezas;
}

async function procesarReferencias() {
  rmSync(DIR_REFERENCIAS, { recursive: true, force: true });
  mkdirSync(DIR_REFERENCIAS, { recursive: true });
  for (const [id, relativa] of Object.entries(equivalencias.referencias)) {
    if (id.startsWith('_')) continue;
    const imagen = sharp(resolverRuta(relativa));
    // Los mockups de pantalla se llevan exactamente al lienzo; los ejemplos de frasco conservan su tamaño.
    const salida = id.startsWith('pag') ? imagen.resize(1080, 1920, { fit: 'fill' }) : imagen;
    await salida.flatten({ background: '#FFFFFF' }).webp({ quality: 82 }).toFile(path.join(DIR_REFERENCIAS, `${id}.webp`));
  }
}

async function principal() {
  if (!existsSync(ORIGEN)) throw new Error(`No existe el espejo de assets: ${ORIGEN}`);
  rmSync(DIR_IMG, { recursive: true, force: true });
  mkdirSync(DIR_IMG, { recursive: true });

  const piezas = [...equivalencias.imagenes, ...piezasFrascosFinales()];
  const imagenes = {};
  let total = 0;
  for (const pieza of piezas) {
    const resultado = await procesarImagen(pieza);
    const { bytes, ...entrada } = resultado;
    imagenes[pieza.id] = entrada;
    total += bytes;
    console.log(`  ${pieza.id.padEnd(36)} ${String(entrada.ancho).padStart(4)}×${String(entrada.alto).padEnd(4)} ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
  }

  const { videos, fuentes } = equivalencias.estaticos;
  for (const archivo of [...Object.values(videos), ...Object.values(fuentes).map((f) => f.archivo)]) {
    if (!existsSync(path.join(RAIZ, 'contenido', archivo))) throw new Error(`Falta contenido/${archivo}`);
  }

  const manifiesto = { version: 1, generado: 'ingesta/ingerir.mjs — no editar a mano', imagenes, videos: {}, fuentes };
  for (const [id, archivo] of Object.entries(videos)) manifiesto.videos[id] = { archivo };
  writeFileSync(path.join(RAIZ, 'contenido/manifiesto.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);

  await procesarReferencias();

  const tamanoDir = readdirSync(DIR_IMG).reduce((suma, f) => suma + statSync(path.join(DIR_IMG, f)).size, 0);
  console.log(`\n${piezas.length} imágenes · ${(total / 1024 / 1024).toFixed(1)} MB (${(tamanoDir / 1024 / 1024).toFixed(1)} MB en disco)`);
  console.log(`Referencias en ${path.relative(RAIZ, DIR_REFERENCIAS)}/`);
}

principal().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
});
