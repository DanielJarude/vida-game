/**
 * VIDA 30 · §3 — a fama vivida: o meio com vida própria, o reconhecimento em pessoa proporcional ao nome, o evento em que
 * se conhece uma figura do meio (que vira Pessoa da vida, com o vínculo de sempre), o convite do celular que vira cena, e
 * a privacidade.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto } from './cenarios';
import { executar } from '../acoes';
import { anoDaRede30, conhecidosDoMeio30, fama30DoAno, garantirRede30, nivelDoNome30, noticiasDoMeio30 } from '../v30/fama/rede30';
import { abrirCena30 } from '../ano';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

let BASE: Vida | undefined;
/** Uma vida adulta (feita uma vez) com o nome do tamanho pedido; a semente muda o id (o acaso derivado). */
function famoso(valor: number, semente = 41): Vida {
  BASE ??= adulto(28, { semente: 41, municipioId: 'sao-paulo-sp' });
  const v = structuredClone(BASE);
  v.id = `${BASE.id}_${semente}`;
  v.notoriedade = { valor, pico: valor, fonte: 'arte', t: v.t, origens: { arte: valor } };
  v.momento = null; delete v.fila;
  return v;
}

describe('VIDA 30 · §3 o meio', () => {
  it('nasce com figuras de identidade (ofício, cidade, jeito) e vive sozinho: fatos, laços entre elas, notícias', () => {
    const v = famoso(40);
    const m = garantirRede30(v);
    expect(m.figuras.length).toBe(14);
    for (const f of m.figuras) { expect(f.oficio.length).toBeGreaterThan(3); expect(f.nome).toBeTruthy(); }
    expect(new Set(m.figuras.map(f => `${f.nome} ${f.sobrenome}`)).size).toBe(14);
    const manchetes: string[] = [];
    for (let k = 0; k < 8; k++) { v.t += 12; manchetes.push(...anoDaRede30(v)); }
    expect(manchetes.length).toBeGreaterThan(3);
    expect(m.figuras.some(f => f.lacos.some(l => ['romance', 'casados', 'rivalidade', 'parceria'].includes(l.tipo)))).toBe(true);
    expect(noticiasDoMeio30(v, 8).length).toBeGreaterThan(5);
  });

  it('nome pequeno: nenhuma cena; o reconhecimento cresce com o nome', () => {
    expect(nivelDoNome30(famoso(3))).toBe(0);
    expect(fama30DoAno(famoso(3), true)).toBeUndefined();
    const vistos: Record<number, Set<string>> = { 1: new Set(), 3: new Set() };
    for (const [valor, n] of [[15, 1], [60, 3]] as const) {
      for (let s = 0; s < 40; s++) { const v = famoso(valor, 100 + s); const id = fama30DoAno(v, true); if (id) vistos[n].add(id); }
    }
    expect(vistos[1].has('fama30_paparazzi')).toBe(false);
    expect(vistos[1].has('fama30_evento')).toBe(false);
    expect(vistos[1].has('fama30_rua')).toBe(true);
    expect([...vistos[3]].some(x => x !== 'fama30_rua')).toBe(true);
  });

  it('a cena da rua abre com o lugar e o tamanho do nome; responder registra e mexe na privacidade', () => {
    let v: Vida | undefined;
    for (let s = 0; s < 60 && !v; s++) { const x = famoso(35, 300 + s); const id = fama30DoAno(x, true); if (id === 'fama30_rua') { abrirCena30(x, id); v = x; } }
    expect(v?.momento?.situacaoId).toBe('fama30_rua');
    const antes = v!.fama30!.privacidade;
    const r = executar(v!, { tipo: 'decidir', opcaoId: 'fotos' });
    expect(r.vida.fama30!.vividas.length).toBe(1);
    expect(r.vida.fama30!.privacidade).toBeLessThan(antes);
    expect(r.vida.fama30!.cena).toBeUndefined();
  });

  it('o evento: a figura do meio vira Pessoa da vida (vínculo, memória do encontro) e continua no meio', () => {
    let v: Vida | undefined;
    for (let s = 0; s < 80 && !v; s++) { const x = famoso(45, 500 + s); const id = fama30DoAno(x, true); if (id === 'fama30_evento') { abrirCena30(x, id); v = x; } }
    expect(v?.momento?.situacaoId).toBe('fama30_evento');
    const fid = v!.fama30!.cena!.figuraId!;
    const r = executar(v!, { tipo: 'decidir', opcaoId: 'contato' });
    const f = r.vida.fama30!.figuras.find(x => x.id === fid)!;
    expect(f.pessoaId).toBeTruthy();
    const p = r.vida.pessoas[f.pessoaId!];
    expect(p.celebridade15).toBeTruthy();
    expect(p.ocupacao).toBe(f.oficio);
    expect(r.vida.vinculos[p.id].historia.some(h => /Conheceram-se/.test(h.texto))).toBe(true);
    expect(conhecidosDoMeio30(r.vida).some(x => x.f.id === fid)).toBe(true);
  });

  it('o convite de evento aceito no celular vira a cena presencial (não um contato sorteado)', () => {
    let v = famoso(50, 77);
    garantirRede30(v);
    v.celular15 = { ano: Math.floor(v.t / 12), msgs: [{ id: 'mx', t: v.t, tipo: 'evento', remetente: 'Organização do prêmio', texto: '"Mesa reservada."', assunto: 'premio', onde: 'evento', custo: 0 }] } as never;
    v = executar(v, { tipo: 'celular15', oque: { op: 'responder', id: 'mx', escolha: 'ir' } } as never).vida;
    expect(v.momento?.situacaoId).toBe('fama30_evento');
    expect(v.fama30!.cena?.onde).toMatch(/premiação/);
  });

  it('privacidade baixa pesa no estresse', () => {
    const v = famoso(90, 9);
    const m = garantirRede30(v);
    m.privacidade = 20;
    const e0 = v.mente.estresse;
    fama30DoAno(v, false);
    expect(v.mente.estresse).toBeGreaterThan(e0);
  });
});
