/**
 * REWORK 11.5 · ESP-04 — o TREINADOR DE GOLEIROS: uma especialização da comissão técnica, com progressão própria.
 *
 *   o degrau       a base (os goleiros da categoria) → o profissional → a seleção; sobe com o nome no meio
 *   o nome         cresce com o que os goleiros do clube fazem (a mesma tabela do país: o time que sofre pouco) e com
 *                  os goleiros revelados; cai com as temporadas ruins
 *   a comissão     o técnico muda (a demissão do técnico é frequente): o novo pode manter você — ou trazer o dele.
 *                  Quem tem nome e está há tempo no clube costuma ficar
 *   os revelados   o goleiro da base que você levou ao time de cima (fica na história)
 *
 * Sorteios derivados (`rngDe`): a sequência do ano não muda.
 */
import { clamp, rngDe } from '../rng';
import type { Vida } from '../tipos';
import { escrever } from '../nucleo';
import { anoDe } from '../tempo';
import { paisDaCidade } from '../dados/lugares';
import { oClube } from '../dados/clubes';
import { flex, ge } from '../texto';
import { clubeDaComissao } from './comissao';
import { divisaoDoClube, ultimaTemporadaDoPais } from './ligas';
import { encerrarEmprego } from './trabalho';
import { marcar } from './marcas';

export const OCUPACAO_TREINADOR_GOLEIROS = 'treinador_goleiros';
export const DEGRAU: Record<1 | 2 | 3, string> = { 1: 'nas categorias de base', 2: 'no time profissional', 3: 'na seleção' };

const anotar = (v: Vida, texto: string) => { const c = v.caminhos.treinadorDeGoleiros!; c.historico.push({ ano: anoDe(v.t), texto }); if (c.historico.length > 30) c.historico.splice(0, c.historico.length - 30); };

/** O ano do treinador de goleiros (quem tem esse emprego). */
export function processarTreinadorDeGoleiros(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e || e.ocupacaoId !== OCUPACAO_TREINADOR_GOLEIROS) return;
  const g = ge(v);
  let c = v.caminhos.treinadorDeGoleiros;
  if (!c || c.tInicio > e.tInicio) {
    const clube = clubeDaComissao(v, 'futebol').nome;
    const exGoleiro = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].some(x => x?.posicao === 'goleiro' && x.fase !== 'base');
    c = v.caminhos.treinadorDeGoleiros = { tInicio: e.tInicio, clube, degrau: 1, reputacao: exGoleiro ? 35 : 20, revelados: 0, tecnicos: 1, historico: [] };
    anotar(v, `Começou como ${flex(g, 'treinador', 'treinadora')} de goleiros ${DEGRAU[1]} ${oClube(clube) === clube ? `do ${clube}` : `d${oClube(clube)}`}.`);
    return;
  }
  const r = rngDe(v.id, 'treinador_goleiros', v.t);
  const pais = paisDaCidade(v.moradia.municipioId);
  // O que o time fez (a mesma tabela do país): defesa boa é time que terminou em cima.
  const u = ultimaTemporadaDoPais(v, pais);
  const nivel = divisaoDoClube(v, c.clube, pais);
  const caiu = !!u?.cairam.includes(c.clube), subiu = !!u?.subiram.includes(c.clube), campeao = Object.values(u?.campeoes ?? {}).includes(c.clube);
  c.reputacao = clamp(c.reputacao + (campeao ? 6 : subiu ? 4 : caiu ? -6 : 1) + (c.degrau === 1 ? 0 : nivel >= 4 ? 1 : 0));
  // A base revela goleiros (o que fica da passagem pela base).
  if (c.degrau === 1 && r.chance(0.18 + c.reputacao / 400)) {
    c.revelados++;
    c.reputacao = clamp(c.reputacao + 5);
    anotar(v, 'Um goleiro que você treinou na base subiu para o time de cima.');
    escrever(v, { texto: `Um goleiro que você treinou desde a base subiu para o time profissional ${oClube(c.clube) === c.clube ? `do ${c.clube}` : `d${oClube(c.clube)}`}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  // A comissão muda com o técnico: o novo pode manter você (o nome e o tempo de casa pesam) — ou trazer o dele.
  if (c.degrau >= 2 && r.chance(caiu ? 0.6 : 0.22)) {
    c.tecnicos++;
    const anos = (v.t - c.tInicio) / 12;
    const fica = r.chance(clamp(0.35 + c.reputacao / 150 + Math.min(0.2, anos * 0.04), 0.3, 0.92));
    if (!fica) {
      anotar(v, 'O técnico novo trouxe o próprio treinador de goleiros. Você saiu junto com a comissão antiga.');
      escrever(v, { texto: `O técnico ${oClube(c.clube) === c.clube ? `do ${c.clube}` : `d${oClube(c.clube)}`} caiu, e o novo trouxe a comissão dele: você saiu também.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      encerrarEmprego(v, 'a comissão técnica mudou');
      return;
    }
    anotar(v, `O técnico mudou; você ficou (o ${c.tecnicos}º técnico com quem trabalha no clube).`);
  }
  // O degrau seguinte: do time de baixo para o de cima; do clube para a seleção (raro, e pelo nome).
  if (c.degrau === 1 && c.reputacao >= 45 && r.chance(0.4)) {
    c.degrau = 2; e.salario = Math.round(e.salario * 1.35);
    anotar(v, 'Subiu para o time profissional.');
    escrever(v, { texto: `Passou a ser ${flex(g, 'o treinador', 'a treinadora')} de goleiros do time profissional.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  } else if (c.degrau === 2 && c.reputacao >= 75 && nivel >= 4 && r.chance(0.12)) {
    c.degrau = 3; e.salario = Math.round(e.salario * 1.4);
    anotar(v, 'Foi chamado para a comissão da seleção.');
    escrever(v, { texto: `Chamado para ser ${flex(g, 'o treinador', 'a treinadora')} de goleiros da seleção.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', 'Treinador de goleiros da seleção.', 3, { dominio: 'futebol', ocupacaoId: OCUPACAO_TREINADOR_GOLEIROS });
  }
}

/** Para a tela (a prancheta da comissão): onde está, o nome, os revelados, os técnicos, o histórico. */
export function leituraDoTreinadorDeGoleiros(v: Vida): { clube: string; degrau: string; reputacao: number; revelados: number; tecnicos: number; historico: { ano: number; texto: string }[]; desde: number } | undefined {
  const c = v.caminhos.treinadorDeGoleiros;
  if (!c) return undefined;
  return { clube: c.clube, degrau: DEGRAU[c.degrau], reputacao: c.reputacao, revelados: c.revelados, tecnicos: c.tecnicos, historico: [...c.historico].reverse(), desde: anoDe(c.tInicio) };
}
