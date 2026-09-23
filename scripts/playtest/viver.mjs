// Joga uma vida pela interface tomando decisões de jogador (não só avançando).
//   SP=/tmp/vida-viver LARGURA=390 node scripts/playtest/viver.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-viver';
const L = Number(process.env.LARGURA ?? 1280);
mkdirSync(SP, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: L, height: L < 700 ? 844 : 860 } });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push(e.message));
await p.goto(process.env.URL ?? 'http://localhost:4173/');
await p.evaluate(() => localStorage.clear());
await p.reload();

const movel = L <= 760;
const INDICE = { Vida: 0, Pessoas: 1, Rumo: 2, Casa: 3, Tempo: 4 };
const aba = async nome => { await p.locator(movel ? '.barra__item' : '.aba').nth(INDICE[nome]).click(); await p.waitForTimeout(80); };
const foto = async nome => p.screenshot({ path: `${SP}/${nome}.png`, fullPage: false });
const idade = async () => Number((await p.locator('.cabecalho__idade strong').textContent()).match(/(\d+) ano/)[1]);
async function resolver(pref = 0) {
  for (let k = 0; k < 6; k++) {
    const ops = p.locator('.opcao:not([disabled])');
    if (await ops.count()) { await ops.nth(Math.min(pref, (await ops.count()) - 1)).click(); await p.waitForTimeout(60); continue; }
    const c = p.getByRole('button', { name: /^Continuar$/ });
    if (await c.count()) { await c.first().click(); await p.waitForTimeout(60); continue; }
    return;
  }
}
async function avancar(n = 1) {
  for (let i = 0; i < n; i++) {
    await resolver(i % 3);
    await p.locator('.avancar__botao').click();
    await p.waitForTimeout(50);
    if (await p.locator('.momento').count()) { await foto(`momento-${await idade()}`); }
    await resolver(i % 3);
  }
}
async function clicarSeDer(localizador) {
  const el = p.locator(localizador).first();
  if (await el.count() && await el.isEnabled()) { await el.click(); await p.waitForTimeout(80); return true; }
  return false;
}

await p.getByRole('button', { name: /Nascer de novo/ }).click();
await p.locator('.criacao__nascer').click();
await avancar(7);
// Tempo livre: começar futebol
await aba('Tempo');
await foto('tempo-7');
await clicarSeDer('.rotina:has-text("Jogar bola") button:has-text("Começar")');
await aba('Vida');
await avancar(9);
await aba('Pessoas');
await foto('pessoas-16');
const primeiro = p.locator('.pessoa').first();
if (await primeiro.count()) { await primeiro.click(); await p.waitForTimeout(100); await foto('ficha-16'); await clicarSeDer('.folha button:has-text("Passar um tempo")'); await p.keyboard.press('Escape'); }
await aba('Vida');
await avancar(1);
await aba('Rumo');
await foto('rumo-17');
await clicarSeDer('button:has-text("Fazer o ENEM")');
await avancar(1);
await aba('Rumo');
await foto('rumo-18');
const curso = p.locator('.opcao-curso__cabeca').first();
if (await curso.count()) { await curso.click(); await p.waitForTimeout(80); await foto('curso-aberto'); await clicarSeDer('.opcao-curso__corpo .via button:has-text("Tentar")'); await resolver(); }
await p.waitForTimeout(100);
await foto('apos-matricula');
await aba('Vida');
await avancar(2);
await aba('Rumo');
const vaga = p.locator('.vaga button:has-text("Candidatar")').first();
if (await vaga.count()) { await vaga.click(); await p.waitForTimeout(80); await foto('entrevista'); await resolver(0); }
await aba('Casa');
await foto('casa-20');
await clicarSeDer('button:has-text("Sair de casa")');
await foto('casa-sair');
await clicarSeDer('.via button:has-text("Alugar")');
await foto('casa-apos');
await aba('Vida');
await avancar(10);
await foto('vida-30');
await aba('Pessoas'); await foto('pessoas-30');
await aba('Casa'); await foto('casa-30');
await aba('Rumo'); await foto('rumo-30');
await aba('Vida');
for (let i = 0; i < 90 && await p.locator('.avancar__botao').count(); i++) await avancar(1);
await foto('fim');
await p.screenshot({ path: `${SP}/fim-inteiro.png`, fullPage: true });
await b.close();
console.log(erros.length ? erros.join('\n') : 'sem erros');
