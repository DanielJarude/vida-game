/**
 * VIDA 13 — PRODUTOS E LINHAS (catálogo puro: só tipos).
 *
 * Até a 12.9, o que a empresa grande fazia era um ITEM genérico do ramo ("uma linha de alimentos", "um SUV premium"). A
 * VIDA 13 desce um nível: cada item é um MOLDE (risco, chance de fracasso, vida útil, pré-requisito) e cada PRODUTO é o que
 * de fato vai para a prateleira — salgadinhos, cereais, uma picape compacta, uma moto urbana, um smartphone, um satélite
 * meteorológico. O produto pode sobrepor os números do molde (investimento, prazo, faturamento maduro, margem, quanto da
 * capacidade ocupa) e traz o que a tela precisa dizer antes (público, posicionamento, concorrência, potencial).
 *
 * O PRIMEIRO produto de cada item é NEUTRO (não sobrepõe nada, crescimento 0; a concorrência dos outros conta contra a dele): é o que a gestão delegada
 * escolhe e o que as empresas à venda já têm — a economia da 12.9 não muda por baixo de quem não escolhe nada.
 *
 * Valores em reais de uma economia brasileira (o sistema converte para a moeda da vida). Projetos antigos (sem `produto`)
 * seguem o item, como antes.
 */

import type { TipoEmpresa } from '../tipos';

export type Posicionamento13 = 'popular' | 'intermediario' | 'premium';
export const POSICOES_13: Posicionamento13[] = ['popular', 'intermediario', 'premium'];
export const NOME_POSICAO_13: Record<Posicionamento13, string> = { popular: 'popular', intermediario: 'intermediário', premium: 'premium' };

/** Um produto de um ramo grande (sobre um item de `dados/empresas129`). */
export interface ProdutoDoSetor13 {
  id: string;
  setor: TipoEmpresa;
  /** O item (molde) do ramo. */
  item: string;
  /** O grupo na tela ("Alimentos", "Motos", "Aparelhos"). */
  familia: string;
  nome: string;
  /** Para nomear a linha ("Salgadinho" + a marca). */
  curto: string;
  descricao: string;
  publico: string;
  /** Onde nasce (a linha pode ser reposicionada depois). */
  pos: Posicionamento13;
  /** Sobreposições ao item (ausente = o do item). */
  capex?: number;
  meses?: number;
  receita?: number;
  margem?: number;
  usa?: number;
  /** Multiplica o risco de tropeço e de fracasso do item. */
  risco?: number;
  /** 1 (quase sozinho) a 5 (disputa feroz). */
  conc: number;
  /** Crescimento do mercado por ano (−0,04 a +0,12). */
  cresc: number;
  /** O quanto o volume reage ao preço (0,6 rígido; 2 muito sensível). */
  elast: number;
  /** Anos até o produto envelhecer sem uma versão nova (ausente = não envelhece depressa). */
  ciclo?: number;
  /** O tamanho do mercado do produto no país (reais por ano), para a fatia. */
  mercado: number;
  /** O banco de marcas (`dados/nomes13.MARCAS_13`). */
  marcas: string;
}

type Extra = Partial<Pick<ProdutoDoSetor13, 'capex' | 'meses' | 'receita' | 'margem' | 'usa' | 'risco' | 'ciclo'>>;
const P = (setor: TipoEmpresa, item: string, familia: string, marcas: string) =>
  (id: string, nome: string, curto: string, descricao: string, publico: string, pos: Posicionamento13, conc: number, cresc: number, elast: number, mercado: number, extra: Extra = {}): ProdutoDoSetor13 =>
    ({ id, setor, item, familia, nome, curto, descricao, publico, pos, conc, cresc, elast, mercado, marcas, ...extra });

const M = 1e6;
const B = 1e9;

