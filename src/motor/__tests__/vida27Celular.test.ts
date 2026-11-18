/**
 * VIDA 27 · §13 — o celular é a vida digital; o encontro na rua é presencial.
 *
 * Os dois casos do playtest: (1) aos 15 anos, o tio mandava mensagem dizendo que foi demitido, e as respostas incluíam
 * mandar dinheiro e dar conselho de vida — como se o adolescente tivesse responsabilidade no aperto de um adulto;
 * (2) "fulano encontrou você na fila do shopping" chegava como notificação. Agora o adulto conta a NOTÍCIA ao menor
 * (sem desabafo que peça resolução), as respostas cabem na idade de quem responde, e o encontro por acaso abre como
 * cena no lugar (com continuidade por mensagem, depois).
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParente, pessoaNova } from './cenarios';
import { vincular } from '../pessoas';
import { criarRng } from '../rng';
import { executar, abrirEncontro27 } from '../acoes';
import { celularDe, depoisDaAcao15 } from '../v15/celular/celular15';
import { candidatos17, opcoes17 } from '../v17/celular/mensagens17';
import type { Msg15 } from '../dados15/celular/tipos';
import type { Vida } from '../tipos';

function jovem(i: number): Vida {
  const v = adulto(i, { semente: 33 });
  v.momento = null; delete v.fila;
  return v;
}

describe('VIDA 27 · encontro por acaso é presencial', () => {
  it('ir a um lugar pode pôr alguém no caminho — como cena, nunca como mensagem', () => {
    const v = jovem(25);
    const { p } = comParente(v, 'irmao', 27);
    p.municipioId = v.moradia.municipioId;
    v.vinculos[p.id].convivio = [];
    v.vinculos[p.id].tUltimoContato = v.t - 60;
    let achou = false;
    for (let k = 0; k < 40 && !achou; k++) {
      v.t += 1; const c = celularDe(v); c.encontrosNoAno = 0;
      depoisDaAcao15(v, { tipo: 'comprar_item' });
      achou = !!c.encontro27;
    }
    expect(achou).toBe(true);
    expect(celularDe(v).msgs.some(m => m.tipo === 'encontro')).toBe(false);
    abrirEncontro27(v, criarRng(1));
    expect(v.momento?.situacaoId).toMatch(/^enc27_/);
    expect(v.momento!.texto).toMatch(/no shopping|No shopping/);
  });

  it('parar para conversar aproxima e deixa a conversa para continuar por mensagem', () => {
    const v = jovem(25);
    const { p } = comParente(v, 'irmao', 27);
    v.vinculos[p.id].tUltimoContato = v.t - 60;
    const antes = v.vinculos[p.id].proximidade;
    celularDe(v).encontro27 = { t: v.t, lugar: 'shopping', pid: p.id };
    abrirEncontro27(v, criarRng(2));
    expect(v.momento?.situacaoId).toBe('enc27_acaso');
    const w = executar(v, { tipo: 'decidir', opcaoId: 'conversar' }).vida;
    expect(w.vinculos[p.id].proximidade).toBeGreaterThan(antes);
    expect(w.vinculos[p.id].tUltimoContato).toBe(w.t);
    expect(w.celular15!.fios17!.some(f => f.pid === p.id && f.tipo === 'promessa')).toBe(true);
    expect(w.celular15!.encontro27).toBeUndefined();
  });
});

describe('VIDA 27 · conversas que cabem na idade e na relação', () => {
  it('o tio demitido não desabafa com o sobrinho de 15 (a notícia chega; o pedido de apoio, não)', () => {
    const v = jovem(15);
    const { p, vin } = comParente(v, 'tio', 42);
    vin.proximidade = 80; vin.confianca = 80; vin.convivio = [];
    p.aperto = { tipo: 'desemprego', t: v.t };
    const cs = candidatos17(v, new Set(), 0).filter(c => c.p?.id === p.id);
    expect(cs.some(c => c.tipo === 'desabafo')).toBe(false);
  });

  it('com a irmã de 19, o desabafo continua (par de geração)', () => {
    const v = jovem(15);
    const { p, vin } = comParente(v, 'irmao', 19, 'feminino');
    vin.proximidade = 80; vin.confianca = 80; vin.convivio = [];
    p.aperto = { tipo: 'separacao', t: v.t };
    expect(candidatos17(v, new Set(), 0).some(c => c.p?.id === p.id && c.tipo === 'desabafo')).toBe(true);
  });

  it('um menor não oferece dinheiro nem dá conselho de vida a um adulto bem mais velho; apoiar, sim', () => {
    const v = jovem(16);
    const { p } = comParente(v, 'irmao', 30);
    const m = { id: 'x', t: v.t, tipo: 'desabafo', onda: 1, de: p.id, sit17: 'desabafo_desemprego', texto: '"Fui demitido."' } as unknown as Msg15;
    const ops = opcoes17(v, m).map(o => o.op);
    expect(ops).toContain('apoio');
    expect(ops).not.toContain('ajudar');
    expect(ops).not.toContain('conselho');
  });

  it('entre adultos, ajudar com dinheiro continua possível (a escolha é de quem pode)', () => {
    const v = jovem(35);
    const p = pessoaNova(v, 34, 'masculino');
    vincular(v, p, { origem: 'escola', proximidade: 80 });
    const m = { id: 'y', t: v.t, tipo: 'desabafo', onda: 1, de: p.id, sit17: 'desabafo_desemprego', texto: '"Fui demitido."' } as unknown as Msg15;
    expect(opcoes17(v, m).map(o => o.op)).toEqual(expect.arrayContaining(['apoio', 'conselho', 'ajudar']));
  });
});
