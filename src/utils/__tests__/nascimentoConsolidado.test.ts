/**
 * B4-FIX2 item 13 — marco de nascimento consolidado.
 *
 * A timeline começava com 4-5 entradas independentes (nasceu / nome / pai
 * / mãe / classe social) antes de a história sequer começar. Agora é UM
 * parágrafo editorial só — sem perder nenhum dado.
 */

import { describe, it, expect } from 'vitest';
import { gerarHistoriaNascimento } from '../narrativeGenerator';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../systems/__tests__/fixtures';

describe('B4-FIX2 · nascimento consolidado em uma única entrada', () => {
  it('com pai e mãe, retorna exatamente 1 string com todos os dados', () => {
    const personagem = criarPersonagemTeste({ nome: 'Marina', sobrenome: 'Alves', cidade: 'Recife', estado: 'PE' });
    const familia = criarFamiliaTeste();
    const pai = familia.find(f => f.tipo === 'pai');
    const mae = familia.find(f => f.tipo === 'mae');

    const logs = gerarHistoriaNascimento(personagem, pai, mae);

    expect(logs.length).toBe(1);
    const texto = logs[0];
    expect(texto).toContain('Marina Alves');
    expect(texto).toContain('Recife');
    expect(texto).toContain('PE');
    expect(texto).toContain(pai!.nome);
    expect(texto).toContain(mae!.nome);
  });

  it('sem pai nem mãe (adoção/órfão), continua funcionando com 1 string coerente', () => {
    const personagem = criarPersonagemTeste({ nome: 'Davi', sobrenome: 'Ramos' });
    const logs = gerarHistoriaNascimento(personagem);

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('Davi Ramos');
    expect(logs[0]).not.toMatch(/undefined|null/);
  });

  it('só com a mãe, ainda menciona a mãe sem quebrar', () => {
    const personagem = criarPersonagemTeste();
    const mae = criarFamiliaTeste().find(f => f.tipo === 'mae');
    const logs = gerarHistoriaNascimento(personagem, undefined, mae);

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain(mae!.nome);
  });
});
