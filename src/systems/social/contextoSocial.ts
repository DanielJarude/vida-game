/**
 * F6 — CONTEXTO SOCIAL.
 *
 * Responde a uma pergunta só: ONDE esta pessoa convive neste ano, e que tipo
 * de gente ela poderia conhecer por causa disso.
 *
 * Princípio da fase: você não procura NPCs — você conhece pessoas porque vive.
 * Toda relação nova precisa de uma ORIGEM derivada de algo que realmente
 * existe no estado (escola em curso, emprego, atividade praticada, cidade).
 *
 * ARQUITETURA — este arquivo é FOLHA, igual a `contexto/contextoDaVida.ts`:
 * funções puras, sem estado, sem RNG, sem I/O. Ele não cria ninguém e não
 * decide nada; apenas descreve o mundo social disponível. Quem cria pessoas é
 * `redeSocial.ts`, e quem decide quando é o motor. Isso é deliberado: um
 * "God System" social é justamente o que o escopo proíbe.
 */

import type {
  CareerState,
  Character,
  EducationState,
  FamilyMember,
  PersonalityState
} from '../../types';
import { TIPOS_VINCULO_SOCIAL } from '../contexto/contextoDaVida';

/* ========================================================================== */
/*                          AMBIENTES DE CONVÍVIO                             */
/* ========================================================================== */

/**
 * De onde uma relação pode nascer. É a lista de origens possíveis do escopo,
 * e cada uma corresponde a um fato verificável do estado — nenhuma é
 * decorativa.
 */
export type AmbienteSocial =
  | 'escola'
  | 'faculdade'
  | 'trabalho'
  | 'atividade'
  | 'vizinhanca'
  | 'familia_estendida'
  | 'amigo_de_amigo';

/** Rótulo curto, para a narrativa e para a ficha da pessoa. */
export const ROTULO_AMBIENTE: Record<AmbienteSocial, string> = {
  escola: 'escola',
  faculdade: 'faculdade',
  trabalho: 'trabalho',
  atividade: 'atividade',
  vizinhanca: 'vizinhança',
  familia_estendida: 'família',
  amigo_de_amigo: 'amizade em comum'
};

/**
 * As fatias do estado que o contexto social precisa ler. Um objeto pequeno e
 * explícito em vez do `GameState` inteiro: mantém o acoplamento baixo e
 * permite testar sem montar um jogo completo.
 */
export interface FatiasSociais {
  readonly personagem: Character;
  readonly educacao: EducationState;
  readonly carreira: CareerState;
  readonly familia: readonly FamilyMember[];
  readonly personalidade?: PersonalityState;
  /** Atividades praticadas no ano (ids de `activitiesData`). */
  readonly atividadesDoAno?: readonly string[];
}

/* ========================================================================== */
/*                     QUAIS AMBIENTES ESTÃO ABERTOS                          */
/* ========================================================================== */

/**
 * Atividades que naturalmente colocam a pessoa perto de outras. Uma corrida
 * solitária ou uma leitura não geram convívio; um churrasco ou uma balada,
 * sim. Declarativo de propósito: acrescentar uma atividade social é adicionar
 * um id aqui, não espalhar um `if` novo.
 */
export const ATIVIDADES_SOCIAIS: readonly string[] = [
  'act_churrasco',
  'act_voluntariado',
  'act_balada_barzinho',
  'act_academia',
  'act_ferias_praia',
  'act_viagem_exterior'
];

/** Idade a partir da qual a vizinhança vira fonte plausível de convívio. */
const IDADE_MINIMA_VIZINHANCA = 12;

/**
 * Os ambientes em que a pessoa convive AGORA.
 *
 * Note que nada aqui é sorteado: se a lista vier vazia, esta pessoa
 * genuinamente não tem por onde conhecer ninguém neste ano, e o resultado
 * correto é não conhecer ninguém.
 */
