/**
 * VIDA 12.9 — piercings como itens de estilo: um por furo, comprar/usar/trocar/tirar, o visual sincronizado, idade
 * mínima, loja certa, save antigo intacto.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { ITENS_ESTILO, itemEstilo, lugaresDoItem } from '../dados/estilo';
import { PIERCINGS, REGIOES_DE_PIERCING } from '../dados/piercings129';
import { categoriaDoItem } from '../sistemas/lojas';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

const base = (i = 25): Vida => transacao(adulto(i, { semente: 1293, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 200_000; x.momento = null; }).vida;

describe('12.9 · piercings', () => {
  it('catálogo: no catálogo de estilo, cada joia num lugar de piercing, todas as regiões cobertas, ids únicos', () => {
    const ids = new Set(ITENS_ESTILO.map(x => x.id));
    expect(ids.size).toBe(ITENS_ESTILO.length);
    for (const p of PIERCINGS) {
      const it = itemEstilo(p.id)!;
      expect(it.piercing?.regiao).toBe(it.lugar);
      expect(lugaresDoItem(it)).toEqual([p.lugar]);
      expect(['joias', 'acessorios']).toContain(categoriaDoItem(it));
    }
    expect(new Set(PIERCINGS.map(p => p.lugar))).toEqual(REGIOES_DE_PIERCING);
  });

  it('comprar põe no furo e no visual; outro do mesmo furo troca a joia; furos diferentes convivem; tirar remove', () => {
    let v = base();
    v = executar(v, { tipo: 'comprar_item', itemId: 'pc_nariz_ponto_aco' }).vida;
    v = executar(v, { tipo: 'comprar_item', itemId: 'pc_helix_argola' }).vida;
    v = executar(v, { tipo: 'comprar_item', itemId: 'brincos' }).vida;
    expect(v.eu.visual.piercings).toEqual(['pc_helix_argola', 'pc_nariz_ponto_aco']);
    expect(v.eu.visual.brincos).toBe(true); // o lóbulo continua sendo dos brincos: três furos na orelha
    v = executar(v, { tipo: 'comprar_item', itemId: 'pc_nariz_argola_prata' }).vida;
    expect(v.eu.visual.piercings).toEqual(['pc_helix_argola', 'pc_nariz_argola_prata']);
    expect(v.eu.estilo!.itens.find(x => x.itemId === 'pc_nariz_ponto_aco')!.usando).toBe(false);
    // trocar de volta pela joia guardada
    v = executar(v, { tipo: 'usar_item', itemId: 'pc_nariz_ponto_aco', usar: true }).vida;
    expect(v.eu.visual.piercings).toEqual(['pc_helix_argola', 'pc_nariz_ponto_aco']);
    v = executar(v, { tipo: 'usar_item', itemId: 'pc_helix_argola', usar: false }).vida;
    expect(v.eu.visual.piercings).toEqual(['pc_nariz_ponto_aco']);
    v = executar(v, { tipo: 'usar_item', itemId: 'pc_nariz_ponto_aco', usar: false }).vida;
    expect(v.eu.visual.piercings).toBeUndefined();
  });

  it('menor de 16 não fura; 16 já pode', () => {
    expect(disponibilidade(base(15), { tipo: 'comprar_item', itemId: 'pc_nariz_ponto_aco' }).grau).toBe('impossivel');
    expect(disponibilidade(base(16), { tipo: 'comprar_item', itemId: 'pc_nariz_ponto_aco' }).grau).not.toBe('impossivel');
  });

  it('save antigo sem piercings abre igual; com piercings, persiste', () => {
    let v = base();
    const r0 = interpretar(JSON.stringify(v));
    expect(r0.tipo).toBe('ok');
    if (r0.tipo === 'ok') expect(r0.vida.eu.visual.piercings).toBeUndefined();
    v = executar(v, { tipo: 'comprar_item', itemId: 'pc_umbigo_barra' }).vida;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.eu.visual.piercings).toEqual(['pc_umbigo_barra']);
  });
});
