/**
 * VIDA 12.6 — AS TATUAGENS NA PELE: onde cada região fica na figura, como a tinta é (o tom, a paleta, o cinza), como
 * envelhece e como o fundo de uma composição liga os desenhos.
 *
 * A caixa de cada região é a mesma anatomia da `Figura` (o braço que afina do ombro ao pulso, a perna, o tronco); o
 * motor pensa em unidades da região (`dados/tatuagens.REGIOES`) e aqui elas viram unidades da figura — o desenho cresce
 * com a altura da região e a posição se espalha pela largura dela (num braço musculoso, o mesmo desenho ocupa menos do
 * braço, como na pele de verdade). Cada desenho é recortado pela própria parte do corpo: nunca flutua fora da pele.
 *
 * O tempo: a tinta preta vai ficando azulada e mais clara; a cor desbota mais rápido que o preto; o traço espalha um
 * pouco; a pele mais velha clareia mais um pouco. Devagar: uma tatuagem de 30 anos ainda é legível. O retoque devolve.
 */
import type { ReactNode } from 'react';
import { desenhoDeTatuagem, MEDIDA, REGIOES, type FundoDeComposicao, type Lado, type RegiaoDeTatuagem, type TipoDeComposicao } from '../../motor/dados/tatuagens';
import { retanguloNaRegiao, type TatuagemParaFigura } from '../../motor/sistemas/tatuagens';
import { DesenhoDaTatuagem, caixaNativa } from './tatuagens';
import { misturar } from './cores';
import { caixaNoRosto, ehDoRosto, ROSTO_PADRAO, type GeoDoRosto } from './rosto17';

/** O que a figura sabe do corpo (o mesmo `Geo` da Figura). */
export interface GeoDoCorpo {
  cx: number; pesc: number; topo: number; ombro: number; peito: number; cintura: number; quadril: number;
  yCint: number; yQuad: number; yVirilha: number; yJoelho: number; yTorn: number; yChao: number;
  braco: number; antebraco: number; coxa: number; panturrilha: number; tornozelo: number; barriga: number;
}

const lado = (g: GeoDoCorpo, s: 1 | -1, dx: number) => g.cx + s * dx;

/** O centro e a meia-largura do braço numa altura (a mesma geometria de `Figura.braco`). */
export function noBraco(g: GeoDoCorpo, y: number): [number, number] {
  const b = g.braco, a = g.antebraco;
  const pts: [number, number, number][] = [[g.topo + 5, g.ombro - 1.5 + b * 0.35, b], [108, g.ombro + 2.2, b * 0.86], [140, g.ombro + 2.6, a * 0.85]];
  for (let k = 1; k < pts.length; k++) {
    const [y0, x0, w0] = pts[k - 1], [y1, x1, w1] = pts[k];
    if (y <= y1) { const t = Math.max(0, (y - y0) / (y1 - y0)); return [x0 + (x1 - x0) * t, w0 + (w1 - w0) * t]; }
  }
  return [pts[2][1], pts[2][2]];
}
/** O centro e a meia-largura da perna numa altura (a mesma geometria de `Figura.perna`). */
export function naPerna(g: GeoDoCorpo, y: number): [number, number] {
  const pts: [number, number, number][] = [[g.yQuad - 2, g.quadril * 0.52, g.quadril * 0.5], [g.yVirilha + 6, g.quadril * 0.5, g.coxa], [g.yJoelho, g.quadril * 0.44, g.panturrilha + 0.8], [g.yTorn, g.quadril * 0.42, g.tornozelo]];
  for (let k = 1; k < pts.length; k++) {
    const [y0, x0, w0] = pts[k - 1], [y1, x1, w1] = pts[k];
    if (y <= y1) { const t = Math.max(0, (y - y0) / (y1 - y0)); return [x0 + (x1 - x0) * t, w0 + (w1 - w0) * t]; }
  }
  return [pts[3][1], pts[3][2]];
}

/** A caixa da região na figura: o centro (x, y), a largura e a altura, e o recorte (a parte do corpo). */
export interface Caixa { x: number; y: number; w: number; h: number; clip: string }

/**
 * A caixa de cada região. `s` é o lado na tela (+1 = à direita de quem olha): de frente, o lado esquerdo da pessoa fica
 * à direita; de costas, o contrário.
 */
