/**
 * VIDA 27 · §3 — expulsões de facção só por causa registrada.
 *
 * Antes: (1) a traição SOFRIDA (um contato da facção entregou o jogador) era gravada como `traicao` na relação do
 * jogador, e o ano seguinte o expulsava por ela; (2) a lealdade caía em silêncio (distância, modo discreto, recusas,
 * dupla filiação) e, abaixo de 12, a expulsão vinha com a mesma frase genérica. Agora cada perda tem motivo, o
 * comando avisa antes, quem tem posto alto perde o posto antes do lugar, e a mensagem diz o motivo real.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import type { OrgViva, Vida } from '../tipos';
import { entrar } from '../sistemas/ilicito';
import { garantirCidade, orgsDaCidade, processarFaccoes, relacaoCom, definirNivel, julgarPermanencia, nivelDe } from '../sistemas/faccoes';
import { lembrarOrg, queixar } from '../sistemas/submundo';

const em = (v: Vida, f: (x: Vida) => void) => transacao(v, x => f(x)).vida;

function deDentro(nivel = 2, semente = 41) {
  let v = adulto(30, { semente, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 200_000; v.financas.dividas = []; v.momento = null; delete v.fila; v.justica = undefined;
  v = transacao(v, (x, r) => { entrar(x, 'grupo', undefined, r); garantirCidade(x); }).vida;
  const o = orgsDaCidade(v)[0];
  const rel = relacaoCom(v, o);
  rel.relacao = 'membro'; rel.lealdade = 60; rel.memoria = []; delete rel.queixas;
  definirNivel(v, rel, nivel);
  return { v, o };
}
const rel = (v: Vida, o: OrgViva) => v.caminhos.envolvimento!.organizacoes!.find(x => x.id === o.id)!;
const umAno = (v: Vida) => transacao(v, x => { x.t += 12; processarFaccoes(x); }).vida;

describe('VIDA 27 · expulsões de facção', () => {
  it('ser traído por gente da facção não expulsa você', () => {
    let { v, o } = deDentro();
    v = em(v, x => { rel(x, o).memoria.push({ t: x.t, fato: 'traido' }); });
    v = umAno(v);
    expect(rel(v, o).expulso).toBeUndefined();
    expect(julgarPermanencia(v, rel(v, o)).tipo).toBe('fica');
  });

  it('lealdade baixa SEM motivo registrado (save antigo) não expulsa', () => {
    let { v, o } = deDentro();
    v = em(v, x => { rel(x, o).lealdade = 5; });
    expect(julgarPermanencia(v, rel(v, o)).tipo).toBe('fica');
    v = umAno(v);
    expect(rel(v, o).expulso).toBeUndefined();
  });

  it('lealdade perdida por motivos registrados: primeiro o recado, depois a expulsão com o motivo dito', () => {
    let { v, o } = deDentro(1);
    v = em(v, x => { const r = rel(x, o); queixar(r, x.t, 30, 'recusou um trabalho do comando', 'falta', true); queixar(r, x.t, 25, 'uma tarefa do grupo saiu errada', 'falta', true); });
    expect(rel(v, o).lealdade).toBeLessThan(12);
    v = umAno(v);
    const r1 = rel(v, o);
    expect(r1.expulso).toBeUndefined();
    expect(r1.avisado).toBe(v.t);
    expect(v.caminhos.envolvimento!.diario!.some(d => d.texto.includes('mandou recado') && d.texto.includes('recusou um trabalho'))).toBe(true);
    // A lealdade continua no chão no ano seguinte (as queixas seguem valendo): agora é rua — e o motivo é dito.
    v = em(v, x => { rel(x, o).lealdade = 5; });
    v = umAno(v);
    const r2 = rel(v, o);
    expect(r2.expulso).toBe(v.t);
    expect(r2.motivoDaSaida).toMatch(/recusou um trabalho do comando/);
    expect(v.biografia.some(b => b.texto.includes('expuls') && b.texto.includes('recusou um trabalho'))).toBe(true);
  });

  it('a traição sua recente expulsa, com o que você fez', () => {
    let { v, o } = deDentro();
    v = em(v, x => { lembrarOrg(rel(x, o), x.t, 'traicao', -15, 'denunciou à polícia o mercado por fora'); });
    v = umAno(v);
    expect(rel(v, o).expulso).toBe(v.t);
    expect(rel(v, o).motivoDaSaida).toBe('expulsão: denunciou à polícia o mercado por fora');
  });

  it('quem tem posto alto perde o posto antes de perder o lugar', () => {
    const { v, o } = deDentro(5);
    const x = rel(v, o);
    queixar(x, v.t, 55, 'apoiou quem perdeu a disputa', 'falta', true);
    x.avisado = v.t - 12;
    expect(julgarPermanencia(v, x, nivelDe(v, x)).tipo).toBe('rebaixar');
    definirNivel(v, x, 3);
    expect(julgarPermanencia(v, x, 3).tipo).toBe('expulsar');
  });

  it('o vínculo que esfria só pela distância se desfaz sem expulsão', () => {
    let { v, o } = deDentro();
    // A organização só chega na cidade dela; você se mudou para outro estado: fora do alcance.
    v = em(v, x => { x.mundoCriminal!.orgs[o.id].alcance = 'local'; x.moradia.municipioId = 'porto-alegre-rs'; rel(x, o).lealdade = 14; });
    v = umAno(v);
    const r1 = rel(v, o);
    expect(r1.distancia).toBe('fora');
    expect(r1.expulso).toBeUndefined();
    expect(r1.saiu).toBe(v.t);
    expect(r1.motivoDaSaida).toMatch(/distância/);
    expect(v.fatos['pressao_grupo']).toBeUndefined();
  });
});
