/**
 * AUDITORIA PÓS-PLAYTEST — Achado 7: filho surge sem cronologia humana.
 *
 * DIAGNÓSTICO APENAS.
 *
 * A auditoria social mediu 21,1 filhos por vida, o que já é conclusivo por si
 * só. Aqui o número é aberto: em que idades os filhos nascem, qual o intervalo
 * entre eles, e quanto tempo separa o início do relacionamento do primeiro
 * filho.
 *
 * Uso: npx tsx scripts/audit/cronologiaFilhos.ts   (env VIDAS, default 15)
 */

import { simularVida, PERFIS } from './simulador';

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);

const filhosPorVida: number[] = [];
const idadesDoPrimeiro: number[] = [];
const idadesDeTodos: number[] = [];
let vidas = 0;
let vidasComFilho = 0;

for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    const seed = 1000 + i * 37;
    const vida = simularVida(seed, perfil);
    vidas++;

    const filhos = (vida.familiaFinal ?? []).filter(
      (m) => m.tipo === 'filho' || m.tipo === 'filha'
    );
    filhosPorVida.push(filhos.length);
    if (filhos.length > 0) vidasComFilho++;

    // A idade do personagem quando o filho nasceu = idadeFinal - idade do filho.
    const nascimentos = filhos
      .map((f) => vida.idadeFinal - f.idade)
      .filter((x) => x >= 0)
      .sort((a, b) => a - b);
    if (nascimentos.length > 0) idadesDoPrimeiro.push(nascimentos[0]);
    idadesDeTodos.push(...nascimentos);
  }
}

function stats(xs: number[]) {
  if (!xs.length) return { min: 0, med: 0, max: 0, media: 0 };
  const s = [...xs].sort((a, b) => a - b);
  return {
    min: s[0],
    med: s[Math.floor(s.length / 2)],
    max: s[s.length - 1],
    media: s.reduce((a, b) => a + b, 0) / s.length
  };
}

const f = stats(filhosPorVida);
const p = stats(idadesDoPrimeiro);

console.log('='.repeat(78));
console.log('ACHADO 7 — CRONOLOGIA DE FILHOS');
console.log('='.repeat(78));
console.log(`\n${vidas} vidas\n`);

console.log('FILHOS POR VIDA:');
console.log(`  mínimo .... ${f.min}`);
console.log(`  mediana ... ${f.med}`);
console.log(`  média ..... ${f.media.toFixed(1)}`);
console.log(`  MÁXIMO .... ${f.max}`);
console.log(`  vidas com ao menos um filho: ${vidasComFilho}/${vidas}`);

console.log('\nIDADE NO PRIMEIRO FILHO:');
console.log(`  mínima .... ${p.min}`);
console.log(`  mediana ... ${p.med}`);
console.log(`  máxima .... ${p.max}`);

const porFaixa = new Map<string, number>();
for (const idade of idadesDeTodos) {
  const faixa =
    idade < 18 ? '<18' : idade < 25 ? '18-24' : idade < 35 ? '25-34' : idade < 45 ? '35-44' : idade < 55 ? '45-54' : '55+';
  porFaixa.set(faixa, (porFaixa.get(faixa) ?? 0) + 1);
}
console.log('\nNASCIMENTOS POR FAIXA DE IDADE DO PERSONAGEM:');
for (const faixa of ['<18', '18-24', '25-34', '35-44', '45-54', '55+']) {
  const n = porFaixa.get(faixa) ?? 0;
  const pctv = ((n / idadesDeTodos.length) * 100).toFixed(1);
  console.log(`  ${faixa.padEnd(6)} ${String(n).padStart(5)}  ${pctv.padStart(5)}%  ${'#'.repeat(Math.round(Number(pctv) / 2))}`);
}

const histograma = new Map<number, number>();
for (const n of filhosPorVida) histograma.set(n, (histograma.get(n) ?? 0) + 1);
console.log('\nDISTRIBUIÇÃO (quantas vidas têm N filhos):');
for (const [n, q] of [...histograma].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${String(n).padStart(3)} filho(s): ${String(q).padStart(3)} vida(s) ${'#'.repeat(q)}`);
}

console.log('\n' + '='.repeat(78));
console.log('O FLUXO QUE EXISTE HOJE (leitura de relationshipSystem.terFilho)');
console.log('='.repeat(78));
console.log(`
  relacionamento estável  ->  terFilho()  ->  FamilyMember{idade: 0} pronto

  O que a função verifica:
    · idade >= IDADE_MINIMA_FILHOS
    · existe parceiro vivo de tipo namorado/noivo/esposo
    · concepção ainda não usada NESTE ANO (F2, registroTemporal)

  O que NÃO existe em lugar nenhum do código:
    · estado de gestação (zero ocorrências de 'gravidez'/'gestacao' no domínio)
    · concepção como fato separado do nascimento
    · descoberta da gravidez
    · nove meses / semestres de gestação
    · fertilidade por idade
    · intervalo mínimo entre gestações maior que 1 ano
    · gêmeos ou múltiplos
    · qualquer relação entre tempo de namoro e chegada do filho

  A trava temporal da F2 é 'uma_vez_por_ano'. Ela impede DOIS filhos no mesmo
  ano — e só. Uma vida de 60 anos adultos com parceiro comporta, por essa
  regra, dezenas de filhos, que é exatamente o que a medição mostra.
`);
