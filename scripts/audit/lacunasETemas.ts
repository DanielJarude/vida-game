/**
 * F5-FIX — SEQUÊNCIAS DE SILÊNCIO E REPETIÇÃO SEMÂNTICA.
 *
 * Por que este script existe separado de `continuidade.ts`: aquele mede
 * "% de anos sem linha", e o playtest humano provou que essa métrica não
 * captura a experiência. O jogador NÃO reclamou do ano 9 silencioso isolado
 * (6→7→8→10 passou despercebido); reclamou de 2→6, três anos consecutivos
 * sumidos. A mesma porcentagem total pode ser confortável ou assustadora
 * dependendo de como o silêncio se DISTRIBUI.
 *
 * Então aqui se mede SEQUÊNCIA, não proporção: quantas lacunas de 1, de 2,
 * de 3 e de 4+ anos existem, por faixa etária.
 *
 * E mede-se repetição SEMÂNTICA: duas frases diferentes que contam a mesma
 * coisa ("a casa cheia de irmãos" / "dividindo quarto com os irmãos") são,
 * biograficamente, uma repetição. A F5 resolveu repetição literal e deixou
 * esta passar.
 */

import { simularVida, PERFIS } from './simulador';
import { temaDoTexto } from './temaDeMemoria';

/**
 * O tema de uma linha. Depois do F5-FIX o tema é DECLARADO na própria
 * entrada (`temaDeMemoria`); o mapeamento por texto fica só como retaguarda
 * para medir o BASELINE, cujas entradas foram geradas antes do campo existir.
 */
function temaDaLinha(l: { texto: string; temaDeMemoria?: string }): string | null {
  return l.temaDeMemoria ?? temaDoTexto(l.texto);
}

const FAIXAS: { nome: string; min: number; max: number }[] = [
  { nome: '0-2', min: 0, max: 2 },
  { nome: '3-5', min: 3, max: 5 },
  { nome: '6-11', min: 6, max: 11 },
  { nome: '12-14', min: 12, max: 14 },
  { nome: '15-17', min: 15, max: 17 },
  { nome: '18+', min: 18, max: 200 }
];

function faixaDe(idade: number): string {
  return FAIXAS.find(f => idade >= f.min && idade <= f.max)?.nome ?? '?';
}

/** Lacunas por faixa, classificadas pelo COMPRIMENTO da sequência. */
const lacunas = new Map<string, { um: number; dois: number; tres: number; quatroMais: number }>(
  FAIXAS.map(f => [f.nome, { um: 0, dois: 0, tres: 0, quatroMais: 0 }])
);
const anosPorFaixa = new Map<string, number>(FAIXAS.map(f => [f.nome, 0]));
const semLinhaPorFaixa = new Map<string, number>(FAIXAS.map(f => [f.nome, 0]));

/** Repetição temática: mesmo tema reaparecendo em N anos de distância. */
const repeticaoEm = { um: 0, dois: 0, tres: 0 };
let totalMemorias = 0;
const porTema = new Map<string, number>();

/** Gaps de 3+ na infância, por vida. */
let vidasComGap3Infancia = 0;
let vidasComGap4Infancia = 0;
const maioresGapsInfancia: number[] = [];

