/**
 * A REPRESENTAÇÃO NACIONAL — de toda modalidade que a tem (generalização de
 * carreiras; nasceu no futebol, no pacote pós-REWORK 3). Ninguém "tenta
 * entrar". O mundo observa a carreira — e, às vezes, chama.
 *
 *   futebol, basquete, vôlei  a seleção: convocação, jogos, torneios
 *   tênis                     a equipe do país na competição por equipes —
 *                             o critério é o ranking entre os tenistas do
 *                             país (o 4º melhor convoca, o 2º joga as simples)
 *   natação, atletismo, luta  o índice: a classificação para as competições
 *                             internacionais (mundial, jogos multiesportivos);
 *                             a campanha é individual (final, medalha)
 *
 * Cada modalidade tem o seu critério; em todas, a FAMA NÃO ENTRA.
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
 * MUNDO: `nacionalidadeEsportiva` é o único ponto que diz por qual seleção a
 * pessoa joga — a da NACIONALIDADE, nunca a da residência: o argentino que
 * joga no Brasil continua sendo da Argentina. Com mais de uma nacionalidade,
 * a de nascença; e, uma vez convocado, a escolha fica (como na regra das
 * federações: quem jogou por uma seleção não troca). A concorrência é a do
 * país: entrar na seleção brasileira é mais difícil que na costarriquenha.
 */

import { nomeDoPais, paisDoCatalogo, perfilDoPais, temPerfil } from '../mundo/registro';
import { nacionalidadesDaVida } from '../mundo/vida';
import type { Rng } from '../rng';
import { clamp, criarRng } from '../rng';
import type { CarreiraEsportiva, Dominio, Posicao, Temporada, TrajetoriaNaSelecao, Vida } from '../tipos';
import { NOME_MOD } from './esporte';
import { perfilDe } from './perfisEsportivos';
import type { FuncaoBasquete } from './modalidades';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { marcar } from './marcas';
import { lesaoAtiva } from './lesoes';
import { avaliarTemporada, conquistasRecentes, registrarConquista } from './palmares';

/** O país da seleção da pessoa (a da nacionalidade; depois da primeira convocação, a que ela escolheu). */
export const paisEsportivo = (v: Vida): string => v.caminhos.esporte?.selecao?.pais ?? nacionalidadesDaVida(v)[0];

/** "brasileira", "argentina", "japonesa" — o adjetivo da seleção. */
export const adjetivoDaSelecao = (pais: string) => (temPerfil(pais) ? perfilDoPais(pais).gentilico[1] : nomeDoPais(pais));

/** Por qual seleção a pessoa joga: a do país da nacionalidade (nunca o da residência). */
export const nacionalidadeEsportiva = (v: Vida) => {
  const pais = paisEsportivo(v);
  const a = adjetivoDaSelecao(pais);
  return { pais, selecao: `a seleção ${a}`, daSelecao: `da seleção ${a}`, naSelecao: `na seleção ${a}` };
};

/** O nome da representação nacional NA modalidade (a seleção de basquete; a equipe de tênis; a seleção de natação). */
export function representacaoDe(v: Vida, d: Dominio): { selecao: string; daSelecao: string; naSelecao: string; paraSelecao: string } {
  const n = nacionalidadeEsportiva(v);
  const a = adjetivoDaSelecao(n.pais);
  if (d === 'futebol') return { selecao: n.selecao, daSelecao: n.daSelecao, naSelecao: n.naSelecao, paraSelecao: `para a seleção ${a}` };
  if (d === 'tenis') return { selecao: `a equipe ${a} de tênis`, daSelecao: `da equipe ${a} de tênis`, naSelecao: `na equipe ${a} de tênis`, paraSelecao: `para a equipe ${a} de tênis` };
  const mod = NOME_MOD[d] ?? d;
  return { selecao: `a seleção ${a} de ${mod}`, daSelecao: `da seleção ${a} de ${mod}`, naSelecao: `na seleção ${a} de ${mod}`, paraSelecao: `para a seleção ${a} de ${mod}` };
}

/**
 * A concorrência da seleção no país (calibração do jogo): onde o esporte é
 * forte e popular, há mais gente boa por vaga — a régua sobe; onde não é,
 * desce. Pela popularidade do esporte no perfil (1 = o Brasil no vôlei).
 * Pontos somados aos limiares (radar, convocação, titular).
 */