/* ------------------------------------------------------------------ Indústria */
const ali = P('industria', 'alimentos', 'Alimentos e bebidas', 'alimento');
const hig = P('industria', 'higiene', 'Higiene, limpeza e beleza', 'higiene');
const emb = P('industria', 'embalagens', 'Embalagens', 'industrial');
const qui = P('industria', 'quimica', 'Química', 'industrial');
const INDUSTRIA: ProdutoDoSetor13[] = [
  ali('biscoitos', 'Biscoitos recheados', 'Biscoito', 'O pacote da lancheira: giro alto, prateleira disputada.', 'famílias com crianças', 'popular', 3, 0, 1.4, 12 * B),
  ali('salgadinhos', 'Salgadinhos de milho e batata', 'Salgadinho', 'Compra por impulso, margem boa, marca é tudo.', 'jovens e crianças', 'popular', 5, 0.03, 1.7, 10 * B, { capex: 10 * M, receita: 52 * M, margem: 0.32, ciclo: 6 }),
  ali('cereais', 'Cereais matinais', 'Cereal', 'Café da manhã de quem tem pressa; caixa colorida, margem melhor.', 'famílias de classe média', 'intermediario', 4, 0.02, 1.2, 6 * B, { capex: 12 * M, receita: 40 * M, margem: 0.34 }),
  ali('bolachas', 'Bolachas e cream crackers', 'Bolacha', 'Item de cesta básica: vende sempre, ganha pouco.', 'todo mundo', 'popular', 4, 0, 1, 8 * B, { capex: 6 * M, receita: 38 * M, margem: 0.22 }),
  ali('bebidas', 'Refrigerantes e sucos', 'Refrigerante', 'Volume enorme e duas gigantes na gôndola.', 'todo mundo, no calor mais', 'popular', 5, -0.01, 1.5, 40 * B, { capex: 18 * M, meses: 15, receita: 70 * M, margem: 0.3, risco: 1.1 }),
  ali('massas', 'Massas secas', 'Macarrão', 'Básico de despensa: preço manda, fidelidade é baixa.', 'famílias', 'popular', 3, 0.01, 0.9, 7 * B, { capex: 7 * M, receita: 36 * M, margem: 0.2 }),
  ali('chocolates', 'Chocolates e bombons', 'Chocolate', 'Margem gorda, Páscoa e Natal fazem o ano.', 'presente e indulgência', 'intermediario', 4, 0.03, 1.6, 15 * B, { capex: 16 * M, meses: 15, receita: 55 * M, margem: 0.36, ciclo: 7 }),
  ali('lacteos', 'Iogurtes e laticínios', 'Iogurte', 'Prazo de validade curto e cadeia fria: perde quem erra a logística.', 'famílias e quem treina', 'intermediario', 4, 0.02, 1.2, 14 * B, { capex: 14 * M, receita: 50 * M, margem: 0.24, risco: 1.2 }),
  ali('congelados', 'Congelados e pratos prontos', 'Congelado', 'A janta de quem chega tarde: cresce com as cidades.', 'quem mora só e casais que trabalham', 'intermediario', 3, 0.05, 1.3, 9 * B, { capex: 15 * M, receita: 48 * M, margem: 0.28 }),
  ali('cafe', 'Café torrado e cápsulas', 'Café', 'Do pacote de meio quilo à cápsula: o cafezinho é sagrado.', 'adultos', 'intermediario', 4, 0.03, 1.1, 11 * B, { capex: 9 * M, receita: 42 * M, margem: 0.3 }),
  ali('saudaveis', 'Linha saudável (integral, sem açúcar)', 'Integral', 'Nicho que cresce: paga mais, exige rótulo limpo.', 'quem cuida da dieta', 'premium', 2, 0.08, 1, 4 * B, { capex: 10 * M, receita: 30 * M, margem: 0.38 }),
  ali('racao', 'Ração para cães e gatos', 'Ração', 'O pet virou da família: o mercado não para de crescer.', 'donos de animais', 'intermediario', 4, 0.06, 1.1, 8 * B, { capex: 14 * M, receita: 46 * M, margem: 0.3 }),
  hig('limpeza', 'Detergentes e produtos de limpeza', 'Detergente', 'O carrinho do mês: volume, promoção, marca conhecida.', 'donas e donos de casa', 'popular', 3, 0, 1.4, 20 * B),
  hig('sabonetes', 'Sabonetes', 'Sabonete', 'Barato de fazer, difícil de diferenciar.', 'todo mundo', 'popular', 4, 0, 1.3, 7 * B, { capex: 9 * M, receita: 38 * M, margem: 0.33 }),
  hig('cabelos', 'Xampu e condicionador', 'Xampu', 'Fórmula, fragrância e propaganda: muita marca, muita margem.', 'adultos e jovens', 'intermediario', 5, 0.03, 1.5, 12 * B, { capex: 14 * M, receita: 60 * M, margem: 0.38 }),
  hig('fraldas', 'Fraldas', 'Fralda', 'Máquina cara, volume enorme; o país tem menos bebês a cada ano.', 'pais de bebês e idosos', 'popular', 4, -0.01, 1.2, 10 * B, { capex: 20 * M, receita: 70 * M, margem: 0.25 }),
  hig('bucal', 'Creme dental e higiene bucal', 'Creme dental', 'Duas multinacionais e a recomendação do dentista.', 'todo mundo', 'popular', 5, 0.01, 1.2, 6 * B, { capex: 12 * M, receita: 45 * M, margem: 0.4 }),
  hig('cosmeticos', 'Cosméticos e perfumaria', 'Perfume', 'Embalagem bonita e margem de metade: marca forte é obrigatória.', 'quem compra beleza', 'premium', 4, 0.05, 1.3, 25 * B, { capex: 18 * M, receita: 55 * M, margem: 0.5, ciclo: 5 }),
  emb('papelao', 'Caixas de papelão', 'Papelão', 'O comércio eletrônico vive disso: contrato e volume.', 'indústrias e lojas virtuais', 'popular', 3, 0, 1.2, 15 * B),
  emb('garrafas', 'Garrafas PET', 'Garrafa', 'Vende para as fábricas de bebida: preço apertado.', 'fábricas de bebida', 'popular', 4, 0, 1.4, 8 * B, { capex: 18 * M, receita: 45 * M, margem: 0.22 }),
  emb('latas', 'Latas de alumínio', 'Lata', 'Investimento alto, poucos concorrentes, a cerveja manda.', 'cervejarias e refrigerantes', 'intermediario', 2, 0.04, 1, 10 * B, { capex: 40 * M, meses: 18, receita: 90 * M, margem: 0.2 }),
  emb('flexiveis', 'Embalagens flexíveis', 'Filme', 'O saquinho do salgadinho e do café: impressão e barreira.', 'indústria de alimentos', 'intermediario', 3, 0.03, 1.1, 9 * B, { capex: 14 * M, receita: 38 * M, margem: 0.27 }),
  qui('resinas', 'Resinas e plásticos', 'Resina', 'Insumo de outras fábricas: segue o preço do petróleo.', 'indústrias', 'intermediario', 3, 0, 1.2, 40 * B),
  qui('tintas', 'Tintas e vernizes', 'Tinta', 'Loja de material de construção e pintor: marca e cor.', 'quem reforma', 'intermediario', 4, 0.02, 1.2, 12 * B, { capex: 35 * M, meses: 18, receita: 80 * M, margem: 0.34, usa: 1 }),
  qui('fertilizantes', 'Fertilizantes', 'Fertilizante', 'O agro compra muito — e o preço do mundo decide o ano.', 'produtores rurais', 'popular', 3, 0.04, 0.8, 60 * B, { capex: 90 * M, meses: 30, receita: 180 * M, margem: 0.25, risco: 1.2 }),
  qui('farmoquimicos', 'Insumos farmacêuticos', 'Princípio ativo', 'Licença sanitária, pureza, margem alta e pouca gente que sabe fazer.', 'laboratórios farmacêuticos', 'premium', 2, 0.05, 0.8, 8 * B, { capex: 80 * M, meses: 30, receita: 110 * M, margem: 0.45, risco: 1.3 })
];

