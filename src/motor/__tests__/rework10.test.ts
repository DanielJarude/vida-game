/**
 * REWORK 10 — Uma vida de possibilidades.
 *
 * Fase A · ROT-05 — a base junto com a faculdade e o trabalho. Antes, estar numa base era ocupação EXCLUSIVA
 * (`compromissos.conflitoComBase`: todo emprego e todo curso presencial perguntavam "deixar a base?", e só). Agora a
 * resposta é a conta: os horários do clube (a base treina de dia, no contraturno; o time de cima amador, à noite), o
 * lugar (o alojamento), o turno que deixa o treino acontecer e o descanso da semana.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { interpretar } from '../save';
import type { NovoCompromisso, Vida } from '../tipos';
import { analisarEntrada, notaDaBaseCom, propor } from '../sistemas/compromissos';
import { agendaDaSemana, baseComONovo, sobrepoe } from '../sistemas/agenda';
import { entrarNaBase, entrarPeloAmador } from '../sistemas/esporte';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { custoDoEstudo } from '../sistemas/custoDoEstudo';
import { executarFormacao, processarBolsaDeAtleta, verbosDaFormacao } from '../sistemas/naFormacao';

const r = criarRng(10);
const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const resolver = (v: Vida): Vida => {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return transacao(v, x => { x.momento = null; }).vida;
};
/** Um jogador de base de 18 anos (a base do Sport, na cidade onde mora), sem curso nem trabalho. */
function naBase(i = 18, o: { amador?: boolean; longe?: string } = {}): Vida {
  return em(adulto(i, { genero: 'masculino', semente: 31 }), x => {
    x.educacao.matricula = undefined;
    x.trabalho.atual = undefined;
    x.caminhos.esporte = undefined;
    x.rotinas = [];
    x.caminhos.frentes.futebol = { interesse: 80, meses: 120, habilidade: 66, tInicio: x.t - 120, tUltimo: x.t, retomadas: 0, auge: 66 };
    if (o.amador) { entrarPeloAmador(x, 'futebol', x.moradia.municipioId, 'Sport'); x.rotinas.push({ id: 'futebol', nivel: 3, tInicio: x.t }); }
    else entrarNaBase(x, 'futebol', o.longe ?? x.moradia.municipioId, 'Sport');
  });
}
const curso = (v: Vida, cursoId: string, rede: 'publica' | 'privada' = 'publica', municipioId = v.moradia.municipioId): NovoCompromisso =>
  ({ tipo: 'curso', cursoId, via: rede === 'privada' ? 'privada' : 'sisu', modalidade: 'presencial', rede, mensalidade: rede === 'privada' ? 1200 : 0, municipioId, instituicao: rede === 'privada' ? 'a faculdade particular' : 'a universidade federal' });
const emprego = (ocupacaoId: string): NovoCompromisso => ({ tipo: 'emprego', ocupacaoId, via: 'convite' });
const daBase = (v: Vida) => analisarEntrada(v, v.caminhos.pendente?.novo ?? curso(v, 'direito')).find(c => c.com === 'base');
/** Nenhum bloco fixo atravessa outro, e o treino não cai em cima de aula nem de expediente. */
function semDuplicarTempo(v: Vida): void {
  const a = agendaDaSemana(v);
  const fixos = a.blocos.filter(b => !b.movel && b.origem !== 'trajeto');
  for (let i = 0; i < fixos.length; i++) for (let j = i + 1; j < fixos.length; j++) expect(sobrepoe(fixos[i], fixos[j]), `${fixos[i].rotulo} × ${fixos[j].rotulo}`).toBe(false);
  for (const t of a.blocos.filter(b => b.ref === 'futebol')) for (const f of fixos) expect(sobrepoe(t, f), `treino × ${f.rotulo}`).toBe(false);
}

