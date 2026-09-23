import { useEffect, useState, type ReactNode } from 'react';
import { cargarJson, urlContenido } from '../motor/contenido/cargar';
import { crearAlmacenFlujo } from '../motor/maquina/almacen';
import { registrarFuentesDeContenido } from '../motor/precarga/fuentes';
import { precargar } from '../motor/precarga/precarga';
import { AVISO_INACTIVIDAD_MS, REINICIO_INACTIVIDAD_MS, REINTENTO_FALLO_MS, TEXTO_FALLO_CONTENIDO } from '../marca/configuracion';
import { cargarContenidoBiocaps } from '../marca/contenido/cargar';
import { ProveedorRecursos } from '../marca/estado';
import { crearCatalogoPropuesta } from './contenido/catalogo';
import { esquemaPropuesta } from './contenido/esquema';
import { comoRecursosDeMarca, type RecursosPropuesta } from './estado';
import { Experiencia } from './Experiencia';
import { crearMaquinaPropuesta } from './flujo';
import { iniciarGuardadoLeads } from './leads/guardar';
import estilos from '../marca/App.module.css';
import './tokens.css';

type Carga = { fase: 'cargando' } | { fase: 'lista'; recursos: RecursosPropuesta } | { fase: 'fallo'; detalle: string };

/** Cuerpos y pesos de la interfaz que se usan: se cargan todos antes de la portada. */
const FUENTES_INTERFAZ = ['400 37px "Interfaz"', 'italic 400 35px "Interfaz"', '700 35px "Interfaz"', '700 73.7px "Interfaz"', '750 35px "Interfaz"'];

async function iniciar(): Promise<RecursosPropuesta> {
  const [{ catalogo: base, manifiesto }, textos] = await Promise.all([cargarContenidoBiocaps(), cargarJson('propuesta.json', esquemaPropuesta)]);
  const catalogo = crearCatalogoPropuesta(base);
  const fuentesFallidas = await registrarFuentesDeContenido(manifiesto.fuentes);
  const { fallidas, agotoTiempo } = await precargar({
    imagenes: Object.values(manifiesto.imagenes).map((imagen) => urlContenido(imagen.archivo)),
    fuentes: FUENTES_INTERFAZ,
    minimoMs: 400,
    maximoMs: 8000,
  });
  if (fuentesFallidas.length || fallidas.length || agotoTiempo) console.warn('Precarga incompleta', { fuentesFallidas, fallidas, agotoTiempo });

  const almacen = crearAlmacenFlujo(crearMaquinaPropuesta(catalogo, textos), { avisoMs: AVISO_INACTIVIDAD_MS, reinicioMs: REINICIO_INACTIVIDAD_MS });
  iniciarGuardadoLeads(almacen, textos);
  return { almacen, catalogo, manifiesto, textos };
}

/** Arranque de la propuesta (copia del de `src/marca/App.tsx`, para que pueda cambiar sin tocarlo): contenido validado y todo precargado antes de la portada. Nunca termina en pantalla blanca. */
export function App(): ReactNode {
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });

  useEffect(() => {
    // ?fallo muestra la pantalla de fallo sin romper nada (para revisarla). En el kiosco nunca hay parámetros.
    if (new URLSearchParams(window.location.search).has('fallo')) {
      setCarga({ fase: 'fallo', detalle: 'Simulación con ?fallo: el contenido no se pudo leer.' });
      return;
    }
    let vigente = true;
    iniciar().then(
      (recursos) => vigente && setCarga({ fase: 'lista', recursos }),
      (error: unknown) => vigente && setCarga({ fase: 'fallo', detalle: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (carga.fase !== 'fallo') return;
    console.error('No se pudo arrancar:', carga.detalle);
    const id = setTimeout(() => window.location.reload(), REINTENTO_FALLO_MS);
    return () => clearTimeout(id);
  }, [carga]);

  if (carga.fase === 'cargando') return <div className={estilos.arranque} />;
  if (carga.fase === 'fallo') {
    return (
      <div className={estilos.fallo}>
        <p className={`${estilos.falloTitulo} recortado`}>{TEXTO_FALLO_CONTENIDO.titulo}</p>
        <p className={`${estilos.falloTexto} recortado`}>{TEXTO_FALLO_CONTENIDO.texto}</p>
        <p className={estilos.falloDetalle}>{carga.detalle}</p>
      </div>
    );
  }
  return (
    <ProveedorRecursos recursos={comoRecursosDeMarca(carga.recursos)}>
      <Experiencia />
    </ProveedorRecursos>
  );
}
