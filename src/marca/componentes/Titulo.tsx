import type { ReactNode } from 'react';
import estilos from './Titulo.module.css';

/**
 * Título de dos líneas, centrado. Cada línea se coloca por separado (mayúsculas
 * en y = 213 y 289, como en el PDF): con `text-box` en un bloque de varias
 * líneas Chromium mete ~12 px de más entre líneas según `white-space` o
 * `font-stretch`, así que no se confía en el interlineado.
 */
export function Titulo({ lineas }: { lineas: readonly [string, string] }): ReactNode {
  return (
    <h1 className={estilos.titulo}>
      <span className={`${estilos.linea} recortado`}>{lineas[0]}</span>
      <span className={`${estilos.linea} ${estilos.segunda} recortado`}>{lineas[1]}</span>
    </h1>
  );
}
