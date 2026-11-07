// VIDA 13 — recorte ampliado de uma página: node zoom13Moveis.mjs <html> <png> x y w h
import { chromium } from 'playwright';
const [html, out, x, y, w, h] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2300, height: 1400 } });
await p.goto('file://' + html); await p.screenshot({ path: out, clip: { x: +x, y: +y, width: +w, height: +h } }); await b.close();
