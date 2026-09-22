# Contexto del proyecto — Biocaps Screens (Expo FAC 2026)

Versión 2 · 21 de septiembre de 2026
Consolidado de: `00-decisiones-base-expo-fac-2026.md`, `01-especificacion-de-assets.md`, `02-arranque-tecnico-y-claude-code.md`, el PDF de flujo del área de marketing y el inventario real de la carpeta de Drive.

---

## 0. Cómo usar este archivo

Este **no** es un `CLAUDE.md`. Es el documento de contexto del que sale todo lo demás.

Orden de trabajo esperado:

1. Leer este archivo completo.
2. Leer el prototipo en `prototipos/biocaps-kiosko/` como referencia y el PDF de flujo como **especificación visual vinculante**.
3. Proponer, en modo plan, la **arquitectura y el stack definitivo** (sección 12) y el **plan de design tokens** (sección 9) — sin escribir código ni CSS hasta que estén aprobados.
4. De ese plan aprobado se deriva el `CLAUDE.md` del repo: corto (<200 líneas), solo restricciones y trampas que no se deducen leyendo el código.

Regla de trabajo: **este archivo describe el resultado esperado, no dicta la implementación.** Donde algo esté marcado como NO NEGOCIABLE, es literal. Todo lo demás está abierto a que propongas algo mejor, siempre que lo justifiques antes de escribirlo.

**Jerarquía de fuentes cuando algo se contradiga:** el flujo del área de marketing (PDF + carpetas de Drive) manda sobre este documento; este documento manda sobre el prototipo; el prototipo es solo referencia.

---

## 1. Rutas del entorno

| Qué | Ruta |
|---|---|
| Proyecto nuevo (aquí se construye) | `rael/Proyectos Claude Code/Biocaps Screens` |
| Prototipo de referencia (solo lectura) | `rael/prototipos/biocaps-kiosko` |
| **Assets y flujo — copia local de trabajo** | `~/Desktop/BIOCAPS PANTALLA TÁCTIL` |
| Assets y flujo — fuente viva del cliente | `Google Drive/Mi unidad/ BIOCAPS PANTALLA TÁCTIL` (carpeta compartida, propietaria: ambar@xestionintelixente.com) |

**La copia local es la que se lee.** Es un espejo completo de la carpeta de Drive, descargado el 21 de septiembre. Se trabaja siempre contra ella: está entera en disco, no depende de sincronización y no se rompe a media compilación. Drive sigue siendo la fuente donde el cliente sube material nuevo, así que cuando lleguen entregas (el video de portada, las tipografías que faltan, los frascos rosa y gris) se vuelve a bajar y se anota la fecha de la nueva copia en la sección 16.

En el Finder en español la carpeta se ve dentro de «Escritorio», pero **la ruta real siempre es `~/Desktop`**, nunca `~/Escritorio`. Es el error típico al escribir el primer script.

**Tres advertencias sobre estas rutas:**

- La ruta del proyecto y la de los assets **contienen espacios**, y los archivos de dentro además llevan acentos (`página completa color del frasco.png`). Todo script, comando y configuración debe entrecomillar rutas, y conviene probar cada script contra un nombre con acento antes de darlo por bueno.
- **La carpeta de assets vive fuera del repo y no se versiona.** Son PNG grandes y material de origen; al repo solo entra lo ya procesado, en la carpeta de contenido de la app.
- Los nombres del cliente no siguen la convención de `01-especificacion-de-assets.md`. **No se renombra el espejo**: se renombra en el paso de ingesta, dejando una tabla de equivalencias en el repo, para que la próxima copia de Drive siga encajando sin trabajo manual.

El prototipo se lee, nunca se modifica ni se importa código desde él.

---

## 2. El proyecto en una frase

Una web app de pantalla táctil vertical, ejecutada localmente en una laptop, donde un visitante de feria **configura su propio suplemento de marca propia** paso a paso y ve el producto terminado — para demostrar, sin que nadie se lo explique, que Biocaps hace maquila llave en mano.

---

## 3. Contexto de negocio

**El evento.** Expo FAC 2026, Ciudad de México, octubre. Stand de Grupo AB.

**Las tres marcas de Grupo AB:**

- **Biocaps** — protagonista de esta app. Maquila de suplementos, enfoque industrial, argumento comercial "llave en mano".
- **Juveternal** — skincare dermatológico, diseño limpio y moderno. (Segunda app.)
- **PM Anáhuac** — naturista tradicional, ligada a su mascota, el zorro **Shu**. (Segunda app.)

**El público.** Dueños de cadenas de farmacias (25–50 sucursales), spas, fisioterapeutas. Perfil empresarial, edad promedio alta, **se enorgullecen de saber distinguir**. Esto define el tono: lenguaje comercial, ritmo pausado, nada infantil.

**El problema que resuelve la pantalla.** El staff del stand se satura. La pantalla retiene y entretiene a quien espera turno, y muestra el catálogo de capacidades de Biocaps sin que un vendedor tenga que explicarlo.

**Lo que la pantalla NO debe hacer:** duplicar el exhibidor holográfico ni las cápsulas físicas que ya están en el stand.

---

## 4. Alcance y secuencia

**Se construye primero Biocaps, completo y funcionando. Después, ese mismo proyecto se usa como base para la pantalla dual (Juveternal + PM Anáhuac).**

La pantalla dual es un proyecto separado que nacerá de una copia de este. Consecuencia arquitectónica, y es la única razón por la que importa:

- Todo lo que es **motor** (máquina de estados, temporizadores, escalado del lienzo, teclado, QR, error boundary, telemetría, componentes base) debe vivir separado de todo lo que es **marca** (colores, tipografías, copy, composición de pantallas, arte).
- La separación se hace por carpetas y por tokens, no con abstracciones elaboradas. No hay que construir un sistema de temas configurable: hay que poder copiar el repo y reemplazar la capa de marca sin tocar el motor.
- Biocaps ya está aprobado tal cual. La dual traerá más modificaciones y su mecánica aún no está decidida por el cliente.

