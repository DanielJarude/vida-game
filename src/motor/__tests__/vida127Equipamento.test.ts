/**
 * VIDA 12.7 — o produto escolhido é o produto vestido. Antes, pôr (ou tirar) uma peça — e até cortar o cabelo — marcava
 * "em uso" TODAS as peças com o mesmo desenho do retrato (os quatro óculos escuros, as sete roupas "básicas"), e o
 * retrato mostrava a primeira do inventário; a figura de corpo inteiro, a última.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { ITENS_ESTILO, itemEstilo, lugaresDoItem } from '../dados/estilo';
import { sincronizarVisual } from '../sistemas/estilo';
import type { ItemDeEstilo, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), `${JSON.stringify(a)} ${JSON.stringify(disponibilidade(v, a))}`).toBe(true); return executar(v, a).vida; };
const emUso = (v: Vida) => (v.eu.estilo?.itens ?? []).filter(x => x.usando);
const meu = (v: Vida, itemId: string) => v.eu.estilo!.itens.find(x => x.itemId === itemId)!;
const vestir = (v: Vida, itemId: string) => (meu(v, itemId).usando ? v : fazer(v, { tipo: 'usar_item', itemId, id: meu(v, itemId).id, usar: true }));

/** Uma pessoa de 45 anos (a vista já pede óculos de grau) com tudo do catálogo comprado. */
function comTudo(genero: 'feminino' | 'masculino' = 'feminino'): Vida {
  let v = adulto(45, { semente: 9, genero });
  v.financas.conta = 5_000_000;
  for (const it of ITENS_ESTILO) if (!v.eu.estilo?.itens.some(x => x.itemId === it.id)) v = fazer(v, { tipo: 'comprar_item', itemId: it.id });
  return v;
}

/** Nenhum lugar do corpo com duas peças, e o retrato lendo a peça certa. */
function conferir(v: Vida, escolhido: ItemDeEstilo) {
  const it = itemEstilo(escolhido.itemId)!;
  expect(escolhido.usando, `${it.id} em uso`).toBe(true);
  const ocupado = new Map<string, string>();
  for (const x of emUso(v)) for (const l of lugaresDoItem(itemEstilo(x.itemId)!)) {
    expect(ocupado.get(l), `dois itens em ${l}: ${ocupado.get(l)} e ${x.itemId}`).toBeUndefined();
    ocupado.set(l, x.itemId);
  }
  const vis = v.eu.visual;
  if (it.categoria === 'oculos') { expect(vis.modeloOculos).toBe(it.id); expect(vis.oculos).toBe(it.visual!.oculos); }
  if (it.categoria === 'chapeu') { expect(vis.modeloChapeu).toBe(it.id); expect(vis.chapeu).toBe(it.visual!.chapeu); }
  const casaco = emUso(v).find(x => itemEstilo(x.itemId)!.lugar === 'casaco');
  if (it.lugar === 'casaco') expect(vis.superior).toBe(`${it.id}#${escolhido.id}`);
  else if (lugaresDoItem(it).includes('tronco') && !casaco) expect(vis.superior).toBe(`${it.id}#${escolhido.id}`);
  if (it.lugar === 'joia') expect(vis.joia).toBe(it.visual!.joia);
}

