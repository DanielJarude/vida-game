/**
 * VIDA 12.5 — AS FACHADAS DAS LOJAS, cada uma com a sua cara. Antes, a loja de roupas, a sapataria, a ótica, a de
 * acessórios e TODAS as lojas de departamento (C&A, El Corte Inglés, Coin, Rinascente, Galeries Lafayette, Renner...)
 * usavam a mesma vitrine "ótica & moda"; a de móveis era a de eletrodomésticos. Agora:
 *
 *  - por SEGMENTO, a arquitetura diz o que se vende antes da placa: a moda tem manequins e arara; a sapataria, a escada
 *    de sapatos; a ótica, a parede de armações e o espelho; a de acessórios, o cabideiro de chapéus; a de móveis, a sala
 *    montada atrás do vidro; a rua das grifes, a boutique preta com uma peça só;
 *  - as LOJAS DE DEPARTAMENTO IMPORTANTES têm o prédio de cada uma, reinterpretado no traço do VIDA (nunca foto): a
 *    caixa de travertino com frisos verticais e o triângulo verde do El Corte Inglés; o prédio haussmanniano com
 *    cúpula, sacadas de ferro e letras douradas das Galeries Lafayette; a pedra cinza com arcadas e o nome em minúsculas
 *    da Rinascente; o palazzo ocre de persianas verdes com a loja de vidro embaixo da Coin; a caixa de vidro de shopping
 *    com a placa quadrada da C&A;
 *  - as OUTRAS grandes lojas saem de um modelo (`departamento`) com variação coerente: andares, material, janelas,
 *    marquise, placa, cor da marca e o que a vitrine mostra (moda, tecnologia, casa) conforme o que a loja vende.
 *
 * Mesmo quadro das outras fachadas (480 × 120, a loja no meio, a rua dos lados, chão em 112). A porta fica de um lado
 * (`PORTA`): a vitrine de Compras põe os objetos de verdade na frente do vidro, nunca da porta.
 */
import { cantos, circulo, elipse, escurecer, ret, suave, type Amostra, type Peca } from './nucleo';

const CHAO = 112;
const ESCURO = '#2b2826', BRANCO = '#f2efe9', METAL = '#b8b4ad', VIDRO = '#efe7d4';

export type FachadaDeLoja =
  | 'moda' | 'sapataria' | 'otica' | 'acessorios' | 'moveis' | 'grifes'
  | 'dep_cea' | 'dep_corteingles' | 'dep_coin' | 'dep_rinascente' | 'dep_lafayette'
  | 'dep_renner' | 'dep_magalu' | 'dep_casasbahia' | 'dep_falabella' | 'dep_liverpool' | 'dep_macys' | 'dep_target' | 'dep_bestbuy'
  | 'dep_mediamarkt' | 'dep_marks' | 'dep_johnlewis' | 'dep_isetan' | 'dep_yodobashi' | 'dep_myer' | 'dep_armazens';

/* ------------------------------------------------------------------ peças de rua e de vitrine */

/** A rua dos lados (vizinhos mais baixos que a grande loja) e a calçada. */
function rua(cores: [string, string] = ['#cbbfae', '#b9b0a2']): Peca[] {
  return [
    { tipo: 'massa', d: ret(-4, 34, 132, 82, 0), cor: cores[0], semVolume: true, marca: 'vizinho' },
    { tipo: 'massa', d: ret(20, 52, 30, 24, 1) + ret(72, 52, 30, 24, 1), cor: '#9aa7ad', semVolume: true, fino: true },
    { tipo: 'massa', d: ret(352, 28, 132, 88, 0), cor: cores[1], semVolume: true, marca: 'vizinho' },
    { tipo: 'massa', d: ret(376, 46, 30, 26, 1) + ret(428, 46, 30, 26, 1), cor: '#9aa7ad', semVolume: true, fino: true },
    { tipo: 'massa', d: ret(-4, CHAO, 488, 12, 0), cor: '#a49c90', semVolume: true, marca: 'calcada' },
    { tipo: 'linha', d: `M-4 ${CHAO}H484`, larg: 1 }
  ];
}

const texto = (x: number, y: number, t: string, tam: number, cor: string, extra: { fonte?: 'serif' | 'sans'; peso?: number; espaco?: number } = {}): Peca =>
  ({ tipo: 'texto', x, y, texto: t, tam, cor, marca: 'nome', ...extra });

/** Um manequim de vitrine (cabeça lisa, a roupa, a base de metal). `roupa`: vestido, terno, casual, casaco. */
function manequim(x: number, y: number, cor: string, roupa: 'vestido' | 'terno' | 'casual' | 'casaco' = 'casual', escala = 1): Peca[] {
  const s = (v: number) => v * escala;
  const corpo: Peca[] = roupa === 'vestido'
    ? [{ tipo: 'massa', d: suave([[x - s(5), y - s(26)], [x + s(5), y - s(26)], [x + s(6), y - s(18)], [x + s(10), y], [x - s(10), y], [x - s(6), y - s(18)]], true, 0.3), cor, marca: 'roupa' }]
    : roupa === 'terno'
      ? [{ tipo: 'massa', d: ret(x - s(7), y - s(27), s(14), s(18), s(2)), cor, marca: 'roupa' }, { tipo: 'massa', d: `M${x} ${y - s(27)}l${s(-3)} ${s(7)}l${s(3)} ${s(8)}l${s(3)} ${s(-8)}z`, cor: BRANCO, semVolume: true }, { tipo: 'massa', d: ret(x - s(6), y - s(9), s(5), s(9), s(1)) + ret(x + s(1), y - s(9), s(5), s(9), s(1)), cor: escurecer(cor, 0.25), semVolume: true }]
      : roupa === 'casaco'
        ? [{ tipo: 'massa', d: suave([[x - s(7), y - s(27)], [x + s(7), y - s(27)], [x + s(9), y - s(4)], [x - s(9), y - s(4)]], true, 0.25), cor, marca: 'roupa' }, { tipo: 'linha', d: `M${x} ${y - s(26)}V${y - s(5)}`, larg: 0.6, cor: escurecer(cor, 0.35) }]
        : [{ tipo: 'massa', d: ret(x - s(6.5), y - s(27), s(13), s(13), s(2.5)), cor, marca: 'roupa' }, { tipo: 'massa', d: ret(x - s(6), y - s(14), s(5.4), s(14), s(1)) + ret(x + s(0.6), y - s(14), s(5.4), s(14), s(1)), cor: '#3d5a80', semVolume: true }];
  return [
    { tipo: 'massa', d: circulo(x, y - s(31), s(3.6)), cor: '#e8dccb', marca: 'manequim' },
    { tipo: 'massa', d: ret(x - s(1), y - s(28), s(2), s(2), 0.3), cor: '#e8dccb', semVolume: true },
    ...corpo,
    { tipo: 'metal', d: ret(x - s(0.7), y, s(1.4), s(3), 0.3) + ret(x - s(5), y + s(3), s(10), s(1.4), 0.6), cor: '#8d8a85' }
  ];
}

/** A arara com cabides e roupas penduradas. */
function arara(x0: number, x1: number, y: number, cores: string[]): Peca[] {
  const n = Math.max(3, Math.floor((x1 - x0) / 5));
  return [
    { tipo: 'metal', d: ret(x0, y, x1 - x0, 1.4, 0.5) + ret(x0, y, 1.2, CHAO - 2 - y, 0.3) + ret(x1 - 1.2, y, 1.2, CHAO - 2 - y, 0.3), cor: '#8d8a85', marca: 'arara' },
    ...Array.from({ length: n }, (_, k): Peca => { const x = x0 + 3 + k * ((x1 - x0 - 6) / (n - 1)); return { tipo: 'massa', d: suave([[x - 2.2, y + 2], [x + 2.2, y + 2], [x + 2.6, y + 16 + (k % 3) * 2], [x - 2.6, y + 16 + (k % 3) * 2]], true, 0.2), cor: cores[k % cores.length], semVolume: true }; })
  ];
}

