/**
 * REWORK 9.6 · ATR-01 — os cinco atributos fundamentais, em palavras: o nome, o que é, o que o motor de fato faz com
 * ele (cada linha de `CONSEQUENCIAS` é um lugar do motor que lê o valor — nada prometido que não exista) e a palavra de
 * cada faixa. A fonte de cada valor é UMA só (`sistemas/predisposicao.valorDoAtributo`); aqui não há conta nenhuma.
 */

import type { Vida } from '../motor/tipos';
import { idade } from '../motor/nucleo';
import { valorDoAtributo, type Atributo } from '../motor/sistemas/predisposicao';
import { palavraHumor } from './apresentar';
import { palavraAparencia, palavraAprendizado, palavraCondicionamento } from '../motor/sistemas/pessoa';

export const NOME_ATRIBUTO: Record<Atributo, string> = { saude: 'Saúde', fisico: 'Físico', felicidade: 'Felicidade', beleza: 'Beleza', inteligencia: 'Inteligência' };

/** O que cada atributo é (uma frase — a tela Nascer e a ficha de Você). */
export const O_QUE_E: Record<Atributo, string> = {
  saude: 'A condição geral do corpo: o quanto ele aguenta, adoece e se recupera. Uma doença ou uma lesão são condições à parte — pesam na saúde enquanto duram.',
  fisico: 'Aptidão física geral: força, fôlego, resistência. Não é técnica: jogar bem futebol é treino de futebol.',
  felicidade: 'Satisfação com a vida. Não é ausência de estresse nem de doença, e dinheiro não a compra sozinho.',
  beleza: 'Aparência e apresentação no jogo — traços, cuidado, estilo, os anos. Não mede o valor de ninguém e não garante nada.',
  inteligencia: 'Facilidade para aprender e raciocinar. Não é conhecimento: nota, ofício e experiência vêm de estudo e prática.'
};

/** Ao nascer, cada número é ponto de partida e predisposição — um bebê não é um adulto em miniatura. */
export const AO_NASCER: Record<Atributo, string> = {
  saude: 'Como o bebê chega ao mundo, e a constituição que vai carregar.',
  fisico: 'A predisposição do corpo: o quanto responde ao movimento e ao treino.',
  felicidade: 'O temperamento: o ponto de equilíbrio do humor, antes do que a vida trouxer.',
  beleza: 'Os traços de nascença (que mudam com o crescimento, o cuidado e os anos).',
  inteligencia: 'A facilidade de aprender que vai acompanhar a escola — que continua precisando de estudo.'
};

/**
 * O que o motor faz com cada atributo — os consumidores reais (o mesmo espírito de `pessoa.CONSUMIDORES`, agora dos
 * cinco). Mudou a integração? Mude esta lista.
 */
export const CONSEQUENCIAS: Record<Atributo, string[]> = {
  saude: ['o risco de doenças e quanto tempo se vive', 'o teste de saúde de concursos e da farda', 'o rendimento no treino e no trabalho quando está baixa', 'a recuperação das lesões e das brigas'],
  fisico: ['o quanto o treino de um esporte rende (a técnica continua sendo da prática)', 'peneiras, testes físicos de concurso e da farda', 'trabalhos que pedem corpo (obra, campo, segurança)', 'a saúde, um pouco, ano a ano'],
  felicidade: ['a vontade de praticar e estudar', 'o rendimento no trabalho', 'o jeito com as pessoas e as brigas em casa', 'quando fica muito baixa por muito tempo, a saúde'],
  beleza: ['um pouco do primeiro interesse de alguém (a química depende de muito mais)', 'um pouco nas vagas de atendimento, vendas, beleza e palco', 'nada na competência, no respeito ou no amor de quem já conhece você'],
  inteligencia: ['a velocidade com que as matérias e os estudos rendem', 'provas de ingresso, faculdade, concursos', 'trabalhos de raciocínio (tecnologia, saúde, direito, engenharia, pesquisa)', 'nunca sozinha: sem estudo, a nota não vem']
};

/** O que move cada atributo — só o que o motor de fato faz. */
export const O_QUE_MOVE: Record<Atributo, string> = {
  saude: 'Hábitos (cigarro, bebida, movimento), a cabeça no limite, as doenças e o tratamento, as lesões e o cuidado escolhido, a idade, a constituição.',
  fisico: 'O treino da semana (esporte, academia, corrida, trabalho pesado), as lesões, o cigarro, a idade, a predisposição física.',
  felicidade: 'As relações, a família, o trabalho e os estudos, as conquistas, o luto, o lazer, o dinheiro apertado (ou folgado), o temperamento.',
  beleza: 'Os traços de nascença, o corpo em forma, a saúde, o cansaço, o cuidado (e o dinheiro para ele), o estilo, os anos.',
  inteligencia: 'Ler, estudar, a escola e a faculdade, xadrez e programação — devagar, com teto — e, muito tarde, a idade.'
};

export function palavraDoAtributo(v: Vida, a: Atributo): string {
  const x = valorDoAtributo(v, a);
  const i = idade(v);
  if (a === 'saude') return x < 30 ? 'muito frágil' : x < 50 ? 'frágil' : x < 70 ? 'razoável' : x < 85 ? 'boa' : 'excelente';
  if (a === 'felicidade') return palavraHumor(x);
  if (a === 'fisico') return i < 12 ? (x < 30 ? 'corpo frágil' : x < 44 ? 'corpo miúdo' : x < 60 ? 'como o da maioria' : x < 74 ? 'corpo ágil' : 'muito ágil e forte') : palavraCondicionamento(x);
  if (a === 'beleza') return i < 14 ? 'traços ainda mudando com o crescimento' : palavraAparencia(x);
  return palavraAprendizado(x);
}
