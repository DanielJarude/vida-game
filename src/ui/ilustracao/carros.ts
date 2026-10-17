/**
 * REWORK 8 (Fase B) — os carros: UM gerador de perfil, as famílias como números, e CADA MODELO do catálogo com os
 * seus (`MODELOS`). O Mobi é curto e alto; o Kwid tem vão livre e o plástico nos para-lamas; o C3, o teto de outra
 * cor; o Renegade é uma caixa em pé com farol redondo; o Nivus, um SUV com teto de cupê; o BMW, capô longo; o 911, o
 * farol no para-lama e a traseira que desce até o para-choque; o Mustang, capô comprido e traseira curta; a Hilux, a
 * caçamba com o santo-antônio. Quem não está aqui (um modelo de um save antigo) usa o perfil da classe, com a pequena
 * variação da semente — o desenho nunca falta.
 */
import { cantos, entreX, escurecer, misturar, num as f, poligono, ret, variacao, type Amostra, type Peca, type Pt } from './nucleo';

export type Traseira = 'hatch' | 'tres' | 'fastback' | 'cacamba' | 'caixa';

export interface PerfilCarro {
  traseira: Traseira;
  /** a traseira e a frente, o raio da roda, os eixos */
  x0: number; x1: number; r: number; eT: number; eD: number;
  /** a soleira (o vão livre), a linha de cintura, o teto, a altura da traseira e a do capô na ponta */
  solo: number; cint: number; teto: number; tras: number; capo: number;
  /** onde o teto começa e termina; a base do para-brisa; o fim do porta-malas (sedã) ou da cabine (picape) */
  tT: number; tD: number; pb: number; vol?: number;
  colunas: number[];
  farol?: 'fino' | 'redondo' | 'alto' | 'paralama';
  rodas?: 'calota' | 'liga' | 'cravos';
  raios?: number;
  rack?: boolean; estribo?: boolean; cava?: boolean; santoAntonio?: boolean; tomada?: boolean;
  /** o teto de outra cor (o C3, o Nivus) */
  tetoCor?: string;
  /** o ombro largo sobre a roda de trás (o 911) */
  ombro?: number;
}

const CHAO = 122;

export const FAMILIAS: Record<'compacto' | 'hatch' | 'seda' | 'suv' | 'suv_medio' | 'suv_grande' | 'picape' | 'esportivo', PerfilCarro> = {
  compacto: { traseira: 'hatch', x0: 46, x1: 194, r: 14.5, eT: 72, eD: 168, solo: 106, cint: 82, teto: 50, tras: 78, capo: 82, tT: 52, tD: 130, pb: 156, colunas: [0.5], rodas: 'calota' },
  hatch: { traseira: 'hatch', x0: 32, x1: 206, r: 16, eT: 66, eD: 176, solo: 107, cint: 82, teto: 54, tras: 80, capo: 84, tT: 42, tD: 128, pb: 160, colunas: [0.52], rodas: 'liga' },
  seda: { traseira: 'tres', x0: 18, x1: 222, r: 16, eT: 60, eD: 186, solo: 107, cint: 84, teto: 56, tras: 82, capo: 86, tT: 74, tD: 140, pb: 170, vol: 52, colunas: [0.5], rodas: 'liga' },
  suv: { traseira: 'caixa', x0: 28, x1: 210, r: 18, eT: 64, eD: 180, solo: 100, cint: 76, teto: 44, tras: 72, capo: 78, tT: 32, tD: 138, pb: 166, colunas: [0.5], rack: true, cava: true, farol: 'alto', rodas: 'liga' },
  suv_medio: { traseira: 'caixa', x0: 22, x1: 216, r: 19, eT: 60, eD: 186, solo: 99, cint: 74, teto: 42, tras: 70, capo: 76, tT: 26, tD: 142, pb: 172, colunas: [0.42, 0.76], rack: true, cava: true, farol: 'alto', rodas: 'liga' },
  suv_grande: { traseira: 'caixa', x0: 14, x1: 224, r: 20, eT: 56, eD: 192, solo: 97, cint: 72, teto: 38, tras: 66, capo: 74, tT: 18, tD: 146, pb: 178, colunas: [0.33, 0.66], rack: true, estribo: true, cava: true, farol: 'alto', rodas: 'liga' },
  picape: { traseira: 'cacamba', x0: 8, x1: 230, r: 19, eT: 50, eD: 194, solo: 94, cint: 70, teto: 38, tras: 70, capo: 70, tT: 102, tD: 150, pb: 176, vol: 98, colunas: [0.5], estribo: true, rodas: 'cravos', farol: 'alto' },
  esportivo: { traseira: 'fastback', x0: 22, x1: 220, r: 16, eT: 58, eD: 182, solo: 108, cint: 90, teto: 62, tras: 96, capo: 98, tT: 70, tD: 128, pb: 158, colunas: [0.62], rodas: 'liga', raios: 5 }
};

