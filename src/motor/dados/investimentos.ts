/**
 * Onde guardar dinheiro. Sem marcas e sem produtos reais específicos: sete
 * jeitos de guardar que se comportam de forma diferente — no risco, no
 * horizonte, na facilidade de tirar e em pagar (ou não) alguma renda.
 *
 * Os rendimentos são REAIS (acima da inflação) e dependem da economia do ano
 * (`sistemas/economia`). Nada rende uma taxa fixa para sempre.
 */

import type { Produto } from '../tipos';

export interface ProdutoInvestimento {
  id: Produto;
  nome: string;
  /** Uma frase sobre o que é, sem jargão. */
  oque: string;
  /** 1 quase nada · 2 pouco · 3 médio · 4 alto · 5 muito alto. */
  risco: 1 | 2 | 3 | 4 | 5;
  /** Em palavras: o que pode acontecer num ano ruim. */
  riscoTexto: string;
  /** Tirar o dinheiro: quão rápido e se pode sair perdendo. */
  liquidez: string;
  /** Horizonte que faz sentido. */
  horizonte: string;
  /** Paga dinheiro na conta ao longo do tempo? (Sem isto, só valoriza ou desvaloriza.) */
  renda?: string;
  /** Aporte mínimo. */
  minimo: number;
  /** Ordem para tirar numa emergência (o mais fácil primeiro). */
  ordemResgate: number;
}

export const PRODUTOS: readonly ProdutoInvestimento[] = [
  { id: 'reserva', nome: 'Reserva na conta remunerada', oque: 'O dinheiro fica disponível e rende um pouco, parecido com a poupança.', risco: 1, riscoTexto: 'Não cai. Em ano de inflação alta, pode render menos que ela.', liquidez: 'Sai na hora.', horizonte: 'Emergências e o que você vai usar logo.', minimo: 1, ordemResgate: 1 },
  { id: 'pos_fixado', nome: 'Renda fixa que acompanha o juro', oque: 'Empresta para o governo ou um banco e recebe o juro do momento.', risco: 1, riscoTexto: 'Quase não oscila. Rende mais quando o juro está alto.', liquidez: 'Sai em um ou dois dias.', horizonte: 'De meses a poucos anos.', minimo: 100, ordemResgate: 2 },
  { id: 'inflacao', nome: 'Título protegido da inflação', oque: 'Trava um ganho acima da inflação por muitos anos.', risco: 2, riscoTexto: 'Se o juro sobe, o preço do título cai por um tempo. Levado até o fim, entrega o combinado.', liquidez: 'Vende a qualquer hora, pelo preço do dia — antes do fim, pode valer menos.', horizonte: 'Dez anos ou mais: aposentadoria, estudo dos filhos.', minimo: 100, ordemResgate: 4 },
  { id: 'multimercado', nome: 'Fundo misto', oque: 'Um gestor mistura renda fixa e um pouco de bolsa. Cobra por isso.', risco: 3, riscoTexto: 'Oscila pouco; num ano ruim, pode perder um pouco.', liquidez: 'O dinheiro cai na conta em cerca de um mês.', horizonte: 'Alguns anos.', minimo: 500, ordemResgate: 3 },
  { id: 'imobiliario', nome: 'Fundos de imóveis', oque: 'Pedaços de prédios, galpões e shoppings, que pagam aluguel todo mês.', risco: 3, riscoTexto: 'O preço sobe e desce com o mercado de imóveis; o aluguel também varia.', liquidez: 'Vende quando quiser, pelo preço do dia.', horizonte: 'Muitos anos, para quem quer uma renda.', renda: 'Paga uma parte do aluguel dos imóveis todo mês.', minimo: 100, ordemResgate: 5 },
  { id: 'acoes', nome: 'Ações de muitas empresas', oque: 'Uma carteira ampla de ações (um fundo que segue a bolsa).', risco: 4, riscoTexto: 'Num ano ruim pode cair um terço. Em anos bons, sobe bem.', liquidez: 'Vende quando quiser, pelo preço do dia — que pode estar baixo.', horizonte: 'Dez anos ou mais, sem precisar do dinheiro no meio.', renda: 'Algumas empresas dividem o lucro (dividendos): pouco e sem data certa.', minimo: 100, ordemResgate: 6 },
  { id: 'acao_unica', nome: 'Ações de uma empresa só', oque: 'Apostar numa empresa que você acredita.', risco: 5, riscoTexto: 'Pode dobrar, pode perder mais da metade — e às vezes a empresa quebra.', liquidez: 'Vende quando quiser, pelo preço do dia.', horizonte: 'Só com dinheiro que pode perder.', renda: 'Às vezes paga dividendos.', minimo: 100, ordemResgate: 7 }
];

export const produto = (id: Produto) => PRODUTOS.find(p => p.id === id)!;

export const PALAVRA_RISCO = ['', 'quase nenhum risco', 'pouco risco', 'risco médio', 'risco alto', 'risco muito alto'] as const;
