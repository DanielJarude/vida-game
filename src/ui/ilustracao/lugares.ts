/**
 * REWORK 8 (Fase B) — os lugares da cidade como FACHADAS: a arquitetura diz o que é antes da placa. O banco tem as
 * colunas e o frontão de pedra; a clínica, o branco com a cruz verde; a oficina, o portão de enrolar aberto e o
 * elevador; a concessionária, a caixa de vidro com as bandeirolas; os usados, o pátio aberto com o varal de
 * bandeirinhas; o aeroclube, o hangar em arco com a biruta; o abrigo, a casa com o cercado e a pata.
 *
 * A fachada é o FUNDO da vitrine de Compras: os objetos de verdade deste ano (os carros do anúncio, as coisas da
 * loja, os bichos do abrigo) ficam na frente, como numa vitrine de rua. Quando a loja não tem objetos para mostrar
 * (o banco, a clínica, a ótica), a fachada mostra o próprio interior.
 *
 * Quadro de 480 × 120, a loja no meio (x 140..340, sempre visível) e a rua continuando dos lados — a vitrine corta as
 * laterais conforme a largura do cartão (`preserveAspectRatio="xMidYMax slice"`).
 */
import { cantos, circulo, elipse, lembrar, escurecer, membro, ret, suave, type Amostra, type Peca } from './nucleo';

export type LugarDaCidade =
  | 'alugar' | 'concessionaria' | 'usados' | 'motos' | 'nautica' | 'aeroclube' | 'oficina' | 'banco' | 'abrigo' | 'pets'
  | 'estilo' | 'clinica' | 'eletronicos' | 'casa' | 'instrumentos' | 'esportes' | 'livraria'
  /** REWORK 12.2: as casas de luxo e coleção, os exóticos e os mercados de procedência duvidosa, cada um com a sua cara. */
  | 'relojoaria' | 'joalheria' | 'galeria' | 'antiquario' | 'memorabilia' | 'leilao' | 'exoticos' | 'feira' | 'antiquario_vago' | 'privada_incerta' | 'por_fora';

const CHAO = 112, X0 = 140, X1 = 340;
const VIDRO_LOJA = '#efe7d4', ESCURO = '#2b2826', METAL = '#b8b4ad', BRANCO = '#f2efe9';

interface Loja {
  parede: string;
  /** A textura da parede: lisa, tijolo, pedra, ripas de madeira. */
  textura?: 'tijolo' | 'pedra' | 'ripas';
  placa: { cor: string; texto: string; tinta?: string; simbolo?: Peca[] };
  toldo?: { cor: string; listra?: string };
  /** Onde fica a porta (à esquerda, à direita) — a vitrine ocupa o resto. */
  porta?: 'esq' | 'dir';
  /** O que se vê pela vitrine quando a loja está vazia de objetos. */
  interior?: Peca[];
  /** O que vai na frente de tudo (bandeirolas, a biruta, o cercado). */
  frente?: Peca[];
  /** A altura do prédio (o topo). */
  topo?: number;
  /** A cor do vidro da vitrine (a luz de dentro). */
  luz?: string;
}

/** Os vizinhos e a calçada: a rua que continua dos lados. */
function rua(): Peca[] {
  return [
    { tipo: 'massa', d: ret(-4, 30, 148, 86, 0), cor: '#cbbfae', semVolume: true, marca: 'vizinho' },
    { tipo: 'massa', d: ret(28, 50, 34, 26, 1) + ret(84, 50, 34, 26, 1), cor: '#9aa7ad', semVolume: true, fino: true },
    { tipo: 'massa', d: ret(336, 22, 148, 94, 0), cor: '#b9b0a2', semVolume: true, marca: 'vizinho' },
    { tipo: 'massa', d: ret(362, 44, 34, 30, 1) + ret(420, 44, 34, 30, 1), cor: '#9aa7ad', semVolume: true, fino: true },
    { tipo: 'massa', d: ret(-4, CHAO, 488, 12, 0), cor: '#a49c90', semVolume: true, marca: 'calcada' },
    { tipo: 'linha', d: `M-4 ${CHAO}H484`, larg: 1 }
  ];
}

function textura(t: Loja['textura'], cor: string, topo: number): Peca[] {
  const e = escurecer(cor, 0.16);
  if (t === 'tijolo') return [{ tipo: 'linha', d: Array.from({ length: Math.floor((CHAO - topo) / 6) }, (_, k) => `M${X0} ${topo + 6 * (k + 1)}H${X1}`).join(''), larg: 0.5, cor: e, so3: true }];
  if (t === 'pedra') return [{ tipo: 'linha', d: Array.from({ length: Math.floor((CHAO - topo) / 12) }, (_, k) => `M${X0} ${topo + 12 * (k + 1)}H${X1}`).join(''), larg: 0.6, cor: e, fino: true }];
  if (t === 'ripas') return [{ tipo: 'linha', d: Array.from({ length: 24 }, (_, k) => `M${X0 + 8 + k * 8} ${topo}V${CHAO}`).join(''), larg: 0.5, cor: e, so3: true }];
  return [];
}

/** Uma loja de rua: o prédio, a placa com o nome, o toldo, a porta, a vitrine grande. */
function loja(l: Loja): Amostra {
  const topo = l.topo ?? 6;
  const portaX = l.porta === 'esq' ? X0 + 14 : X1 - 50;
  const vx0 = l.porta === 'esq' ? X0 + 58 : X0 + 14, vx1 = l.porta === 'esq' ? X1 - 14 : X1 - 62;
  const vy = 46;
  // A largura do nome na placa (Inter 700 a 12, com o espaçamento das letras): o símbolo fica logo à esquerda dele.
  const largTexto = l.placa.simbolo ? l.placa.texto.length * 12 * 0.84 : 0;
  return {
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0, topo, X1 - X0, CHAO - topo, 1), cor: l.parede, marca: 'predio' },
      ...textura(l.textura, l.parede, topo),
      { tipo: 'massa', d: ret(X0 + 20, topo + 6, X1 - X0 - 40, 22, 2), cor: l.placa.cor, marca: 'placa' },
      ...(l.placa.simbolo ? [{ tipo: 'grupo' as const, t: `translate(${(240 - largTexto / 2 - 14 - 196).toFixed(1)} ${topo - 6})`, pecas: l.placa.simbolo }] : []),
      { tipo: 'texto', x: 240 + (l.placa.simbolo ? 8 : 0), y: topo + 21.5, texto: l.placa.texto, tam: 12, cor: l.placa.tinta ?? BRANCO, marca: 'nome' },
      { tipo: 'massa', d: ret(vx0, vy, vx1 - vx0, CHAO - vy - 2, 1), cor: l.luz ?? VIDRO_LOJA, marca: 'vitrine' },
      { tipo: 'massa', d: ret(vx0, vy, vx1 - vx0, 7, 0), cor: '#000000', opacidade: 0.1, semVolume: true },
      ...(l.interior ?? []).map(p => ({ ...p, classe: 'fachada__interior' })),
      { tipo: 'linha', d: `M${vx0} ${CHAO - 2}H${vx1}`, larg: 1.6, cor: escurecer(l.parede, 0.3) },
      { tipo: 'massa', d: ret(portaX, 50, 36, CHAO - 50, 1), cor: escurecer(l.parede, 0.35), marca: 'porta' },
      { tipo: 'vidro', d: ret(portaX + 5, 55, 26, 34, 1), claro: true },
      { tipo: 'metal', d: ret(portaX + 27, 74, 3, 10, 1), cor: METAL },
      ...(l.toldo ? [
        { tipo: 'massa' as const, d: cantos([[X0 + 6, 36, 1], [X1 - 6, 36, 1], [X1 + 2, 46, 1], [X0 - 2, 46, 1]]), cor: l.toldo.cor, marca: 'toldo' },
        ...(l.toldo.listra ? [{ tipo: 'massa' as const, d: Array.from({ length: 12 }, (_, k) => { const a = X0 + 6 + k * 16.2, b = X0 - 2 + k * 17.2; return `M${a.toFixed(1)} 36L${(a + 8).toFixed(1)} 36L${(b + 8.6).toFixed(1)} 46L${b.toFixed(1)} 46Z`; }).join(''), cor: l.toldo.listra, semVolume: true }] : []),
        { tipo: 'linha' as const, d: Array.from({ length: 12 }, (_, k) => { const x = X0 - 2 + k * 17.2; return `M${x.toFixed(1)} 46q4.3 5 8.6 0`; }).join(''), larg: 0.8, fino: true }
      ] : []),
      ...(l.frente ?? [])
    ]
  };
}

