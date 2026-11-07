/**
 * VIDA 13 — O MÓVEL TEM VOLUME. Antes, cada móvel era um desenho de frente posto num plano: encostado na parede do
 * fundo, uma figura sem lado nem tampo; girado contra uma parede lateral, uma folha inclinada (a penteadeira era um
 * cartão de lado, sem tampo, sem gaveta, sem profundidade).
 *
 * Por que não 3D de verdade: um motor 3D (WebGL, malhas, luz) pesaria centenas de kB, trocaria a linguagem ilustrada
 * do VIDA por outra e custaria em celular simples. O que dá o volume é a GEOMETRIA, não o motor: cada móvel é um
 * conjunto de BLOCOS (o tampo, o corpo das gavetas, as pernas da frente e as de trás, o espelho recuado), cada um um
 * paralelepípedo em metros, tirado do próprio desenho (o retângulo dele no quadro de 120 × 120) e da profundidade de
 * catálogo (`medidas.ts`). A cena projeta cada bloco na mesma perspectiva de um ponto do cômodo e pinta as faces que a
 * câmera vê: a lateral que dá para o meio do cômodo, o tampo (quando está abaixo do olho), a ponta que dá para quem
 * olha (no móvel girado). A frente continua sendo o desenho — agora no plano certo, em perspectiva verdadeira (em
 * fatias verticais: o lado perto de quem olha maior que o do fundo), e o que fica recuado (o espelho da penteadeira, os
 * aéreos da cozinha, o painel de ferramentas) vai para o plano dele.
 *
 * Puro (sem React): os testes medem os blocos, as faces visíveis e as fatias; a cena (`comodos.tsx`) só desenha.
 */
import type { Amostra, Peca } from './nucleo';
import { caixaDaAmostra, pontosDoCaminho, type Caixa } from './caixa';
import { medidaDe } from './medidas';
import type { Geometria, Posto } from './disposicao';

/** Um bloco do móvel: o retângulo no desenho (u, v no quadro do desenho) e a profundidade (0 = a frente, 1 = o fundo). */
export interface Bloco {
  u0: number; v0: number; u1: number; v1: number;
  p0: number; p1: number;
  /** A cor do material (sem ela: a do corpo do desenho). */
  cor?: string;
  /**
   * As peças do desenho (índices [de, até) da lista de peças) que vão para o plano da frente DESTE bloco, e não para o
   * da frente do móvel: o espelho atrás do tampo (p0 > 0), a banqueta na frente da penteadeira (p0 < 0, pintada depois).
   */
  pecas?: [number, number];
  /** Só leva as peças para o plano (o vaso em cima da bancada): sem faces. */
  semFaces?: boolean;
  /** É a cadeira que o desenho traz junto (a da escrivaninha): sai quando o cômodo já tem a cadeira de verdade. */
  cadeira?: boolean;
  /** As peças [de, até) saem do desenho de vez (os pés desenhados, trocados pelos blocos de perna). */
  tira?: [number, number];
  /** A face da frente do bloco também é pintada (a perna: o desenho dela saiu). */
  comFrente?: boolean;
}

const b = (x: number, y: number, w: number, h: number, p0 = 0, p1 = 1, extra: Partial<Bloco> = {}): Bloco => ({ u0: x, v0: y, u1: x + w, v1: y + h, p0, p1, ...extra });
/** As pernas: a da frente e a de trás, em cada x dado (a largura `w`), de `y0` ao chão (`y1`). */
const pernas = (xs: number[], w: number, y0: number, y1: number, cor?: string, f: [number, number] = [0.04, 0.13], t: [number, number] = [0.87, 0.96]): Bloco[] =>
  xs.flatMap(x => [b(x, y0, w, y1 - y0, f[0], f[1], { cor, comFrente: true }), b(x, y0, w, y1 - y0, t[0], t[1], { cor, comFrente: true })]);
/** Os pés desenhados (as peças [de, até)) saem: as pernas viram blocos (senão o pé desenhado, inclinado, sobra ao lado). */
const semPes = (de: number, ate = de + 1): Bloco => ({ u0: 50, v0: 50, u1: 51, v1: 51, p0: 0.5, p1: 0.5, semFaces: true, tira: [de, ate] });
const escuro = (c: string, k: number) => misturarHex(c, '#000000', k);
const claro = (c: string, k: number) => misturarHex(c, '#ffffff', k);

