/**
 * VIDA 14 — a área de fora das moradias como um CONJUNTO arquitetônico, em 2.5D (o kit `./kit`: projeção oblíqua única,
 * medidas em metros, luz do alto à esquerda). O que mudou em relação ao desenho chapado de antes:
 *
 *   volume       cada corpo da casa é um bloco com frente iluminada, lado na sombra e a sombra projetada no chão;
 *   andares      a cinta de laje entre os pavimentos, o beiral que sombreia a parede, o telhado que assenta no corpo;
 *   garagem      um volume colado à casa (a mesma parede, a mesma laje), com o portão de enrolar e a rampa até a rua;
 *   paisagismo   árvores e arbustos com tronco, base e sombra no chão; canteiros com borda; gramado do lote;
 *   lote         a rua, o meio-fio, a calçada com juntas, o muro (com o vão do portão), o caminho até a porta;
 *   escala       a porta tem 2,1 m, o andar 2,9 m, o carro 4,2 m — tudo na mesma régua.
 *
 * Os estilos são distintos de verdade: a casa de laje com ferro para cima, a térrea de frontão, o sobrado com telhado
 * de duas águas, a casa contemporânea de platibanda e laje em balanço, a mansão clássica com colunas e alas de quatro
 * águas, a casa de sítio com alpendre, os prédios com cinta por andar. Os contratos de antes continuam
 * (`.cena__janela--acesa`, `.cena__veiculo`, `.cena__bicho`, `data-condicao`, `data-detalhe`).
 */
import type { FormaDaCasa } from '../../leituraMaterial';
import { circulo, clarear, escurecer, num, ret, type Amostra, type Peca } from '../../ilustracao/nucleo';
import { amostraDoVeiculo } from '../../ilustracao/veiculos';
import { cachorro, gato, PLANTAS, type CenaEntrada, type LadoDeFora } from '../../ilustracao/casas';
import {
  COR, KX, KY, arbusto, arvore, bloco, brilho, canteiro, chapado, degraus, duasAguas, frontal, frontao, grupo, janela, lajeEmBalanco, lateral,
  marcado, noChao, palmeira, planoDoChao, platibanda, poli, porta, pt, quatroAguas, sombra, sombraDoBeiral, sombraDoBloco,
  type Bloco, type Textura, type Vista
} from './kit';

const W = 312, H = 140;
const ANDAR = 2.9;
const RUA = 2.6, CALCADA = 1.5;

/** A vista que cabe a cena (largura × altura × fundo, em metros) no quadro. */
function vista(largura: number, altura: number, fundo: number): Vista {
  const S = Math.min(W / (largura + fundo * KX), (H - 6) / (altura + fundo * KY + RUA * KY));
  const GY = H - 1 - RUA * KY * S;
  return { S, OX: (W - S * (largura + fundo * KX)) / 2, GY };
}

interface Cena { v: Vista; fundo: Peca[]; chao: Peca[]; corpo: Peca[]; frente: Peca[]; largura: number }
interface Ctx { acesas: number; tijolo: boolean; cor: string; externo?: LadoDeFora; usadas: number }
/** A próxima janela (as primeiras `acesas` acendem: quem mora ali). */
const acende = (c: Ctx) => c.usadas++ < c.acesas;
const texturaDe = (x?: LadoDeFora): Textura | undefined => (x?.fachada === 'tijolo' ? 'tijolo' : x?.fachada === 'ripado' ? 'ripado' : x?.fachada === 'pedra' ? 'pedra' : x?.fachada === 'placas' ? 'placas' : x?.fachada === 'textura' ? 'textura' : undefined);

/* ============================================================== O lote: rua, calçada, muro */

function lote(v: Vista, largura: number, fundo: number, chao: string, muro?: { cor: string; vao?: [number, number]; alt?: number; grade?: boolean; portao?: string }): { chao: Peca[]; frente: Peca[] } {
  const ch: Peca[] = [
    noChao(v, -300, largura + 300, -RUA - CALCADA, -CALCADA, COR.asfalto, 'rua'),
    planoDoChao(v, -30, -RUA - CALCADA, [{ tipo: 'linha', d: Array.from({ length: Math.ceil((largura + 60) / 3) }, (_, k) => `M${num(k * 3 + 0.5)} ${num(RUA * 0.55)}h1.4`).join(''), larg: 1, cor: '#d9d2c2', marca: 'faixa' }]),
    noChao(v, -300, largura + 300, -CALCADA, 0, COR.calcada, 'calcada'),
    planoDoChao(v, -30, -CALCADA, [{ tipo: 'linha', d: Array.from({ length: Math.ceil((largura + 60) / 1.2) }, (_, k) => `M${num(k * 1.2)} 0V${CALCADA}`).join('') + `M0 ${CALCADA / 2}H${largura + 60}`, larg: 0.4, cor: escurecer(COR.calcada, 0.12), fino: true, marca: 'juntas' }]),
    // O meio-fio: a pedra de borda, com a face para a rua.
    ...bloco(v, { x0: -300, x1: largura + 300, z0: -CALCADA - 0.15, z1: -CALCADA, h0: -0.15, h1: 0 }, { cor: COR.meioFio, semLado: true }),
    // O terreno vai além do quadro (os vizinhos, o fundo): nada de lote "recortado" no ar.
    noChao(v, -300, largura + 300, 0, fundo + 10, escurecer(chao, 0.04), 'terreno'),
    noChao(v, 0, largura, 0, fundo, chao, 'lote', 0, false),
    // As divisas do lote (a linha do muro do vizinho).
    { tipo: 'linha', d: `M${pt(v, 0, 0, 0).map(num).join(' ')}L${pt(v, 0, fundo, 0).map(num).join(' ')}M${pt(v, largura, 0, 0).map(num).join(' ')}L${pt(v, largura, fundo, 0).map(num).join(' ')}`, larg: 0.8, cor: escurecer(chao, 0.25), marca: 'divisa' }
  ];
  const fr: Peca[] = [];
  if (muro) {
    const alt = muro.alt ?? 1.1, e = 0.18;
    const trechos: [number, number][] = muro.vao ? [[0, muro.vao[0]], [muro.vao[1], largura]] : [[0, largura]];
    for (const [a, b] of trechos) if (b - a > 0.1) {
      fr.push(...bloco(v, { x0: a, x1: b, z0: 0, z1: e, h1: alt }, { cor: muro.cor, corTopo: escurecer(muro.cor, 0.05) }));
      if (muro.grade) fr.push(grupo(frontal(v, a, 0, alt + 0.7), [{ tipo: 'linha', d: Array.from({ length: Math.floor((b - a) / 0.14) }, (_, k) => `M${num(0.07 + k * 0.14)} 0V0.7`).join('') + `M0 0.04H${num(b - a)}`, larg: 0.55, cor: '#3d3a37', marca: 'gradil' }]));
    }
    if (muro.vao && muro.portao) fr.push(portaoNoVao(v, muro.vao[0], muro.vao[1], alt + (muro.grade ? 0.5 : 0.3), muro.portao));
  }
  return { chao: ch, frente: fr };
}

