/**
 * VIDA 12.9 — os veículos novos no desenho e o que a personalização muda nele.
 *
 *   MODELOS     cada carro novo com os números do seu perfil (o capô longo do DB12, a cabine adiantada do motor central,
 *               a caixa em pé do G 63 com o estepe atrás, as aletas do Eldorado, o rabo de pato do 911 RS, as tomadas
 *               laterais da Testarossa, a asa do Countach); cada moto nova com o que a separa das outras da mesma forma.
 *   VISUAL      o acabamento (metálico com flocos e reflexo nítido; perolizado com o véu que muda de tom; acetinado de
 *               meio brilho; fosco sem brilho nenhum), as rodas (desenho, número de raios, cor, aro maior), o teto em
 *               outra cor, as faixas, o aerofólio e a película nos vidros.
 *
 * Tudo derivado do catálogo e de `mods` do bem (`dados/veiculos129.visualDasMods`): nada novo no save.
 */
import type { FormaVeiculo } from '../../motor/dados/bens';
import type { VisualVeiculo } from '../../motor/dados/veiculos129';
import { clarear, cantos, escurecer, luminancia, misturar, num as f, ret, type Peca } from './nucleo';
import type { PerfilCarro } from './carros';
import type { PerfilMoto } from './duasRodas';

/** O que é do modelo e não cabe nos números da família. */
export interface Extras129 {
  /** As aletas traseiras (os americanos do fim dos anos 1950): a altura. */
  aletas?: number;
  /** A asa de fábrica: o defletor baixo, a asa alta, o "rabo de pato". */
  asa?: 'baixa' | 'alta' | 'ducktail';
  /** Para-choques e friso cromados (o clássico). */
  cromado?: boolean;
  /** As tomadas de ar na lateral (o motor central). */
  tomadas?: boolean;
  /** O estepe pendurado na traseira (o jipe, o G). */
  estepe?: boolean;
  /** As faixas de fábrica. */
  faixa?: 'lateral' | 'dupla';
}

