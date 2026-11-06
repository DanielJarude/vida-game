/** VIDA 12.9 — o estúdio de tatuagem renderizado estático (para a foto em 390 px). OUT=<a.html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';
import { EstudioDeTatuagem } from '../../src/ui/jogo/Tatuagens';
await carregarMundo();
const v = transacao(adulto(30, { semente: 1291, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
const dir = '/home/iego_ossi/vida-trabalho/r129/src/ui/';
const css = readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'fontes.css').map(f => readFileSync(dir + f, 'utf8')).join('\n');
const html = renderToStaticMarkup(<EstudioDeTatuagem vida={v} agir={() => true} />);
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><style>${css}</style><body style="margin:0;padding:8px;background:var(--papel,#fff)">${html}</body>`);
