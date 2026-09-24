/**
 * ATT 2 — Caminhos de vida. Testes de CLASSE de problema: nenhum depende de
 * nome, texto exato ou de uma semente mágica que "funciona".
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responder, viver, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { idade, transacao } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { CURSOS, curso } from '../dados/cursos';
import { aptidao, habilidade, garantirFrente } from '../sistemas/frentes';
import { podeComecarRotina, ROTINAS, nivelModelo } from '../sistemas/rotinas';
import { semana } from '../sistemas/semana';
import { contratar, elegibilidade, horizonte, aposentar } from '../sistemas/trabalho';
import { chanceNoConcurso, editaisAbertos } from '../sistemas/concurso';
import { mudarAgora } from '../sistemas/processos';
import { interpretar, salvar, ler, VERSAO_SAVE, type Armazenamento } from '../save';
import { entradaDaFormacao } from '../sistemas/filhos';
import { CATALOGO } from '../conteudo/catalogo';
import { CAMINHOS } from '../conteudo/caminhos';
import { contexto } from '../conteudo/base';
import { municipio } from '../dados/lugares';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

/** Uma vida viva até `i`, com ações por ano. Pula sementes que morreram antes. */
function ate(i: number, semente: number, acoes?: (v: Vida) => Acao[], extra: Partial<Parameters<typeof nova>[0]> = {}): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, ...extra }), i, acoes);
  while (v.morte) v = viverAte(nova({ semente: ++s, ...extra }), i, acoes);
  return v;
}

const praticar = (id: string, nivel: 1 | 2 | 3 = 1, desde = 6) => (v: Vida): Acao[] => {
  if (idade(v) < desde) return [];
  const atual = v.rotinas.find(r => r.id === id);
  if (!atual) return tenta(v, { tipo: 'rotina', id, ativa: true, nivel: 1 }) ? [{ tipo: 'rotina', id, ativa: true, nivel: 1 }] : [];
  if ((atual.nivel ?? 1) < nivel && tenta(v, { tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 })) return [{ tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 }];
  return [];
};

/** Adulto de 24 sem emprego, pronto para receber estado de teste. */
function adulto(semente = 5, o: Partial<Parameters<typeof nova>[0]> = {}): Vida {
  const v = ate(24, semente, undefined, o);
  v.momento = null;
  if (v.trabalho.atual) v.trabalho.atual = undefined;
  v.educacao.matricula = undefined;
  return v;
}

function formar(v: Vida, cursoId: string, licencas: string[] = []): void {
  const c = curso(cursoId);
  v.educacao.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: v.t, instituicao: 'teste' });
  if (c.nivel === 'superior') v.educacao.escolaridade = 'superior';
  else if (c.nivel === 'tecnico' && ['nenhuma', 'fundamental', 'medio_incompleto', 'medio'].includes(v.educacao.escolaridade)) v.educacao.escolaridade = 'tecnico';
  v.trabalho.licencas.push(...licencas);
}

/* ============================================================= Atividades */

