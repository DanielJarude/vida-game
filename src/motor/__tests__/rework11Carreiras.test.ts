/**
 * REWORK 11 · Fase B — estado profissional unificado e indicações (o motor).
 *
 * Cada cenário diz a pré-condição explicitamente: a vida da semente não decide o que se testa.
 *   CAR-11.1  `situacaoProfissional`: uma leitura só, coerente em vários estados (e com o campo novo da Fase C)
 *   CAR-11.2  as indicações: raras e da área para a carreira especial; a de fora dita como mudança; por conta sem entrevista
 *   A6/A4     aceitar um emprego com a carreira especial sem contrato pergunta antes — e o fim fica registrado
 *   10.6      as contratações fora de `propor` (a efetivação do aprendiz) passam pela conta de conflitos
 *   C3/C4     o vocabulário corporativo (chefia, curso da empresa) só onde há chefia e empresa
 */

import { describe, expect, it } from 'vitest';
import { adulto, pessoaNova } from './cenarios';
import { criarRng, type Rng } from '../rng';
import type { CarreiraEsportiva, Oportunidade, Vida } from '../tipos';
import { contratar, encerrarEmprego, processarTrabalho } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { vincular } from '../pessoas';
import { situacaoProfissional, temChefia, temEmpresa } from '../sistemas/situacaoProfissional';
import { analisarEntrada, contratarComAnalise, resolverPendente } from '../sistemas/compromissos';
import { aceitarOportunidade, novaOportunidade, processarOportunidades } from '../sistemas/oportunidades';
import { distanciaDaCarreira, leituraDaOportunidade, LIMIAR_MUDANCA, naturezaDaOportunidade } from '../sistemas/indicacoes';
import { verbosDoOficio } from '../sistemas/noOficio';
import { efetivarMatricula } from '../sistemas/escola';
import { interpretar } from '../save';

const recarregar = (v: Vida): Vida => { const l = interpretar(JSON.stringify(v)); if (l.tipo !== 'ok') throw new Error('save não abriu'); return l.vida; };

/** Um futebolista profissional consolidado (Série A, nome no mercado), com contrato no Sport. */
function futebolista(o: { semente?: number; reputacao?: number } = {}): Vida {
  const v = adulto(27, { semente: o.semente ?? 31, genero: 'masculino' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(1), ocupacao('jogador_futebol'));
  v.trabalho.atual!.empregador = 'o Sport';
  v.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 4, tInicio: v.t - 120, tFase: v.t - 96, lesoes: 0, municipioId: v.moradia.municipioId, reputacao: o.reputacao ?? 62, posicao: 'atacante', espaco: 'titular', contratoAte: v.t + 24 } as CarreiraEsportiva;
  // Quem vive do futebol sabe jogar (a frente que as temporadas construíram).
  v.caminhos.frentes.futebol = { interesse: 85, meses: 200, habilidade: 82, tInicio: v.t - 200, tUltimo: v.t, retomadas: 0, auge: 84 };
  return v;
}

/** O mesmo futebolista, sem clube: o contrato acabou e ninguém renovou (o estado que o motor do esporte deixa hoje). */
function semClube(v: Vida): Vida {
  const es = v.caminhos.esporte!;
  encerrarEmprego(v, 'fim do contrato');
  v.fatos['esp_sem_clube'] = v.t;
  es.espaco = undefined; es.contratoAte = undefined;
  return v;
}

/** Um técnico demitido (sem clube desde meio ano). */
function tecnicoSemClube(): Vida {
  const v = adulto(48, { semente: 7, genero: 'masculino' });
  v.trabalho.atual = undefined;
  v.caminhos.tecnico = { tInicio: v.t - 72, origem: 'ex_atleta', reputacao: 45, passagens: [{ clube: 'Náutico', municipioId: v.moradia.municipioId, nivel: 3, desde: v.t - 72, ate: v.t - 6, contratoAte: v.t + 6, salario: 30000, temporadas: [], saida: 'demissao', pressao: 60, vestiario: 50 }], semClubeDesde: v.t - 6 };
  v.trabalho.desempregadoDesde = v.t - 6;
  return v;
}

