/**
 * REWORK 8 (Fase B) — as casas na mesma linguagem dos carros, das coisas e das fachadas: a parede no material dela
 * (o reboco, a cal do sítio, o tijolo à vista, o vidro da torre, a cor da fachada quando a casa tem uma), o telhado de
 * barro, a laje de concreto, o vidro com reflexo, a janela ACESA em luz quente (quem mora ali), a porta de madeira.
 * Cada forma tem a sua silhueta (a do pacote de casas: o prédio baixo com a caixa-d'água não é a torre com portaria)
 * e o estado aparece com forma (a mancha de umidade, a rachadura, o andaime, a lata de tinta), nunca só com cor.
 *
 * Quadro de 312 × 140, chão em y = 128 (a cena da Casa). Os contratos de antes continuam: `.cena__janela--acesa`,
 * `.cena__veiculo`, `.cena__bicho`, `data-condicao` e `data-detalhe`.
 */
import type { FormaDaCasa } from '../leituraMaterial';
import type { FormaVeiculo } from '../../motor/dados/bens';
import { cantos, circulo, clarear, elipse, escurecer, hash, membro, ret, suave, type Amostra, type Peca } from './nucleo';
import { amostraDoVeiculo } from './veiculos';

export const CHAO_CASA = 128;
const C = CHAO_CASA;
const TELHA = '#a8583e', LAJE = '#b9b3a8', MADEIRA = '#7a4f2e', FOLHA = '#6f8f4e', TRONCO = '#7a5236', LUZ = '#f2d27a', METAL = '#8d8a85';
const TIJOLO = '#b06a4c', BRANCO_AGUA = '#e9f3f6';

/** Um grupo marcado (as classes e os atributos dos contratos ficam no `<g>`, sem a folha de estilo mexer na tinta). */
const marcado = (classe: string | undefined, attrs: Record<string, string> | undefined, pecas: Peca[]): Peca => ({ tipo: 'grupo', t: '', pecas, classe, attrs });

/* ---------------------------------------------------------- Peças da casa */

const parede = (x: number, y: number, l: number, a: number, cor: string): Peca => ({ tipo: 'massa', d: ret(x, y, l, a, 1), cor, marca: 'parede' });
const porta = (x: number, y: number, l = 14, a = C - y, cor = MADEIRA): Peca[] => [
  { tipo: 'massa', d: ret(x, y, l, a, 1), cor, marca: 'porta' },
  { tipo: 'metal', d: circulo(x + l - 3.4, y + a * 0.55, 1.1), cor: '#c9a23a', fino: true }
];
/** As janelas, na ordem dada (a primeira é a sua): as `acesas` em luz quente, as outras em vidro. */
function janelas(pos: [number, number, number?, number?][], acesas: number, l = 14, a = 14, moldura?: string): Peca[] {
  return pos.flatMap(([x, y, pl, pa], k): Peca[] => {
    const w = pl ?? l, h = pa ?? a, acesa = k < acesas;
    const vidro: Peca = acesa ? { tipo: 'luz', d: ret(x, y, w, h, 1), cor: LUZ, marca: 'janela' } : { tipo: 'vidro', d: ret(x, y, w, h, 1), marca: 'janela' };
    return [
      ...(moldura ? [{ tipo: 'massa' as const, d: ret(x - 1.6, y - 1.6, w + 3.2, h + 3.2, 1.2), cor: moldura, semVolume: true }] : []),
      marcado(acesa ? 'cena__janela cena__janela--acesa' : 'cena__janela', undefined, [vidro]),
      ...(w >= 10 && h >= 10 ? [{ tipo: 'linha' as const, d: `M${x + w / 2} ${y}v${h}`, larg: 0.8, cor: escurecer(moldura ?? '#e9e4da', 0.1), fino: true }] : [])
    ];
  });
}
const duasAguas = (x0: number, x1: number, base: number, topo: number, cor = TELHA, beiral = 4): Peca =>
  ({ tipo: 'massa', d: cantos([[x0 - beiral, base, 1], [(x0 + x1) / 2, topo, 1.5], [x1 + beiral, base, 1]]), cor, marca: 'telhado' });
const laje = (x: number, y: number, l: number, h = 4, cor = LAJE): Peca => ({ tipo: 'massa', d: ret(x - 3, y - h, l + 6, h, 0.8), cor, marca: 'laje' });
function tijolos(x: number, y: number, l: number, a: number, cor: string): Peca {
  const d: string[] = [];
  for (let k = 0, yy = y + 6; yy < y + a - 1; k++, yy += 6) {
    d.push(`M${x + 1} ${yy}h${l - 2}`);
    for (let xx = x + (k % 2 ? 6 : 12); xx < x + l - 2; xx += 12) d.push(`M${xx} ${yy}v-6`);
  }
  return marcado('cena__tijolo', { 'data-detalhe': 'tijolo' }, [{ tipo: 'linha', d: d.join(''), larg: 0.6, cor: clarear(cor, 0.35) }]);
}
const grade = (x: number, y: number, l: number, a: number, passo = 4): Peca =>
  ({ tipo: 'linha', d: Array.from({ length: Math.max(0, Math.ceil(l / passo) - 1) }, (_, k) => `M${x + passo * (k + 1)} ${y}v${a}`).join(''), larg: 0.9, cor: '#4a4643', marca: 'grade' });
