import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { TarjetaImagen } from '../componentes/TarjetaImagen';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo, useImagen } from '../estado';

/** Cuerpos de los fondos lila de PAG 08 (rejilla 2×3). */
const POSICIONES = [
  [159, 621],
  [604, 621],
  [159, 999],
  [604, 999],
  [159, 1377],
  [604, 1377],
] as const;

function TarjetaColor({ indice, color }: { indice: number; color: ReturnType<typeof useContenido>['colores'][number] }): ReactNode {
  const despachar = useDespachar();
  const elegido = useFlujo((f) => f.sesion.color);
  const imagen = useImagen(color.imagen);
  const [x, y] = POSICIONES[indice] ?? POSICIONES[0];
  return <TarjetaImagen imagen={imagen} x={x} y={y} seleccionada={elegido === color.id} alActivar={() => despachar({ tipo: 'elegir', valor: color.id })} />;
}

export function Color(): ReactNode {
  const contenido = useContenido();
  return (
    <>
      <Titulo lineas={contenido.pantallas.color.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      {contenido.colores.map((color, i) => (
        <TarjetaColor key={color.id} indice={i} color={color} />
      ))}
    </>
  );
}
