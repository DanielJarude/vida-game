// Tela "Nascer": trocar país, gênero, "Tudo ao acaso", divisões, voltar do seletor.
import { chromium, abrir, logger, foto, checar } from './lib.mjs';
const log = logger('criacao');
const b = await chromium.launch();
for (const W of [390, 820, 1440]) {
  const p = await abrir(b, W, 'criacao', log);
  await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(400);
  const nome = async () => `${await p.locator('input').nth(0).inputValue()} ${await p.locator('input').nth(1).inputValue()}`;
  const pais = async () => (await p.locator('.mundo-nascer__pais strong').textContent().catch(() => '?'));
  await p.getByRole('button', { name: 'Trocar o país' }).click(); await p.waitForTimeout(200);
  const temVoltar = await p.locator('.mundo-nascer, .viagem').getByRole('button', { name: /Voltar|Cancelar|Manter/ }).count();
  log(`[${W}] seletor aberto: botões de cancelar/voltar dentro do seletor = ${temVoltar}`);
  await checar(p, 'seletor', log, { brasil: true });
  await foto(p, 'seletor');
  // busca sem acento e com nome inexistente
  for (const q of ['japao', 'Jap', 'eua', 'EUA', 'Inglaterra', 'Holanda', 'Suíça', 'Brasil', 'Coreia']) {
    await p.locator('input[placeholder^="Argentina"]').fill(q); await p.waitForTimeout(150);
    log(`[${W}] busca "${q}": ${(await p.locator('.viagem').innerText()).replace(/\n+/g, ' | ').replace(/28 países podem.*/, '')}`);
  }
  await p.locator('input[placeholder^="Argentina"]').fill('Japão'); await p.waitForTimeout(150);
  await p.locator('.viagem__opcao').first().click(); await p.waitForTimeout(300);
  log(`[${W}] Japão: ${await nome()}`);
  await p.locator('.escolha__item', { hasText: /^Homem/ }).click(); await p.waitForTimeout(200);
  log(`[${W}] Japão homem: ${await nome()} país=${await pais()}`);
  await p.locator('.escolha__item', { hasText: /^Não binária/ }).click(); await p.waitForTimeout(200);
  log(`[${W}] Japão NB: ${await nome()} país=${await pais()}`);
  for (let i = 0; i < 4; i++) { await p.getByRole('button', { name: 'Tudo ao acaso' }).click(); await p.waitForTimeout(200); log(`[${W}] acaso: ${await nome()} país=${await pais()} cidade=${await p.locator('.mundo-nascer select').nth(1).inputValue()}`); }
  await foto(p, 'acaso');
  // troca de divisão na Índia
  await p.getByRole('button', { name: 'Trocar o país' }).click(); await p.waitForTimeout(200);
  await p.locator('input[placeholder^="Argentina"]').fill('Índia'); await p.waitForTimeout(150);
  await p.locator('.viagem__opcao').first().click(); await p.waitForTimeout(300);
  const divs = await p.locator('.mundo-nascer select').nth(0).locator('option').allTextContents();
  for (const d of divs.slice(0, 4)) { await p.locator('.mundo-nascer select').nth(0).selectOption({ label: d }); await p.waitForTimeout(150); log(`[${W}] Índia ${d}: cidades=${(await p.locator('.mundo-nascer select').nth(1).locator('option').allTextContents()).join(', ')} nome=${await nome()} | ${(await p.locator('body').innerText()).match(/.*O lugar muda.*/)?.[0]}`); }
  await checar(p, 'india', log, { brasil: false });
  await foto(p, 'india');
  // voltar à tela inicial e entrar de novo: país persiste?
  await p.getByRole('button', { name: '← Voltar' }).first().click(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(300);
  log(`[${W}] reentrar: país=${await pais()} nome=${await nome()}`);
  log(`[${W}] ERROS ${p._erros.join(' || ')}`);
  await p.context().close();
}
await b.close(); console.log('ok');
