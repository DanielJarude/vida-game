/**
 * Motor das interações com pets.
 *
 * Espelha `interagirComFamiliar` em contrato (mesmo formato de retorno,
 * para que a orquestração não precise de dois caminhos) mas com efeitos
 * próprios: conviver com um animal mexe com felicidade, estresse e
 * empatia, e não com conselhos, dinheiro ou conflito verbal.
 *
 * Revalidação obrigatória: assim como no fluxo humano, a checagem de
 * capacidade acontece **aqui**, não só na interface. Uma chamada direta
 * com idade incompatível é recusada sem aplicar efeito nenhum.
 */

import { Character, FamilyMember, PetInteractionType } from '../types';
import { clamp, randomInt } from '../utils/random';
import { avaliarCapacidadePet } from './petInteractionSystem';
import { ehPet } from './relationEntitySystem';
import { obterFaseInteracao } from './interactionCapabilitySystem';

export interface ResultadoInteracaoPet {
  membroAtualizado: FamilyMember;
  personagemAtualizado: Character;
  custoDinheiro: number;
  mensagem: string;
  sucesso: boolean;
}

function recusar(
  membro: FamilyMember,
  personagem: Character,
  mensagem: string
): ResultadoInteracaoPet {
  return {
    membroAtualizado: membro,
    personagemAtualizado: personagem,
    custoDinheiro: 0,
    mensagem,
    sucesso: false
  };
}

/**
 * Narração por fase.
 *
 * A mesma ação significa coisas diferentes: aos 0 anos fazer carinho é
 * descobrir que o bicho é quente e se mexe; aos 30 é o reencontro no fim
 * de um dia ruim.
 */
function narrar(
  interacao: PetInteractionType,
  nome: string,
  idade: number
): string {
  const fase = obterFaseInteracao(idade);
  const pequeno = fase === 'recem_nascido' || fase === 'primeiros_passos';

  switch (interacao) {
    case 'fazer_carinho':
      if (pequeno) {
        return `Você esticou a mão e encostou em ${nome}. Pelo quente, respiração, uma coisa viva bem do seu tamanho.`;
      }
      if (fase === 'primeiras_palavras' || fase === 'infancia') {
        return `Você abraçou ${nome} com força total. Ele(a) aguentou firme, como sempre.`;
      }
      return `Você ficou um tempo fazendo carinho em ${nome}, sem pressa nenhuma.`;

    case 'brincar':
      if (fase === 'primeiras_palavras' || fase === 'infancia') {
        return `Você e ${nome} correram pela casa até os dois cansarem ao mesmo tempo.`;
      }
      return `Você brincou com ${nome} até ele(a) deitar no chão, satisfeito(a).`;

    case 'dar_comida':
      return `Você encheu o pote e ficou olhando ${nome} comer, como se fosse tarefa sua vigiar aquilo.`;

    case 'ensinar_truque':
      return `Você repetiu o mesmo comando para ${nome} umas quarenta vezes. Na quadragésima primeira, funcionou.`;

    case 'passear':
      return `Você levou ${nome} para dar uma volta. Metade do trajeto foi ele(a) decidindo o caminho.`;

    case 'cuidar':
      return `Você cuidou de ${nome}: água limpa, pelo escovado, tudo em ordem. Ninguém agradece, mas é você que faz.`;
  }
}

/**
 * Aplica uma interação com pet.
 *
 * Efeitos pequenos e coerentes com a economia do B3: só "cuidar" custa
 * dinheiro, e pouco — não existe loja de pet nem inventário.
 */
export function interagirComPet(
  membro: FamilyMember,
  personagem: Character,
  interacao: PetInteractionType
): ResultadoInteracaoPet {
  // Fronteira de entidade: o motor recusa aplicar ação de pet a um humano.
  // A interface nunca deveria chegar aqui, mas ela não é a proteção.
  if (!ehPet(membro.tipo)) {
    return recusar(
      membro,
      personagem,
      `${membro.nome} não é um animal de estimação.`
    );
  }

  if (!membro.vivo) {
    return recusar(membro, personagem, `${membro.nome} não está mais por aqui.`);
  }

  const capacidade = avaliarCapacidadePet(interacao, personagem.idade);
  if (!capacidade.permitido) {
    return recusar(membro, personagem, capacidade.motivo);
  }

  let deltaRel = 0;
  let deltaFel = 0;
  let deltaEstresse = 0;
  let deltaEmpatia = 0;
  let deltaCondicionamento = 0;
  let custo = 0;

  switch (interacao) {
    case 'fazer_carinho':
      deltaRel = randomInt(4, 9);
      deltaFel = randomInt(3, 7);
      deltaEstresse = -6;
      break;

    case 'brincar':
      deltaRel = randomInt(7, 14);
      deltaFel = randomInt(6, 12);
      deltaEstresse = -8;
      deltaCondicionamento = 1;
      break;

    case 'dar_comida':
      deltaRel = randomInt(3, 7);
      deltaFel = randomInt(1, 4);
      deltaEmpatia = 2;
      break;

    case 'ensinar_truque':
      deltaRel = randomInt(5, 11);
      deltaFel = randomInt(4, 9);
      // Ensinar algo a outro ser exige constância — isso é disciplina.
      deltaEmpatia = 2;
      break;

    case 'passear':
      deltaRel = randomInt(6, 12);
      deltaFel = randomInt(5, 10);
      deltaEstresse = -7;
      deltaCondicionamento = 2;
      break;

    case 'cuidar':
      deltaRel = randomInt(8, 15);
      deltaFel = randomInt(2, 6);
      deltaEmpatia = 4;
      // Custo simbólico de rotina (ração, higiene). Sem loja, sem inventário.
      custo = randomInt(20, 60);
      break;
  }

  const membroAtualizado: FamilyMember = {
    ...membro,
    relacionamento: clamp(membro.relacionamento + deltaRel, 0, 100)
  };

  const personagemAtualizado: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: clamp(personagem.stats.felicidade + deltaFel, 0, 100)
    },
    hiddenStats: {
      ...personagem.hiddenStats,
      empatia: clamp(personagem.hiddenStats.empatia + deltaEmpatia, 0, 100),
      estresse: clamp(personagem.hiddenStats.estresse + deltaEstresse, 0, 100),
      condicionamentoFisico: clamp(
        personagem.hiddenStats.condicionamentoFisico + deltaCondicionamento,
        0,
        100
      )
    }
  };

  return {
    membroAtualizado,
    personagemAtualizado,
    custoDinheiro: custo,
    mensagem: narrar(interacao, membro.nome, personagem.idade),
    sucesso: true
  };
}
