/**
 * Autoescola: a primeira avaliação interativa do VIDA.
 *
 *   matrícula → aulas (e a preparação que se escolhe fazer) → prova teórica
 *   (poucas perguntas, respondidas pelo jogador; as outras, pela preparação
 *   do personagem) → prova prática (a mão e os nervos: aulas extras ajudam)
 *   → carteira — ou a reprovação, dita com o porquê, e a próxima data.
 *
 * As perguntas são de direção segura e convivência no trânsito (conteúdo
 * original, sem artigo de lei nem número de norma). O jogador responder bem
 * ajuda; a preparação do personagem continua importando (quem estudou a
 * apostila acerta as que o jogador não viu).
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Processo, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar, pagar } from './dinheiro';

export type ProcessoCnh = Extract<Processo, { tipo: 'cnh' }>;

export interface PerguntaCnh { id: string; enunciado: string; opcoes: [string, string, string]; /** Índice da resposta segura. */ certa: 0 | 1 | 2 }

export const PERGUNTAS_CNH: readonly PerguntaCnh[] = [
  { id: 'faixa', enunciado: 'Uma faixa de pedestres sem semáforo, e alguém parado na calçada, esperando para atravessar. Você:', opcoes: ['Reduz e para: a vez é de quem está a pé.', 'Buzina para avisar que vai passar.', 'Acelera para passar antes que a pessoa desça.'], certa: 0 },
  { id: 'chuva', enunciado: 'Começa a chover forte na avenida. O mais seguro é:', opcoes: ['Manter a velocidade de sempre, com atenção.', 'Aumentar a distância do carro da frente e reduzir a velocidade.', 'Frear forte nas curvas para não escorregar.'], certa: 1 },
  { id: 'ciclista', enunciado: 'Um ciclista vai à sua frente, na mesma faixa. Para ultrapassar:', opcoes: ['Buzinar até ele ir para o canto.', 'Passar rápido e colado, para não atrapalhar o trânsito.', 'Esperar espaço e passar com distância lateral folgada.'], certa: 2 },
  { id: 'sono', enunciado: 'Na estrada, à noite, o sono começa a pesar. Você:', opcoes: ['Para num lugar seguro e descansa.', 'Abre a janela, liga o som e segue.', 'Acelera para chegar logo.'], certa: 0 },
  { id: 'amarelo', enunciado: 'O semáforo fica amarelo quando você está chegando perto da faixa. Você:', opcoes: ['Acelera para cruzar antes do vermelho.', 'Para, se der para parar com segurança.', 'Freia de uma vez, em qualquer situação.'], certa: 1 },
  { id: 'sirene', enunciado: 'Uma ambulância com a sirene ligada se aproxima por trás. Você:', opcoes: ['Mantém a faixa: ela que desvie.', 'Freia no meio da pista.', 'Abre caminho, com sinal e cuidado.'], certa: 2 },
  { id: 'faixa_troca', enunciado: 'Antes de mudar de faixa, o certo é:', opcoes: ['Sinalizar, olhar os retrovisores e o ponto cego.', 'Mudar e sinalizar depois.', 'Confiar no retrovisor de dentro.'], certa: 0 },
  { id: 'bebida', enunciado: 'Numa festa, você bebeu duas latas de cerveja. Para voltar para casa:', opcoes: ['Toma um café forte e dirige devagar.', 'Não dirige: pede carona, táxi ou aplicativo.', 'Dirige, porque é perto.'], certa: 1 },
  { id: 'escola', enunciado: 'Perto de uma escola, na hora da saída, com crianças na calçada:', opcoes: ['Mantém a velocidade da via.', 'Buzina para as crianças saírem.', 'Reduz bastante e fica pronto para parar.'], certa: 2 }
];

/** Quantas perguntas o jogador responde (as outras, a preparação do personagem). */
export const PERGUNTAS_DO_JOGADOR = 3;
const TOTAL_DA_PROVA = 5;
const MINIMO = 4;

export const processoCnh = (v: Vida): ProcessoCnh | undefined => v.processos.find((p): p is ProcessoCnh => p.tipo === 'cnh');

/** A prova teórica está marcada e esperando o jogador. */
export const cnhEmProva = (v: Vida): ProcessoCnh | undefined => { const p = processoCnh(v); return p?.fase === 'prova' && p.prova ? p : undefined; };