/**
 * Os blocos de cada móvel (no quadro do desenho dele; os índices de `pecas` são os da lista de peças do desenho em
 * `objetosDaCasa.ts` / `objetos.ts` / `fixosDaCena.ts`). Quem não está aqui e vai de lado (`Medida.gira`) ganha um
 * bloco só, a caixa do desenho inteira.
 */
export const VOLUMES: Record<string, (cor: string) => Bloco[]> = {
  // ------------------------------------------------------------ quarto
  penteadeira: c => [
    b(30, 8, 60, 50, 0.84, 0.94, { pecas: [0, 3] }),                    // o espelho com as lâmpadas, encostado atrás
    b(10, 56, 100, 6, 0, 1, { cor: c }),                                // o tampo
    b(14, 62, 92, 14, 0.03, 0.92, { cor: escuro(c, 0.05) }),            // o corpo das gavetas
    ...pernas([16, 100], 5, 76, 108, escuro(c, 0.15)), semPes(7),
    b(38, 82, 44, 9, -0.55, -0.15, { cor: '#d9a3a0', pecas: [10, 12] }) // a banqueta, na frente
  ],
  comoda: c => [b(10, 36, 100, 6, 0, 1, { cor: claro(c, 0.08) }), b(14, 42, 92, 58, 0.03, 0.97), ...pernas([16, 98], 6, 100, 108, escuro(c, 0.2), [0.05, 0.16], [0.84, 0.95]), semPes(4),
    b(24, 18, 80, 18, 0.5, 0.5, { pecas: [5, 8], semFaces: true })],   // o porta-retrato e o vaso, no meio do tampo
  guarda_roupa: () => [b(4, 6, 112, 102)],
  closet: () => [b(2, 4, 116, 104)],
  // ------------------------------------------------------------ sala
  estante_sala: () => [b(2, 8, 116, 100)],
  aparador: c => [
    b(40, 6, 40, 40, 0.94, 1, { cor: '#c9a23a', pecas: [0, 3] }),     // o espelho redondo na parede
    b(8, 56, 104, 32, 0, 1),
    ...pernas([12, 104], 4, 88, 108, escuro(c, 0.4), [0.06, 0.14], [0.86, 0.94]), semPes(7),
    b(10, 28, 96, 28, 0.45, 0.45, { pecas: [8, 12], semFaces: true })  // a luminária e a bandeja, em cima
  ],
  home_theater: c => [b(2, 22, 20, 86, 0, 0.8), b(98, 22, 20, 86, 0, 0.8), b(26, 82, 68, 26, 0, 0.95, { cor: '#3a2f2a' }), b(36, 72, 48, 10, 0.1, 0.7, { cor: c })],
  som_hifi: c => [b(30, 66, 60, 42, 0, 1, { cor: '#b9773f' }), b(4, 38, 20, 70, 0, 0.75, { cor: escuro(c, 0.15) }), b(96, 38, 20, 70, 0, 0.75, { cor: escuro(c, 0.15) })],
  vitrine_colecao: () => [b(28, 6, 64, 104)],
  estante_trofeus: () => [b(14, 6, 92, 104)],
  lareira: c => [b(8, 18, 104, 90, 0.15, 1), b(2, 48, 116, 6, 0, 1, { cor: '#5a3a24' }), b(2, 98, 116, 10, 0, 1, { cor: escuro(c, 0.15) })],
  mesa_jantar: c => [b(24, 58, 72, 7, 0, 1), ...pernas([30, 85], 5, 65, 108, escuro(c, 0.2), [0.06, 0.14], [0.86, 0.94]), semPes(1)],
  // ------------------------------------------------------------ cozinha e lavanderia
  geladeira: () => [b(30, 4, 60, 104)],
  geladeira_inox: () => [b(12, 4, 96, 104)],
  freezer: () => [b(10, 58, 100, 50)],
  adega: () => [b(32, 6, 56, 102)],
  adega_parede: () => [b(24, 2, 72, 108)],
  fogao: () => [b(20, 40, 80, 68)],
  cooktop_forno: () => [b(6, 46, 108, 62)],
  fogao_profissional: () => [b(4, 40, 112, 68), b(8, 6, 104, 22, 0.88, 0.98, { cor: '#c3c6c9', pecas: [0, 2] })],
  maquina_lavar: () => [b(18, 10, 84, 98)],
  lava_loucas: () => [b(16, 14, 88, 94)],
  ilha_cozinha: c => [b(6, 48, 108, 7, 0, 1, { cor: '#e6e2da' }), b(12, 54, 96, 54, 0.06, 0.94, { cor: c }), b(18, 40, 30, 8, 0.4, 0.4, { pecas: [8, 10], semFaces: true })],
  armarios_planejados: c => [
    b(2, 4, 86, 30, 0.45, 1, { cor: c, pecas: [0, 3] }),               // os aéreos: rasos, presos na parede
    b(2, 34, 86, 22, 0.98, 1, { cor: '#e3ddd3', pecas: [3, 5] }),      // o revestimento entre a bancada e os aéreos
    b(90, 4, 28, 104, 0, 1, { cor: c }),                                // a coluna da despensa
    b(2, 56, 88, 5, 0, 1, { cor: '#3d3a37' }),                          // a bancada
    b(2, 61, 86, 47, 0.03, 1, { cor: c }),
    b(14, 38, 56, 18, 0.6, 0.6, { pecas: [12, 16], semFaces: true })   // o vaso e a planta, em cima da bancada
  ],
  // ------------------------------------------------------------ estudo e escritório
  escrivaninha: c => [
    b(20, 54, 38, 11, -0.62, -0.12, { cor: '#2b2826', pecas: [4, 9], cadeira: true }), // a cadeira, puxada para a frente
    b(6, 42, 92, 7, 0, 1, { cor: c }), b(64, 49, 30, 26, 0.03, 0.95, { cor: escuro(c, 0.08) }),
    ...pernas([10], 5, 49, 108, escuro(c, 0.15), [0.03, 0.11], [0.89, 0.97]), ...pernas([90], 4, 75, 108, escuro(c, 0.15), [0.03, 0.11], [0.89, 0.97]), semPes(3)
  ],
  mesa_executiva: c => [b(4, 46, 112, 7, 0, 1, { cor: c }), b(10, 53, 30, 55, 0.04, 0.96), b(80, 53, 30, 55, 0.04, 0.96), b(40, 53, 40, 31, 0.5, 0.58, { cor: escuro(c, 0.12) }),
    b(14, 20, 94, 18, 0.45, 0.45, { pecas: [11, 17], semFaces: true })], // a luminária, os papéis e o porta-canetas, em cima
  estante_escritorio: () => [b(8, 4, 104, 104)],
  livros: () => [b(14, 8, 92, 100, 0, 1, { cor: '#b9773f' })],
  piano: c => [b(8, 12, 104, 62, 0.25, 1), b(4, 70, 112, 10, 0, 0.6, { cor: c }), b(18, 80, 84, 26, 0.3, 0.95, { cor: escuro(c, 0.1) })],
  // ------------------------------------------------------------ banheiro
  gabinete: c => [b(14, 50, 92, 8, 0, 1, { cor: '#efece6' }), b(18, 58, 84, 46, 0.04, 1, { cor: c }), b(48, 32, 26, 20, 0.75, 0.75, { pecas: [0, 1], semFaces: true })],
  bancada_marmore: c => [
    b(4, 4, 112, 34, 0.97, 1, { cor: '#c9a23a', pecas: [0, 3] }),     // o espelho de ponta a ponta, na parede
    b(30, 38, 66, 6, 0.95, 0.95, { pecas: [3, 5], semFaces: true }),   // as bicas, saindo da parede
    b(2, 54, 116, 12, 0, 1, { cor: c }),
    b(8, 88, 104, 5, 0.06, 0.94, { cor: c }),
    ...pernas([8, 109], 3, 66, 108, '#c9a23a', [0.05, 0.11], [0.89, 0.95]), semPes(8)
  ],
  // ------------------------------------------------------------ jogos e garagem
  fliperama: () => [b(26, 4, 68, 104)],
  bancada_ferramentas: c => [
    b(6, 4, 108, 48, 0.96, 1, { cor: '#d7c9a8', pecas: [0, 10] }),    // o painel perfurado na parede, com as ferramentas
    b(2, 56, 116, 8, 0, 1, { cor: c }),
    b(14, 92, 92, 5, 0.05, 0.95, { cor: escuro(c, 0.12) }),
    ...pernas([6, 106], 8, 64, 108, escuro(c, 0.12), [0.02, 0.14], [0.86, 0.98]), semPes(14)
  ],
  armario_garagem: c => [b(4, 8, 75, 100, 0, 1, { cor: c }), b(82, 30, 34, 78, 0, 1, { cor: escuro(c, 0.06) })],
  organizadores: () => [
    ...[4, 27, 54, 80, 104].map(y => b(8, y, 104, 3, 0, 1, { cor: '#b8b4ad' })),
    ...pernas([10, 106], 4, 4, 108, '#8d8a85', [0, 0.06], [0.94, 1]), semPes(0)
  ],
  // ------------------------------------------------------------ o que vem com o cômodo
  _bancada: () => [
    b(8, 8, 104, 24, 0.45, 1, { cor: '#e2dccf', pecas: [6, 8] }),     // os armários de cima
    b(66, 50, 20, 13, 0.75, 0.75, { pecas: [4, 6], semFaces: true }), // a cuba e a torneira, para trás no tampo
    b(2, 62, 116, 5, 0, 1, { cor: '#6f6a64' }),
    b(4, 67, 112, 43, 0.03, 1, { cor: '#e9e4da' })
  ],
  _fogao: () => [b(16, 52, 88, 58, 0, 1, { cor: '#ece9e4' })],
  _pia: () => [b(18, 52, 84, 12, 0, 0.85, { cor: '#f4f4f2' }), b(48, 64, 24, 46, 0.25, 0.7, { cor: '#ecebe7' })],
  _vaso: () => [b(32, 30, 56, 34, 0.72, 1, { cor: '#f4f4f2', pecas: [0, 1] }), b(30, 66, 60, 26, 0.04, 0.74, { cor: '#f4f4f2' })],
  _churrasqueira: () => [b(14, 52, 92, 58, 0, 1, { cor: '#b0654a' }), b(40, 6, 40, 48, 0.35, 1, { cor: '#9a5640', pecas: [2, 3] })]
};

