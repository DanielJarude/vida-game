/**
 * VIDA 18 · a propriedade desenhada — uma vista 2.5D (o chão em perspectiva, as construções com volume) que mostra o que
 * ela é de verdade. Nada é enfeite: cada construção, cada máquina, cada talhão e cada bicho só aparece se existe na
 * propriedade. Determinística (a mesma propriedade, o mesmo desenho).
 *
 * VIDA 22 · a propriedade ORGANIZADA NO TERRENO (antes a sede era pintada numa coordenada fixa, por cima das faixas de
 * lavoura, e as estruturas também — a casa parecia "posta sobre a plantação"). Agora o chão é dividido em zonas, como
 * numa propriedade de verdade, de trás para a frente:
 *
 *   reserva      a mata da reserva legal no fundo, do tamanho da fração que a lei pede;
 *   produção     os talhões e o pasto em glebas cercadas (a área de cada um pesa na largura; a lavoura grande tem mais
 *                linhas de plantio, o pivô central desenha o círculo irrigado, o café vai em curvas de nível, a horta em
 *                canteiros, a floresta plantada em fileiras de árvores, os tanques em quadras com taipa);
 *   carreador    a estrada interna (cascalhada quando a propriedade fez as estradas) que sai da porteira, passa entre a
 *                sede e o terreiro e entra nas glebas;
 *   sede         a casa num quintal próprio, gramado e cercado, com jardim, árvores de sombra e o caminho até o carreador
 *                — fora da lavoura; a casa muda com o tipo (o sítio tem alpendre, a fazenda a varanda comprida e as
 *                janelas de madeira, a propriedade florestal um chalé de madeira);
 *   terreiro     o pátio de serviço com as construções que existem (galpão com as máquinas na frente, silos, curral,
 *                estábulo e ordenha, cocheiras, aprisco, granja, aviário, terreiro de café, viveiro, estufas, placas
 *                solares, poço), na ordem de profundidade (o que está atrás é desenhado antes).
 *
 * Os tipos ficam diferentes porque o que têm é diferente: a fazenda de gado é pasto com árvores esparsas, curral e
 * rebanho; a agrícola é gleba grande com silo e máquina; o haras tem cerca branca, piquetes e a pista oval; a
 * piscicultura, os tanques; a chácara, o quintal com horta e pomar.
 */
import type { ReactElement } from 'react';
import type { PropriedadeRural18 } from '../../../motor/v18/rural/fazenda18';
import { areaUtil, qtdEstrutura } from '../../../motor/v18/rural/fazenda18';
import type { CulturaId, TipoRural } from '../../../motor/dados18/rural/catalogo18';

const COR: Record<CulturaId, [string, string]> = {
  soja: ['#c9b75a', '#a6943f'], milho: ['#d8c368', '#9fa64a'], arroz: ['#a9c96a', '#7fa64c'], feijao: ['#8fae5a', '#6d8c43'], algodao: ['#d9d6c8', '#a7a38f'],
  cana: ['#8cbf5a', '#5f9a3c'], cafe: ['#6f9a55', '#355a27'], trigo: ['#e2c46e', '#c0a24e'], mandioca: ['#7ea85a', '#5c8442'], frutas: ['#8db36a', '#4f7f3c'],
  horta: ['#7a5a3c', '#5fae4f'], cacau: ['#6f8f4f', '#45622f'], acai: ['#6f9454', '#3f6634'], uva: ['#9fae6a', '#5b7a3a'], eucalipto: ['#8aa66a', '#4f7f5a'], pinus: ['#7f9a62', '#2f5a3c']
};
const FRUTA: Partial<Record<CulturaId, string>> = { frutas: '#e8952a', cacau: '#c7832e', uva: '#5b2d63' };
const LINHAS: CulturaId[] = ['soja', 'milho', 'arroz', 'feijao', 'algodao', 'cana', 'trigo', 'mandioca'];
const ARVORES: CulturaId[] = ['frutas', 'cacau', 'acai'];

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
/** Um sorteio estável (0..1) pela propriedade e por uma chave. */
const sorte = (id: string, k: string | number) => hash(`${id}|${k}`);

/* ---------------------------------------------------------------- o chão em perspectiva */

/** Um ponto do chão (u, v em 0..1; v = 0 no fundo, 1 na frente) na tela: o chão é um trapézio em perspectiva. */
const chao = (u: number, v: number): [number, number] => { const y = 92 + v * 80; const larg = 210 + v * 110; return [160 - larg / 2 + u * larg, y]; };
/** A escala de um objeto plantado no ponto (u, v): o que está atrás é menor. */
const escala = (v: number) => (210 + v * 110) / 320;
const pts = (lista: [number, number][]) => lista.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const quad = (u0: number, v0: number, u1: number, v1: number) => pts([chao(u0, v0), chao(u1, v0), chao(u1, v1), chao(u0, v1)]);
/** Um contorno de gleba no chão (para as cercas). */
const borda = (u0: number, v0: number, u1: number, v1: number) => { const a = chao(u0, v0), b = chao(u1, v0), c = chao(u1, v1), d = chao(u0, v1); return `M${a.join(' ')}L${b.join(' ')}L${c.join(' ')}L${d.join(' ')}Z`; };

interface Gleba { u0: number; v0: number; u1: number; v1: number }
interface Objeto { v: number; el: ReactElement }

/* ---------------------------------------------------------------- as peças (desenhadas a partir da base frontal-esquerda) */

/** Uma caixa 2.5D: frente iluminada, lado na sombra (recuando para a direita e para cima), com a sombra no chão. */
function Caixa({ x, y, w, h, d, s, cor, lado, borda: b = '#5b4a38' }: { x: number; y: number; w: number; h: number; d: number; s: number; cor: string; lado?: string; borda?: string }) {
  const W = w * s, H = h * s, D = d * s;
  return (
    <g>
      <polygon points={pts([[x, y], [x + W, y], [x + W + D * 0.9, y - D * 0.5], [x + D * 0.9, y - D * 0.5]])} fill="#000" opacity="0.12" transform={`translate(${(3 * s).toFixed(1)} 0)`} />
      <rect x={x} y={y - H} width={W} height={H} fill={cor} stroke={b} strokeWidth={0.5} />
      <polygon points={pts([[x + W, y], [x + W + D * 0.9, y - D * 0.5], [x + W + D * 0.9, y - D * 0.5 - H], [x + W, y - H]])} fill={lado ?? cor} stroke={b} strokeWidth={0.5} opacity={lado ? 1 : 0.82} />
    </g>
  );
}
/** O telhado de duas águas sobre uma caixa (a cumeeira correndo para o fundo). */
function DuasAguas({ x, y, w, h, d, s, cor, beiral = 1.5, alt = 0.55 }: { x: number; y: number; w: number; h: number; d: number; s: number; cor: string; beiral?: number; alt?: number }) {
  const W = w * s, H = h * s, D = d * s, B = beiral * s, A = w * alt * s;
  const top = y - H;
  return (
    <g>
      <polygon points={pts([[x - B, top + B * 0.2], [x + W / 2, top - A], [x + W + B, top + B * 0.2]])} fill={cor} stroke="#5a3a2a" strokeWidth={0.4} />
      <polygon points={pts([[x + W / 2, top - A], [x + W / 2 + D * 0.9, top - A - D * 0.5], [x + W + B + D * 0.9, top + B * 0.2 - D * 0.5], [x + W + B, top + B * 0.2]])} fill={cor} stroke="#5a3a2a" strokeWidth={0.4} opacity={0.78} />
    </g>
  );
}
/** A meia-água sobre a varanda (inclinada para a frente). */
function MeiaAgua({ x, y, w, h, d, s, cor }: { x: number; y: number; w: number; h: number; d: number; s: number; cor: string }) {
  const W = w * s, H = h * s, D = d * s;
  return <polygon points={pts([[x - 1 * s, y - H + 1.2 * s], [x + W + 1 * s, y - H + 1.2 * s], [x + W + 1 * s + D * 0.9, y - H - D * 0.5 - 1.6 * s], [x - 1 * s + D * 0.9, y - H - D * 0.5 - 1.6 * s]])} fill={cor} stroke="#5a3a2a" strokeWidth={0.4} />;
}
function Janela({ x, y, w, h, cor = '#9cc6d6', moldura = '#f4efe4' }: { x: number; y: number; w: number; h: number; cor?: string; moldura?: string }) {
  return <g><rect x={x} y={y} width={w} height={h} fill={cor} stroke={moldura} strokeWidth={0.6} /><path d={`M${x + w / 2} ${y}v${h}`} stroke={moldura} strokeWidth={0.4} /></g>;
}

