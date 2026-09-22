/**
 * memorias/pequenaMemoria — a vida continua acontecendo mesmo quando nada
 * acontece (F3, passo 7).
 *
 * O PROBLEMA MEDIDO: depois de destravar a saturação (passo 3), 14% dos anos
 * adultos ficaram COMPLETAMENTE vazios — nenhuma linha na Linha da Vida.
 * Isso não é o silêncio saudável que o B4-FIX4 defendeu; é uma lacuna. A
 * pessoa morava em algum lugar, tinha (ou não) um emprego, filhos, dívida,
 * uma idade. O ano existiu. Ele só não foi registrado.
 *
 * A TENTAÇÃO ERRADA, que este módulo recusa explicitamente: sortear uma
 * frase de uma lista de frases genéricas. Foi exatamente isso que o B4-FIX4
 * removeu ao apagar "Um ano sem grandes acontecimentos" — um texto de
 * preenchimento que interrompia o jogador para dizer que nada merecia
 * interrompê-lo. Não vai voltar.
 *
 * O que este módulo faz é diferente em espécie, não em grau: a frase é
 * DERIVADA DO ESTADO REAL da pessoa naquele ano. Se ela mora em Marília,
 * trabalha como enfermeira e tem dois filhos, a memória fala disso. Se o
 * estado não rende nada verdadeiro, **não emite nada** — e o ano segue
 * silencioso, que continua sendo um resultado permitido.
 *
 * TRÊS GUARDAS DURAS (as três exigidas no projeto, impostas aqui e
 * verificadas em teste):
 *
 *   1. só em ano que ficaria SEM NENHUMA linha;
 *   2. no máximo UMA por ano;
 *   3. `relevancia: 'textura'` — nunca move stat, flag, personalidade ou
 *      qualquer estado. É uma função pura `estado → frase | null`. A
 *      assinatura não devolve estado nenhum porque não há estado a devolver.
 */

import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  LifeLogCategory,
  LifeLogEntry
} from '../../types';
import { generateId } from '../../utils/random';
import { temIrmao, temAmigo, temPet, estaEstudando } from '../contexto/contextoDaVida';

/**
 * Uma memória candidata.
 *
 * `quando` é o predicado que decide se esta memória é VERDADEIRA para o
 * estado atual. `texto` a redige. Manter os dois juntos e declarativos é o
 * que evita a alternativa: uma cascata de `if` dentro do motor.
 */
interface MemoriaCandidata {
  readonly id: string;
  readonly categoria: LifeLogCategory;
  readonly quando: (ctx: ContextoMemoria) => boolean;
  readonly texto: (ctx: ContextoMemoria) => string;
  /**
   * F5 — com que frequência esta memória pode aparecer.
   *
   * `'anual'` (padrão): sempre que for verdadeira e o ano estiver vazio.
   *
   * `'alternada'`: no máximo em anos alternados. Serve às memórias de ÉPOCA —
   * "um ano comum de escola", "um ano com os irmãos" —, que são verdadeiras
   * TODO ano e, por isso, se deixadas soltas, preenchem toda a infância.
   *
   * A primeira versão desta fase não tinha cadência, e a medição mostrou o
   * problema: os anos 6-11 sem nenhuma linha caíram de 27,1% para 0,3%. Zerar
   * silêncio não é o objetivo — uma memória de época marca a EPÓCA, não cada
   * ano dela, e uma infância inteira narrada ano a ano vira o relatório que o
   * projeto recusa.
   *
   * A alternância é pela paridade da IDADE, não por sorteio: o módulo
   * continua sendo uma função pura do estado.
   */
  readonly cadencia?: 'anual' | 'alternada';
}

export interface ContextoMemoria {
  readonly personagem: Character;
  readonly carreira: CareerState;
  readonly educacao: EducationState;
  readonly economia: EconomyState;
  readonly familia: readonly FamilyMember[];
}

/**
 * F5 — adapta o contexto desta camada para as FatiasDoMundo que os selectors
 * da F4 esperam. É de propósito que a memória NÃO reimplemente "tem irmão?":
 * a F4 estabeleceu que essa pergunta tem uma interpretação canônica só, e
 * uma memória que inventasse a sua própria seria exatamente a divergência
 * que aquela fase eliminou.
 */
