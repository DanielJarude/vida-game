/**
 * VIDA 31 — as copas que faltavam: o Mundial de Clubes (a Copa Intercontinental até 2004) para quem ganha a copa
 * continental, como jogador e como técnico; e, para o técnico, a Copa do Brasil e a copa continental do ano.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { aCompeticaoId, idMundialDeClubes, mundialDeClubes, nomeDaCompeticao } from '../sistemas/competicoes';
import { aceitarPropostaDeTecnico, decidirFinal, passagemAtual, processarTecnico, resumoDoTecnico } from '../sistemas/tecnico';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente } from '../sistemas/frentes';

describe('o Mundial de Clubes', () => {
  it('tem nome de época: a Copa Intercontinental até 2004, o Mundial de Clubes depois', () => {
    expect(idMundialDeClubes(1981)).toBe('mundial:intercontinental');
    expect(idMundialDeClubes(2012)).toBe('mundial:clubes');
    expect(nomeDaCompeticao('mundial:intercontinental')).toBe('Copa Intercontinental');
    expect(nomeDaCompeticao('mundial:clubes')).toBe('Mundial de Clubes');
    expect(aCompeticaoId('mundial:clubes')).toBe('o Mundial de Clubes');
    expect(aCompeticaoId('mundial:intercontinental')).toBe('a Copa Intercontinental');
  });

  it('não existe antes de 1960; o campeão sul-americano ganha às vezes, não sempre; a campanha é coerente', () => {
    const v = adulto(30, { semente: 3 });
    expect(mundialDeClubes(v, 'BR', 1955, 'Flamengo', 0)).toBeUndefined();
    let campeao = 0, n = 0;
    for (let ano = 1961; ano <= 2024; ano++) for (const clube of ['Flamengo', 'Palmeiras', 'Santos']) {
      const c = mundialDeClubes(v, 'BR', ano, clube, 0)!;
      n++;
      expect(c.id).toBe(idMundialDeClubes(ano));
      expect(['quartas', 'semifinal', 'vice', 'campeão']).toContain(c.fase);
      expect(c.jogos).toBe(c.v + c.e + c.d);
      if (ano < 2005) { expect(c.jogos).toBe(1); expect(c.final).toBeDefined(); }
      if (c.fase === 'campeão' || c.fase === 'vice') expect(c.final?.placar).toMatch(/\d a \d/);
      if (c.fase === 'campeão') campeao++;
    }
    expect(campeao / n).toBeGreaterThan(0.1);
    expect(campeao / n).toBeLessThan(0.9);
  });

  it('o mesmo ano e o mesmo clube dão o mesmo Mundial (sem mexer no sorteio do jogo)', () => {
    const v = adulto(30, { semente: 4 });
    expect(mundialDeClubes(v, 'BR', 2019, 'Flamengo', 0.2)).toEqual(mundialDeClubes(v, 'BR', 2019, 'Flamengo', 0.2));
  });
});

/** Um técnico no comando de um grande da elite, com moral (contratado pelo próprio motor; o clube é trocado pelo grande). */
function tecnicoNoGrande(semente: number): Vida {
  return transacao(adulto(45, { semente, genero: 'masculino', municipioId: 'rio-de-janeiro-rj' }), (x, r) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol');
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade');
    processarTecnico(x, r);
    const pr = x.caminhos.tecnico?.proposta;
    if (!passagemAtual(x) && pr) aceitarPropostaDeTecnico(x, r, pr.id);
    const p = passagemAtual(x)!;
    Object.assign(p, { clube: 'Flamengo', municipioId: 'rio-de-janeiro-rj', nivel: 4, pressao: 0, vestiario: 85, contratoAte: x.t + 240 });
    x.caminhos.tecnico!.reputacao = 85;
    x.momento = null;
  }).vida;
}

describe('o técnico disputa as copas', () => {
  it('a Copa do Brasil todo ano na elite; a continental quando se classifica; o Mundial quando ganha a continental — e J = V + E + D', () => {
    let copas = 0, continentais = 0, mundiais = 0, titulosInternacionais = 0;
    for (let s = 1; s <= 8; s++) {
      let v = tecnicoNoGrande(s * 13);
      v = transacao(v, x => {
        for (let k = 0; k < 8 && passagemAtual(x); k++) {
          const p = passagemAtual(x)!; p.pressao = 0; p.contratoAte = x.t + 240;
          x.t += 12; processarTecnico(x, criarRng(s * 100 + k));
          if (passagemAtual(x)?.decisao) decidirFinal(x, criarRng(s * 7 + k), 'neutro');
        }
      }).vida;
      for (const p of v.caminhos.tecnico!.passagens) for (const t of p.temporadas) {
        expect(t.jogos).toBe(t.v + t.e + t.d);
        if (t.copa?.id === 'copa:BR') copas++;
        if (t.continental) { continentais++; expect(t.continental.id).toBe('cont:CONMEBOL'); }
        if (t.mundial) { mundiais++; expect(t.continental?.fase).toBe('campeão'); }
        titulosInternacionais += (t.titulos ?? []).filter(x => /Libertadores|Mundial|Intercontinental/.test(x)).length;
      }
      const r = resumoDoTecnico(v.caminhos.tecnico!);
      expect(r.jogos).toBe(r.v + r.e + r.d);
    }
    expect(copas).toBeGreaterThan(20);
    expect(continentais).toBeGreaterThan(5);
    expect(mundiais).toBeGreaterThan(0);
    expect(titulosInternacionais).toBeGreaterThan(0);
  });
});
