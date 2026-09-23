import type { ReactNode } from 'react';
import { TarjetaLista } from '../../marca/componentes/TarjetaLista';
import { Titulo } from '../../marca/componentes/Titulo';
import { useContenido, useDespachar } from '../../marca/estado';
import { Navegacion } from '../componentes/Navegacion';
import { useFlujoPropuesta, useRecursosPropuesta } from '../estado';

/** Tarjetas de PAG 02: primera en y = 580, cada 206.6 px. */
const ARRIBA = 580;
const PASO = 206.6;

/** PAG 02 en la propuesta: solo las categorías que caben en la cápsula elegida, desde arriba y sin huecos. */
export function Ingrediente(): ReactNode {
  const contenido = useContenido();
  const { catalogo } = useRecursosPropuesta();
  const despachar = useDespachar();
  const capsula = useFlujoPropuesta((f) => f.sesion.capsula);
  const elegida = useFlujoPropuesta((f) => f.sesion.categoria);
  return (
    <>
      <Titulo lineas={contenido.pantallas.ingrediente.titulo} />
      <Navegacion texto={contenido.marco.botonSiguiente} />
      {catalogo.categoriasPorForma(capsula ?? '').map((categoria, i) => (
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
