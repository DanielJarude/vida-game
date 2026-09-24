/**
 * A semana: FONTE ÚNICA do tempo livre.
 *
 * A interface desenha a semana com estes números e o motor decide se uma
 * atividade cabe com estes mesmos números — não existe um cálculo para a
 * tela e outro para a regra.
 *
 * Unidade: um "pedaço" da semana. 0,5 é uma vez por semana; 1, algumas vezes;
 * 2, quase todo dia. Uma criança tem uns 2 pedaços além da escola; um
 * adolescente, 3; um adulto, 3,5. Trabalho, faculdade, filhos pequenos e
 * quem precisa de cuidado em casa ocupam parte disso antes de qualquer
 * escolha. Condução própria devolve tempo onde o ônibus é ruim.
 */

import type { Vida } from '../tipos';
import { filhos, idade, idadePessoa, moraCom, vinculosVivos } from '../nucleo';
import { veiculoUtil } from './veiculos';
import { economiaLocal } from '../dados/lugares';
import { curso } from '../dados/cursos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { listaNatural } from '../texto';
import { modeloRotina, nivelDa, nivelModelo } from './rotinas';

export interface Compromisso {
  id: string;
  rotulo: string;
  peso: number;
  tipo: 'trabalho' | 'estudo' | 'filhos' | 'cuidado' | 'deslocamento' | 'rotina';
}

export interface Semana {
  /** Tempo que existiria sem nenhum compromisso fixo. */
  base: number;
  /** O que ocupa a semana antes de qualquer escolha (trabalho, faculdade, filhos...). */
  fixos: Compromisso[];
  /** Tempo devolvido (condução própria). */
  ganhos: Compromisso[];
  /** O que sobra para escolher: base − fixos + ganhos (nunca menos de 0,5). */
  capacidade: number;
  /** As atividades escolhidas. */
  rotinas: Compromisso[];
  ocupado: number;
  livre: number;
}

export function baseDaSemana(i: number): number {
  if (i < 5) return 1;
  if (i < 12) return 2;
  if (i < 18) return 3;
  if (i < 80) return 3.5;
  return 2.5;
}

