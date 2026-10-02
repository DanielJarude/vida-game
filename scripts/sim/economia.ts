/**
 * Simulação da contabilidade (A1, playtest: "dinheiro desaparecendo").
 *
 *   npx esbuild scripts/sim/economia.ts --bundle --platform=node --outfile=/tmp/eco.cjs
 *   VIDAS=60 node /tmp/eco.cjs
 *
 * Três populações, sempre pelo que o jogador pode fazer (`disponibilidade` →
 * `executar`) e pelo ano do motor (`avancarAno`):
 *
 *   N natural   — vidas inteiras (do nascimento aos 70) com as estratégias
 *                 do simulador geral (perfis que poupam, gastam, aplicam);
 *   B bem pago  — adultos de 30 com carteira de R$ 25–60 mil brutos e
 *                 R$ 0 a R$ 12 milhões aplicados, por 30 anos (o cenário do
 *                 playtest: muito mais entra do que sai);
 *   T tenistas  — profissionais do circuito com aplicações, por 12 anos (o
 *                 caso real do playtest: a premiação entrava, o circuito saía
 *                 fora do orçamento, a conta parava em zero).
 *
 * Para cada ano fechado: o extrato concilia (saldo inicial + linhas = saldo
 * final, na conta e nas aplicações)? Há linha de 'ajuste'? E o sintoma do
 * playtest: a tela mostrava sobra no mês e a conta terminou o ano em zero —
 * quando acontece, qual linha explica.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { ExtratoDoAno, TipoMovimento, Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { orcamento } from '../../src/motor/sistemas/dinheiro';
import { depositar, totalAplicado } from '../../src/motor/sistemas/investimentos';
import { conciliar, somasDoExtrato } from '../../src/motor/sistemas/extrato';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { estrategia } from './estrategias';

const N = Number(process.env.VIDAS ?? 40);
const SO = (process.env.SO ?? 'N,B,T').split(',');
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'antissocial', 'economico', 'gastador', 'ascensao'];
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const fmt = (x: number) => `R$ ${Math.round(x).toLocaleString('pt-BR')}`;
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

interface Placar {
  anos: number;
  naoConcilia: number;
  ajustes: number;
  maiorDiferenca: number;
  /** A tela mostrava sobra (> R$ 1.000/mês) e a conta terminou o ano em zero (ou menos). */
  zeroComSobra: number;
  /** Desses, quantos têm a explicação no extrato (uma linha que leva ao menos a sobra prometida). */
  zeroExplicado: number;
  motivos: Map<string, number>;
  /** Anos com sobra vista: Σ (sobra × 12) e Σ do que a conta + aplicações andaram. */
  sobraVista: number;
  andou: number;
  porTipo: Map<TipoMovimento, number>;
}
const placar = (): Placar => ({ anos: 0, naoConcilia: 0, ajustes: 0, maiorDiferenca: 0, zeroComSobra: 0, zeroExplicado: 0, motivos: new Map(), sobraVista: 0, andou: 0, porTipo: new Map() });

/** Confere o ano que acabou de fechar. `sobra` é o que a tela mostrava antes do ano (por mês). */
function conferirAno(p: Placar, v: Vida, sobra: number): void {
  const e: ExtratoDoAno | undefined = v.financas.extrato;
  if (!e || e.contaFinal === undefined) return;
  p.anos++;
  const c = conciliar(e);
  if (!c.ok) p.naoConcilia++;
  p.ajustes += c.ajustes.length;
  p.maiorDiferenca = Math.max(p.maiorDiferenca, Math.abs(c.diferencaConta), Math.abs(c.diferencaAplicado));
  for (const [t, s] of Object.entries(somasDoExtrato(e))) p.porTipo.set(t as TipoMovimento, (p.porTipo.get(t as TipoMovimento) ?? 0) + s.conta);
  if (sobra > 1000) {
    p.sobraVista += sobra * 12;
    p.andou += (e.contaFinal - e.contaInicial) + ((e.aplicadoFinal ?? 0) - e.aplicadoInicial);
    if (e.contaFinal <= 0) {
      p.zeroComSobra++;
      // A linha que mais tirou da conta (fora o mês a mês, que a tela já mostrava).
      const maior = [...e.linhas].filter(l => l.tipo !== 'despesa' && l.tipo !== 'renda').sort((a, b) => a.conta - b.conta)[0];
      const despesasNovas = e.linhas.filter(l => l.tipo === 'despesa' || l.tipo === 'renda').reduce((s, l) => s + l.conta, 0) < sobra * 12 * 0.5;
      const rotulo = despesasNovas ? 'o mês a mês do ano foi pior que o da tela (a temporada rendeu menos, o emprego, a casa ou os filhos mudaram)' : maior ? `${maior.tipo}: ${maior.rotulo}` : '—';
      p.motivos.set(rotulo, (p.motivos.get(rotulo) ?? 0) + 1);
      if (despesasNovas || (maior && -maior.conta >= Math.min(sobra * 12, e.contaInicial + sobra * 12) * 0.5)) p.zeroExplicado++;
    }
  }
}

