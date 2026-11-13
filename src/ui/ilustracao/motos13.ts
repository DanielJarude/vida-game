/**
 * VIDA 13 — AS MOTOS DE HOJE NO DESENHO, montadas peça a peça como as clássicas da 12.9.1 (não a mesma moto com outra
 * cor): o QUADRO (treliça de tubos da Ducati e da KTM, a viga de alumínio da esportiva, o berço de aço da trail), o
 * MOTOR (monocilíndrico, bicilíndrico em linha, três em linha, quatro em linha, o V2 em L, o V4, o boxer da GS) com o
 * radiador na frente, a BALANÇA e o monochoque com a mola colorida, o GARFO (invertido dourado, convencional cromado,
 * o de curso longo da trail), os DISCOS de freio e as pinças, o TANQUE (com as abas da naked), o BANCO e a RABETA
 * (curta e alta na esportiva, longa e reta na trail), o ESCAPE (sob o motor, a ponteira lateral, o alto da trail), o
 * FAROL (redondo, o anguloso de LED, o duplo, os rasgos da esportiva), a CARENAGEM inteira com a bolha, o BICO e o
 * para-brisa alto da big trail, o protetor de motor, as malas de alumínio.
 *
 * As de linha clássica de hoje (a CG, a Factor, a Hunter, a Bonneville, a Interceptor, as Harley e a Indian) usam o
 * montador das clássicas (`motosClassicas1291`), com o que é delas: a roda de liga, a roda fechada da Fat Boy, a
 * carenagem "asa de morcego" e os alforjes rígidos da Street Glide.
 */
import { cantos, circulo, escurecer, clarear, membro, num as f, ret, suave, type Peca } from './nucleo';
import { motoClassica, type PerfilClassica } from './motosClassicas1291';

type Pt = [number, number];
const CHAO = 122;
const PRETO = '#2b2826', CROMO = '#d9d6d0', COURO = '#2f2a27', ALU = '#a9a59e', LUZ = '#f2ead2', DOURADO = '#c9a23a';

export interface PerfilModerna {
  tipo: 'naked' | 'esportiva' | 'trail' | 'aventura';
  motor: 'mono' | 'bi' | 'tres' | 'quatro' | 'v2' | 'v4' | 'boxer';
  quadro: 'trelica' | 'viga' | 'tubular';
  quadroCor?: string;
  garfo?: 'invertido' | 'convencional';
  garfoCor?: string;
  farol: 'redondo' | 'anguloso' | 'duplo' | 'rasgo';
  escape: 'baixo' | 'lateral' | 'alto' | 'curto' | 'duplo';
  rodas?: 'liga' | 'raios';
  raios?: number;
  /** raio das rodas (trás, frente) */
  r?: [number, number];
  radiador?: boolean;
  asas?: boolean;
  parabrisa?: boolean;
  bico?: boolean;
  protetor?: boolean;
  malas?: boolean;
  /** a mola do monochoque (a cor) */
  mola?: string;
  /** a segunda cor de fábrica (a faixa da carenagem, o tanque bicolor) */
  faixa?: string;
  /** a moto pequena (a Grom, a 160): tudo um pouco menor */
  pequena?: boolean;
  /** as abas do tanque da naked (o radiador escondido) */
  abas?: boolean;
  bagageiro?: boolean;
}

