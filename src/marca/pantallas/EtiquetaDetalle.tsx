import type { ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { useContenido, useFlujo, useImagen } from '../estado';
import estilos from './Pantallas.module.css';

/** PAG 6.1–6.5: la etiqueta plana del estilo elegido, grande, con su nombre debajo. Sin título, como en el PDF. */
export function EtiquetaDetalle(): ReactNode {
  const contenido = useContenido();
  const idEstilo = useFlujo((f) => f.sesion.estilo);
  const estilo = contenido.estilos.find((e) => e.id === idEstilo) ?? contenido.estilos[0];
  if (!estilo) throw new Error('No hay estilos de etiqueta en el contenido');
  const plana = useImagen(estilo.etiquetaPlana);

  return (
    <>
      <BotonPrimario texto={contenido.marco.botonSiguiente} />
      <img className={estilos.etiquetaPlana} src={plana.url} width={plana.ancho} height={plana.alto} alt="" />
      <p className={`${estilos.estiloNombre} recortado`}>{estilo.nombre}</p>
    </>
  );
}
