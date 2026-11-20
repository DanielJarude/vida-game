/** VIDA 29 · tênis por superfície: o calendário tem dura, saibro e grama; a aptidão sai dos atributos; o ano registra cada uma. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { garantirFrente } from '../sistemas/frentes';
import { aptidaoNaSuperficie29, entrarNaBase, fecharTemporada, linhaDaTemporada, profissionalizar, superficieDoTorneio29 } from '../sistemas/esporte';
import type { AtributoId } from '../v26/esporte/atributos26';

describe('VIDA 29 · superfícies do tênis', () => {
  it('o calendário: a maior parte em quadra dura, depois o saibro, a grama é curta', () => {
    const v = adulto(22, { semente: 3 });
    const c = { dura: 0, saibro: 0, grama: 0 };
    for (let k = 0; k < 400; k++) c[superficieDoTorneio29(v, 2020 + (k % 8), k)]++;
    expect(c.dura).toBeGreaterThan(c.saibro);
    expect(c.saibro).toBeGreaterThan(c.grama);
    expect(c.grama).toBeGreaterThan(0);
  });

  it('o sacador forte rende mais na grama; o consistente e resistente, no saibro', () => {
    const sacador = (id: AtributoId) => (id === 'saque' || id === 'rede' ? 12 : id === 'resistencia' || id === 'consistencia' ? -8 : 0);
    const fundista = (id: AtributoId) => (id === 'resistencia' || id === 'consistencia' ? 12 : id === 'saque' || id === 'rede' ? -8 : 0);
    expect(aptidaoNaSuperficie29(sacador, 'grama')).toBeGreaterThan(aptidaoNaSuperficie29(sacador, 'saibro'));
    expect(aptidaoNaSuperficie29(fundista, 'saibro')).toBeGreaterThan(aptidaoNaSuperficie29(fundista, 'grama'));
  });

  it('a temporada registra vitórias e derrotas por superfície (somam as do ano) e a linha diz onde rendeu mais', () => {
    const v = transacao(structuredClone(adulto(20, { semente: 31, genero: 'masculino', municipioId: 'campina-grande-pb' })), x => {
      garantirFrente(x, 'tenis');
      Object.assign(x.caminhos.frentes.tenis!, { habilidade: 90, interesse: 90, meses: 140, auge: 90 });
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
      x.financas.conta += 400000;
      entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de Campina Grande');
      profissionalizar(x, criarRng(1), 3);
      x.t += 12;
      const t = fecharTemporada(x, criarRng(70), x.caminhos.esporte!);
      const s = t.superficies29!;
      const soma = Object.values(s).reduce((a, [w, l]) => [a[0] + w, a[1] + l], [0, 0]);
      expect(soma[0]).toBe(t.vitorias);
      expect(soma[1]).toBe(t.derrotas);
      expect(linhaDaTemporada(x, t, 'tenis')).toMatch(/vitórias/);
    }).vida;
    expect(v).toBeTruthy();
  });
});
