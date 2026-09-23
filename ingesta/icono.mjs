// Icono de la app (pestaña del navegador y ventana/ejecutable de Electron): el
// símbolo de Biocaps sobre una baldosa blanca redondeada, que se ve igual sobre
// pestañas claras y sobre la barra de tareas oscura de Windows.
// Se recorta del mismo mockup que `logo-azul` (equivalencias.json) mientras no
// llega el logo suelto en SVG. Salida versionada: cascaras/icono/icono.png (256×256).
// Uso: npm run icono
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIGEN = path.join(process.env['ORIGEN_ASSETS'] ?? path.join(RAIZ, 'assets-fuente'), 'PAG 02 INGREDIENTE', 'página completa selecciona el ingrediente.png');
/** Caja del símbolo (círculo con la cápsula) en la página completa: medida por píxeles no blancos. */
const SIMBOLO = { left: 1735, top: 427, width: 182, height: 171 };
const LADO = 256;
/** El símbolo ocupa el 78 % de la baldosa; el resto es margen. */
const OCUPA = 0.78;
const RADIO = 56;
const SALIDA = path.join(RAIZ, 'cascaras/icono/icono.png');

const interior = Math.round(LADO * OCUPA);
const simbolo = await sharp(ORIGEN.normalize('NFC'))
  .extract(SIMBOLO)
  .resize(interior, interior, { fit: 'contain', background: '#ffffff' })
  .png()
  .toBuffer();
const baldosa = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}"><rect width="${LADO}" height="${LADO}" rx="${RADIO}" fill="#ffffff"/></svg>`);

mkdirSync(path.dirname(SALIDA), { recursive: true });
await sharp(baldosa)
  .composite([{ input: simbolo, left: Math.round((LADO - interior) / 2), top: Math.round((LADO - interior) / 2) }])
  .png()
  .toFile(SALIDA);
console.log(`Icono escrito en ${path.relative(RAIZ, SALIDA)}`);
