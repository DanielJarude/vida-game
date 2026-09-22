/**
 * F6 — REDE SOCIAL: como pessoas entram, evoluem e saem de uma vida.
 *
 * Este arquivo responde a UMA pergunta por função, e todas as respostas
 * dependem de fatos do estado. Nada aqui sorteia uma pessoa do nada.
 *
 * O fluxo é sempre o mesmo, e é o do escopo §4 e §19:
 *
 *     ambiente real de convívio            (contextoSocial)
 *        -> oportunidade social            (pode não dar em nada)
 *        -> COLEGA persistente             (conhecido, proximidade baixa)
 *        -> convívio continuado
 *        -> AMIGO                          (progressão, nunca de saída)
 *        -> sem convívio nem contato
 *        -> afastamento lento              (nunca "dreno por turno")
 *
 * O que este arquivo NÃO faz, por decisão de escopo:
 * - não cria turma com 30 NPCs (só persiste quem passou a importar);
 * - não garante amizade (exposição social != amigo);
 * - não usa personalidade como bloqueio (só como inclinação);
 * - não mexe em romance, gravidez, economia ou família de origem.
 */

import type { FamilyMember, Gender, LifeLogEntry } from '../../types';
import { sortearNome, sortearSobrenome } from '../../data/brazilianData';
import { generateId, randomInt, valorAleatorio } from '../../utils/random';
import {
  aberturaSocial,
  ambientesDeConvivio,
  jaConheceAlguemDe,
  perfilDoAmbiente,
  ROTULO_AMBIENTE,
  vinculosSociaisAtivos,
  type AmbienteSocial,
  type FatiasSociais
} from './contextoSocial';

/* ========================================================================== */
/*                        PROGRESSÃO DE PROXIMIDADE (§5)                      */
/* ========================================================================== */

/**
 * Uma pessoa recém-conhecida NÃO pode aparecer como "Muito próxima".
 *
 * A escala de apresentação (`relationshipPresentation`) traduz 0-100 em
 * cinco rótulos, sendo >= 80 "Muito próxima" e >= 60 "Próxima". Um colega
 * novo entra abaixo de 40 — ou seja, no máximo "Estável" — e precisa de anos
 * de convívio para subir. Estes números existem para casar com aquela escala;
 * não são arbitrários.
 */
export const PROXIMIDADE_INICIAL_MIN = 20;
export const PROXIMIDADE_INICIAL_MAX = 35;

/** A partir daqui um colega passa a ser chamado de amigo. */
export const LIMIAR_AMIZADE = 55;

/**
 * Nem todo convívio vira vínculo, e isso não é probabilidade: é temperamento.
 *
 * Sem isto, TODA vida virava sociável — 105/105 com amigo, nenhuma com dois
 * amigos ou menos na vida inteira. O escopo §23 é explícito: uma vida
 * socialmente isolada é um resultado legítimo, e o objetivo é VARIEDADE, não
 * "mais amigos". O problema antigo (63/105 sem amigo) era falta de sistema;
 * trocá-lo por "todo mundo tem amigo" seria o mesmo erro invertido.
 *
 * `afinidade` é uma característica estável da pessoa, derivada de forma
 * determinística do seu id: parte das pessoas simplesmente faz vínculo com
 * mais facilidade que outras. Não é personalidade (que o jogador constrói
 * por escolhas) e não move traço nenhum.
 */
function afinidadeDaPessoa(pessoa: FamilyMember): number {
  // Derivada de um dado ESTÁVEL e próprio da pessoa. Não uso o `id` porque
  // `generateId` combina `Date.now()` com `Math.random()` — ele ignora a
  // fonte determinística dos testes e pode repetir dentro do mesmo
  // milissegundo, o que daria a todo mundo a mesma afinidade.
  //
  // A proximidade inicial já é sorteada numa faixa e nunca mais é "redefinida"
  // do zero, então serve de semente natural: quem entrou com um pouco mais de
  // afinidade tende a engatar, quem entrou no mínimo tende a ficar conhecido.
  const base = (pessoa.idadeEntrada ?? 0) * 7 + pessoa.nome.length * 13 + pessoa.idade;
  return ((base * 2654435761) % 1000) / 1000;
}

