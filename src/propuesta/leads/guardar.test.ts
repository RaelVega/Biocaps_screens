import * as v from 'valibot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import contenidoCrudo from '../../../contenido/contenido.json';
import propuestaCruda from '../../../variantes/propuesta/contenido/propuesta.json';
import { crearCatalogo } from '../../marca/contenido/catalogo';
import { esquemaContenido } from '../../marca/contenido/esquema';
import { crearAlmacenFlujo } from '../../motor/maquina/almacen';
import type { EventoFlujo } from '../../motor/maquina/maquina';
import { crearCatalogoPropuesta } from '../contenido/catalogo';
import { esquemaPropuesta } from '../contenido/esquema';
import { crearMaquinaPropuesta, OMITIR_LEAD } from '../flujo';
import { fechaLocal, iniciarExportacionLeads, iniciarGuardadoLeads } from './guardar';
import type { RegistroLead } from './registro';

const guardados: RegistroLead[] = [];
vi.mock('./almacen', () => ({
  guardarLeadLocal: (registro: RegistroLead) => {
    guardados.push(registro);
    return Promise.resolve();
  },
  leerLeadsLocales: () => Promise.resolve([...guardados]),
}));

const textos = v.parse(esquemaPropuesta, propuestaCruda);
const catalogo = crearCatalogoPropuesta(crearCatalogo(v.parse(esquemaContenido, contenidoCrudo)));
const AVANZAR: EventoFlujo = { tipo: 'avanzar', origen: 'visitante' };
const elegir = (valor: string): EventoFlujo => ({ tipo: 'elegir', valor });
const escribir = (campo: string, texto: string): EventoFlujo => ({ tipo: 'escribir', campo, texto });

/** Almacén real con el flujo de la propuesta, llevado hasta la pantalla de leads. */
function almacenEnLeads() {
  const almacen = crearAlmacenFlujo(crearMaquinaPropuesta(catalogo, textos));
  const eventos: EventoFlujo[] = [AVANZAR, elegir('redonda'), AVANZAR, elegir('higado-bacalao'), AVANZAR, elegir('30'), AVANZAR, elegir('moderno'), AVANZAR];
  eventos.push({ tipo: 'escribir', texto: 'MAR' }, AVANZAR, elegir('negro'), AVANZAR);
  for (const evento of eventos) almacen.getState().despachar(evento);
  expect(almacen.getState().flujo.paso).toBe('leads');
  return almacen;
}

describe('guardado de leads', () => {
  beforeEach(() => {
    guardados.length = 0;
  });
  afterEach(() => {
    delete window.kiosco;
  });

  it('guarda una vez al pasar a la fabricación, con el producto diseñado', () => {
    const almacen = almacenEnLeads();
    const anexarLead = vi.fn(() => Promise.resolve('leads.csv'));
    window.kiosco = { via: 'ejecutable', versionElectron: '', anexarTelemetria: () => Promise.resolve(''), informarHumo: () => {}, anexarLead };
    iniciarGuardadoLeads(almacen, textos);
    const { despachar } = almacen.getState();
    despachar(escribir('nombre', 'ANA'));
    despachar(escribir('correo', 'ana@gmail.com'));
    expect(guardados).toHaveLength(0);
    despachar(AVANZAR);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({ nombre: 'Ana', correo: 'ana@gmail.com', capsula: 'redonda', suplemento: 'higado-bacalao', color: 'negro', nombreProducto: 'MAR' });
    expect(anexarLead).toHaveBeenCalledOnce();
    almacen.destruir();
  });

  it('no guarda nada si se omite', () => {
    const almacen = almacenEnLeads();
    iniciarGuardadoLeads(almacen, textos);
    almacen.getState().despachar(elegir(OMITIR_LEAD));
    almacen.getState().despachar(AVANZAR);
    expect(almacen.getState().flujo.paso).toBe('fabricacion');
    expect(guardados).toHaveLength(0);
    almacen.destruir();
  });

  it('reenviar en la misma sesión reutiliza el id; otro visitante tiene otro', () => {
    const almacen = almacenEnLeads();
    iniciarGuardadoLeads(almacen, textos);
    const { despachar } = almacen.getState();
    despachar(escribir('nombre', 'ANA'));
    despachar(escribir('correo', 'ana@gmail.com'));
    despachar(AVANZAR);
    despachar({ tipo: 'avanzar', origen: 'sistema' });
    despachar({ tipo: 'retroceder' });
    despachar(escribir('empresa', 'BIOCAPS'));
    despachar(AVANZAR);
    expect(guardados.map((g) => g.id)).toEqual([guardados[0]?.id, guardados[0]?.id]);
    expect(guardados[1]?.empresa).toBe('Biocaps');
    almacen.destruir();

    const otro = almacenEnLeads();
    iniciarGuardadoLeads(otro, textos);
    otro.getState().despachar(escribir('nombre', 'LUIS'));
    otro.getState().despachar(escribir('correo', 'luis@gmail.com'));
    otro.getState().despachar(AVANZAR);
    expect(guardados[2]?.id).not.toBe(guardados[0]?.id);
    otro.destruir();
  });
});

