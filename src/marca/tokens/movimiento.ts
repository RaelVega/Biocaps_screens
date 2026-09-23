/**
 * Tokens de movimiento: única fuente de curvas y duraciones. Motion los usa
 * desde aquí y `aplicarTokensMovimiento()` los publica como variables CSS
 * para las transiciones hechas en CSS.
 */
export const CURVA_ESTANDAR = [0.2, 0, 0, 1] as const;

export const DURACION = {
  entrada: 240,
  salida: 160,
  presion: 80,
  viajeFrasco: 560,
  fabricacion: 4000,
  fabricacionPausa: 400,
  respaldoFabricacion: 6000,
} as const;

/** Desplazamiento vertical del contenido al entrar una pantalla (0 con movimiento reducido). */
export const DESPLAZAMIENTO_ENTRADA = 24;

export function aplicarTokensMovimiento(raiz: HTMLElement = document.documentElement): void {
  raiz.style.setProperty('--curva-estandar', `cubic-bezier(${CURVA_ESTANDAR.join(', ')})`);
  for (const [nombre, ms] of Object.entries(DURACION)) raiz.style.setProperty(`--dur-${nombre}`, `${ms}ms`);
}
