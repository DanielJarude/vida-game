/**
 * VIDA 13 (correção final) — PERSONAGENS DE OBRAS EM DOMÍNIO PÚBLICO, lote B. Arte em `ui/avatar/tatuagens13cB`.
 * Clássicos infantis e de fantasia, desenhados a partir do texto e das ilustrações originais (Tenniel, Denslow,
 * Bedford, Mazzanti, Kipling) — nunca do visual das adaptações protegidas (Disney, MGM).
 * Puro (só tipos e dados): pacote `motor-casa`.
 */
import type { TamanhoDeTatuagem } from './tatuagens';
import type { DesenhoDoLote, LoteDeClassicos } from './tatuagens13cTipos';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
const pop = (referencia: string, xs: Omit<DesenhoDoLote, 'estilo' | 'referencia'>[]): DesenhoDoLote[] => xs.map(x => ({ ...x, estilo: 'cultura_pop', referencia }));

export const CLASSICOS_B: LoteDeClassicos = {
  midias: { 'Peter Pan': 'livros', 'As Aventuras de Pinóquio': 'livros', 'O Livro da Selva': 'livros' },
  lista: [
    ...pop('Alice no País das Maravilhas', [
      { id: 'alice_de_tenniel', nome: 'Alice de Tenniel', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'Alice de cabelo comprido e faixa, vestido amarelo e avental branco, como nas gravuras de Tenniel.' },
      { id: 'chapeleiro_maluco', nome: 'Chapeleiro Maluco', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'O Chapeleiro de olhos arregalados, cartola com o cartão 10/6 e gravata-borboleta de bolinhas.' },
      { id: 'coelho_de_colete', nome: 'Coelho de colete', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'O Coelho Branco de casaca e colete, de pé, conferindo o relógio de bolso.' },
      { id: 'gato_de_cheshire', nome: 'Gato de Cheshire', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.2, descricao: 'O Gato de Cheshire no galho, o corpo sumindo em pontilhado e o sorriso enorme ficando.' },
      { id: 'rainha_de_copas', nome: 'Rainha de Copas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.85, descricao: 'A Rainha de Copas de coroa e manto de corações, dedo em riste: cortem-lhe a cabeça!' },
      { id: 'lagarta_do_narguile', nome: 'Lagarta do narguilé', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A Lagarta azul sentada no cogumelo, fumando o narguilé e soltando anéis de fumaça.' }
    ]),
    ...pop('O Mágico de Oz', [
      { id: 'dorothy_e_toto', nome: 'Dorothy e Totó', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'Dorothy de tranças, vestido xadrez azul e branco e sapatos de prata, com o Totó a seus pés.' },
      { id: 'espantalho_de_oz', nome: 'Espantalho de Oz', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'O Espantalho de rosto pintado no saco, chapéu pontudo azul e palha saindo das mangas.' },
      { id: 'homem_de_lata', nome: 'Homem de Lata', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'O Lenhador de Lata com o funil na cabeça, o machado no ombro e a almotolia na mão.' },
      { id: 'leao_covarde', nome: 'Leão Covarde', tamanhos: T(1, 2, 3), colorida: true, descricao: 'O Leão Covarde de juba enorme e sobrancelhas aflitas, uma lágrima escorrendo.' }
    ]),
    ...pop('Peter Pan', [
      { id: 'peter_pan_e_a_flauta', nome: 'Peter Pan e a flauta', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'Peter Pan voando com a roupa de folhas, tocando a flauta de Pã sob a segunda estrela.' },
      { id: 'capitao_gancho', nome: 'Capitão Gancho', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.85, descricao: 'O Capitão Gancho de cachos negros como velas, piteira de dois charutos e o gancho de ferro.' },
      { id: 'crocodilo_tique_taque', nome: 'Crocodilo tique-taque', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.6, descricao: 'O crocodilo de boca aberta com o relógio engolido batendo na barriga: tique-taque.' },
      { id: 'sininho_de_luz', nome: 'Sininho de luz', tamanhos: T(1, 2, 3), colorida: true, descricao: 'Sininho como no livro: uma fadinha vestida de folha dentro de uma bola de luz.' }
    ]),
    ...pop('As Aventuras de Pinóquio', [
      { id: 'pinoquio_de_mazzanti', nome: 'Pinóquio de Mazzanti', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'Pinóquio de madeira, nariz comprido, chapéu de miolo de pão e casaco de papel florido.' },
      { id: 'gepeto_talhando', nome: 'Gepeto talhando', tamanhos: T(2, 3), colorida: true, descricao: 'Gepeto de peruca amarela talhando o tronco de onde sai o boneco de nariz comprido.' }
    ]),
    ...pop('O Livro da Selva', [
      { id: 'mowgli_e_baloo', nome: 'Mowgli e Baloo', tamanhos: T(2, 3), colorida: true, proporcao: 1.2, descricao: 'Mowgli montado nas costas de Baloo, o velho urso pardo que ensina a Lei da Selva.' },
      { id: 'bagheera_no_galho', nome: 'Bagheera no galho', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.6, descricao: 'Bagheera, a pantera negra, deitada no galho com o rabo pendurado e os olhos acesos.' },
      { id: 'kaa_enrodilhada', nome: 'Kaa enrodilhada', tamanhos: T(1, 2, 3), colorida: true, descricao: 'Kaa, a píton de pintas marrons e amarelas, enrolada em anéis e de cabeça erguida.' },
      { id: 'shere_khan', nome: 'Shere Khan', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A cara de Shere Khan, o tigre manco, rosnando com as presas à mostra.' }
    ])
  ]
};
