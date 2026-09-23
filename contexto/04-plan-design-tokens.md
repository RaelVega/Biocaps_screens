# Plan de design tokens — Biocaps Screens

Versión 2 · 22 de septiembre de 2026 · **Aprobado.**
Deriva de la §9 de `03-contexto-biocaps-para-claude-code.md` y del plan de arquitectura aprobado.

> **Regla rectora:** el flujo del PDF es la propuesta final de marketing, ya revisada con ellos en junta con propuesta y prototipos. **Se replica tal cual.** Estos tokens reproducen los valores medidos en los mockups, sin correcciones de diseño. Lo único que añade la app es lo que un PDF no puede tener: interacción y animación.

---

## 0. Qué es esto y cómo se usa

Un **token** es un valor de diseño con nombre: un color, un tamaño de letra, un radio, una duración. En lugar de escribir `#D6DDF8` en veinte sitios, se escribe `--color-tarjeta` y el valor vive en un solo lugar.

**Instrucciones:**

1. Los valores de este documento son **los del PDF**. Si una pantalla construida no coincide con su «página completa», se corrige el código, nunca el valor.
2. Con estos valores se escriben los tokens en `src/marca/tokens/`, en tres archivos:
   - `primitivos.css`: los valores crudos medidos (paleta, tamaños). No los usa ninguna pantalla directamente.
   - `semanticos.css`: los nombres por función (`--texto-titulo`, `--fondo-tarjeta`), que apuntan a los primitivos. **Las pantallas solo usan estos.**
   - `movimiento.ts`: curvas y duraciones. Se exportan también a CSS para que haya una sola fuente.
3. **Regla para quien programe:** en los módulos CSS de `src/marca/pantallas/` no puede aparecer ningún color, tamaño en px de texto, radio, sombra ni duración escritos a mano. Solo `var(--…)`. Se hace cumplir con una revisión automática (lint de estilos).
4. **Regla para la pantalla dual:** se copian `primitivos.css` y `semanticos.css` y se cambian los valores, **sin cambiar los nombres**. El motor no se toca.
5. Todos los valores están en **píxeles del lienzo 1080×1920**. El escalado a otras ventanas lo hace el motor.

## 1. Cómo se midió

- El PDF de flujo mide exactamente 1080×1920 puntos. Los **tamaños de letra y las posiciones** se leyeron de los propios operadores de texto del PDF (tamaño real × matriz de transformación), no a ojo.
- Los **colores, rectángulos y sombras** se midieron píxel a píxel sobre las «página completa» PNG, que vienen a 4501×8001 (factor 4,1676 respecto a 1080×1920).
- Precisión: tamaños de letra exactos; rectángulos ±1 px; sombras **estimadas** (se validan en la prueba de superposición de la §9).

---

## 2. Paleta

### 2.1 Primitivos medidos

| Token primitivo | Valor | Dónde aparece |
|---|---|---|
| `--p-blanco` | `#FFFFFF` | Fondo de todas las pantallas excepto PAG 11 |
| `--p-gris-900` | `#404040` | Encabezado de categoría en PAG 03 |
| `--p-gris-800` | `#505050` | Títulos, texto de tarjetas y pie de página |
| `--p-lila-100` | `#D6DDF8` | Relleno de tarjetas (PAG 02–08, iguales en todas) |
| `--p-azul-marca` | `#2C3488` | Logo Biocaps (azul marino) |
| `--p-azul-cian` | `#0088FF` | Inicio del degradado del botón y de la barra |
| `--p-azul-medio` | `#004BF7` | Punto medio del degradado |
| `--p-azul-profundo` | `#002DC1` | Final del degradado del botón |
| `--p-azul-qr-arriba` | `#0024AC` | Fondo de PAG 11, arriba |
| `--p-azul-qr-abajo` | `#004CFA` | Fondo de PAG 11, abajo |

> **Nota de implementación (22-09):** en el código, los colores semánticos llevan prefijo `--color-*` / `--fondo-*` y los tamaños de la §3.2 se llaman `--cuerpo-*` («cuerpo» es el término tipográfico del tamaño), para que `--texto-titulo` no nombre a la vez un color y un tamaño. Los valores son los de este documento. Pesos y anchuras de la sustituta quedaron calibrados en `semanticos.css` (títulos 700 al 95 %, negritas 750 al 94 %).

