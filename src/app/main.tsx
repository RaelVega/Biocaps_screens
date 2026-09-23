import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../motor/kiosco/kiosco.css';
import '../marca/tokens/fuentes.css';
import '../marca/tokens/primitivos.css';
import '../marca/tokens/semanticos.css';
import '../marca/estilos-base.css';
import { PruebaHumo } from '../humo/PruebaHumo';
import { aplicarTokensMovimiento } from '../marca/tokens/movimiento';
import { endurecerKiosco } from '../motor/kiosco/endurecer';
import { Lienzo } from '../motor/lienzo/Lienzo';
// La versión del PDF o la propuesta, según la variante de build (vite.config.ts).
import { App } from '@variante/App';

const parametros = new URLSearchParams(window.location.search);
// En desarrollo el cursor se ve siempre; en el kiosco, solo con ?cursor=1.
if (import.meta.env.DEV || parametros.has('cursor')) document.documentElement.dataset['cursor'] = '';
// Qué variante corre (pdf o propuesta): para depurar y para etiquetar la telemetría.
document.documentElement.dataset['variante'] = __VARIANTE__;
aplicarTokensMovimiento();
endurecerKiosco();

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta #raiz en index.html');

// ?humo abre la prueba técnica de distribución en lugar de la experiencia (ver LEEME de la USB).
createRoot(raiz).render(
  <StrictMode>
    <Lienzo>{parametros.has('humo') ? <PruebaHumo /> : <App />}</Lienzo>
  </StrictMode>,
);