/** Cada modelo do catálogo: o que o separa dos outros da mesma família (só os números que mudam). */
export const MODELOS: Record<string, Partial<PerfilCarro>> = {
  // Compactos de entrada.
  fiat_mobi: { x0: 50, x1: 190, teto: 51, capo: 83, pb: 154 },
  renault_kwid: { x0: 44, x1: 196, solo: 101, r: 15, teto: 48, capo: 80, rack: true, cava: true, farol: 'alto' },
  citroen_c3: { x0: 40, x1: 200, solo: 103, teto: 46, cava: true, tetoCor: '#f1eee7', rodas: 'liga', raios: 6 },
  // Hatches.
  chevrolet_onix: { tT: 44, tD: 126 },
  fiat_argo: { teto: 52, capo: 83, raios: 6 },
  hyundai_hb20: { tras: 79, tD: 130, raios: 10 },
  vw_polo: { x0: 30, x1: 208, teto: 55, cint: 81, raios: 5 },
  // Sedãs.
  chevrolet_onix_plus: { vol: 54, rodas: 'calota' },
  honda_city: { teto: 55, vol: 50 },
  vw_virtus: { x1: 224, tT: 72 },
  toyota_corolla: { x0: 14, x1: 226, teto: 57, tT: 78, tD: 142, pb: 172 },
  honda_civic: { tT: 68, tras: 85, vol: 42, teto: 58, raios: 10, solo: 108 },
  bmw_320i: { x1: 228, capo: 88, pb: 177, tD: 146, tT: 82, vol: 60, raios: 5 },
  mercedes_c300: { tT: 80, tD: 144, pb: 174, teto: 56, raios: 5, cint: 85 },
  // SUVs compactos.
  vw_nivus: { traseira: 'fastback', tras: 78, tT: 52, teto: 48, solo: 102, rack: false, tetoCor: '#2b2826' },
  hyundai_creta: { teto: 44 },
  jeep_renegade: { x0: 34, x1: 206, teto: 40, tD: 144, pb: 162, capo: 74, farol: 'redondo' },
  chevrolet_tracker: { teto: 46, tD: 136, pb: 168, rack: false },
  porsche_macan: { traseira: 'fastback', solo: 104, teto: 50, tT: 42, tras: 76, rack: false, cava: false, raios: 5 },
  // SUVs médios.
  jeep_compass: { teto: 43, farol: 'fino' },
  toyota_corolla_cross: { teto: 44, tT: 30, rack: false },
  volvo_xc60: { x0: 20, x1: 218, teto: 42, raios: 5, tomada: true },
  // SUVs de sete lugares.
  jeep_commander: { teto: 40, farol: 'fino' },
  toyota_sw4: { teto: 37, rodas: 'cravos' },
  // Picapes.
  chevrolet_s10: { vol: 100 },
  toyota_hilux: { vol: 98, teto: 36, capo: 68, santoAntonio: true },
  // Esportivos.
  porsche_911: { farol: 'paralama', ombro: 6 },
  ford_mustang: { x0: 18, x1: 224, r: 17, eT: 56, eD: 186, solo: 106, cint: 86, teto: 60, tras: 84, capo: 88, tT: 52, tD: 108, pb: 132, colunas: [0.6], raios: 10 }
};

/** O perfil de um carro: o da família, os números do modelo (se houver) e, sem modelo, a pequena variação da semente. */
export function perfilDoCarro(familia: keyof typeof FAMILIAS, versaoId?: string, semente?: string): PerfilCarro {
  const base = FAMILIAS[familia];
  const doModelo = versaoId ? MODELOS[versaoId] : undefined;
  if (doModelo) return { ...base, ...doModelo };
  const [a, b, d, e] = variacao(semente);
  return { ...base, teto: base.teto + 1.6 * a, tD: base.tD + 3 * b, pb: base.pb + 2.4 * b, capo: base.capo + 1.2 * d, r: base.r + 0.5 * e, x1: base.x1 + 1.6 * d, eD: base.eD + 1.2 * d };
}

