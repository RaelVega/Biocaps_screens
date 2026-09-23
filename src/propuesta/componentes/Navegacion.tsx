import type { ReactNode } from 'react';
import { useDespachar } from '../../marca/estado';
import { Presionable } from '../../motor/componentes/Presionable';
import { useTextosPropuesta } from '../estado';
import estilos from './Navegacion.module.css';

/**
 * ATRÁS y SIGUIENTE (o FINALIZAR) en la línea del botón del PDF. SIGUIENTE es
 * el mismo botón con degradado; ATRÁS, la misma pastilla en contorno.
 * En la build de la propuesta sustituye a `marca/componentes/BotonPrimario`
 * (ver `sustituye` en vite.config.ts), así que las pantallas del PDF que se
 * reutilizan lo llevan sin copiarlas.
 */
interface PropiedadesNavegacion {
  texto: string;
  /** Si se sabe que la máquina no dejará avanzar, `alBloqueado` avisa a la pantalla (p. ej. para hacer temblar un campo). */
  puedeAvanzar?: boolean;
  alBloqueado?: () => void;
}

export function Navegacion({ texto, puedeAvanzar = true, alBloqueado }: PropiedadesNavegacion): ReactNode {
  const despachar = useDespachar();
  const { navegacion } = useTextosPropuesta();
  return (
    <>
      <Presionable className={`${estilos.boton} ${estilos.atras}`} alActivar={() => despachar({ tipo: 'retroceder' })}>
        <svg className={estilos.flecha} viewBox="0 0 26 16" aria-hidden="true">
          <path d="M25 8H2 M9 1 2 8l7 7" />
        </svg>
        <span className={`${estilos.texto} recortado`}>{navegacion.atras}</span>
      </Presionable>
      <Presionable
        className={`${estilos.boton} ${estilos.siguiente}`}
        alActivar={() => {
          // Se despacha igual: la máquina decide y el no-op queda en el historial.
          despachar({ tipo: 'avanzar', origen: 'visitante' });
          if (!puedeAvanzar) alBloqueado?.();
        }}
      >
        <span className={`${estilos.texto} recortado`}>{texto}</span>
        <svg className={estilos.flecha} viewBox="0 0 26 16" aria-hidden="true">
          <path d="M1 8h23 M17 1l7 7-7 7" />
        </svg>
      </Presionable>
    </>
  );
}

/** Mismo nombre y firma que el botón del PDF, para la sustitución de la build. */
export { Navegacion as BotonPrimario };
