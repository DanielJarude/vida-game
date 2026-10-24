/**
 * REWORK 11 · ESP-11.2 — os ATRIBUTOS da posição (futebol) e da função (basquete).
 *
 * A técnica continua sendo UM número (`frentes.habilidade`): é o que o treino, a base e o mercado sempre leram. Os
 * atributos são o PERFIL dessa técnica — o goleiro de reflexo bom e saída ruim, o atacante que finaliza bem e corre
 * pouco. Cada atributo é a técnica + um traço de nascença (estável, da semente da vida) + o que a carreira fez dele
 * (`CarreiraEsportiva.atributos`, o desvio guardado: o treino da função soma; o tempo, depois do auge, tira dos
 * atributos do corpo e dá aos da leitura de jogo). Saves antigos: sem desvio guardado, o atributo é a técnica ± o traço.
 *
 * Nada aqui é enfeite: a temporada (`esporte.fecharTemporada`) lê o perfil na NOTA (o peso de cada atributo na
 * posição) e na PRODUÇÃO — o reflexo e o posicionamento do goleiro nos gols que o time sofre com ele em campo, a
 * marcação e a antecipação nos desarmes, o jogo aéreo nos gols de cabeça, o passe e a visão nas assistências, a
 * finalização e a movimentação nos gols, a resistência e a velocidade nos minutos e no que o corpo ainda faz.
 */

import { clamp, hashMisturado } from '../rng';
import type { CarreiraEsportiva, Posicao, Vida } from '../tipos';

export type GrupoDePosicao = 'goleiro' | 'defensor' | 'meio' | 'atacante';
export const GRUPO_DA_POSICAO: Record<Posicao, GrupoDePosicao> = { goleiro: 'goleiro', zagueiro: 'defensor', lateral: 'defensor', volante: 'meio', meia: 'meio', ponta: 'atacante', atacante: 'atacante' };

export type AtributoId =
  | 'reflexos' | 'posicionamento' | 'saidas' | 'pes'
  | 'marcacao' | 'antecipacao' | 'aereo'
  | 'passe' | 'visao' | 'resistencia'
  | 'finalizacao' | 'movimentacao' | 'velocidade'
  | 'arremesso' | 'rebote' | 'conducao';

export const NOME_ATRIBUTO: Record<AtributoId, string> = {
  reflexos: 'reflexos', posicionamento: 'posicionamento', saidas: 'saídas do gol', pes: 'jogo com os pés',
  marcacao: 'marcação', antecipacao: 'antecipação', aereo: 'jogo aéreo',
  passe: 'passe', visao: 'visão de jogo', resistencia: 'resistência',
  finalizacao: 'finalização', movimentacao: 'movimentação', velocidade: 'velocidade',
  arremesso: 'arremesso', rebote: 'rebote', conducao: 'condução de bola'
};

/** Os atributos de cada grupo, com o peso de cada um NA NOTA da temporada (somam 1). */
export const ATRIBUTOS_DO_GRUPO: Record<GrupoDePosicao, [AtributoId, number][]> = {
  goleiro: [['reflexos', 0.35], ['posicionamento', 0.3], ['saidas', 0.2], ['pes', 0.15]],
  defensor: [['marcacao', 0.4], ['antecipacao', 0.35], ['aereo', 0.25]],
  meio: [['passe', 0.4], ['visao', 0.35], ['resistencia', 0.25]],
  atacante: [['finalizacao', 0.45], ['movimentacao', 0.3], ['velocidade', 0.25]]
};
/** Basquete (o equivalente leve): os mesmos três atributos, com o peso que a função dá a cada um. */
export const ATRIBUTOS_BASQUETE: Record<'armador' | 'ala' | 'pivo', [AtributoId, number][]> = {
  armador: [['conducao', 0.35], ['passe', 0.4], ['arremesso', 0.25]],
  ala: [['arremesso', 0.5], ['conducao', 0.25], ['rebote', 0.25]],
  pivo: [['rebote', 0.5], ['arremesso', 0.25], ['passe', 0.25]]
};

/** Os atributos do CORPO (o tempo cobra depois do auge) e os da LEITURA (o tempo ensina). */
const DO_CORPO = new Set<AtributoId>(['reflexos', 'velocidade', 'resistencia', 'saidas', 'aereo']);
const DA_LEITURA = new Set<AtributoId>(['posicionamento', 'antecipacao', 'visao', 'movimentacao']);

