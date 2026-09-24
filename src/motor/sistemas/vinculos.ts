/**
 * O que uma pessoa É na vida do jogador.
 *
 * O vínculo guarda números (afeto, confiança, atrito, presença); este módulo
 * os traduz em PAPEL (parceiro, filho, amigo, colega...), FASE DE VIDA da
 * pessoa (bebê, criança, adolescente...), CÍRCULO (núcleo, família, amigos,
 * contextos) e IMPORTÂNCIA (quanto essa pessoa pesa na vida). Ações, luto,
 * a tela de Pessoas e o obituário partem daqui — nunca de `parentesco` cru.
 */

import type { Pessoa, Vida, Vinculo } from '../tipos';
import { idadePessoa } from '../nucleo';

export type Papel =
  | 'parceiro' | 'saindo' | 'caso' | 'interesse' | 'ex'
  | 'filho' | 'neto' | 'bisneto' | 'genro'
  | 'genitor' | 'irmao' | 'avo' | 'parente' | 'sogro'
  | 'amigo_proximo' | 'amigo' | 'colega' | 'conhecido' | 'afastado'
  | 'pet';

export type Fase = 'bebe' | 'crianca' | 'pre' | 'adolescente' | 'jovem' | 'adulto' | 'idoso';

export function faseDeIdade(i: number): Fase {
  if (i <= 2) return 'bebe';
  if (i <= 8) return 'crianca';
  if (i <= 12) return 'pre';
  if (i <= 17) return 'adolescente';
  if (i <= 25) return 'jovem';
  if (i <= 59) return 'adulto';
  return 'idoso';
}

export const fasePessoa = (v: Vida, p: Pessoa) => faseDeIdade(idadePessoa(v, p));

const ATIVOS = ['namoro', 'morando_junto', 'casamento'];

export function papelDe(p: Pessoa, vin: Vinculo): Papel {
  if (p.especie) return 'pet';
  const rom = vin.romance;
  if (rom && rom.secreto && rom.estagio !== 'ex') return 'caso';
  if (rom && ATIVOS.includes(rom.estagio)) return 'parceiro';
  if (rom?.estagio === 'saindo') return 'saindo';
  switch (vin.parentesco) {
    case 'filho': case 'enteado': return 'filho';
    case 'neto': return 'neto';
    case 'bisneto': return 'bisneto';
    case 'genro': return 'genro';
    case 'mae': case 'pai': case 'madrasta': case 'padrasto': return 'genitor';
    case 'irmao': case 'meio_irmao': return 'irmao';
    case 'avo': return 'avo';
    case 'sogro': return 'sogro';
    case 'tio': case 'primo': return 'parente';
    case 'pet': return 'pet';
  }
  if (rom?.estagio === 'ex') return 'ex';
  if (rom?.estagio === 'interesse') return 'interesse';
  switch (vin.estagio) {
    case 'amigo_proximo': return 'amigo_proximo';
    case 'amigo': return 'amigo';
    case 'colega': return 'colega';
    case 'afastado': return 'afastado';
    default: return 'conhecido';
  }
}

export const ehDescendente = (papel: Papel) => papel === 'filho' || papel === 'neto' || papel === 'bisneto';
export const ehFamilia = (papel: Papel) => ['filho', 'neto', 'bisneto', 'genro', 'genitor', 'irmao', 'avo', 'parente', 'sogro'].includes(papel);

export const moraJunto = (vin: Vinculo) => vin.convivio.includes('casa');
export const mesmaCidade = (v: Vida, p: Pessoa) => p.municipioId === v.moradia.municipioId;

/**
 * Círculos da vida, do centro para fora.
 *  - nucleo: parceria, filhos e quem mora com você;
 *  - familia: pais, irmãos, avós, netos, tios, primos;
 *  - amigos;
 *  - contexto: colegas de escola, trabalho, vizinhança, rotina;
 *  - passado: quem já foi importante e não está mais por perto.
 */
export type Circulo = 'nucleo' | 'familia' | 'amigos' | 'contexto' | 'passado';

