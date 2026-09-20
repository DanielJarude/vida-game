/**
 * Unidades federativas do Brasil.
 *
 * As 27 UFs são uma **entidade própria**, não algo derivado da lista de
 * cidades. O B4-FIX cometeu exatamente esse erro: `listarEstadosDisponiveis`
 * lia `CIDADES_BRASILEIRAS` e montava o seletor a partir dela, então só
 * apareciam os 19 estados que por acaso tinham cidade cadastrada — Acre,
 * Amapá, Maranhão, Piauí, Rondônia, Roraima, Sergipe e Tocantins
 * simplesmente não existiam para o jogador.
 *
 * Aqui a lista é declarada por inteiro e é a fonte de verdade. As cidades
 * se penduram nela, nunca o contrário.
 */

export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export interface UnidadeFederativa {
  /** Sigla oficial de duas letras. */
  sigla: string;
  /** Nome por extenso — é isto que o jogador lê. */
  nome: string;
  /** Região. Existe para sistemas futuros; não é exibida na criação. */
  regiao: Regiao;
}

/** As 27 unidades federativas, em ordem alfabética por nome. */
export const UNIDADES_FEDERATIVAS: readonly UnidadeFederativa[] = [
  { sigla: 'AC', nome: 'Acre', regiao: 'Norte' },
  { sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { sigla: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  { sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  { sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { sigla: 'PA', nome: 'Pará', regiao: 'Norte' },
  { sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { sigla: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { sigla: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' },
  { sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  { sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  { sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' }
] as const;
