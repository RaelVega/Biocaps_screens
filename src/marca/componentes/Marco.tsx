import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { CURVA_ESTANDAR, DURACION } from '../tokens/movimiento';
import { useContenido, useFlujo, useImagen } from '../estado';
import type { PasoBiocaps } from '../flujo';
import estilos from './Marco.module.css';

/** Pasos que en el PDF no llevan logo ni pie: la portada (video) y el QR (tratamiento invertido). */
const SIN_MARCO: ReadonlySet<PasoBiocaps> = new Set(['portada', 'qr']);

/** Logo arriba y pie abajo: fijos entre pantallas, solo aparecen o desaparecen. */
export function Marco(): ReactNode {
  const paso = useFlujo((f) => f.paso);
  const contenido = useContenido();
  const logo = useImagen(contenido.marco.logo);
  const visible = !SIN_MARCO.has(paso);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="marco"
          className={estilos.marco}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DURACION.entrada / 1000, ease: CURVA_ESTANDAR } }}
          exit={{ opacity: 0, transition: { duration: DURACION.salida / 1000, ease: CURVA_ESTANDAR } }}
        >
          <img className={estilos.logo} src={logo.url} width={logo.ancho} height={logo.alto} alt="Biocaps" />
          <p className={`${estilos.pie} recortado`}>{contenido.marco.pie}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