const arvore = (x: number, r = 13, tronco = 16, cor = FOLHA): Peca => marcado('cena__arvore', undefined, [
  { tipo: 'massa', d: membro([[x, C], [x, C - tronco - 4]], [3.4, 2.4]), cor: TRONCO, semVolume: true },
  { tipo: 'massa', d: suave([[x - r, C - tronco - r * 0.6], [x - r * 0.7, C - tronco - r * 1.5], [x, C - tronco - r * 2], [x + r * 0.75, C - tronco - r * 1.6], [x + r, C - tronco - r * 0.7], [x + r * 0.4, C - tronco - r * 0.05], [x - r * 0.5, C - tronco]], true, 0.6), cor, marca: 'copa' }
]);
const palmeira = (x: number): Peca => marcado('cena__arvore', undefined, [
  { tipo: 'massa', d: membro([[x, C], [x - 2, C - 20], [x + 2, C - 38]], [3.4, 2.8, 2.2]), cor: '#9a7a52', semVolume: true },
  ...[[-16, 4], [16, 4], [-12, -10], [12, -10], [0, -14]].map(([dx, dy]): Peca => ({ tipo: 'massa', d: membro([[x + 2, C - 38], [x + 2 + dx * 0.55, C - 40 + dy * 0.7], [x + 2 + dx, C - 38 + dy]], [1, 4, 0.6]), cor: '#5f8a4c', semVolume: true, marca: 'folha' }))
]);
const arbustos = (x: number, l: number): Peca => ({ tipo: 'massa', d: suave([[x, C], ...Array.from({ length: Math.ceil(l / 10) }, (_, k): [number, number] => [x + 5 + k * 10, C - 9 - (k % 2) * 2]), [x + l, C]], true, 0.5), cor: '#5f8a4c', marca: 'arbusto' });
const vaso = (x: number): Peca[] => [
  { tipo: 'massa', d: `M${x} ${C}l1.6-7h8.8l1.6 7z`, cor: '#b5573a', semVolume: true, marca: 'vaso' },
  { tipo: 'massa', d: suave([[x + 6, C - 7], [x, C - 14], [x + 4, C - 18], [x + 7, C - 13], [x + 11, C - 17], [x + 12, C - 11]], true, 0.5), cor: '#5f8a4c', semVolume: true }
];
function varal(x1: number, x2: number, y: number): Peca {
  const meio = (x1 + x2) / 2;
  const cores = ['#c8372d', '#3d5d8f', '#e2b72d', '#e9e4da'];
  return marcado(undefined, { 'data-detalhe': 'varal' }, [
    { tipo: 'linha', d: `M${x1} ${C}V${y - 2}M${x2} ${C}V${y - 2}`, larg: 1.2, cor: METAL },
    { tipo: 'linha', d: `M${x1} ${y}Q${meio} ${y + 6} ${x2} ${y}`, larg: 0.7, cor: '#4a4643' },
    ...[x1 + 8, x1 + 22, meio + 4, x2 - 16].map((x, k): Peca => ({ tipo: 'massa', d: k % 2 ? ret(x, y + 3, 9, 10, 0.5) : `M${x} ${y + 3}l-3 4 2 1v8h8v-8l2-1-3-4z`, cor: cores[k], semVolume: true, marca: 'roupa' }))
  ]);
}
const caixaDagua = (x: number, y: number): Peca => marcado(undefined, { 'data-detalhe': 'caixa-dagua' }, [
  { tipo: 'massa', d: cantos([[x, y, 1], [x + 20, y, 1], [x + 19, y + 13, 1], [x + 1, y + 13, 1]]), cor: '#5f8fb0', marca: 'caixa-dagua' },
  { tipo: 'massa', d: ret(x - 2, y - 3, 24, 4, 1.5), cor: '#4f7a96', semVolume: true }
]);
const sombraDoTelhado = (x: number, y: number, l: number): Peca => ({ tipo: 'massa', d: ret(x, y, l, 3, 0), cor: '#000000', opacidade: 0.12, semVolume: true });

/* ---------------------------------------------------------- As formas */

