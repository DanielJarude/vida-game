/**
 * Auditoria de REPETIÇÃO da Linha da Vida (REWORK 4) — as medidas, puras, reaproveitáveis (pela simulação de
 * `scripts/sim/repeticao.ts`, pelo teste `rework4.test.ts` e pela futura simulação de ~1.000 vidas).
 *
 * Mede, sobre um conjunto de vidas:
 *   1. FRASES IDÊNTICAS: quantas frases da biografia aparecem, letra por letra, em mais de uma vida;
 *   2. MOLDES: a frase com nomes, números e dinheiro mascarados — os moldes presentes em vidas demais;
 *   3. ACONTECIMENTOS: os ids de conteúdo que acontecem em quase toda vida (e os que se repetem dentro de uma);
 *   4. SEQUÊNCIAS POR IDADE: o par (idade, acontecimento) em comum entre vidas (o "roteiro" da infância);
 *   5. VIDAS PARECIDAS: semelhança (Jaccard) entre os moldes de cada par de vidas.
 * Não decide o que é aceitável: devolve números e listas; quem chama compara com o limite que quiser.
 */

export interface VidaAuditada { id: string; bio: { idade: number; texto: string }[]; ocorrencias: { idade: number; id: string }[] }

const PALAVRA_MAIUSCULA = /(^|[^A-Za-zÀ-ÿ<])([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõçü]+)/g;
/**
 * Nomes próprios, números e dinheiro viram marcadores. Uma palavra com maiúscula é nome — salvo no começo da frase,
 * quando o vocabulário (as palavras que aparecem em minúscula no resto do texto) diz que é palavra comum ("Comprou").
 */
export function molde(texto: string, comuns?: Set<string>): string {
  return texto
    .replace(/(R\$|US\$|€|£|¥|₹|\$)\s?[\d.,]+( mil| milhões?)?/g, '<$>')
    .replace(/\d+([.,]\d+)?/g, '<n>')
    .replace(PALAVRA_MAIUSCULA, (_, a: string, w: string) => `${a}${comuns?.has(w.toLowerCase()) ? w.toLowerCase() : '<N>'}`)
    .replace(/<N>(\s(de|da|do|dos|das)\s<N>)+/g, '<N>')
    .replace(/\s+/g, ' ').trim();
}

/** As palavras que aparecem em minúscula no corpo do texto (o vocabulário comum, para não confundir verbo com nome). */
export function vocabulario(textos: string[]): Set<string> {
  const out = new Set<string>();
  for (const t of textos) for (const m of t.matchAll(/(?:^|\s)([a-záéíóúâêôãõçü]+)/g)) out.add(m[1]);
  return out;
}

