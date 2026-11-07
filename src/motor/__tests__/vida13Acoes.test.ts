/**
 * VIDA 13 · Ações — o fluxo das decisões do ano, uma de cada vez, com o resultado imediato (`sistemas/desfecho13`).
 *
 *   apresenta → escolhe → executa → resultado (escolha, texto, conta, o que mudou, o que esperar) → só então a próxima,
 *   preparada com o estado de agora; "deixar o resto para depois"; salvar e recarregar no meio não refaz nada.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { idade, transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { CATALOGO } from '../conteudo/catalogo';
import { abrirProximaDaFila, familiaDe, preparar } from '../conteudo/motor';
import { interpretar } from '../save';
import { podeTentar } from '../plausibilidade';
import { filaDoAno13, normalizarVida13Acoes } from '../sistemas/desfecho13';
import { anotarDesfecho13, recolherDesfecho13 } from '../sistemas/anotar13';

/** Decisões sem papéis que cabem agora nesta vida, de famílias diferentes (como em `rework115Eventos`). */
function decisoesQueCabem(v: Vida, n: number): string[] {
  const out: string[] = [];
  const fams = new Set<string>();
  for (const c of CATALOGO) {
    if (c.tipo !== 'decisao' || c.papeis || c.manual || fams.has(familiaDe(c.id))) continue;
    if (!preparar(c, v, criarRng(1))) continue;
    out.push(c.id); fams.add(familiaDe(c.id));
    if (out.length >= n) break;
  }
  return out;
}
const primeira = (v: Vida) => v.momento!.opcoes.find(o => !o.bloqueio)!.id;

/** Um ano com três decisões: a primeira aberta, duas esperando (a última urgente, se pedido). */
function anoCom3(urgente = false): { v: Vida; ids: string[] } {
  const v0 = adulto(34, { semente: 7 });
  const ids = decisoesQueCabem(v0, 3);
  expect(ids.length).toBe(3);
  const v = transacao(v0, x => {
    x.momento = null;
    x.fila = [{ id: ids[0], t: x.t, papeis: {}, prioridade: 3 }, { id: ids[1], t: x.t, papeis: {}, prioridade: 2 }, { id: ids[2], t: x.t, papeis: {}, prioridade: 1, ...(urgente ? { urgente: true } : {}) }];
    abrirProximaDaFila(x);
  }).vida;
  expect(v.momento?.situacaoId).toBe(ids[0]);
  return { v, ids };
}
const decidir = (v: Vida) => executar(v, { tipo: 'decidir', opcaoId: primeira(v), umaPorVez: true, momentoId: v.momento!.id });

