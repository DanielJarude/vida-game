/**
 * Saúde, envelhecimento e economia numa vida inteira.
 *
 * Esta etapa nasceu de uma medição, não de uma intuição, e os testes aqui
 * guardam exatamente o que a medição mostrou estar quebrado:
 *
 * 1. **A economia não tinha fundo.** O saldo era somado e podia ficar
 *    negativo para sempre. Sessenta vidas simuladas ficavam negativas a
 *    partir dos 20 anos e chegavam aos 80 com mediana de −R$ 848.000, sem
 *    que nada acontecesse por causa disso. `EconomyState.dividas` existia,
 *    era subtraído do patrimônio e aparecia em duas telas — e nenhum
 *    sistema jamais escrevia nele. `padraoDeVida` era lido e nunca mudava.
 *
 * 2. **Envelhecer era um relógio, não uma trajetória.** A perda de saúde
 *    dependia só da idade; condicionamento e estresse entravam como ±2
 *    pontos fixos. Resultado: mediana de morte aos 80 e ninguém passando
 *    dos 87, vivesse como vivesse.
 *
 * 3. **O estresse era uma catraca.** Nada no motor o reduzia. Uma vida sem
 *    atividades chegava a 100 e ficava lá, drenando saúde para sempre.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { executarPassagemDeAno } from '../agingSystem';
import {
  ALIVIO_NATURAL_ESTRESSE,
  aplicarEnvelhecimentoAtributos,
  calcularResiliencia,
  IDADE_INICIO_DESGASTE,
  RESILIENCIA_MAXIMA,
  RESILIENCIA_MINIMA
} from '../attributeSystem';
import { processarAnoEconomia, TETO_DE_DIVIDA } from '../economySystem';
import { criarPersonalidadeInicial } from '../personalitySystem';
import { criarEstadoTeste } from './fixtures';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import type { Character, EconomyState, EventOccurrence } from '../../types';

afterEach(resetarFonteAleatoria);

function fonteFixa(valor = 0.5) {
  definirFonteAleatoria(() => valor);
}

function comHidden(idade: number, hidden: Partial<Character['hiddenStats']>): Character {
  const base = criarEstadoTeste({ idade }).personagem;
  return { ...base, hiddenStats: { ...base.hiddenStats, ...hidden } };
}

/* ========================================================================== */
/*                     ENVELHECER É UMA TRAJETÓRIA                            */
/* ========================================================================== */

