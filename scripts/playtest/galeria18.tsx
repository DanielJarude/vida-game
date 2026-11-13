/** VIDA 18 — as silhuetas peça por peça, os chapéus e as bolsas de costas, em corpos, peles, cabelos e idades diferentes. CJS; OUT=<html>; PARTE=pecas|costas|corpos. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import { Retrato } from '../../src/ui/avatar/Retrato';

type G = 'masculino' | 'feminino';
const P: [string, G, number, string, Record<string, unknown>][] = [
  ['M30 curto', 'masculino', 30, 'mediano', { pele: 'p4', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho' }],
  ['F25 black', 'feminino', 25, 'magro', { pele: 'p6', cabelo: 'black', corCabelo: 'preto', olhos: 'castanho' }],
  ['F40 longo', 'feminino', 40, 'acima_do_peso', { pele: 'p1', cabelo: 'longo', corCabelo: 'loiro', olhos: 'azul' }],
  ['M68 calvo', 'masculino', 68, 'acima_do_peso', { pele: 'p3', cabelo: 'calvo', corCabelo: 'grisalho', olhos: 'castanho' }],
  ['F16 coque', 'feminino', 16, 'atletico', { pele: 'p5', cabelo: 'coque', corCabelo: 'castanho', olhos: 'castanho' }],
  ['M22 trancas', 'masculino', 22, 'musculoso', { pele: 'p6', cabelo: 'trancas', corCabelo: 'preto', olhos: 'castanho' }]
];
const parte = process.env.PARTE ?? 'pecas';
const L: string[] = [];
let nId = 0;
const fig = (k: number, pecas: string[], vista: 'frente' | 'costas' = 'frente', extra: Record<string, unknown> = {}, larg = 120) => {
  const [, g, i, corpo, v] = P[k];
  return renderToStaticMarkup(<Figura visual={{ ...v, ...extra } as never} genero={g} idade={i} corpo={corpo as never} pecas={pecas.map(x => ({ itemId: x, id: x }))} largura={larg} vista={vista} semente={`g${k}`} semFundo />, { identifierPrefix: `f${nId++}-` });
};
const cel = (rot: string, svg: string) => `<div class=p>${svg}<span>${rot}</span></div>`;

if (parte === 'pecas') {
  const CIMA = ['camiseta_lisa', 'camiseta_banda', 'camiseta_grife', 'camisa_time', 'camisa_social', 'camisa_linho', 'camisa_xadrez', 'camisa_seda_grife', 'camisa_polo', 'camiseta_listrada', 'sueter_tricot', 'blusa_seda', 'cropped', 'moletom_oversized', 'moletom_grife', 'bata_wax', 'regata', 'top_esportivo'];
  L.push('<h3>Parte de cima (com jeans)</h3><div class=f>' + CIMA.map(x => cel(x, fig(0, ['jeans', x]))).join('') + '</div>');
  L.push('<h3>Parte de cima — outro corpo</h3><div class=f>' + CIMA.map(x => cel(x, fig(2, ['calca_alfaiataria', x]))).join('') + '</div>');
  const BAIXO = ['jeans', 'calca_alfaiataria', 'calca_cargo', 'bombacha', 'legging', 'bermuda_tactel', 'bermuda_sarja', 'short_jeans', 'short_corrida', 'saia_midi', 'saia_xadrez', 'saia_lapis', 'saia_couro_grife'];
  L.push('<h3>Parte de baixo</h3><div class=f>' + BAIXO.map(x => cel(x, fig(1, ['camiseta_lisa', x]))).join('') + '</div>');
  const INT = ['vestido_floral', 'vestido_chita', 'vestido_festa', 'vestido_longo', 'vestido_grife', 'vestido_alta_costura', 'macacao', 'terno', 'terno_vicunha'];
  L.push('<h3>Peças inteiras</h3><div class=f>' + INT.map(x => cel(x, fig(x.startsWith('terno') ? 0 : 1, [x]))).join('') + INT.slice(0, 6).map(x => cel(x + ' (corpo 3)', fig(2, [x]))).join('') + '</div>');
  const CAS = ['jaqueta_couro', 'jaqueta_couro_grife', 'jaqueta_jeans', 'corta_vento', 'blazer', 'blazer_grife', 'casaco_la', 'sobretudo_grife', 'casaco_cashmere_bordado'];
  L.push('<h3>Casacos (camiseta e jeans por baixo)</h3><div class=f>' + CAS.map(x => cel(x, fig(0, ['jeans', 'camiseta_lisa', x]))).join('') + CAS.map(x => cel(x + ' (corpo 2)', fig(1, ['legging', 'blusa_seda', x]))).join('') + '</div>');
}
if (parte === 'costas') {
  const CH: [string, string][] = [['bone_aba_reta', 'bone'], ['bone_trucker', 'bone'], ['bone_dad', 'bone'], ['bone_grife', 'bone'], ['viseira', 'bone'], ['bucket', 'gorro'], ['fedora', 'chapeu'], ['boina', 'gorro'], ['gorro_pompom', 'gorro'], ['touca_cetim', 'gorro'], ['chapeu_floppy', 'chapeu'], ['chapeu_palha', 'chapeu'], ['chapeu_panama', 'chapeu'], ['chapeu_couro', 'chapeu'], ['turbante', 'lenco'], ['', 'lenco']];
  for (const k of [0, 1, 2, 4]) {
    L.push(`<h3>Chapéus de frente e de costas — ${P[k][0]}</h3><div class=f>`);
    for (const [m, t] of CH) L.push(cel(`${m || t}`, fig(k, ['jeans', 'camiseta_lisa'], 'frente', { chapeu: t, ...(m ? { modeloChapeu: m } : {}) }, 90) + fig(k, ['jeans', 'camiseta_lisa'], 'costas', { chapeu: t, ...(m ? { modeloChapeu: m } : {}) }, 90)));
    L.push('</div>');
  }
  L.push('<h3>Bolsas de frente e de costas</h3><div class=f>');
  for (const k of [0, 1, 2, 5]) for (const b of ['bolsa_transversal', 'bolsa_tote', 'mochila', 'pochete', 'clutch', 'bolsa_grife']) L.push(cel(`${b} · ${P[k][0]}`, fig(k, ['jeans', 'moletom_oversized', b], 'frente', {}, 90) + fig(k, ['jeans', 'moletom_oversized', b], 'costas', {}, 90)));
  L.push('</div><h3>Miniatura do retrato (o mesmo chapéu)</h3><div class=f>');
  for (const [m, t] of CH.slice(0, 8)) L.push(cel(m, renderToStaticMarkup(<Retrato visual={{ ...(P[0][4] as never), chapeu: t as never, modeloChapeu: m }} genero="masculino" idade={30} semente="g0" tamanho={70} />)));
  L.push('</div>');
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#efe9de;margin:6px}.f{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:6px}.p{display:flex;flex-direction:column;align-items:center;gap:2px}.p svg{background:#fbf7f0;border-radius:4px}h3{margin:6px 0 2px}</style>${L.join('')}`);
