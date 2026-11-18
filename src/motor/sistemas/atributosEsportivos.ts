/**
 * REWORK 11 · ESP-11.2 — os ATRIBUTOS da posição (futebol) e da função (basquete). VIDA 25: todas as modalidades.
 * VIDA 26: conjuntos completos por modalidade e por posição/função/prova, em QUATRO naturezas, cada uma com a sua fonte:
 *
 *   técnicos  a técnica (`frentes.habilidade`) + o traço de nascença + o que a carreira fez dele (o desvio guardado);
 *   táticos   o mesmo, menos a falta de leitura de quem ainda é muito novo (a leitura de jogo vem com os anos);
 *   físicos   o mesmo + o CORPO: a distância das capacidades físicas (`capacidadesFisicas`, que leem constituição,
 *             composição, condicionamento, idade e maturação) até a régua do atleta adulto médio. O jovem de 12 anos não
 *             tem a força do adulto, por mais técnica que tenha; o pivô alto tem alcance; quem engordou perde arrancada;
 *   mentais   o mesmo + a PESSOA: os traços de personalidade (disciplina, coragem, impulsividade, empatia...), o estresse
 *             do momento e a maturidade (a idade e os anos competindo).
 *
 * A técnica continua sendo o número que o treino, a base e o mercado leem. Os atributos são o PERFIL dela, e nada aqui é
 * enfeite: a temporada (`esporte.fecharTemporada`) lê o perfil na NOTA (o peso de cada atributo na posição, e a
 * deficiência grave num atributo que a posição exige pesa a mais) e na PRODUÇÃO (gols, assistências, desarmes); o treino
 * extra sobe os do grupo treinado; o tempo tira do corpo e dá à leitura. O que não tem efeito não entra na lista.
 */

import { clamp, hashMisturado } from '../rng';
import type { CarreiraEsportiva, Posicao, Vida } from '../tipos';
import { idade } from '../nucleo';
import { capacidadesDe } from './capacidadesFisicas';
import { REFERENCIA26, type Capacidade26 } from '../v26/corpo/capacidades26';
import { funcaoVolei, provaDe } from './provas';
import { funcaoBasquete } from './modalidades';
import { funcaoFutsalPorSorteio } from '../dados14/esportes/futsal';
import { ATRIBUTOS_ATLETISMO, ATRIBUTOS_BASQUETE, ATRIBUTOS_DA_MODALIDADE, ATRIBUTOS_DA_POSICAO, ATRIBUTOS_FUTSAL, ATRIBUTOS_VOLEI, CORPO_DO_ATRIBUTO, FISICOS26, GRUPO_DO_ATRIBUTO, grupoDaProva, MENTE_DO_ATRIBUTO, TATICOS26, type AtributoId, type GrupoDePosicao, type Lista } from '../v26/esporte/atributos26';
export * from '../v26/esporte/atributos26';
import { ESTILOS26 } from '../v26/esporte/estilos26';

export const GRUPO_DA_POSICAO: Record<Posicao, GrupoDePosicao> = { goleiro: 'goleiro', zagueiro: 'defensor', lateral: 'defensor', volante: 'meio', meia: 'meio', ponta: 'atacante', atacante: 'atacante' };


/** O que o tempo cobra (o desvio guardado do corpo cai depois do auge) e o que ensina (a leitura cresce). */
const DO_CORPO = new Set<AtributoId>([...FISICOS26, 'saidas', 'largada']);
const DA_LEITURA = new Set<AtributoId>([...TATICOS26, 'recepcao', 'devolucao']);

/** O traço de nascença de um atributo (−4..+4, estável pela semente da vida). */
export const tracoDoAtributo = (v: Vida, id: AtributoId) => Math.round((hashMisturado(`${v.id}:atributo:${id}`) * 8 - 4) * 10) / 10;

/** O conjunto pelo papel: a posição (futebol), a função (basquete, vôlei, futsal), a prova (atletismo). */
export function atributosDaCarreira(e: CarreiraEsportiva, posicao: Posicao | undefined, funcao?: 'armador' | 'ala' | 'pivo', v?: Vida): Lista {
  if (e.modalidade === 'futebol' && posicao) return ATRIBUTOS_DA_POSICAO[posicao];
  if (e.modalidade === 'basquete' && (funcao || v)) return ATRIBUTOS_BASQUETE[funcao ?? funcaoBasquete(v!)];
  if (v && e.modalidade === 'volei') return ATRIBUTOS_VOLEI[funcaoVolei(v)];
  if (v && e.modalidade === 'futsal') return ATRIBUTOS_FUTSAL[e.futsal?.funcao ?? funcaoFutsalPorSorteio(hashMisturado(`${v.id}:futsal_funcao`))];
  if (v && e.modalidade === 'atletismo') return ATRIBUTOS_ATLETISMO[grupoDaProva(provaDe(v, 'atletismo')?.nome)];
  // VIDA 26.2: na luta, o estilo escolhido (o boxeador vive de golpes e defesa; o jiu-jiteiro, do chão). Sem estilo: o de antes.
  if (v && e.modalidade === 'lutas' && v.lutas26?.estilo) return ESTILOS26[v.lutas26.estilo].atributos;
  return ATRIBUTOS_DA_MODALIDADE[e.modalidade] ?? [];
}