/** Amigos próximos, na mesma cidade, com a ocupação dita (quem pode indicar). */
function comAmigos(v: Vida, ocupacoes: string[]): void {
  for (const id of ocupacoes) {
    const oc = ocupacao(id);
    const p = pessoaNova(v, 32, 'feminino', { ocupacaoId: id, ocupacao: oc.nome[1], renda: 2500, municipioId: v.moradia.municipioId });
    vincular(v, p, { origem: 'amizade', proximidade: 85, convivio: [] } as never);
  }
}

/* ======================================================================= CAR-11.1 */

describe('CAR-11.1 · situacaoProfissional: uma leitura só, coerente', () => {
  it('empregado: emprego ativo, vínculo do contrato, onde é o empregador', () => {
    const v = adulto(30, { semente: 3 });
    v.trabalho.atual = undefined;
    const e = contratar(v, criarRng(2), ocupacao('aux_adm'));
    const s = situacaoProfissional(v);
    expect(s).toMatchObject({ carreira: 'emprego', situacao: 'ativo', vinculo: 'clt', especial: false, semVinculo: false });
    expect(s.onde?.nome).toBe(e.empregador);
    expect(s.contrato?.salario).toBe(e.salario);
  });

  it('atleta com clube: carreira de esporte, contrato esportivo com prazo e salário, o clube como lugar', () => {
    const v = futebolista();
    const s = situacaoProfissional(v);
    expect(s).toMatchObject({ carreira: 'esporte', situacao: 'ativo', vinculo: 'contrato_esportivo', especial: true, semVinculo: false });
    expect(s.onde?.nome).toBe('Sport');
    expect(s.contrato?.ate).toBe(v.caminhos.esporte!.contratoAte);
  });

  it('atleta sem clube: a carreira continua (sem clube), sem contrato nem salário, o Sport como ÚLTIMO clube', () => {
    const v = semClube(futebolista());
    const s = situacaoProfissional(v);
    expect(s).toMatchObject({ carreira: 'esporte', situacao: 'sem_clube', vinculo: 'nenhum', especial: true, semVinculo: true });
    expect(s.rotulo).toMatch(/sem clube/);
    expect(s.contrato).toBeUndefined();
    expect(s.onde).toBeUndefined();
    expect(s.ultimoOnde?.nome).toBe('Sport');
    expect(s.detalhe).toMatch(/último clube: Sport/);
  });

  it('funciona com o campo novo da Fase C (o clube atual limpo, o último guardado à parte)', () => {
    const v = semClube(futebolista());
    const es = v.caminhos.esporte!;
    es.clube = '';
    es.ultimoClube = { clube: 'Sport', municipioId: es.municipioId, nivel: es.nivel, ate: v.t - 2 };
    expect(situacaoProfissional(v).ultimoOnde?.nome).toBe('Sport');
    expect(situacaoProfissional(recarregar(v)).semVinculo).toBe(true);
  });

  it('técnico sem clube: carreira de técnico, sem clube desde a demissão, o último clube dito', () => {
    const s = situacaoProfissional(tecnicoSemClube());
    expect(s).toMatchObject({ carreira: 'tecnico', situacao: 'sem_clube', vinculo: 'nenhum', semVinculo: true });
    expect(s.rotulo).toMatch(/^Técnico sem clube/);
    expect(s.ultimoOnde?.nome).toBe('Náutico');
  });

  it('técnico no comando: o vínculo é o comando do clube (prazo e salário da passagem)', () => {
    const v = tecnicoSemClube();
    contratar(v, criarRng(3), ocupacao('tecnico_futebol'));
    v.caminhos.tecnico!.passagens.push({ clube: 'Santa Cruz', municipioId: v.moradia.municipioId, nivel: 2, desde: v.t, contratoAte: v.t + 24, salario: 40000, temporadas: [], pressao: 30, vestiario: 50 });
    v.caminhos.tecnico!.semClubeDesde = undefined;
    const s = situacaoProfissional(v);
    expect(s).toMatchObject({ carreira: 'tecnico', situacao: 'ativo', vinculo: 'comando', semVinculo: false });
    expect(s.onde?.nome).toBe('Santa Cruz');
    expect(s.contrato).toEqual({ ate: v.t + 24, salario: 40000 });
  });

  it('aposentado, autônomo e o outro trabalho ao lado da carreira parada', () => {
    const apo = adulto(66, { semente: 4 });
    apo.trabalho.atual = undefined;
    apo.trabalho.aposentadoria = { t: apo.t - 12, beneficio: 2500 };
    expect(situacaoProfissional(apo)).toMatchObject({ situacao: 'aposentado', vinculo: 'nenhum' });

    const aut = adulto(35, { semente: 5 });
    aut.trabalho.atual = undefined;
    contratar(aut, criarRng(4), ocupacao('manicure'));
    const s = situacaoProfissional(aut);
    expect(s).toMatchObject({ carreira: 'emprego', situacao: 'ativo', vinculo: 'autonomo' });
    expect(s.contrato).toBeUndefined(); // freguesia não é salário de contrato

    // O atleta sem clube que pegou um bico de manicure (antes da virada do ano): o principal é o trabalho de agora, e a
    // carreira parada aparece ao lado — nunca o salário da manicure como "salário do contrato".
    const v = semClube(futebolista());
    contratar(v, criarRng(5), ocupacao('manicure'));
    const x = situacaoProfissional(v);
    expect(x.carreira).toBe('emprego');
    expect(x.paralelas.some(p => p.tipo === 'carreira_parada' && /sem clube/.test(p.rotulo))).toBe(true);
  });

  it('o negócio nas horas vagas aparece como atividade paralela do empregado', () => {
    const v = adulto(36, { semente: 6 });
    v.trabalho.atual = undefined;
    contratar(v, criarRng(6), ocupacao('aux_adm'));
    v.caminhos.negocio = { tipo: 'salao', nome: 'Salão Rita', ocupacaoId: 'dono_salao', tInicio: v.t - 12, capital: 20000, clientela: 30, estado: 'comecando', anosNoVermelho: 0, caixa: 0, porte: 1, unidades: 1, equipe: [], reputacao: 30, historico: [], dedicacao: 'paralela', melhorias: [] } as never;
    const s = situacaoProfissional(v);
    expect(s.carreira).toBe('emprego');
    expect(s.paralelas.some(p => p.tipo === 'negocio' && p.rotulo.startsWith('Salão Rita'))).toBe(true);
  });
});

