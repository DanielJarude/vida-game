/**
 * O que existe para a aparência e o estilo — poucas coisas, que o retrato
 * sabe desenhar. Cortes, cores e barba são personalização básica (grátis);
 * óculos, chapéus, roupas e acessórios são itens comprados, que ficam com a
 * pessoa. Luxo existe — e só pesa na IMAGEM de quem já é conhecido
 * (`sistemas/estilo`), nunca na notoriedade.
 */

import type { EstiloRoupa, Ocasiao, Vida, Visual } from '../tipos';

/** Cortes de cabelo (o retrato desenha todos). Nenhum é de um gênero só. */
export const CORTES: { id: string; nome: string; curto?: boolean }[] = [
  { id: 'raspado', nome: 'Raspado', curto: true },
  { id: 'curto', nome: 'Curto', curto: true },
  { id: 'curto_lado', nome: 'Curto, repartido de lado', curto: true },
  // FIX pós-playtest humano: três silhuetas novas — reconhecíveis antes de ler o nome.
  { id: 'topete', nome: 'Topete', curto: true },
  { id: 'pixie', nome: 'Pixie (curtinho com franja)', curto: true },
  { id: 'locs', nome: 'Dreads (locs)' },
  { id: 'crespo_curto', nome: 'Crespo curto', curto: true },
  { id: 'ondulado', nome: 'Ondulado', curto: true },
  { id: 'cacheado', nome: 'Cacheado' },
  { id: 'chanel', nome: 'Chanel' },
  { id: 'black', nome: 'Black power' },
  { id: 'longo_liso', nome: 'Longo e liso' },
  { id: 'longo_ondulado', nome: 'Longo e ondulado' },
  { id: 'cacheado_longo', nome: 'Cacheado longo' },
  { id: 'trancas', nome: 'Tranças' },
  { id: 'rabo', nome: 'Rabo de cavalo' },
  { id: 'coque', nome: 'Coque' }
];

/** Cores: as naturais e as de tinta (a tinta é a partir da adolescência). */
export const CORES_NATURAIS = ['preto', 'castanho_escuro', 'castanho', 'castanho_claro', 'loiro', 'ruivo'];
export const CORES_TINTA = ['platinado', 'vermelho', 'azul', 'rosa'];
export const NOME_COR: Record<string, string> = {
  preto: 'Preto', castanho_escuro: 'Castanho-escuro', castanho: 'Castanho', castanho_claro: 'Castanho-claro', loiro: 'Loiro', ruivo: 'Ruivo',
  platinado: 'Platinado', vermelho: 'Vermelho (tinta)', azul: 'Azul (tinta)', rosa: 'Rosa (tinta)', grisalho: 'Grisalho'
};

/**
 * HOTFIX dos cabelos — os TIPOS de cabelo (a textura do fio), na ordem do mais liso ao mais crespo. A genética conhece
 * quatro (`identidade.TEXTURAS`); "encaracolado" (cachos largos e soltos) existe como escolha: é o que se consegue
 * com permanente, fitagem ou definição — e qualquer tipo pode ser o natural de quem nasce sem puxar os pais.
 * Mudar o tipo é química (alisar, relaxar, fazer cachos): o natural fica guardado nos genes e é o que os filhos herdam.
 */
export const TIPOS_DE_CABELO: { id: string; nome: string; nota: string }[] = [
  { id: 'liso', nome: 'Liso', nota: 'fio reto, cai junto' },
  { id: 'ondulado', nome: 'Ondulado', nota: 'em ondas largas' },
  { id: 'encaracolado', nome: 'Encaracolado', nota: 'cachos largos e soltos' },
  { id: 'cacheado', nome: 'Cacheado', nota: 'cachos definidos, com volume' },
  { id: 'crespo', nome: 'Crespo', nota: 'cachos miúdos e densos' }
];

export const BARBAS: { id: string; nome: string }[] = [
  { id: 'nenhuma', nome: 'Sem barba' }, { id: 'por_fazer', nome: 'Por fazer' }, { id: 'curta', nome: 'Curta' },
  { id: 'cheia', nome: 'Cheia' }, { id: 'longa', nome: 'Longa' }, { id: 'cavanhaque', nome: 'Cavanhaque' },
  { id: 'costeletas', nome: 'Costeletas' }, { id: 'bigode', nome: 'Só bigode' }, { id: 'bigodao', nome: 'Bigodão' }
];
/** As barbas que podem ir com ou sem bigode (o cavanhaque sem bigode é o tufo do queixo). */
export const BARBAS_COM_BIGODE = ['por_fazer', 'curta', 'cheia', 'longa', 'cavanhaque', 'costeletas'];

