/** VIDA 15 · o celular: mensagens com contexto, respostas com consequência, encontros por acaso, namoro com perfis, rede dos amigos. */
import { describe, expect, it } from 'vitest';
import { adulto, pessoaNova, comParceiro } from './cenarios';
import { nova, viver } from './ajuda';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { feed15, matches15, opcoesDaMsg15, processarCelular15, depoisDaAcao15, naoLidas15 } from '../v15/celular/celular15';
import type { Vida } from '../tipos';

function comAmigos(v: Vida, n: number): string[] {
  const ids: string[] = [];
  for (let k = 0; k < n; k++) {
    const p = pessoaNova(v, 26 + k, k % 2 ? 'feminino' : 'masculino');
    const vin = vincular(v, p, { origem: 'trabalho', proximidade: 60, estagio: k < 2 ? 'amigo_proximo' : 'amigo' });
    vin.tUltimoContato = v.t - 30;
    ids.push(p.id);
  }
  return ids;
}

describe('VIDA 15 · mensagens do ano', () => {
  it('chegam mensagens com contexto (de quem está na vida), sem repetir a pessoa, e o save guarda', () => {
    let total = 0, comDe = 0;
    for (let s = 1; s <= 12; s++) {
      const v = structuredClone(adulto(28, { semente: s }));
      comAmigos(v, 6);
      v.t += 12;
      processarCelular15(v);
      const msgs = v.celular15?.msgs ?? [];
      total += msgs.length;
      const de = msgs.filter(m => m.de).map(m => m.de);
      expect(new Set(de).size).toBe(de.length);
      for (const m of msgs) { if (m.de) { comDe++; expect(v.vinculos[m.de]).toBeDefined(); } expect(m.texto).not.toMatch(/\{o\}|\{dele\}|\{x\}/); }
      const l = interpretar(JSON.stringify(v));
      expect(l.tipo === 'ok' && l.vida.celular15?.msgs.length).toBe(msgs.length);
    }
    expect(total).toBeGreaterThan(8);
    expect(comDe).toBeGreaterThan(4);
  });

  it('a mesma virada de ano não entrega duas vezes; quem não tem ninguém recebe pouco', () => {
    const v = structuredClone(adulto(30, { semente: 3 }));
    comAmigos(v, 6);
    v.t += 12;
    processarCelular15(v);
    const n = v.celular15!.msgs.length;
    processarCelular15(v);
    expect(v.celular15!.msgs.length).toBe(n);
  });

  it('responder um convite custa, aproxima e fica na história; responder de novo não dá', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      let v = structuredClone(adulto(27, { semente: s }));
      comAmigos(v, 6);
      v.financas.conta = 50000;
      v.t += 12;
      processarCelular15(v);
      const m = v.celular15!.msgs.find(x => x.tipo === 'convite');
      if (!m) continue;
      achou = true;
      const prox = v.vinculos[m.de!].proximidade;
      const conta = v.financas.conta;
      const a = { tipo: 'celular15', oque: { op: 'responder', id: m.id, escolha: 'aceitar' } } as const;
      expect(podeTentar(disponibilidade(v, a))).toBe(true);
      v = executar(v, a).vida;
      expect(v.vinculos[m.de!].proximidade).toBeGreaterThan(prox);
      expect(v.financas.conta).toBeLessThanOrEqual(conta);
      expect(v.celular15!.msgs.find(x => x.id === m.id)!.resposta?.op).toBe('aceitar');
      expect(v.vinculos[m.de!].historia.some(h => /Saíram juntos|programa/.test(h.texto))).toBe(true);
      expect(podeTentar(disponibilidade(v, a))).toBe(false);
    }
    expect(achou).toBe(true);
  });
});

