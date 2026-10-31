/**
 * REWORK 12.35 · PATRIMÔNIO E JUSTIÇA — o confisco deixa de ser só dinheiro. Numa busca ou num processo grave, a Justiça
 * bloqueia os bens que podem ter vindo do crime; na condenação, toma o que é da pessoa; na absolvição, devolve.
 *
 *   PESSOAL      o veículo e o imóvel em nome da pessoa, comprados depois que o caminho começou: bloqueados e, na
 *                condenação, confiscados (o valor conta no que a Justiça cobra — o confisco em dinheiro diminui junto:
 *                não se paga duas vezes a mesma coisa)
 *   DO CASAL     o que é dos dois: bloqueado enquanto o processo corre; a metade do outro protege o bem do confisco
 *   HERDADO      o que veio de família, ou o que já se tinha antes do caminho: a origem é limpa — nem bloqueia
 *   A MORADIA    a casa onde a família mora: bloqueada (não se vende), nunca tomada
 *   FINANCIADO   o bem com dívida no banco fica com o banco: bloqueado, não confiscado
 *
 * As empresas legítimas não são tomadas: uma investigação as atinge pelo movimento (`Empresa` não muda aqui).
 */
import type { Bem, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { dinheiro } from '../texto';

const env = (v: Vida) => v.caminhos.envolvimento;

/** O bem pode ter vindo do crime? (Em nome da pessoa, comprado depois que o caminho começou, sem herança.) */
export function suspeito(v: Vida, b: Bem): boolean {
  const e = env(v);
  if (!e || (b.tipo === 'imovel' && b.herdado) || b.tCompra < e.tInicio) return false;
  return true;
}

/** O que pode ser tomado (sem o casal, sem a moradia da família, sem dívida no banco). */
export function confiscavel(v: Vida, b: Bem): boolean {
  return suspeito(v, b) && b.dono !== 'casal' && v.moradia.imovelId !== b.id && !v.financas.dividas.some(d => d.bemId === b.id);
}

/** Bloqueia o que pode ter vindo do crime. Devolve os nomes (para o texto: o que de fato foi bloqueado). */
export function bloquearBens(v: Vida, motivo: string, soVeiculos = false): string[] {
  const nomes: string[] = [];
  for (const b of v.financas.bens) {
    if (b.bloqueio || !suspeito(v, b) || (soVeiculos && b.tipo !== 'veiculo')) continue;
    b.bloqueio = { t: v.t, motivo };
    nomes.push(b.nome);
  }
  return nomes;
}

export function liberarBens(v: Vida): string[] {
  const nomes: string[] = [];
  for (const b of v.financas.bens) if (b.bloqueio) { delete b.bloqueio; nomes.push(b.nome); }
  if (nomes.length) escrever(v, { texto: `O bloqueio acabou: ${nomes.join(', ')} ${nomes.length === 1 ? 'voltou' : 'voltaram'} a ser seu${nomes.length === 1 ? '' : 's'} para usar e vender.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' });
  return nomes;
}

/**
 * Na condenação: os bens bloqueados que podem ser tomados são confiscados, até o que a Justiça cobra (`teto`). O valor
 * entra em `confiscado_total` — o confisco em dinheiro, depois, cobra só o resto. Os outros bloqueios acabam.
 */
export function confiscarBens(v: Vida, teto: number): number {
  let total = 0;
  const tomados: string[] = [];
  for (const b of [...v.financas.bens].sort((a, b2) => b2.valor - a.valor)) {
    if (!b.bloqueio || !confiscavel(v, b) || total >= teto) continue;
    total += Math.round(b.valor);
    tomados.push(b.nome);
    if (v.financas.veiculoPrincipal === b.id) v.financas.veiculoPrincipal = undefined;
    v.financas.bens = v.financas.bens.filter(x => x.id !== b.id);
  }
  for (const b of v.financas.bens) delete b.bloqueio;
  if (total > 0) {
    v.fatos['confiscado_total'] = (v.fatos['confiscado_total'] ?? 0) + total;
    v.fatos['bens_confiscados'] = (v.fatos['bens_confiscados'] ?? 0) + tomados.length;
    escrever(v, { texto: `A Justiça tomou ${tomados.join(', ')} (uns ${dinheiro(total)}), comprado${tomados.length === 1 ? '' : 's'} com o que entrou por fora.`, relevancia: 'marco', tema: 'dinheiro', tom: 'ruim' });
  }
  return total;
}

export const bensBloqueados = (v: Vida) => v.financas.bens.filter(b => !!b.bloqueio);