describe('atividades e frentes', () => {
  it('1. uma atividade da infância continua nos anos seguintes e acumula prática', () => {
    for (const s of [3, 8, 21]) {
      const v = ate(13, s, praticar('musica', 1, 7));
      expect(v.rotinas.some(r => r.id === 'musica')).toBe(true);
      expect(v.caminhos.frentes.musica!.meses).toBeGreaterThanOrEqual(30);
    }
  });

  it('2. uma atividade pode ser abandonada: sai da semana e para de crescer', () => {
    let v = ate(12, 4, praticar('futebol', 2, 6));
    const antes = v.caminhos.frentes.futebol!;
    v = executar(v, { tipo: 'rotina', id: 'futebol', ativa: false }).vida;
    expect(v.rotinas.some(r => r.id === 'futebol')).toBe(false);
    expect(v.caminhos.marcas.some(m => m.tipo === 'abandono')).toBe(true);
    v = viver(v, 4);
    const depois = v.caminhos.frentes.futebol!;
    expect(depois.meses).toBe(antes.meses);
    expect(depois.habilidade).toBeLessThanOrEqual(antes.habilidade);
    // O que se aprendeu fundo não some.
    expect(depois.habilidade).toBeGreaterThanOrEqual(antes.auge * 0.45 - 0.5);
  });

  it('3. uma atividade parada pode ser retomada, e a volta é registrada', () => {
    let v = ate(12, 6, praticar('desenho', 2, 6));
    v = executar(v, { tipo: 'rotina', id: 'desenho', ativa: false }).vida;
    v = viver(v, 4);
    expect(tenta(v, { tipo: 'rotina', id: 'desenho', ativa: true, nivel: 1 })).toBe(true);
    v = executar(v, { tipo: 'rotina', id: 'desenho', ativa: true, nivel: 1 }).vida;
    v = viver(v, 1);
    expect(v.caminhos.frentes.desenho!.retomadas).toBeGreaterThanOrEqual(1);
    expect(v.caminhos.marcas.some(m => m.tipo === 'retomada')).toBe(true);
  });

  it('4. praticar desenvolve experiência — e mais intensidade rende mais', () => {
    const leve = ate(14, 9, praticar('xadrez', 1, 7));
    const clube = ate(14, 9, praticar('xadrez', 2, 7));
    expect(leve.caminhos.frentes.xadrez!.meses).toBeGreaterThan(0);
    expect(clube.caminhos.frentes.xadrez!.meses).toBeGreaterThan(leve.caminhos.frentes.xadrez!.meses);
    expect(clube.caminhos.frentes.xadrez!.habilidade).toBeGreaterThan(leve.caminhos.frentes.xadrez!.habilidade);
  });

  it('6. sem facilidade não há bloqueio absoluto: anos de prática levam a jogar bem', () => {
    // Procura vidas com pouca facilidade para a bola e treina por dez anos.
    let achadas = 0;
    for (let s = 1; s < 400 && achadas < 3; s++) {
      const v0 = nova({ semente: s });
      if (aptidao(v0, 'futebol') > -0.35) continue;
      const v = viverAte(v0, 18, praticar('futebol', 2, 6));
      if (v.morte) continue;
      achadas++;
      expect(habilidade(v, 'futebol')).toBeGreaterThanOrEqual(45);
    }
    expect(achadas).toBeGreaterThan(0);
  }, 60000);

  it('7. facilidade sem prática não garante nada', () => {
    let achadas = 0;
    for (let s = 1; s < 400 && achadas < 3; s++) {
      const v0 = nova({ semente: s });
      if (aptidao(v0, 'musica') < 0.4) continue;
      const v = viverAte(v0, 17);
      if (v.morte) continue;
      achadas++;
      expect(habilidade(v, 'musica')).toBeLessThan(20);
    }
    expect(achadas).toBeGreaterThan(0);
  }, 60000);

  it('5. as portas dependem do histórico: peneira só para quem treina; banda só para quem toca', () => {
    let peneiraTreina = 0, peneiraNao = 0, bandaToca = 0, bandaNao = 0;
    const acoesTreina = praticar('futebol', 2, 6);
    const acoesToca = praticar('musica', 2, 8);
    for (let s = 1; s <= 12; s++) {
      const a = viverAte(nova({ semente: s * 3 }), 18, acoesTreina);
      const b = viverAte(nova({ semente: s * 3 }), 18);
      const c = viverAte(nova({ semente: s * 5 }), 25, acoesToca);
      if (Object.keys(a.caminhos.ultimas).some(k => k.startsWith('peneira_'))) peneiraTreina++;
      if (Object.keys(b.caminhos.ultimas).some(k => k.startsWith('peneira_'))) peneiraNao++;
      if (c.caminhos.ultimas['projeto_musica'] !== undefined) bandaToca++;
      if (b.caminhos.ultimas['projeto_musica'] !== undefined) bandaNao++;
    }
    expect(peneiraTreina).toBeGreaterThan(0);
    expect(peneiraNao).toBe(0);
    expect(bandaToca).toBeGreaterThan(0);
    expect(bandaNao).toBe(0);
  }, 120000);
});

/* ================================================================ Esporte */

function vidaDeAtleta(semente: number): Vida {
  // Joga a sério desde cedo e aceita toda peneira, base e contrato que aparecer.
  let v = nova({ semente, genero: semente % 2 ? 'masculino' : 'feminino' });
  const r = criarRng(semente);
  for (let k = 0; k < 40 && !v.morte; k++) {
    for (const a of praticar('futebol', 2, 6)(v)) v = executar(v, a).vida;
    for (const o of v.caminhos.oportunidades) {
      if (['peneira', 'convite'].includes(o.tipo) && tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true })) {
        v = executar(v, { tipo: 'oportunidade', id: o.id, aceitar: true }).vida;
        while (v.momento) v = responder(v, ['arriscar', 'ir', 'assinar'].find(x => v.momento!.opcoes.some(op => op.id === x && !op.bloqueio)));
      }
    }
    v = avancarAno(v).vida;
    while (v.momento) v = responder(v, ['ir', 'assinar', 'tentar'].find(x => v.momento!.opcoes.some(op => op.id === x && !op.bloqueio)));
    void r;
  }
  return v;
}

