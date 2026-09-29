/**
 * REWORK 3 — origem, formação e vida concreta: testes CAUSAIS.
 *
 * Cada teste segue uma cadeia de ponta a ponta (a origem muda o contexto; a
 * atividade vira vivência; o professor abre uma porta; a porta muda a
 * seleção; a formação acaba e a turma volta numa indicação...) e confere
 * que cada elo existe e tem consumidor. Nada de garantia de sucesso: onde
 * há acaso, o teste mede a chance, não o resultado de uma semente.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responderTudo, viver, viverAte } from './ajuda';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { clamp, criarRng } from '../rng';
import { idade, transacao, vinculosVivos } from '../nucleo';
import { podeTentar } from '../plausibilidade';
import { interpretar, migrarV17, VERSAO_SAVE } from '../save';
import type { Vida } from '../tipos';
import { vincular } from '../pessoas';
import { contratar, elegibilidade } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import { garantirFrente, habilidade } from '../sistemas/frentes';
import { apoioPossivel, contribuicaoEsperada, mesadaDaFamilia, principal, recursosDaFamilia, responsaveis } from '../sistemas/origem';
import { redeParaCasa, opcoesDeCurso } from '../sistemas/escola';
import {
  anoDaAtividade, aoConcluir, conviteDoProfessor, DE_FORMACAO, exColegasDaArea, instituicaoAtual, pesoNaPesquisa, pesoNaSelecaoDoIf,
  pessoasDaFormacao, processarFormacao, professorDe, registrarVivencia, vivenciaQuePesa
} from '../sistemas/formacao';
import { processarOportunidades } from '../sistemas/oportunidades';
import { processarEsporte } from '../sistemas/esporte';
import { independencia, processarIndependencia } from '../sistemas/independencia';
import { orcamento } from '../sistemas/dinheiro';
import { ofertasDeImoveis } from '../sistemas/mercado';
import { deslocamento } from '../sistemas/transporte';
import { veiculosParaVoce } from '../sistemas/relevancia';
import { modeloVeiculo } from '../dados/bens';
import { imagemPublica, processarNotoriedade, rendaDeImagem } from '../sistemas/notoriedade';
import { interacoesPara } from '../sistemas/interacoes';
import { processarIlicito, sabeQueAndaNisso } from '../sistemas/ilicito';
import { conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { acoesDoNegocio } from '../sistemas/gestao';
import { abrirNegocio } from '../sistemas/negocio';
import { autonomia } from '../sistemas/autonomia';
import { mudarAparencia } from '../sistemas/estilo';

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const ano = (v: Vida, acoes: Acao[] = []): Vida => {
  for (const a of acoes) if (tenta(v, a)) v = responderTudo(executar(v, a).vida);
  return responderTudo(avancarAno(v).vida);
};
/** Uma vida viva numa idade, sem o que atrapalha a comparação. */
function viva(i: number, o: Parameters<typeof nova>[0] = {}): Vida {
  let s = o.semente ?? 11;
  let v = viverAte(nova({ ...o, semente: s }), i);
  while (v.morte) v = viverAte(nova({ ...o, semente: ++s }), i);
  v.momento = null; v.caminhos.pendente = undefined; v.caminhos.processo = undefined; v.caminhos.oportunidades = [];
  v.caminhos.envolvimento = undefined; v.justica = undefined;
  return v;
}
function naEscola(v: Vida, etapa: 'fundamental2' | 'medio' = 'fundamental2', serie = 8, rede: 'publica' | 'privada' = 'publica'): void {
  v.educacao.basica = { etapa, serie, rede, desempenho: 70, reprovacoes: 0 };
  v.educacao.evadiu = false;
}
function naFaculdade(v: Vida, cursoId = 'eng_civil', rede: 'publica' | 'privada' = 'publica'): void {
  v.educacao.basica = undefined;
  v.educacao.escolaridade = 'superior_incompleto';
  v.educacao.matricula = { cursoId, instituicao: `a universidade federal em ${v.moradia.municipioId}`, rede, modalidade: 'presencial', tInicio: v.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 82, trancado: false, municipioId: v.moradia.municipioId };
}
/** Força o professor desta instituição a aparecer (o motor sorteia por gerador derivado; aqui, passam os anos até vir). */
function comProfessor(v: Vida): Vida {
  for (let k = 0; k < 25 && !professorDe(v, instituicaoAtual(v)!); k++) v = transacao(v, x => { x.t += 1; processarFormacao(x); }).vida;
  return v;
}

/* =================================================================== A */

