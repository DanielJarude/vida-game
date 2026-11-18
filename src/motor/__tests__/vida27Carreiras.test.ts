/**
 * VIDA 27 · §14 — no máximo duas carreiras profissionais ao mesmo tempo.
 *
 * Antes: o contrato profissional de e-sports e o de Fórmula 1 chamavam `contratar` e TROCAVAM o emprego de agora em
 * silêncio (o atleta que virava jogador profissional deixava de ser atleta); e o trabalho, a paralela e o negócio nas
 * horas vagas somavam três. Agora: duas vagas (o principal, a paralela, o negócio nas horas vagas), hobby e formação
 * não contam, a terceira é barrada com o motivo, e encerrar libera a vaga sem apagar o histórico.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { carreirasAtivas, temVagaDeCarreira } from '../sistemas/vagasDeCarreira';
import { contratarEmParalela, encerrarParalela, podeConciliar } from '../sistemas/paralelas';
import { empregoEsports25, executarEsports25 } from '../v25/esports/esports25';
import type { Vida } from '../tipos';

function pessoa(): Vida {
  const v = adulto(22, { semente: 27 });
  v.trabalho.atual = undefined; v.trabalho.paralela = undefined; v.caminhos.negocio = undefined;
  v.financas.conta = 100_000; v.momento = null; delete v.fila;
  return v;
}
const atleta = (v: Vida) => transacao(v, (x, r) => { contratar(x, r, ocupacao('atleta'), 'oportunidade'); }).vida;
function comPropostaPro(v: Vida): Vida {
  return transacao(v, x => {
    executarEsports25(x, { op: 'comecar', jogo: 'cs' });
    x.esports25!.proposta = { equipe: 'Equipe Teste', nivel: 3, forca: 60, salario: 8000, meses: 12, validaAte: x.t + 10, origem: 'mercado', titular: true };
  }).vida;
}

describe('VIDA 27 · duas carreiras profissionais', () => {
  it('nenhuma, uma e duas', () => {
    let v = pessoa();
    expect(carreirasAtivas(v)).toHaveLength(0);
    v = atleta(v);
    expect(carreirasAtivas(v).map(c => c.tipo)).toEqual(['principal']);
    v = transacao(v, (x, r) => { contratarEmParalela(x, () => contratar(x, r, ocupacao('fotografo'), 'oportunidade')); }).vida;
    expect(carreirasAtivas(v)).toHaveLength(2);
    expect(temVagaDeCarreira(v)).toBe(false);
  });

  it('hobby e formação não ocupam vaga (videogame, futebol com os amigos, e-sports amador)', () => {
    let v = pessoa();
    v.rotinas.push({ id: 'videogame', tInicio: v.t, nivel: 2 }, { id: 'futebol', tInicio: v.t, nivel: 2 });
    v = transacao(v, x => { executarEsports25(x, { op: 'comecar', jogo: 'cs' }); }).vida;
    expect(carreirasAtivas(v)).toHaveLength(0);
  });

  it('atleta profissional + contrato de e-sports: o e-sports entra como a segunda carreira (o atleta continua)', () => {
    let v = atleta(pessoa());
    v = comPropostaPro(v);
    const a = { tipo: 'esports25', oque: { op: 'aceitar' } } as const;
    expect(podeTentar(disponibilidade(v, a as never))).toBe(true);
    v = executar(v, a as never).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('atleta');
    expect(v.trabalho.paralela?.ocupacaoId).toBe('jogador_esports');
    expect(empregoEsports25(v)).toBe(v.trabalho.paralela);
    expect(v.esports25!.fase).toBe('profissional');
    expect(carreirasAtivas(v)).toHaveLength(2);
  });

  it('a terceira é barrada com o motivo (quais carreiras ocupam as vagas)', () => {
    let v = atleta(pessoa());
    v = transacao(v, (x, r) => { contratarEmParalela(x, () => contratar(x, r, ocupacao('fotografo'), 'oportunidade')); }).vida;
    v = comPropostaPro(v);
    const d = disponibilidade(v, { tipo: 'esports25', oque: { op: 'aceitar' } } as never);
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/Limite de 2 carreiras/);
    expect(podeConciliar(v, ocupacao('garcom'))).toBe(false);
  });

  it('encerrar uma carreira libera a vaga e não apaga o histórico; depois cabe outra', () => {
    let v = atleta(pessoa());
    v = transacao(v, (x, r) => { contratarEmParalela(x, () => contratar(x, r, ocupacao('fotografo'), 'oportunidade')); }).vida;
    const antes = v.trabalho.historico.length;
    v = transacao(v, x => { encerrarParalela(x, 'deixou a trajetória paralela'); }).vida;
    expect(carreirasAtivas(v)).toHaveLength(1);
    expect(v.trabalho.historico.length).toBeGreaterThan(antes);
    expect(v.trabalho.historico.some(h => h.ocupacaoId === 'fotografo')).toBe(true);
    v = comPropostaPro(v);
    expect(podeTentar(disponibilidade(v, { tipo: 'esports25', oque: { op: 'aceitar' } } as never))).toBe(true);
  });

  it('sem trabalho, o contrato de e-sports vira o principal (como sempre)', () => {
    let v = comPropostaPro(pessoa());
    v = executar(v, { tipo: 'esports25', oque: { op: 'aceitar' } } as never).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('jogador_esports');
    expect(v.trabalho.paralela).toBeUndefined();
  });
});