/** O portão no vão do muro: aberto meio caminho (para o carro e as pessoas), no estilo escolhido. */
function portaoNoVao(v: Vista, x0: number, x1: number, alt: number, estilo: string): Peca {
  const l = (x1 - x0) * 0.55, cor = estilo === 'madeira' ? '#8a5d38' : estilo === 'corten' ? '#9a4f2a' : estilo === 'automatico' ? '#55585c' : estilo === 'pivotante' ? '#3b3734' : '#8f8a82';
  const linhas = estilo === 'madeira' || estilo === 'pivotante' ? Array.from({ length: Math.floor(l / 0.12) }, (_, k) => `M${num(0.06 + k * 0.12)} 0.05V${num(alt - 0.05)}`).join('') : Array.from({ length: Math.floor(alt / 0.18) }, (_, k) => `M0.05 ${num(0.09 + k * 0.18)}H${num(l - 0.05)}`).join('');
  return marcado(undefined, { 'data-detalhe': 'portao' }, [grupo(frontal(v, x1 - l, -0.05, alt), [
    { tipo: 'massa', d: ret(0, 0, l, alt, 0.03), cor, marca: 'portao' },
    { tipo: 'linha', d: linhas, larg: 0.5, cor: escurecer(cor, 0.3), fino: true },
    ...(estilo === 'automatico' ? [{ tipo: 'luz' as const, d: circulo(l - 0.12, -0.15, 0.07), cor: '#f2a23a' }] : [])
  ])]);
}

/* ============================================================== Peças compostas */

/** As janelas de um andar, igualmente espaçadas no vão (x0..x1) do plano z, à altura h do peitoril. */
function fileira(v: Vista, c: Ctx, z: number, x0: number, x1: number, h: number, n: number, l = 1.2, a = 1.2, o: Parameters<typeof janela>[6] = {}): Peca[] {
  const out: Peca[] = [];
  const passo = (x1 - x0) / n;
  for (let k = 0; k < n; k++) out.push(janela(v, z, x0 + passo * k + (passo - l) / 2, h, l, a, { ...o, acesa: acende(c) }));
  return out;
}

/** A cinta (a laje entre os andares, que aparece na fachada como uma faixa saliente). */
const cinta = (v: Vista, x0: number, x1: number, z: number, h: number, cor: string) => [
  ...bloco(v, { x0: x0 - 0.05, x1: x1 + 0.05, z0: z - 0.12, z1: z, h0: h - 0.18, h1: h }, { cor: clarear(cor, 0.12), corTopo: clarear(cor, 0.2) }),
  sombraDoBeiral(v, x0, x1, z, h - 0.18, 0.22, 0.14)
];

/** A caixa-d'água no alto (a de fibra azul, sobre uma base). */
function caixaDagua(v: Vista, x: number, z: number, h: number, cor = '#4f7fa3'): Peca[] {
  return [marcado(undefined, { 'data-detalhe': 'caixa-dagua' }, [
    ...bloco(v, { x0: x - 0.6, x1: x + 0.6, z0: z, z1: z + 1.2, h0: h, h1: h + 0.25 }, { cor: COR.concreto }),
    ...bloco(v, { x0: x - 0.55, x1: x + 0.55, z0: z + 0.05, z1: z + 1.15, h0: h + 0.25, h1: h + 1.05 }, { cor }),
    ...bloco(v, { x0: x - 0.62, x1: x + 0.62, z0: z, z1: z + 1.2, h0: h + 1.05, h1: h + 1.15 }, { cor: clarear(cor, 0.15) })
  ])];
}

/** As árvores e os arbustos do terreno, pelo paisagismo escolhido (ou o de sempre da forma). */
function jardim(v: Vista, largura: number, zCasa: number, x0Casa: number, x1Casa: number, p: string | undefined, base: 'arvore' | 'pouco' | 'nada'): { fundo: Peca[]; chao: Peca[]; frente: Peca[] } {
  const fundo: Peca[] = [], chao: Peca[] = [], frente: Peca[] = [];
  const meio = (x0Casa + x1Casa) / 2;
  if (p && p !== 'nenhum') chao.push(noChao(v, 0.2, largura - 0.2, 0.25, zCasa - 0.2, COR.grama, 'grama'));
  if (p === 'canteiros' || p === 'assinado' || p === 'botanico') { chao.push(...canteiro(v, x0Casa + 0.2, meio - 0.9, zCasa - 1.1, zCasa - 0.3, { flores: '#e05a6a', semente: 3 }), ...canteiro(v, meio + 0.9, x1Casa - 0.2, zCasa - 1.1, zCasa - 0.3, { flores: '#f2c14e', semente: 5 })); }
  if (p === 'tropical' || p === 'botanico') { fundo.push(palmeira(v, x0Casa - 1.6, zCasa + 1, 7)); frente.push(palmeira(v, largura - 1.2, 1.4, 6)); }
  if (p === 'pomar') { fundo.push(arvore(v, x1Casa + 1.8, zCasa + 2.5, { alt: 4.5, frutas: '#e8952a' }), arvore(v, x0Casa - 1.6, zCasa + 3, { alt: 4, frutas: '#d2452f', copa: '#5f8f4e' })); }
  if (p === 'zen') chao.push(planoDoChao(v, x0Casa, zCasa - 1.2, [{ tipo: 'massa', d: [0.4, 1.1, 1.9, 2.6].map((x, k) => `M${x} ${0.3 + (k % 2) * 0.3}a0.25 0.16 0 1 0 0.5 0a0.25 0.16 0 1 0 -0.5 0z`).join(''), cor: '#cfc8bb', marca: 'seixos' }, { tipo: 'linha', d: 'M0 0.95H3.2M0 1.05H3.2', larg: 0.4, cor: '#a8a092', fino: true }]));
  if (p === 'gramado' || p === 'assinado') frente.push(arbusto(v, x0Casa + 0.4, zCasa - 0.5, 0.5), arbusto(v, x1Casa - 0.5, zCasa - 0.5, 0.45));
  if (p === 'assinado' || p === 'botanico') fundo.push(arvore(v, x1Casa + 2.2, zCasa + 1.5, { alt: 6.5, copa: '#4f7f42', forma: 'alta' }));
  if (p === 'botanico') chao.push(...bloco(v, { x0: largura - 3.2, x1: largura - 0.6, z0: zCasa + 0.5, z1: zCasa + 2.5, h1: 2.2 }, { cor: '#cfe3ea', corTopo: '#e8f3f6' }).map(x => marcado(undefined, { 'data-detalhe': 'estufa' }, [x])));
  if (!p || p === 'nenhum') {
    if (base === 'arvore') fundo.push(arvore(v, Math.min(largura - 1.6, x1Casa + 2.2), zCasa + 1.6, { alt: 5.5 }));
    if (base !== 'nada') frente.push(arbusto(v, x0Casa + 0.5, zCasa - 0.45, 0.45));
  }
  return { fundo, chao, frente };
}

/** A luz de fora (arandelas ao lado da porta, balizadores no caminho, espetos nas árvores, o projeto inteiro). */
function luzDeFora(v: Vista, luz: string | undefined, z: number, xPorta: number, hPorta: number, caminho: [number, number] | undefined): Peca[] {
  if (!luz) return [];
  const out: Peca[] = [];
  if (luz === 'arandelas' || luz === 'projeto') for (const dx of [-0.5, 1.4]) out.push(grupo(frontal(v, xPorta + dx, z, hPorta + 2.2), [chapado(ret(0, 0, 0.14, 0.24, 0.03), '#3a3633', 'arandela'), brilho(`M0.07 0.24L-0.35 1.2H0.49Z`, COR.luz, 0.3)]));
  if ((luz === 'balizadores' || luz === 'projeto') && caminho) for (let k = 0; k < 3; k++) out.push(...bloco(v, { x0: caminho[0] - 0.25, x1: caminho[0] - 0.12, z0: 0.6 + k * (z - 1) / 3, z1: 0.73 + k * (z - 1) / 3, h1: 0.45 }, { cor: COR.luz }));
  if (luz === 'espetos' || luz === 'projeto') out.push(brilho(poli(v, [[xPorta - 4, z - 0.3, 0], [xPorta - 2.5, z - 0.3, 0], [xPorta - 3.2, z - 0.3, 3.5]]), COR.luz, 0.18));
  return [marcado(undefined, { 'data-detalhe': 'luz-externa' }, out)];
}