export function ambientesDeConvivio(f: FatiasSociais): AmbienteSocial[] {
  const ambientes: AmbienteSocial[] = [];
  const idade = f.personagem.idade;

  if (f.educacao.emCurso) {
    // 'escola' é o ambiente de quem está na educação básica NA IDADE dela.
    // Um adulto matriculado (técnico, EJA, MBA) convive num ambiente de
    // adultos — chamar isso de "escola" fazia a rede social gerar colegas
    // de turma com a idade do personagem de 70 anos e rotular a origem
    // como escolar. A leitura de timelines pegou "de escola aos 70".
    const superior = f.educacao.tipoCurso === 'superior' || f.educacao.tipoCurso === 'pos';
    const basicaNaIdade = !superior && idade <= 19;
    ambientes.push(superior || !basicaNaIdade ? 'faculdade' : 'escola');
  }

  if (f.carreira.empregado && !f.carreira.aposentado) ambientes.push('trabalho');

  const atividades = f.atividadesDoAno ?? [];
  if (atividades.some(a => ATIVIDADES_SOCIAIS.includes(a))) ambientes.push('atividade');

  if (idade >= IDADE_MINIMA_VIZINHANCA) ambientes.push('vizinhanca');

  // Amigo de amigo só existe se já houver amigo — é a rede se expandindo por
  // si, não geração espontânea.
  if (f.familia.some(m => m.vivo && (m.tipo === 'amigo' || m.tipo === 'amiga'))) {
    ambientes.push('amigo_de_amigo');
  }

  return ambientes;
}

/* ========================================================================== */
/*                  QUE TIPO DE PESSOA CADA AMBIENTE PRODUZ                   */
/* ========================================================================== */

/**
 * Perfil etário/ocupacional de quem se conhece num ambiente. É o que impede o
 * defeito do escopo §12: "colega de escola de uma criança de 8 anos =
 * Roberto, 42 anos, advogado".
 */
export interface PerfilDeConhecido {
  /** Faixa de idade plausível para essa pessoa, relativa ao personagem. */
  readonly idadeMin: number;
  readonly idadeMax: number;
  /** Se a pessoa é estudante (então não tem profissão adulta). */
  readonly estudante: boolean;
}

/**
 * Deriva o perfil de quem se conhece num ambiente, a partir da idade de quem
 * está vivendo. Regra reutilizável e centralizada: ninguém recria isso.
 */
export function perfilDoAmbiente(
  ambiente: AmbienteSocial,
  idadePersonagem: number
): PerfilDeConhecido {
  switch (ambiente) {
    // Colega de turma tem a idade da turma, com a folga natural de repetência
    // ou adiantamento. Sempre estudante.
    case 'escola':
      return {
        idadeMin: Math.max(3, idadePersonagem - 1),
        idadeMax: idadePersonagem + 1,
        estudante: true
      };
    case 'faculdade':
      return {
        idadeMin: Math.max(17, idadePersonagem - 3),
        idadeMax: idadePersonagem + 5,
        estudante: true
      };
    // No trabalho convive-se com gente de idades variadas, mas adulta.
    case 'trabalho':
      return {
        idadeMin: Math.max(18, idadePersonagem - 12),
        idadeMax: idadePersonagem + 15,
        estudante: false
      };
    case 'atividade':
      return {
        idadeMin: Math.max(idadePersonagem < 18 ? 6 : 18, idadePersonagem - 6),
        idadeMax: idadePersonagem + 6,
        estudante: idadePersonagem < 18
      };
    case 'vizinhanca':
      return {
        idadeMin: Math.max(idadePersonagem < 18 ? 8 : 18, idadePersonagem - 8),
        idadeMax: idadePersonagem + 10,
        estudante: idadePersonagem < 18
      };
    case 'familia_estendida':
      return {
        idadeMin: Math.max(1, idadePersonagem - 10),
        idadeMax: idadePersonagem + 10,
        estudante: idadePersonagem < 18
      };
    case 'amigo_de_amigo':
      return {
        idadeMin: Math.max(idadePersonagem < 18 ? 5 : 18, idadePersonagem - 4),
        idadeMax: idadePersonagem + 4,
        estudante: idadePersonagem < 18
      };
  }
}

