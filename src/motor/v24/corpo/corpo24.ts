/**
 * VIDA 24 — O CORPO QUE VIVE. Três dimensões separadas:
 *
 *   A. a CONSTITUIÇÃO de nascença (`Visual.corpo23`, os doze eixos da VIDA 23) — agora lida como PREDISPOSIÇÃO: a
 *      estrutura (estatura, ossos, ombros, quadril, peito, pernas) é herdada e só aparece inteira com o crescimento; os
 *      eixos de DISTRIBUIÇÃO (cintura, barriga, coxas, braços, panturrilhas) dizem ONDE o corpo acumula gordura, e
 *      pesam mais quanto mais gordura houver; o eixo do músculo é a FACILIDADE de ganhar músculo (velocidade e teto).
 *      Escolhida (ou herdada, ou ao acaso) antes de nascer; depois do nascimento, não se edita;
 *   B. a CONDIÇÃO atual (`Corpo.composicao24`): a gordura (`g`) e o músculo (`m`), contínuos, e o músculo de cada região
 *      treinada (`r`). Anda um pouco por ano, na direção do que a vida pede — o treino de força e o aeróbico, o
 *      sedentarismo, a alimentação, a idade, a saúde, a predisposição e o objetivo escolhido. Nada muda de uma vez;
 *   C. a aparência (marcas, pelos, cabelo, joias) — personalização, à parte (`v23`, `estilo`).
 *
 * Folha (só tipos importados): o motor (`sistemas/pessoa`, `silhueta`), o save, as ações e as telas leem daqui.
 */
import type { Constituicao } from '../../v23/corpo/corpo23';

/* ------------------------------------------------------------------ a condição */

export type Regiao24 = 'bracos' | 'ombros' | 'peito' | 'costas' | 'abdomen' | 'pernas' | 'gluteos';
export const REGIOES24: Record<Regiao24, string> = {
  bracos: 'braços', ombros: 'ombros', peito: 'peitoral', costas: 'costas', abdomen: 'abdômen', pernas: 'pernas', gluteos: 'glúteos'
};
export interface Composicao24 {
  /** Gordura corporal, em desvios da média (−1,8 = muito magro; 0 = a média; +3 = obesidade). */
  g: number;
  /** Massa muscular (−0,8 = pouca; 0 = a de quem não treina; 2,6 = muito musculoso). */
  m: number;
  /** O músculo a mais de cada região treinada com foco (0 a 1,2). */
  r?: Partial<Record<Regiao24, number>>;
  /** Quando foi calculada (o mês do jogo). */
  t: number;
  /** A evolução: um ponto por ano (t, g, m), os últimos doze. */
  h?: [number, number, number][];
}

export type TipoDeCorpo24 = 'magro' | 'mediano' | 'atletico' | 'musculoso' | 'acima_do_peso';
/**
 * As âncoras: a composição de cada uma das cinco condições de antes. A figura desenha EXATAMENTE o corpo de antes nessas
 * composições — o save antigo começa onde estava e só então passa a evoluir.
 */
export const ANCORAS24: Record<TipoDeCorpo24, { g: number; m: number }> = {
  magro: { g: -1.5, m: 0 }, mediano: { g: 0, m: 0 }, atletico: { g: -0.5, m: 1 }, musculoso: { g: -0.3, m: 2.2 }, acima_do_peso: { g: 2.2, m: 0 }
};
/** A condição (com nome) de uma composição — o que o resto do jogo lê como "tipo de corpo". */
export function tipoDaComposicao(c: { g: number; m: number }): TipoDeCorpo24 {
  if (c.g >= 1.2) return 'acima_do_peso';
  if (c.m >= 1.6 && c.g < 0.9) return 'musculoso';
  if (c.m >= 0.7 && c.g < 0.4) return 'atletico';
  if (c.g <= -1) return 'magro';
  return 'mediano';
}

