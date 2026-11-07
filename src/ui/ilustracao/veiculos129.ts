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

/* VIDA 13: os carros (os de antes e os da 12.9) passaram a ser desenhados pelas medidas de verdade, em `carros13.ts`. */

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
export function extrasDoCarro(p: PerfilCarro, cor: string, v?: VisualVeiculo, roda?: { cy: number; R: number }): Peca[] {
  const e = p.extras ?? {};
  const { x0, x1, r, eT, eD, solo, cint, teto, tras } = p;
  const R = roda?.R ?? r + 3, cy = roda?.cy ?? solo;
  const out: Peca[] = [];
  if (e.aletas) out.push({ tipo: 'massa', d: `M${x0} ${f(tras + 2)}L${f(x0 + 1)} ${f(tras - e.aletas)}L${f(x0 + 40)} ${f(tras - 1)}Z`, cor, marca: 'aleta' });
  const asa = v?.aerofolio ? (e.asa ?? 'alta') : e.asa;
  if (asa === 'ducktail') out.push({ tipo: 'massa', d: `M${f(x0 + 1)} ${f(tras + 1)}L${f(x0 + 3)} ${f(tras - 7)}L${f(x0 + 28)} ${f(tras - 4)}L${f(x0 + 30)} ${f(tras + 1)}Z`, cor, marca: 'asa' });
  else if (asa === 'baixa') out.push({ tipo: 'massa', d: p.traseira === 'hatch' ? ret(x0 + 3, teto + 12, 18, 3.4, 1.2) : ret(x0 + 1, tras - 4, 22, 3.6, 1.2), cor: escurecer(cor, 0.35), semVolume: true, marca: 'asa' });
  else if (asa === 'alta') {
    // A asa alta fica pouco acima da traseira (nunca acima do teto do carro baixo).
    const y = p.traseira === 'hatch' ? teto - 2 : Math.max(tras - 12, teto + 3);
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
    const ce = (teto + solo) / 2 + 4;
    out.push({ tipo: 'massa', d: ret(x0 - 7, ce - 13, 8, 26, 3), cor: '#26231f', semVolume: true, marca: 'estepe' }, { tipo: 'metal', d: ret(x0 - 6, ce - 6, 3, 12, 1), cor: '#8d8983' });
  }
  const faixa = v?.faixa ?? e.faixa;
  if (faixa) {
    // A faixa corre na lateral, abaixo da linha de cintura; onde cruza a caixa de roda, interrompe-se na largura do arco.
    const y = cint + (solo - cint) * 0.42;
    const tinta = tintaDaFaixa(cor);
    const meia = (yy: number) => (Math.abs(yy - cy) < R ? Math.sqrt(Math.max(0, R * R - (yy - cy) ** 2)) + 1.5 : 0);
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
    // VIDA 12.9.1: o banco de couro na cor escolhida (banco, selim, garupa).
    if (x.tipo === 'massa' && v.banco && /^(banco|selim|garupa)/.test(x.marca ?? '')) return { ...x, cor: v.banco, attrs: { ...x.attrs, 'data-banco': v.banco } };
    return x;
  });
  // VIDA 13: o baú e os alforjes, o escape preparado (a ponteira curta de carbono).
  if (v.bagageiro === 'bau') out.push({ tipo: 'massa', d: cantos([[28, 30, 4], [56, 30, 4], [56, 50, 3], [30, 50, 3]]), cor: '#2b2826', marca: 'bau' }, { tipo: 'luz', d: ret(29, 42, 3, 4, 1), cor: '#c8372d' });
  if (v.bagageiro === 'alforjes') out.push({ tipo: 'massa', d: cantos([[36, 60, 4], [70, 60, 4], [68, 82, 6], [40, 84, 6]]), cor: '#5a3a26', marca: 'alforje' }, { tipo: 'linha', d: 'M44 60v10M62 60v10', larg: 1, cor: '#c9a23a', fino: true });
  if (v.escape) {
    // O escape preparado: o silenciador vira titânio azulado, com a boca polida na ponta de trás.
    let fim: [number, number] | undefined;
    for (let i = 0; i < out.length; i++) {
      const x = out[i];
      if (x.tipo !== 'metal' || !/^(escape|silenciador|megafone|escapamento|ponteira|panela|rabo)/.test(x.marca ?? '')) continue;
      out[i] = { ...x, cor: '#4a5a6e', attrs: { ...x.attrs, 'data-escape': 'esportivo' } };
      const nums = (x.d.match(/-?[\d.]+/g) ?? []).map(Number);
      for (let k = 0; k + 1 < nums.length; k += 2) if (nums[k] > 20 && nums[k + 1] > 20 && (!fim || nums[k] < fim[0])) fim = [nums[k], nums[k + 1]];
    }
    const [ex, ey] = fim ?? [60, 96];
    out.push({ tipo: 'metal', d: cantos([[ex - 2, ey - 3.6, 2], [ex + 4, ey - 3.6, 2], [ex + 4, ey + 3.6, 2], [ex - 2, ey + 3.6, 2]]), cor: '#b9c6d4', marca: 'ponteira-esportiva' });
  }
  const t = TANQUE[forma];
  // VIDA 12.9.1: o filete pintado à mão, contornando o tanque.
  if (t && v.filete) { const [a, b, y] = t; out.push({ tipo: 'linha', d: `M${a + 2} ${y + 3}Q${(a + b) / 2} ${y - 4} ${b - 2} ${y - 1}M${a + 4} ${y + 8}Q${(a + b) / 2} ${y + 3} ${b - 6} ${y + 5}`, larg: 1, cor: v.filete, marca: 'filete' }); }
  if (t && ac && ac !== 'fosco') {
    const [a, b, y] = t;
    out.push(ac === 'metalico' ? { tipo: 'linha', d: `M${a + 4} ${y}Q${(a + b) / 2} ${y - 6} ${b - 4} ${y - 2}`, larg: 1.6, cor: BRANCO, marca: 'acabamento-metalico' }
      : { tipo: 'massa', d: cantos([[a + 4, y - 2, 2], [b - 4, y - 6, 2], [b - 4, y - 1, 2], [a + 4, y + 3, 2]]), cor: ac === 'perolizado' ? '#f6e6f0' : clarear(cor, 0.4), opacidade: ac === 'perolizado' ? 0.45 : 0.25, semVolume: true, marca: `acabamento-${ac}` });
  }
  return out;
}
