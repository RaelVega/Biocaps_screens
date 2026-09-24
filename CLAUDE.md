# CLAUDE.md — Biocaps Screens

Kiosco táctil vertical para Expo FAC 2026. El contexto completo está en `contexto/`: `03` (qué se construye y por qué), `04` (design tokens aprobados), `05` (arquitectura y stack aprobados). Aquí solo van las reglas y trampas que no se ven leyendo el código.

**Todo en español:** respuestas, comentarios, identificadores y mensajes de commit.

## Fuente de verdad

- **El PDF de flujo (`assets-fuente/FLUJO DIAPOSITIVAS…pdf`) es diseño final aprobado por marketing.** Se replica tal cual, interactivo y con animación. No se proponen cambios de diseño (contraste, tamaños, posición del botón, estados nuevos), aunque choquen con los mínimos de `03 §9`.
- Jerarquía si algo se contradice: PDF → `contexto/03` → prototipo.
- Los valores de `04` salen medidos del PDF. Si una pantalla no coincide con su «página completa», se corrige el código, nunca el valor.
- Donde el PDF no dibuja algo (teclado de PAG 07, aviso de inactividad, error), **se pregunta, no se inventa**. Lista viva: `03 §17` y `_pendientes` en `contenido/contenido.json`.
- Ya decidido con Rael (22-09): tocar una tarjeta **la marca** y `SIGUIENTE`/`FINALIZAR` avanza solo si hay elección (sin elección es un no-op). En PAG 04 se ven las 4 formas y solo la del suplemento queda activa y ya elegida. No hay botón de volver: el PDF no lo tiene.
- `prototipos/` es solo de lectura (hay regla de deny) y está fuera de git. Nunca se importa código de ahí. La carpeta se llama `biocaps-kiosco`, con c.

## Rutas y archivos

- La ruta del proyecto tiene espacios y los assets tienen acentos: **entrecomillar siempre**, y probar cada script contra un nombre con acento. Ya rompió el `Caddyfile` una vez (`root * "{$RAIZ_WEB:web}"` va entre comillas por eso).
- El espejo de Drive está en `assets-fuente/`, dentro del repo pero **sin versionar**. `03 §1` dice `~/Desktop/…`: manda la carpeta real.
- **macOS guarda los acentos en NFD**: un nombre leído del disco (`PÁG 6.2`) no es igual, byte a byte, al mismo nombre escrito en el código. Toda comparación de rutas o nombres de archivo se hace con `.normalize('NFC')` por tramo, como en `ingesta/ingerir.mjs`.
- **Nunca renombrar el espejo.** Los nombres se normalizan en la ingesta (`npm run ingesta`, ver `ingesta/README.md`) con la tabla `ingesta/equivalencias.json`. `contenido/img/` y `contenido/manifiesto.json` los genera ese script: **no se editan a mano**. Las erratas conocidas están en `03 §16`. Ojo con estas:
  - En `PAG 6.1 FARMACÉUTICO/FARMACÉUTICO/`, `naturista {azul,gris,transparente}_1.png` **son frascos farmacéuticos**.
  - `PAG 3.2/tipo de suplemento .png` tiene un espacio antes de la extensión.
  - Los nombres de archivo no coinciden con las etiquetas del PDF: **manda el texto del PDF**.
- Los `página completa *.png` son referencia visual: **nunca se cargan en la app**.

## Arquitectura

