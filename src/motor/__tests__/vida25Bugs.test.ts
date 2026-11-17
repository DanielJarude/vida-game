/**
 * VIDA 25 · as quatro correções obrigatórias, cada uma na CONDIÇÃO que gerava o problema (não na tela):
 *   BUG-01 o alistamento chamava toda mulher de 18 anos, em qualquer ano (até em 1988, com o texto "Desde 2025...");
 *   BUG-02 a cena do clube anterior voltava (adiada) ou abria (no mesmo ano) depois da transferência;
 *   BUG-03 "o carro parado na oficina" para quem só tinha uma moto; o veículo guardado em outra cidade "deixava na mão";
 *   BUG-04 o calendário eleitoral só existia do ano de referência para frente: nas Eras, nenhuma eleição antes de 2028.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { chamadoAoAlistamento } from '../conteudo/caminhos';
import { criarRng } from '../rng';
import { tDe } from '../tempo';
import type { Vida, Veiculo } from '../tipos';
import { cargosDaEleicao, entrarNaPolitica, podeConcorrer, proximaEleicao, tDaEleicao, tiposDeEleicao } from '../sistemas/politica';
import { fatoresCabeca } from '../sistemas/estado';
import { processarVeiculos, veiculoNaOficina } from '../sistemas/veiculos';
import { cenaDeOutroClube, modeloDaSituacao, processarSituacoes, situacaoAberta } from '../sistemas/situacoes';
import { transferirPara } from '../sistemas/esporte';

beforeAll(async () => { await carregarMundo(); });

/** Uma vida nascida em `ano` (com a época), levada à idade pedida sem jogar (só o relógio). */
function nascidaEm(ano: number, genero: 'masculino' | 'feminino', idade: number, era = true): Vida {
  const v = nova({ genero, semente: ano * 7 + idade, ...(era ? { ano, era: true } : {}) } as never);
  v.t = v.eu.tNasc + idade * 12;
  return v;
}

describe('VIDA 25 · BUG-01 alistamento', () => {
  const decisao = conteudoPorId('mil_alistamento')!;
  const elegivel = (v: Vida) => !!preparar(decisao, v, criarRng(1));

  it('homem de 18 anos é chamado em qualquer época', () => {
    for (const ano of [1972, 1990, 2007]) expect(elegivel(nascidaEm(ano, 'masculino', 18))).toBe(true);
  });
  it('mulher de 18 anos NÃO é chamada antes de 2025 (a janela voluntária não existia)', () => {
    for (const ano of [1970, 1985, 1999, 2006]) {
      const v = nascidaEm(ano, 'feminino', 18);
      expect(chamadoAoAlistamento(v)).toBe(false);
      expect(elegivel(v)).toBe(false);
    }
  });
  it('mulher que faz 18 em 2025 ou depois tem a janela voluntária (Decreto 12.154/2024)', () => {
    for (const ano of [2007, 2010]) expect(elegivel(nascidaEm(ano, 'feminino', 18))).toBe(true);
  });
  it('fora da idade do alistamento, ninguém é chamado', () => {
    expect(elegivel(nascidaEm(2010, 'feminino', 17))).toBe(false);
    expect(elegivel(nascidaEm(1990, 'masculino', 19))).toBe(false);
  });
});

describe('VIDA 25 · BUG-04 eleições nas épocas históricas', () => {
  it('o calendário brasileiro existe para trás: 1988 municipal, 1990 geral, 1992 municipal...', () => {
    expect(tiposDeEleicao(1988, 'BR')).toEqual(['municipal']);
    expect(tiposDeEleicao(1990, 'BR')).toEqual(['geral']);
    expect(tiposDeEleicao(1992, 'BR')).toEqual(['municipal']);
    expect(tiposDeEleicao(1989, 'BR')).toEqual([]);
    expect(tiposDeEleicao(2028, 'BR')).toEqual(['municipal']);
    expect(proximaEleicao(tDe(1991, 1), undefined, 'BR').ano).toBe(1992);
  });

  function filiada(ano: number, idade: number): Vida {
    const v = nascidaEm(ano, 'feminino', idade);
    const p = entrarNaPolitica(v, 'comunidade');
    p.partido = 'PMDB'; p.tFiliacao = v.t - 36; p.fase = 'filiado'; p.apoio = 40; p.reputacao = 30;
    return v;
  }
  it('quem nasceu em 1970 e é filiada pode disputar vereador em 1992 e deputado em 1994', () => {
    const v = filiada(1970, 22);
    expect(podeConcorrer(v, 'vereador', tDaEleicao(1992, 'BR')).grau).not.toMatch(/ilegal|impossivel|requisito/);
    const w = filiada(1970, 24);
    expect(podeConcorrer(w, 'deputado_estadual', tDaEleicao(1994, 'BR')).grau).not.toMatch(/ilegal|impossivel|requisito/);
  });
  it('a janela da candidatura aparece no ano da eleição (antes: lista vazia)', () => {
    const v = filiada(1970, 22);
    v.t = tDe(1992, 1);
    expect(cargosDaEleicao(v).map(x => x.cargo)).toContain('vereador');
  });
  it('as regras da época continuam: idade mínima e reeleição antes da EC 16/1997', () => {
    const jovem = filiada(1975, 17);
    expect(podeConcorrer(jovem, 'vereador', tDaEleicao(1992, 'BR')).grau).toBe('ilegal');
    const pref = filiada(1960 + 10, 26);
    pref.caminhos.politica!.fase = 'mandato';
    pref.caminhos.politica!.mandato = { cargo: 'prefeito', tInicio: tDe(1993, 1), tFim: tDe(1997, 1) } as never;
    expect(podeConcorrer(pref, 'prefeito', tDaEleicao(1996, 'BR')).grau).toBe('ilegal');
  });
});

