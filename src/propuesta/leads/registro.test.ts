import { describe, expect, it } from 'vitest';
import { celdaCsv, documentoCsv, type RegistroLead } from './registro';

const REGISTRO: RegistroLead = {
  id: 'a1',
  fecha: '2026-09-23T10:00:00.000Z',
  nombre: 'Ana López',
  correo: 'ana@gmail.com',
  empresa: 'Farmacias "La Salud", S.A.',
  consentimiento: 'Acepto',
  capsula: 'oval',
  categoria: 'naturales',
  suplemento: 'jalea-real',
  cantidad: '60',
  estilo: 'naturista',
  color: 'azul',
  nombreProducto: 'FLORIL',
};

describe('CSV de leads', () => {
  it('entrecomilla lo que lleva comas o comillas', () => {
    expect(celdaCsv('Farmacias "La Salud", S.A.')).toBe('"Farmacias ""La Salud"", S.A."');
    expect(celdaCsv('Ana López')).toBe('Ana López');
  });

  it('neutraliza lo que Excel tomaría como fórmula', () => {
    expect(celdaCsv('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(celdaCsv('-2+3')).toBe("'-2+3");
    expect(celdaCsv('@SUMA')).toBe("'@SUMA");
  });

  it('lleva BOM, cabecera y CRLF para que Excel lo abra con acentos', () => {
    const csv = documentoCsv([REGISTRO]);
    expect(csv.startsWith('﻿id,fecha,nombre,correo,empresa,')).toBe(true);
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csv).toContain('a1,2026-09-23T10:00:00.000Z,Ana López,ana@gmail.com,"Farmacias ""La Salud"", S.A.",Acepto,oval,');
  });
});