/* ------------------------------------------------------------------ Montadora */
const ent = P('montadora', 'popular', 'Carros de entrada e utilitários', 'veiculo');
const mot = P('montadora', 'popular', 'Motos', 'moto');
const sed = P('montadora', 'sedan', 'Sedãs e familiares', 'veiculo');
const suv = P('montadora', 'suv_premium', 'SUVs e picapes', 'veiculo');
const esp = P('montadora', 'esportivo', 'Esportivos', 'veiculo');
const ele = P('montadora', 'eletrico', 'Elétricos e híbridos', 'veiculo');
const elp = P('montadora', 'eletrico_premium', 'Elétricos e híbridos', 'veiculo');
const MONTADORA: ProdutoDoSetor13[] = [
  ent('hatch', 'Hatch compacto', 'Hatch', 'O primeiro carro de muita gente: volume, preço curto, margem de poucos por cento.', 'primeiro carro e famílias jovens', 'popular', 3, 0, 1.4, 120 * B, { ciclo: 7 }),
  ent('picape_compacta', 'Picape compacta', 'Picape', 'Trabalho na semana, passeio no domingo.', 'pequenos negócios e o interior', 'popular', 4, 0.03, 1.2, 40 * B, { capex: 1 * B, receita: 3.6 * B, margem: 0.19, ciclo: 7 }),
  ent('sedan_compacto', 'Sedã compacto', 'Sedã', 'Porta-malas grande e preço de hatch: táxi e aplicativo adoram.', 'motoristas de aplicativo e famílias', 'popular', 4, -0.02, 1.4, 35 * B, { capex: 950 * M, receita: 3.8 * B, ciclo: 7 }),
  ent('utilitario', 'Utilitário de carga (van)', 'Van', 'Entrega urbana e frota de empresa: compra racional, pouca concorrência.', 'empresas e frotas', 'popular', 2, 0.03, 0.9, 25 * B, { capex: 800 * M, meses: 30, receita: 2.2 * B, margem: 0.18, usa: 0.4 }),
  ent('caminhao_leve', 'Caminhão leve', 'Caminhão', 'O que abastece as cidades: robustez e custo por quilômetro.', 'transportadoras e distribuidoras', 'intermediario', 3, 0.02, 1, 30 * B, { capex: 1.3 * B, meses: 40, receita: 3 * B, margem: 0.17 }),
  mot('moto_urbana', 'Moto urbana (150 cc)', 'Moto', 'Entregador, estudante, quem foge do trânsito: o maior volume das motos.', 'quem trabalha com entrega', 'popular', 4, 0.04, 1.6, 30 * B, { capex: 350 * M, meses: 24, receita: 2.4 * B, margem: 0.16, usa: 0.25, ciclo: 6 }),
  mot('moto_trail', 'Moto trail', 'Trail', 'Estrada de terra e viagem longa: público fiel.', 'aventureiros e o interior', 'intermediario', 3, 0.03, 1.2, 8 * B, { capex: 450 * M, meses: 28, receita: 1.2 * B, margem: 0.22, usa: 0.15, ciclo: 7 }),
  sed('sedan_medio', 'Sedã médio', 'Sedã', 'Família e frota: mercado estável, encolhendo.', 'famílias e frotas executivas', 'intermediario', 3, 0, 1.3, 50 * B, { ciclo: 7 }),
  sed('sedan_executivo', 'Sedã executivo', 'Sedã', 'Banco de trás para quem tem motorista: margem alta, mercado pequeno.', 'executivos e alta renda', 'premium', 3, -0.03, 0.9, 15 * B, { capex: 1.4 * B, receita: 3.2 * B, margem: 0.22, ciclo: 7 }),
  sed('minivan', 'Minivan', 'Minivan', 'Sete lugares e porta corrida: quase ninguém faz mais.', 'famílias grandes', 'intermediario', 1, -0.04, 1.1, 6 * B, { capex: 1 * B, receita: 2.2 * B, margem: 0.17 }),
  suv('suv_medio', 'SUV médio premium', 'SUV', 'O segmento que mais cresce e mais paga — se a marca convencer.', 'famílias de alta renda', 'premium', 3, 0, 1.2, 90 * B, { ciclo: 6 }),
  suv('suv_compacto', 'SUV compacto', 'SUV', 'O carro que o brasileiro quer: posição alta, preço de sedã.', 'classe média', 'intermediario', 5, 0.05, 1.4, 110 * B, { capex: 1.2 * B, meses: 36, receita: 5.2 * B, margem: 0.19, ciclo: 6 }),
  suv('suv_grande', 'SUV de luxo de sete lugares', 'SUV', 'Couro, tela e tração: poucos vendidos, margem gorda.', 'alta renda', 'premium', 3, 0.03, 1.1, 30 * B, { capex: 1.9 * B, meses: 44, receita: 3.4 * B, margem: 0.3, ciclo: 7 }),
  suv('picape_media', 'Picape média a diesel', 'Picape', 'O carro do agronegócio: cara, robusta, disputada.', 'produtores rurais e empresas', 'intermediario', 3, 0.02, 1, 45 * B, { capex: 1.5 * B, meses: 40, receita: 4.2 * B, margem: 0.25, ciclo: 8 }),
  esp('cupe', 'Cupê esportivo', 'Cupê', 'Pouco volume, muita margem, muita imagem.', 'entusiastas de alta renda', 'premium', 3, 0, 1.1, 8 * B, { ciclo: 6 }),
  esp('superesportivo', 'Superesportivo', 'Superesportivo', 'Motor central, carbono e fila de espera: vende imagem para a marca toda.', 'colecionadores e muito ricos', 'premium', 2, 0.02, 0.7, 4 * B, { capex: 1.6 * B, meses: 48, receita: 700 * M, margem: 0.45, usa: 0.1, risco: 1.3, ciclo: 6 }),
  esp('conversivel', 'Conversível', 'Conversível', 'Teto de lona e sol: um carro de fim de semana.', 'quem já tem outro carro', 'premium', 2, -0.01, 1.2, 3 * B, { capex: 1 * B, receita: 800 * M, margem: 0.3, usa: 0.2, ciclo: 7 }),
  P('montadora', 'esportivo', 'Motos', 'moto')('moto_esportiva', 'Moto esportiva', 'Esportiva', 'Pouco volume, muita imagem e um público que paga.', 'entusiastas', 'premium', 3, 0.01, 1.8, 5 * B, { capex: 500 * M, meses: 30, receita: 700 * M, margem: 0.28, usa: 0.1, ciclo: 6 }),
  ele('eletrico_urbano', 'Elétrico urbano', 'Elétrico', 'Bateria cara, margem apertada no começo; melhora com P&D e escala.', 'quem roda na cidade e carrega em casa', 'intermediario', 3, 0, 1.3, 30 * B, { ciclo: 5 }),
  ele('hibrido', 'Híbrido flex', 'Híbrido', 'Etanol e bateria: o caminho do meio, menos risco que o elétrico puro.', 'classe média que quer economizar', 'intermediario', 3, 0.06, 1.2, 25 * B, { capex: 1.5 * B, meses: 40, receita: 4.2 * B, margem: 0.14, risco: 0.7, ciclo: 6 }),
  elp('sedan_eletrico', 'Sedã elétrico premium', 'Elétrico', 'Tecnologia de ponta e preço alto: o público existe, a concorrência global também.', 'alta renda conectada', 'premium', 3, 0, 1.1, 20 * B, { ciclo: 5 }),
  elp('suv_eletrico', 'SUV elétrico', 'SUV elétrico', 'O elétrico que a família quer: grande, caro, disputado pelos importados.', 'famílias de alta renda', 'premium', 4, 0.1, 1.2, 25 * B, { capex: 2.6 * B, receita: 5 * B, margem: 0.21, ciclo: 5 })
];

