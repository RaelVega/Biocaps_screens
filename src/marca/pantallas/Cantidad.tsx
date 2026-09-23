import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { TarjetaImagen } from '../componentes/TarjetaImagen';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo, useImagen } from '../estado';
import estilos from './Pantallas.module.css';

/** Cuerpos de las tarjetas de PAG 05 (x = 196). */
const ARRIBAS = [746, 1046, 1377] as const;

function TarjetaCantidad({ indice, presentacion }: { indice: number; presentacion: ReturnType<typeof useContenido>['presentaciones'][number] }): ReactNode {
  const despachar = useDespachar();
  const elegida = useFlujo((f) => f.sesion.cantidad);
  const imagen = useImagen(presentacion.imagen);
  return (
    <TarjetaImagen
      imagen={imagen}
      x={196}
      y={ARRIBAS[indice] ?? ARRIBAS[0]}
      seleccionada={elegida === presentacion.id}
      alActivar={() => despachar({ tipo: 'elegir', valor: presentacion.id })}
    >
      <span className={`${estilos.cantidadRotulo} recortado`}>{presentacion.rotulo}</span>
      <span className={`${estilos.cantidadNombre} recortado`}>{presentacion.nombre}</span>
    </TarjetaImagen>
  );
}

export function Cantidad(): ReactNode {
  const contenido = useContenido();
  return (
    <>
      <Titulo lineas={contenido.pantallas.cantidad.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      {contenido.presentaciones.map((presentacion, i) => (
        <TarjetaCantidad key={presentacion.id} indice={i} presentacion={presentacion} />
      ))}
    </>
  );
}
