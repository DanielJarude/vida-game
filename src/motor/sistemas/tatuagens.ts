/**
 * HOTFIX 11.5.1 — TATUAR E TIRAR. O estúdio cobra pelo tamanho e pela cor (a cidade muda o preço); cada parte do corpo
 * tem a área dela (`dados/tatuagens.LOCAIS`): várias pequenas no antebraço, uma grande nas costas — e o que não cabe,
 * não cabe (nada de desenho por cima de desenho). Tirar é laser: mais caro que fazer, e a tinta vai clareando por um
 * ano até sumir. A figura de corpo inteiro desenha cada uma no lugar, na pele, envelhecendo com ela.
 */
import type { Tatuagem, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import { desenhoDeTatuagem, LOCAIS, PRECO_POR_TAMANHO, type Lado, type LocalDeTatuagem } from '../dados/tatuagens';
import { pagar, vereditoDePagar } from './dinheiro';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export const IDADE_PARA_TATUAR = 18;
/** O laser leva um ano de sessões até a tinta sumir. */
export const MESES_DE_LASER = 12;

/** As tatuagens que existem na pele agora (as que estão saindo, enquanto o laser não termina). */
export const tatuagensDe = (v: Vida): Tatuagem[] => (v.eu.tatuagens ?? []).filter(x => x.removida === undefined || v.t - x.removida < MESES_DE_LASER);

/** Quanto da parte (de um lado) já está ocupado. O fechamento ocupa o braço e o antebraço inteiros. */
export function ocupado(v: Vida, local: LocalDeTatuagem, lado?: Lado): number {
  let n = 0;
  for (const x of tatuagensDe(v)) {
    if (x.removida !== undefined) continue;
    const d = desenhoDeTatuagem(x.desenho);
    if (!d || (LOCAIS[local].lados && x.lado !== lado)) continue;
    if (x.desenho === 'fechamento' && (local === 'braco' || local === 'antebraco')) { n += LOCAIS[local].capacidade; continue; }
    if (x.local === local) n += Math.min(3, d.tamanho);
  }
  return n;
}

export function precoDaTatuagem(v: Vida, desenho: string): number {
  const d = desenhoDeTatuagem(desenho);
  if (!d) return 0;
  return Math.round(PRECO_POR_TAMANHO[d.tamanho] * (d.colorida ? 1.3 : 1) * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
}
export const precoDaRemocao = (v: Vida, t: Tatuagem) => Math.round(precoDaTatuagem(v, t.desenho) * 1.6 / 10) * 10;

export function disponibilidadeTatuar(v: Vida, desenho: string, local: LocalDeTatuagem, lado?: Lado): Veredito {
  const d = desenhoDeTatuagem(desenho);
  const l = LOCAIS[local];
  if (!d || !l) return bloqueio('impossivel', 'Esse desenho não existe.');
  if (idade(v) < IDADE_PARA_TATUAR) return bloqueio('impossivel', `A partir dos ${IDADE_PARA_TATUAR} anos: estúdio sério não tatua menor de idade.`);
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  if (!d.locais.includes(local)) return bloqueio('impossivel', `${d.nome} não cabe ${local === 'mao' || local === 'costas' ? 'nas' : 'no'} ${l.nome}.`);
  if (l.lados && !lado) return bloqueio('impossivel', 'Escolha o lado.');
  if (d.tamanho !== 4 && d.tamanho > l.maximo) return bloqueio('impossivel', `Grande demais para ${local === 'mao' || local === 'costas' ? 'as' : 'o'} ${l.nome}.`);
  const precisa = d.tamanho === 4 ? l.capacidade : d.tamanho;
  if (d.tamanho === 4 && (ocupado(v, 'braco', lado) > 0 || ocupado(v, 'antebraco', lado) > 0)) return bloqueio('incompativel', 'O fechamento pede o braço e o antebraço livres desse lado.');
  if (ocupado(v, local, lado) + precisa > l.capacidade) return bloqueio('incompativel', `Não há mais espaço ${local === 'mao' || local === 'costas' ? 'nas' : 'no'} ${l.nome}${l.lados ? ` ${lado === 'e' ? 'esquerdo' : 'direito'}` : ''}: o desenho ficaria por cima de outro.`);
  if (v.corpo.saude < 40) return bloqueio('incompativel', 'Com a saúde assim, o tatuador pede para voltar depois.');
  return vereditoDePagar(v, precoDaTatuagem(v, desenho), 'Custa') ?? PERMITIDO;
}

const ladoEm = (l: LocalDeTatuagem, lado?: Lado) => (LOCAIS[l].lados ? ` ${l === 'mao' ? (lado === 'e' ? 'esquerda' : 'direita') : lado === 'e' ? 'esquerdo' : 'direito'}` : '');
const noLocal = (l: LocalDeTatuagem, lado?: Lado) => `${l === 'mao' || l === 'costas' ? 'na' : 'no'}${l === 'costas' ? 's' : ''} ${LOCAIS[l].nome}${ladoEm(l, lado)}`;

export function tatuar(v: Vida, desenho: string, local: LocalDeTatuagem, lado?: Lado): string {
  const d = desenhoDeTatuagem(desenho)!;
  pagar(v, precoDaTatuagem(v, desenho));
  limpar(v);
  const lista = (v.eu.tatuagens ??= []);
  const primeira = !lista.length;
  lista.push({ id: `tat-${v.t}-${lista.length}`, desenho, local, ...(LOCAIS[local].lados ? { lado } : {}), t: v.t });
  const texto = `${primeira ? 'A primeira tatuagem' : 'Mais uma tatuagem'}: ${d.nome.toLowerCase()}, ${noLocal(local, lado)}${d.tamanho >= 3 ? ' — algumas sessões e muitas horas de cadeira' : ''}.`;
  escrever(v, { texto, relevancia: primeira || d.tamanho >= 3 ? 'biografia' : 'cotidiano', tema: 'escolha', tom: 'bom', fato: { tipo: 'm_tatuagem', dados: { primeira: primeira ? 1 : 0, desenho } } });
  return texto;
}

export function disponibilidadeRemover(v: Vida, id: string): Veredito {
  const x = tatuagensDe(v).find(y => y.id === id);
  if (!x) return bloqueio('impossivel', 'Essa tatuagem não existe.');
  if (x.removida !== undefined) return bloqueio('incompativel', 'O laser já está tirando essa.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  return vereditoDePagar(v, precoDaRemocao(v, x), 'Custa') ?? PERMITIDO;
}

export function removerTatuagem(v: Vida, id: string): string {
  const x = tatuagensDe(v).find(y => y.id === id)!;
  pagar(v, precoDaRemocao(v, x));
  x.removida = v.t;
  const nome = desenhoDeTatuagem(x.desenho)?.nome.toLowerCase() ?? 'a tatuagem';
  const texto = `Começou a tirar ${nome} ${noLocal(x.local, x.lado)} no laser: sessões ao longo de um ano, e a tinta vai clareando.`;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'escolha' });
  return texto;
}

/** O que o laser já tirou de todo some da lista (a pele voltou). */
function limpar(v: Vida): void {
  if (v.eu.tatuagens) v.eu.tatuagens = v.eu.tatuagens.filter(x => x.removida === undefined || v.t - x.removida < MESES_DE_LASER);
}

/** Como a figura recebe as tatuagens: o desenho, onde, há quantos anos — e o quanto o laser já clareou (0..1). */
export function tatuagensNaFigura(v: Vida): { id: string; desenho: string; local: LocalDeTatuagem; lado?: Lado; anos: number; clareou: number }[] {
  return tatuagensDe(v).map(x => ({ id: x.id, desenho: x.desenho, local: x.local, lado: x.lado, anos: Math.max(0, (v.t - x.t) / 12), clareou: x.removida === undefined ? 0 : Math.min(1, (v.t - x.removida) / MESES_DE_LASER) }));
}

export const ondeEsta = noLocal;
