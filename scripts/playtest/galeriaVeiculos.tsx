/** FIX pós-playtest humano — a galeria dos veículos: cada forma em cores reais (a vitrine a 72 px, o detalhe a 200 px). */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { DesenhoVeiculo } from '../../src/ui/jogo/material/Desenhos';
import { NOME_FORMA, type FormaVeiculo } from '../../src/motor/dados/bens';

const cores = ['#2f7a3a', '#2c4f8a', '#7a1f2b', '#d8d4cc', '#161616', '#c9a227', '#a8adb3'];
const formas = Object.keys(NOME_FORMA) as FormaVeiculo[];
let html = '<html><body style="background:#121010;margin:0;padding:12px;font:12px sans-serif;color:#bbb"><table>';
for (const f of formas) {
  html += `<tr><td>${NOME_FORMA[f]}</td>${cores.map((c, k) => `<td style="background:#1d1a18;padding:4px">${renderToStaticMarkup(<DesenhoVeiculo forma={f} cor={c} largura={72} semente={'v' + k} estado={k === 5 ? 35 : 95} />)}</td>`).join('')}<td style="background:#1d1a18">${renderToStaticMarkup(<DesenhoVeiculo forma={f} cor={cores[0]} largura={200} semente="d" />)}</td></tr>`;
}
html += '</table></body></html>';
writeFileSync(process.env.OUT!, html);
