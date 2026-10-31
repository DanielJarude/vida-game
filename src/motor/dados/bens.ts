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

export type CategoriaVeiculo = 'bicicleta' | 'moto' | 'carro' | 'embarcacao' | 'aeronave';

/** Em palavras (a loja, o filtro, a frase). */
export const NOME_CATEGORIA: Record<CategoriaVeiculo, { um: string; varios: string }> = {
  bicicleta: { um: 'bicicleta', varios: 'Bicicletas' }, moto: { um: 'moto', varios: 'Motos' }, carro: { um: 'carro', varios: 'Carros' },
  embarcacao: { um: 'embarcação', varios: 'Embarcações' }, aeronave: { um: 'aeronave', varios: 'Aeronaves' }
};

/**
 * A forma de cada veículo (o desenho, a leitura): um hatch não é uma picape,
 * uma scooter não é uma moto de trilha. Derivada da versão (ou dita nela).
 */
export type FormaVeiculo =
  | 'compacto' | 'hatch' | 'seda' | 'suv' | 'suv_medio' | 'suv_grande' | 'picape' | 'esportivo'
  | 'cub' | 'scooter' | 'street' | 'esportiva' | 'cruiser' | 'trail'
  | 'urbana' | 'estrada' | 'mtb' | 'eletrica'
  | 'jetski' | 'lancha' | 'veleiro' | 'iate'
  | 'ultraleve' | 'monomotor' | 'asa_baixa' | 'bimotor' | 'jato' | 'helicoptero';

/** Habilitação para operar (separada da posse: ter um barco não é saber pilotar um). */
export type Habilitacao = 'cnh' | 'nautica' | 'piloto' | 'multimotor';
export const NOME_HABILITACAO: Record<Habilitacao, string> = { cnh: 'carteira de motorista', nautica: 'habilitação náutica', piloto: 'licença de piloto', multimotor: 'habilitação de multimotor' };

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
  /** Operar pede outra habilitação (barco, avião): quem não tem, contrata quem tenha. */
  habilitacao?: Exclude<Habilitacao, 'cnh'>;
  /** Raro e contextual: onde se vende (perto da água, cidade com aeroclube). */
  raro?: boolean;
  /**
   * Tripulação contratada (o jato): custo mensal FIXO de quem o opera (dois
   * pilotos com a habilitação do tipo), pago enquanto o avião não está parado.
   * Quem tem, não pilota — e não paga piloto avulso a cada voo.
   */
  tripulacao?: number;
  /** Quem vende pede patrimônio para manter (o jato): abaixo disso, a venda não sai. */
  patrimonioMin?: number;
  /**
   * REWORK 12: o segmento fora do comum. `exotico` (superesportivo, altíssimo luxo): vende-se na garagem de
   * colecionador, deprecia forte nos primeiros anos e a oficina é de marca. `classico`: só existe usado — o valor
   * segue o mercado de clássicos e o estado da peça (pode subir; não há garantia).
   */
  segmento?: 'exotico' | 'classico';
}

/**
 * REWORK 12: onde um modelo é vendido. Sem a lista, no mundo inteiro. O Kwid, o Mobi e a CG 160 são da América
 * do Sul; a F-150 e o Camry, da América do Norte; o Sandero e o Clio, da Europa e da África.
 */
export type MercadoVeiculo = 'america_sul' | 'america_norte' | 'america_central_caribe' | 'europa' | 'africa' | 'asia' | 'oceania' | 'BR';