/* Os símbolos das placas (à esquerda do nome). */
const simCasa = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: `M${x - 8} ${y}l8-7 8 7v6h-16z`, cor, semVolume: true, marca: 'simbolo' }]; };
const simNota = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: circulo(x - 3, y + 4, 3) + ret(x - 0.6, y - 9, 2, 13, 0.5) + `M${x + 1} ${y - 9}l6 3v3l-6-3z`, cor, semVolume: true, marca: 'simbolo' }]; };
const simBola = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: circulo(x, y, 7), cor, semVolume: true, marca: 'simbolo' }, { tipo: 'linha', d: `M${x - 7} ${y}h14M${x} ${y - 7}c-4 4-4 10 0 14M${x} ${y - 7}c4 4 4 10 0 14`, larg: 0.8, cor: ESCURO }]; };
const simLivro = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: `M${x - 9} ${y - 6}q5-2 9 1q4-3 9-1v12q-5-2-9 1q-4-3-9-1z`, cor, semVolume: true, marca: 'simbolo' }]; };
const simCruz = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: ret(x - 2.5, y - 8, 5, 16, 0.6) + ret(x - 8, y - 2.5, 16, 5, 0.6), cor, semVolume: true, marca: 'simbolo' }]; };
const simPata = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: elipse(x, y + 3, 5, 4) + circulo(x - 6, y - 3, 2.2) + circulo(x - 2, y - 7, 2.2) + circulo(x + 2, y - 7, 2.2) + circulo(x + 6, y - 3, 2.2), cor, semVolume: true, marca: 'simbolo' }]; };
const simChave = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: membro([[x - 7, y + 7], [x + 4, y - 4]], [3, 3]) + circulo(x + 5, y - 5, 4.4), cor, semVolume: true, marca: 'simbolo' }]; };
const simOculos = (cor: string, x = 196, y = 24): Peca[] => { return [{ tipo: 'linha', d: `${circulo(x - 5, y, 4)}${circulo(x + 5, y, 4)}M${x - 1} ${y}h2`, larg: 1.6, cor, marca: 'simbolo' }]; };
const simAncora = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'linha', d: `M${x} ${y - 6}v14M${x - 7} ${y + 2}q7 9 14 0M${x - 4} ${y - 3}h8`, larg: 1.8, cor, marca: 'simbolo' }, { tipo: 'linha', d: circulo(x, y - 8, 2), larg: 1.4, cor }]; };
const simTela = (cor: string, x = 196, y = 23): Peca[] => { return [{ tipo: 'massa', d: ret(x - 9, y - 7, 18, 12, 1.5) + ret(x - 3, y + 6, 6, 2, 0.5), cor, semVolume: true, marca: 'simbolo' }]; };


const simRelogio = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'linha', d: `${circulo(x, y, 7)}M${x} ${y}v-5M${x} ${y}l4 2`, larg: 1.5, cor, marca: 'simbolo' }];
const simDiamante = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'massa', d: `M${x - 8} ${y - 3}l3-4h10l3 4-8 10z`, cor, semVolume: true, marca: 'simbolo' }, { tipo: 'linha', d: `M${x - 8} ${y - 3}h16M${x - 3} ${y - 7}l3 14 3-14`, larg: 0.6, cor: ESCURO }];
const simVaso = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'massa', d: `M${x - 3} ${y - 9}h6v2c4 2 6 6 4 11-1 3-3 4-7 4s-6-1-7-4c-2-5 0-9 4-11z`, cor, semVolume: true, marca: 'simbolo' }];
const simTaca = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'massa', d: `M${x - 7} ${y - 8}h14c0 7-3 10-6 11v3h3v2h-8v-2h3v-3c-3-1-6-4-6-11z`, cor, semVolume: true, marca: 'simbolo' }, { tipo: 'linha', d: `M${x - 7} ${y - 6}c-4 0-4 6 1 6M${x + 7} ${y - 6}c4 0 4 6-1 6`, larg: 1.2, cor }];
const simMartelo = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'massa', d: ret(x - 8, y - 8, 10, 6, 1.5) + membro([[x - 3, y - 4], [x + 6, y + 6]], [2, 2]), cor, semVolume: true, marca: 'simbolo' }, { tipo: 'massa', d: ret(x - 9, y + 6, 10, 2.5, 1), cor, semVolume: true }];
const simFolha = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'massa', d: `M${x - 8} ${y + 7}C${x - 8} ${y - 4} ${x} ${y - 9} ${x + 8} ${y - 8}C${x + 8} ${y + 2} ${x + 2} ${y + 7} ${x - 8} ${y + 7}z`, cor, semVolume: true, marca: 'simbolo' }, { tipo: 'linha', d: `M${x - 8} ${y + 7}L${x + 5} ${y - 5}`, larg: 0.8, cor: ESCURO }];
const simQuadro = (cor: string, x = 196, y = 23): Peca[] => [{ tipo: 'linha', d: ret(x - 9, y - 7, 18, 14, 0.5), larg: 1.6, cor, marca: 'simbolo' }, { tipo: 'massa', d: `M${x - 6} ${y + 4}l5-6 3 3 3-4 2 7z`, cor, semVolume: true }];

/** Uma joia/relógio pousado numa almofada de vitrine. */
const almofada = (x: number, y: number, cor: string): Peca[] => [{ tipo: 'massa', d: ret(x - 11, y, 22, 7, 2.5), cor, marca: 'almofada' }];
const relogioDePulso = (x: number, y: number, caixa: string, pulseira: string): Peca[] => [
  { tipo: 'massa', d: ret(x - 3, y - 9, 6, 18, 2), cor: pulseira, semVolume: true },
  { tipo: 'metal', d: circulo(x, y, 5), cor: caixa }, { tipo: 'massa', d: circulo(x, y, 3.6), cor: '#f4f1ea', semVolume: true },
  { tipo: 'linha', d: `M${x} ${y}v-2.6M${x} ${y}l1.8 1`, larg: 0.6, cor: ESCURO }
];
const quadro = (x: number, y: number, w: number, h: number, a: string, b: string): Peca[] => [
  { tipo: 'massa', d: ret(x, y, w, h, 0.5), cor: '#2b2826', marca: 'moldura' },
  { tipo: 'massa', d: ret(x + 2, y + 2, w - 4, h - 4, 0.3), cor: a, semVolume: true },
  { tipo: 'massa', d: `M${x + 2} ${y + h - 2}L${x + w * 0.45} ${y + h * 0.4}L${x + w * 0.7} ${y + h * 0.65}L${x + w - 2} ${y + h * 0.3}V${y + h - 2}Z`, cor: b, semVolume: true }
];
const lampada = (x: number, y: number): Peca[] => [{ tipo: 'linha', d: `M${x} ${y - 6}v4`, larg: 0.6, cor: '#5a5650' }, { tipo: 'luz', d: `M${x - 3} ${y}h6l5 20h-16z`, cor: '#fff3c4' }];