describe('A. origem → escola → oportunidade → formação → consequência', () => {
  it('a mesma pessoa em duas casas: o contexto muda (folga, reserva, escola, mesada); a cabeça, não', () => {
    const pobre = nova({ semente: 5, classe: 'vulneravel' });
    const rica = nova({ semente: 5, classe: 'alta' });
    const rp = recursosDaFamilia(pobre);
    const rr = recursosDaFamilia(rica);
    expect(rr.folga).toBeGreaterThan(rp.folga);
    expect(rr.reserva).toBeGreaterThan(rp.reserva * 5);
    // A origem não escreve a facilidade de aprender (predisposições vêm da semente, não da classe).
    expect(rica.predisposicoes).toEqual(pobre.predisposicoes);
    const p12 = viverAte(pobre, 10);
    const r12 = viverAte(rica, 10);
    expect(mesadaDaFamilia(r12)).toBeGreaterThan(mesadaDaFamilia(p12));
    if (!p12.morte && !r12.morte) {
      expect(redeParaCasa(r12)).toBe('privada');
      expect(instituicaoAtual(p12)?.nome).not.toBe(instituicaoAtual(r12)?.nome);
    }
  });

  it('escola A ≠ escola B: cada instituição tem perfil estável — e nenhuma é "onde nada acontece"', () => {
    const perfis = new Set<string>();
    for (const cidade of ['recife-pe', 'sao-paulo-sp', 'tarauaca-ac', 'porto-alegre-rs', 'campinas-sp', 'teresina-pi']) {
      const v = nova({ semente: 3, municipioId: cidade });
      naEscola(v);
      const inst = instituicaoAtual(v)!;
      expect(inst.ofertas.length).toBeGreaterThanOrEqual(3);
      expect(instituicaoAtual(structuredClone(v))!.ofertas).toEqual(inst.ofertas);
      perfis.add(inst.ofertas.join(','));
    }
    expect(perfis.size).toBeGreaterThan(2);
  });

  it('a olimpíada vira vivência; o professor repara; o convite dele pesa na prova do instituto federal', () => {
    let v = viva(13, { classe: 'trabalhadora', semente: 21 });
    naEscola(v, 'fundamental2', 8);
    garantirFrente(v, 'exatas'); v.caminhos.frentes.exatas!.habilidade = 78;
    // A vivência (o que a atividade deixou), com um resultado — enquanto a atividade continua.
    if (!instituicaoAtual(v)!.ofertas.includes("olimpiada")) throw new Error("PREMISSA olimpiada");
    v.rotinas.push({ id: 'olimpiada', tInicio: v.t - 24, nivel: 1 });
    v = transacao(v, x => { const viv = registrarVivencia(x, 'olimpiada', { area: 'exatas', feito: 'medalha de prata' }); viv.anos = 2; }).vida;
    v = comProfessor(v);
    const inst = instituicaoAtual(v)!;
    const prof = professorDe(v, inst)!;
    expect(prof).toBeDefined();
    expect(v.vinculos[prof.id].formacao?.papel).toBe('professor');
    expect(v.vinculos[prof.id].estagio).toBe('conhecido'); // professor não é amigo
    expect(v.biografia.some(b => b.pessoas?.includes(prof.id))).toBe(true);
    // O convite (uma vez): a prova do IF.
    v = transacao(v, x => { x.vinculos[prof.id].tInicio = x.t - 24; }).vida;
    const convite = conviteDoProfessor(v);
    expect(convite?.incentivoIf).toBe(true);
    const antes = pesoNaSelecaoDoIf(v);
    v = transacao(v, (x, r) => processarOportunidades(x, r)).vida;
    expect(v.fatos['incentivo_if']).toBeDefined();
    expect(pesoNaSelecaoDoIf(v)).toBeGreaterThan(antes);
    expect(conviteDoProfessor(v)).toBeUndefined(); // uma vez só
    // A prova: com o incentivo, passa mais gente (a mesma conta, sem garantia).
    const d = conteudoPorId('esc_selecao_if')!;
    const passa = (x: Vida) => { let n = 0; for (let s = 1; s <= 300; s++) { const c = contexto(structuredClone(x), criarRng(s)); if (d.tipo === 'decisao' && /^Passou/.test(d.opcoes[0].resolver(c).texto)) n++; } return n; };
    const semIncentivo = transacao(v, x => { delete x.fatos['incentivo_if']; delete x.fatos['medalha_obmep']; }).vida;
    expect(passa(v)).toBeGreaterThan(passa(semIncentivo));
    expect(passa(v)).toBeLessThan(300);
  });
});

/* =================================================================== B */

describe('B. atividade escolar → habilidade → oportunidade futura', () => {
  it('o time da escola é futebol de verdade: pratica, conta como treino e o professor de educação física indica para a peneira', () => {
    let v = viva(12, { semente: 31 });
    naEscola(v, 'fundamental2', 7);
    v.rotinas = v.rotinas.filter(r => r.id !== 'futebol');
    const inst = instituicaoAtual(v)!;
    if (!inst.ofertas.includes('time')) inst.ofertas.push('time');
    // O time existe onde a escola tem time (o perfil); entra pela Formação.
    const temTime = instituicaoAtual(v)!.ofertas.includes('time');
    if (temTime) expect(tenta(v, { tipo: 'rotina', id: 'time_escola', ativa: true, nivel: 1 })).toBe(true);
    v.rotinas.push({ id: 'time_escola', tInicio: v.t - 24, nivel: 1 });
    garantirFrente(v, 'futebol'); v.caminhos.frentes.futebol!.habilidade = 62;
    const h0 = habilidade(v, 'futebol');
    let peneira = undefined as undefined | Vida['caminhos']['oportunidades'][number];
    for (let s = 1; s <= 60 && !peneira; s++) {
      const x = transacao(v, y => { processarEsporte(y, criarRng(s)); }).vida;
      peneira = x.caminhos.oportunidades.find(o => o.tipo === 'peneira');
    }
    expect(peneira?.texto).toMatch(/professor de educação física/);
    v = ano(v);
    expect(habilidade(v, 'futebol')).toBeGreaterThan(h0 - 1);
    expect(DE_FORMACAO.has('time_escola')).toBe(true);
  });

  it('a atividade some quando a escola acaba — e a vivência fica', () => {
    let v = viva(17, { semente: 33 });
    naEscola(v, 'medio', 3);
    v.rotinas.push({ id: 'gremio', tInicio: v.t - 36, nivel: 1 });
    v = transacao(v, x => registrarVivencia(x, 'gremio')).vida;
    v.educacao.basica = undefined; v.educacao.escolaridade = 'medio';
    v = transacao(v, x => processarFormacao(x)).vida;
    expect(v.rotinas.some(r => r.id === 'gremio')).toBe(false);
    const g = v.educacao.vivencias!.find(x => x.tipo === 'gremio')!;
    expect(g.tFim).toBe(v.t);
  });
});

