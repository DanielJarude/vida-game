/**
 * AS COISAS DA VIDA — os bens duráveis do dia a dia (não a casa nem o carro,
 * que têm o seu sistema; não a roupa e o acessório, que são estilo).
 *
 * Cada coisa tem a loja onde se compra, um preço de referência (reais de
 * poder de compra de hoje; a cidade e o país ajustam), uma vida útil e — o
 * que importa — o que ela MUDA na vida:
 *   - `ajuda`: atividades que rendem mais com ela (o violão em casa na
 *     música, o notebook na programação, a câmera na fotografia);
 *   - `alivio`: o peso da casa que ela tira (máquina de lavar, lava-louças),
 *     na cabeça, todo ano;
 *   - `lazer`: o descanso que ela dá (a TV, o videogame, a rede);
 *   - `calor`: só faz diferença onde faz calor (o ar-condicionado).
 * Coisa sem efeito não entra no catálogo: comprar por comprar não é sistema.
 *
 * Nomes genéricos (sem marca): o mundo inteiro vende geladeira.
 */

export type LojaDeCoisas = 'eletronicos' | 'casa' | 'instrumentos' | 'esportes' | 'livraria';

import { COISAS_DE_EXPOR } from './colecao128';

export interface Coisa {
  id: string;
  nome: string;
  /** "o", "a", "os", "as" — para a frase ("comprou o notebook"). */
  artigo: 'o' | 'a' | 'os' | 'as';
  loja: LojaDeCoisas;
  /** Preço de referência (unidade do motor). */
  preco: number;
  /** Vida útil típica, em anos (depois disso, quebra ou fica obsoleta). */
  vida: number;
  descricao: string;
  /** Atividades (ids de `rotinas`) que rendem mais com isto, e quanto (0.15 = +15% de qualidade da prática). */
  ajuda?: Partial<Record<string, number>>;
  /** Quanto tira de estresse por ano (o trabalho da casa que deixa de ser na mão). */
  alivio?: number;
  /** Quanto descanso (felicidade) dá por ano. */
  lazer?: number;
  /** Só rende onde faz calor (o ar-condicionado). */
  calor?: boolean;
  /** É da CASA (móvel, eletrodoméstico): quem mora com a família de origem não decide; numa mudança de país, fica. */
  daCasa?: boolean;
  /** Idade mínima para escolher comprar com o próprio dinheiro. */
  idadeMin?: number;
  /** 12.7 — o segmento: 1 básico · 2 intermediário · 3 premium · 4 luxo · 5 alto luxo · 6 exclusivo (ausente: pelo preço). */
  nivel?: number;
  /** 12.7 — é eletrodoméstico (a loja de eletrodomésticos vende; a de móveis, não). */
  eletro?: boolean;
  /** 12.7 — peça numerada, edição limitada: o "exclusivo" de verdade. */
  edicao?: string;
}