/** Este posto tem volume? (o que tem blocos ou vai de lado; a metade do par e o que fica na parede, não). */
export function temVolume(p: Posto): boolean {
  if (p.montagem !== 'chao' || p.metade) return false;
  return !!VOLUMES[p.coisaId] || !!p.giro || !!medidaDe(p.coisaId).gira;
}

/** Os blocos do posto (no quadro do desenho `a`). */
export function blocosDe(coisaId: string, a: Amostra, cor: string): Bloco[] {
  const f = VOLUMES[coisaId];
  if (f) return f(cor);
  const c = caixaDaAmostra(a);
  return [{ u0: c.x0, v0: c.y0, u1: c.x1, v1: c.y1, p0: 0, p1: 1 }];
}

/* ================================================================ o referencial do móvel */

export type V3 = [number, number, number]; // (x, altura, z) em metros
/**
 * O referencial do móvel: a origem (o pé do canto esquerdo da frente do desenho), o eixo da largura do desenho (U) e o
 * da profundidade (D, da frente para o fundo), e a escala (metros por unidade do desenho).
 */
export interface Referencial { o: V3; U: V3; D: V3; sigma: number; sigmaV: number; prof: number; c: Caixa }

/**
 * O desenho que é mais largo do que alto de propósito (a bancada da cozinha com os armários de cima): a altura vem do
 * tampo — a linha `y` do desenho fica a `m` metros do chão —, não da largura (a bancada estreita não fica baixinha).
 */