export function caixaDaRegiao(g: GeoDoCorpo, r: RegiaoDeTatuagem, s: 1 | -1): Caixa {
  const membro = (y0: number, y1: number, larg = 1.25): Caixa => { const [x, hw] = noBraco(g, (y0 + y1) / 2); return { x: lado(g, s, x), y: (y0 + y1) / 2, w: hw * 2 * larg, h: y1 - y0, clip: `cb${s}` }; };
  const perna = (y0: number, y1: number, larg = 1.15): Caixa => { const [x, hw] = naPerna(g, (y0 + y1) / 2); return { x: lado(g, s, x), y: (y0 + y1) / 2, w: hw * 2 * larg, h: y1 - y0, clip: `cp${s}` }; };
  const t = g.topo;
  switch (r) {
    case 'ombro': { const [x, hw] = noBraco(g, t + 6); return { x: lado(g, s, x - 0.6), y: t + 6.5, w: hw * 2.5, h: 10, clip: `cb${s}` }; }
    case 'biceps': case 'triceps': return membro(t + 13, 106);
    case 'antebraco': case 'antebraco_externo': return membro(110, 134.5, 1.3);
    case 'pulso': return membro(134.8, 140.6, 1.3);
    case 'manga': return membro(t + 1, 140.6, 1.25);
    case 'mao': return { x: lado(g, s, g.ombro + 2.7), y: 144.6, w: g.antebraco * 1.8, h: 6.6, clip: `cm${s}` };
    case 'dedos': return { x: lado(g, s, g.ombro + 2.7), y: 149.2, w: g.antebraco * 1.6, h: 2.6, clip: `cm${s}` };
    case 'pescoco': return { x: lado(g, s, g.pesc * 0.48), y: t - 6.5, w: g.pesc * 0.95, h: 9, clip: 'cn' };
    case 'nuca': return { x: g.cx, y: t - 6.5, w: g.pesc * 1.75, h: 8, clip: 'cn' };
    case 'peitoral': return { x: lado(g, s, g.peito * 0.47), y: t + 15, w: g.peito * 0.86, h: 15, clip: 'ct' };
    case 'centro_peito': return { x: g.cx, y: t + 20, w: 8, h: 20, clip: 'ct' };
    case 'peito_inteiro': return { x: g.cx, y: t + 16, w: g.peito * 1.85, h: 18, clip: 'ct' };
    case 'costelas': return { x: lado(g, s, g.peito * 0.74), y: (t + 22 + g.yCint) / 2, w: 9, h: g.yCint - t - 22, clip: 'ct' };
    case 'abdomen': return { x: g.cx, y: g.yCint - 4, w: (g.cintura + g.barriga * 0.5) * 1.35, h: 20, clip: 'ct' };
    case 'costas_alta': return { x: g.cx, y: t + 11.5, w: g.peito * 1.72, h: 17, clip: 'ct' };
    case 'costas_media': return { x: g.cx, y: t + 29, w: g.peito * 1.45, h: 17, clip: 'ct' };
    case 'costas_baixa': return { x: g.cx, y: (t + 38 + g.yQuad - 3) / 2, w: (g.cintura + g.barriga * 0.6) * 1.75, h: g.yQuad - 3 - t - 38, clip: 'ct' };
    case 'costas_inteiras': return { x: g.cx, y: (t + 3 + g.yQuad - 3) / 2, w: g.peito * 1.72, h: g.yQuad - 6 - t, clip: 'ct' };
    case 'coxa': return perna(g.yVirilha + 1, g.yJoelho - 8);
    case 'joelho': return perna(g.yJoelho - 7, g.yJoelho + 4, 1.1);
    case 'canela': case 'panturrilha': return perna(g.yJoelho + 6, g.yTorn - 6);
    case 'tornozelo': return perna(g.yTorn - 5.5, g.yTorn + 0.5, 1.3);
    case 'pe': return { x: lado(g, s, g.quadril * 0.42 + 1.2), y: g.yTorn + 5, w: 7.5, h: 6, clip: 'cpe' + s };
    case 'perna_inteira': return perna(g.yVirilha - 2, g.yTorn - 1);
    // VIDA 17: o rosto — a caixa no rosto típico, levada para as coordenadas da figura (a cabeça é o retrato, em +10, −8).
    default: { const c = caixaNoRosto(ROSTO_PADRAO, r, s); return { x: c.x + 10 + (g.cx - 60), y: c.y - 8, w: c.w, h: c.h, clip: 'crosto' }; }
  }
}

