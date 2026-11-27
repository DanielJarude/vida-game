/**
 * VIDA 38 · bloco 3 — ajudar a cidade com peso na vida. Doar dinheiro a uma causa (campanha de bairro, vaquinha de
 * quem precisa) ou ser voluntário (um sábado por mês na cozinha comunitária, o mutirão). Cada um, uma vez por ano.
 * A doação custa de verdade (conta), dá felicidade e alivia o estresse; o voluntariado não custa dinheiro, mas cansa.
 * Ambos ficam na biografia e somam no total da vida (`fatos['ajudar:total']`), para a Retrospectiva e o Legado.
 */
import type { Vida } from '../tipos';
import { clamp } from '../rng';
import { escrever, idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { dinheiro as fmt } from '../texto';

export type OpAjudar = { o: 'ajudar_dinheiro'; valor: 'pequena' | 'grande' } | { o: 'voluntariar' };

const VALOR_DA_DOACAO = { pequena: 300, grande: 3000 } as const;
const EFEITO_DA_DOACAO = { pequena: { feliz: 2, estresse: -1 }, grande: { feliz: 5, estresse: -3 } } as const;
const arred = (x: number) => Math.round(x / 10) * 10;
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const chave = (op: OpAjudar) => (op.o === 'ajudar_dinheiro' ? `ajudar:doar:${op.valor}` : 'ajudar:voluntario');

export function disponibilidadeAjudar(v: Vida, op: OpAjudar): Veredito {
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (idade(v) < 16) return bloqueio('impossivel', 'A partir dos 16 anos.');
  const ultimo = v.fatos[chave(op)];
  if (ultimo !== undefined && Math.floor(ultimo / 12) === Math.floor(v.t / 12)) return bloqueio('incompativel', 'Você já fez isso neste ano.');
  if (op.o === 'ajudar_dinheiro') return vereditoDePagar(v, arred(VALOR_DA_DOACAO[op.valor] * custo(v)), 'Doa');
  return PERMITIDO;
}

export function fazerAjudar(v: Vida, op: OpAjudar): string {
  v.fatos[chave(op)] = v.t;
  const total = (v.fatos['ajudar:total'] ?? 0);
  if (op.o === 'ajudar_dinheiro') {
    const valor = arred(VALOR_DA_DOACAO[op.valor] * custo(v));
    pagar(v, valor);
    const e = EFEITO_DA_DOACAO[op.valor];
    v.mente.felicidade = clamp(v.mente.felicidade + e.feliz);
    v.mente.estresse = clamp(v.mente.estresse + e.estresse);
    v.fatos['ajudar:total'] = total + valor;
    const texto = op.valor === 'grande'
      ? `Você doou ${fmt(valor)} para uma campanha da cidade. Ninguém te pediu: foi sua escolha.`
      : `Você doou ${fmt(valor)} para a vaquinha de um vizinho. Ele agradeceu na porta de casa.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'escolha', escolha: true });
    return texto;
  }
  v.mente.felicidade = clamp(v.mente.felicidade + 3);
  v.mente.estresse = clamp(v.mente.estresse + 2);
  v.fatos['ajudar:total'] = total;
  const texto = 'Um sábado no mutirão do bairro: massa, tijolo e gente de todo tipo. Voltou cansado e satisfeito.';
  escrever(v, { texto, relevancia: 'biografia', tema: 'escolha', escolha: true });
  return texto;
}
