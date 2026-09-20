/**
 * Dados de estados brasileiros — nomes completos e agrupamento por região
 * (B4-FIX2 item 16).
 *
 * Puro: nenhuma lógica de UI, nenhuma dependência de React. A ordem de
 * exibição por região é decidida aqui; o componente de criação de
 * personagem apenas lê `listarRegioesComEstados()`.
 */

export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

/** Ordem editorial das regiões (não alfabética: Norte a Sul, como no mapa). */
export const ORDEM_REGIOES: Regiao[] = [
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul'
];

export interface InfoEstado {
  sigla: string;
  nome: string;
  regiao: Regiao;
}

/** As 27 unidades federativas (26 estados + Distrito Federal), nome completo. */
export const ESTADOS_BRASILEIROS: InfoEstado[] = [
  // Norte
  { sigla: 'AC', nome: 'Acre', regiao: 'Norte' },
  { sigla: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { sigla: 'PA', nome: 'Pará', regiao: 'Norte' },
  { sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { sigla: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' },
  // Nordeste
  { sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  // Centro-Oeste
  { sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  { sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  // Sudeste
  { sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  // Sul
  { sigla: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' }
];

const MAPA_POR_SIGLA = new Map(ESTADOS_BRASILEIROS.map(e => [e.sigla, e]));

/** Nome completo do estado a partir da sigla (fallback: a própria sigla). */
export function obterNomeEstado(sigla: string): string {
  return MAPA_POR_SIGLA.get(sigla)?.nome ?? sigla;
}

/** Região do estado a partir da sigla. */
export function obterRegiaoEstado(sigla: string): Regiao | undefined {
  return MAPA_POR_SIGLA.get(sigla)?.regiao;
}