/** A região aparece nesta vista? (O braço inteiro e a perna inteira aparecem dos dois lados.) */
export const visivelNaVista = (r: RegiaoDeTatuagem, costas: boolean) => (costas ? REGIOES[r].costas : REGIOES[r].frente);
export const ladoNaTela = (ladoT: Lado | undefined, costas: boolean): 1 | -1 => ((ladoT === 'e') !== costas ? 1 : -1);

/* ------------------------------------------------------------------ a tinta */

const TINTA: Record<string, string> = { preto: '#1b2733', sepia: '#4a3424', vermelho: '#7c2222', azul: '#1d2f57', verde: '#2f4a2c' };

function hsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const puxarMatiz = (h: number, alvo: number, t: number) => { let d = ((alvo - h + 540) % 360) - 180; return (h + d * t + 360) % 360; };
const luminancia = (c: string) => { const [r, g, b] = [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16) / 255); return 0.299 * r + 0.587 * g + 0.114 * b; };

/** A cor do desenho pela paleta escolhida (a mesma cor "da folha" vira quente, fria, pastel, vibrante). */
export function naPaleta(c: string, paleta?: string): string {
  if (!paleta || paleta === 'original') return c;
  let [h, s, l] = hsl(c);
  if (s < 0.08) return c;
  if (paleta === 'quente') h = puxarMatiz(h, 18, 0.5);
  else if (paleta === 'fria') h = puxarMatiz(h, 205, 0.5);
  else if (paleta === 'pastel') { l = l + (1 - l) * 0.4; s *= 0.7; }
  else if (paleta === 'vibrante') { s = Math.min(1, s * 1.35); l = Math.min(0.6, Math.max(0.38, l)); }
  return hex(h, s, l);
}

/** O preto e as cores da tatuagem na pele, com o tempo. */
export function tintaNaPele(t: Pick<TatuagemParaFigura, 'cor' | 'tom' | 'intensidade' | 'anos' | 'idade'>, pele: string): { tinta: string; cor: (c: string) => string; desbote: number } {
  const fraca = (1 - t.intensidade) * 0.45;
  const pelePesa = Math.max(0, t.idade - 55) * 0.002;
  const desbote = Math.min(0.42, 0.15 + Math.min(0.2, t.anos * 0.0065) + pelePesa + fraca);
  const base = t.cor === 'colorida' || !t.tom ? TINTA.preto : TINTA[t.tom] ?? TINTA.preto;
  const tinta = misturar(base, pele, desbote);
  const corDesbota = Math.min(0.55, 0.18 + Math.min(0.28, t.anos * 0.0095) + pelePesa + fraca);
  const cor = t.cor === 'colorida'
    ? (c: string) => misturar(naPaleta(c, t.tom), pele, corDesbota)
    : t.cor === 'cinza'
      ? (c: string) => misturar(tinta, pele, Math.min(0.9, 0.2 + luminancia(c) * 0.62))
      : (c: string) => (luminancia(c) > 0.82 ? misturar(tinta, pele, 0.92) : misturar(tinta, pele, 0.86));
  return { tinta, cor, desbote };
}

/* ------------------------------------------------------------------ uma tatuagem */