export function concorrenciaNoPais(pais: string, d: Dominio): number {
  const pop = temPerfil(pais) ? perfilDoPais(pais).esporte.popularidade[d] ?? 1 : 1;
  const tamanho = Math.log10(Math.max(1, paisDoCatalogo(pais).populacao) / 1000);  // milhões, em log: o Brasil ~2,3
  return Math.round(clamp((pop - 1.25) * 10 + (tamanho - 2.33) * 3, -12, 4));
}

/** Os limiares (radar, convocação, titular) de cada tipo de representação: a régua é a mesma ideia, o critério é da modalidade. */
const LIMIARES: Record<'clube' | 'circuito' | 'equipe', [number, number, number]> = { clube: [66, 76, 84], circuito: [60, 67, 76], equipe: [62, 72, 82] };

/** A concorrência de cada posição na seleção (quantos disputam a mesma vaga, em escala): o centroavante disputa com mais gente. */
const CONCORRENCIA: Record<Posicao, number> = { goleiro: 0, lateral: -1, zagueiro: 0, volante: 0, meia: 2, ponta: 2, atacante: 3 };

/**
 * O que a comissão técnica enxerga (0..100) — o mérito esportivo e o
 * contexto, nunca a fama. É a MESMA conta para o radar, a convocação, o
 * corte e a titularidade.
 */
export function olharDaSelecao(v: Vida, e: CarreiraEsportiva, t: Temporada | undefined = e.temporadas?.[e.temporadas.length - 1]): number {
  if (e.fase !== 'profissional' || !t || e.suspensoAte) return 0;
  if (e.modalidade !== 'futebol') return olharDaModalidade(v, e, t);
  const i = idade(v);
  const ava = avaliarTemporada(e, t);
  const divisao = [0, -45, -32, -14, 0][t.nivel] ?? -45;
  const idadeFator = i < 19 ? -8 : i <= 32 ? 0 : -(i - 32) * 4;
  const lesao = lesaoAtiva(v)?.lesao.gravidade === 3 ? -18 : lesaoAtiva(v)?.lesao.gravidade === 2 ? -6 : 0;
  const premios = Math.min(8, conquistasRecentes(v, 2).filter(x => x.tipo === 'premio').length * 4);
  const pos = t.posicao ? CONCORRENCIA[t.posicao] : 0;
  return clamp((e.reputacao ?? 30) * 0.5 + ava.indice * 0.5 + divisao + idadeFator + lesao + premios - pos);
}

/** A concorrência de cada função no basquete (o pivô alto é raro; o ala, muitos). */
const CONCORRENCIA_BASQUETE: Record<FuncaoBasquete, number> = { armador: 1, ala: 2, pivo: -1 };

/**
 * O olhar das outras modalidades: o mesmo princípio (mérito e contexto, nunca
 * a fama), o critério de cada uma.
 *   coletivas    nome no mercado + a temporada avaliada + a divisão + idade/lesão
 *                (+ a concorrência da função, no basquete)
 *   tênis        o ranking contra o dos outros tenistas do país naquele ano
 *                (escala logarítmica) e a forma do ano
 *   individuais  a temporada (pódios, a melhor colocação) + o nível + idade/lesão
 */