interface Planta { parede: { x: number; y: number; l: number; a: number }; vaga: number; bichos: number; tijolo: boolean; cor: string }
export const PLANTAS: Record<FormaDaCasa, Planta> = {
  republica: { parede: { x: 98, y: 48, l: 116, a: 80 }, vaga: 34, bichos: 240, tijolo: true, cor: '#d9c3a0' },
  kitnet: { parede: { x: 66, y: 62, l: 176, a: 66 }, vaga: 16, bichos: 262, tijolo: false, cor: '#cfc6b8' },
  apto_1q: { parede: { x: 118, y: 56, l: 76, a: 72 }, vaga: 34, bichos: 234, tijolo: false, cor: '#d8cdb9' },
  apto_2q: { parede: { x: 106, y: 28, l: 100, a: 100 }, vaga: 30, bichos: 232, tijolo: false, cor: '#c9bfae' },
  apto_3q: { parede: { x: 116, y: 8, l: 80, a: 120 }, vaga: 30, bichos: 232, tijolo: false, cor: '#bdb6aa' },
  alto_padrao: { parede: { x: 136, y: 10, l: 60, a: 102 }, vaga: 12, bichos: 264, tijolo: false, cor: '#7f97a3' },
  casa_simples: { parede: { x: 120, y: 81, l: 76, a: 47 }, vaga: 34, bichos: 236, tijolo: true, cor: '#d8c6a8' },
  casa_2q: { parede: { x: 112, y: 78, l: 84, a: 50 }, vaga: 22, bichos: 236, tijolo: true, cor: '#e0cfa8' },
  casa_3q: { parede: { x: 130, y: 74, l: 100, a: 54 }, vaga: 64, bichos: 240, tijolo: true, cor: '#d6c8ae' },
  casa_grande: { parede: { x: 62, y: 86, l: 136, a: 42 }, vaga: 196, bichos: 262, tijolo: false, cor: '#ece4d4' },
  sitio: { parede: { x: 100, y: 86, l: 72, a: 42 }, vaga: 40, bichos: 246, tijolo: true, cor: '#efe6d2' },
  familia: { parede: { x: 104, y: 74, l: 104, a: 54 }, vaga: 24, bichos: 236, tijolo: true, cor: '#d9c79f' },
  parente: { parede: { x: 110, y: 88, l: 92, a: 40 }, vaga: 30, bichos: 250, tijolo: true, cor: '#cdbfa6' },
  favor: { parede: { x: 98, y: 68, l: 92, a: 60 }, vaga: 26, bichos: 258, tijolo: true, cor: '#d0c7b8' },
  funcional: { parede: { x: 146, y: 90, l: 50, a: 38 }, vaga: 4, bichos: 262, tijolo: false, cor: '#d8d2bf' }
};

interface Ctx { acesas: number; tijolo: boolean; cor: string }
/** A parede principal com o tijolo (quando à vista). */
const principal = (f: FormaDaCasa, c: Ctx): Peca[] => { const w = PLANTAS[f].parede; const cor = c.tijolo ? TIJOLO : c.cor; return [parede(w.x, w.y, w.l, w.a, cor), ...(c.tijolo ? [tijolos(w.x, w.y, w.l, w.a, cor)] : [])]; };