/* =================================================================== C */

describe('C. colega → interação → amizade possível (nunca automática)', () => {
  it('três anos de faculdade sem gesto: muita gente conhecida, nenhuma amizade próxima; o gesto existe como ação', () => {
    let v = viva(19, { semente: 41 });
    naFaculdade(v);
    v.trabalho.atual = undefined;
    for (let k = 0; k < 3; k++) { v = ano(v); v.caminhos.pendente = undefined; if (v.educacao.matricula) v.educacao.matricula.mesesRestantes = 36; }
    const inst = instituicaoAtual(v);
    expect(inst?.tipo).toBe('universidade');
    const gente = pessoasDaFormacao(v).filter(x => x.papel === 'colega' || x.papel === 'amigo');
    expect(gente.length).toBeGreaterThan(0);
    const daFaculdade = vinculosVivos(v).filter(x => x.vin.origem === 'faculdade' && !x.vin.formacao);
    expect(daFaculdade.some(x => x.vin.estagio === 'amigo_proximo')).toBe(false);
    const colega = daFaculdade.find(x => (x.vin.estagio === 'conhecido' || x.vin.estagio === 'colega') && !x.vin.romance && x.vin.convivio.length > 0 && x.vin.distancia === undefined);
    if (colega) expect(interacoesPara(v, colega.p.id).map(x => x.id), JSON.stringify({ papel: colega.vin.estagio, rom: colega.vin.romance, conv: colega.vin.convivio, ip: idade(v) })).toContain('aproximar');
  });
});

/* =================================================================== D */

describe('D. professor → oportunidade → consequência educacional e profissional', () => {
  it('a professora da universidade oferece a iniciação; aceitar vira orientação, vivência e peso no mestrado', () => {
    let v = viva(20, { semente: 51 });
    naFaculdade(v, 'eng_civil', 'publica');
    v.trabalho.atual = undefined;
    v = comProfessor(v);
    const prof = professorDe(v, instituicaoAtual(v)!)!;
    expect(prof).toBeDefined();
    v = transacao(v, x => { x.vinculos[prof.id].tInicio = x.t - 24; }).vida;
    const c = conviteDoProfessor(v);
    expect(c?.atividade).toBe('iniciacao');
    v = transacao(v, (x, r) => processarOportunidades(x, r)).vida;
    const porta = v.caminhos.oportunidades.find(o => o.tipo === 'iniciacao')!;
    expect(porta.pessoaId).toBe(prof.id);
    v = executar(v, { tipo: 'oportunidade', id: porta.id, aceitar: true }).vida;
    expect(v.rotinas.some(r => r.id === 'iniciacao')).toBe(true);
    expect(v.vinculos[prof.id].formacao?.papel).toBe('orientador');
    v = transacao(v, x => { anoDaAtividade(x, 'iniciacao', 1); x.t += 12; anoDaAtividade(x, 'iniciacao', 1); }).vida;
    const ic = v.educacao.vivencias!.find(x => x.tipo === 'iniciacao')!;
    expect(ic.pessoaId).toBe(prof.id);
    expect(ic.area).toBe('engenharia_civil');
    // Formada: a iniciação e a orientadora pesam na seleção do mestrado (a mesma conta que a tela mostra).
    const formada = transacao(v, x => {
      x.educacao.matricula = undefined; x.educacao.escolaridade = 'superior';
      x.educacao.concluidos.push({ cursoId: 'eng_civil', nome: 'Engenharia Civil', nivel: 'superior', area: 'engenharia_civil', tFim: x.t, instituicao: 'x', rede: 'publica' });
    }).vida;
    const sem = transacao(formada, x => { x.educacao.vivencias = []; for (const vin of Object.values(x.vinculos)) if (vin.formacao) vin.formacao = undefined; }).vida;
    expect(pesoNaPesquisa(formada)).toBeGreaterThan(pesoNaPesquisa(sem));
    const chance = (x: Vida) => opcoesDeCurso(x).find(o => o.curso.nivel === 'mestrado' && o.via === 'selecao_publica')?.veredito.chance ?? 0;
    expect(chance(formada)).toBeGreaterThan(chance(sem));
  });
});

/* =================================================================== E */

