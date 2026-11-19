// ERAS v4 — a sociedade que pesa e o mundo que muda. Três partes (MODO=A|B|C, padrão todas):
//  A · vidas históricas jogadas pelas estratégias (e às vezes por um movimento): crashes, textos da v4, emprego e salário
//      aos 30 por gênero/classe/cor — para ver as barreiras pesando (e o privilégio de origem).
//  B · o mandato que propõe reformas (o cargo é dado ao personagem, para medir só a reforma): chance, alteração gravada,
//      barreira derrubada, linha do tempo, contestação, herança (a vida segue com o herdeiro).
//  C · a vida contemporânea não muda: a biografia de N vidas (mesmas sementes) vai para um arquivo para comparar com a base.
// Uso: npx esbuild scripts/sim/erasV4.ts --bundle --platform=node --format=esm --outfile=X.mjs && MODO=A node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { anoDe } from '../../src/motor/tempo';
import { estrategia } from './estrategias';
import { movimentosDaVida } from '../../src/motor/eras/v4/movimentos4';
import { reformasDoMandato, chanceDaReforma } from '../../src/motor/eras/v4/politica4';
import { barreirasQuePesam } from '../../src/motor/eras/base/sociedade4';
import { resumoDaSociedade } from '../../src/motor/eras/v4/resumo4';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const MODO = process.env.MODO ?? 'ABC';
const N = Number(process.env.VIDAS ?? 8);
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'economico', 'gastador', 'ascensao'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const saida: string[] = [];
const log = (s: string) => { console.log(s); saida.push(s); };
const CLASSES = ['vulneravel', 'media', 'alta'] as const;

function viver(v: Vida, r: ReturnType<typeof criarRng>, perfil: string, ate: number, extra?: (v: Vida) => Vida): Vida {
  const e = estrategia(perfil);
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && idade(v) < ate) {
    for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    if (extra) { v = extra(v); responder(); }
    v = avancarAno(v).vida; responder();
    entrarNaVida(v);
  }
  return v;
}

/* ------------------------------------------------------------------ A */
if (MODO.includes('A')) {
  const CASOS: [string, number][] = [['BR', 1920], ['BR', 1950], ['US', 1920], ['US', 1960], ['DE', 1925], ['DE', 1955], ['JP', 1935], ['JP', 1955], ['AR', 1945], ['AR', 1965], ['GB', 1905], ['GB', 1955]];
  for (const [pais, ano] of CASOS) {
    const cidades = cidadesDoPais(pais);
    let crashes = 0;
    const conta = new Map<string, number>();
    const emp: Record<string, number[]> = {};
    const sal: Record<string, number[]> = {};
    let exemplos: string[] = [];
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 41 + ano);
      const classe = CLASSES[s % 3];
      const genero = s % 2 ? 'feminino' : 'masculino';
      const cid = cidades[(s * 7) % cidades.length];
      let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero, classe, municipioId: cid.id, semente: 91000 + s * 17 + ano, ano, era: true } as never);
      if (!v.era) { log(`  !! ${pais} ${ano}: sem era`); continue; }
      try {
        // Metade das vidas entra num movimento quando ele está na rua (participa todo ano; às vezes organiza ou doa).
        const militante = s % 4 === 0;
        v = viver(v, r, PERFIS[s % PERFIS.length], 60, militante ? (x => {
          const m = movimentosDaVida(x)[0];
          if (!m) return x;
          const oque = idade(x) >= 22 && r.chance(0.3) ? 'organizar' : idade(x) >= 25 && r.chance(0.2) ? 'financiar' : 'participar';
          const a: Acao = { tipo: 'eras4', oque, movimento: m.m.id };
          return tenta(x, a) ? executar(x, a).vida : x;
        }) : undefined);
        for (const b of v.biografia) {
          const ev = String(b.fato?.tipo === 'era' ? b.fato.dados.evento ?? '' : '');
          const k = ev.split(':')[0];
          if (/^(barreira|mov_|reforma|conquista|revogada|demissao_casamento|proscricao|heranca)/.test(k)) { conta.set(k, (conta.get(k) ?? 0) + 1); if (exemplos.length < 4 && k === 'barreira') exemplos.push(`${anoDe(b.t)}: ${b.texto.slice(0, 200)}`); }
        }
        const chave = `${genero === 'feminino' ? 'M' : 'H'}/${classe}${(v.eu.ancestralidade?.af ?? 0) >= 0.25 ? '/negro' : ''}`;
        (emp[chave] ??= []).push(v.trabalho.historico?.length ?? 0);
        const s30 = (v.trabalho.historico ?? []).map(x => x.salario ?? 0).filter(Boolean);
        (sal[chave] ??= []).push(s30.length ? s30.reduce((a, b) => a + b, 0) / s30.length : 0);
      } catch (err) { crashes++; log(`  CRASH ${pais} ${ano} #${s} em ${anoDe(v.t)}: ${(err as Error).stack?.split('\n').slice(0, 4).join(' | ')}`); }
    }
    const med = (xs: number[]) => { const q = [...xs].sort((a, b) => a - b); return q.length ? Math.round(q[Math.floor(q.length / 2)]) : 0; };
    log(`## A ${pais} ${ano}: crashes ${crashes} · textos v4: ${[...conta].map(([k, n]) => `${k} ${n}`).join(', ') || 'nenhum'}`);
    log(`   empregos na vida (mediana) / salário médio: ${Object.keys(emp).sort().map(k => `${k} ${med(emp[k])}/${med(sal[k])}`).join(' · ')}`);
    for (const x of exemplos) log(`   ex.: ${x}`);
    exemplos = [];
  }
}

