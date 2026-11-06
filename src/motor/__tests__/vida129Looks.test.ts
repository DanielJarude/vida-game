/**
 * VIDA 12.9 — looks com nome: guardar o que se usa, vestir de novo (as peças de verdade), substituir, renomear, apagar;
 * não precisa ter todas as partes; peça vendida sai do look; save antigo sem looks continua igual.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { normalizarLocais, pecasDoLookAtual } from '../sistemas/personalizacao';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

const base = (): Vida => transacao(adulto(28, { semente: 1292, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 2_000_000; x.momento = null; }).vida;
const P = (op: object) => ({ tipo: 'personalizar', op } as never);
const usando = (v: Vida) => v.eu.estilo!.itens.filter(x => x.usando).map(x => x.id).sort();

describe('12.9 · looks com nome', () => {
  it('guarda, troca de roupa, veste de novo as MESMAS peças; o que o look não tem continua', () => {
    let v = base();
    for (const id of ['camiseta_lisa', 'jeans', 'tenis_casual']) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    const casual = usando(v);
    const doLook = pecasDoLookAtual(v).sort();
    v = executar(v, P({ o: 'look_salvar', nome: 'Casual' })).vida;
    expect(v.eu.estilo!.looksSalvos!.map(l => l.nome)).toEqual(['Casual']);
    expect(v.eu.estilo!.looksSalvos![0].itens.sort()).toEqual(doLook);
    expect(doLook.length).toBeGreaterThanOrEqual(3);
    for (const id of ['camisa_social', 'calca_alfaiataria', 'sapato_social']) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    v = executar(v, P({ o: 'look_salvar', nome: 'Trabalho' })).vida;
    expect(usando(v)).not.toEqual(casual);
    // relógio: fora dos dois looks, continua no pulso quando se veste o casual
    v = executar(v, { tipo: 'comprar_item', itemId: 'relogio' }).vida;
    const relogio = v.eu.estilo!.itens.find(x => x.itemId === 'relogio')!.id;
    v = executar(v, P({ o: 'look_vestir', id: v.eu.estilo!.looksSalvos![0].id })).vida;
    expect(usando(v)).toEqual([...casual, relogio].sort());
  });

  it('substituir, renomear (sem nome repetido), apagar; limite e validações', () => {
    let v = base();
    const antes = v.eu.estilo?.itens.length ?? 0;
    v = executar(v, { tipo: 'comprar_item', itemId: 'camiseta_lisa' }).vida;
    v = executar(v, P({ o: 'look_salvar', nome: '  Casual  ' })).vida;
    const id = v.eu.estilo!.looksSalvos![0].id;
    expect(v.eu.estilo!.looksSalvos![0].nome).toBe('Casual');
    expect(disponibilidade(v, P({ o: 'look_salvar', nome: 'casual' })).grau).not.toBe('livre');
    expect(disponibilidade(v, P({ o: 'look_salvar', nome: '' })).grau).not.toBe('livre');
    v = executar(v, { tipo: 'comprar_item', itemId: 'jeans' }).vida;
    v = executar(v, P({ o: 'look_salvar', id, nome: 'Casual' })).vida;
    expect(v.eu.estilo!.looksSalvos!.length).toBe(1);
    expect(v.eu.estilo!.looksSalvos![0].itens.length).toBe(pecasDoLookAtual(v).length);
    expect(v.eu.estilo!.looksSalvos![0].itens).toContain(v.eu.estilo!.itens.find(x => x.itemId === 'jeans')!.id);
    v = executar(v, P({ o: 'look_renomear', id, nome: 'Fim de semana' })).vida;
    expect(v.eu.estilo!.looksSalvos![0].nome).toBe('Fim de semana');
    v = executar(v, P({ o: 'look_excluir', id })).vida;
    expect(v.eu.estilo!.looksSalvos).toBeUndefined();
    expect(v.eu.estilo!.itens.length).toBe(antes + 2); // as peças continuam
  });

  it('peça que deixa de ser sua sai do look; o look vazio não veste; save e volta', () => {
    let v = base();
    v = executar(v, { tipo: 'comprar_item', itemId: 'camiseta_lisa' }).vida;
    v = executar(v, P({ o: 'look_salvar', nome: 'Básico' })).vida;
    v = transacao(v, x => { x.eu.estilo!.itens = []; normalizarLocais(x); }).vida;
    expect(v.eu.estilo!.looksSalvos![0].itens).toEqual([]);
    expect(disponibilidade(v, P({ o: 'look_vestir', id: v.eu.estilo!.looksSalvos![0].id })).grau).toBe('impossivel');
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
  });

  it('criança pequena não monta look', () => {
    const v = transacao(adulto(8, { semente: 3 }), () => {}).vida;
    expect(disponibilidade(v, P({ o: 'look_salvar', nome: 'X' })).grau).toBe('impossivel');
  });
});
