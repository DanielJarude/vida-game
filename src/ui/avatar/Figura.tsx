/**
 * 12.4.1 — A FIGURA DE CORPO INTEIRO. A cabeça é o próprio `Retrato` (o mesmo rosto, cabelo, barba, óculos e chapéu,
 * só sem o busto); daqui para baixo, o corpo com as proporções da idade e do tipo de corpo (`motor/sistemas/silhueta`),
 * e por cima dele cada peça em uso — a de cima, a de baixo (ou a inteira), o casaco, os calçados, o relógio, a
 * pulseira, o anel, a corrente. Nada é sorteado: sem peça comprada, a roupa de sempre (a camiseta, a calça, o tênis).
 *
 * Linguagem: a do retrato. Formas chapadas, uma sombra (o mesmo `misturar` com preto), costuras finas, sombra no chão
 * (direção A+B do REWORK 8). Nível de detalhe por tamanho: abaixo de 110 px de largura, sem estampa miúda nem costura —
 * só silhueta e cor, que é o que se lê numa miniatura.
 */

import { memo, useId, type ReactNode } from 'react';
import type { Genero, Visual } from '../../motor/tipos';
import type { TipoDeCorpo } from '../../motor/sistemas/silhueta';
import { Retrato, contrasteEntre, corDaPele, corDoCabelo, fundoDaFigura } from './Retrato';
import { caixaDaRegiao, FundoNaPele, ladoNaTela, MapaDoCorpo, TatuagemNaPele, visivelNaVista, type ComposicaoNaFigura } from './tatuagensNaPele';
import type { TatuagemParaFigura } from '../../motor/sistemas/tatuagens';
import { REGIOES, type Lado, type LocalDeTatuagem, type RegiaoDeTatuagem } from '../../motor/dados/tatuagens';
import { misturar } from './cores';
import { acessorioDoItem, pecasDoItem, type Conjunto, type Peca } from './pecas';

type P<K extends Peca['parte']> = Extract<Peca, { parte: K }>;

export interface PecaEmUso { itemId: string; id: string }
/** HOTFIX 11.5.1 / VIDA 12.6: uma tatuagem na figura (`sistemas/tatuagens.tatuagensNaFigura`). */
export type TatuagemNaFigura = TatuagemParaFigura;

interface Props {
  visual: Visual;
  genero: Genero;
  idade: number;
  semente?: string;
  corpo: TipoDeCorpo;
  /** As peças em uso (do inventário). */
  pecas: PecaEmUso[];
  /** Largura em px (a altura é o dobro). */
  largura?: number;
  rotulo?: string;
  /** Sem fundo (para pôr sobre outra superfície). */
  semFundo?: boolean;
  /** HOTFIX 11.5.1: as tatuagens (na pele, por baixo da roupa). */
  tatuagens?: TatuagemNaFigura[];
  /** De costas (o estúdio de tatuagem mostra as costas). */
  vista?: 'frente' | 'costas';
  /** Sem a parte de cima (o estúdio mostra o tronco). */
  semCima?: boolean;
  /** VIDA 12.5: o recorte (em unidades da figura) — a lupa do estúdio de tatuagem aproxima a parte do corpo escolhida. */
  foco?: Foco;
  /** VIDA 12.5: um retângulo tracejado por cima (na figura inteira, onde a lupa está olhando). */
  destaque?: Foco;
  /** VIDA 12.6: as composições (o fundo que une as tatuagens de uma parte). */
  composicoes?: ComposicaoNaFigura[];
  /** VIDA 12.6: pés descalços (o estúdio mostra o pé e o tornozelo). */
  descalco?: boolean;
  /** VIDA 12.6: o mapa do corpo — cada região vira um botão (o estúdio escolhe onde tatuar tocando no corpo). */
  aoEscolherRegiao?: (r: RegiaoDeTatuagem, lado?: Lado) => void;
  regiaoEscolhida?: { regiao: RegiaoDeTatuagem; lado?: Lado };
}

/** VIDA 12.5: um recorte da figura (x, y, largura, altura), nas unidades do viewBox (a figura tem 120 de largura). */
export interface Foco { x: number; y: number; w: number; h: number }

/* ------------------------------------------------------------------ geometria */

interface Geo {
  cx: number; pesc: number; topo: number; ombro: number; peito: number; cintura: number; quadril: number;
  yCint: number; yQuad: number; yVirilha: number; yJoelho: number; yTorn: number; yChao: number;
  braco: number; antebraco: number; coxa: number; panturrilha: number; tornozelo: number; barriga: number; busto: number;
}

/** O corpo adulto, ajustado pelo gênero e pelo tipo de corpo. As crianças usam o mesmo corpo, em escala (abaixo). */
function geometria(genero: Genero, tipo: TipoDeCorpo, idade: number): Geo {
  const fem = genero === 'feminino', masc = genero === 'masculino';
  const g: Geo = {
    cx: 60, pesc: masc ? 6.4 : 5.4, topo: 66, ombro: masc ? 23 : fem ? 19.5 : 21, peito: masc ? 21 : fem ? 18.5 : 19.5,
    cintura: masc ? 16.5 : fem ? 13.6 : 15, quadril: masc ? 18 : fem ? 20.5 : 19, yCint: 108, yQuad: 124, yVirilha: 133,
    yJoelho: 178, yTorn: 222, yChao: 232, braco: masc ? 4.4 : 3.8, antebraco: masc ? 3.6 : 3.1, coxa: masc ? 8.6 : 9, panturrilha: masc ? 5.8 : 5.4, tornozelo: 3.2, barriga: 0, busto: fem ? 1 : 0
  };
  const ajuste: Record<TipoDeCorpo, Partial<Record<keyof Geo, number>>> = {
    magro: { ombro: -3, peito: -3.6, cintura: -3.6, quadril: -2.6, braco: -1.3, antebraco: -1, coxa: -2.8, panturrilha: -1.7, pesc: -0.6 },
    mediano: {},
    atletico: { ombro: 3, peito: 2, cintura: -1.6, braco: 1.1, antebraco: 0.6, coxa: 1, panturrilha: 0.7 },
    musculoso: { ombro: 6.6, peito: 5.2, cintura: 0.4, quadril: 0.6, braco: 3.2, antebraco: 1.9, coxa: 2.6, panturrilha: 1.5, pesc: 2 },
    acima_do_peso: { ombro: 2.6, peito: 5.4, cintura: 9, quadril: 6.6, braco: 2.6, antebraco: 1.5, coxa: 4.4, panturrilha: 2.6, barriga: 5, pesc: 1.3 }
  };
  for (const [k, d] of Object.entries(ajuste[tipo]) as [keyof Geo, number][]) g[k] += d;
  // Na velhice os ombros caem um pouco e a cintura alarga.
  if (idade >= 65) { g.ombro -= 1; g.cintura += 1.4; g.barriga += 1; }
  return g;
}

/** A escala do corpo pela idade (a cabeça fica do mesmo tamanho: a criança tem cabeça grande para o corpo). */
function escalaDaIdade(i: number): number {
  if (i <= 4) return 0.5;
  if (i <= 8) return 0.56 + (i - 5) * 0.035;
  if (i <= 12) return 0.7 + (i - 9) * 0.045;
  if (i <= 16) return 0.88 + (i - 13) * 0.03;
  return 1;
}

const lado = (g: Geo, s: 1 | -1, dx: number) => g.cx + s * dx;

/** A altura da figura inteira (o viewBox), pela idade. */
function alturaDaFigura(g: Geo, idade: number): number {
  return Math.max(150, Math.ceil(g.topo + (g.yChao + 4 - g.topo) * escalaDaIdade(idade) + 4));
}

/**
 * VIDA 12.5 — A LUPA DO ESTÚDIO: o recorte que mostra a parte do corpo escolhida com o entorno que dá a referência (o
 * peito com os ombros; o braço inteiro, do ombro ao pulso; a perna, da virilha ao tornozelo; as costas inteiras; o
 * pescoço com a cabeça). É a MESMA geometria das tatuagens (`areaDaParte`): a lupa só muda o viewBox, então a
 * anatomia, a escala e o lugar de cada desenho são os de verdade. `perto` aproxima mais (1 = a região; 2 = o dobro),
 * sempre em torno da área tatuável da parte. O recorte tem sempre a proporção 3 : 4, para a moldura não pular.
 */
/**
 * 12.7 — o recorte que mostra uma PEÇA (a vitrine e o guarda-roupa): a parte de cima, a de baixo, o corpo inteiro (o
 * vestido, o terno), os pés, o pulso e a mão, o pescoço. A mesma geometria da figura: a miniatura é a peça de verdade
 * no corpo de quem vai usar, só mais perto.
 */
