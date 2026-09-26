/**
 * REWORK Caminhos, Agência e UX: "quero tentar construir determinada vida —
 * o jogo deve me deixar entender como perseguir isso, sem garantir que eu
 * vá conseguir."
 *
 * Cada bloco prova um elo da cadeia intenção → descoberta → requisitos →
 * preparação → tentativa → resultado → explicação → próximo passo, num caminho
 * que estava quebrado no playtest.
 */

import { describe, expect, it } from 'vitest';
import type { Dominio, Vida } from '../tipos';
import type { Acao } from '../acoes';
import { disponibilidade, executar } from '../acoes';
import { adulto } from './cenarios';
import { nova, responderTudo, viverAte } from './ajuda';
import { criarRng } from '../rng';
import { transacao } from '../nucleo';
import { avancarAno } from '../ano';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import { contratar, degrausAcima, elegibilidade, horizonte, modeloDeTrabalho, porContaPropria, proximoPasso, titulacaoNaTrilha } from '../sistemas/trabalho';
import { areaDaPos, nomeDaFormacao, nomeDaMatricula } from '../sistemas/escola';
import { vagasEmCamadas } from '../sistemas/relevancia';
import { perfilParaVaga } from '../sistemas/empregabilidade';
import { ambienteDoTrabalho, noTrabalho } from '../sistemas/ambiente';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { chanceNoConcurso, lerPreparo, preparoPara, trajetoriaParaConcurso } from '../sistemas/concurso';
import { lerTecnica, NIVEL_TECNICA } from '../sistemas/peneira';
import { caminhosPossiveis, emConstrucao } from '../sistemas/caminhosDeVida';
import { entrarNaPolitica, podeConcorrer, proximaEleicao, leituraPolitica } from '../sistemas/politica';
import { exportarVida, importarVida, interpretar, migrarV14, VERSAO_SAVE } from '../save';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { podeTentar } from '../plausibilidade';

const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);

/** Formada numa área (com pós, mestrado, doutorado herdando a área, na ordem). */
function formar(v: Vida, area: string, ...niveis: ('superior' | 'pos' | 'mestrado' | 'doutorado')[]) {
  let t = v.t - 12 * (niveis.length * 3);
  for (const n of niveis) {
    const c = n === 'superior' ? curso(area) : n === 'pos' ? curso('especializacao') : curso(n);
    const a = n === 'superior' ? c.area : areaDaPos(v, c) ?? c.area;
    v.educacao.concluidos.push({ cursoId: c.id, nome: nomeDaFormacao(c, a), nivel: c.nivel, area: a, tFim: t, instituicao: 'x' });
    t += 36;
  }
  v.educacao.escolaridade = niveis[niveis.length - 1] === 'pos' ? 'pos' : niveis[niveis.length - 1];
}

function empregar(v: Vida, id: string, anosNaTrilha = 0, anosNoPosto = anosNaTrilha) {
  const oc = ocupacao(id);
  const e = contratar(v, criarRng(3), oc, 'teste');
  e.tInicio = v.t - anosNaTrilha * 12;
  e.tPosto = v.t - anosNoPosto * 12;
  v.trabalho.experiencia[oc.trilha] = anosNaTrilha * 12;
  return e;
}

/* =========================================================== Formação */