const ALTURA_PELO_TAMPO: Record<string, [number, number]> = { _bancada: [62, 0.92] };

export function referencial(p: Posto, a: Amostra): Referencial {
  const c = caixaDaAmostra(a);
  const bw = Math.max(1, c.x1 - c.x0), bh = Math.max(1, c.y1 - c.y0);
  const larg = p.giro ? p.z1 - p.z0 : p.x1 - p.x0;
  const prof = p.giro ? p.x1 - p.x0 : p.z1 - p.z0;
  // a largura real; sem passar de 1,3× a altura de catálogo (como a cena sempre fez)
  let sigma = larg / bw;
  if (bh * sigma > p.h * 1.3) sigma = (p.h * 1.3) / bh;
  const off = (larg - bw * sigma) / 2;
  const t = ALTURA_PELO_TAMPO[p.coisaId];
  const sigmaV = t ? t[1] / Math.max(1, c.y1 - t[0]) : sigma;
  // Encostado na parede esquerda, a frente vira para a direita: quem olha de frente para ele tem o fundo do cômodo à
  // direita — a largura do desenho corre de perto de quem olha (z1) para o fundo (z0). Na direita, o contrário.
  if (p.giro === 'esq') return { o: [p.x1, 0, p.z1 - off], U: [0, 0, -1], D: [-1, 0, 0], sigma, sigmaV, prof, c };
  if (p.giro === 'dir') return { o: [p.x0, 0, p.z0 + off], U: [0, 0, 1], D: [1, 0, 0], sigma, sigmaV, prof, c };
  return { o: [p.x0 + off, 0, p.z1], U: [1, 0, 0], D: [0, 0, -1], sigma, sigmaV, prof, c };
}

