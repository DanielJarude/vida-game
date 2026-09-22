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

import { FamilyInteractionType } from '../types';

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

/**
 * Interações exclusivas de um pet (B4-FIX1).
 *
 * Um animal não conversa, não discute e não recebe presente comprado; o
 * vínculo com ele é físico — carinho, alimentação, passeio. `passar_tempo`
 * é compartilhada com o vínculo humano (é o mesmo gesto de companhia), mas
 * ganha narrativa própria quando o alvo é um pet.
 */
export const PET_INTERACOES: readonly FamilyInteractionType[] = [
  'passar_tempo',
  'fazer_carinho',
  'alimentar',
  'passear'
];

/**
 * F6-FIX §9 — O QUE SE FAZ COM UM COLEGA/AMIGO.
 *
 * Um vínculo social não familiar não é um pai nem um pet. Pedir dinheiro e
 * pedir conselho pressupõem quem cria você; "discutir" na fase infantil é
 * narrado como birra, que é gesto de filho, não de colega de sala.
 *
 * Sobram os gestos que de fato existem entre amigos: estar junto, conversar
 * e — quando já se tem idade para isso — dar um presente.
 */
export const SOCIAL_INTERACOES: readonly FamilyInteractionType[] = [
  'passar_tempo',
  'conversar',
  'dar_presente'
];

/** Idade mínima para fazer carinho no pet por conta própria. */
export const IDADE_MINIMA_CARINHO_PET = 1;

/** Idade mínima para assumir a tarefa de alimentar o pet sozinho. */
export const IDADE_MINIMA_ALIMENTAR_PET = 3;

/** Idade mínima para levar o pet para passear sem supervisão direta. */
export const IDADE_MINIMA_PASSEAR_PET = 6;

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

/** Resultado da checagem de capacidade. */
export type Capacidade =
  | { permitido: true }
  | { permitido: false; motivo: string };

const PERMITIDO: Capacidade = { permitido: true };

/**
 * A interação é compatível com a idade?
 *
 * O motivo é sempre contextual e em linguagem humana — ele é exibido tal
 * como está, tanto na interface quanto na recusa do motor.
 *
 * `ehPet` desvia para a trilha própria do animal (B4-FIX1): um pet não
 * conversa, não discute e não recebe presente comprado — o vínculo com
 * ele é físico (carinho, alimentação, passeio). Sem esse parâmetro, a
 * função mantém exatamente o comportamento anterior (pessoa humana).
 */