describe('formação avançada com identidade', () => {
  it('o mestrado e o doutorado carregam a área da graduação ("Doutorado em Nutrição")', () => {
    const v = adulto(34);
    formar(v, 'nutricao', 'superior', 'mestrado', 'doutorado');
    const nomes = v.educacao.concluidos.map(c => c.nome);
    expect(nomes).toContain('Mestrado em Nutrição');
    expect(nomes).toContain('Doutorado em Nutrição');
    expect(v.educacao.concluidos.every(c => c.area !== 'qualquer')).toBe(true);
  });

  it('a matrícula guarda a área e o nome sai inteiro na tela', () => {
    const v = adulto(26);
    formar(v, 'psicologia', 'superior');
    const w = transacao(v, x => { x.educacao.matricula = { cursoId: 'mestrado', instituicao: 'UF', rede: 'publica', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 24, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId, area: areaDaPos(x, curso('mestrado')) }; }).vida;
    expect(nomeDaMatricula(w)).toBe('Mestrado em Psicologia');
  });

  it('o MBA não herda área (é de gestão para qualquer um)', () => {
    const v = adulto(30);
    formar(v, 'nutricao', 'superior');
    expect(areaDaPos(v, curso('mba'))).toBeUndefined();
    expect(nomeDaFormacao(curso('mba'), 'nutricao')).toBe('MBA em Gestão');
  });

  it('save v14 → v15: o doutorado genérico ganha a área pela ordem das formações (idempotente)', () => {
    const v = adulto(40);
    v.educacao.concluidos = [
      { cursoId: 'nutricao', nome: 'Nutrição', nivel: 'superior', area: 'nutricao', tFim: v.t - 150, instituicao: 'x' },
      { cursoId: 'mestrado', nome: 'Mestrado', nivel: 'mestrado', area: 'qualquer', tFim: v.t - 120, instituicao: 'x' },
      { cursoId: 'doutorado', nome: 'Doutorado', nivel: 'doutorado', area: 'qualquer', tFim: v.t - 70, instituicao: 'x' },
      { cursoId: 'mba', nome: 'MBA em Gestão', nivel: 'pos', area: 'qualquer', tFim: v.t - 20, instituicao: 'x' }
    ];
    const bruto = JSON.parse(JSON.stringify({ ...v, versao: 14 }));
    const lido = interpretar(JSON.stringify(bruto));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(lido.vida.versao).toBe(VERSAO_SAVE);
    expect(lido.vida.educacao.concluidos.map(c => c.nome)).toEqual(['Nutrição', 'Mestrado em Nutrição', 'Doutorado em Nutrição', 'MBA em Gestão']);
    const de_novo = migrarV14(JSON.parse(JSON.stringify(lido.vida)));
    expect(de_novo.educacao.concluidos.map(c => c.nome)).toEqual(lido.vida.educacao.concluidos.map(c => c.nome));
  });
});

/* ============================================ A vida acumulada muda o futuro */

describe('formação e estrada transformam as oportunidades', () => {
  it('doutorado na área conta como estrada (e diz isso); o de outra área, não', () => {
    const v = adulto(34);
    formar(v, 'nutricao', 'superior', 'mestrado', 'doutorado');
    const esp = ocupacao('nutricionista_especialista');
    expect(titulacaoNaTrilha(v, esp).meses).toBe(36);
    const d = elegibilidade(v, esp);
    expect(podeTentar(d)).toBe(true);
    expect(d.motivo ?? '').toMatch(/contando o doutorado em Nutrição como estrada/);
    const w = adulto(34, { semente: 12 });
    formar(w, 'psicologia', 'superior', 'mestrado', 'doutorado');
    expect(titulacaoNaTrilha(w, esp).meses).toBe(0);
  });

  it('a nutricionista com doutorado vê a trajetória dela primeiro — não diarista nem doméstica', () => {
    const v = adulto(36);
    formar(v, 'nutricao', 'superior', 'mestrado', 'doutorado');
    v.trabalho.licencas.push('crn' as never);
    const c = vagasEmCamadas(v);
    const primeira = c.trajetoria.map(x => x.item.oc.id);
    expect(primeira.some(id => ['nutricionista', 'nutricionista_especialista', 'professor_faculdade'].includes(id))).toBe(true);
    for (const id of ['diarista', 'trabalhador_domestico', 'confeiteiro', 'cuidador']) expect(primeira).not.toContain(id);
    // Outros caminhos seguem possíveis.
    expect(c.outras.length + c.relacionadas.length).toBeGreaterThan(0);
  });

  it('a docência superior abre para quem tem mestrado, por seleção (não concurso)', () => {
    const v = adulto(30);
    formar(v, 'nutricao', 'superior', 'mestrado');
    const fac = ocupacao('professor_faculdade');
    expect(fac.concurso).toBeFalsy();
    expect(podeTentar(elegibilidade(v, fac))).toBe(true);
    const w = adulto(30, { semente: 13 });
    formar(w, 'nutricao', 'superior');
    expect(podeTentar(elegibilidade(w, fac))).toBe(false);
  });

  it('as carreiras de graduação ganharam um degrau acima (nenhuma fica presa no primeiro cargo)', () => {
    for (const id of ['nutricionista', 'farmaceutico', 'arquiteto', 'personal', 'dentista']) expect(OCUPACOES.some(o => o.trilha === ocupacao(id).trilha && o.nivel === ocupacao(id).nivel + 1)).toBe(true);
  });

  it('a rejeição explica com o currículo (formação atendida × experiência que faltou)', () => {
    const v = adulto(26);
    formar(v, 'nutricao', 'superior');
    const esp = ocupacao('nutricionista_especialista');
    v.trabalho.experiencia['nutricao'] = 30;
    const p = perfilParaVaga(v, esp);
    expect(p.fortes.join(' ')).toMatch(/formação/);
    expect(p.fracos.join(' ')).toMatch(/Pedem 4 anos/);
  });
});

