/**
 * Pertences 2.0 (REWORK 4): o que dá para FAZER com o que é seu, e a cara
 * de cada coisa.
 *
 * "Se o jogador compra um violão, a primeira pergunta não pode ser 'quanto
 * consigo vendendo?'. Deve ser 'o que consigo fazer com o meu violão?'."
 *
 *   - USOS: o que abre uma experiência tem botão (tocar, tocar para alguém,
 *     jogar com quem mora junto, fotografar, programar, acampar). O efeito vai
 *     para o sistema que já existe: a prática da frente (`frentes.praticar`), o
 *     corpo, a cabeça, a relação com quem estava junto. O que seria só tarefa
 *     repetida (a máquina de lavar, o ar-condicionado, o colchão) continua
 *     passivo, no ano (`sistemas/coisas.processarCoisas`).
 *   - VARIANTES: cada coisa comprada nasce com um acabamento e uma cor (o
 *     violão de madeira escura, a bicicleta vermelha, o sofá verde) e os
 *     mantém. Não é configurador: a loja tem o que tem, e o que veio é seu.
 *
 * "Interface contida, vida colorida": as cores daqui são do MUNDO (o objeto),
 * não da interface.
 */

import type { Dominio } from '../tipos';

export interface Variante { nome: string; cor: string }

/** As paletas por material: o que existe de verdade nas lojas. */
const MADEIRA: Variante[] = [
  { nome: 'madeira clara', cor: '#d9a86a' }, { nome: 'madeira natural', cor: '#b9773f' }, { nome: 'madeira escura', cor: '#6e3f22' },
  { nome: 'vermelho queimado', cor: '#9b3a2a' }, { nome: 'preto fosco', cor: '#2b2523' }
];
const ELETRONICO: Variante[] = [
  { nome: 'grafite', cor: '#4a4f57' }, { nome: 'prata', cor: '#b9bec6' }, { nome: 'branco', cor: '#ece8e1' }, { nome: 'azul-marinho', cor: '#2e4a7a' },
  { nome: 'verde-musgo', cor: '#5d6b45' }, { nome: 'rosé', cor: '#d9a3a0' }
];
const ESTOFADO: Variante[] = [
  { nome: 'verde-oliva', cor: '#6f7a3c' }, { nome: 'mostarda', cor: '#c9962f' }, { nome: 'cinza-claro', cor: '#a9a39b' }, { nome: 'terracota', cor: '#b5573a' },
  { nome: 'azul-petróleo', cor: '#24576a' }, { nome: 'bege', cor: '#cdb898' }
];
const ESPORTE: Variante[] = [
  { nome: 'vermelha', cor: '#c8372d' }, { nome: 'azul', cor: '#2f6db3' }, { nome: 'amarela', cor: '#e2b72d' }, { nome: 'verde', cor: '#3f9a52' },
  { nome: 'laranja', cor: '#e07b2c' }, { nome: 'preta', cor: '#2a2a2c' }
];
const PAPEL: Variante[] = [
  { nome: 'capas coloridas', cor: '#b0563f' }, { nome: 'capas azuis', cor: '#3d5d8f' }, { nome: 'capas verdes', cor: '#4f7a4b' }, { nome: 'capas de couro', cor: '#7a4a2a' }
];
const ELETRODOMESTICO: Variante[] = [{ nome: 'branca', cor: '#ece9e4' }, { nome: 'inox', cor: '#a7adb3' }, { nome: 'grafite', cor: '#4d5157' }];
const VEICULO: Variante[] = [
  { nome: 'prata', cor: '#b6bcc3' }, { nome: 'branco', cor: '#efede9' }, { nome: 'preto', cor: '#24262a' }, { nome: 'cinza-chumbo', cor: '#55595f' },
  { nome: 'vermelho', cor: '#b8302a' }, { nome: 'azul', cor: '#2c5c9e' }, { nome: 'verde-escuro', cor: '#2f5a3f' }, { nome: 'amarelo', cor: '#e0b12d' },
  { nome: 'vinho', cor: '#6b2230' }, { nome: 'bege', cor: '#cbb48d' }
];
const BICICLETA: Variante[] = [...ESPORTE, { nome: 'branca', cor: '#ebe8e2' }, { nome: 'azul-celeste', cor: '#6aa8d8' }];

