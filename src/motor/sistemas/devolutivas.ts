/**
 * Devolutivas: o que ficou de cada tentativa — entrevista, peneira,
 * concurso. Fracassar não é só "não conseguiu": a pessoa sai sabendo (mais
 * ou menos) o que pesou, se ficou perto, e o que fazer com isso.
 */

import type { Devolutiva, Vida } from '../tipos';
import { tentativaDaDevolutiva } from './objetivos';

const LIMITE = 8;

export function registrarDevolutiva(v: Vida, d: Omit<Devolutiva, 't'>): Devolutiva {
  const nova: Devolutiva = { t: v.t, ...d };
  const lista = v.caminhos.devolutivas;
  lista.push(nova);
  if (lista.length > LIMITE) lista.splice(0, lista.length - LIMITE);
  // Toda tentativa alimenta o objetivo que ela persegue (a memória de intenção), com a MESMA causa.
  const controlavel = d.falta && d.falta !== 'concorrencia' && d.falta !== 'idade' && d.falta !== 'historico';
  tentativaDaDevolutiva(v, nova, controlavel ? O_QUE_TRABALHAR[d.falta!] : undefined);
  return nova;
}

/** A última devolutiva de um tipo (ou de qualquer tipo), se recente. */
export function ultimaDevolutiva(v: Vida, tipo?: Devolutiva['tipo'], meses = 36): Devolutiva | undefined {
  return [...v.caminhos.devolutivas].reverse().find(d => (!tipo || d.tipo === tipo) && v.t - d.t <= meses);
}

/** O que trabalhar, em palavras, para quem não passou. */
export const O_QUE_TRABALHAR: Record<NonNullable<Devolutiva['falta']>, string> = {
  experiencia: 'Estrada conta: um trabalho de entrada, estágio ou bico na área abre a próxima porta.',
  formacao: 'A formação pedida faz falta — um curso da área mudaria a conversa.',
  entrevista: 'A entrevista pesou. Na próxima, a abordagem pode ser outra.',
  concorrencia: 'Foi concorrido. Tentar de novo, em outra vaga, é o caminho.',
  tecnica: 'A técnica ainda não está no nível: treino regular, e a sério, ajuda.',
  fisico: 'O fôlego não acompanhou: condicionamento se constrói com treino e corrida.',
  leitura: 'Faltou experiência de jogo: competir mais, num time, faz diferença.',
  nervos: 'O nervosismo atrapalhou. Com mais testes, isso diminui.',
  idade: 'A idade pesa nas bases: a janela está fechando.',
  preparo: 'Faltou preparo: estudo firme, por mais tempo, é o que aproxima da nota de corte.',
  publico: 'Faltou público: apresentar-se (uma temporada curta, um show), testes e trabalhos pequenos, um edital de cultura — é o público que faz o convite chegar.',
  pesquisa: 'Faltou experiência de pesquisa: uma iniciação científica, ou um professor que acompanhe o seu trabalho e escreva a carta.',
  projeto: 'O projeto de pesquisa estava cru: preparar o projeto (e estudar para a prova da seleção) antes da próxima.',
  historico: 'O histórico da graduação pesou — isso não muda mais; o projeto e a pesquisa compensam parte.',
  area: 'Vindo de outra área, a banca quis mais base: um curso ou uma especialização na área ajuda.',
  materia: 'Uma matéria específica pesou: estudar dirigido a ela (foco no cursinho ou por conta) é o que move a nota.'
};
