import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../motor/kiosco/kiosco.css';
import '../marca/tokens/fuentes.css';
import { endurecerKiosco } from '../motor/kiosco/endurecer';
import { Lienzo } from '../motor/lienzo/Lienzo';
import { PruebaHumo } from '../humo/PruebaHumo';

// En desarrollo el cursor se ve siempre; en el kiosco, solo con ?cursor=1.
if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('cursor')) document.documentElement.dataset['cursor'] = '';
endurecerKiosco();

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <Lienzo>
      <PruebaHumo />
    </Lienzo>
  </StrictMode>,
);
