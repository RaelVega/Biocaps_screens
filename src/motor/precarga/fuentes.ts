import { urlContenido } from '../contenido/cargar';

/**
 * Registra las fuentes que viven en `contenido/` (las del nombre del producto
 * por estilo), para que se puedan sustituir sin recompilar. Una fuente que
 * falla no detiene el arranque: se usa la de respaldo del estilo.
 */
export async function registrarFuentesDeContenido(fuentes: Record<string, { archivo: string; familia: string }>): Promise<string[]> {
  const fallidas: string[] = [];
  await Promise.all(
    Object.values(fuentes).map(async ({ archivo, familia }) => {
      try {
        const cara = new FontFace(familia, `url("${urlContenido(archivo)}")`, { display: 'block' });
        await cara.load();
        document.fonts.add(cara);
      } catch {
        fallidas.push(archivo);
      }
    }),
  );
  return fallidas;
}
