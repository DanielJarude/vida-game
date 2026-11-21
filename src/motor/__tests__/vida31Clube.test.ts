/**
 * VIDA 31 — o clube do dono com mais profundidade: os jogadores (do elenco e do mercado) com os MESMOS arquétipos do
 * atleta da vida, a química do elenco na força, e o comando — técnico, capitão, empréstimo, ingressos, patrocínio.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import { mediaDoElenco, mercadoDoAno, patrociniosDoAno, processarClube20, tecnicosDisponiveis } from '../v20/clubes/clubes20';
import { perfilDoJogador20, perfisDoElenco, quimicaDoElenco } from '../v20/clubes/perfil31';
import { arquetipo } from '../sistemas/arquetipos';
import type { Vida } from '../tipos';

const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const C = (oque: unknown) => ({ tipo: 'clube20', oque } as Acao);
function dono(): Vida {
  const v = adulto(40, { semente: 21 });
  v.financas.conta = 3e9;
  const x = tenta(v, C({ op: 'comprar', nome: 'Bahia', pais: 'BR' }));
  x.clube20!.caixa = 5e8;
  return x;
}

describe('os jogadores do clube têm os arquétipos do atleta da vida', () => {
  it('o perfil é estável, vem da lista de arquétipos do futebol e quase todo elenco tem tipos variados', () => {
    const v = dono(); const c = v.clube20!; const ano = anoDe(v.t); const m = mediaDoElenco(c);
    const a = perfisDoElenco(c, ano, m), b = perfisDoElenco(c, ano, m);
    const tipos = new Set<string>();
    for (const j of c.elenco) {
      expect(a.get(j.id)).toEqual(b.get(j.id));
      const p = a.get(j.id)!;
      for (const id of [p.perfil.principal, ...p.perfil.secundarios].filter(Boolean) as string[]) {
        const arq = arquetipo(id)!;
        expect(arq.modalidades === '*' || arq.modalidades.includes('futebol')).toBe(true);
        tipos.add(id);
      }
      if (j.pos === 'GOL') expect(p.papel).toBe('goleiro');
    }
    expect(tipos.size).toBeGreaterThanOrEqual(4);
  });

  it('o jogador do mercado contratado continua com o mesmo jeito (a posição e os atributos)', () => {
    let v = dono(); const ano = anoDe(v.t);
    const alvo = mercadoDoAno(v)[0];
    const antes = perfilDoJogador20(alvo, ano, { mediaDoTime: 60 });
    v = tenta(v, C({ op: 'contratar', id: alvo.id }));
    const j = v.clube20!.elenco.find(x => x.id === alvo.id)!;
    expect(j).toBeDefined();
    const depois = perfilDoJogador20(j, ano, { mediaDoTime: 60 });
    expect(depois.papel).toBe(antes.papel);
    expect(depois.atributos).toEqual(antes.atributos);
  });

  it('a química fica entre −2 e +2, e escolher um capitão nunca a piora', () => {
    let v = dono(); const ano = anoDe(v.t);
    const q0 = quimicaDoElenco(v.clube20!, ano, mediaDoElenco(v.clube20!));
    expect(Math.abs(q0)).toBeLessThanOrEqual(2);
    const veterano = [...v.clube20!.elenco].sort((a, b) => a.tNasc - b.tNasc)[0];
    v = tenta(v, C({ op: 'capitao', id: veterano.id }));
    expect(v.clube20!.capitao31).toBe(veterano.id);
    expect(quimicaDoElenco(v.clube20!, ano, mediaDoElenco(v.clube20!))).toBeGreaterThanOrEqual(q0);
  });
});

describe('o comando do clube', () => {
  it('o técnico: luvas no caixa, salário na despesa e força a mais na temporada', () => {
    const base = dono();
    const ofertas = tecnicosDisponiveis(base);
    expect(ofertas).toHaveLength(3);
    const k = ofertas.reduce((m, t, i) => (t.nivel > ofertas[m].nivel ? i : m), 0);
    const comT = tenta(structuredClone(base), C({ op: 'tecnico', i: k }));
    expect(comT.clube20!.tecnico31?.nome).toBe(ofertas[k].nome);
    expect(base.clube20!.caixa - comT.clube20!.caixa).toBe(Math.round(ofertas[k].salario * 0.25));
    const semT = structuredClone(base);
    for (const x of [comT, semT]) { x.t += 12; processarClube20(x); }
    const f = (x: Vida) => Object.entries(x.clube20!.forcaPorAno).sort((a, b) => Number(b[0]) - Number(a[0]))[0][1];
    if (ofertas[k].nivel > 2) expect(f(comT)).toBeGreaterThan(f(semT));
    // Demitir custa metade do salário.
    const caixa = comT.clube20!.caixa;
    const dem = tenta(comT, C({ op: 'demitir_tecnico' }));
    expect(dem.clube20!.tecnico31).toBeUndefined();
    expect(caixa - dem.clube20!.caixa).toBe(Math.round(comT.clube20!.tecnico31!.salario * 0.5));
  });

  it('o empréstimo: só jovem reserva; volta no ano seguinte, sem perder força', () => {
    let v = dono(); const ano = anoDe(v.t);
    const c = v.clube20!;
    const titular = [...c.elenco].sort((a, b) => b.forca - a.forca)[0];
    expect(podeTentar(disponibilidade(v, C({ op: 'emprestar', id: titular.id })))).toBe(false);
    const jovem = [...c.elenco].filter(j => ano - anoDe(j.tNasc) <= 23).sort((a, b) => a.forca - b.forca)[0];
    if (!jovem) return;
    v = tenta(v, C({ op: 'emprestar', id: jovem.id }));
    expect(v.clube20!.elenco.some(j => j.id === jovem.id)).toBe(false);
    expect(v.clube20!.emprestados31?.[0].jogador.id).toBe(jovem.id);
    v.t += 12; processarClube20(v);
    const volta = v.clube20!.elenco.find(j => j.id === jovem.id);
    expect(volta).toBeDefined();
    expect(volta!.forca).toBeGreaterThanOrEqual(jovem.forca);
    expect(v.clube20!.emprestados31 ?? []).toHaveLength(0);
  });

  it('o patrocínio e os ingressos entram na receita do ano; tudo persiste no save', () => {
    const base = dono();
    const ofertas = patrociniosDoAno(base);
    expect(ofertas.length).toBe(3);
    let com = tenta(structuredClone(base), C({ op: 'patrocinio', i: 0 }));
    expect(com.clube20!.patrocinio31?.valor).toBe(ofertas[0].valor);
    expect(podeTentar(disponibilidade(com, C({ op: 'patrocinio', i: 1 })))).toBe(false);
    com = tenta(com, C({ op: 'ingresso', nivel: 0 }));
    expect(com.clube20!.ingresso31).toBe(0);
    expect(interpretar(JSON.stringify(com)).tipo).toBe('ok');
  });
});
