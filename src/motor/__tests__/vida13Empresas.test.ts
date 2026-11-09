/**
 * VIDA 13 · Empresas — produtos e linhas por ramo (lançar, nova linha, expandir, versão nova, qualidade, reposicionar,
 * preço, descontinuar) com efeito nas contas; o registro de cada decisão (custo, o que mudou, o que aconteceu); os nomes
 * gerados (variedade, unicidade, o bug "Fortaleza Industrial comprou a concorrente Fortaleza Industrial"); saves antigos.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { transacao } from '../nucleo';
import { rngDe } from '../rng';
import { processarEmpresas, abrirEmpresa, ofertasDeParticipacao } from '../sistemas/empresas';
import { catalogoDeProdutos13, catalogoPequeno13, decisoesRecentes13, decidirEmpresa129, fundarEmpresa, leituraDaLinha13, ofertasDeAquisicao, projetosPossiveis } from '../sistemas/empresas129';
import { fatorDaLinha13, nomeDeEmpresa13, nomesConfundem13, normalizarVida13Empresas } from '../sistemas/empresas13';
import { PRODUTOS_13, PRODUTOS_PEQUENOS_13, produtoPadrao13 } from '../dados/produtos13';
import { SETORES_GRANDES, setorGrande } from '../dados/empresas129';
import { interpretar } from '../save';
import type { Empresa, TipoEmpresa, Vida } from '../tipos';

let BASE: Vida;
beforeAll(() => { BASE = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 }); });

function pessoa(conta: number): Vida {
  const v = structuredClone(BASE);
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.financas.bens = [];
  v.financas.colecao = [];
  v.financas.empresas = [];
  v.financas.investimentos = [];
  v.anoAtual = { acoes: [] };
  return v;
}
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; } return v; };
const corp = (v: Vida) => (v.financas.empresas ?? []).find(e => !!e.corp)!;
const e129 = (e: Empresa, oque: Extract<Acao, { tipo: 'empresa129' }>['oque'], alvo?: string): Acao => ({ tipo: 'empresa129', empresaId: e.id, oque, ...(alvo !== undefined ? { alvo } : {}) });

/** Uma indústria pronta (a linha inicial já à venda, uma linha livre, caixa folgado) para comparar escolhas. */
function industriaPronta(semente = 41): Vida {
  let v = pessoa(2e9);
  v.id = `vida-${semente}`;
  fundarEmpresa(v, 'industria', 'biscoitos', false);
  const e = corp(v);
  e.estrategia!.delegar = false;
  v = anos(v, 2);
  // (VIDA 14: o crédito sai do valor justo — numa ou noutra semente, a primeira linha leva um ano a mais.)
  for (let k = 0; k < 3 && corp(v).estado === 'abrindo'; k++) v = anos(v, 1);
  const x = corp(v);
  x.caixa = 400e6;
  x.corp!.capacidade += 1;
  return v;
}

