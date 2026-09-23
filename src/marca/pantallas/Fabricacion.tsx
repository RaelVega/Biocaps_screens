import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { programarRespaldo } from '../../motor/temporizadores/respaldo';
import { useContenido, useDespachar } from '../estado';
import { DURACION } from '../tokens/movimiento';
import estilos from './Pantallas.module.css';

/**
 * PAG 09 — VERSIÓN PROVISIONAL (barra + porcentaje). La animación completa
 * (el frasco que cruza con estelas y destellos) es la fase siguiente. Un solo
 * valor de progreso mueve la barra y el porcentaje; el avance lo da el fin de
 * la animación o el respaldo, lo que llegue primero.
 */
export function Fabricacion(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const progreso = useMotionValue(0);
  const escalaBarra = useTransform(progreso, (p) => p);
  const [porcentaje, setPorcentaje] = useState(0);

  useEffect(() => {
    const avanzar = (): void => despachar({ tipo: 'avanzar', origen: 'sistema' });
    const respaldo = programarRespaldo(avanzar, DURACION.respaldoFabricacion);
    const quitar = progreso.on('change', (p) => setPorcentaje(Math.round(p * 100)));
    const controles = animate(progreso, 1, { duration: DURACION.fabricacion / 1000, ease: [0.4, 0, 0.2, 1] });
    let pausa: ReturnType<typeof setTimeout> | undefined;
    void controles.then(() => {
      pausa = setTimeout(() => respaldo.terminar(), DURACION.fabricacionPausa);
    });
    return () => {
      controles.stop();
      quitar();
      clearTimeout(pausa);
      respaldo.cancelar();
    };
  }, [despachar, progreso]);

  return (
    <>
      <div className={estilos.pistaFabricacion}>
        <motion.div className={estilos.barraFabricacion} style={{ scaleX: escalaBarra }} />
      </div>
      <p className={`${estilos.porcentaje} recortado`}>{porcentaje}%</p>
      <p className={`${estilos.textoFabricacion} recortado`}>{contenido.pantallas.fabricacion.texto}</p>
    </>
  );
}
