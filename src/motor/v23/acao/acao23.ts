/**
 * VIDA 23 — a ação de DEFINIR O CORPO (Você · Aparência · "Corpo e pele"): a constituição (os doze eixos), as marcas
 * naturais e os pelos do corpo. Como o rosto (`v14/aparencia/rosto14`): grátis, a família decide antes dos 13, e nada
 * entra na Linha da Vida — é como a pessoa É, não um acontecimento. A estatura do jogador não muda aqui: é a altura de
 * verdade do motor (`modalidades.estaturaAdulta`), que a figura já lê.
 */
import type { Vida } from '../../tipos';
import { idade } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { AUTONOMIA, autonomia } from '../../sistemas/autonomia';
import { corpo23Valido, gravarCorpo23, lerCorpo23, MAXIMO_DE_MARCAS, marcasValidas, type MarcaNatural } from '../corpo/corpo23';

/** O que muda (`null` tira: volta à base, sem marcas, quase sem pelos). */
export interface MudancaCorpo23 { corpo23?: string | null; marcas23?: MarcaNatural[] | null; pelos23?: number | null }

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
/** A mudança já saneada (o que fica guardado de fato). */
function normal(m: MudancaCorpo23): { corpo23?: string; marcas23?: MarcaNatural[]; pelos23?: number } {
  const out: { corpo23?: string; marcas23?: MarcaNatural[]; pelos23?: number } = {};
  if ('corpo23' in m && m.corpo23) out.corpo23 = gravarCorpo23(lerCorpo23(m.corpo23));
  if ('marcas23' in m && m.marcas23) out.marcas23 = marcasValidas(m.marcas23);
  if ('pelos23' in m && m.pelos23) out.pelos23 = Math.max(1, Math.min(3, Math.round(m.pelos23)));
  return out;
}

export function disponibilidadeCorpo23(v: Vida, m: MudancaCorpo23): Veredito {
  const campos = (['corpo23', 'marcas23', 'pelos23'] as const).filter(k => k in (m ?? {}));
  if (!campos.length) return bloqueio('impossivel', 'Nada a mudar.');
  const base = autonomia(v, 'aparencia_basica');
  if (base.grau !== 'permitido') return base;
  if (idade(v) < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', 'Com essa idade, o corpo ainda está se formando — e quem decide o resto é a família.');
  if (m.corpo23 && !corpo23Valido(m.corpo23)) return bloqueio('impossivel', 'Essas proporções não existem.');
  if (m.marcas23 && (!Array.isArray(m.marcas23) || m.marcas23.length > MAXIMO_DE_MARCAS)) return bloqueio('impossivel', `No máximo ${MAXIMO_DE_MARCAS} marcas.`);
  if (m.marcas23 && (marcasValidas(m.marcas23)?.length ?? 0) !== m.marcas23.length) return bloqueio('impossivel', 'Essa marca não existe nesse lugar.');
  const n = normal(m), vis = v.eu.visual;
  if (campos.every(k => igual(vis[k], n[k]))) return bloqueio('incompativel', 'Já está assim.');
  return PERMITIDO;
}

export function mudarCorpo23(v: Vida, m: MudancaCorpo23): string {
  const n = normal(m), vis = v.eu.visual;
  const partes: string[] = [];
  for (const k of ['corpo23', 'marcas23', 'pelos23'] as const) {
    if (!(k in m) || igual(vis[k], n[k])) continue;
    if (n[k] === undefined) delete vis[k]; else (vis as unknown as Record<string, unknown>)[k] = n[k];
    partes.push(k === 'corpo23' ? 'as proporções' : k === 'marcas23' ? 'as marcas da pele' : 'os pelos do corpo');
  }
  return partes.length ? `Pronto: ${partes.join(', ')} como você escolheu.` : 'Nada mudou.';
}
