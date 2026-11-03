/**
 * VIDA 12.8 — A CASA QUE SERVE PARA ALGUMA COISA: o que se faz em cada cômodo, o lado de fora da casa e as plantas.
 *
 * Catálogo puro (só tipos): fica num pacote próprio, embaixo dos catálogos de sempre, sem importar nada em tempo de
 * execução — o pacote dos catálogos (`motor-dados`) estava a 8 kB do limite.
 *
 * (O que se faz em qualquer casa — a faxina, as plantas, o café com uma visita, a série — é de `sistemas/casaNoDia`, da
 * 12.6: aqui fica só o que um cômodo próprio permite.)
 *
 * OS USOS DOS CÔMODOS seguem a regra dos usos das coisas (`dados/pertences.USOS`): cada um vai para um sistema que já
 * existe — a prática de uma frente (`frentes.praticar`), o corpo, a cabeça, o estudo de agora, o desempenho no trabalho
 * e a relação com quem estava junto. Uma vez por ano cada um (o ano do jogo é longo: "nadar" é o costume do ano, não um
 * clique). O cômodo equipado é o que serve: a academia sem aparelho é um quarto vazio. A qualidade do que está nele (o
 * segmento das coisas: básico a exclusivo) mexe um pouco no resultado — nunca o bastante para virar atalho.
 *
 * O LADO DE FORA (a fachada, o paisagismo, o caminho, a luz do jardim, o portão) só existe para casa — o prédio decide a
 * fachada do apartamento — e o que dá para fazer depende do terreno: a casa simples não tem paisagismo assinado.
 */
import type { Dominio } from '../tipos';

/* ================================================================ os usos dos cômodos */

export interface UsoDoComodo {
  id: string;
  rotulo: string;
  /**
   * Com quem: `casa` = quem mora junto; `perto` = quem mora junto ou na cidade (uma pessoa escolhida); `grupo` = a casa
   * inteira e os mais próximos da cidade (até cinco), de uma vez (a sessão de cinema, a festa na piscina).
   */
  com?: 'casa' | 'perto' | 'grupo';
  rotuloCom?: string;
  pratica?: [Dominio, number];
  feliz?: number;
  estresse?: number;
  forma?: number;
  prox?: number;
  /** Rende no estudo de agora (escola, faculdade). */
  estudo?: number;
  /** Rende no trabalho de agora (o dia de trabalho em casa): só para quem tem trabalho que se faz de casa. */
  trabalho?: number;
  /** O gasto da vez (comida, bebida, o gás do aquecimento), na cidade de custo 1,0. */
  custo?: number;
  idadeMin?: number;
  /** Os efeitos crescem (um pouco) com o segmento do que está no cômodo. */
  qualidade?: boolean;
  textos: string[];
}