const FORMAS: Record<FormaDaCasa, (c: Ctx) => Peca[]> = {
  /** Sobrado dividido: muitas janelas pequenas, campainhas, varal na frente. */
  republica: c => [
    duasAguas(98, 214, 50, 20),
    ...principal('republica', c),
    { tipo: 'linha', d: 'M98 88h116', larg: 1, cor: escurecer(c.cor, 0.3) },
    ...janelas([[108, 94], [126, 58], [149, 58], [172, 58], [190, 58], [108, 58], [126, 94], [172, 94], [190, 94]], c.acesas, 12, 12, '#efe9dc'),
    ...porta(149, 104),
    marcado(undefined, { 'data-detalhe': 'campainhas' }, [{ tipo: 'massa', d: [108, 112, 116, 120].map(y => circulo(168, y, 1.4)).join(''), cor: '#4a4643', semVolume: true }]),
    varal(230, 296, 90)
  ],
  /** Corredor de kitnets: portas iguais lado a lado, dois pisos, escada de fora. */
  kitnet: c => {
    const w = PLANTAS.kitnet.parede, uw = w.l / 5;
    const un: Peca[] = [];
    for (let piso = 0; piso < 2; piso++) for (let u = 0; u < 5; u++) {
      const ux = w.x + u * uw, sua = piso === 0 && u === 1;
      un.push({ tipo: 'massa', d: ret(ux + 6, piso === 0 ? 72 : 108, 9, piso === 0 ? 16 : 20, 0.6), cor: ['#5d6b45', '#7a4f2e', '#3d5d8f', '#7a4f2e', '#5d6b45'][u], semVolume: true, marca: 'porta' });
      un.push(...janelas([[ux + 20, piso === 0 ? 70 : 104, 9, 8]], sua && c.acesas > 0 ? 1 : 0));
    }
    return [
      ...principal('kitnet', c), laje(w.x, w.y, w.l), ...un,
      marcado(undefined, { 'data-detalhe': 'corredor' }, [{ tipo: 'massa', d: ret(w.x, 88, w.l, 8, 0), cor: LAJE, semVolume: true }, grade(w.x, 80, w.l, 8, 11)]),
      { tipo: 'massa', d: membro([[w.x + w.l, 92], [258, 128]], [4, 4]), cor: LAJE, marca: 'escada' },
      { tipo: 'linha', d: 'M246 104h5M250 110h5M254 116h5M257 122h5', larg: 1, cor: '#4a4643' }
    ];
  },
  /** Prédio baixo, três andares, caixa-d'água no alto. */
  apto_1q: c => [caixaDagua(146, 39), ...principal('apto_1q', c), laje(118, 56, 76), ...janelas([[170, 84], [128, 84], [128, 64], [170, 64], [128, 106], [170, 106]], c.acesas, 14, 12, '#efe9dc'), grade(128, 106, 14, 12), grade(170, 106, 14, 12), ...porta(149, 108, 14, 20, '#4a4643'), arvore(214, 11, 14)],
  /** Prédio médio, cinco andares, marquise na entrada e antena no alto. */
  apto_2q: c => {
    const pos: [number, number][] = [];
    for (const y of [72, 54, 90, 36]) for (const x of [149, 116, 182]) pos.push([x, y]);
    return [
      { tipo: 'linha', d: 'M186 28v-12M180 19h12', larg: 1.2, cor: METAL, marca: 'antena' },
      ...principal('apto_2q', c), laje(106, 28, 100),
      ...janelas(pos, c.acesas, 14, 11, '#efe9dc'),
      marcado(undefined, { 'data-detalhe': 'marquise' }, [{ tipo: 'massa', d: ret(132, 106, 48, 4, 1), cor: '#5d646c' }]),
      { tipo: 'vidro', d: ret(146, 110, 20, 18, 1), claro: true, marca: 'porta' },
      { tipo: 'massa', d: ret(110, 120, 32, 8, 0.5) + ret(170, 120, 32, 8, 0.5), cor: LAJE, semVolume: true }, grade(110, 112, 32, 16, 4), grade(170, 112, 32, 16, 4)
    ];
  },
  /** Prédio alto com varandas em todos os andares. */
  apto_3q: c => {
    const andares = [70, 56, 84, 42, 98, 28, 14];
    return [
      ...principal('apto_3q', c), laje(116, 8, 80),
      ...janelas(andares.flatMap(y => [[124, y, 22, 9], [166, y, 22, 9]] as [number, number, number, number][]), c.acesas, 14, 14),
      ...andares.map((y): Peca => marcado('cena__varanda', { 'data-detalhe': 'varanda' }, [{ tipo: 'vidro', d: ret(111, y + 8, 40, 5, 0.5) + ret(161, y + 8, 40, 5, 0.5), claro: true }, { tipo: 'massa', d: ret(110, y + 13, 42, 1.6, 0.4) + ret(160, y + 13, 42, 1.6, 0.4), cor: '#efe9dc', semVolume: true }])),
      { tipo: 'massa', d: ret(138, 110, 36, 4, 1), cor: '#5d646c' },
      { tipo: 'vidro', d: ret(146, 114, 20, 14, 1), claro: true, marca: 'porta' }
    ];
  },
  /** Torre envidraçada: portaria com guarita e cancela, piscina, palmeira. */
  alto_padrao: c => {
    const w = PLANTAS.alto_padrao.parede, cw = w.l / 5, ch = w.a / 8;
    const cel: [number, number, number, number][] = [];
    for (const r of [4, 3, 5, 2, 6, 1, 7, 0]) for (const k of [2, 1, 3, 0, 4]) cel.push([w.x + k * cw + 1.5, w.y + r * ch + 1.5, cw - 3, ch - 3]);
    return [
      { tipo: 'massa', d: cantos([[w.x - 2, w.y, 0], [w.x + w.l / 2, w.y - 8, 0], [w.x + w.l + 2, w.y, 0]]), cor: '#5d646c', marca: 'coroa' },
      { tipo: 'massa', d: ret(w.x, w.y, w.l, w.a, 1), cor: '#4f5a62', marca: 'parede' },
      ...cel.map(([x, y, l, a], k): Peca => (k < c.acesas ? marcado('cena__janela cena__janela--acesa', undefined, [{ tipo: 'luz', d: ret(x, y, l, a, 0.5), cor: LUZ }]) : { tipo: 'vidro', d: ret(x, y, l, a, 0.5), claro: true, marca: 'pano' })),
      { tipo: 'massa', d: ret(124, 110, 84, 4, 1), cor: '#2c3238' },
      { tipo: 'vidro', d: ret(128, 114, 76, 14, 0.5), claro: true, marca: 'hall' },
      { tipo: 'linha', d: 'M160 114v14M172 114v14', larg: 1, cor: '#2c3238' },
      marcado(undefined, { 'data-detalhe': 'portaria' }, [
        { tipo: 'massa', d: ret(94, 108, 20, 20, 1), cor: '#e9e4da', marca: 'guarita' },
        { tipo: 'massa', d: ret(91, 105, 26, 4, 1), cor: '#5d646c', semVolume: true },
        { tipo: 'vidro', d: ret(98, 112, 12, 7, 1), claro: true },
        { tipo: 'massa', d: ret(114, 116, 14, 2, 1), cor: '#c8372d', semVolume: true, marca: 'cancela' }
      ]),
      palmeira(78),
      marcado(undefined, { 'data-detalhe': 'piscina' }, [
        { tipo: 'massa', d: ret(210, 121, 48, 7, 2), cor: '#6cb4cf', marca: 'piscina' },
        { tipo: 'linha', d: 'M214 124q3-2 6 0t6 0t6 0t6 0t6 0t6 0', larg: 0.8, cor: BRANCO_AGUA, fino: true },
        { tipo: 'linha', d: 'M252 121v-7h4v7', larg: 1, cor: METAL }
      ])
    ];
  },
  /** Casa simples de laje: ferro para cima, caixa-d'água, janela com grade, poste com fio. */
  casa_simples: c => [
    caixaDagua(150, 59),
    { tipo: 'linha', d: 'M122 77v-9M128 77v-7M188 77v-9M194 77v-7', larg: 1.2, cor: '#7a4a2a', marca: 'ferragem', attrs: { 'data-detalhe': 'ferragem' } },
    ...principal('casa_simples', c), laje(120, 81, 76, 5),
    ...janelas([[130, 92, 16, 14]], c.acesas), grade(130, 92, 16, 14),
    ...porta(168, 100),
    marcado(undefined, { 'data-detalhe': 'poste' }, [{ tipo: 'metal', d: ret(220.8, 56, 2.4, 72, 0.5), cor: '#9a958d' }, { tipo: 'linha', d: 'M216 60h12M222 60Q206 66 196 86', larg: 0.8, cor: '#4a4643' }])
  ],
  /** Casa de dois quartos: telhado de duas águas, muro baixo, portão, árvore no quintal. */
  casa_2q: c => [
    arvore(226, 13, 18),
    duasAguas(112, 196, 80, 48),
    ...principal('casa_2q', c), sombraDoTelhado(112, 78, 84),
    ...janelas([[122, 90], [172, 90]], c.acesas, 14, 14, '#efe9dc'),
    ...porta(147, 100),
    marcado(undefined, { 'data-detalhe': 'portao' }, [
      { tipo: 'massa', d: ret(92, 114, 46, 14, 0.5) + ret(170, 114, 46, 14, 0.5), cor: clarear(c.cor, 0.15), marca: 'muro' },
      { tipo: 'metal', d: ret(138, 112, 32, 2, 0.5), cor: '#4a4643' }, grade(138, 112, 32, 16, 5)
    ])
  ],
  /** Casa de três quartos: mais larga, garagem ao lado, árvore grande no quintal. */
  casa_3q: c => [
    arvore(284, 16, 18),
    duasAguas(130, 230, 76, 40),
    ...principal('casa_3q', c), sombraDoTelhado(130, 74, 100),
    ...janelas([[140, 88], [206, 88], [160, 88]], c.acesas, 14, 14, '#efe9dc'),
    ...porta(184, 100),
    marcado(undefined, { 'data-detalhe': 'garagem' }, [
      { tipo: 'massa', d: ret(70, 94, 60, 34, 1), cor: c.cor, marca: 'garagem' },
      { tipo: 'massa', d: ret(66, 90, 68, 5, 1), cor: TELHA, semVolume: true },
      { tipo: 'massa', d: ret(78, 102, 44, 26, 0.5), cor: '#9a958d', marca: 'portao' },
      { tipo: 'linha', d: 'M78 108h44M78 114h44M78 120h44', larg: 0.7, cor: '#6a6560' }
    ])
  ],
  /** Casa grande: dois andares, sacada, chaminé da churrasqueira, garagem dupla, jardim. */
  casa_grande: c => [
    { tipo: 'massa', d: ret(160, 28, 9, 16, 1), cor: TIJOLO, marca: 'chamine' },
    { tipo: 'massa', d: cantos([[68, 54, 1], [92, 32, 1], [168, 32, 1], [192, 54, 1]]), cor: '#5d4a3e', marca: 'telhado' },
    { tipo: 'massa', d: ret(74, 52, 112, 34, 1), cor: c.cor, marca: 'andar' },
    ...principal('casa_grande', c), sombraDoTelhado(74, 52, 112),
    ...janelas([[84, 60], [162, 60], [72, 98, 14, 16], [98, 98, 14, 16], [170, 98, 14, 16], [118, 58, 24, 18]], c.acesas, 14, 14, '#4a4643'),
    marcado(undefined, { 'data-detalhe': 'sacada' }, [{ tipo: 'massa', d: ret(110, 76, 40, 3, 0.5), cor: '#e9e4da' }, { tipo: 'vidro', d: ret(110, 79, 40, 7, 0.5), claro: true }]),
    { tipo: 'massa', d: ret(124, 100, 24, 28, 1), cor: '#5a3a24', marca: 'porta' },
    { tipo: 'linha', d: 'M136 100v28', larg: 0.8, cor: '#2e1d12' },
    marcado(undefined, { 'data-detalhe': 'garagem' }, [
      { tipo: 'massa', d: ret(198, 96, 48, 32, 1), cor: c.cor },
      { tipo: 'massa', d: ret(196, 92, 52, 5, 1), cor: '#5d4a3e', semVolume: true },
      { tipo: 'massa', d: ret(204, 102, 36, 26, 0.5), cor: '#b59a7a', marca: 'portao' },
      { tipo: 'linha', d: 'M204 108h36M204 114h36M204 120h36M222 102v26', larg: 0.6, cor: '#7a5a3e' }
    ]),
    marcado(undefined, { 'data-detalhe': 'jardim' }, [arbustos(62, 50), arbustos(154, 40)])
  ],
  /** Sítio: casa com varanda, cerca, árvores, caixa-d'água na torre e roça. */
  sitio: c => {
    const roca: string[] = [];
    for (let k = 0; k < 3; k++) { const y = 126 - k * 5; for (let x = 250 + k * 4; x < 302; x += 9) roca.push(`M${x} ${y}l-2-3M${x} ${y}l2-3`); }
    return [
      arvore(18, 12, 20), arvore(38, 10, 14, '#5f8a4c'),
      marcado(undefined, { 'data-detalhe': 'cerca' }, [{ tipo: 'massa', d: ret(8, 114, 40, 2, 0.5) + ret(8, 120, 40, 2, 0.5) + [10, 24, 38, 46].map(x => ret(x, 111, 2.4, 17, 0.5)).join(''), cor: '#9a7a52', semVolume: true }]),
      duasAguas(100, 172, 88, 60),
      ...principal('sitio', c), sombraDoTelhado(100, 86, 72),
      ...janelas([[112, 98]], c.acesas, 14, 14, '#3f6b4a'),
      ...porta(150, 100, 14, 28, '#3f6b4a'),
      marcado(undefined, { 'data-detalhe': 'varanda' }, [{ tipo: 'massa', d: cantos([[170, 88, 0], [206, 96, 0], [206, 99, 0], [170, 92, 0]]), cor: TELHA }, { tipo: 'massa', d: ret(198.8, 98, 2.6, 30, 0.5), cor: '#9a7a52' }]),
      marcado(undefined, { 'data-detalhe': 'caixa-dagua' }, [
        { tipo: 'linha', d: 'M214 128L218 90M232 128L228 90M216 110h14M215 118L230 100', larg: 1.2, cor: '#7a5236' },
        { tipo: 'massa', d: ret(211, 76, 24, 14, 1), cor: '#5f8fb0', marca: 'caixa-dagua' }
      ]),
      marcado('cena__roca', { 'data-detalhe': 'roca' }, [{ tipo: 'massa', d: ret(244, 124, 62, 4, 1), cor: '#8a6a44', semVolume: true }, { tipo: 'linha', d: roca.join(''), larg: 1.2, cor: '#5f8a4c' }])
    ];
  },
  /** A casa da família: antiga, com alpendre de colunas, antena, vasos e varal. */
  familia: c => [
    { tipo: 'linha', d: 'M178 56V38M170 42h16M173 46h10', larg: 1, cor: METAL, marca: 'antena', attrs: { 'data-detalhe': 'antena' } },
    duasAguas(104, 208, 76, 42),
    ...principal('familia', c),
    ...janelas([[120, 100, 14, 12], [178, 100, 14, 12], [120, 80, 14, 9], [178, 80, 14, 9]], c.acesas, 14, 14, '#3f6b4a'),
    ...porta(149, 100),
    marcado(undefined, { 'data-detalhe': 'alpendre' }, [{ tipo: 'massa', d: ret(96, 92, 120, 4, 0.5), cor: TELHA }, { tipo: 'massa', d: ret(106.5, 96, 3.4, 32, 0.6) + ret(202.5, 96, 3.4, 32, 0.6), cor: '#efe9dc' }]),
    ...vaso(122), ...vaso(180),
    varal(222, 294, 92)
  ],
  /** Casa de parentes: casa de laje com um puxadinho em cima e escada de fora. */
  parente: c => [
    { tipo: 'massa', d: cantos([[114, 60, 0], [172, 52, 0], [172, 55, 0], [114, 63, 0]]), cor: '#8d9399', marca: 'telha-amianto' },
    marcado(undefined, { 'data-detalhe': 'puxadinho' }, [parede(118, 58, 50, 26, TIJOLO), tijolos(118, 58, 50, 26, TIJOLO)]),
    laje(110, 88, 92, 4),
    { tipo: 'linha', d: 'M196 84v-8M201 84v-6', larg: 1.2, cor: '#7a4a2a' },
    ...principal('parente', c),
    ...janelas([[134, 64, 14, 11], [120, 98], [178, 98]], c.acesas, 14, 14),
    ...porta(150, 100),
    marcado(undefined, { 'data-detalhe': 'escada' }, [{ tipo: 'massa', d: membro([[204, 86], [236, 128]], [4, 4]), cor: LAJE }, { tipo: 'linha', d: 'M210 92h6M216 100h6M221 108h6M227 116h6M232 123h5', larg: 1, cor: '#4a4643' }])
  ],
  /** De favor: a casa é dos outros (janelas apagadas); o seu é o quartinho dos fundos. */
  favor: c => [
    duasAguas(98, 190, 70, 38),
    ...principal('favor', { ...c, tijolo: false }),
    ...janelas([[112, 82], [162, 82]], 0, 14, 14, '#efe9dc'),
    ...porta(138, 100),
    marcado(undefined, { 'data-detalhe': 'quartinho' }, [
      { tipo: 'massa', d: cantos([[202, 96, 0], [248, 90, 0], [248, 93, 0], [202, 99, 0]]), cor: '#8d9399' },
      parede(206, 96, 38, 32, c.tijolo ? TIJOLO : clarear(c.cor, 0.1)),
      ...(c.tijolo ? [tijolos(206, 96, 38, 32, TIJOLO)] : []),
      ...janelas([[212, 102, 12, 10]], c.acesas > 0 ? 1 : 0),
      { tipo: 'massa', d: ret(230, 108, 9, 20, 0.5), cor: MADEIRA, semVolume: true }
    ]),
    { tipo: 'linha', d: 'M192 127h4M198 125h4', larg: 1, cor: '#8a6a44' }
  ],
  /** Moradia funcional: casas iguais da vila (ou do alojamento), mastro com bandeira. */
  funcional: c => [
    { tipo: 'metal', d: ret(62.8, 38, 2.4, 90, 0.5), cor: METAL, marca: 'mastro' },
    marcado('cena__bandeira', { 'data-detalhe': 'bandeira' }, [{ tipo: 'massa', d: 'M65 40L89 46L65 52z', cor: '#3f8a5a' }]),
    ...[92, 146, 200].flatMap((x0, k): Peca[] => [
      duasAguas(x0, x0 + 50, 92, 72, '#7d7268', 3),
      parede(x0, 90, 50, 38, c.cor),
      ...janelas([[x0 + 6, 100, 12, 10], [x0 + 34, 100, 12, 10]], k === 1 ? c.acesas : 0),
      { tipo: 'massa', d: ret(x0 + 21, 106, 10, 22, 0.5), cor: '#5d6b45', semVolume: true, marca: 'porta' }
    ])
  ]
};