Si hay que elegir entre entregar Biocaps a tiempo o dejar el motor más reutilizable: **gana Biocaps a tiempo.**

---

## 5. Restricciones no negociables

1. **100 % offline.** Nada de CDN, fuentes remotas, analytics ni llamadas de red en tiempo de ejecución. Todo el arte, fuentes, datos y librerías viven en local. La app debe funcionar con el WiFi apagado.
2. **Lienzo vertical 1080×1920. Resolución confirmada.** El PDF de flujo viene exactamente a esa medida (páginas de 1080×1920 pt), así que los mockups se trasladan 1:1 sin reinterpretar proporciones. Escalado proporcional para cualquier ventana distinta, pero el diseño se hace contra 1080×1920.
3. **La pantalla se rota desde Windows, nunca por CSS.** Si se rota por software vía CSS, el touch deja de seguir a la imagen.
4. **Touch se comporta como mouse.** Las pantallas del stand emulan clics. No hay gestos multitáctiles, no hay hover, no hay tooltips.
5. **Ningún camino termina en pantalla blanca.** Todo error y toda transición inválida lleva a un estado visible y recuperable.
6. **Sesiones de 8 horas continuas.** Sin fugas de memoria, sin degradación, sin quemado de pantalla.
7. **El contenido se sustituye sin recompilar.** Textos y catálogo en JSON; imágenes en una carpeta de contenido fuera del bundler, reemplazables por nombre de archivo.
8. **Sin `alert`, `confirm` ni `prompt` nativos** en ningún camino del código.

---

## 6. El flujo de pantallas (definido por el área de marketing)

Fuente: `FLUJO DIAPOSITIVAS PANTALLA TÁCTIL BIOCAPS_organized (1).pdf` (19 páginas, 1080×1920) más las carpetas `PAG 01`–`PAG 11` de Drive. **Este es el flujo que se construye.** No hay límite de duración impuesto: la experiencia dura lo que el visitante tarde.

```
PAG 01  PORTADA — video (pendiente de entrega)
PAG 02  SELECCIONA EL INGREDIENTE         → 6 categorías
PAG 03  SELECCIONA EL TIPO DE SUPLEMENTO  → sublista según la categoría (3.1–3.6)
PAG 04  ELIGE EL TIPO DE CÁPSULA          → 4 formas
PAG 05  ELIGE LA CANTIDAD DE CÁPSULAS     → 3 presentaciones
PAG 06  SELECCIONA EL TIPO DE ETIQUETA    → 5 estilos (6.1–6.5)
PAG 07  NOMBRA TU PRODUCTO                → teclado en pantalla
PAG 08  ELIGE EL COLOR DE TU FRASCO       → 6 colores
PAG 09  TRANSICIÓN                        → "Se está fabricando tu producto" + barra de progreso
PAG 10  CONOCE TU PRODUCTO TERMINADO      → el frasco compuesto
PAG 11  CÓDIGO QR                         → al catálogo completo
```

### Elementos constantes del marco

Presentes en todas las pantallas del PDF:

- **Logo Biocaps arriba, centrado.**
- **Título en mayúsculas**, dos líneas, centrado, tipografía pesada gris oscuro.
- **Botón primario azul con degradado y flecha**, centrado justo debajo del título. Dice `SIGUIENTE →` en casi todas y `FINALIZAR →` en PAG 07 y PAG 10.
- **Pie de página fijo:** "Cada elección da forma a tu producto".
- Fondo blanco. Tarjetas de opción en lila claro con esquinas muy redondeadas y sombra suave.

**Observación sobre el botón:** en los mockups el botón principal está **arriba, debajo del título**, no al pie. Es una decisión de diseño del área de marketing; respétala aunque sea inusual. Sí conviene señalar que queda fuera de la zona táctil cómoda de una pantalla vertical de gran formato (90–150 cm de altura física) y **preguntar antes de moverlo**.

### Pantalla por pantalla

**PAG 01 · Portada (video).** La primera pantalla es un **video**, pendiente de entrega por parte del cliente. La carpeta `PAG 01 PORTADA` de Drive está vacía hoy. Construir la pantalla con un video de relleno del mismo formato y la ruta estable, para que sustituir el archivo baste. Aplican todas las reglas de video de la sección 13: `muted`, `playsinline`, en bucle, sin pista de audio, con limpieza del buffer al desmontar. Cualquier toque arranca la experiencia.

**PAG 02 · Selecciona el ingrediente.** Seis tarjetas apiladas a ancho completo, con chevron `›` a la derecha:

```
OMEGAS
MULTIVITAMÍNICOS Y MINERALES
VITAMÍNICOS
INGREDIENTES NATURALES
MARINOS
FACIALES TWIST OFF
```

*(El título del mockup dice "SELECCIONA EL EL INGREDIENTE" — errata del PDF. Usar "SELECCIONA EL INGREDIENTE".)*

**PAG 03 · Selecciona el tipo de suplemento.** Misma plantilla, con la categoría elegida escrita en gris sobre la lista. Las seis sublistas:

- **3.1 OMEGAS:** Omega 3 (N) · Omega 3, 6 y 9 · Omega 3 de salmón · Omega 3, linaza y cítricos · Omega 3, bacalao y salmón
- **3.2 MULTIVITAMÍNICOS Y MINERALES:** Multivitamínico A-1 / A-4 · Multivitamínico D rojo · Complejo B · Complejo vitamínico verde · Complejo vitamínico y coenzima Q-10 A-1 · Complejo vitamínico y coenzima Q-10 A-2 · Zinc
- **3.3 VITAMÍNICOS:** Vitamina E - 500 · Vitamina E - 1000 · Vitamina D₃
- **3.4 INGREDIENTES NATURALES:** Lecitina de soya A-1 · Ajo con vitamina E · Germen de trigo con vitamina E A-1 · Jalea real con tiamina · Aceite de ajo con perejil · Semilla de uva · Uva y ajo
- **3.5 MARINOS:** Hígado de bacalao · Aceite de pescados · Alga espirulina A-2
- **3.6 FACIALES TWIST OFF:** Biotina · Vitamina C · Ácido hialurónico · Vitamina E · Retinol · Colágeno & biotina · Hidrolizado de perla

**PAG 04 · Elige el tipo de cápsula.** Rejilla de 2×2 con la foto de la cápsula sobre cada tarjeta y el tamaño entre paréntesis en cursiva:

| Forma | Tamaños |
|---|---|
| OBLONGA | 8, 16, 20 |
| OVAL | 7½ y 10 |
| REDONDA | 5 |
| TWIST-OFF | 4, 5 |

**Esta pantalla no es de elección libre. Ver la sección 7.**

**PAG 05 · Elige la cantidad de cápsulas.** Tres tarjetas horizontales, cada una con la foto del frasco a la derecha y el tamaño del frasco creciendo visiblemente entre opciones: **30 · 60 · 120 cápsulas**. Etiqueta pequeña "FRASCO" encima del número.

**PAG 06 · Selecciona el tipo de etiqueta.** Cinco botones en rejilla (2 + 2 + 1 centrado): **NATURISTA · FARMACÉUTICO · MODERNO · DEPORTIVO · FEMENINO**.
Al elegir uno, el PDF muestra la **etiqueta plana completa** de ese estilo, grande y horizontal, con el nombre del estilo debajo (páginas 11–15 del PDF: farmacéutico, naturista, femenino, moderno, deportivo). Las etiquetas traen el texto legal real: información nutrimental, ingredientes, modo de empleo, datos del fabricante, código de barras y lote.

**PAG 07 · Nombra tu producto.** Título + botón `FINALIZAR →`. El mockup no dibuja el campo ni el teclado: **hay que diseñarlos**. Requisitos heredados y no negociables: **teclado propio en pantalla, nunca el de Windows** (el de Windows tapa la interfaz y saca del modo kiosco), teclas ≥88 px, mayúsculas, acentos y Ñ, borrar visible.

Dos requisitos que vienen del rotulado (sección 8): **el límite de caracteres por línea se aplica aquí**, de forma dura y visible, para que nadie escriba algo que luego no cabe en la etiqueta; y **la vista previa muestra el nombre ya compuesto sobre la etiqueta del estilo elegido**, con su tipografía, no en un campo genérico. Es la pantalla donde el visitante se engancha.

**PAG 08 · Elige el color de tu frasco.** Rejilla de 2×3 con el frasco fotografiado en cada color: **transparente · negro · azul · blanco · rosa · gris**. Cada frasco sobre un fondo lila claro redondeado.

**PAG 09 · Transición.** El frasco elegido cruza la pantalla con estelas de velocidad y destellos, sobre una **barra de progreso azul con el porcentaje escrito a la derecha**, y el texto **"Se está fabricando tu producto"** debajo. Es la versión del área de marketing del argumento "llave en mano": sustituye a la línea de producción larga que se había planteado antes.

Requisitos de ingeniería para esta pantalla:
- Animación orquestada por código, **no video**: el video no es frame-exacto y no permite sincronizar el porcentaje de forma confiable.
- **Blindaje:** el avance a PAG 10 lo dispara el fin de la animación **y** un temporizador de respaldo. Si la animación falla, el flujo sigue.
- La duración exacta no está definida en el mockup. Proponerla en el plan (el porcentaje mostrado es 90 %, o sea que la barra llega al 100 % antes de avanzar).

**PAG 10 · Conoce tu producto terminado.** Título + botón `FINALIZAR →`. El mockup no dibuja el frasco: la app carga la combinación estilo+color que corresponda (una de las 30 ya renderizadas) y **dibuja encima el nombre que escribió el visitante**. Ver sección 8. Es la pantalla que la gente va a fotografiar, así que es la que más acabado necesita: una sola pieza, grande, centrada, en vista fija de tres cuartos. Nada de giro de 360°.

**PAG 11 · Código QR.** No está en el PDF; sus assets sí están en Drive. A diferencia del resto del flujo, esta pantalla tiene **fondo propio y el logo de Biocaps en blanco**, o sea que no es fondo blanco como las demás: es la única pantalla con tratamiento invertido. Además trae los textos «escanea aquí» y el del catálogo como piezas sueltas. El QR se genera **localmente**, módulo grande, alto contraste, con la URL escrita también en texto por si alguien no puede escanear.

### Lo que el flujo del área de marketing no resuelve

No inventar estas piezas sin preguntar; son huecos reales del mockup:

- **No hay botón de "volver"** ni indicador de progreso ("paso 3 de 8") en ninguna pantalla.
- **No está claro qué hace el botón `SIGUIENTE`** si el visitante aún no ha elegido nada: ¿está deshabilitado, avanza con un valor por defecto, o las tarjetas ya avanzan solas al tocarlas?
- **No hay pantalla de captura de leads.** El flujo termina en el QR. (Ver sección 11.)
- **No hay pantalla de error ni de reinicio por inactividad**, que sí son obligatorias por ingeniería.

---

## 7. Reglas de la máquina de estados

