/**
 * A seleção nacional (futebol): ninguém "tenta entrar". O mundo observa a
 * carreira — e, às vezes, chama (pacote pós-REWORK 3).
 *
 *   radar → primeira convocação → estreia → reserva/disputa → titular →
 *   jogos → torneios de seleções → corte/continuidade → (raro) capitania
 *
 * O que pesa é o MÉRITO ESPORTIVO e o contexto: a nacionalidade esportiva,
 * a posição (a concorrência dela), a idade, a divisão, a titularidade, a
 * temporada, a forma do corpo, a lesão, a reputação no mercado, os prêmios
 * recentes. A FAMA NÃO ENTRA NA CONTA: um nome famoso em má fase fica de
 * fora; um volante discreto em grande fase na Série A pode ser chamado.
 *
 * Os torneios são do universo do jogo ("o torneio mundial de seleções", "o
 * torneio continental") — nenhuma história real é afirmada.
 *
 * Costura para a América do Sul: `nacionalidadeEsportiva` é o único ponto
 * que diz por qual seleção a pessoa joga (hoje, sempre a brasileira).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Posicao, Temporada, TrajetoriaNaSelecao, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { marcar } from './marcas';
import { lesaoAtiva } from './lesoes';
import { avaliarTemporada, conquistasRecentes, registrarConquista } from './palmares';

/** Por qual seleção a pessoa joga. (Hoje o VIDA é brasileiro; é aqui que outro país entra.) */
export const nacionalidadeEsportiva = (_v: Vida) => ({ pais: 'brasil', selecao: 'a seleção brasileira', daSelecao: 'da seleção brasileira', naSelecao: 'na seleção brasileira' });

/** A concorrência de cada posição na seleção (quantos disputam a mesma vaga, em escala): o centroavante disputa com mais gente. */
const CONCORRENCIA: Record<Posicao, number> = { goleiro: 0, lateral: -1, zagueiro: 0, volante: 0, meia: 2, ponta: 2, atacante: 3 };

/**
 * O que a comissão técnica enxerga (0..100) — o mérito esportivo e o
 * contexto, nunca a fama. É a MESMA conta para o radar, a convocação, o
 * corte e a titularidade.
 */
export function olharDaSelecao(v: Vida, e: CarreiraEsportiva, t: Temporada | undefined = e.temporadas?.[e.temporadas.length - 1]): number {
  if (e.modalidade !== 'futebol' || e.fase !== 'profissional' || !t || e.suspensoAte) return 0;
  const i = idade(v);
  const ava = avaliarTemporada(e, t);
  const divisao = [0, -45, -32, -14, 0][t.nivel] ?? -45;
  const idadeFator = i < 19 ? -8 : i <= 32 ? 0 : -(i - 32) * 4;
  const lesao = lesaoAtiva(v)?.lesao.gravidade === 3 ? -18 : lesaoAtiva(v)?.lesao.gravidade === 2 ? -6 : 0;
  const premios = Math.min(8, conquistasRecentes(v, 2).filter(x => x.tipo === 'premio').length * 4);
  const pos = t.posicao ? CONCORRENCIA[t.posicao] : 0;
  return clamp((e.reputacao ?? 30) * 0.5 + ava.indice * 0.5 + divisao + idadeFator + lesao + premios - pos);
}

const RADAR = 66;
const CONVOCACAO = 76;
const TITULAR = 84;

