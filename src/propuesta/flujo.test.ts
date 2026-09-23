import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import contenidoCrudo from '../../contenido/contenido.json';
import propuestaCruda from '../../variantes/propuesta/contenido/propuesta.json';
import { crearCatalogo } from '../marca/contenido/catalogo';
import { esquemaContenido } from '../marca/contenido/esquema';
import type { EstadoFlujo, EventoFlujo } from '../motor/maquina/maquina';
import { crearCatalogoPropuesta } from './contenido/catalogo';
import { esquemaPropuesta } from './contenido/esquema';
import { crearMaquinaPropuesta, OMITIR_LEAD, SESION_INICIAL_PROPUESTA, type PasoPropuesta, type SesionPropuesta } from './flujo';

// Contenido real: si alguien edita contenido.json o propuesta.json y rompe el flujo, falla aquí.
const contenido = v.parse(esquemaContenido, contenidoCrudo);
const textos = v.parse(esquemaPropuesta, propuestaCruda);
const catalogo = crearCatalogoPropuesta(crearCatalogo(contenido));
const maquina = crearMaquinaPropuesta(catalogo, textos);

type Estado = EstadoFlujo<PasoPropuesta, SesionPropuesta>;
const AVANZAR: EventoFlujo = { tipo: 'avanzar', origen: 'visitante' };
const RETROCEDER: EventoFlujo = { tipo: 'retroceder' };
const elegir = (valor: string): EventoFlujo => ({ tipo: 'elegir', valor });
const escribir = (campo: string, texto: string): EventoFlujo => ({ tipo: 'escribir', campo, texto });
const aplicar = (estado: Estado, ...eventos: EventoFlujo[]): Estado => eventos.reduce((e, evento) => maquina.transicion(e, evento).estado, estado);

/** Hasta el color, con una cápsula de varias categorías. */
const hastaColor = (): Estado =>
  aplicar(
    maquina.inicial(),
    AVANZAR,
    elegir('oval'),
    AVANZAR,
    elegir('naturales'),
    AVANZAR,
    elegir('jalea-real'),
    AVANZAR,
    elegir('60'),
    AVANZAR,
    elegir('naturista'),
    AVANZAR,
    { tipo: 'escribir', texto: 'FLORIL' },
    AVANZAR,
    elegir('azul'),
  );

describe('la cápsula decide lo demás', () => {
  it('cada forma admite al menos un suplemento', () => {
    for (const forma of contenido.formas) expect(catalogo.suplementosPorForma(forma.id).length, forma.id).toBeGreaterThan(0);
  });

  it('cada suplemento con forma aparece bajo su cápsula (los que no tienen forma, bajo ninguna)', () => {
    const alcanzables = new Set(contenido.formas.flatMap((f) => catalogo.suplementosPorForma(f.id).map((s) => s.id)));
    const fuera = contenido.suplementos.filter((s) => !alcanzables.has(s.id)).map((s) => s.id);
    expect(fuera).toEqual(['multivitaminico-a1-a4']);
  });

  it('ninguna categoría de una forma pasa de 7 suplementos (las 7 posiciones de PAG 03)', () => {
    for (const forma of contenido.formas) {
      for (const c of catalogo.categoriasPorForma(forma.id)) expect(catalogo.suplementosDeCategoriaYForma(c.id, forma.id).length).toBeLessThanOrEqual(7);
    }
  });

  it('empieza en la cápsula, sin nada elegido salvo el estilo de etiqueta', () => {
    const enCapsula = aplicar(maquina.inicial(), AVANZAR);
    expect(enCapsula.paso).toBe('capsula');
    expect(enCapsula.sesion).toEqual({ ...SESION_INICIAL_PROPUESTA, estilo: contenido.estilos[0]?.id });
  });

  it('solo muestra y acepta categorías y suplementos de la cápsula elegida', () => {
    const enIngrediente = aplicar(maquina.inicial(), AVANZAR, elegir('oblonga'), AVANZAR);
    expect(enIngrediente.paso).toBe('ingrediente');
    expect(maquina.transicion(enIngrediente, elegir('marinos')).efecto).toBe('sinCambio');
    const enSuplemento = aplicar(enIngrediente, elegir('omegas'), AVANZAR);
    expect(maquina.transicion(enSuplemento, elegir('omega-3-n')).efecto).toBe('sinCambio');
    expect(aplicar(enSuplemento, elegir('omega-3-salmon')).sesion.suplemento).toBe('omega-3-salmon');
  });

  it.each([
    ['redonda', 'marinos'],
    ['twist-off', 'twist-off'],
  ])('%s tiene una sola categoría: se elige sola y se salta PAG 02 en los dos sentidos', (forma, categoria) => {
    const enSuplemento = aplicar(maquina.inicial(), AVANZAR, elegir(forma), AVANZAR);
    expect(enSuplemento.paso).toBe('suplemento');
    expect(enSuplemento.sesion.categoria).toBe(categoria);
    expect(aplicar(enSuplemento, RETROCEDER).paso).toBe('capsula');
  });

  it('cambiar de cápsula borra lo que ya no cabe y conserva lo que sí', () => {
    const conOmega = aplicar(maquina.inicial(), AVANZAR, elegir('oblonga'), AVANZAR, elegir('omegas'), AVANZAR, elegir('omega-3-salmon'));
    // Omegas también existe en oval, pero Omega 3 de salmón no.
    const enOval = aplicar(conOmega, RETROCEDER, RETROCEDER, elegir('oval'));
    expect(enOval.sesion).toMatchObject({ capsula: 'oval', categoria: 'omegas', suplemento: null });
    // Volver a elegir la misma cápsula no borra nada.
    const igual = aplicar(conOmega, RETROCEDER, RETROCEDER, elegir('oblonga'));
    expect(igual.sesion).toMatchObject({ capsula: 'oblonga', categoria: 'omegas', suplemento: 'omega-3-salmon' });
  });
});