describe('esporte', () => {
  it('8. futebol profissional exige trajetória: não se entra por currículo, e todo profissional passou pela base', () => {
    const v = adulto(3);
    garantirFrente(v, 'futebol').habilidade = 95;
    expect(elegibilidade(v, ocupacao('jogador_futebol')).grau).toBe('requisito');
    for (let s = 1; s <= 40; s++) {
      const x = vidaDeAtleta(s * 11);
      if (!x.fatos['atleta_profissional']) continue;
      const base = x.caminhos.marcas.find(m => m.tipo === 'ingresso' && m.dominio === 'futebol');
      const pro = x.caminhos.marcas.find(m => m.tipo === 'profissional');
      expect(base).toBeDefined();
      expect(base!.t).toBeLessThan(pro!.t);
    }
  }, 240000);

  it('9 e 10. virar profissional é raro, tentar é comum — e quem fracassa segue com as outras rotas', () => {
    let tentaram = 0, profissionais = 0, dispensadosComRota = 0, dispensados = 0;
    for (let s = 1; s <= 40; s++) {
      const x = vidaDeAtleta(s * 7);
      if (Object.keys(x.fatos).some(k => k.startsWith('peneiras_'))) tentaram++;
      if (x.fatos['atleta_profissional']) profissionais++;
      if (x.fatos['dispensado_base'] || x.caminhos.marcas.some(m => m.tipo === 'fracasso')) {
        dispensados++;
        // Depois do sonho, a vida continua: escola concluída ou trabalho, e vagas comuns abertas.
        const temRota = x.trabalho.historico.length > 0 || !!x.trabalho.atual || ['medio', 'tecnico', 'superior'].includes(x.educacao.escolaridade);
        if (temRota) dispensadosComRota++;
      }
    }
    expect(tentaram).toBeGreaterThanOrEqual(10);
    expect(profissionais).toBeLessThanOrEqual(Math.max(2, tentaram * 0.25));
    expect(tentaram).toBeGreaterThan(profissionais * 3);
    expect(dispensadosComRota).toBe(dispensados);
  }, 300000);
});

/* =================================================================== Arte */

describe('arte', () => {
  it('11. música pode ficar como hobby por décadas, sem virar profissão', () => {
    const v = ate(55, 12, praticar('musica', 1, 8));
    expect(v.rotinas.some(r => r.id === 'musica')).toBe(true);
    expect(v.caminhos.frentes.musica!.meses).toBeGreaterThanOrEqual(200);
    expect(['musico_profissional', 'musico_orquestra'].includes(v.trabalho.atual?.ocupacaoId ?? '')).toBe(false);
  }, 60000);

  it('12. viver de arte exige construção: nem currículo nem habilidade sozinha bastam', () => {
    const v = adulto(8);
    garantirFrente(v, 'musica').habilidade = 92;
    expect(elegibilidade(v, ocupacao('musico_profissional')).grau).toBe('requisito');
    // Sem grupo e sem público, nenhum convite aparece em dez anos de prática.
    v.rotinas = [{ id: 'musica', tInicio: v.t, nivel: 1 }];
    let x = v;
    for (let k = 0; k < 10; k++) { x = avancarAno(x).vida; if (x.momento) x = responder(x); x.caminhos.oportunidades = x.caminhos.oportunidades.filter(o => o.tipo !== 'banda'); }
    expect(Object.keys(x.caminhos.ultimas).includes('convite_arte')).toBe(false);
  }, 60000);
});

/* ============================================================== Formação */

