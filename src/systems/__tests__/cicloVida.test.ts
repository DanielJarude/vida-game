import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EventHistory,
  idsDisparados,
  registrarOcorrencia
} from '../events/eventHistory';
import { executarPassagemDeAno } from '../agingSystem';
import { aplicarConsequenciasEscolha, avaliarRequisitoOpcao } from '../eventSystem';
import { getActionAvailability } from '../availabilitySystem';
import {
  criarPersonalidadeInicial,
  obterIntensidade,
  obterTracosPercebidos,
  registrarEscolha,
  TRACOS_COMPORTAMENTAIS
} from '../personalitySystem';
import { carregarJogo, salvarJogo } from '../saveSystem';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import { IMOVEIS_LOJA } from '../../data/assetsData';
import { criarEstadoTeste } from './fixtures';
import { GameEvent, LifeLogEntry, PersonalityState, TracoComportamental } from '../../types';

// ---------------------------------------------------------------------------
// Playtest automatizado de uma vida completa (B2), determinístico:
// percorre 0 → 25+ anos pelo motor real (agingSystem + eventSystem),
// respondendo eventos com uma estratégia fixa "pró-social", e verifica os
// marcos pedidos na validação final do PR.
// ---------------------------------------------------------------------------

// Estratégia de resposta: prefere opções com tags pró-sociais positivas
// (empatia, generosidade, disciplina, família, sociabilidade, coragem) e
// evita impulsividade — para observar um PADRÃO se formando.
function pontuacaoProsocial(tags: Partial<Record<TracoComportamental, number>>): number {
  let pontos = 0;
  for (const traco of ['empatia', 'generosidade', 'disciplina', 'familia', 'sociabilidade', 'coragem', 'independencia'] as TracoComportamental[]) {
    pontos += tags[traco] ?? 0;
  }
  pontos -= tags.impulsividade ?? 0;
  return pontos;
}

function criarLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear()
  };
}