export function circuloDe(p: Pessoa, vin: Vinculo): Circulo {
  const papel = papelDe(p, vin);
  if (papel === 'parceiro' || papel === 'filho' || moraJunto(vin)) return 'nucleo';
  if (ehFamilia(papel) || papel === 'pet') return 'familia';
  if (papel === 'amigo' || papel === 'amigo_proximo') return 'amigos';
  if (papel === 'saindo' || papel === 'caso') return 'nucleo';
  if (vin.convivio.length > 0 && papel !== 'ex' && papel !== 'afastado') return 'contexto';
  return 'passado';
}

const BASE: Record<Papel, number> = {
  parceiro: 70, saindo: 18, caso: 25, interesse: 4, ex: 8,
  filho: 82, neto: 42, bisneto: 28, genro: 22,
  genitor: 62, irmao: 40, avo: 32, parente: 10, sogro: 18,
  amigo_proximo: 45, amigo: 24, colega: 6, conhecido: 3, afastado: 8,
  pet: 20
};

/**
 * Quanto essa pessoa pesa na vida, 0..100: o papel, o afeto, morar junto,
 * o tempo de relação e o que viveram juntos. Não é visível como número —
 * decide o peso narrativo de uma perda, a ordem das pessoas e o obituário.
 */
export function importancia(v: Vida, p: Pessoa, vin: Vinculo): number {
  const papel = papelDe(p, vin);
  let base = BASE[papel];
  if (papel === 'parceiro') base = vin.romance?.estagio === 'casamento' ? 80 : vin.romance?.estagio === 'morando_junto' ? 72 : 52;
  const anos = Math.max(0, (Math.min(v.t, p.tMorte ?? v.t) - vin.tInicio) / 12);
  const afeto = 0.55 + vin.proximidade / 110;
  const casa = moraJunto(vin) ? 10 : 0;
  const tempo = Math.min(10, anos / 3);
  const historia = Math.min(12, vin.historia.reduce((s, h) => s + (h.peso ?? 1), 0) * 0.8);
  // Um bicho pesa, mas nunca como um filho ou uma parceria: no máximo, um marco na Linha da Vida.
  return Math.max(0, Math.min(papel === 'pet' ? 50 : 100, Math.round(base * afeto + casa + tempo + historia)));
}

/** Parceria romântica viva (namoro ou mais), sem contar casos escondidos. */
export function parceriaAtual(v: Vida): { p: Pessoa; vin: Vinculo } | undefined {
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (p?.vivo && vin.romance && ATIVOS.includes(vin.romance.estagio) && !vin.romance.secreto) return { p, vin };
  }
  return undefined;
}

/**
 * Estado civil, derivado dos vínculos. Viuvez é a última parceria ter
 * terminado pela morte (e não ter havido outra desde então).
 */
export function estadoCivil(v: Vida): 'solteiro' | 'namorando' | 'morando_junto' | 'casado' | 'separado' | 'divorciado' | 'viuvo' {
  const atual = parceriaAtual(v);
  if (atual) {
    const e = atual.vin.romance!.estagio;
    return e === 'casamento' ? 'casado' : e === 'morando_junto' ? 'morando_junto' : 'namorando';
  }
  const passadas = Object.values(v.vinculos)
    .filter(x => x.romance && x.romance.fim && (x.romance.fim === 'morte' || x.romance.fim === 'divorcio' || x.romance.fim === 'termino'))
    .sort((a, b) => (b.romance!.tEstagio) - (a.romance!.tEstagio));
  const ultima = passadas.find(x => x.romance!.fim === 'morte' || x.romance!.fim === 'divorcio' || x.historia.some(h => h.tipo === 'casa'));
  if (!ultima) return 'solteiro';
  if (ultima.romance!.fim === 'morte') return 'viuvo';
  if (ultima.romance!.fim === 'divorcio') return 'divorciado';
  return 'separado';
}

/** Filhos em comum com uma pessoa (pela árvore da família). */
export function filhosEmComum(v: Vida, outroId: string): Pessoa[] {
  return Object.values(v.vinculos)
    .filter(x => x.parentesco === 'filho')
    .map(x => v.pessoas[x.pessoaId])
    .filter(f => f && f.genitores?.includes('eu') && f.genitores.includes(outroId));
}

/** Descendentes diretos de uma pessoa do jogo (filhos de um filho = netos do jogador). */
export function filhosDe(v: Vida, paiId: string): Pessoa[] {
  return Object.values(v.pessoas).filter(x => x.genitores?.includes(paiId));
}