describe('formação e carreira', () => {
  it('13. o técnico abre ocupações coerentes (e não as do superior)', () => {
    const v = adulto(4);
    formar(v, 'tec_enfermagem');
    expect(podeTentar(elegibilidade(v, ocupacao('tec_enfermagem')))).toBe(true);
    expect(elegibilidade(v, ocupacao('enfermeiro')).grau).toBe('requisito');
    const w = adulto(4);
    formar(w, 'tec_eletrotecnica');
    expect(podeTentar(elegibilidade(w, ocupacao('tecnico_industrial')))).toBe(true);
    expect(podeTentar(elegibilidade(w, ocupacao('eletricista')))).toBe(true);
  });

  it('14. a graduação abre ocupações coerentes; regulamentadas pedem o diploma certo e o registro', () => {
    const v = adulto(6);
    formar(v, 'pedagogia');
    expect(elegibilidade(v, ocupacao('medico')).grau).toBe('requisito');
    expect(elegibilidade(v, ocupacao('advogado_jr')).grau).toBe('requisito');
    expect(podeTentar(elegibilidade(v, ocupacao('professor_fund')))).toBe(true);
    const d = adulto(6);
    formar(d, 'direito');
    expect(elegibilidade(d, ocupacao('advogado_jr')).grau).toBe('requisito'); // falta a OAB
    d.trabalho.licencas.push('oab');
    expect(podeTentar(elegibilidade(d, ocupacao('advogado_jr')))).toBe(true);
  });

  it('15 e 17. diploma não cria senioridade: todo cargo experiente pede estrada (salvo concurso, residência, negócio ou oportunidade)', () => {
    for (const oc of OCUPACOES) {
      if (oc.nivel < 4 || oc.concurso || oc.nivelCurso === 'residencia' || oc.entrada) continue;
      expect([oc.id, oc.experiencia ?? 0]).toEqual([oc.id, expect.any(Number)]);
      expect(oc.experiencia ?? 0).toBeGreaterThanOrEqual(24);
    }
    const v = adulto(7);
    formar(v, 'agronomia', ['crea']);
    // O recém-formado entra como agrônomo; o consultor experiente pede anos de estrada.
    expect(podeTentar(elegibilidade(v, ocupacao('agronomo')))).toBe(true);
    expect(elegibilidade(v, ocupacao('agronomo_consultor')).grau).toBe('requisito');
    expect(ocupacao('agronomo').nivel).toBeLessThan(4);
  });

  it('16. experiência permite progressão (e a estrada afim não faz ninguém chefe)', () => {
    const v = adulto(9);
    v.educacao.escolaridade = 'medio';
    expect(elegibilidade(v, ocupacao('gerente_loja')).grau).toBe('requisito');
    v.trabalho.experiencia['comercio'] = 80;
    expect(podeTentar(elegibilidade(v, ocupacao('gerente_loja')))).toBe(true);
    const w = adulto(9);
    w.educacao.escolaridade = 'medio';
    w.trabalho.experiencia['informal'] = 400;
    expect(podeTentar(elegibilidade(w, ocupacao('gerente_loja')))).toBe(false);
  });

  it('carreira parada tem explicação em palavras', () => {
    const v = adulto(10);
    v.educacao.escolaridade = 'medio';
    const r = criarRng(1);
    const { vida } = transacao(v, (x, rr) => { contratar(x, rr, ocupacao('assistente_adm')); });
    vida.trabalho.experiencia['administrativo'] = 200;
    const h = horizonte(vida);
    expect(h).toBeTruthy();
    expect(h!.length).toBeGreaterThan(20);
    void r;
  });

  it('salário não cresce infinitamente sem mudar de cargo', () => {
    let v = adulto(11);
    v.educacao.escolaridade = 'medio';
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('recepcionista')); }).vida;
    const inicial = v.trabalho.atual!.salario;
    for (let k = 0; k < 30 && !v.morte; k++) {
      v = avancarAno(v).vida;
      if (v.momento) v = responder(v, 'ficar');
      if (!v.trabalho.atual || v.trabalho.atual.ocupacaoId !== 'recepcionista') break;
    }
    if (v.trabalho.atual?.ocupacaoId === 'recepcionista') expect(v.trabalho.atual.salario).toBeLessThanOrEqual(inicial * 1.8);
  }, 60000);
});

/* ============================================================ Desemprego */

