/**
 * Deslocamento: como a pessoa vai ao trabalho e ao estudo — FONTE ÚNICA.
 *
 * A semana (tempo), o orçamento (passagem) e a tela (Tempo livre, Cidade)
 * leem daqui. Não é simulador de trânsito: é a diferença que o que você tem
 * faz na vida de todo dia. Quem compra um carro numa cidade média passa a
 * gastar vinte minutos em vez de uma hora; quem pedala numa cidade pequena
 * chega rápido e de graça; quem não tem nada vai de ônibus — ou a pé, onde a
 * cidade cabe a pé.
 *
 * Regras:
 *  - só há trajeto com trabalho ou estudo PRESENCIAL (quem trabalha em casa,
 *    ou vende pela internet, não se desloca todo dia);
 *  - carro e moto só contam com CNH (sem carteira, o carro fica na garagem);
 *  - veículo parado ou quebrado de vez não leva ninguém;
 *  - bicicleta não serve para trajetos longos de metrópole;
 *  - sem escolha do jogador, vai-se do jeito mais rápido que se tem; o
 *    jogador pode preferir outro (o ônibus para economizar o carro, a
 *    bicicleta pela saúde), e a tela diz a diferença em tempo e em dinheiro.
 *
 * Os tempos são abstração de gameplay por porte de cidade (minutos de ida e
 * volta num dia útil), calibrados para a ordem de grandeza brasileira: nas
 * metrópoles o transporte público leva perto de duas horas por dia; numa
 * cidade pequena, meia hora.
 */

import type { Veiculo, Vida } from '../tipos';
import { idade } from '../nucleo';
import { municipio, economiaLocal, type PerfilUrbano } from '../dados/lugares';
import { tipoNegocio } from '../dados/negocios';
import { modeloVeiculo } from '../dados/bens';
import { veiculoUtil } from './veiculos';

export type Modo = 'a_pe' | 'bicicleta' | 'publico' | 'moto' | 'carro';

/** Minutos por dia útil (ida e volta), por porte de cidade. `null`: não é um jeito plausível de fazer o trajeto ali. */
const MINUTOS: Record<PerfilUrbano, Record<Modo, number | null>> = {
  metropole:     { a_pe: null, bicicleta: null, publico: 110, moto: 55, carro: 85 },
  metropolitana: { a_pe: null, bicicleta: 80, publico: 95, moto: 40, carro: 60 },
  capital:       { a_pe: null, bicicleta: 65, publico: 80, moto: 30, carro: 45 },
  polo:          { a_pe: 60, bicicleta: 35, publico: 60, moto: 18, carro: 22 },
  pequena:       { a_pe: 35, bicicleta: 20, publico: 45, moto: 10, carro: 14 }
};

/** Passagem do mês (transporte público), em reais de hoje — antes do custo de vida local. */
const PASSAGEM: Record<PerfilUrbano, number> = { metropole: 260, metropolitana: 230, capital: 210, polo: 170, pequena: 140 };

/** Minutos por dia viram pedaço da semana (≈ 220 minutos por dia útil = meia semana de tempo livre). */
const pesoDe = (min: number) => Math.round((min / 220) * 100) / 100;

export const NOME_MODO: Record<Modo, string> = { a_pe: 'a pé', bicicleta: 'de bicicleta', publico: 'de transporte público', moto: 'de moto', carro: 'de carro' };

export interface OpcaoDeslocamento {
  modo: Modo;
  minutos: number;
  /** Pedaço da semana. */
  peso: number;
  /** Passagem por mês (veículo próprio: os custos dele já estão no orçamento). */
  passagem: number;
  veiculoId?: string;
  nomeVeiculo?: string;
}

export interface Deslocamento extends OpcaoDeslocamento {
  /** Para onde vai todo dia ("o trabalho", "a faculdade", "o trabalho e a faculdade"). */
  destino: string;
  /** Rótulo para a semana ("Trajeto de carro (Onix)", "Ônibus todo dia"). */
  rotulo: string;
  /** Por que este jeito. */
  motivo: string;
  /** Os outros jeitos possíveis agora (para comparar e escolher). */
  opcoes: OpcaoDeslocamento[];
  /** O jogador escolheu (e não é o automático). */
  escolhido: boolean;
}

/** O trabalho de todo dia é em casa (negócio começado em casa, loja on-line do dono dedicado). */
export function trabalhaEmCasa(v: Vida): boolean {
  const e = v.trabalho.atual;
  const n = v.caminhos.negocio;
  if (!e || !n || n.estado === 'fechado' || e.ocupacaoId !== n.ocupacaoId) return false;
  return !!n.emCasa || tipoNegocio(n.tipo)?.presenca === 'online';
}

/** Destino diário, em palavras (`undefined`: não há trajeto de todo dia). */
function destino(v: Vida): string | undefined {
  if (v.justica?.prisao || idade(v) < 14) return undefined;
  const m = v.educacao.matricula;
  const trabalho = !!v.trabalho.atual && !trabalhaEmCasa(v);
  const estudo = !!m && !m.trancado && m.modalidade === 'presencial';
  if (trabalho && estudo) return 'o trabalho e o estudo';
  if (trabalho) return 'o trabalho';
  if (estudo) return 'o estudo';
  return undefined;
}