/* ------------------------------------------------------------------ Tecnologia */
const app = P('tecnologia', 'app', 'Aplicativos e serviços digitais', 'app');
const sof = P('tecnologia', 'saas', 'Software e sistemas', 'tech');
const hw = P('tecnologia', 'ia', 'Aparelhos e hardware', 'tech');
const ia = P('tecnologia', 'ia', 'Inteligência artificial', 'tech');
const nuv = P('tecnologia', 'nuvem', 'Nuvem e infraestrutura', 'tech');
const TECNOLOGIA: ProdutoDoSetor13[] = [
  app('app_servicos', 'Aplicativo de serviços (agenda, entrega)', 'App', 'Para o público: barato de fazer, difícil de fazer pegar.', 'quem resolve a vida pelo celular', 'popular', 3, 0, 1.4, 20 * B, { ciclo: 4 }),
  app('rede_social', 'Rede social', 'Rede', 'Vive de anúncio e de gente: ou viraliza, ou some.', 'jovens', 'popular', 5, 0.05, 1, 30 * B, { capex: 4 * M, meses: 15, receita: 10 * M, margem: 0.82, risco: 1.3, ciclo: 3 }),
  app('jogo_mobile', 'Jogo para celular', 'Jogo', 'Um sucesso paga dez fracassos; dura pouco no topo.', 'jogadores casuais', 'popular', 5, 0.04, 1.6, 15 * B, { capex: 2 * M, receita: 7 * M, margem: 0.75, ciclo: 3 }),
  app('fintech', 'Carteira digital e pagamentos', 'Pay', 'Pix, cartão e crédito no celular: regulado e disputado pelos bancos.', 'quem não gosta de agência', 'popular', 4, 0.06, 1.2, 40 * B, { capex: 6 * M, meses: 18, receita: 14 * M, margem: 0.6, risco: 1.2, ciclo: 5 }),
  app('streaming', 'Streaming de música e vídeo', 'Play', 'Catálogo caro (direitos), assinatura barata: escala ou nada.', 'assinantes de entretenimento', 'intermediario', 5, 0.03, 1.5, 25 * B, { capex: 8 * M, meses: 18, receita: 15 * M, margem: 0.45, ciclo: 5 }),
  sof('erp', 'Sistema de gestão para empresas (ERP)', 'Gestão', 'Assinatura mensal: cresce devagar e fica.', 'pequenas e médias empresas', 'intermediario', 3, 0, 1.1, 30 * B, { ciclo: 6 }),
  sof('crm', 'CRM e automação de vendas', 'Vendas', 'O funil de quem vende: fácil de trocar, difícil de largar.', 'equipes comerciais', 'intermediario', 4, 0.04, 1.2, 12 * B, { capex: 3.5 * M, meses: 15, receita: 9 * M, margem: 0.8, ciclo: 5 }),
  sof('seguranca', 'Segurança digital', 'Escudo', 'Ataque hacker vende o produto: contrato caro e fiel.', 'empresas e governo', 'premium', 3, 0.08, 0.8, 15 * B, { capex: 5 * M, receita: 12 * M, margem: 0.76, ciclo: 4 }),
  sof('sistema_operacional', 'Sistema operacional', 'OS', 'O chão onde os outros programas pisam: anos de código e um ecossistema para convencer.', 'fabricantes de aparelhos', 'intermediario', 2, 0.03, 0.9, 20 * B, { capex: 30 * M, meses: 36, receita: 45 * M, margem: 0.85, usa: 3, risco: 1.5 }),
  sof('design_soft', 'Software de design e engenharia', 'Studio', 'Ferramenta de profissional: licença cara, cliente que não troca.', 'arquitetos, engenheiros, designers', 'premium', 3, 0.03, 0.9, 8 * B, { capex: 6 * M, meses: 24, receita: 13 * M, margem: 0.82, ciclo: 5 }),
  ia('assistente_ia', 'Assistente de IA para o público', 'IA', 'Computação cara, gente rara, mercado disputado no mundo todo.', 'quem estuda e trabalha no computador', 'intermediario', 3, 0, 1.2, 50 * B, { ciclo: 2 }),
  ia('ia_empresas', 'IA para empresas', 'IA', 'Atendimento, análise de documentos, automação: contrato e integração.', 'bancos, varejo, indústria', 'premium', 3, 0.1, 0.9, 40 * B, { capex: 200 * M, meses: 24, receita: 300 * M, margem: 0.62, usa: 5, ciclo: 3 }),
  ia('visao', 'Visão computacional (indústria e cidades)', 'Visão', 'Câmera que entende: inspeção de fábrica, trânsito, segurança.', 'indústrias e prefeituras', 'intermediario', 2, 0.07, 1, 10 * B, { capex: 120 * M, meses: 24, receita: 160 * M, margem: 0.55, usa: 4, ciclo: 3 }),
  hw('smartphone', 'Smartphone', 'Fone', 'Fábrica terceirizada, estoque, margem de hardware — e um modelo novo todo ano.', 'todo mundo', 'intermediario', 5, 0.01, 1.5, 80 * B, { capex: 150 * M, meses: 24, receita: 500 * M, margem: 0.28, usa: 4, risco: 0.7, ciclo: 2 }),
  hw('notebook', 'Computadores e notebooks', 'Book', 'Escola, escritório, jogo: o computador ainda paga as contas.', 'estudantes e empresas', 'intermediario', 4, 0, 1.3, 30 * B, { capex: 90 * M, meses: 24, receita: 300 * M, margem: 0.24, usa: 3, risco: 0.7, ciclo: 3 }),
  hw('hardware_especializado', 'Hardware especializado (servidores, equipamento médico)', 'Pro', 'Pouca unidade, muito valor, certificação demorada.', 'hospitais, indústrias, data centers', 'premium', 2, 0.05, 0.8, 20 * B, { capex: 70 * M, meses: 30, receita: 180 * M, margem: 0.38, usa: 3, risco: 0.7, ciclo: 4 }),
  hw('vestiveis', 'Relógios e fones inteligentes', 'Watch', 'Acessório que vira hábito: a bateria e o design decidem.', 'quem treina e quem gosta de novidade', 'intermediario', 4, 0.04, 1.4, 12 * B, { capex: 40 * M, meses: 18, receita: 140 * M, margem: 0.32, usa: 2, risco: 0.7, ciclo: 2 }),
  nuv('nuvem_publica', 'Nuvem pública', 'Cloud', 'Data centers próprios: bilhões em concreto e chips, margem estável depois.', 'empresas de todos os tamanhos', 'intermediario', 3, 0, 1.1, 60 * B),
  nuv('datacenter_ia', 'Data center para IA', 'Data center', 'Energia e chips para treinar modelos: a fila de clientes é longa — e o investimento, maior.', 'empresas de IA', 'premium', 3, 0.12, 0.8, 50 * B, { capex: 4 * B, meses: 42, receita: 3.6 * B, margem: 0.4, usa: 24, risco: 1.2 })
];

/* ------------------------------------------------------------------ Aeroespacial */
const sat = P('aeroespacial', 'satelites_governo', 'Satélites e ciência', 'espaco');
const lan = P('aeroespacial', 'lancador_leve', 'Lançadores', 'espaco');
const reu = P('aeroespacial', 'reutilizavel', 'Lançadores', 'espaco');
const con = P('aeroespacial', 'constelacao', 'Serviços em órbita', 'espaco');
const cap = P('aeroespacial', 'capsula', 'Voo tripulado', 'espaco');
const AEROESPACIAL: ProdutoDoSetor13[] = [
  sat('sat_observacao', 'Satélites de observação da Terra', 'Satélite', 'O começo de quase todas: contrato público, prazo e margem curta.', 'governos e o agronegócio', 'intermediario', 3, 0, 0.8, 15 * B),
  sat('sat_meteorologico', 'Satélites meteorológicos', 'Satélite', 'Previsão do tempo e alerta de desastre: cliente certo, verba incerta.', 'institutos de meteorologia', 'intermediario', 2, 0.02, 0.7, 6 * B, { capex: 500 * M, receita: 650 * M, margem: 0.32 }),
  sat('sat_comunicacao', 'Satélites de comunicação', 'Satélite', 'Televisão, telefonia e defesa: maior, mais caro, mais disputado.', 'operadoras e forças armadas', 'intermediario', 3, 0.03, 0.9, 20 * B, { capex: 900 * M, meses: 30, receita: 1.3 * B, margem: 0.33 }),
  sat('sonda', 'Sonda científica (exploração)', 'Sonda', 'Lua, Marte, asteroides: contrato de agência espacial, prestígio enorme, margem curta.', 'agências espaciais', 'premium', 1, 0.02, 0.6, 5 * B, { capex: 1.5 * B, meses: 48, receita: 1.4 * B, margem: 0.25, risco: 1.4 }),
  lan('lancador', 'Lançador leve', 'Foguete', 'Põe satélites pequenos em órbita. Anos de teste antes do primeiro voo pago.', 'operadoras de satélites pequenos', 'intermediario', 3, 0, 1, 10 * B),
  lan('lancador_medio', 'Lançador médio', 'Foguete', 'Mais carga, mais clientes — e mais anos de teste.', 'operadoras e governos', 'intermediario', 3, 0.03, 1, 20 * B, { capex: 6 * B, meses: 66, receita: 2.8 * B, margem: 0.42, risco: 1.2 }),
  reu('pesado_reutilizavel', 'Foguete pesado reutilizável', 'Foguete', 'O primeiro estágio volta e pousa. Uma década e uma fortuna; muda o preço de ir ao espaço.', 'o mundo inteiro', 'intermediario', 2, 0, 0.9, 60 * B),
  con('internet_satelite', 'Internet via satélite', 'Conexão', 'Milhares de satélites e milhões de assinantes — se o foguete existir.', 'o campo, navios, aviões, cidades sem cabo', 'intermediario', 3, 0, 1.2, 40 * B),
  con('iot_satelite', 'Rastreamento e sensores por satélite', 'Rastreio', 'Caminhão, gado e contêiner localizados em qualquer lugar.', 'logística e agronegócio', 'intermediario', 2, 0.08, 1, 10 * B, { capex: 5 * B, meses: 40, receita: 2.4 * B, margem: 0.55 }),
  cap('capsula_tripulada', 'Cápsula tripulada (contratos de agência)', 'Cápsula', 'Levar gente ao espaço: o mais caro, o mais arriscado, o mais visto.', 'agências espaciais', 'premium', 2, 0, 0.7, 15 * B),
  cap('turismo_espacial', 'Turismo espacial', 'Voo', 'Alguns minutos de gravidade zero pelo preço de uma mansão.', 'milionários', 'premium', 2, 0.04, 0.6, 5 * B, { capex: 6 * B, meses: 60, receita: 1.8 * B, margem: 0.35, risco: 1.2 }),
  cap('estacao', 'Módulo de estação espacial', 'Estação', 'Laboratório em órbita alugado a governos e empresas.', 'agências e indústria farmacêutica', 'premium', 1, 0.03, 0.6, 10 * B, { capex: 20 * B, meses: 96, receita: 4.5 * B, margem: 0.3, risco: 1.3 })
];

