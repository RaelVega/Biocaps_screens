import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { TarjetaLista } from '../componentes/TarjetaLista';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo } from '../estado';

/** Tarjetas de PAG 02: primera en y = 580, cada 206.6 px. */
const ARRIBA = 580;
const PASO = 206.6;

export function Ingrediente(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const elegida = useFlujo((f) => f.sesion.categoria);
  return (
    <>
      <Titulo lineas={contenido.pantallas.ingrediente.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      {contenido.categorias.map((categoria, i) => (
        <TarjetaLista
          key={categoria.id}
          variante="ingrediente"
          texto={categoria.nombre}
          arriba={ARRIBA + i * PASO}
          seleccionada={elegida === categoria.id}
          alActivar={() => despachar({ tipo: 'elegir', valor: categoria.id })}
        />
      ))}
    </>
  );
}
