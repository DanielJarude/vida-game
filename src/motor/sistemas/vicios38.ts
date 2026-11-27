/**
 * VIDA 38 · bloco 3 — dependências além do jogo (álcool e cigarro). Cada uso custa dinheiro e dá um alívio de hora,
 * mas sobe o nível de dependência (guardado em `fatos`), e nível alto pesa na saúde a cada uso. Só diminui quando a
 * pessoa para — e parar com nível alto dá abstinência (estresse). Não há recaída automática: é escolha a cada vez.
 */
import type { Vida } from '../tipos';
import { TEXTOS38 } from '../dados/textos38';
import { clamp } from '../rng';
import { escrever } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar, pagar } from './dinheiro';

export type Substancia38 = 'alcool' | 'cigarro';
export type OpVicio38 = { o: 'vicio'; substancia: Substancia38; acao: 'usar' | 'parar' };

const CUSTO: Record<Substancia38, number> = { alcool: 40, cigarro: 30 };
const NOME: Record<Substancia38, string> = { alcool: 'bebida', cigarro: 'cigarro' };
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const nivelDe = (v: Vida, s: Substancia38) => v.fatos[`vicio:${s}`] ?? 0;
const LIMITE_ALTO = 50;

export function disponibilidadeVicio38(v: Vida, op: OpVicio38): Veredito {
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (op.acao === 'parar') return nivelDe(v, op.substancia) > 0 ? PERMITIDO : bloqueio('incompativel', TEXTOS38.t16);
  return vereditoDePagar(v, Math.round(CUSTO[op.substancia] * custo(v) / 10) * 10, 'Custa');
}

export function fazerVicio38(v: Vida, op: OpVicio38): string {
  const s = op.substancia, chave = `vicio:${s}`;
  if (op.acao === 'parar') {
    const antes = nivelDe(v, s);
    const alto = antes >= LIMITE_ALTO;
    v.fatos[chave] = clamp(antes - 20, 0, 100);
    if (alto) v.mente.estresse = clamp(v.mente.estresse + 5);
    const texto = alto
      ? `Você parou de ${s === 'alcool' ? 'beber' : 'fumar'}. Os primeiros dias foram duros, e a vontade veio em ondas.`
      : `Você diminuiu ${s === 'alcool' ? 'a bebida' : 'o cigarro'} e sentiu a diferença no dia a dia.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'saude', escolha: true });
    return texto;
  }
  pagar(v, Math.round(CUSTO[s] * custo(v) / 10) * 10);
  const antes = nivelDe(v, s);
  const depois = clamp(antes + 8, 0, 100);
  v.fatos[chave] = depois;
  v.mente.felicidade = clamp(v.mente.felicidade + 2);
  v.mente.estresse = clamp(v.mente.estresse - 1);
  if (depois >= LIMITE_ALTO) v.corpo.saude = clamp(v.corpo.saude - 2);
  if (antes < LIMITE_ALTO && depois >= LIMITE_ALTO) {
    escrever(v, { texto: `Você percebeu que ${NOME[s] === 'bebida' ? 'bebia' : 'fumava'} sem vontade de parar, quase todo dia.`, relevancia: 'biografia', tema: 'saude', escolha: true });
  }
  return `Um ${NOME[s]} depois do outro: o alívio dura pouco, e o hábito fica.`;
}

import { registrarExtra38 } from './extras38';
registrarExtra38(['vicio'], disponibilidadeVicio38 as never, fazerVicio38 as never);
