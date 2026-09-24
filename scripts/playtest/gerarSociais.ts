/**
 * Gera saves de momentos sociais para o playtest visual (`social.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarSociais.ts --bundle --platform=node --outfile=/tmp/gs.cjs && SP=/tmp/vida-social node /tmp/gs.cjs
 *
 * Vive vidas com a estratégia "familiar" e guarda: uma criança com família
 * grande, um adulto com parceria e filhos pequenos, a despedida aberta de
 * uma viuvez, e um avô/avó com netos.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { estrategia } from '../sim/estrategias';

const SP = process.env.SP ?? '/tmp/vida-social';
mkdirSync(SP, { recursive: true });
const achados: Record<string, Vida> = {};

for (let semente = 1; semente < 300 && Object.keys(achados).length < 4; semente++) {
  const est = estrategia('familiar');
  const r = criarRng(semente * 3);
  let v = criarVida({ nome: 'Samuel', sobrenome: 'Sales', genero: semente % 2 ? 'masculino' : 'feminino', municipioId: 'recife-pe', semente, classe: 'trabalhadora' });
  while (!v.morte && idade(v) < 90) {
    for (const a of est.agir(v, r)) { v = executar(v, a).vida; if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida; }
    v = avancarAno(v).vida;
    const i = idade(v);
    const filhos = vinculosVivos(v).filter(x => x.vin.parentesco === 'filho');
    const familia = vinculosVivos(v).filter(x => x.vin.parentesco).length;
    if (!achados.crianca && i === 7 && familia >= 9 && !v.momento) achados.crianca = structuredClone(v);
    if (!achados.adulto && i >= 36 && i <= 44 && parceiro(v) && filhos.length >= 2 && filhos.some(f => (v.t - f.p.tNasc) / 12 < 6) && !v.momento) achados.adulto = structuredClone(v);
    if (!achados.despedida && v.momento?.situacaoId === 'luto_despedida' && Object.values(v.vinculos).some(x => x.romance?.fim === 'morte' && v.t - (v.pessoas[x.pessoaId].tMorte ?? 0) < 12)) achados.despedida = structuredClone(v);
    if (!achados.avo && Object.values(v.vinculos).filter(x => x.parentesco === 'neto').length >= 2 && i >= 60 && !v.momento) achados.avo = structuredClone(v);
    if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida;
  }
}
for (const [k, v] of Object.entries(achados)) {
  writeFileSync(`${SP}/save-${k}.json`, JSON.stringify(v));
  console.log(k, idade(v), v.eu.nome);
}