describe('13 · produtos por ramo', () => {
  it('todo ramo grande tem produtos de verdade (e os pedidos pelo usuário existem)', () => {
    for (const s of SETORES_GRANDES) {
      const ps = PRODUTOS_13.filter(p => p.setor === s.id);
      expect(ps.length, s.id).toBeGreaterThanOrEqual(8);
      // Cada item do ramo tem um produto de nascença (neutro: não sobrepõe nada) e ids não colidem com os dos itens.
      for (const it of s.itens) {
        const pad = produtoPadrao13(s.id, it.id)!;
        expect(pad, `${s.id}/${it.id}`).toBeTruthy();
        expect([pad.capex, pad.receita, pad.margem, pad.meses, pad.usa, pad.risco].every(x => x === undefined)).toBe(true);
        expect(pad.cresc).toBe(0);
      }
      const ids = ps.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.some(id => s.itens.some(i => i.id === id))).toBe(false);
    }
    const nomes = (setor: string) => PRODUTOS_13.filter(p => p.setor === setor).map(p => p.nome.toLowerCase()).join(' | ');
    for (const x of ['salgadinhos', 'cereais', 'biscoitos', 'bolachas', 'refrigerantes', 'massas', 'chocolates']) expect(nomes('industria')).toContain(x);
    for (const x of ['suv', 'sedã', 'esportivo', 'elétrico', 'utilitário', 'moto']) expect(nomes('montadora')).toContain(x);
    for (const x of ['smartphone', 'computadores', 'sistema operacional', 'software', 'hardware especializado']) expect(nomes('tecnologia')).toContain(x);
    for (const x of ['satélites', 'lançador', 'foguete', 'sonda', 'cápsula']) expect(nomes('aeroespacial')).toContain(x);
    const rest = PRODUTOS_PEQUENOS_13.filter(p => p.tipo === 'restaurante').map(p => p.nome.toLowerCase()).join(' | ');
    for (const x of ['brunch', 'executivo', 'degustação', 'rodízio']) expect(rest).toContain(x);
    for (const t of ['restaurante', 'clinica', 'academia', 'estudio', 'hotel', 'loja']) expect(PRODUTOS_PEQUENOS_13.filter(p => p.tipo === t).length, t).toBeGreaterThanOrEqual(4);
  });

  it('a ficha de cada produto traz investimento, prazo, capacidade, custos, demanda, concorrência, preço, margem, público, posicionamento, risco e potencial', () => {
    const v = industriaPronta();
    const cat = catalogoDeProdutos13(v, corp(v));
    expect(cat.length).toBeGreaterThanOrEqual(4);
    const sal = cat.flatMap(g => g.produtos).find(p => p.id === 'salgadinhos')!;
    for (const k of ['investimento', 'meses', 'capacidade', 'custoAnual', 'faturamento', 'margem', 'mercado'] as const) expect(sal[k]).toBeGreaterThan(0);
    for (const k of ['concorrencia', 'preco', 'publico', 'posicionamento', 'risco', 'potencial'] as const) expect(sal[k].length).toBeGreaterThan(3);
    expect(sal.rivais.length).toBeGreaterThan(0);
    expect(projetosPossiveis(v, corp(v)).some(p => p.id === 'chocolates' && p.familia === 'Alimentos e bebidas')).toBe(true);
  });

  it('lançar com a capacidade livre e "nova linha de produção" para um produto (a capacidade que falta + o projeto)', () => {
    let v = industriaPronta();
    const e = corp(v);
    v = fazer(v, e129(e, 'projeto', 'salgadinhos'));
    let x = corp(v);
    const sal = x.corp!.projetos.find(p => p.produto === 'salgadinhos')!;
    expect(sal.estado).toBe('desenvolvimento');
    expect(sal.nome.startsWith('Salgadinho ')).toBe(true);
    // Sem capacidade livre, "projeto" diz o motivo e "linha" resolve.
    expect(pode(v, e129(x, 'projeto', 'chocolates'))).toBe(false);
    expect(disponibilidade(v, e129(x, 'projeto', 'chocolates')).motivo).toMatch(/linha de produção/);
    const capAntes = x.corp!.capacidade;
    const obrasAntes = (x.corp!.obras ?? []).reduce((t, o) => t + o.quanto, 0);
    v = fazer(v, e129(x, 'linha', 'chocolates'));
    x = corp(v);
    expect((x.corp!.obras ?? []).reduce((t, o) => t + o.quanto, 0)).toBe(obrasAntes + 1);
    expect(x.corp!.capacidade).toBe(capAntes);
    const choc = x.corp!.projetos.find(p => p.produto === 'chocolates')!;
    expect(choc.meses).toBeGreaterThanOrEqual(setorGrande('industria')!.mesesCapacidade);
    // O que foi decidido fica registrado: o custo, de onde saiu, o que mudou.
    const d = decisoesRecentes13(v, x)[0];
    expect(d.titulo).toMatch(/chocolates/i);
    expect(d.custo).toBeGreaterThan(0);
    expect(d.mudou.join(' ')).toMatch(/Em obra/);
    expect(d.pago!.caixa + d.pago!.credito + d.pago!.conta).toBeGreaterThan(0);
    // Dois anos depois, a capacidade nova está pronta — e o registro diz o que aconteceu.
    v = anos(v, 2);
    x = corp(v);
    // O salgadinho já vende; o chocolate (com a linha nova) anda — e pode ter tropeçado (o atraso é acaso do ramo).
    expect(x.corp!.projetos.find(p => p.produto === 'salgadinhos')!.estado).toBe('ativo');
    expect(x.corp!.capacidade).toBe(capAntes + 1);
    const ch = x.corp!.projetos.find(p => p.produto === 'chocolates')!;
    expect(ch.estado === 'ativo' || ch.feitos >= 20).toBe(true);
    expect(x.decisoes13!.every(dd => !!dd.ocorreu)).toBe(true);
  });

  it('escolhas diferentes dão resultados diferentes e plausíveis (salgadinhos × massas × fertilizantes)', () => {
    const resultado: Record<string, { receita: number; lucro: number }> = {};
    for (const prod of ['salgadinhos', 'massas', 'farmoquimicos']) {
      let v = industriaPronta();
      const e = corp(v);
      if (prod === 'farmoquimicos') e.corp!.capacidade += 1;
      v = fazer(v, e129(e, 'projeto', prod));
      v = anos(v, 5);
      const p = corp(v).corp!.projetos.find(x => x.produto === prod)!;
      expect(p.estado).toBe('ativo');
      resultado[prod] = { receita: p.receitaAno!, lucro: corp(v).ultimo!.resultado };
      const ficha = PRODUTOS_13.find(x => x.id === prod)!;
      // Plausível: perto do faturamento de catálogo (entre um terço e o dobro).
      expect(p.receitaAno!).toBeGreaterThan((ficha.receita ?? 0) * 0.33);
      expect(p.receitaAno!).toBeLessThan((ficha.receita ?? 0) * 2.2);
    }
    expect(resultado.salgadinhos.receita).not.toBe(resultado.massas.receita);
    expect(resultado.farmoquimicos.receita).toBeGreaterThan(resultado.salgadinhos.receita);
  });

  it('preço, posicionamento, qualidade e versão nova mexem nas contas (e cada um tem o seu custo)', () => {
    const rodar = (mexer: (v: Vida, e: Empresa, pid: string) => Vida) => {
      let v = industriaPronta(7);
      const e = corp(v);
      const pid = e.corp!.projetos.find(p => p.estado === 'ativo')!.id;
      v = mexer(v, e, pid);
      v = anos(v, 1);
      const x = corp(v);
      const p = x.corp!.projetos.find(y => y.id === pid)!;
      return { receita: p.receitaAno!, reputacao: x.reputacao, lucro: x.ultimo!.resultado, p, v, x };
    };
    const base = rodar(v => v);
    const caro = rodar((v, e, pid) => fazer(v, e129(e, 'preco', `${pid}:+`)));
    const barato = rodar((v, e, pid) => fazer(v, e129(e, 'preco', `${pid}:-`)));
    expect(caro.p.linha!.preco).toBeCloseTo(0.1);
    // Biscoito é sensível a preço: mais caro vende menos em faturamento; mais barato vende mais.
    expect(caro.receita).toBeLessThan(base.receita);
    expect(barato.receita).toBeGreaterThan(base.receita);
    const premium = rodar((v, e, pid) => fazer(v, e129(e, 'reposicionar', `${pid}:intermediario`)));
    expect(premium.p.linha!.pos).toBe('intermediario');
    expect(premium.receita).not.toBe(base.receita);
    const qual = rodar((v, e, pid) => fazer(v, e129(e, 'qualidade', pid)));
    expect(qual.p.linha!.qualidade).toBe(1);
    expect(qual.reputacao).toBeGreaterThanOrEqual(base.reputacao);
    // Um salto de dois degraus de uma vez não é permitido (o motivo é dito).
    const v0 = industriaPronta(7);
    const pid0 = corp(v0).corp!.projetos.find(p => p.estado === 'ativo')!.id;
    expect(disponibilidade(v0, e129(corp(v0), 'reposicionar', `${pid0}:premium`)).motivo).toMatch(/degrau/);
    // O preço não muda duas vezes no mesmo ano.
    const v1 = fazer(v0, e129(corp(v0), 'preco', `${pid0}:+`));
    expect(disponibilidade(v1, e129(corp(v1), 'preco', `${pid0}:+`)).motivo).toMatch(/por ano/);
  });

  it('a linha envelhece sem versão nova; a versão nova recomeça o relógio', () => {
    let v = industriaPronta(9);
    const e = corp(v);
    const p = e.corp!.projetos.find(x => x.estado === 'ativo')!;
    // Um salgadinho lançado há dez anos (ciclo de seis).
    p.produto = 'salgadinhos';
    p.tLanc = v.t - 120;
    const s = setorGrande('industria')!;
    const velho = fatorDaLinha13(v, e, s, p).envelhece;
    expect(velho).toBeLessThan(0.9);
    v = fazer(v, e129(e, 'melhorar', p.id));
    const x = corp(v).corp!.projetos.find(y => y.id === p.id)!;
    expect(x.linha!.versao).toBe(1);
    expect(fatorDaLinha13(v, corp(v), s, x).envelhece).toBe(1);
    expect(leituraDaLinha13(v, corp(v), x)!.versao).toBe(2);
  });

  it('descontinuar libera a capacidade e a receita da linha acaba', () => {
    let v = industriaPronta(11);
    const e = corp(v);
    const p = e.corp!.projetos.find(x => x.estado === 'ativo')!;
    v = fazer(v, e129(e, 'descontinuar', p.id));
    expect(corp(v).corp!.projetos.find(x => x.id === p.id)!.estado).toBe('descontinuado');
    expect(pode(v, e129(corp(v), 'projeto', 'cereais'))).toBe(true);
  });

  it('a empresa pequena lança produtos do próprio tipo (o brunch, o menu executivo), com efeito na procura', () => {
    const v = pessoa(3e6);
    abrirEmpresa(v, 'restaurante', false);
    const e = v.financas.empresas![0];
    const cat = catalogoPequeno13(v, e);
    expect(cat.map(x => x.id)).toContain('brunch');
    let w = fazer(v, e129(e, 'projeto', 'executivo'));
    expect(pode(w, e129(w.financas.empresas![0], 'projeto', 'executivo'))).toBe(false);
    w = fazer(w, e129(w.financas.empresas![0], 'projeto', 'brunch'));
    const pj = w.financas.empresas![0].projetos!;
    expect(pj.map(p => p.produto)).toEqual(['executivo', 'brunch']);
    expect(pj[0].nome).toMatch(/executivo/i);
  });

  it('a economia não explode: 20 anos de uma montadora e de uma indústria delegadas ficam em ordens de grandeza plausíveis', () => {
    for (const [setor, item] of [['industria', 'biscoitos'], ['montadora', 'hatch'], ['tecnologia', 'erp']] as [TipoEmpresa, string][]) {
      let v = pessoa(60e9);
      fundarEmpresa(v, setor, item, false);
      v = anos(v, 20);
      const e = (v.financas.empresas ?? [])[0];
      const s = setorGrande(setor)!;
      const receita = e.ultimo?.receita ?? 0;
      expect(receita, setor).toBeLessThan(s.mercado * 0.5);
      expect(Number.isFinite(e.avaliacao ?? 0)).toBe(true);
    }
  });
});

