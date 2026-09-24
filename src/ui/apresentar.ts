/**
 * Apresentação: estado do motor → palavras para a tela.
 * Relações, saúde e humor aparecem como palavras, nunca como números.
 */

import type { Entrada, Pessoa, Vida, Vinculo } from '../motor/tipos';
import { idade, idadePessoa, moraCom, parceiro } from '../motor/nucleo';
import { anoDe } from '../motor/tempo';
import { flex, rotuloParentesco, listaNatural } from '../motor/texto';
import { descreverEstagio } from '../motor/sistemas/romance';
import { descricaoOrigem } from '../motor/sistemas/social';
import { rotuloSerie } from '../motor/sistemas/escola';
import { curso } from '../motor/dados/cursos';
import { nomeOcupacaoId } from '../motor/sistemas/trabalho';
import { municipio, rotuloPerfil } from '../motor/dados/lugares';

export interface AnoDeVida {
  idade: number;
  ano: number;
  entradas: Entrada[];
}

export function anosDaBiografia(v: Vida, incluirCotidiano = true): AnoDeVida[] {
  const porIdade = new Map<number, Entrada[]>();
  for (const e of v.biografia) {
    if (e.relevancia === 'tecnico') continue;
    if (!incluirCotidiano && e.relevancia === 'cotidiano') continue;
    const lista = porIdade.get(e.idade) ?? [];
    lista.push(e);
    porIdade.set(e.idade, lista);
  }
  return [...porIdade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([i, entradas]) => ({
      idade: i,
      ano: anoDe(v.eu.tNasc) + i,
      // marcos primeiro, depois a ordem em que aconteceram
      entradas: [...entradas].sort((a, b) => peso(b) - peso(a) || a.t - b.t)
    }));
}

const peso = (e: Entrada) => (e.relevancia === 'marco' ? 2 : e.relevancia === 'biografia' ? 1 : 0);

export function faseDaVida(i: number): string {
  if (i <= 2) return 'Primeiros anos';
  if (i <= 5) return 'Primeira infância';
  if (i <= 11) return 'Infância';
  if (i <= 17) return 'Adolescência';
  if (i <= 29) return 'Juventude';
  if (i <= 59) return 'Vida adulta';
  return 'Maturidade';
}

/* -------------------------------------------------------------- Pessoas */

export function rotuloDe(v: Vida, p: Pessoa, vin: Vinculo): string {
  if (vin.romance?.secreto && vin.romance.estagio !== 'ex') return 'alguém que você vê escondido';
  if (!vin.parentesco && v.fatos[`ex_genro_${p.id}`] !== undefined) return flex(p.genero, 'ex-genro', 'ex-nora', 'ex-genre');
  if (vin.parentesco) {
    const r = rotuloParentesco(p, vin.parentesco);
    return `${flex(p.genero, 'seu', 'sua', 'sue')} ${r}`;
  }
  if (vin.romance && vin.romance.estagio !== 'interesse' && vin.romance.estagio !== 'ex') {
    const e = descreverEstagio(p.genero, vin.romance.estagio);
    return vin.romance.estagio === 'saindo' ? 'vocês estão saindo' : `${flex(p.genero, 'seu', 'sua', 'sue')} ${e}`;
  }
  if (vin.romance?.estagio === 'ex') return `${flex(p.genero, 'seu', 'sua', 'sue')} ex`;
  const onde = descricaoOrigem(v, vin);
  switch (vin.estagio) {
    case 'amigo_proximo': return `${flex(p.genero, 'amigo', 'amiga', 'amigue')} de longa data`;
    case 'amigo': return `${flex(p.genero, 'amigo', 'amiga', 'amigue')} ${onde}`;
    case 'colega': return `${flex(p.genero, 'colega', 'colega')} ${onde}`;
    case 'afastado': return `já foi ${flex(p.genero, 'próximo', 'próxima', 'próxime')}`;
    default: return `conhecid${flex(p.genero, 'o', 'a', 'e')} ${onde}`;
  }
}