/** Os carros novos: só os números que mudam da família. */
export const MODELOS_CARRO_129: Record<string, Partial<PerfilCarro>> = {
  // Esportivos de rua.
  mazda_mx5: { x0: 34, x1: 210, eT: 66, eD: 180, teto: 67, tT: 94, tD: 124, pb: 150, tras: 94, capo: 97, tetoCor: '#2b2826', raios: 10 },
  toyota_gr86: { x0: 26, x1: 214, teto: 63, tT: 76, tD: 124, tras: 92, raios: 10, extras: { asa: 'baixa' } },
  toyota_supra: { x1: 222, teto: 63, tT: 84, tD: 122, capo: 99, ombro: 5, raios: 5, extras: { asa: 'ducktail' } },
  chevrolet_corvette: { teto: 64, tT: 80, tD: 116, pb: 140, tras: 92, capo: 100, raios: 10, extras: { tomadas: true } },
  porsche_718_cayman: { farol: 'paralama', teto: 63, tT: 86, tD: 122, tras: 94, ombro: 4, raios: 5, extras: { tomadas: true } },
  bmw_m4: { x0: 18, x1: 226, teto: 60, tT: 72, tD: 134, pb: 166, colunas: [0.58], tras: 92, capo: 94, raios: 7 },
  vw_golf_gti: { teto: 53, solo: 108, cint: 82, raios: 12, extras: { asa: 'baixa', faixa: 'lateral' } },
  honda_civic_type_r: { x0: 22, x1: 214, teto: 55, tT: 48, tras: 82, raios: 9, extras: { asa: 'alta' } },
  porsche_taycan: { traseira: 'fastback', teto: 58, tT: 58, tD: 136, pb: 166, tras: 88, capo: 92, solo: 108, colunas: [0.45], farol: 'paralama', raios: 10 },
  // Luxo.
  porsche_cayenne: { teto: 46, solo: 102, capo: 80, rack: false, cava: false, raios: 5, farol: 'paralama' },
  bmw_x5: { x1: 220, teto: 42, rack: true, cava: false, raios: 7 },
  mercedes_s500: { x0: 10, x1: 232, teto: 56, tT: 80, tD: 146, pb: 178, vol: 54, cint: 84, raios: 10 },
  range_rover: { teto: 36, tT: 16, rack: false, estribo: false, farol: 'fino', raios: 7, tetoCor: '#1f1f22' },
  mercedes_g63: { x0: 26, x1: 214, teto: 34, tD: 150, pb: 166, capo: 72, farol: 'redondo', rack: false, cava: false, colunas: [0.5], raios: 5, extras: { estepe: true } },
  cadillac_escalade: { x0: 8, x1: 232, teto: 38, raios: 6 },
  // Superesportivos de série.
  ferrari_296: { teto: 64, tT: 88, tD: 120, pb: 146, tras: 94, capo: 98, ombro: 3, extras: { tomadas: true } },
  ferrari_purosangue: { traseira: 'fastback', x0: 22, x1: 216, teto: 48, tT: 46, tras: 76, solo: 104, capo: 84, rack: false, cava: false, raios: 5 },
  lamborghini_urus: { traseira: 'fastback', teto: 50, tT: 40, tras: 76, solo: 104, capo: 84, rack: false, farol: 'fino', raios: 10 },
  lamborghini_revuelto: { x0: 18, x1: 224, teto: 70, tT: 92, tD: 118, pb: 140, tras: 90, capo: 100, raios: 10, extras: { tomadas: true } },
  aston_db12: { x0: 16, x1: 226, teto: 62, tT: 70, tD: 116, pb: 146, tras: 92, capo: 96, raios: 10 },
  mercedes_amg_gt: { x1: 228, teto: 62, tT: 62, tD: 120, pb: 148, capo: 96, raios: 5 },
  // Edições limitadas.
  porsche_911_dakar: { farol: 'paralama', ombro: 6, solo: 102, r: 17, rack: true, cava: true, raios: 5 },
  porsche_911_st: { farol: 'paralama', ombro: 6, raios: 10, extras: { asa: 'ducktail' } },
  lamborghini_sterrato: { teto: 68, tT: 90, tD: 118, pb: 142, tras: 92, capo: 100, solo: 102, rack: true, cava: true, raios: 6, extras: { tomadas: true } },
  ferrari_sf90_xx: { teto: 68, tT: 92, tD: 120, pb: 144, tras: 92, capo: 100, raios: 5, extras: { asa: 'alta', tomadas: true } },
  // Altíssimo luxo.
  bentley_bentayga: { teto: 38, farol: 'redondo', rack: true, estribo: false, raios: 10 },
  rolls_spectre: { x0: 10, x1: 232, teto: 56, tT: 60, tD: 134, pb: 166, tras: 86, capo: 88, cint: 84, rodas: 'calota' },
  rolls_phantom: { x0: 6, x1: 234, teto: 50, tT: 84, tD: 150, pb: 182, capo: 80, cint: 80, tras: 80, vol: 40, rodas: 'calota' },
  bentley_bacalar: { teto: 76, tT: 98, tD: 116, pb: 138, tras: 90, capo: 94, cint: 88, x0: 14, x1: 228, raios: 10 },
  // Clássicos do Brasil.
  vw_sp2_1973: { x0: 26, x1: 214, teto: 64, tT: 74, tD: 126, tras: 92, capo: 98, rodas: 'calota', extras: { cromado: true } },
  willys_interlagos_1964: { x0: 40, x1: 202, eT: 70, eD: 174, r: 15, teto: 66, tT: 80, tD: 124, pb: 148, tras: 96, capo: 98, farol: 'redondo', rodas: 'calota', extras: { cromado: true } },
  puma_gte_1976: { x0: 34, x1: 206, teto: 68, tT: 84, tD: 122, pb: 146, farol: 'redondo', raios: 4 },
  ford_maverick_gt_1974: { x0: 16, x1: 226, teto: 62, tT: 60, tD: 128, pb: 156, tras: 92, capo: 94, raios: 8, extras: { cromado: true, faixa: 'lateral' } },
  dodge_charger_rt_1971: { x0: 12, x1: 230, teto: 62, tT: 70, tD: 130, pb: 160, capo: 92, tras: 92, raios: 6, tetoCor: '#1f1f22', extras: { cromado: true } },
  vw_brasilia_1978: { x0: 42, x1: 198, teto: 50, tT: 48, tD: 132, tras: 76, capo: 84, rodas: 'calota', extras: { cromado: true } },
  ford_landau_1980: { x0: 6, x1: 234, teto: 58, tT: 86, tD: 144, pb: 172, vol: 46, cint: 84, capo: 84, rodas: 'calota', tetoCor: '#ecebe6', extras: { cromado: true } },
  toyota_bandeirante_1985: { x0: 34, x1: 206, teto: 40, tD: 146, pb: 158, capo: 72, farol: 'redondo', rack: false, cava: false, rodas: 'cravos', extras: { estepe: true } },
  // Clássicos do mundo.
  mini_cooper_s_1965: { x0: 56, x1: 184, eT: 76, eD: 164, r: 12, teto: 54, tT: 60, tD: 138, pb: 156, tras: 82, capo: 86, farol: 'redondo', tetoCor: '#ecebe6', rodas: 'calota', extras: { cromado: true } },
  fiat_500_1968: { traseira: 'fastback', x0: 58, x1: 182, eT: 80, eD: 160, r: 12.5, teto: 52, tT: 66, tD: 132, pb: 150, tras: 90, capo: 88, farol: 'redondo', rodas: 'calota' },
  citroen_2cv_1970: { x0: 46, x1: 196, r: 15, teto: 48, tT: 54, tD: 130, pb: 150, tras: 80, capo: 82, solo: 102, farol: 'redondo', tetoCor: '#77736c', rodas: 'calota' },
  chevrolet_bel_air_1957: { x0: 6, x1: 234, teto: 58, tT: 80, tD: 140, pb: 168, vol: 34, cint: 82, capo: 82, tras: 80, rodas: 'calota', tetoCor: '#ecebe6', extras: { aletas: 6, cromado: true } },
  cadillac_eldorado_1959: { x0: 2, x1: 238, teto: 60, tT: 84, tD: 138, pb: 166, vol: 30, tras: 82, capo: 82, rodas: 'calota', extras: { aletas: 14, cromado: true } },
  datsun_240z_1971: { x0: 24, x1: 218, teto: 62, tT: 72, tD: 118, pb: 146, tras: 92, capo: 96, farol: 'redondo', raios: 8 },
  bmw_m3_e30_1988: { x0: 24, x1: 216, teto: 56, tT: 76, tD: 138, pb: 164, vol: 58, raios: 8, extras: { asa: 'baixa' } },
  lancia_delta_integrale_1992: { x0: 36, x1: 204, teto: 52, tT: 40, tD: 128, cava: true, farol: 'redondo', raios: 8, extras: { asa: 'baixa' } },
  corvette_1963: { x0: 18, x1: 224, teto: 64, tT: 66, tD: 120, pb: 148, capo: 98, tras: 92, rodas: 'calota', extras: { cromado: true } },
  shelby_gt500_1967: { x0: 16, x1: 226, teto: 62, tT: 52, tD: 112, pb: 136, capo: 92, tras: 88, raios: 5, extras: { asa: 'ducktail', cromado: true, faixa: 'dupla' } },
  ferrari_testarossa_1986: { x0: 16, x1: 226, teto: 68, tT: 92, tD: 118, pb: 140, tras: 92, capo: 100, raios: 5, extras: { tomadas: true } },
  porsche_911_rs_1973: { farol: 'paralama', ombro: 6, raios: 5, extras: { asa: 'ducktail', faixa: 'lateral' } },
  lamborghini_countach_1985: { x0: 20, x1: 222, teto: 72, tT: 94, tD: 116, pb: 136, capo: 100, tras: 92, raios: 5, extras: { asa: 'alta', tomadas: true } },
  toyota_2000gt_1967: { x0: 24, x1: 218, teto: 68, tT: 74, tD: 116, pb: 142, capo: 100, tras: 96, farol: 'redondo', rodas: 'raios' },
  mercedes_300sl_1955: { x0: 24, x1: 218, teto: 64, tT: 76, tD: 120, pb: 146, capo: 96, tras: 94, ombro: 3, farol: 'redondo', rodas: 'calota', extras: { cromado: true } }
};