/** O dia da prova chegou: sorteia as perguntas (a teórica) — ou resolve a prática, se a teórica já passou. */
export function diaDaProvaCnh(v: Vida, r: Rng, p: ProcessoCnh): void {
  if (p.teoricaOk) { provaPratica(v, r, p); return; }
  const rr = rngDe(v.id, 'cnh', p.id, p.tentativas);
  const ids = [...PERGUNTAS_CNH.map(x => x.id)];
  const escolhidas: string[] = [];
  while (escolhidas.length < PERGUNTAS_DO_JOGADOR) escolhidas.push(ids.splice(rr.int(0, ids.length - 1), 1)[0]);
  p.fase = 'prova';
  p.prova = { perguntas: escolhidas, atual: 0, acertos: 0 };
}

/** A pergunta da vez. */
export function perguntaAtual(p: ProcessoCnh): PerguntaCnh | undefined {
  const id = p.prova?.perguntas[p.prova.atual];
  return PERGUNTAS_CNH.find(x => x.id === id);
}

/** Chance de o personagem acertar uma pergunta que o jogador não respondeu: a apostila estudada, a cabeça. */
export const chanceDaPreparacao = (v: Vida, p: ProcessoCnh) => clamp(0.5 + (p.preparo ?? 0) * 0.13 + (v.mente.cognicao - 50) / 250 - (v.mente.estresse > 65 ? 0.08 : 0), 0.3, 0.93);

/**
 * Responde a pergunta da vez. Devolve `continua` enquanto há pergunta; no
 * fim, o resultado da teórica (e, se passou, da prática — no mesmo dia).
 */
export function responderPerguntaCnh(v: Vida, r: Rng, k: number): { continua: true } | { continua: false; texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const p = cnhEmProva(v)!;
  const q = perguntaAtual(p)!;
  const prova = p.prova!;
  if (k === q.certa) prova.acertos += 1;
  prova.atual += 1;
  if (prova.atual < prova.perguntas.length) return { continua: true };
  // As outras perguntas da prova: quem estudou a apostila acerta mais.
  let doPreparo = 0;
  for (let j = 0; j < TOTAL_DA_PROVA - PERGUNTAS_DO_JOGADOR; j++) if (r.chance(chanceDaPreparacao(v, p))) doPreparo += 1;
  const total = prova.acertos + doPreparo;
  p.prova = undefined;
  if (total < MINIMO) {
    p.tentativas += 1;
    p.fase = 'aulas';
    p.tFim = v.t + 3;
    pagar(v, 250);
    const texto = `Prova teórica: ${total} acertos de ${TOTAL_DA_PROVA} (${prova.acertos} das ${PERGUNTAS_DO_JOGADOR} que você respondeu). Precisava de ${MINIMO}. Nova prova em alguns meses — estudar a apostila e fazer simulados é o que mais ajuda.`;
    escrever(v, { texto: `Reprovou na prova teórica da autoescola (${total} de ${TOTAL_DA_PROVA}).`, relevancia: 'cotidiano', tema: 'lugar', tom: 'ruim' });
    if (p.tentativas >= 3) desistir(v, p);
    return { continua: false, texto, tom: 'ruim' };
  }
  p.teoricaOk = true;
  const teorica = `Prova teórica: ${total} acertos de ${TOTAL_DA_PROVA} — aprovad${v.eu.genero === 'feminino' ? 'a' : 'o'}.`;
  const pratica = provaPratica(v, r, p);
  return { continua: false, texto: `${teorica} ${pratica.texto}`, tom: pratica.passou ? 'bom' : 'neutro' };
}

