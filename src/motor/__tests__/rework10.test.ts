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

/* ================================================================ Fase C · as relações (§16) */

import { comParceiro, pessoaNova } from './cenarios';
import { vincular } from '../pessoas';
import { forcaDaRelacao } from '../sistemas/lacos';
import { brigaFisica, escalar, marcoAfetivo, PERFIS, processarConvivio, recusaDoConvite, tardesDoAno, vereditoDeTempo } from '../sistemas/convivio';
import { ctxPessoa, disponibilidadeInteracao } from '../sistemas/interacoes';
import { disponibilidade } from '../acoes';
import { podeTentar } from '../plausibilidade';
import type { Pessoa } from '../tipos';

/** A mesma vida com outra semente (fora da transação: ela grava o estado do gerador de volta no fim). */
const comRng = (v: Vida, k: number): Vida => ({ ...structuredClone(v), rng: Math.imul(k + 1, 2654435761) >>> 0 });
/** Executa a interação com sementes diferentes até `ok` (ou desiste): devolve a vida e o resultado. */
function ate(v: Vida, pessoaId: string, interacao: string, ok: (w: Vida) => boolean, n = 60): { v: Vida; res: string; achou: boolean } {
  for (let k = 0; k < n; k++) {
    const out = executar(comRng(v, k), { tipo: 'pessoa', pessoaId, interacao });
    if (ok(out.vida)) return { v: out.vida, res: out.resultado ?? out.aviso?.texto ?? '', achou: true };
  }
  return { v, res: '', achou: false };
}
function saindoCom(env: number, i = 26, tensao = 5): { v: Vida; id: string } {
  let id = '';
  const v = em(adulto(i, { semente: 41 }), x => {
    const p = pessoaNova(x, i + 1, 'masculino', { atracao: 'mulheres' });
    const vin = vincular(x, p, { origem: 'romance', proximidade: 55 });
    vin.tInicio = x.t - 30;
    vin.tensao = tensao;
    vin.romance = { estagio: 'saindo', tEstagio: x.t - 12, tInicio: x.t - 24, envolvimento: env };
    x.eu.atracao = 'homens';
    id = p.id;
  });
  return { v, id };
}

