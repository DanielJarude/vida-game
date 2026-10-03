// Importa uma vida (arquivo) e explora viagens (Tempo livre) e "Mudar de cidade" (Vida · Cidade).
import { chromium, abrir, logger, foto, checar, aba, secao, texto, resolver, avancar } from './lib.mjs';
const ARQ = process.env.ARQ; const rot = process.env.ROT ?? 'viagem'; const W = Number(process.env.W ?? 390);
const log = logger(`${rot}-${W}`);
const b = await chromium.launch();
const p = await abrir(b, W, rot, log);
await p.locator('input[type=file]').setInputFiles(ARQ); await p.waitForTimeout(800);
await p.getByRole('button', { name: /Importar e continuar/ }).click(); await p.waitForTimeout(1500);
await resolver(p, log);
await aba(p, 'Tempo livre');
const ver = p.getByRole('button', { name: 'Ver destinos' });
log('ver destinos: ' + await ver.count());
if (await ver.count()) {
  await ver.last().click(); await p.waitForTimeout(300);
  log('GRUPOS: ' + (await p.locator('.viagem').first().innerText()).replace(/\n+/g, ' | '));
  await foto(p, 'viagem-grupos'); await checar(p, 'viagem-grupos', log, { brasil: false });
  const ops = p.locator('.viagem__opcao');
  const n = await ops.count();
  await ops.nth(n - 1).click(); await p.waitForTimeout(300);
  log('LUGARES: ' + (await p.locator('.viagem').first().innerText()).replace(/\n+/g, ' | '));
  await p.locator('.viagem__opcao').first().click(); await p.waitForTimeout(300);
  log('DURACOES: ' + (await p.locator('.viagem').first().innerText()).replace(/\n+/g, ' | '));
  await p.locator('.viagem__opcao').first().click(); await p.waitForTimeout(300);
  log('RESUMO: ' + (await p.locator('.viagem__resumo').innerText()).replace(/\n+/g, ' | '));
  await foto(p, 'viagem-resumo'); await checar(p, 'viagem-resumo', log, { brasil: false });
  const ir = p.locator('.viagem__resumo button').first();
  if (await ir.count() && await ir.isEnabled()) { await ir.click(); await p.waitForTimeout(600); log('APOS VIAGEM: ' + (await texto(p)).slice(0, 900).replace(/\n+/g, ' | ')); await foto(p, 'viagem-apos'); await resolver(p, log); }
}
await secao(p, 'Cidade');
const mc = p.locator('button', { hasText: /^Mudar de cidade/ }).first();
await mc.click(); await p.waitForTimeout(300);
log('MUDAR DE CIDADE: ' + (await p.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 2500));
await foto(p, 'mudar-cidade'); await checar(p, 'mudar-cidade', log, { brasil: false });
await avancar(p, 1, log);
await aba(p, 'Linha da Vida');
log('LINHA: ' + (await texto(p)).slice(0, 1200).replace(/\n+/g, ' | '));
log('ERROS: ' + p._erros.join(' || '));
await b.close(); console.log('feito');
