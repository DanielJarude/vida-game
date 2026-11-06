/**
 * VIDA 12.9 — HOBBIES COM HISTÓRIA: o instrumento que se aprende (cada um com o seu caminho: o violão anda rápido no
 * começo, o violino demora) e os marcos de cada atividade criativa — a primeira música inteira, a foto impressa na
 * parede, o almoço de domingo que agora é seu, a horta que dá tempero. Puro (só tipos): as regras estão em
 * `sistemas/hobbies129`. Os marcos vêm da habilidade de verdade (as frentes que as rotinas já praticam), não de sorteio.
 */
import type { Dominio } from '../tipos';

export interface Instrumento129 {
  id: string;
  nome: string;
  /** As coisas do catálogo que são este instrumento (ter uma em casa acelera). */
  coisas: string[];
  /** Quanto demora (1 = a média): meses de prática por mês vivido são divididos por isto. */
  dificuldade: number;
}

export const INSTRUMENTOS: Instrumento129[] = [
  { id: 'violao', nome: 'violão', coisas: ['violao'], dificuldade: 0.9 },
  { id: 'guitarra', nome: 'guitarra', coisas: ['guitarra'], dificuldade: 1 },
  { id: 'piano', nome: 'piano', coisas: ['piano', 'teclado'], dificuldade: 1.15 },
  { id: 'bateria', nome: 'bateria', coisas: ['bateria'], dificuldade: 1 },
  { id: 'violino', nome: 'violino', coisas: ['violino'], dificuldade: 1.45 },
  { id: 'cavaquinho', nome: 'cavaquinho', coisas: ['cavaquinho'], dificuldade: 0.85 },
  { id: 'saxofone', nome: 'saxofone', coisas: ['saxofone'], dificuldade: 1.2 },
  { id: 'sanfona', nome: 'sanfona', coisas: ['sanfona'], dificuldade: 1.25 },
  { id: 'pandeiro', nome: 'pandeiro', coisas: ['pandeiro'], dificuldade: 0.8 },
  { id: 'canto', nome: 'canto', coisas: [], dificuldade: 1 }
];
export const instrumento = (id?: string) => INSTRUMENTOS.find(i => i.id === id);

/** Os degraus de um instrumento, pelos meses de prática efetiva (já divididos pela dificuldade). */
export const NIVEIS_DO_INSTRUMENTO: { meses: number; nome: string; marco: string }[] = [
  { meses: 0, nome: 'primeiros acordes', marco: '' },
  { meses: 10, nome: 'iniciante', marco: 'Tocou uma música inteira de ponta a ponta no {instrumento}, sem parar.' },
  { meses: 30, nome: 'básico', marco: 'Já toca de ouvido no {instrumento}: a música toca no rádio, você acompanha.' },
  { meses: 70, nome: 'intermediário', marco: 'Tocou o {instrumento} para gente de fora pela primeira vez — e as mãos não tremeram.' },
  { meses: 140, nome: 'avançado', marco: 'O {instrumento} virou parte de você: repertório próprio, arranjo próprio.' },
  { meses: 260, nome: 'de virtuose', marco: 'Quem ouve você no {instrumento} pergunta onde você estudou.' }
];

/** Os marcos de cada atividade criativa: pela habilidade da frente que a rotina pratica. Um por degrau, uma vez. */
export interface MarcoDeHobby { hobby: string; frente: Dominio; habilidade: number; texto: string; efeito?: 'venda_foto' | 'venda_desenho' | 'almoco' | 'horta' | 'presente_feito' }
export const MARCOS_DE_HOBBY: MarcoDeHobby[] = [
  { hobby: 'fotografia', frente: 'fotografia', habilidade: 25, texto: 'Imprimiu uma foto sua e pendurou na parede.' },
  { hobby: 'fotografia', frente: 'fotografia', habilidade: 50, texto: 'Uma foto sua rodou entre os amigos — e alguém pediu para usar.' },
  { hobby: 'fotografia', frente: 'fotografia', habilidade: 72, texto: 'Vendeu fotos pela primeira vez (um banco de imagens, um casamento de conhecido).', efeito: 'venda_foto' },
  { hobby: 'desenho', frente: 'desenho', habilidade: 25, texto: 'Encheu o primeiro caderno de desenho inteiro.' },
  { hobby: 'desenho', frente: 'desenho', habilidade: 50, texto: 'Fez um retrato que a pessoa retratada guardou.', efeito: 'presente_feito' },
  { hobby: 'desenho', frente: 'desenho', habilidade: 72, texto: 'Alguém pagou por um desenho seu.', efeito: 'venda_desenho' },
  { hobby: 'pintura', frente: 'desenho', habilidade: 30, texto: 'A primeira tela pintada até o fim.' },
  { hobby: 'pintura', frente: 'desenho', habilidade: 60, texto: 'Uma tela sua foi para a parede da sala de alguém da família.', efeito: 'presente_feito' },
  { hobby: 'cozinhar', frente: 'cozinha', habilidade: 25, texto: 'Acertou de primeira uma receita que antes desandava.' },
  { hobby: 'cozinhar', frente: 'cozinha', habilidade: 50, texto: 'O almoço de domingo passou a ser seu.', efeito: 'almoco' },
  { hobby: 'cozinhar', frente: 'cozinha', habilidade: 72, texto: 'Inventou um prato que virou pedido nas festas da família.' },
  { hobby: 'jardinagem', frente: 'campo', habilidade: 20, texto: 'A primeira planta que você salvou de morrer.' },
  { hobby: 'jardinagem', frente: 'campo', habilidade: 40, texto: 'A horta de temperos deu mais do que a casa usa.', efeito: 'horta' },
  { hobby: 'jardinagem', frente: 'campo', habilidade: 60, texto: 'Fez muda e deu de presente — o vizinho voltou para pedir mais.' }
];

export interface EstadoHobbies129 {
  /** O instrumento que se pratica agora (a rotina "tocar um instrumento"). */
  instrumento?: string;
  /** Meses de prática efetiva por instrumento (o que se aprendeu num não some quando se troca). */
  instrumentos?: Record<string, number>;
  /** Os marcos alcançados (uma vez cada): `hobby:degrau`. */
  marcos?: { id: string; t: number; texto: string }[];
}