/* ======================================================== Próximo passo */

describe('o próximo passo da carreira, requisito por requisito', () => {
  it('cabo da PM: idade, tempo de corporação e tempo no posto com o tipo certo — nunca "formação: 31 anos"', () => {
    const v = adulto(27);
    empregar(v, 'cabo_pm', 8, 2);
    const pp = proximoPasso(v)!;
    expect(pp.destino).toMatch(/sargento/i);
    const tipos = pp.requisitos.map(r => r.tipo);
    expect(tipos).toContain('idade');
    expect(tipos).toContain('servico');
    expect(tipos).toContain('posto');
    expect(pp.requisitos.find(r => r.tipo === 'idade')!.texto).toMatch(/Mínima de 31 anos/);
    expect(pp.requisitos.every(r => r.tipo !== 'formacao')).toBe(true);
    expect(pp.resumo).toMatch(/Pela antiguidade, a promoção a sargento da PM deve vir por volta de \d{4}/);
    expect(horizonte(v)).not.toMatch(/pede formação/);
    // A previsão é o maior dos prazos de tempo.
    expect(pp.previsao).toBe(Math.max(...pp.requisitos.filter(r => r.ano).map(r => r.ano!)));
  });

  it('mérito: o que falta é desempenho e vaga, e a formação só quando pede de verdade', () => {
    const v = adulto(30);
    formar(v, 'administracao', 'superior');
    const e = empregar(v, 'analista_adm', 7, 3);
    e.desempenho = 50;
    const pp = proximoPasso(v)!;
    expect(pp.como).toBe('merito');
    expect(pp.requisitos.some(r => r.tipo === 'desempenho' && !r.ok)).toBe(true);
    expect(pp.requisitos[pp.requisitos.length - 1].tipo).toBe('vaga');
  });

  it('promoção é marco da vida, com o degrau nomeado', () => {
    // Soldado com o tempo cumprido, bom conceito: a antiguidade traz o cabo em poucos anos.
    let v = adulto(30);
    v = transacao(v, x => { empregar(x, 'soldado_pm', 8, 8); x.trabalho.atual!.desempenho = 80; }).vida;
    for (let k = 0; k < 8 && v.trabalho.atual?.ocupacaoId === 'soldado_pm'; k++) v = responderTudo(avancarAno(v).vida);
    expect(v.trabalho.atual?.ocupacaoId).toBe('cabo_pm');
    expect(v.biografia.some(b => b.relevancia === 'marco' && /Promovid[oa] a cabo da PM/.test(b.texto))).toBe(true);
  });
});

