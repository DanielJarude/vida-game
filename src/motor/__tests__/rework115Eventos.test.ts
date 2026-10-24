/**
 * REWORK 11.5 · Fase B — mais de uma decisão por ano.
 *
 *   EVT-01  a fila do ano: as outras decisões esperam a vez e abrem uma depois da outra, conferidas de novo
 *   EVT-02  frequência pelo que a vida tem (`orcamentoDeDecisoes`), teto de quatro, urgentes passam
 *   EVT-03  o que não cabe espera o ano seguinte (uma vez); o que a escolha anterior desfez não abre
 *   EVT-04  a decisão aberta por outra é consequência dela (o elo `segue`)
 *   EVT-05  a renovação do atleta não tira a vez da cena da carreira
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { idade, transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { criarVida } from '../criacao';
import { CATALOGO } from '../conteudo/catalogo';
import { abrirProximaDaFila, conteudoPorId, decisoesDoAno, familiaDe, montarFila, orcamentoDeDecisoes, preparar, TETO_DO_ANO } from '../conteudo/motor';
import { interpretar } from '../save';
import { podeTentar } from '../plausibilidade';

/** Decisões sem papéis que cabem agora nesta vida, de famílias diferentes. */
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

describe('REWORK 11.5 · a fila do ano', () => {
  it('duas decisões no mesmo ano: a segunda abre quando a primeira é resolvida, e o ano não trava', () => {
    let v = adulto(34, { semente: 7 });
    const [a, b] = decisoesQueCabem(v, 2);
    expect(a && b).toBeTruthy();
    v = transacao(v, x => { x.momento = null; x.fila = [{ id: a, t: x.t, papeis: {}, prioridade: 2 }, { id: b, t: x.t, papeis: {}, prioridade: 1 }]; abrirProximaDaFila(x); }).vida;
    expect(v.momento?.situacaoId).toBe(a);
    // Enquanto há decisão aberta, o ano não avança.
    expect(podeTentar(disponibilidade(v, { tipo: 'avancar' } as never))).toBe(false);
    v = executar(v, { tipo: 'decidir', opcaoId: primeira(v) }).vida;
    const segunda = conteudoPorId(b)!;
    // A segunda abre na hora (se a primeira não a desfez) — e é do mesmo ano.
    expect(v.momento?.situacaoId).toBe(segunda.id);
    expect(v.momento?.t).toBe(v.t);
    v = executar(v, { tipo: 'decidir', opcaoId: primeira(v) }).vida;
    expect(v.fila).toBeUndefined();
    expect(decisoesDoAno(v)).toBeGreaterThanOrEqual(2);
    const t = v.t;
    if (!v.momento) v = avancarAno(v).vida;
    expect(v.t).toBe(t + 12);
  });

  it('a decisão cuja premissa a escolha anterior desfez não abre (a pessoa do papel morreu)', () => {
    let v = adulto(40, { semente: 11 });
    const { p } = comParceiro(v, { estagio: 'casamento', anos: 6 });
    const comPapel = CATALOGO.find(c => c.tipo === 'decisao' && !c.manual && c.papeis && Object.keys(c.papeis).length === 1 && Object.values(c.papeis)[0](v).some(x => x.id === p.id))!;
    expect(comPapel).toBeDefined();
    const papel = Object.keys(comPapel.papeis!)[0];
    v = transacao(v, x => { x.momento = null; x.pessoas[p.id].vivo = false; x.pessoas[p.id].tMorte = x.t; x.fila = [{ id: comPapel.id, t: x.t, papeis: { [papel]: p.id }, prioridade: 3 }]; abrirProximaDaFila(x); }).vida;
    expect(v.momento?.situacaoId === comPapel.id).toBe(false);
    expect(v.fila).toBeUndefined();
  });

  it('acima do teto do ano, a não urgente espera o ano seguinte — uma vez; a urgente passa', () => {
    let v = adulto(30, { semente: 5 });
    const ids = decisoesQueCabem(v, 6);
    expect(ids.length).toBeGreaterThanOrEqual(TETO_DO_ANO + 1);
    v = transacao(v, x => {
      x.momento = null;
      // O ano já teve o teto de decisões.
      for (const id of ids.slice(0, TETO_DO_ANO)) x.ocorrencias.push({ id, t: x.t, idade: idade(x) });
      x.fila = [{ id: ids[TETO_DO_ANO], t: x.t, papeis: {}, prioridade: 1 }];
      abrirProximaDaFila(x);
    }).vida;
    expect(v.momento).toBeNull();
    expect(v.fila?.[0]).toMatchObject({ id: ids[TETO_DO_ANO], t: v.t + 12, adiada: true });
    // A urgente passa mesmo acima do teto.
    v = transacao(v, x => { x.fila = [{ id: ids[TETO_DO_ANO], t: x.t, papeis: {}, prioridade: 6, urgente: true }]; abrirProximaDaFila(x); }).vida;
    expect(v.momento?.situacaoId).toBe(ids[TETO_DO_ANO]);
  });

  it('a fila monta com uma decisão por família, e a adiada do ano passado volta a disputar', () => {
    let v = adulto(30, { semente: 9 });
    const [a] = decisoesQueCabem(v, 1);
    v = transacao(v, x => { x.momento = null; x.fila = [{ id: a, t: x.t, papeis: {}, prioridade: 1, adiada: true }]; montarFila(x); }).vida;
    expect(v.fila?.some(x => x.id === a)).toBe(true);
    const fams = (v.fila ?? []).map(x => familiaDe(x.id));
    expect(new Set(fams).size).toBe(fams.length);
  });

  it('a frequência sai do que a vida tem: a vida mansa comporta uma; a cheia, mais', () => {
    const mansa = adulto(30, { semente: 3 });
    const m = transacao(mansa, x => { x.trabalho.atual = undefined; x.rotinas = []; x.educacao.matricula = undefined; }).vida;
    expect(orcamentoDeDecisoes(m)).toBe(1);
    const cheia = transacao(adulto(36, { semente: 3 }), x => {
      comParceiro(x, { estagio: 'casamento', anos: 4 });
      comFilho(x, 6, { casa: true });
      x.rotinas = [{ id: 'leitura', tInicio: x.t, nivel: 1 }, { id: 'corrida', tInicio: x.t, nivel: 2 }];
    }).vida;
    expect(orcamentoDeDecisoes(cheia)).toBeGreaterThanOrEqual(2);
  });

  it('a fila sobrevive ao save e ao recarregar (e a próxima abre do mesmo jeito)', () => {
    let v = adulto(30, { semente: 13 });
    const [a, b] = decisoesQueCabem(v, 2);
    v = transacao(v, x => { x.momento = null; x.fila = [{ id: a, t: x.t, papeis: {}, prioridade: 2 }, { id: b, t: x.t, papeis: {}, prioridade: 1 }]; abrirProximaDaFila(x); }).vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(lido.vida.fila).toEqual(v.fila);
    const depois = executar(lido.vida, { tipo: 'decidir', opcaoId: primeira(lido.vida) }).vida;
    expect(depois.momento?.situacaoId).toBe(b);
  });

  it('vidas inteiras: anos com duas ou mais decisões existem, nenhuma família se repete no ano, nada trava', () => {
    let anos = 0, comDuas = 0, repetiuFamilia = 0, acimaDoTeto = 0;
    for (const semente of [21, 22, 23]) {
      let v = criarVida({ nome: 'Ana', sobrenome: 'Lima', genero: semente % 2 ? 'feminino' : 'masculino', municipioId: 'recife-pe', semente });
      const decidir = () => { for (let j = 0; j < 20 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: primeira(v) }).vida; };
      while (!v.morte && idade(v) < 45) {
        decidir();
        const t = v.t;
        v = avancarAno(v).vida;
        decidir();
        if (idade(v) < 18) continue;
        anos++;
        const ids = [...new Set(v.ocorrencias.filter(o => o.t === t + 12 && conteudoPorId(o.id)?.tipo === 'decisao').map(o => o.id))];
        if (ids.length >= 2) comDuas++;
        // As etapas do processo e a decisão aberta por outra (`abrir`) são da mesma família de propósito; fora isso, uma só.
        const fams = ids.map(familiaDe);
        if (new Set(fams).size < fams.length - 1) repetiuFamilia++;
        if (ids.length > TETO_DO_ANO + 1) acimaDoTeto++;
      }
    }
    expect(anos).toBeGreaterThan(60);
    expect(comDuas).toBeGreaterThan(0);
    expect(repetiuFamilia).toBe(0);
    expect(acimaDoTeto).toBe(0);
  }, 400000);
});