/** A sede: a casa do sítio (alpendre), a casa de fazenda (varanda comprida, janelas de madeira), o chalé de madeira. */
function Sede({ x, y, s, tipo }: { x: number; y: number; s: number; tipo: TipoRural }) {
  if (tipo === 'florestal') {
    const w = 14, h = 7, d = 9;
    return (
      <g className="paisagem18__peca" data-estrutura="sede">
        <Caixa x={x} y={y} w={w} h={h} d={d} s={s} cor="#9a6a40" lado="#7a5030" borda="#4a3020" />
        <path d={Array.from({ length: 5 }, (_, k) => `M${x} ${y - (k + 1) * 1.3 * s}h${w * s}`).join('')} stroke="#6b4428" strokeWidth={0.4} />
        <DuasAguas x={x} y={y} w={w} h={h} d={d} s={s} cor="#4f5a4a" alt={0.62} />
        <rect x={x + w * 0.42 * s} y={y - 5 * s} width={2.4 * s} height={5 * s} fill="#4a3020" />
        <Janela x={x + 1.8 * s} y={y - 5 * s} w={3 * s} h={2.4 * s} moldura="#e8dcc4" />
        <Janela x={x + 9.4 * s} y={y - 5 * s} w={3 * s} h={2.4 * s} moldura="#e8dcc4" />
      </g>
    );
  }
  const fazenda = tipo === 'agricola' || tipo === 'pecuaria' || tipo === 'cafeeira' || tipo === 'haras';
  const w = fazenda ? 24 : 16, h = fazenda ? 7 : 6.5, d = fazenda ? 11 : 9;
  const parede = fazenda ? '#f3ede0' : '#efe1c4';
  const W = w * s;
  const alt = fazenda ? 0.32 : 0.45;
  return (
    <g className="paisagem18__peca" data-estrutura="sede">
      <Caixa x={x} y={y} w={w} h={h} d={d} s={s} cor={parede} lado={fazenda ? '#ddd4c2' : '#d9c8a6'} />
      {/* O barrado e o telhado de telha, com beiral largo. */}
      <rect x={x} y={y - 1.2 * s} width={W} height={1.2 * s} fill={fazenda ? '#7b8f9a' : '#b58a5a'} />
      {/* A chaminé do fogão a lenha (atrás do telhado). */}
      <rect x={x + W * 0.74} y={y - h * s - w * alt * s * 0.5 - 3 * s} width={1.4 * s} height={4 * s} fill="#a08a72" stroke="#5a3a2a" strokeWidth={0.3} />
      <DuasAguas x={x} y={y} w={w} h={h} d={d} s={s} cor="#b5523b" beiral={1.8} alt={alt} />
      {/* Portas e janelas (as da fazenda, de madeira azul de duas folhas). */}
      <rect x={x + W * 0.44} y={y - 4.6 * s} width={2.6 * s} height={4.6 * s} fill={fazenda ? '#3d6a8a' : '#7a5a3a'} />
      {(fazenda ? [0.08, 0.24, 0.62, 0.8] : [0.12, 0.7]).map(t => <Janela key={t} x={x + W * t} y={y - 4.8 * s} w={2.4 * s} h={2.6 * s} cor={fazenda ? '#3d6a8a' : '#9cc6d6'} />)}
      {/* A varanda: o piso, os esteios e a meia-água por cima — do comprimento da frente na fazenda, o alpendre no sítio. */}
      <rect x={x - 0.6 * s} y={y - 0.4 * s} width={W + 1.2 * s} height={1.2 * s} fill="#c7a77a" />
      {(fazenda ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]).map(t => <rect key={t} x={x + t * (W - 0.8 * s) - 0.4 * s} y={y - h * s + 2.4 * s} width={0.8 * s} height={h * s - 2.6 * s} fill="#7a5532" />)}
      <MeiaAgua x={x} y={y + 2.4 * s} w={w} h={h} d={2.4} s={s} cor="#a9472f" />
    </g>
  );
}

