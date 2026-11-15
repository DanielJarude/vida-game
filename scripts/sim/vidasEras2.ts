// ERAS v2 — vidas inteiras jogadas pelas estratégias do simulador (ações + decisões), por coorte de nascimento.
// Mede o que a economia da época faz com a vida: emprego, salário, sobra, dívida, faixa econômica, e se o extrato concilia.
// Uso: npx esbuild scripts/sim/vidasEras2.ts --bundle --platform=node --format=esm --outfile=X.mjs && VIDAS=18 node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { orcamento, condicaoEconomica } from '../../src/motor/sistemas/dinheiro';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { anoDe } from '../../src/motor/tempo';
import { estrategia } from './estrategias';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 18);
const IDADE_FIM = Number(process.env.ATE ?? 50);
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'economico', 'gastador', 'ascensao', 'antissocial'];
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr', 'uberlandia-mg'];
const COORTES = (process.env.COORTES ?? '1982,1992,2002,hoje').split(',');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

for (const c of COORTES) {
  const ano = c === 'hoje' ? undefined : Number(c);
  const marcos = [20, 30, 40, 50].filter(x => x <= IDADE_FIM);
  const d: Record<number, { emprego: number; sal: number[]; sobra: number[]; divida: number; faixa: Record<string, number>; n: number }> = {};
  for (const m of marcos) d[m] = { emprego: 0, sal: [], sobra: [], divida: 0, faixa: {}, n: 0 };
  let naoConcilia = 0, mortes = 0, crashes = 0;
  for (let s = 1; s <= N; s++) {
    const r: Rng = criarRng(s * 7 + (ano ?? 0));
    const e = estrategia(PERFIS[s % PERFIS.length]);
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 52000 + s, ...(ano ? { ano, era: true } : {}) } as never);
    try {
      while (!v.morte && idade(v) < IDADE_FIM) {
        const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
        for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
        v = avancarAno(v).vida; responder();
        entrarNaVida(v);
        const ex = v.financas.extrato;
        if (ex && !conciliar(ex).ok) naoConcilia++;
        const i = idade(v);
        if (d[i]) {
          const x = d[i]; x.n++;
          if (v.trabalho.atual) { x.emprego++; x.sal.push(v.trabalho.atual.salario); }
          x.sobra.push(orcamento(v).sobra);
          if (v.financas.dividas.some(q => q.saldo > 0 && (q.atraso ?? 0) >= 3)) x.divida++;
          const f = condicaoEconomica(v).faixa; x.faixa[f] = (x.faixa[f] ?? 0) + 1;
        }
      }
      if (v.morte) mortes++;
    } catch (err) { crashes++; console.log(`  CRASH ${c} #${s} ${anoDe(v.t)}: ${(err as Error).message}`); }
  }
  console.log(`\n## Coorte ${c} (${N} vidas) · mortes antes dos ${IDADE_FIM}: ${mortes} · extrato que não concilia: ${naoConcilia} · crashes: ${crashes}`);
  for (const m of marcos) {
    const x = d[m];
    console.log(`  aos ${m}: n=${x.n} emprego ${Math.round(x.emprego / Math.max(1, x.n) * 100)}% · salário mediano ${med(x.sal)} · sobra mediana ${Math.round(med(x.sobra))} · dívida atrasada ${x.divida} · ${Object.entries(x.faixa).map(([a, b]) => `${a}:${b}`).join(' ')}`);
  }
}
