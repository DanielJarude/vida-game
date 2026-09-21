/**
 * F3 · REGRA CANÔNICA — escolha biográfica ≠ decisão contextual.
 *
 * As duas são agência real do jogador. Elas diferem no que significam e,
 * por consequência, no que custam ao sistema:
 *
 *   DECISÃO CONTEXTUAL (comportamental) — o jogador toma posição, assume
 *   risco, escolhe entre valores. Pode mover personalidade, consome o
 *   orçamento de decisão do ritmo (teto, fadiga, janela) e é ela que as
 *   métricas de "decisão" contam.
 *
 *   ESCOLHA BIOGRÁFICA — o jogador participa da construção da própria
 *   história (qual foi a primeira palavra). Não é posição sobre nada: não
 *   move personalidade por padrão, não consome orçamento, não bloqueia
 *   decisões posteriores e é contada à parte.
 *
 * O defeito que motivou estes testes foi medido, não imaginado: *A Primeira
 * Palavra* é um marco garantido aos 2 anos e era gravada como
 * `natureza: 'decisao'`. O perfil de ritmo da faixa 3-5 tem teto de UMA
 * decisão numa janela de cinco anos, então aquele único marco consumia
 * sozinho toda a cota — e as decisões dos 3 aos 5 anos caíam de 6,7% para
 * 0,0% dos anos. Um marco biográfico apagava, por efeito colateral, a
 * agência dos três anos seguintes.
 *
 * Estes testes existem para que a correção continue sendo ARQUITETURAL. Por
 * isso o último deles roda a regra inteira sobre um segundo evento
 * biográfico sintético, que não existe no catálogo: se alguém "consertar"
 * o sistema com uma exceção para `bb_primeira_palavra`, aquele teste cai.
 */

import { describe, expect, it } from 'vitest';
import {
  definirPulsoDoAno,
  historicoDeRitmo,
  type ContextoRitmo,
  type RegistroRitmo
} from '../lifeRhythm';
import {
  classificacaoDoEvento,
  ehConduzidoPeloCalendario
} from '../../events/taxonomia';
import { MASTER_EVENTS_LIST } from '../../../data/events/allEvents';
import {
  taxonomiaConsomeCotaDeDecisao,
  taxonomiaMovePersonalidade,
  taxonomiaPermiteEscolha,
  type EventOccurrence,
  type GameEvent,
  type TaxonomiaConteudo
} from '../../../types';

// ---------------------------------------------------------------------------
// Instrumentos
// ---------------------------------------------------------------------------

function ctx(parcial: Partial<ContextoRitmo> & { idade: number }): ContextoRitmo {
  return { historico: [], densidadeEstrutural: 0, ...parcial };
}

