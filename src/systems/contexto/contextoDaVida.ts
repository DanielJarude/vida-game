/**
 * contexto/contextoDaVida — o que a vida do personagem CONTÉM agora (F4).
 *
 * O PROBLEMA QUE ESTE MÓDULO RESOLVE, medido na auditoria pós-playtest: um
 * acontecimento narrava o personagem levando o pet ao veterinário quando não
 * havia pet nenhum na vida dele. Em 105 vidas, 128 ocorrências (41,6% das que
 * pressupunham algo) aconteciam sobre um mundo que não existia.
 *
 * A causa não era o evento estar errado — ele está correto. Era o vocabulário
 * de elegibilidade não ter a palavra "pet". `FamilyMember` já suporta
 * `tipo: 'pet'`, a interface já o exibia, o motor já sabia criá-lo, e nenhuma
 * regra jamais perguntava se ele existia. Dado escrito, dado exibido, dado
 * nunca consultado.
 *
 * DUAS DECISÕES DE ARQUITETURA, e as duas são deliberadas:
 *
 * 1. TUDO É DERIVADO. Não existe `state.temPet`. Existe uma função que
 *    procura um `FamilyMember` vivo do tipo pet. Persistir a resposta criaria
 *    uma segunda fonte de verdade que envelheceria mal — o dia em que o pet
 *    morresse e alguém esquecesse de atualizar a flag, o jogo voltaria a
 *    mentir. Por consequência, **a F4 não muda o save**: nada novo é gravado.
 *
 * 2. CONTEXTO NÃO É PERMISSÃO. Este módulo responde "o estado necessário
 *    existe?" e nada além disso. Possuir um carro é contexto; ter idade para
 *    dirigir é regra etária; ter CNH seria uma regra futura. A Fase 1 separou
 *    possível / legal / provável / permitido, e misturar as camadas aqui
 *    desfaria aquele trabalho. Nenhuma função deste arquivo decide se o
 *    jogador PODE algo — só o que ele TEM.
 *
 * Puro: sem React, sem estado, sem import de outro sistema (evita ciclo).
 */

import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  RelationType
} from '../../types';

/**
 * As fatias do estado necessárias para responder sobre o mundo.
 *
 * Recebe as partes, e não o `GameState` inteiro, por dois motivos: o motor
 * trabalha com essas fatias soltas durante a passagem de ano (o estado
 * completo só existe no hook), e um parâmetro estreito deixa explícito que
 * este módulo não lê timeline, personalidade nem histórico de eventos.
 */
export interface FatiasDoMundo {
  readonly personagem: Character;
  readonly familia: readonly FamilyMember[];
  readonly carreira: CareerState;
  readonly educacao: EducationState;
  readonly economia: EconomyState;
}

/* ========================================================================== */
/*                          VÍNCULOS: quem existe                             */
/* ========================================================================== */

/**
 * Tipos que contam como parceria afetiva.
 *
 * Esta lista existia duplicada em pelo menos quatro arquivos
 * (`eligibility`, `availabilitySystem`, `relationshipSystem`,
 * `pequenaMemoria`). Aqui ela passa a ter um dono; os consumidores podem
 * importá-la em vez de reescrevê-la, que é como as quatro cópias começariam
 * a divergir.
 */
export const TIPOS_PARCEIRO: readonly RelationType[] = [
  'namorado',
  'namorada',
  'noivo',
  'noiva',
  'esposo',
  'esposa'
];

/** Parceria formalizada. Subconjunto de `TIPOS_PARCEIRO`. */
export const TIPOS_CONJUGE: readonly RelationType[] = ['esposo', 'esposa'];

export const TIPOS_FILHO: readonly RelationType[] = ['filho', 'filha'];
export const TIPOS_IRMAO: readonly RelationType[] = ['irmao', 'irma'];
/** F5-FIX — quem cria a criança. Usado pelas memórias de primeira infância. */
export const TIPOS_RESPONSAVEL: readonly RelationType[] = ['pai', 'mae'];
export const TIPOS_AMIZADE: readonly RelationType[] = ['amigo', 'amiga'];

/** Membros vivos de um dos tipos pedidos. Base de quase tudo aqui. */
function vivosDoTipo(
  familia: readonly FamilyMember[],
  tipos: readonly RelationType[]
): FamilyMember[] {
  return familia.filter(m => m.vivo && tipos.includes(m.tipo));
}

/**
 * O personagem tem um animal de estimação?
 *
 * O caso canônico da F4. "Vivo" é parte da pergunta: um pet que morreu não
 * pode adoecer no ano seguinte.
 */
export function temPet(f: FatiasDoMundo): boolean {
  return f.familia.some(m => m.vivo && m.tipo === 'pet');
}

/** Namoro, noivado ou casamento — qualquer parceria afetiva viva. */
export function temParceiro(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_PARCEIRO).length > 0;
}

/** Só casamento. Mais estrito que `temParceiro`. */
export function temConjuge(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_CONJUGE).length > 0;
}

export function temFilho(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_FILHO).length > 0;
}

export function quantidadeFilhos(f: FatiasDoMundo): number {
  return vivosDoTipo(f.familia, TIPOS_FILHO).length;
}