/**
 * Fração dos conhecidos que nunca passa de conhecido, por mais que se
 * conviva. São os colegas de turma de anos inteiros que nunca viraram nada.
 */
const FRACAO_SEM_QUIMICA = 0.45;

/**
 * Na infância a turma é pequena e a convivência é diária: a chance de que
 * alguém da sala vire alguém que importa é maior do que na vida adulta.
 * Medido: sem esta distinção, 77% das vidas chegavam aos 10 anos sem
 * nenhum amigo, o que contradiz o §22 (6-11: "escola e amizades começam a
 * importar"). Não é garantia — continua havendo criança sem amigo.
 */
const BONUS_ESCOLA_INFANCIA = 1.6;
const IDADE_FIM_INFANCIA = 11;

/**
 * Quanto o convívio continuado aproxima por ano. Lento de propósito.
 *
 * Mas não igual em toda idade: na infância e na adolescência convive-se com
 * as mesmas pessoas todos os dias, numa turma pequena, e amizade se forma
 * rápido. Na vida adulta o convívio é mais diluído.
 *
 * Isto não é um atalho para "dar amigos a crianças": medido, com um ritmo
 * único de adulto só 8% das infâncias tinham amigo aos 10 — e a escola é,
 * pelo escopo §4 e §22, a primeira grande rede social fora da família.
 */
const GANHO_CONVIVIO_MIN = 3;
const GANHO_CONVIVIO_MAX = 9;

/** Idade até a qual o convívio diário da turma aproxima mais depressa. */
const IDADE_CONVIVIO_INTENSO = 17;
const GANHO_JOVEM_MIN = 6;
const GANHO_JOVEM_MAX = 15;

/** Anos sem contato até o afastamento começar a pesar. */
export const ANOS_ATE_AFASTAMENTO = 3;

/** Perda anual de proximidade quando não há mais convívio nem contato. */
const PERDA_POR_DISTANCIA = 4;

/** Abaixo disto, a relação deixou de ser parte da vida. */
export const LIMIAR_RELACAO_ENCERRADA = 10;

/* ========================================================================== */
/*                      CRIAÇÃO DE PESSOA COM ORIGEM                          */
/* ========================================================================== */

/**
 * Profissões plausíveis para adultos conhecidos no trabalho ou na vizinhança.
 * Deliberadamente genéricas: a F6 não modela carreira de NPC.
 */
const OCUPACOES_ADULTAS: readonly string[] = [
  'Atendente', 'Vendedor', 'Professor', 'Motorista', 'Enfermeiro',
  'Auxiliar administrativo', 'Pedreiro', 'Cozinheiro', 'Técnico de informática',
  'Recepcionista', 'Eletricista', 'Contador'
];

/**
 * Como descrever a ocupação de quem ainda estuda. O escopo §13 é explícito:
 * criança/adolescente NÃO recebe profissão adulta só porque o gerador tem o
 * campo. "Estudante" é a resposta correta, não um placeholder.
 */
const OCUPACAO_ESTUDANTE = 'Estudante';

/**
 * Cria uma pessoa COM ORIGEM. É o único caminho pelo qual a F6 introduz
 * alguém não familiar na vida — e ele exige um ambiente real como argumento,
 * de modo que "relação sem causa" é impossível por construção.
 */
