/**
 * AUDITORIA PÓS-PLAYTEST — Achado 3: anos que somem da Linha da Vida.
 *
 * DIAGNÓSTICO APENAS.
 *
 * O playtest viu "7 anos → 10 anos": os anos 8 e 9 não deixaram rastro. Este
 * script separa duas coisas que não são a mesma:
 *
 *   ANO SEM GRANDE ACONTECIMENTO — legítimo, e o projeto quer que exista.
 *   ANO QUE DESAPARECE DA BIOGRAFIA — a pessoa viveu e não ficou nada.
 *
 * A diferença operacional: o primeiro tem ao menos UMA linha (mesmo que
 * textura); o segundo tem ZERO. A Linha da Vida agrupa por ano, então um ano
 * com zero linhas não é renderizado — é isso que produz o salto visível.
 *
 * Mede também o que a pequena memória (F3, passo 7) deveria ter coberto e não
 * cobriu, e POR QUÊ: ela só roda em ano de pulso 'silencio'.
 *
 * Uso: npx tsx scripts/audit/buracosBiograficos.ts   (env VIDAS, default 15)
 */

import { simularVida, PERFIS } from './simulador';

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);

type Faixa = { nome: string; min: number; max: number };
const FAIXAS: Faixa[] = [
  { nome: '1-5', min: 1, max: 5 },
  { nome: '6-11', min: 6, max: 11 },
  { nome: '12-17', min: 12, max: 17 },
  { nome: '18-29', min: 18, max: 29 },
  { nome: '30-44', min: 30, max: 44 },
  { nome: '45-59', min: 45, max: 59 },
  { nome: '60+', min: 60, max: 200 }
];

const faixaDe = (idade: number) => FAIXAS.find((f) => idade >= f.min && idade <= f.max);

let totalAnos = 0;
let anosVazios = 0;
const vaziosPorFaixa = new Map<string, { anos: number; vazios: number }>();
for (const f of FAIXAS) vaziosPorFaixa.set(f.nome, { anos: 0, vazios: 0 });

const maioresSequencias: { perfil: string; seed: number; inicio: number; fim: number }[] = [];
const sequenciasTodas: number[] = [];
/** Histograma: quantos anos vazios uma vida acumula. */
const vaziosPorVida: number[] = [];
/** Composição: de onde vem a única linha, quando existe. */
const origemDaLinha = new Map<string, number>();

let vidas = 0;

for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    const seed = 1000 + i * 37;
    const vida = simularVida(seed, perfil);
    vidas++;

    let vaziosNestaVida = 0;
    let seqAtual = 0;
    let seqInicio = 0;
    let maiorSeq = 0;
    let maiorInicio = 0;
    let maiorFim = 0;

    for (const ano of vida.anos) {
      totalAnos++;
      const faixa = faixaDe(ano.idade);
      if (faixa) {
        const acc = vaziosPorFaixa.get(faixa.nome)!;
        acc.anos++;
        if (ano.logs.length === 0) acc.vazios++;
      }

      if (ano.logs.length === 0) {
        anosVazios++;
        vaziosNestaVida++;
        if (seqAtual === 0) seqInicio = ano.idade;
        seqAtual++;
        if (seqAtual > maiorSeq) {
          maiorSeq = seqAtual;
          maiorInicio = seqInicio;
          maiorFim = ano.idade;
        }
      } else {
        if (seqAtual > 0) sequenciasTodas.push(seqAtual);
        seqAtual = 0;
        // De onde veio a linha? (categoria da primeira linha do ano)
        for (const l of ano.logs) {
          const chave = `${l.categoria}${l.relevancia === 'textura' ? ' (textura)' : ''}`;
          origemDaLinha.set(chave, (origemDaLinha.get(chave) ?? 0) + 1);
        }
      }
    }
    if (seqAtual > 0) sequenciasTodas.push(seqAtual);

    vaziosPorVida.push(vaziosNestaVida);
    if (maiorSeq >= 2) {
      maioresSequencias.push({
        perfil,
        seed,
        inicio: maiorInicio,
        fim: maiorFim
      });
    }
  }
}

function pct(n: number, d: number) {
  return d === 0 ? '  0.0%' : `${((n / d) * 100).toFixed(1).padStart(5)}%`;
}
function mediana(xs: number[]) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function percentil(xs: number[], p: number) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

console.log('='.repeat(78));
console.log('ACHADO 3 — ANOS QUE DESAPARECEM DA LINHA DA VIDA');
console.log('='.repeat(78));
console.log(`\n${vidas} vidas · ${totalAnos} anos vividos\n`);

console.log(`ANOS SEM NENHUMA LINHA: ${anosVazios}/${totalAnos} (${pct(anosVazios, totalAnos)})`);
console.log('(um ano sem nenhuma linha não é renderizado: é o salto 7 -> 10)\n');

console.log('faixa  |  anos | anos vazios |      %');
console.log('-'.repeat(46));
for (const f of FAIXAS) {
  const a = vaziosPorFaixa.get(f.nome)!;
  console.log(
    `${f.nome.padEnd(6)} | ${String(a.anos).padStart(5)} | ${String(a.vazios).padStart(11)} | ${pct(a.vazios, a.anos)}`
  );
}

console.log('\n--- SEQUÊNCIAS DE ANOS CONSECUTIVOS SEM REGISTRO ---');
console.log(`total de lacunas ....... ${sequenciasTodas.length}`);
console.log(`mediana da lacuna ...... ${mediana(sequenciasTodas)} ano(s)`);
console.log(`p90 da lacuna .......... ${percentil(sequenciasTodas, 90)} ano(s)`);
console.log(`maior lacuna ........... ${Math.max(0, ...sequenciasTodas)} ano(s)`);
console.log(`lacunas de 2+ anos ..... ${sequenciasTodas.filter((s) => s >= 2).length}`);
console.log(`lacunas de 3+ anos ..... ${sequenciasTodas.filter((s) => s >= 3).length}`);

console.log('\n--- POR VIDA ---');
console.log(`anos vazios por vida: mediana ${mediana(vaziosPorVida)} · p90 ${percentil(vaziosPorVida, 90)} · máx ${Math.max(...vaziosPorVida)}`);
console.log(`vidas SEM nenhum ano vazio: ${vaziosPorVida.filter((v) => v === 0).length}/${vidas}`);

console.log('\n--- EXEMPLOS REPRODUZÍVEIS DE LACUNA (>=2 anos seguidos) ---');
for (const s of maioresSequencias.slice(0, 12)) {
  console.log(`  ${String(s.perfil).padEnd(14)} seed ${String(s.seed).padStart(5)} · anos ${s.inicio}-${s.fim} sem registro`);
}
console.log(`  ... ${maioresSequencias.length} vidas com lacuna de 2+ anos`);

console.log('\n--- COMPOSIÇÃO DA LINHA DA VIDA (de onde vêm as linhas) ---');
const totalLinhas = [...origemDaLinha.values()].reduce((a, b) => a + b, 0);
for (const [cat, n] of [...origemDaLinha].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(26)} ${String(n).padStart(6)}  ${pct(n, totalLinhas)}`);
}
console.log(`  ${'TOTAL'.padEnd(26)} ${String(totalLinhas).padStart(6)}`);
