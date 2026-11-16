/**
 * VIDA 24 — as ações do corpo que vive: o PLANO (o objetivo físico e a alimentação — direcionam a evolução de cada ano;
 * nada muda na hora) e os CUIDADOS com os pelos (aparar, lâmina, cera, laser). A constituição não se edita depois de
 * nascer (`v23/acao` recusa); a composição só anda com o tempo (`silhueta.evoluirCorpo24`).
 */
import type { Vida } from '../../tipos';
import { idade } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { AUTONOMIA, autonomia } from '../../sistemas/autonomia';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { precoDoCuidado24 } from '../../sistemas/silhueta';
import { ALIMENTACOES24, METODOS24, OBJETIVOS24, REGIOES24, REGIOES_DE_PELO24, type Alimentacao24, type MetodoDePelo24, type Objetivo24, type Regiao24, type RegiaoDePelo24 } from '../corpo/corpo24';

export type Op24 =
  | { o: 'plano'; objetivo?: Objetivo24 | null; regiao?: Regiao24; alimentacao?: Alimentacao24 }
  | { o: 'pelos'; metodo: MetodoDePelo24 | null; regioes?: RegiaoDePelo24[] };

export function disponibilidade24(v: Vida, op: Op24): Veredito {
  const i = idade(v);
  const base = autonomia(v, 'aparencia_basica');
  if (base.grau !== 'permitido') return base;
  if (i < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', 'Com essa idade, quem decide a comida e os cuidados é a família.');
  if (op.o === 'plano') {
    const p = v.corpo.plano24 ?? {};
    if (op.objetivo && !(op.objetivo in OBJETIVOS24)) return bloqueio('impossivel', 'Esse objetivo não existe.');
    if (op.objetivo === 'regiao' && !(op.regiao && op.regiao in REGIOES24)) return bloqueio('impossivel', 'Escolha a região.');
    if (op.alimentacao && !(op.alimentacao in ALIMENTACOES24)) return bloqueio('impossivel', 'Essa alimentação não existe.');
    const novoObj = op.objetivo === undefined ? p.objetivo : op.objetivo ?? undefined;
    const novaReg = novoObj === 'regiao' ? op.regiao ?? p.regiao : undefined;
    const novaAli = op.alimentacao ?? p.alimentacao ?? 'habitual';
    if (novoObj === p.objetivo && (novoObj !== 'regiao' || novaReg === p.regiao) && novaAli === (p.alimentacao ?? 'habitual')) return bloqueio('incompativel', 'Já está assim.');
    return PERMITIDO;
  }
  if (op.metodo === null) return v.eu.visual.pelos24 ? PERMITIDO : bloqueio('incompativel', 'Os pelos já estão naturais.');
  const m = METODOS24[op.metodo];
  if (!m) return bloqueio('impossivel', 'Esse cuidado não existe.');
  const regs = (op.regioes ?? []).filter(r => r in REGIOES_DE_PELO24);
  if (!regs.length) return bloqueio('impossivel', 'Escolha onde.');
  if (i < m.idade) return bloqueio('impossivel', `${m.nome}: a partir dos ${m.idade}.`);
  const atual = v.eu.visual.pelos24;
  if (atual && atual.metodo === op.metodo && JSON.stringify([...atual.regioes].sort()) === JSON.stringify([...regs].sort())) return bloqueio('incompativel', 'Já é assim.');
  if (atual?.metodo === 'laser' && v.t - atual.desde < 12) return bloqueio('incompativel', 'As sessões de laser ainda estão em andamento (um ano).');
  if (op.metodo === 'laser' && regs.every(r => v.eu.visual.laser24?.includes(r))) return bloqueio('incompativel', 'O laser já foi feito aí.');
  if (m.custo) { const p = vereditoDePagar(v, precoDoCuidado24(v, op.metodo, regs.length), op.metodo === 'laser' ? 'As sessões custam' : 'O primeiro ano custa'); if (p.grau !== 'permitido') return p; }
  return PERMITIDO;
}

export function executar24(v: Vida, op: Op24): string {
  if (op.o === 'plano') {
    const p = { ...(v.corpo.plano24 ?? {}) };
    if (op.objetivo !== undefined) { if (op.objetivo) p.objetivo = op.objetivo; else delete p.objetivo; }
    if (p.objetivo === 'regiao') p.regiao = op.regiao ?? p.regiao; else delete p.regiao;
    if (op.alimentacao) { if (op.alimentacao === 'habitual') delete p.alimentacao; else p.alimentacao = op.alimentacao; }
    p.desde = v.t;
    if (p.objetivo || p.alimentacao) v.corpo.plano24 = p; else delete v.corpo.plano24;
    const obj = p.objetivo ? OBJETIVOS24[p.objetivo].nome.toLowerCase() + (p.regiao ? ` (${REGIOES24[p.regiao]})` : '') : undefined;
    return `${obj ? `Objetivo: ${obj}.` : 'Sem objetivo físico.'} Alimentação: ${ALIMENTACOES24[p.alimentacao ?? 'habitual'].nome.toLowerCase()}. O corpo responde ao longo dos anos — com a rotina certa.`;
  }
  if (op.metodo === null) { delete v.eu.visual.pelos24; return 'Os pelos voltam a crescer naturais.'; }
  const regs = (op.regioes ?? []).filter(r => r in REGIOES_DE_PELO24);
  const m = METODOS24[op.metodo];
  if (m.custo) pagar(v, precoDoCuidado24(v, op.metodo, regs.length));
  v.eu.visual.pelos24 = { metodo: op.metodo, regioes: regs, desde: v.t };
  const onde = regs.map(r => REGIOES_DE_PELO24[r].toLowerCase()).join(', ');
  return op.metodo === 'laser' ? `Começaram as sessões de laser (${onde}): ao longo de um ano, os pelos vão sumindo.` : `${m.nome}: ${onde}.`;
}