/* Interiores (o que a vitrine mostra quando não há objetos na frente). */
const balcao = (cor: string, x0 = 168, x1 = 280): Peca => ({ tipo: 'massa', d: ret(x0, 84, x1 - x0, 26, 2), cor, marca: 'balcao' });
const prateleiras = (x0: number, x1: number, cores: string[]): Peca[] => [
  { tipo: 'linha', d: `M${x0} 66H${x1}M${x0} 84H${x1}`, larg: 1, cor: '#8a5a32' },
  { tipo: 'massa', d: Array.from({ length: Math.floor((x1 - x0) / 7) }, (_, k) => ret(x0 + 2 + k * 7, 56 + (k % 3), 5, 10 - (k % 3), 0.5)).join(''), cor: cores[0], semVolume: true, fino: true },
  { tipo: 'massa', d: Array.from({ length: Math.floor((x1 - x0) / 9) }, (_, k) => ret(x0 + 3 + k * 9, 75 - (k % 2) * 2, 6, 9 + (k % 2) * 2, 0.5)).join(''), cor: cores[1] ?? cores[0], semVolume: true, fino: true }
];

/** Um carro de perfil, simples (o que está no salão ou no elevador da oficina quando não há anúncio na frente). */
const carrinho = (x: number, y: number, cor: string): Peca[] => [
  { tipo: 'massa', d: suave([[x, y], [x + 6, y - 10], [x + 18, y - 12], [x + 30, y - 22], [x + 54, y - 22], [x + 66, y - 12], [x + 80, y - 10], [x + 82, y]], true, 0.3), cor, marca: 'carro' },
  { tipo: 'vidro', d: cantos([[x + 32, y - 20, 2], [x + 52, y - 20, 2], [x + 62, y - 12, 1], [x + 24, y - 12, 1]]) },
  { tipo: 'pneu', cx: x + 18, cy: y, r: 7, aro: 'liga' },
  { tipo: 'pneu', cx: x + 66, cy: y, r: 7, aro: 'liga' }
];

const bandeirinhas = (x0: number, x1: number, y: number, cores: string[]): Peca[] => {
  const n = Math.floor((x1 - x0) / 12);
  return [
    { tipo: 'linha', d: `M${x0} ${y}Q${(x0 + x1) / 2} ${y + 8} ${x1} ${y}`, larg: 0.8, cor: ESCURO },
    ...Array.from({ length: n }, (_, k): Peca => { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, yy = y + 8 * 4 * t * (1 - t) * 0.5 + 1; return { tipo: 'massa', d: `M${(x - 4).toFixed(1)} ${yy.toFixed(1)}h8l-4 8z`, cor: cores[k % cores.length], semVolume: true, marca: 'bandeirinha' }; })
  ];
};

