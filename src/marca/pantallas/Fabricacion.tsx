import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { programarRespaldo } from '../../motor/temporizadores/respaldo';
import { useMovimientoReducido } from '../../motor/movimiento/useMovimientoReducido';
import { useContenido, useDespachar, useImagen } from '../estado';
import { DURACION } from '../tokens/movimiento';
import estilos from './Pantallas.module.css';

/** Pista de la barra en el lienzo (Pantallas.module.css, `.pistaFabricacion`). */
const PISTA = { izquierda: 122, ancho: 753 } as const;
/** Cuerpo del frasco dentro de su imagen de 465 px (medido por columnas opacas): las estelas quedan a su izquierda. */
const CUERPO_FRASCO = { centro: 289, semiancho: 84 } as const;
/** Con movimiento reducido el frasco se queda quieto en su sitio del PDF. */
const X_PDF = 48;
/** El centro del cuerpo va del borde izquierdo al derecho de la pista sin salirse de ella. */
const X_INICIO = PISTA.izquierda + CUERPO_FRASCO.semiancho - CUERPO_FRASCO.centro;
const X_FIN = PISTA.izquierda + PISTA.ancho - CUERPO_FRASCO.semiancho - CUERPO_FRASCO.centro;

/**
 * PAG 09. Un solo valor de progreso mueve la barra, el porcentaje y el frasco
 * (con sus estelas y destellos, que vienen en la misma imagen): el frasco
 * recorre la barra de principio a fin, con el borde del relleno siempre detrás
 * de él, como si lo empujara. Es siempre el azul, sea cual sea el color elegido
 * (convención de marca). El avance lo da el fin de la animación o el respaldo,
 * lo que llegue primero. Con movimiento reducido el frasco no se desplaza: se
 * queda en su sitio del PDF.
 */
export function Fabricacion(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const progreso = useMotionValue(0);
  const escalaBarra = useTransform(progreso, (p) => p);
  const reducido = useMovimientoReducido();
  const xFrasco = useTransform(progreso, [0, 1], reducido ? [X_PDF, X_PDF] : [X_INICIO, X_FIN]);
  const frasco = useImagen(contenido.pantallas.fabricacion.frasco);
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
      {/* Después de la pista: el frasco pasa por delante de la barra, como en el PDF. */}
      <motion.img className={estilos.frascoFabricacion} src={frasco.url} width={frasco.ancho} height={frasco.alto} style={{ x: xFrasco }} alt="" />
      <p className={`${estilos.porcentaje} recortado`}>{porcentaje}%</p>
      <p className={`${estilos.textoFabricacion} recortado`}>{contenido.pantallas.fabricacion.texto}</p>
    </>
  );
}