/** A TV, o notebook, o celular — o brilho azul das telas. */
const tela = (x: number, y: number, w: number, h: number): Peca[] => [
  { tipo: 'massa', d: ret(x, y, w, h, 1.2), cor: ESCURO, marca: 'tela' }, { tipo: 'vidro', d: ret(x + 2, y + 2, w - 4, h - 4, 0.8) },
  { tipo: 'massa', d: ret(x + w / 2 - 1.5, y + h, 3, 4, 0.3) + ret(x + w / 2 - 6, y + h + 4, 12, 1.4, 0.5), cor: '#55595f', semVolume: true }
];
const geladeira = (x: number, y: number): Peca[] => [{ tipo: 'massa', d: ret(x, y, 18, CHAO - 2 - y, 1.5), cor: '#e6e3de', marca: 'geladeira' }, { tipo: 'linha', d: `M${x} ${y + 16}h18M${x + 15} ${y + 5}v6M${x + 15} ${y + 20}v8`, larg: 0.8 }];
/** O sofá, a luminária, o tapete, a planta: a sala montada. */
const sofa = (x: number, w: number, cor: string): Peca[] => [
  { tipo: 'massa', d: ret(x, CHAO - 22, w, 12, 3), cor: escurecer(cor, 0.08), marca: 'sofa' },
  { tipo: 'massa', d: ret(x - 3, CHAO - 16, w + 6, 10, 3), cor, semVolume: false },
  { tipo: 'massa', d: ret(x - 3, CHAO - 18, 6, 12, 2.5) + ret(x + w - 3, CHAO - 18, 6, 12, 2.5), cor: escurecer(cor, 0.15), semVolume: true },
  { tipo: 'massa', d: ret(x, CHAO - 6, 2, 4, 0.5) + ret(x + w - 2, CHAO - 6, 2, 4, 0.5), cor: '#5a3a24', semVolume: true }
];
const luminaria = (x: number, y: number): Peca[] => [{ tipo: 'metal', d: ret(x - 0.6, y, 1.2, CHAO - 2 - y, 0.3) + ret(x - 4, CHAO - 3, 8, 1.4, 0.5), cor: '#6b6660' }, { tipo: 'massa', d: `M${x - 6} ${y}h12l-3 -8h-6z`, cor: '#f1dfb2', marca: 'luminaria' }, { tipo: 'luz', d: `M${x - 6} ${y}h12l6 22h-24z`, cor: '#fff3c4' }];
const planta = (x: number, alto = 18): Peca[] => [{ tipo: 'massa', d: `M${x - 4} ${CHAO - 2}l1 -7h6l1 7z`, cor: '#b5573a', semVolume: true }, { tipo: 'massa', d: suave([[x, CHAO - 9], [x - 7, CHAO - 9 - alto * 0.5], [x - 2, CHAO - 9 - alto], [x + 3, CHAO - 9 - alto * 0.8], [x + 7, CHAO - 9 - alto * 0.4]], true, 0.4), cor: '#4f7a4b', marca: 'planta' }];
const quadroNaParede = (x: number, y: number, w: number, h: number, a: string, b: string): Peca[] => [{ tipo: 'massa', d: ret(x, y, w, h, 0.4), cor: '#f4f1ea', marca: 'quadro' }, { tipo: 'massa', d: `M${x + 1.5} ${y + h - 1.5}L${x + w * 0.4} ${y + h * 0.4}L${x + w * 0.7} ${y + h * 0.7}L${x + w - 1.5} ${y + h * 0.3}V${y + h - 1.5}Z`, cor: a, semVolume: true }, { tipo: 'massa', d: circulo(x + w * 0.75, y + h * 0.3, 1.6), cor: b, semVolume: true }];
/** A bolsa e os sapatos (num degrau da vitrine). */
const bolsa = (x: number, y: number, cor: string): Peca[] => [{ tipo: 'linha', d: `M${x - 4} ${y}q4 -7 8 0`, larg: 1, cor: escurecer(cor, 0.3) }, { tipo: 'massa', d: ret(x - 6, y, 12, 9, 2), cor, marca: 'bolsa' }];
const sapato = (x: number, y: number, cor: string, salto = false): Peca[] => salto
  ? [{ tipo: 'massa', d: `M${x - 6} ${y}q2 -5 6 -5l5 -3l1 3v5z`, cor, marca: 'sapato' }, { tipo: 'massa', d: ret(x + 4.6, y - 1, 1.4, 4, 0.3), cor: escurecer(cor, 0.3), semVolume: true }]
  : [{ tipo: 'massa', d: suave([[x - 7, y], [x - 6, y - 4], [x - 1, y - 5], [x + 2, y - 3], [x + 7, y - 2], [x + 7, y]], true, 0.3), cor, marca: 'sapato' }, { tipo: 'linha', d: `M${x - 7} ${y}h14`, larg: 1, cor: BRANCO }];
const oculos = (x: number, y: number, cor: string, escuro = false): Peca[] => [
  ...(escuro ? [{ tipo: 'massa' as const, d: elipse(x - 3.2, y, 2.6, 2) + elipse(x + 3.2, y, 2.6, 2), cor: '#3b4652', semVolume: true }] : []),
  { tipo: 'linha', d: `${elipse(x - 3.2, y, 2.6, 2)}${elipse(x + 3.2, y, 2.6, 2)}M${x - 0.6} ${y}h1.2`, larg: 0.8, cor, marca: 'oculos' }
];
const chapeu = (x: number, y: number, cor: string, tipo: 'aba' | 'bone' | 'gorro'): Peca[] => tipo === 'aba'
  ? [{ tipo: 'massa', d: elipse(x, y, 9, 2) + ret(x - 5, y - 7, 10, 7, 2.5), cor, marca: 'chapeu' }, { tipo: 'massa', d: ret(x - 5, y - 2.4, 10, 1.4, 0.3), cor: escurecer(cor, 0.35), semVolume: true }]
  : tipo === 'bone' ? [{ tipo: 'massa', d: `M${x - 6} ${y}a6 6 0 0 1 12 0z`, cor, marca: 'chapeu' }, { tipo: 'massa', d: `M${x + 4} ${y}h8l-1 1.6h-7z`, cor: escurecer(cor, 0.25), semVolume: true }]
    : [{ tipo: 'massa', d: `M${x - 5.5} ${y}a5.5 6.5 0 0 1 11 0z`, cor, marca: 'chapeu' }, { tipo: 'massa', d: circulo(x, y - 7, 1.8), cor: BRANCO, semVolume: true }, { tipo: 'massa', d: ret(x - 6, y - 1.6, 12, 2.4, 0.8), cor: escurecer(cor, 0.2), semVolume: true }];

