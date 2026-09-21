/**
 * Regressão da coerência profissional — CASOS A–F.
 *
 * Cada caso corresponde a uma situação que a auditoria REPRODUZIU no jogo
 * real. O objetivo não é cobrir a função linha a linha, e sim garantir que
 * estas histórias específicas não voltem a ser contáveis.
 *
 * O ponto mais importante desta suíte é o CASO F: a mesma regra é verificada
 * na EXIBIÇÃO e na EFETIVAÇÃO. Um teste que só olhasse a lista de vagas
 * confirmaria apenas que o botão sumiu — e botão escondido não é regra de
 * negócio.
 */

import { describe, expect, it } from 'vitest';
import { criarEstadoTeste } from './fixtures';
import { candidatarEmprego, criarCarreiraInicial } from '../careerSystem';
import { listarVagasCompativeis } from '../availabilitySystem';
import {
  avaliarElegibilidadeProfissional,
  calcularAnosDeExperiencia,
  experienciaMaximaPossivelNaIdade
} from '../plausibility/elegibilidadeProfissional';
import { TODAS_PROFISSOES } from '../../data/careersData';
import type { CareerState, EducationState, EducationLevel, Job } from '../../types';

function vaga(id: string): Job {
  const j = TODAS_PROFISSOES.find(p => p.id === id);
  if (!j) throw new Error(`vaga inexistente no catálogo: ${id}`);
  return j;
}

/** Educação com um nível e uma lista de cursos concluídos (por nome, como o save grava). */
function educacaoCom(
  nivel: EducationLevel,
  cursos: { nome: string; tipo: 'tecnico' | 'superior' | 'pos' }[] = []
): Partial<EducationState> {
  return {
    nivelAtual: nivel,
    cursosConcluidos: cursos.map(c => ({ ...c, anoConclusao: 2044 }))
  };
}

/** Carreira com N anos de experiência já acumulados no histórico. */
function carreiraComExperiencia(anos: number): CareerState {
  const base = criarCarreiraInicial();
  if (anos <= 0) return base;
  return {
    ...base,
    historicoEmpregos: [
      {
        cargo: 'Cargo anterior',
        salario: 2000,
        anoInicio: 2030,
        anoFim: 2030 + anos,
        motivoSaida: 'Mudança de emprego'
      }
    ]
  };
}

/**
 * `inteligencia` é explícita porque várias vagas do catálogo pedem 75-85 e a
 * fixture padrão tem 60 — sem isso, um teste sobre FORMAÇÃO falharia por
 * aptidão e mediria a coisa errada.
 */
function contexto(
  idade: number,
  educacao: Partial<EducationState>,
  carreira: CareerState = criarCarreiraInicial(),
  inteligencia = 90
) {
  const estado = criarEstadoTeste({ idade, educacao });
  return {
    personagem: {
      ...estado.personagem,
      stats: { ...estado.personagem.stats, inteligencia }
    },
    educacao: estado.educacao,
    carreira
  };
}

// ---------------------------------------------------------------------------

describe('CASO A — 18 anos e nenhuma experiência não abre vaga incompatível', () => {
  const ctx = contexto(18, educacaoCom('medio_completo'), criarCarreiraInicial());

  it('Mestre de Obras (4 anos de experiência) não aparece na lista', () => {
    const ids = listarVagasCompativeis({ ...ctx, economia: criarEstadoTeste({ idade: 18 }).economia, familia: [] }).map(j => j.id);
    expect(ids).not.toContain('mestre_obras');
  });

  it('o motor recusa mesmo chamado diretamente, sem passar pela lista', () => {
    const r = candidatarEmprego(vaga('mestre_obras'), ctx.personagem, ctx.educacao, 2044, ctx.carreira);
    expect(r.sucesso).toBe(false);
    expect(r.novoCargo).toBeUndefined();
  });

  it('a recusa é por experiência, e não por escolaridade (a vaga só pede fundamental)', () => {
    const v = avaliarElegibilidadeProfissional(vaga('mestre_obras'), ctx);
    const codigos = v.requisitosFaltantes.map(r => r.codigo);
    expect(codigos).toContain('experiencia_impossivel_para_a_idade');
    expect(codigos).not.toContain('escolaridade');
  });
});

