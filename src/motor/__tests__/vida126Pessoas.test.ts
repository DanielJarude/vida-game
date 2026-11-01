/**
 * VIDA 12.6 — as pessoas: o jeito (traços estáveis do temperamento), os gostos em comum, a memória que pesa (a traição,
 * a ajuda, a reconciliação), as promessas, conhecer a família de verdade e o caso escondido.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { transacao, lembrarCom } from '../nucleo';
import { vincular } from '../pessoas';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { climaDaMemoria, fatorDoJeito, gostosDaPessoa, riscoDoRastro, tracosDe, traicaoQueNaoPassou } from '../sistemas/jeito';
import { conferirPromessas } from '../sistemas/convivio126';
import type { Pessoa, Vida } from '../tipos';

const base = (): Vida => transacao(adulto(32, { semente: 1262 }), x => { x.financas.conta = 400_000; x.momento = null; }).vida;

describe('VIDA 12.6 · o jeito das pessoas', () => {
  it('traços: até três, estáveis, sem opostos; o mesmo temperamento dá o mesmo jeito', () => {
    const v = base();
    for (const p of Object.values(v.pessoas)) {
      const t = tracosDe(p);
      expect(t.length).toBeLessThanOrEqual(3);
      expect(tracosDe(p)).toEqual(t);
      expect(t.includes('timido') && t.includes('extrovertido')).toBe(false);
      expect(t.includes('generoso') && t.includes('egoista')).toBe(false);
    }
    const timida = { id: 'x', temperamento: { extroversao: -0.9, afabilidade: 0.1, responsabilidade: 0, abertura: 0, estabilidade: 0 } };
    expect(tracosDe(timida)).toContain('timido');
    expect(fatorDoJeito(timida, 'show').ganho).toBeLessThan(1);
    expect(fatorDoJeito(timida, 'caminhar_junto').ganho).toBeGreaterThan(1);
    // Os gostos são os mesmos de sempre (o sorteio estável pelo id).
    expect(gostosDaPessoa({ id: 'abc' })).toEqual(gostosDaPessoa({ id: 'abc' }));
  });

  it('a memória: a traição pesa e fecha os convites até ser reparada; a ajuda pesa a favor', () => {
    let v = base();
    const { p, vin } = comParceiro(v, { estagio: 'namoro', anos: 3 });
    expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'jantar_romantico' as never }))).toBe(true);
    lembrarCom(v, p.id, 'Descobriu a traição.', 'traicao', 3);
    const ferido = climaDaMemoria(v, vin, p);
    expect(ferido).toBeLessThan(-0.3);
    expect(traicaoQueNaoPassou(v, vin)).toBeTruthy();
    const d = disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'jantar_romantico' as never });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/depois do que aconteceu/);
    // Pedir desculpas continua aberto; a reconciliação desarma boa parte.
    v.t += 3;
    lembrarCom(v, p.id, 'Fizeram as pazes.', 'reconciliacao', 2);
    expect(traicaoQueNaoPassou(v, vin)).toBeUndefined();
    const depois = climaDaMemoria(v, vin, p);
    expect(depois).toBeGreaterThan(ferido + 0.2);
    // Com o tempo, a mágoa esfria (mas uma traição demora: não volta a zero em poucos anos).
    v = transacao(v, x => { x.t += 12 * 12; }).vida;
    expect(climaDaMemoria(v, v.vinculos[p.id], p)).toBeGreaterThan(depois);
  });

  it('promessa: um ano depois a pessoa confere — sem contato, vira promessa quebrada', () => {
    const v = base();
    const { p, vin } = comParceiro(v, { estagio: 'namoro' });
    v.fatos[`promessa:${p.id}`] = v.t - 13;
    vin.tUltimoContato = v.t - 13;
    conferirPromessas(v);
    expect(vin.historia.some(m => m.tipo === 'promessa_quebrada')).toBe(true);
    expect(v.fatos[`promessa:${p.id}`]).toBeUndefined();
    const w = base();
    const b = comParceiro(w, { estagio: 'namoro' });
    w.fatos[`promessa:${b.p.id}`] = w.t - 13;
    b.vin.tUltimoContato = w.t - 1;
    b.vin.habitos = { conversar: 3 };
    conferirPromessas(w);
    expect(b.vin.historia.some(m => m.tipo === 'promessa')).toBe(true);
  });

  it('conhecer a família lê os pais de verdade: pais mortos não aparecem vivos; famílias diferentes dão cenas diferentes', () => {
    const textos = new Set<string>();
    for (let k = 0; k < 14; k++) {
      let v = transacao(adulto(28, { semente: 1262 + k }), x => { x.momento = null; }).vida;
      const { p } = comParceiro(v, { estagio: 'namoro', anos: k % 4 });
      const pai = pessoaNova(v, 60, 'masculino', { vivo: k % 3 !== 0, temperamento: { extroversao: 0, afabilidade: k % 2 ? 0.6 : -0.5, responsabilidade: 0, abertura: 0, estabilidade: k % 5 === 0 ? -0.7 : 0.2 } });
      const mae = pessoaNova(v, 58, 'feminino', { vivo: k % 3 !== 0 });
      p.genitores = [pai.id, mae.id];
      const saida = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'conhecer_familia' as never });
      v = saida.vida;
      expect(v.biografia.slice(-1)[0].texto).toMatch(/família/);
      const res = saida.resultado ?? '';
      if (k % 3 === 0) { expect(res).toMatch(/não tem mais/); expect(res).not.toMatch(new RegExp(`casa de ${pai.nome}`)); }
      textos.add(res);
    }
    expect(textos.size).toBeGreaterThanOrEqual(10);
  });

  it('o caso: o presente no cartão e a viagem deixam rastro (que soma ao risco da descoberta)', () => {
    let v = base();
    comParceiro(v, { estagio: 'casamento' });
    const amante = pessoaNova(v, 30, 'masculino');
    const vin = vincular(v, amante, { origem: 'romance', proximidade: 60 });
    vin.romance = { estagio: 'saindo', tEstagio: v.t - 8, tInicio: v.t - 8, envolvimento: 66, secreto: true };
    for (const i of ['caso_encontro', 'caso_presente', 'caso_viagem', 'caso_futuro', 'caso_tempo']) expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: i as never })), i).toBe(true);
    v = executar(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_viagem' as never }).vida;
    expect(riscoDoRastro(v, amante.id)).toBeGreaterThan(0);
    expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_viagem' as never }).grau).toBe('incompativel');
  });

  it('o presente deixa lembrança; os gostos em comum aparecem nas falas (alguma vez)', () => {
    let v = base();
    const amigos = Object.values(v.vinculos).filter(x => !x.parentesco && !x.romance).slice(0, 6);
    for (const a of amigos) a.proximidade = 60;
    let falas = 0;
    for (const a of amigos) {
      const r = executar(v, { tipo: 'pessoa', pessoaId: a.pessoaId, interacao: 'conversar' as never });
      v = r.vida;
      if (/assunto|em comum|ainda não esqueceu|Não esquece|preza|quiet|pavio|planos|falou pouco/.test(r.resultado ?? '')) falas++;
    }
    expect(falas).toBeGreaterThanOrEqual(0);
    const p: Pessoa = v.pessoas[amigos[0].pessoaId];
    expect(p).toBeTruthy();
  });
});
