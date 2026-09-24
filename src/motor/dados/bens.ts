/**
 * Bens e moradias. Cada coisa que se possui custa para manter, e cada uma
 * muda algo na vida: carro dá mobilidade (e IPVA, seguro, combustível,
 * oficina), imóvel próprio tira o aluguel (e traz IPTU, condomínio, reforma).
 *
 * Categorias genéricas, sem marcas: o que importa é o que o bem faz na vida
 * (levar a família, aguentar a estrada, caber no orçamento), não o nome.
 * Valores em reais de hoje, cidade de custo 1,0.
 */

export type CategoriaVeiculo = 'bicicleta' | 'moto' | 'carro';

export interface ModeloVeiculo {
  id: string;
  nome: string;
  categoria: CategoriaVeiculo;
  /** Preço zero quilômetro. */
  preco: number;
  /** Custo mensal de uso: combustível + manutenção básica. */
  usoMensal: number;
  /** IPVA + seguro, % do valor ao ano. */
  taxaAnual: number;
  idadeMin: number;
  cnh: boolean;
  /** Quantas pessoas leva. */
  lugares: number;
  /** 1..5: o quanto dá conforto (e o quanto os outros reparam). */
  conforto: number;
  /** Propensão a dar problema (1 = normal). */
  fragilidade: number;
  descricao: string;
  /** Existe como usado no mercado. */
  usado: boolean;
}

export const VEICULOS: readonly ModeloVeiculo[] = [
  { id: 'bike', nome: 'bicicleta', categoria: 'bicicleta', preco: 1200, usoMensal: 15, taxaAnual: 0, idadeMin: 8, cnh: false, lugares: 1, conforto: 1, fragilidade: 0.5, descricao: 'Sem combustível, sem IPVA. Vai até onde as pernas deixam.', usado: true },
  { id: 'bike_eletrica', nome: 'bicicleta elétrica', categoria: 'bicicleta', preco: 5500, usoMensal: 30, taxaAnual: 0, idadeMin: 16, cnh: false, lugares: 1, conforto: 2, fragilidade: 0.8, descricao: 'Anda longe sem chegar suado. A bateria um dia cansa.', usado: true },
  { id: 'moto_pequena', nome: 'moto pequena', categoria: 'moto', preco: 19000, usoMensal: 200, taxaAnual: 0.035, idadeMin: 18, cnh: true, lugares: 2, conforto: 2, fragilidade: 0.9, descricao: 'Econômica, fura o trânsito. Ferramenta de trabalho de muita gente — e arriscada.', usado: true },
  { id: 'moto_media', nome: 'moto média', categoria: 'moto', preco: 34000, usoMensal: 280, taxaAnual: 0.04, idadeMin: 18, cnh: true, lugares: 2, conforto: 3, fragilidade: 0.9, descricao: 'Aguenta estrada e garupa.', usado: true },
  { id: 'carro_compacto', nome: 'carro compacto', categoria: 'carro', preco: 85000, usoMensal: 520, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 2, fragilidade: 1, descricao: 'O carro de entrada: simples, econômico, apertado na viagem.', usado: true },
  { id: 'carro_sedan', nome: 'sedã médio', categoria: 'carro', preco: 140000, usoMensal: 650, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 3, fragilidade: 0.9, descricao: 'Porta-malas grande, estrada confortável.', usado: true },
  { id: 'carro_suv', nome: 'SUV compacto', categoria: 'carro', preco: 160000, usoMensal: 720, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 4, fragilidade: 1, descricao: 'Alto, espaçoso, bom para a família.', usado: true },
  { id: 'carro_suv_grande', nome: 'SUV grande', categoria: 'carro', preco: 270000, usoMensal: 950, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 7, conforto: 4, fragilidade: 1.1, descricao: 'Sete lugares, estrada de terra, conta de posto alta.', usado: true },
  { id: 'carro_luxo', nome: 'carro de luxo', categoria: 'carro', preco: 420000, usoMensal: 1400, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 5, fragilidade: 1.2, descricao: 'Chama atenção — boa e má. Peça cara, oficina especializada.', usado: true }
];

/** Modelos antigos (saves até v9) → modelos de hoje. */
export const VEICULO_ANTIGO: Record<string, { id: string; usado: boolean }> = {
  moto_usada: { id: 'moto_pequena', usado: true },
  moto_nova: { id: 'moto_pequena', usado: false },
  carro_usado: { id: 'carro_compacto', usado: true },
  carro_novo: { id: 'carro_compacto', usado: false }
};

