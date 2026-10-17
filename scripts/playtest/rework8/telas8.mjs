// REWORK 8 (Fase A) — as três direções APLICADAS nas telas reais do jogo (o build, os tokens, as quatro paletas): a
// página de Compras e a folha da concessionária, com os desenhos de hoje ("atual") e trocados pelos de cada direção
// (os mesmos lugares da tela, a cor de verdade de cada anúncio). Nível 2 (identificação) nas vitrines e anúncios.
//   npm run build && npx vite preview --port 4173 &
//   npx esbuild scripts/playtest/rework8/api.tsx --bundle --platform=node --jsx=automatic --outfile=<s>/api.cjs
//   API=<s>/api.cjs SP=<pasta com saves/> node scripts/playtest/rework8/telas8.mjs
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { desenhar } = createRequire(import.meta.url)(process.env.API);
const SP = process.env.SP ?? '/tmp/vida-r75';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = `${SP}/telas8`;
mkdirSync(OUT, { recursive: true });
const SAVE = readFileSync(`${SP}/saves/vida-r6-rica.json`, 'utf8');
const FORMA = { 'compacto': 'compacto', 'hatch': 'hatch', 'sedã': 'seda', 'SUV': 'suv', 'SUV médio': 'suv_medio', 'SUV de sete lugares': 'suv_grande', 'picape': 'picape', 'esportivo': 'esportivo' };
const qualDe = rotulo => { const f = (rotulo ?? '').split(',')[0].trim(); return FORMA[f] ?? (/moto|scooter|motoneta/.test(f) ? 'moto' : /bicicleta|bike/.test(f) ? 'bicicleta' : 'hatch'); };
const corDe = el => (el.getAttribute('style') ?? '').match(/--cor-veiculo:\s*(#[0-9a-f]{6})/i)?.[1];

const b = await chromium.launch();
for (const paleta of (process.env.PALETAS ?? 'claro,horizonte,escuro,atlantico').split(',')) for (const w of (process.env.LARGURAS ?? '1440,390').split(',').map(Number)) for (const dir of ['atual', 'A', 'B', 'C']) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [SAVE, paleta]);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(400);
  let bt = p.getByRole('button', { name: 'Vida', exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: 'Vida' }).first();
  await bt.click(); await p.waitForTimeout(250);
  await p.getByRole('tab', { name: 'Compras', exact: true }).first().click(); await p.waitForTimeout(350);
  if (dir !== 'atual') {
    // As vitrines: cada lugar com a sua identidade (a concessionária é a fachada com os carros; os usados, os carros do
    // anúncio na cor do anúncio; o abrigo, os bichos; a loja de instrumentos, o violão; a imobiliária, a casa).
    const vitrines = await p.$$eval('.vitrine', vs => vs.map(v => ({ nome: v.querySelector('.vitrine__nome')?.textContent, cores: [...v.querySelectorAll('.vitrine__objetos svg')].map(s => (s.getAttribute('style') ?? '').match(/--cor-veiculo:\s*(#[0-9a-f]{6})/i)?.[1] ?? null), rotulos: [...v.querySelectorAll('.vitrine__objetos svg')].map(s => s.getAttribute('aria-label')) })));
    const trocas = vitrines.map(v => {
      const n = v.nome ?? '';
      if (/^Concessionária/.test(n)) return desenhar(dir, 'concessionaria', v.cores[0] ?? '#b8352b', 150);
      if (/^Carros usados/.test(n)) return v.rotulos.slice(0, 3).map((r, k) => desenhar(dir, qualDe(r), v.cores[k] ?? '#6b7b8a', 70)).join('');
      if (/^Motos e bicicletas/.test(n)) return desenhar(dir, 'moto', v.cores[0] ?? '#1f4e7a', 74) + desenhar(dir, 'bicicleta', v.cores[2] ?? '#3d6b8f', 74);
      if (/instrumentos/.test(n)) return desenhar(dir, 'violao', '#d9a75e', 40);
      if (/^Abrigo/.test(n)) return desenhar(dir, 'cachorro', '#b07a45', 76) + desenhar(dir, 'gato', '#3a3633', 76);
      if (/^Imobiliária/.test(n)) return desenhar(dir, 'casa', '#e7c79a', 110);
      return null;
    });
    await p.$$eval('.vitrine', (vs, tr) => vs.forEach((v, k) => { if (tr[k]) v.querySelector('.vitrine__objetos').innerHTML = tr[k]; }), trocas);
    // A vitrine de hoje reserva 34% para cada um de três objetos; uma fachada sozinha (ou um par) ganha o espaço dela —
    // o que a Fase B faria no CSS da vitrine.
    await p.addStyleTag({ content: '.vitrine__objetos > .proposta:only-child{max-width:92%;height:auto}.vitrine__objetos > .proposta:first-child:nth-last-child(2),.vitrine__objetos > .proposta:last-child:nth-child(2){max-width:47%;height:auto}' });
  }
  await p.screenshot({ path: `${OUT}/compras-${paleta}-${w}-${dir}.png` });
  // A folha da concessionária: cada anúncio com o carro dele (a forma da família, a cor do anúncio).
  const conc = p.locator('.vitrine', { hasText: 'Concessionária' }).locator('.vitrine__abrir').first();
  if (await conc.count()) {
    await conc.click(); await p.waitForTimeout(400);
    if (dir !== 'atual') {
      const anuncios = await p.$$eval('.oferta__veiculo', os => os.map(o => ({ cor: (o.getAttribute('style') ?? '').match(/--cor-veiculo:\s*(#[0-9a-f]{6})/i)?.[1] ?? '#888888', rotulo: o.querySelector('svg')?.getAttribute('aria-label') })));
      const novos = anuncios.map(a => desenhar(dir, qualDe(a.rotulo), a.cor, 84));
      await p.$$eval('.oferta__veiculo', (os, nv) => os.forEach((o, k) => { o.innerHTML = nv[k]; }), novos);
    }
    await p.screenshot({ path: `${OUT}/concessionaria-${paleta}-${w}-${dir}.png` });
  }
  await p.close();
}
await b.close();
console.log('ok', OUT);