/* ------------------------------------------------------------------ Construtora */
const cpop = P('construtora', 'popular', 'Residencial econômico', 'imovel');
const cmed = P('construtora', 'medio', 'Residencial médio', 'imovel');
const calt = P('construtora', 'alto', 'Alto padrão', 'imovel');
const ccom = P('construtora', 'comercial', 'Comercial e logística', 'imovel');
const CONSTRUTORA: ProdutoDoSetor13[] = [
  cpop('condominio_popular', 'Condomínio popular', 'Residencial', 'Financiamento habitacional, margem curta, procura firme.', 'quem compra a primeira casa', 'popular', 3, 0, 1.3, 80 * B),
  cpop('loteamento', 'Loteamento de casas', 'Loteamento', 'Casa térrea com quintal na periferia: obra simples, prazo curto.', 'famílias de renda baixa', 'popular', 3, 0.01, 1.3, 30 * B, { capex: 35 * M, meses: 20, receita: 27 * M, margem: 0.8 }),
  cpop('studios', 'Studios compactos perto do metrô', 'Studio', 'Vinte e cinco metros quadrados e localização: investidor e solteiro.', 'jovens e investidores', 'intermediario', 4, 0.03, 1.2, 15 * B, { capex: 50 * M, receita: 40 * M, margem: 0.83 }),
  cmed('residencial_clube', 'Residencial-clube', 'Residencial', 'Piscina, academia e churrasqueira: a classe média que financia.', 'famílias de classe média', 'intermediario', 3, 0, 1.2, 60 * B),
  cmed('retrofit', 'Retrofit de prédio antigo no centro', 'Edifício', 'Prédio velho virado novo: pouca concorrência, muita surpresa na obra.', 'quem quer morar no centro', 'intermediario', 1, 0.04, 1.1, 5 * B, { capex: 80 * M, meses: 24, receita: 62 * M, margem: 0.82, risco: 1.3 }),
  calt('torre_luxo', 'Torre de alto padrão', 'Torre', 'Poucas unidades, preço alto, comprador exigente — e o primeiro a sumir na crise.', 'alta renda', 'premium', 3, 0, 1, 25 * B),
  calt('condominio_fechado', 'Condomínio fechado de casas', 'Condomínio', 'Segurança, verde e terreno grande: a casa de quem saiu do apartamento.', 'famílias de alta renda', 'premium', 3, 0.02, 1, 15 * B, { capex: 260 * M, receita: 180 * M, margem: 0.84 }),
  ccom('lajes', 'Lajes corporativas para alugar', 'Centro empresarial', 'Não vende: aluga. Renda por décadas, se houver inquilino.', 'empresas', 'intermediario', 3, 0, 1, 20 * B),
  ccom('galpoes', 'Galpões logísticos', 'Galpão', 'O comércio eletrônico precisa de estoque perto da cidade.', 'varejo e transportadoras', 'intermediario', 3, 0.06, 0.9, 12 * B, { capex: 300 * M, meses: 24, receita: 52 * M, margem: 0.78, usa: 2 }),
  ccom('shopping', 'Shopping de bairro', 'Shopping', 'Lojista, cinema e estacionamento: depende do bairro e do comércio eletrônico.', 'lojistas e o bairro', 'intermediario', 3, -0.01, 1.1, 15 * B, { capex: 450 * M, receita: 70 * M, margem: 0.65 })
];

/* ------------------------------------------------------------------ Banco */
const bp = P('banco', 'pessoal', 'Crédito às pessoas', 'banco');
const bi = P('banco', 'imobiliario', 'Crédito às pessoas', 'banco');
const be = P('banco', 'empresas', 'Crédito às empresas', 'banco');
const bc = P('banco', 'cartoes', 'Cartões', 'banco');
const bv = P('banco', 'investimentos', 'Investimentos', 'banco');
const BANCO: ProdutoDoSetor13[] = [
  bp('credito_pessoal', 'Crédito pessoal sem garantia', 'Crédito', 'Juro alto, inadimplência alta.', 'quem precisa de dinheiro rápido', 'popular', 4, 0, 1.2, 150 * B),
  bp('consignado', 'Consignado (desconto em folha)', 'Consignado', 'Parcela descontada do salário ou da aposentadoria: risco baixo, juro regulado.', 'aposentados e servidores', 'popular', 5, 0.02, 1.3, 120 * B, { capex: 500 * M, receita: 300 * M, margem: 0.62 }),
  bi('financiamento_habitacional', 'Financiamento habitacional', 'Casa', 'Garantia do imóvel, prazo longo, spread curto.', 'famílias que compram a casa', 'intermediario', 3, 0, 1.1, 100 * B),
  bi('home_equity', 'Crédito com garantia de imóvel', 'Garantia', 'O imóvel quitado vira juro menor: pouca gente oferece.', 'donos de imóvel', 'intermediario', 2, 0.07, 1, 20 * B, { capex: 900 * M, receita: 260 * M, margem: 0.6 }),
  be('giro_pme', 'Capital de giro para pequenas empresas', 'Giro', 'Capital de giro e investimento: anda com a economia.', 'pequenas e médias empresas', 'intermediario', 3, 0, 1.1, 100 * B),
  be('credito_agro', 'Crédito rural', 'Agro', 'Safra, máquina e armazém: o agro paga — quando o clima ajuda.', 'produtores rurais', 'intermediario', 3, 0.05, 1, 60 * B, { capex: 1.2 * B, receita: 480 * M, margem: 0.5 }),
  bc('cartao', 'Cartão sem anuidade', 'Cartão', 'Tarifa, rotativo e uma inadimplência que não perdoa.', 'todo mundo', 'popular', 4, 0, 1.3, 80 * B),
  bc('cartao_premium', 'Cartão de alta renda', 'Black', 'Sala VIP e milhas: anuidade alta, cliente que gasta muito e paga em dia.', 'alta renda', 'premium', 4, 0.03, 0.9, 20 * B, { capex: 500 * M, receita: 420 * M, margem: 0.55 }),
  bv('fundos', 'Fundos de investimento', 'Fundos', 'Taxas sobre o que os clientes aplicam: pouco capital, muita confiança.', 'poupadores', 'intermediario', 3, 0, 1.2, 30 * B),
  bv('gestao_fortunas', 'Gestão de fortunas', 'Private', 'Poucos clientes, muito patrimônio, atendimento de alfaiate.', 'milionários', 'premium', 3, 0.04, 0.8, 10 * B, { capex: 100 * M, receita: 120 * M, margem: 0.68 }),
  bv('corretora', 'Corretora digital', 'Invest', 'Ações e renda fixa no celular, taxa zero e volume: briga de preço.', 'investidores iniciantes', 'popular', 5, 0.06, 1.5, 8 * B, { capex: 200 * M, receita: 220 * M, margem: 0.5 })
];