/** Uma vitrine (o vidro iluminado, o rodapé, o reflexo do alto). */
const vidroDeVitrine = (x0: number, x1: number, y0: number, luz = VIDRO, rodape = '#3a3530'): Peca[] => [
  { tipo: 'massa', d: ret(x0, y0, x1 - x0, CHAO - 4 - y0, 0.8), cor: luz, marca: 'vitrine' },
  { tipo: 'massa', d: ret(x0, y0, x1 - x0, 5, 0), cor: '#000000', opacidade: 0.1, semVolume: true },
  { tipo: 'massa', d: ret(x0 - 1, CHAO - 4, x1 - x0 + 2, 4, 0.3), cor: rodape, semVolume: true },
  { tipo: 'massa', d: `M${x0 + 4} ${y0 + 3}l10 0l-14 22v-10z`, cor: '#ffffff', opacidade: 0.28, semVolume: true }
];
/** A porta (de vidro, com o puxador) — a marca 'porta' é a que a vitrine de Compras evita. */
const porta = (x: number, y: number, w: number, moldura: string, dupla = false): Peca[] => [
  { tipo: 'massa', d: ret(x, y, w, CHAO - y, 0.8), cor: moldura, marca: 'porta' },
  ...(dupla
    ? [{ tipo: 'vidro' as const, d: ret(x + 2, y + 2, w / 2 - 3, CHAO - y - 4, 0.6) + ret(x + w / 2 + 1, y + 2, w / 2 - 3, CHAO - y - 4, 0.6), claro: true }, { tipo: 'metal' as const, d: ret(x + w / 2 - 3, y + (CHAO - y) * 0.45, 1.4, 8, 0.5) + ret(x + w / 2 + 1.6, y + (CHAO - y) * 0.45, 1.4, 8, 0.5), cor: METAL }]
    : [{ tipo: 'vidro' as const, d: ret(x + 3, y + 3, w - 6, CHAO - y - 6, 0.6), claro: true }, { tipo: 'metal' as const, d: ret(x + w - 6, y + (CHAO - y) * 0.45, 1.6, 9, 0.5), cor: METAL }])
];
/** O toldo: reto (de lona), listrado, ou em bombê (o arredondado das casas antigas). */
function toldo(x0: number, x1: number, y: number, cor: string, estilo: 'reto' | 'listrado' | 'bombe' = 'reto', listra = BRANCO): Peca[] {
  if (estilo === 'bombe') return [{ tipo: 'massa', d: `M${x0} ${y + 9}C${x0} ${y - 1} ${x1} ${y - 1} ${x1} ${y + 9}Z`, cor, marca: 'toldo' }, { tipo: 'linha', d: `M${x0} ${y + 9}H${x1}`, larg: 0.8, cor: escurecer(cor, 0.3) }];
  const n = Math.max(4, Math.round((x1 - x0) / 10));
  return [
    { tipo: 'massa', d: cantos([[x0 + 3, y, 0.6], [x1 - 3, y, 0.6], [x1 + 2, y + 8, 0.6], [x0 - 2, y + 8, 0.6]]), cor, marca: 'toldo' },
    ...(estilo === 'listrado' ? [{ tipo: 'massa' as const, d: Array.from({ length: n }, (_, k) => { const a = x0 + 3 + (k * (x1 - x0 - 6)) / n, b = x0 - 2 + (k * (x1 - x0 + 4)) / n, w = (x1 - x0) / n / 2; return `M${a.toFixed(1)} ${y}h${w.toFixed(1)}L${(b + w * 1.1).toFixed(1)} ${y + 8}h${(-w * 1.1).toFixed(1)}z`; }).join(''), cor: listra, semVolume: true }] : []),
    { tipo: 'linha', d: Array.from({ length: n }, (_, k) => { const x = x0 - 2 + (k * (x1 - x0 + 4)) / n, w = (x1 - x0 + 4) / n; return `M${x.toFixed(1)} ${y + 8}q${(w / 2).toFixed(1)} 4 ${w.toFixed(1)} 0`; }).join(''), larg: 0.7, fino: true }
  ];
}
/** Uma grade de janelas (retas, em arco, com persianas ou com sacada de ferro). */
function janelas(x0: number, x1: number, y0: number, y1: number, cols: number, rows: number, o: { cor?: string; moldura?: string; arco?: boolean; persiana?: string; sacada?: boolean; luz?: boolean } = {}): Peca[] {
  const out: Peca[] = [];
  const cw = (x1 - x0) / cols, rh = (y1 - y0) / rows;
  const w = cw * 0.52, h = rh * 0.66;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * cw + (cw - w) / 2, y = y0 + r * rh + (rh - h) / 2;
    const d = o.arco ? `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z` : ret(x, y, w, h, 0.4);
    if (o.moldura) out.push({ tipo: 'massa', d: o.arco ? `M${x - 1} ${y + h + 1}V${y + w / 2}A${w / 2 + 1} ${w / 2 + 1} 0 0 1 ${x + w + 1} ${y + w / 2}V${y + h + 1}Z` : ret(x - 1, y - 1, w + 2, h + 2, 0.4), cor: o.moldura, semVolume: true });
    out.push(o.luz && (r + c) % 3 === 0 ? { tipo: 'massa', d, cor: '#f3e2b4', semVolume: true, marca: 'janela' } : { tipo: 'massa', d, cor: o.cor ?? '#7f929c', semVolume: true, marca: 'janela' });
    if (o.persiana) out.push({ tipo: 'massa', d: ret(x - w * 0.42, y, w * 0.38, h, 0.3) + ret(x + w * 1.04, y, w * 0.38, h, 0.3), cor: o.persiana, semVolume: true, marca: 'persiana' });
    if (o.sacada) out.push({ tipo: 'linha', d: `M${x - 2} ${y + h * 0.72}h${w + 4}M${x - 2} ${y + h}h${w + 4}${Array.from({ length: 5 }, (_, k) => `M${(x - 1 + (k * (w + 2)) / 4).toFixed(1)} ${(y + h * 0.72).toFixed(1)}v${(h * 0.28).toFixed(1)}`).join('')}`, larg: 0.7, cor: '#2b2826', marca: 'sacada' });
  }
  return out;
}

/* ------------------------------------------------------------------ as lojas especializadas, por segmento */

const PREDIO_X0 = 140, PREDIO_X1 = 340;

/** O prédio de rua de uma especializada (sem a vitrine, que cada uma desenha do seu jeito). */
function predioDeRua(parede: string, topo: number, placa: { cor: string; texto: string; tinta: string; fonte?: 'serif' | 'sans'; espaco?: number }, x0 = PREDIO_X0, x1 = PREDIO_X1): Peca[] {
  return [
    ...rua(),
    { tipo: 'massa', d: ret(x0, topo, x1 - x0, CHAO - topo, 1), cor: parede, marca: 'predio' },
    { tipo: 'massa', d: ret(x0 + 18, topo + 6, x1 - x0 - 36, 20, 1.5), cor: placa.cor, marca: 'placa' },
    // A letra encolhe para caber na placa ("MÓVEIS & DECORAÇÃO" não pode passar da borda).
    texto((x0 + x1) / 2, topo + 20.5, placa.texto, Math.min(11, (x1 - x0 - 46) / (placa.texto.length * 0.95)), placa.tinta, { fonte: placa.fonte, espaco: placa.espaco })
  ];
}

