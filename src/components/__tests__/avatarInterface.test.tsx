/**
 * @vitest-environment jsdom
 *
 * B4-FIX1 — avatar em vez de iniciais.
 *
 * O playtest apontou que a identidade só usava duas letras como retrato.
 * Estes testes garantem que um avatar simbólico (consistente com a fase
 * da vida) substituiu as iniciais, preservando a decisão de não usar foto
 * real nem gerar rosto.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

import { CharacterIdentity } from '../character/CharacterIdentity';
import { PersonAvatar } from '../character/PersonAvatar';
import { RelationshipSummary } from '../relationships/RelationshipSummary';
import { criarEstadoTeste, criarFamiliaTeste } from '../../systems/__tests__/fixtures';
import {
  obterCategoriaAvatar,
  obterCategoriaAvatarPessoa
} from '../../presentation/avatarPresentation';

afterEach(cleanup);

describe('B4-FIX1 · avatar em vez de iniciais', () => {
  it('a identidade não usa mais .identity__initials', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const { container } = render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Vive sozinha"
      />
    );

    expect(container.querySelector('.identity__initials')).toBeNull();
    expect(container.querySelector('.person-avatar')).toBeTruthy();
  });

  it('o avatar tem um rótulo acessível com o nome da pessoa', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const { container } = render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Vive sozinha"
      />
    );

    const avatar = container.querySelector('[role="img"]');
    expect(avatar).toBeTruthy();
    expect(avatar!.getAttribute('aria-label')).toContain(estado.personagem.nome);
  });

  it('categorias de avatar cobrem bebê, criança, adolescente, adulto e idoso', () => {
    expect(obterCategoriaAvatarPessoa(0)).toBe('bebe');
    expect(obterCategoriaAvatarPessoa(1)).toBe('bebe');
    expect(obterCategoriaAvatarPessoa(5)).toBe('crianca');
    expect(obterCategoriaAvatarPessoa(15)).toBe('adolescente');
    expect(obterCategoriaAvatarPessoa(30)).toBe('adulto');
    expect(obterCategoriaAvatarPessoa(65)).toBe('idoso');
  });

  it('um pet sempre recebe a categoria "pet", independente da idade', () => {
    expect(obterCategoriaAvatar(1, 'pet')).toBe('pet');
    expect(obterCategoriaAvatar(15, 'pet')).toBe('pet');
  });

  it('uma pessoa sem tipo informado usa a categoria por idade normalmente', () => {
    expect(obterCategoriaAvatar(30)).toBe('adulto');
  });

  it('relacionamentos em destaque usam avatar em vez de iniciais de texto', () => {
    const { container } = render(
      <RelationshipSummary familia={criarFamiliaTeste()} />
    );

    expect(container.querySelectorAll('.person-avatar').length).toBeGreaterThan(0);
  });

  it('o avatar de um pet na lista de relacionamentos usa a categoria pet', () => {
    const familia = criarFamiliaTeste();
    familia.push({
      id: 'fam_pet_x',
      nome: 'Bidu',
      sobrenome: '',
      genero: 'masculino',
      tipo: 'pet',
      idade: 4,
      relacionamento: 95,
      vivo: true
    });

    const { container } = render(<RelationshipSummary familia={familia} limite={10} />);
    const avatarPet = Array.from(container.querySelectorAll('.person-avatar')).find(
      el => el.getAttribute('aria-label')?.includes('Bidu')
    );
    expect(avatarPet).toBeTruthy();
    expect(avatarPet!.getAttribute('data-categoria')).toBe('pet');
  });

  it('PersonAvatar renderiza sem lançar para todas as categorias', () => {
    for (const idade of [0, 1, 5, 15, 30, 70]) {
      const { container } = render(<PersonAvatar nome="Teste" idade={idade} />);
      expect(container.querySelector('.person-avatar')).toBeTruthy();
      cleanup();
    }
  });
});
