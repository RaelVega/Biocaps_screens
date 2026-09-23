import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import { urlContenido } from '../../motor/contenido/cargar';
import { VideoBucle } from '../../motor/video/VideoBucle';
import { useContenido, useDespachar, useImagen, useRecursos } from '../estado';
import estilos from './Pantallas.module.css';

/**
 * PAG 01: video de portada a pantalla completa; cualquier toque arranca.
 * Encima, el logo blanco centrado y la invitación «TOCA PARA INICIAR»
 * (provisionales mientras llega el video final; el PDF no los dibuja, los
 * pidió Rael el 23-09).
 */
export function Portada(): ReactNode {
  const despachar = useDespachar();
  const video = useRecursos().manifiesto.videos['portada'];
  const { logo, invitacion } = useContenido().pantallas.portada;
  return (
    <Presionable className={estilos.portada} alActivar={() => despachar({ tipo: 'avanzar', origen: 'visitante' })}>
      {video && <VideoBucle src={urlContenido(video.archivo)} className={estilos.video} />}
      {logo && <LogoPortada id={logo} />}
      {invitacion && <span className={`${estilos.invitacion} recortado`}>{invitacion}</span>}
    </Presionable>
  );
}

/** El logo va centrado en el lienzo por su tamaño real, sea cual sea la imagen. */
function LogoPortada({ id }: { id: string }): ReactNode {
  const imagen = useImagen(id);
  return (
    <img
      className={estilos.logoPortada}
      src={imagen.url}
      width={imagen.ancho}
      height={imagen.alto}
      style={{ marginLeft: -imagen.ancho / 2, marginTop: -imagen.alto / 2 }}
      alt="Biocaps"
    />
  );
}