const ESPECIALIZADAS: Record<'moda' | 'sapataria' | 'otica' | 'acessorios' | 'moveis' | 'grifes', () => Amostra> = {
  moda: () => ({
    // A boutique de rua: tijolo pintado, toldo listrado, dois manequins e a arara cheia; a porta à direita.
    vb: [480, 120],
    pecas: [
      ...predioDeRua('#c9b8a6', 8, { cor: '#3b2f3a', texto: 'MODA', tinta: '#f1e4d6', espaco: 4 }),
      { tipo: 'linha', d: Array.from({ length: 16 }, (_, k) => `M140 ${14 + 6 * k}H340`).join(''), larg: 0.4, cor: '#b3a08d', so3: true },
      ...toldo(150, 292, 36, '#3b2f3a', 'listrado', '#e9d8c8'),
      ...vidroDeVitrine(152, 288, 46, '#f3ebe0'),
      ...manequim(172, 104, '#b5573a', 'vestido'), ...manequim(198, 104, '#2f4b5f', 'casaco'),
      ...arara(216, 282, 64, ['#e0b12d', '#5d7a8a', '#b5573a', '#efe7d4', '#3b2f3a', '#7a8f5a']),
      ...porta(296, 48, 34, '#3b2f3a')
    ]
  }),
  sapataria: () => ({
    // Os sapatos em degraus iluminados (tênis embaixo, sapato e salto em cima), a placa com o cadarço; a porta à direita.
    vb: [480, 120],
    pecas: [
      ...predioDeRua('#e6dccb', 10, { cor: '#8a3b2a', texto: 'CALÇADOS', tinta: BRANCO }),
      ...vidroDeVitrine(152, 288, 44, '#f6efe2'),
      { tipo: 'massa', d: ret(160, 98, 120, 10, 0.5) + ret(172, 82, 96, 6, 0.5) + ret(184, 66, 72, 6, 0.5), cor: '#d9c7a8', marca: 'degraus' },
      ...[0, 1, 2, 3, 4].flatMap(k => sapato(170 + k * 24, 98, ['#f4f4f2', '#2f6db3', '#c8372d', '#2b2f36', '#e0b12d'][k])),
      ...[0, 1, 2, 3].flatMap(k => sapato(184 + k * 23, 82, ['#5a3a24', '#2b2826', '#7a4a24', '#3d4a5a'][k])),
      ...[0, 1, 2].flatMap(k => sapato(198 + k * 22, 66, ['#b8302a', '#2b2826', '#d36a8a'][k], true)),
      ...lampadas([186, 220, 254], 46),
      ...porta(296, 48, 34, '#8a3b2a')
    ]
  }),
  otica: () => ({
    // O branco limpo de consultório, a armação grande em cima da porta, a parede de óculos e o espelho; a porta à direita.
    vb: [480, 120],
    pecas: [
      ...predioDeRua('#f1efea', 8, { cor: '#1f4e5f', texto: 'ÓTICA', tinta: BRANCO, espaco: 3 }),
      { tipo: 'linha', d: `${elipse(313, 36, 7, 5)}${elipse(331, 36, 7, 5)}M320 36h4`, larg: 2, cor: '#1f4e5f', marca: 'oculos-placa' },
      ...vidroDeVitrine(152, 288, 46, '#f7f9f8'),
      { tipo: 'massa', d: ret(160, 54, 84, 46, 1), cor: '#e3e7e6', marca: 'parede-oculos' },
      { tipo: 'linha', d: [62, 74, 86, 98].map(y => `M162 ${y}H242`).join(''), larg: 0.6, cor: '#b9c0bf' },
      ...[0, 1, 2, 3].flatMap(r => [0, 1, 2, 3, 4].flatMap(c => oculos(170 + c * 16, 59 + r * 12, ['#2b2826', '#8a5a32', '#1f4e5f', '#b8302a', '#c9a54a'][(r + c) % 5], (r + c) % 4 === 1))),
      { tipo: 'massa', d: ret(252, 58, 14, 40, 6), cor: '#cfd8da', marca: 'espelho' }, { tipo: 'massa', d: ret(254, 60, 10, 36, 5), cor: '#e9f1f2', semVolume: true },
      { tipo: 'massa', d: ret(270, 86, 16, 22, 1.5), cor: '#1f4e5f', marca: 'balcao' },
      ...porta(296, 48, 34, '#1f4e5f')
    ]
  }),
  acessorios: () => ({
    // A loja pequena e colorida: o cabideiro de chapéus, a parede de bonés, o expositor de pulseiras; a porta à esquerda.
    vb: [480, 120],
    pecas: [
      ...predioDeRua('#e2a54a', 12, { cor: '#2c4f5a', texto: 'ACESSÓRIOS', tinta: '#f5e6c8' }),
      ...toldo(152, 334, 38, '#2c4f5a', 'reto'),
      ...porta(152, 50, 34, '#2c4f5a'),
      ...vidroDeVitrine(196, 330, 48, '#fbf2e2'),
      { tipo: 'metal', d: ret(214, 60, 1.6, 48, 0.4) + ret(206, 106, 18, 1.6, 0.5), cor: '#6b6660', marca: 'cabideiro' },
      ...chapeu(214, 62, '#c9a06a', 'aba'), ...chapeu(208, 76, '#2b2826', 'aba'), ...chapeu(220, 88, '#8a3b2a', 'aba'),
      { tipo: 'massa', d: ret(234, 56, 52, 30, 1), cor: '#f4e6cc', marca: 'parede-bones' },
      ...[0, 1, 2].flatMap(c => [0, 1].flatMap(r => chapeu(243 + c * 17, 68 + r * 13, ['#c8372d', '#2f6db3', '#2b2826', '#3f9a52', '#e0b12d', '#f4f4f2'][r * 3 + c], r ? 'gorro' : 'bone'))),
      { tipo: 'massa', d: ret(292, 92, 32, 16, 1.5), cor: '#2c4f5a', marca: 'balcao' }, { tipo: 'vidro', d: ret(292, 84, 32, 8, 1), claro: true },
      { tipo: 'linha', d: `${circulo(300, 89, 2.4)}${circulo(308, 89, 2.4)}${circulo(316, 89, 2.4)}`, larg: 0.9, cor: '#c9a54a', marca: 'pulseiras' }
    ]
  }),
  moveis: () => ({
    // A sala montada atrás do vidro (o sofá, a luminária de pé, o tapete, o quadro e a planta) num prédio de madeira.
    vb: [480, 120],
    pecas: [
      ...predioDeRua('#8a6a4a', 6, { cor: '#efe6d6', texto: 'MÓVEIS & DECORAÇÃO', tinta: '#5a3a24' }),
      { tipo: 'linha', d: Array.from({ length: 24 }, (_, k) => `M${148 + k * 8} 6V40`).join(''), larg: 0.5, cor: '#715638', so3: true },
      ...vidroDeVitrine(148, 290, 40, '#f4ead8'),
      { tipo: 'massa', d: ret(150, 40, 138, 66, 0), cor: '#e8dcc6', semVolume: true, classe: 'fachada__interior' },
      { tipo: 'massa', d: elipse(214, 104, 48, 4), cor: '#b5573a', opacidade: 0.55, semVolume: true, marca: 'tapete' },
      ...quadroNaParede(196, 50, 30, 20, '#3f6e8a', '#e0b12d'),
      ...sofa(184, 56, '#5d7a6a'),
      ...luminaria(166, 62),
      ...planta(266, 26),
      { tipo: 'massa', d: ret(244, 94, 14, 8, 1.5), cor: '#5a3a24', marca: 'mesinha' },
      ...porta(298, 46, 32, '#5a3a24')
    ]
  }),
  grifes: () => ({
    // A rua das grifes: a boutique preta e alta, letras finas douradas, a vitrine com UMA peça sob o foco; a porta com
    // porteiro à direita (o tapete, os vasos de topiaria).
    vb: [480, 120],
    pecas: [
      ...rua(['#d8cfc2', '#c4bbaf']),
      { tipo: 'massa', d: ret(144, 2, 192, CHAO - 2, 0.5), cor: '#171717', marca: 'predio' },
      { tipo: 'linha', d: 'M144 30H336', larg: 0.6, cor: '#c9a54a' },
      texto(240, 22, 'MAISON', 10, '#d8b65a', { fonte: 'serif', espaco: 6, peso: 400 }),
      ...vidroDeVitrine(154, 280, 40, '#2a2622', '#0f0f0f'),
      { tipo: 'luz', d: 'M206 42h20l14 64h-48z', cor: '#fff3c4' },
      { tipo: 'massa', d: ret(204, 100, 26, 6, 0.6), cor: '#e8e2d6', marca: 'pedestal' },
      ...bolsa(217, 91, '#c9a06a'),
      ...manequim(176, 104, '#efe7d4', 'vestido', 0.95), ...manequim(258, 104, '#1f1f1f', 'terno', 0.95),
      ...porta(290, 40, 36, '#0f0f0f'),
      { tipo: 'massa', d: ret(286, CHAO - 1.5, 44, 2, 0.3), cor: '#7a1f2a', semVolume: true, marca: 'tapete' },
      ...[284, 332].flatMap(x => [{ tipo: 'massa' as const, d: ret(x - 4, CHAO - 9, 8, 7, 1), cor: '#2b2826', semVolume: true }, { tipo: 'massa' as const, d: circulo(x, CHAO - 14, 5), cor: '#3f6a3f', marca: 'topiaria' }])
    ]
  })
};

