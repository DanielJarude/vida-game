/**
 * O estresse, lido para a pessoa (FIX pós-REWORK 4). FONTE ÚNICA da tela "A
 * semana" e dos testes: o mesmo número que o ano usa (`mente.estresse`), as
 * mesmas causas que o movem (`estado.fatoresCabeca`), o mesmo teto da semana
 * (`semana.folegoDaSemana`) e o que a persistência cobra (`estresseProlongado`,
 * `sobrecarga`).
 *
 * O playtest não entendia duas barras ("carga" e "estresse"). A carga continua
 * existindo no motor (é ela que diz quanto da semana já está tomado), mas a
 * pessoa lê UMA coisa: o estresse — quanto, para onde vai, por quê, o que
 * ajuda, se ainda dá para assumir algo e o que acontece se continuar assim.
 * Nada aqui é mana: dá para assumir mais; o mundo cobra.
 */

import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { alvoCabeca, leituraDoEstado, type Fator } from './estado';
import { folegoDaSemana } from './semana';
import { LIMITE_DO_ESTRESSE } from './estresseProlongado';

export type NivelDeEstresse = 'baixo' | 'moderado' | 'alto' | 'no limite';

export interface Causa {
  id: string;
  texto: string;
  /** "leve", "moderado", "forte" — o tamanho do peso (ou do alívio), em palavras. */
  peso: string;
  pessoaId?: string;
}

export interface LeituraDoEstresse {
  valor: number;
  nivel: NivelDeEstresse;
  /** Para onde vai, se nada mudar: o alvo do ano (as causas de hoje). */
  tendencia: 'subindo' | 'estável' | 'baixando';
  /** A frase de cima: como está, em uma linha. */
  frase: string;
  pesando: Causa[];
  ajudando: Causa[];
  /** Ainda dá para assumir algo? (O teto humano da semana — não um bloqueio de tela.) */
  folego: string;
  /** O que acontece se continuar assim (as consequências reais, ditas antes). */
  riscos: string[];
  /** Anos seguidos no limite. */
  anos: number;
}

export const nivelDoEstresse = (e: number): NivelDeEstresse => (e >= 75 ? 'no limite' : e >= 55 ? 'alto' : e >= 35 ? 'moderado' : 'baixo');
const tamanho = (efeito: number) => { const x = Math.abs(efeito); return x >= 12 ? 'forte' : x >= 6 ? 'moderado' : 'leve'; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const causa = (f: Fator): Causa => ({ id: f.id, texto: cap(f.texto), peso: tamanho(f.efeito), pessoaId: f.pessoaId });

export function leituraDoEstresse(v: Vida): LeituraDoEstresse {
  const valor = Math.round(v.mente.estresse);
  const nivel = nivelDoEstresse(valor);
  const alvo = alvoCabeca(v);
  const tendencia = alvo > valor + 4 ? 'subindo' : alvo < valor - 4 ? 'baixando' : 'estável';
  const { pesando, ajudando } = leituraDoEstado(v, 'cabeca', 4);
  const anos = v.mente.estresseAlto?.anos ?? 0;
  // O TEMPO da semana, da fonte única (`semana.folegoDaSemana`): estresse baixo com a semana cheia, ou alto com a
  // semana folgada, são leituras diferentes — e a tela mostra as duas sem misturar.
  const folego = folegoDaSemana(v).texto;
  const frase = nivel === 'baixo' ? (tendencia === 'subindo' ? 'Por enquanto tranquilo — mas o que está pesando vai fazer subir.' : 'A cabeça está tranquila. Sobra espaço para descansar.')
    : nivel === 'moderado' ? (tendencia === 'subindo' ? 'Dá para levar — e está subindo.' : tendencia === 'baixando' ? 'Dá para levar, e está aliviando.' : 'Dá para levar. Vale olhar o que pesa.')
      : nivel === 'alto' ? (tendencia === 'baixando' ? 'Está alto, mas começou a ceder.' : 'Está alto: o sono, a paciência e o trabalho já sentem.')
        : anos >= 2 ? `No limite há ${anos} anos seguidos. O corpo começou a mandar a conta.` : 'No limite. Se continuar assim, a vida cobra.';
  const riscos: string[] = [];
  if (valor >= 55 || alvo >= LIMITE_DO_ESTRESSE) {
    riscos.push('em casa, a paciência fica curta: as brigas aumentam');
    if (v.trabalho.atual) riscos.push('o desempenho no trabalho cai');
    else if (v.educacao.matricula || v.educacao.basica) riscos.push('as notas caem');
  }
  if (valor >= LIMITE_DO_ESTRESSE || anos >= 1) {
    riscos.push('anos assim abrem a porta para ansiedade, depressão e pressão alta');
    if (idade(v) >= 22 && v.trabalho.atual) riscos.push('e para o esgotamento (o afastamento do trabalho)');
  }
  if (anos >= 2 && v.corpo.habitos.bebe === 'social') riscos.push('a bebida do fim do dia tende a virar a de todo dia');
  return { valor, nivel, tendencia, frase, pesando: pesando.map(causa), ajudando: ajudando.map(causa), folego, riscos, anos };
}