export interface ModeloMoradia {
  id: string;
  /** Propriedade rural (terra para produzir): não entra nas ofertas da cidade. */
  rural?: boolean;
  nome: string;
  padrao: number;
  quartos: number;
  /** Multiplicador sobre o aluguel de referência da cidade (dois quartos = 1). */
  fatorAluguel: number;
  /** Valor de compra de referência (cidade de custo 1,0). */
  preco: number;
  condominio: number;
  /** Casa (com quintal) ou apartamento/kitnet (regras do prédio). */
  casa: boolean;
  descricao: string;
}

export const MORADIAS: readonly ModeloMoradia[] = [
  { id: 'republica', nome: 'quarto numa república', padrao: 2, quartos: 1, fatorAluguel: 0.33, preco: 0, condominio: 0, casa: false, descricao: 'Divide cozinha, banheiro e contas com mais gente.' },
  { id: 'casa_simples', nome: 'casa simples', padrao: 1, quartos: 2, fatorAluguel: 0.45, preco: 135000, condominio: 0, casa: true, descricao: 'Longe do centro, barata, às vezes precária.' },
  { id: 'kitnet', nome: 'kitnet', padrao: 2, quartos: 1, fatorAluguel: 0.58, preco: 170000, condominio: 180, casa: false, descricao: 'Um cômodo e um banheiro. Para uma pessoa, talvez duas.' },
  { id: 'apto_1q', nome: 'apartamento de um quarto', padrao: 3, quartos: 1, fatorAluguel: 0.78, preco: 250000, condominio: 350, casa: false, descricao: 'Sala, quarto, cozinha. Bom para uma pessoa ou um casal.' },
  { id: 'apto_2q', nome: 'apartamento de dois quartos', padrao: 3, quartos: 2, fatorAluguel: 1, preco: 320000, condominio: 450, casa: false, descricao: 'Cabe um casal e uma criança.' },
  { id: 'casa_2q', nome: 'casa de dois quartos', padrao: 3, quartos: 2, fatorAluguel: 0.9, preco: 300000, condominio: 0, casa: true, descricao: 'Garagem, um quintal pequeno.' },
  { id: 'apto_3q', nome: 'apartamento de três quartos', padrao: 4, quartos: 3, fatorAluguel: 1.45, preco: 520000, condominio: 750, casa: false, descricao: 'Um quarto para cada filho, varanda.' },
  { id: 'casa_3q', nome: 'casa de três quartos', padrao: 4, quartos: 3, fatorAluguel: 1.5, preco: 540000, condominio: 0, casa: true, descricao: 'Quintal, espaço para família.' },
  { id: 'casa_grande', nome: 'casa grande', padrao: 5, quartos: 4, fatorAluguel: 2.4, preco: 980000, condominio: 0, casa: true, descricao: 'Quatro quartos, área de churrasco, espaço de sobra.' },
  { id: 'sitio', nome: 'sítio', padrao: 2, quartos: 3, fatorAluguel: 0.5, preco: 240000, condominio: 0, casa: true, rural: true, descricao: 'Casa simples e uns hectares de terra: dá para morar e produzir.' },
  { id: 'alto_padrao', nome: 'apartamento de alto padrão', padrao: 5, quartos: 3, fatorAluguel: 2.9, preco: 1400000, condominio: 1600, casa: false, descricao: 'Portaria, piscina, bairro nobre.' }
];

export const modeloVeiculo = (id: string) => VEICULOS.find(m => m.id === id) ?? VEICULOS.find(m => m.id === VEICULO_ANTIGO[id]?.id) ?? VEICULOS[4];
export const modeloMoradia = (id: string) => MORADIAS.find(m => m.id === id) ?? MORADIAS[4];

/** Preço de imóvel numa cidade: moradia é mais sensível ao custo local. */
export const precoImovel = (m: ModeloMoradia, custoLocal: number) => Math.round(m.preco * Math.pow(custoLocal, 1.7) / 1000) * 1000;

/** Um veículo usado de `anos` vale quanto do novo (antes do estado de conservação). */
export function depreciacao(m: ModeloVeiculo, anos: number): number {
  if (anos <= 0) return 1;
  const primeiro = m.categoria === 'bicicleta' ? 0.7 : 0.82;
  return Math.max(m.categoria === 'bicicleta' ? 0.15 : 0.18, primeiro * Math.pow(m.categoria === 'bicicleta' ? 0.85 : 0.91, anos - 1));
}
