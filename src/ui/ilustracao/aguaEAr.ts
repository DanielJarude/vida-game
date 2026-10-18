/**
 * REWORK 8 (Fase B) — o que anda na água e no ar, na mesma língua dos carros.
 *
 *   moto aquática  o casco curto, o banco em fila, o guidão, o jato de espuma atrás (a de três lugares é mais longa)
 *   lancha         o casco branco, o convés, o para-brisa e o motor de popa (a de 30 pés tem cabine e escotilhas)
 *   veleiro        o casco, o mastro, a vela grande e a buja (o de 31 pés tem cabine)
 *   aviões         ultraleve (asa alta, tubo leve), monomotor de asa alta (o 172: a asa em cima, a escora), de asa baixa
 *                  (o Archer), bimotor (as naceles com as hélices nas asas) e jato executivo (sem hélice, o motor na
 *                  cauda, as janelinhas, a cauda em T)
 *
 * Na água não há sombra no chão: há a linha d'água e o reflexo.
 */
import { cantos, circulo, elipse, ret, suave, type Amostra, type Peca } from './nucleo';

const AGUA = 110;
const BRANCO = '#efece5', PRETO = '#2b2826', CINZA = '#8d8983';
const agua = (x0: number, _x1: number): Peca => ({ tipo: 'linha', d: `M${x0} ${AGUA + 6}q8 -3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0`, larg: 1.4, cor: '#6f93ad', marca: 'agua' });

export interface PerfilBarco { cabine?: boolean; longo?: boolean }
export const MODELOS_BARCO: Record<string, PerfilBarco> = {
  seadoo_spark: {}, yamaha_vx: { longo: true },
  focker_242: {}, schaefer_303: { cabine: true, longo: true },
  delta_26: {}, fast_310: { cabine: true, longo: true }
};

export function barco(forma: 'jetski' | 'lancha' | 'veleiro', cor: string, versaoId?: string): Amostra {
  const m = (versaoId && MODELOS_BARCO[versaoId]) || {};
  const pecas: Peca[] = [];
  if (forma === 'jetski') {
    const x0 = m.longo ? 40 : 56, x1 = m.longo ? 200 : 190;
    pecas.push(
      // O casco: a popa baixa e reta, o bico que sobe; por cima, o convés branco, o banco em fila e o painel.
      { tipo: 'massa', d: cantos([[x0, AGUA - 14, 3], [x1 - 34, AGUA - 18, 10], [x1, AGUA - 30, 4], [x1 - 10, AGUA - 8, 8], [x1 - 44, AGUA + 3, 8], [x0 + 6, AGUA + 3, 3]]), cor, marca: 'casco' },
      { tipo: 'massa', d: cantos([[x0 + 2, AGUA - 14, 2], [x1 - 36, AGUA - 18, 8], [x1 - 6, AGUA - 28, 3], [x1 - 14, AGUA - 22, 4], [x0 + 4, AGUA - 9, 2]]), cor: BRANCO, semVolume: true, marca: 'conves' },
      { tipo: 'massa', d: suave([[x0 + 12, AGUA - 16], [x0 + 18, AGUA - 26], [x1 - 74, AGUA - 28], [x1 - 68, AGUA - 19]], true, 0.4), cor: PRETO, marca: 'banco' },
      { tipo: 'massa', d: suave([[x1 - 70, AGUA - 19], [x1 - 60, AGUA - 36], [x1 - 46, AGUA - 34], [x1 - 40, AGUA - 20]], true, 0.4), cor },
      { tipo: 'linha', d: `M${x1 - 56} ${AGUA - 40}l-6 -12h12`, larg: 2.4, marca: 'guidao' },
      { tipo: 'massa', d: suave([[x0 - 30, AGUA - 2], [x0 - 10, AGUA - 10], [x0 + 4, AGUA - 2], [x0 - 12, AGUA + 4]], true, 0.4), cor: '#dfe9ee', semVolume: true, opacidade: 0.9, marca: 'espuma' },
      agua(10, 230)
    );
  } else if (forma === 'lancha') {
    const x0 = 24, x1 = m.longo ? 222 : 206;
    pecas.push(
      { tipo: 'massa', d: cantos([[x0, AGUA - 22, 4], [x1 - 30, AGUA - 24, 10], [x1, AGUA - 30, 6], [x1 - 22, AGUA + 4, 8], [x0 + 6, AGUA + 4, 3]]), cor: BRANCO, marca: 'casco' },
      { tipo: 'massa', d: cantos([[x0 + 2, AGUA - 8, 2], [x1 - 14, AGUA - 10, 3], [x1 - 20, AGUA - 3, 2], [x0 + 6, AGUA - 2, 2]]), cor, semVolume: true, marca: 'faixa' },
      m.cabine
        ? { tipo: 'massa', d: cantos([[x0 + 40, AGUA - 24, 3], [x1 - 70, AGUA - 24, 3], [x1 - 50, AGUA - 46, 8], [x0 + 52, AGUA - 48, 6]]), cor: BRANCO, marca: 'cabine' }
        : { tipo: 'vidro', d: cantos([[x1 - 80, AGUA - 24, 1], [x1 - 64, AGUA - 40, 2], [x1 - 50, AGUA - 40, 2], [x1 - 58, AGUA - 24, 1]]), claro: true, marca: 'parabrisa' },
      ...(m.cabine ? [0, 1, 2].map(k => ({ tipo: 'vidro' as const, d: circulo(x0 + 66 + k * 18, AGUA - 34, 4), marca: 'escotilha' })) : []),
      { tipo: 'massa', d: ret(x0 - 10, AGUA - 30, 12, 26, 3), cor: PRETO, marca: 'motor' },
      { tipo: 'metal', d: ret(x0 - 6, AGUA - 6, 4, 12, 1), cor: CINZA },
      agua(4, 236)
    );
  } else {
    const x0 = 32, x1 = m.longo ? 214 : 200, mastro = (x0 + x1) / 2 + 6;
    pecas.push(
      { tipo: 'massa', d: cantos([[x0, AGUA - 14, 4], [x1, AGUA - 18, 6], [x1 - 22, AGUA + 4, 8], [x0 + 12, AGUA + 4, 4]]), cor, marca: 'casco' },
      ...(m.cabine ? [{ tipo: 'massa' as const, d: cantos([[x0 + 46, AGUA - 14, 2], [x1 - 64, AGUA - 15, 2], [x1 - 70, AGUA - 26, 5], [x0 + 52, AGUA - 26, 5]]), cor: BRANCO, marca: 'cabine' }, ...[0, 1].map(k => ({ tipo: 'vidro' as const, d: ret(x0 + 60 + k * 26, AGUA - 22, 14, 4, 1.5), marca: 'janela' }))] : []),
      { tipo: 'metal', d: ret(mastro - 1.4, 6, 2.8, AGUA - 20, 1), cor: '#b9b6b0', marca: 'mastro' },
      // A vela grande atrás do mastro e a buja na frente (o triângulo duplo é o veleiro).
      { tipo: 'massa', d: `M${mastro - 3} 10L${mastro - 3} ${AGUA - 22}L${x0 + 18} ${AGUA - 22}Z`, cor: BRANCO, marca: 'vela' },
      { tipo: 'massa', d: `M${mastro + 3} 14L${x1 - 8} ${AGUA - 20}L${mastro + 3} ${AGUA - 20}Z`, cor: '#e6e2d8', marca: 'buja' },
      agua(4, 236)
    );
  }
  return { vb: [240, 132], pecas };
}

