// ERAS v3 — vidas históricas em vários países e coortes, jogadas pelas estratégias do simulador.
// Mede: crashes, extrato que não concilia, mortes (idade), emprego e salário, moeda mostrada, textos da época, anacronismos.
// Uso: npx esbuild scripts/sim/erasV3.ts --bundle --platform=node --format=esm --outfile=X.mjs && PAISES=US,BR COORTES=1905,1935 VIDAS=6 node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { orcamento } from '../../src/motor/sistemas/dinheiro';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { formatarDinheiro } from '../../src/motor/mundo/moeda';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { anoDe } from '../../src/motor/tempo';
import { anacronismosNoTexto } from '../../src/motor/eras/base/anacronismos';
import { meioDeComunicacao } from '../../src/motor/eras/base/contexto';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 6);
const ATE = Number(process.env.ATE ?? 85);
const PAISES = (process.env.PAISES ?? 'US,GB,JP,DE,AR,BR').split(',');
const COORTES = (process.env.COORTES ?? '1905,1925,1945,1965').split(',').map(Number);
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'economico', 'gastador', 'ascensao'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const saida: string[] = [];
const log = (s: string) => { console.log(s); saida.push(s); };
const anacr = new Map<string, number>();

for (const pais of PAISES) {
  const cidades = cidadesDoPais(pais);
  for (const ano of COORTES) {
    if (pais === 'AR' && ano < 1945) continue;
    let crashes = 0, naoConcilia = 0, eraTextos = 0, total = 0;
    const mortes: number[] = [], sal30: number[] = [], emprego30: number[] = [], sobra30: number[] = [], aluguel30: number[] = [];
    let atrasada = 0, anosVividos = 0;
    const moedas = new Set<string>(), meios = new Set<string>();
    let exemplo = '';
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 31 + ano);
      const e = estrategia(PERFIS[s % PERFIS.length]);
      const cid = cidades[s % cidades.length];
      let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: cid.id, semente: 77000 + s * 13 + ano, ano, era: true } as never);
      if (!v.era) { log(`  !! ${pais} ${ano}: vida sem era`); continue; }
      try {
        while (!v.morte && idade(v) < ATE) {
          const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
          for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
          v = avancarAno(v).vida; responder();
          entrarNaVida(v);
          if (anoDe(v.t) <= 2025) { moedas.add(formatarDinheiro(1000).split(' ')[0].replace(/[0-9$:.,]+.*/, '') || formatarDinheiro(1000)); meios.add(`${anoDe(v.t)}:${meioDeComunicacao(v)}`); }
          const ex = v.financas.extrato;
          if (ex && !conciliar(ex).ok) naoConcilia++;
          anosVividos++;
          if (v.financas.dividas.some(q => q.saldo > 0 && (q.atraso ?? 0) >= 3)) atrasada++;
          if (idade(v) === 30) { emprego30.push(v.trabalho.atual ? 1 : 0); if (v.trabalho.atual) sal30.push(v.trabalho.atual.salario); const o = orcamento(v); sobra30.push(Math.round(o.sobra)); }
        }
        if (v.morte) mortes.push(idade(v));
        if (process.env.MOSTRAR && s === 1) for (const b of v.biografia) if (b.fato?.tipo === 'era' || b.relevancia === 'marco') log(`   [${anoDe(b.t)} · ${b.idade}] ${b.texto}`);
        for (const b of v.biografia) {
          total++;
          if (b.fato?.tipo === 'era') { eraTextos++; if (!exemplo && String(b.fato.dados.evento).includes(':')) exemplo = `${anoDe(b.t)}: ${b.texto.slice(0, 160)}`; }
          const ab = anoDe(b.t);
          if (ab <= 2025) for (const x of anacronismosNoTexto(b.texto, ab, pais)) { const k = `${x} @${ab} "${b.texto.slice(0, 90)}"`; anacr.set(k, (anacr.get(k) ?? 0) + 1); }
        }
      } catch (err) { crashes++; log(`  CRASH ${pais} ${ano} #${s} em ${anoDe(v.t)}: ${(err as Error).stack?.split('\n').slice(0, 3).join(' | ')}`); }
    }
    const meiosPorDecada = [...new Set([...meios].map(x => `${Math.floor(Number(x.split(':')[0]) / 10) * 10}:${x.split(':')[1]}`))].join(' ');
    log(`## ${pais} ${ano}: crashes ${crashes} · não concilia ${naoConcilia} · mortes ${mortes.length}/${N} (idades ${mortes.sort((a, b) => a - b).join(',')}) · emprego aos 30 ${emprego30.filter(Boolean).length}/${emprego30.length} · salário mediano aos 30 ${med(sal30)} · textos da época ${eraTextos}/${total} · sobra mediana aos 30 ${med(sobra30)} · anos com dívida atrasada ${Math.round(atrasada / Math.max(1, anosVividos) * 100)}%`);
    log(`   moedas vistas: ${[...moedas].join(' ')} · aparelhos: ${meiosPorDecada}`);
    if (exemplo) log(`   ex.: ${exemplo}`);
  }
}
log(`\nAnacronismos (${anacr.size}):`);
for (const [k, n] of [...anacr].sort((a, b) => b[1] - a[1]).slice(0, 40)) log(`  ${n}× ${k}`);
if (process.env.SAIDA) writeFileSync(process.env.SAIDA, saida.join('\n'));