### 2.2 Semánticos

| Token semántico | Apunta a |
|---|---|
| `--fondo-pantalla` | `--p-blanco` |
| `--texto-titulo` | `--p-gris-800` |
| `--texto-pie` | `--p-gris-800` |
| `--texto-encabezado-categoria` | `--p-gris-900` |
| `--fondo-tarjeta` | `--p-lila-100` |
| `--texto-tarjeta` | `--p-gris-800` |
| `--degradado-primario` | cian → medio → profundo, horizontal |
| `--texto-sobre-primario` | `--p-blanco` |
| `--pista-progreso` | `--p-lila-100` (la barra de PAG 09 usa el degradado primario) |
| `--fondo-invertido` | degradado vertical qr-arriba → qr-abajo (solo PAG 11) |
| `--texto-invertido` | `--p-blanco` |

**No se usan tokens de color para el arte fotográfico** (frascos, cápsulas, etiquetas): ya vienen renderizados.

---

## 3. Tipografía

### 3.1 La fuente de la interfaz

**Las 19 páginas del PDF usan Acumin Variable Concept en todo el marco**: títulos, botones, tarjetas y pie de página. Es la fuente que hay que replicar.

La fuente se declara en un solo token (`--familia-interfaz`) y se carga desde `src/marca/fuentes-ui/`.

- **Si llegan los archivos de Acumin con licencia para aplicación**, se sueltan en esa carpeta y se usan directamente.
- **Mientras tanto**, se usa la sustituta libre que más se le parezca: **Archivo**, que es OFL y variable en peso y ancho, como Acumin. Hace falta porque la licencia de Adobe Fonts no permite empaquetar Acumin dentro de un ejecutable: es una restricción legal, no una decisión de diseño.
- La sustituta se ajusta en peso y ancho hasta que la prueba de superposición (§9) dé menos del 3 % de diferencia por línea de título. El objetivo es que no se note la diferencia con el PDF.

### 3.2 Escala tipográfica medida en el PDF

| Token | Tamaño medido | Peso (visual) | Interlineado | Uso |
|---|---|---|---|---|
| `--texto-titulo` | **73,7 px** | Negra/extrabold | 76 px (1,03) | Título de dos líneas, todas las pantallas |
| `--texto-estilo-etiqueta` | 55,7 px | Negra | — | Nombre del estilo bajo la etiqueta (PAG 6.1–6.5) |
| `--texto-fabricacion` | 50,0 px | Regular / negra para el % | — | «Se está fabricando tu producto» y «90 %» (PAG 09) |
| `--texto-cantidad` | 45,7 px | Negra | — | «30 CÁPSULAS» (PAG 05) |
| `--texto-encabezado-categoria` | 40,6 px | Regular | — | Categoría elegida sobre la lista (PAG 03) |
| `--texto-tarjeta-grande` | 40,0 px | Negra | — | Seis categorías (PAG 02) |
| `--texto-pie` | 37,0 px | Regular | — | «Cada elección da forma a tu producto» |
| `--texto-tarjeta` | 35,0 px | Negra | 37 px (1,06) en dos líneas | Sublistas (PAG 03), cápsulas (PAG 04), estilos (PAG 06) |
| `--texto-tarjeta-detalle` | 35,0 px | Regular itálica | — | «(8, 16, 20)» (PAG 04) |
| `--texto-rotulo-pequeno` | 31,2 px | Negra | — | «FRASCO» (PAG 05) |
| `--texto-boton` | 24,6 px | Negra | — | «SIGUIENTE» / «FINALIZAR» |

**No se inventan tamaños intermedios.** La escala es exactamente esta lista y cualquier texto nuevo (teclado, aviso de inactividad, error) usa uno de estos tokens.

### 3.3 Fuentes del nombre del producto (una por estilo)

Leídas de las etiquetas planas del PDF (págs. 11–15). Son las fuentes **del arte de la etiqueta**, que ya viene renderizado. La que importa para la app es **la del nombre del producto**, y esa aún no está entregada (las cinco carpetas de `TIPOGRAFÍAS` están vacías).

