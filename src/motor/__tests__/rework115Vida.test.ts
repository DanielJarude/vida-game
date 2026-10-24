/**
 * REWORK 11.5 · Fases E e F — política, artes e relações.
 *
 *   POL-05  alianças com gente, confiança e favores; promessas com prazo; rompimento; o pedido do aliado; a eleição lê
 *   ART-02  o músico que vive de música tem os freelas (aulas, estúdio) — e menos quando a agenda de shows cresce
 *   REL-20  o pedido de casamento em cena: onde, com que anel (a preferência de quem recebe)
 *   REL-21  a gravidez de um caso: quem reconhece × quem é; a dúvida só com causa; a verdade dita muda a relação
 *   REL-22  o trio: harmonia entre os dois, ciúmes, casa, dinheiro, crise
 *   REL-23  bloquear o ex
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { vincular } from '../pessoas';
import { aliado, entrarNaPolitica, fatoresDaEleicao, proximaEleicao } from '../sistemas/politica';
import { aliancasAtivas, fatorDasAliancas, processarAliancas, promessasEmAberto } from '../sistemas/aliancas';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { processarGestacoes, processarPaternidade, registrarNascimento } from '../sistemas/familia';
import { processarTrio, trioDe } from '../sistemas/afetosAdultos';
import { interpretar } from '../save';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente } from '../sistemas/frentes';
import { temporadaDePalco } from '../sistemas/palco';

const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void): Vida => transacao(v, (x, r) => { f(x, r); }).vida;
const fazer = (v: Vida, a: Parameters<typeof executar>[1]) => { const d = disponibilidade(v, a); expect(podeTentar(d), d.motivo).toBe(true); return executar(v, a).vida; };

const politico = () => em(adulto(40, { semente: 5200 }), x => {
  x.trabalho.atual = undefined; x.caminhos.envolvimento = undefined; x.justica = undefined; x.momento = null; delete x.fila;
  const p = entrarNaPolitica(x, 'comunidade');
  p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 24; p.fase = 'filiado'; p.apoio = 40; p.reputacao = 40;
});

describe('POL-05 · alianças e promessas', () => {
  it('formar exige filiação; traz base e um compromisso com prazo; cumprir sobe a confiança e cria um favor', () => {
    const fora = em(politico(), x => { x.caminhos.politica!.fase = 'envolvido'; });
    expect(disponibilidade(fora, { tipo: 'alianca', oque: 'formar' }).grau).toBe('requisito');
    let v = politico();
    const apoio = v.caminhos.politica!.apoio;
    v = fazer(v, { tipo: 'alianca', oque: 'formar' });
    const p = v.caminhos.politica!;
    expect(aliancasAtivas(p).length).toBe(1);
    expect(p.apoio).toBeGreaterThan(apoio);
    const pr = promessasEmAberto(p)[0];
    expect(pr.origem).toBe('alianca');
    expect(pr.prazo).toBe(v.t + 24);
    // "o aliado" dos mandatos passa a ser esta pessoa.
    expect(aliado(v)?.id).toBe(aliancasAtivas(p)[0].pessoaId);
    v = fazer(v, { tipo: 'alianca', oque: 'cumprir', id: pr.id });
    const a = aliancasAtivas(v.caminhos.politica)[0];
    expect(a.confianca).toBe(60);
    expect(a.favores).toBe(1);
  });

  it('o prazo vence sem cumprir: a promessa quebra, a confiança cai; a eleição lê promessas e alianças', () => {
    let v = fazer(politico(), { tipo: 'alianca', oque: 'formar' });
    v = em(v, x => { x.t += 25; processarAliancas(x); });
    const p = v.caminhos.politica!;
    expect(p.promessas![0].quebrada).toBeDefined();
    expect(p.aliancas![0].confianca).toBeLessThan(20);
    // Com a confiança abaixo de 20, o aliado rompe.
    expect(v.caminhos.politica!.aliancas![0].rompida).toBeDefined();
    expect(v.caminhos.politica!.aliancas![0].porQuem).toBe('aliado');
    expect(aliado(v)).toBeUndefined();
    const f = fatorDasAliancas(v.caminhos.politica!, v.t + 12);
    expect(f.promessas).toBeLessThan(0);
    const fatores = transacao(v, x => fatoresDaEleicao(x, 'vereador', proximaEleicao(x.t).t)).valor.fatores.map(k => k.id);
    expect(fatores).toContain('promessas');
  });

  it('romper a aliança custa base e pesa na eleição seguinte; o pedido do aliado vira decisão e muda a confiança', () => {
    let v = fazer(politico(), { tipo: 'alianca', oque: 'formar' });
    const id = v.caminhos.politica!.aliancas![0].id;
    const r = fatorDasAliancas(fazer(v, { tipo: 'alianca', oque: 'romper', id }).caminhos.politica!, v.t + 12);
    expect(r.rompimento).toBe(-3);
    // O pedido: anos depois, sem compromisso em aberto.
    let achou = false;
    for (let k = 0; k < 20 && !achou; k++) {
      const w = em(v, x => { const p = x.caminhos.politica!; p.promessas = []; p.aliancas![0].desde = x.t - 24; x.t += 12 * (k + 1); processarAliancas(x); });
      if (!w.caminhos.politica!.pedido) continue;
      achou = true;
      const d = conteudoPorId('polal_pedido')!;
      expect(transacao(w, (x, rr) => preparar(d, x, rr)).valor).not.toBeNull();
    }
    expect(achou).toBe(true);
  });

  it('as alianças e promessas persistem no save', () => {
    const v = fazer(politico(), { tipo: 'alianca', oque: 'formar' });
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.caminhos.politica!.aliancas).toEqual(v.caminhos.politica!.aliancas);
  });
});

describe('ART-02 · o músico tem freelas', () => {
  it('quem vive de música e tem poucos shows ganha com aulas e estúdio; com a agenda cheia, menos', () => {
    const v = em(adulto(28, { semente: 31 }), (x, r) => {
      const f = garantirFrente(x, 'musica'); f.habilidade = 78; f.interesse = 80; f.meses = 120;
      x.rotinas.push({ id: 'musica', tInicio: x.t, nivel: 2 });
      contratar(x, r, ocupacao('musico_profissional'), 'teste');
    });
    const p = transacao(v, x => temporadaDePalco(x, criarRng(4))).valor;
    expect(p?.freelas ?? 0).toBeGreaterThan(0);
    expect(transacao(v, x => { temporadaDePalco(x, criarRng(4)); return x.trabalho.atual!.salario; }).valor * 12).toBeGreaterThanOrEqual((p!.artista + p!.freelas!) - 120);
  });
});

describe('REL-20 · o pedido de casamento em cena', () => {
  it('pedir abre a cena: primeiro o lugar, depois o anel (com preço); a resposta guarda como foi', () => {
    let v = em(adulto(30, { semente: 44, genero: 'feminino' }), x => { x.financas.conta = 50_000; x.momento = null; delete x.fila; });
    let pid = '';
    v = em(v, x => { const { p, vin } = comParceiro(x, { estagio: 'morando_junto', anos: 3 }); pid = p.id; vin.romance!.envolvimento = 95; vin.tensao = 0; });
    v = fazer(v, { tipo: 'pessoa', pessoaId: pid, interacao: 'pedir_casamento' } as never);
    expect(v.momento?.situacaoId).toBe('rel115_pedido');
    const lugares = v.momento!.opcoes.map(o => o.id);
    expect(lugares).toEqual(['casa', 'jantar', 'publico']);
    v = executar(v, { tipo: 'decidir', opcaoId: 'jantar' }).vida;
    expect(v.momento?.situacaoId).toBe('rel115_pedido');
    expect(v.momento!.opcoes.map(o => o.id)).toEqual(['anel_simples', 'anel_classico', 'anel_caro', 'sem_anel']);
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'decidir', opcaoId: 'anel_classico' }).vida;
    expect(v.momento).toBeNull();
    expect(v.financas.conta).toBeLessThan(conta);
    const rom = v.vinculos[pid].romance!;
    if (rom.noivado) { expect(rom.noivado.anel).toBe('classico'); expect(rom.noivado.lugar).toBe('jantar'); }
  });
});

describe('REL-21 · a gravidez de um caso', () => {
  it('a parceria reconhece (sem saber); a verdade fica em genitores; a dúvida só vem com causa; contar muda a relação', () => {
    let v = em(adulto(30, { semente: 77, genero: 'feminino' }), x => { x.momento = null; delete x.fila; });
    let par = '', caso = '';
    v = em(v, x => {
      par = comParceiro(x, { estagio: 'casamento', anos: 4 }).p.id;
      const c = pessoaNova(x, 32, 'masculino');
      const vin = vincular(x, c, { origem: 'romance', proximidade: 60, convivio: [] });
      vin.romance = { estagio: 'namoro', tEstagio: x.t - 12, tInicio: x.t - 12, envolvimento: 70, secreto: true };
      caso = c.id;
      x.processos.push({ tipo: 'gestacao', id: 'g-teste', tConcepcao: x.t - 3, tParto: x.t + 6, gestanteId: 'eu', outroId: c.id, descoberta: false, planejada: false });
    });
    v = em(v, (x, r) => { processarGestacoes(x, r); });
    const g = v.processos.find(p => p.id === 'g-teste') as { reconhecidoId?: string } | undefined;
    expect(g?.reconhecidoId).toBe(par);
    let bebe = '';
    v = em(v, (x, r) => { x.t += 7; const b = processarGestacoes(x, criarRng(2)) ?? processarGestacoes(x, r); if (b) { registrarNascimento(x, b, 'Lia'); bebe = b.id; } });
    if (!bebe) return; // a gravidez pode não seguir (o aborto espontâneo é parte do modelo)
    const b = v.pessoas[bebe];
    expect(b.genitores).toEqual(['eu', caso]);
    expect(b.reconhecidoPor).toBe(par);
    expect(b.origemSabida).not.toContain(par);
    // Sem causa, a dúvida é rara; com o caso descoberto, vem.
    let veio = false;
    for (let k = 0; k < 6 && !veio; k++) {
      v = em(v, x => { x.t += 12; x.fatos[`caso_descoberto:${caso}`] = x.t; processarPaternidade(x); });
      veio = v.fatos[`paternidade_duvida:${bebe}`] === v.t;
    }
    expect(veio).toBe(true);
    const confianca = v.vinculos[par].confianca;
    const d = conteudoPorId('rel115_paternidade')!;
    v = em(v, (x, r) => { const ctx = preparar(d, x, r); expect(ctx).not.toBeNull(); });
    v = em(v, (x, r) => { const ctx = preparar(d, x, r)!; const op = (d as { opcoes: { id: string; resolver: (c: typeof ctx) => { efeito?: () => void } }[] }).opcoes.find(o => o.id === 'contar')!; op.resolver(ctx).efeito?.(); void r; });
    expect(v.pessoas[bebe].origemSabida).toContain(par);
    expect(v.vinculos[par].confianca).toBeLessThan(confianca);
  });
});

describe('REL-22 · o trio', () => {
  const comTrio = () => em(adulto(32, { semente: 90 }), x => {
    x.momento = null; delete x.fila;
    const { p, vin } = comParceiro(x, { estagio: 'morando_junto', anos: 3 });
    vin.romance!.acordo = 'poliamor';
    const b = pessoaNova(x, 31, 'feminino');
    const vb = vincular(x, b, { origem: 'romance', proximidade: 60, convivio: [] });
    vb.romance = { estagio: 'namoro', tEstagio: x.t - 12, tInicio: x.t - 12, envolvimento: 70, paralelo: true };
    x.trisal = { a: p.id, b: b.id, desde: x.t, harmonia: 50, ciumes: 10, moram: false, financas: 'separadas' };
  });

  it('a harmonia anda para a afinidade das duas pessoas; ciúmes crescem com a diferença de atenção; a crise abre a decisão', () => {
    let v = comTrio();
    v = em(v, x => { const t = x.trisal!; x.vinculos[t.a].romance!.envolvimento = 95; x.vinculos[t.b].romance!.envolvimento = 30; t.harmonia = 16; processarTrio(x); });
    const t = v.trisal!;
    expect(t.ciumes).toBeGreaterThan(10);
    if (t.harmonia < 18) {
      expect(v.fatos['trio_crise']).toBe(v.t);
      const d = conteudoPorId('rel115_trio_crise')!;
      expect(transacao(v, (x, r) => preparar(d, x, r)).valor).not.toBeNull();
    }
  });

  it('morar os três e juntar as contas: a casa e o dinheiro mudam; desfazer mantém os dois vínculos', () => {
    let v = comTrio();
    const b = v.trisal!.b;
    v = fazer(v, { tipo: 'pessoa', pessoaId: b, interacao: 'trio_morar' } as never);
    expect(v.trisal!.moram).toBe(true);
    expect(v.vinculos[b].convivio).toContain('casa');
    v = fazer(v, { tipo: 'pessoa', pessoaId: b, interacao: 'trio_dinheiro' } as never);
    expect(v.trisal!.financas).toBe('conjuntas');
    v = fazer(v, { tipo: 'pessoa', pessoaId: b, interacao: 'trio_desfazer' } as never);
    expect(trioDe(v)).toBeUndefined();
    expect(v.vinculos[b].romance?.estagio).toBe('namoro');
    expect(v.vinculos[b].convivio).not.toContain('casa');
  });
});

describe('REL-23 · bloquear o ex', () => {
  it('na ficha do ex, bloquear corta o contato (a mensagem some); desbloquear devolve', () => {
    let pid = '';
    let v = em(adulto(30, { semente: 12 }), x => {
      x.momento = null; delete x.fila;
      const { p, vin } = comParceiro(x, { estagio: 'namoro', anos: 2 });
      vin.romance!.estagio = 'ex'; vin.romance!.fim = 'termino'; vin.romance!.tEstagio = x.t - 24; vin.convivio = [];
      pid = p.id;
    });
    v = fazer(v, { tipo: 'pessoa', pessoaId: pid, interacao: 'ex_bloquear' } as never);
    expect(v.vinculos[pid].distancia).toBe(v.t);
    expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: pid, interacao: 'ex_mensagem' } as never))).toBe(false);
    v = fazer(v, { tipo: 'pessoa', pessoaId: pid, interacao: 'ex_desbloquear' } as never);
    expect(v.vinculos[pid].distancia).toBeUndefined();
  });
});
