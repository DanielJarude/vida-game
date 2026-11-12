/**
 * VIDA 17 · O CATÁLOGO CRESCE NA RUA E NA CADEIA — desenhos ORIGINAIS do estúdio (arte em `ui/avatar/tatuagens17`),
 * no traço do VIDA, sobre o que estava pouco representado:
 *
 *   RUA E PERIFERIA   os letterings (a frase de rua em letra cursiva ou gótica, o nome da quebrada, o número do DDD),
 *                     a fé popular (São Jorge, a Santa do manto, o terço na mão, "Deus é fiel"), a infância do morro (a
 *                     pipa, a laje, a várzea), o rap, o grafite, a moto no grau, as máscaras "sorria agora, chore depois".
 *   TRADIÇÃO DE CADEIA os sinais que circulam em cadeias de vários lugares — a lágrima, os três e os cinco pontos, a teia
 *                     de aranha, o relógio sem ponteiros, o arame farpado, a estrela de oito pontas, a janela com grade,
 *                     os riscos dos dias. Cada um com a origem dita (onde se usa, o que pode querer dizer) e o aviso de
 *                     que o sentido VARIA: muita gente usa por estética, e nenhum desenho é prova de crime.
 *   O ROSTO            peças pequenas pensadas para as regiões do rosto (a estrela, a cruz, o coração, o número, a
 *                     frase da testa).
 *
 * Catálogo puro (só tipos): o save guarda só o id — nada muda para quem já tem tatuagem.
 */
import type { DesenhoDeTatuagem, RegiaoDeTatuagem, TamanhoDeTatuagem } from '../../dados/tatuagens';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
const LETRA: RegiaoDeTatuagem[] = ['antebraco', 'antebraco_externo', 'biceps', 'peitoral', 'costelas', 'abdomen', 'costas_alta', 'costas_baixa', 'pescoco', 'nuca', 'coxa', 'canela', 'panturrilha', 'testa'];
const MAO: RegiaoDeTatuagem[] = ['mao', 'dedos', 'pulso', 'pescoco', 'sob_olho', 'bochecha', 'tempora', 'sobrancelha_t', 'nariz', 'queixo', 'tornozelo'];
const ROSTO: RegiaoDeTatuagem[] = ['sob_olho', 'bochecha', 'tempora', 'sobrancelha_t', 'nariz', 'queixo', 'testa', 'mao', 'dedos', 'pulso', 'pescoco'];

type D = Omit<DesenhoDeTatuagem, 'tamanho' | 'tamanhos'> & { tamanhos: TamanhoDeTatuagem[] };
const d = (x: D): DesenhoDeTatuagem => ({ ...x, tamanho: x.tamanhos[Math.min(1, x.tamanhos.length - 1)] });

