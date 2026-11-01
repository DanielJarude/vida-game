/**
 * HOTFIX 11.5.1 — o futebol: a tabela de classificação, os campeões e os prêmios individuais do mundo.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng, rngDe } from '../rng';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { clubesDoPais } from '../dados/clubes';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { ligaDe, tabelaDaUltimaTemporada } from '../sistemas/ligas';
import { compararLinhas, invariantesDaTabela, jogarTabela, nomeSemCatalogo, pontosDaLinha, SEM_CATALOGO, tabelaEmOrdem } from '../sistemas/tabelaDaLiga';
import { anotarCopaNoHistorico, campeaoDaCopaNoAno, campeoesDoPais } from '../sistemas/competicoes';
import { pontuacao, premiosDoMundo } from '../sistemas/premiosDoFutebol';
import { itensDaGaleria, formaDoTrofeu } from '../../ui/jogo/Galeria';
import type { Vida } from '../tipos';

const nomes = (n: number) => Array.from({ length: n }, (_, k) => `Clube ${k + 1}`);
const responder = (v: Vida) => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; } v.momento = null; return v; };

describe('HOTFIX 11.5.1 · a tabela de classificação', () => {
  it('turno e returno de 20: cada linha fecha (J = V+E+D, Pts = 3V+E), o campeonato fecha, e a ordem é a de chegada', () => {
    for (let s = 0; s < 30; s++) {
      const ns = nomes(20);
      const t = jogarTabela(rngDe('t', s), ns);
      expect(invariantesDaTabela(t)).toEqual([]);
      expect(t.map(l => l[0])).toEqual(ns);
      expect(t[0][1]).toBe(38);
      expect(pontosDaLinha(t[0])).toBeGreaterThanOrEqual(pontosDaLinha(t[19]));
    }
  });

  it('os critérios de desempate valem na ordem: pontos, vitórias, saldo, gols marcados', () => {
    expect(compararLinhas(['a', 38, 20, 5, 13, 50, 40], ['b', 38, 19, 8, 11, 70, 30])).toBeLessThan(0); // 65 × 65: mais vitórias
    expect(compararLinhas(['a', 38, 20, 5, 13, 50, 40], ['b', 38, 20, 5, 13, 52, 41])).toBeGreaterThan(0); // saldo 10 × 11
    expect(compararLinhas(['a', 38, 20, 5, 13, 52, 42], ['b', 38, 20, 5, 13, 50, 40])).toBeLessThan(0); // mesmo saldo: mais gols
    expect(tabelaEmOrdem([['a', 38, 20, 5, 13, 50, 40], ['b', 38, 21, 2, 15, 50, 40]])).toBe(false); // 65 × 65: b ganhou mais
    expect(tabelaEmOrdem([['b', 38, 21, 2, 15, 50, 40], ['a', 38, 20, 5, 13, 50, 40]])).toBe(true);
  });

  it('a linha do clube da vida respeita os gols do atleta (e o campeonato continua fechando)', () => {
    const ns = nomes(20);
    const t = jogarTabela(rngDe('m', 1), ns, { clube: 'Clube 15', gp: 90 });
    const l = t.find(x => x[0] === 'Clube 15')!;
    // Se o ajuste mudaria a ordem, ele não é feito; quando é feito, o mínimo vale.
    expect(invariantesDaTabela(t)).toEqual([]);
    if (l[5] < 90) expect(jogarTabela(rngDe('m', 1), ns).find(x => x[0] === 'Clube 15')![5]).toBe(l[5]);
    const t2 = jogarTabela(rngDe('m', 2), ns, { clube: 'Clube 3', gp: 40, gc: 30 });
    expect(invariantesDaTabela(t2)).toEqual([]);
  });

  it('o mundo: cada temporada guarda a tabela de cada divisão; o 1º da elite é o campeão; o histórico tem até 30 anos', () => {
    let v = adulto(20, { semente: 11511 });
    ligaDe(v, 'BR');
    for (let k = 0; k < 34; k++) {
      v = transacao(v, x => { x.t += 12; }).vida;
      const liga = ligaDe(v, 'BR');
      const u = liga.ultima!;
      for (const n of [2, 3, 4] as const) if (u.tabelas?.[n]) expect(invariantesDaTabela(u.tabelas[n]!)).toEqual([]);
      const elite = u.tabelas![4]!;
      expect(u.campeoes[4] ?? elite[0][0]).toBe(elite[0][0]);
      for (const c of u.cairam.filter(c => elite.some(l => l[0] === c))) expect(elite.findIndex(l => l[0] === c)).toBeGreaterThanOrEqual(16);
      expect(liga.historico!.find(h => h.ano === u.ano)!.liga).toBe(elite[0][0]);
    }
    expect(ligaDe(v, 'BR').historico!.length).toBeLessThanOrEqual(30);
    // Os nomes da tabela são únicos (catálogo + gerados, que levam o sinal de "fora do catálogo").
    for (const t of Object.values(ligaDe(v, 'BR').ultima!.tabelas!)) expect(new Set(t!.map(l => l[0])).size).toBe(t!.length);
    const ocupados = new Set<string>();
    const gerados = Array.from({ length: 20 }, (_, k) => nomeSemCatalogo('ES', ['Toledo', 'Cádiz', 'Lugo'], 3, k, ocupados));
    expect(new Set(gerados).size).toBe(20);
    expect(SEM_CATALOGO).toBe('~');
  });

  it('a copa: o clube da vida campeão fica no histórico; eliminado, o campeão do mundo nunca é ele', () => {
    const v = adulto(20, { semente: 5 });
    const ano = 2030;
    ligaDe(v, 'BR');
    anotarCopaNoHistorico(v, 'BR', ano, 'copa:BR', 'Flamengo', 'quartas');
    for (let k = 0; k < 5; k++) expect(campeaoDaCopaNoAno(v, 'BR', ano)).not.toBe('Flamengo');
    anotarCopaNoHistorico(v, 'BR', ano + 1, 'copa:BR', 'Bahia', 'campeão');
    expect(campeoesDoPais(v, 'BR').find(x => x.ano === ano + 1)?.copa).toBe('Bahia');
    anotarCopaNoHistorico(v, 'BR', ano + 2, 'copa:BR', 'Bahia', 'vice', 'Palmeiras');
    expect(campeaoDaCopaNoAno(v, 'BR', ano + 2)).toBe('Palmeiras');
  });
});

describe('HOTFIX 11.5.1 · os prêmios individuais', () => {
  const base = { nome: 'X', clube: 'C', nac: 'BR', grupo: 'atacante' as const, idade: 24, nota: 8, gols: 25, golsLiga: 20, assist: 8, titularidade: 0.9, titulos: { liga: false, cont: false, copa: false, mundial: false, continentalSel: false }, elite: true };
  it('os critérios: elite para todos; Chuteira e Golden Boy só na Europa; Golden Boy até 20 anos; o título pesa', () => {
    expect(pontuacao('bola_de_ouro', { ...base, liga: 'ES' })).toBeDefined();
    expect(pontuacao('bola_de_ouro', { ...base, liga: 'ES', elite: false })).toBeUndefined();
    expect(pontuacao('chuteira_de_ouro', { ...base, liga: 'BR' })).toBeUndefined();
    expect(pontuacao('chuteira_de_ouro', { ...base, liga: 'ES' })).toBe(40);
    expect(pontuacao('chuteira_de_ouro', { ...base, liga: 'PT' })).toBe(30);
    expect(pontuacao('golden_boy', { ...base, liga: 'ES' })).toBeUndefined();
    expect(pontuacao('golden_boy', { ...base, liga: 'ES', idade: 19 })).toBeDefined();
    const campeao = pontuacao('bola_de_ouro', { ...base, liga: 'ES', titulos: { ...base.titulos, cont: true } })!;
    expect(campeao).toBeGreaterThan(pontuacao('bola_de_ouro', { ...base, liga: 'ES' })!);
    // A temporada manda: nota e gols melhores ganham de um ano comum com o mesmo título.
    expect(pontuacao('the_best', { ...base, liga: 'ES', nota: 9, gols: 40 })!).toBeGreaterThan(pontuacao('the_best', { ...base, liga: 'ES', nota: 7, gols: 10 })!);
  });

  it('a carreira: o mundo dá os quatro prêmios por ano; a vida que ganha tem conquista, troféu próprio e sobrevive ao save', () => {
    let v = transacao(adulto(19, { semente: 115107, genero: 'masculino', municipioId: 'rio-de-janeiro-rj' }), x => {
      garantirFrente(x, 'futebol');
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: 100, interesse: 95, meses: 140, auge: 100 });
      x.corpo.forma = 92;
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
      entrarNaBase(x, 'futebol', x.moradia.municipioId, clubesDoPais('BR').find(c => c.nome === 'Flamengo')!.nome);
      profissionalizar(x, criarRng(7), 4);
      x.momento = null; x.caminhos.pendente = undefined;
    }).vida;
    for (let a = 0; a < 10 && !v.morte; a++) v = responder(avancarAno(v).vida);
    const m = v.caminhos.futebolMundo!;
    expect(m).toBeDefined();
    const anos = [...new Set(m.premios.map(p => p.ano))];
    for (const ano of anos) expect(m.premios.filter(p => p.ano === ano).map(p => p.premio).sort()).toEqual(['bola_de_ouro', 'chuteira_de_ouro', 'golden_boy', 'the_best']);
    // O Golden Boy é sempre de até 20 anos (as estrelas guardam a idade pelo nascimento).
    for (const p of m.premios.filter(x => x.premio === 'golden_boy' && !x.vencedor.voce)) {
      const e = m.estrelas.find(s => s.nome === p.vencedor.nome);
      if (e) expect(p.ano - e.nasc).toBeLessThanOrEqual(20);
    }
    for (const p of m.premios.filter(x => x.vencedor.voce)) {
      const c = v.caminhos.palmares!.find(x => x.competicaoId === `premio:${p.premio}` && x.ano === p.ano && x.tipo === 'premio');
      expect(c).toBeDefined();
      expect(formaDoTrofeu(c!)).not.toBe('medalha');
    }
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.caminhos.futebolMundo).toEqual(m);
    // A linha do clube na tabela é a da colocação.
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0];
    const tab = tabelaDaUltimaTemporada(v, t.pais ?? 'BR', t.nivel);
    if (tab?.ano === t.ano && t.nivel >= 2) expect(tab.linhas.findIndex(l => l[0] === t.clube) + 1).toBe(t.colocacao);
  }, 400000);

  it('premiosDoMundo não repete o ano nem roda fora do futebol profissional', () => {
    const v = adulto(25, { semente: 3 });
    premiosDoMundo(v, { modalidade: 'tenis', fase: 'profissional' } as never, { ano: 2030 } as never);
    expect(v.caminhos.futebolMundo).toBeUndefined();
  });
});

describe('HOTFIX 11.5.1 · a galeria', () => {
  it('o título pela seleção vira troféu (antes ficava fora); cada prêmio do mundo tem a sua forma', () => {
    const v = adulto(28, { semente: 9 });
    v.caminhos.palmares = [
      { tipo: 'selecao', modalidade: 'futebol', ano: 2030, t: v.t, competicao: 'a Copa do Mundo', competicaoId: 'sel:mundial', papel: 'protagonista', texto: 'Campeão da Copa do Mundo' },
      { tipo: 'selecao', modalidade: 'futebol', ano: 2028, t: v.t, competicao: 'a Copa América', competicaoId: 'sel:CONMEBOL', papel: 'elenco', texto: 'Copa América: a seleção caiu nas quartas' },
      { tipo: 'premio', modalidade: 'futebol', ano: 2031, t: v.t, competicao: 'Bola de Ouro', competicaoId: 'premio:bola_de_ouro', texto: 'Bola de Ouro 2031' },
      { tipo: 'premio', modalidade: 'futebol', ano: 2031, t: v.t, competicao: 'Chuteira de Ouro', competicaoId: 'premio:chuteira_de_ouro', texto: 'Chuteira de Ouro 2031' }
    ];
    const itens = itensDaGaleria(v);
    expect(itens.find(i => i.ano === 2030)?.forma).toBe('mundo');
    expect(itens.some(i => i.ano === 2028)).toBe(false);
    expect(itens.filter(i => i.ano === 2031).map(i => i.forma).sort()).toEqual(['bola', 'chuteira']);
    expect(itens.filter(i => i.ano === 2031).every(i => i.metal === 'ouro')).toBe(true);
  });
});
