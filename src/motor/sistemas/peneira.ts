/**
 * A peneira (ou a seletiva): um teste em dois momentos, não um dado.
 *
 *   o treino do começo (fundamentos, primeiros minutos)
 *   → o jogo-treino (os últimos minutos, quando o cansaço aparece)
 *   → a lista dos nomes chamados
 *
 * O que decide, nessa ordem de peso: a TÉCNICA construída (anos de prática
 * × intensidade × facilidade), o FÍSICO (forma, e se ela aguentou o jeito de
 * jogar escolhido), a LEITURA de jogo (tempo de prática competitiva), a
 * CABEÇA (nervos) e a idade na janela certa. A abordagem escolhida em cada
 * momento pesa conforme quem a pessoa é: arriscar a jogada difícil ajuda
 * quem tem técnica e afunda quem não tem; correr em todas é bom para quem
 * tem fôlego. E o dia conta — há centenas de garotos e poucas vagas.
 *
 * Quem não passa sai com uma devolutiva (o treinador gostou disto, faltou
 * aquilo), com prática acumulada e, se ficou perto, com a porta de tentar de
 * novo mais cedo.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Devolutiva, Dominio, Vida } from '../tipos';
import { idade } from '../nucleo';
import { habilidade } from './frentes';
import { estruturaEsportiva } from '../dados/mercado';

export type Aspecto = 'tecnica' | 'fisico' | 'leitura' | 'nervos';

export interface OpcaoPeneira { id: string; texto: (d: Dominio) => string; ajuste: (a: Aspectos) => number }
export interface EtapaPeneira { id: 'comeco' | 'final'; texto: (d: Dominio, lugar: string) => string; opcoes: OpcaoPeneira[] }

export interface Aspectos { tecnica: number; fisico: number; leitura: number; nervos: number; h: number; forma: number }

const futebol = (d: Dominio) => d === 'futebol';

export const ETAPAS_PENEIRA: EtapaPeneira[] = [
  {
    id: 'comeco',
    texto: (d, lugar) => (futebol(d)
      ? `${lugar}, oito da manhã. Duzentos garotos de colete, três treinadores de prancheta. Primeiro, fundamentos: passe, domínio, finalização.`
      : `${lugar}, sete da manhã. Dezenas de atletas, cronômetro na mão dos técnicos. Primeiro, a bateria de testes técnicos.`),
    opcoes: [
      { id: 'simples', texto: d => (futebol(d) ? 'Fazer o simples bem feito, sem inventar' : 'Executar com calma, sem pressa'), ajuste: a => (a.h >= 62 ? 0.25 : 0.4) },
      { id: 'arriscar', texto: d => (futebol(d) ? 'Arriscar a jogada difícil para aparecer' : 'Forçar o ritmo para marcar um tempo bom'), ajuste: a => (a.h >= 70 ? 0.7 : a.h >= 62 ? 0 : -0.6) },
      { id: 'intensidade', texto: () => 'Correr em todas, mostrar vontade', ajuste: a => (a.forma >= 60 ? 0.5 : -0.25) },
      // Ter alguém de casa na arquibancada acalma quem está nervoso.
      { id: 'familia', texto: () => 'Olhar para a arquibancada, onde alguém de casa veio junto, e jogar tranquilo', ajuste: a => (a.nervos < 0 ? 0.35 : 0.1) }
    ]
  },
  {
    id: 'final',
    texto: d => (futebol(d)
      ? 'Jogo-treino, últimos vinte minutos. As pernas pesam; os treinadores começam a anotar nomes.'
      : 'A prova final. O corpo já sente o dia inteiro; os técnicos se aproximam da pista.'),
    opcoes: [
      { id: 'poupar', texto: () => 'Guardar fôlego para o fim', ajuste: a => (a.forma < 55 ? 0.45 : -0.2) },
      { id: 'chamar', texto: d => (futebol(d) ? 'Pedir a bola e chamar o jogo' : 'Dar tudo na última volta'), ajuste: a => (a.h >= 68 && a.nervos >= -0.1 ? 0.6 : a.h < 60 ? -0.4 : 0.05) },
      { id: 'coletivo', texto: d => (futebol(d) ? 'Jogar para o time: tocar, se movimentar, marcar' : 'Seguir a estratégia combinada com o treinador'), ajuste: a => (a.leitura >= 0.2 ? 0.5 : 0.2) }
    ]
  }
];

/** Como a pessoa chega à peneira (antes do dia). */
export function aspectos(v: Vida, d: Dominio): Aspectos {
  const h = habilidade(v, d);
  const f = v.caminhos.frentes[d];
  const anosDePratica = (f?.meses ?? 0) / 12;
  return {
    h,
    forma: v.corpo.forma,
    tecnica: (h - 58) / 26,
    fisico: (v.corpo.forma - 52) / 40,
    leitura: Math.min(1, anosDePratica / 6) - 0.35 + ((v.rotinas.find(x => x.id === d)?.nivel ?? 1) >= 2 ? 0.1 : 0),
    nervos: clamp(-(v.mente.estresse - 40) / 60, -0.6, 0.4)
  };
}

