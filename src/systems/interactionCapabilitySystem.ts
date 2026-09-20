/**
 * Capacidade de interação por idade.
 *
 * Um recém-nascido não conversa, não discute e não compra presentes. Antes
 * do B4-FIX isso não estava em lugar nenhum: a interface simplesmente
 * listava todas as interações adultas para um bebê de 0 ano.
 *
 * Este módulo é a **fonte única** dessa regra. Ele é consultado pela
 * política de disponibilidade (`availabilitySystem`) e revalidado pelo
 * motor (`familySystem`), de modo que esconder um botão e chamar a ação
 * direto dão o mesmo resultado: recusa.
 *
 * As faixas são direção de design, não afirmação médica. Crianças reais
 * não seguem um cronograma único; o jogo usa marcos simplificados para
 * decidir o que faz sentido oferecer.
 */

import { Capacidade, FamilyInteractionType } from '../types';

/**
 * Marco simplificado das primeiras falas.
 *
 * Antes disso o vínculo acontece por presença, colo e reação — não por
 * conversa. Não é uma regra clínica: é o ponto em que o jogo passa a
 * oferecer interação verbal básica.
 */
export const IDADE_PRIMEIRAS_FALAS = 2;

/** Antes disso não há conflito argumentativo, só reação. */
export const IDADE_MINIMA_CONFLITO = 3;

/**
 * Presentear exige autonomia para escolher e dinheiro próprio para pagar.
 * Uma criança pequena não faz nem uma coisa nem outra.
 *
 * Presente feito à mão pela criança seria outro tipo de interação e não
 * faz parte deste FIX.
 */
export const IDADE_MINIMA_DAR_PRESENTE = 12;

/** Fases de capacidade. Usadas para escolher regra e texto. */
export type FaseInteracao =
  | 'recem_nascido'
  | 'primeiros_passos'
  | 'primeiras_palavras'
  | 'infancia'
  | 'escolar'
  | 'autonomo';

export function obterFaseInteracao(idade: number): FaseInteracao {
  if (idade < 1) return 'recem_nascido';
  if (idade < IDADE_PRIMEIRAS_FALAS) return 'primeiros_passos';
  if (idade < IDADE_MINIMA_CONFLITO) return 'primeiras_palavras';
  if (idade < 6) return 'infancia';
  if (idade < IDADE_MINIMA_DAR_PRESENTE) return 'escolar';
  return 'autonomo';
}

// `Capacidade` mora em `types` desde o B4-FIX.1: humanos e pets usam a
// mesma forma de resultado. Reexportado para não quebrar importações.
export type { Capacidade };

const PERMITIDO: Capacidade = { permitido: true };

/**
 * A interação é compatível com a idade?
 *
 * O motivo é sempre contextual e em linguagem humana — ele é exibido tal
 * como está, tanto na interface quanto na recusa do motor.
 */
export function avaliarCapacidadeInteracao(
  interacao: FamilyInteractionType,
  idade: number
): Capacidade {
  switch (interacao) {
    // Presença e afeto existem desde o primeiro dia. É o vínculo possível
    // para quem ainda não fala: colo, brincadeira, companhia.
    case 'passar_tempo':
      return PERMITIDO;

    case 'conversar':
      if (idade < 1) {
        return {
          permitido: false,
          motivo: 'Você é um bebê de colo: ainda não fala, só observa e reage.'
        };
      }
      if (idade < IDADE_PRIMEIRAS_FALAS) {
        return {
          permitido: false,
          motivo: 'Você ainda se comunica por gestos e sons, não por conversa.'
        };
      }
      return PERMITIDO;

    case 'discutir':
      if (idade < 1) {
        return {
          permitido: false,
          motivo: 'Um recém-nascido não discute: chora, dorme e é acolhido.'
        };
      }
      if (idade < IDADE_MINIMA_CONFLITO) {
        return {
          permitido: false,
          motivo: 'Você ainda não tem palavras para brigar por um motivo.'
        };
      }
      return PERMITIDO;

    case 'dar_presente':
      if (idade < IDADE_MINIMA_DAR_PRESENTE) {
        return {
          permitido: false,
          motivo:
            'Você ainda não escolhe nem paga um presente por conta própria.'
        };
      }
      return PERMITIDO;

    // pedir_dinheiro e pedir_conselho já têm idade mínima própria na
    // política central (6 anos); aqui não há restrição adicional.
    case 'pedir_dinheiro':
    case 'pedir_conselho':
      return PERMITIDO;

    default:
      return PERMITIDO;
  }
}