export function temIrmao(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_IRMAO).length > 0;
}

/**
 * F5-FIX — há pai ou mãe vivo?
 *
 * Criado porque a auditoria de lacunas mostrou que a criança de 3 a 5 anos é
 * a faixa mais pobre em contexto do jogo: não estuda, raramente tem pet, e
 * pode ainda não ter irmãos (eles nascem ao longo da vida). Restava uma coisa
 * verdadeira e não consultada — ela mora com alguém que cuida dela.
 *
 * Note que isto NÃO é um predicado especulativo: existe uma memória concreta
 * que o consome. A regra da F4 continua valendo — nada de predicado sem uso.
 */
export function temResponsavel(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_RESPONSAVEL).length > 0;
}

/**
 * Existe alguém que o personagem chamaria de amigo?
 *
 * Hoje a resposta é quase sempre `false` (63 de 105 vidas terminam sem
 * nenhum amigo — Achado 6). Isto é diagnóstico, não defeito deste módulo: a
 * F4 faz o mundo saber quem existe; criar amizades por convivência é F6.
 * O predicado precisa existir agora para que os eventos que pressupõem um
 * amigo parem de inventá-lo.
 */
export function temAmigo(f: FatiasDoMundo): boolean {
  return vivosDoTipo(f.familia, TIPOS_AMIZADE).length > 0;
}

/* ========================================================================== */
/*                       PATRIMÔNIO: o que se possui                          */
/* ========================================================================== */

export function temImovel(f: FatiasDoMundo): boolean {
  return f.economia.propriedades.some(p => p.tipo === 'imovel');
}

export function temVeiculo(f: FatiasDoMundo): boolean {
  return f.economia.propriedades.some(p => p.tipo === 'veiculo');
}

/**
 * Há dívida em aberto?
 *
 * Deliberadamente "maior que zero", sem limiar de gravidade: quanto a dívida
 * pesa é assunto da economia (F7), não da existência do fato.
 */
export function temDivida(f: FatiasDoMundo): boolean {
  return f.economia.dividas > 0;
}

/* ========================================================================== */
/*                        OCUPAÇÃO: o que se faz                              */
/* ========================================================================== */

export function estaEmpregado(f: FatiasDoMundo): boolean {
  return f.carreira.empregado;
}

/** Matriculado em qualquer etapa — da creche à pós. */
export function estaEstudando(f: FatiasDoMundo): boolean {
  return f.educacao.emCurso;
}

/** Matriculado especificamente no ensino superior ou pós. */
export function estaNaFaculdade(f: FatiasDoMundo): boolean {
  return (
    f.educacao.emCurso &&
    (f.educacao.tipoCurso === 'superior' || f.educacao.tipoCurso === 'pos')
  );
}

/* ========================================================================== */
/*                           LUGAR: onde se vive                              */
/* ========================================================================== */

/**
 * Cidade e UF atuais.
 *
 * Exposto como contexto canônico porque vários eventos e, no futuro, a oferta
 * educacional precisarão dele. A F4 **apenas expõe** — porte de cidade,
 * oferta regional e mudança de cidade são F8.
 */
export function cidadeAtual(f: FatiasDoMundo): string {
  return f.personagem.cidade;
}

export function estadoAtual(f: FatiasDoMundo): string {
  return f.personagem.estado;
}

/* ========================================================================== */
/*                         O RETRATO COMPLETO                                 */
/* ========================================================================== */

/**
 * Todas as respostas de uma vez.
 *
 * Existe para quem precisa de várias ao mesmo tempo — a avaliação de
 * condições de um evento, por exemplo — sem recalcular filtros de família
 * uma vez por pergunta. Não é um God Object: é uma fotografia imutável,
 * derivada, sem métodos e sem dono do estado. Cada campo continua disponível
 * como função pura independente, que é a forma preferida em regra nova.
 */
export interface ContextoDaVida {
  readonly temPet: boolean;
  readonly temParceiro: boolean;
  readonly temConjuge: boolean;
  readonly temFilho: boolean;
  readonly quantidadeFilhos: number;
  readonly temIrmao: boolean;
  readonly temAmigo: boolean;
  readonly temImovel: boolean;
  readonly temVeiculo: boolean;
  readonly temDivida: boolean;
  readonly estaEmpregado: boolean;
  readonly estaEstudando: boolean;
  readonly estaNaFaculdade: boolean;
  readonly cidade: string;
  readonly estado: string;
}

export function contextoDaVida(f: FatiasDoMundo): ContextoDaVida {
  return {
    temPet: temPet(f),
    temParceiro: temParceiro(f),
    temConjuge: temConjuge(f),
    temFilho: temFilho(f),
    quantidadeFilhos: quantidadeFilhos(f),
    temIrmao: temIrmao(f),
    temAmigo: temAmigo(f),
    temImovel: temImovel(f),
    temVeiculo: temVeiculo(f),
    temDivida: temDivida(f),
    estaEmpregado: estaEmpregado(f),
    estaEstudando: estaEstudando(f),
    estaNaFaculdade: estaNaFaculdade(f),
    cidade: cidadeAtual(f),
    estado: estadoAtual(f)
  };
}