describe('etiqueta con su vista previa en la misma pantalla', () => {
  const enEtiqueta = aplicar(maquina.inicial(), AVANZAR, elegir('oval'), AVANZAR, elegir('naturales'), AVANZAR, elegir('jalea-real'), AVANZAR, elegir('60'), AVANZAR);

  it('entra con el primer estilo ya elegido y SIGUIENTE avanza sin tocar nada', () => {
    expect(enEtiqueta.paso).toBe('etiqueta');
    expect(enEtiqueta.sesion.estilo).toBe('naturista');
    expect(aplicar(enEtiqueta, AVANZAR).paso).toBe('nombre');
  });

  it('se cambia de estilo ahí mismo y no hay pantalla de detalle (PAG 6.x) antes del nombre', () => {
    const cambiado = aplicar(enEtiqueta, elegir('moderno'), elegir('deportivo'));
    expect(cambiado).toMatchObject({ paso: 'etiqueta', sesion: { estilo: 'deportivo' } });
    expect(maquina.definicion.orden).not.toContain('etiquetaDetalle');
    expect(aplicar(cambiado, AVANZAR, RETROCEDER).paso).toBe('etiqueta');
  });
});

describe('navegación hacia atrás', () => {
  it('conserva las elecciones al retroceder paso a paso', () => {
    const enColor = hastaColor();
    expect(enColor.paso).toBe('color');
    const enNombre = aplicar(enColor, RETROCEDER);
    expect(enNombre.paso).toBe('nombre');
    expect(enNombre.sesion).toMatchObject({ capsula: 'oval', suplemento: 'jalea-real', nombre: 'FLORIL', color: 'azul' });
  });

  it('desde la cápsula vuelve a la portada y reinicia', () => {
    const enCapsula = aplicar(maquina.inicial(), AVANZAR, elegir('oval'));
    expect(maquina.transicion(enCapsula, RETROCEDER)).toMatchObject({ efecto: 'reinicio', estado: maquina.inicial() });
  });

  it('desde el producto terminado salta la fabricación y vuelve a los leads', () => {
    const enTerminado = aplicar(hastaColor(), AVANZAR, elegir(OMITIR_LEAD), AVANZAR, { tipo: 'avanzar', origen: 'sistema' });
    expect(enTerminado.paso).toBe('terminado');
    expect(aplicar(enTerminado, RETROCEDER).paso).toBe('leads');
  });
});

describe('leads', () => {
  const enLeads = aplicar(hastaColor(), AVANZAR);

  it('van tras el color y antes de la fabricación', () => {
    expect(enLeads.paso).toBe('leads');
  });

  it('sin datos no se avanza; con nombre y correo válidos, sí (la empresa es opcional)', () => {
    expect(maquina.transicion(enLeads, AVANZAR)).toMatchObject({ efecto: 'sinCambio', motivo: 'falta_eleccion' });
    const conNombre = aplicar(enLeads, escribir('nombre', 'ANA LÓPEZ'), escribir('correo', 'ana@empresa'));
    expect(maquina.transicion(conNombre, AVANZAR).efecto).toBe('sinCambio');
    const completo = aplicar(conNombre, escribir('correo', 'ana@empresa.com.mx'));
    expect(completo.sesion.lead).toEqual({ nombre: 'Ana López', correo: 'ana@empresa.com.mx', empresa: '', omitido: false });
    expect(aplicar(completo, AVANZAR).paso).toBe('fabricacion');
  });

  it('rechaza campos desconocidos, caracteres no válidos y textos largos', () => {
    expect(maquina.transicion(enLeads, escribir('telefono', '55')).efecto).toBe('sinCambio');
    expect(maquina.transicion(enLeads, escribir('correo', 'ana lópez@x.com')).efecto).toBe('sinCambio');
    expect(maquina.transicion(enLeads, escribir('empresa', 'X'.repeat(41))).efecto).toBe('sinCambio');
    expect(maquina.transicion(enLeads, { tipo: 'escribir', texto: 'ANA' }).efecto).toBe('sinCambio');
  });

  it('OMITIR borra lo escrito y deja avanzar; volver a escribir anula la omisión', () => {
    const omitido = aplicar(enLeads, escribir('nombre', 'ANA'), elegir(OMITIR_LEAD));
    expect(omitido.sesion.lead).toEqual({ nombre: '', correo: '', empresa: '', omitido: true });
    expect(aplicar(omitido, AVANZAR).paso).toBe('fabricacion');
    expect(aplicar(omitido, escribir('nombre', 'A')).sesion.lead.omitido).toBe(false);
  });

  it('reiniciar deja el estado idéntico al del arranque: el siguiente visitante no ve los datos', () => {
    const conDatos = aplicar(enLeads, escribir('nombre', 'ANA'), escribir('correo', 'ana@gmail.com'));
    expect(aplicar(conDatos, { tipo: 'reiniciar', motivo: 'inactividad' })).toEqual(maquina.inicial());
  });
});
