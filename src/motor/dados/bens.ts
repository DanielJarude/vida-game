/**
 * Bens e moradias. Cada coisa que se possui custa para manter, e cada uma
 * muda algo na vida: carro dá mobilidade (e IPVA, seguro, combustível,
 * oficina), imóvel próprio tira o aluguel (e traz IPTU, condomínio, reforma).
 *
 * Veículos em dois níveis: a CLASSE (compacto, SUV, moto pequena...) diz o
 * que o bem faz na vida — levar a família, aguentar a estrada, caber no
 * orçamento, quanto custa rodar e consertar — e a VERSÃO é o modelo
 * concreto da loja, com marca e modelo reais e o seu preço. Os nomes são só
 * texto factual: nada de logotipo, nada de patrocínio. Preços em reais de
 * 2026, coerentes com a economia do jogo (não acompanham a tabela do mês).
 * Cidade de custo 1,0.
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
  /** Oficina mais cara (peça importada, mão de obra especializada): multiplica o conserto. */
  fatorConserto: number;
  /** Quão comum a classe é no mercado de usados (peso no sorteio dos anúncios). */
  pesoUsado: number;
  /** Tem bateria de tração (bicicleta elétrica): pode dar problema de bateria. */
  eletrica?: boolean;
}

/** Classes de veículo (os ids ficam: estão nos saves e em toda a simulação). */
export const VEICULOS: readonly ModeloVeiculo[] = [
  { id: 'bike', nome: 'bicicleta', categoria: 'bicicleta', preco: 1200, usoMensal: 15, taxaAnual: 0, idadeMin: 8, cnh: false, lugares: 1, conforto: 1, fragilidade: 0.5, descricao: 'Sem combustível, sem IPVA. Vai até onde as pernas deixam.', usado: true, fatorConserto: 1, pesoUsado: 1 },
  { id: 'bike_eletrica', nome: 'bicicleta elétrica', categoria: 'bicicleta', preco: 5500, usoMensal: 30, taxaAnual: 0, idadeMin: 16, cnh: false, lugares: 1, conforto: 2, fragilidade: 0.8, descricao: 'Anda longe sem chegar suado. A bateria um dia cansa.', usado: true, fatorConserto: 1, pesoUsado: 0.6, eletrica: true },
  { id: 'moto_pequena', nome: 'moto pequena', categoria: 'moto', preco: 19000, usoMensal: 200, taxaAnual: 0.035, idadeMin: 18, cnh: true, lugares: 2, conforto: 2, fragilidade: 0.9, descricao: 'Econômica, fura o trânsito. Ferramenta de trabalho de muita gente — e arriscada.', usado: true, fatorConserto: 1, pesoUsado: 3 },
  { id: 'moto_media', nome: 'moto média', categoria: 'moto', preco: 34000, usoMensal: 280, taxaAnual: 0.04, idadeMin: 18, cnh: true, lugares: 2, conforto: 3, fragilidade: 0.9, descricao: 'Aguenta estrada e garupa.', usado: true, fatorConserto: 1, pesoUsado: 1.5 },
  { id: 'carro_compacto', nome: 'carro compacto', categoria: 'carro', preco: 85000, usoMensal: 520, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 2, fragilidade: 1, descricao: 'O carro de entrada: simples, econômico, apertado na viagem.', usado: true, fatorConserto: 1, pesoUsado: 4 },
  { id: 'carro_sedan', nome: 'sedã médio', categoria: 'carro', preco: 140000, usoMensal: 650, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 3, fragilidade: 0.9, descricao: 'Porta-malas grande, estrada confortável.', usado: true, fatorConserto: 1.2, pesoUsado: 2.5 },
  { id: 'carro_suv', nome: 'SUV compacto', categoria: 'carro', preco: 160000, usoMensal: 720, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 4, fragilidade: 1, descricao: 'Alto, espaçoso, bom para a família.', usado: true, fatorConserto: 1.2, pesoUsado: 2 },
  { id: 'carro_suv_grande', nome: 'SUV grande', categoria: 'carro', preco: 270000, usoMensal: 950, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 7, conforto: 4, fragilidade: 1.1, descricao: 'Sete lugares, estrada de terra, conta de posto alta.', usado: true, fatorConserto: 1.4, pesoUsado: 1 },
  { id: 'carro_luxo', nome: 'carro de luxo', categoria: 'carro', preco: 420000, usoMensal: 1400, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 5, fragilidade: 1.2, descricao: 'Chama atenção — boa e má. Peça cara, oficina especializada.', usado: true, fatorConserto: 2.4, pesoUsado: 0.5 }
];

