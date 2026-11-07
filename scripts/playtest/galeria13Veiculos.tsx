/**
 * VIDA 13 — a galeria de TODO o catálogo de carros e motos (cada modelo a 200 px, numa cor de catálogo, com o nome),
 * mais a página da personalização (pinturas, acabamentos, rodas, peças) e a das miniaturas (72 px, a vitrine).
 * OUT=<pasta> node <bundle>.cjs → <pasta>/carros-*.html, motos.html, personalizacao.html; fotografe com fotografarHtml.mjs.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { DesenhoVeiculo } from '../../src/ui/jogo/material/Desenhos';
import { VERSOES_VEICULO, formaDaVersao, modeloVeiculo, nomeDaVersao, type VersaoVeiculo } from '../../src/motor/dados/bens';

const OUT = process.env.OUT!;
const CORES = ['#b8352b', '#2c4f8a', '#d8d4cc', '#1c1c1e', '#2f6b45', '#c9a227', '#a8adb3', '#6b2d4a'];
const pagina = (titulo: string, corpo: string, escuro = false) => `<html><head><meta charset="utf-8"><title>${titulo}</title></head><body style="background:${escuro ? '#171513' : '#f4f0e8'};margin:0;padding:10px;font:11px system-ui,sans-serif;color:${escuro ? '#bbb' : '#333'}"><div style="display:grid;grid-template-columns:repeat(4,210px);gap:6px">${corpo}</div></body></html>`;
const celula = (x: VersaoVeiculo, k: number, escuro: boolean) => `<div style="background:${escuro ? '#211e1b' : '#fffdf8'};border-radius:6px;padding:4px"><div>${renderToStaticMarkup(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} semente={x.id} cor={CORES[k % CORES.length]} largura={200} estado={95} />)}</div><div>${nomeDaVersao(x)}${x.ano ? ` ${x.ano}` : ''} · ${formaDaVersao(x)}</div></div>`;
const de = (cat: string) => VERSOES_VEICULO.filter(x => modeloVeiculo(x.classe).categoria === cat).sort((a, b) => formaDaVersao(a).localeCompare(formaDaVersao(b)));
const escuro = process.env.ESCURO === '1';
const carros = de('carro');
for (let p = 0; p * 40 < carros.length; p++) writeFileSync(`${OUT}/carros-${p + 1}.html`, pagina('carros', carros.slice(p * 40, p * 40 + 40).map((x, k) => celula(x, k + p, escuro)).join(''), escuro));
const motos = de('moto');
for (let p = 0; p * 40 < motos.length; p++) writeFileSync(`${OUT}/motos-${p + 1}.html`, pagina('motos', motos.slice(p * 40, p * 40 + 40).map((x, k) => celula(x, k + p, escuro)).join(''), escuro));
// O zoom (ZOOM=id1,id2…): cada um a 430 px, para ver os detalhes.
if (process.env.ZOOM) {
  const ids = process.env.ZOOM.split(',');
  const z = ids.map((id, k) => { const x = VERSOES_VEICULO.find(y => y.id === id)!; return `<div style="background:${escuro ? '#211e1b' : '#fffdf8'};border-radius:6px;padding:4px;grid-column:span 2">${renderToStaticMarkup(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} semente={x.id} cor={CORES[k % CORES.length]} largura={430} estado={95} />)}<div>${nomeDaVersao(x)}</div></div>`; }).join('');
  writeFileSync(`${OUT}/zoom.html`, pagina('zoom', z, escuro));
}
// A personalização (PERS=1): o mesmo carro e a mesma moto com cada peça visível; e as miniaturas da vitrine (72 px).
if (process.env.PERS) {
  const casos: [string, string, Record<string, string>, string][] = [
    ['vw_golf_gti', '#2c4f8a', {}, 'de fábrica'], ['vw_golf_gti', '#b8302a', { pintura: 'vermelho' }, 'pintura vermelha'], ['vw_golf_gti', '#2a2a2c', { pintura: 'preto_fosco' }, 'preto fosco'],
    ['vw_golf_gti', '#2c4f8a', { acabamento: 'metalico' }, 'metálico'], ['vw_golf_gti', '#2c4f8a', { acabamento: 'perolizado' }, 'perolizado'], ['vw_golf_gti', '#2c4f8a', { rodas: 'douradas' }, 'rodas douradas'],
    ['vw_golf_gti', '#2c4f8a', { rodas: 'raiadas' }, 'rodas raiadas'], ['vw_golf_gti', '#2c4f8a', { rodas: 'pretas', suspensao: 'rebaixada' }, 'pretas + rebaixada'], ['vw_golf_gti', '#2c4f8a', { teto: 'branco', faixas: 'dupla' }, 'teto branco + faixas'],
    ['vw_golf_gti', '#2c4f8a', { aerofolio: 'aerofolio', motor: 'remap', acessorios: 'pelicula' }, 'aerofólio + escape + película'], ['toyota_hilux', '#ecebe6', {}, 'Hilux de fábrica'], ['toyota_hilux', '#ecebe6', { rodas: 'off_road', suspensao: 'reforcada' }, 'Hilux off-road + reforçada'],
    ['porsche_911', '#d8d4cc', {}, '911 de fábrica'], ['porsche_911', '#d8d4cc', { rodas: 'douradas', faixas: 'lateral', acabamento: 'acetinado' }, '911 dourado, faixa, acetinado'],
    ['honda_cg160', '#b8352b', {}, 'CG de fábrica'], ['honda_cg160', '#b8352b', { bagageiro: 'bau', escape: 'esportivo' }, 'CG baú + escape'], ['yamaha_mt09', '#2c4f8a', {}, 'MT-09 de fábrica'], ['yamaha_mt09', '#2c4f8a', { rodas: 'liga_dourada', acabamento: 'fosco', escape: 'esportivo' }, 'MT-09 dourada, fosca, escape'],
    ['triumph_t120_1969', '#2c4f8a', { bagageiro: 'alforjes' }, 'T120 com alforjes'], ['harley_fat_boy', '#1c1c1e', { acabamento: 'metalico' }, 'Fat Boy metálica']
  ];
  const cel = ([id, cor, mods, nome]: [string, string, Record<string, string>, string]) => { const x = VERSOES_VEICULO.find(y => y.id === id)!; return `<div style="background:${escuro ? '#211e1b' : '#fffdf8'};border-radius:6px;padding:4px">${renderToStaticMarkup(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} semente={x.id} cor={cor} mods={mods} largura={200} />)}<div>${nome}</div></div>`; };
  writeFileSync(`${OUT}/personalizacao.html`, pagina('personalizacao', casos.map(cel).join(''), escuro));
  const mini = [...carros.slice(0, 40), ...motos.slice(0, 24)].map((x, k) => `<div style="background:${escuro ? '#211e1b' : '#fffdf8'};padding:2px">${renderToStaticMarkup(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} cor={CORES[k % CORES.length]} largura={72} />)}</div>`).join('');
  writeFileSync(`${OUT}/miniaturas.html`, `<html><body style="background:${escuro ? '#171513' : '#f4f0e8'};margin:0;padding:10px"><div style="display:grid;grid-template-columns:repeat(10,80px);gap:4px">${mini}</div></body></html>`);
}
