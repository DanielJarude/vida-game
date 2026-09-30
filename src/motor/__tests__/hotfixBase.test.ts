/**
 * HOTFIX de playtest — progressão após ingresso na base. Teste CAUSAL:
 * tentativa → aprovado → convite → ingresso persistido → a etapa do caminho
 * muda → "chegar a uma base" deixa de ser o que se constrói, o pedido de
 * teste some, a devolutiva da peneira antiga não vira instrução — e o save
 * (inclusive o de antes do hotfix) continua reconhecendo.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { garantirFrente } from '../sistemas/frentes';
import { caminhosPossiveis, emConstrucao } from '../sistemas/caminhosDeVida';
import { conviteDaBase, etapaNaBase } from '../sistemas/esporte';
import { avancarAno } from '../ano';
import { exportarVida, importarVida } from '../save';
import { responderTudo } from './ajuda';
import type { Vida } from '../tipos';

const pedir = { tipo: 'perseguir', oque: 'pedir_teste', valor: 'futebol' } as unknown as Acao;
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const esporte = (v: Vida) => emConstrucao(v, disponibilidade).find(c => c.id === 'esporte');
const textoDoCaminho = (v: Vida) => emConstrucao(v, disponibilidade).map(c => [c.titulo, c.onde, c.progresso ?? '', ...c.falta, c.proximo?.rotulo ?? ''].join(' ')).join(' ');
const oque = (a?: Acao) => (a as { oque?: string } | undefined)?.oque;
const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(l.tipo); return l.vida; };
const entradasDaBase = (v: Vida) => v.biografia.filter(e => /^Entrou para a base/.test(e.texto)).length;

/** Garoto de 13 anos que treina futebol a sério, técnica de quem é chamado. */
function jogador(semente = 7): Vida {
  const v = adulto(13, { semente, genero: 'masculino' });
  garantirFrente(v, 'futebol');
  Object.assign(v.caminhos.frentes.futebol!, { habilidade: 86, interesse: 85, meses: 72, tInicio: v.t - 72 });
  v.rotinas = v.rotinas.filter(r => r.id !== 'futebol'); v.rotinas.push({ id: 'futebol', tInicio: v.t - 72, nivel: 2 });
  v.corpo.forma = 75; v.mente.estresse = 20;
  v.caminhos.esporte = undefined; v.momento = null; v.caminhos.pendente = undefined; v.caminhos.oportunidades = [];
  return v;
}

