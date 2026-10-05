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

## Video de portada

El video no pasa por el script: se convierte a mano con ffmpeg (`brew install ffmpeg`) y se guarda en `contenido/video/`. Marketing lo entrega en HEVC de 10 bits, que Chromium/Edge en Windows solo decodifica con hardware compatible, con una pista de audio (en silencio) que el kiosco no quiere y con un salto al volver a empezar (el último fotograma no es el primero). Se pasa a H.264 de 8 bits, sin audio y con *faststart*, y se cierra el bucle con un fundido: se quita el primer medio segundo (15 fotogramas) y se funde con el último, así el video acaba en el fotograma anterior al primero (4,97 s → 4,47 s; aprobado por Rael el 01-10):

```
ffmpeg -i "assets-fuente/PAG 01 PORTADA/BIOCAPS_PANTALLABLOQUEO_EXPOFAC2026.mp4" \
  -filter_complex "[0:v]split[a][b];[a]trim=start_frame=15,setpts=PTS-STARTPTS[m];[b]trim=end_frame=15,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=0.5:offset=3.9667,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 -g 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart -map_metadata -1 contenido/video/portada_expofac2026.mp4
```

`offset` es la duración del tramo recortado menos la del fundido: (149 − 15) / 30 − 0,5. Si llega un video de otra duración, se recalcula.

Si llega otra versión, se repite el comando y, si cambia el nombre, se actualiza `estaticos.videos` en `equivalencias.json` y se corre `npm run ingesta` para reescribir el manifiesto.

## Tipografías de etiqueta

Las fuentes del nombre se copian de `TIPOGRAFÍAS/<ESTILO>/` a `contenido/fuentes-etiqueta/` con nombre sin espacios y se registran en `estaticos.fuentes` (con el peso de la cara). La Surgena de Naturista es la versión «Personal use only» y no trae Á É Í Ó Ú Ü Ñ: `componer-acentos.py` las compone con los acentos sueltos de la propia fuente y escribe `Surgena-SemiBold-acentos.ttf`. Necesita fontTools, que no es dependencia del proyecto:

```
python3 -m venv paquetes/.cache/ft && paquetes/.cache/ft/bin/pip install fonttools
paquetes/.cache/ft/bin/python ingesta/componer-acentos.py
```

Cuando llegue la licencia comercial, se copia ese archivo en su lugar, se actualiza `equivalencias.json` y el script deja de hacer falta.

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