/* ------------------------------------------------------------------ Companhia aérea */
const ar = P('aerea', 'regional', 'Rotas domésticas', 'aerea');
const at = P('aerea', 'tronco', 'Rotas domésticas', 'aerea');
const ai = P('aerea', 'internacional', 'Rotas internacionais', 'aerea');
const ac = P('aerea', 'carga', 'Carga', 'aerea');
const AEREA: ProdutoDoSetor13[] = [
  ar('rotas_regionais', 'Rotas regionais', 'Rotas', 'Cidades médias: pouca concorrência, avião pequeno.', 'quem mora no interior', 'intermediario', 2, 0, 1.1, 10 * B),
  ar('rotas_turisticas', 'Rotas turísticas de temporada', 'Rotas', 'Praia no verão, serra no inverno: avião cheio na alta, parado na baixa.', 'turistas', 'popular', 2, 0.03, 1.5, 6 * B, { capex: 40 * M, receita: 420 * M, margem: 0.46, usa: 3 }),
  at('entre_capitais', 'Rotas entre capitais', 'Rotas', 'Muito passageiro, muita concorrência.', 'quem viaja a trabalho e a passeio', 'intermediario', 4, 0, 1.3, 40 * B),
  at('ponte_aerea', 'Ponte aérea executiva', 'Ponte', 'Horário de hora em hora, passagem cara, cliente corporativo.', 'executivos', 'premium', 4, 0.01, 0.8, 8 * B, { capex: 150 * M, receita: 1.6 * B, margem: 0.52, usa: 7 }),
  at('baixo_custo', 'Rotas de baixo custo', 'Rotas', 'Sem lanche, sem bagagem, preço de ônibus: lota — e ganha pouco.', 'quem viaja pouco', 'popular', 4, 0.03, 1.8, 20 * B, { capex: 100 * M, receita: 1.3 * B, margem: 0.4, usa: 8 }),
  ai('america_do_sul', 'Rotas para a América do Sul e o Caribe', 'Rotas', 'Avião grande, câmbio, tarifa alta.', 'turistas e negócios', 'intermediario', 3, 0, 1.2, 20 * B),
  ai('longo_curso', 'Longo curso (Europa e Estados Unidos)', 'Rotas', 'Avião de dois corredores e a disputa com as gigantes estrangeiras.', 'quem cruza o oceano', 'intermediario', 4, 0.02, 1.2, 40 * B, { capex: 500 * M, receita: 2.6 * B, margem: 0.44, usa: 8 }),
  ac('carga_expressa', 'Carga expressa (comércio eletrônico)', 'Cargo', 'Sem passageiro: e-commerce e encomenda urgente.', 'lojas virtuais e correios', 'intermediario', 3, 0, 1, 12 * B),
  ac('carga_refrigerada', 'Carga refrigerada (frutas, vacinas)', 'Cargo', 'Câmara fria a bordo: pouca gente faz, o cliente paga.', 'exportadores e laboratórios', 'premium', 2, 0.04, 0.8, 5 * B, { capex: 90 * M, receita: 420 * M, margem: 0.54 })
];

/* ------------------------------------------------------------------ Semicondutores */
const sm = P('semicondutores', 'maduros', 'Chips de tecnologia madura', 'chip');
const sme = P('semicondutores', 'memorias', 'Memórias', 'chip');
const sa = P('semicondutores', 'avancados', 'Chips avançados', 'chip');
const se = P('semicondutores', 'encapsulamento', 'Serviços', 'chip');
const SEMICONDUTORES: ProdutoDoSetor13[] = [
  sm('chips_automotivos', 'Chips automotivos', 'Chip', 'Para carros, máquinas, eletrodomésticos: volume e margem razoável.', 'montadoras', 'intermediario', 3, 0, 1, 150 * B),
  sm('microcontroladores', 'Microcontroladores', 'MCU', 'O cérebro da máquina de lavar e do controle remoto.', 'fabricantes de eletrodomésticos', 'popular', 3, 0.02, 1.2, 100 * B, { capex: 1.6 * B, meses: 22, receita: 11 * B, margem: 0.43 }),
  sm('sensores', 'Sensores e chips de potência', 'Sensor', 'Carro elétrico, painel solar, indústria: cresce com a eletrificação.', 'indústria e energia', 'intermediario', 2, 0.06, 1, 80 * B, { capex: 1.8 * B, receita: 9 * B, margem: 0.48 }),
  sme('dram', 'Memória DRAM', 'Memória', 'Commodity: margem enorme no ano bom, prejuízo no ruim.', 'fabricantes de computadores', 'popular', 4, 0, 1.6, 400 * B),
  sme('flash', 'Memória flash (SSD)', 'Flash', 'O armazenamento de tudo: preço que despenca e volta.', 'fabricantes de aparelhos', 'popular', 4, 0.03, 1.6, 300 * B, { capex: 3.5 * B, receita: 15 * B, margem: 0.4 }),
  sa('processadores', 'Processadores', 'Processador', 'O processo mais fino que existe: poucos no mundo conseguem.', 'fabricantes de computadores e celulares', 'premium', 3, 0, 1, 500 * B, { ciclo: 3 }),
  sa('chips_ia', 'Aceleradores de IA', 'Acelerador', 'O chip que treina os modelos: fila de clientes, risco técnico enorme.', 'data centers e empresas de IA', 'premium', 2, 0.12, 0.7, 300 * B, { capex: 18 * B, meses: 54, receita: 38 * B, margem: 0.6, risco: 1.2, ciclo: 2 }),
  se('encapsulamento_testes', 'Encapsulamento e testes', 'Linha', 'A etapa final, mais simples: entra antes de a fábrica ficar pronta.', 'outras fabricantes de chips', 'popular', 3, 0, 1.1, 60 * B)
];