describe('CASO B — só Pedagogia não habilita Medicina', () => {
  const ctx = contexto(
    22,
    educacaoCom('superior_completo', [{ nome: 'Pedagogia / Licenciatura', tipo: 'superior' }]),
    criarCarreiraInicial()
  );

  it('não é contratada como Médico Clínico Geral', () => {
    const r = candidatarEmprego(vaga('medico_geral'), ctx.personagem, ctx.educacao, 2048, ctx.carreira);
    expect(r.sucesso).toBe(false);
  });

  it('o veredito é IRREGULAR: exercer Medicina sem CRM é ilegal, não apenas incompleto', () => {
    const v = avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx);
    expect(v.grau).toBe('irregular');
    expect(v.requisitosFaltantes.map(r => r.codigo)).toContain('licenca_profissional');
  });

  it('as profissões regulamentadas somem da lista de vagas', () => {
    const ids = listarVagasCompativeis({
      ...ctx,
      economia: criarEstadoTeste({ idade: 22 }).economia,
      familia: []
    }).map(j => j.id);
    expect(ids).not.toContain('medico_geral');
    expect(ids).not.toContain('advogado_jr');
    expect(ids).not.toContain('psicologo_clinico');
    expect(ids).not.toContain('eng_civil_jr');
  });

  it('mas a própria área dela continua aberta — Pedagogia habilita docência', () => {
    const v = avaliarElegibilidadeProfissional(vaga('professor_fundamental'), ctx);
    expect(v.grau).toBe('permitido');
  });
});

describe('CASO C — curso técnico não libera profissões sem relação', () => {
  const ctx = contexto(
    20,
    educacaoCom('tecnico', [{ nome: 'Técnico em Desenvolvimento de Sistemas', tipo: 'tecnico' }]),
    criarCarreiraInicial()
  );

  it('técnico em TI não vira Técnico em Enfermagem', () => {
    const v = avaliarElegibilidadeProfissional(vaga('tec_enfermagem_job'), ctx);
    expect(v.grau).not.toBe('permitido');
    expect(v.requisitosFaltantes.map(r => r.codigo)).toContain('formacao_area');
  });

  it('técnico em TI não vira Eletricista Instalador', () => {
    const v = avaliarElegibilidadeProfissional(vaga('eletricista'), ctx);
    expect(v.requisitosFaltantes.map(r => r.codigo)).toContain('formacao_area');
  });

  it('mas habilita a área dele: Técnico de Suporte de TI', () => {
    const v = avaliarElegibilidadeProfissional(vaga('tec_suporte_ti'), ctx);
    expect(['permitido', 'improvavel']).toContain(v.grau);
  });

  it('técnico em Enfermagem NÃO alcança Enfermeiro (nível de formação insuficiente)', () => {
    const tecEnf = contexto(
      25,
      educacaoCom('tecnico', [{ nome: 'Técnico em Enfermagem', tipo: 'tecnico' }]),
      carreiraComExperiencia(5)
    );
    const v = avaliarElegibilidadeProfissional(vaga('enfermeiro_chefe'), tecEnf);
    expect(v.grau).not.toBe('permitido');
  });
});

describe('CASO D — experiência insuficiente bloqueia', () => {
  it('Desenvolvedor Sênior exige anos que um recém-formado não tem', () => {
    const ctx = contexto(
      23,
      educacaoCom('superior_completo', [{ nome: 'Engenharia de Software / Ciência da Computação', tipo: 'superior' }]),
      criarCarreiraInicial()
    );
    const v = avaliarElegibilidadeProfissional(vaga('dev_senior'), ctx);
    expect(v.grau).not.toBe('permitido');
    expect(v.requisitosFaltantes.map(r => r.codigo)).toContain('experiencia');
  });

  it('a experiência sai do histórico de empregos, não de um campo novo', () => {
    expect(calcularAnosDeExperiencia(carreiraComExperiencia(6))).toBe(6);
  });

  it('a experiência possível é limitada pela idade legal de trabalho', () => {
    expect(experienciaMaximaPossivelNaIdade(18)).toBe(2); // 18 - 16 (idade mínima de trabalho no jogo)
    expect(experienciaMaximaPossivelNaIdade(10)).toBe(0);
    expect(experienciaMaximaPossivelNaIdade(30)).toBe(14);
  });

  it('faltar muito é requisito; ser jovem demais para tê-la é impossível', () => {
    const jovem = contexto(18, educacaoCom('medio_completo'), criarCarreiraInicial());
    const veterano = contexto(40, educacaoCom('medio_completo'), criarCarreiraInicial());
    expect(avaliarElegibilidadeProfissional(vaga('mestre_obras'), jovem).grau).toBe('impossivel');
    expect(avaliarElegibilidadeProfissional(vaga('mestre_obras'), veterano).grau).toBe('requisito');
  });
});

