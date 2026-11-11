import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [out, ...fs] = process.argv.slice(2);
const imgs = fs.map(f => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${f.split('/').pop()}</figcaption></figure>`).join('');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(`<style>body{margin:0;display:flex;gap:6px;flex-wrap:wrap;background:#888}figure{margin:0;width:390px}img{width:100%}figcaption{font:11px sans-serif;color:#fff}</style>${imgs}`);
await p.screenshot({ path: out, fullPage: true }); await b.close();
