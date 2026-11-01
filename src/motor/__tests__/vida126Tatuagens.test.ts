/**
 * VIDA 12.6 — o estúdio de tatuagem inteiro: regiões precisas e independentes, posição/escala/rotação conferidas pela
 * geometria, cor e intensidade, retoque, laser com histórico, cobertura, composições, significado e os saves antigos.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { DESENHOS, MODELOS_DE_COMPOSICAO, REGIOES, regioesDoDesenho, type RegiaoDeTatuagem } from '../dados/tatuagens';
import {
  ANOS_PARA_RETOQUE, composicoesNaFigura, desgasteDaTinta, estadoDaTatuagem, historicoDeTatuagens, normalizarTatuagens, retanguloDe, sobrepoe, tatuagensDe, tatuagensDeAmorPerdido,
  tatuagensNaFigura, regiaoDe
} from '../sistemas/tatuagens';
import type { Acao } from '../acoes';
import type { Vida } from '../tipos';

const rica = (i = 30): Vida => transacao(adulto(i, { semente: 1261, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), d.motivo).toBe(true); return executar(v, a).vida; };

describe('VIDA 12.6 · tatuagens por região', () => {
  it('várias no mesmo braço, cada uma na sua região: nenhuma substitui a outra', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'antebraco', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'rosa_tradicional', regiao: 'biceps', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'sol_tribal', regiao: 'ombro', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'triangulo_mini', regiao: 'dedos', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'ancora', regiao: 'antebraco', lado: 'd' });
    const xs = tatuagensDe(v);
    expect(xs).toHaveLength(5);
    expect(xs.map(x => `${regiaoDe(x)}:${x.lado}`).sort()).toEqual(['antebraco:d', 'antebraco:e', 'biceps:e', 'dedos:e', 'ombro:e']);
    // Na figura, cada uma no seu lugar.
    expect(tatuagensNaFigura(v).map(t => t.regiao).sort()).toEqual(['antebraco', 'antebraco', 'biceps', 'dedos', 'ombro']);
  });

  it('a posição pedida é conferida: por cima de outra, não; fora do corpo, nunca (a posição só vai até a borda)', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'coxa', lado: 'd', ajuste: { x: 0, y: -1, escala: 1, rot: 0 } });
    const cima: Acao = { tipo: 'tatuar', desenho: 'girassol', regiao: 'coxa', lado: 'd', ajuste: { x: 0, y: -0.8, escala: 1, rot: 0 } };
    expect(disponibilidade(v, cima).grau).toBe('incompativel');
    expect(disponibilidade(v, cima).motivo).toMatch(/por cima/);
    // Embaixo, na mesma coxa, cabe.
    v = fazer(v, { ...cima, ajuste: { x: 0, y: 1, escala: 1, rot: 0 } } as Acao);
    // Pedir x = 9 é o mesmo que a borda: o retângulo fica inteiro dentro da região.
    v = fazer(v, { tipo: 'tatuar', desenho: 'coracaozinho', regiao: 'abdomen', ajuste: { x: 9, y: -9, escala: 1, rot: 30 } });
    const c = tatuagensDe(v).find(x => x.desenho === 'coracaozinho')!;
    const r = retanguloDe(c)!;
    expect(Math.abs(r.cx) + r.w / 2).toBeLessThanOrEqual(REGIOES.abdomen.w / 2 + 1e-6);
    expect(Math.abs(r.cy) + r.h / 2).toBeLessThanOrEqual(REGIOES.abdomen.h / 2 + 1e-6);
    // Nenhum par na mesma região se sobrepõe.
    const xs = tatuagensDe(v);
    for (const a of xs) for (const b of xs) if (a !== b && regiaoDe(a) === regiaoDe(b) && a.lado === b.lado) expect(sobrepoe(retanguloDe(a)!, retanguloDe(b)!)).toBe(false);
  });

  it('grande demais não cabe; o lado é obrigatório onde existe; peça inteira só na superfície; menor de idade não tatua', () => {
    const v = rica();
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'leao_realista', tamanho: 3, regiao: 'pulso', lado: 'd' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'biceps' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'dragao_costas', regiao: 'costas_alta' }).grau).toBe('impossivel');
    expect(disponibilidade(rica(17), { tipo: 'tatuar', desenho: 'andorinha', regiao: 'biceps', lado: 'd' }).grau).toBe('impossivel');
    // Todo desenho, em todo tamanho, tem pelo menos uma região onde cabe; todo projeto cabe no corpo.
    for (const d of DESENHOS) for (const t of d.tamanhos) expect(regioesDoDesenho(d, t).length, `${d.id} ${t}`).toBeGreaterThan(0);
    for (const m of MODELOS_DE_COMPOSICAO) for (const p of m.pecas) expect(regioesDoDesenho(DESENHOS.find(x => x.id === p.desenho)!, p.tamanho)).toContain(p.regiao);
  });

  it('a superfície e as regiões de baixo se excluem: a peça do braço inteiro não vai onde já há tatuagem', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'pontos', regiao: 'pulso', lado: 'd' });
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'fechamento', regiao: 'manga', lado: 'd' }).grau).toBe('incompativel');
    v = fazer(v, { tipo: 'tatuar', desenho: 'fechamento', regiao: 'manga', lado: 'e' });
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'pontos', regiao: 'pulso', lado: 'e' }).grau).toBe('incompativel');
    // A perna e o peito do lado de cá continuam livres.
    expect(podeTentar(disponibilidade(v, { tipo: 'tatuar', desenho: 'pontos', regiao: 'tornozelo', lado: 'e' }))).toBe(true);
  });

  it('cor, tom, intensidade, texto e significado ficam no registro e chegam à figura; o preço sobe com a cor', () => {
    let v = rica();
    const conta0 = v.financas.conta;
    v = fazer(v, { tipo: 'tatuar', desenho: 'peonia', regiao: 'costelas', lado: 'e', cor: 'colorida', tom: 'pastel', intensidade: 0.8 });
    const colorida = conta0 - v.financas.conta;
    const c1 = v.financas.conta;
    v = fazer(v, { tipo: 'tatuar', desenho: 'peonia', regiao: 'costelas', lado: 'd', cor: 'preta' });
    expect(c1 - v.financas.conta).toBeLessThan(colorida);
    v = fazer(v, { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'pulso', lado: 'd', texto: 'Helena', significado: { tipo: 'amor' } });
    const f = tatuagensNaFigura(v);
    expect(f.find(t => t.regiao === 'costelas' && t.lado === 'e')).toMatchObject({ cor: 'colorida', tom: 'pastel', intensidade: 0.8 });
    expect(f.find(t => t.desenho === 'nome_cursivo')!.texto).toBe('Helena');
    expect(v.biografia.some(e => /Helena/.test(e.texto) && e.relevancia === 'biografia')).toBe(true);
    // O traço não vira colorido.
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'ancora', regiao: 'coxa', lado: 'd', cor: 'colorida' }).grau).toBe('impossivel');
  });

  it('o tempo desbota devagar; o retoque só depois de uns anos devolve a tinta', () => {
    let v = rica(25);
    v = fazer(v, { tipo: 'tatuar', desenho: 'rosa_tradicional', regiao: 'biceps', lado: 'd' });
    const id = tatuagensDe(v)[0].id;
    expect(disponibilidade(v, { tipo: 'retocar_tatuagem', id }).grau).toBe('incompativel');
    v = transacao(v, x => { x.t += 12 * 20; }).vida;
    const x = tatuagensDe(v)[0];
    const gasto = desgasteDaTinta(v, x);
    expect(gasto).toBeGreaterThan(0.2);
    expect(gasto).toBeLessThanOrEqual(0.5);
    expect(tatuagensNaFigura(v)[0].anos).toBeCloseTo(20, 0);
    v = fazer(v, { tipo: 'retocar_tatuagem', id });
    expect(tatuagensNaFigura(v)[0].anos).toBe(0);
    expect(desgasteDaTinta(v, tatuagensDe(v)[0])).toBeLessThan(0.05);
    expect(ANOS_PARA_RETOQUE).toBeGreaterThanOrEqual(3);
  });

  it('o laser: mais caro, leva meses, e a tatuagem continua no histórico depois de sair da pele', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'tigre', regiao: 'costas_alta' });
    const id = tatuagensDe(v)[0].id;
    v = fazer(v, { tipo: 'remover_tatuagem', id });
    expect(estadoDaTatuagem(v, v.eu.tatuagens![0])).toBe('saindo');
    v = transacao(v, x => { x.t += 30; }).vida;
    expect(tatuagensDe(v)).toHaveLength(0);
    expect(historicoDeTatuagens(v)).toHaveLength(1);
    expect(estadoDaTatuagem(v, v.eu.tatuagens![0])).toBe('removida');
    // A colorida grande deixa uma sombra leve (que não ocupa o lugar).
    expect(tatuagensNaFigura(v)[0].sombra).toBe(true);
    expect(podeTentar(disponibilidade(v, { tipo: 'tatuar', desenho: 'tigre', regiao: 'costas_alta' }))).toBe(true);
  });

  it('a cobertura: maior, escura, no mesmo lugar; a antiga sai da pele e fica no histórico', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'antebraco', lado: 'e', texto: 'Bruno' });
    const antiga = tatuagensDe(v)[0];
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'ramo_fino', regiao: 'antebraco', lado: 'e', cobre: antiga.id }).grau).toBe('incompativel');
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'biceps', lado: 'e', cobre: antiga.id }).grau).toBe('impossivel');
    v = fazer(v, { tipo: 'tatuar', desenho: 'rosa_tradicional', regiao: 'antebraco', lado: 'e', cobre: antiga.id });
    expect(tatuagensDe(v).map(x => x.desenho)).toEqual(['rosa_tradicional']);
    expect(historicoDeTatuagens(v).find(x => x.id === antiga.id)!.coberta).toBeTruthy();
    expect(v.biografia.some(e => /Cobriu/.test(e.texto))).toBe(true);
  });

  it('composição: vários desenhos independentes (um por região) com um fundo; o que já existe entra no conjunto', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'carpa', regiao: 'biceps', lado: 'd' });
    v = fazer(v, { tipo: 'compor_tatuagens', modelo: 'manga_oriental', lado: 'd' });
    const xs = tatuagensDe(v).filter(x => x.lado === 'd');
    expect(xs.length).toBe(5);
    expect(new Set(xs.map(x => x.conjunto)).size).toBe(1);
    expect(xs.filter(x => x.desenho === 'carpa')).toHaveLength(1);
    expect(composicoesNaFigura(v)).toHaveLength(1);
    // Cada peça continua independente: tirar uma não tira as outras.
    v = fazer(v, { tipo: 'remover_tatuagem', id: xs.find(x => x.desenho === 'hannya')!.id });
    v = transacao(v, x => { x.t += 30; }).vida;
    expect(tatuagensDe(v).filter(x => x.lado === 'd')).toHaveLength(4);
    // O outro braço não foi tocado.
    expect(podeTentar(disponibilidade(v, { tipo: 'compor_tatuagens', modelo: 'manga_realista', lado: 'e' }))).toBe(true);
  });

  it('um amor que acaba deixa a tatuagem com o nome dele para trás (a vida pode lembrar disso)', () => {
    let v = rica();
    const vin = Object.values(v.vinculos).find(x => !x.parentesco)!;
    v = transacao(v, x => { x.vinculos[vin.pessoaId].romance = { estagio: 'namoro', envolvimento: 70, tInicio: x.t } as never; }).vida;
    v = fazer(v, { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'pulso', lado: 'e', significado: { tipo: 'amor', pessoaId: vin.pessoaId } });
    expect(tatuagensDeAmorPerdido(v)).toHaveLength(0);
    v = transacao(v, x => { x.vinculos[vin.pessoaId].romance!.estagio = 'ex'; }).vida;
    expect(tatuagensDeAmorPerdido(v)).toHaveLength(1);
  });
});

describe('VIDA 12.6 · saves antigos', () => {
  it('as tatuagens do 11.5.1 (só a parte grande) ganham região e lugar sem se sobrepor; nada se perde; idempotente', () => {
    const v = rica();
    v.eu.tatuagens = [
      { id: 'a', desenho: 'ramo_fino', local: 'antebraco', lado: 'e', t: v.t - 30 },
      { id: 'b', desenho: 'nome_cursivo', local: 'antebraco', lado: 'e', t: v.t - 20 },
      { id: 'c', desenho: 'coracaozinho', local: 'antebraco', lado: 'e', t: v.t - 10 },
      { id: 'd', desenho: 'fechamento', local: 'braco', lado: 'd', t: v.t - 40 },
      { id: 'e', desenho: 'pantera', local: 'braco', lado: 'e', t: v.t - 5 },
      { id: 'f', desenho: 'andorinha', local: 'peito', t: v.t - 5 },
      { id: 'g', desenho: 'andorinha', local: 'peito', t: v.t - 4 },
      { id: 'h', desenho: 'dragao_costas', local: 'costas', t: v.t - 3 },
      { id: 'i', desenho: 'ramos', local: 'pescoco', lado: 'd', t: v.t - 2 }
    ] as never;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const xs = lido.vida.eu.tatuagens!;
    expect(xs).toHaveLength(9);
    expect(xs.every(x => !!x.regiao && REGIOES[x.regiao as RegiaoDeTatuagem])).toBe(true);
    expect(xs.find(x => x.id === 'd')!.regiao).toBe('manga');
    expect(xs.find(x => x.id === 'h')!.regiao).toBe('costas_inteiras');
    for (const a of xs) for (const b of xs) if (a !== b && a.regiao === b.regiao && a.lado === b.lado) expect(sobrepoe(retanguloDe(a)!, retanguloDe(b)!), `${a.id}×${b.id}`).toBe(false);
    const antes = JSON.stringify(lido.vida.eu.tatuagens);
    normalizarTatuagens(lido.vida);
    expect(JSON.stringify(lido.vida.eu.tatuagens)).toBe(antes);
    // Exportar e importar de novo guarda tudo (registro, composições).
    let w = fazer(lido.vida, { tipo: 'compor_tatuagens', modelo: 'perna_old_school', lado: 'e' });
    const de_novo = interpretar(JSON.stringify(w));
    expect(de_novo.tipo === 'ok' && de_novo.vida.eu.tatuagens).toEqual(w.eu.tatuagens);
    expect(de_novo.tipo === 'ok' && de_novo.vida.eu.composicoes).toEqual(w.eu.composicoes);
  });
});