function lampadas(xs: number[], y: number): Peca[] {
  return xs.flatMap((x): Peca[] => [{ tipo: 'linha', d: `M${x} ${y - 4}v3`, larg: 0.5, cor: '#5a5650' }, { tipo: 'luz', d: `M${x - 3} ${y}h6l5 18h-16z`, cor: '#fff3c4' }]);
}

/* ------------------------------------------------------------------ as grandes lojas que têm prédio próprio */

/** O que uma grande loja põe nas vitrines, conforme o que vende. */
type Mostra = 'moda' | 'tecnologia' | 'casa' | 'luxo' | 'esporte';
function mostrar(o: Mostra, x0: number, x1: number, y0: number, cores: string[]): Peca[] {
  const m = (x0 + x1) / 2, w = x1 - x0;
  switch (o) {
    case 'moda': return w > 40 ? [...manequim(x0 + w * 0.3, CHAO - 6, cores[0], 'vestido', 0.9), ...manequim(x0 + w * 0.7, CHAO - 6, cores[1] ?? cores[0], 'terno', 0.9)] : manequim(m, CHAO - 6, cores[0], 'casual', 0.9);
    case 'luxo': return [{ tipo: 'luz', d: `M${m - 6} ${y0 + 1}h12l10 ${CHAO - y0 - 6}h-32z`, cor: '#fff3c4' }, { tipo: 'massa', d: ret(m - 8, CHAO - 12, 16, 6, 0.6), cor: '#e8e2d6', marca: 'pedestal' }, ...bolsa(m, CHAO - 21, cores[0])];
    case 'tecnologia': return [...tela(x0 + 3, y0 + 6, w - 6, Math.min(22, (CHAO - y0) * 0.45)), { tipo: 'massa', d: ret(x0 + 4, CHAO - 13, w - 8, 8, 1), cor: '#c9ccd0', marca: 'balcao' }];
    case 'casa': return w > 40 ? [...sofa(x0 + 8, w - 26, cores[0]), ...luminaria(x1 - 8, CHAO - 34)] : [...geladeira(m - 9, CHAO - 40)];
    case 'esporte': return [{ tipo: 'massa', d: circulo(m - 6, CHAO - 13, 8), cor: BRANCO, marca: 'bola' }, { tipo: 'massa', d: `M${m - 6} ${CHAO - 17}l3.4 2-1.4 4h-4l-1.4-4z`, cor: ESCURO, semVolume: true }, ...sapato(m + 10, CHAO - 6, cores[0])];
  }
}

