import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { LimiteErrores } from '../motor/kiosco/LimiteErrores';
import { useMovimientoReducido } from '../motor/movimiento/useMovimientoReducido';
import { AvisoInactividad } from './componentes/AvisoInactividad';
import { Marco } from './componentes/Marco';
import { AVISO_INACTIVIDAD_MS, REINICIO_INACTIVIDAD_MS } from './configuracion';
import { useDespachar, useFlujo } from './estado';
import type { PasoBiocaps } from './flujo';
import { Cantidad } from './pantallas/Cantidad';
import { Capsula } from './pantallas/Capsula';
import { Color } from './pantallas/Color';
import { Etiqueta } from './pantallas/Etiqueta';
import { EtiquetaDetalle } from './pantallas/EtiquetaDetalle';
import { Fabricacion } from './pantallas/Fabricacion';
import { Ingrediente } from './pantallas/Ingrediente';
import { Nombre } from './pantallas/Nombre';
import { Portada } from './pantallas/Portada';
import { Qr } from './pantallas/Qr';
import { Suplemento } from './pantallas/Suplemento';
import { Terminado } from './pantallas/Terminado';
import { CURVA_ESTANDAR, DESPLAZAMIENTO_ENTRADA, DURACION } from './tokens/movimiento';
import estilos from './Experiencia.module.css';

const PANTALLAS: Record<PasoBiocaps, () => ReactNode> = {
  portada: Portada,
  ingrediente: Ingrediente,
  suplemento: Suplemento,
  capsula: Capsula,
  cantidad: Cantidad,
  etiqueta: Etiqueta,
  etiquetaDetalle: EtiquetaDetalle,
  nombre: Nombre,
  color: Color,
  fabricacion: Fabricacion,
  terminado: Terminado,
  qr: Qr,
};

/** Entra en 240 ms subiendo un poco; sale en 160 ms. Como mucho dos pantallas animando a la vez. */
function variantes(reducido: boolean): Variants {
  return {
    inicial: { opacity: 0, y: reducido ? 0 : DESPLAZAMIENTO_ENTRADA },
    visible: { opacity: 1, y: 0, transition: { duration: DURACION.entrada / 1000, ease: CURVA_ESTANDAR } },
    salida: { opacity: 0, transition: { duration: DURACION.salida / 1000, ease: CURVA_ESTANDAR } },
  };
}

export function Experiencia(): ReactNode {
  const paso = useFlujo((f) => f.paso);
  const despachar = useDespachar();
  const reducido = useMovimientoReducido();
  const Pantalla = PANTALLAS[paso];

  // Cualquier toque, en cualquier parte, cuenta como actividad (y quita el aviso).
  useEffect(() => {
    const alTocar = (): void => despachar({ tipo: 'actividad' });
    window.addEventListener('pointerdown', alTocar, { capture: true });
    return () => window.removeEventListener('pointerdown', alTocar, { capture: true });
  }, [despachar]);

  return (
    <>
      <LimiteErrores alFallar={() => despachar({ tipo: 'reiniciar', motivo: 'error' })}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={paso} className={estilos.pantalla} data-paso={paso} variants={variantes(reducido)} initial="inicial" animate="visible" exit="salida">
            <Pantalla />
          </motion.div>
        </AnimatePresence>
        <Marco />
      </LimiteErrores>
      <AvisoInactividad segundosParaReinicio={(REINICIO_INACTIVIDAD_MS - AVISO_INACTIVIDAD_MS) / 1000} />
    </>
  );
}