/* -------------------------------------------------------------- Situação */

export function ondeMora(v: Vida): string {
  const m = v.moradia;
  const junto = moraCom(v).filter(p => !p.especie);
  const nomes = junto.map(p => {
    const vin = v.vinculos[p.id];
    if (vin.parentesco === 'mae') return 'a mãe';
    if (vin.parentesco === 'pai') return 'o pai';
    if (vin.parentesco === 'avo') return p.genero === 'feminino' ? 'a avó' : 'o avô';
    return p.nome;
  });
  if (m.tipo === 'pais' || m.tipo === 'parente') {
    const principais = nomes.filter(n => n.startsWith('a ') || n.startsWith('o '));
    return principais.length ? `mora com ${listaNatural(principais)}` : 'mora com a família';
  }
  const base = m.tipo === 'propria' ? 'em casa própria' : m.tipo === 'republica' ? 'numa república' : m.tipo === 'cedida' ? 'de favor' : 'de aluguel';
  if (!nomes.length && m.tipo === 'republica') return 'mora numa república, dividindo a casa';
  return nomes.length ? `mora ${base} com ${listaNatural(nomes)}` : `mora sozinh${flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e')}, ${base}`;
}

export function ocupacaoAtual(v: Vida): string {
  const i = idade(v);
  const partes: string[] = [];
  const b = v.educacao.basica;
  if (b) partes.push(b.etapa === 'creche' ? 'vai à creche' : b.etapa === 'pre' ? 'está na pré-escola' : `${rotuloSerie(b)}`);
  const m = v.educacao.matricula;
  if (m) partes.push(`${m.trancado ? 'curso trancado: ' : ''}${curso(m.cursoId).nome}`);
  const e = v.trabalho.atual;
  if (e) partes.push(nomeOcupacaoId(v, e.ocupacaoId));
  else if (v.trabalho.aposentadoria) partes.push(flex(v.eu.tratamento ?? v.eu.genero, 'aposentado', 'aposentada', 'aposentade'));
  else if (i >= 18 && !m) partes.push('sem trabalho');
  if (partes.length === 0) return i < 2 ? 'bebê' : 'criança';
  return partes.join(' · ');
}

export function lugarDescrito(id: string): string {
  const m = municipio(id);
  return `${m.nome}, ${m.uf} — ${rotuloPerfil(m.perfil)}, ${m.regiao}`;
}

export function palavraSaude(n: number): string {
  if (n >= 85) return 'ótima';
  if (n >= 68) return 'boa';
  if (n >= 50) return 'razoável';
  if (n >= 30) return 'frágil';
  return 'muito frágil';
}

export function palavraHumor(n: number): string {
  if (n >= 80) return 'feliz';
  if (n >= 62) return 'bem';
  if (n >= 45) return 'levando';
  if (n >= 28) return 'para baixo';
  return 'mal';
}

export function palavraEstresse(n: number): string {
  if (n >= 75) return 'no limite';
  if (n >= 55) return 'sob pressão';
  if (n >= 35) return 'normal';
  return 'tranquilo';
}

export function palavraDesempenho(n: number): string {
  if (n >= 80) return 'excelente';
  if (n >= 62) return 'bom';
  if (n >= 45) return 'mediano';
  if (n >= 30) return 'fraco';
  return 'muito fraco';
}

export function palavraChance(c?: number): string {
  if (c === undefined) return '';
  if (c >= 0.8) return 'muito provável';
  if (c >= 0.55) return 'provável';
  if (c >= 0.35) return 'possível';
  if (c >= 0.15) return 'difícil';
  return 'muito difícil';
}

export const dinheiroCurto = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  if (a >= 1_000_000) return `${s}R$ ${(a / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (a >= 10_000) return `${s}R$ ${Math.round(a / 1000)} mil`;
  return `${s}R$ ${Math.round(a).toLocaleString('pt-BR')}`;
};

export { idadePessoa, parceiro };
