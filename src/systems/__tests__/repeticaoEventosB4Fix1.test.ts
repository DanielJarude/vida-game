import { describe, expect, it } from 'vitest';
import { GameEvent } from '../../types';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';
import {
  anosDesdeUltimaOcorrencia,
  contarOcorrencias,
  idsDisparados,
  jaAconteceu,
  migrarDeListaDeIds,
  normalizarHistorico,
  registrarOcorrencia,
  type EventHistory
} from '../events/eventHistory';
import {
  COOLDOWN_PADRAO_ANOS,
  classificarRepeticao,
  cooldownDoEvento
} from '../events/eventRepetition';
import { pesoEfetivo, podeRepetirAgora } from '../events/eventEligibility';
import { sortearPonderado } from '../events/eventSelection';

function evento(over: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'ev_teste',
    titulo: 'Teste',
    descricao: 'Descrição',
    idadeMinima: 0,
    idadeMaxima: 99,
    categoria: 'cotidiano',
    peso: 50,
    opcoes: [],
    ...over
  };
}

describe('B4-FIX.1 · histórico por IDs estáveis', () => {
  it('o histórico começa vazio', () => {
    expect(idsDisparados([])).toEqual([]);
    expect(jaAconteceu([], 'ev_teste')).toBe(false);
  });

  it('registrar não muta o histórico anterior', () => {
    const antes: EventHistory = [];
    const depois = registrarOcorrencia(antes, 'ev_a', 10, 2036);
    expect(antes).toEqual([]);
    expect(depois).toHaveLength(1);
  });

  it('ocorrências repetidas incrementam o contador e atualizam a idade', () => {
    let h: EventHistory = [];
    h = registrarOcorrencia(h, 'ev_a', 5, 2031);
    h = registrarOcorrencia(h, 'ev_a', 12, 2038);

    expect(contarOcorrencias(h, 'ev_a')).toBe(2);
    expect(h[0].primeiraIdade).toBe(5);
    expect(h[0].ultimaIdade).toBe(12);
    expect(h).toHaveLength(1);
  });

  it('o histórico guarda ID, nunca título', () => {
    const h = registrarOcorrencia([], 'fam_visita_avo', 20, 2046);
    const chaves = Object.keys(h[0]);
    expect(chaves).toContain('eventoId');
    expect(chaves).not.toContain('titulo');
    expect(JSON.stringify(h)).not.toMatch(/Tarde na Casa/);
  });

  it('anos desde a última ocorrência é calculado corretamente', () => {
    const h = registrarOcorrencia([], 'ev_a', 8, 2034);
    expect(anosDesdeUltimaOcorrencia(h, 'ev_a', 13)).toBe(5);
    expect(anosDesdeUltimaOcorrencia(h, 'ev_b', 13)).toBeNull();
  });
});

describe('B4-FIX.1 · compatibilidade de saves', () => {
  it('save antigo (lista de IDs) é convertido sem perda', () => {
    const h = migrarDeListaDeIds(['ev_a', 'ev_b', 'ev_a']);
    expect(h).toHaveLength(2);
    expect(jaAconteceu(h, 'ev_a')).toBe(true);
    expect(jaAconteceu(h, 'ev_b')).toBe(true);
  });

  it('save antigo não bloqueia conteúdo: cooldown já vencido', () => {
    const h = migrarDeListaDeIds(['ev_a']);
    const ev = evento({ id: 'ev_a', repeticao: { modo: 'cooldown', anosCooldown: 5 } });
    expect(podeRepetirAgora(ev, h, 3)).toBe(true);
  });

  it('save antigo preserva o bloqueio de eventos únicos', () => {
    const h = migrarDeListaDeIds(['ev_unico']);
    const ev = evento({ id: 'ev_unico', unico: true });
    expect(podeRepetirAgora(ev, h, 40)).toBe(false);
  });

  it('entrada corrompida é descartada sem quebrar', () => {
    expect(normalizarHistorico('lixo')).toEqual([]);
    expect(normalizarHistorico([null, 3, { semId: true }])).toEqual([]);

    const h = normalizarHistorico([
      { eventoId: 'ev_a', ocorrencias: 'muitas', ultimaIdade: null }
    ]);
    expect(h).toHaveLength(1);
    expect(h[0].ocorrencias).toBe(1);
  });

  it('o histórico sobrevive a um ciclo de serialização', () => {
    let h: EventHistory = [];
    h = registrarOcorrencia(h, 'ev_a', 4, 2030);
    h = registrarOcorrencia(h, 'ev_b', 9, 2035);

    const ciclo = normalizarHistorico(JSON.parse(JSON.stringify(h)));
    expect(ciclo).toEqual(h);
  });
});