/** A prova prática: a mão (as aulas, as extras) e os nervos. */
function provaPratica(v: Vida, r: Rng, p: ProcessoCnh): { passou: boolean; texto: string } {
  const chance = clamp(0.5 + (p.pratica ?? 0) * 0.12 + (p.tentativasPratica ?? 0) * 0.06 - (v.mente.estresse > 60 ? 0.12 : 0) + (v.mente.cognicao - 50) / 400, 0.25, 0.92);
  if (r.chance(chance)) {
    v.processos = v.processos.filter(x => x.id !== p.id);
    v.trabalho.licencas.push('cnh');
    const primeira = p.tentativas === 0 && !p.tentativasPratica;
    const texto = primeira ? 'Na prática, o examinador anotou pouco: passou de primeira e tirou a carteira de motorista.' : 'Na prática, desta vez a baliza entrou. Tirou a carteira de motorista.';
    escrever(v, { texto: primeira ? 'Passou na prova do Detran de primeira e tirou a carteira de motorista.' : 'Tirou a carteira de motorista, depois de reprovar antes.', relevancia: 'biografia', tema: 'lugar', tom: 'bom' });
    return { passou: true, texto };
  }
  p.tentativasPratica = (p.tentativasPratica ?? 0) + 1;
  p.fase = 'aulas';
  p.tFim = v.t + 3;
  pagar(v, 450);
  const erro = rngDe(v.id, 'cnh_erro', p.id, p.tentativasPratica).pick(['a baliza não entrou', 'o carro morreu na subida', 'faltou olhar o retrovisor na conversão', 'o nervosismo apertou no cruzamento']);
  const texto = `Na prática, ${erro}: reprovad${v.eu.genero === 'feminino' ? 'a' : 'o'}. A teórica continua valendo; a nova prática é em alguns meses — aulas extras ajudam.`;
  escrever(v, { texto: `Reprovou na prova prática da autoescola: ${erro}.`, relevancia: 'cotidiano', tema: 'lugar', tom: 'ruim' });
  if (p.tentativasPratica >= 3) desistir(v, p);
  return { passou: false, texto };
}

function desistir(v: Vida, p: ProcessoCnh): void {
  v.processos = v.processos.filter(x => x.id !== p.id);
  escrever(v, { texto: 'Depois de três reprovações no Detran, desistiu da carteira por um tempo.', relevancia: 'cotidiano', tema: 'lugar', tom: 'ruim' });
}

/* ------------------------------------------------------------- Preparação */

export type ComoPreparar = 'teoria' | 'pratica';
const custoAulas = (v: Vida) => Math.round(480 * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

export function disponibilidadePrepararCnh(v: Vida, como: ComoPreparar): Veredito {
  const p = processoCnh(v);
  if (!p) return bloqueio('incompativel', 'Primeiro, a matrícula na autoescola.');
  if (p.fase === 'prova') return bloqueio('incompativel', 'A prova é agora.');
  const chave = `cnh_prep_${como}`;
  if (v.fatos[chave] !== undefined && v.t - v.fatos[chave] < 12) return bloqueio('incompativel', como === 'teoria' ? 'A apostila deste ano já foi estudada.' : 'As aulas extras deste ano já foram feitas.');
  if (como === 'teoria' && (p.teoricaOk || (p.preparo ?? 0) >= 3)) return bloqueio('incompativel', p.teoricaOk ? 'A teórica já passou.' : 'A apostila está na ponta da língua.');
  if (como === 'pratica' && (p.pratica ?? 0) >= 3) return bloqueio('incompativel', 'Mais aula extra não muda muito agora.');
  return como === 'pratica' ? vereditoDePagar(v, custoAulas(v), 'Aulas extras custam uns') : PERMITIDO;
}

export function prepararCnh(v: Vida, como: ComoPreparar): string {
  const p = processoCnh(v)!;
  v.fatos[`cnh_prep_${como}`] = v.t;
  if (como === 'teoria') { p.preparo = (p.preparo ?? 0) + 1; return 'Estudou a apostila e fez simulados até as placas virarem conversa de mesa.'; }
  pagar(v, custoAulas(v));
  p.pratica = (p.pratica ?? 0) + 1;
  return 'Aulas extras: baliza, subida com freio de mão, o cruzamento que dava medo.';
}

/** Em palavras (Compras · Transporte). */
export function leituraDaAutoescola(v: Vida): string | undefined {
  const p = processoCnh(v);
  if (!p) return undefined;
  const prep = ['a apostila ainda fechada', 'a apostila começada', 'a apostila estudada', 'a apostila na ponta da língua'][Math.min(3, p.preparo ?? 0)];
  const mao = ['só as aulas obrigatórias', 'algumas aulas extras', 'bastante aula extra', 'mão firme'][Math.min(3, p.pratica ?? 0)];
  if (p.fase === 'prova') return 'Autoescola: a prova teórica é agora.';
  return `Autoescola: ${p.teoricaOk ? 'teórica aprovada; falta a prática' : 'aulas em andamento'} — ${p.teoricaOk ? mao : `${prep}, ${mao}`}.`;
}
