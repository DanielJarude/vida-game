/**
 * F6 — AUDITORIA DA VIDA SOCIAL (§1 e §24 do escopo).
 *
 * Mede, nas mesmas 105 vidas, as métricas que o escopo pede ANTES e DEPOIS.
 * Diagnóstico puro: não altera produção.
 *
 * Uso: npx tsx scripts/audit/vidaSocialF6.ts
 */

import { simularVida, PERFIS } from './simulador';
import type { FamilyMember } from '../../src/types';

const VIDAS_POR_PERFIL = 15;

const TIPOS_FAMILIA = ['pai', 'mae', 'irmao', 'irma', 'filho', 'filha'];
const TIPOS_PARCEIRO = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];
const TIPOS_AMIZADE = ['amigo', 'amiga', 'colega', 'mentor', 'rival', 'paixao'];

/** Profissões que uma criança/adolescente não pode exercer. */
function profissaoAdultaEmCrianca(m: FamilyMember): boolean {
  if (m.idade >= 18) return false;
  if (!m.profissao) return false;
  const ok = /estudante|colega|sem profiss/i.test(m.profissao);
  return !ok;
}

const amigosPorVida: number[] = [];
const amigosAtivosPorVida: number[] = [];
const conhecidosPorVida: number[] = [];
const primeiroAmigo: number[] = [];
const proximidadeInicial: number[] = [];

let vidas = 0;
let semAmigo10 = 0, semAmigo18 = 0, semAmigo30 = 0;
let totalFamilia = 0, totalNaoFamilia = 0, totalParceiros = 0;
let semNome = 0, semOrigem = 0, incoerenteIdade = 0, tipoPetIndevido = 0;
let memoriasAmizade = 0;

const tiposVistos = new Map<string, number>();
const origensVistas = new Map<string, number>();

for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    const seed = 1000 + i * 37;
    const vida = simularVida(seed, perfil);
    vidas++;

    // --- amigo por idade: contexto.temAmigo é gravado a cada ano ---
    const temAmigoNaIdade = (alvo: number): boolean | undefined => {
      const ano = vida.anos.find(a => a.idade === alvo);
      return ano?.contexto?.temAmigo;
    };
    if (vida.idadeFinal >= 10 && temAmigoNaIdade(10) === false) semAmigo10++;
    if (vida.idadeFinal >= 18 && temAmigoNaIdade(18) === false) semAmigo18++;
    if (vida.idadeFinal >= 30 && temAmigoNaIdade(30) === false) semAmigo30++;

    // idade do primeiro ano em que houve amigo
    const primeiro = vida.anos.find(a => a.contexto?.temAmigo === true);
    if (primeiro) primeiroAmigo.push(primeiro.idade);

    // --- composição final da rede ---
    const familiaFinal = vida.familiaFinal ?? [];
    let amigos = 0, conhecidos = 0, ativosAgora = 0;
    for (const m of familiaFinal) {
      const tipo = String(m.tipo);
      tiposVistos.set(tipo, (tiposVistos.get(tipo) ?? 0) + 1);

      if (TIPOS_FAMILIA.includes(tipo)) totalFamilia++;
      else if (TIPOS_PARCEIRO.includes(tipo)) { totalParceiros++; totalNaoFamilia++; }
      else if (TIPOS_AMIZADE.includes(tipo)) {
        totalNaoFamilia++; conhecidos++;
        // AMIGOS DA VIDA TODA (inclui quem morreu ou se afastou) e AMIGOS
        // ATIVOS são números diferentes, e confundir os dois foi um erro
        // meu na primeira leitura: "mediana 7" parecia uma rede grande
        // demais quando na verdade eram 70 anos de acumulação.
        if (tipo === 'amigo' || tipo === 'amiga') {
          amigos++;
          if (m.vivo && m.ativo !== false) ativosAgora++;
        }
      }
      else if (tipo !== 'pet') totalNaoFamilia++;

      // qualidade do NPC
      if (!m.nome || /novo familiar|^\s*$/i.test(m.nome)) semNome++;
      // F6: a origem canônica de uma relação social é `origemSocial`;
      // `origemEventoId` só existe para quem nasceu de um evento.
      if (!TIPOS_FAMILIA.includes(tipo) && tipo !== 'pet' && !TIPOS_PARCEIRO.includes(tipo)
          && !m.origemSocial && !m.origemEventoId) semOrigem++;
      if (profissaoAdultaEmCrianca(m)) incoerenteIdade++;
      // NPC humano que caiu no default 'pet' do eventSystem
      if (tipo === 'pet' && m.profissao) tipoPetIndevido++;

      const origem = m.origemSocial ?? m.origemEventoId ?? '(sem origem)';
      if (!TIPOS_FAMILIA.includes(tipo)) {
        origensVistas.set(origem, (origensVistas.get(origem) ?? 0) + 1);
      }
    }
    amigosPorVida.push(amigos);
    amigosAtivosPorVida.push(ativosAgora);
    conhecidosPorVida.push(conhecidos);

    // memórias com tema de amizade
    for (const ano of vida.anos) {
      for (const l of ano.logs) if (l.temaDeMemoria === 'amizade') memoriasAmizade++;
    }
  }
}