/** Anos competindo nesta carreira (a base e o profissional): a experiência que amadurece a leitura e a cabeça. */
const anosCompetindo = (v: Vida, e: CarreiraEsportiva) => Math.max(0, (v.t - (e.tInicio ?? v.t)) / 12);

interface Contexto { i: number; cap?: Record<Capacidade26, number>; anos: number }
function contexto(v: Vida, e: CarreiraEsportiva, ids: AtributoId[]): Contexto {
  return { i: idade(v), cap: ids.some(id => CORPO_DO_ATRIBUTO[id]) ? capacidadesDe(v) : undefined, anos: anosCompetindo(v, e) };
}

/** O que o corpo soma (ou tira) a um atributo físico: a distância das capacidades até a régua do atleta adulto médio. */
export function efeitoDoCorpo(id: AtributoId, cap: Record<Capacidade26, number>): number {
  const fontes = CORPO_DO_ATRIBUTO[id];
  if (!fontes) return 0;
  return clamp(fontes.reduce((s, [c, w]) => s + (cap[c] - REFERENCIA26[c]) * w, 0) * 0.35, -12, 8);
}
/** O que a pessoa soma a um atributo mental: os traços, o estresse (na compostura e na concentração), a maturidade. */
export function efeitoDaMente(v: Vida, id: AtributoId, i: number, anos: number): number {
  const fontes = MENTE_DO_ATRIBUTO[id];
  if (!fontes) return 0;
  const tr = v.personalidade?.tracos as Record<string, number> | undefined;
  const tracos = fontes.reduce((s, [t, w]) => s + (tr?.[t] ?? 0) * w, 0);
  const estresse = id === 'compostura' || id === 'concentracao' ? -Math.max(0, (v.mente?.estresse ?? 40) - 55) * 0.08 : 0;
  const maturidade = -Math.min(4, Math.max(0, 18 - i) * 0.6) + Math.min(3, anos * 0.35) - 2.8;
  return clamp(tracos + estresse + maturidade, -10, 8);
}
/** A leitura de jogo de quem é muito novo ainda não é a do adulto (a experiência ensina: `envelhecerAtributos`). */
export const efeitoDaIdadeTatica = (i: number) => -Math.min(5, Math.max(0, 18 - i) * 0.7);

function valorCom(v: Vida, e: CarreiraEsportiva, tecnica: number, id: AtributoId, ctx: Contexto): number {
  const nat = GRUPO_DO_ATRIBUTO[id];
  const extra = CORPO_DO_ATRIBUTO[id] ? (ctx.cap ? efeitoDoCorpo(id, ctx.cap) : 0)
    : nat === 'mental' ? efeitoDaMente(v, id, ctx.i, ctx.anos)
      : nat === 'tatico' ? efeitoDaIdadeTatica(ctx.i) : 0;
  return Math.round(clamp(tecnica + tracoDoAtributo(v, id) + (e.atributos?.[id] ?? 0) + extra) * 10) / 10;
}

/** O valor de um atributo (0..100): a técnica de hoje + o traço + o que a carreira guardou + o corpo, a cabeça ou a idade. */
export function valorDoAtributo(v: Vida, e: CarreiraEsportiva, tecnica: number, id: AtributoId): number {
  return valorCom(v, e, tecnica, id, contexto(v, e, [id]));
}

export interface AtributoNoPerfil { id: AtributoId; valor: number; peso: number }
/** O perfil inteiro (para a temporada e para a tela). */
export function perfilDeAtributos(v: Vida, e: CarreiraEsportiva, tecnica: number, posicao: Posicao | undefined, funcao?: 'armador' | 'ala' | 'pivo'): AtributoNoPerfil[] {
  const lista = atributosDaCarreira(e, posicao, funcao, v);
  const ctx = contexto(v, e, lista.map(([id]) => id));
  return lista.map(([id, peso]) => ({ id, valor: valorCom(v, e, tecnica, id, ctx), peso }));
}

/** O nível na posição: a média dos atributos pesada pela posição (o que a ficha mostra e explica). */
export const nivelNaPosicao = (perfil: { valor: number; peso: number }[]) => Math.round(perfil.reduce((s, x) => s + x.valor * x.peso, 0) / Math.max(0.0001, perfil.reduce((s, x) => s + x.peso, 0)) * 10) / 10;

/**
 * As DEFICIÊNCIAS que a posição não perdoa: um atributo que pesa (≥ 10% da nota) e está bem abaixo do nível na posição
 * (8 pontos ou mais). A nota geral alta não as esconde: entram na nota (abaixo) e na ficha.
 */