describe('ROT-05 · a base junto com a faculdade e o trabalho', () => {
  it('base + faculdade de meio período na mesma cidade: entra sem pergunta, no turno que deixa os cinco treinos', () => {
    const v0 = naBase();
    const novo = curso(v0, 'direito');
    expect(analisarEntrada(v0, novo).some(c => c.com === 'base')).toBe(false);
    expect(notaDaBaseCom(v0, novo)).toMatch(/Cabe junto com a base do Sport: os 5 treinos/);
    let res = '';
    const v = em(v0, x => { res = propor(x, r, novo); });
    expect(res).toBe('feito');
    expect(v.caminhos.esporte?.fase).toBe('base');
    expect(v.educacao.matricula?.cursoId).toBe('direito');
    expect(v.agenda?.turnos?.curso).toBeDefined();
    expect(agendaDaSemana(v).presenca.futebol ?? 1).toBe(1);
    semDuplicarTempo(v);
  });

  it('base + faculdade em período integral: recusa com o motivo real (o horário), sem plano de conciliar', () => {
    const v0 = naBase();
    const c = analisarEntrada(v0, curso(v0, 'medicina')).find(x => x.com === 'base')!;
    expect(c).toBeDefined();
    expect(c.motivo).toMatch(/Horário incompatível: a base do Sport treina de dia/);
    expect(c.motivo).not.toMatch(/ocupad/i);
    expect(c.alternativas.some(a => a.conciliar)).toBe(false);
  });

  it('base + meio período (aos 18 e, como aprendiz, aos 16): cabe no contraturno', () => {
    const v18 = naBase(18);
    expect(analisarEntrada(v18, emprego('operador_telemarketing')).some(c => c.com === 'base')).toBe(false);
    let v = em(v18, x => { propor(x, r, emprego('operador_telemarketing')); });
    expect(v.trabalho.atual?.ocupacaoId).toBe('operador_telemarketing');
    expect(v.caminhos.esporte?.fase).toBe('base');
    semDuplicarTempo(v);
    const v16 = em(naBase(16), x => { if (x.educacao.basica) x.educacao.basica.etapa = 'medio'; });
    if (v16.educacao.basica && !v16.educacao.evadiu) {
      const a = baseComONovo(v16, emprego('jovem_aprendiz'))!;
      expect(a.vezes).toBe(5);
      // Escola num turno, aprendiz no outro: o treino perde horário — e isso é dito com números, não "ocupado".
      const c = analisarEntrada(v16, emprego('jovem_aprendiz')).find(x => x.com === 'base');
      if (c) expect(c.motivo).toMatch(/treinos da semana|Descanso insuficiente/);
    }
    v = avancarAno(v).vida;
    expect(v.morte).toBeUndefined();
  });

  it('base de formação + trabalho integral: o treino é de dia — recusa pelo horário; o time de cima amador (à noite) cabe', () => {
    const base = naBase(20);
    const c = analisarEntrada(base, emprego('caixa')).find(x => x.com === 'base');
    expect(c?.motivo).toMatch(/Horário incompatível/);
    const amador = naBase(20, { amador: true });
    const a = baseComONovo(amador, emprego('caixa'))!;
    expect(a.cabem).toBe(a.vezes);
    expect(analisarEntrada(amador, emprego('caixa')).find(x => x.com === 'base')?.motivo ?? '').not.toMatch(/Horário incompatível/);
  });

  it('base + faculdade + trabalho: ou cabe com o preço dito, ou diz o que falta — nunca duplica horas', () => {
    let v = em(naBase(19), x => { propor(x, r, curso(x, 'direito')); });
    expect(v.educacao.matricula).toBeDefined();
    const novo = emprego('operador_telemarketing');
    const c = analisarEntrada(v, novo).find(x => x.com === 'base');
    if (c) {
      expect(c.motivo).toMatch(/treinos da semana|Descanso insuficiente|passa do que se aguenta/);
      // Se houver plano de conciliar, ele diz o preço antes.
      for (const alt of c.alternativas.filter(x => x.conciliar)) expect(alt.consequencia.length).toBeGreaterThan(20);
    }
    v = em(v, x => { propor(x, r, novo); });
    if (v.caminhos.pendente) v = resolver(em(v, x => { x.caminhos.pendente!.perguntado = false; }));
    semDuplicarTempo(v);
    for (let k = 0; k < 3; k++) { v = resolver(avancarAno(v).vida); expect(v.morte).toBeUndefined(); }
  });

  it('o alojamento em outra cidade: o curso presencial na cidade de casa não cabe — e o motivo é o lugar', () => {
    const v0 = adulto(18, { genero: 'masculino', semente: 31 });
    const outra = v0.moradia.municipioId === 'recife-pe' ? 'salvador-ba' : 'recife-pe';
    const v = naBase(18, { longe: outra });
    const c = analisarEntrada(v, curso(v, 'direito')).find(x => x.com === 'base')!;
    expect(c.motivo).toMatch(/alojamento/);
    expect(analisarEntrada(v, emprego('operador_telemarketing')).find(x => x.com === 'base')?.motivo).toMatch(/alojamento/);
  });

  it('entrar na base com a faculdade noturna/diurna de meio período: cabe; com a integral, a vida pergunta', () => {
    const v0 = em(adulto(19, { genero: 'masculino', semente: 31 }), x => { x.caminhos.esporte = undefined; x.trabalho.atual = undefined; x.educacao.matricula = { cursoId: 'direito', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId }; });
    const base: NovoCompromisso = { tipo: 'base', dominio: 'futebol', municipioId: v0.moradia.municipioId, clube: 'Sport' };
    expect(analisarEntrada(v0, base)).toHaveLength(0);
    const integral = em(v0, x => { x.educacao.matricula!.cursoId = 'medicina'; });
    expect(analisarEntrada(integral, base).some(c => c.com === 'curso')).toBe(true);
  });

  it('profissional + faculdade noturna: sem conflito (o treino do clube é de dia)', () => {
    const v = em(adulto(22, { genero: 'masculino', semente: 31 }), x => {
      x.educacao.matricula = undefined;
      contratar(x, r, ocupacao('jogador_futebol'), 'teste');
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 2, tInicio: x.t, tFase: x.t, lesoes: 0, municipioId: x.moradia.municipioId };
    });
    expect(analisarEntrada(v, curso(v, 'direito'))).toHaveLength(0);
  });

  it('quem perde treinos é visto faltando: a nota do ano e o risco de dispensa sobem (a agenda é a mesma conta)', () => {
    // 15 anos, a escola de manhã (segue no ano seguinte), e o treino marcado às 9h: a agenda tira as vezes que batem.
    let v = em(naBase(15), x => { x.agenda = { turnos: { escola: 'manha' }, lugares: { futebol: { dias: [0, 1, 2, 3, 4], inicio: 9 * 60 } } }; });
    expect(v.educacao.basica).toBeDefined();
    expect(agendaDaSemana(v).presenca.futebol ?? 1).toBeLessThan(0.5);
    v = avancarAno(v).vida;
    expect(v.biografia.some(e => /Perdeu metade ou mais dos treinos do Sport/.test(e.texto))).toBe(true);
  });

  it('a recusa diz o motivo de verdade na matrícula (não "integral ou outra cidade")', () => {
    const v = naBase();
    let pend = '';
    em(v, x => { propor(x, r, curso(x, 'medicina')); pend = x.caminhos.pendente?.conflitos[0] ?? ''; });
    expect(pend).toMatch(/Horário incompatível/);
    expect(daBase(v)).toBeUndefined();
  });

  it('save/load com base + curso + turno guardado: ida e volta idêntica, e o ano passa', () => {
    let v = em(naBase(18), x => { propor(x, r, curso(x, 'direito')); });
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(JSON.stringify(lido.vida)).toBe(JSON.stringify(v));
    for (let k = 0; k < 4; k++) { v = resolver(avancarAno(v).vida); expect(v.morte).toBeUndefined(); }
  });
});

