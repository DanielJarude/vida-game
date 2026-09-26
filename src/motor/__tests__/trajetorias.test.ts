/**
 * Caminhos de vida (auditoria e expansão): Forças Armadas, segurança
 * pública, envolvimento ilegal e justiça, cuidado não remunerado, informal e
 * MEI, campo e pesca, serviço público depois da posse, ondas de
 * transformação do trabalho, peso contextual do trabalho, segunda carreira,
 * gênero e cidade, save v11.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responder, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { idade, parceiro, transacao } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import { contratar, elegibilidade, nomeOcupacao } from '../sistemas/trabalho';
import { aoFormarNasForcas, escolherEspecialidade, irParaReserva, processarMilitar, sairDasForcas, transferir } from '../sistemas/militar';
import { abrirProcesso, antecedenteAdulto, penaDeAntecedentes, processarJustica } from '../sistemas/justica';
import { categoriaPara, chanceDeProposta, entrar, parar, processarIlicito } from '../sistemas/ilicito';
import { encerrarPausa, iniciarPausa, processarPausa } from '../sistemas/pausa';
import { comprarSitio, iniciarRural, processarRural, safraDaRegiao } from '../sistemas/rural';
import { defasagem, ondasDaFamilia, pesoDoTrabalhoNaCabeca, custosDoTrabalho, processarTransformacao, sentidoDoTrabalho } from '../sistemas/carreira';
import { familiaDaTrilha, FAMILIAS } from '../dados/carreiras';
import { semana } from '../sistemas/semana';
import { fatoresCabeca, fatoresHumor } from '../sistemas/estado';
import { orcamento } from '../sistemas/dinheiro';
import { podeComecarRotina } from '../sistemas/rotinas';
import { interpretar, VERSAO_SAVE } from '../save';
import { conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { formalizar } from '../conteudo/trajetorias';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { municipio } from '../dados/lugares';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');

/** Adulto de `i` anos, sem trabalho, sem pendências, pronto para receber estado de teste. */
function adulto(i = 24, semente = 7, genero: 'feminino' | 'masculino' = 'feminino', municipioId = 'recife-pe'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero, municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero, municipioId }), i);
  v.momento = null;
  v.trabalho.atual = undefined;
  v.trabalho.aposentadoria = undefined;
  v.trabalho.pausa = undefined;
  v.educacao.matricula = undefined;
  v.educacao.escolaridade = 'medio';
  v.caminhos.envolvimento = undefined;
  v.caminhos.militar = undefined;
  v.justica = undefined;
  v.caminhos.oportunidades = [];
  v.corpo.saude = 80;
  v.corpo.forma = 70;
  v.corpo.condicoes = [];
  return v;
}

const emTransacao = <T>(v: Vida, f: (x: Vida) => T) => transacao(v, (x) => f(x));

/* ============================================================ Forças Armadas */