/** O caminho da calçada até a porta, no material escolhido. */
function caminho(v: Vista, x: number, z: number, x0?: LadoDeFora): Peca[] {
  const cor = x0?.corCaminho ?? (x0?.caminho === 'pedra_portuguesa' ? '#e9e4da' : x0?.caminho === 'deck' ? '#9a6a40' : x0?.caminho === 'travertino' ? '#e3d6bd' : '#bdb6aa');
  const out: Peca[] = [noChao(v, x - 0.6, x + 0.6, 0.18, z, cor, 'caminho')];
  if (x0?.caminho === 'deck' || x0?.caminho === 'intertravado' || x0?.caminho === 'pedra_portuguesa') out.push(planoDoChao(v, x - 0.6, 0.18, [{ tipo: 'linha', d: Array.from({ length: Math.floor((z - 0.18) / (x0.caminho === 'deck' ? 0.18 : 0.3)) }, (_, k) => `M0 ${num((k + 1) * (x0.caminho === 'deck' ? 0.18 : 0.3))}h1.2`).join(''), larg: 0.45, cor: escurecer(cor, 0.25), fino: true, marca: x0.caminho === 'pedra_portuguesa' ? 'mosaico' : 'juntas' }]));
  return out;
}

/* ============================================================== O estado (os contratos de antes) */

function estado(v: Vista, b: Bloco, nivel: string, reforma: boolean): Peca[] {
  const U = b.x1 - b.x0, A = b.h1 - (b.h0 ?? 0);
  const out: Peca[] = [];
  const naFrente = (pecas: Peca[]) => grupo(frontal(v, b.x0, b.z0, b.h1), pecas);
  if (nivel === 'gasta' || nivel === 'ruim') out.push(marcado('cena__mancha', { 'data-condicao': 'mancha' }, [naFrente([{ tipo: 'massa', d: `M${num(U * 0.16)} 0.1c0.4-0.2 0.9-0.1 1.1 0.2c0.3 0 0.5 0.3 0.3 0.6c0.1 0.4-0.3 0.6-0.6 0.4c-0.3 0.3-0.8 0.2-0.9-0.2c-0.3-0.1-0.3-0.8 0.1-1z`, cor: '#6b5a3e', opacidade: 0.32, semVolume: true }])]));
  if (nivel === 'ruim' || nivel === 'problema') out.push(marcado('cena__rachadura', { 'data-condicao': 'rachadura' }, [naFrente([{ tipo: 'linha', d: `M${num(U * 0.74)} 0.2l-0.25 ${num(A * 0.15)}l0.3 ${num(A * 0.12)}l-0.3 ${num(A * 0.15)}l0.2 ${num(A * 0.12)}M${num(U * 0.74 - 0.05)} ${num(A * 0.27)}l0.4 0.2l0.15 0.3`, larg: 1.3, cor: '#3a2a22' }])]));
  if (nivel === 'problema') {
    const d: string[] = [], tab: string[] = [];
    for (let k = 0; k * 1.6 < A + 0.5; k++) { d.push(`M0.2 ${num(k * 1.6)}H2.6`); tab.push(ret(0.1, k * 1.6 - 0.08, 2.6, 0.12, 0.02)); }
    d.push(`M0.3 -0.6V${num(A + 0.4)}M2.4 -0.6V${num(A + 0.4)}`);
    out.push(marcado('cena__andaime', { 'data-condicao': 'andaime' }, [grupo(frontal(v, b.x0 + 0.3, b.z0 - 0.4, b.h1 + 0.6), [{ tipo: 'linha', d: d.join(''), larg: 1.3, cor: '#c9a23a' }, { tipo: 'massa', d: tab.join(''), cor: '#a8794a', semVolume: true }])]));
  }
  if (reforma && nivel !== 'problema') out.push(marcado(undefined, { 'data-detalhe': 'pintura-nova' }, [...bloco(v, { x0: b.x1 - 1.2, x1: b.x1 - 0.85, z0: b.z0 - 0.6, z1: b.z0 - 0.25, h1: 0.4 }, { cor: '#d9d6cf' }), noChao(v, b.x1 - 1.25, b.x1 - 0.8, b.z0 - 0.65, b.z0 - 0.2, '#5f9bc0', 'respingo', 0.4)]));
  return out;
}

/* ============================================================== As formas */


const parede = (c: Ctx, base: string, soclo = 0.35) => ({ cor: c.externo?.corFachada ?? c.cor ?? base, textura: c.tijolo ? 'tijolo' as Textura : texturaDe(c.externo), soclo, corSoclo: '#8f877a' });