describe('13 · nomes', () => {
  it('reconhece o igual, o quase igual e o confuso', () => {
    expect(nomesConfundem13('Fortaleza Industrial', 'Fortaleza Industrial')).toBe(true);
    expect(nomesConfundem13('Fortaleza Industrial', 'Fortaleza Alimentos')).toBe(true);
    expect(nomesConfundem13('Banco Meridiano', 'Meridiano Investimentos')).toBe(true);
    expect(nomesConfundem13('Grupo Safira', 'Safira S.A.')).toBe(true);
    expect(nomesConfundem13('Prumo Construções', 'Prumos Engenharia')).toBe(true);
    expect(nomesConfundem13('Prumo Construções', 'Alicerce Engenharia')).toBe(false);
    expect(nomesConfundem13('Vale Verde Alimentos', 'Campo Dourado Industrial')).toBe(false);
  });

  it('gera muitos nomes por ramo e porte, sem repetir nem confundir no mesmo contexto', () => {
    for (const tipo of ['industria', 'montadora', 'banco', 'tecnologia', 'aeroespacial', 'restaurante', 'loja'] as TipoEmpresa[]) {
      const r = rngDe('nomes13', tipo);
      const usados: string[] = [];
      for (let k = 0; k < 60; k++) usados.push(nomeDeEmpresa13(r, tipo, tipo === 'restaurante' || tipo === 'loja' ? 'pequeno' : 'grande', usados));
      for (let i = 0; i < usados.length; i++) for (let j = i + 1; j < usados.length; j++) expect(nomesConfundem13(usados[i], usados[j]), `${usados[i]} × ${usados[j]}`).toBe(false);
    }
    // Variedade sem contexto: 200 sorteios independentes de indústria dão mais de 120 nomes diferentes.
    const soltos = new Set(Array.from({ length: 200 }, (_, k) => nomeDeEmpresa13(rngDe('solto', k), 'industria', 'medio', [])));
    expect(soltos.size).toBeGreaterThan(120);
  });

  it('o bug: a empresa nunca compra uma concorrente com o próprio nome (nem quase igual), e o texto diz quem comprou quem', () => {
    for (let semente = 1; semente <= 25; semente++) {
      let v = industriaPronta(semente);
      const e = corp(v);
      e.nome = 'Fortaleza Industrial';
      e.corp!.rivais = undefined;
      v = fazer(v, e129(e, 'concorrente'));
      const x = corp(v);
      const comprada = x.corp!.aquisicoes!.slice(-1)[0];
      expect(nomesConfundem13(comprada, x.nome), comprada).toBe(false);
      expect(x.corp!.rivais!.includes(comprada)).toBe(false);
      expect(x.corp!.rivais!.some(rv => nomesConfundem13(rv, x.nome))).toBe(false);
      const bio = v.biografia?.slice(-3).map(b => b.texto).join(' ') ?? '';
      expect(bio).toContain(`Fortaleza Industrial, a sua empresa, comprou a concorrente ${comprada}`);
    }
  });

  it('as ofertas do ano não repetem os nomes da pessoa nem entre si; quem vende tem nome', () => {
    const v = pessoa(5e9);
    fundarEmpresa(v, 'industria', 'biscoitos', false);
    fundarEmpresa(v, 'banco', 'credito_pessoal', false);
    for (let ano = 0; ano < 6; ano++) {
      v.t += 12;
      const ofs = ofertasDeAquisicao(v);
      const nomes = [...v.financas.empresas!.map(e => e.nome), ...ofs.map(o => o.nome)];
      for (let i = 0; i < nomes.length; i++) for (let j = i + 1; j < nomes.length; j++) expect(nomesConfundem13(nomes[i], nomes[j]), `${nomes[i]} × ${nomes[j]}`).toBe(false);
      for (const o of ofs) expect(o.vendedor.length).toBeGreaterThan(5);
    }
    // As participações (empresas pequenas à venda) também.
    const ps = ofertasDeParticipacao(v);
    if (ps.length === 2) expect(nomesConfundem13(ps[0].nome, ps[1].nome)).toBe(false);
  });

  it('a compra de uma oferta diz quem vendeu e mantém o nome da oferta', () => {
    let v = pessoa(5e9);
    const o = ofertasDeAquisicao(v)[0];
    v = fazer(v, { tipo: 'adquirir129', ofertaId: o.id, parte: o.partes[0] });
    const e = v.financas.empresas!.slice(-1)[0];
    expect(e.nome).toBe(o.nome);
    expect(e.historia![0].texto).toContain(o.vendedor);
  });
});

