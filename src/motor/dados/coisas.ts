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
  { id: 'jogos_tabuleiro', nome: 'jogos de tabuleiro', artigo: 'os', loja: 'livraria', preco: 600, vida: 15, idadeMin: 6, descricao: 'Para a mesa cheia de domingo.', lazer: 1 }
];

const POR_ID = new Map(COISAS.map(c => [c.id, c]));
export const coisa = (id: string): Coisa | undefined => POR_ID.get(id);

export const NOME_LOJA: Record<LojaDeCoisas, string> = {
  eletronicos: 'Loja de eletrônicos', casa: 'Móveis e eletrodomésticos', instrumentos: 'Loja de instrumentos musicais', esportes: 'Artigos esportivos', livraria: 'Livraria e papelaria'
};
export const O_QUE_A_LOJA_VENDE: Record<LojaDeCoisas, string> = {
  eletronicos: 'Celular, notebook, videogame, TV, câmera', casa: 'Máquina de lavar, ar-condicionado, sofá, colchão', instrumentos: 'Violão, teclado, guitarra, bateria, piano',
  esportes: 'Kit de academia, esteira, chuteira, raquete, camping', livraria: 'Livros, apostilas, material de arte, jogos'
};
