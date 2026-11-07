/**
 * VIDA 13 (correção final) — PERSONAGENS DE OBRAS EM DOMÍNIO PÚBLICO, lote D. Arte em `ui/avatar/tatuagens13cD`.
 * Quadrinhos e animação antigos (McCay, Herriman, Segar 1929, Outcault), epopeias, mitos, Shakespeare, Dante, Cervantes,
 * Swift e os contos de Perrault, Grimm e Andersen — sempre pelo texto e pelas ilustrações originais (Doré, Crane, Flaxman).
 * Puro (só tipos e dados): pacote `motor-casa`.
 */
import type { TamanhoDeTatuagem } from './tatuagens';
import type { LoteDeClassicos } from './tatuagens13cTipos';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
const P = 'cultura_pop' as const;

export const CLASSICOS_D: LoteDeClassicos = {
  midias: {
    'Little Nemo': 'quadrinhos', 'Krazy Kat': 'quadrinhos', 'Popeye (1929)': 'quadrinhos', 'O Menino Amarelo': 'quadrinhos',
    'Gertie, o Dinossauro': 'animacoes', 'As Viagens de Gulliver': 'livros', 'Odisseia': 'lendas', 'Mitologia grega': 'lendas',
    'Hamlet': 'livros', 'Lendas arturianas': 'lendas', 'A Divina Comédia': 'livros', 'Contos de fadas': 'lendas'
  },
  lista: [
    { id: 'nemo_cama_que_anda', nome: 'Little Nemo na cama que anda', estilo: P, referencia: 'Little Nemo', tamanhos: T(2, 3), colorida: true, descricao: 'Little Nemo de camisola agarrado à cama, que estica as pernas compridas e sai andando por cima dos telhados.' },
    { id: 'krazy_kat_e_ignatz', nome: 'Krazy Kat e o tijolo de Ignatz', estilo: P, referencia: 'Krazy Kat', tamanhos: T(2, 3), colorida: true, proporcao: 1.35, descricao: 'O rato Ignatz atira o tijolo e Krazy Kat, a gata preta, recebe a pancada com um coração no deserto.' },
    { id: 'popeye_marinheiro_1929', nome: 'Popeye de 1929', estilo: P, referencia: 'Popeye (1929)', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.85, descricao: 'Popeye como estreou no Thimble Theatre: queixo enorme, olho fechado, cachimbo e os antebraços com âncora.' },
    { id: 'menino_amarelo', nome: 'O Menino Amarelo', estilo: P, referencia: 'O Menino Amarelo', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'O Yellow Kid careca e orelhudo, de camisolão amarelo até os pés, abrindo os braços com o sorriso banguela.' },
    { id: 'gertie_dinossauro', nome: 'Gertie, o dinossauro', estilo: P, referencia: 'Gertie, o Dinossauro', tamanhos: T(2, 3), colorida: true, proporcao: 1.4, descricao: 'Gertie, o dinossauro do desenho de 1914, de pescoço comprido e sorriso tímido, arrancando uma árvore.' },
    { id: 'quixote_e_sancho', nome: 'Dom Quixote e Sancho Pança', estilo: P, referencia: 'Dom Quixote', tamanhos: T(2, 3), colorida: true, proporcao: 1.2, descricao: 'Dom Quixote magro no Rocinante, de lança e bacia de barbeiro na cabeça, e Sancho Pança gordinho no burro.' },
    { id: 'gulliver_amarrado', nome: 'Gulliver amarrado em Lilipute', estilo: P, referencia: 'As Viagens de Gulliver', tamanhos: T(2, 3), colorida: true, proporcao: 1.5, descricao: 'Gulliver deitado na praia, preso por mil cordinhas, e os liliputianos subindo no peito dele.' },
    { id: 'ulisses_no_mastro', nome: 'Ulisses e as sereias', estilo: P, referencia: 'Odisseia', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'Ulisses amarrado ao mastro do navio, a vela listrada estufada e as sereias cantando nas pedras.' },
    { id: 'ciclope_polifemo', nome: 'O ciclope Polifemo', estilo: P, referencia: 'Odisseia', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.9, descricao: 'Polifemo, o gigante de um olho só no meio da testa, barba hirsuta e cajado de tronco, na boca da caverna.' },
    { id: 'cabeca_de_medusa', nome: 'Medusa', estilo: P, referencia: 'Mitologia grega', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.9, descricao: 'O rosto da Medusa de olhar que petrifica, o cabelo feito de serpentes verdes que se enroscam e sibilam.' },
    { id: 'hercules_e_a_hidra', nome: 'Hércules e a Hidra', estilo: P, referencia: 'Mitologia grega', tamanhos: T(2, 3), colorida: true, proporcao: 1.15, descricao: 'Hércules de pele de leão na cabeça, clava erguida, contra a Hidra de Lerna e suas muitas cabeças.' },
    { id: 'hamlet_e_yorick', nome: 'Hamlet e o crânio de Yorick', estilo: P, referencia: 'Hamlet', tamanhos: T(1, 2, 3), proporcao: 0.85, descricao: 'Hamlet de gibão preto e gola branca segurando o crânio de Yorick na palma da mão: ser ou não ser.' },
    { id: 'dama_do_lago_excalibur', nome: 'Arthur e a Dama do Lago', estilo: P, referencia: 'Lendas arturianas', tamanhos: T(2, 3), colorida: true, proporcao: 1.2, descricao: 'O braço da Dama do Lago erguendo Excalibur da água e o Rei Arthur, de coroa e cota de malha, indo buscá-la.' },
    { id: 'mago_merlin', nome: 'Merlin', estilo: P, referencia: 'Lendas arturianas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'Merlin de barba branca até a cintura, chapéu pontudo e manto de estrelas, o cajado aceso na mão.' },
    { id: 'dante_alighieri', nome: 'Dante de louros', estilo: P, referencia: 'A Divina Comédia', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.85, descricao: 'Dante de perfil, o nariz aquilino, capuz vermelho e coroa de louros, diante das chamas do Inferno.' },
    { id: 'chapeuzinho_e_o_lobo', nome: 'Chapeuzinho Vermelho e o Lobo', estilo: P, referencia: 'Contos de fadas', tamanhos: T(2, 3), colorida: true, proporcao: 1.2, descricao: 'Chapeuzinho Vermelho de capa e cestinha no caminho da floresta e o Lobo espiando de trás da árvore.' },
    { id: 'gato_de_botas', nome: 'O Gato de Botas', estilo: P, referencia: 'Contos de fadas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'O Gato de Botas em pé, de chapéu de pluma e botas de cano alto, com o saco de caça no ombro.' },
    { id: 'pequena_sereia_andersen', nome: 'A Pequena Sereia de Andersen', estilo: P, referencia: 'Contos de fadas', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A pequena sereia do conto de Andersen, de longos cabelos claros, sentada na pedra olhando o castelo do príncipe.' },
    { id: 'joao_e_maria_casa_de_doces', nome: 'João e Maria na casa de doces', estilo: P, referencia: 'Contos de fadas', tamanhos: T(2, 3), colorida: true, proporcao: 1.15, descricao: 'João e Maria de mãos dadas diante da casa de pão de mel, telhado de bolo e janelas de açúcar.' }
  ]
};
