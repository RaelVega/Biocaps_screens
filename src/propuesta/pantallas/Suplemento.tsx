import type { ReactNode } from 'react';
import { TarjetaLista } from '../../marca/componentes/TarjetaLista';
import { Titulo } from '../../marca/componentes/Titulo';
import { useContenido, useDespachar } from '../../marca/estado';
import estilosPdf from '../../marca/pantallas/Pantallas.module.css';
import { Navegacion } from '../componentes/Navegacion';
import { useFlujoPropuesta, useRecursosPropuesta } from '../estado';

/** Bordes superiores de las tarjetas de PAG 03 tal como están en el PDF (no son equidistantes); caben 7 sin scroll. */
const ARRIBAS = [681, 835, 990, 1144, 1298, 1455, 1616] as const;

/** PAG 03 en la propuesta: solo los suplementos de la categoría que caben en la cápsula elegida. */
export function Suplemento(): ReactNode {
  const contenido = useContenido();
  const { catalogo } = useRecursosPropuesta();
  const despachar = useDespachar();
  const capsula = useFlujoPropuesta((f) => f.sesion.capsula);
  const categoria = useFlujoPropuesta((f) => f.sesion.categoria);
  const elegido = useFlujoPropuesta((f) => f.sesion.suplemento);
  const nombreCategoria = contenido.categorias.find((c) => c.id === categoria)?.nombre ?? '';

  return (
    <>
      <Titulo lineas={contenido.pantallas.suplemento.titulo} />
      <Navegacion texto={contenido.marco.botonSiguiente} />
      <p className={`${estilosPdf.encabezadoCategoria} recortado`}>{nombreCategoria}</p>
      {catalogo.suplementosDeCategoriaYForma(categoria ?? '', capsula ?? '').map((suplemento, i) => (
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