/** O galpão de máquinas: telhado em arco de chapa, frente aberta com os esteios. */
function Galpao({ x, y, s, n = 1 }: { x: number; y: number; s: number; n?: number }) {
  const w = n > 1 ? 30 : 22, h = 7, d = 13, W = w * s, H = h * s, D = d * s;
  const vaos = Math.round(w / 5);
  return (
    <g className="paisagem18__peca" data-estrutura="galpao">
      <Caixa x={x} y={y} w={w} h={h} d={d} s={s} cor="#3f3a36" lado="#9aa0a2" borda="#4a4f52" />
      {Array.from({ length: vaos + 1 }, (_, k) => <rect key={k} x={x + k * (W / vaos) - 0.4 * s} y={y - H} width={0.8 * s} height={H} fill="#b8bec0" />)}
      <path d={`M${x - 1 * s} ${y - H} Q${x + W / 2} ${y - H - 5 * s} ${x + W + 1 * s} ${y - H} L${x + W + 1 * s + D * 0.9} ${y - H - D * 0.5} Q${x + W / 2 + D * 0.9} ${y - H - D * 0.5 - 5 * s} ${x - 1 * s + D * 0.9} ${y - H - D * 0.5} Z`} fill="#b9c0c3" stroke="#6d7578" strokeWidth={0.4} />
      <path d={Array.from({ length: 6 }, (_, k) => { const t = (k + 0.5) / 6; return `M${x - 1 * s + (W + 2 * s) * t} ${y - H - Math.sin(Math.PI * t) * 2.5 * s}l${D * 0.9} ${-D * 0.5}`; }).join('')} stroke="#8d9598" strokeWidth={0.3} />
    </g>
  );
}
function Silo({ x, y, s }: { x: number; y: number; s: number }) {
  const r = 3.2 * s, h = 13 * s;
  return (
    <g className="paisagem18__peca" data-estrutura="silo">
      <ellipse cx={x + r + 2 * s} cy={y} rx={r * 1.1} ry={r * 0.4} fill="#000" opacity={0.12} />
      <rect x={x} y={y - h} width={r * 2} height={h} fill="#d7dcde" stroke="#8a9296" strokeWidth={0.5} />
      <rect x={x + r * 1.2} y={y - h} width={r * 0.8} height={h} fill="#b9c0c3" />
      {[0.25, 0.5, 0.75].map(t => <path key={t} d={`M${x} ${y - h * t}h${r * 2}`} stroke="#9aa2a6" strokeWidth={0.4} />)}
      <polygon points={pts([[x - 0.4 * s, y - h], [x + r, y - h - r * 0.9], [x + r * 2 + 0.4 * s, y - h]])} fill="#c4cacd" stroke="#8a9296" strokeWidth={0.5} />
    </g>
  );
}
/** O curral: o cercado de tábuas, o tronco coberto. */
function Curral({ x, y, s }: { x: number; y: number; s: number }) {
  const w = 18 * s, d = 8 * s, cor = '#7a5c3c';
  const a: [number, number] = [x, y], b: [number, number] = [x + w, y], c: [number, number] = [x + w + d * 0.9, y - d * 0.5], e: [number, number] = [x + d * 0.9, y - d * 0.5];
  const cerca = (p: [number, number], q: [number, number]) => Array.from({ length: 7 }, (_, k) => { const t = k / 6; const px = p[0] + (q[0] - p[0]) * t, py = p[1] + (q[1] - p[1]) * t; return `M${px.toFixed(1)} ${py.toFixed(1)}v${(-3.4 * s).toFixed(1)}`; }).join('') + `M${p[0].toFixed(1)} ${(p[1] - 1.4 * s).toFixed(1)}L${q[0].toFixed(1)} ${(q[1] - 1.4 * s).toFixed(1)}M${p[0].toFixed(1)} ${(p[1] - 2.8 * s).toFixed(1)}L${q[0].toFixed(1)} ${(q[1] - 2.8 * s).toFixed(1)}`;
  const tx = x + w * 0.62, ty = y - d * 0.15;
  return (
    <g className="paisagem18__peca" data-estrutura="curral">
      <polygon points={pts([a, b, c, e])} fill="#b89a6a" opacity={0.7} />
      <path d={cerca(e, c) + cerca(a, e)} stroke={cor} strokeWidth={0.7} fill="none" />
      <Caixa x={tx} y={ty} w={5} h={3.4} d={3} s={s} cor="#8a6a45" lado="#6b4f32" />
      <polygon points={pts([[tx - 0.6 * s, ty - 3.4 * s], [tx + 5.6 * s, ty - 3.4 * s], [tx + 8.3 * s, ty - 5 * s], [tx + 2.1 * s, ty - 5 * s]])} fill="#9aa0a2" />
      <path d={cerca(a, b) + cerca(b, c)} stroke={cor} strokeWidth={0.7} fill="none" />
    </g>
  );
}
/** Um galpão comprido e baixo (estábulo, aviário, granja, aprisco, cocheiras), com o detalhe de cada um. */
function Comprido({ x, y, s, tipo }: { x: number; y: number; s: number; tipo: 'ordenha' | 'aviario' | 'pocilga' | 'aprisco' | 'cocheiras' }) {
  const cfg = { ordenha: { w: 20, h: 4.6, d: 8, cor: '#efe9dc', lado: '#d6cfbf', teto: '#b5523b' }, aviario: { w: 34, h: 3.4, d: 6, cor: '#f2c94c', lado: '#d9b03a', teto: '#c9cfd2' }, pocilga: { w: 22, h: 3.2, d: 8, cor: '#e6dfd2', lado: '#cbc3b4', teto: '#a8aeb1' }, aprisco: { w: 12, h: 3.6, d: 7, cor: '#a8835a', lado: '#8a6a45', teto: '#9aa0a2' }, cocheiras: { w: 24, h: 4.4, d: 8, cor: '#f2efe8', lado: '#d9d4c8', teto: '#7c3a2c' } }[tipo];
  const W = cfg.w * s, y0 = y - (tipo === 'aprisco' ? 1.4 * s : 0);
  return (
    <g className="paisagem18__peca" data-estrutura={tipo}>
      {tipo === 'aprisco' && [0.1, 0.5, 0.9].map(t => <rect key={t} x={x + W * t - 0.4 * s} y={y - 1.4 * s} width={0.8 * s} height={1.4 * s} fill="#5a4030" />)}
      <Caixa x={x} y={y0} w={cfg.w} h={cfg.h} d={cfg.d} s={s} cor={cfg.cor} lado={cfg.lado} />
      <DuasAguas x={x} y={y0} w={cfg.w} h={cfg.h} d={cfg.d} s={s} cor={cfg.teto} alt={0.12} beiral={1} />
      {tipo === 'aviario' && <><rect x={x + 1 * s} y={y - 2.6 * s} width={W - 2 * s} height={1.6 * s} fill="#3d6a9a" opacity={0.85} />{[0, 1].map(t => <circle key={t} cx={x + W + 2.4 * s} cy={y - (1.4 + t * 1.6) * s} r={0.6 * s} fill="#6d7578" />)}</>}
      {tipo === 'cocheiras' && Array.from({ length: 6 }, (_, k) => <g key={k}><rect x={x + (1.2 + k * 3.8) * s} y={y - 3.2 * s} width={2.2 * s} height={3.2 * s} fill="#7c3a2c" /><path d={`M${x + (1.2 + k * 3.8) * s} ${y - 1.6 * s}h${2.2 * s}`} stroke="#f2efe8" strokeWidth={0.5} /></g>)}
      {tipo === 'ordenha' && <><rect x={x + 2 * s} y={y - 3.4 * s} width={W - 4 * s} height={2 * s} fill="#5f6f78" opacity={0.6} /><rect x={x + W + 3 * s} y={y - 3 * s} width={4.4 * s} height={2.6 * s} rx={1.3 * s} fill="#cfd6d9" stroke="#8a9296" strokeWidth={0.4} /></>}
      {tipo === 'pocilga' && <><rect x={x + 1.2 * s} y={y - 2.2 * s} width={W - 2.4 * s} height={1 * s} fill="#8a8f92" opacity={0.6} /><ellipse cx={x + W + 6 * s} cy={y - 0.6 * s} rx={4 * s} ry={1.3 * s} fill="#6b5236" opacity={0.8} /></>}
    </g>
  );
}
function Estufa({ x, y, s }: { x: number; y: number; s: number }) {
  const w = 14 * s, d = 9 * s;
  return (
    <g className="paisagem18__peca" data-estrutura="estufa">
      <path d={`M${x} ${y} Q${x + w / 2} ${y - 9 * s} ${x + w} ${y} L${x + w + d * 0.9} ${y - d * 0.5} Q${x + w / 2 + d * 0.9} ${y - d * 0.5 - 9 * s} ${x + d * 0.9} ${y - d * 0.5} Z`} fill="#e3f1f2" stroke="#9cb9bd" strokeWidth={0.5} opacity={0.92} />
      <path d={`M${x} ${y} Q${x + w / 2} ${y - 9 * s} ${x + w} ${y} Z`} fill="#eef7f7" stroke="#9cb9bd" strokeWidth={0.5} />
      <path d={`M${x + w * 0.25} ${y - 4.4 * s}v${4.4 * s}M${x + w * 0.5} ${y - 4.6 * s}v${4.6 * s}M${x + w * 0.75} ${y - 4.4 * s}v${4.4 * s}`} stroke="#9cb9bd" strokeWidth={0.4} />
      <path d={`M${x + 2 * s} ${y - 0.6 * s}h${w - 4 * s}`} stroke="#5fae4f" strokeWidth={1} />
    </g>
  );
}
/** O terreiro de café: o pátio cimentado com o café espalhado em leiras. */
function Terreiro({ x, y, s }: { x: number; y: number; s: number }) {
  const w = 20 * s, d = 10 * s;
  return (
    <g className="paisagem18__peca" data-estrutura="terreiro">
      <polygon points={pts([[x, y], [x + w, y], [x + w + d * 0.9, y - d * 0.5], [x + d * 0.9, y - d * 0.5]])} fill="#d9d4c8" stroke="#a9a397" strokeWidth={0.5} />
      {Array.from({ length: 5 }, (_, k) => { const t = (k + 0.5) / 5; return <path key={k} d={`M${x + 1.5 * s + d * 0.9 * t} ${y - d * 0.5 * t}h${w - 3 * s}`} stroke="#7a4a2a" strokeWidth={1.4 * s} strokeLinecap="round" opacity={0.85} />; })}
    </g>
  );
}
function Viveiro({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g className="paisagem18__peca" data-estrutura="viveiro">
      <Caixa x={x} y={y} w={12} h={3} d={8} s={s} cor="#2f3a34" lado="#26302a" borda="#1f2622" />
      <path d={Array.from({ length: 6 }, (_, k) => `M${x + (1 + k * 1.8) * s} ${y - 0.5 * s}h${1.1 * s}`).join('')} stroke="#7fbf5a" strokeWidth={1} />
    </g>
  );
}
function Solar({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g className="paisagem18__peca" data-estrutura="solar">
      {[0, 1, 2].map(k => <polygon key={k} points={pts([[x + k * 6 * s, y], [x + (k * 6 + 5.4) * s, y], [x + (k * 6 + 7) * s, y - 3 * s], [x + (k * 6 + 1.6) * s, y - 3 * s]])} fill="#2f4f7a" stroke="#b9c7d8" strokeWidth={0.4} />)}
    </g>
  );
}
function Poco({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g className="paisagem18__peca" data-estrutura="poco">
      <path d={`M${x} ${y}l${1.5 * s} ${-9 * s}M${x + 4 * s} ${y}l${-1.5 * s} ${-9 * s}M${x + 0.8 * s} ${y - 4.5 * s}h${2.4 * s}`} stroke="#7a5a38" strokeWidth={0.7} />
      <rect x={x - 0.4 * s} y={y - 12.4 * s} width={4.8 * s} height={3.6 * s} rx={0.6 * s} fill="#4f7fa3" stroke="#3a5f7a" strokeWidth={0.4} />
    </g>
  );
}