/* ---------------------------------------------------------- Estado */

const rachadura = (x: number, y: number, a: number): Peca => { const s = Math.min(1.4, a / 50); return marcado('cena__rachadura', { 'data-condicao': 'rachadura' }, [{ tipo: 'linha', d: `M${x} ${y + 3}l-3 ${6 * s}l4 ${5 * s}l-4 ${6 * s}l3 ${5 * s}M${x + 1} ${y + 3 + 11 * s}l5 ${3 * s}l2 ${4 * s}`, larg: 1.4, cor: '#3a2a22' }]); };
const mancha = (x: number, y: number): Peca => marcado('cena__mancha', { 'data-condicao': 'mancha' }, [{ tipo: 'massa', d: `M${x} ${y}c4-2 9-1 11 2c3 0 5 3 3 6c1 4-3 6-6 4c-3 3-8 2-9-2c-3-1-3-8 1-10z`, cor: '#6b5a3e', opacidade: 0.35, semVolume: true }]);
function andaime(x: number, topo: number): Peca {
  const d: string[] = [`M${x} ${C}V${topo}M${x + 20} ${C}V${topo}`];
  for (let y = C; y - 16 > topo; y -= 16) d.push(`M${x} ${y}L${x + 20} ${y - 16}`);
  const tabuas = [] as string[];
  for (let y = C - 16; y > topo; y -= 16) tabuas.push(ret(x - 3, y - 1.4, 26, 2.8, 0.5));
  return marcado('cena__andaime', { 'data-condicao': 'andaime' }, [{ tipo: 'linha', d: d.join(''), larg: 1.4, cor: '#c9a23a' }, { tipo: 'massa', d: tabuas.join(''), cor: '#a8794a', semVolume: true }]);
}
const tintaNova = (x: number): Peca => marcado('cena__tinta', { 'data-detalhe': 'pintura-nova' }, [
  { tipo: 'massa', d: ret(x, C - 9, 9, 9, 1), cor: '#d6dce0', marca: 'lata' },
  { tipo: 'massa', d: ret(x, C - 10, 9, 2.4, 1), cor: '#3f8a6a', semVolume: true },
  { tipo: 'metal', d: membro([[x + 14, C], [x + 22, C - 14]], [1.6, 1.6]), cor: '#8d8a85' },
  { tipo: 'massa', d: ret(x + 20, C - 18, 10, 4.4, 2), cor: '#3f8a6a', marca: 'rolo' }
]);

