/**
 * VIDA 14 — o kit 2.5D das casas (a área de fora como um CONJUNTO): uma projeção oblíqua única para tudo o que está na
 * cena (o corpo da casa, o telhado, a garagem, o muro, a calçada, a rua), em METROS, com a luz vindo do alto à esquerda.
 *
 *   x → ao longo da rua (para a direita), z → do alinhamento do lote para os fundos, h → altura.
 *   Na tela: a frente das coisas é chapada; o lado direito e o alto aparecem (a profundidade sobe para a direita).
 *   A face da frente é a iluminada; o lado direito, na sombra própria; a sombra projetada cai no chão, para a direita
 *   e para trás; o beiral faz uma faixa de sombra na parede.
 *
 * Cada plano (a frente de um volume, o lado, o chão) é um GRUPO com a transformação afim do plano: o detalhe dentro
 * dele (o tijolo, a janela, a ripa, a junta da calçada) é desenhado em metros, na coordenada do próprio plano
 * (u para a direita/para trás, v para baixo a partir do topo). O fio continua constante na tela (non-scaling-stroke).
 */
import { circulo, clarear, escurecer, misturar, num, ret, suave, type Peca, type Pt } from '../../ilustracao/nucleo';

export const KX = 0.38, KY = 0.42;
export interface Vista { S: number; OX: number; GY: number }
export const pt = (v: Vista, x: number, z: number, h: number): Pt => [v.OX + v.S * (x + z * KX), v.GY - v.S * (h + z * KY)];
const mat = (a: number, b: number, c: number, d: number, e: number, f: number) => `matrix(${[a, b, c, d, e, f].map(n => Math.round(n * 1000) / 1000).join(' ')})`;
/** O plano da frente (z constante), origem em (x0, z, hTopo): u → +x, v → para baixo. */
export const frontal = (v: Vista, x0: number, z: number, hTopo: number) => { const [e, f] = pt(v, x0, z, hTopo); return mat(v.S, 0, 0, v.S, e, f); };
/** O plano do lado direito (x constante), origem em (x, z0, hTopo): u → para trás (+z), v → para baixo. */
export const lateral = (v: Vista, x: number, z0: number, hTopo: number) => { const [e, f] = pt(v, x, z0, hTopo); return mat(v.S * KX, -v.S * KY, 0, v.S, e, f); };
/** O plano horizontal (h constante), origem em (x0, z0, h): u → +x, v → para trás (+z). */
export const horizontal = (v: Vista, x0: number, z0: number, h: number) => { const [e, f] = pt(v, x0, z0, h); return mat(v.S, 0, v.S * KX, -v.S * KY, e, f); };
export const poli = (v: Vista, pts: [number, number, number][]) => `M${pts.map(([x, z, h]) => pt(v, x, z, h).map(num).join(' ')).join('L')}Z`;
export const grupo = (t: string, pecas: Peca[], classe?: string, attrs?: Record<string, string>): Peca => ({ tipo: 'grupo', t, pecas, classe, attrs });
export const marcado = (classe: string | undefined, attrs: Record<string, string> | undefined, pecas: Peca[]): Peca => ({ tipo: 'grupo', t: '', pecas, classe, attrs });
const R = (x: number, y: number, w: number, h: number, r = 0.03) => ret(x, y, w, h, r);

/* ============================================================== Cores e luz */

export const COR = {
  telha: '#b4603f', telhaEscura: '#6b4a3c', ardosia: '#56534f', laje: '#bdb7ab', concreto: '#c9c3b8', madeira: '#7a4f2e',
  folha: '#5f8a48', folhaClara: '#86ad5c', folhaEscura: '#3f6534', tronco: '#6e4a30', luz: '#f6d77e', metal: '#8d8a85',
  vidro: '#7f9cad', asfalto: '#5b5856', calcada: '#cfc8bb', meioFio: '#e2ddd3', grama: '#88ad62', gramaEscura: '#6f9450',
  terra: '#b39a74', branco: '#efeae0', esquadria: '#ece7dc', aluminioPreto: '#2f3133', agua: '#6fb6cf', tijolo: '#b06a4c'
};
/** A sombra própria (o lado direito, longe da luz) e a face de cima. */
export const sombraPropria = (c: string) => escurecer(c, 0.22);
export const faceDeCima = (c: string) => clarear(c, 0.08);
const SOMBRA = '#1b1814';
export const sombra = (d: string, opacidade = 0.2, marca = 'sombra'): Peca => ({ tipo: 'massa', d, cor: SOMBRA, opacidade, semVolume: true, semContorno: true, marca });
export const brilho = (d: string, cor = COR.luz, opacidade = 0.22): Peca => ({ tipo: 'massa', d, cor, opacidade, semVolume: true, semContorno: true, marca: 'brilho' });
export const chapado = (d: string, cor: string, marca?: string): Peca => ({ tipo: 'massa', d, cor, semVolume: true, marca });

/* ============================================================== Volumes */