const PROPRIAS: Record<'dep_cea' | 'dep_corteingles' | 'dep_coin' | 'dep_rinascente' | 'dep_lafayette', () => Amostra> = {
  dep_cea: () => ({
    // A caixa de shopping: painel branco liso, faixa de vidro no andar de cima, a placa QUADRADA da marca (as letras
    // brancas sobre o bloco de cor), vitrines de chão a teto com manequins; a entrada larga à direita.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(128, 10, 224, CHAO - 10, 0.5), cor: '#ecebe7', marca: 'predio' },
      { tipo: 'massa', d: ret(128, 30, 224, 18, 0), cor: '#9fb2bb', semVolume: true, marca: 'faixa-vidro' },
      { tipo: 'linha', d: Array.from({ length: 13 }, (_, k) => `M${128 + 16 * (k + 1)} 30v18`).join(''), larg: 0.6, cor: '#6f8590' },
      { tipo: 'massa', d: ret(146, 12, 32, 32, 1), cor: '#1d4f9c', marca: 'placa' },
      { tipo: 'massa', d: `M146 44V30q16 -8 32 4V44Z`, cor: '#d4322c', semVolume: true },
      texto(162, 32, 'C&A', 11, BRANCO, { espaco: 0.5 }),
      { tipo: 'massa', d: ret(128, 50, 224, 3, 0), cor: '#cfcdc7', semVolume: true },
      ...vidroDeVitrine(150, 292, 56, '#f5f3ee', '#cfcdc7'),
      { tipo: 'linha', d: 'M198 56V108M246 56V108', larg: 1.2, cor: '#cfcdc7' },
      ...manequim(166, 104, '#d4322c', 'casual', 0.9), ...manequim(184, 104, '#efe7d4', 'vestido', 0.9),
      ...arara(204, 240, 70, ['#1d4f9c', '#f4f4f2', '#d4322c', '#2b2f36', '#e0b12d']),
      ...manequim(262, 104, '#2b2f36', 'casaco', 0.9), ...bolsa(280, 98, '#c9a06a'),
      ...porta(300, 54, 44, '#8f9aa0', true)
    ]
  }),
  dep_corteingles: () => ({
    // O bloco de travertino quase cego, com frisos verticais finos, o triângulo verde e o nome em branco sobre o verde;
    // embaixo, a marquise reta e as vitrines variadas (moda, casa, tecnologia); a entrada à esquerda.
    vb: [480, 120],
    pecas: [
      ...rua(['#c9c0b2', '#bdb5a8']),
      { tipo: 'massa', d: ret(122, 2, 236, CHAO - 2, 0.3), cor: '#e3d7c1', marca: 'predio' },
      { tipo: 'linha', d: Array.from({ length: 29 }, (_, k) => `M${126 + k * 8} 4V56`).join(''), larg: 0.55, cor: '#cdbfa6', marca: 'frisos' },
      { tipo: 'massa', d: ret(122, 2, 236, 3, 0), cor: '#cdbfa6', semVolume: true },
      { tipo: 'massa', d: ret(200, 14, 120, 20, 0.5), cor: '#1f7a3e', marca: 'placa' },
      { tipo: 'massa', d: 'M182 34l12-20 12 20z', cor: '#1f7a3e', marca: 'simbolo' }, { tipo: 'massa', d: 'M187.5 31l6.5-11 6.5 11z', cor: BRANCO, semVolume: true },
      texto(260, 28, 'El Corte Inglés', 10.5, BRANCO, { fonte: 'serif', espaco: 0.4, peso: 600 }),
      { tipo: 'massa', d: ret(118, 56, 244, 5, 0.5), cor: '#5f6266', marca: 'marquise' },
      ...porta(132, 64, 40, '#3a3d40', true),
      ...vidroDeVitrine(178, 220, 64), ...mostrar('moda', 178, 220, 64, ['#1f7a3e', '#2b2826']),
      ...vidroDeVitrine(226, 268, 64), ...mostrar('casa', 226, 268, 64, ['#b5573a']),
      ...vidroDeVitrine(274, 316, 64), ...mostrar('tecnologia', 274, 316, 64, []),
      ...vidroDeVitrine(322, 352, 64), ...mostrar('luxo', 322, 352, 64, ['#7a1f2a'])
    ]
  }),
  dep_coin: () => ({
    // O palazzo ocre de três andares, persianas verdes e cornija; a loja moderna embaixo (a faixa preta com o nome em
    // minúsculas e o fio vermelho), vitrines de moda e casa; a porta à direita.
    vb: [480, 120],
    pecas: [
      ...rua(['#d9c8a8', '#c7b493']),
      { tipo: 'massa', d: ret(136, 4, 208, CHAO - 4, 0.3), cor: '#d9a35f', marca: 'predio' },
      { tipo: 'massa', d: ret(132, 2, 216, 5, 0.6), cor: '#efe2c8', marca: 'cornija' },
      ...janelas(144, 336, 9, 48, 6, 2, { cor: '#5b4d3c', persiana: '#3f6a4a', moldura: '#efe2c8' }),
      { tipo: 'massa', d: ret(136, 50, 208, 10, 0), cor: '#1c1c1c', marca: 'placa' },
      { tipo: 'massa', d: ret(136, 60, 208, 1.6, 0), cor: '#c8302a', semVolume: true },
      texto(240, 58.4, 'coin', 9.5, BRANCO, { espaco: 3, peso: 800 }),
      ...vidroDeVitrine(148, 222, 64, '#f6efe4', '#1c1c1c'), ...mostrar('moda', 148, 222, 64, ['#c8302a', '#3b3b3b']),
      ...vidroDeVitrine(228, 290, 64, '#f6efe4', '#1c1c1c'), ...mostrar('casa', 228, 290, 64, ['#d9b48a']),
      ...porta(298, 62, 36, '#1c1c1c')
    ]
  }),
  dep_rinascente: () => ({
    // A pedra cinza do centro antigo, a grade de janelas altas, o nome em minúsculas no alto; o térreo em ARCADAS, com
    // uma vitrine de luxo em cada arco; a porta no último arco.
    vb: [480, 120],
    pecas: [
      ...rua(['#cdc6bb', '#bfb8ac']),
      { tipo: 'massa', d: ret(124, 4, 232, CHAO - 4, 0.3), cor: '#b9b4ab', marca: 'predio' },
      { tipo: 'linha', d: Array.from({ length: 9 }, (_, k) => `M124 ${10 + k * 6}H356`).join(''), larg: 0.45, cor: '#a6a199', fino: true },
      texto(240, 15, 'rinascente', 11, '#1c1c1c', { espaco: 2.4, peso: 500 }),
      ...janelas(130, 350, 18, 54, 8, 2, { cor: '#4c5a62', moldura: '#d6d1c7', luz: true }),
      { tipo: 'massa', d: ret(124, 56, 232, 4, 0.3), cor: '#d6d1c7', semVolume: true },
      ...[0, 1, 2, 3].flatMap((k): Peca[] => { const x0 = 132 + k * 56, x1 = x0 + 46; return [{ tipo: 'massa', d: `M${x0 - 3} ${CHAO}V78A${(x1 - x0) / 2 + 3} ${(x1 - x0) / 2 + 3} 0 0 1 ${x1 + 3} 78V${CHAO}Z`, cor: '#9e998f', semVolume: true, marca: 'arco' }]; }),
      ...[0, 1, 2].flatMap((k): Peca[] => { const x0 = 132 + k * 56, x1 = x0 + 46; return [{ tipo: 'massa', d: `M${x0} ${CHAO - 4}V78A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 1 ${x1} 78V${CHAO - 4}Z`, cor: '#f3ead8', marca: 'vitrine' }, ...mostrar(k === 1 ? 'luxo' : 'moda', x0 + 4, x1 - 4, 70, k === 1 ? ['#1c1c1c'] : [['#b8302a', '#1c1c1c'][k / 2], '#efe7d4'])]; }),
      ...porta(304, 66, 38, '#2b2826', true)
    ]
  }),
  dep_lafayette: () => ({
    // O prédio haussmanniano: pedra creme, sacadas de ferro em cada janela, o grande arco central de vitral, a cúpula de
    // vidro dourado no telhado, as letras douradas na cornija; vitrines em arco com toldos; a porta à esquerda.
    vb: [480, 120],
    pecas: [
      ...rua(['#cfc5b6', '#c2b8a9']),
      { tipo: 'massa', d: 'M196 14C196 -4 284 -4 284 14Z', cor: '#c9a54a', marca: 'cupula' },
      { tipo: 'linha', d: 'M210 14C212 3 228 0 240 0M270 14C268 3 252 0 240 0M240 0V14', larg: 0.6, cor: '#8a6d2a' },
      { tipo: 'massa', d: ret(122, 12, 236, CHAO - 12, 0.3), cor: '#ece0c6', marca: 'predio' },
      { tipo: 'massa', d: ret(118, 12, 244, 4, 0.6), cor: '#d8c9a8', marca: 'cornija' },
      // O nome nas duas alas, sobre as janelas (no meio, o arco do vitral o esconderia).
      texto(166, 25, 'GALERIES', 8.5, '#a8812a', { fonte: 'serif', espaco: 1.6, peso: 600 }),
      texto(314, 25, 'LAFAYETTE', 8.5, '#a8812a', { fonte: 'serif', espaco: 1.6, peso: 600 }),
      ...janelas(126, 206, 28, 62, 3, 2, { cor: '#53636c', sacada: true, moldura: '#d8c9a8' }),
      ...janelas(274, 354, 28, 62, 3, 2, { cor: '#53636c', sacada: true, moldura: '#d8c9a8' }),
      { tipo: 'massa', d: 'M212 64V44A28 28 0 0 1 268 44V64Z', cor: '#d8c9a8', semVolume: true },
      { tipo: 'massa', d: 'M216 64V45A24 24 0 0 1 264 45V64Z', cor: '#8fa7b3', marca: 'vitral' },
      { tipo: 'linha', d: 'M240 21V64M216 52H264M224 30L240 45L256 30', larg: 0.6, cor: '#c9a54a' },
      { tipo: 'massa', d: ret(122, 64, 236, 3, 0), cor: '#d8c9a8', semVolume: true },
      ...porta(130, 72, 34, '#1c2a3a', true),
      ...[0, 1, 2, 3].flatMap((k): Peca[] => { const x0 = 172 + k * 46, x1 = x0 + 38; return [
        { tipo: 'massa', d: `M${x0} ${CHAO - 4}V84A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 1 ${x1} 84V${CHAO - 4}Z`, cor: '#f6ecda', marca: 'vitrine' },
        ...toldo(x0 - 1, x1 + 1, 68, '#1c2a3a', 'bombe'),
        ...mostrar(k === 2 ? 'luxo' : 'moda', x0 + 3, x1 - 3, 80, k === 2 ? ['#a8812a'] : [['#7a1f2a', '#efe7d4', '#1c2a3a', '#c9a54a'][k], '#2b2826'])
      ]; })
    ]
  })
};

/* ------------------------------------------------------------------ o modelo das outras grandes lojas */