function olharDaModalidade(v: Vida, e: CarreiraEsportiva, t: Temporada): number {
  const i = idade(v);
  const ava = avaliarTemporada(e, t);
  const lesao = lesaoAtiva(v)?.lesao.gravidade === 3 ? -18 : lesaoAtiva(v)?.lesao.gravidade === 2 ? -6 : 0;
  const idadeFator = i < 18 ? -8 : i <= 32 ? 0 : -(i - 32) * 4;
  const premios = Math.min(8, conquistasRecentes(v, 2).filter(x => x.tipo === 'premio' && x.modalidade === e.modalidade).length * 4);
  const p = perfilDe(e.modalidade);
  if (p.estrutura === 'circuito') {
    // A equipe do país é dos MELHORES DO PAÍS no ranking, não de quem passa de um número absoluto (FIX final da
    // generalização: com o corte fixo, todo top 160 era chamado — 95% dos profissionais). A régua é a dos outros
    // tenistas do país naquele ano: o 4º melhor (a convocação) e o 2º (quem joga as simples).
    const { quarto, segundo } = concorrenciaNoTenis(t.ano, ge(v) === 'feminino');
    const rk = Math.max(1, t.ranking ?? 2200);
    const [, CONV, TIT] = LIMIARES.circuito;
    const escala = (TIT - CONV) / (Math.log10(quarto) - Math.log10(segundo));
    // A forma do ano já está no ranking (são os pontos do ano): a nota da temporada, que é relativa ao circuito, não entra.
    return clamp(CONV + (Math.log10(quarto) - Math.log10(rk)) * escala + lesao + (i > 34 ? -(i - 34) * 4 : 0));
  }
  if (p.estrutura === 'equipe') {
    const nivel = [0, -40, -26, -10, 0][t.nivel] ?? -40;
    return clamp(ava.indice * 0.6 + (e.reputacao ?? 30) * 0.4 + nivel + idadeFator + lesao + premios);
  }
  const divisao = [0, -45, -32, -14, 0][t.nivel] ?? -45;
  const funcao = e.modalidade === 'basquete' && t.funcao ? CONCORRENCIA_BASQUETE[t.funcao as FuncaoBasquete] ?? 0 : 0;
  return clamp((e.reputacao ?? 30) * 0.5 + ava.indice * 0.5 + divisao + idadeFator + lesao + premios - funcao);
}

/**
 * Os outros tenistas do país num ano (no universo do jogo): o ranking do 4º e
 * do 2º melhor. Muda de ano para ano (há safras melhores e piores), mas é a
 * mesma para todas as vidas daquele ano — é o país, não a pessoa.
 */
export function concorrenciaNoTenis(ano: number, feminino: boolean): { quarto: number; segundo: number } {
  const r = criarRng(ano * 9973 + (feminino ? 17 : 0));
  const quarto = Math.round(10 ** (Math.log10(feminino ? 240 : 150) + r.normal() * 0.16));
  const segundo = Math.round(Math.min(quarto * 0.7, 10 ** (Math.log10(feminino ? 120 : 70) + r.normal() * 0.18)));
  return { quarto, segundo: Math.max(1, segundo) };
}

const RADAR_FUT = 66;
const CONVOCACAO_FUT = 76;
const TITULAR_FUT = 84;