/* ======================================================================= CAR-11.2 */

/** Quantas indicações (de conhecidos) a vida recebe em `n` anos-tentativa, e quais. */
function indicacoesEm(base: Vida, n: number): Oportunidade[] {
  const out: Oportunidade[] = [];
  for (let k = 0; k < n; k++) {
    const v = structuredClone(base);
    v.caminhos.oportunidades = [];
    v.caminhos.ultimas = {};
    v.t += k; // cada tentativa num mês (o sorteio derivado muda com o tempo)
    processarOportunidades(v, criarRng(1000 + k));
    out.push(...v.caminhos.oportunidades.filter(o => o.tipo === 'indicacao' && o.titulo.startsWith('Indicação de') && !/da sua turma/.test(o.titulo)));
  }
  return out;
}

describe('CAR-11.2 · indicações pela carreira de quem recebe', () => {
  it('o futebolista consolidado sem clube recebe indicação raramente — e a de fora da área vem dita como mudança de carreira', () => {
    const atleta = semClube(futebolista());
    comAmigos(atleta, ['manicure', 'manicure', 'atendente', 'caixa']);
    const comum = structuredClone(atleta);
    comum.caminhos.esporte = undefined; // a mesma vida, sem a carreira de atleta: desempregado comum
    delete comum.fatos['esp_sem_clube'];
    const n = 160;
    const doAtleta = indicacoesEm(atleta, n);
    const doComum = indicacoesEm(comum, n);
    expect(doComum.length).toBeGreaterThan(20);
    // Rara: bem menos da metade do que recebe quem não tem carreira (a chance é 0,3× e, fora da área, só às vezes).
    expect(doAtleta.length).toBeLessThan(doComum.length * 0.35);
    for (const o of doAtleta) {
      expect(o.natureza).toBe('mudanca_carreira');
      expect(o.texto).toMatch(/Seria outra carreira/);
      expect(leituraDaOportunidade(atleta, o).mudanca).toMatch(/É outra carreira/);
    }
  });

  it('com um conhecido da própria área, a indicação do atleta sem clube vem da área (o esporte), não da amiga manicure', () => {
    const atleta = semClube(futebolista());
    comAmigos(atleta, ['manicure', 'manicure', 'treinador_escolinha']);
    const lista = indicacoesEm(atleta, 220);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every(o => ocupacao(o.ocupacaoId!).setor === 'esporte')).toBe(true);
    expect(lista.every(o => distanciaDaCarreira(atleta, ocupacao(o.ocupacaoId!)) < LIMIAR_MUDANCA)).toBe(true);
  });

  it('para quem não tem carreira especial, a vaga é pontuada pela estrada de quem recebe (o cozinheiro ouve de cozinha)', () => {
    const v = adulto(34, { semente: 8 });
    v.trabalho.atual = undefined;
    v.trabalho.historico = [{ ...contratar(structuredClone(v), criarRng(7), ocupacao('cozinheiro')), tFim: v.t - 6, motivo: 'demissão' }];
    v.trabalho.experiencia = { alimentacao: 96 };
    v.trabalho.desempregadoDesde = v.t - 6;
    comAmigos(v, ['manicure', 'vendedor', 'garcom']);
    const lista = indicacoesEm(v, 120);
    expect(lista.length).toBeGreaterThan(5);
    const daCozinha = lista.filter(o => ocupacao(o.ocupacaoId!).trilha === 'alimentacao').length;
    expect(daCozinha / lista.length).toBeGreaterThan(0.6);
  });

  it('atividade autônoma: sem entrevista, e o texto diz isso; a vaga de salão continua com entrevista', () => {
    const v = adulto(30, { semente: 9 });
    v.trabalho.atual = undefined;
    const conta = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 't1', titulo: 'Indicação de Adele', texto: 'x' })!;
    const salao = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure_salao', meses: 12, chave: 't2', titulo: 'Indicação de Bia', texto: 'y' })!;
    expect(leituraDaOportunidade(v, conta)).toMatchObject({ entrevista: false, porConta: true, natureza: 'por_conta', via: 'indicacao' });
    expect(leituraDaOportunidade(v, salao)).toMatchObject({ entrevista: true, porConta: false, natureza: 'emprego' });
    // O texto gerado para a indicação por conta não promete entrevista.
    comAmigos(v, ['manicure', 'manicure', 'manicure']);
    const geradas = indicacoesEm(v, 80).filter(o => o.ocupacaoId === 'manicure');
    expect(geradas.length).toBeGreaterThan(0);
    for (const o of geradas) { expect(o.texto).toMatch(/sem entrevista/); expect(o.texto).not.toMatch(/com entrevista/); }
    // Aceitar começa por conta, sem processo de entrevista.
    const res = aceitarOportunidade(v, criarRng(8), conta.id);
    expect(res.entrevista).toBeUndefined();
    expect(v.caminhos.processo).toBeUndefined();
    expect((v.trabalho as Vida['trabalho']).atual?.ocupacaoId).toBe('manicure');
  });

  it('a porta de um save antigo (sem o campo novo) tem a natureza deduzida', () => {
    const v = semClube(futebolista());
    expect(naturezaDaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure' })).toBe('mudanca_carreira');
    expect(naturezaDaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'treinador_escolinha' })).toBe('por_conta');
    expect(naturezaDaOportunidade(v, { tipo: 'temporario', ocupacaoId: 'atendente' })).toBe('ocasional');
    expect(naturezaDaOportunidade(v, { tipo: 'peneira' })).toBe('propria');
  });
});

