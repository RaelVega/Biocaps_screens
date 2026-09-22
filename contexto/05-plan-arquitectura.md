# Plan de arquitectura y stack — Biocaps Screens (aprobado el 22-09-2026)

## Contexto

`contexto/03-contexto-biocaps-para-claude-code.md` pide cerrar el stack (§12) y la arquitectura antes de escribir código, evaluados en orden contra: **1) animación de alto nivel, 2) ejecutable portable en USB, 3) publicable como link, 4) redundancia**. Esta entrega es solo eso. El plan de design tokens (§9) es el paso siguiente, no forma parte de esta entrega.

Fuentes leídas: el documento completo; el prototipo en `prototipos/biocaps-kiosco/` (con **c**, no con k como dice el documento); los mockups de `assets-fuente/` (PAG 04, PAG 09).

### Lo que enseña el prototipo (y qué se corrige)

| Hallazgo en el prototipo | Consecuencia |
|---|---|
| Para desplegarlo hay que instalar Node.js y Chrome, y `npm install` necesita internet la primera vez (`cascara/kiosco-chrome/README.md`) | **No cumple el criterio 2.** Es la carencia principal que hay que resolver |
| `biocaps.json` y `assets.json` se importan dentro del bundle (`src/contenido/cargar.ts:1-2`) | Cambiar un texto obliga a recompilar. **Rompe la restricción 7** |
| `rutaAsset()` devuelve rutas absolutas `/${archivo}` aunque `vite.config.ts` usa `base: './'` | Se rompe si se sirve desde una subruta o con un protocolo propio dentro del ejecutable |
| `AnimatePresence mode="wait"` en `Marco.tsx`, y ningún `layoutId` | La pantalla anterior se desmonta antes de que monte la nueva, así que **no hay elemento compartido posible**: el frasco no puede viajar |
| El avance automático vive dentro del store; el orden de pasos es el del brief antiguo (el color primero, con catálogo y leads) | El flujo de marketing es otro (§6). Se reescribe; no se adapta |
| Sirve y se reutiliza como **idea** (sin importar código): el escalado del lienzo con `transform: scale` y `ResizeObserver`, el `programarRespaldo`, la precarga con tiempo mínimo y máximo, el modo caos y los flags de Chrome en modo kiosco | Los patrones se reescriben limpios en `motor/` |

---

## 1. Stack recomendado

| Capa | Elección | Por qué (criterio) |
|---|---|---|
| Motor de render | **Chromium en todas las vías**: el de Electron en el ejecutable y Edge (viene con Windows 10/11) en el respaldo local | C1: una sola GPU y un solo pipeline de composición que perfilar. C2/C4: Edge ya está instalado y no pide admin |
| UI | **Vite + React 19 + TypeScript estricto** | Es lo que ya domina el equipo; Vite genera una carpeta estática con rutas relativas (C3) |
| Estilos | **CSS Modules + custom properties** para los tokens. Sin framework de CSS ni librería de componentes | Tokens en un solo lugar y capa de marca intercambiable (§4). Nada que descargar en tiempo de ejecución |
| Animación | **Motion como única librería de animación.** PAG 09 se mueve con **un solo `MotionValue` de progreso (0→1)** del que se derivan la barra (`scaleX`), la posición del frasco, el % escrito y los destellos | C1: el porcentaje es frame-exacto por construcción porque todo sale del mismo reloj. Se quita GSAP: una dependencia menos y un solo modelo de curvas. Solo se animan `transform` y `opacity` |
| Elemento compartido | **Capa de "escenario" persistente** encima de las pantallas: el frasco vive ahí y viaja entre **anclas con nombre** en coordenadas 1080×1920 que declara cada pantalla (PAG 08 → 09 → 10). Las pantallas usan `AnimatePresence mode="popLayout"` | C1: no dependemos de `layoutId`, que mide el DOM en px de la ventana y se distorsiona bajo el `scale()` del lienzo cuando la ventana no mide 1080×1920. Es determinista y cabe en el tope de 2 elementos animando a la vez |
| Estado | **Máquina pura** `transicion(estado, evento) → estado` (TS, sin librería) + **store Zustand** como adaptador para React. Los temporizadores van en un controlador aparte con reloj inyectable | §7: un único punto de transición, no-op registrado ante lo inválido, pruebas con relojes falsos |
| Contenido | `contenido/` **fuera del bundler**. Se carga con `fetch` relativo en el arranque y se valida con **Valibot** | Restricción 7: si el JSON editado a mano está mal, sale una pantalla de error legible y no una pantalla blanca |
| Rotulado del nombre | Texto DOM sobre el WebP del frasco. Un ajuste **por ancho medido** (`measureText` detrás de una interfaz inyectable) y una caja por estilo definida en el JSON | §8. La función es pura y se prueba sin navegador |
| QR | `qrcode` generado en local | §6 PAG 11 |
| Telemetría | IndexedDB (Dexie) en todas las vías **+ volcado NDJSON a un archivo** junto al ejecutable (puente IPC de Electron) | §11 y §15: la salida de la telemetría no depende de un panel |
| Ingesta de assets | Script Node + **sharp**: del espejo a WebP al tamaño exacto de pantalla, con tabla de equivalencias versionada | §8/§16: unos 30 MB de PNG a más de 4× pasan a WebP a 1× |
| Pruebas | **Vitest** (máquina, matriz, rotulado) + **Playwright** (e2e en Chromium y en Electron con `_electron.launch`, comparación visual contra las «página completa», resistencia de 8 h con muestreo de heap) | §14 |
| Lint | oxlint + `tsc --noEmit` | Rápido; ya probado en el prototipo |

