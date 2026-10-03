/**
 * Simulação de REPETIÇÃO da Linha da Vida (REWORK 4). Vidas inteiras, do nascimento até IDADE, em vários países e
 * com estratégias diferentes; mede frases idênticas, moldes, acontecimentos ubíquos, roteiro da infância e vidas
 * parecidas (`repeticao/analise.ts`). Pronta para escalar à simulação de ~1.000 vidas (VIDAS=1000).
 *
 *   npx esbuild scripts/sim/repeticao.ts --bundle --platform=node --outfile=<scratch>/rep.cjs && node <scratch>/rep.cjs
 *   VIDAS=60 IDADE=40 PAISES=BR,US,JP,NG OUT=<pasta> node <scratch>/rep.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { idadeEm } from '../../src/motor/tempo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { estrategia } from './estrategias';

const NOMES = ['passivo', 'familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'antissocial', 'economico', 'gastador'];
import { analisar, emMarkdown, type VidaAuditada } from './repeticao/analise';
import * as fs from 'node:fs';

const N = Number(process.env.VIDAS ?? 24);
const IDADE = Number(process.env.IDADE ?? 30);
const PAISES = (process.env.PAISES ?? 'BR,US,JP,NG,ES,AU').split(',');
const OUT = process.env.OUT;

export function viverParaAuditoria(s: number, pais: string, idadeFinal: number): VidaAuditada {
  const rr = criarRng(77000 + s * 7919 + pais.charCodeAt(0));
  const m = sortearMunicipio(() => rr.next(), pais);
  const genero = s % 2 ? 'feminino' : 'masculino';
  let v = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente: 500000 + s * 104729 });
  const e = estrategia(NOMES[s % NOMES.length]);
  const r = criarRng(s * 31 + 7);
  for (let k = 0; k < idadeFinal && !v.morte; k++) {
    for (const a of e.agir(v, r)) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
  }
  return {
    id: `${pais}-${s}`,
    bio: v.biografia.filter(b => b.relevancia !== 'tecnico').map(b => ({ idade: b.idade, texto: b.texto })),
    ocorrencias: v.ocorrencias.map(o => ({ idade: idadeEm(v.eu.tNasc, o.t), id: o.id }))
  };
}

async function principal() {
  await carregarMundo();
  const vidas: VidaAuditada[] = [];
  for (let s = 1; s <= N; s++) vidas.push(viverParaAuditoria(s, PAISES[s % PAISES.length], IDADE));
  const rel = analisar(vidas);
  const md = emMarkdown(rel);
  if (OUT) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(`${OUT}/repeticao.md`, md); fs.writeFileSync(`${OUT}/repeticao.json`, JSON.stringify(rel, null, 2)); }
  console.log(md);
}
if (require.main === module) void principal();