/** Leituras da composição (para a tela): a gordura, o músculo e a definição (o músculo que aparece). */
export function definicao24(c: { g: number; m: number }): number {
  return Math.max(0, Math.min(2, c.m * (c.g <= 0 ? 1 : Math.max(0, 1 - c.g * 0.8))));
}
const faixa = (x: number, cortes: number[], nomes: string[]) => nomes[cortes.filter(k => x >= k).length];
export const leituraDaGordura = (g: number) => faixa(g, [-1.2, -0.5, 0.45, 1.2, 2.5], ['muito baixa', 'baixa', 'na média', 'acima da média', 'alta', 'muito alta']);
export const leituraDoMusculo = (m: number) => faixa(m, [-0.3, 0.35, 0.9, 1.6, 2.2], ['pouca', 'a de quem não treina', 'um pouco acima', 'treinada', 'muito treinada', 'de fisiculturista']);
export const leituraDaDefinicao = (d: number) => faixa(d, [0.3, 0.9, 1.5], ['nenhuma', 'leve', 'visível', 'marcada']);

/* ------------------------------------------------------------------ os planos: objetivo e alimentação */

export type Objetivo24 = 'massa' | 'definicao' | 'forca' | 'condicionamento' | 'perder_gordura' | 'ganhar_peso' | 'resistencia' | 'regiao';
export const OBJETIVOS24: Record<Objetivo24, { nome: string; pede: string; nota: string }> = {
  massa: { nome: 'Ganhar massa muscular', pede: 'treino de força (academia, luta)', nota: 'O treino vira hipertrofia: o músculo sobe mais rápido. Comer mais ajuda.' },
  definicao: { nome: 'Ganhar definição', pede: 'treino (de força ou aeróbico)', nota: 'O treino puxa a gordura para baixo e segura o músculo: a definição aparece quando a gordura baixa.' },
  forca: { nome: 'Aumentar a força', pede: 'treino de força', nota: 'Cargas mais pesadas: um pouco mais de músculo e de condicionamento.' },
  condicionamento: { nome: 'Melhorar o condicionamento', pede: 'atividade aeróbica (corrida, esporte, natação)', nota: 'O fôlego sobe mais com o mesmo treino.' },
  perder_gordura: { nome: 'Reduzir gordura', pede: 'treino ou comer menos', nota: 'A gordura desce aos poucos — mais rápido com treino e com a alimentação em déficit.' },
  ganhar_peso: { nome: 'Ganhar peso', pede: 'comer mais', nota: 'Comer mais faz o peso subir; com treino de força, parte vira músculo.' },
  resistencia: { nome: 'Melhorar a resistência', pede: 'atividade aeróbica', nota: 'Treinos longos: o condicionamento sobe e a gordura desce um pouco.' },
  regiao: { nome: 'Desenvolver uma região', pede: 'treino de força', nota: 'O treino de força com foco numa região faz ela crescer mais que o resto.' }
};
export const OBJETIVOS_LISTA = Object.keys(OBJETIVOS24) as Objetivo24[];

export type Alimentacao24 = 'habitual' | 'equilibrada' | 'superavit' | 'deficit';
export const ALIMENTACOES24: Record<Alimentacao24, { nome: string; nota: string }> = {
  habitual: { nome: 'Como sempre', nota: 'O de casa, sem pensar muito.' },
  equilibrada: { nome: 'Equilibrada', nota: 'Comida de verdade, menos besteira: a gordura desce um pouco.' },
  superavit: { nome: 'Comer mais', nota: 'Mais comida que o corpo gasta: o peso sobe (com treino de força, parte vira músculo).' },
  deficit: { nome: 'Comer menos', nota: 'Menos comida que o corpo gasta: a gordura desce, a fome e o humor cobram, e sem treino perde-se músculo.' }
};

export interface Plano24 { objetivo?: Objetivo24; regiao?: Regiao24; alimentacao?: Alimentacao24; desde?: number }