export interface Bloco { x0: number; x1: number; z0: number; z1: number; h0?: number; h1: number }
/** A luz: a sombra projetada de uma altura h anda (LX·h, LZ·h) no chão. */
export const LX = 0.5, LZ = 0.32;
/** A sombra projetada de um bloco no chão (a pegada varrida pela luz), em h = 0. */
export function sombraDoBloco(v: Vista, b: Bloco, alt = b.h1, opacidade = 0.2): Peca {
  const dx = alt * LX, dz = alt * LZ;
  return sombra(poli(v, [[b.x0, b.z0, 0], [b.x1, b.z0, 0], [b.x1 + dx, b.z0 + dz, 0], [b.x1 + dx, b.z1 + dz, 0], [b.x0 + dx, b.z1 + dz, 0], [b.x0, b.z1, 0]]), opacidade);
}
export interface Parede { cor: string; textura?: Textura; corTextura?: string; soclo?: number; corSoclo?: string; semLado?: boolean; semTopo?: boolean; corTopo?: string }
/** As paredes de um bloco: o lado direito (sombra própria), o topo (quando é laje à vista) e a frente. `frente` desenha por cima da fachada (janelas, porta). */
export function bloco(v: Vista, b: Bloco, p: Parede, lado: Peca[] = []): Peca[] {
  const h0 = b.h0 ?? 0, H = b.h1 - h0, U = b.x1 - b.x0, D = b.z1 - b.z0;
  const ladoCor = sombraPropria(p.cor);
  const veio = p.corTextura ?? escurecer(p.cor, 0.24);
  const soclo = p.soclo ?? 0;
  const out: Peca[] = [];
  if (!p.semLado) out.push(grupo(lateral(v, b.x1, b.z0, b.h1), [
    chapado(R(0, 0, D, H), ladoCor, 'parede-lado'),
    ...(p.textura ? textura(p.textura, D, H - soclo, escurecer(veio, 0.15), 'lado') : []),
    ...(soclo ? [chapado(R(0, H - soclo, D, soclo), escurecer(p.corSoclo ?? p.cor, 0.38))] : []),
    ...lado,
    sombra(R(0, H - 0.25, D, 0.25, 0), 0.14, 'ao')
  ]));
  if (!p.semTopo) out.push({ tipo: 'massa', d: poli(v, [[b.x0, b.z0, b.h1], [b.x1, b.z0, b.h1], [b.x1, b.z1, b.h1], [b.x0, b.z1, b.h1]]), cor: p.corTopo ?? faceDeCima(p.cor), semVolume: true, marca: 'topo' });
  out.push(grupo(frontal(v, b.x0, b.z0, b.h1), [
    { tipo: 'massa', d: R(0, 0, U, H), cor: p.cor, marca: 'parede' },
    ...(p.textura ? textura(p.textura, U, H - soclo, veio, 'frente') : []),
    ...(soclo ? [chapado(R(0, H - soclo, U, soclo), escurecer(p.corSoclo ?? p.cor, 0.25), 'soclo')] : []),
    sombra(R(0, H - 0.22, U, 0.22, 0), 0.1, 'ao')
  ]));
  return out;
}

/* ============================================================== Texturas (no plano: u, v em metros) */

export type Textura = 'tijolo' | 'ripado' | 'pedra' | 'placas' | 'textura' | 'tabuas' | 'blocos' | 'pastilha';
export function textura(t: Textura, U: number, V: number, cor: string, onde = 'frente'): Peca[] {
  const d: string[] = [];
  if (t === 'tijolo') {
    for (let k = 0, y = 0.2; y < V - 0.05; k++, y += 0.2) { d.push(`M0 ${num(y)}H${num(U)}`); for (let x = k % 2 ? 0.15 : 0.3; x < U - 0.05; x += 0.3) d.push(`M${num(x)} ${num(y)}v-0.2`); }
    return [marcado('cena__tijolo', { 'data-detalhe': 'tijolo' }, [{ tipo: 'linha', d: d.join(''), larg: 0.45, cor, fino: true }])];
  }
  if (t === 'ripado') for (let x = 0.12; x < U; x += 0.12) d.push(`M${num(x)} 0V${num(V)}`);
  if (t === 'tabuas') for (let y = 0.22; y < V; y += 0.22) d.push(`M0 ${num(y)}H${num(U)}`);
  if (t === 'placas' || t === 'blocos') { const p = t === 'placas' ? 0.9 : 0.4; for (let x = p; x < U; x += p) d.push(`M${num(x)} 0V${num(V)}`); for (let y = p * (t === 'placas' ? 1.3 : 0.5); y < V; y += p * (t === 'placas' ? 1.3 : 0.5)) d.push(`M0 ${num(y)}H${num(U)}`); }
  if (t === 'pastilha') { for (let x = 0.25; x < U; x += 0.25) d.push(`M${num(x)} 0V${num(V)}`); for (let y = 0.25; y < V; y += 0.25) d.push(`M0 ${num(y)}H${num(U)}`); }
  if (t === 'pedra') for (let k = 0, y = 0.16; y < V; k++, y += 0.16) { d.push(`M0 ${num(y)}H${num(U)}`); for (let x = (k * 0.37) % 0.6 + 0.1; x < U; x += 0.45 + ((k * 7 + Math.floor(x * 10)) % 5) * 0.08) d.push(`M${num(x)} ${num(y)}v-0.16`); }
  if (t === 'textura') for (let k = 0; k < U * V * 1.6; k++) { const x = ((k * 0.618) % 1) * U, y = ((k * 0.414 + k * k * 0.0007) % 1) * V; d.push(`M${num(x)} ${num(y)}l0.18 0.05`); }
  return d.length ? [{ tipo: 'linha', d: d.join(''), larg: t === 'ripado' ? 0.55 : 0.45, cor, fino: true, marca: `textura-${t}`, attrs: { 'data-onde': onde } }] : [];
}

