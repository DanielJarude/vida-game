/**
 * F6 — TESTES PERMANENTES DA VIDA SOCIAL (§26 do escopo).
 *
 * O contrato central da fase, e o que cada teste protege:
 *
 *   você não procura NPCs — você conhece pessoas porque vive.
 *
 * Portanto: toda relação tem origem real, amizade é conquistada (nunca nasce
 * pronta), exposição social não garante amigo, e uma vida isolada continua
 * sendo um resultado legítimo.
 */

import { describe, it, expect } from 'vitest';
import {
  criarConhecido,
  processarAnoSocial,
  LIMIAR_AMIZADE,
  PROXIMIDADE_INICIAL_MAX,
  ANOS_ATE_AFASTAMENTO
} from '../redeSocial';
import {
  ambientesDeConvivio,
  aberturaSocial,
  perfilDoAmbiente,
  vinculosSociaisAtivos,
  ATIVIDADES_SOCIAIS,
  ABERTURA_MINIMA,
  type FatiasSociais
} from '../contextoSocial';
import { classificarProximidade } from '../../../presentation/relationshipPresentation';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../__tests__/fixtures';
import { criarCarreiraInicial } from '../../careerSystem';
import { criarEducacaoInicial } from '../../educationSystem';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../../utils/random';
import type { FamilyMember } from '../../../types';

function fatias(over: Partial<FatiasSociais> = {}): FatiasSociais {
  return {
    personagem: criarPersonagemTeste({ idade: 9 }),
    educacao: criarEducacaoInicial(),
    carreira: criarCarreiraInicial(),
    familia: criarFamiliaTeste(),
    atividadesDoAno: [],
    ...over
  };
}

