/* Sim da frente Presidência (VIDA 12.9): N vidas políticas disputam a Presidência pelo fluxo real (as decisões da
 * campanha escolhidas ao acaso, a apuração pelo motor, o segundo turno pela decisão), e os eleitos governam um mandato
 * inteiro com ações ao acaso. Imprime a taxa de vitória por trajetória e o que acontece no governo. */
import { carregarMundo } from '../r129/src/motor/mundo/carregar';
import { criarVida } from '../r129/src/motor/criacao';
import { avancarAno } from '../r129/src/motor/ano';
import { executar, disponibilidade, type Acao } from '../r129/src/motor/acoes';
import { criarRng } from '../r129/src/motor/rng';
import { definirPaisCorrente } from '../r129/src/motor/mundo/moeda';
import type { CargoEletivo, Vida } from '../r129/src/motor/tipos';
import { acoesPoliticas, entrarNaPolitica, partidosDoPais, processarPolitica, registrarCandidatura, tDaEleicao } from '../r129/src/motor/sistemas/politica';
import { forcaPresidencial, governoAtual, presidencia } from '../r129/src/motor/sistemas/presidencia129';
import { abrirDecisao, conteudoPorId } from '../r129/src/motor/conteudo/motor';
import { contexto } from '../r129/src/motor/conteudo/base';
import { REGRAS_PRESIDENCIAIS } from '../r129/src/motor/dados/presidencia129';
import { cidadesDoPais } from '../r129/src/motor/dados/lugares';

await carregarMundo();
let base = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 77 });
for (let k = 0; k < 30; k++) base = avancarAno(base).vida;
base.momento = null; base.fila = undefined;

type Tier = 'forte' | 'media' | 'fraca';
const PERFIL: Record<Tier, { rep: [number, number]; apoio: [number, number]; antes: CargoEletivo[][] }> = {
  forte: { rep: [78, 98], apoio: [62, 88], antes: [['governador'], ['senador', 'governador'], ['deputado_federal', 'senador']] },
  media: { rep: [58, 78], apoio: [45, 65], antes: [['deputado_federal'], ['prefeito'], ['senador']] },
  fraca: { rep: [38, 58], apoio: [28, 48], antes: [['deputado_estadual'], ['vereador'], []] }
};

function politico(pais: string, tier: Tier, s: number): Vida {
  const v = structuredClone(base);
  const rng = criarRng(1000 + s);
  const r = REGRAS_PRESIDENCIAIS[pais];
  const muni = pais === 'BR' ? 'sao-paulo-sp' : (cidadesDoPais(pais).find(m => m.perfil === 'metropole') ?? cidadesDoPais(pais)[0]).id;
  definirPaisCorrente(pais);
  v.id = `sim-${pais}-${tier}-${s}`; v.rng = 5000 + s * 31;
  v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = [pais];
  const ano = r.ciclo[0] + (pais === 'BR' ? 0 : 0);
  v.t = tDaEleicao(ano, pais) - 6; v.eu.tNasc = v.t - rng.int(42, 66) * 12;
  v.caminhos.politica = undefined; v.trabalho.atual = undefined; v.justica = undefined; v.momento = null; v.fila = undefined;
  delete v.fatos['chegou_cidade']; v.anoAtual = { acoes: [] };
  const p = entrarNaPolitica(v, 'comunidade');
  p.partido = rng.pick(partidosDoPais(pais)); p.tFiliacao = v.t - rng.int(48, 240); p.partidos = [{ sigla: p.partido, tInicio: p.tFiliacao }];
  p.fase = 'entre_mandatos';
  const P = PERFIL[tier];
  p.reputacao = rng.int(...P.rep); p.apoio = rng.int(...P.apoio); p.desgaste = rng.int(5, 35);
  for (const c of rng.pick(P.antes)) { p.historico.push({ t: v.t - 120, cargo: c, resultado: 'eleito', partido: p.partido }); p.historico.push({ t: v.t - 72, cargo: c, resultado: 'concluiu', partido: p.partido }); }
  v.fatos['pol_partido_porte'] = rng.int(0, 2);
  return v;
}

