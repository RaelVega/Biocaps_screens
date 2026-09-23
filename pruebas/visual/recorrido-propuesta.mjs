// Recorre la variante «propuesta» en Chrome a 1080×1920, como un visitante, y
// captura cada pantalla (el PDF no dibuja la propuesta: no hay mockup con que comparar).
// Cubre la cápsula primero, el salto de PAG 02 con una sola categoría, ATRÁS,
// los leads con autocompletado y VOLVER AL INICIO.
// Uso: node pruebas/visual/recorrido-propuesta.mjs [url]   (por defecto http://localhost:4174/)
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:4174/';
const RAIZ = path.resolve(import.meta.dirname, '../..');
const SALIDA = path.join(RAIZ, 'pruebas/visual/resultados-propuesta');

/** Cada paso: qué tocar antes de capturar y en qué paso tiene que quedar la experiencia. */
const PASOS = [
  { nombre: 'p04-capsula', tocar: [{ lienzo: [540, 960] }], paso: 'capsula' },
  { nombre: 'p04-oblonga', tocar: [{ lienzo: [294, 930] }], paso: 'capsula' },
  { nombre: 'p04-oval', tocar: [{ lienzo: [784, 930] }], paso: 'capsula' },
  { nombre: 'p04-redonda', tocar: [{ lienzo: [294, 1340] }], paso: 'capsula' },
  { nombre: 'p03-redonda-salta-p02', tocar: [{ texto: 'SIGUIENTE' }], paso: 'suplemento' },
  { nombre: 'p04-vuelta-atras', tocar: [{ texto: 'ATRÁS' }], paso: 'capsula' },
  { nombre: 'p02-oval', tocar: [{ lienzo: [784, 930] }, { texto: 'SIGUIENTE' }], paso: 'ingrediente' },
  { nombre: 'p03-oval-naturales', tocar: [{ texto: 'INGREDIENTES NATURALES' }, { texto: 'SIGUIENTE' }, { texto: 'JALEA REAL CON TIAMINA' }], paso: 'suplemento' },
  { nombre: 'p05', tocar: [{ texto: 'SIGUIENTE' }, { texto: '60 CÁPSULAS' }], paso: 'cantidad' },
  { nombre: 'p06-entra-con-naturista', tocar: [{ texto: 'SIGUIENTE' }], paso: 'etiqueta' },
  { nombre: 'p06-cambia-a-moderno', tocar: [{ texto: 'MODERNO' }], paso: 'etiqueta' },
  { nombre: 'p06-vuelve-a-naturista', tocar: [{ texto: 'NATURISTA' }], paso: 'etiqueta' },
  { nombre: 'p07', tocar: [{ texto: 'SIGUIENTE' }, ...[...'FLORIL'].map((letra) => ({ tecla: letra }))], paso: 'nombre' },
  { nombre: 'p08', tocar: [{ texto: 'FINALIZAR' }, { lienzo: [316, 775] }], paso: 'color' },
  { nombre: 'leads-vacio', tocar: [{ texto: 'SIGUIENTE' }], paso: 'leads' },
  { nombre: 'leads-bloqueado', tocar: [{ texto: 'SIGUIENTE' }], paso: 'leads' },
  { nombre: 'leads-nombre', tocar: [...[...'ANA'].map((letra) => ({ tecla: letra })), { tecla: 'ESPACIO' }, ...[...'LÓPEZ'].map((letra) => ({ tecla: letra }))], paso: 'leads' },
  { nombre: 'leads-correo-sugerencias', tocar: [{ texto: 'CORREO' }, ...[...'ana'].map((letra) => ({ tecla: letra }))], paso: 'leads' },
  { nombre: 'leads-correo-empresa', tocar: [{ tecla: '@' }, ...[...'biocaps'].map((letra) => ({ tecla: letra }))], paso: 'leads' },
  { nombre: 'leads-correo-completo', tocar: [{ tecla: '.com.mx' }, { texto: 'EMPRESA' }, ...[...'BIOCAPS'].map((letra) => ({ tecla: letra }))], paso: 'leads' },
  { nombre: 'p09', tocar: [{ texto: 'SIGUIENTE' }], espera: 2600, paso: 'fabricacion' },
  { nombre: 'p10', tocar: [], espera: 3500, paso: 'terminado' },
  { nombre: 'p11', tocar: [{ texto: 'FINALIZAR' }], paso: 'qr' },
  { nombre: 'p01-inicio', tocar: [{ texto: 'VOLVER AL INICIO' }], paso: 'portada' },
];

async function tocar(pagina, accion) {
  if (accion.lienzo) {
    const [x, y] = accion.lienzo;
    await pagina.mouse.click(x, y);
  } else if (accion.tecla) {
    await pagina.getByRole('button', { name: accion.tecla, exact: true }).click();
  } else {
    await pagina.getByRole('button', { name: accion.texto }).first().click();
  }
  await pagina.waitForTimeout(450); // transiciones de 240/160 ms
}

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch({ channel: 'chrome' });
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
const errores = [];
pagina.on('pageerror', (error) => errores.push(error.message));
pagina.on('console', (mensaje) => mensaje.type() === 'error' && errores.push(mensaje.text()));

await pagina.goto(URL);
await pagina.waitForSelector('[data-paso="portada"]', { timeout: 15_000 });
let fallos = 0;
for (const paso of PASOS) {
  for (const accion of paso.tocar) await tocar(pagina, accion);
  if (paso.espera) await pagina.waitForTimeout(paso.espera);
  const actual = await pagina.getAttribute('[data-paso]:not([style*="opacity: 0"])', 'data-paso').catch(() => '?');
  await pagina.screenshot({ path: path.join(SALIDA, `${paso.nombre}.png`) });
  const bien = actual === paso.paso;
  if (!bien) fallos++;
  console.log(`  ${bien ? '✓' : '✗'} ${paso.nombre.padEnd(26)} paso=${actual}${bien ? '' : ` (se esperaba ${paso.paso})`}`);
}
await navegador.close();

if (errores.length) {
  console.log(`\nErrores de consola (${errores.length}):`);
  for (const error of errores) console.log(`  - ${error}`);
}
console.log(errores.length || fallos ? `\n${fallos} pasos fuera de lugar. Resultados en pruebas/visual/resultados-propuesta/` : '\nSin errores de consola. Resultados en pruebas/visual/resultados-propuesta/');
process.exit(errores.length || fallos ? 1 : 0);
