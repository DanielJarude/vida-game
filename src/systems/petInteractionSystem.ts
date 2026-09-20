/**
 * Interações com pets.
 *
 * Deliberadamente pequeno: o VIDA não é um simulador de pets. O objetivo é
 * que a relação com um animal se pareça com uma relação com um animal —
 * carinho, brincadeira, cuidado — e não com uma conversa de adulto.
 *
 * Reaproveita os princípios do `interactionCapabilitySystem`: mesma forma
 * de `Capacidade`, mesma divisão entre "não é oferecido" e "é oferecido
 * mas bloqueado com motivo", e a mesma regra de que a apresentação
 * consulta e o motor revalida.
 *
 * A idade do jogador importa aqui como importa para humanos: um bebê
 * observa e toca, uma criança brinca, um adulto cuida e leva ao
 * veterinário.
 */

import { Capacidade, PetInteractionType } from '../types';

/** Antes de andar com firmeza, ninguém leva um cachorro para passear. */
export const IDADE_MINIMA_PASSEAR = 8;

/** Responsabilidade pela rotina do animal (comida, remédio, banho). */
export const IDADE_MINIMA_CUIDAR = 10;

/** Ensinar exige constância e método, não só vontade. */
export const IDADE_MINIMA_ENSINAR = 6;

/** Servir comida sozinho — antes disso é um adulto que serve. */
export const IDADE_MINIMA_DAR_COMIDA = 4;

/** Brincar de verdade com o animal, e não só encostar nele. */
export const IDADE_MINIMA_BRINCAR = 2;

const PERMITIDO: Capacidade = { permitido: true };

/**
 * A interação com o pet é compatível com a idade do jogador?
 *
 * Mesma assinatura conceitual de `avaliarCapacidadeInteracao`, para que
 * apresentação e motor tratem humano e pet pelo mesmo protocolo, ainda que
 * com regras distintas.
 */
export function avaliarCapacidadePet(
  interacao: PetInteractionType,
  idade: number
): Capacidade {
  switch (interacao) {
    // Tocar o animal é possível desde sempre — é assim que um bebê o
    // conhece. Muda a narração, não a permissão.
    case 'fazer_carinho':
      return PERMITIDO;

    case 'brincar':
      if (idade < IDADE_MINIMA_BRINCAR) {
        return {
          permitido: false,
          motivo:
            'Você ainda é pequeno demais para brincar: por enquanto só observa e estica a mão.'
        };
      }
      return PERMITIDO;

    case 'dar_comida':
      if (idade < IDADE_MINIMA_DAR_COMIDA) {
        return {
          permitido: false,
          motivo: 'Quem enche o pote ainda é um adulto da casa.'
        };
      }
      return PERMITIDO;

    case 'ensinar_truque':
      if (idade < IDADE_MINIMA_ENSINAR) {
        return {
          permitido: false,
          motivo: 'Ensinar exige repetir com paciência — você ainda não tem esse fôlego.'
        };
      }
      return PERMITIDO;

    case 'passear':
      if (idade < IDADE_MINIMA_PASSEAR) {
        return {
          permitido: false,
          motivo: 'Ninguém te deixa sair sozinho(a) com a coleira ainda.'
        };
      }
      return PERMITIDO;

    case 'cuidar':
      if (idade < IDADE_MINIMA_CUIDAR) {
        return {
          permitido: false,
          motivo: 'A rotina de cuidados ainda é responsabilidade dos adultos.'
        };
      }
      return PERMITIDO;

    default:
      return PERMITIDO;
  }
}

/**
 * A interação deve aparecer na lista nesta fase?
 *
 * Mesmo critério usado para humanos: mostrar o que explica a fase, ocultar
 * o que seria só ruído. Um bebê não precisa ver "Levar para passear"
 * riscado; já "Brincar" bloqueado aos 1 ano mostra o que vem a seguir.
 */
export function deveOferecerInteracaoPet(
  interacao: PetInteractionType,
  idade: number
): boolean {
  if (interacao === 'passear') return idade >= IDADE_MINIMA_PASSEAR - 2;
  if (interacao === 'cuidar') return idade >= IDADE_MINIMA_CUIDAR - 2;
  if (interacao === 'ensinar_truque') return idade >= IDADE_MINIMA_ENSINAR - 2;
  return true;
}

/** Ordem em que as interações de pet são apresentadas. */
export const INTERACOES_PET: readonly PetInteractionType[] = [
  'fazer_carinho',
  'brincar',
  'dar_comida',
  'ensinar_truque',
  'passear',
  'cuidar'
] as const;
