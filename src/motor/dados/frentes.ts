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

import { linguaEstrangeiraDaEscola, nomeDaMateria } from '../mundo/materias';
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
  m({ id: 'basquete', nome: 'basquete', categoria: 'esporte', janela: [9, 18], esquece: 3, declinio: 31,
    estagios: ['está aprendendo a quicar sem olhar para a bola', 'já joga com a turma', 'joga bem', 'é destaque na quadra', 'chama atenção nos torneios', 'joga como poucos'],
    facilidade: 'tem mão boa para o arremesso' }),
  m({ id: 'tenis', nome: 'tênis', categoria: 'esporte', janela: [6, 16], esquece: 3, declinio: 29,
    estagios: ['ainda erra mais do que acerta a bola', 'troca bola com segurança', 'joga bem', 'ganha torneios da região', 'tem jogo de circuito', 'joga como poucos'],
    facilidade: 'tem mão e cabeça para o tênis' }),
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
  // FIX pós-playtest humano: a língua da escola é a de onde se estuda (`mundo/materias`) — "se vira em português" no
  // Japão era vazamento. Getters: o nome é lido na hora, no país da vida que está sendo lida.
  m({ id: 'linguagens', get nome() { return nomeDaMateria('linguagens', 'aula'); }, categoria: 'estudo', janela: [8, 25], esquece: 0.8,
    get estagios() { const l = nomeDaMateria('linguagens'); return ['tropeça na redação', `se vira em ${l}`, 'escreve bem na escola', 'faz das melhores redações da turma', 'escreve e argumenta muito bem', 'tem domínio raro da língua'] as [string, string, string, string, string, string]; },
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
  m({ id: 'idiomas', get nome() { return linguaEstrangeiraDaEscola(); }, categoria: 'estudo', janela: [6, 25], esquece: 1.5,
    get estagios() { const l = linguaEstrangeiraDaEscola(); return ['sabe umas palavras', 'lê e entende o básico', `conversa em ${l}`, `fala ${l} bem`, `fala ${l} com fluência`, 'fala como nativo'] as [string, string, string, string, string, string]; },
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

/** Estágio (0..5) de uma habilidade — a régua ABSOLUTA (a de um adulto: o que se sabe, sem comparar com ninguém). */
export const estagioDe = (h: number) => (h < 15 ? 0 : h < 32 ? 1 : h < 50 ? 2 : h < 64 ? 3 : h < 80 ? 4 : 5);

/**
 * REWORK 9 · EDU-01 (mudou para cá no REWORK 9.5): o que se espera saber em cada idade — a curva do aluno TÍPICO
 * (a mediana da média das matérias numa população simulada, 8 → 17 anos).
 */
export function esperadoNaSerie(i: number): number {
  const k = Math.max(0, i - 6);
  return Math.min(60, Math.max(3, 1.9 + 4.25 * k - 0.035 * k * k));
}

export type RelacaoComASerie = 'abaixo' | 'perto' | 'no_ritmo' | 'acima' | 'bem_acima';
export const PALAVRA_DA_RELACAO: Record<RelacaoComASerie, string> = { abaixo: 'abaixo do esperado para a série', perto: 'perto do esperado para a série', no_ritmo: 'no ritmo da turma', acima: 'acima da turma', bem_acima: 'bem acima da turma' };

export interface ReguaDaFrente {
  /** O estágio (0..5) das palavras da frente (`estagios`). */
  estagio: number;
  palavra: string;
  /** Qual régua: a da SÉRIE (uma matéria, enquanto se está na escola) ou a absoluta. */
  regua: 'serie' | 'absoluta';
  relacao?: RelacaoComASerie;
  /** O que se espera saber na idade (a curva do aluno típico), quando a régua é a da série. */
  esperado?: number;
}

/**
 * REWORK 9.5 · EDU-02 — A RÉGUA CERTA PARA CADA FRASE. O playtest viu Português ir de 3,2 para 8,6 e a frase
 * continuar "tropeça na redação": a frase vinha da régua ABSOLUTA (abaixo de 15, "tropeça"), e 8,6 aos 8 anos é o que
 * se espera na série. Uma matéria, enquanto se está na escola, é descrita pela régua da SÉRIE (o domínio diante do aluno
 * típico daquela idade); o adulto que estuda, e toda frente que não é matéria, pela absoluta. Domínio ≠ nota: a nota do
 * ano tem outras causas (a presença, a postura, a casa, o ano) e é mostrada à parte.
 */
export function reguaDaFrente(d: Dominio, h: number, contexto?: { idade: number; naEscola: boolean }): ReguaDaFrente {
  const m = modeloFrente(d);
  const abs = estagioDe(h);
  if (!contexto?.naEscola || !MATERIAS.includes(d)) return { estagio: abs, palavra: m.estagios[abs], regua: 'absoluta' };
  const esperado = esperadoNaSerie(contexto.idade);
  const r = h / esperado;
  const relacao: RelacaoComASerie = r < 0.6 ? 'abaixo' : r < 0.9 ? 'perto' : r < 1.2 ? 'no_ritmo' : r < 1.5 ? 'acima' : 'bem_acima';
  const rel = ({ abaixo: 0, perto: 1, no_ritmo: 2, acima: 3, bem_acima: 4 } as const)[relacao];
  // Quem já sabe como um adulto que domina a matéria (a régua absoluta lá em cima) é dito assim, em qualquer idade.
  const estagio = abs >= 4 && abs > rel ? abs : rel;
  return { estagio, palavra: m.estagios[estagio], regua: 'serie', relacao, esperado: Math.round(esperado * 10) / 10 };
}
