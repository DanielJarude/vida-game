/**
 * VIDA 26.2 · os estilos de luta: a escolha, a troca (a técnica de cada estilo guardada), os atributos que pesam, as
 * faixas, o MMA a partir dos 18, a temporada e o histórico com o estilo, o caminho por estilo e o save.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida } from '../save';
import type { CarreiraEsportiva, Vida } from '../tipos';
import { garantirFrente, habilidade } from '../sistemas/frentes';
import { atributosDaCarreira } from '../sistemas/atributosEsportivos';
import { historicoDaCarreira } from '../sistemas/perfisEsportivos';
import { ESTILOS26, faixa26, LISTA_ESTILOS26, aproveitamento26 } from '../v26/esporte/estilos26';
import { leituraDaLuta26, nomeDaLuta26 } from '../v26/lutas/luta26';
import { trajetorias26 } from '../v26/carreira/trajetorias26';
import { nomeDaModalidade } from '../sistemas/esporte';

beforeAll(async () => { await carregarMundo(); });
const L = (estilo: string) => ({ tipo: 'luta26', estilo } as Acao);
function lutador(idade: number, tecnica = 50): Vida {
  const v = nova({ semente: 2620 + idade, genero: 'masculino' } as never);
  v.t = v.eu.tNasc + idade * 12; v.momento = null;
  v.rotinas.push({ id: 'lutas', tInicio: v.t - 48, nivel: 1 });
  const f = garantirFrente(v, 'lutas'); f.habilidade = tecnica; f.meses = 48;
  return v;
}

describe('VIDA 26.2 · catálogo', () => {
  it('sete estilos, pesos que somam 1, conjuntos diferentes; faixas em ordem nos que graduam', () => {
    expect(LISTA_ESTILOS26).toEqual(['muay_thai', 'boxe', 'jiu_jitsu', 'judo', 'karate', 'taekwondo', 'mma']);
    const conj = new Set<string>();
    for (const e of Object.values(ESTILOS26)) {
      expect(e.atributos.reduce((s, [, p]) => s + p, 0), e.id).toBeCloseTo(1, 5);
      conj.add(e.atributos.map(([a, p]) => `${a}${p}`).join());
      if (e.faixas) for (let k = 1; k < e.faixas.length; k++) { expect(e.faixas[k].tecnica).toBeGreaterThan(e.faixas[k - 1].tecnica); expect(e.faixas[k].nome).not.toBe(''); }
    }
    expect(conj.size).toBe(7);
    expect(ESTILOS26.boxe.faixas).toBeUndefined();
    expect(ESTILOS26.jiu_jitsu.faixas![ESTILOS26.jiu_jitsu.faixas!.length - 1].nome).toBe('preta');
  });
  it('o boxe pesa os golpes e não o chão; o jiu-jitsu, o chão', () => {
    const peso = (id: keyof typeof ESTILOS26, a: string) => ESTILOS26[id].atributos.find(([x]) => x === a)?.[1] ?? 0;
    expect(peso('boxe', 'golpes')).toBeGreaterThan(0.2); expect(peso('boxe', 'solo')).toBe(0);
    expect(peso('jiu_jitsu', 'solo')).toBeGreaterThan(0.3); expect(peso('jiu_jitsu', 'golpes')).toBe(0);
    expect(peso('mma', 'golpes')).toBeGreaterThan(0); expect(peso('mma', 'solo')).toBeGreaterThan(0);
  });
  it('faixas: pela técnica, pelos anos e pela idade (preta do jiu-jitsu só com 19)', () => {
    expect(faixa26('jiu_jitsu', 80, 10, 17)!.atual).toBe('roxa');
    expect(faixa26('jiu_jitsu', 80, 10, 17)!.atual).not.toBe('preta');
    expect(faixa26('jiu_jitsu', 80, 10, 25)!.atual).toBe('preta');
    expect(faixa26('jiu_jitsu', 40, 0.5, 25)!.atual).toBe('branca');
    expect(faixa26('boxe', 90, 10, 30)).toBeUndefined();
    expect(aproveitamento26('muay_thai', 'boxe')).toBeGreaterThan(aproveitamento26('muay_thai', 'jiu_jitsu'));
  });
});

describe('VIDA 26.2 · escolher e trocar', () => {
  it('pede praticar luta; a primeira escolha não muda a técnica', () => {
    const v = nova({ semente: 9 } as never); v.t = v.eu.tNasc + 20 * 12;
    expect(podeTentar(disponibilidade(v, L('boxe')))).toBe(false);
    let w = lutador(20, 50);
    w = executar(w, L('muay_thai')).vida;
    expect(w.lutas26?.estilo).toBe('muay_thai');
    expect(habilidade(w, 'lutas')).toBe(50);
    expect(nomeDaLuta26(w)).toBe('Muay Thai');
    expect(nomeDaModalidade(w, 'lutas')).toBe('Muay Thai');
  });
  it('trocar guarda a técnica do estilo deixado; voltar devolve o que se tinha', () => {
    let v = executar(lutador(25, 60), L('muay_thai')).vida;
    v = executar(v, L('jiu_jitsu')).vida;
    expect(habilidade(v, 'lutas')).toBeCloseTo(60 * aproveitamento26('muay_thai', 'jiu_jitsu'), 0);
    expect(v.lutas26?.tecnicas?.muay_thai).toBe(60);
    v = executar(v, L('muay_thai')).vida;
    expect(habilidade(v, 'lutas')).toBe(60);
    expect(v.biografia.some(b => /Trocou o Muay Thai pelo Jiu-jitsu/.test(b.texto))).toBe(true);
  });
  it('MMA só a partir dos 18', () => {
    expect(podeTentar(disponibilidade(lutador(16), L('mma')))).toBe(false);
    expect(podeTentar(disponibilidade(lutador(18), L('mma')))).toBe(true);
  });
});

describe('VIDA 26.2 · o estilo na carreira', () => {
  it('os atributos da carreira são os do estilo; sem estilo, os de antes', () => {
    const v = lutador(24, 70);
    const e = { modalidade: 'lutas' } as CarreiraEsportiva;
    const antes = atributosDaCarreira(e, undefined, undefined, v).map(([id]) => id);
    const w = executar(v, L('boxe')).vida;
    expect(atributosDaCarreira(e, undefined, undefined, w)).toEqual(ESTILOS26.boxe.atributos);
    expect(antes).toContain('solo');
  });
  it('o histórico mostra o estilo da temporada; temporadas antigas, só a categoria', () => {
    const e = { modalidade: 'lutas', temporadas: [
      { ano: 2030, clube: 'x', nivel: 2, partidas: 4, titular: 4, gols: 0, assistencias: 0, nota: 6, colocacao: 3, mesesFora: 0, luta: { categoria: 'até 70 kg', lutas: 5, vitorias: 3, derrotas: 2, antesDoTempo: 1, titulos: 0, podios: 1, sequencia: 2 } },
      { ano: 2031, clube: 'x', nivel: 2, partidas: 4, titular: 4, gols: 0, assistencias: 0, nota: 6, colocacao: 3, mesesFora: 0, luta: { categoria: 'até 70 kg', estilo: 'Muay Thai', lutas: 5, vitorias: 4, derrotas: 1, antesDoTempo: 2, titulos: 1, podios: 1, sequencia: 3 } }
    ] } as unknown as CarreiraEsportiva;
    const h = historicoDaCarreira(e);
    expect(h.linhas[0][2]).toBe('até 70 kg');
    expect(h.linhas[1][2]).toBe('Muay Thai · até 70 kg');
  });
});

describe('VIDA 26.2 · a tela lê, o caminho, o save', () => {
  it('a leitura mostra a faixa, a próxima e o custo de trocar', () => {
    const v = executar(lutador(20, 45), L('jiu_jitsu')).vida;
    const l = leituraDaLuta26(v);
    expect(l.faixa?.atual).toBe('azul');
    expect(l.faixa?.proxima?.nome).toBe('roxa');
    expect(l.opcoes.find(o => o.id === 'boxe')!.tecnica).toBeLessThan(45);
  });
  it('o explorador marca o estilo que é o seu', () => {
    const v = executar(lutador(20, 45), L('boxe')).vida;
    const t = trajetorias26(v);
    expect(t.find(x => x.id === 'lutas_boxe')!.meu).toBe(true);
    expect(t.find(x => x.id === 'lutas_judo')!.porque).toMatch(/Boxe/);
  });
  it('o save guarda o estilo e as técnicas; o que vier quebrado sai', () => {
    let v = executar(lutador(22, 55), L('karate')).vida;
    v = executar(v, L('taekwondo')).vida;
    const r = importarVida(exportarVida(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.lutas26).toEqual(v.lutas26);
    const q = JSON.parse(JSON.stringify(v)); q.lutas26 = { estilo: 'capoeira_inexistente' };
    const r2 = importarVida(exportarVida(q));
    if (r2.tipo === 'ok') expect(r2.vida.lutas26).toBeUndefined();
  });
});