/** O retângulo da tatuagem na figura (o centro e o tamanho do desenho, sem girar) — para o desenho e para o halo. */
export function lugarNaFigura(g: GeoDoCorpo, t: TatuagemParaFigura, costas: boolean): { x: number; y: number; w: number; h: number; caixa: Caixa; s: 1 | -1 } | null {
  const d = desenhoDeTatuagem(t.desenho);
  if (!d) return null;
  const s = REGIOES[t.regiao].lados ? ladoNaTela(t.lado, costas) : 1;
  const caixa = caixaDaRegiao(g, t.regiao, s);
  const R = REGIOES[t.regiao];
  const r = retanguloNaRegiao(d, t.regiao, t.tamanho, t.ajuste) ?? { cx: 0, cy: 0, w: R.w, h: R.h };
  const kx = caixa.w / R.w, ky = caixa.h / R.h;
  // x positivo anda para fora do corpo (para os dois lados igual); nas regiões do meio, para a direita de quem olha.
  const x = caixa.x + (REGIOES[t.regiao].lados ? s : 1) * r.cx * kx;
  const y = caixa.y + r.cy * ky;
  if (t.tamanho === 4) return { x: caixa.x, y: caixa.y, w: caixa.w, h: caixa.h, caixa, s };
  if (d.faixa) return { x: caixa.x, y, w: caixa.w * 1.1, h: Math.max(2.4, (MEDIDA[t.tamanho] * t.ajuste.escala) / (d.proporcao ?? 1)) * ky, caixa, s };
  const lado0 = MEDIDA[t.tamanho] * t.ajuste.escala * ky;
  const p = d.proporcao ?? 1;
  return { x, y, w: p >= 1 ? lado0 : lado0 * p, h: p >= 1 ? lado0 / p : lado0, caixa, s };
}

export function TatuagemNaPele({ g, t, pele, ide, costas, detalhe, halo }: { g: GeoDoCorpo; t: TatuagemParaFigura; pele: string; ide: (k: string) => string; costas: boolean; detalhe: boolean; halo?: boolean }): ReactNode {
  const l = lugarNaFigura(g, t, costas);
  if (!l) return null;
  const d = desenhoDeTatuagem(t.desenho)!;
  const { tinta, cor } = tintaNaPele(t, pele);
  const op = t.sombra ? 0.07 : (0.93 - Math.min(0.15, t.anos * 0.0035)) * (1 - 0.85 * t.clareou);
  const traco = (1 + Math.min(0.3, t.anos * 0.008)) * (detalhe ? 1 : 1.35);
  const [nw, nh] = caixaNativa(d);
  // Mão e dedos: a mão é desenhada por cima da manga — o recorte é a elipse da mão.
  const rot = (t.ajuste.rot || 0) * (REGIOES[t.regiao].lados ? l.s : 1);
  const espelho = (t.ajuste.espelhar ? -1 : 1) * (REGIOES[t.regiao].lados && l.s < 0 ? -1 : 1);
  const sx = (l.w / nw) * espelho, sy = l.h / nh;
  return (
    <g clipPath={`url(#${ide(l.caixa.clip)})`} opacity={op} data-tatuagem={t.desenho} data-regiao={t.regiao} data-local={t.local} data-lado={t.lado}>
      {halo && <ellipse cx={l.x} cy={l.y} rx={l.w * 0.62} ry={l.h * 0.62} fill={pele} opacity={0.96} />}
      <g transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${(-nw / 2).toFixed(2)} ${(-nh / 2).toFixed(2)})`}>
        <DesenhoDaTatuagem id={t.desenho} tinta={tinta} cor={cor} traco={traco} texto={t.texto} espelhado={espelho < 0} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ VIDA 17 · o rosto */

/**
 * As tatuagens do rosto, desenhadas DENTRO do retrato (que é também a cabeça da figura): a caixa sai da geometria viva
 * do rosto (`rosto17.caixaNoRosto`), o desenho é recortado pelo próprio rosto (nunca flutua) e a tinta é a mesma do
 * corpo (o tom, o desbote, o laser).
 */
export function TatuagensDoRosto({ lista, g, pele, rosto, uid }: { lista: TatuagemParaFigura[]; g: GeoDoRosto; pele: string; rosto: string; uid: string }): ReactNode {
  const doRosto = lista.filter(t => ehDoRosto(t.regiao));
  if (!doRosto.length) return null;
  const clip = `${uid}-rosto17`;
  return (
    <g className="retrato__tatuagens">
      <defs><clipPath id={clip}><path d={rosto} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {doRosto.map(t => {
          const d = desenhoDeTatuagem(t.desenho);
          if (!d) return null;
          const R = REGIOES[t.regiao];
          // De frente: o lado esquerdo da pessoa fica à direita de quem olha.
          const s: 1 | -1 = R.lados ? (t.lado === 'e' ? 1 : -1) : 1;
          const c = caixaNoRosto(g, t.regiao, s);
          const r = retanguloNaRegiao(d, t.regiao, t.tamanho, t.ajuste) ?? { cx: 0, cy: 0, w: R.w, h: R.h };
          const kx = c.w / R.w, ky = c.h / R.h;
          const x = c.x + (R.lados ? s : 1) * r.cx * kx, y = c.y + r.cy * ky;
          const [nw, nh] = caixaNativa(d);
          const lado0 = MEDIDA[t.tamanho] * t.ajuste.escala * (R.micro ?? 1) * ky;
          const p = d.proporcao ?? 1;
          const w = d.faixa ? c.w * 1.02 : p >= 1 ? lado0 : lado0 * p;
          const h = d.faixa ? Math.max(1.6, lado0 / p) : p >= 1 ? lado0 / p : lado0;
          const { tinta, cor } = tintaNaPele(t, pele);
          const op = t.sombra ? 0.07 : (0.92 - Math.min(0.15, t.anos * 0.0035)) * (1 - 0.85 * t.clareou);
          const rot = (t.ajuste.rot || 0) * (R.lados ? s : 1);
          const espelho = (t.ajuste.espelhar ? -1 : 1) * (R.lados && s < 0 ? -1 : 1);
          return (
            <g key={t.id} opacity={op} data-tatuagem={t.desenho} data-regiao={t.regiao} data-lado={t.lado}
              transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${((w / nw) * espelho).toFixed(4)} ${(h / nh).toFixed(4)}) translate(${(-nw / 2).toFixed(2)} ${(-nh / 2).toFixed(2)})`}>
              <DesenhoDaTatuagem id={t.desenho} tinta={tinta} cor={cor} traco={1.4} texto={t.texto} espelhado={espelho < 0} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ o fundo da composição */