/* ======================================================================= A6 / A4 */

describe('A6 · aceitar outro trabalho com a carreira especial sem contrato pergunta antes', () => {
  it('atleta sem clube + indicação de manicure: "conhecer"/aceitar não encerra nada sem confirmação; a pergunta diz que encerra', () => {
    const v = semClube(futebolista());
    const o = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 't', titulo: 'Indicação de Adele', texto: 'x', natureza: 'mudanca_carreira' })!;
    aceitarOportunidade(v, criarRng(9), o.id);
    expect(v.caminhos.esporte!.fase).toBe('profissional');
    expect(v.trabalho.atual).toBeUndefined();
    const p = v.caminhos.pendente!;
    expect(p).toBeTruthy();
    expect(p.conflitos.join(' ')).toMatch(/sem clube/);
    expect(p.planos.some(x => /encerrar a carreira de jogador/.test(x.texto))).toBe(true);
    expect(p.planos.some(x => x.recusa)).toBe(true);
  });

  it('recusar mantém a carreira; aceitar encerra NA HORA, com registro (e sem o fato pendurado)', () => {
    const base = semClube(futebolista());
    const o = novaOportunidade(base, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 't', titulo: 'Indicação de Adele', texto: 'x' })!;
    aceitarOportunidade(base, criarRng(10), o.id);

    const recusa = structuredClone(base);
    resolverPendente(recusa, criarRng(11), recusa.caminhos.pendente!.planos.findIndex(x => x.recusa));
    expect(recusa.caminhos.esporte!.fase).toBe('profissional');
    expect(recusa.trabalho.atual).toBeUndefined();

    const aceita = structuredClone(base);
    const bio0 = aceita.biografia.length;
    resolverPendente(aceita, criarRng(12), aceita.caminhos.pendente!.planos.findIndex(x => /encerrar a carreira/.test(x.texto)));
    expect(aceita.caminhos.esporte!.fase).toBe('encerrada');
    expect(aceita.caminhos.esporte!.motivoFim).toBe('escolha');
    expect(aceita.fatos['esp_sem_clube']).toBeUndefined();
    expect(aceita.trabalho.atual?.ocupacaoId).toBe('manicure');
    expect(aceita.biografia.slice(bio0).some(x => /Pendurou as chuteiras/.test(x.texto))).toBe(true);
  });

  it('técnico sem clube: a pergunta diz que dá para seguir em paralelo — e a carreira de técnico continua', () => {
    const v = tecnicoSemClube();
    const c = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'aux_adm', via: 'indicacao' }).find(x => x.com === 'carreira')!;
    expect(c).toBeTruthy();
    expect(c.alternativas.map(a => a.texto).join(' ')).toMatch(/em paralelo/);
    const r = contratarComAnalise(v, criarRng(13), ocupacao('aux_adm'), 'indicacao', { substitui: false });
    expect(r.resultado).toBe('pendente');
    resolverPendente(v, criarRng(14), v.caminhos.pendente!.planos.findIndex(x => !x.recusa));
    expect(v.trabalho.atual?.ocupacaoId).toBe('aux_adm');
    expect(v.caminhos.tecnico!.tFim).toBeUndefined();
  });

  it('atleta COM clube que troca de trabalho: o plano diz que encerra a carreira, e ela acaba com registro (não em silêncio na virada)', () => {
    const v = futebolista();
    const c = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'aux_adm', via: 'indicacao' }).find(x => x.com === 'emprego')!;
    expect(c.alternativas[0].texto).toMatch(/encerrar a carreira/);
    contratarComAnalise(v, criarRng(15), ocupacao('aux_adm'), 'indicacao', { substitui: false });
    const bio0 = v.biografia.length;
    resolverPendente(v, criarRng(16), v.caminhos.pendente!.planos.findIndex(x => /encerrar a carreira/.test(x.texto)));
    expect(v.caminhos.esporte!.fase).toBe('encerrada');
    expect(v.biografia.slice(bio0).some(x => /Pendurou as chuteiras/.test(x.texto))).toBe(true);
    expect(v.trabalho.atual?.ocupacaoId).toBe('aux_adm');
  });
});

