/**
 * REWORK 11 · Fase D — atuação e música: a economia (sem contagem dupla, sem renda que cresce sozinha), crítica ≠
 * público, convites coerentes, o modo de artista sem verbos corporativos, as cenas com contexto e o save do ator.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { ContratoAV, Vida } from '../tipos';
import { contratar, tetoDosTrabalhosMiudos } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente } from '../sistemas/frentes';
import { cacheDeApresentacao, temporadaDePalco, trabalhoDePalco } from '../sistemas/palco';
import { remuneracaoDe } from '../sistemas/renda';
import { rendaDeImagem } from '../sistemas/notoriedade';
import { concluirProducao, liquidoDe, textoDaRecepcao } from '../sistemas/audiovisual';
import { criarProjeto } from '../sistemas/arte';
import { conviteObsoleto, processarOportunidades } from '../sistemas/oportunidades';
import { viveDoOficio } from '../sistemas/cena';
import { verbosDoOficio } from '../sistemas/noOficio';
import { acoesDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { papelNaMusica, rendaDeDireitos } from '../sistemas/musica';
import { candidatosDoAno, resolverSituacao } from '../sistemas/situacoes';
import { normalizarRework11Artes } from '../save';

const BASE = adulto(22, { semente: 7000 });
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void): Vida => transacao(v, (x, r) => { f(x, r); }).vida;
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const Pr = (oque: string) => ({ tipo: 'profissao', oque } as unknown as Acao);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

function artista(id: string, d: 'teatro' | 'musica' | 'danca' | 'escrita', s: number, banda = false): Vida {
  return em(BASE, (x, r) => {
    x.id = `${x.id}-r11-${id}-${s}`;
    const f = garantirFrente(x, d); f.habilidade = 66; f.interesse = 80; f.meses = 60;
    x.rotinas = x.rotinas.filter(rt => rt.id !== d); x.rotinas.push({ id: d, tInicio: x.t, nivel: 2 });
    x.financas.conta = Math.max(x.financas.conta, 8000);
    if (banda) { criarProjeto(x, r, 'musica'); x.caminhos.arte!.publico = 45; }
    contratar(x, r, ocupacao(id), 'teste');
  });
}
function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const m = v.momento!;
    const op = ['ir', 'aceitar', 'pausar', 'seguir', 'sim'].map(p => m.opcoes.find(o => o.id === p && !o.bloqueio)).find(Boolean) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}
/** Uma carreira de N anos; devolve a renda de cada ano (trabalho, paralela, palco, cachês, ações, imagem). */
function carreira(v: Vida, anos: number, ativo: boolean, musico: boolean): number[] {
  const out: number[] = [];
  const contados = new Set<string>();
  for (let a = 0; a < anos && !v.morte; a++) {
    let acoes = 0;
    const lista = !ativo ? [] : musico ? [P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar'), Pr('estrada')] : [P('buscar_agente'), P('audicao'), P('audicao'), P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar')];
    for (const ac of lista) { if (!podeTentar(disponibilidade(v, ac))) continue; const antes = v.financas.conta; v = responder(executar(v, ac).vida); if ((ac as { oque: string }).oque !== 'lancar') acoes += v.financas.conta - antes; }
    if (ativo) for (const c of (v.caminhos.audiovisual?.contratos ?? []).filter(c => c.status === 'proposta')) { const ac = P('aceitar_contrato', c.id); if (podeTentar(disponibilidade(v, ac))) v = responder(executar(v, ac).vida); }
    v = responder(avancarAno(v).vida);
    let av = 0;
    for (const c of v.caminhos.audiovisual?.contratos ?? []) if (c.status === 'concluido' && !contados.has(c.id)) { contados.add(c.id); av += liquidoDe(c); }
    const e = v.trabalho.atual;
    const sal = (e ? remuneracaoDe(e).mediaMensal * 12 : 0) + (v.trabalho.paralela ? remuneracaoDe(v.trabalho.paralela).mediaMensal * 12 : 0);
    out.push(sal + av + acoes + rendaDeImagem(v) * 12);
  }
  return out;
}