export function semana(v: Vida): Semana {
  const i = idade(v);
  const base = baseDaSemana(i);
  const fixos: Compromisso[] = [];
  const ganhos: Compromisso[] = [];

  const e = v.trabalho.atual;
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    const nome = oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : 'trabalho';
    let peso = e.carga === 'integral' ? 1.5 : 0.75;
    if (oc?.jornada === 'longa') peso += 0.5;
    if (oc?.jornada === 'fora') peso += 0.75;
    if (e.formacaoAte) peso = 2;
    fixos.push({ id: 'trabalho', rotulo: e.formacaoAte ? `Curso de formação (${nome})` : `Trabalho (${nome}${oc?.jornada === 'fora' ? ', dias fora de casa' : oc?.jornada === 'longa' ? ', jornada longa' : e.carga === 'parcial' ? ', meio período' : ''})`, peso, tipo: 'trabalho' });
    if (v.trabalho.horasExtras) fixos.push({ id: 'horas_extras', rotulo: 'Horas extras', peso: 0.5, tipo: 'trabalho' });
  }
  const b = v.educacao.basica;
  if (b?.integrado) fixos.push({ id: 'integrado', rotulo: 'Médio integrado ao técnico (dia inteiro)', peso: 0.75, tipo: 'estudo' });
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const c = curso(m.cursoId);
    const peso = m.modalidade === 'ead' ? 0.5 : c.carga === 'integral' ? 1.5 : 0.75;
    fixos.push({ id: 'curso', rotulo: `${c.nivel === 'superior' ? 'Faculdade' : 'Curso'} (${c.nome}${m.modalidade === 'ead' ? ', a distância' : c.carga === 'integral' ? ', período integral' : ''})`, peso, tipo: 'estudo' });
  }
  const casa = filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa'));
  const pequenos = casa.filter(f => idadePessoa(v, f) < 6).length;
  const escolares = casa.filter(f => idadePessoa(v, f) >= 6 && idadePessoa(v, f) < 12).length;
  if (pequenos) fixos.push({ id: 'filhos_pequenos', rotulo: pequenos === 1 ? 'Um filho pequeno em casa' : `${pequenos} filhos pequenos em casa`, peso: Math.min(1.5, pequenos * 0.75), tipo: 'filhos' });
  if (escolares) fixos.push({ id: 'filhos_escola', rotulo: escolares === 1 ? 'Um filho em idade escolar' : `${escolares} filhos em idade escolar`, peso: Math.min(0.5, escolares * 0.25), tipo: 'filhos' });
  if (i >= 18) {
    const cuidar = moraCom(v).filter(p => {
      const par = v.vinculos[p.id]?.parentesco;
      return (par === 'mae' || par === 'pai' || par === 'avo' || par === 'sogro') && idadePessoa(v, p) >= 75 && p.saude < 45;
    });
    if (cuidar.length) fixos.push({ id: 'cuidar', rotulo: `Cuidar de ${listaNatural(cuidar.map(p => p.nome))}`, peso: 0.5 * cuidar.length, tipo: 'cuidado' });
  }
  // Um cachorro pede passeio todo dia (quem cuida é a casa inteira, mas o tempo sai de alguém).
  if (i >= 18) {
    const caes = vinculosVivos(v).filter(x => x.p.especie === 'cachorro' && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu').map(x => x.p);
    if (caes.length) fixos.push({ id: 'pets', rotulo: caes.length === 1 ? `Passear com ${caes[0].nome}` : `Passear com ${listaNatural(caes.map(p => p.nome))}`, peso: Math.min(0.5, 0.25 * caes.length) * (moraCom(v).some(p => idadePessoa(v, p) >= 12) ? 0.5 : 1), tipo: 'cuidado' });
  }
  const temConducao = v.financas.bens.some(x => x.tipo === 'veiculo' && !x.modeloId.startsWith('bike') && veiculoUtil(x));
  const transporte = economiaLocal(v.moradia.municipioId).transporte;
  if ((e || m) && i >= 18) {
    if (temConducao && transporte !== 'bom') ganhos.push({ id: 'conducao', rotulo: 'Condução própria (menos tempo no ônibus)', peso: 0.5, tipo: 'deslocamento' });
    else if (!temConducao && transporte === 'ruim') fixos.push({ id: 'onibus', rotulo: 'Horas no ônibus', peso: 0.25, tipo: 'deslocamento' });
  }

  const capacidade = Math.max(0.5, base - fixos.reduce((s, x) => s + x.peso, 0) + ganhos.reduce((s, x) => s + x.peso, 0));
  const rotinas: Compromisso[] = v.rotinas.map(r => {
    const mo = modeloRotina(r.id);
    const n = mo ? nivelModelo(mo, nivelDa(r)) : undefined;
    return { id: r.id, rotulo: mo ? (mo.niveis.length > 1 ? `${mo.nome} — ${n!.rotulo.toLowerCase()}` : mo.nome) : r.id, peso: n?.tempo ?? 0, tipo: 'rotina' as const };
  });
  const ocupado = rotinas.reduce((s, x) => s + x.peso, 0);
  return { base, fixos, ganhos, capacidade, rotinas, ocupado, livre: capacidade - ocupado };
}

/** Palavras para um pedaço de semana. */
export function dose(peso: number): string {
  if (peso <= 0.5) return 'uma vez por semana';
  if (peso <= 1) return 'algumas vezes por semana';
  if (peso <= 1.6) return 'quase dia sim, dia não';
  return 'quase todo dia';
}

/**
 * Cabe mais `extra` na semana? Se não, explica: o que já ocupa, quanto a
 * atividade pede e o que teria de sair ou diminuir.
 */
export function cabeNaSemana(v: Vida, extra: number, ignorar?: string): { cabe: true } | { cabe: false; motivo: string } {
  const s = semana(v);
  if (extra <= 0 || s.ocupado + extra <= s.capacidade + 0.01) return { cabe: true };
  const pesados = s.fixos.filter(f => f.peso >= 0.5).map(f => f.rotulo.replace(/ \(.*\)$/, '').toLowerCase());
  const outras = s.rotinas.filter(r => r.id !== ignorar).map(r => r.rotulo.replace(/ — .*/, '').toLowerCase());
  const ocupam = listaNatural([...pesados, ...outras]);
  const falta = s.ocupado + extra - s.capacidade;
  const soltar = s.rotinas.filter(r => r.id !== ignorar && r.peso >= falta - 0.01).sort((a, b) => a.peso - b.peso)[0];
  const pede = `Isso pede ${dose(extra)}`;
  if (!ocupam) return { cabe: false, motivo: `Não cabe na semana. ${pede}, e o tempo livre é pouco.` };
  const saida = soltar ? ` Para caber, seria preciso largar ou diminuir ${soltar.rotulo.replace(/ — .*/, '').toLowerCase()}.` : s.rotinas.length ? ' Seria preciso largar mais de uma coisa.' : s.fixos.length ? ' Sobra pouco além disso.' : '';
  return { cabe: false, motivo: `Sua semana já está cheia: ${ocupam}. ${pede}.${saida}` };
}