- `src/motor/` es agnóstico de marca: nunca importa de `src/marca/` ni menciona «Biocaps». `src/marca/` sí puede importar del motor. La pantalla dual se hará copiando el repo y reemplazando `marca/` y `contenido/`, no con un sistema de temas.
- `src/humo/` es la prueba técnica de distribución. Se abre con `?humo` (navegador) o `--humo` (ejecutable, `prueba-tecnica.bat` en la USB). **No se borra mientras siga pendiente la prueba en Windows.**
- Estado de las pantallas: PAG 01–08 y PAG 11 replican el PDF (PAG 11 usa el QR de marketing, recortado de su página completa). PAG 09 lleva el frasco azul del PDF, que recorre la barra de principio a fin movido por el mismo progreso (el borde del relleno queda siempre detrás del frasco); es siempre el azul, sea cual sea el color elegido (convención de marca, Rael 23-09). En PAG 10 el nombre ya va en la caja del estilo; cajas, fuentes y colores de `rotuladoPlano`/`rotuladoFrasco` son provisionales hasta que lleguen las tipografías.
- Aprobado por Rael (22-09) aunque el PDF no lo dibuja: el contorno azul de la opción elegida (por fuera del cuerpo y detrás de la imagen, para no cortar cápsula ni frasco), la atenuación de las formas no válidas en PAG 04, la vista previa y el teclado de PAG 07, el aviso de inactividad y la pantalla de fallo (se ve con `?fallo`). El 23-09, en las dos variantes: el logo blanco centrado y «TOCA PARA INICIAR» sobre el video de portada (`pantallas.portada.logo` / `.invitacion`; `null` los quita si el video final ya los trae).
- **El nombre admite como máximo 14 caracteres (aprobado el 22-09) y además solo acepta una tecla si cabe en la caja de la etiqueta plana (PAG 07) y en la del frasco (PAG 10).** Una tecla rechazada hace temblar la vista previa. Si se cambia una caja o una fuente, correr `npm run estres`.
- En los CSS de `src/marca/pantallas/` no puede haber colores, radios, sombras, duraciones ni tamaños de texto literales: solo `var(--…)` de los tokens de `04`.

## Propuesta de Rael (segunda variante)

- Hay dos variantes de la experiencia sobre el mismo motor: **`pdf`** (`src/marca/`, la del PDF de marketing, la que va al evento) y **`propuesta`** (`src/propuesta/`, el flujo alternativo de Rael). Se elige **al construir**: `--mode propuesta` o `VITE_VARIANTE=propuesta`. El alias `@variante/App` (`vite.config.ts`) apunta a una u otra, así que la build de una no lleva código de la otra. En tiempo de ejecución, `__VARIANTE__` y `<html data-variante>`.
- `src/propuesta/` **no** está sujeta al PDF: allí manda el criterio de Rael. Sí cumple todas las demás reglas de este archivo (lienzo, tokens, `transform`/`opacity`, precarga, textos en JSON, sin `file://`…).
- Dependencias: `propuesta/` puede importar de `motor/` y de `marca/`; **`marca/` nunca importa de `propuesta/`** (lo comprueba `src/app/dependencias.test.ts`). Si la propuesta necesita un componente o pantalla distinta, **se copia** a `propuesta/` y se cambia ahí: nunca se edita `marca/` para acomodarla. Un cambio en `motor/` que pida la propuesta tiene que dejar igual la versión del PDF (`npm test` y `npm run visual`).
- Contenido: `variantes/propuesta/contenido/` se **superpone** encima de `contenido/` (en la build y, con un middleware, en desarrollo). Solo va ahí lo que cambie; las imágenes de la ingesta se reutilizan. Los textos propios van en `propuesta.json` (esquema en `src/propuesta/contenido/esquema.ts`), no en una copia de `contenido.json`.
- **Sustituciones de la build** (`VARIANTES.propuesta.sustituye` en `vite.config.ts`): en la build `propuesta`, cuando código de `src/marca/` importa `componentes/BotonPrimario.tsx`, recibe `src/propuesta/componentes/Navegacion.tsx` (ATRÁS + SIGUIENTE). Así las pantallas del PDF que se reutilizan llevan ATRÁS sin copiarlas. El sustituto exporta lo mismo con la misma firma. Las pantallas propias de la propuesta importan `Navegacion` directamente.
- Tipos: la sesión de la propuesta amplía la del PDF (`lead`) y los pasos añaden `leads`. El único cruce de tipos hacia las pantallas de `marca/` es `comoRecursosDeMarca()` en `src/propuesta/estado.ts`.
- **Flujo de la propuesta:** portada → **cápsula** → ingrediente → suplemento → cantidad → **etiqueta (con su vista previa)** → nombre → color → **leads** → fabricación → terminado → qr (`ORDEN_PROPUESTA` en `src/propuesta/flujo.ts`).
  - PAG 06 y PAG 6.x van fusionadas: la etiqueta del estilo elegido arriba (en su sitio de PAG 6.x) y los 5 estilos debajo para cambiarla ahí mismo. Se entra con el primer estilo ya elegido (la `sesionInicial` de la propuesta lo trae), así SIGUIENTE funciona sin tocar nada.
  - La cápsula va primero y filtra lo demás (`catalogo.categoriasPorForma` / `suplementosDeCategoriaYForma`, la matriz `formaPorSuplemento` leída al revés). No se ven opciones atenuadas: lo que no cabe no se muestra. Bajo la rejilla de PAG 04, «PUEDE CONTENER» lista los suplementos de la cápsula elegida.
  - Si la cápsula admite una sola categoría (redonda → Marinos, twist-off → Faciales), la categoría se elige sola y PAG 02 se salta en los dos sentidos (`omitir` del motor).
  - El Multivitamínico A-1 / A-4 no tiene forma: en la propuesta **no aparece bajo ninguna cápsula** hasta que llegue el dato (lo fija `src/propuesta/flujo.test.ts`).
  - ATRÁS despacha `retroceder` (el motor salta los pasos automáticos y los omitidos). Volver a la portada **reinicia** la sesión. En PAG 11, VOLVER AL INICIO reinicia con `motivo: 'fin'`.