export interface ResultadoPeneira {
  passou: boolean;
  perto: boolean;
  forte: Aspecto;
  fraco: Aspecto;
  falta: NonNullable<Devolutiva['falta']>;
  pontos: number;
}

/**
 * O resultado: técnica pesa mais; físico, leitura e cabeça completam; as
 * abordagens ajustam; a idade fora do melhor momento e a concorrência da
 * cidade pesam; o dia (acaso) decide o que está na margem.
 */
export function avaliarPeneira(v: Vida, r: Rng, d: Dominio, municipioId: string, notas: { comeco?: string; final?: string }, bonus: number): ResultadoPeneira {
  const a = aspectos(v, d);
  // Correr em todas cobra a conta no fim de quem não tem fôlego.
  const fisico = a.fisico - (notas.comeco === 'intensidade' && a.forma < 60 ? 0.25 : 0);
  const ajustes = ETAPAS_PENEIRA.map(e => e.opcoes.find(o => o.id === notas[e.id])?.ajuste(a) ?? 0);
  const abordagem = ajustes.reduce((s, x) => s + x, 0) / ajustes.length;
  const i = idade(v);
  const idadeAjuste = futebol(d) ? (i <= 12 ? -0.05 : i >= 17 ? -0.15 : 0) : i >= 18 ? -0.1 : 0;
  const concorrencia = estruturaEsportiva(municipioId) >= 2 ? 0.06 : 0;
  const dia = r.normal() * 0.14;
  const pontos = 0.48 * a.tecnica + 0.14 * fisico + 0.14 * a.leitura + 0.06 * a.nervos + 0.18 * abordagem + idadeAjuste + bonus + dia;
  const limiar = 0.24 + concorrencia;
  const valores: Record<Aspecto, number> = { tecnica: a.tecnica, fisico, leitura: a.leitura, nervos: a.nervos * 1.5 };
  const ordem = (Object.entries(valores) as [Aspecto, number][]).sort((x, y) => y[1] - x[1]);
  const forte = ordem[0][0];
  const fraco = ordem[ordem.length - 1][0];
  const passou = pontos >= limiar;
  const falta: ResultadoPeneira['falta'] = !passou && idadeAjuste <= -0.15 && a.tecnica > 0 ? 'idade' : !passou && pontos > limiar - 0.08 && a.tecnica > 0.2 ? 'concorrencia' : fraco;
  return { passou, perto: !passou && pontos >= limiar - 0.14, forte, fraco, falta, pontos };
}

const ELOGIO: Record<Aspecto, (d: Dominio) => string> = {
  tecnica: d => (futebol(d) ? 'do seu domínio de bola' : 'da sua técnica'),
  fisico: () => 'do seu fôlego',
  leitura: d => (futebol(d) ? 'da sua leitura de jogo' : 'de como você lê a prova'),
  nervos: () => 'da sua calma'
};
const CRITICA: Record<Aspecto, (d: Dominio) => string> = {
  tecnica: d => (futebol(d) ? 'a técnica ainda não está no nível da base' : 'a técnica ainda não está no nível da equipe'),
  fisico: () => 'você perdeu intensidade no fim do teste',
  leitura: d => (futebol(d) ? 'faltou experiência de jogo competitivo' : 'faltou experiência de competição'),
  nervos: () => 'o nervosismo apareceu nas primeiras bolas'
};

/** A fala do treinador, em uma frase — sem fórmula. */
export function falaDoTreinador(d: Dominio, res: ResultadoPeneira): string {
  if (res.passou) return `O treinador gostou ${ELOGIO[res.forte](d)}.`;
  if (res.falta === 'idade') return `O treinador gostou ${ELOGIO[res.forte](d)}, mas disse que, nessa idade, a base procura quem já está pronto.`;
  if (res.falta === 'concorrencia') return `O treinador gostou ${ELOGIO[res.forte](d)}; ficou entre os últimos cortados. Eram poucas vagas.`;
  if (res.forte === res.fraco) return `O treinador disse que ${CRITICA[res.fraco](d)}.`;
  return `O treinador gostou ${ELOGIO[res.forte](d)}, mas ${CRITICA[res.fraco](d)}.`;
}