| Estilo | Fuentes presentes en su etiqueta | Cómo luce el nombre en el ejemplo |
|---|---|---|
| Farmacéutico | Montserrat | (sin ejemplo) |
| Naturista | Aloevera Display, Cochin, Geist | «FLORIL», serif, verde oscuro, centrado |
| Femenino | Manrope, Quicksand, Helvetica | (sin ejemplo) |
| Moderno | Clash Display | «RELAX FLOW», blanco, en **vertical, rotado 90°** |
| Deportivo | Avenir | «POWER CAPS», negra itálica naranja |

Cuando lleguen los archivos a `TIPOGRAFÍAS/{estilo}/` se usan esos. Mientras tanto se toma, por estilo, la fuente libre más parecida al ejemplo, declarada en el JSON de ese estilo.

Por estilo, la caja de rotulado (posición, medida, rotación, color, alineación, máximo de líneas, cuerpo de partida) **es contenido, no token**: vive en `contenido/contenido.json`, tal como pide la §8 del documento 03. Aquí solo se fija que la caja **admite rotación** (la necesita Moderno).

---

## 4. Retícula y espaciado

Medido sobre PAG 02–08. Todas las pantallas comparten un **marco fijo**:

| Token | Valor | Qué es |
|---|---|---|
| `--margen-lateral` | 122 px | Margen izquierdo y derecho del contenido (ancho útil 836 px) |
| `--logo-arriba` | 101 px | Borde superior del logo |
| `--logo-alto` | 51 px | Alto del logo (ancho 246 px) |
| `--titulo-linea-1` | línea base en y = 264 px | |
| `--titulo-linea-2` | línea base en y = 340 px | |
| `--boton-arriba` | 381 px | Borde superior del botón |
| `--boton-medida` | 377 × 56 px | Botón primario, centrado |
| `--zona-contenido` | de y ≈ 540 a y ≈ 1760 | Zona donde van las tarjetas (1220 px de alto) |
| `--pie-linea-base` | y = 1830 px | Pie de página |

Rejillas medidas:

| Pantalla | Pieza | Medida | Separación |
|---|---|---|---|
| PAG 02 | Tarjeta de categoría | 835 × 76 px | 206 px entre tarjetas (130 px de hueco) |
| PAG 03 | Tarjeta de suplemento | 835 × 76 px (1 línea) | 153 px entre tarjetas. **7 opciones caben sin scroll** (verificado en PAG 3.2, con dos de dos líneas) |
| PAG 04 | Tarjeta de cápsula | 347 × 221 px, rejilla 2×2 | columnas en x = 121 y 609; filas en y = 818 y 1230 |
| PAG 05 | Tarjeta de cantidad | ≈ 650 × 195 px, x = 196 | 300–330 px entre tarjetas |
| PAG 06 | Botón de estilo | 425 × 96 px, rejilla 2 + 2 + 1 | columnas en x = 84 y 568; filas en y = 828, 967 y 1107 |
| PAG 08 | Fondo del frasco | 314 × 308 px, rejilla 2×3 | columnas en x = 159 y 604; filas en y = 621, 999 y 1376 |

Escala de espaciado propuesta para lo que **no** está dibujado (teclado, avisos, error): **8 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px**. Lo que sí está dibujado se coloca con las medidas de arriba, no con la escala.

## 5. Radios

| Token | Valor | Dónde |
|---|---|---|
| `--radio-tarjeta` | 18 px (medido) | Tarjetas de lista (PAG 02–03) |
| `--radio-tarjeta-grande` | ≈ 24–30 px (a medir en la prueba de superposición) | PAG 04, 05 y 08 |
| `--radio-pastilla` | la mitad del alto | Botón primario y barra de progreso |

## 6. Sombras

Una sola sombra de tarjeta, suave, desplazada **hacia abajo y a la derecha**. Estimación inicial, se ajusta en la prueba de superposición:

`--sombra-tarjeta: 8px 10px 48px rgba(24, 32, 64, 0.10)`

