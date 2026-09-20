/**
 * Apresentação de relacionamentos (B4).
 *
 * O motor guarda `relacionamento` como número 0–100. A interface NÃO é
 * obrigada a exibir isso: aqui o número vira proximidade qualitativa.
 *
 * Os estados usados são apenas os que o sistema atual realmente suporta —
 * nenhuma mecânica nova de vínculo foi inventada.
 */

import type { FamilyMember } from '../types';
import { getRotuloParentesco } from '../utils/formatters';

export type Proximidade =
  | 'muito_proxima'
  | 'proxima'
  | 'estavel'
  | 'distante'
  | 'conflituosa';

export interface RelacionamentoApresentado {
  membro: FamilyMember;
  /** Nome exibido (primeiro nome basta na visão geral). */
  nome: string;
  /** Parentesco em pt-BR, já formatado. */
  relacao: string;
  proximidade: Proximidade;
  rotuloProximidade: string;
  iniciais: string;
}

const ROTULOS: Record<Proximidade, string> = {
  muito_proxima: 'Muito próxima',
  proxima: 'Próxima',
  estavel: 'Estável',
  distante: 'Distante',
  conflituosa: 'Conflituosa'
};

/** Converte a intensidade interna em uma leitura humana da relação. */
export function classificarProximidade(valor: number): Proximidade {
  if (valor >= 80) return 'muito_proxima';
  if (valor >= 60) return 'proxima';
  if (valor >= 40) return 'estavel';
  if (valor >= 20) return 'distante';
  return 'conflituosa';
}

export function rotuloProximidade(proximidade: Proximidade): string {
  return ROTULOS[proximidade];
}

function extrairIniciais(nome: string, sobrenome: string): string {
  const a = nome.trim().charAt(0);
  const b = sobrenome.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '·';
}

export function apresentarRelacionamento(
  membro: FamilyMember
): RelacionamentoApresentado {
  const proximidade = classificarProximidade(membro.relacionamento);
  return {
    membro,
    nome: membro.nome,
    relacao: getRotuloParentesco(membro.tipo),
    proximidade,
    rotuloProximidade: ROTULOS[proximidade],
    iniciais: extrairIniciais(membro.nome, membro.sobrenome)
  };
}

/**
 * Seleciona as relações mais significativas para a visão geral.
 * Prioriza vínculos vivos e mais próximos; o resto continua na seção própria.
 */
export function selecionarRelacionamentosDestaque(
  familia: FamilyMember[],
  limite = 4
): RelacionamentoApresentado[] {
  return familia
    .filter(m => m.vivo)
    .slice()
    .sort((a, b) => b.relacionamento - a.relacionamento)
    .slice(0, limite)
    .map(apresentarRelacionamento);
}
