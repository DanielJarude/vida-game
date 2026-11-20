// VIDA 30 · §6 — balanceamento rural: cinco perfis de propriedade (chácara, sítio familiar, agrícola, pecuária, grande
// diversificada), em quem administra (o produtor que sabe pouco, o que sabe, o caseiro/gerente), por N anos e várias
// sementes; e os cenários de erro (gado demais no pasto, solo cansado, ano de seca) e de recuperação.
// Saída: resultado médio por ano, % de anos no vermelho, pior ano / valor da terra, o acumulado, e se a recuperação acontece.
// Uso: npx esbuild scripts/sim/fazenda30.ts --bundle --platform=node --format=esm --outfile=<x>.mjs && node <x>.mjs
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { novaPropriedade, povoar, viverAnoDaPropriedade, valorDaPropriedade, areaUtil, capacidadeUA, uaOcupadas } from '../../src/motor/v18/rural/fazenda18';
import type { Imovel, Vida } from '../../src/motor/tipos';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import type { PropriedadeRural18 } from '../../src/motor/v18/rural/fazenda18';

await carregarMundo();
const ANOS = Number(process.env.ANOS ?? 10);
const N = Number(process.env.N ?? 12);
const MUN = process.env.MUN ?? 'uberlandia-mg';

type Perfil = { nome: string; tipo: PropriedadeRural18['tipo']; ha: number; intensidade: number; extra?: (p: PropriedadeRural18) => void };
const PERFIS: Perfil[] = [
  { nome: 'chácara 4 ha', tipo: 'chacara', ha: 4, intensidade: 0.6 },
  { nome: 'sítio familiar 25 ha', tipo: 'sitio', ha: 25, intensidade: 0.6 },
  { nome: 'agrícola 300 ha', tipo: 'agricola', ha: 300, intensidade: 0.7 },
  { nome: 'pecuária 500 ha', tipo: 'pecuaria', ha: 500, intensidade: 0.6 },
  { nome: 'grande diversificada 1500 ha', tipo: 'agricola', ha: 1500, intensidade: 0.5, extra: p => { p.rebanhos.push({ especie: 'corte', cabecas: 600, genetica: 45, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }); } }
];
type Cenario = { nome: string; antes?: (p: PropriedadeRural18) => void };
const CENARIOS: Cenario[] = [
  { nome: 'normal' },
  { nome: 'gado demais (2×)', antes: p => { for (const rb of p.rebanhos) rb.cabecas *= 2; } },
  { nome: 'solo cansado (30)', antes: p => { p.solo = 30; } }
];
type Gestao = 'produtor_novato' | 'produtor_formado' | 'terceiro';
const GESTOES: Gestao[] = ['produtor_novato', 'produtor_formado', 'terceiro'];

function vidaBase(s: number, g: Gestao): Vida {
  let v = viverAte(nova({ semente: 3000 + s, genero: 'feminino', municipioId: MUN } as never), 32);
  let k = 0;
  while (v.morte) v = viverAte(nova({ semente: 9000 + s + ++k, genero: 'feminino', municipioId: MUN } as never), 32);
  v.momento = null;
  const f = v.caminhos.frentes as Record<string, { habilidade: number; interesse: number; auge: number; tUltimo: number }>;
  f.campo = { ...(f.campo ?? { interesse: 50, auge: 0, tUltimo: v.t }), habilidade: g === 'produtor_formado' ? 62 : 25 } as never;
  if (g !== 'terceiro') contratar(v, criarRng(s), ocupacao('produtor_rural'));
  else if (v.trabalho.atual?.ocupacaoId === 'produtor_rural') v.trabalho.atual = undefined;
  return v;
}

function correr(perf: Perfil, cen: Cenario, g: Gestao, s: number) {
  const v = vidaBase(s, g);
  const ano0 = Math.floor(v.t / 12) + 1;
  const r = criarRng(7000 + s);
  const p = novaPropriedade(v, r, perf.tipo, perf.ha, MUN, 'compra' as never);
  povoar(p, r, ano0, perf.intensidade);
  perf.extra?.(p);
  cen.antes?.(p);
  const im: Imovel = { id: `im${v.seq++}`, tipo: 'imovel', modeloId: 'sitio', nome: p.nome, valor: 0, precoPago: 0, tCompra: v.t, municipioId: MUN, estado: 70, bairro: 'na zona rural', historia: [], dono: 'eu', tManutencao: v.t, rural: p } as Imovel;
  v.financas.bens.push(im);
  const valor0 = valorDaPropriedade(p, ano0);
  const res: number[] = [];
  const solo0 = p.solo;
  const lot0 = uaOcupadas(p) / Math.max(1, capacidadeUA(p));
  for (let a = 0; a < ANOS; a++) {
    const reg = viverAnoDaPropriedade(v, p, im, p.ultimoAno + 1);
    if (reg) res.push(reg.resultado);
  }
  return { res, valor0, solo0, solo: p.solo, lot0, lot: uaOcupadas(p) / Math.max(1, capacidadeUA(p)), util: areaUtil(p) };
}

const out: string[] = [];
for (const perf of PERFIS) for (const cen of CENARIOS) for (const g of GESTOES) {
  if (cen.nome.startsWith('gado') && !['pecuária 500 ha', 'grande diversificada 1500 ha', 'sítio familiar 25 ha'].includes(perf.nome)) continue;
  const runs = Array.from({ length: N }, (_, s) => correr(perf, cen, g, s));
  const todos = runs.flatMap(x => x.res);
  const neg = todos.filter(x => x < 0).length / Math.max(1, todos.length);
  const media = todos.reduce((a, b) => a + b, 0) / Math.max(1, todos.length);
  const pior = Math.min(...todos);
  const valor0 = runs[0].valor0;
  const acum = runs.map(x => x.res.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
  const prim3 = runs.flatMap(x => x.res.slice(0, 3));
  const prim3neg = prim3.filter(x => x < 0).length / Math.max(1, prim3.length);
  const ult3 = runs.flatMap(x => x.res.slice(-3)).reduce((a, b) => a + b, 0) / Math.max(1, N * 3);
  const r1 = runs.flatMap(x => x.res.slice(0, 3)).reduce((a, b) => a + b, 0) / Math.max(1, N * 3);
  out.push(`${perf.nome.padEnd(28)} ${cen.nome.padEnd(18)} ${g.padEnd(17)} média/ano ${Math.round(media).toLocaleString('pt-BR').padStart(12)} | vermelho ${(neg * 100).toFixed(0).padStart(3)}% (1º-3º ano ${(prim3neg * 100).toFixed(0).padStart(3)}%) | pior ${Math.round(pior).toLocaleString('pt-BR').padStart(12)} (${(pior / valor0 * 100).toFixed(1)}% da terra) | acum mediana ${Math.round(acum[Math.floor(N / 2)]).toLocaleString('pt-BR').padStart(13)} | 1-3: ${Math.round(r1).toLocaleString('pt-BR')} → últ3: ${Math.round(ult3).toLocaleString('pt-BR')} | solo ${runs[0].solo0}→${Math.round(runs[0].solo)} lot ${runs[0].lot0.toFixed(2)}→${runs[0].lot.toFixed(2)} | terra ${Math.round(valor0).toLocaleString('pt-BR')}`);
}
console.log(out.join('\n'));