let seed = 1;
for (let i = 0; i < 105; i++) {
  const r = simularVida(seed++, PERFIS[i % PERFIS.length]);

  // --- sequências de silêncio
  let gap = 0;
  let inicioGap = 0;
  let maiorGapInf = 0;

  const fecharGap = (fimIdade: number) => {
    if (gap === 0) return;
    // A faixa da lacuna é a do ano em que ela COMEÇOU.
    const f = faixaDe(inicioGap);
    const acc = lacunas.get(f)!;
    if (gap === 1) acc.um++;
    else if (gap === 2) acc.dois++;
    else if (gap === 3) acc.tres++;
    else acc.quatroMais++;
    if (inicioGap <= 17) maiorGapInf = Math.max(maiorGapInf, gap);
    gap = 0;
    void fimIdade;
  };

  for (const ano of r.anos) {
    const f = faixaDe(ano.idade);
    anosPorFaixa.set(f, anosPorFaixa.get(f)! + 1);

    if (ano.logs.length === 0) {
      semLinhaPorFaixa.set(f, semLinhaPorFaixa.get(f)! + 1);
      if (gap === 0) inicioGap = ano.idade;
      gap++;
    } else {
      fecharGap(ano.idade);
    }
  }
  fecharGap(999);

  maioresGapsInfancia.push(maiorGapInf);
  if (maiorGapInf >= 3) vidasComGap3Infancia++;
  if (maiorGapInf >= 4) vidasComGap4Infancia++;

  // --- repetição temática (só entradas de TEXTURA = pequena memória)
  const memoriasPorIdade = new Map<number, string[]>();
  for (const ano of r.anos) {
    for (const l of ano.logs) {
      if ((l.relevancia ?? 'normal') !== 'textura') continue;
      const tema = temaDaLinha(l);
      if (!tema) continue; // não é pequena memória (é log de atividade)
      totalMemorias++;
      porTema.set(tema, (porTema.get(tema) ?? 0) + 1);
      const lista = memoriasPorIdade.get(ano.idade) ?? [];
      lista.push(tema);
      memoriasPorIdade.set(ano.idade, lista);
    }
  }
  const idades = [...memoriasPorIdade.keys()].sort((a, b) => a - b);
  for (let a = 0; a < idades.length; a++) {
    for (let b = a + 1; b < idades.length; b++) {
      const dist = idades[b] - idades[a];
      if (dist > 3) break;
      const temasA = memoriasPorIdade.get(idades[a])!;
      const temasB = memoriasPorIdade.get(idades[b])!;
      if (temasA.some(t => temasB.includes(t))) {
        if (dist === 1) repeticaoEm.um++;
        else if (dist === 2) repeticaoEm.dois++;
        else if (dist === 3) repeticaoEm.tres++;
      }
    }
  }
}

const pct = (a: number, b: number) => (b === 0 ? '  0.0%' : `${((a / b) * 100).toFixed(1).padStart(5)}%`);

console.log('='.repeat(92));
console.log('F5-FIX — SEQUÊNCIAS DE SILÊNCIO (105 vidas)');
console.log('='.repeat(92));
console.log('\nO que importa é a SEQUÊNCIA, não a proporção: 1 ano silencioso é normal,');
console.log('3+ anos seguidos na infância fazem parecer que a vida sumiu.\n');
console.log('faixa  |  anos | s/linha | lacunas de 1 |  de 2 |  de 3 |  de 4+');
console.log('-'.repeat(92));
for (const f of FAIXAS) {
  const a = lacunas.get(f.nome)!;
  const anos = anosPorFaixa.get(f.nome)!;
  if (anos === 0) continue;
  console.log(
    `${f.nome.padEnd(6)} | ${String(anos).padStart(5)} | ${pct(semLinhaPorFaixa.get(f.nome)!, anos)} | ` +
    `${String(a.um).padStart(12)} | ${String(a.dois).padStart(5)} | ${String(a.tres).padStart(5)} | ${String(a.quatroMais).padStart(6)}`
  );
}

const totalLac = [...lacunas.values()].reduce(
  (s, a) => ({
    um: s.um + a.um, dois: s.dois + a.dois, tres: s.tres + a.tres, quatroMais: s.quatroMais + a.quatroMais
  }),
  { um: 0, dois: 0, tres: 0, quatroMais: 0 }
);
console.log('-'.repeat(92));
console.log(
  `TOTAL  |       |         | ${String(totalLac.um).padStart(12)} | ${String(totalLac.dois).padStart(5)} | ` +
  `${String(totalLac.tres).padStart(5)} | ${String(totalLac.quatroMais).padStart(6)}`
);

console.log('\n--- INFÂNCIA (0-17) ---');
console.log(`vidas com gap >= 3 anos: ${vidasComGap3Infancia}/105 (${((vidasComGap3Infancia / 105) * 100).toFixed(1)}%)`);
console.log(`vidas com gap >= 4 anos: ${vidasComGap4Infancia}/105 (${((vidasComGap4Infancia / 105) * 100).toFixed(1)}%)`);
console.log(`maior gap na infância:   máx ${Math.max(...maioresGapsInfancia)}`);

console.log('\n' + '='.repeat(92));
console.log('REPETIÇÃO SEMÂNTICA DE PEQUENA MEMÓRIA');
console.log('='.repeat(92));
console.log(`\npequenas memórias emitidas: ${totalMemorias}`);
console.log('\nmesmo TEMA reaparecendo a:');
console.log(`  1 ano de distância ..... ${repeticaoEm.um}`);
console.log(`  2 anos de distância .... ${repeticaoEm.dois}`);
console.log(`  3 anos de distância .... ${repeticaoEm.tres}`);
console.log('\npor tema:');
for (const [tema, n] of [...porTema.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tema.padEnd(22)} ${String(n).padStart(5)}`);
}