export const ROUPAS: { id: EstiloRoupa; nome: string }[] = [
  { id: 'basica', nome: 'Do dia a dia' }, { id: 'esportiva', nome: 'Esportiva' }, { id: 'social', nome: 'Social' },
  { id: 'alternativa', nome: 'Alternativa' }, { id: 'elegante', nome: 'Elegante' }
];

export type CategoriaItem = 'oculos' | 'chapeu' | 'roupa' | 'acessorio';

export interface ItemEstilo {
  id: string;
  nome: string;
  categoria: CategoriaItem;
  /** Preço de referência (reais de hoje; a cidade ajusta). */
  preco: number;
  /** O que o item muda no retrato quando está em uso. */
  visual?: Partial<Pick<Visual, 'oculos' | 'chapeu' | 'roupa' | 'joia'>>;
  /**
   * Onde se usa (um de cada vez por lugar): o relógio no pulso, a joia no
   * pescoço ou nas orelhas. Sem `visual` (o relógio), usar e guardar é posse
   * de verdade — aparece em Você, não no retrato.
   */
  lugar?: 'pulso' | 'joia' | LugarDoCorpo;
  /** REWORK 12.4: os estilos a que a peça pertence (`ESTILOS`) — uma peça pode ser de vários. */
  estilos?: string[];
  /** REWORK 12.4: as ocasiões em que a peça cai bem (`adequacaoDaRoupa`). */
  ocasioes?: Ocasiao[];
  /** Peça de luxo: status social em certos contextos — nunca fama. */
  luxo?: boolean;
  descricao: string;
  /** Óculos de grau pedem receita (o corpo precisa ter pedido). */
  receita?: boolean;
}

/**
 * REWORK 12.4 — as partes do corpo onde a roupa vai (uma peça por parte, como o relógio no pulso): a parte de cima, a
 * de baixo, por cima de tudo, os pés. `corpo` (o conjunto, o vestido, o terno) ocupa a de cima e a de baixo. O retrato
 * (do busto para cima) mostra a parte de cima; a calça e o sapato existem — aparecem no guarda-roupa, não no retrato.
 */
export type LugarDoCorpo = 'tronco' | 'pernas' | 'corpo' | 'casaco' | 'pes';

/** Os lugares que uma peça ocupa (as antigas "roupas" são conjuntos: o corpo inteiro). */
export function lugaresDoItem(it: ItemEstilo): string[] {
  if (it.lugar === 'corpo') return ['tronco', 'pernas'];
  if (it.lugar) return [it.lugar];
  if (it.categoria === 'roupa') return ['tronco', 'pernas'];
  if (it.categoria === 'chapeu') return ['cabeca'];
  if (it.categoria === 'oculos') return ['rosto'];
  return [it.id];
}

/**
 * REWORK 12.4 — os estilos. Nenhum é de um lugar, de uma classe ou de um gênero: o streetwear é de quem gosta dele, o
 * chapéu de couro é do sertão e de quem quiser usá-lo em qualquer capital. As peças de cada estilo vão do barato ao caro.
 */