/** As máquinas paradas na frente do galpão (as que a propriedade tem). */
function Maquina({ x, y, s, tipo }: { x: number; y: number; s: number; tipo: string }) {
  const roda = (cx: number, r: number) => <g key={cx}><circle cx={cx} cy={y - r} r={r} fill="#2a2a2a" /><circle cx={cx} cy={y - r} r={r * 0.45} fill="#c9a23a" /></g>;
  if (tipo === 'colheitadeira') return (
    <g data-maquina={tipo}>
      <rect x={x + 1 * s} y={y - 7 * s} width={9 * s} height={5 * s} rx={0.6 * s} fill="#2f7a3a" stroke="#1f4f26" strokeWidth={0.4} />
      <rect x={x + 6 * s} y={y - 9.6 * s} width={3.6 * s} height={2.8 * s} fill="#9cc6d6" stroke="#1f4f26" strokeWidth={0.4} />
      <rect x={x - 3 * s} y={y - 2.6 * s} width={5 * s} height={1.8 * s} fill="#d9b03a" />
      {roda(x + 3 * s, 2.4 * s)}{roda(x + 8.8 * s, 1.6 * s)}
    </g>
  );
  if (tipo === 'caminhao') return (
    <g data-maquina={tipo}>
      <rect x={x} y={y - 6 * s} width={9 * s} height={4.6 * s} fill="#c9b07a" stroke="#6b5a3a" strokeWidth={0.4} />
      <rect x={x + 9.2 * s} y={y - 5.4 * s} width={3.6 * s} height={4 * s} rx={0.6 * s} fill="#c23b3b" stroke="#7a2020" strokeWidth={0.4} />
      <rect x={x + 10.6 * s} y={y - 5 * s} width={1.8 * s} height={1.6 * s} fill="#9cc6d6" />
      {roda(x + 2 * s, 1.2 * s)}{roda(x + 6.5 * s, 1.2 * s)}{roda(x + 11 * s, 1.2 * s)}
    </g>
  );
  if (tipo === 'pulverizador') return (
    <g data-maquina={tipo}>
      <path d={`M${x - 4 * s} ${y - 5 * s}h${16 * s}`} stroke="#6d7578" strokeWidth={0.6} />
      <rect x={x + 1 * s} y={y - 6.6 * s} width={6 * s} height={3 * s} rx={1 * s} fill="#e2e6e8" stroke="#6d7578" strokeWidth={0.4} />
      <rect x={x + 6.4 * s} y={y - 7.4 * s} width={2.6 * s} height={2.6 * s} fill="#9cc6d6" stroke="#2f7a3a" strokeWidth={0.4} />
      {roda(x + 1.6 * s, 1.6 * s)}{roda(x + 7.6 * s, 1.6 * s)}
    </g>
  );
  if (tipo === 'plantadeira') return <g data-maquina={tipo}><rect x={x} y={y - 3 * s} width={9 * s} height={1.8 * s} fill="#c23b3b" />{[1, 3, 5, 7].map(k => <path key={k} d={`M${x + k * s} ${y - 1.2 * s}v${1.2 * s}`} stroke="#3a3a3a" strokeWidth={0.6} />)}</g>;
  const micro = tipo === 'microtrator';
  return (
    <g data-maquina={tipo}>
      <rect x={x + 1 * s} y={y - (micro ? 3.4 : 4.6) * s} width={(micro ? 4 : 6) * s} height={(micro ? 1.8 : 2.4) * s} rx={0.5 * s} fill={micro ? '#c23b3b' : '#2f7a3a'} stroke="#1f2f20" strokeWidth={0.4} />
      {!micro && <rect x={x + 4.2 * s} y={y - 7.6 * s} width={2.6 * s} height={3 * s} fill="#9cc6d6" stroke="#1f4f26" strokeWidth={0.4} />}
      {roda(x + (micro ? 1.6 : 2) * s, (micro ? 1.1 : 1.3) * s)}{roda(x + (micro ? 4.6 : 6.4) * s, (micro ? 1.1 : 2) * s)}
    </g>
  );
}

