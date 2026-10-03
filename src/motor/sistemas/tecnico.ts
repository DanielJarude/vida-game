/**
 * Carreira de técnico 2.0 — o banco com gramática própria.
 *
 * Antes, `tecnico_futebol` era um emprego com outro nome: "um clube", salário
 * de tabela, a escada genérica de promoção e demissão. Agora, quem chega ao
 * comando técnico (pela comissão: auxiliar → técnico) dirige CLUBES REAIS do
 * catálogo (`dados/clubes`), em divisões (as mesmas da carreira de jogador), e
 * cada temporada é JOGADA:
 *
 *   o estadual (fase de grupos, semifinal, final) e a liga da divisão (turno e
 *   returno com os outros 19 times), partida a partida. A força do time é a
 *   do elenco (o porte do clube na divisão) + o trabalho do técnico (leitura,
 *   liderança, estrada no banco) + o vestiário + o que se preparou (reforços,
 *   titulares poupados) + a fase do ano. O jeito de jogar (ofensivo,
 *   equilibrado, defensivo) muda o DESENHO dos jogos — mais vitórias e
 *   derrotas, ou mais empates. A diretoria cobra pelo que esperava DAQUELE
 *   elenco: a pressão sobe e desce nos pontos de checagem, e o cargo cai.
 *
 * Tudo que a tela mostra sai daqui: J = V + E + D por temporada e por
 * passagem, títulos (estadual e da divisão), acessos, rebaixamentos,
 * demissões, renovações, convites. O nome no mercado (`reputacao`) abre
 * portas e paga mais — NÃO ganha jogo. O passado de jogador dá o primeiro
 * empurrão no nome (o clube lembra de quem jogou), nunca o resultado.
 *
 * A carreira de jogador continua onde estava (`caminhos.esporte`,
 * `carreirasEsportivas`): as duas trajetórias convivem na tela e no legado.
 *
 * A seleção (C3): o técnico de nome grande, com títulos na elite, pode ser
 * chamado. A passagem pela seleção é uma passagem como as outras (jogos,
 * V/E/D), com os torneios do calendário de seleções (`selecao.torneioDoAno`).
 */

import { nacionalidadesDaVida, paisDaVida } from '../mundo/vida';
import { noPais } from '../mundo/registro';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraDeTecnico, PassagemDeTecnico, PropostaDeTecnico, TabelaEmCurso, TemporadaDeTecnico, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { anoDe } from '../tempo';
import { aSelecao, clubePorNome, clubesDoPais, daCompeticao, divisaoDoNivel, clubesDoNivel, doClube, nivelDaCompeticao, noClube, nomeDaSelecao, oClube, type Clube } from '../dados/clubes';
import { capitalDoPais, grandesCentros, municipio, paisDaCidade } from '../dados/lugares';
import { ocupacao } from '../dados/ocupacoes';
import { habilidade } from './frentes';
import { contratar, encerrarEmprego } from './trabalho';
import { mudarAgora } from './processos';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { torneioDoAno } from './selecao';

export const OCUPACAO_TECNICO = 'tecnico_futebol';
/** A seleção que chama um técnico: a do país dele (a nacionalidade de nascença). Sede: a capital (no Brasil, o Rio da CBF). */
const selecaoDe = (v: Vida) => nomeDaSelecao(nacionalidadesDaVida(v)[0]);
const sedeDaSelecao = (pais: string) => (pais === 'BR' ? 'rio-de-janeiro-rj' : capitalDoPais(pais)?.id ?? grandesCentros(pais)[0]);

/* ------------------------------------------------------------ Leitura */

export const carreiraDeTecnico = (v: Vida): CarreiraDeTecnico | undefined => v.caminhos.tecnico;
/** A passagem em curso (a última, se ainda aberta). */
export function passagemAtual(v: Vida): PassagemDeTecnico | undefined {
  const c = v.caminhos.tecnico;
  const p = c?.passagens[c.passagens.length - 1];
  return p && p.ate === undefined ? p : undefined;
}
/** Está no comando de um time agora (o emprego e a passagem batem). */
export const noComando = (v: Vida) => !!passagemAtual(v) && v.trabalho.atual?.ocupacaoId === OCUPACAO_TECNICO;

const porteDe = (nome: string): Clube['porte'] | undefined => clubePorNome(nome)?.porte;
/** Onde o clube costuma jogar (a força do elenco na divisão) — a mesma régua da carreira de jogador. */
const tetoDoClube = (nome: string) => { const p = porteDe(nome); return !p ? 2 : p === 'grande' ? 4 : p === 'tradicional' ? 3 : 2; };
/** Até onde um acesso pode levar: o tradicional campeão da Série B sobe; o regional, até a Série B. */
const tetoDeAcesso = (nome: string) => Math.min(4, tetoDoClube(nome) + 1);
const pisoDoClube = (nome: string) => { const p = porteDe(nome); return !p ? 1 : p === 'grande' ? 3 : p === 'tradicional' ? 2 : 1; };
const nomeDaCompeticao = (nivel: number) => divisaoDoNivel(nivel) || 'copa regional';
/**
 * O torneio curto do começo da temporada: no Brasil, o estadual; fora, a copa
 * nacional (que existe em quase todo país: a Copa del Rey, a FA Cup, a Copa
 * Argentina) — dita pelo que é, sem nome próprio. Mesma simulação.
 */
const torneioCurto = (municipioId: string) => (paisDaCidade(municipioId) === 'BR'
  ? { nome: 'campeonato estadual', no: 'no campeonato estadual', campeao: 'estadual', rival: 'um time do interior' }
  : { nome: 'copa nacional', no: 'na copa nacional', campeao: 'da copa nacional', rival: 'um time menor' });
/** "da Série A", "do campeonato estadual", "das divisões de acesso". */
const daComp = (nivel: number) => daCompeticao(nomeDaCompeticao(nivel));

export interface ResumoDoTecnico { clubes: number; jogos: number; v: number; e: number; d: number; titulos: number; acessos: number; rebaixamentos: number; demissoes: number; renovacoes: number; aproveitamento: number; temporadas: number }

