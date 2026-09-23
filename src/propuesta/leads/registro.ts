/**
 * Un lead tal como se guarda: los datos del visitante y el producto que diseñó
 * (para que ventas sepa qué le interesó). Nunca pasa por la telemetría, que es anónima.
 */
export interface RegistroLead {
  /** Uno por sesión: si el visitante vuelve a los leads y reenvía, se actualiza el mismo. */
  readonly id: string;
  /** ISO 8601 en hora local con su desfase. */
  readonly fecha: string;
  readonly nombre: string;
  readonly correo: string;
  readonly empresa: string;
  /** Texto de consentimiento que vio el visitante al enviar. */
  readonly consentimiento: string;
  readonly capsula: string;
  readonly categoria: string;
  readonly suplemento: string;
  readonly cantidad: string;
  readonly estilo: string;
  readonly color: string;
  readonly nombreProducto: string;
}

/** Columnas del CSV, en orden. */
export const COLUMNAS_LEAD: readonly (keyof RegistroLead)[] = [
  'id',
  'fecha',
  'nombre',
  'correo',
  'empresa',
  'consentimiento',
  'capsula',
  'categoria',
  'suplemento',
  'cantidad',
  'estilo',
  'color',
  'nombreProducto',
];

/**
 * Celda CSV. Entre comillas si hace falta, y con «'» delante si empieza por
 * = + - @ (Excel lo tomaría como fórmula: inyección de CSV).
 */
export function celdaCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[",;\r\n]/.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
}

export function filaCsv(registro: RegistroLead): string {
  return COLUMNAS_LEAD.map((columna) => celdaCsv(registro[columna])).join(',');
}

export const CABECERA_CSV = COLUMNAS_LEAD.join(',');

/** CSV completo con BOM (Excel abre así los acentos) y saltos CRLF. */
export function documentoCsv(registros: readonly RegistroLead[]): string {
  return `﻿${[CABECERA_CSV, ...registros.map(filaCsv)].join('\r\n')}\r\n`;
}