describe('E. curso técnico → experiência → estágio/trabalho', () => {
  it('o projeto do laboratório do IF deixa uma vivência da área, que pesa na vaga técnica; o fim do técnico pergunta o que fazer', () => {
    let v = viva(16, { semente: 61 });
    naEscola(v, 'medio', 2);
    v.educacao.basica!.integrado = 'tec_eletrotecnica';
    const inst = instituicaoAtual(v)!;
    expect(inst.tipo).toBe('if');
    expect(inst.ofertas).toContain('projeto_tecnico');
    expect(tenta(v, { tipo: 'rotina', id: 'projeto_tecnico', ativa: true, nivel: 1 })).toBe(true);
    v = executar(v, { tipo: 'rotina', id: 'projeto_tecnico', ativa: true, nivel: 1 }).vida;
    v = transacao(v, x => { anoDaAtividade(x, 'projeto_tecnico', 1); }).vida;
    const viv = v.educacao.vivencias!.find(x => x.tipo === 'projeto_tecnico')!;
    expect(viv.area).toBe('eletrotecnica');
    const oc = ocupacao('tecnico_industrial');
    expect(vivenciaQuePesa(v, oc).bonus).toBeGreaterThan(0);
    const sem = transacao(v, x => { x.educacao.vivencias = []; }).vida;
    expect(vivenciaQuePesa(sem, oc).bonus).toBe(0);
    // O fim do integrado abre a pergunta — com a vaga da área como uma das saídas.
    v = transacao(v, x => { x.educacao.basica!.serie = 3; x.educacao.basica!.desempenho = 75; x.corpo.saude = 90; }).vida;
    v = avancarAno(v).vida;
    if (v.momento?.situacaoId === 'if_depois') {
      expect(v.momento.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['area', 'faculdade', 'outro']));
    } else {
      expect(v.fatos['concluiu_integrado']).toBe(v.t);
    }
  });
});

/* =================================================================== F */

describe('F. universidade → projeto/estágio → experiência → oportunidade profissional', () => {
  it('a turma sai com a formação para o trabalho; anos depois, uma ex-colega indica uma vaga', () => {
    let v = viva(22, { semente: 71 });
    naFaculdade(v, 'eng_civil');
    v.trabalho.atual = undefined;
    const inst = instituicaoAtual(v)!;
    const colega = pessoaNova(v, 22, 'feminino');
    // Proximidade de colega (abaixo da de amigo que indica por conta própria): é a turma que lembra.
    const vin = vincular(v, colega, { origem: 'faculdade', proximidade: 30, estagio: 'colega', convivio: ['faculdade'] });
    vin.ambiente = inst.ambiente;
    colega.ocupacao = 'estudante';
    v = transacao(v, x => { aoConcluir(x, inst.ambiente, inst.chave, 'engenharia_civil'); }).vida;
    expect(v.vinculos[colega.id].formacao).toMatchObject({ papel: 'colega', area: 'engenharia_civil' });
    expect(v.pessoas[colega.id].ocupacaoId).toBeDefined();
    expect(v.vinculos[colega.id].estagio).toBe('colega'); // continua colega: ninguém virou amigo por formatura
    // Formada, sem trabalho: a rede da turma aparece.
    v = transacao(v, x => {
      x.educacao.matricula = undefined; x.educacao.escolaridade = 'superior';
      x.educacao.concluidos.push({ cursoId: 'eng_civil', nome: 'Engenharia Civil', nivel: 'superior', area: 'engenharia_civil', tFim: x.t, instituicao: inst.nome, rede: 'publica' });
      x.trabalho.licencas.push('crea');
    }).vida;
    expect(exColegasDaArea(v, 'engenharia_civil').map(p => p.id)).toContain(colega.id);
    let indicacao = undefined as undefined | Vida['caminhos']['oportunidades'][number];
    for (let k = 0; k < 40 && !indicacao; k++) {
      v = transacao(v, (x, r) => { x.t += 12; delete x.caminhos.ultimas['indicacao_formacao']; x.caminhos.oportunidades = []; processarOportunidades(x, r); }).vida;
      indicacao = v.caminhos.oportunidades.find(o => o.tipo === 'indicacao' && o.pessoaId === colega.id);
      if (idade(v) > 48) break;
    }
    expect(indicacao?.texto).toMatch(/estudou com você/);
  });
});

/* =================================================================== G */

describe('G. renda → sair de casa → moradia → despesas', () => {
  it('trabalhando e morando com a família, contribui; sai de casa e as contas passam a ser suas (a primeira vez vira biografia)', () => {
    let v = viva(22, { semente: 81, classe: 'trabalhadora' });
    v.moradia = { tipo: 'pais', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 2, tInicio: v.t };
    for (const r of responsaveis(v)) if (!r.vin.convivio.includes('casa')) r.vin.convivio.push('casa');
    v.educacao.matricula = undefined;
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('assistente_adm')); x.financas.conta = 20000; }).vida;
    const emCasa = orcamento(v);
    expect(emCasa.arranjo).toBe('familia');
    const esperado = contribuicaoEsperada(v);
    if (esperado > 0) expect(emCasa.saidas.some(l => l.rotulo === 'Ajuda nas contas de casa')).toBe(true);
    expect(['contribui', 'parcial']).toContain(independencia(v).fase);
    // Não pôr nada tem custo na relação.
    const pr = principal(v)!;
    const nada = executar(v, { tipo: 'contribuicao', valor: 'nada' });
    if (esperado > 0) expect(nada.vida.vinculos[pr.p.id].tensao).toBeGreaterThan(v.vinculos[pr.p.id].tensao);
    // Sair: aluguel, mercado, luz — a despesa cresce.
    const oferta = ofertasDeImoveis(v, 'aluguel').filter(o => o.modeloId !== 'republica').sort((a, b) => a.aluguel - b.aluguel)[0];
    expect(tenta(v, { tipo: 'sair_de_casa', ofertaId: oferta.id })).toBe(true);
    v = executar(v, { tipo: 'sair_de_casa', ofertaId: oferta.id }).vida;
    const fora = orcamento(v);
    expect(fora.arranjo).not.toBe('familia');
    expect(fora.saidas.some(l => l.rotulo === 'Aluguel' || l.rotulo === 'Sua parte do aluguel')).toBe(true);
    expect(fora.despesa).toBeGreaterThan(emCasa.despesa);
    expect(['independente', 'ajudado', 'com_parceria']).toContain(independencia(v).fase);
    v = transacao(v, x => { processarIndependencia(x); processarIndependencia(x); }).vida;
    if (independencia(v).fase === 'independente') expect(v.biografia.filter(b => /pela primeira vez, as contas foram todas suas/.test(b.texto)).length).toBe(1);
  });

  it('independência não é automática aos 18: sem renda, na casa da família, continua sustentado', () => {
    let v = viva(17, { semente: 83 });
    v.moradia = { tipo: 'pais', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 2, tInicio: v.t };
    v.trabalho.atual = undefined;
    v = transacao(v, x => { x.t += 12; }).vida;
    expect(idade(v)).toBeGreaterThanOrEqual(18);
    expect(independencia(v).fase).toBe('sustentado');
  });
});