- Estados explícitos, transiciones explícitas. **Nada de estados implícitos derivados de props.**
- Toda transición pasa por una única función `avanzar / retroceder / reiniciar`. Nada de cambios de estado dispersos por los componentes.
- Transición inválida = no-op registrado. Nunca una excepción, nunca una pantalla en blanco.
- **Inactividad: aviso a los 45 s, reinicio a los 55 s.** El contador se reinicia con cualquier toque. **En PAG 09 el contador se pausa** (la animación corre sola y no hay interacción).
- **Error boundary global** → vuelve a la portada y limpia la sesión.
- **El estado se limpia por completo al reiniciar.** El visitante siguiente no puede ver el nombre de producto que escribió el anterior.
- **Panel de staff administrativo: no está aprobado.** Es una propuesta a evaluar, no un requisito. Ver la sección 15.

### La regla de negocio más importante: la cápsula depende del suplemento

El documento `COMBINACIÓN CÁPSULAS` de Drive establece que **la forma de la cápsula está determinada por el suplemento elegido**, no por el gusto del visitante. PAG 04 se ve como una elección libre de 4 opciones, pero no lo es.

| Forma | Suplementos que le corresponden |
|---|---|
| **TWIST-OFF** | Los 7 faciales: biotina, vitamina C, ácido hialurónico, vitamina E, retinol, colágeno & biotina, hidrolizado de perla |
| **OBLONGA** | Todos los omegas **menos** el Omega 3 (N) · complejo vitamínico verde · multivitamínico D rojo · complejo vitamínico y coenzima Q-10 · vitamina E 1000 · lecitina de soya |
| **OVAL** | Omega 3 (N) · complejo B · zinc · jalea real con tiamina · aceite de ajo con perejil · germen de trigo con vitamina E · ajo con vitamina E · vitamina D₃ · alga espirulina · vitamina E 500 · semilla de uva · uva y ajo |
| **REDONDA** | Hígado de bacalao · aceite de pescados |

**Implicaciones para el código:**

1. La matriz vive en el JSON de contenido, no en el código. Es un mapa de suplemento → forma(s) de cápsula válida(s).
2. **Cómo se comporta PAG 04 está sin decidir y hay que preguntarlo:** o muestra solo la forma que corresponde (informativa, un solo toque para continuar), o muestra las 4 con las no válidas deshabilitadas. Las dos son defendibles; elegir sin preguntar es inventar producto.
3. **Hueco confirmado en los datos:** el suplemento **Multivitamínico A-1 / A-4** aparece en el flujo (PAG 3.2) pero **no está en la matriz de combinaciones**. Falta su forma de cápsula.
4. El documento de combinaciones trae los nombres abreviados y con erratas ("Aceide de pescados", "Germen de trico"). **La lista buena es la del PDF**, que es lo que ve el visitante; la matriz se normaliza contra esa lista al ingerirla.

---

## 8. Contenido, assets y el frasco compuesto

**Principio rector: los placeholders son la especificación.** La app busca los assets por nombre de archivo. Si el archivo real llega con el mismo nombre y la misma proporción, entra sin tocar código.

Por lo tanto:

- **Todo el texto y el catálogo viven en un JSON de contenido**, fuera del código. Ninguna cadena de texto de cara al visitante se escribe dentro de un componente. Las seis categorías, los 32 suplementos, las cuatro formas de cápsula, las tres presentaciones, los cinco estilos de etiqueta, los seis colores y la matriz de combinaciones: todo es dato.
- **Las imágenes viven en una carpeta de contenido fuera del empaquetador**, cargadas desde un manifiesto, para que personal no técnico las reemplace sin recompilar.
- El logo de Biocaps ya existe como arte real en los mockups. Mientras no llegue el SVG, va como imagen desde el manifiesto, nunca redibujado ni generado.

### El frasco compuesto (PAG 10) — ya no se arma por capas

**Esto cambió al inventariar los assets reales.** El área de marketing no entregó piezas para apilar: entregó **las 30 combinaciones ya renderizadas**. Dentro de cada carpeta de estilo de etiqueta (`PAG 6.1`–`6.5`) hay una subcarpeta con el frasco completo en los seis colores:

```
PAG 6.2 NATURISTA/NATURISTA/naturista azul.png · naturista blanco.png · naturista gris.png
                             naturista negro.png · naturista rosa.png · naturista transparente.png
```

5 estilos × 6 colores = **30 imágenes del frasco ya vestido**. La composición en tiempo real se reduce entonces a:

```
{estilo} {color}.png        (una de las 30, según lo que eligió el visitante)
  + el nombre del producto dibujado como texto encima
```

Consecuencias:

- **No hace falta apilar capas ni resolver registro entre piezas.** Se acabó el riesgo más grande de la ruta 2D.
- Lo único que sigue siendo trabajo de la app es **dibujar el nombre del producto sobre la etiqueta**. Ver abajo.
- Son unos 30 MB en PNG. Hay que convertirlas a WebP y generar la versión al tamaño exacto de pantalla; cargarlas todas en crudo se come la memoria de una sesión larga.
- **Hueco a confirmar: el tamaño del frasco no cambia con la cantidad de cápsulas.** En PAG 05 el visitante elige 30, 60 o 120 y los frascos del mockup tienen alturas distintas, pero las 30 composiciones finales parecen ser de un solo tamaño. O el producto terminado ignora la presentación elegida, o faltan 60 imágenes. Preguntar antes de construir PAG 10.

Los frascos sueltos sin etiqueta de `PAG 08` (`frasco azul.png`, `frasco rosa.png`, etc.) siguen siendo los de la pantalla de elección de color y los de la animación de PAG 09, no los del producto terminado.

### El nombre sobre la etiqueta: la pieza que sí programa la app

Es lo único que se compone en tiempo real, y es lo que hace que el visitante sienta que el producto es suyo. Petición literal del área de marketing:

> «que se ajuste el texto al espacio determinado y a delimitar la cantidad de caracteres a 7 por línea por ejemplo»