### Criterio 2: por qué Electron y no Tauri ni Chrome más un servidor

- **Electron (elegido).** Build de Windows x64 con el target `dir` (una carpeta con el `.exe` dentro, que arranca con doble clic, sin instalación y sin admin) y además `portable` (un solo `.exe`). Trae su propio Chromium, así que no depende de lo que tenga instalado la laptop. Aporta de serie funciones de kiosco: `kiosk: true`, `powerSaveBlocker('prevent-display-sleep')` (cubre parte de "Windows domado"), bloqueo de zoom y menú contextual, y relanzar la ventana si el renderer se cae (`render-process-gone`). Sirve la app con un **protocolo propio privilegiado** (`app://`, `standard + secure + stream`): así IndexedDB funciona y el video admite peticiones por rango, que es justo lo que `file://` rompe. `contenido/` va en `extraResources`, fuera del asar, y se puede reemplazar sin recompilar.
- *Tauri, descartado:* usa el WebView2 que tenga el sistema, cuya versión varía (debilita C1), y exige Rust y compilación cruzada desde macOS.
- *Chrome/Edge + Node (lo que hace el prototipo), descartado como vía principal:* necesita instalar software → falla C2.
- **Operación recomendada:** llevar la carpeta `dir` en la USB y **copiarla al disco** de la laptop (no pide admin). Correr 8 h leyendo de una USB que alguien puede desconectar es un riesgo innecesario. El `.exe` portable queda como opción de arrancar directo desde la USB (se descomprime en %TEMP% y tarda más en abrir).
- **Aviso de SmartScreen:** un `.exe` sin firmar muestra «Windows protegió tu PC» → *Más información → Ejecutar de todas formas*. No pide admin, pero conviene saberlo antes del evento. La firma de código es opcional (tiene costo y plazo).

### Criterio 4: redundancia en capas, con el mismo `dist/`

| Capa | Arranque | Qué la tumba | Qué queda si cae |
|---|---|---|---|
| **A. Ejecutable Electron** | doble clic en `Biocaps.exe` | Una política corporativa que bloquea `.exe` sin firmar | B |
| **B. Servidor local + Edge** | `iniciar-respaldo.bat`: levanta **Caddy portable** (un binario, sirve rangos y MIME) en `localhost:4173` y abre Edge con `--kiosk` | Lo mismo que A si los `.exe` están bloqueados | B′ |
| **B′. Servidor sin exe** | `servir.ps1` con `System.Net.HttpListener` en localhost (no pide admin) + Edge | PowerShell restringido | C |
| **C. Link publicado** | Netlify con la misma build | Que no haya señal | — |