/** Faixa de preço dentro da categoria (carros, motos, bicicletas). */
export type FaixaVeiculo = 'economica' | 'intermediaria' | 'alta';

export const PALAVRA_FAIXA: Record<FaixaVeiculo, string> = { economica: 'de entrada', intermediaria: 'intermediário', alta: 'topo de linha' };

/**
 * Uma versão concreta à venda: marca e modelo reais (texto factual), com o
 * seu preço de zero quilômetro. O resto (IPVA, seguro, idade mínima, CNH,
 * fragilidade, oficina) vem da classe; a versão só ajusta levemente o preço,
 * o custo de rodar e, numa picape, os lugares.
 */
export interface VersaoVeiculo {
  id: string;
  /** A classe (id de `VEICULOS`). */
  classe: string;
  marca: string;
  modelo: string;
  /** Acabamento/motor, só para a vitrine (não entra no nome das frases). */
  acabamento?: string;
  /** A classe em palavras curtas: "compacto", "SUV", "moto 160 cc". */
  dica: string;
  faixa: FaixaVeiculo;
  /** Zero quilômetro, cidade de custo 1,0. */
  preco: number;
  /** "o Fiat Mobi", "a Honda Biz". */
  artigo: 'o' | 'a';
  /** Quão comum é no mercado de usados, dentro da classe. */
  pesoUsado: number;
  /** Ajuste do custo mensal de rodar (senão, o da classe). */
  usoMensal?: number;
  /** Ajuste dos lugares (picape de cinco lugares na classe dos grandes). */
  lugares?: number;
  /** Ajuste da descrição da classe. */
  descricao?: string;
}