const v = (nome: string, cor: string): Variante => ({ nome, cor });
const COURO = [v('caramelo', '#9a5a2e'), v('conhaque', '#6e3a1f'), v('preto', '#2b2523'), v('verde-inglês', '#2f4a3a')];
const VELUDO = [v('verde-esmeralda', '#2f6b55'), v('azul-marinho', '#2c3e66'), v('rosa-antigo', '#b98682'), v('mostarda', '#c9962f')];
const MARMORE = [v('carrara', '#ece8e0'), v('travertino', '#d8c8a8'), v('nero marquina', '#3a3734'), v('verde guatemala', '#3f5a4a')];
const NOGUEIRA = [v('nogueira', '#6e4a2e'), v('carvalho', '#b9773f'), v('freijó', '#c89a62'), v('laca branca', '#ece9e4')];
const ROUPA_CAMA = [v('cinza', '#a7a39c'), v('azul-claro', '#9db9d6'), v('terracota', '#c58b6a'), v('verde-sálvia', '#9aab8f')];
const METAIS = [v('cromado', '#c3c6c9'), v('preto fosco', '#2b2826'), v('dourado escovado', '#c9a23a')];
/** VIDA 12.7 — os materiais das 93 coisas novas da casa (madeira, couro, veludo, mármore, inox, esmalte, tecido). */
const MATERIAL_DA_CASA: Record<string, Variante[]> = {
  // Sala
  sofa_retratil: [ESTOFADO[2], ESTOFADO[5], ESTOFADO[4], ESTOFADO[0]], sofa_couro: COURO,
  sofa_designer: [v('bouclé off-white', '#e3dccf'), v('cinza-pérola', '#b9b4ab'), ESTOFADO[3], v('verde-musgo', '#5d6b45')],
  poltrona_designer: [COURO[2], COURO[1], COURO[0]], mesa_centro: MADEIRA.slice(0, 3), mesa_centro_marmore: MARMORE, mesa_lateral: MADEIRA.slice(0, 3),
  estante_sala: [MADEIRA[1], MADEIRA[2], v('laca branca', '#ece9e4')],
  aparador: [v('laca verde', '#2f5a4a'), v('laca vinho', '#6b2230'), v('laca preta', '#2b2523'), v('laca off-white', '#e8e2d6'), v('laca azul', '#2c4f86')],
  tv_oled: [v('preta', '#1f1f22')], home_theater: [v('preto', '#26252a'), v('nogueira', '#6e3f22'), v('branco', '#ece8e1')],
  tapete: [v('bege', '#cdb898'), v('cinza', '#a9a39b'), v('terracota', '#b5573a'), v('azul', '#3a5a7a')],
  tapete_persa: [v('vermelho-rubi', '#8a2a2a'), v('terracota', '#a8572a'), v('verde', '#2f4a3a')],
  quadros: [v('moldura preta', '#2b2826'), v('moldura de madeira', '#b9773f'), v('moldura dourada', '#c9a23a'), v('moldura branca', '#ece9e4')],
  objetos_decor: [v('terracota', '#b5704a'), v('verde-água', '#7aa59a'), v('azul-cobalto', '#2f4f8a'), v('preto', '#2b2826')],
  lareira: [v('concreto', '#a9a49c'), v('pedra clara', '#d8d0c0'), v('mármore preto', '#3a3734')],
  // Cozinha
  geladeira: ELETRODOMESTICO, geladeira_inox: [v('inox', '#a7adb3'), v('inox preto', '#4d5157')], freezer: [ELETRODOMESTICO[0]],
  adega: [v('preta', '#2b2826'), v('inox', '#a7adb3')], fogao: ELETRODOMESTICO, microondas: ELETRODOMESTICO,
  cooktop_forno: [v('armário branco', '#ece9e4'), v('armário de madeira', '#b9773f'), v('armário grafite', '#4d5157')],
  fogao_profissional: [v('bordô', '#6b2230'), v('marfim', '#e8dcc2'), v('azul-ardósia', '#2f4a6b'), v('preto', '#2b2826'), v('verde-inglês', '#2f4a3a')],
  cafeteira: [v('inox', '#a7adb3'), v('vermelha', '#a8281f'), v('preta', '#2b2826'), v('creme', '#e8dcc2')],
  louca_talheres: [v('filete azul', '#2f5d93'), v('filete dourado', '#c9a23a'), v('filete verde', '#3f6b45'), v('filete preto', '#2b2826')],
  ilha_cozinha: [MADEIRA[1], v('verde-sálvia', '#7d907a'), v('laca branca', '#ece9e4'), MADEIRA[2]],
  armarios_planejados: [v('branco', '#ece9e4'), MADEIRA[1], v('verde-sálvia', '#8fa08a'), v('grafite', '#4d5157')],
  // Quartos
  cama_box: ROUPA_CAMA, cama_king: VELUDO, colchao_hotel: [v('marfim', '#efe9dc')], guarda_roupa: [v('branco', '#ece9e4'), MADEIRA[1], MADEIRA[0]],
  closet: NOGUEIRA, penteadeira: [v('branca', '#ece9e4'), MADEIRA[0], v('rosa', '#d9b3ad')], criado_mudo: MADEIRA.slice(0, 3),
  espelho_chao: [v('moldura preta', '#2b2826'), v('moldura dourada', '#c9a23a'), v('moldura de madeira', '#d9a86a')], comoda: MADEIRA.slice(0, 3),
  cama_solteiro: [v('azul', '#6f93ad'), v('verde', '#7a9a6a'), v('rosa', '#d9a3a0')], sofa_cama: ESTOFADO, beliche: [MADEIRA[0], v('branco', '#ece9e4'), MADEIRA[1]],
  // Banheiro
  banheira: [v('branca', '#f2f0ec'), v('preta fosca', '#2b2826')], banheira_pedra: [MARMORE[0], MARMORE[1], v('pedra cinza', '#8f8a84')],
  ducha: METAIS, gabinete: [v('branco', '#ece9e4'), MADEIRA[1], v('verde', '#5f7a6a')], bancada_marmore: MARMORE,
  espelho_led: [v('sem moldura', '#d8dde2'), v('moldura preta', '#2b2826'), v('moldura dourada', '#c9a23a')], toalheiro: METAIS,
  toalhas: [v('branco', '#ece8e1'), v('cinza', '#a7a39c'), v('azul', '#7a9ab8'), v('verde-sálvia', '#9aab8f')], sauna: [v('pinho', '#d9a86a'), v('cedro', '#a8743f')],
  // Piscina
  espreguicadeira: [v('tela azul', '#2f6db3'), v('tela branca', '#ece9e4'), v('tela cinza', '#8d8a85')],
  espreguicadeira_teca: [v('teca', '#b07a45'), v('teca envelhecida', '#a9a49c')], guarda_sol: [ESPORTE[0], ESPORTE[1], ESPORTE[2], ESPORTE[3]],
  ombrelone: [v('areia', '#d8c8a8'), v('grafite', '#4d5157'), v('terracota', '#b5573a')], mesa_externa: [v('branca', '#ece9e4'), v('grafite', '#4d5157')],
  sofa_externo: [v('areia', '#e3dccf'), v('cinza', '#a9a39b'), v('verde-oliva', '#6f7a3c')], boias: [v('rosa', '#e88aa8'), v('branco', '#f4f1ea')],
  luz_piscina: [v('azul', '#7cc0d6'), v('verde-água', '#7cd6c0'), v('branca', '#d8ecff')], aquecedor_piscina: [v('preto', '#2b2826')],
  capa_piscina: [v('azul', '#2c5c9e'), v('verde', '#3b6b3f'), v('cinza', '#6a6f77')], cascata: [v('pedra', '#9a9184'), v('arenito', '#c4a882'), v('ardósia', '#5d5a56')],
  kit_piscina: [v('azul', '#2f6db3'), v('bege', '#d8c8a8')],
  // Jardim
  churrasqueira: [v('tijolo', '#b5573a'), v('tijolo claro', '#c98a5a')], espaco_gourmet: [v('granito preto', '#3d3a37'), v('quartzo branco', '#e6e2da')],
  forno_pizza: [v('tijolo', '#b5573a'), v('refratário', '#c9a27a')], pergolado: MADEIRA.slice(0, 3), gazebo: MADEIRA.slice(0, 3),
  fonte: [v('pedra', '#cfc8bc'), v('cimento', '#a9a49c')], escultura_jardim: [v('bronze', '#7a5a34'), v('bronze escuro', '#4a3a28')],
  plantas: [v('terracota', '#b5704a'), v('cimento', '#a9a49c'), v('branco', '#ece9e4')],
  vasos_grandes: [v('azul', '#2f5d8a'), v('verde', '#4f7a6a'), v('terracota', '#b5704a'), v('preto', '#2b2826')],
  luz_jardim: [v('grafite', '#3b3a38'), v('aço corten', '#8a4a2a')], playground: [MADEIRA[1]], cama_elastica: [ESPORTE[1], ESPORTE[3], ESPORTE[0]],
  // Lazer
  bilhar_profissional: [v('feltro verde', '#2f6b45'), v('feltro azul', '#2c4f86'), v('feltro vinho', '#6b2230'), v('feltro cinza', '#6a6a6a')],
  pebolim: [MADEIRA[1], v('preto', '#26252a'), v('vermelho', '#a8281f')], pingue_pongue: [v('azul', '#2c4f86'), v('verde', '#2f6b45')],
  mesa_jogos: [v('feltro verde', '#2f6b45'), v('feltro azul', '#2c4f86'), v('feltro vinho', '#6b2230')],
  fliperama: [v('preto', '#26252a'), v('vermelho', '#a8281f'), v('azul', '#2c4f86'), MADEIRA[1]],
  poltronas_cinema: [v('couro preto', '#2b2523'), v('couro vinho', '#6b2230'), v('couro cinza', '#5d5a56')],
  bicicleta_ergometrica: [ESPORTE[5], ESPORTE[0], v('branca', '#ece9e4')], remo_seco: [v('freixo', '#d9b98a'), v('cerejeira', '#a8572a'), v('nogueira', '#6e4a2e')],
  saco_pancada: [v('vermelho', '#a8281f'), v('preto', '#26252a'), v('azul', '#2c4f86')],
  // Garagem
  ferramentas: [v('vermelha', '#c8372d'), v('azul', '#2f6db3'), v('preta', '#2b2826')], bancada_ferramentas: MADEIRA.slice(0, 2),
  armario_garagem: [v('cinza', '#8d9198'), v('vermelho', '#a8281f'), v('azul', '#2c4f86'), v('preto', '#2b2826')],
  organizadores: [v('azul', '#2f6db3'), v('cinza', '#8d8a85'), v('verde', '#3f9a52')], carregador_ev: [v('branco', '#ece9e4'), v('preto', '#2b2826')],
  lavadora_pressao: [v('amarela', '#e2b72d'), v('azul', '#2f6db3'), v('verde', '#3f9a52')],
  // Escritório
  mesa_executiva: [v('nogueira', '#6e4a2e'), v('mogno', '#6a2e1e'), v('carvalho escuro', '#4a3020')],
  cadeira_ergonomica: [v('tela cinza', '#6a6a6a'), v('tela preta', '#2b2826'), v('tela azul', '#2c4f86')],
  monitores: [v('preto', '#26252a'), v('prata', '#b9bec6'), v('branco', '#ece8e1')], impressora: [v('branca', '#ece9e4'), v('preta', '#2b2826')],
  estante_escritorio: MADEIRA.slice(0, 3)
};
const MATERIAL: Record<string, Variante[]> = {
  violao: MADEIRA, violino: MADEIRA, piano: [MADEIRA[2], MADEIRA[4], { nome: 'branco laqueado', cor: '#eeebe5' }], teclado: [ELETRONICO[0], ELETRONICO[2]],
  guitarra: [{ nome: 'vermelha', cor: '#a8281f' }, { nome: 'sunburst', cor: '#8a4a1c' }, { nome: 'preta', cor: '#232022' }, { nome: 'azul-metálico', cor: '#2f5d93' }, { nome: 'creme', cor: '#e8dcc2' }],
  bateria: [{ nome: 'vermelho-vinho', cor: '#7a2230' }, { nome: 'preta', cor: '#25232a' }, { nome: 'azul-cintilante', cor: '#2e5a96' }, { nome: 'madeira natural', cor: '#a96a37' }],
  sofa: ESTOFADO, colchao: [{ nome: 'branco', cor: '#e9e5de' }, { nome: 'cinza', cor: '#9b968f' }], escrivaninha: MADEIRA.slice(0, 3),
  maquina_lavar: ELETRODOMESTICO, lava_loucas: ELETRODOMESTICO, ar_condicionado: [ELETRODOMESTICO[0]], aspirador_robo: [ELETRONICO[0], ELETRONICO[2]],
  cozinha_equipada: [{ nome: 'inox', cor: '#a9afb5' }, { nome: 'ferro fundido vermelho', cor: '#a8352b' }, { nome: 'esmaltada azul', cor: '#3a6496' }],
  kit_academia: [ESPORTE[5], ESPORTE[0], ESPORTE[1]], esteira: [ELETRONICO[0], ESPORTE[5]], chuteira_bola: ESPORTE, raquete: ESPORTE, prancha: [...ESPORTE, { nome: 'azul-turquesa', cor: '#2fa3a8' }],
  camping: [{ nome: 'laranja', cor: '#e07b2c' }, { nome: 'verde-mata', cor: '#3b6b3f' }, { nome: 'azul', cor: '#2f6db3' }], tabuleiro: MADEIRA.slice(0, 3),
  livros: PAPEL, livros_estudo: PAPEL, material_arte: [{ nome: 'caixa de madeira', cor: '#b9773f' }, { nome: 'estojo colorido', cor: '#d0573b' }], jogos_tabuleiro: [{ nome: 'caixas coloridas', cor: '#c7522f' }, { nome: 'caixas azuis', cor: '#3c5e9a' }],
  tv: [ELETRONICO[0]], caixa_som: ELETRONICO, celular_simples: ELETRONICO, celular_bom: ELETRONICO, celular_topo: ELETRONICO, notebook: ELETRONICO.slice(0, 4), computador: [ELETRONICO[0], ELETRONICO[2]],
  tablet: ELETRONICO.slice(0, 3), videogame: [{ nome: 'preto', cor: '#26252a' }, { nome: 'branco', cor: '#ecebe8' }], camera: [{ nome: 'preta', cor: '#26252a' }, { nome: 'prata e preta', cor: '#9fa4ab' }],
  // REWORK 12.4
  roupa_de_cama: [{ nome: 'branco', cor: '#ece8e1' }, { nome: 'cinza', cor: '#a7a39c' }, { nome: 'azul-claro', cor: '#9db9d6' }, { nome: 'estampado', cor: '#c58b6a' }],
  mesa_jantar: MADEIRA.slice(0, 3), poltrona: ESTOFADO, projetor: [ELETRONICO[2], ELETRONICO[0]], mesa_sinuca: [{ nome: 'feltro verde', cor: '#2f6b45' }, { nome: 'feltro azul', cor: '#2c4f86' }, { nome: 'feltro vinho', cor: '#6b2230' }],
  estacao_musculacao: [ESPORTE[5], ELETRONICO[1]], som_hifi: [MADEIRA[1], ELETRONICO[0]], discos: [{ nome: 'capas variadas', cor: '#b0563f' }, { nome: 'capas pretas', cor: '#2b2826' }],
  home_studio: [ELETRONICO[0], ELETRONICO[2]], controladora_dj: [{ nome: 'preta', cor: '#26252a' }, { nome: 'branca', cor: '#ecebe8' }],
  cavaquinho: MADEIRA, pandeiro: MADEIRA.slice(0, 3), sanfona: [{ nome: 'vermelha', cor: '#a8281f' }, { nome: 'preta', cor: '#232022' }, { nome: 'madrepérola', cor: '#e5ddd0' }, { nome: 'azul', cor: '#2f5d93' }],
  saxofone: [{ nome: 'dourado', cor: '#caa24a' }, { nome: 'prateado', cor: '#b9bec6' }, { nome: 'preto', cor: '#2b2826' }],
  cavalete: MADEIRA.slice(0, 2), torno_ceramica: [{ nome: 'cinza', cor: '#8d8983' }, { nome: 'azul', cor: '#3a6496' }],
  // VIDA 12.7 · a casa inteira: o material de cada coisa nova (o primeiro é o que vem quando não se escolhe)
  ...MATERIAL_DA_CASA
};

