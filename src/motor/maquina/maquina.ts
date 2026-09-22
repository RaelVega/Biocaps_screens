/**
 * Máquina de estados del flujo, pura y sin dependencias de React ni de la
 * marca. La marca define los pasos y sus reglas (`DefinicionFlujo`); el
 * motor garantiza lo que vale para cualquier flujo:
 *
 * - todo cambio pasa por `transicion(estado, evento)`;
 * - una transición inválida devuelve el mismo estado con `efecto: 'sinCambio'`
 *   y un motivo, nunca lanza;
 * - reiniciar devuelve exactamente el estado inicial.
 */

/**
 * - `portada`: cualquier toque avanza.
 * - `eleccion`: se elige una opción; avanzar exige una elección válida.
 * - `texto`: se escribe; avanzar exige que la marca lo dé por válido.
 * - `informativo`: solo se mira; avanzar siempre se puede.
 * - `automatico`: avanza el sistema (fin de animación o respaldo), nunca el visitante.
 * - `cierre`: último paso; de ahí solo se sale reiniciando.
 */
export type TipoPaso = 'portada' | 'eleccion' | 'texto' | 'informativo' | 'automatico' | 'cierre';

export interface ReglasPaso<S> {
  readonly tipo: TipoPaso;
  /** Devuelve la sesión con la elección aplicada, o `null` si el valor no vale en este paso. */
  readonly elegir?: (sesion: S, valor: string) => S | null;
  /** Devuelve la sesión con el texto aplicado, o `null` si el texto no vale. */
  readonly escribir?: (sesion: S, texto: string) => S | null;
  /** Si falta, se puede avanzar siempre. */
  readonly puedeAvanzar?: (sesion: S) => boolean;
}

export interface DefinicionFlujo<P extends string, S> {
  readonly orden: readonly P[];
  readonly pasos: { readonly [K in P]: ReglasPaso<S> };
  readonly sesionInicial: S;
}

export interface EstadoFlujo<P extends string, S> {
  readonly paso: P;
  readonly sesion: S;
  readonly avisoInactividad: boolean;
}

export type MotivoReinicio = 'inactividad' | 'error' | 'fin';

export type EventoFlujo =
  | { readonly tipo: 'avanzar'; readonly origen: 'visitante' | 'sistema' }
  | { readonly tipo: 'elegir'; readonly valor: string }
  | { readonly tipo: 'escribir'; readonly texto: string }
  | { readonly tipo: 'actividad' }
  | { readonly tipo: 'avisarInactividad' }
  | { readonly tipo: 'reiniciar'; readonly motivo: MotivoReinicio };

export type Efecto = 'cambioPaso' | 'cambioSesion' | 'aviso' | 'reinicio' | 'sinCambio';

export interface ResultadoTransicion<P extends string, S> {
  readonly estado: EstadoFlujo<P, S>;
  readonly efecto: Efecto;
  /** Solo en `sinCambio`: por qué se ignoró el evento. */
  readonly motivo?: string;
}

export interface Maquina<P extends string, S> {
  readonly definicion: DefinicionFlujo<P, S>;
  inicial(): EstadoFlujo<P, S>;
  transicion(estado: EstadoFlujo<P, S>, evento: EventoFlujo): ResultadoTransicion<P, S>;
  tipoDe(paso: P): TipoPaso;
}

/** Eventos que genera una persona tocando la pantalla: todos quitan el aviso de inactividad. */
function esDelVisitante(evento: EventoFlujo): boolean {
  return evento.tipo === 'elegir' || evento.tipo === 'escribir' || evento.tipo === 'actividad' || (evento.tipo === 'avanzar' && evento.origen === 'visitante');
}

export function crearMaquina<P extends string, S>(definicion: DefinicionFlujo<P, S>): Maquina<P, S> {
  const { orden, pasos, sesionInicial } = definicion;
  const primero = orden[0];
  if (primero === undefined) throw new Error('El flujo no tiene pasos');
  if (new Set(orden).size !== orden.length) throw new Error('El flujo repite pasos');
  if (pasos[primero].tipo !== 'portada') throw new Error('El primer paso del flujo debe ser la portada');

  const inicial = (): EstadoFlujo<P, S> => ({ paso: primero, sesion: sesionInicial, avisoInactividad: false });

  function transicion(estado: EstadoFlujo<P, S>, evento: EventoFlujo): ResultadoTransicion<P, S> {
    const reglas = pasos[estado.paso];
    const sinCambio = (motivo: string): ResultadoTransicion<P, S> => {
      // Aun ignorado, un toque del visitante quita el aviso de inactividad.
      if (estado.avisoInactividad && esDelVisitante(evento)) {
        return { estado: { ...estado, avisoInactividad: false }, efecto: 'aviso', motivo };
      }
      return { estado, efecto: 'sinCambio', motivo };
    };

    switch (evento.tipo) {
      case 'reiniciar':
        return { estado: inicial(), efecto: 'reinicio' };

      case 'actividad':
        return estado.avisoInactividad ? { estado: { ...estado, avisoInactividad: false }, efecto: 'aviso' } : { estado, efecto: 'sinCambio', motivo: 'sin_aviso' };

      case 'avisarInactividad':
        if (reglas.tipo === 'portada' || reglas.tipo === 'automatico') return sinCambio(`sin_inactividad_en_${reglas.tipo}`);
        if (estado.avisoInactividad) return sinCambio('aviso_ya_activo');
        return { estado: { ...estado, avisoInactividad: true }, efecto: 'aviso' };

      case 'elegir': {
        if (!reglas.elegir) return sinCambio('paso_sin_eleccion');
        const sesion = reglas.elegir(estado.sesion, evento.valor);
        if (sesion === null) return sinCambio(`opcion_invalida:${evento.valor}`);
        return { estado: { ...estado, sesion, avisoInactividad: false }, efecto: 'cambioSesion' };
      }

      case 'escribir': {
        if (!reglas.escribir) return sinCambio('paso_sin_texto');
        const sesion = reglas.escribir(estado.sesion, evento.texto);
        if (sesion === null) return sinCambio('texto_invalido');
        return { estado: { ...estado, sesion, avisoInactividad: false }, efecto: 'cambioSesion' };
      }

      case 'avanzar': {
        if (reglas.tipo === 'cierre') return sinCambio('fin_del_flujo');
        if (reglas.tipo === 'automatico' && evento.origen !== 'sistema') return sinCambio('paso_automatico');
        if (reglas.tipo !== 'automatico' && evento.origen === 'sistema') return sinCambio('avance_de_sistema_fuera_de_paso_automatico');
        if (reglas.puedeAvanzar && !reglas.puedeAvanzar(estado.sesion)) return sinCambio('falta_eleccion');
        const siguiente = orden[orden.indexOf(estado.paso) + 1];
        if (siguiente === undefined) return sinCambio('sin_siguiente');
        return { estado: { ...estado, paso: siguiente, avisoInactividad: false }, efecto: 'cambioPaso' };
      }
    }
  }

  return { definicion, inicial, transicion, tipoDe: (paso) => pasos[paso].tipo };
}