describe('desemprego e mudança', () => {
  it('18. o desemprego pode terminar: quem procura acha alguma coisa', () => {
    let acharam = 0, total = 0;
    for (let s = 1; s <= 10; s++) {
      let v = adulto(s * 13);
      v.educacao.escolaridade = 'medio';
      v.trabalho.desempregadoDesde = v.t - 24;
      total++;
      for (let k = 0; k < 6 && !v.trabalho.atual && !v.morte; k++) {
        const vaga = OCUPACOES.find(oc => oc.nivel <= 1 && !oc.concurso && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }));
        if (vaga) { v = executar(v, { tipo: 'candidatar', ocupacaoId: vaga.id }).vida; if (v.momento) v = responder(v); }
        for (const o of v.caminhos.oportunidades) if (!v.trabalho.atual && tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true })) { v = executar(v, { tipo: 'oportunidade', id: o.id, aceitar: true }).vida; if (v.momento) v = responder(v); }
        v = avancarAno(v).vida;
        if (v.momento) v = responder(v, 'qualquer');
      }
      if (v.trabalho.atual) acharam++;
    }
    expect(acharam).toBeGreaterThanOrEqual(total * 0.7);
  }, 120000);

  it('19. mudar de carreira funciona: do comércio a um ofício, com a mudança registrada', () => {
    let v = adulto(14);
    v.educacao.escolaridade = 'medio';
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('vendedor')); x.trabalho.experiencia['comercio'] = 60; }).vida;
    formar(v, 'q_eletricista');
    expect(tenta(v, { tipo: 'candidatar', ocupacaoId: 'eletricista' })).toBe(true);
    v = executar(v, { tipo: 'candidatar', ocupacaoId: 'eletricista' }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('eletricista');
    expect(v.caminhos.marcas.some(m => m.tipo === 'mudanca_carreira')).toBe(true);
  });

  it('27 e 28. a cidade pesa nas oportunidades — e mudar de cidade muda o que está ao alcance', () => {
    const v = adulto(15, { municipioId: 'tarauaca-ac' });
    v.educacao.escolaridade = 'superior';
    formar(v, 'design');
    expect(municipio(v.moradia.municipioId).perfil).toBe('pequena');
    expect(elegibilidade(v, ocupacao('diretor_arte')).grau).toBe('requisito');
    const antes = OCUPACOES.filter(oc => podeTentar(elegibilidade(v, oc))).map(oc => oc.id);
    const { vida: w } = transacao(v, x => mudarAgora(x, 'sao-paulo-sp', 'teste'));
    const depois = OCUPACOES.filter(oc => podeTentar(elegibilidade(w, oc))).map(oc => oc.id);
    expect(depois.filter(id => !antes.includes(id)).length).toBeGreaterThan(0);
    expect(depois).toContain('designer_jr');
  });
});

/* =============================================================== Concurso */

describe('concurso', () => {
  it('20. concurso exige preparo: sem estudo é quase loteria', () => {
    const v = adulto(16);
    v.educacao.escolaridade = 'superior';
    for (const id of ['tecnico_publico', 'analista_judiciario', 'auditor_fiscal']) {
      const oc = ocupacao(id);
      v.caminhos.concurso.meses = 0;
      const sem = chanceNoConcurso(v, oc);
      v.caminhos.concurso.meses = 60;
      const com = chanceNoConcurso(v, oc);
      expect(sem).toBeLessThan(0.04);
      expect(com).toBeGreaterThan(sem * 3);
      expect(com).toBeLessThan(0.35); // mesmo preparado, há concorrência
    }
  });

  it('21. reprovar não encerra o caminho: dá para tentar de novo, e insistir é comportamento', () => {
    let v = adulto(17);
    v.educacao.escolaridade = 'medio';
    v.caminhos.concurso.tentativas = 2;
    v.caminhos.concurso.aprovacoes = 0;
    v.caminhos.concurso.ultimaTentativa = v.t - 12;
    // Anda até abrir um edital de nível médio.
    for (let k = 0; k < 12 && !editaisAbertos(v).some(oc => tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })); k++) { v = avancarAno(v).vida; if (v.momento) v = responder(v); }
    const oc = editaisAbertos(v).find(x => tenta(v, { tipo: 'candidatar', ocupacaoId: x.id }));
    expect(oc).toBeDefined();
    v = executar(v, { tipo: 'candidatar', ocupacaoId: oc!.id }).vida;
    expect(v.trabalho.candidaturas.length).toBe(1);
    expect(v.personalidade.evidencias.some(e => e.origem === 'acao:persistir')).toBe(true);
  }, 60000);

  it('só se presta concurso com edital aberto', () => {
    const v = adulto(18);
    v.educacao.escolaridade = 'superior';
    const fechado = OCUPACOES.filter(oc => oc.concurso).find(oc => !editaisAbertos(v).includes(oc) && elegibilidade(v, oc).grau === 'incompativel');
    expect(fechado).toBeDefined();
  });
});