export const USOS_DOS_COMODOS: Partial<Record<string, UsoDoComodo[]>> = {
  cinema: [
    { id: 'sessao', rotulo: 'Ver um filme na sala de cinema', feliz: 3, estresse: -3, qualidade: true, textos: ['Luz apagada, som alto, o celular longe: um filme inteiro sem pausa.', 'Um clássico que você só tinha visto na TV pequena. Era outro filme.', 'Sessão dupla num domingo de chuva.'] },
    { id: 'sessao_com', rotulo: 'Chamar alguém para uma sessão', com: 'perto', rotuloCom: 'Chamar {nome} para uma sessão', feliz: 3, prox: 4, qualidade: true, textos: ['{nome} escolheu o filme e dormiu antes da metade. Valeu igual.', 'Você e {nome} discutiram o final até a pipoca acabar.', '{nome} saiu dizendo que nunca tinha visto um filme assim em casa.'] },
    { id: 'sessao_familia', rotulo: 'Organizar uma sessão para a família e os amigos', com: 'grupo', feliz: 3, prox: 3, custo: 120, qualidade: true, textos: ['As poltronas cheias, a pipoca em balde, as crianças no chão: sessão de sábado.', 'Um filme que todo mundo já tinha visto — e todo mundo riu nas mesmas cenas.'] }
  ],
  academia: [
    { id: 'treinar', rotulo: 'Treinar em casa', forma: 4, estresse: -3, qualidade: true, idadeMin: 14, textos: ['Um treino inteiro sem fila de aparelho e sem trânsito.', 'Seis da manhã, a casa quieta, o treino feito antes do café.', 'A série que você sempre pulava, feita até o fim.'] },
    { id: 'treinar_com', rotulo: 'Treinar com alguém', com: 'perto', rotuloCom: 'Treinar com {nome}', forma: 3, prox: 3, qualidade: true, idadeMin: 14, textos: ['{nome} contou as repetições em voz alta — e não deixou parar na oitava.', 'Treino em dupla: {nome} reclamou o tempo todo e voltou na semana seguinte.'] }
  ],
  piscina: [
    { id: 'nadar', rotulo: 'Nadar', pratica: ['natacao', 0.25], forma: 3, feliz: 2, idadeMin: 5, textos: ['Vinte idas e vindas antes de o sol esquentar.', 'Nadou até os ombros pedirem para parar.', 'A água fria da manhã, o barulho de mais nada.'] },
    { id: 'relaxar', rotulo: 'Uma tarde na beira da piscina', feliz: 3, estresse: -5, qualidade: true, textos: ['A espreguiçadeira, um livro, o barulho da água: a tarde passou sem pedir licença.', 'Um mergulho, a toalha no sol, o cochilo de meia hora.'] },
    { id: 'convidar', rotulo: 'Chamar alguém para a piscina', com: 'perto', rotuloCom: 'Chamar {nome} para a piscina', feliz: 2, prox: 4, textos: ['{nome} chegou dizendo que só ia molhar o pé. Saiu de noite.', 'Você e {nome} na água até os dedos enrugarem.'] },
    { id: 'festa', rotulo: 'Dar uma festa na piscina', com: 'grupo', feliz: 4, prox: 3, custo: 900, idadeMin: 16, textos: ['Música, boia, a churrasqueira acesa: a festa entrou pela noite.', 'Alguém caiu de roupa na piscina — e virou a história do ano.'] }
  ],
  biblioteca: [
    { id: 'ler', rotulo: 'Ler na biblioteca', pratica: ['linguagens', 0.25], feliz: 2, estresse: -2, qualidade: true, idadeMin: 7, textos: ['Um romance inteiro numa poltrona que não tem pressa.', 'Releu um livro da estante e marcou de novo as mesmas frases.', 'Três livros começados, um terminado — o melhor dos três.'] },
    { id: 'estudar', rotulo: 'Estudar na biblioteca', estudo: 4, estresse: 1, idadeMin: 9, textos: ['A porta fechada, a mesa limpa, a matéria atrasada entrou.', 'Uma semana de estudo de verdade, sem a TV da sala por perto.'] },
    { id: 'escrever', rotulo: 'Escrever na biblioteca', pratica: ['escrita', 0.3], idadeMin: 10, textos: ['Dez páginas novas entre as estantes.', 'O capítulo que travava saiu de uma vez, de madrugada.'] }
  ],
  jogos: [
    { id: 'jogar', rotulo: 'Uma noite na sala de jogos', feliz: 3, estresse: -3, qualidade: true, textos: ['A sinuca, o fliperama, o videogame: a noite foi de um a outro.', 'Bateu o próprio recorde no fliperama. Ninguém viu. Contou para todo mundo.'] },
    { id: 'receber', rotulo: 'Chamar alguém para jogar', com: 'perto', rotuloCom: 'Chamar {nome} para a sala de jogos', feliz: 3, prox: 4, textos: ['{nome} ganhou a primeira e não deixou você esquecer.', 'Uma revanche atrás da outra com {nome}, até depois da meia-noite.'] },
    { id: 'noite_de_jogos', rotulo: 'Fazer uma noite de jogos com os amigos', com: 'grupo', feliz: 3, prox: 3, custo: 150, idadeMin: 12, textos: ['Campeonato de pebolim com chave, placar e taça de papel.', 'A mesa cheia, alguém roubando no jogo, todo mundo rindo.'] }
  ],
  escritorio: [
    { id: 'trabalhar_em_casa', rotulo: 'Trabalhar de casa uns dias', trabalho: 2, estresse: -2, qualidade: true, idadeMin: 16, textos: ['Sem trânsito, a porta fechada: o relatório saiu antes do prazo.', 'Uma semana de trabalho em casa. Rendeu — e sobrou tempo para almoçar direito.'] },
    { id: 'estudar', rotulo: 'Estudar no escritório', estudo: 3, idadeMin: 10, textos: ['A mesa de trabalho, o caderno aberto: a matéria entrou.', 'Um domingo inteiro de estudo, sem desculpa.'] }
  ],
  estudio: [
    { id: 'praticar', rotulo: 'Praticar no estúdio', pratica: ['musica', 0.35], feliz: 2, estresse: -2, qualidade: true, idadeMin: 6, textos: ['Duas horas de escala até os dedos acharem sozinhos.', 'Tocou alto, às onze da noite, e o vizinho nem soube.', 'A música que não saía saiu inteira.'] },
    { id: 'gravar', rotulo: 'Gravar uma música', pratica: ['musica', 0.25], feliz: 3, qualidade: true, idadeMin: 12, textos: ['Uma demo gravada em casa, com o som do estúdio.', 'Gravou, ouviu, regravou — a terceira ficou.'] },
    { id: 'ensaiar_com', rotulo: 'Ensaiar com alguém', com: 'perto', rotuloCom: 'Ensaiar com {nome}', pratica: ['musica', 0.2], prox: 3, idadeMin: 10, textos: ['Você e {nome} acertaram a virada depois de vinte tentativas.', '{nome} trouxe uma ideia de música; saiu dali com refrão.'] }
  ],
  atelie: [
    { id: 'criar', rotulo: 'Uma tarde no ateliê', pratica: ['desenho', 0.35], feliz: 2, estresse: -2, qualidade: true, idadeMin: 8, textos: ['A luz da tarde na tela; a tinta secando na parede.', 'Uma série de esboços que, juntos, viraram uma ideia.'] }
  ],
  adega: [
    { id: 'abrir_garrafa', rotulo: 'Abrir uma garrafa com alguém', com: 'perto', rotuloCom: 'Abrir uma garrafa com {nome}', feliz: 2, prox: 4, custo: 180, idadeMin: 18, textos: ['Uma garrafa guardada para uma ocasião — e a ocasião foi {nome}.', '{nome} sabia de vinho mais do que dizia. A conversa foi longe.'] },
    { id: 'organizar', rotulo: 'Organizar a adega', feliz: 1, estresse: -1, idadeMin: 18, textos: ['Rótulo por rótulo, safra por safra: a adega ficou em ordem.', 'Achou no fundo da prateleira uma garrafa que nem lembrava de ter.'] }
  ],
  lazer: [
    { id: 'churrasco', rotulo: 'Fazer um churrasco em casa', com: 'grupo', feliz: 3, prox: 3, custo: 450, idadeMin: 16, textos: ['A churrasqueira acesa às onze, a última conversa às nove da noite.', 'Um domingo de portas abertas: quem passou, ficou.'] }
  ],
  quadra: [
    { id: 'jogar_com', rotulo: 'Jogar na quadra com alguém', com: 'perto', rotuloCom: 'Chamar {nome} para jogar na quadra', forma: 3, feliz: 2, prox: 3, idadeMin: 8, textos: ['Um jogo apertado com {nome}; a revanche ficou para o sábado.', '{nome} jogava melhor do que dizia.'] },
    { id: 'treinar', rotulo: 'Treinar na quadra', pratica: ['tenis', 0.2], forma: 2, idadeMin: 8, textos: ['Saque atrás de saque até a cesta de bolas esvaziar.', 'Uma hora de treino na quadra de casa, sem esperar vaga.'] }
  ],
  varanda: [
    { id: 'conversar', rotulo: 'Conversar na varanda', com: 'casa', rotuloCom: 'Conversar com {nome} na varanda', prox: 3, feliz: 1, textos: ['Você e {nome} falando de nada até escurecer.', 'Uma conversa que só acontece na varanda, de noite.'] }
  ]
};

