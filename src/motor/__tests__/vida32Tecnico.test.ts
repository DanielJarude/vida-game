/**
 * VIDA 32 · o dia a dia do técnico (`sistemas/acoesDoTecnico32`): cada ação tem limite, motivo quando não dá, efeito
 * nos números que a próxima temporada lê (`tecnico.temporadaDoTecnico32`, `p.ajuste`, vestiário, pressão, nome) e
 * sobrevive ao save.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { PassagemDeTecnico, Vida } from '../tipos';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente } from '../sistemas/frentes';
import { aceitarPropostaDeTecnico, passagemAtual, processarTecnico, temporadaDoTecnico32 } from '../sistemas/tecnico';
import { ACOES_TECNICO32, type OqueTecnico32 } from '../sistemas/acoesDoTecnico32';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida } from '../save';

let base: Vida | undefined;
function noBanco(): Vida {
  base ??= transacao(adulto(40, { semente: 77, genero: 'masculino', municipioId: 'recife-pe' }), (x, rr) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol');
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, rr, ocupacao('tecnico_futebol'), 'oportunidade');
    processarTecnico(x, rr);
    const pr = x.caminhos.tecnico?.proposta;
    if (!passagemAtual(x) && pr) aceitarPropostaDeTecnico(x, rr, pr.id);
    x.momento = null; delete x.fila;
    x.financas.conta = 500000;
  }).vida;
  return structuredClone(base);
}
const pa = (v: Vida) => passagemAtual(v)!;
const fazer = (v: Vida, oque: OqueTecnico32) => { const r = executar(v, { tipo: 'tecnico32', oque }); expect(r.aviso?.tom).not.toBe('ruim'); return r.vida; };
const pode = (v: Vida, oque: OqueTecnico32) => podeTentar(disponibilidade(v, { tipo: 'tecnico32', oque }));
const proximoAno = (v: Vida) => transacao(v, x => { x.t += 12; x.momento = null; delete x.fila; }).vida;

describe('VIDA 32 · as ações do técnico', () => {
  it('a base do teste está no comando de um time', () => {
    const v = noBanco();
    expect(pa(v)).toBeTruthy();
    expect(ACOES_TECNICO32.length).toBeGreaterThanOrEqual(17);
  });

  it('sem comando, nenhuma ação da prancheta (com o motivo)', () => {
    const v = transacao(adulto(30, { semente: 5 }), x => { x.momento = null; delete x.fila; }).vida;
    const d = disponibilidade(v, { tipo: 'tecnico32', oque: 'treino_fisico' });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/comando/);
  });

  it('treino: um foco por temporada; os efeitos vão para a próxima temporada', () => {
    let v = noBanco();
    const antes = pa(v).ajuste ?? 0;
    v = fazer(v, 'treino_tatico');
    expect(pa(v).ajuste).toBeCloseTo(antes + 0.3, 5);
    expect(pa(v).v32?.decisivo).toBeCloseTo(0.3, 5);
    expect(pa(v).v32?.treino).toBe('tatico');
    for (const o of ['treino_fisico', 'treino_tatico', 'treino_bola_parada', 'treino_descanso'] as const) {
      expect(pode(v, o)).toBe(false);
      expect(disponibilidade(v, { tipo: 'tecnico32', oque: o }).motivo).toMatch(/pré-temporada/);
    }
    v = proximoAno(v);
    expect(pode(v, 'treino_bola_parada')).toBe(true);
    v = fazer(v, 'treino_bola_parada');
    expect(pa(v).v32?.decisivo).toBeCloseTo(0.9, 5);
  });

  it('treino físico: ou mais força (+0,6) ou a lesão (−0,3 e vestiário)', () => {
    const v0 = noBanco();
    const vest = pa(v0).vestiario;
    const v = fazer(v0, 'treino_fisico');
    const aj = pa(v).ajuste ?? 0;
    expect([0.6, -0.3].some(x => Math.abs(aj - x) < 1e-6)).toBe(true);
    if (aj < 0) expect(pa(v).vestiario).toBe(vest - 2);
  });

  it('descanso: vestiário sobe, força cai um pouco, o estresse alivia', () => {
    const v0 = noBanco();
    const v = fazer(v0, 'treino_descanso');
    expect(pa(v).vestiario).toBe(Math.min(100, pa(v0).vestiario + 4));
    expect(pa(v).ajuste).toBeCloseTo(-0.2, 5);
    expect(v.mente.estresse).toBeLessThanOrEqual(v0.mente.estresse);
  });

  it('estudar os adversários: bônus dos decisivos (com teto), uma vez por temporada', () => {
    let v = fazer(noBanco(), 'estudar_adversario');
    expect(pa(v).v32?.decisivo).toBeCloseTo(0.8, 5);
    expect(pode(v, 'estudar_adversario')).toBe(false);
    v = fazer(v, 'treino_bola_parada');
    expect(pa(v).v32?.decisivo).toBeCloseTo(1.4, 5);
  });

  it('garotos da base: um pouco agora, o ganho quando amadurecem; três levas por passagem', () => {
    let v = noBanco();
    const rep = v.caminhos.tecnico!.reputacao;
    v = fazer(v, 'promover_base');
    const g = pa(v).v32!.garotos!;
    expect(g).toMatchObject({ quantos: 1, ganho: 0.3, aPartirDe: pa(v).temporadas.length + 1 });
    expect(pa(v).ajuste).toBeCloseTo(0.2, 5);
    expect(v.caminhos.tecnico!.reputacao).toBe(Math.min(100, rep + 1));
    expect(pode(v, 'promover_base')).toBe(false);
    v = fazer(proximoAno(v), 'promover_base');
    v = fazer(proximoAno(v), 'promover_base');
    expect(pa(v).v32!.garotos!.quantos).toBe(3);
    expect(pa(v).v32!.garotos!.ganho).toBeCloseTo(0.9, 5);
    const d = disponibilidade(proximoAno(v), { tipo: 'tecnico32', oque: 'promover_base' });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/Três levas/);
  });

  it('a temporada lê a comissão, os garotos maduros e o estudo — e consome o que é de uma temporada só', () => {
    const p = { temporadas: [{}, {}], vestiario: 50, v32: { decisivo: 0.8, treino: 'tatico', comissao: ['preparador', 'analista', 'auxiliar'], garotos: { quantos: 1, ganho: 0.3, aPartirDe: 2 } } } as unknown as PassagemDeTecnico;
    const x = temporadaDoTecnico32(p);
    expect(x.forca).toBeCloseTo(0.55, 5);
    expect(x.decisivo).toBeCloseTo(1.1, 5);
    expect(p.vestiario).toBe(52);
    expect(p.v32!.decisivo).toBeUndefined();
    expect(p.v32!.treino).toBeUndefined();
    // A comissão continua (efeito por temporada); os garotos imaturos ainda não rendem.
    const q = { temporadas: [{}], vestiario: 50, v32: { comissao: ['preparador'], garotos: { quantos: 1, ganho: 0.3, aPartirDe: 2 } } } as unknown as PassagemDeTecnico;
    expect(temporadaDoTecnico32(q)).toEqual({ forca: 0.25, decisivo: 0 });
    expect(temporadaDoTecnico32({ temporadas: [], vestiario: 50 } as unknown as PassagemDeTecnico)).toEqual({ forca: 0, decisivo: 0 });
  });

  it('o ajuste chega ao jogo: o mesmo time, com +4, faz mais pontos na soma de várias temporadas', () => {
    const v0 = noBanco();
    let com = 0, sem = 0;
    for (let s = 1; s <= 12; s++) {
      for (const aj of [0, 4]) {
        const v = transacao(v0, x => { x.t += 12; const p = pa(x); p.ajuste = aj; p.pressao = 0; p.contratoAte = x.t + 60; }).vida;
        const x = structuredClone(v);
        processarTecnico(x, criarRng(1000 + s));
        const p = x.caminhos.tecnico!.passagens.find(q => q.clube === pa(v0).clube && q.desde === pa(v0).desde)!;
        const t = p.temporadas[p.temporadas.length - 1];
        const pts = t.v * 3 + t.e;
        if (aj) com += pts / Math.max(1, t.jogos); else sem += pts / Math.max(1, t.jogos);
      }
    }
    expect(com).toBeGreaterThan(sem);
  });

  it('capitão: muda o vestiário; outra troca só depois de duas temporadas', () => {
    const v0 = noBanco();
    let v = fazer(v0, 'capitao');
    expect([6, -3]).toContain(pa(v).vestiario - pa(v0).vestiario);
    v = proximoAno(v);
    expect(pode(v, 'capitao')).toBe(false);
    expect(disponibilidade(v, { tipo: 'tecnico32', oque: 'capitao' }).motivo).toMatch(/braçadeira/);
    expect(pode(proximoAno(v), 'capitao')).toBe(true);
  });

  it('conversa com o elenco: +4 no vestiário; bloqueada se o ofício já conversou com os líderes no ano', () => {
    const v0 = noBanco();
    pa(v0).vestiario = 50;
    const v = fazer(v0, 'conversa_elenco');
    expect(pa(v).vestiario).toBe(54);
    const w = transacao(noBanco(), x => { x.fatos[`banco:elenco:${Math.floor(x.t / 12)}`] = x.t; }).vida;
    expect(pode(w, 'conversa_elenco')).toBe(false);
  });

  it('coletivas: uma por temporada; cada uma com o seu troco', () => {
    const v0 = transacao(noBanco(), x => { pa(x).pressao = 50; pa(x).vestiario = 50; }).vida;
    const def = fazer(v0, 'coletiva_defender');
    expect([pa(def).vestiario, pa(def).pressao]).toEqual([55, 52]);
    expect(pode(def, 'coletiva_cobrar')).toBe(false);
    const cob = fazer(v0, 'coletiva_cobrar');
    expect(pa(cob).pressao).toBeLessThan(50);
    expect(pa(cob).vestiario).toBeLessThan(50);
    const arb = fazer(v0, 'coletiva_arbitragem');
    expect(pa(arb).pressao).toBe(46);
    expect(arb.caminhos.tecnico!.reputacao).toBe(Math.max(0, v0.caminhos.tecnico!.reputacao - 2));
    expect(arb.financas.conta).toBeLessThanOrEqual(v0.financas.conta);
  });

  it('pedir reforço: a chance é dita antes; sim = elenco mais forte e cobrança maior; não = tensão', () => {
    const v0 = transacao(noBanco(), x => { pa(x).pressao = 40; pa(x).ajuste = undefined; }).vida;
    const d = disponibilidade(v0, { tipo: 'tecnico32', oque: 'pedir_reforco' });
    expect(d.chance).toBeGreaterThan(0);
    expect(d.motivo).toMatch(/Chance/);
    const v = fazer(v0, 'pedir_reforco');
    const veio = (pa(v).ajuste ?? 0) >= 1;
    expect(pa(v).pressao).toBe(veio ? 43 : 45);
    // Um pedido à diretoria por temporada: a comissão espera o ano que vem.
    expect(pode(v, 'comissao_preparador')).toBe(false);
    expect(pode(proximoAno(v), 'comissao_preparador')).toBe(true);
  });

  it('comissão técnica: uma vez por passagem; o analista pede divisão nacional', () => {
    let v = transacao(noBanco(), x => { pa(x).pressao = 0; x.caminhos.tecnico!.reputacao = 100; }).vida;
    for (let k = 0; k < 6 && !(pa(v).v32?.comissao ?? []).includes('preparador'); k++) { v = fazer(v, 'comissao_preparador'); v = proximoAno(v); }
    expect(pa(v).v32?.comissao).toContain('preparador');
    expect(disponibilidade(v, { tipo: 'tecnico32', oque: 'comissao_preparador' }).motivo).toMatch(/já trabalha/);
    const w = transacao(noBanco(), x => { pa(x).nivel = 1; }).vida;
    expect(disponibilidade(w, { tipo: 'tecnico32', oque: 'comissao_analista' }).motivo).toMatch(/orçamento/);
  });

  it('licença: a mesma regra do ofício (custa, um curso de cada vez)', () => {
    const v0 = noBanco();
    const nivel = v0.caminhos.licencaDeTreinador?.nivel ?? 0;
    if (pode(v0, 'licenca')) {
      const v = fazer(v0, 'licenca');
      expect(v.caminhos.licencaDeTreinador?.emCurso?.nivel).toBe(nivel + 1);
      expect(v.financas.conta).toBeLessThan(v0.financas.conta);
      expect(disponibilidade(v, { tipo: 'tecnico32', oque: 'licenca' }).motivo).toMatch(/Um curso de cada vez/);
    } else expect(disponibilidade(v0, { tipo: 'tecnico32', oque: 'licenca' }).motivo).toBeTruthy();
  });

  it('entregar o cargo: fecha a passagem, acaba o emprego; com o cargo balançando, o nome não cai', () => {
    const v0 = transacao(noBanco(), x => { pa(x).pressao = 80; }).vida;
    const rep = v0.caminhos.tecnico!.reputacao;
    const v = fazer(v0, 'entregar_cargo');
    expect(passagemAtual(v)).toBeUndefined();
    const ult = v.caminhos.tecnico!.passagens.slice(-1)[0];
    expect(ult.saida).toBe('saiu');
    expect(v.trabalho.atual?.ocupacaoId).not.toBe('tecnico_futebol');
    expect(v.caminhos.tecnico!.reputacao).toBe(rep);
    expect(pode(v, 'treino_fisico')).toBe(false);
    const w = fazer(transacao(noBanco(), x => { pa(x).pressao = 30; pa(x).contratoAte = x.t + 24; }).vida, 'entregar_cargo');
    expect(w.caminhos.tecnico!.reputacao).toBe(Math.max(0, rep - 3));
  });

  it('seleção: não promove base nem pede reforço', () => {
    const v = transacao(noBanco(), x => { pa(x).selecao = true; }).vida;
    expect(disponibilidade(v, { tipo: 'tecnico32', oque: 'promover_base' }).motivo).toMatch(/Seleção/);
    expect(disponibilidade(v, { tipo: 'tecnico32', oque: 'pedir_reforco' }).motivo).toMatch(/Seleção/);
  });

  it('save: o dia a dia sobrevive ao exportar e importar; o save antigo (sem v32) segue jogável', () => {
    let v = fazer(noBanco(), 'estudar_adversario');
    v = fazer(v, 'promover_base');
    v = fazer(v, 'capitao');
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    expect(pa(l.vida).v32).toEqual(pa(v).v32);
    expect(pode(l.vida, 'estudar_adversario')).toBe(false);
    const antigo = transacao(noBanco(), x => { delete pa(x).v32; }).vida;
    const l2 = importarVida(exportarVida(antigo));
    if (l2.tipo !== 'ok') throw new Error(l2.tipo);
    expect(pode(l2.vida, 'estudar_adversario')).toBe(true);
  });
});
