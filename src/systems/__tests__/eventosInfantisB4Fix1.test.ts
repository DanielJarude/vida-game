import { describe, expect, it } from 'vitest';
import { GameEvent } from '../../types';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';

/**
 * Auditoria dos eventos da primeira infância.
 *
 * O playtest reportou uma criança pequena "respondendo mensagens no
 * celular" na casa dos avós. A causa era um evento com faixa 5–45 e opções
 * escritas para um adulto. Estes testes impedem que volte a acontecer com
 * qualquer evento novo.
 */

function elegiveisEm(idade: number): GameEvent[] {
  return MASTER_EVENTS_LIST.filter(
    e => idade >= e.idadeMinima && idade <= e.idadeMaxima
  );
}

/** Texto completo de um evento: descrição + todas as opções e resultados. */
function textoDe(evento: GameEvent): string {
  const partes = [evento.titulo, evento.descricao];
  for (const o of evento.opcoes) {
    partes.push(o.texto, o.descricaoResultado ?? '');
  }
  return partes.join(' ').toLowerCase();
}

describe('B4-FIX.1 · cobertura da primeira infância', () => {
  it('nenhuma idade de 0 a 5 fica sem eventos possíveis', () => {
    // Era o caso das idades 0 e 3, que tinham pool vazio.
    for (let idade = 0; idade <= 5; idade++) {
      expect(elegiveisEm(idade).length).toBeGreaterThan(0);
    }
  });

  it('cada idade de 0 a 5 tem variedade mínima', () => {
    for (let idade = 0; idade <= 5; idade++) {
      expect(elegiveisEm(idade).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('a segunda infância tem pool substancialmente maior', () => {
    for (let idade = 6; idade <= 11; idade++) {
      expect(elegiveisEm(idade).length).toBeGreaterThanOrEqual(10);
    }
  });

  it('nenhum evento isolado domina o pool de uma idade infantil', () => {
    // Aos 5 anos, "Tarde na Casa dos Avós" tinha 25,8% de chance por ano.
    for (let idade = 0; idade <= 11; idade++) {
      const pool = elegiveisEm(idade);
      const total = pool.reduce((s, e) => s + e.peso, 0);
      for (const ev of pool) {
        expect(ev.peso / total).toBeLessThan(0.3);
      }
    }
  });
});

describe('B4-FIX.1 · adequação dos eventos de 0 a 5 anos', () => {
  const eventos = MASTER_EVENTS_LIST.filter(e => e.idadeMinima <= 5);

  it('nenhum evento infantil menciona tecnologia de adulto', () => {
    for (const ev of eventos) {
      expect(textoDe(ev)).not.toMatch(
        /celular|smartphone|whatsapp|internet|e-mail|rede social|notebook/
      );
    }
  });

  it('nenhum evento infantil pressupõe dinheiro próprio ou trabalho', () => {
    for (const ev of eventos) {
      expect(textoDe(ev)).not.toMatch(
        /salário|emprego|currículo|financiamento|investir|cartão de crédito|boleto/
      );
    }
  });

  it('nenhum evento infantil pressupõe autonomia adulta', () => {
    for (const ev of eventos) {
      expect(textoDe(ev)).not.toMatch(
        /dirigir|faculdade|vestibular|bebida alcoólica|balada|aluguel/
      );
    }
  });

  it('nenhum evento de 0 a 5 exige requisito de atributo ou dinheiro', () => {
    // Uma criança pequena não deve encontrar opção bloqueada por dinheiro.
    for (const ev of eventos.filter(e => e.idadeMaxima <= 5)) {
      for (const opcao of ev.opcoes) {
        expect(opcao.requisito?.dinheiroMinimo).toBeUndefined();
      }
    }
  });

  it('o evento dos avós tem versão infantil sem celular', () => {
    const infantil = MASTER_EVENTS_LIST.find(e => e.id === 'fam_visita_avo_infancia');
    expect(infantil).toBeDefined();
    expect(infantil!.idadeMaxima).toBeLessThanOrEqual(11);
    expect(textoDe(infantil!)).not.toMatch(/celular/);
    expect(infantil!.opcoes.length).toBeGreaterThanOrEqual(3);
  });

  it('a versão adulta dos avós não alcança mais a infância', () => {
    const adulto = MASTER_EVENTS_LIST.find(e => e.id === 'fam_visita_avo');
    expect(adulto).toBeDefined();
    expect(adulto!.idadeMinima).toBeGreaterThanOrEqual(12);
  });
});

describe('B4-FIX.1 · função narrativa dos eventos infantis', () => {
  const novos = MASTER_EVENTS_LIST.filter(
    e => e.id.startsWith('pi_') || e.id.startsWith('inf2_')
  );

  it('os novos eventos existem', () => {
    expect(novos.length).toBeGreaterThanOrEqual(15);
  });

  it('toda opção nova tem resultado narrado, nunca só um número', () => {
    for (const ev of novos) {
      for (const o of ev.opcoes) {
        expect(o.descricaoResultado).toBeDefined();
        expect(o.descricaoResultado!.length).toBeGreaterThan(40);
      }
    }
  });

  it('toda opção nova produz alguma consequência', () => {
    for (const ev of novos) {
      for (const o of ev.opcoes) {
        const c = o.consequencias;
        const temEfeito =
          c.stats !== undefined ||
          c.hiddenStats !== undefined ||
          c.impactosComportamentais !== undefined ||
          c.relacionamentoDelta !== undefined;
        expect(temEfeito).toBe(true);
      }
    }
  });

  it('impactos comportamentais são pequenos: uma escolha não cria um traço', () => {
    for (const ev of novos) {
      for (const o of ev.opcoes) {
        for (const valor of Object.values(o.consequencias.impactosComportamentais ?? {})) {
          expect(Math.abs(valor as number)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('os novos eventos não concentram tudo num único eixo', () => {
    const eixos = new Set<string>();
    for (const ev of novos) {
      for (const o of ev.opcoes) {
        for (const eixo of Object.keys(o.consequencias.impactosComportamentais ?? {})) {
          eixos.add(eixo);
        }
      }
    }
    expect(eixos.size).toBeGreaterThanOrEqual(6);
  });

  it('cada novo evento oferece ao menos duas saídas distintas', () => {
    for (const ev of novos) {
      expect(ev.opcoes.length).toBeGreaterThanOrEqual(2);
      const textos = ev.opcoes.map(o => o.texto);
      expect(new Set(textos).size).toBe(textos.length);
    }
  });
});
