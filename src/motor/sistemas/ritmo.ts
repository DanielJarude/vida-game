/**
 * Os fatores puros do ritmo e da freguesia (sem dependências), para que o
 * trabalho, a semana e o estado leiam a mesma conta que a vida profissional
 * (`profissao`) escolhe.
 */

import type { Emprego, Vida } from '../tipos';
import { filhos, idadePessoa, parceiro } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';

export type Ritmo = 'leve' | 'normal' | 'puxado';

export const ritmoDe = (e?: Emprego): Ritmo => e?.ritmo ?? 'normal';

/** O quanto o ritmo muda o salário de quem ganha por turma ou plantão. */
export const fatorRitmoSalario = (r: Ritmo) => (r === 'puxado' ? 1.25 : r === 'leve' ? 0.8 : 1);
/** O quanto muda a renda de quem vive de freguesia (sem contar o que a agenda cheia faz crescer). */
export const fatorRitmoClientela = (r: Ritmo) => (r === 'puxado' ? 1.15 : r === 'leve' ? 0.82 : 1);

/** Tudo o que multiplica o salário de hoje sem mudar o cargo: jornada reduzida para cuidar, turmas a mais. */
export function fatorJornada(e: Emprego): number {
  const ritmo = e.clientela === undefined ? fatorRitmoSalario(ritmoDe(e)) : 1;
  return (e.reduzida ? 0.6 : 1) * ritmo;
}

/** Fator de renda de quem vive de freguesia: ritmo, preço, estrutura. */
export function fatorDeFreguesia(e?: Emprego): number {
  if (!e) return 1;
  return fatorRitmoClientela(ritmoDe(e)) * (e.preco === 'alto' ? 1.2 : e.preco === 'baixo' ? 0.85 : 1) * (1 + (e.estrutura ?? 0) * 0.04);
}

/** O quanto ritmo, preço e estrutura movem a freguesia num ano. */
export function deltaDeFreguesia(e: Emprego, habilidade: number): number {
  let d = 0;
  const r = ritmoDe(e);
  if (r === 'puxado') d += 2; else if (r === 'leve') d -= 2;
  if (e.preco === 'alto') d -= habilidade >= 72 && (e.clientela ?? 0) >= 60 ? 0.5 : 3;
  else if (e.preco === 'baixo') d += 3;
  d += (e.estrutura ?? 0) * 1;
  return d;
}

/** Quanto o ritmo pesa na semana. */
export const pesoDoRitmoNaSemana = (e: Emprego) => (ritmoDe(e) === 'puxado' ? 0.5 : ritmoDe(e) === 'leve' ? -0.4 : 0);

export const climaDe = (e?: Emprego) => e?.clima ?? 50;

/** Há chefia e equipe (e, portanto, clima): emprego com vínculo, fora da formação e do esporte. */
export function comChefia(e?: Emprego): boolean {
  if (!e || e.clientela !== undefined || e.formacaoAte) return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc || oc.trilha === 'atleta') return false;
  return ['clt', 'servidor', 'militar', 'aprendiz', 'estagio', 'temporario'].includes(e.contrato);
}

/** O ritmo na cabeça e no humor (lido por `estado`). */
export function pesoDoRitmo(v: Vida): { cabeca?: { texto: string; efeito: number }; humor?: { texto: string; efeito: number } } {
  const e = v.trabalho.atual;
  if (!e) return {};
  const r = ritmoDe(e);
  if (r === 'puxado') {
    const anos = e.anosPuxado ?? 0;
    return { cabeca: { texto: anos >= 3 ? 'anos de trabalho sem trégua' : 'o ritmo puxado do trabalho', efeito: 9 + Math.min(8, anos * 2) } };
  }
  if (r === 'leve') {
    const casa = filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 18) || !!parceiro(v);
    return { cabeca: { texto: 'um trabalho que cabe na vida', efeito: -4 }, humor: casa ? { texto: 'mais tempo com quem mora com você', efeito: 2 } : undefined };
  }
  return {};
}

/** O clima na cabeça e no humor (lido por `estado`). */
export function pesoDoClima(v: Vida): { cabeca?: { texto: string; efeito: number }; humor?: { texto: string; efeito: number } } {
  const e = v.trabalho.atual;
  if (!e || !comChefia(e)) return {};
  const c = climaDe(e);
  if (c < 32) return { cabeca: { texto: 'o clima ruim no trabalho', efeito: 7 } };
  if (c < 42) return { cabeca: { texto: 'a relação difícil com a chefia', efeito: 3 } };
  if (c >= 72) return { humor: { texto: 'gente boa no trabalho', efeito: 2 } };
  return {};
}

/** O negócio na cabeça: no vermelho, pesa; grande, com gente dependendo de você, também. */
export function pesoDoNegocio(v: Vida): { texto: string; efeito: number } | undefined {
  const n = v.caminhos.negocio;
  const e = v.trabalho.atual;
  if (!n || n.estado === 'fechado' || e?.ocupacaoId !== n.ocupacaoId) return undefined;
  if (n.estado === 'apertado') return { texto: `${n.nome} no vermelho`, efeito: 7 };
  if ((n.unidades ?? 1) >= 2 || (n.equipe?.length ?? 0) >= 4) return { texto: 'responder por um negócio grande e pela gente que trabalha nele', efeito: 4 };
  return undefined;
}