const REGIOES_DO_FUNDO: Record<TipoDeComposicao, RegiaoDeTatuagem[]> = {
  manga: ['manga'], meia_manga: ['ombro', 'biceps'], peito: ['peito_inteiro'], costas: ['costas_inteiras'], perna: ['perna_inteira']
};

/** O desenho do fundo, ladrilhado por um `pattern` (o padrão de cada tipo). */
export function PadraoDoFundo({ id, fundo, tinta, cor }: { id: string; fundo: FundoDeComposicao; tinta: string; cor: (c: string) => string }) {
  const L = { fill: 'none', stroke: tinta, strokeLinecap: 'round' as const };
  switch (fundo) {
    case 'ondas': return <pattern id={id} width={8} height={5} patternUnits="userSpaceOnUse"><rect width={8} height={5} fill={cor('#3f6f9a')} opacity={0.55} /><path d="M0 4 Q2 0.6 4 2.6 Q6 4.4 8 1.2" {...L} strokeWidth={0.45} /><path d="M3.2 2.3 l0.8 -0.9 M7 1.6 l0.7 -0.8" {...L} strokeWidth={0.3} /></pattern>;
    case 'nuvens': return <pattern id={id} width={9} height={7} patternUnits="userSpaceOnUse"><path d="M0.5 5 Q2 2 4 3.6 Q4.6 1.4 7 2.6 Q8.6 3.4 8.4 5" {...L} strokeWidth={0.4} /><path d="M3.4 4.6 a1 1 0 1 1 1.6 -0.6" {...L} strokeWidth={0.3} /><path d="M0 6.6 H9" stroke={cor('#9aa0a6')} strokeWidth={0.9} opacity={0.5} /></pattern>;
    case 'pontilhado': return <pattern id={id} width={2.2} height={2.2} patternUnits="userSpaceOnUse"><circle cx={1.1} cy={1.1} r={0.28} fill={tinta} /></pattern>;
    case 'folhagem': return <pattern id={id} width={7} height={8} patternUnits="userSpaceOnUse"><path d="M1 7 Q3 3 6 1" {...L} strokeWidth={0.35} /><path d="M2.4 5 q-2 -1 -1.6 -2.6 q2 0.6 1.6 2.6 Z M4 3.4 q1.8 -0.4 2.4 1 q-1.8 0.6 -2.4 -1 Z" fill={cor('#3f7a45')} stroke={tinta} strokeWidth={0.25} /></pattern>;
    case 'blackwork': return <pattern id={id} width={4} height={4} patternUnits="userSpaceOnUse"><rect width={4} height={4} fill={tinta} /></pattern>;
    case 'geometrico': return <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse"><path d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5" {...L} strokeWidth={0.3} /><path d="M3 0 V6" {...L} strokeWidth={0.18} strokeDasharray="0.6 0.8" /></pattern>;
    default: return null;
  }
}