/** A casa térrea (a simples de laje, a de frontão, a da família, a de parentes, a de favor). */
function terrea(c: Ctx, o: { l: number; d: number; telhado: 'laje' | 'frontao' | 'duas' | 'quatro'; muro: boolean; arvore: boolean; alpendre?: boolean; extra?: 'puxadinho' | 'edicula' | 'varal' | 'vasos'; largura: number }): Cena & { principal: Bloco } {
  const largura = o.largura, fundo = o.d + 8;
  const v = vista(largura, ANDAR + 3.4 + (o.extra === 'puxadinho' ? ANDAR : 0), fundo);
  const z0 = 3.2, x0 = (largura - o.l) / 2 - (o.extra === 'edicula' ? 1.2 : 0), b: Bloco = { x0, x1: x0 + o.l, z0, z1: z0 + o.d, h1: ANDAR };
  const p = parede(c, '#d8c6a8');
  const L = lote(v, largura, fundo, o.muro ? '#cbbf9f' : COR.terra, o.muro ? { cor: '#d6cdbd', vao: [x0 + o.l - 2.2, x0 + o.l - 0.4], portao: c.externo?.portao ?? 'simples', alt: 1.1 } : undefined);
  const J = jardim(v, largura, z0, b.x0, b.x1, c.externo?.paisagismo, o.arvore ? 'arvore' : 'pouco');
  const corpo: Peca[] = [sombraDoBloco(v, b, ANDAR + (o.telhado === 'laje' ? 0.3 : 1.6))];
  if (o.extra === 'edicula') { const e: Bloco = { x0: b.x1 + 1.2, x1: b.x1 + 4, z0: z0 + o.d - 1, z1: z0 + o.d + 2.2, h1: 2.5 }; corpo.push(sombraDoBloco(v, e), marcado(undefined, { 'data-detalhe': 'quartinho' }, [...bloco(v, e, { cor: escurecer(p.cor, 0.05), textura: 'blocos' }), ...platibanda(v, e, 0.3, escurecer(p.cor, 0.05)), janela(v, e.z0, e.x0 + 0.6, 1.1, 0.8, 0.8, { acesa: acende(c) }), porta(v, e.z0, e.x0 + 1.7, 0, { l: 0.8 })])); }
  corpo.push(...bloco(v, b, p));
  // O telhado (assenta no corpo, com a sombra do beiral na parede).
  if (o.telhado === 'laje') corpo.push(...platibanda(v, b, 0.35, p.cor), marcado(undefined, { 'data-detalhe': 'ferro' }, [{ tipo: 'linha', d: [0.3, 0.9, b.x1 - b.x0 - 0.9, b.x1 - b.x0 - 0.3].map(dx => { const a = pt(v, b.x0 + dx, b.z0 + 0.1, ANDAR + 0.35), q = pt(v, b.x0 + dx, b.z0 + 0.1, ANDAR + 1.1); return `M${num(a[0])} ${num(a[1])}L${num(q[0])} ${num(q[1])}`; }).join(''), larg: 0.8, cor: '#6b4a3c' }]), ...caixaDagua(v, b.x0 + (b.x1 - b.x0) * 0.62, b.z0 + 1.6, ANDAR + 0.35));
  else if (o.telhado === 'frontao') corpo.push(...frontao(v, b, 1.6, { cor: COR.telha }, p.cor), sombraDoBeiral(v, b.x0, b.x1, b.z0, ANDAR, 0.35, 0.16));
  else if (o.telhado === 'quatro') corpo.push(...quatroAguas(v, b, 1.5, { cor: COR.telha }), sombraDoBeiral(v, b.x0, b.x1, b.z0, ANDAR, 0.5));
  else corpo.push(...duasAguas(v, b, 1.6, { cor: COR.telha }, p.cor), sombraDoBeiral(v, b.x0, b.x1, b.z0, ANDAR, 0.5));
  if (o.extra === 'puxadinho') { const pu: Bloco = { x0: b.x0 + 0.6, x1: b.x0 + o.l * 0.6, z0: b.z0 + 0.8, z1: b.z1 - 0.5, h0: ANDAR + 0.35, h1: ANDAR * 2 }; corpo.push(marcado(undefined, { 'data-detalhe': 'puxadinho' }, [...bloco(v, pu, { cor: '#b9a99a', textura: 'blocos' }), ...platibanda(v, pu, 0.2, '#b9a99a'), janela(v, pu.z0, pu.x0 + 0.8, ANDAR + 1.2, 0.9, 0.9, { acesa: acende(c) }), { tipo: 'linha', d: Array.from({ length: 12 }, (_, k) => { const a = pt(v, b.x1 + 0.3 + k * 0.05, b.z0 + 0.5 + k * 0.2, k * 0.27); return `M${num(a[0] - 3)} ${num(a[1])}h${num(v.S * 0.8)}`; }).join('') + (() => { const a = pt(v, b.x1 + 0.3, b.z0 + 0.5, 0), q = pt(v, b.x1 + 0.9, b.z0 + 2.9, ANDAR + 0.35); return `M${num(a[0] - 3)} ${num(a[1])}L${num(q[0] - 3)} ${num(q[1])}M${num(a[0] + v.S * 0.8 - 3)} ${num(a[1])}L${num(q[0] + v.S * 0.8 - 3)} ${num(q[1])}`; })(), larg: 1, cor: '#4a4643', marca: 'escada' }])); }
  // Alpendre: a varanda coberta na frente (pilares de madeira, piso elevado).
  const zf = o.alpendre ? b.z0 - 1.8 : b.z0;
  if (o.alpendre) {
    const ap: Bloco = { x0: b.x0, x1: b.x1, z0: b.z0 - 1.8, z1: b.z0, h0: 0, h1: 0.3 };
    corpo.push(marcado(undefined, { 'data-detalhe': 'alpendre' }, [
      ...bloco(v, ap, { cor: '#c4a882', corTopo: '#b08d64' }),
      ...[b.x0 + 0.1, (b.x0 + b.x1) / 2 - 0.08, b.x1 - 0.26].flatMap(x => bloco(v, { x0: x, x1: x + 0.16, z0: ap.z0 + 0.05, z1: ap.z0 + 0.21, h0: 0.3, h1: ANDAR - 0.1 }, { cor: COR.madeira })),
      { tipo: 'massa', d: poli(v, [[b.x0 - 0.4, ap.z0 - 0.4, ANDAR - 0.2], [b.x1 + 0.4, ap.z0 - 0.4, ANDAR - 0.2], [b.x1 + 0.4, b.z0, ANDAR + 0.2], [b.x0 - 0.4, b.z0, ANDAR + 0.2]]), cor: escurecer(COR.telha, 0.05), marca: 'telhado' },
      sombraDoBeiral(v, b.x0, b.x1, b.z0, ANDAR, 1.1, 0.24)
    ]));
  }
  const xp = b.x0 + o.l * 0.42;
  corpo.push(...fileira(v, c, b.z0, b.x0 + 0.3, xp - 0.2, 0.95, Math.max(1, Math.round((xp - b.x0) / 2.6)), 1.2, 1.15, { venezianas: o.telhado === 'quatro' ? '#5f7f52' : undefined }));
  corpo.push(porta(v, b.z0, xp, o.alpendre ? 0.3 : 0.15));
  corpo.push(...fileira(v, c, b.z0, xp + 1.2, b.x1 - 0.3, 0.95, Math.max(1, Math.round((b.x1 - xp - 1.2) / 2.6)), 1.2, 1.15, { grade: o.telhado === 'laje', venezianas: o.telhado === 'quatro' ? '#5f7f52' : undefined }));
  if (!o.alpendre) corpo.push(...degraus(v, b.z0, xp - 0.1, xp + 1, 0.15));
  if (o.extra === 'vasos') corpo.push(arbusto(v, xp - 0.5, zf - 0.2, 0.32, '#5f8a48', '#e05a6a'), arbusto(v, xp + 1.5, zf - 0.2, 0.32, '#5f8a48', '#f2c14e'));
  const frente = [...L.frente, ...J.frente, ...luzDeFora(v, c.externo?.luz, b.z0, xp, 0.15, [xp + 0.45, 0])];
  if (o.extra === 'varal' || o.extra === 'edicula') frente.push(varal14(v, b.x1 + 0.6, b.x1 + 3.6, z0 + 1));
  return { v, fundo: J.fundo, chao: [...L.chao, ...J.chao, ...caminho(v, xp + 0.45, zf, c.externo)], corpo, frente, largura, principal: b };
}

/** O varal (as roupas penduradas, no chão do quintal). */
function varal14(v: Vista, x0: number, x1: number, z: number): Peca {
  const a = pt(v, x0, z, 1.8), b = pt(v, x1, z, 1.8), p0 = pt(v, x0, z, 0), p1 = pt(v, x1, z, 0);
  const roupas = ['#c23b3b', '#3d5d8f', '#e0b93a', '#efe9dc'].map((cor, k): Peca => { const t = (k + 0.7) / 4.6; const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + v.S * 0.08; return { tipo: 'massa', d: ret(x, y, v.S * 0.45, v.S * 0.55, 0.4), cor, semVolume: true, marca: 'roupa' }; });
  return marcado(undefined, { 'data-detalhe': 'varal' }, [{ tipo: 'linha', d: `M${num(p0[0])} ${num(p0[1])}L${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}L${num(p1[0])} ${num(p1[1])}`, larg: 1, cor: '#6b6560' }, ...roupas]);
}