describe('ART-11.3 · a economia de quem atua e de quem toca', () => {
  it('o ator não recebe a temporada de palco como salário: o salário são os trabalhos miúdos, com teto', () => {
    let v = artista('ator', 'teatro', 1);
    expect(trabalhoDePalco(v)).toBe(false);
    v = em(v, x => { x.trabalho.atual!.clientela = 100; });
    for (let k = 0; k < 4; k++) v = responder(avancarAno(v).vida);
    const e = v.trabalho.atual!;
    expect(e.salario).toBeLessThanOrEqual(tetoDosTrabalhosMiudos(v, ocupacao(e.ocupacaoId)));
    expect(v.caminhos.palco).toBeUndefined();
  });
  it('a peça tem teto de sala: o cachê de teatro por apresentação não passa de R$ 25 mil, nem com o nome no topo', () => {
    const v = em(artista('ator', 'teatro', 2), x => { x.notoriedade = { valor: 100, pico: 100, fonte: 'arte', t: x.t }; x.caminhos.frentes.teatro!.habilidade = 99; });
    expect(cacheDeApresentacao(v, 'teatro')).toBeLessThanOrEqual(25000);
    expect(cacheDeApresentacao(v, 'musica')).toBeGreaterThan(cacheDeApresentacao(v, 'teatro'));
  });
  it('ator parado (só o emprego, 12 anos): renda do ano ≤ R$ 40 mil em todas as vidas', () => {
    const fins: number[] = [];
    for (let s = 0; s < 4; s++) { const r = carreira(artista('ator', 'teatro', 10 + s), 12, false, false); fins.push(r[r.length - 1]); }
    expect(Math.max(...fins)).toBeLessThanOrEqual(40000);
  });
  it('músico parado (sem banda, 12 anos): renda do ano ≤ R$ 40 mil em todas as vidas', () => {
    const fins: number[] = [];
    for (let s = 0; s < 4; s++) { const r = carreira(artista('musico_profissional', 'musica', 20 + s), 12, false, true); fins.push(r[r.length - 1]); }
    expect(Math.max(...fins)).toBeLessThanOrEqual(40000);
  });
  it('ator ativo (testes, temporadas, agente, aceita as propostas): o 10º ano fica entre R$ 30 mil e R$ 400 mil na mediana, e o milhão não é a regra', () => {
    const ano10: number[] = [];
    for (let s = 0; s < 6; s++) ano10.push(carreira(artista('ator', 'teatro', 30 + s), 10, true, false)[9]);
    expect(pct(ano10, 0.5)).toBeGreaterThanOrEqual(30000);
    expect(pct(ano10, 0.5)).toBeLessThanOrEqual(400000);
    expect(ano10.filter(x => x >= 1_000_000).length).toBeLessThanOrEqual(1);
  });
  it('músico ativo com banda (shows, disco, edital, turnê): o 1º ano não é milionário e o 8º fica na faixa do ofício', () => {
    const a1: number[] = []; const a8: number[] = [];
    for (let s = 0; s < 6; s++) { const r = carreira(artista('musico_profissional', 'musica', 40 + s, true), 8, true, true); a1.push(r[0]); a8.push(r[7]); }
    expect(pct(a1, 0.5)).toBeLessThanOrEqual(200000);
    expect(pct(a8, 0.5)).toBeLessThanOrEqual(500000);
    expect(a8.filter(x => x >= 1_000_000).length).toBeLessThanOrEqual(1);
  });
  it('a turnê ocupa as datas do ano: a temporada desconta o que a estrada já pagou', () => {
    const base = em(artista('musico_profissional', 'musica', 3, true), x => { x.caminhos.arte!.publico = 60; });
    const a = em(base, x => { temporadaDePalco(x, criarRng(4)); });
    const b = em(base, x => { x.fatos['estrada_t'] = x.t; x.fatos['estrada_datas'] = 6; temporadaDePalco(x, criarRng(4)); });
    expect(b.caminhos.palco!.apresentacoes).toBe(Math.max(0, a.caminhos.palco!.apresentacoes - 6));
  });
  it('a obra lançada rende direitos por anos (pouco, e decaindo) — e só a que achou público', () => {
    const v = em(artista('musico_profissional', 'musica', 5), x => { x.caminhos.obras = [{ t: x.t - 24, titulo: 'Maré', linguagem: 'musica', recepcao: 1, comercial: 3, renda: 40000 }, { t: x.t - 24, titulo: 'Quintal', linguagem: 'musica', recepcao: 3, comercial: 0, renda: 0 }]; });
    const mes = rendaDeDireitos(v);
    expect(mes * 12).toBeGreaterThan(40000 * 0.04);
    expect(mes * 12).toBeLessThan(40000 * 0.1);
    const velha = em(v, x => { x.t += 16 * 12; });
    expect(rendaDeDireitos(velha)).toBe(0);
    const compositor = em(v, x => { x.caminhos.papelMusica = 'compositor'; });
    expect(rendaDeDireitos(compositor)).toBeGreaterThan(mes);
  });
});