/** Classes de veículo (os ids ficam: estão nos saves e em toda a simulação). */
export const VEICULOS: readonly ModeloVeiculo[] = [
  { id: 'bike', nome: 'bicicleta', categoria: 'bicicleta', preco: 1200, usoMensal: 15, taxaAnual: 0, idadeMin: 8, cnh: false, lugares: 1, conforto: 1, fragilidade: 0.5, descricao: 'Sem combustível, sem imposto. Vai até onde as pernas deixam.', usado: true, fatorConserto: 1, pesoUsado: 1 },
  { id: 'bike_eletrica', nome: 'bicicleta elétrica', categoria: 'bicicleta', preco: 5500, usoMensal: 30, taxaAnual: 0, idadeMin: 16, cnh: false, lugares: 1, conforto: 2, fragilidade: 0.8, descricao: 'Anda longe sem chegar suado. A bateria um dia cansa.', usado: true, fatorConserto: 1, pesoUsado: 0.6, eletrica: true },
  { id: 'moto_pequena', nome: 'moto pequena', categoria: 'moto', preco: 19000, usoMensal: 200, taxaAnual: 0.035, idadeMin: 18, cnh: true, lugares: 2, conforto: 2, fragilidade: 0.9, descricao: 'Econômica, fura o trânsito. Ferramenta de trabalho de muita gente — e arriscada.', usado: true, fatorConserto: 1, pesoUsado: 3 },
  { id: 'moto_media', nome: 'moto média', categoria: 'moto', preco: 34000, usoMensal: 280, taxaAnual: 0.04, idadeMin: 18, cnh: true, lugares: 2, conforto: 3, fragilidade: 0.9, descricao: 'Aguenta estrada e garupa.', usado: true, fatorConserto: 1, pesoUsado: 1.5 },
  { id: 'carro_compacto', nome: 'carro compacto', categoria: 'carro', preco: 85000, usoMensal: 520, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 2, fragilidade: 1, descricao: 'O carro de entrada: simples, econômico, apertado na viagem.', usado: true, fatorConserto: 1, pesoUsado: 4 },
  { id: 'carro_sedan', nome: 'sedã médio', categoria: 'carro', preco: 140000, usoMensal: 650, taxaAnual: 0.075, idadeMin: 18, cnh: true, lugares: 5, conforto: 3, fragilidade: 0.9, descricao: 'Porta-malas grande, estrada confortável.', usado: true, fatorConserto: 1.2, pesoUsado: 2.5 },
  { id: 'carro_suv', nome: 'SUV compacto', categoria: 'carro', preco: 160000, usoMensal: 720, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 4, fragilidade: 1, descricao: 'Alto, espaçoso, bom para a família.', usado: true, fatorConserto: 1.2, pesoUsado: 2 },
  { id: 'carro_suv_grande', nome: 'SUV grande', categoria: 'carro', preco: 270000, usoMensal: 950, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 7, conforto: 4, fragilidade: 1.1, descricao: 'Sete lugares, estrada de terra, conta de posto alta.', usado: true, fatorConserto: 1.4, pesoUsado: 1 },
  { id: 'carro_luxo', nome: 'carro de luxo', categoria: 'carro', preco: 420000, usoMensal: 1400, taxaAnual: 0.08, idadeMin: 18, cnh: true, lugares: 5, conforto: 5, fragilidade: 1.2, descricao: 'Chama atenção — boa e má. Peça cara, oficina especializada.', usado: true, fatorConserto: 2.4, pesoUsado: 0.5 },
  // Raros: na água e no ar. Caros para comprar e MAIS para manter (marina, hangar, seguro, revisão obrigatória).
  { id: 'jetski', nome: 'moto aquática', categoria: 'embarcacao', preco: 78000, usoMensal: 900, taxaAnual: 0.04, idadeMin: 18, cnh: false, habilitacao: 'nautica', raro: true, lugares: 2, conforto: 3, fragilidade: 1.1, descricao: 'Barulho, sal e sol. Guarda-se numa marina (e paga-se por isso).', usado: true, fatorConserto: 1.6, pesoUsado: 1 },
  { id: 'lancha', nome: 'lancha', categoria: 'embarcacao', preco: 420000, usoMensal: 4200, taxaAnual: 0.045, idadeMin: 18, cnh: false, habilitacao: 'nautica', raro: true, lugares: 8, conforto: 5, fragilidade: 1.2, descricao: 'Um dia no mar com gente querida. Marina, combustível, marinheiro de vez em quando: a conta não para.', usado: true, fatorConserto: 2.6, pesoUsado: 0.8 },
  { id: 'veleiro', nome: 'veleiro', categoria: 'embarcacao', preco: 360000, usoMensal: 2600, taxaAnual: 0.04, idadeMin: 18, cnh: false, habilitacao: 'nautica', raro: true, lugares: 6, conforto: 4, fragilidade: 1, descricao: 'Anda com o vento: pouco combustível, muito aprendizado.', usado: true, fatorConserto: 2.2, pesoUsado: 0.5 },
  { id: 'ultraleve', nome: 'ultraleve', categoria: 'aeronave', preco: 390000, usoMensal: 3200, taxaAnual: 0.05, idadeMin: 18, cnh: false, habilitacao: 'piloto', raro: true, lugares: 2, conforto: 3, fragilidade: 1.2, descricao: 'Voar baixo, de manhã cedo. Hangar, combustível e revisões pesam.', usado: true, fatorConserto: 2.8, pesoUsado: 0.6 },
  { id: 'monomotor', nome: 'avião monomotor', categoria: 'aeronave', preco: 2400000, usoMensal: 12000, taxaAnual: 0.05, idadeMin: 18, cnh: false, habilitacao: 'piloto', raro: true, lugares: 4, conforto: 5, fragilidade: 1.1, descricao: 'Quatro lugares e o país inteiro ao alcance — com hangar, inspeção e uma conta de manutenção de empresa.', usado: true, fatorConserto: 3.2, pesoUsado: 0.4 },
  // Bimotor e jato (R$ de 2026, câmbio ~5,5): um bimotor a pistão novo custa de US$ 1,3 a 1,8 milhão; um jato executivo leve, de US$ 4,5 a 6 milhões.
  // O bimotor pede a habilitação de multimotor (além da licença de piloto); o jato voa com tripulação própria (dois pilotos, ~R$ 70 mil/mês com encargos)
  // e quem vende pede patrimônio para manter (só a operação passa de R$ 1,5 milhão por ano). Seguro e hangar pesam menos em % do valor, mais em reais.
  { id: 'bimotor', nome: 'avião bimotor', categoria: 'aeronave', preco: 7000000, usoMensal: 26000, taxaAnual: 0.035, idadeMin: 18, cnh: false, habilitacao: 'multimotor', raro: true, lugares: 6, conforto: 5, fragilidade: 1.1, descricao: 'Dois motores e seis lugares: chuva de frente, pista de fazenda, a margem de segurança de um motor a mais — e duas revisões de motor para pagar.', usado: true, fatorConserto: 3.6, pesoUsado: 0.25 },
  // REWORK 12 · o fora do comum. Superesportivo e altíssimo luxo: preço de catálogo no Brasil (com o imposto de
  // importação daqui), seguro caro, oficina da marca; quem vende é a garagem de colecionador das cidades grandes.
  { id: 'moto_grande', nome: 'moto grande', categoria: 'moto', preco: 95000, usoMensal: 520, taxaAnual: 0.045, idadeMin: 18, cnh: true, lugares: 2, conforto: 4, fragilidade: 1, descricao: 'Estrada longa, garupa confortável, peso de carro pequeno.', usado: true, fatorConserto: 1.6, pesoUsado: 0.4 },
  { id: 'superesportivo', nome: 'superesportivo', categoria: 'carro', segmento: 'exotico', preco: 3600000, usoMensal: 4800, taxaAnual: 0.055, idadeMin: 18, cnh: true, lugares: 2, conforto: 5, fragilidade: 1.3, descricao: 'Motor central, dois lugares, a rua inteira olhando. Pneu, freio e revisão a preço de carro popular.', usado: true, fatorConserto: 3, pesoUsado: 0.05 },
  { id: 'hiperluxo', nome: 'carro de altíssimo luxo', categoria: 'carro', segmento: 'exotico', preco: 6000000, usoMensal: 5200, taxaAnual: 0.045, idadeMin: 18, cnh: true, lugares: 5, conforto: 5, fragilidade: 1.1, descricao: 'Couro, silêncio, motorista opcional. Cada detalhe feito à mão — e cada conserto também.', usado: true, fatorConserto: 3, pesoUsado: 0.05 },
  { id: 'classico', nome: 'carro clássico', categoria: 'carro', segmento: 'classico', preco: 150000, usoMensal: 650, taxaAnual: 0.02, idadeMin: 18, cnh: true, lugares: 4, conforto: 2, fragilidade: 1.5, descricao: 'De outra época: sem ar, sem assistente, com cheiro de gasolina. Anda pouco e pede cuidado; vale pelo estado e pela história.', usado: true, fatorConserto: 1.8, pesoUsado: 0.05 },
  // REWORK 12.4: o iate (tripulação própria: capitão e marinheiro) e o helicóptero (pista nenhuma, heliponto e hangar).
  { id: 'iate', nome: 'iate', categoria: 'embarcacao', preco: 9500000, usoMensal: 38000, taxaAnual: 0.035, idadeMin: 18, cnh: false, raro: true, tripulacao: 32000, patrimonioMin: 25000000, lugares: 12, conforto: 5, fragilidade: 1.1, descricao: 'Cabines, cozinha, a tripulação na folha: uma casa que flutua e uma conta de marina de casa grande.', usado: true, fatorConserto: 3.4, pesoUsado: 0.15 },
  { id: 'helicoptero', nome: 'helicóptero', categoria: 'aeronave', preco: 5200000, usoMensal: 22000, taxaAnual: 0.045, idadeMin: 18, cnh: false, habilitacao: 'piloto', raro: true, patrimonioMin: 12000000, lugares: 4, conforto: 4, fragilidade: 1.25, descricao: 'Pousa no heliponto do prédio ou no gramado da fazenda. Hora de voo cara, inspeção rígida, piloto com licença de asas rotativas.', usado: true, fatorConserto: 3.8, pesoUsado: 0.2 },
  { id: 'jato', nome: 'jato executivo', categoria: 'aeronave', preco: 25000000, usoMensal: 65000, taxaAnual: 0.025, idadeMin: 18, cnh: false, raro: true, tripulacao: 70000, patrimonioMin: 40000000, lugares: 6, conforto: 5, fragilidade: 1, descricao: 'O país em duas horas, de qualquer aeroporto. Dois pilotos na folha, hangar, programa de manutenção por hora voada: uma empresa que só gasta.', usado: true, fatorConserto: 4, pesoUsado: 0.15 }
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
  /** A forma (o desenho); sem ela, derivada da dica (`formaDaVersao`). */
  forma?: FormaVeiculo;
  /** REWORK 12: onde se vende (sem a lista, em todo lugar). */
  mercados?: readonly MercadoVeiculo[];
  /** REWORK 12: clássico — o ano em que foi feito (não existe zero). */
  ano?: number;
  /** REWORK 12: edição limitada — quantas unidades existem (a raridade sustenta o valor; não o garante). */
  limitada?: number;
}

