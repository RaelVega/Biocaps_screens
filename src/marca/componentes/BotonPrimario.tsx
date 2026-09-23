import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import { useDespachar } from '../estado';
import estilos from './BotonPrimario.module.css';

/**
 * Botón azul con degradado y flecha, debajo del título (posición del PDF).
 * Avanza el flujo; si falta la elección, la máquina lo ignora.
 */
export function BotonPrimario({ texto }: { texto: string }): ReactNode {
  const despachar = useDespachar();
  return (
    <Presionable className={estilos.boton} alActivar={() => despachar({ tipo: 'avanzar', origen: 'visitante' })}>
      <span className={`${estilos.texto} recortado`}>{texto}</span>
      <svg className={estilos.flecha} viewBox="0 0 26 16" aria-hidden="true">
        <path d="M1 8h23 M17 1l7 7-7 7" />
      </svg>
    </Presionable>
  );
}