/** As de hoje (as nakeds, as esportivas, as trails e as big trails). */
export const MOTOS_MODERNAS_13: Record<string, PerfilModerna> = {
  // ERAS HISTÓRICAS: as motos da época (`motor/eras/base/veiculos`).
  ep_honda_twister: { tipo: 'naked', motor: 'mono', quadro: 'tubular', farol: 'redondo', escape: 'lateral', radiador: false, abas: false, mola: '#26272a', faixa: '#c8372d' },
  ep_honda_cb300r: { tipo: 'naked', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'lateral', radiador: false, abas: true, mola: '#26272a', faixa: '#c9c6c0' },
  ep_honda_sahara: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'redondo', escape: 'alto', rodas: 'raios', radiador: false, r: [23, 25], mola: '#26272a', faixa: '#c8372d' },
  ep_honda_falcon: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'duplo', escape: 'alto', rodas: 'raios', radiador: false, r: [22.5, 24.5], mola: '#c8372d', faixa: '#26272a' },
  // Nakeds.
  yamaha_fazer: { tipo: 'naked', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'lateral', radiador: false, abas: true, mola: '#c8372d', faixa: '#26272a' },
  honda_cb300f: { tipo: 'naked', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'curto', radiador: true, abas: true, mola: '#c8372d' },
  yamaha_mt03: { tipo: 'naked', motor: 'bi', quadro: 'tubular', garfo: 'invertido', garfoCor: '#2f3a5a', farol: 'duplo', escape: 'curto', radiador: true, abas: true, mola: '#3f6fb8', faixa: '#26272a' },
  bajaj_pulsar: { tipo: 'naked', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'lateral', radiador: false, abas: true, mola: '#c8372d', faixa: '#c9c6c0' },
  honda_grom: { tipo: 'naked', motor: 'mono', quadro: 'tubular', garfo: 'invertido', garfoCor: DOURADO, farol: 'redondo', escape: 'curto', radiador: false, pequena: true, r: [16, 16], mola: '#c8372d' },
  honda_cb500f: { tipo: 'naked', motor: 'bi', quadro: 'tubular', garfo: 'invertido', garfoCor: DOURADO, farol: 'anguloso', escape: 'curto', radiador: true, abas: true, mola: '#c8372d', faixa: '#26272a' },
  kawasaki_z900: { tipo: 'naked', motor: 'quatro', quadro: 'trelica', quadroCor: '#3d7a3a', garfo: 'invertido', garfoCor: '#3a3633', farol: 'anguloso', escape: 'curto', radiador: true, abas: true, mola: '#3d7a3a', faixa: '#26272a' },
  yamaha_mt09: { tipo: 'naked', motor: 'tres', quadro: 'viga', quadroCor: '#55585d', garfo: 'invertido', garfoCor: DOURADO, farol: 'duplo', escape: 'curto', radiador: true, abas: true, mola: '#3f6fb8', faixa: '#26272a' },
  triumph_street_triple: { tipo: 'naked', motor: 'tres', quadro: 'viga', quadroCor: '#7b7e83', garfo: 'invertido', garfoCor: DOURADO, farol: 'duplo', escape: 'baixo', radiador: true, abas: true, mola: '#c9a23a' },
  // Esportivas.
  kawasaki_ninja400: { tipo: 'esportiva', motor: 'bi', quadro: 'trelica', quadroCor: '#26272a', farol: 'rasgo', escape: 'lateral', radiador: true, mola: '#3d7a3a', faixa: '#26272a' },
  ducati_panigale: { tipo: 'esportiva', motor: 'v4', quadro: 'viga', garfo: 'invertido', garfoCor: DOURADO, farol: 'rasgo', escape: 'baixo', radiador: true, asas: true, mola: '#c9a23a', faixa: '#ecebe6' },
  bmw_s1000rr: { tipo: 'esportiva', motor: 'quatro', quadro: 'viga', garfo: 'invertido', garfoCor: DOURADO, farol: 'anguloso', escape: 'lateral', radiador: true, asas: true, mola: '#2747a8', faixa: '#ecebe6' },
  honda_fireblade: { tipo: 'esportiva', motor: 'quatro', quadro: 'viga', garfo: 'invertido', garfoCor: DOURADO, farol: 'rasgo', escape: 'lateral', radiador: true, asas: true, mola: '#c8372d', faixa: '#ecebe6' },
  ducati_superleggera: { tipo: 'esportiva', motor: 'v4', quadro: 'viga', quadroCor: '#3a3633', garfo: 'invertido', garfoCor: DOURADO, farol: 'rasgo', escape: 'alto', radiador: true, asas: true, rodas: 'liga', raios: 5, mola: '#c9a23a', faixa: '#1f1f22' },
  // Trails.
  honda_bros: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'alto', rodas: 'raios', radiador: false, r: [23, 25], mola: '#c8372d', faixa: '#ecebe6' },
  honda_xre190: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'alto', rodas: 'raios', radiador: false, r: [23, 25], mola: '#c8372d', faixa: '#26272a', bagageiro: true },
  yamaha_lander: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'alto', rodas: 'raios', radiador: false, r: [23, 25], mola: '#3f6fb8', bagageiro: true },
  honda_sahara: { tipo: 'trail', motor: 'mono', quadro: 'tubular', farol: 'anguloso', escape: 'alto', rodas: 'raios', radiador: false, r: [23, 25], parabrisa: true, mola: '#c8372d', faixa: '#ecebe6' },
  royal_enfield_himalayan: { tipo: 'aventura', motor: 'mono', quadro: 'tubular', farol: 'redondo', escape: 'alto', rodas: 'raios', radiador: true, r: [23, 25], parabrisa: true, protetor: true, bagageiro: true, mola: '#3a3633' },
  // Big trails.
  honda_africa_twin: { tipo: 'aventura', motor: 'bi', quadro: 'tubular', farol: 'duplo', escape: 'alto', rodas: 'raios', radiador: true, r: [23, 25.5], parabrisa: true, bico: true, protetor: true, mola: '#c8372d', faixa: '#ecebe6' },
  bmw_r1300gs: { tipo: 'aventura', motor: 'boxer', quadro: 'tubular', farol: 'anguloso', escape: 'lateral', rodas: 'raios', radiador: false, r: [23, 24.5], parabrisa: true, bico: true, malas: true, mola: '#2747a8', faixa: '#ecebe6' },
  ducati_multistrada: { tipo: 'aventura', motor: 'v4', quadro: 'trelica', quadroCor: '#3a3633', garfo: 'invertido', garfoCor: DOURADO, farol: 'anguloso', escape: 'lateral', rodas: 'liga', radiador: true, r: [23, 24], parabrisa: true, bico: true, mola: '#c9a23a' }
};