/** Os números da carreira inteira — a soma das passagens (que é a soma das temporadas). */
export function resumoDoTecnico(c: CarreiraDeTecnico): ResumoDoTecnico {
  const ts = c.passagens.flatMap(p => p.temporadas);
  const s = (f: (t: TemporadaDeTecnico) => number) => ts.reduce((a, t) => a + f(t), 0);
  const jogos = s(t => t.jogos), v = s(t => t.v), e = s(t => t.e), d = s(t => t.d);
  return {
    clubes: new Set(c.passagens.map(p => p.clube)).size, jogos, v, e, d,
    titulos: s(t => t.titulos?.length ?? 0), acessos: s(t => (t.acesso ? 1 : 0)), rebaixamentos: s(t => (t.rebaixamento ? 1 : 0)),
    demissoes: c.passagens.filter(p => p.saida === 'demissao').length, renovacoes: c.passagens.reduce((a, p) => a + (p.renovacoes ?? 0), 0),
    aproveitamento: jogos ? Math.round((v * 3 + e) / (jogos * 3) * 100) : 0, temporadas: ts.length
  };
}

export function resumoDaPassagem(p: PassagemDeTecnico): { jogos: number; v: number; e: number; d: number; titulos: string[]; aproveitamento: number } {
  const jogos = p.temporadas.reduce((a, t) => a + t.jogos, 0), v = p.temporadas.reduce((a, t) => a + t.v, 0), e = p.temporadas.reduce((a, t) => a + t.e, 0), d = p.temporadas.reduce((a, t) => a + t.d, 0);
  return { jogos, v, e, d, titulos: p.temporadas.flatMap(t => (t.titulos ?? []).map(x => `${x} (${t.ano})`)), aproveitamento: jogos ? Math.round((v * 3 + e) / (jogos * 3) * 100) : 0 };
}

/** Os anos da passagem como a tela mostra (os das temporadas jogadas; a passagem sem jogo, pelas datas). */
export function periodoDaPassagem(p: PassagemDeTecnico): { de: number; ate?: number } {
  const de = p.temporadas[0]?.ano ?? anoDe(p.desde - 6);
  return { de, ate: p.ate === undefined ? undefined : Math.max(de, p.temporadas[p.temporadas.length - 1]?.ano ?? anoDe(p.ate - 6)) };
}

const SAIDA: Record<NonNullable<PassagemDeTecnico['saida']>, string> = { demissao: 'demitido', proposta: 'saiu por proposta', fim_de_contrato: 'fim de contrato', saiu: 'pediu para sair', encerrou: 'encerrou a carreira', selecao: 'chamado pela seleção' };
export const comoAcabou = (v: Vida, p: PassagemDeTecnico) => (p.saida === 'saiu' && p.motivo ? p.motivo : p.saida === 'demissao' ? flex(ge(v), 'demitido', 'demitida') : p.saida === 'selecao' ? `${flex(ge(v), 'chamado', 'chamada')} pela seleção` : p.saida ? SAIDA[p.saida] : 'no cargo');

/** "6 clubes · 412 jogos · 221 vitórias · 103 empates · 88 derrotas · 4 títulos". */
export function linhaDoTecnico(c: CarreiraDeTecnico): string {
  const r = resumoDoTecnico(c);
  const pl = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  return [pl(r.clubes, 'clube', 'clubes'), pl(r.jogos, 'jogo', 'jogos'), pl(r.v, 'vitória', 'vitórias'), pl(r.e, 'empate', 'empates'), pl(r.d, 'derrota', 'derrotas'), pl(r.titulos, 'título', 'títulos')].join(' · ');
}

/* ------------------------------------------------------------ O técnico e o time */

/**
 * O trabalho do técnico em pontos de força (≈ −4..+5): leitura de jogo, liderança,
 * a estrada no banco e o futebol que se sabe. A fama e o nome NÃO entram.
 */
export function trabalhoDoTecnico(v: Vida): number {
  const anos = Math.min(12, anosNoBanco(v));
  const x = (v.mente.cognicao - 50) / 14 + (habilidade(v, 'lideranca') - 30) / 26 + anos / 6 + (Math.max(habilidade(v, 'futebol'), (v.caminhos.frentes.futebol?.auge ?? 0) * 0.85) - 60) / 36 + v.personalidade.tracos.disciplina / 140 - 0.8;
  return Math.round(clamp(x, -3, 3.5) * 10) / 10;
}
export function anosNoBanco(v: Vida): number {
  const c = v.caminhos.tecnico;
  if (!c) return 0;
  return c.passagens.reduce((a, p) => a + ((p.ate ?? v.t) - p.desde), 0) / 12;
}

/** A força do elenco do clube NA divisão (sem o técnico): o porte decide quem costuma brigar em cima. */
const elenco = (clube: string, nivel: number) => (tetoDoClube(clube) - nivel) * 2.5 + (porteDe(clube) === 'grande' ? 1 : 0);

interface Jogo { v: number; e: number; d: number }
/** Uma partida: a diferença de força decide a chance; o empate é mais provável entre iguais; o jeito de jogar muda o desenho. */
function partida(r: Rng, dif: number, estilo: CarreiraDeTecnico['estilo']): 'v' | 'e' | 'd' {
  const x = dif + (estilo === 'ofensivo' ? r.normal() * 1.2 + 0.3 : estilo === 'defensivo' ? -0.3 : 0);
  let pE = 0.28 - 0.1 * Math.min(1, Math.abs(x) / 8);
  if (estilo === 'ofensivo') pE *= 0.75; else if (estilo === 'defensivo') pE *= 1.3;
  const pV = (1 - pE) / (1 + Math.exp(-x / 3.5));
  const u = r.next();
  return u < pV ? 'v' : u < pV + pE ? 'e' : 'd';
}
const somar = (a: Jogo, k: 'v' | 'e' | 'd') => { a[k]++; };

/** A rodada-a-rodada de uma liga de `n` times (turno ou turno e returno), pelo método do círculo. */
function tabelaDeJogos(n: number, returno: boolean): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i);
  const rodadas: [number, number][][] = [];
  for (let k = 0; k < n - 1; k++) {
    const rod: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) rod.push(k % 2 ? [ids[n - 1 - i], ids[i]] : [ids[i], ids[n - 1 - i]]);
    rodadas.push(rod);
    ids.splice(1, 0, ids.pop()!);
  }
  return returno ? [...rodadas, ...rodadas.map(r => r.map(([a, b]) => [b, a] as [number, number]))] : rodadas;
}

/** O que a diretoria esperava deste elenco: a posição que a força dele dá entre os 20. */
const posicaoEsperada = (forcas: number[]) => 1 + forcas.slice(1).filter(f => f > forcas[0]).length;

/* ------------------------------------------------------------ O ano */

/**
 * O ano do técnico: começa a carreira (quem acabou de assumir o comando),
 * fecha o que ficou para trás, joga a temporada, cobra, renova, recebe
 * propostas. Roda depois do esporte e antes das situações (o momento do ano
 * lê o que a temporada deixou).
 */