describe('B4-FIX.1 · classificação de repetição', () => {
  it('as três classes existem e são derivadas do evento', () => {
    expect(classificarRepeticao(evento({ unico: true }))).toBe('unico');
    expect(classificarRepeticao(evento({ repeticao: { modo: 'recorrente' } }))).toBe('recorrente');
    expect(classificarRepeticao(evento())).toBe('cooldown');
  });

  it('o padrão mudou: evento sem declaração agora tem cooldown', () => {
    // Era justamente isto que faltava no B4-FIX: sem declaração, repetia
    // livremente todo ano.
    const ev = evento();
    expect(cooldownDoEvento(ev)).toBe(COOLDOWN_PADRAO_ANOS);
  });

  it('único nunca repete, mesmo décadas depois', () => {
    const ev = evento({ unico: true });
    const h = registrarOcorrencia([], ev.id, 5, 2031);
    expect(podeRepetirAgora(ev, h, 80)).toBe(false);
  });

  it('recorrente pode repetir no ano seguinte', () => {
    const ev = evento({ repeticao: { modo: 'recorrente' } });
    const h = registrarOcorrencia([], ev.id, 20, 2046);
    expect(podeRepetirAgora(ev, h, 21)).toBe(true);
  });

  it('cooldown bloqueia dentro do intervalo e libera depois', () => {
    const ev = evento({ repeticao: { modo: 'cooldown', anosCooldown: 5 } });
    const h = registrarOcorrencia([], ev.id, 10, 2036);

    expect(podeRepetirAgora(ev, h, 11)).toBe(false);
    expect(podeRepetirAgora(ev, h, 14)).toBe(false);
    expect(podeRepetirAgora(ev, h, 15)).toBe(true);
  });

  it('evento inédito sempre pode acontecer', () => {
    expect(podeRepetirAgora(evento(), [], 7)).toBe(true);
  });
});

describe('B4-FIX.1 · peso decrescente por repetição', () => {
  it('evento inédito mantém o peso declarado', () => {
    const ev = evento({ peso: 80 });
    expect(pesoEfetivo(ev, [])).toBe(80);
  });

  it('cada ocorrência reduz a probabilidade do evento', () => {
    const ev = evento({ peso: 80 });
    const uma = registrarOcorrencia([], ev.id, 5, 2031);
    const duas = registrarOcorrencia(uma, ev.id, 12, 2038);

    expect(pesoEfetivo(ev, uma)).toBeLessThan(80);
    expect(pesoEfetivo(ev, duas)).toBeLessThan(pesoEfetivo(ev, uma));
  });

  it('o peso nunca zera: o evento continua possível', () => {
    const ev = evento({ peso: 80 });
    let h: EventHistory = [];
    for (let i = 0; i < 20; i++) h = registrarOcorrencia(h, ev.id, i, 2026 + i);

    expect(pesoEfetivo(ev, h)).toBeGreaterThan(0);
  });
});

describe('B4-FIX.1 · sorteio ponderado', () => {
  it('pool vazio devolve nulo em vez de quebrar', () => {
    expect(sortearPonderado([], [], () => 0.5)).toBeNull();
  });

  it('pool com um único evento não entra em laço', () => {
    const ev = evento();
    expect(sortearPonderado([ev], [], () => 0.999)).toBe(ev);
  });

  it('o sorteio respeita o peso', () => {
    const pesado = evento({ id: 'pesado', peso: 90 });
    const leve = evento({ id: 'leve', peso: 10 });

    expect(sortearPonderado([pesado, leve], [], () => 0.1)?.id).toBe('pesado');
    expect(sortearPonderado([pesado, leve], [], () => 0.95)?.id).toBe('leve');
  });

  it('um evento já visto perde espaço para um inédito', () => {
    const visto = evento({ id: 'visto', peso: 50 });
    const novo = evento({ id: 'novo', peso: 50 });
    const h = registrarOcorrencia([], 'visto', 5, 2031);

    // Com pesos iguais o corte seria 0.5; com o histórico, o inédito domina.
    expect(sortearPonderado([visto, novo], h, () => 0.5)?.id).toBe('novo');
  });
});

describe('B4-FIX.1 · integridade do catálogo de eventos', () => {
  it('todos os IDs de evento são únicos', () => {
    const ids = MASTER_EVENTS_LIST.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo evento tem opções com texto real', () => {
    for (const ev of MASTER_EVENTS_LIST) {
      expect(ev.opcoes.length).toBeGreaterThanOrEqual(1);
      for (const opcao of ev.opcoes) {
        expect(opcao.texto.length).toBeGreaterThan(4);
      }
    }
  });

  it('todo evento elegível até os 17 anos oferece decisão real', () => {
    // Escopo deliberado. A auditoria do B4-FIX.1 encontrou 5 eventos com uma
    // única opção — ou seja, avisos, não decisões. Um deles
    // (ext_macarronada_domingo) caía no pool infantil, que era minúsculo, e
    // foi corrigido aqui. Os outros quatro são adultos
    // (rnd_sorteio_shopping, car_exame_ordem_conselho, ext_banca_tcc,
    // ext_festa_surpresa) e estão fora do escopo deste PR: ficam registrados
    // como pendência em vez de refatorados por métrica.
    const infantojuvenis = MASTER_EVENTS_LIST.filter(e => e.idadeMinima <= 17);
    for (const ev of infantojuvenis) {
      expect(ev.opcoes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('IDs de opção são únicos dentro do evento', () => {
    for (const ev of MASTER_EVENTS_LIST) {
      const ids = ev.opcoes.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('faixas etárias são coerentes', () => {
    for (const ev of MASTER_EVENTS_LIST) {
      expect(ev.idadeMinima).toBeLessThanOrEqual(ev.idadeMaxima);
      expect(ev.idadeMinima).toBeGreaterThanOrEqual(0);
      expect(ev.peso).toBeGreaterThan(0);
    }
  });
});
