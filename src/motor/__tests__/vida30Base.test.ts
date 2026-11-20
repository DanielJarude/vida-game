/**
 * VIDA 30 · §7 — o mercado da base: a remuneração em partes (bolsa, ajuda de custo, benefícios, vínculo) e as
 * transferências entre clubes (convite, avaliação, registro, histórico), até a porta do profissional.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { nova, viverAte } from './ajuda';
import { executar } from '../acoes';
import { criarRng } from '../rng';
import { entrarNaBase, bolsaDaBase } from '../sistemas/esporte';
import { aceitarBase30, base30, mercadoDaBase30, pagarAnoDeBase30, remuneracaoDaBase30, transferirNaBase30 } from '../sistemas/base30';
import { avancarAno } from '../ano';
import { interpretar } from '../save';
import type { AnoDeFormacao, CarreiraEsportiva, Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

function jovem(i: number, semente = 3001, municipioId = 'campinas-sp'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero: 'masculino', municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero: 'masculino', municipioId }), i);
  v.momento = null; v.caminhos.processo = undefined; v.anoAtual = { acoes: [] };
  v.caminhos.oportunidades = [];
  return v;
}
function naBase(v: Vida, clube: string, municipioId = v.moradia.municipioId): CarreiraEsportiva {
  entrarNaBase(v, 'futebol', municipioId, clube);
  const e = v.caminhos.esporte!;
  e.tInicio = e.tFase = v.t - 24;
  return e;
}
const anoBom = (v: Vida, e: CarreiraEsportiva, nota = 8.4): AnoDeFormacao => ({ ano: 2020, idade: Math.floor((v.t - v.eu.tNasc) / 12), categoria: 'sub-17', clube: e.clube, competicao: 'campeonato estadual sub-17', jogos: 22, titular: 21, nota, tecnica: 74, colocacao: 1, participantes: 16, titulo: true, avaliacao: '' });

/** Gira o mercado (só ele) até uma proposta do tipo pedido. */
function ateProposta(v: Vida, e: CarreiraEsportiva, via?: 'convite' | 'avaliacao') {
  for (let k = 0; k < 400; k++) {
    v.caminhos.oportunidades = [];
    e.base30 = { transferencias: [], propostas: [] };
    const op = mercadoDaBase30(v, e);
    const p = op && e.base30.propostas[0];
    if (p && (!via || p.via === via)) return { op, p };
    v.t += 1;
  }
  return undefined;
}

describe('VIDA 30 · §7 a remuneração da base em partes', () => {
  it('antes dos 14: sem bolsa nem vínculo (a lei não permite) — o clube forma, a família sustenta', () => {
    const v = jovem(12);
    const e = naBase(v, 'Guarani');
    const r = remuneracaoDaBase30(v, e);
    expect(r.bolsa).toBe(0);
    expect(r.ajuda).toBe(0);
    expect(r.vinculo).toBe('nenhum');
    expect(r.porque).toMatch(/14/);
  });

  it('aos 15, a bolsa é a mesma conta da VIDA 28 (nada muda para quem já recebia) — e é dita como apoio, não salário', () => {
    const v = jovem(15);
    const e = naBase(v, 'Guarani');
    const r = remuneracaoDaBase30(v, e);
    expect(r.bolsa).toBe(bolsaDaBase(v, e));
    expect(r.vinculo).toBe('bolsa');
    expect(r.porque).toMatch(/Não é salário/);
  });

  it('aos 16, bom jogador num clube estruturado: contrato de formação (bolsa maior, ainda abaixo de um salário de profissional)', () => {
    const v = jovem(16, 3011, 'sao-paulo-sp');
    const e = naBase(v, 'Palmeiras');
    e.formacao = [anoBom(v, e, 7.8)];
    const r = remuneracaoDaBase30(v, e);
    expect(r.vinculo).toBe('formacao');
    expect(r.bolsa).toBeGreaterThan(bolsaDaBase(v, e));
    expect(r.beneficios.length).toBeGreaterThan(2);
    const antes = v.financas.conta;
    const pago = pagarAnoDeBase30(v, e);
    expect(v.financas.conta - antes).toBe((pago.bolsa + pago.ajuda) * 12);
    expect(v.biografia.some(b => /contrato de formação/.test(b.texto))).toBe(true);
  });

  it('quem treina longe de casa recebe ajuda de custo e alojamento', () => {
    const v = jovem(15, 3021, 'campinas-sp');
    const e = naBase(v, 'Palmeiras', 'sao-paulo-sp');
    const r = remuneracaoDaBase30(v, e);
    expect(r.ajuda).toBeGreaterThan(0);
    expect(r.beneficios).toContain('alojamento no clube');
  });
});