/** O ano visto pela seleção: radar, convocação (ou corte), jogos, torneio, capitania. */
export function processarSelecao(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada): void {
  if (e.modalidade !== 'futebol') return;
  const x = olharDaSelecao(v, e, t) + r.normal() * 3;
  const s = e.selecao;
  const g = ge(v);
  const nac = nacionalidadeEsportiva(v);
  if (!s) {
    if (x < RADAR) return;
    e.selecao = { radar: v.t, convocacoes: 0, jogos: 0, gols: 0, torneios: [] };
    escrever(v, { texto: `O nome entrou na lista de observados da comissão técnica ${nac.daSelecao}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
  }
  const sel = e.selecao as TrajetoriaNaSelecao;
  // Muitos bons para poucas vagas: perto da linha de corte, a convocação é disputa (quem está muito acima é chamado quase sempre).
  if (x < CONVOCACAO || !r.chance(Math.min(0.92, 0.35 + (x - CONVOCACAO) / 16))) {
    // Ficar fora depois de ter sido chamado: o corte (a primeira vez é biografia).
    if (sel.tUltima !== undefined && v.t - sel.tUltima <= 12) {
      escrever(v, { texto: sel.convocacoes >= 3 ? `Ficou fora da lista ${nac.daSelecao} pela primeira vez em anos.` : `Não foi chamado de novo ${nac.naSelecao}.`.replace('chamado', flex(g, 'chamado', 'chamada')), relevancia: sel.convocacoes >= 3 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'ruim' });
      sel.titular = false;
    }
    return;
  }
  // Convocado: quantas janelas do ano, e quanto jogou (o titular joga; o reserva espera a vez).
  const primeira = sel.convocacoes === 0;
  const janelas = 2 + (x >= TITULAR ? 2 : x >= CONVOCACAO + 4 ? 1 : 0);
  const titular = x >= TITULAR;
  const jogos = Math.max(0, Math.round(janelas * (titular ? 1.8 : 0.6) + r.normal() * 0.8));
  const gols = t.posicao ? Math.round(jogos * ({ goleiro: 0, lateral: 0.04, zagueiro: 0.05, volante: 0.06, meia: 0.18, ponta: 0.28, atacante: 0.42 }[t.posicao]) * (0.6 + r.next() * 0.8)) : 0;
  sel.convocacoes += 1;
  sel.tUltima = v.t;
  sel.titular = titular;
  const estreou = sel.jogos === 0 && jogos > 0;
  sel.jogos += jogos;
  sel.gols += gols;
  e.reputacao = clamp((e.reputacao ?? 30) + (primeira ? 2 : 1));
  if (primeira) {
    sel.tPrimeira = v.t;
    const texto = `Primeira convocação para ${nac.selecao}, aos ${idade(v)}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: 'futebol' });
    registrarConquista(v, { tipo: 'selecao', modalidade: 'futebol', ano: t.ano, competicao: 'seleção', texto: `Primeira convocação, aos ${idade(v)}` });
  }
  if (estreou) {
    sel.tEstreia = v.t;
    const texto = `${flex(g, 'Estreou', 'Estreou', 'Estreou')} ${nac.naSelecao}${gols ? ' — e marcou' : ''}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    registrarConquista(v, { tipo: 'selecao', modalidade: 'futebol', ano: t.ano, competicao: 'seleção', texto: 'Estreia pela seleção' });
  }
  // O torneio do ano (no universo do jogo): o mundial a cada quatro anos; o continental, dois anos depois.
  const torneio = t.ano % 4 === 2 ? 'o torneio mundial de seleções' : t.ano % 4 === 0 ? 'o torneio continental de seleções' : undefined;
  if (torneio) disputarTorneio(v, r, e, sel, t.ano, torneio, titular);
  // A braçadeira: para quem é titular há tempo, com muitos jogos e a idade de liderar.
  if (!sel.capitao && titular && sel.jogos >= 30 && idade(v) >= 26 && (e.reputacao ?? 0) >= 70 && r.chance(0.25)) {
    sel.capitao = true;
    const texto = `Usou pela primeira vez a braçadeira de ${flex(g, 'capitão', 'capitã', 'capitão')} ${nac.daSelecao}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    registrarConquista(v, { tipo: 'selecao', modalidade: 'futebol', ano: t.ano, competicao: 'seleção', texto: `${flex(g, 'Capitão', 'Capitã', 'Capitão')} da seleção` });
  }
}

const FASES = ['caiu na fase de grupos', 'caiu nas oitavas', 'caiu nas quartas', 'caiu na semifinal', 'perdeu a final', 'foi campeã'];

function disputarTorneio(v: Vida, r: Rng, e: CarreiraEsportiva, sel: TrajetoriaNaSelecao, ano: number, nome: string, titular: boolean): void {
  // A campanha é da seleção (o mundo), com um pouco de quem joga: ninguém ganha torneio sozinho.
  const mundial = nome.includes('mundial');
  const pesos = mundial ? [0.15, 0.25, 0.27, 0.13, 0.08, 0.12] : [0.12, 0, 0.3, 0.25, 0.13, 0.2];
  if (titular) { pesos[5] += 0.02; pesos[0] -= 0.02; }
  let x = r.next(), k = 0;
  for (; k < pesos.length - 1; k++) { x -= pesos[k]; if (x <= 0) break; }
  const jogos = [3, 4, 5, 6, 7, 7][k] ?? 3;
  const jogou = titular ? jogos : Math.round(jogos * 0.3);
  sel.torneios.push({ ano, nome, campanha: FASES[k], jogos: jogou });
  const g = ge(v);
  const nac = nacionalidadeEsportiva(v);
  const campea = k === 5;
  const texto = campea
    ? `${flex(g, 'Campeão', 'Campeã', 'Campeão')} do ${nome.slice(2)} com ${nac.selecao}${titular ? `, ${flex(g, 'titular', 'titular')}` : ', no grupo'}.`
    : `Disputou ${nome} com ${nac.selecao}${titular ? ', como titular' : ''}: a seleção ${FASES[k]}.`;
  escrever(v, { texto, relevancia: campea || mundial ? 'marco' : 'biografia', tema: 'trabalho', tom: campea ? 'bom' : k >= 3 ? undefined : 'ruim' });
  registrarConquista(v, { tipo: 'selecao', modalidade: 'futebol', ano, competicao: nome, papel: titular ? 'protagonista' : 'elenco', texto: campea ? `Campeão do ${nome.slice(2)}`.replace('Campeão', flex(g, 'Campeão', 'Campeã', 'Campeão')) : `${nome.charAt(0).toUpperCase() + nome.slice(1)}: a seleção ${FASES[k]}` });
  if (campea) { marcar(v, 'conquista', texto, 3, { dominio: 'futebol' }); e.reputacao = clamp((e.reputacao ?? 30) + 3); }
}