/* ------------------------------------------------------------------ a evolução de um ano */

export interface Entrada24 {
  idade: number;
  /** A carga do treino de força e do aeróbico da semana (a mesma conta do condicionamento: academia = 1). */
  forca: number; cardio: number;
  sedentario: boolean; bebeMuito: boolean;
  /** O condicionamento (`Corpo.forma`, 0..100). */
  forma: number;
  /** A constituição de nascença (−2..+2 por eixo). */
  c: Constituicao;
  plano?: Plano24;
  /** A bariátrica (sem reganho, depois dos primeiros meses). */
  bariatrica?: boolean;
  /** Uma doença que pesa no corpo (câncer, depressão sem tratamento). */
  doente?: boolean;
}
export interface Fator24 { texto: string; g: number; m: number }

/** Retornos decrescentes (o dobro do treino não dobra o corpo). */
const rende = (x: number) => 1.6 * (1 - Math.exp(-Math.max(0, x) / 1.1));
const lim = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

/** A tendência de nascença a acumular gordura (os eixos de distribuição: quem acumula muito em algum lugar, acumula). */
export const tendenciaDeGordura = (c: Constituicao) => 0.15 * (c.barriga + c.cintura) + 0.1 * (c.coxas + c.bracos * 0.5);

/**
 * O que puxa o corpo neste ano: a soma dos `g` é para onde a gordura vai; a dos `m`, o músculo. É a mesma lista que a
 * tela mostra ("o que está mudando o seu corpo"), então nada aparece ali que não pese.
 */
export function fatores24(e: Entrada24): Fator24[] {
  const i = e.idade, out: Fator24[] = [];
  const crianca = i < 13;
  const kIdade = crianca ? 0.6 : 1;
  const F = rende(e.forca), C = rende(e.cardio);
  const obj = e.plano?.objetivo;
  const treina = e.forca + e.cardio >= 0.3;
  const comida = e.plano?.alimentacao ?? 'habitual';
  const tend = tendenciaDeGordura(e.c);
  if (Math.abs(tend) >= 0.1) out.push({ texto: tend > 0 ? 'a tendência de nascença a acumular gordura' : 'a tendência de nascença a ser mais seco', g: tend * kIdade, m: 0 });
  if (e.c.musculo) out.push({ texto: e.c.musculo > 0 ? 'a facilidade de nascença para ganhar músculo' : 'a dificuldade de nascença para ganhar músculo', g: 0, m: 0.12 * e.c.musculo * (crianca ? 0.3 : 1) });
  if (F > 0) out.push({ texto: 'o treino de força', g: -0.3 * F * kIdade, m: F * (1.6 + 0.15 * e.c.musculo) * (crianca ? 0.2 : i < 16 ? 0.6 : 1) });
  if (C > 0) out.push({ texto: 'a atividade aeróbica (esporte, corrida)', g: -0.55 * C * kIdade, m: 0.3 * C * (crianca ? 0.4 : 1) });
  if (e.sedentario) out.push({ texto: 'o sedentarismo', g: 0.8 * kIdade, m: -0.2 });
  if (e.forma < 35 && i >= 12) out.push({ texto: 'o corpo parado (pouco condicionamento)', g: lim((35 - e.forma) / 30, 0, 0.6), m: 0 });
  if (e.bebeMuito && i >= 14) out.push({ texto: 'a bebida', g: 0.4, m: -0.1 });
  if (i >= 13) {
    if (comida === 'deficit') out.push({ texto: 'comer menos', g: -0.8, m: F > 0.3 ? -0.05 : -0.2 });
    else if (comida === 'superavit') out.push({ texto: 'comer mais', g: 0.7, m: F > 0.3 ? 0.18 : 0 });
    else if (comida === 'equilibrada') out.push({ texto: 'a alimentação equilibrada', g: -0.3, m: 0 });
  }
  // O objetivo direciona o que já se faz: sem a atividade que ele pede, não pesa.
  if (obj === 'massa' && e.forca >= 0.3) out.push({ texto: 'o treino focado em hipertrofia', g: 0.1, m: 0.3 });
  if (obj === 'forca' && e.forca >= 0.3) out.push({ texto: 'o treino focado em força', g: 0, m: 0.15 });
  if (obj === 'definicao' && treina) out.push({ texto: 'o treino focado em definição', g: -0.25, m: 0.05 });
  if (obj === 'perder_gordura' && treina) out.push({ texto: 'o treino focado em perder gordura', g: -0.15, m: 0 });
  if ((obj === 'condicionamento' || obj === 'resistencia') && e.cardio >= 0.3) out.push({ texto: 'os treinos longos', g: -0.1, m: 0 });
  if (obj === 'ganhar_peso' && comida === 'superavit') out.push({ texto: 'o foco em ganhar peso', g: 0.2, m: 0.1 });
  // A idade: o metabolismo desacelera (dos 30 aos 65) e o músculo vai embora devagar (depois dos 45).
  if (i > 30) out.push({ texto: 'o metabolismo mais lento com a idade', g: lim((i - 30) * 0.015, 0, 0.5), m: 0 });
  if (i > 45) out.push({ texto: 'a perda de músculo com a idade', g: 0, m: -lim((i - 45) * 0.02, 0, 0.7) });
  if (e.bariatrica) out.push({ texto: 'a bariátrica', g: -1.6, m: -0.1 });
  if (e.doente) out.push({ texto: 'a doença', g: -0.3, m: -0.3 });
  return out.filter(f => Math.abs(f.g) >= 0.04 || Math.abs(f.m) >= 0.04);
}

