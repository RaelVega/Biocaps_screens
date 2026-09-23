import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import estilos from './BotonEstilo.module.css';

interface PropiedadesBotonEstilo {
  texto: string;
  x: number;
  y: number;
  seleccionado: boolean;
  alActivar: () => void;
}

/** Botón lila de 425×95 de PAG 06 (tipo de etiqueta). */
export function BotonEstilo({ texto, x, y, seleccionado, alActivar }: PropiedadesBotonEstilo): ReactNode {
  return (
    <Presionable className={estilos.boton} style={{ left: x, top: y }} seleccionado={seleccionado} alActivar={alActivar}>
      <span className="recortado">{texto}</span>
    </Presionable>
  );
}