export const VERSOES_VEICULO: readonly VersaoVeiculo[] = [
  // Bicicletas
  { id: 'caloi_andes', classe: 'bike', marca: 'Caloi', modelo: 'Andes', acabamento: 'aro 26, 21 marchas', dica: 'bicicleta urbana', faixa: 'economica', preco: 950, artigo: 'a', pesoUsado: 3 },
  { id: 'caloi_vulcan', classe: 'bike', marca: 'Caloi', modelo: 'Vulcan', acabamento: 'aro 29', dica: 'bicicleta de trilha', faixa: 'economica', preco: 1450, artigo: 'a', pesoUsado: 2 },
  { id: 'oggi_hacker', classe: 'bike', marca: 'Oggi', modelo: 'Hacker Sport', acabamento: 'aro 29, freio a disco', dica: 'mountain bike', faixa: 'intermediaria', preco: 2800, artigo: 'a', pesoUsado: 1.5 },
  { id: 'sense_fun', classe: 'bike', marca: 'Sense', modelo: 'Fun Comp', acabamento: 'aro 29, suspensão a ar', dica: 'mountain bike', faixa: 'intermediaria', preco: 4200, artigo: 'a', pesoUsado: 0.8 },
  { id: 'vela_2', classe: 'bike_eletrica', marca: 'Vela', modelo: '2', acabamento: 'urbana', dica: 'bicicleta elétrica', faixa: 'intermediaria', preco: 5400, artigo: 'a', pesoUsado: 1.2 },
  { id: 'caloi_evibe', classe: 'bike_eletrica', marca: 'Caloi', modelo: 'E-Vibe Easy Rider', dica: 'bicicleta elétrica', faixa: 'alta', preco: 8200, artigo: 'a', pesoUsado: 1 },
  { id: 'sense_impulse', classe: 'bike_eletrica', marca: 'Sense', modelo: 'Impulse E-Trail', dica: 'bicicleta elétrica de trilha', faixa: 'alta', preco: 14500, artigo: 'a', pesoUsado: 0.5, usoMensal: 40 },
  // Motos
  { id: 'honda_pop', classe: 'moto_pequena', marca: 'Honda', modelo: 'Pop 110i', dica: 'moto 110 cc', faixa: 'economica', preco: 11900, artigo: 'a', pesoUsado: 1.5, usoMensal: 170 },
  { id: 'haojue_dk150', classe: 'moto_pequena', marca: 'Haojue', modelo: 'DK 150', dica: 'moto 150 cc', faixa: 'economica', preco: 14900, artigo: 'a', pesoUsado: 0.6 },
  { id: 'honda_biz',classe: 'moto_pequena', marca: 'Honda', modelo: 'Biz 125', dica: 'moto 125 cc', faixa: 'economica', preco: 15900, artigo: 'a', pesoUsado: 1.5, usoMensal: 180 },
  { id: 'yamaha_factor', classe: 'moto_pequena', marca: 'Yamaha', modelo: 'Factor 150', dica: 'moto 150 cc', faixa: 'intermediaria', preco: 17600, artigo: 'a', pesoUsado: 1.5 },
  { id: 'honda_cg160', classe: 'moto_pequena', marca: 'Honda', modelo: 'CG 160 Fan', dica: 'moto 160 cc', faixa: 'intermediaria', preco: 18900, artigo: 'a', pesoUsado: 3 },
  { id: 'honda_bros', classe: 'moto_pequena', marca: 'Honda', modelo: 'NXR 160 Bros', dica: 'moto 160 cc de terra e asfalto', faixa: 'intermediaria', preco: 22500, artigo: 'a', pesoUsado: 1 },
  { id: 'royal_enfield_hunter', classe: 'moto_media', marca: 'Royal Enfield', modelo: 'Hunter 350', dica: 'moto 350 cc clássica', faixa: 'intermediaria', preco: 23900, artigo: 'a', pesoUsado: 0.5 },
  { id: 'yamaha_fazer',classe: 'moto_media', marca: 'Yamaha', modelo: 'Fazer FZ25', dica: 'moto 250 cc', faixa: 'intermediaria', preco: 24900, artigo: 'a', pesoUsado: 1.5, usoMensal: 260 },
  { id: 'honda_cb300f', classe: 'moto_media', marca: 'Honda', modelo: 'CB 300F Twister', dica: 'moto 300 cc', faixa: 'intermediaria', preco: 25900, artigo: 'a', pesoUsado: 1.5, usoMensal: 260 },
  { id: 'honda_sahara', classe: 'moto_media', marca: 'Honda', modelo: 'XRE 300 Sahara', dica: 'moto 300 cc trail', faixa: 'alta', preco: 33500, artigo: 'a', pesoUsado: 1 },
  { id: 'yamaha_mt03', classe: 'moto_media', marca: 'Yamaha', modelo: 'MT-03', dica: 'moto 321 cc', faixa: 'alta', preco: 37500, artigo: 'a', pesoUsado: 0.7, usoMensal: 300 },
  // Carros compactos
  { id: 'renault_kwid', classe: 'carro_compacto', marca: 'Renault', modelo: 'Kwid', acabamento: 'Zen 1.0', dica: 'compacto', faixa: 'economica', preco: 72900, artigo: 'o', pesoUsado: 2, usoMensal: 470 },
  { id: 'fiat_mobi', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Mobi', acabamento: 'Like 1.0', dica: 'compacto', faixa: 'economica', preco: 76500, artigo: 'o', pesoUsado: 2.5, usoMensal: 480 },
  { id: 'citroen_c3', classe: 'carro_compacto', marca: 'Citroën', modelo: 'C3', acabamento: 'Live 1.0', dica: 'compacto', faixa: 'economica', preco: 81900, artigo: 'o', pesoUsado: 1 },
  { id: 'fiat_argo', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Argo', acabamento: 'Drive 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 89900, artigo: 'o', pesoUsado: 2 },
  { id: 'vw_polo', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Polo', acabamento: 'Track 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 91500, artigo: 'o', pesoUsado: 2.5 },
  { id: 'hyundai_hb20', classe: 'carro_compacto', marca: 'Hyundai', modelo: 'HB20', acabamento: 'Comfort 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 94900, artigo: 'o', pesoUsado: 3 },
  { id: 'chevrolet_onix', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Onix', acabamento: 'LT 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 97500, artigo: 'o', pesoUsado: 3.5 },
  // Sedãs
  { id: 'chevrolet_onix_plus', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Onix Plus', acabamento: 'Premier 1.0 turbo', dica: 'sedã compacto', faixa: 'intermediaria', preco: 124900, artigo: 'o', pesoUsado: 2.5, usoMensal: 600 },
  { id: 'honda_city', classe: 'carro_sedan', marca: 'Honda', modelo: 'City', acabamento: 'EXL 1.5', dica: 'sedã', faixa: 'intermediaria', preco: 139900, artigo: 'o', pesoUsado: 1.2 },
  { id: 'vw_virtus', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Virtus', acabamento: 'Highline 1.4 turbo', dica: 'sedã', faixa: 'intermediaria', preco: 146900, artigo: 'o', pesoUsado: 1.5 },
  { id: 'toyota_corolla', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Corolla', acabamento: 'XEi 2.0', dica: 'sedã médio', faixa: 'alta', preco: 179900, artigo: 'o', pesoUsado: 2 },
  { id: 'honda_civic', classe: 'carro_sedan', marca: 'Honda', modelo: 'Civic', acabamento: 'Advanced híbrido', dica: 'sedã médio híbrido', faixa: 'alta', preco: 265000, artigo: 'o', pesoUsado: 0.5, usoMensal: 560 },
  // SUVs
  { id: 'vw_nivus', classe: 'carro_suv', marca: 'Volkswagen', modelo: 'Nivus', acabamento: 'Comfortline 1.0 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 134900, artigo: 'o', pesoUsado: 1.5, usoMensal: 660 },
  { id: 'hyundai_creta', classe: 'carro_suv', marca: 'Hyundai', modelo: 'Creta', acabamento: 'Comfort 1.0 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 144900, artigo: 'o', pesoUsado: 2 },
  { id: 'jeep_renegade', classe: 'carro_suv', marca: 'Jeep', modelo: 'Renegade', acabamento: 'Longitude 1.3 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 152900, artigo: 'o', pesoUsado: 2 },
  { id: 'chevrolet_tracker', classe: 'carro_suv', marca: 'Chevrolet', modelo: 'Tracker', acabamento: 'Premier 1.2 turbo', dica: 'SUV compacto', faixa: 'alta', preco: 168900, artigo: 'o', pesoUsado: 1.5 },
  { id: 'toyota_corolla_cross', classe: 'carro_suv', marca: 'Toyota', modelo: 'Corolla Cross', acabamento: 'XRE 2.0', dica: 'SUV médio', faixa: 'alta', preco: 189900, artigo: 'o', pesoUsado: 1 },
  { id: 'jeep_compass', classe: 'carro_suv', marca: 'Jeep', modelo: 'Compass', acabamento: 'Longitude 1.3 turbo', dica: 'SUV médio', faixa: 'alta', preco: 214900, artigo: 'o', pesoUsado: 1.2, usoMensal: 780 },
  // Grandes: sete lugares e picapes
  { id: 'jeep_commander', classe: 'carro_suv_grande', marca: 'Jeep', modelo: 'Commander', acabamento: 'Longitude 1.3 turbo', dica: 'SUV de sete lugares', faixa: 'alta', preco: 249900, artigo: 'o', pesoUsado: 1, usoMensal: 880 },
  { id: 'chevrolet_s10', classe: 'carro_suv_grande', marca: 'Chevrolet', modelo: 'S10', acabamento: 'LTZ 2.8 diesel', dica: 'picape média', faixa: 'alta', preco: 262900, artigo: 'a', pesoUsado: 1, lugares: 5, descricao: 'Caçamba, diesel, estrada de terra. Cinco lugares.' },
  { id: 'toyota_hilux', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'Hilux', acabamento: 'SRV 2.8 diesel', dica: 'picape média', faixa: 'alta', preco: 279900, artigo: 'a', pesoUsado: 1.3, lugares: 5, descricao: 'Caçamba, diesel, estrada de terra. Cinco lugares.' },
  { id: 'toyota_sw4', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'SW4', acabamento: 'SRX 2.8 diesel', dica: 'SUV de sete lugares', faixa: 'alta', preco: 389900, artigo: 'o', pesoUsado: 0.6, usoMensal: 1050 },
  // Luxo
  { id: 'bmw_320i', classe: 'carro_luxo', marca: 'BMW', modelo: '320i', acabamento: 'M Sport', dica: 'sedã de luxo', faixa: 'alta', preco: 359900, artigo: 'o', pesoUsado: 1, usoMensal: 1250 },
  { id: 'mercedes_c300', classe: 'carro_luxo', marca: 'Mercedes-Benz', modelo: 'C 300', acabamento: 'AMG Line', dica: 'sedã de luxo', faixa: 'alta', preco: 419900, artigo: 'o', pesoUsado: 0.8 },
  { id: 'volvo_xc60', classe: 'carro_luxo', marca: 'Volvo', modelo: 'XC60', acabamento: 'T8 híbrido plug-in', dica: 'SUV de luxo híbrido', faixa: 'alta', preco: 449900, artigo: 'o', pesoUsado: 0.5, usoMensal: 1100 },
  { id: 'porsche_macan', classe: 'carro_luxo', marca: 'Porsche', modelo: 'Macan', dica: 'SUV esportivo', faixa: 'alta', preco: 629900, artigo: 'o', pesoUsado: 0.3, usoMensal: 1800 }
];

export const versaoVeiculo = (id: string | undefined) => (id ? VERSOES_VEICULO.find(x => x.id === id) : undefined);
export const versoesDaClasse = (classe: string) => VERSOES_VEICULO.filter(x => x.classe === classe);
/** "Fiat Mobi", "Honda CG 160 Fan", "Vela 2". */
export const nomeDaVersao = (x: VersaoVeiculo) => `${x.marca} ${x.modelo}`;

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
