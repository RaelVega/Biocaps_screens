import { useMemo, type ReactNode } from 'react';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { RotuloNombre } from '../componentes/RotuloNombre';
import { Titulo } from '../componentes/Titulo';
import type { Rotulado } from '../contenido/esquema';
import { useContenido, useFlujo, useImagen, useRecursos } from '../estado';
import estilos from './Pantallas.module.css';

/** Alto del frasco en el PDF (px del lienzo); la imagen ingerida mide 900. */
const ALTO_FRASCO_PDF = 881;

/**
 * PAG 10: el frasco terminado (estilo + color) en su lugar del PDF, con el
 * nombre compuesto en la caja del estilo, ajustado por ancho medido igual que
 * en PAG 07. PAG 07 ya garantizó que el nombre cabe aquí.
 */
export function Terminado(): ReactNode {
  const contenido = useContenido();
  const { catalogo } = useRecursos();
  const sesion = useFlujo((f) => f.sesion);
  const estilo = contenido.estilos.find((e) => e.id === sesion.estilo) ?? contenido.estilos[0];
  if (!estilo) throw new Error('No hay estilos de etiqueta en el contenido');
  const frasco = useImagen(catalogo.frascoFinal(estilo.id, sesion.color ?? contenido.colores[0]?.id ?? ''));

  // La caja del frasco se guarda relativa al centro: aquí se pasa a px de esta imagen concreta.
  const rotulado = useMemo((): Rotulado => {
    const [dx, y, ancho, alto] = estilo.rotuladoFrasco.caja;
    return { ...estilo.rotuladoFrasco, caja: [frasco.ancho / 2 + dx - ancho / 2, y, ancho, alto] };
  }, [estilo.rotuladoFrasco, frasco.ancho]);

  return (
    <>
      <Titulo lineas={contenido.pantallas.terminado.titulo} />
      <BotonPrimario texto={contenido.marco.botonFinalizar} />
      <div
        className={estilos.frascoTerminado}
        style={{ width: frasco.ancho, height: frasco.alto, transform: `translateX(-50%) scale(${ALTO_FRASCO_PDF / frasco.alto})` }}
      >
        <img src={frasco.url} width={frasco.ancho} height={frasco.alto} alt="" />
        <RotuloNombre texto={sesion.nombre} rotulado={rotulado} />
      </div>
    </>
  );
}