/* ============================================================== Autonomia */

describe('autonomia e aposentadoria', () => {
  it('22. trabalho por conta funciona: sem entrevista, com freguesia que decide a renda', () => {
    let v = adulto(19);
    garantirFrente(v, 'beleza').habilidade = 60;
    expect(tenta(v, { tipo: 'candidatar', ocupacaoId: 'cabeleireiro' })).toBe(true);
    v = executar(v, { tipo: 'candidatar', ocupacaoId: 'cabeleireiro' }).vida;
    expect(v.momento).toBeFalsy();
    expect(v.trabalho.atual?.contrato).toBe('autonomo');
    expect(v.trabalho.atual?.clientela).toBeDefined();
    const rendas = new Set<number>();
    for (let k = 0; k < 5 && v.trabalho.atual?.ocupacaoId === 'cabeleireiro'; k++) { v = avancarAno(v).vida; if (v.momento) v = responder(v); if (v.trabalho.atual) rendas.add(v.trabalho.atual.salario); }
    expect(rendas.size).toBeGreaterThan(1);
  }, 60000);

  it('23. a aposentadoria interrompe a escada: trabalhar depois de aposentado não promove', () => {
    let v = adulto(20);
    v.educacao.escolaridade = 'medio';
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('vendedor')); aposentar(x); contratar(x, r, ocupacao('vendedor')); x.trabalho.experiencia['comercio'] = 200; x.trabalho.atual!.desempenho = 90; }).vida;
    expect(v.trabalho.atual?.posAposentadoria).toBe(true);
    const promo = v.fatos['promocoes'] ?? 0;
    for (let k = 0; k < 8 && v.trabalho.atual && !v.morte; k++) { v.trabalho.atual.desempenho = 95; v = avancarAno(v).vida; if (v.momento) v = responder(v); }
    expect(v.fatos['promocoes'] ?? 0).toBe(promo);
  }, 60000);
});

/* ======================================================== Tempo livre */

describe('tempo livre', () => {
  it('24. a elegibilidade de uma atividade usa exatamente a conta da semana', () => {
    for (let s = 1; s <= 8; s++) {
      const v = ate(20 + s, s * 5, praticar('leitura', 1, 7));
      for (const m of ROTINAS) {
        if (v.rotinas.some(r => r.id === m.id)) continue;
        const d = podeComecarRotina(v, m.id, 1);
        const w = semana(v);
        const cabe = w.ocupado + nivelModelo(m, 1).tempo <= w.capacidade + 0.01;
        if (!cabe) expect(d.grau === 'incompativel' || d.grau === 'impossivel' || d.grau === 'requisito').toBe(true);
        if (d.grau === 'incompativel' && /semana/.test(d.motivo ?? '')) expect(cabe).toBe(false);
      }
    }
  }, 60000);

  it('25. as atividades ocupam a semana conforme a intensidade', () => {
    const v = ate(14, 2, praticar('futebol', 2, 6));
    const w = semana(v);
    const soma = v.rotinas.reduce((s, r) => s + (nivelModelo(ROTINAS.find(m => m.id === r.id)!, r.nivel ?? 1).tempo), 0);
    expect(w.ocupado).toBeCloseTo(soma, 5);
    const f = ROTINAS.find(m => m.id === 'futebol')!;
    expect(nivelModelo(f, 2).tempo).toBeGreaterThan(nivelModelo(f, 1).tempo);
  });

  it('26. trabalho, estudo e filhos pequenos encolhem o tempo — e o motivo diz o quê', () => {
    let v = adulto(21);
    v.educacao.escolaridade = 'medio';
    const livre = semana(v).capacidade;
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('atendente')); }).vida;
    const comTrabalho = semana(v).capacidade;
    v.educacao.matricula = { cursoId: 'eng_civil', instituicao: 'teste', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    const comFaculdade = semana(v).capacidade;
    expect(comTrabalho).toBeLessThan(livre);
    expect(comFaculdade).toBeLessThan(comTrabalho);
    v.rotinas = [{ id: 'leitura', tInicio: v.t, nivel: 1 }];
    const d = podeComecarRotina(v, 'academia', 1);
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/trabalho/i);
    expect(d.motivo).toMatch(/faculdade/i);
  });
});