- **Leads (solo en la propuesta):** nombre y correo obligatorios, empresa opcional, OMITIR avanza sin datos y borra lo escrito; va **casi invisible a propósito** (minúsculas en lila claro, abajo a la derecha, bajo el pie) para que solo lo use el staff o las pruebas. No se quita. El teclado del correo va sin espacio y con autocompletado de dominios y terminaciones (`dominios` / `terminaciones` en `propuesta.json`; lógica pura en `src/propuesta/leads/campos.ts`).
  - Se guardan al pasar de `leads` a `fabricacion`, en un suscriptor del almacén (`leads/guardar.ts`); la máquina sigue siendo pura. Van a IndexedDB (`biocaps-leads`) en todas las vías y, en el ejecutable, además a `leads/leads-AAAA-MM-DD.csv` junto al `.exe` (UTF-8 con BOM, CRLF, protegido contra fórmulas de Excel). Reenviar en la misma sesión reutiliza el `id`: en IndexedDB se actualiza, pero el CSV del día es un registro y puede repetir la fila.
  - `Ctrl+Shift+E` exporta los leads de IndexedDB: en el ejecutable, a `leads/exportacion-*.csv`; en el navegador, como descarga. Un aviso abajo (`componentes/AvisoExportacion.tsx`, 3,5 s, no se toca) confirma cuántos se exportaron y dónde, o que falló. Cuando se construya la exportación de telemetría, el mismo atajo tiene que exportar las dos cosas.
  - **Son datos personales:** nunca van a la telemetría, la USB los lleva en claro y el texto de consentimiento es provisional hasta que el cliente dé su aviso de privacidad (`_pendientes` de `propuesta.json`).
- Ejecutable aparte: «Biocaps Propuesta» (`electron-builder.propuesta.yml`, sale en `paquetes/propuesta/`), con sus propios `datos-kiosco/` y `telemetria/`. `armar:usb` sigue armando **solo** la versión del PDF.
- `dist/` es de la última variante construida: después de `build:propuesta` o `empaquetar:*:propuesta`, volver a correr `npm run build` antes de empaquetar o probar la del PDF.
- Netlify: la propuesta va en un sitio **propio** con `VITE_VARIANTE=propuesta`, nunca en `biocaps-screens` ni en `biocaps-screens-v2`.
- El tag `pdf-marketing-v1` marca la versión del PDF terminada. Si se aprueba la propuesta, se cambia la variante por defecto en `leerVariante()` y después se reordenan las carpetas.

```
npm run dev:propuesta             # http://localhost:5174 (a la vez que `npm run dev` en 5173)
npm run build:propuesta           # dist/ de la propuesta; `preview:propuesta` en 4174
npm run electron:dev:propuesta
npm run empaquetar:win:propuesta  # paquetes/propuesta/win-unpacked/Biocaps Propuesta.exe
npm run visual:propuesta [-- <url>]  # recorrido completo de la propuesta (por defecto 4174) → pruebas/visual/resultados-propuesta/
```

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
  - **Créditos (plan gratuito, 300 al mes):** cada despliegue de producción cuesta 15 y cada GB servido 20. Si se agotan, **se pausan todos los sitios del equipo**, incluido el prototipo del cliente, hasta el siguiente ciclo. El 23-09 se llegó al 75 %: **no publicar más en producción en Netlify**; los enlaces para enseñar van a GitHub Pages y Cloudflare Pages. Un *draft deploy* no gasta créditos.
