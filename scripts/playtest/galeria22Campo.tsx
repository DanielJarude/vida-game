/** VIDA 22 — as propriedades rurais organizadas no terreno (sede, terreiro, produção, reserva), por tipo e porte. CJS; OUT=<html>; TEMA=claro|escuro. */
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'fs';
import { Paisagem18 } from '../../src/ui/v18/campo/Paisagem18';
import type { PropriedadeRural18 } from '../../src/motor/v18/rural/fazenda18';

const base = (id: string, tipo: PropriedadeRural18['tipo'], ha: number, x: Partial<PropriedadeRural18>): PropriedadeRural18 => ({
  id, tipo, nome: id, ha, municipioId: 'campinas-sp', solo: 60, agua: 60, relevo: 'plano', valorHa: 30000, uso: 'producao', manejo: 'convencional', foco: 'equilibrio',
  talhoes: [], rebanhos: [], estruturas: [], maquinas: [], historico: [], ultimoAno: 2025, origem: 'compra', ...x
} as PropriedadeRural18);
const E = (...ids: [string, number?][]) => ids.map(([id, n]) => ({ id, n: n ?? 1, t: 0 })) as PropriedadeRural18['estruturas'];
const R = (especie: string, cabecas: number) => ({ especie, cabecas, genetica: 50, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }) as never;
const T = (id: string, cultura: string, ha: number) => ({ id, cultura, ha, ano: 2020 }) as never;
const M = (...ids: string[]) => ids.map(id => ({ id, t: 0 })) as never;
const CASOS: [string, PropriedadeRural18][] = [
  ['Sítio 12 ha (sede, poço, horta, pomar, galinhas, leite)', base('sitio12', 'sitio', 12, { estruturas: E(['sede'], ['poco']), talhoes: [T('h', 'horta', 1), T('f', 'frutas', 2.5)], rebanhos: [R('galinhas', 120), R('leite', 6)] })],
  ['Sítio 6 ha só com a sede (recém-comprado)', base('sitio6', 'sitio', 6, { estruturas: E(['sede'], ['poco']) })],
  ['Chácara 2 ha (sede, estufa, horta, uva)', base('chac2', 'chacara', 2, { estruturas: E(['sede'], ['estufa', 2]), talhoes: [T('h', 'horta', 0.4), T('u', 'uva', 0.5)], rebanhos: [R('galinhas', 40)] })],
  ['Fazenda agrícola 500 ha (galpão, 2 silos, pivô, estradas; sem sede)', base('agr500', 'agricola', 500, { estruturas: E(['galpao', 2], ['silo', 2], ['pivo'], ['represa'], ['estradas']), talhoes: [T('s', 'soja', 260), T('m', 'milho', 80)], maquinas: M('trator', 'colheitadeira', 'pulverizador', 'caminhao') })],
  ['Fazenda agrícola 1.200 ha com sede e algodão', base('agr1200', 'agricola', 1200, { estruturas: E(['sede'], ['galpao', 3], ['silo', 4], ['solar'], ['estradas']), talhoes: [T('s', 'soja', 500), T('a', 'algodao', 200), T('t', 'trigo', 120)], maquinas: M('trator', 'plantadeira', 'colheitadeira') })],
  ['Fazenda de gado 900 ha (sede, curral, represa, corte)', base('pec900', 'pecuaria', 900, { estruturas: E(['sede'], ['curral', 2], ['represa'], ['poco']), rebanhos: [R('corte', 700)], talhoes: [T('e', 'eucalipto', 40)], maquinas: M('trator', 'caminhao') })],
  ['Fazenda de leite 150 ha (ordenha, curral, silo)', base('lei150', 'pecuaria', 150, { estruturas: E(['sede'], ['ordenha'], ['curral'], ['silo']), rebanhos: [R('leite', 120)], talhoes: [T('m', 'milho', 20)], maquinas: M('trator') })],
  ['Fazenda de café 150 ha (sede, terreiro, viveiro)', base('caf150', 'cafeeira', 150, { relevo: 'montanhoso', estruturas: E(['sede'], ['terreiro'], ['galpao'], ['viveiro']), talhoes: [T('c', 'cafe', 90), T('f', 'frutas', 8)], maquinas: M('trator', 'microtrator') })],
  ['Haras 60 ha (sede, cocheiras, pista)', base('har60', 'haras', 60, { estruturas: E(['sede'], ['cocheiras', 2], ['pista'], ['represa']), rebanhos: [R('cavalos', 30)] })],
  ['Florestal 400 ha (eucalipto e pínus, sem sede)', base('flo400', 'florestal', 400, { estruturas: E(['galpao'], ['viveiro'], ['estradas']), talhoes: [T('e', 'eucalipto', 200), T('p', 'pinus', 100)], maquinas: M('trator', 'caminhao') })],
  ['Florestal 120 ha com chalé', base('flo120', 'florestal', 120, { estruturas: E(['sede']), talhoes: [T('e', 'eucalipto', 70)] })],
  ['Piscicultura 15 ha (tanques, poço, sede)', base('pis15', 'aquicultura', 15, { estruturas: E(['sede'], ['poco'], ['tanques', 6]), rebanhos: [R('tilapia', 60)] })],
  ['Sítio 45 ha granja (pocilga, aviário, milho)', base('sit45', 'sitio', 45, { estruturas: E(['sede'], ['poco'], ['pocilga'], ['aviario'], ['galpao']), talhoes: [T('m', 'milho', 15), T('d', 'mandioca', 4)], rebanhos: [R('porcos', 300), R('frangos', 8000)], maquinas: M('trator') })],
  ['Sítio 25 ha ovelhas e cabras (aprisco)', base('sit25', 'sitio', 25, { estruturas: E(['sede'], ['poco'], ['aprisco']), rebanhos: [R('ovelhas', 80), R('cabras', 40)], talhoes: [T('f', 'frutas', 3)] })],
  ['Fazenda arroz 200 ha (sem nada além da lavoura)', base('arr200', 'agricola', 200, { talhoes: [T('r', 'arroz', 140)] })]
];
const css = readFileSync('src/ui/v18/campo/campo18.css', 'utf8');
const tema = process.env.TEMA ?? 'claro';
const L = CASOS.map(([n, p]) => `<div class=c><b>${n}</b><div class=g>${renderToStaticMarkup(<Paisagem18 p={p} />)}</div><div class=pq>${renderToStaticMarkup(<Paisagem18 p={p} pequena />)}</div></div>`);
writeFileSync(process.env.OUT!, `<!doctype html><html data-tema="${tema}"><meta charset=utf-8><style>:root{--radius-md:8px;--radius-sm:6px;--font-sans:sans-serif;--tinta:#222}${css}body{font:11px sans-serif;background:${tema === 'escuro' ? '#1d1d1f' : '#f4efe6'};color:${tema === 'escuro' ? '#eee' : '#222'};margin:6px;width:1180px}.c{display:inline-block;width:570px;margin:4px;vertical-align:top}.g .paisagem18{aspect-ratio:16/9}.pq{width:200px}</style><div class="campo18">${L.join('')}</div>`);