El botón primario no lleva sombra en los mockups.

## 7. Movimiento

| Token | Valor | Origen |
|---|---|---|
| `--curva-estandar` | `cubic-bezier(0.2, 0, 0, 1)` (salida suave) | Propuesta; una sola curva para todo, §10 del doc. 03 |
| `--dur-entrada` | 240 ms | Doc. 03 §10 |
| `--dur-salida` | 160 ms | Doc. 03 §10 |
| `--dur-presion` | 80 ms (respuesta al tocar: escala a 0,97 y oscurece el relleno un 6 %) | Por debajo de los 100 ms que exige el doc. 03 |
| `--dur-viaje-frasco` | 560 ms | Viaje del frasco PAG 08 → 09 → 10 |
| `--dur-fabricacion` | 4000 ms de barra + 400 ms en 100 % | Plan de arquitectura |
| `--respaldo-fabricacion` | 6000 ms | Plan de arquitectura |
| `--max-animando` | 2 elementos a la vez | Doc. 03 §10 |

Con movimiento reducido del sistema: mismas duraciones, sin desplazamientos (solo cambios de opacidad).

---

## 8. Lo que se añade al PDF: interacción y animación

El diseño no cambia. Esto es lo que el PDF no puede mostrar y la app sí tiene que tener. Todo se construye con los tokens de arriba.

| Qué | Cómo, sin alterar el diseño |
|---|---|
| Respuesta al tocar | La pieza tocada se reduce a escala 0,97 en 80 ms y vuelve. No cambia colores ni medidas |
| Opción elegida | Se mantiene la respuesta al tocar y la opción queda en el estado que muestra el PDF. Donde el PDF no dibuja un estado de selección, la opción elegida se reconoce solo por el avance |
| Entrada y salida de pantallas | El marco (logo, título, botón, pie) queda fijo y solo cambia el contenido: entra en 240 ms y sale en 160 ms, con la curva estándar |
| Tarjetas | Aparecen en cascada al entrar la pantalla, respetando el máximo de 2 animando a la vez |
| Frasco PAG 08 → 09 → 10 | Viaja en 560 ms desde su casilla hasta la barra de fabricación y de ahí a la vista final |
| PAG 09 | La barra se llena de 0 a 100 % en 4 s, con el porcentaje escrito a la derecha. El frasco avanza con las estelas y los destellos del mockup |
| PAG 6.1–6.5 | La etiqueta plana del estilo elegido entra en grande, igual que en las páginas 11–15 del PDF |

### Cómo se interpreta el PDF donde no es explícito

Son lecturas del PDF, no cambios. Se dejan anotadas para que no se reinventen en cada pantalla:

1. **PAG 02:** el título del PDF dice «SELECCIONA EL EL INGREDIENTE». Se codifica **«SELECCIONA EL INGREDIENTE»**, como indica el documento 03 (§6). Es texto del JSON: si marketing lo quiere literal, se cambia sin recompilar.
2. **PAG 05:** la barrita sobre «FRASCO» se replica tal cual: gris en 30 cápsulas, azul en 60 y 120.
3. **PAG 10:** la referencia es `página completa producto terminado.png`, la que tiene el frasco dibujado.
4. **PAG 6.1–6.5:** sin título, con el nombre del estilo bajo la etiqueta, como en el PDF.

## 9. Verificación antes de dar los tokens por buenos

1. **Prueba de superposición:** cada pantalla construida con los tokens se captura a 1080×1920 (Playwright) y se superpone a su «página completa» al 50 % de opacidad. Criterios: el marco (logo, título, botón, pie) coincide a ±2 px, las tarjetas a ±2 px y el ancho de cada línea de título a ±3 %. Esto también fija los radios y la sombra que hoy están estimados.
2. **Lint de estilos:** falla si un módulo CSS de `src/marca/pantallas/` contiene un color, radio, sombra o duración literal.

## 10. Lo que este plan no incluye

- El diseño del teclado de PAG 07, el aviso de inactividad y la pantalla de error. Usan estos tokens, pero su composición se presenta aparte.
- Las cajas de rotulado por estilo, que son contenido (JSON) y dependen de las fuentes pendientes.