function fatias(ctx: ContextoMemoria) {
  return {
    personagem: ctx.personagem,
    familia: ctx.familia,
    carreira: ctx.carreira,
    educacao: ctx.educacao,
    economia: ctx.economia
  };
}

/**
 * F5 — escolhe entre redações equivalentes usando a IDADE como índice.
 *
 * O teste qualitativo pegou o que a métrica não pegava: uma criança com
 * irmãos passava os anos 8 e 9 com a MESMA frase, palavra por palavra. Duas
 * linhas idênticas coladas leem como bug, não como biografia.
 *
 * A variação é por idade, e não sorteada, por uma razão de contrato: este
 * módulo é uma função pura `estado -> frase`, e duas vidas no mesmo estado
 * devem produzir o mesmo texto. Introduzir RNG aqui quebraria a
 * reprodutibilidade das simulações e tornaria o módulo dependente de semente.
 */
function variar(idade: number, redacoes: readonly string[]): string {
  return redacoes[idade % redacoes.length];
}

/** Filhos vivos, ordenados do mais velho para o mais novo. */
function filhosVivos(ctx: ContextoMemoria): FamilyMember[] {
  return ctx.familia.filter(f => f.vivo && (f.tipo === 'filho' || f.tipo === 'filha'));
}

function parceiroVivo(ctx: ContextoMemoria): FamilyMember | undefined {
  return ctx.familia.find(
    f => f.vivo && ['esposo', 'esposa', 'noivo', 'noiva', 'namorado', 'namorada'].includes(f.tipo)
  );
}

/**
 * O catálogo de memórias possíveis.
 *
 * Ordenado por especificidade: o que é mais particular àquela vida vem
 * primeiro, e a primeira que for verdadeira é a escolhida. Assim uma pessoa
 * com filhos pequenos recebe a memória dos filhos, não a genérica da cidade
 * — sem nenhuma regra de prioridade extra, só a ordem da lista.
 *
 * Nenhuma frase aqui inventa fato. Cada uma só afirma o que o estado já diz.
 */
