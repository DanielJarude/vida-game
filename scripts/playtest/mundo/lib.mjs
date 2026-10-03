// Utilitários do playtest do mundo (VIDA). Joga pela interface, como uma pessoa.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
export const SP = process.env.SP ?? '/tmp/playtest-mundo';
export const URL = process.env.URL ?? 'http://localhost:4180/';
mkdirSync(SP, { recursive: true });

export const PROIBIDOS = [/R\$/, /\breais\b/i, /\bSUS\b/, /\bENEM\b/i, /ProUni/i, /\bFIES\b/, /\bINSS\b/, /\bFGTS\b/, /\bCLT\b/, /carteira assinada/i, /\bPix\b/, /Polícia Militar/i, /\bDetran\b/i, /Série A\b/, /Série B\b/, /seleção brasileira/i, /Brasília/, /\bITCMD\b/, /\bUF\b/, /Brasileirão/i, /\bCPF\b/, /Bolsa Família/i, /vestibular/i, /\bSisu\b/i, /\bMEI\b/, /\bIPTU\b/, /\bIPVA\b/, /13º/, /Copa do Brasil/i, /brasileir[oa]s?\b/i, /\bBrasil\b/, /\bSENAI\b/i, /\bSEBRAE\b/i, /\bCNH\b/, /\bOAB\b/, /\bCRM\b/, /\bpaulista/i, /\bcarioca/i];
export const TECNICOS = [/undefined/, /\bNaN\b/, /\[object Object\]/, /\b[a-z]{2}:[a-z_]+\b/, /\{\{|\}\}/, /\$\{/, /\bnull\b/, /Infinity/];

export async function abrir(b, w, rotulo, log) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
  const p = await ctx.newPage();
  p._rot = rotulo; p._w = w; p._erros = [];
  p.on('pageerror', e => { p._erros.push('PAGEERROR ' + e.message); log?.(`[${rotulo} ${w}] PAGEERROR ${e.message}`); });
  p.on('console', m => { if (m.type() === 'error') { p._erros.push('CONSOLE ' + m.text()); log?.(`[${rotulo} ${w}] console.error ${m.text()}`); } });
  p.on('requestfailed', r => log?.(`[${rotulo} ${w}] REQFAIL ${r.url()}`));
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(800);
  return p;
}

export function logger(nome) {
  const f = `${SP}/${nome}.log`; writeFileSync(f, '');
  return s => { appendFileSync(f, s + '\n'); };
}

export async function texto(p) { return (await p.locator('body').innerText()).replace(/\n{2,}/g, '\n'); }

export async function checar(p, onde, log, opts = {}) {
  const t = await texto(p);
  const brasil = opts.brasil;
  const achados = [];
  if (!brasil) for (const r of PROIBIDOS) { const m = t.match(new RegExp('.{0,60}' + r.source + '.{0,60}', r.flags.replace('g','') + 'g')); if (m) achados.push(...m.map(x => `BR-TERMO ${r.source}: «${x}»`)); }
  for (const r of TECNICOS) { const m = t.match(new RegExp('.{0,50}' + r.source + '.{0,50}', 'g')); if (m) achados.push(...m.map(x => `TECNICO ${r.source}: «${x}»`)); }
  const lay = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const rol = document.documentElement.scrollWidth > larg + 1;
    const fora = [...document.querySelectorAll('button, a, input, select, p, span, h1, h2, h3, li')].filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > larg + 2); }).map(el => (el.textContent || el.tagName).trim().slice(0, 40));
    return { rol, fora: fora.slice(0, 5) };
  });
  if (lay.rol) achados.push('LAYOUT rolagem horizontal');
  if (lay.fora.length) achados.push('LAYOUT fora da tela: ' + lay.fora.join(' | '));
  for (const a of [...new Set(achados)]) log(`[${p._rot} ${p._w}] ${onde}: ${a}`);
  return t;
}

export async function foto(p, nome, full = true) { const f = `${SP}/${p._rot}-${p._w}-${nome}.png`; await p.screenshot({ path: f, fullPage: full }); return f; }

