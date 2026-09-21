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
}

export interface ContextoMemoria {
  readonly personagem: Character;
  readonly carreira: CareerState;
  readonly educacao: EducationState;
  readonly economia: EconomyState;
  readonly familia: readonly FamilyMember[];
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

  const escolhida = MEMORIAS.find(m => m.quando(ctx));
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
