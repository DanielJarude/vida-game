/**
 * REWORK 8 (Fase B) — motos e bicicletas: cada forma com a SUA construção (não o mesmo quadro com outra cor).
 *
 *   motoneta  rodas grandes e finas, o escudo de pernas, o quadro baixo de passar a perna, o bagageiro
 *   scooter   rodas pequenas, a carroceria que cobre o motor, o assoalho plano, o para-brisa
 *   de rua    "naked": tanque, banco, motor à mostra, farol redondo ou anguloso
 *   esportiva carenagem inteira, para-brisa, a rabeta alta, o piloto deitado (a posição do banco)
 *   clássica  tanque redondo, farol cromado, banco reto, o escapamento comprido
 *   trilha    suspensão alta, o para-lama "bico", pneus de cravo, banco longo e o escape alto
 *   bicicletas: a urbana de quadro baixo com cesta; a de estrada com guidão curvo e pneu fino; a mountain bike com
 *   suspensão e pneu de cravo; a elétrica com a bateria no quadro e o motor no cubo.
 *
 * O modelo muda o que muda de verdade entre eles (o farol, as rodas, a carenagem, o tamanho do tanque).
 */
import { cantos, circulo, escurecer, membro, ret, suave, type Amostra, type Peca } from './nucleo';

const CHAO = 122;
const PRETO = '#2b2826', PRATA = '#b8b4ad', CROMO = '#d9d6d0', BORRACHA = '#3a3633', COURO = '#2f2a27';

export interface PerfilMoto { farol?: 'redondo' | 'anguloso'; aro?: 'liga' | 'raios' | 'cravos'; carenagem?: boolean; grande?: boolean; parabrisa?: boolean; bau?: boolean;
  /** A moto de trabalho com o bagageiro atrás (a CG da entrega); a naked com o escapamento curto sob o motor (a MT-03). */
  bagageiro?: boolean; escapeCurto?: boolean }
export const MODELOS_MOTO: Record<string, PerfilMoto> = {
  honda_pop: { aro: 'raios' }, honda_biz: { aro: 'liga', bau: true },
  honda_pcx: {},
  haojue_dk150: { farol: 'redondo', aro: 'raios' }, yamaha_factor: { farol: 'redondo', aro: 'liga' }, honda_cg160: { farol: 'redondo', aro: 'liga', bagageiro: true },
  yamaha_fazer: { farol: 'anguloso', carenagem: true }, honda_cb300f: { farol: 'anguloso', grande: true }, yamaha_mt03: { farol: 'anguloso', grande: true, escapeCurto: true },
  kawasaki_ninja400: {}, royal_enfield_hunter: { aro: 'liga' },
  honda_bros: {}, honda_sahara: { parabrisa: true, grande: true }
};

const roda = (cx: number, r: number, aro: 'liga' | 'raios' | 'cravos' = 'liga'): Peca => ({ tipo: 'pneu', cx, cy: CHAO - r, r, aro, raios: aro === 'liga' ? 6 : undefined, marca: 'roda' });

