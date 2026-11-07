// VIDA 13 — fotografa a tela da empresa (galeria13Empresas) servida em http://localhost:<porta>/ — claro e escuro, 1440 e 390.
// node scripts/playtest/fotos13Empresas.mjs <porta> <pasta>
import { chromium } from 'playwright';
const [porta, pasta] = process.argv.slice(2);
const b = await chromium.launch();
const erros = [];
for (const tema of ['claro', 'escuro']) {
  for (const w of [1440, 390]) {
    for (const empresa of ['industria', 'montadora', 'restaurante']) {
      if (empresa !== 'industria' && w === 390 && tema === 'escuro') continue;
      const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: tema === 'escuro' ? 'dark' : 'light' })).newPage();
      p.on('pageerror', e => erros.push(`${empresa}/${tema}/${w}: ${e.message}`));
      p.on('console', m => { if (m.type() === 'error') erros.push(`${empresa}/${tema}/${w}: ${m.text()}`); });
      await p.goto(`http://localhost:${porta}/?tema=${tema}&empresa=${empresa}`);
      await p.waitForSelector('.e129', { timeout: 60000 });
      const nome = `${empresa}-${tema}-${w}`;
      const larg = await p.evaluate(() => document.documentElement.scrollWidth);
      if (larg > w + 1) erros.push(`${nome}: rolagem horizontal (${larg}px)`);
      await p.screenshot({ path: `${pasta}/${nome}-lancar.png`, fullPage: true });
      if (empresa === 'restaurante') { await p.close(); continue; }
      // Hover numa opção de produto e foco por teclado numa aba.
      const prod = p.locator('.e13-produto').nth(3);
      await prod.hover();
      await p.locator('.e13-escolhido').first().screenshot({ path: `${pasta}/${nome}-ficha.png` }).catch(() => {});
      await prod.click();
      await p.locator('.e13-catalogo').screenshot({ path: `${pasta}/${nome}-catalogo-sel.png` });
      for (const [k, aba] of ['mercado', 'crescer', 'capital'].entries()) {
        await p.locator('.e13-aba').nth(k + 1).click();
        await p.locator('.e13-decidir').screenshot({ path: `${pasta}/${nome}-aba-${aba}.png` });
      }
      await p.locator('.e13-decisoes').screenshot({ path: `${pasta}/${nome}-decisoes.png` });
      await p.locator('.e129-projeto').first().screenshot({ path: `${pasta}/${nome}-linha.png` });
      // Uma decisão de verdade: lançar versão nova? (bloqueada — acabou de sair) → reposicionar para intermediário.
      const radio = p.getByRole('radio', { name: /Intermediário/ }).first();
      if (await radio.count()) { await radio.click(); await p.waitForTimeout(150); await p.locator('.e13-decisoes').screenshot({ path: `${pasta}/${nome}-depois-de-decidir.png` }); }
      await p.close();
    }
  }
}
await b.close();
console.log(erros.length ? erros.join('\n') : 'sem erros');