const LOJAS: Record<LugarDaCidade, () => Amostra> = {
  alugar: () => loja({
    parede: '#e3d6bd', placa: { cor: '#2f5d4a', texto: 'IMÓVEIS', simbolo: simCasa(BRANCO) }, porta: 'esq',
    interior: [
      ...[0, 1, 2].flatMap((k): Peca[] => [{ tipo: 'massa', d: ret(212 + k * 38, 56, 30, 22, 1), cor: BRANCO, marca: 'anuncio' }, { tipo: 'massa', d: `M${220 + k * 38} 70l7-7 7 7v5h-14z`, cor: ['#b5573a', '#3d5d8f', '#4f7a4b'][k], semVolume: true }]),
      balcao('#8a5a32', 212, 320)
    ],
    frente: [{ tipo: 'massa', d: ret(110, 70, 26, 18, 1), cor: '#d4462f', marca: 'placa-aluga' }, { tipo: 'texto', x: 123, y: 82, texto: 'ALUGA', tam: 6, cor: BRANCO }, { tipo: 'metal', d: ret(121.5, 88, 3, 24, 0.5), cor: '#6a6560' }]
  }),
  concessionaria: () => ({
    // A caixa de vidro (o salão inteiro é vitrine), a marquise de aço, as bandeirolas altas na frente.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0 - 6, 14, X1 - X0 + 12, CHAO - 14, 1), cor: '#5d646c', marca: 'predio' },
      { tipo: 'massa', d: ret(X0, 34, X1 - X0, CHAO - 36, 0), cor: '#dfe5e8', marca: 'vitrine' },
      { tipo: 'linha', d: [0, 1, 2, 3, 4].map(k => `M${X0 + 40 * k + 40} 34V${CHAO - 2}`).join(''), larg: 1.4, cor: '#5d646c' },
      { tipo: 'massa', d: ret(X0 - 10, 10, X1 - X0 + 20, 22, 1), cor: '#2c3238', marca: 'placa' },
      { tipo: 'texto', x: 240, y: 25.5, texto: 'CONCESSIONÁRIA', tam: 10, cor: BRANCO, marca: 'nome' },
      ...carrinho(196, 104, '#b8302a').map(p => ({ ...p, classe: 'fachada__interior' })),
      ...[100, 380].flatMap((x, k): Peca[] => [
        { tipo: 'metal', d: ret(x - 1.2, 8, 2.4, CHAO - 8, 0.5), cor: '#8d8a85', marca: 'mastro' },
        { tipo: 'massa', d: `M${x + 1.2} 10q10 2 12 8v40q-2-6-12-8z`, cor: k ? '#2c5c9e' : '#b8302a', marca: 'bandeirola' }
      ])
    ]
  }),
  usados: () => ({
    // O pátio aberto: o chão de concreto, a guarita pequena com a placa, o varal de bandeirinhas, os preços no para-brisa.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0 - 10, 84, X1 - X0 + 20, CHAO - 84, 0), cor: '#cfc8bb', semVolume: true, marca: 'patio' },
      { tipo: 'massa', d: ret(X1 - 54, 40, 50, CHAO - 40, 1), cor: '#e9e2d2', marca: 'guarita' },
      { tipo: 'vidro', d: ret(X1 - 46, 52, 34, 20, 1), claro: true },
      { tipo: 'massa', d: ret(X0 + 14, 14, 140, 22, 2), cor: '#e0b12d', marca: 'placa' },
      { tipo: 'texto', x: 224, y: 29.5, texto: 'SEMINOVOS', tam: 11, cor: ESCURO, marca: 'nome' },
      { tipo: 'metal', d: ret(X0 + 30, 36, 3, 48, 0.5) + ret(X0 + 136, 36, 3, 48, 0.5), cor: '#8d8a85' },
      ...bandeirinhas(X0 - 10, X1 + 10, 42, ['#c8372d', '#e2b72d', '#2f6db3', '#3f9a52']),
      ...carrinho(172, 104, '#55595f').map(p => ({ ...p, classe: 'fachada__interior' })),
      { tipo: 'massa', d: ret(210, 86, 14, 7, 1), cor: '#e2b72d', semVolume: true, classe: 'fachada__interior', marca: 'preco' }
    ]
  }),
  motos: () => loja({
    parede: '#3b3f45', placa: { cor: '#d4462f', texto: 'MOTOS & BIKES' }, porta: 'dir', topo: 10, luz: '#e8e3d8',
    interior: [
      { tipo: 'pneu', cx: 186, cy: 100, r: 10, aro: 'raios' }, { tipo: 'pneu', cx: 230, cy: 100, r: 10, aro: 'raios' },
      { tipo: 'massa', d: suave([[186, 98], [200, 84], [214, 82], [230, 98], [214, 92], [198, 94]], true, 0.4), cor: '#c8372d', marca: 'moto' },
      { tipo: 'pneu', cx: 252, cy: 102, r: 8, aro: 'bicicleta' }, { tipo: 'pneu', cx: 278, cy: 102, r: 8, aro: 'bicicleta' },
      { tipo: 'linha', d: 'M252 102l10-14h12l4 14M262 88l-4-4', larg: 1.4, cor: '#2f6db3' }
    ]
  }),
  nautica: () => loja({
    // Madeira de cais, azul do mar, a âncora na placa, as boias na parede, o píer embaixo.
    parede: '#e9e4da', textura: 'ripas', placa: { cor: '#24576a', texto: 'NÁUTICA', simbolo: simAncora(BRANCO) }, porta: 'esq', toldo: { cor: '#24576a', listra: BRANCO },
    interior: [{ tipo: 'massa', d: 'M216 96h96l-10 12h-74z', cor: BRANCO, marca: 'casco' }, { tipo: 'linha', d: 'M262 96V58', larg: 1.4, cor: ESCURO }, { tipo: 'massa', d: 'M264 60l26 32h-26z', cor: '#f4f1ea', semVolume: true }],
    frente: [
      { tipo: 'massa', d: `M${X0 - 2} 60a7 7 0 1 0 0.1 0z`, cor: '#e07b2c', marca: 'boia' },
      { tipo: 'massa', d: circulo(X0 - 2, 67, 3), cor: '#e9e4da', semVolume: true },
      { tipo: 'massa', d: ret(-4, CHAO, 488, 8, 0), cor: '#8a5a32', semVolume: true, marca: 'pier' },
      { tipo: 'linha', d: Array.from({ length: 30 }, (_, k) => `M${k * 16} ${CHAO}v8`).join(''), larg: 0.6, cor: '#5a3a24', fino: true }
    ]
  }),
  aeroclube: () => ({
    // O hangar em arco (a porta enorme aberta), a biruta no mastro.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: `M${X0 - 10} ${CHAO}V58C${X0 + 10} 6 ${X1 - 10} 6 ${X1 + 10} 58V${CHAO}Z`, cor: '#c9ccc9', marca: 'hangar' },
      { tipo: 'linha', d: Array.from({ length: 9 }, (_, k) => { const x = X0 + 4 + k * 24; return `M${x} ${CHAO}V${36 - Math.sin((k + 0.5) / 9 * Math.PI) * 12 + 22}`; }).join(''), larg: 0.6, cor: '#9a9d9a', so3: true },
      { tipo: 'massa', d: ret(X0 + 22, 52, X1 - X0 - 44, CHAO - 52, 1), cor: '#3a3a3a', marca: 'porta-hangar' },
      { tipo: 'massa', d: ret(X0 + 50, 26, 100, 18, 2), cor: '#24576a', marca: 'placa' },
      { tipo: 'texto', x: 240, y: 38.5, texto: 'AEROCLUBE', tam: 10, cor: BRANCO, marca: 'nome' },
      { tipo: 'massa', d: 'M200 92h64l14-6h8l-6 10h-80z', cor: BRANCO, classe: 'fachada__interior', marca: 'aviao' },
      { tipo: 'massa', d: 'M224 92l-6-14h8l10 14z', cor: '#c8372d', semVolume: true, classe: 'fachada__interior' },
      { tipo: 'metal', d: ret(396, 30, 2.4, CHAO - 30, 0.5), cor: '#8d8a85', marca: 'mastro' },
      { tipo: 'massa', d: 'M398 32l36 4v10l-36 4z', cor: '#e07b2c', marca: 'biruta' },
      { tipo: 'massa', d: 'M410 33.4l8 0.9v13.4l-8 0.9zM426 35.2l8 0.8v10l-8 0.8z', cor: BRANCO, semVolume: true }
    ]
  }),
  oficina: () => loja({
    // Tijolo, o portão de enrolar levantado, o carro no elevador, a chave na placa, o pneu encostado.
    parede: '#a8583e', textura: 'tijolo', placa: { cor: ESCURO, texto: 'OFICINA', simbolo: simChave('#e2b72d') }, porta: 'dir', luz: '#55534f',
    interior: [
      ...carrinho(178, 86, '#2c5c9e'),
      { tipo: 'metal', d: ret(174, 94, 92, 4, 1) + ret(214, 98, 6, 12, 1), cor: '#e2b72d', marca: 'elevador' },
      { tipo: 'linha', d: 'M172 54h96', larg: 1.4, cor: '#7d7973' }
    ],
    frente: [{ tipo: 'pneu', cx: 360, cy: 103, r: 9, aro: 'calota' }, { tipo: 'massa', d: ret(154, 46, 116, 6, 1), cor: '#8d8a85', marca: 'portao' }]
  }),
  banco: () => ({
    // A pedra, as colunas, o frontão triangular, os degraus, a porta alta — a instituição.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0, 30, X1 - X0, CHAO - 30, 0), cor: '#d8d2c4', marca: 'predio' },
      { tipo: 'massa', d: `M${X0 - 8} 32L240 6L${X1 + 8} 32Z`, cor: '#cfc8b8', marca: 'frontao' },
      { tipo: 'massa', d: ret(X0 - 8, 30, X1 - X0 + 16, 7, 0), cor: '#bfb7a5', semVolume: true },
      { tipo: 'texto', x: 240, y: 27, texto: 'BANCO', tam: 9, cor: '#4a4643', marca: 'nome' },
      { tipo: 'massa', d: ret(220, 54, 40, CHAO - 62, 1), cor: '#4a3626', marca: 'porta' },
      { tipo: 'metal', d: ret(238, 78, 4, 6, 1), cor: '#c9a23a' },
      { tipo: 'massa', d: [0, 1, 2, 3, 4, 5].map(k => ret(X0 + 10 + k * (k < 3 ? 22 : 22) + (k >= 3 ? 64 : 0), 40, 9, CHAO - 50, 1)).join(''), cor: '#ece7dc', marca: 'coluna' },
      { tipo: 'massa', d: ret(X0 - 8, CHAO - 10, X1 - X0 + 16, 5, 0) + ret(X0 - 14, CHAO - 5, X1 - X0 + 28, 5, 0), cor: '#bfb7a5', marca: 'degraus' }
    ]
  }),
  abrigo: () => ({
    // A casa simples (o telhado, a janela), o cercado de madeira, a placa com a pata, a casinha do cachorro.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0 + 10, 44, 180, CHAO - 44, 1), cor: '#e6d3a8', marca: 'predio' },
      { tipo: 'massa', d: `M${X0} 46L240 14L${X1} 46Z`, cor: '#a8583e', marca: 'telhado' },
      { tipo: 'massa', d: ret(X0 + 26, 62, 40, 28, 1), cor: VIDRO_LOJA, marca: 'vitrine' },
      { tipo: 'massa', d: ret(X1 - 66, 56, 30, CHAO - 56, 1), cor: '#6e3f22', marca: 'porta' },
      { tipo: 'massa', d: ret(200, 54, 56, 18, 2), cor: '#3f6b4a', marca: 'placa' },
      ...simPata(BRANCO, 208, 62),
      { tipo: 'texto', x: 236, y: 66.5, texto: 'ABRIGO', tam: 7.4, cor: BRANCO, marca: 'nome' },
      { tipo: 'massa', d: Array.from({ length: 26 }, (_, k) => `M${X0 - 30 + k * 10} ${CHAO}v-20l3-4 3 4v20z`).join(''), cor: '#e9dcc0', marca: 'cercado' },
      { tipo: 'massa', d: ret(X0 - 30, CHAO - 16, 260, 3, 0.5), cor: '#e9dcc0', semVolume: true },
      { tipo: 'massa', d: `M362 ${CHAO}v-18l12-10 12 10v18z`, cor: '#b5573a', marca: 'casinha' },
      { tipo: 'massa', d: `M369 ${CHAO}v-8a5 5 0 0 1 10 0v8z`, cor: ESCURO, semVolume: true }
    ]
  }),
  pets: () => loja({
    // O aquário iluminado, a gaiola com o passarinho, a placa com a pata.
    parede: '#7fb3a8', placa: { cor: '#e2b72d', texto: 'PET SHOP', tinta: ESCURO, simbolo: simPata(ESCURO) }, porta: 'dir', toldo: { cor: '#e2b72d', listra: BRANCO },
    interior: [
      { tipo: 'massa', d: ret(164, 66, 56, 36, 2), cor: '#8fc6d8', opacidade: 0.9, marca: 'aquario' },
      { tipo: 'massa', d: 'M180 82q6-6 12 0q-6 6-12 0zM192 82l5-4v8z', cor: '#e07b2c', semVolume: true, marca: 'peixe' },
      { tipo: 'massa', d: 'M200 92q5-4 10 0q-5 4-10 0zM210 92l4-3v6z', cor: '#e2b72d', semVolume: true },
      { tipo: 'linha', d: 'M168 98c6-6 4-12 0-16M214 98c-4-8-2-12 2-16', larg: 1.2, cor: '#3f9a52' },
      { tipo: 'massa', d: ret(160, 102, 64, 8, 1), cor: '#6e3f22' },
      { tipo: 'linha', d: 'M240 104c0-34 40-34 40 0M246 104V80M253 104V73M260 104V70M267 104V73M274 104V80', larg: 0.9, cor: '#8d8a85', marca: 'gaiola' },
      { tipo: 'massa', d: elipse(260, 92, 6, 4.4) + circulo(265, 88, 3), cor: '#e2c32d', semVolume: true, marca: 'passarinho' },
      { tipo: 'massa', d: ret(236, 104, 48, 4, 1), cor: '#8d8a85' }
    ]
  }),
  estilo: () => loja({
    // A boutique: o toldo listrado, o manequim com o chapéu, os óculos na placa.
    parede: '#2f3a4a', placa: { cor: '#e9e2d2', texto: 'ÓTICA & MODA', tinta: '#2f3a4a', simbolo: simOculos('#2f3a4a') }, porta: 'dir', toldo: { cor: '#2f3a4a', listra: '#e9e2d2' },
    interior: [
      { tipo: 'massa', d: circulo(200, 60, 6), cor: '#e8d3bd', marca: 'manequim' },
      { tipo: 'massa', d: elipse(200, 54, 11, 2.4) + ret(194, 46, 12, 8, 2), cor: '#8a4a1c', marca: 'chapeu' },
      { tipo: 'massa', d: suave([[190, 70], [210, 70], [214, 98], [186, 98]], true, 0.3), cor: '#b5573a', marca: 'roupa' },
      { tipo: 'metal', d: ret(198.8, 98, 2.4, 10, 0.5) + ret(190, 106, 20, 3, 1), cor: '#8d8a85' },
      { tipo: 'massa', d: ret(236, 84, 44, 24, 2), cor: '#e9e2d2', marca: 'balcao' },
      { tipo: 'linha', d: `${circulo(250, 78, 4)}${circulo(262, 78, 4)}M254 78h4`, larg: 1.4, cor: ESCURO, marca: 'oculos' },
      { tipo: 'massa', d: ret(286, 52, 4, 56, 1), cor: '#d6ad45', semVolume: true, marca: 'espelho' }
    ]
  }),
  clinica: () => loja({
    // O branco, a cruz verde, a recepção limpa, a planta.
    parede: '#f1efea', placa: { cor: '#3f8a6a', texto: 'CLÍNICA', simbolo: simCruz(BRANCO) }, porta: 'dir', luz: '#e4eef0',
    interior: [
      balcao(BRANCO, 176, 266),
      { tipo: 'massa', d: ret(176, 84, 90, 4, 1), cor: '#3f8a6a', semVolume: true },
      { tipo: 'massa', d: ret(270, 94, 14, 16, 2), cor: '#b5573a', marca: 'vaso' },
      { tipo: 'massa', d: suave([[277, 94], [266, 76], [276, 82], [280, 64], [284, 80], [292, 74], [280, 94]], true, 0.4), cor: '#4f7a4b', semVolume: true, marca: 'planta' },
      { tipo: 'massa', d: ret(196, 56, 50, 20, 1), cor: '#dfe5e8', marca: 'quadro' }
    ]
  }),
  eletronicos: () => loja({
    // A fachada de painel escuro, a luz azul, as telas acesas na vitrine.
    parede: '#30363e', placa: { cor: '#2f6db3', texto: 'ELETRÔNICOS', simbolo: simTela(BRANCO) }, porta: 'dir', luz: '#dfe6ea',
    interior: [
      { tipo: 'massa', d: ret(170, 56, 52, 32, 1.5), cor: ESCURO, marca: 'tela' }, { tipo: 'vidro', d: ret(173, 59, 46, 26, 1) },
      { tipo: 'massa', d: ret(230, 62, 40, 26, 1.5), cor: ESCURO }, { tipo: 'vidro', d: ret(233, 65, 34, 20, 1) },
      balcao('#c9ccd0', 166, 280)
    ],
    frente: [{ tipo: 'luz', d: ret(X0, CHAO - 3, X1 - X0, 2, 0.5), cor: '#7cc0d6' }]
  }),
  casa: () => loja({
    // A loja de casa: a madeira clara, o toldo, a geladeira e a máquina na vitrine.
    parede: '#d9c9a6', placa: { cor: '#b5573a', texto: 'CASA & LAR', simbolo: simCasa(BRANCO) }, porta: 'dir', toldo: { cor: '#b5573a', listra: '#f2e3c6' },
    interior: [
      { tipo: 'massa', d: ret(172, 54, 30, 56, 2), cor: '#ece9e4', marca: 'geladeira' }, { tipo: 'linha', d: 'M172 74h30M197 60v8M197 80v10', larg: 1 },
      { tipo: 'massa', d: ret(210, 74, 34, 36, 2), cor: '#ece9e4', marca: 'maquina' }, { tipo: 'metal', d: circulo(227, 94, 10), cor: '#cfcbc4' }, { tipo: 'vidro', d: circulo(227, 94, 7) },
      { tipo: 'massa', d: ret(250, 82, 30, 18, 6), cor: '#6f7a3c', marca: 'poltrona' }, { tipo: 'massa', d: ret(252, 98, 3, 10, 1) + ret(275, 98, 3, 10, 1), cor: '#5a3a24', semVolume: true }
    ]
  }),
  instrumentos: () => loja({
    // Madeira escura, a nota na placa, o violão e a guitarra pendurados.
    parede: '#5a3a24', textura: 'ripas', placa: { cor: '#e9dcc0', texto: 'MÚSICA', tinta: '#5a3a24', simbolo: simNota('#5a3a24') }, porta: 'dir', luz: '#efe2c4',
    interior: [
      { tipo: 'massa', d: suave([[190, 70], [198, 72], [200, 80], [206, 90], [202, 104], [190, 108], [178, 104], [174, 90], [180, 80], [182, 72]], true, 0.5), cor: '#d9a86a', marca: 'violao' },
      { tipo: 'massa', d: circulo(190, 88, 4), cor: '#2e1d12', semVolume: true }, { tipo: 'massa', d: ret(188, 52, 4, 20, 1), cor: '#6e3f22' },
      { tipo: 'massa', d: suave([[232, 80], [238, 74], [244, 80], [250, 76], [252, 86], [248, 98], [234, 104], [222, 98], [224, 86]], true, 0.48), cor: '#a8281f', marca: 'guitarra' },
      { tipo: 'massa', d: ret(237, 50, 4, 26, 1), cor: '#d9a86a' },
      { tipo: 'massa', d: ret(262, 82, 22, 28, 2), cor: ESCURO, marca: 'amplificador' }
    ]
  }),
  esportes: () => loja({
    parede: '#3f7a52', placa: { cor: BRANCO, texto: 'ESPORTES', tinta: '#2c4f3a', simbolo: simBola(BRANCO) }, porta: 'dir', toldo: { cor: '#2c4f3a' },
    interior: [
      { tipo: 'massa', d: circulo(184, 98, 12), cor: BRANCO, marca: 'bola' }, { tipo: 'massa', d: 'M184 92l5 3-2 6h-6l-2-6z', cor: ESCURO, semVolume: true },
      { tipo: 'linha', d: `${elipse(222, 68, 10, 13)}M222 81v20`, larg: 2, cor: '#c8372d', marca: 'raquete' },
      { tipo: 'massa', d: suave([[246, 102], [252, 92], [262, 92], [266, 98], [282, 102], [282, 108], [246, 108]], true, 0.35), cor: '#2f6db3', marca: 'tenis' }
    ]
  }),
