import { useState, type ReactNode } from 'react';
import estilosRotulo from '../../marca/componentes/RotuloNombre.module.css';
import { Titulo } from '../../marca/componentes/Titulo';
import { useContenido, useDespachar } from '../../marca/estado';
import estilosPdf from '../../marca/pantallas/Pantallas.module.css';
import { Presionable } from '../../motor/componentes/Presionable';
import { Teclado } from '../../motor/teclado/Teclado';
import { Navegacion } from '../componentes/Navegacion';
import { useFlujoPropuesta, useTextosPropuesta } from '../estado';
import { OMITIR_LEAD } from '../flujo';
import { aplicarSugerencia, CAMPOS_LEAD, caracteresValidos, correoValido, leadCompleto, normalizarCampo, sugerenciasCorreo, type CampoLead } from '../leads/campos';
import estilos from './Propuesta.module.css';

/** Bordes superiores de los tres campos. */
const ARRIBAS: Record<CampoLead, number> = { nombre: 500, correo: 632, empresa: 764 };

/**
 * Leads de la propuesta (tras el color, antes de la fabricación). Tres campos
 * y un teclado propio que cambia según el campo activo: el del correo trae
 * autocompletado de dominios y no tiene espacio. OMITIR avanza sin datos.
 */
export function Leads(): ReactNode {
  const contenido = useContenido();
  const { leads } = useTextosPropuesta();
  const despachar = useDespachar();
  const lead = useFlujoPropuesta((f) => f.sesion.lead);
  const [activo, setActivo] = useState<CampoLead>('nombre');
  // Cada rechazo vuelve a disparar el temblor del campo activo (límite duro y visible, como en PAG 07).
  const [rechazos, setRechazos] = useState(0);
  const valor = lead[activo];

  const escribir = (texto: string): void => {
    const candidato = normalizarCampo(activo, texto);
    if (candidato === valor) return;
    if (candidato.length > leads.campos[activo].maxCaracteres || !caracteresValidos(activo, candidato)) {
      setRechazos((n) => n + 1);
      return;
    }
    despachar({ tipo: 'escribir', campo: activo, texto: candidato });
  };

  // SIGUIENTE con datos incompletos: se lleva al visitante al primer campo que falta.
  const alBloqueado = (): void => {
    setActivo(lead.nombre.trim().length < 2 ? 'nombre' : 'correo');
    setRechazos((n) => n + 1);
  };

  const esCorreo = activo === 'correo';
  const teclado = esCorreo ? leads.tecladoCorreo : contenido.pantallas.nombre.teclado;
  const sugerencias = esCorreo
    ? sugerenciasCorreo(lead.correo, { dominios: leads.dominios, terminaciones: leads.terminaciones, maximo: leads.maxSugerencias })
    : [];

  return (
    <>
      <Titulo lineas={leads.titulo} />
      <Navegacion texto={contenido.marco.botonSiguiente} puedeAvanzar={lead.omitido || leadCompleto(lead)} alBloqueado={alBloqueado} />
      {CAMPOS_LEAD.map((campo) => {
        const esActivo = campo === activo;
        const clases = [estilos.campo, esActivo && rechazos > 0 && estilosPdf.vistaPreviaRechazo, campo === 'correo' && lead.correo && !correoValido(lead.correo) && estilos.campoIncompleto];
        return (
          <Presionable
            key={esActivo ? `${campo}-${rechazos}` : campo}
            className={clases.filter(Boolean).join(' ')}
            style={{ top: ARRIBAS[campo] }}
            seleccionado={esActivo}
            etiqueta={leads.campos[campo].etiqueta}
            alActivar={() => setActivo(campo)}
          >
            <span className={`${estilos.etiquetaCampo} recortado`}>{leads.campos[campo].etiqueta}</span>
            <span className={estilos.valorCampo}>
              <span className="recortado">{lead[campo]}</span>
              {esActivo && <span className={estilosRotulo.cursor} aria-hidden="true" />}
            </span>
          </Presionable>
        );
      })}
      <p className={estilos.consentimiento}>{leads.consentimiento}</p>
      <Presionable
        className={estilos.omitir}
        alActivar={() => {
          despachar({ tipo: 'elegir', valor: OMITIR_LEAD });
          despachar({ tipo: 'avanzar', origen: 'visitante' });
        }}
      >
        <span className={`${estilos.textoOmitir} recortado`}>{leads.omitir}</span>
      </Presionable>
      <Teclado
        className={estilos.tecladoLeads}
        filas={teclado.filas}
        etiquetaEspacio={contenido.pantallas.nombre.teclado.espacio}
        etiquetaBorrar={contenido.pantallas.nombre.teclado.borrar}
        sinEspacio={esCorreo}
        sugerencias={sugerencias}
        alSugerencia={(sugerencia) => escribir(aplicarSugerencia(lead.correo, sugerencia))}
        alTecla={(caracter) => escribir(valor + caracter)}
        alBorrar={() => despachar({ tipo: 'escribir', campo: activo, texto: valor.slice(0, -1) })}
      />
    </>
  );
}
