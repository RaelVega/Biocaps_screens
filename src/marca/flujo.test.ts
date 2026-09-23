import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import contenidoCrudo from '../../contenido/contenido.json';
import manifiestoCrudo from '../../contenido/manifiesto.json';
import type { EstadoFlujo, EventoFlujo } from '../motor/maquina/maquina';
import { crearCatalogo } from './contenido/catalogo';
import { esquemaContenido, esquemaManifiesto, validarReferencias } from './contenido/esquema';
import { crearMaquinaBiocaps, normalizarNombre, SESION_INICIAL, type PasoBiocaps, type SesionBiocaps } from './flujo';

// Estas pruebas usan el contenido real: si alguien edita contenido.json y rompe algo, fallan aquí.
const contenido = v.parse(esquemaContenido, contenidoCrudo);
const manifiesto = v.parse(esquemaManifiesto, manifiestoCrudo);
const catalogo = crearCatalogo(contenido);
const maquina = crearMaquinaBiocaps(catalogo);

type Estado = EstadoFlujo<PasoBiocaps, SesionBiocaps>;
const AVANZAR: EventoFlujo = { tipo: 'avanzar', origen: 'visitante' };
const elegir = (valor: string): EventoFlujo => ({ tipo: 'elegir', valor });
const aplicar = (estado: Estado, ...eventos: EventoFlujo[]): Estado => eventos.reduce((e, evento) => maquina.transicion(e, evento).estado, estado);

/** Suplementos cuya forma de cápsula falta en el documento de combinaciones. Quitar de aquí cuando llegue el dato. */
const SIN_FORMA_PENDIENTE = ['multivitaminico-a1-a4'];

describe('contenido', () => {
  it('cuadra con el manifiesto: toda imagen referida existe, incluidos los 30 frascos terminados', () => {
    expect(validarReferencias(contenido, manifiesto)).toEqual([]);
  });

  it('tiene los 32 suplementos del PDF en sus 6 categorías', () => {
    expect(contenido.suplementos).toHaveLength(32);
    expect(contenido.categorias.map((c) => contenido.suplementos.filter((s) => s.categoria === c.id).length)).toEqual([5, 7, 3, 7, 3, 7]);
  });

  it('cada suplemento tiene su forma en la matriz, salvo los pendientes conocidos', () => {
    const sinForma = contenido.suplementos.filter((s) => (contenido.formaPorSuplemento[s.id] ?? []).length === 0).map((s) => s.id);
    expect(sinForma).toEqual(SIN_FORMA_PENDIENTE);
  });

  it('los suplementos sin forma no se muestran en PAG 03; todos los que se muestran tienen exactamente una forma', () => {
    const visibles = contenido.categorias.flatMap((c) => catalogo.suplementosDe(c.id));
    expect(contenido.categorias.map((c) => catalogo.suplementosDe(c.id).length)).toEqual([5, 6, 3, 7, 3, 7]);
    expect(contenido.suplementos.filter((s) => !visibles.includes(s)).map((s) => s.id)).toEqual(SIN_FORMA_PENDIENTE);
    // Una sola forma: PAG 04 nunca llega con varias cápsulas desbloqueadas.
    for (const s of visibles) expect(catalogo.formasValidas(s.id), s.id).toHaveLength(1);
  });
});

describe('recorrido completo', () => {
  it('de la portada al QR con las elecciones del visitante', () => {
    const final = aplicar(
      maquina.inicial(),
      AVANZAR,
      elegir('omegas'),
      AVANZAR,
      elegir('omega-3-n'),
      AVANZAR,
      AVANZAR, // la cápsula ya viene elegida por el suplemento
      elegir('60'),
      AVANZAR,
      elegir('moderno'),
      AVANZAR,
      AVANZAR, // etiqueta 6.x: solo se mira
      { tipo: 'escribir', texto: 'relax flow' },
      AVANZAR,
      elegir('negro'),
      AVANZAR,
      { tipo: 'avanzar', origen: 'sistema' }, // fin de la fabricación
      AVANZAR,
    );
    expect(final.paso).toBe('qr');
    expect(final.sesion).toEqual({
      categoria: 'omegas',
      suplemento: 'omega-3-n',
      capsula: 'oval',
      cantidad: '60',
      estilo: 'moderno',
      nombre: 'RELAX FLOW',
      color: 'negro',
    });
    expect(catalogo.frascoFinal(final.sesion.estilo ?? '', final.sesion.color ?? '')).toBe('frasco-final-moderno-negro');
  });
});