function motoneta(cor: string, m: PerfilMoto): Peca[] {
  const eT = 62, eD = 178, r = 22;
  return [
    roda(eT, r, m.aro ?? 'raios'), roda(eD, r, m.aro ?? 'raios'),
    { tipo: 'metal', d: membro([[eT, CHAO - r], [100, 92]], [5, 6]), cor: PRETO },
    { tipo: 'metal', d: membro([[158, 42], [eD, CHAO - r]], [4.5, 4]), cor: PRATA, marca: 'garfo' },
    // O motor pequeno embaixo, o escapamento.
    { tipo: 'massa', d: suave([[92, 84], [118, 80], [122, 98], [96, 102]], true, 0.4), cor: '#6f6b65' },
    { tipo: 'metal', d: membro([[104, 100], [70, 104], [46, 98]], [5, 5, 4]), cor: '#8d8983' },
    // O quadro baixo (de passar a perna) e o escudo de pernas na frente — o que é a motoneta.
    { tipo: 'massa', d: suave([[64, 66], [100, 64], [112, 78], [132, 90], [150, 88], [156, 56], [168, 44], [172, 50], [166, 70], [160, 98], [128, 104], [104, 92], [90, 80], [66, 80]], true, 0.35), cor, marca: 'escudo' },
    { tipo: 'massa', d: suave([[58, 56], [72, 52], [104, 54], [108, 62], [86, 66], [60, 66]], true, 0.35), cor: COURO, marca: 'banco' },
    ...(m.bau ? [{ tipo: 'massa' as const, d: ret(36, 46, 22, 14, 3), cor: PRETO, marca: 'bau' }] : [{ tipo: 'metal' as const, d: ret(38, 54, 22, 3.4, 1), cor: PRETO, marca: 'bagageiro' }]),
    { tipo: 'massa', d: `M${eD - r - 2} ${CHAO - r}A${r + 3} ${r + 3} 0 0 1 ${eD + r * 0.6} ${CHAO - r - r * 0.85}l1.6 2.6A${r + 1} ${r + 1} 0 0 0 ${eD - r + 1} ${CHAO - r}Z`, cor, semVolume: true, marca: 'paralama' },
    { tipo: 'massa', d: suave([[154, 30], [176, 28], [180, 38], [158, 42]], true, 0.45), cor, marca: 'farol-carenado' },
    { tipo: 'luz', d: ret(170, 31, 9, 5, 2), cor: '#f2ead2', marca: 'farol' },
    { tipo: 'linha', d: 'M152 30l10-6h12', larg: 2 },
    { tipo: 'luz', d: ret(56, 60, 5, 4, 1), cor: '#c8372d' }
  ];
}

function scooter(cor: string): Peca[] {
  const eT = 70, eD = 176, r = 17;
  return [
    roda(eT, r), roda(eD, r),
    { tipo: 'metal', d: membro([[166, 46], [eD, CHAO - r]], [5, 4.5]), cor: PRATA, marca: 'garfo' },
    // A carroceria que esconde o motor (a traseira larga), o assoalho plano, o avental da frente, o para-brisa.
    { tipo: 'massa', d: suave([[44, 64], [70, 56], [104, 60], [112, 84], [100, 104], [56, 104], [40, 88]], true, 0.4), cor, marca: 'carroceria' },
    { tipo: 'massa', d: ret(100, 92, 52, 9, 3), cor: escurecer(cor, 0.2), marca: 'assoalho' },
    { tipo: 'massa', d: suave([[140, 100], [152, 60], [168, 36], [182, 34], [176, 56], [168, 98]], true, 0.4), cor, marca: 'avental' },
    { tipo: 'vidro', d: suave([[168, 34], [174, 12], [184, 12], [180, 34]], true, 0.4), claro: true, marca: 'parabrisa' },
    { tipo: 'massa', d: suave([[52, 56], [70, 50], [110, 52], [112, 60], [80, 64], [54, 64]], true, 0.35), cor: COURO, marca: 'banco' },
    { tipo: 'metal', d: membro([[58, 98], [36, 96]], [6, 5]), cor: '#8d8983' },
    { tipo: 'luz', d: ret(176, 42, 8, 6, 2), cor: '#f2ead2', marca: 'farol' },
    { tipo: 'luz', d: ret(42, 70, 5, 5, 1.4), cor: '#c8372d' },
    { tipo: 'linha', d: 'M70 72c10 4 22 4 30 0', fino: true }
  ];
}