/* ------------------------------------------------------------------ Aviões */

const CHAO_AR = 106;
const helice = (x: number, y: number, r = 13): Peca[] => [
  { tipo: 'massa', d: ret(x - 1.4, y - r, 2.8, 2 * r, 1.4), cor: '#3a3633', semVolume: true, marca: 'helice' },
  { tipo: 'metal', d: elipse(x + 2, y, 4, 4.4), cor: '#d0ccc4', marca: 'spinner' }
];
const tremPequeno = (x: number, y: number): Peca[] => [
  { tipo: 'linha', d: `M${x} ${y}L${x - 3} ${CHAO_AR - 8}`, larg: 2 },
  { tipo: 'pneu', cx: x - 3, cy: CHAO_AR - 5, r: 5, aro: 'calota' }
];

/**
 * REWORK 9 — o mesmo tipo de avião, modelos diferentes: o que se vê de perfil e muda de um para o outro (o Excel tem a
 * asa embaixo, o P1 em cima; o Baron, o nariz comprido; o Seneca, a cabine com uma janela a mais; o Phenom e o Citation,
 * quantas janelinhas). Pouco — mas é o avião que a pessoa comprou.
 */
export interface PerfilAviao { asaBaixa?: boolean; narizLongo?: boolean; janelaExtra?: boolean; janelas?: number }
export const MODELOS_AVIAO: Record<string, PerfilAviao> = {
  inpaer_excel: { asaBaixa: true }, paradise_p1: {},
  piper_seneca: { janelaExtra: true }, beech_baron: { narizLongo: true },
  embraer_phenom100: { janelas: 4 }, cessna_citation_m2: { janelas: 6 }
};