export async function idade(p) {
  const t = await p.locator('.avancar__idade').textContent().catch(() => null);
  return t ? Number(t.split('→')[0].trim()) : -1;
}

let semente = 1;
export function rnd() { semente = (semente * 16807) % 2147483647; return semente / 2147483647; }

export async function resolver(p, log, pref) {
  for (let k = 0; k < 10; k++) {
    const mom = p.locator('.momento');
    const ops = p.locator('.opcao:not([disabled])');
    const n = await ops.count();
    if (n) {
      const txt = (await p.locator('.momento').first().innerText().catch(() => '')).replace(/\n+/g, ' / ');
      const i = pref === undefined ? Math.floor(rnd() * n) : Math.min(pref, n - 1);
      log?.(`  MOMENTO (${await idade(p)}a): ${txt.slice(0, 400)}  => escolha ${i}`);
      await ops.nth(i).click(); await p.waitForTimeout(80); continue;
    }
    const c = p.getByRole('button', { name: /^(Continuar|Seguir|Ok|Entendi)$/ });
    if (await c.count()) { await c.first().click(); await p.waitForTimeout(80); continue; }
    return;
  }
}

export async function avancar(p, n, log, pref) {
  for (let i = 0; i < n; i++) {
    await resolver(p, log, pref);
    const btn = p.locator('.avancar__botao');
    if (!(await btn.count())) return false;
    if (await btn.isDisabled()) { await resolver(p, log, pref); if (await btn.isDisabled()) { log?.('  BOTAO avancar desabilitado, momento preso?'); await foto(p, 'preso'); return false; } }
    await btn.click(); await p.waitForTimeout(60);
    const fech = await p.locator('.fechamento').innerText().catch(() => '');
    if (fech) log?.(`  ANO ${await idade(p)}: ${fech.replace(/\n+/g, ' / ').slice(0, 600)}`);
  }
  await resolver(p, log, pref);
  return true;
}

const CURTO = { 'Linha da Vida': 'História', 'Tempo livre': 'Tempo' };
export async function aba(p, nome) {
  if (p._w <= 760) await p.locator('.barra__item', { hasText: CURTO[nome] ?? nome }).first().click();
  else await p.locator(`.aba[aria-label="${nome}"]`).first().click();
  await p.waitForTimeout(250);
}
export async function secao(p, nome) {
  await aba(p, 'Vida');
  const b = p.locator('main').getByRole('button', { name: new RegExp('^' + nome) }).first();
  if (await b.count()) { await b.click(); await p.waitForTimeout(250); return true; }
  const t = p.locator('main').getByRole('tab', { name: new RegExp('^' + nome) }).first();
  if (await t.count()) { await t.click(); await p.waitForTimeout(250); return true; }
  return false;
}