/** Pede o teste e joga as duas etapas; devolve a vida logo depois do resultado. */
function fazerPeneira(v: Vida): Vida {
  let x = executar(v, pedir).vida;
  expect(x.momento?.situacaoId).toBe('esp_peneira');
  for (let k = 0; x.momento?.situacaoId === 'esp_peneira' && k < 3; k++) {
    const op = x.momento.opcoes.find(o => !o.bloqueio && ['p0', 'p2'].includes(o.id)) ?? x.momento.opcoes.find(o => !o.bloqueio)!;
    x = executar(x, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return x;
}

describe('HOTFIX · a base depois da peneira', () => {
  it('1–6, 9. fora → peneira aprovada → convite na hora → na base: objetivo, ação e orientação seguem a etapa', () => {
    let v = jogador();
    // 1. Ainda não está numa base: o objetivo é chegar, e dá para pedir teste.
    expect(etapaNaBase(v)).toBe('fora');
    expect(esporte(v)?.titulo).toBe('Chegar a uma base de futebol');
    expect(tenta(v, pedir)).toBe(true);

    // 2. A peneira: aprovado.
    v = fazerPeneira(v);
    const dev = v.caminhos.devolutivas.slice(-1)[0];
    expect(dev.tipo).toBe('peneira');
    expect(dev.passou).toBe(true);
    // O convite vem junto com o resultado (não fica para a virada do ano).
    expect(v.momento?.situacaoId).toBe('esp_base');
    expect(etapaNaBase(v)).toBe('convidado');
    // Mesmo antes de responder: "chegar a uma base" já não é o objetivo, nem o pedido de teste.
    expect(textoDoCaminho(v)).not.toMatch(/Chegar a uma base|Pedir um teste|Desde a última peneira/);
    expect(tenta(v, pedir)).toBe(false);

    // Entra na base.
    const clube = conviteDaBase(v)!.clube;
    v = executar(v, { tipo: 'decidir', opcaoId: 'ir' }).vida;
    v = responderTudo(v);
    expect(v.caminhos.esporte?.fase).toBe('base');
    expect(v.caminhos.esporte?.clube).toBe(clube);
    expect(etapaNaBase(v)).toBe('base');

    // 3. "Chegar a uma base" deixa de ser objetivo ativo.
    expect(emConstrucao(v, disponibilidade).some(c => /Chegar a uma base/.test(c.titulo))).toBe(false);
    // 4. O pedido de teste some (como objetivo e como caminho), e o motor recusa.
    expect(textoDoCaminho(v)).not.toMatch(/Pedir um teste/);
    expect(caminhosPossiveis(v, disponibilidade).find(c => c.id === 'esporte')?.passo).toBeUndefined();
    expect(tenta(v, pedir)).toBe(false);
    // 5. A peneira anterior fica no histórico — não como deficiência para entrar.
    expect(v.caminhos.devolutivas.some(d => d.tipo === 'peneira')).toBe(true);
    expect(textoDoCaminho(v)).not.toMatch(/Desde a última peneira/);
    // 6. A próxima etapa sabe que ele JÁ ESTÁ na base.
    const e = esporte(v)!;
    expect(e.titulo).toMatch(/^Se firmar na base d/);
    expect(e.onde).toMatch(/Sub-15|Sub-17/);
    expect(e.onde).toMatch(/contrato/);
    expect(e.proximo?.rotulo).toMatch(/Treinar firme/);
    expect(caminhosPossiveis(v, disponibilidade).find(c => c.id === 'esporte')?.estado).toBe('aqui');

    // 9. Linha da Vida: o ingresso, uma vez — e segue uma vez depois de um ano na base.
    expect(entradasDaBase(v)).toBe(1);
    v = responderTudo(avancarAno(v).vida);
    expect(entradasDaBase(v)).toBe(1);
  });

  it('7. save/reload: a etapa é derivada do estado persistido', () => {
    let v = fazerPeneira(jogador(8));
    expect(etapaNaBase(recarregar(v))).toBe('convidado');
    v = responderTudo(executar(v, { tipo: 'decidir', opcaoId: 'ir' }).vida);
    const r = recarregar(v);
    expect(etapaNaBase(r)).toBe('base');
    expect(esporte(r)?.titulo).toMatch(/^Se firmar/);
    expect(tenta(r, pedir)).toBe(false);
  });

  it('8. save de antes do hotfix: aprovado com o convite ainda sem resposta → reconcilia, sem exigir nova peneira', () => {
    // O estado que o playtest tem: passou na peneira (devolutiva + convite), sem decisão aberta, sem clube.
    let v = fazerPeneira(jogador(9));
    v.momento = null;
    v = recarregar(v);
    expect(v.fatos['convite_base']).toBeDefined();
    expect(v.caminhos.esporte).toBeUndefined();
    expect(etapaNaBase(v)).toBe('convidado');
    expect(textoDoCaminho(v)).not.toMatch(/Chegar a uma base|Pedir um teste|Desde a última peneira/);
    expect(tenta(v, pedir)).toBe(false);
    // O passo é responder ao convite — a mesma decisão, agora.
    const passo = esporte(v)!.proximo!;
    expect(oque(passo.acao)).toBe('responder_convite');
    v = executar(v, passo.acao!).vida;
    expect(v.momento?.situacaoId).toBe('esp_base');
    v = responderTudo(executar(v, { tipo: 'decidir', opcaoId: 'ir' }).vida);
    expect(etapaNaBase(v)).toBe('base');
    expect(v.fatos['peneiras_futebol']).toBe(1);
    expect(entradasDaBase(v)).toBe(1);
  });

  it('8b. save de antes do hotfix: se não responder, a virada do ano traz o convite (inclusive depois de uma carreira encerrada)', () => {
    let v = fazerPeneira(jogador(10));
    v.momento = null;
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'encerrada', clube: 'Clube Antigo', nivel: 1, tInicio: v.t - 36, tFase: v.t - 36, lesoes: 0, municipioId: v.moradia.municipioId, tFim: v.t - 12, motivoFim: 'dispensa' };
    expect(etapaNaBase(v)).toBe('convidado');
    v = avancarAno(v).vida;
    expect(v.momento?.situacaoId).toBe('esp_base');
  });

  it('8c. save que já está na base: a etapa é a base, nunca volta ao pedido de teste', () => {
    const v = jogador(11);
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'base', clube: 'Bahia', nivel: 1, tInicio: v.t - 6, tFase: v.t - 6, lesoes: 0, municipioId: v.moradia.municipioId };
    expect(etapaNaBase(v)).toBe('base');
    expect(esporte(v)?.titulo).toBe('Se firmar na base do Bahia');
    expect(textoDoCaminho(v)).not.toMatch(/Chegar a uma base|Pedir um teste/);
    expect(tenta(v, pedir)).toBe(false);
  });

  it('recusar o convite devolve à etapa de antes (a escolha é do jogador)', () => {
    let v = fazerPeneira(jogador(12));
    v = responderTudo(executar(v, { tipo: 'decidir', opcaoId: 'ficar' }).vida);
    expect(etapaNaBase(v)).toBe('fora');
    expect(v.caminhos.esporte).toBeUndefined();
  });
});
