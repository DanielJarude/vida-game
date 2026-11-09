/**
 * VIDA 12.9 · Economia e Negócios — a escala patrimonial (indicadores, liquidez única, perdas proporcionais e reais, venda
 * de bens no rombo, apostas, insolvência) e as empresas de todos os portes (alavancas, projetos, diretoria, delegação,
 * fundar e adquirir, dívida da empresa, recuperação e falência, saves antigos, exploits).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { balanco, condicaoEconomica, disponivel, processarDinheiro } from '../sistemas/dinheiro';
import { liquidez, liquidezImediata } from '../sistemas/investimentos';
import { contasDoAno, comprarParticipacao, custosFixos, empresa, empresasAtivas, ofertasDeParticipacao, processarEmpresas, valorDaParte } from '../sistemas/empresas';
import { aplicarPerda, escala, indicadores, pesoDaPerda, processarFortuna129, venderBens } from '../sistemas/fortuna129';
import { creditoLivre, decidirEmpresa129, disponibilidadeEmpresa129, efeitosDaEmpresa, fundarEmpresa, ofertasDeAquisicao, painelDaEmpresa, planoDeFundacao } from '../sistemas/empresas129';
import { valoresDeAposta } from '../sistemas/apostas';
import { formatarDinheiroCurto } from '../mundo/moeda';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { dinheiro as efeitoDinheiro, perdaDasBets } from '../conteudo/efeitos';
import { interpretar } from '../save';
import type { Empresa, Imovel, Vida } from '../tipos';
import type { Decisao } from '../conteudo/base';

let BASE: Vida;
beforeAll(() => { BASE = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 }); });

function pessoa(conta: number, o: { aplicado?: number; imovel?: number } = {}): Vida {
  const v = structuredClone(BASE);
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.financas.bens = [];
  v.financas.colecao = [];
  v.financas.empresas = [];
  v.financas.investimentos = o.aplicado ? [{ id: 'apl_acoes', produto: 'acoes', aportado: o.aplicado, valor: o.aplicado, tInicio: v.t, historico: [] }] : [];
  if (o.imovel) v.financas.bens.push({ id: 'imo1', tipo: 'imovel', modeloId: 'apto_3q', nome: 'apartamento de investimento', valor: o.imovel, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 } as Imovel);
  v.anoAtual = { acoes: [] };
  return v;
}
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; } return v; };
const corp = (v: Vida) => (v.financas.empresas ?? []).find(e => !!e.corp)!;


describe('12.9 · a escala do patrimônio', () => {
  it('a liquidez tem uma fonte só (e a herança em tutela não entra)', () => {
    const v = pessoa(10_000, { aplicado: 90_000 });
    v.financas.investimentos.push({ id: 'apl_reserva', produto: 'reserva', aportado: 5000, valor: 5000, tInicio: v.t, historico: [] });
    v.financas.investimentos.push({ id: 'apl_inflacao', produto: 'inflacao', aportado: 50_000, valor: 50_000, tInicio: v.t, historico: [], tutelaAte: v.t + 60 });
    const l = liquidez(v);
    expect(l.imediata).toBe(15_000);
    expect(l.mobilizavel).toBe(105_000);
    expect(liquidezImediata(v)).toBe(l.imediata);
    expect(disponivel(v)).toBe(l.mobilizavel);
    expect(condicaoEconomica(v).liquidez).toBe(l.mobilizavel);
  });

  it('imóvel e empresa não são dinheiro disponível; o rico em bens pode ter liquidez curta', () => {
    const v = pessoa(2000, { imovel: 8_000_000 });
    const x = indicadores(v);
    expect(x.liquidez).toBe(2000);
    expect(x.bruto).toBeGreaterThanOrEqual(8_000_000);
    expect(x.iliquida).toBe(true);
    expect(x.liquido).toBe(x.bruto - x.dividas);
  });

  it('as faixas vão do aperto ao bilionário, e R$ 100 bi cabem na tela', () => {
    expect(escala(pessoa(0))).toBe('pobreza');
    expect(escala(pessoa(3_000_000))).toBe('milionaria');
    expect(escala(pessoa(90_000_000))).toBe('multimilionaria');
    expect(escala(pessoa(100e9))).toBe('bilionaria');
    expect(formatarDinheiroCurto(100e9, 'BR')).toBe('R$ 100,0 bi');
    expect(Number.isFinite(indicadores(pessoa(100e9)).liquido)).toBe(true);
  });

  it('o peso de uma perda depende de quem perde (e um bilhão pesa para qualquer um)', () => {
    expect(pesoDaPerda(pessoa(20e6), 10e6).nivel).toBe('devastadora');
    expect(pesoDaPerda(pessoa(500e6), 10e6).nivel).toBe('pesa');
    expect(pesoDaPerda(pessoa(10e9), 10e6).nivel).toBe('trocado');
    expect(pesoDaPerda(pessoa(10e9), 2e9).nivel).toBe('grave');
    expect(pesoDaPerda(pessoa(200e9), 2e9).nivel).toBe('pesa');
  });
});

describe('12.9 · perdas que acontecem', () => {
  it('EXPLOIT corrigido: a perda de um acontecimento sai das aplicações quando a conta está vazia', () => {
    const v = pessoa(0, { aplicado: 1_000_000 });
    efeitoDinheiro(contexto(v, criarRng(1)), -300_000);
    expect(liquidez(v).mobilizavel).toBe(700_000);
    expect(v.financas.conta).toBeGreaterThanOrEqual(0);
    // E o que não existe continua não se perdendo (o assalto não cria dívida do nada).
    const p = pessoa(0);
    efeitoDinheiro(contexto(p, criarRng(1)), -1500);
    expect(p.financas.conta).toBe(0);
    expect(p.financas.dividas).toHaveLength(0);
  });

  it('a perda grande vende bens (sem tocar na casa onde se mora) e, faltando, vira dívida', () => {
    const v = pessoa(100_000, { imovel: 2_000_000 });
    const antes = balanco(v).liquido;
    const r = aplicarPerda(v, 3_000_000, 'o processo', { vender: true, endividar: true });
    expect(r.vendido.length).toBeGreaterThan(0);
    expect(v.financas.bens.some(b => b.id === 'imo1')).toBe(false);
    expect(r.divida).toBeGreaterThan(0);
    expect(v.financas.dividas.some(d => /o processo/.test(d.descricao))).toBe(true);
    // O patrimônio cai pelo valor da perda (e um pouco mais: a venda às pressas tem desconto).
    const depois = balanco(v).liquido;
    expect(antes - depois).toBeGreaterThanOrEqual(3_000_000);
    expect(antes - depois).toBeLessThan(3_000_000 + 2_000_000 * 0.15);
  });

  it('o rombo grande do ano vende bens antes de ir para o cartão', () => {
    const v = pessoa(-1_500_000, { imovel: 3_000_000 });
    const w = transacao(v, (x, r) => processarDinheiro(x, r)).vida;
    expect(w.financas.bens.some(b => b.id === 'imo1')).toBe(false);
    expect(w.financas.conta).toBeGreaterThanOrEqual(0);
    expect(w.financas.dividas.find(d => d.tipo === 'cartao')?.saldo ?? 0).toBe(0);
  });

  it('as apostas: o número do texto é o aplicado, e a perda é real (com dívida se faltar)', () => {
    const v = pessoa(5000);
    v.fatos['aposta_online'] = v.t - 24;
    const cena = conteudoPorId('hab_bets_fundo') as Decisao;
    const ctx = contexto(v, criarRng(2));
    const valor = perdaDasBets(ctx);
    expect(cena.texto(ctx)).toContain(formatarDinheiroCurto(valor, 'BR', 'auto').replace(/^R\$ /, '').split(' ')[0]);
    const antes = balanco(v).liquido;
    cena.opcoes.find(o => o.id === 'recuperar')!.resolver(ctx).efeito!(ctx);
    expect(balanco(v).liquido).toBeLessThan(antes - valor);
    expect(v.financas.dividas.some(d => /apostas/.test(d.descricao))).toBe(true);
    // O rico perde mais (mas não a fortuna inteira pelo celular).
    const rico = pessoa(50_000_000);
    rico.fatos['aposta_online'] = v.fatos['aposta_online'];
    const vRico = perdaDasBets(contexto(rico, criarRng(2)));
    expect(vRico).toBeGreaterThan(valor);
    expect(vRico).toBeLessThan(50_000_000 * 0.05);
  });

  it('a mesa alta: as fichas crescem com o que há na conta', () => {
    expect(Math.max(...valoresDeAposta(pessoa(3000)))).toBeLessThan(2000);
    expect(Math.max(...valoresDeAposta(pessoa(10_000_000)))).toBeGreaterThanOrEqual(500_000);
    expect(Math.max(...valoresDeAposta(pessoa(500_000_000)))).toBeGreaterThanOrEqual(10_000_000);
  });

  it('a insolvência: bens vendidos, dívida renegociada com desconto, nome sujo — e a volta por cima anos depois', () => {
    const v = pessoa(0, { imovel: 300_000 });
    v.financas.dividas.push({ id: 'dx', tipo: 'emprestimo', saldo: 2_000_000, jurosMes: 0.03, parcela: 60_000, descricao: 'Empréstimo grande', tInicio: v.t - 24, prazo: 60, atraso: 8, atrasoDesde: v.t - 8 });
    processarFortuna129(v);
    expect(v.fatos['insolvencia_129']).toBe(v.t);
    expect(v.financas.negativado).toBe(true);
    const plano = v.financas.dividas.find(d => /insolvência/.test(d.descricao))!;
    expect(plano.saldo).toBeLessThan(2_000_000);
    expect(v.financas.bens.some(b => b.id === 'imo1')).toBe(false);
    v.financas.dividas = [];
    v.financas.conta = 900_000;
    v.t += 48;
    processarFortuna129(v);
    expect(v.fatos['reergueu_129']).toBeDefined();
  });

  it('as cenas de cada faixa só aparecem para quem vive aquela faixa', () => {
    const pobre = pessoa(0);
    const bi = pessoa(5e9);
    const g = conteudoPorId('eco129_pob_geladeira')!;
    const f = conteudoPorId('eco129_bi_filantropia')!;
    expect(preparar(g, pobre, criarRng(1))).not.toBeNull();
    expect(preparar(g, bi, criarRng(1))).toBeNull();
    expect(preparar(f, bi, criarRng(1))).not.toBeNull();
    expect(preparar(f, pobre, criarRng(1))).toBeNull();
  });
});

describe('12.9 · as empresas', () => {
  it('BUG corrigido: comprar uma participação não perde 20% na primeira reavaliação', () => {
    const v = pessoa(30_000_000);
    const o = ofertasDeParticipacao(v)[0];
    expect(o).toBeDefined();
    comprarParticipacao(v, o.id);
    const e = empresasAtivas(v)[0];
    expect(Math.abs(valorDaParte(e) - o.preco) / o.preco).toBeLessThan(0.02);
  });

  it('as alavancas da pequena: o padrão não muda nada; a campanha traz procura e custa', () => {
    let v = pessoa(30_000_000);
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    const e = empresasAtivas(v)[0];
    e.estado = 'operando';
    const base = contasDoAno(v, e, criarRng(5));
    e.estrategia = { alavancas: {} };
    expect(contasDoAno(v, e, criarRng(5)).receita).toBe(base.receita);
    e.estrategia.alavancas.marketing = 'forte';
    const forte = contasDoAno(v, e, criarRng(5));
    expect(forte.receita).toBeGreaterThan(base.receita);
    expect(custosFixos(v, e).some(x => /Campanha/.test(x.rotulo))).toBe(true);
  });

  it('a rede pede diretoria: a quinta unidade só com diretoria de operações', () => {
    let v = pessoa(80_000_000);
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
    const e = empresasAtivas(v)[0];
    e.estado = 'operando';
    e.unidades = 4;
    expect(pode(v, { tipo: 'empresa', empresaId: e.id, decisao: 'expandir' })).toBe(false);
    v = fazer(v, { tipo: 'empresa129', empresaId: e.id, oque: 'executivo', alvo: 'coo:eficiencia' });
    expect(pode(v, { tipo: 'empresa', empresaId: e.id, decisao: 'expandir' })).toBe(true);
  });

  it('o produto novo da pequena: fica pronto, é recebido pelo público e mexe na procura', () => {
    let v = pessoa(30_000_000);
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    const id = empresasAtivas(v)[0].id;
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'projeto', alvo: 'online' });
    v = anos(v, 1);
    const p = empresa(v, id)!.projetos![0];
    expect(p.estado).toBe('ativo');
    expect(p.aceitacao).toBeGreaterThan(0);
    expect(painelDaEmpresa(v, empresa(v, id)!).serie.length).toBeGreaterThan(0);
  });

  it('fundar uma montadora: o capital sai do bolso, a exposição sobe, e nada se vende até a fábrica e o modelo ficarem prontos', () => {
    let v = pessoa(8e9);
    const plano = planoDeFundacao(v, 'montadora', 'eletrico', false);
    v = fazer(v, { tipo: 'fundar129', setor: 'montadora', item: 'eletrico', comSocio: false });
    expect(v.financas.conta).toBeLessThanOrEqual(8e9 - plano.capitalDaPessoa + 1);
    const e = corp(v);
    expect(e.investido).toBe(plano.capitalDaPessoa);
    expect(indicadores(v).exposicao.investido).toBe(plano.capitalDaPessoa);
    v = anos(v, 2);
    expect(corp(v).ultimo!.receita).toBe(0);
    // O modelo leva uns quatro anos (e pode atrasar): quando fica pronto, com a fábrica pronta, vende.
    let k = 0;
    while (corp(v).corp!.projetos[0].estado === 'desenvolvimento' && k++ < 10) v = anos(v, 1);
    if (corp(v).corp!.projetos[0].estado === 'ativo') { v = anos(v, 1); expect(corp(v).ultimo!.receita).toBeGreaterThan(0); }
    else expect(corp(v).corp!.projetos[0].estado).toBe('fracassado');
    // A dívida da empresa não é dívida sua.
    expect(v.financas.dividas.some(d => /montadora|Motores|Automóveis/i.test(d.descricao))).toBe(false);
  });

  it('quem não tem dinheiro não funda o que é bilionário; quem tem, funda', () => {
    expect(pode(pessoa(50_000_000), { tipo: 'fundar129', setor: 'aeroespacial', item: 'lancador_leve', comSocio: false })).toBe(false);
    expect(pode(pessoa(20e9), { tipo: 'fundar129', setor: 'aeroespacial', item: 'lancador_leve', comSocio: false })).toBe(true);
    expect(pode(pessoa(20e9), { tipo: 'fundar129', setor: 'aeroespacial', item: 'capsula', comSocio: false })).toBe(false);
  });

  it('o rigor de testes do foguete: menos tropeços, mais devagar', () => {
    const tropecos = (testes: string) => {
      let total = 0;
      for (let s = 0; s < 12; s++) {
        let v = pessoa(30e9);
        v.id = `foguete-${s}`;
        fundarEmpresa(v, 'aeroespacial', 'lancador_leve', false);
        corp(v).estrategia = { alavancas: { testes } };
        corp(v).caixa = 20e9;
        v = anos(v, 4);
        total += corp(v).corp!.projetos.reduce((t, p) => t + (p.marcos ?? []).filter(m => m.acaso).length, 0);
      }
      return total;
    };
    expect(tropecos('rigoroso')).toBeLessThan(tropecos('rapido'));
  });

  it('a diretoria: a financeira de finanças baixa os juros; o perfil fora do lugar desperdiça', () => {
    let v = pessoa(10e9);
    v = fazer(v, { tipo: 'fundar129', setor: 'banco', item: 'empresas', comSocio: false });
    const e = corp(v);
    const base = efeitosDaEmpresa(v, e);
    e.executivos = [{ cargo: 'cfo', nome: 'X', perfil: 'financas', competencia: 80, salario: 100_000, t: v.t }];
    expect(efeitosDaEmpresa(v, e).juros).toBeLessThan(base.juros);
    e.executivos = [{ cargo: 'cfo', nome: 'X', perfil: 'inovador', competencia: 80, salario: 100_000, t: v.t }];
    expect(efeitosDaEmpresa(v, e).fixo).toBeGreaterThan(base.fixo);
  });

  it('a gestão delegada decide (e respeita o que o dono acabou de mudar); sem delegar, nada muda sozinho', () => {
    let v = pessoa(10e9);
    v = fazer(v, { tipo: 'fundar129', setor: 'industria', item: 'alimentos', comSocio: false });
    const id = corp(v).id;
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'alavanca', alvo: 'marketing:minimo' });
    v = anos(v, 1);
    expect(empresa(v, id)!.estrategia!.alavancas.marketing).toBe('minimo');
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'delegar', alvo: 'nao' });
    const antes = JSON.stringify(empresa(v, id)!.estrategia!.alavancas);
    v = anos(v, 3);
    expect(JSON.stringify(empresa(v, id)!.estrategia!.alavancas)).toBe(antes);
  });

  it('a empresa sem caixa pede dinheiro; sem resposta, recuperação judicial e depois falência — a perda é o que se pôs', () => {
    let v = pessoa(10e9);
    v = fazer(v, { tipo: 'fundar129', setor: 'aerea', item: 'tronco', comSocio: false });
    const id = corp(v).id;
    const investido = corp(v).investido;
    const e = corp(v);
    e.caixa = -5e9;
    e.corp!.divida = 1e10;
    v = anos(v, 1);
    expect(empresa(v, id)!.corp!.pedido).toBeDefined();
    v = anos(v, 1);
    expect(empresa(v, id)!.corp!.recuperacao).toBeDefined();
    v = anos(v, 2);
    expect(empresa(v, id)!.estado).toBe('encerrada');
    expect(investido).toBeGreaterThan(0);
    // S.A. grande: a dívida dela não vira dívida pessoal.
    expect(v.financas.dividas.some(d => /Aval/.test(d.descricao))).toBe(false);
  });

  it('comprar uma empresa grande: o preço é o valor (mais as taxas), e ela já vende', () => {
    let v = pessoa(15e9);
    const o = ofertasDeAquisicao(v).find(x => x.partes.includes(1))!; // (VIDA 14: o valor justo mudou o porte das ofertas: escolhe uma que se compra inteira)
    expect(o).toBeDefined();
    v = fazer(v, { tipo: 'adquirir129', ofertaId: o.id, parte: 1 });
    const e = corp(v);
    expect(Math.abs((e.avaliacao ?? 0) - o.preco) / o.preco).toBeLessThan(0.01);
    v = anos(v, 1);
    expect(corp(v).ultimo!.receita).toBeGreaterThan(0);
  });

  it('a montadora investe numa linha elétrica, acompanha a aceitação e decide ampliar ou rever', () => {
    let v = pessoa(30e9);
    v = fazer(v, { tipo: 'fundar129', setor: 'montadora', item: 'suv_premium', comSocio: false });
    const id = corp(v).id;
    const e = corp(v);
    e.corp!.obras = [];
    e.corp!.capacidade = 2;
    e.caixa += 15e9;
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'projeto', alvo: 'eletrico_premium' });
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'alavanca', alvo: 'preco:premium' });
    v.anoAtual.acoes = [];
    v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'alavanca', alvo: 'marketing:forte' });
    v = anos(v, 4);
    let k = 0;
    while (empresa(v, id)!.corp!.projetos.find(p => p.item === 'eletrico_premium')!.estado === 'desenvolvimento' && k++ < 10) v = anos(v, 1);
    const eletrico = empresa(v, id)!.corp!.projetos.find(p => p.item === 'eletrico_premium')!;
    expect(empresa(v, id)!.estado).not.toBe('encerrada');
    expect(['ativo', 'fracassado']).toContain(eletrico.estado);
    // O painel explica o ano (com o que foi acaso e o que foi escolha).
    expect(painelDaEmpresa(v, empresa(v, id)!).causas.length).toBeGreaterThan(0);
    if (eletrico.estado === 'ativo') {
      expect(eletrico.aceitacao).toBeGreaterThan(0);
      const d = disponibilidadeEmpresa129(v, empresa(v, id), 'ampliar', eletrico.id);
      expect(typeof d.ok).toBe('boolean');
      expect(decidirEmpresa129(v, empresa(v, id)!, 'descontinuar', eletrico.id)).toMatch(/linha/);
    }
  });

  it('exploits: fundar e vender na hora não dá lucro; captar dívida não vira dinheiro pessoal', () => {
    let v = pessoa(5e9);
    const antes = balanco(v).liquido;
    v = fazer(v, { tipo: 'fundar129', setor: 'energia', item: 'solar', comSocio: false });
    const id = corp(v).id;
    // O crédito tomado vai para o caixa DA EMPRESA (e a dívida é dela): a sua conta não muda.
    const contaAntes = v.financas.conta;
    const caixaAntes = corp(v).caixa;
    if (pode(v, { tipo: 'empresa129', empresaId: id, oque: 'captar' })) {
      v = fazer(v, { tipo: 'empresa129', empresaId: id, oque: 'captar' });
      expect(v.financas.conta).toBe(contaAntes);
      expect(corp(v).caixa).toBeGreaterThan(caixaAntes);
      expect(corp(v).corp!.divida).toBeGreaterThan(0);
    }
    expect(creditoLivre(v, corp(v))).toBeGreaterThanOrEqual(0);
    const conta = v.financas.conta;
    v = fazer(v, { tipo: 'empresa', empresaId: id, decisao: 'vender' });
    expect(v.financas.conta - conta).toBeLessThanOrEqual(planoDeFundacao(pessoa(5e9), 'energia', 'solar', false).capital);
    expect(balanco(v).liquido).toBeLessThanOrEqual(antes);
  });

  it('saves antigos: a empresa de antes continua (sem estratégia = o padrão) e a grande sobrevive ao ida-e-volta', () => {
    let v = pessoa(10e9);
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'hotel', comSocio: false });
    v.anoAtual.acoes = [];
    v = fazer(v, { tipo: 'fundar129', setor: 'tecnologia', item: 'saas', comSocio: false });
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    const w = (r as { vida: Vida }).vida;
    const hotel = empresasAtivas(w).find(e => e.tipo === 'hotel') as Empresa;
    expect(hotel.estrategia).toBeUndefined();
    expect(corp(w).corp!.projetos.length).toBe(1);
    const x = anos(w, 2);
    expect(empresasAtivas(x).length).toBe(2);
  });

  it('o tempo longo: um bilionário com empresas delegadas por 25 anos — números finitos e indicadores consistentes', () => {
    let v = pessoa(20e9);
    v = fazer(v, { tipo: 'fundar129', setor: 'montadora', item: 'popular', comSocio: false });
    v.anoAtual.acoes = [];
    const o = ofertasDeAquisicao(v)[0];
    if (o) v = fazer(v, { tipo: 'adquirir129', ofertaId: o.id, parte: o.partes[0] });
    for (let k = 0; k < 25; k++) {
      v = anos(v, 1);
      const x = indicadores(v);
      expect(Number.isFinite(x.liquido)).toBe(true);
      expect(x.liquido).toBe(x.bruto - x.dividas);
      for (const e of v.financas.empresas ?? []) { expect(Number.isFinite(e.caixa)).toBe(true); expect(e.avaliacao ?? 0).toBeGreaterThanOrEqual(0); }
    }
  });

  it('vender bens no aperto nunca vende a casa nem a peça de família', () => {
    const v = pessoa(0);
    v.financas.bens.push({ id: 'casa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900_000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 } as Imovel);
    v.moradia.imovelId = 'casa';
    v.financas.colecao = [{ id: 'c1', pecaId: 'x', nome: 'o relógio do avô', categoria: 'relogio', raridade: 'rara', procedencia: 'herdada', certificado: true, estado: 90, valor: 300_000, precoPago: 0, tCompra: v.t, afeto: 'do avô', deFamilia: true }];
    expect(venderBens(v, 1_000_000, 'um teste')).toHaveLength(0);
    expect(v.financas.bens).toHaveLength(1);
    expect(v.financas.colecao).toHaveLength(1);
  });
});