/** O sobrado (a república, a casa de três quartos com garagem, a casa grande contemporânea). */
function sobrado(c: Ctx, o: { l: number; d: number; andares: number; estilo: 'tradicional' | 'contemporanea'; garagem?: 1 | 2; largura: number; republica?: boolean }): Cena & { principal: Bloco } {
  const largura = o.largura, fundo = o.d + 8, A = o.andares * ANDAR;
  const v = vista(largura, A + 2.4, fundo);
  const z0 = 3.4;
  const gl = o.garagem ? o.garagem * 3.1 : 0;
  const x0 = (largura - o.l - gl) / 2 + gl;
  const b: Bloco = { x0, x1: x0 + o.l, z0, z1: z0 + o.d, h1: A };
  const p = parede(c, o.estilo === 'contemporanea' ? '#ece4d4' : '#d6c8ae');
  const L = lote(v, largura, fundo, o.estilo === 'contemporanea' ? '#c9c2b3' : '#cbbf9f', { cor: o.estilo === 'contemporanea' ? '#cfc9be' : '#d6cdbd', vao: o.garagem ? [x0 - gl + 0.2, x0 - 0.2] : [x0 + 0.8, x0 + 2.4], portao: c.externo?.portao ?? (o.garagem ? 'basculante' : 'simples'), alt: o.estilo === 'contemporanea' ? 1.6 : 1.1, grade: o.estilo !== 'contemporanea' });
  const J = jardim(v, largura, z0, b.x0, b.x1, c.externo?.paisagismo, 'arvore');
  const corpo: Peca[] = [sombraDoBloco(v, b, A + 1.2)];
  // A garagem colada à casa: a mesma laje, o portão de enrolar, a rampa até a rua.
  if (o.garagem) {
    const g: Bloco = { x0: x0 - gl, x1: x0, z0: z0 - (o.estilo === 'contemporanea' ? 0.6 : 0), z1: z0 + o.d * 0.7, h1: ANDAR - 0.2 };
    corpo.push(marcado(undefined, { 'data-detalhe': 'garagem' }, [
      sombraDoBloco(v, g),
      ...bloco(v, g, { cor: escurecer(p.cor, 0.04), textura: p.textura, soclo: 0.3, corSoclo: '#8f877a', semLado: true }),
      ...platibanda(v, g, 0.3, escurecer(p.cor, 0.04)),
      grupo(frontal(v, g.x0 + 0.3, g.z0, g.h1 - 0.3), [{ tipo: 'massa', d: ret(0, 0, gl - 0.6, g.h1 - 0.3, 0.02), cor: '#8d8a85', marca: 'portao-garagem' }, { tipo: 'linha', d: Array.from({ length: Math.floor((g.h1 - 0.3) / 0.12) }, (_, k) => `M0.03 ${num(0.12 + k * 0.12)}H${num(gl - 0.63)}`).join(''), larg: 0.45, cor: '#6a6662', fino: true }, sombra(ret(0, 0, gl - 0.6, 0.25, 0), 0.25)]),
      noChao(v, g.x0 + 0.2, g.x1 - 0.2, 0.18, g.z0, '#aaa398', 'rampa')
    ]));
  }
  corpo.push(...bloco(v, b, p));
  for (let k = 1; k < o.andares; k++) corpo.push(...cinta(v, b.x0, b.x1, b.z0, k * ANDAR, p.cor));
  if (o.estilo === 'contemporanea') {
    // Platibanda, laje em balanço sobre a sacada, o pano de vidro do térreo, brises quando a fachada é assinada.
    corpo.push(...platibanda(v, b, 0.5, p.cor), ...lajeEmBalanco(v, { ...b, x0: b.x0 + o.l * 0.45, h1: ANDAR + 0.05 }, 0.9, 0.18), sombraDoBeiral(v, b.x0 + o.l * 0.45, b.x1, b.z0, ANDAR, 0.4, 0.2));
    corpo.push(janela(v, b.z0, b.x0 + 0.5, 0.05, o.l * 0.38, 2.3, { acesa: acende(c), vidroClaro: true, moldura: COR.aluminioPreto, peitoril: false, folhas: 3 }));
    corpo.push(porta(v, b.z0, b.x0 + o.l * 0.5, 0.15, { l: 1.2, a: 2.4, cor: '#8a5d38' }));
    corpo.push(janela(v, b.z0, b.x0 + o.l * 0.66, 0.6, o.l * 0.28, 1.6, { acesa: acende(c), moldura: COR.aluminioPreto, vidroClaro: true }));
    for (let k = 1; k < o.andares; k++) corpo.push(janela(v, b.z0, b.x0 + 0.4, k * ANDAR + 0.05, o.l * 0.4, 2.2, { acesa: acende(c), moldura: COR.aluminioPreto, vidroClaro: true, peitoril: false }), janela(v, b.z0, b.x0 + o.l * 0.52, k * ANDAR + 0.05, o.l * 0.42, 2.2, { acesa: acende(c), moldura: COR.aluminioPreto, vidroClaro: true, peitoril: false }), grupo(frontal(v, b.x0 + o.l * 0.48, b.z0 - 0.9, k * ANDAR + 1.1), [{ tipo: 'vidro', d: ret(0, 0, o.l * 0.52, 1, 0.02), claro: true, marca: 'guarda-corpo' }, chapado(ret(0, 0, o.l * 0.52, 0.06, 0.01), COR.aluminioPreto)]));
    if (c.externo?.fachada === 'assinada') corpo.push(grupo(frontal(v, b.x0 + 0.2, b.z0 - 0.15, A), [{ tipo: 'massa', d: Array.from({ length: Math.floor(o.l * 0.4 / 0.4) }, (_, k) => ret(k * 0.4, 0, 0.12, ANDAR * 0.9, 0.02)).join(''), cor: c.externo.cor2Fachada ?? '#2e2b28', semVolume: true, marca: 'brise' }]));
  } else {
    corpo.push(...duasAguas(v, b, 1.8, { cor: COR.telha }, p.cor), sombraDoBeiral(v, b.x0, b.x1, b.z0, A, 0.5));
    for (let k = 0; k < o.andares; k++) {
      const h = k * ANDAR + 0.95;
      if (k === 0) {
        const xp = b.x0 + o.l * 0.45;
        corpo.push(...fileira(v, c, b.z0, b.x0 + 0.2, xp - 0.2, h, o.republica ? 2 : 1, o.republica ? 0.9 : 1.3, 1.15));
        corpo.push(porta(v, b.z0, xp, 0.15), ...degraus(v, b.z0, xp - 0.1, xp + 1, 0.15));
        corpo.push(...fileira(v, c, b.z0, xp + 1.1, b.x1 - 0.2, h, o.republica ? 2 : 1, o.republica ? 0.9 : 1.3, 1.15));
      } else corpo.push(...fileira(v, c, b.z0, b.x0 + 0.2, b.x1 - 0.2, h, o.republica ? 5 : 3, o.republica ? 0.85 : 1.2, 1.15));
    }
    if (o.republica) corpo.push(marcado(undefined, { 'data-detalhe': 'campainhas' }, [grupo(frontal(v, b.x0 + o.l * 0.45 + 1.1, b.z0, 1.6), [{ tipo: 'massa', d: [0, 0.18, 0.36, 0.54].map(y => circulo(0.1, y, 0.05)).join(''), cor: '#4a4643', semVolume: true }])]));
  }
  const xp = o.estilo === 'contemporanea' ? b.x0 + o.l * 0.5 + 0.6 : b.x0 + o.l * 0.45 + 0.45;
  const frente = [...L.frente, ...J.frente, ...luzDeFora(v, c.externo?.luz, b.z0, xp - 0.45, 0.15, [xp, 0])];
  if (o.republica) frente.push(varal14(v, b.x1 + 0.4, Math.min(largura - 0.3, b.x1 + 3.4), z0 + 1.2));
  return { v, fundo: J.fundo, chao: [...L.chao, ...J.chao, ...caminho(v, xp, b.z0, c.externo)], corpo, frente, largura, principal: b };
}

