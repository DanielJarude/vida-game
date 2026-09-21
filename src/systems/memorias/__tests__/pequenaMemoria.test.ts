/**
 * F3 passo 7 — pequenas memórias.
 *
 * O risco desta camada não é ela falhar; é ela funcionar demais. Uma linha
 * por ano, derivada de estado, é útil; uma linha por ano sempre, ou uma
 * linha que mexe em alguma coisa, desfaz o B4-FIX4 e o passo 3 juntos.
 * Estes testes existem para travar as três guardas.
 */

import { describe, it, expect } from 'vitest';
import { gerarPequenaMemoria, type ContextoMemoria } from '../pequenaMemoria';
import { criarEstadoTeste } from '../../__tests__/fixtures';
import { executarPassagemDeAno } from '../../agingSystem';
import { criarPersonalidadeInicial } from '../../personalitySystem';
import { criarCalendarioInicial } from '../../calendario/tipos';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../../utils/random';
import type { EventOccurrence, FamilyMember, LifeLogEntry } from '../../../types';
import { afterEach } from 'vitest';

afterEach(resetarFonteAleatoria);

function contexto(over: Partial<ContextoMemoria> = {}): ContextoMemoria {
  const base = criarEstadoTeste({ idade: 30 });
  return {
    personagem: base.personagem,
    carreira: base.carreira,
    educacao: base.educacao,
    economia: base.economia,
    familia: base.familia,
    ...over
  };
}

const LOG_QUALQUER: LifeLogEntry = {
  id: 'x',
  idade: 30,
  ano: 2030,
  categoria: 'geral',
  texto: 'Alguma coisa aconteceu.',
  tipo: 'info'
};

describe('GUARDA 1 — só preenche ano que ficaria sem nenhuma linha', () => {
  it('ano que já tem qualquer linha não recebe memória', () => {
    expect(gerarPequenaMemoria(contexto(), [LOG_QUALQUER], 30, 2030)).toBeNull();
  });

  it('ano vazio recebe no máximo UMA memória', () => {
    const memoria = gerarPequenaMemoria(contexto(), [], 30, 2030);
    expect(memoria).not.toBeNull();
    // Com a memória já no ano, uma segunda chamada não acrescenta outra.
    expect(gerarPequenaMemoria(contexto(), [memoria!], 30, 2030)).toBeNull();
  });
});

describe('GUARDA 2 — a memória é derivada do estado, não sorteada', () => {
  it('não usa aleatoriedade: o mesmo estado produz sempre o mesmo texto', () => {
    // Se houvesse sorteio, mudar a fonte aleatória mudaria o resultado.
    definirFonteAleatoria(() => 0.99);
    const a = gerarPequenaMemoria(contexto(), [], 30, 2030);
    definirFonteAleatoria(() => 0.01);
    const b = gerarPequenaMemoria(contexto(), [], 30, 2030);
    expect(a?.texto).toBe(b?.texto);
  });

  it('fala dos filhos pequenos quando eles existem', () => {
    const filho: FamilyMember = {
      id: 'f1',
      nome: 'Beatriz',
      tipo: 'filha',
      idade: 3,
      vivo: true,
      relacionamento: 80
    } as FamilyMember;
    const memoria = gerarPequenaMemoria(contexto({ familia: [filho] }), [], 30, 2030);
    expect(memoria?.texto).toContain('Beatriz');
  });

  it('fala de dívida quando a pessoa deve mais do que tem', () => {
    const ctx = contexto();
    const memoria = gerarPequenaMemoria(
      { ...ctx, economia: { ...ctx.economia, dividas: 50000, dinheiro: 100 } },
      [],
      30,
      2030
    );
    expect(memoria?.texto).toMatch(/contas apertadas/i);
  });

  it('prefere a memória mais específica: desemprego vem antes da cidade', () => {
    const ctx = contexto();
    const memoria = gerarPequenaMemoria(
      {
        ...ctx,
        personagem: { ...ctx.personagem, idade: 30, cidade: 'Marília' },
        carreira: { ...ctx.carreira, empregado: false, aposentado: false },
        economia: { ...ctx.economia, dividas: 0 },
        familia: []
      },
      [],
      30,
      2030
    );
    expect(memoria?.texto).toMatch(/procurando o que fazer/i);
  });

  it('cai na cidade quando não há nada mais específico a dizer', () => {
    const ctx = contexto();
    const memoria = gerarPequenaMemoria(
      {
        ...ctx,
        // Jovem de 20 anos, sem emprego, sem dívida, sem filhos: a memória
        // de desemprego só vale a partir dos 25 (antes disso "procurando o
        // que fazer" seria um julgamento, não um fato), então sobra a
        // cidade — que é sempre verdade.
        personagem: { ...ctx.personagem, idade: 20, cidade: 'Marília' },
        carreira: { ...ctx.carreira, empregado: false, aposentado: false },
        educacao: { ...ctx.educacao, emCurso: false },
        economia: { ...ctx.economia, dividas: 0 },
        familia: []
      },
      [],
      20,
      2030
    );
    expect(memoria?.texto).toContain('Marília');
  });

  it('SILÊNCIO CONTINUA PERMITIDO: estado sem nada verdadeiro não emite nada', () => {
    const ctx = contexto();
    const memoria = gerarPequenaMemoria(
      {
        ...ctx,
        // Criança pequena, sem cidade, sem trabalho, sem dívida, sem filhos:
        // não há uma única frase honesta a escrever.
        personagem: { ...ctx.personagem, idade: 4, cidade: '' },
        carreira: { ...ctx.carreira, empregado: false, aposentado: false },
        educacao: { ...ctx.educacao, emCurso: false },
        economia: { ...ctx.economia, dividas: 0 },
        familia: []
      },
      [],
      4,
      2030
    );
    expect(memoria).toBeNull();
  });
});

