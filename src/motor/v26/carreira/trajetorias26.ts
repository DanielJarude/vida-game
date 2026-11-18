/**
 * VIDA 26 — OS CAMINHOS PROFISSIONAIS (a consulta): como cada esporte, cada jogo de e-sports e o automobilismo começam,
 * as etapas, o que faz evoluir, os destinos e o depois da competição. Tudo é LIDO das regras que o jogo usa — a janela
 * da peneira (`perseguir.janelaDaBase`), as categorias (`esporte.categoriaDaBase`), a idade e a régua do contrato
 * (`esporte.contratoDaBase`, Lei 14.597/2023), as divisões (`esporte.divisaoDe`), os degraus e a idade profissional de
 * cada jogo (`v25/esports/jogos25`), as categorias do automobilismo (`v20`), os atributos que mais pesam
 * (`v26/esporte/atributos26`) e as portas do pós-carreira (`posCarreira26`). Nenhuma etapa aqui promete o que o motor
 * não faz; e nenhuma é obrigatória: o hobby pode continuar hobby.
 */
import type { Dominio, Vida } from '../../tipos';
import { idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { contratoDaBase, divisaoDe, etapaNaBase, IDADE_AMADOR, MODALIDADES, MODALIDADES_AMADORAS, NOME_MOD } from '../../sistemas/esporte';
import { janelaDaBase } from '../../sistemas/perseguir';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { nomeOcupacao } from '../../sistemas/trabalho';
import { ATRIBUTOS_BASQUETE, ATRIBUTOS_DA_MODALIDADE, ATRIBUTOS_DA_POSICAO, NOME_ATRIBUTO, type Lista } from '../esporte/atributos26';
import { JOGOS25, LISTA_JOGOS25, NOME_ATRIBUTO25, type JogoId } from '../../v25/esports/jogos25';
import { CATEGORIAS20, nomeCategoria20 } from '../../v20/automobilismo/automobilismo20';
import { POS_CARREIRA26, type OrigemPos26 } from './posCarreira26';
import { IDADE_LEGAL_CONTRATO } from '../../sistemas/jovemAtleta';

export interface Etapa26 { nome: string; quando?: string; como: string; aqui?: boolean; feita?: boolean }
export interface Trajeto26 {
  id: string;
  grupo: 'esporte' | 'esports' | 'pistas';
  nome: string;
  /** Como começa (o hobby, a atividade da semana). */
  comeco: string;
  etapas: Etapa26[];
  /** O que faz evoluir (os atributos que mais pesam, o corpo, a cabeça). */
  fatores: string[];
  /** Os destinos competitivos (as divisões, os degraus, as categorias). */
  destinos: string[];
  /** O depois da competição (profissões reais). */
  depois: string[];
  /** As outras portas (a amadora, a tardia, o hobby que continua hobby). */
  alternativas: string[];
  /** Esta vida está neste caminho. */
  meu?: boolean;
}

const primeiros = (l: Lista, n = 5) => [...l].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => NOME_ATRIBUTO[id]);
const nomes = (v: Vida | undefined, ids: string[]) => ids.map(id => ocupacaoOuNula(id)).filter(Boolean).map(oc => (v ? nomeOcupacao(v, oc!) : oc!.nome[0]));
const depoisDe = (v: Vida | undefined, o: OrigemPos26) => nomes(v, POS_CARREIRA26[o] ?? []);

/** O corpo que pesa em cada modalidade (dito como vantagem e como compensação — nunca como barreira). */
const CORPO_PESA: Partial<Record<Dominio, string>> = {
  basquete: 'A altura dá alcance e rebote; quem é mais baixo compensa com condução, passe, velocidade e leitura — o caminho é mais difícil, não fechado.',
  volei: 'A altura e a impulsão pesam no ataque e no bloqueio; o líbero e o levantador vivem de recepção, agilidade e decisão.',
  natacao: 'Envergadura e alcance ajudam a braçada; a técnica de nado e as viradas pesam mais.',
  atletismo: 'Cada prova pede um corpo: a explosão nos 100 m, o fôlego no fundo, a impulsão nos saltos, a força nos arremessos.',
  lutas: 'Lutas são por categoria de peso: o corpo decide a categoria, não a chance.',
  futebol: 'O corpo pesa pouco e por posição: a altura no jogo aéreo do zagueiro e do goleiro, a arrancada do ponta.',
  futsal: 'Agilidade e aceleração em espaço curto; a força do pivô para proteger a bola.',
  tenis: 'A altura ajuda o saque; agilidade e resistência sustentam os jogos longos.'
};