/* ---------------------------------------------------------- Bichos e veículo na porta */

const PELO = ['#b07a45', '#5d5a56', '#e0c7a0', '#2f2b28', '#c9893f', '#8a7a6a'];
const cachorro = (x: number, id: string): Peca => {
  const cor = PELO[hash(id) % PELO.length];
  return marcado('cena__bicho', { 'data-bicho': 'cachorro' }, [
    { tipo: 'massa', d: membro([[x + 3, C], [x + 3, C - 7]], [2.2, 2.4]) + membro([[x + 13, C], [x + 13, C - 7]], [2.2, 2.4]), cor: escurecer(cor, 0.12), semVolume: true },
    { tipo: 'massa', d: suave([[x + 1, C - 8], [x + 3, C - 12], [x + 14, C - 12], [x + 16, C - 8], [x + 13, C - 5], [x + 3, C - 5]], true, 0.5), cor, marca: 'corpo' },
    { tipo: 'massa', d: suave([[x + 14, C - 12], [x + 15, C - 17], [x + 20, C - 17], [x + 22, C - 13], [x + 18, C - 11]], true, 0.5), cor, marca: 'cabeca' },
    { tipo: 'massa', d: `M${x + 15} ${C - 17}l-1 5 3-3z`, cor: escurecer(cor, 0.3), semVolume: true },
    { tipo: 'massa', d: membro([[x + 1, C - 10], [x - 3, C - 15]], [1.8, 1]), cor, semVolume: true }
  ]);
};
const gato = (x: number, id: string): Peca => {
  const cor = PELO[(hash(id) >>> 3) % PELO.length];
  return marcado('cena__bicho', { 'data-bicho': 'gato' }, [
    { tipo: 'massa', d: suave([[x + 2, C], [x + 1, C - 6], [x + 4, C - 11], [x + 10, C - 11], [x + 12, C - 5], [x + 12, C]], true, 0.5), cor, marca: 'corpo' },
    { tipo: 'massa', d: elipse(x + 7, C - 14, 4.4, 3.8) + `M${x + 3} ${C - 15}l0.6-5 3 3zM${x + 11} ${C - 15}l-0.6-5-3 3z`, cor, marca: 'cabeca' },
    { tipo: 'massa', d: membro([[x + 12, C - 1], [x + 17, C - 3], [x + 17, C - 9]], [2, 1.8, 1.4]), cor, semVolume: true }
  ]);
};

