/**
 * Um ano de vida.
 *
 * O ano é preenchido primeiro pela VIDA SISTÊMICA — o corpo, a escola, o
 * trabalho, a casa, as pessoas, os processos em curso — e só depois pelo
 * conteúdo: marcos garantidos, situações disparadas pelo estado (um pedido de
 * namoro, um bebê que nasceu) e, se sobrar espaço, algo sorteado do mundo.
 * Silêncio é permitido: nem todo ano precisa de uma história.
 */

import type { Rng } from './rng';
import { clamp } from './rng';
import type { Retorno, Vida } from './tipos';
import { escrever, idade, transacao } from './nucleo';
import { morreEsteAno, processarCorpo } from './sistemas/corpo';
import { processarFamiliaDeOrigem, processarConcepcao, processarGestacoes, processarMortes } from './sistemas/familia';
import { processarDescendentes, processarPartosDaFamilia } from './sistemas/filhos';
import { processarLuto } from './sistemas/luto';
import { alvoCabeca, alvoHumor, registrarEstado } from './sistemas/estado';
import { processarCurso, processarEscola, processarOab } from './sistemas/escola';
import { processarTrabalho } from './sistemas/trabalho';
import { processarRotinas } from './sistemas/rotinas';
import { processarConcursos } from './sistemas/concurso';
import { processarEsporte, treinoProfissional } from './sistemas/esporte';
import { processarArte } from './sistemas/arte';
import { processarNegocio } from './sistemas/negocio';
import { processarOportunidades } from './sistemas/oportunidades';
import { conhecerGente, envelhecerConhecidos, limparApertos, processarSocial, recalcularConvivio } from './sistemas/social';
import { processarRomance, surgirInteresse } from './sistemas/romance';
import { processarProcessos } from './sistemas/processos';
import { processarDinheiro } from './sistemas/dinheiro';
import { verificarDespejo } from './sistemas/moradia';
import { abrirDecisao, aplicarAcontecimento, candidatos, preparar, sortear } from './conteudo/motor';
import { CATALOGO } from './conteudo/catalogo';
import type { Conteudo } from './conteudo/base';

export interface ResumoDoAno {
  idade: number;
  entradas: string[];
}

export function avancarAno(vida: Vida): Retorno {
  if (vida.morte) return { vida, aviso: { texto: 'Esta vida terminou.', tom: 'neutro' } };
  if (vida.momento) return { vida, aviso: { texto: 'Há uma decisão esperando por você.', tom: 'neutro' } };
  const { vida: nova } = transacao(vida, (v, r) => {
    // Um processo seletivo só existe com a etapa aberta; sem ela, acabou.
    if (v.caminhos.processo) v.caminhos.processo = undefined;
    viverAno(v, r);
  });
  return { vida: nova };
}

function viverAno(v: Vida, r: Rng): void {
  const inicioBio = v.biografia.length;
  v.t += 12;

  processarCorpo(v, r);
  processarLuto(v);
  limparApertos(v);
  processarMortes(v, r);
  processarFamiliaDeOrigem(v, r);
  processarEscola(v, r);
  processarCurso(v, r);
  processarOab(v, r);
  processarTrabalho(v, r);
  processarNegocio(v);
  treinoProfissional(v, r);
  processarRotinas(v, r);
  processarConcursos(v, r);
  processarEsporte(v, r);
  processarArte(v, r);
  processarProcessos(v, r);
  recalcularConvivio(v);
  conhecerGente(v, r);
  envelhecerConhecidos(v, r);
  processarSocial(v, r);
  processarRomance(v, r);
  surgirInteresse(v, r);
  processarConcepcao(v, r);
  processarGestacoes(v, r);
  processarPartosDaFamilia(v, r);
  processarDescendentes(v, r);
  recalcularConvivio(v);
  processarOportunidades(v, r);
  processarDinheiro(v, r);
  verificarDespejo(v);
  equilibrarMente(v);
  registrarEstado(v);

  const causa = morreEsteAno(v, r);
  if (causa) {
    v.morte = { t: v.t, causa };
    escrever(v, { texto: `Morreu aos ${idade(v)} anos (${causa}).`, relevancia: 'marco', tema: 'morte' });
    v.anoAtual = { acoes: [] };
    return;
  }

  faseDeConteudo(v, r, v.biografia.length - inicioBio);
  v.anoAtual = { acoes: [] };
}

