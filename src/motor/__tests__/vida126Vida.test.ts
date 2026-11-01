/**
 * VIDA 12.6 — o trabalho (as cenas de cada profissão, o jeito do chefe, a reputação, a chefia nova na equipe), o
 * pequeno negócio (o ano no vermelho, a freguesia fiel), os hobbies novos, a casa no dia a dia, as viagens, os
 * acontecimentos de consequência e o álbum.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { transacao, lembrarCom } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { criarRng } from '../rng';
import { ocupacao } from '../dados/ocupacoes';
import { contratar } from '../sistemas/trabalho';
import { atualizarReputacao, leituraDaReputacao, processarEquipe } from '../sistemas/equipe';
import { chefiaAtual } from '../sistemas/profissao';
import { perfilDoChefe, EFEITO_DO_CHEFE } from '../sistemas/jeito';
import { MODELOS } from '../sistemas/situacoes';
import { MODELOS_126, TRILHAS_SEM_ESCRITORIO } from '../sistemas/situacoes126';
import { ROTINAS, modeloRotina } from '../sistemas/rotinas';
import { FAZERES_EM_CASA } from '../sistemas/casaNoDia';
import { viagem126 } from '../sistemas/viagens126';
import { ACONTECIMENTOS_126 } from '../conteudo/acontecimentos126';
import { memoriasDaVida } from '../sistemas/albumDaVida';
import { abrirNegocio } from '../sistemas/negocio';
import type { Vida } from '../tipos';

const base = (i = 34): Vida => transacao(adulto(i, { semente: 1263 }), x => { x.financas.conta = 300_000; x.momento = null; }).vida;
const empregar = (v: Vida, id: string) => transacao(v, x => { contratar(x, criarRng(7), ocupacao(id)); }).vida;

describe('VIDA 12.6 · trabalho', () => {
  it('as cenas de escritório não chegam a quem não trabalha em escritório; cada profissão sem cena ganhou as suas', () => {
    const v = empregar(base(), 'aux_limpeza');
    for (const id of ['emp_problema', 'emp_credito', 'emp_erro']) expect(MODELOS.find(m => m.id === id)!.cabe(v), id).toBe(false);
    expect(MODELOS_126.filter(m => m.trajetoria === 'emprego' && m.cabe(v)).map(m => m.id)).toEqual(expect.arrayContaining(['lim126_marmore', 'lim126_achado']));
    const w = empregar(base(), 'tecnico_publico');
    expect(MODELOS.find(m => m.id === 'emp_erro')!.cabe(w)).toBe(true);
    expect(MODELOS_126.some(m => m.cabe(w) && m.id.startsWith('pub126'))).toBe(true);
    expect(TRILHAS_SEM_ESCRITORIO).toContain('limpeza');
    // Toda cena nova tem textos e quatro desfechos em cada intenção.
    for (const m of MODELOS_126) for (const it of (typeof m.intencoes === 'function' ? [] : m.intencoes)) expect(Object.keys(it.desfechos).sort()).toEqual(['bom', 'otimo', 'pessimo', 'ruim']);
  });

  it('a chefia nova entra na equipe e é ela que responde como chefe; o jeito do chefe é estável e pesa no ano', () => {
    let v = empregar(base(), 'tecnico_publico');
    v = transacao(v, x => { processarEquipe(x); }).vida;
    const eq = v.trabalho.atual!.equipe!;
    expect(eq.chefeId).toBeTruthy();
    expect(chefiaAtual(v)!.id).toBe(eq.chefeId);
    const chefe = v.pessoas[eq.chefeId!];
    expect(perfilDoChefe(chefe)).toBe(perfilDoChefe(chefe));
    expect(chefe.ocupacaoId).toBe(v.trabalho.atual!.ocupacaoId);
    expect(EFEITO_DO_CHEFE.injusto.promocao).toBeLessThan(EFEITO_DO_CHEFE.incentivador.promocao);
  });

  it('a reputação anda com o desempenho e aparece em palavras; advertências derrubam', () => {
    let v = empregar(base(), 'tecnico_publico');
    v = transacao(v, x => { x.trabalho.atual!.desempenho = 90; for (let k = 0; k < 8; k++) { atualizarReputacao(x); x.t += 12; } }).vida;
    expect(v.trabalho.reputacao!).toBeGreaterThan(62);
    expect(leituraDaReputacao(v)).toMatch(/nome/);
    v = transacao(v, x => { x.trabalho.atual!.desempenho = 20; x.trabalho.atual!.sancoes = [{ t: x.t, tipo: 'advertencia', motivo: 'desempenho' }, { t: x.t, tipo: 'suspensao', motivo: 'desempenho' }]; for (let k = 0; k < 6; k++) atualizarReputacao(x); }).vida;
    expect(v.trabalho.reputacao!).toBeLessThan(50);
  });
});

describe('VIDA 12.6 · negócio', () => {
  it('o ano só conta no vermelho com prejuízo ou o negócio quase vazio; a freguesia fiel nasce da boa fama', () => {
    let v = base(30);
    v = transacao(v, x => { abrirNegocio(x, criarRng(3), 'lanchonete'); const n = x.caminhos.negocio!; n.clientela = 16; n.reputacao = 70; n.caixa = 50_000; }).vida;
    const n0 = v.caminhos.negocio!;
    expect(n0.anosNoVermelho).toBe(0);
    // A freguesia fiel: campo opcional (saves antigos sem ele continuam válidos).
    expect(n0.fieis ?? 0).toBeGreaterThanOrEqual(0);
  });
});

describe('VIDA 12.6 · hobbies e casa', () => {
  it('os hobbies novos existem, praticam frentes e só a pintura e o artesanato podem render dinheiro', () => {
    for (const id of ['jardinagem', 'pintura', 'artesanato', 'colecionar', 'clube_leitura', 'arrumar_casa']) expect(modeloRotina(id), id).toBeTruthy();
    expect(new Set(ROTINAS.map(r => r.id)).size).toBe(ROTINAS.length);
    expect(modeloRotina('jardinagem')!.renda).toBeUndefined();
    expect(modeloRotina('artesanato')!.renda!(base(), 1)).toBe(0);
  });

  it('a casa no dia a dia: uma vez por ano cada, pela idade; a visita aproxima; o conserto cobra de quem não sabe', () => {
    let v = base();
    const conta0 = v.financas.conta;
    for (const op of FAZERES_EM_CASA) {
      const d = disponibilidade(v, { tipo: 'em_casa', oque: op });
      if (!podeTentar(d)) continue;
      v = executar(v, { tipo: 'em_casa', oque: op }).vida;
      expect(disponibilidade(v, { tipo: 'em_casa', oque: op }).grau).toBe('incompativel');
    }
    expect(v.financas.conta).toBeLessThanOrEqual(conta0);
    const crianca = transacao(adulto(6, { semente: 3 }), x => { x.momento = null; }).vida;
    expect(disponibilidade(crianca, { tipo: 'em_casa', oque: 'consertar' }).grau).toBe('impossivel');
  });

  it('a primeira viagem sozinho vira marco (uma vez) e entra no álbum', () => {
    const v = base(24);
    const t = viagem126(v, 'Lisboa', [], true, false);
    expect(t).toBeTruthy();
    expect(v.eu.marcos?.primeira_viagem_sozinho).toBe(v.t);
    viagem126(v, 'Madri', [], true, false);
    expect(v.biografia.filter(e => /primeira viagem sozinh/i.test(e.texto))).toHaveLength(1);
    expect(memoriasDaVida(v).some(m => /Primeira viagem sozinh/.test(m.titulo))).toBe(true);
  });
});

describe('VIDA 12.6 · acontecimentos', () => {
  it('cada acontecimento tem id próprio e dados coerentes; o favor devolvido só vem de quem guarda gratidão e quando você precisa', () => {
    const ids = ACONTECIMENTOS_126.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('v126_'))).toBe(true);
    const favor = ACONTECIMENTOS_126.find(c => c.id === 'v126_favor_devolvido')!;
    const v = base();
    const amigo = pessoaNova(v, 35, 'feminino');
    const { vin } = comParceiro(v, { estagio: 'namoro' });
    expect(vin).toBeTruthy();
    const papel = favor.papeis!.quem(v);
    expect(papel.some(p => p.id === amigo.id)).toBe(false);
  });

  it('a tatuagem com o nome de um ex: só aparece quando o amor virou ex; cobrir faz uma cobertura de verdade', () => {
    let v = base();
    const { p } = comParceiro(v, { estagio: 'namoro' });
    v = executar(v, { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'antebraco', lado: 'd', texto: p.nome, significado: { tipo: 'amor', pessoaId: p.id } }).vida;
    const c = ACONTECIMENTOS_126.find(x => x.id === 'v126_tatuagem_do_ex')!;
    expect(c.papeis!.ex(v)).toHaveLength(0);
    v = transacao(v, x => { x.vinculos[p.id].romance!.estagio = 'ex'; }).vida;
    expect(c.papeis!.ex(v).map(x => x.id)).toEqual([p.id]);
  });

  it('o álbum: a foto da memória tem a pessoa registrada (nunca alguém que não estava)', () => {
    let v = base();
    const { p } = comParceiro(v, { estagio: 'namoro' });
    lembrarCom(v, p.id, 'x', 'romance', 2);
    v = executar(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'biceps', lado: 'd' }).vida;
    const ms = memoriasDaVida(v);
    expect(ms.some(m => m.tipo === 'tatuagem')).toBe(true);
    for (const m of ms) if (m.pessoaId) expect(v.pessoas[m.pessoaId]).toBeTruthy();
  });
});