export const COISAS: readonly Coisa[] = [
  // ------------------------------------------------------------ eletrônicos
  { id: 'celular_simples', nome: 'celular simples', artigo: 'o', loja: 'eletronicos', preco: 900, vida: 3, idadeMin: 10, descricao: 'Mensagem, mapa, foto do dia. Faz o básico e trava no resto.', lazer: 0.5 },
  { id: 'celular_bom', nome: 'celular intermediário', artigo: 'o', loja: 'eletronicos', preco: 2600, vida: 4, idadeMin: 12, descricao: 'Câmera boa, bateria que aguenta o dia. Grava vídeo direito.', lazer: 1, ajuda: { criar_conteudo: 0.1, fotografia: 0.05 } },
  { id: 'celular_topo', nome: 'celular de topo de linha', artigo: 'o', loja: 'eletronicos', preco: 8500, vida: 4, idadeMin: 14, descricao: 'O melhor da vitrine. Câmera de profissional — e o preço também.', lazer: 1, ajuda: { criar_conteudo: 0.2, fotografia: 0.12 } },
  { id: 'notebook', nome: 'notebook', artigo: 'o', loja: 'eletronicos', preco: 3800, vida: 5, idadeMin: 12, descricao: 'Estudar, trabalhar, programar em qualquer lugar.', ajuda: { programacao: 0.25, escrever: 0.1, cursinho: 0.08, estudar_concurso: 0.08, freelas: 0.15, grupo_estudos: 0.05 } },
  { id: 'computador', nome: 'computador potente', artigo: 'o', loja: 'eletronicos', preco: 9000, vida: 6, idadeMin: 14, descricao: 'Placa de vídeo, tela grande: jogos, edição de vídeo, código pesado.', lazer: 1, ajuda: { programacao: 0.35, criar_conteudo: 0.25, videogame: 0.2, freelas: 0.2, desenho: 0.1 } },
  { id: 'tablet', nome: 'tablet com caneta', artigo: 'o', loja: 'eletronicos', preco: 4200, vida: 5, idadeMin: 10, descricao: 'Desenhar, ler, anotar à mão sem gastar papel.', lazer: 0.5, ajuda: { desenho: 0.25, leitura: 0.05 } },
  { id: 'videogame', nome: 'videogame', artigo: 'o', loja: 'eletronicos', preco: 4000, vida: 6, idadeMin: 8, descricao: 'Console da geração atual, dois controles.', lazer: 2, ajuda: { videogame: 0.3 } },
  { id: 'tv', nome: 'TV grande', artigo: 'a', loja: 'eletronicos', preco: 3500, vida: 8, idadeMin: 16, descricao: 'Filme no sofá, jogo de domingo, a sala virando cinema.', lazer: 2, daCasa: true },
  { id: 'camera', nome: 'câmera fotográfica', artigo: 'a', loja: 'eletronicos', preco: 7000, vida: 8, idadeMin: 14, descricao: 'Lente trocável, foto que o celular não faz.', ajuda: { fotografia: 0.35, criar_conteudo: 0.1 } },
  { id: 'caixa_som', nome: 'caixa de som e fone bom', artigo: 'a', loja: 'eletronicos', preco: 1200, vida: 5, idadeMin: 10, descricao: 'Música alta na sala, silêncio no fone.', lazer: 1 },

  // ------------------------------------------------------- casa e móveis
  { id: 'maquina_lavar', nome: 'máquina de lavar roupa', artigo: 'a', loja: 'casa', preco: 2500, vida: 10, idadeMin: 18, descricao: 'Roupa lavada sem tanque e sem tarde perdida.', alivio: 3, daCasa: true },
  { id: 'lava_loucas', nome: 'lava-louças', artigo: 'a', loja: 'casa', preco: 3200, vida: 10, idadeMin: 18, descricao: 'A pia vazia depois do jantar. Briga a menos em casa.', alivio: 2, daCasa: true },
  { id: 'aspirador_robo', nome: 'aspirador robô', artigo: 'o', loja: 'casa', preco: 1800, vida: 5, idadeMin: 18, descricao: 'Anda sozinho pela casa enquanto você trabalha.', alivio: 1.5, daCasa: true },
  { id: 'ar_condicionado', nome: 'ar-condicionado', artigo: 'o', loja: 'casa', preco: 2800, vida: 10, idadeMin: 18, descricao: 'Dormir no verão. Onde faz calor, muda a semana.', alivio: 3, calor: true, daCasa: true },
  { id: 'colchao', nome: 'colchão e cama boa', artigo: 'o', loja: 'casa', preco: 3000, vida: 10, idadeMin: 18, descricao: 'Sono que descansa. A coluna agradece.', alivio: 2, daCasa: true },
  { id: 'sofa', nome: 'sofá novo', artigo: 'o', loja: 'casa', preco: 3500, vida: 12, idadeMin: 18, descricao: 'Onde a casa senta junto.', lazer: 1, daCasa: true },
  { id: 'escrivaninha', nome: 'escrivaninha e cadeira boa', artigo: 'a', loja: 'casa', preco: 1600, vida: 12, idadeMin: 12, descricao: 'Um canto de estudo e trabalho que não é a mesa da cozinha.', ajuda: { cursinho: 0.08, estudar_concurso: 0.08, escrever: 0.08, programacao: 0.05, reforco: 0.05 }, daCasa: true },
  { id: 'cozinha_equipada', nome: 'panelas e cozinha equipada', artigo: 'a', loja: 'casa', preco: 2200, vida: 10, idadeMin: 16, descricao: 'Panela boa, faca afiada, forno que assa direito.', ajuda: { cozinhar: 0.25, encomendas: 0.2 }, daCasa: true },

  // ----------------------------------------------------- instrumentos
  { id: 'violao', nome: 'violão', artigo: 'o', loja: 'instrumentos', preco: 900, vida: 15, idadeMin: 8, descricao: 'O instrumento que cabe em qualquer roda.', ajuda: { musica: 0.25, tocar_na_noite: 0.15 } },
  { id: 'teclado', nome: 'teclado', artigo: 'o', loja: 'instrumentos', preco: 2200, vida: 15, idadeMin: 8, descricao: 'Teclas com peso, fone para não acordar ninguém.', ajuda: { musica: 0.3, tocar_na_noite: 0.15 } },
  { id: 'guitarra', nome: 'guitarra e amplificador', artigo: 'a', loja: 'instrumentos', preco: 3500, vida: 15, idadeMin: 12, descricao: 'Para a banda da garagem — e para o vizinho reclamar.', ajuda: { musica: 0.3, tocar_na_noite: 0.25 } },
  { id: 'bateria', nome: 'bateria', artigo: 'a', loja: 'instrumentos', preco: 6000, vida: 20, idadeMin: 12, descricao: 'Barulho com método. Precisa de espaço (e de paciência dos vizinhos).', ajuda: { musica: 0.3, tocar_na_noite: 0.25 } },
  { id: 'violino', nome: 'violino', artigo: 'o', loja: 'instrumentos', preco: 3000, vida: 25, idadeMin: 6, descricao: 'Anos de esforço antes de soar bonito.', ajuda: { musica: 0.3 } },
  { id: 'piano', nome: 'piano', artigo: 'o', loja: 'instrumentos', preco: 30000, vida: 40, idadeMin: 18, descricao: 'Um móvel que canta. Pede afinação e uma sala só para ele.', ajuda: { musica: 0.45 }, lazer: 1, daCasa: true },

  // --------------------------------------------------- esporte e lazer
  { id: 'kit_academia', nome: 'kit de academia em casa', artigo: 'o', loja: 'esportes', preco: 2500, vida: 10, idadeMin: 14, descricao: 'Halteres, barra, colchonete: treinar sem sair de casa.', ajuda: { academia: 0.15, corrida: 0.05 } },
  { id: 'esteira', nome: 'esteira', artigo: 'a', loja: 'esportes', preco: 4500, vida: 8, idadeMin: 16, descricao: 'Correr com chuva, de noite, vendo série.', ajuda: { corrida: 0.25, atletismo: 0.1 }, daCasa: true },
  { id: 'chuteira_bola', nome: 'chuteira e bola boas', artigo: 'a', loja: 'esportes', preco: 700, vida: 3, idadeMin: 6, descricao: 'Pisar firme na grama e no salão.', ajuda: { futebol: 0.12, time_escola: 0.08 } },
  { id: 'raquete', nome: 'raquete e tênis de quadra', artigo: 'a', loja: 'esportes', preco: 1500, vida: 5, idadeMin: 6, descricao: 'Equipamento à altura de quem quer competir.', ajuda: { tenis: 0.15 } },
  { id: 'prancha', nome: 'prancha de surfe', artigo: 'a', loja: 'esportes', preco: 2500, vida: 8, idadeMin: 10, descricao: 'Para o mar de fim de semana.', lazer: 1.5 },
  { id: 'camping', nome: 'barraca e equipamento de camping', artigo: 'o', loja: 'esportes', preco: 1800, vida: 10, idadeMin: 14, descricao: 'Fim de semana na serra, fogareiro, céu de estrelas.', lazer: 1.5 },
  { id: 'tabuleiro', nome: 'tabuleiro e relógio de xadrez', artigo: 'o', loja: 'esportes', preco: 300, vida: 30, idadeMin: 6, descricao: 'Peças pesadas, relógio de torneio.', ajuda: { xadrez: 0.12 } },

  // ----------------------------------------------------------- livraria
  { id: 'livros', nome: 'uma estante de livros', artigo: 'a', loja: 'livraria', preco: 1500, vida: 40, idadeMin: 8, descricao: 'Romances, ensaios, poesia: o que ler nos próximos anos.', ajuda: { leitura: 0.25, escrever: 0.1 }, lazer: 0.5 },
  { id: 'livros_estudo', nome: 'livros e apostilas de estudo', artigo: 'os', loja: 'livraria', preco: 900, vida: 5, idadeMin: 12, descricao: 'Os livros de referência, a apostila boa, o caderno de exercícios.', ajuda: { cursinho: 0.12, estudar_concurso: 0.12, olimpiada: 0.1, reforco: 0.08 } },
  { id: 'material_arte', nome: 'material de arte', artigo: 'o', loja: 'livraria', preco: 800, vida: 4, idadeMin: 6, descricao: 'Tinta, papel bom, lápis de verdade.', ajuda: { desenho: 0.2 } },
  { id: 'jogos_tabuleiro', nome: 'jogos de tabuleiro', artigo: 'os', loja: 'livraria', preco: 600, vida: 15, idadeMin: 6, descricao: 'Para a mesa cheia de domingo.', lazer: 1 },

  // ------------------------------------------------- REWORK 12.4 · a casa, o som, a arte
  // Móveis que mudam o que se faz em casa (a mesa onde a família senta, a poltrona da leitura, a cama arrumada).
  { id: 'roupa_de_cama', nome: 'jogo de cama de algodão bom', artigo: 'o', loja: 'casa', preco: 650, vida: 5, idadeMin: 16, descricao: 'Lençol que não pinica, edredom para o frio. Dorme-se melhor.', alivio: 0.5, daCasa: true },
  { id: 'mesa_jantar', nome: 'mesa de jantar e cadeiras', artigo: 'a', loja: 'casa', preco: 2600, vida: 20, idadeMin: 18, descricao: 'Seis lugares: o almoço de domingo sem prato no colo.', lazer: 0.5, daCasa: true },
  { id: 'poltrona', nome: 'poltrona de leitura', artigo: 'a', loja: 'casa', preco: 1800, vida: 15, idadeMin: 16, descricao: 'Braço largo, luz do lado: o canto de ler da casa.', ajuda: { leitura: 0.06 }, lazer: 0.5, daCasa: true },
  { id: 'projetor', nome: 'projetor e tela', artigo: 'o', loja: 'eletronicos', preco: 5500, vida: 7, idadeMin: 16, descricao: 'A parede inteira virando cinema. Pede uma sala escura.', lazer: 2, daCasa: true },
  { id: 'mesa_sinuca', nome: 'mesa de sinuca', artigo: 'a', loja: 'esportes', preco: 9000, vida: 30, idadeMin: 16, descricao: 'Tecido verde, tacos na parede. Ocupa uma sala inteira.', lazer: 1.5, daCasa: true },
  { id: 'estacao_musculacao', nome: 'estação de musculação', artigo: 'a', loja: 'esportes', preco: 8000, vida: 15, idadeMin: 16, descricao: 'Polias, banco, barra guiada: a academia inteira num canto.', ajuda: { academia: 0.2, lutas: 0.05 }, daCasa: true },
  // O som: ouvir música de verdade, guardar discos.
  { id: 'som_hifi', nome: 'toca-discos e som de verdade', artigo: 'o', loja: 'eletronicos', preco: 4800, vida: 15, idadeMin: 14, descricao: 'Agulha, amplificador, caixas que enchem a sala. Ouvir vira programa.', lazer: 1.5, daCasa: true },
  { id: 'discos', nome: 'discos de vinil', artigo: 'os', loja: 'instrumentos', preco: 600, vida: 60, idadeMin: 12, descricao: 'Um lote garimpado no sebo. A coleção cresce de lote em lote.', lazer: 0.5 },
  { id: 'home_studio', nome: 'home studio (interface, microfone e monitores)', artigo: 'o', loja: 'instrumentos', preco: 6500, vida: 8, idadeMin: 14, descricao: 'Gravar em casa o que antes só cabia num estúdio pago.', ajuda: { musica: 0.15, criar_conteudo: 0.15, tocar_na_noite: 0.05 } },
  { id: 'controladora_dj', nome: 'controladora de DJ', artigo: 'a', loja: 'instrumentos', preco: 3800, vida: 7, idadeMin: 14, descricao: 'Dois pratos, um mixer: o baile, a festa, a mixagem de madrugada.', ajuda: { musica: 0.15, tocar_na_noite: 0.15 } },
  // Instrumentos que faltavam: a roda de samba, o forró, o jazz.
  { id: 'cavaquinho', nome: 'cavaquinho', artigo: 'o', loja: 'instrumentos', preco: 700, vida: 20, idadeMin: 8, descricao: 'Quatro cordas e a roda de samba inteira atrás.', ajuda: { musica: 0.25, tocar_na_noite: 0.15 } },
  { id: 'pandeiro', nome: 'pandeiro', artigo: 'o', loja: 'instrumentos', preco: 350, vida: 15, idadeMin: 6, descricao: 'Couro, platinela e um pulso que aprende devagar.', ajuda: { musica: 0.15, tocar_na_noite: 0.1 } },
  { id: 'sanfona', nome: 'sanfona', artigo: 'a', loja: 'instrumentos', preco: 6500, vida: 30, idadeMin: 10, descricao: 'O fole, os baixos, o forró que começa quando ela abre.', ajuda: { musica: 0.35, tocar_na_noite: 0.2 } },
  { id: 'saxofone', nome: 'saxofone', artigo: 'o', loja: 'instrumentos', preco: 5800, vida: 30, idadeMin: 10, descricao: 'Metal dourado, palheta, um som que atravessa a parede.', ajuda: { musica: 0.3, tocar_na_noite: 0.2 } },
  // A arte com as mãos.
  { id: 'cavalete', nome: 'cavalete e tintas a óleo', artigo: 'o', loja: 'livraria', preco: 1500, vida: 10, idadeMin: 10, descricao: 'Tela de verdade, tinta que demora a secar, cheiro de terebintina.', ajuda: { desenho: 0.2 } },
  { id: 'torno_ceramica', nome: 'torno e forno de cerâmica', artigo: 'o', loja: 'livraria', preco: 7000, vida: 20, idadeMin: 14, descricao: 'Barro, água e paciência: a peça que sai do forno nunca é a que se imaginou.', ajuda: { desenho: 0.12 }, lazer: 0.5, daCasa: true },

  // ------------------------------------------------- VIDA 12.7 · a casa inteira, do básico ao exclusivo
  { id: 'sofa_retratil', nome: 'sofá retrátil de três lugares', artigo: 'o', loja: 'casa', preco: 4200, vida: 10, idadeMin: 18, nivel: 2, descricao: 'Assento que corre para a frente, encosto que reclina: a sessão de filme deitada.', lazer: 1, daCasa: true },
  { id: 'sofa_couro', nome: 'sofá de couro', artigo: 'o', loja: 'casa', preco: 18000, vida: 20, idadeMin: 18, nivel: 4, descricao: 'Couro integral que escurece bonito com os anos.', lazer: 1, daCasa: true },
  { id: 'sofa_designer', nome: 'sofá de designer italiano', artigo: 'o', loja: 'casa', preco: 85000, vida: 25, idadeMin: 18, nivel: 5, descricao: 'Módulos baixos, estofado de pena de ganso, assinatura no pé.', lazer: 1.5, daCasa: true },
  { id: 'poltrona_designer', nome: 'poltrona de designer com banqueta', artigo: 'a', loja: 'casa', preco: 45000, vida: 30, idadeMin: 18, nivel: 5, descricao: 'O clássico de couro e madeira curvada que aparece em todo livro de design.', ajuda: { leitura: 0.06 }, lazer: 0.5, daCasa: true },
  { id: 'mesa_centro', nome: 'mesa de centro de madeira', artigo: 'a', loja: 'casa', preco: 900, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Tampo de madeira maciça, a revista e o controle em cima.', daCasa: true },
  { id: 'mesa_centro_marmore', nome: 'mesa de centro de mármore', artigo: 'a', loja: 'casa', preco: 9500, vida: 30, idadeMin: 18, nivel: 4, descricao: 'Tampo de mármore de veio largo, pés de latão.', daCasa: true },
  { id: 'mesa_lateral', nome: 'mesa lateral', artigo: 'a', loja: 'casa', preco: 350, vida: 15, idadeMin: 18, nivel: 1, descricao: 'Do lado do sofá, para o copo e o abajur.', daCasa: true },
  { id: 'estante_sala', nome: 'estante com rack', artigo: 'a', loja: 'casa', preco: 1800, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Nichos para os livros, o rack para a TV, um vaso no alto.', daCasa: true },
  { id: 'aparador', nome: 'aparador de laca', artigo: 'o', loja: 'casa', preco: 3200, vida: 20, idadeMin: 18, nivel: 3, descricao: 'Encostado na parede da entrada: as chaves, um espelho, uma luminária.', daCasa: true },
  { id: 'tv_oled', nome: 'TV OLED de 77 polegadas', artigo: 'a', loja: 'eletronicos', preco: 22000, vida: 8, idadeMin: 16, nivel: 4, descricao: 'Preto que é preto, a sala inteira dentro do filme.', lazer: 2.5, daCasa: true },
  { id: 'home_theater', nome: 'home theater 7.1', artigo: 'o', loja: 'eletronicos', preco: 9000, vida: 10, idadeMin: 16, nivel: 3, descricao: 'Sete caixas e um subwoofer: o helicóptero passa por trás do sofá.', lazer: 1.5, daCasa: true },
  { id: 'tapete', nome: 'tapete de sala', artigo: 'o', loja: 'casa', preco: 700, vida: 8, idadeMin: 18, nivel: 2, descricao: 'Pelo baixo, cor que segura a sala inteira.', daCasa: true },
  { id: 'tapete_persa', nome: 'tapete persa feito à mão', artigo: 'o', loja: 'casa', preco: 60000, vida: 60, idadeMin: 18, nivel: 5, descricao: 'Lã e seda, um ano de tear: nó por nó.', daCasa: true },
  { id: 'quadros', nome: 'quadros e gravuras emoldurados', artigo: 'os', loja: 'casa', preco: 800, vida: 30, idadeMin: 18, nivel: 2, descricao: 'Três gravuras com paspatur, a parede da sala deixando de ser branca.', daCasa: true },
  { id: 'objetos_decor', nome: 'vasos e objetos de decoração', artigo: 'os', loja: 'casa', preco: 600, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Cerâmica, vidro, um livro de arte na mesa.', daCasa: true },
  { id: 'lareira', nome: 'lareira a etanol', artigo: 'a', loja: 'casa', preco: 7500, vida: 20, idadeMin: 18, nivel: 3, descricao: 'Fogo sem chaminé, o inverno ao redor dele.', lazer: 0.5, daCasa: true },
  { id: 'geladeira', nome: 'geladeira frost free', artigo: 'a', loja: 'casa', preco: 3800, vida: 12, idadeMin: 18, nivel: 2, descricao: 'Duas portas, sem gelo acumulado, a feira da semana inteira dentro.', alivio: 0.5, eletro: true, daCasa: true },
  { id: 'geladeira_inox', nome: 'geladeira francesa de inox', artigo: 'a', loja: 'casa', preco: 16000, vida: 15, idadeMin: 18, nivel: 4, descricao: 'Quatro portas, gaveta de temperatura própria, água gelada na porta.', alivio: 0.5, eletro: true, daCasa: true },
  { id: 'freezer', nome: 'freezer horizontal', artigo: 'o', loja: 'casa', preco: 2600, vida: 12, idadeMin: 18, nivel: 2, descricao: 'A carne do mês, o sorvete, a marmita da semana.', eletro: true, daCasa: true },
  { id: 'adega', nome: 'adega climatizada', artigo: 'a', loja: 'casa', preco: 4500, vida: 12, idadeMin: 18, nivel: 3, descricao: 'Quarenta garrafas na temperatura certa.', eletro: true, daCasa: true },
  { id: 'fogao', nome: 'fogão de quatro bocas', artigo: 'o', loja: 'casa', preco: 1400, vida: 12, idadeMin: 18, nivel: 1, descricao: 'Quatro bocas, forno, a panela de pressão de domingo.', eletro: true, daCasa: true },
  { id: 'cooktop_forno', nome: 'cooktop de indução e forno de embutir', artigo: 'o', loja: 'casa', preco: 9000, vida: 15, idadeMin: 18, nivel: 3, descricao: 'A água ferve em dois minutos; o forno assa por igual.', ajuda: { cozinhar: 0.08 }, eletro: true, daCasa: true },
  { id: 'fogao_profissional', nome: 'fogão profissional italiano', artigo: 'o', loja: 'casa', preco: 70000, vida: 30, idadeMin: 18, nivel: 5, descricao: 'Seis queimadores, chapa, dois fornos e um esmalte que dura gerações.', ajuda: { cozinhar: 0.15, encomendas: 0.1 }, eletro: true, daCasa: true },
  { id: 'microondas', nome: 'micro-ondas', artigo: 'o', loja: 'casa', preco: 700, vida: 10, idadeMin: 18, nivel: 1, descricao: 'Esquentar o café de ontem em um minuto.', alivio: 0.3, eletro: true, daCasa: true },
  { id: 'cafeteira', nome: 'máquina de café espresso', artigo: 'a', loja: 'casa', preco: 4200, vida: 10, idadeMin: 18, nivel: 3, descricao: 'Moedor embutido, vaporizador de leite: a cafeteria da esquina em casa.', lazer: 0.5, eletro: true, daCasa: true },
  { id: 'louca_talheres', nome: 'jogo de louças e talheres', artigo: 'o', loja: 'casa', preco: 1200, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Doze pratos que combinam, talher de inox pesado.', daCasa: true },
  { id: 'ilha_cozinha', nome: 'ilha de cozinha com banquetas', artigo: 'a', loja: 'casa', preco: 12000, vida: 25, idadeMin: 18, nivel: 3, descricao: 'Bancada no meio da cozinha: quem cozinha conversa com quem chega.', daCasa: true },
  { id: 'armarios_planejados', nome: 'armários planejados de cozinha', artigo: 'os', loja: 'casa', preco: 18000, vida: 25, idadeMin: 18, nivel: 3, descricao: 'Do piso ao teto, com gaveta para cada coisa.', alivio: 0.5, daCasa: true },
  { id: 'cama_box', nome: 'cama box de casal', artigo: 'a', loja: 'casa', preco: 2200, vida: 12, idadeMin: 18, nivel: 2, descricao: 'Base box, cabeceira simples, o quarto organizado ao redor dela.', alivio: 0.5, daCasa: true },
  { id: 'cama_king', nome: 'cama king com cabeceira estofada', artigo: 'a', loja: 'casa', preco: 14000, vida: 20, idadeMin: 18, nivel: 4, descricao: 'Cabeceira alta de veludo, cama que cabe a família no domingo.', alivio: 1, daCasa: true },
  { id: 'colchao_hotel', nome: 'colchão de molas ensacadas, linha hotel cinco estrelas', artigo: 'o', loja: 'casa', preco: 38000, vida: 15, idadeMin: 18, nivel: 5, descricao: 'Camadas de crina, lã e algodão, feito à mão.', alivio: 1.5, daCasa: true },
  { id: 'guarda_roupa', nome: 'guarda-roupa de seis portas', artigo: 'o', loja: 'casa', preco: 2400, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Cabideiro, gavetas, o espelho por dentro da porta.', daCasa: true },
  { id: 'closet', nome: 'closet planejado', artigo: 'o', loja: 'casa', preco: 28000, vida: 25, idadeMin: 18, nivel: 4, descricao: 'Uma parede inteira: cabides à vista, gaveta de relógios, luz que acende sozinha.', daCasa: true },
  { id: 'penteadeira', nome: 'penteadeira com espelho', artigo: 'a', loja: 'casa', preco: 1300, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Espelho com luz, gavetas, a banqueta.', daCasa: true },
  { id: 'criado_mudo', nome: 'par de mesas de cabeceira', artigo: 'o', loja: 'casa', preco: 600, vida: 15, idadeMin: 18, nivel: 1, descricao: 'Uma de cada lado: o livro, o copo, o celular carregando.', daCasa: true },
  { id: 'espelho_chao', nome: 'espelho de chão', artigo: 'o', loja: 'casa', preco: 900, vida: 20, idadeMin: 18, nivel: 2, descricao: 'Corpo inteiro, moldura fina, encostado na parede.', daCasa: true },
  { id: 'comoda', nome: 'cômoda', artigo: 'a', loja: 'casa', preco: 1200, vida: 20, idadeMin: 18, nivel: 2, descricao: 'Gavetas fundas para o que não vai no cabide.', daCasa: true },
  { id: 'cama_solteiro', nome: 'cama de solteiro com gaveta', artigo: 'a', loja: 'casa', preco: 900, vida: 12, idadeMin: 18, nivel: 1, descricao: 'A cama do quarto de hóspedes, com a bicama embaixo.', daCasa: true },
  { id: 'sofa_cama', nome: 'sofá-cama', artigo: 'o', loja: 'casa', preco: 2200, vida: 10, idadeMin: 18, nivel: 2, descricao: 'Sofá de dia, cama quando a visita fica.', daCasa: true },
  { id: 'beliche', nome: 'beliche', artigo: 'o', loja: 'casa', preco: 1100, vida: 12, idadeMin: 18, nivel: 1, descricao: 'Duas camas no espaço de uma: a disputa pela de cima.', daCasa: true },
  { id: 'banheira', nome: 'banheira de imersão', artigo: 'a', loja: 'casa', preco: 15000, vida: 25, idadeMin: 18, nivel: 4, descricao: 'Funda, de encosto inclinado: o banho que não tem pressa.', alivio: 1, daCasa: true },
  { id: 'banheira_pedra', nome: 'banheira esculpida em pedra única', artigo: 'a', loja: 'casa', preco: 180000, vida: 60, idadeMin: 18, nivel: 6, descricao: 'Um bloco de mármore escavado por um ateliê; numerada e assinada.', alivio: 1.5, edicao: 'peça única, assinada pelo ateliê', daCasa: true },
  { id: 'ducha', nome: 'ducha de teto (chuva)', artigo: 'a', loja: 'casa', preco: 2800, vida: 15, idadeMin: 18, nivel: 3, descricao: 'O chuveiro do tamanho de uma bandeja: chuva morna caindo reta.', alivio: 0.5, daCasa: true },
  { id: 'gabinete', nome: 'gabinete com cuba', artigo: 'o', loja: 'casa', preco: 1600, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Armário embaixo da pia: as toalhas e o secador fora da vista.', daCasa: true },
  { id: 'bancada_marmore', nome: 'bancada de mármore com cuba dupla', artigo: 'a', loja: 'casa', preco: 14000, vida: 30, idadeMin: 18, nivel: 4, descricao: 'Uma pia para cada um, o espelho de ponta a ponta.', daCasa: true },
  { id: 'espelho_led', nome: 'espelho com luz', artigo: 'o', loja: 'casa', preco: 900, vida: 15, idadeMin: 18, nivel: 2, descricao: 'Luz em volta, sem sombra no rosto.', daCasa: true },
  { id: 'toalheiro', nome: 'toalheiro aquecido', artigo: 'o', loja: 'casa', preco: 2200, vida: 15, idadeMin: 18, nivel: 3, descricao: 'Toalha quente e seca, até no inverno do Sul.', eletro: true, daCasa: true },
  { id: 'toalhas', nome: 'jogo de toalhas e acessórios de banho', artigo: 'o', loja: 'casa', preco: 400, vida: 5, idadeMin: 18, nivel: 1, descricao: 'Toalhas felpudas, saboneteira, o tapete que não escorrega.', daCasa: true },
  { id: 'sauna', nome: 'sauna seca', artigo: 'a', loja: 'casa', preco: 28000, vida: 20, idadeMin: 18, nivel: 4, descricao: 'Cabine de madeira, pedras quentes, dez minutos de silêncio.', alivio: 1, daCasa: true },
  { id: 'espreguicadeira', nome: 'espreguiçadeiras', artigo: 'as', loja: 'casa', preco: 1800, vida: 10, idadeMin: 18, nivel: 2, descricao: 'Duas, de alumínio e tela, viradas para o sol.', lazer: 0.5, daCasa: true },
  { id: 'espreguicadeira_teca', nome: 'espreguiçadeiras de teca', artigo: 'as', loja: 'casa', preco: 14000, vida: 25, idadeMin: 18, nivel: 4, descricao: 'Madeira de teca que pega cor de prata ao sol.', lazer: 0.5, daCasa: true },
  { id: 'guarda_sol', nome: 'guarda-sol', artigo: 'o', loja: 'casa', preco: 600, vida: 6, idadeMin: 18, nivel: 1, descricao: 'Aba grande, mastro com rosca: a sombra da tarde.', daCasa: true },
  { id: 'ombrelone', nome: 'ombrelone de braço lateral', artigo: 'o', loja: 'casa', preco: 4800, vida: 12, idadeMin: 18, nivel: 3, descricao: 'A sombra sem o mastro no meio: gira com o sol.', daCasa: true },
  { id: 'mesa_externa', nome: 'mesa e cadeiras externas', artigo: 'a', loja: 'casa', preco: 2400, vida: 12, idadeMin: 18, nivel: 2, descricao: 'Alumínio que aguenta chuva, seis lugares no quintal.', daCasa: true },
  { id: 'sofa_externo', nome: 'sofá externo de corda náutica', artigo: 'o', loja: 'casa', preco: 22000, vida: 15, idadeMin: 18, nivel: 4, descricao: 'Trama de corda, almofadas que secam rápido.', lazer: 0.5, daCasa: true },
  { id: 'boias', nome: 'boias e brinquedos de piscina', artigo: 'as', loja: 'casa', preco: 250, vida: 3, idadeMin: 18, nivel: 1, descricao: 'O flamingo inflável, a boia de braço, a bola.', lazer: 0.3, daCasa: true },
  { id: 'luz_piscina', nome: 'iluminação subaquática', artigo: 'a', loja: 'casa', preco: 3800, vida: 12, idadeMin: 18, nivel: 3, descricao: 'A piscina acesa de noite, azul por dentro.', lazer: 0.3, daCasa: true },
  { id: 'aquecedor_piscina', nome: 'aquecimento solar da piscina', artigo: 'o', loja: 'casa', preco: 9000, vida: 15, idadeMin: 18, nivel: 3, descricao: 'Placas no telhado: a água morna até em maio.', daCasa: true },
  { id: 'capa_piscina', nome: 'capa de proteção da piscina', artigo: 'a', loja: 'casa', preco: 2400, vida: 8, idadeMin: 18, nivel: 2, descricao: 'Fecha a piscina: menos folha, menos cloro, ninguém cai.', daCasa: true },
  { id: 'cascata', nome: 'cascata de pedra', artigo: 'a', loja: 'casa', preco: 16000, vida: 25, idadeMin: 18, nivel: 4, descricao: 'A água descendo das pedras para a piscina.', daCasa: true },
  { id: 'kit_piscina', nome: 'filtro, bomba e kit de limpeza', artigo: 'o', loja: 'casa', preco: 2600, vida: 10, idadeMin: 18, nivel: 2, descricao: 'A água limpa que ninguém vê dar trabalho.', alivio: 0.3, daCasa: true },
  { id: 'churrasqueira', nome: 'churrasqueira de alvenaria', artigo: 'a', loja: 'casa', preco: 3500, vida: 25, idadeMin: 18, nivel: 2, descricao: 'Tijolo, grelha, a cerveja ao lado: o domingo inteiro.', lazer: 1, daCasa: true },
  { id: 'espaco_gourmet', nome: 'espaço gourmet com churrasqueira a gás', artigo: 'o', loja: 'casa', preco: 32000, vida: 25, idadeMin: 18, nivel: 4, descricao: 'Bancada de pedra, churrasqueira a gás, coifa e geladeira de chope.', lazer: 1, daCasa: true },
  { id: 'forno_pizza', nome: 'forno de pizza a lenha', artigo: 'o', loja: 'casa', preco: 7000, vida: 30, idadeMin: 18, nivel: 3, descricao: 'Domo de tijolo refratário: a pizza em noventa segundos.', lazer: 0.5, daCasa: true },
  { id: 'pergolado', nome: 'pergolado de madeira', artigo: 'o', loja: 'casa', preco: 9000, vida: 20, idadeMin: 18, nivel: 3, descricao: 'Vigas de madeira e uma trepadeira que cobre com o tempo.', daCasa: true },
  { id: 'gazebo', nome: 'gazebo', artigo: 'o', loja: 'casa', preco: 12000, vida: 20, idadeMin: 18, nivel: 3, descricao: 'Teto de madeira, quatro colunas, a rede pendurada.', daCasa: true },
  { id: 'fonte', nome: 'fonte de água', artigo: 'a', loja: 'casa', preco: 5500, vida: 20, idadeMin: 18, nivel: 3, descricao: 'O barulho da água que esconde o da rua.', daCasa: true },
  { id: 'escultura_jardim', nome: 'escultura de jardim', artigo: 'a', loja: 'casa', preco: 25000, vida: 60, idadeMin: 18, nivel: 4, descricao: 'Bronze patinado, assinada, no meio da grama.', daCasa: true },
  { id: 'plantas', nome: 'plantas e vasos', artigo: 'as', loja: 'casa', preco: 600, vida: 5, idadeMin: 18, nivel: 1, descricao: 'Costela-de-adão, espada-de-são-jorge, a samambaia da avó.', daCasa: true },
  { id: 'vasos_grandes', nome: 'vasos grandes de cerâmica', artigo: 'os', loja: 'casa', preco: 1500, vida: 20, idadeMin: 18, nivel: 2, descricao: 'Barro esmaltado, oliveiras dentro.', daCasa: true },
  { id: 'luz_jardim', nome: 'iluminação do jardim', artigo: 'a', loja: 'casa', preco: 2200, vida: 12, idadeMin: 18, nivel: 2, descricao: 'Balizadores no caminho, a árvore acesa de baixo.', daCasa: true },
  { id: 'playground', nome: 'playground infantil', artigo: 'o', loja: 'casa', preco: 4500, vida: 12, idadeMin: 18, nivel: 2, descricao: 'Escorregador, balanço, a casinha em cima.', daCasa: true },
  { id: 'cama_elastica', nome: 'cama elástica', artigo: 'a', loja: 'casa', preco: 2200, vida: 8, idadeMin: 18, nivel: 2, descricao: 'Rede de proteção, molas: a tarde inteira pulando.', daCasa: true },
  { id: 'bilhar_profissional', nome: 'mesa de bilhar profissional', artigo: 'a', loja: 'esportes', preco: 60000, vida: 40, idadeMin: 18, nivel: 5, descricao: 'Ardósia de três peças, madeira maciça, tecido de torneio.', lazer: 2, daCasa: true },
  { id: 'pebolim', nome: 'pebolim', artigo: 'o', loja: 'esportes', preco: 1800, vida: 15, idadeMin: 14, nivel: 2, descricao: 'Os bonequinhos, a bola que trava no canto.', lazer: 1, daCasa: true },
  { id: 'pingue_pongue', nome: 'mesa de pingue-pongue', artigo: 'a', loja: 'esportes', preco: 2400, vida: 15, idadeMin: 14, nivel: 2, descricao: 'Dobrável, rede e duas raquetes.', lazer: 1, daCasa: true },
  { id: 'mesa_jogos', nome: 'mesa de jogos (carteado e pôquer)', artigo: 'a', loja: 'casa', preco: 4800, vida: 25, idadeMin: 18, nivel: 3, descricao: 'Feltro verde, porta-copos, oito lugares.', lazer: 1, daCasa: true },
  { id: 'fliperama', nome: 'máquina de fliperama', artigo: 'a', loja: 'eletronicos', preco: 9000, vida: 15, idadeMin: 14, nivel: 3, descricao: 'O gabinete de madeira com os jogos de quando você era criança.', lazer: 1.5, daCasa: true },
  { id: 'poltronas_cinema', nome: 'poltronas de cinema reclináveis', artigo: 'as', loja: 'casa', preco: 24000, vida: 15, idadeMin: 18, nivel: 4, descricao: 'Quatro poltronas em fileira, porta-copo, couro.', lazer: 1.5, daCasa: true },
  { id: 'bicicleta_ergometrica', nome: 'bicicleta ergométrica', artigo: 'a', loja: 'esportes', preco: 3500, vida: 10, idadeMin: 14, nivel: 2, descricao: 'Pedalar de manhã vendo o noticiário.', ajuda: { corrida: 0.08, academia: 0.06 }, daCasa: true },
  { id: 'remo_seco', nome: 'remo seco de madeira', artigo: 'o', loja: 'esportes', preco: 8000, vida: 15, idadeMin: 14, nivel: 3, descricao: 'Volante de água, trilho de freixo: o barulho do remo dentro de casa.', ajuda: { academia: 0.12 }, daCasa: true },
  { id: 'saco_pancada', nome: 'saco de pancada', artigo: 'o', loja: 'esportes', preco: 700, vida: 10, idadeMin: 12, nivel: 1, descricao: 'Pendurado no teto, as luvas no gancho.', ajuda: { lutas: 0.12 }, daCasa: true },
  { id: 'ferramentas', nome: 'caixa de ferramentas completa', artigo: 'a', loja: 'casa', preco: 900, vida: 25, idadeMin: 18, nivel: 1, descricao: 'Chaves, alicates, furadeira: o conserto pequeno sem chamar ninguém.', daCasa: true },
  { id: 'bancada_ferramentas', nome: 'bancada de trabalho com painel', artigo: 'a', loja: 'casa', preco: 2600, vida: 25, idadeMin: 18, nivel: 2, descricao: 'Morsa, painel perfurado, cada ferramenta no seu contorno.', daCasa: true },
  { id: 'armario_garagem', nome: 'armários de garagem', artigo: 'os', loja: 'casa', preco: 3200, vida: 25, idadeMin: 18, nivel: 2, descricao: 'Metal, porta com chave, a bagunça fechada.', daCasa: true },
  { id: 'organizadores', nome: 'prateleiras e organizadores', artigo: 'os', loja: 'casa', preco: 700, vida: 15, idadeMin: 18, nivel: 1, descricao: 'Caixas etiquetadas do chão ao teto.', daCasa: true },
  { id: 'carregador_ev', nome: 'carregador de carro elétrico', artigo: 'o', loja: 'casa', preco: 6500, vida: 12, idadeMin: 18, nivel: 3, descricao: 'Carga completa durante a noite, na sua vaga.', eletro: true, daCasa: true },
  { id: 'lavadora_pressao', nome: 'compressor e lavadora de alta pressão', artigo: 'a', loja: 'casa', preco: 1800, vida: 10, idadeMin: 18, nivel: 2, descricao: 'Calibrar o pneu, lavar a calçada, o carro de sábado.', eletro: true, daCasa: true },
  { id: 'mesa_executiva', nome: 'mesa executiva de madeira', artigo: 'a', loja: 'casa', preco: 14000, vida: 30, idadeMin: 18, nivel: 4, descricao: 'Tampo de nogueira, gaveta com chave, presença.', ajuda: { escrever: 0.06, freelas: 0.05 }, daCasa: true },
  { id: 'cadeira_ergonomica', nome: 'cadeira ergonômica', artigo: 'a', loja: 'casa', preco: 5200, vida: 12, idadeMin: 18, nivel: 3, descricao: 'Apoio lombar, braço regulável: oito horas sem dor nas costas.', ajuda: { programacao: 0.04, freelas: 0.04, escrever: 0.03 }, alivio: 0.5, daCasa: true },
  { id: 'monitores', nome: 'dois monitores e suporte articulado', artigo: 'os', loja: 'eletronicos', preco: 4800, vida: 8, idadeMin: 14, nivel: 3, descricao: 'Duas telas: o código numa, a documentação na outra.', ajuda: { programacao: 0.1, freelas: 0.08 }, daCasa: true },
  { id: 'impressora', nome: 'impressora multifuncional', artigo: 'a', loja: 'eletronicos', preco: 900, vida: 6, idadeMin: 14, nivel: 1, descricao: 'Imprime, copia, digitaliza — e trava no dia da entrega.', daCasa: true },
  { id: 'estante_escritorio', nome: 'estante de escritório', artigo: 'a', loja: 'casa', preco: 1600, vida: 20, idadeMin: 18, nivel: 2, descricao: 'Pastas, livros de consulta, o diploma emoldurado.', daCasa: true },
  // VIDA 12.8 — os móveis de expor a coleção (`dados/colecao128`).
  ...COISAS_DE_EXPOR
];

const POR_ID = new Map(COISAS.map(c => [c.id, c]));
export const coisa = (id: string): Coisa | undefined => POR_ID.get(id);

export const NOME_LOJA: Record<LojaDeCoisas, string> = {
  eletronicos: 'Loja de eletrônicos', casa: 'Móveis e eletrodomésticos', instrumentos: 'Loja de instrumentos musicais', esportes: 'Artigos esportivos', livraria: 'Livraria e papelaria'
};
export const O_QUE_A_LOJA_VENDE: Record<LojaDeCoisas, string> = {
  eletronicos: 'Celular, notebook, videogame, TV, câmera', casa: 'Máquina de lavar, ar-condicionado, sofá, colchão', instrumentos: 'Violão, cavaquinho, sanfona, teclado, guitarra, piano, home studio, discos',
  esportes: 'Kit de academia, esteira, chuteira, raquete, camping', livraria: 'Livros, apostilas, material de arte, jogos'
};
