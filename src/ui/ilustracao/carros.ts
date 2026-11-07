/**
 * VIDA 13 (sobre o REWORK 8 e a 12.9) — os carros: UM gerador de perfil e CADA MODELO do catálogo pelas medidas da
 * ficha técnica (`carros13.ts`): comprimento, altura, entre-eixos, roda, balanços — e o arquétipo da carroceria.
 *
 * O que o desenho tem agora (de trás para a frente): a lataria com os arcos dos para-lamas no lugar das rodas (o arco
 * centrado no eixo, com a folga do pneu: o rebaixado quase encosta, o de terra sobra), a soleira, os para-choques (na
 * cor, de plástico preto ou cromados), a estufa com a moldura (preta, cromada) e as colunas, as portas (o corte, as
 * maçanetas), o retrovisor, o vinco da lateral e o reflexo do ombro, o farol de cada um (o fino de LED, o redondo, o
 * alto do SUV, o no para-lama do 911 e do Fusca, o escamoteável, a gota carenada do E-Type), a lanterna (fina, vertical,
 * redonda, a barra de ponta a ponta, a da aleta), a grade cromada dos de luxo, a entrada de ar, o difusor e as ponteiras
 * do esportivo, a saia lateral, a guelra no para-lama, a antena barbatana — e as rodas (desenho, número de raios, cor,
 * o pneu de perfil baixo, a faixa branca dos antigos).
 *
 * O desenho sai só do modelo (`versaoId`): o mesmo carro na loja, na garagem e na oficina. Sem modelo (um save muito
 * antigo), o perfil da forma com a pequena variação da semente — o desenho nunca falta.
 */
import { cantos, circulo, clarear, entreX, escurecer, misturar, num as f, poligono, ret, suave, variacao, type Amostra, type Peca, type Pt } from './nucleo';
import type { VisualVeiculo } from '../../motor/dados/veiculos129';
import { brilhoDoAcabamento, corComAcabamento, extrasDoCarro, peliculaSobre, type Extras129 } from './veiculos129';
import { ARQUETIPOS, FAMILIAS_13, MODELOS_13, type Ajustes, type Farol, type Lanterna, type Modelo13, type Traseira } from './carros13';

export type { Traseira };

export interface PerfilCarro extends Omit<Ajustes, 'extras'> {
  traseira: Traseira;
  /** a traseira e a frente, o raio da roda, os eixos */
  x0: number; x1: number; r: number; eT: number; eD: number;
  /** a soleira (o vão livre), a linha de cintura, o teto, a altura da traseira e a do bico */
  solo: number; cint: number; teto: number; tras: number; capo: number;
  /** onde o teto começa e termina; a base do para-brisa; o fim do porta-malas (sedã) ou da cabine (picape) */
  tT: number; tD: number; pb: number; vol?: number;
  colunas: number[];
  capoBase?: number; cintT?: number; nariz?: number; cauda?: number; curva?: number; folga?: number; colC?: number; colCb?: number;
  farol?: Farol; lanterna?: Lanterna;
  extras?: Extras129;
}

const CHAO = 122;
/** A escala: mm por unidade no comprimento e na altura (o estilo engrossa um pouco a altura e as rodas). */
const SX = 25.5, SY = 23.5;

/** Monta o perfil (unidades do desenho) a partir das medidas e do arquétipo. */
export function montarPerfil(x: Modelo13): PerfilCarro {
  const a = { ...ARQUETIPOS[x.a], ...x.o } as (typeof ARQUETIPOS)[keyof typeof ARQUETIPOS] & { cintT?: number; capoBase?: number; vol?: number; cauda?: number; curva?: number; folga?: number; colC?: number; colCb?: number };
  const { L, H, W, D, bf } = x.m;
  const vao = x.m.vao ?? a.vao;
  const comp = L / SX;
  const x0 = 120 - comp / 2, x1 = 120 + comp / 2;
  const Y = (mm: number) => CHAO - mm / SY;
  const X = (frac: number) => x1 - (frac * L) / SX;
  const eD = x1 - bf / SX, eT = eD - W / SX;
  const j = x.j ?? {};
  return {
    ...j,
    traseira: a.traseira,
    x0, x1, eT, eD, r: D / 2 / SY,
    solo: Y(vao), cint: Y(a.cint * H), cintT: a.cintT !== undefined ? Y(a.cintT * H) : undefined, teto: Y(H), tras: Y(a.tras * H), capo: Y(a.nariz * H),
    capoBase: a.capoBase !== undefined ? Y(a.capoBase * H) : undefined,
    pb: X(a.pb), tD: X(a.pb + a.para), tT: X(a.tT), vol: a.vol !== undefined ? X(a.vol) : undefined,
    nariz: (a.nz ?? 220) / SX, cauda: (a.cauda ?? 60) / SX, curva: a.curva ?? 1, folga: a.folga ?? 3, colC: (a.colC ?? 130) / SX, ...(a.colCb !== undefined ? { colCb: a.colCb / SX } : {}),
    colunas: j.colunas ?? (x.a === 'central' || x.a === 'gt' || x.a === 'roadster' || x.a === 'muscle' || x.a === 'traseiro' ? [0.25] : [0.5]),
    portas: j.portas ?? (x.a === 'central' || x.a === 'gt' || x.a === 'roadster' || x.a === 'muscle' || x.a === 'traseiro' ? 2 : 4)
  };
}

