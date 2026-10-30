/**
 * REWORK 12 — Patrimônio, consumo e negócios: as regressões obrigatórias (imóveis, aluguel e vacância,
 * financiamento, vários imóveis, veículos, mudança de país, depreciação e valorização, coleção e revenda, empresas
 * com lucro e com prejuízo, empresas ao lado da carreira, venda e encerramento, patrimônio sem dupla contagem,
 * dívida e liquidez, acontecimentos, saves antigos, exploits conhecidos).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, MAX_FINANCIAMENTOS_IMOVEL, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { balanco, orcamento, patrimonio, rendaPropriaMensal, seguranca } from '../sistemas/dinheiro';
import { ofertasDeImoveis, ofertasDeVeiculos, precoDeImovel, aluguelDe, valorJustoDoImovel, versoesNoPais, precoNovoNoPais, indiceClassicos } from '../sistemas/mercado';
import { fatorDoBairro, rendimentoDoMercado } from '../sistemas/precos';
import { modeloMoradia, versaoVeiculo } from '../dados/bens';
import { processarImoveis, custosDoImovelDeInvestimento } from '../sistemas/imoveis';
import { custoDeTrazer, processarVeiculos, valorDeVenda, valorDeMercadoDoVeiculo } from '../sistemas/veiculos';
import { migrar } from '../sistemas/migracao';
import { colecao, estimativaDeVenda, ofertasDeColecao, processarColecao } from '../sistemas/colecao';
import { contasDoAno, empresa, empresasAtivas, ofertasDeParticipacao, processarEmpresas, valorDaParte, valorDeVendaDaParte } from '../sistemas/empresas';
import { cidadesDoPais, paisDaCidade } from '../dados/lugares';
import { converterEntrePaises } from '../mundo/moeda';
import { semana } from '../sistemas/semana';
import { CATALOGO } from '../conteudo/catalogo';
import { interpretar, normalizarRework12, VERSAO_SAVE } from '../save';
import { inventario } from '../sistemas/sucessao';
import type { Imovel, Veiculo, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const ANO = { fase: 'normal' as const, inflacao: 0.045, juroReal: 0.045, bolsa: 0.03, imoveis: 0.005, deltaJuro: 0, virou: false };

function rica(cidade = 'sao-paulo-sp', conta = 30_000_000): Vida {
  const v = adulto(38, { municipioId: cidade, semente: 41 });
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.trabalho.licencas.push('cnh');
  if (v.trabalho.atual) v.trabalho.atual.salario = 25000;
  return v;
}

describe('imóveis: preço, aluguel e mercado', () => {
  it('o preço sai do aluguel pelo rendimento do mercado (de 3% a 7% no dois quartos), em todo país com perfil', () => {
    const v = adulto(30);
    const cidades = ['sao-paulo-sp', 'recife-pe', ...['US', 'DE', 'NG', 'JP', 'GB', 'AR'].map(p => cidadesDoPais(p)[0]?.id).filter((x): x is string => !!x)];
    expect(cidades.length).toBeGreaterThan(6);
    for (const id of cidades) {
      const y = aluguelDe(v, modeloMoradia('apto_2q'), id) * 12 / precoDeImovel(v, modeloMoradia('apto_2q'), id);
      expect(y, id).toBeGreaterThan(0.03);
      expect(y, id).toBeLessThan(0.075);
    }
    expect(rendimentoDoMercado('recife-pe')).toBeGreaterThan(rendimentoDoMercado('sao-paulo-sp'));
  });

  it('a mansão afastada vale menos que o apartamento de luxo no bairro nobre da mesma cidade', () => {
    const v = rica();
    const nobre = precoDeImovel(v, modeloMoradia('alto_padrao'), 'sao-paulo-sp') * fatorDoBairro(1.5, 'alto_padrao', 'preco');
    const longe = precoDeImovel(v, modeloMoradia('mansao'), 'sao-paulo-sp') * fatorDoBairro(0.62, 'mansao', 'preco');
    expect(longe).toBeLessThan(nobre);
  });

  it('comprar e vender na hora perde (escritura e corretagem); o valor caminha para o de mercado', () => {
    const v = rica();
    const o = ofertasDeImoveis(v, 'venda').find(x => x.modeloId === 'apto_2q')!;
    const antes = patrimonio(v);
    let d = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: false });
    const b = d.financas.bens.find((x): x is Imovel => x.tipo === 'imovel')!;
    expect(b.indiceBairro).toBe(o.indiceBairro);
    d = fazer(d, { tipo: 'vender_bem', bemId: b.id });
    expect(patrimonio(d)).toBeLessThan(antes);
    // Dez anos: o valor não foge do de mercado (o acaso é puxado de volta).
    const w = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: false });
    const im = w.financas.bens.find((x): x is Imovel => x.tipo === 'imovel')!;
    for (let k = 0; k < 10; k++) { w.t += 12; processarImoveis(w, criarRng(k), ANO); }
    expect(im.valor / valorJustoDoImovel(w, im)).toBeGreaterThan(0.7);
    expect(im.valor / valorJustoDoImovel(w, im)).toBeLessThan(1.4);
  });

  it('alugado rende (com imobiliária, 10% a menos); sem imobiliária rende tudo — e vazio custa imposto e condomínio', () => {
    const v = rica();
    const o = ofertasDeImoveis(v, 'venda').find(x => x.modeloId === 'apto_2q')!;
    let d = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: false });
    const id = d.financas.bens.find(x => x.tipo === 'imovel')!.id;
    const comImob = (d.financas.bens.find(x => x.id === id) as Imovel).alugadoPor!;
    expect(comImob).toBeGreaterThan(0);
    expect(orcamento(d).entradas.some(l => /Aluguel recebido/.test(l.rotulo))).toBe(true);
    expect(custosDoImovelDeInvestimento(d, d.financas.bens.find(x => x.id === id) as Imovel, 1).some(l => /imposto sobre o aluguel/.test(l.rotulo))).toBe(true);
    d = fazer(d, { tipo: 'imovel', bemId: id, oque: 'administrar' });
    expect((d.financas.bens.find(x => x.id === id) as Imovel).alugadoPor!).toBeGreaterThan(comImob);
    d = fazer(d, { tipo: 'imovel', bemId: id, oque: 'retomar' });
    const vazio = custosDoImovelDeInvestimento(d, d.financas.bens.find(x => x.id === id) as Imovel, 1);
    expect(vazio.some(l => /condomínio \(vazio\)/.test(l.rotulo))).toBe(true);
    expect(orcamento(d).saidas.some(l => /condomínio \(vazio\)/.test(l.rotulo))).toBe(true);
  });

  it('vacância e calote acontecem (sem imobiliária, mais) — e o calote não entra como renda', () => {
    const v = rica();
    const o = ofertasDeImoveis(v, 'venda').find(x => x.modeloId === 'apto_2q')!;
    let calotes = 0;
    for (let s = 0; s < 120; s++) {
      const d = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: false });
      const im = d.financas.bens.find((x): x is Imovel => x.tipo === 'imovel')!;
      im.administracao = 'propria';
      processarImoveis(d, criarRng(s), ANO);
      if (im.calote) { calotes++; expect(orcamento(d).entradas.some(l => /Aluguel recebido/.test(l.rotulo))).toBe(false); }
    }
    expect(calotes).toBeGreaterThan(0);
    expect(calotes).toBeLessThan(40);
  });
});

describe('financiamento e vários imóveis', () => {
  it('o banco conta só 70% do aluguel recebido e não financia um terceiro imóvel ao mesmo tempo', () => {
    let v = rica('sao-paulo-sp', 3_000_000);
    v.trabalho.atual!.salario = 90000;
    const baratos = ofertasDeImoveis(v, 'venda').filter(x => x.modeloId === 'kitnet' || x.modeloId === 'apto_1q').sort((a, b) => a.preco - b.preco);
    for (const o of baratos.slice(0, MAX_FINANCIAMENTOS_IMOVEL)) v = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: false, prazo: 20 });
    expect(v.financas.dividas.filter(d => d.tipo === 'financiamento_imovel').length).toBe(MAX_FINANCIAMENTOS_IMOVEL);
    const terceiro = baratos[MAX_FINANCIAMENTOS_IMOVEL];
    const d = disponibilidade(v, { tipo: 'comprar_imovel', ofertaId: terceiro.id, financiar: true, morar: false, prazo: 20 });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/financiamentos de imóvel em aberto/);
    // À vista, ainda pode (quem tem dinheiro compra; o que se limita é a alavanca).
    expect(pode(v, { tipo: 'comprar_imovel', ofertaId: terceiro.id, financiar: false, morar: false })).toBe(true);
    // No balanço: cada imóvel pelo valor, cada financiamento como obrigação — o líquido desconta as duas.
    const b = balanco(v);
    expect(b.liquido).toBe(Math.round(b.ativos - b.obrigacoes));
    expect(b.financiamentos).toBeGreaterThan(0);
  });

  it('o empréstimo não cria patrimônio: entra na conta e na dívida', () => {
    const v = rica('sao-paulo-sp', 10000);
    v.trabalho.atual!.salario = 9000;
    const antes = patrimonio(v);
    const d = fazer(v, { tipo: 'emprestimo', valor: 20000, meses: 24 });
    expect(Math.abs(patrimonio(d) - antes)).toBeLessThan(50);
  });
});

describe('veículos: mercado regional, valor e mudança de país', () => {
  it('cada país tem o seu mercado (o Mobi no Brasil, a F-150 nos EUA) e os preços de lá', () => {
    expect(versoesNoPais('BR').some(x => x.id === 'fiat_mobi')).toBe(true);
    expect(versoesNoPais('US').some(x => x.id === 'fiat_mobi')).toBe(false);
    expect(versoesNoPais('US').some(x => x.id === 'ford_f150')).toBe(true);
    expect(versoesNoPais('BR').some(x => x.id === 'ford_f150')).toBe(false);
    const corolla = versaoVeiculo('toyota_corolla')!;
    // Em poder de compra, o carro é mais barato nos EUA que no Brasil (imposto e nível de preços).
    expect(precoNovoNoPais(corolla, cidadesDoPais('US')[0].id)).toBeLessThan(precoNovoNoPais(corolla, 'sao-paulo-sp') * 0.6);
  });

  it('a concessionária não vende exótico nem clássico; a garagem de colecionador vende, e o clássico só usado', () => {
    const v = rica();
    expect(ofertasDeVeiculos(v, 'concessionaria').every(o => !['superesportivo', 'hiperluxo', 'classico'].includes(o.modeloId))).toBe(true);
    const col = ofertasDeVeiculos(v, 'colecionador');
    expect(col.some(o => o.modeloId === 'superesportivo' && !o.usado)).toBe(true);
    expect(col.filter(o => o.modeloId === 'classico').every(o => o.usado)).toBe(true);
  });

  it('comprar e vender um carro perde; o comum deprecia; o clássico anda com o mercado (sobe e desce)', () => {
    let v = rica();
    const o = ofertasDeVeiculos(v, 'concessionaria')[0];
    const antes = patrimonio(v);
    v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
    const b = v.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo')!;
    expect(valorDeVenda(b, v)).toBeLessThan(o.preco);
    const comum: number[] = [];
    for (let k = 0; k < 8; k++) { v.t += 12; processarVeiculos(v, criarRng(k)); comum.push(b.valor); }
    expect(comum[7]).toBeLessThan(comum[0]);
    expect(patrimonio(v)).toBeLessThan(antes);
    // O índice de clássicos não é monótono (há anos de queda) e não explode.
    const idx = Array.from({ length: 40 }, (_, k) => indiceClassicos(77, 2027 + k));
    expect(idx.some((x, k) => k > 0 && x < idx[k - 1])).toBe(true);
    expect(idx.some((x, k) => k > 0 && x > idx[k - 1])).toBe(true);
    expect(Math.max(...idx)).toBeLessThanOrEqual(3);
  });

  it('mudar de país não vende nem some com o veículo: ele fica guardado, com a história; dá para trazer (se o país deixa) ou vender de longe', () => {
    let v = rica('sao-paulo-sp');
    const o = ofertasDeVeiculos(v, 'concessionaria')[0];
    v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
    const id = v.financas.bens.find(x => x.tipo === 'veiculo')!.id;
    const origem = v.moradia.municipioId;
    v = transacao(v, (x, r) => { migrar(x, r, 'pt:lisboa', 'trabalho'); }).vida;
    const b = v.financas.bens.find((x): x is Veiculo => x.id === id)!;
    expect(b).toBeDefined();
    expect(b.local).toBe(origem);
    expect(b.parado).toBe(true);
    expect((b.historia ?? []).some(h => /guardad/.test(h.texto))).toBe(true);
    // Não leva ninguém a lugar nenhum enquanto está longe; o valor segue o mercado de onde está.
    expect(pode(v, { tipo: 'veiculo', bemId: id, oque: 'usar' })).toBe(false);
    expect(valorDeMercadoDoVeiculo(v, b)).toBeGreaterThan(0);
    // Portugal deixa entrar usado (com frete e imposto); o Brasil, só clássico de 30+ anos.
    const t = custoDeTrazer(v, b);
    expect(t.bloqueio).toBeUndefined();
    expect(t.custo).toBeGreaterThan(5000);
    const w = fazer(v, { tipo: 'veiculo', bemId: id, oque: 'trazer' });
    expect((w.financas.bens.find(x => x.id === id) as Veiculo).local).toBeUndefined();
    // Volta ao Brasil com um carro comprado em Portugal: o Brasil não deixa entrar o usado comum.
    let p = rica('pt:lisboa');
    const op = ofertasDeVeiculos(p, 'concessionaria')[0];
    p = fazer(p, { tipo: 'comprar_veiculo', ofertaId: op.id, financiar: false });
    const pid = p.financas.bens.find(x => x.tipo === 'veiculo')!.id;
    p = transacao(p, (x, r) => { migrar(x, r, 'sao-paulo-sp', 'familia'); }).vida;
    const pb = p.financas.bens.find((x): x is Veiculo => x.id === pid)!;
    expect(custoDeTrazer(p, pb).bloqueio).toMatch(/coleção/);
  });
});

describe('coleção: raridade, procedência, revenda', () => {
  it('as ofertas são determinísticas; a peça vale menos ao sair da loja; vender na hora perde', () => {
    let v = rica();
    const a = ofertasDeColecao(v, 'relojoaria');
    expect(ofertasDeColecao(structuredClone(v), 'relojoaria')).toEqual(a);
    const o = a.find(x => x.preco < 100000)!;
    const antes = patrimonio(v);
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    const c = colecao(v)[0];
    expect(c.valor).toBeLessThanOrEqual(o.preco);
    expect(estimativaDeVenda(c, 'rapido')).toBeLessThan(o.preco);
    v = fazer(v, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' });
    expect(patrimonio(v)).toBeLessThan(antes);
    expect(colecao(v).length).toBe(0);
  });

  it('a peça sem procedência vale como réplica; o leilão cobra a comissão; o valor não cresce sem freio', () => {
    let v = rica();
    const calcada = ofertasDeColecao(v, 'memorabilia').find(o => !o.certificado);
    if (calcada) expect(calcada.valorEstimado).toBeLessThan(calcada.preco * 0.4);
    const lote = ofertasDeColecao(v, 'leilao')[0];
    expect(lote.valorEstimado).toBeLessThan(lote.preco);
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: lote.id });
    const c = colecao(v)[0];
    for (let k = 0; k < 30; k++) { v.t += 12; processarColecao(v, criarRng(k)); }
    expect(c.valor).toBeLessThan(lote.preco * 6);
    expect(c.valor).toBeGreaterThan(0);
  });

  it('a coleção valiosa paga seguro e guarda; a coleção entra no balanço uma vez', () => {
    let v = rica();
    // Pré-condição dita (o sorteio das vidas com semente muda quando o catálogo cresce): uma peça acima de 100 mil na galeria
    // no ano — senão, o ano seguinte.
    for (let k = 0; k < 6 && !ofertasDeColecao(v, 'galeria').some(o => o.preco > 100000); k++) v = { ...v, t: v.t + 12 };
    const caros = ofertasDeColecao(v, 'galeria').filter(o => o.preco > 100000).slice(0, 1);
    expect(caros.length).toBe(1);
    for (const o of caros) v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    const b = balanco(v);
    expect(b.colecao).toBe(Math.round(colecao(v).reduce((s, c) => s + c.valor, 0)));
    expect(orcamento(v).saidas.some(l => /Seguro e guarda da coleção/.test(l.rotulo))).toBe(true);
  });
});

describe('empresas: ao lado da carreira, lucro, prejuízo, venda e fim', () => {
  it('abrir não tira o emprego; o caixa é da empresa; gestão própria pede a semana', () => {
    let v = rica();
    const emprego = v.trabalho.atual?.ocupacaoId;
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    expect(v.trabalho.atual?.ocupacaoId).toBe(emprego);
    const e = empresasAtivas(v)[0];
    expect(e.caixa).toBeGreaterThan(0);
    // O balanço conta a parte (avaliação × parte), que já contém o caixa — não os dois.
    expect(balanco(v).empresas).toBe(Math.round(valorDaParte(e)));
    expect(semana(v).fixos.some(f => f.id === `empresa_${e.id}`)).toBe(false);
    v = fazer(v, { tipo: 'empresa', empresaId: e.id, decisao: 'assumir' });
    expect(semana(v).fixos.some(f => f.id === `empresa_${e.id}`)).toBe(true);
  });

  it('a distribuição só tira lucro (nunca o capital de abertura) e não muda o patrimônio de lugar sem motivo', () => {
    let v = rica();
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false });
    const id = empresasAtivas(v)[0].id;
    const contaAntes = v.financas.conta;
    v = transacao(v, (x, r) => processarEmpresas(x, r)).vida;
    // Ano de obra: prejuízo; nada distribuído.
    expect(empresa(v, id)!.ultimo!.distribuido).toBe(0);
    expect(v.financas.conta).toBe(contaAntes);
  });

  it('os tipos não são a mesma fórmula: a academia vive de carteira, o museu de apoio, o hotel de ocupação', () => {
    let v = rica();
    for (const tipo of ['academia', 'hotel', 'museu'] as const) { v = fazer(v, { tipo: 'empresa_abrir', empresa: tipo, comSocio: false }); v.anoAtual.acoes = []; }
    for (const e of empresasAtivas(v)) { e.estado = 'operando'; e.reputacao = 55; }
    const [academia, hotel, museu] = empresasAtivas(v);
    contasDoAno(v, academia, criarRng(1));
    expect(academia.carteira).toBeGreaterThan(0);
    const m = contasDoAno(v, museu, criarRng(1));
    expect(m.apoio).toBeGreaterThan(0);
    const h = contasDoAno(v, hotel, criarRng(1));
    expect(h.apoio).toBe(0);
    expect(h.receita).toBeGreaterThan(m.receita);
  });

  it('a falência pede anos no vermelho (um ano ruim não fecha a empresa); o aval vira acordo parcelado, não ruína', () => {
    let v = rica();
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    const e = empresasAtivas(v)[0];
    e.caixa = -2_000_000;
    v = transacao(v, (x, r) => processarEmpresas(x, r)).vida;
    expect(empresa(v, e.id)!.estado).not.toBe('encerrada');
    for (let k = 0; k < 4; k++) { v.t += 12; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; }
    expect(empresa(v, e.id)!.estado).toBe('encerrada');
    const aval = v.financas.dividas.find(d => /Aval da falência/.test(d.descricao));
    expect(aval?.tipo).toBe('acordo');
    expect(aval!.parcela).toBeGreaterThan(0);
  });

  it('vender a parte e fechar: um sai com dinheiro (abaixo da avaliação), o outro com o que sobra — e o zoológico transfere, não vende, os animais', () => {
    let v = rica('sao-paulo-sp', 60_000_000);
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'clinica', comSocio: false });
    const c = empresasAtivas(v)[0];
    expect(valorDeVendaDaParte(c)).toBeLessThan(valorDaParte(c));
    v = fazer(v, { tipo: 'empresa', empresaId: c.id, decisao: 'vender' });
    expect(empresa(v, c.id)).toBeUndefined();
    v.anoAtual.acoes = [];
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'zoologico', comSocio: false });
    const z = empresasAtivas(v)[0];
    const r = executar(v, { tipo: 'empresa', empresaId: z.id, decisao: 'encerrar' });
    expect(r.resultado).toMatch(/transferidos/);
  });

  it('comprar uma participação e vender em seguida perde; o investidor não decide', () => {
    let v = rica();
    const ofertas = ofertasDeParticipacao(v);
    expect(ofertas.length).toBeGreaterThan(0);
    const antes = patrimonio(v);
    v = fazer(v, { tipo: 'participacao', ofertaId: ofertas[0].id });
    const e = empresasAtivas(v)[0];
    expect(pode(v, { tipo: 'empresa', empresaId: e.id, decisao: 'melhorar' })).toBe(false);
    v = fazer(v, { tipo: 'empresa', empresaId: e.id, decisao: 'vender' });
    expect(patrimonio(v)).toBeLessThan(antes);
  });
});

describe('mudança de país com coleção e empresa', () => {
  it('o valor de mercado atravessa a fronteira (coleção e empresa re-expressas no câmbio), sem criar nem sumir dinheiro', () => {
    let v = rica('sao-paulo-sp');
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'relojoaria')[0].id });
    v.anoAtual.acoes = [];
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
    const antes = balanco(v);
    const id = empresasAtivas(v)[0].id;
    const w = transacao(v, (x, r) => { migrar(x, r, 'pt:lisboa', 'trabalho'); }).vida;
    const depois = balanco(w);
    const k = converterEntrePaises(1, paisDaCidade(v.moradia.municipioId), 'PT');
    // A coleção e a empresa mudam na proporção do câmbio (o mesmo valor de mercado, na unidade de lá).
    expect(depois.colecao / antes.colecao).toBeCloseTo(k, 2);
    expect(empresa(w, id)!.caixa / empresa(v, id)!.caixa).toBeCloseTo(k, 2);
    expect(empresa(w, id)!.municipioId).toBe(empresa(v, id)!.municipioId);
    // De longe, a gestão própria vira contratada no ano seguinte (a empresa fica na cidade dela).
    const e = empresa(w, id)!;
    e.gestao = { quem: 'propria', tInicio: w.t };
    const z = transacao(w, (x, r) => processarEmpresas(x, r)).vida;
    expect(empresa(z, id)?.gestao.quem ?? 'contratada').toBe('contratada');
  });

  it('vender um quarto a um investidor: dinheiro agora, a parte cai, o comando fica', () => {
    let v = rica();
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'clinica', comSocio: false });
    const id = empresasAtivas(v)[0].id;
    const conta = v.financas.conta;
    v = fazer(v, { tipo: 'empresa', empresaId: id, decisao: 'vender_parte' });
    expect(v.financas.conta).toBeGreaterThan(conta);
    expect(empresa(v, id)!.parte).toBe(0.75);
    expect(pode(v, { tipo: 'empresa', empresaId: id, decisao: 'melhorar' })).toBe(true);
  });
});

describe('liquidez × patrimônio', () => {
  it('rico em imóvel e curto de caixa não aparece "no vermelho"; a dívida desconta uma vez', () => {
    let v = rica('sao-paulo-sp', 5_000_000);
    // O imóvel de alto padrão mais caro que cabe à vista (com escritura e impostos) — a pré-condição do teste, dita.
    const o = ofertasDeImoveis(v, 'venda').filter(x => (x.modeloId === 'alto_padrao' || x.modeloId === 'cobertura') && x.preco * 1.06 < v.financas.conta).sort((a, b) => b.preco - a.preco)[0];
    v = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true });
    v.financas.conta = 3000;
    expect(['no_vermelho', 'dependente']).not.toContain(seguranca(v).nivel);
    const b = balanco(v);
    expect(b.imoveis).toBeGreaterThan(b.conta * 10);
    expect(b.liquido).toBeGreaterThan(0);
  });
});

describe('acontecimentos do patrimônio', () => {
  it('os acontecimentos novos estão no catálogo do motor (não num sistema à parte) e respondem ao estado', () => {
    const ids = ['pat12_calote', 'pat12_empresa_crise', 'pat12_gestor', 'pat12_proposta', 'pat12_guardado', 'pat12_classico', 'pat12_doacao_museu', 'pat12_zoo_filhote'];
    for (const id of ids) expect(CATALOGO.some(c => c.id === id)).toBe(true);
    const calote = CATALOGO.find(c => c.id === 'pat12_calote')!;
    const v = rica();
    const ctx = { v, r: criarRng(1), idade: 38, p: {}, g: (a: string) => a, vezes: 0 };
    expect(calote.quando!(ctx)).toBe(false);
    v.financas.bens.push({ id: 'ix', tipo: 'imovel', modeloId: 'apto_2q', nome: 'apartamento de dois quartos', valor: 400000, tCompra: v.t, municipioId: v.moradia.municipioId, estado: 80, alugadoPor: 1800, calote: 2 });
    expect(calote.quando!(ctx)).toBe(true);
    expect(rendaPropriaMensal(v)).toBe(rendaPropriaMensal({ ...v, financas: { ...v.financas, bens: v.financas.bens.filter(b => b.id !== 'ix') } }));
  });
});

describe('saves e herança', () => {
  it('save antigo (sem os campos novos) carrega; o normalizador é idempotente; ida e volta preserva coleção e empresas; a versão continua 20', () => {
    let v = rica();
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'antiquario')[0].id });
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: true });
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.financas.colecao?.length).toBe(1);
    expect(r.vida.financas.empresas?.length).toBe(1);
    const antigo = structuredClone(v);
    delete antigo.financas.colecao; delete antigo.financas.empresas;
    antigo.financas.bens.push({ id: 'iv', tipo: 'imovel', modeloId: 'apto_2q', nome: 'apartamento de dois quartos', valor: 300000, tCompra: v.t, municipioId: v.moradia.municipioId, estado: 80, bairro: 'num bairro nobre' });
    const a = structuredClone(antigo); normalizarRework12(a);
    const b = structuredClone(a); normalizarRework12(b);
    expect(b).toEqual(a);
    expect((a.financas.bens.find(x => x.id === 'iv') as Imovel).indiceBairro).toBe(1.5);
    expect((a.financas.bens.find(x => x.id === 'iv') as Imovel).valor).toBe(300000);
    expect(VERSAO_SAVE).toBe(20);
  });

  it('na morte, a coleção e as participações entram no inventário (nada some)', () => {
    let v = rica();
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'relojoaria')[0].id });
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'estudio', comSocio: false });
    const inv = inventario(v);
    expect(inv.some(x => x.id === 'colecao' && x.valor > 0)).toBe(true);
    expect(inv.some(x => x.id.startsWith('empresa:') && x.valor > 0)).toBe(true);
  });
});

describe('exploits conhecidos', () => {
  it('nenhum ciclo de compra e revenda imediata cria dinheiro (imóvel, veículo, peça, empresa)', () => {
    const v = rica();
    const ciclos: Acao[][] = [];
    const im = ofertasDeImoveis(v, 'venda')[0];
    ciclos.push([{ tipo: 'comprar_imovel', ofertaId: im.id, financiar: false, morar: false }]);
    const ve = ofertasDeVeiculos(v, 'colecionador').find(o => o.modeloId === 'classico');
    if (ve) ciclos.push([{ tipo: 'comprar_veiculo', ofertaId: ve.id, financiar: false }]);
    for (const loja of ['relojoaria', 'galeria', 'antiquario', 'leilao'] as const) { const o = ofertasDeColecao(v, loja)[0]; if (o) ciclos.push([{ tipo: 'colecao_comprar', ofertaId: o.id }]); }
    for (const [compra] of ciclos) {
      let w = fazer(v, compra);
      const antes = v.financas.conta;
      if (compra.tipo === 'colecao_comprar') { const c = colecao(w)[0]; w = fazer(w, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' }); }
      else { const b = w.financas.bens[w.financas.bens.length - 1]; w = fazer(w, { tipo: 'vender_bem', bemId: b.id }); }
      expect(w.financas.conta).toBeLessThan(antes);
    }
    let e = fazer(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
    const id = empresasAtivas(e)[0].id;
    e = fazer(e, { tipo: 'empresa', empresaId: id, decisao: 'vender' });
    expect(e.financas.conta).toBeLessThan(v.financas.conta);
  });

  it('nenhuma despesa do patrimônio vira entrada (as saídas do razão são negativas; nenhuma positiva)', () => {
    let v = rica();
    v = fazer(v, { tipo: 'comprar_imovel', ofertaId: ofertasDeImoveis(v, 'venda')[0].id, financiar: false, morar: false });
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'galeria')[0].id });
    for (const l of orcamento(v).saidas) expect(l.valor, l.rotulo).toBeLessThanOrEqual(0);
    expect(orcamento(v).saidas.some(l => /Seguro e guarda|imposto e manutenção|imposto sobre o aluguel/.test(l.rotulo))).toBe(true);
  });
});
