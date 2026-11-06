/**
 * VIDA 12.9 · ESPORTES — CONSISTÊNCIA DOS RESULTADOS.
 *
 * O bug: Portugal caiu na fase de grupos da competição mundial de tênis por equipes; meses depois, um acontecimento
 * genérico ("A dor antes da final", sem olhar competição nenhuma) sorteou 55% de título e escreveu "Jogou a final com
 * dor e foi campeão" — com marca de conquista no resumo do ano. Daqui:
 *
 *   - uma cena só fala de FINAL quando a simulação levou até ela: a final nacional das provas individuais exige a
 *     classificação, sorteada com a força do ano (`classificadoParaFinalNacional`, sem gastar o gerador principal);
 *     o resultado da final é o sorteio da cena (a escolha muda a chance, não o desfecho) e entra na temporada em curso
 *     pelo lugar (`registrarFinalNacional` → `esporte.aplicarLances`) — ouro é título no palmarés; fora do pódio,
 *     nunca é;
 *   - no tênis, a fase de uma cena (quartas, semifinal) cabe no que o ano anterior mostrou que se alcança
 *     (`faseTenisPlausivel`), e a fase que a cena jogou entra no ano (`registrarFaseTenis`): quem venceu a semifinal
 *     da cena tem a final no ano;
 *   - as cenas genéricas falam de "um jogo grande", nunca de título;
 *   - a varredura (`contradicoesEsportivas`) acusa qualquer conquista ou memória de título sem o título no palmarés.
 */