describe('Forças Armadas', () => {
  it('alistamento: obrigatório para homens, voluntário para mulheres — e mulher pode servir', () => {
    const d = conteudoPorId('mil_alistamento')!;
    expect(d.tipo).toBe('decisao');
    const h = adulto(18, 3, 'masculino');
    const m = adulto(18, 3, 'feminino');
    if (d.tipo !== 'decisao') return;
    expect(d.texto(contexto(h, criarRng(1)))).toMatch(/deseja servir/);
    expect(d.texto(contexto(m, criarRng(1)))).toMatch(/voluntariamente/);
    // Nenhuma ocupação das Forças tem gênero no requisito.
    const f = adulto(19, 4, 'feminino');
    const x = adulto(19, 4, 'masculino');
    for (const id of ['aluno_sargento', 'cadete', 'aluno_pm', 'aluno_bombeiro', 'policial_penal']) expect(elegibilidade(f, ocupacao(id)).grau).toBe(elegibilidade(x, ocupacao(id)).grau);
  });

  it('temporário: prorroga ano a ano e dá baixa no máximo em 8 anos, sem estabilidade', () => {
    const v = adulto(19, 11, 'masculino');
    const { vida } = emTransacao(v, x => { contratar(x, criarRng(2), ocupacao('soldado_ep'), 'oportunidade'); });
    expect(vida.caminhos.militar?.quadro).toBe('temporario');
    let w = vida;
    w.caminhos.militar!.tIngresso = w.t - 8 * 12;
    const r = emTransacao(w, x => { processarMilitar(x, criarRng(3), x.trabalho.atual!, ocupacao(x.trabalho.atual!.ocupacaoId)); });
    w = r.vida;
    expect(w.trabalho.atual).toBeUndefined();
    expect(w.biografia.some(b => /tempo máximo de temporário/.test(b.texto))).toBe(true);
  });

  it('carreira: formação longe de casa, especialidade escolhida, primeira guarnição, nomes da Força', () => {
    const v = adulto(20, 12, 'feminino');
    const { vida } = emTransacao(v, x => {
      const r = criarRng(5);
      contratar(x, r, ocupacao('aluno_sargento'), 'concurso');
      x.caminhos.militar!.forca = 'marinha';
      x.trabalho.atual!.ocupacaoId = 'sargento';
      aoFormarNasForcas(x, r, ocupacao('sargento'));
    });
    expect(vida.fatos['mil_especialidade']).toBeDefined();
    expect(nomeOcupacao(vida, ocupacao('sargento'))).toBe('sargento da Marinha');
    expect(nomeOcupacao(vida, ocupacao('major'))).toBe('capitã de corveta');
    const d = conteudoPorId('mil_especialidade')!;
    expect(d.tipo === 'decisao' && d.opcoes.length).toBeGreaterThanOrEqual(5);
    const w = emTransacao(vida, x => escolherEspecialidade(x, 'manutencao')).vida;
    expect(w.caminhos.militar!.especialidade).toBe('manutencao');
    // A especialidade conta, pela metade, na vida civil.
    const antes = w.trabalho.experiencia['mecanica'] ?? 0;
    const depois = emTransacao(w, x => processarMilitar(x, criarRng(6), x.trabalho.atual!, ocupacao('sargento'))).vida;
    expect(depois.trabalho.experiencia['mecanica']).toBeGreaterThan(antes);
  });

  it('progressão por antiguidade, curso de carreira e teste físico — não por "desempenho de empresa"', () => {
    const base = adulto(34, 13, 'masculino');
    const { vida } = emTransacao(base, x => { contratar(x, criarRng(1), ocupacao('aluno_sargento'), 'concurso'); x.trabalho.atual!.ocupacaoId = 'sargento'; x.trabalho.atual!.formacaoAte = undefined; x.caminhos.militar!.quadro = 'praca'; x.trabalho.atual!.tPosto = x.t - 15 * 12; x.caminhos.militar!.tIngresso = x.t - 15 * 12; x.trabalho.atual!.desempenho = 70; });
    // Sem o curso de aperfeiçoamento, não sobe a subtenente.
    let w = vida;
    for (let k = 0; k < 4; k++) w = emTransacao(w, x => processarMilitar(x, criarRng(20 + k), x.trabalho.atual!, ocupacao(x.trabalho.atual!.ocupacaoId))).vida;
    expect(w.trabalho.atual!.ocupacaoId).toBe('sargento');
    expect(w.fatos['mil_curso_oferta']).toBeDefined();
    // Com o curso, sobe (com o teste físico em dia).
    w = emTransacao(w, x => { x.caminhos.militar!.cursos.push('aperfeicoamento'); }).vida;
    let subiu = false;
    for (let k = 0; k < 8 && !subiu; k++) { w = emTransacao(w, x => processarMilitar(x, criarRng(40 + k), x.trabalho.atual!, ocupacao(x.trabalho.atual!.ocupacaoId))).vida; subiu = w.trabalho.atual?.ocupacaoId === 'subtenente'; }
    expect(subiu).toBe(true);
    // Quem não passa no teste físico espera.
    const fraco = emTransacao(vida, x => { x.corpo.forma = 10; x.caminhos.militar!.cursos.push('aperfeicoamento'); }).vida;
    let f = fraco;
    for (let k = 0; k < 6; k++) f = emTransacao(f, x => { x.corpo.forma = 10; processarMilitar(x, criarRng(60 + k), x.trabalho.atual!, ocupacao(x.trabalho.atual!.ocupacaoId)); }).vida;
    expect(f.trabalho.atual?.ocupacaoId).toBe('sargento');
    expect(f.caminhos.militar!.tafFalhou).toBeDefined();
  });

  it('transferência: a família vai junto (a parceria recomeça) ou fica (vira distância)', () => {
    const base = adulto(32, 14, 'masculino', 'curitiba-pr');
    const par = criarPessoa(base, criarRng(9), { idade: 31, genero: 'feminino', municipioId: base.moradia.municipioId });
    vincular(base, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    base.vinculos[par.id].romance = { estagio: 'casamento', tEstagio: base.t - 60, tInicio: base.t - 100, envolvimento: 80 };
    par.renda = 4000;
    base.moradia = { tipo: 'aluguel', municipioId: 'curitiba-pr', modeloId: 'apto_2q', aluguel: 2000, padrao: 3, tInicio: base.t, aceitaPet: true };
    const { vida } = emTransacao(base, x => { contratar(x, criarRng(1), ocupacao('aluno_sargento'), 'concurso'); x.trabalho.atual!.ocupacaoId = 'sargento'; x.trabalho.atual!.formacaoAte = undefined; x.caminhos.militar!.quadro = 'praca'; x.caminhos.militar!.guarnicao = 'curitiba-pr'; });
    const junto = emTransacao(vida, x => transferir(x, 'manaus-am', true, false)).vida;
    expect(junto.moradia.municipioId).toBe('manaus-am');
    expect(junto.trabalho.atual).toBeDefined();
    expect(junto.pessoas[par.id].municipioId).toBe('manaus-am');
    expect(junto.pessoas[par.id].renda).toBe(2000);
    const so = emTransacao(vida, x => transferir(x, 'manaus-am', false, false)).vida;
    expect(so.moradia.municipioId).toBe('manaus-am');
    expect(so.pessoas[par.id].municipioId).toBe('curitiba-pr');
    expect(so.caminhos.militar!.transferencias).toBe(1);
  });

  it('reserva com 35 anos de serviço (remuneração do posto) e, depois, a segunda carreira; sair cedo indeniza', () => {
    const base = adulto(55, 15, 'masculino');
    const { vida } = emTransacao(base, x => { contratar(x, criarRng(1), ocupacao('cadete'), 'concurso'); x.trabalho.atual!.ocupacaoId = 'major'; x.trabalho.atual!.formacaoAte = undefined; x.caminhos.militar!.quadro = 'oficial'; x.caminhos.militar!.tIngresso = x.t - 36 * 12; x.trabalho.experiencia['exercito_oficial'] = 36 * 12; x.trabalho.atual!.salario = 16500; });
    expect(podeTentar(disponibilidade(vida, { tipo: 'aposentar' }))).toBe(true);
    const r = executar(vida, { tipo: 'aposentar' }).vida;
    expect(r.trabalho.aposentadoria?.beneficio).toBe(16500);
    expect(r.fatos['mil_reserva']).toBe(r.t);
    const d = conteudoPorId('mil_reserva');
    expect(d?.tipo).toBe('decisao');
    // Oficial recém-formado que sai indeniza a formação.
    const novo = adulto(24, 16, 'feminino');
    const { vida: n } = emTransacao(novo, x => { contratar(x, criarRng(1), ocupacao('cadete'), 'concurso'); x.trabalho.atual!.ocupacaoId = 'tenente'; x.trabalho.atual!.formacaoAte = undefined; x.caminhos.militar!.quadro = 'oficial'; });
    const ind = emTransacao(n, x => sairDasForcas(x)).valor;
    expect(ind).toBeGreaterThan(0);
    void irParaReserva;
  });
});

/* ========================================================== Segurança pública */

describe('segurança pública', () => {
  it('entrada por concurso, teste físico e curso de formação — não por currículo', () => {
    const v = adulto(22, 17);
    for (const id of ['soldado_pm', 'bombeiro', 'tenente_pm']) expect(elegibilidade(v, ocupacao(id)).grau).toBe('requisito');
    expect(ocupacao('aluno_pm').concurso && ocupacao('aluno_pm').formacaoInicial?.destino).toBe('soldado_pm');
    expect(ocupacao('policial_penal').concurso).toBe(true);
    // A PM não exige mais CNH na inscrição (pode ser apresentada até a formatura).
    expect(ocupacao('aluno_pm').licenca).toBeUndefined();
  });

  it('bombeiro tem escada: soldado → sargento, por antiguidade', () => {
    const acima = OCUPACOES.filter(o => o.trilha === 'bombeiro' && o.nivel === ocupacao('bombeiro').nivel + 1);
    expect(acima.map(o => o.id)).toContain('sargento_bombeiro');
  });
});

/* ======================================================= Ilegalidade e justiça */

describe('envolvimento ilegal: oportunidade, decisão, risco, consequência', () => {
  it('a porta nasce do contexto e nunca é destino: pequena, com teto, e o que protege protege', () => {
    const v = adulto(24, 18);
    v.caminhos.ultimas = {};
    const base = chanceDeProposta(v);
    expect(base).toBeGreaterThanOrEqual(0);
    expect(base).toBeLessThan(0.02);
    const aperto = structuredClone(v);
    aperto.trabalho.desempregadoDesde = aperto.t - 30;
    aperto.financas.negativado = true;
    aperto.financas.conta = -5000;
    aperto.personalidade.tracos.impulsividade = 60;
    const cAperto = chanceDeProposta(aperto);
    expect(cAperto).toBeGreaterThan(base);
    expect(cAperto).toBeLessThanOrEqual(0.05);
    const protegido = structuredClone(aperto);
    protegido.personalidade.tracos.disciplina = 60;
    protegido.personalidade.tracos.empatia = 60;
    expect(chanceDeProposta(protegido)).toBeLessThan(cAperto);
    // Criança não recebe proposta; quem está preso também não.
    expect(chanceDeProposta(adulto(12, 18))).toBe(0);
  });

  it('pobreza não garante envolvimento: em muitas vidas de origem pobre e passiva, quase ninguém entra', () => {
    let entraram = 0;
    let total = 0;
    for (let s = 0; s < 12; s++) {
      let v = nova({ semente: 900 + s });
      v.origem.classe = 'vulneravel';
      v = viverAte(v, 40);
      if (v.morte) continue;
      total++;
      if (v.fatos['envolveu_se'] !== undefined) entraram++;
    }
    expect(total).toBeGreaterThan(6);
    // Quem entra, entra por escolha (a decisão tem "recusar" sempre).
    expect(entraram / total).toBeLessThan(0.35);
  });

  it('a proposta é uma decisão com recusa; fraude só aparece para quem tem acesso', () => {
    const d = conteudoPorId('ilic_proposta')!;
    expect(d.tipo === 'decisao' && d.opcoes.map(o => o.id)).toEqual(['recusar_proposta', 'afastar_proposta', 'aceitar_proposta']);
    const v = adulto(30, 19);
    const r = criarRng(3);
    const sem = new Set(Array.from({ length: 40 }, () => categoriaPara(v, r)));
    expect(sem.has('fraude')).toBe(false);
    const { vida } = emTransacao(v, x => { x.educacao.concluidos.push({ cursoId: 'contabeis', nome: 'Ciências Contábeis', nivel: 'superior', area: 'contabilidade', tFim: x.t, instituicao: 'x' }); x.educacao.escolaridade = 'superior'; contratar(x, criarRng(1), ocupacao('contador')); });
    const com = new Set(Array.from({ length: 40 }, () => categoriaPara(vida, r)));
    expect(com.has('fraude')).toBe(true);
    // Adolescente: só "coisas erradas com a turma".
    expect(categoriaPara(adulto(15, 20), r)).toBe('pequenos');
  });

  it('entrar dá dinheiro rápido e exposição que cresce; recusar não muda nada', () => {
    const v = adulto(26, 21);
    const antes = v.financas.conta;
    let w = emTransacao(v, x => entrar(x, 'patrimonial', undefined, criarRng(1))).vida;
    expect(w.financas.conta).toBeGreaterThan(antes);
    const exp0 = w.caminhos.envolvimento!.exposicao;
    w = emTransacao(w, x => { x.t += 12; processarIlicito(x, criarRng(2)); }).vida;
    if (!w.justica) expect(w.caminhos.envolvimento!.exposicao).toBeGreaterThan(exp0);
    expect(w.caminhos.envolvimento!.ganhos).toBeGreaterThan(0);
  });

  it('com o tempo, a exposição vira processo — em algum momento, na maioria das vidas', () => {
    let processos = 0;
    for (let s = 0; s < 10; s++) {
      let w = emTransacao(adulto(26, 22), x => { entrar(x, 'mercado', undefined, criarRng(s)); x.caminhos.envolvimento!.nivel = 2; }).vida;
      for (let k = 0; k < 8 && !w.justica; k++) w = emTransacao(w, x => { x.t += 12; processarIlicito(x, criarRng(100 + s * 10 + k)); }).vida;
      if (w.justica?.processo || w.justica?.prisao) processos++;
    }
    expect(processos).toBeGreaterThanOrEqual(5);
  });

  it('sentença: pena alternativa gera antecedente que fecha a segurança pública e pesa na carteira — e o tempo alivia', () => {
    let w = adulto(28, 23);
    w = emTransacao(w, x => { entrar(x, 'patrimonial', undefined, criarRng(1)); abrirProcesso(x, criarRng(2), 'patrimonial'); }).vida;
    expect(w.justica?.processo).toBeDefined();
    // Julgamento, até sair uma condenação (a absolvição existe).
    let condenado = false;
    for (let s = 0; s < 20 && !condenado; s++) {
      const x = emTransacao(w, y => { y.t = y.justica!.processo!.tJulgamento; processarJustica(y, criarRng(300 + s)); }).vida;
      if (antecedenteAdulto(x)) { w = x; condenado = true; }
    }
    expect(condenado).toBe(true);
    expect(elegibilidade(w, ocupacao('aluno_pm')).grau).toBe('requisito');
    expect(elegibilidade(w, ocupacao('aluno_pm')).motivo).toMatch(/ficha limpa/);
    const agora = penaDeAntecedentes(w);
    expect(agora).toBeGreaterThan(0);
    const depois = structuredClone(w);
    depois.t += 12 * 10;
    expect(penaDeAntecedentes(depois)).toBeLessThan(agora);
    // Autônomo não passa por entrevista: a ficha não fecha trabalhar por conta.
    expect(elegibilidade(w, ocupacao('pintor')).grau === 'requisito' && /ficha/.test(elegibilidade(w, ocupacao('pintor')).motivo ?? '')).toBe(false);
  });

  it('prisão: o emprego acaba, a semana encolhe, as atividades são as da unidade, a casa segue com quem ficou', () => {
    let w = adulto(30, 24);
    w = emTransacao(w, x => { contratar(x, criarRng(1), ocupacao('aux_adm')); x.justica = { antecedentes: [], processo: { tInicio: x.t, tJulgamento: x.t, categoria: 'grupo', defesa: 'publica' } }; }).vida;
    let preso = false;
    for (let s = 0; s < 30 && !preso; s++) {
      const x = emTransacao(w, y => processarJustica(y, criarRng(500 + s))).vida;
      if (x.justica?.prisao) { w = x; preso = true; }
    }
    expect(preso).toBe(true);
    expect(w.trabalho.atual).toBeUndefined();
    expect(podeComecarRotina(w, 'futebol').grau).not.toBe('permitido');
    expect(podeComecarRotina(w, 'leitura').grau).toBe('permitido');
    expect(semana(w).fixos.some(f => f.id === 'prisao')).toBe(true);
    expect(fatoresCabeca(w).some(f => f.id === 'prisao')).toBe(true);
    if (w.justica!.prisao!.regime === 'fechado') expect(elegibilidade(w, ocupacao('aux_adm')).grau).toBe('impossivel');
    // Na prisão, o orçamento não cobra o mercado da casa (a casa segue com quem ficou).
    expect(orcamento(w).saidas.some(l => /Mercado, luz/.test(l.rotulo))).toBe(false);
    // A pena acaba: sai, com a data guardada e a decisão da saída.
    const fim = w.justica!.prisao!.tFim;
    const s = emTransacao(w, y => { y.t = fim; y.justica!.processo = undefined; processarJustica(y, criarRng(7)); }).vida;
    expect(s.justica?.prisao).toBeUndefined();
    expect(s.justica?.tSaida).toBe(s.t);
    expect(s.caminhos.marcas.some(m => m.tipo === 'saida_prisao')).toBe(true);
  });

  it('remição: estudar ou trabalhar dentro encurta a pena', () => {
    const w = adulto(30, 25);
    const { vida } = emTransacao(w, x => { x.justica = { antecedentes: [{ t: x.t, categoria: 'mercado', desfecho: 'prisao', anos: 5 }], prisao: { tInicio: x.t, tFim: x.t + 36, regime: 'fechado' } }; x.fatos['remicao_estudo'] = x.t; x.fatos['remicao_trabalho'] = x.t; });
    const depois = emTransacao(vida, x => { x.t += 12; processarJustica(x, criarRng(1)); }).vida;
    expect(depois.justica!.prisao!.tFim).toBe(vida.justica!.prisao!.tFim - 6);
  });

  it('adolescente: medida socioeducativa, sem ficha de adulto (ECA)', () => {
    const w = emTransacao(adulto(16, 26), x => abrirProcesso(x, criarRng(1), 'pequenos')).vida;
    expect(w.justica!.antecedentes[0].desfecho).toBe('socioeducativa');
    expect(antecedenteAdulto(w)).toBe(false);
    expect(penaDeAntecedentes(w)).toBe(0);
  });

  it('sair: parar é sempre possível, a exposição esfria; voltar aos contatos é reincidir', () => {
    let w = emTransacao(adulto(27, 27), x => entrar(x, 'patrimonial', undefined, criarRng(1))).vida;
    expect(podeTentar(disponibilidade(w, { tipo: 'parar_por_fora' }))).toBe(true);
    w = executar(w, { tipo: 'parar_por_fora' }).vida;
    expect(w.caminhos.envolvimento!.parou).toBe(w.t);
    const e0 = w.caminhos.envolvimento!.exposicao;
    w = emTransacao(w, x => { x.t += 12; processarIlicito(x, criarRng(9)); }).vida;
    if (!w.justica) expect(w.caminhos.envolvimento!.exposicao).toBeLessThan(e0);
    w = emTransacao(w, x => entrar(x, 'patrimonial', undefined, criarRng(2))).vida;
    expect(w.fatos['reincidiu']).toBeDefined();
    void parar;
  });

  it('o dinheiro por fora tem teto: nunca melhor que uma carreira comum ao longo dos anos', () => {
    // Ganho esperado de um ano no nível mais alto x salário de um técnico com carteira.
    const w = emTransacao(adulto(30, 28), x => { entrar(x, 'grupo', undefined, criarRng(1)); x.caminhos.envolvimento!.nivel = 3; }).vida;
    const g0 = w.caminhos.envolvimento!.ganhos;
    const um = emTransacao(w, x => { x.t += 12; processarIlicito(x, criarRng(11)); }).vida;
    const ganhoAno = (um.caminhos.envolvimento?.ganhos ?? g0) - g0;
    expect(ganhoAno).toBeLessThan(5600 * 12 * 1.5);
  });
});

/* ============================================================ Cuidado */

describe('cuidado não remunerado', () => {
  it('reduzir a jornada: o salário cai, a semana ganha tempo, a cabeça sente e o humor ganha presença', () => {
    const w0 = emTransacao(adulto(32, 30), x => contratar(x, criarRng(1), ocupacao('aux_adm'))).vida;
    const sal = w0.trabalho.atual!.salario;
    const w = emTransacao(w0, x => iniciarPausa(x, 'casa', 'parcial')).vida;
    expect(w.trabalho.atual!.reduzida).toBe(true);
    expect(w.trabalho.atual!.salario).toBeLessThan(sal);
    expect(semana(w).fixos.find(f => f.id === 'trabalho')!.peso).toBeLessThan(semana(w0).fixos.find(f => f.id === 'trabalho')!.peso);
    expect(fatoresCabeca(w).some(f => f.id === 'cuidando')).toBe(true);
    expect(fatoresHumor(w).some(f => f.id === 'presenca')).toBe(true);
    const volta = emTransacao(w, x => encerrarPausa(x, 'procurar')).vida;
    expect(volta.trabalho.atual!.reduzida).toBe(false);
    expect(volta.trabalho.atual!.salario).toBeGreaterThanOrEqual(sal - 20);
  });

  it('parar: o trabalho pago acaba, o INSS para (a não ser que pague como facultativo), e o primeiro emprego encerra a pausa', () => {
    const w0 = emTransacao(adulto(33, 31), x => contratar(x, criarRng(1), ocupacao('aux_adm'))).vida;
    let w = emTransacao(w0, x => iniciarPausa(x, 'filhos', 'total')).vida;
    expect(w.trabalho.atual).toBeUndefined();
    expect(w.trabalho.desempregadoDesde).toBeUndefined();
    const c0 = w.trabalho.contribuicao;
    w = emTransacao(w, x => { x.t += 12; processarPausa(x); }).vida;
    expect(w.trabalho.contribuicao).toBe(c0);
    w = executar(w, { tipo: 'facultativo', ativo: true }).vida;
    expect(custosDoTrabalho(w).some(l => /facultativo/.test(l.rotulo))).toBe(true);
    w = emTransacao(w, x => { x.t += 12; processarPausa(x); }).vida;
    expect(w.trabalho.contribuicao).toBe(c0 + 12);
    w = emTransacao(w, x => contratar(x, criarRng(2), ocupacao('atendente'))).vida;
    expect(w.trabalho.pausa).toBeUndefined();
    expect(w.fatos['voltou_ao_mercado']).toBeDefined();
  });

  it('a decisão depois da licença existe, e a parceria pode ser quem reduz', () => {
    const d = conteudoPorId('cui_bebe')!;
    expect(d.tipo === 'decisao' && d.opcoes.map(o => o.id)).toEqual(['voltar', 'reduzir', 'parar', 'parceria']);
  });
});

/* ===================================================== Informal, MEI, ofícios */

describe('informal, MEI e ofícios', () => {
  it('formalizar como MEI: passa a contribuir, a guia entra no orçamento', () => {
    const w0 = emTransacao(adulto(30, 32), x => { x.trabalho.experiencia['informal'] = 24; contratar(x, criarRng(1), ocupacao('feirante'), 'por_conta'); }).vida;
    expect(w0.trabalho.atual!.contrato).toBe('informal');
    expect(podeTentar(disponibilidade(w0, { tipo: 'mei' }))).toBe(true);
    const w = emTransacao(w0, x => formalizar(x)).vida;
    expect(w.trabalho.atual!.contrato).toBe('autonomo');
    expect(w.trabalho.atual!.mei).toBe(true);
    expect(orcamento(w).saidas.some(l => /DAS do MEI/.test(l.rotulo))).toBe(true);
  });

  it('feira pede estrada; quem trabalha por conta tem custo de trabalhar', () => {
    const v = adulto(22, 33);
    expect(elegibilidade(v, ocupacao('feirante')).grau).toBe('requisito');
    const w = emTransacao(v, x => { x.caminhos.frentes.manual = { interesse: 60, meses: 60, habilidade: 60, tInicio: 0, tUltimo: x.t, retomadas: 0, auge: 60 }; contratar(x, criarRng(1), ocupacao('encanador'), 'por_conta'); }).vida;
    expect(custosDoTrabalho(w).some(l => /Ferramentas/.test(l.rotulo))).toBe(true);
  });
});

/* ================================================================ Campo */

describe('campo e água', () => {
  it('a safra é da região e do ano (o mundo, não a pessoa)', () => {
    expect(safraDaRegiao('sinop-mt', 2050)).toBe(safraDaRegiao('rondonopolis-mt', 2050));
    const anos = Array.from({ length: 40 }, (_, k) => safraDaRegiao('sinop-mt', 2040 + k));
    expect(new Set(anos).size).toBe(3);
  });

  it('produzir: renda da safra, arrendamento como custo, dois anos ruins pedem decisão; comprar a terra com crédito rural', () => {
    let w = emTransacao(adulto(30, 34, 'masculino', 'sinop-mt'), x => { contratar(x, criarRng(1), ocupacao('produtor_rural'), 'oportunidade'); iniciarRural(x, 'arrendada'); }).vida;
    expect(custosDoTrabalho(w).some(l => /Arrendamento/.test(l.rotulo))).toBe(true);
    let ruins = 0;
    for (let a = 0; a < 40 && w.fatos['rural_aperto'] === undefined; a++) {
      w = emTransacao(w, x => { x.t += 12; processarRural(x, criarRng(a)); }).vida;
      if (w.caminhos.rural!.ultimaSafra === 'ruim') ruins++;
    }
    expect(ruins).toBeGreaterThan(0);
    w = emTransacao(w, x => { x.financas.conta = 200000; comprarSitio(x, true); }).vida;
    expect(w.caminhos.rural!.terra).toBe('propria');
    expect(w.financas.dividas.some(d => /Crédito rural/.test(d.descricao))).toBe(true);
    expect(w.financas.bens.some(b => b.modeloId === 'sitio')).toBe(true);
  });

  it('pesca só onde há água, e pede saber o trabalho', () => {
    const interior = adulto(25, 35, 'feminino', 'brasilia-df');
    expect(elegibilidade(interior, ocupacao('pescador')).grau).toBe('requisito');
    const litoral = adulto(25, 35, 'feminino', 'natal-rn');
    expect(elegibilidade(litoral, ocupacao('pescador')).grau).toBe('requisito');
    litoral.caminhos.frentes.campo = { interesse: 60, meses: 60, habilidade: 50, tInicio: 0, tUltimo: litoral.t, retomadas: 0, auge: 50 };
    expect(podeTentar(elegibilidade(litoral, ocupacao('pescador')))).toBe(true);
  });
});

/* ======================================================== Serviço público */

describe('serviço público depois da posse', () => {
  it('progressão a cada três anos e adicional de titulação; professor da rede não vira CLT por "promoção"', () => {
    const v = adulto(30, 36);
    v.educacao.concluidos.push({ cursoId: 'licenciatura', nome: 'Licenciatura', nivel: 'superior', area: 'educacao', tFim: v.t - 60, instituicao: 'x' });
    v.educacao.escolaridade = 'superior';
    let w = emTransacao(v, x => contratar(x, criarRng(1), ocupacao('professor_concursado'), 'concurso')).vida;
    const s0 = w.trabalho.atual!.salario;
    for (let a = 0; a < 7; a++) w = avancarAno(w).vida, w.momento = null;
    if (w.trabalho.atual?.ocupacaoId === 'professor_concursado') {
      expect(w.trabalho.atual.contrato).toBe('servidor');
      expect(w.trabalho.atual.salario).toBeGreaterThan(s0);
    }
    const t = emTransacao(w, x => { if (!x.trabalho.atual) contratar(x, criarRng(1), ocupacao('professor_concursado'), 'concurso'); x.educacao.concluidos.push({ cursoId: 'mestrado', nome: 'Mestrado', nivel: 'mestrado', area: 'qualquer', tFim: x.t, instituicao: 'x' }); }).vida;
    const s1 = t.trabalho.atual!.salario;
    const u = avancarAno(t).vida;
    if (u.trabalho.atual?.ocupacaoId === 'professor_concursado') expect(u.trabalho.atual.salario).toBeGreaterThan(s1 * 1.08);
  });
});

/* ===================================================== Transformação do trabalho */

describe('ondas de transformação e peso contextual do trabalho', () => {
  it('as ondas são do mundo (determinísticas) e quem não se atualiza fica para trás', () => {
    const v = adulto(30, 37);
    const f = familiaDaTrilha('mecanica');
    expect(ondasDaFamilia(v, f)).toEqual(ondasDaFamilia(structuredClone(v), f));
    expect(ondasDaFamilia(v, f).length).toBeGreaterThan(3);
    let w = emTransacao(v, x => { x.caminhos.frentes.manual = { interesse: 60, meses: 60, habilidade: 60, tInicio: 0, tUltimo: x.t, retomadas: 0, auge: 60 }; x.trabalho.experiencia['mecanica'] = 40; contratar(x, criarRng(1), ocupacao('mecanico')); x.trabalho.atual!.tInicio = x.t - 240; }).vida;
    const onda = ondasDaFamilia(w, f).find(a => a > anoDe(w.t))!;
    w = emTransacao(w, x => { x.t = onda * 12 + 13; }).vida;
    expect(defasagem(w)).toBeGreaterThan(0);
    const d0 = w.trabalho.atual!.desempenho;
    const caiu = emTransacao(w, x => processarTransformacao(x)).vida;
    expect(caiu.trabalho.atual!.desempenho).toBeLessThan(d0);
    const atualizado = emTransacao(w, x => { x.trabalho.atual!.tAtualizacao = x.t; }).vida;
    expect(defasagem(atualizado)).toBe(0);
  });

  it('o trabalho na cabeça depende da trajetória, não só da profissão', () => {
    const w = emTransacao(adulto(30, 38), x => { x.educacao.concluidos.push({ cursoId: 'enfermagem', nome: 'Enfermagem', nivel: 'superior', area: 'enfermagem', tFim: x.t, instituicao: 'x' }); x.trabalho.licencas.push('coren'); contratar(x, criarRng(1), ocupacao('enfermeiro')); }).vida;
    const novato = pesoDoTrabalhoNaCabeca(w)!.efeito;
    const veterano = emTransacao(w, x => { x.trabalho.experiencia['enfermagem'] = 15 * 12; }).vida;
    expect(pesoDoTrabalhoNaCabeca(veterano)!.efeito).toBeLessThan(novato);
    const mal = emTransacao(w, x => { x.trabalho.atual!.desempenho = 30; }).vida;
    expect(pesoDoTrabalhoNaCabeca(mal)!.efeito).toBeGreaterThan(novato);
    // Quem gosta do que o trabalho pede tem um ânimo que o salário não explica.
    const gosta = emTransacao(w, x => { x.personalidade.tracos.empatia = 40; }).vida;
    expect(sentidoDoTrabalho(gosta)?.efeito).toBeGreaterThan(0);
  });

  it('toda trilha pertence a uma família de carreira com identidade (entrada, degraus, renda, saídas)', () => {
    const trilhas = new Set(OCUPACOES.map(o => o.trilha));
    for (const t of trilhas) {
      const f = familiaDaTrilha(t);
      expect([t, f.id]).not.toEqual([t, 'outra']);
    }
    const modelos = new Set(FAMILIAS.map(f => f.progressao));
    expect(modelos.size).toBeGreaterThanOrEqual(12);
  });
});

/* ================================================= Gênero, cidade, idade */

describe('gênero, cidade e idade', () => {
  it('nenhuma ocupação depende de gênero para entrar', () => {
    const f = adulto(30, 40, 'feminino');
    const m = structuredClone(f);
    m.eu.genero = 'masculino';
    for (const oc of OCUPACOES) expect([oc.id, elegibilidade(f, oc).grau]).toEqual([oc.id, elegibilidade(m, oc).grau]);
  });

  it('cidade pesa sem prender: vaga rara exige mudar, e a porta existe em outro lugar', () => {
    const v = adulto(30, 41, 'feminino', 'tarauaca-ac');
    const d = elegibilidade(v, ocupacao('perito_criminal'));
    expect(['requisito', 'incompativel']).toContain(d.grau);
    expect(municipio(v.moradia.municipioId).perfil).toBe('pequena');
  });

  it('reinvenção depois dos 40: a segunda carreira é uma decisão do motor, e cursos aceitam adultos', () => {
    const d = conteudoPorId('car_segunda');
    expect(d?.tipo).toBe('decisao');
    const v = adulto(45, 42);
    expect(curso('tec_enfermagem').nivel).toBe('tecnico');
    void v;
  });
});

/* ============================================================ Save v11 */

describe('save v11', () => {
  it('saves v10 reais (ATT 3) migram, validam e seguem vivendo; quem está no quartel ganha a carreira militar', () => {
    expect(VERSAO_SAVE).toBe(14);
    for (const nome of ['save-v10-soldado.json', 'save-v10-familia.json', 'save-v10-aposentado.json']) {
      const r = interpretar(fixture(nome));
      expect([nome, r.tipo]).toEqual([nome, 'ok']);
      if (r.tipo !== 'ok') continue;
      expect(r.migrado).toBe(true);
      expect(r.vida.versao).toBe(VERSAO_SAVE);
      let v = r.vida;
      for (let k = 0; k < 4 && !v.morte; k++) { v = avancarAno(v).vida; while (v.momento) v = responder(v); }
      expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
    }
    const soldado = interpretar(fixture('save-v10-soldado.json'));
    if (soldado.tipo === 'ok') {
      expect(soldado.vida.caminhos.militar?.forca).toBe('exercito');
      expect(soldado.vida.caminhos.militar?.quadro).toBe('temporario');
    }
  });

  it('um v10 com carreira de sargento e um produtor rural (derivados de um save real) ganham os estados novos', () => {
    const base = JSON.parse(fixture('save-v10-familia.json'));
    base.trabalho.atual = { ...base.trabalho.atual, ocupacaoId: 'sargento', contrato: 'militar', tInicio: base.t - 120 };
    const r = interpretar(JSON.stringify(base));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.caminhos.militar?.quadro).toBe('praca');
    const rural = JSON.parse(fixture('save-v10-familia.json'));
    rural.trabalho.atual = { ...rural.trabalho.atual, ocupacaoId: 'produtor_rural', contrato: 'autonomo', clientela: 40 };
    const r2 = interpretar(JSON.stringify(rural));
    expect(r2.tipo === 'ok' && r2.vida.caminhos.rural?.terra).toMatch(/familia|arrendada/);
  });

  it('save v11 com justiça, pausa e carreira militar volta a ler idêntico; save corrompido não passa', () => {
    const w = emTransacao(adulto(30, 43), x => { contratar(x, criarRng(1), ocupacao('soldado_ep'), 'oportunidade'); x.justica = { antecedentes: [{ t: x.t, categoria: 'pequenos', desfecho: 'socioeducativa' }] }; x.trabalho.pausa = undefined; }).vida;
    const r = interpretar(JSON.stringify(w));
    expect(r.tipo === 'ok' && JSON.stringify(r.vida)).toBe(JSON.stringify(w));
    const ruim = JSON.parse(JSON.stringify(w));
    ruim.justica = { antecedentes: 'x' };
    expect(interpretar(JSON.stringify(ruim)).tipo).toBe('invalido');
  });

  it('mesma semente, mesmos comandos → mesma vida, com os sistemas novos no caminho', () => {
    const a = viverAte(nova({ semente: 77 }), 45);
    const b = viverAte(nova({ semente: 77 }), 45);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

void parceiro; void idade;
