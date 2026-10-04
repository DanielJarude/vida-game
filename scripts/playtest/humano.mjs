// Capturas do FIX pós-playtest humano em 1440, 820 e 390 px: Nascer, a ficha (o que faz sentido agora, "Algo mais"),
// Formação (o kōsen; a faculdade), A semana, Hobbies, Redes, a clínica, a concessionária, a ótica, Pertences e a Linha
// da Vida. Confere: rolagem horizontal, erros, e que "Viver mais um ano" não cobre nada (nem é coberto pela barra).
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com os saves de gerarHumano.ts> node scripts/playtest/humano.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-humano';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const notas = [];
const cenas = [
  [null, 'Nascer'], ['amiga', 'Pessoas', null, 'ficha'], ['amiga', 'Pessoas', null, 'ficha-aberta'],
  ['tecnico', 'Formação'], ['faculdade', 'Formação'], ['tecnico', 'Tempo livre', 'A semana'], ['tecnico', 'Tempo livre', 'Hobbies'],
  ['amiga', 'Tempo livre', 'Redes sociais'], ['amiga', 'Vida', 'Compras', 'clinica'], ['amiga', 'Vida', 'Compras', 'concessionaria'],
  ['amiga', 'Vida', 'Compras', 'otica'], ['amiga', 'Vida', 'Pertences'], ['amiga', 'Linha da Vida']
];
for (const [cen, area, aba, depois] of cenas) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    const rot = `${cen ?? 'nascer'} ${area}${aba ? '/' + aba : ''}${depois ? '/' + depois : ''} ${w}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    if (!cen) {
      await p.getByRole('button', { name: /Nascer de novo/ }).click();
      await p.getByRole('button', { name: 'Tudo ao acaso' }).click();
      await p.waitForTimeout(500);
    } else {
      await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/vida-humano-${cen}.json`, 'utf8'));
      await p.goto(URL);
      await p.getByRole('button', { name: /Continuar a vida/ }).click();
      await p.waitForTimeout(400);
      let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
      if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area === 'Linha da Vida' ? 'História' : area }).first();
      await bt.click();
      await p.waitForTimeout(300);
      if (aba) { await p.getByRole('tab', { name: aba, exact: true }).first().click(); await p.waitForTimeout(250); }
      if (depois === 'clinica' || depois === 'concessionaria' || depois === 'otica') {
        const nome = { clinica: 'Clínica de cirurgia plástica', concessionaria: 'Concessionária', otica: 'Ótica, roupas' }[depois];
        await p.getByRole('button', { name: new RegExp(nome) }).first().click(); await p.waitForTimeout(400);
      }
      if (depois?.startsWith('ficha')) {
        await p.locator('main .cartao-pessoa, main button', { hasText: 'Yua' }).first().click(); await p.waitForTimeout(300);
        if (depois === 'ficha-aberta') { await p.locator('details.ficha__grupo summary').first().click(); await p.waitForTimeout(200); }
      }
    }
    // Rolagem horizontal; "Viver mais um ano" no fim, sem cobrir nem ser coberto.
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    if (cen && !depois) {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(150);
      const sob = await p.evaluate(() => {
        const a = document.querySelector('.avancar__botao')?.getBoundingClientRect();
        if (!a) return 'sem botão';
        const cruza = (r) => !(r.right <= a.left || r.left >= a.right || r.bottom <= a.top || r.top >= a.bottom);
        const outros = [...document.querySelectorAll('main button, main a, main input, main select, main p, main li')].filter(x => !x.closest('.avancar') && x.checkVisibility()).map(x => x.getBoundingClientRect()).filter(r => r.width && r.height && cruza(r)).length;
        const barra = document.querySelector('.barra');
        const coberto = barra && getComputedStyle(barra).display !== 'none' ? cruza(barra.getBoundingClientRect()) : false;
        return `${outros}|${coberto}`;
      });
      if (sob !== '0|false') problemas.push(`${rot}: "Viver mais um ano" cruza conteúdo ou é coberto (${sob})`);
      else notas.push(`${rot}: "Viver mais um ano" no fim, sem sobreposição`);
      await p.evaluate(() => window.scrollTo(0, 0));
    }
    if (w === 390) {
      const pequenos = await p.evaluate(() => [...document.querySelectorAll('main button, [role=dialog] button')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 32 && !x.classList.contains('link'); }).map(x => (x.textContent ?? '').trim().slice(0, 30)));
      if (pequenos.length) notas.push(`${rot}: ${pequenos.length} botões com menos de 32 px (${pequenos.slice(0, 3).join(' | ')})`);
    }
    // Caracteres soltos nas lojas: nenhum texto de 1 caractere visível que não seja número ou símbolo de interface.
    const soltos = await p.evaluate(() => [...document.querySelectorAll('.oferta span, .oferta strong')].filter(x => x.children.length === 0 && (x.textContent ?? '').trim().length === 1 && !/[0-9✓→·!]/.test(x.textContent ?? '') && x.getBoundingClientRect().width > 0).map(x => x.textContent));
    if (soltos.length) problemas.push(`${rot}: caracteres soltos: ${soltos.join(' ')}`);
    const nome = `${cen ?? 'nascer'}-${area.replace(/ /g, '_')}${aba ? '-' + aba.replace(/ /g, '_') : ''}${depois ? '-' + depois : ''}-${w}`;
    await p.screenshot({ path: `${SP}/${nome}.png`, fullPage: !depois || !['clinica', 'concessionaria', 'otica'].includes(depois) });
    await ctx.close();
  }
}
await b.close();
const saida = [problemas.length ? problemas.join('\n') : 'sem problemas estruturais (rolagem horizontal, erros, sobreposição do avançar, caracteres soltos)', ...notas].join('\n');
writeFileSync(`${SP}/capturas.txt`, saida);
console.log(saida);