describe('REL-02 · namoro e casamento como marcos afetivos', () => {
  it('namoro aceito: a barra sobe de verdade (afeto, confiança, envolvimento) e o começo vira momento importante', () => {
    const { v, id } = saindoCom(92);
    const antes = forcaDaRelacao(v, v.vinculos[id]);
    const { v: w, achou } = ate(v, id, 'pedir_namoro', x => x.vinculos[id].romance?.estagio === 'namoro');
    expect(achou).toBe(true);
    const vin = w.vinculos[id];
    expect(forcaDaRelacao(w, vin) - antes).toBeGreaterThanOrEqual(6);
    expect(vin.historia.some(h => h.texto === 'Começaram a namorar.' && h.peso === 3)).toBe(true);
    expect(w.fatos[`marco_namoro_${id}`]).toBeDefined();
  });

  it('namoro recusado: o motivo é dito, fica guardado e o pedido não volta logo', () => {
    const { v, id } = saindoCom(30);
    const { v: w, res, achou } = ate(v, id, 'pedir_namoro', x => x.fatos[`recusa_namoro_${id}`] !== undefined);
    expect(achou).toBe(true);
    expect(res).toMatch(/não sente o mesmo|cedo|como estão|não quer/);
    const d = disponibilidadeInteracao(transacao(w, x => { x.anoAtual.acoes = []; }).vida, id, 'pedir_namoro');
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/há pouco|insistir/);
  });

  it('o mesmo sim pesa menos numa relação com traição e brigas — e não apaga a tensão', () => {
    const limpa = em(adulto(30, { semente: 42 }), x => { comParceiro(x, { estagio: 'namoro', anos: 3 }); });
    const pesada = em(adulto(30, { semente: 42 }), x => {
      const { vin } = comParceiro(x, { estagio: 'namoro', anos: 3 });
      vin.tensao = 50;
      vin.historia.push({ t: x.t - 12, texto: 'A traição.', tipo: 'traicao', peso: 3 }, { t: x.t - 6, texto: 'A briga.', tipo: 'conflito', peso: 2 });
    });
    const ganho = (v: Vida) => {
      const id = Object.values(v.vinculos).find(x => x.romance)!.pessoaId;
      let frase: string | undefined; let d = 0; let tensaoDepois = 0;
      em(v, x => { const vin = x.vinculos[id]; const a = vin.proximidade; frase = marcoAfetivo(x, x.pessoas[id], vin, 'casamento'); d = vin.proximidade - a; tensaoDepois = vin.tensao; });
      return { d, frase, tensaoDepois, tensaoAntes: v.vinculos[id].tensao };
    };
    const a = ganho(limpa), b = ganho(pesada);
    expect(a.d).toBeGreaterThan(b.d);
    expect(b.frase).toMatch(/não apagou/);
    expect(b.tensaoDepois).toBe(b.tensaoAntes);
  });

  it('casamento recusado com as coisas ruins: vira conversa sobre expectativas, e o pedido fica bloqueado com o porquê', () => {
    let id = '';
    const v = em(adulto(32, { semente: 43 }), x => { const c = comParceiro(x, { estagio: 'morando_junto', anos: 4 }); c.vin.tensao = 60; c.vin.romance!.envolvimento = 55; id = c.p.id; });
    const { v: w, res, achou } = ate(v, id, 'pedir_casamento', x => x.fatos[`recusa_noivado_${id}`] !== undefined);
    expect(achou).toBe(true);
    expect(res).toMatch(/espera|como estão|não quer casar/);
    expect(podeTentar(disponibilidadeInteracao(transacao(w, x => { x.anoAtual.acoes = []; }).vida, id, 'pedir_casamento'))).toBe(false);
  });

  it('casamento aceito: o noivado e o casamento aproximam, e as memórias atravessam o save', () => {
    let id = '';
    const v = em(adulto(32, { semente: 44 }), x => { const c = comParceiro(x, { estagio: 'morando_junto', anos: 4 }); c.vin.romance!.envolvimento = 95; c.vin.tensao = 0; id = c.p.id; });
    const { v: noivos, achou } = ate(v, id, 'pedir_casamento', x => x.fatos[`noivado_${id}`] !== undefined);
    expect(achou).toBe(true);
    let w = transacao(noivos, x => { x.fatos[`noivado_${id}`] = x.t - 12; x.anoAtual.acoes = []; }).vida;
    w = executar(w, { tipo: 'pessoa', pessoaId: id, interacao: 'marcar_casamento' }).vida;
    expect(w.momento?.situacaoId).toBe('rom_casamento');
    const prox = w.vinculos[id].proximidade;
    w = executar(w, { tipo: 'decidir', opcaoId: 'cartorio' }).vida;
    expect(w.vinculos[id].romance?.estagio).toBe('casamento');
    expect(w.vinculos[id].proximidade).toBeGreaterThan(prox);
    const lido = interpretar(JSON.stringify(w));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') {
      expect(lido.vida.vinculos[id].historia.some(h => h.texto === 'Ficaram noivos.')).toBe(true);
      expect(lido.vida.vinculos[id].historia.some(h => h.tipo === 'casamento')).toBe(true);
      expect(lido.vida.fatos[`marco_casamento_${id}`]).toBeDefined();
    }
  });
});

/** Um amigo com o temperamento dado (para a escada do conflito). A vida-base é feita uma vez (viver 30 anos é caro). */
let BASE30: string | undefined;
function amigo(t: Partial<Pessoa['temperamento']>, tensao = 20, k = 0): { v: Vida; id: string } {
  BASE30 ??= JSON.stringify(adulto(30, { semente: 45 }));
  let id = '';
  const v = em(JSON.parse(BASE30) as Vida, x => {
    x.seq += k * 13;
    const p = pessoaNova(x, 30, 'masculino');
    p.temperamento = { extroversao: 0, afabilidade: 0, responsabilidade: 0, abertura: 0, estabilidade: 0, ...t };
    const vin = vincular(x, p, { origem: 'escola', proximidade: 60, estagio: 'amigo' });
    vin.tensao = tensao;
    id = p.id;
  });
  return { v, id };
}
const degraus = (t: Partial<Pessoa['temperamento']>, tensao: number, peso: 1 | 2 | 3) => {
  const conta: Record<string, number> = {};
  const { v, id } = amigo(t, tensao);
  for (let k = 0; k < 300; k++) {
    em(v, x => { const c = ctxPessoa(x, id)!; const d = escalar(c, peso, 'teste', { ...criarRng(k + 1) } as ReturnType<typeof criarRng>); conta[d] = (conta[d] ?? 0) + 1; });
  }
  return conta;
};