function decidirAoAcaso(v: Vida, rng: ReturnType<typeof criarRng>): Vida {
  for (let k = 0; k < 12 && v.momento; k++) {
    const livres = v.momento.opcoes.filter(o => !o.bloqueio && o.id !== 'desistir' && o.id !== 'renunciar');
    const op = livres.length ? rng.pick(livres) : v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

const stats: Record<string, { n: number; eleito: number; preterido: number; segundo: number; pct1: number[] }> = {};
const governo = { n: 0, aprov: [] as number[], reformasOk: 0, reformasNao: 0, impeachment: 0, afastado: 0, crises: 0, reeleitoPode: 0 };
const eleitos: Vida[] = [];
const PAISES = ['BR', 'BR', 'BR', 'US', 'AR', 'MX', 'CL', 'CO'];
const N = Number(process.argv[2] ?? 120);
for (let s = 0; s < N; s++) {
  const pais = PAISES[s % PAISES.length];
  const tier: Tier = (['forte', 'media', 'fraca'] as Tier[])[Math.floor(s / PAISES.length) % 3];
  let v = politico(pais, tier, s);
  const rng = criarRng(9000 + s);
  const r = REGRAS_PRESIDENCIAIS[pais];
  const ano = r.ciclo[0];
  v.fatos['pol_eleicao'] = v.t;
  abrirDecisao(v, conteudoPorId('pol_eleicao') as never, contexto(v, rng));
  v = executar(v, { tipo: 'decidir', opcaoId: 'cargo_presidente' }).vida;
  v = decidirAoAcaso(v, rng);
  const chave = `${tier}`;
  const st = (stats[chave] ??= { n: 0, eleito: 0, preterido: 0, segundo: 0, pct1: [] });
  const stp = (stats[`pais:${pais}`] ??= { n: 0, eleito: 0, preterido: 0, segundo: 0, pct1: [] });
  st.n++; stp.n++;
  if (!presidencia(v).campanha) { st.preterido++; stp.preterido++; continue; }
  definirPaisCorrente(pais);
  v.t = tDaEleicao(ano, pais) + 1; v.anoAtual = { acoes: [] };
  if (process.env.DEBUG) console.log(tier, pais, 'P', Math.round(forcaPresidencial(v)), 'adv', presidencia(v).campanha!.adversarios.map(a => Math.round(a.forca)).join(','));
  processarPolitica(v, criarRng(s));
  if (presidencia(v).campanha?.segundo) {
    st.segundo++; stp.segundo++;
    abrirDecisao(v, conteudoPorId('prest_segundo_turno') as never, contexto(v, rng));
    v = decidirAoAcaso(v, rng);
  }
  const c = presidencia(v).candidaturas[presidencia(v).candidaturas.length - 1];
  if (process.env.DEBUG) console.log(tier, pais, 'chance', (c as unknown as { chance?: number })?.chance, v.caminhos.politica!.historico.slice(-1)[0]?.fatores?.map(f => `${f.id}:${f.valor}`).join(' '));
  const meu = c?.primeiro?.find(x => x.voce)?.pct;
  if (meu !== undefined) { st.pct1.push(meu); stp.pct1.push(meu); }
  if (c?.resultado === 'eleito') { st.eleito++; stp.eleito++; eleitos.push(v); }
}

// O governo: um mandato inteiro, com até duas ações ao acaso por ano e as decisões que vierem.
for (const [k, v0] of eleitos.entries()) {
  let v = v0;
  const rng = criarRng(4000 + k);
  const posse = v.caminhos.politica!.posse!;
  v.t = posse.t + 1; v.anoAtual = { acoes: [] };
  definirPaisCorrente(v.eu.nacionalidades[0]);
  processarPolitica(v, criarRng(k));
  if (!governoAtual(v)) continue;
  governo.n++;
  const fim = v.caminhos.politica!.mandato!.tFim;
  while (v.t < fim - 12) {
    v.momento = null; v.fila = undefined;
    for (let j = 0; j < 2; j++) {
      const ac = acoesPoliticas(v, disponibilidade).filter(x => x.id.startsWith('pres_'));
      if (!ac.length) break;
      v = executar(v, rng.pick(ac).acao as Acao).vida;
      v = decidirAoAcaso(v, rng);
    }
    v.t += 12; v.anoAtual = { acoes: [] };
    const tinhaCrise = !!v.caminhos.politica!.mandato?.crise;
    processarPolitica(v, criarRng(k * 13 + v.t));
    if (!tinhaCrise && v.caminhos.politica!.mandato?.crise) governo.crises++;
    if (process.env.DEBUG2 && governoAtual(v)) { const g = governoAtual(v)!; console.log('ano', k, Math.round(v.caminhos.politica!.mandato!.aprovacao), g.base, g.escandalos, g.conflito, v.fatos['pol_risco'] !== undefined, g.inflacao, g.pib, g.desemprego); }
    if (v.caminhos.politica!.mandato?.crise) { const d = conteudoPorId(v.caminhos.politica!.mandato!.crise!.tipo.startsWith('pres_') ? 'presg_crise' : 'pol_crise'); if (d) { abrirDecisao(v, d as never, contexto(v, rng)); v = decidirAoAcaso(v, rng); } }
    if (v.fatos['pres_impeachment'] === v.t) { governo.impeachment++; abrirDecisao(v, conteudoPorId('presi_impeachment') as never, contexto(v, rng)); v = decidirAoAcaso(v, rng); }
    if (!governoAtual(v)) { if (presidencia(v).mandatos.some(m => m.como === 'afastado')) governo.afastado++; break; }
  }
  const g = governoAtual(v);
  if (g) {
    governo.aprov.push(Math.round(v.caminhos.politica!.mandato!.aprovacao));
    governo.reformasOk += g.reformas.filter(x => x.aprovada).length;
    governo.reformasNao += g.reformas.filter(x => !x.aprovada).length;
  }
}

const pctMed = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : 0);
console.log(`N=${N} vidas políticas disputando a Presidência (países ${[...new Set(PAISES)].join(', ')})`);
for (const [k, s] of Object.entries(stats)) console.log(`${k.padEnd(10)} n=${String(s.n).padStart(3)}  eleitos=${String(s.eleito).padStart(3)} (${Math.round(s.eleito / s.n * 100)}%)  perderam a indicação=${s.preterido}  foram ao 2º turno=${s.segundo}  1º turno médio=${pctMed(s.pct1)}%`);
const tot = Object.entries(stats).filter(([k]) => !k.startsWith('pais:')).reduce((a, [, s]) => ({ n: a.n + s.n, e: a.e + s.eleito }), { n: 0, e: 0 });
console.log(`TOTAL vitória: ${tot.e}/${tot.n} = ${Math.round(tot.e / tot.n * 100)}%`);
console.log(`Governo: ${governo.n} mandatos · aprovação no fim (média ${pctMed(governo.aprov)}%, min ${Math.min(...governo.aprov)}, max ${Math.max(...governo.aprov)}) · reformas aprovadas ${governo.reformasOk}, derrotadas ${governo.reformasNao} · crises ${governo.crises} · processos de afastamento ${governo.impeachment} · afastados ${governo.afastado}`);