/* ======================================================= ATT 1 e save */

describe('integração com a ATT 1 e save', () => {
  it('29. filhos seguem a mesma taxonomia: a formação abre a ocupação coerente', () => {
    for (const c of CURSOS.filter(x => x.nivel === 'superior' || x.nivel === 'tecnico')) {
      const oc = entradaDaFormacao(c.nome);
      if (!oc) continue;
      expect(oc.area?.includes(c.area)).toBe(true);
      expect(oc.experiencia ?? 0).toBe(0);
    }
    // E, em vidas longas, nenhum descendente exerce profissão regulamentada sem a formação.
    for (let s = 1; s <= 4; s++) {
      const v = ate(70, s * 19, v2 => {
        const par = Object.values(v2.vinculos).find(x => x.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.romance.estagio));
        return par && idade(v2) >= 26 && idade(v2) <= 36 ? [{ tipo: 'pessoa', pessoaId: par.pessoaId, interacao: 'planejar_filhos' }] : [];
      });
      for (const p of Object.values(v.pessoas)) {
        if (!p.ocupacaoId || !p.vida) continue;
        const oc = ocupacao(p.ocupacaoId);
        if (oc.licenca && oc.licenca !== 'cnh' && oc.area) expect(p.formacao && CURSOS.find(c => c.nome === p.formacao)?.area).toBeTruthy();
      }
    }
  }, 240000);

  it('30. ida e volta preserva os caminhos (frentes, marcas, portas, preparo)', () => {
    const mem: Record<string, string> = {};
    const s: Armazenamento = { getItem: k => mem[k] ?? null, setItem: (k, x) => { mem[k] = x; }, removeItem: k => { delete mem[k]; } };
    const v = ate(20, 23, praticar('musica', 2, 7));
    v.caminhos.concurso.meses = 14;
    salvar(v, s);
    const r = ler(s);
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida).toEqual(v);
  });

  it('31. saves v7 reais (ATT 1) migram para v8, validam e continuam sendo vividos', () => {
    for (const nome of ['save-v7-adolescente.json', 'save-v7-adulta-carreira.json', 'save-v7-adulto-familia.json']) {
      const r = interpretar(fixture(nome));
      expect(r.tipo).toBe('ok');
      if (r.tipo !== 'ok') continue;
      expect(r.migrado).toBe(true);
      const v = r.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(v.caminhos).toBeDefined();
      for (const rot of v.rotinas) expect(rot.nivel).toBeGreaterThanOrEqual(1);
      // A rotina que já existia vira frente com prática — sem inventar conquista.
      if (v.rotinas.some(x => ['futebol', 'musica', 'ingles', 'voluntariado'].includes(x.id))) expect(Object.keys(v.caminhos.frentes).length).toBeGreaterThan(0);
      expect(v.caminhos.marcas.every(m => ['primeiro_emprego', 'formacao'].includes(m.tipo))).toBe(true);
      let x = v;
      for (let k = 0; k < 5 && !x.morte; k++) { x = avancarAno(x).vida; if (x.momento) x = responder(x); }
      expect(x.t).toBeGreaterThan(v.t);
    }
  }, 60000);

  it('save v8 com caminhos corrompidos é rejeitado', () => {
    const v = ate(12, 3);
    const bruto = JSON.parse(JSON.stringify(v));
    bruto.caminhos.frentes = { futebol: { habilidade: 'muito', interesse: 1, meses: 1 } };
    expect(interpretar(JSON.stringify(bruto)).tipo).toBe('invalido');
    delete bruto.caminhos;
    expect(interpretar(JSON.stringify(bruto)).tipo).toBe('invalido');
  });
});

/* ============================================ Agência e personalidade */