/** Para onde o corpo vai, mantendo a vida de agora (o alvo, não o próximo ano). */
export function alvo24(e: Entrada24): { g: number; m: number } {
  const fs = fatores24(e);
  return { g: lim(fs.reduce((s, f) => s + f.g, 0), -1.8, 3), m: lim(fs.reduce((s, f) => s + f.m, 0), -0.8, 2.6) };
}

/**
 * Um ano: a composição anda uma parte do caminho até o alvo — a gordura ~30% por ano (no máximo 0,6), o músculo ~35%
 * para cima (no máximo 0,5; mais rápido com a predisposição, mais lento depois dos 50) e ~30% para baixo (quem para de
 * treinar perde mais rápido do que ganhou). As regiões treinadas com foco crescem devagar e somem sem treino.
 */
export function umAno24(atual: Composicao24, e: Entrada24, t: number): Composicao24 {
  const a = alvo24(e);
  const dg = lim((a.g - atual.g) * 0.3, -0.6, 0.6);
  const sobe = a.m > atual.m;
  const vel = sobe ? 0.35 * (1 + 0.12 * e.c.musculo) * (e.idade > 50 ? 0.7 : 1) : 0.3;
  const dm = lim((a.m - atual.m) * vel, -0.5, 0.5);
  const r: Partial<Record<Regiao24, number>> = { ...(atual.r ?? {}) };
  const foco = e.plano?.objetivo === 'regiao' && e.forca >= 0.3 && e.idade >= 14 ? e.plano.regiao : undefined;
  for (const k of Object.keys(REGIOES24) as Regiao24[]) {
    const x = r[k] ?? 0;
    const n = k === foco ? Math.min(1.2, x + 0.25 * (1 + 0.1 * e.c.musculo)) : e.forca >= 0.3 ? Math.max(0, x - 0.05) : Math.max(0, x - 0.2);
    if (n > 0.01) r[k] = r2(n); else delete r[k];
  }
  const h = [...(atual.h ?? []), [t, r2(atual.g + dg), r2(atual.m + dm)] as [number, number, number]].slice(-12);
  return { g: r2(lim(atual.g + dg, -1.8, 3)), m: r2(lim(atual.m + dm, -0.8, 2.6)), ...(Object.keys(r).length ? { r } : {}), t, h };
}