/** O prédio (de três a doze andares): a cinta por andar, a portaria, a marquise, as varandas, o topo. */
function predio(c: Ctx, o: { l: number; d: number; andares: number; tipo: 'baixo' | 'medio' | 'varandas' | 'torre' | 'cobertura'; largura: number }): Cena & { principal: Bloco } {
  const largura = o.largura, fundo = o.d + 6, A = o.andares * ANDAR + (o.tipo === 'cobertura' ? ANDAR * 2 : 0);
  const v = vista(largura, A + (o.tipo === 'baixo' ? 1.6 : 0.8), fundo);
  const z0 = 3, x0 = (largura - o.l) / 2;
  const b: Bloco = { x0, x1: x0 + o.l, z0, z1: z0 + o.d, h1: o.andares * ANDAR };
  const torre = o.tipo === 'torre' || o.tipo === 'cobertura';
  const cor = torre ? '#4f5a62' : c.externo?.corFachada ?? c.cor;
  const L = lote(v, largura, fundo, '#c9c2b3', { cor: torre ? '#5d646c' : '#cfc9be', vao: [x0 + o.l * 0.38, x0 + o.l * 0.62], alt: 1.2, grade: true, portao: torre ? 'automatico' : 'simples' });
  const corpo: Peca[] = [sombraDoBloco(v, b, b.h1, 0.18), ...bloco(v, b, torre ? { cor, corTopo: '#3d464d' } : { cor, textura: texturaDe(c.externo), soclo: 0.5, corSoclo: '#8f877a' })];
  const colunas = Math.max(2, Math.round(o.l / 3));
  for (let k = 1; k < o.andares; k++) corpo.push(...cinta(v, b.x0, b.x1, b.z0, k * ANDAR, cor));
  for (let k = 0; k < o.andares; k++) {
    const h = k * ANDAR + 0.9;
    if (k === 0) { corpo.push(janela(v, b.z0, b.x0 + o.l * 0.36, 0.05, o.l * 0.28, 2.5, { acesa: acende(c), vidroClaro: true, moldura: '#3d464d', peitoril: false, folhas: 2 })); corpo.push(...fileira(v, c, b.z0, b.x0, b.x0 + o.l * 0.32, h, 1, 1.2, 1.1, { grade: !torre })); corpo.push(...fileira(v, c, b.z0, b.x0 + o.l * 0.68, b.x1, h, 1, 1.2, 1.1, { grade: !torre })); continue; }
    if (torre) corpo.push(...fileira(v, c, b.z0, b.x0 + 0.2, b.x1 - 0.2, k * ANDAR + 0.2, colunas + 1, (o.l - 0.4) / (colunas + 1) - 0.12, ANDAR - 0.45, { vidroClaro: true, moldura: '#2c3238', peitoril: false, folhas: 1 }));
    else corpo.push(...fileira(v, c, b.z0, b.x0 + 0.2, b.x1 - 0.2, h, colunas, 1.2, 1.15));
    if (o.tipo === 'varandas') corpo.push(marcado('cena__varanda', { 'data-detalhe': 'varanda' }, [...bloco(v, { x0: b.x0 + 0.3, x1: b.x1 - 0.3, z0: b.z0 - 1.1, z1: b.z0, h0: k * ANDAR - 0.15, h1: k * ANDAR }, { cor: '#efe9dc' }), grupo(frontal(v, b.x0 + 0.3, b.z0 - 1.1, k * ANDAR + 1.05), [{ tipo: 'vidro', d: ret(0, 0, o.l - 0.6, 1.05, 0.02), claro: true }, chapado(ret(0, 0, o.l - 0.6, 0.06, 0.01), '#efe9dc')])]));
  }
  // A marquise da portaria.
  corpo.push(marcado(undefined, { 'data-detalhe': 'marquise' }, lajeEmBalanco(v, { x0: b.x0 + o.l * 0.32, x1: b.x1 - o.l * 0.32, z0: b.z0, z1: b.z0 + 0.4, h1: 2.7 }, 1.2, 0.18)));
  if (o.tipo === 'baixo') corpo.push(...caixaDagua(v, b.x0 + o.l * 0.5, b.z0 + 1, b.h1));
  else if (!torre) corpo.push(...platibanda(v, b, 0.6, cor), marcado(undefined, { 'data-detalhe': 'antena' }, [{ tipo: 'linha', d: (() => { const a = pt(v, b.x1 - 1, b.z0 + 1, b.h1 + 0.6), q = pt(v, b.x1 - 1, b.z0 + 1, b.h1 + 2.2); return `M${num(a[0])} ${num(a[1])}L${num(q[0])} ${num(q[1])}M${num(q[0] - 3)} ${num(q[1] + 2)}h6`; })(), larg: 1, cor: COR.metal }]));
  else corpo.push(...bloco(v, { x0: b.x0 + 0.4, x1: b.x1 - 0.4, z0: b.z0 + 0.4, z1: b.z1 - 0.4, h0: b.h1, h1: b.h1 + 0.8 }, { cor: '#5d646c' }));
  if (o.tipo === 'cobertura') {
    const cb: Bloco = { x0: b.x0 + 1.2, x1: b.x1 - 0.6, z0: b.z0 + 1.4, z1: b.z1 - 0.4, h0: b.h1, h1: b.h1 + ANDAR * 2 };
    corpo.push(marcado(undefined, { 'data-detalhe': 'cobertura' }, [...bloco(v, cb, { cor: '#ece6da' }), janela(v, cb.z0, cb.x0 + 0.3, b.h1 + 0.1, (cb.x1 - cb.x0) - 0.6, ANDAR - 0.3, { acesa: acende(c), vidroClaro: true, moldura: COR.aluminioPreto, peitoril: false, folhas: 3 }), janela(v, cb.z0, cb.x0 + 0.3, b.h1 + ANDAR + 0.4, (cb.x1 - cb.x0) - 0.6, 1.6, { acesa: acende(c), vidroClaro: true, moldura: COR.aluminioPreto, peitoril: false }), ...platibanda(v, cb, 0.3, '#ece6da'),
      { tipo: 'linha', d: Array.from({ length: 6 }, (_, k) => { const a = pt(v, b.x0 + 0.2 + k * 0.5, b.z0 + 0.2, b.h1 + 2.4), q = pt(v, b.x0 + 0.2 + k * 0.5, b.z0 + 1.4, b.h1 + 2.4); return `M${num(a[0])} ${num(a[1])}L${num(q[0])} ${num(q[1])}`; }).join(''), larg: 1, cor: COR.madeira, marca: 'pergola' }]));
  }
  const frente = [...L.frente];
  if (o.tipo === 'torre') frente.push(palmeira(v, b.x1 + 1.4, 1.4, 6), marcado(undefined, { 'data-detalhe': 'piscina' }, [noChao(v, b.x1 + 0.4, largura - 0.4, b.z0 + 1, b.z0 + 3.4, '#d9d4c9', 'deck', 0, true), noChao(v, b.x1 + 0.7, largura - 0.7, b.z0 + 1.3, b.z0 + 3.1, COR.agua, 'agua', 0.02)]), marcado(undefined, { 'data-detalhe': 'portaria' }, bloco(v, { x0: x0 + o.l * 0.66, x1: x0 + o.l * 0.66 + 1.4, z0: 0.6, z1: 1.8, h1: 2.4 }, { cor: '#cfe3ea' })));
  else frente.push(arvore(v, Math.min(largura - 1, b.x1 + 1.6), 1.6, { alt: 5 }));
  return { v, fundo: [], chao: [...L.chao, ...caminho(v, x0 + o.l / 2, b.z0, c.externo)], corpo, frente, largura, principal: b };
}

