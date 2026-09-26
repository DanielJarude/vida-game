/** Medida (FIX #7): quanto da meia-idade vira biografia. */
import { nova, viverAte } from './ajuda';
import { comFilho, comParceiro } from './cenarios';
import { idade, parceiro } from '../nucleo';
import type { Vida } from '../tipos';

export interface Faixa { anosComBio: number; anos: number; bio: number; familia: number }
export interface Medida { vidas: number; anosComBio: number; anos: number; bioPorAno: number; familiaPorAno: number; porFaixa: Record<string, Faixa> }

/** Uma vida com família: parceria e dois filhos pequenos injetados aos 28. */
export function vidaComFamilia(semente: number, ate = 70, familia = true): Vida {
  let v = viverAte(nova({ semente, genero: semente % 2 ? 'feminino' : 'masculino' }), 28);
  if (v.morte || !familia) return viverAte(v, ate);
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: v.t };
    for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
  let par = parceiro(v)?.p;
  if (!par) {
    for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
    par = comParceiro(v, { idade: 29, anos: 3, genero: v.eu.genero === 'feminino' ? 'masculino' : 'feminino' }).p;
  }
  comFilho(v, 3, { outroId: par.id, genero: 'feminino' });
  comFilho(v, 0, { outroId: par.id });
  return viverAte(v, ate);
}

/** Anos 40–69: quantos têm ao menos uma linha de biografia/marco, e quantas linhas (de família) por ano. */
export function medir(sementes: number[], comFamilia = true): Medida {
  const faixas: Record<string, Faixa> = {};
  let anosComBio = 0, anos = 0, bio = 0, familia = 0, vidas = 0;
  for (const s of sementes) {
    const v = vidaComFamilia(s, 70, comFamilia);
    vidas++;
    const fim = v.morte ? idade(v) - 1 : 69;
    for (let i = 40; i <= Math.min(69, fim); i++) {
      const linhas = v.biografia.filter(e => e.idade === i && (e.relevancia === 'biografia' || e.relevancia === 'marco'));
      const fam = linhas.filter(e => e.tema === 'familia' || e.tema === 'filhos').length;
      const f = `${Math.floor(i / 10) * 10}`;
      const x = faixas[f] ?? (faixas[f] = { anosComBio: 0, anos: 0, bio: 0, familia: 0 });
      x.anos++; anos++;
      x.bio += linhas.length; bio += linhas.length;
      x.familia += fam; familia += fam;
      if (linhas.length) { x.anosComBio++; anosComBio++; }
    }
  }
  return { vidas, anosComBio, anos, bioPorAno: bio / anos, familiaPorAno: familia / anos, porFaixa: faixas };
}
