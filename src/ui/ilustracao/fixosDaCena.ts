/**
 * VIDA 12.8 — o que vem com o cômodo (desenhado, não comprado) e as peças de coleção à vista, na mesma linguagem dos
 * objetos (`objetosDaCasa.ts`): quadro de 120 × 120, chão em y = 110. A bancada da cozinha com a cuba e os armários de
 * cima; o fogão simples; o box, a pia e o vaso do banheiro; a árvore do jardim; a churrasqueira de alvenaria; a
 * prateleira de parede; a tela emoldurada, a camisa no quadro, a peça pequena e o vaso antigo; a barraca guardada.
 */
import { circulo, clarear, elipse, escurecer, hash, ret, suave, type Amostra, type Peca } from './nucleo';

const CHAO = 110;
const noChao = (pecas: Peca[], meia = 44, cx = 60): Amostra => ({ vb: [120, 120], chao: CHAO, sombra: [cx, meia], pecas });
const naParede = (pecas: Peca[]): Amostra => ({ vb: [120, 120], pecas });
const M = (d: string, cor: string, marca?: string): Peca => ({ tipo: 'massa', d, cor, ...(marca ? { marca } : {}) });
const P = (d: string, cor: string): Peca => ({ tipo: 'massa', d, cor, semVolume: true });
const L = (d: string, larg = 0.8, cor?: string): Peca => ({ tipo: 'linha', d, larg, ...(cor ? { cor } : {}) });
const Mt = (d: string, cor = '#b8b4ad'): Peca => ({ tipo: 'metal', d, cor });
const V = (d: string): Peca => ({ tipo: 'vidro', d });