/** Um ponto do desenho (u, v) a uma profundidade (fração 0..1) → metros no cômodo. */
export function noMundo(r: Referencial, u: number, v: number, pf: number): V3 {
  const du = (u - r.c.x0) * r.sigma, dp = pf * r.prof, h = (r.c.y1 - v) * r.sigmaV;
  return [r.o[0] + r.U[0] * du + r.D[0] * dp, h, r.o[2] + r.U[2] * du + r.D[2] * dp];
}

/** A câmera (de onde a cena é vista): no meio, à altura do olho, a `dist` da parede do fundo. */
export const camera = (g: Geometria): V3 => [g.Wm / 2, (g.fy1 - g.pf.y) / g.k, g.dist];

/**
 * Metros → tela, na perspectiva do cômodo, SEM limitar a profundidade (o armário que segue para perto de quem olha sai
 * pela borda da cena, inteiro, em vez de achatar no limite).
 */
export function projetar(g: Geometria, [x, alt, z]: V3): [number, number] {
  const s = g.dist / Math.max(0.25, g.dist - z);
  return [g.W / 2 + (x - g.Wm / 2) * g.k * s, g.pf.y + (g.fy1 - g.pf.y) * s - alt * g.k * s];
}

/* ================================================================ as faces */

export type TipoDeFace = 'topo' | 'lado' | 'ponta' | 'baixo' | 'frente';
export interface Face { bloco: number; tipo: TipoDeFace; pts: [number, number][]; cor: string }
/**
 * O que a cena desenha, na ordem: as faces de cada bloco (do mais longe para o mais perto), os recortes do desenho no
 * plano deles, a frente desenhada (`frente`) e, depois dela, o que fica à frente do móvel (a banqueta da penteadeira).
 */
export type Passo = { tipo: 'face'; face: Face } | { tipo: 'pecas'; bloco: Bloco } | { tipo: 'frente' };

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];

/**
 * As faces que a câmera vê de cada bloco (menos a da frente, que é o desenho), já na tela, e os recuados, na ordem de
 * pintar. `base`: a cor do corpo do móvel (a das faces dos blocos sem cor própria).
 */