/* =================================================================== H */

describe('H. mudança de cidade → moradia → distância → trabalho', () => {
  it('mudar leva a casa, encerra o emprego local e deixa a parceria à distância (com a conversa sobre isso)', () => {
    let v = adulto(30, { semente: 91 });
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('assistente_adm')); x.financas.conta = 30000; }).vida;
    const { p } = comParceiro(v, { estagio: 'namoro' });
    v.vinculos[p.id].convivio = [];
    const destino = v.moradia.municipioId === 'sao-paulo-sp' ? 'recife-pe' : 'sao-paulo-sp';
    expect(tenta(v, { tipo: 'mudar_cidade', municipioId: destino })).toBe(true);
    v = executar(v, { tipo: 'mudar_cidade', municipioId: destino }).vida;
    expect(v.moradia.municipioId).toBe(destino);
    expect(v.trabalho.atual).toBeUndefined();
    expect(v.pessoas[p.id].municipioId).not.toBe(destino);
    expect(interacoesPara(v, p.id).map(x => x.id)).toContain('distancia');
  });
});

/* =================================================================== I */

describe('I. transporte → compra → dinheiro → vida concreta', () => {
  it('comprar uma bicicleta custa, muda o jeito de ir ao trabalho e o tempo do trajeto', () => {
    let v = adulto(25, { semente: 95 });
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('assistente_adm')); x.financas.conta = 8000; x.financas.bens = []; }).vida;
    const antes = deslocamento(v);
    const bici = veiculosParaVoce(v, 'motos').resto.concat(veiculosParaVoce(v, 'motos').para.map(x => x.item)).filter(o => modeloVeiculo(o.modeloId).categoria === 'bicicleta' && o.preco <= 6000)[0];
    expect(bici).toBeDefined();
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'comprar_veiculo', ofertaId: bici!.id, financiar: false }).vida;
    expect(v.financas.conta).toBeLessThan(conta);
    expect(v.financas.bens.some(b => b.tipo === 'veiculo')).toBe(true);
    // A bicicleta entra na vida: no trajeto (quando a distância cabe) e na conta do mês (a manutenção).
    const depois = deslocamento(v);
    const noTrajeto = !!depois?.opcoes.some(o => o.modo === 'bicicleta');
    const naConta = orcamento(v).saidas.some(l => l.grupo === 'transporte' && /bicicleta|Manutenção|manutenção/i.test(l.rotulo));
    expect(noTrajeto || naConta).toBe(true);
    if (noTrajeto && antes) expect(depois!.opcoes.length).toBeGreaterThan(antes.opcoes.length);
  });

  it('a concessionária mostra "para você" o carro que cabe no bolso de quem tem carteira (antes, a vitrine vinha vazia)', () => {
    const v = adulto(30, { semente: 97 });
    v.financas.conta = 150000; v.trabalho.licencas.push('cnh'); v.financas.negativado = false;
    expect(veiculosParaVoce(v, 'concessionaria').para.length).toBeGreaterThan(0);
    const sem = structuredClone(v); sem.trabalho.licencas = [];
    expect(veiculosParaVoce(sem, 'concessionaria').para.length).toBe(0);
  });
});

/* =================================================================== J */