/** Os setores de trabalho que se fazem de casa uns dias (o escritório, o computador, o telefone). */
export const SETORES_DE_CASA = ['tecnologia', 'financas', 'juridico', 'administrativo', 'comunicacao', 'criativo', 'engenharia', 'educacao'];

/* ================================================================ o lado de fora */

export type AspectoExterno = 'fachada' | 'paisagismo' | 'caminho' | 'luz_externa' | 'portao';

export interface OpcaoExterna {
  id: string;
  nome: string;
  /** 1..6, o segmento (básico a exclusivo). */
  nivel: number;
  /** Preço por m² de fachada / de terreno / de caminho, ou fixo (`fixo`). */
  preco: number;
  fixo?: boolean;
  /** O terreno mínimo (m² da planta) para caber: o paisagismo assinado pede jardim de verdade. */
  terrenoMin?: number;
  cor?: string;
  cor2?: string;
  /** Como o desenho da casa mostra. */
  desenho: string;
  /** O que pede de cuidado por mês (o jardineiro do paisagismo assinado, a luz). */
  manutencao?: number;
  descricao: string;
}

export const NOME_DO_ASPECTO_EXTERNO: Record<AspectoExterno, string> = { fachada: 'Fachada', paisagismo: 'Jardim e paisagismo', caminho: 'Caminho e calçada', luz_externa: 'Iluminação externa', portao: 'Portão e entrada' };
export const ASPECTOS_EXTERNOS: AspectoExterno[] = ['fachada', 'paisagismo', 'caminho', 'luz_externa', 'portao'];

