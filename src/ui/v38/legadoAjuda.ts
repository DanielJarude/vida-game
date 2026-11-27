import type { Vida } from '../../motor/tipos';
import { escolhasDaVida } from './MemoriaDeEscolhas';
import { dinheiro as fmt } from '../../motor/texto';

/** As frases do legado da ajuda e das escolhas (sem número inventado: só o que a vida registrou). */
export function fazerLegadoDaAjuda(vida: Vida): string[] {
  const linhas: string[] = [];
  const doado = vida.fatos['ajudar:total'] ?? 0;
  if (doado > 0) linhas.push(`Doou ${fmt(doado)} para causas da cidade.`);
  if (vida.fatos['ajudar:voluntario'] !== undefined) linhas.push('Foi voluntário, e ajudou a fazer mutirões acontecer.');
  if (vida.fatos['torcida:ativa'] !== undefined) linhas.push('Morreu na torcida: ainda fazia parte dela.');
  const escolhas = escolhasDaVida(vida).length;
  if (escolhas > 0) linhas.push(`Tomou ${escolhas} ${escolhas === 1 ? 'decisão marcante' : 'decisões marcantes'} que ficaram registradas.`);
  return linhas;
}