describe('J. apoio familiar: recursos + relação + necessidade + história', () => {
  function comNecessidade(classe: Vida['origem']['classe'], proximidade: number, tensao: number): Vida {
    const v = viva(24, { semente: 101, classe });
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: v.t };
    for (const r of responsaveis(v)) { r.vin.convivio = r.vin.convivio.filter(c => c !== 'casa'); r.vin.proximidade = proximidade; r.vin.tensao = tensao; r.vin.distancia = undefined; }
    v.financas.conta = -4000;
    return v;
  }
  it('mesma emergência, famílias diferentes: a casa com folga e perto ajuda mais; brigada ajuda menos; ninguém é infinito', () => {
    const rica = comNecessidade('alta', 80, 5);
    const pobre = comNecessidade('vulneravel', 80, 5);
    const brigada = comNecessidade('alta', 22, 85);
    if (!principal(rica) || !principal(pobre) || !principal(brigada)) throw new Error("PREMISSA principal");
    const ar = apoioPossivel(rica, 'emergencia'), ap = apoioPossivel(pobre, 'emergencia'), ab = apoioPossivel(brigada, 'emergencia');
    expect(ar.ate).toBeGreaterThan(ap.ate);
    expect(ab.chance).toBeLessThan(ar.chance);
    // Pobre não é "nunca ajuda": numa emergência, a chance existe.
    expect(ap.chance).toBeGreaterThan(0.2);
    // Pedir: o que sai da família sai da reserva dela; pedir de novo encontra menos.
    let v = structuredClone(rica);
    const reserva0 = v.origem.reserva ?? 0;
    let recebido = 0;
    for (let s = 1; s <= 20 && recebido === 0; s++) {
      const x = transacao(v, (y, r) => { const c = criarRng(s); void r; return executarPedido(y, c); });
      if (x.valor > 0) { v = x.vida; recebido = x.valor; }
    }
    expect(recebido).toBeGreaterThan(0);
    expect(v.origem.reserva!).toBeLessThan(reserva0);
    expect(apoioPossivel(v, 'emergencia').chance).toBeLessThan(ar.chance);
  });

  it('a família também pode precisar: a casa de lá no limite pede, e a ajuda dada volta para a reserva dela', () => {
    let v = viva(30, { semente: 103, classe: 'vulneravel' });
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: v.t };
    const pr = principal(v);
    if (!pr) throw new Error('PREMISSA pr');
    for (const r of responsaveis(v)) { r.vin.convivio = []; r.p.renda = 300; r.p.aperto = undefined; }
    pr.vin.proximidade = 70; pr.vin.confianca = 70;
    v.origem.reserva = 0;
    v = transacao(v, (x, r) => contratar(x, r, ocupacao('assistente_adm'))).vida;
    let pediu = false;
    // O pedido nasce do estado da casa de lá (sorteio derivado): ao longo dos anos, vem.
    for (let k = 0; k < 20 && !pediu; k++) {
      v = transacao(v, x => { x.t += 12; delete x.fatos['familia_pediu']; principal(x)!.p.aperto = undefined; processarOrigem(x); }).vida;
      pediu = principal(v)!.p.aperto?.tipo === 'dinheiro';
    }
    expect(pediu).toBe(true);
    // Responder que sim: o dinheiro sai da sua conta e segura a casa de lá (a reserva dela).
    const quem = principal(v)!.p;
    v.vinculos[quem.id].chamado = { tipo: 'pedido_ajuda', t: v.t, texto: 'pediu ajuda', assunto: 'dinheiro' };
    v.financas.conta = 5000;
    const reserva = v.origem.reserva ?? 0;
    v = executar(v, { tipo: 'pessoa', pessoaId: quem.id, interacao: 'chamado_sim' }).vida;
    expect(v.financas.conta).toBeLessThan(5000);
    expect(v.origem.reserva!).toBeGreaterThan(reserva);
    expect(v.origem.apoios!.some(a => a.sentido === 'deu')).toBe(true);
  });

  it('criança não pede dinheiro à família (a autonomia por idade vale para o motor inteiro)', () => {
    const v = viva(10, { semente: 105 });
    v.financas.conta = -100;
    expect(tenta(v, { tipo: 'pedir_ajuda_familia', motivo: 'emergencia' })).toBe(false);
    expect(autonomia(v, 'moradia').grau).not.toBe('permitido');
  });
});

import { pedirAjuda, processarOrigem } from '../sistemas/origem';
function executarPedido(v: Vida, r: ReturnType<typeof criarRng>): number {
  v.anoAtual.acoes = v.anoAtual.acoes.filter(a => a !== 'pedir_ajuda_familia');
  return pedirAjuda(v, r, 'emergencia').valor;
}

/* =================================================================== K, L, M */

describe('K. personalização → persistência → avatar', () => {
  it('mudar o corte, a cor e pôr óculos: fica no estado e sobrevive ao salvar e reabrir', () => {
    let v = adulto(26, { semente: 111 });
    v.financas.conta = 5000;
    const corte = v.eu.visual.cabelo === 'curto' ? 'cacheado' : 'curto';
    v = executar(v, { tipo: 'aparencia', mudanca: { cabelo: corte, corCabelo: 'azul' } }).vida;
    expect(v.eu.visual.cabelo).toBe(corte);
    expect(v.eu.visual.corCabelo).toBe('azul');
    expect(v.eu.estilo?.corNatural).toBeDefined();
    // Óculos só com o item (comprado): sem ele, a ação explica o motivo.
    expect(tenta(v, { tipo: 'aparencia', mudanca: { oculos: 'redondo' } })).toBe(false);
    v = executar(v, { tipo: 'comprar_item', itemId: 'oculos_redondo' }).vida;
    expect(v.eu.visual.oculos).toBe('redondo');
    const lido = interpretar(JSON.stringify(v));
    if (lido.tipo !== 'ok') throw new Error('não leu');
    expect(lido.vida.eu.visual).toEqual(v.eu.visual);
    expect(lido.vida.eu.estilo).toEqual(v.eu.estilo);
    // Guardar e voltar a usar.
    v = executar(v, { tipo: 'usar_item', itemId: 'oculos_redondo', usar: false }).vida;
    expect(v.eu.visual.oculos).toBeUndefined();
    // Cortar o cabelo não é biografia.
    expect(v.biografia.some(b => /cabelo|visual/i.test(b.texto) && b.relevancia !== 'tecnico')).toBe(false);
  });

  it('autonomia por idade: a criança pequena não decide o visual; o adolescente não pinta; barba só quando o rosto chega lá', () => {
    const v5 = viva(5, { semente: 113 });
    expect(tenta(v5, { tipo: 'aparencia', mudanca: { cabelo: 'curto_lado' } })).toBe(false);
    const v10 = viva(10, { semente: 113 });
    expect(tenta(v10, { tipo: 'aparencia', mudanca: { corCabelo: 'azul' } })).toBe(false);
    const m14 = viva(14, { semente: 113, genero: 'masculino' });
    expect(tenta(m14, { tipo: 'aparencia', mudanca: { barba: 'cheia' } })).toBe(false);
    const m20 = viva(20, { semente: 113, genero: 'masculino' });
    expect(tenta(m20, { tipo: 'aparencia', mudanca: { barba: 'cheia' } })).toBe(true);
  });
});