relojoaria: () => loja({
    // Pedra escura, placa dourada, o relógio grande na fachada; na vitrine, relógios de pulso em almofadas de veludo.
    parede: '#22313a', textura: 'pedra', placa: { cor: '#c9a54a', texto: 'RELOJOARIA', tinta: '#1d2226', simbolo: simRelogio('#1d2226') }, porta: 'dir', luz: '#f1e7cf',
    interior: [
      ...[0, 1, 2].flatMap(k => [...almofada(176 + k * 34, 92, '#5b1f2c'), ...relogioDePulso(176 + k * 34, 84, k === 1 ? '#c9a54a' : '#c7c7c7', k === 0 ? '#2b2826' : k === 1 ? '#7a4a24' : '#9aa0a6')]),
      { tipo: 'massa', d: ret(164, 99, 104, 9, 1), cor: '#3a2a20', marca: 'balcao' },
      ...lampada(192, 52), ...lampada(242, 52)
    ],
    frente: [{ tipo: 'metal', d: ret(X0 - 4, 22, 3, 24, 0.5), cor: '#8d8a85' }, { tipo: 'metal', d: circulo(X0 - 3, 50, 10), cor: '#c9a54a', marca: 'relogio-rua' }, { tipo: 'massa', d: circulo(X0 - 3, 50, 7.6), cor: '#f4f1ea', semVolume: true }, { tipo: 'linha', d: `M${X0 - 3} 50v-5.5M${X0 - 3} 50l4 2.5`, larg: 1, cor: ESCURO }]
  }),
  joalheria: () => loja({
    // Mármore claro, placa preta com letras douradas, o diamante; na vitrine, o busto com o colar e os anéis no expositor.
    parede: '#e8e2d6', textura: 'pedra', placa: { cor: '#161616', texto: 'JOALHERIA', tinta: '#d8b65a', simbolo: simDiamante('#d8b65a') }, porta: 'dir', toldo: { cor: '#161616' }, luz: '#f6efe0',
    interior: [
      { tipo: 'massa', d: `M186 106c0-14 6-20 14-22v-8a7 7 0 1 1 8 0v8c8 2 14 8 14 22z`, cor: '#2b2826', marca: 'busto' },
      { tipo: 'linha', d: 'M192 90q12 12 24 0', larg: 1.4, cor: '#d8b65a', marca: 'colar' }, { tipo: 'massa', d: `M202.5 100l1.5-3 1.5 3-1.5 2z`, cor: '#9fd4e8', semVolume: true },
      { tipo: 'massa', d: ret(232, 92, 44, 14, 1.5), cor: '#2b2826', marca: 'expositor' }, { tipo: 'vidro', d: ret(232, 80, 44, 12, 1), claro: true },
      ...[0, 1, 2].flatMap((k): Peca[] => [{ tipo: 'linha', d: circulo(241 + k * 13, 90, 3), larg: 1.2, cor: '#d8b65a' }, { tipo: 'massa', d: circulo(241 + k * 13, 86.5, 1.4), cor: ['#9fd4e8', '#c8402a', '#3f9b4a'][k], semVolume: true }])
    ]
  }),
  galeria: () => ({
    // A caixa branca: fachada lisa, vidro do chão ao teto, nome pequeno; dentro, quadros com luz e a escultura no pedestal.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0, 8, X1 - X0, CHAO - 8, 0.5), cor: '#f4f2ee', marca: 'predio' },
      { tipo: 'massa', d: ret(X0 + 10, 30, X1 - X0 - 20, CHAO - 32, 0.5), cor: '#fbfaf7', marca: 'vitrine' },
      { tipo: 'linha', d: `M${X0 + 10} 30H${X1 - 10}M${X0 + 120} 30V${CHAO - 2}`, larg: 1.2, cor: '#2b2826' },
      { tipo: 'texto', x: 186, y: 22, texto: 'GALERIA', tam: 9, cor: '#2b2826', marca: 'nome' },
      ...simQuadro('#2b2826', 222, 18),
      ...[...quadro(160, 46, 30, 22, '#3d5d8f', '#e2b72d'), ...quadro(204, 42, 22, 30, '#b5573a', '#2b2826'), ...lampada(175, 38), ...lampada(215, 34),
        { tipo: 'massa' as const, d: ret(286, 82, 18, 26, 0.5), cor: '#e7e3dc', marca: 'pedestal' }, { tipo: 'massa' as const, d: suave([[288, 82], [292, 64], [298, 60], [302, 70], [300, 82]], true, 0.5), cor: '#8a5a32', marca: 'escultura' }
      ].map(p => ({ ...p, classe: 'fachada__interior' })),
      { tipo: 'massa', d: ret(X1 - 54, 52, 30, CHAO - 54, 0.5), cor: '#e4e1db', marca: 'porta' }
    ]
  }),
  antiquario: () => loja({
    // Madeira escura e envelhecida, placa bordô com o vaso; dentro, o relógio de pé, a poltrona, o candelabro, o gramofone.
    parede: '#4a3324', textura: 'ripas', placa: { cor: '#6b2430', texto: 'ANTIQUÁRIO', tinta: '#e9dcc0', simbolo: simVaso('#e9dcc0') }, porta: 'esq', luz: '#e8d4a8',
    interior: [
      { tipo: 'massa', d: ret(208, 52, 16, 56, 2), cor: '#6e3f22', marca: 'relogio-pe' }, { tipo: 'massa', d: circulo(216, 62, 5), cor: '#efe2c4', semVolume: true }, { tipo: 'linha', d: 'M216 62v-3M216 62l2.4 1.4M216 72v18', larg: 0.8, cor: ESCURO },
      { tipo: 'massa', d: suave([[236, 108], [236, 86], [244, 80], [262, 80], [268, 88], [268, 108]], true, 0.3), cor: '#7a2f2f', marca: 'poltrona' },
      { tipo: 'massa', d: ret(276, 98, 18, 10, 1), cor: '#6e3f22' }, { tipo: 'massa', d: 'M280 98l-2-14q8-6 14 2l-4 12z', cor: '#c9a23a', semVolume: true, marca: 'gramofone' },
      { tipo: 'linha', d: 'M250 50v8M240 62q10 6 20 0M240 62v4M250 62v4M260 62v4', larg: 1, cor: '#c9a23a', marca: 'lustre' }
    ]
  }),
  memorabilia: () => loja({
    // Verde de gramado, placa com a taça; dentro, a camisa emoldurada, a taça, a bola autografada e as flâmulas.
    parede: '#1f4d36', placa: { cor: '#f2efe9', texto: 'MEMORABILIA', tinta: '#1f4d36', simbolo: simTaca('#1f4d36') }, porta: 'dir', toldo: { cor: '#f2efe9', listra: '#1f4d36' }, luz: '#f1eee6',
    interior: [
      { tipo: 'massa', d: ret(166, 50, 40, 46, 1), cor: '#2b2826', marca: 'moldura' }, { tipo: 'massa', d: 'M174 58l8-4h12l8 4 4 8-5 2-1-3v24h-24v-24l-1 3-5-2z', cor: '#c8372d', semVolume: true, marca: 'camisa' },
      { tipo: 'texto', x: 186, y: 76, texto: '10', tam: 8, cor: BRANCO },
      ...simTaca('#d8b65a', 230, 84).map(p => ({ ...p, marca: 'taca' })), { tipo: 'massa', d: ret(220, 98, 20, 10, 1), cor: '#6e3f22' },
      { tipo: 'massa', d: circulo(262, 96, 8), cor: BRANCO, marca: 'bola' }, { tipo: 'linha', d: 'M257 94q3 3 8-1', larg: 0.7, cor: '#2f6db3' },
      { tipo: 'massa', d: 'M248 54h30l-30 8z', cor: '#e2b72d', semVolume: true, marca: 'flamula' }
    ]
  }),
  leilao: () => ({
    // O casarão de pedra, os estandartes da temporada, as portas altas; dentro, a tribuna com o martelo e o lote no cavalete.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0, 18, X1 - X0, CHAO - 18, 0), cor: '#cfc6b4', marca: 'predio' },
      ...textura('pedra', '#cfc6b4', 18),
      { tipo: 'massa', d: ret(X0 - 6, 14, X1 - X0 + 12, 8, 0), cor: '#b8ad98', semVolume: true },
      { tipo: 'massa', d: ret(X0 + 30, 26, 140, 18, 1), cor: '#4a1f2a', marca: 'placa' },
      ...simMartelo('#e9dcc0', 196, 35),
      { tipo: 'texto', x: 246, y: 39, texto: 'LEILÕES', tam: 10, cor: '#e9dcc0', marca: 'nome' },
      { tipo: 'massa', d: ret(X0 + 28, 52, 104, CHAO - 54, 1), cor: '#efe6d2', marca: 'vitrine' },
      ...[{ tipo: 'massa' as const, d: ret(170, 84, 22, 24, 1), cor: '#5a3a24', marca: 'tribuna' }, ...simMartelo('#2b2826', 181, 78), ...quadro(214, 58, 34, 26, '#4f7a4b', '#e2b72d'),
        { tipo: 'linha' as const, d: 'M218 84l-6 24M244 84l6 24M231 84v24', larg: 1.2, cor: '#5a3a24' }].map(p => ({ ...p, classe: 'fachada__interior' })),
      { tipo: 'massa', d: ret(X1 - 52, 50, 36, CHAO - 50, 1), cor: '#3a2a20', marca: 'porta' },
      ...[X0 - 14, X1 + 6].flatMap((x): Peca[] => [{ tipo: 'metal', d: ret(x + 3, 10, 2, 50, 0.5), cor: '#8d8a85' }, { tipo: 'massa', d: `M${x - 4} 14h16v34l-8-5-8 5z`, cor: '#4a1f2a', marca: 'estandarte' }])
    ]
  }),
  exoticos: () => loja({
    // Verde tropical, a folha na placa; dentro, o terrário com o lagarto, a arara no poleiro e o aquário marinho.
    parede: '#2f5a3f', placa: { cor: '#e2c24a', texto: 'EXÓTICOS', tinta: '#1f3a28', simbolo: simFolha('#1f3a28') }, porta: 'dir', luz: '#e9f0e4',
    interior: [
      { tipo: 'massa', d: ret(162, 80, 44, 26, 1.5), cor: '#c9b98a', marca: 'terrario' }, { tipo: 'vidro', d: ret(162, 72, 44, 8, 1), claro: true },
      { tipo: 'massa', d: 'M170 98q6-6 14-2l8-2q4 2 0 4l-8 1q-8 4-14-1z', cor: '#e0a33a', semVolume: true, marca: 'lagarto' },
      { tipo: 'linha', d: 'M214 60v48M206 64h22', larg: 1.4, cor: '#6e3f22' },
      { tipo: 'massa', d: elipse(222, 56, 5, 7) + circulo(225, 49, 4), cor: '#2f6db3', semVolume: true, marca: 'arara' }, { tipo: 'massa', d: elipse(222, 60, 3, 4), cor: '#e2b72d', semVolume: true }, { tipo: 'massa', d: 'M220 62l-3 14 5-12z', cor: '#2f6db3', semVolume: true },
      { tipo: 'massa', d: ret(240, 66, 44, 30, 2), cor: '#2a5f9a', opacidade: 0.85, marca: 'aquario-marinho' },
      { tipo: 'massa', d: 'M256 80q5-5 10 0q-5 5-10 0zM266 80l4-3v6z', cor: '#e07b2c', semVolume: true, marca: 'palhaco' }, { tipo: 'linha', d: 'M259 76v8M263 76v8', larg: 1, cor: BRANCO },
      { tipo: 'massa', d: ret(238, 96, 48, 10, 1), cor: '#3a3a3a' }
    ]
  }),
  feira: () => ({
    // A feira de domingo: duas barracas de lona listrada, as mesas com o que for (um abajur, um relógio, um vaso), sem prédio.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0 - 20, 96, X1 - X0 + 40, CHAO - 96, 0), cor: '#cfc8bb', semVolume: true, marca: 'chao' },
      ...[0, 1].flatMap((k): Peca[] => {
        const x = X0 - 10 + k * 112;
        return [
          { tipo: 'massa', d: `M${x} 46L${x + 50} 30L${x + 100} 46Z`, cor: k ? '#2f6db3' : '#c8372d', marca: 'lona' },
          { tipo: 'massa', d: Array.from({ length: 5 }, (_, j) => `M${x + 10 + j * 20} ${46 - (j < 3 ? j : 4 - j) * 4.8}l10 ${-2.4}v${(j < 2 ? 2.4 : -2.4)}z`).join(''), cor: BRANCO, semVolume: true, opacidade: 0.6 },
          { tipo: 'metal', d: ret(x + 2, 46, 2, 50, 0.5) + ret(x + 96, 46, 2, 50, 0.5), cor: '#8d8a85' },
          { tipo: 'massa', d: ret(x + 4, 86, 92, 6, 1), cor: '#8a5a32', marca: 'mesa' },
          { tipo: 'massa', d: k ? `${circulo(x + 30, 80, 5)}${ret(x + 54, 72, 8, 14, 1)}` : `${ret(x + 20, 70, 4, 16, 0.5)}M${x + 14} 70l8-10 8 10z${elipse(x + 64, 80, 9, 5)}`, cor: k ? '#c9a23a' : '#b0563f', semVolume: true, classe: 'fachada__interior', marca: 'achados' }
        ];
      }),
      { tipo: 'massa', d: ret(212, 34, 56, 12, 2), cor: '#e2b72d', marca: 'placa' }, { tipo: 'texto', x: 240, y: 43, texto: 'FEIRA', tam: 7.5, cor: ESCURO, marca: 'nome' }
    ]
  }),
  antiquario_vago: () => loja({
    // A loja que já viu dias melhores: placa desbotada ("compro e vendo"), vitrine empoeirada, caixas empilhadas.
    parede: '#8b7a64', textura: 'tijolo', placa: { cor: '#b9a98a', texto: 'COMPRO E VENDO', tinta: '#4a3f33' }, porta: 'esq', luz: '#d9cbb0',
    interior: [
      { tipo: 'massa', d: ret(216, 86, 26, 22, 1) + ret(244, 92, 22, 16, 1) + ret(226, 70, 22, 16, 1), cor: '#a8865a', marca: 'caixas' },
      { tipo: 'massa', d: ret(274, 64, 14, 44, 1), cor: '#6e3f22', marca: 'armario' }, { tipo: 'massa', d: circulo(281, 74, 4), cor: '#efe2c4', semVolume: true },
      { tipo: 'massa', d: ret(198, 46, 136, 62, 0), cor: '#b5ad9c', opacidade: 0.25, semVolume: true, marca: 'poeira' }
    ],
    frente: [{ tipo: 'massa', d: ret(X0 + 22, 30, 50, 4, 1), cor: '#6b5a48', semVolume: true, opacidade: 0.5 }]
  }),
  privada_incerta: () => ({
    // A negociação privada: a portaria de um prédio residencial elegante, o interfone, a plaquinha discreta — nenhuma vitrine.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0, 4, X1 - X0, CHAO - 4, 0), cor: '#d9d4ca', marca: 'predio' },
      ...[0, 1, 2].flatMap((k): Peca[] => [0, 1, 2, 3].map(j => ({ tipo: 'vidro', d: ret(X0 + 14 + j * 46, 10 + k * 22, 30, 14, 1) }))),
      { tipo: 'massa', d: ret(212, 74, 56, CHAO - 74, 1), cor: '#2b2826', marca: 'portaria' }, { tipo: 'vidro', d: ret(216, 78, 48, 30, 1) },
      { tipo: 'massa', d: ret(272, 84, 10, 14, 1), cor: '#8d8a85', marca: 'interfone' }, { tipo: 'massa', d: ret(274, 88, 6, 2, 0.5) + ret(274, 92, 6, 2, 0.5), cor: '#2b2826', semVolume: true },
      { tipo: 'metal', d: ret(196, 82, 12, 8, 0.5), cor: '#c9a23a', marca: 'plaquinha' }
    ]
  }),
  por_fora: () => ({
    // O mercado por fora: o fundo de um galpão numa rua sem saída, a porta de enrolar meio aberta, a luz fraca, sem placa.
    vb: [480, 120],
    pecas: [
      ...rua(),
      { tipo: 'massa', d: ret(X0 - 6, 20, X1 - X0 + 12, CHAO - 20, 0), cor: '#55524e', marca: 'galpao' },
      ...textura('tijolo', '#55524e', 20),
      { tipo: 'massa', d: ret(190, 50, 100, 30, 0.5), cor: '#7d7973', marca: 'porta-enrolar' },
      { tipo: 'linha', d: Array.from({ length: 7 }, (_, k) => `M190 ${54 + k * 4}H290`).join(''), larg: 0.6, cor: '#5d5a55' },
      { tipo: 'massa', d: ret(190, 80, 100, CHAO - 80, 0), cor: '#1f1d1b', marca: 'fresta' },
      { tipo: 'luz', d: 'M226 80h28l14 32h-56z', cor: '#e0c97a' },
      { tipo: 'massa', d: ret(156, 92, 22, 20, 1) + ret(162, 76, 16, 16, 1), cor: '#7a5a3a', marca: 'caixotes' },
      { tipo: 'linha', d: 'M300 40q6-6 12 0t12 0', larg: 1.6, cor: '#c8372d', marca: 'pichacao' }
    ]
  }),
  livraria: () => loja({
    // A livraria clássica: a madeira verde-escura, as prateleiras cheias na vitrine, o livro aberto na placa.
    parede: '#2c4a3e', placa: { cor: '#d6ad45', texto: 'LIVRARIA', tinta: ESCURO, simbolo: simLivro(ESCURO) }, porta: 'dir', luz: '#efe2c4',
    interior: [...prateleiras(160, 284, ['#b0563f', '#3d5d8f']), { tipo: 'linha', d: 'M160 102H284', larg: 1, cor: '#8a5a32' }, { tipo: 'massa', d: Array.from({ length: 14 }, (_, k) => ret(162 + k * 8.8, 90 - (k % 3), 6, 12 + (k % 3), 0.5)).join(''), cor: '#4f7a4b', semVolume: true }]
  })
};

/** A fachada de um lugar (o mesmo desenho sempre: nada vem do save). */
const FACHADAS = lembrar<Amostra>(64);
/**
 * REWORK 9 — de que lado fica a porta de cada loja de rua (as que têm porta lateral; a vitrine ocupa o resto). A
 * vitrine de Compras põe os objetos na frente do VIDRO, não da porta. Conferido contra o desenho em `rework9.test`.
 */
export const PORTA_DA_FACHADA: Partial<Record<LugarDaCidade, 'esq' | 'dir'>> = {
  alugar: 'esq', nautica: 'esq', motos: 'dir', oficina: 'dir', pets: 'dir', estilo: 'dir', clinica: 'dir', eletronicos: 'dir', casa: 'dir', instrumentos: 'dir', esportes: 'dir', livraria: 'dir',
  relojoaria: 'dir', joalheria: 'dir', antiquario: 'esq', memorabilia: 'dir', exoticos: 'dir', antiquario_vago: 'esq'
};

export function amostraDaFachada(lugar: LugarDaCidade): Amostra {
  return FACHADAS(lugar, () => (LOJAS[lugar] ?? LOJAS.casa)());
}
export const LUGARES_DA_CIDADE = Object.keys(LOJAS) as LugarDaCidade[];
