/**
 * VIDA 14 — APARÊNCIA: as regras dos detalhes do rosto (riscos na sobrancelha, o desenho dela, a pinta, os cílios) e o
 * normalizador dos saves. O mesmo espírito do corte e da maquiagem (`estilo.mudarAparencia`, `aparencia13`): escolha
 * grátis, com a autonomia por idade (a família decide antes dos 13), bloqueada na prisão; nada vai para os genes.
 * Quem já é conhecido e muda o rosto de um jeito que se nota (riscos, sobrancelha descolorida) pode virar assunto —
 * como a tinta e a cabeça raspada.
 */
import type { Vida, Visual } from '../../tipos';
import { rngDe } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { AUTONOMIA, autonomia } from '../../sistemas/autonomia';
import {
  CILIOS_14, DESENHOS_DE_SOBRANCELHA, ESTILOS_DE_RISCO, LADOS_DO_RISCO, PINTAS_14, POSICOES_DO_RISCO, QUANTIDADES_DE_RISCO, type RiscosNaSobrancelha
} from '../../dados14/aparencia/rosto14';

/** A mudança pedida. `null` ou `'nenhum'` tira (sem riscos, sem pinta, cílios naturais); `'natural'` volta a sobrancelha. */
export interface MudancaRosto14 {
  sobrancelhaRiscos?: RiscosNaSobrancelha | null;
  sobrancelhaDesenho?: string;
  pinta?: string;
  cilios?: string;
}
type Campo = keyof MudancaRosto14;
const CAMPOS: Campo[] = ['sobrancelhaRiscos', 'sobrancelhaDesenho', 'pinta', 'cilios'];

export function riscosValidos(r: unknown): r is RiscosNaSobrancelha {
  if (!r || typeof r !== 'object') return false;
  const x = r as Record<string, unknown>;
  return (QUANTIDADES_DE_RISCO as readonly number[]).includes(x.quantidade as number) && LADOS_DO_RISCO.some(l => l.id === x.lado)
    && POSICOES_DO_RISCO.some(p => p.id === x.posicao) && ESTILOS_DE_RISCO.some(e => e.id === x.estilo);
}
const valido = (k: Campo, x: unknown): boolean =>
  k === 'sobrancelhaRiscos' ? riscosValidos(x)
    : k === 'sobrancelhaDesenho' ? DESENHOS_DE_SOBRANCELHA.some(d => d.id === x && d.id !== 'natural')
      : k === 'pinta' ? PINTAS_14.some(p => p.id === x) : CILIOS_14.some(c => c.id === x);
const tira = (k: Campo, x: unknown) => x === null || x === undefined || x === 'nenhum' || (k === 'sobrancelhaDesenho' && x === 'natural');
const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function disponibilidadeRosto14(v: Vida, m: MudancaRosto14): Veredito {
  const campos = CAMPOS.filter(k => k in (m ?? {}));
  if (!campos.length) return bloqueio('impossivel', 'Nada a mudar.');
  const base = autonomia(v, 'aparencia_basica');
  if (base.grau !== 'permitido') return base;
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, o visual é o que a unidade permite.');
  const vis = v.eu.visual;
  let mudaAlgo = false;
  for (const k of campos) {
    const x = m[k];
    if (tira(k, x)) { if (vis[k] !== undefined) mudaAlgo = true; continue; }
    if (!valido(k, x)) return bloqueio('impossivel', 'Essa opção não existe.');
    if (!igual(vis[k], x)) mudaAlgo = true;
  }
  if (!mudaAlgo) return bloqueio('incompativel', 'Já está assim.');
  if (idade(v) < AUTONOMIA.aparencia.idade && campos.some(k => !tira(k, m[k]))) return bloqueio('impossivel', 'Riscar ou mexer na sobrancelha ainda passa pela família.');
  return PERMITIDO;
}

/** Aplica a mudança. Não entra na Linha da Vida — a não ser que o público repare (como a tinta e a cabeça raspada). */
export function mudarRosto14(v: Vida, m: MudancaRosto14): string {
  const vis = v.eu.visual;
  const antes = { ...vis };
  for (const k of CAMPOS) {
    if (!(k in m)) continue;
    const x = m[k];
    if (tira(k, x)) delete vis[k];
    else if (k === 'sobrancelhaRiscos') { const r = x as RiscosNaSobrancelha; vis.sobrancelhaRiscos = { quantidade: r.quantidade, lado: r.lado, posicao: r.posicao, estilo: r.estilo }; }
    else (vis as unknown as Record<string, unknown>)[k] = x;
  }
  limparGenes(v);
  v.eu.estilo ??= { itens: [] };
  v.eu.estilo.tMudanca = v.t;
  const novos = !!vis.sobrancelhaRiscos && !igual(antes.sobrancelhaRiscos, vis.sobrancelhaRiscos);
  const marcante = (novos && !antes.sobrancelhaRiscos) || (vis.sobrancelhaDesenho === 'descolorida' && antes.sobrancelhaDesenho !== 'descolorida');
  if ((v.notoriedade?.valor ?? 0) >= 30 && marcante && rngDe(v.id, 'rosto14', v.t, v.seq).chance(0.5)) {
    v.fatos['visual_repercutiu'] = v.t;
    escrever(v, { texto: 'A sobrancelha nova apareceu nas fotos e virou assunto: gente comentando, gente copiando.', relevancia: 'cotidiano', tema: 'trabalho' });
    return 'A sobrancelha nova apareceu nas fotos — e virou assunto.';
  }
  if (novos) return `${descreverRiscos(vis.sobrancelhaRiscos!)}. Com a navalha, em dois minutos.`;
  if ('sobrancelhaRiscos' in m && !vis.sobrancelhaRiscos && antes.sobrancelhaRiscos) return 'Os riscos foram deixados crescer: a sobrancelha fecha de novo.';
  return 'Rosto do jeito que você quis.';
}

/** "Dois riscos diagonais na sobrancelha esquerda, na ponta". */
export function descreverRiscos(r: RiscosNaSobrancelha): string {
  const n = ['', 'Um risco', 'Dois riscos', 'Três riscos'][r.quantidade] ?? 'Riscos';
  const estilo = ({ reto: r.quantidade > 1 ? 'retos' : 'reto', diagonal: r.quantidade > 1 ? 'diagonais' : 'diagonal', duplo_fino: 'duplos e finos', largo: r.quantidade > 1 ? 'largos' : 'largo', escalonado: 'em degrau' } as Record<string, string>)[r.estilo];
  const lado = r.lado === 'ambos' ? 'nas duas sobrancelhas' : `na sobrancelha ${r.lado}`;
  const pos = r.posicao === 'interno' ? 'perto do nariz' : r.posicao === 'central' ? 'no meio' : 'na ponta';
  return `${n} ${estilo} ${lado}, ${pos}`;
}

/** Os genes guardados nunca levam escolha de rosto (a herança lê `genes`). */
function limparGenes(v: Vida): void {
  const g = v.eu.genes as Partial<Visual> | undefined;
  if (g) for (const k of CAMPOS) delete g[k];
}

/**
 * Saves: campos opcionais (ausentes = sem). Valor que não existe (save editado, versão futura) sai em vez de quebrar o
 * retrato; os genes guardados perdem o que for escolha. Idempotente. Os piercings (furos) são normalizados à parte.
 */
export function normalizarVida14AparenciaRosto(v: Vida): void {
  const vis = v.eu?.visual;
  if (!vis) return;
  for (const k of CAMPOS) if (vis[k] !== undefined && (tira(k, vis[k]) || !valido(k, vis[k]))) delete vis[k];
  limparGenes(v);
}