export const ESTILOS: { id: string; nome: string; nota: string }[] = [
  { id: 'casual', nome: 'Casual', nota: 'o jeans, a camiseta, o tênis de sempre' },
  { id: 'esportivo', nome: 'Esportivo', nota: 'agasalho, tênis de corrida, roupa que respira' },
  { id: 'social', nome: 'Social', nota: 'camisa, calça de alfaiataria, sapato' },
  { id: 'elegante', nome: 'Elegante', nota: 'corte bom, tecido nobre, pouco enfeite' },
  { id: 'alternativo', nome: 'Alternativo', nota: 'cor, estampa, peça garimpada' },
  { id: 'urbano', nome: 'Urbano', nota: 'a rua como passarela: boné, camisa de time, tênis limpo' },
  { id: 'streetwear', nome: 'Streetwear', nota: 'moletom largo, calça cargo, tênis de cano alto' },
  { id: 'hiphop', nome: 'Hip-hop', nota: 'peça larga, corrente, boné de aba reta' },
  { id: 'baile', nome: 'Baile (funk)', nota: 'bermuda, camisa de time, óculos espelhado, chinelo slide' },
  { id: 'rock', nome: 'Rock', nota: 'camiseta de banda, jaqueta de couro, coturno' },
  { id: 'punk', nome: 'Punk', nota: 'tachas, xadrez, rasgado de propósito' },
  { id: 'skate', nome: 'Skate', nota: 'tênis de lona, calça larga, camiseta estampada' },
  { id: 'vintage', nome: 'Vintage', nota: 'brechó, cintura alta, estampa de outra década' },
  { id: 'minimalista', nome: 'Minimalista', nota: 'poucas peças, cores neutras, nada sobrando' },
  { id: 'luxuoso', nome: 'Luxuoso', nota: 'grife, joia, o tecido que se reconhece de longe' },
  { id: 'tradicional', nome: 'Tradicional', nota: 'a roupa de domingo, a camisa passada' },
  { id: 'regional', nome: 'Regional', nota: 'o couro do sertão, a bombacha do pampa, a chita da festa' },
  { id: 'afro', nome: 'Afro-brasileiro', nota: 'estampa africana, turbante, as cores do axé e da ancestralidade' }
];
export const nomeDoEstilo = (id: string) => ESTILOS.find(e => e.id === id)?.nome ?? id;

export const NOME_OCASIAO: Record<Ocasiao, string> = { dia: 'o dia a dia', trabalho: 'o trabalho', estudo: 'a escola e a faculdade', festa: 'as festas', evento: 'os eventos formais', esporte: 'o esporte', encontro: 'os encontros' };