function trajetoEsporte(v: Vida | undefined, d: Dominio): Trajeto26 {
  const [ini, fim] = janelaDaBase(d);
  const c = contratoDaBase(d);
  const categorias = d === 'futebol' || d === 'futsal' ? 'sub-15 → sub-17 → sub-20' : d === 'tenis' ? 'circuito juvenil, numa academia' : 'equipe de base do clube';
  const es = v?.caminhos.esporte?.modalidade === d ? v.caminhos.esporte : undefined;
  const etapa = v && es ? etapaNaBase(v) : 'fora';
  const pratica = !!v?.rotinas.some(r => r.id === d);
  const pro = es?.fase === 'profissional';
  const acabou = es?.fase === 'encerrada';
  const lista = d === 'futebol' ? ATRIBUTOS_DA_POSICAO.meia : d === 'basquete' ? ATRIBUTOS_BASQUETE.ala : ATRIBUTOS_DA_MODALIDADE[d] ?? [];
  const etapas: Etapa26[] = [
    { nome: 'Praticar por gosto', quando: 'desde a infância', como: `${NOME_MOD[d] ?? d} na semana (Minha Semana · Corpo e mente), com os amigos, na escola. Pode ficar só nisso a vida inteira.`, aqui: pratica && !es, feita: pratica || !!es },
    { nome: 'Treinar a sério', quando: `antes dos ${ini}–${fim} anos`, como: 'Mais vezes por semana, com treinador. A técnica sobe com a prática, a facilidade de nascença e o corpo em dia.' },
    { nome: d === 'futebol' || d === 'futsal' ? 'A peneira' : 'A seletiva', quando: `${ini} a ${fim} anos`, como: 'O teste num clube: chega sozinho para quem treina e se destaca, ou se pede. Passar é raro; reprovar não fecha a porta.', aqui: etapa === 'convidado' || etapa === 'decidindo', feita: !!es },
    { nome: 'A formação', quando: categorias, como: 'Cada ano registra jogos, nota, títulos e a leitura da comissão: capacidade atual, potencial (estimativa) e prontidão. Subir de categoria antes da idade e treinar com o profissional são raros e dependem de desempenho e físico.', aqui: es?.fase === 'base', feita: pro || acabou },
    { nome: d === 'tenis' ? 'Virar profissional' : 'O primeiro contrato', quando: `${c.idade[0]} a ${c.idade[1]} anos (a lei permite a partir dos ${IDADE_LEGAL_CONTRATO}; aqui, aos ${IDADE_LEGAL_CONTRATO} só o excepcional)`, como: d === 'tenis' ? 'Sem clube nem salário: a premiação paga, e treinador e viagens passam a ser seus.' : `Pede técnica de ${c.tecnica} ou mais e prontidão (físico, experiência, maturidade). A maioria é dispensada antes.`, feita: pro || (acabou && !!es?.temporadas?.length) },
    { nome: 'A carreira', quando: d === 'tenis' ? 'o ranking decide o circuito' : 'temporada a temporada', como: `Contratos, propostas, divisões que sobem e caem: ${[1, 2, 3, 4].map(n => divisaoDe(d, n, 'BR')).filter(Boolean).join(' → ')}.`, aqui: pro, feita: acabou && !!es?.temporadas?.length },
    { nome: 'Depois de competir', como: 'Pela trajetória (anos, nível, títulos, nome, formação): convites no ano seguinte ao fim e portas que se procuram (Caminhos · Trabalho).', aqui: acabou }
  ];
  return {
    id: d, grupo: 'esporte', nome: NOME_MOD[d] ? NOME_MOD[d].charAt(0).toUpperCase() + NOME_MOD[d].slice(1) : d,
    comeco: `Começa como atividade da semana, por gosto. ${d === 'tenis' ? 'É caro desde cedo (aulas, viagens do circuito juvenil): a família pesa.' : ''}`.trim(),
    etapas,
    fatores: [`O que mais pesa: ${primeiros(lista).join(', ')}.`, CORPO_PESA[d] ?? '', 'A cabeça conta: disciplina, coragem e controle emocional viram concentração, determinação e compostura.'].filter(Boolean),
    destinos: [1, 2, 3, 4].map(n => divisaoDe(d, n, 'BR')).filter(Boolean),
    depois: depoisDe(v, d),
    alternativas: [
      ...(MODALIDADES_AMADORAS.includes(d) ? [`A porta tardia: depois da idade das bases, ${IDADE_AMADOR[0]}–${IDADE_AMADOR[1]} anos, pelas competições amadoras (um teste num time adulto).`] : []),
      'Ficar no hobby: a prática continua fazendo bem ao corpo e à cabeça, sem carreira.',
      'Mudar de esporte: a técnica de um não passa ao outro, mas o corpo treinado, sim.'
    ],
    meu: !!es || pratica
  };
}

