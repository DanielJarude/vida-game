/**
 * Como a interface LÊ o estado da pessoa: em palavras, com causa, e no rosto.
 *
 * Tudo aqui é derivado do motor (`sistemas/estado`): os fatores que o
 * equilíbrio anual usa são os mesmos que aparecem como "tem ajudado" e
 * "tem pesado". Nenhum número de humor, cabeça ou saúde chega à tela.
 */

import type { Vida } from '../motor/tipos';
import type { Acao } from '../motor/acoes';
import { disponibilidade } from '../motor/acoes';
import { idade } from '../motor/nucleo';
import { flex } from '../motor/texto';
import { leituraDoEstado, tendencia, type Dimensao, type Fator, type Tendencia } from '../motor/sistemas/estado';
import { sugestoes, type Sugestao } from '../motor/sistemas/cuidados';
import type { Expressao } from './avatar/Retrato';
import { palavraEstresse, palavraHumor, palavraSaude } from './apresentar';
import { CONSUMIDORES, estimuloFisico, fatoresPessoais, NOME_PESSOAL, palavraAparencia, palavraAprendizado, palavraCondicionamento, tendenciaPessoal, valorPessoal, type DimensaoPessoal } from '../motor/sistemas/pessoa';

/** O rosto do dia: do estado real, com prioridade para o que mais pesa. */
export function expressaoDe(v: Vida): Expressao {
  const { felicidade: h, estresse: e } = v.mente;
  if (v.corpo.saude < 40 || v.corpo.condicoes.some(c => c.gravidade >= 3 && !c.tratando)) return 'doente';
  if (e >= 70) return 'tenso';
  if (h < 36) return 'abatido';
  if (e >= 55) return 'cansado';
  if (h >= 70 && e < 45) return 'bem';
  return 'neutro';
}

/** Nível 1..5 (para a escala visual): 5 é o melhor em todas as dimensões. */
export function nivel(v: Vida, d: Dimensao): number {
  const x = d === 'humor' ? v.mente.felicidade : d === 'cabeca' ? 100 - v.mente.estresse : v.corpo.saude;
  return x >= 80 ? 5 : x >= 62 ? 4 : x >= 45 ? 3 : x >= 28 ? 2 : 1;
}

export function palavra(v: Vida, d: Dimensao): string {
  return d === 'humor' ? palavraHumor(v.mente.felicidade) : d === 'cabeca' ? palavraEstresse(v.mente.estresse) : palavraSaude(v.corpo.saude);
}

/** "Bem-estar" é o humor (`mente.felicidade`): a mesma fonte, o nome que a tela usa. */
export const NOME_DIMENSAO: Record<Dimensao, string> = { humor: 'Bem-estar', cabeca: 'Cabeça', saude: 'Saúde' };

export function palavraTendencia(t: Tendencia): string | undefined {
  return t === 'melhorando' ? 'vem melhorando' : t === 'piorando' ? 'vem piorando' : t === 'estavel' ? 'estável' : undefined;
}

export interface LeituraDimensao {
  d: Dimensao;
  nome: string;
  palavra: string;
  nivel: number;
  tendencia: Tendencia;
  ajudando: Fator[];
  pesando: Fator[];
  cuidados: Sugestao[];
}

export function lerDimensao(v: Vida, d: Dimensao): LeituraDimensao {
  const l = leituraDoEstado(v, d);
  return {
    d, nome: NOME_DIMENSAO[d], palavra: palavra(v, d), nivel: nivel(v, d), tendencia: tendencia(v, d),
    ajudando: l.ajudando, pesando: l.pesando,
    cuidados: sugestoes(v, d, (vv, a: Acao) => disponibilidade(vv, a))
  };
}


/**
 * O momento, numa frase: o que mais marca a pessoa agora, com a causa.
 * Descreve o estado; nunca diz o que ela decidiu sentir ou fazer.
 */
