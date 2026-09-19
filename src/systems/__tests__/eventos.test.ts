import { describe, expect, it } from 'vitest';
import { aplicarConsequenciasEscolha, avaliarRequisitoOpcao } from '../eventSystem';
import { criarEstadoTeste } from './fixtures';

// ---------------------------------------------------------------------------
// EventOption.requisito: avaliado de verdade na consulta (UI) e na execução (motor)
// ---------------------------------------------------------------------------
describe('Requisitos de opções de evento', () => {
  const opcaoDinheiro = {
    id: 'opt_caro',
    texto: 'Pagar tratamento de luxo',
    consequencias: { dinheiro: -5000, stats: { saude: 20 } },
    requisito: { dinheiroMinimo: 5000 }
  };

  const opcaoAtributo = {
    id: 'opt_atributo',
    texto: 'Discutir tese com o professor',
    consequencias: { stats: { inteligencia: 5 } },
    requisito: { atributo: 'inteligencia' as const, valorMinimo: 80 }
  };

  const opcaoFlag = {
    id: 'opt_flag',
    texto: 'Usar contato do congresso',
    consequencias: { dinheiro: 1000 },
    requisito: { flagNecessaria: 'contato_congresso' }
  };

  it('avalia requisito de dinheiro: sem saldo, recusado com motivo em pt-BR', () => {
    const estado = criarEstadoTeste({ idade: 30, economia: { dinheiro: 100 } });
    const aval = avaliarRequisitoOpcao(opcaoDinheiro, estado.personagem, estado.economia);
    expect(aval.aprovado).toBe(false);
    expect(aval.motivo).toContain('R$');
  });

  it('avalia requisito de atributo visível e oculto', () => {
    const estado = criarEstadoTeste({ idade: 30 });
    expect(avaliarRequisitoOpcao(opcaoAtributo, estado.personagem, estado.economia).aprovado).toBe(false);

    const sabio = criarEstadoTeste({
      idade: 30,
      personagem: { stats: { felicidade: 80, saude: 90, inteligencia: 90, aparencia: 70 } }
    });
    expect(avaliarRequisitoOpcao(opcaoAtributo, sabio.personagem, sabio.economia).aprovado).toBe(true);

    const opcaoDisciplina = {
      id: 'opt_disc',
      texto: 'Rotina militar',
      consequencias: {},
      requisito: { atributo: 'disciplina' as const, valorMinimo: 90 }
    };
    expect(avaliarRequisitoOpcao(opcaoDisciplina, estado.personagem, estado.economia).aprovado).toBe(false);
  });

  it('avalia requisito de flag', () => {
    const estado = criarEstadoTeste({ idade: 30 });
    expect(avaliarRequisitoOpcao(opcaoFlag, estado.personagem, estado.economia).aprovado).toBe(false);

    const comFlag = criarEstadoTeste({
      idade: 30,
      personagem: { flags: { contato_congresso: true } }
    });
    expect(avaliarRequisitoOpcao(opcaoFlag, comFlag.personagem, comFlag.economia).aprovado).toBe(true);
  });

  it('MOTOR recusa opção sem requisito cumprido SEM efeitos parciais', () => {
    const estado = criarEstadoTeste({ idade: 30, economia: { dinheiro: 100 } });
    const res = aplicarConsequenciasEscolha(
      opcaoDinheiro, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, 2026
    );
    expect(res.recusado).toBe(true);
    expect(res.mensagemRecusa).toBeTruthy();
    // estado inalterado
    expect(res.economiaAtualizada.dinheiro).toBe(100);
    expect(res.personagemAtualizado.stats.saude).toBe(estado.personagem.stats.saude);
    expect(res.novosLogs).toHaveLength(0);
  });

  it('MOTOR aplica consequências quando o requisito é cumprido', () => {
    const estado = criarEstadoTeste({ idade: 30, economia: { dinheiro: 20000 } });
    const res = aplicarConsequenciasEscolha(
      opcaoDinheiro, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, 2026
    );
    expect(res.recusado ?? false).toBe(false);
    expect(res.economiaAtualizada.dinheiro).toBe(15000);
    expect(res.personagemAtualizado.stats.saude).toBeGreaterThan(estado.personagem.stats.saude);
  });
});

// ---------------------------------------------------------------------------
// RNG controlado: sorteios reproduzíveis
// ---------------------------------------------------------------------------
describe('Fonte de aleatoriedade injetável', () => {
  it('randomInt/rollChance seguem a fonte definida', async () => {
    const { randomInt, rollChance, definirFonteAleatoria } = await import('../../utils/random');
    let chamadas = 0;
    definirFonteAleatoria(() => {
      chamadas++;
      return 0.99; // sempre valores máximos
    });
    expect(randomInt(1, 10)).toBe(10);
    expect(rollChance(50)).toBe(false); // 0.99*100 = 99 >= 50
    expect(chamadas).toBeGreaterThanOrEqual(2);
    definirFonteAleatoria(null);
  });
});
