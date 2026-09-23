import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { TarjetaLista } from '../componentes/TarjetaLista';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo, useRecursos } from '../estado';
import estilos from './Pantallas.module.css';

/** Bordes superiores de las tarjetas de PAG 03 tal como están en el PDF (no son equidistantes); caben 7 sin scroll. */
const ARRIBAS = [681, 835, 990, 1144, 1298, 1455, 1616] as const;

export function Suplemento(): ReactNode {
  const contenido = useContenido();
  const { catalogo } = useRecursos();
  const despachar = useDespachar();
  const categoria = useFlujo((f) => f.sesion.categoria);
  const elegido = useFlujo((f) => f.sesion.suplemento);
  const nombreCategoria = contenido.categorias.find((c) => c.id === categoria)?.nombre ?? '';

  return (
    <>
      <Titulo lineas={contenido.pantallas.suplemento.titulo} />
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      <p className={`${estilos.encabezadoCategoria} recortado`}>{nombreCategoria}</p>
      {catalogo.suplementosDe(categoria ?? '').map((suplemento, i) => (
        <TarjetaLista
          key={suplemento.id}
          variante="suplemento"
          texto={suplemento.nombre}
          arriba={ARRIBAS[i] ?? ARRIBAS[6]}
          seleccionada={elegido === suplemento.id}
          alActivar={() => despachar({ tipo: 'elegir', valor: suplemento.id })}
        />
      ))}
    </>
  );
}
