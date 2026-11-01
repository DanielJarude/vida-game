/**
 * VIDA 12.6 — a galeria das tatuagens: o catálogo inteiro (grande e em miniatura, em duas peles), as regiões no corpo
 * (de frente e de costas, em cinco corpos), o envelhecimento (25, 50, 75 anos), o retoque, o laser, as composições
 * (mangas, costas, perna) e as cores (preto, cinza, colorida, paletas, tons). Bundle como ESM e rode com OUT=<a.html>;
 * fotografe com fotografarHtml.mjs.
 *   npx esbuild scripts/playtest/galeria126.tsx --bundle --platform=node --format=esm --jsx=automatic --outfile=<s>/g.mjs && OUT=<s>/g.html node <s>/g.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura, focoDaRegiao } from '../../src/ui/avatar/Figura';
import { DesenhoDaTatuagem, caixaNativa } from '../../src/ui/avatar/tatuagens';
import { DESENHOS, REGIOES, type RegiaoDeTatuagem } from '../../src/motor/dados/tatuagens';
import { tintaNaPele } from '../../src/ui/avatar/tatuagensNaPele';

const L: { t: string; html: string }[] = [];
const add = (t: string, el: any) => L.push({ t, html: renderToStaticMarkup(el) });
const vis = (pele: string, extra: any = {}): any => ({ pele, cabelo: 'curto', corCabelo: pele <= 'p2' ? 'loiro' : 'preto', olhos: 'castanho', ...extra });
let n = 0;
const T = (desenho: string, regiao: RegiaoDeTatuagem, lado?: 'e' | 'd', x: any = {}) => ({ id: `t${n++}`, desenho, regiao, local: REGIOES[regiao].parte, ...(lado ? { lado } : {}), tamanho: x.tamanho ?? DESENHOS.find(d => d.id === desenho)!.tamanho, ajuste: { x: 0, y: 0, escala: 1, rot: 0, ...(x.ajuste ?? {}) }, cor: x.cor ?? (DESENHOS.find(d => d.id === desenho)!.colorida ? 'colorida' : DESENHOS.find(d => d.id === desenho)!.estilo === 'realista' ? 'cinza' : 'preta'), intensidade: x.intensidade ?? 1, anos: x.anos ?? 1, idade: x.idade ?? 30, clareou: x.clareou ?? 0, ...(x.tom ? { tom: x.tom } : {}), ...(x.texto ? { texto: x.texto } : {}), ...(x.conjunto ? { conjunto: x.conjunto } : {}), ...(x.sombra ? { sombra: true } : {}) });

// 1. o catálogo, grande e pequeno, na pele clara e na escura
const C: typeof L = [];
for (const d of DESENHOS) {
  const [w, h] = caixaNativa(d);
  const svg = (pele: string, px: number) => {
    const t = tintaNaPele({ cor: d.colorida ? 'colorida' : d.estilo === 'realista' ? 'cinza' : 'preta', intensidade: 1, anos: 0, idade: 30 }, pele);
    return <svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={px} height={px} style={{ background: pele, borderRadius: 4 }}><DesenhoDaTatuagem id={d.id} tinta={t.tinta} cor={t.cor} /></svg>;
  };
  C.push({ t: `${d.nome} · ${d.estilo}`, html: renderToStaticMarkup(<div style={{ display: 'flex', gap: 4, alignItems: 'end' }}>{svg('#f1c8a8', 96)}{svg('#6b4029', 96)}{svg('#d9a582', 28)}</div>) });
}
// 2. o corpo inteiro
const muitas = [
  T('carpa', 'biceps', 'd'), T('rosa_tradicional', 'ombro', 'd'), T('andorinha', 'antebraco', 'd', { ajuste: { y: -1 } }), T('nome_cursivo', 'antebraco', 'd', { ajuste: { y: 1 }, texto: 'Helena' }), T('fases_da_lua', 'pulso', 'e', { tamanho: 1 }),
  T('relogio_rosa', 'biceps', 'e'), T('triangulo_mini', 'dedos', 'e'), T('coracaozinho', 'mao', 'd'), T('lustre', 'centro_peito'), T('andorinha', 'peitoral', 'e'), T('andorinha', 'peitoral', 'd', { ajuste: { espelhar: true } }),
  T('lirio', 'costelas', 'e'), T('ramo_fino', 'pescoco', 'd'), T('mandala', 'joelho', 'e', { tamanho: 2 }), T('floresta', 'canela', 'd'), T('girassol', 'coxa', 'e'), T('aviao_papel', 'tornozelo', 'd'), T('constelacao', 'pe', 'e'),
  T('tigre', 'costas_alta'), T('maori_espiral', 'triceps', 'd'), T('serpente_negra', 'panturrilha', 'e'), T('montanha_mini', 'nuca'), T('palavra_gotica', 'costas_baixa', undefined, { texto: 'Família' }), T('onda', 'antebraco_externo', 'e')
];
for (const [g, c, pele] of [['masculino', 'atletico', 'p2'], ['feminino', 'mediano', 'p5'], ['masculino', 'musculoso', 'p4'], ['feminino', 'magro', 'p1'], ['masculino', 'acima_do_peso', 'p6']] as const) {
  add(`${g} ${c} ${pele} frente`, <Figura visual={vis(pele)} genero={g} idade={32} corpo={c} pecas={[]} semCima descalco tatuagens={muitas} largura={210} semFundo />);
  add(`${g} ${c} costas`, <Figura visual={vis(pele)} genero={g} idade={32} corpo={c} pecas={[]} semCima descalco vista="costas" tatuagens={muitas} largura={210} semFundo />);
}
add('vestida (camiseta e calça)', <Figura visual={vis('p3', { cabelo: 'longo_ondulado' })} genero="feminino" idade={29} corpo="mediano" pecas={[]} tatuagens={muitas} largura={170} />);
// 3. o tempo
for (const [i, anos] of [[25, 0], [50, 25], [75, 50]] as const) add(`aos ${i} (tinta de ${anos} anos)`, <Figura visual={vis('p2', { corCabelo: i > 60 ? 'grisalho' : 'castanho' })} genero="masculino" idade={i} corpo={i > 60 ? 'acima_do_peso' : 'mediano'} pecas={[]} semCima descalco tatuagens={[T('rosa_tradicional', 'biceps', 'd', { anos, idade: i }), T('ancora', 'antebraco', 'e', { anos, idade: i }), T('leao_realista', 'peitoral', 'd', { anos, idade: i }), T('nome_cursivo', 'antebraco', 'd', { anos, idade: i, texto: 'Lucia' })]} largura={190} semFundo />);
add('retocada aos 75', <Figura visual={vis('p2', { corCabelo: 'grisalho' })} genero="masculino" idade={75} corpo="acima_do_peso" pecas={[]} semCima descalco tatuagens={[T('rosa_tradicional', 'biceps', 'd', { anos: 0, idade: 75 }), T('ancora', 'antebraco', 'e', { anos: 0, idade: 75 }), T('leao_realista', 'peitoral', 'd', { anos: 0, idade: 75 })]} largura={190} semFundo />);
add('laser 30%, 80%, sombra', <Figura visual={vis('p3')} genero="masculino" idade={35} corpo="mediano" pecas={[]} semCima descalco tatuagens={[T('caveira', 'antebraco', 'd', { clareou: 0.3 }), T('carpa', 'biceps', 'e', { clareou: 0.8 }), T('tigre', 'peitoral', 'd', { sombra: true, clareou: 1 })]} largura={190} semFundo />);
// 4. as composições
const manga = (modelo: string, pecas: [string, RegiaoDeTatuagem][], fundo: any, cor?: any) => {
  const c = { id: modelo.replace(/ /g, '-'), tipo: 'manga' as const, lado: 'd' as const, fundo };
  const ts = pecas.map(([d, r]) => T(d, r, 'd', { conjunto: modelo.replace(/ /g, '-'), ...(cor ? { cor } : {}) }));
  add(`${modelo} frente`, <Figura visual={vis('p2')} genero="masculino" idade={30} corpo="atletico" pecas={[]} semCima descalco tatuagens={ts} composicoes={[c]} largura={210} semFundo />);
  add(`${modelo} costas`, <Figura visual={vis('p2')} genero="masculino" idade={30} corpo="atletico" pecas={[]} semCima descalco vista="costas" tatuagens={ts} composicoes={[c]} largura={210} semFundo />);
};
manga('manga oriental', [['nuvens', 'ombro'], ['carpa', 'biceps'], ['cerejeira', 'triceps'], ['hannya', 'antebraco'], ['onda', 'antebraco_externo']], 'ondas');
manga('manga realista', [['rosa_realista', 'ombro'], ['leao_realista', 'biceps'], ['relogio_rosa', 'triceps'], ['bussola', 'antebraco'], ['olho_realista', 'antebraco_externo']], 'nuvens');
manga('manga blackwork', [['mandala', 'ombro'], ['serpente_negra', 'biceps'], ['corvo', 'triceps'], ['fases_da_lua', 'antebraco'], ['montanha', 'antebraco_externo']], 'blackwork');
add('costas orientais', <Figura visual={vis('p4')} genero="feminino" idade={30} corpo="mediano" pecas={[]} semCima descalco vista="costas" tatuagens={[T('tigre', 'costas_alta', undefined, { conjunto: 'c' }), T('carpa', 'costas_media', undefined, { conjunto: 'c' }), T('onda', 'costas_baixa', undefined, { conjunto: 'c', tamanho: 2 })]} composicoes={[{ id: 'c', tipo: 'costas', fundo: 'ondas' }]} largura={210} semFundo />);
add('perna florida (peça inteira)', <Figura visual={vis('p3')} genero="feminino" idade={30} corpo="mediano" pecas={[]} semCima descalco tatuagens={[T('perna_floral', 'perna_inteira', 'e')]} largura={210} semFundo />);
add('dragão nas costas (peça inteira)', <Figura visual={vis('p2')} genero="masculino" idade={30} corpo="mediano" pecas={[]} semCima descalco vista="costas" tatuagens={[T('fenix_costas', 'costas_inteiras')]} largura={210} semFundo />);
// 5. as lupas
for (const [r, ld, vista] of [['biceps', 'd', 'frente'], ['antebraco', 'd', 'frente'], ['dedos', 'e', 'frente'], ['centro_peito', undefined, 'frente'], ['costas_alta', undefined, 'costas'], ['pe', 'e', 'frente'], ['nuca', undefined, 'costas'], ['canela', 'd', 'frente']] as const) {
  add(`lupa ${r}`, <Figura visual={vis('p2')} genero="masculino" idade={32} corpo="atletico" pecas={[]} semCima descalco vista={vista} tatuagens={muitas} largura={210} semFundo foco={focoDaRegiao('masculino', 'atletico', 32, r as RegiaoDeTatuagem, ld as any, vista, 1)} />);
}
// 6. as cores
const cores: any[] = [['preta'], ['cinza'], ['colorida'], ['colorida', 'quente'], ['colorida', 'fria'], ['colorida', 'pastel'], ['colorida', 'vibrante']];
for (const [cor, tom] of cores) add(`peônia ${cor} ${tom ?? ''}`, <Figura visual={vis('p2')} genero="feminino" idade={30} corpo="mediano" pecas={[]} semCima descalco tatuagens={[T('peonia', 'peitoral', 'e', { cor, tom }), T('tigre', 'abdomen', undefined, { cor, tom }), T('ramo_fino', 'antebraco', 'e', { tom: ['sepia', 'vermelho', 'azul', 'verde'][cores.indexOf(tom) % 4] })]} largura={150} semFundo foco={{ x: 30, y: 60, w: 60, h: 80 }} />);
add('mini 64 com tatuagens', <Figura visual={vis('p4')} genero="masculino" idade={30} corpo="mediano" pecas={[]} semCima tatuagens={muitas} largura={64} semFundo />);
const html = (xs: typeof L, larg = 900) => `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:${larg - 16}px}.c{display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border-radius:6px}</style>${xs.map(x => `<div class=c>${x.html}<span>${x.t}</span></div>`).join('')}`;
writeFileSync(process.env.OUT!, html(L));
writeFileSync(process.env.OUT!.replace(/\.html$/, '-catalogo.html'), html(C));