export const VERSOES_VEICULO: readonly VersaoVeiculo[] = [
  // Bicicletas
  { id: 'caloi_andes', classe: 'bike', marca: 'Caloi', modelo: 'Andes', acabamento: 'aro 26, 21 marchas', dica: 'bicicleta urbana', faixa: 'economica', preco: 950, artigo: 'a', pesoUsado: 3, mercados: ['BR'] },
  { id: 'caloi_vulcan', classe: 'bike', marca: 'Caloi', modelo: 'Vulcan', acabamento: 'aro 29', dica: 'bicicleta de trilha', faixa: 'economica', preco: 1450, artigo: 'a', pesoUsado: 2, mercados: ['BR'] },
  { id: 'oggi_hacker', classe: 'bike', marca: 'Oggi', modelo: 'Hacker Sport', acabamento: 'aro 29, freio a disco', dica: 'mountain bike', faixa: 'intermediaria', preco: 2800, artigo: 'a', pesoUsado: 1.5, mercados: ['BR'] },
  { id: 'sense_fun', classe: 'bike', marca: 'Sense', modelo: 'Fun Comp', acabamento: 'aro 29, suspensão a ar', dica: 'mountain bike', faixa: 'intermediaria', preco: 4200, artigo: 'a', pesoUsado: 0.8, mercados: ['BR'] },
  { id: 'vela_2', classe: 'bike_eletrica', marca: 'Vela', modelo: '2', acabamento: 'urbana', dica: 'bicicleta elétrica', faixa: 'intermediaria', preco: 5400, artigo: 'a', pesoUsado: 1.2, mercados: ['BR'] },
  { id: 'caloi_evibe', classe: 'bike_eletrica', marca: 'Caloi', modelo: 'E-Vibe Easy Rider', dica: 'bicicleta elétrica', faixa: 'alta', preco: 8200, artigo: 'a', pesoUsado: 1, mercados: ['BR'] },
  { id: 'sense_impulse', classe: 'bike_eletrica', marca: 'Sense', modelo: 'Impulse E-Trail', dica: 'bicicleta elétrica de trilha', faixa: 'alta', preco: 14500, artigo: 'a', pesoUsado: 0.5, usoMensal: 40, mercados: ['BR'] },
  // Motos
  { id: 'honda_pop', classe: 'moto_pequena', marca: 'Honda', modelo: 'Pop 110i', dica: 'moto 110 cc', faixa: 'economica', preco: 11900, artigo: 'a', pesoUsado: 1.5, usoMensal: 170, forma: 'cub', mercados: ['america_sul'] },
  { id: 'haojue_dk150', classe: 'moto_pequena', marca: 'Haojue', modelo: 'DK 150', dica: 'moto 150 cc', faixa: 'economica', preco: 14900, artigo: 'a', pesoUsado: 0.6, mercados: ['america_sul', 'asia'] },
  { id: 'honda_biz',classe: 'moto_pequena', marca: 'Honda', modelo: 'Biz 125', dica: 'moto 125 cc', faixa: 'economica', preco: 15900, artigo: 'a', pesoUsado: 1.5, usoMensal: 180, forma: 'cub', mercados: ['BR'] },
  { id: 'yamaha_factor', classe: 'moto_pequena', marca: 'Yamaha', modelo: 'Factor 150', dica: 'moto 150 cc', faixa: 'intermediaria', preco: 17600, artigo: 'a', pesoUsado: 1.5, mercados: ['BR'] },
  { id: 'honda_cg160', classe: 'moto_pequena', marca: 'Honda', modelo: 'CG 160 Fan', dica: 'moto 160 cc', faixa: 'intermediaria', preco: 18900, artigo: 'a', pesoUsado: 3, mercados: ['america_sul', 'america_central_caribe', 'africa'] },
  { id: 'honda_bros', classe: 'moto_pequena', marca: 'Honda', modelo: 'NXR 160 Bros', dica: 'moto 160 cc de terra e asfalto', faixa: 'intermediaria', preco: 22500, artigo: 'a', pesoUsado: 1, mercados: ['america_sul'] },
  { id: 'royal_enfield_hunter', classe: 'moto_media', marca: 'Royal Enfield', modelo: 'Hunter 350', dica: 'moto 350 cc clássica', faixa: 'intermediaria', preco: 23900, artigo: 'a', pesoUsado: 0.5 },
  { id: 'yamaha_fazer',classe: 'moto_media', marca: 'Yamaha', modelo: 'Fazer FZ25', dica: 'moto 250 cc', faixa: 'intermediaria', preco: 24900, artigo: 'a', pesoUsado: 1.5, usoMensal: 260, mercados: ['america_sul', 'asia', 'africa'] },
  { id: 'honda_cb300f', classe: 'moto_media', marca: 'Honda', modelo: 'CB 300F Twister', dica: 'moto 300 cc', faixa: 'intermediaria', preco: 25900, artigo: 'a', pesoUsado: 1.5, usoMensal: 260, mercados: ['america_sul', 'asia'] },
  { id: 'honda_sahara', classe: 'moto_media', marca: 'Honda', modelo: 'XRE 300 Sahara', dica: 'moto 300 cc trail', faixa: 'alta', preco: 33500, artigo: 'a', pesoUsado: 1, mercados: ['america_sul'] },
  { id: 'yamaha_mt03', classe: 'moto_media', marca: 'Yamaha', modelo: 'MT-03', dica: 'moto 321 cc', faixa: 'alta', preco: 37500, artigo: 'a', pesoUsado: 0.7, usoMensal: 300 },
  // Carros compactos
  { id: 'renault_kwid', classe: 'carro_compacto', marca: 'Renault', modelo: 'Kwid', acabamento: 'Zen 1.0', dica: 'compacto', faixa: 'economica', preco: 72900, artigo: 'o', pesoUsado: 2, usoMensal: 470, mercados: ['america_sul', 'asia'] },
  { id: 'fiat_mobi', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Mobi', acabamento: 'Like 1.0', dica: 'compacto', faixa: 'economica', preco: 76500, artigo: 'o', pesoUsado: 2.5, usoMensal: 480, mercados: ['BR'] },
  { id: 'citroen_c3', classe: 'carro_compacto', marca: 'Citroën', modelo: 'C3', acabamento: 'Live 1.0', dica: 'compacto', faixa: 'economica', preco: 81900, artigo: 'o', pesoUsado: 1, mercados: ['america_sul', 'asia', 'europa'] },
  { id: 'fiat_argo', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Argo', acabamento: 'Drive 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 89900, artigo: 'o', pesoUsado: 2, mercados: ['america_sul'] },
  { id: 'vw_polo', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Polo', acabamento: 'Track 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 91500, artigo: 'o', pesoUsado: 2.5 },
  { id: 'hyundai_hb20', classe: 'carro_compacto', marca: 'Hyundai', modelo: 'HB20', acabamento: 'Comfort 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 94900, artigo: 'o', pesoUsado: 3, mercados: ['BR'] },
  { id: 'chevrolet_onix', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Onix', acabamento: 'LT 1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 97500, artigo: 'o', pesoUsado: 3.5, mercados: ['america_sul', 'america_central_caribe'] },
  // Sedãs
  { id: 'chevrolet_onix_plus', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Onix Plus', acabamento: 'Premier 1.0 turbo', dica: 'sedã compacto', faixa: 'intermediaria', preco: 124900, artigo: 'o', pesoUsado: 2.5, usoMensal: 600, mercados: ['america_sul', 'america_central_caribe'] },
  { id: 'honda_city', classe: 'carro_sedan', marca: 'Honda', modelo: 'City', acabamento: 'EXL 1.5', dica: 'sedã', faixa: 'intermediaria', preco: 139900, artigo: 'o', pesoUsado: 1.2 },
  { id: 'vw_virtus', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Virtus', acabamento: 'Highline 1.4 turbo', dica: 'sedã', faixa: 'intermediaria', preco: 146900, artigo: 'o', pesoUsado: 1.5, mercados: ['america_sul', 'asia', 'africa'] },
  { id: 'toyota_corolla', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Corolla', acabamento: 'XEi 2.0', dica: 'sedã médio', faixa: 'alta', preco: 179900, artigo: 'o', pesoUsado: 2 },
  { id: 'honda_civic', classe: 'carro_sedan', marca: 'Honda', modelo: 'Civic', acabamento: 'Advanced híbrido', dica: 'sedã médio híbrido', faixa: 'alta', preco: 265000, artigo: 'o', pesoUsado: 0.5, usoMensal: 560 },
  // SUVs
  { id: 'vw_nivus', classe: 'carro_suv', marca: 'Volkswagen', modelo: 'Nivus', acabamento: 'Comfortline 1.0 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 134900, artigo: 'o', pesoUsado: 1.5, usoMensal: 660, mercados: ['america_sul'] },
  { id: 'hyundai_creta', classe: 'carro_suv', marca: 'Hyundai', modelo: 'Creta', acabamento: 'Comfort 1.0 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 144900, artigo: 'o', pesoUsado: 2, mercados: ['america_sul', 'asia', 'africa'] },
  { id: 'jeep_renegade', classe: 'carro_suv', marca: 'Jeep', modelo: 'Renegade', acabamento: 'Longitude 1.3 turbo', dica: 'SUV compacto', faixa: 'intermediaria', preco: 152900, artigo: 'o', pesoUsado: 2 },
  { id: 'chevrolet_tracker', classe: 'carro_suv', marca: 'Chevrolet', modelo: 'Tracker', acabamento: 'Premier 1.2 turbo', dica: 'SUV compacto', faixa: 'alta', preco: 168900, artigo: 'o', pesoUsado: 1.5, mercados: ['america_sul', 'america_central_caribe', 'asia'] },
  { id: 'toyota_corolla_cross', classe: 'carro_suv', marca: 'Toyota', modelo: 'Corolla Cross', acabamento: 'XRE 2.0', dica: 'SUV médio', faixa: 'alta', preco: 189900, artigo: 'o', pesoUsado: 1, forma: 'suv_medio' },
  { id: 'jeep_compass', classe: 'carro_suv', marca: 'Jeep', modelo: 'Compass', acabamento: 'Longitude 1.3 turbo', dica: 'SUV médio', faixa: 'alta', preco: 214900, artigo: 'o', pesoUsado: 1.2, usoMensal: 780, forma: 'suv_medio' },
  // Grandes: sete lugares e picapes
  { id: 'jeep_commander', classe: 'carro_suv_grande', marca: 'Jeep', modelo: 'Commander', acabamento: 'Longitude 1.3 turbo', dica: 'SUV de sete lugares', faixa: 'alta', preco: 249900, artigo: 'o', pesoUsado: 1, usoMensal: 880, forma: 'suv_grande', mercados: ['america_sul'] },
  { id: 'chevrolet_s10', classe: 'carro_suv_grande', marca: 'Chevrolet', modelo: 'S10', acabamento: 'LTZ 2.8 diesel', dica: 'picape média', faixa: 'alta', preco: 262900, artigo: 'a', pesoUsado: 1, lugares: 5, descricao: 'Caçamba, diesel, estrada de terra. Cinco lugares.', mercados: ['america_sul'] },
  { id: 'toyota_hilux', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'Hilux', acabamento: 'SRV 2.8 diesel', dica: 'picape média', faixa: 'alta', preco: 279900, artigo: 'a', pesoUsado: 1.3, lugares: 5, descricao: 'Caçamba, diesel, estrada de terra. Cinco lugares.', mercados: ['america_sul', 'america_central_caribe', 'africa', 'asia', 'oceania', 'europa'] },
  { id: 'toyota_sw4', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'SW4', acabamento: 'SRX 2.8 diesel', dica: 'SUV de sete lugares', faixa: 'alta', preco: 389900, artigo: 'o', pesoUsado: 0.6, usoMensal: 1050, forma: 'suv_grande', mercados: ['america_sul', 'africa', 'asia', 'oceania'] },
  // Luxo
  { id: 'bmw_320i', classe: 'carro_luxo', marca: 'BMW', modelo: '320i', acabamento: 'M Sport', dica: 'sedã de luxo', faixa: 'alta', preco: 359900, artigo: 'o', pesoUsado: 1, usoMensal: 1250 },
  { id: 'mercedes_c300', classe: 'carro_luxo', marca: 'Mercedes-Benz', modelo: 'C 300', acabamento: 'AMG Line', dica: 'sedã de luxo', faixa: 'alta', preco: 419900, artigo: 'o', pesoUsado: 0.8 },
  { id: 'volvo_xc60', classe: 'carro_luxo', marca: 'Volvo', modelo: 'XC60', acabamento: 'T8 híbrido plug-in', dica: 'SUV de luxo híbrido', faixa: 'alta', preco: 449900, artigo: 'o', pesoUsado: 0.5, usoMensal: 1100, forma: 'suv_medio' },
  { id: 'porsche_macan', classe: 'carro_luxo', marca: 'Porsche', modelo: 'Macan', dica: 'SUV esportivo', faixa: 'alta', preco: 629900, artigo: 'o', pesoUsado: 0.3, usoMensal: 1800, forma: 'suv' },
  { id: 'ford_mustang', classe: 'carro_luxo', marca: 'Ford', modelo: 'Mustang', acabamento: 'GT 5.0 V8', dica: 'esportivo', faixa: 'alta', preco: 549900, artigo: 'o', pesoUsado: 0.3, usoMensal: 1900, forma: 'esportivo', lugares: 4 },
  { id: 'porsche_911', classe: 'carro_luxo', marca: 'Porsche', modelo: '911', acabamento: 'Carrera', dica: 'esportivo', faixa: 'alta', preco: 1090000, artigo: 'o', pesoUsado: 0.15, usoMensal: 2400, forma: 'esportivo', lugares: 4 },
  // Mais motos e bicicletas (a scooter do dia a dia, a esportiva, a speed)
  { id: 'honda_pcx', classe: 'moto_pequena', marca: 'Honda', modelo: 'PCX 160', dica: 'scooter 160 cc', faixa: 'intermediaria', preco: 21900, artigo: 'a', pesoUsado: 1, forma: 'scooter' },
  { id: 'kawasaki_ninja400', classe: 'moto_media', marca: 'Kawasaki', modelo: 'Ninja 400', dica: 'moto esportiva 400 cc', faixa: 'alta', preco: 38900, artigo: 'a', pesoUsado: 0.5, usoMensal: 320, forma: 'esportiva' },
  { id: 'caloi_strada', classe: 'bike', marca: 'Caloi', modelo: 'Strada', acabamento: 'alumínio, 16 marchas', dica: 'bicicleta de estrada (speed)', faixa: 'intermediaria', preco: 3900, artigo: 'a', pesoUsado: 0.6, forma: 'estrada', mercados: ['BR'] },
  // Na água
  { id: 'seadoo_spark', classe: 'jetski', marca: 'Sea-Doo', modelo: 'Spark', dica: 'moto aquática', faixa: 'economica', preco: 69900, artigo: 'a', pesoUsado: 1, forma: 'jetski' },
  { id: 'yamaha_vx', classe: 'jetski', marca: 'Yamaha', modelo: 'VX Cruiser', dica: 'moto aquática para três', faixa: 'intermediaria', preco: 98900, artigo: 'a', pesoUsado: 0.8, forma: 'jetski' },
  { id: 'focker_242', classe: 'lancha', marca: 'Fibrafort', modelo: 'Focker 242', dica: 'lancha de 24 pés', faixa: 'intermediaria', preco: 389000, artigo: 'a', pesoUsado: 1, forma: 'lancha', mercados: ['BR'] },
  { id: 'schaefer_303', classe: 'lancha', marca: 'Schaefer', modelo: '303', dica: 'lancha de 30 pés, com cabine', faixa: 'alta', preco: 1250000, artigo: 'a', pesoUsado: 0.4, usoMensal: 7800, lugares: 10, forma: 'lancha', mercados: ['BR', 'america_sul'] },
  { id: 'delta_26', classe: 'veleiro', marca: 'Delta', modelo: '26', dica: 'veleiro de 26 pés', faixa: 'intermediaria', preco: 340000, artigo: 'o', pesoUsado: 0.6, forma: 'veleiro', mercados: ['BR'] },
  { id: 'fast_310', classe: 'veleiro', marca: 'Fast', modelo: '310', dica: 'veleiro de 31 pés, com cabine', faixa: 'alta', preco: 690000, artigo: 'o', pesoUsado: 0.3, usoMensal: 3800, forma: 'veleiro', mercados: ['BR'] },
  // No ar
  { id: 'inpaer_excel', classe: 'ultraleve', marca: 'Inpaer', modelo: 'Excel', dica: 'ultraleve de dois lugares', faixa: 'intermediaria', preco: 420000, artigo: 'o', pesoUsado: 0.6, forma: 'ultraleve', mercados: ['BR'] },
  { id: 'paradise_p1', classe: 'ultraleve', marca: 'Paradise', modelo: 'P1', dica: 'ultraleve de asa alta', faixa: 'economica', preco: 330000, artigo: 'o', pesoUsado: 0.8, forma: 'ultraleve', mercados: ['BR', 'america_sul'] },
  { id: 'cessna_172', classe: 'monomotor', marca: 'Cessna', modelo: '172 Skyhawk', dica: 'monomotor de quatro lugares', faixa: 'alta', preco: 2600000, artigo: 'o', pesoUsado: 0.5, forma: 'monomotor' },
  { id: 'piper_archer', classe: 'monomotor', marca: 'Piper', modelo: 'Archer', dica: 'monomotor de asa baixa, quatro lugares', faixa: 'alta', preco: 2300000, artigo: 'o', pesoUsado: 0.5, forma: 'asa_baixa' },
  { id: 'piper_seneca', classe: 'bimotor', marca: 'Piper', modelo: 'Seneca V', dica: 'bimotor de seis lugares', faixa: 'intermediaria', preco: 7200000, artigo: 'o', pesoUsado: 0.6, forma: 'bimotor' },
  { id: 'beech_baron', classe: 'bimotor', marca: 'Beechcraft', modelo: 'Baron G58', dica: 'bimotor de seis lugares', faixa: 'alta', preco: 9600000, artigo: 'o', pesoUsado: 0.4, usoMensal: 30000, forma: 'bimotor' },
  { id: 'azimut_60', classe: 'iate', marca: 'Azimut', modelo: '60 Flybridge', dica: 'iate de 60 pés', faixa: 'intermediaria', preco: 9500000, artigo: 'o', pesoUsado: 0.5, forma: 'iate' },
  { id: 'schaefer_v66', classe: 'iate', marca: 'Schaefer', modelo: 'V66', dica: 'iate de 66 pés', faixa: 'alta', preco: 12500000, artigo: 'o', pesoUsado: 0.4, usoMensal: 44000, forma: 'iate', mercados: ['BR', 'america_sul'] },
  { id: 'robinson_r44', classe: 'helicoptero', marca: 'Robinson', modelo: 'R44 Raven II', dica: 'helicóptero de quatro lugares', faixa: 'intermediaria', preco: 4200000, artigo: 'o', pesoUsado: 0.6, forma: 'helicoptero' },
  { id: 'bell_505', classe: 'helicoptero', marca: 'Bell', modelo: '505 Jet Ranger X', dica: 'helicóptero a turbina, cinco lugares', faixa: 'alta', preco: 9000000, artigo: 'o', pesoUsado: 0.4, usoMensal: 30000, lugares: 5, forma: 'helicoptero' },
  { id: 'embraer_phenom100', classe: 'jato', marca: 'Embraer', modelo: 'Phenom 100EV', dica: 'jato executivo leve', faixa: 'intermediaria', preco: 25000000, artigo: 'o', pesoUsado: 0.6, forma: 'jato' },
  { id: 'cessna_citation_m2', classe: 'jato', marca: 'Cessna', modelo: 'Citation M2 Gen2', dica: 'jato executivo leve', faixa: 'alta', preco: 33000000, artigo: 'o', pesoUsado: 0.4, usoMensal: 72000, forma: 'jato' },
  // REWORK 12 · o mercado de cada lugar. Preço = o de catálogo no Brasil (o que um igual custaria aqui, com o imposto
  // daqui); fora, `precos.fatorDeImportado` troca o imposto e converte. Os que não se vendem no Brasil: o preço
  // americano ou europeu levado ao Brasil (uma F-150 de US$ 40 mil ≈ R$ 306 mil aqui).
  { id: 'trek_marlin', classe: 'bike', marca: 'Trek', modelo: 'Marlin 5', dica: 'mountain bike', faixa: 'intermediaria', preco: 5400, artigo: 'a', pesoUsado: 1 },
  { id: 'giant_escape', classe: 'bike', marca: 'Giant', modelo: 'Escape 3', dica: 'bicicleta urbana', faixa: 'economica', preco: 4200, artigo: 'a', pesoUsado: 1.2 },
  { id: 'rockrider_st100', classe: 'bike', marca: 'Decathlon', modelo: 'Rockrider ST 100', dica: 'bicicleta de trilha', faixa: 'economica', preco: 2700, artigo: 'a', pesoUsado: 1.5 },
  { id: 'rad_city', classe: 'bike_eletrica', marca: 'Rad Power', modelo: 'RadCity', dica: 'bicicleta elétrica', faixa: 'intermediaria', preco: 13800, artigo: 'a', pesoUsado: 1, mercados: ['america_norte'] },
  { id: 'gazelle_ultimate', classe: 'bike_eletrica', marca: 'Gazelle', modelo: 'Ultimate C8', dica: 'bicicleta elétrica', faixa: 'alta', preco: 21900, artigo: 'a', pesoUsado: 1, mercados: ['europa'] },
  { id: 'honda_cb125f', classe: 'moto_pequena', marca: 'Honda', modelo: 'CB125F', dica: 'moto 125 cc', faixa: 'economica', preco: 18000, artigo: 'a', pesoUsado: 2, mercados: ['europa', 'asia', 'africa', 'oceania'] },
  { id: 'bajaj_pulsar', classe: 'moto_pequena', marca: 'Bajaj', modelo: 'Pulsar 150', dica: 'moto 150 cc', faixa: 'economica', preco: 11500, artigo: 'a', pesoUsado: 2.5, mercados: ['asia', 'africa', 'america_central_caribe'] },
  { id: 'honda_grom', classe: 'moto_pequena', marca: 'Honda', modelo: 'Grom', dica: 'moto 125 cc', faixa: 'intermediaria', preco: 27600, artigo: 'a', pesoUsado: 1, mercados: ['america_norte', 'oceania'] },
  { id: 'honda_cb500f', classe: 'moto_media', marca: 'Honda', modelo: 'CB 500F', dica: 'moto 500 cc', faixa: 'alta', preco: 44000, artigo: 'a', pesoUsado: 1, usoMensal: 330 },
  { id: 'triumph_bonneville', classe: 'moto_grande', marca: 'Triumph', modelo: 'Bonneville T120', dica: 'moto 1200 cc clássica', faixa: 'intermediaria', preco: 78000, artigo: 'a', pesoUsado: 0.6, forma: 'cruiser' },
  { id: 'bmw_r1300gs', classe: 'moto_grande', marca: 'BMW', modelo: 'R 1300 GS', dica: 'moto 1300 cc de viagem', faixa: 'alta', preco: 125000, artigo: 'a', pesoUsado: 0.6, forma: 'trail' },
  { id: 'harley_street_glide', classe: 'moto_grande', marca: 'Harley-Davidson', modelo: 'Street Glide', dica: 'moto 1900 cc de estrada', faixa: 'alta', preco: 165000, artigo: 'a', pesoUsado: 0.5, usoMensal: 600, forma: 'cruiser' },
  { id: 'ducati_panigale', classe: 'moto_grande', marca: 'Ducati', modelo: 'Panigale V4', dica: 'moto esportiva 1100 cc', faixa: 'alta', preco: 190000, artigo: 'a', pesoUsado: 0.3, usoMensal: 700, forma: 'esportiva' },
  { id: 'toyota_yaris', classe: 'carro_compacto', marca: 'Toyota', modelo: 'Yaris', dica: 'hatch compacto', faixa: 'intermediaria', preco: 110000, artigo: 'o', pesoUsado: 1.5, mercados: ['america_sul', 'america_central_caribe', 'europa', 'asia', 'africa', 'oceania'] },
  { id: 'kia_picanto', classe: 'carro_compacto', marca: 'Kia', modelo: 'Picanto', dica: 'compacto', faixa: 'economica', preco: 92000, artigo: 'o', pesoUsado: 1.5, mercados: ['america_sul', 'america_central_caribe', 'europa', 'asia', 'africa', 'oceania'] },
  { id: 'dacia_sandero', classe: 'carro_compacto', marca: 'Dacia', modelo: 'Sandero', dica: 'compacto', faixa: 'economica', preco: 82000, artigo: 'o', pesoUsado: 3, mercados: ['europa', 'africa'] },
  { id: 'renault_clio', classe: 'carro_compacto', marca: 'Renault', modelo: 'Clio', dica: 'hatch compacto', faixa: 'intermediaria', preco: 130000, artigo: 'o', pesoUsado: 2.5, mercados: ['europa', 'africa'] },
  { id: 'suzuki_swift', classe: 'carro_compacto', marca: 'Suzuki', modelo: 'Swift', dica: 'hatch compacto', faixa: 'economica', preco: 95000, artigo: 'o', pesoUsado: 2.5, mercados: ['asia', 'europa', 'africa', 'oceania'] },
  { id: 'nissan_versa', classe: 'carro_sedan', marca: 'Nissan', modelo: 'Versa', dica: 'sedã compacto', faixa: 'intermediaria', preco: 138000, artigo: 'o', pesoUsado: 2, mercados: ['america_norte', 'america_central_caribe', 'america_sul'] },
  { id: 'vw_golf', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Golf', dica: 'hatch médio', faixa: 'alta', preco: 192000, artigo: 'o', pesoUsado: 2.5, mercados: ['europa', 'africa', 'oceania'], forma: 'hatch' },
  { id: 'toyota_camry', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Camry', dica: 'sedã médio', faixa: 'alta', preco: 214000, artigo: 'o', pesoUsado: 3, mercados: ['america_norte', 'asia', 'oceania', 'africa'] },
  { id: 'hyundai_elantra', classe: 'carro_sedan', marca: 'Hyundai', modelo: 'Elantra', dica: 'sedã médio', faixa: 'intermediaria', preco: 168000, artigo: 'o', pesoUsado: 2, mercados: ['america_norte', 'asia', 'oceania', 'america_central_caribe'] },
  { id: 'tesla_model3', classe: 'carro_sedan', marca: 'Tesla', modelo: 'Model 3', dica: 'sedã elétrico', faixa: 'alta', preco: 306000, artigo: 'o', pesoUsado: 1.5, usoMensal: 330, mercados: ['america_norte', 'europa', 'asia', 'oceania'] },
  { id: 'toyota_rav4', classe: 'carro_suv', marca: 'Toyota', modelo: 'RAV4', dica: 'SUV médio', faixa: 'alta', preco: 230000, artigo: 'o', pesoUsado: 3, mercados: ['america_norte', 'europa', 'asia', 'oceania', 'africa', 'america_central_caribe'], forma: 'suv_medio' },
  { id: 'honda_crv', classe: 'carro_suv', marca: 'Honda', modelo: 'CR-V', dica: 'SUV médio', faixa: 'alta', preco: 228000, artigo: 'o', pesoUsado: 2.5, mercados: ['america_norte', 'asia', 'oceania'], forma: 'suv_medio' },
  { id: 'vw_tiguan', classe: 'carro_suv', marca: 'Volkswagen', modelo: 'Tiguan', dica: 'SUV médio', faixa: 'alta', preco: 260000, artigo: 'o', pesoUsado: 2, mercados: ['europa', 'africa', 'oceania'], forma: 'suv_medio' },
  { id: 'hyundai_tucson', classe: 'carro_suv', marca: 'Hyundai', modelo: 'Tucson', dica: 'SUV médio', faixa: 'alta', preco: 210000, artigo: 'o', pesoUsado: 2, forma: 'suv_medio' },
  { id: 'ford_f150', classe: 'carro_suv_grande', marca: 'Ford', modelo: 'F-150', acabamento: 'XLT', dica: 'picape grande', faixa: 'alta', preco: 306000, artigo: 'a', pesoUsado: 3.5, lugares: 5, usoMensal: 1050, mercados: ['america_norte'], forma: 'picape' },
  { id: 'chevrolet_tahoe', classe: 'carro_suv_grande', marca: 'Chevrolet', modelo: 'Tahoe', dica: 'SUV de oito lugares', faixa: 'alta', preco: 444000, artigo: 'o', pesoUsado: 1.2, lugares: 8, usoMensal: 1150, mercados: ['america_norte'], forma: 'suv_grande' },
  { id: 'ford_ranger', classe: 'carro_suv_grande', marca: 'Ford', modelo: 'Ranger', acabamento: 'XLS 2.0 diesel', dica: 'picape média', faixa: 'alta', preco: 280000, artigo: 'a', pesoUsado: 1.5, lugares: 5, forma: 'picape' },
  { id: 'toyota_land_cruiser', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'Land Cruiser', dica: 'SUV de sete lugares', faixa: 'alta', preco: 460000, artigo: 'o', pesoUsado: 0.8, lugares: 7, usoMensal: 1150, mercados: ['asia', 'africa', 'oceania', 'america_central_caribe'], forma: 'suv_grande' },
  // Superesportivos e altíssimo luxo (o preço brasileiro, com a importação; a garagem de colecionador).
  { id: 'porsche_911_turbo', classe: 'superesportivo', marca: 'Porsche', modelo: '911 Turbo S', dica: 'superesportivo', faixa: 'alta', preco: 2600000, artigo: 'o', pesoUsado: 1, lugares: 4, forma: 'esportivo' },
  { id: 'ferrari_roma', classe: 'superesportivo', marca: 'Ferrari', modelo: 'Roma', dica: 'superesportivo GT', faixa: 'alta', preco: 3400000, artigo: 'a', pesoUsado: 1, lugares: 4, forma: 'esportivo' },
  { id: 'mclaren_artura', classe: 'superesportivo', marca: 'McLaren', modelo: 'Artura', dica: 'superesportivo híbrido', faixa: 'alta', preco: 3600000, artigo: 'o', pesoUsado: 0.6, forma: 'esportivo' },
  { id: 'lamborghini_huracan', classe: 'superesportivo', marca: 'Lamborghini', modelo: 'Huracán EVO', dica: 'superesportivo V10', faixa: 'alta', preco: 4300000, artigo: 'o', pesoUsado: 0.8, usoMensal: 5600, forma: 'esportivo' },
  { id: 'mclaren_765lt', classe: 'superesportivo', marca: 'McLaren', modelo: '765LT', acabamento: 'edição limitada', dica: 'superesportivo de edição limitada', faixa: 'alta', preco: 7500000, artigo: 'o', pesoUsado: 0.2, usoMensal: 6200, forma: 'esportivo', limitada: 765 },
  { id: 'bentley_continental', classe: 'hiperluxo', marca: 'Bentley', modelo: 'Continental GT', dica: 'cupê de altíssimo luxo', faixa: 'alta', preco: 4200000, artigo: 'o', pesoUsado: 1, lugares: 4, forma: 'esportivo' },
  { id: 'maybach_s680', classe: 'hiperluxo', marca: 'Mercedes-Maybach', modelo: 'S 680', dica: 'sedã de altíssimo luxo', faixa: 'alta', preco: 5500000, artigo: 'o', pesoUsado: 0.8, forma: 'seda' },
  { id: 'rolls_ghost', classe: 'hiperluxo', marca: 'Rolls-Royce', modelo: 'Ghost', dica: 'sedã de altíssimo luxo', faixa: 'alta', preco: 8500000, artigo: 'o', pesoUsado: 0.6, forma: 'seda' },
  { id: 'rolls_cullinan', classe: 'hiperluxo', marca: 'Rolls-Royce', modelo: 'Cullinan', dica: 'SUV de altíssimo luxo', faixa: 'alta', preco: 9000000, artigo: 'o', pesoUsado: 0.5, usoMensal: 6000, forma: 'suv_grande' },
  // Clássicos: o preço de um exemplar em bom estado, hoje (no Brasil). Só existem usados — e cada um é um caso.
  { id: 'vw_fusca_1972', classe: 'classico', marca: 'Volkswagen', modelo: 'Fusca 1300', dica: 'clássico de 1972', faixa: 'economica', preco: 45000, artigo: 'o', pesoUsado: 3, ano: 1972, forma: 'compacto', usoMensal: 350, mercados: ['america_sul', 'america_central_caribe'] },
  { id: 'vw_beetle_1967', classe: 'classico', marca: 'Volkswagen', modelo: 'Beetle', dica: 'clássico de 1967', faixa: 'economica', preco: 120000, artigo: 'o', pesoUsado: 3, ano: 1967, forma: 'compacto', usoMensal: 380, mercados: ['america_norte', 'europa', 'oceania', 'asia', 'africa'] },
  { id: 'chevrolet_opala_ss', classe: 'classico', marca: 'Chevrolet', modelo: 'Opala SS', dica: 'clássico de 1976', faixa: 'intermediaria', preco: 160000, artigo: 'o', pesoUsado: 2, ano: 1976, forma: 'seda', mercados: ['BR'] },
  { id: 'ford_mustang_1967', classe: 'classico', marca: 'Ford', modelo: 'Mustang Fastback', dica: 'clássico de 1967', faixa: 'alta', preco: 750000, artigo: 'o', pesoUsado: 1.5, ano: 1967, forma: 'esportivo', usoMensal: 900 },
  { id: 'ferrari_308', classe: 'classico', marca: 'Ferrari', modelo: '308 GTS', dica: 'clássico de 1979', faixa: 'alta', preco: 950000, artigo: 'a', pesoUsado: 0.8, ano: 1979, forma: 'esportivo', usoMensal: 1400, lugares: 2 },
  { id: 'mercedes_280sl', classe: 'classico', marca: 'Mercedes-Benz', modelo: '280 SL Pagoda', dica: 'clássico de 1969', faixa: 'alta', preco: 1300000, artigo: 'o', pesoUsado: 0.8, ano: 1969, forma: 'esportivo', lugares: 2 },
  { id: 'porsche_911_1973', classe: 'classico', marca: 'Porsche', modelo: '911 T', dica: 'clássico de 1973', faixa: 'alta', preco: 1500000, artigo: 'o', pesoUsado: 0.6, ano: 1973, forma: 'esportivo' },
  { id: 'jaguar_etype', classe: 'classico', marca: 'Jaguar', modelo: 'E-Type Série 1', dica: 'clássico de 1963', faixa: 'alta', preco: 2400000, artigo: 'o', pesoUsado: 0.3, ano: 1963, forma: 'esportivo', lugares: 2 }
];

/** A forma de uma versão (o desenho que a representa). */
export function formaDaVersao(x: VersaoVeiculo | undefined, classe?: string): FormaVeiculo {
  if (x?.forma) return x.forma;
  const c = x?.classe ?? classe ?? 'carro_compacto';
  const d = (x?.dica ?? '').toLowerCase();
  const m = VEICULOS.find(y => y.id === c);
  switch (m?.categoria) {
    case 'bicicleta': return m.eletrica ? 'eletrica' : /trilha|mountain/.test(d) ? 'mtb' : /estrada|speed/.test(d) ? 'estrada' : 'urbana';
    case 'moto': return /scooter/.test(d) || x?.id === 'honda_pop' || x?.id === 'honda_biz' ? 'scooter' : /trail|terra/.test(d) ? 'trail' : /clássica|custom/.test(d) ? 'cruiser' : /esportiva/.test(d) ? 'esportiva' : 'street';
    case 'embarcacao': return c === 'jetski' ? 'jetski' : c === 'veleiro' ? 'veleiro' : c === 'iate' ? 'iate' : 'lancha';
    case 'aeronave': return c === 'ultraleve' || c === 'bimotor' || c === 'jato' || c === 'helicoptero' ? c : /jato/.test(d) ? 'jato' : /bimotor/.test(d) ? 'bimotor' : /asa baixa/.test(d) ? 'asa_baixa' : 'monomotor';
    // FIX pós-playtest humano: o compacto de entrada (curto, alto, roda pequena) não é o hatch médio.
    default: return /^compacto/.test(d) ? 'compacto' : /picape/.test(d) ? 'picape' : /suv/.test(d) ? 'suv' : /esportivo/.test(d) ? 'esportivo' : /sedã/.test(d) ? 'seda' : c === 'carro_sedan' ? 'seda' : c.startsWith('carro_suv') ? 'suv' : 'hatch';
  }
}

export const NOME_FORMA: Record<FormaVeiculo, string> = {
  compacto: 'compacto', hatch: 'hatch', seda: 'sedã', suv: 'SUV', suv_medio: 'SUV médio', suv_grande: 'SUV de sete lugares', picape: 'picape', esportivo: 'esportivo',
  cub: 'motoneta', scooter: 'scooter', street: 'moto de rua', esportiva: 'moto esportiva', cruiser: 'moto clássica', trail: 'moto de trilha',
  urbana: 'bicicleta urbana', estrada: 'bicicleta de estrada', mtb: 'mountain bike', eletrica: 'bicicleta elétrica',
  jetski: 'moto aquática', lancha: 'lancha', veleiro: 'veleiro', ultraleve: 'ultraleve', monomotor: 'monomotor de asa alta', asa_baixa: 'monomotor de asa baixa', bimotor: 'bimotor', jato: 'jato executivo',
  iate: 'iate', helicoptero: 'helicóptero'
};

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
  { id: 'alto_padrao', nome: 'apartamento de alto padrão', padrao: 5, quartos: 3, fatorAluguel: 2.9, preco: 1200000, condominio: 1600, casa: false, descricao: 'Portaria, piscina, bairro nobre.' },
  // REWORK 12: o topo. A cobertura vale pelo endereço (só nas cidades grandes, nos bairros disputados); a mansão,
  // pelo tamanho e pelo terreno — longe do que é disputado, vale bem menos do que o apartamento de luxo bem localizado.
  { id: 'cobertura', nome: 'cobertura', padrao: 5, quartos: 4, fatorAluguel: 5.5, preco: 2700000, condominio: 3400, casa: false, descricao: 'Dois andares, terraço, a cidade inteira lá embaixo.' },
  { id: 'mansao', nome: 'mansão', padrao: 5, quartos: 6, fatorAluguel: 6, preco: 3200000, condominio: 0, casa: true, descricao: 'Seis suítes, piscina, jardim, casa de hóspedes. Muito para cuidar.' }
];

/**
 * REWORK 12: área útil de referência de cada tipo (m²), para a tela comparar (o preço por metro mostra o que é
 * caro pelo endereço e o que é caro pelo tamanho).
 */
export const AREA_MORADIA: Record<string, number> = {
  republica: 14, casa_simples: 55, kitnet: 30, apto_1q: 45, apto_2q: 62, casa_2q: 75, apto_3q: 95, casa_3q: 120, casa_grande: 260, sitio: 90, alto_padrao: 170, cobertura: 320, mansao: 900
};

export const modeloVeiculo = (id: string) => VEICULOS.find(m => m.id === id) ?? VEICULOS.find(m => m.id === VEICULO_ANTIGO[id]?.id) ?? VEICULOS[4];
export const modeloMoradia = (id: string) => MORADIAS.find(m => m.id === id) ?? MORADIAS[4];

/** Preço de imóvel numa cidade: moradia é mais sensível ao custo local. */
export const precoImovel = (m: ModeloMoradia, custoLocal: number) => Math.round(m.preco * Math.pow(custoLocal, 1.7) / 1000) * 1000;

/** Um veículo usado de `anos` vale quanto do novo (antes do estado de conservação). */
export function depreciacao(m: ModeloVeiculo, anos: number): number {
  if (anos <= 0) return 1;
  // REWORK 12: o clássico não deprecia pela idade (o preço de catálogo já é o de um exemplar velho, em bom estado);
  // o exótico perde muito no começo (quem compra zero paga a exclusividade) e para num piso alto (a marca segura).
  if (m.segmento === 'classico') return 1;
  if (m.segmento === 'exotico') return Math.max(0.38, 0.78 * Math.pow(0.93, anos - 1));
  const primeiro = m.categoria === 'bicicleta' ? 0.7 : 0.82;
  return Math.max(m.categoria === 'bicicleta' ? 0.15 : 0.18, primeiro * Math.pow(m.categoria === 'bicicleta' ? 0.85 : 0.91, anos - 1));
}