/** As de linha clássica de hoje: o montador das clássicas, com o que é delas. */
export const MOTOS_RETRO_13: Record<string, PerfilClassica & { disco?: boolean; asaDeMorcego?: boolean; alforjes?: boolean; bagageiro?: boolean }> = {
  // ERAS HISTÓRICAS: as motos da época (`motor/eras/base/veiculos`).
  ep_honda_cg125: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: ALU, faixa: '#ecebe6', r: 21, bagageiro: true },
  ep_yamaha_ybr125: { motor: 'mono', guidao: 'reto', tanque: 'longo', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: '#3a3633', faixa: '#ecebe6', r: 21.5 },
  ep_honda_cg150: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: '#8c8882', faixa: '#c8372d', r: 21.5, bagageiro: true },
  ep_honda_cb400: { motor: 'paralelo', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: CROMO, faixa: '#26272a', r: 22 },
  ep_honda_cb450: { motor: 'paralelo', guidao: 'reto', tanque: 'longo', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: ALU, faixa: '#c8372d', r: 22 },
  honda_cg160: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: '#8c8882', faixa: '#26272a', r: 22, bagageiro: true },
  yamaha_factor: { motor: 'mono', guidao: 'reto', tanque: 'longo', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: '#3a3633', faixa: '#c9c6c0', r: 22 },
  haojue_dk150: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: ALU, r: 22 },
  honda_cb125f: { motor: 'mono', guidao: 'reto', tanque: 'pequeno', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: '#8c8882', faixa: '#ecebe6', r: 21.5, bagageiro: true },
  royal_enfield_hunter: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: '#3a3633', paralama: 'curto', r: 22 },
  triumph_bonneville: { motor: 'paralelo', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: '#3a3633', faixa: '#ecebe6' },
  royal_enfield_interceptor: { motor: 'paralelo', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', rodas: 'raios', motorCor: CROMO, faixa: '#d9d6d0' },
  harley_street_glide: { motor: 'vtwin', cabeca: 'panela', guidao: 'puxado', tanque: 'harley', banco: 'duplo', escape: 'dois', rodas: 'liga', motorCor: '#3a3633', paralama: 'fundo', asaDeMorcego: true, alforjes: true },
  harley_fat_boy: { motor: 'vtwin', cabeca: 'panela', guidao: 'puxado', tanque: 'harley', banco: 'duplo', escape: 'peixe', motorCor: CROMO, paralama: 'fundo', balao: true, disco: true },
  indian_scout: { motor: 'vtwin', guidao: 'puxado', tanque: 'gota', banco: 'cafe', escape: 'dois', rodas: 'liga', motorCor: '#3a3633', paralama: 'fundo', balao: true }
};

/** A moto de linha clássica de hoje (o montador das clássicas + o que é dela). */
export function motoRetro(cor: string, id: string): Peca[] {
  const p = MOTOS_RETRO_13[id];
  let pecas = motoClassica(cor, p);
  if (p.disco) pecas = pecas.map(x => (x.tipo === 'pneu' ? { ...x, aro: 'calota' as const, corAro: CROMO } : x));
  const extra: Peca[] = [];
  if (p.bagageiro) extra.push({ tipo: 'metal', d: ret(34, 50, 26, 3, 1) + ret(36, 53, 2.6, 8, 1), cor: '#4a4743', marca: 'bagageiro' });
  if (p.alforjes) extra.push(
    // Os alforjes rígidos da touring: a mala que desce rente à roda de trás.
    { tipo: 'massa', d: suave([[34, 66], [76, 64], [80, 74], [74, 90], [40, 92], [32, 80]], true, 0.4), cor, marca: 'alforje-rigido' },
    { tipo: 'linha', d: 'M36 74H78', larg: 1, cor: CROMO, fino: true }
  );
  if (p.asaDeMorcego) extra.push(
    // A carenagem "asa de morcego" presa ao garfo, com o farol duplo e o para-brisa baixo.
    { tipo: 'massa', d: suave([[150, 26], [176, 22], [190, 38], [184, 56], [160, 58], [148, 44]], true, 0.4), cor, marca: 'carenagem-asa-de-morcego' },
    { tipo: 'vidro', d: suave([[152, 26], [160, 14], [176, 14], [176, 22]], true, 0.4), claro: true, marca: 'parabrisa' },
    { tipo: 'luz', d: circulo(182, 40, 5.4), cor: LUZ, marca: 'farol' }
  );
  return [...pecas, ...extra];
}