const jaccard = (a: Set<string>, b: Set<string>) => { if (!a.size && !b.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };

export interface Relatorio {
  vidas: number;
  frases: number;
  /** Parte das frases que se repete, idêntica, em outra vida (0..1). */
  frasesRepetidas: number;
  topFrases: { texto: string; vidas: number }[];
  /** Moldes presentes em ≥ metade das vidas. */
  moldesComuns: { molde: string; vidas: number }[];
  /** Acontecimentos em ≥ 80% das vidas. */
  eventosUbiquos: { id: string; vidas: number }[];
  /** Repetições do mesmo acontecimento dentro de uma vida (média por vida). */
  repeticoesInternas: number;
  /** Média do Jaccard dos pares (idade, acontecimento) até os 18 anos, entre pares de vidas. */
  roteiroDaInfancia: number;
  /** Semelhança média e máxima entre os moldes de pares de vidas. */
  semelhancaMedia: number;
  semelhancaMaxima: number;
  paresMuitoParecidos: number;
}

export function analisar(vidas: VidaAuditada[]): Relatorio {
  const n = vidas.length;
  const porFrase = new Map<string, Set<string>>();
  const porMolde = new Map<string, Set<string>>();
  const porEvento = new Map<string, Set<string>>();
  let frases = 0, repetidasInternas = 0;
  const moldesDaVida: Set<string>[] = [];
  const comuns = vocabulario(vidas.flatMap(v => v.bio.map(b => b.texto)));
  const roteiros: Set<string>[] = [];
  for (const v of vidas) {
    const ms = new Set<string>();
    for (const b of v.bio) {
      frases++;
      (porFrase.get(b.texto) ?? porFrase.set(b.texto, new Set()).get(b.texto)!).add(v.id);
      const m = molde(b.texto, comuns);
      ms.add(m);
      (porMolde.get(m) ?? porMolde.set(m, new Set()).get(m)!).add(v.id);
    }
    moldesDaVida.push(ms);
    const vistos = new Map<string, number>();
    for (const o of v.ocorrencias) {
      (porEvento.get(o.id) ?? porEvento.set(o.id, new Set()).get(o.id)!).add(v.id);
      vistos.set(o.id, (vistos.get(o.id) ?? 0) + 1);
    }
    repetidasInternas += [...vistos.values()].reduce((s, x) => s + Math.max(0, x - 1), 0);
    roteiros.push(new Set(v.ocorrencias.filter(o => o.idade <= 18).map(o => `${o.idade}:${o.id}`)));
  }
  let emOutra = 0;
  for (const v of vidas) for (const b of v.bio) if ((porFrase.get(b.texto)?.size ?? 0) > 1) emOutra++;
  let somaS = 0, maxS = 0, pares = 0, muito = 0, somaR = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const s = jaccard(moldesDaVida[i], moldesDaVida[j]);
    somaS += s; maxS = Math.max(maxS, s); pares++; if (s >= 0.5) muito++;
    somaR += jaccard(roteiros[i], roteiros[j]);
  }
  const top = <T>(m: Map<string, Set<string>>, min: number, f: (k: string, x: number) => T) => [...m.entries()].filter(([, s]) => s.size >= min).sort((a, b) => b[1].size - a[1].size).map(([k, s]) => f(k, s.size));
  return {
    vidas: n, frases,
    frasesRepetidas: frases ? emOutra / frases : 0,
    topFrases: top(porFrase, 2, (texto, x) => ({ texto, vidas: x })).slice(0, 25),
    moldesComuns: top(porMolde, Math.max(2, Math.ceil(n / 2)), (m, x) => ({ molde: m, vidas: x })).slice(0, 40),
    eventosUbiquos: top(porEvento, Math.max(2, Math.ceil(n * 0.8)), (id, x) => ({ id, vidas: x })),
    repeticoesInternas: n ? repetidasInternas / n : 0,
    roteiroDaInfancia: pares ? somaR / pares : 0,
    semelhancaMedia: pares ? somaS / pares : 0,
    semelhancaMaxima: maxS,
    paresMuitoParecidos: muito
  };
}

/** O relatório em Markdown (para a pasta da simulação). */
export function emMarkdown(r: Relatorio): string {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return [
    `# Repetição da Linha da Vida — ${r.vidas} vidas, ${r.frases} frases`,
    '',
    '| Medida | Valor |', '| --- | --- |',
    `| Frases que aparecem idênticas em outra vida | ${pct(r.frasesRepetidas)} |`,
    `| Moldes em ≥ metade das vidas | ${r.moldesComuns.length} |`,
    `| Acontecimentos em ≥ 80% das vidas | ${r.eventosUbiquos.length} |`,
    `| Repetições internas por vida (mesmo acontecimento) | ${r.repeticoesInternas.toFixed(1)} |`,
    `| Roteiro da infância em comum (Jaccard idade×acontecimento) | ${pct(r.roteiroDaInfancia)} |`,
    `| Semelhança média entre vidas (moldes) | ${pct(r.semelhancaMedia)} |`,
    `| Semelhança máxima entre duas vidas | ${pct(r.semelhancaMaxima)} |`,
    `| Pares de vidas muito parecidos (≥ 50%) | ${r.paresMuitoParecidos} |`,
    '', '## Frases idênticas mais frequentes', '', ...r.topFrases.map(x => `- (${x.vidas}) ${x.texto}`),
    '', '## Moldes em metade das vidas ou mais', '', ...r.moldesComuns.map(x => `- (${x.vidas}) ${x.molde}`),
    '', '## Acontecimentos quase universais', '', ...r.eventosUbiquos.map(x => `- (${x.vidas}) ${x.id}`)
  ].join('\n');
}