/** O carro, em peças: a lataria na cor do carro, os vidros, as portas, as luzes, as rodas — e o que é da família. */
export function carro(p: PerfilCarro, cor: string, estado?: number): Amostra {
  const { x0, x1, r, eT, eD, solo, cint, teto, tras, capo, tT, tD, pb } = p;
  const v = p.vol ?? 0;
  const ombro = p.ombro ?? 0;
  const pintura = estado !== undefined && estado < 40 ? misturar(cor, '#8f8a83', 0.18) : cor;
  const cima: [number, number, number][] =
    // O hatch: a tampa traseira cai quase reta (o vidro de trás inclinado), o teto termina antes — não é uma perua.
    p.traseira === 'hatch' ? [[x0, solo, 3], [x0, tras, 4], [x0 + 7, teto + 15, 6], [tT + 14, teto, 10], [tD, teto, 10], [pb, cint, 5], [x1 - 8, capo, 9], [x1, capo + 7, 5], [x1, solo, 3]]
    : p.traseira === 'caixa' ? [[x0, solo, 3], [x0, teto + 8, 6], [x0 + 3, teto, 6], [tD, teto, 9], [pb, cint, 5], [x1 - 6, capo, 6], [x1, capo + 6, 4], [x1, solo, 3]]
    : p.traseira === 'tres' ? [[x0, solo, 3], [x0, tras, 4], [v, tras - 2, 6], [tT, teto, 16], [tD, teto, 12], [pb, cint, 5], [x1 - 8, capo, 8], [x1, capo + 6, 5], [x1, solo, 3]]
    : p.traseira === 'cacamba' ? [[x0, solo, 3], [x0, cint, 3], [v, cint, 0], [v, teto + 4, 3], [v + 6, teto, 6], [tD, teto, 9], [pb, cint, 5], [x1 - 6, capo, 6], [x1, capo + 6, 4], [x1, solo, 3]]
    : [[x0, solo, 4], [x0, tras, 8], [x0 + 22, tras - 6 - ombro, 14], [tT, teto, 22], [tD, teto, 16], [pb, cint - 2, 8], [x1 - 12, capo - 2, 12], [x1, capo + 6, 6], [x1, solo, 4]];
  const R = r + 3;
  const arco = (x: number) => `L${f(x + R)} ${solo}A${R} ${R} 0 0 0 ${f(x - R)} ${solo}`;
  const corpo = `${cantos(cima, false)}${arco(eD)}${arco(eT)}L${x0} ${solo}Z`;
  // A estufa (o vão envidraçado) recortada pelas colunas.
  const gx = p.traseira === 'cacamba' ? v + 5 : p.traseira === 'caixa' ? x0 + 5 : p.traseira === 'tres' ? tT - 4 : p.traseira === 'fastback' ? tT - 6 : x0 + 10;
  const gxTopo = p.traseira === 'hatch' ? tT + 15 : p.traseira === 'caixa' ? x0 + 6 : p.traseira === 'cacamba' ? v + 7 : tT + 6;
  const vao: Pt[] = [[gx, cint - 3], [gxTopo, teto + 5], [tD - 3, teto + 5], [pb - 6, cint - 3]];
  const xa = Math.min(vao[0][0], vao[1][0]), xb = pb - 6;
  const cortes = [xa, ...p.colunas.map(c => xa + (xb - xa) * c), xb];
  const vidros = cortes.slice(0, -1).map((x, k) => entreX(vao, x + (k ? 2 : 0), cortes[k + 1] - (k < cortes.length - 2 ? 2 : 0)));
  const portas = p.colunas.map(c => xa + (xb - xa) * c);
  const yLanterna = p.traseira === 'cacamba' ? cint : tras;
  const pecas: Peca[] = [
    { tipo: 'massa', d: corpo, cor: pintura, marca: 'lataria' },
    // A caixa de roda escura (sem ela, o papel aparecia em volta do pneu, como num desenho infantil).
    ...[eT, eD].map(x => ({ tipo: 'massa' as const, d: `M${f(x - R + 0.6)} ${solo}A${R - 0.6} ${R - 0.6} 0 0 1 ${f(x + R - 0.6)} ${solo}Z`, cor: '#1f1d1b', semVolume: true, marca: 'caixa-de-roda' })),
    // O teto de outra cor.
    ...(p.tetoCor ? [{ tipo: 'massa' as const, d: cantos([[gxTopo - 2, teto + 0.6, 4], [tD + 1, teto + 0.6, 4], [tD - 1, teto + 4.4, 1], [gxTopo, teto + 4.4, 1]]), cor: p.tetoCor, semVolume: true, marca: 'teto' }] : []),
    ...vidros.map(j => ({ tipo: 'vidro' as const, d: poligono(j), marca: 'vidro' })),
    // As portas (a costura da lataria), as maçanetas, o friso e os para-choques.
    ...portas.map(x => ({ tipo: 'linha' as const, d: `M${f(x)} ${cint - 1}V${solo - 4}`, marca: 'porta' })),
    { tipo: 'linha', d: portas.map(x => `M${f(x - 3)} ${cint + 6}h-7`).join(''), larg: 1.4, fino: true },
    { tipo: 'linha', d: `M${x0 + 2} ${solo - 6}h11M${x1 - 13} ${solo - 6}h11`, fino: true },
    // As luzes: o farol (fino, alto, redondo, no para-lama) e a lanterna.
    p.farol === 'paralama' ? { tipo: 'luz', d: `M${x1 - 27} ${capo - 1.5}a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0-9.2 0`, cor: '#f2ead2', marca: 'farol' }
      : p.farol === 'redondo' ? { tipo: 'luz', d: `M${x1 - 9} ${capo + 9}a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0-8.8 0`, cor: '#f2ead2', marca: 'farol' }
        : p.farol === 'alto' ? { tipo: 'luz', d: ret(x1 - 11, capo + 4, 10, 5, 1.6), cor: '#f2ead2', marca: 'farol' }
          : { tipo: 'luz', d: cantos([[x1 - 12, capo + 5, 1.5], [x1 - 1, capo + 6.5, 1.5], [x1 - 1, capo + 10, 1.5], [x1 - 10, capo + 9, 1.5]]), cor: '#f2ead2', marca: 'farol' },
    { tipo: 'luz', d: ret(x0 + 0.6, yLanterna + 3, 4.6, 7, 1), cor: '#c8372d', marca: 'lanterna' },
    { tipo: 'pneu', cx: eT, cy: CHAO - r, r, aro: p.rodas ?? 'liga', raios: p.raios },
    { tipo: 'pneu', cx: eD, cy: CHAO - r, r, aro: p.rodas ?? 'liga', raios: p.raios }
  ];
  // O que é da família: o rack no teto, o plástico dos para-lamas, o estribo, a caçamba e o santo-antônio, a tomada.
  if (p.rack) pecas.splice(1, 0, { tipo: 'metal', d: ret(gxTopo + 2, teto - 4, Math.max(10, tD - gxTopo - 10), 3, 1), cor: '#4a4643', marca: 'rack' });
  if (p.cava) for (const x of [eT, eD]) pecas.splice(pecas.length - 2, 0, { tipo: 'massa', d: `M${f(x - R - 2)} ${solo + 0.6}A${R + 2} ${R + 2} 0 0 1 ${f(x + R + 2)} ${solo + 0.6}h-3A${R - 1} ${R - 1} 0 0 0 ${f(x - R + 1)} ${solo + 0.6}Z`, cor: '#3a3633', semVolume: true, marca: 'cava' });
  if (p.estribo) pecas.push({ tipo: 'metal', d: ret(eT + R + 4, solo + 1.5, eD - eT - 2 * R - 8, 3.4, 1), cor: '#3d3a37', marca: 'estribo' });
  if (p.traseira === 'cacamba') pecas.push({ tipo: 'linha', d: `M${x0 + 4} ${cint + 4}H${v - 4}`, larg: 1.3, marca: 'cacamba' });
  if (p.santoAntonio) pecas.push({ tipo: 'metal', d: `M${v - 3} ${cint}V${teto + 6}h-24V${cint}h2.6V${teto + 8.6}h18.8V${cint}z`, cor: '#3d3a37', marca: 'santo-antonio' });
  if (p.tomada) pecas.push({ tipo: 'linha', d: `M${x0 + 18} ${cint + 4}h6v3h-6z`, larg: 0.8, so3: true });
  // O estado: o zero tem brilho; o usado, riscos; o cansado, pintura gasta e ferrugem (sempre com o texto ao lado).
  if (estado !== undefined && estado >= 90) pecas.push({ tipo: 'linha', d: `M${f(x0 + 12)} ${cint + 3}q${f((x1 - x0) * 0.3)} -4 ${f((x1 - x0) * 0.55)} -2`, larg: 1, cor: '#fffaf0', marca: 'brilho', fino: true });
  if (estado !== undefined && estado < 60) pecas.push({ tipo: 'linha', d: `M${f(eT + 18)} ${cint + 10}l9 -2M${f(eD - 30)} ${cint + 8}l7 3`, larg: 0.9, cor: '#fffaf0', marca: 'riscos', fino: true });
  if (estado !== undefined && estado < 40) pecas.push({ tipo: 'massa', d: `M${f(eT + 30)} ${solo - 8}a3.2 2 0 1 0 6.4 0a3.2 2 0 1 0-6.4 0M${f(eD - 18)} ${solo - 10}a2.4 1.6 0 1 0 4.8 0a2.4 1.6 0 1 0-4.8 0`, cor: '#8a5434', semVolume: true, marca: 'ferrugem' });
  return { vb: [240, 132], chao: CHAO, sombra: [(x0 + x1) / 2, (x1 - x0) / 2 + 4], pecas };
}

export const escuroDe = (cor: string) => escurecer(cor, 0.25);
