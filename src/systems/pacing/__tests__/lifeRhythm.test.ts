/**
 * B4-FIX4 — a camada de ritmo.
 *
 * Testa COMPORTAMENTO, não implementação: o que se verifica aqui é o que o
 * jogador sentiria — "um bebê nunca é interrogado", "não dá para cair uma
 * decisão todo ano", "um ano que já teve história não é interrompido",
 * "silêncio prolongado acaba sendo quebrado". A aleatoriedade é injetada,
 * então nenhuma dessas afirmações depende de sorte.
 */

import { describe, expect, it } from 'vitest';
import {
  definirPulsoDoAno,
  ehAberturaDeFase,
  FATIA_MAXIMA_DE_DECISAO,
  historicoDeRitmo,
  obterFaixaDeRitmo,
  SATURACAO_ESTRUTURAL,
  type ContextoRitmo,
  type PulsoDoAno,
  type RegistroRitmo
} from '../lifeRhythm';

/** Fonte que sempre devolve o mesmo valor — isola a regra do sorteio. */
const sempre = (valor: number) => () => valor;

/** Fonte que devolve valores em sequência (rolagem de densidade, depois de natureza). */
function sequencia(...valores: number[]): () => number {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)];
}

function ctx(parcial: Partial<ContextoRitmo> & { idade: number }): ContextoRitmo {
  return { historico: [], densidadeEstrutural: 0, ...parcial };
}

/** Roda muitos anos independentes e conta os pulsos, com fonte pseudoaleatória fixa. */
function distribuir(idade: number, historico: RegistroRitmo[] = []): Record<PulsoDoAno, number> {
  const contagem: Record<PulsoDoAno, number> = { silencio: 0, acontecimento: 0, decisao: 0 };
  let semente = 12345;
  const rng = () => {
    semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
    return semente / 4294967296;
  };
  for (let i = 0; i < 2000; i++) {
    contagem[definirPulsoDoAno(ctx({ idade, historico }), rng).pulso]++;
  }
  return contagem;
}

describe('B4-FIX4 · ritmo da vida — autonomia por idade', () => {
  it('faixas cobrem a vida inteira sem buraco', () => {
    for (let idade = 0; idade <= 100; idade++) {
      expect(obterFaixaDeRitmo(idade), `idade ${idade}`).toBeTruthy();
    }
    expect(obterFaixaDeRitmo(2)).toBe('bebe');
    expect(obterFaixaDeRitmo(3)).toBe('primeira');
    expect(obterFaixaDeRitmo(17)).toBe('juventude');
    expect(obterFaixaDeRitmo(18)).toBe('jovem_adulto');
    expect(obterFaixaDeRitmo(60)).toBe('madureza');
  });

  it('de 0 a 2 anos NENHUM ano produz decisão — nem com a rolagem mais favorável possível', () => {
    // Não é probabilidade baixa: é impossível. A faixa `bebe` tem autonomia 0
    // e teto de decisões 0, então nem uma fonte aleatória que devolve sempre
    // 0 (o valor mais favorável a qualquer rolagem) consegue produzir uma
    // pergunta a um bebê.
    for (const idade of [0, 1, 2]) {
      for (const valor of [0, 0.01, 0.5, 0.99]) {
        const d = definirPulsoDoAno(ctx({ idade }), sempre(valor));
        expect(d.pulso, `idade ${idade}, rolagem ${valor}`).not.toBe('decisao');
      }
    }
  });

  it('em NENHUMA idade a decisão é a maioria do conteúdo interativo', () => {
    // A tradução mecânica de "às vezes você decide". A primeira versão
    // desta camada dava 0,85 ao adulto — e a simulação mediu três decisões
    // por acontecimento na vida adulta, ou seja, o VIDA perguntava muito
    // mais do que narrava. Autonomia plena é sobre PODER deliberar, não
    // sobre a vida virar uma sequência de encruzilhadas.
    for (let idade = 0; idade <= 95; idade++) {
      const chance = definirPulsoDoAno(ctx({ idade }), sempre(0)).chanceDeSerDecisao;
      expect(chance, `idade ${idade}`).toBeLessThanOrEqual(FATIA_MAXIMA_DE_DECISAO);
    }
  });

  it('a partir dos 3 anos a decisão passa a ser possível, e cresce com a idade', () => {
    const chance = (idade: number) =>
      definirPulsoDoAno(ctx({ idade }), sempre(0)).chanceDeSerDecisao;

    expect(chance(3)).toBeGreaterThan(0);
    expect(chance(8)).toBeGreaterThan(chance(4));
    expect(chance(13)).toBeGreaterThan(chance(8));
    expect(chance(16)).toBeGreaterThan(chance(13));
    expect(chance(25)).toBeGreaterThanOrEqual(chance(16));
  });

  it('em toda idade a vida ACONTECE mais do que pergunta', () => {
    // O teste original afirmava o contrário para adultos ("adultos,
    // majoritariamente decisões") — era a expectativa errada, escrita
    // junto com o parâmetro errado. Em nenhuma fase o jogo deve perguntar
    // mais do que narrar; é a frase de abertura do produto virada regra.
    for (const idade of [1, 4, 9, 13, 16, 22, 35, 50, 68, 80]) {
      const d = distribuir(idade);
      expect(
        d.acontecimento,
        `aos ${idade} anos o jogo pergunta mais do que narra (${d.decisao} decisões x ${d.acontecimento} acontecimentos)`
      ).toBeGreaterThanOrEqual(d.decisao);
    }

    // E a faixa de bebê continua sendo 100% acontecimento.
    expect(distribuir(1).decisao).toBe(0);
    expect(distribuir(1).acontecimento).toBeGreaterThan(0);
  });
});