- **C′ · GitHub Pages** (`.github/workflows/publicar-pages.yml`): cada push a `main` pasa `npm test` y `npm run lint`, construye las dos variantes y publica https://raelvega.github.io/Biocaps_screens/ (portada `cascaras/web/portal.html`), con `principal/` y `propuesta/`. Gratis y sin límite. No lee `_headers`: el noindex y la CSP ya van como `<meta>`. Si falla una prueba, no se publica.
- **C″ · Cloudflare Pages** (`npm run publicar:cloudflare`, sesión con `npx wrangler login`): https://biocaps-principal.pages.dev y https://biocaps-propuesta.pages.dev (cada publicación deja además una dirección propia con prefijo). Gratis, sin límite de ancho de banda y 500 publicaciones al mes. Sí lee `_headers`. Se publica a mano, no con cada push. Desde wrangler 4.138, `pages project create` intenta crear un Worker y falla con una carpeta estática: el script crea los proyectos con `--force`, que solo hace falta la primera vez.
- La CSP se inyecta **solo en la build** (plugin en `vite.config.ts`): el servidor de desarrollo necesita scripts en línea. Todo es `'self'`; ninguna vía puede cargar nada de fuera (restricción 1).

## Build y dependencias

- **Todas las dependencias van en `devDependencies` a propósito.** Vite ya las mete en el bundle; si pasan a `dependencies`, electron-builder las copia al asar (pasa de 1 a 24 MB).
- npm 11 bloquea los scripts de instalación. El binario de Electron se baja con `npx install-electron`.
- El `.exe` portable de un solo archivo (`empaquetar:win-portable`) necesita NSIS, que en Apple Silicon solo corre con Rosetta. La vía principal es la carpeta `win-unpacked`. `signExecutable: false` salta la firma sin depender de wine, y aun así incrusta el icono y el nombre en el `.exe`. El icono (símbolo de Biocaps, `cascaras/icono/icono.png`) lo genera `npm run icono` y sirve también de favicon en las dos variantes.
- El `.exe` va sin firmar: SmartScreen avisa («Más información → Ejecutar de todas formas»). No pide admin.

## Texto y tipografía

- Los textos se colocan con la clase `recortado` (`text-box: trim-both cap alphabetic`): su `top` es el borde superior de las mayúsculas, como se midió en el PDF.
- **Nunca un bloque de varias líneas con `text-box`**: según `white-space` o `font-stretch`, Chromium mete ~12 px de más entre líneas. Cada línea va en su propio elemento (ver `Titulo.tsx` y `TarjetaLista.tsx`); entre líneas, `gap: calc(interlineado - 1cap)`.
- Los saltos de línea que el PDF decide (p. ej. «COMPLEJO VITAMÍNICO Y / COENZIMA…») van como `\n` en el JSON, no se dejan al navegador.
- Archivo sustituye a Acumin **calibrada contra el PDF**: títulos 700 al 95 % de anchura, negritas 750 al 94 % (`--peso-*`, `--anchura-*`). Si se cambia la fuente, se recalibra con `npm run visual` (ancho de línea a menos del 3 % y mismo grosor de trazo).

## Lienzo y kiosco

- Lienzo fijo de 1080×1920, escalado como bloque. **Se centra con `position: absolute` + `translate(-50%, -50%) scale()`, nunca con grid/flex**: el lienzo mide más que la ventana y la imagen sale desplazada (ya pasó).
- La pantalla se rota desde Windows, **nunca por CSS**: si no, el touch deja de seguir a la imagen.
- Touch = clics de mouse. Sin hover, tooltips, desplegables ni scroll. La respuesta visual va en `pointerdown` y en menos de 100 ms.
- Sin `alert`, `confirm` ni `prompt`.
- Teclado propio en PAG 07, **nunca el de Windows** (tapa la interfaz y saca del modo kiosco).
- El cursor está oculto salvo en desarrollo o con `?cursor=1`.