describe('VIDA 25 · BUG-03 veículo quebrado', () => {
  function comVeiculo(modeloId: string, extra: Partial<Veiculo> = {}): Vida {
    const v = nascidaEm(1990, 'masculino', 30, false);
    v.trabalho.atual = { ocupacaoId: 'vendedor', salario: 2000, municipioId: v.moradia.municipioId, contrato: 'clt', carga: 'integral', tInicio: v.t - 12, empregador: 'uma loja', desempenho: 60 } as never;
    v.financas.bens.push({ id: 'b1', tipo: 'veiculo', modeloId, nome: modeloId, valor: 9000, tCompra: v.t - 24, estado: 30, ...extra } as Veiculo);
    return v;
  }
  it('sem veículo, nada de oficina', () => {
    const v = nascidaEm(1990, 'masculino', 30, false);
    expect(veiculoNaOficina(v)).toBeUndefined();
    expect(fatoresCabeca(v).some(f => f.id === 'carro_parado')).toBe(false);
  });
  it('só uma moto quebrada: o peso fala da moto, não de um carro', () => {
    const v = comVeiculo('moto_pequena', { problema: { id: 'p', texto: 'o motor', custo: 3000, desde: 0, gravidade: 3, adiado: 0 } });
    const f = fatoresCabeca(v).find(x => x.id === 'carro_parado');
    expect(f?.texto).toMatch(/moto|Honda|Yamaha/i);
    expect(f?.texto).not.toMatch(/carro/);
  });
  it('o veículo guardado em outra cidade não pesa nem quebra', () => {
    const v = comVeiculo('carro_compacto', { local: 'sao-paulo-sp', problema: { id: 'p', texto: 'o motor', custo: 3000, desde: 0, gravidade: 3, adiado: 0 } });
    expect(veiculoNaOficina(v)).toBeUndefined();
    const w = comVeiculo('carro_compacto', { local: 'sao-paulo-sp', estado: 1 });
    for (let k = 0; k < 30; k++) { processarVeiculos(w, criarRng(k)); w.t += 12; }
    expect((w.financas.bens[0] as Veiculo).problema).toBeUndefined();
  });
  it('vendido, sai da conta: nenhuma oficina depois', () => {
    const v = comVeiculo('carro_compacto', { problema: { id: 'p', texto: 'o motor', custo: 3000, desde: 0, gravidade: 3, adiado: 0 } });
    expect(veiculoNaOficina(v)).toBeDefined();
    v.financas.bens = v.financas.bens.filter(b => b.tipo !== 'veiculo');
    expect(veiculoNaOficina(v)).toBeUndefined();
    expect(fatoresCabeca(v).some(f => f.id === 'carro_parado')).toBe(false);
  });
});

describe('VIDA 25 · BUG-02 a cena do clube anterior', () => {
  function jogador(): Vida {
    const v = nascidaEm(2000, 'masculino', 24, false);
    v.trabalho.atual = { ocupacaoId: 'jogador_futebol', salario: 20000, empregador: 'o Náutico', municipioId: 'recife-pe' } as never;
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Náutico', nivel: 2, tInicio: v.t - 60, tFase: v.t - 24, lesoes: 0, municipioId: 'recife-pe', espaco: 'titular', posicao: 'meia', contratoAte: v.t + 12 };
    return v;
  }
  it('a cena aberta com o clube de antes some depois da transferência (no mesmo ano)', () => {
    const v = jogador();
    v.caminhos.situacao = { id: 'fut_lance_construcao', t: v.t, dados: { minuto: 80, placar: 'está empatado', jogo: 'clássico', clube: 'Náutico' } };
    const m = modeloDaSituacao('fut_lance_construcao')!;
    expect(cenaDeOutroClube(v, m, v.caminhos.situacao.dados)).toBe(false);
    transferirPara(v, v.caminhos.esporte!, { id: 'p', clube: 'Sport', municipioId: 'recife-pe', nivel: 2, meses: 24, salario: 25000, salarioTitular: 25000, espaco: 'titular', t: v.t, validaAte: v.t + 6, origem: 'mercado' });
    expect(cenaDeOutroClube(v, m, v.caminhos.situacao.dados)).toBe(true);
    expect(situacaoAberta(v)).toBeUndefined();
  });
  it('a cena adiada do clube anterior não volta no ano seguinte, no clube novo', () => {
    const v = jogador();
    v.caminhos.situacao = { id: 'fut_lance_construcao', t: v.t, dados: { minuto: 80, placar: 'está empatado', jogo: 'clássico', clube: 'Náutico', _ocupado: 1 } };
    transferirPara(v, v.caminhos.esporte!, { id: 'p', clube: 'Sport', municipioId: 'recife-pe', nivel: 2, meses: 24, salario: 25000, salarioTitular: 25000, espaco: 'titular', t: v.t, validaAte: v.t + 6, origem: 'mercado' });
    v.t += 12;
    for (let k = 0; k < 20; k++) {
      const w = structuredClone(v);
      processarSituacoes(w, criarRng(k));
      const s = w.caminhos.situacao;
      if (s?.dados.clube !== undefined) expect(s.dados.clube).toBe('Sport');
    }
  });
});
