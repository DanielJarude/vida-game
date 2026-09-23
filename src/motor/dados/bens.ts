/**
 * Bens e moradias. Cada coisa que se possui custa para manter, e cada uma
 * muda algo na vida: carro dá mobilidade (e IPVA, seguro, combustível),
 * imóvel próprio tira o aluguel (e traz IPTU, condomínio, reforma).
 */

export interface ModeloVeiculo {
  id: string;
  nome: string;
  preco: number;
  /** Custo mensal de uso: combustível + manutenção básica. */
  usoMensal: number;
  /** IPVA + seguro, % do valor ao ano. */
  taxaAnual: number;
  idadeMin: number;
  cnh: boolean;
  descricao: string;
}

export const VEICULOS: readonly ModeloVeiculo[] = [
  { id: 'bike', nome: 'bicicleta', preco: 1200, usoMensal: 15, taxaAnual: 0, idadeMin: 8, cnh: false, descricao: 'Sem custo de uso. Serve para entregas curtas.' },
  { id: 'bike_eletrica', nome: 'bicicleta elétrica', preco: 5500, usoMensal: 30, taxaAnual: 0, idadeMin: 16, cnh: false, descricao: 'Anda longe sem cansar.' },
  { id: 'moto_usada', nome: 'moto 160 usada', preco: 11000, usoMensal: 220, taxaAnual: 0.035, idadeMin: 18, cnh: true, descricao: 'Barata de manter, arriscada no trânsito.' },
  { id: 'moto_nova', nome: 'moto 160 zero', preco: 19000, usoMensal: 200, taxaAnual: 0.035, idadeMin: 18, cnh: true, descricao: 'A ferramenta de trabalho de muita gente.' },
  { id: 'carro_usado', nome: 'carro popular usado', preco: 38000, usoMensal: 560, taxaAnual: 0.07, idadeMin: 18, cnh: true, descricao: 'Anos de estrada, oficina de vez em quando.' },
  { id: 'carro_novo', nome: 'carro popular zero', preco: 82000, usoMensal: 520, taxaAnual: 0.075, idadeMin: 18, cnh: true, descricao: 'Cheiro de novo e parcela longa.' },
  { id: 'carro_suv', nome: 'SUV médio', preco: 165000, usoMensal: 800, taxaAnual: 0.08, idadeMin: 18, cnh: true, descricao: 'Espaço para a família toda.' },
  { id: 'carro_luxo', nome: 'carro de luxo', preco: 390000, usoMensal: 1400, taxaAnual: 0.08, idadeMin: 18, cnh: true, descricao: 'Chama atenção — boa e má.' }
];

export interface ModeloMoradia {
  id: string;
  nome: string;
  padrao: number;
  /** Multiplicador sobre o aluguel de referência da cidade. */
  fatorAluguel: number;
  /** Valor de compra de referência (cidade de custo 1,0). */
  preco: number;
  condominio: number;
  descricao: string;
}

export const MORADIAS: readonly ModeloMoradia[] = [
  { id: 'republica', nome: 'quarto numa república', padrao: 2, fatorAluguel: 0.33, preco: 0, condominio: 0, descricao: 'Divide cozinha, banheiro e contas com mais gente.' },
  { id: 'casa_simples', nome: 'casa simples na periferia', padrao: 1, fatorAluguel: 0.45, preco: 135000, condominio: 0, descricao: 'Longe do centro, barata, às vezes precária.' },
  { id: 'kitnet', nome: 'kitnet', padrao: 2, fatorAluguel: 0.58, preco: 170000, condominio: 180, descricao: 'Um cômodo e um banheiro. Para uma pessoa.' },
  { id: 'apto_2q', nome: 'apartamento de dois quartos', padrao: 3, fatorAluguel: 1, preco: 320000, condominio: 450, descricao: 'Cabe um casal e uma criança.' },
  { id: 'casa_3q', nome: 'casa de três quartos', padrao: 4, fatorAluguel: 1.5, preco: 540000, condominio: 0, descricao: 'Quintal, espaço para família.' },
  { id: 'alto_padrao', nome: 'apartamento de alto padrão', padrao: 5, fatorAluguel: 2.9, preco: 1400000, condominio: 1600, descricao: 'Portaria, piscina, bairro nobre.' }
];

export const modeloVeiculo = (id: string) => VEICULOS.find(m => m.id === id)!;
export const modeloMoradia = (id: string) => MORADIAS.find(m => m.id === id)!;

/** Preço de imóvel numa cidade: moradia é mais sensível ao custo local. */
export const precoImovel = (m: ModeloMoradia, custoLocal: number) => Math.round(m.preco * Math.pow(custoLocal, 1.7) / 1000) * 1000;