/** O ano visto pela seleção: radar, convocação (ou corte), jogos, torneio, capitania. */
export function processarSelecao(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada): void {
  const x = olharDaSelecao(v, e, t) + r.normal() * 3;
  const s = e.selecao;
  const g = ge(v);
  const nac = representacaoDe(v, e.modalidade);
  const estrutura = perfilDe(e.modalidade).estrutura;
  // Medido contra o Brasil (a régua que o jogo sempre teve): no Brasil, 0.
  const ajuste = concorrenciaNoPais(paisEsportivo(v), e.modalidade) - concorrenciaNoPais('BR', e.modalidade);
  const [RADAR, CONVOCACAO, TITULAR] = (e.modalidade === 'futebol' ? [RADAR_FUT, CONVOCACAO_FUT, TITULAR_FUT] : LIMIARES[estrutura]).map(x => x + ajuste);
  const individual = estrutura !== 'clube';
  if (!s) {
    if (x < RADAR) return;
    e.selecao = { radar: v.t, convocacoes: 0, jogos: 0, gols: 0, torneios: [], pais: paisEsportivo(v) };
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
  const gols = e.modalidade === 'futebol' && t.posicao ? Math.round(jogos * ({ goleiro: 0, lateral: 0.04, zagueiro: 0.05, volante: 0.06, meia: 0.18, ponta: 0.28, atacante: 0.42 }[t.posicao]) * (0.6 + r.next() * 0.8)) : 0;
  sel.convocacoes += 1;
  sel.tUltima = v.t;
  sel.titular = titular;
  const estreou = sel.jogos === 0 && jogos > 0;
  sel.jogos += jogos;
  sel.gols += gols;
  e.reputacao = clamp((e.reputacao ?? 30) + (primeira ? 2 : 1));
  if (primeira) {
    sel.tPrimeira = v.t;
    const texto = individual && e.modalidade !== 'tenis' ? `Primeira convocação ${nac.paraSelecao}, aos ${idade(v)}: o índice veio.` : `Primeira convocação ${nac.paraSelecao}, aos ${idade(v)}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: e.modalidade });
    registrarConquista(v, { tipo: 'selecao', modalidade: e.modalidade, ano: t.ano, competicao: 'seleção', texto: `Primeira convocação, aos ${idade(v)}` });
  }
  if (estreou) {
    sel.tEstreia = v.t;
    const texto = `${flex(g, 'Estreou', 'Estreou', 'Estreou')} ${nac.naSelecao}${gols ? ' — e marcou' : ''}.`;
    escrever(v, { texto, relevancia: individual ? 'biografia' : 'marco', tema: 'trabalho', tom: 'bom' });
    registrarConquista(v, { tipo: 'selecao', modalidade: e.modalidade, ano: t.ano, competicao: 'seleção', texto: e.modalidade === 'futebol' ? 'Estreia pela seleção' : `Estreia ${nac.naSelecao.replace(/^na /, 'pela ')}` });
  }
  // O torneio do ano (no universo do jogo): cada modalidade tem o seu calendário.
  const torneio = torneioDoAno(e.modalidade, t.ano);
  if (torneio) { if (individual && e.modalidade !== 'tenis') disputarProva(v, r, e, sel, t.ano, torneio, x - CONVOCACAO); else disputarTorneio(v, r, e, sel, t.ano, torneio, titular); }
  // A braçadeira: para quem é titular há tempo, com muitos jogos e a idade de liderar.
  if (!individual && !sel.capitao && titular && sel.jogos >= 30 && idade(v) >= 26 && (e.reputacao ?? 0) >= 70 && r.chance(0.25)) {
    sel.capitao = true;
    const texto = `Usou pela primeira vez a braçadeira de ${flex(g, 'capitão', 'capitã', 'capitão')} ${nac.daSelecao}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    registrarConquista(v, { tipo: 'selecao', modalidade: e.modalidade, ano: t.ano, competicao: 'seleção', texto: `${flex(g, 'Capitão', 'Capitã', 'Capitão')} da seleção` });
  }
}

/**
 * O calendário de cada modalidade (no universo do jogo; nenhuma edição real
 * é afirmada): o futebol tem o mundial e o continental; o basquete e o vôlei,
 * o mundial e os jogos multiesportivos; o tênis, a competição por equipes
 * todo ano; as individuais, o mundial nos anos ímpares e os jogos
 * multiesportivos a cada quatro anos.
 */
export function torneioDoAno(d: Dominio, ano: number): string | undefined {
  if (d === 'futebol') return ano % 4 === 2 ? 'o torneio mundial de seleções' : ano % 4 === 0 ? 'o torneio continental de seleções' : undefined;
  if (d === 'tenis') return 'a competição mundial por equipes';
  if (d === 'basquete' || d === 'volei') return ano % 4 === 0 ? 'os jogos multiesportivos mundiais' : ano % 4 === 2 ? 'o campeonato mundial' : ano % 4 === 3 ? 'o campeonato continental' : undefined;
  return ano % 4 === 0 ? 'os jogos multiesportivos mundiais' : ano % 2 === 1 ? 'o campeonato mundial' : 'os jogos continentais';
}

/**
 * A prova individual pelo país (natação, atletismo, luta): a campanha é do
 * atleta — eliminado, finalista, medalha. A margem acima do índice (o quanto o
 * ano foi bom) pesa; o dia, também.
 */
function disputarProva(v: Vida, r: Rng, e: CarreiraEsportiva, sel: TrajetoriaNaSelecao, ano: number, nome: string, margem: number): void {
  const forca = clamp(0.25 + margem / 30, 0.05, 0.85) + r.normal() * 0.15;
  const k = forca >= 0.85 ? 4 : forca >= 0.72 ? 3 : forca >= 0.6 ? 2 : forca >= 0.4 ? 1 : 0;
  const campanha = ['eliminação nas eliminatórias', 'semifinal', 'final', 'medalha de bronze', 'medalha de prata', 'medalha de ouro'][k + (k === 4 && r.chance(0.35) ? 1 : 0)];
  sel.torneios.push({ ano, nome, campanha, jogos: k >= 2 ? 3 : k + 1 });
  const medalha = /^medalha/.test(campanha);
  if (medalha) sel.medalhas = (sel.medalhas ?? 0) + 1;
  const nac = representacaoDe(v, e.modalidade);
  const texto = medalha ? `${campanha.charAt(0).toUpperCase()}${campanha.slice(1)} em ${nome.replace(/^o /, '')}, ${nac.naSelecao.replace(/^na /, 'pela ')}.` : `Disputou ${nome} ${nac.naSelecao.replace(/^na /, 'pela ')}: ${campanha}.`;
  escrever(v, { texto, relevancia: medalha ? 'marco' : 'biografia', tema: 'trabalho', tom: medalha ? 'bom' : k >= 2 ? undefined : 'ruim' });
  registrarConquista(v, { tipo: 'selecao', modalidade: e.modalidade, ano, competicao: nome, papel: 'protagonista', texto: medalha ? `${campanha.charAt(0).toUpperCase()}${campanha.slice(1)} — ${nome.replace(/^o /, '')}` : `${nome.charAt(0).toUpperCase()}${nome.slice(1)}: ${campanha}` });
  if (medalha) { marcar(v, 'conquista', texto, 3, { dominio: e.modalidade }); e.reputacao = clamp((e.reputacao ?? 30) + (campanha.endsWith('ouro') ? 4 : 2)); }
}

const FASES = ['caiu na fase de grupos', 'caiu nas oitavas', 'caiu nas quartas', 'caiu na semifinal', 'perdeu a final', 'foi campeã'];

function disputarTorneio(v: Vida, r: Rng, e: CarreiraEsportiva, sel: TrajetoriaNaSelecao, ano: number, nome: string, titular: boolean): void {
  // A campanha é da seleção (o mundo), com um pouco de quem joga: ninguém ganha torneio sozinho.
  const mundial = nome.includes('mundial') || nome.includes('multiesportivos');
  // A força do país em cada modalidade (no universo do jogo): a campanha é da seleção, não só de quem joga.
  const pesos = e.modalidade === 'futebol' || e.modalidade === 'volei'
    ? (mundial ? [0.15, 0.25, 0.27, 0.13, 0.08, 0.12] : [0.12, 0, 0.3, 0.25, 0.13, 0.2])
    : e.modalidade === 'tenis' ? [0.4, 0.3, 0.17, 0.08, 0.03, 0.02]
      : mundial ? [0.3, 0.3, 0.22, 0.1, 0.05, 0.03] : [0.15, 0, 0.35, 0.28, 0.12, 0.1];
  if (titular) { pesos[5] += 0.02; pesos[0] -= 0.02; }
  let x = r.next(), k = 0;
  for (; k < pesos.length - 1; k++) { x -= pesos[k]; if (x <= 0) break; }
  const jogos = [3, 4, 5, 6, 7, 7][k] ?? 3;
  const jogou = titular ? jogos : Math.round(jogos * 0.3);
  sel.torneios.push({ ano, nome, campanha: FASES[k], jogos: jogou });
  const g = ge(v);
  const nac = representacaoDe(v, e.modalidade);
  const campea = k === 5;
  const texto = campea
    ? `${flex(g, 'Campeão', 'Campeã', 'Campeão')} ${nome.replace(/^o /, 'do ').replace(/^a /, 'da ').replace(/^os /, 'dos ')} com ${nac.selecao}${titular ? `, ${flex(g, 'titular', 'titular')}` : ', no grupo'}.`
    : `Disputou ${nome} com ${nac.selecao}${titular ? ', como titular' : ''}: a ${e.modalidade === 'tenis' ? 'equipe' : 'seleção'} ${FASES[k]}.`;
  escrever(v, { texto, relevancia: campea || mundial ? 'marco' : 'biografia', tema: 'trabalho', tom: campea ? 'bom' : k >= 3 ? undefined : 'ruim' });
  const de = (n: string) => n.replace(/^o /, 'do ').replace(/^a /, 'da ').replace(/^os /, 'dos ');
  registrarConquista(v, { tipo: 'selecao', modalidade: e.modalidade, ano, competicao: nome, papel: titular ? 'protagonista' : 'elenco', texto: campea ? `${flex(g, 'Campeão', 'Campeã', 'Campeão')} ${de(nome)}` : `${nome.charAt(0).toUpperCase() + nome.slice(1)}: a ${e.modalidade === 'tenis' ? 'equipe' : 'seleção'} ${FASES[k]}` });
  if (campea) { marcar(v, 'conquista', texto, 3, { dominio: e.modalidade }); e.reputacao = clamp((e.reputacao ?? 30) + 3); }
}
