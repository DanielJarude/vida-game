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
  | 'arremesso' | 'rebote' | 'conducao'
  // VIDA 25: as outras modalidades (vôlei, futsal, tênis, natação, atletismo, luta) — cada uma com os seus.
  | 'ataque' | 'bloqueio' | 'recepcao' | 'saque'
  | 'devolucao' | 'fundo' | 'rede'
  | 'largada' | 'bracada' | 'explosao' | 'tecnica_prova'
  | 'golpes' | 'solo' | 'defesa';

export const NOME_ATRIBUTO: Record<AtributoId, string> = {
  reflexos: 'reflexos', posicionamento: 'posicionamento', saidas: 'saídas do gol', pes: 'jogo com os pés',
  marcacao: 'marcação', antecipacao: 'antecipação', aereo: 'jogo aéreo',
  passe: 'passe', visao: 'visão de jogo', resistencia: 'resistência',
  finalizacao: 'finalização', movimentacao: 'movimentação', velocidade: 'velocidade',
  arremesso: 'arremesso', rebote: 'rebote', conducao: 'condução de bola',
  ataque: 'ataque', bloqueio: 'bloqueio', recepcao: 'recepção e defesa', saque: 'saque',
  devolucao: 'devolução', fundo: 'jogo de fundo', rede: 'jogo de rede',
  largada: 'largada e viradas', bracada: 'técnica de nado', explosao: 'explosão', tecnica_prova: 'técnica da prova',
  golpes: 'golpes em pé', solo: 'luta no chão', defesa: 'defesa'
};

/**
 * VIDA 25 · os atributos das modalidades que não têm posição nem função com perfil próprio (o peso de cada um na nota
 * da temporada; somam 1). Não são enfeite: entram em `efeitoNaNota` como os do futebol e do basquete, sobem com o treino
 * extra (`treinarAtributos`) e envelhecem (`envelhecerAtributos`).
 */
export const ATRIBUTOS_DA_MODALIDADE: Partial<Record<string, [AtributoId, number][]>> = {
  volei: [['ataque', 0.3], ['recepcao', 0.25], ['bloqueio', 0.2], ['saque', 0.25]],
  futsal: [['conducao', 0.3], ['passe', 0.25], ['finalizacao', 0.25], ['marcacao', 0.2]],
  tenis: [['saque', 0.3], ['devolucao', 0.25], ['fundo', 0.3], ['resistencia', 0.15]],
  natacao: [['bracada', 0.35], ['largada', 0.2], ['resistencia', 0.25], ['velocidade', 0.2]],
  atletismo: [['velocidade', 0.3], ['explosao', 0.25], ['resistencia', 0.25], ['tecnica_prova', 0.2]],
  lutas: [['golpes', 0.3], ['solo', 0.25], ['defesa', 0.25], ['resistencia', 0.2]]
};

/** O que cada atributo é, em uma frase (a ficha explica; nunca o número interno). */
export const SOBRE_ATRIBUTO: Record<AtributoId, string> = {
  reflexos: 'A reação no lance que ninguém espera: a bola desviada, o chute à queima-roupa.',
  posicionamento: 'Estar no lugar certo antes da jogada acontecer.',
  saidas: 'Sair do gol na hora certa: o cruzamento, o um contra um.',
  pes: 'Jogar com os pés: o passe de saída, a reposição longa.',
  marcacao: 'Tirar a bola sem falta e acompanhar quem ataca.',
  antecipacao: 'Ler o passe antes dele sair.',
  aereo: 'Ganhar a bola pelo alto, na defesa e no ataque.',
  passe: 'Pôr a bola onde o companheiro precisa, no tempo certo.',
  visao: 'Enxergar a jogada que os outros não viram.',
  resistencia: 'Aguentar o jogo inteiro — e a temporada inteira — no mesmo ritmo.',
  finalizacao: 'Transformar a chance em gol.',
  movimentacao: 'Aparecer livre: a diagonal, o espaço entre os zagueiros.',
  velocidade: 'Chegar antes: arrancada e velocidade final.',
  arremesso: 'Converter de média e de longa distância.',
  rebote: 'Ganhar a bola que sobra no garrafão.',
  conducao: 'Carregar a bola com controle, sob marcação.',
  ataque: 'Pôr a bola no chão do outro lado, contra o bloqueio.',
  bloqueio: 'Fechar a rede: tempo de salto e leitura do levantamento.',
  recepcao: 'Receber o saque e defender o ataque: a bola na mão do levantador.',
  saque: 'Começar o ponto com vantagem: força, direção, o ace.',
  devolucao: 'Neutralizar o saque do outro lado.',
  fundo: 'Construir o ponto da linha de base: profundidade, ângulo, regularidade.',
  rede: 'Fechar o ponto no voleio.',
  largada: 'A saída do bloco e as viradas: o tempo que se ganha (ou perde) nas paredes.',
  bracada: 'A eficiência do nado: cada braçada levando mais longe.',
  explosao: 'A força em pouco tempo: a saída, o salto, o arremesso.',
  tecnica_prova: 'O gesto da prova: a passada, a barreira, a impulsão.',
  golpes: 'Acertar em pé: socos, chutes, a distância certa.',
  solo: 'A luta no chão: quedas, controle, finalização.',
  defesa: 'Não ser atingido nem finalizado: a guarda, a esquiva, a saída.'
};