export function focoDaPeca(genero: Genero, corpo: TipoDeCorpo, idade: number, lugar: string): Foco {
  const g = geometria(genero, corpo, idade);
  const H = alturaDaFigura(g, idade);
  const esc = escalaDaIdade(idade);
  const ty = (y: number) => g.topo + (y - g.topo) * esc;
  const caixa: Record<string, [number, number, number, number]> = {
    tronco: [g.cx, g.topo - 14, g.yQuad + 8, (g.ombro + 14) * 2], casaco: [g.cx, g.topo - 14, g.yQuad + 26, (g.ombro + 16) * 2],
    pernas: [g.cx, g.yCint - 6, g.yTorn + 4, (g.quadril + 14) * 2], corpo: [g.cx, g.topo - 14, g.yTorn + 6, (g.ombro + 16) * 2],
    pes: [g.cx, g.yTorn - 14, g.yChao + 6, (g.quadril + 8) * 2], pulso: [g.cx - g.ombro - 3, 112, 160, 34], pulseira: [g.cx - g.ombro - 3, 112, 160, 34],
    anel: [g.cx - g.ombro - 3, 124, 162, 30], joia: [g.cx, g.topo - 8, g.topo + 30, 54]
  };
  const r = caixa[lugar] ?? caixa.corpo;
  const cy = ty((r[1] + r[2]) / 2);
  let h = (r[2] - r[1]) * esc, w = r[3] * esc;
  const cx = g.cx + (r[0] - g.cx) * esc;
  if (w / h < 0.75) w = h * 0.75; else h = w / 0.75;
  let x = cx - w / 2, y = cy - h / 2;
  if (w <= 120) x = Math.min(Math.max(0, x), 120 - w);
  if (h <= H) y = Math.min(Math.max(0, y), H - h);
  return { x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2) };
}

export function focoDaParte(genero: Genero, corpo: TipoDeCorpo, idade: number, local: LocalDeTatuagem | 'inteiro', ladoT: Lado | undefined, vista: 'frente' | 'costas', perto = 1): Foco {
  const g = geometria(genero, corpo, idade);
  const H = alturaDaFigura(g, idade);
  // O corpo inteiro na mesma moldura 3 : 4 (a lupa não muda de tamanho ao afastar).
  if (local === 'inteiro') { const w = Math.max(120, H * 0.75); return { x: +((120 - w) / 2).toFixed(2), y: 0, w: +w.toFixed(2), h: +(w / 0.75).toFixed(2) }; }
  const s: 1 | -1 = (ladoT === 'e') !== (vista === 'costas') ? 1 : -1;
  const caixa = (cx: number, y0: number, y1: number, w: number) => ({ cx, cy: (y0 + y1) / 2, w, h: y1 - y0 });
  const r = (() => {
    switch (local) {
      case 'braco': return caixa(lado(g, s, g.ombro + 1), g.topo - 4, 150, 34);
      case 'antebraco': return caixa(lado(g, s, g.ombro + 2.4), 100, 154, 30);
      case 'ombro': return caixa(lado(g, s, g.ombro - 3), g.topo - 12, g.topo + 30, 40);
      case 'mao': return caixa(lado(g, s, g.ombro + 2.7), 128, 158, 26);
      case 'peito': return caixa(g.cx, g.topo - 10, g.topo + 34, (g.ombro + 9) * 2);
      case 'abdomen': return caixa(g.cx, g.topo + 12, g.yQuad + 6, (Math.max(g.peito, g.quadril) + 10) * 2);
      case 'costas': return caixa(g.cx, g.topo - 8, g.yQuad + 4, (g.ombro + 9) * 2);
      case 'pescoco': return caixa(g.cx, 14, g.topo + 14, 52);
      case 'coxa': return caixa(lado(g, s, g.quadril * 0.5), g.yQuad - 8, g.yJoelho + 10, 40);
      case 'panturrilha': return caixa(lado(g, s, g.quadril * 0.44), g.yJoelho - 14, g.yTorn + 10, 34);
    }
  })();
  // Os membros e o tronco vivem no corpo escalado pela idade (a partir da base do pescoço); a cabeça, não.
  const esc = escalaDaIdade(idade);
  const ty = (y: number) => local === 'pescoco' ? y : g.topo + (y - g.topo) * esc;
  const cy = ty(r.cy);
  let h = r.h * (local === 'pescoco' ? 1 : esc), w = r.w * (local === 'pescoco' ? 1 : esc);
  const cx = local === 'pescoco' ? r.cx : g.cx + (r.cx - g.cx) * esc;
  // A proporção fixa (3 : 4) e o quanto aproximar.
  if (w / h < 0.75) w = h * 0.75; else h = w / 0.75;
  const z = Math.max(1, perto);
  w /= z; h /= z;
  // Nunca olhar para fora da figura (desliza o recorte para dentro, quando cabe).
  let x = cx - w / 2, y = cy - h / 2;
  if (w <= 120) x = Math.min(Math.max(0, x), 120 - w);
  if (h <= H) y = Math.min(Math.max(0, y), H - h);
  return { x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2) };
}

/** O tronco (do pescoço ao quadril), com folga para a roupa. */
function tronco(g: Geo, folga = 0, ate = g.yQuad, alarga = 1): string {
  const o = g.ombro + folga, p = g.peito + folga, c = (g.cintura + folga) * alarga, q = (g.quadril + folga) * alarga;
  const b = g.barriga;
  const yA = g.topo + 18;
  const ombro = (s: 1 | -1) => `${lado(g, s, o)} ${g.topo + 6}`;
  return `M ${lado(g, -1, g.pesc + 1)} ${g.topo} C ${lado(g, -1, o * 0.7)} ${g.topo + 0.5} ${lado(g, -1, o)} ${g.topo + 2} ${ombro(-1)}
    L ${lado(g, -1, p)} ${yA} C ${lado(g, -1, p - 0.6)} ${g.yCint - 12} ${lado(g, -1, c + b)} ${g.yCint - 6} ${lado(g, -1, c + b * 0.6)} ${g.yCint}
    C ${lado(g, -1, c)} ${g.yCint + 6} ${lado(g, -1, q)} ${g.yQuad - 8} ${lado(g, -1, q)} ${Math.min(ate, g.yQuad)}
    L ${lado(g, -1, q)} ${ate} L ${lado(g, 1, q)} ${ate} L ${lado(g, 1, q)} ${Math.min(ate, g.yQuad)}
    C ${lado(g, 1, q)} ${g.yQuad - 8} ${lado(g, 1, c)} ${g.yCint + 6} ${lado(g, 1, c + b * 0.6)} ${g.yCint}
    C ${lado(g, 1, c + b)} ${g.yCint - 6} ${lado(g, 1, p - 0.6)} ${g.yCint - 12} ${lado(g, 1, p)} ${yA}
    L ${ombro(1)} C ${lado(g, 1, o)} ${g.topo + 2} ${lado(g, 1, o * 0.7)} ${g.topo + 0.5} ${lado(g, 1, g.pesc + 1)} ${g.topo} Z`;
}

/** Um braço (do ombro ao pulso) com folga; `ate` corta (a manga curta). */
function braco(g: Geo, s: 1 | -1, folga = 0, ate = 140): string {
  const ox = g.ombro - 1.5, ex = g.ombro + 2.2, wx = g.ombro + 2.6;
  const yE = 108, yW = 140;
  const b = g.braco + folga, a = g.antebraco + folga;
  const pts: [number, number, number][] = [[g.topo + 5, ox + b * 0.35, b], [yE, ex, b * 0.86], [yW, wx, a * 0.85]];
  const corte = Math.min(ate, yW);
  const em = (y: number): [number, number] => {
    for (let k = 1; k < pts.length; k++) {
      const [y0, x0, w0] = pts[k - 1], [y1, x1, w1] = pts[k];
      if (y <= y1) { const t = (y - y0) / (y1 - y0); return [x0 + (x1 - x0) * t, w0 + (w1 - w0) * t]; }
    }
    return [pts[2][1], pts[2][2]];
  };
  const ys = [g.topo + 5, Math.min(yE, corte), corte].filter((y, k, a) => k === 0 || y > a[k - 1]);
  const fora = ys.map(y => { const [x, w] = em(y); return `${lado(g, s, x + w)} ${y}`; });
  const dentro = ys.map(y => { const [x, w] = em(y); return `${lado(g, s, x - w)} ${y}`; }).reverse();
  return `M ${lado(g, s, g.ombro - 3)} ${g.topo + 1} Q ${lado(g, s, g.ombro + b * 0.9)} ${g.topo + 1.5} ${fora[0]} L ${fora.slice(1).join(' L ')} L ${dentro.join(' L ')} L ${lado(g, s, g.peito - 1)} ${g.topo + 18} Z`;
}

/** Uma perna (do quadril até `ate`), com largura de calça (`larga` multiplica a coxa e a barra). */
function perna(g: Geo, s: 1 | -1, folga = 0, ate = g.yTorn, larga = 1, barra?: number): string {
  const xq = g.quadril * 0.52;
  const xc = g.quadril * 0.5, xj = g.quadril * 0.44, xt = g.quadril * 0.42;
  const pts: [number, number, number][] = [[g.yQuad - 2, xq, g.quadril * 0.5 + folga], [g.yVirilha + 6, xc, (g.coxa + folga) * larga], [g.yJoelho, xj, (g.panturrilha + 0.8 + folga) * Math.max(1, larga * 0.92)], [g.yTorn, xt, barra ?? (g.tornozelo + folga) * larga]];
  const em = (y: number): [number, number] => {
    for (let k = 1; k < pts.length; k++) {
      const [y0, x0, w0] = pts[k - 1], [y1, x1, w1] = pts[k];
      if (y <= y1) { const t = (y - y0) / (y1 - y0); return [x0 + (x1 - x0) * t, w0 + (w1 - w0) * t]; }
    }
    return [pts[3][1], pts[3][2]];
  };
  const ys = [g.yQuad - 2, g.yVirilha + 6, g.yJoelho, g.yTorn].filter(y => y < ate).concat([ate]);
  const fora = ys.map(y => { const [x, w] = em(y); return `${lado(g, s, x + w)} ${y}`; });
  const dentro = ys.map(y => { const [x, w] = em(y); return `${lado(g, s, Math.max(0.4, x - w))} ${y}`; }).reverse();
  return `M ${fora.join(' L ')} L ${dentro.join(' L ')} Z`;
}

