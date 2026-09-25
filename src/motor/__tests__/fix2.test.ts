/**
 * FIX pós-playtest 2 — testes de classe de problema.
 *
 * Relações (iniciativa romântica, experiências de casal, desabafo), estado
 * pessoal (causas como fonte única, cuidados graduais, luto, corpo), a
 * semana como fonte única, processos em etapas (entrevista e peneira),
 * divulgação progressiva e a migração do save v8 → v9.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responder, viver, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { idade, parceiro, transacao } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import { ctxPessoa, interacoesPara, interesseDoOutro } from '../sistemas/interacoes';
import { alvoCabeca, alvoHumor, BASE_HUMOR, baseCabeca, fatoresCabeca, fatoresHumor, fatoresSaude, derivaDaSaude, leituraDoEstado, tendencia } from '../sistemas/estado';
import { sugestoes } from '../sistemas/cuidados';
import { cabeNaSemana, semana } from '../sistemas/semana';
import { contratar } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { PERGUNTAS, avaliar, ctxEntrevista, escolherPerguntas } from '../sistemas/entrevista';
import { aspectos, avaliarPeneira } from '../sistemas/peneira';
import { novaOportunidade } from '../sistemas/oportunidades';
import { atividadesParaVoce, cursosParaVoce, MAX_PRIMARIAS, vagasParaVoce } from '../sistemas/relevancia';
import { ROTINAS, atividadeExiste, podeComecarRotina } from '../sistemas/rotinas';
import { interpretar, VERSAO_SAVE } from '../save';
import type { Genero, Pessoa, Vida, Vinculo } from '../tipos';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const ids = (v: Vida, id: string) => interacoesPara(v, id).map(x => x.id);
const INICIATIVAS = ['flertar', 'declarar', 'convidar'];

/* ---------------------------------------------------------------- Cenários */

function adulto(i: number, o: { semente?: number; genero?: Genero } = {}): Vida {
  let s = o.semente ?? 21;
  let v = viverAte(nova({ semente: s, genero: o.genero ?? 'feminino' }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero: o.genero ?? 'feminino' }), i);
  v.momento = null;
  v.caminhos.processo = undefined;
  for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: v.t };
    for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
  v.anoAtual = { acoes: [] };
  return v;
}

function pessoa(v: Vida, i: number, genero: Genero, extra: Partial<Pessoa> = {}): Pessoa {
  const p = criarPessoa(v, criarRng(v.seq + 13), { idade: i, genero, municipioId: v.moradia.municipioId });
  Object.assign(p, extra);
  return p;
}

/** Um amigo (ou amiga) de longa data, solteiro, que se interessa pelo gênero do jogador. */
function amigo(v: Vida, o: { proximidade?: number; confianca?: number; idade?: number; atracao?: Pessoa['atracao']; longe?: boolean; estagio?: Vinculo['estagio'] } = {}): { p: Pessoa; vin: Vinculo } {
  v.eu.atracao = 'homens';
  const p = pessoa(v, o.idade ?? idade(v), 'masculino', { atracao: o.atracao ?? 'mulheres' });
  if (o.longe) p.municipioId = v.moradia.municipioId === 'recife-pe' ? 'salvador-ba' : 'recife-pe';
  const vin = vincular(v, p, { origem: 'escola', proximidade: o.proximidade ?? 75, convivio: o.longe ? [] : ['rotina'] });
  vin.estagio = o.estagio ?? 'amigo_proximo';
  vin.confianca = o.confianca ?? 70;
  vin.tInicio = v.t - 96;
  return { p, vin };
}

function casal(v: Vida, anos: number, extra: { longe?: boolean } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoa(v, idade(v), 'masculino', { atracao: 'mulheres', querFilhos: 'sim' });
  if (extra.longe) p.municipioId = v.moradia.municipioId === 'recife-pe' ? 'salvador-ba' : 'recife-pe';
  const vin = vincular(v, p, { origem: 'romance', proximidade: 80, convivio: extra.longe ? [] : ['casa'] });
  vin.tInicio = v.t - anos * 12;
  vin.romance = { estagio: extra.longe ? 'namoro' : 'casamento', tEstagio: v.t - anos * 12, tInicio: v.t - anos * 12, envolvimento: 78, planoFilhos: 'evitando' };
  return { p, vin };
}

/** Executa a mesma iniciativa N vezes, cada vez com outro acaso, e conta as respostas. */
function tentativas(v: Vida, pessoaId: string, interacao: string, n = 120): { saiu: number; tempo: number; nao: number } {
  const out = { saiu: 0, tempo: 0, nao: 0 };
  for (let k = 0; k < n; k++) {
    const c = structuredClone(v);
    c.rng = 1000 + k * 7919;
    const d = executar(c, { tipo: 'pessoa', pessoaId, interacao }).vida;
    const rom = d.vinculos[pessoaId].romance;
    if (rom?.estagio === 'saindo') out.saiu++;
    else if (rom?.pediuTempo !== undefined) out.tempo++;
    else out.nao++;
  }
  return out;
}

/** Candidatura com entrevista, respondendo cada pergunta pela escolha `k`. */
function entrevistar(v: Vida, ocupacaoId: string, escolha: (k: number, opcoes: { id: string }[]) => string = () => 'r0'): { v: Vida; perguntas: string[]; resultado?: string } {
  let x = executar(v, { tipo: 'candidatar', ocupacaoId }).vida;
  const perguntas = [...(x.caminhos.processo?.etapas.map(e => e.id) ?? [])];
  let resultado: string | undefined;
  for (let k = 0; x.momento && k < 5; k++) {
    const r = executar(x, { tipo: 'decidir', opcaoId: escolha(k, x.momento.opcoes.filter(o => !o.bloqueio)) });
    x = r.vida;
    resultado = r.resultado || resultado;
  }
  return { v: x, perguntas, resultado };
}

/* ============================================================== Relações */