/** O traço de nascença de um atributo (−4..+4, estável pela semente da vida). */
export const tracoDoAtributo = (v: Vida, id: AtributoId) => Math.round((hashMisturado(`${v.id}:atributo:${id}`) * 8 - 4) * 10) / 10;

/** Os atributos que valem para esta carreira agora (a posição no futebol; a função no basquete), com o peso de cada um. */
export function atributosDaCarreira(e: CarreiraEsportiva, posicao: Posicao | undefined, funcao?: 'armador' | 'ala' | 'pivo'): [AtributoId, number][] {
  if (e.modalidade === 'futebol' && posicao) return ATRIBUTOS_DO_GRUPO[GRUPO_DA_POSICAO[posicao]];
  if (e.modalidade === 'basquete' && funcao) return ATRIBUTOS_BASQUETE[funcao];
  return [];
}

/** O valor de um atributo (0..100): a técnica de hoje + o traço + o que a carreira guardou. */
export function valorDoAtributo(v: Vida, e: CarreiraEsportiva, tecnica: number, id: AtributoId): number {
  return Math.round(clamp(tecnica + tracoDoAtributo(v, id) + (e.atributos?.[id] ?? 0)) * 10) / 10;
}

/** O perfil inteiro (para a temporada e para a tela). */
export function perfilDeAtributos(v: Vida, e: CarreiraEsportiva, tecnica: number, posicao: Posicao | undefined, funcao?: 'armador' | 'ala' | 'pivo'): { id: AtributoId; valor: number; peso: number }[] {
  return atributosDaCarreira(e, posicao, funcao).map(([id, peso]) => ({ id, valor: valorDoAtributo(v, e, tecnica, id), peso }));
}

/** Quanto o perfil soma à nota (na escala da técnica: 4 pontos de atributo acima da técnica, em todos, = +1 na nota). */
export function efeitoNaNota(perfil: { valor: number; peso: number }[], tecnica: number): number {
  return perfil.reduce((s, x) => s + (x.valor - tecnica) * x.peso, 0) / 4;
}

/** O desvio de um atributo em relação à técnica (para a produção: + acima, − abaixo). */
export const desvio = (perfil: { id: AtributoId; valor: number }[], id: AtributoId, tecnica: number) => (perfil.find(x => x.id === id)?.valor ?? tecnica) - tecnica;

/** Soma ao desvio guardado (o treino, o tempo), dentro de ±14 em volta da técnica. */
export function mexerNoAtributo(e: CarreiraEsportiva, id: AtributoId, delta: number): void {
  const a = (e.atributos ??= {});
  a[id] = Math.round(clamp((a[id] ?? 0) + delta, -14, 14) * 10) / 10;
}

/**
 * O treino extra da função (o mesmo verbo de `noOficio`): o que ele treina é o que sobe. `tipo`: o treino técnico da
 * função, o tático (a leitura) ou o físico (o corpo).
 */
export function treinarAtributos(e: CarreiraEsportiva, posicao: Posicao | undefined, funcao: 'armador' | 'ala' | 'pivo' | undefined, tipo: 'tecnico' | 'tatico' | 'fisico'): AtributoId[] {
  const lista = atributosDaCarreira(e, posicao, funcao).map(([id]) => id);
  const alvos = tipo === 'tatico' ? lista.filter(id => DA_LEITURA.has(id) || id === 'passe') : tipo === 'fisico' ? lista.filter(id => DO_CORPO.has(id)) : lista.slice(0, Math.min(3, lista.length));
  for (const id of alvos) mexerNoAtributo(e, id, tipo === 'tecnico' ? 2 : 1.5);
  return alvos;
}

/**
 * O ano no perfil: o que foi treinado e não é mantido esfria um pouco; depois do auge, o corpo perde (reflexo,
 * velocidade, fôlego) e a leitura ganha (posicionamento, antecipação, visão) — o veterano que joga com a cabeça.
 */
export function envelhecerAtributos(e: CarreiraEsportiva, idade: number, auge: number): void {
  const a = e.atributos;
  for (const id of Object.keys(a ?? {}) as AtributoId[]) a![id] = Math.round(a![id]! * 0.9 * 10) / 10;
  if (idade > auge) for (const id of DO_CORPO) mexerNoAtributo(e, id, -0.5);
  if (idade >= 24 && idade <= auge + 4) for (const id of DA_LEITURA) mexerNoAtributo(e, id, 0.4);
}
