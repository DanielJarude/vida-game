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
import { CATEGORIAS20, nomeCategoria20, podeComecar20 } from '../../v20/automobilismo/automobilismo20';
import { podeComecar25 } from '../../v25/esports/esports25';
import { ESTILOS26, LISTA_ESTILOS26, NOME_FAMILIA26, type EstiloLuta26 } from '../esporte/estilos26';
import { tecnicaNoEstilo26 } from '../lutas/luta26';
import { FAMILIAS } from '../../dados/carreiras';
import { ROTULO_TRILHA } from '../../dados/ocupacoes';
import { POS_CARREIRA26, type OrigemPos26 } from './posCarreira26';
import { IDADE_LEGAL_CONTRATO } from '../../sistemas/jovemAtleta';

export interface Etapa26 { nome: string; quando?: string; como: string; aqui?: boolean; feita?: boolean }
/** Onde esta vida está em relação ao caminho (VIDA 26.1): nada aqui concede coisa alguma — orienta. */
export type EstadoDoTrajeto = 'andamento' | 'disponivel' | 'futuro' | 'encerrado' | 'fora';
export const NOME_ESTADO26: Record<EstadoDoTrajeto, string> = { andamento: 'em andamento', disponivel: 'ao seu alcance', futuro: 'mais adiante', encerrado: 'já percorrido', fora: 'fora de alcance agora' };
export interface Trajeto26 {
  id: string;
  grupo: 'esporte' | 'esports' | 'pistas' | 'profissao';
  nome: string;
  /** A área ou modalidade, em palavras ("esporte coletivo", "e-sports · tático", "saúde"). */
  area: string;
  /** VIDA 26.1: o estado para esta vida, com o porquê (a regra real que decide). */
  estado: EstadoDoTrajeto;
  porque: string;
  /** VIDA 26.1: as FORMAS DE COMEÇAR (as bifurcações da entrada) — nenhuma obrigatória. */
  entradas: string[];
  /** VIDA 26.1: onde se dá o próximo passo de verdade (um destino de navegação existente) e o rótulo do botão. */
  ir?: { rotulo: string; destino: string };
  /** VIDA 26.1: palavras para a busca (sinônimos, estilos, nomes dos jogos). */
  chaves: string;
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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
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
    { nome: 'Praticar por gosto', quando: 'desde a infância', como: `${cap(NOME_MOD[d] ?? d)} na semana (Minha Semana · Corpo e mente), com os amigos, na escola. Pode ficar só nisso a vida inteira.`, aqui: pratica && !es, feita: pratica || !!es },
    { nome: 'Treinar a sério', quando: `antes da janela da peneira (${ini}–${fim} anos)`, como: 'Mais vezes por semana, com treinador. A técnica sobe com a prática, a facilidade de nascença e o corpo em dia.' },
    { nome: d === 'futebol' || d === 'futsal' ? 'A peneira' : 'A seletiva', quando: `${ini} a ${fim} anos`, como: 'O teste num clube: chega sozinho para quem treina e se destaca, ou se pede. Passar é raro; reprovar não fecha a porta.', aqui: etapa === 'convidado' || etapa === 'decidindo', feita: !!es },
    { nome: 'A formação', quando: categorias, como: 'Cada ano registra jogos, nota, títulos e a leitura da comissão: capacidade atual, potencial (estimativa) e prontidão. Subir de categoria antes da idade e treinar com o profissional são raros e dependem de desempenho e físico.', aqui: es?.fase === 'base', feita: pro || acabou },
    { nome: d === 'tenis' ? 'Virar profissional' : 'O primeiro contrato', quando: `${c.idade[0]} a ${c.idade[1]} anos (a lei permite a partir dos ${IDADE_LEGAL_CONTRATO}; aqui, aos ${IDADE_LEGAL_CONTRATO} só o excepcional)`, como: d === 'tenis' ? 'Sem clube nem salário: a premiação paga, e treinador e viagens passam a ser seus.' : `Pede técnica de ${c.tecnica} ou mais e prontidão (físico, experiência, maturidade). A maioria é dispensada antes.`, feita: pro || (acabou && !!es?.temporadas?.length) },
    { nome: 'A carreira', quando: d === 'tenis' ? 'o ranking decide o circuito' : 'temporada a temporada', como: `Contratos, propostas, divisões que sobem e caem: ${[1, 2, 3, 4].map(n => divisaoDe(d, n, 'BR')).filter(Boolean).join(' → ')}.`, aqui: pro, feita: acabou && !!es?.temporadas?.length },
    { nome: 'Depois de competir', como: 'Pela trajetória (anos, nível, títulos, nome, formação): convites no ano seguinte ao fim e portas que se procuram (Caminhos · Trabalho).', aqui: acabou }
  ];
  // VIDA 26.1: o estado desta vida no caminho (pela regra real: a janela da peneira, a porta amadora, a carreira).
  const i = v ? idade(v) : 15;
  const amador = MODALIDADES_AMADORAS.includes(d);
  const [estado, porque]: [EstadoDoTrajeto, string] = pro || es?.fase === 'base' ? ['andamento', es?.fase === 'base' ? 'Na formação.' : 'Na carreira profissional.']
    : acabou ? ['encerrado', es?.temporadas?.length ? 'A carreira competitiva acabou — o depois continua.' : 'A tentativa na base acabou; o esporte segue como hobby, se quiser.']
      : i < 6 ? ['futuro', 'A prática começa por volta dos 6 anos.']
        : i <= fim ? ['disponivel', i < ini ? `Dá para começar a praticar; a peneira abre por volta dos ${ini}.` : 'Na janela da peneira: treinar, pedir um teste, esperar o convite.']
          : amador && i <= IDADE_AMADOR[1] ? ['disponivel', `A idade das bases passou; a porta amadora vai até uns ${IDADE_AMADOR[1]}.`]
            : ['fora', 'A idade de competir passou: o esporte segue como hobby — e quem jogou a sério pode ensinar.'];
  const lutas = d === 'lutas';
  return {
    id: d, grupo: 'esporte', nome: lutas ? 'Lutas (artes marciais)' : NOME_MOD[d] ? NOME_MOD[d].charAt(0).toUpperCase() + NOME_MOD[d].slice(1) : d,
    area: ['futebol', 'futsal', 'basquete', 'volei'].includes(d) ? 'esporte coletivo, de clube' : d === 'tenis' ? 'esporte individual, de circuito' : 'esporte individual, com equipe',
    estado, porque,
    entradas: [
      `Por gosto, na semana (Minha Semana · Corpo e mente)${lutas ? ': aulas numa academia; o treino de competição pede algumas faixas' : d === 'tenis' ? ': aulas, depois uma academia — é caro, a família pesa' : ''}`,
      `A ${d === 'futebol' || d === 'futsal' ? 'peneira' : 'seletiva'} que chega sozinha a quem treina e se destaca (${ini}–${fim} anos)`,
      'Pedir um teste num clube (Caminhos · Outros caminhos)',
      ...(amador ? [`Depois da idade das bases: a porta amadora (${IDADE_AMADOR[0]}–${IDADE_AMADOR[1]} anos), ${lutas ? 'pelos torneios abertos' : 'pelas competições amadoras'}`] : [])
    ],
    ir: pro ? { rotulo: 'Ver a carreira', destino: 'trabalho' } : es?.fase === 'base' || acabou ? { rotulo: 'Ver em Outros caminhos', destino: 'outros_caminhos' } : { rotulo: pratica ? 'Ver a prática' : 'Começar a praticar', destino: 'corpo' },
    chaves: [d, NOME_MOD[d] ?? '', lutas ? 'luta lutador arte marcial muay thai jiu jitsu judo boxe karate mma taekwondo' : '', d === 'futebol' ? 'bola soccer jogador' : '', d === 'volei' ? 'voleibol' : '', d === 'atletismo' ? 'corrida maratona salto arremesso' : '', d === 'natacao' ? 'nadar piscina nadador' : ''].join(' '),
    comeco: `Começa como atividade da semana, por gosto. ${d === 'tenis' ? 'É caro desde cedo (aulas, viagens do circuito juvenil): a família pesa.' : lutas ? 'Muay Thai, jiu-jitsu, judô, boxe, MMA: no jogo, as artes marciais são uma modalidade só — o que muda de um lutador para outro é o perfil (golpes em pé, luta no chão, defesa) e a categoria de peso.' : ''}`.trim(),
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


/**
 * VIDA 26.2 · a luta, por ESTILO: o mesmo caminho do motor (prática → seletiva → equipe → profissional → depois), com o
 * que é de cada estilo — os atributos que pesam, as faixas (onde há), as competições, a idade do MMA — e o custo de
 * trocar para ele a partir do estilo de agora (`luta26.tecnicaNoEstilo26`).
 */
function trajetoEstilo(v: Vida | undefined, id: EstiloLuta26): Trajeto26 {
  const b = trajetoEsporte(v, 'lutas');
  const st = ESTILOS26[id];
  const meu = v?.lutas26?.estilo;
  const pratica = !!v && (v.rotinas.some(r => r.id === 'lutas') || (v.caminhos.esporte?.modalidade === 'lutas' && v.caminhos.esporte.fase !== 'encerrada'));
  const esteEoMeu = meu === id;
  const i = v ? idade(v) : 20;
  let estado = b.estado, porque = b.porque;
  // Quem já luta outro estilo: este é uma troca (o custo dito); quem luta sem estilo: o pedido de escolher.
  if (pratica && b.estado !== 'encerrado' && !esteEoMeu) {
    if (b.estado === 'andamento') estado = 'disponivel';
    porque = meu ? `Você luta ${ESTILOS26[meu].nome}; trocar aproveita parte da técnica (começaria em ${Math.round(tecnicaNoEstilo26(v!, id))}). ${b.estado === 'andamento' ? '' : b.porque}`.trim()
      : 'Você treina luta sem estilo definido: escolha o estilo na prática (Minha Semana · Corpo e mente).';
  }
  if (id === 'mma' && i < 18 && estado !== 'encerrado' && estado !== 'fora') { estado = estado === 'andamento' ? estado : 'futuro'; porque = 'MMA de competição só a partir dos 18; antes, dá para treinar os estilos que o compõem.'; }
  const faixas = st.faixas ? `Faixas: ${st.faixas.map(f => f.nome).join(' → ')} (pela técnica, pelos anos de prática e pela idade).` : '';
  const etapas = b.etapas.map((e, k) => ({ ...e,
    // A etapa "você está aqui" só no estilo que é o seu (sem estilo escolhido, nenhum: a tela pede a escolha).
    aqui: !!e.aqui && esteEoMeu,
    como: k === 0 ? `Aulas de ${st.nome} numa academia (Minha Semana · Corpo e mente: luta, com o estilo escolhido). ${faixas}`.trim()
      : e.nome === 'A seletiva' ? `A seletiva de uma equipe, ou ${st.amador}: chega a quem treina e se destaca, ou se pede.`
        : e.nome === 'A carreira' ? `${cap(st.profissional)}: as categorias de peso, o cartel (vitórias, derrotas, antes do tempo), os títulos.` : e.como }));
  return { ...b, id: `lutas_${id}`, nome: st.nome, area: `${NOME_FAMILIA26[st.familia]} · lutas`, estado, porque, etapas,
    comeco: `${st.sobre} Começa como atividade da semana, por gosto — o treino de competição pede algumas faixas (ou técnica).`,
    entradas: [`Aulas por gosto (Minha Semana · Corpo e mente) — escolher ${st.nome} como estilo`, ...b.entradas.slice(1).map(x => x.replace('pelos torneios abertos', `pelos torneios abertos (${st.amador})`)), ...(meu && meu !== id ? [`Trocar do ${ESTILOS26[meu].nome}: a técnica começa em ${Math.round(tecnicaNoEstilo26(v!, id))}; a do ${ESTILOS26[meu].nome} fica guardada`] : [])],
    fatores: [`O que mais pesa: ${primeiros(st.atributos).join(', ')}.`, 'Lutas são por categoria de peso: o corpo decide a categoria, não a chance.', 'A cabeça conta: disciplina, coragem e controle emocional viram concentração, determinação e compostura.'],
    chaves: `${st.chaves} ${st.nome} luta lutas lutador arte marcial ${NOME_FAMILIA26[st.familia]}`,
    meu: esteEoMeu && b.meu };
}

function trajetoJogo(v: Vida | undefined, j: JogoId): Trajeto26 {
  const g = JOGOS25[j];
  const ano = v ? anoDe(v.t) : 2026;
  const e = v?.esports25?.jogo === j ? v.esports25 : undefined;
  const joga = !!v?.rotinas.some(r => r.id === 'videogame');
  const n = (k: number) => g.niveis[k].nome(ano, true);
  const fimJ = v?.esports25?.jogo === j && v.esports25.fase === 'encerrada';
  const pode = v ? podeComecar25(v, j) : undefined;
  const [estado, porque]: [EstadoDoTrajeto, string] = e && !fimJ ? ['andamento', `No degrau ${e.nivel} de 5.`]
    : fimJ ? ['encerrado', 'A carreira competitiva acabou — o depois continua.']
      : !pode || pode.grau === 'permitido' ? ['disponivel', 'Dá para levar a sério agora.']
        : (v && idade(v) < 12) || ano < g.lancado ? ['futuro', pode.motivo ?? '']
          : ['fora', pode.motivo ?? ''];
  return {
    id: `esports_${j}`, grupo: 'esports', nome: g.nome(ano),
    area: `e-sports · ${{ tatico: 'tiro tático em equipe', battle_royale: 'battle royale', moba: 'MOBA', carros: 'futebol de carros' }[g.genero]}`,
    estado, porque,
    entradas: ['Jogar por diversão (Minha Semana · Hobbies: videogame) — pode ficar só nisso', 'Levar a sério: Caminhos · Outros caminhos · E-sports (ranqueadas, treino na semana)', 'O convite de um time amador, para quem joga há anos', `Peneiras: uma por ano, com vaga por função (${g.funcoes.map(f => f.nome).join(', ')})`],
    ir: { rotulo: e ? 'Ver a carreira' : 'Ver em Outros caminhos', destino: 'outros_caminhos' },
    chaves: `${j} ${g.nome(ano)} ${{ cs: 'counter strike counterstrike csgo cs2 cs 1.6', r6: 'rainbow six siege r6', fortnite: 'fortnite fn', valorant: 'valorant valo', lol: 'league of legends lol', rocket: 'rocket league' }[j]} esports e-sports videogame gamer competitivo`,
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
  const p20 = v ? podeComecar20(v) : undefined;
  const [estado, porque]: [EstadoDoTrajeto, string] = a && a.fase !== 'encerrada' ? ['andamento', `Na categoria ${nomeCategoria20(a.fase)}.`]
    : a?.fase === 'encerrada' ? ['encerrado', 'A carreira nas pistas acabou — o depois continua.']
      : !p20 || p20.grau === 'permitido' ? ['disponivel', 'Dá para começar no kart agora.']
        : v && idade(v) < CATEGORIAS20.kart.idadeMin ? ['futuro', p20.motivo ?? ''] : ['fora', p20.motivo ?? ''];
  return {
    id: 'automobilismo', grupo: 'pistas', nome: 'Automobilismo', area: 'esporte a motor', estado, porque,
    entradas: [`O kart, a partir dos ${CATEGORIAS20.kart.idadeMin} (Caminhos · Outros caminhos) — até os 17`, 'Quem paga: a família, um patrocinador ou a academia de uma equipe', 'Depois dos 17: só o kart amador'],
    ir: { rotulo: a ? 'Ver a carreira' : 'Ver em Outros caminhos', destino: 'outros_caminhos' },
    chaves: 'automobilismo kart formula f1 f2 f3 f4 piloto corrida pista carro',
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

/** Onde se dá o primeiro passo de cada família de profissões (destinos de navegação existentes). */
const IR_DA_FAMILIA: Record<string, { rotulo: string; destino: string }> = {
  publico: { rotulo: 'Ver os concursos', destino: 'concursos' }, seguranca: { rotulo: 'Ver os concursos', destino: 'concursos' }, militar: { rotulo: 'Ver os concursos', destino: 'concursos' },
  politica: { rotulo: 'Ver a vida pública', destino: 'vida_publica' },
  academia: { rotulo: 'Ver a faculdade', destino: 'faculdade' }, saude: { rotulo: 'Ver a faculdade e os cursos', destino: 'cursos' }, direito: { rotulo: 'Ver a faculdade', destino: 'faculdade' },
  engenharia: { rotulo: 'Ver a faculdade', destino: 'faculdade' }, docencia: { rotulo: 'Ver os cursos', destino: 'cursos' }, tecnologia: { rotulo: 'Ver os cursos', destino: 'cursos' },
  palco: { rotulo: 'Ver em Outros caminhos', destino: 'outros_caminhos' }, criacao: { rotulo: 'Ver as redes e os hobbies', destino: 'atividades' }
};
const RENDA: Record<string, string> = { estavel: 'renda estável', variavel: 'renda variável (bons e maus meses)', sazonal: 'renda que muda com a estação', projeto: 'renda por projeto, contrato ou temporada' };
const DESGASTE: Record<string, string> = { corpo: 'o corpo', cabeca: 'a cabeça', noite: 'noites e fins de semana', longe: 'tempo longe de casa' };

/**
 * VIDA 26.1 · as PROFISSÕES (fora do esporte): as famílias de carreira que o trabalho já usa (`dados/carreiras`) — a
 * entrada, os degraus, a renda, o desgaste e as saídas de cada uma. O estado vem do emprego de agora e do histórico.
 */
function trajetoProfissao(v: Vida | undefined, f: (typeof FAMILIAS)[number]): Trajeto26 {
  const i = v ? idade(v) : 25;
  const trilhaAtual = v?.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined;
  const passou = !!v?.trabalho.historico.some(h => f.trilhas.includes(ocupacaoOuNula(h.ocupacaoId)?.trilha ?? ''));
  const [estado, porque]: [EstadoDoTrajeto, string] = trilhaAtual && f.trilhas.includes(trilhaAtual) ? ['andamento', 'É o seu trabalho agora.']
    : passou ? ['encerrado', 'Você já trabalhou nisso.'] : i < 14 ? ['futuro', 'O trabalho começa a partir dos 14 (como aprendiz).'] : ['disponivel', 'Dá para tentar: cada vaga diz o que pede.'];
  const desgaste = Object.entries(f.desgaste).filter(([, x]) => (x ?? 0) >= 0.3).map(([k]) => DESGASTE[k]);
  return {
    id: `prof_${f.id}`, grupo: 'profissao', nome: f.nome.charAt(0).toUpperCase() + f.nome.slice(1), area: 'profissão', estado, porque,
    comeco: `Como se costuma entrar: ${f.entrada}.`,
    entradas: [cap(f.entrada)],
    etapas: f.degraus.map((d, k) => ({ nome: cap(d), como: k === 0 ? 'A porta de entrada.' : k === f.degraus.length - 1 ? 'O degrau mais alto que a carreira costuma ter.' : 'Com experiência, desempenho e, às vezes, formação.' })),
    fatores: [`${cap(RENDA[f.renda])}.`, desgaste.length ? `O que cobra: ${desgaste.join(', ')}.` : 'Desgaste moderado.', ...(f.sentido?.length ? ['Para quem gosta da área, o trabalho alimenta (não só cobra).'] : [])],
    destinos: f.degraus.map(cap),
    depois: f.saidas.map(t => ROTULO_TRILHA[t] ?? t),
    alternativas: ['Mudar de área: parte da experiência conta nas trilhas vizinhas.', 'Estudar para abrir outras portas (Caminhos · Estudos).'],
    ir: IR_DA_FAMILIA[f.id] ?? { rotulo: 'Ver as vagas', destino: 'vagas' },
    chaves: `${f.nome} ${f.trilhas.map(t => ROTULO_TRILHA[t] ?? t).join(' ')} profissao trabalho emprego carreira`,
    meu: estado === 'andamento'
  };
}

/** Todos os caminhos (cada modalidade, cada jogo, as pistas, as profissões), com a posição desta vida marcada. */
export function trajetorias26(v?: Vida): Trajeto26[] {
  return [...MODALIDADES.flatMap(d => (d === 'lutas' ? LISTA_ESTILOS26.map(x => trajetoEstilo(v, x)) : [trajetoEsporte(v, d)])), ...LISTA_JOGOS25.map(j => trajetoJogo(v, j)), trajetoPistas(v), ...FAMILIAS.filter(f => f.id !== 'esporte').map(f => trajetoProfissao(v, f))];
}

export const idadeDaVida26 = (v: Vida) => idade(v);
