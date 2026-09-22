# CLAUDE.md — Biocaps Screens

Kiosco táctil vertical para Expo FAC 2026. El contexto completo está en `contexto/`: `03` (qué se construye y por qué), `04` (design tokens aprobados), `05` (arquitectura y stack aprobados). Aquí solo van las reglas y trampas que no se ven leyendo el código.

**Todo en español:** respuestas, comentarios, identificadores y mensajes de commit.

## Fuente de verdad

- **El PDF de flujo (`assets-fuente/FLUJO DIAPOSITIVAS…pdf`) es diseño final aprobado por marketing.** Se replica tal cual, interactivo y con animación. No se proponen cambios de diseño (contraste, tamaños, posición del botón, estados nuevos), aunque choquen con los mínimos de `03 §9`.
- Jerarquía si algo se contradice: PDF → `contexto/03` → prototipo.
- Los valores de `04` salen medidos del PDF. Si una pantalla no coincide con su «página completa», se corrige el código, nunca el valor.
- Donde el PDF no dibuja algo (teclado de PAG 07, aviso de inactividad, error, comportamiento de PAG 04 y de `SIGUIENTE`), **se pregunta, no se inventa**. Lista viva: `03 §17`.
- `prototipos/` es solo de lectura (hay regla de deny) y está fuera de git. Nunca se importa código de ahí. La carpeta se llama `biocaps-kiosco`, con c.

## Rutas y archivos

- La ruta del proyecto tiene espacios y los assets tienen acentos: **entrecomillar siempre**, y probar cada script contra un nombre con acento. Ya rompió el `Caddyfile` una vez (`root * "{$RAIZ_WEB:web}"` va entre comillas por eso).
- El espejo de Drive está en `assets-fuente/`, dentro del repo pero **sin versionar**. `03 §1` dice `~/Desktop/…`: manda la carpeta real.
- **Nunca renombrar el espejo.** Los nombres se normalizan en la ingesta (`marca_categoria_identificador_variante_version.ext`, en minúsculas) con una tabla de equivalencias versionada. Las erratas conocidas están en `03 §16`. Ojo con estas:
  - En `PAG 6.1 FARMACÉUTICO/FARMACÉUTICO/`, `naturista {azul,gris,transparente}_1.png` **son frascos farmacéuticos**.
  - `PAG 3.2/tipo de suplemento .png` tiene un espacio antes de la extensión.
  - Los nombres de archivo no coinciden con las etiquetas del PDF: **manda el texto del PDF**.
- Los `página completa *.png` son referencia visual: **nunca se cargan en la app**.

## Arquitectura

- `src/motor/` es agnóstico de marca: nunca importa de `src/marca/` ni menciona «Biocaps». `src/marca/` sí puede importar del motor. La pantalla dual se hará copiando el repo y reemplazando `marca/` y `contenido/`, no con un sistema de temas.
- `src/humo/` es la prueba de humo temporal del paso 0. Se borra cuando `main.tsx` monte el flujo real; `pruebas/humo/navegador.mjs` se va con ella.
- En los CSS de `src/marca/pantallas/` no puede haber colores, radios, sombras, duraciones ni tamaños de texto literales: solo `var(--…)` de los tokens de `04`.

## Contenido fuera del bundle (restricción 7)

- `contenido/` no pasa por Vite: se copia tal cual a `dist/contenido/` y, en Electron, a `resources/contenido/` (fuera del asar).
- **Nunca `import` de un JSON de `contenido/`.** Todo se lee con `fetch` a través de `cargarJson()` / `urlContenido()` (`src/motor/contenido/cargar.ts`) y se valida con Valibot.
- **Nunca rutas absolutas (`/contenido/…`).** Todo es relativo al documento: la misma build corre en `app://`, en `localhost` y en una subruta de Netlify.
- Ninguna cadena visible para el visitante se escribe en un componente. El catálogo, la matriz de cápsulas, los estilos, los colores y las cajas de rotulado son datos.
- En la USB el contenido está **duplicado**: `1-EJECUTABLE/resources/contenido/` y `2-RESPALDO/web/contenido/`. Si se sustituye un archivo a mano, se sustituye en los dos.

