/**
 * VIDA 13 (correção final) — PERSONAGENS DE OBRAS EM DOMÍNIO PÚBLICO, lote A: terror, mistério e aventura.
 * Arte em `ui/avatar/tatuagens13cA`. Cada peça desenha o personagem ou a criatura em si, pelo texto original e pelas
 * ilustrações de época (Paget, Neuville, Wyeth, o esboço de Lovecraft, os filmes de 1902, 1922 e 1925) — nada do
 * visual de adaptações protegidas (sem a cabeça chata e os parafusos de 1931, sem a capa de forro vermelho, sem a
 * meia-máscara do musical, sem a Disney).
 * Puro (só tipos e dados): pacote `motor-casa`.
 */
import type { TamanhoDeTatuagem } from './tatuagens';
import type { DesenhoDoLote, LoteDeClassicos } from './tatuagens13cTipos';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
const pop = (referencia: string, xs: Omit<DesenhoDoLote, 'estilo' | 'referencia'>[]): DesenhoDoLote[] =>
  xs.map(x => ({ ...x, estilo: 'cultura_pop', referencia }));

export const CLASSICOS_A: LoteDeClassicos = {
  midias: {
    'Nosferatu': 'filmes', 'Frankenstein': 'livros', 'O Médico e o Monstro': 'livros', 'O Homem Invisível': 'livros', 'A Guerra dos Mundos': 'livros',
    'Vinte Mil Léguas Submarinas': 'livros', 'A Ilha do Tesouro': 'livros', 'O Corvo': 'livros', 'O Chamado de Cthulhu': 'livros', 'O Fantasma da Ópera': 'livros',
    'O Corcunda de Notre-Dame': 'livros', 'Viagem à Lua': 'filmes', 'Tarzan': 'livros', 'Robin Hood': 'lendas'
  },
  lista: [
    ...pop('Sherlock Holmes', [
      { id: 'holmes_de_perfil', nome: 'Holmes de perfil', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'Sherlock Holmes de perfil, nariz aquilino, boné de duas abas, capa xadrez e o cachimbo soltando fumaça.' },
      { id: 'holmes_e_watson', nome: 'Holmes e Watson', tamanhos: T(2, 3), colorida: true, descricao: 'Holmes de boné de duas abas e cachimbo ao lado do Dr. Watson de chapéu-coco e bigode.' }
    ]),
    ...pop('Drácula', [
      { id: 'conde_dracula_do_livro', nome: 'O conde do livro', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'O Conde Drácula como Stoker o descreve: velho, bigode branco, orelhas pontudas, todo de preto e as unhas compridas.' },
      { id: 'conde_na_muralha', nome: 'O conde na muralha', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'Drácula descendo de cabeça para baixo a parede do castelo, a capa aberta como asas.' }
    ]),
    ...pop('Nosferatu', [
      { id: 'conde_orlok', nome: 'Conde Orlok', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'O Conde Orlok careca, de orelhas pontudas e dentes de rato, os dedos compridos erguidos.' },
      { id: 'sombra_na_escada', nome: 'Sombra na escada', tamanhos: T(2, 3), descricao: 'A sombra de Orlok subindo a escada, curvada, a mão de garras esticada na frente.' }
    ]),
    ...pop('Frankenstein', [
      { id: 'criatura_do_livro', nome: 'A criatura do livro', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'A criatura de Frankenstein como no livro: cabelo preto comprido, pele amarelada costurada e olhos aguados.' }
    ]),
    ...pop('O Médico e o Monstro', [
      { id: 'jekyll_e_hyde', nome: 'Jekyll e Hyde', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'Um rosto partido ao meio: o Dr. Jekyll penteado e calmo de um lado, o Sr. Hyde descabelado e rosnando do outro.' }
    ]),
    ...pop('O Homem Invisível', [
      { id: 'homem_invisivel', nome: 'O homem das bandagens', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'Griffin, o homem invisível: chapéu, cabeça enfaixada, óculos escuros e uma faixa solta mostrando o vazio.' }
    ]),
    ...pop('A Guerra dos Mundos', [
      { id: 'tripode_marciano', nome: 'Trípode marciano', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'A máquina marciana de três pernas disparando o raio de calor sobre as casas em chamas.' },
      { id: 'marciano_de_tentaculos', nome: 'Marciano de tentáculos', tamanhos: T(1, 2, 3), colorida: true, descricao: 'O marciano de Wells saindo do cilindro: cabeçorra lisa, olhos enormes, boca em V e os tentáculos.' }
    ]),
    ...pop('Vinte Mil Léguas Submarinas', [
      { id: 'capitao_nemo', nome: 'Capitão Nemo', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'O Capitão Nemo de barba preta e casaco de botões, na escotilha redonda do Nautilus.' },
      { id: 'nautilus_e_lula', nome: 'Nautilus e a lula gigante', tamanhos: T(2, 3), colorida: true, proporcao: 1.3, descricao: 'O Nautilus de esporão na proa preso nos braços da lula gigante, o olho dela enorme.' }
    ]),
    ...pop('A Ilha do Tesouro', [
      { id: 'long_john_silver', nome: 'Long John Silver', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'Long John Silver de tricórnio, perna de pau e muleta, com o papagaio Capitão Flint no ombro.' }
    ]),
    ...pop('O Corvo', [
      { id: 'corvo_no_busto', nome: 'Corvo no busto de Palas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'O corvo de Poe pousado no busto branco de Palas, de capacete, em cima da porta.' }
    ]),
    ...pop('O Chamado de Cthulhu', [
      { id: 'cthulhu_do_esboco', nome: 'Cthulhu do esboço', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Cthulhu agachado no pedestal como no esboço de Lovecraft: cabeça de polvo, asas estreitas e garras.' }
    ]),
    ...pop('O Fantasma da Ópera', [
      { id: 'erik_sob_o_lustre', nome: 'Erik sob o lustre', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Erik, o Fantasma da Ópera, de máscara preta inteira e olhos acesos, a capa aberta embaixo do lustre.' }
    ]),
    ...pop('O Corcunda de Notre-Dame', [
      { id: 'quasimodo_nos_sinos', nome: 'Quasímodo nos sinos', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Quasímodo de cabelo ruivo e corcunda, agarrado à corda do grande sino da catedral.' }
    ]),
    ...pop('Moby Dick', [
      { id: 'capitao_ahab', nome: 'Capitão Ahab', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'O Capitão Ahab no convés com a perna de marfim, a cicatriz branca no rosto e o arpão em pé.' }
    ]),
    ...pop('Viagem à Lua', [
      { id: 'foguete_no_olho_da_lua', nome: 'Foguete no olho da Lua', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A Lua de rosto do filme de Méliès fazendo careta, com o foguete cravado no olho.' }
    ]),
    ...pop('Tarzan', [
      { id: 'tarzan_na_liana', nome: 'Tarzan na liana', tamanhos: T(2, 3), colorida: true, descricao: 'Tarzan de tanga e cabelo preto comprido voando no cipó entre as folhas, a faca na cintura.' }
    ]),
    ...pop('Robin Hood', [
      { id: 'robin_de_capuz', nome: 'Robin de capuz', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Robin Hood de capuz verde puxando o arco longo, a flecha apontada e a aljava nas costas.' }
    ])
  ]
};