/** As formas como perfil (o desenho de quem não tem modelo). */
export const FAMILIAS = Object.fromEntries(Object.entries(FAMILIAS_13).map(([k, v]) => [k, montarPerfil(v)])) as Record<keyof typeof FAMILIAS_13, PerfilCarro>;
const PERFIS = new Map<string, PerfilCarro>();
/** O perfil de um modelo do catálogo (montado uma vez). */
export function perfilDoModelo(versaoId: string): PerfilCarro | undefined {
  let p = PERFIS.get(versaoId);
  if (!p && MODELOS_13[versaoId]) { p = montarPerfil(MODELOS_13[versaoId]); PERFIS.set(versaoId, p); }
  return p;
}

/** O perfil de um carro: o do modelo (se houver) e, sem modelo, o da forma com a pequena variação da semente. */
export function perfilDoCarro(familia: keyof typeof FAMILIAS, versaoId?: string, semente?: string): PerfilCarro {
  const doModelo = versaoId ? perfilDoModelo(versaoId) : undefined;
  if (doModelo) return doModelo;
  const base = FAMILIAS[familia];
  const [a, b, d, e] = variacao(semente);
  return { ...base, teto: base.teto + 1.6 * a, tD: base.tD + 3 * b, pb: base.pb + 2.4 * b, capo: base.capo + 1.2 * d, r: base.r + 0.5 * e, x1: base.x1 + 1.6 * d, eD: base.eD + 1.2 * d };
}

/* ============================================================== geometria */

const xEmY = (a: Pt, b: Pt, y: number) => (Math.abs(b[1] - a[1]) < 0.01 ? a[0] : a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
const yEmX = (a: Pt, b: Pt, x: number) => (Math.abs(b[0] - a[0]) < 0.01 ? a[1] : a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]));
type P3 = [number, number, number];

/** A suspensão mexe na carroceria, não nas rodas: o rebaixado desce, o reforçado sobe. */
function naSuspensao(p: PerfilCarro, s?: VisualVeiculo['suspensao']): PerfilCarro {
  if (!s) return p;
  const dy = s === 'baixa' ? 2.4 : -3;
  const m = (y?: number) => (y === undefined ? undefined : y + dy);
  return { ...p, solo: p.solo + dy, cint: p.cint + dy, teto: p.teto + dy, tras: p.tras + dy, capo: p.capo + dy, cintT: m(p.cintT), capoBase: m(p.capoBase), folga: Math.max(1, (p.folga ?? 3) + (s === 'baixa' ? -1.6 : 1.6)) };
}

