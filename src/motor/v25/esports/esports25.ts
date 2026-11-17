/**
 * VIDA 25 · E-SPORTS — a carreira de jogador profissional, do ranqueado ao mundial (catálogo em `jogos25`).
 *
 * O CAMINHO (cinco degraus, com os nomes reais de cada jogo e de cada época):
 *   1 ranqueadas e copas online → 2 cenário aberto (qualificatórias, LAN, Premier, divisões de base do FNCS)
 *   → 3 segunda divisão (Challengers, Circuito Desafiante, Top 16 do RLCS…) → 4 liga principal (VCT Americas, CBLOL,
 *   ESL Pro League, liga sul-americana do R6, Majors do RLCS, Divisão 1 do FNCS) → 5 elite mundial (Champions, Worlds,
 *   Major, Six Invitational, Mundial do RLCS, Global Championship).
 *
 * Ninguém começa numa equipe de elite. Subir pede: o NÍVEL DE JOGO (os atributos do jogo, pesados pela função), os
 * RESULTADOS (onde a equipe terminou, a métrica individual), a REGULARIDADE (dois anos bons valem mais que um), a IDADE
 * (a mão chega ao auge cedo; a leitura amadurece depois; a idade mínima de cada liga) e a OPORTUNIDADE (a vaga existe ou
 * não; a peneira passa ou não). Nos jogos de equipe, sem equipe não se joga o degrau 2 em diante (peneira, proposta). No
 * Fortnite, as divisões sobem e descem pelos resultados (é assim nas copas divisionais).
 *
 * INTEGRAÇÃO: a semana (o treino é uma atividade de verdade — `rotinas` 'esports' — com horas, custo e cansaço; no
 * profissional, é o trabalho), o trabalho (ocupação `jogador_esports`, fora do mercado de vagas: só por proposta), o
 * dinheiro (salário do contrato, prêmios — a sua parte, depois da organização), a casa (a gaming house em outra cidade é
 * mudança), a escola (o adolescente que treina pesado rende menos nela), o corpo (horas sentado: o condicionamento cai sem
 * outra atividade física), a cabeça (o estresse da temporada), a fama (o nome no cenário) e a biografia.
 *
 * Fora do escopo, por decisão: empresários, agentes e patrocinadores pessoais (a organização paga salário; o prêmio é
 * dividido com ela — nada além disso).
 */
import { clamp, rngDe, type Rng } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade, pais as paisDe } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { lancar } from '../../sistemas/extrato';
import { registrarMotivoDoNome } from '../../sistemas/notoriedade';
import { contratar, encerrarEmprego } from '../../sistemas/trabalho';
import { ocupacao } from '../../dados/ocupacoes';
import { cidadesDoPais, economiaLocal, municipio, paisDaCidade } from '../../dados/lugares';
import { mudarAgora } from '../../sistemas/processos';
import { JOGOS25, LISTA_JOGOS25, DA_LEITURA25, DA_MAO25, type AtributoEsports, type Jogo25, type JogoId } from './jogos25';
import type { Competicao25, Esports25, Proposta25, Temporada25 } from './tipos25';

export type { Esports25 };
export const OCUPACAO_ESPORTS = 'jogador_esports';

/* ------------------------------------------------------------------ equipes (fictícias) */
const RAIZES = ['Vórtice', 'Nébula', 'Atalaia', 'Carcará', 'Mandacaru', 'Boitatá', 'Graúna', 'Jaguatirica', 'Guará', 'Pororoca', 'Basalto', 'Quasar', 'Órbita', 'Cobalto', 'Tucuxi', 'Ipê Roxo', 'Taipa', 'Sertão', 'Maré Alta', 'Coral', 'Farol', 'Aurora Austral', 'Litoral', 'Serra Fina', 'Bússola', 'Granito', 'Vagalume', 'Siriema', 'Capivara', 'Cerrado'];
const SUFIXOS = ['Gaming', 'Esports', 'e-Sports Club', 'Team', 'GG', 'Academy'];
const INTERNACIONAIS = ['Northwind', 'Kestrel Esports', 'Obsidian Five', 'Halcyon Gaming', 'Tundra Wolves', 'Meridian GG', 'Crimson Lynx', 'Solstice', 'Ironclad', 'Nightjar', 'Vanta Esports', 'Polaris Five', 'Ember Rising', 'Glacier', 'Zenith Club', 'Lotus Seven'];

/** O nome de uma equipe fictícia, estável pela semente (o jogo, o degrau, um índice). */
export function nomeDeEquipe25(jogo: JogoId, nivel: number, k: number, semente: string): string {
  const r = rngDe(semente, 'esp25_nome', jogo, nivel, k);
  if (nivel >= 5) return INTERNACIONAIS[Math.floor(r.next() * INTERNACIONAIS.length)];
  return `${RAIZES[Math.floor(r.next() * RAIZES.length)]} ${SUFIXOS[Math.floor(r.next() * (nivel <= 2 ? SUFIXOS.length : SUFIXOS.length - 1))]}`;
}

/* ------------------------------------------------------------------ leitura */
export const jogoDe = (e: Esports25): Jogo25 => JOGOS25[e.jogo];
export const ativa25 = (e?: Esports25): e is Esports25 => !!e && e.fase !== 'encerrada';
const br = (v: Vida) => paisDaCidade(v.moradia.municipioId) === 'BR';
export const anoDaTemporada25 = (v: Vida) => anoDe(v.t - 6);
export const nomeDoNivel25 = (v: Vida, jogo: JogoId, nivel: number, ano = anoDe(v.t)) => JOGOS25[jogo].niveis[clamp(nivel, 1, 5) - 1].nome(ano, br(v));

/** Os pesos da função (normalizados para somar 1): o AWPer vive da mira, o capitão da comunicação. */
export function pesosDaFuncao(jogo: Jogo25, funcao?: string): [AtributoEsports, number][] {
  const f = jogo.funcoes.find(x => x.id === funcao);
  const brutos = jogo.atributos.map(([id, p]) => [id, p * (f?.pesa[id] ?? 1)] as [AtributoEsports, number]);
  const soma = brutos.reduce((s, [, p]) => s + p, 0);
  return brutos.map(([id, p]) => [id, p / soma]);
}

/** O nível de jogo (0–100): a média dos atributos, pesada pelo que a função pede. */
export function nivelDeJogo25(e: Esports25): number {
  const j = jogoDe(e);
  return Math.round(pesosDaFuncao(j, e.funcao).reduce((s, [id, p]) => s + (e.atributos[id] ?? 30) * p, 0) * 10) / 10;
}

