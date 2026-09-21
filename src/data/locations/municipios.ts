/**
 * Municípios brasileiros suportados na criação de personagem (B4-FIX2 item 17).
 *
 * Módulo de DADOS puro — nenhum componente escreve cidade aqui dentro do
 * JSX; adicionar uma linha a `MUNICIPIOS_BRASILEIROS` é suficiente para que
 * a cidade apareça na tela de criação.
 *
 * Cobertura: todas as 27 UFs têm ao menos a capital; estados grandes ou
 * muito populosos (SP, MG, RJ, BA, PR, RS, SC, PE, CE, GO, PA, AM) recebem
 * cidades adicionais para dar diversidade geográfica real dentro do
 * estado. Não é a lista completa dos 5.570 municípios brasileiros — isso
 * infligiria o bundle e a manutenção sem benefício proporcional ao jogo.
 * `custoVidaRelativo` é parâmetro de BALANCEAMENTO do jogo, não dado
 * socioeconômico de fonte externa.
 */

import type { Regiao } from './estados';

export interface Municipio {
  cidade: string;
  estado: string;
  regiao: Regiao;
  custoVidaRelativo: number; // ~0.75 a 1.4
  /** Marca a capital do estado — usada para ordenar/destacar na interface. */
  capital?: boolean;
}