/* ============================================================== Telhados */

export interface Telha { cor: string; beiral?: number; fiadas?: boolean }
const fiadasEntre = (v: Vista, a0: [number, number, number], a1: [number, number, number], b0: [number, number, number], b1: [number, number, number], passo: number, cor: string): Peca => {
  // Linhas de a0→b0 até a1→b1 (as fiadas da telha descendo a água).
  const L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
  const n = Math.max(1, Math.floor(L / passo));
  const d: string[] = [];
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const p = a0.map((c, i) => c + (a1[i] - c) * t) as [number, number, number], q = b0.map((c, i) => c + (b1[i] - c) * t) as [number, number, number];
    const P = pt(v, ...p), Q = pt(v, ...q);
    d.push(`M${num(P[0])} ${num(P[1])}L${num(Q[0])} ${num(Q[1])}`);
  }
  return { tipo: 'linha', d: d.join(''), larg: 0.45, cor, fino: true, marca: 'fiadas' };
};
/** Duas águas com a cumeeira paralela à rua: a água da frente, a empena (oitão) no lado direito, a água de trás espiando. */
export function duasAguas(v: Vista, b: Bloco, alt: number, t: Telha, corEmpena: string): Peca[] {
  const o = t.beiral ?? 0.6, zm = (b.z0 + b.z1) / 2, hp = b.h1, hr = hp + alt;
  const queda = (o * alt) / (zm - b.z0), he = hp - queda;
  const x0 = b.x0 - o, x1 = b.x1 + o;
  const frente = t.cor, tras = escurecer(t.cor, 0.3);
  return [
    { tipo: 'massa', d: poli(v, [[x0, b.z1 + o, he], [x1, b.z1 + o, he], [x1, zm, hr], [x0, zm, hr]]), cor: tras, semVolume: true, marca: 'telhado-tras' },
    { tipo: 'massa', d: poli(v, [[b.x1, b.z0, hp], [b.x1, zm, hr], [b.x1, b.z1, hp]]), cor: sombraPropria(corEmpena), semVolume: true, marca: 'empena' },
    sombra(poli(v, [[b.x1, b.z0, hp], [b.x1, zm, hr], [b.x1, zm, hr - 0.3], [b.x1, b.z0, hp - 0.3]]), 0.22),
    { tipo: 'massa', d: poli(v, [[x0, b.z0 - o, he], [x1, b.z0 - o, he], [x1, zm, hr], [x0, zm, hr]]), cor: frente, marca: 'telhado' },
    ...(t.fiadas !== false ? [fiadasEntre(v, [x0, b.z0 - o, he], [x1, b.z0 - o, he], [x0, zm, hr], [x1, zm, hr], 0.42, escurecer(frente, 0.25)), fiadasEntre(v, [x0, b.z0 - o, he], [x0, zm, hr], [x1, b.z0 - o, he], [x1, zm, hr], 0.5, escurecer(frente, 0.16))] : []),
    // A testeira (a borda da telha na frente) e a cumeeira.
    { tipo: 'massa', d: poli(v, [[x0, b.z0 - o, he], [x1, b.z0 - o, he], [x1, b.z0 - o, he - 0.14], [x0, b.z0 - o, he - 0.14]]), cor: escurecer(frente, 0.12), semVolume: true, marca: 'testeira' },
    { tipo: 'massa', d: poli(v, [[x1, b.z0 - o, he], [x1, zm, hr], [x1 + 0.02, zm, hr - 0.16], [x1 + 0.02, b.z0 - o, he - 0.16]]), cor: escurecer(frente, 0.3), semVolume: true, marca: 'beira' },
    { tipo: 'linha', d: `M${pt(v, x0, zm, hr).map(num).join(' ')}L${pt(v, x1, zm, hr).map(num).join(' ')}`, larg: 1.2, cor: escurecer(frente, 0.35), marca: 'cumeeira' }
  ];
}
/** Duas águas com a empena virada para a rua (o frontão na fachada) e as duas águas correndo para os fundos. */
export function frontao(v: Vista, b: Bloco, alt: number, t: Telha, corParede: string): Peca[] {
  const o = t.beiral ?? 0.5, xm = (b.x0 + b.x1) / 2, hp = b.h1, hr = hp + alt;
  const queda = (o * alt) / (xm - b.x0), he = hp - queda;
  const esq = t.cor, dir = escurecer(t.cor, 0.18);
  const U = b.x1 - b.x0;
  return [
    { tipo: 'massa', d: poli(v, [[b.x0 - o, b.z0 - o, he], [xm, b.z0 - o, hr], [xm, b.z1 + o, hr], [b.x0 - o, b.z1 + o, he]]), cor: esq, semVolume: true, marca: 'telhado' },
    { tipo: 'massa', d: poli(v, [[xm, b.z0 - o, hr], [b.x1 + o, b.z0 - o, he], [b.x1 + o, b.z1 + o, he], [xm, b.z1 + o, hr]]), cor: dir, marca: 'telhado' },
    ...(t.fiadas !== false ? [fiadasEntre(v, [xm, b.z0 - o, hr], [b.x1 + o, b.z0 - o, he], [xm, b.z1 + o, hr], [b.x1 + o, b.z1 + o, he], 0.42, escurecer(dir, 0.22))] : []),
    // O oitão da frente (o triângulo da parede) e a sombra da beira do telhado sobre ele.
    grupo(frontal(v, b.x0, b.z0, hr), [
      { tipo: 'massa', d: `M0 ${num(alt)}L${num(U / 2)} 0L${num(U)} ${num(alt)}Z`, cor: corParede, semVolume: true, marca: 'oitao' },
      sombra(`M0 ${num(alt)}L${num(U / 2)} 0L${num(U)} ${num(alt)}L${num(U - 0.5)} ${num(alt)}L${num(U / 2)} 0.32L0.5 ${num(alt)}Z`, 0.2)
    ]),
    // A beira da telha (as duas tábuas do frontão).
    { tipo: 'massa', d: poli(v, [[b.x0 - o, b.z0 - o, he], [xm, b.z0 - o, hr], [xm, b.z0 - o, hr - 0.2], [b.x0 - o, b.z0 - o, he - 0.2]]), cor: escurecer(esq, 0.1), semVolume: true, marca: 'beira' },
    { tipo: 'massa', d: poli(v, [[xm, b.z0 - o, hr], [b.x1 + o, b.z0 - o, he], [b.x1 + o, b.z0 - o, he - 0.2], [xm, b.z0 - o, hr - 0.2]]), cor: escurecer(esq, 0.2), semVolume: true, marca: 'beira' }
  ];
}
/** Quatro águas (o telhado da casa antiga e da casa clássica). */
export function quatroAguas(v: Vista, b: Bloco, alt: number, t: Telha): Peca[] {
  const o = t.beiral ?? 0.7, zm = (b.z0 + b.z1) / 2, hp = b.h1, hr = hp + alt;
  const d = (b.z1 - b.z0) / 2 + o, he = hp - (o * alt) / d;
  const x0 = b.x0 - o, x1 = b.x1 + o, z0 = b.z0 - o, z1 = b.z1 + o;
  const r0 = Math.min(x0 + d, (x0 + x1) / 2), r1 = Math.max(x1 - d, (x0 + x1) / 2);
  return [
    { tipo: 'massa', d: poli(v, [[x0, z1, he], [x1, z1, he], [r1, zm, hr], [r0, zm, hr]]), cor: escurecer(t.cor, 0.32), semVolume: true, marca: 'telhado-tras' },
    { tipo: 'massa', d: poli(v, [[x0, z0, he], [r0, zm, hr], [x0, z1, he]]), cor: clarear(t.cor, 0.06), semVolume: true, marca: 'telhado' },
    { tipo: 'massa', d: poli(v, [[x1, z0, he], [x1, z1, he], [r1, zm, hr]]), cor: escurecer(t.cor, 0.24), semVolume: true, marca: 'telhado' },
    { tipo: 'massa', d: poli(v, [[x0, z0, he], [x1, z0, he], [r1, zm, hr], [r0, zm, hr]]), cor: t.cor, marca: 'telhado' },
    ...(t.fiadas !== false ? [fiadasEntre(v, [x0, z0, he], [x1, z0, he], [r0, zm, hr], [r1, zm, hr], 0.45, escurecer(t.cor, 0.22))] : []),
    { tipo: 'massa', d: poli(v, [[x0, z0, he], [x1, z0, he], [x1, z0, he - 0.16], [x0, z0, he - 0.16]]), cor: escurecer(t.cor, 0.15), semVolume: true, marca: 'testeira' },
    { tipo: 'linha', d: `M${pt(v, r0, zm, hr).map(num).join(' ')}L${pt(v, r1, zm, hr).map(num).join(' ')}`, larg: 1.2, cor: escurecer(t.cor, 0.38), marca: 'cumeeira' }
  ];
}
/** A laje com platibanda (a mureta que esconde a telha ou a laje): a mureta é da cor da parede; dentro, a laje. */
export function platibanda(v: Vista, b: Bloco, alt: number, cor: string, corLaje = COR.laje, rufo = true): Peca[] {
  const h0 = b.h1, h1 = b.h1 + alt, e = 0.15;
  return [
    ...bloco(v, { ...b, h0, h1 }, { cor, corTopo: escurecer(corLaje, 0.06) }),
    { tipo: 'massa', d: poli(v, [[b.x0 + e, b.z0 + e, h1], [b.x1 - e, b.z0 + e, h1], [b.x1 - e, b.z1 - e, h1], [b.x0 + e, b.z1 - e, h1]]), cor: corLaje, semVolume: true, marca: 'laje' },
    sombra(poli(v, [[b.x0 + e, b.z0 + e, h1], [b.x1 - e, b.z0 + e, h1], [b.x1 - e, b.z0 + 0.7, h1], [b.x0 + e, b.z0 + 0.7, h1]]), 0.16),
    ...(rufo ? [{ tipo: 'massa' as const, d: poli(v, [[b.x0 - 0.05, b.z0 - 0.05, h1], [b.x1 + 0.05, b.z0 - 0.05, h1], [b.x1 + 0.05, b.z0 - 0.05, h1 - 0.1], [b.x0 - 0.05, b.z0 - 0.05, h1 - 0.1]]), cor: clarear(cor, 0.3), semVolume: true, marca: 'rufo' }] : [])
  ];
}
/** A laje fina em balanço (a casa moderna, a marquise): o beiral reto que faz sombra funda. */
export function lajeEmBalanco(v: Vista, b: Bloco, balanco: number, esp: number, cor = COR.branco): Peca[] {
  const bb: Bloco = { x0: b.x0 - balanco, x1: b.x1 + balanco, z0: b.z0 - balanco, z1: b.z1 + balanco * 0.5, h0: b.h1, h1: b.h1 + esp };
  return [...bloco(v, bb, { cor, corTopo: escurecer(cor, 0.08) })];
}
/** A faixa de sombra que o beiral faz na parede (z do plano da parede, a largura, a altura do topo e a profundidade da sombra). */
export const sombraDoBeiral = (v: Vista, x0: number, x1: number, z: number, hTopo: number, alt = 0.5, op = 0.22) =>
  grupo(frontal(v, x0, z, hTopo), [sombra(R(0, 0, x1 - x0, alt, 0), op, 'sombra-beiral')]);