Nunca `file://`: ninguna capa lo usa y el `CLAUDE.md` lo dejará escrito.
Aviso: A y B tienen orígenes distintos, así que tienen IndexedDB separadas. Si a media expo se cambia de capa, se exportan las dos y se combinan en el cierre.

### Criterio 3: link

La misma `dist/`, con `base: './'` y todas las rutas relativas. Los nombres se normalizan a minúsculas en la ingesta (Netlify distingue mayúsculas). `netlify.toml` + `_headers` con `X-Robots-Tag: noindex`. Deploy con `netlify deploy --dir dist` a mano cada vez que haya avances que enseñar. Aviso: el link expone públicamente las etiquetas con su texto legal. Se confirma que eso no es un problema para el cliente.

---

## 2. Arquitectura del repo

```
/
├─ src/
│  ├─ motor/                 ← agnóstico de marca; nunca dice "Biocaps"
│  │  ├─ maquina/            transicion() pura, tipos de estado/evento, registro de no-ops
│  │  ├─ temporizadores/     inactividad 45/55 s (pausada en PAG 09), respaldo de animaciones, reloj inyectable
│  │  ├─ lienzo/             escalado 1080×1920 sin rotar
│  │  ├─ escenario/          capa persistente + anclas para el elemento compartido
│  │  ├─ movimiento/         curva única, 240/160 ms, variante con movimiento reducido
│  │  ├─ teclado/            teclado propio (Ñ, acentos, borrar), límite duro de caracteres
│  │  ├─ rotulado/           ajuste por ancho medido + partido en líneas
│  │  ├─ video/              <VideoBucle> con limpieza de buffer al desmontar
│  │  ├─ qr/  precarga/  telemetria/  contenido/ (cargador + validación genérica)
│  │  └─ kiosco/             error boundary, endurecimiento (selección, zoom, contextmenu, cursor), atajos de staff
│  ├─ marca/                 ← lo que se reemplaza para la pantalla dual
│  │  ├─ tokens/             (lo define el paso siguiente: plan de tokens)
│  │  ├─ fuentes-ui/         fuentes de interfaz, autoalojadas
│  │  ├─ esquema.ts          forma del contenido de Biocaps (Valibot)
│  │  ├─ flujo.ts            orden de pantallas PAG 01–11 → estados del motor
│  │  └─ pantallas/          Portada, Ingrediente, Suplemento, Capsula, Cantidad, Etiqueta, Nombre, Color, Fabricacion, Terminado, QR, Aviso, Error
│  └─ app/main.tsx           cableado motor + marca
├─ contenido/                ← fuera del bundler; se copia a dist/ y a extraResources
│  ├─ contenido.json         textos, catálogo, matriz suplemento→cápsula, cajas de rotulado por estilo
│  ├─ manifiesto.json        id → archivo, medidas
│  ├─ img/  video/  fuentes-etiqueta/
├─ ingesta/                  equivalencias.json (nombre del cliente → id), ingerir.mjs (sharp), README
├─ cascaras/
│  ├─ electron/              main.ts, preload.ts (puente telemetría → archivo), electron-builder.yml
│  ├─ respaldo-local/        Caddyfile, iniciar-respaldo.bat, servir.ps1 (Caddy.exe se descarga al empaquetar, no se versiona)
│  └─ web/                   netlify.toml, _headers
├─ pruebas/                  e2e/, visual/ (contra las «página completa»), resistencia/
└─ contexto/  prototipos/ (solo lectura)  assets-fuente/ (no versionado)
```

Frontera: `marca/` puede importar de `motor/`; al revés, nunca. Se hace cumplir con una regla de lint que prohíbe esos imports. No se construye un sistema de temas: la dual se hace copiando el repo y reemplazando `marca/` y `contenido/`.

Rutas: el origen de la ingesta se toma de `ORIGEN_ASSETS`, que por defecto es `./assets-fuente`. **Discrepancia:** el documento (§1, §16) dice `~/Desktop/BIOCAPS PANTALLA TÁCTIL`, pero el espejo real está en `assets-fuente/` dentro del repo. Hay que confirmar cuál manda y corregir el documento.

---

## 3. Decisiones de ingeniería que el documento pedía proponer