/** A força média de cada degrau (o que se precisa ter para ser um a mais lá). */
export const forcaDoNivel = (jogo: JogoId, nivel: number) => JOGOS25[jogo].niveis[clamp(nivel, 1, 5) - 1].forca;

/** Pontos fortes e limitações: os atributos mais acima e mais abaixo do nível de jogo, entre os que a função pede. */
export function fortesEFracos25(e: Esports25): { fortes: AtributoEsports[]; fracos: AtributoEsports[] } {
  const n = nivelDeJogo25(e);
  const lista = pesosDaFuncao(jogoDe(e), e.funcao).map(([id, p]) => ({ id, d: (e.atributos[id] ?? 30) - n, p }));
  return {
    fortes: lista.filter(x => x.d >= 3).sort((a, b) => b.d * b.p - a.d * a.p).slice(0, 2).map(x => x.id),
    fracos: lista.filter(x => x.d <= -3).sort((a, b) => a.d * a.p - b.d * b.p).slice(0, 2).map(x => x.id)
  };
}

/** O teto de um atributo: o talento, e — nos da mão — a idade. */
export function tetoDoAtributo25(e: Esports25, id: AtributoEsports, i: number): number {
  const j = jogoDe(e);
  const base = e.talento + (DA_LEITURA25.has(id) ? 8 : id === 'mental' || id === 'consistencia' ? 4 : 10);
  if (!DA_MAO25.has(id)) return clamp(base, 0, 99);
  const passou = Math.max(0, i - (j.auge + 3));
  const antes = Math.max(0, 15 - i);
  return clamp(base - passou * passou * 0.35 - antes * 3, 0, 99);
}

/** O dinheiro do jogo (reais de 2026) no dinheiro do lugar e da época (o nível de salários de onde a vida está). */
const valorLocal = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).salario / 10) * 10;

/* ------------------------------------------------------------------ ações */
export type OqueEsports25 =
  | { op: 'comecar'; jogo: JogoId }
  | { op: 'treinar'; foco: NonNullable<Esports25['foco']>['qual'] }
  | { op: 'funcao'; funcao: string }
  | { op: 'peneira' }
  | { op: 'aceitar' }
  | { op: 'recusar' }
  | { op: 'sair' }
  | { op: 'parar' };

/** Os jogos que existem no ano (a época conta: não há VALORANT em 2010). */
export const jogosNoAno25 = (ano: number): JogoId[] => LISTA_JOGOS25.filter(j => JOGOS25[j].lancado <= ano);

export function podeComecar25(v: Vida, jogo?: JogoId): Veredito {
  const i = idade(v);
  const e = v.esports25;
  if (e && e.fase !== 'encerrada') return bloqueio('incompativel', `A carreira em ${JOGOS25[e.jogo].nome(anoDe(v.t))} já está em andamento.`);
  if (i < 12) return bloqueio('requisito', 'O cenário competitivo começa por volta dos 12 anos, nas ranqueadas.');
  if (i > 30) return bloqueio('requisito', 'Depois dos 30, a mão já passou do auge: dá para jogar, não para começar uma carreira.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  if (v.caminhos.esporte?.fase === 'profissional' || v.automobilismo20?.fase === 'f1') return bloqueio('incompativel', 'Uma carreira de atleta profissional já ocupa o ano inteiro.');
  if (jogo && JOGOS25[jogo].lancado > anoDe(v.t)) return bloqueio('impossivel', `${JOGOS25[jogo].nome(JOGOS25[jogo].lancado)} só chega em ${JOGOS25[jogo].lancado}.`);
  if (!jogosNoAno25(anoDe(v.t)).length) return bloqueio('impossivel', 'Ainda não existe cenário competitivo de jogos eletrônicos.');
  return PERMITIDO;
}

/** O degrau que a peneira tenta (o de cima; no ranqueado, o cenário aberto). */
export function alvoDaPeneira(e: Esports25): number { return Math.min(5, e.equipe ? e.nivel + 1 : Math.max(2, e.nivel)); }

export function disponibilidadeEsports25(v: Vida, o: OqueEsports25): Veredito {
  if (o.op === 'comecar') return podeComecar25(v, o.jogo);
  const e = v.esports25;
  if (!ativa25(e)) return bloqueio('impossivel', 'Não há carreira de e-sports agora.');
  const feito = (k: string) => v.anoAtual.acoes.includes(`esp25:${k}`);
  const j = jogoDe(e);
  switch (o.op) {
    case 'treinar': return feito('treinar') ? bloqueio('incompativel', 'O foco do treino deste ano já foi escolhido.') : PERMITIDO;
    case 'funcao':
      if (!j.funcoes.some(f => f.id === o.funcao)) return bloqueio('impossivel', '');
      if (o.funcao === e.funcao) return bloqueio('incompativel', 'Já é a sua função.');
      if (feito('funcao')) return bloqueio('incompativel', 'Já mudou de função neste ano.');
      if (e.equipe?.titular && e.nivel >= 3) return bloqueio('incompativel', 'Com contrato de titular, a função é a que a equipe contratou — para mudar, só trocando de equipe.');
      return PERMITIDO;
    case 'peneira': {
      if (feito('peneira') || e.peneira === anoDe(v.t)) return bloqueio('incompativel', 'Uma peneira por ano: a próxima, no ano que vem.');
      if (j.porEquipe(anoDe(v.t)) === 1 || e.jogo === 'fortnite') return bloqueio('impossivel', 'No Fortnite não há peneira: as divisões sobem pelos resultados nas copas.');
      const alvo = alvoDaPeneira(e);
      if (alvo >= 3 && idade(v) < j.idadePro) return bloqueio('requisito', `As equipes da ${nomeDoNivel25(v, e.jogo, alvo).toLowerCase()} só contratam a partir dos ${j.idadePro} anos.`);
      if (idade(v) < 14) return bloqueio('requisito', 'As equipes do cenário aberto pedem pelo menos 14 anos.');
      if (e.proposta && v.t <= e.proposta.validaAte) return bloqueio('incompativel', 'Há uma proposta na mesa: responda a ela antes.');
      return PERMITIDO;
    }
    case 'aceitar': case 'recusar': return e.proposta && v.t <= e.proposta.validaAte ? PERMITIDO : bloqueio('impossivel', 'Não há proposta na mesa.');
    case 'sair': return e.equipe ? PERMITIDO : bloqueio('impossivel', 'Você não está em nenhuma equipe.');
    case 'parar': return PERMITIDO;
  }
}

export function executarEsports25(v: Vida, o: OqueEsports25): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const r = rngDe(v.id, 'esp25_acao', o.op, v.t);
  if (o.op === 'comecar') return comecar(v, o.jogo);
  const e = v.esports25!;
  const j = jogoDe(e);
  v.anoAtual.acoes.push(`esp25:${o.op}`);
  switch (o.op) {
    case 'treinar': {
      e.foco = { ano: anoDe(v.t), qual: o.foco };
      return { texto: { mecanica: 'Horas de treino de mira e de mão: o mesmo exercício até sair sem pensar.', estrategia: 'Assistiu às próprias partidas e às dos melhores: o que fazer, e quando.', equipe: 'Treinos combinados com outras equipes e a conversa depois de cada um: falar menos e dizer mais.', mental: 'Trabalho com psicólogo do esporte: a final, o erro, a respiração.', descanso: 'Menos horas, mais sono: o corpo e a cabeça agradeceram.' }[o.foco], tom: 'bom' };
    }
    case 'funcao': {
      const f = j.funcoes.find(x => x.id === o.funcao)!;
      e.funcao = f.id;
      return { texto: `Passou a jogar como ${f.nome}. ${f.sobre}`, tom: 'neutro' };
    }
    case 'peneira': return peneira(v, e, r);
    case 'aceitar': {
      const p = e.proposta!;
      e.proposta = undefined;
      entrarNaEquipe(v, e, p);
      return { texto: `Acertou com a ${p.equipe}.`, tom: 'bom' };
    }
    case 'recusar': { const p = e.proposta!; e.proposta = undefined; return { texto: `Recusou a proposta da ${p.equipe}.`, tom: 'neutro' }; }
    case 'sair': {
      sairDaEquipe(v, e, 'saiu por conta própria');
      return { texto: 'Saiu da equipe: o próximo passo é outra peneira, ou uma proposta.', tom: 'neutro' };
    }
    case 'parar': { encerrar(v, e, 'escolha'); return { texto: 'Parou de competir.', tom: 'neutro' }; }
  }
}

