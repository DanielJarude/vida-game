/**
 * VIDA 12.7 — A CASA INTEIRA: o desenho de cada coisa nova da casa (sala, cozinha, quartos, banheiro, piscina, jardim,
 * lazer, garagem, escritório). Mesmas regras de `objetos.ts`: cada coisa com a SUA silhueta (a geladeira francesa tem
 * as duas portas em cima e as duas gavetas; o fogão profissional, seis queimadores e dois fornos; o ombrelone, o braço
 * de lado), na cor do material que a pessoa escolheu (`cor`), e o segmento se vê no ACABAMENTO, não só na cor: o luxo
 * tem o veio do mármore, o pé de latão, o capitonê do couro, o veio da nogueira; o básico, não.
 *
 * Quadro de 120 × 120, chão em y = 110 (o que fica no chão tem sombra de contato; o que fica na parede, não).
 * Este arquivo não importa `objetos.ts` (é ele que espalha `OBJETOS_DA_CASA` no catálogo).
 */
import { cantos, circulo, clarear, elipse, escurecer, membro, num as f, poligono, ret, suave, type Amostra, type Peca, type Pt } from './nucleo';

const CHAO = 110;
const PRETO = '#2b2826', METAL = '#b8b4ad', BRANCO = '#ece9e4', MADEIRA = '#b9773f', LATAO = '#c9a23a', INOX = '#c3c6c9', TELA = '#26303a';
const VERDE = '#4f8a4a', AGUA = '#5fb6d6', TERRA = '#b5704a';

const noChao = (pecas: Peca[], meia = 44, cx = 60): Amostra => ({ vb: [120, 120], chao: CHAO, sombra: [cx, meia], pecas });
const naParede = (pecas: Peca[]): Amostra => ({ vb: [120, 120], pecas });
/** No chão, mas sem sombra (o tapete, a capa: deitados no piso). */
const deitado = (pecas: Peca[]): Amostra => ({ vb: [120, 120], chao: CHAO, pecas });

/* ---------------------------------------------------------- Atalhos de peça */

interface Op { semVolume?: boolean; opacidade?: number; marca?: string; fino?: boolean; so3?: boolean }
const M = (d: string, cor: string, marca?: string, o: Op = {}): Peca => ({ tipo: 'massa', d, cor, ...(marca ? { marca } : {}), ...o });
/** Massa chapada (sem o volume): o detalhe pintado, o recorte. */
const P = (d: string, cor: string, marca?: string, o: Op = {}): Peca => M(d, cor, marca, { semVolume: true, ...o });
const Mt = (d: string, cor = METAL, marca?: string): Peca => ({ tipo: 'metal', d, cor, ...(marca ? { marca } : {}) });
const L = (d: string, larg = 0.8, cor?: string, o: Op = {}): Peca => ({ tipo: 'linha', d, larg, ...(cor ? { cor } : {}), ...o });
const V = (d: string, claro = false, marca?: string): Peca => ({ tipo: 'vidro', d, claro, ...(marca ? { marca } : {}) });
const Lz = (d: string, cor: string, o: Op = {}): Peca => ({ tipo: 'luz', d, cor, ...o });
const G = (t: string, pecas: Peca[]): Peca => ({ tipo: 'grupo', t, pecas });

/* ---------------------------------------------------------- Materiais desenhados */

/** O veio da madeira: linhas onduladas na horizontal dentro do retângulo. */
const veio = (x: number, y: number, w: number, h: number, n = 3) => Array.from({ length: n }, (_, k) => {
  const yy = y + h * (k + 0.6) / (n + 0.2);
  return `M${f(x + w * 0.05)} ${f(yy)}c${f(w * 0.2)} ${f(-h * 0.07)} ${f(w * 0.38)} ${f(h * 0.08)} ${f(w * 0.6)} ${f(h * 0.02)}s${f(w * 0.2)} ${f(-h * 0.05)} ${f(w * 0.3)} 0`;
}).join('');
/** O veio do mármore: três fios diagonais, tortos. */
const marmore = (x: number, y: number, w: number, h: number) =>
  `M${f(x + w * 0.06)} ${f(y + h * 0.15)}c${f(w * 0.1)} ${f(h * 0.3)} ${f(w * 0.2)} ${f(h * 0.15)} ${f(w * 0.3)} ${f(h * 0.6)}s${f(w * 0.08)} ${f(h * 0.2)} ${f(w * 0.12)} ${f(h * 0.2)}` +
  `M${f(x + w * 0.48)} ${f(y + h * 0.05)}c${f(w * 0.05)} ${f(h * 0.3)} ${f(w * 0.16)} ${f(h * 0.4)} ${f(w * 0.2)} ${f(h * 0.85)}` +
  `M${f(x + w * 0.7)} ${f(y + h * 0.2)}c${f(w * 0.08)} ${f(h * 0.15)} ${f(w * 0.1)} ${f(h * 0.45)} ${f(w * 0.24)} ${f(h * 0.62)}`;
