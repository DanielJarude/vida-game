/**
 * REWORK 10.5 · FAM-01 — A FAMA NÃO É UMA BARRA SÓ.
 *
 * A notoriedade (`notoriedade`) continua sendo a fonte do RECONHECIMENTO PÚBLICO (quanto o público conhece você). Ao
 * lado dela, sem barras redundantes guardadas, o que o jogo já sabe e não dizia:
 *
 *   PRESTÍGIO PROFISSIONAL  o respeito no próprio meio — prêmios, currículo, títulos, publicações, anos de ofício, o
 *                           degrau da carreira. Uma atriz premiada pode ser pouco conhecida; um influenciador, o inverso.
 *   INFLUÊNCIA DIGITAL      o público real nas redes (sem o comprado), com a credibilidade da conta.
 *   ALCANCE                 até onde o nome chega: a cidade, a região, o país, fora dele (só com uma obra ou um feito
 *                           que atravessou a fronteira).
 *   IMAGEM                  como o público vê (`imagemPublica`: querida, polêmica, desgastada...).
 *
 * Tudo derivado do estado (nada novo no save): a tela "No mundo" lê daqui; o prestígio da atuação pesa nos papéis
 * (`cena.prestigioArtistico`).
 */

import type { Vida } from '../tipos';
import { clamp } from '../rng';
import { faixaDaNotoriedade, imagemPublica, palavraDaNotoriedade } from './notoriedade';
import { contasAtivas, publicoReal, seguidoresEmPalavras } from './redesBase';
import { prestigioArtistico } from './cena';
import { ocupacaoOuNula } from '../dados/ocupacoes';

export interface LeituraDaFama {
  reconhecimento: { valor: number; palavra: string };
  prestigio: { valor: number; palavra: string; por?: string };
  digital?: { seguidores: number; palavra: string; credibilidade: string };
  alcance: 'ninguém' | 'a cidade' | 'a região' | 'o país' | 'fora do país';
  imagem?: string;
}

/** O prestígio no próprio meio (0..100): a área em que ele é maior. */
export function prestigioProfissional(v: Vida): { valor: number; por?: string } {
  const cands: { valor: number; por: string }[] = [];
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  if (oc?.trilha === 'cena' || (v.caminhos.curriculo ?? []).length) cands.push({ valor: prestigioArtistico(v) * 100, por: 'na atuação' });
  const pal = v.caminhos.palmares ?? [];
  if (pal.length || v.caminhos.esporte?.fase === 'profissional') cands.push({ valor: clamp(pal.filter(x => x.tipo === 'titulo' || x.tipo === 'premio').length * 9 + (v.caminhos.esporte?.reputacao ?? 0) * 0.5), por: 'no esporte' });
  const a = v.caminhos.academia;
  if (a) cands.push({ valor: clamp(a.publicacoes * 4 + (a.orientacoes ?? 0) * 3 + (a.financiamentos ?? 0) * 5), por: 'na academia' });
  const obras = v.caminhos.obras ?? [];
  if (obras.length) cands.push({ valor: clamp(obras.filter(o => o.recepcao >= 2).length * 12 + obras.filter(o => o.premio?.venceu).length * 18), por: 'pela obra' });
  if (e && oc) {
    const anos = (v.t - e.tInicio) / 12;
    cands.push({ valor: clamp(oc.nivel * 11 + Math.min(25, anos * 1.2) + (e.desempenho - 50) * 0.2), por: 'no trabalho' });
  }
  const top = cands.sort((x, y) => y.valor - x.valor)[0];
  return top ? { valor: Math.round(top.valor), por: top.por } : { valor: 0 };
}

const PALAVRA_PRESTIGIO = (x: number) => (x >= 75 ? 'referência no meio' : x >= 50 ? 'muito respeitado no meio' : x >= 30 ? 'respeitado no meio' : x >= 12 ? 'começando a ser notado no meio' : 'sem nome no meio ainda');

/** Até onde o nome chega: a faixa da notoriedade — e "fora do país" só com um feito que atravessou a fronteira. */
function alcanceDoNome(v: Vida, noto: number): LeituraDaFama['alcance'] {
  const f = faixaDaNotoriedade(noto);
  if (f === 0) return 'ninguém';
  if (f === 1) return 'a cidade';
  if (f === 2) return 'a região';
  const internacional = (v.caminhos.curriculo ?? []).some(x => x.premio?.alcance === 'internacional' || (x.tipo === 'filme' && (x.porte ?? 0) >= 3 && x.repercussao >= 3))
    || (v.caminhos.palmares ?? []).some(x => x.tipo === 'selecao') || (v.caminhos.esporte?.selecao?.jogos ?? 0) > 0;
  return f >= 4 && internacional ? 'fora do país' : 'o país';
}

export function leituraDaFama(v: Vida): LeituraDaFama {
  const noto = v.notoriedade?.valor ?? 0;
  const pres = prestigioProfissional(v);
  const contas = contasAtivas(v).filter(c => c.plataforma !== 'onlyfans');
  const seguidores = contas.reduce((s, c) => s + publicoReal(c), 0);
  const cred = contas.length ? Math.round(contas.reduce((s, c) => s + c.credibilidade, 0) / contas.length) : 0;
  const im = imagemPublica(v);
  return {
    reconhecimento: { valor: Math.round(noto), palavra: palavraDaNotoriedade(v) },
    prestigio: { valor: pres.valor, palavra: PALAVRA_PRESTIGIO(pres.valor), ...(pres.por ? { por: pres.por } : {}) },
    ...(seguidores >= 1000 ? { digital: { seguidores, palavra: `${seguidoresEmPalavras(seguidores)} seguidores`, credibilidade: cred >= 70 ? 'conta confiável' : cred >= 45 ? 'conta comum' : 'conta desacreditada' } } : {}),
    alcance: alcanceDoNome(v, noto),
    ...(im ? { imagem: `${im.palavra} — ${im.texto.charAt(0).toLowerCase()}${im.texto.slice(1)}` } : {})
  };
}