function imprimir(nome: string, p: Placar): void {
  console.log(`\n## ${nome}`);
  console.log(`anos fechados: ${p.anos} · não conciliam: ${p.naoConcilia} · linhas de ajuste: ${p.ajustes} · maior diferença: ${fmt(p.maiorDiferenca)}`);
  console.log(`anos com sobra vista > R$ 1.000/mês que terminaram com a conta em zero: ${p.zeroComSobra} (explicados por uma linha do extrato: ${p.zeroExplicado})`);
  for (const [m, n] of [...p.motivos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`   ${n}× ${m}`);
  console.log(`nos anos com sobra vista: a tela prometia ${fmt(p.sobraVista)}; conta + aplicações andaram ${fmt(p.andou)} (${p.sobraVista ? Math.round(p.andou / p.sobraVista * 100) : 0}% — a diferença são rendimentos, inflação, acontecimentos e escolhas, todos com linha)`);
  console.log(`movimento na conta por tipo (soma de todos os anos): ${[...p.porTipo.entries()].map(([t, s]) => `${t} ${fmt(s)}`).join(' · ')}`);
}

function viverAno(v: Vida, r: Rng, e: ReturnType<typeof estrategia>, p: Placar, acoes = true): Vida {
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
  if (acoes) for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
  const sobra = idade(v) >= 18 ? orcamento(v).sobra : 0;
  v = avancarAno(v).vida;
  responder();
  conferirAno(p, v, sobra);
  return v;
}

/* ============================================================ N. Natural */

if (SO.includes('N')) {
  const p = placar();
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 7);
    const e = estrategia(PERFIS[s % PERFIS.length]);
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 52000 + s });
    while (!v.morte && idade(v) < 70) v = viverAno(v, r, e, p);
  }
  imprimir(`N · natural (${N} vidas, do nascimento aos 70, ${PERFIS.length} perfis)`, p);
}

/* ============================================================ B. Bem pago */

if (SO.includes('B')) {
  const p = placar();
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 11);
    const e = estrategia(['antissocial', 'ambicioso', 'social', 'economico'][s % 4]);
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 61000 + s });
    while (!v.morte && idade(v) < 30) v = viverAno(v, r, e, placar());
    if (v.morte) continue;
    const aplicado = [0, 200_000, 1_000_000, 3_000_000, 12_000_000][s % 5];
    v = transacao(v, (x, rx) => {
      contratar(x, rx, ocupacao('assistente_adm'));
      x.trabalho.atual!.salario = 25000 + (s % 8) * 5000;
      x.financas.dividas = [];
      if (aplicado) depositar(x, 'pos_fixado', aplicado);
      x.momento = null;
    }).vida;
    for (let k = 0; k < 30 && !v.morte; k++) v = viverAno(v, r, e, p);
  }
  imprimir(`B · bem pago (${N} vidas dos 30 aos 60: R$ 25–60 mil brutos, R$ 0–12 mi aplicados)`, p);
}

/* ============================================================ T. Tenistas */

if (SO.includes('T')) {
  const p = placar();
  for (let s = 1; s <= Math.max(10, Math.round(N / 2)); s++) {
    const r = criarRng(s * 13);
    const e = estrategia('passivo');
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 73000 + s });
    while (!v.morte && idade(v) < 20) v = viverAno(v, r, e, placar());
    if (v.morte) continue;
    v = transacao(v, x => {
      garantirFrente(x, 'tenis');
      const h = 84 + (s % 4) * 4;
      Object.assign(x.caminhos.frentes.tenis!, { habilidade: h, interesse: 90, meses: 140, auge: h });
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
      entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis');
      profissionalizar(x, criarRng(s), 3 + (s % 2));
      x.momento = null; x.caminhos.pendente = undefined;
      depositar(x, 'pos_fixado', 300000); depositar(x, 'acoes', 200000);
    }).vida;
    for (let k = 0; k < 12 && !v.morte; k++) v = viverAno(v, r, e, p, false);
  }
  imprimir(`T · tenistas (profissionais do circuito com R$ 500 mil aplicados, 12 anos)`, p);
  void totalAplicado; void quantil;
}