/* ------------------------------------------------------------------ o montador das de hoje */

const tubo = (pts: Pt[], larg: number, cor: string, marca?: string): Peca => ({ tipo: 'linha', d: `M${pts.map(q => `${f(q[0])} ${f(q[1])}`).join('L')}`, larg, cor, ...(marca ? { marca } : {}) });

export function motoModerna(cor: string, p: PerfilModerna): Peca[] {
  const [rT, rD] = p.r ?? [23, 23];
  const trail = p.tipo === 'trail' || p.tipo === 'aventura';
  const esp = p.tipo === 'esportiva';
  const eT = p.pequena ? 70 : 58, eD = p.pequena ? 174 : trail ? 186 : 184;
  const yT = CHAO - rT, yD = CHAO - rD;
  // A cabeça do quadro (onde o garfo entra) e o pivô da balança.
  const H: Pt = trail ? [154, 34] : esp ? [158, 44] : p.pequena ? [146, 52] : [154, 42];
  const P: Pt = p.pequena ? [112, 92] : [114, 90];
  const qc = p.quadroCor ?? PRETO;
  const escura = escurecer(cor, 0.35);
  const atras: Peca[] = [], meio: Peca[] = [], frente: Peca[] = [];

  // As rodas, os discos e as pinças.
  const aro = p.rodas ?? 'liga';
  const roda = (cx: number, cy: number, r: number): Peca => ({ tipo: 'pneu', cx, cy, r, aro: trail && aro === 'raios' && p.tipo === 'trail' ? 'cravos' : aro, raios: aro === 'liga' ? (p.raios ?? (esp ? 5 : 6)) : undefined, aroMaior: !trail, marca: 'roda' });
  atras.push(roda(eT, yT, rT), roda(eD, yD, rD));
  const disco = (cx: number, cy: number, r: number, marca: string): Peca[] => [
    { tipo: 'massa', d: `${circulo(cx, cy, r)}M${f(cx + r * 0.62)} ${f(cy)}a${f(r * 0.62)} ${f(r * 0.62)} 0 1 1 ${f(-r * 1.24)} 0a${f(r * 0.62)} ${f(r * 0.62)} 0 1 1 ${f(r * 1.24)} 0z`, cor: '#b9b6b0', semVolume: true, marca },
    { tipo: 'massa', d: cantos([[cx - r * 0.5, cy - r - 1.6, 1.2], [cx + r * 0.2, cy - r - 2.4, 1.2], [cx + r * 0.3, cy - r * 0.55, 1.2], [cx - r * 0.4, cy - r * 0.5, 1.2]]), cor: esp || p.garfo === 'invertido' ? '#c8372d' : '#3a3633', semVolume: true, marca: 'pinca' }
  ];
  atras.push(...disco(eD, yD, rD * 0.52, 'disco'), ...disco(eT, yT, rT * 0.4, 'disco-traseiro'));

  // A balança (de alumínio na esportiva), o monochoque com a mola, a corrente.
  atras.push({ tipo: 'metal', d: membro([[eT, yT], [(eT + P[0]) / 2, (yT + P[1]) / 2 - 2], P], [5, 7, 8]), cor: esp || p.quadro === 'viga' ? ALU : PRETO, marca: 'balanca' });
  atras.push({ tipo: 'linha', d: `M${eT} ${f(yT - 4.5)}L${P[0] + 2} ${P[1] - 5}M${eT} ${f(yT + 4.5)}L${P[0] + 2} ${P[1] + 4}`, larg: 1.1, cor: '#4a4743', fino: true, marca: 'corrente' });
  const choque: [Pt, Pt] = [[P[0] - 6, P[1] - 4], [P[0] - 12, P[1] - 30]];
  atras.push({ tipo: 'metal', d: membro(choque, [3.6, 3.6]), cor: '#3a3633', marca: 'monochoque' });
  atras.push({ tipo: 'linha', d: Array.from({ length: 5 }, (_, k) => { const t = 0.2 + k * 0.14; const x = choque[0][0] + (choque[1][0] - choque[0][0]) * t, y = choque[0][1] + (choque[1][1] - choque[0][1]) * t; return `M${f(x - 3)} ${f(y + 0.6)}l6 -1.2`; }).join(''), larg: 1.5, cor: p.mola ?? '#c8372d', marca: 'mola' });

  // O quadro: a treliça (triângulos de tubo), a viga de alumínio, o tubular da trail e da naked de entrada.
  const B: Pt = [P[0] - 4, P[1] - 30];
  if (p.quadro === 'trelica') atras.push(tubo([H, [128, 70], P, [104, 56], H, [120, 50], [128, 70], [104, 56]], 2.2, qc, 'quadro-trelica'), tubo([[104, 56], [64, 50], [108, 70]], 1.8, qc, 'subquadro'));
  else if (p.quadro === 'viga') atras.push({ tipo: 'metal', d: membro([H, [134, 58], [P[0] + 6, P[1] - 8]], [10, 12, 12]), cor: p.quadroCor ?? '#8d8a85', marca: 'quadro-viga' }, tubo([[110, 56], [64, 50]], 2, '#3a3633', 'subquadro'));
  else atras.push(tubo([H, B, P], 3, qc, 'quadro'), tubo([[H[0] - 2, H[1] + 8], [148, 96], [118, 104], P], 2.6, qc, 'berco'), tubo([B, [70, 52]], 2.2, qc, 'subquadro'));

  // O motor: o bloco, os cilindros inclinados para a frente, o cárter, a tampa do alternador.
  const mc = esp ? '#3a3633' : '#5d5a56';
  const cl = clarear(mc, 0.25);
  if (p.motor === 'boxer') meio.push(
    { tipo: 'massa', d: suave([[110, 66], [138, 62], [146, 74], [144, 100], [126, 106], [108, 98]], true, 0.5), cor: ALU, marca: 'bloco-boxer' },
    { tipo: 'massa', d: cantos([[138, 78, 5], [160, 76, 5], [162, 98, 5], [140, 100, 5]]), cor: ALU, marca: 'cilindro-de-lado' },
    { tipo: 'massa', d: cantos([[156, 77, 4], [166, 78, 4], [166, 97, 4], [156, 98, 4]]), cor: '#3a3633', marca: 'tampa-do-cabecote' }
  );
  else {
    const larg = p.motor === 'quatro' ? 34 : p.motor === 'tres' ? 30 : p.motor === 'bi' || p.motor === 'v2' ? 24 : 18;
    const x0 = 134 - larg / 2;
    meio.push(
      { tipo: 'massa', d: suave([[104, 86], [126, 82], [150, 88], [150, 102], [128, 108], [106, 104]], true, 0.45), cor: escurecer(mc, 0.2), marca: 'carter' },
      { tipo: 'massa', d: cantos([[x0, 82, 3], [x0 + 6, 60, 3], [x0 + larg + 8, 58, 3], [x0 + larg + 4, 84, 3]]), cor: mc, marca: p.motor === 'v4' || p.motor === 'v2' ? 'cilindro-dianteiro' : 'cilindros' },
      { tipo: 'massa', d: cantos([[x0 + 5, 62, 2], [x0 + 7, 54, 2], [x0 + larg + 9, 53, 2], [x0 + larg + 8, 60, 2]]), cor: cl, marca: 'tampa-de-valvula' },
      { tipo: 'massa', d: circulo(116, 94, 7), cor: cl, marca: 'tampa-do-alternador' },
      ...(p.radiador ? [] : [{ tipo: 'linha' as const, d: Array.from({ length: 4 }, (_, k) => `M${x0 + 3 + k * 0.6} ${66 + k * 4.4}h${larg + 2}`).join(''), larg: 0.8, cor: escurecer(mc, 0.45), fino: true, marca: 'aletas' }])
    );
    if (p.motor === 'v4' || p.motor === 'v2') meio.push({ tipo: 'massa', d: cantos([[108, 82, 3], [104, 60, 3], [118, 58, 3], [124, 80, 3]]), cor: mc, marca: 'cilindro-traseiro' });
  }
  if (p.radiador) meio.push(
    { tipo: 'massa', d: cantos([[148, 52, 2], [158, 50, 2], [156, 84, 2], [146, 84, 2]]), cor: '#2b2a29', marca: 'radiador' },
    { tipo: 'linha', d: 'M149 57h7M149 62h7M148 67h8M148 72h8M148 77h8', larg: 0.5, cor: '#6b6864', fino: true }
  );

  // O escape.
  const coletor = p.motor === 'boxer' ? [[160, 96], [154, 108], [128, 110]] as Pt[] : [[150, 64], [156, 84], [146, 104], [126, 108]] as Pt[];
  if (p.escape === 'baixo') meio.push({ tipo: 'metal', d: membro(coletor, [3.4, 3.4, 3.6, 4]), cor: '#8d8a85', marca: 'coletor' }, { tipo: 'metal', d: cantos([[104, 104, 3], [128, 104, 3], [130, 114, 3], [102, 112, 3]]), cor: '#3a3633', marca: 'escape-sob-o-motor' });
  else if (p.escape === 'curto') meio.push({ tipo: 'metal', d: membro(coletor, [3.4, 3.4, 3.6, 4]), cor: '#8d8a85', marca: 'coletor' }, { tipo: 'metal', d: membro([[112, 106], [92, 104], [84, 98]], [9, 9, 8]), cor: '#3a3633', marca: 'escape-curto' }, { tipo: 'metal', d: circulo(84, 98, 3), cor: '#8d8a85' });
  else if (p.escape === 'alto') meio.push({ tipo: 'metal', d: membro([...coletor.slice(0, 2), [130, 76], [100, 66]], [3.4, 3.4, 4, 4.4]), cor: '#8d8a85', marca: 'coletor' }, { tipo: 'metal', d: membro([[104, 66], [72, 54], [48, 50]], [8, 9, 8]), cor: trail ? '#4f4c48' : '#3a3633', marca: 'escape-alto' });
  else meio.push({ tipo: 'metal', d: membro(coletor, [3.4, 3.4, 3.6, 4]), cor: '#8d8a85', marca: 'coletor' }, { tipo: 'metal', d: membro([[124, 108], [100, 104], [70, 90], [56, 86]], [4, 6, 9, 9]), cor: esp ? '#3a3633' : ALU, marca: 'escape-lateral' });

  // A carenagem inteira da esportiva (cobre o motor), a barriga, as asas.
  if (esp) {
    frente.push(
      { tipo: 'massa', d: suave([[110, 66], [132, 56], [156, 40], [174, 36], [190, 50], [184, 62], [166, 74], [156, 96], [138, 108], [114, 108], [108, 98], [128, 90], [140, 76]], true, 0.3), cor, marca: 'carenagem' },
      { tipo: 'massa', d: suave([[142, 74], [154, 70], [151, 80], [140, 84]], true, 0.4), cor: escura, semVolume: true, marca: 'saida-de-ar' },
      ...(p.faixa ? [{ tipo: 'massa' as const, d: suave([[120, 100], [148, 92], [156, 80], [159, 82], [152, 96], [122, 104]], true, 0.4), cor: p.faixa, semVolume: true, marca: 'grafismo' }] : []),
      { tipo: 'vidro', d: suave([[158, 40], [170, 26], [182, 30], [178, 40]], true, 0.4), claro: true, marca: 'bolha' }
    );
    if (p.asas) frente.push({ tipo: 'massa', d: 'M168 60l14 -3l-3 8l-12 1z', cor: escurecer(cor, 0.4), semVolume: true, marca: 'asa' });
  }

  // O tanque (a naked com as abas sobre o radiador), o banco, a rabeta.
  const tq: Pt[] = trail ? [[106, 46], [122, 34], [150, 32], [156, 42], [144, 54], [110, 56]]
    : esp ? [[108, 52], [124, 40], [152, 40], [156, 48], [136, 58], [110, 58]]
    : p.pequena ? [[110, 58], [122, 48], [142, 48], [146, 56], [130, 64], [112, 64]]
    : [[104, 52], [120, 38], [150, 38], [156, 48], [140, 60], [106, 60]];
  frente.push({ tipo: 'massa', d: suave(tq, true, 0.5), cor, marca: 'tanque' });
  if (p.abas) frente.push({ tipo: 'massa', d: suave([[144, 50], [160, 46], [164, 62], [150, 74], [142, 64]], true, 0.4), cor: p.faixa ?? escurecer(cor, 0.25), marca: 'aba-do-tanque' });
  if (p.faixa && !esp && !p.abas) frente.push({ tipo: 'massa', d: suave([[tq[0][0] + 8, tq[0][1] + 2], [tq[2][0] - 6, tq[2][1] + 6], [tq[3][0] - 4, tq[3][1] + 4], [tq[0][0] + 10, tq[0][1] + 6]], true, 0.4), cor: p.faixa, semVolume: true, marca: 'faixa-do-tanque' });
  // O banco e a rabeta: a esportiva alta e curta; a trail longa e reta; a naked com o degrau da garupa.
  if (trail) frente.push(
    { tipo: 'massa', d: suave([[56, 44], [84, 44], [112, 44], [112, 52], [60, 52]], true, 0.3), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: suave([[34, 40], [58, 40], [70, 50], [40, 52]], true, 0.4), cor, marca: 'rabeta' },
    { tipo: 'massa', d: suave([[72, 52], [100, 54], [98, 62], [78, 64]], true, 0.4), cor: escurecer(cor, 0.12), marca: 'tampa-lateral' }
  );
  else if (esp) frente.push(
    { tipo: 'massa', d: suave([[38, 38], [62, 42], [94, 52], [100, 60], [66, 58], [44, 48]], true, 0.4), cor, marca: 'rabeta' },
    { tipo: 'massa', d: suave([[72, 48], [100, 52], [110, 58], [84, 58]], true, 0.4), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: suave([[50, 42], [64, 44], [70, 48], [54, 48]], true, 0.4), cor: escurecer(cor, 0.2), semVolume: true, marca: 'banco-garupa' }
  );
  else frente.push(
    { tipo: 'massa', d: suave(p.pequena ? [[66, 56], [96, 56], [112, 58], [112, 64], [70, 64]] : [[74, 54], [102, 54], [110, 58], [108, 64], [76, 62]], true, 0.35), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: suave(p.pequena ? [[52, 52], [70, 54], [72, 62], [56, 62]] : [[44, 44], [62, 46], [78, 54], [76, 62], [50, 54]], true, 0.4), cor, marca: 'rabeta' },
    ...(p.pequena ? [] : [{ tipo: 'massa' as const, d: suave([[52, 46], [66, 48], [74, 52], [58, 52]], true, 0.4), cor: COURO, marca: 'banco-garupa' }])
  );
  // A lanterna, o suporte da placa.
  const tail: Pt = trail ? [36, 44] : esp ? [40, 42] : p.pequena ? [54, 56] : [46, 48];
  frente.push({ tipo: 'luz', d: ret(tail[0] - 1, tail[1], 6, 3.4, 1), cor: '#c8372d', marca: 'lanterna' }, { tipo: 'linha', d: `M${tail[0] + 4} ${tail[1] + 4}l-4 14h-6`, larg: 1.6, cor: PRETO, fino: true, marca: 'suporte-da-placa' });
  if (p.bagageiro) frente.push({ tipo: 'metal', d: ret(tail[0] - 4, tail[1] - 4, 26, 3, 1), cor: '#4a4743', marca: 'bagageiro' });
  if (p.malas) frente.push({ tipo: 'metal', d: cantos([[36, 54, 3], [72, 54, 3], [72, 80, 3], [38, 80, 3]]), cor: '#8d8f92', marca: 'mala' }, { tipo: 'linha', d: 'M38 60H70', larg: 0.8, cor: '#5d5f62', fino: true });
  if (p.protetor) frente.push(tubo([[140, 54], [162, 66], [158, 96], [140, 104]], 2.2, '#3a3633', 'protetor-de-motor'));
  if (trail) frente.push({ tipo: 'metal', d: cantos([[110, 106, 2], [146, 104, 2], [150, 112, 2], [114, 114, 2]]), cor: ALU, marca: 'protetor-de-carter' });

  // O garfo (invertido: o tubo grosso em cima, dourado; convencional: o fino cromado em cima), o para-lama.
  const inv = p.garfo === 'invertido';
  const meioG: Pt = [H[0] + (eD - H[0]) * 0.5, H[1] + (yD - H[1]) * 0.5];
  frente.push(
    { tipo: 'metal', d: membro([H, meioG], inv ? [6.5, 6.5] : [4.4, 4.4]), cor: inv ? (p.garfoCor ?? DOURADO) : CROMO, marca: inv ? 'garfo-invertido' : 'garfo' },
    { tipo: 'metal', d: membro([meioG, [eD, yD]], inv ? [4.4, 4.4] : [6.2, 5.6]), cor: inv ? '#3a3633' : (trail ? '#3a3633' : ALU), marca: 'bengala' }
  );
  frente.push(trail && p.tipo === 'trail'
    // O para-lama alto, de motocross, preso embaixo do farol.
    ? { tipo: 'massa', d: suave([[150, 46], [172, 42], [196, 52], [172, 52]], true, 0.4), cor: p.faixa === '#ecebe6' ? '#ecebe6' : cor, marca: 'paralama-alto' }
    : { tipo: 'massa', d: `M${f(eD - rD * 0.9)} ${f(yD - rD * 0.5)}A${f(rD + 3)} ${f(rD + 3)} 0 0 1 ${f(eD + rD * 0.75)} ${f(yD - rD * 0.7)}l-1 2.6A${f(rD + 1)} ${f(rD + 1)} 0 0 0 ${f(eD - rD * 0.84)} ${f(yD - rD * 0.38)}Z`, cor: escurecer(cor, 0.1), semVolume: true, marca: 'paralama' });

  // A frente da trail: a carenagem do farol, o bico, o para-brisa.
  if (trail) {
    frente.push({ tipo: 'massa', d: suave([[148, 22], [166, 16], [176, 30], [172, 44], [156, 48]], true, 0.4), cor, marca: 'carenagem-do-farol' });
    if (p.bico) frente.push({ tipo: 'massa', d: suave([[158, 42], [178, 38], [194, 48], [174, 50]], true, 0.4), cor: p.faixa ?? cor, marca: 'bico' });
    if (p.parabrisa) frente.push({ tipo: 'vidro', d: suave(p.tipo === 'aventura' ? [[148, 22], [150, 2], [162, 2], [164, 18]] : [[150, 20], [154, 10], [162, 10], [164, 18]], true, 0.4), claro: true, marca: 'parabrisa' });
  }
  // O farol.
  const F: Pt = trail ? [170, 30] : esp ? [182, 46] : p.pequena ? [158, 50] : [166, 44];
  if (!esp) {
    if (p.farol === 'redondo') frente.push({ tipo: 'massa', d: circulo(F[0], F[1], 7.5), cor: '#3a3633', marca: 'farol-redondo' }, { tipo: 'luz', d: circulo(F[0] + 1, F[1], 5), cor: LUZ, marca: 'farol' });
    else if (p.farol === 'duplo') frente.push({ tipo: 'massa', d: cantos([[F[0] - 8, F[1] - 8, 3], [F[0] + 8, F[1] - 9, 3], [F[0] + 9, F[1] + 8, 3], [F[0] - 6, F[1] + 8, 3]]), cor: '#2f2d2b', marca: 'mascara-do-farol' }, { tipo: 'luz', d: ret(F[0] + 1, F[1] - 6, 6, 3, 1.4) + ret(F[0] + 2, F[1] + 2, 6, 3, 1.4), cor: LUZ, marca: 'farol-duplo' });
    else frente.push({ tipo: 'massa', d: cantos([[F[0] - 8, F[1] - 7, 2], [F[0] + 6, F[1] - 10, 2], [F[0] + 10, F[1] + 2, 2], [F[0] - 4, F[1] + 8, 2]]), cor: trail ? cor : '#2f2d2b', marca: 'carcaca-do-farol' }, { tipo: 'luz', d: cantos([[F[0] + 1, F[1] - 6, 1], [F[0] + 7, F[1] - 7.4, 1], [F[0] + 8.4, F[1] + 0.4, 1], [F[0] + 3, F[1] + 2, 1]]), cor: LUZ, marca: 'farol' });
  } else frente.push(p.farol === 'anguloso'
    ? { tipo: 'luz', d: cantos([[176, 44, 1], [188, 47, 1], [186, 52, 1], [175, 49, 1]]), cor: LUZ, marca: 'farol' }
    : { tipo: 'luz', d: cantos([[172, 44, 1], [188, 50, 1], [187, 52.4, 1], [171, 46.6, 1]]), cor: LUZ, marca: 'farol-rasgo' });

  // O guidão (o tubular largo da naked e da trail, os semiguidões da esportiva), os retrovisores.
  const [hx, hy] = H;
  frente.push(esp
    ? { tipo: 'linha', d: `M${hx + 2} ${hy + 4}L${hx - 14} ${hy + 7}`, larg: 2.4, cor: PRETO, marca: 'semiguidao' }
    : { tipo: 'linha', d: `M${hx} ${hy}l-3 -8l-16 -2`, larg: 2.6, cor: PRETO, marca: 'guidao' });
  if (!esp) frente.push({ tipo: 'linha', d: `M${hx - 10} ${hy - 8}l-3 -10`, larg: 1, cor: PRETO, fino: true, marca: 'retrovisor' }, { tipo: 'massa', d: cantos([[hx - 18, hy - 22, 2], [hx - 10, hy - 22, 2], [hx - 10, hy - 18, 2], [hx - 18, hy - 18, 2]]), cor: PRETO, so3: true });
  if (trail) frente.push({ tipo: 'massa', d: suave([[hx - 18, hy - 12], [hx - 8, hy - 14], [hx - 6, hy - 8], [hx - 16, hy - 6]], true, 0.4), cor: PRETO, semVolume: true, so3: true, marca: 'protetor-de-mao' });
  return [...atras, ...meio, ...frente];
}
