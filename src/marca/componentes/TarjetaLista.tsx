import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import estilos from './TarjetaLista.module.css';

interface PropiedadesTarjetaLista {
  /** Un «\n» en el contenido marca el salto de línea del PDF. */
  texto: string;
  /** Borde superior en px del lienzo. */
  arriba: number;
  /** PAG 02: tarjetas de 76 px y texto de 40; PAG 03: 96 px y texto de 35 (admite dos líneas). */
  variante: 'ingrediente' | 'suplemento';
  seleccionada: boolean;
  alActivar: () => void;
}

/** Tarjeta lila a ancho completo con chevron › (PAG 02 y PAG 03). */
export function TarjetaLista({ texto, arriba, variante, seleccionada, alActivar }: PropiedadesTarjetaLista): ReactNode {
  return (
    <Presionable
      className={`${estilos.tarjeta} ${estilos[variante]}`}
      style={{ top: arriba }}
      seleccionado={seleccionada}
      alActivar={alActivar}
      etiqueta={texto.replaceAll('\n', ' ')}
    >
      {/* Cada línea en su elemento: con text-box, Chromium no respeta el interlineado en bloques de varias líneas. */}
      <span className={estilos.texto}>
        {texto.split('\n').map((linea) => (
          <span key={linea} className="recortado">
            {linea}
          </span>
        ))}
      </span>
      <svg className={estilos.chevron} viewBox="0 0 12 22" aria-hidden="true">
        <path d="M1.5 1.5 10.5 11 1.5 20.5" />
      </svg>
    </Presionable>
  );
}