export function passosDoMovel(g: Geometria, p: Posto, a: Amostra, base: string, blocos = blocosDe(p.coisaId, a, base)): Passo[] {
  const r = referencial(p, a);
  const cam = camera(g);
  const ordem = blocos.map((bl, i) => {
    const centro = noMundo(r, (bl.u0 + bl.u1) / 2, (bl.v0 + bl.v1) / 2, (bl.p0 + bl.p1) / 2);
    const d = sub(cam, centro);
    return { bl, i, dist: dot(d, d) };
  }).sort((x, y) => (x.bl.p1 <= 0 ? 1 : 0) - (y.bl.p1 <= 0 ? 1 : 0) || y.dist - x.dist);
  const out: Passo[] = [];
  let frente = false;
  for (const { bl, i } of ordem) {
    if (!frente && bl.p1 <= 0) { out.push({ tipo: 'frente' }); frente = true; }
    const cor = bl.cor ?? base;
    const P = (u: number, v: number, pf: number) => noMundo(r, u, v, pf);
    // as faces: [normal, quatro cantos, tipo]
    const up: V3 = [0, 1, 0];
    const faces: [V3, V3[], TipoDeFace][] = [
      ...(bl.comFrente ? [[neg(r.D), [P(bl.u0, bl.v0, bl.p0), P(bl.u1, bl.v0, bl.p0), P(bl.u1, bl.v1, bl.p0), P(bl.u0, bl.v1, bl.p0)], 'frente'] as [V3, V3[], TipoDeFace]] : []),
      [r.D, [P(bl.u0, bl.v0, bl.p1), P(bl.u1, bl.v0, bl.p1), P(bl.u1, bl.v1, bl.p1), P(bl.u0, bl.v1, bl.p1)], 'lado'], // o fundo (quase nunca)
      [neg(r.U), [P(bl.u0, bl.v0, bl.p0), P(bl.u0, bl.v0, bl.p1), P(bl.u0, bl.v1, bl.p1), P(bl.u0, bl.v1, bl.p0)], 'lado'],
      [r.U, [P(bl.u1, bl.v0, bl.p0), P(bl.u1, bl.v0, bl.p1), P(bl.u1, bl.v1, bl.p1), P(bl.u1, bl.v1, bl.p0)], 'lado'],
      [up, [P(bl.u0, bl.v0, bl.p0), P(bl.u1, bl.v0, bl.p0), P(bl.u1, bl.v0, bl.p1), P(bl.u0, bl.v0, bl.p1)], 'topo'],
      [neg(up), [P(bl.u0, bl.v1, bl.p0), P(bl.u1, bl.v1, bl.p0), P(bl.u1, bl.v1, bl.p1), P(bl.u0, bl.v1, bl.p1)], 'baixo']
    ];
    for (const [n, cantos, tipo] of bl.semFaces ? [] : faces) {
      if (tipo === 'baixo' && cantos[0][1] < 0.02) continue; // o chão
      if (dot(sub(cam, cantos[0]), n) <= 1e-6) continue;
      // a face que dá para quem olha (normal +z): a ponta do móvel girado — mais clara que a lateral.
      const t: TipoDeFace = tipo === 'lado' && n[2] > 0.5 ? 'ponta' : tipo;
      const tom = t === 'frente' ? cor : t === 'topo' ? misturarHex(cor, '#ffffff', 0.14) : t === 'ponta' ? misturarHex(cor, '#000000', 0.1) : t === 'baixo' ? misturarHex(cor, '#000000', 0.38) : misturarHex(cor, '#000000', 0.24);
      out.push({ tipo: 'face', face: { bloco: i, tipo: t, pts: cantos.map(q => projetar(g, q)), cor: tom } });
    }
    if (bl.pecas) out.push({ tipo: 'pecas', bloco: bl });
  }
  if (!frente) out.push({ tipo: 'frente' });
  return out;
}

/* ================================================================ o desenho no plano, em fatias */

export interface Fatia { u0: number; u1: number; m: [number, number, number, number, number, number] }

/**
 * O desenho (u0..u1 × v0..v1) no plano da profundidade `pf`, como transformações afins por fatia vertical. De frente (o
 * plano paralelo à tela) a perspectiva é uma escala: uma fatia só. No móvel girado, o plano foge para o fundo: a
 * perspectiva verdadeira não é afim, então o desenho vai em fatias estreitas o bastante para o erro na borda de cima e
 * na de baixo ficar abaixo de meio pixel (`px`: pixels de tela por unidade da cena; até 72 fatias).
 */
export function fatias(g: Geometria, r: Referencial, u0: number, u1: number, v0: number, v1: number, pf: number, px = 2.4): Fatia[] {
  const P = (u: number, v: number) => projetar(g, noMundo(r, u, v, pf));
  const zA = noMundo(r, u0, v0, pf)[2], zB = noMundo(r, u1, v0, pf)[2];
  const s = (z: number) => g.dist / Math.max(0.25, g.dist - z);
  // a altura do plano na tela (px), no lado mais perto: o erro de uma fatia é ~ a variação da escala × meia altura / 2
  const alturaPx = Math.max(Math.abs(P(u0, v1)[1] - P(u0, v0)[1]), Math.abs(P(u1, v1)[1] - P(u1, v0)[1])) * px;
  const tol = Math.max(0.004, Math.min(0.03, 1 / Math.max(1, alturaPx)));
  const n = Math.abs(zA - zB) < 1e-6 ? 1 : Math.max(2, Math.min(96, Math.ceil(Math.abs(Math.log(s(zA) / s(zB))) / tol)));
  const out: Fatia[] = [];
  for (let k = 0; k < n; k++) {
    const ua = u0 + ((u1 - u0) * k) / n, ub = u0 + ((u1 - u0) * (k + 1)) / n;
    const A = P(ua, v0), B = P(ub, v0), Ab = P(ua, v1), Bb = P(ub, v1);
    const du = ub - ua || 1, dv = v1 - v0 || 1;
    const a = (B[0] - A[0]) / du, bb = (B[1] - A[1]) / du;
    // o eixo vertical: a média das duas bordas da fatia (o erro fica dividido entre as vizinhas)
    const c = ((Ab[0] - A[0]) + (Bb[0] - B[0])) / 2 / dv, d = ((Ab[1] - A[1]) + (Bb[1] - B[1])) / 2 / dv;
    // ancorada no meio da fatia (o erro fica metade em cima, metade embaixo)
    const um = (ua + ub) / 2, vm = (v0 + v1) / 2, M = P(um, vm);
    out.push({ u0: ua, u1: ub, m: [a, bb, c, d, M[0] - a * um - c * vm, M[1] - bb * um - d * vm] });
  }
  return out;
}

