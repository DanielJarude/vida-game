/**
 * REWORK 11 · Fase I — redes sociais: a moderação com motivo (advertência → suspensão → banimento permanente que zera a
 * renda, com recurso), nada de punição sem motivo, a repercussão no trabalho, e a monetização por assinatura intocada.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { transacao } from '../nucleo';
import type { ContaSocial, Vida } from '../tipos';
import { PLATAFORMAS } from '../dados/redes';
import { advertir, BANIMENTO_MESES, leituraDoBalanco } from '../sistemas/redes';
import { contaAtiva, rendaDaConta, rendaDaRede } from '../sistemas/redesBase';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const BASE = em(adulto(26, { semente: 1201 }), x => { x.financas.conta = 1e6; });
const rede = (op: object): Parameters<typeof executar>[1] => ({ tipo: 'rede', op } as Parameters<typeof executar>[1]);

function comConta(pl: 'instagram' | 'x' | 'onlyfans', f: (c: ContaSocial, x: Vida) => void = () => {}): Vida {
  let v = executar(BASE, rede({ oque: 'criar', plataforma: pl })).vida;
  v = em(v, x => f(x.redes!.contas[pl], x));
  return v;
}

describe('SOC-11 · moderação', () => {
  it('três advertências suspendem (com o motivo dito); a terceira suspensão bane — a conta some e a renda zera', () => {
    const v = comConta('instagram', c => { c.seguidores = 80000; c.monetizada = 0; c.credibilidade = 70; });
    expect(rendaDaRede(v)).toBeGreaterThan(0);
    const w = em(v, x => {
      const c = x.redes!.contas.instagram;
      for (let k = 0; k < 3; k++) advertir(x, PLATAFORMAS.instagram, c, 'provocação nos comentários');
      expect(c.suspensaAte).toBe(x.t + 12);
      expect(c.motivoPunicao).toBe('provocação nos comentários');
      for (let k = 0; k < 6; k++) advertir(x, PLATAFORMAS.instagram, c, 'provocação nos comentários');
    });
    const c = w.redes!.contas.instagram;
    expect(c.banida).toBe(w.t);
    expect(c.apagada).toBe(w.t);
    expect(contaAtiva(w, 'instagram')).toBeUndefined();
    expect(rendaDaRede(w)).toBe(0);
    expect(rendaDaConta(w, c)).toBe(0);
    expect(w.biografia.some(e => /banida de vez/.test(e.texto))).toBe(true);
    // Banida: recriar só depois de cinco anos.
    const d = disponibilidade(w, rede({ oque: 'criar', plataforma: 'instagram' }));
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/baniu/);
    const depois = em(w, x => { x.t += BANIMENTO_MESES; });
    expect(disponibilidade(depois, rede({ oque: 'criar', plataforma: 'instagram' })).grau).toBe('permitido');
  });

  it('o recurso existe uma vez por punição (e a resposta é dita)', () => {
    let v = comConta('instagram');
    v = em(v, x => { const c = x.redes!.contas.instagram; for (let k = 0; k < 3; k++) advertir(x, PLATAFORMAS.instagram, c, 'publicação que virou briga, denunciada'); });
    const d = disponibilidade(v, rede({ oque: 'recorrer', plataforma: 'instagram' }));
    expect(d.grau).toBe('improvavel');
    const r = executar(v, rede({ oque: 'recorrer', plataforma: 'instagram' }));
    const texto = r.aviso?.texto ?? '';
    expect(texto).toMatch(/Recurso aceito|manteve/);
    // Aceito: a suspensão caiu (não há mais de que recorrer); negado: o recurso já foi usado nesta punição.
    expect(disponibilidade(r.vida, rede({ oque: 'recorrer', plataforma: 'instagram' })).grau).toBe(/aceito/.test(texto) ? 'impossivel' : 'incompativel');
    // Sem punição, não há de que recorrer.
    expect(disponibilidade(comConta('x'), rede({ oque: 'recorrer', plataforma: 'x' })).grau).toBe('impossivel');
  });

  it('nada de punição sem motivo: posts comuns nunca dão advertência; a briga de conta tóxica, às vezes — com o motivo', () => {
    let comum = comConta('instagram');
    for (let ano = 0; ano < 6; ano++) {
      comum = em(comum, x => { x.t += 12; x.anoAtual.acoes = []; });
      for (let k = 0; k < 4; k++) comum = executar(comum, rede({ oque: 'publicar', plataforma: 'instagram', tema: 'cotidiano' })).vida;
    }
    expect(comum.redes!.contas.instagram.advertencias ?? 0).toBe(0);
    expect(comum.redes!.contas.instagram.suspensoes ?? 0).toBe(0);
    // Uma conta briguenta no X, dez anos de opinião e política (duas de cada por ano): a denúncia aparece — com o motivo.
    let v = comConta('x', c => { c.toxicidade = 60; c.seguidores = 5000; });
    let punicoes = 0;
    const motivos = new Set<string>();
    for (let ano = 0; ano < 10; ano++) {
      v = em(v, x => { x.t += 12; x.anoAtual.acoes = []; });
      for (const tema of ['opiniao', 'opiniao', 'politica', 'politica']) {
        if (!contaAtiva(v, 'x') || v.redes!.contas.x.suspensaAte !== undefined) break;
        const antes = (v.redes!.contas.x.advertencias ?? 0) + (v.redes!.contas.x.suspensoes ?? 0) * 10;
        v = executar(v, rede({ oque: 'publicar', plataforma: 'x', tema })).vida;
        const c = v.redes!.contas.x;
        if ((c.advertencias ?? 0) + (c.suspensoes ?? 0) * 10 !== antes) { punicoes++; motivos.add(c.motivoPunicao!); }
        v = em(v, x => { x.redes!.contas.x.toxicidade = 60; });
      }
      v = em(v, x => { x.redes!.contas.x.suspensaAte = undefined; });
    }
    expect(punicoes).toBeGreaterThan(0);
    expect([...motivos].every(m => /denunciada/.test(m))).toBe(true);
  });
});

describe('SOC-11.5 · o número de agora e o do fim do ano', () => {
  it('o balanço aberto diz quanto entrou desde o fim do ano anterior (a mesma conta do perfil)', () => {
    const v = comConta('instagram', (c, x) => {
      c.anos = [{ desde: x.t - 12, ate: x.t, inicio: 300000, organico: 0, publicacoes: 180000, exposicao: 0, comprados: 0, perdas: 0, fim: 480000 }];
      c.balanco = { desde: x.t, inicio: 480000, organico: 0, publicacoes: 189000, exposicao: 0, comprados: 0, perdas: 0 };
      c.seguidores = 669000;
    });
    const b = leituraDoBalanco(v, v.redes!.contas.instagram, 'aberto')!;
    expect(v.redes!.contas.instagram.seguidores - b.inicio).toBe(189000);
    expect(b.fecha).toBe(true);
  });
});

describe('SOC-11.6 · a monetização por assinatura não mudou', () => {
  it('OnlyFans com 1.000 assinantes de verdade, confiança 70, engajamento 50 e constância cheia: 9.000 por mês', () => {
    const v = comConta('onlyfans', (c, x) => {
      c.seguidores = 1000; c.credibilidade = 70; c.engajamento = 50; c.monetizada = x.t; c.verificada = x.t;
      c.publicacoes = [0, 1, 2, 3].map(k => ({ id: `p${k}`, t: x.t - k, tema: 'exclusivo' as const, texto: 'x', alcance: 100, novos: 0 }));
    });
    expect(rendaDaConta(v, v.redes!.contas.onlyfans)).toBe(9000);
  });
});