/* ------------------------------------------------------------------ peças */

function Estampa({ id, tipo, cor, cor2 }: { id: string; tipo: string; cor: string; cor2: string }) {
  const W = tipo === 'xadrez' ? 7 : tipo === 'listras' ? 4 : tipo === 'listrasV' ? 7 : tipo === 'chita' ? 14 : 9;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={W} height={W}>
      <rect width={W} height={W} fill={cor} />
      {tipo === 'listras' && <rect y={0} width={W} height={1.6} fill={cor2} />}
      {tipo === 'listrasV' && <rect x={0} width={W / 2} height={W} fill={cor2} />}
      {tipo === 'xadrez' && <><rect width={W} height={2.6} fill={cor2} opacity={0.6} /><rect width={2.6} height={W} fill={cor2} opacity={0.6} /><rect x={4.6} width={0.6} height={W} fill="#f1e6cf" opacity={0.75} /><rect y={4.6} width={W} height={0.6} fill="#f1e6cf" opacity={0.75} /></>}
      {tipo === 'floral' && <><circle cx={2.5} cy={2.5} r={1.1} fill={cor2} /><circle cx={7} cy={6.5} r={0.9} fill={misturar(cor2, '#ffffff', 0.4)} /><circle cx={2.5} cy={2.5} r={0.35} fill={cor} /></>}
      {tipo === 'chita' && <><circle cx={4} cy={4} r={2.8} fill={cor2} /><circle cx={4} cy={4} r={1.1} fill="#1d4fa3" /><circle cx={11} cy={11} r={2} fill="#f4f1ea" /><path d="M 9 4 q 2 -2 4 0" stroke="#2f7a3c" strokeWidth={0.9} fill="none" /></>}
      {tipo === 'wax' && <><circle cx={4.5} cy={4.5} r={3.2} fill={cor2} /><circle cx={4.5} cy={4.5} r={1.6} fill="#f2c200" /><path d={`M 0 ${W} L ${W / 2} ${W - 2} L ${W} ${W}`} fill="#7a2d1a" /></>}
      {tipo === 'tachas' && <circle cx={W / 2} cy={W / 2} r={0.7} fill="#d0d4d8" />}
    </pattern>
  );
}

const sombraDe = (c: string, t = 0.24) => misturar(c, '#000000', t);
/** A camisa de time listrada (vertical) ou lisa com mangas de contraste — pela cor (estável para a mesma peça). */
const camisaListrada = (cor: string) => parseInt(cor.slice(1, 3), 16) % 2 === 0;

function preenchimento(p: { cor?: unknown; estampa?: string }, idEstampa: string, detalhe: boolean): string {
  const cor = p.cor as string;
  if (p.estampa === 'time') return camisaListrada(cor) ? `url(#${idEstampa})` : cor;
  return detalhe && p.estampa && ['listras', 'xadrez', 'floral', 'chita', 'wax', 'tachas'].includes(p.estampa) ? `url(#${idEstampa})` : cor;
}

function Cima({ g, p, ide, detalhe, pele }: { g: Geo; p: P<'cima'>; ide: string; detalhe: boolean; pele: string }) {
  const cor = p.cor as string, esc = sombraDe(cor);
  const folga = 0.8 + ((p.folga ?? 1) - 1) * 18;
  const curta = p.forma === 'blusa' && (p.folga ?? 1) < 1;
  const ate = curta ? g.yCint - 2 : p.forma === 'moletom' || p.forma === 'agasalho' ? g.yQuad + 2 : p.forma === 'camisa' || p.forma === 'bata' ? g.yQuad + 4 : g.yQuad;
  const fill = preenchimento(p, ide, detalhe);
  const mangaAte = p.manga === 'curta' ? g.topo + 30 : 141;
  return (
    <g data-peca={p.forma} className="figura__cima">
      {p.manga !== 'sem' && ([-1, 1] as const).map(s => <path key={s} d={braco(g, s, 1 + (folga - 0.8) * 0.4, mangaAte)} fill={fill} stroke={esc} strokeWidth={0.5} />)}
      {p.forma === 'regata'
        ? <path d={`M ${lado(g, -1, g.pesc + 1.5)} ${g.topo} L ${lado(g, -1, g.ombro - 6)} ${g.topo + 1} Q ${lado(g, -1, g.peito - 2)} ${g.topo + 12} ${lado(g, -1, g.peito + 0.6)} ${g.topo + 20} L ${lado(g, -1, g.quadril + 0.8)} ${ate} L ${lado(g, 1, g.quadril + 0.8)} ${ate} L ${lado(g, 1, g.peito + 0.6)} ${g.topo + 20} Q ${lado(g, 1, g.peito - 2)} ${g.topo + 12} ${lado(g, 1, g.ombro - 6)} ${g.topo + 1} L ${lado(g, 1, g.pesc + 1.5)} ${g.topo} Q ${g.cx} ${g.topo + 9} ${lado(g, -1, g.pesc + 1.5)} ${g.topo} Z`} fill={fill} stroke={esc} strokeWidth={0.5} />
        : <path d={tronco(g, folga, ate, p.forma === 'bata' ? 1.06 : 1)} fill={fill} stroke={esc} strokeWidth={0.5} />}
      {/* A gola */}
      {p.gola === 'colarinho' && <path d={`M ${lado(g, -1, g.pesc + 1.6)} ${g.topo - 1.5} L ${g.cx - 1} ${g.topo + 7} L ${lado(g, -1, 1)} ${g.topo} Z M ${lado(g, 1, g.pesc + 1.6)} ${g.topo - 1.5} L ${g.cx + 1} ${g.topo + 7} L ${lado(g, 1, 1)} ${g.topo} Z`} fill={misturar(cor, '#ffffff', 0.15)} stroke={esc} strokeWidth={0.5} />}
      {p.gola === 'polo' && <path d={`M ${lado(g, -1, g.pesc + 2)} ${g.topo - 1} L ${g.cx - 1.4} ${g.topo + 5} L ${g.cx} ${g.topo + 2} L ${g.cx + 1.4} ${g.topo + 5} L ${lado(g, 1, g.pesc + 2)} ${g.topo - 1}`} fill={misturar(cor, '#ffffff', 0.1)} stroke={esc} strokeWidth={0.6} />}
      {p.gola === 'v' && <path d={`M ${lado(g, -1, g.pesc + 0.6)} ${g.topo} L ${g.cx} ${g.topo + 10} L ${lado(g, 1, g.pesc + 0.6)} ${g.topo}`} fill={pele} stroke={esc} strokeWidth={0.6} />}
      {(p.gola === 'redonda' || p.gola === 'canoa') && p.forma !== 'regata' && <path d={`M ${lado(g, -1, g.pesc + (p.gola === 'canoa' ? 4 : 0.8))} ${g.topo} Q ${g.cx} ${g.topo + (p.gola === 'canoa' ? 4 : 5.5)} ${lado(g, 1, g.pesc + (p.gola === 'canoa' ? 4 : 0.8))} ${g.topo}`} fill={pele} stroke={esc} strokeWidth={0.8} />}
      {p.gola === 'capuz' && <path d={`M ${lado(g, -1, g.pesc + 3.5)} ${g.topo + 1} Q ${g.cx} ${g.topo + 9} ${lado(g, 1, g.pesc + 3.5)} ${g.topo + 1} Q ${g.cx} ${g.topo - 4} ${lado(g, -1, g.pesc + 3.5)} ${g.topo + 1} Z`} fill={sombraDe(cor, 0.12)} stroke={esc} strokeWidth={0.6} />}
      {p.gola === 'alta' && <path d={`M ${lado(g, -1, g.pesc + 0.8)} ${g.topo - 4} L ${lado(g, -1, g.pesc + 1.2)} ${g.topo + 2} L ${lado(g, 1, g.pesc + 1.2)} ${g.topo + 2} L ${lado(g, 1, g.pesc + 0.8)} ${g.topo - 4} Z`} fill={cor} stroke={esc} strokeWidth={0.6} />}
      {/* O que distingue a peça */}
      {p.botoes && <><path d={`M ${g.cx} ${g.topo + 6} L ${g.cx} ${ate}`} stroke={esc} strokeWidth={0.6} />{detalhe && [0, 1, 2, 3, 4].map(k => <circle key={k} cx={g.cx + 0.9} cy={g.topo + 12 + k * 11} r={0.6} fill={esc} />)}</>}
      {p.gola === 'polo' && detalhe && <><circle cx={g.cx} cy={g.topo + 7} r={0.55} fill={esc} /><circle cx={g.cx} cy={g.topo + 11} r={0.55} fill={esc} /></>}
      {p.gola === 'capuz' && <path d={`M ${g.cx - 2.6} ${g.topo + 4} l -0.4 9 M ${g.cx + 2.6} ${g.topo + 4} l 0.4 9`} stroke={misturar(cor, '#ffffff', 0.55)} strokeWidth={0.7} strokeLinecap="round" />}
      {p.bolso && <path d={`M ${g.cx - 9} ${g.yQuad - 14} L ${g.cx + 9} ${g.yQuad - 14} L ${g.cx + 11} ${g.yQuad - 3} L ${g.cx - 11} ${g.yQuad - 3} Z`} fill="none" stroke={esc} strokeWidth={0.7} />}
      {(p.forma === 'moletom' || p.forma === 'sueter' || p.forma === 'agasalho') && <path d={`M ${lado(g, -1, g.quadril + folga)} ${ate - 3} L ${lado(g, 1, g.quadril + folga)} ${ate - 3}`} stroke={esc} strokeWidth={1.2} opacity={0.6} />}
      {p.forma === 'agasalho' && <><path d={`M ${g.cx} ${g.topo + 2} L ${g.cx} ${ate}`} stroke={misturar(cor, '#ffffff', 0.5)} strokeWidth={0.6} />{p.cor2 && ([-1, 1] as const).map(s => <path key={s} d={`M ${lado(g, s, g.ombro + 2.6)} ${g.topo + 6} L ${lado(g, s, g.ombro + 4.6)} 139`} stroke={p.cor2} strokeWidth={1.4} />)}</>}
      {p.estampa === 'time' && (() => {
        // HOTFIX 11.5.1 — a camisa de jogo de verdade: a gola V com friso, as mangas raglan de contraste (na lisa), os
        // punhos, o escudo bordado no peito esquerdo, a marca do fabricante no direito, o patrocínio no peito.
        const c2 = p.cor2 ?? '#f4f4f2';
        const listrada = camisaListrada(cor);
        const escudo = lado(g, 1, g.peito * 0.42);
        return <>
          {!listrada && ([-1, 1] as const).map(s => <path key={`r${s}`} d={`M ${lado(g, s, g.pesc + 2.2)} ${g.topo - 0.4} L ${lado(g, s, g.ombro + 2)} ${g.topo + 4} L ${lado(g, s, g.ombro + 4.6)} ${g.topo + 28} L ${lado(g, s, g.ombro - 1.6)} ${g.topo + 30} L ${lado(g, s, g.peito - 2.2)} ${g.topo + 15} Z`} fill={c2} opacity={0.95} />)}
          {p.manga === 'curta' && ([-1, 1] as const).map(s => { const [x, hw] = [g.ombro + 2.4, g.braco + 1.4]; return <path key={`p${s}`} d={`M ${lado(g, s, x - hw)} ${g.topo + 28.5} L ${lado(g, s, x + hw)} ${g.topo + 27} L ${lado(g, s, x + hw + 0.2)} ${g.topo + 30} L ${lado(g, s, x - hw)} ${g.topo + 31.4} Z`} fill={listrada ? cor : c2} />; })}
          <path d={`M ${lado(g, -1, g.pesc + 1.4)} ${g.topo - 0.6} L ${g.cx} ${g.topo + 10.6} L ${lado(g, 1, g.pesc + 1.4)} ${g.topo - 0.6}`} fill="none" stroke={listrada ? esc : c2} strokeWidth={1.6} strokeLinejoin="round" />
          {detalhe && <path d={`M ${g.cx - 7} ${g.topo + 23} h 14 v 4.2 h -14 Z`} fill={listrada ? '#f4f4f2' : c2} opacity={0.92} />}
          <path d={`M ${escudo - 1.8} ${g.topo + 11} h 3.6 v 3 q -1.8 2.6 -3.6 0 Z`} fill={c2} stroke={esc} strokeWidth={0.45} />
          {detalhe && <path d={`M ${escudo - 0.9} ${g.topo + 12.2} h 1.8`} stroke={esc} strokeWidth={0.5} />}
          {detalhe && <path d={`M ${lado(g, -1, g.peito * 0.48) - 1.4} ${g.topo + 13.4} q 1.6 1 3 -1.2`} fill="none" stroke={listrada ? esc : c2} strokeWidth={0.7} strokeLinecap="round" />}
        </>;
      })()}
      {p.estampa === 'banda' && detalhe && <g transform={`translate(${g.cx - 6} ${g.topo + 18})`}><circle cx={6} cy={5} r={5} fill={p.cor2} /><path d="M 3.6 4 l 1.2 0 M 7.2 4 l 1.2 0 M 4 7.4 q 2 1.4 4 0" stroke={cor} strokeWidth={0.9} strokeLinecap="round" /></g>}
      {p.estampa === 'logo' && <rect x={g.cx - 5} y={g.topo + 16} width={10} height={3} rx={0.8} fill={p.cor2} />}
    </g>
  );
}

