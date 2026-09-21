/**
 * B4-FIX4 — anos tranquilos e o fim das interrupções artificiais.
 *
 * Três antipadrões foram removidos nesta etapa, e cada um tem aqui um teste
 * permanente para nunca voltar:
 *
 *  1. o log "Foi um ano sem grandes sobressaltos" entrando na Linha da Vida;
 *  2. o modal de resumo anual abrindo num ano em que nada aconteceu;
 *  3. a pergunta obrigatória em 75% dos anos, independentemente de idade
 *     e de contexto.
 *
 * Os testes olham o COMPORTAMENTO observável do motor ao longo de vidas
 * inteiras simuladas — não o nome das funções que o produzem.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { executarPassagemDeAno } from '../agingSystem';
import { criarPersonalidadeInicial } from '../personalitySystem';
import { construirResumoAnual } from '../../presentation/outcomePresentation';
import { criarEstadoTeste } from './fixtures';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import type { EventOccurrence, LifeLogEntry } from '../../types';

afterEach(resetarFonteAleatoria);

interface AnoSimulado {
  idade: number;
  pulso: string;
  logs: LifeLogEntry[];
  abriuModalDeEvento: boolean;
}

/**
 * Percorre uma vida pelo motor real SEM responder às decisões (o evento
 * fica em aberto, como quando o jogador ainda não escolheu). Isso isola o
 * comportamento da passagem de ano.
 */
function simularAnos(semente: number, ateIdade: number): AnoSimulado[] {
  let estadoRng = semente >>> 0;
  definirFonteAleatoria(() => {
    estadoRng = (Math.imul(estadoRng, 1664525) + 1013904223) >>> 0;
    return estadoRng / 4294967296;
  });

  const estado = criarEstadoTeste({ idade: 0 });
  let p = estado.personagem;
  let f = estado.familia;
  let e = estado.educacao;
  let c = estado.carreira;
  let eco = estado.economia;
  const personalidade = criarPersonalidadeInicial();
  let disparados: string[] = [];
  let ocorrencias: EventOccurrence[] = [];
  const anos: AnoSimulado[] = [];

  while (p.idade < ateIdade) {
    const r = executarPassagemDeAno(p, f, e, c, eco, disparados, personalidade, ocorrencias);
    p = r.personagemAtualizado;
    f = r.familiaAtualizada;
    e = r.educacaoAtualizada;
    c = r.carreiraAtualizada;
    eco = r.economiaAtualizada;
    anos.push({
      idade: p.idade,
      pulso: r.ritmo.pulso,
      logs: r.novosLogs,
      abriuModalDeEvento: r.eventoDisparado !== null
    });
    if (r.ocorrencia) {
      disparados = [...disparados, r.ocorrencia.eventId];
      ocorrencias = [...ocorrencias, r.ocorrencia];
    }
    if (r.morreu) break;
  }

  resetarFonteAleatoria();
  return anos;
}

const SEMENTES = [3, 17, 101, 2024, 55501];

describe('B4-FIX4 · o ano tranquilo passa em silêncio de verdade', () => {
  it('um ano silencioso não escreve NADA na Linha da Vida', () => {
    for (const semente of SEMENTES) {
      for (const ano of simularAnos(semente, 80)) {
        if (ano.pulso !== 'silencio') continue;
        // Um ano silencioso pode ter logs ESTRUTURAIS (o motor de educação,
        // carreira ou família produziu algo). O que ele nunca pode ter é
        // texto de preenchimento: se o ano não teve nada, não há entrada.
        for (const log of ano.logs) {
          expect(
            log.categoria,
            `semente ${semente}, idade ${ano.idade}: log de preenchimento "${log.texto}"`
          ).not.toBe('cotidiano');
        }
      }
    }
  });

  it('nenhum texto de "ano sem grandes acontecimentos" aparece em 80 anos de vida', () => {
    const PADRAO_PREENCHIMENTO =
      /(sem grandes acontecimentos|sem grandes sobressaltos|a vida seguiu seu curso|ano calmo e seguro|o tempo passar sem pressa)/i;
    for (const semente of SEMENTES) {
      for (const ano of simularAnos(semente, 80)) {
        for (const log of ano.logs) {
          expect(
            PADRAO_PREENCHIMENTO.test(log.texto),
            `semente ${semente}, idade ${ano.idade}: "${log.texto}"`
          ).toBe(false);
        }
      }
    }
  });

  it('um ano silencioso produz resumo anual vazio — e o vazio é o sinal de não abrir modal', () => {
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 60);
      const silenciosos = anos.filter(a => a.pulso === 'silencio' && a.logs.length === 0);
      expect(silenciosos.length, `semente ${semente} nunca teve um ano realmente vazio`).toBeGreaterThan(0);
      for (const ano of silenciosos) {
        expect(construirResumoAnual(ano.idade, 2000 + ano.idade, ano.logs).silencioso).toBe(true);
      }
    }
  });
});

