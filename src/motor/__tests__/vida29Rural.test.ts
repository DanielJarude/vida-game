/** VIDA 29 · a fazenda para gente comum: quem administra, a equipe, a empreitada, a venda, o leilão e o diagnóstico em linguagem simples. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { anoDe } from '../tempo';
import type { Vida } from '../tipos';
import { ofertasRurais } from '../v18/rural/acoes18';
import {
  competenciaDaGestao, custosFixos, efeitoDaVenda29, fatorDePreco, maoDeObra29, quemAdministra, simularAno, tecnologia, todasAsPropriedades, trabalhoNecessario,
  type PropriedadeRural18
} from '../v18/rural/fazenda18';
import { decisoesRecomendadas, diagnosticoDaPropriedade, situacaoDaPropriedade } from '../v18/rural/diagnostico29';

const rico = (semente = 1) => { const v = structuredClone(adulto(35, { semente })); v.financas.conta = 30_000_000; v.financas.negativado = false; return v; };
const comprar = (v: Vida, tipo: string) => { const o = ofertasRurais(v).find(x => x.p.tipo === tipo)!; return executar(v, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }).vida; };
const prop = (v: Vida) => todasAsPropriedades(v).find(x => x.imovel)!.p;
const r = (v: Vida, oque: Record<string, unknown>) => executar(v, { tipo: 'rural18', oque } as Parameters<typeof executar>[1]).vida;
const pode = (v: Vida, oque: Record<string, unknown>) => podeTentar(disponibilidade(v, { tipo: 'rural18', oque } as Parameters<typeof executar>[1]));

/** Uma fazenda agrícola em produção, com soja plantada. */
function lavoura(semente = 1): Vida {
  let v = comprar(rico(semente), 'agricola');
  const p = prop(v);
  if (p.uso !== 'producao') v = r(v, { op: 'uso', id: p.id, uso: 'producao' });
  const q = prop(v);
  if (!q.talhoes.some(t => t.cultura === 'soja')) v = r(v, { op: 'plantar', id: q.id, cultura: 'soja', ha: Math.max(1, Math.floor(q.talhoes.length ? 5 : 20)) });
  return v;
}