/** A projeção: como o corpo estaria em `anos` anos mantendo a vida de agora (a idade anda). Não grava nada. */
export function projetar24(atual: Composicao24, e: Entrada24, anos: number): Composicao24 {
  let c = atual;
  for (let k = 1; k <= anos; k++) c = umAno24(c, { ...e, idade: e.idade + k }, atual.t + k * 12);
  return c;
}

/** A composição de partida de quem ainda não tinha uma (save antigo): a da condição de agora, com a predisposição do músculo. */
export function composicaoInicial24(tipo: TipoDeCorpo24, c: Constituicao, t: number): Composicao24 {
  const a = ANCORAS24[tipo];
  return { g: a.g, m: r2(lim(a.m + 0.2 * c.musculo, -0.8, 2.6)), t };
}

export const composicaoValida = (x: unknown): x is Composicao24 => {
  const o = x as Composicao24;
  return !!o && typeof o === 'object' && Number.isFinite(o.g) && Number.isFinite(o.m) && Number.isFinite(o.t);
};

/* ------------------------------------------------------------------ a constituição como predisposição */

/** O papel de cada eixo: estrutura (herdada, fixa depois do crescimento), distribuição (onde acumula) ou músculo (facilidade). */
export const PAPEL24 = {
  estatura: 'estrutura', estrutura: 'estrutura', ombros: 'estrutura', quadril: 'estrutura', peito: 'estrutura', pernas: 'estrutura',
  cintura: 'distribuicao', barriga: 'distribuicao', coxas: 'distribuicao', bracos: 'distribuicao', panturrilhas: 'distribuicao', musculo: 'musculo'
} as const;
/** Como a tela de nascimento fala de cada eixo (como tendência, não como corpo pronto). */
export const PREDISPOSICOES24: Record<keyof typeof PAPEL24, { nome: string; niveis: [string, string, string, string, string] }> = {
  estatura: { nome: 'Altura', niveis: ['bem baixa', 'baixa', 'média', 'alta', 'bem alta'] },
  estrutura: { nome: 'Estrutura óssea', niveis: ['bem fina', 'fina', 'média', 'larga', 'bem larga'] },
  pernas: { nome: 'Comprimento das pernas', niveis: ['bem curtas', 'curtas', 'proporcionais', 'longas', 'bem longas'] },
  ombros: { nome: 'Ombros', niveis: ['bem estreitos', 'estreitos', 'médios', 'largos', 'bem largos'] },
  peito: { nome: 'Peito e tórax', niveis: ['bem pouco volume', 'pouco volume', 'médio', 'volumoso', 'bem volumoso'] },
  quadril: { nome: 'Quadril (bacia)', niveis: ['bem estreito', 'estreito', 'médio', 'largo', 'bem largo'] },
  cintura: { nome: 'Cintura e flancos', niveis: ['quase não acumula', 'acumula pouco', 'na média', 'acumula mais', 'acumula bem mais'] },
  barriga: { nome: 'Barriga', niveis: ['quase não acumula', 'acumula pouco', 'na média', 'acumula mais', 'acumula bem mais'] },
  coxas: { nome: 'Coxas e quadris', niveis: ['quase não acumula', 'acumula pouco', 'na média', 'acumula mais', 'acumula bem mais'] },
  bracos: { nome: 'Braços', niveis: ['quase não acumula', 'acumula pouco', 'na média', 'acumula mais', 'acumula bem mais'] },
  panturrilhas: { nome: 'Panturrilhas', niveis: ['bem finas', 'finas', 'médias', 'grossas', 'bem grossas'] },
  musculo: { nome: 'Facilidade para ganhar músculo', niveis: ['muito pouca', 'pouca', 'média', 'boa', 'muito boa'] }
};
export const GRUPOS24: { id: 'estrutura' | 'distribuicao' | 'musculo'; nome: string; nota: string }[] = [
  { id: 'estrutura', nome: 'Estrutura e crescimento', nota: 'Herdada: aparece com o crescimento e não muda depois de adulto.' },
  { id: 'distribuicao', nome: 'Onde o corpo acumula', nota: 'Onde a gordura tende a ir quando vem — a quantidade depende da vida.' },
  { id: 'musculo', nome: 'Músculo', nota: 'Quanto e quão rápido o treino vira músculo. Sem treino, não aparece.' }
];