/** A trama em xadrez diagonal (a corda náutica, a tela da rede). */
function trama(x: number, y: number, w: number, h: number, p = 5): string {
  let d = '';
  for (let s = -h; s < w; s += p) {
    const a: Pt = s < 0 ? [x, y - s] : [x + s, y], b: Pt = s + h > w ? [x + w, y + (w - s)] : [x + s + h, y + h];
    const c: Pt = s < 0 ? [x + w, y - s] : [x + w - s, y], e: Pt = s + h > w ? [x, y + (w - s)] : [x + w - s - h, y + h];
    d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(e[0])} ${f(e[1])}`;
  }
  return d;
}
/** O capitonê: botões em losango (fileiras alternadas). */
function botoes(x: number, y: number, w: number, h: number, cols: number, lins: number, r = 1.1): string {
  let d = '';
  for (let j = 0; j < lins; j++) for (let i = 0; i < cols + (j % 2 ? 0 : 1); i++) {
    const cx = x + (i + (j % 2 ? 0.5 : 0)) * w / cols, cy = y + (j + 0.5) * h / lins;
    if (cx >= x - 0.1 && cx <= x + w + 0.1) d += circulo(cx, cy, r);
  }
  return d;
}
/** As pregas entre os botões do capitonê (o losango). */
function pregas(x: number, y: number, w: number, h: number, cols: number, lins: number): string {
  let d = '';
  for (let j = 0; j < lins - 1; j++) for (let i = 0; i <= cols; i++) {
    const cx = x + (i + (j % 2 ? 0.5 : 0)) * w / cols, cy = y + (j + 0.5) * h / lins, ny = cy + h / lins;
    for (const dx of [-0.5, 0.5]) { const nx = cx + dx * w / cols; if (cx >= x && cx <= x + w && nx >= x && nx <= x + w) d += `M${f(cx)} ${f(cy)}L${f(nx)} ${f(ny)}`; }
  }
  return d;
}
/** Um trapézio deitado no chão (o tapete, a piscina): (u, v) ∈ [0,1]² → o ponto em perspectiva. */
function noPiso(xt0: number, xt1: number, xb0: number, xb1: number, yt: number, yb: number) {
  const pt = (u: number, v: number): Pt => [xt0 + (xt1 - xt0) * u + ((xb0 + (xb1 - xb0) * u) - (xt0 + (xt1 - xt0) * u)) * v, yt + (yb - yt) * v];
  const quad = (u0: number, v0: number, u1: number, v1: number, r = 1.5) => cantos([[...pt(u0, v0), r], [...pt(u1, v0), r], [...pt(u1, v1), r], [...pt(u0, v1), r]]);
  const poli = (uv: Pt[]) => poligono(uv.map(([u, v]) => pt(u, v)));
  return { pt, quad, poli };
}

/* ============================================================== SALA */

function sofaRetratil(cor: string): Amostra {
  const assento = clarear(cor, 0.08);
  return noChao([
    // O encosto reclinado (as três almofadas caídas para trás) e o assento que CORRE para a frente, além do braço.
    { ...M(ret(10, 52, 100, 34, 6), escurecer(cor, 0.12), 'base') },
    ...[0, 1, 2].map(k => M(cantos([[21 + k * 26.6, 34, 7], [45 + k * 26.6, 34, 7], [47 + k * 26.6, 66, 5], [19 + k * 26.6, 66, 5]]), cor, 'encosto')),
    L('M24 44h18M50.6 44h18M77.2 44h18', 0.9, escurecer(cor, 0.25), { fino: true }),
    M(ret(2, 48, 18, 46, 7), cor, 'braco'), M(ret(100, 48, 18, 46, 7), cor),
    ...[0, 1, 2].map(k => M(ret(20 + k * 26.6, 64, 26, 14, 5), assento, 'assento')),
    // A extensão puxada: o trapézio que vem para a frente (mais largo embaixo) com o trilho de metal.
    M(cantos([[16, 78, 3], [104, 78, 3], [114, 94, 3], [6, 94, 3]]), clarear(cor, 0.14), 'extensao'),
    L('M45.5 78l-3 16M74.5 78l3 16', 1, escurecer(cor, 0.3)),
    Mt(ret(14, 94, 92, 4, 1.5), '#5d5a56', 'trilho'),
    P(ret(16, 98, 4, 10, 1) + ret(100, 98, 4, 10, 1), PRETO)
  ], 56);
}

function sofaCouro(cor: string): Amostra {
  const pe = '#4a2c1a';
  return noChao([
    // O Chesterfield: encosto e braços na MESMA altura, o capitonê de botões, os braços enrolados, as tachas e o pé bola.
    M(ret(12, 36, 96, 36, 5), cor, 'encosto'),
    L(pregas(18, 40, 84, 26, 7, 3), 0.7, escurecer(cor, 0.3), { fino: true }),
    P(botoes(18, 40, 84, 26, 7, 3, 1.2), escurecer(cor, 0.35), 'capitone'),
    M(ret(2, 44, 22, 52, 5), cor, 'braco'), M(ret(96, 44, 22, 52, 5), cor),
    M(elipse(12, 46, 11, 7), clarear(cor, 0.1), 'rolo'), M(elipse(108, 46, 11, 7), clarear(cor, 0.1)),
    M(ret(22, 68, 76, 16, 5), clarear(cor, 0.1), 'assento'),
    L('M60 68v16', 1, escurecer(cor, 0.3)),
    M(ret(14, 84, 92, 12, 3), escurecer(cor, 0.08)),
    Mt(Array.from({ length: 8 }, (_, k) => circulo(4 + k * 2.6, 93, 0.9) + circulo(97 + k * 2.6, 93, 0.9)).join(''), LATAO, 'tachas'),
    M(circulo(12, 102, 5.5) + circulo(108, 102, 5.5) + circulo(40, 102, 4.5) + circulo(80, 102, 4.5), pe, 'pe-bola')
  ], 56);
}

function sofaDesigner(cor: string): Amostra {
  return noChao([
    // Baixo e comprido: a plataforma, os módulos de pena (almofadões gordos), a manta caída e o pé de lâmina de latão.
    M(ret(2, 78, 116, 16, 4), escurecer(cor, 0.1), 'plataforma'),
    M(ret(5, 48, 54, 30, 13), cor, 'modulo'), M(ret(61, 48, 54, 30, 13), cor),
    M(ret(4, 70, 56, 16, 8), clarear(cor, 0.08), 'assento'), M(ret(60, 70, 56, 16, 8), clarear(cor, 0.08)),
    L('M12 56q20 4 40 0M68 56q20 4 40 0', 0.8, escurecer(cor, 0.2), { fino: true }),
    M(cantos([[14, 46, 5], [34, 50, 5], [32, 68, 5], [12, 64, 5]]), '#d8cdb8', 'almofada'),
    M(cantos([[84, 48, 2], [110, 48, 4], [114, 74, 2], [108, 92, 2], [96, 92, 2], [92, 72, 2]]), '#e7dfd0', 'manta'),
    L('M100 50l4 40M94 52l2 30', 0.6, '#c9bca3', { fino: true }),
    Mt(ret(2, 92, 116, 2.4, 1), LATAO, 'friso'),
    Mt(cantos([[12, 94, 0.5], [18, 94, 0.5], [16, 108, 0.5], [14, 108, 0.5]]) + cantos([[102, 94, 0.5], [108, 94, 0.5], [106, 108, 0.5], [104, 108, 0.5]]), LATAO, 'pe-latao')
  ], 58);
}

function poltronaDesigner(cor: string): Amostra {
  const conchas = '#5a3320';
  return noChao([
    // A poltrona de concha de madeira curvada com as almofadas de couro, a base giratória em estrela — e a banqueta.
    G('rotate(-6 40 60)', [
      M(ret(12, 10, 52, 52, 12), conchas, 'concha'),
      L(veio(14, 12, 48, 46, 4), 0.5, '#7a4a2c', { fino: true }),
      M(ret(17, 14, 42, 22, 8), cor, 'almofada'), M(ret(17, 37, 42, 22, 8), cor),
      L('M24 25h28M24 48h28', 0.7, escurecer(cor, 0.4), { fino: true })
    ]),
    M(ret(8, 62, 62, 18, 8), conchas, 'assento-concha'),
    M(ret(12, 58, 54, 16, 7), cor, 'assento'),
    M(ret(2, 52, 14, 9, 4) + ret(62, 52, 14, 9, 4), cor, 'bracos'),
    Mt(ret(36, 80, 6, 14, 1), '#3a3836'),
    Mt(membro([[39, 94], [12, 106]], [3.4, 2.6]) + membro([[39, 94], [66, 106]], [3.4, 2.6]) + membro([[39, 94], [39, 108]], [3.4, 2.6]), '#3a3836', 'base-estrela'),
    Mt(circulo(12, 106, 1.8) + circulo(66, 106, 1.8) + circulo(39, 108, 1.8), INOX),
    // A banqueta.
    M(ret(78, 78, 38, 12, 6), conchas, 'banqueta'),
    M(ret(80, 70, 34, 12, 6), cor),
    Mt(ret(94, 90, 6, 8, 1) + membro([[97, 98], [82, 106]], [2.6, 2]) + membro([[97, 98], [112, 106]], [2.6, 2]), '#3a3836')
  ], 54);
}

function mesaCentro(cor: string): Amostra {
  return noChao([
    // O tampo grosso de madeira em perspectiva, a prateleira de baixo, a revista e o controle em cima.
    M(cantos([[18, 62, 2], [102, 62, 2], [114, 76, 2], [6, 76, 2]]), clarear(cor, 0.12), 'tampo'),
    L(veio(14, 64, 92, 10, 2), 0.5, escurecer(cor, 0.2), { fino: true }),
    M(ret(6, 76, 108, 8, 2), cor),
    M(ret(10, 84, 7, 24, 1) + ret(103, 84, 7, 24, 1), escurecer(cor, 0.2), 'pernas'),
    M(ret(14, 96, 92, 4, 1), escurecer(cor, 0.1), 'prateleira'),
    P(cantos([[28, 66, 1], [52, 66, 1], [54, 72, 1], [26, 72, 1]]), '#c7522f', 'revista'),
    P(cantos([[70, 68, 1], [86, 67, 1], [87, 69.5, 1], [71, 70.5, 1]]), PRETO, 'controle'),
    P(ret(24, 92, 18, 4, 1) + ret(44, 93, 14, 3, 1), '#3c5e9a')
  ], 56);
}

function mesaCentroMarmore(cor: string): Amostra {
  return noChao([
    // O tampo oval de mármore de veio largo sobre a base de latão (as hastes finas e o aro).
    Mt(membro([[30, 74], [24, 108]], [2.6, 2.2]) + membro([[90, 74], [96, 108]], [2.6, 2.2]) + membro([[48, 76], [44, 104]], [2.4, 2]) + membro([[72, 76], [76, 104]], [2.4, 2]), LATAO, 'pes-latao'),
    Mt(elipse(60, 98, 34, 5) + `M${26} 98a34 5 0 0 0 68 0a34 3 0 0 1 -68 0z`, LATAO),
    M('M8 66a52 12 0 0 0 104 0v6a52 12 0 0 1-104 0z', escurecer(cor, 0.1), 'borda'),
    M(elipse(60, 66, 52, 12), cor, 'tampo'),
    L('M22 60c14 2 18 8 34 6s24 4 34 8M38 72c10-4 22-2 30-8M70 58c8 4 20 2 28 8', 0.9, '#8f877c', { fino: true, marca: 'veio' }),
    L('M30 64c8 0 14 4 20 2', 0.6, '#a39a8e', { fino: true }),
    P(ret(66, 56, 22, 5, 1), '#2f4a3a', 'livro'), P(ret(68, 52, 18, 4, 1), '#c9b79a'),
    M(cantos([[34, 58, 2], [48, 58, 2], [46, 64, 4], [36, 64, 4]]), '#2b2826', 'tigela')
  ], 54);
}

function mesaLateral(cor: string): Amostra {
  return noChao([
    // A mesinha redonda de três pés com o abajur e o copo: do lado do sofá.
    M(membro([[50, 70], [40, 108]], [3, 2.4]) + membro([[70, 70], [80, 108]], [3, 2.4]) + membro([[60, 72], [60, 106]], [3, 2.4]), escurecer(cor, 0.2), 'pes'),
    M('M34 66a26 6 0 0 0 52 0v5a26 6 0 0 1-52 0z', cor),
    M(elipse(60, 66, 26, 6), clarear(cor, 0.12), 'tampo'),
    M(ret(62, 44, 7, 20, 2), '#d8cbb2', 'abajur'),
    M(cantos([[56, 22, 2], [76, 22, 2], [80, 44, 2], [52, 44, 2]]), '#efe6d2', 'cupula'),
    V(ret(42, 52, 8, 12, 1.5), true, 'copo'),
    P(ret(43, 57, 6, 6, 1), '#c9a24a', undefined, { opacidade: 0.7 })
  ], 30);
}

function estanteSala(cor: string): Amostra {
  const fundo = escurecer(cor, 0.35);
  const livros = (x: number, y: number, n: number) => Array.from({ length: n }, (_, j) => P(ret(x + j * 5, y - 14 - (j % 3) * 2, 4.4, 14 + (j % 3) * 2, 0.5), ['#c7522f', '#3c5e9a', '#e0d2b4', '#5f8a4c'][j % 4], 'lombada'));
  return noChao([
    // A estante com rack: os nichos de cima (livros, vaso), o vão da TV no meio e as portas do rack embaixo.
    M(ret(2, 8, 116, 100, 2), cor, 'estante'),
    P(ret(6, 12, 34, 24, 1) + ret(43, 12, 34, 24, 1) + ret(80, 12, 34, 24, 1), fundo),
    P(ret(6, 40, 22, 40, 1) + ret(92, 40, 22, 40, 1), fundo),
    P(ret(31, 40, 58, 40, 1), escurecer(cor, 0.2)),
    V(ret(34, 44, 52, 30, 1), false, 'tv'),
    ...livros(8, 36, 6), ...livros(94, 80, 4), ...livros(8, 80, 4),
    M(suave([[56, 36], [53, 28], [56, 20], [64, 20], [67, 28], [64, 36]], true, 0.4), '#d8cbb2', 'vaso'),
    M(suave([[96, 36], [94, 26], [100, 18], [106, 26], [104, 36]], true, 0.4), VERDE),
    M(ret(2, 84, 116, 24, 2), escurecer(cor, 0.06), 'rack'),
    L('M31 84v24M60 84v24M89 84v24', 1),
    Mt(ret(24, 94, 4, 1.6, 0.6) + ret(53, 94, 4, 1.6, 0.6) + ret(63, 94, 4, 1.6, 0.6) + ret(92, 94, 4, 1.6, 0.6), METAL)
  ], 58);
}

function aparador(cor: string): Amostra {
  return noChao([
    // O espelho redondo na parede, o aparador de laca (brilho) em pés finos, a luminária e a bandeja das chaves.
    Mt(circulo(60, 26, 20), LATAO, 'moldura'),
    V(circulo(60, 26, 17), true, 'espelho'),
    L('M50 20l8-8M52 30l14-14', 0.8, '#ffffff', { fino: true }),
    M(ret(8, 56, 104, 32, 3), cor, 'aparador'),
    L('M12 59h96', 1.2, clarear(cor, 0.45), { fino: true, marca: 'laca' }),
    L('M42.7 62v26M77.3 62v26', 0.9),
    Mt(circulo(38, 74, 1.4) + circulo(47, 74, 1.4) + circulo(73, 74, 1.4) + circulo(82, 74, 1.4), LATAO),
    M(membro([[14, 88], [12, 108]], [3, 2]) + membro([[106, 88], [108, 108]], [3, 2]) + membro([[60, 88], [60, 106]], [2.6, 2]), escurecer(cor, 0.4), 'pes'),
    M(ret(18, 40, 6, 16, 2), '#d8cbb2'), M(cantos([[13, 28, 2], [29, 28, 2], [32, 42, 2], [10, 42, 2]]), '#efe6d2', 'luminaria'),
    M('M86 52h20q0 4-10 4t-10-4z', '#4a4643', 'bandeja'),
    Mt(circulo(94, 51, 1.6) + ret(97, 50, 5, 1.4, 0.5), METAL)
  ], 54);
}

function tvOled(cor: string): Amostra {
  return noChao([
    // A tela enorme e FINA (quase sem borda) com a imagem acesa, no pé de lâmina, sobre o console baixo.
    M(ret(2, 12, 116, 68, 1), cor, 'moldura'),
    P(ret(3.5, 13.5, 113, 65, 0.5), '#141a33', 'tela'),
    P('M3.5 78.5V60c16-10 28-14 40-6s22-12 38-16 26 4 35 10v30.5z', '#3a2f63'),
    P('M3.5 78.5V68c22-8 40-4 60-8s38 2 53 0v18.5z', '#1f3a5a'),
    Lz(circulo(84, 36, 8), '#f2a65a'),
    P(ret(3.5, 13.5, 113, 20, 0.5), '#5a4a8a', undefined, { opacidade: 0.35 }),
    Mt(ret(48, 80, 24, 2.4, 1) + ret(44, 82, 32, 1.6, 0.8), '#4a4643', 'pe'),
    M(ret(6, 88, 108, 12, 2), '#3a2f2a', 'console'),
    L('M10 92h100M10 96h100', 0.5, '#5a4a40', { fino: true }),
    P(ret(10, 100, 4, 8, 1) + ret(106, 100, 4, 8, 1), PRETO)
  ], 56);
}

function homeTheater(cor: string): Amostra {
  const falante = (x: number) => [P(circulo(x, 34, 3), PRETO), P(circulo(x, 54, 6.5) + circulo(x, 76, 6.5), PRETO), Mt(circulo(x, 54, 2) + circulo(x, 76, 2), '#5d5a56')];
  return noChao([
    // As duas torres de caixa, o central em cima do rack, o receiver com o visor e o subwoofer na frente.
    M(ret(2, 22, 20, 86, 3), cor, 'torre'), M(ret(98, 22, 20, 86, 3), cor),
    ...falante(12), ...falante(108),
    M(ret(26, 82, 68, 26, 2), '#3a2f2a', 'rack'),
    M(ret(32, 86, 36, 10, 1.5), PRETO, 'receiver'),
    Lz(ret(36, 89, 14, 3, 0.6), '#7cc0d6'), Mt(circulo(62, 91, 2.6), METAL),
    M(ret(36, 72, 48, 10, 4), cor, 'central'),
    L('M40 77h40', 0.6, '#6a6560', { fino: true }),
    M(ret(70, 84, 24, 24, 2), cor, 'subwoofer'),
    P(circulo(82, 96, 8), PRETO), Mt(circulo(82, 96, 3), '#5d5a56'),
    L('M26 44q4 6 0 12M30 40q6 10 0 20M94 44q-4 6 0 12M90 40q-6 10 0 20', 0.9, '#8fb8cc', { fino: true, marca: 'som' })
  ], 58);
}

function tapete(cor: string): Amostra {
  const t = noPiso(22, 98, 4, 116, 80, 106);
  return deitado([
    // Deitado no piso: o retângulo em perspectiva, a borda em outro tom e a espessura na frente.
    P(cantos([[4, 106, 2], [116, 106, 2], [116, 108, 1], [4, 108, 1]]), escurecer(cor, 0.3)),
    M(t.quad(0, 0, 1, 1, 2), cor, 'tapete', { semVolume: true }),
    L(t.quad(0.05, 0.12, 0.95, 0.88, 1), 1.2, escurecer(cor, 0.2), { marca: 'barra' }),
    L(t.quad(0.09, 0.22, 0.91, 0.78, 1), 0.6, clarear(cor, 0.3), { fino: true })
  ]);
}

function tapetePersa(cor: string): Amostra {
  const t = noPiso(22, 98, 4, 116, 78, 104);
  const azul = '#23314f', creme = '#e8d9b5';
  const franja = (v: number) => Array.from({ length: 22 }, (_, k) => { const [x, y] = t.pt((k + 0.5) / 22, v); return `M${f(x)} ${f(y)}v${v ? 4 : -3}`; }).join('');
  return deitado([
    // O tapete de tear: a barra larga azul, o campo na cor, o medalhão central em losango, os cantos — e as franjas.
    L(franja(0) + franja(1), 0.8, creme, { marca: 'franja' }),
    P(cantos([[4, 104, 2], [116, 104, 2], [116, 106, 1], [4, 106, 1]]), escurecer(azul, 0.2)),
    M(t.quad(0, 0, 1, 1, 1.5), azul, 'barra', { semVolume: true }),
    P(t.quad(0.07, 0.14, 0.93, 0.86, 1), creme),
    P(t.quad(0.09, 0.19, 0.91, 0.81, 1), cor, 'campo'),
    P(t.poli([[0.5, 0.26], [0.7, 0.5], [0.5, 0.74], [0.3, 0.5]]), creme, 'medalhao'),
    P(t.poli([[0.5, 0.36], [0.6, 0.5], [0.5, 0.64], [0.4, 0.5]]), azul),
    P(t.poli([[0.09, 0.19], [0.22, 0.19], [0.09, 0.4]]) + t.poli([[0.91, 0.19], [0.78, 0.19], [0.91, 0.4]]) + t.poli([[0.09, 0.81], [0.22, 0.81], [0.09, 0.6]]) + t.poli([[0.91, 0.81], [0.78, 0.81], [0.91, 0.6]]), creme, 'cantos'),
    L(Array.from({ length: 9 }, (_, k) => { const [x, y] = t.pt(0.035, 0.12 + k * 0.095), [x2, y2] = t.pt(0.965, 0.12 + k * 0.095); return `M${f(x)} ${f(y)}h0.1M${f(x2)} ${f(y2)}h0.1`; }).join(''), 1.6, '#c8372d', { fino: true }),
    L(t.poli([[0.2, 0.5], [0.3, 0.5]]) + t.poli([[0.7, 0.5], [0.8, 0.5]]), 0.8, creme, { fino: true })
  ]);
}

function quadros(cor: string): Amostra {
  const passe = '#f4f1ea';
  return naParede([
    // Três gravuras emolduradas com paspatur, em composição: a grande no meio, duas menores dos lados.
    M(ret(38, 18, 44, 58, 1), cor, 'moldura'), P(ret(42, 22, 36, 50, 0.5), passe),
    P(ret(48, 28, 24, 38, 0.5), '#9db9d6'), P('M48 66V52c6-6 10-2 14-8s8 0 10 4v18z', '#5f8a4c'), Lz(circulo(64, 36, 4), '#e2b72d'),
    M(ret(6, 30, 26, 34, 1), cor, 'moldura'), P(ret(9, 33, 20, 28, 0.5), passe),
    L('M19 58c0-8-4-14 0-22M19 50c-4-2-6-6-6-8M19 44c4-2 6-6 6-8', 1, '#3f7a3f', { marca: 'botanica' }),
    M(ret(88, 26, 26, 34, 1), cor, 'moldura'), P(ret(91, 29, 20, 28, 0.5), passe),
    P(circulo(101, 40, 6), '#c7522f'), P(ret(95, 48, 12, 4, 0.5), PRETO)
  ]);
}

function objetosDecor(cor: string): Amostra {
  return noChao([
    // O vaso alto de cerâmica, o redondo de vidro com o galho, a tigela e o livro de arte deitado.
    M(suave([[22, 106], [16, 80], [20, 54], [26, 44], [24, 34], [34, 34], [32, 44], [38, 54], [42, 80], [36, 106]], true, 0.4), cor, 'vaso'),
    L('M20 70h20', 1, clarear(cor, 0.35), { fino: true }),
    L('M58 74c-2-18 4-32 2-46M60 46c6-4 10-4 14-10M59 58c-6-4-10-4-12-10', 1.2, '#6b5a48', { marca: 'galho' }),
    V(suave([[50, 106], [44, 92], [48, 76], [58, 72], [68, 76], [72, 92], [66, 106]], true, 0.45), true, 'vidro'),
    P(elipse(58, 96, 10, 3), '#8fc3dc', undefined, { opacidade: 0.6 }),
    M(ret(76, 96, 40, 10, 1.5), '#2f4a3a', 'livro'), P(ret(76, 98, 40, 2, 0.5), '#e0d2b4'),
    M('M82 96c0-8 6-12 14-12s14 4 14 12z', escurecer(cor, 0.25), 'tigela')
  ], 52);
}

function lareira(cor: string): Amostra {
  return noChao([
    // O painel de pedra, a prateleira, a boca preta com o queimador e as chamas (sem chaminé: é a etanol).
    M(ret(8, 18, 104, 90, 2), cor, 'painel'),
    L('M8 40h104M8 62h104M8 84h104M40 18v22M80 40v22M30 62v22M90 62v22', 0.6, escurecer(cor, 0.18), { fino: true }),
    M(ret(2, 48, 116, 6, 1.5), '#5a3a24', 'prateleira'),
    P(ret(20, 60, 80, 36, 2), PRETO, 'boca'),
    Mt(ret(26, 88, 68, 4, 1), METAL, 'queimador'),
    Lz(suave([[30, 88], [34, 72], [40, 80], [46, 64], [52, 78], [58, 60], [64, 76], [70, 62], [76, 78], [82, 68], [88, 88]], true, 0.35), '#ef8a2e', { marca: 'chama' }),
    Lz(suave([[38, 88], [44, 78], [50, 84], [58, 72], [66, 84], [72, 78], [80, 88]], true, 0.35), '#f7d36b'),
    L(ret(20, 60, 80, 36, 2), 1, '#8a8580'),
    M(ret(2, 98, 116, 10, 1.5), escurecer(cor, 0.15), 'base'),
    M(ret(18, 38, 6, 10, 1.5), '#efe6d2'), Lz(elipse(21, 36, 1.4, 2.4), '#f7d36b', { fino: true }),
    M(ret(86, 34, 14, 14, 1), '#3a2f2a'), P(ret(88, 36, 10, 10, 0.5), '#c9b79a')
  ], 58);
}

/* ============================================================== COZINHA */

function geladeira(cor: string): Amostra {
  return noChao([
    // Duas portas (o congelador em cima, menor), os puxadores verticais e a grade do pé.
    M(ret(30, 4, 60, 104, 6), cor, 'corpo'),
    L('M30 36H90', 1.2, undefined, { marca: 'congelador' }),
    Mt(ret(80, 14, 3.4, 16, 1.5) + ret(80, 42, 3.4, 30, 1.5), METAL, 'puxador'),
    P(ret(36, 102, 48, 3, 1), escurecer(cor, 0.35)),
    P(ret(42, 48, 8, 6, 1), '#e2b72d', undefined, { fino: true }), P(ret(54, 52, 7, 7, 3.5), '#c7522f', undefined, { fino: true }), P(ret(44, 58, 12, 9, 0.5), '#f4f1ea', undefined, { fino: true })
  ], 34);
}

function geladeiraInox(cor: string): Amostra {
  return noChao([
    // A francesa: duas portas em cima abrindo do meio, duas gavetas embaixo, o dispenser de água na porta e o inox escovado.
    M(ret(12, 4, 96, 104, 4), cor, 'corpo'),
    L(Array.from({ length: 18 }, (_, k) => `M${16 + k * 5.2} 6v100`).join(''), 0.4, clarear(cor, 0.22), { fino: true, marca: 'escovado' }),
    L('M60 4V64M12 64H108M12 86H108', 1.2, escurecer(cor, 0.35), { marca: 'portas' }),
    Mt(ret(53, 12, 3.4, 44, 1.5) + ret(63.6, 12, 3.4, 44, 1.5), clarear(cor, 0.35), 'puxador'),
    Mt(ret(30, 69, 60, 3.4, 1.5) + ret(30, 91, 60, 3.4, 1.5), clarear(cor, 0.35)),
    P(ret(22, 20, 22, 30, 3), '#2f3438', 'dispenser'),
    P(ret(26, 32, 14, 14, 2), '#1f2326'), Lz(ret(26, 23, 14, 4, 1), '#7cc0d6'),
    P(ret(18, 104, 84, 3, 1), escurecer(cor, 0.45))
  ], 50);
}

function freezer(cor: string): Amostra {
  return noChao([
    // O freezer HORIZONTAL: baixo e comprido, a tampa que abre para cima (vista de cima em perspectiva) e o puxador.
    M(cantos([[16, 46, 3], [104, 46, 3], [110, 58, 3], [10, 58, 3]]), clarear(cor, 0.05), 'tampa'),
    M(ret(10, 58, 100, 50, 4), cor, 'corpo'),
    P(ret(10, 58, 100, 7, 3), escurecer(cor, 0.08)),
    P(ret(46, 63, 28, 5, 2), '#4a4643', 'puxador'),
    Lz(circulo(20, 74, 1.6), '#7cc06a', { fino: true }), Lz(circulo(26, 74, 1.6), '#e0b12d', { fino: true }),
    Mt(circulo(98, 74, 3), METAL),
    P(ret(14, 102, 92, 4, 1), escurecer(cor, 0.35))
  ], 54);
}

function adega(cor: string): Amostra {
  return noChao([
    // A coluna estreita de porta de vidro: as prateleiras de madeira com o fundo das garrafas, a luz azul de dentro.
    M(ret(32, 6, 56, 102, 4), cor, 'corpo'),
    V(ret(37, 12, 46, 82, 2), false, 'porta-vidro'),
    Lz(ret(40, 14, 40, 2, 1), '#7cc0d6', { fino: true }),
    ...[0, 1, 2, 3, 4].map(k => Mt(ret(38, 30 + k * 14, 44, 2, 0.5), '#a8743f')),
    ...[0, 1, 2, 3, 4].map(k => P([0, 1, 2, 3].map(j => circulo(44 + j * 10.5 + (k % 2) * 2, 24 + k * 14, 4)).join(''), '#2e4a32', 'garrafas')),
    ...[0, 1, 2, 3, 4].map(k => P([0, 1, 2, 3].map(j => circulo(44 + j * 10.5 + (k % 2) * 2, 24 + k * 14, 1.4)).join(''), '#6a8a5a', undefined, { fino: true })),
    Mt(ret(80, 30, 2.4, 40, 1), METAL, 'puxador'),
    P(ret(48, 97, 24, 7, 1), '#1f2326'), Lz(ret(52, 99, 16, 3, 0.5), '#7cc0d6', { fino: true })
  ], 34);
}

function fogao(cor: string): Amostra {
  return noChao([
    // O fogão de piso: a tampa de vidro levantada atrás, as quatro bocas com a grade, os botões, o forno com o visor.
    V(cantos([[24, 6, 2], [96, 6, 2], [96, 30, 1], [24, 30, 1]]), true, 'tampa-vidro'),
    M(cantos([[24, 28, 1], [96, 28, 1], [100, 40, 1], [20, 40, 1]]), '#3a3836', 'mesa'),
    P(elipse(42, 31.5, 9, 2) + elipse(78, 31.5, 9, 2) + elipse(39, 36.5, 10, 2.4) + elipse(81, 36.5, 10, 2.4), '#1f1d1b', 'bocas'),
    L('M34 31.5h16M70 31.5h16M30 36.5h18M72 36.5h18M42 29v5M78 29v5M39 34v5M81 34v5', 0.7, '#6a6560', { fino: true }),
    M(ret(20, 40, 80, 68, 4), cor, 'corpo'),
    P(ret(20, 40, 80, 11, 4), escurecer(cor, 0.06)),
    Mt([0, 1, 2, 3].map(k => circulo(34 + k * 13, 45.5, 3)).join(''), '#4a4643', 'botoes'),
    Mt(ret(28, 56, 64, 3, 1.5), METAL, 'puxador'),
    M(ret(26, 54, 68, 46, 3), clarear(cor, 0.04), 'porta-forno'),
    Mt(ret(30, 56, 60, 3, 1.5), METAL),
    V(ret(34, 64, 52, 26, 2), false, 'visor'),
    P(ret(24, 102, 72, 4, 1), escurecer(cor, 0.35)),
    // A panela de pressão de domingo.
    Mt(ret(30, 16, 22, 15, 4), METAL, 'panela'), P(ret(46, 12, 16, 3, 1.5) + ret(38, 12, 4, 4, 1), PRETO)
  ], 42);
}

function cooktopForno(cor: string): Amostra {
  return noChao([
    // O armário com a bancada; no tampo, o vidro preto do cooktop com as zonas acesas; embaixo, o forno de embutir.
    M(ret(6, 46, 108, 62, 2), cor, 'armario'),
    M(cantos([[12, 36, 1], [108, 36, 1], [114, 46, 1], [6, 46, 1]]), '#d8d2c8', 'bancada'),
    M(ret(6, 45, 108, 4, 1), '#c9c2b6'),
    P(cantos([[30, 37.5, 1], [90, 37.5, 1], [93, 44.5, 1], [27, 44.5, 1]]), '#1c1c1e', 'cooktop'),
    L(elipse(44, 41, 8, 2.2) + elipse(74, 41, 10, 2.6), 1.2, '#d0573b', { marca: 'zona' }),
    L(elipse(44, 41, 4, 1.1), 0.8, '#d0573b', { fino: true }),
    M(ret(32, 52, 56, 40, 2), PRETO, 'forno'),
    Mt(ret(36, 55, 48, 3, 1.5), INOX, 'puxador'),
    V(ret(38, 62, 44, 24, 1.5), false, 'visor'),
    Lz(ret(70, 88, 10, 2.4, 0.5), '#ef8a2e', { fino: true }),
    M(ret(32, 94, 56, 12, 1.5), cor), Mt(ret(52, 97, 16, 2, 1), INOX),
    L('M32 46v62M88 46v62', 1),
    Mt(ret(24, 58, 2, 14, 1) + ret(94, 58, 2, 14, 1), INOX),
    P(ret(6, 104, 108, 4, 1), escurecer(cor, 0.35))
  ], 58);
}

function fogaoProfissional(cor: string): Amostra {
  return noChao([
    // Largo: o espaldar de inox com a prateleira, SEIS queimadores com as grades de ferro (as capas de latão), a fileira
    // de botões com aro de latão, DOIS fornos de portas esmaltadas com a barra de latão, o termômetro e o rodapé dourado.
    Mt(ret(4, 6, 112, 4, 1.5), INOX, 'prateleira'),
    Mt(ret(8, 10, 104, 18, 1), INOX, 'espaldar'),
    M(cantos([[10, 27, 1], [110, 27, 1], [116, 40, 1], [4, 40, 1]]), '#2d2b29', 'grades'),
    L('M10 30.5h100M8 35h104M40 27l-1.4 13M80 27l1.4 13M26 27l-3 13M94 27l3 13M53 27l-0.6 13M67 27l0.6 13', 0.8, '#5a5550', { fino: true }),
    Mt([22, 60, 98].map(x => elipse(x, 30.5, 6.5, 1.6)).join('') + [18, 60, 102].map(x => elipse(x, 36, 7.5, 1.9)).join(''), LATAO, 'queimadores'),
    M(ret(4, 40, 112, 68, 3), cor, 'corpo'),
    ...[0, 1, 2, 3, 4, 5, 6].map(k => Mt(circulo(16 + k * 14.7, 47, 4), LATAO)),
    P([0, 1, 2, 3, 4, 5, 6].map(k => circulo(16 + k * 14.7, 47, 2.8)).join(''), PRETO, 'botoes'),
    M(ret(9, 56, 58, 40, 3), clarear(cor, 0.06), 'forno'), M(ret(71, 56, 40, 40, 3), clarear(cor, 0.06), 'forno'),
    Mt(ret(13, 59, 50, 3, 1.5) + ret(75, 59, 32, 3, 1.5), LATAO, 'barra'),
    L(ret(13, 66, 50, 26, 2) + ret(75, 66, 32, 26, 2), 0.8, escurecer(cor, 0.3), { fino: true }),
    P(circulo(38, 79, 5) + circulo(91, 79, 5), '#f4f1ea', 'termometro'), Mt(circulo(38, 79, 5.8) + circulo(91, 79, 5.8), LATAO),
    P(circulo(38, 79, 4.4) + circulo(91, 79, 4.4), '#f4f1ea'),
    L('M38 79l2.4-3M91 79l2.4-3', 0.8, PRETO, { fino: true }),
    Mt(ret(4, 98, 112, 3, 1), LATAO, 'friso'),
    Mt(ret(8, 101, 6, 7, 1) + ret(106, 101, 6, 7, 1), LATAO, 'pes')
  ], 58);
}

function microondas(cor: string): Amostra {
  return noChao([
    // A caixa com a porta de visor à esquerda (o prato dentro) e o painel de botões à direita.
    M(ret(10, 50, 100, 56, 4), cor, 'corpo'),
    V(ret(17, 57, 62, 42, 2), false, 'porta'),
    P(elipse(48, 92, 22, 3.6), '#cfc8bc', undefined, { opacidade: 0.6, fino: true }),
    L('M79 57v42', 1),
    P(ret(84, 57, 20, 42, 2), escurecer(cor, 0.12), 'painel'),
    Lz(ret(86, 60, 16, 7, 1), '#7cd67c'),
    P([0, 1, 2].flatMap(l => [0, 1, 2].map(c => circulo(89 + c * 5, 74 + l * 6, 1.6))).join(''), escurecer(cor, 0.35), undefined, { fino: true }),
    P(ret(14, 106, 6, 2, 0.5) + ret(100, 106, 6, 2, 0.5), PRETO)
  ], 50);
}

function cafeteira(cor: string): Amostra {
  return noChao([
    // A espresso: o moedor com os grãos no alto, o manômetro, o grupo com o porta-filtro, o vaporizador e a xícara.
    V(cantos([[22, 8, 2], [46, 8, 2], [42, 28, 1], [26, 28, 1]]), true, 'moedor'),
    P(cantos([[24, 16, 1], [44, 16, 1], [42, 27, 1], [26, 27, 1]]), '#5a3a24', 'graos'),
    M(ret(18, 28, 84, 66, 4), cor, 'corpo'),
    P(ret(66, 24, 14, 4, 1) + ret(84, 24, 12, 4, 1), '#f4f1ea', 'xicaras-em-cima'),
    Mt(circulo(82, 44, 8), METAL), P(circulo(82, 44, 6), '#f4f1ea', 'manometro'), L('M82 44l3-4', 0.9, '#c8372d', { fino: true }),
    Mt(ret(40, 56, 26, 9, 2), METAL, 'grupo'),
    M(membro([[56, 67], [84, 70]], [5, 4]), PRETO, 'porta-filtro'),
    Mt(ret(44, 64, 18, 5, 1.5), '#8d8a85'),
    Mt(membro([[92, 56], [94, 84]], [2.4, 2]), METAL, 'vaporizador'),
    M('M46 76h14v8q0 4-4 4h-6q-4 0-4-4z', '#f4f1ea', 'xicara'),
    Mt(ret(30, 90, 60, 4, 1), METAL, 'bandeja'),
    M(ret(14, 94, 92, 12, 3), escurecer(cor, 0.25))
  ], 50);
}

function loucaTalheres(cor: string): Amostra {
  return noChao([
    // A pilha de pratos (a borda na cor do jogo), a xícara no pires e os talheres de inox deitados na frente.
    M('M8 78v20a30 6 0 0 0 60 0v-20z', '#f4f1ea', 'pratos'),
    L([82, 86, 90, 94].map(y => `M8 ${y}a30 6 0 0 0 60 0`).join(''), 1, cor),
    M(elipse(38, 78, 30, 6), '#f4f1ea'),
    L(elipse(38, 78, 20, 3.8), 1, cor, { marca: 'borda' }),
    M(elipse(92, 100, 18, 4), '#f4f1ea', 'pires'),
    M('M80 80h24v12q0 8-8 8h-8q-8 0-8-8z', '#f4f1ea', 'xicara'),
    L('M104 84q8 0 6 6t-6 4', 1.6, '#cfc8bc'),
    L('M80 86h24', 1.4, cor, { fino: true }),
    Mt(membro([[14, 108], [62, 100]], [2.4, 2.4]), INOX, 'faca'), Mt(cantos([[56, 99, 1], [72, 96, 3], [64, 102, 1]]), INOX),
    Mt(membro([[26, 106], [70, 106]], [2.4, 2.4]) + ret(70, 103, 10, 6, 1.5), INOX, 'garfo')
  ], 54);
}

function ilhaCozinha(cor: string): Amostra {
  const banco = (x: number) => [
    Mt(membro([[x - 6, 80], [x - 8, 108]], [1.8, 1.8]) + membro([[x + 6, 80], [x + 8, 108]], [1.8, 1.8]), '#3a3836'),
    L(`M${x - 7} 96h14`, 1.2, '#3a3836'),
    M(ret(x - 10, 74, 20, 7, 3), '#5a3a24', 'banqueta')
  ];
  return noChao([
    // A bancada no meio da cozinha (o tampo de pedra que avança), os pendentes acesos em cima e as três banquetas.
    L('M42 0v16M78 0v16', 0.8, PRETO),
    M('M34 22q8-8 16 0z', PRETO, 'pendente'), M('M70 22q8-8 16 0z', PRETO),
    Lz(elipse(42, 23, 6, 1.6) + elipse(78, 23, 6, 1.6), '#ffd9a0', { fino: true }),
    M(ret(12, 54, 96, 54, 2), cor, 'ilha'),
    L('M44 58v50M76 58v50', 0.9),
    M(ret(6, 48, 108, 7, 1.5), '#e6e2da', 'tampo'),
    L(marmore(8, 48, 104, 7), 0.5, '#a39a8e', { fino: true }),
    P(elipse(30, 46, 10, 2.4), '#c7522f'), P(circulo(27, 44, 2.6) + circulo(32, 43, 2.6), '#e0a23a'),
    ...banco(28), ...banco(60), ...banco(92)
  ], 56);
}

function armariosPlanejados(cor: string): Amostra {
  return noChao([
    // A parede inteira: os aéreos em cima, a coluna da despensa à direita, a bancada e as gavetas embaixo.
    M(ret(2, 4, 86, 30, 2), cor, 'aereos'),
    L('M23.5 4v30M45 4v30M66.5 4v30', 0.9),
    Mt(ret(19, 26, 2, 6, 0.8) + ret(27, 26, 2, 6, 0.8) + ret(62, 26, 2, 6, 0.8) + ret(70, 26, 2, 6, 0.8), METAL),
    P(ret(2, 34, 86, 24, 0), '#e3ddd3', 'revestimento'),
    L('M2 42h86M2 50h86M14 34v8M34 34v8M54 34v8M74 34v8M24 42v8M44 42v8M64 42v8M84 42v8', 0.4, '#bdb5a8', { fino: true }),
    M(ret(90, 4, 28, 104, 2), cor, 'despensa'),
    L('M90 56h28', 0.9), Mt(ret(93, 42, 2, 12, 0.8) + ret(93, 60, 2, 12, 0.8), METAL),
    M(ret(2, 56, 88, 5, 1), '#3d3a37', 'bancada'),
    M(ret(2, 61, 86, 47, 2), cor, 'gaveteiro'),
    L('M2 76h40M2 92h40M42 61v47M65 61v47', 0.9),
    Mt(ret(12, 67, 20, 2, 1) + ret(12, 83, 20, 2, 1) + ret(12, 99, 20, 2, 1) + ret(58, 70, 2, 12, 0.8) + ret(69, 70, 2, 12, 0.8), METAL, 'puxadores'),
    M(ret(62, 46, 8, 10, 2), '#d8cbb2'), L('M64 46l-2-8M67 46l1-9', 1.2, '#6b5a48', { fino: true }),
    M(ret(14, 48, 10, 8, 2), TERRA), M(circulo(19, 44, 5), VERDE)
  ], 58);
}

/* ============================================================== QUARTOS */

function camaBox(cor: string): Amostra {
  return noChao([
    // A cama de casal vista do pé: a cabeceira simples, os dois travesseiros, o edredom com a dobra do lençol, o box.
    M(ret(8, 28, 104, 44, 3), '#8a6a4a', 'cabeceira'),
    M(ret(16, 46, 40, 14, 6) + ret(64, 46, 40, 14, 6), '#f4f1ea', 'travesseiros'),
    P(ret(6, 58, 108, 6, 3), '#f4f1ea'),
    M(ret(6, 62, 108, 28, 5), cor, 'edredom'),
    L('M6 74q54 4 108 0', 0.8, escurecer(cor, 0.2), { fino: true }),
    M(ret(8, 88, 104, 14, 2), '#e1dbd0', 'box'),
    L('M10 95h100', 0.6, '#b9b2a6', { fino: true }),
    P(ret(12, 102, 5, 6, 1) + ret(103, 102, 5, 6, 1), PRETO)
  ], 56);
}

function camaKing(cor: string): Amostra {
  return noChao([
    // A cabeceira ALTA de veludo em gomos, a pilha de travesseiros, a manta no pé e o recamier com pé de latão.
    M(ret(2, 10, 116, 66, 12), cor, 'cabeceira'),
    L(Array.from({ length: 10 }, (_, k) => `M${13 + k * 10.4} 14v58`).join(''), 0.9, escurecer(cor, 0.25), { marca: 'gomos' }),
    M(ret(10, 38, 46, 24, 7) + ret(64, 38, 46, 24, 7), '#ece8e1', 'travesseiros'),
    M(ret(16, 50, 36, 16, 6) + ret(68, 50, 36, 16, 6), clarear(cor, 0.25)),
    M(ret(46, 58, 28, 10, 5), escurecer(cor, 0.1)),
    M(ret(4, 66, 112, 22, 5), '#ece8e1', 'edredom'),
    M(ret(4, 74, 112, 12, 4), escurecer(cor, 0.12), 'manta'),
    M(ret(6, 86, 108, 8, 3), cor, 'base'),
    M(ret(18, 92, 84, 10, 4), clarear(cor, 0.1), 'recamier'),
    Mt(membro([[24, 102], [22, 108]], [2, 1.6]) + membro([[96, 102], [98, 108]], [2, 1.6]), LATAO, 'pes-latao')
  ], 58);
}

function colchaoHotel(cor: string): Amostra {
  const fita = '#2a3550';
  const tufos = Array.from({ length: 3 }, (_, l) => Array.from({ length: 7 }, (_, c) => { const v = (l + 0.5) / 3, u = (c + 0.5) / 7; const x0 = 24 - 16 * v, x1 = 112 - 12 * v; return circulo(x0 + (x1 - x0) * u, 46 + 18 * v, 1); }).join('')).join('');
  return noChao([
    // O colchão sozinho, GROSSO, em perspectiva: o tampo acolchoado com os tufos, a camada de pillow top, a fita da borda,
    // os respiros de latão, as alças e a etiqueta da mão de obra.
    M(cantos([[100, 64, 2], [112, 46, 4], [112, 76, 2], [100, 96, 2]]), escurecer(cor, 0.1), 'lateral'),
    M(cantos([[24, 46, 6], [112, 46, 6], [100, 64, 4], [8, 64, 4]]), clarear(cor, 0.06), 'tampo'),
    P(tufos, escurecer(cor, 0.25), 'tufos'),
    M(ret(8, 64, 92, 32, 3), cor, 'frente'),
    P(ret(8, 64, 92, 9, 3), clarear(cor, 0.1), 'pillow-top'),
    L('M8 64h92M8 73h92M8 96h92', 1.4, fita, { marca: 'fita' }),
    L(Array.from({ length: 22 }, (_, k) => `M${11 + k * 4} 84.5h2`).join(''), 0.7, escurecer(cor, 0.3), { fino: true }),
    P(ret(24, 79, 10, 5, 2) + ret(74, 79, 10, 5, 2), '#b9a37a', 'alcas'),
    Mt(circulo(50, 88, 1.5) + circulo(58, 88, 1.5), LATAO, 'respiros'),
    P(ret(84, 86, 12, 7, 0.5), '#c9a23a', 'etiqueta'), L('M86 89.5h8', 0.6, fita, { fino: true }),
    P(ret(10, 96, 90, 10, 2), '#d8d2c8'), P(ret(10, 106, 4, 2, 0.5) + ret(94, 106, 4, 2, 0.5), PRETO)
  ], 56);
}

function guardaRoupa(cor: string): Amostra {
  return noChao([
    // Seis portas altas (os puxadores aos pares), o espelho numa delas, a fileira de gavetas embaixo.
    M(ret(4, 8, 112, 100, 2), cor, 'corpo'),
    P(ret(2, 6, 116, 4, 1), escurecer(cor, 0.15)),
    L(Array.from({ length: 5 }, (_, k) => `M${22.7 + k * 18.7} 10v78`).join('') + 'M4 88h112', 1, undefined, { marca: 'portas' }),
    V(ret(44, 16, 14, 64, 1.5), true, 'espelho'),
    Mt([1, 3, 5].map(k => ret(4 + k * 18.7 - 3.6, 44, 1.6, 12, 0.6) + ret(4 + k * 18.7 + 2, 44, 1.6, 12, 0.6)).join(''), METAL, 'puxadores'),
    L('M4 98h112M60 88v20', 0.8),
    Mt(ret(26, 92, 12, 1.6, 0.6) + ret(82, 92, 12, 1.6, 0.6) + ret(26, 102, 12, 1.6, 0.6) + ret(82, 102, 12, 1.6, 0.6), METAL)
  ], 58);
}

function closet(cor: string): Amostra {
  const roupas = ['#2f4a6b', '#e8e2d6', '#9b3a2a', '#cdb898', '#3a3836', '#6f7a3c'];
  const cabide = (x: number, y: number, c: string, longo: number) => [
    L(`M${x} ${y - 3}v3`, 0.7, METAL),
    P(cantos([[x - 5, y, 2], [x + 5, y, 2], [x + 6, y + longo, 1], [x - 6, y + longo, 1]]), c, 'roupa')
  ];
  const dobradas = (x: number, y: number) => [0, 1, 2].map(k => P(ret(x, y - (k + 1) * 4, 14, 3.6, 1), roupas[(k + x) % 6]));
  return noChao([
    // A parede inteira aberta: os cabides à vista (camisas, vestidos, casacos), as pilhas dobradas, os sapatos,
    // a fita de luz debaixo de cada prateleira — e a ilha de gavetas com o tampo de vidro dos relógios.
    M(ret(2, 4, 116, 104, 2), cor, 'closet'),
    P(ret(6, 8, 34, 96, 1) + ret(43, 8, 34, 96, 1) + ret(80, 8, 34, 96, 1), '#efe7d8', 'fundo'),
    Mt(ret(6, 16, 34, 1.6, 0.8) + ret(80, 16, 34, 1.6, 0.8), METAL, 'varao'),
    ...[0, 1, 2, 3, 4].flatMap(k => cabide(10 + k * 6.4, 19, roupas[k], 28 + (k % 2) * 6)),
    ...[0, 1, 2, 3, 4].flatMap(k => cabide(84 + k * 6.4, 19, roupas[(k + 2) % 6], 50 + (k % 2) * 8)),
    P(ret(6, 60, 34, 2.4, 0.5) + ret(6, 80, 34, 2.4, 0.5) + [26, 44, 62].map(y => ret(43, y, 34, 2.4, 0.5)).join(''), cor, 'prateleiras'),
    Lz(ret(6, 62.4, 34, 1, 0.5) + ret(6, 82.4, 34, 1, 0.5) + [28.4, 46.4, 64.4].map(y => ret(43, y, 34, 1, 0.5)).join('') + ret(6, 9, 34, 1, 0.5) + ret(80, 9, 34, 1, 0.5), '#ffe3a8', { fino: true, marca: 'led' }),
    ...dobradas(45, 26), ...dobradas(61, 26), ...dobradas(45, 44), ...dobradas(61, 44),
    P([0, 1, 2].map(k => cantos([[9 + k * 10, 78, 2], [16 + k * 10, 74, 2], [17 + k * 10, 78, 1]])).join('') + [0, 1, 2].map(k => cantos([[9 + k * 10, 98, 2], [16 + k * 10, 94, 2], [17 + k * 10, 98, 1]])).join(''), '#5a3320', 'sapatos'),
    M(ret(32, 78, 56, 30, 2), cor, 'ilha'),
    V(ret(34, 74, 52, 6, 1), true, 'tampo-vidro'),
    Mt(circulo(42, 77, 1.8) + circulo(52, 77, 1.8) + circulo(62, 77, 1.8), LATAO, 'relogios'), Mt(circulo(72, 77, 1.8) + circulo(80, 77, 1.8), INOX),
    L('M32 88h56M32 98h56', 0.8), Mt(ret(54, 92, 12, 1.6, 0.6) + ret(54, 102, 12, 1.6, 0.6), LATAO)
  ], 58);
}

function penteadeira(cor: string): Amostra {
  return noChao([
    // O espelho com as lâmpadas em volta (o camarim), a mesa com as gavetas, o perfume — e a banqueta.
    M(ret(30, 8, 60, 50, 4), cor, 'moldura'),
    V(ret(35, 13, 50, 42, 2), true, 'espelho'),
    Lz([0, 1, 2, 3].map(k => circulo(33, 16 + k * 12, 1.8) + circulo(87, 16 + k * 12, 1.8)).join('') + [0, 1, 2].map(k => circulo(46 + k * 14, 10.5, 1.8)).join(''), '#fff1c7', { marca: 'lampadas' }),
    M(ret(10, 56, 100, 6, 2), cor, 'tampo'),
    M(ret(14, 62, 92, 14, 2), escurecer(cor, 0.05)), L('M44.6 62v14M75.3 62v14', 0.9),
    Mt(circulo(29, 69, 1.4) + circulo(60, 69, 1.4) + circulo(91, 69, 1.4), LATAO),
    M(membro([[18, 76], [16, 108]], [3, 2.4]) + membro([[102, 76], [104, 108]], [3, 2.4]), escurecer(cor, 0.15), 'pes'),
    V(ret(92, 46, 7, 10, 2), true), P(ret(94, 43, 3, 3, 0.5), LATAO),
    M(ret(38, 82, 44, 9, 4), '#d9a3a0', 'banqueta'), M(ret(42, 91, 3, 17, 1) + ret(75, 91, 3, 17, 1), escurecer(cor, 0.15))
  ], 54);
}

function criadoMudo(cor: string): Amostra {
  const mesa = (x: number) => [
    M(ret(x, 64, 40, 34, 3), cor, 'mesa'), L(`M${x} 76h40`, 0.9), Mt(circulo(x + 20, 70, 1.6), METAL),
    M(ret(x + 3, 98, 4, 10, 1) + ret(x + 33, 98, 4, 10, 1), escurecer(cor, 0.2))
  ];
  return noChao([
    // O PAR: uma de cada lado (o vão da cama no meio), o abajur numa, o livro, o copo e o celular carregando na outra.
    ...mesa(4), ...mesa(76),
    M(ret(20, 50, 8, 14, 2), '#d8cbb2'), M(cantos([[14, 36, 2], [34, 36, 2], [37, 50, 2], [11, 50, 2]]), '#efe6d2', 'abajur'),
    Lz(elipse(24, 51, 8, 1.4), '#ffe3a8', { fino: true }),
    P(ret(80, 58, 20, 6, 1), '#3c5e9a', 'livro'), P(ret(82, 54, 16, 4, 1), '#c7522f'),
    V(ret(102, 52, 7, 12, 1.5), true, 'copo'),
    P(ret(86, 51, 8, 3, 1), PRETO), Lz(circulo(93, 52.5, 0.8), '#7cc06a', { fino: true })
  ], 54);
}

function espelhoChao(cor: string): Amostra {
  return noChao([
    // O espelho de corpo inteiro ENCOSTADO (inclinado), a moldura fina e o reflexo.
    G('rotate(-5 60 108)', [
      M(ret(36, 6, 48, 102, 2), cor, 'moldura'),
      V(ret(39.5, 9.5, 41, 95, 1), true, 'espelho'),
      L('M44 40l20-22M46 56l30-32M50 90l26-28', 1, '#ffffff', { fino: true })
    ])
  ], 28);
}

function comoda(cor: string): Amostra {
  return noChao([
    // A cômoda: quatro gavetas fundas com dois puxadores cada, o tampo que sobra, os pés curtos; um porta-retrato em cima.
    M(ret(10, 36, 100, 6, 2), clarear(cor, 0.08), 'tampo'),
    M(ret(14, 42, 92, 58, 2), cor, 'corpo'),
    L('M14 56.5h92M14 71h92M14 85.5h92', 1, undefined, { marca: 'gavetas' }),
    Mt([0, 1, 2, 3].map(k => circulo(36, 49 + k * 14.5, 1.6) + circulo(84, 49 + k * 14.5, 1.6)).join(''), METAL),
    M(ret(16, 100, 6, 8, 1) + ret(98, 100, 6, 8, 1), escurecer(cor, 0.2)),
    M(ret(24, 20, 16, 16, 1), '#3a2f2a', 'porta-retrato'), P(ret(26, 22, 12, 12, 0.5), '#c9b79a'),
    M(suave([[86, 36], [82, 28], [86, 18], [94, 18], [98, 28], [94, 36]], true, 0.4), '#7a9aa8', 'vaso')
  ], 52);
}

function camaSolteiro(cor: string): Amostra {
  const pinho = '#d9a86a';
  return noChao([
    // A cama de solteiro de lado (cabeceira, peseira) com a GAVETA da bicama puxada embaixo, o colchãozinho dentro.
    M(ret(4, 40, 10, 68, 2), pinho, 'cabeceira'), M(ret(104, 60, 8, 48, 2), pinho, 'peseira'),
    M(ret(12, 70, 94, 18, 2), pinho, 'estrado'),
    M(ret(14, 60, 90, 11, 4), '#f4f1ea', 'colchao'),
    M(ret(18, 52, 22, 10, 5), '#f4f1ea', 'travesseiro'),
    M(cantos([[40, 56, 4], [104, 58, 4], [104, 72, 3], [40, 72, 3]]), cor, 'coberta'),
    M(ret(26, 90, 92, 12, 2), clarear(pinho, 0.15), 'bicama'),
    P(ret(28, 88, 88, 4, 2), '#ece8e1'),
    P(ret(66, 94, 12, 2.4, 1), escurecer(pinho, 0.35)),
    P(circulo(34, 105, 2.6) + circulo(110, 105, 2.6), PRETO)
  ], 56);
}

function sofaCama(cor: string): Amostra {
  return noChao([
    // O sofá ABERTO: o encosto e os braços atrás, o colchão desdobrado para a frente com o travesseiro e a manta.
    M(ret(10, 38, 100, 30, 6), cor, 'encosto'),
    M(ret(4, 52, 14, 34, 5), cor, 'braco'), M(ret(102, 52, 14, 34, 5), cor),
    M(ret(18, 64, 84, 10, 3), escurecer(cor, 0.1)),
    M(cantos([[18, 72, 3], [102, 72, 3], [114, 96, 3], [6, 96, 3]]), '#ece8e1', 'colchao'),
    L('M12 84h96', 0.8, '#b9b2a6', { fino: true }),
    M(cantos([[24, 72, 4], [50, 72, 4], [50, 80, 4], [22, 80, 4]]), '#f4f1ea', 'travesseiro'),
    M(cantos([[60, 80, 2], [108, 80, 2], [112, 92, 2], [58, 92, 2]]), clarear(cor, 0.3), 'manta'),
    M(ret(6, 96, 108, 4, 1), '#8d8a85'),
    Mt(ret(10, 100, 3, 8, 1) + ret(107, 100, 3, 8, 1) + ret(58, 100, 3, 8, 1), '#5d5a56', 'mecanismo')
  ], 56);
}

function beliche(cor: string): Amostra {
  const cama = (y: number, edredom: string) => [
    M(ret(10, y + 8, 100, 9, 2), cor, 'estrado'),
    M(ret(14, y, 92, 9, 3), '#f4f1ea'),
    M(ret(16, y - 6, 20, 8, 4), '#f4f1ea'),
    M(cantos([[36, y - 2, 3], [106, y - 1, 3], [106, y + 8, 2], [36, y + 8, 2]]), edredom, 'edredom')
  ];
  return noChao([
    // Duas camas uma em cima da outra: os quatro pés altos, a grade de proteção em cima, a escada de lado.
    M(ret(6, 8, 7, 100, 2) + ret(107, 8, 7, 100, 2), cor, 'colunas'),
    ...cama(36, '#6f93ad'),
    M(ret(13, 22, 60, 4, 1.5), cor, 'grade'), M([0, 1, 2, 3].map(k => ret(22 + k * 14, 26, 3, 10, 1)).join(''), cor),
    ...cama(84, '#c58b6a'),
    M(ret(84, 44, 3.4, 64, 1) + ret(100, 44, 3.4, 64, 1), escurecer(cor, 0.1), 'escada'),
    M([0, 1, 2, 3, 4].map(k => ret(84, 52 + k * 11, 19, 3, 1)).join(''), escurecer(cor, 0.1))
  ], 56);
}

/* ============================================================== BANHEIRO */

function banheira(cor: string): Amostra {
  return noChao([
    // A banheira de imersão SOLTA: a cabeceira alta e inclinada, o corpo funda, a água, a torneira de piso.
    Mt(membro([[114, 108], [114, 34], [108, 28], [100, 30], [98, 36]], [3, 3, 3, 2.6, 2.4]), INOX, 'torneira'),
    M(suave([[4, 34], [22, 46], [60, 52], [96, 50], [110, 46], [106, 82], [90, 106], [28, 106], [12, 80]], true, 0.38), cor, 'corpo'),
    P(suave([[10, 40], [30, 50], [70, 55], [104, 50], [96, 58], [50, 60], [24, 54]], true, 0.4), '#bfe0ea', 'agua'),
    L('M12 42c18 10 50 14 92 8', 1, clarear(cor, 0.5), { fino: true }),
    P(ret(34, 106, 52, 3, 1), escurecer(cor, 0.25))
  ], 52);
}

function banheiraPedra(cor: string): Amostra {
  return noChao([
    // Um bloco de pedra ESCAVADO: a forma orgânica e grossa, a borda larga, o veio, as marcas de cinzel, a bica de bronze
    // e a plaquinha do ateliê (numerada).
    Mt(membro([[110, 108], [110, 26], [102, 20], [92, 22], [90, 30]], [3.4, 3.4, 3.4, 3, 2.6]), '#a5773a', 'bica'),
    M(suave([[4, 60], [16, 46], [60, 40], [104, 46], [116, 60], [112, 92], [98, 106], [22, 106], [8, 92]], true, 0.42), cor, 'pedra'),
    P(elipse(60, 52, 46, 8.5), escurecer(cor, 0.16), 'borda-interna'),
    P(elipse(60, 54, 40, 6), '#8fc0cf', 'agua'),
    L('M14 66c10 8 18 4 26 16s20 8 26 20M72 50c-4 14 8 22 6 36s10 12 14 18M94 60c-6 10 2 16 10 22', 0.9, escurecer(cor, 0.32), { marca: 'veio' }),
    L('M20 92c6-2 10-6 12-12M30 98c4-4 6-6 6-10M86 96c4-2 6-8 6-12', 0.6, clarear(cor, 0.4), { fino: true, marca: 'cinzel' }),
    P(ret(52, 92, 16, 6, 0.5), '#b9a37a', 'placa'), L('M55 95h10', 0.5, '#5a4a30', { fino: true })
  ], 56);
}

function ducha(cor: string): Amostra {
  return noChao([
    // A ducha de teto: o braço descendo, o chuveirão quadrado e largo, a chuva reta, o vidro de lado, o ralo linear.
    Mt(ret(58, 0, 4, 12, 1), cor, 'braco'),
    Mt(cantos([[26, 12, 1.5], [94, 12, 1.5], [98, 17, 1.5], [22, 17, 1.5]]), cor, 'chuveirao'),
    L(Array.from({ length: 12 }, (_, k) => `M${27 + k * 6} ${20 + (k % 3) * 3}v${70 - (k % 3) * 6}`).join(''), 0.8, '#8fc3dc', { marca: 'agua' }),
    V(cantos([[4, 4, 1], [14, 8, 1], [14, 104, 1], [4, 108, 1]]), true, 'vidro'),
    P(ret(18, 100, 86, 8, 1.5), '#dcd8d0', 'piso'), Mt(ret(30, 102, 60, 2, 0.8), cor, 'ralo'),
    Mt(circulo(108, 58, 5), cor, 'registro'), Mt(ret(106, 52, 12, 2.6, 1), cor),
    P(circulo(42, 98, 1.2) + circulo(64, 99, 1.2) + circulo(80, 97, 1.2), '#bfe0ea', undefined, { fino: true })
  ], 46);
}

function gabinete(cor: string): Amostra {
  return noChao([
    // O armário de pia: a cuba no tampo, a torneira, as duas portas e a toalhinha pendurada.
    Mt(membro([[60, 52], [60, 36], [66, 32], [72, 36]], [3, 3, 2.6, 2.4]), INOX, 'torneira'),
    M(ret(14, 50, 92, 8, 3), '#efece6', 'tampo'),
    P(elipse(60, 53, 22, 2.4), '#cfc8bc', 'cuba'),
    M(ret(18, 58, 84, 46, 2), cor, 'armario'),
    L('M60 58v46', 1),
    Mt(ret(54, 76, 2, 10, 0.8) + ret(64, 76, 2, 10, 0.8), METAL),
    P(cantos([[24, 60, 1], [36, 60, 1], [36, 82, 2], [24, 82, 2]]), '#9db9d6', 'toalha'),
    P(ret(20, 104, 80, 4, 1), escurecer(cor, 0.35))
  ], 46);
}

function bancadaMarmore(cor: string): Amostra {
  return noChao([
    // O espelho de ponta a ponta com o filete de latão, a bancada de mármore com o veio, as DUAS cubas de apoio com as
    // bicas de parede, a prateleira de baixo com as toalhas enroladas e as pernas de latão.
    Mt(ret(4, 4, 112, 34, 2), LATAO, 'moldura'),
    V(ret(6, 6, 108, 30, 1), true, 'espelho'),
    L('M20 30l14-20M28 32l18-24M82 30l14-20', 0.9, '#ffffff', { fino: true }),
    Mt(ret(33, 38, 4, 6, 1) + ret(83, 38, 4, 6, 1), LATAO, 'bicas'), Mt(ret(33, 42, 10, 2.4, 1) + ret(83, 42, 10, 2.4, 1), LATAO),
    M('M20 48h30q0 8-15 8t-15-8z' + 'M70 48h30q0 8-15 8t-15-8z', '#f4f1ea', 'cubas'),
    M(ret(2, 54, 116, 12, 2), cor, 'bancada'),
    L(marmore(2, 54, 116, 12), 0.8, '#8f877c', { fino: true, marca: 'veio' }),
    Mt(ret(8, 66, 3, 42, 1) + ret(109, 66, 3, 42, 1), LATAO, 'pernas'),
    M(ret(8, 88, 104, 5, 1.5), cor),
    M(circulo(26, 82, 6) + circulo(40, 82, 6) + circulo(33, 74, 6), '#ece8e1', 'toalhas'),
    P(circulo(26, 82, 2) + circulo(40, 82, 2) + circulo(33, 74, 2), '#cfc8bc', undefined, { fino: true }),
    M(ret(84, 78, 14, 10, 2), '#3a3836'), M(ret(88, 72, 6, 6, 1), '#c9b79a')
  ], 58);
}

function espelhoLed(cor: string): Amostra {
  return naParede([
    // O espelho de cantos redondos com a luz em volta (o halo) — sem sombra no rosto — e o botão de toque.
    Lz(ret(22, 6, 76, 104, 30), '#fff0c4', { marca: 'halo' }),
    M(ret(26, 10, 68, 96, 27), cor, 'moldura'),
    V(ret(29, 13, 62, 90, 25), true, 'espelho'),
    L('M38 50l22-26M42 72l34-38', 1, '#ffffff', { fino: true }),
    Lz(circulo(60, 96, 2), '#ffffff', { fino: true })
  ]);
}

function toalheiro(cor: string): Amostra {
  return naParede([
    // A escada de tubos na parede (aquecida: o calor subindo) com a toalha dobrada num dos tubos.
    Mt(ret(28, 8, 5, 100, 2.5) + ret(87, 8, 5, 100, 2.5), cor, 'tubos'),
    Mt([0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => ret(30, 14 + k * 11, 60, 3, 1.5)).join(''), cor, 'barras'),
    M(cantos([[40, 34, 2], [80, 34, 2], [80, 72, 2], [40, 72, 2]]), '#e9ddc8', 'toalha'),
    P(ret(40, 34, 40, 6, 2), clarear('#e9ddc8', 0.3)),
    L('M40 64h40M40 67h40', 0.7, '#c9b79a', { fino: true }),
    L('M44 6q3-3 0-6M60 6q3-3 0-6M76 6q3-3 0-6', 0.9, '#e07b2c', { fino: true, marca: 'calor' }),
    L('M92 100q10 2 10 10', 1, PRETO, { fino: true })
  ]);
}

function toalhas(cor: string): Amostra {
  return noChao([
    // A pilha de toalhas felpudas dobradas, a saboneteira e o tapete antiderrapante.
    M(ret(8, 88, 56, 14, 5), cor, 'toalha'),
    M(ret(11, 75, 50, 13, 5), clarear(cor, 0.35), 'toalha'),
    M(ret(14, 62, 44, 13, 5), cor, 'toalha'),
    L('M8 96h56M11 82h50M14 69h44', 0.7, escurecer(cor, 0.2), { fino: true }),
    P(cantos([[60, 102, 2], [114, 102, 2], [118, 108, 1], [56, 108, 1]]), clarear(cor, 0.2), 'tapete'),
    L('M64 105h48', 0.6, cor, { fino: true }),
    M(ret(82, 68, 16, 30, 4), '#f4f1ea', 'dispenser'), Mt(ret(87, 60, 6, 8, 1) + ret(87, 60, 12, 2.4, 1), METAL),
    M('M66 96h14q0 4-7 4t-7-4z', '#cfc8bc', 'saboneteira'), M(ret(68, 92, 10, 4, 2), '#e8c4c0')
  ], 56);
}

function sauna(cor: string): Amostra {
  return noChao([
    // A cabine de tábuas, a porta de vidro (o banco de dentro aparece), o termômetro, o balde com a concha.
    M(ret(6, 10, 108, 98, 3), cor, 'cabine'),
    L(Array.from({ length: 13 }, (_, k) => `M6 ${17 + k * 7}h108`).join(''), 0.6, escurecer(cor, 0.25), { fino: true, marca: 'tabuas' }),
    M(ret(4, 6, 112, 7, 1.5), escurecer(cor, 0.2)),
    M(ret(14, 22, 40, 86, 2), escurecer(cor, 0.3), 'porta'),
    V(ret(18, 26, 32, 76, 1.5), true, 'vidro'),
    P(ret(18, 62, 32, 4, 0.5) + ret(18, 80, 32, 4, 0.5), '#c99a5a', undefined, { opacidade: 0.8 }),
    Mt(ret(46, 52, 2.4, 22, 1), clarear(cor, 0.2), 'puxador'),
    P(circulo(92, 36, 9), '#f4f1ea', 'termometro'), Mt(`${circulo(92, 36, 10)}`, '#a8743f'), P(circulo(92, 36, 8), '#f4f1ea'), L('M92 36l4-5', 0.8, '#c8372d', { fino: true }),
    M('M70 88h22l-2 18h-18z', '#a8743f', 'balde'), Mt(ret(70, 92, 22, 1.6, 0.5) + ret(70, 100, 22, 1.6, 0.5), LATAO),
    Mt(membro([[84, 90], [104, 70]], [2, 2]), '#6e3f22'), M(elipse(104, 70, 4, 3), '#6e3f22', 'concha'),
    L('M24 6q3-3 0-6M60 6q3-3 0-6M96 6q3-3 0-6', 0.9, '#e07b2c', { fino: true })
  ], 58);
}

/* ============================================================== PISCINA */

function espreguicadeiras(cor: string, teca: boolean): Amostra {
  const lado = (x: number, dy: number, fundo: boolean): Peca[] => {
    const y = 84 + dy, tinta = fundo ? escurecer(cor, 0.12) : cor, almofada = fundo ? '#d8d0c0' : '#e7dfd0';
    if (!teca) return [
      Mt(membro([[x + 4, y], [x + 2, 108 + dy * 0.2]], [2, 2]) + membro([[x + 54, y], [x + 58, 108 + dy * 0.2]], [2, 2]), METAL),
      M(ret(x, y - 3, 60, 5, 2), tinta, 'tela'),
      L(Array.from({ length: 11 }, (_, k) => `M${x + 3 + k * 5.4} ${y - 2.6}v4`).join(''), 0.5, clarear(tinta, 0.4), { fino: true }),
      G(`rotate(48 ${x + 1} ${y - 1})`, [M(ret(x - 34, y - 3, 35, 5, 2), tinta), L(Array.from({ length: 6 }, (_, k) => `M${x - 31 + k * 5.4} ${y - 2.6}v4`).join(''), 0.5, clarear(tinta, 0.4), { fino: true })]),
      Mt(membro([[x, y + 1], [x + 60, y + 1]], [1.6, 1.6]), METAL)
    ];
    return [
      M(ret(x + 2, y + 6, 5, 18 - dy * 0.8, 1) , escurecer(tinta, 0.2)),
      { tipo: 'pneu', cx: x + 58, cy: y + 18 - dy * 0.8, r: 6, aro: 'calota' },
      M(ret(x - 2, y, 66, 7, 2), escurecer(tinta, 0.12), 'trilho'),
      M(ret(x, y - 5, 62, 6, 2), tinta, 'ripas'),
      L(Array.from({ length: 11 }, (_, k) => `M${x + 5 + k * 5.4} ${y - 5}v6`).join(''), 0.6, escurecer(tinta, 0.35), { fino: true }),
      G(`rotate(42 ${x + 1} ${y - 2})`, [M(ret(x - 36, y - 5, 37, 6, 2), tinta), L(Array.from({ length: 6 }, (_, k) => `M${x - 32 + k * 5.4} ${y - 5}v6`).join(''), 0.6, escurecer(tinta, 0.35), { fino: true }),
        M(ret(x - 34, y - 10, 34, 5, 2.4), almofada, 'almofada')]),
      M(ret(x + 1, y - 10, 60, 5, 2.4), almofada)
    ];
  };
  return noChao([
    // Duas espreguiçadeiras de lado, uma atrás da outra: o encosto levantado, o assento comprido. A de alumínio tem a
    // tela listrada e os pés de tubo; a de teca, as ripas, a almofada, a rodinha no pé e a mesinha com o copo.
    ...lado(48, -10, true), ...lado(34, 0, false),
    ...(teca ? [M(ret(98, 84, 18, 4, 1), cor, 'mesinha'), M(ret(101, 88, 3, 20, 1) + ret(110, 88, 3, 20, 1), escurecer(cor, 0.2)), V(ret(104, 74, 6, 10, 1.5), true), P(ret(105, 78, 4, 5, 0.8), '#e0a23a')] : [])
  ], 54);
}

function guardaSol(cor: string): Amostra {
  const borda = Array.from({ length: 8 }, (_, k) => `Q${f(112 - k * 13 - 6.5)} 46 ${f(112 - (k + 1) * 13)} 40`).join('');
  return noChao([
    // O guarda-sol de praia: o mastro no meio, a copa de gomos listrados com a borda recortada, a base.
    Mt(membro([[60, 22], [60, 104]], [2.4, 2.4]), METAL, 'mastro'),
    M(`M8 40Q60 4 112 40${borda}Z`, cor, 'copa'),
    P([0, 2, 4, 6].map(k => poligono([[60, 22], [8 + k * 13, 40], [8 + (k + 1) * 13, 40]])).join(''), '#f4f1ea', 'gomos'),
    Mt(circulo(60, 22, 2.4), METAL),
    M(ret(48, 102, 24, 6, 2), '#4a4643', 'base')
  ], 30);
}

function ombrelone(cor: string): Amostra {
  const aluminio = '#4a4f57';
  return noChao([
    // O ombrelone: o mastro DE LADO na base em cruz com os pesos, o braço curvo que passa por cima, a copa pendurada
    // na ponta — a sombra sem o mastro no meio.
    Mt(ret(74, 102, 44, 5, 1.5), aluminio, 'base'), P(ret(76, 95, 16, 7, 1.5) + ret(100, 95, 16, 7, 1.5), '#8d8a85', 'pesos'),
    Mt(ret(94, 14, 5, 90, 2), aluminio, 'mastro'),
    Mt(membro([[96, 16], [80, 10], [60, 12], [46, 22]], [3.4, 3.4, 3.4, 3]), aluminio, 'braco'),
    Mt(circulo(100, 60, 3), METAL, 'manivela'),
    M(cantos([[6, 46, 2], [46, 24, 1], [86, 46, 2], [80, 52, 2], [12, 52, 2]]), cor, 'copa'),
    L('M46 24L18 50M46 24L46 52M46 24L74 50', 0.8, escurecer(cor, 0.25), { fino: true }),
    P(ret(8, 47, 76, 5, 1.5), escurecer(cor, 0.12), 'babado'),
    Mt(circulo(46, 23, 2.2), aluminio)
  ], 44, 54);
}

function mesaExterna(cor: string): Amostra {
  const cadeira = (x: number, lado: 1 | -1) => [
    Mt(membro([[x, 70], [x, 108]], [2, 2]) + membro([[x + lado * 16, 78], [x + lado * 18, 108]], [2, 2]), cor),
    M(cantos([[x, 76, 1], [x + lado * 20, 76, 1], [x + lado * 20, 80, 1], [x, 80, 1]]), cor, 'cadeira'),
    M([0, 1, 2].map(k => ret(Math.min(x, x - lado * 1) - (lado < 0 ? 2 : 0), 46 + k * 8, 4, 5, 1)).join(''), clarear(cor, 0.2))
  ];
  return noChao([
    // A mesa redonda de alumínio com o furo do guarda-sol e as cadeiras de encosto ripado dos lados.
    ...cadeira(10, 1), ...cadeira(110, -1),
    Mt(membro([[40, 72], [34, 108]], [2.6, 2]) + membro([[80, 72], [86, 108]], [2.6, 2]) + membro([[60, 74], [60, 106]], [2.6, 2]), cor),
    M('M24 66a36 7 0 0 0 72 0v4a36 7 0 0 1-72 0z', escurecer(cor, 0.1)),
    M(elipse(60, 66, 36, 7), clarear(cor, 0.12), 'tampo'),
    L('M30 66h60M34 63h52M34 69h52', 0.5, escurecer(cor, 0.2), { fino: true }),
    P(elipse(60, 66, 2.4, 1), PRETO),
    V(ret(40, 56, 6, 9, 1.5), true), P(ret(41, 59, 4, 5, 0.8), '#e0a23a')
  ], 54);
}

function sofaExterno(cor: string): Amostra {
  const corda = '#c9b79a', teca = '#a8743f';
  return noChao([
    // A estrutura de CORDA trançada (o xadrez da trama), as almofadas grossas, o pé de teca.
    M(ret(8, 36, 104, 42, 6), corda, 'trama'),
    L(trama(10, 38, 100, 38, 6), 0.6, escurecer(corda, 0.3), { fino: true }),
    M(ret(2, 56, 18, 34, 5) + ret(100, 56, 18, 34, 5), corda, 'bracos'),
    L(trama(4, 58, 14, 30, 6) + trama(102, 58, 14, 30, 6), 0.6, escurecer(corda, 0.3), { fino: true }),
    M(ret(20, 44, 39, 28, 8) + ret(61, 44, 39, 28, 8), cor, 'almofadas'),
    M(ret(18, 70, 84, 16, 5), clarear(cor, 0.06), 'assento'),
    L('M60 70v16', 0.9, escurecer(cor, 0.2)),
    M(cantos([[26, 50, 4], [42, 48, 4], [44, 64, 4], [28, 66, 4]]), '#2f6db3', 'almofadinha'),
    M(ret(4, 88, 112, 6, 2), teca, 'base'),
    M(ret(8, 94, 6, 14, 1) + ret(106, 94, 6, 14, 1), escurecer(teca, 0.15), 'pes')
  ], 58);
}

function boias(cor: string): Amostra {
  const anel = `${elipse(28, 90, 24, 13)}M${12} 90a16 7 0 1 1 32 0a16 7 0 1 1 -32 0z`;
  return noChao([
    // O flamingo inflável (o pescoço em S), a boia de anel listrada e a bola de praia.
    M(anel, '#e07b2c', 'boia'),
    P('M16 80l6 3-2 5-7-3zM40 97l6 3-2 5-7-3zM44 82l-5 4 3 5 6-5zM12 99l-5 4 3 5 6-5z', '#f4f1ea'),
    M(suave([[56, 98], [62, 84], [80, 78], [104, 82], [114, 94], [106, 104], [66, 106]], true, 0.4), cor, 'flamingo'),
    M(membro([[96, 84], [92, 64], [96, 48], [104, 44], [108, 50]], [9, 6, 5, 5, 5]), cor),
    M(circulo(106, 46, 6), cor),
    P(cantos([[110, 44, 1], [118, 50, 1], [111, 52, 1]]), PRETO, 'bico'),
    P(circulo(105, 44, 1.2), PRETO),
    M(cantos([[66, 90, 6], [84, 84, 6], [88, 98, 4], [68, 100, 4]]), escurecer(cor, 0.1), 'asa'),
    M(circulo(48, 66, 12), '#f4f1ea', 'bola'),
    P('M48 54a12 12 0 0 1 10 6L48 66zM38 72a12 12 0 0 1-2-8L48 66zM56 76a12 12 0 0 1-12 1L48 66z', '#c8372d'),
    P('M58 60a12 12 0 0 1 2 8L48 66zM36 64a12 12 0 0 1 4-8L48 66z', '#2f6db3')
  ], 56);
}

function luzPiscina(cor: string): Amostra {
  return noChao([
    // Um corte da piscina de noite: a borda, a água escura acesa por dentro pelos refletores redondos (o halo azul).
    M(ret(4, 30, 112, 78, 3), '#1d4f6e', 'agua'),
    ...[24, 60, 96].map(x => P(circulo(x, 74, 20), clarear(cor, 0.2), undefined, { opacidade: 0.35 })),
    ...[24, 60, 96].map(x => P(circulo(x, 74, 11), clarear(cor, 0.45), undefined, { opacidade: 0.45 })),
    Mt([24, 60, 96].map(x => circulo(x, 74, 6)).join(''), INOX, 'refletor'),
    Lz([24, 60, 96].map(x => circulo(x, 74, 4.4)).join(''), clarear(cor, 0.6), { marca: 'luz' }),
    L('M10 44q10-3 20 0t20 0 20 0 20 0 20 0 10-1', 0.9, '#bfe6f2', { fino: true }),
    L('M8 100h104M8 90h104', 0.4, '#3f7a9a', { fino: true }),
    M(ret(2, 26, 116, 8, 2), '#e8e4dc', 'borda')
  ], 56);
}

function aquecedorPiscina(cor: string): Amostra {
  return noChao([
    // As placas coletoras inclinadas no suporte (os tubos pretos), os canos descendo — e o sol.
    Lz(circulo(18, 18, 9), '#f7d36b', { marca: 'sol' }),
    L('M18 3v4M18 29v4M3 18h4M29 18h4M8 8l3 3M25 25l3 3M28 8l-3 3M8 28l3-3', 1.2, '#e2b72d', { fino: true }),
    Mt(membro([[38, 86], [38, 108]], [3, 3]) + membro([[104, 50], [104, 108]], [3, 3]) + membro([[70, 70], [70, 108]], [3, 3]), METAL, 'suporte'),
    M(cantos([[14, 82, 2], [98, 36, 2], [112, 50, 2], [28, 96, 2]]), cor, 'placas'),
    L(Array.from({ length: 14 }, (_, k) => { const t = (k + 0.5) / 14; return `M${f(14 + 84 * t)} ${f(82 - 46 * t)}L${f(28 + 84 * t)} ${f(96 - 46 * t)}`; }).join(''), 0.6, clarear(cor, 0.25), { fino: true, marca: 'tubos' }),
    L('M42 66l14 14M70 51l14 14', 1.2, METAL),
    Mt(membro([[112, 52], [116, 60], [116, 108]], [3, 3, 3]), '#d6d2ca', 'cano'),
    Mt(membro([[28, 96], [22, 102], [22, 108]], [3, 3, 3]), '#d6d2ca')
  ], 50);
}

function capaPiscina(cor: string): Amostra {
  const t = noPiso(28, 92, 12, 108, 64, 100);
  return deitado([
    // A piscina fechada: a borda de pedra, a lona esticada com as faixas, as presilhas e o enrolador de inox atrás.
    P(cantos([[22, 58, 2], [98, 58, 2], [118, 106, 2], [2, 106, 2]]), '#e8e4dc', 'borda'),
    M(t.quad(0, 0, 1, 1, 2), cor, 'lona', { semVolume: true }),
    L([0.2, 0.4, 0.6, 0.8].map(v => { const [a, b] = t.pt(0, v), [c, d] = t.pt(1, v); return `M${f(a)} ${f(b)}L${f(c)} ${f(d)}`; }).join(''), 1.4, clarear(cor, 0.25), { marca: 'faixas' }),
    Mt([0.2, 0.4, 0.6, 0.8].map(v => { const [a, b] = t.pt(0, v), [c, d] = t.pt(1, v); return circulo(a - 4, b, 1.4) + circulo(c + 4, d, 1.4); }).join(''), METAL, 'presilhas'),
    Mt(ret(18, 48, 84, 9, 4.5), INOX, 'enrolador'),
    M(circulo(16, 52, 6) + circulo(104, 52, 6), '#4a4643'),
    Mt(circulo(16, 52, 2) + circulo(104, 52, 2), METAL)
  ]);
}

function cascata(cor: string): Amostra {
  const pedra = (pts: Pt[], k: number) => M(suave(pts, true, 0.5), k ? escurecer(cor, 0.06 * k) : cor, 'pedra');
  return noChao([
    // As pedras empilhadas, a lâmina de água que cai do alto no espelho de baixo, a espuma e as plantas em volta.
    P(elipse(60, 104, 54, 6), AGUA, 'espelho'),
    pedra([[4, 104], [8, 76], [26, 66], [40, 74], [44, 100]], 1),
    pedra([[76, 102], [80, 72], [96, 62], [114, 72], [116, 104]], 2),
    pedra([[28, 70], [34, 46], [54, 36], [74, 40], [90, 50], [92, 72], [60, 78]], 0),
    pedra([[40, 42], [50, 26], [70, 24], [80, 36], [72, 44], [52, 46]], 3),
    P('M50 44c2 0 18 0 22 0l2 6c2 18-2 40 2 54h-28c4-14 0-36 2-54z', '#bfe6f2', 'agua', { opacidade: 0.9 }),
    L('M54 50c1 16-1 30 0 50M60 50v52M66 50c1 16 0 30 0 50', 0.8, '#ffffff', { fino: true }),
    P(circulo(52, 102, 3) + circulo(60, 103, 3.6) + circulo(68, 102, 3), '#f4f1ea', 'espuma'),
    M(suave([[4, 70], [10, 52], [18, 62], [20, 44], [28, 60], [26, 72]], true, 0.4), VERDE, 'plantas'),
    M(suave([[92, 60], [100, 40], [104, 56], [112, 42], [116, 62], [106, 68]], true, 0.4), '#3f7a3f')
  ], 56);
}

function kitPiscina(cor: string): Amostra {
  return noChao([
    // O filtro de areia (o tanque de cúpula com a válvula e o manômetro), a bomba, a mangueira enrolada e a peneira no cabo.
    Mt(membro([[84, 106], [110, 16]], [2.4, 2]), METAL, 'cabo'),
    P(elipse(110, 12, 9, 6), '#d8e6ea', 'rede', { opacidade: 0.8 }), L(elipse(110, 12, 9, 6), 1.4, '#2f6db3'),
    M('M10 106V58a20 20 0 0 1 40 0v48z', cor, 'filtro'),
    Mt(ret(22, 28, 16, 10, 2), '#4a4643', 'valvula'), Mt(circulo(30, 26, 4), METAL), P(circulo(30, 26, 3), '#f4f1ea', 'manometro'),
    P(ret(10, 98, 40, 8, 2), escurecer(cor, 0.25)),
    Mt(membro([[48, 90], [58, 90]], [4, 4]), '#d6d2ca'),
    M(ret(56, 80, 30, 26, 6), '#4a4f57', 'bomba'),
    L('M60 86h22M60 91h22M60 96h22', 0.6, '#6a6f77', { fino: true }),
    L(elipse(74, 102, 14, 4) + elipse(74, 99, 12, 3.4), 2, '#3b4f6b', { marca: 'mangueira' })
  ], 52);
}

/* ============================================================== JARDIM */

function churrasqueira(cor: string): Amostra {
  const tijolo = (x: number, y: number, w: number, h: number) => {
    let d = '';
    for (let j = 0; j * 5 < h; j++) { d += `M${x} ${f(y + j * 5)}h${w}`; for (let i = (j % 2 ? 5 : 0); i < w; i += 10) d += `M${f(x + i)} ${f(y + j * 5)}v5`; }
    return d;
  };
  return noChao([
    // A churrasqueira de tijolo: a chaminé, a coifa, a boca preta com a grelha e os espetos sobre a brasa.
    M(ret(48, 2, 24, 28, 1.5), cor, 'chamine'), M(ret(44, 0, 32, 5, 1.5), escurecer(cor, 0.25)),
    M(cantos([[30, 26, 1.5], [90, 26, 1.5], [108, 52, 1.5], [12, 52, 1.5]]), cor, 'coifa'),
    M(ret(8, 52, 104, 56, 2), cor, 'corpo'),
    L(tijolo(48, 2, 24, 26) + tijolo(10, 54, 100, 52), 0.5, clarear(cor, 0.35), { fino: true, marca: 'tijolos' }),
    M(ret(4, 50, 112, 5, 1.5), '#cfc8bc', 'bancada'),
    P(ret(22, 60, 76, 30, 2), PRETO, 'boca'),
    Lz(suave([[26, 90], [34, 84], [46, 87], [60, 82], [74, 87], [86, 83], [94, 90]], true, 0.4), '#ef8a2e', { marca: 'brasa' }),
    Mt(ret(24, 76, 72, 1.4, 0.5) + ret(24, 80, 72, 1.4, 0.5), '#8d8a85', 'grelha'),
    Mt(ret(18, 66, 84, 1.6, 0.8) + ret(18, 71, 84, 1.6, 0.8), INOX, 'espetos'),
    P([30, 44, 58, 72, 86].map(x => ret(x, 63, 7, 5, 2)).join('') + [36, 52, 68, 82].map(x => ret(x, 68.5, 7, 5, 2)).join(''), '#8a4a2a', 'carne'),
    M(ret(100, 40, 6, 12, 1.5), '#5a7a3a'), M(ret(101.5, 36, 3, 5, 1), '#5a7a3a')
  ], 58);
}

function espacoGourmet(cor: string): Amostra {
  return noChao([
    // A cozinha de fora: a coifa de inox, a churrasqueira a gás de tampa abaulada embutida na bancada de pedra, os
    // botões, a chopeira com o copo e a geladeira de porta de vidro embaixo; o armário de ripas.
    Mt(ret(38, 0, 12, 8, 0.5), INOX), Mt(cantos([[30, 8, 1], [58, 8, 1], [66, 26, 1], [22, 26, 1]]), INOX, 'coifa'),
    Lz(ret(28, 25, 32, 1.6, 0.5), '#ffe3a8', { fino: true }),
    M(ret(6, 64, 108, 44, 2), '#8a5a32', 'armario'),
    L(Array.from({ length: 26 }, (_, k) => `M${8 + k * 4} 66v40`).join(''), 0.5, '#6e4426', { fino: true, marca: 'ripas' }),
    Mt('M18 56V46a5 5 0 0 1 5-5h42a5 5 0 0 1 5 5v10z', INOX, 'churrasqueira'),
    Mt(ret(32, 42, 24, 2.4, 1), '#8d8a85'),
    M(ret(2, 56, 116, 8, 1.5), cor, 'bancada'),
    L(marmore(2, 56, 116, 8), 0.5, clarear(cor, 0.35), { fino: true }),
    Mt(ret(16, 66, 56, 10, 1.5), INOX), P([0, 1, 2, 3].map(k => circulo(24 + k * 13, 71, 2.6)).join(''), PRETO, 'botoes'),
    Mt(ret(94, 36, 4, 20, 1), INOX, 'chopeira'), Mt(ret(90, 38, 14, 3, 1), INOX), M(ret(100, 30, 3, 9, 1), PRETO),
    M('M82 44h9l-1 12h-7z', '#e0a23a', 'chope'), P(ret(82, 42, 9, 4, 1.5), '#f4f1ea'),
    Mt(ret(80, 66, 32, 40, 2), INOX, 'geladeira'), V(ret(84, 70, 24, 32, 1.5), false),
    P([0, 1, 2].map(k => ret(87 + k * 7, 92, 4, 8, 1)).join(''), '#c9a24a', undefined, { fino: true })
  ], 58);
}

function fornoPizza(cor: string): Amostra {
  return noChao([
    // O domo de tijolo refratário sobre a base de pedra, a boca em arco com o fogo, a chaminé, a lenha embaixo e a pá.
    M(ret(12, 72, 96, 36, 2), '#9a9184', 'base'),
    L('M12 84h96M12 96h96M40 72v12M80 72v12M28 84v12M60 84v12M92 84v12', 0.5, '#7a7268', { fino: true }),
    P(ret(28, 82, 64, 22, 1.5), PRETO, 'lenha-nicho'),
    M([34, 44, 54, 64, 74, 84].map((x, k) => circulo(x, 98 - (k % 2) * 6, 4.6)).join(''), '#8a5a32', 'lenha'),
    P([34, 44, 54, 64, 74, 84].map((x, k) => circulo(x, 98 - (k % 2) * 6, 2)).join(''), '#d9a86a', undefined, { fino: true }),
    M(ret(60, 22, 12, 18, 1), escurecer(cor, 0.15), 'chamine'), M(ret(57, 18, 18, 5, 1), escurecer(cor, 0.3)),
    M('M14 74C14 30 106 30 106 74z', cor, 'domo'),
    L('M22 52q38-24 76 0M17 64q43-20 86 0', 0.6, escurecer(cor, 0.2), { fino: true }),
    M('M40 74V62a20 20 0 0 1 40 0v12z', escurecer(cor, 0.25), 'arco'),
    P('M44 74V63a16 16 0 0 1 32 0v11z', '#1f1d1b', 'boca'),
    Lz(suave([[48, 74], [52, 64], [57, 70], [62, 60], [67, 70], [72, 74]], true, 0.4), '#ef8a2e', { marca: 'fogo' }),
    M(ret(10, 70, 100, 5, 1.5), '#cfc8bc'),
    M(membro([[110, 20], [104, 104]], [2.4, 2.4]), '#a8743f', 'pa'), Mt(ret(98, 98, 14, 10, 2), METAL)
  ], 56);
}

function pergolado(cor: string): Amostra {
  const folhas = (pts: Pt[], r: number) => pts.map(([x, y]) => circulo(x, y, r)).join('');
  return noChao([
    // Os pilares, a viga da frente e os caibros que vão para trás (as pontas em perspectiva); a trepadeira tomando
    // as vigas e descendo pelo pilar, com as flores.
    M([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => cantos([[6 + k * 10.6, 26, 0.5], [11 + k * 10.6, 26, 0.5], [17 + k * 10.6, 14, 0.5], [12 + k * 10.6, 14, 0.5]])).join(''), escurecer(cor, 0.12), 'caibros'),
    M(ret(30, 18, 4, 60, 1) + ret(90, 18, 4, 60, 1), escurecer(cor, 0.2)),
    M(ret(10, 26, 8, 82, 1.5) + ret(102, 26, 8, 82, 1.5), cor, 'pilares'),
    M(ret(2, 24, 116, 8, 1.5), cor, 'viga'),
    L(veio(4, 24, 112, 8, 2), 0.5, escurecer(cor, 0.25), { fino: true }),
    M(folhas([[8, 22], [16, 16], [26, 20], [36, 14], [46, 20], [58, 16], [70, 22], [78, 14], [14, 30], [12, 40], [16, 50], [12, 60], [16, 70]], 6), VERDE, 'trepadeira'),
    M(folhas([[20, 24], [42, 24], [64, 26], [10, 36], [18, 46], [10, 56], [86, 20], [96, 16], [104, 22]], 4.6), '#3f7a3f'),
    P(folhas([[22, 18], [40, 18], [62, 22], [12, 46], [14, 64], [92, 18]], 2), '#c9508a', 'flores'),
    L('M14 74c2 8-2 14 0 22M106 32c-2 8 2 12 0 18', 1, '#3f7a3f', { fino: true })
  ], 56);
}

function gazebo(cor: string): Amostra {
  return noChao([
    // O telhado de quatro águas sobre as quatro colunas, a rede pendurada lá dentro, o guarda-corpo e o deque.
    M(ret(32, 30, 4, 70, 1) + ret(84, 30, 4, 70, 1), escurecer(cor, 0.2), 'colunas-fundo'),
    M('M36 52Q60 82 84 52Q60 74 36 52z', '#d0573b', 'rede'),
    L('M44 58q16 14 32 0M40 55q20 20 40 0', 0.6, '#f4f1ea', { fino: true }),
    L('M32 46l4 6M88 46l-4 6', 0.8, '#6b5a48'),
    M(ret(2, 102, 116, 7, 1.5), cor, 'deque'),
    M(ret(8, 36, 7, 68, 1.5) + ret(105, 36, 7, 68, 1.5), cor, 'colunas'),
    M(ret(15, 84, 90, 4, 1), cor, 'guarda-corpo'), M(Array.from({ length: 9 }, (_, k) => ret(20 + k * 10, 88, 2.4, 14, 0.5)).join(''), escurecer(cor, 0.1)),
    M('M60 4L118 34H2z', escurecer(cor, 0.35), 'telhado'),
    L('M60 4L40 34M60 4L80 34M60 4V34', 0.6, escurecer(cor, 0.55), { fino: true }),
    M(ret(0, 32, 120, 6, 1.5), escurecer(cor, 0.2)),
    Mt(circulo(60, 4, 2.4), LATAO)
  ], 58);
}

function fonte(cor: string): Amostra {
  return noChao([
    // A fonte de pedra em dois andares: a bacia larga embaixo, a coluna, a taça em cima e os arcos de água caindo.
    L('M60 20q-12-10-26 24M60 20q12-10 26 24M34 50q-12 8-18 32M86 50q12 8 18 32', 1, '#8fc3dc', { marca: 'agua' }),
    M('M8 84h104l-8 18H16z', cor, 'bacia'), M(ret(6, 80, 108, 6, 2), clarear(cor, 0.1)),
    P(elipse(60, 82, 50, 2.4), '#8fc3dc'),
    M(ret(52, 50, 16, 32, 2), cor, 'coluna'), M(ret(50, 66, 20, 4, 1) + ret(50, 56, 20, 3, 1), escurecer(cor, 0.1)),
    M('M28 46h64l-12 10H40z', cor, 'taca'), M(ret(26, 43, 68, 5, 2), clarear(cor, 0.1)),
    M(ret(56, 26, 8, 18, 2), cor), M(circulo(60, 24, 5), cor),
    M(ret(14, 102, 92, 6, 1), escurecer(cor, 0.15)),
    P(circulo(22, 76, 1.2) + circulo(98, 74, 1.2) + circulo(40, 40, 1.2), '#bfe6f2', undefined, { fino: true })
  ], 52);
}

function esculturaJardim(cor: string): Amostra {
  // A forma vazada (o furo é o caminho contrário ao contorno de fora).
  const fora = suave([[46, 86], [36, 64], [38, 38], [52, 18], [70, 20], [82, 40], [80, 66], [72, 86]], true, 0.5);
  const furo = 'M54 52a8 12 0 1 1 16 0a8 12 0 1 1 -16 0z';
  return noChao([
    // A escultura de bronze abstrata, vazada, com a pátina verde escorrendo, sobre o pedestal de pedra com a placa.
    M(ret(34, 86, 52, 22, 1), '#cfc8bc', 'pedestal'),
    M(fora + furo, cor, 'escultura'),
    L('M44 40c4 10 0 22 4 34M76 36c-2 12 4 24 0 36M58 24c4 4 10 4 12 0', 1, '#6f9a86', { marca: 'patina' }),
    L('M48 30c6-6 14-8 20-4', 1, clarear(cor, 0.4), { fino: true }),
    P(ret(50, 94, 20, 7, 0.5), '#b9a37a', 'placa'), L('M53 97.5h14', 0.5, '#5a4a30', { fino: true })
  ], 34);
}

function plantas(cor: string): Amostra {
  const vaso = (x: number, w: number, h: number) => M(cantos([[x - w / 2, 108 - h, 1.5], [x + w / 2, 108 - h, 1.5], [x + w / 2 - 4, 108, 1.5], [x - w / 2 + 4, 108, 1.5]]), cor, 'vaso');
  const folha = (cx: number, cy: number, r: number, ang: number) => G(`rotate(${ang} ${cx} ${cy})`, [M(suave([[cx, cy + r], [cx - r * 0.9, cy], [cx - r * 0.4, cy - r * 0.8], [cx, cy - r * 0.5], [cx + r * 0.4, cy - r * 0.8], [cx + r * 0.9, cy]], true, 0.5), '#3f7a3f', 'costela'), L(`M${cx} ${cy + r}V${cy - r * 0.4}M${cx - r * 0.6} ${cy - 2}l${r * 0.3} 1M${cx + r * 0.6} ${cy - 2}l${-r * 0.3} 1`, 0.8, '#d4e8c4', { fino: true })]);
  return noChao([
    // A costela-de-adão (as folhas recortadas), a espada-de-são-jorge (as lâminas em pé, a borda amarela) e a samambaia.
    L('M24 80c-4-10-10-18-14-26M24 80c2-14 6-26 14-32M24 80c0-10-2-20-2-34', 1.4, '#3f6b33'),
    folha(12, 50, 12, -30), folha(38, 44, 13, 24), folha(22, 38, 11, 0),
    vaso(24, 30, 28),
    M(membro([[58, 84], [56, 46], [54, 26]], [6, 5, 0.6]) + membro([[64, 84], [66, 50], [70, 30]], [6, 5, 0.6]) + membro([[61, 84], [61, 40], [61, 16]], [6, 5, 0.6]), '#4f7a3a', 'espada'),
    L('M56 80c-1-14-2-30-2-48M66 80c1-12 2-26 4-44', 0.6, '#d6c45a', { fino: true }),
    vaso(61, 22, 22),
    L('M96 82c-8-4-16 0-20 10M96 82c-6-10-14-14-22-14M96 82c2-12 0-20-6-28M96 82c8-10 16-12 22-10M96 82c10-2 16 4 20 14M96 82c4-14 10-22 18-26', 1.6, '#5f9a52', { marca: 'samambaia' }),
    L('M80 90l2-3M78 74l3-2M92 60l2-2M112 74l-2-2M114 92l-3-2', 1, '#5f9a52', { fino: true }),
    vaso(96, 26, 22)
  ], 54);
}

function vasosGrandes(cor: string): Amostra {
  const vaso = (x: number, h: number, w: number) => [
    M(suave([[x - w * 0.42, 108 - h], [x + w * 0.42, 108 - h], [x + w * 0.5, 108 - h * 0.6], [x + w * 0.3, 108], [x - w * 0.3, 108], [x - w * 0.5, 108 - h * 0.6]], true, 0.35), cor, 'vaso'),
    M(ret(x - w * 0.46, 108 - h - 3, w * 0.92, 5, 2), escurecer(cor, 0.12)),
    L(`M${x - w * 0.2} ${108 - h + 3}v${h * 0.3}M${x + w * 0.12} ${108 - h + 3}v${h * 0.22}`, 1, clarear(cor, 0.35), { fino: true, marca: 'esmalte' })
  ];
  const oliveira = (x: number, base: number, h: number) => [
    M(membro([[x, base], [x - 3, base - h * 0.4], [x + 2, base - h * 0.7]], [4, 3, 2]), '#6b5a48', 'tronco'),
    M([[-12, -0.8], [0, -1], [12, -0.85], [-6, -1.2], [7, -1.15], [-14, -0.62], [14, -0.66]].map(([dx, k]) => elipse(x + dx, base + h * k, 9, 6)).join(''), '#8a9a6a', 'copa'),
    P([[-8, -0.95], [6, -1.05], [-2, -1.18]].map(([dx, k]) => elipse(x + dx, base + h * k, 5, 3)).join(''), '#a9b88a', undefined, { fino: true })
  ];
  return noChao([
    // Dois vasos grandes de barro esmaltado (o brilho do esmalte) com as oliveiras de folha prateada.
    ...oliveira(34, 62, 52), ...oliveira(88, 74, 40),
    ...vaso(34, 48, 40), ...vaso(88, 36, 34)
  ], 54);
}

function luzJardim(cor: string): Amostra {
  return noChao([
    // A árvore acesa de baixo (o facho subindo do espeto), os balizadores acesos no caminho de pedra.
    P('M30 106L10 30h44z', '#fff3c4', 'facho', { opacidade: 0.35 }),
    M(membro([[32, 106], [30, 70], [34, 46]], [6, 5, 3]), '#6b5a48', 'arvore'),
    M([[18, 34], [32, 24], [46, 34], [24, 44], [42, 44], [32, 36]].map(([x, y]) => circulo(x, y, 11)).join(''), '#5f9a52', 'copa'),
    P([[22, 44], [34, 48], [42, 44]].map(([x, y]) => circulo(x, y, 6)).join(''), '#a9cf7a'),
    Mt(ret(26, 104, 10, 4, 1.5), cor), Lz(ret(28, 102, 6, 2, 1), '#fff3c4'),
    P(elipse(70, 106, 7, 2) + elipse(88, 102, 6, 1.8) + elipse(104, 98, 5, 1.6), '#b9b2a6', 'caminho'),
    ...[[64, 0], [84, -6], [102, -12]].flatMap(([x, dy]) => [
      P(elipse(x + 4, 100 + dy * 0.4, 9, 3), '#fff3c4', undefined, { opacidade: 0.5 }),
      M(ret(x, 76 + dy * 0.4, 8, 32 - dy * 0.4 - 4, 2), cor, 'balizador'),
      Lz(ret(x + 1, 80 + dy * 0.4, 6, 4, 1), '#ffe3a8')
    ])
  ], 54);
}

function playground(cor: string): Amostra {
  const tinta = '#c8372d';
  return noChao([
    // A torre com a casinha (o telhado, a janela), o escorregador descendo de um lado, o balanço do outro.
    M(ret(34, 36, 4, 72, 1) + ret(62, 36, 4, 72, 1), cor, 'torre'),
    M(ret(32, 60, 36, 5, 1), escurecer(cor, 0.12), 'plataforma'),
    M(ret(36, 36, 28, 24, 1), clarear(cor, 0.2), 'casinha'), P(ret(44, 42, 12, 10, 1), '#3a2f2a'),
    M(cantos([[30, 38, 1], [50, 16, 1], [70, 38, 1]]), tinta, 'telhado'),
    M('M34 62L4 100v6h8L40 68z', '#e2b72d', 'escorregador'),
    L('M34 60L4 98', 1.4, escurecer('#e2b72d', 0.3)),
    M(ret(64, 26, 52, 4, 1), cor, 'viga'),
    M(membro([[112, 28], [106, 108]], [3.4, 3]) + membro([[112, 28], [118, 108]], [3.4, 3]), cor),
    L('M82 30v52M96 30v52', 0.9, '#6b5a48', { marca: 'cordas' }), M(ret(79, 82, 20, 3.4, 1), PRETO, 'balanco'),
    M(ret(38, 70, 22, 2, 0.5) + ret(38, 80, 22, 2, 0.5) + ret(38, 90, 22, 2, 0.5), cor)
  ], 56);
}

function camaElastica(cor: string): Amostra {
  const postes = [10, 34, 86, 110];
  return noChao([
    // A cama elástica: a lona preta no aro acolchoado, as pernas em arco, os postes com a rede de proteção em volta.
    L(Array.from({ length: 9 }, (_, k) => `M${14 + k * 11.5} 26L${10 + k * 12.5} 76`).join('') + Array.from({ length: 9 }, (_, k) => `M${10 + k * 12.5} 26L${14 + k * 11.5} 76`).join(''), 0.4, '#5d5a56', { fino: true, marca: 'rede' }),
    L(elipse(60, 26, 50, 8), 1.2, '#3a3836'),
    Mt(membro([[16, 80], [14, 108]], [2.4, 2.4]) + membro([[44, 84], [44, 108]], [2.4, 2.4]) + membro([[76, 84], [76, 108]], [2.4, 2.4]) + membro([[104, 80], [106, 108]], [2.4, 2.4]), '#5d5a56', 'pernas'),
    M(`${elipse(60, 76, 54, 12)}M10 76a50 9 0 1 1 100 0a50 9 0 1 1 -100 0z`, cor, 'aro'),
    P(elipse(60, 76, 46, 8), PRETO, 'lona'),
    Mt(postes.map(x => ret(x - 1.2, 24, 2.4, 52 + (x === 34 || x === 86 ? 6 : 0), 1)).join(''), '#5d5a56', 'postes')
  ], 54);
}

/* ============================================================== LAZER */

function bilharProfissional(cor: string): Amostra {
  const nogueira = '#5a3320';
  const perna = (x: number) => M(suave([[x - 6, 70], [x + 6, 70], [x + 8, 80], [x + 4, 92], [x + 6, 104], [x + 7, 108], [x - 7, 108], [x - 6, 104], [x - 4, 92], [x - 8, 80]], true, 0.4), nogueira, 'perna-torneada');
  return noChao([
    // A mesa de torneio: a luminária comprida em cima, a madeira maciça escura com os losangos de madrepérola, as
    // caçapas de couro com franja, as quinas de latão, a saia entalhada e as SEIS pernas torneadas.
    L('M34 0v12M86 0v12', 0.8, PRETO),
    M(ret(24, 12, 72, 7, 2), '#2f4a3a', 'luminaria'), Lz(ret(28, 19, 64, 1.6, 0.5), '#ffe3a8', { fino: true }),
    perna(14), perna(60), perna(106),
    Mt(ret(7, 82, 14, 3, 1) + ret(53, 82, 14, 3, 1) + ret(99, 82, 14, 3, 1), LATAO),
    M(ret(6, 54, 108, 18, 2), nogueira, 'saia'),
    L('M10 58h100M10 68h100', 0.6, '#7a4a2c', { fino: true }),
    M(elipse(60, 63, 8, 4), '#7a4a2c', 'entalhe'),
    M(ret(2, 42, 116, 12, 2), nogueira, 'borda'),
    P(ret(6, 40, 108, 4, 1.5), cor, 'feltro'),
    P([18, 32, 46, 74, 88, 102].map(x => cantos([[x, 46, 0], [x + 1.6, 48, 0], [x, 50, 0], [x - 1.6, 48, 0]])).join(''), '#f4f1ea', 'losangos'),
    M('M4 54q0 9 7 9t7-9zM53 54q0 9 7 9t7-9zM102 54q0 9 7 9t7-9z', '#3a2a1e', 'cacapas'),
    L('M6 60v3M9 61v3M12 61v3M55 60v3M58 61v3M61 61v3M64 60v3M104 60v3M107 61v3M110 61v3', 0.7, '#3a2a1e', { fino: true }),
    Mt(ret(2, 42, 7, 6, 1) + ret(111, 42, 7, 6, 1), LATAO, 'quinas'),
    M(circulo(40, 37, 3) + circulo(46, 37, 3) + circulo(43, 33, 3), '#c8372d', 'bolas'), M(circulo(80, 37, 3), BRANCO),
    M(circulo(52, 37, 3), '#e2b72d'), M(circulo(49, 33, 3), '#2f6db3'), M(circulo(46, 29, 3), PRETO)
  ], 58);
}

function pebolim(cor: string): Amostra {
  const xs = [20, 30, 41, 52, 64, 75, 86, 97];
  return noChao([
    // A caixa sobre os pés, o campo verde, os bonequinhos em fileiras (vermelho e azul alternados) e as hastes com as
    // manoplas pretas saindo pela frente.
    M(ret(18, 70, 9, 38, 1.5) + ret(93, 70, 9, 38, 1.5), escurecer(cor, 0.15), 'pes'),
    M(ret(22, 94, 76, 4, 1), escurecer(cor, 0.15)),
    M(cantos([[18, 36, 1], [102, 36, 1], [108, 44, 1], [12, 44, 1]]), '#3f9a52', 'campo'),
    L('M60 36v8', 0.7, '#f4f1ea'),
    ...xs.map((x, k) => P(ret(x - 2, 28, 4, 10, 1.5) + circulo(x, 26, 2.2), k % 2 ? '#2f6db3' : '#c8372d', 'jogador')),
    M(ret(12, 44, 96, 26, 3), cor, 'caixa'),
    P(ret(4, 50, 10, 10, 1) + ret(106, 50, 10, 10, 1), PRETO, 'gol'),
    Mt(xs.map(x => circulo(x, 52, 1.4)).join(''), METAL),
    Mt(xs.map(x => membro([[x, 52], [x - 3, 60]], [1.6, 1.6])).join(''), METAL, 'hastes'),
    M(xs.map(x => membro([[x - 3, 60], [x - 5, 68]], [3.6, 3.6])).join(''), PRETO, 'manoplas'),
    Mt(ret(56, 64, 8, 4, 1), METAL)
  ], 50);
}

function pinguePongue(cor: string): Amostra {
  return noChao([
    // A mesa em perspectiva com as linhas brancas, a REDE no meio, os pés de cavalete e as duas raquetes com a bolinha.
    Mt(membro([[20, 66], [12, 108]], [2.4, 2.4]) + membro([[20, 66], [30, 108]], [2.4, 2.4]) + membro([[100, 66], [90, 108]], [2.4, 2.4]) + membro([[100, 66], [108, 108]], [2.4, 2.4]), '#4a4643', 'pes'),
    M(ret(4, 62, 112, 4, 1), escurecer(cor, 0.25)),
    M(cantos([[18, 48, 1], [102, 48, 1], [116, 62, 1], [4, 62, 1]]), cor, 'mesa'),
    L('M18 48h84l14 14H4z', 1.2, '#f4f1ea', { marca: 'linhas' }),
    L('M11 55h98', 0.7, '#f4f1ea', { fino: true }),
    P('M58 40L62 40L62 62L58 48Z', '#f4f1ea', 'rede', { opacidade: 0.7 }),
    L('M58 40L62 40M58 40V48M62 40V62M58 44L62 50M58 47L62 56', 0.6, '#4a4643'),
    M(circulo(30, 82, 8), '#c8372d', 'raquete'), M(membro([[30, 90], [32, 102]], [3, 3]), '#a8743f'),
    M(circulo(92, 84, 8), PRETO), M(membro([[92, 92], [90, 104]], [3, 3]), '#a8743f'),
    M(circulo(76, 40, 2.4), '#f4f1ea', 'bolinha')
  ], 54);
}

function mesaJogos(cor: string): Amostra {
  return noChao([
    // A mesa oval de pôquer: o feltro verde, a pista de madeira, o estofado preto da borda com os porta-copos, as fichas
    // e as cartas — sobre o pé central maciço.
    M(ret(48, 78, 24, 22, 2), '#5a3a24', 'pe'), M(ret(36, 98, 48, 9, 3), '#5a3a24'),
    M('M6 62a54 16 0 0 0 108 0v9a54 16 0 0 1-108 0z', PRETO, 'estofado-lado'),
    M(elipse(60, 62, 54, 16), '#3a3836', 'estofado'),
    M(elipse(60, 61, 46, 12), MADEIRA, 'pista'),
    P(elipse(60, 60, 40, 9.5), cor, 'feltro'),
    Mt(elipse(14, 64, 3, 1.3) + elipse(106, 64, 3, 1.3) + elipse(36, 74, 3, 1.3) + elipse(84, 74, 3, 1.3), INOX, 'porta-copos'),
    M(ret(40, 55, 7, 5, 2) + ret(48, 57, 7, 4, 2), '#c8372d', 'fichas'), M(ret(70, 56, 7, 5, 2), '#2f6db3'), M(ret(78, 58, 7, 3, 2), '#f4f1ea'),
    P(cantos([[54, 63, 0.6], [62, 62, 0.6], [63, 66, 0.6], [55, 67, 0.6]]) + cantos([[64, 62, 0.6], [72, 63, 0.6], [71, 67, 0.6], [63, 66, 0.6]]), '#f4f1ea', 'cartas'),
    P(circulo(58, 64.5, 0.8) + circulo(68, 64.5, 0.8), '#c8372d', undefined, { fino: true })
  ], 54);
}

function fliperama(cor: string): Amostra {
  return noChao([
    // O gabinete alto de fliperama: o letreiro aceso em cima, a tela com o jogo, o painel inclinado com o joystick e os
    // botões coloridos, a porta das fichas.
    M(ret(26, 4, 68, 104, 3), cor, 'gabinete'),
    L('M28 90l12-14M28 104l24-28M80 104l12-14', 2, clarear(cor, 0.3), { fino: true }),
    Lz(ret(30, 7, 60, 13, 2), '#f2d67a', { marca: 'letreiro' }),
    L('M38 13.5h44', 2.4, '#c8372d', { fino: true }),
    M(ret(30, 22, 60, 40, 2), PRETO, 'moldura'),
    P(ret(34, 26, 52, 32, 1), '#14182b', 'tela'),
    Lz([0, 1, 2, 3, 4].map(k => ret(38 + k * 9, 30, 6, 4, 0.5)).join('') + [0, 1, 2, 3].map(k => ret(42 + k * 9, 37, 6, 4, 0.5)).join(''), '#7cd67c', { marca: 'jogo' }),
    Lz(ret(57, 52, 6, 3, 0.5), '#7cc0d6'),
    M(cantos([[22, 62, 1.5], [98, 62, 1.5], [102, 74, 1.5], [18, 74, 1.5]]), '#3b3a38', 'painel'),
    Mt(ret(41, 58, 2.4, 8, 1), METAL), M(circulo(42, 58, 3.4), '#c8372d', 'joystick'),
    M(circulo(66, 67, 2.6) + circulo(74, 66, 2.6), '#2f6db3', 'botoes'), M(circulo(82, 67, 2.6) + circulo(70, 71, 2.6), '#e2b72d'),
    Mt(ret(48, 82, 24, 18, 1.5), METAL, 'fichas'), Lz(ret(53, 86, 4, 6, 0.5) + ret(63, 86, 4, 6, 0.5), '#c8372d', { fino: true })
  ], 40);
}

function poltronasCinema(cor: string): Amostra {
  return noChao([
    // Quatro poltronas reclináveis em fileira, de couro em gomos, o apoio de cabeça, o braço com porta-copo entre elas e
    // a fita de luz embaixo.
    ...[0, 1, 2, 3].flatMap(k => {
      const x = 6 + k * 27.5;
      return [
        M(ret(x + 1, 30, 24, 50, 8), cor, 'encosto'),
        L(`M${x + 4} 46h18M${x + 4} 58h18M${x + 4} 70h18`, 0.7, escurecer(cor, 0.3), { fino: true }),
        M(ret(x + 3, 30, 20, 12, 6), clarear(cor, 0.1), 'apoio'),
        M(ret(x + 2, 72, 22, 14, 5), clarear(cor, 0.08), 'assento'),
        M(ret(x + 2, 86, 22, 18, 3), escurecer(cor, 0.15))
      ];
    }),
    ...[0, 1, 2, 3, 4].flatMap(k => [M(ret(2 + k * 27.5, 60, 8, 44, 3), escurecer(cor, 0.1), 'braco'), Mt(elipse(6 + k * 27.5, 61, 3, 1.4), '#4a4643', 'porta-copo')]),
    P(ret(2, 104, 116, 4, 1), PRETO), Lz(ret(4, 104.6, 112, 1.4, 0.5), '#7cc0d6', { fino: true, marca: 'led' })
  ], 58);
}

function bicicletaErgometrica(cor: string): Amostra {
  return noChao([
    // A bicicleta parada: o volante de inércia na frente, o quadro, o banco, o guidão com o painel e o pedal.
    Mt(ret(8, 102, 40, 5, 2) + ret(72, 102, 40, 5, 2), '#3a3836', 'base'),
    P(circulo(32, 80, 18), PRETO, 'volante'), Mt(circulo(32, 80, 11), METAL), Mt(circulo(32, 80, 3), '#5d5a56'),
    M('M14 80a18 18 0 0 1 36 0z', cor, 'carenagem'),
    M(membro([[28, 102], [36, 70], [44, 34]], [7, 7, 6]), cor, 'quadro'),
    M(membro([[38, 72], [70, 68], [90, 102]], [7, 7, 7]), cor),
    Mt(membro([[80, 70], [82, 42]], [3, 3]), METAL, 'canote'),
    M(suave([[72, 40], [90, 37], [96, 41], [82, 44]], true, 0.4), PRETO, 'banco'),
    M(membro([[44, 34], [52, 26], [64, 26]], [4, 4, 4]), PRETO, 'guidao'),
    M(ret(32, 14, 18, 12, 2), PRETO, 'painel'), Lz(ret(34, 16, 14, 6, 1), '#7cc0d6'),
    Mt(circulo(62, 76, 6), '#5d5a56'), Mt(membro([[62, 76], [70, 90]], [2.6, 2.6]), METAL), M(ret(66, 89, 10, 3, 1), PRETO, 'pedal')
  ], 52);
}

function remoSeco(cor: string): Amostra {
  const y = (x: number) => 70 + (x - 28) * 0.24;
  return noChao([
    // O remo de madeira: o tanque de água redondo na frente (a água à vista), o trilho comprido descendo para trás,
    // o banco no trilho, os apoios dos pés, a manopla com a cinta e o monitor.
    M(ret(2, 98, 50, 8, 2), cor, 'base'),
    V(ret(4, 80, 44, 18, 8), true, 'tanque'), P('M6 90h40v4q0 4-8 4h-24q-8 0-8-4z', AGUA, 'agua'),
    L('M8 88q8-2 16 0t16 0', 0.8, '#ffffff', { fino: true }),
    M(ret(22, 38, 8, 64, 2), cor, 'coluna'),
    M(ret(18, 30, 16, 10, 2), PRETO, 'monitor'), Lz(ret(20, 32, 12, 5, 1), '#7cd67c', { fino: true }),
    M(membro([[28, y(28)], [114, y(114)]], [7, 7]), cor, 'trilho'),
    L(`M34 ${f(y(34))}L110 ${f(y(110))}`, 0.5, escurecer(cor, 0.25), { fino: true }),
    M(ret(108, y(108) + 2, 8, 108 - y(108) - 2, 1.5), cor),
    M(cantos([[34, 60, 2], [44, 62, 2], [46, 76, 2], [36, 76, 2]]), PRETO, 'apoio-pes'),
    L('M60 62L30 86', 1, '#4a4643', { marca: 'cinta' }), M(ret(54, 58, 14, 4, 2), PRETO, 'manopla'),
    M(ret(70, y(78) - 9, 20, 6, 2), PRETO, 'banco')
  ], 56);
}

function sacoPancada(cor: string): Amostra {
  return noChao([
    // O saco pendurado do teto pelas correntes (o suporte, o destorcedor) e as luvas no gancho da parede.
    Mt(ret(50, 0, 20, 4, 1), '#4a4643'),
    Mt(circulo(60, 8, 3), METAL, 'destorcedor'),
    L('M60 10L44 28M60 10V26M60 10L76 28', 1, '#6a6560', { marca: 'correntes' }),
    M(ret(42, 26, 36, 76, 12), cor, 'saco'),
    P(ret(42, 26, 36, 8, 4), escurecer(cor, 0.2)),
    P(ret(42, 56, 36, 10, 0), PRETO, 'faixa'),
    L('M48 40v54', 1, clarear(cor, 0.25), { fino: true }),
    Mt(ret(96, 32, 3, 8, 1), METAL, 'gancho'),
    L('M97 40v10M97 40l8 10', 0.8, '#6a6560'),
    M(suave([[90, 50], [100, 48], [102, 58], [100, 68], [90, 68], [88, 58]], true, 0.4) + suave([[100, 50], [110, 48], [114, 58], [110, 68], [102, 68], [100, 58]], true, 0.4), '#c8372d', 'luvas'),
    P(ret(90, 66, 10, 6, 1) + ret(102, 66, 10, 6, 1), '#f4f1ea')
  ], 22);
}

/* ============================================================== GARAGEM */

function ferramentas(cor: string): Amostra {
  return noChao([
    // A caixa de ferramentas de metal com a alça e os fechos, a chave de boca em cima e a furadeira ao lado.
    M(ret(8, 68, 66, 40, 3), cor, 'caixa'),
    M(ret(6, 60, 70, 10, 3), escurecer(cor, 0.12), 'tampa'),
    M(membro([[24, 61], [26, 52], [56, 52], [58, 61]], [3, 3, 3, 3]), PRETO, 'alca'),
    Mt(ret(14, 68, 6, 6, 1) + ret(62, 68, 6, 6, 1), METAL, 'fechos'),
    L('M8 86h66', 0.8),
    Mt(membro([[14, 58], [48, 54]], [3, 3]) + circulo(12, 58.4, 4) + circulo(51, 53.6, 3.4), INOX, 'chave'),
    M(suave([[80, 64], [110, 62], [112, 74], [98, 76], [100, 96], [88, 96], [86, 76], [80, 74]], true, 0.3), '#e2b72d', 'furadeira'),
    M(ret(84, 96, 20, 10, 2), PRETO, 'bateria'),
    Mt(ret(70, 66, 10, 6, 1), '#5d5a56'), Mt(ret(62, 68, 9, 2, 0.5), METAL)
  ], 54);
}

function bancadaFerramentas(cor: string): Amostra {
  const contorno = '#8a7a5a';
  return noChao([
    // O painel perfurado com cada ferramenta no seu contorno (martelo, chaves, serrote, chaves de fenda), a bancada
    // grossa de madeira, a morsa na ponta, a gaveta e a prateleira de baixo.
    M(ret(6, 4, 108, 48, 2), '#d7c9a8', 'painel'),
    P(Array.from({ length: 6 }, (_, j) => Array.from({ length: 16 }, (_, i) => circulo(12 + i * 6.4, 9 + j * 8, 0.7)).join('')).join(''), '#a8977a', 'furos', { fino: true }),
    L(ret(12, 10, 8, 30, 2) + ret(40, 14, 30, 16, 2), 0.8, contorno, { fino: true }),
    M(ret(14, 18, 4, 22, 1), '#a8743f', 'martelo'), Mt(ret(10, 12, 12, 6, 1), '#5d5a56'),
    Mt(cantos([[42, 16, 1], [68, 16, 1], [68, 22, 2], [52, 28, 1], [42, 28, 1]]), INOX, 'serrote'), M(ret(36, 14, 8, 14, 2), '#c8372d'),
    Mt([0, 1, 2].map(k => membro([[80 + k * 8, 12], [80 + k * 8, 36 - k * 4]], [2.4, 2.4])).join(''), INOX, 'chaves'),
    M(ret(102, 12, 4, 10, 1.5) + ret(108, 12, 4, 10, 1.5), '#e2b72d', 'fendas'), Mt(ret(103.4, 22, 1.2, 14, 0.5) + ret(109.4, 22, 1.2, 14, 0.5), INOX),
    M(ret(2, 56, 116, 8, 1.5), cor, 'bancada'),
    L(veio(2, 56, 116, 8, 2), 0.5, escurecer(cor, 0.25), { fino: true }),
    Mt(ret(92, 46, 20, 10, 1.5), '#3e5468', 'morsa'), Mt(ret(88, 50, 4, 2, 0.5) + ret(84, 46, 2, 10, 1), METAL),
    M(ret(6, 64, 8, 44, 1.5) + ret(106, 64, 8, 44, 1.5), escurecer(cor, 0.12), 'pes'),
    M(ret(40, 64, 40, 12, 1.5), escurecer(cor, 0.06), 'gaveta'), Mt(ret(54, 69, 12, 2, 1), METAL),
    M(ret(14, 92, 92, 5, 1), escurecer(cor, 0.12)),
    M(ret(22, 80, 24, 12, 1.5), '#c8372d'), M(ret(70, 84, 18, 8, 1.5), '#3c5e9a')
  ], 58);
}

function armarioGaragem(cor: string): Amostra {
  return noChao([
    // Três armários de metal: o alto de uma porta, o de duas portas, o gaveteiro de ferramentas — as aletas de
    // ventilação, as fechaduras, os porta-etiquetas.
    M(ret(4, 8, 34, 100, 2) + ret(41, 8, 38, 100, 2), cor, 'armarios'),
    M(ret(82, 30, 34, 78, 2), escurecer(cor, 0.06), 'gaveteiro'),
    L('M60 8v100M82 50h34M82 64h34M82 78h34M82 92h34', 1),
    L([0, 1, 2, 3, 4].map(k => `M10 ${14 + k * 3}h22M46 ${14 + k * 3}h10M64 ${14 + k * 3}h10`).join(''), 0.6, escurecer(cor, 0.35), { marca: 'aletas' }),
    Mt(ret(31, 50, 3, 16, 1) + ret(55, 50, 3, 16, 1) + ret(63, 50, 3, 16, 1), METAL, 'puxadores'),
    Mt(circulo(32.5, 72, 1.6) + circulo(60, 72, 1.6), LATAO, 'fechaduras'),
    Mt([0, 1, 2, 3, 4].map(k => ret(92, 37 + k * 14, 14, 2.4, 1)).join(''), METAL),
    P([0, 1, 2, 3, 4].map(k => ret(84, 34 + k * 14, 6, 4, 0.5)).join('') + ret(12, 24, 14, 6, 0.5) + ret(47, 24, 8, 6, 0.5) + ret(65, 24, 8, 6, 0.5), '#f4f1ea', 'etiquetas', { fino: true }),
    P(ret(4, 104, 112, 4, 1), escurecer(cor, 0.4))
  ], 58);
}

function organizadores(cor: string): Amostra {
  const caixa = (x: number, y: number, w: number, h: number, c: string) => [M(ret(x, y - h, w, h, 1.5), c, 'caixa'), P(ret(x + w / 2 - 5, y - h + 3, 10, 5, 0.5), '#f4f1ea', 'etiqueta', { fino: true })];
  return noChao([
    // A estante de aço do chão ao teto com as caixas etiquetadas de todos os tamanhos.
    Mt(ret(10, 4, 4, 104, 1) + ret(106, 4, 4, 104, 1), '#8d8a85', 'montantes'),
    ...caixa(16, 27, 28, 18, cor), ...caixa(46, 27, 24, 14, clarear(cor, 0.25)), ...caixa(72, 27, 32, 20, escurecer(cor, 0.15)),
    ...caixa(16, 54, 40, 20, escurecer(cor, 0.15)), ...caixa(58, 54, 22, 16, cor), ...caixa(82, 54, 22, 22, clarear(cor, 0.25)),
    ...caixa(16, 80, 26, 22, clarear(cor, 0.25)), ...caixa(44, 80, 30, 18, cor), ...caixa(76, 80, 28, 14, '#e2b72d'),
    ...caixa(18, 104, 40, 20, cor), ...caixa(62, 104, 40, 22, escurecer(cor, 0.15)),
    Mt(ret(8, 27, 104, 3, 0.5) + ret(8, 54, 104, 3, 0.5) + ret(8, 80, 104, 3, 0.5) + ret(8, 104, 104, 3, 0.5) + ret(8, 4, 104, 3, 0.5), METAL, 'prateleiras')
  ], 54);
}

function carregadorEv(cor: string): Amostra {
  return noChao([
    // O carregador de parede (o wallbox) no pedestal: a caixa com o anel de luz e o raio, o cabo grosso enrolado no
    // suporte e o conector encaixado.
    Mt(ret(54, 56, 12, 50, 2), '#4a4f57', 'pedestal'), Mt(ret(46, 104, 28, 4, 1.5), '#4a4f57'),
    M(ret(36, 12, 48, 46, 9), cor, 'wallbox'),
    P(ret(42, 18, 36, 30, 6), '#2b2826', 'frente'),
    Lz('M50 26a10 10 0 1 0 20 0', '#7cd6a0', { marca: 'anel' }),
    L('M50 26a10 10 0 1 1 20 0', 1.2, '#7cd6a0', { fino: true }),
    P('M61 20l-6 9h4l-2 7 7-10h-4z', '#7cd6a0', 'raio'),
    M(membro([[66, 58], [80, 64], [90, 76], [84, 88], [70, 86], [72, 72], [86, 70], [96, 80], [94, 96], [76, 100]], [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]), PRETO, 'cabo'),
    Mt(ret(28, 64, 8, 6, 1.5), '#5d5a56', 'suporte'),
    M(ret(26, 66, 12, 16, 3), PRETO, 'conector'), Mt(ret(29, 80, 6, 4, 1), METAL),
    L('M76 100q-30 4-46-18', 2.4, PRETO)
  ], 34);
}

function lavadoraPressao(cor: string): Amostra {
  return noChao([
    // A lavadora de alta pressão (o corpo na cor, o cabo alto, a mangueira enrolada, a pistola com a lança) e o
    // compressor de tanque vermelho com o manômetro.
    Mt(membro([[20, 60], [18, 18], [42, 18], [42, 60]], [3, 3, 3, 3]), '#4a4643', 'cabo'),
    M(ret(12, 52, 38, 46, 9), cor, 'lavadora'),
    L(elipse(31, 70, 11, 9) + elipse(31, 70, 7, 6), 1.8, PRETO, { marca: 'mangueira' }),
    { tipo: 'pneu', cx: 22, cy: 100, r: 8, aro: 'calota' },
    M(ret(48, 30, 6, 14, 2), PRETO, 'pistola'), Mt(ret(51, 8, 2, 24, 1), METAL, 'lanca'),
    M(ret(60, 76, 54, 24, 12), '#c8372d', 'compressor'),
    M(ret(70, 60, 26, 17, 3), '#3a3836', 'motor'),
    L('M72 64h22M72 68h22M72 72h22', 0.6, '#5d5a56', { fino: true }),
    Mt(circulo(104, 66, 6), METAL), P(circulo(104, 66, 4.6), '#f4f1ea', 'manometro'), L('M104 66l2-3', 0.7, '#c8372d', { fino: true }),
    Mt(membro([[110, 78], [114, 56], [118, 50]], [2, 2, 2]), METAL),
    P(circulo(68, 104, 4) + circulo(108, 104, 4), PRETO)
  ], 54);
}

/* ============================================================== ESCRITÓRIO */

function mesaExecutiva(cor: string): Amostra {
  return noChao([
    // A mesa de nogueira: o tampo com o couro embutido, os DOIS gaveteiros com os puxadores de latão, a gaveta do meio
    // com a fechadura, o veio da madeira — e a luminária de banqueiro de vidro verde.
    M(ret(10, 52, 30, 56, 2) + ret(80, 52, 30, 56, 2), cor, 'gaveteiros'),
    L(veio(10, 52, 30, 56, 5) + veio(80, 52, 30, 56, 5), 0.5, escurecer(cor, 0.3), { fino: true, marca: 'veio' }),
    L('M10 70h30M10 88h30M80 70h30M80 88h30', 1),
    Mt([61, 79, 97].map(y => ret(21, y - 1, 8, 2, 1) + ret(91, y - 1, 8, 2, 1)).join(''), LATAO, 'puxadores'),
    M(ret(40, 52, 40, 32, 1), escurecer(cor, 0.12), 'painel'),
    M(cantos([[14, 38, 1], [106, 38, 1], [116, 46, 1], [4, 46, 1]]), clarear(cor, 0.06), 'tampo'),
    P(cantos([[26, 39.5, 0.5], [94, 39.5, 0.5], [100, 44.5, 0.5], [20, 44.5, 0.5]]), '#2f4a3a', 'couro'),
    M(ret(4, 46, 112, 7, 1.5), cor),
    L(veio(4, 46, 112, 7, 1), 0.5, escurecer(cor, 0.3), { fino: true }),
    M(ret(42, 53, 36, 9, 1), cor), Mt(circulo(60, 57.5, 1.4), LATAO, 'fechadura'),
    Mt(ret(18, 34, 14, 4, 1.5) + ret(24, 20, 2.4, 14, 1), LATAO, 'luminaria'),
    M('M14 22a11 7 0 0 1 22 0z', '#2f6b45', 'cupula'), Lz(ret(15, 21, 20, 1.6, 0.5), '#ffe3a8', { fino: true }),
    P(ret(70, 34, 22, 4, 1), '#e9e4da'), P(ret(72, 30, 18, 4, 1), '#8a3a2a'),
    M(ret(98, 28, 6, 10, 1.5), '#3a2f2a', 'porta-canetas')
  ], 58);
}

function cadeiraErgonomica(cor: string): Amostra {
  return noChao([
    // A cadeira de escritório de tela: o encosto de tela com o apoio lombar, o apoio de cabeça, os braços reguláveis,
    // o assento, o pistão e a base de cinco patas com rodízios.
    M(ret(44, 2, 32, 12, 6), PRETO, 'apoio-cabeca'), Mt(ret(58, 14, 4, 6, 1), '#4a4643'),
    M(ret(36, 18, 48, 50, 14), PRETO, 'encosto'),
    P(ret(40, 22, 40, 42, 11), cor, 'tela'),
    L(trama(42, 24, 36, 38, 4), 0.4, escurecer(cor, 0.3), { fino: true }),
    M(ret(44, 48, 32, 9, 4), '#3a3836', 'lombar'),
    Mt(ret(26, 54, 4, 18, 1) + ret(90, 54, 4, 18, 1), '#4a4643', 'bracos'), M(ret(18, 50, 18, 5, 2.4) + ret(84, 50, 18, 5, 2.4), PRETO),
    M(cantos([[28, 66, 4], [92, 66, 4], [98, 76, 4], [22, 76, 4]]), PRETO, 'assento'),
    M(ret(24, 74, 72, 5, 2.4), '#3a3836'),
    Mt(ret(57, 79, 6, 16, 1.5), INOX, 'pistao'),
    Mt(membro([[60, 96], [18, 102]], [3.4, 2.6]) + membro([[60, 96], [102, 102]], [3.4, 2.6]) + membro([[60, 96], [42, 106]], [3.4, 2.6]) + membro([[60, 96], [78, 106]], [3.4, 2.6]), '#3a3836', 'base'),
    M(circulo(18, 105, 3.4) + circulo(102, 105, 3.4) + circulo(42, 107, 3) + circulo(78, 107, 3), PRETO, 'rodizios')
  ], 46);
}

function monitores(cor: string): Amostra {
  return noChao([
    // As duas telas lado a lado nos braços articulados presos no poste: o código numa, a documentação na outra.
    Mt(ret(58, 34, 4, 70, 1.5), '#3a3836', 'poste'), Mt(ret(44, 102, 32, 6, 2), '#3a3836', 'base'),
    Mt(membro([[60, 48], [48, 54], [38, 46]], [3.4, 3.4, 3.4]) + membro([[60, 48], [72, 54], [82, 46]], [3.4, 3.4, 3.4]), '#4a4643', 'bracos'),
    Mt(circulo(48, 54, 2) + circulo(72, 54, 2), METAL),
    M(ret(2, 14, 55, 36, 2), cor, 'monitor'), P(ret(4, 16, 51, 30, 1), '#1c2230', 'tela'),
    L('M8 21h18M12 26h26M12 31h20M16 36h22M12 41h14', 1, '#7cd67c', { fino: true, marca: 'codigo' }), L('M28 21h12M26 31h10', 1, '#d6a04a', { fino: true }),
    M(ret(63, 14, 55, 36, 2), cor, 'monitor'), P(ret(65, 16, 51, 30, 1), '#f4f1ea', 'documento'),
    L('M70 22h30M70 27h40M70 31h36M70 35h40M70 39h28', 0.8, '#8d8a85', { fino: true }), P(ret(70, 18, 20, 2.4, 0.5), '#2f6db3', undefined, { fino: true })
  ], 34);
}

function impressora(cor: string): Amostra {
  return noChao([
    // A multifuncional: o alimentador de folhas em cima, a tampa do scanner, o visor, a folha saindo na frente.
    M(cantos([[26, 40, 1.5], [94, 40, 1.5], [90, 52, 1.5], [30, 52, 1.5]]), cor, 'alimentador'),
    P(cantos([[34, 34, 0.5], [82, 34, 0.5], [84, 44, 0.5], [32, 44, 0.5]]), '#f4f1ea', 'folhas'),
    M(ret(12, 52, 96, 8, 3), escurecer(cor, 0.06), 'scanner'),
    M(ret(14, 60, 92, 40, 4), cor, 'corpo'),
    P(ret(86, 64, 16, 7, 1), TELA, 'visor'), Lz(ret(87.5, 65.5, 13, 4, 0.5), '#7cc0d6', { fino: true }),
    P(circulo(90, 76, 1.4) + circulo(95, 76, 1.4) + circulo(100, 76, 1.4), '#4a4643', undefined, { fino: true }),
    P(ret(24, 74, 58, 4, 1), PRETO, 'saida'),
    P(cantos([[26, 76, 0.5], [80, 76, 0.5], [86, 88, 0.5], [20, 88, 0.5]]), '#f4f1ea', 'folha'),
    L('M28 79h44M27 82h40M26 85h36', 0.5, '#8d8a85', { fino: true }),
    M(ret(20, 98, 80, 6, 2), escurecer(cor, 0.1), 'bandeja'),
    P(ret(18, 104, 6, 3, 0.5) + ret(96, 104, 6, 3, 0.5), PRETO)
  ], 50);
}

function estanteEscritorio(cor: string): Amostra {
  const pastas = ['#2f4a6b', '#2f4a6b', '#8a3a2a', '#2f4a6b', '#3f6b45', '#8a3a2a', '#2f4a6b'];
  return noChao([
    // A estante de trabalho: as pastas de lombada com etiqueta e o furo, os livros de consulta, o DIPLOMA emoldurado
    // na prateleira e as portas fechadas embaixo.
    M(ret(8, 4, 104, 104, 2), cor, 'estante'),
    P(ret(12, 8, 96, 24, 1) + ret(12, 36, 96, 24, 1) + ret(12, 64, 96, 18, 1), escurecer(cor, 0.35)),
    ...pastas.map((c, k) => P(ret(14 + k * 9, 10, 8, 22, 0.8), c, 'pastas')),
    P(pastas.map((_, k) => ret(15.5 + k * 9, 13, 5, 6, 0.4)).join(''), '#f4f1ea', undefined, { fino: true }),
    P(pastas.map((_, k) => circulo(18 + k * 9, 26, 1.4)).join(''), PRETO, undefined, { fino: true }),
    P([0, 1, 2, 3, 4].map(k => ret(78 + k * 6, 14 - (k % 2) * 2, 5.4, 18 + (k % 2) * 2, 0.6)).join(''), '#6e3f22', 'livros'),
    P([0, 1, 2, 3, 4].map(k => ret(78 + k * 6, 18, 5.4, 2, 0.3)).join(''), '#c9a23a', undefined, { fino: true }),
    M(cantos([[18, 59, 1], [50, 59, 1], [52, 38, 1], [20, 38, 1]]), '#2b2826', 'diploma'),
    P(cantos([[22, 56, 0.5], [47, 56, 0.5], [49, 41, 0.5], [24, 41, 0.5]]), '#f4f1ea'),
    L('M28 46h16M27 49h16', 0.6, '#8d8a85', { fino: true }), Mt(circulo(42, 53, 2), LATAO),
    P([0, 1, 2, 3, 4, 5, 6].map(k => ret(58 + k * 7, 40 - (k % 3) * 2, 6, 20 + (k % 3) * 2, 0.6)).join(''), '#3c5e9a', 'livros'),
    P(ret(14, 66, 30, 16, 1), '#d8cbb2', 'caixa-arquivo'), P(ret(48, 70, 28, 12, 1), '#d8cbb2'),
    M(ret(8, 84, 104, 24, 2), cor, 'portas'), L('M60 84v24', 1), Mt(ret(55, 92, 2, 8, 0.8) + ret(63, 92, 2, 8, 0.8), METAL)
  ], 56);
}

/** As coisas da casa (VIDA 12.7), cada uma com o seu desenho. */
export const OBJETOS_DA_CASA: Record<string, (cor: string) => Amostra> = {
  // Sala
  sofa_retratil: sofaRetratil, sofa_couro: sofaCouro, sofa_designer: sofaDesigner, poltrona_designer: poltronaDesigner,
  mesa_centro: mesaCentro, mesa_centro_marmore: mesaCentroMarmore, mesa_lateral: mesaLateral, estante_sala: estanteSala, aparador,
  tv_oled: tvOled, home_theater: homeTheater, tapete, tapete_persa: tapetePersa, quadros, objetos_decor: objetosDecor, lareira,
  // Cozinha
  geladeira, geladeira_inox: geladeiraInox, freezer, adega, fogao, cooktop_forno: cooktopForno, fogao_profissional: fogaoProfissional,
  microondas, cafeteira, louca_talheres: loucaTalheres, ilha_cozinha: ilhaCozinha, armarios_planejados: armariosPlanejados,
  // Quartos
  cama_box: camaBox, cama_king: camaKing, colchao_hotel: colchaoHotel, guarda_roupa: guardaRoupa, closet, penteadeira,
  criado_mudo: criadoMudo, espelho_chao: espelhoChao, comoda, cama_solteiro: camaSolteiro, sofa_cama: sofaCama, beliche,
  // Banheiro
  banheira, banheira_pedra: banheiraPedra, ducha, gabinete, bancada_marmore: bancadaMarmore, espelho_led: espelhoLed,
  toalheiro, toalhas, sauna,
  // Piscina
  espreguicadeira: c => espreguicadeiras(c, false), espreguicadeira_teca: c => espreguicadeiras(c, true), guarda_sol: guardaSol,
  ombrelone, mesa_externa: mesaExterna, sofa_externo: sofaExterno, boias, luz_piscina: luzPiscina, aquecedor_piscina: aquecedorPiscina,
  capa_piscina: capaPiscina, cascata, kit_piscina: kitPiscina,
  // Jardim
  churrasqueira, espaco_gourmet: espacoGourmet, forno_pizza: fornoPizza, pergolado, gazebo, fonte, escultura_jardim: esculturaJardim,
  plantas, vasos_grandes: vasosGrandes, luz_jardim: luzJardim, playground, cama_elastica: camaElastica,
  // Lazer
  bilhar_profissional: bilharProfissional, pebolim, pingue_pongue: pinguePongue, mesa_jogos: mesaJogos, fliperama,
  poltronas_cinema: poltronasCinema, bicicleta_ergometrica: bicicletaErgometrica, remo_seco: remoSeco, saco_pancada: sacoPancada,
  // Garagem
  ferramentas, bancada_ferramentas: bancadaFerramentas, armario_garagem: armarioGaragem, organizadores, carregador_ev: carregadorEv,
  lavadora_pressao: lavadoraPressao,
  // Escritório
  mesa_executiva: mesaExecutiva, cadeira_ergonomica: cadeiraErgonomica, monitores, impressora, estante_escritorio: estanteEscritorio
};
