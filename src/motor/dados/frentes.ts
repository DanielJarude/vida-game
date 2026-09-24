/**
 * Frentes: aquilo em que alguém pode ficar bom.
 *
 * Cada frente tem uma categoria, uma janela em que se aprende mais depressa
 * (o corpo aprende futebol melhor aos 10 do que aos 40; um instrumento, em
 * qualquer idade, mas mais rápido cedo), um ritmo de esquecimento quando a
 * prática para e as palavras com que o jogo descreve cada estágio.
 *
 * Nada aqui é mostrado como número.
 */

import type { Dominio } from '../tipos';

export type Categoria = 'esporte' | 'arte' | 'estudo' | 'social' | 'oficio';

export interface ModeloFrente {
  id: Dominio;
  nome: string;
  categoria: Categoria;
  /** Idades em que a prática rende mais (aprendizado mais rápido). */
  janela: [number, number];
  /** Quanto a habilidade cai por ano sem prática. */
  esquece: number;
  /** O corpo cobra depois desta idade (esportes). */
  declinio?: number;
  /** Frases por estágio de habilidade: iniciante, se vira, bom, destaque, muito bom, fora de série. */
  estagios: [string, string, string, string, string, string];
  /** Como se diz que tem facilidade. */
  facilidade: string;
}

const m = (x: ModeloFrente) => x;

