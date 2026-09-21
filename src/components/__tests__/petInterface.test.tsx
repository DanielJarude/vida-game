/**
 * @vitest-environment jsdom
 *
 * B4-FIX1 — interface das interações de pet.
 *
 * Cobre o modal de relacionamento aberto sobre um pet: rótulos próprios,
 * ausência das ações humanas que não fazem sentido e narrativa da
 * interação executada.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { FamilyModal } from '../modals/FamilyModal';
import { getActionAvailability } from '../../systems/availabilitySystem';
import { criarEstadoTeste } from '../../systems/__tests__/fixtures';
import type { FamilyInteractionType, FamilyMember } from '../../types';

afterEach(cleanup);

function criarPetTeste(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'fam_pet_1',
    nome: 'Mingau',
    sobrenome: '',
    genero: 'masculino',
    tipo: 'pet',
    idade: 3,
    relacionamento: 90,
    vivo: true,
    ...overrides
  };
}

function montarModalPet(idade: number, petOverrides: Partial<FamilyMember> = {}) {
  const estado = criarEstadoTeste({ idade });
  const pet = criarPetTeste(petOverrides);
  estado.familia.push(pet);
  const onInteragir = vi.fn();

  render(
    <FamilyModal
      membro={pet}
      onClose={() => {}}
      onInteragir={onInteragir}
      idadeJogador={idade}
      verificarInteracao={(tipo: FamilyInteractionType) =>
        getActionAvailability(estado, 'interagir_familia', {
          membroId: pet.id,
          tipoInteracao: tipo
        })
      }
    />
  );

  return { onInteragir, pet };
}

function acoesVisiveis() {
  return screen
    .getAllByRole('button')
    .filter(b => b.querySelector('.event-choice__title'))
    .map(b => ({
      titulo: b.querySelector('.event-choice__title')!.textContent!,
      desabilitado: (b as HTMLButtonElement).disabled
    }));
}

describe('B4-FIX1 · modal de relacionamento com um pet', () => {
  it('nunca mostra Conversar, Discutir, Dar um presente, Pedir dinheiro ou conselho', () => {
    montarModalPet(25);
    const acoes = acoesVisiveis();

    expect(acoes.some(a => a.titulo === 'Conversar')).toBe(false);
    expect(acoes.some(a => a.titulo === 'Discutir')).toBe(false);
    expect(acoes.some(a => /presente/i.test(a.titulo))).toBe(false);
    expect(acoes.some(a => /pedir.*dinheiro/i.test(a.titulo))).toBe(false);
    expect(acoes.some(a => /pedir.*conselho/i.test(a.titulo))).toBe(false);
  });

  it('mostra as interações próprias: fazer carinho, alimentar e passear', () => {
    montarModalPet(25);
    const acoes = acoesVisiveis();

    expect(acoes.some(a => /carinho/i.test(a.titulo))).toBe(true);
    expect(acoes.some(a => /alimentar/i.test(a.titulo))).toBe(true);
    expect(acoes.some(a => /passear/i.test(a.titulo))).toBe(true);
  });

  it('jogador de 0 ano ainda vê Passar tempo com o pet disponível', () => {
    montarModalPet(0);
    const acoes = acoesVisiveis();
    const passarTempo = acoes.find(a => /passar tempo/i.test(a.titulo));
    expect(passarTempo).toBeTruthy();
    expect(passarTempo!.desabilitado).toBe(false);
  });

  it('clicar em "Fazer carinho" dispara a interação correta', () => {
    const { onInteragir } = montarModalPet(25);
    const botao = screen
      .getAllByRole('button')
      .find(b => /carinho/i.test(b.querySelector('.event-choice__title')?.textContent ?? ''));

    expect(botao).toBeTruthy();
    fireEvent.click(botao!);
    expect(onInteragir).toHaveBeenCalledWith('fazer_carinho');
  });

  it('a relação exibida para um pet usa o rótulo "Pet", não um parentesco humano', () => {
    montarModalPet(25);
    expect(document.querySelector('.person-head__relation')?.textContent).toBe('Pet');
  });
});