function trajetoJogo(v: Vida | undefined, j: JogoId): Trajeto26 {
  const g = JOGOS25[j];
  const ano = v ? anoDe(v.t) : 2026;
  const e = v?.esports25?.jogo === j ? v.esports25 : undefined;
  const joga = !!v?.rotinas.some(r => r.id === 'videogame');
  const n = (k: number) => g.niveis[k].nome(ano, true);
  return {
    id: `esports_${j}`, grupo: 'esports', nome: g.nome(ano),
    comeco: `Começa jogando por diversão (Minha Semana · Hobbies: videogame). ${ano < g.lancado ? `O jogo só existe a partir de ${g.lancado}.` : ''}`.trim(),
    etapas: [
      { nome: 'Jogar por diversão', quando: 'qualquer idade', como: 'O videogame na semana. Pode ficar só nisso.', aqui: joga && !e, feita: joga || !!e },
      { nome: 'Treinar a sério', quando: 'a partir dos 12', como: `Caminhos · Outros caminhos · E-sports: o treino vira atividade da semana (horas e custo). ${n(0)}.`, aqui: e?.fase === 'amador', feita: !!e && e.nivel >= 2 },
      { nome: 'Competir no amador', como: `${n(1)}: peneiras uma vez por ano, equipes amadoras, campeonatos abertos.`, aqui: !!e && e.fase !== 'encerrada' && e.nivel === 2, feita: !!e && e.nivel >= 3 },
      { nome: 'A primeira equipe profissional', quando: `a partir dos ${g.idadePro}`, como: `${n(2)}: contrato com salário, gaming house (às vezes em outra cidade), banco ou titularidade.`, aqui: !!e && e.fase !== 'encerrada' && e.nivel === 3, feita: !!e && e.nivel >= 4 },
      { nome: 'A elite', como: `${n(3)} → ${n(4)}: o mundial vem por classificação; a mão tem auge (por volta dos ${g.auge}) e a leitura cresce com os anos.`, aqui: !!e && e.fase !== 'encerrada' && e.nivel >= 4 },
      { nome: 'Depois de competir', como: 'Análise, transmissão, conteúdo, comissão e gestão — pelo nível e pelo nome que ficaram.', aqui: e?.fase === 'encerrada' }
    ],
    fatores: [`O que mais pesa: ${[...g.atributos].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => NOME_ATRIBUTO25[id]).join(', ')}.`, `Funções: ${g.funcoes.map(f => f.nome).join(', ')} — cada uma pesa atributos diferentes.`, 'O corpo não dá vantagem no jogo: pesa no cansaço, no estresse e na saúde de quem treina muitas horas.'],
    destinos: g.niveis.map((x, k) => (k === 0 ? '' : x.nome(ano, true))).filter(Boolean),
    depois: depoisDe(v, 'esports'),
    alternativas: ['Ficar no hobby: jogar com os amigos, sem treino nem peneira.', 'Trocar de jogo: a mão ajuda, mas o conhecimento de cada jogo recomeça.'],
    meu: !!e
  };
}

function trajetoPistas(v: Vida | undefined): Trajeto26 {
  const a = v?.automobilismo20;
  const ordem = ['kart', 'entrada', 'f4', 'regional', 'f3', 'f2', 'f1'] as const;
  const atual = a && a.fase !== 'encerrada' ? ordem.indexOf(a.fase) : -1;
  return {
    id: 'automobilismo', grupo: 'pistas', nome: 'Automobilismo',
    comeco: 'Começa no kart, criança ou adolescente (Caminhos · Outros caminhos). Cada categoria custa mais: a família, um patrocinador ou a academia de uma equipe paga.',
    etapas: [
      ...ordem.map((c, k) => ({ nome: nomeCategoria20(c), quando: `a partir dos ${CATEGORIAS20[c].idadeMin}`, como: c === 'f1' ? 'Pede superlicença (pontos dos campeonatos de base) e vaga numa equipe.' : `Temporada de ${CATEGORIAS20[c].corridas} corridas.`, aqui: k === atual, feita: atual > k || a?.fase === 'encerrada' && (a.temporadas ?? []).some(t => ordem.indexOf(t.categoria) > k) })),
      { nome: 'Depois de competir', como: 'Instrução de pilotagem, a preparação de pilotos jovens, a transmissão.', aqui: a?.fase === 'encerrada' }
    ],
    fatores: ['Pilotagem, consistência, adaptação, físico, experiência e cabeça sob pressão — e o carro, que pesa cada vez mais nas categorias de cima.', 'O dinheiro decide quantas temporadas dá para correr.'],
    destinos: ordem.map(nomeCategoria20),
    depois: depoisDe(v, 'automobilismo'),
    alternativas: ['O kart como lazer, sem campeonato.'],
    meu: !!a
  };
}

/** Todos os caminhos (cada modalidade, cada jogo, as pistas), com a posição desta vida marcada. */
export function trajetorias26(v?: Vida): Trajeto26[] {
  return [...MODALIDADES.map(d => trajetoEsporte(v, d)), ...LISTA_JOGOS25.map(j => trajetoJogo(v, j)), trajetoPistas(v)];
}

export const idadeDaVida26 = (v: Vida) => idade(v);