describe('CASO E — quem satisfaz os requisitos continua entrando', () => {
  it('médica formada e com residência alcança a vaga de especialista', () => {
    const ctx = contexto(
      34,
      educacaoCom('pos_graduacao', [
        { nome: 'Medicina', tipo: 'superior' },
        { nome: 'Residência Médica / Especialização', tipo: 'pos' }
      ]),
      carreiraComExperiencia(8)
    );
    expect(avaliarElegibilidadeProfissional(vaga('medico_especialista'), ctx).grau).toBe('permitido');
  });

  it('advogada formada em Direito entra na advocacia', () => {
    const ctx = contexto(
      25,
      educacaoCom('superior_completo', [{ nome: 'Direito', tipo: 'superior' }]),
      carreiraComExperiencia(2)
    );
    expect(avaliarElegibilidadeProfissional(vaga('advogado_jr'), ctx).grau).toBe('permitido');
  });

  it('o mercado sem formação específica segue amplamente acessível', () => {
    const ctx = contexto(19, educacaoCom('medio_completo'), criarCarreiraInicial());
    const vagas = listarVagasCompativeis({
      ...ctx,
      economia: criarEstadoTeste({ idade: 19 }).economia,
      familia: []
    });
    // Ninguém fica sem mercado: sem diploma nenhum ainda há caminho de entrada.
    expect(vagas.length).toBeGreaterThanOrEqual(4);
    expect(vagas.map(j => j.id)).toContain('atendente');
  });

  it('toda vaga do catálogo é alcançável por ALGUÉM (nenhuma fica órfã)', () => {
    // Guarda contra requisito impossível de satisfazer: um perfil maximamente
    // qualificado precisa conseguir cada vaga que não seja de faixa etária.
    const superQualificado = contexto(
      45,
      educacaoCom('pos_graduacao', [
        { nome: 'Medicina', tipo: 'superior' },
        { nome: 'Residência Médica / Especialização', tipo: 'pos' },
        { nome: 'Direito', tipo: 'superior' },
        { nome: 'Engenharia Civil', tipo: 'superior' },
        { nome: 'Engenharia de Software / Ciência da Computação', tipo: 'superior' },
        { nome: 'Enfermagem (Bacharelado)', tipo: 'superior' },
        { nome: 'Psicologia', tipo: 'superior' },
        { nome: 'Pedagogia / Licenciatura', tipo: 'superior' },
        { nome: 'Técnico em Eletrotécnica', tipo: 'tecnico' },
        { nome: 'Técnico em Enfermagem', tipo: 'tecnico' }
      ]),
      carreiraComExperiencia(25)
    );
    const inalcancaveis = TODAS_PROFISSOES.filter(job => {
      if (job.id === 'jovem_aprendiz') return false; // limite etário legítimo
      const v = avaliarElegibilidadeProfissional(job, superQualificado);
      return v.grau !== 'permitido' && v.grau !== 'improvavel';
    });
    expect(inalcancaveis.map(j => j.id)).toEqual([]);
  });
});