function deRua(cor: string, m: PerfilMoto): Peca[] {
  const eT = 62, eD = 182, r = m.grande ? 24 : 23;
  return [
    roda(eT, r, m.aro ?? 'liga'), roda(eD, r, m.aro ?? 'liga'),
    { tipo: 'metal', d: membro([[eT, CHAO - r], [120, 88]], [6, 7]), cor: PRETO, marca: 'balanca' },
    { tipo: 'metal', d: membro([[152, 40], [eD, CHAO - r]], [5, 4.5]), cor: PRATA, marca: 'garfo' },
    // O motor à mostra: o cilindro com as aletas e o cárter redondo — e o escapamento.
    { tipo: 'massa', d: cantos([[110, 64, 3], [138, 60, 3], [142, 84, 3], [114, 88, 3]]), cor: '#7b7873', marca: 'motor' },
    { tipo: 'linha', d: 'M112 68l25-4M113 73l25-4M114 78l25-4', larg: 1, fino: true },
    { tipo: 'massa', d: suave([[104, 86], [124, 82], [146, 86], [146, 100], [126, 106], [104, 100]], true, 0.45), cor: '#5d5a56' },
    m.escapeCurto
      ? { tipo: 'metal', d: cantos([[104, 100, 2], [128, 104, 2], [126, 112, 2], [100, 108, 2]]), cor: '#5d5a56', marca: 'escapamento' }
      : { tipo: 'metal', d: membro([[108, 102], [80, 106], [48, 96]], [6, 6, 7]), cor: '#9a9690', marca: 'escapamento' },
    ...(m.bagageiro ? [{ tipo: 'metal' as const, d: ret(36, 48, 30, 3.4, 1) + ret(38, 51, 3, 10, 1), cor: '#4a4743', marca: 'bagageiro' }] : []),
    // O tanque (a gota), o banco até a rabeta, a tampa lateral.
    { tipo: 'massa', d: suave(m.grande ? [[100, 52], [122, 36], [154, 38], [154, 58], [130, 66], [100, 64]] : [[104, 52], [124, 40], [152, 42], [150, 58], [130, 66], [104, 64]], true, 0.45), cor, marca: 'tanque' },
    { tipo: 'massa', d: suave([[54, 56], [72, 52], [106, 54], [110, 62], [86, 66], [58, 66]], true, 0.35), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: cantos([[44, 52, 3], [62, 52, 3], [68, 66, 3], [52, 68, 3]]), cor, marca: 'rabeta' },
    { tipo: 'luz', d: ret(42, 54, 5, 5, 1), cor: '#c8372d' },
    ...(m.carenagem ? [{ tipo: 'massa' as const, d: suave([[150, 30], [172, 26], [176, 46], [156, 52]], true, 0.4), cor, marca: 'carenagem' }] : []),
    m.farol === 'anguloso'
      ? { tipo: 'luz', d: cantos([[160, 40, 1], [176, 36, 1], [174, 50, 1], [162, 50, 1]]), cor: '#f2ead2', marca: 'farol' }
      : { tipo: 'massa', d: circulo(166, 44, 8), cor: '#4a4743', marca: 'farol' },
    ...(m.farol !== 'anguloso' ? [{ tipo: 'luz' as const, d: circulo(167, 44, 5), cor: '#f2ead2' }] : []),
    { tipo: 'linha', d: 'M150 34l8-6h12M154 30l-2-8h6', larg: 2 }
  ];
}

function esportiva(cor: string): Peca[] {
  const eT = 62, eD = 184, r = 23;
  return [
    roda(eT, r), roda(eD, r),
    { tipo: 'metal', d: membro([[eT, CHAO - r], [118, 90]], [6, 7]), cor: PRETO },
    { tipo: 'metal', d: membro([[160, 46], [eD, CHAO - r]], [5, 4.5]), cor: '#c9a23a', marca: 'garfo' },
    { tipo: 'metal', d: membro([[110, 100], [72, 98]], [8, 7]), cor: '#3f3c39', marca: 'escapamento' },
    // A carenagem inteira (cobre o motor), a bolha do para-brisa, a rabeta alta e fina — o que é a esportiva.
    { tipo: 'massa', d: suave([[96, 62], [132, 54], [166, 40], [186, 56], [180, 72], [150, 96], [112, 100], [96, 86]], true, 0.4), cor, marca: 'carenagem' },
    { tipo: 'massa', d: suave([[120, 70], [146, 66], [150, 84], [124, 90]], true, 0.45), cor: escurecer(cor, 0.28), semVolume: true },
    { tipo: 'vidro', d: suave([[158, 42], [172, 30], [182, 36], [176, 46]], true, 0.4), claro: true, marca: 'parabrisa' },
    { tipo: 'massa', d: suave([[40, 40], [64, 44], [100, 54], [96, 62], [64, 58], [44, 50]], true, 0.4), cor, marca: 'rabeta' },
    { tipo: 'massa', d: suave([[66, 50], [96, 54], [110, 60], [80, 60]], true, 0.4), cor: COURO, marca: 'banco' },
    { tipo: 'luz', d: cantos([[176, 52, 1], [188, 54, 1], [184, 60, 1], [174, 58, 1]]), cor: '#f2ead2', marca: 'farol' },
    { tipo: 'luz', d: ret(38, 40, 6, 4, 1), cor: '#c8372d' },
    { tipo: 'linha', d: 'M130 64l30 -10', larg: 1, fino: true }
  ];
}