/* ------------------------------------------------------------------ Energia */
const es = P('energia', 'solar', 'Solar', 'energia');
const ee = P('energia', 'eolica', 'Eólica', 'energia');
const eh = P('energia', 'hidreletrica', 'Hidrelétrica', 'energia');
const et = P('energia', 'termica', 'Térmica', 'energia');
const etr = P('energia', 'transmissao', 'Rede e armazenamento', 'energia');
const ENERGIA: ProdutoDoSetor13[] = [
  es('usina_solar', 'Usina solar', 'Usina', 'Rápido de construir, sem combustível.', 'o mercado de energia', 'intermediario', 3, 0, 0.9, 40 * B),
  es('geracao_distribuida', 'Geração distribuída (telhados de empresas)', 'Solar', 'Painel no telhado do cliente e conta de luz menor: contrato de dez anos.', 'comércio e indústria', 'intermediario', 4, 0.08, 1.1, 20 * B, { capex: 300 * M, meses: 12, receita: 75 * M, margem: 0.7 }),
  ee('eolica_terra', 'Parque eólico em terra', 'Parque', 'Vento do Nordeste: fator de capacidade alto.', 'o mercado de energia', 'intermediario', 3, 0, 0.9, 40 * B),
  ee('eolica_mar', 'Eólica no mar', 'Parque', 'Torres no oceano: o dobro do vento, o triplo do custo, quase ninguém faz.', 'o mercado de energia', 'premium', 1, 0.05, 0.8, 10 * B, { capex: 4 * B, meses: 54, receita: 800 * M, margem: 0.78, risco: 1.4 }),
  eh('hidreletrica_grande', 'Grande hidrelétrica', 'Usina', 'Seis anos de obra, licença ambiental difícil, energia por meio século.', 'o mercado regulado', 'intermediario', 2, 0, 0.7, 80 * B),
  eh('pch', 'Pequena central hidrelétrica', 'PCH', 'Rio pequeno, obra média, licença mais simples.', 'o mercado livre', 'intermediario', 3, 0.01, 0.8, 10 * B, { capex: 700 * M, meses: 36, receita: 140 * M, margem: 0.82, risco: 0.8, usa: 1 }),
  et('termica_gas', 'Termelétrica a gás', 'Térmica', 'Liga quando falta chuva: paga bem, queima combustível.', 'o sistema elétrico', 'intermediario', 2, 0, 0.8, 30 * B),
  et('biomassa', 'Térmica a biomassa (bagaço de cana)', 'Biomassa', 'O resto da usina de açúcar vira luz: combustível barato, safra manda.', 'o mercado de energia', 'intermediario', 2, 0.03, 0.8, 8 * B, { capex: 600 * M, receita: 260 * M, margem: 0.5 }),
  etr('linha_transmissao', 'Linha de transmissão', 'Linha', 'Receita fixa por contrato, risco baixo.', 'o sistema elétrico', 'intermediario', 2, 0, 0.6, 30 * B),
  etr('baterias', 'Armazenamento em baterias', 'Bateria', 'Guarda o sol do meio-dia para a noite: tecnologia nova, contrato novo.', 'operadoras e indústrias', 'premium', 2, 0.12, 0.9, 10 * B, { capex: 900 * M, meses: 18, receita: 220 * M, margem: 0.6, risco: 1.2 })
];

/* ------------------------------------------------------------------ Infraestrutura */
const ir = P('infraestrutura', 'rodovia', 'Transporte', 'infra');
const ip = P('infraestrutura', 'porto', 'Portos', 'infra');
const ia2 = P('infraestrutura', 'aeroporto', 'Aeroportos', 'infra');
const is = P('infraestrutura', 'saneamento', 'Saneamento', 'infra');
const INFRAESTRUTURA: ProdutoDoSetor13[] = [
  ir('concessao_rodovia', 'Concessão de rodovia', 'Rodovia', 'Pedágio por trinta anos; duplicar a pista primeiro.', 'quem passa pela estrada', 'intermediario', 1, 0, 0.6, 30 * B),
  ir('ferrovia', 'Ferrovia de carga', 'Ferrovia', 'Grão e minério sobre trilho: obra gigante, contrato longo.', 'exportadores', 'intermediario', 1, 0.04, 0.6, 20 * B, { capex: 7 * B, meses: 60, receita: 1.5 * B, margem: 0.6, risco: 1.3 }),
  ip('terminal_graos', 'Terminal de grãos', 'Terminal', 'Anda com a exportação de grãos e minério.', 'tradings e o agronegócio', 'intermediario', 3, 0, 0.8, 25 * B),
  ip('terminal_conteineres', 'Terminal de contêineres', 'Terminal', 'Importação, exportação e a disputa pelos navios grandes.', 'armadores e importadores', 'intermediario', 3, 0.02, 0.9, 20 * B, { capex: 6 * B, receita: 1.4 * B, margem: 0.5 }),
  ia2('aeroporto_grande', 'Concessão de um grande aeroporto', 'Aeroporto', 'Tarifa, lojas e estacionamento; a crise esvazia.', 'companhias aéreas e passageiros', 'intermediario', 1, 0, 0.7, 15 * B),
  ia2('aeroportos_regionais', 'Bloco de aeroportos regionais', 'Aeroportos', 'Vários aeroportos pequenos num contrato só: pouco movimento, pouco custo.', 'cidades médias', 'popular', 1, 0.02, 0.8, 4 * B, { capex: 2 * B, meses: 36, receita: 400 * M, margem: 0.45 }),
  is('agua_esgoto', 'Água e esgoto de uma região', 'Saneamento', 'Obra pesada, tarifa regulada, demanda certa.', 'a população atendida', 'popular', 1, 0, 0.4, 40 * B),
  is('dessalinizacao', 'Usina de dessalinização', 'Dessalinizadora', 'Água do mar vira água de beber: cara, essencial no semiárido.', 'estados com seca', 'intermediario', 1, 0.03, 0.5, 4 * B, { capex: 1.8 * B, meses: 30, receita: 380 * M, margem: 0.5, risco: 1.2 })
];

export const PRODUTOS_13: ProdutoDoSetor13[] = [...INDUSTRIA, ...MONTADORA, ...TECNOLOGIA, ...AEROESPACIAL, ...CONSTRUTORA, ...BANCO, ...AEREA, ...SEMICONDUTORES, ...ENERGIA, ...INFRAESTRUTURA];

export const produtoDoSetor13 = (setor: string, id: string | undefined) => (id ? PRODUTOS_13.find(p => p.setor === setor && p.id === id) : undefined);
export const produtosDoSetor13 = (setor: string) => PRODUTOS_13.filter(p => p.setor === setor);
/** O produto neutro de um item (o primeiro dele). */
export const produtoPadrao13 = (setor: string, item: string) => PRODUTOS_13.find(p => p.setor === setor && p.item === item);

/* ------------------------------------------------------------------ As empresas pequenas */

/** Um produto ou serviço da empresa pequena (sobre `PROJETOS_PEQUENOS`): o que muda é o investimento, o prazo, o ganho de procura e o custo. */
export interface ProdutoPequeno13 {
  id: string;
  tipo: TipoEmpresa;
  /** O projeto pequeno de base ('produto' ou 'online'). */
  item: 'produto' | 'online';
  nome: string;
  descricao: string;
  publico: string;
  pos: Posicionamento13;
  /** Fração do capital de uma unidade. */
  capex: number;
  meses: number;
  /** Ganho de procura com aceitação boa. */
  ganho: number;
  /** Multiplica o custo variável (o insumo do rodízio, a taxa do aplicativo). */
  variavel?: number;
  conc: number;
  cresc: number;
}

const Q = (tipo: TipoEmpresa) => (id: string, item: 'produto' | 'online', nome: string, descricao: string, publico: string, pos: Posicionamento13, capex: number, meses: number, ganho: number, conc: number, cresc: number, variavel?: number): ProdutoPequeno13 =>
  ({ id, tipo, item, nome, descricao, publico, pos, capex, meses, ganho, conc, cresc, ...(variavel ? { variavel } : {}) });
const rest = Q('restaurante');
const cli = Q('clinica');
const aca = Q('academia');
const est = Q('estudio');
const hot = Q('hotel');
const loj = Q('loja');