/** Por que não há trajeto (para a tela dizer, em vez de calar). */
export function semTrajeto(v: Vida): string {
  if (trabalhaEmCasa(v)) return 'O trabalho é em casa: não há trajeto de todo dia.';
  return 'Sem trabalho ou estudo presencial, não há trajeto de todo dia.';
}

const temCnh = (v: Vida) => v.trabalho.licencas.includes('cnh');

/** Os veículos que levam a pessoa (útil, e com carteira quando precisa). */
function veiculosQueLevam(v: Vida): { b: Veiculo; modo: Modo }[] {
  const out: { b: Veiculo; modo: Modo }[] = [];
  for (const b of v.financas.bens) {
    if (b.tipo !== 'veiculo' || !veiculoUtil(b)) continue;
    const m = modeloVeiculo(b.modeloId);
    const modo: Modo = m.categoria === 'carro' ? 'carro' : m.categoria === 'moto' ? 'moto' : 'bicicleta';
    if ((modo === 'carro' || modo === 'moto') && !temCnh(v)) continue;
    out.push({ b, modo });
  }
  return out;
}

/** Todos os jeitos possíveis de fazer o trajeto hoje (do mais rápido ao mais lento). */
export function opcoesDeDeslocamento(v: Vida): OpcaoDeslocamento[] {
  const perfil = municipio(v.moradia.municipioId).perfil;
  const tabela = MINUTOS[perfil];
  const c = economiaLocal(v.moradia.municipioId).custo;
  const out: OpcaoDeslocamento[] = [];
  const vistos = new Set<Modo>();
  // O melhor veículo de cada tipo (o mais valioso: é o que a pessoa usa).
  for (const { b, modo } of veiculosQueLevam(v).sort((a, b2) => b2.b.valor - a.b.valor)) {
    const min = tabela[modo];
    if (min === null || vistos.has(modo)) continue;
    vistos.add(modo);
    out.push({ modo, minutos: min, peso: pesoDe(min), passagem: 0, veiculoId: b.id, nomeVeiculo: b.nome });
  }
  out.push({ modo: 'publico', minutos: tabela.publico!, peso: pesoDe(tabela.publico!), passagem: Math.round(PASSAGEM[perfil] * c / 10) * 10 });
  if (tabela.a_pe !== null) out.push({ modo: 'a_pe', minutos: tabela.a_pe, peso: pesoDe(tabela.a_pe), passagem: 0 });
  return out.sort((a, b) => a.minutos - b.minutos);
}

/**
 * Como a pessoa se desloca hoje — ou `undefined` quando não há trajeto
 * diário. É daqui que saem o pedaço da semana e a passagem do mês.
 */
export function deslocamento(v: Vida): Deslocamento | undefined {
  const para = destino(v);
  if (!para) return undefined;
  const opcoes = opcoesDeDeslocamento(v);
  const pref = v.deslocamento?.modo;
  const preferida = pref ? opcoes.find(o => o.modo === pref) : undefined;
  // Automático: o mais rápido que se tem — mas entre a pé e o ônibus quase iguais, quem anda economiza a passagem.
  const auto = opcoes[0];
  const o = preferida ?? auto;
  const perfil = municipio(v.moradia.municipioId).perfil;
  const motivo = preferida
    ? `Você escolheu ir ${NOME_MODO[o.modo]}.`
    : o.modo === 'publico'
      ? (veiculoParadoOuSemCarteira(v) ?? (perfil === 'metropole' ? 'Na metrópole, o transporte público é o jeito de quem não tem condução.' : 'Sem condução própria, o jeito é o transporte público.'))
      : o.modo === 'a_pe' ? 'A cidade cabe a pé.' : `É o jeito mais rápido que você tem.`;
  const nome = o.nomeVeiculo ? ` (${o.nomeVeiculo})` : '';
  const rotulo = o.modo === 'publico' ? `Trajeto de ônibus${perfil === 'metropole' || perfil === 'metropolitana' ? ' e metrô' : ''}` : o.modo === 'a_pe' ? 'Trajeto a pé' : `Trajeto ${NOME_MODO[o.modo]}${nome}`;
  return { ...o, destino: para, rotulo, motivo, opcoes, escolhido: !!preferida };
}

/** Por que o veículo que se tem não está levando (a tela precisa dizer, não esconder). */
function veiculoParadoOuSemCarteira(v: Vida): string | undefined {
  const motor = v.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).categoria !== 'bicicleta');
  if (!motor.length) return undefined;
  if (!temCnh(v) && motor.some(veiculoUtil)) return 'Você tem veículo, mas não tem carteira de motorista: vai de transporte público.';
  if (motor.every(b => !veiculoUtil(b))) return motor.some(b => b.parado) ? 'O veículo está parado: vai de transporte público.' : 'O veículo está quebrado: vai de transporte público até consertar.';
  return undefined;
}

/** O veículo que faz o trajeto de todo dia (o resto é uso de fim de semana). */
export const veiculoDoTrajeto = (v: Vida): string | undefined => deslocamento(v)?.veiculoId;

/** Minutos em palavras ("uns 40 minutos por dia", "quase duas horas por dia"). */
export function tempoEmPalavras(min: number): string {
  if (min < 15) return 'uns 10 minutos por dia';
  if (min < 55) return `uns ${Math.round(min / 5) * 5} minutos por dia`;
  if (min < 75) return 'uma hora por dia';
  if (min < 100) return 'uma hora e meia por dia';
  return 'quase duas horas por dia';
}
