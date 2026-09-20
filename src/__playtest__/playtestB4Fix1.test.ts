import { afterEach, describe, expect, it } from 'vitest';
import {
  definirFonteAleatoria,
  resetarFonteAleatoria
} from '../utils/random';
import { executarPassagemDeAno } from '../systems/agingSystem';
import { aplicarConsequenciasEscolha } from '../systems/eventSystem';
import { criarPersonalidadeInicial } from '../systems/personalitySystem';
import {
  registrarOcorrencia,
  type EventHistory
} from '../systems/events/eventHistory';
import { criarEstadoTeste } from '../systems/__tests__/fixtures';

/**
 * Playtest determinístico do B4-FIX.1.
 *
 * Mede a variedade real da Linha da Vida em várias vidas com sementes
 * diferentes. Os números aqui são medidos, não estipulados: os limites das
 * asserções foram escolhidos abaixo do observado para não travar o
 * desenvolvimento, mas a medição em si é reportada pelo console.
 */

function criarFonteDeterministica(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

interface VidaSimulada {
  /** IDs dos eventos disparados, na ordem em que aconteceram. */
  eventos: { id: string; idade: number }[];
}

function simularVida(semente: number, idadeMaxima: number): VidaSimulada {
  definirFonteAleatoria(criarFonteDeterministica(semente));

  const estado = criarEstadoTeste({ idade: 0 });
  let { personagem, familia, educacao, carreira, economia } = estado;
  let personalidade = criarPersonalidadeInicial();
  let historico: EventHistory = [];
  const eventos: { id: string; idade: number }[] = [];

  while (personagem.idade < idadeMaxima) {
    const resultado = executarPassagemDeAno(
      personagem,
      familia,
      educacao,
      carreira,
      economia,
      historico,
      personalidade
    );

    personagem = resultado.personagemAtualizado;
    familia = resultado.familiaAtualizada;
    educacao = resultado.educacaoAtualizada;
    carreira = resultado.carreiraAtualizada;
    economia = resultado.economiaAtualizada;

    if (resultado.morreu) break;

    const evento = resultado.eventoDisparado;
    if (evento) {
      eventos.push({ id: evento.id, idade: personagem.idade });
      historico = registrarOcorrencia(
        historico,
        evento.id,
        personagem.idade,
        personagem.anoAtual
      );

      // Responde sempre a primeira opção disponível: o objetivo aqui é medir
      // qual evento aparece, não otimizar a vida.
      const opcao = evento.opcoes[0];
      if (opcao) {
        const res = aplicarConsequenciasEscolha(
          opcao,
          personagem,
          carreira,
          educacao,
          economia,
          familia,
          personagem.anoAtual,
          { eventoId: evento.id, personalidade }
        );
        if (!res.recusado) {
          personagem = res.personagemAtualizado;
          carreira = res.carreiraAtualizada;
          educacao = res.educacaoAtualizada;
          economia = res.economiaAtualizada;
          familia = res.familiaAtualizada;
          personalidade = res.personalidadeAtualizada ?? personalidade;
        }
      }
    }
  }

  return { eventos };
}

function maiorRepeticao(eventos: { id: string }[]): number {
  const contagem = new Map<string, number>();
  for (const e of eventos) {
    contagem.set(e.id, (contagem.get(e.id) ?? 0) + 1);
  }
  return contagem.size === 0 ? 0 : Math.max(...contagem.values());
}

const SEMENTES = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010];

