"""
Compone en Surgena (estilo Naturista) las mayúsculas acentuadas y la Ñ que la
versión «Personal use only» no trae: Á É Í Ó Ú Ü Ñ. Cada una es un glifo
compuesto (la letra base + el acento suelto de la propia fuente, subido a la
altura de las mayúsculas), así que conservan el dibujo de Surgena.

Es provisional: con la licencia comercial de Surgena se sustituye el archivo
y este script deja de hacer falta (Rael, 05-10).

Requiere fontTools (no es dependencia del proyecto; se instala aparte):
  python3 -m venv paquetes/.cache/ft && paquetes/.cache/ft/bin/pip install fonttools
  paquetes/.cache/ft/bin/python ingesta/componer-acentos.py
"""
import os
import unicodedata
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'contenido', 'fuentes-etiqueta', 'Surgena-SemiBold-acentos.ttf')

# Separación entre la altura de las mayúsculas y el pie del acento, en unidades (upm 1000).
SEPARACION = 40
COMPUESTOS = {'Á': ('A', 'acute'), 'É': ('E', 'acute'), 'Í': ('I', 'acute'), 'Ó': ('O', 'acute'),
              'Ú': ('U', 'acute'), 'Ü': ('U', 'dieresis'), 'Ñ': ('N', 'tilde')}


def buscar(*tramos):
    """Ruta dentro de assets-fuente comparando cada tramo en NFC (macOS guarda los acentos en NFD)."""
    ruta = os.path.join(RAIZ, 'assets-fuente')
    for tramo in tramos:
        ruta = os.path.join(ruta, next(n for n in os.listdir(ruta) if unicodedata.normalize('NFC', n) == tramo))
    return ruta


fuente = TTFont(buscar('TIPOGRAFÍAS', 'NATURISTA', 'Surgena Personal use only.ttf'))
glyf, hmtx = fuente['glyf'], fuente['hmtx']
mapa = fuente.getBestCmap()
mayusculas = fuente['OS/2'].sCapHeight

for letra, (base, acento) in COMPUESTOS.items():
    if ord(letra) in mapa:
        continue
    gb, ga = glyf[base], glyf[acento]
    gb.recalcBounds(glyf)
    ga.recalcBounds(glyf)
    # Acento centrado sobre la letra y con su pie a SEPARACION por encima de las mayúsculas.
    dx = round((gb.xMin + gb.xMax) / 2 - (ga.xMin + ga.xMax) / 2)
    dy = mayusculas + SEPARACION - ga.yMin
    componentes = []
    for nombre, x, y in ((base, 0, 0), (acento, dx, dy)):
        c = GlyphComponent()
        c.glyphName, c.x, c.y, c.flags = nombre, x, y, 0
        componentes.append(c)
    componentes[0].flags = 0x0200  # USE_MY_METRICS: avance y márgenes de la letra base
    nuevo = Glyph()
    nuevo.numberOfContours = -1
    nuevo.components = componentes
    nombre = f'{base}{acento}'
    glyf[nombre] = nuevo
    hmtx[nombre] = hmtx[base]
    # Solo las tablas Unicode: la de Mac (formato 6) va en Mac Roman y los navegadores no la usan.
    for tabla in fuente['cmap'].tables:
        if tabla.isUnicode():
            tabla.cmap[ord(letra)] = nombre
    print(f'{letra} = {base} + {acento} ({dx}, {dy})')

# glyf[...] = ... ya añadió los glifos nuevos a su orden.
fuente.setGlyphOrder(glyf.glyphOrder)
if 'GDEF' in fuente and fuente['GDEF'].table.GlyphClassDef:
    clases = fuente['GDEF'].table.GlyphClassDef.classDefs
    for letra in COMPUESTOS:
        clases[f'{COMPUESTOS[letra][0]}{COMPUESTOS[letra][1]}'] = 1
fuente.save(SALIDA)
print(f'→ {os.path.relpath(SALIDA, RAIZ)}')