/** O carro, em peças. */
export function carro(perfil: PerfilCarro, corBase: string, estado?: number, visual?: VisualVeiculo): Amostra {
  const cor = corComAcabamento(corBase, visual);
  let p = naSuspensao(perfil, visual?.suspensao);
  if (visual?.tetoCor) p = { ...p, tetoCor: visual.tetoCor, capota: undefined };
  const { x0, x1, r, eT, eD, solo, cint, teto, tras, capo, tT, tD, pb } = p;
  const k = p.curva ?? 1;
  const cintT = p.cintT ?? cint;
  const capoBase = p.capoBase ?? cint - 0.5;
  const nariz = p.nariz ?? 8;
  const cauda = p.cauda ?? 3;
  const v = p.vol ?? x0 + 30;
  const cy = CHAO - r;
  const R = r + (p.folga ?? 3);
  const pintura = estado !== undefined && estado < 40 ? misturar(cor, '#8f8a83', 0.18) : cor;
  /** a meia-largura do arco de roda numa altura (0 se a altura não corta o arco) */
  const meia = (y: number, rr = R) => (Math.abs(y - cy) < rr ? Math.sqrt(rr * rr - (y - cy) ** 2) : 0);

  // O capô: do para-brisa ao bico, com o bojo do meio (o E-Type) — e a anca do 911 atrás.
  const bico: Pt = [x1 - nariz, capo];
  const capoMeio: P3[] = p.bojo ? [[(pb + bico[0]) / 2, (capoBase + capo) / 2 - p.bojo, 30 * k]] : [];
  const frente: P3[] = [[pb, capoBase, 4 * k], ...capoMeio, [bico[0], capo, 9 * k], [x1, capo + 5, 5 * k], [x1 + 0.4, solo - 6, 3 * k], [x1 - 2, solo + 0.6, 2]];
  const anca: P3[] = p.ombro ? [[x0 + (tT - x0) * 0.42, yEmX([x0 + cauda, tras], [tT, teto], x0 + (tT - x0) * 0.42) - p.ombro, 16 * k]] : [];
  let atras: P3[];
  let C: Pt, Dp: Pt;
  switch (p.traseira) {
    case 'tres':
      atras = [[x0 + 1.5, solo + 0.6, 2], [x0, solo - 6, 3 * k], [x0, tras + 4, 3 * k], [x0 + cauda, tras, 4 * k], ...anca, [v, tras - 1.2, 6 * k]];
      C = [tT, teto]; Dp = [v, tras - 1.2];
      break;
    case 'fastback': {
      // As costas abauladas (o Fusca, o 911): um ponto no meio da descida, empurrado para fora.
      const costas: P3[] = p.costas ? [[(x0 + cauda + tT) / 2 - p.costas * 0.5, (tras + teto) / 2 - p.costas, 20 * k]] : [];
      atras = [[x0 + 1.5, solo + 0.6, 2], [x0, solo - 6, 3 * k], [x0, tras + 5, 4 * k], [x0 + cauda, tras, 7 * k], ...[...anca, ...costas].sort((a, b) => a[0] - b[0])];
      C = [tT, teto]; Dp = [x0 + cauda, tras];
      break;
    }
    case 'cacamba':
      atras = [[x0 + 1.5, solo + 0.6, 2], [x0, solo - 6, 2 * k], [x0, cint, 2 * k], [v, cint, 0], [v, teto + 4, 3 * k]];
      C = [v + 4, teto]; Dp = [v, cint];
      break;
    default: // hatch e caixa: a tampa quase reta, o vidro de trás deitado (hatch) ou em pé (SUV).
      atras = [[x0 + 1.5, solo + 0.6, 2], [x0, solo - 6, 3 * k], [x0 + 0.6, tras + 2, 4 * k], [x0 + 2, tras, 3 * k]];
      C = [tT, teto]; Dp = [x0 + 2, tras];
  }
  const teto2: P3[] = p.semTeto
    ? [[tT, cint - 1.5, 6 * k], [pb - 4, cint - 1, 3 * k]]
    : [[C[0], teto, (p.traseira === 'fastback' ? 18 : p.traseira === 'tres' ? 14 : 8) * k], [tD, teto, 12 * k]];
  const topo: P3[] = [...atras, ...teto2, ...frente];
  const arco = (cx: number) => { const h = meia(solo); return h ? `L${f(cx + h)} ${f(solo)}A${f(R)} ${f(R)} 0 ${solo > cy ? 1 : 0} 0 ${f(cx - h)} ${f(solo)}` : ''; };
  // Os antigos arredondados (o Fusca, o 500, o 911 de antes): a linha de cima é uma curva só, não uma régua dobrada.
  const linhaDeCima = k >= 1.8 ? `M${f(topo[0][0])} ${f(topo[0][1])}L${f(topo[1][0])} ${f(topo[1][1])}${suave(topo.slice(1, -1).map(q => [q[0], q[1]] as Pt), false, 0.62).replace(/^M[^C]*/, '')}L${f(topo[topo.length - 1][0])} ${f(topo[topo.length - 1][1])}` : cantos(topo, false);
  const corpo = `${linhaDeCima}${arco(eD)}${arco(eT)}L${f(x0 + 1.5)} ${f(solo + 0.6)}Z`;

  // A estufa: a linha do para-brisa, a do vidro de trás, a cintura — a moldura e os vidros dentro dela.
  const esp = 3.2;
  const A: Pt = [pb, capoBase], B: Pt = [tD, teto];
  const colA = 2.6, colC = p.colC ?? 4;
  const yTop = teto + esp;
  const fB: Pt = [xEmY(A, B, cint) - colA, cint], fT: Pt = [xEmY(A, B, yTop) - colA, yTop];
  const colCb = p.colCb ?? colC * 1.5;
  const tTop: Pt = [xEmY(C, Dp, yTop) + colC, yTop], tB: Pt = [Math.min(xEmY(C, Dp, cintT) + colCb, tTop[0]), cintT];
  if (p.traseira === 'cacamba') { tTop[0] = v + 4.5; tB[0] = v + 3; }
  const dlo: Pt[] = p.semTeto ? [] : [tB, tTop, fT, fB];
  const dentro = (q: Pt[], d: number): Pt[] => q.length ? [[q[0][0] + d, q[0][1] - d * 0.6], [q[1][0] + d, q[1][1] + d], [q[2][0] - d, q[2][1] + d], [q[3][0] - d, q[3][1] - d * 0.6]] : [];
  const vao = dentro(dlo, 1.1);
  const xa = Math.min(...(vao.length ? [vao[0][0], vao[1][0]] : [0])), xb = vao.length ? vao[3][0] : 0;
  const cortes = [xa, ...p.colunas.filter(c => c < 0.98).map(c => xa + (xb - xa) * c), xb];
  const vidros = vao.length ? cortes.slice(0, -1).map((xx, i) => entreX(vao, xx + (i ? 1.7 : 0), cortes[i + 1] - (i < cortes.length - 2 ? 1.7 : 0))).filter(q => q.length > 2) : [];
  const corMoldura = p.moldura === 'cromo' ? '#d9d6d0' : p.moldura === 'cor' ? escurecer(pintura, 0.12) : '#232427';

  // As portas: o corte da frente (atrás do para-lama), as colunas, o de trás (contornando a roda).
  const xPortaF = Math.min(fB[0] + 1.5, eD - meia(solo - 4) - 2.5);
  const pilares = p.colunas.filter(c => c < 0.98).map(c => xa + (xb - xa) * c);
  const xPortaT = p.portas === 2 ? (pilares[0] ?? tB[0]) : (pilares[1] ?? tB[0] + 1);
  const cortesPorta = p.portas === 2 ? [xPortaF, xPortaT] : [xPortaF, pilares[0] ?? (xPortaF + xPortaT) / 2, xPortaT];
  const yBaixo = solo - 3.5;
  const linhaPorta = (xx: number, i: number) => {
    if (i === 0) return `M${f(fB[0] + 0.5)} ${f(cint)}Q${f(xPortaF)} ${f(cint + 4)} ${f(xPortaF)} ${f(cint + 10)}L${f(xPortaF - 0.5)} ${f(yBaixo)}`;
    const xFim = i === cortesPorta.length - 1 ? Math.max(xx, eT + meia(yBaixo) + 1.8) : xx;
    return `M${f(xx)} ${f(i === cortesPorta.length - 1 ? cintT : cint)}L${f(xx)} ${f(cint + 8)}Q${f(xx)} ${f(yBaixo - 2)} ${f(xFim)} ${f(yBaixo)}`;
  };
  const macanetas = cortesPorta.slice(1).map(xx => ret(xx - 9.5, cint + 4.6, 6.4, 1.7, 0.85)).join('');

  // O retrovisor, na quina do vidro da frente.
  const esp2 = p.espelho ?? 'cor';
  const [mx, my] = [fB[0] - 2, cint - 0.5];
  const espelho: Peca[] = p.semTeto || esp2 === 'nenhum' ? [] : [{ tipo: 'massa', d: cantos([[mx - 1.5, my + 1, 1], [mx + 0.5, my - 3.6, 1.6], [mx + 7.5, my - 4.4, 1.8], [mx + 8.2, my + 0.4, 1.2], [mx + 1, my + 1.6, 1]]), cor: esp2 === 'cromo' ? '#d9d6d0' : esp2 === 'preto' ? '#232427' : pintura, semVolume: esp2 !== 'cor', marca: 'retrovisor' }];

  // Os para-choques e a frente: a costura na cor, o plástico preto do jipe, a lâmina cromada do antigo.
  const yPcT = solo - 12, yPcD = solo - 13;
  const pc = p.paraChoque ?? 'cor';
  const paraChoques: Peca[] = pc === 'preto' ? [
    { tipo: 'massa', d: cantos([[x0 - 1.4, yPcT, 2], [eT - meia(yPcT) - 0.8, yPcT, 1], [eT - meia(solo - 1) - 0.8, solo - 1, 1], [x0 - 1.4, solo - 1, 2]]), cor: '#34322f', semVolume: true, marca: 'para-choque' },
    { tipo: 'massa', d: cantos([[eD + meia(yPcD) + 0.8, yPcD, 1], [x1 + 1.4, yPcD, 2], [x1 + 1.4, solo - 1, 2], [eD + meia(solo - 1) + 0.8, solo - 1, 1]]), cor: '#34322f', semVolume: true, marca: 'para-choque' }
  ] : pc === 'cromo' ? [
    { tipo: 'metal', d: cantos([[x0 - 2.2, solo - 11.5, 1.6], [x0 + 14, solo - 11, 1.2], [x0 + 14, solo - 7.6, 1.2], [x0 - 2.2, solo - 7, 1.6]]), cor: '#dcd9d3', marca: 'cromado' },
    { tipo: 'metal', d: cantos([[x1 - 14, solo - 12, 1.2], [x1 + 2.2, solo - 12.5, 1.6], [x1 + 2.2, solo - 8, 1.6], [x1 - 14, solo - 8.6, 1.2]]), cor: '#dcd9d3', marca: 'cromado' }
  ] : [
    { tipo: 'linha', d: `M${f(x0 + 0.6)} ${f(yPcT)}H${f(eT - meia(yPcT) - 1.2)}M${f(eD + meia(yPcD) + 1.2)} ${f(yPcD)}H${f(x1 - 0.2)}`, larg: 0.8, cor: escurecer(pintura, 0.28), fino: true, marca: 'para-choque' },
    { tipo: 'massa', d: cantos([[x1 - 12, solo - 7.4, 1.4], [x1 - 0.4, solo - 8.4, 1.4], [x1 + 0.2, solo - 2.6, 1.2], [x1 - 11, solo - 2.2, 1.2]]), cor: '#27282b', semVolume: true, marca: 'entrada-de-ar' }
  ];

  // Os faróis.
  const yCapo = (xx: number) => yEmX([pb, capoBase], bico, xx);
  const LUZ = '#f2ead2';
  const farolPecas = (): Peca[] => {
    switch (p.farol) {
      case 'redondo': return [{ tipo: 'metal', d: circulo(x1 - 4.4, capo + 7.4, 4.9), cor: '#d9d6d0', marca: 'aro-do-farol' }, { tipo: 'luz', d: circulo(x1 - 4.2, capo + 7.4, 3.7), cor: LUZ, marca: 'farol' }];
      case 'alto': return [{ tipo: 'luz', d: ret(x1 - 10.5, capo + 3, 10, 5.6, 1.6), cor: LUZ, marca: 'farol' }];
      case 'quadrado': return [{ tipo: 'luz', d: ret(x1 - 6.5, capo + 3.4, 6.6, 6.4, 1), cor: LUZ, marca: 'farol' }];
      case 'paralama': {
        const cx = Math.min(x1 - nariz - 3, eD + R * 0.5), yy = (p.paralamaSolto ? cy - R - 3.2 : yCapo(cx)) - 0.8;
        return [{ tipo: 'massa', d: suave([[cx - 6.5, yy + 2.4], [cx - 3, yy - 2.6], [cx + 3.4, yy - 2.8], [cx + 6.6, yy + 1.6], [cx + 2, yy + 3.6]], true, 0.5), cor: pintura, marca: 'casco-do-farol' }, { tipo: 'luz', d: suave([[cx + 1.4, yy - 1.8], [cx + 5.6, yy + 0.6], [cx + 4.2, yy + 3], [cx + 1, yy + 1]], true, 0.5), cor: LUZ, marca: 'farol' }];
      }
      case 'escamoteavel': {
        const yy = yCapo(x1 - nariz - 14);
        return [{ tipo: 'linha', d: `M${f(x1 - nariz - 22)} ${f(yCapo(x1 - nariz - 22) + 0.6)}L${f(x1 - nariz - 7)} ${f(yy + 1.8)}`, larg: 0.9, cor: escurecer(pintura, 0.35), marca: 'farol-escamoteavel' }, { tipo: 'luz', d: ret(x1 - 7.6, capo + 5.6, 7, 2.6, 1), cor: '#e9b44c', marca: 'farol' }];
      }
      case 'gota': return [{ tipo: 'vidro', d: suave([[x1 - nariz - 18, yCapo(x1 - nariz - 18) + 1.2], [x1 - nariz - 2, capo + 0.6], [x1 - 1.5, capo + 4.6], [x1 - nariz - 6, capo + 4]], true, 0.5), claro: true, marca: 'carenagem-do-farol' }, { tipo: 'luz', d: circulo(x1 - nariz - 2, capo + 2.6, 2.2), cor: LUZ, marca: 'farol' }];
      default: return [{ tipo: 'luz', d: cantos([[x1 - nariz - 9, yCapo(x1 - nariz - 9) + 2, 1.2], [x1 - 1, capo + 4.4, 1.4], [x1 - 1.6, capo + 7.4, 1.4], [x1 - nariz - 7, yCapo(x1 - nariz - 7) + 4.6, 1.2]]), cor: LUZ, marca: 'farol' }];
    }
  };
  // As lanternas.
  const yLt = p.traseira === 'cacamba' ? cint : tras;
  const VERM = '#c8372d';
  const aleta = p.extras?.aletas ?? 4;
  const lanterna = (): Peca[] => {
    switch (p.lanterna) {
      case 'fina': return [{ tipo: 'luz', d: cantos([[x0 + 0.4, yLt + 2.4, 1], [x0 + 13, yLt + 1.8, 1.2], [x0 + 12, yLt + 4.8, 1.2], [x0 + 0.4, yLt + 5.6, 1]]), cor: VERM, marca: 'lanterna' }];
      case 'vertical': return [{ tipo: 'luz', d: ret(x0 + 0.2, yLt - (p.traseira === 'caixa' || p.traseira === 'hatch' ? 6 : 0) + 1, 4, 13, 1.2), cor: VERM, marca: 'lanterna' }];
      case 'redonda': return [{ tipo: 'luz', d: circulo(x0 + 3.6, yLt + 4.2, 3), cor: VERM, marca: 'lanterna' }];
      case 'barra': return [{ tipo: 'luz', d: cantos([[x0 - 0.2, yLt + 1.6, 1], [x0 + 20, yLt + 1.4, 1], [x0 + 20, yLt + 3.4, 1], [x0 - 0.2, yLt + 3.8, 1]]), cor: VERM, marca: 'lanterna' }];
      case 'aleta': return [{ tipo: 'luz', d: suave([[x0 - 0.5, tras - aleta + 3], [x0 + 4, tras - aleta + 2.4], [x0 + 3.4, tras - aleta + 5.4], [x0 - 0.2, tras - aleta + 6]], true, 0.5), cor: VERM, marca: 'lanterna' }];
      default: return [{ tipo: 'luz', d: ret(x0 + 0.6, yLt + 3, 4.6, 7, 1), cor: VERM, marca: 'lanterna' }];
    }
  };

  // O vinco da lateral (acima dos arcos) e o reflexo do ombro.
  const yV = Math.min(cint + 6, cy - R - 1.2);
  // Onde a linha encontra o capô (o bico baixo do esportivo fica abaixo dela) e a traseira (a que cai antes).
  const ateCapo = (y: number) => (capo <= y ? x1 - nariz - 3 : capoBase >= y ? pb - 6 : pb + ((y - capoBase) / (capo - capoBase)) * (bico[0] - pb) - 4);
  const desdeTras = (y: number) => (tras > y ? xEmY(Dp, C, y) + 4 : x0 + 4);
  const vinco: Peca[] = [
    { tipo: 'linha', d: `M${f(desdeTras(yV))} ${f(yV + 0.8)}Q${f((x0 + x1) / 2)} ${f(yV - 0.4)} ${f(ateCapo(yV))} ${f(yV + 0.6)}`, larg: 0.7, cor: escurecer(pintura, 0.22), fino: true, marca: 'vinco' },
    { tipo: 'linha', d: `M${f(desdeTras(yV - 2) + 6)} ${f(yV - 1.6)}Q${f((x0 + x1) / 2)} ${f(yV - 2.8)} ${f(ateCapo(yV - 2) - 6)} ${f(yV - 1.4)}`, larg: 1, cor: clarear(pintura, 0.32), fino: true, marca: 'reflexo' }
  ];

  const pecas: Peca[] = [
    { tipo: 'massa', d: corpo, cor: pintura, marca: 'lataria', ...(visual?.acabamento ? { semVolume: visual.acabamento === 'fosco' || visual.acabamento === 'acetinado', attrs: { 'data-acabamento': visual.acabamento } } : {}) },
    // A caixa de roda escura e, embaixo, o assoalho entre as rodas.
    ...[eT, eD].map(xx => { const h = meia(solo) - 0.6; return { tipo: 'massa' as const, d: `M${f(xx - h)} ${f(solo)}A${f(R - 0.6)} ${f(R - 0.6)} 0 ${solo > cy ? 1 : 0} 1 ${f(xx + h)} ${f(solo)}Z`, cor: '#1f1d1b', semVolume: true, marca: 'caixa-de-roda' }; }),
    { tipo: 'massa', d: ret(eT + meia(solo) - 1, solo - 0.4, eD - eT - 2 * meia(solo) + 2, 2.4, 1), cor: '#2a2725', semVolume: true, marca: 'assoalho' },
    // O teto de outra cor, a capota de lona.
    ...(!p.semTeto && (p.tetoCor || p.capota) ? [{ tipo: 'massa' as const, d: p.capota ? cantos([[xEmY(C, Dp, yTop + 0.4), yTop + 0.4, 0], [C[0], teto, teto2[0][2]], [tD, teto, teto2[1][2]], [xEmY(A, B, yTop + 0.4), yTop + 0.4, 0]])
      // O teto de outra cor leva as colunas junto (como sai da fábrica): da cintura de trás à da frente, por cima dos vidros.
      : cantos([[xEmY(C, Dp, cintT) + 0.6, cintT, 0], [C[0], teto, teto2[0][2]], [tD, teto, teto2[1][2]], [xEmY(A, B, cint) - 0.6, cint, 0]]), cor: p.capota ?? p.tetoCor!, semVolume: !!p.tetoCor, marca: p.capota ? 'capota' : 'teto' }] : []),
    ...(p.capota && !p.semTeto ? [{ tipo: 'linha' as const, d: [0.3, 0.55, 0.8].map(t => { const xx = tTop[0] + (fT[0] - tTop[0]) * t; return `M${f(xx)} ${f(teto + 0.8)}l0.5 ${f(esp - 0.4)}`; }).join(''), larg: 0.6, cor: escurecer(p.capota, 0.4), fino: true }] : []),
    // A moldura dos vidros e os vidros.
    ...(dlo.length ? [{ tipo: 'massa' as const, d: poligono(dlo), cor: corMoldura, semVolume: true, marca: 'moldura' }] : []),
    ...vidros.map(q => ({ tipo: 'vidro' as const, d: poligono(q), marca: 'vidro' })),
    // O conversível sem teto: o para-brisa baixo, os encostos atrás dos bancos.
    ...(p.semTeto ? [
      { tipo: 'vidro' as const, d: poligono([[pb - 1, capoBase - 0.2], [pb - 9, cint - 11], [pb - 11, cint - 10.4], [pb - 4, capoBase + 0.4]]), claro: true, marca: 'para-brisa' },
      { tipo: 'massa' as const, d: suave([[tT - 4, cint - 1], [tT + 2, cint - 7.5], [tT + 12, cint - 6], [tT + 16, cint - 1]], true, 0.5), cor: pintura, marca: 'encosto' },
      { tipo: 'linha' as const, d: `M${f(tT + 14)} ${f(cint - 1.2)}H${f(pb - 6)}`, larg: 1.6, cor: '#3b2a20', marca: 'cabine' }
    ] : []),
    // As portas, as maçanetas, o retrovisor.
    { tipo: 'linha', d: cortesPorta.map(linhaPorta).join(''), larg: 0.85, cor: escurecer(pintura, 0.42), marca: 'porta' },
    { tipo: 'massa', d: macanetas, cor: p.moldura === 'cromo' ? '#d9d6d0' : escurecer(pintura, 0.25), semVolume: true, fino: true, marca: 'macaneta' },
    ...espelho,
    ...paraChoques,
    ...vinco,
    ...farolPecas(),
    ...lanterna()
  ];
  // A grade cromada (os de luxo), a guelra no para-lama, a entrada de ar lateral, a saia, o difusor, as ponteiras.
  if (p.grade) pecas.push({ tipo: 'metal', d: cantos([[x1 - 2.4, capo + 2.6, 0.8], [x1 + 1, capo + 3, 0.8], [x1 + 1.2, solo - 13.5, 0.8], [x1 - 2, solo - 13, 0.8]]), cor: '#dcd9d3', marca: 'grade' });
  if (p.guelra) pecas.push({ tipo: 'linha', d: `M${f(eD - R - 2)} ${f(yV + 3)}l-3 5M${f(eD - R - 5)} ${f(yV + 3)}l-3 5`, larg: 1.3, cor: escurecer(pintura, 0.5), marca: 'guelra' });
  if (p.entrada) pecas.push({ tipo: 'massa', d: cantos([[eT + R + 1, yV + 1, 2], [eT + R + 15, yV, 2], [eT + R + 10, yV + 7, 2], [eT + R + 1, yV + 6, 2]]), cor: '#232427', semVolume: true, marca: 'entrada-lateral' });
  if (p.saia) pecas.push({ tipo: 'massa', d: cantos([[eT + meia(solo - 3.4) + 1, solo - 3.4, 1], [eD - meia(solo - 3.4) - 1, solo - 3.8, 1], [eD - meia(solo) - 1, solo + 0.4, 1], [eT + meia(solo) + 1, solo + 0.4, 1]]), cor: '#232427', semVolume: true, marca: 'saia' });
  const esc = visual?.escape ? 1 : 0;
  const ponteiras = (p.ponteiras ?? 0) + 2 * esc;
  if (p.difusor || ponteiras) pecas.push({ tipo: 'massa', d: ret(x0 - 0.4, solo - 4.4, 13, 4.4, 1.2), cor: '#27282b', semVolume: true, marca: 'difusor' });
  if (ponteiras) pecas.push({ tipo: 'metal', d: ret(x0 - 1.6 - esc, solo - 3.6, 4.2 + 2 * esc, 2.4 + 0.6 * esc, 1.1) + (ponteiras > 2 ? ret(x0 + 5, solo - 3.4, 4, 2.4, 1.1) : ''), cor: '#c9c6c0', marca: esc ? 'ponteira-esportiva' : 'ponteira' });
  if (p.barbatana && !p.semTeto) pecas.push({ tipo: 'massa', d: `M${f(tTop[0] + 4)} ${f(teto + 0.6)}L${f(tTop[0] + 7)} ${f(teto - 2.4)}L${f(tTop[0] + 10)} ${f(teto + 0.6)}Z`, cor: '#232427', semVolume: true, so3: true, marca: 'antena' });

  // Os para-lamas soltos (o Fusca, o 2CV): a concha sobre cada roda e o estribo entre elas.
  if (p.paralamaSolto) {
    const fender = (cx: number, daFrente: boolean): Peca[] => [
      { tipo: 'massa', d: suave(daFrente
        ? [[cx - R - 1.5, cy + 2], [cx - R + 2, cy - R + 2], [cx + 3, cy - R - 3.8], [cx + R + 4, cy - R + 4], [cx + R + 8, cy + 1.6], [cx, cy + 2.4]]
        : [[cx - R - 7, cy + 1.6], [cx - R - 3, cy - R + 4], [cx - 3, cy - R - 3.8], [cx + R - 2, cy - R + 2], [cx + R + 1.5, cy + 2], [cx, cy + 2.4]], true, 0.5), cor: pintura, marca: 'paralama' },
      { tipo: 'massa', d: `M${f(cx - R + 0.4)} ${f(cy + 2.2)}A${f(R - 0.4)} ${f(R - 0.4)} 0 0 1 ${f(cx + R - 0.4)} ${f(cy + 2.2)}Z`, cor: '#1f1d1b', semVolume: true }
    ];
    pecas.push(...fender(eT, false), ...fender(eD, true), { tipo: 'massa', d: ret(eT + R + 1, cy + 0.4, eD - eT - 2 * R - 2, 2.8, 1), cor: '#2b2826', semVolume: true, marca: 'estribo' });
  }

  // VIDA 12.9: o reflexo do acabamento, a película, o que é do modelo e o que a pessoa pôs.
  pecas.push(...brilhoDoAcabamento(p, pintura, visual, corpo), ...(visual?.pelicula ? peliculaSobre(pecas.filter(x => x.tipo === 'vidro')) : []), ...extrasDoCarro(p, pintura, visual, { cy, R }));
  // O rack, o plástico dos para-lamas (cava), o estribo, a caçamba e o santo-antônio, a tomada.
  if (p.rack && !p.semTeto) pecas.splice(1, 0, { tipo: 'metal', d: `${ret(tTop[0] + 1, teto - 3.4, Math.max(10, fT[0] - tTop[0] - 2), 2.2, 1)}${ret(tTop[0] + 2, teto - 1.6, 2, 2, 0.4)}${ret(fT[0] - 3, teto - 1.6, 2, 2, 0.4)}`, cor: '#4a4643', marca: 'rack' });
  if (p.cava) for (const xx of [eT, eD]) { const h1 = meia(solo + 0.6, R + 2.2), h2 = meia(solo + 0.6, R); pecas.push({ tipo: 'massa', d: `M${f(xx - h1)} ${f(solo + 0.6)}A${f(R + 2.2)} ${f(R + 2.2)} 0 ${solo > cy ? 1 : 0} 1 ${f(xx + h1)} ${f(solo + 0.6)}L${f(xx + h2)} ${f(solo + 0.6)}A${f(R)} ${f(R)} 0 ${solo > cy ? 1 : 0} 0 ${f(xx - h2)} ${f(solo + 0.6)}Z`, cor: '#34312e', semVolume: true, marca: 'cava' }); }
  if (p.estribo && !p.paralamaSolto) pecas.push({ tipo: 'metal', d: ret(eT + meia(solo) + 2, solo + 1, eD - eT - 2 * meia(solo) - 4, 2.6, 1), cor: '#3d3a37', marca: 'estribo' });
  if (p.traseira === 'cacamba') pecas.push({ tipo: 'linha', d: `M${f(x0 + 3)} ${f(cint + 3.4)}H${f(v - 3)}M${f(x0 + 2.6)} ${f(cint + 1)}V${f(solo - 7)}`, larg: 1.1, cor: escurecer(pintura, 0.4), marca: 'cacamba' });
  if (p.santoAntonio) pecas.push({ tipo: 'metal', d: `M${f(v - 2)} ${f(cint)}V${f((teto + cint) / 2)}h-22V${f(cint)}h2.6V${f((teto + cint) / 2 + 2.6)}h16.8V${f(cint)}z`, cor: '#3d3a37', marca: 'santo-antonio' });
  if (p.tomada) pecas.push({ tipo: 'linha', d: `M${f(x0 + 18)} ${f(cint + 4)}h6v3h-6z`, larg: 0.8, so3: true });

  // As rodas: o desenho do modelo, ou o que a pessoa pôs; o pneu de perfil baixo; a faixa branca dos antigos.
  pecas.push(...[eT, eD].map((cx): Peca => (visual?.roda
    ? { tipo: 'pneu', cx, cy, r, aro: visual.roda.estilo, raios: visual.roda.raios, corAro: visual.roda.cor, aroMaior: visual.roda.aroMaior || p.perfilBaixo, marca: 'roda' }
    : { tipo: 'pneu', cx, cy, r, aro: p.rodas ?? 'liga', raios: p.raios, ...(p.corAro ? { corAro: p.corAro } : {}), aroMaior: p.perfilBaixo, marca: 'roda' })));
  if (p.faixaBranca && !visual?.roda) for (const cx of [eT, eD]) pecas.push({ tipo: 'massa', d: `${circulo(cx, cy, r * 0.86)}M${f(cx + r * 0.66)} ${f(cy)}a${f(r * 0.66)} ${f(r * 0.66)} 0 1 1 ${f(-r * 1.32)} 0a${f(r * 0.66)} ${f(r * 0.66)} 0 1 1 ${f(r * 1.32)} 0z`, cor: '#f1eee7', semVolume: true, marca: 'faixa-branca' });

  // O estado: o zero tem brilho; o usado, riscos; o cansado, pintura gasta e ferrugem (sempre com o texto ao lado).
  if (estado !== undefined && estado >= 90) pecas.push({ tipo: 'linha', d: `M${f(x0 + 14)} ${f(cint + 3)}q${f((x1 - x0) * 0.3)} -3 ${f((x1 - x0) * 0.5)} -1.6`, larg: 1, cor: '#fffaf0', marca: 'brilho', fino: true });
  if (estado !== undefined && estado < 60) pecas.push({ tipo: 'linha', d: `M${f(eT + 18)} ${f(cint + 9)}l9 -2M${f(eD - 30)} ${f(cint + 8)}l7 3`, larg: 0.9, cor: '#fffaf0', marca: 'riscos', fino: true });
  if (estado !== undefined && estado < 40) pecas.push({ tipo: 'massa', d: `M${f(eT + R + 6)} ${f(solo - 7)}a3.2 2 0 1 0 6.4 0a3.2 2 0 1 0-6.4 0M${f(eD - R - 10)} ${f(solo - 9)}a2.4 1.6 0 1 0 4.8 0a2.4 1.6 0 1 0-4.8 0`, cor: '#8a5434', semVolume: true, marca: 'ferrugem' });
  return { vb: [240, 132], chao: CHAO, sombra: [(x0 + x1) / 2, (x1 - x0) / 2 + 3], pecas };
}

export const escuroDe = (cor: string) => escurecer(cor, 0.25);
