// Fotografa páginas HTML locais (as galerias do REWORK 8) inteiras: node foto.mjs a.html b.html … → a.png, b.png, …
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const f of process.argv.slice(2)) {
  const p = await b.newPage({ viewport: { width: Number(process.env.LARGURA ?? 1432), height: 900 } });
  await p.goto('file://' + f);
  await p.waitForTimeout(300);
  await p.screenshot({ path: f.replace(/\.html$/, '.png'), fullPage: true });
  await p.close();
}
await b.close();
