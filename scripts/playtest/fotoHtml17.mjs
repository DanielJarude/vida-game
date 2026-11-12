// Foto de uma página HTML local (galerias): node fotoHtml17.mjs <html> <png> [largura]
import { chromium } from 'playwright';
const [html, png, w] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Number(w ?? 1100), height: 800 } });
await p.goto('file://' + html); await p.screenshot({ path: png, fullPage: true }); await b.close();