/** Fonte determinística: isola a regra do sorteio. */
function rngFixo(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/**
 * Quantos anos, em N tentativas independentes, o ritmo destina a decisão.
 * Mede CAPACIDADE de decisão contextual, que é o recurso em disputa.
 */
function anosComDecisao(idade: number, historico: RegistroRitmo[], tentativas = 400): number {
  const rng = rngFixo(4242);
  let total = 0;
  for (let i = 0; i < tentativas; i++) {
    if (definirPulsoDoAno(ctx({ idade, historico }), rng).pulso === 'decisao') total++;
  }
  return total;
}

/** Ocorrência como o motor a grava, com a taxonomia real do evento. */
function ocorrencia(
  idade: number,
  taxonomia: TaxonomiaConteudo,
  eventId = 'evt'
): EventOccurrence {
  return {
    eventId,
    idade,
    ano: 2000 + idade,
    natureza: taxonomiaPermiteEscolha(taxonomia) ? 'decisao' : 'acontecimento',
    taxonomia
  };
}

/**
 * SEGUNDO evento biográfico, sintético — não existe no catálogo.
 *
 * Existe só para provar que a regra responde pela CLASSIFICAÇÃO e não por
 * um id conhecido. Se a arquitetura estiver certa, ele se comporta como *A
 * Primeira Palavra* sem que nenhuma linha do motor precise conhecê-lo.
 */
const SEGUNDO_BIOGRAFICO: GameEvent = {
  id: 'syn_apelido_de_infancia',
  titulo: 'O Apelido que Pegou',
  descricao: 'Alguém na família começou a te chamar de um jeito — e ficou.',
  idadeMinima: 4,
  idadeMaxima: 6,
  peso: 50,
  categoria: 'familia',
  taxonomia: 'escolha_biografica',
  opcoes: [
    {
      id: 'syn_apelido_a',
      texto: 'O apelido veio do seu jeito de andar',
      descricaoResultado: 'O apelido pegou na família inteira.',
      consequencias: {}
    },
    {
      id: 'syn_apelido_b',
      texto: 'O apelido veio de uma palavra que você repetia',
      descricaoResultado: 'O apelido pegou na família inteira.',
      consequencias: {}
    }
  ]
};

const PRIMEIRA_PALAVRA = MASTER_EVENTS_LIST.find(e => e.id === 'bb_primeira_palavra')!;

// ---------------------------------------------------------------------------
// 1-2 · quem paga o orçamento
// ---------------------------------------------------------------------------

describe('F3 · orçamento de decisão contextual — quem consome', () => {
  it('(1) escolha biográfica NÃO consome cota de decisão', () => {
    expect(taxonomiaConsomeCotaDeDecisao('escolha_biografica')).toBe(false);

    const lido = historicoDeRitmo([ocorrencia(2, 'escolha_biografica')]);
    expect(lido[0].consomeCota).toBe(false);
  });

  it('(2) decisão contextual CONSOME cota de decisão', () => {
    expect(taxonomiaConsomeCotaDeDecisao('decisao_comportamental')).toBe(true);

    const lido = historicoDeRitmo([ocorrencia(14, 'decisao_comportamental')]);
    expect(lido[0].consomeCota).toBe(true);
  });

  it('(5) marco testemunhado (sem escolha) não consome cota', () => {
    expect(taxonomiaConsomeCotaDeDecisao('marco_testemunhado')).toBe(false);
    expect(historicoDeRitmo([ocorrencia(1, 'marco_testemunhado')])[0].consomeCota).toBe(false);
  });

  it('(6) acontecimento puro não consome cota', () => {
    expect(taxonomiaConsomeCotaDeDecisao('acontecimento_puro')).toBe(false);
    expect(historicoDeRitmo([ocorrencia(30, 'acontecimento_puro')])[0].consomeCota).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3 · o efeito que de fato quebrou o jogo
// ---------------------------------------------------------------------------

describe('F3 · a primeira palavra não hipoteca a infância', () => {
  it('(3) escolha biográfica aos 2 anos não reduz a capacidade de decisão contextual depois', () => {
    // Este é o teste da regressão medida. A faixa 3-5 tem teto de UMA
    // decisão em janela de cinco anos: se o marco dos 2 anos contasse, a
    // capacidade cairia a zero — que foi exatamente o que aconteceu.
    //
    // O controle é um ACONTECIMENTO no mesmo ano, não um histórico vazio.
    // Isso isola a variável certa: qualquer ocorrência aos 2 anos encurta a
    // seca (`anosDeSecura`) e com isso a densidade do ano seguinte, o que é
    // correto e desejado — algo de fato aconteceu. O que a escolha
    // biográfica não pode fazer é cobrar ORÇAMENTO DE DECISÃO. Comparando
    // com um acontecimento, a seca é idêntica e só a cota varia.
    const comAcontecimento = anosComDecisao(4, historicoDeRitmo([
      ocorrencia(2, 'acontecimento_puro')
    ]));
    const comMarcoBiografico = anosComDecisao(4, historicoDeRitmo([
      ocorrencia(2, 'escolha_biografica', 'bb_primeira_palavra')
    ]));

    expect(comAcontecimento).toBeGreaterThan(0);
    expect(comMarcoBiografico).toBe(comAcontecimento);
  });

  it('uma decisão CONTEXTUAL aos 2 anos reduziria — a assimetria é o ponto', () => {
    // Prova que o teste acima não passa por acidente: o mecanismo de teto
    // continua vivo e mordendo, ele só parou de morder a categoria errada.
    const comDecisaoContextual = anosComDecisao(4, historicoDeRitmo([
      ocorrencia(2, 'decisao_comportamental')
    ]));
    expect(comDecisaoContextual).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4 · personalidade
// ---------------------------------------------------------------------------

describe('F3 · personalidade', () => {
  it('(4) escolha biográfica não move personalidade por padrão', () => {
    expect(taxonomiaMovePersonalidade('escolha_biografica')).toBe(false);
    expect(taxonomiaMovePersonalidade('marco_testemunhado')).toBe(false);
    expect(taxonomiaMovePersonalidade('acontecimento_puro')).toBe(false);
    // ... e a comportamental continua podendo, senão o sistema morre.
    expect(taxonomiaMovePersonalidade('decisao_comportamental')).toBe(true);
  });

  it('nenhuma escolha biográfica do catálogo declara impacto comportamental', () => {
    // Defesa em profundidade: o predicado acima protege o motor, este
    // protege o conteúdo de nascer contradizendo o motor.
    const biograficos = MASTER_EVENTS_LIST.filter(
      e => classificacaoDoEvento(e) === 'escolha_biografica'
    );
    expect(biograficos.length).toBeGreaterThan(0);
    for (const evento of biograficos) {
      for (const opcao of evento.opcoes) {
        const impactos = opcao.consequencias.impactosComportamentais ?? {};
        expect(
          Object.keys(impactos),
          `${evento.id} / ${opcao.id} declara impacto comportamental`
        ).toHaveLength(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7-8 · métricas
// ---------------------------------------------------------------------------

describe('F3 · métricas de agência', () => {
  /** Recorte do que as auditorias medem, derivado só da taxonomia. */
  function medir(ocorrencias: EventOccurrence[]) {
    const taxonomiaDe = (o: EventOccurrence) => o.taxonomia ?? 'decisao_comportamental';
    const decisoesContextuais = ocorrencias.filter(
      o => taxonomiaDe(o) === 'decisao_comportamental'
    ).length;
    const escolhasBiograficas = ocorrencias.filter(
      o => taxonomiaDe(o) === 'escolha_biografica'
    ).length;
    return {
      decisoesContextuais,
      escolhasBiograficas,
      agenciaTotal: decisoesContextuais + escolhasBiograficas
    };
  }

  const vida = [
    ocorrencia(1, 'marco_testemunhado'),
    ocorrencia(2, 'escolha_biografica', 'bb_primeira_palavra'),
    ocorrencia(9, 'acontecimento_puro'),
    ocorrencia(14, 'decisao_comportamental'),
    ocorrencia(22, 'decisao_comportamental')
  ];

  it('(7) as métricas de pacing separam decisão contextual de escolha biográfica', () => {
    const m = medir(vida);
    expect(m.decisoesContextuais).toBe(2);
    expect(m.escolhasBiograficas).toBe(1);
    // A separação tem de ser real: a biográfica não pode aparecer no balde
    // das contextuais nem vice-versa.
    expect(m.decisoesContextuais).not.toBe(m.agenciaTotal);
  });

  it('(8) a agência total inclui as duas sem fundi-las', () => {
    const m = medir(vida);
    expect(m.agenciaTotal).toBe(3);
    expect(m.agenciaTotal).toBe(m.decisoesContextuais + m.escolhasBiograficas);
    // Escolha biográfica é agência REAL: some do agregado se alguém a
    // tratar como mera narração.
    expect(m.agenciaTotal).toBeGreaterThan(m.decisoesContextuais);
  });
});

// ---------------------------------------------------------------------------
// 9-10 · a regra é arquitetural, não uma exceção com outro nome
// ---------------------------------------------------------------------------

describe('F3 · a regra responde pela taxonomia, nunca por id', () => {
  it('(9) nenhuma regra do motor depende do id bb_primeira_palavra', () => {
    // O catálogo pode citar o id (é onde o evento mora) e os testes/roteiros
    // de auditoria também. O MOTOR não pode: se um id de conteúdo aparece
    // dentro de uma regra, a regra deixou de ser reutilizável.
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');

    const raizes = ['src/systems', 'src/hooks', 'src/presentation', 'src/components'];
    const culpados: string[] = [];

    const varrer = (dir: string) => {
      for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
          if (entrada.name === '__tests__') continue;
          varrer(completo);
          continue;
        }
        if (!/\.tsx?$/.test(entrada.name)) continue;
        const conteudo = fs.readFileSync(completo, 'utf8');
        // Comentários podem (e devem) explicar o caso motivador.
        const codigo = conteudo
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (codigo.includes('bb_primeira_palavra')) culpados.push(completo);
      }
    };
    for (const raiz of raizes) varrer(raiz);

    expect(culpados, `id de conteúdo usado como regra em: ${culpados.join(', ')}`).toEqual([]);
  });

  it('(10) a MESMA regra vale para um segundo evento biográfico sintético', () => {
    // Nada no motor conhece `syn_apelido_de_infancia`: ele nasce aqui. Se
    // ele se comporta como *A Primeira Palavra* em todas as pontas, a
    // correção é arquitetural.
    expect(MASTER_EVENTS_LIST.some(e => e.id === SEGUNDO_BIOGRAFICO.id)).toBe(false);

    const taxonomia = classificacaoDoEvento(SEGUNDO_BIOGRAFICO);
    expect(taxonomia).toBe('escolha_biografica');

    // a) pergunta ao jogador...
    expect(taxonomiaPermiteEscolha(taxonomia)).toBe(true);
    // b) ...sem mover personalidade...
    expect(taxonomiaMovePersonalidade(taxonomia)).toBe(false);
    // c) ...sem consumir orçamento...
    expect(taxonomiaConsomeCotaDeDecisao(taxonomia)).toBe(false);
    // d) ...e sem hipotecar a capacidade de decisão dos anos seguintes
    //    (mesmo controle do teste 3: um acontecimento no mesmo ano).
    const comAcontecimento = anosComDecisao(5, historicoDeRitmo([
      ocorrencia(4, 'acontecimento_puro')
    ]));
    const comSintetico = anosComDecisao(5, historicoDeRitmo([
      ocorrencia(4, taxonomia, SEGUNDO_BIOGRAFICO.id)
    ]));
    expect(comAcontecimento).toBeGreaterThan(0);
    expect(comSintetico).toBe(comAcontecimento);

    // e) idêntico, ponta a ponta, ao evento real de mesma classificação.
    const real = classificacaoDoEvento(PRIMEIRA_PALAVRA);
    expect(real).toBe(taxonomia);
    expect(ehConduzidoPeloCalendario(taxonomia)).toBe(ehConduzidoPeloCalendario(real));
  });
});

// ---------------------------------------------------------------------------
// Compatibilidade — o defeito não pode voltar por save antigo
// ---------------------------------------------------------------------------

describe('F3 · saves anteriores à taxonomia', () => {
  it('ocorrência sem taxonomia cai na natureza, preservando o comportamento antigo', () => {
    const lido = historicoDeRitmo([
      { idade: 10 },
      { idade: 12, natureza: 'acontecimento' }
    ]);
    expect(lido).toEqual([
      { idade: 10, natureza: 'decisao', consomeCota: true },
      { idade: 12, natureza: 'acontecimento', consomeCota: false }
    ]);
  });
});