Referencia visual: la carpeta `EJEMPLOS_FRASCOS_TERMINADOS` trae tres ejemplos (deportiva, moderna, naturista) de cómo debe verse el frasco con el nombre puesto. **Son la especificación de acabado de PAG 10**: el resultado se compara contra ellos.

**Cada estilo de etiqueta tiene su propia tipografía.** Las cinco subcarpetas de `TIPOGRAFÍAS` se llaman igual que los cinco estilos (deportiva, farmacéutica, femenina, moderna, naturista): la fuente del nombre **la determina el estilo de etiqueta que eligió el visitante**, no es una sola fuente para todo. Hoy las cinco carpetas están vacías; mientras tanto se trabaja con sustitutas y se deja la fuente como un valor del JSON de estilo, nunca escrita en el CSS de la pantalla.

**Lo que hay que definir por estilo** (una caja de texto por cada uno de los cinco):

- Rectángulo donde vive el nombre: posición y medida en píxeles sobre la imagen del frasco.
- Tipografía y peso, color, alineación e interlineado.
- Número máximo de líneas y cuerpo de partida.

**Sobre el límite de 7 caracteres por línea.** Marketing lo propone como ejemplo, y funciona bien como regla para el visitante, pero **no basta como regla de dibujo**: `WWWWWWW` mide casi el doble que `iiiiiii` en la mayoría de las tipografías. La implementación correcta es por ancho medido, no por conteo:

1. Se mide el ancho real del texto renderizado y se reduce el cuerpo hasta que cabe en la caja.
2. Se parte en líneas respetando el máximo de líneas del estilo.
3. **El conteo de caracteres se usa donde sí sirve: en el campo de PAG 07**, para que el visitante no pueda escribir algo que no va a caber. Ahí el límite es duro y visible.

**Preguntar antes de implementar:** cuántas líneas como máximo, qué pasa si el nombre excede (¿se corta, se reduce más, se rechaza en el campo?), y si el corte de línea es automático o el visitante lo decide. El documento no lo dice y son tres decisiones de producto distintas.

---

## 9. Diseño: nivel de acabado e interfaz

La calidad visual es el producto. Estas pantallas son la demostración práctica de lo que sabe hacer Xestión Intelixente. Un acabado correcto pero genérico es un fracaso del proyecto.

**El diseño ya está definido por los mockups del área de marketing.** El trabajo no es inventar una dirección de arte, es **trasladar esos mockups a 1080×1920 con movimiento y acabado de nivel premium**. Antes de escribir CSS: presentar un plan de design tokens extraído de los mockups (paleta, escala tipográfica, escala de espaciado, radios, sombras, curvas y duraciones) para aprobación.

**Mínimos por el público (edad promedio alta, luz de feria, ángulo de visión):**

- Cuerpo ≥22 px, títulos ≥60 px, contraste ≥7:1.
- Objetivos táctiles ≥72 px, y ≥88 px si el touch resulta ser infrarrojo.
- Zona táctil cómoda: 90–150 cm de altura física.
- Legible en ángulo: nada de gris claro sobre blanco en tamaños chicos. **Ojo con el gris del pie de página de los mockups**, que está en el límite.
- **Nada de hover, tooltips, menús desplegables ni scroll.** En PAG 3.2, 3.4 y 3.6 hay siete opciones en pantalla: deben caber sin scroll a 1080×1920.

---

## 10. Movimiento

Las animaciones y transiciones son un criterio de aceptación, no un adorno. Es lo que separa estos mockups estáticos de una pantalla que se siente cara.

- **Respuesta visual al primer contacto en <100 ms**, en el evento de presionar, no en el de soltar.
- Entradas **240 ms**, salidas **160 ms**, con una curva consistente definida en un solo lugar.
- **Transformación de elemento compartido entre pasos:** el frasco no reaparece, viaja — sobre todo entre PAG 08 → PAG 09 → PAG 10, que es la secuencia con más carga emocional del flujo.
- Máximo **2 elementos animando** a la vez.
- **Cero spinners.** Si algo tarda, se precarga antes. (La barra de PAG 09 no es un spinner: es contenido.)
- Respetar `prefers-reduced-motion` con una variante sin desplazamientos.
- **Presupuesto: 60 fps sostenidos**, incluida la animación de PAG 09, sobre gráficos integrados. La GPU de la laptop del stand es desconocida. Si hay que elegir, se sacrifica fidelidad visual antes que fluidez.
- Pantalla de arranque que precarga fuentes, imágenes y animaciones antes de mostrar la portada. Después de eso, **ninguna carga perezosa durante la sesión**.

---

## 11. Telemetría y leads

- **Telemetría anónima siempre activa:** qué ingrediente y suplemento se eligieron, qué forma, qué presentación, qué estilo de etiqueta, qué color, cuántas sesiones se completaron y en qué pantalla se abandonó. **Sin datos personales**, por lo tanto sin aviso de privacidad. Es la inteligencia real que se entrega al cierre del evento. Se guarda en local.
- **Captura de leads: no está en el flujo del área de marketing.** El flujo termina en el QR. Si Grupo AB decide activarla más adelante, la pantalla se añade después del QR, con casilla de consentimiento sin premarcar y aviso de privacidad — requisito de la LFPDPPP. No construirla hasta que se pida.

---

## 12. Stack y distribución

### Lo que se usó en el prototipo (referencia, no mandato)

El prototipo de `prototipos/biocaps-kiosko` se construyó con **Vite + React 18 + TypeScript en modo estricto + Zustand + Motion + GSAP + Vitest + Dexie/IndexedDB**, sin librería de componentes y sin framework de CSS. Se menciona para que el prototipo se entienda al leerlo, no para imponerlo.

### Cómo se decide el stack definitivo

El stack se propone en modo plan y se aprueba antes de escribir código, evaluado contra estos cuatro criterios en este orden:

