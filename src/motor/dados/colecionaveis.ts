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
  { id: 'rel_seiko_presage', nome: 'relógio automático Seiko Presage', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 4500, retencao: 0.5, tendencia: -0.02, oscila: 0.03, descricao: 'Automático, mostrador esmaltado. Bonito de usar; revende-se pela metade.' },
  { id: 'rel_tag_carrera', nome: 'TAG Heuer Carrera', artigo: 'o', categoria: 'relogio', raridade: 'comum', loja: 'relojoaria', preco: 38000, retencao: 0.55, tendencia: -0.01, oscila: 0.04, descricao: 'Cronógrafo suíço de vitrine. Perde bastante ao sair da loja.' },
  { id: 'rel_omega_speedmaster', nome: 'Omega Speedmaster', artigo: 'o', categoria: 'relogio', raridade: 'incomum', loja: 'relojoaria', preco: 55000, retencao: 0.78, tendencia: 0.005, oscila: 0.05, descricao: 'O relógio que foi à Lua. Segura bem o valor.' },
  { id: 'rel_rolex_submariner', nome: 'Rolex Submariner', artigo: 'o', categoria: 'relogio', raridade: 'incomum', loja: 'relojoaria', preco: 95000, retencao: 0.95, tendencia: 0.015, oscila: 0.07, descricao: 'O clássico de mergulho. Tem procura no mercado de segunda mão.' },
  { id: 'rel_rolex_daytona', nome: 'Rolex Daytona', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 220000, retencao: 1.0, tendencia: 0.015, oscila: 0.09, patrimonioMin: 2_000_000, descricao: 'Fila de espera de anos: a boutique só oferece para quem já é cliente — e patrimônio conta.' },
  { id: 'rel_patek_nautilus', nome: 'Patek Philippe Nautilus', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'relojoaria', preco: 900000, retencao: 1.05, tendencia: 0.01, oscila: 0.12, patrimonioMin: 10_000_000, descricao: 'Vale mais na revenda do que na loja — enquanto a moda durar. Já caiu 40% em um ano.' },
  // ------------------------------------------------------------ joias
  { id: 'joia_corrente_ouro', nome: 'corrente de ouro 18 quilates', artigo: 'a', categoria: 'joia', raridade: 'comum', loja: 'joalheria', preco: 6000, retencao: 0.7, tendencia: 0.01, oscila: 0.08, descricao: 'O ouro é o que segura o valor; o feitio, a joalheria fica.' },
  { id: 'joia_brinco_brilhante', nome: 'brincos de brilhante', artigo: 'os', categoria: 'joia', raridade: 'comum', loja: 'joalheria', preco: 18000, retencao: 0.45, tendencia: -0.01, oscila: 0.03, descricao: 'Brilham na festa; na revenda, a pedra pequena vale pouco.' },
  { id: 'joia_colar_perolas', nome: 'colar de pérolas', artigo: 'o', categoria: 'joia', raridade: 'incomum', loja: 'joalheria', preco: 35000, retencao: 0.45, tendencia: -0.005, oscila: 0.04, descricao: 'Pérolas cultivadas, fio longo. Joia de herdar.' },
  { id: 'joia_anel_diamante', nome: 'anel de diamante de dois quilates', artigo: 'o', categoria: 'joia', raridade: 'rara', loja: 'joalheria', preco: 120000, retencao: 0.55, tendencia: -0.01, oscila: 0.05, descricao: 'Certificado da pedra, aro de platina. O diamante revende abaixo do que se pensa.' },
  // ------------------------------------------------------------ arte
  { id: 'arte_gravura', nome: 'gravura numerada', artigo: 'a', categoria: 'arte', raridade: 'comum', loja: 'galeria', preco: 3500, retencao: 0.5, tendencia: 0, oscila: 0.06, descricao: 'Tiragem de 50, assinada. Arte na parede sem drama.' },
  { id: 'arte_tela_jovem', nome: 'tela de um artista em começo de carreira', artigo: 'a', categoria: 'arte', raridade: 'incomum', loja: 'galeria', preco: 18000, retencao: 0.45, tendencia: 0, oscila: 0.22, descricao: 'Aposta: se o artista acontecer, vale dez vezes; se sumir, vale a moldura.' },
  { id: 'arte_escultura', nome: 'escultura em bronze', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 140000, retencao: 0.65, tendencia: 0.01, oscila: 0.08, descricao: 'Peça de artista estabelecido, edição de oito.' },
  { id: 'arte_tela_consagrada', nome: 'tela de um artista consagrado', artigo: 'a', categoria: 'arte', raridade: 'rara', loja: 'galeria', preco: 280000, retencao: 0.7, tendencia: 0.015, oscila: 0.09, descricao: 'Nome de museu, mercado firme. Mesmo assim, a galeria fica com a margem dela.' },
  { id: 'arte_modernista', nome: 'óleo modernista', artigo: 'o', categoria: 'arte', raridade: 'unica', loja: 'leilao', preco: 2_800_000, retencao: 0.85, tendencia: 0.015, oscila: 0.1, descricao: 'Peça de catálogo raisonné, procedência documentada. Lote principal da temporada.' },
  // ------------------------------------------------------------ antiguidades
  { id: 'ant_maquina_escrever', nome: 'máquina de escrever dos anos 1950', artigo: 'a', categoria: 'antiguidade', raridade: 'comum', loja: 'antiquario', preco: 2500, retencao: 0.55, tendencia: 0, oscila: 0.05, descricao: 'Funciona. O barulho também.' },
  { id: 'ant_relogio_parede', nome: 'relógio de parede de carrilhão', artigo: 'o', categoria: 'antiguidade', raridade: 'comum', loja: 'antiquario', preco: 8000, retencao: 0.55, tendencia: 0, oscila: 0.05, descricao: 'Badala de hora em hora. Pede relojoeiro uma vez por ano.' },
  { id: 'ant_prataria', nome: 'serviço de chá em prata', artigo: 'o', categoria: 'antiguidade', raridade: 'incomum', loja: 'antiquario', preco: 15000, retencao: 0.65, tendencia: 0.005, oscila: 0.06, descricao: 'Prata de lei, marca do ourives. O metal segura parte do valor.' },
  { id: 'ant_movel_colonial', nome: 'cômoda colonial de jacarandá', artigo: 'a', categoria: 'antiguidade', raridade: 'incomum', loja: 'antiquario', preco: 26000, retencao: 0.6, tendencia: 0, oscila: 0.06, descricao: 'Madeira que não se acha mais, gaveta que range.' },
  { id: 'ant_mapa_antigo', nome: 'mapa impresso no século XVIII', artigo: 'o', categoria: 'antiguidade', raridade: 'rara', loja: 'antiquario', preco: 45000, retencao: 0.7, tendencia: 0.01, oscila: 0.07, descricao: 'Gravura em cobre, colorida à mão. Com laudo de um especialista.' },
  // ------------------------------------------------------------ memorabilia (o clube e o ano saem do país)
  { id: 'mem_camisa_retro', nome: 'camisa retrô', modelo: 'camisa retrô {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'comum', loja: 'memorabilia', preco: 900, retencao: 0.35, tendencia: 0, oscila: 0.04, descricao: 'Réplica licenciada de uma camisa antiga. É de vestir, não de guardar.' },
  { id: 'mem_ingresso_final', nome: 'ingresso de final', modelo: 'ingresso da final de {ano}, {doClube}', artigo: 'o', categoria: 'memorabilia', raridade: 'incomum', loja: 'memorabilia', preco: 1200, retencao: 0.7, tendencia: 0.01, oscila: 0.1, descricao: 'Papel amarelado, o canhoto inteiro. Vale pela final que foi.' },
  { id: 'mem_bola_autografada', nome: 'bola autografada pelo elenco', modelo: 'bola autografada pelo elenco {doClube} campeão em {ano}', artigo: 'a', categoria: 'memorabilia', raridade: 'incomum', loja: 'memorabilia', preco: 6000, retencao: 0.65, tendencia: 0.01, oscila: 0.12, descricao: 'Com certificado de autenticidade do clube.' },
  { id: 'mem_chuteira_jogo', nome: 'chuteira usada em jogo', modelo: 'chuteira usada em jogo por um ídolo {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'rara', loja: 'memorabilia', preco: 15000, retencao: 0.7, tendencia: 0.015, oscila: 0.14, descricao: 'Com a carta do clube e a foto do jogo.' },
  { id: 'mem_camisa_historica', nome: 'camisa usada numa final histórica', modelo: 'camisa usada na final de {ano} {doClube}', artigo: 'a', categoria: 'memorabilia', raridade: 'rara', loja: 'leilao', preco: 48000, retencao: 0.8, tendencia: 0.02, oscila: 0.15, descricao: 'Lote com a procedência: a súmula, a foto, a carta do clube. É a camisa — não uma igual.' },
  { id: 'mem_camisa_calcada', nome: 'camisa "da final", vendida na calçada', modelo: 'camisa "da final de {ano}" {doClube}, sem procedência', artigo: 'a', categoria: 'memorabilia', raridade: 'comum', loja: 'memorabilia', preco: 450, retencao: 0.25, tendencia: -0.02, oscila: 0.05, semCertificado: true, descricao: 'O vendedor jura que é a original. Sem papel nenhum, vale o que vale uma réplica.' },
  // ------------------------------------------------------------ leilão (peças de catálogo)
  { id: 'rel_vintage_leilao', nome: 'cronógrafo vintage dos anos 1960', artigo: 'o', categoria: 'relogio', raridade: 'rara', loja: 'leilao', preco: 380000, retencao: 0.82, tendencia: 0.015, oscila: 0.12, descricao: 'Mostrador original, caixa nunca polida — é o que os colecionadores procuram.' },
  { id: 'ant_porcelana_leilao', nome: 'vaso de porcelana do século XIX', artigo: 'o', categoria: 'antiguidade', raridade: 'rara', loja: 'leilao', preco: 160000, retencao: 0.8, tendencia: 0.005, oscila: 0.1, descricao: 'Marca de manufatura real, restauro mínimo, procedência de uma coleção conhecida.' }
];

export const pecaDeColecao = (id: string) => PECAS_DE_COLECAO.find(p => p.id === id);