function Arvore({ x, y, s = 1, cor = '#4f7f45', fruta }: { x: number; y: number; s?: number; cor?: string; fruta?: string }) {
  return (
    <g>
      <ellipse cx={x + 1.2 * s} cy={y} rx={3 * s} ry={1 * s} fill="#000" opacity={0.1} />
      <rect x={x - 0.6 * s} y={y - 3 * s} width={1.2 * s} height={3 * s} fill="#6b4a2f" />
      <circle cx={x} cy={y - 5 * s} r={3.4 * s} fill={cor} />
      <circle cx={x - 1.2 * s} cy={y - 5.8 * s} r={1.6 * s} fill="#fff" opacity={0.12} />
      {fruta && <><circle cx={x - 1.4 * s} cy={y - 4.4 * s} r={0.55 * s} fill={fruta} /><circle cx={x + 1.5 * s} cy={y - 5.6 * s} r={0.55 * s} fill={fruta} /><circle cx={x + 0.2 * s} cy={y - 3.6 * s} r={0.5 * s} fill={fruta} /></>}
    </g>
  );
}
function Pinheiro({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g><rect x={x - 0.4 * s} y={y - 1.6 * s} width={0.8 * s} height={1.6 * s} fill="#5a3d26" /><polygon points={pts([[x, y - 10 * s], [x - 3 * s, y - 1.4 * s], [x + 3 * s, y - 1.4 * s]])} fill="#3f6a4a" /><polygon points={pts([[x, y - 10 * s], [x + 3 * s, y - 1.4 * s], [x + 0.4 * s, y - 1.4 * s]])} fill="#2c5038" /></g>;
}
function Eucalipto({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g><rect x={x - 0.35 * s} y={y - 7 * s} width={0.7 * s} height={7 * s} fill="#d8cdb8" /><ellipse cx={x} cy={y - 8.6 * s} rx={1.9 * s} ry={3.4 * s} fill="#5f8f6a" /></g>;
}
function Palmeira({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g><path d={`M${x} ${y}q${0.6 * s} ${-4 * s} ${0.2 * s} ${-8 * s}`} stroke="#6b5a3a" strokeWidth={0.8 * s} fill="none" /><path d={`M${x + 0.2 * s} ${y - 8 * s}l${-3.4 * s} ${1.6 * s}M${x + 0.2 * s} ${y - 8 * s}l${3.4 * s} ${1.4 * s}M${x + 0.2 * s} ${y - 8 * s}l${-2 * s} ${-1.8 * s}M${x + 0.2 * s} ${y - 8 * s}l${2.2 * s} ${-1.6 * s}`} stroke="#3f6634" strokeWidth={0.9 * s} strokeLinecap="round" /></g>;
}
function Animal({ x, y, tipo, s = 1 }: { x: number; y: number; tipo: string; s?: number }) {
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`;
  if (tipo === 'cavalos') return <g transform={t}><rect x={0} y={-3} width={6} height={3} rx={1} fill="#7a4a2a" /><rect x={5} y={-6} width={2} height={4} fill="#7a4a2a" /><path d="M1 0 v2 M5 0 v2" stroke="#4a2c18" strokeWidth={0.7} /></g>;
  if (tipo === 'ovelhas' || tipo === 'cabras') return <g transform={t}><ellipse cx={2} cy={-1.5} rx={2.4} ry={1.6} fill={tipo === 'ovelhas' ? '#f3efe6' : '#b9a58a'} /><circle cx={4.6} cy={-2.2} r={0.9} fill="#3a3a3a" /></g>;
  if (tipo === 'porcos') return <g transform={t}><ellipse cx={2} cy={-1.4} rx={2.4} ry={1.5} fill="#e9b1a6" /></g>;
  if (tipo === 'galinhas' || tipo === 'frangos') return <g transform={t}><circle cx={0} cy={-1} r={0.9} fill="#f4f1e8" /></g>;
  const malhado = tipo === 'leite';
  return <g transform={t}><rect x={0} y={-3} width={6} height={3} rx={1} fill={malhado ? '#f4f1ea' : '#cdb79a'} /><rect x={5.3} y={-4.3} width={2} height={2.2} fill={malhado ? '#2e2e2e' : '#a88d6c'} />{malhado && <circle cx={2.5} cy={-1.8} r={1} fill="#2e2e2e" />}<path d="M1 0 v1.6 M5 0 v1.6" stroke="#555" strokeWidth={0.6} /></g>;
}

/* ---------------------------------------------------------------- a gleba de cada uso */

/** O chão de um talhão: a cor da cultura e a textura que ela tem de verdade, mais densa quanto maior a área. */
function Talhao({ g, cultura, ha, id, pivo, objetos }: { g: Gleba; cultura: CulturaId; ha: number; id: string; pivo?: boolean; objetos: Objeto[] }) {
  const [c1, c2] = COR[cultura];
  const el: ReactElement[] = [<polygon key="f" points={quad(g.u0, g.v0, g.u1, g.v1)} fill={c1} />];
  const n = Math.max(4, Math.min(16, Math.round(3 + Math.sqrt(ha) * 0.9)));
  if (pivo) {
    // O pivô central: o círculo irrigado (verde mais forte) dentro do quadrado, com a torre e o braço.
    const cu = (g.u0 + g.u1) / 2, cv = (g.v0 + g.v1) / 2, ru = (g.u1 - g.u0) * 0.46, rv = (g.v1 - g.v0) * 0.46;
    const ring = Array.from({ length: 28 }, (_, k) => { const a = (k / 28) * Math.PI * 2; return chao(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv); });
    const [mx, my] = chao(cu, cv);
    el.push(<polygon key="pv" points={pts(ring)} fill={c2} opacity={0.6} data-estrutura="pivo" />);
    for (let k = 1; k < 4; k++) el.push(<polygon key={`pr${k}`} points={pts(ring.map(([x, y]) => [mx + (x - mx) * k / 4, my + (y - my) * k / 4] as [number, number]))} fill="none" stroke={c1} strokeWidth={0.5} opacity={0.8} />);
    const [ax, ay] = chao(cu + ru * 0.95, cv - rv * 0.2);
    el.push(<path key="br" d={`M${mx} ${my}L${ax} ${ay}`} stroke="#e2e6e8" strokeWidth={0.9} />, <circle key="ct" cx={mx} cy={my} r={1} fill="#8d9598" />);
    return <g data-cultura={cultura}>{el}</g>;
  }
  if (LINHAS.includes(cultura)) {
    // As linhas de plantio correm para o fundo (convergem); o arroz tem as taipas atravessadas, a cana é mais escura e cheia.
    for (let j = 0; j < n; j++) { const uu = g.u0 + (g.u1 - g.u0) * (j + 0.5) / n; const [x0, y0] = chao(uu, g.v0 + 0.01); const [x1, y1] = chao(uu, g.v1 - 0.01); el.push(<line key={`l${j}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={c2} strokeWidth={cultura === 'cana' ? 1.6 : 1} opacity={0.75} />); }
    if (cultura === 'arroz') for (let j = 1; j < 4; j++) { const vv = g.v0 + (g.v1 - g.v0) * j / 4; el.push(<path key={`t${j}`} d={`M${chao(g.u0, vv).join(' ')}L${chao(g.u1, vv).join(' ')}`} stroke="#7fb6cf" strokeWidth={0.9} opacity={0.8} />); }
    if (cultura === 'algodao') for (let j = 0; j < n * 3; j++) { const [x, y] = chao(g.u0 + (g.u1 - g.u0) * sorte(id, `a${j}`), g.v0 + (g.v1 - g.v0) * sorte(id, `b${j}`)); el.push(<circle key={`c${j}`} cx={x} cy={y} r={0.6} fill="#f6f3ea" />); }
    return <g data-cultura={cultura}>{el}</g>;
  }
  if (cultura === 'cafe') {
    // O café em curvas de nível: as fileiras acompanham o terreno.
    const m = Math.max(4, Math.round(n * 0.7));
    for (let j = 0; j < m; j++) {
      const vv = g.v0 + (g.v1 - g.v0) * (j + 0.5) / m;
      const a = chao(g.u0 + 0.01, vv), b = chao((g.u0 + g.u1) / 2, vv - 0.025), c = chao(g.u1 - 0.01, vv);
      el.push(<path key={`r${j}`} d={`M${a.join(' ')}Q${b.join(' ')} ${c.join(' ')}`} stroke={c2} strokeWidth={1.6 * escala(vv)} strokeLinecap="round" strokeDasharray={`${(1.6 * escala(vv)).toFixed(2)} ${(0.6 * escala(vv)).toFixed(2)}`} fill="none" />);
    }
    return <g data-cultura={cultura}>{el}</g>;
  }
  if (cultura === 'horta') {
    // Os canteiros: faixas de terra com a verdura por cima.
    for (let j = 0; j < 6; j++) { const u0 = g.u0 + (g.u1 - g.u0) * (j / 6 + 0.015), u1 = g.u0 + (g.u1 - g.u0) * ((j + 1) / 6 - 0.015); el.push(<polygon key={`h${j}`} points={quad(u0, g.v0 + 0.01, u1, g.v1 - 0.01)} fill={j % 2 ? '#5fae4f' : '#7fbf5a'} opacity={0.9} />); }
    return <g data-cultura={cultura}>{el}</g>;
  }
  if (cultura === 'uva') {
    // A espaldeira: os fios atravessados (os cachos ficam pendurados neles).
    for (let j = 0; j < 5; j++) { const vv = g.v0 + (g.v1 - g.v0) * (j + 0.5) / 5; el.push(<path key={`u${j}`} d={`M${chao(g.u0, vv).join(' ')}L${chao(g.u1, vv).join(' ')}`} stroke={c2} strokeWidth={1.4 * escala(vv)} />); }
  }
  // Árvores em fileiras (pomar, cacau, açaí, floresta plantada): os pés são objetos (ficam na ordem da profundidade).
  const cols = Math.max(3, Math.min(9, Math.round(2 + Math.sqrt(ha) * 0.5))), rows = Math.max(2, Math.min(5, Math.round((g.v1 - g.v0) * 12)));
  if (ARVORES.includes(cultura) || cultura === 'eucalipto' || cultura === 'pinus' || cultura === 'uva') for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const uu = g.u0 + (g.u1 - g.u0) * (c + 0.5) / cols, vv = g.v0 + (g.v1 - g.v0) * (r + 0.7) / rows;
    const [x, y] = chao(uu, vv), s = escala(vv) * (cultura === 'uva' ? 0.5 : 0.8);
    const k = `${id}${r}-${c}`;
    objetos.push({ v: vv, el: cultura === 'pinus' ? <Pinheiro key={k} x={x} y={y} s={s} /> : cultura === 'eucalipto' ? <Eucalipto key={k} x={x} y={y} s={s * 1.1} /> : cultura === 'acai' ? <Palmeira key={k} x={x} y={y} s={s} /> : cultura === 'uva' ? <circle key={k} cx={x} cy={y - 1.2 * s} r={1.4 * s} fill={FRUTA.uva} opacity={0.8} /> : <Arvore key={k} x={x} y={y} s={s * 0.8} cor={c2} fruta={FRUTA[cultura]} /> });
  }
  return <g data-cultura={cultura}>{el}</g>;
}

/* ---------------------------------------------------------------- a composição */

interface Uso { tipo: 'talhao' | 'pasto' | 'tanques'; ha: number; cultura?: CulturaId; id: string }
const peso = (x: Uso) => Math.max(x.ha, 0.01);