export const ITENS_ESTILO: readonly ItemEstilo[] = [
  { id: 'oculos_grau', nome: 'Óculos de grau', categoria: 'oculos', preco: 480, visual: { oculos: 'grau' }, receita: true, descricao: 'Consulta, receita, armação e lente. Enxergar o quadro de novo.' },
  { id: 'oculos_redondo', nome: 'Armação redonda', categoria: 'oculos', preco: 260, visual: { oculos: 'redondo' }, descricao: 'Armação de acetato, lente sem grau ou com grau leve. Muda o rosto.' },
  { id: 'oculos_sol', nome: 'Óculos escuros', categoria: 'oculos', preco: 180, visual: { oculos: 'sol' }, descricao: 'Para o sol — e para quem gosta de não ser olhado nos olhos.' },
  { id: 'oculos_grife', nome: 'Óculos escuros de grife', categoria: 'oculos', preco: 1900, visual: { oculos: 'sol' }, luxo: true, descricao: 'O mesmo sol, com a marca na haste.' },
  { id: 'bone', nome: 'Boné', categoria: 'chapeu', preco: 70, visual: { chapeu: 'bone' }, descricao: 'Aba curva, do time ou liso.' },
  { id: 'chapeu', nome: 'Chapéu', categoria: 'chapeu', preco: 160, visual: { chapeu: 'chapeu' }, descricao: 'Chapéu de aba: panamá, feltro ou palha.' },
  { id: 'gorro', nome: 'Gorro', categoria: 'chapeu', preco: 55, visual: { chapeu: 'gorro' }, descricao: 'Lã, para o frio (ou para o estilo).' },
  { id: 'lenco', nome: 'Lenço na cabeça', categoria: 'chapeu', preco: 45, visual: { chapeu: 'lenco' }, descricao: 'Estampado, amarrado do seu jeito.' },
  { id: 'roupa_esportiva', nome: 'Roupas esportivas', categoria: 'roupa', preco: 450, visual: { roupa: 'esportiva' }, descricao: 'Tênis bom, agasalho, camiseta que respira.' },
  { id: 'roupa_social', nome: 'Roupas sociais', categoria: 'roupa', preco: 950, visual: { roupa: 'social' }, descricao: 'Camisa, calça de alfaiataria, um sapato que não machuca. A entrevista agradece.' },
  { id: 'roupa_alternativa', nome: 'Roupas de brechó e autorais', categoria: 'roupa', preco: 380, visual: { roupa: 'alternativa' }, descricao: 'Peças garimpadas, cor, estampa, um jeito próprio.' },
  { id: 'roupa_elegante', nome: 'Guarda-roupa de grife', categoria: 'roupa', preco: 6500, visual: { roupa: 'elegante' }, luxo: true, descricao: 'Peças de marca, corte perfeito. Ninguém pergunta o preço; quem sabe, sabe.' },
  { id: 'relogio', nome: 'Relógio', categoria: 'acessorio', lugar: 'pulso', preco: 320, descricao: 'Um relógio de pulso que dura.' },
  { id: 'relogio_luxo', nome: 'Relógio de luxo', categoria: 'acessorio', lugar: 'pulso', preco: 24000, luxo: true, descricao: 'Suíço, automático. Um anônimo com ele continua anônimo.' },
  { id: 'joia', nome: 'Uma joia', categoria: 'acessorio', lugar: 'joia', preco: 2800, luxo: true, visual: { joia: 'corrente_ouro' }, descricao: 'Ouro, uma pedra, um presente para si.' },
  // Mais variedade (sem virar simulador de moda): o que se escolhe de verdade no dia a dia.
  { id: 'oculos_aviador', nome: 'Óculos aviador', categoria: 'oculos', preco: 320, visual: { oculos: 'sol' }, descricao: 'Lente espelhada, armação fina de metal.' },
  { id: 'oculos_grau_acetato', nome: 'Óculos de grau de acetato', categoria: 'oculos', preco: 780, visual: { oculos: 'grau' }, receita: true, descricao: 'A receita de sempre numa armação que é escolha, não só necessidade.' },
  { id: 'bone_aba_reta', nome: 'Boné de aba reta', categoria: 'chapeu', preco: 120, visual: { chapeu: 'bone' }, descricao: 'Aba reta, bordado na frente.' },
  { id: 'chapeu_palha', nome: 'Chapéu de palha', categoria: 'chapeu', preco: 90, visual: { chapeu: 'chapeu' }, descricao: 'Para a praia, a roça, o sol de meio-dia.' },
  { id: 'roupa_basica_boa', nome: 'Básicos de qualidade', categoria: 'roupa', preco: 600, visual: { roupa: 'basica' }, descricao: 'Camisetas boas, um jeans que veste bem. O de sempre, melhor.' },
  { id: 'terno', nome: 'Terno sob medida', categoria: 'roupa', preco: 3200, visual: { roupa: 'social' }, descricao: 'Feito no alfaiate, com prova e ajuste. Casamento, formatura, a reunião que importa.' },
  { id: 'relogio_digital', nome: 'Relógio digital esportivo', categoria: 'acessorio', lugar: 'pulso', preco: 450, descricao: 'Cronômetro, alarme, à prova d’água. Aguenta treino.' },
  { id: 'smartwatch', nome: 'Relógio inteligente', categoria: 'acessorio', lugar: 'pulso', preco: 1800, descricao: 'Mensagem no pulso, passos contados, o coração medido.' },
  { id: 'corrente_prata', nome: 'Corrente de prata', categoria: 'acessorio', lugar: 'joia', preco: 380, visual: { joia: 'corrente' }, descricao: 'Fina, discreta, no pescoço.' },
  { id: 'brincos', nome: 'Brincos', categoria: 'acessorio', lugar: 'joia', preco: 240, visual: { joia: 'brincos' }, descricao: 'Argola pequena ou ponto de luz.' },
  { id: 'brincos_ouro', nome: 'Brincos de ouro', categoria: 'acessorio', lugar: 'joia', preco: 3400, luxo: true, visual: { joia: 'brincos' }, descricao: 'Ouro dezoito, pedra pequena. Um presente que fica.' },

  // ---------------------------------------- REWORK 12.4 · o guarda-roupa por peças e por estilo
  // Parte de cima
  { id: 'camiseta_lisa', nome: 'Camisetas lisas', categoria: 'roupa', lugar: 'tronco', preco: 120, visual: { roupa: 'basica' }, estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'estudo'], descricao: 'Branca, preta, cinza: o básico que vai com tudo.' },
  { id: 'camiseta_banda', nome: 'Camiseta de banda', categoria: 'roupa', lugar: 'tronco', preco: 90, visual: { roupa: 'alternativa' }, estilos: ['rock', 'punk', 'alternativo'], ocasioes: ['dia', 'festa', 'estudo'], descricao: 'A turnê de um disco que você ouviu inteiro.' },
  { id: 'camisa_time', nome: 'Camisa de time', categoria: 'roupa', lugar: 'tronco', preco: 280, visual: { roupa: 'esportiva' }, estilos: ['urbano', 'baile', 'esportivo'], ocasioes: ['dia', 'festa', 'esporte'], descricao: 'A do seu time, oficial ou não. Diz de onde você é antes de você abrir a boca.' },
  { id: 'camisa_social', nome: 'Camisa social', categoria: 'roupa', lugar: 'tronco', preco: 240, visual: { roupa: 'social' }, estilos: ['social', 'tradicional'], ocasioes: ['trabalho', 'evento', 'encontro'], descricao: 'Manga longa, colarinho que fica no lugar.' },
  { id: 'camisa_linho', nome: 'Camisa de linho', categoria: 'roupa', lugar: 'tronco', preco: 420, visual: { roupa: 'elegante' }, estilos: ['elegante', 'minimalista'], ocasioes: ['encontro', 'evento', 'festa'], descricao: 'Amassa bonito, respira no calor.' },
  { id: 'moletom_oversized', nome: 'Moletom oversized', categoria: 'roupa', lugar: 'tronco', preco: 260, visual: { roupa: 'esportiva' }, estilos: ['streetwear', 'skate', 'hiphop'], ocasioes: ['dia', 'estudo'], descricao: 'Dois números acima, capuz, estampa nas costas.' },
  { id: 'camiseta_grife', nome: 'Camiseta de grife streetwear', categoria: 'roupa', lugar: 'tronco', preco: 1900, luxo: true, visual: { roupa: 'esportiva' }, estilos: ['streetwear', 'luxuoso', 'hiphop'], ocasioes: ['dia', 'festa'], descricao: 'A mesma camiseta, com o logo que esgota em minutos.' },
  { id: 'regata', nome: 'Regata', categoria: 'roupa', lugar: 'tronco', preco: 70, visual: { roupa: 'esportiva' }, estilos: ['esportivo', 'baile', 'casual'], ocasioes: ['dia', 'esporte', 'festa'], descricao: 'Para o calor de verdade.' },
  { id: 'bata_wax', nome: 'Bata de estampa africana', categoria: 'roupa', lugar: 'tronco', preco: 230, visual: { roupa: 'alternativa' }, estilos: ['afro', 'alternativo'], ocasioes: ['dia', 'festa', 'evento', 'encontro'], descricao: 'Tecido wax de cores fortes, costurado por quem conhece a estampa.' },
  { id: 'camisa_xadrez', nome: 'Camisa xadrez de flanela', categoria: 'roupa', lugar: 'tronco', preco: 150, visual: { roupa: 'alternativa' }, estilos: ['rock', 'punk', 'vintage', 'regional'], ocasioes: ['dia', 'festa'], descricao: 'A camisa da festa junina e a do show de rock.' },
  // Parte de baixo
  { id: 'jeans', nome: 'Calça jeans', categoria: 'roupa', lugar: 'pernas', preco: 180, estilos: ['casual', 'rock', 'urbano', 'vintage'], ocasioes: ['dia', 'estudo', 'festa', 'encontro'], descricao: 'A calça que serve para quase tudo.' },
  { id: 'calca_alfaiataria', nome: 'Calça de alfaiataria', categoria: 'roupa', lugar: 'pernas', preco: 320, estilos: ['social', 'elegante', 'minimalista'], ocasioes: ['trabalho', 'evento', 'encontro'], descricao: 'Vinco marcado, caimento certo.' },
  { id: 'calca_cargo', nome: 'Calça cargo larga', categoria: 'roupa', lugar: 'pernas', preco: 210, estilos: ['streetwear', 'skate', 'hiphop'], ocasioes: ['dia', 'estudo', 'festa'], descricao: 'Bolsos nas pernas, barra larga em cima do tênis.' },
  { id: 'bermuda_tactel', nome: 'Bermuda de tactel', categoria: 'roupa', lugar: 'pernas', preco: 90, estilos: ['baile', 'urbano', 'esportivo'], ocasioes: ['dia', 'festa', 'esporte'], descricao: 'Leve, colorida, seca rápido.' },
  { id: 'bermuda_sarja', nome: 'Bermuda de sarja', categoria: 'roupa', lugar: 'pernas', preco: 140, estilos: ['casual', 'skate'], ocasioes: ['dia', 'festa'], descricao: 'O meio-termo entre a praia e o almoço.' },
  { id: 'saia_midi', nome: 'Saia midi', categoria: 'roupa', lugar: 'pernas', preco: 190, estilos: ['vintage', 'elegante', 'tradicional'], ocasioes: ['dia', 'trabalho', 'encontro', 'evento'], descricao: 'Abaixo do joelho, rodada ou plissada.' },
  { id: 'saia_xadrez', nome: 'Saia xadrez', categoria: 'roupa', lugar: 'pernas', preco: 150, estilos: ['punk', 'alternativo', 'vintage'], ocasioes: ['dia', 'festa'], descricao: 'Com alfinete, com meia arrastão, com coturno.' },
  { id: 'bombacha', nome: 'Bombacha', categoria: 'roupa', lugar: 'pernas', preco: 260, estilos: ['regional', 'tradicional'], ocasioes: ['dia', 'festa', 'evento'], descricao: 'A calça larga do pampa, com o lenço no pescoço.' },
  // Peças inteiras
  { id: 'vestido_floral', nome: 'Vestido floral', categoria: 'roupa', lugar: 'corpo', preco: 260, visual: { roupa: 'basica' }, estilos: ['casual', 'vintage'], ocasioes: ['dia', 'festa', 'encontro'], descricao: 'Leve, estampado, para o calor.' },
  { id: 'vestido_festa', nome: 'Vestido de festa', categoria: 'roupa', lugar: 'corpo', preco: 900, visual: { roupa: 'elegante' }, estilos: ['elegante', 'social'], ocasioes: ['evento', 'festa', 'encontro'], descricao: 'Para o casamento, a formatura, a noite que importa.' },
  { id: 'vestido_chita', nome: 'Vestido de chita', categoria: 'roupa', lugar: 'corpo', preco: 160, visual: { roupa: 'alternativa' }, estilos: ['regional', 'tradicional', 'alternativo'], ocasioes: ['festa', 'dia'], descricao: 'As flores grandes do Nordeste, do São João e do forró.' },
  { id: 'conjunto_baile', nome: 'Conjunto de baile', categoria: 'roupa', lugar: 'corpo', preco: 340, visual: { roupa: 'esportiva' }, estilos: ['baile', 'urbano'], ocasioes: ['festa', 'dia'], descricao: 'Conjunto combinando, de marca esportiva: a roupa de ir ao baile no fim de semana.' },
  { id: 'macacao', nome: 'Macacão', categoria: 'roupa', lugar: 'corpo', preco: 280, visual: { roupa: 'alternativa' }, estilos: ['alternativo', 'vintage', 'minimalista'], ocasioes: ['dia', 'festa'], descricao: 'Uma peça só, do ombro ao tornozelo.' },
  // Por cima
  { id: 'jaqueta_couro', nome: 'Jaqueta de couro', categoria: 'roupa', lugar: 'casaco', preco: 900, estilos: ['rock', 'punk', 'vintage'], ocasioes: ['dia', 'festa', 'encontro'], descricao: 'Fica melhor quanto mais velha.' },
  { id: 'jaqueta_jeans', nome: 'Jaqueta jeans', categoria: 'roupa', lugar: 'casaco', preco: 260, estilos: ['casual', 'vintage', 'skate'], ocasioes: ['dia', 'estudo', 'festa'], descricao: 'A de sempre, com bottons ou sem.' },
  { id: 'corta_vento', nome: 'Jaqueta corta-vento', categoria: 'roupa', lugar: 'casaco', preco: 320, estilos: ['streetwear', 'esportivo', 'hiphop'], ocasioes: ['dia', 'esporte'], descricao: 'Nylon, cores fortes, capuz que se esconde na gola.' },
  { id: 'blazer', nome: 'Blazer', categoria: 'roupa', lugar: 'casaco', preco: 650, estilos: ['social', 'elegante'], ocasioes: ['trabalho', 'evento', 'encontro'], descricao: 'Por cima da camiseta ou da camisa: muda o recado.' },
  { id: 'casaco_la', nome: 'Casaco de lã', categoria: 'roupa', lugar: 'casaco', preco: 780, estilos: ['elegante', 'minimalista', 'tradicional'], ocasioes: ['dia', 'trabalho', 'evento'], descricao: 'Para o inverno do Sul e das viagens.' },
  { id: 'sobretudo_grife', nome: 'Sobretudo de grife', categoria: 'roupa', lugar: 'casaco', preco: 9500, luxo: true, estilos: ['luxuoso', 'elegante'], ocasioes: ['evento', 'trabalho', 'encontro'], descricao: 'Cashmere, corte italiano.' },
  // Pés
  { id: 'tenis_casual', nome: 'Tênis de todo dia', categoria: 'roupa', lugar: 'pes', preco: 280, estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'estudo'], descricao: 'Branco, confortável, vai com tudo.' },
  { id: 'tenis_corrida', nome: 'Tênis de corrida', categoria: 'roupa', lugar: 'pes', preco: 650, estilos: ['esportivo'], ocasioes: ['esporte', 'dia'], descricao: 'Amortecimento de verdade para o asfalto.' },
  { id: 'tenis_cano_alto', nome: 'Tênis de cano alto', categoria: 'roupa', lugar: 'pes', preco: 750, estilos: ['streetwear', 'hiphop', 'urbano'], ocasioes: ['dia', 'festa'], descricao: 'Limpo, de cadarço largo — cuidado como joia.' },
  { id: 'tenis_lona', nome: 'Tênis de lona', categoria: 'roupa', lugar: 'pes', preco: 220, estilos: ['skate', 'rock', 'punk', 'casual'], ocasioes: ['dia', 'estudo', 'festa'], descricao: 'Sola de borracha, gasto do skate.' },
  { id: 'tenis_colecionavel', nome: 'Tênis de edição limitada', categoria: 'roupa', lugar: 'pes', preco: 4800, luxo: true, estilos: ['streetwear', 'hiphop', 'luxuoso'], ocasioes: ['dia', 'festa'], descricao: 'Comprado no sorteio da loja. Usar ou guardar na caixa: dilema.' },
  { id: 'chinelo_slide', nome: 'Chinelo slide', categoria: 'roupa', lugar: 'pes', preco: 120, estilos: ['baile', 'urbano', 'casual'], ocasioes: ['dia', 'festa'], descricao: 'Com meia ou sem. Do quintal ao baile.' },
  { id: 'sapato_social', nome: 'Sapato social', categoria: 'roupa', lugar: 'pes', preco: 420, estilos: ['social', 'elegante', 'tradicional'], ocasioes: ['trabalho', 'evento'], descricao: 'Couro, sola que faz barulho no corredor.' },
  { id: 'coturno', nome: 'Coturno', categoria: 'roupa', lugar: 'pes', preco: 480, estilos: ['rock', 'punk', 'alternativo'], ocasioes: ['dia', 'festa'], descricao: 'Bico redondo, cadarço até a canela.' },
  { id: 'botina', nome: 'Botina de couro', categoria: 'roupa', lugar: 'pes', preco: 390, estilos: ['regional', 'tradicional'], ocasioes: ['dia', 'festa', 'trabalho'], descricao: 'A do rodeio, a da roça, a do show sertanejo.' },
  { id: 'scarpin', nome: 'Sapato de salto', categoria: 'roupa', lugar: 'pes', preco: 380, estilos: ['elegante', 'social'], ocasioes: ['evento', 'trabalho', 'encontro'], descricao: 'Salto médio, que dá para aguentar a noite.' },
  // Cabeça, rosto e o resto
  { id: 'chapeu_couro', nome: 'Chapéu de couro', categoria: 'chapeu', preco: 220, visual: { chapeu: 'chapeu' }, estilos: ['regional', 'tradicional'], ocasioes: ['dia', 'festa'], descricao: 'O chapéu do vaqueiro do sertão, com a aba virada.' },
  { id: 'turbante', nome: 'Turbante', categoria: 'chapeu', preco: 80, visual: { chapeu: 'lenco' }, estilos: ['afro', 'alternativo'], ocasioes: ['dia', 'festa', 'evento', 'encontro'], descricao: 'Amarrado alto, tecido de estampa forte.' },
  { id: 'oculos_juliet', nome: 'Óculos espelhado (Juliet)', categoria: 'oculos', preco: 160, visual: { oculos: 'sol' }, estilos: ['baile', 'urbano', 'hiphop'], ocasioes: ['dia', 'festa'], descricao: 'Lente espelhada colorida, armação que abraça o rosto.' },
  { id: 'corrente_grossa', nome: 'Corrente grossa', categoria: 'acessorio', lugar: 'joia', preco: 650, visual: { joia: 'corrente' }, estilos: ['hiphop', 'baile', 'urbano'], ocasioes: ['dia', 'festa'], descricao: 'Elo grosso no peito, por cima da camiseta.' },
  { id: 'guias', nome: 'Guias e fios de conta', categoria: 'acessorio', lugar: 'joia', preco: 90, visual: { joia: 'corrente' }, estilos: ['afro', 'tradicional'], ocasioes: ['dia', 'evento'], descricao: 'As contas das cores de quem protege.' }
];