/**
 * A interação deve sequer ser oferecida nesta fase?
 *
 * Diferença importante: algo **bloqueado** aparece explicando o motivo;
 * algo **não oferecido** nem entra na lista. Oferecer "Dar um presente"
 * riscado para um bebê seria ruído — a ação não pertence àquela vida
 * ainda. Já "Discutir" para uma criança de 2 anos vale mostrar, porque
 * explica como ela está crescendo.
 */
export function deveOferecerInteracao(
  interacao: FamilyInteractionType,
  idade: number
): boolean {
  if (interacao === 'dar_presente') {
    // Só passa a existir quando está perto de ser possível.
    return idade >= IDADE_MINIMA_DAR_PRESENTE - 2;
  }
  return true;
}

/**
 * Narrativa da interação, adequada à fase.
 *
 * O jogo precisa produzir ação → reação → consequência também para um
 * bebê. "Você teve uma ótima conversa" é absurdo aos 0 anos; a reação
 * certa é o gesto de quem cuida.
 *
 * Recebe o nome e o tratamento já resolvidos pelo chamador para não
 * duplicar regra de parentesco aqui.
 */
export function narrarInteracaoPorFase(
  interacao: FamilyInteractionType,
  nome: string,
  idade: number
): string {
  const fase = obterFaseInteracao(idade);

  if (interacao === 'passar_tempo') {
    switch (fase) {
      case 'recem_nascido':
        return `${nome} te pegou no colo. Você parou de chorar e ficou ouvindo a voz dele(a) bem de perto.`;
      case 'primeiros_passos':
        return `Você engatinhou atrás de ${nome} pela casa inteira e riu cada vez que foi pego(a).`;
      case 'primeiras_palavras':
        return `Você e ${nome} repetiram a mesma brincadeira umas quinze vezes. Você achou pouco.`;
      case 'infancia':
        return `Você inventou uma história inteira e obrigou ${nome} a fazer a voz de um dos personagens.`;
      default:
        return `Você passou a tarde inteira com ${nome}. O momento juntos foi muito bom.`;
    }
  }

  if (interacao === 'conversar') {
    switch (fase) {
      case 'primeiras_palavras':
        return `Você juntou as palavras que sabia e contou alguma coisa para ${nome}. Nem tudo fez sentido, mas ele(a) ouviu até o fim.`;
      case 'infancia':
        return `Você contou para ${nome} tudo o que aconteceu no seu dia, sem pular nenhum detalhe.`;
      case 'escolar':
        return `Você contou para ${nome} como foi o dia na escola. Ele(a) quis saber dos detalhes.`;
      default:
        return `Você teve uma ótima conversa com ${nome}. Vocês riram e compartilharam novidades.`;
    }
  }

  if (interacao === 'discutir') {
    switch (fase) {
      case 'infancia':
        return `Você fez birra com ${nome} por causa de algo que parecia muito importante. Passou depois, mas demorou.`;
      case 'escolar':
        return `Você bateu de frente com ${nome} sobre uma regra que achou injusta. Ninguém cedeu.`;
      default:
        return `Você e ${nome} tiveram uma discussão áspera sobre assuntos do dia a dia. O clima ficou pesado.`;
    }
  }

  return '';
}