/** Divide a faixa de produção em glebas, proporcionais à área: uma fileira (até três usos) ou duas. */
function repartir(usos: Uso[], area: Gleba): (Uso & { g: Gleba })[] {
  if (!usos.length) return [];
  const total = usos.reduce((s, x) => s + peso(x), 0);
  const fileiras = usos.length > 3 ? [usos.slice(0, Math.ceil(usos.length / 2)), usos.slice(Math.ceil(usos.length / 2))] : [usos];
  const corte = fileiras.length === 1 ? 1 : Math.min(0.7, Math.max(0.3, fileiras[0].reduce((s, x) => s + peso(x), 0) / total));
  const out: (Uso & { g: Gleba })[] = [];
  fileiras.forEach((fila, k) => {
    const v0 = k === 0 ? area.v0 : area.v0 + (area.v1 - area.v0) * corte;
    const v1 = fileiras.length === 1 || k === 1 ? area.v1 : area.v0 + (area.v1 - area.v0) * corte;
    const somaFila = fila.reduce((s, x) => s + peso(x), 0);
    // Nenhuma gleba fica estreita demais para ler (a pequena ganha um mínimo; as outras encolhem junto).
    const fr = fila.map(x => Math.max(0.12, peso(x) / somaFila)), somaFr = fr.reduce((s, x) => s + x, 0);
    let u = area.u0;
    fila.forEach((x, j) => { const w = (area.u1 - area.u0) * fr[j] / somaFr; out.push({ ...x, g: { u0: u, v0, u1: u + w, v1 } }); u += w; });
  });
  return out;
}