/* ======================================================================= Pendência 10.6 */

/** Um sorteio que diz sim a tudo (para forçar a efetivação do aprendiz), sem mexer no resto. */
function sempreSim(): Rng {
  const r = criarRng(17);
  return { ...r, chance: () => true, normal: () => 0, next: () => 0.5 };
}

function aprendizNoFim(faculdadeIntegral: boolean): Vida {
  const v = adulto(19, { semente: 12 });
  v.trabalho.atual = undefined;
  v.educacao.basica = undefined;
  v.educacao.escolaridade = 'medio';
  if (faculdadeIntegral) efetivarMatricula(v, { tipo: 'curso', cursoId: 'enfermagem', via: 'vestibular', modalidade: 'presencial', rede: 'publica', mensalidade: 0, municipioId: v.moradia.municipioId, instituicao: 'UFPE' });
  const e = contratar(v, criarRng(18), ocupacao('jovem_aprendiz'));
  e.tInicio = v.t - 25;
  e.desempenho = 100;
  v.caminhos.pendente = undefined;
  return v;
}

describe('10.6 · contratações fora de propor passam pela conta de conflitos', () => {
  it('efetivação do aprendiz com a faculdade integral em curso: a vida pergunta (não um contrato silencioso em cima da aula)', () => {
    const v = aprendizNoFim(true);
    expect(v.educacao.matricula).toBeTruthy();
    processarTrabalho(v, sempreSim());
    expect(v.trabalho.atual).toBeUndefined();
    expect(v.caminhos.pendente?.novo).toMatchObject({ tipo: 'emprego', ocupacaoId: 'aux_adm', via: 'efetivacao' });
    expect(v.caminhos.pendente!.conflitos.join(' ')).toMatch(/Enfermagem/);
    expect(v.caminhos.pendente!.planos.some(p => /trancar/.test(p.texto))).toBe(true);
  });

  it('sem conflito, a efetivação entra direto (sem pergunta desnecessária), com o texto de sempre', () => {
    const v = aprendizNoFim(false);
    processarTrabalho(v, sempreSim());
    expect(v.caminhos.pendente).toBeUndefined();
    expect(v.trabalho.atual?.ocupacaoId).toBe('aux_adm');
    expect(v.biografia.some(x => /efetivou como auxiliar administrativ/.test(x.texto))).toBe(true);
  });

  it('o ajuste da contratação fica guardado com a pergunta (e vale quando ela é respondida)', () => {
    const v = aprendizNoFim(true);
    v.trabalho.atual = undefined;
    const r = contratarComAnalise(v, criarRng(19), ocupacao('aux_adm'), 'proposta', { ajuste: { salarioMinimo: 9990 } });
    expect(r.resultado).toBe('pendente');
    const salvo = recarregar(v);
    resolverPendente(salvo, criarRng(20), salvo.caminhos.pendente!.planos.findIndex(p => /trancar/.test(p.texto)));
    expect(salvo.trabalho.atual?.ocupacaoId).toBe('aux_adm');
    expect(salvo.trabalho.atual!.salario).toBeGreaterThanOrEqual(9990);
    expect(salvo.educacao.matricula?.trancado).toBe(true);
  });
});