export function deficienciasGraves(perfil: AtributoNoPerfil[]): AtributoNoPerfil[] {
  const n = nivelNaPosicao(perfil);
  return perfil.filter(x => x.peso >= 0.1 && n - x.valor >= 8);
}

/** Quanto o perfil soma à nota (na escala da técnica: 4 pontos de atributo acima da técnica, em todos, = +1 na nota). */
export function efeitoNaNota(perfil: AtributoNoPerfil[] | { valor: number; peso: number }[], tecnica: number): number {
  const base = perfil.reduce((s, x) => s + (x.valor - tecnica) * x.peso, 0) / 4;
  // VIDA 26: a deficiência grave num atributo que a posição exige cobra além da média (o goleiro sem reflexo não é salvo
  // pelo bom jogo com os pés).
  const graves = perfil.length && 'id' in perfil[0] ? deficienciasGraves(perfil as AtributoNoPerfil[]) : [];
  const n = graves.length ? nivelNaPosicao(perfil) : 0;
  return base - graves.reduce((s, x) => s + (n - x.valor - 7) * x.peso * 0.25, 0);
}

/** O desvio de um atributo em relação à técnica (para a produção: + acima, − abaixo). */
export const desvio = (perfil: { id: AtributoId; valor: number }[], id: AtributoId, tecnica: number) => (perfil.find(x => x.id === id)?.valor ?? tecnica) - tecnica;

/** Soma ao desvio guardado (o treino, o tempo), dentro de ±14 em volta da técnica. */
export function mexerNoAtributo(e: CarreiraEsportiva, id: AtributoId, delta: number): void {
  const a = (e.atributos ??= {});
  a[id] = Math.round(clamp((a[id] ?? 0) + delta, -14, 14) * 10) / 10;
}

/**
 * O treino extra da função (o mesmo verbo de `noOficio`): o que ele treina é o que sobe — os três atributos do grupo
 * treinado que mais pesam na função. O físico ainda depende do corpo (o treino soma ao que as capacidades permitem). A
 * cabeça (os mentais) não se treina com um botão: vem da pessoa e dos anos.
 */
export function treinarAtributos(e: CarreiraEsportiva, posicao: Posicao | undefined, funcao: 'armador' | 'ala' | 'pivo' | undefined, tipo: 'tecnico' | 'tatico' | 'fisico', v?: Vida): AtributoId[] {
  const lista = [...atributosDaCarreira(e, posicao, funcao, v)].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const alvos = lista.filter(id => GRUPO_DO_ATRIBUTO[id] === tipo).slice(0, 3);
  for (const id of alvos) mexerNoAtributo(e, id, tipo === 'tecnico' ? 2 : 1.5);
  return alvos;
}

/**
 * O ano no perfil: o que foi treinado e não é mantido esfria um pouco; depois do auge, o desvio do corpo cai (as
 * capacidades também envelhecem, por conta própria) e a leitura ganha — o veterano que joga com a cabeça.
 */
export function envelhecerAtributos(e: CarreiraEsportiva, idadeAgora: number, auge: number): void {
  const a = e.atributos;
  for (const id of Object.keys(a ?? {}) as AtributoId[]) a![id] = Math.round(a![id]! * 0.9 * 10) / 10;
  if (idadeAgora > auge) for (const id of DO_CORPO) if (a?.[id] !== undefined) mexerNoAtributo(e, id, -0.5);
  if (idadeAgora >= 24 && idadeAgora <= auge + 4) for (const id of DA_LEITURA) mexerNoAtributo(e, id, 0.4);
}

/**
 * VIDA 26 · saves de antes: o "jogo de fundo" do tênis virou forehand e backhand (o que a carreira treinou passa aos
 * dois). Os atributos novos começam no desvio zero (a técnica ± traço ± corpo/cabeça) — nada é reiniciado.
 */
export function normalizarAtributos26(e: CarreiraEsportiva): void {
  const a = e.atributos;
  if (e.modalidade === 'tenis' && a?.fundo !== undefined) {
    a.forehand ??= a.fundo; a.backhand ??= a.fundo;
    delete a.fundo;
  }
}

/**
 * VIDA 25 · a FOTOGRAFIA do perfil no fim de cada ano de esporte (a base e o profissional): o valor de cada atributo e a
 * técnica. É o que a ficha compara (antes → agora) e desenha (a evolução).
 */
export function fotografarAtributos(e: CarreiraEsportiva, ano: number, perfil: { id: AtributoId; valor: number }[], tecnica: number): void {
  if (!perfil.length) return;
  const serie = (e.serieAtributos ??= []);
  const foto = { ano, tecnica: Math.round(tecnica * 10) / 10, a: Object.fromEntries(perfil.map(x => [x.id, x.valor])) };
  const k = serie.findIndex(x => x.ano === ano);
  if (k >= 0) serie[k] = foto; else serie.push(foto);
  if (serie.length > 25) serie.splice(0, serie.length - 25);
}