describe('12.7 · o produto escolhido é o vestido', () => {
  it('cada produto do catálogo, escolhido depois de todos comprados, é exatamente o que fica em uso (e só ele no lugar)', () => {
    for (const genero of ['feminino', 'masculino'] as const) {
      let v = comTudo(genero);
      // Em duas ordens: a do catálogo e a inversa (o que estava antes não pode decidir).
      for (const ordem of [ITENS_ESTILO, [...ITENS_ESTILO].reverse()]) for (const it of ordem) {
        const x = meu(v, it.id);
        if (!x.usando) v = fazer(v, { tipo: 'usar_item', itemId: it.id, id: x.id, usar: true });
        conferir(v, meu(v, it.id));
      }
    }
  });

  it('os parecidos: óculos escuros de grife, aviador, Juliet e o comum não se confundem', () => {
    let v = comTudo();
    for (const id of ['oculos_grife', 'oculos_sol', 'oculos_juliet', 'oculos_aviador', 'oculos_grife']) {
      v = fazer(v, { tipo: 'usar_item', itemId: id, id: meu(v, id).id, usar: true });
      expect(emUso(v).filter(x => itemEstilo(x.itemId)!.categoria === 'oculos').map(x => x.itemId)).toEqual([id]);
      expect(v.eu.visual.modeloOculos).toBe(id);
    }
    for (const id of ['chapeu_couro', 'chapeu_palha', 'chapeu', 'turbante', 'lenco', 'bone_aba_reta', 'bone']) {
      v = fazer(v, { tipo: 'usar_item', itemId: id, id: meu(v, id).id, usar: true });
      expect(emUso(v).filter(x => itemEstilo(x.itemId)!.categoria === 'chapeu').map(x => x.itemId)).toEqual([id]);
      expect(v.eu.visual.modeloChapeu).toBe(id);
    }
  });

  it('vestido, camisa e casaco: a peça escolhida vai para o retrato; a de baixo fica', () => {
    let v = comTudo();
    v = fazer(v, { tipo: 'usar_item', itemId: 'vestido_festa', id: meu(v, 'vestido_festa').id, usar: true });
    for (const x of [...v.eu.estilo!.itens]) if (x.usando && itemEstilo(x.itemId)!.lugar === 'casaco') v = fazer(v, { tipo: 'usar_item', itemId: x.itemId, id: x.id, usar: false });
    expect(v.eu.visual.superior).toBe(`vestido_festa#${meu(v, 'vestido_festa').id}`);
    expect(emUso(v).filter(x => ['tronco', 'pernas'].some(l => lugaresDoItem(itemEstilo(x.itemId)!).includes(l))).map(x => x.itemId)).toEqual(['vestido_festa']);
    v = fazer(v, { tipo: 'usar_item', itemId: 'blusa_seda', id: meu(v, 'blusa_seda').id, usar: true });
    expect(meu(v, 'vestido_festa').usando).toBe(false);
    expect(v.eu.visual.superior).toBe(`blusa_seda#${meu(v, 'blusa_seda').id}`);
    v = fazer(v, { tipo: 'usar_item', itemId: 'saia_lapis', id: meu(v, 'saia_lapis').id, usar: true });
    expect(meu(v, 'blusa_seda').usando).toBe(true);
    v = fazer(v, { tipo: 'usar_item', itemId: 'sobretudo_grife', id: meu(v, 'sobretudo_grife').id, usar: true });
    expect(v.eu.visual.superior).toBe(`sobretudo_grife#${meu(v, 'sobretudo_grife').id}`);
    expect(meu(v, 'blusa_seda').usando).toBe(true);
  });

  it('tirar uma peça não veste outra; cortar o cabelo não mexe em roupa nenhuma', () => {
    let v = comTudo();
    v = fazer(v, { tipo: 'usar_item', itemId: 'camisa_linho', id: meu(v, 'camisa_linho').id, usar: true });
    v = fazer(v, { tipo: 'usar_item', itemId: 'oculos_grife', id: meu(v, 'oculos_grife').id, usar: true });
    const antes = emUso(v).map(x => x.id).sort();
    v = fazer(v, { tipo: 'aparencia', mudanca: { cabelo: v.eu.visual.cabelo === 'curto' ? 'medio' : 'curto' } });
    expect(emUso(v).map(x => x.id).sort()).toEqual(antes);
    expect(v.eu.visual.modeloOculos).toBe('oculos_grife');
    v = fazer(v, { tipo: 'usar_item', itemId: 'camisa_linho', id: meu(v, 'camisa_linho').id, usar: false });
    expect(emUso(v).map(x => x.id).sort()).toEqual(antes.filter(id => id !== meu(v, 'camisa_linho').id));
    v = fazer(v, { tipo: 'usar_item', itemId: 'oculos_grife', id: meu(v, 'oculos_grife').id, usar: false });
    expect(emUso(v).some(x => itemEstilo(x.itemId)!.categoria === 'oculos')).toBe(false);
    expect(v.eu.visual.oculos).toBeUndefined();
  });

  it('comprar numa loja de marca veste a peça comprada', () => {
    let v = adulto(30, { semente: 5 });
    v.financas.conta = 1_000_000;
    v = fazer(v, { tipo: 'comprar_item', itemId: 'oculos_sol' });
    v = fazer(v, { tipo: 'comprar_item', itemId: 'oculos_grife' });
    expect(v.eu.visual.modeloOculos).toBe('oculos_grife');
    v = fazer(v, { tipo: 'aparencia', mudanca: { cabelo: v.eu.visual.cabelo === 'curto' ? 'medio' : 'curto' } });
    expect(v.eu.visual.modeloOculos).toBe('oculos_grife');
    expect(meu(v, 'oculos_sol').usando).toBe(false);
  });

  it('duas peças do mesmo produto (uma herdada): vale a do id escolhido', () => {
    let v = adulto(30, { semente: 5 });
    v.financas.conta = 1_000_000;
    v = fazer(v, { tipo: 'comprar_item', itemId: 'relogio' });
    const herdado: ItemDeEstilo = { id: 'est_herdado', itemId: 'relogio', t: v.t, preco: 300, usando: false };
    v.eu.estilo!.itens.push(herdado);
    v = fazer(v, { tipo: 'usar_item', itemId: 'relogio', id: 'est_herdado', usar: true });
    expect(v.eu.estilo!.itens.filter(x => x.itemId === 'relogio').map(x => [x.id, x.usando])).toEqual([[expect.any(String), false], ['est_herdado', true]]);
  });

  it('salvar e carregar mantém exatamente o que está em uso', () => {
    let v = comTudo();
    for (const id of ['oculos_juliet', 'chapeu_couro', 'camiseta_banda', 'calca_cargo', 'tenis_lona', 'jaqueta_jeans', 'pulseira_couro', 'anel_prata']) v = vestir(v, id);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    const w = (r as { vida: Vida }).vida;
    expect(emUso(w).map(x => x.id).sort()).toEqual(emUso(v).map(x => x.id).sort());
    expect(w.eu.visual.modeloOculos).toBe('oculos_juliet');
    expect(w.eu.visual.modeloChapeu).toBe('chapeu_couro');
    expect(w.eu.visual.superior).toBe(v.eu.visual.superior);
  });

  it('save antigo com várias peças "em uso" no mesmo lugar (o defeito): carrega com uma por lugar, a que o retrato mostrava', () => {
    let v = comTudo();
    v = vestir(v, 'oculos_grife');
    v = vestir(v, 'camisa_linho');
    for (const x of [...v.eu.estilo!.itens]) if (x.usando && itemEstilo(x.itemId)!.lugar === 'casaco') v = fazer(v, { tipo: 'usar_item', itemId: x.itemId, id: x.id, usar: false });
    // Como o defeito deixava: todos os escuros e todas as "elegantes" marcados.
    for (const x of v.eu.estilo!.itens) if (['oculos_sol', 'oculos_aviador', 'oculos_juliet', 'blusa_seda', 'roupa_elegante', 'vestido_festa'].includes(x.itemId)) x.usando = true;
    const r = interpretar(JSON.stringify(v));
    const w = (r as { vida: Vida }).vida;
    expect(emUso(w).filter(x => itemEstilo(x.itemId)!.categoria === 'oculos').map(x => x.itemId)).toEqual(['oculos_grife']);
    expect(w.eu.visual.superior).toBe(`camisa_linho#${meu(w, 'camisa_linho').id}`);
    const ocupado = new Set<string>();
    for (const x of emUso(w)) for (const l of lugaresDoItem(itemEstilo(x.itemId)!)) { expect(ocupado.has(l)).toBe(false); ocupado.add(l); }
    // Idempotente.
    const antes = JSON.stringify(w.eu.estilo);
    sincronizarVisual(w);
    expect(JSON.stringify(w.eu.estilo)).toBe(antes);
  });

  it('ação antiga sem id continua funcionando (pega a peça desse produto)', () => {
    let v = comTudo();
    v = fazer(v, { tipo: 'usar_item', itemId: 'oculos_aviador', usar: true });
    expect(v.eu.visual.modeloOculos).toBe('oculos_aviador');
    expect(pode(v, { tipo: 'usar_item', itemId: 'oculos_aviador', id: 'nao_existe', usar: false })).toBe(false);
  });
});