1. **Animaciones y transiciones de alto nivel.** Transformación de elemento compartido entre pantallas, la animación de fabricación de PAG 09, 60 fps sostenidos sobre gráficos integrados.
2. **Empaquetado en un ejecutable que arranque desde una USB**, sin instalación, sin permisos de administrador, sin dependencias previas en la laptop del stand.
3. **Publicable también como link (tipo Netlify)**, como respaldo y para enseñar avances al cliente sin mandarle archivos.
4. **Redundancia contra fallos.** Que exista más de una forma de arrancar la pantalla el día del evento.

### Las tres vías de distribución, y por qué las tres

La app debe poder entregarse **por las tres vías a la vez**, desde el mismo código:

| Vía | Para qué sirve | Advertencia |
|---|---|---|
| **Ejecutable portable en USB** | Vía principal el día del evento | Debe arrancar con doble clic, sin instalar nada y sin permisos de administrador. Confirmar si la laptop del stand tiene restricciones de administrador |
| **Servidor estático local** (carpeta + `http://localhost`) | Respaldo inmediato si el ejecutable falla | **NO NEGOCIABLE: nunca abrir el `index.html` con doble clic.** Con `file://` el navegador bloquea el almacenamiento local y el video se rompe |
| **Link publicado** (Netlify o equivalente) | Revisiones con el cliente y último recurso | **No puede ser la vía principal.** La señal del recinto se cae en hora pico y la app debe funcionar offline por definición |

**La consecuencia de diseño:** la app tiene que ser una carpeta de archivos estáticos que funcione igual servida desde localhost, empaquetada en un ejecutable o subida a un hosting. Cualquier decisión que ate la app a un servidor propio, a una base de datos remota o a rutas absolutas del disco rompe las otras dos vías.

**Antes de cerrar el stack, entregar:** una prueba de que el ejecutable arranca desde USB en una máquina limpia, y una prueba de que la misma build funciona servida desde localhost. Esa verificación va antes de construir pantallas, no después.

---

## 13. Trampas técnicas ya conocidas

- **`file://` rompe cosas en silencio.** Almacenamiento local bloqueado, peticiones por rango fallidas, video que no arranca. Siempre `http://localhost`.
- **Rotar la pantalla en Windows, nunca por CSS.**
- **El teclado táctil de Windows tapa la interfaz y saca del modo kiosco.** Por eso el teclado de PAG 07 es propio.
- **Fuga de memoria por video.** Montar y desmontar elementos de video sin limpiar acumula buffers hasta que el navegador muere a las 4–6 horas. Al desmontar: pausar, quitar el `src` y recargar el elemento. Crítico para el video de portada, que corre en bucle todo el día.
- **Autoplay:** el video de portada va `muted` + `playsinline`, o no arranca.
- **Loop con salto:** codificar el video de portada **sin pista de audio** y con el primer y último frame idénticos.
- **Windows domado antes del evento:** suspensión, protector de pantalla, actualizaciones y notificaciones apagadas; inicio de sesión automático; acceso directo en Inicio.
- **Endurecimiento del kiosco:** desactivar selección de texto, menú contextual, arrastre de imágenes, doble toque para zoom, pinch zoom y resaltado de toque. Cursor oculto. Prevenir rebote de scroll y pull-to-refresh.

---

## 14. Calidad y pruebas

- TypeScript estricto si el stack lo incluye: sin `any`, sin supresiones de tipo.
- **Pruebas automatizadas de la máquina de estados:** cada transición válida, cada inválida, los temporizadores (con relojes falsos), que reiniciar deje el estado idéntico al arranque, y **que la matriz de cápsulas nunca deje al visitante en un callejón sin salida** (todo suplemento debe resolver a al menos una forma válida — hoy el Multivitamínico A-1/A-4 no lo hace).
- **Prueba de resistencia de 8 horas con toques aleatorios antes de viajar.** Es criterio de entrega, no una buena práctica opcional.

---

## 15. Propuesta a evaluar: el panel de staff

**Estado: no aprobado. Candidato a descartarse por completo.** Esta sección no pide construir nada. Pide que, en modo plan, se evalúe si vale la pena y, si la respuesta es sí, cuál es la versión más barata que resuelve lo mismo.

Lo que se propuso: 5 toques en la esquina superior izquierda + PIN de 4 dígitos → estadísticas de la sesión, exportar telemetría a CSV, reinicio duro, versión del build.

El panel no es una funcionalidad, es **una puerta de salida para cuatro necesidades que existen con o sin él**. Si se descarta, cada una necesita otra salida:

| Necesidad | Por qué existe | Si no hay panel, ¿por dónde sale? |
|---|---|---|
| Sacar la telemetría al cierre del evento | Es lo único cuantitativo que se le entrega a Grupo AB | ¿Exportación automática a un archivo junto al ejecutable? ¿Atajo de teclado? |
| Reinicio duro en el stand | Si alguien deja un nombre inapropiado en pantalla o algo se atora, el staff no puede esperar a un técnico | ¿Basta el temporizador de inactividad de 55 s? ¿Basta cerrar y reabrir el ejecutable? |
| Saber qué versión está corriendo | Si se parchea algo durante el evento | ¿Versión impresa en pequeño en la portada? |
| Ver si la pantalla funciona bien | El staff no es técnico y no va a abrir una consola | ¿Hace falta de verdad, o con mirar la pantalla basta? |

**Lo que se pide en el plan:** una recomendación razonada entre construirlo completo, construir una versión mínima (solo exportación de telemetría, sin PIN ni estadísticas en pantalla) o descartarlo, con el costo de cada una. Si la recomendación es descartarlo, el plan debe decir explícitamente **cómo sale la telemetría del kiosco**, porque es la única necesidad sin sustituto obvio.

Nada de esto se construye hasta que la decisión esté tomada.

---

## 16. Inventario de los assets

