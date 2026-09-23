import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BotonEstilo } from '../../marca/componentes/BotonEstilo';
import { Titulo } from '../../marca/componentes/Titulo';
import { useContenido, useDespachar, useImagen } from '../../marca/estado';
import estilosPdf from '../../marca/pantallas/Pantallas.module.css';
import { CURVA_ESTANDAR, DURACION } from '../../marca/tokens/movimiento';
import { Navegacion } from '../componentes/Navegacion';
import { useFlujoPropuesta } from '../estado';

/** Rejilla 2 + 2 + 1 de PAG 06, con su misma separación, bajo la etiqueta (que termina en y ≈ 1087). */
const POSICIONES = [
  [85, 1180],
  [568, 1180],
  [84, 1319],
  [568, 1319],
  [326, 1458],
] as const;

type Estilo = ReturnType<typeof useContenido>['estilos'][number];

/** La etiqueta plana del estilo elegido, en su sitio de PAG 6.x. Al cambiar de estilo, una se funde en la otra. */
function VistaEtiqueta({ estilo }: { estilo: Estilo }): ReactNode {
  const plana = useImagen(estilo.etiquetaPlana);
  return (
    <motion.img
      className={estilosPdf.etiquetaPlana}
      src={plana.url}
      width={plana.ancho}
      height={plana.alto}
      alt=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: DURACION.entrada / 1000, ease: CURVA_ESTANDAR } }}
      exit={{ opacity: 0, transition: { duration: DURACION.salida / 1000, ease: CURVA_ESTANDAR } }}
    />
  );
}

/**
 * PAG 06 y PAG 6.x fusionadas en la propuesta: la etiqueta del estilo elegido
 * arriba (donde la pone PAG 6.x) y los 5 estilos debajo para cambiarla ahí
 * mismo. Se entra con el primer estilo ya elegido (sesión inicial del flujo).
 */
export function Etiqueta(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const elegido = useFlujoPropuesta((f) => f.sesion.estilo);
  const estilo = contenido.estilos.find((e) => e.id === elegido);

  return (
    <>
      <Titulo lineas={contenido.pantallas.etiqueta.titulo} />
      <Navegacion texto={contenido.marco.botonSiguiente} />
      <AnimatePresence initial={false}>{estilo && <VistaEtiqueta key={estilo.id} estilo={estilo} />}</AnimatePresence>
      {contenido.estilos.map((e, i) => {
        const [x, y] = POSICIONES[i] ?? POSICIONES[0];
        return <BotonEstilo key={e.id} texto={e.nombre} x={x} y={y} seleccionado={elegido === e.id} alActivar={() => despachar({ tipo: 'elegir', valor: e.id })} />;
      })}
    </>
  );
}
