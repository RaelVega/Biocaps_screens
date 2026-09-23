import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { CURVA_ESTANDAR, DURACION } from '../tokens/movimiento';
import { useContenido, useFlujo } from '../estado';
import estilos from './AvisoInactividad.module.css';

/**
 * Aviso a los 45 s sin tocar (propuesta: el PDF no lo dibuja). Cubre la
 * pantalla para que el toque que lo quita no active nada debajo. La barra se
 * vacía en los segundos que faltan para el reinicio.
 */
export function AvisoInactividad({ segundosParaReinicio }: { segundosParaReinicio: number }): ReactNode {
  const activo = useFlujo((f) => f.avisoInactividad);
  const { aviso } = useContenido().marco;

  return (
    <AnimatePresence>
      {activo && (
        <motion.div
          className={estilos.capa}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DURACION.entrada / 1000, ease: CURVA_ESTANDAR } }}
          exit={{ opacity: 0, transition: { duration: DURACION.salida / 1000, ease: CURVA_ESTANDAR } }}
        >
          <div className={estilos.tarjeta}>
            <p className={`${estilos.titulo} recortado`}>{aviso.titulo}</p>
            <p className={`${estilos.texto} recortado`}>{aviso.texto}</p>
            <div className={estilos.pista}>
              <div className={estilos.barra} style={{ animationDuration: `${segundosParaReinicio}s` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