describe('B4-FIX4 · ritmo da vida — nenhuma decisão obrigatória por ano', () => {
  it('o teto de decisões por janela é uma regra dura, não um sorteio', () => {
    // Três decisões nos últimos anos de um adolescente: por mais favorável
    // que seja a rolagem, o ano não pode ser mais uma pergunta.
    const historico: RegistroRitmo[] = [
      { idade: 13, natureza: 'decisao' },
      { idade: 14, natureza: 'decisao' },
      { idade: 15, natureza: 'decisao' }
    ];
    const d = definirPulsoDoAno(ctx({ idade: 16, historico }), sempre(0));
    expect(d.pulso).toBe('acontecimento');
    expect(d.motivo).toContain('teto de decisões');
  });

  it('acontecimentos seguidos NÃO consomem o teto de decisões — vida acontecendo não é interrogatório', () => {
    const soAcontecimentos: RegistroRitmo[] = [
      { idade: 30, natureza: 'acontecimento' },
      { idade: 31, natureza: 'acontecimento' },
      { idade: 32, natureza: 'acontecimento' },
      { idade: 33, natureza: 'acontecimento' }
    ];
    const d = definirPulsoDoAno(ctx({ idade: 34, historico: soAcontecimentos }), sempre(0));
    expect(d.decisoesNaJanela).toBe(0);
    expect(d.pulso).toBe('decisao');
  });

  it('decidir num ano reduz a chance de decidir no ano seguinte', () => {
    const semDecisao = definirPulsoDoAno(ctx({ idade: 30 }), sempre(0)).chanceDeSerDecisao;
    const comDecisao = definirPulsoDoAno(
      ctx({ idade: 30, historico: [{ idade: 29, natureza: 'decisao' }] }),
      sempre(0)
    ).chanceDeSerDecisao;
    expect(comDecisao).toBeLessThan(semDecisao);
  });

  it('uma vida inteira nunca ultrapassa o teto de decisões da própria faixa', () => {
    // Simulação longa alimentando o histórico de verdade: o invariante é
    // estrutural, então vale para qualquer sequência de rolagens.
    let semente = 987;
    const rng = () => {
      semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
      return semente / 4294967296;
    };
    const historico: RegistroRitmo[] = [];
    for (let idade = 1; idade <= 80; idade++) {
      const d = definirPulsoDoAno(ctx({ idade, historico }), rng);
      if (d.pulso !== 'silencio') historico.push({ idade, natureza: d.pulso });
    }
    const decisoesEm = (fim: number, anos: number) =>
      historico.filter(r => r.natureza === 'decisao' && r.idade > fim - anos && r.idade <= fim).length;

    for (let idade = 1; idade <= 80; idade++) {
      // Em NENHUMA idade quatro anos seguidos são todos de decisão.
      expect(decisoesEm(idade, 4), `4 anos até ${idade}`).toBeLessThanOrEqual(3);
      // Antes dos 18, o limite é mais apertado ainda: nunca três anos
      // seguidos perguntando algo a um adolescente.
      if (idade < 18) {
        expect(decisoesEm(idade, 3), `3 anos até ${idade}`).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('B4-FIX4 · ritmo da vida — anos tranquilos e densidade', () => {
  it('um ano que já produziu acontecimentos estruturais próprios não é interrompido', () => {
    const d = definirPulsoDoAno(
      ctx({ idade: 24, densidadeEstrutural: SATURACAO_ESTRUTURAL }),
      sempre(0)
    );
    expect(d.pulso).toBe('silencio');
    expect(d.motivo).toContain('saturado');
  });

  it('um único acontecimento estrutural reduz — mas não zera — a chance do ano', () => {
    const vazio = definirPulsoDoAno(ctx({ idade: 24 }), sempre(0.99)).chanceDeAlgoAcontecer;
    const ocupado = definirPulsoDoAno(
      ctx({ idade: 24, densidadeEstrutural: 1 }),
      sempre(0.99)
    ).chanceDeAlgoAcontecer;
    expect(ocupado).toBeLessThan(vazio);
    expect(ocupado).toBeGreaterThan(0);
  });

  it('anos densos recentes deixam o ano seguinte mais calmo (fadiga)', () => {
    const descansado = definirPulsoDoAno(
      ctx({ idade: 40, historico: [{ idade: 36, natureza: 'acontecimento' }] }),
      sempre(0.99)
    ).chanceDeAlgoAcontecer;
    const cansado = definirPulsoDoAno(
      ctx({
        idade: 40,
        historico: [
          { idade: 37, natureza: 'acontecimento' },
          { idade: 38, natureza: 'decisao' },
          { idade: 39, natureza: 'acontecimento' }
        ]
      }),
      sempre(0.99)
    ).chanceDeAlgoAcontecer;
    expect(cansado).toBeLessThan(descansado);
  });

  it('silêncio prolongado acaba sendo quebrado (secura empurra de volta)', () => {
    const recente = definirPulsoDoAno(
      ctx({ idade: 45, historico: [{ idade: 44, natureza: 'acontecimento' }] }),
      sempre(0.99)
    ).chanceDeAlgoAcontecer;
    const seco = definirPulsoDoAno(
      ctx({ idade: 45, historico: [{ idade: 38, natureza: 'acontecimento' }] }),
      sempre(0.99)
    ).chanceDeAlgoAcontecer;
    expect(seco).toBeGreaterThan(recente);
  });

  it('anos tranquilos existem de verdade em toda fase — nenhuma fase é 100% ocupada', () => {
    for (const idade of [1, 4, 9, 13, 16, 22, 45, 70]) {
      const d = distribuir(idade);
      expect(d.silencio, `idade ${idade} nunca fica em silêncio`).toBeGreaterThan(0);
      expect(
        d.silencio + d.acontecimento + d.decisao - d.silencio,
        `idade ${idade} nunca tem nada`
      ).toBeGreaterThan(0);
    }
  });

  it('a abertura de uma nova fase aumenta a chance de o conteúdo dela aparecer', () => {
    expect(ehAberturaDeFase(18)).toBe(true);
    expect(ehAberturaDeFase(19)).toBe(false);
    const naAbertura = definirPulsoDoAno(ctx({ idade: 18 }), sempre(0.99)).chanceDeAlgoAcontecer;
    const anoSeguinte = definirPulsoDoAno(ctx({ idade: 19 }), sempre(0.99)).chanceDeAlgoAcontecer;
    expect(naAbertura).toBeGreaterThan(anoSeguinte);
  });

  it('a chance de algo acontecer nunca é 0% nem 100% — o ritmo nunca vira certeza', () => {
    for (let idade = 0; idade <= 90; idade++) {
      const c = definirPulsoDoAno(ctx({ idade }), sempre(0.5)).chanceDeAlgoAcontecer;
      expect(c, `idade ${idade}`).toBeGreaterThan(0);
      expect(c, `idade ${idade}`).toBeLessThan(1);
    }
  });

  it('a rolagem realmente decide: a mesma situação produz silêncio ou não conforme o sorteio', () => {
    const favoravel = definirPulsoDoAno(ctx({ idade: 25 }), sequencia(0, 0)).pulso;
    const desfavoravel = definirPulsoDoAno(ctx({ idade: 25 }), sequencia(0.999, 0)).pulso;
    expect(favoravel).not.toBe('silencio');
    expect(desfavoravel).toBe('silencio');
  });
});

describe('B4-FIX4 · ritmo da vida — leitura do histórico persistido', () => {
  it('ocorrência sem natureza (save anterior ao B4-FIX4) é lida como decisão', () => {
    const lido = historicoDeRitmo([
      { idade: 10 },
      { idade: 12, natureza: 'acontecimento' }
    ]);
    expect(lido).toEqual([
      { idade: 10, natureza: 'decisao' },
      { idade: 12, natureza: 'acontecimento' }
    ]);
  });
});
