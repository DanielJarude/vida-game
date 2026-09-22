/**
 * F5 — CONTINUIDADE DA LINHA DA VIDA.
 *
 * Mede, nas mesmas 105 vidas, se a biografia é legível de ponta a ponta: onde
 * ficam os buracos, quanto duram, e se a correção não transformou a timeline
 * numa parede de texto.
 *
 * As duas métricas andam JUNTAS de propósito. É trivial zerar buracos
 * enchendo todo ano de frase, e é trivial manter a timeline limpa deixando a
 * infância muda. O que se quer é reduzir lacuna sistemática mantendo a
 * densidade baixa — por isso silêncio não é erro aqui, e "% sem linha" nunca
 * tem meta zero.
 */

import { simularVida, PERFIS } from './simulador';
import type { AnoDaVida } from './simulador';

const FAIXAS: { nome: string; min: number; max: number }[] = [
  { nome: '0-2', min: 0, max: 2 },
  { nome: '3-5', min: 3, max: 5 },
  { nome: '6-11', min: 6, max: 11 },
  { nome: '12-14', min: 12, max: 14 },
  { nome: '15-17', min: 15, max: 17 },
  { nome: '18-29', min: 18, max: 29 },
  { nome: '30-44', min: 30, max: 44 },
  { nome: '45-59', min: 45, max: 59 },
  { nome: '60+', min: 60, max: 200 }
];

function faixaDe(idade: number): string {
  return FAIXAS.find(f => idade >= f.min && idade <= f.max)?.nome ?? '?';
}