export function Paisagem18({ p, pequena, vazia }: { p?: PropriedadeRural18; pequena?: boolean; vazia?: boolean }) {
  const id = p?.id ?? 'vazia';
  const semente = hash(id);
  const tipo: TipoRural = p?.tipo ?? 'sitio';
  const q = (e: Parameters<typeof qtdEstrutura>[1]) => (p ? qtdEstrutura(p, e) : 0);
  const util = p ? Math.max(0.1, areaUtil(p)) : 1;
  const reserva = p ? Math.max(0.08, 1 - util / p.ha) : 0.25;
  const rebanho = p?.rebanhos.filter(r => r.especie !== 'tilapia' && r.especie !== 'tambaqui' && r.cabecas > 0) ?? [];
  const temSede = q('sede') > 0;
  const servico0 = (['galpao', 'silo', 'curral', 'ordenha', 'cocheiras', 'aprisco', 'pocilga', 'aviario', 'terreiro', 'viveiro', 'estufa', 'solar', 'poco'] as const).filter(e => q(e) > 0);
  // O poço sozinho (o sítio com a sede e o poço) fica no quintal da casa, não num terreiro vazio.
  const pocoNoQuintal = temSede && servico0.length === 1 && servico0[0] === 'poco' && !(p?.maquinas ?? []).length;
  const servico = pocoNoQuintal ? [] : servico0;
  const maquinas = (p?.maquinas ?? []).map(m => m.id).filter(m => m !== 'drone' && m !== 'ordenhadeira');
  const cercaBranca = tipo === 'haras';

  // As zonas (em u, v do chão): a reserva no fundo; a produção no meio; a sede e o terreiro na frente, separados pelo carreador.
  const vReserva = Math.min(0.26, Math.max(0.06, reserva * 0.5));
  const temFrente = temSede || servico.length > 0 || maquinas.length > 0;
  const temTerreiro = servico.length > 0 || maquinas.length > 0;
  const vFrente = temFrente ? 0.62 : 1;
  const uEstrada = temSede ? 0.47 : 0.18;
  // O terreiro do tamanho do que ele guarda (não um pátio vazio de ponta a ponta).
  const pesoTerreiro = servico.reduce((t, e) => t + ({ galpao: 34, silo: 18, ordenha: 36, cocheiras: 32, aviario: 44, pocilga: 40, aprisco: 18, curral: 27, terreiro: 30, viveiro: 20, estufa: 30, solar: 22, poco: 8 } as Record<string, number>)[e], 0) + maquinas.length * 14;
  const uFimTerreiro = Math.min(0.985, uEstrada + 0.16 + pesoTerreiro / 330);
  const objetos: Objeto[] = [];
  const chaoEl: ReactElement[] = [];

  // A produção: talhões, pasto e tanques em glebas.
  const usos: Uso[] = [];
  if (p) for (const t of p.talhoes) usos.push({ tipo: 'talhao', ha: t.ha, cultura: t.cultura, id: t.id });
  const tanques = q('tanques');
  if (tanques > 0) usos.push({ tipo: 'tanques', ha: tanques * 1.6, id: 'tanques' });
  const pastoHa = p ? Math.max(0, util - usos.reduce((s, x) => s + x.ha, 0)) : 1;
  if (pastoHa > util * 0.04 || !usos.length) usos.push({ tipo: 'pasto', ha: Math.max(pastoHa, 0.01), id: 'pasto' });
  const glebas = repartir(usos, { u0: 0, v0: vReserva + 0.015, u1: 1, v1: vFrente - 0.02 });
  // O maior talhão de grão vira o círculo do pivô (quando há pivô).
  const pivo = q('pivo') > 0 ? glebas.filter(x => x.tipo === 'talhao' && x.cultura && LINHAS.includes(x.cultura)).sort((a, b) => b.ha - a.ha)[0]?.id : undefined;
  for (const x of glebas) {
    const g = x.g;
    // Chamado como função (não como componente): as árvores do talhão entram em `objetos` antes da ordenação.
    if (x.tipo === 'talhao') chaoEl.push(<g key={x.id}>{Talhao({ g, cultura: x.cultura!, ha: x.ha, id: x.id, pivo: x.id === pivo, objetos })}</g>);
    else if (x.tipo === 'tanques') {
      chaoEl.push(<polygon key="tq" points={quad(g.u0, g.v0, g.u1, g.v1)} fill="#b9a77e" />);
      const n = Math.min(8, Math.max(2, tanques)), cols = Math.min(4, n), rows = Math.ceil(n / cols);
      for (let k = 0; k < n; k++) { const c = k % cols, r = Math.floor(k / cols); const du = (g.u1 - g.u0) / cols, dv = (g.v1 - g.v0) / rows; chaoEl.push(<polygon key={`tq${k}`} points={quad(g.u0 + du * c + du * 0.1, g.v0 + dv * r + dv * 0.14, g.u0 + du * (c + 1) - du * 0.1, g.v0 + dv * (r + 1) - dv * 0.14)} fill="var(--p18-agua)" stroke="var(--p18-agua-borda)" strokeWidth={0.6} data-estrutura="tanque" />); }
    } else {
      chaoEl.push(<polygon key="ps" points={quad(g.u0, g.v0, g.u1, g.v1)} fill={vazia ? 'var(--p18-terra)' : 'var(--p18-pasto)'} data-uso="pasto" />);
      // O pasto tem as árvores de sombra esparsas (poucas, sorteadas pela propriedade).
      if (!vazia) for (let k = 0; k < Math.min(5, 1 + Math.round(x.ha / 150)); k++) { const uu = g.u0 + (g.u1 - g.u0) * (0.1 + 0.8 * sorte(id, `sp${k}`)), vv = g.v0 + (g.v1 - g.v0) * (0.2 + 0.7 * sorte(id, `sv${k}`)); const [ax, ay] = chao(uu, vv); objetos.push({ v: vv, el: <Arvore key={`sp${k}`} x={ax} y={ay} s={escala(vv) * 0.8} cor="#5f8f4e" /> }); }
      // O rebanho no pasto (o que existe: a espécie e um tanto proporcional às cabeças).
      const animais = rebanho.filter(r => !['porcos', 'galinhas', 'frangos'].includes(r.especie)).flatMap(r => Array.from({ length: Math.min(14, Math.max(1, Math.round(Math.log2(r.cabecas + 1) * 1.5))) }, () => r.especie));
      animais.forEach((a, k) => { const uu = g.u0 + (g.u1 - g.u0) * (0.08 + 0.84 * sorte(id, `au${k}`)), vv = g.v0 + (g.v1 - g.v0) * (0.25 + 0.7 * sorte(id, `av${k}`)); const [ax, ay] = chao(uu, vv); objetos.push({ v: vv, el: <Animal key={`an${k}`} x={ax} y={ay} tipo={a} s={escala(vv) * 1.2} /> }); });
      // A pista de treino do haras: a oval de areia no pasto.
      if (q('pista') > 0) { const cu = (g.u0 + g.u1) / 2, cv = (g.v0 + g.v1) / 2, ru = (g.u1 - g.u0) * 0.34, rv = (g.v1 - g.v0) * 0.32; const ov = (f: number) => pts(Array.from({ length: 30 }, (_, k) => { const a = (k / 30) * Math.PI * 2; return chao(cu + Math.cos(a) * ru * f, cv + Math.sin(a) * rv * f); })); chaoEl.push(<g key="pista" data-estrutura="pista"><polygon points={ov(1)} fill="#d9c49a" stroke="#f2efe8" strokeWidth={0.8} /><polygon points={ov(0.72)} fill="var(--p18-pasto)" stroke="#f2efe8" strokeWidth={0.8} /></g>); }
    }
    chaoEl.push(<path key={`c${x.id}`} d={borda(g.u0, g.v0, g.u1, g.v1)} fill="none" stroke={cercaBranca ? '#f2efe8' : 'var(--p18-cerca)'} strokeWidth={cercaBranca ? 0.9 : 0.6} strokeDasharray={cercaBranca ? undefined : '2 1.4'} opacity={0.9} />);
  }

  // A represa: o lago na beira da mata.
  if (q('represa') > 0) {
    const cu = 0.8 + semente * 0.1, cv = vReserva + 0.02;
    chaoEl.push(<polygon key="rp" points={pts(Array.from({ length: 22 }, (_, k) => { const a = (k / 22) * Math.PI * 2; const w = 1 + 0.18 * Math.sin(a * 3 + semente * 6); return chao(cu + Math.cos(a) * 0.11 * w, cv + Math.sin(a) * 0.045 * w); }))} fill="var(--p18-agua)" stroke="var(--p18-agua-borda)" strokeWidth={0.7} data-estrutura="represa" />);
  }

  // A frente: o terreno (gramado do quintal onde há casa, chão batido no terreiro) e a cerca da frente com a porteira.
  if (temFrente) {
    chaoEl.push(<polygon key="fr" points={quad(0, vFrente, 1, 1.12)} fill={vazia ? 'var(--p18-terra)' : 'var(--p18-pasto)'} />);
    if (temTerreiro) chaoEl.push(<polygon key="tr" points={quad(uEstrada + 0.05, vFrente + 0.03, uFimTerreiro, 0.985)} fill="var(--p18-terreiro, #cdb68e)" data-zona="terreiro" />);
    if (temSede) {
      chaoEl.push(<polygon key="qt" points={quad(0.02, vFrente + 0.04, uEstrada - 0.05, 0.99)} fill="var(--p18-grama, #9cc46a)" data-zona="sede" />);
      chaoEl.push(<path key="qc" d={borda(0.02, vFrente + 0.04, uEstrada - 0.05, 0.99)} fill="none" stroke="#f4efe4" strokeWidth={0.8} opacity={0.85} />);
    }
  }
  // O carreador: da porteira (na frente) até a produção; a estrada cascalhada é mais larga e clara.
  const cascalho = q('estradas') > 0;
  const estrada = temFrente
    ? `M${chao(uEstrada, 1.12).join(' ')}L${chao(uEstrada, vFrente).join(' ')}${q('pista') > 0 ? '' : `L${chao(uEstrada + 0.02, vReserva + 0.05).join(' ')}`}M${chao(0.03, vFrente - 0.005).join(' ')}L${chao(0.97, vFrente - 0.005).join(' ')}`
    : `M${chao(0.5, 1.12).join(' ')}L${chao(0.52, vReserva + 0.05).join(' ')}`;

  // A sede: a casa no quintal, com o jardim, as árvores de sombra e o caminho até o carreador.
  if (p && temSede) {
    const vC = 0.86, [x, y] = chao(0.07, vC), s = escala(vC) * (tipo === 'chacara' || tipo === 'sitio' ? 1.3 : 1.12);
    const [cx0, cy0] = chao(uEstrada - 0.05, 0.94), [cx1, cy1] = chao(0.22, 0.88);
    chaoEl.push(<path key="cam" d={`M${cx0} ${cy0}Q${((cx0 + cx1) / 2).toFixed(1)} ${(cy0 + 1).toFixed(1)} ${cx1} ${cy1}`} stroke="#e3d8bf" strokeWidth={2.2} fill="none" strokeLinecap="round" data-zona="caminho" />);
    objetos.push({ v: vC, el: <Sede key="sede" x={x} y={y} s={s} tipo={tipo} /> });
    // O jardim: o canteiro florido na frente da varanda, a árvore de sombra ao lado e uma no fundo do quintal.
    const [jx, jy] = chao(0.07, 0.95);
    objetos.push({ v: 0.95, el: <g key="jardim" data-zona="jardim"><ellipse cx={jx + 11} cy={jy} rx={12} ry={2} fill="#5f9a48" />{[2, 7, 12, 17, 21].map((dx, k) => <circle key={dx} cx={jx + dx} cy={jy - 0.7} r={0.9} fill={['#e05a6a', '#f2c14e', '#e05a6a', '#f4efe4', '#c86ad0'][k]} />)}</g> });
    const [ax, ay] = chao(0.38, 0.8); objetos.push({ v: 0.8, el: <Arvore key="sombra" x={ax} y={ay} s={escala(0.8) * 1.5} cor="#4f7f42" fruta={tipo === 'sitio' || tipo === 'chacara' ? '#e8952a' : undefined} /> });
    if (pocoNoQuintal) { const [px, py] = chao(0.33, 0.74); objetos.push({ v: 0.74, el: <Poco key="poco" x={px} y={py} s={escala(0.74)} /> }); }
    const [bx, by] = chao(0.04, 0.7); objetos.push({ v: 0.7, el: tipo === 'chacara' || tipo === 'aquicultura' ? <Palmeira key="fundo" x={bx} y={by} s={escala(0.7) * 1.1} /> : <Arvore key="fundo" x={bx} y={by} s={escala(0.7) * 1.2} cor="#5f8f4e" /> });
  }

  // O terreiro: as construções de serviço (as primeiras atrás, as de depois na frente), as máquinas na frente do galpão.
  if (p && temTerreiro) {
    type Item = { w: number; el: (x: number, y: number, s: number) => ReactElement };
    const itens: Item[] = [];
    if (q('galpao')) itens.push({ w: q('galpao') > 1 ? 44 : 34, el: (x, y, s) => <Galpao key="galpao" x={x} y={y} s={s} n={q('galpao')} /> });
    if (q('silo')) itens.push({ w: Math.min(4, q('silo')) * 7.6 + 2, el: (x, y, s) => <g key="silos">{Array.from({ length: Math.min(4, q('silo')) }, (_, k) => <Silo key={k} x={x + k * 7.4 * s} y={y - (k % 2) * 0.8 * s} s={s} />)}</g> });
    if (q('ordenha')) itens.push({ w: 36, el: (x, y, s) => <Comprido key="ordenha" x={x} y={y} s={s} tipo="ordenha" /> });
    if (q('cocheiras')) itens.push({ w: 32, el: (x, y, s) => <Comprido key="cocheiras" x={x} y={y} s={s} tipo="cocheiras" /> });
    if (q('aviario')) itens.push({ w: 44, el: (x, y, s) => <Comprido key="aviario" x={x} y={y} s={s} tipo="aviario" /> });
    if (q('pocilga')) itens.push({ w: 40, el: (x, y, s) => <Comprido key="pocilga" x={x} y={y} s={s} tipo="pocilga" /> });
    if (q('aprisco')) itens.push({ w: 18, el: (x, y, s) => <Comprido key="aprisco" x={x} y={y} s={s} tipo="aprisco" /> });
    if (q('curral')) itens.push({ w: 27, el: (x, y, s) => <Curral key="curral" x={x} y={y} s={s} /> });
    if (q('terreiro')) itens.push({ w: 30, el: (x, y, s) => <Terreiro key="terreiro" x={x} y={y} s={s} /> });
    if (q('viveiro')) itens.push({ w: 20, el: (x, y, s) => <Viveiro key="viveiro" x={x} y={y} s={s} /> });
    if (q('estufa')) itens.push({ w: Math.min(3, q('estufa')) * 15.5 + 8, el: (x, y, s) => <g key="estufas">{Array.from({ length: Math.min(3, q('estufa')) }, (_, k) => <Estufa key={k} x={x + k * 15.4 * s} y={y} s={s} />)}</g> });
    if (q('solar')) itens.push({ w: 22, el: (x, y, s) => <Solar key="solar" x={x} y={y} s={s} /> });
    if (q('poco')) itens.push({ w: 8, el: (x, y, s) => <Poco key="poco" x={x} y={y} s={s} /> });
    // Até duas fileiras no terreiro (a de trás e a da frente), cada uma com o que cabe nela.
    const u0 = uEstrada + 0.07, u1 = uFimTerreiro - 0.005;
    const filas: [number, number][] = [[0.73, 0.98], [0.86, 0.95]];
    const cap = filas.map(([vv]) => { const [a] = chao(u0, vv), [b] = chao(u1, vv); return (b - a) / (escala(vv) * 0.9); });
    const distrib: Item[][] = [[], []];
    let soma = 0;
    for (const it of itens) { const r = soma + it.w <= cap[0] ? 0 : 1; distrib[r].push(it); if (r === 0) soma += it.w; }
    distrib.forEach((fila, r) => {
      if (!fila.length) return;
      const vv = filas[r][0], s = escala(vv) * 0.9;
      const [xIni, y] = chao(u0, vv), [xFim] = chao(u1, vv);
      const larg = fila.reduce((t, it) => t + it.w * s, 0);
      const escalaFila = larg > xFim - xIni ? (xFim - xIni) / larg : 1;
      const folga = Math.max(0, (xFim - xIni - larg * escalaFila) / (fila.length + 1));
      let x = xIni + folga;
      for (const it of fila) { objetos.push({ v: vv, el: it.el(x, y, s * escalaFila) }); x += it.w * s * escalaFila + folga; }
    });
    // As máquinas na frente do terreiro, lado a lado.
    if (maquinas.length) {
      const vv = 0.97, s = escala(vv) * 0.9; const [x0, y0] = chao(u0 + 0.01, vv);
      maquinas.slice(0, 4).forEach((m, k) => objetos.push({ v: vv, el: <Maquina key={`mq${k}`} x={x0 + k * 17 * s} y={y0} s={s} tipo={m} /> }));
    }
    // As aves ciscam no terreiro; os porcos ficam perto da granja.
    const aves = rebanho.find(r => r.especie === 'galinhas' || r.especie === 'frangos');
    if (aves) Array.from({ length: Math.min(6, 2 + Math.round(Math.log10(aves.cabecas + 1))) }, (_, k) => { const vv = 0.8 + 0.12 * sorte(id, `gv${k}`); const [ax, ay] = chao(u0 + 0.02 + 0.25 * sorte(id, `gu${k}`), vv); objetos.push({ v: vv, el: <Animal key={`gal${k}`} x={ax} y={ay} tipo="galinhas" s={escala(vv)} /> }); });
    const porcos = rebanho.find(r => r.especie === 'porcos');
    if (porcos) Array.from({ length: 3 }, (_, k) => { const vv = 0.8 + 0.03 * k; const [ax, ay] = chao(0.88 + 0.025 * k, vv); objetos.push({ v: vv, el: <Animal key={`pc${k}`} x={ax} y={ay} tipo="porcos" s={escala(vv)} /> }); });
  } else if (p && rebanho.some(r => ['galinhas', 'frangos'].includes(r.especie)) && temSede) {
    // Sem terreiro, as galinhas ciscam no quintal (o sítio pequeno).
    Array.from({ length: 3 }, (_, k) => { const vv = 0.9 + 0.02 * k; const [ax, ay] = chao(0.3 + 0.04 * k, vv); objetos.push({ v: vv, el: <Animal key={`gq${k}`} x={ax} y={ay} tipo="galinhas" s={escala(vv)} /> }); });
  }

  // A reserva: a mata do fundo (do tamanho da fração), com as copas variadas.
  const mata: ReactElement[] = Array.from({ length: 18 }, (_, k) => { const vv = vReserva * (0.25 + ((k * 7) % 5) / 6.5); const [x, y] = chao((k + 0.5) / 18 + (sorte(id, `m${k}`) - 0.5) * 0.03, vv); return <Arvore key={k} x={x} y={y} s={escala(vv) * 0.95} cor={k % 3 ? 'var(--p18-mata-escura)' : 'var(--p18-mata-clara)'} />; });

  objetos.sort((a, b) => a.v - b.v);
  const rotulo = p ? `${p.nome}: ${temSede ? 'sede com quintal e jardim' : 'sem casa-sede'}${servico.length ? `; ${servico.length} ${servico.length === 1 ? 'construção' : 'construções'} de serviço no terreiro` : ''}${p.talhoes.length ? `; ${p.talhoes.length} ${p.talhoes.length === 1 ? 'talhão' : 'talhões'} de lavoura` : '; sem lavoura'}${rebanho.length ? '; com rebanho' : ''}${maquinas.length ? `; ${maquinas.length} ${maquinas.length === 1 ? 'máquina' : 'máquinas'}` : ''}` : 'Campo aberto';
  const porteira = temFrente ? (() => {
    const a = chao(0, 1.08), b = chao(uEstrada - 0.04, 1.08), c = chao(uEstrada + 0.04, 1.08), d = chao(1, 1.08);
    const cerca = (p0: [number, number], p1: [number, number]) => { const n = Math.max(2, Math.round((p1[0] - p0[0]) / 14)); return Array.from({ length: n + 1 }, (_, k) => `M${(p0[0] + (p1[0] - p0[0]) * k / n).toFixed(1)} ${p0[1].toFixed(1)}v-3.6`).join('') + `M${p0[0].toFixed(1)} ${(p0[1] - 1.4).toFixed(1)}H${p1[0].toFixed(1)}M${p0[0].toFixed(1)} ${(p0[1] - 2.8).toFixed(1)}H${p1[0].toFixed(1)}`; };
    return <g data-zona="cerca-da-frente"><path d={cerca(a, b) + cerca(c, d)} stroke={cercaBranca ? '#f2efe8' : 'var(--p18-cerca)'} strokeWidth={0.8} /><path d={`M${b[0].toFixed(1)} ${b[1].toFixed(1)}v-5.4M${c[0].toFixed(1)} ${c[1].toFixed(1)}v-5.4M${b[0].toFixed(1)} ${(b[1] - 1.2).toFixed(1)}l${((c[0] - b[0]) * 0.5).toFixed(1)} -3M${b[0].toFixed(1)} ${(b[1] - 3.4).toFixed(1)}l${((c[0] - b[0]) * 0.5).toFixed(1)} -3`} stroke="#6b4a2f" strokeWidth={1} data-zona="porteira" /></g>;
  })() : null;
  return (
    <svg className={`paisagem18${pequena ? ' paisagem18--pequena' : ''}`} viewBox="0 0 320 180" role="img" aria-label={rotulo} preserveAspectRatio={pequena ? 'xMidYMid slice' : 'xMidYMax slice'} data-tipo={tipo}>
      <defs>
        <linearGradient id={`ceu-${pequena ? 'p' : 'g'}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--p18-ceu-alto)" /><stop offset="1" stopColor="var(--p18-ceu-baixo)" /></linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#ceu-${pequena ? 'p' : 'g'})`} />
      <circle cx={250 - semente * 60} cy="34" r="12" fill="var(--p18-sol)" opacity="0.9" />
      <path d={`M0 92 Q60 ${62 + semente * 10} 120 84 T240 ${74 + semente * 8} T320 86 V100 H0Z`} fill="var(--p18-morro-longe)" />
      <path d={`M0 98 Q80 ${80 + semente * 6} 160 94 T320 92 V104 H0Z`} fill="var(--p18-morro)" />
      <polygon points={quad(0, 0, 1, vReserva + 0.02)} fill="var(--p18-mata)" />
      {mata}
      {chaoEl}
      <path d={estrada} fill="none" stroke="var(--p18-estrada)" strokeWidth={cascalho ? 4.2 : 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} data-zona={cascalho ? 'estrada-cascalho' : 'estrada'} />
      {cascalho && <path d={estrada} fill="none" stroke="#efe6d2" strokeWidth={1} strokeDasharray="1.5 2.5" opacity={0.7} />}
      {objetos.map(o => o.el)}
      {porteira}
      {p && !p.talhoes.length && !rebanho.length && !vazia && !servico.length && <text x="160" y={(92 + ((vReserva + vFrente) / 2) * 80).toFixed(1)} textAnchor="middle" className="paisagem18__vazio">terra sem produção</text>}
    </svg>
  );
}
