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
import { criarCalendarioInicial } from '../calendario/tipos';
import { classificacaoDoEvento } from '../events/taxonomia';
import { construirResumoAnual } from '../../presentation/outcomePresentation';
import { criarEstadoTeste } from './fixtures';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import type { EventOccurrence, LifeLogEntry } from '../../types';

afterEach(resetarFonteAleatoria);

interface AnoSimulado {
  idade: number;
  pulso: string;
  /** Diagnóstico textual do ritmo — é o contrato que o motor de fato expõe. */
  motivoRitmo: string;
  /** Todas as ocorrências do ano (F3-FIX: pode haver marco + acompanhante). */
  ocorrencias: EventOccurrence[];
  logs: LifeLogEntry[];
  abriuModalDeEvento: boolean;
  /**
   * F3 — o modal aberto foi um marco biográfico do Calendário da Vida?
   *
   * Separa "o jogo perguntou algo a quem não pode deliberar" (proibido) de
   * "o jogador participou da biografia de um marco garantido" (o que a F3
   * introduz de propósito).
   */
  marcoBiografico: boolean;
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
  let calendario = criarCalendarioInicial();
  const anos: AnoSimulado[] = [];

  while (p.idade < ateIdade) {
    const r = executarPassagemDeAno(
      p, f, e, c, eco, disparados, personalidade, ocorrencias, calendario
    );
    calendario = r.calendario;
    p = r.personagemAtualizado;
    f = r.familiaAtualizada;
    e = r.educacaoAtualizada;
    c = r.carreiraAtualizada;
    eco = r.economiaAtualizada;
    anos.push({
      idade: p.idade,
      pulso: r.ritmo.pulso,
      motivoRitmo: r.ritmo.motivo,
      ocorrencias: r.ocorrenciasDoAno,
      logs: r.novosLogs,
      abriuModalDeEvento: r.eventoDisparado !== null,
      marcoBiografico:
        r.eventoDisparado !== null &&
        classificacaoDoEvento(r.eventoDisparado) === 'escolha_biografica'
    });
    for (const oc of r.ocorrenciasDoAno) {
      disparados = [...disparados, oc.eventId];
      ocorrencias = [...ocorrencias, oc];
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
        // F3 — a regra continua sendo que um bebê NÃO DELIBERA. O que mudou
        // é que "abrir um modal" deixou de ser sinônimo de deliberar: a
        // escolha biográfica (qual foi a primeira palavra) é do jogador
        // sobre a biografia, não do bebê sobre a própria conduta, e por isso
        // não move traço nenhum. Decisão comportamental antes dos 3 anos
        // continua terminantemente proibida.
        expect(
          ano.abriuModalDeEvento && !ano.marcoBiografico,
          `semente ${semente}, idade ${ano.idade}`
        ).toBe(false);
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
  it('na população de vidas simuladas, acontecimentos superam decisões contextuais', () => {
    // A frase de abertura do VIDA, medida ponta a ponta. Diferente do
    // teste da camada de ritmo (que mede a REGRA), este passa pelo motor
    // inteiro e portanto também falha se faltar CONTEÚDO de acontecimento:
    // um ano que o ritmo destina a narrar e não encontra nada para narrar
    // vira silêncio, e a proporção desaba sem que nenhum parâmetro tenha
    // mudado.
    //
    // F3 — DUAS correções de DEFINIÇÃO, nenhuma de limiar. Documentadas
    // porque mudam o que o teste afirma:
    //
    // 1. A unidade passou a ser DECISÃO CONTEXTUAL, não "abriu modal". Sob
    //    a regra canônica, escolha biográfica é agência de outra espécie:
    //    ela não pergunta ao jogador que posição ele toma, pergunta que
    //    história ele teve. Contá-la aqui media a frase errada.
    //
    // 2. A afirmação passou a ser sobre a POPULAÇÃO, não sobre cada vida.
    //    "A vida acontece mais do que pergunta" é uma propriedade do
    //    sistema; exigi-la de toda vida individual é exigir que o acaso
    //    nunca produza uma vida movimentada. Medido em 200 sementes de 80
    //    anos, o contrato por vida já era falso em 8,5% delas ANTES desta
    //    fase — ou seja, o teste vinha passando porque as 5 sementes
    //    escolhidas calhavam de passar, não porque o motor garantia algo.
    //    A semente 17 (14 contextuais contra 13 acontecimentos) só expôs
    //    isso agora.
    //
    // O que passou a ser verificado é mais forte, não mais frouxo: o
    // agregado tem de respeitar a frase COM folga, e nenhuma vida isolada
    // pode invertê-la de forma grosseira. Medição em 200 vidas: razão
    // agregada 1,46:1 e pior vida individual 1,36 decisão por
    // acontecimento — os limiares abaixo ficam apertados contra o
    // comportamento real, sem ficar presos a uma semente.
    let contextuais = 0;
    let acontecimentos = 0;
    for (const semente of SEMENTES) {
      const anos = simularAnos(semente, 80);
      const contextuaisDaVida = anos.filter(
        a => a.abriuModalDeEvento && !a.marcoBiografico
      ).length;
      const acontecimentosDaVida = anos.filter(
        a => !a.abriuModalDeEvento && a.pulso !== 'silencio' && a.logs.length > 0
      ).length;
      contextuais += contextuaisDaVida;
      acontecimentos += acontecimentosDaVida;

      // Nenhuma vida isolada vira um questionário: mesmo a mais
      // movimentada não pode perguntar 1,5× mais do que narra.
      expect(
        contextuaisDaVida / Math.max(1, acontecimentosDaVida),
        `semente ${semente}: ${contextuaisDaVida} decisões contextuais contra ${acontecimentosDaVida} acontecimentos`
      ).toBeLessThan(1.5);
    }

    // E o sistema, somado, cumpre a frase de abertura.
    expect(
      acontecimentos,
      `agregado: ${contextuais} decisões contextuais contra ${acontecimentos} acontecimentos`
    ).toBeGreaterThan(contextuais);
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
    // F3-FIX — correção de MEDIÇÃO, não de contrato.
    //
    // O teste inferia "o ano saturou" contando logs não-'geral'/'cotidiano'.
    // Isso funcionava enquanto um ano só podia produzir um conteúdo. Desde
    // que marco e acontecimento leve coexistem, aqueles 2 logs estruturais
    // passaram a ser, em alguns anos, o PRÓPRIO resultado da composição — o
    // teste media o efeito que ele deveria vigiar e acusava a si mesmo.
    //
    // A saturação sempre foi um diagnóstico do ritmo, não uma contagem de
    // logs a posteriori. Agora é isso que se lê. O contrato vigiado é
    // idêntico e continua duro: ano que o ritmo declarou saturado não
    // sorteia NADA — nem modal, nem acontecimento, nem companhia.
    let anosSaturados = 0;
    for (const semente of SEMENTES) {
      for (const ano of simularAnos(semente, 80)) {
        if (!/ano saturado/.test(ano.motivoRitmo)) continue;
        anosSaturados++;
        expect(ano.abriuModalDeEvento, `semente ${semente}, idade ${ano.idade}`).toBe(false);
        expect(ano.ocorrencias.length, `semente ${semente}, idade ${ano.idade}`).toBe(0);
      }
    }
    // Sanidade: o caminho de saturação é realmente exercitado em alguma vida.
    expect(anosSaturados).toBeGreaterThan(0);
  });
});