export const MUNICIPIOS_BRASILEIROS: Municipio[] = [
  // ---------------------------------------------------------------- Norte
  { cidade: 'Rio Branco', estado: 'AC', regiao: 'Norte', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Cruzeiro do Sul', estado: 'AC', regiao: 'Norte', custoVidaRelativo: 0.85 },

  { cidade: 'Macapá', estado: 'AP', regiao: 'Norte', custoVidaRelativo: 0.85, capital: true },
  { cidade: 'Santana', estado: 'AP', regiao: 'Norte', custoVidaRelativo: 0.8 },

  { cidade: 'Manaus', estado: 'AM', regiao: 'Norte', custoVidaRelativo: 0.95, capital: true },
  { cidade: 'Parintins', estado: 'AM', regiao: 'Norte', custoVidaRelativo: 0.8 },
  { cidade: 'Itacoatiara', estado: 'AM', regiao: 'Norte', custoVidaRelativo: 0.8 },

  { cidade: 'Belém', estado: 'PA', regiao: 'Norte', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Santarém', estado: 'PA', regiao: 'Norte', custoVidaRelativo: 0.85 },
  { cidade: 'Marabá', estado: 'PA', regiao: 'Norte', custoVidaRelativo: 0.85 },
  { cidade: 'Ananindeua', estado: 'PA', regiao: 'Norte', custoVidaRelativo: 0.85 },

  { cidade: 'Porto Velho', estado: 'RO', regiao: 'Norte', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Ji-Paraná', estado: 'RO', regiao: 'Norte', custoVidaRelativo: 0.85 },

  { cidade: 'Boa Vista', estado: 'RR', regiao: 'Norte', custoVidaRelativo: 0.85, capital: true },

  { cidade: 'Palmas', estado: 'TO', regiao: 'Norte', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Araguaína', estado: 'TO', regiao: 'Norte', custoVidaRelativo: 0.85 },

  // ------------------------------------------------------------ Nordeste
  { cidade: 'Maceió', estado: 'AL', regiao: 'Nordeste', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Arapiraca', estado: 'AL', regiao: 'Nordeste', custoVidaRelativo: 0.8 },

  { cidade: 'Salvador', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.95, capital: true },
  { cidade: 'Feira de Santana', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Vitória da Conquista', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Ilhéus', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Juazeiro', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.8 },

  { cidade: 'Fortaleza', estado: 'CE', regiao: 'Nordeste', custoVidaRelativo: 0.95, capital: true },
  { cidade: 'Juazeiro do Norte', estado: 'CE', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Sobral', estado: 'CE', regiao: 'Nordeste', custoVidaRelativo: 0.8 },

  { cidade: 'São Luís', estado: 'MA', regiao: 'Nordeste', custoVidaRelativo: 0.85, capital: true },
  { cidade: 'Imperatriz', estado: 'MA', regiao: 'Nordeste', custoVidaRelativo: 0.8 },

  { cidade: 'João Pessoa', estado: 'PB', regiao: 'Nordeste', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Campina Grande', estado: 'PB', regiao: 'Nordeste', custoVidaRelativo: 0.8 },

  { cidade: 'Recife', estado: 'PE', regiao: 'Nordeste', custoVidaRelativo: 1.0, capital: true },
  { cidade: 'Jaboatão dos Guararapes', estado: 'PE', regiao: 'Nordeste', custoVidaRelativo: 0.9 },
  { cidade: 'Caruaru', estado: 'PE', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Petrolina', estado: 'PE', regiao: 'Nordeste', custoVidaRelativo: 0.85 },

  { cidade: 'Teresina', estado: 'PI', regiao: 'Nordeste', custoVidaRelativo: 0.8, capital: true },
  { cidade: 'Parnaíba', estado: 'PI', regiao: 'Nordeste', custoVidaRelativo: 0.78 },

  { cidade: 'Natal', estado: 'RN', regiao: 'Nordeste', custoVidaRelativo: 0.9, capital: true },
  { cidade: 'Mossoró', estado: 'RN', regiao: 'Nordeste', custoVidaRelativo: 0.82 },

  { cidade: 'Aracaju', estado: 'SE', regiao: 'Nordeste', custoVidaRelativo: 0.9, capital: true },

  // --------------------------------------------------------- Centro-Oeste
  { cidade: 'Brasília', estado: 'DF', regiao: 'Centro-Oeste', custoVidaRelativo: 1.3, capital: true },

  { cidade: 'Goiânia', estado: 'GO', regiao: 'Centro-Oeste', custoVidaRelativo: 0.95, capital: true },
  { cidade: 'Aparecida de Goiânia', estado: 'GO', regiao: 'Centro-Oeste', custoVidaRelativo: 0.9 },
  { cidade: 'Anápolis', estado: 'GO', regiao: 'Centro-Oeste', custoVidaRelativo: 0.88 },

  { cidade: 'Cuiabá', estado: 'MT', regiao: 'Centro-Oeste', custoVidaRelativo: 1.0, capital: true },
  { cidade: 'Várzea Grande', estado: 'MT', regiao: 'Centro-Oeste', custoVidaRelativo: 0.9 },
  { cidade: 'Rondonópolis', estado: 'MT', regiao: 'Centro-Oeste', custoVidaRelativo: 0.9 },

  { cidade: 'Campo Grande', estado: 'MS', regiao: 'Centro-Oeste', custoVidaRelativo: 0.95, capital: true },
  { cidade: 'Dourados', estado: 'MS', regiao: 'Centro-Oeste', custoVidaRelativo: 0.88 },

  // ------------------------------------------------------------ Sudeste
  { cidade: 'Vitória', estado: 'ES', regiao: 'Sudeste', custoVidaRelativo: 1.05, capital: true },
  { cidade: 'Vila Velha', estado: 'ES', regiao: 'Sudeste', custoVidaRelativo: 1.0 },
  { cidade: 'Cariacica', estado: 'ES', regiao: 'Sudeste', custoVidaRelativo: 0.95 },

  { cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 1.05, capital: true },
  { cidade: 'Uberlândia', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.95 },
  { cidade: 'Juiz de Fora', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.95 },
  { cidade: 'Contagem', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.95 },
  { cidade: 'Uberaba', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.9 },
  { cidade: 'Montes Claros', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.85 },

  { cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.3, capital: true },
  { cidade: 'Niterói', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.2 },
  { cidade: 'Duque de Caxias', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.0 },
  { cidade: 'Nova Iguaçu', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 0.98 },
  { cidade: 'Volta Redonda', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.0 },
  { cidade: 'Petrópolis', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.05 },

  { cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.35, capital: true },
  { cidade: 'Campinas', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.15 },
  { cidade: 'Guarulhos', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.15 },
  { cidade: 'Santo André', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.15 },
  { cidade: 'São Bernardo do Campo', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.15 },
  { cidade: 'Santos', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.1 },
  { cidade: 'Ribeirão Preto', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.05 },
  { cidade: 'Sorocaba', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.0 },
  { cidade: 'São José dos Campos', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.1 },
  { cidade: 'Bauru', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 0.95 },
  { cidade: 'Marília', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 0.9 },
  { cidade: 'Piracicaba', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.0 },
  { cidade: 'Presidente Prudente', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 0.9 },

  // ---------------------------------------------------------------- Sul
  { cidade: 'Curitiba', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 1.1, capital: true },
  { cidade: 'Londrina', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 0.95 },
  { cidade: 'Maringá', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 0.98 },
  { cidade: 'Foz do Iguaçu', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 0.95 },
  { cidade: 'Ponta Grossa', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 0.9 },

  { cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 1.1, capital: true },
  { cidade: 'Caxias do Sul', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 1.0 },
  { cidade: 'Pelotas', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 0.9 },
  { cidade: 'Santa Maria', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 0.9 },
  { cidade: 'Canoas', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 1.0 },

  { cidade: 'Florianópolis', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 1.25, capital: true },
  { cidade: 'Joinville', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 1.0 },
  { cidade: 'Blumenau', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 1.0 },
  { cidade: 'Chapecó', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 0.9 },
  { cidade: 'Criciúma', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 0.92 }
];

const CACHE_ESTADOS = new Map<string, { sigla: string; regiao: Regiao; quantidadeCidades: number }>();
for (const m of MUNICIPIOS_BRASILEIROS) {
  const atual = CACHE_ESTADOS.get(m.estado);
  if (atual) {
    atual.quantidadeCidades += 1;
  } else {
    CACHE_ESTADOS.set(m.estado, { sigla: m.estado, regiao: m.regiao, quantidadeCidades: 1 });
  }
}

export interface EstadoBrasileiro {
  sigla: string;
  regiao: Regiao;
  quantidadeCidades: number;
}

/** Estados que possuem ao menos uma cidade suportada, em ordem alfabética por sigla. */
export function listarEstadosDisponiveis(): EstadoBrasileiro[] {
  return Array.from(CACHE_ESTADOS.values()).sort((a, b) =>
    a.sigla.localeCompare(b.sigla, 'pt-BR')
  );
}

/** Cidades suportadas de um estado, com a capital primeiro e o restante em ordem alfabética. */
export function listarCidadesPorEstado(sigla: string): Municipio[] {
  return MUNICIPIOS_BRASILEIROS.filter(c => c.estado === sigla).sort((a, b) => {
    if (a.capital && !b.capital) return -1;
    if (!a.capital && b.capital) return 1;
    return a.cidade.localeCompare(b.cidade, 'pt-BR');
  });
}

/** Busca exata de uma cidade suportada. */
export function encontrarCidade(nomeCidade: string, sigla: string): Municipio | undefined {
  return MUNICIPIOS_BRASILEIROS.find(c => c.cidade === nomeCidade && c.estado === sigla);
}