/* ============================================================== Aberturas (no plano da frente: x e h do mundo) */

export interface OpJanela { acesa?: boolean; moldura?: string; grade?: boolean; venezianas?: string; folhas?: number; peitoril?: boolean; vidroClaro?: boolean; arco?: boolean; cor?: string; corDaLuz?: string }
/** Uma janela no plano z: (x, h) é o canto de baixo à esquerda do vão. Recuada (a sombra do vão no alto e à esquerda), com peitoril. */
export function janela(v: Vista, z: number, x: number, h: number, l: number, a: number, o: OpJanela = {}): Peca {
  const mold = o.moldura ?? COR.esquadria;
  const vidro: Peca = o.acesa ? { tipo: 'luz', d: R(0.05, 0.05, l - 0.1, a - 0.1), cor: o.corDaLuz ?? COR.luz, marca: 'janela' } : { tipo: 'vidro', d: R(0.05, 0.05, l - 0.1, a - 0.1), claro: o.vidroClaro, marca: 'janela' };
  const folhas = o.folhas ?? (l > 1.1 ? 2 : 1);
  const caixilho: string[] = [];
  for (let k = 1; k < folhas; k++) caixilho.push(`M${num((l * k) / folhas)} 0.05V${num(a - 0.05)}`);
  if (a > 1.1 && !o.vidroClaro) caixilho.push(`M0.05 ${num(a * 0.38)}H${num(l - 0.05)}`);
  const pecas: Peca[] = [
    ...(o.acesa ? [brilho(R(-0.35, -0.3, l + 0.7, a + 0.75, 0.3), o.corDaLuz ?? COR.luz, 0.16)] : []),
    ...(o.venezianas ? [chapado(R(-l / 2 - 0.08, -0.04, l / 2, a + 0.08), o.venezianas, 'veneziana'), chapado(R(l + 0.08, -0.04, l / 2, a + 0.08), o.venezianas, 'veneziana'),
      { tipo: 'linha' as const, d: [0.2, 0.4, 0.6, 0.8].map(t => `M${num(-l / 2)} ${num(a * t)}h${num(l / 2 - 0.16)}M${num(l + 0.16)} ${num(a * t)}h${num(l / 2 - 0.16)}`).join(''), larg: 0.45, cor: escurecer(o.venezianas, 0.3), fino: true }] : []),
    chapado(R(-0.06, -0.06, l + 0.12, a + 0.12), mold, 'moldura'),
    marcado(o.acesa ? 'cena__janela cena__janela--acesa' : 'cena__janela', undefined, [vidro]),
    // A sombra do vão: a verga e a ombreira da esquerda fazem sombra no vidro (a luz vem do alto à esquerda).
    sombra(`M0.05 0.05H${num(l - 0.05)}L${num(l - 0.15)} 0.17H0.17V${num(a - 0.15)}L0.05 ${num(a - 0.05)}Z`, o.acesa ? 0.1 : 0.28, 'vao'),
    ...(caixilho.length ? [{ tipo: 'linha' as const, d: caixilho.join(''), larg: 0.7, cor: o.cor ?? escurecer(mold, 0.08) }] : []),
    ...(o.grade ? [{ tipo: 'linha' as const, d: Array.from({ length: Math.max(1, Math.floor(l / 0.13)) }, (_, k) => `M${num(0.1 + k * 0.13)} 0.05V${num(a - 0.05)}`).join(''), larg: 0.55, cor: '#3d3a37', marca: 'grade' }] : []),
    ...(o.peitoril !== false ? [chapado(R(-0.12, a + 0.02, l + 0.24, 0.07, 0.01), clarear(mold, 0.2), 'peitoril'), sombra(R(-0.08, a + 0.09, l + 0.18, 0.12, 0), 0.14)] : [])
  ];
  return grupo(frontal(v, x, z, h + a), pecas, undefined, { 'data-peca': 'abertura' });
}
/** A porta (x, h = pé dela), 0,9 × 2,1 m por padrão, com o alizar, a maçaneta e a sombra do vão. */
export function porta(v: Vista, z: number, x: number, h: number, o: { l?: number; a?: number; cor?: string; vidro?: boolean; dupla?: boolean; alizar?: string } = {}): Peca {
  const l = o.l ?? 0.9, a = o.a ?? 2.1, cor = o.cor ?? COR.madeira;
  const pecas: Peca[] = [
    chapado(R(-0.08, -0.08, l + 0.16, a + 0.08), o.alizar ?? COR.esquadria, 'alizar'),
    o.vidro ? { tipo: 'vidro', d: R(0, 0, l, a), claro: true, marca: 'porta' } : { tipo: 'massa', d: R(0, 0, l, a), cor, marca: 'porta' },
    ...(!o.vidro ? [{ tipo: 'linha' as const, d: o.dupla ? `M${num(l / 2)} 0V${num(a)}M0.12 0.15h${num(l / 2 - 0.24)}v${num(a * 0.4)}h${num(-(l / 2 - 0.24))}zM${num(l / 2 + 0.12)} 0.15h${num(l / 2 - 0.24)}v${num(a * 0.4)}h${num(-(l / 2 - 0.24))}z` : `M0.14 0.18h${num(l - 0.28)}v${num(a * 0.36)}h${num(-(l - 0.28))}zM0.14 ${num(a * 0.6)}h${num(l - 0.28)}v${num(a * 0.3)}h${num(-(l - 0.28))}z`, larg: 0.5, cor: escurecer(cor, 0.3), fino: true }] : [{ tipo: 'linha' as const, d: `M${num(l / 2)} 0V${num(a)}`, larg: 0.7, cor: COR.aluminioPreto }]),
    { tipo: 'metal', d: circulo(o.dupla ? l / 2 - 0.1 : l - 0.12, a * 0.52, 0.04), cor: '#c9a23a', fino: true },
    sombra(`M0 0H${num(l)}L${num(l - 0.1)} 0.12H0.12V${num(a)}H0Z`, 0.3, 'vao')
  ];
  return grupo(frontal(v, x, z, h + a), pecas, undefined, { 'data-peca': 'entrada' });
}
/** Os degraus da porta até o chão: caixas que avançam para a rua (17 cm de espelho, 30 de piso). */
export function degraus(v: Vista, z: number, x0: number, x1: number, hTopo: number, cor = COR.concreto): Peca[] {
  const n = Math.max(1, Math.round(hTopo / 0.17));
  const out: Peca[] = [];
  for (let k = 0; k < n; k++) {
    const h1 = hTopo - k * (hTopo / n);
    out.push(...bloco(v, { x0: x0 - k * 0.15, x1: x1 + k * 0.15, z0: z - (k + 1) * 0.3, z1: z, h0: 0, h1 }, { cor }));
  }
  return [marcado(undefined, { 'data-detalhe': 'degraus' }, out)];
}

