/**
 * VIDA 38 · bloco 3 — o dia a dia que falta: passeios (praia, parque, pesca, caminhada), cartas e presentes para quem
 * está longe, torcida organizada (entrar, sair, ir ao jogo) e o bico de serviço para os vizinhos (a partir da
 * adolescência, sem vínculo fixo). Tudo com efeito no corpo, na cabeça, na relação ou no dinheiro — e cada um,
 * uma vez por ano (passeios e cartas: por ano e por pessoa).
 */
import type { Vida } from '../tipos';
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
  praia: { feliz: 2, estresse: -3, forma: 0, nome: 'a praia', texto: 'Um dia de mar: areia, sol até o fim da tarde e a cabeça vazia.' },
  parque: { feliz: 1, estresse: -2, forma: 1, nome: 'o parque', texto: 'Uma volta no parque, o lago, as crianças no balanço.' },
  pesca: { feliz: 2, estresse: -4, forma: 0, nome: 'a pescaria', texto: 'Horas sentado na beira do rio, a linha na água, o silêncio de quem não tem pressa.' },
  caminhada: { feliz: 1, estresse: -1, forma: 2, nome: 'a caminhada', texto: 'Uma trilha de manhã cedo: as pernas cansaram e a cabeça clareou.' },
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
      if (!v.vinculos[op.pessoaId] || !v.pessoas[op.pessoaId]) return bloqueio('impossivel', 'Essa pessoa não está na sua vida.');
      if (feitoNoAno(v, `carta:${op.pessoaId}`)) return bloqueio('incompativel', 'Você já escreveu para essa pessoa neste ano.');
      return op.o === 'presente' ? vereditoDePagar(v, arred(PRESENTE * custo(v)), 'Custa') : PERMITIDO;
    }
    case 'torcida':
      if (op.acao === 'entrar') {
        if (idade(v) < 14) return bloqueio('impossivel', 'A partir dos 14 anos.');
        return v.fatos['torcida:ativa'] ? bloqueio('incompativel', 'Você já está na torcida.') : PERMITIDO;
      }
      if (!v.fatos['torcida:ativa']) return bloqueio('incompativel', 'Você não está em nenhuma torcida.');
      if (op.acao === 'sair') return PERMITIDO;
      return vereditoDePagar(v, arred(150 * custo(v)), 'O ingresso custa');
    case 'bico':
      if (idade(v) < 14) return bloqueio('impossivel', 'A partir dos 14 anos.');
      return (v.fatos[`bico:ano:${ano(v)}`] ?? 0) >= 6 ? bloqueio('incompativel', 'Você já fez serviços demais neste ano.') : PERMITIDO;
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
        escrever(v, { texto: 'Você entrou na torcida organizada do seu time: a bandeira, o canto e os amigos que ficam para a vida.', relevancia: 'biografia', tema: 'lazer', escolha: true });
        return 'Você entrou na torcida organizada. Agora o domingo tem canto.';
      }
      if (op.acao === 'sair') {
        delete v.fatos['torcida:ativa'];
        escrever(v, { texto: 'Você saiu da torcida organizada. Os amigos ficaram, a camisa ficou no armário.', relevancia: 'biografia', tema: 'escolha', escolha: true });
        return 'Você saiu da torcida organizada.';
      }
      const valor = arred(150 * c);
      pagar(v, valor);
      const confusao = rngDe(v.id, 'torcida:jogo', v.t).next() < 0.2;
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      v.mente.estresse = clamp(v.mente.estresse + (confusao ? 5 : 2));
      return confusao
        ? 'O jogo foi uma vitória, e a saída do estádio teve confusão com a torcida rival. Você voltou com a cabeça pesada.'
        : 'Jogo no estádio, a arquibancada cantando do primeiro ao último minuto.';
    }
    case 'bico': {
      const ganho = arred(400 * c);
      v.financas.conta += ganho;
      v.fatos[`bico:ano:${ano(v)}`] = (v.fatos[`bico:ano:${ano(v)}`] ?? 0) + 1;
      v.mente.estresse = clamp(v.mente.estresse + 1);
      v.mente.felicidade = clamp(v.mente.felicidade + 1);
      return 'Um serviço para um vizinho. O pagamento veio no mesmo dia.';
    }
  }
}