describe('REL-03 · conflitos: a escada sobe, desce, termina', () => {
  it('discussão leve com quem é calmo quase nunca vira conflito sério; ofensa com quem tem pavio curto, sim', () => {
    const calmo = degraus({ estabilidade: 0.9, afabilidade: 0.8 }, 10, 1);
    const quente = degraus({ estabilidade: -0.8, afabilidade: -0.6 }, 60, 2);
    const serio = (c: Record<string, number>) => (c.conflito_serio ?? 0) + (c.ruptura ?? 0) + (c.agressao ?? 0);
    expect(serio(calmo)).toBeLessThan(25);
    expect((calmo.acalmou ?? 0) + (calmo.desentendimento ?? 0)).toBeGreaterThan(220);
    expect(serio(quente)).toBeGreaterThan(serio(calmo) * 3);
  });

  it('a mentira evita a briga agora e pode ser descoberta depois (confiança despenca, a pessoa cobra) — ou nunca', () => {
    let descobertas = 0, nunca = 0;
    for (let k = 0; k < 12; k++) {
      const { v, id } = amigo({}, 45, k);
      // (o sorteio do ano é da vida e do mês: amigos iguais no mesmo mês teriam o mesmo destino — cada um começa num mês)
      let w = executar(transacao(v, x => { x.t += k; }).vida, { tipo: 'pessoa', pessoaId: id, interacao: 'mentir' }).vida;
      const confAntes = w.vinculos[id].confianca;
      expect(w.vinculos[id].tensao).toBeLessThan(45);
      let descobriu = false;
      for (let a = 1; a <= 10 && !descobriu; a++) { w = transacao(w, x => { x.t += 12; processarConvivio(x); }).vida; descobriu = w.fatos[`mentira_descoberta_${id}`] !== undefined; }
      if (!descobriu) { nunca++; continue; }
      descobertas++;
      expect(w.vinculos[id].confianca).toBeLessThan(confAntes);
      expect(w.vinculos[id].historia.some(h => h.tipo === 'traicao' && /mentira/.test(h.texto))).toBe(true);
    }
    expect(descobertas).toBeGreaterThan(3);
    expect(nunca).toBeGreaterThan(0);
  });

  it('agressão: pode não haver lesão — ou haver, com atendimento (a lesão é uma condição), e a denúncia vira processo', () => {
    let semLesao = false, comLesao = false, processo = false, voceMachucado = false;
    for (let k = 0; k < 80; k++) {
      const { v, id } = amigo({}, 70, k);
      em(v, x => {
        x.vinculos[id].conflito = { t: x.t, assunto: 'dinheiro', gravidade: 3, quem: 'outro' };
        const antes = x.pessoas[id].saude;
        const out = brigaFisica(ctxPessoa(x, id)!, criarRng(k + 3), 'eu');
        if (out.lesaoDela === 0) semLesao = true;
        if (out.lesaoDela >= 2) { comLesao = true; expect(x.pessoas[id].saude).toBeLessThan(antes); }
        if (out.lesaoSua > 0) { voceMachucado = true; expect(x.corpo.condicoes.some(c => !!c.lesao)).toBe(true); }
        if (out.denuncia) { processo = true; expect(!!x.justica?.processo || (x.justica?.antecedentes.length ?? 0) > 0).toBe(true); }
        expect(x.vinculos[id].confianca).toBeLessThan(60);
      });
    }
    expect(semLesao && comLesao && processo && voceMachucado).toBe(true);
  });

  it('agredir não aparece sem conflito (não é opção à toa)', () => {
    const { v, id } = amigo({}, 5);
    expect(ctxPessoa(v, id) && podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: id, interacao: 'agredir' }))).toBe(false);
  });

  it('a briga antiga esfria, afasta — ou a pessoa toma a iniciativa de fazer as pazes', () => {
    const vistos = new Set<string>();
    for (let k = 0; k < 40; k++) {
      const { v, id } = amigo({ afabilidade: k % 2 ? 0.8 : -0.5, estabilidade: 0 }, 60, k);
      const w = transacao(v, x => { x.t += 12 * (k + 1); x.vinculos[id].conflito = { t: x.t - 30, assunto: 'política', gravidade: 2, quem: 'eu' }; x.vinculos[id].proximidade = 30; processarConvivio(x); }).vida;
      const vin = w.vinculos[id];
      if (vin.chamado?.tipo === 'desculpas') vistos.add('iniciativa');
      else if (vin.estagio === 'afastado') vistos.add('afastou');
      else if (!vin.conflito) vistos.add('esfriou');
    }
    expect(vistos.has('iniciativa')).toBe(true);
    expect(vistos.size).toBeGreaterThanOrEqual(2);
  });

  it('separação: o fim fica na história com peso; reconciliar é possível depois (a porta não fecha para sempre)', () => {
    let id = '';
    const v = em(adulto(35, { semente: 46 }), x => { id = comParceiro(x, { estagio: 'casamento', anos: 6 }).p.id; });
    const w = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: 'terminar' }).vida;
    expect(w.vinculos[id].romance?.estagio).toBe('ex');
    expect(w.vinculos[id].historia.some(h => (h.peso ?? 1) >= 3 && h.tipo === 'conflito')).toBe(true);
  });
});

