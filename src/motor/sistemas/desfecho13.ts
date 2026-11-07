/**
 * VIDA 13 · Ações — UMA DE CADA VEZ, COM O RESULTADO NA HORA.
 *
 * Antes (REWORK 11.5 · EVT-01), o ano com mais de uma decisão abria a seguinte no mesmo instante em que a anterior era
 * resolvida: a tela, que só mostrava o resultado quando não havia decisão aberta, escondia o resultado de cada escolha
 * até a última — e cada resultado novo apagava o anterior. O jogador decidia tudo às cegas e via só o último desfecho.
 *
 * Agora (quando a interface pede — `{ tipo: 'decidir', umaPorVez: true }`):
 *   apresenta → escolhe → executa → RESULTADO (o que foi escolhido, o que aconteceu, o que custou, a conta de agora, o que
 *   mudou, o que esperar) → só então a próxima, preparada de novo com o estado de AGORA (`abrirProximaDaFila` confere cada
 *   uma outra vez: o que a escolha desfez não abre).
 *
 * O resultado fica NA VIDA (`desfecho13`) até ser visto: salvar e recarregar no meio mostra o mesmo resultado, e nada é
 * executado de novo (a decisão já foi resolvida; o momento resolvido não existe mais; `seguir` só vale uma vez).
 * "Deixar o resto para depois" adia as decisões que podem esperar (como o ano cheio já fazia: uma vez, para o ano
 * seguinte; a que já tinha esperado sai da pauta). As urgentes (o luto, a gravidez, o processo) não esperam.
 */

import type { Desfecho13, Empresa, Vida } from '../tipos';
import { abrirProximaDaFila } from '../conteudo/motor';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export type OqueDesfecho13 = 'seguir' | 'encerrar';

/** As decisões deste ano que ainda esperam a vez (não contam as adiadas para o ano seguinte). */
export function filaDoAno13(v: Vida): { restantes: number; urgentes: number } {
  const doAno = (v.fila ?? []).filter(x => x.t <= v.t);
  return { restantes: doAno.length, urgentes: doAno.filter(x => x.urgente).length };
}

const totalDeDividas = (v: Vida) => (v.financas.dividas ?? []).reduce((s, d) => s + (d.saldo > 0 ? d.saldo : 0), 0);

/** O retrato de antes da ação (para dizer depois o que mudou na conta e no caixa). */
export interface Antes13 { conta: number; dividas: number; caixa?: { id: string; nome: string; valor: number } }
export function antesDaAcao13(v: Vida, empresa?: Empresa): Antes13 {
  return { conta: v.financas.conta, dividas: totalDeDividas(v), ...(empresa ? { caixa: { id: empresa.id, nome: empresa.nome, valor: empresa.caixa } } : {}) };
}

/** Monta o resultado imediato de uma ação já executada (em `v`, o estado de depois). */
export function montarDesfecho13(v: Vida, antes: Antes13, x: { titulo: string; texto: string; escolha?: string; mudancas?: string[]; esperado?: string[]; empresa?: Empresa; pessoaId?: string }): Desfecho13 {
  const conta = v.financas.conta;
  const dividas = totalDeDividas(v);
  const fila = filaDoAno13(v);
  const caixaDepois = x.empresa && antes.caixa && x.empresa.id === antes.caixa.id ? x.empresa.caixa : undefined;
  const mudancas = (x.mudancas ?? []).filter(m => m && m !== x.texto);
  return {
    t: v.t,
    titulo: x.titulo,
    ...(x.escolha ? { escolha: x.escolha } : {}),
    texto: x.texto,
    ...(mudancas.length ? { mudancas } : {}),
    ...(Math.abs(conta - antes.conta) >= 1 ? { conta: { antes: Math.round(antes.conta), depois: Math.round(conta) } } : {}),
    ...(Math.abs(dividas - antes.dividas) >= 1 ? { dividas: { antes: Math.round(antes.dividas), depois: Math.round(dividas) } } : {}),
    ...(caixaDepois !== undefined && Math.abs(caixaDepois - antes.caixa!.valor) >= 1 ? { caixa: { nome: antes.caixa!.nome, antes: Math.round(antes.caixa!.valor), depois: Math.round(caixaDepois) } } : {}),
    ...(x.esperado?.length ? { esperado: x.esperado } : {}),
    ...(fila.restantes ? { restantes: fila.restantes } : {}),
    ...(fila.urgentes ? { urgentes: fila.urgentes } : {}),
    ...(x.pessoaId ? { pessoaId: x.pessoaId } : {})
  };
}

export function disponibilidadeDesfecho13(v: Vida, oque: OqueDesfecho13): Veredito {
  // O resultado já visto (o clique repetido, a aba recarregada) não faz nada duas vezes.
  if (!v.desfecho13) return bloqueio('incompativel', 'Esse resultado já foi visto.');
  if (oque === 'encerrar' && !filaDoAno13(v).restantes) return bloqueio('incompativel', 'Não há outras decisões esperando neste ano.');
  return PERMITIDO;
}

/**
 * Depois do resultado: `seguir` abre a próxima decisão do ano (conferida com o estado de agora); `encerrar` deixa as que
 * podem esperar para depois e abre só as urgentes. Devolve a frase para o aviso (ou nada).
 */
export function seguirDesfecho13(v: Vida, oque: OqueDesfecho13): string | undefined {
  delete v.desfecho13;
  if (oque === 'seguir') { if (!v.momento) abrirProximaDaFila(v); return undefined; }
  let adiadas = 0, saem = 0;
  const fica = [];
  for (const x of v.fila ?? []) {
    if (x.t > v.t || x.urgente) { fica.push(x); continue; }
    if (x.adiada) { saem++; continue; }
    fica.push({ ...x, t: v.t + 12, adiada: true });
    adiadas++;
  }
  if (fica.length) v.fila = fica; else delete v.fila;
  if (!v.momento) abrirProximaDaFila(v);
  const partes = [
    adiadas ? (adiadas === 1 ? 'Um assunto fica para o ano que vem (se ainda fizer sentido até lá).' : `${adiadas} assuntos ficam para o ano que vem (se ainda fizerem sentido até lá).`) : '',
    saem ? (saem === 1 ? 'Um, que já tinha esperado um ano, sai da pauta.' : `${saem}, que já tinham esperado um ano, saem da pauta.`) : '',
    v.momento ? 'O que não pode esperar continua aqui.' : ''
  ].filter(Boolean);
  return partes.join(' ') || undefined;
}

/** Saves: o resultado mal formado ou de outro ano não fica pendurado na tela. */
export function normalizarVida13Acoes(v: Vida): void {
  const d = v.desfecho13 as Partial<Desfecho13> | undefined;
  if (d === undefined) return;
  if (!d || typeof d !== 'object' || typeof d.texto !== 'string' || typeof d.titulo !== 'string' || d.t !== v.t) delete v.desfecho13;
}
