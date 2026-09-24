// Vía C″ · Cloudflare Pages: construye cada variante y la sube como proyecto propio.
//   biocaps-principal → https://biocaps-principal.pages.dev (versión del PDF)
//   biocaps-propuesta → https://biocaps-propuesta.pages.dev (propuesta de Rael)
// Requiere una sesión: npx wrangler login (una sola vez). Crea los proyectos si no existen.
// Uso: npm run publicar:cloudflare [-- principal|propuesta]
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const WRANGLER = ['--yes', 'wrangler@4'];
const VARIANTES = {
  principal: { proyecto: 'biocaps-principal', build: 'build' },
  propuesta: { proyecto: 'biocaps-propuesta', build: 'build:propuesta' },
};

const elegidas = process.argv.slice(2);
for (const nombre of elegidas) if (!(nombre in VARIANTES)) throw new Error(`Variante desconocida: ${nombre} (válidas: ${Object.keys(VARIANTES).join(', ')})`);

const correr = (comando, args, opciones = {}) => execFileSync(comando, args, { cwd: RAIZ, stdio: 'inherit', ...opciones });
const wrangler = (...args) => correr('npx', [...WRANGLER, ...args]);

const existentes = execFileSync('npx', [...WRANGLER, 'pages', 'project', 'list', '--json'], { cwd: RAIZ, encoding: 'utf8' });
const proyectos = new Set(JSON.parse(existentes).map((p) => p['Project Name'] ?? p.name ?? p.project_name));

for (const nombre of elegidas.length ? elegidas : Object.keys(VARIANTES)) {
  const { proyecto, build } = VARIANTES[nombre];
  console.log(`\n== ${nombre} → ${proyecto}`);
  correr('npm', ['run', build]);
  if (!proyectos.has(proyecto)) {
    try {
      // --force: wrangler 4.138+ intenta crear un Worker en vez de un proyecto de Pages y falla con una carpeta
      // estática. Solo hace falta al crear; ya creado, los comandos van directo a Pages.
      wrangler('pages', 'project', 'create', proyecto, '--production-branch', 'main', '--force');
    } catch {
      // Si ya existía (la lista no lo reconoció), la publicación de abajo lo confirma o falla con su propio mensaje.
      console.warn(`No se pudo crear ${proyecto}; se intenta publicar igual.`);
    }
  }
  wrangler('pages', 'deploy', 'dist', '--project-name', proyecto, '--branch', 'main', '--commit-dirty=true');
}

// dist/ queda siempre con la versión principal, como en el resto del proyecto.
correr('npm', ['run', 'build'], { stdio: 'ignore' });
