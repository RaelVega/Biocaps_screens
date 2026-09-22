# Ingesta de assets

Convierte el material del cliente (el espejo de Drive en `assets-fuente/`) en el contenido que carga la app.

```
npm run ingesta                                     # espejo por defecto: assets-fuente/
ORIGEN_ASSETS="/ruta/a/otra copia" npm run ingesta  # otra copia del espejo
```

## Qué hace

1. Lee `equivalencias.json`: qué archivo del cliente se convierte en qué pieza y con qué operaciones.
2. Genera los WebP al tamaño de pantalla en `contenido/img/`. **Esa carpeta es del script: se vacía en cada corrida.**
3. Reescribe `contenido/manifiesto.json`. **No se edita a mano.**
4. Deja los mockups a 1080×1920 en `pruebas/visual/referencias/`, para comparar. La app nunca los carga.

## Cuando llega material nuevo de Drive

1. Vuelve a bajar la carpeta a `assets-fuente/`. **No renombres nada del espejo.**
2. Si un archivo trae otro nombre, se corrige en `equivalencias.json`, no en el espejo.
3. `npm run ingesta` y luego `npm test`. Las pruebas fallan si falta alguna imagen que el contenido nombra.
4. Si el cliente reexporta una tarjeta de PAG 04 o PAG 05 con otra medida, hay que volver a medir sus rectángulos de `borrarTexto`.

## Operaciones de `equivalencias.json`

| Campo | Qué hace |
|---|---|
| `ancho` / `alto` | Tamaño final en píxeles del lienzo 1080×1920 |
| `recorte` | `[x, y, ancho, alto]` en píxeles del archivo de origen |
| `borrarTexto` | Rellena esos rectángulos con el color de fondo dominante. Las tarjetas de PAG 04 y PAG 05 traen el texto incrustado; la app lo escribe en vivo desde `contenido.json` |
| `recolorear` | `[x, y, ancho, alto, "#RRGGBB"]`: cambia el color de un detalle conservando el suavizado |
| `colorAAlfa` | Vuelve transparente un color de fondo (el logo recortado del mockup) |
| `recortarTransparente` | Recorta al contorno opaco (los 30 frascos terminados traen márgenes distintos) |

## Trampas

- **Acentos:** macOS guarda los nombres en NFD y el JSON va en NFC. El script compara cada tramo de la ruta normalizado; no compares cadenas de ruta tal cual en ningún otro script.
- **Nombres del cliente con erratas o equivocados:** se documentan con una `nota` junto a la pieza (p. ej. los frascos farmacéuticos que vienen con nombre de naturista).
- **Datos que decidió el PDF sobre la pieza suelta:** la barrita de «30 cápsulas» viene azul en la pieza y es gris en el PDF; se recolorea.