/* ------------------------------------------------------------------ B */
if (MODO.includes('B')) {
  const CASOS: [string, number, string, string][] = [
    ['US', 1915, 'GA', 'governador'], ['US', 1910, 'NY', 'deputado_federal'], ['GB', 1890, 'ENG', 'deputado_federal'],
    ['BR', 1915, 'SP', 'deputado_federal'], ['BR', 1910, 'MG', 'prefeito'], ['DE', 1925, 'BY', 'deputado_federal'], ['JP', 1905, '13', 'deputado_federal'], ['AR', 1945, 'C', 'deputado_federal']
  ];
  for (const [pais, ano, uf, cargo] of CASOS) {
    const cid = cidadesDoPais(pais).find(c => c.uf === uf) ?? cidadesDoPais(pais)[0];
    let tentativas = 0, aprovadas = 0, derrubadas = 0, crashes = 0, herdou = 0;
    const nomes = new Map<string, number>();
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 53 + ano);
      let v = criarVida({ nome: 'Rui', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', classe: 'media', municipioId: cid.id, semente: 51000 + s * 19 + ano, ano: Math.max(ano, pais === 'AR' ? 1945 : 1900), era: true } as never);
      if (!v.era) continue;
      try {
        v = viver(v, r, 'familiar', 35);
        if (v.morte) continue;
        // O cargo é dado (a parte B mede a reforma, não a eleição).
        v.caminhos.politica = { fase: 'mandato', origem: 'decisao', tInicio: v.t, apoio: 40, reputacao: 30, desgaste: 5, consecutivos: 1, historico: [], partido: undefined, mandato: { cargo: cargo as never, tInicio: v.t, tFim: v.t + 48, aprovacao: 55, feito: 0 } } as never;
        for (let k = 0; k < 8 && !v.morte; k++) {
          const lista = reformasDoMandato(v);
          if (lista.length) {
            const rf = lista[0];
            if (k === 0 && s === 1) log(`   ${pais} ${anoDe(v.t)} ${cargo}: pode propor ${lista.map(x => `${x.nome} (${Math.round(chanceDaReforma(v, x).chance * 100)}%)`).join('; ')}`);
            const a: Acao = { tipo: 'politica', oque: 'reforma4', valor: rf.id } as never;
            if (tenta(v, a)) { tentativas++; const antes = v.era?.historia?.alteracoes.length ?? 0; v = executar(v, a).vida; if ((v.era?.historia?.alteracoes.length ?? 0) > antes) { aprovadas++; nomes.set(rf.nome, (nomes.get(rf.nome) ?? 0) + 1); } }
          }
          v = avancarAno(v).vida; entrarNaVida(v);
          if (v.caminhos.politica?.mandato) v.caminhos.politica.mandato.tFim = v.t + 48;
        }
        derrubadas += (v.era?.historia?.alteracoes ?? []).filter(a => a.revogadaEm !== undefined).length;
        const pesam = barreirasQuePesam(v, 'trabalho').length + barreirasQuePesam(v, 'credito').length;
        const res = resumoDaSociedade(v);
        if (s === 1) log(`   ${pais}: depois de 8 anos — barreiras que ainda pesam ${pesam}; mudanças na tela: ${res?.mudancas.map(m => `${m.ano} ${m.nome} ${m.onde}${m.derrubada ? ' (derrubada)' : ''}`).join('; ') || 'nenhuma'}`);
        // A vida continua: até morrer, e a história segue na vida do herdeiro (a mesma `era`).
        v = viver(v, r, 'familiar', 75);
        if ((v.era?.historia?.alteracoes.length ?? 0) > 0) herdou++;
      } catch (err) { crashes++; log(`  CRASH B ${pais} #${s} em ${anoDe(v.t)}: ${(err as Error).stack?.split('\n').slice(0, 4).join(' | ')}`); }
    }
    log(`## B ${pais} ${ano} ${cargo}@${uf}: crashes ${crashes} · tentativas ${tentativas} · aprovadas ${aprovadas} · derrubadas depois ${derrubadas} · vidas com o mundo mudado aos 75: ${herdou} · ${[...nomes].map(([k, n]) => `${k} ×${n}`).join('; ')}`);
  }
}

/* ------------------------------------------------------------------ C */
if (MODO.includes('C')) {
  const linhas: string[] = [];
  for (let s = 1; s <= Number(process.env.CONTEMP ?? 6); s++) {
    const r = criarRng(s * 97);
    const cid = cidadesDoPais(['BR', 'US', 'DE', 'JP'][s % 4])[s % 5];
    let v = criarVida({ nome: 'Lia', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: cid.id, semente: 33000 + s * 11 } as never);
    v = viver(v, r, PERFIS[s % PERFIS.length], 40);
    for (const b of v.biografia) linhas.push(`${s}|${b.t}|${b.texto}`);
    linhas.push(`${s}|fim|conta=${Math.round(v.financas.conta)}|emp=${v.trabalho.atual?.ocupacaoId ?? '-'}|sal=${v.trabalho.atual?.salario ?? 0}`);
  }
  writeFileSync(process.env.SAIDA_C ?? 'contemp-v4.txt', linhas.join('\n'));
  log(`## C: ${linhas.length} linhas de biografia contemporânea gravadas`);
}
if (process.env.LOG) writeFileSync(process.env.LOG, saida.join('\n'));