describe('ROT-05 · a bolsa de atleta', () => {
  const comFaculdadeParticular = () => em(naBase(18), x => { propor(x, r, curso(x, 'direito', 'privada')); x.caminhos.frentes.futebol!.habilidade = 78; });

  it('não existe sem pedir (estar na base não dá bolsa) e só aparece para quem treina a sério em faculdade paga', () => {
    const v = comFaculdadeParticular();
    expect(v.educacao.matricula?.bolsaAtleta).toBeUndefined();
    expect(verbosDaFormacao(v).some(x => x.oque === 'bolsa_atleta')).toBe(true);
    const publica = em(naBase(18), x => { propor(x, r, curso(x, 'direito')); });
    expect(verbosDaFormacao(publica).some(x => x.oque === 'bolsa_atleta')).toBe(false);
    const semTreino = em(v, x => { x.caminhos.esporte = undefined; x.rotinas = []; });
    expect(verbosDaFormacao(semTreino).some(x => x.oque === 'bolsa_atleta')).toBe(false);
  });

  it('concedida: a mensalidade cai de verdade; deixar de treinar dá aviso e, no ano seguinte, a bolsa acaba', () => {
    let v = comFaculdadeParticular();
    const antes = custoDoEstudo(v)!;
    for (let s = 0; s < 40 && !v.educacao.matricula?.bolsaAtleta; s++) v = transacao(v, x => { delete x.fatos[Object.keys(x.fatos).find(k => k.startsWith('formacao:bolsa_atleta')) ?? '']; executarFormacao(x, criarRng(s), 'bolsa_atleta'); }).vida;
    const b = v.educacao.matricula!.bolsaAtleta!;
    expect(b).toBeDefined();
    expect(b.fracao).toBe(1); // técnica 78: integral
    const depois = custoDoEstudo(v)!;
    expect(depois.regime).toBe('bolsa_integral');
    expect(depois.doEstudante).toBeLessThan(antes.doEstudante + 1);
    expect(depois.doEstudante).toBe(0);
    // Para de treinar: aviso, e depois perde.
    v = em(v, x => { x.caminhos.esporte = undefined; x.rotinas = []; processarBolsaDeAtleta(x); });
    expect(v.educacao.matricula!.bolsaAtleta?.aviso).toBeDefined();
    v = em(v, x => { processarBolsaDeAtleta(x); });
    expect(v.educacao.matricula!.bolsaAtleta).toBeUndefined();
    expect(v.biografia.some(e => /Perdeu a bolsa de atleta/.test(e.texto))).toBe(true);
    expect(custoDoEstudo(v)!.regime).toBe('paga');
  });

  it('a bolsa parcial desconta só a parte dela', () => {
    const v = em(comFaculdadeParticular(), x => { x.educacao.matricula!.bolsaAtleta = { modalidade: 'futebol', fracao: 0.5, tInicio: x.t }; });
    const c = custoDoEstudo(v)!;
    expect(c.regime).toBe('paga');
    expect(c.bolsa).toBe(0.5);
    expect(c.doEstudante + c.daFamilia).toBe(Math.round(v.educacao.matricula!.mensalidade * 0.5));
  });
});
