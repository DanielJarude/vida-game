// Migração pela interface: nasce em ORIGEM (família rica), trabalha, abre "Mudar de país",
// inspeciona as portas e os resumos dos destinos, confirma DESTINO e vive depois.
import { chromium, abrir, logger, nascer, avancar, dumpAbas, idade, foto, checar, aba, secao, texto, resolver, darDinheiro } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const ORIG = process.env.ORIG ?? 'Brasil'; const DEST = process.env.DEST ?? 'Argentina';
const VER = (process.env.VER ?? 'Portugal,Japão,Argentina').split(',');
const W = Number(process.env.W ?? 390); const MOTIVO = process.env.MOTIVO ?? 'Trabalhar';
const rot = ('mig-' + ORIG + '-' + DEST).normalize('NFD').replace(/[^\w-]/g, '');
const log = logger(`${rot}-${W}`);
const b = await chromium.launch();
const p = await abrir(b, W, rot, log);
await nascer(p, { pais: ORIG, regiao: process.env.REGIAO, classe: process.env.CLASSE ?? 'Rica', genero: process.env.GEN }, log);
await avancar(p, 19, log);
// procurar trabalho
async function candidatar() {
  await aba(p, 'Trabalho');
  const c = p.getByRole('button', { name: /Candidatar-se/ });
  if (await c.count()) { await c.first().click(); await p.waitForTimeout(300); await foto(p, 'entrevista'); await resolver(p, log, 0); log('  candidatou-se: ' + (await texto(p)).slice(0, 200).replace(/\n/g, ' | ')); }
  await aba(p, 'Linha da Vida');
}
await candidatar(); await avancar(p, 1, log); await candidatar(); await avancar(p, Number(process.env.ATE ?? 27) - await idade(p), log);
const comBens = v => {
  if (!process.env.BENS) return;
  v.financas.bens = [...(v.financas.bens ?? []), { id: 'icasa', tipo: 'imovel', modeloId: 'apto_2q', nome: 'apartamento de dois quartos', valor: 320000, tCompra: v.t - 24, municipioId: v.moradia.municipioId, estado: 80, dono: 'eu' }, { id: 'vcarro', tipo: 'veiculo', modeloId: 'fiat_mobi', nome: 'Fiat Mobi', valor: 48000, tCompra: v.t - 12, estado: 80 }];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'apto_2q', aluguel: 0, padrao: 3, tInicio: v.t - 24 };
};
if (process.env.CONTA) await darDinheiro(p, Number(process.env.CONTA), log, comBens);
log(`=== ANTES (idade ${await idade(p)})`);
await dumpAbas(p, 'antes', log, ORIG === 'Brasil');
await secao(p, 'Cidade');
const sec = p.locator('button', { hasText: /^Mudar de país/ }).first();
await sec.click(); await p.waitForTimeout(300);
await foto(p, 'mudar-0');
await p.locator('.viagem__opcao', { hasText: MOTIVO }).first().click(); await p.waitForTimeout(400);
// lista de países por região: abre cada região e registra as portas
const regs = await p.locator('.viagem__opcao .viagem__nome').allTextContents();
log('REGIOES: ' + regs.join(' || '));
const nreg = await p.locator('.viagem__opcao').count();
for (let k = 0; k < nreg; k++) {
  await p.locator('.viagem__opcao').nth(k).click(); await p.waitForTimeout(300);
  log('  PORTAS: ' + (await p.locator('.viagem__opcoes').first().innerText()).replace(/\n+/g, ' | '));
  await foto(p, 'portas-' + k);
  await checar(p, 'portas-' + k, log, { brasil: true });
  await p.getByRole('button', { name: '← Outras regiões' }).click(); await p.waitForTimeout(200);
}
async function irPara(pais, confirmar) {
  await p.locator('input[placeholder^="Argentina"]').fill(pais); await p.waitForTimeout(300);
  await p.locator('.viagem__opcao', { has: p.locator('.viagem__nome', { hasText: new RegExp('^' + pais) }) }).first().click(); await p.waitForTimeout(300);
  log(`  CIDADES ${pais}: ` + (await p.locator('.viagem').innerText()).replace(/\n+/g, ' | '));
  await foto(p, 'cidades-' + pais);
  await p.locator('.viagem__opcao').first().click(); await p.waitForTimeout(300);
  const res = await p.locator('.viagem__resumo').innerText();
  log(`  RESUMO ${pais}: ` + res.replace(/\n+/g, ' | '));
  await checar(p, 'resumo-' + pais, log, { brasil: true });
  await foto(p, 'resumo-' + pais);
  const bt = p.locator('.viagem__resumo button', { hasText: /^Mudar para/ });
  log(`  botão: ${await bt.count() ? (await bt.isEnabled() ? 'habilitado' : 'desabilitado') : 'ausente'} ${await p.locator('.viagem__resumo').locator('.via, .nota, .acao__motivo').allTextContents().then(x=>x.join(' / '))}`);
  if (confirmar) { await bt.click(); await p.waitForTimeout(800); return true; }
  await p.getByRole('button', { name: '← Voltar' }).first().click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: '← Voltar' }).first().click(); await p.waitForTimeout(200);
  return false;
}
for (const v of VER) if (v !== DEST) await irPara(v, false);
await irPara(DEST, true);
log('=== DEPOIS DA MUDANÇA ' + (await texto(p)).slice(0, 1500).replace(/\n+/g, ' | '));
await foto(p, 'depois-mudanca');
await resolver(p, log);
await dumpAbas(p, 'mudou', log, DEST === 'Brasil');
await avancar(p, 1, log); await dumpAbas(p, 'mudou1', log, DEST === 'Brasil');
await avancar(p, 4, log); await dumpAbas(p, 'mudou5', log, DEST === 'Brasil');
log('ERROS: ' + p._erros.join(' || '));
await b.close(); console.log('feito', rot);