function Baixo({ g, p, ide, detalhe, pele }: { g: Geo; p: P<'baixo'>; ide: string; detalhe: boolean; pele: string }) {
  const cor = p.cor as string, esc = sombraDe(cor);
  const fill = preenchimento(p, ide, detalhe);
  if (p.forma === 'saia') {
    const fim = p.corte === 'curta' ? g.yVirilha + 22 : p.corte === 'lapis' ? g.yJoelho + 4 : g.yJoelho + 22;
    const abre = p.corte === 'lapis' ? -1 : p.corte === 'curta' ? 7 : 9;
    return (
      <g data-peca={`saia_${p.corte}`} className="figura__baixo">
        <path d={`M ${lado(g, -1, g.cintura + 0.6)} ${g.yCint} C ${lado(g, -1, g.quadril + 1)} ${g.yQuad - 6} ${lado(g, -1, g.quadril + 1.2)} ${g.yQuad} ${lado(g, -1, g.quadril + abre)} ${fim} L ${lado(g, 1, g.quadril + abre)} ${fim} C ${lado(g, 1, g.quadril + 1.2)} ${g.yQuad} ${lado(g, 1, g.quadril + 1)} ${g.yQuad - 6} ${lado(g, 1, g.cintura + 0.6)} ${g.yCint} Z`} fill={fill} stroke={esc} strokeWidth={0.5} />
        {p.corte === 'midi' && detalhe && [-6, 0, 6].map(dx => <path key={dx} d={`M ${g.cx + dx * 0.6} ${g.yQuad + 4} L ${g.cx + dx * 1.4} ${fim - 1}`} stroke={esc} strokeWidth={0.5} opacity={0.6} />)}
        {p.corte === 'lapis' && <path d={`M ${g.cx} ${fim - 9} L ${g.cx} ${fim}`} stroke={esc} strokeWidth={0.7} />}
        <path d={`M ${lado(g, -1, g.cintura + 0.6)} ${g.yCint + 1.5} L ${lado(g, 1, g.cintura + 0.6)} ${g.yCint + 1.5}`} stroke={esc} strokeWidth={0.8} />
      </g>
    );
  }
  const ate = p.forma === 'short' ? g.yVirilha + 8 : p.forma === 'bermuda' ? g.yJoelho - 4 : p.corte === 'bombacha' ? g.yTorn - 6 : g.yTorn;
  const larga = p.corte === 'larga' ? 1.3 : p.corte === 'bombacha' ? 1.55 : p.corte === 'justa' ? 0.86 : 1.06;
  const barra = p.corte === 'bombacha' ? g.tornozelo + 0.8 : p.forma === 'legging' ? g.tornozelo + 0.1 : undefined;
  return (
    <g data-peca={`${p.forma}_${p.corte}`} className="figura__baixo">
      <path d={`M ${lado(g, -1, g.cintura + 0.8)} ${g.yCint} L ${lado(g, 1, g.cintura + 0.8)} ${g.yCint} L ${lado(g, 1, g.quadril + 1)} ${g.yQuad} L ${lado(g, -1, g.quadril + 1)} ${g.yQuad} Z`} fill={fill} />
      {([-1, 1] as const).map(s => <path key={s} d={perna(g, s, 1, ate, larga, barra)} fill={fill} stroke={esc} strokeWidth={0.5} />)}
      <path d={`M ${lado(g, -1, g.cintura + 0.8)} ${g.yCint + 2} L ${lado(g, 1, g.cintura + 0.8)} ${g.yCint + 2}`} stroke={esc} strokeWidth={1} />
      {detalhe && p.costura && <>
        {([-1, 1] as const).map(s => <path key={s} d={`M ${lado(g, s, g.cintura - 5)} ${g.yCint + 3} Q ${lado(g, s, g.cintura - 1)} ${g.yCint + 10} ${lado(g, s, g.quadril)} ${g.yCint + 9}`} fill="none" stroke={p.costura} strokeWidth={0.5} />)}
        <path d={`M ${g.cx} ${g.yCint + 3} L ${g.cx} ${g.yVirilha - 2}`} stroke={p.costura} strokeWidth={0.5} />
      </>}
      {p.vinco && ([-1, 1] as const).map(s => <path key={s} d={`M ${lado(g, s, g.quadril * 0.5)} ${g.yQuad + 2} L ${lado(g, s, g.quadril * 0.43)} ${ate - 1}`} stroke={misturar(cor, '#ffffff', 0.18)} strokeWidth={0.6} />)}
      {p.bolsos && p.corte === 'larga' && ([-1, 1] as const).map(s => <rect key={s} x={lado(g, s, g.quadril * 0.5 + g.coxa * 1.1) - (s > 0 ? 6 : 0)} y={g.yVirilha + 14} width={6} height={9} rx={0.8} fill={sombraDe(cor, 0.1)} stroke={esc} strokeWidth={0.5} />)}
      {p.listra && ([-1, 1] as const).map(s => <path key={s} d={`M ${lado(g, s, g.quadril + 0.6)} ${g.yQuad} L ${lado(g, s, g.quadril * 0.42 + (g.tornozelo + 1) * larga)} ${ate - 1}`} stroke={p.listra} strokeWidth={1.2} />)}
      {p.forma === 'short' && detalhe && ([-1, 1] as const).map(s => <path key={s} d={`M ${lado(g, s, g.quadril * 0.5 - g.coxa)} ${ate} l 1 1.4 l 1 -1.4 l 1 1.4 l 1 -1.4`} stroke={misturar(cor, '#ffffff', 0.5)} strokeWidth={0.5} fill="none" />)}
      {pele && null}
    </g>
  );
}