Fuente de trabajo: `~/Desktop/BIOCAPS PANTALLA TÁCTIL` — copia local completa (119 MB) de la carpeta de Drive de ambar@xestionintelixente.com, descargada el 21 de septiembre de 2026. Inventario recorrido y verificado en esa fecha.

**Carpetas vacías = material pendiente, no un error.** La estructura ya está creada con los nombres y lugares definitivos; el área de marketing la irá llenando conforme produzca cada pieza. Para el desarrollo eso significa dos cosas:

- **No esperar a que lleguen los archivos para construir la pantalla.** Cada pantalla se levanta contra un placeholder que respeta el nombre de archivo, la proporción y el encuadre definitivos. Cuando el archivo real llega, se suelta en su sitio y entra sin tocar código.
- **No tratar una carpeta vacía como un fallo del proyecto.** Se anota, se pide, se sigue. Lo único que sí hay que preguntar antes es qué medida y qué proporción tendrá la pieza, porque si el placeholder tiene otra proporción hay que reprogramar la pantalla cuando llegue el archivo bueno.

### Qué hay, carpeta por carpeta

| Carpeta | Contenido | Estado |
|---|---|---|
| `PAG 01 PORTADA` | — | ⏳ **vacía**, esperando el video |
| `PAG 02 INGREDIENTE` | 6 tarjetas de categoría + título + página completa | ✅ completa |
| `PAG 3.1 OMEGAS` | 5 suplementos + encabezado + título + página completa | ✅ completa |
| `PAG 3.2 MULTIVITAMÍNICOS Y MINERALES` | 7 suplementos + encabezado + título + página completa | ✅ completa |
| `PAG 3.3 VITAMÍNICOS` | 3 suplementos + encabezado + título + página completa | ✅ completa |
| `PAG 3.4 INGREDIENTES NATURALES` | 7 suplementos (+1 duplicado) + encabezado + título + página | ✅ completa |
| `PAG 3.5 MARINOS` | 3 suplementos + encabezado + título + página completa | ✅ completa |
| `PÁG 3.6 TWIST OFF` | 7 suplementos + encabezado + página completa | ✅ completa |
| `PAG 04 TIPO DE CÁPSULA` | oblonga · oval · redonda · twist off + título + página | ✅ completa |
| `PAG 05 CANT CAPSULAS` | frascos de 30 · 60 · 120 + título + página completa | ✅ completa |
| `PAG 06 TIPO DE ETIQUETA` | 5 botones de estilo + título + página completa | ✅ completa |
| `PAG 6.1`–`6.5` (5 estilos) | etiqueta plana + texto + página completa + **subcarpeta con el frasco vestido en 6 colores** | ✅ completas (ver aviso en 6.1) |
| `PAG 07 NOMBRA TU PRODUCTO` | título + página completa | ⚠ sin campo de texto ni teclado: hay que diseñarlos |
| `PAG 08 COLOR DEL FRASCO` | **los 6 frascos** (azul, blanco, gris, negro, rosa, transparente) + título + página | ✅ completa |
| `PAG 09 TRANSICIÓN` | barra · barra 02 · frasco transición · texto · página final | ✅ completa |
| `PAG 10 PRODUCTO TERMINADO` | botón finalizar + título + **dos** páginas completas | ⚠ sin el frasco compuesto (se genera en la app) |
| `PAG 11 CÓDIGO QR` | fondo · logo blanco Biocaps · «escanea aquí» · texto catálogo + página | ✅ completa |
| `TIPOGRAFÍAS` | 5 subcarpetas, una por estilo de etiqueta (deportiva, farmacéutica, femenina, moderna, naturista) | ⏳ **las 5 vacías** |
| `EJEMPLOS_FRASCOS_TERMINADOS` | 3 JPEG de referencia (deportiva, moderna, naturista) con el nombre ya rotulado | ✅ referencia de acabado para PAG 10 |
| raíz | `COMBINACIÓN CÁPSULAS.docx` + el PDF de flujo (53 MB) | ✅ |

### Lo que falta por entregar

1. **El video de portada.** `PAG 01 PORTADA` existe, vacía. Se trabaja con relleno del mismo formato.
2. **Todas las tipografías.** Las cinco subcarpetas están creadas y **las cinco están vacías**: no hay ni un archivo de fuente. Es el pendiente más urgente, porque **cada estilo de etiqueta usa su propia tipografía** para el nombre del producto (ver sección 8), y porque arrastra el riesgo de Acumin (abajo).
3. **El logo de Biocaps en azul.** Aparece en el encabezado de las 19 pantallas del PDF, pero como archivo suelto solo existe `logo blanco biocaps.png`, dentro de `PAG 11`. Hace falta el positivo, idealmente en SVG.

### Erratas y ambigüedades del material entregado

Ninguna bloquea, pero todas muerden si se automatiza la ingesta sin revisarlas:

