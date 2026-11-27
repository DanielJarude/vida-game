/**
 * VIDA 38 · bloco 3 — o dia a dia que falta: passeios (praia, parque, pesca, caminhada), cartas e presentes para quem
 * está longe, torcida organizada (entrar, sair, ir ao jogo) e o bico de serviço para os vizinhos (a partir da
 * adolescência, sem vínculo fixo). Tudo com efeito no corpo, na cabeça, na relação ou no dinheiro — e cada um,
 * uma vez por ano (passeios e cartas: por ano e por pessoa).
 */
import type { Vida } from '../tipos';
import { TEXTOS38 } from '../dados/textos38';
import { clamp, rngDe } from '../rng';
import { escrever, idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar, pagar } from './dinheiro';

export type LocalDePasseio = 'praia' | 'parque' | 'pesca' | 'caminhada';
export type OpCotidiano38 =
  | { o: 'passear'; local: LocalDePasseio }
  | { o: 'carta'; pessoaId: string }
  | { o: 'presente'; pessoaId: string }
  | { o: 'torcida'; acao: 'entrar' | 'sair' | 'jogo' }
  | { o: 'bico' };

const EFEITO_PASSEIO: Record<LocalDePasseio, { feliz: number; estresse: number; forma: number; nome: string; texto: string }> = {
  praia: { feliz: 2, estresse: -3, forma: 0, nome: 'a praia', texto: TEXTOS38.t1 },
  parque: { feliz: 1, estresse: -2, forma: 1, nome: 'o parque', texto: TEXTOS38.t2 },
  pesca: { feliz: 2, estresse: -4, forma: 0, nome: 'a pescaria', texto: TEXTOS38.t3 },
  caminhada: { feliz: 1, estresse: -1, forma: 2, nome: 'a caminhada', texto: TEXTOS38.t4 },
};
const arred = (x: number) => Math.round(x / 10) * 10;
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const ano = (v: Vida) => Math.floor(v.t / 12);
const feitoNoAno = (v: Vida, k: string) => { const t = v.fatos[k]; return t !== undefined && Math.floor(t / 12) === ano(v); };
const PRESENTE = 200;

export function disponibilidadeCotidiano38(v: Vida, op: OpCotidiano38): Veredito {
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  switch (op.o) {
    case 'passear': return feitoNoAno(v, `passeio:${op.local}`) ? bloqueio('incompativel', 'Você já fez isso neste ano.') : PERMITIDO;
    case 'carta': case 'presente': {
      if (!v.vinculos[op.pessoaId] || !v.pessoas[op.pessoaId]) return bloqueio('impossivel', TEXTOS38.t5);
      if (feitoNoAno(v, `carta:${op.pessoaId}`)) return bloqueio('incompativel', TEXTOS38.t6);
      return op.o === 'presente' ? vereditoDePagar(v, arred(PRESENTE * custo(v)), 'Custa') : PERMITIDO;
    }
    case 'torcida':
      if (op.acao === 'entrar') {
        if (idade(v) < 14) return bloqueio('impossivel', 'A partir dos 14 anos.');
        return v.fatos['torcida:ativa'] ? bloqueio('incompativel', 'Você já está na torcida.') : PERMITIDO;
      }
      if (!v.fatos['torcida:ativa']) return bloqueio('incompativel', TEXTOS38.t7);
      if (op.acao === 'sair') return PERMITIDO;
      return vereditoDePagar(v, arred(150 * custo(v)), 'O ingresso custa');
    case 'bico':
      if (idade(v) < 14) return bloqueio('impossivel', 'A partir dos 14 anos.');
      return (v.fatos[`bico:ano:${ano(v)}`] ?? 0) >= 6 ? bloqueio('incompativel', TEXTOS38.t8) : PERMITIDO;
  }
}

export function fazerCotidiano38(v: Vida, op: OpCotidiano38): string {
  const c = custo(v);
  switch (op.o) {
    case 'passear': {
      const e = EFEITO_PASSEIO[op.local];
      v.fatos[`passeio:${op.local}`] = v.t;
      v.mente.felicidade = clamp(v.mente.felicidade + e.feliz);
      v.mente.estresse = clamp(v.mente.estresse + e.estresse);
      if (e.forma) v.corpo.forma = clamp(v.corpo.forma + e.forma);
      return e.texto;
    }
    case 'carta': case 'presente': {
      const p = v.pessoas[op.pessoaId];
      const vin = v.vinculos[op.pessoaId];
      v.fatos[`carta:${op.pessoaId}`] = v.t;
      let texto: string;
      if (op.o === 'presente') {
        const valor = arred(PRESENTE * c);
        pagar(v, valor);
        vin.proximidade = clamp(vin.proximidade + 4);
        texto = `Você mandou um presente para ${p.nome}. Chegou embrulhado, com um bilhete à mão.`;
      } else {
        vin.proximidade = clamp(vin.proximidade + 2);
        texto = `Você escreveu para ${p.nome}. A resposta demorou, e veio longa.`;
      }
      vin.tUltimoContato = v.t;
      return texto;
    }
    case 'torcida': {
      if (op.acao === 'entrar') {
        v.fatos['torcida:ativa'] = v.t;
        v.mente.felicidade = clamp(v.mente.felicidade + 2);
        escrever(v, { texto: TEXTOS38.t9, relevancia: 'biografia', tema: 'lazer', escolha: true });
        return TEXTOS38.t10;
      }
      if (op.acao === 'sair') {
        delete v.fatos['torcida:ativa'];
        escrever(v, { texto: TEXTOS38.t11, relevancia: 'biografia', tema: 'escolha', escolha: true });
        return TEXTOS38.t12;
      }
      const valor = arred(150 * c);
      pagar(v, valor);
      const confusao = rngDe(v.id, 'torcida:jogo', v.t).next() < 0.2;
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      v.mente.estresse = clamp(v.mente.estresse + (confusao ? 5 : 2));
      return confusao
        ? TEXTOS38.t13
        : TEXTOS38.t14;
    }
    case 'bico': {
      const ganho = arred(400 * c);
      v.financas.conta += ganho;
      v.fatos[`bico:ano:${ano(v)}`] = (v.fatos[`bico:ano:${ano(v)}`] ?? 0) + 1;
      v.mente.estresse = clamp(v.mente.estresse + 1);
      v.mente.felicidade = clamp(v.mente.felicidade + 1);
      return TEXTOS38.t15;
    }
  }
}

import { registrarExtra38 } from './extras38';
registrarExtra38(['passear', 'carta', 'presente', 'torcida', 'bico'], disponibilidadeCotidiano38 as never, fazerCotidiano38 as never);
