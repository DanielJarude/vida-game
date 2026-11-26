/**
 * VIDA 37 · e-sports: quem monta uma organização forte e com que frequência ela vence.
 *
 * Para cada vida (semente) e cada jogo, funda uma organização com o investimento que o jogador escolher
 * (INVEST=0|1|2 → mínimo, médio, máximo) e deixa o ano andar; conta por temporada o título da liga, o título
 * internacional principal (`mundial`) e os troféus gravados.
 *
 *   npx esbuild scripts/sim/esports37.ts --bundle --platform=node --outfile=<scratch>/e37.cjs && VIDAS=20 ANOS=10 node <scratch>/e37.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { JOGOS25, LISTA_JOGOS25 } from '../../src/motor/v25/esports/jogos25';
import { regioesDoJogo33 } from '../../src/motor/v31/esports/circuitos33';
import { anoDe } from '../../src/motor/tempo';
import type { Vida } from '../../src/motor/tipos';

const VIDAS = Number(process.env.VIDAS ?? 12);
const ANOS = Number(process.env.ANOS ?? 10);
const NIVEL = Number(process.env.INVEST ?? 2);
const INVESTIMENTO = [2e5, 2e6, 2e7][NIVEL];

async function main() {
  await carregarMundo();
  const agg = { temporadas: 0, titulosLiga: 0, mundiais: 0, trofeus: 0, topo3: 0, orgs: 0 };
  const porJogo: Record<string, { t: number; liga: number; mundial: number; trofeus: number }> = {};
  for (let s = 1; s <= VIDAS; s++) {
    for (const jid of LISTA_JOGOS25) {
      let v: Vida = adulto(30, { semente: 3700 + s, genero: s % 2 ? 'masculino' : 'feminino', municipioId: 'campinas-sp' });
      v.financas.conta = 2e10;
      const ano0 = anoDe(v.t);
      if (JOGOS25[jid].lancado > ano0) continue;
      const reg = regioesDoJogo33(jid, ano0);
      if (!reg.length) continue;
      const regiao = reg.find(r => r.id === 'br' || r.id === 'sa')?.id ?? reg[0].id;
      const a: Acao = { tipo: 'org31', oque: { op: 'fundar', nome: `Teste ${s} Esports`, jogo: jid, regiao, modo: 'elite', investimento: INVESTIMENTO } } as Acao;
      if (!podeTentar(disponibilidade(v, a))) continue;
      v = executar(v, a).vida;
      agg.orgs++;
      const L0 = v.orgEsports31!.linhas[0];
      const trofeus0 = L0.trofeus.length;
      void trofeus0;
      for (let y = 0; y < ANOS; y++) {
        const r = avancarAno(v);
        v = r.vida;
        if (v.morte) break;
      }
      const L = v.orgEsports31?.linhas[0];
      if (!L) continue;
      const hist = L.historico;
      const p = (porJogo[jid] ??= { t: 0, liga: 0, mundial: 0, trofeus: 0 });
      for (const h of hist) {
        agg.temporadas++; p.t++;
        if (h.titulo) { agg.titulosLiga++; p.liga++; }
        if (h.internacionais?.some(i => i.titulo)) { agg.mundiais++; p.mundial++; }
        if (h.posicao <= 3) agg.topo3++;
      }
      agg.trofeus += L.trofeus.length; p.trofeus += L.trofeus.length;
    }
  }
  const pct = (a: number, b: number) => (b ? (100 * a / b).toFixed(1) : '0') + '%';
  console.log(`INVEST=${NIVEL} (${INVESTIMENTO}) vidas=${VIDAS} anos=${ANOS} orgs=${agg.orgs} temporadas=${agg.temporadas}`);
  console.log(`título de liga ${pct(agg.titulosLiga, agg.temporadas)} · mundial/internacional principal ${pct(agg.mundiais, agg.temporadas)} · top 3 ${pct(agg.topo3, agg.temporadas)} · troféus/org ${(agg.trofeus / Math.max(1, agg.orgs)).toFixed(1)}`);
  for (const [j, p] of Object.entries(porJogo)) console.log(`  ${j}: temporadas ${p.t} · liga ${pct(p.liga, p.t)} · mundial ${pct(p.mundial, p.t)} · troféus ${p.trofeus}`);
}

main();
