import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { TarjetaImagen } from '../componentes/TarjetaImagen';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo, useImagen, useRecursos } from '../estado';
import estilos from './Pantallas.module.css';

/** Cuerpos de las tarjetas de PAG 04 (rejilla 2×2 del PDF). */
const POSICIONES = [
  [120, 818],
  [610, 818],
  [120, 1231],
  [610, 1231],
] as const;

function TarjetaForma({ indice, forma }: { indice: number; forma: ReturnType<typeof useContenido>['formas'][number] }): ReactNode {
  const { catalogo } = useRecursos();
  const despachar = useDespachar();
  const suplemento = useFlujo((f) => f.sesion.suplemento);
  const elegida = useFlujo((f) => f.sesion.capsula);
  const imagen = useImagen(forma.imagen);
  const [x, y] = POSICIONES[indice] ?? POSICIONES[0];
  // La forma la decide el suplemento: las demás se ven, pero no se pueden tocar.
  const valida = catalogo.formasValidas(suplemento ?? '').includes(forma.id);

  return (
    <TarjetaImagen
      imagen={imagen}
      x={x}
      y={y}
      seleccionada={elegida === forma.id}
      desactivada={!valida}
      alActivar={() => despachar({ tipo: 'elegir', valor: forma.id })}
    >
      <span className={`${estilos.formaNombre} recortado`}>{forma.nombre}</span>
      <span className={`${estilos.formaTamanos} recortado`}>{forma.tamanos}</span>
    </TarjetaImagen>
  );
}

export function Capsula(): ReactNode {
  const contenido = useContenido();
  return (
    <>
      <Titulo lineas={contenido.pantallas.capsula.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      {contenido.formas.map((forma, i) => (
        <TarjetaForma key={forma.id} indice={i} forma={forma} />
      ))}
    </>
  );
}
