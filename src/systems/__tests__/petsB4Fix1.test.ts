import { describe, expect, it } from 'vitest';
import {
  FamilyInteractionType,
  PetInteractionType
} from '../../types';
import { ehHumano, ehPet, obterEspecieRelacao } from '../relationEntitySystem';
import {
  INTERACOES_PET,
  avaliarCapacidadePet,
  deveOferecerInteracaoPet
} from '../petInteractionSystem';
import { interagirComPet } from '../petSystem';
import { interagirComFamiliar } from '../familySystem';
import { getActionAvailability } from '../availabilitySystem';
import { rotularInteracaoPet } from '../../presentation/petPresentation';
import { criarEstadoTeste, criarPersonagemTeste, criarPetTeste } from './fixtures';

const INTERACOES_HUMANAS: FamilyInteractionType[] = [
  'conversar',
  'passar_tempo',
  'dar_presente',
  'discutir',
  'pedir_dinheiro',
  'pedir_conselho'
];

describe('B4-FIX.1 · fronteira de entidade', () => {
  it('pet é reconhecido como espécie distinta', () => {
    expect(obterEspecieRelacao('pet')).toBe('pet');
    expect(ehPet('pet')).toBe(true);
    expect(ehHumano('pet')).toBe(false);
  });

  it('todo tipo humano de relação é humano', () => {
    for (const tipo of ['pai', 'mae', 'irmao', 'irma', 'filho', 'amiga', 'esposa'] as const) {
      expect(ehHumano(tipo)).toBe(true);
      expect(ehPet(tipo)).toBe(false);
    }
  });
});

describe('B4-FIX.1 · pet não recebe interações humanas', () => {
  it('o motor recusa toda interação humana aplicada a um pet', () => {
    const personagem = criarPersonagemTeste({ idade: 30 });
    const pet = criarPetTeste();

    for (const interacao of INTERACOES_HUMANAS) {
      const res = interagirComFamiliar(pet, personagem, interacao, 'medio');
      expect(res.sucesso).toBe(false);
      // Nenhum efeito parcial: estado devolvido é o mesmo que entrou.
      expect(res.membroAtualizado).toBe(pet);
      expect(res.personagemAtualizado).toBe(personagem);
      expect(res.custoDinheiro).toBe(0);
      expect(res.dinheiroGanho).toBe(0);
    }
  });

  it('a política de disponibilidade oculta o fluxo humano para pets', () => {
    const base = criarEstadoTeste({ idade: 30 });
    const pet = criarPetTeste();
    const ctx = { ...base, familia: [...base.familia, pet] };

    for (const interacao of INTERACOES_HUMANAS) {
      const disp = getActionAvailability(ctx, 'interagir_familia', {
        membroId: pet.id,
        tipoInteracao: interacao
      });
      expect(disp.kind).toBe('oculto');
    }
  });

  it('bypass da interface não funciona: chamada direta é recusada', () => {
    // A UI nunca deveria oferecer isso; o teste garante que, se oferecesse,
    // o motor ainda assim não aplicaria nada.
    const personagem = criarPersonagemTeste({ idade: 40 });
    const pet = criarPetTeste({ relacionamento: 50 });

    const res = interagirComFamiliar(pet, personagem, 'pedir_conselho');
    expect(res.sucesso).toBe(false);
    expect(res.membroAtualizado.relacionamento).toBe(50);
  });
});

describe('B4-FIX.1 · humano não recebe interações de pet', () => {
  it('o motor recusa ação de pet aplicada a uma pessoa', () => {
    const personagem = criarPersonagemTeste({ idade: 30 });
    const base = criarEstadoTeste({ idade: 30 });
    const mae = base.familia.find(f => f.tipo === 'mae')!;

    for (const interacao of INTERACOES_PET) {
      const res = interagirComPet(mae, personagem, interacao);
      expect(res.sucesso).toBe(false);
      expect(res.personagemAtualizado).toBe(personagem);
    }
  });

  it('a política oculta ações de pet para membros humanos', () => {
    const ctx = criarEstadoTeste({ idade: 30 });
    const mae = ctx.familia.find(f => f.tipo === 'mae')!;

    for (const interacao of INTERACOES_PET) {
      const disp = getActionAvailability(ctx, 'interagir_pet', {
        membroId: mae.id,
        tipoInteracaoPet: interacao
      });
      expect(disp.kind).toBe('oculto');
    }
  });
});

