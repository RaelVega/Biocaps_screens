import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { ajustarTexto, crearMedidorCanvas } from '../../motor/rotulado/ajustar';
import type { Rotulado } from '../contenido/esquema';
import estilos from './RotuloNombre.module.css';

interface PropiedadesRotulo {
  texto: string;
  rotulado: Rotulado;
  /** Muestra el cursor parpadeante (PAG 07). */
  cursor?: boolean;
}

const ALINEACION: Record<Rotulado['alineacion'], CSSProperties['textAlign']> = { izquierda: 'left', centro: 'center', derecha: 'right' };

export function fuenteDe(rotulado: Rotulado): (cuerpo: number) => string {
  return (cuerpo) => `${rotulado.italica ? 'italic ' : ''}${rotulado.peso} ${cuerpo}px "${rotulado.fuente}"`;
}

/** Calcula el ajuste del nombre en la caja del estilo (lo usa también PAG 07 para rechazar teclas que ya no caben). */
export function ajustarNombre(texto: string, rotulado: Rotulado): ReturnType<typeof ajustarTexto> {
  const [, , ancho, alto] = rotulado.caja;
  const girado = rotulado.rotacion !== 0;
  return ajustarTexto({
    texto,
    ancho: girado ? alto : ancho,
    alto: girado ? ancho : alto,
    maxLineas: rotulado.maxLineas,
    cuerpoInicial: rotulado.cuerpoInicial,
    cuerpoMinimo: rotulado.cuerpoMinimo,
    interlineado: rotulado.interlineado,
    medir: crearMedidorCanvas(fuenteDe(rotulado)),
  });
}

/**
 * El nombre del producto dibujado en su caja, con la tipografía, color y
 * rotación del estilo. Debe ir dentro de un contenedor posicionado con las
 * medidas de la imagen a la que pertenece la caja.
 */
export function RotuloNombre({ texto, rotulado, cursor = false }: PropiedadesRotulo): ReactNode {
  const ajuste = useMemo(() => ajustarNombre(texto, rotulado), [texto, rotulado]);
  const [x, y, ancho, alto] = rotulado.caja;
  const girado = rotulado.rotacion !== 0;

  return (
    <div className={estilos.caja} style={{ left: x, top: y, width: ancho, height: alto }}>
      <div
        className={estilos.marco}
        style={{
          width: girado ? alto : ancho,
          height: girado ? ancho : alto,
          transform: `translate(-50%, -50%) rotate(${rotulado.rotacion}deg)`,
          fontFamily: `"${rotulado.fuente}"`,
          fontWeight: rotulado.peso,
          fontStyle: rotulado.italica ? 'italic' : 'normal',
          fontSize: ajuste.cuerpo,
          lineHeight: rotulado.interlineado,
          color: rotulado.color,
          textAlign: ALINEACION[rotulado.alineacion],
        }}
      >
        {ajuste.lineas.map((linea, indice) => (
          <span key={indice} className={estilos.linea}>
            {/* El cursor va fuera del flujo del texto: no ocupa ancho ni desplaza el nombre centrado. */}
            <span className={estilos.textoLinea}>
              {linea}
              {cursor && indice === ajuste.lineas.length - 1 && <span className={`${estilos.cursor} ${estilos.cursorTrasTexto}`} aria-hidden="true" />}
            </span>
          </span>
        ))}
        {cursor && ajuste.lineas.length === 0 && <span className={estilos.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}
