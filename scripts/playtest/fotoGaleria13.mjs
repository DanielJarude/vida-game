// VIDA 13 — fotografa uma galeria HTML estática (node scripts/playtest/fotoGaleria13.mjs <html> <png> [largura] [escuro]).
import { chromium } from 'playwright';
const [,, html, out, w, escuro] = process.argv;
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Number(w ?? 1620), height: 900 }, colorScheme: escuro ? 'dark' : 'light' })).newPage();
await p.goto('file://' + html); await p.screenshot({ path: out, fullPage: true }); await b.close();