export const FRENTES: readonly ModeloFrente[] = [
  m({ id: 'futebol', nome: 'futebol', categoria: 'esporte', janela: [6, 17], esquece: 3, declinio: 29,
    estagios: ['está começando a pegar o jeito da bola', 'joga direitinho', 'joga bem', 'se destaca nos campeonatos', 'chama atenção de quem entende de bola', 'joga como poucos'],
    facilidade: 'tem facilidade com a bola' }),
  m({ id: 'volei', nome: 'vôlei', categoria: 'esporte', janela: [9, 18], esquece: 3, declinio: 31,
    estagios: ['está aprendendo o toque', 'já joga com a turma', 'joga bem', 'é destaque na quadra', 'chama atenção nos torneios', 'joga como poucos'],
    facilidade: 'tem mão boa para o vôlei' }),
  m({ id: 'natacao', nome: 'natação', categoria: 'esporte', janela: [5, 16], esquece: 3, declinio: 27,
    estagios: ['está perdendo o medo da água', 'nada bem', 'nada rápido', 'ganha provas', 'tem tempo de competição séria', 'nada como poucos'],
    facilidade: 'se dá bem na água' }),
  m({ id: 'atletismo', nome: 'atletismo', categoria: 'esporte', janela: [10, 19], esquece: 3, declinio: 30,
    estagios: ['corre por correr', 'corre bem', 'tem boas marcas', 'vence provas', 'tem índice para competições maiores', 'corre como poucos'],
    facilidade: 'tem perna para correr' }),
  m({ id: 'lutas', nome: 'luta', categoria: 'esporte', janela: [7, 20], esquece: 2.5, declinio: 32,
    estagios: ['está nas primeiras faixas', 'treina com seriedade', 'luta bem', 'vence campeonatos', 'é faixa respeitada', 'luta como poucos'],
    facilidade: 'tem corpo e cabeça para a luta' }),

  m({ id: 'musica', nome: 'música', categoria: 'arte', janela: [6, 25], esquece: 1.5,
    estagios: ['está nos primeiros acordes', 'já toca umas músicas', 'toca bem', 'toca bem o bastante para se apresentar sem passar vergonha', 'toca como gente do meio', 'toca como poucos'],
    facilidade: 'tem ouvido para música' }),
  m({ id: 'teatro', nome: 'teatro', categoria: 'arte', janela: [10, 30], esquece: 1.5,
    estagios: ['está perdendo a vergonha do palco', 'decora e segura uma cena', 'atua bem', 'rouba a cena', 'atua como gente do meio', 'atua como poucos'],
    facilidade: 'tem presença de palco' }),
  m({ id: 'danca', nome: 'dança', categoria: 'arte', janela: [5, 22], esquece: 2.5, declinio: 33,
    estagios: ['está aprendendo os passos', 'dança direitinho', 'dança bem', 'se destaca no grupo', 'dança como gente do meio', 'dança como poucos'],
    facilidade: 'tem ritmo no corpo' }),
  m({ id: 'desenho', nome: 'desenho', categoria: 'arte', janela: [6, 28], esquece: 1.2,
    estagios: ['rabisca por gosto', 'desenha direitinho', 'desenha bem', 'desenhar virou uma coisa séria', 'tem traço próprio', 'desenha como poucos'],
    facilidade: 'tem mão para o desenho' }),
  m({ id: 'escrita', nome: 'escrita', categoria: 'arte', janela: [11, 40], esquece: 1,
    estagios: ['escreve por gosto', 'escreve direitinho', 'escreve bem', 'escreve com voz própria', 'escreve como gente do meio', 'escreve como poucos'],
    facilidade: 'tem jeito com as palavras' }),
  m({ id: 'fotografia', nome: 'fotografia', categoria: 'arte', janela: [13, 40], esquece: 1.2,
    estagios: ['fotografa com o celular', 'tem olho para foto', 'fotografa bem', 'tem foto que para o olhar', 'fotografa como gente do meio', 'fotografa como poucos'],
    facilidade: 'tem olho para imagem' }),

  m({ id: 'exatas', nome: 'matemática', categoria: 'estudo', janela: [8, 22], esquece: 1,
    estagios: ['sofre com os números', 'se vira em matemática', 'vai bem em matemática', 'é destaque da turma em matemática', 'tem cabeça de exatas', 'é fora de série em matemática'],
    facilidade: 'tem cabeça para números' }),
  m({ id: 'linguagens', nome: 'português e redação', categoria: 'estudo', janela: [8, 25], esquece: 0.8,
    estagios: ['tropeça na redação', 'se vira em português', 'escreve bem na escola', 'faz das melhores redações da turma', 'escreve e argumenta muito bem', 'tem domínio raro da língua'],
    facilidade: 'tem jeito com texto' }),
  m({ id: 'ciencias', nome: 'ciências', categoria: 'estudo', janela: [9, 22], esquece: 1,
    estagios: ['acha ciências difícil', 'se vira em ciências', 'vai bem em ciências', 'transforma curiosidade em nota alta', 'tem cabeça de cientista', 'é fora de série em ciências'],
    facilidade: 'tem curiosidade de cientista' }),
  m({ id: 'humanas', nome: 'história e geografia', categoria: 'estudo', janela: [9, 25], esquece: 0.8,
    estagios: ['acha história decoreba', 'se vira em humanas', 'vai bem em humanas', 'lê o mundo com gosto', 'argumenta sobre o mundo muito bem', 'é fora de série em humanas'],
    facilidade: 'tem gosto por entender o mundo' }),
  m({ id: 'xadrez', nome: 'xadrez', categoria: 'estudo', janela: [7, 20], esquece: 1.5,
    estagios: ['sabe mexer as peças', 'joga direitinho', 'joga bem', 'ganha torneios da escola', 'tem rating de torneio', 'joga como poucos'],
    facilidade: 'enxerga o tabuleiro longe' }),
  m({ id: 'programacao', nome: 'programação', categoria: 'estudo', janela: [11, 35], esquece: 2,
    estagios: ['está nos primeiros códigos', 'faz uns programinhas', 'programa bem', 'programa de verdade', 'programa como gente do mercado', 'programa como poucos'],
    facilidade: 'pega lógica rápido' }),
  m({ id: 'idiomas', nome: 'inglês', categoria: 'estudo', janela: [6, 25], esquece: 1.5,
    estagios: ['sabe umas palavras', 'lê e entende o básico', 'conversa em inglês', 'fala inglês bem', 'fala inglês com fluência', 'fala como nativo'],
    facilidade: 'pega idioma de ouvido' }),

  m({ id: 'lideranca', nome: 'liderança', categoria: 'social', janela: [12, 35], esquece: 1,
    estagios: ['fala pouco em grupo', 'fala em público sem travar', 'organiza a turma', 'puxa as pessoas', 'lidera com naturalidade', 'lidera como poucos'],
    facilidade: 'tem jeito para puxar gente' }),
  m({ id: 'comunidade', nome: 'trabalho comunitário', categoria: 'social', janela: [12, 70], esquece: 1,
    estagios: ['ajuda quando chamam', 'é presença certa', 'organiza ações', 'é referência no bairro', 'é liderança comunitária', 'é liderança comunitária respeitada'],
    facilidade: 'tem jeito com gente' }),

  m({ id: 'cozinha', nome: 'cozinha', categoria: 'oficio', janela: [12, 45], esquece: 1,
    estagios: ['sabe fazer o básico', 'cozinha bem para a família', 'cozinha bem', 'tem comida que as pessoas pedem', 'cozinha como profissional', 'cozinha como poucos'],
    facilidade: 'tem mão boa para tempero' }),
  m({ id: 'manual', nome: 'conserto e ofício', categoria: 'oficio', janela: [12, 45], esquece: 1,
    estagios: ['sabe trocar uma resistência', 'se vira com ferramenta', 'conserta bem', 'resolve o que ninguém resolve', 'trabalha como profissional', 'tem mão de mestre'],
    facilidade: 'tem mão para ferramenta' }),
  m({ id: 'beleza', nome: 'cabelo e estética', categoria: 'oficio', janela: [13, 45], esquece: 1.2,
    estagios: ['arruma o cabelo das amigas', 'corta direitinho', 'corta bem', 'tem cliente que volta', 'trabalha como profissional', 'tem mão de mestre'],
    facilidade: 'tem mão boa para cabelo' }),
  m({ id: 'vendas', nome: 'vendas', categoria: 'oficio', janela: [14, 50], esquece: 1,
    estagios: ['fica sem jeito para oferecer', 'vende o que acredita', 'vende bem', 'bate meta', 'tem carteira de clientes', 'vende qualquer coisa'],
    facilidade: 'tem lábia' }),
  m({ id: 'campo', nome: 'trabalho no campo', categoria: 'oficio', janela: [10, 50], esquece: 0.8,
    estagios: ['ajuda na roça quando chamam', 'conhece o trabalho da terra', 'sabe cuidar de uma lavoura', 'entende de terra e bicho', 'toca uma produção', 'é produtor respeitado'],
    facilidade: 'tem jeito com a terra' })
];

const POR_ID = new Map(FRENTES.map(f => [f.id, f]));
export const modeloFrente = (d: Dominio) => POR_ID.get(d)!;

/** As matérias da escola: frentes que a escola exercita todo ano. */
export const MATERIAS: readonly Dominio[] = ['exatas', 'linguagens', 'ciencias', 'humanas'];

/** Estágio (0..5) de uma habilidade. */
export const estagioDe = (h: number) => (h < 15 ? 0 : h < 32 ? 1 : h < 50 ? 2 : h < 64 ? 3 : h < 80 ? 4 : 5);