const LARGURA_NA_PORTA: Record<'carro' | 'moto' | 'bicicleta', number> = { carro: 68, moto: 46, bicicleta: 40 };
/** O veículo da casa, na escala da cena (a mesma ilustração da garagem, encolhida até a vaga). */
function veiculoNaPorta(x: number, tipo: 'carro' | 'moto' | 'bicicleta', forma: FormaVeiculo, cor?: string, versaoId?: string, estado?: number): Peca {
  const a = amostraDoVeiculo(forma, cor, versaoId, versaoId, estado);
  const s = LARGURA_NA_PORTA[tipo] / a.vb[0];
  const chao = a.chao ?? 122;
  return { tipo: 'grupo', t: `translate(${x} ${(C - chao * s).toFixed(2)}) scale(${s.toFixed(4)})`, pecas: a.pecas, classe: 'cena__veiculo', attrs: { 'data-forma': forma } };
}

export interface CenaEntrada {
  forma: FormaDaCasa; acesas: number; tijolo: boolean; fachada?: string;
  nivel: 'boa' | 'gasta' | 'ruim' | 'problema' | string; reforma: boolean;
  veiculo?: { tipo: 'carro' | 'moto' | 'bicicleta'; forma: FormaVeiculo; cor?: string; versaoId?: string; estado?: number };
  bichos: { id: string; especie: string }[];
}