## Las tres vías (misma `dist/`)

- **Nunca `file://`.** Rompe en silencio IndexedDB, las peticiones por rango y el video. El `index.html` trae un aviso sin JS que aparece a los 3 s si la app no arranca: no quitarlo (restricción 5, nada de pantallas en blanco).
- **A · Electron** (`cascaras/electron/`). Protocolo propio `app://biocaps/`, privilegiado.
  - El manejador implementa las peticiones por rango (206) a mano. Si se añade un tipo de archivo nuevo, hay que darlo de alta en `TIPOS` de `main.ts` **y** en `$tipos` de `servir.ps1`.
  - El preload es CommonJS (`preload.cjs`) porque el sandbox está activo.
  - `userData` y `telemetria/` van junto al `.exe`.
  - Ctrl+Shift+Q cierra el kiosco.
- **B · Caddy + Edge / B′ · PowerShell + Edge** (`cascaras/respaldo-local/`). Los servidores escuchan **solo en 127.0.0.1**: escuchar en todas las interfaces dispara el aviso del firewall de Windows, que pide admin. `servir.ps1` sirve los rangos abiertos en trozos de 4 MB porque atiende una petición a la vez.
- Los `.bat` y el `.ps1` van con CRLF, y el `.ps1` además con BOM (lo fija `.gitattributes`). Si no, PowerShell 5.1 y cmd los leen mal.
- **C · Netlify:** https://biocaps-screens-v2.netlify.app. `biocaps-screens.netlify.app` es el **prototipo** que ya vio el cliente: no publicar encima. El equipo protege los proyectos nuevos con inicio de sesión (`sso_login`), y en v2 se desactivó a propósito. El aviso de CSP en consola viene del script «hud» que inyecta Netlify: es inofensivo.
- La CSP se inyecta **solo en la build** (plugin en `vite.config.ts`): el servidor de desarrollo necesita scripts en línea. Todo es `'self'`; ninguna vía puede cargar nada de fuera (restricción 1).

## Build y dependencias

- **Todas las dependencias van en `devDependencies` a propósito.** Vite ya las mete en el bundle; si pasan a `dependencies`, electron-builder las copia al asar (pasa de 1 a 24 MB).
- npm 11 bloquea los scripts de instalación. El binario de Electron se baja con `npx install-electron`.
- El `.exe` portable de un solo archivo (`empaquetar:win-portable`) necesita NSIS, que en Apple Silicon solo corre con Rosetta. La vía principal es la carpeta `win-unpacked`. `signAndEditExecutable: false` evita depender de wine.
- El `.exe` va sin firmar: SmartScreen avisa («Más información → Ejecutar de todas formas»). No pide admin.

## Lienzo y kiosco

- Lienzo fijo de 1080×1920, escalado como bloque. **Se centra con `position: absolute` + `translate(-50%, -50%) scale()`, nunca con grid/flex**: el lienzo mide más que la ventana y la imagen sale desplazada (ya pasó).
- La pantalla se rota desde Windows, **nunca por CSS**: si no, el touch deja de seguir a la imagen.
- Touch = clics de mouse. Sin hover, tooltips, desplegables ni scroll. La respuesta visual va en `pointerdown` y en menos de 100 ms.
- Sin `alert`, `confirm` ni `prompt`.
- Teclado propio en PAG 07, **nunca el de Windows** (tapa la interfaz y saca del modo kiosco).
- El cursor está oculto salvo en desarrollo o con `?cursor=1`.

## Máquina de estados

- Una función pura `transicion(estado, evento)` y un único punto de entrada: `avanzar`, `retroceder`, `reiniciar`. Nada de `set` sueltos en los componentes.
- Una transición inválida es un no-op registrado, nunca una excepción.
- Inactividad: aviso a los 45 s y reinicio a los 55 s. **Se pausa en PAG 09.** Los temporizadores usan un reloj inyectable (para las pruebas con relojes falsos).
- Reiniciar deja el estado **idéntico al del arranque**: el siguiente visitante no puede ver el nombre que escribió el anterior.
- El error boundary global vuelve a la portada y limpia la sesión.

## Reglas de negocio que no se ven en el PDF