const med = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const p90 = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.9)];
};
const pct = (n: number) => `${((n / vidas) * 100).toFixed(1)}%`;

console.log('='.repeat(78));
console.log(`F6 — VIDA SOCIAL · ${vidas} vidas`);
console.log('='.repeat(78));

console.log('\n--- AMIZADE POR IDADE ---');
console.log(`vidas SEM amigo aos 10 ......... ${semAmigo10}/${vidas} (${pct(semAmigo10)})`);
console.log(`vidas SEM amigo aos 18 ......... ${semAmigo18}/${vidas} (${pct(semAmigo18)})`);
console.log(`vidas SEM amigo aos 30 ......... ${semAmigo30}/${vidas} (${pct(semAmigo30)})`);
console.log(`vidas que NUNCA tiveram amigo .. ${vidas - primeiroAmigo.length}/${vidas} (${pct(vidas - primeiroAmigo.length)})`);
console.log(`idade do 1o amigo: mediana ${med(primeiroAmigo)} · p90 ${p90(primeiroAmigo)}`);

console.log('\n--- REDE ---');
console.log(`amigos na VIDA TODA (inclui falecidos/afastados): mediana ${med(amigosPorVida)} · p90 ${p90(amigosPorVida)} · máx ${Math.max(...amigosPorVida)}`);
console.log(`amigos ATIVOS ao fim: mediana ${med(amigosAtivosPorVida)} · p90 ${p90(amigosAtivosPorVida)} · máx ${Math.max(...amigosAtivosPorVida)}`);
console.log(`  vidas com 0 amigos ativos .... ${amigosAtivosPorVida.filter(n => n === 0).length}`);
console.log(`  vidas com 1-2 amigos ativos .. ${amigosAtivosPorVida.filter(n => n >= 1 && n <= 2).length}`);
console.log(`  vidas com 5+ amigos ativos ... ${amigosAtivosPorVida.filter(n => n >= 5).length}`);
console.log(`relações familiares ............ ${totalFamilia}`);
console.log(`relações NÃO familiares ........ ${totalNaoFamilia}`);
console.log(`  das quais parceiros .......... ${totalParceiros}`);

console.log('\n--- QUALIDADE DOS NPCs ---');
console.log(`NPCs sem nome / placeholder .... ${semNome}`);
console.log(`NPCs não-familiares sem origem . ${semOrigem}`);
console.log(`NPCs com profissão adulta <18 .. ${incoerenteIdade}`);
console.log(`NPCs tipo 'pet' com profissão .. ${tipoPetIndevido}`);
console.log(`proximidade inicial registrada . ${proximidadeInicial.length ? med(proximidadeInicial) : 'n/a (não observável no estado final)'}`);

console.log('\n--- MEMÓRIAS DE AMIZADE ---');
console.log(`memórias com tema 'amizade' .... ${memoriasAmizade}`);

console.log('\n--- TIPOS PRESENTES ---');
[...tiposVistos.entries()].sort((a, b) => b[1] - a[1])
  .forEach(([t, n]) => console.log(`  ${t.padEnd(12)} ${n}`));

console.log('\n--- ORIGEM DAS RELAÇÕES NÃO FAMILIARES ---');
[...origensVistas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([o, n]) => console.log(`  ${o.padEnd(34)} ${n}`));