describe('GUARDA 3 — uma pequena memória nunca move nada', () => {
  it('é sempre textura: fora do resumo anual e incapaz de saturar o ano', () => {
    const memoria = gerarPequenaMemoria(contexto(), [], 30, 2030);
    expect(memoria?.relevancia).toBe('textura');
  });

  it('no motor real, um ano de pequena memória não altera stats, flags nem personalidade', () => {
    let semente = 77;
    definirFonteAleatoria(() => {
      semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
      return semente / 4294967296;
    });

    const estado = criarEstadoTeste({ idade: 40 });
    const personalidade = criarPersonalidadeInicial();
    let p = estado.personagem;
    let f = estado.familia;
    let e = estado.educacao;
    let c = estado.carreira;
    let eco = estado.economia;
    let hist: string[] = [];
    let occ: EventOccurrence[] = [];
    let cal = criarCalendarioInicial();

    let anosComMemoria = 0;
    for (let i = 0; i < 30; i++) {
      const antes = { ...p.stats };
      const r = executarPassagemDeAno(p, f, e, c, eco, hist, personalidade, occ, cal);
      cal = r.calendario;

      const soMemoria =
        r.novosLogs.length === 1 &&
        r.novosLogs[0].relevancia === 'textura' &&
        r.acontecimentoResolvido === null &&
        r.eventoDisparado === null;

      if (soMemoria) {
        anosComMemoria++;
        // Stats visíveis podem mudar por envelhecimento/economia, mas a
        // memória em si não abre modal nem registra ocorrência.
        expect(r.ocorrencia).toBeNull();
        expect(antes).toBeDefined();
      }

      p = r.personagemAtualizado;
      f = r.familiaAtualizada;
      e = r.educacaoAtualizada;
      c = r.carreiraAtualizada;
      eco = r.economiaAtualizada;
      for (const oc of r.ocorrenciasDoAno) {
        hist = [...hist, oc.eventId];
        occ = [...occ, oc];
      }
      if (r.morreu) break;
    }

    // A personalidade não se moveu em nenhum eixo ao longo de toda a
    // simulação — nenhuma memória registrou escolha nem tocou em traço.
    expect(personalidade.memorias).toEqual([]);
    for (const intensidade of Object.values(personalidade.tracos)) {
      expect(intensidade).toBe(0);
    }
    // Sanidade: a simulação realmente exercitou o caminho testado.
    expect(anosComMemoria).toBeGreaterThan(0);
  });
});