- **La forma de la cápsula depende del suplemento elegido.** PAG 04 parece una elección libre y no lo es. La matriz suplemento → forma vive en el JSON. El documento de combinaciones trae nombres con erratas: se normalizan contra la lista del PDF.
- **Multivitamínico A-1 / A-4 no tiene forma en la matriz.** La prueba «ningún suplemento sin forma válida» debe fallar hasta que Grupo AB dé el dato. No se rellena inventando.
- PAG 10 no compone capas: usa uno de los 30 renders `{estilo} {color}` y solo dibuja el nombre encima. Los frascos sin etiqueta de PAG 08 son para elegir el color y para PAG 09. `frasco transición.png` solo existe en azul.
- **El nombre se ajusta por ancho medido, no por número de caracteres.** El límite de caracteres solo aplica al campo de PAG 07 (duro y visible). La caja de cada estilo va en el JSON y admite rotación (en Moderno el nombre va vertical).
- La fuente del nombre la decide el estilo de etiqueta y se declara en su JSON, nunca en el CSS. Las carpetas `TIPOGRAFÍAS/` siguen vacías.
- **Acumin (la fuente de toda la interfaz del PDF) no se puede empaquetar** porque es de Adobe Fonts. Se usa Archivo, que es OFL, en `src/marca/fuentes-ui/` detrás de `--familia-interfaz`, ajustada hasta que la superposición con el PDF quede a menos del 3 %.

## Movimiento y rendimiento

- Solo se animan `transform` y `opacity`. Como máximo **2 elementos animando** a la vez. 60 fps sobre gráficos integrados: si hay que elegir, se sacrifica fidelidad antes que fluidez.
- El frasco viaja PAG 08 → 09 → 10 en una **capa de escenario persistente** con anclas en coordenadas del lienzo. **No usar `layoutId`**: mide en píxeles de la ventana y se deforma bajo el `scale()` del lienzo. Tampoco `AnimatePresence mode="wait"`: desmonta la pantalla antes de montar la siguiente y el elemento compartido deja de existir.
- PAG 09 no es un video. Un solo `MotionValue` de progreso mueve la barra, el %, el frasco y los destellos. El avance lo dispara el fin de la animación **o** el respaldo a los 6 s, lo que llegue primero.
- `prefers-reduced-motion`: mismas duraciones, sin desplazamientos.
- Todo se precarga en el arranque. **Nada de carga perezosa durante la sesión y cero spinners.**
- Video: siempre `<VideoBucle>`, que es `muted` + `playsInline`. Al desmontar pausa, quita el `src` y recarga el elemento; sin eso los buffers tumban el navegador en 4–6 h. El archivo va sin pista de audio y con el primer y el último fotograma iguales.

## Telemetría

- Es anónima, sin datos personales. Va a IndexedDB y, en la vía A, además a `telemetria/AAAA-MM-DD.ndjson` a través de `window.kiosco.anexarTelemetria`.
- A y B son orígenes distintos, así que cada una tiene su IndexedDB. Al cierre del evento se exportan las dos.
- **El panel de staff se descartó.** La telemetría sale por el NDJSON y por `Ctrl+Shift+E` (CSV, pendiente de construir). No construir panel, PIN ni leads sin que se pida.

## Comandos

```
npm run dev                    # http://localhost:5173, recarga en caliente (contenido/: recargar con Cmd+R)
npm run build                  # tsc estricto + vite → dist/
npm test                       # Vitest
npm run lint                   # oxlint
npm run electron:dev           # build + Electron en ventana (KIOSCO=1 para kiosco)
npm run armar:usb              # paquetes/Biocaps-USB con las vías A, B y B′ + LEEME
npm run humo:navegador -- <url>  # prueba de humo en Chrome contra cualquier vía
HUMO_SALIR=1 npx electron .    # prueba de humo en Electron; imprime HUMO_RESULTADO y sale
```

Antes de dar algo por terminado: `npm run build`, `npm test` y `npm run lint` en verde. Si hay cambios visuales, capturas en horizontal (1440×900) **y** en vertical (1080×1920). La prueba de resistencia de 8 h con toques aleatorios es criterio de entrega antes de viajar.