const naEscola = () => ({ ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' as const });
const naFaculdade = () => ({ ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'superior' as const });
const empregado = () => ({ ...criarCarreiraInicial(), empregado: true });

/** Roda N anos de convívio no mesmo contexto e devolve a rede final. */
function viverAnos(
  inicio: number,
  fim: number,
  monta: (idade: number) => Partial<FatiasSociais>,
  familiaInicial: FamilyMember[] = [...criarFamiliaTeste()]
): FamilyMember[] {
  let familia = familiaInicial;
  for (let idade = inicio; idade <= fim; idade++) {
    const r = processarAnoSocial(
      fatias({ personagem: criarPersonagemTeste({ idade }), familia, ...monta(idade) }),
      2000 + idade
    );
    familia = r.familiaAtualizada;
  }
  return familia;
}

const amigosDe = (f: FamilyMember[]) =>
  f.filter(m => (m.tipo === 'amigo' || m.tipo === 'amiga') && m.ativo !== false);

/* ========================================================================== */
describe('F6 · NPC coerente com o contexto (§12, §13, §14)', () => {
  it('1. colega de escola de uma criança tem idade de criança', () => {
    for (let i = 0; i < 40; i++) {
      const p = criarConhecido('escola', 8, 'Souza');
      expect(p.idade).toBeGreaterThanOrEqual(3);
      expect(p.idade).toBeLessThanOrEqual(9);
    }
  });

  it('2. criança/adolescente NUNCA recebe profissão adulta', () => {
    for (const idade of [7, 10, 14, 17]) {
      for (let i = 0; i < 20; i++) {
        const p = criarConhecido('escola', idade, 'Souza');
        // Colega de turma é estudante mesmo quando já fez 18 (3º ano do
        // Ensino Médio): o que define é o AMBIENTE, não a maioridade.
        expect(p.profissao).toBe('Estudante');
        expect(p.estudante).toBe(true);
      }
    }
  });

  it('o colega de 8 anos não é "Roberto, 42 anos, advogado"', () => {
    // O caso literal do escopo §12.
    for (let i = 0; i < 50; i++) {
      const p = criarConhecido('escola', 8, 'Souza');
      const adultoComCarreira = p.idade >= 18 && p.profissao !== 'Estudante';
      expect(adultoComCarreira).toBe(false);
    }
  });

  it('5. todo NPC persistente tem nome de verdade (sem placeholder)', () => {
    for (const amb of ['escola', 'trabalho', 'vizinhanca', 'faculdade'] as const) {
      for (let i = 0; i < 20; i++) {
        const p = criarConhecido(amb, 25, 'Souza');
        expect(p.nome.length).toBeGreaterThan(1);
        expect(p.nome).not.toMatch(/novo familiar|colega|pessoa|vizinho/i);
      }
    }
  });

  it('4. todo NPC social criado carrega ORIGEM e data de entrada', () => {
    const p = criarConhecido('trabalho', 30, 'Souza');
    expect(p.origemSocial).toBe('trabalho');
    expect(p.idadeEntrada).toBe(30);
    expect(p.ultimoContatoIdade).toBe(30);
  });

  it('pessoa de fora da família não herda o sobrenome do jogador', () => {
    // Com 30 tentativas, coincidência sistemática seria sinal de bug.
    const sobrenomes = new Set<string>();
    for (let i = 0; i < 30; i++) sobrenomes.add(criarConhecido('escola', 10, 'Zimmermann').sobrenome);
    expect(sobrenomes.has('Zimmermann')).toBe(false);
  });
});

/* ========================================================================== */
describe('F6 · amizade não nasce pronta (§5)', () => {
  it('3. relação nova NUNCA entra como "Muito próxima"', () => {
    for (const amb of ['escola', 'trabalho', 'atividade', 'vizinhanca'] as const) {
      for (let i = 0; i < 30; i++) {
        const p = criarConhecido(amb, 20, 'Souza');
        // A régua é a da própria camada de apresentação, não um número solto.
        const rotulo = classificarProximidade(p.relacionamento);
        expect(rotulo).not.toBe('muito_proxima');
        expect(rotulo).not.toBe('proxima');
        expect(p.relacionamento).toBeLessThanOrEqual(PROXIMIDADE_INICIAL_MAX);
      }
    }
  });

  it('quem acabou de ser conhecido entra como COLEGA, não como amigo', () => {
    expect(criarConhecido('escola', 10, 'Souza').tipo).toBe('colega');
  });

  it('a promoção a amigo exige convívio continuado (não acontece no 1º ano)', () => {
    const familia = viverAnos(9, 9, () => ({ educacao: naEscola() }));
    expect(amigosDe(familia)).toHaveLength(0);
  });

  it('com anos de convívio, alguém pode virar amigo', () => {
    // Determinístico, mas NÃO constante: uma fonte fixa em 0.05 faz todo
    // `randomInt` devolver sempre o mínimo, e aí o ganho anual é o menor
    // possível para sempre — ninguém cruzaria o limiar, por construção do
    // teste e não do jogo. Um LCG dá uma sequência reproduzível e variada.
    let estado = 12345;
    definirFonteAleatoria(() => {
      estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
      return estado / 4294967296;
    });
    try {
      const familia = viverAnos(7, 16, () => ({ educacao: naEscola() }));
      expect(amigosDe(familia).length).toBeGreaterThan(0);
      for (const a of amigosDe(familia)) {
        expect(a.relacionamento).toBeGreaterThanOrEqual(LIMIAR_AMIZADE);
        expect(a.origemSocial).toBeTruthy();
      }
    } finally {
      resetarFonteAleatoria();
    }
  });
});

/* ========================================================================== */
describe('F6 · a origem vem da vida real (§2, §7, §8)', () => {
  it('7. escola em curso abre convívio escolar', () => {
    expect(ambientesDeConvivio(fatias({ educacao: naEscola() }))).toContain('escola');
  });

  it('faculdade é distinta de escola', () => {
    const amb = ambientesDeConvivio(
      fatias({ personagem: criarPersonagemTeste({ idade: 20 }), educacao: naFaculdade() })
    );
    expect(amb).toContain('faculdade');
    expect(amb).not.toContain('escola');
  });

  it('8. trabalho abre convívio de trabalho', () => {
    const amb = ambientesDeConvivio(
      fatias({ personagem: criarPersonagemTeste({ idade: 30 }), carreira: empregado() })
    );
    expect(amb).toContain('trabalho');
  });

  it('9. hobby social abre oportunidade; hobby solitário não', () => {
    const comHobby = ambientesDeConvivio(
      fatias({ personagem: criarPersonagemTeste({ idade: 30 }), atividadesDoAno: [ATIVIDADES_SOCIAIS[0]] })
    );
    expect(comHobby).toContain('atividade');

    const sozinho = ambientesDeConvivio(
      fatias({ personagem: criarPersonagemTeste({ idade: 30 }), atividadesDoAno: ['act_leitura'] })
    );
    expect(sozinho).not.toContain('atividade');
  });

  it('sem NENHUM ambiente, ninguém novo aparece — relação sem causa é impossível', () => {
    // Criança pequena, fora da escola, sem trabalho e sem atividade.
    const familia = viverAnos(3, 5, () => ({}));
    expect(vinculosSociaisAtivos(fatias({ familia }))).toHaveLength(0);
  });

  it('"amigo de amigo" só existe se já houver amigo', () => {
    const semAmigo = ambientesDeConvivio(fatias({ personagem: criarPersonagemTeste({ idade: 30 }) }));
    expect(semAmigo).not.toContain('amigo_de_amigo');

    const amigo: FamilyMember = {
      ...criarConhecido('escola', 12, 'Souza'), tipo: 'amigo', relacionamento: 70
    };
    const comAmigo = ambientesDeConvivio(
      fatias({ personagem: criarPersonagemTeste({ idade: 30 }), familia: [...criarFamiliaTeste(), amigo] })
    );
    expect(comAmigo).toContain('amigo_de_amigo');
  });

  it('11. amizade SOBREVIVE à saída do contexto (não some ao mudar de escola)', () => {
    const amigo: FamilyMember = {
      ...criarConhecido('escola', 15, 'Souza'),
      tipo: 'amigo', relacionamento: 80, ultimoContatoIdade: 17
    };
    // Sai da escola: nenhum ambiente escolar nos anos seguintes.
    let familia: FamilyMember[] = [...criarFamiliaTeste(), amigo];
    for (let idade = 18; idade <= 21; idade++) {
      familia = processarAnoSocial(
        fatias({ personagem: criarPersonagemTeste({ idade }), familia }), 2000 + idade
      ).familiaAtualizada;
    }
    const ainda = familia.find(m => m.id === amigo.id)!;
    expect(ainda.tipo).toMatch(/amig/);
    expect(ainda.ativo).not.toBe(false);
  });

  it('12. o afastamento existe: anos sem contato esfriam a relação', () => {
    const amigo: FamilyMember = {
      ...criarConhecido('trabalho', 30, 'Souza'),
      tipo: 'amigo', relacionamento: 60, ultimoContatoIdade: 30
    };
    let familia: FamilyMember[] = [...criarFamiliaTeste(), amigo];
    const antes = amigo.relacionamento;
    for (let idade = 31; idade <= 31 + ANOS_ATE_AFASTAMENTO + 2; idade++) {
      familia = processarAnoSocial(
        fatias({ personagem: criarPersonagemTeste({ idade }), familia }), 2000 + idade
      ).familiaAtualizada;
    }
    expect(familia.find(m => m.id === amigo.id)!.relacionamento).toBeLessThan(antes);
  });
});

/* ========================================================================== */
describe('F6 · oportunidade não é garantia (§10, §11, §23)', () => {
  it('10. exposição social NÃO garante amizade', () => {
    // Com a fonte no extremo alto, nada é sorteado: o ano passa em branco.
    definirFonteAleatoria(() => 0.999);
    try {
      const familia = viverAnos(7, 17, () => ({ educacao: naEscola() }));
      expect(vinculosSociaisAtivos(fatias({ familia }))).toHaveLength(0);
    } finally {
      resetarFonteAleatoria();
    }
  });

  it('13. pessoa introvertida AINDA pode formar amizade', () => {
    const introvertida = { tracos: { sociabilidade: -5 } as never, memorias: [] };
    // A abertura reduz a chance, mas nunca zera.
    expect(aberturaSocial(fatias({ personalidade: introvertida }))).toBeGreaterThanOrEqual(ABERTURA_MINIMA);
    expect(aberturaSocial(fatias({ personalidade: introvertida }))).toBeGreaterThan(0);

    let estadoIntro = 999;
    definirFonteAleatoria(() => {
      estadoIntro = (Math.imul(estadoIntro, 1664525) + 1013904223) >>> 0;
      return estadoIntro / 4294967296;
    });
    try {
      const familia = viverAnos(7, 17, () => ({ educacao: naEscola(), personalidade: introvertida }));
      expect(amigosDe(familia).length).toBeGreaterThan(0);
    } finally {
      resetarFonteAleatoria();
    }
  });

  it('14. sociabilidade NÃO garante amigos (não é contador de NPCs)', () => {
    const sociavel = { tracos: { sociabilidade: 5 } as never, memorias: [] };
    definirFonteAleatoria(() => 0.999);
    try {
      const familia = viverAnos(7, 17, () => ({ educacao: naEscola(), personalidade: sociavel }));
      expect(amigosDe(familia)).toHaveLength(0);
    } finally {
      resetarFonteAleatoria();
    }
  });

  it('a personalidade influencia, mas dentro de uma faixa contida', () => {
    const intro = aberturaSocial(fatias({ personalidade: { tracos: { sociabilidade: -5 } as never, memorias: [] } }));
    const extro = aberturaSocial(fatias({ personalidade: { tracos: { sociabilidade: 5 } as never, memorias: [] } }));
    expect(intro).toBeGreaterThan(0.5);
    expect(extro).toBeLessThan(1.5);
    expect(extro / intro).toBeLessThan(2.5); // nunca vira determinismo
  });
});

/* ========================================================================== */
describe('F6 · efêmero vs persistente (§19) e inércia do sistema', () => {
  it('6. o ano social não transforma toda pessoa mencionada em NPC', () => {
    // Um ano de escola cria, no MÁXIMO, uma pessoa persistente — não uma
    // turma inteira.
    definirFonteAleatoria(() => 0.01);
    try {
      const familia = viverAnos(9, 9, () => ({ educacao: naEscola() }));
      expect(vinculosSociaisAtivos(fatias({ familia })).length).toBeLessThanOrEqual(1);
    } finally {
      resetarFonteAleatoria();
    }
  });

  it('a rede social tem teto: a vida não vira agenda telefônica', () => {
    definirFonteAleatoria(() => 0.01);
    try {
      const familia = viverAnos(6, 60, idade => ({
        educacao: idade < 18 ? naEscola() : criarEducacaoInicial(),
        carreira: idade >= 18 ? empregado() : criarCarreiraInicial()
      }));
      expect(vinculosSociaisAtivos(fatias({ familia })).length).toBeLessThanOrEqual(6);
    } finally {
      resetarFonteAleatoria();
    }
  });

  it('o ano social NÃO altera atributos, dinheiro, personalidade nem família de origem', () => {
    const f = fatias({ educacao: naEscola() });
    const antes = JSON.stringify({ p: f.personagem, c: f.carreira, e: f.educacao });
    const r = processarAnoSocial(f, 2000);
    expect(JSON.stringify({ p: f.personagem, c: f.carreira, e: f.educacao })).toBe(antes);

    // pai e mãe atravessam intactos
    const pais = r.familiaAtualizada.filter(m => m.tipo === 'pai' || m.tipo === 'mae');
    expect(pais).toHaveLength(2);
    expect(JSON.stringify(pais)).toBe(JSON.stringify(f.familia.filter(m => m.tipo === 'pai' || m.tipo === 'mae')));
  });

  it('o ano social não abre modal: devolve só família e logs', () => {
    const r = processarAnoSocial(fatias({ educacao: naEscola() }), 2000);
    expect(Object.keys(r).sort()).toEqual(['familiaAtualizada', 'logs']);
    for (const l of r.logs) expect(l.relevancia).not.toBe('marco');
  });

  it('conhecer alguém não vira linha na biografia (§20)', () => {
    // Só a AMIZADE (nascer ou acabar) é biografia; conhecer um colega não é.
    definirFonteAleatoria(() => 0.01);
    try {
      const r = processarAnoSocial(fatias({ educacao: naEscola() }), 2000);
      expect(r.logs).toHaveLength(0);
    } finally {
      resetarFonteAleatoria();
    }
  });
});

/* ========================================================================== */
describe('F6 · 23. VARIEDADE: a vida isolada continua possível', () => {
  it('temperamentos diferentes produzem aberturas diferentes', () => {
    // A variedade não pode vir só do sorteio ano a ano: pessoas diferentes
    // têm disposições diferentes, estáveis pela vida inteira. Sem isso, com
    // 70 anos de escola/trabalho/vizinhança, TODA vida virava sociável —
    // medido: 0 vidas com <=2 amigos e 62 com >=7.
    const aberturas = new Set<number>();
    for (const nome of ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabi', 'Hugo']) {
      aberturas.add(
        Number(
          aberturaSocial(
            fatias({ personagem: { ...criarPersonagemTeste({ idade: 20 }), nome } })
          ).toFixed(3)
        )
      );
    }
    expect(aberturas.size).toBeGreaterThan(1);
  });

  it('o temperamento NUNCA zera a vida social (não é bloqueio)', () => {
    for (const nome of ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe']) {
      const a = aberturaSocial(fatias({ personagem: { ...criarPersonagemTeste({ idade: 20 }), nome } }));
      expect(a).toBeGreaterThan(0);
    }
  });

  it('o temperamento é ESTÁVEL: a mesma pessoa não muda de disposição', () => {
    const pessoa = { ...criarPersonagemTeste({ idade: 20 }), nome: 'Marina' };
    const aos20 = aberturaSocial(fatias({ personagem: pessoa }));
    const aos50 = aberturaSocial(fatias({ personagem: { ...pessoa, idade: 50 } }));
    expect(aos50).toBeCloseTo(aos20, 5);
  });
});

describe('F6 · perfis por ambiente são coerentes (§22)', () => {
  it('a faixa etária do colega acompanha a fase da vida', () => {
    expect(perfilDoAmbiente('escola', 8).idadeMax).toBeLessThanOrEqual(9);
    expect(perfilDoAmbiente('trabalho', 30).idadeMin).toBeGreaterThanOrEqual(18);
    expect(perfilDoAmbiente('faculdade', 20).idadeMin).toBeGreaterThanOrEqual(17);
  });

  it('quem se conhece no trabalho é adulto', () => {
    for (let i = 0; i < 30; i++) {
      expect(criarConhecido('trabalho', 35, 'Souza').idade).toBeGreaterThanOrEqual(18);
    }
  });

  it('a vizinhança só passa a existir a partir da pré-adolescência', () => {
    expect(ambientesDeConvivio(fatias({ personagem: criarPersonagemTeste({ idade: 6 }) })))
      .not.toContain('vizinhanca');
    expect(ambientesDeConvivio(fatias({ personagem: criarPersonagemTeste({ idade: 14 }) })))
      .toContain('vizinhanca');
  });
});