export interface ComposicaoNaFigura { id: string; tipo: TipoDeComposicao; lado?: Lado; fundo: FundoDeComposicao }

/** O fundo da composição: cobre a parte inteira (recortado pelo corpo); os desenhos do conjunto vêm por cima, com um respiro de pele. */
export function FundoNaPele({ g, c, pele, ide, costas, idade }: { g: GeoDoCorpo; c: ComposicaoNaFigura; pele: string; ide: (k: string) => string; costas: boolean; idade: number }): ReactNode {
  if (c.fundo === 'nenhum') return null;
  const regioes = REGIOES_DO_FUNDO[c.tipo].filter(r => visivelNaVista(r, costas));
  if (!regioes.length) return null;
  const { tinta, cor } = tintaNaPele({ cor: c.fundo === 'blackwork' || c.fundo === 'pontilhado' || c.fundo === 'geometrico' ? 'preta' : 'colorida', intensidade: 1, anos: 0, idade }, pele);
  const pid = ide(`fundo-${c.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
  return (
    <g className="figura__fundo-tatuagem" data-composicao={c.tipo} data-fundo={c.fundo} opacity={c.fundo === 'blackwork' ? 0.88 : 0.75}>
      <defs><PadraoDoFundo id={pid} fundo={c.fundo} tinta={tinta} cor={cor} /></defs>
      {regioes.map(r => {
        const s = REGIOES[r].lados ? ladoNaTela(c.lado, costas) : 1;
        const k = caixaDaRegiao(g, r, s);
        return <g key={r} clipPath={`url(#${ide(k.clip)})`}><rect x={k.x - k.w * 0.7} y={k.y - k.h / 2} width={k.w * 1.4} height={k.h} fill={`url(#${pid})`} /></g>;
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ o mapa do corpo (o estúdio) */

/** As caixas clicáveis de cada região na vista (para o jogador escolher onde no próprio corpo). */
export function MapaDoCorpo({ g, costas, escolhida, aoEscolher, ocupadas, rosto }: {
  g: GeoDoCorpo; costas: boolean; escolhida?: { regiao: RegiaoDeTatuagem; lado?: Lado };
  aoEscolher: (r: RegiaoDeTatuagem, lado?: Lado) => void; ocupadas?: Set<string>;
  /** VIDA 17: só as regiões do rosto (desenhadas por cima da cabeça) — ou, sem isso, só as do corpo. */
  rosto?: boolean;
}): ReactNode {
  const out: ReactNode[] = [];
  for (const r of Object.keys(REGIOES) as RegiaoDeTatuagem[]) {
    if (REGIOES[r].cobre || !visivelNaVista(r, costas) || ehDoRosto(r) !== !!rosto) continue;
    const lados: (Lado | undefined)[] = REGIOES[r].lados ? ['e', 'd'] : [undefined];
    for (const ld of lados) {
      const s = REGIOES[r].lados ? ladoNaTela(ld, costas) : 1;
      const k = caixaDaRegiao(g, r, s);
      const ativa = escolhida?.regiao === r && (escolhida.lado ?? undefined) === ld;
      const chave = `${r}:${ld ?? ''}`;
      const nome = `${REGIOES[r].nome}${ld ? (ld === 'e' ? ' esquerdo' : ' direito') : ''}`;
      out.push(
        <rect key={chave} className={`figura__regiao${ativa ? ' figura__regiao--ativa' : ''}${ocupadas?.has(chave) ? ' figura__regiao--ocupada' : ''}`} data-regiao={r} data-lado={ld}
          x={k.x - k.w / 2} y={k.y - k.h / 2} width={k.w} height={k.h} rx={1.2} role="button" tabIndex={0} aria-label={`Tatuar aqui: ${nome}`} aria-pressed={ativa}
          onClick={() => aoEscolher(r, ld)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoEscolher(r, ld); } }}>
          <title>{nome}</title>
        </rect>
      );
    }
  }
  return <g className="figura__mapa">{out}</g>;
}