function Inteira({ g, p, ide, detalhe, pele }: { g: Geo; p: P<'inteira'>; ide: string; detalhe: boolean; pele: string }) {
  const cor = p.cor as string, esc = sombraDe(cor);
  const fill = preenchimento(p, ide, detalhe);
  if (p.forma === 'terno') {
    return (
      <g data-peca="terno" className="figura__inteira">
        <Baixo g={g} p={{ parte: 'baixo', forma: 'calca', corte: 'reta', cor, vinco: true }} ide={ide} detalhe={detalhe} pele={pele} />
        <Cima g={g} p={{ parte: 'cima', forma: 'camisa', cor: p.cor2 ?? '#f4f6f8', manga: 'longa', gola: 'colarinho' }} ide={ide} detalhe={detalhe} pele={pele} />
        <Casaco g={g} p={{ parte: 'casaco', forma: 'blazer', comprimento: 'quadril', cor, lapela: true }} detalhe={detalhe} gravata />
      </g>
    );
  }
  if (p.forma === 'macacao') {
    return (
      <g data-peca="macacao" className="figura__inteira">
        {([-1, 1] as const).map(s => <path key={s} d={perna(g, s, 1.2, g.yTorn, 1.15)} fill={fill} stroke={esc} strokeWidth={0.5} />)}
        <path d={`M ${lado(g, -1, g.peito - 2)} ${g.topo + 14} L ${lado(g, 1, g.peito - 2)} ${g.topo + 14} L ${lado(g, 1, g.cintura + 1.2)} ${g.yCint} L ${lado(g, 1, g.quadril + 1.2)} ${g.yQuad + 2} L ${lado(g, -1, g.quadril + 1.2)} ${g.yQuad + 2} L ${lado(g, -1, g.cintura + 1.2)} ${g.yCint} Z`} fill={fill} stroke={esc} strokeWidth={0.5} />
        {([-1, 1] as const).map(s => <path key={`a${s}`} d={`M ${lado(g, s, g.peito - 4)} ${g.topo + 15} L ${lado(g, s, g.pesc + 4)} ${g.topo + 1}`} stroke={fill} strokeWidth={2.6} strokeLinecap="round" />)}
        <rect x={g.cx - 5} y={g.topo + 19} width={10} height={8} rx={1} fill="none" stroke={esc} strokeWidth={0.6} />
      </g>
    );
  }
  const fim = p.comprimento === 'curto' ? g.yVirilha + 18 : p.comprimento === 'joelho' ? g.yJoelho + 2 : p.comprimento === 'midi' ? g.yJoelho + 24 : g.yTorn + 6;
  const abre = p.comprimento === 'longo' ? 11 : 9;
  return (
    <g data-peca={`vestido_${p.comprimento}`} className="figura__inteira">
      {p.manga !== 'sem' && ([-1, 1] as const).map(s => <path key={s} d={braco(g, s, 1.2, p.manga === 'curta' ? g.topo + 26 : 141)} fill={fill} stroke={esc} strokeWidth={0.5} />)}
      <path d={`${tronco(g, 0.7, g.yCint + 2)}`} fill={fill} stroke={esc} strokeWidth={0.5} />
      {p.manga === 'sem' && <path d={`M ${lado(g, -1, g.pesc + 1)} ${g.topo} L ${lado(g, -1, g.ombro + 0.5)} ${g.topo + 4} L ${lado(g, -1, g.peito - 2.5)} ${g.topo + 14} M ${lado(g, 1, g.pesc + 1)} ${g.topo} L ${lado(g, 1, g.ombro + 0.5)} ${g.topo + 4} L ${lado(g, 1, g.peito - 2.5)} ${g.topo + 14}`} stroke={pele} strokeWidth={3.4} strokeLinecap="round" fill="none" />}
      <path d={`M ${lado(g, -1, g.cintura + 0.7)} ${g.yCint} C ${lado(g, -1, g.quadril + 2)} ${g.yQuad - 4} ${lado(g, -1, g.quadril + 3)} ${g.yQuad + 6} ${lado(g, -1, g.quadril + abre)} ${fim} Q ${g.cx} ${fim + 2.5} ${lado(g, 1, g.quadril + abre)} ${fim} C ${lado(g, 1, g.quadril + 3)} ${g.yQuad + 6} ${lado(g, 1, g.quadril + 2)} ${g.yQuad - 4} ${lado(g, 1, g.cintura + 0.7)} ${g.yCint} Z`} fill={fill} stroke={esc} strokeWidth={0.5} />
      {p.gola === 'v' && <path d={`M ${lado(g, -1, g.pesc + 0.6)} ${g.topo} L ${g.cx} ${g.topo + 12} L ${lado(g, 1, g.pesc + 0.6)} ${g.topo}`} fill={pele} />}
      {(p.gola === 'redonda' || p.gola === 'canoa') && <path d={`M ${lado(g, -1, g.pesc + (p.gola === 'canoa' ? 5 : 1))} ${g.topo} Q ${g.cx} ${g.topo + 5} ${lado(g, 1, g.pesc + (p.gola === 'canoa' ? 5 : 1))} ${g.topo}`} fill={pele} />}
      {p.cinto && <rect x={lado(g, -1, g.cintura + 0.8)} y={g.yCint - 1.4} width={(g.cintura + 0.8) * 2} height={2.4} fill={p.cinto} />}
      {detalhe && p.comprimento !== 'curto' && [-1, 1].map(s => <path key={s} d={`M ${g.cx + s * 3} ${g.yQuad + 4} L ${g.cx + s * 8} ${fim - 2}`} stroke={esc} strokeWidth={0.5} opacity={0.5} />)}
    </g>
  );
}

function Casaco({ g, p, detalhe, gravata }: { g: Geo; p: P<'casaco'>; detalhe: boolean; gravata?: boolean }) {
  const cor = p.cor as string, esc = sombraDe(cor, 0.3);
  const fim = p.comprimento === 'cintura' ? g.yCint + 8 : p.comprimento === 'quadril' ? g.yQuad + 8 : g.yJoelho + 6;
  const lado_ = (s: 1 | -1) => {
    const o = g.ombro + 1.8, q = g.quadril + 2.4 + (p.comprimento === 'joelho' ? 4 : 0);
    const abre = p.forma === 'jaqueta' || p.forma === 'corta_vento' ? 2.2 : 3.4;
    return `M ${lado(g, s, g.pesc + 1.4)} ${g.topo - 1} C ${lado(g, s, o * 0.7)} ${g.topo - 0.5} ${lado(g, s, o)} ${g.topo + 1.5} ${lado(g, s, o)} ${g.topo + 6}
      L ${lado(g, s, g.peito + 1.8)} ${g.topo + 18} C ${lado(g, s, g.peito + 1.4)} ${g.yCint - 10} ${lado(g, s, g.cintura + g.barriga + 2)} ${g.yCint - 4} ${lado(g, s, g.cintura + g.barriga * 0.6 + 2)} ${g.yCint}
      C ${lado(g, s, g.cintura + 2.2)} ${g.yCint + 6} ${lado(g, s, q)} ${Math.min(fim, g.yQuad) - 6} ${lado(g, s, q)} ${fim}
      L ${lado(g, s, abre * 0.4)} ${fim} L ${lado(g, s, abre)} ${g.topo + 22} L ${lado(g, s, g.pesc - 0.6)} ${g.topo + 3} Z`;
  };
  const claro = misturar(cor, '#ffffff', 0.4);
  return (
    <g data-peca={p.forma} className="figura__casaco">
      {([-1, 1] as const).map(s => <path key={`m${s}`} d={braco(g, s, 1.9, 142)} fill={cor} stroke={esc} strokeWidth={0.5} />)}
      {gravata && <path d={`M ${g.cx - 1.6} ${g.topo + 6} L ${g.cx + 1.6} ${g.topo + 6} L ${g.cx + 2.2} ${g.topo + 30} L ${g.cx} ${g.topo + 33} L ${g.cx - 2.2} ${g.topo + 30} Z`} fill="#7b2d3a" />}
      {([-1, 1] as const).map(s => <path key={s} d={lado_(s)} fill={cor} stroke={esc} strokeWidth={0.5} />)}
      {p.lapela && ([-1, 1] as const).map(s => <path key={`l${s}`} d={`M ${lado(g, s, g.pesc - 0.4)} ${g.topo + 3} L ${lado(g, s, g.pesc + 5.5)} ${g.topo + 10} L ${lado(g, s, g.pesc + 2.2)} ${g.topo + 13} L ${lado(g, s, 3.6)} ${g.topo + 22}`} fill="none" stroke={esc} strokeWidth={0.8} strokeLinejoin="round" />)}
      {p.gola === 'alta' && <path d={`M ${lado(g, -1, g.pesc + 1.6)} ${g.topo - 4} L ${lado(g, -1, g.pesc + 2)} ${g.topo + 3} L ${lado(g, 1, g.pesc + 2)} ${g.topo + 3} L ${lado(g, 1, g.pesc + 1.6)} ${g.topo - 4} Z`} fill={cor} stroke={esc} strokeWidth={0.5} />}
      {p.gola === 'camisa' && ([-1, 1] as const).map(s => <path key={`g${s}`} d={`M ${lado(g, s, g.pesc + 1.2)} ${g.topo - 1.5} L ${lado(g, s, g.pesc + 6.5)} ${g.topo + 4} L ${lado(g, s, 2.6)} ${g.topo + 9} Z`} fill={misturar(cor, '#ffffff', 0.1)} stroke={esc} strokeWidth={0.5} />)}
      {p.ziper && ([-1, 1] as const).map(s => <path key={`z${s}`} d={`M ${lado(g, s, 2.4)} ${g.topo + 22} L ${lado(g, s, 1)} ${fim}`} stroke={claro} strokeWidth={0.7} />)}
      {p.forma === 'jaqueta_jeans' && detalhe && ([-1, 1] as const).map(s => <path key={`b${s}`} d={`M ${lado(g, s, 6)} ${g.topo + 17} l ${s * 8} 0 l 0 6 l ${-s * 8} 0 Z`} fill="none" stroke="#c99a4a" strokeWidth={0.6} />)}
      {p.forma === 'corta_vento' && p.cor2 && ([-1, 1] as const).map(s => <path key={`f${s}`} d={`M ${lado(g, s, g.ombro + 1.8)} ${g.topo + 10} L ${lado(g, s, g.peito + 1.8)} ${g.topo + 24}`} stroke={p.cor2} strokeWidth={2.2} />)}
      {(p.forma === 'blazer' || p.forma === 'sobretudo' || p.forma === 'casaco') && detalhe && <><circle cx={g.cx - 2.6} cy={g.yCint + 1} r={0.8} fill={esc} />{p.comprimento === 'joelho' && <circle cx={g.cx - 2.6} cy={g.yCint + 14} r={0.8} fill={esc} />}</>}
      {p.forma === 'jaqueta' && detalhe && <path d={`M ${lado(g, -1, g.cintura + 2.2)} ${fim - 3} L ${lado(g, 1, g.cintura + 2.2)} ${fim - 3}`} stroke={claro} strokeWidth={0.6} opacity={0.6} />}
    </g>
  );
}

