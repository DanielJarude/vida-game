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
import { processarProfissao } from './sistemas/profissao';
import { processarPolitica } from './sistemas/politica';
import { processarRotinas } from './sistemas/rotinas';
import { processarConcursos } from './sistemas/concurso';
import { processarEsporte, treinoProfissional } from './sistemas/esporte';
import { processarArte } from './sistemas/arte';
import { processarNegocio } from './sistemas/negocio';
import { processarOportunidades } from './sistemas/oportunidades';
import { conhecerGente, envelhecerConhecidos, limparApertos, processarSocial, recalcularConvivio } from './sistemas/social';
import { processarRomance, surgirInteresse } from './sistemas/romance';
import { processarExposicao } from './sistemas/exposicao';
import { processarProcessos } from './sistemas/processos';
import { fotografar, processarDinheiro } from './sistemas/dinheiro';
import { avancarEconomia } from './sistemas/economia';
import { processarVeiculos } from './sistemas/veiculos';
import { processarImoveis } from './sistemas/imoveis';
import { processarPets } from './sistemas/pets';
import { processarObrigacoes } from './sistemas/obrigacoes';
import { calcularHeranca } from './sistemas/partilha';
import { processarJustica } from './sistemas/justica';
import { processarIlicito } from './sistemas/ilicito';
import { processarPausa } from './sistemas/pausa';
import { processarRural } from './sistemas/rural';
import { processarTransformacao } from './sistemas/carreira';
import { efetivarMudancaMilitar } from './sistemas/militar';
import { abrirDecisao, aplicarAcontecimento, candidatos, conteudoPorId, preparar, sortear } from './conteudo/motor';
import { contexto } from './conteudo/base';
import { CATALOGO } from './conteudo/catalogo';
import type { Conteudo } from './conteudo/base';

export interface ResumoDoAno {
  idade: number;
  entradas: string[];
}

export function avancarAno(vida: Vida): Retorno {
  if (vida.morte) return { vida, aviso: { texto: 'Esta vida terminou.', tom: 'neutro' } };
  if (vida.momento) return { vida, aviso: { texto: 'Há uma decisão esperando por você.', tom: 'neutro' } };
  // Uma escolha de trajetória pendente (duas coisas que não cabem juntas) não fica esquecida: vira pergunta antes do ano andar.
  if (vida.caminhos.pendente && !vida.caminhos.pendente.perguntado) {
    const { vida: comPergunta } = transacao(vida, (v, r) => { const d = conteudoPorId('comp_conflito'); if (d && d.tipo === 'decisao') abrirDecisao(v, d, contexto(v, r)); });
    if (comPergunta.momento) return { vida: comPergunta, aviso: { texto: 'Há uma escolha esperando por você.', tom: 'neutro' } };
  }
  const { vida: nova } = transacao(vida, (v, r) => {
    // Um processo seletivo só existe com a etapa aberta; sem ela, acabou.
    if (v.caminhos.processo) v.caminhos.processo = undefined;
    // Uma escolha que foi perguntada e ficou sem resposta (a pergunta sumiu) é uma oferta que passou.
    if (v.caminhos.pendente?.perguntado) v.caminhos.pendente = undefined;
    viverAno(v, r);
  });
  return { vida: nova };
}

function viverAno(v: Vida, r: Rng): void {
  const inicioBio = v.biografia.length;
  v.t += 12;
  // A economia do país anda antes de tudo (e não depende de nada que a pessoa fez).
  const ec = avancarEconomia(v.economia, v.t);

  processarCorpo(v, r);
  processarLuto(v);
  limparApertos(v);
  processarPets(v, r);
  processarMortes(v, r);
  processarFamiliaDeOrigem(v, r);
  processarEscola(v, r);
  processarCurso(v, r);
  processarOab(v, r);
  processarJustica(v, r);
  processarTrabalho(v, r);
  processarProfissao(v, r);
  processarPolitica(v, r);
  processarTransformacao(v);
  processarRural(v, r);
  processarPausa(v);
  processarNegocio(v, r);
  treinoProfissional(v, r);
  processarRotinas(v, r);
  processarConcursos(v, r);
  efetivarMudancaMilitar(v);
  processarEsporte(v, r);
  processarArte(v, r);
  processarProcessos(v, r);
  recalcularConvivio(v);
  conhecerGente(v, r);
  envelhecerConhecidos(v, r);
  processarSocial(v, r);
  processarRomance(v, r);
  processarExposicao(v, r);
  surgirInteresse(v, r);
  processarConcepcao(v, r);
  processarGestacoes(v, r);
  processarPartosDaFamilia(v, r);
  processarDescendentes(v, r);
  recalcularConvivio(v);
  processarOportunidades(v, r);
  processarIlicito(v, r);
  processarVeiculos(v, r);
  processarImoveis(v, r, ec);
  processarDinheiro(v, r, ec);
  processarObrigacoes(v);
  equilibrarMente(v);
  registrarEstado(v);
  fotografar(v);

  const causa = morreEsteAno(v, r);
  if (causa) {
    v.morte = { t: v.t, causa, heranca: calcularHeranca(v) };
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

  // O mundo age primeiro (marcos, situações disparadas pelo estado, o sorteio); só DEPOIS a vida
  // pergunta — com o estado já mudado. Antes, um acontecimento do mesmo ano podia desfazer a
  // premissa de uma decisão já aberta (a decisão sobre a carreira, e a demissão logo depois).

  // 1. Marcos garantidos que são acontecimentos (desenvolvimento, passagens).
  for (const { c, ctx } of candidatos(v, r, c => !!c.garantido && c.tipo === 'acontecimento')) {
    if (c.tipo === 'acontecimento' && aplicarAcontecimento(v, c, ctx)) acontecimentos++;
  }

  // 2. Acontecimentos disparados pelo estado.
  const prioritarios = candidatos(v, r, c => !!c.prioritario && !c.garantido && c.tipo === 'acontecimento')
    .sort((a, b) => (b.c.prioridade ?? 1) - (a.c.prioridade ?? 1));
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

  // 4. As decisões, com o estado de agora: a garantida, a disparada pelo estado, ou uma sorteada.
  const garantida = candidatos(v, r, c => !!c.garantido && c.tipo === 'decisao')[0];
  if (garantida && !v.momento && garantida.c.tipo === 'decisao') abrirDecisao(v, garantida.c, garantida.ctx);
  if (!v.momento) {
    const decisaoPrioritaria = candidatos(v, r, c => !!c.prioritario && !c.garantido && c.tipo === 'decisao')
      .sort((a, b) => (b.c.prioridade ?? 1) - (a.c.prioridade ?? 1))[0];
    if (decisaoPrioritaria && decisaoPrioritaria.c.tipo === 'decisao') abrirDecisao(v, decisaoPrioritaria.c, decisaoPrioritaria.ctx);
  }
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
