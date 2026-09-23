import type { ReactNode } from 'react';
import { BotonEstilo } from '../componentes/BotonEstilo';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo } from '../estado';

/** Rejilla 2 + 2 + 1 de PAG 06. */
const POSICIONES = [
  [85, 829],
  [568, 829],
  [84, 968],
  [568, 968],
  [326, 1107],
] as const;

export function Etiqueta(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const elegido = useFlujo((f) => f.sesion.estilo);
  return (
    <>
      <Titulo lineas={contenido.pantallas.etiqueta.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      {contenido.estilos.map((estilo, i) => {
        const [x, y] = POSICIONES[i] ?? POSICIONES[0];
        return (
          <BotonEstilo
            key={estilo.id}
            texto={estilo.nombre}
            x={x}
            y={y}
            seleccionado={elegido === estilo.id}
            alActivar={() => despachar({ tipo: 'elegir', valor: estilo.id })}
          />
        );
      })}
    </>
  );
}