/**
 * REWORK 12.4 — a roupa cabe na ocasião? `adequada` (a peça é de lá), `destoa` (a peça grita o contrário: o chinelo no
 * escritório formal, o terno no futebol) ou `neutra`. Sem nada comprado, a roupa de sempre é neutra: o jogo não pune
 * quem não liga para roupa.
 */
export function adequacaoDaRoupa(itens: { itemId: string }[], ocasiao: Ocasiao): 'adequada' | 'neutra' | 'destoa' {
  const pecas = itens.map(x => itemEstilo(x.itemId)).filter((x): x is ItemEstilo => !!x && (x.categoria === 'roupa'));
  if (!pecas.length) return 'neutra';
  const cabe = (x: ItemEstilo) => (x.ocasioes ? x.ocasioes.includes(ocasiao) : CABE_ANTIGO[x.visual?.roupa ?? '']?.includes(ocasiao));
  const formal = ocasiao === 'trabalho' || ocasiao === 'evento';
  const grita = (x: ItemEstilo) => (formal ? !!x.estilos?.some(e => ['baile', 'esportivo', 'skate', 'punk'].includes(e)) && !cabe(x) : ocasiao === 'esporte' ? !!x.estilos?.some(e => ['social', 'elegante'].includes(e)) : false);
  if (pecas.some(grita)) return 'destoa';
  return pecas.some(cabe) ? 'adequada' : 'neutra';
}
const CABE_ANTIGO: Record<string, Ocasiao[]> = { social: ['trabalho', 'evento', 'encontro'], elegante: ['evento', 'encontro', 'festa'], esportiva: ['esporte', 'dia'], basica: ['dia', 'estudo'], alternativa: ['dia', 'festa'] };

