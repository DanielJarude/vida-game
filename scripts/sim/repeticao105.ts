/**
 * REWORK 10.5 · EVT-05 — a repetição de acontecimentos numa carreira de atuação de 30–40 anos, e entre vidas
 * consecutivas. Cada "série" são três vidas seguidas de atores (dos 22 aos 62), como um jogador que joga três vidas
 * na mesma carreira: a 2ª lembra da 1ª, a 3ª das duas anteriores (`memoriaDeVidas`, quando o motor tem). O agente
 * responde às decisões ao acaso (não a primeira opção), faz testes de elenco e aceita propostas.
 *
 * Mede, por vida: as cenas de carreira vividas, quantas se repetiram (a mesma cena principal de novo), o máximo de
 * vezes de uma mesma cena; entre a 1ª e a 3ª vida, quantas cenas da 1ª voltaram; e quantos títulos de produção
 * apareceram repetidos no currículo. Rode também no commit-base (lá não há memória entre vidas):
 *
 *   npx esbuild scripts/sim/repeticao105.ts --bundle --platform=node --outfile=<scratch>/r.cjs && N=20 node <scratch>/r.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 20);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

function vidaDeAtor(semente: number, memoria: string[]): { cenas: string[]; titulos: string[]; decisoes: string[] } {
  const r = criarRng(semente * 7 + 1);
  let v = transacao(adulto(22, { semente }), x => {
    x.educacao.matricula = undefined; x.trabalho.atual = undefined;
    contratar(x, criarRng(semente), ocupacao('ator'), 'convite');
    x.caminhos.frentes.teatro = { interesse: 90, meses: 120, habilidade: 66 + (semente % 10), tInicio: x.t - 120, tUltimo: x.t, retomadas: 0, auge: 70 };
    if (memoria.length) (x as Vida & { memoriaDeVidas?: string[] }).memoriaDeVidas = memoria;
  }).vida;
  for (let ano = 0; ano < 40 && !v.morte; ano++) {
    for (const a of [{ tipo: 'perseguir', oque: 'audicao' }, { tipo: 'perseguir', oque: 'apresentar' }] as unknown as Acao[]) if (tenta(v, a)) v = executar(v, a).vida;
    for (const c of (v.caminhos.audiovisual?.contratos ?? []).filter(x => x.status === 'proposta')) {
      const a = { tipo: 'perseguir', oque: 'aceitar_contrato', valor: c.id } as unknown as Acao;
      if (tenta(v, a) && r.chance(0.7)) v = executar(v, a).vida;
    }
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
      const livres = v.momento.opcoes.filter(o => !o.bloqueio);
      v = executar(v, { tipo: 'decidir', opcaoId: r.pick(livres.length ? livres : v.momento.opcoes).id }).vida;
    }
    v = transacao(v, x => { x.momento = null; }).vida;
    if (!v.trabalho.atual) v = transacao(v, x => { contratar(x, criarRng(semente + ano), ocupacao('ator'), 'convite'); }).vida;
  }
  return { cenas: (v.caminhos.situacoes ?? []).map(x => x.id), titulos: (v.caminhos.curriculo ?? []).filter(x => !/^Comercial|Casamento/.test(x.titulo)).map(x => x.titulo), decisoes: v.ocorrencias.map(o => o.id) };
}

const conta = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };
const linhas: { cenas: number; repetidas: number; maxIgual: number; titulosRepetidos: number; daPrimeira: number }[][] = [[], [], []];
for (let k = 0; k < N; k++) {
  const vidas: ReturnType<typeof vidaDeAtor>[] = [];
  for (let n = 0; n < 3; n++) {
    const memoria = [...new Set(vidas.slice(-2).flatMap(x => [...x.cenas, ...x.decisoes]))].slice(-200);
    const x = vidaDeAtor(4000 + k * 10 + n, memoria);
    vidas.push(x);
    const c = conta(x.cenas);
    linhas[n].push({ cenas: x.cenas.length, repetidas: x.cenas.length - c.size, maxIgual: Math.max(0, ...c.values()), titulosRepetidos: x.titulos.length - new Set(x.titulos).size, daPrimeira: n ? x.cenas.filter(id => vidas[0].cenas.includes(id)).length / Math.max(1, x.cenas.length) : 0 });
  }
}
for (let n = 0; n < 3; n++) {
  const l = linhas[n];
  console.log(`vida ${n + 1}: cenas ${med(l.map(x => x.cenas))} · repetidas ${med(l.map(x => x.repetidas))} · a mesma cena no máximo ${med(l.map(x => x.maxIgual))}× (pior: ${Math.max(...l.map(x => x.maxIgual))}×) · títulos repetidos no currículo ${l.reduce((s, x) => s + x.titulosRepetidos, 0)} no total${n ? ` · ${Math.round(med(l.map(x => x.daPrimeira)) * 100)}% das cenas já vistas na 1ª vida` : ''}`);
}
