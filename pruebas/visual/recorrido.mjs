// Recorre la experiencia completa en Chrome a 1080×1920, como un visitante,
// y compara cada pantalla con su mockup del PDF.
// Uso: node pruebas/visual/recorrido.mjs [url]   (por defecto http://localhost:4173/)
// Salida en pruebas/visual/resultados/: captura, lado a lado y superposición al 50 %.
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const URL = process.argv[2] ?? 'http://localhost:4173/';
const RAIZ = path.resolve(import.meta.dirname, '../..');
const REFERENCIAS = path.join(RAIZ, 'pruebas/visual/referencias');
const SALIDA = path.join(RAIZ, 'pruebas/visual/resultados');

/** Cada paso: qué tocar antes de capturar y con qué mockup compararlo. */
const PASOS = [
  { nombre: 'pag02', tocar: [{ lienzo: [540, 960] }], referencia: 'pag02' },
  { nombre: 'pag02-elegida', tocar: [{ texto: 'OMEGAS' }], referencia: 'pag02' },
  { nombre: 'pag03-omegas', tocar: [{ texto: 'SIGUIENTE' }, { texto: 'OMEGA 3 DE SALMÓN' }], referencia: 'pag03-omegas' },
  { nombre: 'pag04', tocar: [{ texto: 'SIGUIENTE' }], referencia: 'pag04' },
  { nombre: 'pag05', tocar: [{ texto: 'SIGUIENTE' }, { texto: '60 CÁPSULAS' }], referencia: 'pag05' },
  { nombre: 'pag06', tocar: [{ texto: 'SIGUIENTE' }, { texto: 'NATURISTA' }], referencia: 'pag06' },
  { nombre: 'pag06-naturista', tocar: [{ texto: 'SIGUIENTE' }], referencia: 'pag06-naturista' },
  { nombre: 'pag07', tocar: [{ texto: 'SIGUIENTE' }, ...[...'FLORIL'].map((letra) => ({ tecla: letra }))], referencia: 'pag07' },
  { nombre: 'pag08', tocar: [{ texto: 'FINALIZAR' }, { lienzo: [316, 775] }], referencia: 'pag08' },
  { nombre: 'pag09', tocar: [{ texto: 'SIGUIENTE' }], espera: 2600, referencia: 'pag09' },
  { nombre: 'pag10', tocar: [], espera: 3500, referencia: 'pag10' },
  { nombre: 'pag11', tocar: [{ texto: 'FINALIZAR' }], referencia: 'pag11' },
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

async function comparar(nombre, referencia) {
  const captura = path.join(SALIDA, `${nombre}.png`);
  const ref = path.join(REFERENCIAS, `${referencia}.webp`);
  const [a, b] = await Promise.all([sharp(captura).resize(540, 960).toBuffer(), sharp(ref).resize(540, 960).toBuffer()]);
  await sharp({ create: { width: 1080, height: 960, channels: 3, background: '#888' } })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: 540, top: 0 },
    ])
    .png()
    .toFile(path.join(SALIDA, `${nombre}-lado.png`));
  const semi = await sharp(ref).resize(1080, 1920).ensureAlpha(0.5).toBuffer();
  await sharp(captura).composite([{ input: semi, blend: 'over' }]).png().toFile(path.join(SALIDA, `${nombre}-superpuesta.png`));
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
for (const paso of PASOS) {
  for (const accion of paso.tocar) await tocar(pagina, accion);
  if (paso.espera) await pagina.waitForTimeout(paso.espera);
  const actual = await pagina.getAttribute('[data-paso]:not([style*="opacity: 0"])', 'data-paso').catch(() => '?');
  await pagina.screenshot({ path: path.join(SALIDA, `${paso.nombre}.png`) });
  await comparar(paso.nombre, paso.referencia);
  console.log(`  ${paso.nombre.padEnd(18)} paso=${actual}`);
}
await navegador.close();

if (errores.length) {
  console.log(`\nErrores de consola (${errores.length}):`);
  for (const error of errores) console.log(`  - ${error}`);
  process.exit(1);
}
console.log(`\nSin errores de consola. Resultados en ${path.relative(RAIZ, SALIDA)}/`);