export function avaliarCapacidadeInteracao(
  interacao: FamilyInteractionType,
  idade: number,
  ehPet: boolean = false
): Capacidade {
  if (ehPet) {
    return avaliarCapacidadeInteracaoPet(interacao, idade);
  }

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
 * Capacidade de interação com um PET, por idade do jogador.
 *
 * Um bebê de colo já pode estar perto do animal (é o adulto quem
 * aproxima), mas as ações ativas de cuidado — fazer carinho sozinho,
 * alimentar, passear — pressupõem coordenação motora e autonomia
 * crescentes. Conversar, discutir e presente comprado nunca fazem
 * sentido com um pet, em nenhuma idade: `deveOferecerInteracaoPet`
 * garante que elas nem cheguem a ser avaliadas aqui.
 */
function avaliarCapacidadeInteracaoPet(
  interacao: FamilyInteractionType,
  idade: number
): Capacidade {
  switch (interacao) {
    case 'passar_tempo':
      // Ficar perto do animal é possível desde o primeiro dia.
      return PERMITIDO;

    case 'fazer_carinho':
      if (idade < IDADE_MINIMA_CARINHO_PET) {
        return {
          permitido: false,
          motivo: 'Você ainda não controla bem as mãos para fazer carinho sozinho(a).'
        };
      }
      return PERMITIDO;

    case 'alimentar':
      if (idade < IDADE_MINIMA_ALIMENTAR_PET) {
        return {
          permitido: false,
          motivo: 'Alguém ainda precisa segurar o potinho para você.'
        };
      }
      return PERMITIDO;

    case 'passear':
      if (idade < IDADE_MINIMA_PASSEAR_PET) {
        return {
          permitido: false,
          motivo: 'Você ainda é pequeno(a) para levar o pet na rua sozinho(a).'
        };
      }
      return PERMITIDO;

    default:
      // conversar, discutir, dar_presente, pedir_dinheiro, pedir_conselho:
      // nenhum faz sentido com um animal, em nenhuma idade.
      return {
        permitido: false,
        motivo: 'Um pet não participa desse tipo de interação.'
      };
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
  idade: number,
  ehPet: boolean = false,
  ehVinculoSocial: boolean = false
): boolean {
  if (ehPet) {
    // Só as interações de pet fazem sentido; conversar, discutir, presente
    // comprado, pedir dinheiro/conselho nunca entram na lista de um animal.
    return PET_INTERACOES.includes(interacao);
  }

  // F6-FIX — com um colega/amigo, só o repertório social.
  if (ehVinculoSocial) {
    if (!SOCIAL_INTERACOES.includes(interacao)) return false;
    if (interacao === 'dar_presente') return idade >= IDADE_MINIMA_DAR_PRESENTE - 2;
    return true;
  }

  // Interações exclusivas de pet nunca aparecem para uma pessoa.
  if (PET_INTERACOES.includes(interacao) && interacao !== 'passar_tempo') {
    return false;
  }

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
  idade: number,
  ehPet: boolean = false,
  ehVinculoSocial: boolean = false
): string {
  if (ehPet) {
    return narrarInteracaoComPet(interacao, nome, idade);
  }

  // F6-FIX — a narrativa familiar não serve para um colega: ela pressupõe
  // convivência doméstica ("engatinhou atrás de", "fez birra"). Com um
  // amigo, o gesto acontece no ambiente que os aproximou.
  if (ehVinculoSocial) {
    return narrarInteracaoSocial(interacao, nome, idade);
  }

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

/**
 * F6-FIX — a mesma ação, vivida com alguém de fora de casa.
 *
 * Varia por fase porque brincar aos 7 e sair aos 30 não são o mesmo gesto,
 * mas nunca invoca papel de família.
 */
function narrarInteracaoSocial(
  interacao: FamilyInteractionType,
  nome: string,
  idade: number
): string {
  const crianca = idade <= 11;
  const adolescente = idade >= 12 && idade <= 17;

  if (interacao === 'passar_tempo') {
    if (crianca) return `Você passou o recreio inteiro brincando com ${nome}.`;
    if (adolescente) return `Você e ${nome} ficaram à toa depois da aula, sem pressa de ir embora.`;
    return `Você e ${nome} deram um jeito de se encontrar e passar um tempo juntos.`;
  }

  if (interacao === 'conversar') {
    if (crianca) return `Você contou suas novidades para ${nome} e ouviu as dele(a) também.`;
    if (adolescente) return `Você e ${nome} conversaram sobre tudo o que estava acontecendo na escola.`;
    return `Você pôs a conversa em dia com ${nome}.`;
  }

  if (interacao === 'dar_presente') {
    return `Você deu uma lembrança para ${nome}, que não estava esperando.`;
  }

  return '';
}

/**
 * Narrativa das interações exclusivas de pet.
 *
 * Diferente do vínculo humano, não muda por fase do jogador — o gesto com
 * o animal é sempre o mesmo tipo de cena, simples e física.
 */
function narrarInteracaoComPet(
  interacao: FamilyInteractionType,
  nome: string,
  idade: number
): string {
  switch (interacao) {
    case 'passar_tempo':
      if (idade < 1) {
        return `${nome} ficou deitado(a) bem perto de você enquanto você observava tudo.`;
      }
      return `Você passou um tempo só olhando ${nome} e imitando os sons que ele(a) fazia.`;

    case 'fazer_carinho':
      return `Você fez carinho em ${nome} com calma, e ele(a) ficou tranquilo(a) do seu lado.`;

    case 'alimentar':
      return `Você encheu o potinho de ${nome} e ficou vendo ele(a) comer com pressa.`;

    case 'passear':
      return `Você levou ${nome} para passear e voltou cheio(a) de histórias sobre o caminho.`;

    default:
      return '';
  }
}