export const DESENHOS_17: readonly DesenhoDeTatuagem[] = [
  /* ------------------------------------------------ rua e periferia: as letras */
  d({ id: 'letra_vida_loka', nome: '"Vida Loka"', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 3.2, regioes: LETRA, descricao: 'A frase em letra cursiva de rua, com floreio no começo e no fim. Lema de quem segue em frente apesar de tudo.' }),
  d({ id: 'letra_fe_em_deus', nome: '"Fé em Deus"', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 3, regioes: LETRA, descricao: 'Em cursiva, com uma cruzinha no pingo. Das mais pedidas nos estúdios de bairro.' }),
  d({ id: 'letra_quebrada', nome: 'O nome da quebrada (em arco)', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 2.4, regioes: LETRA, texto: 'frase', descricao: 'O nome do bairro (ou da rua, ou da quebrada) em letras góticas arqueadas, com duas estrelas — a placa de quem diz de onde vem.' }),
  d({ id: 'letra_so_deus', nome: '"Só Deus pode me julgar"', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 5, regioes: ['antebraco', 'antebraco_externo', 'costelas', 'costas_alta', 'peitoral', 'abdomen', 'coxa'], descricao: 'A frase inteira em duas linhas de cursiva, com uma faixa embaixo.' }),
  d({ id: 'letra_deus_e_fiel', nome: '"Deus é fiel"', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 3, regioes: LETRA, descricao: 'Em cursiva fina, com raios saindo do "D". Fé dita sem rodeio.' }),
  d({ id: 'numero_ddd', nome: 'O número (DDD, ano, CEP)', estilo: 'periferia', tamanhos: T(1, 2), proporcao: 2, regioes: [...LETRA, ...MAO], texto: 'numero', descricao: 'O número que diz de onde (o DDD da cidade, o CEP) ou quando (o ano), em algarismos grossos com sombra.' }),
  /* ------------------------------------------------ rua e periferia: os desenhos */
  d({ id: 'coroa_rua', nome: 'Coroa', estilo: 'periferia', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, regioes: ['mao', 'pescoco', 'peitoral', 'antebraco', 'biceps', 'ombro', 'dedos', 'testa', 'tempora'], descricao: 'A coroa de três pontas com pedras: ninguém manda em mim — ou "aqui eu sou rei".' }),
  d({ id: 'mascaras_sorria_chore', nome: 'Sorria agora, chore depois', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 1.4, descricao: 'As duas máscaras de palhaço, a que ri e a que chora — da tradição chicana à rua brasileira: a alegria e a tristeza da mesma vida. (Há quem atribua ao palhaço um sentido criminal: é lenda, não regra.)' }),
  d({ id: 'sao_jorge', nome: 'São Jorge', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 0.9, colorida: true, descricao: 'O santo guerreiro a cavalo, a lança no dragão e a lua atrás. Proteção, para quem tem fé nele (e no Ogum de quem o sincretiza).' }),
  d({ id: 'santa_manto', nome: 'A Santa do manto', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 0.68, colorida: true, descricao: 'A silhueta da Santa de manto, mãos postas e raios em volta — a padroeira de muita casa simples.' }),
  d({ id: 'terco_mao', nome: 'Terço na mão', estilo: 'periferia', tamanhos: T(1), proporcao: 0.8, regioes: ['mao', 'pulso', 'pescoco', 'dedos'], descricao: 'As contas do terço dando a volta, com a cruz pendurada. Tatuagem de mão: fica à vista.' }),
  d({ id: 'pipa_laje', nome: 'Pipa', estilo: 'periferia', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'A pipa no céu da laje, com a rabiola comprida. A infância da quebrada.' }),
  d({ id: 'favela_morro', nome: 'O morro', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 2, colorida: true, descricao: 'As casas empilhadas no morro, a caixa d\'água, a antena e o sol se pondo atrás — de onde se vem, com orgulho.' }),
  d({ id: 'moto_grau', nome: 'Moto no grau', estilo: 'periferia', tamanhos: T(2, 3), proporcao: 1.4, descricao: 'A moto empinada numa roda só, o piloto de boné. A cultura do grau.' }),
  d({ id: 'bola_varzea', nome: 'Várzea', estilo: 'periferia', tamanhos: T(1, 2), proporcao: 1.2, descricao: 'A bola de couro gasta sobre a faixa "VÁRZEA" — o campo de terra do domingo.' }),
  d({ id: 'microfone_rap', nome: 'Microfone', estilo: 'periferia', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'O microfone com o fio enrolado e uma estrela: o rap, a rima, a voz de quem não era ouvido.' }),
  d({ id: 'lata_spray', nome: 'Lata de spray', estilo: 'periferia', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'A lata de tinta soltando a nuvem colorida e um pingo escorrendo — o grafite, a parede como tela.' }),
  d({ id: 'caveira_bandana', nome: 'Caveira de bandana', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 0.9, descricao: 'A caveira com a bandana estampada cobrindo a boca. Estética de rua, sem susto.' }),
  d({ id: 'amor_de_mae', nome: 'Amor de mãe', estilo: 'periferia', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.2, descricao: 'O coração com duas rosas e "MÃE" na faixa. Clássico da rua, do quartel e da cadeia.' }),
  d({ id: 'pomba_ramo', nome: 'Pomba com ramo', estilo: 'periferia', tamanhos: T(1, 2, 3), proporcao: 1.2, descricao: 'A pomba em voo, com um ramo no bico: a paz — e, para muita gente, a liberdade depois de um tempo difícil.' }),
  d({ id: 'correntes_partidas', nome: 'Corrente partida', estilo: 'periferia', tamanhos: T(1, 2), proporcao: 1.8, descricao: 'Dois elos que se soltam de uma corrente rompida: liberdade, recomeço.' }),
  d({ id: 'estrela_nautica', nome: 'Estrela náutica', estilo: 'periferia', tamanhos: T(1, 2), colorida: true, regioes: ['mao', 'pulso', 'ombro', 'antebraco', 'pescoco', 'peitoral', 'tempora', 'bochecha', 'joelho'], descricao: 'A estrela de cinco pontas em duas cores, do mar ao asfalto: o rumo.' }),
  /* ------------------------------------------------ tradição de cadeia */
  d({ id: 'lagrima', nome: 'Lágrima (contorno)', estilo: 'cadeia', tamanhos: T(1), proporcao: 0.66, regioes: ['sob_olho', 'bochecha', 'mao', 'dedos', 'pescoco', 'tempora'], descricao: 'A gota embaixo do olho. Em cadeias dos EUA e da América Latina, costuma lembrar uma perda ou um tempo preso; o sentido muda de lugar para lugar — e muita gente usa só pela estética.' }),
  d({ id: 'lagrima_cheia', nome: 'Lágrima (preenchida)', estilo: 'cadeia', tamanhos: T(1), proporcao: 0.66, regioes: ['sob_olho', 'bochecha', 'mao', 'dedos', 'pescoco', 'tempora'], descricao: 'A gota fechada, toda em preto. Algumas tradições distinguem a lágrima vazia da cheia; nenhuma leitura vale para todo mundo.' }),
  d({ id: 'tres_pontos', nome: 'Três pontos', estilo: 'cadeia', tamanhos: T(1), regioes: MAO, descricao: 'Três pontos em triângulo, na mão ou perto do olho. Na tradição chicana, "mi vida loca"; em outros lugares, outras leituras.' }),
  d({ id: 'cinco_pontos', nome: 'Cinco pontos', estilo: 'cadeia', tamanhos: T(1), regioes: MAO, descricao: 'Quatro pontos e um no meio, como num dado: o preso entre as quatro paredes. Comum em cadeias da Europa e da América Latina.' }),
  d({ id: 'teia_aranha', nome: 'Teia de aranha', estilo: 'cadeia', tamanhos: T(1, 2), regioes: ['ombro', 'triceps', 'antebraco_externo', 'antebraco', 'mao', 'pescoco', 'joelho', 'tempora'], descricao: 'A teia que se abre do canto (no cotovelo, de tradição). Em algumas cadeias, tempo cumprido; no punk e no old school, virou estética.' }),
  d({ id: 'relogio_sem_ponteiros', nome: 'Relógio sem ponteiros', estilo: 'cadeia', tamanhos: T(1, 2, 3), descricao: 'O relógio de bolso sem os ponteiros: o tempo parado de quem cumpre pena — ou de quem perdeu alguém. Cada um lê do seu jeito.' }),
  d({ id: 'arame_farpado', nome: 'Arame farpado', estilo: 'cadeia', tamanhos: T(1, 2), faixa: true, proporcao: 6, regioes: ['biceps', 'antebraco', 'pulso', 'coxa', 'panturrilha', 'canela', 'tornozelo', 'pescoco', 'testa'], descricao: 'O fio com as farpas dando a volta no braço. Para alguns, pena cumprida; para outros, só a braçadeira dos anos 90.' }),
  d({ id: 'estrela_oito_pontas', nome: 'Estrela de oito pontas', estilo: 'cadeia', tamanhos: T(1, 2), regioes: ['ombro', 'peitoral', 'joelho', 'mao', 'pescoco', 'tempora', 'bochecha'], descricao: 'A estrela de oito pontas com o centro sombreado. Na tradição das prisões russas, nos ombros e nos joelhos; fora dela, é só uma estrela.' }),
  d({ id: 'janela_grade', nome: 'Janela com grade', estilo: 'cadeia', tamanhos: T(1, 2, 3), proporcao: 0.85, descricao: 'A janela da cela com as grades, o sol e um pássaro do lado de fora. Saudade da rua.' }),
  d({ id: 'riscos_dias', nome: 'Os dias contados', estilo: 'cadeia', tamanhos: T(1, 2), proporcao: 2.2, regioes: ['antebraco', 'antebraco_externo', 'pulso', 'mao', 'costelas', 'dedos', 'canela'], descricao: 'Os riscos de contar os dias, de cinco em cinco, como na parede.' }),
  d({ id: 'letra_liberdade', nome: '"Liberdade" em gótico', estilo: 'cadeia', tamanhos: T(1, 2, 3), proporcao: 3.4, regioes: LETRA, descricao: 'A palavra em letra gótica, com uma pomba pequena no fim.' }),
  /* ------------------------------------------------ o rosto */
  d({ id: 'estrela_rosto', nome: 'Estrelinha', estilo: 'minimalista', tamanhos: T(1), regioes: ROSTO, descricao: 'A estrela pequena e cheia, do tamanho de uma pinta.' }),
  d({ id: 'cruz_rosto', nome: 'Cruzinha', estilo: 'minimalista', tamanhos: T(1), proporcao: 0.7, regioes: ROSTO, descricao: 'A cruz pequena de traço firme — perto do olho, na têmpora, na mão.' }),
  d({ id: 'coracao_rosto', nome: 'Coraçãozinho cheio', estilo: 'minimalista', tamanhos: T(1), regioes: ROSTO, descricao: 'O coração pequeno todo preenchido.' }),
  d({ id: 'numero_rosto', nome: 'Número pequeno', estilo: 'lettering', tamanhos: T(1), proporcao: 1.6, regioes: ROSTO, texto: 'numero', descricao: 'Dois ou três algarismos finos: uma data, um DDD, um número que importa.' }),
  d({ id: 'frase_testa', nome: 'Frase na testa', estilo: 'lettering', tamanhos: T(1), faixa: true, proporcao: 5, regioes: ['testa', 'pescoco', 'nuca', 'pulso'], texto: 'frase', descricao: 'Uma palavra (ou uma frase curta) em letra gótica de um lado ao outro da testa. Não passa despercebida.' })
];