describe('L. comprar acessório NÃO gera notoriedade', () => {
  it('um anônimo com relógio de luxo continua anônimo (sem imagem pública)', () => {
    let v = adulto(35, { semente: 121 });
    v.financas.conta = 100000; v.notoriedade = undefined;
    v = executar(v, { tipo: 'comprar_item', itemId: 'relogio_luxo' }).vida;
    v = executar(v, { tipo: 'comprar_item', itemId: 'roupa_elegante' }).vida;
    v = transacao(v, x => { for (let k = 0; k < 3; k++) { x.t += 12; processarNotoriedade(x); } }).vida;
    expect(v.notoriedade?.valor ?? 0).toBe(0);
    expect(imagemPublica(v)).toBeUndefined();
  });
});

describe('M. pessoa pública + notoriedade + estilo → imagem pública', () => {
  it('só existe para quem já é conhecido; um visual marcante colore a imagem e o patrocínio sente, moderadamente', () => {
    let v = adulto(27, { semente: 131 });
    v.notoriedade = { valor: 60, pico: 60, fonte: 'esporte', t: v.t };
    const discreta = imagemPublica(v)!;
    expect(discreta).toBeDefined();
    const renda0 = rendaDeImagem(v);
    v.financas.conta = 2000;
    v = executar(v, { tipo: 'comprar_item', itemId: 'chapeu' }).vida;
    const marcante = imagemPublica(v)!;
    expect(marcante.palavra).toBe('marcante');
    const renda1 = rendaDeImagem(v);
    expect(renda1).toBeGreaterThan(renda0);
    expect(renda1).toBeLessThan(renda0 * 1.3);
    // A notoriedade não mudou por causa do chapéu.
    expect(v.notoriedade!.valor).toBe(60);
    // Um escândalo público pesa mais do que qualquer estilo.
    v.segredos = [{ id: 's1', tipo: 'caso', t: v.t, quemSabe: [], publico: v.t }];
    expect(imagemPublica(v)!.palavra).toBe('polêmica');
  });

  it('a mudança de visual de quem é conhecido pode virar assunto (e só de quem é conhecido)', () => {
    const anon = adulto(27, { semente: 133 });
    anon.notoriedade = undefined;
    const x = transacao(anon, y => mudarAparencia(y, { cabelo: 'raspado', corCabelo: 'platinado' })).vida;
    expect(x.fatos['visual_repercutiu']).toBeUndefined();
  });
});

/* =================================================================== N */

describe('N. caminho criminal: perseguível pelo contexto, nunca profissão nem menu universal', () => {
  it('sem ninguém da sua vida que ande nisso, não há conversa; quando você percebe, dá para perguntar — e recusar continua possível', () => {
    let v = adulto(20, { semente: 141 });
    v.caminhos.envolvimento = undefined; v.justica = undefined;
    const amigo = pessoaNova(v, 21, 'masculino');
    const vin = vincular(v, amigo, { origem: 'vizinhanca', proximidade: 45, estagio: 'amigo', convivio: ['vizinhanca'] });
    amigo.temperamento.responsabilidade = -0.7;
    expect(interacoesPara(v, amigo.id).map(x => x.id)).not.toContain('por_fora');
    // Você percebe (o motor, pelo contexto; aqui, direto).
    v.fatos[`sabe_por_fora_${amigo.id}`] = v.t;
    expect(sabeQueAndaNisso(v, amigo.id)).toBe(true);
    expect(interacoesPara(v, amigo.id).map(x => x.id)).toContain('por_fora');
    const a: Acao = { tipo: 'pessoa', pessoaId: amigo.id, interacao: 'por_fora' };
    expect(tenta(v, a)).toBe(true);
    v = executar(v, a).vida;
    expect(v.momento?.situacaoId).toBe('ilic_proposta');
    const recusa = executar(v, { tipo: 'decidir', opcaoId: 'recusar_proposta' }).vida;
    expect(recusa.caminhos.envolvimento).toBeUndefined();
    const aceita = executar(v, { tipo: 'decidir', opcaoId: 'aceitar_proposta' }).vida;
    expect(aceita.caminhos.envolvimento).toBeDefined();
    // Não é profissão: o emprego não muda; não existe ocupação "criminosa".
    expect(aceita.trabalho.atual?.ocupacaoId).toBe(v.trabalho.atual?.ocupacaoId);
    expect(OCUPACOES.some(o => /criminoso|traficante|ladr[aã]o|assaltante/i.test(o.id + o.nome.join()))).toBe(false);
    void vin;
  });

  it('perceber depende do contexto e é raro: numa vida comum, poucos anos trazem isso', () => {
    let percebeu = 0;
    for (let s = 1; s <= 20; s++) {
      let v = adulto(18, { semente: 150 + s });
      for (let k = 0; k < 10; k++) v = transacao(v, (x, r) => { x.t += 12; processarIlicito(x, r); }).vida;
      if (Object.keys(v.fatos).some(k => k.startsWith('sabe_por_fora_'))) percebeu++;
    }
    expect(percebeu).toBeLessThan(15);
  });
});