// LCG determinístico (mesma semente → mesma vida)
function criarFonteDeterministica(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

interface Simulacao {
  idadeMaxima: number;
  idade: number;
  ano: number;
  personalidade: PersonalityState;
  timeline: LifeLogEntry[];
  historicoEventos: EventHistory;
  tracosNaIdade: (idade: number) => number[]; // máximos por eixo no fim de cada idade
  eventosRespondidos: number;
  primeirosTraçosApareceramNaIdade: number | null;
}

function simularVida(semente: number, idadeMaxima: number): Simulacao {
  definirFonteAleatoria(criarFonteDeterministica(semente));

  const estado = criarEstadoTeste({ idade: 0 });
  let { personagem, familia, educacao, carreira, economia } = estado;
  let personalidade = criarPersonalidadeInicial();
  const timeline: LifeLogEntry[] = [];
  let historico: EventHistory = [];
  const maximosPorIdade = new Map<number, number>();
  let eventosRespondidos = 0;
  let primeirosTraços: number | null = null;

  const responder = (evento: GameEvent): boolean => {
    const elegiveis = evento.opcoes
      .map(opcao => ({ opcao, req: avaliarRequisitoOpcao(opcao, personagem, economia, personalidade) }))
      .filter(o => o.req.aprovado);
    if (elegiveis.length === 0) return false;

    const melhor = [...elegiveis].sort((a, b) =>
      pontuacaoProsocial(b.opcao.consequencias.impactosComportamentais ?? {}) -
      pontuacaoProsocial(a.opcao.consequencias.impactosComportamentais ?? {})
    )[0].opcao;

    const res = aplicarConsequenciasEscolha(
      melhor, personagem, carreira, educacao, economia, familia, personagem.anoAtual,
      { eventoId: evento.id, personalidade }
    );
    if (res.recusado) return false;

    personagem = res.personagemAtualizado;
    carreira = res.carreiraAtualizada;
    educacao = res.educacaoAtualizada;
    economia = res.economiaAtualizada;
    familia = res.familiaAtualizada;
    personalidade = res.personalidadeAtualizada ?? personalidade;
    timeline.push(...res.novosLogs);
    eventosRespondidos += 1;
    return true;
  };

  while (personagem.idade < idadeMaxima) {
    const resultado = executarPassagemDeAno(personagem, familia, educacao, carreira, economia, historico, personalidade);
    personagem = resultado.personagemAtualizado;
    familia = resultado.familiaAtualizada;
    educacao = resultado.educacaoAtualizada;
    carreira = resultado.carreiraAtualizada;
    economia = resultado.economiaAtualizada;
    timeline.push(...resultado.novosLogs);

    if (resultado.morreu) {
      throw new Error(`Personagem morreu aos ${personagem.idade} na simulação (semente ${semente})`);
    }

    if (resultado.eventoDisparado) {
      historico = registrarOcorrencia(
        historico,
        resultado.eventoDisparado.id,
        personagem.idade,
        personagem.anoAtual
      );
      responder(resultado.eventoDisparado);
    }

    const maximo = Math.max(...TRACOS_COMPORTAMENTAIS.map(t => Math.abs(obterIntensidade(personalidade, t))));
    maximosPorIdade.set(personagem.idade, maximo);
    if (primeirosTraços === null && obterTracosPercebidos(personalidade).length > 0) {
      primeirosTraços = personagem.idade;
    }
  }

  resetarFonteAleatoria();

  return {
    idadeMaxima,
    idade: personagem.idade,
    ano: personagem.anoAtual,
    personalidade,
    timeline,
    historicoEventos: historico,
    tracosNaIdade: (idade: number) => [maximosPorIdade.get(idade) ?? 0],
    eventosRespondidos,
    primeirosTraçosApareceramNaIdade: primeirosTraços
  };
}

describe('Playtest automatizado: uma vida de 0 a 25 anos (determinística)', () => {
  let stub: ReturnType<typeof criarLocalStorageStub>;

  beforeEach(() => {
    stub = criarLocalStorageStub();
    vi.stubGlobal('localStorage', stub);
  });

  afterEach(() => {
    resetarFonteAleatoria();
    vi.unstubAllGlobals();
  });

  it('a vida completa cumpre os marcos de personalidade do PR', () => {
    const vida = simularVida(2026, 25);

    // -- 0 anos: personalidade começa em formação
    expect(vida.idade).toBe(25);

    // -- escolhas infantis registradas: houve eventos respondidos até os 11
    expect(vida.eventosRespondidos).toBeGreaterThan(3);
    const memoriasInfancia = vida.personalidade.memorias.filter(m => m.idade <= 11);
    expect(memoriasInfancia.length).toBeGreaterThan(0);
    for (const memoria of memoriasInfancia) {
      expect(typeof memoria.eventoId).toBe('string');
      expect(typeof memoria.opcaoId).toBe('string');
      expect(memoria.idade).toBeGreaterThanOrEqual(0);
    }

    // -- uma única escolha não define: no máximo de intensidade logo após a
    //    primeira escolha respondida, nenhum traço alcançou o limiar
    const primeiraMemoria = vida.personalidade.memorias[0];
    expect(primeiraMemoria).toBeDefined();
    const impactoPrimeira = Object.values(primeiraMemoria.tagsComportamentais);
    for (const valor of impactoPrimeira) {
      expect(Math.abs(valor as number)).toBeLessThan(5);
    }

    // -- padrões começam a produzir tendências até os 15.
    //
    //    Revisado no B4-FIX.1. A versão anterior exigia que a semente 2026,
    //    sozinha, consolidasse um traço. Ao ampliar a variedade infantil (o
    //    pool aos 3 anos passou de 0 para 9 eventos), as escolhas de uma
    //    vida passaram a se espalhar por mais eixos, e existem sementes
    //    legítimas — a 2026 entre elas — em que nenhum eixo isolado alcança
    //    o limiar. Isso é o sistema funcionando: antes, a repetição do mesmo
    //    evento concentrava impacto artificialmente no mesmo traço.
    //
    //    A propriedade que interessa é estatística, e é assim que passou a
    //    ser verificada: na maioria das vidas, um padrão pró-social
    //    consistente consolida algum traço até os 15.
    const ate15 = vida.personalidade.memorias.filter(m => m.idade <= 15);
    expect(ate15.length).toBeGreaterThan(0);

    const AMOSTRA = 40;
    let vidasComTraco = 0;
    for (let i = 1; i <= AMOSTRA; i++) {
      const outra = simularVida(i * 101, 15);
      const p = outra.personalidade.memorias.reduce(
        (acc, m) => registrarEscolha(acc, m).personalidade,
        criarPersonalidadeInicial()
      );
      if (obterTracosPercebidos(p).length > 0) vidasComTraco += 1;
    }
    expect(vidasComTraco / AMOSTRA).toBeGreaterThan(0.7);

    // -- ao fim da vida, traços percebidos são qualitativos (sem números).
    //
    //    Mesma revisão do bloco acima: a existência de traço é estatística,
    //    mas o formato do rótulo é absoluto — nenhum traço percebido, em
    //    nenhuma vida da amostra, pode exibir pontuação. Isso é verificado
    //    sobre todas as sementes, e não só sobre uma.
    let vidasComTracoFinal = 0;
    for (let i = 1; i <= AMOSTRA; i++) {
      const outra = simularVida(i * 101, 25);
      const percebidos = obterTracosPercebidos(outra.personalidade, 'feminino');
      if (percebidos.length > 0) vidasComTracoFinal += 1;
      for (const t of percebidos) {
        expect(t.rotulo).not.toMatch(/\d/);
      }
    }
    expect(vidasComTracoFinal / AMOSTRA).toBeGreaterThan(0.7);

    // -- Linha da Vida legível: nenhum log técnico de memória/personalidade
    expect(vida.timeline.length).toBeGreaterThan(0);
    for (const log of vida.timeline) {
      expect(log.texto.length).toBeGreaterThan(3);
      expect(log.texto).not.toMatch(/(eventoId|opcaoId|impactosComportamentais|tagsComportamentais|[+-]\s?\d\s*(empatia|disciplina|coragem))/i);
    }

    // -- personalidade persiste após reload (save → load)
    const estadoSalvo = {
      versao: 3,
      personagem: criarEstadoTeste({ idade: vida.idade }).personagem,
      familia: [],
      educacao: criarEstadoTeste().educacao,
      carreira: criarEstadoTeste().carreira,
      economia: criarEstadoTeste().economia,
      personalidade: vida.personalidade,
      timeline: vida.timeline,
      eventoAtivo: null,
      historicoEventosDisparados: idsDisparados(vida.historicoEventos),
      historicoEventos: vida.historicoEventos,
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    };
    expect(salvarJogo(estadoSalvo)).toBe(true);
    const recarregado = carregarJogo();
    expect(recarregado!.personalidade).toEqual(vida.personalidade);
    expect(recarregado!.personalidade.memorias).toEqual(vida.personalidade.memorias);

    // -- Energia continua inexistente no modelo
    expect(recarregado!.personagem!.stats).not.toHaveProperty('energia');
  });

  it('ações adultas continuam inacessíveis para crianças (B1-FIX ativo)', () => {
    definirFonteAleatoria(criarFonteDeterministica(7));

    for (const idade of [0, 2, 5, 10, 15]) {
      const estado = criarEstadoTeste({ idade, economia: { dinheiro: 1000000 } });
      const imovel = IMOVEIS_LOJA[0];
      expect(getActionAvailability(estado, 'comprar_bem', { itemId: imovel.id }).kind).toBe('oculto');
      expect(getActionAvailability(estado, 'investir').kind).toBe('oculto');
      expect(getActionAvailability(estado, 'jogar_loteria').kind).toBe('oculto');
      expect(getActionAvailability(estado, 'candidatar_emprego', { jobId: 'atendente' }).kind).toBe('oculto');
    }

    // aos 18+ a idade deixa de ser o bloqueio (requisitos de saldo seguem valendo)
    const adulto = criarEstadoTeste({ idade: 25, economia: { dinheiro: 1000000 } });
    expect(getActionAvailability(adulto, 'comprar_bem', { itemId: IMOVEIS_LOJA[0].id }).kind).toBe('disponivel');

    resetarFonteAleatoria();
  });
});
