import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { LimiteErrores } from '../motor/kiosco/LimiteErrores';
import { useMovimientoReducido } from '../motor/movimiento/useMovimientoReducido';
import { AvisoInactividad } from '../marca/componentes/AvisoInactividad';
import { Marco } from '../marca/componentes/Marco';
import { AVISO_INACTIVIDAD_MS, REINICIO_INACTIVIDAD_MS } from '../marca/configuracion';
import { useDespachar } from '../marca/estado';
import { Cantidad } from '../marca/pantallas/Cantidad';
import { Color } from '../marca/pantallas/Color';
import { Fabricacion } from '../marca/pantallas/Fabricacion';
import { Nombre } from '../marca/pantallas/Nombre';
import { Portada } from '../marca/pantallas/Portada';
import { Terminado } from '../marca/pantallas/Terminado';
import { CURVA_ESTANDAR, DESPLAZAMIENTO_ENTRADA, DURACION } from '../marca/tokens/movimiento';
import estilos from '../marca/Experiencia.module.css';
import { AvisoExportacion } from './componentes/AvisoExportacion';
import { useFlujoPropuesta } from './estado';
import type { PasoPropuesta } from './flujo';
import { Capsula } from './pantallas/Capsula';
import { Etiqueta } from './pantallas/Etiqueta';
import { Ingrediente } from './pantallas/Ingrediente';
import { Leads } from './pantallas/Leads';
import { Qr } from './pantallas/Qr';
import { Suplemento } from './pantallas/Suplemento';

/**
 * Pantallas de la propuesta: las propias (cápsula, ingrediente, suplemento,
 * etiqueta con su vista previa, leads y QR) y las del PDF, que llevan ATRÁS por la sustitución de la build.
 */
const PANTALLAS: Record<PasoPropuesta, () => ReactNode> = {
  portada: Portada,
  ingrediente: Ingrediente,
  suplemento: Suplemento,
  capsula: Capsula,
  cantidad: Cantidad,
  etiqueta: Etiqueta,
  nombre: Nombre,
  color: Color,
  leads: Leads,
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
  const paso = useFlujoPropuesta((f) => f.paso);
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
      <AvisoExportacion />
    </>
  );
}
