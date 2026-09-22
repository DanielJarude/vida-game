/**
 * F4 — CONTEXTO DO MUNDO.
 *
 * Dois contratos, e eles são diferentes:
 *
 *   1. os selectors respondem corretamente sobre o estado (ausente, presente,
 *      e a TRANSIÇÃO entre os dois — é a transição que pega flag persistida
 *      indevidamente, porque flag não acompanha remoção);
 *   2. a elegibilidade de eventos CONSOME esses selectors, e o faz por
 *      TAXONOMIA DE CONDIÇÃO, nunca por id de evento.
 *
 * O contrato 2 é testado com o pet como canário (o caso do playtest) E com um
 * evento sintético que não existe no catálogo — se a regra dependesse do id
 * `fam_pet_veterinario`, o sintético passaria e o teste falharia.
 */

import { describe, it, expect } from 'vitest';
import {
  contextoDaVida,
  estaEmpregado,
  estaEstudando,
  quantidadeFilhos,
  temAmigo,
  temConjuge,
  temDivida,
  temFilho,
  temImovel,
  temIrmao,
  temParceiro,
  temPet,
  temVeiculo,
  cidadeAtual,
  estadoAtual,
  type FatiasDoMundo
} from '../contextoDaVida';
import { avaliarCondicoesEvento } from '../../events/eligibility';
import { criarEstadoTeste } from '../../__tests__/fixtures';
import type { FamilyMember, GameEvent, Property, RelationType } from '../../../types';

/* ----------------------------------------------------------------- apoio */

function mundo(over: Partial<FatiasDoMundo> = {}): FatiasDoMundo {
  const base = criarEstadoTeste({ idade: 30 });
  return {
    personagem: base.personagem,
    familia: base.familia,
    carreira: base.carreira,
    educacao: base.educacao,
    economia: base.economia,
    ...over
  };
}

function membro(tipo: RelationType, vivo = true): FamilyMember {
  return {
    id: `m_${tipo}_${Math.random().toString(36).slice(2, 7)}`,
    nome: 'Alguém',
    sobrenome: 'Silva',
    genero: 'feminino',
    tipo,
    idade: 30,
    relacionamento: 70,
    vivo
  } as FamilyMember;
}

function bem(tipo: 'imovel' | 'veiculo'): Property {
  return {
    id: `b_${tipo}`,
    tipo,
    nome: tipo === 'imovel' ? 'Apartamento' : 'Carro',
    valorCompra: 100000,
    valorAtual: 100000,
    custoAnualManutencao: 1000,
    anoCompra: 2026,
    quitado: true
  };
}

/** Só a família muda; o resto do mundo vem do fixture. */
function comFamilia(...membros: FamilyMember[]): FatiasDoMundo {
  return mundo({ familia: membros });
}

/* ================================================================= 1. PET */

describe('F4 · pet — o caso canônico do playtest', () => {
  it('NEGATIVO: sem pet na família, temPet é falso', () => {
    expect(temPet(comFamilia(membro('pai'), membro('mae')))).toBe(false);
  });

  it('POSITIVO: com pet vivo, temPet é verdadeiro', () => {
    expect(temPet(comFamilia(membro('pai'), membro('pet')))).toBe(true);
  });

  it('TRANSIÇÃO: o pet morre e temPet volta a ser falso', () => {
    const vivo = comFamilia(membro('pet', true));
    expect(temPet(vivo)).toBe(true);

    const morto = comFamilia(membro('pet', false));
    expect(temPet(morto)).toBe(false);
  });

  it('TRANSIÇÃO: pet adicionado a uma vida que não tinha', () => {
    const antes = comFamilia(membro('mae'));
    expect(temPet(antes)).toBe(false);
    const depois = comFamilia(membro('mae'), membro('pet'));
    expect(temPet(depois)).toBe(true);
  });
});

/* ======================================================== 2. VÍNCULOS */