/** As motos novas: o que as separa das outras da mesma forma. */
export const MODELOS_MOTO_129: Record<string, PerfilMoto> = {
  yamaha_nmax: { maxi: true }, vespa_primavera: { vespa: true },
  honda_xre190: { aro: 'raios' }, yamaha_lander: { bagageiro: true }, royal_enfield_himalayan: { farol: 'redondo', bagageiro: true },
  honda_africa_twin: { parabrisa: true, grande: true, bagageiro: true }, ducati_multistrada: { parabrisa: true, grande: true, carenagem: true, aro: 'liga' },
  kawasaki_z900: { farol: 'anguloso', grande: true, escapeCurto: true, robusta: true }, yamaha_mt09: { farol: 'duplo', grande: true, escapeCurto: true }, triumph_street_triple: { farol: 'duplo', grande: true },
  royal_enfield_interceptor: { aro: 'raios', escapeDuplo: true }, harley_fat_boy: { custom: true }, indian_scout: { baixa: true, aro: 'liga' },
  bmw_s1000rr: { farol: 'anguloso' }, honda_fireblade: { asas: true }, ducati_superleggera: { asas: true, farol: 'anguloso' }
};

/* ============================================================== o acabamento e os detalhes no carro */

const BRANCO = '#fffaf0';
/** O contraste da faixa: clara no carro escuro, escura no claro. */
const tintaDaFaixa = (cor: string) => (luminancia(cor) < 0.18 ? '#f1eee7' : '#1f1f22');