function comecar(v: Vida, jogo: JogoId): { texto: string; tom: 'bom' } {
  const j = JOGOS25[jogo];
  const dom = rngDe(v.id, 'esp25_talento');
  // O talento (estável pela semente) e o que a vida já deu: a cabeça (cognição), quem já jogava muito.
  const jogava = v.rotinas.some(x => x.id === 'videogame') ? 5 : 0;
  const talento = Math.round(clamp(52 + dom.normal() * 12 + (v.mente.cognicao - 55) * 0.15 + jogava, 25, 92));
  const r = rngDe(v.id, 'esp25_inicio', jogo);
  const atributos: Partial<Record<AtributoEsports, number>> = {};
  for (const [id] of j.atributos) atributos[id] = Math.round(clamp(talento * 0.5 + 4 + jogava + r.normal() * 5 + (id === 'mental' ? (v.personalidade.tracos.coragem ?? 0) / 10 : 0), 5, 70));
  const i = idade(v);
  v.esports25 = {
    jogo, fase: 'amador', inicio: v.t, talento, funcao: j.funcoes[0]?.id, atributos, nivel: 1, passagens: [], temporadas: [], serie: [],
    totais: { disputas: 0, vencidas: 0, titulos: 0, premios: 0, temporadas: 0 }, reputacao: 3
  };
  v.anoAtual.acoes.push('esp25:comecar');
  // O treino entra na semana como atividade (horas de verdade; quem não treina não evolui).
  if (!v.rotinas.some(x => x.id === 'esports')) v.rotinas.push({ id: 'esports', tInicio: v.t, nivel: 1 });
  escrever(v, { texto: `Decidiu levar ${j.nome(anoDe(v.t))} a sério${i < 18 ? '' : ', mesmo começando mais tarde que a maioria'}: ranqueadas todo dia, as primeiras copas online, o sonho de jogar numa equipe.`, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  return { texto: `Começou no cenário competitivo de ${j.nome(anoDe(v.t))}.`, tom: 'bom' };
}

/** A cidade da gaming house: a maior metrópole do país (no Brasil, São Paulo — onde ficam as organizações). */
function cidadeDaEquipe(v: Vida, nivel: number): string | undefined {
  if (nivel < 3) return undefined;
  const pais = paisDaCidade(v.moradia.municipioId);
  if (pais === 'BR') return 'sao-paulo-sp';
  const lista = cidadesDoPais(pais);
  return (lista.find(m => m.perfil === 'metropole') ?? lista.find(m => m.perfil === 'capital'))?.id;
}

function criarProposta(v: Vida, e: Esports25, nivel: number, origem: Proposta25['origem'], r: Rng): Proposta25 {
  const j = jogoDe(e);
  const n = j.niveis[nivel - 1];
  const forca = Math.round(clamp(n.forca + r.normal() * 4 + (origem === 'mercado' ? 3 : 0), 20, 98));
  const [min, max] = n.salario;
  const rep = clamp(e.reputacao / 100, 0, 1);
  const salario = max > 0 ? valorLocal(v, min + (max - min) * clamp(0.25 + rep * 0.5 + (forca - n.forca) / 20 + r.normal() * 0.1, 0, 1)) : 0;
  const titular = origem !== 'peneira' || nivelDeJogo25(e) >= n.forca - 2 || r.chance(0.5);
  return { equipe: nomeDeEquipe25(e.jogo, nivel, Math.floor(r.next() * 1000), v.id), nivel, forca, salario, meses: nivel >= 3 ? 24 : 12, validaAte: v.t + 11, origem, funcao: e.funcao, titular, municipioId: cidadeDaEquipe(v, nivel) };
}

function peneira(v: Vida, e: Esports25, r: Rng): { texto: string; tom: 'bom' | 'ruim' } {
  e.peneira = anoDe(v.t);
  const alvo = alvoDaPeneira(e);
  const n = nivelDeJogo25(e);
  const precisa = forcaDoNivel(e.jogo, alvo) - 3;
  // A vaga existe ou não (a equipe procura uma função): a chance é a do nível — e a do lugar aberto.
  const vagaNaFuncao = 0.55 + r.next() * 0.45;
  const chance = clamp(1 / (1 + Math.exp(-(n - precisa) / 3.2)) * vagaNaFuncao + (e.reputacao >= 40 ? 0.08 : 0), 0.02, 0.92);
  if (!r.chance(chance)) {
    const perto = n >= precisa - 3;
    escrever(v, { texto: `Fez peneira para uma equipe ${alvo <= 2 ? 'do cenário aberto' : `da ${nomeDoNivel25(v, e.jogo, alvo)}`} e não passou${perto ? ': estava perto, disseram — a vaga era de outra função' : ': o nível ainda não é o que eles procuram'}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    return { texto: perto ? 'Não passou na peneira — por pouco.' : 'Não passou na peneira: o nível ainda não chega lá.', tom: 'ruim' };
  }
  e.proposta = criarProposta(v, e, alvo, 'peneira', r);
  escrever(v, { texto: `Passou na peneira da ${e.proposta.equipe} (${nomeDoNivel25(v, e.jogo, alvo)}): a proposta está na mesa.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  return { texto: `Passou na peneira da ${e.proposta.equipe}.`, tom: 'bom' };
}

function entrarNaEquipe(v: Vida, e: Esports25, p: Proposta25): void {
  const ano = anoDe(v.t);
  if (e.equipe) sairDaEquipe(v, e, 'transferência', true);
  const pro = p.salario > 0 && p.nivel >= 3;
  e.equipe = { nome: p.equipe, nivel: p.nivel, forca: p.forca, desde: v.t, contratoAte: v.t + p.meses, salario: p.salario, titular: p.titular, municipioId: p.municipioId };
  e.nivel = p.nivel;
  if (p.funcao) e.funcao = p.funcao;
  e.anosSemEquipe = 0;
  e.passagens.push({ equipe: p.equipe, nivel: p.nivel, de: ano });
  if (pro) {
    e.fase = 'profissional';
    // O treino agora é o trabalho (as horas da equipe): sai da semana como atividade de tempo livre.
    v.rotinas = v.rotinas.filter(x => x.id !== 'esports');
    const oc = ocupacao(OCUPACAO_ESPORTS);
    contratar(v, rngDe(v.id, 'esp25_contrato', v.t), oc, 'oportunidade');
    const emp = v.trabalho.atual!;
    emp.empregador = p.equipe;
    emp.salario = p.salario;
    // A gaming house é em outra cidade: a vida vai junto (16+; o menor vai com autorização da família — a mudança é dele).
    if (p.municipioId && p.municipioId !== v.moradia.municipioId && idade(v) >= 16) {
      emp.municipioId = p.municipioId;
      mudarAgora(v, p.municipioId, `para morar na gaming house da ${p.equipe}`);
    }
  } else if (e.fase === 'amador') e.fase = 'competitivo';
  const primeira = e.passagens.length === 1;
  escrever(v, {
    texto: pro
      ? `${primeira || !e.temporadas.some(t => t.nivel >= 3) ? 'Assinou o primeiro contrato profissional' : 'Assinou contrato'} com a ${p.equipe}, na ${nomeDoNivel25(v, e.jogo, p.nivel)}: ${fmt(p.salario)} por mês, ${p.titular ? 'como titular' : 'para brigar pela vaga'}${p.municipioId && p.municipioId !== v.moradia.municipioId ? '' : ''}.`
      : `Entrou para a ${p.equipe}, uma equipe do ${nomeDoNivel25(v, e.jogo, p.nivel).toLowerCase()}: sem salário, com treino marcado e campeonato de verdade.`,
    relevancia: pro ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom', escolha: true
  });
}

function sairDaEquipe(v: Vida, e: Esports25, motivo: string, silencio = false): void {
  const eq = e.equipe;
  if (!eq) return;
  const pas = [...e.passagens].reverse().find(x => x.equipe === eq.nome && x.ate === undefined);
  if (pas) { pas.ate = anoDe(v.t); pas.saida = motivo; }
  e.equipe = undefined;
  if (v.trabalho.atual?.ocupacaoId === OCUPACAO_ESPORTS) encerrarEmprego(v, `saída da ${eq.nome}`);
  if (e.fase === 'profissional') e.fase = 'competitivo';
  if (!v.rotinas.some(x => x.id === 'esports')) v.rotinas.push({ id: 'esports', tInicio: v.t, nivel: 2 });
  if (!silencio) escrever(v, { texto: `Deixou a ${eq.nome} (${motivo}).`, relevancia: 'biografia', tema: 'trabalho' });
}

/* ------------------------------------------------------------------ o ano */

/** A intensidade do treino (0 nenhum … 3 de profissional): a atividade da semana; no profissional, o trabalho. */
export function intensidade25(v: Vida, e: Esports25): number {
  if (e.fase === 'profissional' && v.trabalho.atual?.ocupacaoId === OCUPACAO_ESPORTS) return 3;
  return v.rotinas.find(x => x.id === 'esports')?.nivel ?? 0;
}

function evoluir(v: Vida, e: Esports25, r: Rng, disputas: number): void {
  const i = idade(v);
  const int = intensidade25(v, e);
  const foco = e.foco && e.foco.ano >= anoDaTemporada25(v) ? e.foco.qual : undefined;
  const j = jogoDe(e);
  for (const [id] of j.atributos) {
    const x = e.atributos[id] ?? 30;
    const teto = tetoDoAtributo25(e, id, i);
    let ritmo = [0, 0.08, 0.16, 0.23][int] ?? 0;
    if (DA_LEITURA25.has(id)) ritmo += Math.min(0.08, disputas / 900);
    // O adolescente aprende a mão mais depressa (é quando quase todo profissional se forma).
    if (int >= 2 && i <= 19 && DA_MAO25.has(id)) ritmo += 0.05;
    if (id === 'mental' && e.nivel >= 3) ritmo += 0.04;
    if (foco === 'mecanica' && DA_MAO25.has(id)) ritmo += 0.08;
    if (foco === 'estrategia' && (id === 'estrategia' || id === 'conhecimento' || id === 'decisao' || id === 'posicionamento' || id === 'utilitarios')) ritmo += 0.08;
    if (foco === 'equipe' && (id === 'comunicacao' || id === 'consistencia')) ritmo += 0.1;
    if (foco === 'mental' && (id === 'mental' || id === 'consistencia')) ritmo += 0.1;
    let novo = x + Math.max(0, teto - x) * ritmo + r.normal() * 0.8;
    // Sem treino, a mão esfria (a leitura fica); acima do teto (a idade baixou o teto), cai devagar até ele.
    if (int === 0 && DA_MAO25.has(id)) novo -= 2;
    if (novo > teto) novo = Math.max(teto, x - (DA_MAO25.has(id) ? 2.2 : 1));
    if (foco === 'descanso') novo = x + (novo - x) * 0.6;
    e.atributos[id] = Math.round(clamp(novo, 1, 99) * 10) / 10;
  }
}

/** A colocação de quem tem força `s` num campo de `n` participantes de força média `f` (com o acaso da temporada). */
function colocacaoNoCampo(r: Rng, s: number, f: number, n: number, sd = 6): number {
  let acima = 0;
  const meu = s + r.normal() * 3.5;
  for (let k = 1; k < n; k++) if (f + r.normal() * sd + r.normal() * 3.5 > meu) acima++;
  return acima + 1;
}

/** A parte do prêmio pela colocação (o campeão leva o maior pedaço; a liga paga mais gente que o torneio). */
const fatiaDoPremio = (col: number, n: number) => (col === 1 ? 0.32 : col === 2 ? 0.16 : col <= 4 ? 0.08 : col <= 8 ? 0.035 : col <= Math.max(8, n / 4) ? 0.01 : 0);

function jogarTemporada(v: Vida, e: Esports25, r: Rng, ano: number): Temporada25 {
  const j = jogoDe(e);
  const bra = br(v);
  const porEquipe = j.porEquipe(ano);
  const nj = nivelDeJogo25(e);
  // Sem equipe, nos jogos de equipe, só se joga o degrau do ranqueado e das copas abertas (com quem aparecer).
  const semEquipe = !e.equipe;
  const nivel = semEquipe && porEquipe > 2 && e.jogo !== 'fortnite' ? Math.min(e.nivel, 1) : e.nivel;
  const n = j.niveis[nivel - 1];
  const titular = semEquipe ? true : e.equipe!.titular;
  // A força da equipe: a da organização e a sua (um de cinco, de três, de dois — ou só você).
  const pesoSeu = porEquipe === 1 ? 1 : porEquipe === 2 ? 0.55 : porEquipe === 3 ? 0.4 : 0.26;
  const base = semEquipe ? (porEquipe > 2 ? forcaDoNivel(e.jogo, nivel) - 6 + r.normal() * 4 : nj) : e.equipe!.forca;
  const forca = titular ? base * (1 - pesoSeu) + nj * pesoSeu : base;
  const competicoes: Competicao25[] = [];
  const disputasMax = Math.round(n.jogos * (titular ? 1 : 0.2));
  const fortnite = e.jogo === 'fortnite';
  // A liga (ou o circuito) do degrau.
  const col = colocacaoNoCampo(r, forca, n.forca, n.equipes);
  const pctV = fortnite ? clamp(0.02 + (forca - n.forca) * 0.006 + r.normal() * 0.01, 0.002, 0.3) : clamp(1 / (1 + Math.exp(-(forca - n.forca) / 6)) + r.normal() * 0.05, 0.05, 0.95);
  const vit = Math.round(disputasMax * pctV);
  const parte = (premio: number, c: number, nn: number) => valorLocal(v, premio * fatiaDoPremio(c, nn) / porEquipe * (semEquipe ? 1 : 0.85));
  competicoes.push({ nome: n.liga(ano, bra), tipo: 'liga', colocacao: col, participantes: n.equipes, vitorias: vit, derrotas: disputasMax - vit, premio: titular ? parte(n.premio, col, n.equipes) : 0, titulo: col === 1 && titular });
  // Os torneios do degrau (a qualificatória, o torneio que fecha o ano).
  for (const nome of n.torneios(ano, bra).filter(Boolean)) {
    const parts = nivel <= 2 ? 64 : 16;
    const c = colocacaoNoCampo(r, forca, n.forca, parts);
    const jogos = Math.max(1, Math.round((parts <= 16 ? 4 : 6) - Math.log2(c)));
    const v2 = c === 1 ? jogos : Math.max(0, jogos - 1);
    competicoes.push({ nome, tipo: 'torneio', colocacao: c, participantes: parts, vitorias: titular ? v2 : 0, derrotas: titular ? (c === 1 ? 0 : 1) : 0, premio: titular ? parte(n.premio * 0.4, c, parts) : 0, titulo: c === 1 && titular });
  }
  // O mundial: a elite joga (nível 5); no nível 4, quem termina no topo da liga se classifica naquele ano.
  if (nivel >= 4 && j.niveis[4].liga(ano, bra) && (nivel === 5 || col <= (e.jogo === 'lol' ? 1 : 2))) {
    const m = j.niveis[4];
    const c = colocacaoNoCampo(r, forca, m.forca, m.equipes, 5);
    const jogos = Math.max(2, Math.round(7 - Math.log2(c)));
    competicoes.push({ nome: m.liga(ano, bra), tipo: 'mundial', colocacao: c, participantes: m.equipes, vitorias: titular ? Math.max(0, jogos - (c === 1 ? 0 : 2)) : 0, derrotas: titular ? (c === 1 ? 1 : 2) : 0, premio: titular ? parte(m.premio, c, m.equipes) : 0, titulo: c === 1 && titular });
  }
  const disputas = competicoes.reduce((s, c) => s + c.vitorias + c.derrotas, 0);
  const vencidas = competicoes.reduce((s, c) => s + c.vitorias, 0);
  // A métrica individual: o seu nível contra o do degrau (a equipe forte não infla o seu rating; a função pesa).
  const met = j.metrica;
  const z = clamp((nj - n.forca) / 9 + r.normal() * 0.6 + (e.atributos.consistencia ?? 40) / 100 * 0.3 - 0.15, -2.8, 2.8);
  const metrica = Math.round(Math.max(0, met.media + z * met.sd) * 10 ** met.casas) / 10 ** met.casas;
  const premios = competicoes.reduce((s, c) => s + c.premio, 0);
  const t: Temporada25 = { ano, jogo: e.jogo, nivel, equipe: e.equipe?.nome, papel: semEquipe ? 'sem_equipe' : titular ? 'titular' : 'reserva', funcao: e.funcao, competicoes, disputas, vencidas, metrica, nivelDeJogo: nj, premios };
  if (titular && z >= 1.6 && nivel >= 2) t.destaque = nivel >= 4 ? `seleção do ano da ${n.nome(ano, bra)}` : `melhor jogador${v.eu.genero === 'feminino' ? 'a' : ''} da ${n.liga(ano, bra)}`;
  return t;
}

/** O ano da carreira: o treino, a temporada, o dinheiro, o que muda depois dela. */
export function processarEsports25(v: Vida): void {
  const e = v.esports25;
  if (!ativa25(e) || v.morte) return;
  const ano = anoDaTemporada25(v);
  if (e.temporadas.some(t => t.ano === ano)) return;
  const r = rngDe(v.id, 'esp25_ano', ano);
  // Quem trocou o contrato da equipe por outro emprego saiu da equipe (o salário e as horas eram dela).
  if (e.fase === 'profissional' && v.trabalho.atual?.ocupacaoId !== OCUPACAO_ESPORTS && e.equipe) sairDaEquipe(v, e, 'outro trabalho');
  const ultima = e.temporadas[e.temporadas.length - 1];
  evoluir(v, e, r, ultima?.disputas ?? 0);
  // Preso, o ano não tem temporada (a equipe dispensa).
  if (v.justica?.prisao) { if (e.equipe) sairDaEquipe(v, e, 'a prisão'); return; }
  const int = intensidade25(v, e);
  // Quem parou de treinar e não tem equipe está fora do cenário: o ano passa sem temporada.
  if (int === 0 && !e.equipe) {
    e.anosSemEquipe = (e.anosSemEquipe ?? 0) + 1;
    if (e.anosSemEquipe >= 2) encerrar(v, e, 'sem_equipe');
    fotografar(e, ano);
    return;
  }
  const t = jogarTemporada(v, e, r, ano);
  e.temporadas.push(t);
  if (e.temporadas.length > 30) e.temporadas.splice(0, e.temporadas.length - 30);
  const tot = e.totais;
  tot.temporadas++; tot.disputas += t.disputas; tot.vencidas += t.vencidas; tot.premios += t.premios;
  const titulos = t.competicoes.filter(c => c.titulo);
  tot.titulos += titulos.length;
  if (t.premios > 0) { v.financas.conta += t.premios; lancar(v, `Prêmios de ${jogoDe(e).nome(ano)} (a sua parte)`, 'renda', t.premios); }
  // O nome no cenário: o degrau, onde terminou, a métrica, os títulos, o destaque.
  const liga = t.competicoes[0];
  const alvo = clamp((t.nivel - 1) * 14 + (1 - (liga.colocacao - 1) / Math.max(1, liga.participantes - 1)) * 22 + (t.metrica - jogoDe(e).metrica.media) / jogoDe(e).metrica.sd * 6 + titulos.length * 6 + (t.destaque ? 8 : 0) + (t.competicoes.some(c => c.tipo === 'mundial') ? 10 : 0), 0, 100);
  e.reputacao = Math.round(clamp(e.reputacao * 0.6 + alvo * 0.4, 0, 100));
  contarTemporada(v, e, t);
  vidaEmVolta(v, e, int);
  depoisDaTemporada(v, e, t, r);
  fotografar(e, ano);
}

function fotografar(e: Esports25, ano: number): void {
  const foto = { ano, nivel: e.nivel, a: { ...e.atributos } };
  const k = e.serie.findIndex(x => x.ano === ano);
  if (k >= 0) e.serie[k] = foto; else e.serie.push(foto);
  if (e.serie.length > 25) e.serie.splice(0, e.serie.length - 25);
}

function contarTemporada(v: Vida, e: Esports25, t: Temporada25): void {
  const j = jogoDe(e);
  const liga = t.competicoes[0];
  const f = v.eu.genero === 'feminino';
  const tit = t.competicoes.filter(c => c.titulo);
  const mundial = t.competicoes.find(c => c.tipo === 'mundial');
  const onde = t.equipe ? `pela ${t.equipe}` : 'sem equipe fixa';
  const met = `${j.metrica.nome} ${t.metrica.toLocaleString('pt-BR')}`;
  const texto = tit.length
    ? `${f ? 'Campeã' : 'Campeão'} ${tit.map(c => `de ${c.nome}`).join(' e ')} em ${t.ano}, ${onde} (${met}).`
    : t.papel === 'reserva'
      ? `Temporada de ${t.ano} no banco da ${t.equipe}: poucos ${j.disputa[1]}, muito treino.`
      : `Temporada de ${t.ano} ${onde}: ${liga.colocacao}º de ${liga.participantes} em ${liga.nome}${mundial ? `; no ${mundial.nome}, ${mundial.colocacao}º` : ''} (${met}).`;
  escrever(v, { texto, relevancia: tit.length || mundial || t.nivel >= 4 ? 'marco' : 'biografia', tema: 'trabalho', tom: tit.length || liga.colocacao <= 3 ? 'bom' : liga.colocacao > liga.participantes * 0.7 ? 'ruim' : undefined });
  if (mundial && !e.temporadas.slice(0, -1).some(x => x.competicoes.some(c => c.tipo === 'mundial'))) escrever(v, { texto: `A primeira vez no palco de ${mundial.nome}. A arena cheia, o próprio nome no telão.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
}

function vidaEmVolta(v: Vida, e: Esports25, int: number): void {
  const i = idade(v);
  v.mente.estresse = clamp(v.mente.estresse + (e.fase === 'profissional' ? 4 : int >= 2 ? 2 : 0));
  // Horas sentado: sem outra atividade física na semana, o condicionamento cai.
  const mexe = v.rotinas.some(x => ['academia', 'corrida', 'futebol', 'natacao', 'volei', 'basquete', 'lutas', 'atletismo', 'ciclismo', 'danca', 'tenis', 'futsal', 'caminhada'].includes(x.id));
  if (int >= 2 && !mexe) v.corpo.forma = clamp(v.corpo.forma - (int === 3 ? 3 : 2));
  // O adolescente que treina pesado rende menos na escola.
  if (i < 18 && int >= 2) { const b = v.educacao.basica; if (b) b.desempenho = clamp(b.desempenho - (int === 3 ? 5 : 2)); }
  // A gaming house longe: a família de origem fica mais longe também.
  if (e.equipe?.municipioId && e.equipe.municipioId === v.moradia.municipioId && i < 22) for (const p of paisDe(v)) { const vin = v.vinculos[p.id]; if (vin) vin.proximidade = clamp(vin.proximidade - 2); }
}

/** As propostas, a peneira que vira contrato, a renovação, o banco, a dispensa, o fim. */
function depoisDaTemporada(v: Vida, e: Esports25, t: Temporada25, r: Rng): void {
  const j = jogoDe(e);
  const i = idade(v);
  const nj = nivelDeJogo25(e);
  const liga = t.competicoes[0];
  const top = liga.colocacao <= Math.max(1, Math.round(liga.participantes * 0.12));
  const zMet = (t.metrica - j.metrica.media) / j.metrica.sd;
  const anterior = e.temporadas[e.temporadas.length - 2];
  const regular = !!anterior && anterior.nivel === t.nivel && (anterior.metrica - j.metrica.media) / j.metrica.sd >= 0.3 && zMet >= 0.3;
  // FORTNITE: as divisões sobem e descem pelos resultados (as copas divisionais).
  if (e.jogo === 'fortnite') {
    if ((top || liga.colocacao <= 10) && e.nivel < 4 && (e.nivel + 1 < 3 || i >= j.idadePro)) { e.nivel += 1; escrever(v, { texto: `Os resultados nas copas valeram a subida: no ano que vem, ${nomeDoNivel25(v, e.jogo, e.nivel)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); }
    else if (liga.colocacao > liga.participantes * 0.75 && e.nivel > 1) { e.nivel -= 1; escrever(v, { texto: `Caiu de divisão: no ano que vem, ${nomeDoNivel25(v, e.jogo, e.nivel)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); }
    if (e.nivel === 4 && liga.colocacao <= 3 && !e.equipe) { e.nivel = 5; }
    // Uma organização assina quem aparece no topo (salário e a camisa; o prêmio continua sendo dividido).
    if (!e.equipe && e.nivel >= 3 && i >= j.idadePro && (top || t.destaque) && r.chance(0.45)) { e.proposta = criarProposta(v, e, e.nivel, 'organizacao', r); escreverProposta(v, e); }
    if (e.equipe) renovarOuSair(v, e, t, zMet, r);
    terminar(v, e, nj, i);
    return;
  }
  // Os jogos de equipe.
  if (e.equipe) {
    // O banco: o titular que rende muito abaixo perde a vaga; o reserva com nível volta.
    if (e.equipe.titular && zMet <= -1.1 && r.chance(0.6)) { e.equipe.titular = false; escrever(v, { texto: `Foi para o banco da ${e.equipe.nome}: o ${j.metrica.nome} do ano ficou entre os piores da equipe.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); }
    else if (!e.equipe.titular && nj >= e.equipe.forca - 2 && r.chance(0.55)) { e.equipe.titular = true; escrever(v, { texto: `Ganhou a vaga de titular na ${e.equipe.nome}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); }
    // Acesso e queda da EQUIPE (a vaga é da organização): campeã da segunda divisão sobe; lanterna da liga cai.
    if (liga.colocacao === 1 && e.nivel <= 3 && e.nivel >= 2) { e.nivel += 1; e.equipe.nivel = e.nivel; e.equipe.forca = Math.round((e.equipe.forca + forcaDoNivel(e.jogo, e.nivel)) / 2); escrever(v, { texto: `A ${e.equipe.nome} conquistou o acesso: no ano que vem, ${nomeDoNivel25(v, e.jogo, e.nivel)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); }
    else if (liga.colocacao === liga.participantes && e.nivel >= 3 && e.nivel <= 4) { e.nivel -= 1; e.equipe.nivel = e.nivel; escrever(v, { texto: `A ${e.equipe.nome} terminou em último e caiu para ${nomeDoNivel25(v, e.jogo, e.nivel).toLowerCase()}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); }
    else if (e.nivel === 4 && liga.colocacao <= 2 && t.competicoes.some(c => c.tipo === 'mundial' && c.colocacao <= 4)) { e.nivel = 5; e.equipe.nivel = 5; e.equipe.forca = Math.max(e.equipe.forca, forcaDoNivel(e.jogo, 5) - 2); }
    else if (e.nivel === 5 && liga.colocacao > liga.participantes / 2) { e.nivel = 4; e.equipe.nivel = 4; }
    renovarOuSair(v, e, t, zMet, r);
  } else {
    e.anosSemEquipe = (e.anosSemEquipe ?? 0) + 1;
  }
  // O MERCADO: quem joga acima do degrau é visto. Subir não é automático: precisa de nível para o de cima, de resultado
  // (topo da tabela, destaque) ou de regularidade (dois anos bons) — e da vaga, que nem sempre existe.
  if (!e.proposta || v.t > e.proposta.validaAte) {
    const acima = Math.min(5, (e.equipe ? e.nivel : Math.max(1, e.nivel)) + 1);
    const nivelOk = nj >= forcaDoNivel(e.jogo, acima) - (acima >= 3 ? 1.5 : 4);
    const idadeOk = acima < 3 || i >= j.idadePro;
    const chance = clamp(0.18 + (top ? 0.25 : 0) + (t.destaque ? 0.25 : 0) + (regular ? 0.2 : 0) + (t.competicoes.some(c => c.titulo) ? 0.15 : 0) - (i >= j.auge + 5 ? 0.2 : 0), 0, 0.85);
    if (nivelOk && idadeOk && r.chance(chance)) { e.proposta = criarProposta(v, e, acima, e.equipe ? 'mercado' : 'subida', r); escreverProposta(v, e); }
    else if (e.equipe && t.papel === 'titular' && zMet >= 1 && r.chance(0.2)) { e.proposta = criarProposta(v, e, e.nivel, 'mercado', r); if (e.proposta.forca > e.equipe.forca) escreverProposta(v, e); else e.proposta = undefined; }
    else if (!e.equipe && e.nivel >= 2 && nj >= forcaDoNivel(e.jogo, e.nivel) - 6 && r.chance(0.3)) { e.proposta = criarProposta(v, e, Math.max(2, e.nivel - (nj < forcaDoNivel(e.jogo, e.nivel) - 3 ? 1 : 0)), 'descida', r); escreverProposta(v, e); }
  }
  terminar(v, e, nj, i);
}

function renovarOuSair(v: Vida, e: Esports25, t: Temporada25, zMet: number, r: Rng): void {
  const eq = e.equipe;
  if (!eq || (eq.contratoAte ?? 0) > v.t + 6) return;
  const fica = zMet >= -0.4 || (eq.titular && t.competicoes[0].colocacao <= 3) || r.chance(0.25);
  if (!fica) { sairDaEquipe(v, e, 'contrato não renovado'); escrever(v, { texto: 'O contrato acabou e a equipe não renovou: o ano que vem começa sem equipe.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); return; }
  const j = jogoDe(e);
  const n = j.niveis[e.nivel - 1];
  eq.contratoAte = v.t + (e.nivel >= 3 ? 24 : 12);
  if (n.salario[1] > 0 && e.nivel >= 3) {
    eq.salario = Math.max(eq.salario, valorLocal(v, n.salario[0] + (n.salario[1] - n.salario[0]) * clamp(e.reputacao / 100 + (zMet > 0 ? 0.1 : 0), 0, 1)));
    if (v.trabalho.atual?.ocupacaoId === OCUPACAO_ESPORTS) v.trabalho.atual.salario = eq.salario;
    else if (e.fase !== 'profissional') { e.fase = 'profissional'; contratar(v, rngDe(v.id, 'esp25_contrato', v.t), ocupacao(OCUPACAO_ESPORTS), 'oportunidade'); const emp = v.trabalho.atual!; emp.empregador = eq.nome; emp.salario = eq.salario; v.rotinas = v.rotinas.filter(x => x.id !== 'esports'); }
  }
  escrever(v, { texto: `Renovou com a ${eq.nome}${eq.salario ? `: ${fmt(eq.salario)} por mês` : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
}

function terminar(v: Vida, e: Esports25, nj: number, i: number): void {
  if (e.fase === 'encerrada') return;
  const j = jogoDe(e);
  if ((e.anosSemEquipe ?? 0) >= 3 && i >= 22) { encerrar(v, e, 'sem_equipe'); return; }
  if (i >= j.auge + 9 && !e.equipe && nj < forcaDoNivel(e.jogo, Math.max(2, e.nivel)) - 4) { encerrar(v, e, 'idade'); return; }
  // A carreira de e-sports é curta: depois dos vinte e tantos, a cada ano mais gente pendura o mouse — mais cedo quem não
  // passou do cenário semiprofissional (a conta não fecha), mais tarde quem está na elite.
  const passou = i - (j.auge + 6);
  if (passou > 0 && rngDe(v.id, 'esp25_aposenta', i).chance(clamp(passou * (e.nivel <= 2 ? 0.12 : e.nivel === 3 ? 0.08 : 0.05), 0, 0.6))) encerrar(v, e, 'idade');
}

function escreverProposta(v: Vida, e: Esports25): void {
  const p = e.proposta!;
  escrever(v, { texto: `Proposta da ${p.equipe} para jogar ${p.nivel >= 3 ? `a ${nomeDoNivel25(v, e.jogo, p.nivel)}` : `o ${nomeDoNivel25(v, e.jogo, p.nivel).toLowerCase()}`} em ${anoDe(v.t) + 1}${p.salario ? `: ${fmt(p.salario)} por mês` : ', sem salário'}${p.municipioId && p.municipioId !== v.moradia.municipioId ? `, morando na gaming house em ${municipio(p.municipioId).nome}` : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
}

function encerrar(v: Vida, e: Esports25, motivo: NonNullable<Esports25['motivoFim']>): void {
  if (e.equipe) sairDaEquipe(v, e, 'fim da carreira', true);
  e.fase = 'encerrada';
  e.motivoFim = motivo;
  e.fim = v.t;
  e.proposta = undefined;
  v.rotinas = v.rotinas.filter(x => x.id !== 'esports');
  const j = jogoDe(e);
  const elite = e.temporadas.filter(t => t.nivel >= 4).length;
  const texto = motivo === 'escolha' ? `Parou de competir em ${j.nome(anoDe(v.t))} aos ${idade(v)}.` : motivo === 'sem_equipe' ? `Sem equipe havia anos, a carreira competitiva em ${j.nome(anoDe(v.t))} acabou aos ${idade(v)}.` : motivo === 'trabalho' ? `A carreira de e-sports parou aos ${idade(v)}: outro trabalho tomou o ano.` : `A mão já não acompanhava o cenário: aposentou-se dos e-sports aos ${idade(v)}.`;
  escrever(v, { texto: `${texto}${e.totais.temporadas ? ` Na carreira: ${e.totais.temporadas} temporadas, ${e.passagens.length} ${e.passagens.length === 1 ? 'equipe' : 'equipes'}, ${e.totais.titulos} ${e.totais.titulos === 1 ? 'título' : 'títulos'}${elite ? `, ${elite} ${elite === 1 ? 'ano' : 'anos'} na elite` : ''}.` : ''}`, relevancia: 'marco', tema: 'trabalho' });
}

/* ------------------------------------------------------------------ fama: o motivo do nome */
registrarMotivoDoNome(v => {
  const e = v.esports25;
  if (!e || !e.temporadas.length) return undefined;
  const peso = [0, 0, 2, 7, 18, 34][Math.max(...e.temporadas.slice(-3).map(t => t.nivel))] ?? 0;
  const mundiais = e.temporadas.filter(t => t.competicoes.some(c => c.tipo === 'mundial' && c.titulo)).length;
  const valor = Math.min(85, peso + e.reputacao * 0.2 + mundiais * 12 + e.totais.titulos * 1.5) * (e.fase === 'encerrada' ? 0.5 : 1);
  return valor > 2 ? { valor, fonte: 'esporte' } : undefined;
});

/* ------------------------------------------------------------------ leitura para a tela */
export function leituraEsports25(v: Vida) {
  const e = v.esports25;
  if (!e) return undefined;
  const j = jogoDe(e);
  const ano = anoDe(v.t);
  const nj = nivelDeJogo25(e);
  const caminho = [1, 2, 3, 4, 5].map(n => ({ n, nome: nomeDoNivel25(v, e.jogo, n), forca: forcaDoNivel(e.jogo, n), feito: e.temporadas.some(t => t.nivel >= n), atual: n === e.nivel }));
  const prox = Math.min(5, e.nivel + 1);
  return {
    e, j, ano, nomeJogo: j.nome(ano), nivelDeJogo: nj, caminho, intensidade: intensidade25(v, e),
    proposta: e.proposta && v.t <= e.proposta.validaAte ? e.proposta : undefined,
    proximo: e.nivel < 5 ? { nivel: prox, nome: nomeDoNivel25(v, e.jogo, prox), precisa: forcaDoNivel(e.jogo, prox) - 4, idade: prox >= 3 ? j.idadePro : 14 } : undefined,
    funcao: j.funcoes.find(f => f.id === e.funcao),
    ...fortesEFracos25(e)
  };
}

/** Saves: o estado é opcional; o que vier quebrado sai. */
export function normalizarVida25Esports(v: Vida): void {
  const e = v.esports25;
  if (!e) return;
  if (typeof e !== 'object' || !JOGOS25[e.jogo] || !e.atributos) { delete v.esports25; return; }
  e.temporadas ??= []; e.passagens ??= []; e.serie ??= [];
  e.totais ??= { disputas: 0, vencidas: 0, titulos: 0, premios: 0, temporadas: 0 };
  e.nivel = clamp(Math.round(e.nivel ?? 1), 1, 5);
  e.reputacao = clamp(e.reputacao ?? 0, 0, 100);
}