/* ======================================================================= C3 / C4 (o mecanismo genérico) */

describe('C4 · chefia e "curso da empresa" só onde existem', () => {
  const base = adulto(35, { semente: 5 });
  const rotulos = (id: string) => {
    const v = structuredClone(base);
    v.trabalho.atual = undefined;
    const e = contratar(v, criarRng(1), ocupacao(id));
    e.formacaoAte = undefined;
    return { v, e, verbos: verbosDoOficio(v).map(x => x.rotulo).join(' | ') };
  };

  it('nenhum autônomo, sócio, bolsista ou árbitro recebe "Almoçar com a chefia" ou "curso da empresa"', () => {
    for (const oc of OCUPACOES.filter(o => o.contrato === 'autonomo' || o.contrato === 'informal')) {
      const { verbos } = rotulos(oc.id);
      expect(verbos, oc.id).not.toMatch(/chefia|curso da empresa/);
    }
  });

  it('o serviço público e a farda fazem o curso do órgão / da corporação; a empresa, o da empresa', () => {
    expect(rotulos('tecnico_publico').verbos).toMatch(/curso do órgão/);
    expect(rotulos('soldado_pm').verbos).toMatch(/da corporação/);
    expect(rotulos('aux_adm').verbos).toMatch(/curso da empresa/);
    expect(rotulos('baba').verbos).not.toMatch(/chefia|curso da empresa/);
  });

  it('temEmpresa: não para o clube do técnico, a companhia do artista, o órgão; temChefia: não para quem trabalha por conta', () => {
    for (const id of ['tecnico_futebol', 'auxiliar_tecnico', 'bailarino', 'tecnico_publico', 'soldado_pm']) expect(temEmpresa(rotulos(id).e), id).toBe(false);
    for (const id of ['aux_adm', 'dev_jr', 'enfermeiro']) expect(temEmpresa(rotulos(id).e), id).toBe(true);
    for (const id of ['manicure', 'socio_advocacia', 'escritor', 'arbitro']) expect(temChefia(rotulos(id).e), id).toBe(false);
  });
});
