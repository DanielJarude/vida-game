/**
 * VIDA 30 · §8 — propostas profissionais coerentes: quem oferece é dito (a organização, o clube), o convite para
 * entrevista é diferente da proposta formal, o "Aceitar" não trava sem motivo real, e o vínculo nasce com QUEM propôs.
 * O caso do relatório: o técnico de futebol recebia "um headhunter ligou" sem clube, com o botão bloqueado.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { ocupacao } from '../dados/ocupacoes';
import { contratar } from '../sistemas/trabalho';
import { processarOportunidades } from '../sistemas/oportunidades';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { oportunidadeCoerente } from '../sistemas/mercados';
import { resolverPendente } from '../sistemas/compromissos';
import type { Oportunidade, Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

/** Gira os anos (só o gerador de portas) até nascer uma proposta — ou desiste. */
function ateUmaProposta(v: Vida, semente: number): Oportunidade | undefined {
  for (let k = 0; k < 120; k++) {
    delete v.caminhos.ultimas['proposta'];
    v.caminhos.oportunidades = [];
    processarOportunidades(v, criarRng(semente + k));
    const p = v.caminhos.oportunidades.find(o => o.tipo === 'proposta');
    if (p) return p;
    v.t += 1; // (o texto e o contratante saem de um sorteio derivado do mês: outro mês, outra voz)
  }
  return undefined;
}

function empregado(ocId: string, semente = 31): Vida {
  const v = adulto(36, { semente, municipioId: 'sao-paulo-sp' });
  contratar(v, criarRng(semente), ocupacao(ocId));
  const e = v.trabalho.atual!;
  e.desempenho = 85;
  e.contrato = ocupacao(ocId).contrato;
  v.trabalho.experiencia[ocupacao(ocId).trilha] = 60;
  return v;
}

describe('VIDA 30 · §8 propostas: o contratante é dito e o aceite funciona', () => {
  it('emprego comum: a proposta nomeia a organização (que não é a sua), o cargo e o salário', () => {
    let achou = 0;
    for (const s of [3, 5, 8, 13]) {
      const v = empregado('assistente_adm', s);
      const p = ateUmaProposta(v, s * 100);
      if (!p) continue;
      achou++;
      expect(p.empregador).toBeTruthy();
      expect(p.orgId).toBeTruthy();
      expect(p.orgId).not.toBe(v.trabalho.atual!.orgId);
      expect(p.salario).toBeGreaterThan(v.trabalho.atual!.salario);
      expect(p.texto).toContain(p.empregador!.split(' ')[0]);
      expect(podeTentar(disponibilidade(v, { tipo: 'oportunidade', id: p.id, aceitar: true }))).toBe(true);
    }
    expect(achou).toBeGreaterThan(0);
  });

  it('proposta formal: aceitar assina com ESTA organização, pelo salário oferecido, sem entrevista', () => {
    let v = empregado('assistente_adm', 7);
    let p: Oportunidade | undefined;
    for (let s = 1; s < 40 && !(p?.formal); s++) p = ateUmaProposta(v, s * 37);
    expect(p?.formal).toBe(true);
    const antes = v.trabalho.atual!.empregador;
    v = executar(v, { tipo: 'oportunidade', id: p!.id, aceitar: true }).vida;
    if (v.caminhos.pendente) { resolverPendente(v, criarRng(1), 0); v.momento = null; }
    const e = v.trabalho.atual!;
    expect(e.ocupacaoId).toBe(p!.ocupacaoId);
    expect(e.orgId).toBe(p!.orgId);
    expect(e.empregador).toContain(p!.empregador!);
    expect(e.empregador).not.toBe(antes);
    expect(e.salario).toBeGreaterThanOrEqual(p!.salario!);
    expect(v.caminhos.processo?.tipo).not.toBe('entrevista');
  });

  it('convite para entrevista (o headhunter): aceitar abre a entrevista NAQUELA organização', () => {
    let v = empregado('assistente_adm', 9);
    let p: Oportunidade | undefined;
    for (let s = 1; s < 80 && !(p && !p.formal); s++) p = ateUmaProposta(v, s * 53);
    expect(p && !p.formal).toBe(true);
    expect(p!.titulo).toMatch(/^Entrevista (na|no) /);
    v = executar(v, { tipo: 'oportunidade', id: p!.id, aceitar: true }).vida;
    expect(v.caminhos.processo?.tipo).toBe('entrevista');
    expect(v.caminhos.processo?.ajuste?.orgId).toBe(p!.orgId);
  });

  it('o técnico de futebol não recebe o recado genérico sem clube; o antigo, de save velho, sai das portas', () => {
    const v = empregado('tecnico_futebol', 11);
    for (let s = 0; s < 6; s++) {
      const p = ateUmaProposta(v, 900 + s * 120);
      if (p) expect(p.empregador).toBeTruthy();
    }
    const velho = { tipo: 'proposta', ocupacaoId: 'tecnico_futebol' } as const;
    expect(oportunidadeCoerente(v, velho)).not.toBe(true);
  });

  it('comissão técnica (auxiliar): a proposta é de um clube com nome, e aceitar leva a ESSE clube', () => {
    let v = empregado('auxiliar_tecnico', 12);
    const meu = v.trabalho.atual!.clube;
    const p = ateUmaProposta(v, 4400);
    expect(p).toBeTruthy();
    expect(p!.clube).toBeTruthy();
    expect(p!.clube).not.toBe(meu);
    expect(p!.formal).toBe(true);
    expect(podeTentar(disponibilidade(v, { tipo: 'oportunidade', id: p!.id, aceitar: true }))).toBe(true);
    v = executar(v, { tipo: 'oportunidade', id: p!.id, aceitar: true }).vida;
    if (v.caminhos.pendente) { resolverPendente(v, criarRng(1), 0); v.momento = null; }
    expect(v.trabalho.atual!.clube).toBe(p!.clube);
    expect(v.trabalho.atual!.empregador).toContain(p!.clube!);
  });

  it('recusar fecha a porta e o vínculo de agora continua', () => {
    let v = empregado('assistente_adm', 15);
    const p = ateUmaProposta(v, 777)!;
    const antes = v.trabalho.atual!.empregador;
    v = executar(v, { tipo: 'oportunidade', id: p.id, aceitar: false }).vida;
    expect(v.caminhos.oportunidades.some(o => o.id === p.id)).toBe(false);
    expect(v.trabalho.atual!.empregador).toBe(antes);
  });
});