export const FIXOS_DA_CENA: Record<string, (cor: string) => Amostra> = {
  /** A bancada (1,9 m × 0,92 m): tampo de granito, a cuba e a torneira, as portas, os armários de cima. */
  _bancada: () => naParede([
    M(ret(4, 66, 112, 44, 1), '#e9e4da', 'bancada'), P(ret(2, 62, 116, 5, 1), '#6f6a64'),
    L('M32 70V108M60 70V108M88 70V108', 0.8, '#b7b0a5'), Mt(circulo(28, 88, 1.2) + circulo(36, 88, 1.2) + circulo(84, 88, 1.2) + circulo(92, 88, 1.2)),
    P(ret(66, 62.5, 22, 3, 1), '#4a4744'), Mt('M77 62v-9q6 -4 8 2', '#a7adb3'),
    M(ret(8, 8, 104, 24, 1), '#e2dccf', 'armario'), L('M34 8V32M60 8V32M86 8V32', 0.8, '#b7b0a5')
  ]),
  /** O fogão simples de quatro bocas. */
  _fogao: () => noChao([M(ret(16, 52, 88, 58, 2), '#ece9e4', 'fogao'), P(ret(16, 48, 88, 6, 1), '#3b3835'), ...[34, 52, 70, 88].map(x => P(circulo(x, 51, 3.4), '#1f1d1b')), P(ret(26, 66, 68, 30, 2), '#2b2927'), V(ret(30, 70, 60, 22, 1))], 46),
  /** O box: vidro do chão ao teto, o chuveiro. */
  _box: () => noChao([V(ret(10, 8, 100, 102, 1)), L('M10 8V110M110 8V110M10 8H110', 1.4, '#9fb3bb'), Mt('M30 8v10q0 6 8 6'), Mt(circulo(40, 28, 6)), P(ret(14, 106, 92, 4, 1), '#cfd6d8')], 52),
  /** A pia de coluna e o espelho simples. */
  _pia: () => noChao([M(ret(18, 52, 84, 12, 4), '#f4f4f2', 'pia'), M(ret(48, 64, 24, 46, 2), '#ecebe7'), Mt('M60 52v-8q5 -3 7 1')], 40),
  /**
   * O vaso sanitário (de frente), com a caixa acoplada. VIDA 20: nas medidas de catálogo (caixa de 42 cm de largura,
   * 78 cm do chão ao topo; assento a 42 cm; o pé mais estreito que a bacia) — antes saía com 36 cm de altura, mais
   * largo do que alto, e parecia um banquinho ao lado da pia.
   */
  _vaso: () => noChao([
    M(ret(32, 6, 56, 7, 2.5), '#f7f7f5', 'tampa'), M(ret(35, 12, 50, 36, 3), '#f2f2ef', 'caixa'), P(circulo(60, 9.5, 2.2), '#c3c8cc'),
    M(ret(33, 48, 54, 7, 3.5), '#fafaf8', 'assento'),
    M(suave([[34, 55], [86, 55], [84, 68], [76, 82], [71, 97], [49, 97], [44, 82], [36, 68]]), '#f4f4f2', 'vaso'),
    M(ret(44, 95, 32, 15, 3), '#ecebe7', 'pe'), L('M36 56H84', 0.8, '#b7b3aa'), P(elipse(47, 66, 5, 2.6), '#ffffff')
  ], 30),
  /** A árvore do jardim: tronco e copa larga. */
  _arvore: () => noChao([M(ret(54, 54, 12, 56, 3), '#7a5a3a', 'tronco'), M(suave([[12, 60], [16, 28], [44, 10], [76, 8], [104, 26], [110, 56], [88, 70], [34, 72]]), '#5f8f4e', 'copa'), P(elipse(40, 34, 16, 10), clarear('#5f8f4e', 0.15))], 30),
  /** A churrasqueira de alvenaria, com a chaminé. */
  _churrasqueira: () => noChao([M(ret(14, 52, 92, 58, 1), '#b0654a', 'churrasqueira'), P(ret(28, 64, 64, 24, 1), '#2b2522'), M(ret(40, 6, 40, 48, 1), '#9a5640'), P(ret(10, 48, 100, 6, 1), '#8a7c70')], 46),
  /** A prateleira de parede (uma tábua com mão-francesa). */
  _prateleira: () => naParede([M(ret(2, 50, 116, 10, 1), '#b98a5a', 'prateleira'), Mt('M14 60l6 12M106 60l-6 12', '#5a5550')]),
  /** A tela de coleção emoldurada (as cores saem da semente da peça: cada obra, a sua composição). */
  _obra: cor => {
    const h = hash(cor);
    const c1 = ['#c9563a', '#2f5d68', '#d9a441', '#3b5444', '#7a3b5a', '#1d2430'][h % 6], c2 = ['#e9dfc8', '#c4ad87', '#8fb3c4', '#efe6d2'][(h >>> 4) % 4];
    return naParede([
      M(ret(4, 10, 112, 88, 1), '#b48a3c', 'moldura'), P(ret(12, 18, 96, 72, 0), c2),
      P(suave([[20, 80], [36, 40], [58, 52], [78, 26], [100, 74]]), c1), P(circulo(84 - (h % 30), 36, 9), escurecer(c1, 0.3))
    ]);
  },
  /** A camisa de jogo no quadro (memorabilia). */
  _camisa: cor => naParede([M(ret(6, 4, 108, 112, 1), '#2b2826', 'moldura'), P(ret(12, 10, 96, 100, 0), '#efe9df'),
    M(suave([[34, 24], [50, 18], [70, 18], [86, 24], [100, 40], [88, 48], [84, 44], [84, 100], [36, 100], [36, 44], [32, 48], [20, 40]]), cor || '#c8402a', 'camisa'),
    L('M52 18q8 8 16 0', 1, '#efe9df')]),
  /** A peça pequena de coleção (o relógio, a joia) numa redoma. */
  _peca: () => noChao([P(ret(30, 96, 60, 14, 2), '#3a2a22'), V(cantos3(36, 40, 48, 56)), Mt(circulo(60, 76, 10), '#c9a23a'), P(circulo(60, 76, 7), '#f4f1ea'), L('M60 76v-5M60 76l4 2', 0.8, '#2b2826')], 30),
  /** O vaso antigo (a porcelana, a prataria). */
  _antiguidade: () => noChao([M(suave([[48, 110], [36, 92], [34, 66], [44, 48], [46, 36], [40, 28], [80, 28], [74, 36], [76, 48], [86, 66], [84, 92], [72, 110]]), '#eef0f4', 'vaso'), L('M40 70q20 8 40 0M42 86q18 6 36 0', 1.4, '#2f5d9a')], 24),
  /** VIDA 12.8 · a vitrine de vidro iluminada: moldura, prateleiras de vidro, a luz de cima e três peças. */
  vitrine_colecao: cor => noChao([M(ret(28, 6, 64, 104, 1.5), cor, 'vitrine'), V(ret(32, 10, 56, 96, 1)), ({ tipo: 'luz', d: ret(34, 11, 52, 3, 1), cor: '#fff1c8' } as Peca),
    L('M32 40H88M32 70H88', 1, clarear(cor, 0.4)), Mt(circulo(46, 34, 4), '#c9a23a'), P(ret(62, 26, 10, 14, 1), '#eef0f4'), P(cantos3(44, 56, 12, 14), '#2f5d9a'), Mt(circulo(70, 64, 3.5), '#c3c6c9'), P(ret(28, 106, 64, 4, 1), escurecer(cor, 0.3))], 34),
  /** O expositor de relógios: a caixa de madeira com tampa de vidro e os giradores. */
  expositor_relogios: cor => noChao([M(ret(10, 74, 100, 36, 3), cor, 'caixa'), V(ret(14, 60, 92, 18, 2)), ...[26, 48, 70, 92].map(x => Mt(circulo(x, 88, 8), '#3a2a22')), ...[26, 48, 70, 92].map((x, k) => Mt(circulo(x, 88, 5), ['#c9a23a', '#c3c6c9', '#c9a23a', '#c3c6c9'][k])), L('M10 80H110', 0.8, escurecer(cor, 0.3))], 50),
  /** A estante de troféus: nichos iluminados, as taças, a medalha, a bola. */
  estante_trofeus: cor => noChao([M(ret(14, 6, 92, 104, 1), cor, 'estante'), P(ret(18, 10, 84, 96, 0), escurecer(cor, 0.35)), L('M18 40H102M18 72H102', 2, cor),
    Mt('M30 36v-6h-4v-4q0-8 8-8q8 0 8 8v4h-4v6z', '#c9a23a'), Mt('M62 36v-4h-3v-10h14v10h-3v4z', '#c3c6c9'), P(circulo(88, 28, 6), '#f4f1ea'), L('M84 24l8 8M92 24l-8 8', 0.6, '#2b2826'),
    Mt(circulo(38, 60, 6), '#c9a23a'), L('M38 54l-4 -10M38 54l4 -10', 1, '#3d5d8f'), Mt('M66 68v-5h-4v-6q0-6 6-6q6 0 6 6v6h-4v5z', '#b87333'), P(ret(80, 92, 16, 12, 1), '#efe9df')], 46),
  /** A adega de parede: porta de vidro do chão ao teto, as garrafas deitadas em fileiras, o painel de temperatura. */
  adega_parede: cor => noChao([M(ret(24, 2, 72, 108, 2), cor, 'adega'), V(ret(30, 10, 60, 94, 1)),
    ...Array.from({ length: 7 }, (_, k) => P([0, 1, 2, 3].map(i => elipse(38 + i * 14, 18 + k * 12.5, 5, 3.2)).join(''), k % 3 === 2 ? '#e8d9a8' : '#5b2333')),
    ({ tipo: 'luz', d: ret(52, 4, 16, 4, 1), cor: '#9fe0ff' } as Peca)], 38),
  /** 12.8.1 · a luminária de pé: a base redonda, a haste, a cúpula de tecido e o facho na cor da luz escolhida. */
  _abajur: cor => noChao([({ tipo: 'luz', d: circulo(60, 26, 30), cor: cor || '#ffd59a' } as Peca), M(elipse(60, 107, 14, 3.4), '#3a3530', 'base'), Mt('M58.6 106V36h2.8v70z', '#5a5550'),
    M('M44 38L50 12H70L76 38Z', '#efe2c4', 'cupula'), P(ret(44, 36, 32, 3, 1), '#d8c8a4'), P(elipse(60, 40, 9, 2.2), cor || '#ffe6a8')], 16),
  /** A barraca guardada (dentro de casa, a barraca não fica armada): a bolsa enrolada e a mochila. */
  camping_guardado: cor => noChao([M(ret(14, 70, 54, 40, 14), cor || '#4f7a3a', 'bolsa'), L('M24 72V108M58 72V108', 1, escurecer(cor || '#4f7a3a', 0.3)), M(ret(66, 52, 40, 58, 8), '#c9893f', 'mochila'), P(ret(72, 64, 28, 14, 3), escurecer('#c9893f', 0.15))], 48)
};
function cantos3(x: number, y: number, w: number, h: number): string { return `M${x} ${y + h}V${y + 10}Q${x} ${y} ${x + w / 2} ${y}Q${x + w} ${y} ${x + w} ${y + 10}V${y + h}Z`; }