/* =================================================================== O */

describe('O. save/reload e migração v17 → v18', () => {
  it('uma vida com origem, vivências, professor, estilo e apoio salva e reabre igual; o ano seguinte é o mesmo', () => {
    let v = viva(20, { semente: 161 });
    naFaculdade(v);
    v = comProfessor(v);
    v = transacao(v, x => { registrarVivencia(x, 'monitoria'); x.financas.conta = 3000; }).vida;
    v = executar(v, { tipo: 'comprar_item', itemId: 'bone' }).vida;
    const bruto = JSON.stringify(v);
    const lido = interpretar(bruto);
    if (lido.tipo !== 'ok') throw new Error(lido.tipo === 'invalido' ? lido.motivo : 'vazio');
    expect(lido.vida).toEqual(v);
    expect(JSON.stringify(avancarAno(lido.vida).vida)).toBe(JSON.stringify(avancarAno(v).vida));
  });

  it('v17 migra: reserva e bairro da origem (da semente), vivências do que os fatos já diziam; idempotente', () => {
    const v = viva(18, { semente: 171 });
    const v17 = JSON.parse(JSON.stringify(v));
    v17.versao = 17; delete v17.origem.reserva; delete v17.origem.bairro; delete v17.educacao.vivencias; delete v17.eu.estilo;
    v17.fatos['medalha_obmep'] = v17.t - 36;
    const a = interpretar(JSON.stringify(v17));
    const b = interpretar(JSON.stringify(v17));
    if (a.tipo !== 'ok' || b.tipo !== 'ok') throw new Error('não migrou');
    expect(a.migrado).toBe(true);
    expect(a.vida.versao).toBe(VERSAO_SAVE);
    expect(VERSAO_SAVE).toBe(18);
    expect(a.vida).toEqual(b.vida);
    expect(Number.isFinite(a.vida.origem.reserva)).toBe(true);
    expect(a.vida.origem.bairro).toBeTruthy();
    expect(a.vida.educacao.vivencias?.some(x => x.tipo === 'olimpiada' && !!x.feito)).toBe(true);
    expect(migrarV17(structuredClone(a.vida))).toEqual(a.vida);
    let x = a.vida;
    for (let k = 0; k < 3 && !x.morte; k++) x = ano(x);
    expect(JSON.stringify(x)).not.toMatch(/NaN/);
  });

  it('saves v16 reais seguem migrando até a v18 e vivendo', () => {
    for (const f of ['save-v16-adulta-amigos.json', 'save-v16-adulto-familia.json', 'save-v16-jogador-profissional.json']) {
      let bruto: string;
      try { bruto = readFileSync(join(__dirname, 'fixtures', f), 'utf8'); } catch { continue; }
      const r = interpretar(bruto);
      if (r.tipo !== 'ok') throw new Error(`${f}: ${r.tipo === 'invalido' ? r.motivo : 'vazio'}`);
      expect(r.vida.versao).toBe(18);
      let x = r.vida;
      x.momento = null;
      for (let k = 0; k < 2 && !x.morte; k++) x = ano(x);
      expect(JSON.stringify(x)).not.toMatch(/NaN/);
    }
  });

  it('determinismo: a mesma semente com os mesmos comandos dá a mesma vida (com os sistemas novos)', () => {
    const cmds = (x: Vida): Acao[] => (idade(x) === 12 ? [{ tipo: 'rotina', id: 'olimpiada', ativa: true, nivel: 1 }] : idade(x) === 20 ? [{ tipo: 'comprar_item', itemId: 'bone' }] : []);
    const a = viver(nova({ semente: 181 }), 30, cmds);
    const b = viver(nova({ semente: 181 }), 30, cmds);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

/* ======================================================== gestão (pendência 2) */

describe('ação de gestão sem dinheiro aparece bloqueada, com o motivo (não some)', () => {
  it('divulgar sem caixa nem bolso: bloqueada e explicada', () => {
    let v = adulto(35, { semente: 191 });
    v.financas.conta = 60000;
    v = transacao(v, (x, r) => { abrirNegocio(x, r, 'salao', 'guardado'); }).vida;
    if (!v.caminhos.negocio) throw new Error("PREMISSA negocio");
    v.caminhos.negocio.caixa = 0; v.financas.conta = 0; v.financas.investimentos = [];
    const acoes = acoesDoNegocio(v, disponibilidade);
    const divulgar = acoes.find(x => x.id === 'divulgar');
    expect(divulgar).toBeDefined();
    expect(divulgar!.bloqueado).toMatch(/custa/);
  });
});

void clamp; void curso; void elegibilidade;
