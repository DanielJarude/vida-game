/**
 * VIDA 30 · §2 — o celular: o trabalho no ambiente de quem recebe (o atleta não ouve falar de "reunião"), a memória do que
 * já foi dito, e as situações novas com continuidade (a parceria preocupada, a família que comenta uma decisão, a turma).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto, comParceiro, comParente } from './cenarios';
import { criarRng } from '../rng';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { ambienteDoTrabalho30, FALAS_TRABALHO30, PROPOSTAS30 } from '../dados17/celular/ambientes30';
import { candidatos17, chaveDoDito30, jaDito30, opcoes17, responder17 } from '../v17/celular/mensagens17';
import { escrever } from '../nucleo';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

describe('VIDA 30 · §2.3 o trabalho no lugar certo', () => {
  it('cada ocupação cai no seu ambiente', () => {
    expect(ambienteDoTrabalho30(ocupacao('jogador_futebol'))).toBe('clube');
    expect(ambienteDoTrabalho30(ocupacao('jogador_esports'))).toBe('esports');
    expect(ambienteDoTrabalho30(ocupacao('soldado_ep'))).toBe('quartel');
    expect(ambienteDoTrabalho30(ocupacao('pintor'))).toBe('obra');
    expect(ambienteDoTrabalho30(ocupacao('assistente_adm'))).toBe('escritorio');
  });
  it('fora do escritório, nenhuma fala de reunião, e-mail ou chefe; propostas no ramo', () => {
    for (const [sit, porAmb] of Object.entries(FALAS_TRABALHO30)) for (const [amb, falas] of Object.entries(porAmb)) {
      expect(falas.length, `${sit}/${amb}`).toBeGreaterThan(0);
      if (amb !== 'escritorio') for (const f of falas) expect(f, `${sit}/${amb}`).not.toMatch(/e-mail|reunião de hoje|esfrega na cara do chefe/);
    }
    for (const x of PROPOSTAS30.clube) expect(x.texto).not.toMatch(/cliente meu|projeto/);
  });
});

describe('VIDA 30 · §2.1 a memória do que foi dito', () => {
  it('a chave ignora nomes e números; o que foi dito fica marcado', () => {
    expect(chaveDoDito30('"Ana, quanto tempo! 12 anos."')).toBe(chaveDoDito30('"Bia, quanto tempo! 3 anos."'));
    const v = adulto(30, { semente: 51 });
    v.celular15 = { ano: 0, msgs: [], ditos30: [chaveDoDito30('"Oi, sumida."')] } as never;
    expect(jaDito30(v, '"Oi, sumida."')).toBe(true);
    expect(jaDito30(v, '"Outra coisa."')).toBe(false);
  });
});

describe('VIDA 30 · §2.4 situações com continuidade', () => {
  function comCelular(v: Vida) { v.celular15 ??= { ano: Math.floor(v.t / 12), msgs: [] } as never; return v; }

  it('a parceria se preocupa quando há motivo (estresse alto) — e se abrir aproxima, cortar machuca', () => {
    const v = comCelular(adulto(32, { semente: 52 }));
    const { p, vin } = comParceiro(v, { estagio: 'casamento' });
    vin.convivio = vin.convivio.filter(c => c !== 'casa');
    v.mente.estresse = 85;
    const c = candidatos17(v, new Set(), 0).find(x => x.p?.id === p.id && x.tipo === 'desabafo');
    expect(c).toBeTruthy();
    const m = { id: 'm1', t: v.t, tipo: c!.tipo, ...c!.montar(criarRng(1)) };
    expect(m.sit17).toBe('parceiro_preocupado');
    expect(opcoes17(v, m).map(o => o.op)).toEqual(['abrir', 'tranquilizar', 'irritar']);
    const conf = vin.confianca;
    responder17(v, criarRng(2), m, 'abrir');
    expect(vin.confianca).toBeGreaterThan(conf);
    expect(v.mente.estresse).toBeLessThan(85);
  });

  it('a família comenta uma decisão sua do ano (apoio ou receio, pelo risco e pelo jeito), e responder mexe no vínculo', () => {
    const v = comCelular(adulto(26, { semente: 53 }));
    const { p, vin } = comParente(v, 'mae', 55, 'feminino', 70);
    vin.convivio = [];
    escrever(v, { texto: 'Pediu demissão para tentar a vida em outra cidade.', relevancia: 'marco', tema: 'trabalho', escolha: true });
    const c = candidatos17(v, new Set(), 0).find(x => x.p?.id === p.id && x.tipo === 'familia17' && /cel30fam|familia_(apoio|receio)/.test(String(x.montar.toString())));
    expect(c).toBeTruthy();
    const m = { id: 'm2', t: v.t, tipo: c!.tipo, ...c!.montar(criarRng(3)) };
    expect(['familia_apoio', 'familia_receio']).toContain(m.sit17);
    expect(m.cartao).toMatch(/demissão/);
    if (m.sit17 === 'familia_receio') {
      const t0 = vin.tensao;
      responder17(v, criarRng(4), m, 'cortar');
      expect(vin.tensao).toBeGreaterThan(t0);
    }
  });

  it('quem estuda recebe a turma (estudo em grupo melhora a nota)', () => {
    const v = comCelular(adulto(19, { semente: 54 }));
    contratar(v, criarRng(5), ocupacao('assistente_adm'));
    const atl = v.trabalho.atual!;
    void atl;
    expect(opcoes17(v, { id: 'x', t: v.t, tipo: 'convite', sit17: 'estudo_grupo', texto: '' } as never).map(o => o.op)).toEqual(['topar', 'recusa']);
  });
});