/* ================================================================ as partes do desenho */

const PARTES = new WeakMap<Amostra, Map<string, { frente: Amostra; porBloco: Map<Bloco, Amostra> }>>();
/**
 * O desenho dividido pelos planos: a frente (sem as peças que vão para outro plano) e, para cada bloco com `pecas`, o
 * desenho só com elas (no mesmo quadro). `semCadeira`: a cadeira que o desenho traz sai de vez.
 */
export function partesDoDesenho(a: Amostra, blocos: Bloco[], semCadeira = false): { frente: Amostra; porBloco: Map<Bloco, Amostra> } {
  const chave = `${semCadeira}|${blocos.map(x => (x.pecas ? `${x.pecas[0]}-${x.pecas[1]}${x.cadeira ? 'c' : ''}` : '') + (x.tira ? `t${x.tira[0]}-${x.tira[1]}` : '')).join(',')}`;
  let porA = PARTES.get(a);
  if (!porA) { porA = new Map(); PARTES.set(a, porA); }
  const ja = porA.get(chave);
  // os blocos são recriados a cada desenho: o cache guarda pelos índices, e o mapa é refeito para os blocos de agora
  const fora = new Set<number>();
  const porBloco = new Map<Bloco, Amostra>();
  for (const x of blocos) {
    if (x.tira) for (let i = x.tira[0]; i < Math.min(x.tira[1], a.pecas.length); i++) fora.add(i);
    if (!x.pecas) continue;
    for (let i = x.pecas[0]; i < Math.min(x.pecas[1], a.pecas.length); i++) fora.add(i);
    if (!(semCadeira && x.cadeira)) porBloco.set(x, { vb: a.vb, pecas: a.pecas.slice(x.pecas[0], x.pecas[1]) });
  }
  const frente = ja?.frente ?? (fora.size ? { ...a, pecas: a.pecas.filter((_, i) => !fora.has(i)) } : a);
  if (!ja) porA.set(chave, { frente, porBloco });
  return { frente, porBloco };
}

/* ================================================================ a cor do corpo */

const CORPO = new WeakMap<Amostra, string>();
/** A cor do maior volume do desenho (a massa de maior área): a lateral é do mesmo material da frente. */
export function corDoCorpo(a: Amostra, padrao: string): string {
  const ja = CORPO.get(a);
  if (ja) return ja;
  let melhor = '', area = 0;
  const ver = (pecas: Peca[]) => {
    for (const x of pecas) {
      if (x.tipo === 'grupo') { ver(x.pecas); continue; }
      if (x.tipo !== 'massa' || !/^#[0-9a-f]{6}$/i.test(x.cor)) continue;
      const pts = pontosDoCaminho(x.d);
      if (!pts.length) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      const ar = (x1 - x0) * (y1 - y0);
      if (ar > area) { area = ar; melhor = x.cor; }
    }
  };
  ver(a.pecas);
  const c = melhor || padrao;
  CORPO.set(a, c);
  return c;
}

/** Mistura duas cores #rrggbb (local: este módulo não depende da camada do avatar). */
export function misturarHex(a: string, b: string, t: number): string {
  const p = (s: string) => { const h = /^#?([0-9a-f]{6})$/i.exec(s)?.[1] ?? '808080'; return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
