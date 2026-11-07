/**
 * VIDA 13 — galeria da identidade visual: os cortes (texturas, gêneros, idades), as barbas, as mechas, a maquiagem, os
 * brincos novos, os piercings por zona (a lupa da seção) e a figura de costas. OUT=<pasta> (escreve 1 HTML por parte).
 *   npx esbuild scripts/playtest/galeria13Aparencia.tsx --bundle --platform=node --outfile=<x>.cjs --jsx=automatic --loader:.tsx=tsx
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import type { ReactElement } from 'react';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { Figura, focoDaPeca } from '../../src/ui/avatar/Figura';
import { focoDoRosto } from '../../src/ui/avatar/identidade13';
import { OrelhaDePerto } from '../../src/ui/avatar/piercings';
import { CORTES_13, BARBAS_13, DELINEADOS_13, CORES_DE_BATOM_13, CORES_DE_SOMBRA_13, MECHAS_13 } from '../../src/motor/dados/aparencia13';
import { PIERCINGS_13, BRINCOS_13 } from '../../src/motor/dados/piercings13';
import { CORTES, BARBAS } from '../../src/motor/dados/estilo';
import type { Visual, Genero } from '../../src/motor/tipos';

const OUT = process.env.OUT!;
const base: Visual = { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', rosto: 'oval', calvicie: 'nao' } as Visual;
// Cada renderToStaticMarkup recomeça o useId: os ids (máscaras, gradientes) ganham o número da célula, senão colidem.
let nCel = 0;
const unico = (h: string) => { const k = ++nCel; return h.replace(/(id="|url\(#|href="#)([^"\)]+)/g, (_m, a, b) => `${a}c${k}-${b}`); };
const cel = (el: ReactElement, rot: string) => `<div class=c>${unico(renderToStaticMarkup(el))}<span>${rot}</span></div>`;
const pagina = (nome: string, html: string[], larg = 1400) => writeFileSync(`${OUT}/${nome}.html`, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;margin:8px;width:${larg}px}.l{display:flex;flex-wrap:wrap;gap:6px}.c{background:#fff;padding:3px;display:grid;justify-items:center;max-width:230px;overflow:hidden}h3{margin:10px 0 4px}</style>${html.join('')}`);
const R = (v: Partial<Visual>, g: Genero, i: number, t = 110) => <Retrato visual={{ ...base, ...v } as Visual} genero={g} idade={i} semente="g" tamanho={t} rotulo="r" />;

// 1. Cortes novos × textura × gênero; e a criança / o idoso
{
  const h: string[] = [];
  for (const [tex, pele, cor] of [['liso', 'p2', 'castanho'], ['ondulado', 'p3', 'loiro'], ['cacheado', 'p4', 'preto'], ['crespo', 'p6', 'preto']] as const) {
    h.push(`<h3>${tex}</h3><div class=l>`);
    for (const c of CORTES_13) h.push(cel(R({ cabelo: c.id, textura: tex, pele, corCabelo: cor }, c.id.length % 2 ? 'feminino' : 'masculino', 28), `${c.id}`));
    h.push('</div>');
  }
  h.push('<h3>idades (10, 16, 70)</h3><div class=l>');
  for (const c of CORTES_13) for (const i of [10, 16, 70]) h.push(cel(R({ cabelo: c.id, textura: 'liso' }, 'feminino', i, 80), `${c.id} ${i}`));
  h.push('</div>');
  pagina('cortes', h);
}
// 2. Barbas (todas) × textura, com e sem bigode
{
  const h: string[] = ['<div class=l>'];
  for (const b of BARBAS) for (const [tex, cor] of [['liso', 'castanho'], ['crespo', 'preto'], ['ondulado', 'loiro']] as const) h.push(cel(R({ barba: b.id === 'nenhuma' ? undefined : b.id, textura: tex, corCabelo: cor, pele: tex === 'crespo' ? 'p5' : 'p2' }, 'masculino', 34), `${b.id} ${tex}`));
  h.push('</div><h3>sem bigode (as que deixam)</h3><div class=l>');
  for (const b of ['desenhada', 'lenhador', 'queixo', 'mosca']) h.push(cel(R({ barba: b, bigode: false }, 'masculino', 34), `${b} s/ bigode`));
  h.push('</div><h3>com o grisalho (70)</h3><div class=l>');
  for (const b of BARBAS_13) h.push(cel(R({ barba: b.id, corCabelo: 'castanho' }, 'masculino', 70), `${b.id} 70`));
  h.push('</div>');
  pagina('barbas', h);
}
// 3. Mechas e cores novas
{
  const h: string[] = ['<div class=l>'];
  for (const m of MECHAS_13) for (const [c, cab, cor] of [['loiro', 'longo_liso', 'castanho_escuro'], ['rosa', 'chanel', 'preto'], ['azul', 'curto', 'castanho'], ['platinado', 'cacheado_longo', 'preto'], ['mel', 'shag', 'castanho'], ['verde', 'undercut', 'preto']] as const)
    h.push(cel(R({ cabelo: cab, corCabelo: cor, mechas: c, mechasEstilo: m.id, textura: cab === 'cacheado_longo' ? 'cacheado' : 'liso' }, 'feminino', 25), `${m.id} ${c} ${cab}`));
  h.push('</div><h3>tintas novas</h3><div class=l>');
  for (const c of ['verde', 'roxo', 'cobre', 'mel', 'prata']) h.push(cel(R({ cabelo: 'longo_ondulado', corCabelo: c }, 'feminino', 25), c));
  h.push('</div>');
  pagina('mechas', h);
}
// 4. Maquiagem
{
  const h: string[] = ['<div class=l>'];
  const combos: Partial<Visual>[] = [
    { delineado: 'fino' }, { delineado: 'gatinho' }, { delineado: 'carregado' }, { sombraOlhos: 'esfumado', delineado: 'carregado' }, { sombraOlhos: 'dourado', batom: 'nude' },
    { sombraOlhos: 'azul', batom: 'rosa', blush: 'rosado' }, { batom: 'vermelho', delineado: 'gatinho' }, { batom: 'vinho', sombraOlhos: 'roxo' }, { batom: 'preto', delineado: 'carregado', sombraOlhos: 'esfumado' }, { blush: 'terracota', batom: 'coral' }
  ];
  for (const x of combos) for (const [g, pele] of [['feminino', 'p2'], ['masculino', 'p5'], ['nao_binario', 'p3']] as const) h.push(cel(R({ ...x, pele, cabelo: g === 'feminino' ? 'longo_liso' : 'curto' }, g, 27), JSON.stringify(x).replace(/["{}]/g, '')));
  h.push('</div><h3>expressão (bem / abatido) e idosa</h3><div class=l>');
  for (const ex of ['bem', 'abatido', 'tenso'] as const) h.push(`<div class=c>${unico(renderToStaticMarkup(<Retrato visual={{ ...base, batom: 'vermelho', delineado: 'gatinho' } as Visual} genero="feminino" idade={30} semente="g" tamanho={110} expressao={ex} />))}<span>${ex}</span></div>`);
  h.push(cel(R({ batom: 'rosa', sombraOlhos: 'nude', corCabelo: 'grisalho' }, 'feminino', 72), 'idosa'));
  h.push('</div>');
  void DELINEADOS_13; void CORES_DE_BATOM_13; void CORES_DE_SOMBRA_13;
  pagina('maquiagem', h);
}
// 5. Piercings por zona (a lupa) e brincos
{
  const h: string[] = [];
  const zona = (ids: string[], z: 'orelha' | 'nariz' | 'boca' | 'sobrancelha' | 'rosto', extra: Partial<Visual> = {}, g: Genero = 'feminino', i = 25) =>
    renderToStaticMarkup(<Figura visual={{ ...base, cabelo: 'pixie', ...extra, piercings: ids.slice().sort() } as Visual} genero={g} idade={i} semente="g" corpo="mediano" pecas={[]} largura={210} foco={focoDoRosto(z, i)} />);
  const conj: [string, string[], 'orelha' | 'nariz' | 'boca' | 'sobrancelha', Partial<Visual>?][] = [
    ['orelha: 7 furos', ['pc_helix_argola', 'pc_industrial_barra_aco', 'pc_tragus_ponto', 'pc_concha_ponto_titanio', 'pc_daith_argola_aco', 'pc_lobulo2_ponto_aco'], 'orelha', { brincos: true, modeloBrincos: 'brincos_perola' }],
    ['orelha luxo', ['pc_helix_clicker_ouro', 'pc_tragus_cluster_rose', 'pc_concha_cluster_ouro', 'pc_daith_clicker_branco', 'pc_lobulo2_diamante'], 'orelha', { brincos: true, modeloBrincos: 'brincos_gota' }],
    ['orelha alternativa', ['pc_helix_spike', 'pc_industrial_preta', 'pc_tragus_lua', 'pc_concha_argola_prata', 'pc_daith_coracao_ouro', 'pc_lobulo2_spike'], 'orelha', { brincos: true, modeloBrincos: 'brincos_alargador' }],
    ['orelha arco-íris', ['pc_industrial_arco', 'pc_helix_cluster', 'pc_lobulo2_estrela', 'pc_tragus_argola_prata'], 'orelha', { brincos: true, modeloBrincos: 'brincos_cruz' }],
    ['nariz: par + septo + ponte', ['pc_nariz_ponto_aco', 'pc_nariz2_ponto_aco', 'pc_septo_ferradura', 'pc_ponte_barra_aco'], 'nariz'],
    ['nariz luxo', ['pc_nariz_clicker_branco', 'pc_nariz2_rose', 'pc_septo_clicker_branco'], 'nariz'],
    ['nariz alt', ['pc_nariz_argola_preta', 'pc_nariz2_argola_prata', 'pc_septo_spike', 'pc_ponte_preta'], 'nariz'],
    ['nariz cores', ['pc_nariz_titanio_azul', 'pc_nariz_cluster_ouro', 'pc_septo_arco'].slice(1), 'nariz'],
    ['boca: snake bites + medusa', ['pc_labio_argola', 'pc_labio2_argola_aco', 'pc_medusa_titanio'], 'boca'],
    ['boca: labret spike + canto + medusa ouro', ['pc_labio_spike', 'pc_labio2_ponto_titanio', 'pc_medusa_ouro'], 'boca'],
    ['boca luxo', ['pc_labio_argola_ouro', 'pc_medusa_zirconia', 'pc_labio2_argola_preta'], 'boca'],
    ['sobrancelha spike', ['pc_sobrancelha_spike'], 'sobrancelha'], ['sobrancelha ouro', ['pc_sobrancelha_ouro'], 'sobrancelha'], ['sobrancelha azul', ['pc_sobrancelha_azul'], 'sobrancelha']
  ];
  h.push('<div class=l>');
  for (const [n, ids, z, x] of conj) h.push(`<div class=c>${unico(zona(ids, z, x))}<span>${n}</span></div>`);
  h.push('</div><h3>a orelha de perto (a lupa da orelha)</h3><div class=l>');
  for (const [n, ids, br, cab] of [
    ['7 furos', ['pc_helix_argola', 'pc_industrial_barra_aco', 'pc_tragus_ponto', 'pc_concha_ponto_titanio', 'pc_daith_argola_aco', 'pc_lobulo2_ponto_aco'], 'brincos_perola', undefined],
    ['luxo', ['pc_helix_clicker_ouro', 'pc_tragus_cluster_rose', 'pc_concha_cluster_ouro', 'pc_daith_clicker_branco', 'pc_lobulo2_diamante'], 'brincos_gota', undefined],
    ['alternativa', ['pc_helix_spike', 'pc_industrial_preta', 'pc_tragus_lua', 'pc_concha_argola_prata', 'pc_daith_coracao_ouro', 'pc_lobulo2_spike'], 'brincos_alargador', undefined],
    ['arco-íris + trio', ['pc_industrial_arco', 'pc_helix_trio', 'pc_lobulo2_estrela', 'pc_tragus_argola_prata'], 'brincos_cruz', undefined],
    ['cabelo cobre', ['pc_helix_argola', 'pc_tragus_ponto'], 'brincos', '#3a2a20']
  ] as [string, string[], string, string | undefined][]) for (const [pele, sombra] of [['#d49f75', '#bd8559'], ['#5f3c27', '#4b2e1d']]) h.push(`<div class=c>${renderToStaticMarkup(<OrelhaDePerto ids={ids} brinco={br} pele={pele} sombra={sombra} cabelo={cab} largura={200} />)}<span>${n}</span></div>`);
  h.push('</div><h3>conflitos: cabelo longo cobre a orelha · bigode cobre o medusa · gorro</h3><div class=l>');
  h.push(`<div class=c>${unico(zona(['pc_helix_argola', 'pc_concha_argola_prata'], 'orelha', { cabelo: 'longo_liso' }))}<span>longo</span></div>`);
  h.push(`<div class=c>${unico(zona(['pc_helix_argola', 'pc_concha_argola_prata'], 'orelha', { cabelo: 'rabo' }))}<span>preso (rabo)</span></div>`);
  h.push(`<div class=c>${unico(zona(['pc_medusa_titanio', 'pc_labio_argola'], 'boca', { barba: 'curta' }, 'masculino', 30))}<span>bigode</span></div>`);
  h.push(`<div class=c>${unico(zona(['pc_helix_argola', 'pc_tragus_ponto'], 'orelha', { chapeu: 'gorro' }))}<span>gorro</span></div>`);
  h.push(`<div class=c>${unico(zona(['pc_sobrancelha_barra'], 'sobrancelha', { oculos: 'grau' }))}<span>óculos</span></div>`);
  h.push(`<div class=c>${unico(zona(['pc_nariz_argola_prata', 'pc_helix_trio'], 'rosto' as 'nariz', {}, 'masculino', 60))}<span>60 anos</span></div>`);
  h.push('</div><h3>brincos novos (rosto)</h3><div class=l>');
  for (const b of BRINCOS_13) h.push(cel(R({ brincos: true, modeloBrincos: b.id, cabelo: 'coque' }, 'feminino', 25, 120), b.id));
  h.push('</div><h3>umbigo</h3><div class=l>');
  for (const id of PIERCINGS_13.filter(p => p.lugar === 'umbigo').map(p => p.id)) h.push(`<div class=c>${renderToStaticMarkup(<Figura visual={{ ...base, piercings: [id] }} genero="feminino" idade={25} semente="g" corpo="mediano" pecas={[]} semCima largura={200} semFundo foco={focoDaPeca('feminino', 'mediano', 25, 'umbigo')} />)}<span>${id}</span></div>`);
  h.push('</div><h3>retrato pequeno (64 px) com muitos furos</h3><div class=l>');
  h.push(cel(<Retrato visual={{ ...base, cabelo: 'undercut', piercings: ['pc_helix_argola', 'pc_industrial_barra_aco', 'pc_nariz_argola_prata', 'pc_septo_clicker_ouro', 'pc_labio_argola', 'pc_labio2_argola_aco', 'pc_sobrancelha_barra'].sort() } as Visual} genero="masculino" idade={24} semente="g" tamanho={64} />, '64px'));
  h.push(cel(<Retrato visual={{ ...base, cabelo: 'undercut', piercings: ['pc_helix_argola', 'pc_industrial_barra_aco', 'pc_nariz_argola_prata', 'pc_septo_clicker_ouro', 'pc_labio_argola', 'pc_labio2_argola_aco', 'pc_sobrancelha_barra'].sort() } as Visual} genero="masculino" idade={24} semente="g" tamanho={160} />, '160px'));
  h.push('</div>');
  pagina('piercings', h);
}
// 6. De costas
{
  const h: string[] = ['<div class=l>'];
  for (const c of [...CORTES.map(x => x.id)]) h.push(`<div class=c>${renderToStaticMarkup(<Figura visual={{ ...base, cabelo: c, corCabelo: 'castanho_escuro', mechas: c === 'longo_liso' ? 'loiro' : undefined }} genero="feminino" idade={25} semente="g" corpo="mediano" pecas={[]} vista="costas" largura={90} semFundo />)}<span>${c}</span></div>`);
  h.push('</div>');
  pagina('costas', h);
}