describe('NPC-04 e REL-01 · a outra pessoa decide; os programas são diferentes', () => {
  it('o convite pode ser recusado (com o motivo dela) — e nada é cobrado', () => {
    let recusados = 0;
    for (let k = 0; k < 60; k++) {
      const { v, id } = amigo({ extroversao: -0.8 }, 50, k);
      const c = ctxPessoa(v, id)!;
      const motivo = recusaDoConvite(c, 'show');
      if (!motivo) continue;
      recusados++;
      expect(motivo.length).toBeGreaterThan(20);
      const w = transacao(v, x => { x.financas.conta = 5000; }).vida;
      const out = executar(w, { tipo: 'pessoa', pessoaId: id, interacao: 'show' });
      if (out.vida.anoAtual.acoes.includes(`pessoa:show:${id}`) && out.resultado === motivo) expect(out.vida.financas.conta).toBe(5000);
    }
    expect(recusados).toBeGreaterThan(5);
  });

  it('cinema e show não dão o mesmo: o show varia muito mais (a noite da vida ou o tédio); o cinema acalma mais', () => {
    const efeitos = (prog: 'cinema' | 'show') => {
      const dp: number[] = []; const dt: number[] = [];
      for (let k = 0; k < 160; k++) {
        const { v, id } = amigo({ extroversao: 0.2, afabilidade: 0.2 }, 30, k);
        const w = transacao(comRng(v, k), x => { x.financas.conta = 9000; for (const key of Object.keys(x.fatos)) if (key.startsWith('convite')) delete x.fatos[key]; }).vida;
        const out = executar(w, { tipo: 'pessoa', pessoaId: id, interacao: prog });
        if (out.vida.financas.conta === 9000) continue; // recusou
        dp.push(out.vida.vinculos[id].proximidade - v.vinculos[id].proximidade);
        dt.push(v.vinculos[id].tensao - out.vida.vinculos[id].tensao);
      }
      const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const dp2 = media(dp.map(x => (x - media(dp)) ** 2));
      return { varProx: dp2, calma: media(dt), n: dp.length };
    };
    const cin = efeitos('cinema'), sho = efeitos('show');
    expect(cin.n).toBeGreaterThan(80); expect(sho.n).toBeGreaterThan(80);
    expect(sho.varProx).toBeGreaterThan(cin.varProx * 1.3);
    expect(cin.calma).toBeGreaterThan(sho.calma);
    expect(PERFIS.show.risco).toBeGreaterThan(PERFIS.cinema.risco);
  });

  it('o tempo do ano acaba: com a semana cheia, a viagem não cabe — mas uma conversa sempre cabe', () => {
    const { v } = amigo({}, 10);
    const cheio = transacao(v, x => { const n = Math.ceil(tardesDoAno(x)); for (let k = 0; k < n; k++) x.anoAtual.acoes.push(`pessoa:cinema:x${k}`); }).vida;
    expect(podeTentar(vereditoDeTempo(cheio, 'viajar_juntos'))).toBe(false);
    expect(vereditoDeTempo(cheio, 'viajar_juntos').motivo).toMatch(/Falta tempo/);
    expect(podeTentar(vereditoDeTempo(cheio, 'conversar'))).toBe(true);
  });
});