export function aviao(forma: 'ultraleve' | 'monomotor' | 'asa_baixa' | 'bimotor' | 'jato', cor: string, versaoId?: string): Amostra {
  const m = (versaoId && MODELOS_AVIAO[versaoId]) || {};
  const fus = BRANCO;
  const pecas: Peca[] = [];
  if (forma === 'jato') {
    pecas.push(
      // A fuselagem longa, o nariz fino, a cauda em T, o motor colado na cauda, a fileira de janelinhas.
      { tipo: 'massa', d: suave([[20, 74], [40, 62], [180, 60], [222, 70], [228, 78], [200, 86], [40, 86], [22, 80]], true, 0.38), cor: fus, marca: 'fuselagem' },
      { tipo: 'massa', d: cantos([[24, 62, 2], [36, 24, 2], [46, 24, 2], [50, 64, 2]]), cor: fus, marca: 'cauda' },
      { tipo: 'massa', d: ret(22, 20, 36, 6, 3), cor: fus, marca: 'cauda-t' },
      { tipo: 'massa', d: suave([[44, 56], [76, 50], [84, 60], [50, 64]], true, 0.4), cor: '#d8d4cb', marca: 'motor' },
      { tipo: 'massa', d: cantos([[96, 82, 2], [150, 80, 2], [120, 96, 2], [92, 94, 2]]), cor: fus, marca: 'asa' },
      { tipo: 'massa', d: ret(60, 72, 150, 3, 1.5), cor, semVolume: true, marca: 'faixa' },
      ...Array.from({ length: m.janelas ?? 6 }, (_, k) => ({ tipo: 'vidro' as const, d: circulo(92 + k * (96 / (m.janelas ?? 6)), 68, 3.2), marca: 'janela' })),
      { tipo: 'vidro', d: suave([[200, 66], [214, 64], [220, 70], [206, 72]], true, 0.4), marca: 'cabine' },
      ...tremPequeno(186, 86), ...tremPequeno(110, 92)
    );
  } else {
    const baixa = forma === 'asa_baixa' || forma === 'bimotor' || !!m.asaBaixa;
    const leve = forma === 'ultraleve';
    const nariz = m.narizLongo ? 10 : 0;
    const yAsa = baixa ? 88 : 50;
    pecas.push(
      // A fuselagem com a cabine, a deriva e o profundor; a asa (em cima ou embaixo) e, no alto, a escora.
      { tipo: 'massa', d: suave(leve ? [[30, 70], [70, 66], [150, 60], [196, 66], [204, 78], [150, 88], [70, 80], [32, 76]] : [[24, 70], [60, 64], [150, 56], [200 + nariz, 62], [212 + nariz, 74], [200 + nariz, 88], [150, 92], [60, 82], [26, 78]], true, 0.38), cor: fus, marca: 'fuselagem' },
      { tipo: 'massa', d: cantos([[26, 66, 2], [34, 30, 2], [46, 30, 2], [54, 66, 2]]), cor, marca: 'deriva' },
      { tipo: 'massa', d: ret(18, 70, 40, 5, 2.5), cor: fus, marca: 'profundor' },
      { tipo: 'vidro', d: suave(baixa ? [[150, 58], [176, 54], [192, 64], [160, 66]] : [[150, 62], [182, 58], [196, 70], [156, 70]], true, 0.4), claro: leve, marca: 'cabine' },
      // A asa de perfil: a baixa aparece por baixo da fuselagem; a alta, em cima da cabine.
      { tipo: 'massa', d: cantos(baixa ? [[106, yAsa, 3], [178, yAsa - 3, 3], [182, yAsa + 3, 3], [104, yAsa + 8, 3]] : [[100, yAsa, 3], [192, yAsa - 2, 3], [192, yAsa + 7, 2], [100, yAsa + 7, 2]]), cor, marca: 'asa', attrs: { 'data-y': String(yAsa) } },
      { tipo: 'massa', d: ret(70, 74, 120, 3, 1.5), cor, semVolume: true, marca: 'faixa' }
    );
    if (m.janelaExtra) pecas.push({ tipo: 'vidro', d: suave([[126, 62], [142, 60], [144, 68], [126, 69]], true, 0.4), marca: 'janela' });
    if (!baixa) pecas.push({ tipo: 'linha', d: `M${forma === 'ultraleve' ? 130 : 140} ${yAsa + 6}L${forma === 'ultraleve' ? 150 : 162} 82`, larg: 1.6, marca: 'escora' });
    if (forma === 'bimotor') {
      // As naceles nas asas, cada uma com a sua hélice; o nariz sem hélice.
      pecas.push({ tipo: 'massa', d: suave([[132, 80], [180, 78], [188, 84], [180, 90], [132, 90]], true, 0.4), cor: fus, marca: 'nacele' });
      pecas.push(...helice(190, 84, 12));
      pecas.push({ tipo: 'massa', d: suave([[214 + nariz, 72], [222 + nariz, 74], [214 + nariz, 80]], true, 0.4), cor: fus, marca: 'nariz' });
    } else {
      pecas.push(...helice(leve ? 206 : 214, 74, leve ? 11 : 13));
    }
    pecas.push(...tremPequeno(170, 90), ...tremPequeno(80, 82));
  }
  return { vb: [240, 132], chao: CHAO_AR, sombra: [118, 80], pecas };
}