export async function nascer(p, { pais, regiao, divisao, cidade, genero, classe }, log) {
  await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(400);
  if (genero) await p.locator('.escolha__item', { hasText: new RegExp('^' + genero) }).first().click();
  const nomeAntes = await p.locator('input').nth(0).inputValue();
  const sobAntes = await p.locator('input').nth(1).inputValue();
  if (pais && pais !== 'Brasil') {
    await p.getByRole('button', { name: 'Trocar o país' }).click(); await p.waitForTimeout(200);
    await foto(p, 'nascer-escolherpais', true);
    if (regiao) {
      await p.locator('.viagem__opcao', { hasText: regiao }).first().click(); await p.waitForTimeout(200);
      await foto(p, 'nascer-regiao', true);
      log(`  REGIAO ${regiao}: ${(await p.locator('.viagem').innerText()).replace(/\n+/g, ' | ')}`);
    } else {
      await p.locator('input[placeholder^="Argentina"]').fill(pais.slice(0, 4)); await p.waitForTimeout(200);
      log(`  BUSCA ${pais.slice(0,4)}: ${(await p.locator('.viagem').innerText()).replace(/\n+/g, ' | ')}`);
    }
    await p.locator('.viagem__opcao', { has: p.locator('.viagem__nome', { hasText: new RegExp('^' + pais) }) }).first().click(); await p.waitForTimeout(300);
  }
  const sels = p.locator('.mundo-nascer select');
  if (divisao) { await sels.nth(0).selectOption({ label: divisao }); await p.waitForTimeout(150); }
  if (cidade) { await sels.nth(1).selectOption({ label: cidade }); await p.waitForTimeout(150); }
  if (classe) await p.locator('.escolha__item', { hasText: new RegExp('^' + classe + '$') }).first().click();
  const nome = await p.locator('input').nth(0).inputValue();
  const sob = await p.locator('input').nth(1).inputValue();
  const rotDiv = await p.locator('.mundo-nascer .campo__rotulo').nth(1).textContent();
  const divs = await sels.nth(0).locator('option').allTextContents();
  const cids = await sels.nth(1).locator('option').allTextContents();
  log(`NASCER ${pais}: nome antes=${nomeAntes} ${sobAntes} | depois=${nome} ${sob} | rotulo divisao=${rotDiv} | divisoes=${divs.join(', ')} | cidades=${cids.join(', ')}`);
  log(`  nota: ${await p.locator('.criacao, main, body').first().innerText().then(t => (t.match(/.*O lugar muda.*/) || [''])[0])}`);
  await checar(p, 'criacao', log, { brasil: pais === 'Brasil' });
  await foto(p, 'nascer-form', true);
  await p.locator('.criacao__nascer').click(); await p.waitForTimeout(600);
  return { nome, sob };
}

export async function dumpAbas(p, tag, log, brasil, salvarTexto = true) {
  const out = {};
  for (const a of ['Linha da Vida', 'Você', 'Pessoas', 'Formação', 'Trabalho', 'Tempo livre', 'Vida']) {
    await aba(p, a);
    out[a] = await checar(p, `${tag}/${a}`, log, { brasil });
    await foto(p, `${tag}-${a.replace(/ /g, '_')}`);
  }
  for (const s of ['Casa', 'Dinheiro', 'Compras', 'Cidade']) {
    if (await secao(p, s)) { out['Vida·' + s] = await checar(p, `${tag}/Vida·${s}`, log, { brasil }); await foto(p, `${tag}-Vida_${s}`); }
    else log(`  (seção ${s} não encontrada)`);
  }
  if (salvarTexto) writeFileSync(`${SP}/${p._rot}-${p._w}-${tag}.txt`, Object.entries(out).map(([k, v]) => `##### ${k}\n${v}`).join('\n\n'));
  await aba(p, 'Linha da Vida');
  return out;
}
export { chromium };

/** "Truque de testador": exporta a vida pelo menu, põe dinheiro na conta e importa de volta (pela tela inicial). */
export async function darDinheiro(p, conta, log, mexer) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  await p.locator('.marca').click(); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Exportar esta vida/ }).click()]);
  const f = `${SP}/${p._rot}-export.json`; await dl.saveAs(f);
  const arq = JSON.parse(readFileSync(f, 'utf8'));
  arq.vida.financas.conta = conta;
  if (mexer) mexer(arq.vida);
  const f2 = `${SP}/${p._rot}-export-rico.json`; writeFileSync(f2, JSON.stringify(arq));
  await p.getByRole('button', { name: 'Voltar ao início' }).click(); await p.waitForTimeout(500);
  await p.locator('input[type=file]').setInputFiles(f2); await p.waitForTimeout(800);
  log?.('  IMPORT previa: ' + (await p.locator('.importar').innerText()).replace(/\n+/g, ' | '));
  await p.getByRole('button', { name: /Importar e continuar/ }).click(); await p.waitForTimeout(1200);
  if (!(await p.locator('.avancar__botao').count())) { const c = p.getByRole('button', { name: /Continuar a vida/ }); if (await c.count()) { await c.click(); await p.waitForTimeout(800); } }
  return f2;
}
