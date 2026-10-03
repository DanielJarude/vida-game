/**
 * Nomes por país e por geração. Uma avó nascida em 1955 não se chama
 * Valentina, e um bebê de 2030 raramente se chama Francisca — em Recife ou
 * em Osaka. As listas moram nos perfis dos países (`mundo/paises/*`); um
 * país pode ter vários grupos (as línguas e as regiões dele), e quem nasce
 * numa divisão onde um grupo é comum tende a nascer nele, sem que ninguém
 * vire carimbo: há mistura.
 */

import type { Genero } from '../tipos';
import type { Rng } from '../rng';
import type { Geracao, GrupoDeNomes } from '../mundo/tipos';
import { PAIS_PADRAO, perfilDoPais, temPerfil } from '../mundo/registro';

const perfilNomes = (pais: string) => perfilDoPais(temPerfil(pais) ? pais : PAIS_PADRAO).nomes;

function geracao(pais: string, anoNasc: number): Geracao {
  const [a, b] = perfilNomes(pais).cortes ?? [1972, 2004];
  if (anoNasc < a) return 'antiga';
  if (anoNasc < b) return 'meio';
  return 'nova';
}

/** O grupo de nomes de quem nasce numa divisão do país (a maioria no grupo do lugar; alguns em outro). */
export function grupoDeNomes(r: Rng, pais: string, divisao?: string): GrupoDeNomes {
  const grupos = perfilNomes(pais).grupos;
  if (grupos.length === 1) return grupos[0];
  // `peso` é a parcela NACIONAL do grupo. Dentro das divisões dele, a parcela local é muito maior: ×60 aproxima
  // "parcela nacional ÷ peso da região na população" (uma região típica tem 1–3% do país); fora delas, quase ninguém
  // nasce com os nomes de lá (×0,05). Os grupos nacionais (sem `divisoes`) valem o próprio peso em todo lugar.
  return r.weighted(grupos, g => g.peso * (divisao && g.divisoes ? (g.divisoes.includes(divisao) ? 60 : 0.05) : 1))!;
}

const grupoPorSobrenome = (pais: string, sobrenome?: string) =>
  sobrenome ? perfilNomes(pais).grupos.find(g => g.sobrenomes.some(s => sobrenome.split(' ').includes(s))) : undefined;

/**
 * Um prenome. `pais` e `divisao` dizem onde a pessoa nasce; `sobrenome`, se
 * já se sabe, puxa o grupo da família (o filho de uma família tâmil em
 * Mumbai tende a ter nome tâmil).
 */
export function sortearNome(r: Rng, genero: Genero, anoNasc: number, pais = PAIS_PADRAO, divisao?: string, sobrenome?: string): string {
  const perfil = perfilNomes(pais);
  if (genero === 'nao_binario' && perfil.neutros?.length) return r.pick(perfil.neutros);
  const grupo = grupoPorSobrenome(pais, sobrenome) ?? grupoDeNomes(r, pais, divisao);
  // Um pouco de mistura entre gerações vizinhas — nome não é regra.
  let g = geracao(pais, anoNasc);
  if (r.chance(0.08)) {
    if (g === 'antiga' || g === 'nova') g = 'meio';
    else g = anoNasc < (perfil.cortes?.[1] ?? 2004) - 9 ? 'antiga' : 'nova';
  }
  return r.pick(genero === 'feminino' ? grupo.fem[g] : grupo.masc[g]);
}

/** Um sobrenome de família do país (dois, onde se usam dois: "García López"). */
export function sortearSobrenome(r: Rng, pais = PAIS_PADRAO, divisao?: string): string {
  const grupo = grupoDeNomes(r, pais, divisao);
  if (grupo.sobrenome === 'dois') {
    const a = r.pick(grupo.sobrenomes);
    let b = r.pick(grupo.sobrenomes);
    for (let k = 0; k < 4 && b === a; k++) b = r.pick(grupo.sobrenomes);
    return `${a} ${b}`;
  }
  return r.pick(grupo.sobrenomes);
}

/**
 * O sobrenome de quem nasce, pelo costume do lugar onde nasce:
 *  - onde se usam dois (o mundo hispânico), o primeiro do pai e o primeiro da mãe;
 *  - nos demais (inclusive o costume luso, em que a família já usa o nome
 *    que passa), o da família: o do pai, ou o da mãe quando não há pai.
 */
export function sobrenomeDeQuemNasce(pais: string, doPai?: string, daMae?: string, semente?: string): string | undefined {
  const base = doPai || daMae;
  if (!base) return undefined;
  const grupo = grupoPorSobrenome(pais, base) ?? perfilNomes(pais).grupos[0];
  if (grupo.sobrenome === 'dois' && doPai && daMae) return `${doPai.split(' ')[0]} ${daMae.split(' ')[0]}`;
  // REWORK 4 — o costume luso (Brasil, Portugal): muitas famílias dão os dois, o último da mãe e depois o do pai
  // ("Souza Lima"); outras, só o da família. A escolha é de cada casal (estável pela semente: o mesmo bebê, o mesmo nome).
  if (perfilNomes(pais).grupos.some(g => g.sobrenome === 'luso') && doPai && daMae && semente !== undefined) {
    let h = 0;
    for (const ch of semente) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    if (h % 10 < 6) {
      const m = daMae.split(' ').pop()!, p = doPai.split(' ').pop()!;
      return m === p ? p : `${m} ${p}`;
    }
  }
  return base;
}

/** O país dá dois sobrenomes a quem nasce (o primeiro do pai e o primeiro da mãe)? */
export const usaDoisSobrenomes = (pais: string) => perfilNomes(pais).grupos.some(g => g.sobrenome === 'dois');

export const NOMES_PET_CACHORRO = ['Pipoca', 'Thor', 'Mel', 'Bidu', 'Luna', 'Paçoca', 'Bob', 'Pretinha', 'Nina', 'Scooby', 'Belinha', 'Fred'];
export const NOMES_PET_GATO = ['Frajola', 'Mingau', 'Salem', 'Mia', 'Tom', 'Nala', 'Garfield', 'Amora', 'Chico', 'Jade'];
