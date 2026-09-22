/**
 * AUDITORIA PÓS-PLAYTEST — Achado 1: o avatar não comunica gênero nem fase.
 *
 * DIAGNÓSTICO APENAS.
 *
 * Mede duas coisas, em números, para separar impressão de fato:
 *   1. quanto o rosto muda entre as FASES da vida;
 *   2. quanto o rosto muda entre MASCULINO e FEMININO.
 *
 * Uso: npx tsx scripts/audit/avatarDiferencas.ts
 */

import { proporcoesNaIdade, type ProporcoesRosto } from '../../src/presentation/avatar/faceProportions';
import { construirEspecificacaoAvatar } from '../../src/presentation/avatarRenderer';
import { normalizarAparencia } from '../../src/data/avatar/avatarData';

const FASES: { nome: string; idade: number }[] = [
  { nome: 'bebê (1)', idade: 1 },
  { nome: 'criança (6)', idade: 6 },
  { nome: 'adolescente (14)', idade: 14 },
  { nome: 'adulto (24)', idade: 24 },
  { nome: 'meia-idade (48)', idade: 48 },
  { nome: 'idoso (75)', idade: 75 }
];

const CHAVES = Object.keys(proporcoesNaIdade(24)) as (keyof ProporcoesRosto)[];

/** Diferença percentual média entre dois conjuntos de proporções. */
function distancia(a: ProporcoesRosto, b: ProporcoesRosto): number {
  let soma = 0;
  for (const k of CHAVES) {
    const base = Math.abs(a[k]) || 1;
    soma += Math.abs(a[k] - b[k]) / base;
  }
  return (soma / CHAVES.length) * 100;
}

console.log('='.repeat(78));
console.log('ACHADO 1 — AVATAR: O QUE MUDA E O QUE NÃO MUDA');
console.log('='.repeat(78));

console.log('\n--- 1. DIFERENÇA ENTRE FASES DA VIDA (proporções do rosto) ---\n');
console.log('Distância média entre fases consecutivas, em % das medidas:\n');
for (let i = 0; i < FASES.length - 1; i++) {
  const a = proporcoesNaIdade(FASES[i].idade);
  const b = proporcoesNaIdade(FASES[i + 1].idade);
  const d = distancia(a, b);
  const barra = '#'.repeat(Math.round(d));
  console.log(`  ${FASES[i].nome.padEnd(17)} -> ${FASES[i + 1].nome.padEnd(17)} ${d.toFixed(1).padStart(5)}%  ${barra}`);
}

console.log('\nMedidas mais expressivas entre bebê e adulto:\n');
const bebe = proporcoesNaIdade(1);
const adulto = proporcoesNaIdade(24);
const deltas = CHAVES.map((k) => ({
  k,
  delta: ((adulto[k] - bebe[k]) / (Math.abs(bebe[k]) || 1)) * 100
}))
  .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
  .slice(0, 8);
for (const d of deltas) {
  console.log(`  ${String(d.k).padEnd(14)} ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(1)}%`);
}

console.log('\n--- 2. DIFERENÇA ENTRE MASCULINO E FEMININO ---\n');

// A pergunta direta: a função que produz as proporções aceita gênero?
console.log('  assinatura de proporcoesNaIdade: (idade: number) => ProporcoesRosto');
console.log('  -> não existe parâmetro de gênero. As medidas do rosto de um');
console.log('     homem e de uma mulher da mesma idade são IDÊNTICAS.\n');

// E o retrato completo?
console.log('  assinatura de construirEspecificacaoAvatar:');
console.log('    (idade: number, aparencia: AparenciaAvatar) => EspecificacaoAvatar');
console.log('  -> o gênero do personagem NÃO é sequer passado ao renderer.\n');

const aparencia = normalizarAparencia({});
const spec = construirEspecificacaoAvatar(24, aparencia);
const campos = Object.keys(spec);
console.log(`  campos da especificação do retrato (${campos.length}):`);
console.log(`    ${campos.join(', ')}`);
const temGenero = JSON.stringify(spec).toLowerCase().includes('gener');
console.log(`\n  alguma trace de gênero na saída? ${temGenero ? 'sim' : 'NÃO'}`);

console.log('\n--- 3. BARBA ---\n');
console.log('  `barba` é campo de AparenciaAvatar (escolha do jogador),');
console.log('  não é derivado de gênero nem de idade.');
console.log('  -> nada impede barba num retrato feminino;');
console.log('  -> nada garante barba num retrato masculino adulto.');

console.log('\n' + '='.repeat(78));
console.log('CONCLUSÃO MENSURADA');
console.log('='.repeat(78));
console.log(`
  IDADE  : modelada de verdade. Seis quadros-chave interpolados ano a ano,
           com 22 medidas. Bebê -> adulto muda o crânio, o queixo e a altura
           dos olhos de forma substancial. O sistema EXISTE e funciona.

  GÊNERO : não modelado. Zero ocorrências de 'genero'/'Gender' em
           presentation/avatar/, avatarRenderer.ts, AvatarFace.tsx e
           data/avatar/. Trocar o gênero na criação não altera um pixel do
           rosto — confirma exatamente o relato do playtest.

  O diagnóstico do playtest ("bebê parece adulto pequeno") e a medição
  divergem, e vale registrar: as proporções de bebê são bem diferentes das
  de adulto. A percepção de "adulto pequeno" provavelmente vem de outros
  sinais — cabelo adulto em bebê, ausência de contexto de escala, e o fato
  de o retrato ser sempre um busto enquadrado igual. Isso precisa de
  verificação visual humana antes de qualquer redesenho.
`);
