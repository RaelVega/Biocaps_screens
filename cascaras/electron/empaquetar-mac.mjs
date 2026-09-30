// Arma un .zip por variante para probar en Mac (Intel y Apple Silicon):
//   paquetes/compartir/Biocaps-Principal-mac.zip  (versión del PDF)
//   paquetes/compartir/Biocaps-Propuesta-mac.zip  (propuesta de Rael)
// Cada zip lleva el .app universal con firma ad-hoc, los .command de prueba y LEEME-PRUEBA-MAC.txt.
// Solo corre en macOS (codesign y ditto). Uso: npm run empaquetar:zips:mac
import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const SALIDA = path.join(RAIZ, 'paquetes', 'compartir');
const VARIANTES = [
  { nombre: 'Biocaps-Principal', empaquetar: 'empaquetar:mac', app: 'paquetes/mac-universal/Biocaps.app' },
  { nombre: 'Biocaps-Propuesta', empaquetar: 'empaquetar:mac:propuesta', app: 'paquetes/propuesta/mac-universal/Biocaps Propuesta.app' },
];
const EXTRAS = ['probar-en-ventana.command', 'prueba-tecnica.command', 'LEEME-PRUEBA-MAC.txt'];

if (process.platform !== 'darwin') throw new Error('empaquetar-mac.mjs necesita macOS (codesign y ditto).');
mkdirSync(SALIDA, { recursive: true });
for (const { nombre, empaquetar, app } of VARIANTES) {
  console.log(`\n== ${nombre}`);
  execFileSync('npm', ['run', empaquetar], { cwd: RAIZ, stdio: 'inherit' });
  const origen = path.join(RAIZ, app);
  if (!existsSync(origen)) throw new Error(`No se generó ${app}`);
  // Firma ad-hoc: sin ella, electron-builder deja la firma de Electron rota (cambió el
  // Info.plist) y Apple Silicon da la app por «dañada». No sustituye a una firma de Apple.
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', origen], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', origen], { stdio: 'inherit' });

  const carpeta = path.join(SALIDA, nombre);
  rmSync(carpeta, { recursive: true, force: true });
  mkdirSync(carpeta);
  // ditto, y no cpSync, para no romper los enlaces simbólicos de los frameworks ni la firma.
  execFileSync('ditto', [origen, path.join(carpeta, path.basename(origen))]);
  for (const extra of EXTRAS) {
    cpSync(path.join(RAIZ, 'cascaras/electron/mac', extra), path.join(carpeta, extra));
    if (extra.endsWith('.command')) chmodSync(path.join(carpeta, extra), 0o755);
  }
  const zip = path.join(SALIDA, `${nombre}-mac.zip`);
  rmSync(zip, { force: true });
  // --keepParent: el zip se abre en una carpeta; --norsrc: sin metadatos de macOS.
  execFileSync('ditto', ['-c', '-k', '--norsrc', '--keepParent', carpeta, zip]);
  rmSync(carpeta, { recursive: true, force: true });
}
// dist/ queda con la versión principal.
execFileSync('npm', ['run', 'build'], { cwd: RAIZ, stdio: 'ignore' });
console.log(`\nListo: ${SALIDA}`);
