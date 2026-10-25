/**
 * REWORK 12 — AS PEÇAS DE COLEÇÃO: relógios, joias, arte, antiguidades e memorabilia esportiva.
 *
 * O que separa uma peça da outra não é o nome: é a RARIDADE (quantas existem), a PROCEDÊNCIA (de onde veio, quem
 * garante) e o MERCADO dela (quem compra de volta, e por quanto). Cada peça diz:
 *   - `preco`: o que se paga na loja, na galeria ou no lote (reais de poder de compra de hoje; o país ajusta);
 *   - `retencao`: quanto do preço pago ela vale logo depois da compra, no mercado de revenda. O relógio de série
 *     da vitrine vale a metade ao sair da loja; o Daytona, que tem fila, vale o que custou; a tela de um artista
 *     novo vale o que a galeria conseguir revender (pouco), até o artista acontecer — ou não;
 *   - `tendencia` e `oscila`: para onde o valor anda num ano típico, e o quanto oscila (sem garantia: a média
 *     de décadas não é o ano que vem).
 *
 * Nada aqui melhora a pessoa: um relógio caro não deixa ninguém mais competente. O que a peça dá é o gosto de
 * ter, a história que ela carrega e, às vezes, dinheiro — ou prejuízo — na hora de vender.
 */

import type { CategoriaColecao, RaridadeColecao } from '../tipos';

export type LojaDeColecao = 'relojoaria' | 'joalheria' | 'galeria' | 'antiquario' | 'memorabilia' | 'leilao';

export interface PecaDeColecao {
  id: string;
  nome: string;
  /** "o", "a", "os", "as" — para a frase. */
  artigo: 'o' | 'a' | 'os' | 'as';
  categoria: CategoriaColecao;
  raridade: RaridadeColecao;
  loja: LojaDeColecao;
  /** Preço de referência (Brasil). */
  preco: number;
  retencao: number;
  /** Para onde o valor anda num ano típico (real) e o quanto oscila. */
  tendencia: number;
  oscila: number;
  descricao: string;
  /** A boutique só vende para cliente antigo (lista de espera): pede patrimônio. */
  patrimonioMin?: number;
  /** Memorabilia: o nome sai de um clube do país (`{clube}`) e de uma temporada (`{ano}`). */
  modelo?: string;
  /** Sem certificado (a camisa "da final" vendida na calçada): vale como réplica, não como a lenda. */
  semCertificado?: boolean;
  /**
   * REWORK 12.2 — o que se pode verificar numa peça: quem fez (fabricante, artista, oficina), quando, de quê; a FAIXA
   * do mercado (1 premium acessível · 2 luxo · 3 alto luxo · 4 rara · 5 excepcional · 6 histórica e única); a
   * LIQUIDEZ (o Rolex vende em uma semana; a tela de museu, em um ano e com desconto, se tiver pressa).
   */
  fabricante?: string;
  periodo?: string;
  material?: string;
  faixa?: 1 | 2 | 3 | 4 | 5 | 6;
  liquidez?: 'alta' | 'media' | 'baixa';
  /** Peça histórica única: uma só no mundo (nunca duas na mesma continuidade). */
  unica?: boolean;
  /** Só sob consulta (venda privada) ou no leilão especial da temporada. */
  canal?: 'privada' | 'especial';
}

export const NOME_CATEGORIA_COLECAO: Record<CategoriaColecao, { um: string; varios: string }> = {
  arte: { um: 'obra de arte', varios: 'Arte' },
  relogio: { um: 'relógio', varios: 'Relógios' },
  joia: { um: 'joia', varios: 'Joias' },
  antiguidade: { um: 'antiguidade', varios: 'Antiguidades' },
  memorabilia: { um: 'peça de memorabilia', varios: 'Memorabilia esportiva' }
};

export const NOME_RARIDADE: Record<RaridadeColecao, string> = { comum: 'de série', incomum: 'pouco comum', rara: 'rara', unica: 'peça única' };

