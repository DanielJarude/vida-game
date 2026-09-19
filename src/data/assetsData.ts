export interface AssetShopItem {
  id: string;
  tipo: 'imovel' | 'veiculo';
  nome: string;
  preco: number;
  custoAnualManutencao: number;
  felicidadeBonus: number;
  aparenciaBonus?: number;
  descricao: string;
}

export const IMOVEIS_LOJA: AssetShopItem[] = [
  {
    id: 'prop_kitnet',
    tipo: 'imovel',
    nome: 'Kitnet / Studio Compacto',
    preco: 140000,
    custoAnualManutencao: 3200,
    felicidadeBonus: 5,
    descricao: 'Um espaço prático e aconchegante para quem quer morar sozinho.'
  },
  {
    id: 'prop_apto_2q',
    tipo: 'imovel',
    nome: 'Apartamento de 2 Quartos',
    preco: 320000,
    custoAnualManutencao: 6500,
    felicidadeBonus: 10,
    descricao: 'Apartamento em condomínio com portaria e sacada.'
  },
  {
    id: 'prop_casa_bairro',
    tipo: 'imovel',
    nome: 'Casa Confortável com Quintal',
    preco: 580000,
    custoAnualManutencao: 9000,
    felicidadeBonus: 16,
    descricao: 'Casa ampla em bairro tranquilo, com garagem e churrasqueira para a família.'
  },
  {
    id: 'prop_cobertura',
    tipo: 'imovel',
    nome: 'Cobertura Duplex de Alto Padrão',
    preco: 1650000,
    custoAnualManutencao: 24000,
    felicidadeBonus: 25,
    descricao: 'Vista panorâmica da cidade, piscina privativa e acabamento de luxo.'
  },
  {
    id: 'prop_chacara',
    tipo: 'imovel',
    nome: 'Chácara / Sítio no Interior',
    preco: 890000,
    custoAnualManutencao: 14000,
    felicidadeBonus: 20,
    descricao: 'Paz, muito verde, pomar de frutas e espaço para lazer nos fins de semana.'
  }
];

export const VEICULOS_LOJA: AssetShopItem[] = [
  {
    id: 'vec_bike_eletrica',
    tipo: 'veiculo',
    nome: 'Bicicleta Elétrica Urbana',
    preco: 4500,
    custoAnualManutencao: 400,
    felicidadeBonus: 3,
    descricao: 'Excelente para evitar o trânsito e se locomover rápido pela cidade.'
  },
  {
    id: 'vec_moto_160',
    tipo: 'veiculo',
    nome: 'Moto 160cc Econômica',
    preco: 16000,
    custoAnualManutencao: 2200,
    felicidadeBonus: 6,
    aparenciaBonus: 2,
    descricao: 'Muito ágil no trânsito, ótimo custo-benefício de combustível.'
  },
  {
    id: 'vec_carro_popular',
    tipo: 'veiculo',
    nome: 'Carro Hatch Popular 1.0 (Seminovo)',
    preco: 48000,
    custoAnualManutencao: 5200,
    felicidadeBonus: 10,
    aparenciaBonus: 4,
    descricao: 'O fiel escudeiro do brasileiro: ar condicionado, direção e trava elétrica.'
  },
  {
    id: 'vec_sedan_medio',
    tipo: 'veiculo',
    nome: 'Sedan Médio Confortável 2.0',
    preco: 110000,
    custoAnualManutencao: 9500,
    felicidadeBonus: 15,
    aparenciaBonus: 8,
    descricao: 'Câmbio automático, bancos em couro e muito conforto para viagens.'
  },
  {
    id: 'vec_suv_luxo',
    tipo: 'veiculo',
    nome: 'SUV Premium Importado',
    preco: 340000,
    custoAnualManutencao: 26000,
    felicidadeBonus: 22,
    aparenciaBonus: 15,
    descricao: 'Potência, presença marcante e teto solar panorâmico.'
  }
];

export interface InvestmentTypeInfo {
  id: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto';
  nome: string;
  rendimentoMin: number; // ex: 0.05
  rendimentoMax: number; // ex: 0.12
  riscoDesc: string;
  descricao: string;
}

export const OPCOES_INVESTIMENTO: InvestmentTypeInfo[] = [
  {
    id: 'poupanca',
    nome: 'Caderneta de Poupança',
    rendimentoMin: 0.05,
    rendimentoMax: 0.065,
    riscoDesc: 'Risco Quase Nulo',
    descricao: 'O investimento mais tradicional do Brasil, garantia total mas rendimento modesto.'
  },
  {
    id: 'tesouro_selic',
    nome: 'Tesouro Direto Selic / CDB 100% CDI',
    rendimentoMin: 0.09,
    rendimentoMax: 0.125,
    riscoDesc: 'Risco Muito Baixo',
    descricao: 'Rendimento atrelado aos juros básicos do Banco Central, seguro e rentável.'
  },
  {
    id: 'fundo_imobiliario',
    nome: 'Fundos Imobiliários (FIIs)',
    rendimentoMin: 0.08,
    rendimentoMax: 0.15,
    riscoDesc: 'Risco Médio',
    descricao: 'Renda passiva mensal gerada pelo aluguel de shoppings, galpões e lajes corporativas.'
  },
  {
    id: 'acoes_b3',
    nome: 'Carteira de Ações na B3 (Bolsa de Valores)',
    rendimentoMin: -0.20,
    rendimentoMax: 0.35,
    riscoDesc: 'Risco Alto',
    descricao: 'Investimento em grandes empresas brasileiras (Vale, Petrobras, bancos e varejo).'
  },
  {
    id: 'cripto',
    nome: 'Criptomoedas (Bitcoin & Altcoins)',
    rendimentoMin: -0.60,
    rendimentoMax: 1.20,
    riscoDesc: 'Risco Altíssimo',
    descricao: 'Extrema volatilidade: chance de multiplicar o capital ou sofrer perdas severas.'
  }
];
