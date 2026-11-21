/**
 * VIDA 32 — a organização de e-sports do dono: comprar (catálogo real nos anos certos + fictícias), fundar, o elenco com
 * os arquétipos do e-sports, o mercado com reforços acima do elenco, a temporada (história, caixa, troféus), as ações e
 * os saves.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida, interpretar } from '../save';
import { anoDe } from '../tempo';
import { arquetipo } from '../sistemas/arquetipos';
import {
  forcaDoTime31, mediaDosTitulares31, mercadoOrg31, orgsAVenda31, perfisDoElenco31, processarOrg31, titulares31, type OqueOrg31
} from '../v31/esports/org31';
import type { Vida } from '../tipos';

const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const rico = () => { const v = adulto(35, { semente: 32 }); v.financas.conta = 5e8; return v; };

describe('organizações à venda', () => {
  it('lista orgs do catálogo (respeitando os anos) e fictícias, por jogo e região', () => {
    const v = rico(); const ano = anoDe(v.t);
    const lista = orgsAVenda31(v);
    expect(lista.length).toBeGreaterThan(40);
    expect(lista.some(x => x.real) && lista.some(x => !x.real)).toBe(true);
    expect(new Set(lista.map(x => x.regiao)).size).toBe(2);
    for (const x of lista) { expect(x.preco).toBeGreaterThan(0); expect(x.preco).toBeLessThanOrEqual(x.valor); }
    // LOUD só existe no VALORANT a partir de 2020
    if (ano < 2020) expect(lista.some(x => x.nome === 'LOUD' && x.jogo === 'valorant')).toBe(false);
  });
});

describe('comprar e fundar', () => {
  it('compra uma org: sai dinheiro, vem o elenco completo com IGL e a mesa abre', () => {
    const v = rico();
    const alvo = orgsAVenda31(v, { regiao: 'BR' }).sort((a, b) => b.divisao - a.divisao)[0];
    const antes = v.financas.conta;
    const x = tenta(v, A({ op: 'comprar', nome: alvo.nome, jogo: alvo.jogo, regiao: 'BR' }));
    const o = x.orgEsports31!;
    expect(o).toBeDefined();
    expect(o.nome).toBe(alvo.nome);
    expect(x.financas.conta).toBe(antes - alvo.preco);
    expect(o.elenco.length).toBeGreaterThanOrEqual(titulares31(o, anoDe(x.t)).length + 2);
    expect(o.mesa.length).toBeGreaterThan(0);
    // segunda compra bloqueada, com o motivo
    const d = disponibilidade(x, A({ op: 'fundar', nome: 'Outra GG', jogo: 'cs', regiao: 'BR' }));
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/já é dono/);
  });

  it('fundar: nome validado, custo pago, começa no cenário aberto e fraco', () => {
    const v = rico();
    expect(disponibilidade(v, A({ op: 'fundar', nome: 'x', jogo: 'cs', regiao: 'BR' })).motivo).toMatch(/nome/);
    const pobre = adulto(30, { semente: 33 }); pobre.financas.conta = 100;
    expect(disponibilidade(pobre, A({ op: 'fundar', nome: 'Carcará do Sertão', jogo: 'cs', regiao: 'BR' })).motivo).toMatch(/custa/);
    const x = tenta(v, A({ op: 'fundar', nome: 'Carcará do Sertão', jogo: 'cs', regiao: 'BR' }));
    const o = x.orgEsports31!;
    expect(o.fundada).toBe(true);
    expect(o.divisao).toBe(2);
    expect(x.financas.conta).toBeLessThan(v.financas.conta);
    expect(mediaDosTitulares31(o, anoDe(x.t))).toBeLessThan(55);
  });

  it('menor de idade não compra', () => {
    const v = adulto(15, { semente: 34 }); v.financas.conta = 1e9;
    expect(disponibilidade(v, A({ op: 'fundar', nome: 'Jovem GG', jogo: 'cs', regiao: 'BR' })).motivo).toMatch(/maior de idade/);
  });
});

describe('elenco, arquétipos e mercado', () => {
  it('os perfis vêm dos arquétipos do e-sports (ou de todo esporte) e são estáveis', () => {
    const v = tenta(rico(), A({ op: 'fundar', nome: 'Guará GG', jogo: 'cs', regiao: 'BR' }));
    const o = v.orgEsports31!; const ano = anoDe(v.t);
    const a = perfisDoElenco31(o, ano), b = perfisDoElenco31(o, ano);
    for (const j of o.elenco) {
      expect(a.get(j.id)).toEqual(b.get(j.id));
      for (const id of [a.get(j.id)!.perfil.principal, ...a.get(j.id)!.perfil.secundarios].filter(Boolean) as string[]) {
        const arq = arquetipo(id)!;
        expect(arq.modalidades === '*' || arq.modalidades.includes('esports')).toBe(true);
      }
    }
  });

  it('o mercado tem jogadores MELHORES do que os titulares, e contratar um deixa o time mais forte', () => {
    let v = tenta(rico(), A({ op: 'fundar', nome: 'Siriema Club', jogo: 'valorant', regiao: 'BR' }));
    const ano = anoDe(v.t);
    v.orgEsports31!.caixa = 5e7;
    const media = mediaDosTitulares31(v.orgEsports31!, ano);
    const melhorTitular = Math.max(...titulares31(v.orgEsports31!, ano).map(j => j.forca));
    const m = mercadoOrg31(v);
    expect(m.filter(j => j.forca > media).length).toBeGreaterThanOrEqual(3);
    expect(m.some(j => j.faixa === 'reforco' && j.forca > melhorTitular - 3)).toBe(true);
    expect(m.some(j => j.faixa === 'aposta')).toBe(true);
    const antes = forcaDoTime31(v.orgEsports31!, ano);
    const alvo = [...m].sort((a, b) => b.forca - a.forca)[0];
    v = tenta(v, A({ op: 'contratar', id: alvo.id }));
    expect(v.orgEsports31!.elenco.some(j => j.id === alvo.id)).toBe(true);
    expect(mercadoOrg31(v).some(j => j.id === alvo.id)).toBe(false);
    expect(forcaDoTime31(v.orgEsports31!, ano)).toBeGreaterThan(antes);
  });

  it('mensagens de disponibilidade: caixa, IGL, bootcamp, dispensar o último', () => {
    let v = tenta(rico(), A({ op: 'fundar', nome: 'Basalto Team', jogo: 'cs', regiao: 'BR' }));
    const o = v.orgEsports31!;
    o.caixa = 0;
    const alvo = mercadoOrg31(v)[0];
    expect(disponibilidade(v, A({ op: 'contratar', id: alvo.id })).motivo).toMatch(/caixa/);
    expect(disponibilidade(v, A({ op: 'bootcamp' })).motivo).toMatch(/bootcamp custa/);
    v = tenta(v, A({ op: 'aportar', valor: 2e6 }));
    v = tenta(v, A({ op: 'bootcamp' }));
    expect(v.orgEsports31!.bootcamp).toBe(anoDe(v.t));
    expect(disponibilidade(v, A({ op: 'bootcamp' })).motivo).toMatch(/já fez/);
    const j = v.orgEsports31!.elenco[0];
    v = tenta(v, A({ op: 'igl', id: j.id }));
    expect(v.orgEsports31!.igl).toBe(j.id);
    expect(disponibilidade(v, A({ op: 'igl', id: j.id })).motivo).toMatch(/já é o IGL/);
    while (v.orgEsports31!.elenco.length > titulares31(v.orgEsports31!, anoDe(v.t)).length) v = tenta(v, A({ op: 'dispensar', id: v.orgEsports31!.elenco[v.orgEsports31!.elenco.length - 1].id }));
    expect(disponibilidade(v, A({ op: 'dispensar', id: v.orgEsports31!.elenco[0].id })).motivo).toMatch(/time completo/);
    expect(disponibilidade(adulto(30, { semente: 35 }), A({ op: 'bootcamp' })).motivo).toMatch(/não é dono/);
  });
});

describe('a temporada', () => {
  it('fechar o ano escreve a história, mexe no caixa e abre a mesa; o mesmo ano não conta duas vezes', () => {
    let v = rico();
    const alvo = orgsAVenda31(v, { regiao: 'BR' }).filter(x => x.divisao === 4)[0];
    v = tenta(v, A({ op: 'comprar', nome: alvo.nome, jogo: alvo.jogo, regiao: 'BR' }));
    const o = v.orgEsports31!;
    const caixa0 = o.caixa;
    v.t += 12;
    processarOrg31(v);
    expect(o.historico.length).toBe(1);
    const h = o.historico[0];
    expect(h.posicao).toBeGreaterThanOrEqual(1);
    expect(h.receita).toBeGreaterThan(0);
    expect(h.despesa).toBeGreaterThan(0);
    expect(o.caixa === caixa0 && o.divida === alvo.divida).toBe(false);
    if (h.titulo) expect(o.trofeus.length).toBeGreaterThan(0);
    processarOrg31(v);
    expect(o.historico.length).toBe(1);
  });

  it('dez temporadas seguidas: sem NaN, elenco sempre completo, troféus coerentes com a história', () => {
    let v = rico();
    v = tenta(v, A({ op: 'fundar', nome: 'Mandacaru Esports', jogo: 'lol', regiao: 'BR' }));
    v.orgEsports31!.caixa = 3e7; v.orgEsports31!.academiaNivel = 2;
    for (let k = 0; k < 10; k++) {
      v.t += 12;
      processarOrg31(v);
      for (const s of [...v.orgEsports31!.mesa]) v = tenta(v, A({ op: 'responder', id: s.id, opcao: s.opcoes[0].id }));
      const o = v.orgEsports31!;
      expect(Number.isFinite(o.caixa) && Number.isFinite(o.valor) && Number.isFinite(o.divida)).toBe(true);
      expect(o.elenco.length).toBeGreaterThanOrEqual(titulares31(o, anoDe(v.t)).length);
    }
    const o = v.orgEsports31!;
    expect(o.historico.length).toBe(10);
    expect(o.trofeus.filter(t => t.tipo === 'liga').length).toBe(o.historico.filter(h => h.titulo).length);
  });
});

describe('saves', () => {
  it('exportar e interpretar preserva a organização; um estado quebrado some sem derrubar o save', () => {
    let v = tenta(rico(), A({ op: 'fundar', nome: 'Vagalume GG', jogo: 'rocket', regiao: 'INT' }));
    v.t += 12; processarOrg31(v);
    const arq = JSON.parse(exportarVida(v));
    expect(arq.formato).toBe('vida-save');
    const r = interpretar(JSON.stringify(arq.vida));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.orgEsports31).toEqual(v.orgEsports31);
    const imp = importarVida(exportarVida(v));
    expect(imp.tipo).toBe('ok');
    if (imp.tipo === 'ok') expect(imp.vida.orgEsports31?.nome).toBe('Vagalume GG');
    const quebrado = { ...arq.vida, orgEsports31: { nome: 3 } };
    const r2 = interpretar(JSON.stringify(quebrado));
    expect(r2.tipo).toBe('ok');
    if (r2.tipo === 'ok') expect(r2.vida.orgEsports31).toBeUndefined();
  });
});