export const LOJAS_DE_COLECAO: Record<LojaDeColecao, { nome: string; frase: string; cidadeGrande: boolean }> = {
  relojoaria: { nome: 'Relojoaria', frase: 'Vitrine de vidro, luz baixa, um vendedor de luvas. Os de série saem hoje; os de fila, só para cliente antigo.', cidadeGrande: false },
  joalheria: { nome: 'Joalheria', frase: 'Ouro, pedra, a caixinha de veludo. Quanto mais pedra, menos se recupera na revenda.', cidadeGrande: false },
  galeria: { nome: 'Galeria de arte', frase: 'Paredes brancas, uma obra por parede, preço só perguntando. O artista novo é aposta; o consagrado, patrimônio.', cidadeGrande: true },
  antiquario: { nome: 'Antiquário', frase: 'Cheiro de madeira velha, cada peça com uma história — algumas verdadeiras.', cidadeGrande: false },
  memorabilia: { nome: 'Loja de memorabilia', frase: 'Camisas emolduradas, bolas autografadas, ingressos de finais. A carta do clube é o que separa a relíquia da réplica.', cidadeGrande: true },
  leilao: { nome: 'Casa de leilões', frase: 'Catálogo do ano, lance a lance. Sobre o martelo, a comissão da casa (20%). As peças únicas aparecem aqui.', cidadeGrande: true }
};