- **`PAG 6.1 FARMACÉUTICO/FARMACÉUTICO/` tiene tres archivos mal nombrados.** `naturista azul_1.png`, `naturista gris_1.png` y `naturista transparente_1.png` **son frascos farmacéuticos**, confirmado; solo se exportaron con el nombre equivocado. No falta nada: el estilo farmacéutico está completo en sus seis colores. Se corrige en la tabla de equivalencias de la ingesta, mapeándolos a azul, gris y transparente del estilo farmacéutico. **No renombrar el espejo local**, para que la próxima copia de Drive siga encajando.
- **`PAG 6.5 DEPORTIVO/Recurso 135.png`** — nombre de exportación automática, contenido desconocido. Revisar y renombrar o descartar.
- **Erratas de tecleo en nombres:** `fraasco 60 caps.png`, `página completa cantiad de caps.png`, `etiqueta narustista.png`, `teto naturista.png`.
- **`PAG 3.2/tipo de suplemento .png` tiene un espacio final** en el nombre, antes de la extensión. Invisible al ojo y capaz de romper un script.
- **Duplicado:** `PAG 3.4` trae `semilla de uva.png` y `semilla de uva_1.png`.
- **`PAG 10` trae dos páginas completas** con nombres casi iguales (`Página completa conoce tu producto terminado.png` de 261 KB y `página completa producto terminado.png` de 1.4 MB). Confirmar cuál es la buena.
- **Mayúsculas inconsistentes** (`Faciales twist off.png`, `Femenino transparente.png`) y **`PÁG` vs `PAG`** en los nombres de carpeta. En macOS no importa porque el sistema de archivos ignora mayúsculas por defecto; en el servidor donde se publique el link, sí importa. Normalizar todo a minúsculas en la ingesta.
- **Los nombres de archivo no coinciden con las etiquetas del PDF.** Ejemplos: `complejo b rojo.png` y `complejo b verde.png` frente a «Multivitamínico D rojo» y «Complejo vitamínico verde»; `multi. a4.png` frente a «Multivitamínico A-1 / A-4»; `omega 3 linaza limón.png` frente a «Omega 3, linaza y cítricos». **La lista buena es la del PDF**, que es lo que ve el visitante. La tabla de equivalencias nombre-de-archivo → etiqueta se escribe a mano una vez y vive en el repo.

**Convención de nombres.** El material del cliente viene en español, con espacios, acentos y erratas. **No se renombra el espejo**: se renombra en el paso de ingesta hacia `marca_categoria_identificador_variante_version.ext`, con la tabla de equivalencias versionada. Así, cuando llegue la próxima entrega, encaja sin trabajo manual.

**Qué es asset y qué es referencia.** Los `página completa X.png` son el mockup de la pantalla entera: sirven para comparar el resultado contra el diseño aprobado, **no se cargan en la app**. Los que se usan son los elementos sueltos.

**⚠ Riesgo de tipografía, sigue abierto.** El PDF de flujo trae incrustada **Acumin Variable Concept**, que es de **Adobe Fonts**: no se puede empaquetar fuera de apps de Adobe y **no sirve para el kiosco**. El resto de las fuentes incrustadas (Montserrat, Manrope, Quicksand, Geist) sí son licenciables. Como las cinco carpetas de tipografías están vacías, esto no se puede resolver leyendo los assets: hay que preguntarle al área de marketing qué fuente corresponde a qué pantalla y, si Acumin está en el diseño final, elegir salida — licencia con la fundición, sustituto licenciable aprobado por marca, o usarla solo dentro de logos vectorizados.


## 17. Decisiones abiertas

**No inventar estos valores en medio de una tarea: preguntar.**

| Pendiente | Quién decide | Qué bloquea |
|---|---|---|
| **Tipografías: las 5 carpetas están vacías, y el origen de Acumin** | Marketing (Grupo AB) | El rotulado del nombre en PAG 07 y PAG 10. **Lo más urgente de la lista** |
| Máximo de líneas del nombre, y qué pasa si se excede | Marketing | La regla de ajuste del texto sobre la etiqueta |
| Caja de texto de cada estilo (posición, medida, color, alineación) | Marketing, o se mide sobre los ejemplos | El rotulado; medible desde `EJEMPLOS_FRASCOS_TERMINADOS` si no llega |
| ¿El frasco terminado cambia de tamaño según 30/60/120 cápsulas? | Marketing | PAG 10: o se ignora la presentación, o faltan 60 imágenes |
| Video de portada | Marketing | Nada: se construye con relleno y se sustituye al llegar |
| Logo de Biocaps en azul, suelto (SVG) | Marketing | El encabezado de las 11 pantallas |
| Forma de cápsula del Multivitamínico A-1 / A-4 | Grupo AB | La matriz de combinaciones queda incompleta |
| Cómo se comporta PAG 04 (filtrada vs. deshabilitada) | Marketing | El diseño de esa pantalla |
| Qué hace `SIGUIENTE` sin selección previa | Marketing | La navegación de 8 pantallas |
| Si hay botón de volver y progreso visible | Marketing | El marco de todas las pantallas |
| URL exacta del QR de PAG 11 | Grupo AB | El contenido del QR |
| Cuál de las dos «páginas completas» de `PAG 10` es la buena | Marketing | Solo la referencia visual |
| Qué es `Recurso 135.png` en `PAG 6.5` | Revisar Rael | Nada |
| Duración de la animación de PAG 09 | Rael, con propuesta en el plan | Nada crítico |
| Si existe panel de staff, y en qué forma | Rael, con la propuesta de la sección 15 | La salida de la telemetría |
| Fecha exacta de la expo | — | La planificación de recortes |

### Orden de recorte si el calendario aprieta

1. Sofisticación de la animación de PAG 09 (versión simple de barra + frasco).
2. Segunda piel para la pantalla dual.

*(La composición por capas del frasco ya no está en esta lista: las 30 combinaciones vienen renderizadas, así que no hay nada que recortar ahí.)*

---

## 18. Cómo se reutilizará esto para la pantalla dual

- La pantalla dual tendrá la **misma columna vertebral**: mismo motor, misma navegación, mismos temporizadores, mismas transiciones. Solo cambia el relleno.
- Es una pantalla **compartida por dos marcas** (Juveternal y PM Anáhuac) con una costura visual entre ambos mundos, y **4 lados de acceso** en el stand.
- Su portada ya está definida: pantalla partida por una costura de luz, mundo cálido de Anáhuac a un lado, mundo fresco de Juveternal al otro, con un cruce breve cada 20 segundos en una sola dirección.
- El staff debe aprender **una sola interfaz** para las dos pantallas.

Traducción práctica: cada vez que se escriba algo específico de Biocaps, debe quedar claro dónde vive lo específico y dónde lo compartido.