describe('Vida longa · envelhecer depende de como se viveu', () => {
  it('antes da idade de desgaste, a idade sozinha não tira saúde', () => {
    fonteFixa();
    const jovem = comHidden(IDADE_INICIO_DESGASTE - 1, { condicionamentoFisico: 50, estresse: 40 });
    const { stats } = aplicarEnvelhecimentoAtributos(jovem);
    expect(stats.saude).toBe(jovem.stats.saude);
  });

  it('a resiliência separa quem se cuidou de quem não se cuidou', () => {
    const cuidadoso = comHidden(60, { condicionamentoFisico: 90, estresse: 10 });
    const descuidado = comHidden(60, { condicionamentoFisico: 10, estresse: 85 });
    const doente = { ...descuidado, doencas: ['A', 'B', 'C'] };

    expect(calcularResiliencia(cuidadoso)).toBeLessThan(1);
    expect(calcularResiliencia(descuidado)).toBeGreaterThan(1);
    expect(calcularResiliencia(doente)).toBeGreaterThan(calcularResiliencia(descuidado));

    // Nem imortalidade nem sentença: o corpo envelhece de qualquer jeito.
    for (const p of [cuidadoso, descuidado, doente]) {
      expect(calcularResiliencia(p)).toBeGreaterThanOrEqual(RESILIENCIA_MINIMA);
      expect(calcularResiliencia(p)).toBeLessThanOrEqual(RESILIENCIA_MAXIMA);
    }
  });

  it('em trinta anos de desgaste, a diferença entre as trajetórias é enorme', () => {
    // É a afirmação central da etapa: cuidar do corpo compra anos de vida.
    // Antes, esta diferença era de dois pontos de saúde fixos.
    const perdaAcumulada = (hidden: Partial<Character['hiddenStats']>) => {
      fonteFixa();
      let p = { ...comHidden(50, hidden), stats: { ...comHidden(50, hidden).stats, saude: 100 } };
      for (let idade = 50; idade < 80; idade++) {
        p = { ...p, idade };
        const { stats } = aplicarEnvelhecimentoAtributos(p);
        // Mantém o perfil fixo: aqui medimos o desgaste, não a deriva.
        p = { ...p, stats };
      }
      return 100 - p.stats.saude;
    };

    const perdaCuidadosa = perdaAcumulada({ condicionamentoFisico: 90, estresse: 10 });
    const perdaDescuidada = perdaAcumulada({ condicionamentoFisico: 10, estresse: 85 });

    expect(perdaDescuidada).toBeGreaterThan(perdaCuidadosa * 1.8);
    // E a trajetória cuidadosa não é imunidade: ela perde saúde de verdade.
    expect(perdaCuidadosa).toBeGreaterThan(0);
  });

  it('a curva de desgaste é contínua — nenhum aniversário custa uma década', () => {
    // A curva anterior somava um ponto inteiro a cada década cheia, o que
    // fazia completar 60 anos custar mais que os nove anos anteriores.
    fonteFixa(0);
    const perdaNaIdade = (idade: number) => {
      const p = { ...comHidden(idade, { condicionamentoFisico: 50, estresse: 30 }) };
      const antes = p.stats.saude;
      return antes - aplicarEnvelhecimentoAtributos(p).stats.saude;
    };
    for (let idade = 51; idade <= 95; idade++) {
      const salto = perdaNaIdade(idade) - perdaNaIdade(idade - 1);
      expect(salto, `salto no aniversário de ${idade}`).toBeLessThan(0.5);
    }
  });

  it('o estresse alivia sozinho — não é mais uma catraca', () => {
    fonteFixa();
    const p = comHidden(30, { estresse: 60, condicionamentoFisico: 50 });
    const { hiddenStats } = aplicarEnvelhecimentoAtributos(p);
    expect(hiddenStats.estresse).toBe(60 - ALIVIO_NATURAL_ESTRESSE);
  });

  it('numa vida passiva o estresse não fica preso no máximo para sempre', () => {
    fonteFixa();
    let p = comHidden(30, { estresse: 100, condicionamentoFisico: 50 });
    for (let i = 0; i < 10; i++) {
      p = { ...p, hiddenStats: aplicarEnvelhecimentoAtributos(p).hiddenStats };
    }
    expect(p.hiddenStats.estresse).toBeLessThan(80);
  });

  it('o condicionamento tem piso: uma vida sedentária não trava a resiliência no pior valor', () => {
    fonteFixa();
    let p = comHidden(40, { condicionamentoFisico: 60 });
    for (let i = 0; i < 80; i++) {
      p = { ...p, hiddenStats: aplicarEnvelhecimentoAtributos(p).hiddenStats };
    }
    expect(p.hiddenStats.condicionamentoFisico).toBeGreaterThan(0);
  });
});

/* ========================================================================== */
/*                  A ECONOMIA PASSOU A TER FUNDO                             */
/* ========================================================================== */

function economiaDe(parcial: Partial<EconomyState> = {}): EconomyState {
  return {
    dinheiro: 0,
    despesasAnuaisPadrao: 0,
    padraoDeVida: 'confortavel',
    propriedades: [],
    investimentos: [],
    dividas: 0,
    ...parcial
  };
}

