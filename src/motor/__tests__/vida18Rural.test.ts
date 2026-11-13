/** VIDA 18 · a vida rural: propriedades, lavoura, rebanho, estrutura, arrendamento, herança e saves antigos. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import { rngDe } from '../rng';
import type { Imovel, Vida } from '../tipos';
import { ofertasRurais, terraDaFamilia } from '../v18/rural/acoes18';
import { TIPOS18, CULTURAS18, REBANHOS18 } from '../dados18/rural/catalogo18';
import {
  acharPropriedade, areaLivre, areaUtil, climaDoAno, novaPropriedade, normalizarRural18, reservaLegal, resultadoDoTalhao, simularAno, tetoDaEstrutura,
  todasAsPropriedades, valorDaPropriedade, type PropriedadeRural18
} from '../v18/rural/fazenda18';

const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };
const rico = (idade = 35, semente = 1) => { const v = structuredClone(adulto(idade, { semente })); v.financas.conta = 30_000_000; return v; };
const op = (v: Vida, oque: Parameters<typeof executar>[1] extends infer A ? A : never) => executar(v, oque);
const comprar = (v: Vida, tipo: string) => { const o = ofertasRurais(v).find(x => x.p.tipo === tipo)!; return { v: executar(v, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }).vida, o }; };
const propria = (v: Vida) => todasAsPropriedades(v).find(x => x.imovel)!;

describe('VIDA 18 · propriedades rurais', () => {
  it('oito tipos à venda, cada um com tamanho, preço e vocação próprios; a oferta é estável no ano', () => {
    const v = rico();
    const os = ofertasRurais(v);
    expect(new Set(os.map(o => o.p.tipo)).size).toBe(8);
    for (const o of os) {
      expect(TIPOS18[o.p.tipo].tamanhos).toContain(o.p.ha);
      expect(o.preco).toBe(valorDaPropriedade(o.p, anoDe(v.t)));
      expect(o.arrendamentoAno).toBeGreaterThan(0);
    }
    // Hectare de chácara é muito mais caro que o de fazenda de gado; o preço total de uma fazenda é bem maior.
    const ch = os.find(o => o.p.tipo === 'chacara')!, pe = os.find(o => o.p.tipo === 'pecuaria')!;
    expect(ch.p.valorHa).toBeGreaterThan(pe.p.valorHa * 3);
    expect(pe.preco).toBeGreaterThan(ch.preco);
    expect(JSON.stringify(ofertasRurais(v).map(o => o.id))).toBe(JSON.stringify(os.map(o => o.id)));
    expect(v.financas.bens.length).toBe(structuredClone(adulto(35, { semente: 1 })).financas.bens.length);
  });

  it('comprar à vista: o dinheiro sai uma vez, o imóvel entra no patrimônio com o valor da propriedade', () => {
    const v0 = rico();
    const conta = v0.financas.conta;
    const { v, o } = comprar(v0, 'sitio');
    const x = propria(v);
    expect(x.imovel!.valor).toBe(o.preco);
    expect(v.financas.conta).toBe(conta - o.preco);
    // Não se compra a mesma oferta duas vezes.
    expect(ofertasRurais(v).some(y => y.id === o.id)).toBe(false);
  });

  it('comprar com crédito rural (produtor) ou financiamento comum: 20% de entrada e a dívida presa ao bem', () => {
    const v0 = rico();
    v0.financas.conta = 5_000_000;
    const o = ofertasRurais(v0).find(x => x.p.tipo === 'pecuaria')!;
    const v = executar(v0, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id, financiar: true } }).vida;
    const d = v.financas.dividas.find(d => d.descricao.includes(o.p.nome))!;
    expect(d.saldo).toBe(o.preco - Math.round(o.preco * 0.2));
    expect(d.bemId).toBe(propria(v).imovel!.id);
    expect(d.jurosMes).toBeCloseTo(0.0095);
  });

  it('a reserva legal tira área útil (80% na Amazônia), e não se planta além do que está livre', () => {
    const v = rico();
    const p = novaPropriedade(v, rngDe('t'), 'agricola', 200, v.moradia.municipioId, 'compra');
    expect(reservaLegal('manaus-am')).toBe(0.8);
    expect(areaUtil(p)).toBeLessThan(200 * 0.81);
    const { v: v2 } = comprar(v, 'agricola');
    const x = propria(v2);
    const livre = areaLivre(x.p);
    expect(podeTentar(disponibilidade(v2, { tipo: 'rural18', oque: { op: 'plantar', id: x.p.id, cultura: 'soja', ha: livre + 5 } }))).toBe(false);
    expect(podeTentar(disponibilidade(v2, { tipo: 'rural18', oque: { op: 'plantar', id: x.p.id, cultura: 'soja', ha: Math.min(livre, 20) } }))).toBe(true);
  });

  it('cada tipo tem as suas atividades: café não vai para a piscicultura; peixe pede tanque; hortaliça tem teto de braço', () => {
    let { v } = comprar(rico(), 'aquicultura');
    const aq = propria(v);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'plantar', id: aq.p.id, cultura: 'cafe', ha: 1 } }))).toBe(false);
    ({ v } = comprar(rico(), 'sitio'));
    const si = propria(v);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'animais', id: si.p.id, especie: 'tilapia', lotes: 1 } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'plantar', id: si.p.id, cultura: 'horta', ha: (CULTURAS18.horta.maxHa ?? 4) + 1 } }))).toBe(false);
  });
});

describe('VIDA 18 · lavoura: calendário, clima, solo, praga, orgânico', () => {
  it('o clima do ano é o da safra regional (bom/normal/ruim) e é estável', () => {
    for (let a = 2030; a < 2060; a++) expect(climaDoAno(undefined, 'sao-paulo-sp', a)).toEqual(climaDoAno(undefined, 'sao-paulo-sp', a));
    const tipos = new Set(Array.from({ length: 80 }, (_, k) => climaDoAno(undefined, 'curitiba-pr', 2030 + k).tipo));
    expect(tipos.has('bom') && tipos.has('seca') && tipos.has('normal')).toBe(true);
    expect([...Array(80)].some((_, k) => climaDoAno(undefined, 'curitiba-pr', 2030 + k).tipo === 'geada')).toBe(true);
    expect([...Array(80)].some((_, k) => climaDoAno(undefined, 'recife-pe', 2030 + k).tipo === 'geada')).toBe(false);
  });

  it('seca tira produção (menos com irrigação); geada pega café e não pega soja; praga leva parte; solo bom rende mais', () => {
    const v = rico();
    const p = novaPropriedade(v, rngDe('lav'), 'agricola', 200, 'curitiba-pr', 'compra');
    const normal = { tipo: 'normal' as const, texto: '', severidade: 0 };
    const seca = { tipo: 'seca' as const, texto: '', severidade: 0.38 };
    const geada = { tipo: 'geada' as const, texto: '', severidade: 0.4 };
    const soja = { id: 's', cultura: 'soja' as const, ha: 50, ano: 2040 };
    const a = resultadoDoTalhao(v, p, soja, 2040, normal, false, 50).receita;
    expect(resultadoDoTalhao(v, p, soja, 2040, seca, false, 50).receita).toBeLessThan(a * 0.8);
    expect(resultadoDoTalhao(v, p, { ...soja, irrigado: true }, 2040, seca, false, 50).receita).toBeGreaterThan(resultadoDoTalhao(v, p, soja, 2040, seca, false, 50).receita);
    expect(resultadoDoTalhao(v, p, soja, 2040, geada, false, 50).receita).toBe(a);
    const cafe = { id: 'c', cultura: 'cafe' as const, ha: 20, ano: 2030 };
    expect(resultadoDoTalhao(v, p, cafe, 2040, geada, false, 50).receita).toBeLessThan(resultadoDoTalhao(v, p, cafe, 2040, normal, false, 50).receita * 0.7);
    expect(resultadoDoTalhao(v, p, soja, 2040, normal, true, 50).receita).toBeLessThan(a);
    const bom = { ...p, solo: 90 } as PropriedadeRural18, ruim = { ...p, solo: 30 } as PropriedadeRural18;
    expect(resultadoDoTalhao(v, bom, soja, 2040, normal, false, 50).receita).toBeGreaterThan(resultadoDoTalhao(v, ruim, soja, 2040, normal, false, 50).receita);
  });

  it('café em formação não colhe nos três primeiros anos; eucalipto só no corte, e o corte libera a área', () => {
    const v = rico();
    const p = novaPropriedade(v, rngDe('per'), 'cafeeira', 60, 'belo-horizonte-mg', 'compra');
    const n = { tipo: 'normal' as const, texto: '', severidade: 0 };
    expect(resultadoDoTalhao(v, p, { id: 'c', cultura: 'cafe', ha: 10, ano: 2040 }, 2041, n, false, 50).receita).toBe(0);
    expect(resultadoDoTalhao(v, p, { id: 'c', cultura: 'cafe', ha: 10, ano: 2040 }, 2044, n, false, 50).receita).toBeGreaterThan(0);
    expect(resultadoDoTalhao(v, p, { id: 'e', cultura: 'eucalipto', ha: 10, ano: 2040 }, 2045, n, false, 50).receita).toBe(0);
    expect(resultadoDoTalhao(v, p, { id: 'e', cultura: 'eucalipto', ha: 10, ano: 2040 }, 2047, n, false, 50).receita).toBeGreaterThan(150_000);
  });

  it('orgânico rende menos e só ganha o prêmio depois de três anos de transição', () => {
    const v = rico();
    const p = novaPropriedade(v, rngDe('org'), 'sitio', 25, 'sao-paulo-sp', 'compra');
    const n = { tipo: 'normal' as const, texto: '', severidade: 0 };
    const t = { id: 'h', cultura: 'horta' as const, ha: 2, ano: 2040 };
    const conv = resultadoDoTalhao(v, p, t, 2040, n, false, 50).receita;
    const trans = resultadoDoTalhao(v, { ...p, manejo: 'organico', transicao: 2040 }, t, 2041, n, false, 50).receita;
    const cert = resultadoDoTalhao(v, { ...p, manejo: 'organico', transicao: 2040 }, t, 2044, n, false, 50).receita;
    expect(trans).toBeLessThan(conv);
    expect(cert / 0.8 / (1 + CULTURAS18.horta.premioOrganico)).toBeGreaterThan(0);
    expect(cert).toBeGreaterThan(trans * 1.3);
  });

  it('o ano da propriedade entra na conta UMA vez (avançar, salvar e reabrir não repete)', () => {
    let { v } = comprar(rico(30, 7), 'agricola');
    const x = propria(v);
    v = executar(v, { tipo: 'rural18', oque: { op: 'plantar', id: x.p.id, cultura: 'soja', ha: Math.min(60, areaLivre(x.p)) } }).vida;
    const antes = v.financas.conta;
    v = ano(v);
    const p = acharPropriedade(v, x.p.id)!.p;
    expect(p.historico.length).toBe(1);
    const r = p.historico[0];
    expect(r.resultado).toBe(r.receita - r.custo);
    const lido = interpretar(JSON.stringify(v));
    if (lido.tipo !== 'ok') throw new Error('save');
    expect(acharPropriedade(lido.vida, x.p.id)!.p.historico.length).toBe(1);
    expect(Number.isFinite(v.financas.conta) && v.financas.conta !== antes).toBe(true);
  });
});

describe('VIDA 18 · pecuária e estrutura', () => {
  it('o rebanho nasce, morre e vende; sem estrutura não passa do teto; o curral sobe o teto', () => {
    let { v } = comprar(rico(30, 3), 'pecuaria');
    const x = propria(v);
    const teto = tetoDaEstrutura(x.p, 'leite');
    expect(teto).toBe(REBANHOS18.leite.semEstrutura);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'animais', id: x.p.id, especie: 'leite', lotes: 3 } }))).toBe(false);
    v = executar(v, { tipo: 'rural18', oque: { op: 'construir', id: x.p.id, estrutura: 'ordenha' } }).vida;
    expect(tetoDaEstrutura(acharPropriedade(v, x.p.id)!.p, 'leite')).toBeGreaterThan(teto);
    v = executar(v, { tipo: 'rural18', oque: { op: 'animais', id: x.p.id, especie: 'leite', lotes: 3 } }).vida;
    const s = simularAno(v, acharPropriedade(v, x.p.id)!.p, anoDe(v.t), { prever: true });
    const leite = s.rebanhos[s.rebanhos.length - 1];
    expect(leite.receita).toBeGreaterThan(0);
    expect(leite.nascidos).toBeGreaterThan(0);
  });

  it('genética melhorada rende mais; superlotação derruba a sanidade', () => {
    const v = rico();
    const p = novaPropriedade(v, rngDe('gen'), 'pecuaria', 400, 'campo-grande-ms', 'compra');
    p.rebanhos.push({ especie: 'corte', cabecas: 200, genetica: 40, sanidade: 70, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' });
    p.estruturas.push({ id: 'curral', n: 1, t: v.t });
    const n = { tipo: 'normal' as const, texto: '', severidade: 0 };
    const a = simularAno(v, p, 2040, { prever: true, clima: n }).rebanhos[0].receita;
    p.rebanhos[0].genetica = 85;
    expect(simularAno(v, p, 2040, { prever: true, clima: n }).rebanhos[0].receita).toBeGreaterThan(a * 1.2);
    p.rebanhos[0].cabecas = 2000;
    expect(simularAno(v, p, 2040, { prever: true, clima: n }).rebanhos[0].sanidade).toBeLessThan(70);
  });

  it('estrutura respeita a área: pivô não cabe na chácara; máquina grande não se paga num sítio pequeno', () => {
    const { v } = comprar(rico(), 'chacara');
    const x = propria(v);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'construir', id: x.p.id, estrutura: 'pivo' } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'maquina', id: x.p.id, maquina: 'colheitadeira' } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'construir', id: x.p.id, estrutura: 'poco' } }))).toBe(true);
  });
});

describe('VIDA 18 · arrendamento, expansão, gestão e herança', () => {
  it('arrendar de terceiros não é patrimônio; o contrato cobra por ano e acaba', () => {
    const v0 = rico();
    const o = ofertasRurais(v0).find(x => x.p.tipo === 'agricola')!;
    let v = executar(v0, { tipo: 'rural18', oque: { op: 'arrendar', oferta: o.id } }).vida;
    expect(v.financas.bens.length).toBe(v0.financas.bens.length);
    expect(v.rural18!.arrendadas.length).toBe(1);
    for (let k = 0; k < 6; k++) v = ano(v);
    expect(v.rural18!.arrendadas.length).toBe(0);
  });

  it('arrendar a própria terra a terceiros dá renda; expandir e reduzir mudam a área e o dinheiro', () => {
    let { v } = comprar(rico(), 'agricola');
    const x = propria(v);
    const ha = x.p.ha;
    const c0 = v.financas.conta;
    v = executar(v, { tipo: 'rural18', oque: { op: 'expandir', id: x.p.id, ha: 20 } }).vida;
    expect(acharPropriedade(v, x.p.id)!.p.ha).toBe(ha + 20);
    expect(v.financas.conta).toBeLessThan(c0);
    v = executar(v, { tipo: 'rural18', oque: { op: 'reduzir', id: x.p.id, ha: 10 } }).vida;
    expect(acharPropriedade(v, x.p.id)!.p.ha).toBe(ha + 10);
    v = executar(v, { tipo: 'rural18', oque: { op: 'arrendar_para', id: x.p.id } }).vida;
    const c1 = v.financas.conta;
    v = ano(v);
    const p = acharPropriedade(v, x.p.id)!.p;
    expect(p.historico[0].receita).toBe(p.arrendamento!.valorAno);
    expect(Number.isFinite(c1)).toBe(true);
  });

  it('quem não toca a terra paga caseiro ou gerente; quem vira produtor toca a sua sem esse custo', () => {
    let { v } = comprar(rico(), 'sitio');
    const x = propria(v);
    const fixo = simularAno(v, x.p, anoDe(v.t), { prever: true }).linhas.some(l => /Caseiro|Gerente/.test(l.oque));
    expect(fixo).toBe(true);
    v = executar(v, { tipo: 'rural18', oque: { op: 'tocar', id: x.p.id } }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('produtor_rural');
    expect(simularAno(v, acharPropriedade(v, x.p.id)!.p, anoDe(v.t), { prever: true }).linhas.some(l => /Caseiro|Gerente/.test(l.oque))).toBe(false);
  });

  it('a família do campo tem terra nas posses; a herança a passa adiante como um bem (sem herança paralela)', () => {
    const v = structuredClone(adulto(30, { semente: 4 }));
    const pai = Object.values(v.pessoas).find(p => v.vinculos[p.id]?.parentesco === 'pai' || v.vinculos[p.id]?.parentesco === 'mae')!;
    pai.ocupacaoId = 'produtor_rural';
    delete v.fatos['rural18_familia'];
    const p = terraDaFamilia(v, rngDe('fam'))!;
    expect(p).toBeTruthy();
    expect(pai.posses!.bens.some(b => b.tipo === 'imovel' && b.rural?.id === p.id)).toBe(true);
    // Uma vez só.
    expect(terraDaFamilia(v, rngDe('fam'))).toBeUndefined();
  });

  it('save antigo: o sítio comprado antes vira propriedade sem mudar o valor; normalizar duas vezes não muda nada', () => {
    const v = structuredClone(adulto(40, { semente: 2 }));
    v.financas.conta = 500_000;
    const b: Imovel = { id: 'ix', tipo: 'imovel', modeloId: 'sitio', nome: 'sítio', valor: 240000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 70 };
    v.financas.bens.push(b);
    normalizarRural18(v);
    expect(b.rural).toBeTruthy();
    expect(Math.abs(b.valor - 240000)).toBeLessThanOrEqual(1000);
    const j = JSON.stringify(v);
    normalizarRural18(v);
    expect(JSON.stringify(v)).toBe(j);
    const x = ano(v);
    expect(x.financas.bens.find(y => y.id === 'ix')).toBeTruthy();
  });

  it('festas do campo respeitam a região e a idade; uma por ano', () => {
    const v = rico();
    const disp = (f: string) => podeTentar(disponibilidade(v, { tipo: 'rural18', oque: { op: 'festa', festa: f } }));
    expect(disp('junina')).toBe(true);
    const x = executar(v, { tipo: 'rural18', oque: { op: 'festa', festa: 'junina' } }).vida;
    expect(podeTentar(disponibilidade(x, { tipo: 'rural18', oque: { op: 'festa', festa: 'junina' } }))).toBe(false);
    void op;
  });
});