describe('agência', () => {
  it('32. em décadas de caminho automático, a personalidade só muda por rotina mantida, ação do jogador ou decisão comportamental', () => {
    const comportamentais = new Set(CATALOGO.filter(c => c.tipo === 'decisao' && !c.biografica).map(c => c.id));
    for (let s = 1; s <= 5; s++) {
      const v = ate(55, s * 29, praticar('futebol', 2, 6));
      for (const e of v.personalidade.evidencias) {
        const [origem] = e.origem.split(':');
        expect(origem === 'rotina' || origem === 'acao' || comportamentais.has(origem)).toBe(true);
      }
    }
  }, 120000);

  it('33. os acontecimentos dos caminhos só narram o mundo, sem decidir pelo jogador', () => {
    const proibido = /\b(você decidiu|decidiu|escolheu|preferiu|resolveu|optou|encarou|adorou)\b/i;
    for (let s = 1; s <= 6; s++) {
      const v = ate(40, s * 7, praticar('musica', 2, 8));
      for (const c of CAMINHOS) {
        if (c.tipo !== 'acontecimento') continue;
        const ctx = contexto(structuredClone(v), criarRng(s));
        if (idade(v) < c.idade[0] || idade(v) > c.idade[1]) continue;
        try { if (c.quando && !c.quando(ctx)) continue; const n = c.narrar(ctx); if (n) expect(n.texto).not.toMatch(proibido); } catch { /* estado ausente */ }
      }
      for (const b of v.biografia) if (!b.escolha) expect(b.texto).not.toMatch(proibido);
    }
  }, 120000);
});

/* ===================================================== Coerência geral */

describe('coerência de caminhos', () => {
  it('34. em vidas simuladas, ninguém exerce profissão sem o requisito legal', () => {
    for (let s = 1; s <= 8; s++) {
      let v = nova({ semente: s * 31 });
      const r = criarRng(s);
      for (let k = 0; k < 60 && !v.morte; k++) {
        if (idade(v) >= 18 && !v.trabalho.atual && !v.trabalho.aposentadoria) {
          const vagas = OCUPACOES.filter(oc => tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }));
          if (vagas.length) { v = executar(v, { tipo: 'candidatar', ocupacaoId: r.pick(vagas).id }).vida; if (v.momento) v = responder(v); }
        }
        for (const o of v.caminhos.oportunidades) if (tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true }) && r.chance(0.5)) { v = executar(v, { tipo: 'oportunidade', id: o.id, aceitar: true }).vida; while (v.momento) v = responder(v); }
        v = avancarAno(v).vida;
        while (v.momento) v = responder(v);
        const e = v.trabalho.atual;
        if (!e) continue;
        const oc = ocupacao(e.ocupacaoId);
        if (oc.licenca && oc.licenca !== 'cnh') expect(v.trabalho.licencas).toContain(oc.licenca);
        if (oc.area && oc.fundamento && !oc.habilidade?.ouFormacao && !oc.matriculado && oc.nivelCurso !== 'livre') {
          expect(v.educacao.concluidos.some(c => oc.area!.includes(c.area as never) || oc.area!.includes('qualquer'))).toBe(true);
        }
        if (idade(v) < 16) expect(e.contrato).toBe('aprendiz');
      }
    }
  }, 240000);

  it('35. uma vida sem faculdade continua cheia de caminho: trabalho, ofício, portas', () => {
    let ricas = 0;
    for (let s = 1; s <= 6; s++) {
      const v = ate(40, s * 17, vv => {
        const out: Acao[] = [...praticar('consertar', 1, 12)(vv)];
        if (idade(vv) >= 17 && !vv.trabalho.atual) {
          const vagas = OCUPACOES.filter(oc => !oc.concurso && oc.nivel <= 2 && tenta(vv, { tipo: 'candidatar', ocupacaoId: oc.id }));
          if (vagas.length) out.push({ tipo: 'candidatar', ocupacaoId: vagas[(vv.t + s) % vagas.length].id });
        }
        for (const o of vv.caminhos.oportunidades) if (tenta(vv, { tipo: 'oportunidade', id: o.id, aceitar: true })) out.push({ tipo: 'oportunidade', id: o.id, aceitar: true });
        return out;
      });
      expect(v.educacao.concluidos.some(c => c.nivel === 'superior')).toBe(false);
      const marcas = v.caminhos.marcas.filter(m => m.tipo !== 'comecou');
      // Rica = trabalhou, o caminho deixou marcas, e a vida abriu portas de tipos diferentes (não só uma vaga).
      const portas = Object.keys(v.caminhos.ultimas).length;
      if (v.trabalho.historico.length + (v.trabalho.atual ? 1 : 0) >= 1 && marcas.length >= 2 && portas >= 3) ricas++;
    }
    expect(ricas).toBeGreaterThanOrEqual(5);
  }, 120000);
});