/** O que se veste numa ocasião: o look escolhido para ela (o que ainda é seu) — senão, o que está em uso. */
export function roupaPara(v: Vida, ocasiao: Ocasiao): { itemId: string }[] {
  const itens = v.eu.estilo?.itens ?? [];
  const ids = v.eu.estilo?.looks?.[ocasiao];
  const look = ids ? itens.filter(x => ids.includes(x.id)) : [];
  return look.length ? look : itens.filter(x => x.usando);
}

/** O estilo que as peças em uso mais dizem (para a leitura e para as fases do estilo). */
export function estiloDominante(itens: { itemId: string }[]): string | undefined {
  const conta = new Map<string, number>();
  for (const x of itens) for (const e of itemEstilo(x.itemId)?.estilos ?? []) conta.set(e, (conta.get(e) ?? 0) + 1);
  let melhor: string | undefined, n = 1;
  for (const [e, k] of conta) if (k > n || (k === n && melhor === undefined && k >= 2)) { melhor = e; n = k; }
  return n >= 2 ? melhor : undefined;
}

/** As lojas (balcões) dentro de Compras: ótica, roupas e chapéus, relojoaria e joalheria. */
export const BALCOES: { id: 'otica' | 'roupas' | 'joias'; nome: string; categorias: CategoriaItem[] }[] = [
  { id: 'otica', nome: 'Ótica', categorias: ['oculos'] },
  { id: 'roupas', nome: 'Roupas e chapéus', categorias: ['roupa', 'chapeu'] },
  { id: 'joias', nome: 'Relógios e joias de usar', categorias: ['acessorio'] }
];

const POR_ID = new Map(ITENS_ESTILO.map(x => [x.id, x]));
export const itemEstilo = (id: string) => POR_ID.get(id);

/** O que o estilo em uso comunica (para a imagem pública de quem é conhecido — e só dela). */
export function sinalDoEstilo(v: Vida): { luxo: boolean; marcante: boolean } {
  const usando = (v.eu.estilo?.itens ?? []).filter(x => x.usando).map(x => itemEstilo(x.itemId)).filter(Boolean);
  const vis = v.eu.visual;
  const luxo = usando.some(x => x!.luxo);
  const recente = v.fatos['visual_repercutiu'] !== undefined && v.t - v.fatos['visual_repercutiu'] <= 36;
  const marcante = recente || CORES_TINTA.includes(vis.corCabelo) || !!vis.chapeu || vis.oculos === 'sol' || vis.roupa === 'alternativa';
  return { luxo, marcante };
}