function classica(cor: string, m: PerfilMoto): Peca[] {
  const eT = 60, eD = 182, r = 23;
  return [
    roda(eT, r, m.aro ?? 'raios'), roda(eD, r, m.aro ?? 'raios'),
    { tipo: 'metal', d: membro([[eT, CHAO - r], [118, 90]], [5.5, 6.5]), cor: PRETO },
    { tipo: 'metal', d: membro([[156, 40], [eD, CHAO - r]], [5, 4.5]), cor: CROMO, marca: 'garfo' },
    // O motor clássico (aletas grandes), o escapamento cromado comprido.
    { tipo: 'massa', d: cantos([[106, 62, 4], [140, 60, 4], [144, 94, 4], [108, 98, 4]]), cor: '#6a6661', marca: 'motor' },
    { tipo: 'linha', d: 'M108 66l34-2M108 71l34-2M108 76l34-2M108 81l34-2', larg: 1, fino: true },
    { tipo: 'metal', d: membro([[118, 98], [80, 104], [36, 100]], [6, 6.5, 7]), cor: CROMO, marca: 'escapamento' },
    // O tanque redondo (a lágrima), o banco reto e baixo, os para-lamas que acompanham as rodas.
    { tipo: 'massa', d: suave([[104, 54], [118, 40], [146, 40], [154, 52], [134, 62], [106, 62]], true, 0.5), cor, marca: 'tanque' },
    { tipo: 'massa', d: ret(58, 54, 52, 9, 4), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: `M${eT - r - 4} ${CHAO - r - 4}A${r + 5} ${r + 5} 0 0 1 ${eT + r * 0.4} ${CHAO - r * 1.95}l1 3A${r + 2} ${r + 2} 0 0 0 ${eT - r - 1} ${CHAO - r - 3}Z`, cor, semVolume: true },
    { tipo: 'massa', d: circulo(166, 40, 8.5), cor: CROMO, marca: 'farol' },
    { tipo: 'luz', d: circulo(167, 40, 5.5), cor: '#f2ead2' },
    { tipo: 'linha', d: 'M146 30l10 -2h12', larg: 2 }
  ];
}

