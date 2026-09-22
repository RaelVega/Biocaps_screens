// Compila la cáscara de Electron a dist-electron/: main en ESM, preload en CommonJS
// (un preload con sandbox activo tiene que ser CommonJS).
import { build } from 'esbuild';

const comun = { bundle: true, platform: 'node', target: 'node22', external: ['electron'], logLevel: 'info' };

await build({ ...comun, entryPoints: ['cascaras/electron/main.ts'], outfile: 'dist-electron/main.js', format: 'esm' });
await build({ ...comun, entryPoints: ['cascaras/electron/preload.ts'], outfile: 'dist-electron/preload.cjs', format: 'cjs' });