/** A cor da lataria depois do acabamento (o fosco é mais apagado; o perolizado puxa para o claro). */
export function corComAcabamento(cor: string, v?: VisualVeiculo): string {
  if (v?.acabamento === 'fosco') return misturar(cor, '#7d7a75', 0.24);
  if (v?.acabamento === 'perolizado') return misturar(cor, '#f4eef2', 0.1);
  return cor;
}

/** As peças do acabamento sobre a lataria (o reflexo, os flocos, o véu de pérola), recortadas pela própria lataria (`corpo`). */
export function brilhoDoAcabamento(p: Pick<PerfilCarro, 'x0' | 'x1' | 'cint' | 'capo'>, cor: string, v: VisualVeiculo | undefined, corpo: string): Peca[] {
  const ac = v?.acabamento;
  if (!ac || ac === 'fosco') return [];
  const { x0, x1, cint, capo } = p;
  const L = x1 - x0;
  const reflexo = (larg: number, tinta: string, marca?: string, dy = 0, dx = 0): Peca => ({ tipo: 'linha', d: `M${f(x0 + 12 + dx)} ${f(cint + 4 + dy)}Q${f(x0 + L * 0.5)} ${f(cint + 1 + dy)} ${f(x1 - 16 - dx)} ${f(Math.min(capo + 3, cint + 6) + dy)}`, larg, cor: tinta, ...(marca ? { marca } : {}) });
  if (ac === 'acetinado') return [{ tipo: 'massa', d: corpo, cor: '#ffffff', opacidade: 0.08, semVolume: true, marca: 'acabamento-acetinado' }, reflexo(3.2, clarear(cor, 0.35))];
  if (ac === 'perolizado') return [{ tipo: 'massa', d: corpo, cor: '#f6e6f0', opacidade: 0.17, semVolume: true, marca: 'acabamento-perolizado' }, reflexo(2.4, '#f3dcec'), reflexo(1.2, '#d3eef2', undefined, 4, 8)];
  // Metálico: o reflexo nítido na linha de cintura e os flocos.
  const flocos = [0.18, 0.31, 0.47, 0.6, 0.74, 0.86].map((t, k) => `M${f(x0 + L * t)} ${f(cint + 7 + (k % 3) * 3)}h0.01`).join('');
  return [reflexo(1.6, BRANCO, 'acabamento-metalico'), { tipo: 'linha', d: flocos, larg: 1.8, cor: clarear(cor, 0.7), marca: 'flocos', fino: true }];
}

