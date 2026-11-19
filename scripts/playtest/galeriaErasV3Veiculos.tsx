// ERAS v3 — galeria dos veículos da época no mundo (`eras/base/veiculosMundo`): um cartão por versão, com o desenho, o
// nome, o mercado e os anos. Uso: npx esbuild ... --bundle --platform=node --jsx=automatic && node X.mjs <saida.html>
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { IlustracaoVeiculo } from '../../src/ui/ilustracao/veiculos';
import { VERSOES_DA_EPOCA_MUNDO } from '../../src/motor/eras/base/veiculosMundo';
import { formaDaVersao } from '../../src/motor/dados/bens';
const cards = VERSOES_DA_EPOCA_MUNDO.map(x => (
  <figure key={x.id} style={{ margin: 0, padding: 8, border: '1px solid #ccc', borderRadius: 8, background: '#fbf8f2' }}>
    <IlustracaoVeiculo forma={formaDaVersao(x)} versaoId={x.id} cor="#8a3b2e" largura={220} rotulo={x.modelo} />
    <figcaption style={{ font: '12px sans-serif' }}><b>{x.marca} {x.modelo}</b><br />{(x.mercados ?? []).join(' ')} · {x.epoca[0]}–{x.epoca[1]}</figcaption>
  </figure>
));
writeFileSync(process.argv[2], `<!doctype html><meta charset="utf-8"><body style="margin:12px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px">${renderToStaticMarkup(<>{cards}</>)}</body>`);