describe('B4-FIX4 · o jogo não pergunta todo ano', () => {
  it('a maioria dos anos de uma vida NÃO abre uma decisão', () => {
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      const comDecisao = anos.filter(a => a.abriuModalDeEvento).length;
      const proporcao = comDecisao / anos.length;
      // O regime anterior era 75% dos anos com evento interativo, quase
      // sempre uma pergunta. O limite aqui é generoso de propósito: não
      // mede um alvo estético, mede que o jogo deixou de ser um
      // questionário anual.
      expect(proporcao, `semente ${semente}: ${(100 * proporcao).toFixed(0)}% dos anos com decisão`)
        .toBeLessThan(0.4);
    }
  });

  it('existem sequências de anos seguidos sem nenhuma interrupção', () => {
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      let maiorSequencia = 0;
      let atual = 0;
      for (const ano of anos) {
        if (ano.pulso === 'silencio') {
          atual++;
          maiorSequencia = Math.max(maiorSequencia, atual);
        } else {
          atual = 0;
        }
      }
      expect(maiorSequencia, `semente ${semente}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('nenhum ano de 0 a 2 anos abre uma decisão, em nenhuma semente', () => {
    for (const semente of SEMENTES) {
      for (const ano of simularAnos(semente, 80)) {
        if (ano.idade > 2) continue;
        expect(ano.abriuModalDeEvento, `semente ${semente}, idade ${ano.idade}`).toBe(false);
      }
    }
  });

  it('a vida continua acontecendo: anos silenciosos não são a totalidade da vida', () => {
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      const comAlgo = anos.filter(a => a.pulso !== 'silencio').length;
      expect(comAlgo, `semente ${semente}`).toBeGreaterThan(10);
    }
  });
});

describe('B4-FIX4 · a vida acontece mais do que pergunta — no motor real', () => {
  it('em toda vida simulada, acontecimentos superam decisões', () => {
    // A frase de abertura do VIDA, medida ponta a ponta. Diferente do
    // teste da camada de ritmo (que mede a REGRA), este passa pelo motor
    // inteiro e portanto também falha se faltar CONTEÚDO de acontecimento:
    // um ano que o ritmo destina a narrar e não encontra nada para narrar
    // vira silêncio, e a proporção desaba sem que nenhum parâmetro tenha
    // mudado.
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      const decisoes = anos.filter(a => a.abriuModalDeEvento).length;
      const acontecimentos = anos.filter(
        a => !a.abriuModalDeEvento && a.pulso !== 'silencio' && a.logs.length > 0
      ).length;
      expect(
        acontecimentos,
        `semente ${semente}: ${decisoes} decisões contra ${acontecimentos} acontecimentos`
      ).toBeGreaterThanOrEqual(decisoes);
    }
  });

  it('nenhuma década adulta fica sem nada acontecendo por falta de conteúdo', () => {
    // Guarda contra o buraco de acervo que a simulação encontrou: entre 20
    // e 79 anos havia 15 acontecimentos elegíveis contra 23 decisões, e
    // décadas inteiras passavam com um único acontecimento narrado.
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      for (let decada = 20; decada < 70; decada += 10) {
        const naDecada = anos.filter(a => a.idade >= decada && a.idade < decada + 10);
        if (naDecada.length < 10) continue; // a pessoa morreu antes
        const vividos = naDecada.filter(a => a.pulso !== 'silencio').length;
        expect(
          vividos,
          `semente ${semente}, década dos ${decada}: só ${vividos} anos com algo`
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('B4-FIX4 · um ano que já tem história não é interrompido', () => {
  it('quando o próprio ano produziu 2+ acontecimentos estruturais, nada é sorteado por cima', () => {
    for (const semente of SEMENTES) {
      for (const ano of simularAnos(semente, 80)) {
        const estruturais = ano.logs.filter(
          l => l.categoria !== 'geral' && l.categoria !== 'cotidiano'
        ).length;
        if (estruturais >= 2 && ano.pulso === 'silencio') {
          // É o caso esperado — o ano se bastou.
          expect(ano.abriuModalDeEvento).toBe(false);
        }
      }
    }
    // Sanidade: o caminho de saturação é realmente exercitado em alguma vida.
    const houveSaturacao = SEMENTES.some(semente =>
      simularAnos(semente, 80).some(
        a =>
          a.pulso === 'silencio' &&
          a.logs.filter(l => l.categoria !== 'geral' && l.categoria !== 'cotidiano').length >= 2
      )
    );
    expect(houveSaturacao).toBe(true);
  });
});