## Máquina de estados

- El motor (`src/motor/maquina/maquina.ts`) es una función pura `transicion(estado, evento)`; el flujo de Biocaps y sus reglas están en `src/marca/flujo.ts`. Los componentes solo llaman a `despachar(evento)` del almacén. Nada de `set` sueltos.
- Una transición inválida es un no-op con motivo, que queda en `almacen.historial()`. Nunca una excepción.
- Los avances de la animación de PAG 09 van con `origen: 'sistema'`. La máquina ignora los del visitante en un paso automático y los del sistema en cualquier otro paso: así el fin de la animación y el respaldo nunca avanzan dos pantallas.
- Inactividad: aviso a los 45 s y reinicio a los 55 s. **Se pausa en PAG 09.** Los temporizadores usan un reloj inyectable (para las pruebas con relojes falsos).
- Reiniciar deja el estado **idéntico al del arranque**: el siguiente visitante no puede ver el nombre que escribió el anterior.
- El error boundary global vuelve a la portada y limpia la sesión.

## Reglas de negocio que no se ven en el PDF

- **La forma de la cápsula depende del suplemento elegido.** PAG 04 parece una elección libre y no lo es. La matriz `formaPorSuplemento` vive en `contenido.json`, normalizada contra los nombres del PDF (el documento original trae erratas). La regla está en `catalogo.formasValidas()`, no en las pantallas.
- **Multivitamínico A-1 / A-4 no tiene forma en la matriz** y no se rellena inventando. Mientras falte, **no se muestra en PAG 03** (`catalogo.suplementosDe()` deja fuera los suplementos sin forma; decisión de Rael, 23-09), así PAG 04 siempre llega con una sola cápsula. Cuando llegue el dato vuelve solo; entonces se quita de `SIN_FORMA_PENDIENTE` en `src/marca/flujo.test.ts`, que falla si aparece otro suplemento sin forma.
- Las tarjetas de PAG 04 y PAG 05 son las imágenes del cliente **con el texto borrado** en la ingesta: el nombre y los tamaños se escriben en vivo encima, desde el JSON.
- PAG 10 no compone capas: usa uno de los 30 renders `{estilo} {color}` y solo dibuja el nombre encima. Los frascos sin etiqueta de PAG 08 son para elegir el color. PAG 09 usa siempre `frasco transición.png` (id `frasco-transicion`), que solo existe en azul.
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
- **El panel de staff se descartó.** La telemetría sale por el NDJSON y por `Ctrl+Shift+E` (CSV, pendiente de construir). No construir panel ni PIN sin que se pida. Los leads existen solo en la propuesta (ver arriba).

## Comandos

```
npm run dev                    # http://localhost:5173, recarga en caliente de componentes y CSS; un cambio en contenido/ o en un .ts de src/ recarga la página entera
npm run build                  # tsc estricto + vite → dist/
npm test                       # Vitest
npm run lint                   # oxlint
npm run ingesta                # assets-fuente/ → contenido/img + manifiesto + referencias
npm run electron:dev           # build + Electron en ventana (KIOSCO=1 para kiosco)
npm run armar:usb              # paquetes/Biocaps-USB con las vías A, B y B′ + LEEME
npm run estres                 # nombres largos en los 5 estilos: ninguna línea fuera de su caja en PAG 07 ni PAG 10
npm run visual [-- <url>]      # recorrido completo en Chrome 1080×1920 + comparación con los mockups (pruebas/visual/resultados/)
npm run humo:navegador -- <url>  # prueba técnica (?humo) en Chrome contra cualquier vía
HUMO_SALIR=1 npx electron .    # prueba técnica en Electron; imprime HUMO_RESULTADO y sale
```

Antes de dar algo por terminado: `npm run build`, `npm test` y `npm run lint` en verde. Si hay cambios visuales, `npm run visual` (sin errores de consola, comparación con el PDF) y una captura en horizontal (1440×900). La prueba de resistencia de 8 h con toques aleatorios es criterio de entrega antes de viajar.
