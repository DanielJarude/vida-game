/**
 * VIDA 29 · §11.1 — uma trajetória rural inteira, pelas ações do jogo e pela virada de ano de verdade: comprar um sítio,
 * plantar, acompanhar, colher e vender (o fechamento do ano e a venda antecipada), criar, comprar equipamento (e a
 * empreitada), contratar, financiar (o custeio do Plano Safra), enfrentar uma perda, recuperar o solo, vender a área.
 * Cada passo confere o estado persistido e o dinheiro na conta de sempre (nenhuma contabilidade paralela).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import type { Vida } from '../tipos';
import { ofertasRurais } from '../v18/rural/acoes18';
import { acharPropriedade, todasAsPropriedades } from '../v18/rural/fazenda18';
import { diagnosticoDaPropriedade } from '../v18/rural/diagnostico29';

const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };
const r = (v: Vida, oque: Record<string, unknown>) => { const a = { tipo: 'rural18', oque } as Parameters<typeof executar>[1]; const d = disponibilidade(v, a); expect(podeTentar(d) ? 'ok' : `${JSON.stringify(oque)}: ${(d as { motivo?: string }).motivo}`).toBe('ok'); return executar(v, a).vida; };

describe('VIDA 29 · trajetória do sítio', () => {
  it('compra, planta, cria, contrata, financia, perde, recupera e vende — tudo na conta de sempre e no save', () => {
    let v = structuredClone(adulto(32, { semente: 2929, municipioId: 'londrina-pr' }));
    v.financas.conta = 4_000_000; v.financas.negativado = false; v.financas.dividas = [];
    // 1. Comprar um sítio pequeno.
    const o = ofertasRurais(v).find(x => x.p.tipo === 'sitio')!;
    const conta0 = v.financas.conta;
    v = r(v, { op: 'comprar', oferta: o.id });
    expect(v.financas.conta).toBe(conta0 - o.preco);
    const id = todasAsPropriedades(v).find(x => x.imovel)!.p.id;
    const P = () => acharPropriedade(v, id)!.p;
    if (P().uso !== 'producao') v = r(v, { op: 'uso', id, uso: 'producao' });
    P().talhoes = []; P().rebanhos = [];
    // 2. Plantar feijão e milho; criar galinhas; a máquina por empreitada; um trabalhador; assistência técnica.
    const livre = acharPropriedade(v, id)!.p.ha * 0.5;
    v = r(v, { op: 'plantar', id, cultura: 'feijao', ha: Math.max(0.5, Math.round(livre * 0.4 * 10) / 10) });
    v = r(v, { op: 'plantar', id, cultura: 'milho', ha: Math.max(0.5, Math.round(livre * 0.4 * 10) / 10) });
    // Comprar equipamento: o aviário (sem ele, o teto é de 200 aves) — e só então o lote.
    v = r(v, { op: 'construir', id, estrutura: 'aviario' });
    v = r(v, { op: 'animais', id, especie: 'galinhas', lotes: 1 });
    v = r(v, { op: 'empreitada29', id });
    v = r(v, { op: 'admin29', id, admin: 'voce' });
    v = r(v, { op: 'equipe29', id, n: 1 });
    v = r(v, { op: 'assistencia29', id });
    expect(P().talhoes.length).toBe(2);
    expect(P().rebanhos.some(x => x.especie === 'galinhas')).toBe(true);
    // 3. Financiar: o custeio do Plano Safra (precisa do CAR).
    const agro = (oque: Record<string, unknown>) => { const a = { tipo: 'agro19', oque } as Parameters<typeof executar>[1]; if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida; };
    agro({ op: 'car', id });
    agro({ op: 'credito', id });
    const temCusteio = !!P().safra19;
    // 4. Acompanhar e colher: a virada de ano fecha a safra (uma vez), com as linhas novas (equipe, empreitada, assistência).
    const antes = v.financas.conta;
    v = ano(v);
    const h1 = P().historico[P().historico.length - 1];
    expect(h1.ano).toBe(anoDe(v.t) - 1);
    expect(h1.resultado).toBe(h1.receita - h1.custo);
    expect(h1.linhas.some(l => /Equipe fixa/.test(l.oque))).toBe(true);
    expect(h1.linhas.some(l => /empreitada/.test(l.oque))).toBe(true);
    expect(h1.linhas.some(l => /Assistência técnica/.test(l.oque))).toBe(true);
    expect(v.financas.conta).not.toBe(antes);
    // 5. Uma perda: o solo cai (o diagnóstico vira problema) — e a recuperação pela ação de correção.
    P().solo = 38; P().tRecuperacao = undefined;
    expect(diagnosticoDaPropriedade(v, P()).find(i => i.id === 'solo')!.estado).toBe('ruim');
    v = r(v, { op: 'solo', id });
    expect(P().solo).toBe(54);
    // 6. Vender na feira (o feijão é de feira) e mais um ano.
    v = r(v, { op: 'venda29', id, venda: 'feira' });
    v = ano(v);
    const h2 = P().historico[P().historico.length - 1];
    expect(h2.linhas.some(l => /feira/.test(l.nota ?? '') || /Banca na feira/.test(l.oque))).toBe(true);
    // O custeio, se tomado, venceu e foi quitado ou cobrado pela conta (nada fica pendurado sem registro).
    if (temCusteio) expect(P().safra19 === undefined || P().safra19!.vence >= anoDe(v.t) - 1).toBe(true);
    // 7. O save guarda tudo (as escolhas novas e o histórico) e reabre igual.
    const lido = interpretar(JSON.stringify(v));
    if (lido.tipo !== 'ok') throw new Error('save');
    const q = acharPropriedade(lido.vida, id)!.p;
    expect(q.admin29).toBe('voce'); expect(q.equipe29).toBe(1); expect(q.empreitada29).toBe(true); expect(q.venda29).toBe('feira');
    expect(q.historico.length).toBe(P().historico.length);
    // 8. Vender uma parte da área (livre): o dinheiro entra.
    P().talhoes = [];
    const c2 = v.financas.conta;
    const passo = Math.max(1, Math.round(P().ha * 0.2));
    v = r(v, { op: 'reduzir', id, ha: passo });
    expect(v.financas.conta).toBeGreaterThan(c2);
  });
});
