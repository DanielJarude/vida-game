/** VIDA 17 — bonés e chapéus em cabelos e rostos diferentes; óculos novos; bolsas na figura; tatuagens do rosto. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { Figura } from '../../src/ui/avatar/Figura';
import { TatuagensDoRosto } from '../../src/ui/avatar/tatuagensNaPele';

const CHAPEUS: [string, string][] = [['bone_trucker', 'bone'], ['bone_dad', 'bone'], ['bone_grife', 'bone'], ['viseira', 'bone'], ['bucket', 'gorro'], ['fedora', 'chapeu'], ['boina', 'gorro'], ['gorro_pompom', 'gorro'], ['touca_cetim', 'lenco'], ['chapeu_floppy', 'chapeu'], ['bone_aba_reta', 'bone'], ['chapeu_palha', 'chapeu']];
const PESSOAS: [string, any, number, any][] = [['curto M30', 'masculino', 30, { pele: 'p4', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho' }], ['black F25', 'feminino', 25, { pele: 'p6', cabelo: 'black', corCabelo: 'preto', olhos: 'castanho' }], ['longo F40', 'feminino', 40, { pele: 'p2', cabelo: 'longo_liso', corCabelo: 'loiro', olhos: 'azul' }], ['coque F60', 'feminino', 60, { pele: 'p3', cabelo: 'coque', corCabelo: 'grisalho', olhos: 'castanho' }], ['locs M22', 'masculino', 22, { pele: 'p5', cabelo: 'locs', corCabelo: 'preto', olhos: 'castanho' }], ['moicano M18', 'masculino', 18, { pele: 'p2', cabelo: 'moicano', corCabelo: 'ruivo', olhos: 'verde' }]];
const L: string[] = ['<h3>Chapéus</h3>'];
for (const [modelo, tipo] of CHAPEUS) L.push(`<div class=f><b>${modelo}</b>${PESSOAS.map(([n, g, i, v]) => `<div class=p>${renderToStaticMarkup(<Retrato visual={{ ...v, chapeu: tipo, modeloChapeu: modelo }} genero={g} idade={i} semente="x1" tamanho={92} />)}<span>${n}</span></div>`).join('')}</div>`);
L.push('<h3>Óculos</h3><div class=f>');
for (const m of ['oculos_gatinho', 'oculos_quadrado', 'oculos_esportivo', 'oculos_redondo_metal']) L.push(`<div class=p>${renderToStaticMarkup(<Retrato visual={{ ...PESSOAS[0][3], oculos: 'sol', modeloOculos: m }} genero="masculino" idade={30} semente="x1" tamanho={92} />)}<span>${m}</span></div>`);
L.push('</div><h3>Bolsas e joias</h3><div class=f>');
for (const b of ['bolsa_transversal', 'bolsa_tote', 'mochila', 'pochete', 'clutch', 'bolsa_grife', 'corrente_cruz', 'colar_perolas', 'relogio_mergulho']) L.push(`<div class=p>${renderToStaticMarkup(<Figura visual={PESSOAS[1][3]} genero="feminino" idade={28} corpo="mediano" pecas={[{ itemId: 'jeans', id: 'j' }, { itemId: 'camiseta_lisa', id: 'c' }, { itemId: b, id: b }]} largura={140} semFundo />)}<span>${b}</span></div>`);
L.push('</div><h3>Materiais</h3><div class=f>');
for (const looks of [['jeans', 'jaqueta_jeans', 'tenis_lona'], ['calca_alfaiataria', 'sueter_tricot', 'sapato_social'], ['camisa_linho', 'bermuda_sarja'], ['vestido_festa'], ['jaqueta_couro', 'legging'], ['moletom_oversized', 'calca_cargo']]) L.push(`<div class=p>${renderToStaticMarkup(<Figura visual={PESSOAS[2][3]} genero="feminino" idade={30} corpo="mediano" pecas={looks.map(x => ({ itemId: x, id: x }))} largura={150} semFundo />)}<span>${looks.join('+')}</span></div>`);
L.push('</div><h3>Tatuagens do rosto</h3><div class=f>');
const T = (desenho: string, regiao: any, lado?: any, texto?: string) => ({ id: desenho + regiao + (lado ?? ''), desenho, regiao, local: 'rosto', lado, tamanho: 1, ajuste: { x: 0, y: 0, escala: 1, rot: 0 }, cor: 'preta', intensidade: 1, anos: 0, idade: 30, clareou: 0, texto }) as any;
const tats = [[T('lagrima_cheia', 'sob_olho', 'd'), T('tres_pontos', 'tempora', 'e')], [T('frase_testa', 'testa', undefined, 'FÉ'), T('estrela_rosto', 'bochecha', 'e')], [T('cruz_rosto', 'sobrancelha_t', 'd'), T('numero_rosto', 'queixo', undefined, '13'), T('coracao_rosto', 'nariz')]];
for (const [n, g, i, v] of PESSOAS.slice(0, 4)) for (const lista of tats) L.push(`<div class=p>${renderToStaticMarkup(<Retrato visual={v} genero={g} idade={i} semente="x1" tamanho={110} camadaDoRosto={(gr, pl, ro, uid) => <TatuagensDoRosto lista={lista} g={gr} pele={pl} rosto={ro} uid={uid} />} />)}<span>${n}</span></div>`);
L.push('</div>');
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px}.f{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;margin-bottom:6px;border-bottom:1px solid #ccc}.f b{width:100%}.p{display:flex;flex-direction:column;align-items:center}</style>${L.join('')}`);