describe('VIDA 30 · §7 transferências na base', () => {
  it('o convite diz o clube, a cidade, a categoria e a oferta; aceitar transfere clube, cidade e registro', () => {
    let v = jovem(15);
    const e = naBase(v, 'Guarani');
    e.formacao = [anoBom(v, e, 8.6)];
    const achou = ateProposta(v, e, 'convite');
    expect(achou).toBeTruthy();
    const { op, p } = achou!;
    expect(op.clube).toBe(p.para);
    expect(p.para).not.toBe('Guarani');
    expect(op.texto).toContain(p.categoria);
    v.caminhos.oportunidades = [op];
    v = executar(v, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida;
    const e2 = v.caminhos.esporte!;
    expect(e2.clube).toBe(p.para);
    expect(e2.municipioId).toBe(p.municipioId);
    expect(e2.fase).toBe('base');
    expect(e2.base30!.registro?.clube).toBe(p.para);
    expect(e2.base30!.transferencias[0]).toMatchObject({ de: 'Guarani', para: p.para, via: 'convite' });
    expect(v.biografia.some(b => b.texto.includes(p.para) && /registro/.test(b.texto))).toBe(true);
  });

  it('antes dos 14, só clube da própria cidade (ninguém sai de casa criança)', () => {
    const v = jovem(13, 3031, 'sao-paulo-sp');
    const e = naBase(v, 'Portuguesa');
    e.formacao = [anoBom(v, e, 8.8)];
    const t0 = v.t;
    let viu = 0;
    for (let s = 0; s < 40; s++) for (let k = 0; k < 11; k++) {
      v.t = t0 + k; v.caminhos.oportunidades = []; e.base30 = { transferencias: [], propostas: [] };
      v.id = `${v.id.split('#')[0]}#${s}`;
      if (mercadoDaBase30(v, e)) { viu++; expect(e.base30.propostas[0].municipioId).toBe(v.moradia.municipioId); }
    }
    expect(viu).toBeGreaterThan(0);
  });

  it('a avaliação pode reprovar — e quem reprova continua no clube de antes', () => {
    let reprovou = 0, passou = 0;
    for (let s = 0; s < 30; s++) {
      const v = jovem(15);
      const e = naBase(v, 'Guarani');
      e.formacao = [anoBom(v, e, 7.0)];
      const a = ateProposta(v, e, 'avaliacao');
      if (!a) continue;
      v.caminhos.oportunidades = [a.op];
      const res = aceitarBase30(v, criarRng(s), a.op.id);
      if (a.p.desfecho === 'reprovado') { reprovou++; expect(v.caminhos.esporte!.clube).toBe('Guarani'); expect(res.tom).toBe('neutro'); }
      else { passou++; expect(v.caminhos.esporte!.clube).toBe(a.p.para); }
    }
    expect(reprovou).toBeGreaterThan(0);
    expect(passou).toBeGreaterThan(0);
  });

  it('recusar fica dito e não muda o clube; a proposta de quem já saiu daquele clube não vale', () => {
    let v = jovem(15);
    const e = naBase(v, 'Guarani');
    e.formacao = [anoBom(v, e, 8.6)];
    const { op, p } = ateProposta(v, e)!;
    v.caminhos.oportunidades = [op];
    v = executar(v, { tipo: 'oportunidade', id: op.id, aceitar: false }).vida;
    expect(v.caminhos.esporte!.clube).toBe('Guarani');
    expect(v.caminhos.esporte!.base30!.propostas[0].desfecho).toBe('recusou');
    expect(v.biografia.some(b => /Recusou/.test(b.texto) && b.texto.includes(p.para))).toBe(true);
  });

  it('a trajetória: base → transferência → anos no clube novo (formação registrada lá) → a porta do profissional é do clube novo; o save guarda tudo', () => {
    let v = jovem(15, 3041);
    const e = naBase(v, 'Guarani');
    e.formacao = [anoBom(v, e, 8.6)];
    const { p } = ateProposta(v, e, 'convite')!;
    transferirNaBase30(v, e, p);
    v.caminhos.oportunidades = [];
    const f = v.caminhos.frentes.futebol;
    if (f) { f.habilidade = 84; f.interesse = 90; }
    let convite: string | undefined;
    for (let k = 0; k < 4 && v.caminhos.esporte?.fase === 'base' && !convite; k++) {
      v = avancarAno(v).vida;
      v.momento = null;
      const es = v.caminhos.esporte;
      if (es?.fase === 'base') {
        const ultimo = es.formacao![es.formacao!.length - 1];
        expect(ultimo.clube).toBe(es.clube);
      }
      const c = v.caminhos.oportunidades.find(o => o.titulo === 'Contrato profissional');
      if (c) convite = c.texto;
    }
    const es = v.caminhos.esporte!;
    if (convite) expect(convite).toContain(es.clube);
    // Salvo e reaberto: o registro, as trocas e as propostas voltam iguais.
    const volta = interpretar(JSON.stringify(v));
    expect(volta.tipo).toBe('ok');
    if (volta.tipo === 'ok') expect(volta.vida.caminhos.esporte?.base30 ?? volta.vida.caminhos.carreirasEsportivas?.find(c => c.base30)?.base30).toEqual(es.base30 ?? v.caminhos.carreirasEsportivas?.find(c => c.base30)?.base30);
  });

  it('save antigo (sem base30): o mercado começa vazio, nada quebra', () => {
    const v = jovem(15);
    const e = naBase(v, 'Guarani');
    delete e.base30;
    expect(base30(e)).toEqual({ transferencias: [], propostas: [] });
  });
});
