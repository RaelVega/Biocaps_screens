import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import type { ImagenResuelta } from '../estado';
import estilos from './TarjetaImagen.module.css';

interface PropiedadesTarjetaImagen {
  imagen: ImagenResuelta;
  /** Dónde cae el cuerpo lila de la tarjeta en el lienzo (medido en el PDF). */
  x: number;
  y: number;
  seleccionada: boolean;
  desactivada?: boolean;
  alActivar: () => void;
  /** Textos en vivo encima del cuerpo, en coordenadas del cuerpo. */
  children?: ReactNode;
}

/**
 * Tarjeta hecha con la imagen del cliente (PAG 04, 05 y 08). Se coloca por su
 * cuerpo: la zona tocable es el cuerpo lila y la imagen (con su sombra y lo
 * que sobresale) se desplaza para que el cuerpo caiga exacto en (x, y).
 */
export function TarjetaImagen({ imagen, x, y, seleccionada, desactivada = false, alActivar, children }: PropiedadesTarjetaImagen): ReactNode {
  const cuerpo = imagen.cuerpo ?? { x: 0, y: 0, ancho: imagen.ancho, alto: imagen.alto };
  return (
    <Presionable
      className={estilos.tarjeta}
      style={{ left: x, top: y, width: cuerpo.ancho, height: cuerpo.alto }}
      seleccionado={seleccionada}
      desactivado={desactivada}
      alActivar={alActivar}
    >
      {/* El contorno va antes que la imagen (detrás) y por fuera del cuerpo: así la cápsula o el frasco que sobresalen lo tapan y no quedan cortados. */}
      <span className={estilos.contorno} aria-hidden="true" />
      <img className={estilos.imagen} src={imagen.url} width={imagen.ancho} height={imagen.alto} style={{ left: -cuerpo.x, top: -cuerpo.y }} alt="" />
      {children}
    </Presionable>
  );
}