/**
 * Felicidade e estresse tendem a um ponto de equilíbrio que depende da vida
 * real: gente por perto, saúde, dinheiro, trabalho, a semana, perdas
 * recentes, atrito dentro de casa, o que se faz com o tempo livre.
 * Acontecimentos empurram (abalos); o equilíbrio puxa de volta, devagar.
 *
 * As causas e seus pesos moram em `sistemas/estado.ts` — a mesma conta que
 * a tela "Você" lê para dizer o que tem ajudado e o que tem pesado.
 */
function equilibrarMente(v: Vida): void {
  const m = v.mente;
  const humor = alvoHumor(v);
  const cabeca = alvoCabeca(v);
  m.felicidade = clamp(Math.round(m.felicidade * 0.65 + humor * 0.35));
  m.estresse = clamp(Math.round(m.estresse * 0.7 + cabeca * 0.3));
}

/* ---------------------------------------------------------------- Conteúdo */

const FAIXA_DECISAO: [number, number][] = [
  [2, 0], [5, 0.12], [11, 0.3], [17, 0.45], [29, 0.5], [59, 0.42], [200, 0.35]
];
const chanceDeDecisao = (i: number) => FAIXA_DECISAO.find(([max]) => i <= max)![1];

function decidiuRecentemente(v: Vida): boolean {
  return v.biografia.some(e => e.escolha && e.t === v.t - 12 && !e.texto.startsWith('Fez o ENEM'));
}

function faseDeConteudo(v: Vida, r: Rng, linhasSistemicas: number): void {
  const i = idade(v);
  let acontecimentos = 0;

  // 1. Marcos garantidos (desenvolvimento, passagens).
  const garantidos = candidatos(v, r, c => !!c.garantido);
  for (const { c, ctx } of garantidos) {
    if (c.tipo === 'decisao') {
      if (!v.momento) abrirDecisao(v, c, ctx);
    } else if (aplicarAcontecimento(v, c, ctx)) acontecimentos++;
  }

  // 2. Situações disparadas pelo estado.
  const prioritarios = candidatos(v, r, c => !!c.prioritario && !c.garantido)
    .sort((a, b) => (b.c.prioridade ?? 1) - (a.c.prioridade ?? 1));
  const decisaoPrioritaria = prioritarios.find(x => x.c.tipo === 'decisao');
  if (decisaoPrioritaria && !v.momento && decisaoPrioritaria.c.tipo === 'decisao') abrirDecisao(v, decisaoPrioritaria.c, decisaoPrioritaria.ctx);
  for (const x of prioritarios) {
    if (x.c.tipo === 'acontecimento' && acontecimentos < 2 && preparar(x.c, v, r)) {
      if (aplicarAcontecimento(v, x.c, x.ctx)) acontecimentos++;
    }
  }

  // 3. O mundo: acontecimento sorteado, se o ano ainda comporta.
  const cheio = linhasSistemicas + acontecimentos;
  const chanceAcontecimento = i <= 2 ? 0.45 : cheio >= 4 ? 0.12 : cheio >= 2 ? 0.35 : 0.6;
  if (acontecimentos < 2 && r.chance(chanceAcontecimento)) {
    const x = sortear(v, r, c => c.tipo === 'acontecimento' && !c.prioritario && !c.garantido);
    if (x && x.c.tipo === 'acontecimento') aplicarAcontecimento(v, x.c, x.ctx);
  }

  // 4. Uma decisão sorteada, no máximo — e só se o ano ainda não pediu nada.
  if (!v.momento) {
    let chance = chanceDeDecisao(i);
    if (decidiuRecentemente(v)) chance *= 0.55;
    if (r.chance(chance)) {
      const x = sortear(v, r, c => c.tipo === 'decisao' && !c.prioritario && !c.garantido);
      if (x && x.c.tipo === 'decisao') abrirDecisao(v, x.c, x.ctx);
    }
  }
}

export function totalDeConteudo(): { acontecimentos: number; decisoes: number } {
  const acontecimentos = CATALOGO.filter((c: Conteudo) => c.tipo === 'acontecimento').length;
  return { acontecimentos, decisoes: CATALOGO.length - acontecimentos };
}