export function processarTecnico(v: Vida, r: Rng): void {
  const emp = v.trabalho.atual;
  // Quem chegou ao comando agora (promovido de auxiliar, ou contratado): a carreira começa num clube de verdade.
  if (emp?.ocupacaoId === OCUPACAO_TECNICO && !passagemAtual(v)) iniciarComando(v, r);
  const car = v.caminhos.tecnico;
  if (!car || car.tFim !== undefined) return;
  const p = passagemAtual(v);
  // O emprego acabou por fora (mudança, outra profissão, aposentadoria): a passagem fecha com o que aconteceu.
  if (p && v.trabalho.atual?.ocupacaoId !== OCUPACAO_TECNICO) {
    const ultima = [...v.trabalho.historico].reverse().find(h => h.ocupacaoId === OCUPACAO_TECNICO);
    fecharPassagem(v, p, 'saiu');
    if (ultima) p.motivo = ultima.motivo;
    if (v.trabalho.atual) encerrarCarreiraDeTecnico(v, 'outra profissão');
    return;
  }
  if (car.proposta && v.t > car.proposta.validaAte) car.proposta = undefined;
  if (p) {
    // A final que ficou do ano passado sem o momento: decide-se sem escolha (o jeito de sempre).
    if (p.decisao) decidirFinal(v, r, 'neutro');
    if (p.selecao) jogarAnoDeSelecao(v, r, car, p); else jogarTemporada(v, r, car, p);
    if (!passagemAtual(v)) return;
    fimDeTemporada(v, r, car, passagemAtual(v)!);
  } else {
    semClube(v, r, car);
  }
}

/** O primeiro comando: um clube que caiba no nome (o passado de jogador ajuda a ser lembrado — só isso). */
function iniciarComando(v: Vida, r: Rng): void {
  const es = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].filter(x => x?.modalidade === 'futebol' && x.fase !== 'base');
  const exAtleta = es.length > 0;
  const nomeDeJogador = Math.max(0, ...es.map(x => (x!.reputacao ?? 30) * 0.4 + x!.nivel * 3));
  const c: CarreiraDeTecnico = v.caminhos.tecnico ?? { tInicio: v.t, origem: v.trabalho.atual?.postos?.some(x => x.ocupacaoId === 'auxiliar_tecnico') ? 'auxiliar' : exAtleta ? 'ex_atleta' : 'convite', reputacao: Math.round(clamp(18 + nomeDeJogador, 10, 55)), passagens: [] };
  v.caminhos.tecnico = c;
  c.tFim = undefined;
  // O primeiro clube: quem nunca dirigiu começa embaixo; o nome do ex-jogador abre a porta de um clube maior, não a da elite.
  const nivel = nivelPeloNome(c.reputacao);
  const ultimoClube = es.map(x => x!.clube).find(n => !!clubePorNome(n) && tetoDoClube(n) >= nivel && pisoDoClube(n) <= nivel);
  const clube = ultimoClube && r.chance(0.35) ? clubePorNome(ultimoClube)! : escolherClube(v, r, nivel);
  const prop: PropostaDeTecnico = { id: `tec_${v.t}_ini`, clube: clube.nome, municipioId: clube.cidade, nivel: nivelDoClube(clube, nivel), meses: 24, salario: salarioDeTecnico(clube.nome, nivel, c.reputacao), t: v.t, validaAte: v.t, origem: 'mercado' };
  assumir(v, r, c, prop, true);
}

/** A divisão que o nome abre (o mercado olha a reputação de técnico). */
const nivelPeloNome = (rep: number): 1 | 2 | 3 | 4 => (rep >= 74 ? 4 : rep >= 52 ? 3 : rep >= 32 ? 2 : 1);
const nivelDoClube = (c: Clube, alvo: number): 1 | 2 | 3 | 4 => clamp(alvo, c.porte === 'grande' ? 3 : c.porte === 'tradicional' ? 2 : 1, tetoDoClube(c.nome)) as 1 | 2 | 3 | 4;

/** Um clube do nível, de preferência no estado de quem procura (o mercado de técnico começa perto). */
function escolherClube(v: Vida, r: Rng, nivel: number, excluir?: string): Clube {
  const uf = municipio(v.moradia.municipioId).uf;
  // Quem demitiu há pouco não chama de volta; o clube de onde se acabou de sair, também não.
  const ps = v.caminhos.tecnico?.passagens ?? [];
  const fechados = new Set(ps.filter((p, k) => p.ate !== undefined && ((p.saida === 'demissao' && v.t - p.ate < 72) || (k === ps.length - 1 && v.t - p.ate < 36))).map(p => p.clube));
  const todos = clubesDoNivel(nivel, excluir);
  const lista = todos.filter(c => !fechados.has(c.nome)).length ? todos.filter(c => !fechados.has(c.nome)) : todos;
  const perto = lista.filter(c => municipio(c.cidade).uf === uf);
  return r.pick(perto.length && r.chance(0.6) ? perto : lista);
}

/** O salário do comando: a divisão, o porte do clube e o nome (o mercado de técnicos paga muito mais em cima). */
export function salarioDeTecnico(clube: string, nivel: number, rep: number): number {
  if (clube.startsWith('Seleção ')) return Math.round(260000 * (1 + rep / 300) / 100) * 100;
  const base = [0, 9000, 18000, 45000, 120000][nivel] ?? 9000;
  return Math.round(base * (porteDe(clube) === 'grande' ? 1.5 : 1) * (0.8 + rep / 250) / 100) * 100;
}