/* ================================================= Ambiente de trabalho */

describe('acontecimentos de trabalho pelo AMBIENTE, não pelo cargo', () => {
  it('diarista por conta trabalha em casas de clientes: sem chefia, colegas nem relatório', () => {
    const v = adulto(30);
    empregar(v, 'diarista', 3);
    const a = ambienteDoTrabalho(v);
    expect(a.has('residencias')).toBe(true);
    expect(a.has('clientes')).toBe(true);
    expect(a.has('chefia')).toBe(false);
    expect(a.has('escritorio')).toBe(false);
    expect(preparar(conteudoPorId('trab_erro')!, v, criarRng(1))).toBeNull();
    expect(preparar(conteudoPorId('trab_assedio')!, v, criarRng(1))).toBeNull();
  });

  it('trabalhadora doméstica de carteira tem patroa, mas não "a empresa"', () => {
    const v = adulto(30);
    empregar(v, 'trabalhador_domestico', 3);
    expect(v.trabalho.atual!.empregador).toMatch(/família|casa/);
    expect(noTrabalho(v, 'organizacao')).toBe(false);
    expect(preparar(conteudoPorId('car_curso_empresa')!, v, criarRng(1))).toBeNull();
  });

  it('assistente de escritório tem chefia, colegas e papel (o erro do relatório cabe)', () => {
    const v = adulto(30);
    empregar(v, 'assistente_adm', 3);
    expect(noTrabalho(v, 'chefia', 'colegas', 'organizacao', 'escritorio')).toBe(true);
  });

  it('dono de negócio tem gestão e clientes, não chefia', () => {
    const v = adulto(35);
    empregar(v, 'dono_lanchonete', 4);
    v.caminhos.negocio = { tipo: 'lanchonete', nome: 'Lanchonete X', tInicio: v.t - 48, clientela: 40, estado: 'firme', ocupacaoId: 'dono_lanchonete' } as never;
    const a = ambienteDoTrabalho(v);
    expect(a.has('gestao')).toBe(true);
    expect(a.has('chefia')).toBe(false);
  });
});

/* ============================================================ Concurso */

describe('preparação com direção', () => {
  it('estudo dirigido rende mais no edital da área; dirigido para outra área rende menos', () => {
    const v = adulto(24);
    v.educacao.escolaridade = 'medio';
    const pm = ocupacao('aluno_pm');
    v.caminhos.concurso.meses = 24;
    const geral = preparoPara(v, pm);
    v.caminhos.concurso.foco = 'policial'; v.caminhos.concurso.mesesFoco = 24;
    const dirigido = preparoPara(v, pm);
    v.caminhos.concurso.foco = 'fiscal';
    const outro = preparoPara(v, pm);
    expect(dirigido).toBeGreaterThan(geral);
    expect(outro).toBeLessThan(geral);
  });

  it('a cabo da PM com anos de farda não é só "alguém que estudou": a trajetória conta e é dita', () => {
    const v = adulto(33);
    formar(v, 'direito', 'superior');
    empregar(v, 'cabo_pm', 12, 5);
    const oc = ocupacao('policial_civil');
    const t = trajetoriaParaConcurso(v, oc);
    expect(t.meses).toBeGreaterThan(0);
    expect(t.motivos.join(' ')).toMatch(/anos de farda/);
    const w = adulto(33, { semente: 14 });
    formar(w, 'administracao', 'superior');
    v.caminhos.concurso.meses = w.caminhos.concurso.meses = 36;
    expect(chanceNoConcurso(v, oc)).toBeGreaterThan(chanceNoConcurso(w, oc));
  });

  it('a leitura do preparo diz o nível e compara com a última tentativa', () => {
    let v = adulto(25);
    v.educacao.escolaridade = 'superior';
    const oc = ocupacao('tecnico_publico');
    v.caminhos.concurso.meses = 4;
    v.caminhos.devolutivas.push({ t: v.t - 12, tipo: 'concurso', titulo: 'x', texto: 'x', passou: false, ocupacaoId: oc.id, nivel: 0 });
    v.caminhos.concurso.meses = 30;
    const l = lerPreparo(v, oc);
    expect(l.nivel).toBeGreaterThan(0);
    expect(l.desde).toMatch(/subiu de "sem preparo"/);
    void v;
  });

  it('dirigir o estudo é ação do jogador, com requisito dito', () => {
    const v = adulto(22);
    expect(disponibilidade(v, P('foco_concurso', 'policial')).motivo).toMatch(/Primeiro, estudar para concurso/);
    v.rotinas.push({ id: 'estudar_concurso', tInicio: v.t, nivel: 2 });
    const r = executar(v, P('foco_concurso', 'policial'));
    expect(r.vida.caminhos.concurso.foco).toBe('policial');
  });
});