/** As tendências que mais se destacam, em palavras de predisposição ("barriga: acumula mais"), não de corpo pronto. */
export function descreverPredisposicoes24(c: Constituicao, max = 4): string {
  const eixos = (Object.keys(PREDISPOSICOES24) as (keyof typeof PREDISPOSICOES24)[]).filter(e => c[e]).sort((a, b) => Math.abs(c[b]) - Math.abs(c[a])).slice(0, max);
  return eixos.length ? eixos.map(e => `${PREDISPOSICOES24[e].nome.toLowerCase()}: ${PREDISPOSICOES24[e].niveis[c[e] + 2]}`).join(' · ') : 'tendências médias';
}

/** Como a constituição chega: dos pais (com variação), escolhida, ou ao acaso (sem olhar os pais). */
export type ModoDoCorpo24 = 'heranca' | 'escolher' | 'acaso';

/** A altura adulta: a constituição de nascença (quando a vida nasceu com ela escolhida/herdada) desloca a média. */
export const desvioDeAltura24 = (zSemente: number, eixo: number) => zSemente * 0.55 + eixo * 0.8;

/* ------------------------------------------------------------------ os pelos */

/** Quanto dos pelos adultos já apareceu nesta idade (nada antes dos 11; inteiro aos 19). */
export const pelosDaIdade24 = (i: number) => lim((i - 11) / 8, 0, 1);

export type RegiaoDePelo24 = 'bracos' | 'pernas' | 'peito' | 'abdomen' | 'costas';
export const REGIOES_DE_PELO24: Record<RegiaoDePelo24, string> = { bracos: 'Braços', pernas: 'Pernas', peito: 'Peito', abdomen: 'Abdômen', costas: 'Costas' };
export type MetodoDePelo24 = 'aparar' | 'lamina' | 'cera' | 'laser';
export const METODOS24: Record<MetodoDePelo24, { nome: string; nota: string; custo: number; anual: boolean; idade: number }> = {
  aparar: { nome: 'Aparar', nota: 'Máquina em casa: os pelos ficam curtos e ralos (de graça).', custo: 0, anual: false, idade: 13 },
  lamina: { nome: 'Raspar (lâmina)', nota: 'Some na hora e volta em dias: vira hábito (de graça).', custo: 0, anual: false, idade: 13 },
  cera: { nome: 'Cera', nota: 'Dura semanas; o salão cobra por ano de manutenção.', custo: 900, anual: true, idade: 14 },
  laser: { nome: 'Laser', nota: 'Um ano de sessões; depois, quase nada volta (pago uma vez).', custo: 4200, anual: false, idade: 18 }
};
export interface CuidadoDosPelos24 { metodo: MetodoDePelo24; regioes: RegiaoDePelo24[]; desde: number }
/** O que se vê de cada região: 1 = os pelos naturais; 0,45 = aparados; 0 = removidos. O laser termina depois de um ano. */
export function fatorDosPelos24(cuid: CuidadoDosPelos24 | undefined, laser: RegiaoDePelo24[] | undefined, reg: RegiaoDePelo24, t: number): number {
  if (laser?.includes(reg)) return 0.08;
  if (!cuid || !cuid.regioes.includes(reg)) return 1;
  if (cuid.metodo === 'aparar') return 0.45;
  if (cuid.metodo === 'laser') return t - cuid.desde >= 12 ? 0.08 : 0.4;
  return 0;
}
