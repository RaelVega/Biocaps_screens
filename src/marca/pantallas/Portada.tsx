import type { ReactNode } from 'react';
import { Presionable } from '../../motor/componentes/Presionable';
import { urlContenido } from '../../motor/contenido/cargar';
import { VideoBucle } from '../../motor/video/VideoBucle';
import { useDespachar, useRecursos } from '../estado';
import estilos from './Pantallas.module.css';

/** PAG 01: video de portada a pantalla completa; cualquier toque arranca. */
export function Portada(): ReactNode {
  const despachar = useDespachar();
  const video = useRecursos().manifiesto.videos['portada'];
  return (
    <Presionable className={estilos.portada} alActivar={() => despachar({ tipo: 'avanzar', origen: 'visitante' })}>
      {video && <VideoBucle src={urlContenido(video.archivo)} className={estilos.video} />}
    </Presionable>
  );
}