describe('B4-FIX.1 · capacidade do pet por idade do jogador', () => {
  it('bebê só encosta: nada mais é permitido', () => {
    expect(avaliarCapacidadePet('fazer_carinho', 0).permitido).toBe(true);
    for (const outra of ['brincar', 'dar_comida', 'passear', 'cuidar', 'ensinar_truque'] as PetInteractionType[]) {
      expect(avaliarCapacidadePet(outra, 0).permitido).toBe(false);
    }
  });

  it('criança brinca mas não assume a rotina de cuidados', () => {
    expect(avaliarCapacidadePet('brincar', 5).permitido).toBe(true);
    expect(avaliarCapacidadePet('dar_comida', 5).permitido).toBe(true);
    expect(avaliarCapacidadePet('cuidar', 5).permitido).toBe(false);
    expect(avaliarCapacidadePet('passear', 5).permitido).toBe(false);
  });

  it('adulto pode tudo', () => {
    for (const interacao of INTERACOES_PET) {
      expect(avaliarCapacidadePet(interacao, 25).permitido).toBe(true);
    }
  });

  it('todo bloqueio traz motivo em texto humano, sem número', () => {
    for (const idade of [0, 1, 3, 5, 7, 9]) {
      for (const interacao of INTERACOES_PET) {
        const cap = avaliarCapacidadePet(interacao, idade);
        if (!cap.permitido) {
          expect(cap.motivo.length).toBeGreaterThan(10);
          expect(cap.motivo).not.toMatch(/\d/);
        }
      }
    }
  });

  it('ações muito distantes da fase nem são oferecidas', () => {
    expect(deveOferecerInteracaoPet('cuidar', 0)).toBe(false);
    expect(deveOferecerInteracaoPet('passear', 1)).toBe(false);
    expect(deveOferecerInteracaoPet('fazer_carinho', 0)).toBe(true);
  });

  it('o motor revalida a idade, não só a interface', () => {
    const bebe = criarPersonagemTeste({ idade: 0 });
    const pet = criarPetTeste();

    const res = interagirComPet(pet, bebe, 'passear');
    expect(res.sucesso).toBe(false);
    expect(res.membroAtualizado).toBe(pet);
  });
});

describe('B4-FIX.1 · efeitos das interações de pet', () => {
  it('interação válida aproxima e não cria dinheiro', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    const pet = criarPetTeste({ relacionamento: 50 });

    const res = interagirComPet(pet, personagem, 'brincar');
    expect(res.sucesso).toBe(true);
    expect(res.membroAtualizado.relacionamento).toBeGreaterThan(50);
    expect(res.custoDinheiro).toBe(0);
  });

  it('só cuidar tem custo, e é modesto', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    const pet = criarPetTeste();

    const res = interagirComPet(pet, personagem, 'cuidar');
    expect(res.custoDinheiro).toBeGreaterThan(0);
    expect(res.custoDinheiro).toBeLessThanOrEqual(60);
  });

  it('pet morto não recebe interação', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    const morto = criarPetTeste({ vivo: false });

    expect(interagirComPet(morto, personagem, 'fazer_carinho').sucesso).toBe(false);
  });

  it('relacionamento nunca ultrapassa o limite', () => {
    const personagem = criarPersonagemTeste({ idade: 25 });
    let pet = criarPetTeste({ relacionamento: 98 });

    for (let i = 0; i < 10; i++) {
      pet = interagirComPet(pet, personagem, 'cuidar').membroAtualizado;
    }
    expect(pet.relacionamento).toBeLessThanOrEqual(100);
  });
});

describe('B4-FIX.1 · apresentação das ações de pet', () => {
  it('o rótulo muda com a fase de quem age', () => {
    const bebe = rotularInteracaoPet('fazer_carinho', 0);
    const adulto = rotularInteracaoPet('fazer_carinho', 30);
    expect(bebe.titulo).not.toBe(adulto.titulo);
  });

  it('toda interação tem rótulo em qualquer idade', () => {
    for (let idade = 0; idade <= 80; idade += 5) {
      for (const interacao of INTERACOES_PET) {
        const r = rotularInteracaoPet(interacao, idade);
        expect(r.titulo.length).toBeGreaterThan(0);
        expect(r.descricao.length).toBeGreaterThan(0);
      }
    }
  });

  it('nenhum rótulo de pet usa vocabulário de conversa humana', () => {
    for (let idade = 0; idade <= 60; idade += 3) {
      for (const interacao of INTERACOES_PET) {
        const r = rotularInteracaoPet(interacao, idade);
        const texto = `${r.titulo} ${r.descricao}`.toLowerCase();
        expect(texto).not.toMatch(/conselho|discutir|dinheiro|presente/);
      }
    }
  });
});