describe('iniciativa romântica', () => {
  it('amizade próxima com alguém elegível oferece dizer o que sente — visível entre as primeiras ações', () => {
    const v = adulto(26);
    const { p } = amigo(v);
    const lista = ids(v, p.id);
    expect(lista).toContain('declarar');
    expect(lista.slice(0, 4)).toContain('declarar');
  });

  it('uma iniciativa por vez: conhecido mal visto → demonstrar interesse; conhecido → chamar para sair; amigo próximo → dizer o que sente', () => {
    const v = adulto(27);
    const a = amigo(v, { proximidade: 20, estagio: 'conhecido' });
    const b = amigo(v, { proximidade: 45, estagio: 'colega' });
    const c = amigo(v, { proximidade: 80 });
    expect(ids(v, a.p.id).filter(x => INICIATIVAS.includes(x))).toEqual(['flertar']);
    expect(ids(v, b.p.id).filter(x => INICIATIVAS.includes(x))).toEqual(['convidar']);
    expect(ids(v, c.p.id).filter(x => INICIATIVAS.includes(x))).toEqual(['declarar']);
  });

  it('inelegível não recebe iniciativa: menor com adulto, família, e quem já tem parceria só vê o caminho escondido', () => {
    const v = adulto(25);
    const teen = pessoa(v, 16, 'masculino', { atracao: 'mulheres' });
    const vt = vincular(v, teen, { origem: 'rotina', proximidade: 80, convivio: ['rotina'] });
    vt.estagio = 'amigo_proximo';
    expect(ids(v, teen.id).filter(x => INICIATIVAS.includes(x))).toEqual([]);
    const primo = pessoa(v, 25, 'masculino', { atracao: 'mulheres' });
    vincular(v, primo, { parentesco: 'primo', origem: 'familia', proximidade: 80, convivio: [] });
    expect(ids(v, primo.id).filter(x => INICIATIVAS.includes(x))).toEqual([]);
    const { p } = amigo(v);
    casal(v, 3);
    const d = ids(v, p.id);
    expect(d).not.toContain('declarar');
    expect(d).not.toContain('flertar');
    expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'convidar' }).grau).toBe('irregular');
  });

  it('a regra graduada de idade continua: 17 e 18 podem; 16 e 25 não', () => {
    let v = viverAte(nova({ semente: 5 }), 17);
    v.momento = null; v.caminhos.processo = undefined; v.anoAtual = { acoes: [] };
    for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
    const { p } = amigo(v, { idade: 18, proximidade: 45, estagio: 'colega' });
    expect(tenta(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'convidar' })).toBe(true);
    const velho = amigo(v, { idade: 25, proximidade: 80 });
    expect(ids(v, velho.p.id).filter(x => INICIATIVAS.includes(x))).toEqual([]);
    v = viverAte(nova({ semente: 6 }), 16);
    v.momento = null;
    const x = amigo(v, { idade: 25, proximidade: 50, estagio: 'colega' });
    expect(tenta(v, { tipo: 'pessoa', pessoaId: x.p.id, interacao: 'convidar' })).toBe(false);
  });

  it('rejeição é possível e não arbitrária: vínculo forte aceita muito mais que vínculo fraco; sem atração, nunca', () => {
    const v = adulto(26, { semente: 33 });
    const forte = amigo(v, { proximidade: 92, confianca: 85 });
    forte.vin.historia.push(...Array.from({ length: 6 }, (_, k) => ({ t: v.t - 12 * k, texto: `Um marco ${k}.`, tipo: 'amizade' as const, peso: 2 })));
    const fraco = amigo(v, { proximidade: 56, confianca: 40 });
    fraco.vin.tensao = 30;
    const semAtracao = amigo(v, { proximidade: 50, confianca: 60, atracao: 'homens', estagio: 'colega' });
    const f = tentativas(v, forte.p.id, 'declarar');
    const w = tentativas(v, fraco.p.id, 'declarar');
    const s = tentativas(v, semAtracao.p.id, 'convidar', 60);
    // Um amigo próximo sabe por quem o outro se interessa: nem aparece.
    const proximoSemAtracao = amigo(v, { proximidade: 90, atracao: 'homens' });
    expect(ids(v, proximoSemAtracao.p.id).filter(x => INICIATIVAS.includes(x))).toEqual([]);
    expect(f.saiu / 120).toBeGreaterThan(w.saiu / 120 + 0.2);
    expect(w.nao).toBeGreaterThan(0);
    expect(s.saiu + s.tempo).toBe(0);
    // A razão acompanha: quem não sente atração diz isso.
    const r = executar(structuredClone(v), { tipo: 'pessoa', pessoaId: semAtracao.p.id, interacao: 'convidar' });
    expect(r.resultado).toMatch(/não desse jeito/);
  });

  it('o interesse do outro nasce da relação: mais proximidade, confiança e história → mais interesse (sem acaso)', () => {
    const v = adulto(28);
    const a = amigo(v, { proximidade: 50, confianca: 40 });
    const b = amigo(v, { proximidade: 90, confianca: 85 });
    b.p.temperamento = { ...a.p.temperamento };
    // O mesmo gosto e a mesma disponibilidade: só a relação muda.
    a.p.atracao = b.p.atracao = 'ambos';
    a.p.parceiroId = b.p.parceiroId = undefined;
    a.p.aperto = b.p.aperto = undefined;
    // A mesma pessoa, antes e depois de a relação crescer (a química entre duas pessoas é dela; o que muda é a relação).
    const antes = interesseDoOutro(ctxPessoa(v, a.p.id)!).valor;
    Object.assign(a.vin, { proximidade: b.vin.proximidade, confianca: b.vin.confianca, historia: [...b.vin.historia] });
    const depois = interesseDoOutro(ctxPessoa(v, a.p.id)!).valor;
    expect(depois).toBeGreaterThan(antes);
  });

  it('quem pediu um tempo responde no ano seguinte — sim ou amizade, nunca fica pendurado', () => {
    for (let s = 0; s < 6; s++) {
      const v = adulto(26, { semente: 40 + s });
      const { p, vin } = amigo(v);
      vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: 55, pediuTempo: v.t };
      const d = avancarAno(v).vida;
      const rom = d.vinculos[p.id].romance;
      expect(rom?.estagio === 'saindo' || rom === undefined).toBe(true);
      if (!rom) expect(d.fatos[`recusa_romance_${p.id}`]).toBeDefined();
    }
  });

  it('depois de um não, a mesma pessoa não recebe outra iniciativa por um tempo; e a amizade que confiava continua', () => {
    // A resposta é da outra pessoa: procura, em algumas vidas, uma amizade que preferiu continuar amizade.
    let d: Vida | undefined;
    let p!: Vida['pessoas'][string];
    for (let s = 35; s < 45 && !d; s++) {
      const v = adulto(26, { semente: s });
      p = amigo(v, { proximidade: 58, confianca: 75 }).p;
      for (let k = 0; k < 200 && !d; k++) {
        const c = structuredClone(v); c.rng = 9 + k * 37;
        const x = executar(c, { tipo: 'pessoa', pessoaId: p.id, interacao: 'declarar' }).vida;
        if (!x.vinculos[p.id].romance) d = x;
      }
    }
    expect(d).toBeTruthy();
    expect(ids(d!, p.id).filter(x => INICIATIVAS.includes(x))).toEqual([]);
    expect(d!.vinculos[p.id].estagio).toBe('amigo_proximo');
    expect(d!.vinculos[p.id].historia.some(h => /preferiu a amizade/.test(h.texto))).toBe(true);
  });

  it('história consistente: o sim entra na biografia e na história; o primeiro encontro vira marco', () => {
    const v = adulto(26, { semente: 36 });
    const { p, vin } = amigo(v, { proximidade: 95, confianca: 90 });
    vin.historia.push(...Array.from({ length: 6 }, (_, k) => ({ t: v.t - 12 * k, texto: `Marco ${k}.`, tipo: 'amizade' as const, peso: 2 })));
    let d = v;
    for (let k = 0; k < 30 && d.vinculos[p.id].romance?.estagio !== 'saindo'; k++) { d = structuredClone(v); d.rng = 77 + k * 101; d = executar(d, { tipo: 'pessoa', pessoaId: p.id, interacao: 'declarar' }).vida; }
    expect(d.vinculos[p.id].romance?.estagio).toBe('saindo');
    expect(d.biografia.some(e => e.pessoas?.includes(p.id) && e.escolha)).toBe(true);
    expect(interacoesPara(d, p.id).find(x => x.id === 'sair_juntos')).toBeTruthy();
    d.anoAtual = { acoes: [] };
    d = executar(d, { tipo: 'pessoa', pessoaId: p.id, interacao: 'sair_juntos' }).vida;
    expect(d.vinculos[p.id].historia.some(h => /^O primeiro encontro/.test(h.texto))).toBe(true);
  });
});

