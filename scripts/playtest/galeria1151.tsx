/**
 * HOTFIX 11.5.1 — a galeria visual: os seis tons de pele sobre fundo claro (com e sem fundo próprio), as tatuagens (de
 * frente, de costas, várias, envelhecidas, saindo no laser), os óculos e chapéus de cada modelo, a camisa de time, e
 * os cômodos. Bundle como ESM e rode com OUT=<arquivo.html>; fotografe com fotografarHtml.mjs.
 *
 *   npx esbuild scripts/playtest/galeria1151.tsx --bundle --platform=node --format=esm --jsx=automatic --outfile=<s>/g.mjs && OUT=<s>/g.html node <s>/g.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';

const P = (ids: string[]) => ids.map((itemId, k) => ({ itemId, id: `e${k}${itemId}` }));
const L: { t: string; html: string }[] = [];
const add = (t: string, el: any) => L.push({ t, html: renderToStaticMarkup(el) });
const vis = (pele: string, extra: any = {}): any => ({ pele, cabelo: 'curto', corCabelo: pele <= 'p2' ? 'loiro' : 'preto', olhos: 'castanho', ...extra });
const T = (xs: [string, string, string?, number?, number?][]) => xs.map(([desenho, local, lado, anos, clareou], k) => ({ id: `t${k}`, desenho, local: local as any, lado: lado as any, anos: anos ?? 1, clareou: clareou ?? 0 }));

for (const pele of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) add(`${pele} regata · sem fundo`, <Figura visual={vis(pele)} genero="masculino" idade={30} corpo="mediano" pecas={P(['regata', 'bermuda_sarja', 'chinelo_slide'])} largura={150} semFundo />);
for (const pele of ['p1', 'p2', 'p6']) add(`${pele} com fundo`, <Figura visual={vis(pele, { cabelo: 'longo_liso' })} genero="feminino" idade={27} corpo="magro" pecas={P(['cropped', 'short_jeans', 'sandalia'])} largura={150} />);
const muitas = T([['fechamento', 'braco', 'd', 3], ['rosa_tradicional', 'antebraco', 'e', 6], ['nome_cursivo', 'antebraco', 'e', 6], ['andorinha', 'peito', undefined, 2], ['mandala', 'abdomen', undefined, 1], ['ramo_fino', 'pescoco', 'd'], ['coracaozinho', 'mao', 'e'], ['tribal_faixa', 'panturrilha', 'd', 10], ['peonia', 'coxa', 'e'], ['dragao_costas', 'costas', undefined, 4], ['tribal_polinesio', 'ombro', 'e', 1]]);
for (const pele of ['p1', 'p4', 'p6']) {
  add(`${pele} tatuagens frente`, <Figura visual={vis(pele)} genero="masculino" idade={33} corpo="atletico" pecas={P(['bermuda_tactel', 'tenis_casual'])} semCima tatuagens={muitas} largura={170} semFundo />);
  add(`${pele} tatuagens costas`, <Figura visual={vis(pele)} genero="masculino" idade={33} corpo="atletico" pecas={P(['bermuda_tactel', 'tenis_casual'])} semCima vista="costas" tatuagens={muitas} largura={170} semFundo />);
}
add('F tatuagens + vestida', <Figura visual={vis('p3', { cabelo: 'longo_ondulado', corCabelo: 'castanho' })} genero="feminino" idade={29} corpo="mediano" pecas={P(['regata', 'jeans', 'tenis_lona'])} tatuagens={T([['peonia', 'braco', 'd'], ['lua_estrelas', 'antebraco', 'e'], ['girassol', 'coxa', 'd'], ['ramos', 'pescoco', 'e'], ['carpa', 'costas']])} largura={170} />);
add('envelhecida 40 anos (aos 70)', <Figura visual={vis('p2', { corCabelo: 'grisalho' })} genero="masculino" idade={70} corpo="acima_do_peso" pecas={P(['regata', 'calca_alfaiataria', 'sapato_social'])} tatuagens={T([['ancora', 'antebraco', 'd', 45], ['pantera', 'braco', 'e', 45], ['coracao_faixa', 'braco', 'd', 40]])} largura={170} />);
add('laser no meio', <Figura visual={vis('p3')} genero="masculino" idade={35} corpo="mediano" pecas={P(['regata', 'jeans'])} tatuagens={T([['caveira', 'antebraco', 'd', 5, 0.5], ['triangulos', 'antebraco', 'e', 5]])} largura={170} />);
add('mini com tatuagem', <Figura visual={vis('p4')} genero="masculino" idade={30} corpo="mediano" pecas={P(['regata'])} tatuagens={muitas} largura={64} semFundo />);
// a camisa de time (as variantes de cor: listrada e lisa com raglan)
for (let k = 0; k < 6; k++) add(`camisa de time ${k}`, <Figura visual={vis(['p2', 'p5', 'p3', 'p6', 'p1', 'p4'][k])} genero={k % 2 ? 'feminino' : 'masculino'} idade={26} corpo="atletico" pecas={[{ itemId: 'camisa_time', id: `ct${k}` }, { itemId: 'bermuda_tactel', id: 'b' }, { itemId: 'chinelo_slide', id: 'c' }]} largura={150} />);
// óculos e chapéus por modelo
for (const o of ['oculos_juliet', 'oculos_aviador', 'oculos_grife', 'oculos_sol', 'oculos_redondo', 'oculos_grau', 'oculos_grau_acetato']) add(o, <Retrato visual={{ ...vis('p3'), oculos: o.includes('grau') ? 'grau' : o === 'oculos_redondo' ? 'redondo' : 'sol', modeloOculos: o }} genero="masculino" idade={30} semente="x" tamanho={130} />);
for (const c of ['bone', 'bone_aba_reta', 'chapeu', 'chapeu_palha', 'chapeu_couro', 'gorro', 'lenco', 'turbante']) add(c, <Retrato visual={{ ...vis('p4'), chapeu: c.startsWith('bone') ? 'bone' : c.startsWith('chapeu') ? 'chapeu' : c === 'turbante' ? 'lenco' : (c as any), modeloChapeu: c }} genero={c === 'turbante' ? 'feminino' : 'masculino'} idade={34} semente="y" tamanho={130} />);
add('Juliet mini 48', <Retrato visual={{ ...vis('p5'), oculos: 'sol', modeloOculos: 'oculos_juliet' }} genero="masculino" idade={22} semente="z" tamanho={48} />);
const html = (xs: typeof L) => `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border-radius:6px}</style>${xs.map(x => `<div class=c>${x.html}<span>${x.t}</span></div>`).join('')}`;
writeFileSync(process.env.OUT!, html(L));

const C: typeof L = [];
const cena = (t: string, el: any) => C.push({ t, html: renderToStaticMarkup(el) });
cena('sala simples', <CenaDoComodo tipo="sala" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'tv', id: 'b' }, { coisaId: 'violao', id: 'c' }]} rotulo="sala" />);
cena('sala taco+tijolo+quente', <CenaDoComodo tipo="sala" parede={{ id: 'tijolo', cor: '#a5583c' }} piso={{ id: 'madeira', cor: '#8f5e37' }} luz="quente" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'poltrona', id: 'b' }, { coisaId: 'piano', id: 'c' }, { coisaId: 'tv', id: 'd' }, { coisaId: 'som_hifi', id: 'e' }]} rotulo="sala" />);
cena('quarto papel', <CenaDoComodo tipo="quarto" parede={{ id: 'papel', cor: '#b7a37d' }} piso={{ id: 'vinilico', cor: '#b48a5e' }} objetos={[{ coisaId: 'cama', id: 'a' }, { coisaId: 'escrivaninha', id: 'b' }, { coisaId: 'notebook', id: 'c' }]} rotulo="q" />);
cena('cozinha', <CenaDoComodo tipo="cozinha" objetos={[{ coisaId: 'maquina_lavar', id: 'a' }, { coisaId: 'mesa_jantar', id: 'b' }]} rotulo="c" />);
cena('banheiro marmore', <CenaDoComodo tipo="banheiro" piso={{ id: 'marmore', cor: '#e8e4dc' }} parede={{ id: 'verde_menta', cor: '#a9cdb6' }} objetos={[]} rotulo="b" />);
cena('escritório planejada', <CenaDoComodo tipo="escritorio" parede={{ id: 'azul_petroleo', cor: '#2f5d68' }} piso={{ id: 'porcelanato', cor: '#d6d0c6' }} luz="planejada" objetos={[{ coisaId: 'escrivaninha', id: 'a' }, { coisaId: 'computador', id: 'b' }, { coisaId: 'poltrona', id: 'c' }]} rotulo="e" />);
cena('estúdio automação', <CenaDoComodo tipo="estudio" parede={{ id: 'grafite', cor: '#45484c' }} piso={{ id: 'cimento', cor: '#9b9894' }} luz="automacao" objetos={[{ coisaId: 'bateria', id: 'a' }, { coisaId: 'guitarra', id: 'b' }, { coisaId: 'teclado', id: 'c' }, { coisaId: 'home_studio', id: 'd' }]} rotulo="s" />);
cena('vazio', <CenaDoComodo tipo="quarto" objetos={[]} rotulo="v" />);
cena('jardim', <CenaDoComodo tipo="jardim" objetos={[{ coisaId: 'camping', id: 'a' }]} rotulo="j" />);
cena('piscina', <CenaDoComodo tipo="piscina" objetos={[]} rotulo="p" />);
cena('lazer', <CenaDoComodo tipo="lazer" objetos={[{ coisaId: 'mesa_jantar', id: 'a' }]} rotulo="l" />);
cena('academia', <CenaDoComodo tipo="academia" objetos={[{ coisaId: 'esteira', id: 'a' }, { coisaId: 'estacao_musculacao', id: 'b' }, { coisaId: 'kit_academia', id: 'c' }]} rotulo="a" />);
cena('cinema', <CenaDoComodo tipo="cinema" luz="automacao" objetos={[{ coisaId: 'projetor', id: 'a' }, { coisaId: 'sofa', id: 'b' }]} rotulo="ci" />);
cena('garagem', <CenaDoComodo tipo="garagem" objetos={[{ coisaId: 'prancha', id: 'a' }]} rotulo="g" />);
cena('mini sala', <CenaDoComodo tipo="sala" objetos={[{ coisaId: 'sofa', id: 'a' }, { coisaId: 'tv', id: 'b' }]} largura={132} rotulo="m" />);
writeFileSync(process.env.OUT!.replace('.html', '-comodos.html'), html(C));