/** VIDA 17: os conjuntos novos (o estúdio faz os que faltam; o que já existe na região entra no conjunto). */
export const MODELOS_17: readonly import('../../dados/tatuagens').ModeloDeComposicao[] = [
  { id: 'manga_quebrada', nome: 'Manga da quebrada', tipo: 'manga', fundo: 'nuvens', cor: 'cinza', descricao: 'São Jorge no bíceps, o morro no tríceps, a pipa no ombro, o terço no antebraço e o nome da quebrada por fora — em preto e cinza, com fumaça entre eles.',
    pecas: [{ regiao: 'ombro', desenho: 'pipa_laje', tamanho: 2 }, { regiao: 'biceps', desenho: 'sao_jorge', tamanho: 3 }, { regiao: 'triceps', desenho: 'favela_morro', tamanho: 3 }, { regiao: 'antebraco', desenho: 'pomba_ramo', tamanho: 2 }, { regiao: 'antebraco_externo', desenho: 'letra_quebrada', tamanho: 2 }] },
  { id: 'meia_manga_fe', nome: 'Meia manga da fé', tipo: 'meia_manga', fundo: 'nuvens', cor: 'cinza', descricao: 'A Santa do manto no bíceps, a coroa no ombro e "Deus é fiel" no tríceps.',
    pecas: [{ regiao: 'ombro', desenho: 'coroa_rua', tamanho: 2 }, { regiao: 'biceps', desenho: 'santa_manto', tamanho: 3 }, { regiao: 'triceps', desenho: 'letra_deus_e_fiel', tamanho: 3 }] },
  { id: 'peito_familia', nome: 'Peito da família', tipo: 'peito', fundo: 'nenhum', cor: 'preta', descricao: '"Família" em gótico atravessando o peito e as mãos em prece no centro.',
    pecas: [{ regiao: 'peitoral', desenho: 'palavra_gotica', tamanho: 3, lado: 'd' }, { regiao: 'peitoral', desenho: 'amor_de_mae', tamanho: 2, lado: 'e' }, { regiao: 'centro_peito', desenho: 'maos_rezando', tamanho: 2 }] },
  { id: 'manga_cadeia', nome: 'Manga de cadeia', tipo: 'manga', fundo: 'blackwork', cor: 'preta', descricao: 'A teia no ombro, o relógio sem ponteiros, a janela com grade, os dias contados e o arame no pulso, com o preto fechando os vãos. (Estética; nenhum desenho é prova de nada.)',
    pecas: [{ regiao: 'ombro', desenho: 'teia_aranha', tamanho: 2 }, { regiao: 'biceps', desenho: 'relogio_sem_ponteiros', tamanho: 3 }, { regiao: 'triceps', desenho: 'janela_grade', tamanho: 3 }, { regiao: 'antebraco', desenho: 'riscos_dias', tamanho: 2 }, { regiao: 'pulso', desenho: 'arame_farpado', tamanho: 1 }] }
];
