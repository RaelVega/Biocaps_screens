// Icono de la app (pestaña del navegador y ventana/ejecutable de Electron): el
// símbolo de Biocaps sobre una baldosa blanca redondeada, que se ve igual sobre
// pestañas claras y sobre la barra de tareas oscura de Windows.
// Se recorta del mismo mockup que `logo-azul` (equivalencias.json) mientras no
// llega el logo suelto en SVG. Salida versionada: cascaras/icono/icono.png (256×256)
// e icono-mac.png (512×512, el mínimo que acepta electron-builder para macOS).
// Uso: npm run icono
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIGEN = path.join(process.env['ORIGEN_ASSETS'] ?? path.join(RAIZ, 'assets-fuente'), 'PAG 02 INGREDIENTE', 'página completa selecciona el ingrediente.png');
/** Caja del símbolo (círculo con la cápsula) en la página completa: medida por píxeles no blancos. */
const SIMBOLO = { left: 1735, top: 427, width: 182, height: 171 };
/** El símbolo ocupa el 78 % de la baldosa; el resto es margen. */
const OCUPA = 0.78;
/** Radio de las esquinas, en proporción al lado (56 px en 256). */
const RADIO = 56 / 256;
const SALIDAS = { 'icono.png': 256, 'icono-mac.png': 512 };

mkdirSync(path.join(RAIZ, 'cascaras/icono'), { recursive: true });
for (const [nombre, lado] of Object.entries(SALIDAS)) {
  const interior = Math.round(lado * OCUPA);
  const simbolo = await sharp(ORIGEN.normalize('NFC'))
    .extract(SIMBOLO)
    .resize(interior, interior, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  const baldosa = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${Math.round(lado * RADIO)}" fill="#ffffff"/></svg>`);
  const salida = path.join(RAIZ, 'cascaras/icono', nombre);
  await sharp(baldosa)
    .composite([{ input: simbolo, left: Math.round((lado - interior) / 2), top: Math.round((lado - interior) / 2) }])
    .png()
    .toFile(salida);
  console.log(`Icono escrito en ${path.relative(RAIZ, salida)}`);
}