export function momentoAtual(v: Vida): string {
  const i = idade(v);
  const g = v.eu.tratamento ?? v.eu.genero;
  const o = flex(g, 'o', 'a', 'e');
  if (i < 3) return 'Os primeiros anos: comer, dormir, descobrir o mundo.';
  const cab = leituraDoEstado(v, 'cabeca', 2);
  const hum = leituraDoEstado(v, 'humor', 2);
  const sau = leituraDoEstado(v, 'saude', 2);
  const causa = (f?: Fator) => (f ? `: ${f.texto}` : '');
  if (v.mente.estresse >= 70) return `No limite${causa(cab.pesando[0])}.`;
  if (v.mente.estresse >= 55) return `Anda sobrecarregad${o}${causa(cab.pesando[0])}.`;
  if (v.mente.felicidade < 36) return `Um tempo difícil${causa(hum.pesando[0])}.`;
  if (v.corpo.saude < 45) return `O corpo tem pedido atenção${causa(sau.pesando[0])}.`;
  if (v.mente.felicidade < 48) return `Anda para baixo${causa(hum.pesando[0])}.`;
  if (tendencia(v, 'cabeca') === 'piorando' && cab.pesando[0]) return `A cabeça vem enchendo${causa(cab.pesando[0])}.`;
  if (tendencia(v, 'humor') === 'piorando' && hum.pesando[0]) return `O humor vem caindo${causa(hum.pesando[0])}.`;
  // Saúde ainda boa que desce não é "cobrança": é o começo de pedir cuidado.
  if (tendencia(v, 'saude') === 'piorando' && sau.pesando[0]) return v.corpo.saude >= 75 ? `A saúde segue boa, mas começa a pedir cuidado${causa(sau.pesando[0])}.` : `A saúde vem pesando${causa(sau.pesando[0])}.`;
  if (v.mente.felicidade >= 70 && v.mente.estresse < 40) return `Um bom momento${causa(hum.ajudando[0])}.`;
  if (tendencia(v, 'humor') === 'melhorando' && hum.ajudando[0]) return `As coisas vêm melhorando${causa(hum.ajudando[0])}.`;
  const bom = hum.ajudando[0];
  return bom ? `Anda ${palavraHumor(v.mente.felicidade)}, com ${bom.texto}.` : 'Levando a vida, um ano de cada vez.';
}

/** O estado pede atenção? (Para o painel "Agora" — um sinal, não uma tarefa.) */
export function sinalPessoal(v: Vida): string | undefined {
  if (idade(v) < 10) return undefined;
  if (v.mente.estresse >= 60) return 'A cabeça anda cheia.';
  if (v.mente.felicidade < 40) return 'Você anda para baixo.';
  if (v.corpo.condicoes.some(c => c.diagnosticada === false) && idade(v) >= 14) return 'O corpo tem dado sinais.';
  if (v.corpo.condicoes.some(c => c.cronica && !c.tratando) && idade(v) >= 18) return 'Uma condição de saúde sem tratamento.';
  if (v.corpo.saude < 45) return 'A saúde tem pedido atenção.';
  return undefined;
}

/* ------------------------------------------------ Corpo e aprendizado */

export interface LeituraPessoal {
  d: DimensaoPessoal;
  nome: string;
  palavra: string;
  tendencia: 'melhorando' | 'piorando' | 'estavel' | 'sem_dado';
  ajuda: string[];
  pesa: string[];
  /** Quem usa isso no motor, em palavras. */
  uso: string;
  /** Onde se mexe nisso. */
  ir?: { aba: 'tempo' | 'estudos'; rotulo: string };
}

/**
 * Condicionamento, aparência e aprendizado em palavras — com as MESMAS
 * causas que o motor usa no desenvolvimento do ano (`sistemas/pessoa`).
 */
export function lerPessoal(v: Vida, d: DimensaoPessoal): LeituraPessoal {
  const fatores = fatoresPessoais(v, d);
  const i = idade(v);
  const valor = valorPessoal(v, d);
  const palavra = d === 'condicionamento' ? palavraCondicionamento(valor) : d === 'aparencia' ? palavraAparencia(valor) : palavraAprendizado(valor);
  const ajuda = fatores.filter(f => f.efeito > 0).sort((a, b) => b.efeito - a.efeito).map(f => f.texto).slice(0, 2);
  const pesa = fatores.filter(f => f.efeito < 0).sort((a, b) => a.efeito - b.efeito).map(f => f.texto).slice(0, 2);
  if (d === 'condicionamento' && i >= 12 && estimuloFisico(v).total < 0.4) pesa.unshift('nenhum exercício na semana');
  if (d === 'aprendizado' && !fatores.some(f => f.id === 'estimulo') && i >= 10) pesa.push('nada que exercite a cabeça fora da obrigação');
  const ir = d === 'aprendizado' ? { aba: 'tempo' as const, rotulo: 'Ler, xadrez, estudar — em Tempo livre' } : d === 'condicionamento' ? { aba: 'tempo' as const, rotulo: 'Treino e movimento — em Tempo livre' } : undefined;
  return { d, nome: NOME_PESSOAL[d], palavra, tendencia: tendenciaPessoal(v, d), ajuda, pesa: pesa.slice(0, 2), uso: CONSUMIDORES[d], ir };
}