describe('13 · saves antigos', () => {
  it('projeto sem produto segue o item (fator neutro) e nenhum nome muda ao carregar', () => {
    let v = pessoa(3e9);
    fundarEmpresa(v, 'industria', 'biscoitos', false);
    v = anos(v, 2);
    const e = corp(v);
    // Como era na 12.9: sem produto, sem linha, nome antigo da lista curta.
    for (const p of e.corp!.projetos) { delete p.produto; delete p.linha; p.nome = 'Uma linha de alimentos'; }
    e.nome = 'Fortaleza Industrial';
    delete e.corp!.rivais;
    delete e.decisoes13;
    const s = setorGrande('industria')!;
    expect(fatorDaLinha13(v, e, s, e.corp!.projetos[0])).toMatchObject({ demanda: 1, preco: 1, variavel: 1, aceitacao: 0, envelhece: 1 });
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const x = corp(r.vida);
    expect(x.nome).toBe('Fortaleza Industrial');
    expect(x.corp!.projetos[0].nome).toBe('Uma linha de alimentos');
    expect(x.corp!.projetos[0].produto).toBeUndefined();
    // Mexer numa linha antiga adota o produto de nascença do item — sem renomear, com o relógio da versão recomeçando.
    r.vida.anoAtual = { acoes: [] };
    const w = fazer(r.vida, e129(x, 'preco', `${x.corp!.projetos[0].id}:-`));
    const pj = corp(w).corp!.projetos[0];
    expect(pj.produto).toBe('biscoitos');
    expect(pj.nome).toBe('Uma linha de alimentos');
    expect(pj.linha!.tRenov).toBe(w.t);
  });

  it('o normalizador limpa o que veio torto e é idempotente', () => {
    const v = pessoa(3e9);
    fundarEmpresa(v, 'industria', 'biscoitos', false);
    const e = corp(v);
    const p = e.corp!.projetos[0];
    (p as unknown as { linha: unknown }).linha = { pos: 'luxo', preco: 9, qualidade: 7.6, fatia: 'x' };
    p.produto = 'nao_existe';
    (e as unknown as { decisoes13: unknown }).decisoes13 = [{ t: 1, titulo: 'ok', custo: 0, mudou: [], esperado: '' }, { lixo: true }];
    (e.corp as unknown as { rivais: unknown }).rivais = [1, 2];
    normalizarVida13Empresas(v);
    const um = JSON.stringify(v.financas.empresas);
    normalizarVida13Empresas(v);
    expect(JSON.stringify(v.financas.empresas)).toBe(um);
    expect(p.produto).toBeUndefined();
    expect(p.linha).toEqual({ preco: 0.3, qualidade: 3 });
    expect(e.decisoes13!.length).toBe(1);
    expect(e.corp!.rivais).toBeUndefined();
  });

  it('a decisão devolve o que custou e o que mudou (o texto do resultado imediato)', () => {
    const v = industriaPronta(5);
    const e = corp(v);
    const txt = decidirEmpresa129(v, e, 'capacidade');
    expect(txt).toMatch(/Pago agora: .*caixa da empresa/);
    expect(txt).toMatch(/Caixa da empresa: .* → /);
  });
});
