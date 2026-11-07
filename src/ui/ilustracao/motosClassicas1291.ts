/**
 * VIDA 12.9.1 — AS MOTOS CLÁSSICAS NO DESENHO: cada uma montada pelo que a separa das outras, não a mesma moto com
 * outra cor.
 *
 *   MOTOR      o bicilíndrico paralelo inglês (um bloco, aletas, o cabeçote em cima), o monocilíndrico alto do café racer,
 *              o quatro em linha japonês (o bloco largo e os coletores na frente), o V2 americano (dois cilindros em V, o
 *              cabeçote "nó dos dedos" ou "panela"), o L da Ducati (um cilindro deitado para a frente), o boxer da BMW (o
 *              cilindro que sai de lado, baixo), o V transversal da Guzzi, o dois tempos (sem tampa de válvula) com o
 *              radiador da GT750, o V4 escondido na carenagem da RC30.
 *   GUIDÃO     baixo (o "clip-on" do café racer), reto, alto com travessa (a scrambler), puxado para trás (a custom), largo
 *              (o "chifre de boi" das antigas).
 *   TANQUE     gota, longo e baixo (café), o tanque de sela entre os tubos (antes da guerra), pequeno (pista e terra), o
 *              grande arredondado com o painel em cima (a Harley).
 *   BANCO      duplo e reto, o de um lugar com a corcova (café), o selim de molas, a rabeta "rabo de pato" (Z1), a "boattail".
 *   ESCAPE     dois longos, quatro (dois de cada lado, um sobre o outro), quatro-em-um, altos com protetor (scrambler), as
 *              panelas de expansão do dois tempos, o "rabo de peixe" da Harley, o megafone.
 *   PARA-LAMA  curto, fundo (Harley), de saia (Indian Chief), nenhum na frente (pista de terra).
 *   GARFO      telescópico, de paralelogramo (Vincent, Brough), de molas (Knucklehead), Earles (BMW), de feixe (Scout).
 *
 * As rodas raiadas são a regra (a de liga, quando o modelo tinha). O acabamento, as rodas, o filete no tanque e o banco
 * de couro escolhidos na oficina entram depois, em `visualNaMoto` (o tanque fica onde o da forma "clássica" fica).
 */
import { cantos, circulo, clarear, escurecer, membro, num as f, ret, suave, type Peca } from './nucleo';

type Pt = [number, number];
const CHAO = 122;
const PRETO = '#2b2826', CROMO = '#d9d6d0', COURO = '#2f2a27', ALU = '#a9a59e', FERRO = '#57534e', LUZ = '#f2ead2';

export interface PerfilClassica {
  motor: 'paralelo' | 'mono' | 'quatro' | 'vtwin' | 'ltwin' | 'boxer' | 'guzzi' | 'doisTempos' | 'v4';
  guidao: 'baixo' | 'reto' | 'alto' | 'puxado' | 'largo';
  tanque: 'gota' | 'longo' | 'sela' | 'pequeno' | 'harley';
  banco: 'duplo' | 'cafe' | 'molas' | 'rabeta' | 'boattail' | 'fastback';
  escape: 'dois' | 'quatro' | 'quatroEmUm' | 'alto' | 'altoDuplo' | 'expansao' | 'peixe' | 'megafone' | 'boxer' | 'tres';
  paralama?: 'curto' | 'fundo' | 'saia' | 'pista';
  garfo?: 'tele' | 'paralelogramo' | 'molas' | 'earles' | 'feixe';
  carenagem?: 'meia' | 'guidao' | 'inteira';
  /** Quadro rígido (sem amortecedor atrás): as de antes da guerra. */
  rigido?: boolean;
  /** O cabeçote do V2: "nó dos dedos" (Knucklehead), "panela" (Panhead). */
  cabeca?: 'no' | 'panela';
  motorCor?: string;
  quadroCor?: string;
  /** Faixa ou segunda cor de fábrica no tanque. */
  faixa?: string;
  rodas?: 'raios' | 'liga';
  /** Rodas maiores (as antigas, aro 19–21) ou menores (a esportiva de aro 17). */
  r?: number;
  radiador?: boolean;
  placa?: boolean;
  cardan?: boolean;
  farolDuplo?: boolean;
  /** Rodas grossas e baixas da custom (o pneu "balão"). */
  balao?: boolean;
}