describe('VIDA 15 · durante o ano e por acaso', () => {
  it('depois de algumas escolhas chega mais gente; ir a lugares pode pôr alguém conhecido no caminho (até 3 por ano)', () => {
    let ondas = 0, encontros = 0;
    for (let s = 1; s <= 20; s++) {
      const v = structuredClone(adulto(30, { semente: s }));
      comAmigos(v, 8);
      v.t += 12;
      processarCelular15(v);
      for (let k = 0; k < 12; k++) depoisDaAcao15(v, { tipo: 'experiencia', id: 'viagem_pais' });
      ondas += v.celular15!.ondas ?? 0;
      const e = v.celular15!.msgs.filter(m => m.tipo === 'encontro' || (m.tipo === 'fa' && m.onda === 9));
      expect(e.length).toBeLessThanOrEqual(3);
      encontros += e.length;
      for (const m of e) expect(opcoesDaMsg15(v, m).map(o => o.op)).toContain('conversar');
    }
    expect(ondas).toBeGreaterThan(20);
    expect(encontros).toBeGreaterThan(3);
  });

  it('vida inteira: o celular toca, nada quebra, o save abre', () => {
    let v = nova({ semente: 77 });
    v = viver(v, 35);
    expect(v.celular15).toBeDefined();
    expect(naoLidas15(v)).toBeGreaterThanOrEqual(0);
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
});

describe('VIDA 15 · aplicativo de namoro', () => {
  it('abre com perfis da região; curtir pode dar match (a pessoa entra na vida com o contexto do app); passar não cria ninguém', () => {
    let matches = 0;
    for (let s = 1; s <= 10; s++) {
      let v = structuredClone(adulto(27, { semente: s }));
      v.eu.atracao = 'mulheres';
      for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
      v = executar(v, { tipo: 'celular15', oque: { op: 'namoro_abrir' } }).vida;
      const deck = v.celular15!.deck!;
      expect(deck.ano).toBe(anoDe(v.t));
      expect(deck.perfis.length).toBe(8);
      for (const pf of deck.perfis) { expect(v.pessoas[pf.pessoa.id]).toBeUndefined(); expect(pf.pessoa.genero).toBe('feminino'); }
      const pessoas = Object.keys(v.pessoas).length;
      v = executar(v, { tipo: 'celular15', oque: { op: 'passar', pid: deck.perfis[0].pessoa.id } }).vida;
      expect(Object.keys(v.pessoas).length).toBe(pessoas);
      for (const pf of v.celular15!.deck!.perfis.slice(1, 4)) {
        const r = executar(v, { tipo: 'celular15', oque: { op: 'curtir', pid: pf.pessoa.id } });
        v = r.vida;
      }
      for (const m of matches15(v)) { matches++; expect(v.vinculos[m.p.id].contexto?.via).toBe('app'); expect(m.etapa).toBe('match'); expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_conversar' }))).toBe(true); }
      expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
    }
    expect(matches).toBeGreaterThan(2);
  });

  it('menor de 18 não usa; com parceria exclusiva é irregular (traição); saindo com alguém, espera', () => {
    const v = structuredClone(adulto(17));
    v.eu.atracao = 'homens';
    expect(disponibilidade(v, { tipo: 'celular15', oque: { op: 'namoro_abrir' } }).grau).toBe('impossivel');
    const w = structuredClone(adulto(30));
    w.eu.atracao = 'mulheres';
    comParceiro(w, { genero: 'feminino' });
    expect(disponibilidade(w, { tipo: 'celular15', oque: { op: 'namoro_abrir' } }).grau).toBe('irregular');
  });
});

describe('VIDA 15 · a rede dos amigos', () => {
  it('a trajetória das pessoas vira publicação; curtir aproxima uma vez por ano', () => {
    let v = structuredClone(adulto(30, { semente: 5 }));
    const [id] = comAmigos(v, 1);
    const p = v.pessoas[id];
    p.vida = { trajetoria: [{ t: v.t - 2, texto: 'Foi promovida.', tipo: 'promocao' }] } as never;
    const post = feed15(v).find(x => x.pid === id)!;
    expect(post.texto).toMatch(/promovid/);
    const prox = v.vinculos[id].proximidade;
    v = executar(v, { tipo: 'celular15', oque: { op: 'curtir_post', chave: post.chave, pid: id } }).vida;
    expect(v.vinculos[id].proximidade).toBe(prox + 1);
    expect(feed15(v).find(x => x.pid === id)!.curtiu).toBe(true);
  });
});