interface Departamento {
  /** A cor do prédio e o material (reboco liso, tijolo, painel metálico, vidro de cortina). */
  parede: string;
  material: 'liso' | 'tijolo' | 'painel' | 'cortina';
  /** Andares acima do térreo (1..4): o topo do prédio sobe com eles. */
  andares: number;
  placa: { cor: string; texto: string; tinta: string; onde: 'faixa' | 'topo' | 'caixa'; fonte?: 'serif' | 'sans'; simbolo?: 'estrela' | 'alvo' | 'etiqueta' | 'coracao' | 'circulo' };
  /** O que as vitrines do térreo mostram (na ordem). */
  mostra: Mostra[];
  cores: string[];
  porta: 'esq' | 'dir';
  marquise?: string;
  janelas?: { cor: string; arco?: boolean; luz?: boolean };
}

function simboloDaPlaca(s: NonNullable<Departamento['placa']['simbolo']>, x: number, y: number, cor: string, fundo: string): Peca[] {
  switch (s) {
    case 'estrela': return [{ tipo: 'massa', d: Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 2.6 : 6.4; return `${k ? 'L' : 'M'}${(x + Math.cos(a) * r).toFixed(2)} ${(y + Math.sin(a) * r).toFixed(2)}`; }).join('') + 'Z', cor, semVolume: true, marca: 'simbolo' }];
    case 'alvo': return [{ tipo: 'massa', d: circulo(x, y, 7), cor, semVolume: true, marca: 'simbolo' }, { tipo: 'massa', d: circulo(x, y, 4.6), cor: fundo, semVolume: true }, { tipo: 'massa', d: circulo(x, y, 2.4), cor, semVolume: true }];
    case 'etiqueta': return [{ tipo: 'massa', d: `M${x - 8} ${y - 5}h11l5 5-5 5h-11z`, cor, semVolume: true, marca: 'simbolo' }, { tipo: 'massa', d: circulo(x + 2.4, y, 1.3), cor: fundo, semVolume: true }];
    case 'coracao': return [{ tipo: 'massa', d: `M${x} ${y + 5}C${x - 9} ${y - 1} ${x - 4} ${y - 8} ${x} ${y - 3}C${x + 4} ${y - 8} ${x + 9} ${y - 1} ${x} ${y + 5}Z`, cor, semVolume: true, marca: 'simbolo' }];
    case 'circulo': return [{ tipo: 'linha', d: circulo(x, y, 6), larg: 2, cor, marca: 'simbolo' }];
  }
}

function departamento(o: Departamento): Amostra {
  const x0 = 128, x1 = 352;
  const terreo = 58;
  const topo = Math.max(2, terreo - 4 - o.andares * 13);
  const pecas: Peca[] = [...rua(), { tipo: 'massa', d: ret(x0, topo, x1 - x0, CHAO - topo, 0.5), cor: o.parede, marca: 'predio' }];
  const esc = escurecer(o.parede, 0.14);
  if (o.material === 'tijolo') pecas.push({ tipo: 'linha', d: Array.from({ length: Math.floor((terreo - topo) / 5) }, (_, k) => `M${x0} ${topo + 5 * (k + 1)}H${x1}`).join(''), larg: 0.4, cor: esc, so3: true });
  if (o.material === 'painel') pecas.push({ tipo: 'linha', d: Array.from({ length: 13 }, (_, k) => `M${x0 + 17 * (k + 1)} ${topo}V${terreo}`).join('') + Array.from({ length: o.andares }, (_, k) => `M${x0} ${topo + 13 * (k + 1)}H${x1}`).join(''), larg: 0.5, cor: esc, fino: true });
  if (o.material === 'cortina') pecas.push({ tipo: 'massa', d: ret(x0 + 6, topo + 4, x1 - x0 - 12, terreo - topo - 8, 0.4), cor: '#8ea3ad', semVolume: true, marca: 'vidro-cortina' }, { tipo: 'linha', d: Array.from({ length: 12 }, (_, k) => `M${x0 + 6 + 17.5 * (k + 1)} ${topo + 4}V${terreo - 4}`).join('') + Array.from({ length: o.andares }, (_, k) => `M${x0 + 6} ${topo + 4 + 13 * (k + 1)}H${x1 - 6}`).join(''), larg: 0.5, cor: '#5f7580', fino: true });
  if (o.janelas && o.material !== 'cortina' && o.andares > 0) pecas.push(...janelas(x0 + 4, x1 - 4, topo + (o.placa.onde === 'topo' ? 16 : 4), terreo - 4, 8, o.andares - (o.placa.onde === 'topo' && o.andares > 1 ? 0 : 0), { cor: o.janelas.cor, arco: o.janelas.arco, luz: o.janelas.luz }));
  // A placa: na faixa sobre o térreo, no topo do prédio, ou numa caixa saliente.
  const p = o.placa;
  const largTexto = p.texto.length * 8.6 + (p.simbolo ? 18 : 0) + 20;
  if (p.onde === 'faixa') {
    pecas.push({ tipo: 'massa', d: ret(x0, terreo - 12, x1 - x0, 12, 0), cor: p.cor, marca: 'placa' });
    if (p.simbolo) pecas.push(...simboloDaPlaca(p.simbolo, 240 - largTexto / 2 + 16, terreo - 6, p.tinta, p.cor));
    pecas.push(texto(240 + (p.simbolo ? 8 : 0), terreo - 2.4, p.texto, 9.5, p.tinta, { fonte: p.fonte }));
  } else if (p.onde === 'topo') {
    pecas.push({ tipo: 'massa', d: ret(240 - largTexto / 2, topo + 2, largTexto, 13, 1), cor: p.cor, marca: 'placa' });
    if (p.simbolo) pecas.push(...simboloDaPlaca(p.simbolo, 240 - largTexto / 2 + 11, topo + 8.5, p.tinta, p.cor));
    pecas.push(texto(240 + (p.simbolo ? 8 : 0), topo + 12.4, p.texto, 9.5, p.tinta, { fonte: p.fonte }));
  } else {
    // A caixa saliente: uma palavra por linha ("BEST" / "BUY"), a caixa do tamanho das palavras, nunca cortada.
    const linhas = p.texto.split(' '), tam = 7.5, larg = Math.max(34, Math.max(...linhas.map(l => l.length)) * tam * 0.95 + 10);
    const alto = (p.simbolo ? 15 : 5) + linhas.length * (tam + 2) + 3;
    pecas.push({ tipo: 'massa', d: ret(x0 + 10, topo + 4, larg, alto, 2), cor: p.cor, marca: 'placa' });
    if (p.simbolo) pecas.push(...simboloDaPlaca(p.simbolo, x0 + 10 + larg / 2, topo + 12, p.tinta, p.cor));
    linhas.forEach((l, k) => pecas.push(texto(x0 + 10 + larg / 2, topo + (p.simbolo ? 15 : 5) + (k + 1) * (tam + 2) - 1, l, tam, p.tinta, { fonte: p.fonte, espaco: 0.8 })));
  }
  if (o.marquise) pecas.push({ tipo: 'massa', d: ret(x0 - 4, terreo, x1 - x0 + 8, 4, 0.5), cor: o.marquise, marca: 'marquise' });
  // O térreo: a porta de um lado, as vitrines do outro (cada uma mostra uma seção).
  const yv = terreo + (o.marquise ? 8 : 6);
  const portaX = o.porta === 'esq' ? x0 + 8 : x1 - 50;
  pecas.push(...porta(portaX, yv - 2, 42, escurecer(o.parede, 0.4), true));
  const vx0 = o.porta === 'esq' ? x0 + 56 : x0 + 8, vx1 = o.porta === 'esq' ? x1 - 6 : x1 - 56;
  const n = o.mostra.length, w = (vx1 - vx0 - (n - 1) * 5) / n;
  o.mostra.forEach((m, k) => { const a = vx0 + k * (w + 5); pecas.push(...vidroDeVitrine(a, a + w, yv), ...mostrar(m, a, a + w, yv, o.cores.slice(k).concat(o.cores))); });
  return { vb: [480, 120], pecas };
}