describe('F4 · vínculos familiares e sociais', () => {
  it('parceiro: ausente / presente / morto', () => {
    expect(temParceiro(comFamilia(membro('pai')))).toBe(false);
    expect(temParceiro(comFamilia(membro('namorada')))).toBe(true);
    expect(temParceiro(comFamilia(membro('esposa', false)))).toBe(false);
  });

  it('cônjuge é mais estrito que parceiro: namoro não é casamento', () => {
    const namorando = comFamilia(membro('namorado'));
    expect(temParceiro(namorando)).toBe(true);
    expect(temConjuge(namorando)).toBe(false);

    const casado = comFamilia(membro('esposo'));
    expect(temParceiro(casado)).toBe(true);
    expect(temConjuge(casado)).toBe(true);
  });

  it('filhos: presença e contagem, ignorando os que morreram', () => {
    expect(temFilho(comFamilia(membro('pai')))).toBe(false);
    const dois = comFamilia(membro('filho'), membro('filha'), membro('filho', false));
    expect(temFilho(dois)).toBe(true);
    expect(quantidadeFilhos(dois)).toBe(2);
  });

  it('irmãos: ausente e presente', () => {
    expect(temIrmao(comFamilia(membro('pai'), membro('mae')))).toBe(false);
    expect(temIrmao(comFamilia(membro('irma')))).toBe(true);
  });

  it('amigos: ausente e presente', () => {
    expect(temAmigo(comFamilia(membro('pai')))).toBe(false);
    expect(temAmigo(comFamilia(membro('amigo')))).toBe(true);
  });

  it('um pet não conta como parceiro, filho, irmão nem amigo', () => {
    const soPet = comFamilia(membro('pet'));
    expect(temPet(soPet)).toBe(true);
    expect(temParceiro(soPet)).toBe(false);
    expect(temFilho(soPet)).toBe(false);
    expect(temIrmao(soPet)).toBe(false);
    expect(temAmigo(soPet)).toBe(false);
  });
});

/* ====================================================== 3. PATRIMÔNIO */

describe('F4 · patrimônio', () => {
  it('imóvel e veículo: ausentes, presentes, e não se confundem', () => {
    const base = criarEstadoTeste({ idade: 40 });
    const nada = mundo({ economia: { ...base.economia, propriedades: [] } });
    expect(temImovel(nada)).toBe(false);
    expect(temVeiculo(nada)).toBe(false);

    const soCarro = mundo({ economia: { ...base.economia, propriedades: [bem('veiculo')] } });
    expect(temVeiculo(soCarro)).toBe(true);
    expect(temImovel(soCarro)).toBe(false);

    const soCasa = mundo({ economia: { ...base.economia, propriedades: [bem('imovel')] } });
    expect(temImovel(soCasa)).toBe(true);
    expect(temVeiculo(soCasa)).toBe(false);
  });

  it('dívida: zero é ausência; qualquer valor positivo é presença', () => {
    const base = criarEstadoTeste({ idade: 40 });
    expect(temDivida(mundo({ economia: { ...base.economia, dividas: 0 } }))).toBe(false);
    expect(temDivida(mundo({ economia: { ...base.economia, dividas: 1 } }))).toBe(true);
  });
});

/* ======================================================== 4. OCUPAÇÃO */

describe('F4 · ocupação e lugar', () => {
  it('emprego e estudo refletem o estado real', () => {
    const base = criarEstadoTeste({ idade: 30 });
    expect(estaEmpregado(mundo({ carreira: { ...base.carreira, empregado: false } }))).toBe(false);
    expect(estaEmpregado(mundo({ carreira: { ...base.carreira, empregado: true } }))).toBe(true);
    expect(estaEstudando(mundo({ educacao: { ...base.educacao, emCurso: false } }))).toBe(false);
    expect(estaEstudando(mundo({ educacao: { ...base.educacao, emCurso: true } }))).toBe(true);
  });

  it('cidade e estado vêm do personagem, sem inventar valor', () => {
    const m = mundo();
    expect(cidadeAtual(m)).toBe(m.personagem.cidade);
    expect(estadoAtual(m)).toBe(m.personagem.estado);
  });
});

/* ================================================= 5. RETRATO COMPLETO */

describe('F4 · contextoDaVida (retrato agregado)', () => {
  it('concorda com os selectors individuais', () => {
    const m = comFamilia(membro('pet'), membro('esposa'), membro('filho'));
    const ctx = contextoDaVida(m);
    expect(ctx.temPet).toBe(temPet(m));
    expect(ctx.temConjuge).toBe(temConjuge(m));
    expect(ctx.quantidadeFilhos).toBe(quantidadeFilhos(m));
    expect(ctx.temAmigo).toBe(temAmigo(m));
  });

  it('é derivado: nada é persistido, então dois retratos do mesmo estado são iguais', () => {
    const m = comFamilia(membro('pet'));
    expect(contextoDaVida(m)).toEqual(contextoDaVida(m));
  });
});

