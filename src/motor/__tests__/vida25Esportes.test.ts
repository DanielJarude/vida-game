/**
 * VIDA 25 · carreiras esportivas: e-sports (catálogo, época, começo, peneira, proposta, contrato, temporada, save),
 * atributos de toda modalidade (com efeito na nota), formação registrada ano a ano, prêmios do mundo na escala do mundo,
 * o mercado do futebol sem saltos e a lembrança da CNH.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import type { CarreiraEsportiva, Vida } from '../tipos';
import { JOGOS25, LISTA_JOGOS25 } from '../v25/esports/jogos25';
import { forcaDoNivel, jogosNoAno25, nivelDeJogo25, pesosDaFuncao, processarEsports25 } from '../v25/esports/esports25';
import { ATRIBUTOS_DA_MODALIDADE, atributosDaCarreira, efeitoNaNota, perfilDeAtributos } from '../sistemas/atributosEsportivos';
import { entrarNaBase } from '../sistemas/esporte';
import { garantirFrente } from '../sistemas/frentes';
import { lembrarDaCnh } from '../sistemas/autoescola';
import { pontuacao } from '../sistemas/premiosDoFutebol';

beforeAll(async () => { await carregarMundo(); });

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const E = (oque: object) => ({ tipo: 'esports25', oque } as Acao);
function aos(idade: number, o: Record<string, unknown> = {}): Vida { const v = nova({ semente: 77 + idade, genero: 'masculino', ...o } as never); v.t = v.eu.tNasc + idade * 12; return v; }

describe('VIDA 25 · e-sports: catálogo', () => {
  it('no máximo sete jogos, com CS, R6 e Fortnite', () => {
    expect(LISTA_JOGOS25.length).toBeLessThanOrEqual(7);
    for (const j of ['cs', 'r6', 'fortnite'] as const) expect(LISTA_JOGOS25).toContain(j);
  });
  it('cada jogo tem cinco degraus, atributos próprios (pesos somam 1) e funções com pesos diferentes', () => {
    const conjuntos = new Set<string>();
    for (const id of LISTA_JOGOS25) {
      const j = JOGOS25[id];
      expect(j.niveis).toHaveLength(5);
      expect(j.atributos.reduce((s, [, p]) => s + p, 0)).toBeCloseTo(1, 5);
      conjuntos.add(j.atributos.map(([a]) => a).sort().join(','));
      for (const f of j.funcoes) expect(pesosDaFuncao(j, f.id).reduce((s, [, p]) => s + p, 0)).toBeCloseTo(1, 5);
      // a força cresce degrau a degrau
      for (let n = 2; n <= 5; n++) expect(forcaDoNivel(id, n)).toBeGreaterThan(forcaDoNivel(id, n - 1));
    }
    expect(conjuntos.size).toBeGreaterThanOrEqual(4);
  });
  it('a época manda: não há VALORANT em 2010 nem Fortnite em 2016; CS existe em 2005', () => {
    expect(jogosNoAno25(2010)).not.toContain('valorant');
    expect(jogosNoAno25(2016)).not.toContain('fortnite');
    expect(jogosNoAno25(2005)).toContain('cs');
    expect(JOGOS25.cs.nome(2008)).toMatch(/1\.6/);
    expect(JOGOS25.cs.nome(2024)).toBe('Counter-Strike 2');
    expect(JOGOS25.lol.niveis[3].nome(2025, true)).toBe('LTA Sul');
    expect(JOGOS25.lol.niveis[3].nome(2026, true)).toBe('CBLOL');
  });
});

describe('VIDA 25 · e-sports: a carreira', () => {
  it('não começa antes dos 12 nem em jogo que ainda não existe', () => {
    expect(tenta(aos(10), E({ op: 'comecar', jogo: 'cs' }))).toBe(false);
    const v = nova({ semente: 5, genero: 'feminino', ano: 1990, era: true } as never);
    v.t = v.eu.tNasc + 15 * 12;
    expect(tenta(v, E({ op: 'comecar', jogo: 'valorant' }))).toBe(false);
  });
  it('começa no ranqueado (degrau 1), sem equipe, com o treino na semana', () => {
    let v = aos(14);
    v = executar(v, E({ op: 'comecar', jogo: 'valorant' })).vida;
    const e = v.esports25!;
    expect(e.fase).toBe('amador');
    expect(e.nivel).toBe(1);
    expect(e.equipe).toBeUndefined();
    expect(v.rotinas.some(r => r.id === 'esports')).toBe(true);
    expect(v.biografia.some(b => /VALORANT/.test(b.texto))).toBe(true);
  });
  it('a temporada registra competições reais do degrau, métrica e totais; o save volta igual', () => {
    let v = aos(14);
    v = executar(v, E({ op: 'comecar', jogo: 'cs' })).vida;
    v = viver(v, 3);
    const e = v.esports25!;
    expect(e.temporadas.length).toBeGreaterThanOrEqual(2);
    const t = e.temporadas[0];
    expect(t.competicoes.length).toBeGreaterThan(0);
    expect(t.competicoes[0].colocacao).toBeGreaterThanOrEqual(1);
    expect(t.competicoes[0].colocacao).toBeLessThanOrEqual(t.competicoes[0].participantes);
    expect(e.totais.temporadas).toBe(e.temporadas.length);
    expect(e.serie.length).toBeGreaterThan(0);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo).toBe('ok');
    if (l.tipo === 'ok') expect(l.vida.esports25).toEqual(v.esports25);
  });
  it('sem treino a mão esfria; com treino, o nível sobe', () => {
    let v = aos(15);
    v = executar(v, E({ op: 'comecar', jogo: 'cs' })).vida;
    const a = structuredClone(v), b = structuredClone(v);
    a.rotinas = a.rotinas.filter(r => r.id !== 'esports');
    b.rotinas.find(r => r.id === 'esports')!.nivel = 3;
    const n0 = nivelDeJogo25(v.esports25!);
    a.t += 12; b.t += 12;
    processarEsports25(a); processarEsports25(b);
    expect(nivelDeJogo25(b.esports25!)).toBeGreaterThan(n0);
    expect(a.esports25!.atributos.mira!).toBeLessThan(b.esports25!.atributos.mira!);
  });
  it('a proposta aceita vira equipe; com salário no degrau 3, emprego de jogador de e-sports (fora do mercado de vagas)', () => {
    let v = aos(18, { municipioId: 'sao-paulo-sp' });
    v = executar(v, E({ op: 'comecar', jogo: 'lol' })).vida;
    v.esports25!.proposta = { equipe: 'Carcará Esports', nivel: 3, forca: 60, salario: 4000, meses: 24, validaAte: v.t + 11, origem: 'mercado', titular: true, municipioId: 'sao-paulo-sp' };
    v = executar(v, E({ op: 'aceitar' })).vida;
    expect(v.esports25!.equipe?.nome).toBe('Carcará Esports');
    expect(v.esports25!.fase).toBe('profissional');
    expect(v.trabalho.atual?.ocupacaoId).toBe('jogador_esports');
    expect(v.trabalho.atual?.salario).toBe(4000);
    expect(v.rotinas.some(r => r.id === 'esports')).toBe(false);
    v = executar(v, E({ op: 'sair' })).vida;
    expect(v.esports25!.equipe).toBeUndefined();
    expect(v.trabalho.atual?.ocupacaoId).not.toBe('jogador_esports');
    expect(v.esports25!.passagens[0].ate).toBeDefined();
  });
  it('peneira: uma por ano; antes da idade da liga, só o cenário aberto; Fortnite sobe por resultado (sem peneira)', () => {
    let v = aos(15);
    v = executar(v, E({ op: 'comecar', jogo: 'lol' })).vida;
    expect(tenta(v, E({ op: 'peneira' }))).toBe(true);
    v = executar(v, E({ op: 'peneira' })).vida;
    expect(tenta(v, E({ op: 'peneira' }))).toBe(false);
    let w = aos(15);
    w = executar(w, E({ op: 'comecar', jogo: 'fortnite' })).vida;
    expect(tenta(w, E({ op: 'peneira' }))).toBe(false);
  });
});

describe('VIDA 25 · atributos de toda modalidade', () => {
  it('vôlei, futsal, tênis, natação, atletismo e luta têm atributos com pesos que somam 1', () => {
    for (const d of ['volei', 'futsal', 'tenis', 'natacao', 'atletismo', 'lutas']) {
      const l = ATRIBUTOS_DA_MODALIDADE[d]!;
      expect(l.length).toBeGreaterThanOrEqual(4);
      expect(l.reduce((s, [, p]) => s + p, 0)).toBeCloseTo(1, 5);
      expect(atributosDaCarreira({ modalidade: d } as CarreiraEsportiva, undefined).length).toBe(l.length);
    }
  });
  it('o perfil entra na nota (acima da técnica soma; abaixo tira)', () => {
    const v = aos(22);
    const e = { modalidade: 'volei', atributos: { ataque: 10, recepcao: 10, bloqueio: 10, saque: 10 } } as unknown as CarreiraEsportiva;
    const p = perfilDeAtributos(v, e, 70, undefined);
    expect(efeitoNaNota(p, 70)).toBeGreaterThan(1.5);
  });
});

describe('VIDA 25 · a formação registrada', () => {
  it('cada ano de base vira um registro com categoria, jogos, nota, colocação e avaliação; a fotografia do perfil também', () => {
    let v = aos(14);
    garantirFrente(v, 'futebol').habilidade = 70;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
    v = viver(v, 2);
    const e = v.caminhos.esporte ?? v.caminhos.carreirasEsportivas?.[0];
    const f = e?.formacao ?? [];
    expect(f.length).toBeGreaterThan(0);
    const a = f[0];
    expect(a.categoria).toMatch(/sub-1[57]/);
    expect(a.titular).toBeLessThanOrEqual(a.jogos);
    expect(a.colocacao).toBeGreaterThanOrEqual(1);
    expect(a.avaliacao.length).toBeGreaterThan(10);
    expect((e?.serieAtributos ?? []).length).toBeGreaterThan(0);
  });
});

describe('VIDA 25 · prêmios do futebol na escala do mundo', () => {
  it('a mesma temporada vale menos numa liga fraca do que numa das cinco grandes', () => {
    const base = { nome: 'x', clube: 'c', nac: 'BR', grupo: 'atacante' as const, idade: 25, gols: 20, golsLiga: 16, assist: 8, titularidade: 0.9, elite: true, titulos: { liga: false, cont: false, copa: false, mundial: false, continentalSel: false } };
    const forte = pontuacao('bola_de_ouro', { ...base, liga: 'GB', nota: 7.4 });
    const fraca = pontuacao('bola_de_ouro', { ...base, liga: 'BR', nota: 7.4 });
    expect(forte! - fraca!).toBeGreaterThan(0);
  });
});

describe('VIDA 25 · a CNH lembrada na hora certa', () => {
  it('antes da idade, nada; na idade, o motivo "idade"; com carteira, nada', () => {
    expect(lembrarDaCnh(aos(16))).toBeUndefined();
    const v = aos(18);
    expect(lembrarDaCnh(v)?.motivo).toBe('idade');
    v.trabalho.licencas.push('cnh');
    expect(lembrarDaCnh(v)).toBeUndefined();
  });
  it('com veículo e sem carteira, o motivo é o veículo', () => {
    const v = aos(30);
    v.financas.bens.push({ id: 'b', tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro', valor: 1, tCompra: v.t, estado: 80 } as never);
    expect(lembrarDaCnh(v)?.motivo).toBe('veiculo');
  });
  it('em processo de autoescola, nada', () => {
    const v = aos(18);
    v.processos.push({ tipo: 'cnh' } as never);
    expect(lembrarDaCnh(v)).toBeUndefined();
  });
});

void criarRng;