describe('Playtest determinístico B4-FIX.1 · variedade da Linha da Vida', () => {
  afterEach(() => resetarFonteAleatoria());

  it('10 vidas de 0 a 25 anos: mede diversidade e repetição', () => {
    const vidas = SEMENTES.map(s => simularVida(s, 25));

    const totais = vidas.map(v => v.eventos.length);
    const unicos = vidas.map(v => new Set(v.eventos.map(e => e.id)).size);
    const repeticoes = vidas.map(v => maiorRepeticao(v.eventos));

    const soma = (a: number[]) => a.reduce((x, y) => x + y, 0);
    const media = (a: number[]) => soma(a) / a.length;

    console.log(
      [
        '',
        '=== PLAYTEST B4-FIX.1 — 10 vidas, 0 a 25 anos ===',
        `eventos disparados (total):   ${soma(totais)}`,
        `eventos por vida (média):     ${media(totais).toFixed(1)}`,
        `eventos distintos por vida:   ${media(unicos).toFixed(1)}`,
        `taxa de originalidade:        ${((media(unicos) / media(totais)) * 100).toFixed(1)}%`,
        `maior repetição (média):      ${media(repeticoes).toFixed(1)}`,
        `maior repetição (pior vida):  ${Math.max(...repeticoes)}`,
        `eventos distintos no conjunto: ${new Set(vidas.flatMap(v => v.eventos.map(e => e.id))).size}`
      ].join('\n')
    );

    // Nenhum evento aparece 3 vezes numa vida — era exatamente a queixa do
    // playtest humano ("avós três vezes").
    expect(Math.max(...repeticoes)).toBeLessThanOrEqual(2);

    // A maioria esmagadora dos eventos de uma vida é inédita nela.
    expect(media(unicos) / media(totais)).toBeGreaterThan(0.85);
  });

  it('a infância (0 a 11) é variada, não um loop', () => {
    const vidas = SEMENTES.map(s => simularVida(s, 11));

    const porVida = vidas.map(v => ({
      total: v.eventos.length,
      distintos: new Set(v.eventos.map(e => e.id)).size,
      maior: maiorRepeticao(v.eventos)
    }));

    const media = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

    console.log(
      [
        '',
        '=== PLAYTEST B4-FIX.1 — infância (0 a 11), 10 vidas ===',
        `eventos por infância (média): ${media(porVida.map(p => p.total)).toFixed(1)}`,
        `distintos por infância:       ${media(porVida.map(p => p.distintos)).toFixed(1)}`,
        `maior repetição observada:    ${Math.max(...porVida.map(p => p.maior))}`,
        `eventos distintos no conjunto: ${new Set(vidas.flatMap(v => v.eventos.map(e => e.id))).size}`
      ].join('\n')
    );

    // Nenhuma infância repete o mesmo evento 3 vezes.
    expect(Math.max(...porVida.map(p => p.maior))).toBeLessThanOrEqual(2);

    // Duas infâncias diferentes não são a mesma infância: no conjunto das 10
    // vidas aparece uma boa variedade de eventos distintos.
    const distintosGlobais = new Set(
      vidas.flatMap(v => v.eventos.map(e => e.id))
    ).size;
    expect(distintosGlobais).toBeGreaterThanOrEqual(10);
  });

  it('duas vidas consecutivas não são iguais', () => {
    const a = simularVida(4242, 18);
    const b = simularVida(2424, 18);

    const seqA = a.eventos.map(e => e.id).join('>');
    const seqB = b.eventos.map(e => e.id).join('>');
    expect(seqA).not.toBe(seqB);

    const setA = new Set(a.eventos.map(e => e.id));
    const setB = new Set(b.eventos.map(e => e.id));
    const comuns = [...setA].filter(id => setB.has(id)).length;
    const uniao = new Set([...setA, ...setB]).size;

    console.log(
      `\n=== duas vidas até 18 anos: sobreposição ${((comuns / uniao) * 100).toFixed(0)}% ===`
    );

    // Alguma sobreposição é natural (marcos de vida), mas não pode ser a
    // mesma vida com outro nome.
    expect(comuns / uniao).toBeLessThan(0.75);
  });

  it('a mesma semente produz sempre a mesma vida', () => {
    const a = simularVida(777, 20).eventos.map(e => `${e.idade}:${e.id}`);
    const b = simularVida(777, 20).eventos.map(e => `${e.idade}:${e.id}`);
    expect(a).toEqual(b);
  });

  it('o cooldown é respeitado ao longo de uma vida inteira', () => {
    for (const semente of SEMENTES) {
      const vida = simularVida(semente, 40);
      const ultima = new Map<string, number>();

      for (const { id, idade } of vida.eventos) {
        const anterior = ultima.get(id);
        if (anterior !== undefined) {
          // Nenhum evento volta no ano seguinte ao que aconteceu.
          expect(idade - anterior).toBeGreaterThan(1);
        }
        ultima.set(id, idade);
      }
    }
  });

  it('nenhuma vida trava por falta de evento elegível', () => {
    // Pool pequeno não pode gerar exceção nem interromper a passagem de ano.
    for (const semente of [11, 22, 33]) {
      expect(() => simularVida(semente, 60)).not.toThrow();
    }
  });
});