describe('ATR-06 · crítica e público são duas recepções', () => {
  it('em 200 trabalhos concluídos há cult (crítica boa, público pequeno) e sucesso popular (público grande, crítica morna)', () => {
    let cult = 0, popular = 0;
    let v = artista('ator', 'teatro', 6);
    v = em(v, x => { x.caminhos.frentes.teatro!.habilidade = 72; });
    for (let k = 0; k < 200; k++) {
      v = em(v, (x, r) => {
        const c: ContratoAV = { id: `t${k}`, tipo: (['teatro', 'serie', 'novela', 'filme', 'curta'] as const)[k % 5], titulo: `Obra ${k}`, casa: 'uma produtora de cinema', papel: k % 3 ? 'coadjuvante' : 'protagonista', porte: (k % 4) as 0 | 1 | 2 | 3, meses: 3, integral: false, bruto: 1000, comissao: 0, despesas: 0, status: 'em_producao', tProposta: x.t };
        concluirProducao(x, c, r);
        const it = x.caminhos.curriculo!.slice(-1)[0];
        if (it.repercussao >= 2 && (it.publico ?? 0) <= 1) cult++;
        if ((it.publico ?? 0) >= 2 && it.repercussao <= 1) popular++;
      });
    }
    expect(cult).toBeGreaterThanOrEqual(20);
    expect(popular).toBeGreaterThanOrEqual(20);
  });
  it('o texto do resultado diz as duas coisas', () => {
    expect(textoDaRecepcao(3, 0)).toMatch(/crítica/);
    expect(textoDaRecepcao(3, 0)).toMatch(/público/);
    expect(textoDaRecepcao(0, 3)).toMatch(/público.*crítica|crítica.*público/);
  });
});

describe('MUS-05..09 · convites para viver do que já se vive', () => {
  it('o músico profissional não recebe "o dono do bar ouviu você tocar" em 40 anos de portas', () => {
    let v = em(artista('musico_profissional', 'musica', 7), x => { x.caminhos.frentes.musica!.habilidade = 80; });
    let pedidos = 0;
    for (let k = 0; k < 40; k++) { v = em(v, (x, r) => { x.t += 36; processarOportunidades(x, r); }); pedidos += v.caminhos.oportunidades.filter(o => o.tipo === 'clientela' && o.dominio === 'musica').length; v = em(v, x => { x.caminhos.oportunidades = []; }); }
    expect(viveDoOficio(v, 'musica')).toBe(true);
    expect(pedidos).toBe(0);
  });
  it('quem já vive de atuar não "mostra o trabalho" para ganhar o convite de entrada; o convite rebaixado sai das portas', () => {
    const v = em(artista('ator_reconhecido', 'teatro', 8), (x, r) => { criarProjeto(x, r, 'teatro'); x.caminhos.arte!.publico = 60; });
    expect(podeTentar(disponibilidade(v, P('mostrar_trabalho')))).toBe(false);
    expect(conviteObsoleto(v, { tipo: 'convite', ocupacaoId: 'ator' })).toBe(true);
    expect(conviteObsoleto(v, { tipo: 'convite', ocupacaoId: 'musico_profissional' })).toBe(false);
    const comConvite = em(v, (x, r) => { x.caminhos.oportunidades.push({ id: 'op1', tipo: 'convite', ocupacaoId: 'ator', titulo: 'Um papel', texto: '', tInicio: x.t, tFim: x.t + 24 }); processarOportunidades(x, r); });
    expect(comConvite.caminhos.oportunidades.some(o => o.id === 'op1')).toBe(false);
  });
});

