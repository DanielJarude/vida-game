/**
 * REWORK 10.5 · UX-21 — auditoria automática de textos: vidas ao acaso até os 80, cada título, texto e opção de decisão
 * e cada linha da biografia, contra padrões de erro (preposição sem contração, artigo errado, espaço e ponto duplos,
 * "undefined"). Imprime os achados distintos.
 *
 *   npx esbuild scripts/sim/textos105.ts --bundle --platform=node --outfile=<scratch>/t.cjs && N=40 node <scratch>/t.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { sortearNascimento } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
const N = Number(process.env.N ?? 40);
const PADROES: [string, RegExp][] = [
  ['de/em + artigo', /\b(de|em) (o|a|os|as) [a-zà-ú]/],
  ['artigo errado com teatro/esporte', /\bNa (teatro|futebol|basquete|vôlei)\b/],
  ['espaço duplo', /  /],
  ['ponto duplo', /\.\.(?!\.)/],
  ['undefined/NaN', /undefined|NaN|\[object/],
  ['vírgula antes de ponto', /,\./]
];
const achados: Record<string, string[]> = {};
for (let k = 0; k < N; k++) {
  let v: Vida = criarVida({ ...sortearNascimento(criarRng(77000 + k)), semente: 77000 + k } as Parameters<typeof criarVida>[0]);
  for (let a = 0; a < 80 && !v.morte; a++) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) {
      const m = v.momento;
      for (const t of [m.titulo, m.texto, ...m.opcoes.map(o => o.texto)]) for (const [nome, re] of PADROES) if (re.test(t)) (achados[nome] ??= []).push(t);
      v = executar(v, { tipo: 'decidir', opcaoId: (m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0]).id }).vida;
    }
    v.momento = null;
  }
  for (const e of v.biografia) for (const [nome, re] of PADROES) if (re.test(e.texto)) (achados[nome] ??= []).push(e.texto);
}
for (const [k, xs] of Object.entries(achados)) { const u = [...new Set(xs)]; console.log(`\n== ${k}: ${xs.length} (${u.length} distintos)`); for (const x of u.slice(0, 12)) console.log('  ·', x.slice(0, 200)); }
