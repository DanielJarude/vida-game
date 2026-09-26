/** Cenários montados à mão para os testes (FIX #4): adulto, parceria, filhos, netos, pais. */

import { nova, viverAte } from './ajuda';
import { idade } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { criarRng } from '../rng';
import { garantirVida } from '../sistemas/filhos';
import type { Genero, Parentesco, Pessoa, Vida, Vinculo } from '../tipos';

/** Uma vida adulta, sem romance nem trabalho, morando por conta própria. */
export function adulto(i: number, o: { semente?: number; genero?: Genero; municipioId?: string } = {}): Vida {
  let s = o.semente ?? 11;
  const municipioId = o.municipioId ?? 'recife-pe';
  let v = viverAte(nova({ semente: s, genero: o.genero ?? 'feminino', municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero: o.genero ?? 'feminino', municipioId }), i);
  v.momento = null;
  v.caminhos.pendente = undefined;
  for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: v.t };
    for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
  return v;
}

export function pessoaNova(v: Vida, idadeP: number, genero: Genero = 'masculino', extra: Partial<Pessoa> = {}): Pessoa {
  const p = criarPessoa(v, criarRng(v.seq + 7), { idade: idadeP, genero, municipioId: v.moradia.municipioId });
  Object.assign(p, extra);
  return p;
}

export function comParceiro(v: Vida, o: { idade?: number; estagio?: 'namoro' | 'morando_junto' | 'casamento'; anos?: number; genero?: Genero } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, o.idade ?? idade(v), o.genero ?? 'masculino', { atracao: 'mulheres', querFilhos: 'sim' });
  const vin = vincular(v, p, { origem: 'romance', proximidade: 80, convivio: o.estagio && o.estagio !== 'namoro' ? ['casa'] : ['casa'] });
  const anos = o.anos ?? 5;
  vin.tInicio = v.t - anos * 12;
  vin.romance = { estagio: o.estagio ?? 'casamento', tEstagio: v.t - anos * 12, tInicio: v.t - anos * 12, envolvimento: 80, planoFilhos: 'evitando' };
  if ((o.estagio ?? 'casamento') === 'casamento') vin.historia.push({ t: v.t - (anos - 1) * 12, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
  return { p, vin };
}

export function comFilho(v: Vida, i: number, o: { casa?: boolean; outroId?: string; genero?: Genero } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, i, o.genero ?? 'masculino', { sobrenome: v.eu.sobrenome, genitores: ['eu', ...(o.outroId ? [o.outroId] : [])] });
  const vin = vincular(v, p, { parentesco: 'filho', origem: 'familia', proximidade: 70, convivio: o.casa ?? i < 18 ? ['casa'] : [] });
  vin.tInicio = p.tNasc;
  if (i >= 4 && i < 18) p.ocupacao = 'estudante';
  garantirVida(p);
  return { p, vin };
}

/** Um parente do jogador com o laço dado (pai, mãe, irmão), sem genitores explícitos. */
export function comParente(v: Vida, parentesco: Parentesco, i: number, genero: Genero = 'masculino', proximidade = 60): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, i, genero);
  const vin = vincular(v, p, { parentesco, origem: 'familia', proximidade });
  return { p, vin };
}

/** Um neto: filho de um filho do jogador (e, opcionalmente, do genro/nora). */
export function comNeto(v: Vida, filho: Pessoa, i: number, outroId?: string): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, i, 'feminino', { genitores: [filho.id, ...(outroId ? [outroId] : [])] });
  const vin = vincular(v, p, { parentesco: 'neto', origem: 'familia', proximidade: 55 });
  garantirVida(p);
  return { p, vin };
}

/** Tira todos os pais do jogador (para cenários sem avós). */
export function semPais(v: Vida): void {
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco === 'mae' || vin.parentesco === 'pai') { const p = v.pessoas[vin.pessoaId]; if (p) p.vivo = false; }
}