/** O que é do modelo (aletas, asa, cromados, tomadas, estepe, faixas de fábrica) e o que a pessoa pôs (faixas, aerofólio). */
export function extrasDoCarro(p: PerfilCarro, cor: string, v?: VisualVeiculo): Peca[] {
  const e = p.extras ?? {};
  const { x0, x1, r, eT, eD, solo, cint, teto, tras } = p;
  const R = r + 3;
  const out: Peca[] = [];
  if (e.aletas) out.push({ tipo: 'massa', d: `M${x0} ${f(tras + 2)}L${f(x0 + 1)} ${f(tras - e.aletas)}L${f(x0 + 40)} ${f(tras - 1)}Z`, cor, marca: 'aleta' });
  const asa = v?.aerofolio ? (e.asa ?? 'alta') : e.asa;
  if (asa === 'ducktail') out.push({ tipo: 'massa', d: `M${f(x0 + 1)} ${f(tras + 1)}L${f(x0 + 3)} ${f(tras - 7)}L${f(x0 + 28)} ${f(tras - 4)}L${f(x0 + 30)} ${f(tras + 1)}Z`, cor, marca: 'asa' });
  else if (asa === 'baixa') out.push({ tipo: 'massa', d: p.traseira === 'hatch' ? ret(x0 + 3, teto + 12, 18, 3.4, 1.2) : ret(x0 + 1, tras - 4, 22, 3.6, 1.2), cor: escurecer(cor, 0.35), semVolume: true, marca: 'asa' });
  else if (asa === 'alta') {
    const y = (p.traseira === 'hatch' ? teto + 10 : tras) - 12;
    out.push({ tipo: 'metal', d: `${ret(x0 + 6, y + 3, 2.4, 11, 0.6)}${ret(x0 + 20, y + 3, 2.4, 11, 0.6)}`, cor: '#2b2826', marca: 'asa-suporte' },
      { tipo: 'massa', d: ret(x0, y, 30, 4, 1.4), cor: v?.aerofolio ? '#26272a' : escurecer(cor, 0.3), semVolume: true, marca: 'asa' });
  }
  if (e.cromado) out.push(
    { tipo: 'metal', d: ret(x0 - 1.5, solo - 10, 14, 4.2, 1.6), cor: '#dcd9d3', marca: 'cromado' },
    { tipo: 'metal', d: ret(x1 - 12.5, solo - 10, 14, 4.2, 1.6), cor: '#dcd9d3', marca: 'cromado' },
    { tipo: 'linha', d: `M${f(eT + R + 2)} ${f(cint + 7)}H${f(eD - R - 2)}`, larg: 1.1, cor: '#e8e6e1', marca: 'friso' }
  );
  if (e.tomadas) out.push(
    { tipo: 'massa', d: cantos([[eT + R + 2, cint + 4, 2], [eT + R + 26, cint + 2, 3], [eT + R + 22, solo - 8, 2], [eT + R + 2, solo - 9, 2]]), cor: escurecer(cor, 0.45), semVolume: true, marca: 'tomada' },
    { tipo: 'linha', d: `M${f(eT + R + 4)} ${f(cint + 8)}h18M${f(eT + R + 4)} ${f(cint + 12)}h17M${f(eT + R + 4)} ${f(cint + 16)}h16`, larg: 0.9, cor: escurecer(cor, 0.1), fino: true }
  );
  if (e.estepe) {
    const cy = (teto + solo) / 2 + 4;
    out.push({ tipo: 'massa', d: ret(x0 - 7, cy - 13, 8, 26, 3), cor: '#26231f', semVolume: true, marca: 'estepe' }, { tipo: 'metal', d: ret(x0 - 6, cy - 6, 3, 12, 1), cor: '#8d8983' });
  }
  const faixa = v?.faixa ?? e.faixa;
  if (faixa) {
    // A faixa corre na lateral, abaixo da linha de cintura; onde cruza a caixa de roda, interrompe-se na largura do arco.
    const y = cint + (solo - cint) * 0.42;
    const tinta = tintaDaFaixa(cor);
    const meia = (yy: number) => (yy > solo - R ? Math.sqrt(Math.max(0, R * R - (solo - yy) ** 2)) + 1.5 : 0);
    const trecho = (yy: number, w: number) => { const m = meia(yy); return { tipo: 'linha' as const, d: m ? `M${f(x0 + 3)} ${f(yy)}H${f(eT - m)}M${f(eT + m)} ${f(yy)}H${f(eD - m)}M${f(eD + m)} ${f(yy)}H${f(x1 - 14)}` : `M${f(x0 + 3)} ${f(yy)}H${f(x1 - 14)}`, larg: w, cor: tinta, marca: 'faixa' }; };
    if (faixa === 'dupla') out.push(trecho(y - 1.6, 1.8), trecho(y + 2.2, 1.8));
    else out.push(trecho(y + 1, 3));
  }
  return out;
}