/** A cena inteira de uma casa (a casa, o estado, o veículo na porta, os bichos na frente). */
export function amostraDaCasa(e: CenaEntrada): Amostra {
  const pl = PLANTAS[e.forma], w = pl.parede;
  const pecas: Peca[] = [
    { tipo: 'massa', d: ret(0, C, 312, 12, 0), cor: '#b9ad98', semVolume: true, marca: 'chao', classe: 'cena__chao' },
    ...FORMAS[e.forma]({ acesas: e.acesas, tijolo: e.tijolo, cor: e.fachada ?? pl.cor }),
    ...(e.nivel === 'gasta' || e.nivel === 'ruim' ? [mancha(w.x + w.l * 0.18, w.y + 6)] : []),
    ...(e.nivel === 'ruim' || e.nivel === 'problema' ? [rachadura(w.x + w.l * 0.74, w.y, w.a)] : []),
    ...(e.nivel === 'problema' ? [andaime(w.x + 4, Math.max(w.y - 2, 20))] : []),
    ...(e.reforma && e.nivel !== 'problema' ? [tintaNova(w.x + w.l - 36)] : []),
    ...(e.veiculo ? [veiculoNaPorta(pl.vaga + (e.veiculo.tipo === 'carro' ? 0 : 8), e.veiculo.tipo, e.veiculo.forma, e.veiculo.cor, e.veiculo.versaoId, e.veiculo.estado)] : []),
    ...e.bichos.slice(0, 2).map((b, k) => (b.especie === 'gato' ? gato(pl.bichos + k * 24, b.id) : cachorro(pl.bichos + k * 24, b.id)))
  ];
  return { vb: [312, 140], pecas };
}

/** A miniatura (a vitrine da imobiliária, os bens): só a casa, recortada, na cor da fachada quando há. */
export function amostraDaMiniatura(forma: FormaDaCasa, fachada?: string): Amostra {
  const pl = PLANTAS[forma];
  return {
    vb: [252, 124],
    pecas: [{ tipo: 'grupo', t: 'translate(-30 -10)', pecas: [{ tipo: 'massa', d: ret(24, C, 264, 4, 0), cor: '#b9ad98', semVolume: true, marca: 'chao' }, ...FORMAS[forma]({ acesas: 1, tijolo: false, cor: fachada ?? pl.cor })] }]
  };
}
