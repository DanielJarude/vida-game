/**
 * AUDITORIA — executor. Roda N vidas por perfil, agrega métricas e escreve
 * os artefatos em /tmp/vida-auditoria (fora do repositório).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { PERFIS, Perfil, ResultadoVida, simularVida } from './simulador';

const SAIDA = process.env.SAIDA ?? '/tmp/vida-auditoria';
mkdirSync(SAIDA, { recursive: true });

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);
const resultados: ResultadoVida[] = [];

let seed = 1000;
for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    seed += 7919;
    resultados.push(simularVida(seed, perfil as Perfil, 100));
  }
}

console.log(`Vidas simuladas: ${resultados.length}`);

// ------------------------------------------------------------ Violações
const porCodigo = new Map<string, { total: number; vidas: Set<number>; exemplos: string[]; idades: number[] }>();
for (const r of resultados) {
  for (const v of r.violacoes) {
    if (!porCodigo.has(v.codigo)) porCodigo.set(v.codigo, { total: 0, vidas: new Set(), exemplos: [], idades: [] });
    const e = porCodigo.get(v.codigo)!;
    e.total++;
    e.vidas.add(r.seed);
    e.idades.push(v.idade);
    if (e.exemplos.length < 5) e.exemplos.push(`[${r.perfil} seed ${r.seed}] aos ${v.idade}: ${v.detalhe}`);
  }
}

console.log('\n=== VIOLAÇÕES DE COERÊNCIA ===');
const linhasViolacoes: string[] = [];
for (const [codigo, e] of [...porCodigo.entries()].sort((a, b) => b[1].total - a[1].total)) {
  const media = e.idades.reduce((s, x) => s + x, 0) / e.idades.length;
  const linha = `${codigo}: ${e.total} ocorrências em ${e.vidas.size}/${resultados.length} vidas (idade média ${media.toFixed(1)})`;
  console.log(linha);
  for (const ex of e.exemplos) console.log('   · ' + ex);
  linhasViolacoes.push(linha, ...e.exemplos.map(x => '   · ' + x));
}

// ------------------------------------------------------- Métricas por década
interface Bucket { anos: number; decisoes: number; acontecimentos: number; silencios: number; logs: number; }
const decadas = new Map<number, Bucket>();
for (const r of resultados) {
  for (const a of r.anos) {
    const d = Math.floor(a.idade / 10) * 10;
    if (!decadas.has(d)) decadas.set(d, { anos: 0, decisoes: 0, acontecimentos: 0, silencios: 0, logs: 0 });
    const b = decadas.get(d)!;
    b.anos++;
    if (a.eventoDecisao) b.decisoes++;
    if (a.acontecimento) b.acontecimentos++;
    if (a.pulso === 'silencio') b.silencios++;
    b.logs += a.logs.length;
  }
}
console.log('\n=== RITMO POR DÉCADA (agregado de todas as vidas) ===');
const linhasRitmo: string[] = ['| Década | anos-vida | % decisão | % acontecimento | % silêncio | logs/ano |', '| --- | --- | --- | --- | --- | --- |'];
for (const [d, b] of [...decadas.entries()].sort((a, b2) => a[0] - b2[0])) {
  const l = `| ${d}-${d + 9} | ${b.anos} | ${(100 * b.decisoes / b.anos).toFixed(1)}% | ${(100 * b.acontecimentos / b.anos).toFixed(1)}% | ${(100 * b.silencios / b.anos).toFixed(1)}% | ${(b.logs / b.anos).toFixed(2)} |`;
  console.log(l); linhasRitmo.push(l);
}

// -------------------------------------------- Agência acumulada até os 18
console.log('\n=== DECISÕES ANTES DOS 18 ANOS ===');
const decisoesAte18 = resultados.map(r => r.anos.filter(a => a.idade <= 18 && a.eventoDecisao).length);
decisoesAte18.sort((a, b) => a - b);
const pct = (p: number) => decisoesAte18[Math.floor(decisoesAte18.length * p)];
const zero18 = decisoesAte18.filter(x => x === 0).length;
const linhasAgencia = [
  `mín ${decisoesAte18[0]} · p25 ${pct(0.25)} · mediana ${pct(0.5)} · p75 ${pct(0.75)} · máx ${decisoesAte18[decisoesAte18.length - 1]}`,
  `vidas que chegam aos 18 sem NENHUMA decisão: ${zero18}/${resultados.length} (${(100 * zero18 / resultados.length).toFixed(1)}%)`
];
linhasAgencia.forEach(l => console.log(l));

// Decisões por faixa etária de autonomia
const faixas: [string, number, number][] = [['0-2', 0, 2], ['3-5', 3, 5], ['6-11', 6, 11], ['12-17', 12, 17], ['18-29', 18, 29], ['30-59', 30, 59], ['60+', 60, 200]];
console.log('\n=== DECISÕES POR FAIXA DE AUTONOMIA (média por vida) ===');
const linhasFaixa: string[] = ['| Faixa | decisões/vida | acontecimentos/vida | anos silenciosos/vida |', '| --- | --- | --- | --- |'];
for (const [nome, min, max] of faixas) {
  let dec = 0, aco = 0, sil = 0, vidasComFaixa = 0;
  for (const r of resultados) {
    const anos = r.anos.filter(a => a.idade >= min && a.idade <= max);
    if (anos.length === 0) continue;
    vidasComFaixa++;
    dec += anos.filter(a => a.eventoDecisao).length;
    aco += anos.filter(a => a.acontecimento).length;
    sil += anos.filter(a => a.pulso === 'silencio').length;
  }
  const l = `| ${nome} | ${(dec / vidasComFaixa).toFixed(2)} | ${(aco / vidasComFaixa).toFixed(2)} | ${(sil / vidasComFaixa).toFixed(2)} |`;
  console.log(l); linhasFaixa.push(l);
}

// ------------------------------------------------------------- Economia
console.log('\n=== ECONOMIA ===');
const saldoAos20 = resultados.map(r => r.anos.find(a => a.idade === 20)?.saldo ?? 0).sort((a, b) => a - b);
const saldoAos30 = resultados.map(r => r.anos.find(a => a.idade === 30)?.saldo ?? 0).sort((a, b) => a - b);
const saldoAos60 = resultados.map(r => r.anos.find(a => a.idade === 60)?.saldo ?? 0).filter(x => x !== 0).sort((a, b) => a - b);
const med = (arr: number[]) => arr.length ? arr[Math.floor(arr.length / 2)] : 0;
const linhasEconomia = [
  `saldo aos 20: mín ${saldoAos20[0]} · mediana ${med(saldoAos20)} · máx ${saldoAos20[saldoAos20.length - 1]}`,
  `saldo aos 30: mín ${saldoAos30[0]} · mediana ${med(saldoAos30)} · máx ${saldoAos30[saldoAos30.length - 1]}`,
  `saldo aos 60: mediana ${med(saldoAos60)}`
];
linhasEconomia.forEach(l => console.log(l));

// Menores de 18 com saldo alto
const menoresRicos = resultados.filter(r => r.anos.some(a => a.idade < 18 && a.saldo > 20000));
console.log(`vidas com saldo > R$20.000 antes dos 18: ${menoresRicos.length}/${resultados.length}`);
linhasEconomia.push(`vidas com saldo > R$20.000 antes dos 18: ${menoresRicos.length}/${resultados.length}`);

// --------------------------------------------------------------- Educação
console.log('\n=== EDUCAÇÃO ===');
const nivelFinal = new Map<string, number>();
for (const r of resultados) {
  const ultimo = r.anos[r.anos.length - 1];
  nivelFinal.set(ultimo.escolaridade, (nivelFinal.get(ultimo.escolaridade) ?? 0) + 1);
}
const linhasEducacao: string[] = [];
for (const [n, c] of [...nivelFinal.entries()].sort((a, b) => b[1] - a[1])) {
  const l = `${n}: ${c} vidas`; console.log(l); linhasEducacao.push(l);
}
// Duração medida de cursos
const duracoes: { curso: string; anos: number }[] = [];
for (const r of resultados) {
  let cursoAtual: string | undefined; let inicio = 0;
  for (const a of r.anos) {
    if (a.emCurso && a.emCurso !== cursoAtual) { cursoAtual = a.emCurso; inicio = a.idade; }
    if (!a.emCurso && cursoAtual) { duracoes.push({ curso: cursoAtual, anos: a.idade - inicio }); cursoAtual = undefined; }
  }
}
const porCurso = new Map<string, number[]>();
for (const d of duracoes) {
  if (!porCurso.has(d.curso)) porCurso.set(d.curso, []);
  porCurso.get(d.curso)!.push(d.anos);
}
console.log('\nDuração real medida (anos de jogo entre matrícula e saída):');
for (const [curso, arr] of porCurso) {
  const l = `  ${curso}: mín ${Math.min(...arr)} · mediana ${med([...arr].sort((a, b) => a - b))} · máx ${Math.max(...arr)} (n=${arr.length})`;
  console.log(l); linhasEducacao.push(l);
}

// ---------------------------------------------------------------- Carreira
console.log('\n=== CARREIRA ===');
const primeiroEmprego: number[] = [];
const saltoSalarial: string[] = [];
for (const r of resultados) {
  const primeiro = r.anos.find(a => a.cargo);
  if (primeiro) primeiroEmprego.push(primeiro.idade);
  let anterior: number | undefined;
  for (const a of r.anos) {
    if (a.salarioMensal && anterior && a.salarioMensal > anterior * 2) {
      saltoSalarial.push(`[${r.perfil} seed ${r.seed}] aos ${a.idade}: R$${anterior} → R$${a.salarioMensal} (${a.cargo})`);
    }
    anterior = a.salarioMensal ?? anterior;
  }
}
primeiroEmprego.sort((a, b) => a - b);
const linhasCarreira = [
  `idade do primeiro emprego: mín ${primeiroEmprego[0]} · mediana ${med(primeiroEmprego)} · máx ${primeiroEmprego[primeiroEmprego.length - 1]}`,
  `saltos salariais >2x num ano: ${saltoSalarial.length}`
];
linhasCarreira.forEach(l => console.log(l));
saltoSalarial.slice(0, 8).forEach(l => { console.log('   · ' + l); linhasCarreira.push('   · ' + l); });

// -------------------------------------------------------------- Longevidade
const idadesFinais = resultados.map(r => r.idadeFinal).sort((a, b) => a - b);
console.log(`\n=== LONGEVIDADE ===\nmín ${idadesFinais[0]} · p25 ${idadesFinais[Math.floor(idadesFinais.length * .25)]} · mediana ${med(idadesFinais)} · p75 ${idadesFinais[Math.floor(idadesFinais.length * .75)]} · máx ${idadesFinais[idadesFinais.length - 1]}`);

// ------------------------------------------------------------ Mudança de cidade
const mudou = resultados.filter(r => new Set(r.anos.map(() => r.cidade)).size > 1).length;
console.log(`vidas que mudaram de cidade: ${mudou}/${resultados.length}`);

// ------------------------------------------------ Artefatos em disco
writeFileSync(`${SAIDA}/resumo.md`, [
  '# Métricas da auditoria', '',
  `Vidas simuladas: ${resultados.length} (${PERFIS.length} perfis × ${VIDAS_POR_PERFIL})`, '',
  '## Violações', '```', ...linhasViolacoes, '```', '',
  '## Ritmo por década', ...linhasRitmo, '',
  '## Agência por faixa', ...linhasFaixa, '',
  '## Decisões até os 18', '```', ...linhasAgencia, '```', '',
  '## Economia', '```', ...linhasEconomia, '```', '',
  '## Educação', '```', ...linhasEducacao, '```', '',
  '## Carreira', '```', ...linhasCarreira, '```', '',
  '## Longevidade', '```',
  `mín ${idadesFinais[0]} · mediana ${med(idadesFinais)} · máx ${idadesFinais[idadesFinais.length - 1]}`,
  `vidas que mudaram de cidade: ${mudou}/${resultados.length}`,
  '```'
].join('\n'));

// Biografias legíveis das 12 primeiras vidas (uma por perfil + extras)
const amostra = PERFIS.flatMap(p => resultados.filter(r => r.perfil === p).slice(0, 2));
for (const r of amostra) {
  const linhas: string[] = [
    `# ${r.nome} — ${r.perfil} (seed ${r.seed})`,
    `${r.cidade}/${r.estado} · ${r.classeSocial} · ${r.genero} · morreu aos ${r.idadeFinal} (${r.causaMorte ?? '—'})`,
    `decisões: ${r.decisoesTotais} · acontecimentos: ${r.acontecimentosTotais} · anos silenciosos: ${r.anosSilenciosos}`,
    ''
  ];
  for (const a of r.anos) {
    const cab = `## ${a.idade} anos (${a.ano}) — ${a.pulso}`;
    const est = `   estado: escolaridade=${a.escolaridade}${a.emCurso ? ` · cursando ${a.emCurso} (${a.semestre}/${a.totalSemestres} sem)` : ''}${a.cargo ? ` · ${a.cargo} R$${a.salarioMensal}/mês (${a.anosNoCargo}a)` : ''} · saldo R$${a.saldo} · dívida R$${a.dividas} · saúde ${a.saude}`;
    linhas.push(cab, est);
    if (a.acoesVoluntarias.length) linhas.push(`   ações: ${a.acoesVoluntarias.join(', ')}`);
    if (a.eventoDecisao) linhas.push(`   DECISÃO "${a.eventoDecisao.titulo}" → ${a.eventoDecisao.opcaoEscolhida}`);
    if (a.acontecimento) linhas.push(`   ACONTECIMENTO "${a.acontecimento.titulo}"`);
    for (const l of a.logs) linhas.push(`   · [${l.categoria}/${l.relevancia ?? '-'}] ${l.texto}`);
  }
  linhas.push('', '## Razão financeiro');
  for (const l of r.razao) linhas.push(`  ${l.idade}a: ${l.descricao} → ${l.delta > 0 ? '+' : ''}${Math.round(l.delta)} (saldo ${Math.round(l.saldoDepois)})`);
  linhas.push('', '## Violações');
  for (const v of r.violacoes) linhas.push(`  ${v.idade}a [${v.codigo}] ${v.detalhe}`);
  writeFileSync(`${SAIDA}/vida-${r.perfil}-${r.seed}.md`, linhas.join('\n'));
}

writeFileSync(`${SAIDA}/bruto.json`, JSON.stringify(resultados.map(r => ({
  seed: r.seed, perfil: r.perfil, idadeFinal: r.idadeFinal,
  decisoes: r.decisoesTotais, acontecimentos: r.acontecimentosTotais,
  silencios: r.anosSilenciosos, violacoes: r.violacoes
})), null, 1));

console.log(`\nArtefatos em ${SAIDA}`);
