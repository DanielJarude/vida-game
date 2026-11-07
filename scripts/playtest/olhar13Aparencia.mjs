// VIDA 13 — Você · Aparência no app (prévia, piercings por zona) em 1440/390, claro/escuro. Preview na porta 4181; save gerado em a13/qa-Aparencia.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT = '/home/iego_ossi/vida-trabalho/a13/fotos/Aparencia';
const b = await chromium.launch();
for (const [W, H] of [[1440, 900], [390, 844]]) for (const tema of ['claro', 'escuro']) {
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto('http://localhost:4181/');
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.9.1'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync('/home/iego_ossi/vida-trabalho/a13/qa-Aparencia/saves/vida-a13-piercings.json', 'utf8'), tema]);
  await p.goto('http://localhost:4181/'); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(800);
  let bt = p.locator('.barra__item', { hasText: 'Você' }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: 'Você', exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(500);
  const aba = p.getByRole('tab', { name: /Aparência/ }).locator('visible=true').first();
  if (await aba.count()) { await aba.click(); await p.waitForTimeout(500); }
  const tag = `${W}-${tema}`;
  const sec = p.locator('section.aparencia').first();
  await sec.locator('.aparencia__corpo').screenshot({ path: `${OUT}/app-aparencia-${tag}.png` });
  // Mudar corte/maquiagem: a prévia com o antes.
  await sec.locator('select').first().selectOption('bob_franja'); await p.waitForTimeout(300);
  await p.getByRole('radio', { name: 'De costas' }).first().click(); await p.waitForTimeout(300);
  await sec.locator('.aparencia__corpo').screenshot({ path: `${OUT}/app-previa-${tag}.png` });
  const pc = p.locator('section.piercings13');
  await pc.waitFor({ timeout: 8000 });
  await pc.scrollIntoViewIfNeeded();
  await pc.screenshot({ path: `${OUT}/app-piercings-orelha-${tag}.png` });
  await pc.getByRole('button', { name: /Flor de pedras/ }).first().click(); await p.waitForTimeout(300);
  await pc.getByRole('checkbox').first().check().catch(() => {}); await p.waitForTimeout(300);
  await pc.screenshot({ path: `${OUT}/app-piercings-prova-${tag}.png` });
  await pc.getByRole('radio', { name: /^Nariz/ }).click(); await p.waitForTimeout(300);
  await pc.screenshot({ path: `${OUT}/app-piercings-nariz-${tag}.png` });
  await pc.getByRole('radio', { name: /^Boca/ }).click(); await p.waitForTimeout(300);
  await pc.locator('.piercings13__lupa').screenshot({ path: `${OUT}/app-piercings-boca-${tag}.png` });
  await pc.getByRole('radio', { name: /^Umbigo/ }).click(); await p.waitForTimeout(300);
  await pc.locator('.piercings13__lupa').screenshot({ path: `${OUT}/app-piercings-umbigo-${tag}.png` });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(tag, 'scrollWidth', larg, 'erros', erros);
  await p.close();
}
await b.close();