export function criarConhecido(
  ambiente: AmbienteSocial,
  idadePersonagem: number,
  sobrenomeJogador: string
): FamilyMember {
  const perfil = perfilDoAmbiente(ambiente, idadePersonagem);
  const genero: Gender = valorAleatorio() > 0.5 ? 'masculino' : 'feminino';
  const idade = randomInt(perfil.idadeMin, perfil.idadeMax);

  // Regra §12/§13: quem estuda não exerce profissão adulta.
  //
  // O vínculo é com o AMBIENTE, não com a idade de maioridade: um colega de
  // turma do 3º ano do Ensino Médio pode ter 18 anos e continua sendo
  // estudante. Um teste pegou exatamente este caso — a versão anterior
  // exigia `idade < 18` e dava "Pedreiro" ao colega de classe de 18 anos.
  const estudante = perfil.estudante;
  const profissao = estudante
    ? OCUPACAO_ESTUDANTE
    : OCUPACOES_ADULTAS[randomInt(0, OCUPACOES_ADULTAS.length - 1)];

  return {
    id: generateId('soc'),
    nome: sortearNome(genero),
    // Pessoa de fora da família não compartilha o sobrenome do jogador.
    sobrenome: ambiente === 'familia_estendida' ? sobrenomeJogador : sortearSobrenome(),
    genero,
    tipo: 'colega',
    idade,
    relacionamento: randomInt(PROXIMIDADE_INICIAL_MIN, PROXIMIDADE_INICIAL_MAX),
    vivo: true,
    ativo: true,
    profissao,
    estudante,
    origemSocial: ambiente,
    idadeEntrada: idadePersonagem,
    ultimoContatoIdade: idadePersonagem,
    situacaoAtual: `Conheceu na ${ROTULO_AMBIENTE[ambiente]}`
  };
}

/* ========================================================================== */
/*                   O ANO SOCIAL: oportunidade, não garantia                 */
/* ========================================================================== */

/**
 * A frase que registra uma amizade nova, por ORIGEM.
 *
 * Havia uma frase só, com a palavra "colégio" fixa — ela aparecia também
 * quando a amizade nascia no trabalho, na vizinhança ou por outro amigo, o
 * que é literalmente inventar um passado que não houve (o erro que a F5-FIX
 * corrigiu na economia). A leitura de timelines pegou o caso.
 */
function fraseDeAmizade(origem: AmbienteSocial | undefined, nome: string): string {
  switch (origem) {
    case 'escola':
      return `O que era colégio virou amizade: ${nome} passou a ser presença certa.`;
    case 'faculdade':
      return `Entre uma aula e outra, ${nome} deixou de ser só alguém da turma.`;
    case 'trabalho':
      return `O expediente aproximou vocês: ${nome} virou amizade de verdade, fora do trabalho.`;
    case 'atividade':
      return `O que começou como companhia na atividade virou amizade: ${nome}.`;
    case 'vizinhanca':
      return `De vizinho a amigo: ${nome} passou a fazer parte dos seus dias.`;
    case 'amigo_de_amigo':
      return `Apresentado por gente em comum, ${nome} acabou virando amigo seu também.`;
    case 'familia_estendida':
      return `Parente que virou amizade: ${nome} passou a ser presença certa.`;
    default:
      return `${nome} passou a ser presença certa na sua vida.`;
  }
}

export interface ResultadoAnoSocial {
  readonly familiaAtualizada: FamilyMember[];
  readonly logs: LifeLogEntry[];
}

/**
 * Chance-base de que um ano de convívio num ambiente produza alguém que valha
 * a pena persistir. Baixa de propósito: a maior parte dos colegas de turma
 * continua sendo gente anônima que não entra na aba Pessoas (§19).
 */
const CHANCE_BASE_NOVO_CONHECIDO: Record<AmbienteSocial, number> = {
  escola: 0.34,
  faculdade: 0.28,
  trabalho: 0.22,
  atividade: 0.20,
  vizinhanca: 0.10,
  familia_estendida: 0.05,
  amigo_de_amigo: 0.10
};

/**
 * Teto de vínculos sociais ativos. A vida não vira uma agenda telefônica.
 *
 * Medido: com teto 6, a mediana de COLEGAS ativos no fim da vida ficava em 3
 * e a cauda chegava a 12 — gente acumulada que nunca virou nada e que só
 * polui a aba Pessoas. O teto passou a valer também para conhecidos que
 * seguem apenas conhecidos, e um colega que nunca se aproximou em muitos
 * anos simplesmente sai de cena (ninguém guarda contato de todo mundo com
 * quem já dividiu uma sala).
 */