import type { CarreiraEsportiva, Dominio, MarcaCaminho, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { anoDe } from '../tempo';
import { habilidade } from './frentes';

/** As provas individuais com equipe (a colocação da temporada é a do atleta na prova que importa). */
const INDIVIDUAIS = new Set<string>(['natacao', 'atletismo', 'lutas']);
const ESPORTES = new Set<string>(['futebol', 'basquete', 'volei', 'tenis', 'natacao', 'atletismo', 'lutas']);

/** A temporada que está correndo agora (a que o próximo `fecharTemporada` fecha). */
export const anoDaTemporadaEmCurso = (v: Vida) => anoDe(v.t + 6);

/* ------------------------------------------------------------ As palavras de cada esporte */

export interface PalavrasDoEsporte { individual: boolean; onde: string; deOnde: string; momento: string; disputa: string }

/** Onde se joga e como se fala do jogo: campo e tempo, quadra e set, pista e prova, tatame e round. */
export function palavrasDoEsporte(d: Dominio | string | undefined): PalavrasDoEsporte {
  switch (d) {
    case 'basquete': return { individual: false, onde: 'quadra', deOnde: 'da quadra', momento: 'No terceiro quarto', disputa: 'o jogo' };
    case 'volei': return { individual: false, onde: 'quadra', deOnde: 'da quadra', momento: 'No terceiro set', disputa: 'o jogo' };
    case 'tenis': return { individual: true, onde: 'quadra', deOnde: 'da quadra', momento: 'No segundo set', disputa: 'o torneio' };
    case 'natacao': return { individual: true, onde: 'piscina', deOnde: 'da piscina', momento: 'Na metade da prova', disputa: 'a competição' };
    case 'atletismo': return { individual: true, onde: 'pista', deOnde: 'da pista', momento: 'Na metade da prova', disputa: 'a competição' };
    case 'lutas': return { individual: true, onde: 'tatame', deOnde: 'do tatame', momento: 'No segundo round', disputa: 'a luta' };
    default: return { individual: false, onde: 'campo', deOnde: 'de campo', momento: 'No segundo tempo', disputa: 'o jogo' };
  }
}

/* ------------------------------------------------------------ A final nacional das provas individuais */

/**
 * A classificação para a final nacional da prova (natação, atletismo, luta) na temporada em curso: a mesma conta da
 * colocação do ano (`fecharTemporada`: a nota contra a divisão, a forma) — ficar entre os oito. Um sorteio estável por
 * vida e ano (não gasta o gerador principal). Só do nível nacional para cima (o regional não tem final nacional), e uma
 * final por temporada.
 */
export function classificadoParaFinalNacional(v: Vida): boolean {
  const e = v.caminhos.esporte;
  if (!e || e.fase !== 'profissional' || !INDIVIDUAIS.has(e.modalidade) || e.nivel < 2) return false;
  if (e.lances?.finalNacional !== undefined || e.lances?.ouro || e.lances?.podios) return false;
  const nota = 6 + (habilidade(v, e.modalidade) - (70 + e.nivel * 3)) / 4 + (v.corpo.forma - 70) / 22;
  const colocacao = 9 - (nota - 5) * 2.2;
  const p = clamp(1 / (1 + Math.exp(-(8.5 - colocacao))), 0.03, 0.97);
  return rngDe(v.id, 'final_nacional129', anoDaTemporadaEmCurso(v)).chance(p);
}

/** O lugar que a final nacional deu (1 ouro, 2 prata, 3 bronze, 4+ fora do pódio) — entra na temporada em curso. */
export function registrarFinalNacional(v: Vida, lugar: number): void {
  const e = v.caminhos.esporte;
  if (!e || e.fase !== 'profissional') return;
  (e.lances ??= {}).finalNacional = Math.max(1, Math.min(8, Math.round(lugar)));
}

/* ------------------------------------------------------------ Tênis: a fase que o ano pode ter */

export const FASES_TENIS = ['primeira rodada', 'segunda rodada', 'quartas de final', 'semifinal', 'final'];

/**
 * A fase de uma cena de tênis, no máximo um passo além da melhor fase do ano anterior (sem ano anterior: a segunda
 * rodada). Quem nunca passou da segunda rodada não está na véspera de uma semifinal.
 */
export function faseTenisPlausivel(v: Vida, desejada: string): string {
  const e = v.caminhos.esporte;
  const t = e?.temporadas?.slice(-1)[0];
  const melhor = t?.melhorFase === 'título' ? 4 : t?.melhorFase ? Math.max(0, FASES_TENIS.indexOf(t.melhorFase)) : 0;
  const i = FASES_TENIS.indexOf(desejada);
  return FASES_TENIS[Math.max(1, Math.min(i < 0 ? 1 : i, melhor + 1, 4))];
}

/** "na semifinal", "nas quartas de final". */
export const naFaseTenis = (fase: string) => (fase.startsWith('quartas') ? `nas ${fase}` : `na ${fase}`);

/** A fase que a cena jogou (e, se venceu, a seguinte) entra no ano do tenista: as rodadas que faltavam para o título. */
export function registrarFaseTenis(v: Vida, fase: string, venceu: boolean): void {
  const e = v.caminhos.esporte;
  if (!e || e.fase !== 'profissional' || e.modalidade !== 'tenis') return;
  const i = FASES_TENIS.indexOf(fase);
  if (i < 2) return;
  const falta = Math.max(1, 5 - i - (venceu ? 1 : 0));
  const l = (e.lances ??= {});
  l.faseTenis = Math.min(l.faseTenis ?? 9, falta);
}

/* ------------------------------------------------------------ A varredura: nenhum título sem registro */

/**
 * O que diz título: campeão, título, medalha de ouro, "o ouro". Não conta a estatística do ano ("3 títulos, 6 pódios": a
 * contagem dos torneios pequenos da luta e do tênis, que a linha da temporada mostra) nem nome de liga ("Liga Ouro").
 */
const TITULO = /\bcampe(ã|a)o\b|\bcampeões\b|\bt[íi]tulos?\b|medalha de ouro|\bo ouro\b/i;
const semEstatistica = (s: string) => s.replace(/\b\d+ t[íi]tulos?\b/gi, '');
/** O que não é carreira (a escola, a faculdade, o xadrez, o bairro) e o que nega título ("sem título"). */
const FORA = /escolar|escola|universit|xadrez|escolinha|amador|bairro|olimp[ií]ada|sem t[íi]tulo|o título ficou|título de eleitor|bodas|primeiro título de|bola de ouro|chuteira de ouro|luva de ouro|técnic|treinador|banco|estadual como técnico|comandou|dirigiu/i;

/** Há título de verdade (palmarés: título, ou campanha campeã/ouro pela seleção) daquela modalidade em torno do ano? */
function temTituloNoPalmares(v: Vida, ano: number, d?: string): boolean {
  return (v.caminhos.palmares ?? []).some(c => (!d || c.modalidade === d) && Math.abs(c.ano - ano) <= 1
    && (c.tipo === 'titulo' || (c.tipo === 'selecao' && /^(Campe|Medalha de ouro)/.test(c.texto))));
}

/** Uma marca de conquista esportiva que diz título sem título no palmarés (o resumo do ano e a sala de troféus a escondem). */
export function marcaDeTituloSemRegistro(v: Vida, m: MarcaCaminho): boolean {
  // A marca com ocupação é de outra carreira do esporte (o técnico, o treinador de goleiros): o palmarés dela é outro.
  return m.tipo === 'conquista' && !!m.dominio && !m.ocupacaoId && ESPORTES.has(m.dominio) && TITULO.test(semEstatistica(m.texto)) && !FORA.test(m.texto)
    && !temTituloNoPalmares(v, anoDe(m.t), m.dominio);
}

/**
 * As contradições entre o que a vida diz (marcas de conquista, memórias da Linha da Vida) e o que o motor registrou
 * (o palmarés). Vazio = coerente. Só olha a carreira de atleta (do primeiro ano dela em diante).
 */
export function contradicoesEsportivas(v: Vida, desde = 0): string[] {
  const out: string[] = [];
  const carreiras = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].filter((c): c is CarreiraEsportiva => !!c);
  for (const m of v.caminhos.marcas) if (marcaDeTituloSemRegistro(v, m)) out.push(`Conquista sem título no palmarés: "${m.texto}" (${anoDe(m.t)}).`);
  if (!carreiras.length) return out;
  const inicio = Math.min(...carreiras.map(c => c.tInicio));
  for (const b of v.biografia.slice(desde)) {
    const texto = semEstatistica(b.texto);
    if (b.t < inicio || !TITULO.test(texto) || FORA.test(texto)) continue;
    if (!/(foi campe|e campe|saiu campe|campe(ã|a)o com|a taça|levantou|o ouro|título)/i.test(texto)) continue;
    if (!temTituloNoPalmares(v, anoDe(b.t))) out.push(`Memória de título sem título no palmarés: "${b.texto}" (${anoDe(b.t)}).`);
  }
  return out;
}