describe('VIDA 29 · administração e equipe têm efeito real no motor', () => {
  it('sem escolha nenhuma (save antigo), a conta é a de antes: competência 45, sem linhas novas', () => {
    const v = lavoura();
    const p = prop(v);
    expect(p.admin29).toBeUndefined();
    expect(competenciaDaGestao(v, p)).toBe(45);
    const linhas = custosFixos(v, p, anoDe(v.t)).map(l => l.oque).join('|');
    expect(linhas).not.toMatch(/Equipe|empreitada|Assistência|Administradora/);
  });

  it('a administradora conduz melhor e custa por hectare; você mesmo, de graça, conduz pelo que sabe', () => {
    let v = lavoura();
    const id = prop(v).id;
    const antes = simularAno(v, prop(v), anoDe(v.t), { prever: true, clima: { tipo: 'normal', texto: '', severidade: 0 } });
    v = r(v, { op: 'admin29', id, admin: 'empresa' });
    expect(prop(v).admin29).toBe('empresa');
    expect(quemAdministra(v, prop(v))).toBe('empresa');
    expect(competenciaDaGestao(v, prop(v))).toBe(58);
    expect(custosFixos(v, prop(v), anoDe(v.t)).some(l => l.oque === 'Administradora rural')).toBe(true);
    const depois = simularAno(v, prop(v), anoDe(v.t), { prever: true, clima: { tipo: 'normal', texto: '', severidade: 0 } });
    const receita = (s: typeof antes) => s.talhoes.reduce((x, t) => x + t.receita, 0);
    expect(receita(depois)).toBeGreaterThan(receita(antes));
    if (pode(v, { op: 'admin29', id, admin: 'voce' })) {
      v = r(v, { op: 'admin29', id, admin: 'voce' });
      expect(custosFixos(v, prop(v), anoDe(v.t)).some(l => /Gerente|Caseiro|Administradora/.test(l.oque))).toBe(false);
    }
    // De volta ao automático: o campo some (o save fica como era).
    v = r(v, { op: 'admin29', id, admin: 'auto' });
    expect(prop(v).admin29).toBeUndefined();
  });

  it('caseiro não toca fazenda grande; você nas horas vagas, só até 200 ha', () => {
    const v = lavoura();
    const p = prop(v);
    if (p.ha > 100) expect(pode(v, { op: 'admin29', id: p.id, admin: 'caseiro' })).toBe(false);
    if (p.ha > 200) expect(pode(v, { op: 'admin29', id: p.id, admin: 'voce' })).toBe(false);
  });

  it('a equipe custa salário de verdade, baixa o custo da lavoura e, curta demais, perde colheita', () => {
    // Um sítio com uma horta grande: pede muita gente.
    let v = comprar(rico(2), 'sitio');
    const id = prop(v).id;
    if (prop(v).uso !== 'producao') v = r(v, { op: 'uso', id, uso: 'producao' });
    prop(v).talhoes = [];
    v = r(v, { op: 'plantar', id, cultura: 'horta', ha: Math.min(6, Math.floor(prop(v).ha * 0.5)) });
    const p0 = prop(v);
    expect(p0.talhoes.some(t => t.cultura === 'horta')).toBe(true);
    const precisa = trabalhoNecessario(p0);
    expect(precisa).toBeGreaterThan(2);
    // Com gerente (que não pega na enxada), a equipe é toda a mão de obra.
    v = r(v, { op: 'admin29', id, admin: 'gerente' });
    const conta = v.financas.conta;
    v = r(v, { op: 'equipe29', id, n: 1 });
    expect(v.financas.conta).toBeLessThan(conta);
    expect(maoDeObra29(v, prop(v)).cobertura).toBeLessThan(0.8);
    const clima = { tipo: 'normal' as const, texto: '', severidade: 0 };
    const curta = simularAno(v, prop(v), anoDe(v.t), { prever: true, clima });
    expect(curta.linhas.some(l => /faltou gente/.test(l.nota ?? ''))).toBe(true);
    expect(custosFixos(v, prop(v), anoDe(v.t)).some(l => /Equipe fixa \(1 trabalhador/.test(l.oque))).toBe(true);
    v = r(v, { op: 'equipe29', id, n: Math.ceil(precisa) });
    const cheia = simularAno(v, prop(v), anoDe(v.t), { prever: true, clima });
    expect(cheia.linhas.some(l => /faltou gente/.test(l.nota ?? ''))).toBe(false);
    const horta = (s: typeof cheia) => s.talhoes[prop(v).talhoes.findIndex(t => t.cultura === 'horta')];
    expect(horta(cheia).receita).toBeGreaterThan(horta(curta).receita);
    // Dispensar tudo volta aos diaristas (e paga as rescisões).
    const c2 = v.financas.conta;
    v = r(v, { op: 'equipe29', id, n: 0 });
    expect(prop(v).equipe29).toBeUndefined();
    expect(v.financas.conta).toBeLessThan(c2);
  });

  it('a empreitada dá tecnologia sem comprar máquina, e cobra por hectare plantado', () => {
    let v = lavoura();
    const id = prop(v).id;
    prop(v).maquinas = [];
    expect(tecnologia(prop(v))).toBe(0);
    v = r(v, { op: 'empreitada29', id });
    expect(tecnologia(prop(v))).toBeGreaterThanOrEqual(1.2);
    expect(custosFixos(v, prop(v), anoDe(v.t)).some(l => /empreitada/.test(l.oque))).toBe(true);
  });
});

describe('VIDA 29 · como vender', () => {
  const t = (p: PropriedadeRural18) => p.talhoes.find(x => x.cultura === 'soja')!;
  it('contrato trava o preço (o fator do ano some); a quebra grande obriga a comprar o que faltou', () => {
    let v = lavoura();
    const id = prop(v).id;
    v = r(v, { op: 'venda29', id, venda: 'contrato' });
    const p = prop(v);
    const ano = anoDe(v.t);
    const f = fatorDePreco('soja', ano);
    const normal = efeitoDaVenda29(p, t(p), ano, { tipo: 'normal', texto: '', severidade: 0 }, 100000);
    expect(normal.receita).toBe(Math.round(100000 * 0.97 / f));
    const seca = efeitoDaVenda29(p, t(p), ano, { tipo: 'seca', texto: '', severidade: 0.38 }, 100000);
    expect(seca.receita).toBeLessThan(normal.receita);
    expect(seca.nota).toMatch(/quebra/);
  });

  it('armazém espera a entressafra (nunca abaixo do preço do dia) e paga aluguel; feira só para o que é de feira', () => {
    let v = lavoura();
    const id = prop(v).id;
    prop(v).estruturas = prop(v).estruturas.filter(e => e.id !== 'silo');
    v = r(v, { op: 'venda29', id, venda: 'armazem' });
    const p = prop(v);
    const e = efeitoDaVenda29(p, t(p), anoDe(v.t), { tipo: 'normal', texto: '', severidade: 0 }, 100000);
    expect(e.receita).toBeGreaterThan(100000);
    expect(e.custo).toBeGreaterThan(0);
    // Soja não se vende em feira: só com horta/fruta plantada a opção abre.
    if (!p.talhoes.some(x => ['horta', 'frutas', 'uva', 'mandioca', 'feijao', 'acai'].includes(x.cultura))) expect(pode(v, { op: 'venda29', id, venda: 'feira' })).toBe(false);
  });

  it('com contrato, a safra não aparece para "a hora de vender" (já está vendida)', async () => {
    const { safrasAVenda18 } = await import('../v18/rural/fazenda18');
    let v = lavoura();
    v = r(v, { op: 'venda29', id: prop(v).id, venda: 'contrato' });
    expect(safrasAVenda18(v).some(x => x.p.id === prop(v).id)).toBe(false);
  });
});

describe('VIDA 29 · leilão de animais', () => {
  it('vende ao lance do dia (estável na mesma vida), menos a comissão; uma vez por ano por criação', () => {
    let v = comprar(rico(3), 'pecuaria');
    let p = prop(v);
    if (p.uso !== 'producao') { v = r(v, { op: 'uso', id: p.id, uso: 'producao' }); p = prop(v); }
    if (!p.rebanhos.some(x => x.especie === 'corte')) { v = r(v, { op: 'animais', id: p.id, especie: 'corte', lotes: 3 }); p = prop(v); }
    const antes = p.rebanhos.find(x => x.especie === 'corte')!.cabecas;
    const conta = v.financas.conta;
    v = r(v, { op: 'leilao29', id: p.id, especie: 'corte', fracao: 0.25 });
    expect(prop(v).rebanhos.find(x => x.especie === 'corte')!.cabecas).toBe(antes - Math.max(1, Math.round(antes * 0.25)));
    expect(v.financas.conta).toBeGreaterThan(conta);
    expect(pode(v, { op: 'leilao29', id: p.id, especie: 'corte', fracao: 0.25 })).toBe(false);
  });
});

describe('VIDA 29 · o diagnóstico em linguagem simples', () => {
  it('cada indicador explica o que significa, o efeito, o que acontece se piorar; nada de "UA" solto no resumo', () => {
    let v = comprar(rico(3), 'pecuaria');
    const p = prop(v);
    if (p.uso !== 'producao') v = r(v, { op: 'uso', id: p.id, uso: 'producao' });
    const ind = diagnosticoDaPropriedade(v, prop(v));
    expect(ind.length).toBeGreaterThanOrEqual(5);
    for (const i of ind) {
      expect(i.resumo.length).toBeGreaterThan(10);
      expect(i.significa.length).toBeGreaterThan(30);
      expect(i.efeito.length).toBeGreaterThan(10);
      expect(i.sePiorar.length).toBeGreaterThan(20);
      expect(i.resumo).not.toMatch(/\bUA\b/);
    }
    const pasto = ind.find(i => i.id === 'pasto');
    if (pasto) expect(pasto.resumo).toMatch(/sustenta cerca de [\d.]+/);
    expect(situacaoDaPropriedade(ind).frase.length).toBeGreaterThan(5);
  });

  it('o pasto lotado vira problema, e a decisão recomendada é uma ação que o jogo aceita', () => {
    let v = comprar(rico(3), 'pecuaria');
    let p = prop(v);
    if (p.uso !== 'producao') { v = r(v, { op: 'uso', id: p.id, uso: 'producao' }); p = prop(v); }
    if (!p.rebanhos.some(x => x.especie === 'corte')) { v = r(v, { op: 'animais', id: p.id, especie: 'corte', lotes: 1 }); p = prop(v); }
    p.rebanhos.find(x => x.especie === 'corte')!.cabecas = 50_000;
    const ind = diagnosticoDaPropriedade(v, p);
    expect(ind.find(i => i.id === 'pasto')!.estado).toBe('ruim');
    const d = decisoesRecomendadas(ind);
    expect(d.length).toBeGreaterThan(0);
    const comAcao = d.filter(x => x.acao);
    expect(comAcao.length).toBeGreaterThan(0);
    expect(comAcao.some(x => podeTentar(disponibilidade(v, x.acao!)))).toBe(true);
  });

  it('solo cansado: explica quanto rende e oferece a correção com custo e prazo', () => {
    const v = lavoura();
    const p = prop(v);
    p.solo = 40;
    p.tRecuperacao = undefined;
    const solo = diagnosticoDaPropriedade(v, p).find(i => i.id === 'solo')!;
    expect(solo.estado).toBe('ruim');
    expect(solo.resumo).toMatch(/perdendo qualidade/);
    expect(solo.efeito).toMatch(/rende cerca de \d+%/);
    const corr = solo.fazer.find(f => f.acao)!;
    expect(corr.custo).toBeGreaterThan(0);
    expect(corr.tempo).toMatch(/safra seguinte/);
  });
});