const MEMORIAS: readonly MemoriaCandidata[] = [
  // ------------------------------------------------------------------
  // F5 — INFÂNCIA E ADOLESCÊNCIA
  //
  // A auditoria mediu 37,1% dos anos 1-5 sem nenhuma linha, porque as dez
  // candidatas originais descreviam uma vida adulta (trabalho, curso
  // superior, filhos, dívida, aposentadoria) e a própria rede final,
  // `mem_cidade`, exigia idade >= 18. Para uma criança, esta função sempre
  // devolvia null — o salto "7 anos -> 10 anos" do playtest.
  //
  // O que estas candidatas NÃO são: eventos disfarçados. Nenhuma abre modal,
  // pede escolha, move atributo, cria NPC, dinheiro ou estado. São frases
  // derivadas do estado que JÁ existe, no mesmo contrato `textura` das
  // adultas, e só aparecem em ano que ficaria vazio.
  //
  // Cada condição passa pelos selectors da F4. Uma memória de irmão exige
  // irmão; uma de amigo exige amigo. Isso não é zelo redundante: é
  // precisamente o erro que a F4 existe para impedir, aplicado à narrativa.
  // ------------------------------------------------------------------
  {
    // Bebê. Não há nada a relatar além do próprio crescer, e tentar dizer
    // mais do que isso seria inventar.
    id: 'mem_bebe_crescendo',
    categoria: 'geral',
    quando: ctx => ctx.personagem.idade <= 2,
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano de colo, papinha e sono trocado, do jeito que essa idade é.',
        'Um ano de descobrir o mundo no ritmo de quem ainda cabe no colo.'
      ])
  },
  {
    id: 'mem_infancia_irmaos',
    cadencia: 'alternada',
    categoria: 'familia',
    quando: ctx => ctx.personagem.idade <= 11 && temIrmao(fatias(ctx)),
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano de brincadeira e briga com os irmãos dentro de casa.',
        'Um ano dividindo quarto, brinquedo e paciência com os irmãos.',
        'Um ano em que a casa cheia de irmãos não deixou o tédio entrar.'
      ])
  },
  {
    id: 'mem_infancia_pet',
    cadencia: 'alternada',
    categoria: 'familia',
    quando: ctx => ctx.personagem.idade <= 14 && temPet(fatias(ctx)),
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano em que boa parte das tardes foi passada com o bicho de estimação por perto.',
        'Um ano com o animal de estimação grudado em você o dia inteiro.',
        'Um ano de companhia garantida: onde você estava, o bicho estava junto.'
      ])
  },
  {
    id: 'mem_infancia_escola',
    cadencia: 'alternada',
    categoria: 'escola',
    quando: ctx =>
      ctx.personagem.idade >= 6 && ctx.personagem.idade <= 14 && estaEstudando(fatias(ctx)),
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano comum de escola: aula de manhã, tarefa à tarde, rua no fim do dia.',
        'Um ano de caderno, recreio e caminho de volta da escola.',
        'Um ano escolar sem nada de extraordinário, do jeito que a maioria é.'
      ])
  },
  // NÃO EXISTE aqui uma rede final incondicional para a infância, e a
  // ausência é deliberada. A primeira versão desta lista tinha uma —
  // "Um ano de infância em <cidade>, sem grandes acontecimentos" — e ela
  // levava os anos 1-5 sem linha de 37,1% a 0,0%. Zero é a resposta errada:
  // é o retorno do "Um ano sem grandes acontecimentos" que o B4-FIX4 removeu,
  // uma frase que interrompe o jogador para dizer que nada merecia
  // interrompê-lo. Uma infância PODE ter anos silenciosos; o que ela não pode
  // ter é o buraco sistemático de 3+ anos que o playtest encontrou.
  {
    id: 'mem_adolescencia_amigo',
    cadencia: 'alternada',
    categoria: 'geral',
    quando: ctx =>
      ctx.personagem.idade >= 12 && ctx.personagem.idade <= 17 && temAmigo(fatias(ctx)),
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano de conversa longa e tempo perdido com os amigos, do jeito certo.',
        'Um ano em que quase tudo o que importava acontecia junto dos amigos.',
        'Um ano de planos com os amigos combinados na esquina e desfeitos no dia seguinte.'
      ])
  },
  {
    id: 'mem_adolescencia_escola',
    cadencia: 'alternada',
    categoria: 'escola',
    quando: ctx =>
      ctx.personagem.idade >= 15 && ctx.personagem.idade <= 17 && estaEstudando(fatias(ctx)),
    texto: ctx =>
      variar(ctx.personagem.idade, [
        'Um ano de escola, com a pergunta sobre o que fazer depois já rondando.',
        'Um ano de aula e de gente perguntando o que você vai ser.',
        'Um ano de ensino médio, com o futuro ainda sem formato definido.'
      ])
  },
  // ------------------------------------------------------------------
  // VIDA ADULTA (originais da F3, inalteradas)
  // ------------------------------------------------------------------
  {
    // Criar filho pequeno é a coisa que mais ocupa uma vida sem "acontecer".
    id: 'mem_filhos_pequenos',
    categoria: 'familia',
    quando: ctx => filhosVivos(ctx).some(f => f.idade <= 6),
    texto: ctx => {
      const pequenos = filhosVivos(ctx).filter(f => f.idade <= 6);
      if (pequenos.length === 1) {
        return `Um ano girando em torno de ${pequenos[0].nome}, que ainda acorda de madrugada.`;
      }
      return 'Um ano inteiro girando em torno das crianças pequenas em casa.';
    }
  },
  {
    id: 'mem_filhos_escola',
    categoria: 'familia',
    quando: ctx => filhosVivos(ctx).some(f => f.idade >= 7 && f.idade <= 17),
    texto: ctx => {
      const emIdadeEscolar = filhosVivos(ctx).filter(f => f.idade >= 7 && f.idade <= 17);
      return emIdadeEscolar.length === 1
        ? `O ano passou entre a rotina da escola de ${emIdadeEscolar[0].nome} e o trabalho.`
        : 'O ano passou entre a escola das crianças e o trabalho.';
    }
  },
  {
    // Dívida alta é uma presença constante mesmo quando nada "acontece".
    id: 'mem_divida',
    categoria: 'financas',
    quando: ctx => ctx.economia.dividas > 0 && ctx.economia.dividas > ctx.economia.dinheiro,
    texto: () => 'Um ano de contas apertadas, fechando o mês com cuidado.'
  },
  {
    id: 'mem_estudo',
    categoria: 'escola',
    quando: ctx => ctx.educacao.emCurso && ctx.personagem.idade >= 18,
    texto: ctx =>
      ctx.educacao.nomeCurso
        ? `Um ano dividido entre ${ctx.educacao.nomeCurso} e o resto da vida.`
        : 'Um ano dividido entre os estudos e o resto da vida.'
  },
  {
    id: 'mem_trabalho_longo',
    categoria: 'carreira',
    quando: ctx => ctx.carreira.empregado && ctx.carreira.anosNoCargo >= 5,
    texto: ctx =>
      `Mais um ano ${ctx.carreira.cargoAtual ? `como ${ctx.carreira.cargoAtual.titulo.toLowerCase()}` : 'no mesmo trabalho'}, na mesma rotina de sempre.`
  },
  {
    id: 'mem_trabalho',
    categoria: 'carreira',
    quando: ctx => ctx.carreira.empregado,
    texto: ctx =>
      ctx.carreira.cargoAtual
        ? `Um ano comum de trabalho como ${ctx.carreira.cargoAtual.titulo.toLowerCase()}.`
        : 'Um ano comum de trabalho.'
  },
  {
    id: 'mem_aposentado_parceiro',
    categoria: 'familia',
    quando: ctx => ctx.carreira.aposentado && parceiroVivo(ctx) !== undefined,
    texto: ctx => `Os dias sem pressa, quase sempre ao lado de ${parceiroVivo(ctx)!.nome}.`
  },
  {
    id: 'mem_aposentado',
    categoria: 'geral',
    quando: ctx => ctx.carreira.aposentado,
    texto: ctx => `Os dias em ${ctx.personagem.cidade} foram passando sem pressa.`
  },
  {
    id: 'mem_desempregado',
    categoria: 'carreira',
    quando: ctx => !ctx.carreira.empregado && !ctx.carreira.aposentado && ctx.personagem.idade >= 25,
    texto: () => 'Um ano procurando o que fazer, sem muita notícia boa.'
  },
  {
    // A última rede: onde a pessoa mora é sempre verdade.
    id: 'mem_cidade',
    categoria: 'geral',
    quando: ctx => ctx.personagem.cidade.length > 0 && ctx.personagem.idade >= 18,
    texto: ctx => `Um ano sem grandes novidades em ${ctx.personagem.cidade}.`
  }
];

