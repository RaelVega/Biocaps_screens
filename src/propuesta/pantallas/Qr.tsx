import type { ReactNode } from 'react';
import { useContenido, useDespachar, useImagen } from '../../marca/estado';
import estilosPdf from '../../marca/pantallas/Pantallas.module.css';
import { Presionable } from '../../motor/componentes/Presionable';
import { useTextosPropuesta } from '../estado';
import estilos from './Propuesta.module.css';

/**
 * PAG 11 en la propuesta: la del PDF más VOLVER AL INICIO, que termina la
 * sesión como el reinicio por inactividad (que se mantiene).
 */
export function Qr(): ReactNode {
  const { qr } = useContenido().pantallas;
  const { navegacion } = useTextosPropuesta();
  const despachar = useDespachar();
  const fondo = useImagen(qr.fondo);
  const logo = useImagen(qr.logo);
  const codigo = useImagen(qr.codigo);

  return (
    <>
      <img className={estilosPdf.fondoQr} src={fondo.url} width={fondo.ancho} height={fondo.alto} alt="" />
      <img className={estilosPdf.logoQr} src={logo.url} width={logo.ancho} height={logo.alto} alt="Biocaps" />
      <p className={`${estilosPdf.escaneaQr} recortado`}>{qr.escanea}</p>
      <img className={estilosPdf.codigoQr} src={codigo.url} width={codigo.ancho} height={codigo.alto} alt={qr.url ?? ''} />
      {/* Una línea por elemento: con text-box, Chromium no respeta el interlineado en bloques de varias líneas. */}
      <p className={`${estilosPdf.catalogoQr} recortado`}>{qr.catalogo[0]}</p>
      <p className={`${estilosPdf.catalogoQr} ${estilosPdf.catalogoQrSegunda} recortado`}>{qr.catalogo[1]}</p>
      <Presionable className={estilos.botonInicio} alActivar={() => despachar({ tipo: 'reiniciar', motivo: 'fin' })}>
        <span className={`${estilos.textoBotonInicio} recortado`}>{navegacion.inicio}</span>
      </Presionable>
    </>
  );
}
