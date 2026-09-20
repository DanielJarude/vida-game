/**
 * Cidades de nascimento suportadas.
 *
 * COBERTURA: o jogo trabalha com uma seleção de cidades por UF, não com os
 * 5.570 municípios brasileiros. A regra que o sistema garante é:
 * **toda UF tem ao menos uma cidade válida**, para que nenhum estado leve o
 * jogador a um fluxo quebrado. Há teste verificando isso para as 27.
 *
 * `custoVidaRelativo` é **parâmetro de balanceamento do jogo** (0,8 a 1,4),
 * não estatística socioeconômica de fonte externa. Cidades novas devem
 * receber um valor coerente com as já existentes — capitais caras perto de
 * 1,2–1,35; interior perto de 0,85–1,0.
 *
 * Para acrescentar uma cidade basta uma linha aqui: a interface a exibe
 * automaticamente, sem tocar em componente React.
 */

export interface BrazilianCity {
  cidade: string;
  estado: string;
  custoVidaRelativo: number;
}

export const CIDADES_BRASILEIRAS: BrazilianCity[] = [
  // ------------------------------------------------------------- Norte
  { cidade: 'Rio Branco', estado: 'AC', custoVidaRelativo: 0.95 },
  { cidade: 'Cruzeiro do Sul', estado: 'AC', custoVidaRelativo: 0.85 },
  { cidade: 'Macapá', estado: 'AP', custoVidaRelativo: 0.95 },
  { cidade: 'Santana', estado: 'AP', custoVidaRelativo: 0.88 },
  { cidade: 'Manaus', estado: 'AM', custoVidaRelativo: 0.95 },
  { cidade: 'Parintins', estado: 'AM', custoVidaRelativo: 0.85 },
  { cidade: 'Belém', estado: 'PA', custoVidaRelativo: 0.9 },
  { cidade: 'Santarém', estado: 'PA', custoVidaRelativo: 0.85 },
  { cidade: 'Porto Velho', estado: 'RO', custoVidaRelativo: 0.95 },
  { cidade: 'Ji-Paraná', estado: 'RO', custoVidaRelativo: 0.85 },
  { cidade: 'Boa Vista', estado: 'RR', custoVidaRelativo: 0.95 },
  { cidade: 'Palmas', estado: 'TO', custoVidaRelativo: 0.92 },
  { cidade: 'Araguaína', estado: 'TO', custoVidaRelativo: 0.85 },

  // ---------------------------------------------------------- Nordeste
  { cidade: 'Maceió', estado: 'AL', custoVidaRelativo: 0.9 },
  { cidade: 'Arapiraca', estado: 'AL', custoVidaRelativo: 0.82 },
  { cidade: 'Salvador', estado: 'BA', custoVidaRelativo: 0.95 },
  { cidade: 'Feira de Santana', estado: 'BA', custoVidaRelativo: 0.85 },
  { cidade: 'Ilhéus', estado: 'BA', custoVidaRelativo: 0.88 },
  { cidade: 'Fortaleza', estado: 'CE', custoVidaRelativo: 0.95 },
  { cidade: 'Juazeiro do Norte', estado: 'CE', custoVidaRelativo: 0.84 },
  { cidade: 'São Luís', estado: 'MA', custoVidaRelativo: 0.9 },
  { cidade: 'Imperatriz', estado: 'MA', custoVidaRelativo: 0.83 },
  { cidade: 'João Pessoa', estado: 'PB', custoVidaRelativo: 0.9 },
  { cidade: 'Campina Grande', estado: 'PB', custoVidaRelativo: 0.85 },
  { cidade: 'Recife', estado: 'PE', custoVidaRelativo: 1.0 },
  { cidade: 'Caruaru', estado: 'PE', custoVidaRelativo: 0.85 },
  { cidade: 'Olinda', estado: 'PE', custoVidaRelativo: 0.95 },
  { cidade: 'Teresina', estado: 'PI', custoVidaRelativo: 0.88 },
  { cidade: 'Parnaíba', estado: 'PI', custoVidaRelativo: 0.82 },
  { cidade: 'Natal', estado: 'RN', custoVidaRelativo: 0.9 },
  { cidade: 'Mossoró', estado: 'RN', custoVidaRelativo: 0.84 },
  { cidade: 'Aracaju', estado: 'SE', custoVidaRelativo: 0.9 },
  { cidade: 'Nossa Senhora do Socorro', estado: 'SE', custoVidaRelativo: 0.82 },

  // ------------------------------------------------------ Centro-Oeste
  { cidade: 'Brasília', estado: 'DF', custoVidaRelativo: 1.3 },
  { cidade: 'Goiânia', estado: 'GO', custoVidaRelativo: 0.95 },
  { cidade: 'Anápolis', estado: 'GO', custoVidaRelativo: 0.88 },
  { cidade: 'Cuiabá', estado: 'MT', custoVidaRelativo: 1.0 },
  { cidade: 'Rondonópolis', estado: 'MT', custoVidaRelativo: 0.9 },
  { cidade: 'Campo Grande', estado: 'MS', custoVidaRelativo: 0.95 },
  { cidade: 'Dourados', estado: 'MS', custoVidaRelativo: 0.87 },

  // ----------------------------------------------------------- Sudeste
  { cidade: 'Vitória', estado: 'ES', custoVidaRelativo: 1.05 },
  { cidade: 'Vila Velha', estado: 'ES', custoVidaRelativo: 1.0 },
  { cidade: 'Belo Horizonte', estado: 'MG', custoVidaRelativo: 1.05 },
  { cidade: 'Uberlândia', estado: 'MG', custoVidaRelativo: 0.95 },
  { cidade: 'Juiz de Fora', estado: 'MG', custoVidaRelativo: 0.95 },
  { cidade: 'Ouro Preto', estado: 'MG', custoVidaRelativo: 0.92 },
  { cidade: 'Rio de Janeiro', estado: 'RJ', custoVidaRelativo: 1.3 },
  { cidade: 'Niterói', estado: 'RJ', custoVidaRelativo: 1.2 },
  { cidade: 'Petrópolis', estado: 'RJ', custoVidaRelativo: 1.05 },
  { cidade: 'São Paulo', estado: 'SP', custoVidaRelativo: 1.35 },
  { cidade: 'Campinas', estado: 'SP', custoVidaRelativo: 1.15 },
  { cidade: 'Ribeirão Preto', estado: 'SP', custoVidaRelativo: 1.05 },
  { cidade: 'Santos', estado: 'SP', custoVidaRelativo: 1.1 },
  { cidade: 'Marília', estado: 'SP', custoVidaRelativo: 0.95 },
  { cidade: 'São José dos Campos', estado: 'SP', custoVidaRelativo: 1.1 },

  // --------------------------------------------------------------- Sul
  { cidade: 'Curitiba', estado: 'PR', custoVidaRelativo: 1.1 },
  { cidade: 'Londrina', estado: 'PR', custoVidaRelativo: 0.95 },
  { cidade: 'Maringá', estado: 'PR', custoVidaRelativo: 0.95 },
  { cidade: 'Porto Alegre', estado: 'RS', custoVidaRelativo: 1.1 },
  { cidade: 'Caxias do Sul', estado: 'RS', custoVidaRelativo: 1.0 },
  { cidade: 'Pelotas', estado: 'RS', custoVidaRelativo: 0.9 },
  { cidade: 'Florianópolis', estado: 'SC', custoVidaRelativo: 1.25 },
  { cidade: 'Joinville', estado: 'SC', custoVidaRelativo: 1.0 },
  { cidade: 'Blumenau', estado: 'SC', custoVidaRelativo: 1.0 }
];