const MAX_VINCULOS_ATIVOS = 5;

/**
 * Anos que um COLEGA pode ficar parado, sem virar amizade, antes de sumir
 * naturalmente. Não vale para amigos: amizade não expira por inatividade
 * (§8), só esfria por distância.
 */
const ANOS_COLEGA_SEM_EVOLUIR = 6;

/**
 * Abaixo disto, depois de anos, a relação claramente não engatou. Fica acima
 * da faixa de entrada (20-35) para não aposentar quem está progredindo.
 */
const PROXIMIDADE_ESTAGNADA = 40;

/**
 * Resolve o ano social: quem entrou, quem se aproximou, quem se afastou.
 *
 * Função PURA em relação ao estado (devolve nova lista) e o único ponto do
 * jogo que faz a rede social evoluir sozinha. Não abre modal, não altera
 * atributos, não toca em dinheiro nem em personalidade.
 */
export function processarAnoSocial(
  f: FatiasSociais,
  anoAtual: number
): ResultadoAnoSocial {
  const idade = f.personagem.idade;
  const logs: LifeLogEntry[] = [];
  const ambientes = ambientesDeConvivio(f);

  // Ambiente de origem ainda presente = ainda há convívio com quem veio dele.
  const ambienteAtivo = new Set<string>(ambientes);

  let familia = f.familia.map(m => ({ ...m }));

  /* ---------- 1. Evolução das relações que já existem ------------------ */
  for (const pessoa of familia) {
    if (!pessoa.vivo) continue;
    if (!pessoa.origemSocial) continue; // família e pets não entram aqui
    if (pessoa.ativo === false) continue;

    const conviveAinda = ambienteAtivo.has(pessoa.origemSocial);

    // Um COLEGA ESTAGNADO sai de cena: é a pessoa da turma de quem não se
    // lembra o nome, e mantê-la para sempre na aba Pessoas seria o ruído que
    // o §19 proíbe.
    //
    // "Estagnado" é a palavra exata, e custou um teste: a primeira versão
    // aposentava qualquer colega com N anos de relação, inclusive os que
    // estavam se aproximando devagar — eles eram cortados no ano anterior ao
    // de virar amizade. Agora só sai quem, depois de todo esse tempo, ainda
    // está perto de onde começou. Não vale para amigos (§8).
    const estagnado = pessoa.relacionamento < PROXIMIDADE_ESTAGNADA;
    if (
      pessoa.tipo === 'colega' &&
      estagnado &&
      idade - (pessoa.idadeEntrada ?? idade) >= ANOS_COLEGA_SEM_EVOLUIR
    ) {
      pessoa.ativo = false;
      continue;
    }

    if (conviveAinda) {
      // Convívio continuado aproxima — devagar.
      // A intensidade vem do AMBIENTE, não só da idade: faculdade é convívio
      // diário com a mesma turma, igual à escola. Medido: sem isto, o
      // universitário ficava em 22,5% de amizade contra 53,5% da criança —
      // implausível para a fase da vida em que mais se fazem amigos.
      const ambienteIntenso =
        pessoa.origemSocial === 'escola' || pessoa.origemSocial === 'faculdade';
      const jovem = idade <= IDADE_CONVIVIO_INTENSO || ambienteIntenso;
      const bruto = jovem
        ? randomInt(GANHO_JOVEM_MIN, GANHO_JOVEM_MAX)
        : randomInt(GANHO_CONVIVIO_MIN, GANHO_CONVIVIO_MAX);

      // Convivência sem química rende pouco e não chega a virar amizade.
      const afinidade = afinidadeDaPessoa(pessoa);
      const ganho = afinidade < FRACAO_SEM_QUIMICA ? Math.round(bruto * 0.25) : bruto;
      const antes = pessoa.relacionamento;
      pessoa.relacionamento = Math.min(100, pessoa.relacionamento + ganho);
      pessoa.ultimoContatoIdade = idade;

      // Promoção a amizade: o degrau que torna a amizade CONQUISTADA.
      //
      // A condição NÃO exige mais que a travessia aconteça exatamente neste
      // ano (`antes < LIMIAR`). Isso fazia com que qualquer colega que já
      // chegasse acima do limiar por outro caminho — um evento que declara
      // proximidade alta, um save antigo — ficasse 'colega' para sempre. A
      // leitura de timelines mostrou colegas parados em proximidade 99.
      // `antes` continua sendo usado só para decidir se a linha entra na
      // biografia (a promoção é notícia uma vez só).
      if (pessoa.tipo === 'colega' && pessoa.relacionamento >= LIMIAR_AMIZADE) {
        pessoa.tipo = pessoa.genero === 'feminino' ? 'amiga' : 'amigo';
        pessoa.situacaoAtual = `Amizade que veio da ${ROTULO_AMBIENTE[pessoa.origemSocial as AmbienteSocial] ?? 'convivência'}`;
        if (antes < LIMIAR_AMIZADE) {
          logs.push({
            id: generateId('log'),
            idade,
            ano: anoAtual,
            categoria: 'familia',
            texto: fraseDeAmizade(pessoa.origemSocial as AmbienteSocial, pessoa.nome),
            relevancia: 'normal'
          });
        }
      }
    } else {
      // §7 — sem contexto compartilhado, a relação esfria. Mas só depois de
      // um tempo, e devagar: amizade não evapora porque mudou de escola (§8).
      const semContatoHa = idade - (pessoa.ultimoContatoIdade ?? idade);
      if (semContatoHa >= ANOS_ATE_AFASTAMENTO) {
        pessoa.relacionamento = Math.max(0, pessoa.relacionamento - PERDA_POR_DISTANCIA);

        // (o laço já ignorou quem estava inativo, então aqui a relação
        // necessariamente ainda estava em curso)
        if (pessoa.relacionamento <= LIMIAR_RELACAO_ENCERRADA) {
          pessoa.ativo = false;
          const eraAmigo = pessoa.tipo === 'amigo' || pessoa.tipo === 'amiga';
          if (eraAmigo) {
            // Só o fim de uma AMIZADE é biografia. Perder contato com um
            // colega qualquer não é (§20: biografia != log de ações).
            logs.push({
              id: generateId('log'),
              idade,
              ano: anoAtual,
              categoria: 'familia',
              texto: `Você e ${pessoa.nome} foram deixando de se falar, sem briga nenhuma.`,
              relevancia: 'normal'
            });
          }
        }
      }
    }
  }

  /* ---------- 2. Alguém novo pode entrar ------------------------------- */
  const ativos = vinculosSociaisAtivos({ ...f, familia }).length;
  if (ativos < MAX_VINCULOS_ATIVOS && ambientes.length > 0) {
    const abertura = aberturaSocial(f);

    for (const ambiente of ambientes) {
      // Uma origem por vez: se já há alguém da escola, a escola rende menos.
      const jaTem = jaConheceAlguemDe({ ...f, familia }, ambiente);
      const bonusInfancia =
        ambiente === 'escola' && idade <= IDADE_FIM_INFANCIA ? BONUS_ESCOLA_INFANCIA : 1;
      const chance =
        CHANCE_BASE_NOVO_CONHECIDO[ambiente] * abertura * bonusInfancia * (jaTem ? 0.35 : 1);

      if (valorAleatorio() < chance) {
        const pessoa = criarConhecido(ambiente, idade, f.personagem.sobrenome);
        familia.push(pessoa);
        // Conhecer alguém ainda não é biografia — vira linha só quando a
        // relação passa a importar (§20). Nenhum log aqui, de propósito.
        break; // no máximo UMA pessoa nova por ano
      }
    }
  }

  return { familiaAtualizada: familia, logs };
}