/* ========================================================================== */
/*                        ABERTURA SOCIAL (§11)                               */
/* ========================================================================== */

/**
 * Quanto a personalidade INCLINA a pessoa a se aproximar de alguém — nunca
 * quanto ela a impede.
 *
 * O escopo é explícito: personalidade influencia probabilidade ou maneira,
 * não é bloqueio rígido. Pessoa introvertida PODE ter amigos; pessoa sociável
 * NÃO ganha amigos automaticamente. Por isso o retorno é um multiplicador
 * limitado a uma faixa estreita em torno de 1, e nunca chega a 0 nem explode.
 */
export const ABERTURA_MINIMA = 0.6;
export const ABERTURA_MAXIMA = 1.4;

export function aberturaSocial(f: FatiasSociais): number {
  const socia = f.personalidade?.tracos?.sociabilidade ?? 0;
  // `sociabilidade` é um traço acumulado por escolhas; normalizo por uma
  // escala generosa para que nenhum extremo vire determinismo.
  const normalizado = Math.max(-5, Math.min(5, socia)) / 5; // -1 .. 1
  const fator = 1 + normalizado * 0.4;
  return Math.max(ABERTURA_MINIMA, Math.min(ABERTURA_MAXIMA, fator)) * temperamentoSocial(f);
}

/**
 * TEMPERAMENTO SOCIAL — a variedade que a personalidade sozinha não dá.
 *
 * Todo mundo passa por escola, trabalho e vizinhança ao longo de 70 anos, e
 * com ambientes iguais para todos o resultado foi uniforme: medido, 0 vidas
 * com dois amigos ou menos e 62 com sete ou mais. O escopo §23 pede o
 * oposto — "alguns muitos contatos, alguns poucos, alguns realmente
 * isolados" — e proíbe a meta de "100% das vidas têm amigo".
 *
 * Isto NÃO é personalidade (que o jogador constrói escolhendo) nem um
 * bloqueio: é a disposição de base para se aproximar de gente, estável na
 * vida inteira e derivada de quem a pessoa é. Uma pessoa mais reservada
 * ainda faz amigos — só faz menos, e mais devagar.
 */
export function temperamentoSocial(f: FatiasSociais): number {
  const semente = `${f.personagem.nome}${f.personagem.sobrenome}${f.personagem.cidade}`;
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  const r = (h % 1000) / 1000; // 0 .. 1, estável para a mesma pessoa

  // ~20% reservadas, ~20% muito sociáveis, o resto no meio.
  if (r < 0.20) return 0.35;
  if (r < 0.80) return 1;
  return 1.5;
}

/* ========================================================================== */
/*                              CONSULTAS                                     */
/* ========================================================================== */

// F6-FIX — a taxonomia do vínculo social é UMA só, e mora em
// `contexto/contextoDaVida`. Aqui apenas se reexporta para quem já
// importava deste módulo: manter duas listas foi exatamente o que deixou
// 'colega' fora da aba Relacionamentos.
export { TIPOS_VINCULO_SOCIAL } from '../contexto/contextoDaVida';

/** Pessoas não familiares que ainda estão na vida. */
export function vinculosSociaisAtivos(f: FatiasSociais): FamilyMember[] {
  return f.familia.filter(
    m => m.vivo && m.ativo !== false && TIPOS_VINCULO_SOCIAL.includes(m.tipo)
  );
}

/** Existe alguém conhecido vindo deste ambiente? Evita duplicar a mesma origem. */
export function jaConheceAlguemDe(f: FatiasSociais, ambiente: AmbienteSocial): boolean {
  return vinculosSociaisAtivos(f).some(m => m.origemSocial === ambiente);
}