/* ============================================================== Chão (bandas horizontais) */

/** Um retângulo no chão (h = 0 ou outra altura), do x0 ao x1 e do z0 ao z1. */
export const noChao = (v: Vista, x0: number, x1: number, z0: number, z1: number, cor: string, marca?: string, h = 0, contorno = false): Peca =>
  ({ tipo: 'massa', d: poli(v, [[x0, z0, h], [x1, z0, h], [x1, z1, h], [x0, z1, h]]), cor, semVolume: true, semContorno: !contorno, marca });
/** Desenho no plano do chão (u → x, v → z), em metros. */
export const planoDoChao = (v: Vista, x0: number, z0: number, pecas: Peca[], h = 0) => grupo(horizontal(v, x0, z0, h), pecas);

/* ============================================================== Vegetação */

export interface OpArvore { copa?: string; alt?: number; r?: number; tronco?: string; frutas?: string; semSombra?: boolean; luzDeBaixo?: boolean; forma?: 'redonda' | 'alta' | 'conica' }
/** Uma árvore com volume: o tronco ancorado (com a raiz e a sombra no chão), a copa em massas — a de trás na sombra, a do meio, a luz do alto à esquerda. */
export function arvore(v: Vista, x: number, z: number, o: OpArvore = {}): Peca {
  const alt = o.alt ?? 5, r = o.r ?? alt * 0.36, cor = o.copa ?? COR.folha;
  const [bx, by] = pt(v, x, z, 0), S = v.S;
  const topoTronco = alt - r * 1.1;
  const rx = r * S, ry = r * S * 0.92, cy = by - (alt - r) * S;
  const forma = o.forma ?? 'redonda';
  const massas = (dx: number, dy: number, k: number) => suave([[bx + dx - rx * 0.62 * k, cy + dy + ry * 0.2 * k], [bx + dx - rx * 0.45 * k, cy + dy - ry * 0.5 * k], [bx + dx, cy + dy - ry * 0.68 * k], [bx + dx + rx * 0.5 * k, cy + dy - ry * 0.42 * k], [bx + dx + rx * 0.62 * k, cy + dy + ry * 0.18 * k], [bx + dx + rx * 0.2 * k, cy + dy + ry * 0.55 * k], [bx + dx - rx * 0.3 * k, cy + dy + ry * 0.5 * k]], true, 0.75);
  const pecas: Peca[] = [];
  if (!o.semSombra) pecas.push(sombra(`M${num(bx + 2)} ${num(by)}a${num(rx * 0.9)} ${num(S * r * KY * 0.9)} 0 1 0 ${num(rx * 1.8)} 0a${num(rx * 0.9)} ${num(S * r * KY * 0.9)} 0 1 0 ${num(-rx * 1.8)} 0z`, 0.2, 'sombra-arvore'));
  if (o.luzDeBaixo) pecas.push(brilho(`M${num(bx)} ${num(by)}L${num(bx - rx * 0.9)} ${num(cy - ry * 0.3)}L${num(bx + rx * 0.9)} ${num(cy - ry * 0.3)}Z`, COR.luz, 0.2));
  const tw = Math.max(0.9, 0.22 * S);
  pecas.push({ tipo: 'massa', d: `M${num(bx - tw * 1.3)} ${num(by)}Q${num(bx - tw * 0.5)} ${num(by - tw)} ${num(bx - tw * 0.5)} ${num(by - topoTronco * S * 0.4)}L${num(bx - tw * 0.35)} ${num(by - topoTronco * S - ry * 0.3)}L${num(bx + tw * 0.35)} ${num(by - topoTronco * S - ry * 0.3)}L${num(bx + tw * 0.5)} ${num(by - topoTronco * S * 0.4)}Q${num(bx + tw * 0.5)} ${num(by - tw)} ${num(bx + tw * 1.4)} ${num(by)}Z`, cor: o.tronco ?? COR.tronco, semVolume: true, marca: 'tronco' });
  if (forma === 'conica') {
    const top = by - alt * S;
    pecas.push({ tipo: 'massa', d: `M${num(bx)} ${num(top)}L${num(bx + rx * 0.7)} ${num(by - topoTronco * S * 0.6)}Q${num(bx)} ${num(by - topoTronco * S * 0.45)} ${num(bx - rx * 0.7)} ${num(by - topoTronco * S * 0.6)}Z`, cor: escurecer(cor, 0.1), semVolume: true, marca: 'copa' });
    pecas.push({ tipo: 'massa', d: `M${num(bx)} ${num(top)}L${num(bx - rx * 0.7)} ${num(by - topoTronco * S * 0.6)}Q${num(bx - rx * 0.2)} ${num(by - topoTronco * S * 0.52)} ${num(bx)} ${num(by - topoTronco * S * 0.55)}Z`, cor: clarear(cor, 0.12), semVolume: true, semContorno: true });
  } else {
    const alta = forma === 'alta' ? 1.25 : 1;
    pecas.push({ tipo: 'massa', d: massas(rx * 0.12, ry * 0.08, 1.12 * alta), cor: escurecer(cor, 0.2), semVolume: true, marca: 'copa' });
    pecas.push({ tipo: 'massa', d: massas(-rx * 0.28, ry * 0.12, 0.7), cor, semVolume: true, semContorno: true });
    pecas.push({ tipo: 'massa', d: massas(rx * 0.3, ry * 0.18, 0.62), cor: escurecer(cor, 0.08), semVolume: true, semContorno: true });
    pecas.push({ tipo: 'massa', d: massas(-rx * 0.18, -ry * 0.28 * alta, 0.58), cor: clarear(cor, 0.1), semVolume: true, semContorno: true });
    pecas.push({ tipo: 'massa', d: massas(-rx * 0.3, -ry * 0.42 * alta, 0.3), cor: clarear(cor, 0.24), semVolume: true, semContorno: true, marca: 'luz-da-copa' });
  }
  if (o.frutas) pecas.push({ tipo: 'massa', d: [[-0.3, 0.1], [0.25, 0.25], [0.05, -0.2], [0.4, -0.05], [-0.15, 0.35]].map(([a, b]) => circulo(bx + rx * a, cy + ry * b, Math.max(0.8, S * 0.1))).join(''), cor: o.frutas, semVolume: true, marca: 'fruta' });
  return marcado('cena__arvore', { 'data-detalhe': 'arvore' }, pecas);
}
/** A palmeira: o estipe curvo, as folhas em leque, a sombra. */
export function palmeira(v: Vista, x: number, z: number, alt = 7): Peca {
  const [bx, by] = pt(v, x, z, 0), S = v.S;
  const tx = bx + S * 0.5, ty = by - alt * S;
  const folhas = [[-1, 0.3], [-0.8, -0.35], [-0.2, -0.6], [0.4, -0.55], [0.95, -0.2], [1, 0.35], [0.1, 0.4]].map(([dx, dy], k): Peca => {
    const L = S * 2.2;
    const ex = tx + dx * L, ey = ty + dy * L * 0.6 + L * 0.35;
    return { tipo: 'massa', d: `M${num(tx)} ${num(ty)}Q${num(tx + dx * L * 0.5)} ${num(ty + dy * L * 0.6 - S * 0.5)} ${num(ex)} ${num(ey)}Q${num(tx + dx * L * 0.45)} ${num(ty + dy * L * 0.4)} ${num(tx)} ${num(ty)}Z`, cor: k < 3 ? '#5f8f4a' : k < 5 ? '#4f7d3e' : '#40683a', semVolume: true, marca: 'folha' };
  });
  return marcado('cena__arvore', { 'data-detalhe': 'palmeira' }, [
    sombra(`M${num(bx)} ${num(by)}a${num(S * 1.6)} ${num(S * 0.5)} 0 1 0 ${num(S * 3.2)} 0a${num(S * 1.6)} ${num(S * 0.5)} 0 1 0 ${num(-S * 3.2)} 0z`, 0.16),
    { tipo: 'massa', d: `M${num(bx - S * 0.2)} ${num(by)}Q${num(bx - S * 0.3)} ${num(by - alt * S * 0.5)} ${num(tx - S * 0.1)} ${num(ty)}L${num(tx + S * 0.12)} ${num(ty)}Q${num(bx + S * 0.05)} ${num(by - alt * S * 0.5)} ${num(bx + S * 0.25)} ${num(by)}Z`, cor: '#9a7a52', semVolume: true, marca: 'estipe' },
    { tipo: 'linha', d: Array.from({ length: Math.floor(alt * 1.4) }, (_, k) => { const t = (k + 1) / (alt * 1.4 + 1); const yy = by - (by - ty) * t; const xx = bx + (tx - bx) * t * t - S * 0.15; return `M${num(xx - S * 0.12)} ${num(yy)}h${num(S * 0.32)}`; }).join(''), larg: 0.5, cor: '#6e5638', fino: true },
    ...folhas
  ]);
}
/** Um arbusto assentado: a base apoiada no chão (sombra de contato), a massa com luz e sombra. */
export function arbusto(v: Vista, x: number, z: number, r = 0.6, cor = COR.folha, flores?: string): Peca {
  const [bx, by] = pt(v, x, z, 0), S = v.S, rx = r * S, ry = r * S * 0.8;
  const forma = (dx: number, dy: number, k: number) => suave([[bx + dx - rx * k, by + dy], [bx + dx - rx * 0.8 * k, by + dy - ry * 0.9 * k], [bx + dx - rx * 0.1 * k, by + dy - ry * 1.4 * k], [bx + dx + rx * 0.7 * k, by + dy - ry * 1.0 * k], [bx + dx + rx * k, by + dy]], true, 0.7);
  return marcado(undefined, { 'data-detalhe': 'arbusto' }, [
    sombra(`M${num(bx - rx * 0.8)} ${num(by)}a${num(rx * 1.1)} ${num(Math.max(0.6, ry * 0.3))} 0 1 0 ${num(rx * 2.2)} 0a${num(rx * 1.1)} ${num(Math.max(0.6, ry * 0.3))} 0 1 0 ${num(-rx * 2.2)} 0z`, 0.22),
    { tipo: 'massa', d: forma(0, 0, 1), cor: escurecer(cor, 0.12), semVolume: true, marca: 'arbusto' },
    { tipo: 'massa', d: forma(-rx * 0.2, -ry * 0.25, 0.55), cor: clarear(cor, 0.14), semVolume: true, semContorno: true },
    ...(flores ? [{ tipo: 'massa' as const, d: [[-0.5, -0.5], [0.1, -0.95], [0.5, -0.45], [-0.15, -0.3]].map(([a, b]) => circulo(bx + rx * a, by + ry * b, Math.max(0.55, S * 0.07))).join(''), cor: flores, semVolume: true, semContorno: true, marca: 'flores' }] : [])
  ]);
}
/** O canteiro: a borda de alvenaria (uma caixa baixa), a terra e as plantas assentadas dentro. */
export function canteiro(v: Vista, x0: number, x1: number, z0: number, z1: number, o: { borda?: string; plantas?: number; cor?: string; flores?: string; semente?: number } = {}): Peca[] {
  const borda = o.borda ?? '#cfc6b6';
  const n = o.plantas ?? Math.max(1, Math.round((x1 - x0) / 0.9));
  const plantas: Peca[] = [];
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, s = ((k * 37 + (o.semente ?? 0)) % 7) / 7;
    plantas.push(arbusto(v, x0 + (x1 - x0) * t, (z0 + z1) / 2 + (s - 0.5) * (z1 - z0) * 0.4, 0.42 + s * 0.22, o.cor ?? COR.folha, k % 2 === 0 ? o.flores : undefined));
  }
  return [marcado(undefined, { 'data-detalhe': 'canteiro' }, [
    ...bloco(v, { x0, x1, z0, z1, h1: 0.22 }, { cor: borda, corTopo: '#6b5442' }),
    noChao(v, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1, '#6b5442', 'terra', 0.22),
    ...plantas
  ])];
}
export const corDeMistura = misturar;