describe('VIDA 13 · ações anuais uma de cada vez', () => {
  it('sem o pedido da tela, o motor segue como antes (a próxima abre na hora)', () => {
    const { v, ids } = anoCom3();
    const r = executar(v, { tipo: 'decidir', opcaoId: primeira(v) });
    expect(r.vida.momento?.situacaoId).toBe(ids[1]);
    expect(r.vida.desfecho13).toBeUndefined();
  });

  it('o resultado aparece antes da próxima: o que foi escolhido, o que aconteceu, quantas faltam', () => {
    const { v, ids } = anoCom3();
    const escolhida = v.momento!.opcoes.find(o => !o.bloqueio)!;
    const r = decidir(v);
    expect(r.vida.momento).toBeNull();
    const d = r.vida.desfecho13!;
    expect(d.titulo).toBe(v.momento!.titulo.replace(/ · .*$/, ''));
    expect(d.escolha).toBe(escolhida.texto);
    expect(d.texto).toBe(r.resultado);
    expect(d.restantes).toBe(2);
    expect(r.desfecho).toEqual(d);
    // A fila espera intacta (nada da próxima foi aberto, nem registrado).
    expect(r.vida.fila?.map(x => x.id)).toEqual([ids[1], ids[2]]);
    expect(r.vida.ocorrencias.some(o => o.id === ids[1] && o.t === r.vida.t)).toBe(false);
    // Com o resultado na tela, o ano não anda por cima: avançar abre a próxima.
    const t = r.vida.t;
    const av = avancarAno(r.vida);
    expect(av.vida.t).toBe(t);
    expect(av.vida.momento?.situacaoId).toBe(ids[1]);
    expect(av.vida.desfecho13).toBeUndefined();
  });

  it('seguir abre a próxima com o estado de AGORA (o que deixou de caber não abre)', () => {
    const { v, ids } = anoCom3();
    let w = decidir(v).vida;
    const s = executar(w, { tipo: 'desfecho13', oque: 'seguir' });
    expect(s.vida.momento?.situacaoId).toBe(ids[1]);
    expect(s.vida.desfecho13).toBeUndefined();
    // Se, entre uma e outra, a próxima deixou de caber (já aconteceu neste ano), ela não abre: vem a seguinte.
    w = transacao(w, x => { x.ocorrencias.push({ id: ids[1], t: x.t, idade: idade(x) }); }).vida;
    const s2 = executar(w, { tipo: 'desfecho13', oque: 'seguir' });
    expect(s2.vida.momento?.situacaoId).toBe(ids[2]);
  });

  it('o ano inteiro: três resultados vistos, um por um', () => {
    let { v } = anoCom3();
    const vistos: string[] = [];
    while (v.momento) {
      const r = decidir(v);
      vistos.push(r.vida.desfecho13!.texto);
      v = executar(r.vida, { tipo: 'desfecho13', oque: 'seguir' }).vida;
    }
    expect(vistos.length).toBe(3);
    expect(v.fila).toBeUndefined();
    expect(v.desfecho13).toBeUndefined();
    const t = v.t;
    expect(avancarAno(v).vida.t).toBe(t + 12);
  });

  it('salvar e recarregar no meio: o mesmo resultado volta, e nada é executado duas vezes', () => {
    const { v, ids } = anoCom3();
    const momentoId = v.momento!.id;
    const r = decidir(v);
    const recarregada = interpretar(JSON.stringify(r.vida));
    expect(recarregada.tipo).toBe('ok');
    const w = (recarregada as { vida: Vida }).vida;
    expect(w.desfecho13).toEqual(r.vida.desfecho13);
    expect(w.momento).toBeNull();
    // O clique repetido na decisão já tomada (antes ou depois de recarregar) não faz nada.
    expect(podeTentar(disponibilidade(w, { tipo: 'decidir', opcaoId: 'x', momentoId }))).toBe(false);
    expect(executar(w, { tipo: 'decidir', opcaoId: primeira(v), umaPorVez: true, momentoId }).vida).toBe(w);
    const bio = w.biografia.length, conta = w.financas.conta;
    const s = executar(w, { tipo: 'desfecho13', oque: 'seguir' });
    expect(s.vida.momento?.situacaoId).toBe(ids[1]);
    // Seguir duas vezes (o duplo toque, a aba recarregada) não pula a próxima.
    expect(executar(s.vida, { tipo: 'desfecho13', oque: 'seguir' }).vida).toBe(s.vida);
    // A decisão aberta não aceita a escolha pensada para a anterior.
    expect(podeTentar(disponibilidade(s.vida, { tipo: 'decidir', opcaoId: primeira(s.vida), momentoId }))).toBe(false);
    expect(s.vida.biografia.length).toBe(bio);
    expect(s.vida.financas.conta).toBe(conta);
    expect(s.vida.ocorrencias.filter(o => o.id === ids[0] && o.t === s.vida.t).length).toBe(1);
  });

  it('deixar o resto para depois: as que podem esperar vão para o ano que vem (uma vez); a urgente fica', () => {
    const { v, ids } = anoCom3(true);
    const w = decidir(v).vida;
    expect(filaDoAno13(w)).toEqual({ restantes: 2, urgentes: 1 });
    const e = executar(w, { tipo: 'desfecho13', oque: 'encerrar' });
    expect(e.vida.momento?.situacaoId).toBe(ids[2]);
    expect(e.vida.fila).toEqual([expect.objectContaining({ id: ids[1], t: w.t + 12, adiada: true })]);
    expect(e.aviso?.texto).toMatch(/ano que vem/);
    expect(e.aviso?.texto).toMatch(/não pode esperar/);
  });

  it('deixar para depois o que já tinha esperado um ano: sai da pauta; o ano anda', () => {
    const { v, ids } = anoCom3();
    let w = decidir(v).vida;
    w = transacao(w, x => { x.fila = x.fila!.map(f => ({ ...f, adiada: true })); }).vida;
    const e = executar(w, { tipo: 'desfecho13', oque: 'encerrar' });
    expect(e.vida.momento).toBeNull();
    expect(e.vida.fila).toBeUndefined();
    expect(e.aviso?.texto).toMatch(/saem da pauta/);
    expect(e.vida.ocorrencias.some(o => (o.id === ids[1] || o.id === ids[2]) && o.t === w.t)).toBe(false);
    expect(avancarAno(e.vida).vida.t).toBe(w.t + 12);
    // Sem nada esperando, "encerrar" não existe.
    expect(podeTentar(disponibilidade(executar(decidir(anoCom3().v).vida, { tipo: 'desfecho13', oque: 'seguir' }).vida, { tipo: 'desfecho13', oque: 'encerrar' }))).toBe(false);
  });

  it('o resultado de uma ação comum diz o que saiu da conta e como ela ficou', () => {
    let v = adulto(34, { semente: 9 });
    v = transacao(v, x => { x.financas.conta = 50_000; }).vida;
    const r = executar(v, { tipo: 'investir', destino: 'reserva', valor: 10_000 });
    expect(r.vida).not.toBe(v);
    expect(r.desfecho?.conta).toEqual({ antes: 50_000, depois: r.vida.financas.conta });
    expect(r.desfecho!.conta!.depois).toBeLessThan(50_000);
    // Sem decisão atrás dele, o resultado não fica guardado na vida.
    expect(r.vida.desfecho13).toBeUndefined();
  });

  it('a anotação dos sistemas (o que esperar, o que mudou) só vale dentro da ação', () => {
    anotarDesfecho13({ esperado: 'fora' });
    const x = recolherDesfecho13(() => { anotarDesfecho13({ esperado: 'No fechamento do ano.' }); anotarDesfecho13({ esperado: 'No fechamento do ano.', mudou: '+1 linha' }); return 7; });
    expect(x).toEqual({ valor: 7, esperado: ['No fechamento do ano.'], mudou: ['+1 linha'] });
    expect(recolherDesfecho13(() => 0).esperado).toEqual([]);
  });

  it('saves: o resultado de outro ano, ou mal formado, não fica pendurado', () => {
    const v = adulto(30, { semente: 3 });
    v.desfecho13 = { t: v.t - 12, titulo: 'x', texto: 'y' };
    normalizarVida13Acoes(v);
    expect(v.desfecho13).toBeUndefined();
    v.desfecho13 = { t: v.t, titulo: 'x' } as never;
    normalizarVida13Acoes(v);
    expect(v.desfecho13).toBeUndefined();
    v.desfecho13 = { t: v.t, titulo: 'x', texto: 'y' };
    normalizarVida13Acoes(v);
    expect(v.desfecho13).toBeDefined();
  });
});