const MODELOS: Record<Exclude<FachadaDeLoja, keyof typeof ESPECIALIZADAS | keyof typeof PROPRIAS>, Departamento> = {
  dep_renner: { parede: '#f1eeea', material: 'liso', andares: 1, placa: { cor: '#c8102e', texto: 'RENNER', tinta: BRANCO, onde: 'faixa' }, mostra: ['moda', 'moda', 'moda'], cores: ['#c8102e', '#2b2f36', '#efe7d4'], porta: 'dir' },
  dep_magalu: { parede: '#e9eef3', material: 'painel', andares: 2, placa: { cor: '#0a6fd6', texto: 'MAGAZINE LUIZA', tinta: BRANCO, onde: 'topo', simbolo: 'coracao' }, mostra: ['tecnologia', 'casa', 'tecnologia'], cores: ['#5d7a8a'], porta: 'esq', marquise: '#0a6fd6' },
  dep_casasbahia: { parede: '#f3eedf', material: 'liso', andares: 1, placa: { cor: '#0b3e91', texto: 'CASAS BAHIA', tinta: '#ffd100', onde: 'faixa' }, mostra: ['casa', 'casa', 'tecnologia'], cores: ['#8a6a4a', '#5d7a6a'], porta: 'dir', marquise: '#ffd100' },
  dep_falabella: { parede: '#e7ece4', material: 'cortina', andares: 3, placa: { cor: '#3d8e33', texto: 'falabella', tinta: BRANCO, onde: 'topo' }, mostra: ['moda', 'casa', 'tecnologia'], cores: ['#3d8e33', '#8a6a4a'], porta: 'esq' },
  dep_liverpool: { parede: '#f2e9ee', material: 'painel', andares: 3, placa: { cor: '#e10098', texto: 'Liverpool', tinta: BRANCO, onde: 'topo', fonte: 'serif' }, mostra: ['moda', 'luxo', 'casa'], cores: ['#e10098', '#2b2826', '#8a6a4a'], porta: 'dir', marquise: '#3b3b3b' },
  dep_macys: { parede: '#a8553f', material: 'tijolo', andares: 4, placa: { cor: '#1c1c1c', texto: "MACY'S", tinta: BRANCO, onde: 'faixa', simbolo: 'estrela' }, mostra: ['moda', 'luxo', 'moda'], cores: ['#e21a2c', '#efe7d4', '#2b2826'], porta: 'esq', janelas: { cor: '#4f5d66', luz: true } },
  dep_target: { parede: '#f4f2ef', material: 'liso', andares: 1, placa: { cor: '#f4f2ef', texto: 'TARGET', tinta: '#cc0000', onde: 'faixa', simbolo: 'alvo' }, mostra: ['casa', 'moda', 'esporte'], cores: ['#cc0000', '#2b2f36'], porta: 'dir', marquise: '#cc0000' },
  dep_bestbuy: { parede: '#0a4abf', material: 'painel', andares: 2, placa: { cor: '#ffe000', texto: 'BEST BUY', tinta: '#1d252c', onde: 'caixa', simbolo: 'etiqueta' }, mostra: ['tecnologia', 'tecnologia'], cores: [], porta: 'dir' },
  dep_mediamarkt: { parede: '#e2e2e2', material: 'painel', andares: 2, placa: { cor: '#df0000', texto: 'MEDIAMARKT', tinta: BRANCO, onde: 'topo' }, mostra: ['tecnologia', 'casa', 'tecnologia'], cores: ['#55595f'], porta: 'esq', marquise: '#1c1c1c' },
  dep_marks: { parede: '#ded8cc', material: 'liso', andares: 2, placa: { cor: '#1d1d1b', texto: 'MARKS & SPENCER', tinta: BRANCO, onde: 'faixa', fonte: 'serif' }, mostra: ['moda', 'casa', 'moda'], cores: ['#1f4e3d', '#c9b89a', '#2b2826'], porta: 'dir', janelas: { cor: '#5a676e' } },
  dep_johnlewis: { parede: '#c9c4ba', material: 'painel', andares: 3, placa: { cor: '#1d1d1b', texto: 'JOHN LEWIS', tinta: BRANCO, onde: 'topo', fonte: 'serif' }, mostra: ['casa', 'moda', 'tecnologia'], cores: ['#3f6a5a', '#2b2826'], porta: 'esq', marquise: '#2b2826' },
  dep_isetan: { parede: '#d7cfc0', material: 'liso', andares: 4, placa: { cor: '#2e2a26', texto: 'ISETAN', tinta: '#efe2c8', onde: 'topo', fonte: 'serif' }, mostra: ['luxo', 'moda', 'moda'], cores: ['#a8812a', '#7a1f2a', '#efe7d4'], porta: 'dir', janelas: { cor: '#4c5a62' } },
  dep_yodobashi: { parede: '#2b2f36', material: 'cortina', andares: 4, placa: { cor: '#d81e1e', texto: 'YODOBASHI', tinta: BRANCO, onde: 'topo' }, mostra: ['tecnologia', 'tecnologia', 'tecnologia'], cores: [], porta: 'esq' },
  dep_myer: { parede: '#ece9e4', material: 'painel', andares: 3, placa: { cor: '#111111', texto: 'MYER', tinta: BRANCO, onde: 'caixa', simbolo: 'circulo' }, mostra: ['moda', 'casa', 'luxo'], cores: ['#111111', '#c9b89a', '#a8812a'], porta: 'dir' },
  dep_armazens: { parede: '#d9cbb0', material: 'tijolo', andares: 3, placa: { cor: '#5a3a24', texto: 'GRANDES ARMAZÉNS', tinta: '#f1e4c8', onde: 'faixa', fonte: 'serif' }, mostra: ['moda', 'casa', 'tecnologia'], cores: ['#7a4a24', '#5d7a6a'], porta: 'esq', marquise: '#5a3a24', janelas: { cor: '#5b4d3c', arco: true } }
};

export const FACHADAS_DE_LOJA: Record<FachadaDeLoja, () => Amostra> = {
  ...ESPECIALIZADAS,
  ...PROPRIAS,
  ...(Object.fromEntries(Object.entries(MODELOS).map(([k, o]) => [k, () => departamento(o)])) as Record<keyof typeof MODELOS, () => Amostra>)
};

/** De que lado fica a porta (a vitrine de Compras põe os objetos na frente do vidro, nunca da porta). */
export const PORTA_DAS_LOJAS: Record<FachadaDeLoja, 'esq' | 'dir'> = {
  moda: 'dir', sapataria: 'dir', otica: 'dir', acessorios: 'esq', moveis: 'dir', grifes: 'dir',
  dep_cea: 'dir', dep_corteingles: 'esq', dep_coin: 'dir', dep_rinascente: 'dir', dep_lafayette: 'esq',
  ...(Object.fromEntries(Object.entries(MODELOS).map(([k, o]) => [k, o.porta])) as Record<keyof typeof MODELOS, 'esq' | 'dir'>)
};
