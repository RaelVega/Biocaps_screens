import type { ReactNode } from 'react';
import { useContenido, useImagen } from '../estado';
import estilos from './Pantallas.module.css';

/**
 * PAG 11. Única pantalla con tratamiento invertido (fondo propio y logo
 * blanco). El QR es el de marketing, recortado de su página completa en la
 * ingesta; lleva a `qr.url`. No hay botón: de aquí se sale por inactividad.
 */
export function Qr(): ReactNode {
  const { qr } = useContenido().pantallas;
  const fondo = useImagen(qr.fondo);
  const logo = useImagen(qr.logo);
  const codigo = useImagen(qr.codigo);

  return (
    <>
      <img className={estilos.fondoQr} src={fondo.url} width={fondo.ancho} height={fondo.alto} alt="" />
      <img className={estilos.logoQr} src={logo.url} width={logo.ancho} height={logo.alto} alt="Biocaps" />
      <p className={`${estilos.escaneaQr} recortado`}>{qr.escanea}</p>
      <img className={estilos.codigoQr} src={codigo.url} width={codigo.ancho} height={codigo.alto} alt={qr.url ?? ''} />
      {/* Una línea por elemento: con text-box, Chromium no respeta el interlineado en bloques de varias líneas. */}
      <p className={`${estilos.catalogoQr} recortado`}>{qr.catalogo[0]}</p>
      <p className={`${estilos.catalogoQr} ${estilos.catalogoQrSegunda} recortado`}>{qr.catalogo[1]}</p>
    </>
  );
}
