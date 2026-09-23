import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { TarjetaImagen } from '../../marca/componentes/TarjetaImagen';
import { Titulo } from '../../marca/componentes/Titulo';
import { useContenido, useDespachar, useImagen } from '../../marca/estado';
import estilosPdf from '../../marca/pantallas/Pantallas.module.css';
import { CURVA_ESTANDAR, DURACION } from '../../marca/tokens/movimiento';
import { Navegacion } from '../componentes/Navegacion';
import { useFlujoPropuesta, useRecursosPropuesta, useTextosPropuesta } from '../estado';
import estilos from './Propuesta.module.css';

/** Cuerpos de las tarjetas de PAG 04 (rejilla 2×2 del PDF). */
const POSICIONES = [
  [120, 818],
  [610, 818],
  [120, 1231],
  [610, 1231],
] as const;

type Forma = ReturnType<typeof useContenido>['formas'][number];

function TarjetaForma({ indice, forma }: { indice: number; forma: Forma }): ReactNode {
  const despachar = useDespachar();
  const elegida = useFlujoPropuesta((f) => f.sesion.capsula);
  const imagen = useImagen(forma.imagen);
  const [x, y] = POSICIONES[indice] ?? POSICIONES[0];

  return (
    <TarjetaImagen imagen={imagen} x={x} y={y} seleccionada={elegida === forma.id} alActivar={() => despachar({ tipo: 'elegir', valor: forma.id })}>
      <span className={`${estilosPdf.formaNombre} recortado`}>{forma.nombre}</span>
      <span className={`${estilosPdf.formaTamanos} recortado`}>{forma.tamanos}</span>
    </TarjetaImagen>
  );
}

/** Bajo la rejilla: los suplementos que admite la cápsula elegida. Es informativo, no se toca. */
function PuedeContener(): ReactNode {
  const { catalogo } = useRecursosPropuesta();
  const textos = useTextosPropuesta();
  const capsula = useFlujoPropuesta((f) => f.sesion.capsula);
  // En orden alfabético (español): se lee como lista, no como el orden de las categorías.
  const nombres = capsula === null ? [] : catalogo.suplementosPorForma(capsula).map((s) => ({ id: s.id, nombre: s.nombre.replaceAll('\n', ' ') }));
  nombres.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return (
    <AnimatePresence initial={false}>
      {capsula !== null && (
        <motion.div
          key={capsula}
          className={estilos.panelContenido}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DURACION.entrada / 1000, ease: CURVA_ESTANDAR } }}
          exit={{ opacity: 0, transition: { duration: DURACION.salida / 1000, ease: CURVA_ESTANDAR } }}
        >
          <p className={`${estilos.encabezadoPanel} recortado`}>{textos.capsula.puedeContener}</p>
          <ul className={estilos.listaPanel}>
            {nombres.map((s) => (
              <li key={s.id}>{s.nombre}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** PAG 04 en la propuesta: la primera elección. Las 4 formas se pueden elegir. */
export function Capsula(): ReactNode {
  const contenido = useContenido();
  return (
    <>
      <Titulo lineas={contenido.pantallas.capsula.titulo} />
      <Navegacion texto={contenido.marco.botonSiguiente} />
      {contenido.formas.map((forma, i) => (
        <TarjetaForma key={forma.id} indice={i} forma={forma} />
      ))}
      <PuedeContener />
    </>
  );
}