describe('COR-01..04 · o artista tem ofício, não chefia', () => {
  const PROIBIDO = /aumento|horas extras|curso da empresa|chefia|bairro|cliente exigente|freguesia|Baixar o preço|Cobrar mais|Procurar outra vaga|Equipamento|estrutura/i;
  for (const [id, d] of [['bailarino', 'danca'], ['musico_orquestra', 'musica'], ['escritor', 'escrita'], ['musico_profissional', 'musica'], ['musico_noite', 'musica']] as const) {
    it(`${id}: modo artista, sem verbos corporativos, com um verbo do ofício`, () => {
      const v = em(artista(id, d, 9), x => { x.caminhos.frentes[d]!.habilidade = 85; x.trabalho.atual!.tInicio = x.t - 36; });
      expect(modoDoTrabalho(v)).toBe('artista');
      const ac = acoesDoTrabalho(v, disponibilidade);
      const textos = [...ac.agora, ...ac.mais].map(a => a.rotulo).concat(verbosDoOficio(v).map(x => x.rotulo));
      expect(textos.filter(t => PROIBIDO.test(t))).toEqual([]);
      expect(verbosDoOficio(v).some(x => x.oque === 'ensaio')).toBe(true);
    });
  }
  it('o papel na música muda: banda ativa é "banda"; o contratado tem papel próprio', () => {
    const v = artista('musico_profissional', 'musica', 11, true);
    expect(papelNaMusica(v)).toBe('banda');
    const w = executar(artista('musico_profissional', 'musica', 12), { tipo: 'profissao', oque: 'papel_musica', valor: 'contratado' } as unknown as Acao).vida;
    expect(papelNaMusica(w)).toBe('contratado');
  });
});

describe('Cenas de quem toca e de quem atua, com contexto', () => {
  it('a banda com gente dentro tem a cena do integrante que quer sair — e a saída muda a banda', () => {
    let v = em(artista('musico_profissional', 'musica', 13, true), x => { x.caminhos.arte!.tInicio = x.t - 36; });
    expect(candidatosDoAno(v, 'cena').map(c => c.m.id)).toContain('mus_integrante_sai');
    const membros = v.caminhos.arte!.membros.length;
    v = em(v, x => { x.caminhos.situacao = { id: 'mus_integrante_sai', t: x.t, dados: { banda: x.caminhos.arte!.nome, quem: x.caminhos.arte!.membros[0], nome: 'Fulano', motivo: 'cansaço da estrada' } }; });
    v = em(v, (x, r) => { resolverSituacao(x, r, 'substituir'); });
    expect(v.caminhos.arte!.membros.length).toBe(membros - 1);
  });
  it('depois de vários "nãos" nos testes, a atuação tem a cena própria', () => {
    const v = em(artista('ator', 'teatro', 14), x => { for (let k = 0; k < 3; k++) x.caminhos.devolutivas.push({ t: x.t - k * 6, tipo: 'arte', titulo: 'Teste para a série', texto: 'Não passou.', passou: false } as never); });
    expect(candidatosDoAno(v, 'cena').map(c => c.m.id)).toContain('cena_naos');
  });
});

describe('Save · o ator com salário de palco', () => {
  it('abre com o salário dos trabalhos miúdos e sem o palco de teatro por fora', () => {
    const v = em(artista('ator', 'teatro', 15), x => { x.trabalho.atual!.salario = 150000; x.caminhos.palco = { ano: 2040, linguagem: 'teatro', apresentacoes: 40, cacheMedio: 40000, bruto: 1600000, custos: 600000, artista: 1000000 }; });
    const w = transacao(v, x => { normalizarRework11Artes(x); }).vida;
    expect(w.trabalho.atual!.salario).toBeLessThanOrEqual(tetoDosTrabalhosMiudos(w, ocupacao('ator')));
    expect(w.caminhos.palco).toBeUndefined();
  });
});