/** As 28 clássicas da 12.9.1 (`dados/motosClassicas1291`). */
export const MOTOS_CLASSICAS_1291: Record<string, PerfilClassica> = {
  triumph_t120_1969: { motor: 'paralelo', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', faixa: '#ecebe6' },
  bsa_gold_star_1960: { motor: 'mono', guidao: 'baixo', tanque: 'longo', banco: 'cafe', escape: 'megafone', motorCor: ALU, faixa: '#c9c5bd' },
  norton_commando_1970: { motor: 'paralelo', guidao: 'reto', tanque: 'longo', banco: 'fastback', escape: 'dois', motorCor: '#8c8882' },
  vincent_black_shadow_1950: { motor: 'vtwin', guidao: 'reto', tanque: 'longo', banco: 'duplo', escape: 'dois', garfo: 'paralelogramo', motorCor: '#2f2c29', rigido: true, r: 24.5 },
  brough_ss100_1930: { motor: 'vtwin', guidao: 'largo', tanque: 'sela', banco: 'molas', escape: 'dois', garfo: 'paralelogramo', rigido: true, motorCor: ALU, r: 24, paralama: 'fundo' },
  ducati_750ss_1974: { motor: 'ltwin', guidao: 'baixo', tanque: 'longo', banco: 'cafe', escape: 'megafone', carenagem: 'meia', quadroCor: '#7fae6a', motorCor: ALU, faixa: '#7fae6a' },
  guzzi_v7_sport_1972: { motor: 'guzzi', guidao: 'baixo', tanque: 'longo', banco: 'cafe', escape: 'dois', motorCor: ALU, cardan: true, faixa: '#1f1f22' },
  ducati_scrambler_450_1971: { motor: 'mono', guidao: 'alto', tanque: 'pequeno', banco: 'duplo', escape: 'megafone', motorCor: ALU, paralama: 'curto' },
  bmw_r60_2_1965: { motor: 'boxer', guidao: 'largo', tanque: 'gota', banco: 'molas', escape: 'boxer', garfo: 'earles', cardan: true, motorCor: ALU, faixa: '#f1eee7', paralama: 'fundo' },
  bmw_r90s_1974: { motor: 'boxer', guidao: 'reto', tanque: 'longo', banco: 'rabeta', escape: 'boxer', carenagem: 'guidao', cardan: true, motorCor: ALU, faixa: '#3b2a20' },
  honda_cb750_1970: { motor: 'quatro', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'quatro', motorCor: ALU, faixa: '#d4af37' },
  kawasaki_z1_1973: { motor: 'quatro', guidao: 'reto', tanque: 'gota', banco: 'rabeta', escape: 'quatro', motorCor: '#3a3633', faixa: '#e0712a' },
  kawasaki_h2_1972: { motor: 'doisTempos', guidao: 'reto', tanque: 'gota', banco: 'rabeta', escape: 'tres', motorCor: ALU, faixa: '#ecebe6' },
  suzuki_gt750_1974: { motor: 'doisTempos', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'quatro', radiador: true, motorCor: ALU, faixa: '#ecebe6' },
  yamaha_xs650_1972: { motor: 'paralelo', guidao: 'puxado', tanque: 'gota', banco: 'duplo', escape: 'dois', motorCor: ALU },
  yamaha_rd350_1974: { motor: 'doisTempos', guidao: 'reto', tanque: 'pequeno', banco: 'duplo', escape: 'expansao', motorCor: ALU, faixa: '#ecebe6', r: 22 },
  honda_cb400f_1975: { motor: 'quatro', guidao: 'baixo', tanque: 'longo', banco: 'duplo', escape: 'quatroEmUm', motorCor: ALU, r: 22 },
  honda_cl350_1970: { motor: 'paralelo', guidao: 'alto', tanque: 'pequeno', banco: 'duplo', escape: 'alto', motorCor: ALU, paralama: 'curto', faixa: '#ecebe6' },
  honda_rc30_1988: { motor: 'v4', guidao: 'baixo', tanque: 'longo', banco: 'cafe', escape: 'megafone', carenagem: 'inteira', farolDuplo: true, rodas: 'liga', r: 22, faixa: '#c8372d' },
  honda_cg125_1976: { motor: 'mono', guidao: 'reto', tanque: 'gota', banco: 'duplo', escape: 'dois', motorCor: '#8c8882', r: 21.5 },
  yamaha_rd350lc_1990: { motor: 'doisTempos', guidao: 'baixo', tanque: 'longo', banco: 'rabeta', escape: 'expansao', carenagem: 'guidao', rodas: 'liga', radiador: true, motorCor: '#3a3633', r: 22 },
  harley_knucklehead_1937: { motor: 'vtwin', cabeca: 'no', guidao: 'largo', tanque: 'harley', banco: 'molas', escape: 'peixe', garfo: 'molas', rigido: true, paralama: 'fundo', motorCor: ALU, balao: true, faixa: '#d4af37' },
  harley_panhead_1955: { motor: 'vtwin', cabeca: 'panela', guidao: 'largo', tanque: 'harley', banco: 'duplo', escape: 'peixe', paralama: 'fundo', motorCor: ALU, balao: true },
  harley_super_glide_1971: { motor: 'vtwin', cabeca: 'panela', guidao: 'puxado', tanque: 'harley', banco: 'boattail', escape: 'dois', motorCor: ALU },
  harley_xr750_1972: { motor: 'vtwin', guidao: 'alto', tanque: 'pequeno', banco: 'cafe', escape: 'altoDuplo', paralama: 'pista', placa: true, motorCor: '#3a3633', r: 24 },
  harley_xr1000_1983: { motor: 'vtwin', guidao: 'reto', tanque: 'pequeno', banco: 'duplo', escape: 'altoDuplo', rodas: 'liga', motorCor: '#3a3633' },
  indian_chief_1947: { motor: 'vtwin', guidao: 'largo', tanque: 'harley', banco: 'molas', escape: 'peixe', paralama: 'saia', motorCor: ALU, balao: true },
  indian_scout_101_1929: { motor: 'vtwin', guidao: 'largo', tanque: 'sela', banco: 'molas', escape: 'dois', garfo: 'feixe', rigido: true, motorCor: ALU, r: 22.5, paralama: 'fundo' }
};

/* ------------------------------------------------------------------ geometria */

/** Um retângulo girado (graus, horário a partir da vertical) em torno do centro → contorno com cantos. */
function retGirado(cx: number, cy: number, w: number, h: number, ang: number, r = 2): string {
  const a = (ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const p = (x: number, y: number): [number, number, number] => [cx + x * c - y * s, cy + x * s + y * c, r];
  return cantos([p(-w / 2, -h / 2), p(w / 2, -h / 2), p(w / 2, h / 2), p(-w / 2, h / 2)]);
}
/** As aletas de um cilindro girado: linhas atravessadas ao longo do eixo. */
function aletas(cx: number, cy: number, w: number, h: number, ang: number, n: number, sobra = 2): string {
  const a = (ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  let d = '';
  for (let k = 1; k <= n; k++) {
    const y = -h / 2 + (h * k) / (n + 1);
    const x0 = -w / 2 - sobra, x1 = w / 2 + sobra;
    d += `M${f(cx + x0 * c - y * s)} ${f(cy + x0 * s + y * c)}L${f(cx + x1 * c - y * s)} ${f(cy + x1 * s + y * c)}`;
  }
  return d;
}
/** Ponto a `dist` do centro, no ângulo (graus a partir da vertical, positivo para a frente). */
const raio = (c: Pt, ang: number, dist: number): Pt => [c[0] + Math.sin((ang * Math.PI) / 180) * dist, c[1] - Math.cos((ang * Math.PI) / 180) * dist];
/** Um arco (anel) em volta de um eixo: de a0 a a1 graus (0 = para a frente, 90 = em cima). */
function arco(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${f(cx + Math.cos((a * Math.PI) / 180) * r)} ${f(cy - Math.sin((a * Math.PI) / 180) * r)}`;
  const grande = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${p(r1, a0)}A${f(r1)} ${f(r1)} 0 ${grande} 0 ${p(r1, a1)}L${p(r0, a1)}A${f(r0)} ${f(r0)} 0 ${grande} 1 ${p(r0, a0)}Z`;
}

/* ------------------------------------------------------------------ o desenho */

export function motoClassica(cor: string, p: PerfilClassica): Peca[] {
  const r = p.r ?? 23;
  const eT = 60, eD = p.carenagem === 'inteira' ? 182 : 184;
  const yR = CHAO - r;
  const H: Pt = p.tanque === 'sela' ? [152, 44] : [156, 40];
  const mc = p.motorCor ?? ALU;
  const quadro = p.quadroCor ?? PRETO;
  const aro = p.rodas ?? 'raios';
  const atras: Peca[] = [], meio: Peca[] = [], frente: Peca[] = [];

  // As rodas (o pneu balão da custom é mais grosso: a roda menor dentro do mesmo pneu).
  const roda = (cx: number): Peca => ({ tipo: 'pneu', cx, cy: yR, r, aro, raios: aro === 'liga' ? 6 : undefined, marca: 'roda', ...(p.balao ? {} : { aroMaior: true }) });
  atras.push(roda(eT), roda(eD));

  // O quadro: a espinha do pescoço ao banco, o tubo de baixo que abraça o motor, o triângulo de trás.
  const tubo = (pts: Pt[], larg = 2.6): Peca => ({ tipo: 'linha', d: `M${pts.map(q => `${f(q[0])} ${f(q[1])}`).join('L')}`, larg, cor: quadro, marca: 'quadro' });
  atras.push(tubo([H, [100, 56], p.rigido ? [92, 58] : [64, 62]]), tubo([[H[0] - 2, H[1] + 6], [146, 100], [104, 104], [94, 60]]));
  if (p.rigido) atras.push(tubo([[94, 60], [eT, yR]]), tubo([[104, 104], [eT, yR]]));
  else {
    // A balança e os dois amortecedores cromados com a mola à mostra (o desenho das motos dos anos 1950 a 1970).
    atras.push({ tipo: 'metal', d: membro([[eT, yR], [104, 98]], [4.5, 5.5]), cor: quadro, marca: 'balanca' });
    const a: Pt = [eT + 6, yR - 4], b: Pt = [80, 58];
    atras.push({ tipo: 'metal', d: membro([a, b], [3.2, 3.2]), cor: CROMO, marca: 'amortecedor' });
    const n = 6, mola = Array.from({ length: n }, (_, k) => { const t = (k + 0.5) / n; const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; return `M${f(x - 3)} ${f(y - 1)}l6 2`; }).join('');
    atras.push({ tipo: 'linha', d: mola, larg: 1, cor: escurecer(CROMO, 0.45), fino: true, marca: 'mola' });
  }
  if (p.cardan) atras.push({ tipo: 'metal', d: membro([[104, 96], [eT + 2, yR - 1]], [6, 5]), cor: FERRO, marca: 'cardan' }, { tipo: 'metal', d: circulo(eT, yR, 7), cor: FERRO });
  else atras.push({ tipo: 'linha', d: `M${eT} ${yR - 5}L118 ${f(yR - 9)}M${eT} ${yR + 5}L118 ${f(yR - 1)}`, larg: 1.2, cor: '#4a4743', fino: true, marca: 'corrente' });

  // Os para-lamas (o de trás acompanha a roda; o da frente pelo tipo).
  const pl = p.paralama;
  if (p.banco !== 'boattail' && pl !== 'pista') atras.push({ tipo: 'massa', d: arco(eT, yR, r + 1.5, r + (pl === 'saia' ? 8 : 5), pl === 'saia' ? 20 : pl === 'fundo' ? 40 : 60, pl === 'saia' ? 185 : pl === 'fundo' ? 170 : 150), cor, semVolume: true, marca: 'paralama-traseiro' });
  if (pl === 'saia') atras.push({ tipo: 'massa', d: arco(eT, yR, r - 3, r + 8, 150, 185), cor: escurecer(cor, 0.12), semVolume: true, marca: 'saia' });

  // O motor.
  meio.push(...motor(p, mc));
  // Os escapamentos (por cima do motor, por baixo do tanque).
  meio.push(...escape(p));

  // O tanque.
  const tq: Pt[] = p.tanque === 'longo' ? [[98, 52], [108, 40], [150, 37], [158, 46], [146, 56], [100, 58]]
    : p.tanque === 'sela' ? [[98, 50], [104, 42], [150, 42], [154, 48], [150, 56], [100, 58]]
    : p.tanque === 'pequeno' ? [[110, 50], [120, 40], [146, 39], [152, 47], [138, 54], [112, 55]]
    : p.tanque === 'harley' ? [[100, 54], [110, 38], [148, 37], [160, 48], [144, 60], [104, 62]]
    : [[104, 54], [116, 40], [148, 39], [156, 50], [138, 60], [106, 61]];
  frente.push({ tipo: 'massa', d: suave(tq, true, 0.5), cor, marca: 'tanque' });
  const [tx0, tx1] = [Math.min(...tq.map(q => q[0])), Math.max(...tq.map(q => q[0]))];
  const tyTopo = Math.min(...tq.map(q => q[1]));
  if (p.faixa) frente.push({ tipo: 'massa', d: suave([[tx0 + 8, tyTopo + 12], [(tx0 + tx1) / 2, tyTopo + 7], [tx1 - 8, tyTopo + 6], [tx1 - 10, tyTopo + 10], [(tx0 + tx1) / 2, tyTopo + 12], [tx0 + 10, tyTopo + 16]], true, 0.4), cor: p.faixa, semVolume: true, marca: 'faixa-do-tanque' });
  if (p.tanque !== 'sela' && p.tanque !== 'harley') frente.push({ tipo: 'massa', d: cantos([[tx0 + 6, tyTopo + 14, 2], [tx0 + 18, tyTopo + 13, 2], [tx0 + 18, tyTopo + 19, 2], [tx0 + 6, tyTopo + 20, 2]]), cor: '#3a3633', semVolume: true, marca: 'joelheira' });
  if (p.tanque === 'harley') frente.push({ tipo: 'metal', d: ret(116, tyTopo - 2, 26, 3.4, 1.4), cor: CROMO, marca: 'painel-no-tanque' });
  if (p.tanque === 'sela') frente.push({ tipo: 'linha', d: `M${tx0 + 2} 50H${tx1 - 2}`, larg: 1.6, cor: escurecer(cor, 0.35), marca: 'tanque-entre-tubos' });
  // O banco.
  frente.push(...bancoDaMoto(p, cor, COURO));
  // A tampa lateral (debaixo do banco) nas japonesas e inglesas dos anos 1960–70.
  if (!p.rigido && p.banco !== 'boattail' && p.carenagem !== 'inteira' && p.motor !== 'vtwin' && p.escape !== 'alto') frente.push({ tipo: 'massa', d: cantos([[90, 61, 3], [106, 61, 3], [103, 74, 3], [92, 72, 3]]), cor: p.motor === 'boxer' ? PRETO : cor, marca: 'tampa-lateral' });

  // O garfo, o farol, o guidão, o para-lama da frente.
  frente.push(...frenteDaMoto(p, cor, H, eD, yR, r));
  // A lanterna.
  if (p.banco !== 'boattail') frente.push({ tipo: 'luz', d: ret(p.banco === 'cafe' || p.banco === 'rabeta' || p.banco === 'fastback' ? 42 : 38, p.banco === 'cafe' || p.banco === 'rabeta' ? 48 : 58, 5, 4, 1), cor: '#c8372d' });

  return [...atras, ...meio, ...frente];
}

function motor(p: PerfilClassica, mc: string): Peca[] {
  const esc = escurecer(mc, 0.25), linha = escurecer(mc, 0.45);
  const carter = (pts: Pt[]): Peca => ({ tipo: 'massa', d: suave(pts, true, 0.45), cor: esc, marca: 'carter' });
  const cil = (cx: number, cy: number, w: number, h: number, ang: number, n: number, marca = 'cilindro'): Peca[] => [
    { tipo: 'massa', d: retGirado(cx, cy, w, h, ang, 2.5), cor: mc, marca },
    { tipo: 'linha', d: aletas(cx, cy, w, h, ang, n), larg: 0.9, cor: linha, fino: true }
  ];
  switch (p.motor) {
    case 'paralelo': return [
      carter([[102, 88], [126, 84], [150, 88], [152, 100], [130, 106], [104, 102]]),
      ...cil(128, 72, 24, 22, 12, 5),
      { tipo: 'massa', d: retGirado(131, 58, 28, 8, 12, 2), cor: mc, marca: 'cabecote' },
      { tipo: 'massa', d: retGirado(132, 52, 18, 5, 12, 1.5), cor: esc, marca: 'tampa-de-valvula' },
      { tipo: 'massa', d: circulo(112, 92, 7), cor: mc, marca: 'tampa-da-embreagem' }
    ];
    case 'mono': return [
      carter([[104, 90], [124, 86], [146, 90], [146, 102], [126, 106], [106, 102]]),
      ...cil(128, 70, 20, 26, 8, 7),
      { tipo: 'massa', d: retGirado(130, 54, 22, 8, 8, 2), cor: mc, marca: 'cabecote' },
      { tipo: 'massa', d: circulo(114, 96, 6), cor: mc, marca: 'tampa-da-embreagem' }
    ];
    case 'quatro': return [
      carter([[100, 88], [128, 84], [154, 88], [154, 102], [130, 108], [102, 104]]),
      ...cil(128, 74, 36, 20, 10, 4),
      { tipo: 'massa', d: retGirado(131, 60, 38, 8, 10, 2), cor: mc, marca: 'cabecote' },
      { tipo: 'massa', d: retGirado(130, 54, 34, 5, 10, 2), cor: esc, marca: 'tampa-do-comando' },
      { tipo: 'massa', d: circulo(110, 94, 7.5), cor: mc, marca: 'tampa-da-embreagem' }
    ];
    case 'doisTempos': return [
      carter([[102, 88], [128, 84], [152, 88], [152, 100], [130, 106], [104, 102]]),
      ...cil(128, 70, p.radiador ? 30 : 24, 24, 14, 6),
      // O dois tempos não tem tampa de válvula: o cabeçote é só aleta.
      { tipo: 'massa', d: retGirado(132, 56, p.radiador ? 30 : 26, 6, 14, 2), cor: mc, marca: 'cabecote-dois-tempos' },
      ...(p.radiador ? [
        { tipo: 'massa' as const, d: ret(148, 50, 11, 34, 2), cor: '#3a3633', marca: 'radiador' },
        { tipo: 'linha' as const, d: 'M150 55h7M150 60h7M150 65h7M150 70h7M150 75h7M150 80h7', larg: 0.6, cor: '#77736c', fino: true }
      ] : [])
    ];
    case 'vtwin': {
      // Dois cilindros em V a partir do virabrequim; o cabeçote em cima de cada um.
      const C: Pt = [124, 94];
      const pecas: Peca[] = [carter([[104, 90], [126, 84], [146, 90], [146, 104], [124, 108], [104, 104]])];
      for (const ang of [-24, 26]) {
        const m = raio(C, ang, 22);
        pecas.push(...cil(m[0], m[1], 15, 22, ang, 5));
        const t = raio(C, ang, 35);
        if (p.cabeca === 'no') pecas.push({ tipo: 'massa', d: circulo(t[0], t[1], 6.5), cor: CROMO, marca: 'cabecote-no-dos-dedos' }, { tipo: 'massa', d: circulo(t[0] + 2, t[1] + 1, 3), cor: escurecer(CROMO, 0.2), semVolume: true });
        else if (p.cabeca === 'panela') pecas.push({ tipo: 'massa', d: retGirado(t[0], t[1], 20, 7, ang, 3.5), cor: CROMO, marca: 'cabecote-panela' });
        else pecas.push({ tipo: 'massa', d: retGirado(t[0], t[1], 17, 7, ang, 2), cor: mc, marca: 'cabecote' });
      }
      // As varetas cromadas entre o cárter e os cabeçotes.
      pecas.push({ tipo: 'linha', d: `M${C[0] - 2} ${C[1] - 6}L${f(raio(C, 2, 30)[0])} ${f(raio(C, 2, 30)[1])}`, larg: 1.4, cor: CROMO, marca: 'varetas' });
      return pecas;
    }
    case 'ltwin': {
      // O L da Ducati: o cilindro da frente quase deitado, o de trás em pé.
      const C: Pt = [120, 96];
      const pecas: Peca[] = [carter([[100, 92], [122, 86], [144, 92], [144, 104], [122, 108], [100, 104]])];
      for (const ang of [-8, 74]) {
        const m = raio(C, ang, 20);
        pecas.push(...cil(m[0], m[1], 15, 20, ang, 5));
        const t = raio(C, ang, 32);
        pecas.push({ tipo: 'massa', d: retGirado(t[0], t[1], 17, 7, ang, 2), cor: mc, marca: 'cabecote' });
      }
      pecas.push({ tipo: 'linha', d: `M${C[0] + 4} ${C[1] - 2}L${f(raio(C, 40, 30)[0])} ${f(raio(C, 40, 30)[1])}`, larg: 2.2, cor: escurecer(mc, 0.1), marca: 'eixo-do-comando' });
      return pecas;
    }
    case 'boxer': return [
      // O bloco alto e redondo ("pão de forma"), e o cilindro que sai de lado, baixo, na frente: visto de lado, a ponta dele.
      { tipo: 'massa', d: suave([[106, 66], [132, 62], [142, 72], [142, 100], [126, 106], [106, 100]], true, 0.5), cor: mc, marca: 'bloco-boxer' },
      { tipo: 'massa', d: cantos([[136, 76, 5], [156, 74, 5], [158, 96, 5], [138, 98, 5]]), cor: mc, marca: 'cilindro-de-lado' },
      { tipo: 'linha', d: 'M138 80h18M138 84h19M138 88h19M138 92h19', larg: 0.9, cor: linha, fino: true },
      { tipo: 'massa', d: cantos([[152, 75, 4], [160, 76, 4], [160, 95, 4], [152, 96, 4]]), cor: esc, marca: 'tampa-do-cabecote' },
      { tipo: 'massa', d: circulo(118, 74, 6), cor: '#3a3633', marca: 'filtro' }
    ];
    case 'guzzi': return [
      // O V transversal: o bloco largo embaixo e o cilindro da direita saindo para o lado e para cima, à frente.
      carter([[100, 86], [128, 80], [148, 86], [148, 102], [126, 108], [102, 104]]),
      ...cil(140, 72, 16, 22, 50, 5, 'cilindro-transversal'),
      { tipo: 'massa', d: retGirado(150, 64, 18, 8, 50, 2.5), cor: mc, marca: 'cabecote' }
    ];
    case 'v4': return [carter([[104, 92], [130, 88], [150, 94], [146, 106], [108, 106]])];
  }
}

function escape(p: PerfilClassica): Peca[] {
  const cano = (eixo: Pt[], larg: number[], marca = 'escapamento', cor = CROMO): Peca => ({ tipo: 'metal', d: membro(eixo, larg), cor, marca });
  switch (p.escape) {
    case 'dois': {
      // O coletor desce da frente do cabeçote, corre baixo e termina no silenciador comprido (o "pea-shooter").
      const saida: Pt = p.motor === 'vtwin' ? [134, 78] : p.motor === 'guzzi' ? [154, 70] : p.motor === 'mono' ? [140, 62] : [142, 64];
      return [cano([saida, [150, 90], [134, 106], [96, 108]], [4, 4.5, 4.5, 4.5], 'coletor'), cano([[100, 108], [70, 106], [34, 100]], [6, 6.5, 6.5], 'silenciador')];
    }
    case 'megafone': {
      const saida: Pt = p.motor === 'ltwin' ? [150, 92] : p.motor === 'v4' ? [146, 100] : [140, 62];
      return [cano([saida, [148, 94], [128, 106], [96, 104]], [4, 4.5, 4.5, 5]), cano([[98, 104], [70, 98], [42, 90]], [5, 8, 11], 'megafone')];
    }
    case 'quatro': return [
      // Quatro coletores na frente do motor; dois silenciadores de cada lado, um sobre o outro (CB750, Z1, GT750).
      ...[0, 5, 10, 15].map(k => cano([[136 + k * 0.6, 62 + k * 0.2], [150 - k * 0.3, 84], [146 - k * 0.6, 98 + k * 0.3]], [3, 3, 3], 'coletor')),
      cano([[140, 100], [110, 108], [36, 104]], [5, 6, 6.5], 'silenciador-baixo'),
      cano([[140, 96], [110, 100], [38, 94]], [5, 6, 6.5], 'silenciador-alto')
    ];
    case 'tres': return [
      // A H2: três coletores, dois silenciadores deste lado, subindo para trás.
      ...[0, 7, 14].map(k => cano([[138 + k * 0.6, 64], [152 - k * 0.3, 86], [146 - k * 0.6, 98]], [3.4, 3.4, 3.4], 'coletor')),
      cano([[140, 100], [100, 106], [36, 96]], [5, 6, 7], 'silenciador-baixo'),
      cano([[140, 94], [100, 98], [40, 86]], [5, 6, 7], 'silenciador-alto')
    ];
    case 'quatroEmUm': return [
      // Os quatro coletores curvos na frente do motor, juntando-se num só debaixo dele (CB400 Four).
      ...[0, 4, 8, 12].map(k => cano([[136 + k, 64], [150 + k * 0.4, 80], [148, 98 - k * 0.2], [128, 106]], [2.6, 2.6, 2.6, 3], 'coletor')),
      cano([[130, 106], [92, 106], [44, 96]], [6, 6.5, 7.5], 'silenciador')
    ];
    case 'alto': return [
      // A scrambler: os escapamentos sobem do motor e correm por cima, debaixo do banco, com a grade que protege a perna.
      cano([[142, 64], [146, 74], [124, 64], [70, 56]], [4, 4, 4.5, 5], 'escapamento-alto'),
      cano([[140, 68], [144, 80], [122, 70], [72, 62]], [4, 4, 4.5, 5], 'escapamento-alto'),
      { tipo: 'massa', d: cantos([[84, 52, 2], [114, 56, 2], [114, 66, 2], [84, 62, 2]]), cor: '#9a9690', marca: 'protetor-de-calor' },
      { tipo: 'linha', d: 'M89 56v5M95 57v5M101 58v5M107 59v5', larg: 1.4, cor: '#5d5a56', fino: true }
    ];
    case 'altoDuplo': return [
      // A XR: os dois escapamentos do mesmo lado, altos, os megafones apontando para cima atrás.
      cano([[138, 76], [126, 70], [100, 66], [58, 54]], [4, 4.5, 5, 8], 'escapamento-alto'),
      cano([[128, 84], [114, 78], [94, 76], [56, 66]], [4, 4.5, 5, 8], 'escapamento-alto')
    ];
    case 'expansao': return [
      // O dois tempos: a panela de expansão (o bojo) debaixo do motor e a ponteira fina.
      cano([[146, 68], [152, 84], [140, 104], [116, 110], [96, 108]], [4, 6, 11, 11, 5], 'panela-de-expansao'),
      cano([[98, 108], [70, 104], [44, 98]], [4, 5.5, 6], 'ponteira')
    ];
    case 'peixe': return [
      // O cano da Harley/Indian: baixo, comprido, a ponta em "rabo de peixe".
      cano([[146, 78], [150, 96], [134, 108], [70, 110], [36, 106]], [4.5, 5, 5.5, 6, 6], 'escapamento'),
      { tipo: 'metal', d: 'M38 102l-10 -4l2 14l10 -4z', cor: CROMO, marca: 'rabo-de-peixe' }
    ];
    case 'boxer': return [
      // A BMW: um coletor de cada lado sai do cilindro e vai reto, baixo, até o silenciador gordo.
      cano([[156, 92], [152, 106], [130, 110], [92, 108]], [4.5, 4.5, 4.5, 4.5], 'coletor'),
      cano([[96, 108], [66, 104], [38, 98]], [8, 8.5, 8], 'silenciador')
    ];
  }
}

function bancoDaMoto(p: PerfilClassica, cor: string, banco: string): Peca[] {
  switch (p.banco) {
    case 'cafe': return [
      { tipo: 'massa', d: suave([[80, 52], [108, 54], [106, 60], [82, 60]], true, 0.35), cor: banco, marca: 'banco' },
      // A corcova de fibra atrás do piloto (o que é o café racer).
      { tipo: 'massa', d: suave([[46, 52], [54, 44], [70, 44], [80, 54], [76, 60], [50, 58]], true, 0.45), cor, marca: 'corcova' }
    ];
    case 'molas': return [
      // O selim de um lugar em cima de duas molas (o banco das antigas).
      { tipo: 'massa', d: suave([[78, 46], [96, 44], [106, 50], [90, 54], [76, 52]], true, 0.4), cor: banco, marca: 'selim' },
      { tipo: 'linha', d: 'M80 53l-2 3l4 2l-4 2l4 2M88 54l-2 3l4 2l-4 2l4 2', larg: 1.1, cor: CROMO, marca: 'molas-do-selim' },
      ...(p.rigido ? [] : [{ tipo: 'massa' as const, d: ret(56, 57, 20, 5, 2.5), cor: banco, marca: 'garupa' }])
    ];
    case 'rabeta': return [
      { tipo: 'massa', d: suave([[62, 52], [86, 50], [110, 52], [110, 60], [64, 60]], true, 0.35), cor: banco, marca: 'banco' },
      // A rabeta em "rabo de pato" (Z1, H2, R 90 S): a ponta virada para cima.
      { tipo: 'massa', d: suave([[38, 46], [48, 44], [66, 52], [66, 62], [44, 60]], true, 0.4), cor, marca: 'rabo-de-pato' }
    ];
    case 'fastback': return [
      { tipo: 'massa', d: suave([[62, 52], [110, 52], [110, 60], [62, 60]], true, 0.3), cor: banco, marca: 'banco' },
      { tipo: 'massa', d: suave([[42, 52], [52, 46], [70, 50], [70, 62], [44, 60]], true, 0.4), cor, marca: 'rabeta-fastback' }
    ];
    case 'boattail': return [
      { tipo: 'massa', d: suave([[72, 50], [110, 52], [110, 60], [74, 58]], true, 0.35), cor: banco, marca: 'banco' },
      // A rabeta "boattail": a fibra que cobre a roda de trás até embaixo, como popa de barco.
      { tipo: 'massa', d: suave([[34, 72], [36, 56], [52, 48], [76, 52], [76, 64], [56, 70]], true, 0.45), cor, marca: 'boattail' },
      { tipo: 'luz', d: ret(34, 62, 4, 6, 1), cor: '#c8372d' }
    ];
    default: return [
      // Duplo e reto, com o friso e a alça da garupa.
      { tipo: 'massa', d: suave([[54, 52], [82, 50], [110, 52], [110, 60], [56, 60]], true, 0.35), cor: banco, marca: 'banco' },
      { tipo: 'linha', d: 'M56 57H108', larg: 0.7, cor: clarear(banco, 0.35), fino: true },
      { tipo: 'linha', d: 'M58 50l-6 -2h-4', larg: 1.6, cor: CROMO, marca: 'alca' }
    ];
  }
}

function frenteDaMoto(p: PerfilClassica, cor: string, H: Pt, eD: number, yR: number, r: number): Peca[] {
  const out: Peca[] = [];
  const g = p.garfo ?? 'tele';
  const eixo: Pt = [eD, yR];
  if (g === 'tele') out.push(
    { tipo: 'metal', d: membro([H, [eD - 8, yR - 22]], [4.4, 4.4]), cor: CROMO, marca: 'garfo' },
    { tipo: 'metal', d: membro([[eD - 9, yR - 24], eixo], [6, 5.4]), cor: ALU, marca: 'bengala' }
  );
  else if (g === 'paralelogramo' || g === 'feixe') out.push(
    // As duas lâminas pretas paralelas e o amortecedor entre elas (Vincent, Brough); a Scout, com o feixe de molas.
    { tipo: 'metal', d: membro([H, [eD - 2, yR - 2]], [5, 4]), cor: PRETO, marca: 'garfo-paralelogramo' },
    { tipo: 'metal', d: membro([[H[0] + 6, H[1] + 2], [eD + 4, yR - 6]], [3, 3]), cor: PRETO },
    g === 'feixe' ? { tipo: 'linha', d: `M${H[0] + 2} ${H[1] + 2}q8 -2 14 6`, larg: 2.2, cor: FERRO, marca: 'feixe-de-molas' } : { tipo: 'metal', d: membro([[H[0] + 4, H[1] + 6], [H[0] + 12, H[1] + 22]], [4, 4]), cor: CROMO, marca: 'amortecedor-do-garfo' }
  );
  else if (g === 'molas') out.push(
    // O garfo de molas da Knucklehead: a perna de trás e as molas compridas na frente.
    { tipo: 'metal', d: membro([H, eixo], [4, 3.6]), cor: CROMO, marca: 'garfo-de-molas' },
    { tipo: 'linha', d: Array.from({ length: 8 }, (_, k) => { const t = k / 8; const x = H[0] + 6 + (eD + 4 - H[0] - 6) * t * 0.6, y = H[1] + 2 + (yR - H[1]) * t * 0.6; return `M${f(x - 2)} ${f(y)}l5 1.5`; }).join(''), larg: 1.4, cor: CROMO, marca: 'molas' }
  );
  else if (g === 'earles') out.push(
    // O garfo Earles da BMW: as pernas descem até atrás da roda e o braço oscilante vai até o eixo.
    { tipo: 'metal', d: membro([H, [eD - 10, yR + 4]], [5, 5]), cor: PRETO, marca: 'garfo-earles' },
    { tipo: 'metal', d: membro([[eD - 12, yR + 4], eixo], [4.5, 4]), cor: PRETO, marca: 'braco-earles' },
    { tipo: 'metal', d: membro([[eD - 6, yR - 30], [eD - 2, yR - 6]], [3, 3]), cor: CROMO }
  );
  // O para-lama da frente.
  const pl = p.paralama;
  if (pl === 'saia') out.push({ tipo: 'massa', d: arco(eD, yR, r + 1.5, r + 8, -15, 165), cor, semVolume: true, marca: 'paralama-de-saia' }, { tipo: 'massa', d: circulo(eD + r - 4, yR - r - 2, 3), cor: '#e9c46a', marca: 'cabeca-de-indio' });
  else if (pl === 'fundo') out.push({ tipo: 'massa', d: arco(eD, yR, r + 1.5, r + 5, 5, 160), cor, semVolume: true, marca: 'paralama-fundo' });
  else if (pl !== 'pista') out.push({ tipo: 'massa', d: arco(eD, yR, r + 1.5, r + 4, pl === 'curto' ? 40 : 30, pl === 'curto' ? 130 : 140), cor: pl === 'curto' ? CROMO : cor, semVolume: true, marca: 'paralama' });

  // A carenagem.
  if (p.carenagem === 'meia') out.push(
    { tipo: 'massa', d: suave([[154, 30], [170, 26], [184, 36], [186, 50], [176, 60], [162, 58]], true, 0.4), cor, marca: 'meia-carenagem' },
    { tipo: 'vidro', d: suave([[154, 30], [160, 18], [170, 18], [170, 26]], true, 0.4), claro: true, marca: 'parabrisa' },
    { tipo: 'luz', d: circulo(178, 42, 5.5), cor: LUZ, marca: 'farol' }
  );
  else if (p.carenagem === 'inteira') out.push(
    { tipo: 'massa', d: suave([[148, 32], [166, 26], [186, 40], [191, 54], [182, 70], [168, 92], [150, 104], [114, 104], [110, 92], [120, 82], [140, 74], [146, 52]], true, 0.22), cor, marca: 'carenagem-inteira' },
    { tipo: 'massa', d: suave([[150, 56], [174, 52], [168, 76], [146, 80]], true, 0.3), cor: '#f1eee7', semVolume: true, marca: 'placa-de-numero-lateral' },
    { tipo: 'linha', d: 'M118 96L160 92', larg: 1.2, cor: escurecer(cor, 0.3), fino: true, marca: 'vinco' },
    { tipo: 'vidro', d: suave([[150, 32], [158, 18], [172, 20], [166, 28]], true, 0.4), claro: true, marca: 'parabrisa' },
    ...(p.farolDuplo ? [{ tipo: 'luz' as const, d: circulo(176, 38, 4) + circulo(184, 44, 4), cor: LUZ, marca: 'farol-duplo' }] : [])
  );
  else if (p.carenagem === 'guidao') out.push(
    { tipo: 'massa', d: suave([[156, 30], [172, 26], [180, 40], [174, 54], [160, 52]], true, 0.4), cor, marca: 'carenagem-de-guidao' },
    { tipo: 'vidro', d: suave([[156, 30], [162, 18], [172, 18], [172, 26]], true, 0.4), claro: true, marca: 'parabrisa' },
    { tipo: 'luz', d: circulo(172, 40, 5.5), cor: LUZ, marca: 'farol' }
  );
  else if (p.placa) out.push(
    // A pista de terra: sem farol, a placa de número oval na frente (e a do lado, debaixo do banco).
    { tipo: 'massa', d: suave([[162, 30], [174, 28], [177, 42], [165, 44]], true, 0.5), cor: '#f1eee7', marca: 'placa-de-numero' },
    { tipo: 'texto', x: 169.5, y: 40, texto: '1', tam: 9, cor: '#1f1f22' },
    { tipo: 'massa', d: suave([[70, 62], [90, 62], [90, 74], [72, 76]], true, 0.5), cor: '#f1eee7', marca: 'placa-lateral' }
  );
  else {
    // O farol redondo cromado (o das antigas, menor e mais baixo).
    const fx = H[0] + 12, fy = H[1] + (p.rigido ? 8 : 6), fr = p.rigido ? 6.5 : 8;
    out.push({ tipo: 'massa', d: circulo(fx, fy, fr), cor: CROMO, marca: 'farol' }, { tipo: 'luz', d: circulo(fx + 1.5, fy, fr - 2.8), cor: LUZ });
  }
  // O guidão.
  const [hx, hy] = H;
  const d = p.guidao === 'baixo' ? `M${hx + 2} ${hy + 4}L${hx - 16} ${hy + 6}`
    : p.guidao === 'alto' ? `M${hx} ${hy}l-4 -14l-14 -2M${hx - 3} ${hy - 9}h-8`
    : p.guidao === 'puxado' ? `M${hx} ${hy}l2 -12c-2 -6 -16 -6 -24 -2`
    : p.guidao === 'largo' ? `M${hx} ${hy}l-1 -8c-4 -4 -16 -4 -24 2`
    : `M${hx} ${hy}l-3 -8l-15 -2`;
  out.push({ tipo: 'linha', d, larg: 2.4, cor: p.guidao === 'baixo' ? PRETO : CROMO, marca: `guidao-${p.guidao}` });
  if (p.guidao !== 'baixo' && !p.carenagem) out.push({ tipo: 'linha', d: `M${hx - 10} ${hy - 6}l-4 -10`, larg: 1, cor: CROMO, fino: true, so3: true, marca: 'retrovisor' }, { tipo: 'massa', d: circulo(hx - 14, hy - 17, 2.6), cor: CROMO, so3: true });
  return out;
}
