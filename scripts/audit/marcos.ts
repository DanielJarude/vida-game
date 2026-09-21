/**
 * AUDITORIA — medições complementares: marcos perdidos, buracos na Linha da
 * Vida, e idade de cada transição de vida. TEMPORÁRIO.
 */
import { PERFIS, Perfil, simularVida, ResultadoVida } from './simulador';

const VIDAS = Number(process.env.VIDAS ?? 15);
const resultados: ResultadoVida[] = [];
let seed = 1000;
for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS; i++) { seed += 7919; resultados.push(simularVida(seed, perfil as Perfil, 100)); }
}
const N = resultados.length;
const L = (s = '') => console.log(s);

L(`\n===== MARCOS DE DESENVOLVIMENTO (eventos declarados \`repeticao: 'marco'\`) =====`);
const marcos = [
  { id: 'bb_primeira_palavra', nome: 'A Primeira Palavra', janela: '0-2' },
  { id: 'inf_primeiros_passos', nome: 'Primeiros Passos', janela: '1-2' }
];
for (const m of marcos) {
  let ocorreu = 0; const idades: number[] = [];
  for (const r of resultados) {
    const ano = r.anos.find(a => a.eventoDecisao?.id === m.id || a.acontecimento?.id === m.id);
    if (ano) { ocorreu++; idades.push(ano.idade); }
  }
  L(`${m.nome} (janela ${m.janela}): ocorreu em ${ocorreu}/${N} vidas (${(100 * ocorreu / N).toFixed(0)}%) · idades: ${[...new Set(idades)].sort((a, b) => a - b).join(', ') || '—'}`);
}

L(`\n===== BURACOS NA LINHA DA VIDA (anos consecutivos SEM nenhuma entrada) =====`);
const buracos: number[] = [];
const maiorPorVida: number[] = [];
const primeirosVinte: string[] = [];
for (const r of resultados) {
  let corrente = 0; let maior = 0;
  for (const a of r.anos) {
    if (a.logs.length === 0) { corrente++; maior = Math.max(maior, corrente); }
    else { if (corrente > 0) buracos.push(corrente); corrente = 0; }
  }
  if (corrente > 0) buracos.push(corrente);
  maiorPorVida.push(maior);
}
const ord = (xs: number[]) => [...xs].sort((a, b) => a - b);
const q = (xs: number[], p: number) => ord(xs)[Math.floor(ord(xs).length * p)];
L(`Total de buracos observados: ${buracos.length} · mediana ${q(buracos, .5)} anos · p90 ${q(buracos, .9)} · máximo ${Math.max(...buracos)} anos seguidos sem uma linha`);
L(`Maior buraco POR VIDA: mediana ${q(maiorPorVida, .5)} · p90 ${q(maiorPorVida, .9)} · máximo ${Math.max(...maiorPorVida)}`);
const buracosLongos = buracos.filter(b => b >= 5).length;
L(`Buracos de 5+ anos: ${buracosLongos} (${(100 * buracosLongos / buracos.length).toFixed(0)}% de todos os buracos)`);

L(`\n===== IDADES EXIBIDAS NA LINHA DA VIDA — PRIMEIROS 20 ANOS (amostra de 6 vidas) =====`);
for (const r of resultados.filter((_, i) => i % 18 === 0).slice(0, 6)) {
  const idades = r.anos.filter(a => a.idade <= 20 && a.logs.length > 0).map(a => a.idade);
  L(`  ${r.perfil} seed ${r.seed}: ${idades.join(' → ')}`);
}