function trilha(cor: string, m: PerfilMoto): Peca[] {
  const eT = 60, eD = 186, rT = 23, rD = 25;
  return [
    roda(eT, rT, 'cravos'), roda(eD, rD, 'cravos'),
    { tipo: 'metal', d: membro([[eT, CHAO - rT], [118, 80]], [6, 7]), cor: PRETO },
    // A suspensão alta e longa na frente (o que é a trilha).
    { tipo: 'metal', d: membro([[160, 26], [eD, CHAO - rD]], [5.5, 5]), cor: '#c9a23a', marca: 'garfo' },
    { tipo: 'massa', d: cantos([[112, 60, 3], [138, 58, 3], [140, 82, 3], [114, 84, 3]]), cor: '#7b7873', marca: 'motor' },
    // O escape alto da trilha: sai do motor e corre por baixo do banco até a rabeta (protegido da lama).
    { tipo: 'metal', d: membro([[116, 80], [92, 66], [60, 58]], [6, 6, 7]), cor: '#9a9690', marca: 'escapamento' },
    // O banco longo e alto, a carenagem estreita do tanque, a rabeta, o para-lama "bico" embaixo do farol.
    { tipo: 'massa', d: suave(m.grande ? [[100, 46], [126, 34], [156, 34], [152, 56], [126, 60], [100, 58]] : [[104, 46], [126, 36], [152, 36], [150, 54], [126, 58], [104, 56]], true, 0.4), cor, marca: 'tanque' },
    { tipo: 'massa', d: suave([[46, 42], [76, 44], [118, 46], [114, 54], [76, 52], [50, 50]], true, 0.4), cor: COURO, marca: 'banco' },
    { tipo: 'massa', d: suave([[34, 36], [52, 38], [64, 46], [44, 48]], true, 0.4), cor, marca: 'rabeta' },
    { tipo: 'massa', d: suave([[156, 42], [178, 40], [196, 50], [172, 50]], true, 0.4), cor, marca: 'bico' },
    { tipo: 'massa', d: suave([[156, 18], [170, 16], [172, 34], [160, 36]], true, 0.4), cor, marca: 'farol' },
    { tipo: 'luz', d: ret(162, 22, 8, 7, 2), cor: '#f2ead2' },
    ...(m.parabrisa ? [{ tipo: 'vidro' as const, d: suave([[158, 16], [164, 4], [170, 4], [168, 16]], true, 0.4), claro: true, marca: 'parabrisa' }] : []),
    { tipo: 'linha', d: 'M150 22l10 -6h14', larg: 2 },
    { tipo: 'luz', d: ret(34, 38, 5, 4, 1), cor: '#c8372d' }
  ];
}

export function moto(forma: 'cub' | 'scooter' | 'street' | 'esportiva' | 'cruiser' | 'trail', cor: string, versaoId?: string): Amostra {
  const m = (versaoId && MODELOS_MOTO[versaoId]) || {};
  const pecas = forma === 'cub' ? motoneta(cor, m) : forma === 'scooter' ? scooter(cor) : forma === 'esportiva' ? esportiva(cor) : forma === 'cruiser' ? classica(cor, m) : forma === 'trail' ? trilha(cor, m) : deRua(cor, m);
  return { vb: [240, 132], chao: CHAO, sombra: [122, 76], pecas };
}

/* ------------------------------------------------------------ Bicicletas */

export interface PerfilBike { base?: 'urbana' | 'mtb' | 'cruiser'; eletrica?: boolean;
  /** A mountain bike de entrada (freio de aro, sem disco) e a de suspensão a ar (o amortecedor atrás, os tubos grossos). */
  semDisco?: boolean; amortecedor?: boolean }
export const MODELOS_BIKE: Record<string, PerfilBike> = {
  caloi_andes: { base: 'urbana' }, caloi_strada: {}, caloi_vulcan: { semDisco: true }, oggi_hacker: {}, sense_fun: { amortecedor: true },
  vela_2: { base: 'urbana', eletrica: true }, caloi_evibe: { base: 'cruiser', eletrica: true }, sense_impulse: { base: 'mtb', eletrica: true }
};

