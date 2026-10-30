/**
 * REWORK 12.3 · F1 — marcos únicos: vidas longas (com sucessão para um filho ou o cônjuge) contando, por pessoa, quantas
 * vezes cada marco de uma vez só apareceu na biografia ("A primeira palavra de X", o primeiro dia de aula, a formatura…).
 *
 *   npx esbuild scripts/sim/marcos123.ts --bundle --platform=node --format=esm --outfile=<scratch>/m.mjs && N=20 node <scratch>/m.mjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { continuarComo, sucessores } from '../../src/motor/sistemas/sucessao';
import type { Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

await carregarMundo();
const N = Number(process.env.N ?? 12);
const GERACOES = Number(process.env.GERACOES ?? 2);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
// Marcos de uma vez só por pessoa: o padrão casa o texto da biografia e captura o nome de quem viveu o marco.
const MARCOS: [string, RegExp][] = [
  ['primeira palavra (filho)', /^A primeira palavra de ([^ ]+(?: [^ ]+)?) foi/],
  ['primeira palavra (eu)', /^A primeira palavra foi/],
  ['primeiros passos (filho)', /primeiros passos de ([^ .,]+)/i],
  ['primeiro dia de aula (filho)', /primeiro dia de aula de ([^ .,]+)/i]
];
const repeticoes: Record<string, number> = {}, vistos: Record<string, number> = {};
const exemplos: string[] = [];
let anos = 0, sucessoes = 0;
const porOcorrencia: [number, number][] = [];

for (let k = 0; k < N; k++) {
  const ag = agente(k % 2 ? 'familiar' : 'social');
  const r = criarRng(12300 + k * 11);
  let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Marco', genero: k % 2 ? 'masculino' : 'feminino', municipioId: ['sao-paulo-sp', 'recife-pe', 'porto-alegre-rs'][k % 3], semente: 12300 + k * 11, classe: 'media' });
  // Por geração: nome do protagonista + nome da pessoa do marco (nomes podem repetir entre gerações).
  const contagem = new Map<string, number>();
  for (let g = 0; g < GERACOES; g++) {
    while (!v.morte && idade(v) < 75) {
      for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; }
      v = avancarAno(v).vida; anos++;
      for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
    }
    // Conta os marcos desta geração e das anteriores (a biografia continua na sucessão? só a desta).
    for (const e of v.biografia) for (const [nome, re] of MARCOS) {
      const m = re.exec(e.texto); if (!m) continue;
      const chave = `${nome}|${m[1] ?? v.eu.nome}|${(e.pessoas ?? []).join(',')}`;
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
    const nOc = v.ocorrencias.filter(o => o.id === 'fil_palavra').length, nFatos = Object.keys(v.fatos).filter(x => x.startsWith('palavra_')).length;
    porOcorrencia.push([nOc, nFatos]);
    if (g === GERACOES - 1) break;
    // Sucessão: um filho adulto (senão o mais velho).
    if (!v.morte) v = { ...v, morte: { t: v.t, causa: 'sim' } } as Vida;
    const s = sucessores(v).filter(x => x.pode);
    const h = s.find(x => x.idade >= 18) ?? s[0];
    if (!h) break;
    const res = continuarComo(v, h.pessoa.id);
    if (res.erro) break;
    v = res.vida; sucessoes++;
  }
  for (const [chave, n] of contagem) {
    const nome = chave.split('|')[0];
    vistos[nome] = (vistos[nome] ?? 0) + 1;
    if (n > 1) { repeticoes[nome] = (repeticoes[nome] ?? 0) + 1; if (exemplos.length < 12) exemplos.push(`vida ${k}: ${chave} ×${n}`); }
  }
}
console.log(`# Marcos únicos — ${N} vidas, ${GERACOES} gerações, ${anos} anos, ${sucessoes} sucessões\n`);
for (const [nome] of MARCOS) console.log(`- ${nome}: ${vistos[nome] ?? 0} pessoas, ${repeticoes[nome] ?? 0} com repetição`);
console.log('fil_palavra ocorrências × fatos por geração:', JSON.stringify(porOcorrencia));
if (exemplos.length) console.log('\n' + exemplos.join('\n'));