describe('fecha del lead', () => {
  it('va en hora local con su desfase, en ISO 8601', () => {
    const texto = fechaLocal(new Date(2026, 8, 23, 11, 9, 57));
    expect(texto).toMatch(/^2026-09-23T11:09:57[+-]\d{2}:\d{2}$/);
    expect(new Date(texto).getTime()).toBe(new Date(2026, 8, 23, 11, 9, 57).getTime());
  });
});

describe('exportación con Ctrl+Shift+E', () => {
  afterEach(() => {
    delete window.kiosco;
  });

  it('en el ejecutable escribe el CSV completo y avisa cuántos leads exportó', async () => {
    guardados.length = 0;
    guardados.push({ ...crearRegistroDePrueba('a'), nombre: 'Ana' }, { ...crearRegistroDePrueba('b'), nombre: 'Luis' });
    const exportarLeads = vi.fn((_csv: string) => Promise.resolve('leads/exportacion.csv'));
    window.kiosco = { via: 'ejecutable', versionElectron: '', anexarTelemetria: () => Promise.resolve(''), informarHumo: () => {}, exportarLeads };
    const resultados: unknown[] = [];
    const detener = iniciarExportacionLeads((r) => resultados.push(r));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'E', ctrlKey: true, shiftKey: true }));
    await vi.waitFor(() => expect(resultados).toHaveLength(1));
    expect(resultados[0]).toEqual({ ok: true, cantidad: 2, destino: 'ejecutable' });
    expect(exportarLeads.mock.calls[0]?.[0]).toContain('Luis');
    detener();
  });

  it('si falla, avisa del fallo en vez de callar', async () => {
    window.kiosco = { via: 'ejecutable', versionElectron: '', anexarTelemetria: () => Promise.resolve(''), informarHumo: () => {}, exportarLeads: () => Promise.reject(new Error('disco lleno')) };
    const resultados: unknown[] = [];
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const detener = iniciarExportacionLeads((r) => resultados.push(r));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true, shiftKey: true }));
    await vi.waitFor(() => expect(resultados).toEqual([{ ok: false }]));
    detener();
    error.mockRestore();
  });

  it('ignora otras teclas', () => {
    const resultados: unknown[] = [];
    const detener = iniciarExportacionLeads((r) => resultados.push(r));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true }));
    expect(resultados).toEqual([]);
    detener();
  });
});

function crearRegistroDePrueba(id: string): RegistroLead {
  return { id, fecha: '2026-09-23T10:00:00-06:00', nombre: '', correo: 'x@gmail.com', empresa: '', consentimiento: 'ok', capsula: 'oval', categoria: 'omegas', suplemento: 'omega-3-n', cantidad: '30', estilo: 'moderno', color: 'azul', nombreProducto: 'X' };
}