export const PRODUTOS_PEQUENOS_13: ProdutoPequeno13[] = [
  rest('cardapio_assinatura', 'produto', 'Um cardápio-assinatura novo', 'Pratos com a cara da casa: pode virar o motivo de vir.', 'quem já é cliente', 'intermediario', 0.06, 6, 0.16, 3, 0),
  rest('brunch', 'produto', 'Brunch de fim de semana', 'Ovos, pães e fila na calçada no domingo.', 'casais e famílias no fim de semana', 'intermediario', 0.05, 4, 0.12, 3, 0.03),
  rest('executivo', 'produto', 'Menu executivo de almoço', 'Prato do dia, preço fechado, mesa girando: volume com margem curta.', 'quem trabalha perto', 'popular', 0.03, 3, 0.15, 4, 0, 1.03),
  rest('degustacao', 'produto', 'Menu degustação', 'Oito tempos e harmonização: poucas mesas, conta alta, crítica atenta.', 'quem comemora e quem coleciona restaurantes', 'premium', 0.08, 8, 0.14, 2, 0.02, 1.04),
  rest('rodizio', 'produto', 'Rodízio', 'Come quanto quiser: atrai multidão e pesa no insumo.', 'grupos e famílias', 'popular', 0.06, 5, 0.2, 4, 0, 1.06),
  rest('bar', 'produto', 'Bar e carta de drinques', 'O drinque tem margem que o prato não tem.', 'happy hour', 'intermediario', 0.05, 4, 0.12, 4, 0.02, 0.98),
  rest('cafe_manha', 'produto', 'Café da manhã', 'Abrir mais cedo: pão na chapa e café para quem passa.', 'quem passa a caminho do trabalho', 'popular', 0.03, 3, 0.08, 3, 0.01),
  rest('congelados_casa', 'produto', 'Pratos congelados da casa', 'A comida do restaurante no freezer do cliente.', 'quem cozinha pouco', 'intermediario', 0.05, 6, 0.1, 2, 0.05),
  cli('checkup', 'produto', 'Check-up completo', 'Um dia, todos os exames, um relatório: empresas compram para os diretores.', 'empresas e quem se cuida', 'intermediario', 0.06, 6, 0.16, 3, 0.02),
  cli('odonto', 'produto', 'Odontologia', 'Cadeira, raio-x e dentista: agenda cheia o ano inteiro.', 'famílias', 'intermediario', 0.1, 8, 0.2, 4, 0.01),
  cli('estetica', 'produto', 'Estética e dermatologia', 'Procedimento particular, margem alta, público que volta.', 'quem cuida da aparência', 'premium', 0.07, 6, 0.18, 4, 0.04),
  cli('fisio', 'produto', 'Fisioterapia e reabilitação', 'Sessão semanal por meses: carteira estável.', 'quem se machucou e idosos', 'intermediario', 0.05, 5, 0.12, 3, 0.03),
  cli('imagem', 'produto', 'Exames de imagem', 'Ultrassom e tomografia: equipamento caro, procura certa.', 'pacientes encaminhados', 'intermediario', 0.2, 10, 0.25, 3, 0.02),
  cli('vacinas', 'produto', 'Sala de vacinação', 'Vacina particular: pequena, constante, traz gente nova.', 'pais e viajantes', 'popular', 0.03, 3, 0.08, 2, 0.01),
  aca('treino_novo', 'produto', 'Um programa de treino novo', 'Turmas com nome e meta: segura o aluno depois de março.', 'alunos que somem', 'intermediario', 0.06, 6, 0.16, 3, 0),
  aca('pilates', 'produto', 'Pilates', 'Aparelho caro, turma pequena, mensalidade alta.', 'adultos e quem tem dor nas costas', 'premium', 0.05, 5, 0.12, 4, 0.03),
  aca('lutas', 'produto', 'Lutas', 'Tatame e professor com nome: turma fiel.', 'jovens', 'popular', 0.03, 3, 0.1, 3, 0.01),
  aca('natacao', 'produto', 'Natação', 'Piscina aquecida: obra cara, criança e idoso o ano todo.', 'crianças e idosos', 'intermediario', 0.15, 10, 0.2, 2, 0.01),
  aca('terceira_idade', 'produto', 'Programa para a terceira idade', 'Horário da manhã que vivia vazio.', 'aposentados', 'popular', 0.02, 3, 0.1, 2, 0.04),
  est('podcast', 'produto', 'Gravação de podcasts e vídeos', 'Câmera, luz e microfone: o cliente novo não é músico.', 'criadores de conteúdo', 'intermediario', 0.06, 6, 0.16, 4, 0.04),
  est('dublagem', 'produto', 'Dublagem e locução', 'Cabine tratada e diretor de voz: série e propaganda.', 'produtoras e agências', 'intermediario', 0.08, 6, 0.15, 3, 0.02),
  est('aulas_producao', 'produto', 'Aulas de produção musical', 'O estúdio vazio de manhã vira sala de aula.', 'aspirantes a produtor', 'popular', 0.03, 3, 0.1, 3, 0.02),
  est('trilhas', 'produto', 'Trilhas para publicidade', 'Jingle e trilha sob encomenda: cliente corporativo.', 'agências de publicidade', 'intermediario', 0.04, 4, 0.14, 3, 0),
  hot('eventos_casamentos', 'produto', 'Eventos e casamentos', 'Salão, buffet e quartos para os convidados.', 'noivos e empresas', 'intermediario', 0.06, 6, 0.16, 3, 0),
  hot('spa', 'produto', 'Spa', 'Massagem e piscina aquecida: diária mais cara.', 'casais e executivos cansados', 'premium', 0.12, 8, 0.15, 3, 0.03),
  hot('pacotes', 'produto', 'Pacotes de fim de semana', 'Quarto, jantar e passeio num preço só.', 'casais e famílias', 'popular', 0.03, 3, 0.1, 3, 0.01),
  hot('restaurante_aberto', 'produto', 'Restaurante aberto ao público', 'A cozinha do hotel atende a cidade.', 'moradores da cidade', 'intermediario', 0.07, 6, 0.12, 4, 0.01),
  hot('corporativo', 'produto', 'Convênios com empresas', 'Diária negociada e quarto cheio de segunda a quinta.', 'quem viaja a trabalho', 'intermediario', 0.03, 4, 0.12, 4, 0),
  loj('marca_propria', 'produto', 'Uma linha de marca própria', 'O produto com o nome da loja: margem melhor, se o público confiar.', 'clientes fiéis', 'intermediario', 0.06, 6, 0.16, 3, 0),
  loj('linha_premium', 'produto', 'Linha premium', 'Menos peças, mais caras, vitrine melhor.', 'quem paga por qualidade', 'premium', 0.06, 5, 0.1, 3, 0.02, 0.96),
  loj('outlet', 'produto', 'Outlet de ponta de estoque', 'Encalhe vira venda: gente nova, margem menor.', 'quem caça desconto', 'popular', 0.03, 3, 0.14, 4, 0.01, 1.05),
  loj('assinatura', 'produto', 'Clube de assinatura mensal', 'Uma caixa por mês: receita previsível.', 'clientes fiéis', 'intermediario', 0.04, 5, 0.1, 2, 0.05)
];

export const produtosPequenos13 = (tipo: string) => PRODUTOS_PEQUENOS_13.filter(p => p.tipo === tipo);
export const produtoPequeno13 = (tipo: string, id: string | undefined) => (id ? PRODUTOS_PEQUENOS_13.find(p => p.tipo === tipo && p.id === id) : undefined);
