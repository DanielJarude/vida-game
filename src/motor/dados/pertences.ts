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
  tablet: ELETRONICO.slice(0, 3), videogame: [{ nome: 'preto', cor: '#26252a' }, { nome: 'branco', cor: '#ecebe8' }], camera: [{ nome: 'preta', cor: '#26252a' }, { nome: 'prata e preta', cor: '#9fa4ab' }]
};

export const variantesDaCoisa = (coisaId: string): Variante[] => MATERIAL[coisaId] ?? ELETRONICO;
export const variantesDeVeiculo = (categoria: string): Variante[] => (categoria === 'bicicleta' ? BICICLETA : VEICULO);

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
    { id: 'bater_bola', rotulo: 'Bater uma bola', pratica: ['futebol', 0.3], forma: 1, feliz: 2, textos: ['Uma pelada no fim da tarde, com quem apareceu.', 'Chute a gol até escurecer.'] },
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
  cozinha_equipada: [{ id: 'cozinhar_para', rotulo: 'Cozinhar para alguém', com: 'perto', rotuloCom: 'Cozinhar para {nome}', pratica: ['cozinha', 0.3], prox: 4, feliz: 1, textos: ['Um jantar para {nome}, com a panela boa estreando.', 'A receita da sua avó, para {nome}. Quase igual.'] }]
};

export const usosDaCoisa = (coisaId: string): UsoDeCoisa[] => USOS[coisaId] ?? [];
