/**
 * B4-FIX1 — interações próprias de pet.
 *
 * O playtest apontou que um pet usava exatamente a mesma matriz de
 * capacidade de um humano (conversar, discutir, presente comprado), o que
 * não faz sentido para um animal. Estes testes cobrem a trilha própria:
 * `fazer_carinho`, `alimentar`, `passear` — e a ausência das interações
 * humanas que não fazem sentido com um pet, em nenhuma idade.
 */

import { describe, it, expect } from 'vitest';

import {
  avaliarCapacidadeInteracao,
  deveOferecerInteracao,
  narrarInteracaoPorFase,
  IDADE_MINIMA_CARINHO_PET,
  IDADE_MINIMA_ALIMENTAR_PET,
  IDADE_MINIMA_PASSEAR_PET,
  PET_INTERACOES
} from '../interactionCapabilitySystem';
import { ordenarInteracoesComPet } from '../../presentation/interactionPresentation';
import { getActionAvailability } from '../availabilitySystem';
import { interagirComFamiliar } from '../familySystem';
import { criarEstadoTeste, criarPersonagemTeste } from './fixtures';
import type { FamilyMember, FamilyInteractionType } from '../../types';

function criarPetTeste(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'fam_pet_1',
    nome: 'Mingau',
    sobrenome: '',
    genero: 'masculino',
    tipo: 'pet',
    idade: 2,
    relacionamento: 90,
    vivo: true,
    ...overrides
  };
}

describe('B4-FIX1 · interações exclusivas de pet', () => {
  it('conversar, discutir, dar_presente, pedir_dinheiro e pedir_conselho nunca são permitidos com um pet', () => {
    const proibidas: FamilyInteractionType[] = [
      'conversar',
      'discutir',
      'dar_presente',
      'pedir_dinheiro',
      'pedir_conselho'
    ];
    for (const tipo of proibidas) {
      for (const idade of [0, 5, 12, 30, 60]) {
        const cap = avaliarCapacidadeInteracao(tipo, idade, true);
        expect(cap.permitido).toBe(false);
      }
    }
  });

  it('essas mesmas interações nunca devem ser oferecidas (nem aparecer bloqueadas) para um pet', () => {
    const proibidas: FamilyInteractionType[] = [
      'conversar',
      'discutir',
      'dar_presente',
      'pedir_dinheiro',
      'pedir_conselho'
    ];
    for (const tipo of proibidas) {
      expect(deveOferecerInteracao(tipo, 25, true)).toBe(false);
    }
  });

  it('passar_tempo com um pet é permitido desde o primeiro ano de vida do jogador', () => {
    expect(avaliarCapacidadeInteracao('passar_tempo', 0, true).permitido).toBe(true);
  });

  it('fazer_carinho respeita a idade mínima', () => {
    expect(avaliarCapacidadeInteracao('fazer_carinho', IDADE_MINIMA_CARINHO_PET - 1, true).permitido).toBe(false);
    expect(avaliarCapacidadeInteracao('fazer_carinho', IDADE_MINIMA_CARINHO_PET, true).permitido).toBe(true);
  });

  it('alimentar respeita a idade mínima', () => {
    expect(avaliarCapacidadeInteracao('alimentar', IDADE_MINIMA_ALIMENTAR_PET - 1, true).permitido).toBe(false);
    expect(avaliarCapacidadeInteracao('alimentar', IDADE_MINIMA_ALIMENTAR_PET, true).permitido).toBe(true);
  });

  it('passear respeita a idade mínima', () => {
    expect(avaliarCapacidadeInteracao('passear', IDADE_MINIMA_PASSEAR_PET - 1, true).permitido).toBe(false);
    expect(avaliarCapacidadeInteracao('passear', IDADE_MINIMA_PASSEAR_PET, true).permitido).toBe(true);
  });

  it('todo motivo de bloqueio de pet é um texto não vazio', () => {
    const bloqueios = [
      avaliarCapacidadeInteracao('fazer_carinho', 0, true),
      avaliarCapacidadeInteracao('alimentar', 0, true),
      avaliarCapacidadeInteracao('passear', 0, true),
      avaliarCapacidadeInteracao('conversar', 30, true)
    ];
    for (const b of bloqueios) {
      expect(b.permitido).toBe(false);
      if (!b.permitido) {
        expect(b.motivo.length).toBeGreaterThan(0);
      }
    }
  });

  it('a narrativa de interação com pet nunca é vazia para as 4 ações próprias', () => {
    for (const tipo of PET_INTERACOES) {
      const texto = narrarInteracaoPorFase(tipo, 'Mingau', 10, true);
      expect(texto.length).toBeGreaterThan(0);
    }
  });

  it('a ordem de apresentação do pet cobre as 4 interações próprias', () => {
    const ordem = ordenarInteracoesComPet();
    expect(new Set(ordem)).toEqual(new Set(PET_INTERACOES));
  });

  it('getActionAvailability nunca disponibiliza "conversar" com um pet', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const pet = criarPetTeste();
    estado.familia.push(pet);

    const disp = getActionAvailability(estado, 'interagir_familia', {
      membroId: pet.id,
      tipoInteracao: 'conversar'
    });
    expect(disp.kind).toBe('oculto');
  });

  it('getActionAvailability disponibiliza "fazer_carinho" com um pet quando a idade permite', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const pet = criarPetTeste();
    estado.familia.push(pet);

    const disp = getActionAvailability(estado, 'interagir_familia', {
      membroId: pet.id,
      tipoInteracao: 'fazer_carinho'
    });
    expect(disp.kind).toBe('disponivel');
  });

  it('uma chamada direta ao motor recusa "conversar" com um pet, sem efeito parcial', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    const pet = criarPetTeste();

    const res = interagirComFamiliar(pet, personagem, 'conversar');
    expect(res.sucesso).toBe(false);
    expect(res.custoDinheiro).toBe(0);
    expect(res.dinheiroGanho).toBe(0);
    // Estado devolvido intacto — nenhum efeito parcial.
    expect(res.membroAtualizado).toEqual(pet);
    expect(res.personagemAtualizado).toEqual(personagem);
  });

  it('o motor aplica "fazer_carinho" com um pet e produz uma mensagem de narrativa', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    const pet = criarPetTeste();

    const res = interagirComFamiliar(pet, personagem, 'fazer_carinho');
    expect(res.sucesso).toBe(true);
    expect(res.mensagem.length).toBeGreaterThan(0);
    expect(res.membroAtualizado.relacionamento).toBeGreaterThanOrEqual(pet.relacionamento);
  });

  it('o motor aplica "alimentar" e "passear" com efeitos coerentes', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });

    const resAlimentar = interagirComFamiliar(criarPetTeste(), personagem, 'alimentar');
    expect(resAlimentar.sucesso).toBe(true);
    expect(resAlimentar.mensagem.length).toBeGreaterThan(0);

    const resPassear = interagirComFamiliar(criarPetTeste(), personagem, 'passear');
    expect(resPassear.sucesso).toBe(true);
    expect(resPassear.mensagem.length).toBeGreaterThan(0);
  });

  it('nenhuma narrativa de pet usa termos internos vazados (empatia, disciplina, reputação, estresse)', () => {
    for (const tipo of PET_INTERACOES) {
      const texto = narrarInteracaoPorFase(tipo, 'Mingau', 20, true).toLowerCase();
      expect(texto).not.toMatch(/empatia|disciplina|reputação|estresse|\+\d/);
    }
  });
});