/** Executa ESTA proposta (a que a decisão mostrou): fecha a passagem atual, abre a nova, muda de cidade se preciso. */
function assumir(v: Vida, r: Rng, c: CarreiraDeTecnico, p: PropostaDeTecnico, primeira = false): void {
  const atual = passagemAtual(v);
  if (atual) fecharPassagem(v, atual, p.selecao ? 'selecao' : 'proposta');
  const nova: PassagemDeTecnico = { clube: p.clube, municipioId: p.municipioId, nivel: p.nivel, desde: v.t, contratoAte: v.t + p.meses, salario: p.salario, temporadas: [], pressao: porteDe(p.clube) === 'grande' || p.selecao ? 40 : 30, vestiario: 55, ...(p.selecao ? { selecao: true } : {}) };
  // No meio da temporada: o time é pego DAQUELA tabela (a que a proposta mostrou); a diretoria dá a lua de mel de quem chega para apagar incêndio.
  const meio = p.meioDeTemporada;
  if (meio && p.nivel >= 2) {
    nova.meioDeTemporada = { rodada: meio.rodada, rodadas: meio.rodadas, posicao: meio.posicao };
    nova.retomada = { ...meio, pontos: [...meio.pontos], forcas: [...meio.forcas] };
    nova.pressao = 25;
  }
  c.passagens.push(nova);
  c.semClubeDesde = undefined;
  c.proposta = undefined;
  let emp = v.trabalho.atual;
  if (!emp || emp.ocupacaoId !== OCUPACAO_TECNICO) emp = contratar(v, r, ocupacao(OCUPACAO_TECNICO), 'oportunidade');
  emp.empregador = p.selecao ? aSelecao(p.clube) : oClube(p.clube);
  emp.salario = p.salario;
  emp.tPosto = v.t;
  // A cidade do clube (a seleção não muda ninguém de cidade).
  if (!p.selecao && p.municipioId !== v.moradia.municipioId) { emp.municipioId = p.municipioId; mudarAgora(v, p.municipioId, `para dirigir ${oClube(p.clube)}`); }
  const g = ge(v);
  const texto = p.selecao
    ? `${flex(g, 'Chamado', 'Chamada')} para dirigir ${aSelecao(p.clube)}, aos ${idade(v)}.`
    : nova.meioDeTemporada
      ? `No meio da temporada: ${flex(g, 'assumiu', 'assumiu')} ${oClube(p.clube)} em ${nova.meioDeTemporada.posicao}º lugar, depois de ${nova.meioDeTemporada.rodada} rodadas ${daComp(p.nivel)}, em ${municipio(p.municipioId).nome}.`
    : primeira
      ? `${flex(g, 'Assumiu', 'Assumiu')} o comando técnico ${doClube(p.clube)}, ${p.nivel === 1 && paisDaCidade(p.municipioId) === 'BR' ? 'no campeonato estadual' : `na ${divisaoDoNivel(p.nivel, paisDaCidade(p.municipioId))}`.replace('na divisões', 'nas divisões')}: a primeira vez como ${flex(g, 'técnico', 'técnica')} principal.`
      : `Novo clube: ${flex(g, 'técnico', 'técnica')} ${doClube(p.clube)} (${divisaoDoNivel(p.nivel, paisDaCidade(p.municipioId))}), em ${municipio(p.municipioId).nome}${paisDaCidade(p.municipioId) !== paisDaVida(v) ? `, ${noPais(paisDaCidade(p.municipioId))}` : ''}.`;
  escrever(v, { texto, relevancia: p.selecao || primeira ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
  marcar(v, p.selecao ? 'conquista' : primeira ? 'lideranca' : 'transferencia', texto, p.selecao || primeira ? 3 : 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
}

/** Fecha uma passagem (com o motivo). Quem é demitido perde o emprego; quem sai por proposta, não. */
function fecharPassagem(v: Vida, p: PassagemDeTecnico, saida: NonNullable<PassagemDeTecnico['saida']>): void {
  p.ate = v.t;
  p.saida = saida;
  p.decisao = undefined;
  const c = v.caminhos.tecnico!;
  if (saida === 'demissao' || saida === 'fim_de_contrato' || saida === 'saiu') c.semClubeDesde = v.t;
  if ((saida === 'demissao' || saida === 'fim_de_contrato') && v.trabalho.atual?.ocupacaoId === OCUPACAO_TECNICO) encerrarEmprego(v, saida === 'demissao' ? 'demitido do comando técnico' : 'fim do contrato de técnico');
}

/** Sair do clube por decisão própria (entregar o cargo, não renovar): a passagem fecha, o emprego acaba, o telefone fica. */
export function deixarOClube(v: Vida, saida: 'saiu' | 'fim_de_contrato'): void {
  const p = passagemAtual(v);
  if (!p) return;
  fecharPassagem(v, p, saida);
  if (v.trabalho.atual?.ocupacaoId === OCUPACAO_TECNICO) encerrarEmprego(v, saida === 'saiu' ? 'entregou o cargo de técnico' : 'fim do contrato de técnico');
  escrever(v, { texto: saida === 'saiu' ? `Entregou o cargo ${doClube(p.clube)}.` : `Decidiu não renovar com ${oClube(p.clube)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
}
/** A demissão que um momento produziu (o jogo que podia salvar o cargo, perdido). */
export function demitirDoComando(v: Vida): void {
  const p = passagemAtual(v);
  if (p) demitir(v, p, p.temporadas[p.temporadas.length - 1]);
}

export function encerrarCarreiraDeTecnico(v: Vida, motivo: string): void {
  const c = v.caminhos.tecnico;
  if (!c || c.tFim !== undefined) return;
  const p = passagemAtual(v);
  if (p) fecharPassagem(v, p, 'encerrou');
  c.tFim = v.t;
  c.motivoFim = motivo;
  c.proposta = undefined;
  if (resumoDoTecnico(c).jogos > 0) escrever(v, { texto: `Fim da carreira de ${flex(ge(v), 'técnico', 'técnica')} (${motivo}): ${linhaDoTecnico(c)}.`, relevancia: 'biografia', tema: 'trabalho' });
}

/* ------------------------------------------------------------ A temporada de clube */

function jogarTemporada(v: Vida, r: Rng, c: CarreiraDeTecnico, p: PassagemDeTecnico): void {
  const ano = anoDe(v.t - 6);
  const t: TemporadaDeTecnico = { ano, nivel: p.nivel, jogos: 0, v: 0, e: 0, d: 0 };
  p.temporadas.push(t);
  const tecnico = trabalhoDoTecnico(v);
  const forma = r.normal() * 1.5;
  const g = ge(v);
  const nosso = (base: number) => base + tecnico + (p.vestiario - 50) / 12 + (p.ajuste ?? 0) + forma;
  p.ajuste = undefined;
  const placar: Jogo = { v: 0, e: 0, d: 0 };
  const conta = (k: 'v' | 'e' | 'd') => { somar(placar, k); t.jogos++; t[k]++; };

  // 0. Quem chegou no meio da temporada: o estadual já passou; a liga continua da tabela do dia — só os jogos daqui em diante são seus.
  const ret = p.retomada;
  p.retomada = undefined;
  if (ret && p.nivel >= 2) { t.desdeRodada = ret.rodada; jogarLiga(v, r, c, p, t, nosso, conta, ret); return; }

  // 1. O estadual: o porte no estado (o grande da capital contra o time do interior), fase única e mata-mata.
  const uf = municipio(p.municipioId).uf;
  const rivais = clubesDoPais().filter(k => k.nome !== p.clube && municipio(k.cidade).uf === uf);
  const valorNoEstado = (k?: Clube['porte']) => (k === 'grande' ? 6 : k === 'tradicional' ? 3 : 0);
  const est = [nosso(valorNoEstado(porteDe(p.clube))), ...rivais.slice(0, 11).map(k => valorNoEstado(k.porte) + r.normal() * 1.5)];
  while (est.length < 12) est.push(-1.5 + r.normal() * 1.5);
  const nomes = ['', ...rivais.slice(0, 11).map(k => k.nome)];
  const pts = new Array(12).fill(0);
  for (const rod of tabelaDeJogos(12, false)) for (const [a, b] of rod) jogar(r, est, pts, a, b, 1, c.estilo, conta);
  const ordem = pts.map((x, i) => ({ i, x: x + est[i] * 0.01 })).sort((a, b) => b.x - a.x).map(o => o.i);
  t.estadual = 'primeira fase';
  if (ordem.indexOf(0) < 4) {
    const adv = ordem[3 - ordem.indexOf(0)];
    const semi = [partida(r, est[0] - est[adv] + 1, c.estilo), partida(r, est[0] - est[adv] - 1, c.estilo)];
    semi.forEach(conta);
    const saldo = semi.filter(x => x === 'v').length - semi.filter(x => x === 'd').length;
    const passa = saldo > 0 || (saldo === 0 && ordem.indexOf(0) < ordem.indexOf(adv));
    t.estadual = 'semifinal';
    if (passa) {
      // A final fica para o momento do ano (`situacoes`: a escolha de como jogá-la) — ou para o sorteio neutro.
      const outros = ordem.slice(0, 4).filter(i => i !== 0 && i !== adv);
      const fin = outros.sort((a, b) => est[b] - est[a])[r.chance(0.65) ? 0 : 1] ?? outros[0];
      t.estadual = 'vice';
      p.decisao = { competicao: torneioCurto(p.municipioId).nome, adversario: nomes[fin] || torneioCurto(p.municipioId).rival, forca: Math.round((est[0] - est[fin]) * 10) / 10, ano, t: v.t };
    }
  }
  // Ponto de checagem: o estadual (o grande sente mais; para o clube pequeno, o estadual é o ano inteiro).
  const posEstadual = ordem.indexOf(0) + 1;
  const esperadaNoEstado = 1 + est.slice(1).filter(f => f > valorNoEstado(porteDe(p.clube))).length;
  if (checar(v, r, p, t, posEstadual, esperadaNoEstado, porteDe(p.clube) === 'grande' ? 1.3 : p.nivel === 1 ? 1 : 0.6)) return;

  // 2. A liga da divisão (o estadual é a liga de quem está no nível 1: os dois primeiros ganham a vaga nas divisões de acesso).
  if (p.nivel === 1) {
    t.colocacao = posEstadual;
    if (posEstadual <= 2 && tetoDeAcesso(p.clube) > 1) {
      t.acesso = true;
      p.nivel = 2;
      escrever(v, { texto: `Acesso: ${oClube(p.clube)} ganhou a vaga nas divisões de acesso com você no banco (${posEstadual}º no estadual).`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      marcar(v, 'conquista', `Acesso com ${oClube(p.clube)} como ${flex(g, 'técnico', 'técnica')}.`, 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
      c.reputacao = clamp(c.reputacao + 4);
      p.pressao = clamp(p.pressao - 20);
    }
    c.reputacao = clamp(c.reputacao + clamp((esperadaNoEstado - posEstadual) * 0.4, -3, 3));
    return;
  }
  jogarLiga(v, r, c, p, t, nosso, conta);
}

/**
 * A liga da divisão, rodada a rodada. Com `ret` (quem assumiu no meio): a
 * tabela do dia da contratação — os pontos e as forças daquele dia — e só as
 * rodadas que faltam; a diretoria cobra pela metade do caminho entre o que o
 * elenco prometia e onde o time estava, e o nome sobe ou desce pelo que se
 * recuperou desde a chegada.
 */
function jogarLiga(v: Vida, r: Rng, c: CarreiraDeTecnico, p: PassagemDeTecnico, t: TemporadaDeTecnico, nosso: (base: number) => number, conta: (k: 'v' | 'e' | 'd') => void, ret?: TabelaEmCurso): void {
  const g = ge(v);
  const forcas = ret ? ret.forcas : [elenco(p.clube, p.nivel), ...Array.from({ length: 19 }, () => r.normal() * 3.2)];
  const esperada = ret ? Math.round((ret.esperada + ret.posicao) / 2) : posicaoEsperada(forcas);
  const reais = forcas.map((f, i) => (i === 0 ? nosso(f) : ret ? f : f + r.normal() * 1.2));
  const pl = ret ? [...ret.pontos] : new Array(20).fill(0);
  const rodadas = tabelaDeJogos(20, p.nivel >= 3);
  const checks = [Math.floor(rodadas.length / 3), Math.floor(rodadas.length * 2 / 3)];
  if (ret) t.colocacao = ret.posicao;
  for (let k = ret?.rodada ?? 0; k < rodadas.length; k++) {
    for (const [a, b] of rodadas[k]) jogar(r, reais, pl, a, b, 1.5, c.estilo, conta);
    const pos = 1 + pl.filter((x, i) => i !== 0 && (x > pl[0] || (x === pl[0] && reais[i] > reais[0]))).length;
    t.colocacao = pos;
    if (checks.includes(k + 1) && checar(v, r, p, t, pos, esperada, porteDe(p.clube) === 'grande' ? 1.2 : 1)) return;
  }
  const pos = t.colocacao ?? 10;
  if (pos === 1) {
    const titulo = `${flex(g, 'Campeão', 'Campeã')} ${daComp(p.nivel)}`;
    (t.titulos ??= []).push(titulo);
    const texto = `${flex(g, 'Campeão', 'Campeã')} ${daComp(p.nivel)} como ${flex(g, 'técnico', 'técnica')} ${doClube(p.clube)} (${t.ano}): ${t.v} vitórias, ${t.e} empates e ${t.d} derrotas no ano.`;
    escrever(v, { texto, relevancia: p.nivel >= 3 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, p.nivel >= 3 ? 3 : 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
    c.reputacao = clamp(c.reputacao + 3 + p.nivel * 1.5);
    p.pressao = clamp(p.pressao - 30);
  }
  if (p.nivel < 4 && pos <= 4 && tetoDeAcesso(p.clube) > p.nivel && (pos <= 2 || tetoDoClube(p.clube) > p.nivel)) {
    t.acesso = true;
    p.nivel = (p.nivel + 1) as 1 | 2 | 3 | 4;
    escrever(v, { texto: `Acesso: ${oClube(p.clube)} subiu para a ${divisaoDoNivel(p.nivel, paisDaCidade(p.municipioId))} com você no banco (${pos}º lugar).`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', `Acesso com ${oClube(p.clube)} como ${flex(g, 'técnico', 'técnica')}.`, 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
    c.reputacao = clamp(c.reputacao + 4);
    p.pressao = clamp(p.pressao - 25);
  } else if (pos >= 17 && p.nivel - 1 >= pisoDoClube(p.clube)) {
    t.rebaixamento = true;
    p.nivel = (p.nivel - 1) as 1 | 2 | 3 | 4;
    escrever(v, { texto: `${oClube(p.clube).replace(/^./, x => x.toUpperCase())} caiu com você no banco: ${pos}º lugar ${daComp(p.nivel + 1)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    c.reputacao = clamp(c.reputacao - 6);
    p.pressao = clamp(p.pressao + 40);
    abalar(v, 'o rebaixamento do time que você dirigia', -5, 4);
  }
  // O que a diretoria leu no ano: a posição contra o que o elenco prometia (quem chegou no meio: contra onde pegou o time).
  c.reputacao = clamp(c.reputacao + clamp(((ret ? ret.posicao : esperada) - pos) * 0.5, -3, 4));
}

/**
 * Um jogo da tabela (`a` em casa): o do seu time é visto do seu lado (o jeito de
 * jogar é seu); os outros, pela força. Os pontos vão para a tabela.
 */
function jogar(r: Rng, f: number[], pts: number[], a: number, b: number, casa: number, estilo: CarreiraDeTecnico['estilo'], conta: (k: 'v' | 'e' | 'd') => void): void {
  let res: 'v' | 'e' | 'd';
  if (a === 0) { res = partida(r, f[0] - f[b] + casa, estilo); conta(res); }
  else if (b === 0) { const nosso = partida(r, f[0] - f[a] - casa, estilo); conta(nosso); res = nosso === 'v' ? 'd' : nosso === 'd' ? 'v' : 'e'; }
  else res = partida(r, f[a] - f[b] + casa, undefined);
  pts[a] += res === 'v' ? 3 : res === 'e' ? 1 : 0;
  pts[b] += res === 'd' ? 3 : res === 'e' ? 1 : 0;
}

/**
 * Um ponto de checagem: a pressão sobe ou desce pela posição contra o que o
 * elenco prometia — e, perto do alto, o cargo cai. Devolve se foi demitido.
 */
function checar(v: Vida, r: Rng, p: PassagemDeTecnico, t: TemporadaDeTecnico, pos: number, esperada: number, peso: number): boolean {
  p.pressao = clamp(p.pressao + ((pos - esperada) * 3 + (pos >= 17 ? 8 : 0) - (pos <= 4 ? 4 : 0)) * peso);
  const chance = clamp((p.pressao - 58) / 30, 0, 0.85);
  if (!r.chance(chance)) return false;
  t.parcial = true;
  demitir(v, p, t, pos);
  return true;
}

function demitir(v: Vida, p: PassagemDeTecnico, t: TemporadaDeTecnico | undefined, pos?: number): void {
  const c = v.caminhos.tecnico!;
  const r = resumoDaPassagem(p);
  fecharPassagem(v, p, 'demissao');
  c.reputacao = clamp(c.reputacao - 5);
  const g = ge(v);
  const texto = `${flex(g, 'Demitido', 'Demitida')} ${doClube(p.clube)}${t?.parcial && pos ? ` com o time em ${pos}º lugar` : ''}: ${r.jogos} jogos, ${r.v} vitórias, ${r.e} empates e ${r.d} derrotas na passagem.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'demissao', texto, 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
  abalar(v, 'a demissão do comando técnico', -6, 6);
}

/** Fim da temporada: o contrato (renovar ou acabar), a pressão que fica, e o mercado (outro clube quer). */
function fimDeTemporada(v: Vida, r: Rng, c: CarreiraDeTecnico, p: PassagemDeTecnico): void {
  const t = p.temporadas[p.temporadas.length - 1];
  // Rebaixado com a pressão no alto: a diretoria quase sempre troca.
  if (t?.rebaixamento && r.chance(p.pressao >= 70 ? 0.75 : 0.4)) { demitir(v, p, undefined); return; }
  // A pressão volta para o normal do clube — e o normal sobe com o tempo: quem fica muito, deve mais.
  const anosAqui = (v.t - p.desde) / 12;
  p.pressao = Math.round(clamp(p.pressao + (38 + Math.min(30, anosAqui * 4) - p.pressao) * 0.3));
  p.vestiario = Math.round(clamp(p.vestiario + (55 - p.vestiario) * 0.3));
  c.reputacao = Math.round(clamp(c.reputacao + (40 - c.reputacao) * 0.03, 0, 100));
  // O contrato acaba antes do fim da próxima temporada: renovar ou não é a conversa deste fim de ano.
  if (p.contratoAte < v.t + 12) {
    if (p.pressao <= 55 || (t?.titulos?.length ?? 0) > 0 || t?.acesso) {
      p.contratoAte = v.t + 24;
      p.renovacoes = (p.renovacoes ?? 0) + 1;
      p.tRenovacao = v.t;
      p.salario = Math.max(p.salario, salarioDeTecnico(p.clube, p.nivel, c.reputacao));
      if (v.trabalho.atual?.ocupacaoId === OCUPACAO_TECNICO) v.trabalho.atual.salario = p.salario;
      // A renovação conta a história da passagem (não a mesma frase a cada dois anos).
      const n = p.renovacoes;
      const anosNoClube = Math.max(1, Math.round((v.t - p.desde) / 12));
      escrever(v, { texto: n <= 1 ? `Renovou com ${oClube(p.clube)} por mais dois anos.` : n === 2 ? `Mais dois anos ${noClube(p.clube)}: a diretoria nem esperou o fim do contrato.` : `Renovou de novo ${noClube(p.clube)} — já são ${anosNoClube} anos no mesmo banco, coisa rara no futebol.`, relevancia: n >= 3 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom' });
    } else {
      fecharPassagem(v, p, 'fim_de_contrato');
      escrever(v, { texto: `O contrato com ${oClube(p.clube)} acabou e a diretoria não renovou.`, relevancia: 'biografia', tema: 'trabalho' });
      return;
    }
  }
  // O mercado: quem faz um bom trabalho é chamado por clube maior (ou pela seleção).
  if (!c.proposta && (t?.titulos?.length || t?.acesso || (t?.colocacao ?? 20) <= 6) && r.chance(0.22 + c.reputacao / 300)) {
    const selecao = convidarSelecao(v, r, c);
    if (selecao) return;
    const alvo = Math.min(4, Math.max(p.nivel, nivelPeloNome(c.reputacao) + (r.chance(0.3) ? 1 : 0))) as 1 | 2 | 3 | 4;
    if (alvo > p.nivel || (alvo === p.nivel && porteDe(p.clube) !== 'grande' && r.chance(0.4))) criarPropostaDeTecnico(v, r, c, alvo, 'mercado', p.clube);
  }
}

/** Sem clube: o telefone toca pelo nome — ou não toca. Anos demais sem clube, a carreira no banco acaba. */
function semClube(v: Vida, r: Rng, c: CarreiraDeTecnico): void {
  c.semClubeDesde ??= v.t;
  const anos = (v.t - c.semClubeDesde) / 12;
  // Entre um clube e outro, a vida segue (outro trabalho, o comentário na TV): o telefone ainda pode tocar.
  // Quatro anos sem banco, a carreira de técnico acabou — e quem está noutra profissão, ficou nela.
  if (anos >= 4 || idade(v) >= 72) { encerrarCarreiraDeTecnico(v, idade(v) >= 72 ? 'a idade' : v.trabalho.atual ? 'outra profissão' : 'anos sem clube'); return; }
  if (c.proposta) return;
  if (convidarSelecao(v, r, c)) return;
  if (r.chance(clamp(0.35 + c.reputacao / 150 - anos * 0.08 - (v.trabalho.atual ? 0.1 : 0), 0.1, 0.9))) {
    const alvo = Math.max(1, nivelPeloNome(c.reputacao) - (r.chance(0.4) ? 1 : 0)) as 1 | 2 | 3 | 4;
    criarPropostaDeTecnico(v, r, c, alvo, 'sem_clube');
    return;
  }
  // No meio da temporada, algum clube afunda e troca de técnico: quem está sem clube é quem atende o telefone.
  if (r.chance(clamp(0.3 + c.reputacao / 200 - anos * 0.05, 0.1, 0.5))) propostaDeCrise(v, r, c);
}

/**
 * A liga até o dia da crise, SEM você: o clube joga com o técnico que não deu
 * certo (o elenco rende abaixo do que é), rodada a rodada, até um ponto do
 * meio da temporada. Se a tabela mostra crise — bem abaixo do que o elenco
 * prometia, ou na zona de rebaixamento —, o técnico cai; senão, ninguém liga.
 */
export function ligaAteACrise(r: Rng, clube: string, nivel: 2 | 3 | 4): TabelaEmCurso | undefined {
  const forcas = [elenco(clube, nivel), ...Array.from({ length: 19 }, () => r.normal() * 3.2)];
  const esperada = posicaoEsperada(forcas);
  const reais = forcas.map((f, i) => (i === 0 ? f - 1.5 + r.normal() * 1.5 : f + r.normal() * 1.2));
  const pontos = new Array(20).fill(0);
  const rodadas = tabelaDeJogos(20, nivel >= 3);
  const rodada = r.int(Math.floor(rodadas.length * 0.25), Math.floor(rodadas.length * 0.7));
  for (let k = 0; k < rodada; k++) for (const [a, b] of rodadas[k]) jogar(r, reais, pontos, a, b, 1.5, undefined, () => undefined);
  const posicao = 1 + pontos.filter((x, i) => i !== 0 && (x > pontos[0] || (x === pontos[0] && reais[i] > reais[0]))).length;
  if (posicao < Math.max(esperada + 5, 13) && posicao < 17) return undefined;
  // Índice 0: só o elenco (o técnico novo entra por cima); os outros, a força que mostraram.
  return { rodada, rodadas: rodadas.length, posicao, esperada, pontos, forcas: [forcas[0], ...reais.slice(1)] };
}

/** A proposta do clube em crise (criada UMA vez, com a tabela do dia): a que a decisão mostra e a que se executa. */
export function propostaDeCrise(v: Vida, r: Rng, c: CarreiraDeTecnico): PropostaDeTecnico | undefined {
  const alvo = clamp(nivelPeloNome(c.reputacao) + (r.chance(0.3) ? 1 : 0), 2, 4);
  for (let k = 0; k < 4; k++) {
    const clube = escolherClube(v, r, alvo);
    const nivel = nivelDoClube(clube, alvo);
    if (nivel < 2) continue;
    const tabela = ligaAteACrise(r, clube.nome, nivel as 2 | 3 | 4);
    if (!tabela) continue;
    const p: PropostaDeTecnico = { id: `tec_${v.t}_crise_${clube.nome}`, clube: clube.nome, municipioId: clube.cidade, nivel, meses: 24, salario: salarioDeTecnico(clube.nome, nivel, c.reputacao), t: v.t, validaAte: v.t + 1, origem: 'crise', meioDeTemporada: tabela };
    c.proposta = p;
    c.convites = (c.convites ?? 0) + 1;
    v.fatos['tec_proposta_hoje'] = v.t;
    return p;
  }
  return undefined;
}

/** A seleção chama quem tem nome grande e títulos na elite (raro; o mérito decide, não a fama). */
function convidarSelecao(v: Vida, r: Rng, c: CarreiraDeTecnico): boolean {
  if (c.passagens.some(p => p.selecao) || idade(v) < 40 || c.reputacao < 80) return false;
  const titulosElite = c.passagens.flatMap(p => p.temporadas).filter(t => t.nivel === 4 && (t.titulos ?? []).some(x => nivelDaCompeticao(x) === 4)).length;
  if (titulosElite < 1 || !r.chance(0.12 + titulosElite * 0.04)) return false;
  criarPropostaDeTecnico(v, r, c, 4, 'selecao');
  return true;
}

/** Uma proposta concreta (criada UMA vez): clube, cidade, divisão, prazo e salário fixados aqui. */
export function criarPropostaDeTecnico(v: Vida, r: Rng, c: CarreiraDeTecnico, nivel: 1 | 2 | 3 | 4, origem: PropostaDeTecnico['origem'], excluir?: string): PropostaDeTecnico {
  const sel = origem === 'selecao';
  const clube = sel ? undefined : escolherClube(v, r, nivel, excluir);
  const p: PropostaDeTecnico = sel
    ? { id: `tec_${v.t}_sel`, clube: selecaoDe(v), municipioId: sedeDaSelecao(nacionalidadesDaVida(v)[0]), nivel: 4, meses: 48, salario: salarioDeTecnico(selecaoDe(v), 4, c.reputacao), t: v.t, validaAte: v.t + 12, origem, selecao: true }
    : { id: `tec_${v.t}_${clube!.nome}`, clube: clube!.nome, municipioId: clube!.cidade, nivel: nivelDoClube(clube!, nivel), meses: 24, salario: salarioDeTecnico(clube!.nome, nivelDoClube(clube!, nivel), c.reputacao), t: v.t, validaAte: v.t + 12, origem };
  c.proposta = p;
  c.convites = (c.convites ?? 0) + 1;
  v.fatos['tec_proposta_hoje'] = v.t;
  return p;
}

export const propostaDeTecnico = (v: Vida): PropostaDeTecnico | undefined => { const p = v.caminhos.tecnico?.proposta; return p && v.t <= p.validaAte ? p : undefined; };

/** Aceita a proposta da mesa — a MESMA que a decisão mostrou (nada é sorteado de novo). */
export function aceitarPropostaDeTecnico(v: Vida, r: Rng, id: string): boolean {
  const c = v.caminhos.tecnico;
  const p = c?.proposta;
  if (!c || !p || p.id !== id) return false;
  assumir(v, r, c, p);
  return true;
}
export function recusarPropostaDeTecnico(v: Vida): void {
  const c = v.caminhos.tecnico;
  if (c?.proposta) { escrever(v, { texto: `Recusou a proposta ${p2(c.proposta)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true }); c.proposta = undefined; }
}
const p2 = (p: PropostaDeTecnico) => (p.selecao ? 'da seleção' : doClube(p.clube));

/* ------------------------------------------------------------ A final (o momento a decide) */

/**
 * Resolve a final pendente: `ótimo`/`bom` é título; `ruim`/`péssimo`, vice.
 * Os dois jogos entram na temporada (J = V + E + D continua valendo).
 * `neutro`: o ano não mostrou o momento — a final é jogada pela força.
 */
export function decidirFinal(v: Vida, r: Rng, como: 'otimo' | 'bom' | 'ruim' | 'pessimo' | 'neutro'): boolean | undefined {
  const p = passagemAtual(v);
  const d = p?.decisao;
  if (!p || !d) return undefined;
  const t = p.temporadas.find(x => x.ano === d.ano) ?? p.temporadas[p.temporadas.length - 1];
  const c = v.caminhos.tecnico!;
  const g = ge(v);
  const venceu = como === 'neutro' ? r.chance(1 / (1 + Math.exp(-d.forca / 2.5))) : como === 'otimo' || como === 'bom';
  // Os dois jogos: quem ganha a final ganha (ou empata) os dois; o ótimo é vitória nas duas.
  const jogos: ('v' | 'e' | 'd')[] = venceu ? (como === 'otimo' ? ['v', 'v'] : r.chance(0.5) ? ['v', 'e'] : ['e', 'v']) : (como === 'pessimo' ? ['d', 'd'] : r.chance(0.5) ? ['d', 'e'] : ['e', 'd']);
  if (t) for (const k of jogos) { t.jogos++; t[k]++; }
  p.decisao = undefined;
  if (venceu) {
    const tc = torneioCurto(p.municipioId);
    if (t) { t.estadual = 'campeão'; (t.titulos ??= []).push(`${flex(g, 'Campeão', 'Campeã')} ${tc.campeao}`); }
    c.reputacao = clamp(c.reputacao + 3);
    p.pressao = clamp(p.pressao - 15);
    const texto = `${flex(g, 'Campeão', 'Campeã')} ${tc.campeao} com ${oClube(p.clube)} (${d.ano}), contra ${oClube(d.adversario).replace(/^o um/, 'um')} na final.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
  } else {
    if (t) t.estadual = 'vice';
    p.pressao = clamp(p.pressao + (porteDe(p.clube) === 'grande' ? 10 : 4));
  }
  return venceu;
}

/* ------------------------------------------------------------ A seleção (C3) */

/**
 * O ano na seleção: amistosos e eliminatórias (≈10 jogos, a seleção é mais
 * forte que a média dos adversários) e, quando o calendário tem, o torneio
 * (`torneioDoAno`): três jogos de grupo e o mata-mata. Cair cedo num torneio
 * grande custa o cargo com frequência.
 */
function jogarAnoDeSelecao(v: Vida, r: Rng, c: CarreiraDeTecnico, p: PassagemDeTecnico): void {
  const ano = anoDe(v.t - 6);
  const t: TemporadaDeTecnico = { ano, nivel: 4, jogos: 0, v: 0, e: 0, d: 0 };
  p.temporadas.push(t);
  const forca = 2.5 + trabalhoDoTecnico(v) * 0.6 + (p.vestiario - 50) / 14 + r.normal() * 1.2;
  const conta = (k: 'v' | 'e' | 'd') => { t.jogos++; t[k]++; };
  for (let k = 0; k < 10; k++) conta(partida(r, forca - r.normal() * 3, c.estilo));
  const torneio = torneioDoAno('futebol', ano);
  if (!torneio) return;
  t.torneio = torneio;
  let pontos = 0;
  for (let k = 0; k < 3; k++) { const x = partida(r, forca - 1 - r.next() * 3, c.estilo); conta(x); pontos += x === 'v' ? 3 : x === 'e' ? 1 : 0; }
  const fases = ['caiu na fase de grupos', 'caiu nas oitavas', 'caiu nas quartas', 'caiu na semifinal', 'perdeu a final', 'foi campeã'];
  let fase = 0;
  if (pontos >= 4 || (pontos === 3 && r.chance(0.5))) {
    fase = 1;
    for (let k = 0; k < 4; k++) {
      const x = partida(r, forca - 2 - k * 0.8 - r.next() * 2, c.estilo);
      // No mata-mata, o empate vai aos pênaltis.
      const passou = x === 'v' || (x === 'e' && r.chance(0.5));
      conta(x);
      if (!passou) break;
      fase++;
    }
  }
  const g = ge(v);
  const de = torneio.replace(/^o /, 'do ');
  if (fase === 5) {
    (t.titulos ??= []).push(`Campeão ${de}`.replace('Campeão', flex(g, 'Campeão', 'Campeã')));
    const texto = `${flex(g, 'Campeão', 'Campeã')} ${de} como ${flex(g, 'técnico', 'técnica')} da ${aSelecao(selecaoDe(v)).replace(/^a /, '')} (${ano}).`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: 'futebol', ocupacaoId: OCUPACAO_TECNICO });
    c.reputacao = clamp(c.reputacao + 6);
    p.pressao = clamp(p.pressao - 30);
  } else {
    escrever(v, { texto: `${torneio.charAt(0).toUpperCase()}${torneio.slice(1)}: a seleção que você dirigia ${fases[fase]}.`, relevancia: torneio.includes('mundial') ? 'marco' : 'biografia', tema: 'trabalho', tom: fase >= 3 ? undefined : 'ruim' });
    p.pressao = clamp(p.pressao + (fase <= 2 ? (torneio.includes('mundial') ? 45 : 30) : 5));
    if (p.pressao >= 70 && r.chance(0.7)) demitir(v, p, t);
  }
}