function mediana(v: number[]): number {
  if (v.length === 0) return 0;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function percentil(v: number[], p: number): number {
  if (v.length === 0) return 0;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

interface Acc {
  anos: number;
  semLinha: number;
  linhas: number;
  memorias: number;
  acontecimentos: number;
  decisoes: number;
  marcos: number;
  textura: number;
  com2: number;
  com3: number;
  com4: number;
  linhasPorAno: number[];
}

function novoAcc(): Acc {
  return {
    anos: 0, semLinha: 0, linhas: 0, memorias: 0, acontecimentos: 0,
    decisoes: 0, marcos: 0, textura: 0, com2: 0, com3: 0, com4: 0, linhasPorAno: []
  };
}

const porFaixa = new Map<string, Acc>(FAIXAS.map(f => [f.nome, novoAcc()]));
const geral = novoAcc();

/** Maior sequência de anos consecutivos sem nenhuma linha, por vida. */
const maioresGaps: number[] = [];
const gapsInfancia: number[] = [];
/** Todos os gaps individuais (para mediana/p90 do tamanho de lacuna). */
const todosGaps: number[] = [];

const vidas: { seed: number; anos: AnoDaVida[] }[] = [];

let seed = 1;
for (let i = 0; i < 105; i++) {
  const perfil = PERFIS[i % PERFIS.length];
  const r = simularVida(seed++, perfil);
  vidas.push({ seed: seed - 1, anos: r.anos });

  let gapAtual = 0;
  let maiorGap = 0;
  let gapInfAtual = 0;
  let maiorGapInf = 0;

  for (const ano of r.anos) {
    const f = faixaDe(ano.idade);
    const acc = porFaixa.get(f)!;
    const n = ano.logs.length;

    acc.anos++; geral.anos++;
    acc.linhas += n; geral.linhas += n;
    acc.linhasPorAno.push(n); geral.linhasPorAno.push(n);

    if (n === 0) {
      acc.semLinha++; geral.semLinha++;
      gapAtual++;
      if (gapAtual > maiorGap) maiorGap = gapAtual;
      if (ano.idade <= 17) {
        gapInfAtual++;
        if (gapInfAtual > maiorGapInf) maiorGapInf = gapInfAtual;
      }
    } else {
      if (gapAtual > 0) todosGaps.push(gapAtual);
      gapAtual = 0;
      gapInfAtual = 0;
    }

    if (n >= 2) { acc.com2++; geral.com2++; }
    if (n >= 3) { acc.com3++; geral.com3++; }
    if (n >= 4) { acc.com4++; geral.com4++; }

    for (const l of ano.logs) {
      const rel = l.relevancia ?? 'normal';
      if (rel === 'textura') { acc.textura++; geral.textura++; acc.memorias++; geral.memorias++; }
      else if (rel === 'marco') { acc.marcos++; geral.marcos++; }
      else { acc.acontecimentos++; geral.acontecimentos++; }
    }
    if (ano.decisoesApresentadas && ano.decisoesApresentadas > 0) {
      acc.decisoes += ano.decisoesApresentadas;
      geral.decisoes += ano.decisoesApresentadas;
    }
  }
  if (gapAtual > 0) todosGaps.push(gapAtual);
  maioresGaps.push(maiorGap);
  gapsInfancia.push(maiorGapInf);
}

const pct = (a: number, b: number) => (b === 0 ? '  0.0%' : `${((a / b) * 100).toFixed(1).padStart(5)}%`);

console.log('='.repeat(100));
console.log('F5 — CONTINUIDADE DA LINHA DA VIDA (105 vidas)');
console.log('='.repeat(100));
console.log('\nSilêncio NÃO é erro. A meta é eliminar lacuna SISTEMÁTICA, não zerar silêncio.\n');

console.log('faixa  |  anos | s/linha |  média | mediana |  p90 | 2+ linhas | 3+ | 4+ | textura');
console.log('-'.repeat(100));
for (const f of FAIXAS) {
  const a = porFaixa.get(f.nome)!;
  if (a.anos === 0) continue;
  console.log(
    `${f.nome.padEnd(6)} | ${String(a.anos).padStart(5)} | ${pct(a.semLinha, a.anos)} | ` +
    `${(a.linhas / a.anos).toFixed(2).padStart(6)} | ${String(mediana(a.linhasPorAno)).padStart(7)} | ` +
    `${String(percentil(a.linhasPorAno, 90)).padStart(4)} | ${pct(a.com2, a.anos)}     | ` +
    `${String(a.com3).padStart(3)} | ${String(a.com4).padStart(2)} | ${String(a.memorias).padStart(7)}`
  );
}

console.log('\n' + '='.repeat(100));
console.log('GERAL');
console.log('='.repeat(100));
console.log(`anos vividos ............................. ${geral.anos}`);
console.log(`anos sem nenhuma linha ................... ${geral.semLinha} (${((geral.semLinha / geral.anos) * 100).toFixed(1)}%)`);
console.log(`linhas por ano (média) ................... ${(geral.linhas / geral.anos).toFixed(3)}`);
console.log(`anos com 2+ linhas ....................... ${geral.com2} (${((geral.com2 / geral.anos) * 100).toFixed(1)}%)`);
console.log(`anos com 3+ linhas ....................... ${geral.com3}`);
console.log(`anos com 4+ linhas ....................... ${geral.com4}`);
// ATENÇÃO: 'textura' agrega pequena memória E o registro de atividades
// voluntárias (estudar, trabalhar), que também são textura. Não são a mesma
// coisa. A cobertura de pequena memória isolada está em pequenaMemoriaCobertura.ts.
console.log(`linhas de textura (memória + atividade) .. ${geral.textura}`);
console.log(`marcos ................................... ${geral.marcos}`);
console.log(`acontecimentos/decisões (normal) ......... ${geral.acontecimentos}`);

console.log('\n--- LACUNAS ---');
console.log(`maior gap por vida:      mediana ${mediana(maioresGaps)} · p90 ${percentil(maioresGaps, 90)} · máx ${Math.max(...maioresGaps)}`);
console.log(`maior gap ATÉ OS 17:     mediana ${mediana(gapsInfancia)} · p90 ${percentil(gapsInfancia, 90)} · máx ${Math.max(...gapsInfancia)}`);
console.log(`todos os gaps:           mediana ${mediana(todosGaps)} · p90 ${percentil(todosGaps, 90)} · máx ${Math.max(...todosGaps)} · total ${todosGaps.length}`);

// O caso do playtest: 7 anos -> 10 anos é um gap de 2 (8 e 9 vazios).
const gapsGrandesInfancia = gapsInfancia.filter(g => g >= 3).length;
console.log(`vidas com gap >= 3 anos na infância: ${gapsGrandesInfancia}/105 (${((gapsGrandesInfancia / 105) * 100).toFixed(1)}%)`);
const gapsMuitoGrandes = gapsInfancia.filter(g => g >= 5).length;
console.log(`vidas com gap >= 5 anos na infância: ${gapsMuitoGrandes}/105 (${((gapsMuitoGrandes / 105) * 100).toFixed(1)}%)`);

console.log('\n--- FAIXA 1-5 (baseline conhecido da auditoria: 37,1% sem linha) ---');
let anos15 = 0, sem15 = 0;
for (const v of vidas) {
  for (const ano of v.anos) {
    if (ano.idade >= 1 && ano.idade <= 5) { anos15++; if (ano.logs.length === 0) sem15++; }
  }
}
console.log(`anos 1-5: ${anos15} · sem linha: ${sem15} (${((sem15 / anos15) * 100).toFixed(1)}%)`);