describe('Vida longa · o dinheiro tem fundo', () => {
  const adulto = criarEstadoTeste({ idade: 30 }).personagem;

  it('faltando dinheiro, o padrão de vida cede antes de virar dívida', () => {
    fonteFixa();
    const r = processarAnoEconomia(economiaDe({ padraoDeVida: 'luxuoso' }), adulto, [], 0, 0, 2050);
    expect(r.economiaAtualizada.padraoDeVida).toBe('confortavel');
    expect(r.logsEconomia.some(l => /padrão de vida/i.test(l.texto))).toBe(true);
  });

  it('o saldo nunca fica negativo depois da passagem de ano: o buraco vira dívida', () => {
    fonteFixa();
    const r = processarAnoEconomia(economiaDe(), adulto, [], 0, 0, 2050);
    expect(r.economiaAtualizada.dinheiro).toBeGreaterThanOrEqual(0);
    expect(r.economiaAtualizada.dividas).toBeGreaterThan(0);
  });

  it('sobrando dinheiro, a dívida é paga antes de virar saldo', () => {
    fonteFixa();
    const r = processarAnoEconomia(
      economiaDe({ dinheiro: 0, dividas: 30000, padraoDeVida: 'modesto' }),
      adulto, [], 100000, 0, 2050
    );
    expect(r.economiaAtualizada.dividas).toBe(0);
    // O salário pagou a despesa, quitou a dívida e o resto virou saldo.
    expect(r.economiaAtualizada.dinheiro).toBeGreaterThan(0);
    expect(r.logsEconomia.some(l => /quitou/i.test(l.texto))).toBe(true);
  });

  it('a dívida tem teto — ela não cresce para sempre', () => {
    // A primeira versão desta correção somava e capitalizava sem limite, e
    // a simulação mediu R$ 10 milhões aos 90 anos. Trocar um número
    // negativo infinito por um positivo infinito não conserta nada.
    fonteFixa();
    let eco = economiaDe({ padraoDeVida: 'modesto' });
    for (let i = 0; i < 120; i++) {
      eco = processarAnoEconomia(eco, adulto, [], 0, 0, 2050 + i).economiaAtualizada;
    }
    expect(eco.dividas).toBeLessThanOrEqual(TETO_DE_DIVIDA);
  });

  it('esgotado o crédito, a falta vira privação sentida no corpo', () => {
    fonteFixa();
    const r = processarAnoEconomia(
      economiaDe({ dividas: TETO_DE_DIVIDA, padraoDeVida: 'modesto' }),
      adulto, [], 0, 0, 2050
    );
    expect(r.efeitosPrivacao).toBeDefined();
    expect(r.efeitosPrivacao!.saude).toBeLessThanOrEqual(0);
    expect(r.efeitosPrivacao!.felicidade).toBeLessThan(0);
    expect(r.efeitosPrivacao!.estresse).toBeGreaterThan(0);
  });

  it('um ano que fecha no azul não produz privação nenhuma', () => {
    fonteFixa();
    const r = processarAnoEconomia(economiaDe({ dinheiro: 50000 }), adulto, [], 90000, 0, 2050);
    expect(r.efeitosPrivacao).toBeUndefined();
    expect(r.economiaAtualizada.dividas).toBe(0);
  });

  it('a privação chega ao personagem pela passagem de ano, não fica só no estado financeiro', () => {
    fonteFixa();
    const estado = criarEstadoTeste({ idade: 40 });
    const eco = economiaDe({ dividas: TETO_DE_DIVIDA, padraoDeVida: 'modesto' });
    const r = executarPassagemDeAno(
      estado.personagem, estado.familia, estado.educacao, estado.carreira, eco, [],
      criarPersonalidadeInicial(), [] as EventOccurrence[]
    );
    expect(r.personagemAtualizado.hiddenStats.estresse).toBeGreaterThan(
      estado.personagem.hiddenStats.estresse - ALIVIO_NATURAL_ESTRESSE
    );
  });
});

/* ========================================================================== */
/*                   AS DUAS COISAS JUNTAS, NUMA VIDA INTEIRA                 */
/* ========================================================================== */

describe('Vida longa · comportamento ao longo de 100 anos', () => {
  function viver(semente: number, ajustar?: (p: Character) => Character) {
    let e = semente >>> 0;
    definirFonteAleatoria(() => {
      e = (Math.imul(e, 1664525) + 1013904223) >>> 0;
      return e / 4294967296;
    });

    const estado = criarEstadoTeste({ idade: 0 });
    let p = estado.personagem;
    let f = estado.familia, edu = estado.educacao, c = estado.carreira, eco = estado.economia;
    let disparados: string[] = [];
    let ocorrencias: EventOccurrence[] = [];
    let idadeMorte = 105;

    while (p.idade < 105) {
      if (ajustar) p = ajustar(p);
      const r = executarPassagemDeAno(p, f, edu, c, eco, disparados, criarPersonalidadeInicial(), ocorrencias);
      p = r.personagemAtualizado; f = r.familiaAtualizada; edu = r.educacaoAtualizada;
      c = r.carreiraAtualizada; eco = r.economiaAtualizada;
      if (r.ocorrencia) {
        disparados = [...disparados, r.ocorrencia.eventId];
        ocorrencias = [...ocorrencias, r.ocorrencia];
      }
      if (r.morreu) { idadeMorte = p.idade; break; }
    }
    resetarFonteAleatoria();
    return { idadeMorte, eco };
  }

  const SEMENTES = [11, 404, 7777, 31313, 90210, 13, 2468];

  it('a dívida nunca passa do teto em nenhuma vida completa', () => {
    for (const semente of SEMENTES) {
      expect(viver(semente).eco.dividas, `semente ${semente}`).toBeLessThanOrEqual(TETO_DE_DIVIDA);
    }
  });

  it('ninguém morre de velhice antes dos 60 só por passar o tempo', () => {
    for (const semente of SEMENTES) {
      expect(viver(semente).idadeMorte, `semente ${semente}`).toBeGreaterThanOrEqual(60);
    }
  });

  it('quem cuidou do corpo a vida inteira vive mais, em média', () => {
    // A promessa da etapa, medida ponta a ponta no motor real.
    const cuidar = (p: Character): Character => ({
      ...p,
      hiddenStats: { ...p.hiddenStats, condicionamentoFisico: 85, estresse: 15 }
    });
    const media = (ajuste?: (p: Character) => Character) =>
      SEMENTES.reduce((soma, s) => soma + viver(s, ajuste).idadeMorte, 0) / SEMENTES.length;

    expect(media(cuidar)).toBeGreaterThan(media() + 3);
  });
});