/** A película: os vidros mais escuros (uma camada por cima de cada vidro). */
export const peliculaSobre = (vidros: Peca[]): Peca[] => vidros.filter((x): x is Extract<Peca, { tipo: 'vidro' }> => x.tipo === 'vidro').map(x => ({ tipo: 'massa' as const, d: x.d, cor: '#0f1114', opacidade: 0.5, semVolume: true, marca: 'pelicula' }));

/* ============================================================== na moto */

/** Onde fica o tanque (ou a carenagem) de cada forma: o reflexo do acabamento passa ali. */
const TANQUE: Partial<Record<FormaVeiculo, [number, number, number]>> = {
  street: [110, 150, 46], esportiva: [128, 172, 54], cruiser: [110, 148, 46], trail: [108, 150, 42], scooter: [54, 100, 62], cub: [68, 100, 70]
};

/** O acabamento e as rodas numa moto (as massas na cor dela; as rodas marcadas `roda`). */
export function visualNaMoto(pecas: Peca[], forma: FormaVeiculo, cor: string, v?: VisualVeiculo): Peca[] {
  if (!v) return pecas;
  const ac = v.acabamento;
  const out = pecas.map((x): Peca => {
    if (x.tipo === 'pneu' && v.roda) return { ...x, aro: v.roda.estilo === 'cravos' ? x.aro : v.roda.estilo, raios: v.roda.raios ?? x.raios, corAro: v.roda.cor, aroMaior: v.roda.aroMaior };
    if (x.tipo === 'massa' && x.cor === cor && ac) return { ...x, cor: corComAcabamento(cor, v), semVolume: ac === 'fosco' || ac === 'acetinado' ? true : x.semVolume, attrs: { ...x.attrs, 'data-acabamento': ac } };
    return x;
  });
  const t = TANQUE[forma];
  if (t && ac && ac !== 'fosco') {
    const [a, b, y] = t;
    out.push(ac === 'metalico' ? { tipo: 'linha', d: `M${a + 4} ${y}Q${(a + b) / 2} ${y - 6} ${b - 4} ${y - 2}`, larg: 1.6, cor: BRANCO, marca: 'acabamento-metalico' }
      : { tipo: 'massa', d: cantos([[a + 4, y - 2, 2], [b - 4, y - 6, 2], [b - 4, y - 1, 2], [a + 4, y + 3, 2]]), cor: ac === 'perolizado' ? '#f6e6f0' : clarear(cor, 0.4), opacidade: ac === 'perolizado' ? 0.45 : 0.25, semVolume: true, marca: `acabamento-${ac}` });
  }
  return out;
}
