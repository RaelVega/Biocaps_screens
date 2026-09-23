// Prueba de estrés del nombre del producto: en los 5 estilos escribe tres palabras
// largas y 30 «W» (la letra más ancha) y comprueba que en PAG 07 y en PAG 10 ninguna
// línea se sale de su caja. Uso: node pruebas/visual/estres-nombre.mjs [url]
import { chromium } from 'playwright-core';
const URL = process.argv[2] ?? 'http://localhost:4173/';
const SALIDA = 'pruebas/visual/resultados';
const ESTILOS = ['NATURISTA', 'FARMACÉUTICO', 'MODERNO', 'DEPORTIVO', 'FEMENINO'];
const TEXTOS = { palabras: 'EXTRAORDINARIO SUPERLATIVO MAGNIFICENCIA', w: 'W'.repeat(30) };
// ¿Cada línea del nombre queda dentro de su caja? (margen de 1 px por redondeo)
const revisar = (p) => p.evaluate(() => [...document.querySelectorAll('[class*="caja"]')].map((caja) => {
  const c = caja.getBoundingClientRect();
  // Solo el texto: el cursor parpadeante queda fuera a propósito.
  const lineas = [...caja.querySelectorAll('[class*="textoLinea"]')].map((l) => { const r = document.createRange(); r.selectNodeContents(l.firstChild); return r.getBoundingClientRect(); });
  const fuera = lineas.filter((r) => r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1).length;
  return { lineas: lineas.length, fuera, texto: caja.innerText.replace(/\n/g, ' / ') };
}));
{
  const b = await chromium.launch({ channel: 'chrome' });
  let malos = 0;
  for (const estilo of ESTILOS) for (const [clave, texto] of Object.entries(TEXTOS)) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    const clic = async (nombre, exacto = false) => { await p.getByRole('button', { name: nombre, exact: exacto }).first().click(); await p.waitForTimeout(80); };
    await p.goto(URL); await p.waitForSelector('[data-paso=portada]');
    await p.mouse.click(540, 960); await p.waitForTimeout(450);
    await clic('OMEGAS'); await clic('SIGUIENTE'); await p.waitForTimeout(400);
    await clic('OMEGA 3 (N)'); await clic('SIGUIENTE'); await p.waitForTimeout(400);
    await clic('SIGUIENTE'); await p.waitForTimeout(400);
    await clic('30 CÁPSULAS'); await clic('SIGUIENTE'); await p.waitForTimeout(400);
    await clic(estilo, true); await clic('SIGUIENTE'); await p.waitForTimeout(400);
    await clic('SIGUIENTE'); await p.waitForTimeout(400);
    for (const letra of texto) await clic(letra === ' ' ? 'ESPACIO' : letra, true);
    const pag07 = await revisar(p);
    await p.screenshot({ path: `${SALIDA}/estres-${clave}-${estilo}-pag07.png` });
    await clic('FINALIZAR'); await p.waitForTimeout(400);
    await p.mouse.click(316, 775); await p.waitForTimeout(100); // color transparente
    await clic('SIGUIENTE'); await p.waitForTimeout(5200);
    const pag10 = await revisar(p);
    await p.screenshot({ path: `${SALIDA}/estres-${clave}-${estilo}-pag10.png` });
    const r7 = pag07[0], r10 = pag10[0];
    malos += (r7?.fuera ?? 1) + (r10?.fuera ?? 1);
    console.log(`${estilo.padEnd(13)} ${clave.padEnd(9)} PAG07 «${r7?.texto}» fuera=${r7?.fuera}  |  PAG10 líneas=${r10?.lineas} fuera=${r10?.fuera}`);
    await p.close();
  }
  await b.close();
  console.log(malos ? `\n${malos} líneas fuera de su caja` : '\nNinguna línea se sale de su caja');
  process.exitCode = malos ? 1 : 0;
}