/** VIDA 12.6: o pé descalço (o estúdio de tatuagem), de cima: o peito do pé, os dedos para fora. */
function peDescalco(g: Geo, s: 1 | -1): string {
  const x = lado(g, s, g.quadril * 0.42), y = g.yTorn - 1, ch = g.yChao;
  return `M ${x - s * 3.2} ${y} L ${x + s * 3.2} ${y} Q ${x + s * 4.4} ${ch - 4} ${x + s * 7.4} ${ch - 2.2} Q ${x + s * 8.4} ${ch - 0.4} ${x + s * 6} ${ch} L ${x - s * 3} ${ch} Q ${x - s * 4} ${ch - 3} ${x - s * 3.2} ${y} Z`;
}

function Pes({ g, p, pele, detalhe }: { g: Geo; p: P<'pes'>; pele: string; detalhe: boolean }) {
  const cor = p.cor as string, esc = sombraDe(cor, 0.35);
  return (
    <g data-peca={p.forma} className="figura__pes">
      {([-1, 1] as const).map(s => {
        const x = lado(g, s, g.quadril * 0.42), y = g.yTorn, ch = g.yChao;
        const bico = s * 6.5; // o pé aponta um pouco para fora
        const cano = p.forma === 'coturno' ? 16 : p.forma === 'botina' ? 9 : p.forma === 'tenis_cano' ? 8 : 0;
        const alto = p.forma === 'salto';
        const sola = p.forma === 'tenis_corrida' ? 3 : p.forma === 'tenis' || p.forma === 'tenis_cano' || p.forma === 'tenis_lona' ? 2.2 : p.forma === 'coturno' || p.forma === 'botina' ? 2.4 : 1.2;
        const larg = p.forma === 'coturno' || p.forma === 'botina' ? 4.6 : 4;
        const corpo = `M ${x - s * larg} ${y - cano} L ${x + s * larg} ${y - cano} L ${x + s * (larg + 0.4)} ${ch - sola - 3} Q ${x + bico + s * 1.6} ${ch - sola - 3.4} ${x + bico + s * 2} ${ch - sola} L ${x - s * (larg + 0.6)} ${ch - sola} Z`;
        if (p.forma === 'chinelo' || p.forma === 'sandalia') {
          return (
            <g key={s}>
              <path d={`M ${x - s * 3.6} ${y - 1} L ${x + s * 3.6} ${y - 1} L ${x + s * 4} ${ch - 4} Q ${x + bico + s * 1.4} ${ch - 4.4} ${x + bico + s * 1.8} ${ch - 1.6} L ${x - s * 4.2} ${ch - 1.6} Z`} fill={pele} />
              <path d={`M ${x - s * 4.6} ${ch - 1.6} L ${x + bico + s * 2.2} ${ch - 1.6} L ${x + bico + s * 2.2} ${ch} L ${x - s * 4.6} ${ch} Z`} fill={p.sola} />
              {p.forma === 'chinelo'
                ? <path d={`M ${x - s * 3.4} ${ch - 5.2} L ${x + s * 4.6} ${ch - 5.6} L ${x + s * 5} ${ch - 2} L ${x - s * 3.6} ${ch - 2} Z`} fill={cor} />
                : <path d={`M ${x - s * 3.4} ${ch - 3} L ${x + bico} ${ch - 3.4} M ${x - s * 3.2} ${y + 3} L ${x + s * 3.6} ${y + 3}`} stroke={cor} strokeWidth={1.2} />}
            </g>
          );
        }
        return (
          <g key={s}>
            {alto && <path d={`M ${x - s * 3.4} ${y - 1} L ${x + s * 3.4} ${y - 1} L ${x + s * 4} ${ch - 6} L ${x - s * 3.6} ${ch - 6} Z`} fill={pele} />}
            <path d={alto ? `M ${x - s * 4} ${ch - 7} Q ${x + s * 1} ${ch - 7.6} ${x + bico + s * 2} ${ch - 1} L ${x - s * 2.6} ${ch - 1} L ${x - s * 3.4} ${ch} L ${x - s * 4.4} ${ch} L ${x - s * 4.4} ${ch - 6.4} Z` : corpo} fill={cor} stroke={esc} strokeWidth={0.5} />
            {!alto && <path d={`M ${x - s * (larg + 0.8)} ${ch - sola} L ${x + bico + s * 2.4} ${ch - sola} Q ${x + bico + s * 2.8} ${ch} ${x + bico + s * 1.6} ${ch} L ${x - s * (larg + 0.8)} ${ch} Z`} fill={p.sola} stroke={sombraDe(p.sola, 0.2)} strokeWidth={0.3} />}
            {detalhe && (p.forma === 'tenis' || p.forma === 'tenis_corrida' || p.forma === 'tenis_cano' || p.forma === 'tenis_lona' || p.forma === 'coturno') && [0, 1, 2].map(k => <path key={k} d={`M ${x - s * 2} ${ch - sola - 4.4 - k * 2.2} l ${s * 3.4} 0`} stroke={p.forma === 'coturno' ? (p.detalhe ?? '#c9c3b6') : misturar(cor, '#ffffff', 0.55)} strokeWidth={0.5} />)}
            {p.detalhe && (p.forma === 'tenis_corrida' || p.forma === 'tenis_cano') && <path d={`M ${x - s * 3} ${ch - sola - 2} Q ${x + s * 2} ${ch - sola - 5} ${x + bico} ${ch - sola - 1.6}`} stroke={p.detalhe} strokeWidth={1.1} fill="none" />}
            {p.forma === 'tenis_lona' && <path d={`M ${x + bico - s * 1.6} ${ch - sola - 2.8} q ${s * 2} 0 ${s * 3} ${2.6}`} stroke={p.sola} strokeWidth={1.4} fill="none" />}
            {p.forma === 'mocassim' && <path d={`M ${x} ${ch - sola - 3.2} q ${s * 3} -1 ${s * 5} 0`} stroke={esc} strokeWidth={0.6} fill="none" />}
            {p.forma === 'sapato' && detalhe && <path d={`M ${x + s * 1.6} ${ch - sola - 3.6} q ${s * 2} 1.2 ${s * 4.6} 0.4`} stroke={misturar(cor, '#ffffff', 0.4)} strokeWidth={0.4} fill="none" />}
            {p.forma === 'sapatilha' && <circle cx={x + s * 3.6} cy={ch - 3.4} r={0.9} fill={misturar(cor, '#ffffff', 0.3)} />}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ as tatuagens */

/**
 * VIDA 12.6 — a lupa por REGIÃO: o recorte em volta da caixa da região (a mesma de `tatuagensNaPele.caixaDaRegiao`),
 * com folga para o entorno dar a referência; `perto` aproxima. A proporção é a da lupa (3 : 4).
 */
export function focoDaRegiao(genero: Genero, corpo: TipoDeCorpo, idade: number, regiao: RegiaoDeTatuagem, ladoT: Lado | undefined, vista: 'frente' | 'costas', perto = 1): Foco {
  const g = geometria(genero, corpo, idade);
  const H = alturaDaFigura(g, idade);
  const s = REGIOES[regiao].lados ? ladoNaTela(ladoT, vista === 'costas') : 1;
  const k = caixaDaRegiao(g, regiao, s);
  const esc = escalaDaIdade(idade);
  const naCabeca = regiao === 'pescoco' || regiao === 'nuca';
  const ty = (y: number) => (naCabeca ? y : g.topo + (y - g.topo) * esc);
  const cx = naCabeca ? k.x : g.cx + (k.x - g.cx) * esc, cy = ty(k.y);
  let w = Math.max(26, k.w * 2.6) * (naCabeca ? 1 : esc), h = Math.max(30, k.h * 1.9) * (naCabeca ? 1 : esc);
  if (w / h < 0.75) w = h * 0.75; else h = w / 0.75;
  const z = Math.max(1, perto);
  w /= z; h /= z;
  let x = cx - w / 2, y = cy - h / 2;
  if (w <= 120) x = Math.min(Math.max(0, x), 120 - w);
  if (h <= H) y = Math.min(Math.max(0, y), H - h);
  return { x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2) };
}

/** As tatuagens de uma vista: o fundo das composições por baixo; cada desenho com o seu respiro de pele por cima do fundo. */
function Tatuagens({ g, lista, comps, pele, ide, costas, detalhe, idade }: { g: Geo; lista: TatuagemNaFigura[]; comps: ComposicaoNaFigura[]; pele: string; ide: (k: string) => string; costas: boolean; detalhe: boolean; idade: number }) {
  const vis = lista.filter(t => visivelNaVista(t.regiao, costas));
  const comFundo = new Set(comps.filter(c => c.fundo !== 'nenhum').map(c => c.id));
  return (
    <g className="figura__tatuagens">
      {comps.map(c => <FundoNaPele key={c.id} g={g} c={c} pele={pele} ide={ide} costas={costas} idade={idade} />)}
      {vis.map(t => <TatuagemNaPele key={t.id} g={g} t={t} pele={pele} ide={ide} costas={costas} detalhe={detalhe} halo={!!t.conjunto && comFundo.has(t.conjunto)} />)}
    </g>
  );
}
const NA_MAO = new Set<RegiaoDeTatuagem>(['mao', 'dedos']);

/* ------------------------------------------------------------------ a figura */

const PADRAO_CIMA = ['#4b5a6b', '#6b4f5a', '#4f6b5a', '#7a6248', '#5a5470', '#3f5f66', '#735a4a', '#556048'];

export const Figura = memo(function Figura({ visual, genero, idade, semente = 'eu', corpo, pecas, largura = 160, rotulo, semFundo, tatuagens = [], vista = 'frente', semCima, foco, destaque, composicoes = [], descalco, aoEscolherRegiao, regiaoEscolhida }: Props) {
  const uid = useId().replace(/:/g, '');
  const g = geometria(genero, corpo, idade);
  const esc = escalaDaIdade(idade);
  const [pele, sombraPele] = corDaPele(visual.pele);
  const detalhe = largura >= 110;
  // As peças em uso, cada uma no seu lugar (a última que chegou, se houver duas).
  const conj: Conjunto = {};
  const acess: Record<string, ReturnType<typeof acessorioDoItem>> = {};
  for (const x of pecas) {
    const c = pecasDoItem(x.itemId, x.id);
    for (const k of ['cima', 'baixo', 'inteira', 'casaco', 'pes'] as const) if (c[k]) conj[k] = c[k];
    if (c.inteira) { delete conj.cima; delete conj.baixo; }
    if ((c.cima || c.baixo) && !c.inteira) delete conj.inteira;
    const a = acessorioDoItem(x.itemId);
    if (a) acess[a.parte] = a;
  }
  // Sem nada comprado: a roupa de sempre (a camiseta numa cor da semente, a calça, o tênis — a criança, bermuda).
  let h = 0;
  for (let k = 0; k < semente.length; k++) h = (h * 31 + semente.charCodeAt(k)) >>> 0;
  if (!conj.inteira && !conj.cima) conj.cima = { parte: 'cima', forma: 'camiseta', cor: PADRAO_CIMA[h % PADRAO_CIMA.length], manga: 'curta', gola: 'redonda' };
  if (!conj.inteira && !conj.baixo) conj.baixo = idade < 12 ? { parte: 'baixo', forma: 'bermuda', corte: 'reta', cor: ['#3d5a80', '#5d6b4f', '#7a6248'][h % 3] } : { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#3d5a80', '#2b2f36', '#5b6470'][h % 3], bolsos: true, costura: h % 3 === 0 ? '#c99a4a' : undefined };
  if (!conj.pes) conj.pes = { parte: 'pes', forma: idade >= 70 ? 'sapato' : 'tenis', cor: idade >= 70 ? '#3a2a20' : ['#f4f4f2', '#2b2f36', '#7d8590'][h % 3], sola: idade >= 70 ? '#1b1515' : '#f4f4f2' };
  // O estúdio de tatuagem mostra o tronco: sem a parte de cima (o vestido vira a parte de baixo de sempre).
  // VIDA 12.5: e um short curto (na cor da peça de baixo), para a coxa e a panturrilha aparecerem na prévia.
  if (semCima) {
    const corDeBaixo = conj.inteira ? '#3d5a80' : ((conj.baixo as { cor?: string } | undefined)?.cor ?? '#3d5a80');
    delete conj.inteira; delete conj.cima; delete conj.casaco;
    conj.baixo = { parte: 'baixo', forma: 'short', corte: 'curta', cor: corDeBaixo };
  }

  // HOTFIX 11.5.1 — contraste: o fundo pesa a pele (a pele clara nunca sobre o fundo claro); sem fundo, um halo de
  // estúdio atrás do corpo, claro para a pele escura e escuro para a clara; e o contorno de cada parte de pele (o braço
  // se separa do tronco; a perna, da outra).
  const fundo = semFundo ? undefined : fundoDaFigura(corDoCabelo(visual.corCabelo), pele, h);
  const halo = semFundo ? (contrasteEntre(pele, '#f4efe6') < 1.9 ? '#6f7c88' : '#e7dfd2') : undefined;
  const contorno = misturar(sombraPele, '#2a1810', contrasteEntre(pele, '#ffffff') < 1.6 ? 0.55 : 0.4);
  const costas = vista === 'costas';
  const estampas: ReactNode[] = [];
  const ide = (k: string) => `${uid}-${k}`;
  for (const k of ['cima', 'baixo', 'inteira'] as const) {
    const p = conj[k] as { estampa?: string; cor?: string; cor2?: string } | undefined;
    if (p?.estampa === 'time') { if (camisaListrada(p.cor as string)) estampas.push(<Estampa key={k} id={ide(k)} tipo="listrasV" cor={p.cor as string} cor2={p.cor2 ?? '#f4f1ea'} />); continue; }
    if (p?.estampa && detalhe) estampas.push(<Estampa key={k} id={ide(k)} tipo={p.estampa} cor={p.cor as string} cor2={p.cor2 ?? '#f4f1ea'} />);
  }
  const relogio = acess.pulso as P<'pulso'> | undefined, pulseira = acess.pulseira as P<'pulseira'> | undefined, anel = acess.anel as P<'anel'> | undefined, colar = acess.pescoco as P<'pescoco'> | undefined;
  // O pulso esquerdo da pessoa fica à direita de quem olha.
  const pulso = (s: 1 | -1) => ({ x: lado(g, s, g.ombro + 2.6), y: 137 });
  // A escala pela idade, a partir da base do pescoço (a cabeça não encolhe).
  const corpoT = esc === 1 ? undefined : `translate(${g.cx} ${g.topo}) scale(${esc}) translate(${-g.cx} ${-g.topo})`;
  const altura = (g.topo + (g.yChao + 4 - g.topo) * esc);
  const pecasRotulo = [conj.inteira, conj.cima, conj.baixo, conj.casaco, conj.pes].filter(Boolean).map(p => ('forma' in p! ? p!.forma : '')).join(', ');
  return (
    <svg className="figura" viewBox={foco ? `${foco.x} ${foco.y} ${foco.w} ${foco.h}` : `0 0 120 ${Math.max(150, Math.ceil(altura + 4))}`} width={largura} height={Math.round(largura * (foco ? foco.h / foco.w : Math.max(150, Math.ceil(altura + 4)) / 120))}
      role="img" aria-label={rotulo ?? 'Corpo inteiro'} data-corpo={corpo} data-pecas={pecasRotulo} data-vista={vista} data-foco={foco ? 'sim' : undefined} data-tatuagens={tatuagens.length || undefined} style={fundo ? { background: fundo } : undefined}>
      <defs>
        {estampas}
        {(tatuagens.length > 0 || descalco) && <>
          {([-1, 1] as const).map(s => <clipPath key={`cb${s}`} id={ide(`cb${s}`)}><path d={braco(g, s, 0, 141)} /></clipPath>)}
          {([-1, 1] as const).map(s => <clipPath key={`cp${s}`} id={ide(`cp${s}`)}><path d={perna(g, s, 0, g.yTorn + 2)} /></clipPath>)}
          {([-1, 1] as const).map(s => <clipPath key={`cm${s}`} id={ide(`cm${s}`)}><ellipse cx={lado(g, s, g.ombro + 2.7)} cy={145.5} rx={g.antebraco * 0.95} ry={5.2} /></clipPath>)}
          <clipPath id={ide('ct')}><path d={tronco(g, 0, g.yQuad)} /></clipPath>
          <clipPath id={ide('cn')}><rect x={g.cx - g.pesc} y={g.topo - 12} width={g.pesc * 2} height={14} /></clipPath>
          {([-1, 1] as const).map(s => <clipPath key={`cpe${s}`} id={ide(`cpe${s}`)}><path d={peDescalco(g, s)} /></clipPath>)}
        </>}
      </defs>
      {halo && <ellipse cx={g.cx} cy={(g.topo + altura) / 2 - 18} rx={36} ry={(altura - g.topo) / 2 + 30} fill={halo} opacity={0.42} />}
      {/* A sombra no chão (direção A+B). */}
      <ellipse cx={g.cx} cy={altura - 1} rx={20 * Math.max(0.6, esc)} ry={3} fill="#000000" opacity={0.16} />
      <g transform={corpoT}>
        {/* O corpo (a pele aparece onde a roupa não cobre), com o contorno de cada parte. */}
        <path d={`M ${g.cx - g.pesc} ${g.topo - 12} L ${g.cx - g.pesc} ${g.topo + 2} L ${g.cx + g.pesc} ${g.topo + 2} L ${g.cx + g.pesc} ${g.topo - 12} Z`} fill={sombraPele} stroke={contorno} strokeWidth={0.6} />
        {([-1, 1] as const).map(s => <path key={`b${s}`} d={braco(g, s, 0, 141)} fill={pele} stroke={contorno} strokeWidth={0.7} strokeLinejoin="round" />)}
        {([-1, 1] as const).map(s => <ellipse key={`m${s}`} cx={lado(g, s, g.ombro + 2.7)} cy={145.5} rx={g.antebraco * 0.95} ry={5.2} fill={pele} stroke={contorno} strokeWidth={0.6} />)}
        <path d={tronco(g, 0, g.yQuad)} fill={pele} stroke={contorno} strokeWidth={0.7} strokeLinejoin="round" />
        {/* A sombra da axila e do lado do tronco: o braço não se funde ao corpo. */}
        {([-1, 1] as const).map(s => <path key={`ax${s}`} d={`M ${lado(g, s, g.peito - 0.6)} ${g.topo + 14} Q ${lado(g, s, g.peito - 1.6)} ${g.yCint - 14} ${lado(g, s, g.cintura + g.barriga * 0.6 - 0.4)} ${g.yCint - 2}`} fill="none" stroke={sombraPele} strokeWidth={1.6} opacity={0.7} />)}
        {([-1, 1] as const).map(s => <path key={`p${s}`} d={perna(g, s, 0, g.yTorn + 2)} fill={pele} stroke={contorno} strokeWidth={0.7} strokeLinejoin="round" />)}
        {/* HOTFIX 11.5.1: as tatuagens, na pele (a roupa vem por cima e cobre o que cobre). */}
        {tatuagens.length > 0 && <Tatuagens g={g} lista={tatuagens.filter(t => !NA_MAO.has(t.regiao) && t.regiao !== 'pe')} comps={composicoes} pele={pele} ide={ide} costas={costas} detalhe={detalhe} idade={idade} />}
        {/* O que se veste, de dentro para fora. */}
        {conj.inteira ? <Inteira g={g} p={conj.inteira as P<'inteira'>} ide={ide('inteira')} detalhe={detalhe} pele={pele} /> : <>
          <Baixo g={g} p={conj.baixo as P<'baixo'>} ide={ide('baixo')} detalhe={detalhe} pele={pele} />
          {conj.cima && <Cima g={g} p={conj.cima as P<'cima'>} ide={ide('cima')} detalhe={detalhe} pele={pele} />}
        </>}
        {descalco ? <g className="figura__pes figura__pes--descalco">{([-1, 1] as const).map(s => <path key={s} d={peDescalco(g, s)} fill={pele} stroke={contorno} strokeWidth={0.6} strokeLinejoin="round" />)}
          {tatuagens.some(t => t.regiao === 'pe') && !costas && <Tatuagens g={g} lista={tatuagens.filter(t => t.regiao === 'pe')} comps={[]} pele={pele} ide={ide} costas={costas} detalhe={detalhe} idade={idade} />}</g>
          : <Pes g={g} p={conj.pes as P<'pes'>} pele={pele} detalhe={detalhe} />}
        {conj.casaco && <Casaco g={g} p={conj.casaco as P<'casaco'>} detalhe={detalhe} />}
        {/* As mãos por cima das mangas longas (com o contorno, e a tatuagem da mão por cima delas). */}
        {([-1, 1] as const).map(s => <ellipse key={`mm${s}`} cx={lado(g, s, g.ombro + 2.7)} cy={145.5} rx={g.antebraco * 0.95} ry={5.2} fill={pele} stroke={contorno} strokeWidth={0.6} />)}
        {tatuagens.some(t => NA_MAO.has(t.regiao)) && <Tatuagens g={g} lista={tatuagens.filter(t => NA_MAO.has(t.regiao))} comps={[]} pele={pele} ide={ide} costas={costas} detalhe={detalhe} idade={idade} />}
        {aoEscolherRegiao && <MapaDoCorpo g={g} costas={costas} escolhida={regiaoEscolhida} aoEscolher={aoEscolherRegiao} ocupadas={new Set(tatuagens.filter(t => t.id !== 'previa').map(t => `${t.regiao}:${t.lado ?? ''}`))} />}
        {colar && (idade >= 8) && <g className="figura__colar" data-acessorio="pescoco">
          <path d={`M ${g.cx - g.pesc - 0.6} ${g.topo - 1} Q ${g.cx} ${g.topo + (colar.grossa ? 11 : 12.5)} ${g.cx + g.pesc + 0.6} ${g.topo - 1}`} fill="none" stroke={colar.cor} strokeWidth={colar.grossa ? 1.6 : 0.8} strokeLinecap="round" />
          {colar.contas && detalhe && [0, 1, 2, 3, 4, 5, 6].map(k => { const t = (k + 1) / 8; const x = g.cx - g.pesc + (2 * g.pesc) * t; const y = g.topo - 1 + Math.sin(Math.PI * t) * 12; return <circle key={k} cx={x} cy={y} r={0.9} fill={colar.contas![k % colar.contas!.length]} />; })}
          {colar.pingente && <circle cx={g.cx} cy={g.topo + 11.4} r={1.3} fill={colar.pingente} />}
        </g>}
        {relogio && (() => { const w = pulso(1); return (
          <g className="figura__relogio" data-acessorio="pulso" data-forma={relogio.forma}>
            <rect x={w.x - g.antebraco - 0.6} y={w.y - 1.6} width={(g.antebraco + 0.6) * 2} height={3.2} rx={0.8} fill={relogio.pulseira} />
            {relogio.forma === 'analogico' ? <><circle cx={w.x} cy={w.y} r={2.6} fill={relogio.caixa} /><circle cx={w.x} cy={w.y} r={1.9} fill={relogio.mostrador} />{detalhe && <path d={`M ${w.x} ${w.y} l 0 -1.3 M ${w.x} ${w.y} l 1 0.4`} stroke={relogio.mostrador === '#f4f1ea' ? '#1b1b1d' : '#f4f1ea'} strokeWidth={0.35} />}</>
              : <><rect x={w.x - 2.4} y={w.y - 2.6} width={4.8} height={5.2} rx={relogio.forma === 'smart' ? 1.4 : 0.8} fill={relogio.caixa} /><rect x={w.x - 1.7} y={w.y - 1.9} width={3.4} height={3.8} rx={0.8} fill={relogio.mostrador} /></>}
          </g>); })()}
        {pulseira && (() => { const w = pulso(-1); return (
          <g className="figura__pulseira" data-acessorio="pulseira">
            <path d={`M ${w.x - g.antebraco - 0.4} ${w.y} Q ${w.x} ${w.y + 1.6} ${w.x + g.antebraco + 0.4} ${w.y}`} fill="none" stroke={pulseira.cor} strokeWidth={pulseira.grossa ? 1.8 : 1.1} strokeLinecap="round" />
            {pulseira.contas && [-2, 0, 2].map((dx, k) => <circle key={k} cx={w.x + dx} cy={w.y + 0.9} r={0.9} fill={pulseira.contas![k]} />)}
          </g>); })()}
        {anel && <g className="figura__anel" data-acessorio="anel"><circle cx={lado(g, -1, g.ombro + 2.7)} cy={149.5} r={1.2} fill="none" stroke={anel.cor} strokeWidth={0.9} />{anel.pedra && <circle cx={lado(g, -1, g.ombro + 2.7)} cy={148.4} r={0.7} fill={anel.pedra} />}</g>}
      </g>
      {/* A cabeça: o mesmo retrato (rosto, cabelo, barba, óculos, chapéu), sem o busto. */}
      {costas ? (
        // De costas: a nuca e o cabelo (o rosto não aparece).
        <g className="figura__cabeca figura__cabeca--costas">
          <ellipse cx={60} cy={40} rx={16.5} ry={19.5} fill={pele} stroke={contorno} strokeWidth={0.6} />
          {visual.cabelo !== 'raspado' && <path d={`M 43.5 40 Q 43 20 60 19.5 Q 77 20 76.5 40 Q 76 ${visual.cabelo.startsWith('longo') || visual.cabelo === 'trancas' || visual.cabelo === 'cacheado_longo' ? 70 : 52} 60 ${visual.cabelo.startsWith('longo') || visual.cabelo === 'trancas' || visual.cabelo === 'cacheado_longo' ? 74 : 55} Q 44 ${visual.cabelo.startsWith('longo') ? 70 : 52} 43.5 40 Z`} fill={corDoCabelo(visual.corCabelo)} />}
          {([-1, 1] as const).map(s => <ellipse key={s} cx={60 + s * 17} cy={42} rx={2.4} ry={4} fill={sombraPele} />)}
        </g>
      ) : (
        <g transform="translate(20 0)" className="figura__cabeca">
          {/* A figura é sempre de gente (o bicho tem o seu retrato): espécie nenhuma. */}
          <Retrato visual={visual} genero={genero} idade={idade} semente={semente} tamanho={80} soCabeca rotulo="" especie={undefined} />
        </g>
      )}
      {destaque && <rect className="figura__destaque" x={destaque.x} y={destaque.y} width={destaque.w} height={destaque.h} rx={2} fill="none" stroke="currentColor" strokeWidth={1.4} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
});