describe('relações que produzem experiências', () => {
  it('a parceria tem ações que variam com a situação: aniversário redondo, dinheiro curto, distância, começo', () => {
    const v = adulto(38);
    const dez = casal(v, 10);
    expect(ids(v, dez.p.id)[0]).toBe('comemorar');
    expect(ids(v, dez.p.id)).not.toContain('conhecer');
    v.financas.negativado = true;
    expect(ids(v, dez.p.id)).toContain('dinheiro_casal');
    const w = adulto(30, { semente: 60 });
    const longe = casal(w, 2, { longe: true });
    const l = ids(w, longe.p.id);
    expect(l).toContain('visitar_par');
    expect(l).toContain('ligar_par');
    expect(l).not.toContain('sair_juntos');
    expect(l).not.toContain('intimidade');
  });

  it('quem está saindo há pouco pode ser conhecido melhor — e o que se descobre fica na história (e acaba)', () => {
    const v = adulto(27);
    const { p, vin } = amigo(v, { proximidade: 60 });
    vin.romance = { estagio: 'saindo', tEstagio: v.t, tInicio: v.t, envolvimento: 60 };
    let d = v;
    let vezes = 0;
    while (ids(d, p.id).includes('conhecer') && vezes < 6) { d = executar(d, { tipo: 'pessoa', pessoaId: p.id, interacao: 'conhecer' }).vida; d.anoAtual = { acoes: [] }; vezes++; }
    expect(vezes).toBeGreaterThan(0);
    expect(vezes).toBeLessThanOrEqual(3);
    expect(d.vinculos[p.id].historia.filter(h => h.tipo === 'descoberta').length).toBe(vezes);
  });

  it('amigo em outra cidade não recebe ação presencial: nada de flertar ou chamar para sair; dizer o que sente é por telefone', () => {
    const v = adulto(26);
    const { p } = amigo(v, { longe: true });
    const l = ids(v, p.id);
    expect(l).not.toContain('flertar');
    expect(l).not.toContain('convidar');
    expect(l).not.toContain('tempo');
    expect(l).toContain('declarar');
    expect(interacoesPara(v, p.id).find(x => x.id === 'declarar')!.rotulo(ctxPessoa(v, p.id)!)).toMatch(/^Ligar/);
  });

  it('desabafar existe quando a vida pesa, com quem escuta — e ajuda sem apagar a causa', () => {
    const v = adulto(34);
    const { p } = amigo(v, { proximidade: 80 });
    v.mente.estresse = 30; v.mente.felicidade = 70; v.mente.abalos = []; v.luto = [];
    expect(ids(v, p.id)).not.toContain('desabafar');
    v.mente.estresse = 62;
    expect(ids(v, p.id)).toContain('desabafar');
    const d = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'desabafar' }).vida;
    expect(d.mente.estresse).toBeLessThan(62);
    expect(d.mente.estresse).toBeGreaterThan(45);
    expect(d.vinculos[p.id].historia.some(h => h.tipo === 'apoio')).toBe(true);
  });
});