export function bicicleta(forma: 'urbana' | 'estrada' | 'mtb' | 'eletrica', cor: string, versaoId?: string): Amostra {
  const m = (versaoId && MODELOS_BIKE[versaoId]) || {};
  const tipo = forma === 'eletrica' ? (m.base ?? 'urbana') : forma === 'estrada' ? 'estrada' : forma;
  const eletrica = forma === 'eletrica' || !!m.eletrica;
  const r = tipo === 'mtb' ? 27 : 27, eT = 66, eD = 178, cy = CHAO - r;
  const mov: [number, number] = [114, 98];
  const fino = tipo === 'estrada';
  const pneu = (cx: number): Peca => ({ tipo: 'pneu', cx, cy, r, aro: 'bicicleta', raios: fino ? 18 : 14, marca: 'roda' });
  const cravos = tipo === 'mtb' ? [eT, eD].map(cx => ({ tipo: 'linha' as const, d: `M${cx - r + 0.4} ${cy}a${r - 0.4} ${r - 0.4} 0 1 0 ${2 * r - 0.8} 0a${r - 0.4} ${r - 0.4} 0 1 0 ${-2 * r + 0.8} 0`, larg: 2.6, cor: '#45403a', marca: 'cravos' })) : [];
  const tubo = (a: [number, number], b: [number, number], w = 4.4): Peca => ({ tipo: 'massa', d: membro([a, b], [w, w]), cor, semVolume: true });
  const pecas: Peca[] = [pneu(eT), pneu(eD), ...cravos];
  if (tipo === 'urbana' || tipo === 'cruiser') {
    const caixa: [number, number] = [160, 46], canote: [number, number] = [98, 50];
    pecas.push(
      // O quadro baixo, de passar a perna (o tubo curvo do guidão ao pedal), a balança, o canote.
      { tipo: 'massa', d: membro([[caixa[0], caixa[1]], [136, 80], [mov[0] + 4, mov[1]]], [5, 5.4, 6]), cor, semVolume: true, marca: 'quadro-baixo' },
      tubo(mov, [canote[0] + 2, canote[1] + 6]), tubo([eT, cy], mov, 3.6), tubo([eT, cy], [canote[0] + 3, canote[1] + 10], 3.2),
      { tipo: 'metal', d: membro([caixa, [eD, cy]], [4, 3.6]), cor: PRATA, marca: 'garfo' },
      { tipo: 'massa', d: `M${eT - r - 2} ${cy}A${r + 4} ${r + 4} 0 0 1 ${eT + r * 0.75} ${cy - r * 0.8}l1.6 2.6A${r + 1.5} ${r + 1.5} 0 0 0 ${eT - r + 0.6} ${cy}Z`, cor, semVolume: true, marca: 'paralama' },
      { tipo: 'massa', d: `M${eD - r * 0.6} ${cy - r * 0.88}A${r + 4} ${r + 4} 0 0 1 ${eD + r + 2} ${cy + 2}h-2.6A${r + 1.5} ${r + 1.5} 0 0 0 ${eD - r * 0.55} ${cy - r * 0.78}Z`, cor, semVolume: true, marca: 'paralama' },
      { tipo: 'massa', d: ret(mov[0] - 18, mov[1] - 7, 26, 8, 3), cor: escurecer(cor, 0.2), semVolume: true, marca: 'protetor' },
      { tipo: 'linha', d: tipo === 'cruiser' ? `M${caixa[0]} ${caixa[1]}l-4 -12c-2 -4 -16 -4 -24 0` : `M${caixa[0]} ${caixa[1]}l-2 -12c-1 -6 -12 -6 -20 -4`, larg: 2.6, marca: 'guidao' },
      { tipo: 'massa', d: cantos([[canote[0] - 12, canote[1] - 2, 4], [canote[0] + 10, canote[1] - 3, 4], [canote[0] + 8, canote[1] + 3, 3], [canote[0] - 10, canote[1] + 4, 3]]), cor: '#3b2a20', marca: 'selim' }
    );
    if (tipo === 'urbana') pecas.push(
      { tipo: 'massa', d: cantos([[caixa[0] + 4, caixa[1] - 12, 2], [caixa[0] + 30, caixa[1] - 12, 2], [caixa[0] + 26, caixa[1] + 6, 2], [caixa[0] + 7, caixa[1] + 6, 2]]), cor: '#b98a4e', semVolume: true, marca: 'cesta' },
      { tipo: 'linha', d: `M${caixa[0] + 9} ${caixa[1] - 12}l1 18M${caixa[0] + 17} ${caixa[1] - 12}v18M${caixa[0] + 24} ${caixa[1] - 12}l-1 18M${caixa[0] + 5} ${caixa[1] - 4}h24`, larg: 0.7, fino: true }
    );
  } else if (tipo === 'estrada') {
    // O quadro em diamante, o tubo de cima reto, o guidão curvo (a "speed"), o pneu fino, o selim alto.
    const caixa: [number, number] = [162, 44], canote: [number, number] = [104, 40];
    pecas.push(
      tubo(caixa, [canote[0] + 2, canote[1] + 2], 4), tubo(caixa, mov, 4.4), tubo(mov, canote, 4), tubo([eT, cy], mov, 3), tubo([eT, cy], [canote[0] + 1, canote[1] + 4], 2.8),
      { tipo: 'metal', d: membro([caixa, [eD, cy]], [3.6, 3.2]), cor: PRETO, marca: 'garfo' },
      { tipo: 'linha', d: `M${caixa[0]} ${caixa[1]}l2 -6h12c6 0 6 10 0 12l-4 1`, larg: 2.4, marca: 'guidao-curvo' },
      { tipo: 'massa', d: cantos([[canote[0] - 12, canote[1] - 4, 3], [canote[0] + 10, canote[1] - 4, 3], [canote[0] + 6, canote[1] + 1, 2], [canote[0] - 10, canote[1], 2]]), cor: PRETO, marca: 'selim' }
    );
  } else {
    // Mountain bike: o tubo de cima inclinado, a suspensão na frente (as bengalas), o guidão reto, o disco de freio.
    const caixa: [number, number] = [156, 44], canote: [number, number] = [100, 46];
    pecas.push(
      tubo(caixa, [canote[0] + 4, canote[1] + 4], 5.2), tubo(caixa, mov, 6), tubo(mov, canote, 4.6), tubo([eT, cy], mov, 3.8), tubo([eT, cy], [canote[0] + 2, canote[1] + 8], 3.4),
      { tipo: 'metal', d: membro([caixa, [166, 70]], [6, 6]), cor: PRETO, marca: 'suspensao' },
      { tipo: 'metal', d: membro([[166, 70], [eD, cy]], [4.4, 4]), cor: PRATA },
      { tipo: 'linha', d: `M${caixa[0] - 14} ${caixa[1] - 10}h22`, larg: 2.6, marca: 'guidao' },
      { tipo: 'linha', d: `M${caixa[0]} ${caixa[1]}l-3 -10`, larg: 2.4 },
      ...(m.semDisco ? [] : [{ tipo: 'metal' as const, d: circulo(eD, cy, 7), cor: '#9a9690', marca: 'disco' }]),
      ...(m.amortecedor ? [{ tipo: 'metal' as const, d: membro([[96, 72], [116, 62]], [5, 5]), cor: '#c9a23a', marca: 'amortecedor' }] : []),
      { tipo: 'massa', d: cantos([[canote[0] - 12, canote[1] - 4, 3], [canote[0] + 10, canote[1] - 4, 3], [canote[0] + 6, canote[1] + 1, 2], [canote[0] - 10, canote[1], 2]]), cor: PRETO, marca: 'selim' }
    );
  }
  pecas.push({ tipo: 'metal', d: circulo(mov[0], mov[1], 6), cor: '#8d8f92' }, { tipo: 'linha', d: `M${mov[0]} ${mov[1]}l8 9h6`, larg: 2 });
  if (eletrica) pecas.push(
    // A bateria no tubo (o que faz a elétrica ser elétrica) e o motor no cubo de trás.
    { tipo: 'massa', d: membro([[144, 66], [124, 88]], [9, 9]), cor: BORRACHA, marca: 'bateria' },
    { tipo: 'luz', d: ret(130, 76, 3, 3, 0.6), cor: '#7bc06a' },
    { tipo: 'metal', d: circulo(eT, cy, 7.5), cor: '#5d5a56', marca: 'motor-cubo' }
  );
  if (tipo === 'urbana' || tipo === 'cruiser') pecas.push({ tipo: 'luz', d: circulo(178, 42, 3.4), cor: '#f2ead2' });
  return { vb: [240, 132], chao: CHAO, sombra: [122, 74], pecas };
}