L(`\n===== TRANSIÇÕES DE VIDA — em que idade cada coisa acontece =====`);
function idadeDoPrimeiro(r: ResultadoVida, pred: (texto: string) => boolean): number | null {
  for (const a of r.anos) for (const l of a.logs) if (pred(l.texto)) return a.idade;
  return null;
}
const marcosVida: Array<[string, (t: string) => boolean]> = [
  ['1º dia de escola (Fundamental)', t => /ingressou no 1º ano do Ensino Fundamental/i.test(t)],
  ['Conclusão do Fundamental', t => /concluiu o Ensino Fundamental/i.test(t)],
  ['Conclusão do Ensino Médio', t => /formou no Ensino Médio/i.test(t)],
  ['1º emprego', t => /foi contratado|contratado\(a\) como/i.test(t)],
  ['1º namoro', t => /começou a namorar|namoro com/i.test(t)],
  ['Casamento', t => /casou|casamento/i.test(t)],
  ['1º filho', t => /nasceu (seu|sua) filh/i.test(t)],
  ['Saída da casa dos pais', t => /saiu de casa|mudou-se|casa própria|primeiro apartamento/i.test(t)],
  ['Aposentadoria', t => /aposent/i.test(t)],
  ['Morte de um dos pais', t => /faleceu.*(pai|mãe)|(pai|mãe).*faleceu/i.test(t)]
];
for (const [nome, pred] of marcosVida) {
  const idades = resultados.map(r => idadeDoPrimeiro(r, pred)).filter((x): x is number => x !== null);
  const cobertura = `${idades.length}/${N} vidas (${(100 * idades.length / N).toFixed(0)}%)`;
  if (idades.length === 0) { L(`  ${nome.padEnd(34)} NUNCA ACONTECE ⚠️  — 0/${N} vidas`); continue; }
  L(`  ${nome.padEnd(34)} ${cobertura.padEnd(22)} idade: mín ${Math.min(...idades)} · mediana ${q(idades, .5)} · máx ${Math.max(...idades)}`);
}

L(`\n===== ORDEM CAUSAL: namoro → casamento → filho =====`);
let semNamoroAntesDeCasar = 0, semCasarAntesDeFilho = 0, tudoNoMesmoAno = 0, comFilho = 0;
for (const r of resultados) {
  const namoro = idadeDoPrimeiro(r, t => /começou a namorar|namoro com/i.test(t));
  const casamento = idadeDoPrimeiro(r, t => /casou|casamento/i.test(t));
  const filho = idadeDoPrimeiro(r, t => /nasceu (seu|sua) filh/i.test(t));
  if (filho !== null) comFilho++;
  if (casamento !== null && (namoro === null || namoro > casamento)) semNamoroAntesDeCasar++;
  if (filho !== null && (casamento === null || casamento > filho)) semCasarAntesDeFilho++;
  if (namoro !== null && casamento !== null && filho !== null && namoro === casamento && casamento === filho) tudoNoMesmoAno++;
}
L(`  vidas com filho: ${comFilho}/${N}`);
L(`  casou sem ter namorado antes: ${semNamoroAntesDeCasar}`);
L(`  teve filho sem ter casado antes: ${semCasarAntesDeFilho}`);
L(`  namoro + casamento + filho TODOS no mesmo ano de jogo: ${tudoNoMesmoAno} ⚠️`);

L(`\n===== FILHOS POR VIDA =====`);
const filhosPorVida = resultados.map(r => r.anos.reduce((s, a) => s + a.logs.filter(l => /nasceu (seu|sua) filh/i.test(l.texto)).length, 0));
L(`  mín ${Math.min(...filhosPorVida)} · mediana ${q(filhosPorVida, .5)} · p90 ${q(filhosPorVida, .9)} · MÁXIMO ${Math.max(...filhosPorVida)} ⚠️`);

L(`\n===== SALÁRIO E IDADE — quem ganha muito e com que idade =====`);
const marcosSalario = [5000, 10000, 20000];
for (const alvo of marcosSalario) {
  const idades: number[] = [];
  for (const r of resultados) {
    const ano = r.anos.find(a => (a.salarioMensal ?? 0) >= alvo);
    if (ano) idades.push(ano.idade);
  }
  if (!idades.length) { L(`  R$ ${alvo}/mês: nunca alcançado`); continue; }
  L(`  1ª vez com salário ≥ R$ ${alvo}/mês: ${idades.length}/${N} vidas · mín ${Math.min(...idades)} · mediana ${q(idades, .5)} anos`);
}