/**
 * VIDA 25 · o GRUPO de cada atributo na ficha (técnico, físico, tático; cada modalidade mostra só os grupos que tem).
 * Não há atributo "mental" nas modalidades tradicionais: a cabeça do atleta é a pessoa (o estresse, a confiança) — não
 * se inventa um número para a tela.
 */
export const GRUPO_DO_ATRIBUTO: Record<AtributoId, 'tecnico' | 'fisico' | 'tatico'> = {
  reflexos: 'fisico', posicionamento: 'tatico', saidas: 'tecnico', pes: 'tecnico',
  marcacao: 'tatico', antecipacao: 'tatico', aereo: 'fisico',
  passe: 'tecnico', visao: 'tatico', resistencia: 'fisico',
  finalizacao: 'tecnico', movimentacao: 'tatico', velocidade: 'fisico',
  arremesso: 'tecnico', rebote: 'fisico', conducao: 'tecnico',
  ataque: 'tecnico', bloqueio: 'fisico', recepcao: 'tecnico', saque: 'tecnico',
  devolucao: 'tecnico', fundo: 'tecnico', rede: 'tecnico',
  largada: 'tecnico', bracada: 'tecnico', explosao: 'fisico', tecnica_prova: 'tecnico',
  golpes: 'tecnico', solo: 'tecnico', defesa: 'tatico'
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
const DO_CORPO = new Set<AtributoId>(['reflexos', 'velocidade', 'resistencia', 'saidas', 'aereo', 'explosao', 'bloqueio', 'largada']);
const DA_LEITURA = new Set<AtributoId>(['posicionamento', 'antecipacao', 'visao', 'movimentacao', 'recepcao', 'devolucao', 'defesa']);

/** O traço de nascença de um atributo (−4..+4, estável pela semente da vida). */
export const tracoDoAtributo = (v: Vida, id: AtributoId) => Math.round((hashMisturado(`${v.id}:atributo:${id}`) * 8 - 4) * 10) / 10;

/** Os atributos que valem para esta carreira agora (a posição no futebol; a função no basquete), com o peso de cada um. */
export function atributosDaCarreira(e: CarreiraEsportiva, posicao: Posicao | undefined, funcao?: 'armador' | 'ala' | 'pivo'): [AtributoId, number][] {
  if (e.modalidade === 'futebol' && posicao) return ATRIBUTOS_DO_GRUPO[GRUPO_DA_POSICAO[posicao]];
  if (e.modalidade === 'basquete' && funcao) return ATRIBUTOS_BASQUETE[funcao];
  return ATRIBUTOS_DA_MODALIDADE[e.modalidade] ?? [];
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

/**
 * VIDA 25 · a FOTOGRAFIA do perfil no fim de cada ano de esporte (a base e o profissional): o valor de cada atributo e a
 * técnica. É o que a ficha compara (antes → agora) e desenha (a evolução). Só existe a partir da VIDA 25 — os anos
 * anteriores não têm fotografia, e a tela diz isso em vez de inventar.
 */
export function fotografarAtributos(e: CarreiraEsportiva, ano: number, perfil: { id: AtributoId; valor: number }[], tecnica: number): void {
  if (!perfil.length) return;
  const serie = (e.serieAtributos ??= []);
  const foto = { ano, tecnica: Math.round(tecnica * 10) / 10, a: Object.fromEntries(perfil.map(x => [x.id, x.valor])) };
  const k = serie.findIndex(x => x.ano === ano);
  if (k >= 0) serie[k] = foto; else serie.push(foto);
  if (serie.length > 25) serie.splice(0, serie.length - 25);
}
