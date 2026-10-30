/**
 * REWORK 12.3 — carreiras vivas, Submundo profundo, corrupção, Justiça e narrativa dinâmica.
 *
 *   F1   "A primeira palavra" (e os outros marcos de uma vez só) no máximo uma vez por PESSOA, inclusive depois da sucessão
 *   G1   o noivado não vira casamento contra a escolha: dá para adiar e para desfazer
 *   C5   o advogado particular aparece sempre para quem tem a defesa pública (bloqueado com motivo e preço quando falta)
 *   C6   a defesa narrada é a defesa escolhida (o jogo não paga advogado sozinho)
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { registrarMarco, temMarco, transacao } from '../nucleo';
import type { Vida } from '../tipos';
import { executar } from '../acoes';
import { interpretar, normalizarRework123 } from '../save';
import { abrirDecisao, conteudoPorId, preparar } from '../conteudo/motor';
import { abrirProcesso } from '../sistemas/justica';
import { ficarNoivos } from '../sistemas/romance';
import { continuarComo } from '../sistemas/sucessao';
import { criarRng, rngDe } from '../rng';
import type { Decisao } from '../conteudo/base';

const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, f).vida;
const decidir = (v: Vida, opcaoId: string) => executar(v, { tipo: 'decidir', opcaoId });

/* ================================================================ F1 */

describe('F1 · marcos de uma vez só por pessoa', () => {
  it('a primeira palavra do filho não volta, mesmo que o fato antigo suma', () => {
    let v = adulto(30, { semente: 7 });
    const { p: filho } = comFilho(v, 1);
    const c = conteudoPorId('fil_palavra')!;
    v.t += 6; // o filho com 1 ano e meio
    expect(preparar(c, v, rngDe('t', 1))).toBeTruthy();
    v = em(v, x => registrarMarco(x, filho.id, 'primeira_palavra'));
    delete v.fatos[`palavra_${filho.id}`];
    expect(preparar(c, v, rngDe('t', 2))).toBeNull();
    // outra criança, a mesma cena pode acontecer
    const { p: outro } = comFilho(v, 1);
    expect(temMarco(v, outro.id, 'primeira_palavra')).toBe(false);
  });

  it('a filha que já falou, quando passa a ser jogada, não tem "a primeira palavra" de novo', () => {
    let v = adulto(40, { semente: 11 });
    comParceiro(v, { estagio: 'casamento' });
    const { p: filha } = comFilho(v, 2, { genero: 'feminino' });
    v = em(v, x => { x.fatos[`palavra_${filha.id}`] = x.t - 3; x.morte = { t: x.t, causa: 'teste' }; });
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.eu.marcos?.primeira_palavra).toBeDefined();
    expect(preparar(conteudoPorId('bb_primeira_palavra')!, n, rngDe('x', 3))).toBeNull();
    // a leitura do save não muda nada (idempotente)
    const relido = interpretar(JSON.stringify(n));
    expect(relido.tipo).toBe('ok');
    expect((relido as { vida: Vida }).vida.eu.marcos).toEqual(n.eu.marcos);
  });

  it('save antigo: os fatos dos filhos e a infância de quem joga viram marcos (idempotente)', () => {
    const v = adulto(35, { semente: 13 });
    const { p: f } = comFilho(v, 3);
    v.fatos[`palavra_${f.id}`] = v.t - 20;
    v.fatos[`passos_${f.id}`] = v.t - 30;
    v.ocorrencias.push({ id: 'bb_primeira_palavra', t: 24, idade: 2 });
    normalizarRework123(v);
    const uma = JSON.stringify(v);
    normalizarRework123(v);
    expect(JSON.stringify(v)).toBe(uma);
    expect(v.pessoas[f.id].marcos).toEqual({ primeira_palavra: v.t - 20, primeiros_passos: v.t - 30 });
    expect(v.eu.marcos?.primeira_palavra).toBe(24);
  });
});

/* ================================================================ G1 */

