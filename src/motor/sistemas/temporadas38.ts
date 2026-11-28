/**
 * VIDA 38 · temporadas por rodada para outras modalidades e e-sports. O mesmo modelo do futebol (`jogosDaLiga`): um
 * calendário de turno e returno (`calendario`), um resultado por partida e uma tabela somada de todas elas. Cada
 * modalidade tem a sua regra de placar:
 *   - pontos corridos (vôlei, basquete): vitória vale 3, derrota com um ponto a menos vale 1 (vôlei: 3 a 2) — a tabela
 *     ordena por pontos, depois vitórias e saldo de pontos;
 *   - série (e-sports): cada partida é uma melhor de três; quem fecha mais séries vence a temporada.
 * O resultado de cada partida é sorteado pela força dos dois times e um sorteio derivado (`rngDe`): a mesma temporada
 * relida dá o mesmo resultado.
 */
import { rngDe } from '../rng';
import { calendario } from './jogosDaLiga';

export type Formato38 = 'pontos_corridos' | 'serie';
export interface LinhaTemporada38 { clube: string; j: number; v: number; d: number; pts: number; saldo: number }
export interface PartidaTemporada38 { rodada: number; casa: string; fora: string; placar: [number, number] }

/** A chance do time da casa (0..1), pela diferença de força. Simétrica: força igual dá 0,5. */
export function chanceDaCasa38(fCasa: number, fFora: number): number {
  const dif = fCasa - fFora;
  return 1 / (1 + Math.exp(-dif / 12));
}

/** O placar de uma partida. Pontos corridos: sets de 3 a 0, 3 a 1 ou 3 a 2; série: 2 a 0 ou 2 a 1. */
export function placarDaPartida38(formato: Formato38, pCasaGanha: number, sorteio: number): [number, number] {
  const ganhaCasa = sorteio < pCasaGanha;
  if (formato === 'serie') return ganhaCasa ? (sorteio < pCasaGanha * 0.6 ? [2, 0] : [2, 1]) : (sorteio < 0.5 + (1 - pCasaGanha) * 0.4 ? [1, 2] : [0, 2]);
  return ganhaCasa ? (sorteio < pCasaGanha * 0.6 ? [3, 0] : sorteio < pCasaGanha * 0.85 ? [3, 1] : [3, 2]) : (sorteio < 0.5 ? [2, 3] : [0, 3]);
}

/**
 * Joga a temporada inteira: turno e returno. `forca` dá a força de cada clube; `vid`, `pais` e `ano` fazem o sorteio
 * de cada partida (o mesmo resultado sempre que a temporada for relida).
 */
export function jogarTemporada38(
  vid: string, pais: string, ano: number, formato: Formato38, nomes: string[], forca: (c: string) => number
): { tabela: LinhaTemporada38[]; partidas: PartidaTemporada38[] } {
  const r = rngDe(vid, 'temporada38', pais, ano, nomes.join('|'));
  const rodadas = calendario(nomes, r);
  const linhas = new Map<string, LinhaTemporada38>(nomes.map(c => [c, { clube: c, j: 0, v: 0, d: 0, pts: 0, saldo: 0 }]));
  const partidas: PartidaTemporada38[] = [];
  rodadas.forEach((rod, i) => {
    for (const [casa, fora] of rod) {
      if (!casa || !fora) continue;
      const sorteio = rngDe(vid, 'partida38', pais, ano, casa, fora).next();
      const p = chanceDaCasa38(forca(casa), forca(fora));
      const [gc, gf] = placarDaPartida38(formato, p, sorteio);
      partidas.push({ rodada: i + 1, casa, fora, placar: [gc, gf] });
      const lc = linhas.get(casa)!, lf = linhas.get(fora)!;
      lc.j++; lf.j++;
      lc.saldo += gc - gf; lf.saldo += gf - gc;
      const casaVence = gc > gf;
      if (casaVence) { lc.v++; lf.d++; lc.pts += formato === 'serie' ? 2 : gf === 2 ? 2 : 3; lf.pts += formato === 'serie' ? 0 : gf === 2 ? 1 : 0; }
      else { lf.v++; lc.d++; lf.pts += formato === 'serie' ? 2 : gc === 2 ? 2 : 3; lc.pts += formato === 'serie' ? 0 : gc === 2 ? 1 : 0; }
    }
  });
  const tabela = [...linhas.values()].sort((a, b) => b.pts - a.pts || b.v - a.v || b.saldo - a.saldo || a.clube.localeCompare(b.clube));
  return { tabela, partidas };
}