export const PECAS_DE_COLECAO: readonly PecaDeColecao[] = [
  // ------------------------------------------------------------ relógios
  { id: 'rel_seiko_presage', nome: 'relógio automático Seiko Presage', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 4500, retencao: 0.5, tendencia: -0.02, oscila: 0.03, fabricante: 'Seiko', periodo: 'atual', material: 'aço e esmalte', faixa: 1, liquidez: 'media', descricao: 'Automático, mostrador esmaltado. Bonito de usar; revende-se pela metade.' },
  { id: 'rel_tag_carrera', nome: 'TAG Heuer Carrera', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 38000, retencao: 0.55, tendencia: -0.01, oscila: 0.04, fabricante: 'TAG Heuer', periodo: 'atual', material: 'aço', faixa: 2, liquidez: 'media', descricao: 'Cronógrafo suíço de vitrine. Perde bastante ao sair da loja.' },
  { id: 'rel_omega_speedmaster', nome: 'Omega Speedmaster', artigo: 'o', categoria: 'relogio', raridade: 'incomum', loja: 'relojoaria', preco: 55000, retencao: 0.78, tendencia: 0.005, oscila: 0.05, fabricante: 'Omega', periodo: 'atual', material: 'aço', faixa: 2, liquidez: 'alta', descricao: 'O relógio que foi à Lua. Segura bem o valor.' },
  { id: 'rel_rolex_submariner', nome: 'Rolex Submariner', artigo: 'o', categoria: 'relogio', raridade: 'incomum', loja: 'relojoaria', preco: 95000, retencao: 0.95, tendencia: 0.015, oscila: 0.07, fabricante: 'Rolex', periodo: 'atual', material: 'aço Oystersteel', faixa: 2, liquidez: 'alta', descricao: 'O clássico de mergulho. Tem procura no mercado de segunda mão.' },
  { id: 'rel_rolex_daytona', nome: 'Rolex Daytona', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 220000, retencao: 1.0, tendencia: 0.015, oscila: 0.09, patrimonioMin: 2_000_000, fabricante: 'Rolex', periodo: 'atual', material: 'aço e cerâmica', faixa: 3, liquidez: 'alta', descricao: 'Fila de espera de anos: a boutique só oferece para quem já é cliente — e patrimônio conta.' },
  { id: 'rel_patek_nautilus', nome: 'Patek Philippe Nautilus', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 900000, retencao: 1.05, tendencia: 0.01, oscila: 0.12, patrimonioMin: 10_000_000, fabricante: 'Patek Philippe', periodo: 'atual', material: 'aço', faixa: 3, liquidez: 'alta', descricao: 'Vale mais na revenda do que na loja — enquanto a moda durar. Já caiu 40% em um ano.' },
  // ------------------------------------------------------------ joias
  { id: 'joia_corrente_ouro', nome: 'corrente de ouro 18 quilates', artigo: 'a', categoria: 'joia', raridade: 'comum', loja: 'joalheria', preco: 6000, retencao: 0.7, tendencia: 0.01, oscila: 0.08, fabricante: 'ourives da casa', material: 'ouro 18k', faixa: 1, liquidez: 'alta', descricao: 'O ouro é o que segura o valor; o feitio, a joalheria fica.' },
  { id: 'joia_brinco_brilhante', nome: 'brincos de brilhante', artigo: 'os', categoria: 'joia', raridade: 'comum', loja: 'joalheria', preco: 18000, retencao: 0.45, tendencia: -0.01, oscila: 0.03, fabricante: 'joalheria da casa', material: 'ouro branco e brilhantes', faixa: 2, liquidez: 'baixa', descricao: 'Brilham na festa; na revenda, a pedra pequena vale pouco.' },
  { id: 'joia_colar_perolas', nome: 'colar de pérolas', artigo: 'o', categoria: 'joia', raridade: 'incomum', loja: 'joalheria', preco: 35000, retencao: 0.45, tendencia: -0.005, oscila: 0.04, fabricante: 'joalheria da casa', material: 'pérolas cultivadas', faixa: 2, liquidez: 'baixa', descricao: 'Pérolas cultivadas, fio longo. Joia de herdar.' },
  { id: 'joia_anel_diamante', nome: 'anel de diamante de dois quilates', artigo: 'o', categoria: 'joia', raridade: 'rara', loja: 'joalheria', preco: 120000, retencao: 0.55, tendencia: -0.01, oscila: 0.05, fabricante: 'joalheria da casa', material: 'platina e diamante de 2 ct', faixa: 3, liquidez: 'media', descricao: 'Certificado da pedra, aro de platina. O diamante revende abaixo do que se pensa.' },
  // ------------------------------------------------------------ arte
  { id: 'arte_gravura', nome: 'gravura numerada', artigo: 'a', categoria: 'arte', raridade: 'comum', loja: 'galeria', preco: 3500, retencao: 0.5, tendencia: 0, oscila: 0.06, fabricante: 'artista representado pela galeria', periodo: 'contemporânea', material: 'gravura em metal', faixa: 1, liquidez: 'baixa', descricao: 'Tiragem de 50, assinada. Arte na parede sem drama.' },
  { id: 'arte_tela_jovem', nome: 'tela de um artista em começo de carreira', artigo: 'a', categoria: 'arte', raridade: 'incomum', loja: 'galeria', preco: 18000, retencao: 0.45, tendencia: 0, oscila: 0.22, fabricante: 'artista em começo de carreira', periodo: 'contemporânea', material: 'acrílica sobre tela', faixa: 2, liquidez: 'baixa', descricao: 'Aposta: se o artista acontecer, vale dez vezes; se sumir, vale a moldura.' },
  { id: 'arte_escultura', nome: 'escultura em bronze', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 140000, retencao: 0.65, tendencia: 0.01, oscila: 0.08, fabricante: 'escultor estabelecido', periodo: 'contemporânea', material: 'bronze, edição de 8', faixa: 3, liquidez: 'baixa', descricao: 'Peça de artista estabelecido, edição de oito.' },
  { id: 'arte_tela_consagrada', nome: 'tela de um artista consagrado', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 280000, retencao: 0.7, tendencia: 0.015, oscila: 0.09, fabricante: 'artista consagrado', periodo: 'anos 1970', material: 'óleo sobre tela', faixa: 3, liquidez: 'media', descricao: 'Nome de museu, mercado firme. Mesmo assim, a galeria fica com a margem dela.' },
  { id: 'arte_modernista', nome: 'óleo modernista', artigo: 'o', categoria: 'arte', raridade: 'unica', loja: 'leilao', preco: 2_800_000, retencao: 0.85, tendencia: 0.015, oscila: 0.1, fabricante: 'pintor modernista', periodo: 'anos 1930', material: 'óleo sobre tela', faixa: 4, liquidez: 'baixa', descricao: 'Peça de catálogo raisonné, procedência documentada. Lote principal da temporada.' },
  // ------------------------------------------------------------ antiguidades
  { id: 'ant_maquina_escrever', nome: 'máquina de escrever dos anos 1950', artigo: 'a', categoria: 'antiguidade', raridade: 'comum', loja: 'antiquario', preco: 2500, retencao: 0.55, tendencia: 0, oscila: 0.05, fabricante: 'fábrica europeia', periodo: 'anos 1950', material: 'ferro e esmalte', faixa: 1, liquidez: 'media', descricao: 'Funciona. O barulho também.' },
  { id: 'ant_relogio_parede', nome: 'relógio de parede de carrilhão', artigo: 'o', categoria: 'antiguidade', raridade: 'comum', loja: 'antiquario', preco: 8000, retencao: 0.55, tendencia: 0, oscila: 0.05, fabricante: 'relojoaria alemã', periodo: 'início do século XX', material: 'madeira e latão', faixa: 1, liquidez: 'media', descricao: 'Badala de hora em hora. Pede relojoeiro uma vez por ano.' },
  { id: 'ant_prataria', nome: 'serviço de chá em prata', artigo: 'o', categoria: 'antiguidade', raridade: 'incomum', loja: 'antiquario', preco: 15000, retencao: 0.65, tendencia: 0.005, oscila: 0.06, fabricante: 'ourives do Porto', periodo: 'século XIX', material: 'prata de lei', faixa: 2, liquidez: 'media', descricao: 'Prata de lei, marca do ourives. O metal segura parte do valor.' },
  { id: 'ant_movel_colonial', nome: 'cômoda colonial de jacarandá', artigo: 'a', categoria: 'antiguidade', raridade: 'incomum', loja: 'antiquario', preco: 26000, retencao: 0.6, tendencia: 0, oscila: 0.06, fabricante: 'marcenaria colonial', periodo: 'século XVIII', material: 'jacarandá', faixa: 2, liquidez: 'baixa', descricao: 'Madeira que não se acha mais, gaveta que range.' },
  { id: 'ant_mapa_antigo', nome: 'mapa impresso no século XVIII', artigo: 'o', categoria: 'antiguidade', raridade: 'rara', loja: 'antiquario', preco: 45000, retencao: 0.7, tendencia: 0.01, oscila: 0.07, fabricante: 'cartógrafo holandês', periodo: 'século XVIII', material: 'gravura em cobre aquarelada', faixa: 2, liquidez: 'media', descricao: 'Gravura em cobre, colorida à mão. Com laudo de um especialista.' },
  // ------------------------------------------------------------ memorabilia (o clube e o ano saem do país)
  { id: 'mem_camisa_retro', nome: 'camisa retrô', modelo: 'camisa retrô {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'comum', loja: 'memorabilia', preco: 900, retencao: 0.35, tendencia: 0, oscila: 0.04, material: 'tecido sintético', faixa: 1, liquidez: 'media', descricao: 'Réplica licenciada de uma camisa antiga. É de vestir, não de guardar.' },
  { id: 'mem_ingresso_final', nome: 'ingresso de final', modelo: 'ingresso da final de {ano}, {doClube}', artigo: 'o', categoria: 'memorabilia', raridade: 'incomum', loja: 'memorabilia', preco: 1200, retencao: 0.7, tendencia: 0.01, oscila: 0.1, material: 'papel', faixa: 1, liquidez: 'media', descricao: 'Papel amarelado, o canhoto inteiro. Vale pela final que foi.' },
  { id: 'mem_bola_autografada', nome: 'bola autografada pelo elenco', modelo: 'bola autografada pelo elenco {doClube} campeão em {ano}', artigo: 'a', categoria: 'memorabilia', raridade: 'incomum', loja: 'memorabilia', preco: 6000, retencao: 0.65, tendencia: 0.01, oscila: 0.12, material: 'couro e tinta', faixa: 1, liquidez: 'media', descricao: 'Com certificado de autenticidade do clube.' },
  { id: 'mem_chuteira_jogo', nome: 'chuteira usada em jogo', modelo: 'chuteira usada em jogo por um ídolo {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'rara', loja: 'memorabilia', preco: 15000, retencao: 0.7, tendencia: 0.015, oscila: 0.14, material: 'couro', faixa: 2, liquidez: 'media', descricao: 'Com a carta do clube e a foto do jogo.' },
  { id: 'mem_camisa_historica', nome: 'camisa usada numa final histórica', modelo: 'camisa usada na final de {ano} {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'rara', loja: 'leilao', preco: 48000, retencao: 0.8, tendencia: 0.02, oscila: 0.15, material: 'algodão', faixa: 2, liquidez: 'media', descricao: 'Lote com a procedência: a súmula, a foto, a carta do clube. É a camisa — não uma igual.' },
  { id: 'mem_camisa_calcada', nome: 'camisa "da final", vendida na calçada', modelo: 'camisa "da final de {ano}" {doClube}, sem procedência', artigo: 'a', categoria: 'memorabilia', raridade: 'comum', loja: 'memorabilia', preco: 450, retencao: 0.25, tendencia: -0.02, oscila: 0.05, semCertificado: true, material: 'tecido sintético', faixa: 1, liquidez: 'baixa', descricao: 'O vendedor jura que é a original. Sem papel nenhum, vale o que vale uma réplica.' },
  // ------------------------------------------------------------ leilão (peças de catálogo)
  { id: 'rel_vintage_leilao', nome: 'cronógrafo vintage dos anos 1960', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'leilao', preco: 380000, retencao: 0.82, tendencia: 0.015, oscila: 0.12, fabricante: 'manufatura suíça', periodo: 'anos 1960', material: 'aço', faixa: 3, liquidez: 'media', descricao: 'Mostrador original, caixa nunca polida — é o que os colecionadores procuram.' },
  { id: 'ant_porcelana_leilao', nome: 'vaso de porcelana do século XIX', artigo: 'o', categoria: 'antiguidade', raridade: 'rara', loja: 'leilao', preco: 160000, retencao: 0.8, tendencia: 0.005, oscila: 0.1, fabricante: 'manufatura real', periodo: 'século XIX', material: 'porcelana', faixa: 3, liquidez: 'media', descricao: 'Marca de manufatura real, restauro mínimo, procedência de uma coleção conhecida.' },

  // ------------------------------------------------------------ REWORK 12.2 · as faixas de cima (e as de baixo que faltavam)
  { id: 'rel_tissot', nome: 'Tissot automático', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 3200, retencao: 0.45, tendencia: -0.02, oscila: 0.03, fabricante: 'Tissot', periodo: 'atual', material: 'aço', faixa: 1, liquidez: 'media', descricao: 'Suíço de entrada: automático honesto, revenda pela metade.' },
  { id: 'rel_cartier_tank', nome: 'Cartier Tank', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 62000, retencao: 0.62, tendencia: 0, oscila: 0.04, fabricante: 'Cartier', periodo: 'atual', material: 'ouro amarelo', faixa: 2, liquidez: 'media', descricao: 'Caixa retangular de 1917, ainda igual. Elegância que não sai de moda — nem valoriza.' },
  { id: 'rel_lange_datograph', nome: 'A. Lange & Söhne Datograph', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 620000, retencao: 0.8, tendencia: 0.01, oscila: 0.07, patrimonioMin: 6_000_000, fabricante: 'A. Lange & Söhne', periodo: 'atual', material: 'platina', faixa: 3, liquidez: 'media', descricao: 'Cronógrafo de manufatura alemã, acabamento à mão. Quem entende, sabe.' },
  { id: 'rel_ap_royal_oak', nome: 'Audemars Piguet Royal Oak', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 780000, retencao: 0.95, tendencia: 0.008, oscila: 0.12, patrimonioMin: 8_000_000, fabricante: 'Audemars Piguet', periodo: 'atual', material: 'aço', faixa: 3, liquidez: 'alta', descricao: 'O octógono com parafusos à mostra. Fila de espera e mercado nervoso.' },
  { id: 'rel_patek_perpetuo', nome: 'Patek Philippe de calendário perpétuo', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 3_400_000, retencao: 0.85, tendencia: 0.012, oscila: 0.08, patrimonioMin: 30_000_000, canal: 'privada', fabricante: 'Patek Philippe', periodo: 'atual', material: 'ouro rosa', faixa: 4, liquidez: 'media', descricao: 'Grande complicação: sabe o ano bissexto até 2100. Oferecido só a quem a casa conhece.' },
  { id: 'rel_rm_tourbillon', nome: 'Richard Mille de turbilhão, edição limitada', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 6_500_000, retencao: 0.8, tendencia: 0, oscila: 0.15, patrimonioMin: 60_000_000, canal: 'privada', fabricante: 'Richard Mille', periodo: 'atual', material: 'carbono e titânio', faixa: 5, liquidez: 'media', descricao: 'Trinta exemplares no mundo. Leve como uma moeda; o preço, não.' },
  { id: 'rel_bolso_complicacao', nome: 'relógio de bolso de grande complicação de 1925', artigo: 'o', categoria: 'relogio', raridade: 'unica', loja: 'leilao', preco: 95_000_000, retencao: 0.85, tendencia: 0.012, oscila: 0.1, patrimonioMin: 500_000_000, canal: 'especial', unica: true, fabricante: 'manufatura de Genebra, sob encomenda', periodo: '1925', material: 'ouro amarelo, 24 complicações', faixa: 6, liquidez: 'baixa', descricao: 'Feito para um banqueiro que queria o relógio mais complicado do mundo. Trocou de dono três vezes num século.' },
  { id: 'joia_pulseira_ouro', nome: 'pulseira de ouro trabalhado', artigo: 'a', categoria: 'joia', raridade: 'comum', loja: 'joalheria', preco: 3800, retencao: 0.65, tendencia: 0.01, oscila: 0.08, fabricante: 'ourives da casa', material: 'ouro 18k', faixa: 1, liquidez: 'alta', descricao: 'O ouro segura quase tudo; o desenho, a casa fica.' },
  { id: 'joia_anel_esmeralda', nome: 'anel de esmeralda colombiana', artigo: 'o', categoria: 'joia', raridade: 'incomum', loja: 'joalheria', preco: 95000, retencao: 0.55, tendencia: 0, oscila: 0.05, fabricante: 'joalheria da casa', material: 'ouro e esmeralda de 3 ct', faixa: 2, liquidez: 'media', descricao: 'A cor da pedra é o preço. Com laudo de origem, vale mais.' },
  { id: 'joia_colar_alta', nome: 'colar de alta joalheria', artigo: 'o', categoria: 'joia', raridade: 'rara', loja: 'joalheria', preco: 1_900_000, retencao: 0.55, tendencia: 0, oscila: 0.05, patrimonioMin: 15_000_000, canal: 'privada', fabricante: 'maison de alta joalheria', periodo: 'atual', material: 'platina, 40 ct de diamantes', faixa: 4, liquidez: 'baixa', descricao: 'Peça única de coleção de temporada. Na revenda, a casa não está mais lá para garantir o preço.' },
  { id: 'joia_diamante_rosa', nome: 'diamante rosa de cinco quilates', artigo: 'o', categoria: 'joia', raridade: 'rara', loja: 'joalheria', preco: 28_000_000, retencao: 0.8, tendencia: 0.015, oscila: 0.09, patrimonioMin: 120_000_000, canal: 'privada', fabricante: 'lapidação de Antuérpia', material: 'diamante rosa intenso, 5 ct', faixa: 5, liquidez: 'baixa', descricao: 'A mina que dava pedras assim fechou. O que existe, é o que existe.' },
  { id: 'joia_tiara_real', nome: 'tiara de uma casa real do século XIX', artigo: 'a', categoria: 'joia', raridade: 'unica', loja: 'leilao', preco: 110_000_000, retencao: 0.85, tendencia: 0.01, oscila: 0.08, patrimonioMin: 600_000_000, canal: 'especial', unica: true, fabricante: 'joalheiro da corte', periodo: '1860', material: 'prata sobre ouro, diamantes antigos', faixa: 6, liquidez: 'baixa', descricao: 'Usada em três coroações, vendida por uma família que precisou. A procedência é a peça.' },
  { id: 'arte_fotografia', nome: 'fotografia de autor, tiragem de 10', artigo: 'a', categoria: 'arte', raridade: 'comum', loja: 'galeria', preco: 9000, retencao: 0.45, tendencia: 0, oscila: 0.07, fabricante: 'fotógrafo representado pela galeria', periodo: 'contemporânea', material: 'impressão em papel algodão', faixa: 1, liquidez: 'baixa', descricao: 'Tiragem numerada e assinada. Bonita na parede; a revenda é outra conversa.' },
  { id: 'arte_mestre_nacional', nome: 'tela de um mestre modernista do país', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 4_800_000, retencao: 0.75, tendencia: 0.015, oscila: 0.1, patrimonioMin: 25_000_000, canal: 'privada', fabricante: 'mestre modernista', periodo: 'anos 1940', material: 'óleo sobre tela', faixa: 4, liquidez: 'baixa', descricao: 'Catalogada, exposta em retrospectiva. A galeria só mostra a quem pode comprar.' },
  { id: 'arte_pos_guerra', nome: 'obra de um mestre do pós-guerra internacional', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 32_000_000, retencao: 0.78, tendencia: 0.012, oscila: 0.12, patrimonioMin: 150_000_000, canal: 'privada', fabricante: 'mestre do expressionismo abstrato', periodo: 'anos 1950', material: 'óleo e esmalte sobre tela', faixa: 5, liquidez: 'baixa', descricao: 'Do tipo que sai em capa de catálogo de leilão. Vender com pressa custa um terço.' },
  { id: 'arte_impressionista', nome: 'paisagem de um mestre impressionista francês', artigo: 'a', categoria: 'arte', raridade: 'unica', loja: 'leilao', preco: 420_000_000, retencao: 0.85, tendencia: 0.015, oscila: 0.1, patrimonioMin: 2_000_000_000, canal: 'especial', unica: true, fabricante: 'mestre impressionista', periodo: '1890', material: 'óleo sobre tela', faixa: 6, liquidez: 'baixa', descricao: 'Ficou cem anos na mesma família. Cada dono está anotado no verso da moldura.' },
  { id: 'arte_renascentista', nome: 'retrato atribuído a um mestre florentino', artigo: 'o', categoria: 'arte', raridade: 'unica', loja: 'leilao', preco: 180_000_000, retencao: 0.8, tendencia: 0.01, oscila: 0.14, patrimonioMin: 900_000_000, canal: 'especial', unica: true, fabricante: 'oficina florentina (atribuição)', periodo: 'c. 1500', material: 'têmpera e óleo sobre madeira', faixa: 6, liquidez: 'baixa', descricao: '"Atribuído": metade dos especialistas assina, metade não. O preço é a aposta na metade que assina.' },
  { id: 'ant_mesa_ebanista', nome: 'mesa de um ebanista do século XVIII', artigo: 'a', categoria: 'antiguidade', raridade: 'rara', loja: 'antiquario', preco: 420000, retencao: 0.7, tendencia: 0.005, oscila: 0.06, patrimonioMin: 4_000_000, fabricante: 'ebanista da corte francesa', periodo: 'século XVIII', material: 'marchetaria e bronze dourado', faixa: 3, liquidez: 'baixa', descricao: 'Assinada debaixo do tampo. O laudo do especialista vale metade do preço.' },
  { id: 'ant_manuscrito', nome: 'manuscrito iluminado medieval', artigo: 'o', categoria: 'antiguidade', raridade: 'rara', loja: 'antiquario', preco: 2_600_000, retencao: 0.75, tendencia: 0.012, oscila: 0.07, patrimonioMin: 20_000_000, canal: 'privada', fabricante: 'scriptorium monástico', periodo: 'século XV', material: 'pergaminho, ouro e pigmentos', faixa: 4, liquidez: 'baixa', descricao: 'Livro de horas completo, com a encadernação original. Pede clima controlado.' },
  { id: 'ant_diario_expedicao', nome: 'diário de bordo de uma expedição científica de 1838', artigo: 'o', categoria: 'antiguidade', raridade: 'unica', loja: 'leilao', preco: 9_000_000, retencao: 0.85, tendencia: 0.012, oscila: 0.08, patrimonioMin: 80_000_000, canal: 'especial', unica: true, fabricante: 'o capitão da expedição', periodo: '1838', material: 'papel, couro e tinta ferrogálica', faixa: 5, liquidez: 'baixa', descricao: 'Desenhos de espécies que ninguém tinha descrito. Três universidades já pediram para estudar.' },
  { id: 'mem_camisa_copa', nome: 'camisa de jogo de uma final de Copa do Mundo', artigo: 'a', categoria: 'memorabilia', raridade: 'rara', loja: 'memorabilia', preco: 680000, retencao: 0.78, tendencia: 0.02, oscila: 0.14, patrimonioMin: 5_000_000, material: 'algodão', faixa: 3, liquidez: 'media', descricao: 'Com a carta da federação e a foto do jogo. Do tipo que só aparece uma vez por década.' },
  { id: 'mem_taca_original', nome: 'taça original de um campeonato dos anos 1930', artigo: 'a', categoria: 'memorabilia', raridade: 'unica', loja: 'leilao', preco: 7_500_000, retencao: 0.85, tendencia: 0.015, oscila: 0.1, patrimonioMin: 60_000_000, canal: 'especial', unica: true, fabricante: 'ourivesaria italiana', periodo: '1934', material: 'prata dourada', faixa: 5, liquidez: 'baixa', descricao: 'A taça que o campeão levou para casa antes de existirem réplicas. Sumiu por quarenta anos.' }
];

export const pecaDeColecao = (id: string) => PECAS_DE_COLECAO.find(p => p.id === id);