describe('reglas de cada paso', () => {
  const enIngrediente = aplicar(maquina.inicial(), AVANZAR);
  const enSuplemento = aplicar(enIngrediente, elegir('omegas'), AVANZAR);

  it('SIGUIENTE no avanza sin elección', () => {
    expect(maquina.transicion(enIngrediente, AVANZAR).efecto).toBe('sinCambio');
    expect(maquina.transicion(enSuplemento, AVANZAR).efecto).toBe('sinCambio');
  });

  it('solo se pueden elegir suplementos de la categoría elegida', () => {
    expect(maquina.transicion(enSuplemento, elegir('zinc')).efecto).toBe('sinCambio');
    expect(maquina.transicion(enSuplemento, elegir('omega-3-salmon')).efecto).toBe('cambioSesion');
  });

  it('la forma de la cápsula queda elegida por el suplemento y las demás no se pueden tocar', () => {
    const enCapsula = aplicar(enSuplemento, elegir('omega-3-salmon'), AVANZAR);
    expect(enCapsula.sesion.capsula).toBe('oblonga');
    expect(maquina.transicion(enCapsula, elegir('oval')).efecto).toBe('sinCambio');
    expect(maquina.transicion(enCapsula, AVANZAR).estado.paso).toBe('cantidad');
  });

  it('un suplemento sin forma en la matriz no se puede elegir (no se muestra hasta que llegue el dato)', () => {
    const enSuplementoMulti = aplicar(enIngrediente, elegir('multivitaminicos'), AVANZAR);
    expect(maquina.transicion(enSuplementoMulti, elegir('multivitaminico-a1-a4'))).toMatchObject({ efecto: 'sinCambio', motivo: 'opcion_invalida:multivitaminico-a1-a4' });
  });

  it('cambiar de categoría borra el suplemento y la cápsula elegidos', () => {
    const estado = aplicar(enIngrediente, elegir('omegas'));
    const conSuplemento = { ...estado, sesion: { ...estado.sesion, suplemento: 'omega-3-n', capsula: 'oval' } };
    expect(aplicar(conSuplemento, elegir('marinos')).sesion).toMatchObject({ categoria: 'marinos', suplemento: null, capsula: null });
  });

  describe('nombre del producto', () => {
    const enNombre = aplicar(
      enSuplemento,
      elegir('omega-3-n'),
      AVANZAR,
      AVANZAR,
      elegir('30'),
      AVANZAR,
      elegir('naturista'),
      AVANZAR,
      AVANZAR,
    );

    it('llega al paso de nombre', () => expect(enNombre.paso).toBe('nombre'));

    it('se guarda en mayúsculas, con acentos y Ñ', () => {
      expect(aplicar(enNombre, { tipo: 'escribir', texto: 'señor ácido' }).sesion.nombre).toBe('SEÑOR ÁCIDO');
    });

    it('no pasa de 14 caracteres, contando espacios', () => {
      expect(aplicar(enNombre, { tipo: 'escribir', texto: 'RELAX FLOW MAX' }).sesion.nombre).toBe('RELAX FLOW MAX');
      expect(maquina.transicion(enNombre, { tipo: 'escribir', texto: 'RELAX FLOW MAXI' }).efecto).toBe('sinCambio');
    });

    it('rechaza caracteres que el teclado no tiene', () => {
      expect(maquina.transicion(enNombre, { tipo: 'escribir', texto: 'HOLA 😀' }).efecto).toBe('sinCambio');
      expect(maquina.transicion(enNombre, { tipo: 'escribir', texto: '<script>' }).efecto).toBe('sinCambio');
    });

    it('FINALIZAR no avanza con el nombre vacío o solo espacios', () => {
      expect(maquina.transicion(enNombre, AVANZAR).efecto).toBe('sinCambio');
      expect(maquina.transicion(aplicar(enNombre, { tipo: 'escribir', texto: '   ' }), AVANZAR).efecto).toBe('sinCambio');
    });
  });

  it('en PAG 09 el visitante no puede adelantar la fabricación', () => {
    const enFabricacion: Estado = { paso: 'fabricacion', sesion: SESION_INICIAL, avisoInactividad: false };
    expect(maquina.transicion(enFabricacion, AVANZAR).efecto).toBe('sinCambio');
    expect(maquina.transicion(enFabricacion, { tipo: 'avanzar', origen: 'sistema' }).estado.paso).toBe('terminado');
  });

  it('reiniciar borra el nombre y todo lo elegido', () => {
    const conNombre: Estado = { paso: 'terminado', sesion: { ...SESION_INICIAL, nombre: 'PRIVADO', estilo: 'moderno' }, avisoInactividad: false };
    expect(maquina.transicion(conNombre, { tipo: 'reiniciar', motivo: 'inactividad' }).estado).toEqual(maquina.inicial());
  });
});

describe('normalizarNombre', () => {
  it.each([
    ['relax flow', 'RELAX FLOW'],
    ['  floril', 'FLORIL'],
    ['power   caps', 'POWER CAPS'],
    ['ñandú', 'ÑANDÚ'],
  ])('«%s» → «%s»', (entrada, salida) => expect(normalizarNombre(entrada)).toBe(salida));
});
