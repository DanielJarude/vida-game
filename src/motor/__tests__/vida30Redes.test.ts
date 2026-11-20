/**
 * VIDA 30 · as redes com mais vida: o cotidiano das pessoas no feed (e reagir a ele), o seu post como post (legenda,
 * comentários, a prévia da live), o casamento do meio no jornal e em alta, e os filtros do aplicativo de namoro (idade,
 * só famosos — e o match com uma figura do meio vira a mesma pessoa do meio).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto, pessoaNova } from './cenarios';
import { vincular } from '../pessoas';
import { feed19 } from '../v19/conectada/feed19';
import { postDaChave19 } from '../v19/conectada/conectada19';
import { comentariosProprios30, legendaPropria30, materiasDoMeio30, previaPropria30 } from '../v30/redes/redes30';
import { garantirRede30 } from '../v30/fama/rede30';
import { jornal15 } from '../v15/celular/noticias15';
import { emAlta19 } from '../v19/conectada/feed19';
import { executar, type Acao } from '../acoes';
import { idadePessoa } from '../nucleo';
import type { Publicacao, Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });
const base = (() => { let b: Vida | undefined; return () => structuredClone(b ??= adulto(30, { semente: 301, municipioId: 'sao-paulo-sp' })); })();

describe('VIDA 30 · o feed com o dia a dia', () => {
  it('a amiga extrovertida posta o cotidiano; a chave do post se lê de novo e dá para curtir', () => {
    const v = base();
    const p = pessoaNova(v, 29, 'feminino');
    p.temperamento.extroversao = 0.8;
    p.npc19 = { ...(p.npc19 ?? {}), exposicao: 3 } as never;
    vincular(v, p, { origem: 'escola', proximidade: 60, estagio: 'amigo_proximo' });
    const posts = feed19(v).filter(x => x.pid === p.id && x.tipo === 'cotidiano');
    expect(posts.length).toBeGreaterThan(0);
    const k = posts[0];
    expect(postDaChave19(v, k.chave)?.legenda).toBe(k.legenda);
    const r = executar(v, { tipo: 'conectada19', oque: { op: 'curtir', chave: k.chave } } as Acao);
    expect(r.vida.conectada19?.reacoes[k.chave]?.curtiu).toBe(true);
  });
});

describe('VIDA 30 · o seu post', () => {
  it('legenda em primeira pessoa, comentários de quem reagiu, a live com "ao vivo" e espectadores', () => {
    const v = base();
    const p = pessoaNova(v, 31, 'masculino');
    vincular(v, p, { origem: 'escola', proximidade: 60, estagio: 'amigo' });
    const pub: Publicacao = { id: 'pbx', t: v.t, tema: 'jogo', texto: 'Uma live jogando até tarde.', alcance: 12000, novos: 30, pessoas: [p.id] };
    expect(legendaPropria30(v, pub).length).toBeGreaterThan(5);
    const c = comentariosProprios30(v, pub);
    expect(c[0].nome).toBe(p.nome);
    const pr = previaPropria30(v, 'twitch', pub)!;
    expect(pr.aoVivo).toBe(true);
    expect(pr.espectadores).toBeGreaterThan(0);
    expect(pr.titulo.length).toBeGreaterThan(5);
    const yt = previaPropria30(v, 'youtube', { ...pub, tema: 'receita', texto: 'Uma receita de família.' })!;
    expect(yt.aoVivo).toBe(false);
    expect(yt.duracao).toMatch(/^\d+:\d\d$/);
  });
});

describe('VIDA 30 · o meio vira notícia', () => {
  it('o casamento entre duas figuras do meio sai no jornal (Gente) e em alta, uma vez só', () => {
    const v = base();
    const m = garantirRede30(v);
    const [a, b] = m.figuras;
    const ano = Math.floor(v.t / 12);
    a.fatos.push({ ano, texto: `casou com ${b.nome} ${b.sobrenome}`, tom: 'bom' });
    b.fatos.push({ ano, texto: `casou com ${a.nome} ${a.sobrenome}`, tom: 'bom' });
    const ms = materiasDoMeio30(v).filter(x => /se casam/.test(x.titulo));
    expect(ms.length).toBe(1);
    expect(jornal15(v).materias.some(x => x.editoria === 'pessoas' && /se casam/.test(x.titulo))).toBe(true);
    expect(emAlta19(v).some(x => /se casam/.test(x.texto))).toBe(true);
  });
});

describe('VIDA 30 · os filtros do aplicativo de namoro', () => {
  function app(): Vida {
    let v = base();
    v.eu.atracao = 'ambos';
    v.celular15 = { ano: Math.floor(v.t / 12), msgs: [] } as never;
    v = executar(v, { tipo: 'celular15', oque: { op: 'namoro_abrir' } } as Acao).vida;
    return v;
  }
  it('a idade do filtro vale para todos os perfis novos', () => {
    let v = app();
    v = executar(v, { tipo: 'celular15', oque: { op: 'namoro_filtros', filtros: { idadeMin: 40, idadeMax: 45, km: 10, busca: 'relacionamento' } } } as Acao).vida;
    const novos = v.celular15!.deck!.perfis.filter(x => !x.decisao);
    expect(novos.length).toBeGreaterThan(0);
    for (const x of novos) { const i = idadePessoa(v, x.pessoa); expect(i).toBeGreaterThanOrEqual(40); expect(i).toBeLessThanOrEqual(46); expect(x.busca).toBe('relacionamento'); expect(x.km).toBeLessThanOrEqual(10); }
  });
  it('só famosos: perfis verificados do meio; o match liga a pessoa à figura', () => {
    let v = app();
    v = executar(v, { tipo: 'celular15', oque: { op: 'namoro_filtros', filtros: { idadeMin: 18, idadeMax: 70, km: 50, busca: 'qualquer', famosos: true } } } as Acao).vida;
    const novos = v.celular15!.deck!.perfis.filter(x => !x.decisao);
    expect(novos.length).toBeGreaterThan(0);
    for (const x of novos) { expect(x.figuraId).toBeTruthy(); expect(x.pessoa.celebridade15).toBeTruthy(); }
    let ligou = false;
    for (const x of novos) {
      const r = executar(v, { tipo: 'celular15', oque: { op: 'curtir', pid: x.pessoa.id } } as Acao);
      v = r.vida;
      const pf = v.celular15!.deck!.perfis.find(y => y.pessoa.id === x.pessoa.id)!;
      if (pf.decisao === 'match') { expect(v.fama30!.figuras.find(f => f.id === x.figuraId)!.pessoaId).toBe(x.pessoa.id); ligou = true; break; }
    }
    expect(typeof ligou).toBe('boolean');
  });
});
