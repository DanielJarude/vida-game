/**
 * @vitest-environment jsdom
 *
 * B4-FIX — PLAYTEST por idade, focado nos achados humanos.
 *
 * Para 0, 1, 2, 3 e 5 anos abre pai e mãe e registra exatamente quais
 * interações aparecem e em que estado. A listagem impressa alimenta a
 * seção PLAYTEST POR IDADE do relatório.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { FamilyModal } from '../components/modals/FamilyModal';
import { criarEstadoTeste } from '../systems/__tests__/fixtures';
import { getActionAvailability } from '../systems/availabilitySystem';
import type { FamilyInteractionType, FamilyMember } from '../types';

afterEach(cleanup);

const IDADES_FOCO = [0, 1, 2, 3, 5];
const IDADES_TODAS = [0, 1, 2, 3, 5, 10, 15, 18, 25];

interface AcaoListada {
  titulo: string;
  estado: 'disponível' | 'bloqueada';
  motivo?: string;
}

function abrirPessoa(idade: number, tipoMembro: 'pai' | 'mae'): AcaoListada[] {
  const estado = criarEstadoTeste({ idade });
  const membro = estado.familia.find(f => f.tipo === tipoMembro) as FamilyMember;

  render(
    <FamilyModal
      membro={membro}
      onClose={() => {}}
      onInteragir={() => {}}
      idadeJogador={idade}
      verificarInteracao={(tipo: FamilyInteractionType) =>
        getActionAvailability(estado, 'interagir_familia', {
          membroId: membro.id,
          tipoInteracao: tipo
        })
      }
    />
  );

  const acoes = screen
    .getAllByRole('button')
    .filter(b => b.querySelector('.event-choice__title'))
    .map(b => ({
      titulo: b.querySelector('.event-choice__title')!.textContent!.trim(),
      estado: ((b as HTMLButtonElement).disabled
        ? 'bloqueada'
        : 'disponível') as AcaoListada['estado'],
      motivo: b.querySelector('.event-choice__reason')?.textContent?.trim()
    }));

  cleanup();
  return acoes;
}

/* --------------------------------------------- registro para o relatório */

describe('PLAYTEST B4-FIX · interações com pai e mãe (0 a 5 anos)', () => {
  it.each(IDADES_FOCO)('aos %i anos — registro completo', idade => {
    for (const parente of ['pai', 'mae'] as const) {
      const acoes = abrirPessoa(idade, parente);

      const linhas = acoes
        .map(
          a =>
            `      - ${a.titulo} [${a.estado}]` +
            (a.motivo ? `\n        motivo: ${a.motivo}` : '')
        )
        .join('\n');

      console.log(`\n  ${idade} anos · ${parente.toUpperCase()}\n${linhas}`);

      // Sempre existe ao menos uma forma de vínculo possível.
      expect(acoes.some(a => a.estado === 'disponível')).toBe(true);

      // Toda ação bloqueada explica o porquê.
      for (const a of acoes) {
        if (a.estado === 'bloqueada') {
          expect(a.motivo, `"${a.titulo}" bloqueada sem motivo`).toBeTruthy();
        }
      }
    }
  });
});

/* ------------------------------------------------------- regras por idade */

describe('PLAYTEST B4-FIX · coerência das interações', () => {
  it('aos 0 e 1 ano não há NENHUMA interação verbal disponível', () => {
    for (const idade of [0, 1]) {
      for (const parente of ['pai', 'mae'] as const) {
        const acoes = abrirPessoa(idade, parente);
        const verbaisAtivas = acoes.filter(
          a =>
            a.estado === 'disponível' &&
            /conversar|falar|contar uma novidade/i.test(a.titulo)
        );
        expect(verbaisAtivas, `idade ${idade}`).toHaveLength(0);
      }
    }
  });

  it('aos 0 e 1 ano não há conflito disponível', () => {
    for (const idade of [0, 1]) {
      const acoes = abrirPessoa(idade, 'pai');
      const conflito = acoes.filter(
        a => a.estado === 'disponível' && /discutir|birra|bater de frente/i.test(a.titulo)
      );
      expect(conflito).toHaveLength(0);
    }
  });

  it('presente não é oferecido a nenhuma criança pequena', () => {
    for (const idade of IDADES_FOCO) {
      const acoes = abrirPessoa(idade, 'mae');
      expect(acoes.some(a => /presente/i.test(a.titulo)), `idade ${idade}`).toBe(
        false
      );
    }
  });

  it('em toda idade existe ao menos uma forma de vínculo ativa', () => {
    for (const idade of IDADES_TODAS) {
      const acoes = abrirPessoa(idade, 'mae');
      expect(
        acoes.some(a => a.estado === 'disponível'),
        `idade ${idade} ficou sem nenhuma interação`
      ).toBe(true);
    }
  });

  it('a fala aparece a partir dos 2 anos, e não antes', () => {
    const aos1 = abrirPessoa(1, 'pai');
    const aos2 = abrirPessoa(2, 'pai');

    const falaAtiva = (acoes: AcaoListada[]) =>
      acoes.some(
        a => a.estado === 'disponível' && /falar|conversar/i.test(a.titulo)
      );

    expect(falaAtiva(aos1)).toBe(false);
    expect(falaAtiva(aos2)).toBe(true);
  });

  it('o conflito aparece a partir dos 3 anos, e não antes', () => {
    const aos2 = abrirPessoa(2, 'pai');
    const aos3 = abrirPessoa(3, 'pai');

    const conflitoAtivo = (acoes: AcaoListada[]) =>
      acoes.some(
        a => a.estado === 'disponível' && /discutir|birra|frente/i.test(a.titulo)
      );

    expect(conflitoAtivo(aos2)).toBe(false);
    expect(conflitoAtivo(aos3)).toBe(true);
  });

  it('adulto tem o conjunto completo de interações', () => {
    const acoes = abrirPessoa(25, 'pai');
    const disponiveis = acoes.filter(a => a.estado === 'disponível').map(a => a.titulo);

    expect(disponiveis).toContain('Conversar');
    expect(disponiveis).toContain('Passar tempo junto');
    expect(disponiveis).toContain('Dar um presente');
    expect(disponiveis).toContain('Discutir');
  });

  it('nenhuma ação infantil usa vocabulário adulto de agenda', () => {
    for (const idade of [0, 1, 2, 3]) {
      const acoes = abrirPessoa(idade, 'mae');
      for (const a of acoes) {
        expect(a.titulo.toLowerCase()).not.toMatch(
          /pedir dinheiro|pedir um conselho|oficializar/
        );
      }
    }
  });
});