/**
 * A pequena memória deste ano, se houver uma verdadeira.
 *
 * Devolve `null` — e o ano fica em silêncio — quando:
 *   - o ano já tem alguma linha (a memória só preenche vazio);
 *   - nenhuma candidata é verdadeira para este estado.
 *
 * Note o que NÃO entra: aleatoriedade. Duas vidas no mesmo estado produzem a
 * mesma memória, e isso é desejável — a frase descreve a vida, não o dado.
 */
export function gerarPequenaMemoria(
  ctx: ContextoMemoria,
  logsDoAno: readonly LifeLogEntry[],
  idade: number,
  ano: number
): LifeLogEntry | null {
  // GUARDA 1 — só em ano que ficaria sem nenhuma linha.
  if (logsDoAno.length > 0) return null;

  const escolhida = MEMORIAS.find(m => {
    if (!m.quando(ctx)) return false;
    // Memória de época só em ano alternado — ver `cadencia`. O silêncio nos
    // anos ímpares é deliberado: é o que impede a infância de virar um
    // registro contínuo de "mais um ano igual ao anterior".
    if (m.cadencia === 'alternada' && idade % 2 !== 0) return false;
    return true;
  });
  if (!escolhida) return null;

  return {
    id: generateId('log'),
    idade,
    ano,
    categoria: escolhida.categoria,
    texto: escolhida.texto(ctx),
    tipo: 'info',
    // GUARDA 3 — textura: discreta na Linha da Vida, fora do resumo anual,
    // e (desde o passo 3) incapaz de saturar o ano.
    relevancia: 'textura'
  };
}

/** Exposto para teste: quantas memórias o catálogo oferece. */
export const TOTAL_MEMORIAS_CANDIDATAS = MEMORIAS.length;