/** A mansão clássica: o corpo central de dois andares com frontão e colunas, as alas de quatro águas, a piscina. */
function mansao(c: Ctx): Cena & { principal: Bloco } {
  const largura = 30, fundo = 18;
  const v = vista(largura, ANDAR * 2 + 2.6, fundo);
  const z0 = 5.5, cx = 13;
  const centro: Bloco = { x0: cx - 4, x1: cx + 4, z0, z1: z0 + 9, h1: ANDAR * 2 };
  const ae: Bloco = { x0: cx - 10, x1: cx - 4, z0: z0 + 1.2, z1: z0 + 8.5, h1: ANDAR * 2 - 0.4 };
  const ad: Bloco = { x0: cx + 4, x1: cx + 10, z0: z0 + 1.2, z1: z0 + 8.5, h1: ANDAR * 2 - 0.4 };
  const p = parede(c, '#f1ebdf', 0.5);
  const L = lote(v, largura, fundo, '#cbbf9f', { cor: '#e6dfd2', vao: [cx - 1.8, cx + 1.8], alt: 1.4, grade: true, portao: c.externo?.portao ?? 'pivotante' });
  const J = jardim(v, largura, z0, ae.x0, ad.x1, c.externo?.paisagismo ?? 'gramado', 'arvore');
  const corpo: Peca[] = [sombraDoBloco(v, ae, ae.h1 + 1.5), sombraDoBloco(v, centro, centro.h1 + 2)];
  for (const a of [ae, ad]) corpo.push(...bloco(v, a, p), ...cinta(v, a.x0, a.x1, a.z0, ANDAR, p.cor), ...quatroAguas(v, a, 1.6, { cor: COR.telhaEscura }), sombraDoBeiral(v, a.x0, a.x1, a.z0, a.h1, 0.5));
  corpo.push(...bloco(v, centro, p), ...cinta(v, centro.x0, centro.x1, centro.z0, ANDAR, p.cor));
  for (const a of [ae, ad]) for (let k = 0; k < 2; k++) corpo.push(...fileira(v, c, a.z0, a.x0 + 0.3, a.x1 - 0.3, k * ANDAR + 0.8, 2, 1.1, 1.5, { venezianas: '#5d6b52', folhas: 2 }));
  corpo.push(janela(v, centro.z0, cx - 2.6, ANDAR + 0.7, 1.2, 1.6, { acesa: acende(c), folhas: 2 }), janela(v, centro.z0, cx + 1.4, ANDAR + 0.7, 1.2, 1.6, { acesa: acende(c), folhas: 2 }));
  corpo.push(porta(v, centro.z0, cx - 0.9, 0.45, { l: 1.8, a: 2.6, dupla: true, cor: '#5e3b22' }));
  // O pórtico: o piso elevado, quatro colunas de verdade (volumes com sombra), o frontão sobre elas.
  const po: Bloco = { x0: cx - 3.2, x1: cx + 3.2, z0: z0 - 2.4, z1: z0, h0: 0, h1: 0.45 };
  corpo.push(marcado(undefined, { 'data-detalhe': 'colunas' }, [
    ...degraus(v, po.z0, cx - 1.6, cx + 1.6, 0.45, '#e6dfd2'),
    ...bloco(v, po, { cor: '#e6dfd2' }),
    ...[cx - 3, cx - 1.2, cx + 0.9, cx + 2.7].flatMap(x => [sombra(poli(v, [[x + 0.3, po.z0 + 0.2, 0.45], [x + 1.2, po.z0 + 0.8, 0.45], [x + 1.4, po.z0 + 0.8, 0.45], [x + 0.5, po.z0 + 0.2, 0.45]]), 0.18), ...bloco(v, { x0: x, x1: x + 0.36, z0: po.z0 + 0.2, z1: po.z0 + 0.56, h0: 0.45, h1: ANDAR * 2 - 0.4 }, { cor: '#f5f1e8' })]),
    ...bloco(v, { x0: po.x0, x1: po.x1, z0: po.z0, z1: z0, h0: ANDAR * 2 - 0.4, h1: ANDAR * 2 }, { cor: '#efe9dc' }),
    ...frontao(v, { x0: po.x0, x1: po.x1, z0: po.z0, z1: centro.z1, h1: ANDAR * 2 }, 1.8, { cor: COR.telhaEscura }, '#efe9dc')
  ]));
  const frente = [...L.frente, ...J.frente, ...luzDeFora(v, c.externo?.luz ?? 'arandelas', centro.z0, cx - 0.9, 0.45, [cx, 0]), palmeira(v, 1.4, 2.2, 6.5), marcado(undefined, { 'data-detalhe': 'piscina' }, [noChao(v, ad.x1 + 0.6, largura - 0.6, z0 + 1, z0 + 5, '#e3ddd0', 'deck', 0, true), noChao(v, ad.x1 + 1, largura - 1, z0 + 1.4, z0 + 4.6, COR.agua, 'agua', 0.02)])];
  return { v, fundo: J.fundo, chao: [...L.chao, ...J.chao, ...caminho(v, cx, po.z0, c.externo)], corpo, frente, largura, principal: centro };
}

/** O corredor de kitnets: dois pisos, portas iguais, a passarela com guarda-corpo, a escada de fora. */
function kitnet(c: Ctx): Cena & { principal: Bloco } {
  const largura = 22, fundo = 12;
  const v = vista(largura, ANDAR * 2 + 1, fundo);
  const z0 = 3.6, b: Bloco = { x0: 2, x1: 18, z0, z1: z0 + 6, h1: ANDAR * 2 };
  const p = parede(c, '#cfc6b8');
  const L = lote(v, largura, fundo, '#c9c2b3', { cor: '#d6cdbd', vao: [3, 5], portao: 'simples', grade: true });
  const corpo: Peca[] = [sombraDoBloco(v, b, b.h1 + 0.5), ...bloco(v, b, p), ...platibanda(v, b, 0.4, p.cor)];
  const cores = ['#5d6b45', '#7a4f2e', '#3d5d8f', '#7a4f2e', '#5d6b45'];
  for (let piso = 0; piso < 2; piso++) for (let u = 0; u < 5; u++) {
    const x = b.x0 + 0.4 + u * 3.2, h = piso * ANDAR + 0.05;
    corpo.push(porta(v, b.z0, x, h, { l: 0.8, cor: cores[u] }), janela(v, b.z0, x + 1.3, h + 1, 1, 0.9, { acesa: piso === 0 && u === 1 ? acende(c) : false, grade: true }));
  }
  corpo.push(marcado(undefined, { 'data-detalhe': 'corredor' }, [...bloco(v, { x0: b.x0, x1: b.x1, z0: b.z0 - 1.4, z1: b.z0, h0: ANDAR - 0.2, h1: ANDAR }, { cor: COR.laje }), grupo(frontal(v, b.x0, b.z0 - 1.4, ANDAR + 1), [{ tipo: 'linha', d: Array.from({ length: Math.floor(16 / 0.16) }, (_, k) => `M${num(0.08 + k * 0.16)} 0V1`).join('') + 'M0 0.03H16', larg: 0.5, cor: '#3d3a37', marca: 'gradil' }])]));
  corpo.push(marcado(undefined, { 'data-detalhe': 'escada' }, [{ tipo: 'massa', d: poli(v, [[b.x1, b.z0 - 1.4, ANDAR], [b.x1 + 2.6, b.z0 - 1.4, 0], [b.x1 + 2.6, b.z0 - 0.4, 0], [b.x1, b.z0 - 0.4, ANDAR]]), cor: COR.laje, marca: 'escada' }]));
  return { v, fundo: [], chao: [...L.chao, noChao(v, b.x0, b.x1 + 2.6, 0.2, b.z0, '#bdb6aa', 'patio')], corpo, frente: [...L.frente, arbusto(v, b.x0 + 0.4, b.z0 - 1.6, 0.4)], largura, principal: b };
}

/** O sítio: a casa com alpendre e quatro águas, a cerca, as árvores, a roça e a caixa-d'água na torre. */
function sitio(c: Ctx): Cena & { principal: Bloco } {
  const cena = terrea(c, { l: 9, d: 7, telhado: 'quatro', muro: false, arvore: true, alpendre: true, largura: 26 });
  const v = cena.v, b = cena.principal;
  const cerca = (x0: number, x1: number): Peca => grupo(frontal(v, x0, 0.2, 1.1), [{ tipo: 'massa', d: Array.from({ length: Math.floor((x1 - x0) / 1.6) + 1 }, (_, k) => ret(k * 1.6, 0, 0.12, 1.1, 0.02)).join(''), cor: '#8a6a45', marca: 'mourao' }, { tipo: 'linha', d: `M0 0.25H${num(x1 - x0)}M0 0.65H${num(x1 - x0)}`, larg: 0.9, cor: '#7a5a38', marca: 'cerca' }]);
  cena.frente.unshift(marcado(undefined, { 'data-detalhe': 'cerca' }, [cerca(0.2, b.x0 - 0.6), cerca(b.x0 + 2.4, 25.8)]));
  cena.fundo.push(arvore(v, 2.4, 9, { alt: 6, copa: '#5f8f4e' }), arvore(v, 23.4, 11, { alt: 5, frutas: '#e8952a' }));
  // A torre da caixa-d'água (estrutura de madeira) e a roça em fileiras.
  cena.corpo.unshift(marcado(undefined, { 'data-detalhe': 'torre-caixa' }, [
    ...[[b.x1 + 2.2, b.z0 + 4], [b.x1 + 3.6, b.z0 + 4], [b.x1 + 2.2, b.z0 + 5.4], [b.x1 + 3.6, b.z0 + 5.4]].flatMap(([x, z]) => bloco(v, { x0: x, x1: x + 0.18, z0: z, z1: z + 0.18, h1: 4 }, { cor: '#7a5a38' })),
    ...caixaDagua(v, b.x1 + 2.98, b.z0 + 4.1, 4)
  ]));
  cena.chao.push(planoDoChao(v, 1, b.z1 + 0.5, [{ tipo: 'linha', d: Array.from({ length: 6 }, (_, k) => `M0 ${k * 0.5}h${b.x0 - 1.5}`).join(''), larg: 1.6, cor: '#6f9450', marca: 'roca' }]));
  return cena;
}