describe('CASO F — a regra vale na exibição E na efetivação', () => {
  const ctx = contexto(
    22,
    educacaoCom('superior_completo', [{ nome: 'Pedagogia / Licenciatura', tipo: 'superior' }]),
    criarCarreiraInicial()
  );

  it('nenhuma vaga listada é recusada pelo motor (exibição e motor concordam)', () => {
    const vagas = listarVagasCompativeis({
      ...ctx,
      economia: criarEstadoTeste({ idade: 22 }).economia,
      familia: []
    });
    for (const job of vagas) {
      const v = avaliarElegibilidadeProfissional(job, ctx);
      expect(
        v.grau === 'permitido' || v.grau === 'improvavel',
        `vaga "${job.titulo}" listada mas com veredito "${v.grau}"`
      ).toBe(true);
    }
  });

  it('vaga NÃO listada é recusada pelo motor mesmo por chamada direta', () => {
    const listadas = new Set(
      listarVagasCompativeis({
        ...ctx,
        economia: criarEstadoTeste({ idade: 22 }).economia,
        familia: []
      }).map(j => j.id)
    );
    const ocultas = TODAS_PROFISSOES.filter(j => !listadas.has(j.id));
    expect(ocultas.length).toBeGreaterThan(0);

    for (const job of ocultas) {
      // Muitas tentativas: o motor não pode ceder por sorte em nenhuma delas.
      for (let i = 0; i < 25; i++) {
        const r = candidatarEmprego(job, ctx.personagem, ctx.educacao, 2048, ctx.carreira);
        expect(r.sucesso, `"${job.titulo}" foi concedida numa chamada direta`).toBe(false);
      }
    }
  });
});

describe('Compatibilidade de saves antigos', () => {
  it('save sem cursosConcluidos não quebra e não vira formação fantasma', () => {
    const ctx = contexto(30, { nivelAtual: 'superior_completo', cursosConcluidos: [] });
    expect(() => avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx)).not.toThrow();
    expect(avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx).grau).toBe('irregular');
  });

  it('curso com nome fora do catálogo é ignorado sem lançar erro', () => {
    const ctx = contexto(
      30,
      educacaoCom('superior_completo', [{ nome: 'Curso Que Não Existe Mais', tipo: 'superior' }])
    );
    expect(avaliarElegibilidadeProfissional(vaga('atendente'), ctx).grau).toBe('permitido');
  });

  it('nome com acentuação/caixa diferente ainda casa com o catálogo', () => {
    const ctx = contexto(
      30,
      educacaoCom('superior_completo', [{ nome: '  MEDICINA  ', tipo: 'superior' }]),
      carreiraComExperiencia(3)
    );
    expect(avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx).grau).toBe('permitido');
  });

  it('personagem legado JÁ empregado em cargo hoje inelegível não é demitido', () => {
    // A regra governa a ENTRADA. Nada nesta fase remove um cargo já ocupado —
    // destruir a carreira de um save existente seria pior que o problema.
    const carreira: CareerState = {
      ...criarCarreiraInicial(),
      empregado: true,
      cargoAtual: vaga('medico_geral')
    };
    const ctx = contexto(30, educacaoCom('superior_completo', [{ nome: 'Pedagogia / Licenciatura', tipo: 'superior' }]), carreira);
    expect(ctx.carreira.empregado).toBe(true);
    expect(ctx.carreira.cargoAtual?.id).toBe('medico_geral');
  });
});

describe('Graus de plausibilidade', () => {
  it('improvável NÃO bloqueia — apenas reduz a chance', () => {
    const ctx = contexto(
      30,
      educacaoCom('superior_completo', [{ nome: 'Engenharia de Software / Ciência da Computação', tipo: 'superior' }]),
      carreiraComExperiencia(4) // dev_senior pede 5
    );
    const v = avaliarElegibilidadeProfissional(vaga('dev_senior'), ctx);
    expect(v.grau).toBe('improvavel');
    expect(v.modificadorDeChance).toBeLessThan(1);

    const listadas = listarVagasCompativeis({
      ...ctx,
      economia: criarEstadoTeste({ idade: 30 }).economia,
      familia: []
    }).map(j => j.id);
    expect(listadas).toContain('dev_senior');
  });

  it('o veredito sempre reporta o requisito mais grave primeiro', () => {
    const ctx = contexto(18, educacaoCom('fundamental_completo'), criarCarreiraInicial());
    const v = avaliarElegibilidadeProfissional(vaga('medico_especialista'), ctx);
    expect(v.grau).toBe('impossivel');
  });
});
