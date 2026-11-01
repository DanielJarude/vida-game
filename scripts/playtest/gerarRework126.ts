/**
 * VIDA 12.6 — saves para a auditoria visual (rework126.mjs): `r126-tatuada` (32 anos, várias tatuagens por região,
 * uma manga oriental, namoro, emprego com equipe, hobbies novos, uma viagem sozinha) e `r126-velha` (72 anos, tatuagens
 * de 45 anos, netos). OUT=<pasta>/saves.
 *   npx esbuild scripts/playtest/gerarRework126.ts --bundle --platform=node --format=esm --outfile=<s>/g.mjs && OUT=<dir> node <s>/g.mjs
 */
import { writeFileSync } from 'fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comParceiro, comFilho } from '../../src/motor/__tests__/cenarios';
import { executar, type Acao } from '../../src/motor/acoes';
import { transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { processarEquipe } from '../../src/motor/sistemas/equipe';
import { viagem126 } from '../../src/motor/sistemas/viagens126';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const OUT = process.env.OUT!;
const fazer = (v: Vida, a: Acao) => { const r = executar(v, a); return r.vida; };
let v = transacao(adulto(32, { semente: 1266, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 400_000; x.momento = null; }).vida;
const par = comParceiro(v, { estagio: 'namoro', anos: 2, genero: 'masculino' });
v = transacao(v, x => { contratar(x, criarRng(5), ocupacao('tecnico_publico')); processarEquipe(x); x.trabalho.reputacao = 66; viagem126(x, 'Lisboa', [], true, false); x.rotinas.push({ id: 'jardinagem', tInicio: x.t - 30, nivel: 2 }, { id: 'pintura', tInicio: x.t - 12, nivel: 1 }); }).vida;
for (const a of [
  { tipo: 'compor_tatuagens', modelo: 'manga_oriental', lado: 'd' },
  { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'pulso', lado: 'e', texto: par.p.nome, significado: { tipo: 'amor', pessoaId: par.p.id } },
  { tipo: 'tatuar', desenho: 'lustre', regiao: 'centro_peito' },
  { tipo: 'tatuar', desenho: 'borboleta', regiao: 'costelas', lado: 'e', cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'floresta', regiao: 'canela', lado: 'e' },
  { tipo: 'tatuar', desenho: 'tigre', regiao: 'costas_alta' },
  { tipo: 'tatuar', desenho: 'constelacao', regiao: 'pe', lado: 'd' }
] as Acao[]) v = fazer(v, a);
writeFileSync(`${OUT}/saves/vida-r126-tatuada.json`, JSON.stringify(v));
let w = transacao(adulto(26, { semente: 1267, genero: 'masculino' }), x => { x.financas.conta = 200_000; x.momento = null; }).vida;
for (const a of [{ tipo: 'tatuar', desenho: 'ancora', regiao: 'antebraco', lado: 'd' }, { tipo: 'tatuar', desenho: 'rosa_tradicional', regiao: 'biceps', lado: 'e' }, { tipo: 'tatuar', desenho: 'leao_realista', regiao: 'peitoral', lado: 'd' }] as Acao[]) w = fazer(w, a);
w = transacao(w, x => { x.t += 12 * 46; x.eu.visual.corCabelo = 'grisalho'; comFilho(x, 40); x.momento = null; }).vida;
writeFileSync(`${OUT}/saves/vida-r126-velha.json`, JSON.stringify(w));
console.log('ok', v.eu.tatuagens?.length, w.eu.tatuagens?.length);
