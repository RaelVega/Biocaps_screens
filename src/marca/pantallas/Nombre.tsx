import { useState, type ReactNode } from 'react';
import { Teclado } from '../../motor/teclado/Teclado';
import { BotonPrimario } from '../componentes/BotonPrimario';
import { ajustarNombre, RotuloNombre } from '../componentes/RotuloNombre';
import { Titulo } from '../componentes/Titulo';
import { useContenido, useDespachar, useFlujo, useImagen } from '../estado';
import { normalizarNombre } from '../flujo';
import estilos from './Pantallas.module.css';

/**
 * PAG 07. El PDF solo dibuja título y botón; la vista previa y el teclado son
 * propuesta aprobada (22-09). La vista previa es la etiqueta plana del estilo
 * elegido con el nombre ya compuesto. Una tecla solo se acepta si el nombre
 * sigue cabiendo en la etiqueta plana **y** en el frasco terminado de PAG 10:
 * así ese rótulo nunca se desborda.
 */
export function Nombre(): ReactNode {
  const contenido = useContenido();
  const despachar = useDespachar();
  const nombre = useFlujo((f) => f.sesion.nombre);
  const idEstilo = useFlujo((f) => f.sesion.estilo);
  const estilo = contenido.estilos.find((e) => e.id === idEstilo) ?? contenido.estilos[0];
  if (!estilo) throw new Error('No hay estilos de etiqueta en el contenido');
  const plana = useImagen(estilo.etiquetaPlana);
  const { teclado } = contenido.pantallas.nombre;
  // Cada tecla rechazada vuelve a disparar el temblor de la vista previa (límite duro y visible).
  const [rechazos, setRechazos] = useState(0);

  const escribir = (caracter: string): void => {
    const candidato = normalizarNombre(nombre + caracter);
    if (candidato === nombre) return;
    const maximo = contenido.nombreProducto.maxCaracteres;
    const cabe =
      (maximo === null || candidato.length <= maximo) &&
      ajustarNombre(candidato, estilo.rotuladoPlano).cabe &&
      ajustarNombre(candidato, estilo.rotuladoFrasco).cabe;
    if (!cabe) {
      setRechazos((n) => n + 1);
      return;
    }
    despachar({ tipo: 'escribir', texto: candidato });
  };

  return (
    <>
      <Titulo lineas={contenido.pantallas.nombre.titulo} />
      <BotonPrimario texto={contenido.marco.botonFinalizar} />
      <div
        key={rechazos}
        className={rechazos > 0 ? `${estilos.vistaPrevia} ${estilos.vistaPreviaRechazo}` : estilos.vistaPrevia}
        style={{ width: plana.ancho, height: plana.alto }}
      >
        <img src={plana.url} width={plana.ancho} height={plana.alto} alt="" />
        <RotuloNombre texto={nombre} rotulado={estilo.rotuladoPlano} cursor />
      </div>
      <Teclado
        className={estilos.teclado}
        filas={teclado.filas}
        etiquetaEspacio={teclado.espacio}
        etiquetaBorrar={teclado.borrar}
        alTecla={escribir}
        alBorrar={() => despachar({ tipo: 'escribir', texto: nombre.slice(0, -1) })}
      />
    </>
  );
}
