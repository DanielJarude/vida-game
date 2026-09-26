/**
 * Migração dos veículos sem versão (saves até v13): cada um ganha uma versão
 * concreta da sua classe — marca e modelo —, escolhida de forma
 * determinística pelo id do veículo (o mesmo save dá sempre o mesmo carro),
 * com peso no que é comum na rua. Idempotente: quem já tem versão válida
 * fica como está. Não mexe em valor, estado nem história.
 */

import type { Veiculo, Vida } from '../tipos';
import { modeloVeiculo, nomeDaVersao, versaoVeiculo, versoesDaClasse, type VersaoVeiculo } from '../dados/bens';

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h >>> 0;
}

/** A versão que um veículo antigo passa a ter (pura: não altera nada). */
export function versaoParaVeiculoAntigo(b: Pick<Veiculo, 'id' | 'modeloId'>): VersaoVeiculo | undefined {
  const classe = modeloVeiculo(b.modeloId).id;
  const lista = versoesDaClasse(classe);
  if (!lista.length) return undefined;
  const total = lista.reduce((s, x) => s + x.pesoUsado, 0);
  let alvo = (hash(`${b.id}:${classe}`) / 0x100000000) * total;
  for (const x of lista) { alvo -= x.pesoUsado; if (alvo < 0) return x; }
  return lista[lista.length - 1];
}

/**
 * Dá versão (e o nome de marca e modelo) aos veículos que não têm. Devolve
 * quantos mudaram. Chamar na migração v13 → v14:
 *   `atribuirVersoesAosVeiculos(v)`
 */
export function atribuirVersoesAosVeiculos(v: Vida): number {
  let n = 0;
  for (const b of v.financas?.bens ?? []) {
    if (b.tipo !== 'veiculo') continue;
    const atual = versaoVeiculo(b.versaoId);
    if (atual && atual.classe === modeloVeiculo(b.modeloId).id) continue;
    const x = versaoParaVeiculoAntigo(b);
    if (!x) continue;
    b.versaoId = x.id;
    b.nome = nomeDaVersao(x);
    // O financiamento passa a dizer o nome do carro.
    for (const d of v.financas.dividas ?? []) if (d.bemId === b.id && d.descricao.startsWith('Financiamento: ')) d.descricao = `Financiamento: ${b.nome}`;
    n++;
  }
  return n;
}