/* ============================================ 6. INTEGRAÇÃO COM EVENTOS */

/** Avalia um evento contra um mundo, com histórico limpo. */
function elegivel(evento: GameEvent, m: FatiasDoMundo): boolean {
  return avaliarCondicoesEvento(
    evento,
    m.personagem,
    m.carreira,
    m.educacao,
    m.economia,
    [...m.familia],
    [],
    undefined,
    []
  );
}

function eventoSintetico(condicoes: GameEvent['condicoes']): GameEvent {
  return {
    id: 'syn_contexto_teste',
    titulo: 'Evento sintético de contexto',
    descricao: 'Existe só no teste, para provar que a regra não olha id.',
    idadeMinima: 0,
    idadeMaxima: 120,
    categoria: 'cotidiano',
    peso: 50,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes,
    opcoes: [{ id: 'op', texto: '', descricaoResultado: 'Aconteceu.', consequencias: {} }]
  };
}

describe('F4 · o motor recusa evento cujo pressuposto não existe', () => {
  it('CANÁRIO: evento que exige pet é inelegível sem pet e elegível com pet', () => {
    const evento = eventoSintetico({ temPet: true });

    expect(elegivel(evento, comFamilia(membro('mae')))).toBe(false);
    expect(elegivel(evento, comFamilia(membro('mae'), membro('pet')))).toBe(true);
    // E volta a ser inelegível quando o pet morre.
    expect(elegivel(evento, comFamilia(membro('mae'), membro('pet', false)))).toBe(false);
  });

  it('a regra é genérica: vale para um SEGUNDO evento sintético, de outro id', () => {
    // Se a elegibilidade dependesse do id do evento do veterinário, este
    // outro id passaria livremente. Ele não passa.
    const outro = eventoSintetico({ temPet: true });
    (outro as { id: string }).id = 'syn_outro_evento_com_pet';
    expect(elegivel(outro, comFamilia(membro('pai')))).toBe(false);
    expect(elegivel(outro, comFamilia(membro('pai'), membro('pet')))).toBe(true);
  });

  it('cada predicado novo filtra de forma independente', () => {
    const base = criarEstadoTeste({ idade: 40 });
    const casos: { cond: GameEvent['condicoes']; sem: FatiasDoMundo; com: FatiasDoMundo }[] = [
      {
        cond: { temImovel: true },
        sem: mundo({ economia: { ...base.economia, propriedades: [] } }),
        com: mundo({ economia: { ...base.economia, propriedades: [bem('imovel')] } })
      },
      {
        cond: { temVeiculo: true },
        sem: mundo({ economia: { ...base.economia, propriedades: [] } }),
        com: mundo({ economia: { ...base.economia, propriedades: [bem('veiculo')] } })
      },
      {
        cond: { temAmigos: true },
        sem: comFamilia(membro('mae')),
        com: comFamilia(membro('amiga'))
      },
      {
        cond: { temIrmaos: true },
        sem: comFamilia(membro('mae')),
        com: comFamilia(membro('irmao'))
      },
      {
        cond: { temConjuge: true },
        sem: comFamilia(membro('namorado')),
        com: comFamilia(membro('esposo'))
      },
      {
        cond: { temDivida: true },
        sem: mundo({ economia: { ...base.economia, dividas: 0 } }),
        com: mundo({ economia: { ...base.economia, dividas: 5000 } })
      }
    ];

    for (const c of casos) {
      const ev = eventoSintetico(c.cond);
      expect(elegivel(ev, c.sem), `sem: ${JSON.stringify(c.cond)}`).toBe(false);
      expect(elegivel(ev, c.com), `com: ${JSON.stringify(c.cond)}`).toBe(true);
    }
  });

  it('a condição negativa também funciona (exigir AUSÊNCIA de algo)', () => {
    const semPet = eventoSintetico({ temPet: false });
    expect(elegivel(semPet, comFamilia(membro('pet')))).toBe(false);
    expect(elegivel(semPet, comFamilia(membro('mae')))).toBe(true);
  });

  it('evento sem condição de contexto continua elegível para qualquer mundo', () => {
    // Garante que a F4 não passou a exigir contexto por padrão: o silêncio
    // de um evento sobre o mundo continua significando "não me importo".
    const livre = eventoSintetico(undefined);
    expect(elegivel(livre, comFamilia(membro('mae')))).toBe(true);
    expect(elegivel(livre, comFamilia(membro('pet'), membro('esposo')))).toBe(true);
  });
});