/* ============================================================ Esporte */

function atleta(i: number, d: Dominio, h: number, nivel: 1 | 2 | 3 = 2): Vida {
  let v = viverAte(nova({ semente: 77 }), i);
  v = transacao(v, x => {
    x.rotinas = x.rotinas.filter(r => r.id !== d);
    x.rotinas.push({ id: d, tInicio: x.t - 60, nivel });
    x.caminhos.frentes[d] = { interesse: 80, meses: 60, habilidade: h, tInicio: x.t - 60, tUltimo: x.t, retomadas: 0, auge: h };
    x.trabalho.atual = undefined;
    x.caminhos.esporte = undefined;
    for (const o of x.caminhos.oportunidades) void o;
    x.caminhos.oportunidades = [];
  }).vida;
  return v;
}

describe('esporte perseguível: pedir o teste, saber a técnica, ver o progresso', () => {
  it('quem treina a sério pode pedir um teste; quem não treina ouve o que falta', () => {
    const v = atleta(14, 'volei', 62, 2);
    expect(podeTentar(disponibilidade(v, P('pedir_teste', 'volei')))).toBe(true);
    const w = atleta(14, 'volei', 62, 1);
    expect(disponibilidade(w, P('pedir_teste', 'volei')).motivo).toMatch(/a sério/);
  });

  it('pedir o teste abre a peneira de duas etapas; o resultado guarda a técnica e diz o nível', () => {
    let v = atleta(14, 'volei', 60, 2);
    v = executar(v, P('pedir_teste', 'volei')).vida;
    expect(v.momento?.situacaoId).toBe('esp_peneira');
    v = responderTudo(v);
    const d = v.caminhos.devolutivas.find(x => x.tipo === 'peneira');
    expect(d).toBeDefined();
    expect(d!.nivel).toBeDefined();
    if (!d!.passou && d!.falta === 'tecnica') expect(d!.texto).toMatch(/A técnica está "/);
  });

  it('a segunda peneira diz se o treino apareceu desde a primeira', () => {
    let v = atleta(14, 'futebol', 58, 2);
    v = responderTudo(executar(v, P('pedir_teste', 'futebol')).vida);
    v = transacao(v, x => { x.caminhos.frentes.futebol!.habilidade = 69; x.caminhos.ultimas['peneira_futebol'] = x.t - 13; x.caminhos.esporte = undefined; }).vida;
    const l = lerTecnica(v, 'futebol');
    expect(l.desde).toMatch(/evoluiu: de "(de escolinha|ainda longe do nível de uma base)" para "perto do nível de uma base"/);
    expect(NIVEL_TECNICA[l.nivel]).toBe('perto do nível de uma base');
  });

  it('o teste respeita a janela das bases e o intervalo entre tentativas', () => {
    const v = atleta(21, 'futebol', 70, 3);
    expect(disponibilidade(v, P('pedir_teste', 'futebol')).motivo).toMatch(/janela/);
    const w = atleta(15, 'futebol', 70, 3);
    w.caminhos.ultimas['peneira_futebol'] = w.t - 3;
    expect(disponibilidade(w, P('pedir_teste', 'futebol')).motivo).toMatch(/um ano entre/);
  });

  it('"O que você está construindo" mostra a técnica, o que falta e o passo', () => {
    const v = atleta(14, 'volei', 64, 2);
    const c = emConstrucao(v, disponibilidade).find(x => x.id === 'esporte')!;
    expect(c.titulo).toMatch(/vôlei/);
    expect(c.onde).toMatch(/técnica/);
    expect(c.proximo?.acao).toBeDefined();
  });
});

/* ======================================================= Arte e pesquisa */

describe('arte e universidade perseguíveis', () => {
  it('quem toca pode chamar gente e montar uma banda (começa sem público)', () => {
    let v = atleta(19, 'musica' as Dominio, 55, 2);
    v = executar(v, P('montar_grupo', 'musica')).vida;
    expect(v.caminhos.arte?.ativo).toBe(true);
    expect(v.caminhos.arte!.publico).toBeLessThan(15);
    expect(disponibilidade(v, P('montar_grupo', 'musica')).motivo).toMatch(/já tem/);
  });

  it('doutora pode pedir bolsa de pós-doutorado; sem doutorado, o requisito é dito', () => {
    const v = adulto(33);
    formar(v, 'nutricao', 'superior', 'mestrado', 'doutorado');
    expect(podeTentar(disponibilidade(v, P('bolsa_pesquisa')))).toBe(true);
    const r = responderTudo(executar(v, P('bolsa_pesquisa')).vida);
    const deu = r.trabalho.atual?.ocupacaoId === 'pesquisador' || r.caminhos.pendente;
    const devolutiva = r.caminhos.devolutivas.some(d => d.titulo === 'Edital de pós-doutorado' && !!d.falta);
    expect(deu || devolutiva).toBeTruthy();
    const w = adulto(33, { semente: 15 });
    formar(w, 'nutricao', 'superior', 'mestrado');
    expect(disponibilidade(w, P('bolsa_pesquisa')).motivo).toMatch(/doutorado concluído/);
  });

  it('"Outros caminhos" diz como começa cada vida, com o passo quando dá — e a política é uma entre as outras', () => {
    const v = adulto(20);
    const l = caminhosPossiveis(v, disponibilidade);
    expect(l.map(x => x.id)).toEqual(expect.arrayContaining(['esporte', 'arte', 'academia', 'forcas', 'seguranca', 'publico', 'negocio', 'por_conta', 'politica']));
    for (const c of l) { expect(c.como.length).toBeGreaterThan(20); expect(c.agora.length).toBeGreaterThan(5); }
  });
});

/* ======================================================= Política militar */

describe('militar da ativa: não se filia, mas pode ser escolhido em convenção (TSE)', () => {
  function cabo(): Vida {
    let v = adulto(34);
    v = transacao(v, x => { empregar(x, 'cabo_pm', 12, 6); const p = entrarNaPolitica(x, 'servidor'); p.prioridade = 'seguranca'; }).vida;
    return v;
  }
  it('o requisito vem com a ação que o cumpre (antes: "sem partido" e nenhuma opção)', () => {
    const v = cabo();
    expect(disponibilidade(v, { tipo: 'politica', oque: 'filiar' } as unknown as Acao).grau).toBe('ilegal');
    expect(podeTentar(disponibilidade(v, { tipo: 'politica', oque: 'indicacao' } as unknown as Acao))).toBe(true);
    expect(leituraPolitica(v)!.horizonte).toMatch(/convenção/);
  });

  it('com a indicação, dá para disputar sem os seis meses de filiação; fora da ativa, volta a exigir filiação', () => {
    let v = cabo();
    v = executar(v, { tipo: 'politica', oque: 'indicacao' } as unknown as Acao).vida;
    expect(v.momento?.situacaoId).toBe('pol_indicacao');
    v = executar(v, { tipo: 'decidir', opcaoId: 'p0' }).vida;
    const p = v.caminhos.politica!;
    expect(p.indicacaoMilitar).toBe(true);
    expect(p.tFiliacao).toBeUndefined();
    const e = proximaEleicao(v.t + 1, 'municipal');
    const d = podeConcorrer(v, 'vereador', e.t);
    expect(d.motivo ?? '').not.toMatch(/filiação/);
    const fora = transacao(v, x => { x.trabalho.atual = undefined; }).vida;
    expect(podeConcorrer(fora, 'vereador', e.t).motivo).toMatch(/Fora da ativa/);
    expect(podeTentar(disponibilidade(fora, { tipo: 'politica', oque: 'filiar' } as unknown as Acao))).toBe(true);
  });
});

/* ================================================ Empregado × por conta */

describe('empregado ≠ autônomo ≠ dono, dito antes da escolha', () => {
  it('confeitaria existe como vaga de emprego e como trabalho por conta — cada uma com o seu modelo', () => {
    expect(modeloDeTrabalho(ocupacao('confeiteiro'))).toBe('por_conta');
    expect(modeloDeTrabalho(ocupacao('confeiteiro_padaria'))).toBe('emprego');
    expect(modeloDeTrabalho(ocupacao('dono_lanchonete'))).toBe('negocio');
    expect(modeloDeTrabalho(ocupacao('cabeleireiro_salao'))).toBe('emprego');
  });

  it('a promoção nunca troca o modelo de trabalho em silêncio', () => {
    for (const oc of OCUPACOES) for (const x of degrausAcima(oc)) expect([oc.id, porContaPropria(x)]).toEqual([oc.id, porContaPropria(oc)]);
  });

  it('quem trabalha por conta não é contratado "por uma empresa"', () => {
    const v = adulto(25);
    const e = contratar(v, criarRng(2), ocupacao('eletricista'));
    expect(e.empregador).toMatch(/^por /);
    const w = adulto(25, { semente: 16 });
    w.caminhos.frentes.cozinha = { interesse: 60, meses: 40, habilidade: 55, tInicio: w.t - 40, tUltimo: w.t, retomadas: 0, auge: 55 };
    const f = contratar(w, criarRng(2), ocupacao('confeiteiro_padaria'));
    expect(f.empregador).not.toMatch(/^por /);
  });
});

/* =========================================================== Determinismo */

describe('determinismo com as ações novas', () => {
  it('mesma semente e mesmos comandos (inclusive pedir teste) = mesma vida', () => {
    const viver = () => {
      let v = atleta(14, 'volei', 63, 2);
      v = responderTudo(executar(v, P('pedir_teste', 'volei')).vida);
      v = viverAte(v, 17);
      return JSON.stringify({ d: v.caminhos.devolutivas, e: v.caminhos.esporte, b: v.biografia.length });
    };
    expect(viver()).toBe(viver());
  });
});

/* ========================================================= Saves reais v14 */

describe('save v14 → v15 com saves reais da base do rework (955d5d4)', () => {
  const ler = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
  for (const nome of ['save-v14-doutora-nutricao.json', 'save-v14-cabo-pm-politica.json', 'save-v14-volei-seletiva.json', 'save-v14-mestrando.json', 'save-v13-politica.json', 'save-v12-soldado.json']) {
    it(`${nome}: migra, valida, segue vivendo, exporta e importa`, () => {
      const res = interpretar(ler(nome));
      expect(res.tipo).toBe('ok');
      if (res.tipo !== 'ok') return;
      expect(res.migrado).toBe(true);
      let v = res.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(v.educacao.concluidos.filter(c => ['mestrado', 'doutorado'].includes(c.nivel)).every(c => c.area !== 'qualquer' && / em /.test(c.nome))).toBe(true);
      for (let k = 0; k < 3 && !v.morte; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
      expect(JSON.stringify(v)).not.toMatch(/undefined|NaN/);
      const volta = importarVida(exportarVida(v));
      expect(volta.tipo).toBe('ok');
    }, 30000);
  }

  it('a doutora do playtest, migrada: "Doutorado em Nutrição", e a trajetória dela primeiro', () => {
    const res = interpretar(ler('save-v14-doutora-nutricao.json'));
    if (res.tipo !== 'ok') throw new Error('não migrou');
    const v = res.vida;
    expect(v.educacao.concluidos.map(c => c.nome)).toEqual(expect.arrayContaining(['Mestrado em Nutrição', 'Doutorado em Nutrição']));
    const primeira = vagasEmCamadas(v).trajetoria.map(x => x.item.oc.id);
    expect(primeira).not.toContain('diarista');
    expect(primeira.some(id => /nutricionista|professor_faculdade/.test(id))).toBe(true);
  });

  it('a cabo do playtest, migrada: o próximo passo e a indicação partidária aparecem', () => {
    const res = interpretar(ler('save-v14-cabo-pm-politica.json'));
    if (res.tipo !== 'ok') throw new Error('não migrou');
    const v = res.vida;
    expect(podeTentar(disponibilidade(v, { tipo: 'politica', oque: 'indicacao' } as unknown as Acao))).toBe(true);
    const oc = ocupacao('policial_civil');
    expect(trajetoriaParaConcurso(v, oc).motivos.join(' ')).toMatch(/anos de farda/);
  });

  it('a adolescente do vôlei, migrada: pode pedir outro teste e vê a técnica em palavras', () => {
    const res = interpretar(ler('save-v14-volei-seletiva.json'));
    if (res.tipo !== 'ok') throw new Error('não migrou');
    const v = res.vida;
    const l = lerTecnica(v, 'volei');
    expect(l.palavra.length).toBeGreaterThan(3);
    const c = emConstrucao(v, disponibilidade).find(x => x.id === 'esporte');
    expect(c).toBeDefined();
  });
});

describe('ajustes da segunda passagem (simulação de intenções)', () => {
  it('quem está "começando" não gasta um teste: o requisito é treinar antes', () => {
    const v = atleta(12, 'futebol', 44, 2);
    expect(disponibilidade(v, P('pedir_teste', 'futebol')).motivo).toMatch(/começando/);
  });

  it('arte: com público, dá para mandar o trabalho a produtores; o parecer diz o que faltou e se melhorou', () => {
    let v = atleta(22, 'musica' as Dominio, 66, 3);
    v = executar(v, P('montar_grupo', 'musica')).vida;
    expect(disponibilidade(v, P('mostrar_trabalho')).motivo).toMatch(/ainda não tem público/);
    v = transacao(v, x => { x.caminhos.arte!.publico = 30; }).vida;
    expect(podeTentar(disponibilidade(v, P('mostrar_trabalho')))).toBe(true);
    const r = executar(v, P('mostrar_trabalho')).vida;
    const convite = r.caminhos.oportunidades.some(o => o.tipo === 'convite' && o.ocupacaoId === 'musico_profissional');
    const parecer = r.caminhos.devolutivas.find(d => d.tipo === 'arte');
    expect(convite || (!!parecer && !!parecer.falta && parecer.nivel !== undefined)).toBe(true);
    expect(disponibilidade(r, P('mostrar_trabalho')).motivo).toMatch(/temporada|convite/);
  });

  it('a política continua vindo da vida, mas não a cada seis anos: o intervalo mínimo é de oito', () => {
    const src = readFileSync(join(__dirname, '../sistemas/politica.ts'), 'utf8');
    expect(src).toMatch(/v\.t - ultima >= 96/);
    expect(src).toMatch(/Math\.min\(0\.12,/);
  });
});
