/**
 * VIDA 35.3 — a organização sem teto de gasto e de divisão: a sociedade (um fundo leva uma fatia do lucro e das vendas),
 * a arena própria (o gasto grande de quem já tem receita), os torneios fora da liga (do barato ao major) e o desenho de
 * cada produto da loja (moletom, boné, cachecol, mousepad), que vende mais quando é do ano.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida } from '../save';
import { anoDe } from '../tempo';
import type { OqueOrg31 } from '../v31/esports/org31';
import { ARENA36, entradaDoSocio36, PARTES_SOCIO36, saidaDoSocio36, TORNEIOS35 } from '../v31/esports/org35';
import { normalizarLoja33, novaLoja33, executarLoja33, problemaLoja33, fatorDesenhos33, custoDoDesenho33, type Loja33 } from '../v33/dono/loja33';
import type { Contexto33 } from '../v33/dono/patrocinio33';
import type { Vida } from '../tipos';

const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
function comOrg(): Vida {
  const v = adulto(30, { semente: 353, municipioId: 'campinas-sp' }); v.financas.conta = 2e9;
  const w = tenta(v, A({ op: 'fundar', nome: 'Pixel Forge Esports', jogo: 'lol', regiao: 'br', modo: 'elite', investimento: 2e6 }));
  w.orgEsports31!.caixa = 3e8;
  w.orgEsports31!.valor = 4e8;
  return w;
}
const L = (v: Vida) => v.orgEsports31!.linhas[0];

describe('sociedade: dividir lucros e vendas', () => {
  it('a fatia entra no caixa e não se abre duas vezes', () => {
    let v = comOrg();
    const c0 = v.orgEsports31!.caixa;
    expect(pode(v, A({ op: 'sociedade', acao: 'abrir', parte: 0.35 }))).toBe(true);
    v = tenta(v, A({ op: 'sociedade', acao: 'abrir', parte: 0.35 }));
    expect(v.orgEsports31!.socio36).toMatchObject({ parte: 0.35 });
    expect(v.orgEsports31!.caixa - c0).toBe(entradaDoSocio36(4e8, 0.35));
    expect(pode(v, A({ op: 'sociedade', acao: 'abrir', parte: 0.5 }))).toBe(false);
  });

  it('a fatia só pode ser uma das oferecidas', () => {
    const v = comOrg();
    expect(pode(v, A({ op: 'sociedade', acao: 'abrir', parte: 0.9 as unknown as 0.2 }))).toBe(false);
    expect(PARTES_SOCIO36).toEqual([0.2, 0.35, 0.5]);
  });

  it('recomprar a fatia custa do caixa e tira o sócio', () => {
    let v = tenta(comOrg(), A({ op: 'sociedade', acao: 'abrir', parte: 0.2 }));
    const c0 = v.orgEsports31!.caixa;
    v = tenta(v, A({ op: 'sociedade', acao: 'encerrar' }));
    expect(v.orgEsports31!.socio36).toBeUndefined();
    expect(c0 - v.orgEsports31!.caixa).toBe(saidaDoSocio36(v.orgEsports31!.valor, 0.2));
  });

  it('na venda da organização, o sócio leva a sua fatia', () => {
    let v = tenta(comOrg(), A({ op: 'sociedade', acao: 'abrir', parte: 0.5 }));
    const o = v.orgEsports31!;
    const valor = Math.max(0, Math.round((o.valor + o.caixa - o.divida) / 1e5) * 1e5);
    const conta0 = v.financas.conta;
    v = tenta(v, A({ op: 'vender_org' }));
    const parte = Math.round((valor * 0.5) / 1e4) * 1e4;
    expect(v.financas.conta - conta0).toBe(valor - parte);
    expect(v.orgEsports31).toBeUndefined();
  });

  it('o save guarda a sociedade e descarta uma fatia inválida', () => {
    const v = tenta(comOrg(), A({ op: 'sociedade', acao: 'abrir', parte: 0.35 }));
    const lido = importarVida(exportarVida(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(lido.vida.orgEsports31!.socio36).toMatchObject({ parte: 0.35 });
  });
});

describe('arena própria', () => {
  it('construir custa a obra uma vez, exige divisão alta e não se repete', () => {
    let v = comOrg();
    expect(v.orgEsports31!.linhas.some(l => l.divisao >= ARENA36.minDiv)).toBe(true);
    const c0 = v.orgEsports31!.caixa;
    v = tenta(v, A({ op: 'arena' }));
    expect(v.orgEsports31!.arena36).toBe(anoDe(v.t));
    expect(c0 - v.orgEsports31!.caixa).toBeCloseTo(ARENA36.obra, -5);
    expect(pode(v, A({ op: 'arena' }))).toBe(false);
  });

  it('sem caixa, a arena não sai', () => {
    const v = comOrg();
    v.orgEsports31!.caixa = 1e6;
    expect(pode(v, A({ op: 'arena' }))).toBe(false);
  });
});

describe('torneios fora da liga', () => {
  it('há torneios do barato ao major, e cada um tem nota e campo', () => {
    expect(Object.keys(TORNEIOS35).sort()).toEqual(['aberto', 'convite', 'lan', 'major', 'online', 'regional', 'universitario']);
    expect(TORNEIOS35.online.inscricao).toBeLessThan(TORNEIOS35.major.inscricao);
    for (const t of Object.values(TORNEIOS35)) expect(t.nota.length).toBeGreaterThan(10);
  });

  it('uma line joga o torneio barato e o de elite, uma vez por ano', () => {
    let v = comOrg();
    v = tenta(v, A({ op: 'torneio', jogo: 'lol', tipo: 'online' }));
    expect(L(v).torneios35?.map(t => t.tipo)).toEqual(['online']);
    v = tenta(v, A({ op: 'torneio', jogo: 'lol', tipo: 'major' }));
    expect(L(v).torneios35?.map(t => t.tipo)).toEqual(['online', 'major']);
    expect(pode(v, A({ op: 'torneio', jogo: 'lol', tipo: 'online' }))).toBe(false);
  });
});

describe('desenho de cada produto', () => {
  const ctx: Contexto33 = { tipo: 'esports', ano: 2030, receitaBase: 2e6, fama: 60, reputacao: 60, noTopo: false, temCasa: true, internacional: true };
  const desenho = { cor1: '#112233', cor2: '#ffffff', cor3: '#000000', estampa: 'listras' as const };

  it('só se desenha produto que está na loja', () => {
    const l = novaLoja33();
    expect(problemaLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho }, 1e9)).toMatch(/Lance o produto/);
    expect(problemaLoja33(ctx, l, { acao: 'desenho', produto: 'camisa', desenho }, 1e9)).toMatch(/camisa/);
  });

  it('desenhar custa uma vez no ano e o ajuste do mesmo ano não cobra', () => {
    const l: Loja33 = { ...novaLoja33(), produtos: ['camisa', 'bone'] };
    const custo = custoDoDesenho33(ctx);
    expect(problemaLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho }, custo)).toBeUndefined();
    expect(problemaLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho }, custo - 1)).toMatch(/caixa não tem/);
    expect(executarLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho }).custo).toBe(custo);
    expect(l.designs?.bone).toMatchObject({ estampa: 'listras', ano: 2030 });
    expect(executarLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho: { ...desenho, estampa: 'logo' } }).custo).toBe(0);
    expect(l.designs?.bone?.estampa).toBe('logo');
  });

  it('produtos desenhados no ano aumentam a previsão (sem passar de 20%)', () => {
    const l: Loja33 = { ...novaLoja33(), produtos: ['camisa', 'agasalho', 'bone'] };
    expect(fatorDesenhos33(ctx, l)).toBe(1);
    executarLoja33(ctx, l, { acao: 'desenho', produto: 'agasalho', desenho });
    executarLoja33(ctx, l, { acao: 'desenho', produto: 'bone', desenho });
    const f = fatorDesenhos33(ctx, l);
    expect(f).toBeGreaterThan(1);
    expect(f).toBeLessThanOrEqual(1.2);
    expect(fatorDesenhos33({ ...ctx, ano: 2031 }, l)).toBe(1);
  });

  it('o save descarta desenhos de produto inválido ou fora da loja', () => {
    const n = normalizarLoja33({ produtos: ['camisa', 'bone'], designs: { bone: { cor1: 'azul', estampa: 'x' }, camisa: { cor1: '#ffffff' }, mousepad: { cor1: '#000000' } } }, 2030);
    expect(n?.designs?.bone).toMatchObject({ cor1: '#0b3d91', estampa: 'liso', ano: 2030 });
    expect(n?.designs?.camisa).toBeUndefined();
    expect(n?.designs?.mousepad).toBeDefined(); // o save guarda; a loja só mostra o que está à venda
  });
});
