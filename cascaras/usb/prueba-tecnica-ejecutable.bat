@echo off
REM Prueba tecnica de la via A: abre el ejecutable de esta carpeta (Biocaps.exe o
REM Biocaps Propuesta.exe) en modo prueba (lista de verificaciones en pantalla).
REM Salir: Ctrl+Shift+Q o Alt+F4.
for %%f in ("%~dp0Biocaps*.exe") do start "" "%%f" --humo