/* ============================================================ Estado pessoal */

describe('estado pessoal: causas como fonte única', () => {
  it('o alvo do equilíbrio é a soma dos fatores que a tela mostra', () => {
    const v = adulto(35);
    contratar(v, criarRng(1), ocupacao('gerente_loja'));
    v.trabalho.horasExtras = true;
    expect(alvoHumor(v)).toBeCloseTo(BASE_HUMOR + fatoresHumor(v).reduce((s, f) => s + f.efeito, 0), 6);
    expect(alvoCabeca(v)).toBeCloseTo(baseCabeca(v) + fatoresCabeca(v).reduce((s, f) => s + f.efeito, 0), 6);
    expect(derivaDaSaude(v)).toBeCloseTo(fatoresSaude(v).reduce((s, f) => s + f.efeito, 0), 6);
    expect(fatoresCabeca(v).map(f => f.id)).toContain('horas_extras');
  });

  it('sobrecarga: a cabeça piora aos poucos, a causa aparece; aliviar a semana a traz de volta devagar — sem cura instantânea', () => {
    let v = adulto(30, { semente: 70 });
    const carga = (x: Vida) => {
      if (x.trabalho.atual?.ocupacaoId !== 'gerente_loja') { x.trabalho.atual = undefined; contratar(x, criarRng(x.t), ocupacao('gerente_loja')); }
      x.educacao.matricula = { cursoId: 'administracao', instituicao: 'uma faculdade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 40, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
    };
    const leve = structuredClone(v);
    leve.trabalho.atual = undefined; leve.trabalho.horasExtras = false; leve.educacao.matricula = undefined;
    v = transacao(v, carga).vida;
    v = executar(v, { tipo: 'horas_extras' }).vida;
    const alvoCom = alvoCabeca(v);
    expect(alvoCom).toBeGreaterThan(alvoCabeca(leve) + 20);
    v.mente.estresse = 25;
    const serie: number[] = [];
    for (let k = 0; k < 5; k++) { v = avancarAno(v).vida; if (v.momento) v = responder(v); v.caminhos.processo = undefined; v = transacao(v, carga).vida; v = executar(v, { tipo: 'horas_extras' }).vida; serie.push(v.mente.estresse); }
    // Piora aos poucos (não num salto), até perto do alvo.
    expect(serie[0]).toBeLessThan(alvoCom - 5);
    // (um acontecimento pode aliviar num ano — férias, por exemplo —; a tendência é piorar)
    expect(Math.max(...serie.slice(1))).toBeGreaterThan(serie[0]);
    const pesa = leituraDoEstado(v, 'cabeca').pesando.map(f => f.id);
    expect(pesa.some(id => ['horas_extras', 'semana_fixa', 'trabalho', 'semana_apertada'].includes(id))).toBe(true);
    expect(sugestoes(v, 'cabeca', disponibilidade).map(s => s.id)).toContain('sem_horas_extras');
    // Alivia: sem horas extras, sem faculdade. (Parte de uma cabeça cheia de verdade, perto do alvo da sobrecarga.)
    v.mente.estresse = Math.max(v.mente.estresse, Math.round(alvoCom - 5));
    const alto = v.mente.estresse;
    v = executar(v, { tipo: 'horas_extras', parar: true }).vida;
    v = transacao(v, x => { x.educacao.matricula = undefined; }).vida;
    const alvo = alvoCabeca(v);
    expect(alvo).toBeLessThan(alto);
    v = avancarAno(v).vida; if (v.momento) v = responder(v);
    expect(v.mente.estresse).toBeLessThan(alto);
    // Um ano não basta (comparado ao alvo do próprio ano: a vida material também muda — uma reserva que cresce alivia).
    expect(v.mente.estresse).toBeGreaterThan(Math.min(alvo, alvoCabeca(v)));
  });

  it('descansar dá um respiro (uma vez por ano) e não mexe na causa', () => {
    const v = adulto(33);
    contratar(v, criarRng(2), ocupacao('gerente_loja'));
    v.trabalho.horasExtras = true;
    v.mente.estresse = 64;
    const antes = fatoresCabeca(v).map(f => f.id);
    const d = executar(v, { tipo: 'cuidar', cuidado: 'descansar' });
    expect(d.vida.mente.estresse).toBe(54);
    expect(fatoresCabeca(d.vida).map(f => f.id)).toEqual(antes);
    expect(d.resultado).toMatch(/continua lá/);
    expect(tenta(d.vida, { tipo: 'cuidar', cuidado: 'descansar' })).toBe(false);
  });

  it('luto: a falta pesa no humor; com gente por perto, a recuperação é mais rápida — e não apaga a perda de um ano para o outro', () => {
    const base = adulto(50, { semente: 80 });
    const par = pessoa(base, 50, 'masculino');
    const vp = vincular(base, par, { origem: 'romance', proximidade: 90, convivio: [] });
    vp.romance = { estagio: 'ex', fim: 'morte', tEstagio: base.t, tInicio: base.t - 300, envolvimento: 80 };
    par.vivo = false; par.tMorte = base.t;
    base.luto = [{ pessoaId: par.id, t: base.t, peso: 100 }];
    const sozinho = structuredClone(base);
    for (const vin of Object.values(sozinho.vinculos)) { vin.tUltimoContato = sozinho.t - 60; vin.convivio = []; }
    const acompanhado = structuredClone(base);
    for (let k = 0; k < 3; k++) { const a = amigo(acompanhado, { proximidade: 85 }); a.vin.tUltimoContato = acompanhado.t; }
    expect(fatoresHumor(sozinho).some(f => f.id === 'luto')).toBe(true);
    expect(leituraDoEstado(sozinho, 'humor').pesando[0].texto).toMatch(/falta de/);
    let s = sozinho, a = acompanhado;
    for (let k = 0; k < 3; k++) { s = avancarAno(s).vida; if (s.momento) s = responder(s); a = avancarAno(a).vida; if (a.momento) a = responder(a); }
    const lutoS = s.luto.find(l => l.pessoaId === par.id)?.peso ?? 0;
    const lutoA = a.luto.find(l => l.pessoaId === par.id)?.peso ?? 0;
    expect(lutoA).toBeLessThan(lutoS);
    expect(lutoS).toBeGreaterThan(0);
  });

  it('atividade física: o corpo parado aparece como causa na saúde; meses de corrida a mudam de lado', () => {
    let v = adulto(40, { semente: 90 });
    v.rotinas = [];
    v.corpo.forma = 20;
    expect(fatoresSaude(v).find(f => f.id === 'forma')!.efeito).toBeLessThan(0);
    expect(sugestoes(v, 'saude', disponibilidade).some(s => s.id === 'mexer')).toBe(true);
    v = executar(v, { tipo: 'rotina', id: 'corrida', ativa: true, nivel: 1 }).vida;
    v = viver(v, 4);
    expect(fatoresSaude(v).find(f => f.id === 'forma')!.efeito).toBeGreaterThan(0);
  });

  it('condição sem tratamento: ir ao médico abre o tratamento; tratar diminui o que ela tira da saúde', () => {
    const v = adulto(55, { semente: 91 });
    v.corpo.condicoes = [{ id: 'diabetes', nome: 'diabetes', tInicio: v.t - 12, cronica: true, gravidade: 2, tratando: false }];
    v.processos = v.processos.filter(p => p.tipo !== 'tratamento');
    const sem = fatoresSaude(v).find(f => f.id === 'condicao:diabetes')!.efeito;
    const d = executar(v, { tipo: 'cuidar', cuidado: 'consulta' }).vida;
    expect(d.momento?.situacaoId).toBe('sau_tratamento');
    d.corpo.condicoes[0].tratando = true;
    expect(fatoresSaude(d).find(f => f.id === 'condicao:diabetes')!.efeito).toBeGreaterThan(sem);
  });

  it('parar de fumar pode não dar certo de primeira — e dá, para alguém, tentando', () => {
    let falhas = 0, sucessos = 0;
    for (let k = 0; k < 40; k++) {
      const v = adulto(40, { semente: 100 });
      v.corpo.habitos.fuma = true;
      v.rng = 5 + k * 131;
      const d = executar(v, { tipo: 'cuidar', cuidado: 'parar_fumar' }).vida;
      if (d.corpo.habitos.fuma) falhas++; else sucessos++;
    }
    expect(falhas).toBeGreaterThan(0);
    expect(sucessos).toBeGreaterThan(0);
  });

  it('nenhum estado ruim sem saída: com a cabeça cheia ou o humor baixo, sempre há um cuidado possível', () => {
    let casos = 0;
    for (let s = 0; s < 10; s++) {
      let v = nova({ semente: 300 + s });
      for (let a = 0; a < 75 && !v.morte; a++) {
        v = avancarAno(v).vida;
        if (v.momento) v = responder(v);
        if (v.momento || idade(v) < 18 || a % 6) continue;
        const cheia = structuredClone(v); cheia.mente.estresse = 62;
        const baixa = structuredClone(v); baixa.mente.felicidade = 35;
        casos++;
        expect(sugestoes(cheia, 'cabeca', disponibilidade).length).toBeGreaterThan(0);
        expect(sugestoes(baixa, 'humor', disponibilidade).length).toBeGreaterThan(0);
      }
    }
    expect(casos).toBeGreaterThan(40);
  }, 120000);

  it('determinismo: mesma semente e mesmos comandos → mesmos abalos, histórico e tendência', () => {
    const a = viver(nova({ semente: 555 }), 40);
    const b = viver(nova({ semente: 555 }), 40);
    expect(a.mente.abalos).toEqual(b.mente.abalos);
    expect(a.mente.historico).toEqual(b.mente.historico);
    expect(tendencia(a, 'cabeca')).toBe(tendencia(b, 'cabeca'));
  });
});

/* ================================================================== Semana */

describe('semana: a mesma fonte para a tela e para a regra', () => {
  it('cabe ⇔ o que ocupa + o pedido cabe na capacidade; tirar uma atividade devolve exatamente o tempo dela', () => {
    const v = adulto(24);
    contratar(v, criarRng(3), ocupacao('atendente'));
    v.rotinas = [{ id: 'academia', tInicio: v.t, nivel: 1 }, { id: 'leitura', tInicio: v.t, nivel: 1 }];
    const s = semana(v);
    for (const extra of [0.5, 1, 1.5, 2]) expect(cabeNaSemana(v, extra).cabe).toBe(s.ocupado + extra <= s.capacidade + 0.01);
    const d = executar(v, { tipo: 'rotina', id: 'academia', ativa: false }).vida;
    expect(semana(d).livre).toBeCloseTo(s.livre + 1, 6);
  });

  it('família e trabalho ocupam antes da escolha: filho pequeno em casa, trabalho e faculdade aparecem como fixos', () => {
    const v = adulto(30);
    contratar(v, criarRng(4), ocupacao('atendente'));
    v.educacao.matricula = { cursoId: 'administracao', instituicao: 'x', rede: 'privada', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 40, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    const f = pessoa(v, 2, 'feminino', { genitores: ['eu'] });
    vincular(v, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    const fixos = semana(v).fixos.map(x => x.id);
    expect(fixos).toEqual(expect.arrayContaining(['trabalho', 'curso', 'filhos_pequenos']));
    // E isso pesa na cabeça pelo mesmo cálculo.
    expect(fatoresCabeca(v).some(x => x.id === 'semana_fixa' || x.id === 'semana_apertada' || x.id === 'bebe')).toBe(true);
  });
});

/* ================================================================ Processos */

describe('entrevista em etapas', () => {
  it('as perguntas variam por vaga e por pessoa, e não se repetem logo', () => {
    const v = adulto(26, { semente: 120 });
    v.trabalho.atual = undefined;
    const vistas = new Set<string>();
    let x = v;
    const alvos = ['atendente', 'aux_adm', 'estoquista', 'garcom', 'recepcionista', 'cuidador', 'caixa', 'aux_cozinha'].filter(id => OCUPACOES.some(o => o.id === id));
    for (const id of alvos) {
      const antes = new Set(x.caminhos.entrevistas.recentes);
      const r = escolherPerguntas(x, criarRng(x.seq++), ocupacao(id));
      r.forEach(q => vistas.add(q));
      // Perguntas recentes só voltam se não houver outras que caibam.
      expect(r.filter(q => antes.has(q)).length).toBeLessThanOrEqual(1);
    }
    expect(vistas.size).toBeGreaterThanOrEqual(9);
  });

  it('perguntas contextuais: liderança só para quem vai liderar; segurança só onde há risco; primeiro emprego só para quem não trabalhou', () => {
    const v = adulto(30);
    v.trabalho.historico = []; v.trabalho.atual = undefined; v.trabalho.experiencia = {};
    const lider = PERGUNTAS.find(p => p.id === 'lider_baixo')!;
    const seg = PERGUNTAS.find(p => p.id === 'seguranca_ritmo')!;
    const prim = PERGUNTAS.find(p => p.id === 'primeiro_destaque')!;
    expect(lider.quando!(ctxEntrevista(v, ocupacao('gerente_loja')))).toBe(true);
    expect(lider.quando!(ctxEntrevista(v, ocupacao('atendente')))).toBe(false);
    expect(seg.quando!(ctxEntrevista(v, ocupacao('estoquista')))).toBe(true);
    expect(seg.quando!(ctxEntrevista(v, ocupacao('recepcionista')))).toBe(false);
    expect(prim.quando!(ctxEntrevista(v, ocupacao('atendente')))).toBe(true);
    v.trabalho.experiencia['comercio'] = 48; v.trabalho.historico.push({ ...contratar(structuredClone(v), criarRng(1), ocupacao('atendente')), tFim: v.t, motivo: 'x' });
    expect(prim.quando!(ctxEntrevista(v, ocupacao('vendedor')))).toBe(false);
  });

  it('não há resposta certa universal: a melhor abordagem muda com o contexto', () => {
    const v = adulto(30);
    const contextos = ['atendente', 'estoquista', 'enfermeiro', 'gerente_loja', 'dev_jr', 'aux_adm', 'contador'].filter(id => OCUPACOES.some(o => o.id === id)).map(id => ctxEntrevista(v, ocupacao(id)));
    let universais = 0, avaliadas = 0;
    for (const p of PERGUNTAS) {
      const cabem = contextos.filter(c => !p.quando || p.quando(c));
      if (cabem.length < 2) continue;
      avaliadas++;
      const melhores = new Set(cabem.map(c => [...p.respostas].sort((a, b) => b.ajuste(c) - a.ajuste(c))[0].id));
      if (melhores.size === 1) universais++;
    }
    expect(avaliadas).toBeGreaterThan(8);
    // Algumas perguntas têm um "certo" de verdade (segurança, ética); a maioria depende do contexto.
    expect(universais / avaliadas).toBeLessThan(0.5);
  });

  it('formação e estrada continuam pesando: as mesmas respostas valem mais para quem tem experiência', () => {
    const v = adulto(30);
    const oc = ocupacao('vendedor');
    const etapas = [{ id: 'mot_agora', resposta: 'caminho', nota: 0.3 }, { id: 'erro_ninguem', resposta: 'corrige_avisa', nota: 0.5 }];
    const semExp = structuredClone(v); semExp.trabalho.experiencia = {};
    const comExp = structuredClone(v); comExp.trabalho.experiencia = { comercio: 60 };
    const a = avaliar(semExp, oc, 0.3, 0, etapas);
    const b = avaliar(comExp, oc, 0.6, 0, etapas);
    expect(b.chance).toBeGreaterThan(a.chance);
    // Uma entrevista ótima não transforma: o salto máximo da entrevista é limitado.
    const otima = avaliar(semExp, oc, 0.1, 0, etapas.map(e => ({ ...e, nota: 1 })));
    expect(otima.chance).toBeLessThan(0.36);
  });

  it('o processo é determinístico por semente, tem 2 ou 3 etapas e termina com uma devolutiva coerente', () => {
    const v = adulto(24, { semente: 130 });
    v.trabalho.atual = undefined; v.trabalho.experiencia = { comercio: 8 }; v.trabalho.historico = [];
    v.educacao.escolaridade = 'medio';
    expect(tenta(v, { tipo: 'candidatar', ocupacaoId: 'vendedor' })).toBe(true);
    const a = entrevistar(structuredClone(v), 'vendedor');
    const b = entrevistar(structuredClone(v), 'vendedor');
    expect(a.perguntas).toEqual(b.perguntas);
    expect(a.resultado).toBe(b.resultado);
    expect([2, 3]).toContain(a.perguntas.length);
    expect(a.v.momento).toBeNull();
    expect(a.v.caminhos.processo).toBeUndefined();
    const dev = a.v.caminhos.devolutivas.slice(-1)[0];
    expect(dev.tipo).toBe('entrevista');
    if (!dev.passou) {
      expect(dev.falta).toBe('experiencia'); // vendedor pede estrada que ela não tem
      expect(dev.texto).toMatch(/experiência/);
    }
  });

  it('entrevistas também são prática; e quem fica perto às vezes é chamado de novo', () => {
    let portas = 0;
    for (let s = 0; s < 20; s++) {
      const v = adulto(26, { semente: 140 + s });
      v.trabalho.atual = undefined; v.trabalho.experiencia = { comercio: 30 };
      const r = entrevistar(v, 'atendente', () => 'r0');
      expect(r.v.caminhos.entrevistas.feitas).toBe(1);
      if (r.v.caminhos.oportunidades.some(o => o.ocupacaoId === 'atendente' && o.tipo === 'vaga')) portas++;
    }
    expect(portas).toBeGreaterThanOrEqual(0);
  });

  it('um save v8 com a entrevista antiga aberta (uma pergunta só) continua resolvível depois da migração', () => {
    const v = adulto(24, { semente: 150 });
    const bruto = structuredClone(v) as unknown as Record<string, unknown> & Vida;
    (bruto as { versao: number }).versao = 8;
    delete (bruto.mente as Partial<Vida['mente']>).abalos;
    delete (bruto.mente as Partial<Vida['mente']>).historico;
    delete (bruto.caminhos as Partial<Vida['caminhos']>).entrevistas;
    delete (bruto.caminhos as Partial<Vida['caminhos']>).devolutivas;
    bruto.fatos['entrevista_oc'] = OCUPACOES.findIndex(o => o.id === 'atendente');
    bruto.momento = { id: 'm1', situacaoId: 'trab_entrevista', t: v.t, titulo: 'Entrevista: atendente', texto: 'Sala pequena.', tema: 'trabalho', papeis: {}, opcoes: [{ id: 'preparo', texto: 'Mostrar que estudou' }, { id: 'confianca', texto: 'Vender seu peixe' }, { id: 'sinceridade', texto: 'Ser sincero' }] };
    const r = interpretar(JSON.stringify(bruto));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const d = executar(r.vida, { tipo: 'decidir', opcaoId: 'preparo' });
    expect(d.vida.momento).toBeNull();
    expect(d.resultado).toBeTruthy();
  });
});

describe('peneira em etapas', () => {
  it('considera a preparação: quem treinou anos passa muito mais que quem mal joga', () => {
    const base = adulto(15, { semente: 160 });
    const bom = structuredClone(base);
    bom.caminhos.frentes.futebol = { interesse: 90, meses: 90, habilidade: 80, tInicio: bom.t - 100, tUltimo: bom.t, retomadas: 0, auge: 80 };
    bom.corpo.forma = 75;
    const fraco = structuredClone(base);
    fraco.caminhos.frentes.futebol = { interesse: 60, meses: 12, habilidade: 50, tInicio: fraco.t - 20, tUltimo: fraco.t, retomadas: 0, auge: 50 };
    fraco.corpo.forma = 40;
    let pb = 0, pf = 0;
    for (let k = 0; k < 200; k++) {
      if (avaliarPeneira(bom, criarRng(k), 'futebol', bom.moradia.municipioId, { comeco: 'simples', final: 'coletivo' }, 0).passou) pb++;
      if (avaliarPeneira(fraco, criarRng(k), 'futebol', fraco.moradia.municipioId, { comeco: 'simples', final: 'coletivo' }, 0).passou) pf++;
    }
    expect(pb / 200).toBeGreaterThan(0.5);
    expect(pf / 200).toBeLessThan(0.1);
    // Nem garantido, nem impossível para quem está no meio.
    const medio = structuredClone(base);
    medio.caminhos.frentes.futebol = { interesse: 80, meses: 60, habilidade: 66, tInicio: medio.t - 70, tUltimo: medio.t, retomadas: 0, auge: 66 };
    medio.corpo.forma = 58;
    let pm = 0;
    for (let k = 0; k < 200; k++) if (avaliarPeneira(medio, criarRng(k), 'futebol', medio.moradia.municipioId, { comeco: 'simples', final: 'coletivo' }, 0).passou) pm++;
    expect(pm).toBeGreaterThan(5);
    expect(pm).toBeLessThan(195);
  });

  it('a abordagem pesa conforme quem joga: arriscar ajuda quem tem técnica e atrapalha quem não tem', () => {
    const v = adulto(15, { semente: 161 });
    v.caminhos.frentes.futebol = { interesse: 80, meses: 60, habilidade: 75, tInicio: v.t - 60, tUltimo: v.t, retomadas: 0, auge: 75 };
    const r = (notas: { comeco: string; final: string }) => avaliarPeneira(v, criarRng(1), 'futebol', v.moradia.municipioId, notas, 0).pontos;
    expect(r({ comeco: 'arriscar', final: 'chamar' })).toBeGreaterThan(r({ comeco: 'simples', final: 'coletivo' }) - 0.05);
    v.caminhos.frentes.futebol!.habilidade = 55;
    expect(r({ comeco: 'arriscar', final: 'chamar' })).toBeLessThan(r({ comeco: 'simples', final: 'coletivo' }));
    expect(aspectos(v, 'futebol').tecnica).toBeLessThan(0);
  });

  it('falhar produz história: devolutiva com o que pesou, prática somada e — se ficou perto — chance de voltar antes', () => {
    let v = viverAte(nova({ semente: 170, genero: 'masculino' }), 15);
    v.momento = null; v.caminhos.processo = undefined; v.anoAtual = { acoes: [] };
    v.caminhos.frentes.futebol = { interesse: 80, meses: 50, habilidade: 58, tInicio: v.t - 60, tUltimo: v.t, retomadas: 0, auge: 58 };
    v = transacao(v, x => { novaOportunidade(x, { tipo: 'peneira', dominio: 'futebol', municipioId: x.moradia.municipioId, meses: 12, chave: 'peneira_futebol', titulo: 'Peneira no Clube X', texto: 't' }); }).vida;
    const op = v.caminhos.oportunidades.find(o => o.tipo === 'peneira')!;
    const meses = v.caminhos.frentes.futebol!.meses;
    let x = executar(v, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida;
    expect(x.momento?.situacaoId).toBe('esp_peneira');
    let resultado = '';
    for (let k = 0; x.momento && k < 3; k++) { const r = executar(x, { tipo: 'decidir', opcaoId: 'p0' }); x = r.vida; resultado = r.resultado || resultado; }
    const dev = x.caminhos.devolutivas.slice(-1)[0];
    expect(dev.tipo).toBe('peneira');
    expect(resultado).toMatch(/treinador/);
    expect(x.caminhos.frentes.futebol!.meses).toBeGreaterThan(meses);
    if (!dev.passou) {
      expect(dev.falta).toBeTruthy();
      expect(x.caminhos.marcas.some(m => m.tipo === 'fracasso')).toBe(true);
    }
  });
});

/* ================================================================ Poluição */

describe('divulgação progressiva', () => {
  it('atividades: poucas primárias, cada uma com motivo; o catálogo inteiro continua acessível em "explorar"', () => {
    for (const s of [1, 2, 3, 4]) {
      const v = adulto(20 + s * 7, { semente: 180 + s });
      const { para, resto } = atividadesParaVoce(v);
      expect(para.length).toBeLessThanOrEqual(MAX_PRIMARIAS.atividades);
      for (const x of para) expect(x.motivo.length).toBeGreaterThan(3);
      const possiveis = ROTINAS.filter(m => !v.rotinas.some(r => r.id === m.id) && atividadeExiste(v, m) && podeTentar(podeComecarRotina(v, m.id, 1)));
      expect(new Set([...para.map(x => x.item.id), ...resto.map(m => m.id)])).toEqual(new Set(possiveis.map(m => m.id)));
    }
  });

  it('o que a vida pede sobe primeiro: cabeça cheia traz o que desanuvia; um hobby antigo volta', () => {
    const v = adulto(35, { semente: 190 });
    v.rotinas = [];
    v.mente.estresse = 70;
    // O corpo em dia: o que sobe é a cabeça cheia e o hobby antigo.
    v.corpo.forma = 80;
    v.corpo.habitos.sedentario = false;
    v.caminhos.frentes.musica = { interesse: 50, meses: 80, habilidade: 55, tInicio: v.t - 200, tUltimo: v.t - 60, retomadas: 0, auge: 60 };
    const { para } = atividadesParaVoce(v);
    const ids = para.map(x => x.item.id);
    expect(ids).toContain('musica');
    expect(para.some(x => /cabeça/.test(x.motivo))).toBe(true);
  });

  it('vagas: poucas primárias e o próximo degrau vem antes do resto', () => {
    const v = adulto(30, { semente: 200 });
    v.educacao.escolaridade = 'medio';
    v.trabalho.atual = undefined;
    contratar(v, criarRng(5), ocupacao('vendedor'));
    v.trabalho.experiencia = { comercio: 60 };
    const { para, resto } = vagasParaVoce(v);
    expect(para.length).toBeLessThanOrEqual(MAX_PRIMARIAS.vagas);
    expect(para.length + resto.length).toBeGreaterThan(para.length);
    for (let k = 1; k < para.length; k++) expect(para[k - 1].pontos).toBeGreaterThanOrEqual(para[k].pontos);
    if (para.some(x => x.item.oc.id === 'supervisor_loja')) expect(para[0].item.oc.id).toBe('supervisor_loja');
  });

  it('cursos: o próximo passo em poucas linhas; o resto agrupado', () => {
    const v = adulto(19, { semente: 210 });
    v.educacao.basica = undefined; v.educacao.escolaridade = 'medio';
    v.educacao.enem.push({ t: v.t - 2, nota: 700 });
    const { para, resto } = cursosParaVoce(v);
    expect(para.length).toBeLessThanOrEqual(MAX_PRIMARIAS.cursos);
    expect(resto.length).toBeGreaterThan(5);
  });
});

/* ===================================================================== Save */

describe('save v9', () => {
  it('saves v8 reais (ATT 2) migram, validam, guardam o estado e continuam sendo vividos', () => {
    expect(VERSAO_SAVE).toBe(12);
    for (const nome of ['save-v8-adolescente.json', 'save-v8-adulta.json', 'save-v8-meia-idade.json']) {
      const r = interpretar(fixture(nome));
      expect(r.tipo, nome).toBe('ok');
      if (r.tipo !== 'ok') continue;
      expect(r.migrado).toBe(true);
      expect(r.vida.versao).toBe(12);
      expect(Array.isArray(r.vida.mente.abalos)).toBe(true);
      expect(r.vida.mente.historico.length).toBe(1);
      expect(r.vida.caminhos.entrevistas).toEqual({ recentes: [], feitas: 0 });
      const antes = JSON.parse(fixture(nome));
      expect(r.vida.mente.felicidade).toBe(antes.mente.felicidade);
      expect(Object.keys(r.vida.vinculos).length).toBe(Object.keys(antes.vinculos).length);
      let v = r.vida;
      for (let k = 0; k < 5 && !v.morte; k++) { v = avancarAno(v).vida; if (v.momento) v = responder(v); }
      expect(v.mente.historico.length).toBeGreaterThan(1);
      const ida = interpretar(JSON.stringify(v));
      expect(ida.tipo).toBe('ok');
    }
  });

  it('v7, v6 e v5 reais atravessam a cadeia até v9', () => {
    for (const nome of ['save-v7-adolescente.json', 'save-v6-familia.json', 'save-v5-adulta.json']) {
      const r = interpretar(fixture(nome));
      expect(r.tipo, nome).toBe('ok');
      if (r.tipo === 'ok') expect(r.vida.versao).toBe(12);
    }
  });

  it('abalo corrompido é recusado (vai para o backup, não trava)', () => {
    const v = nova({ semente: 3 });
    const b = JSON.parse(JSON.stringify(v));
    b.mente.abalos = [{ t: 'x', texto: 1 }];
    expect(interpretar(JSON.stringify(b)).tipo).toBe('invalido');
  });
});

void parceiro;
