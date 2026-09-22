/**
 * F6 §25 — SIMULAÇÕES ADVERSARIAIS DA VIDA SOCIAL.
 *
 * Dez cenários escolhidos para atacar o sistema em pontos diferentes: quem
 * tem contexto de sobra, quem não tem nenhum, e quem muda de contexto no
 * meio da vida. O objetivo não é "todos ganham amigos" — é que cada cenário
 * produza um resultado COERENTE com o que aquela vida realmente oferece.
 *
 * Uso: npx tsx scripts/audit/adversariaisSociais.ts
 */

import { processarAnoSocial } from '../../src/systems/social/redeSocial';
import { ambientesDeConvivio, vinculosSociaisAtivos } from '../../src/systems/social/contextoSocial';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../src/systems/__tests__/fixtures';
import { criarCarreiraInicial } from '../../src/systems/careerSystem';
import { criarEducacaoInicial } from '../../src/systems/educationSystem';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../src/utils/random';
import type { FamilyMember } from '../../src/types';

interface Cenario {
  nome: string;
  de: number;
  ate: number;
  monta: (idade: number) => {
    educacao?: ReturnType<typeof criarEducacaoInicial>;
    carreira?: ReturnType<typeof criarCarreiraInicial>;
    atividadesDoAno?: string[];
  };
}

const escola = () => ({ ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' as const });
const medio = () => ({ ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'medio' as const });
const superior = () => ({ ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'superior' as const });
const comEmprego = () => ({ ...criarCarreiraInicial(), empregado: true });

const CENARIOS: Cenario[] = [
  { nome: 'A · criança de 8 na escola', de: 6, ate: 11, monta: () => ({ educacao: escola() }) },
  { nome: 'B · adolescente de 15', de: 12, ate: 17, monta: () => ({ educacao: medio() }) },
  { nome: 'C · 18 sem faculdade e sem emprego', de: 18, ate: 24, monta: () => ({}) },
  { nome: 'D · universitário', de: 18, ate: 23, monta: () => ({ educacao: superior() }) },
  { nome: 'E · adulto empregado', de: 25, ate: 40, monta: () => ({ carreira: comEmprego() }) },
  { nome: 'F · adulto desempregado', de: 25, ate: 40, monta: () => ({}) },
  {
    nome: 'G · adulto com hobby social', de: 25, ate: 40,
    monta: () => ({ atividadesDoAno: ['act_churrasco'] })
  },
  { nome: 'H · adulto sem nenhuma atividade', de: 25, ate: 40, monta: () => ({}) },
  {
    nome: 'I · muda de contexto (escola -> trabalho)', de: 12, ate: 35,
    monta: idade => (idade < 18 ? { educacao: medio() } : { carreira: comEmprego() })
  },
  { nome: 'J · socialmente isolado (0 ambientes)', de: 3, ate: 5, monta: () => ({}) }
];

/** LCG: reprodutível e variado (uma constante faria randomInt travar no mínimo). */
function fonte(semente: number) {
  let e = semente >>> 0;
  return () => {
    e = (Math.imul(e, 1664525) + 1013904223) >>> 0;
    return e / 4294967296;
  };
}

const AMIGO = (m: FamilyMember) => (m.tipo === 'amigo' || m.tipo === 'amiga') && m.ativo !== false;

console.log('='.repeat(84));
console.log('F6 · SIMULAÇÕES ADVERSARIAIS — 200 execuções por cenário');
console.log('='.repeat(84));
console.log(
  'cenário'.padEnd(42) + 'ambientes'.padEnd(12) + '% c/ amigo'.padEnd(12) + 'média vínculos'
);
console.log('-'.repeat(84));

for (const c of CENARIOS) {
  let comAmigo = 0;
  let somaVinculos = 0;
  let ambientesVistos = new Set<string>();
  const N = 200;

  for (let n = 0; n < N; n++) {
    definirFonteAleatoria(fonte(n * 7919 + 13));
    let familia: FamilyMember[] = [...criarFamiliaTeste()];

    for (let idade = c.de; idade <= c.ate; idade++) {
      const extras = c.monta(idade);
      const f = {
        personagem: criarPersonagemTeste({ idade }),
        educacao: extras.educacao ?? criarEducacaoInicial(),
        carreira: extras.carreira ?? criarCarreiraInicial(),
        familia,
        atividadesDoAno: extras.atividadesDoAno ?? []
      };
      for (const a of ambientesDeConvivio(f)) ambientesVistos.add(a);
      familia = processarAnoSocial(f, 2000 + idade).familiaAtualizada;
    }

    if (familia.some(AMIGO)) comAmigo++;
    somaVinculos += vinculosSociaisAtivos({
      personagem: criarPersonagemTeste({ idade: c.ate }),
      educacao: criarEducacaoInicial(),
      carreira: criarCarreiraInicial(),
      familia
    }).length;
  }
  resetarFonteAleatoria();

  const amb = ambientesVistos.size === 0 ? '(nenhum)' : String(ambientesVistos.size);
  console.log(
    c.nome.padEnd(42) +
      amb.padEnd(12) +
      `${((comAmigo / N) * 100).toFixed(1)}%`.padEnd(12) +
      (somaVinculos / N).toFixed(2)
  );
}

console.log('-'.repeat(84));
console.log('Leitura esperada: A/B/D/E/G com amizade frequente (há convívio real);');
console.log('C/F/H baixos mas não zero (vizinhança existe a partir dos 12);');
console.log('J em zero absoluto — sem ambiente, ninguém aparece, e isso está correto.');