- **Duración de PAG 09:** 4,0 s de barra de 0 a 100 % (curva de salida suave, el frasco cruza con estelas), 0,4 s quieto en 100 % y luego el frasco viaja a PAG 10. **Respaldo a los 6,0 s.** Con movimiento reducido: la barra sola, sin desplazar el frasco. Aviso: `frasco transición.png` solo existe en azul; para los otros colores se usan los seis `frasco {color}` de PAG 08, y las estelas y los destellos se dibujan por código.
- **Texto en vivo, no PNG con texto quemado.** Los títulos y las tarjetas del cliente vienen como PNG con el texto incrustado (p. ej. `omegas.png`, 3609×446). Se renderizan como texto desde el JSON: así lo pide la restricción 7, el texto sale nítido y cada elemento se puede animar por separado. Esos PNG quedan como referencia. **Depende del riesgo de Acumin (§16)** y se resuelve en el plan de tokens.
- **Panel de staff (§15): recomiendo descartarlo.**

  | Opción | Costo | Cubre |
  |---|---|---|
  | Completo (5 toques + PIN + estadísticas + CSV + reinicio + versión) | ~1,5–2 días más pruebas | Todo, con superficie de fallo en pantalla |
  | Mínimo (solo exportar) | ~0,5 día | Solo la telemetría |
  | **Descartar (recomendado)** | ~0,25 día | Ver abajo |

  Cada necesidad sale por otro lado. **Telemetría:** la capa A la escribe sola en `telemetria/AAAA-MM-DD.ndjson` junto al ejecutable, y en todas las capas un atajo de teclado (`Ctrl+Shift+E`) descarga un CSV (la laptop tiene teclado). **Reinicio duro:** los 55 s de inactividad o cerrar y reabrir. **Versión:** en letra muy pequeña en la pantalla de arranque. **Estado de salud:** con mirar la pantalla basta.

---

## 4. Orden de ejecución (tras aprobar este plan)

0. **Prueba de humo de distribución, antes de construir pantallas** (lo exige §12): una página mínima con el lienzo, un video en bucle, una escritura en IndexedDB, una imagen y una fuente leídas de `contenido/`, y una animación de prueba de 60 fps. Se empaqueta y se verifica en las capas A, B, B′ y C.
1. **Plan de design tokens (§9): paso siguiente, para aprobación aparte.** Se extrae de las «página completa». Queda bloqueado en parte por las tipografías y por Acumin.
2. Derivar el `CLAUDE.md` (<200 líneas) de este plan y del de tokens.
3. Motor: máquina + temporizadores + pruebas → contenido e ingesta → pantallas.

## 5. Verificación del stack (criterios de salida del paso 0)

- **A:** en una máquina Windows x64 limpia (sin Node, sin Chrome, usuario estándar sin admin), doble clic desde la USB y también desde una copia en disco: abre en modo kiosco en menos de 10 s, el video está en bucle, lo escrito en IndexedDB sobrevive a un reinicio y aparece el NDJSON junto al `.exe`. Con el WiFi apagado.
- **B / B′:** el mismo `dist/` servido por Caddy y por `servir.ps1`, abierto en Edge `--kiosk`. El video admite rangos (se comprueba en la pestaña de red) y IndexedDB funciona.
- **C:** deploy en Netlify: carga sin errores de consola y las rutas funcionan en una subruta.
- **Rendimiento:** traza de Playwright/CDP de la animación de prueba sobre la GPU integrada disponible: ningún frame por encima de 16,7 ms de forma sostenida.
- **Build de Windows:** confirmar si electron-builder genera `dir`/`portable` desde macOS o si hace falta un runner `windows-latest` en CI. Es parte de la prueba de humo.

## 6. Pendientes que condicionan este plan

- Máquina Windows x64 de prueba: una laptop real o una VM x64. Una VM ARM en un Mac con Apple Silicon no sirve como prueba de GPU.
- Restricciones de admin o AppLocker en la laptop del stand (hoy sin confirmar; el diseño asume el peor caso).
- Si la exposición pública del link es aceptable (texto legal de las etiquetas).
- Ruta canónica del espejo de assets (`assets-fuente/` o `~/Desktop`).
- Nota del repo: `.gitignore` no excluye `prototipos/`. Un `git add .` metería el prototipo en el repo, incluido su `.env`. Propongo ignorarlo.