export const OPCOES_EXTERNAS: Record<AspectoExterno, OpcaoExterna[]> = {
  fachada: [
    { id: 'original', nome: 'como veio (reboco pintado)', nivel: 1, preco: 0, fixo: true, desenho: 'original', descricao: 'A fachada que a casa já tinha.' },
    { id: 'pintura_clara', nome: 'pintura nova, cor clara', nivel: 2, preco: 45, cor: '#eee8dc', desenho: 'liso', descricao: 'Massa corrida, selador e duas demãos: a casa parece outra.' },
    { id: 'pintura_terracota', nome: 'pintura terracota', nivel: 2, preco: 45, cor: '#c0714f', desenho: 'liso', descricao: 'O tom de barro que esconde a poeira e esquenta a rua.' },
    { id: 'pintura_verde', nome: 'pintura verde-sálvia', nivel: 2, preco: 45, cor: '#9fae95', desenho: 'liso', descricao: 'Um verde acinzentado que combina com as plantas.' },
    { id: 'pintura_grafite', nome: 'pintura grafite', nivel: 2, preco: 48, cor: '#55585c', desenho: 'liso', descricao: 'Escura, moderna — e quente no sol da tarde.' },
    { id: 'textura', nome: 'textura grafiato', nivel: 2, preco: 70, cor: '#d9cdb6', desenho: 'textura', descricao: 'O risco do grafiato: esconde a imperfeição do reboco.' },
    { id: 'tijolinho', nome: 'tijolinho aparente', nivel: 3, preco: 150, cor: '#a5583c', desenho: 'tijolo', descricao: 'Plaqueta de tijolo na parede da frente.' },
    { id: 'madeira', nome: 'painel ripado de madeira', nivel: 3, preco: 320, cor: '#8a5d38', desenho: 'ripado', manutencao: 0.15, descricao: 'Ripas de madeira tratada: pede verniz a cada dois anos.' },
    { id: 'pedra', nome: 'pedra natural (canjiquinha)', nivel: 3, preco: 260, cor: '#b3a48c', desenho: 'pedra', descricao: 'Filetes de pedra assentados à mão.' },
    { id: 'porcelanato', nome: 'porcelanato de fachada', nivel: 4, preco: 380, cor: '#d6d0c6', desenho: 'placas', descricao: 'Placas grandes, rejunte fino: limpa com mangueira.' },
    { id: 'pedra_ferro', nome: 'pedra ferro e vidro', nivel: 4, preco: 520, cor: '#5b5650', desenho: 'pedra', descricao: 'Pedra escura, esquadria de alumínio preto, vidro do chão ao teto.' },
    { id: 'marmore', nome: 'mármore travertino', nivel: 5, preco: 1100, cor: '#dcc9a8', desenho: 'placas', manutencao: 0.2, descricao: 'Placas de travertino na fachada inteira: casa de revista.' },
    { id: 'assinada', nome: 'fachada assinada por arquiteto', nivel: 6, preco: 2600, cor: '#ece6da', cor2: '#2e2b28', desenho: 'assinada', manutencao: 0.3, descricao: 'Volumes recompostos, brises, pedra e madeira: um projeto, não um acabamento.' }
  ],
  paisagismo: [
    { id: 'nenhum', nome: 'o quintal como está', nivel: 1, preco: 0, fixo: true, desenho: 'nenhum', descricao: 'Terra batida, um pé de alguma coisa.' },
    { id: 'gramado', nome: 'gramado e canteiro simples', nivel: 1, preco: 35, desenho: 'gramado', descricao: 'Grama em placas e um canteiro na frente.' },
    { id: 'canteiros', nome: 'canteiros floridos e arbustos', nivel: 2, preco: 70, desenho: 'canteiros', manutencao: 0.4, descricao: 'Flores da estação, buxinhos, uma pitangueira.' },
    { id: 'tropical', nome: 'jardim tropical', nivel: 3, preco: 140, terrenoMin: 40, desenho: 'tropical', manutencao: 0.6, descricao: 'Palmeiras, helicônias, costela-de-adão: sombra e verde.' },
    { id: 'pomar', nome: 'pomar e horta', nivel: 3, preco: 110, terrenoMin: 80, desenho: 'pomar', manutencao: 0.6, descricao: 'Laranjeira, limoeiro, jabuticabeira e a horta no fundo.' },
    { id: 'zen', nome: 'jardim seco com pedras', nivel: 3, preco: 160, terrenoMin: 40, desenho: 'zen', manutencao: 0.3, descricao: 'Seixos, bambu, pouca água: bonito e quase sem cuidado.' },
    { id: 'assinado', nome: 'paisagismo assinado', nivel: 5, preco: 420, terrenoMin: 200, desenho: 'assinado', manutencao: 1.1, descricao: 'Projeto de paisagista: árvores adultas, luz no jardim, irrigação automática.' },
    { id: 'botanico', nome: 'jardim botânico particular', nivel: 6, preco: 900, terrenoMin: 500, desenho: 'botanico', manutencao: 1.8, descricao: 'Espécies raras, estufa, espelho d\'água — e um jardineiro só para ele.' }
  ],
  caminho: [
    { id: 'terra', nome: 'terra e brita', nivel: 1, preco: 0, fixo: true, desenho: 'terra', descricao: 'O caminho que o pé fez.' },
    { id: 'cimento', nome: 'calçada de cimento', nivel: 1, preco: 90, desenho: 'cimento', descricao: 'Cimentado liso até a porta.' },
    { id: 'intertravado', nome: 'piso intertravado', nivel: 2, preco: 120, desenho: 'blocos', descricao: 'Blocos de concreto encaixados: a água da chuva escoa.' },
    { id: 'pedra_portuguesa', nome: 'pedra portuguesa', nivel: 3, preco: 210, desenho: 'mosaico', descricao: 'Mosaico de pedra preta e branca, assentado à mão.' },
    { id: 'deck', nome: 'caminho de deck de madeira', nivel: 3, preco: 380, cor: '#9a6a40', desenho: 'deck', manutencao: 0.1, descricao: 'Tábuas de cumaru sobre o jardim.' },
    { id: 'pedra_natural', nome: 'pedra natural em placas', nivel: 4, preco: 460, cor: '#c9bba1', desenho: 'placas', descricao: 'Placas irregulares de pedra com grama no meio.' },
    { id: 'travertino', nome: 'travertino com borda de grama', nivel: 5, preco: 880, cor: '#dcc9a8', desenho: 'placas', descricao: 'O mesmo travertino da casa, até o portão.' }
  ],
  luz_externa: [
    { id: 'nenhuma', nome: 'a lâmpada da porta', nivel: 1, preco: 0, fixo: true, desenho: 'nenhuma', descricao: 'Uma lâmpada acima da porta.' },
    { id: 'arandelas', nome: 'arandelas na fachada', nivel: 2, preco: 900, fixo: true, desenho: 'arandelas', descricao: 'Duas arandelas de cada lado da porta.' },
    { id: 'balizadores', nome: 'balizadores no caminho', nivel: 3, preco: 2400, fixo: true, desenho: 'balizadores', manutencao: 10, descricao: 'Pequenos postes de luz baixa ao longo do caminho.' },
    { id: 'espetos', nome: 'espetos de luz nas árvores', nivel: 3, preco: 3200, fixo: true, desenho: 'espetos', manutencao: 12, descricao: 'A luz de baixo para cima nas copas: o jardim aparece de noite.' },
    { id: 'projeto', nome: 'projeto luminotécnico externo', nivel: 5, preco: 18000, fixo: true, desenho: 'projeto', manutencao: 40, descricao: 'Fachada, jardim e caminho desenhados com luz, em cenas.' }
  ],
  portao: [
    { id: 'simples', nome: 'portão de grade', nivel: 1, preco: 0, fixo: true, desenho: 'grade', descricao: 'Grade pintada e cadeado.' },
    { id: 'basculante', nome: 'portão basculante de chapa', nivel: 2, preco: 3200, fixo: true, desenho: 'chapa', descricao: 'Chapa de aço que sobe inteira.' },
    { id: 'automatico', nome: 'portão automático com controle', nivel: 3, preco: 6800, fixo: true, desenho: 'automatico', manutencao: 15, descricao: 'Motor, controle remoto, o carro entra sem descer na chuva.' },
    { id: 'madeira', nome: 'portão de madeira ripada', nivel: 4, preco: 14000, fixo: true, desenho: 'madeira', manutencao: 20, descricao: 'Madeira maciça ripada, automático, com pedestre ao lado.' },
    { id: 'pivotante', nome: 'portão pivotante de aço corten', nivel: 5, preco: 38000, fixo: true, desenho: 'corten', manutencao: 30, descricao: 'Uma lâmina de aço envelhecido que gira inteira: a entrada é a obra.' }
  ]
};

/** A área da fachada de cada tipo de casa (m², a frente) e do caminho (m²): pesam no preço. */
export const AREA_DA_FACHADA: Record<string, number> = { casa_simples: 30, casa_2q: 38, casa_3q: 55, casa_grande: 90, mansao: 180, sitio: 60 };
export const AREA_DO_CAMINHO: Record<string, number> = { casa_simples: 6, casa_2q: 10, casa_3q: 16, casa_grande: 30, mansao: 80, sitio: 60 };