export const variantesDaCoisa = (coisaId: string): Variante[] => MATERIAL[coisaId] ?? ELETRONICO;
export const variantesDeVeiculo = (categoria: string): Variante[] => (categoria === 'bicicleta' ? BICICLETA : VEICULO);

/** Um número estável de uma semente (FNV-1a): a cor de algo nunca muda entre telas, saves e versões. */
function estavel(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/**
 * FIX pós-REWORK 4: a cor de um veículo à venda — de cada anúncio, estável (o Argo vermelho da vitrine é vermelho
 * de novo quando você volta à loja, e é ele que vai para a garagem). Não consome sorteio de nada.
 */
export function corDaOferta(ofertaId: string, municipioId: string, categoria: string): Variante {
  const lista = variantesDeVeiculo(categoria);
  return lista[estavel(`${municipioId}:${ofertaId}`) % lista.length];
}

/** A cor de um veículo que é seu: a da compra; saves antigos, estável pelo id (a mesma regra em toda tela). */
export function corDoVeiculo(b: { id: string; cor?: string; corNome?: string }, categoria: string): Variante {
  if (b.cor) return { cor: b.cor, nome: b.corNome ?? '' };
  const lista = variantesDeVeiculo(categoria);
  return lista[parseInt(b.id.replace(/\D/g, '') || '0', 10) % lista.length];
}

/** A cor concordando com o veículo: "o Argo vermelho", "a Biz vermelha", "a bicicleta azul". */
export function corConcordada(nome: string, feminino: boolean): string {
  if (!nome) return '';
  const genero = (w: string) => (/^(vermelh|branc|pret|amarel|escur|clar)[oa]$/.test(w) ? w.slice(0, -1) + (feminino ? 'a' : 'o') : w);
  // Só o que varia concorda ("verde-escuro" → "verde-escura"); "prata", "vinho", "azul-celeste" ficam.
  return nome.split('-').map(genero).join('-');
}

/** Um uso de uma coisa: o que se faz, com quem, e para onde vai o efeito (sistemas que já existem). */
export interface UsoDeCoisa {
  id: string;
  rotulo: string;
  /** Com alguém (a pessoa escolhida): `casa` = quem mora junto; `perto` = quem está na mesma cidade (ou em casa). */
  com?: 'casa' | 'perto';
  /** Rótulo com a pessoa ("Tocar para {nome}"). */
  rotuloCom?: string;
  /** A frente que se pratica (e quanto). */
  pratica?: [Dominio, number];
  feliz?: number;
  estresse?: number;
  forma?: number;
  /** Quanto aproxima de quem estava junto. */
  prox?: number;
  /** Rende no estudo de agora (escola ou faculdade). */
  estudo?: number;
  /** Só perto do mar. */
  mar?: boolean;
  idadeMin?: number;
  /** O que aconteceu (variações; {nome} = quem estava junto, {coisa} = a coisa com a variante). */
  textos: string[];
}

const TOCAR = (extra?: Partial<UsoDeCoisa>): UsoDeCoisa[] => [
  { id: 'tocar', rotulo: 'Tocar', pratica: ['musica', 0.4], feliz: 2, estresse: -3, textos: ['Uma hora com {coisa} no colo. Os dedos lembraram de coisas que a cabeça tinha esquecido.', 'Tocou a mesma música até sair inteira.', 'Tocou de noite, baixinho, só para você.'], ...extra },
  { id: 'tocar_para', rotulo: 'Tocar para alguém', com: 'perto', rotuloCom: 'Tocar para {nome}', pratica: ['musica', 0.2], feliz: 3, prox: 4, textos: ['{nome} pediu outra. E mais uma.', 'Você errou um acorde no meio; {nome} riu junto, e a música continuou.', '{nome} ficou em silêncio até o fim — e depois pediu para aprender.'] }
];

export const USOS: Record<string, UsoDeCoisa[]> = {
  violao: TOCAR(), teclado: TOCAR(), guitarra: TOCAR(), bateria: TOCAR(), violino: TOCAR(), piano: TOCAR(),
  // REWORK 12.4 — os instrumentos novos tocam como os outros; o resto, cada um com o seu uso.
  cavaquinho: TOCAR(), pandeiro: TOCAR(), sanfona: TOCAR(), saxofone: TOCAR(),
  controladora_dj: [
    { id: 'mixar', rotulo: 'Mixar', pratica: ['musica', 0.35], feliz: 2, estresse: -2, textos: ['Duas horas emendando uma faixa na outra até a transição sair limpa.', 'Uma mixagem nova, gravada para ouvir no ônibus.'] },
    { id: 'tocar_festa', rotulo: 'Tocar numa festa de alguém', com: 'perto', rotuloCom: 'Tocar na festa de {nome}', pratica: ['musica', 0.2], feliz: 3, prox: 4, textos: ['A pista de {nome} não esvaziou até as quatro.', '{nome} pediu a mesma música três vezes. Você tocou.'] }
  ],
  home_studio: [{ id: 'gravar', rotulo: 'Gravar uma ideia', pratica: ['musica', 0.35], feliz: 2, textos: ['Gravou uma ideia de madrugada; de manhã, ainda era boa.', 'Uma demo inteira, voz e violão, mixada em casa.'] }],
  som_hifi: [
    { id: 'ouvir_disco', rotulo: 'Ouvir um disco inteiro', feliz: 2, estresse: -3, textos: ['Um disco do começo ao fim, sem pular faixa.', 'A agulha no lado B, a luz baixa, o celular longe.'] },
    { id: 'ouvir_com', rotulo: 'Ouvir música com alguém', com: 'casa', rotuloCom: 'Ouvir discos com {nome}', feliz: 2, prox: 3, textos: ['Você e {nome} escolhendo o próximo disco como quem escolhe vinho.', '{nome} descobriu na sua estante um disco que ouvia na infância.'] }
  ],
  discos: [{ id: 'garimpar', rotulo: 'Garimpar mais discos', feliz: 1, textos: ['Uma tarde no sebo, dedo sujo de pó, três achados.', 'Um disco que você procurava havia anos, por vinte reais.'] }],
  mesa_sinuca: [{ id: 'sinuca_com', rotulo: 'Jogar sinuca com alguém', com: 'perto', rotuloCom: 'Chamar {nome} para a sinuca', feliz: 3, prox: 3, textos: ['{nome} encaçapou a bola sete de tabela e não parou de falar nisso.', 'Uma noite de sinuca com {nome}; a revanche ficou para sábado.'] }],
  estacao_musculacao: [{ id: 'treinar', rotulo: 'Treinar em casa', forma: 4, estresse: -2, textos: ['Um treino inteiro sem fila de aparelho.', 'Seis meses na estação: a camiseta apertou nos braços.'] }],
  projetor: [{ id: 'cinema_com', rotulo: 'Sessão de cinema em casa', com: 'casa', rotuloCom: 'Sessão de cinema com {nome}', feliz: 3, prox: 3, estresse: -2, textos: ['A parede inteira virou tela; {nome} trouxe a pipoca.', 'Um filme antigo na tela grande, com {nome} comentando cada cena.'] }],
  poltrona: [{ id: 'ler', rotulo: 'Ler na poltrona', pratica: ['linguagens', 0.15], feliz: 2, estresse: -2, textos: ['Um livro inteiro numa tarde de chuva.', 'Cochilou na página trinta. Valeu igual.'] }],
  cavalete: [{ id: 'pintar_tela', rotulo: 'Pintar uma tela', pratica: ['desenho', 0.4], feliz: 2, textos: ['Uma tela a óleo que levou três semanas e ainda não secou.', 'Pintou a vista da janela em quatro luzes diferentes.'] }],
  torno_ceramica: [{ id: 'modelar', rotulo: 'Modelar no torno', pratica: ['desenho', 0.25], feliz: 2, estresse: -4, textos: ['O barro desabou três vezes; a quarta tigela ficou de pé.', 'Uma fornada de canecas tortas — e suas.'] }],
  mesa_jantar: [{ id: 'jantar_com', rotulo: 'Um jantar em casa', com: 'perto', rotuloCom: 'Chamar {nome} para jantar', feliz: 2, prox: 4, textos: ['A mesa nova estreou com {nome} e uma conversa que foi até tarde.', '{nome} elogiou a comida; a mesa ajudou.'] }],
  videogame: [
    { id: 'jogar', rotulo: 'Jogar', feliz: 2, estresse: -3, textos: ['Uma noite inteira no jogo novo. Valeu o sono perdido.', 'Zerou a fase que travava fazia semanas.'] },
    { id: 'jogar_com', rotulo: 'Jogar com alguém', com: 'perto', rotuloCom: 'Jogar videogame com {nome}', feliz: 3, prox: 3, textos: ['Você e {nome} gritaram com a TV até a vizinha bater na parede.', '{nome} ganhou todas. Ninguém vai esquecer.'] }
  ],
  computador: [
    { id: 'programar', rotulo: 'Programar um projeto seu', pratica: ['programacao', 0.4], estresse: -1, idadeMin: 10, textos: ['Um fim de semana inteiro num projeto que ninguém pediu — e funciona.', 'O código finalmente rodou às duas da manhã.'] },
    { id: 'jogar', rotulo: 'Jogar', feliz: 2, estresse: -2, textos: ['A placa de vídeo justificou o preço numa noite só.'] }
  ],
  notebook: [
    { id: 'programar', rotulo: 'Programar', pratica: ['programacao', 0.35], idadeMin: 10, textos: ['Aprendeu uma linguagem nova num tutorial de fim de semana.', 'Um programinha que organiza as suas contas. Funciona — quase sempre.'] },
    { id: 'estudar', rotulo: 'Estudar com ele', estudo: 3, estresse: 1, textos: ['Vídeo-aulas, exercícios, anotações: a matéria atrasada entrou.', 'Uma semana de estudo de verdade, sem desculpa.'] },
    { id: 'escrever', rotulo: 'Escrever', pratica: ['escrita', 0.3], textos: ['Dez páginas que ninguém leu ainda. Mas existem.', 'Um texto começado há meses finalmente terminou.'] }
  ],
  tablet: [{ id: 'desenhar', rotulo: 'Desenhar', pratica: ['desenho', 0.35], feliz: 1, textos: ['Uma tarde desenhando o que via pela janela.', 'O desenho ficou bom o bastante para virar fundo de tela.'] }],
  camera: [
    { id: 'fotografar', rotulo: 'Sair para fotografar', pratica: ['fotografia', 0.45], feliz: 2, textos: ['Uma manhã inteira atrás da luz certa. Saíram três fotos boas.', 'Fotografou a cidade como se fosse turista nela.'] },
    { id: 'retratar', rotulo: 'Fotografar alguém', com: 'perto', rotuloCom: 'Fazer um retrato de {nome}', pratica: ['fotografia', 0.25], prox: 3, textos: ['{nome} reclamou da pose e depois pediu a foto para pôr na parede.', 'A melhor foto que alguém já tirou de {nome}, segundo {nome}.'] }
  ],
  kit_academia: [{ id: 'treinar', rotulo: 'Treinar em casa', forma: 3, estresse: -2, textos: ['Três meses de treino na sala. A calça ficou mais folgada.', 'O colchonete virou parte da rotina — quase todo dia.'] }],
  esteira: [{ id: 'correr', rotulo: 'Correr na esteira', pratica: ['atletismo', 0.2], forma: 3, estresse: -2, textos: ['Cinco quilômetros vendo série. A série acabou antes.', 'A esteira deixou de ser cabide.'] }],
  chuteira_bola: [
    { id: 'bater_bola', rotulo: 'Bater uma bola', pratica: ['futebol', 0.3], forma: 1, feliz: 2, textos: ['Uma bola no fim da tarde, com quem apareceu.', 'Chute a gol até escurecer.'] },
    { id: 'bater_bola_com', rotulo: 'Bater bola com alguém', com: 'perto', rotuloCom: 'Bater bola com {nome}', pratica: ['futebol', 0.2], prox: 3, textos: ['Você e {nome} na quadra do bairro, como antigamente.', '{nome} jurou que foi gol. Não foi.'] }
  ],
  raquete: [{ id: 'jogar_tenis', rotulo: 'Jogar tênis com alguém', com: 'perto', rotuloCom: 'Jogar tênis com {nome}', pratica: ['tenis', 0.3], forma: 1, prox: 2, textos: ['Um set apertado com {nome}. A revanche ficou marcada.', '{nome} tem um saque que você não esperava.'] }],
  prancha: [{ id: 'surfar', rotulo: 'Surfar', mar: true, forma: 2, feliz: 3, estresse: -4, textos: ['Mar liso, sol baixo, três ondas boas. Valeu a semana.', 'Mais tombo do que onda — e mesmo assim.'] }],
  camping: [
    { id: 'acampar', rotulo: 'Acampar', feliz: 3, estresse: -5, idadeMin: 14, textos: ['Uma noite no mato, fogareiro e silêncio.', 'Choveu a noite inteira. Vai virar história.'] },
    { id: 'acampar_com', rotulo: 'Acampar com alguém', com: 'perto', rotuloCom: 'Acampar com {nome}', feliz: 3, estresse: -4, prox: 5, idadeMin: 14, textos: ['Você e {nome} acordaram com o céu ainda escuro para ver o sol nascer.', 'A barraca molhou, o miojo queimou, e {nome} não parou de rir.'] }
  ],
  tabuleiro: [
    { id: 'xadrez_com', rotulo: 'Jogar xadrez com alguém', com: 'perto', rotuloCom: 'Jogar xadrez com {nome}', pratica: ['xadrez', 0.25], prox: 2, textos: ['Uma partida longa com {nome}, em silêncio de igreja.', '{nome} armou uma armadilha que você só viu tarde demais.'] },
    { id: 'estudar_partidas', rotulo: 'Estudar partidas', pratica: ['xadrez', 0.3], textos: ['Uma semana estudando aberturas. A próxima partida vai ser outra.'] }
  ],
  livros: [{ id: 'ler', rotulo: 'Ler', pratica: ['linguagens', 0.2], feliz: 2, estresse: -2, textos: ['Um romance que atravessou a semana inteira.', 'Releu um livro antigo e descobriu que ele tinha mudado — ou você.'] }],
  livros_estudo: [{ id: 'estudar', rotulo: 'Estudar', estudo: 4, estresse: 2, textos: ['A apostila, um caderno, um mês de domingo à tarde.', 'Fez todos os exercícios do capítulo — até os difíceis.'] }],
  material_arte: [{ id: 'pintar', rotulo: 'Pintar', pratica: ['desenho', 0.35], feliz: 2, textos: ['Uma tela inteira num fim de semana. Ficou estranha. Ficou sua.', 'Aquarela na mesa da cozinha, tinta até nos cotovelos.'] }],
  jogos_tabuleiro: [{ id: 'jogar_mesa', rotulo: 'Jogar com alguém', com: 'perto', rotuloCom: 'Chamar {nome} para os jogos de tabuleiro', feliz: 3, prox: 3, textos: ['Uma noite de jogo com {nome}. Ninguém leu as regras direito.', '{nome} roubou no banco imobiliário e jura que não.'] }],
  // FIX pós-REWORK 4: a TV e a caixa de som também servem para alguma coisa (com quem mora junto, com quem está perto).
  tv: [
    { id: 'maratonar', rotulo: 'Maratonar uma série', feliz: 2, estresse: -3, textos: ['Uma temporada inteira num fim de semana. Valeu cada episódio.', 'Começou uma série por recomendação e não parou mais.'] },
    { id: 'filme_com', rotulo: 'Ver um filme com alguém', com: 'casa', rotuloCom: 'Ver um filme com {nome}', feliz: 2, prox: 3, estresse: -2, textos: ['Pipoca, sofá e {nome} dormindo antes da metade.', 'Você e {nome} discutiram o final até de madrugada.'] }
  ],
  caixa_som: [{ id: 'som_com', rotulo: 'Chamar alguém para ouvir música', com: 'perto', rotuloCom: 'Chamar {nome} para ouvir um disco', feliz: 2, prox: 2, textos: ['Um disco inteiro, do lado A ao lado B, com {nome} cantando errado.', '{nome} trouxe uma música que você nunca tinha ouvido — e agora é sua também.'] }],
  cozinha_equipada: [{ id: 'cozinhar_para', rotulo: 'Cozinhar para alguém', com: 'perto', rotuloCom: 'Cozinhar para {nome}', pratica: ['cozinha', 0.3], prox: 4, feliz: 1, textos: ['Um jantar para {nome}, com a panela boa estreando.', 'A receita da sua avó, para {nome}. Quase igual.'] }]
};

export const usosDaCoisa = (coisaId: string): UsoDeCoisa[] => USOS[coisaId] ?? [];

/**
 * FIX pós-REWORK 4: a fachada de cada moradia — a cor de verdade da casa (a casa verde-água da rua, o prédio de
 * tijolo, a torre de vidro). Estável pela chave (o imóvel, o contrato, a casa da família): a casa não muda de cor
 * entre uma tela e outra.
 */
const FACHADA_CASA: Variante[] = [
  { nome: 'amarelo-ocre', cor: '#d9a441' }, { nome: 'verde-água', cor: '#6fb3a0' }, { nome: 'rosa-goiaba', cor: '#d98a8a' }, { nome: 'azul-claro', cor: '#7aa6c9' },
  { nome: 'terracota', cor: '#c0704d' }, { nome: 'branco-gelo', cor: '#e8e0d2' }, { nome: 'lilás', cor: '#a993c4' }, { nome: 'verde-limão', cor: '#a9c46a' }
];
const FACHADA_PREDIO: Variante[] = [
  { nome: 'concreto', cor: '#a9a49a' }, { nome: 'tijolo aparente', cor: '#a65f43' }, { nome: 'bege', cor: '#cbb390' }, { nome: 'azul-acinzentado', cor: '#7f93a3' }, { nome: 'salmão', cor: '#d49a80' }
];
const FACHADA_ALTO: Variante[] = [{ nome: 'vidro azulado', cor: '#7f9fb8' }, { nome: 'branco', cor: '#ece6da' }, { nome: 'grafite e vidro', cor: '#6c7178' }, { nome: 'areia', cor: '#cdb894' }];
const PREDIOS = new Set(['apto_1q', 'apto_2q', 'apto_3q', 'kitnet', 'republica', 'funcional']);
export function fachadaDe(chave: string, forma: string): Variante {
  const lista = forma === 'alto_padrao' || forma === 'casa_grande' ? FACHADA_ALTO : PREDIOS.has(forma) ? FACHADA_PREDIO : FACHADA_CASA;
  return lista[estavel(chave) % lista.length];
}
/** A chave da fachada: a mesma para o anúncio (a cidade, o tipo, o bairro, o ano) e para a casa que veio dele. */
export const chaveDaFachada = (municipioId: string, modeloId: string | undefined, bairro: string | undefined, t: number) => `${municipioId}:${modeloId ?? ''}:${bairro ?? ''}:${Math.floor(t / 12)}`;