describe('G1 · o casamento respeita a escolha', () => {
  function noivos(): { v: Vida; id: string } {
    const v = adulto(30, { semente: 21 });
    const { p, vin } = comParceiro(v, { estagio: 'namoro', anos: 4 });
    ficarNoivos(v, vin);
    v.fatos[`noivado_${p.id}`] = v.t - 13;
    v.momento = null; delete v.fila;
    return { v, id: p.id };
  }
  it('a pergunta do casamento tem adiar e desfazer; adiar não casa e a pergunta só volta depois de um ano', () => {
    let { v, id } = noivos();
    const d = conteudoPorId('rom_casamento') as Decisao;
    const ctx = preparar(d, v, rngDe('c', 1));
    expect(ctx).toBeTruthy();
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('c', 1))!); });
    const ops = v.momento!.opcoes.map(o => o.id);
    expect(ops).toContain('adiar');
    expect(ops).toContain('desfazer');
    v = decidir(v, 'adiar').vida;
    expect(v.vinculos[id].romance!.estagio).not.toBe('casamento');
    expect(preparar(d, v, rngDe('c', 2))).toBeNull();
    v = em(v, x => { x.t += 6; });
    expect(preparar(d, v, rngDe('c', 3))).toBeNull();
    v = em(v, x => { x.t += 7; });
    expect(preparar(d, v, rngDe('c', 4))).toBeTruthy();
  });
  it('desfazer o noivado mantém o namoro e não casa', () => {
    let { v, id } = noivos();
    const d = conteudoPorId('rom_casamento') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('c', 1))!); });
    v = decidir(v, 'desfazer').vida;
    expect(v.vinculos[id].romance!.estagio).not.toBe('casamento');
    expect(v.vinculos[id].romance!.estagio).not.toBe('ex');
    expect(v.vinculos[id].romance!.noivado).toBeUndefined();
    v = em(v, x => { x.t += 24; });
    expect(preparar(d, v, rngDe('c', 5))).toBeNull();
  });
});

/* ================================================================ C5 / C6 */

describe('C5/C6 · a defesa é a escolhida, e o advogado particular sempre aparece', () => {
  function processado(conta: number, semente = 31): Vida {
    let v = adulto(32, { semente });
    v.financas.conta = conta;
    v.momento = null; delete v.fila;
    v = em(v, x => { abrirProcesso(x, rngDe('proc', semente), 'fraude'); });
    return v;
  }
  it('quem tem dinheiro não perde dinheiro na abertura e encontra "contratar advogado" disponível', () => {
    const antes = 300_000;
    let v = processado(antes);
    expect(v.justica!.processo!.defesa).toBe('publica');
    expect(v.financas.conta).toBe(antes);
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    const part = v.momento!.opcoes.find(o => o.id === 'particular');
    expect(part).toBeTruthy();
    expect(part!.bloqueio).toBeUndefined();
    const r = decidir(v, 'particular');
    expect(r.vida.justica!.processo!.defesa).toBe('particular');
    expect(r.vida.justica!.processo!.pagaPor).toBe('voce');
    expect(r.vida.financas.conta).toBeLessThan(antes);
  });
  it('sem dinheiro: a opção aparece bloqueada, com o preço e o que se tem', () => {
    let v = processado(500);
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    const part = v.momento!.opcoes.find(o => o.id === 'particular');
    expect(part?.bloqueio).toMatch(/cobra uns/);
  });
  it('escolher a defesa pública com o advogado da organização no caso muda a defesa de verdade, e o texto diz isso', () => {
    let v = processado(300_000, 33);
    v = em(v, x => { Object.assign(x.justica!.processo!, { defesa: 'particular', pagaPor: 'organizacao' }); });
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    expect(v.momento!.opcoes.map(o => o.id)).toContain('manter');
    const r = decidir(v, 'publica');
    expect(r.vida.justica!.processo!.defesa).toBe('publica');
    expect(r.resultado).toMatch(/dispensou/);
  });
  it('o processo tem juiz, promotor e quem defende, com nome; o mesmo juiz pode voltar na mesma cidade', () => {
    const v = processado(1000, 35);
    const p = v.justica!.processo!;
    const atores = v.justica!.atores!;
    expect(atores[p.juizId!].papel).toBe('juiz');
    expect(atores[p.promotorId!].papel).toBe('promotor');
    expect(atores[p.defensorId!].papel).toBe('defensor');
    expect(atores[p.juizId!].nome.length).toBeGreaterThan(3);
    // a comarca tem poucas varas: o juiz de um segundo processo, na mesma cidade, vem do mesmo quadro
    const ids = new Set<string>();
    for (let k = 0; k < 12; k++) { const x = processado(1000, 100 + k); ids.add(x.justica!.atores![x.justica!.processo!.juizId!].nome); }
    expect(ids.size).toBeLessThanOrEqual(6);
  });
});