/** A vila funcional: três casas iguais, o mastro com a bandeira. */
function funcional(c: Ctx): Cena & { principal: Bloco } {
  const largura = 24, fundo = 13;
  const v = vista(largura, ANDAR + 5, fundo);
  const L = lote(v, largura, fundo, '#cbbf9f');
  const corpo: Peca[] = [];
  let principal: Bloco = { x0: 0, x1: 0, z0: 0, z1: 0, h1: 0 };
  [6, 12.2, 18.4].forEach((x, k) => {
    const b: Bloco = { x0: x - 2.6, x1: x + 2.6, z0: 3.4, z1: 9, h1: ANDAR - 0.3 };
    if (k === 1) principal = b;
    corpo.push(sombraDoBloco(v, b, b.h1 + 1.2), ...bloco(v, b, { cor: '#d8d2bf', soclo: 0.3, corSoclo: '#8f877a' }), ...frontao(v, b, 1.4, { cor: COR.telhaEscura }, '#d8d2bf'));
    corpo.push(janela(v, b.z0, b.x0 + 0.4, 0.95, 1.1, 1.1, { acesa: k === 1 && acende(c) }), porta(v, b.z0, x - 0.4, 0.1, { l: 0.85, cor: '#5d6b45' }), janela(v, b.z0, b.x1 - 1.5, 0.95, 1.1, 1.1, { acesa: k !== 1 && acende(c) }));
  });
  const m = pt(v, 1.4, 1.2, 0), t = pt(v, 1.4, 1.2, 7.5);
  const frente = [...L.frente, marcado(undefined, { 'data-detalhe': 'mastro' }, [{ tipo: 'linha', d: `M${num(m[0])} ${num(m[1])}L${num(t[0])} ${num(t[1])}`, larg: 1.4, cor: COR.metal }, { tipo: 'massa', d: `M${num(t[0])} ${num(t[1])}l${num(v.S * 1.4)} ${num(v.S * 0.35)}l${num(-v.S * 1.4)} ${num(v.S * 0.35)}z`, cor: '#2f7a4a', marca: 'bandeira' }])];
  return { v, fundo: [], chao: L.chao, corpo, frente, largura, principal };
}

const FORMAS14: Record<FormaDaCasa, (c: Ctx) => Cena & { principal: Bloco }> = {
  casa_simples: c => terrea(c, { l: 7, d: 6, telhado: 'laje', muro: true, arvore: false, largura: 16 }),
  casa_2q: c => terrea(c, { l: 8, d: 7, telhado: 'frontao', muro: true, arvore: true, largura: 17 }),
  familia: c => terrea(c, { l: 9, d: 7, telhado: 'duas', muro: true, arvore: true, alpendre: true, extra: 'vasos', largura: 18 }),
  parente: c => terrea(c, { l: 8, d: 7, telhado: 'laje', muro: true, arvore: false, extra: 'puxadinho', largura: 16 }),
  favor: c => terrea(c, { l: 7.5, d: 6.5, telhado: 'duas', muro: true, arvore: false, extra: 'edicula', largura: 18 }),
  casa_3q: c => sobrado(c, { l: 8.5, d: 8, andares: 2, estilo: 'tradicional', garagem: 1, largura: 18 }),
  casa_grande: c => sobrado(c, { l: 11, d: 9, andares: 2, estilo: 'contemporanea', garagem: 2, largura: 24 }),
  republica: c => sobrado(c, { l: 8, d: 8, andares: 3, estilo: 'tradicional', largura: 16, republica: true }),
  kitnet,
  sitio,
  funcional,
  mansao,
  apto_1q: c => predio(c, { l: 10, d: 10, andares: 3, tipo: 'baixo', largura: 18 }),
  apto_2q: c => predio(c, { l: 12, d: 11, andares: 5, tipo: 'medio', largura: 20 }),
  apto_3q: c => predio(c, { l: 12, d: 12, andares: 8, tipo: 'varandas', largura: 20 }),
  alto_padrao: c => predio(c, { l: 13, d: 13, andares: 12, tipo: 'torre', largura: 26 }),
  cobertura: c => predio(c, { l: 13, d: 12, andares: 9, tipo: 'cobertura', largura: 22 })
};

/* ============================================================== A cena inteira */

const COMPRIMENTO = { carro: 4.2, moto: 2.1, bicicleta: 1.75 } as const;

export function amostraDaCasa14(e: CenaEntrada): Amostra {
  const pl = PLANTAS[e.forma];
  const ctx: Ctx = { acesas: Math.max(1, e.acesas), tijolo: e.tijolo, cor: e.fachada ?? pl.cor, externo: e.externo, usadas: 0 };
  const cena = FORMAS14[e.forma](ctx);
  const v = cena.v, b = cena.principal;
  const pecas: Peca[] = [
    { tipo: 'massa', d: ret(0, 0, W, H, 0), cor: '#b9ad98', opacidade: 0, semVolume: true, semContorno: true, marca: 'chao', classe: 'cena__chao' },
    ...cena.chao, ...cena.fundo, ...cena.corpo,
    ...estado(v, b, e.nivel, e.reforma),
    ...cena.frente
  ];
  // O veículo: estacionado junto ao meio-fio, na frente de casa (a mesma ilustração da garagem, na escala da cena).
  if (e.veiculo) {
    const a = amostraDoVeiculo(e.veiculo.forma, e.veiculo.cor, e.veiculo.versaoId, e.veiculo.versaoId, e.veiculo.estado);
    const s = (COMPRIMENTO[e.veiculo.tipo] * v.S) / a.vb[0];
    const [px, py] = pt(v, Math.max(0.3, b.x0 - COMPRIMENTO[e.veiculo.tipo] - 0.4), -CALCADA - 0.9, 0);
    pecas.push({ tipo: 'grupo', t: `translate(${num(px)} ${num(py - (a.chao ?? 122) * s)}) scale(${s.toFixed(4)})`, pecas: a.pecas, classe: 'cena__veiculo', attrs: { 'data-forma': e.veiculo.forma } });
  }
  // Os bichos: na calçada, na frente do portão (a escala do desenho de antes, ajustada à régua da cena).
  e.bichos.slice(0, 2).forEach((bi, k) => {
    const [px, py] = pt(v, Math.min(cena.largura - 1.2, b.x1 + 0.4 + k * 1.3), -0.7, 0);
    const s = v.S / 24;
    pecas.push({ tipo: 'grupo', t: `translate(${num(px)} ${num(py)}) scale(${s.toFixed(4)}) translate(0 -128)`, pecas: [bi.especie === 'gato' ? gato(0, bi.id) : cachorro(0, bi.id)] });
  });
  return { vb: [W, H], pecas };
}

void lateral; void COR;
