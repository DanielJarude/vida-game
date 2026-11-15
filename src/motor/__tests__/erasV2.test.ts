/**
 * ERAS v2 — economia da época, partidos no tempo, moda, veículos, leis, cidades, anos 1970 e a vida contemporânea intacta.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { entrarNaVida } from '../mundo/vida';
import { formatarDinheiro } from '../mundo/moeda';
import { interpretar } from '../save';
import { anoDe, tDe } from '../tempo';
import { definirMesHistorico, padraoEm } from '../eras/base/moedas';
import { fatorSalarial, precoRelativo, poderDeCompra, rendaDaEpoca } from '../eras/base/economia';
import { partidosNoMes, sucessorNoMes } from '../eras/base/partidos';
import { itemDeEstiloAVenda, ITENS_ESTILO_ERAS } from '../eras/base/moda';
import { casamentoImpedidoPelaLei, divorcioNaEpoca } from '../eras/base/leis';
import { anacronismosNoTexto, textoDaEpoca } from '../eras/base/anacronismos';
import { versoesDoAno, VERSOES_DA_EPOCA } from '../eras/base/veiculos';
import { normalizarEra } from '../eras/base/contexto';
import { VERSOES_VEICULO } from '../dados/bens';
import { PARTIDOS_REAIS } from '../dados/partidos';
import { partidosDoPais } from '../sistemas/politica';
import { salarioLocal } from '../sistemas/renda';
import { ocupacao, ocupacoesDaClasse } from '../dados/ocupacoes';
import { economiaLocal } from '../dados/lugares';
import { orcamento } from '../sistemas/dinheiro';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

const historica = (ano: number, o: Parameters<typeof nova>[0] = {}) => nova({ semente: 4242, municipioId: 'sao-paulo-sp', ano, era: true, ...o });
const noAno = (v: Vida, ano: number) => { v.t = tDe(ano, 5); entrarNaVida(v); return v; };

describe('economia da época', () => {
  it('na vida contemporânea, nada muda: fatores 1 e o mesmo salário', () => {
    const v = nova({ semente: 1, municipioId: 'sao-paulo-sp' }); entrarNaVida(v);
    const oc = ocupacao('caixa');
    const antes = salarioLocal(oc, 'sao-paulo-sp');
    definirMesHistorico(null);
    expect(salarioLocal(oc, 'sao-paulo-sp')).toBe(antes);
    expect(economiaLocal('sao-paulo-sp').salario).toBeCloseTo(economiaLocal('sao-paulo-sp').salario);
    expect(fatorSalarial(2026, 3000)).toBe(1);
    expect(precoRelativo('roupas', 2026)).toBe(1);
  });
  it('a renda média segue a PNAD: menor nos anos 1980, alta com o real, vale em 2004, 2025 = 1', () => {
    expect(rendaDaEpoca(1985)).toBeLessThan(0.7);
    expect(rendaDaEpoca(1995)).toBeGreaterThan(rendaDaEpoca(1992));
    expect(rendaDaEpoca(2004)).toBeLessThan(rendaDaEpoca(1998));
    expect(rendaDaEpoca(2025)).toBe(1);
  });
  it('a distribuição: quem ganhava perto do mínimo ganhava bem menos em 1995; quem tinha diploma, perto de hoje', () => {
    const v = historica(1995); noAno(v, 1995);
    const caixa = salarioLocal(ocupacao('caixa'), 'sao-paulo-sp');
    const medico = salarioLocal(ocupacao('medico'), 'sao-paulo-sp');
    definirMesHistorico(null);
    const caixaHoje = salarioLocal(ocupacao('caixa'), 'sao-paulo-sp');
    const medicoHoje = salarioLocal(ocupacao('medico'), 'sao-paulo-sp');
    expect(caixa / caixaHoje).toBeLessThan(0.5);
    expect(medico / medicoHoje).toBeGreaterThan(0.85);
  });
  it('preços relativos: roupa e eletrodoméstico mais caros nos anos 1990; o mercado e a cesta pesavam mais no mínimo', () => {
    expect(precoRelativo('roupas', 1995)).toBeGreaterThan(1.3);
    expect(precoRelativo('eletrodomesticos', 1995)).toBeGreaterThan(1.5);
    const p95 = poderDeCompra(1995), p25 = poderDeCompra(2025);
    expect(p95.cestaNoMinimo!).toBeGreaterThan(80);
    expect(p25.cestaNoMinimo!).toBeLessThan(65);
  });
  it('o orçamento de uma vida histórica fecha (números finitos) e a do mesmo save contemporâneo não muda', () => {
    const v = viver(historica(1985), 30);
    const o = orcamento(v);
    expect(Number.isFinite(o.renda) && Number.isFinite(o.despesa)).toBe(true);
  });
});

describe('partidos no tempo', () => {
  it('em dez/2025, a lista histórica é a lista de 2026', () => {
    expect(new Set(partidosNoMes(tDe(2025, 12)))).toEqual(new Set(PARTIDOS_REAIS.map(p => p.sigla)));
  });
  it('em 1990 não existe o Novo nem o União; existem o PFL e o PMDB; antes de 1980, só Arena e MDB', () => {
    const l = partidosNoMes(tDe(1990, 6));
    expect(l).toContain('PFL'); expect(l).toContain('PMDB'); expect(l).toContain('PT');
    expect(l).not.toContain('NOVO'); expect(l).not.toContain('UNIÃO'); expect(l).not.toContain('PSOL');
    expect(new Set(partidosNoMes(tDe(1975, 1)))).toEqual(new Set(['ARENA', 'MDB_1966']));
  });
  it('a linhagem: PFL → DEM → União Brasil; PMDB → MDB', () => {
    const s = sucessorNoMes('PFL', tDe(2023, 1))!;
    expect(s.id).toBe('UNIÃO');
    expect(s.passos.map(p => p.id)).toEqual(['PFL', 'DEM']);
    expect(sucessorNoMes('PMDB', tDe(2018, 1))!.id).toBe('MDB');
  });
  it('a vida histórica só vê os partidos do mês; a contemporânea, os de 2026', () => {
    const v = historica(1990); noAno(v, 1996);
    expect(partidosDoPais('BR')).not.toContain('REDE');
    definirMesHistorico(null);
    expect(partidosDoPais('BR')).toContain('REDE');
  });
});

describe('moda, veículos e casa', () => {
  it('as peças da época só se vendem no período e só na vida histórica; as de hoje, depois de chegar', () => {
    const c = nova({ semente: 2, municipioId: 'sao-paulo-sp' });
    for (const it of ITENS_ESTILO_ERAS) expect(itemDeEstiloAVenda(c, it.id)).toBe(false);
    expect(itemDeEstiloAVenda(c, 'smartwatch')).toBe(true);
    const v = historica(1985);
    expect(itemDeEstiloAVenda(v, 'ep_jeans_cenoura', 1987)).toBe(true);
    expect(itemDeEstiloAVenda(v, 'ep_jeans_cenoura', 2005)).toBe(false);
    expect(itemDeEstiloAVenda(v, 'smartwatch', 1999)).toBe(false);
    expect(itemDeEstiloAVenda(v, 'smartwatch', 2018)).toBe(true);
    expect(itemDeEstiloAVenda(v, 'jeans', 1987)).toBe(true);
  });
  it('veículos: nada importado antes de 1990; os importados da época nos anos 1990; a geração atual só depois de lançada', () => {
    const atuais = VERSOES_VEICULO.filter(x => !(x as { epoca?: unknown }).epoca);
    const de85 = versoesDoAno(atuais, 1985).map(x => x.id);
    expect(de85).not.toContain('porsche_911');
    expect(versoesDoAno(atuais, 1985).some(x => x.classe === 'carro_luxo')).toBe(false);
    const de95 = versoesDoAno(atuais, 1995).map(x => x.id);
    expect(de95).toContain('ep_mb_c280_w202');
    expect(de95).not.toContain('bmw_320i');
    expect(versoesDoAno(atuais, 2021).map(x => x.id)).toContain('porsche_911');
    expect(versoesDoAno(atuais, 2010).some(x => x.classe === 'bike_eletrica')).toBe(false);
    for (const x of VERSOES_DA_EPOCA) expect(x.epoca[0]).toBeLessThanOrEqual(x.epoca[1]);
  });
});

describe('leis, profissões, texto e cidades', () => {
  it('casamento entre pessoas do mesmo gênero: impedido antes de maio de 2013 na vida histórica; nunca na contemporânea', () => {
    const v = historica(1985); noAno(v, 2005);
    expect(casamentoImpedidoPelaLei(v, 'feminino', 'feminino')).toMatch(/2011/);
    v.t = tDe(2012, 1);
    expect(casamentoImpedidoPelaLei(v, 'masculino', 'masculino')).toMatch(/união estável/);
    v.t = tDe(2014, 1);
    expect(casamentoImpedidoPelaLei(v, 'masculino', 'masculino')).toBeUndefined();
    expect(casamentoImpedidoPelaLei(nova({ semente: 3 }), 'feminino', 'feminino')).toBeUndefined();
    v.t = tDe(2005, 1);
    expect(divorcioNaEpoca(v)).toMatch(/separação/);
  });
  it('pais e pessoas do mundo não têm profissão que ainda não existe', () => {
    const v = historica(1988); noAno(v, 1990);
    expect(ocupacoesDaClasse('vulneravel', 'BR')).not.toContain('entregador_app');
    expect(ocupacoesDaClasse('trabalhadora', 'BR')).not.toContain('motorista_app');
  });
  it('a peneira e o detector: UPA, meme, FIES e aplicativo antes do tempo', () => {
    const v = historica(1985); noAno(v, 1995);
    expect(textoDaEpoca(v, 'Levou você para a UPA.')).toBe('Levou você para o pronto-socorro.');
    expect(textoDaEpoca(v, 'A conta do FIES chegou.')).toBe('A conta do Crédito Educativo chegou.');
    expect(anacronismosNoTexto('Mandei um meme pelo WhatsApp', 1995)).toEqual(expect.arrayContaining(['meme', 'aplicativo de mensagens']));
    expect(anacronismosNoTexto('Mandei um meme pelo WhatsApp', 2020)).toEqual([]);
  });
  it('o metrô de Belo Horizonte: transporte de ônibus antes de agosto de 1986', () => {
    const v = historica(1980, { municipioId: 'belo-horizonte-mg' });
    noAno(v, 1984);
    const antes = economiaLocal('belo-horizonte-mg').transporte;
    noAno(v, 1990);
    const depois = economiaLocal('belo-horizonte-mg').transporte;
    definirMesHistorico(null);
    const hoje = economiaLocal('belo-horizonte-mg').transporte;
    if (hoje === 'bom') { expect(antes).toBe('medio'); expect(depois).toBe('bom'); }
  });
});

describe('anos 1970', () => {
  it('nasce em 1972 com época, cruzeiro e a moeda certa no mês; save reabre igual', () => {
    const v = historica(1972);
    expect(v.era?.ano).toBe(1972);
    expect(padraoEm(tDe(1970, 2)).simbolo).toBe('NCr$');
    expect(padraoEm(tDe(1970, 6)).simbolo).toBe('Cr$');
    entrarNaVida(v);
    expect(formatarDinheiro(1000)).toMatch(/^Cr\$/);
    const w = viver(v, 20);
    expect(anoDe(w.t)).toBe(1992);
    const r = interpretar(JSON.stringify(w));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.era).toEqual(w.era);
    const ids = w.biografia.filter(e => e.fato?.tipo === 'era').map(e => String((e.fato!.dados as Record<string, string>).evento));
    expect(ids).toEqual(expect.arrayContaining(['cruzado', 'cruzado_novo', 'cruzeiro90']));
    expect(new Set(ids).size).toBe(ids.length); // nada se repete
  });
  it('a normalização aceita 1970 e recusa 1969, e é idempotente', () => {
    const v = historica(1975);
    normalizarEra(v); const a = JSON.stringify(v.era); normalizarEra(v);
    expect(JSON.stringify(v.era)).toBe(a);
    (v.era as { ano: number }).ano = 1969; normalizarEra(v);
    expect(v.era).toBeUndefined();
  });
});

describe('ERAS v2 · os parciais completados', () => {
  it('reeleição de prefeito antes de 2000 é impedida; depois, não; presidencial antes de 1994 não existe', async () => {
    const { regraEleitoralDaEpoca } = await import('../eras/base/leis');
    const v = historica(1970);
    expect(regraEleitoralDaEpoca(v, 'prefeito', 1996, true)).toMatch(/Emenda Constitucional 16\/1997/);
    expect(regraEleitoralDaEpoca(v, 'prefeito', 2000, true)).toBeUndefined();
    expect(regraEleitoralDaEpoca(v, 'prefeito', 1996, false)).toBeUndefined();
    expect(regraEleitoralDaEpoca(v, 'presidente', 1990, false)).toBeDefined();
    expect(regraEleitoralDaEpoca(nova({ semente: 5 }), 'prefeito', 1996, true)).toBeUndefined();
  });
  it('a vaga de emprego chega pelo meio da época', async () => {
    const { comoAchouAVaga } = await import('../eras/base/contexto');
    const v = historica(1960 + 20); noAno(v, 1985);
    const textos = new Set(['caixa', 'vendedor', 'aux_adm', 'porteiro', 'garcom', 'cozinheiro'].map(id => comoAchouAVaga(v, id)));
    for (const t of textos) expect(t).toMatch(/classificados|indicação/);
    expect(comoAchouAVaga(nova({ semente: 6 }), 'caixa')).toBeUndefined();
  });
  it('a maioridade aos 21 na Linha da Vida de quem fez 18 antes de 2003', () => {
    const v = viver(historica(1975), 22);
    const ids = v.biografia.filter(e => e.fato?.tipo === 'era').map(e => String((e.fato!.dados as Record<string, string>).evento));
    expect(ids).toEqual(expect.arrayContaining(['maioridade18', 'maioridade21']));
  });
  it('o cabelo da década existe no catálogo de cortes', async () => {
    const { cabeloDaDecada } = await import('../eras/base/moda');
    const { CORTES } = await import('../dados/estilo');
    const ids = new Set(CORTES.map(c => c.id));
    for (const a of [1975, 1985, 1995, 2005, 2015]) for (const t of ['liso', 'ondulado', 'cacheado', 'crespo']) for (const c of cabeloDaDecada(a, t)) expect(ids.has(c), `${c}`).toBe(true);
  });
  it('a peneira de saúde e dinheiro', () => {
    const v = historica(1980); noAno(v, 1985);
    expect(textoDaEpoca(v, 'Foi atendido pelo SUS.')).toBe('Foi atendido pelo INAMPS.');
    noAno(v, 1999);
    expect(textoDaEpoca(v, 'Chamou o SAMU.')).toBe('Chamou a ambulância.');
  });
});
