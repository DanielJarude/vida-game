/**
 * REWORK 10 · §20 — simulação populacional com os dez perfis: acadêmico, trabalhador, atleta, familiar, social,
 * criminoso, financeiro, equilibrado, arriscado e aleatório. Vidas inteiras em vários países, classes e gêneros; cada
 * perfil age e responde do seu jeito (nenhum "escolhe sempre a primeira opção"). Mede distribuições (p10 · mediana ·
 * p90) e taxas, e conta o que nunca pode acontecer (atributo fora de 0..100, valor não finito, travamento).
 *
 *   npx esbuild scripts/sim/populacao10.ts --bundle --platform=node --outfile=<scratch>/p10.cjs && N=30 node <scratch>/p10.cjs
 *
 *   N      vidas por perfil (padrão 12)
 *   ATE    idade final (padrão 85)
 *   PERFIS só estes (por vírgula), para dividir a simulação em processos
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 12);
const ATE = Number(process.env.ATE ?? 85);
const PERFIS: [string, string][] = [
  ['estudioso', 'acadêmico'], ['trabalhador', 'trabalhador'], ['esportista', 'atleta'], ['familiar', 'familiar'], ['social', 'social'],
  ['criminoso', 'criminoso'], ['financeiro', 'financeiro'], ['equilibrado', 'equilibrado'], ['arriscado', 'arriscado'], ['aleatorio', 'aleatório']
];
const SO = process.env.PERFIS?.split(',');
if (SO) PERFIS.splice(0, PERFIS.length, ...PERFIS.filter(p => SO.includes(p[0])));
const CLASSES: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
const PAISES = ['BR', 'BR', 'BR', 'PT', 'US', 'AR', 'JP', 'NG', 'DE', 'FR'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

type Serie = Record<string, number[]>;
const por: Record<string, Serie> = {};
const escolhas: Record<string, Record<string, number>> = {};
const add = (s: Serie, k: string, x: number) => { if (Number.isFinite(x)) (s[k] ??= []).push(x); };
const contagem: Record<string, number> = {};
const violacoes: string[] = [];
let anos = 0, travou = 0;
const travamentos: string[] = [];

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f0 = (x: number) => (Number.isFinite(x) ? (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('pt-BR') : (Math.round(x * 10) / 10).toString()) : '—');
const dist = (xs?: number[]) => (xs?.length ? `${f0(pct(xs, 0.1))} · ${f0(pct(xs, 0.5))} · ${f0(pct(xs, 0.9))}` : '—');
const taxa = (xs?: number[]) => (xs?.length ? `${Math.round(xs.reduce((a, x) => a + x, 0) / xs.length * 100)}%` : '—');

function checar(v: Vida, tag: string) {
  for (const [k, x] of [['saude', v.corpo.saude], ['forma', v.corpo.forma], ['felicidade', v.mente.felicidade], ['estresse', v.mente.estresse], ['cognicao', v.mente.cognicao]] as [string, number][]) {
    if (!Number.isFinite(x) || x < 0 || x > 100) { contagem[`atributo_${k}`] = (contagem[`atributo_${k}`] ?? 0) + 1; if (violacoes.length < 20) violacoes.push(`${tag} ${idade(v)}a ${k}=${x}`); }
  }
  if (!Number.isFinite(v.financas.conta)) { contagem.conta_nan = (contagem.conta_nan ?? 0) + 1; violacoes.push(`${tag} conta=${v.financas.conta}`); }
  for (const p of Object.values(v.pessoas)) if (p.vivo && !p.especie && Math.floor((v.t - p.tNasc) / 12) > 115) { contagem.npc_115 = (contagem.npc_115 ?? 0) + 1; break; }
}

async function main() {
  await carregarMundo();
  const t0 = Date.now();
  for (const [nome] of PERFIS) {
    const s: Serie = (por[nome] = {});
    const esc = (escolhas[nome] = {});
    for (let k = 0; k < N; k++) {
      const pais = PAISES[k % PAISES.length];
      const cids = pais === 'BR' ? ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg'] : cidadesDoPais(pais).slice(0, 6).map(c => c.id);
      const classe = CLASSES[(k * 3 + nome.charCodeAt(1)) % 5];
      const genero = k % 2 ? 'masculino' : 'feminino';
      const semente = 10_000_000 + nome.length * 7919 + nome.charCodeAt(0) * 104729 + k * 7;
      const tag = `${nome}#${k} ${pais}/${classe}/${genero[0]}`;
      const ag = agente(nome);
      const r = criarRng(semente);
      let v: Vida;
      try { v = criarVida({ nome: 'Sim', sobrenome: 'Ulação', genero, municipioId: cids[k % cids.length], semente, classe }); } catch (e) { travou++; travamentos.push(`${tag} criação: ${(e as Error).message}`); continue; }
      let preso = false, profissional = false, nivelMax = 0, decisoes = 0;
      const decidir = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const m = v.momento!; const op = ag.decidir(v, m, r); esc[`${m.situacaoId}:${op}`] = (esc[`${m.situacaoId}:${op}`] ?? 0) + 1; decisoes++; v = executar(v, { tipo: 'decidir', opcaoId: op }).vida; } };
      try {
        while (!v.morte && idade(v) < ATE) {
          for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; decidir(); }
          v = avancarAno(v).vida; anos++;
          decidir();
          checar(v, tag);
          const i = idade(v);
          if (v.justica?.prisao) preso = true;
          if (v.caminhos.esporte?.fase === 'profissional') profissional = true;
          nivelMax = Math.max(nivelMax, ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.nivel ?? 0);
          if (i === 30) { add(s, 'felicidade30', v.mente.felicidade); add(s, 'superior30', v.educacao.concluidos.some(c => c.nivel === 'superior') ? 1 : 0); add(s, 'saude30', v.corpo.saude); }
          if (i === 40) { add(s, 'renda40', v.trabalho.atual?.salario ?? 0); add(s, 'patrimonio40', balanco(v).liquido); add(s, 'trabalha40', v.trabalho.atual ? 1 : 0); add(s, 'par40', Object.values(v.vinculos).some(x => x.romance && x.romance.estagio !== 'ex' && !x.romance.secreto) ? 1 : 0); }
          if (i === 50) {
            add(s, 'saude50', v.corpo.saude); add(s, 'felicidade50', v.mente.felicidade);
            add(s, 'proximos50', Object.values(v.vinculos).filter(x => x.proximidade >= 60 && v.pessoas[x.pessoaId]?.vivo && !v.pessoas[x.pessoaId]?.especie).length);
            add(s, 'memorias50', Object.values(v.vinculos).reduce((n, x) => n + x.historia.length, 0));
          }
          if (i === 65) add(s, 'patrimonio65', balanco(v).liquido);
        }
      } catch (e) { travou++; travamentos.push(`${tag} ${idade(v!)}a: ${(e as Error).message?.slice(0, 140)}`); continue; }
      add(s, 'antecedentes', (v.justica?.antecedentes?.length ?? 0) > 0 ? 1 : 0);
      add(s, 'preso', preso ? 1 : 0);
      add(s, 'profissional', profissional ? 1 : 0);
      add(s, 'nivelMax', nivelMax);
      add(s, 'ocorrencias', v.ocorrencias.length);
      add(s, 'distintas', new Set(v.ocorrencias.map(o => o.id)).size);
      add(s, 'novas10', v.ocorrencias.filter(o => /10_/.test(o.id)).length);
      add(s, 'ecos', v.ocorrencias.filter(o => o.id.startsWith('eco10_')).length);
      add(s, 'decisoes', decisoes);
      const ap = v.apostas?.total; if (ap && ap.apostado > 0) { add(s, 'apostado', ap.apostado); add(s, 'saldoApostas', ap.recebido - ap.apostado); }
      add(s, 'idadeMorte', v.morte ? idade(v) : ATE);
    }
  }
  const ms = (Date.now() - t0) / Math.max(1, anos);
  const cols = PERFIS.map(p => p[1]);
  console.log(`# População REWORK 10 — ${PERFIS.length} perfis × ${N} vidas até ${ATE} (${anos} anos vividos, ${ms.toFixed(1)} ms/ano)\n`);
  console.log(`Travamentos: ${travou}${travamentos.length ? '\n' + travamentos.slice(0, 10).map(x => '  - ' + x).join('\n') : ''}`);
  console.log(`Violações de invariante: ${Object.keys(contagem).length ? JSON.stringify(contagem) : 'nenhuma'}${violacoes.length ? '\n' + violacoes.slice(0, 10).map(x => '  - ' + x).join('\n') : ''}\n`);
  console.log(`| medida (p10 · mediana · p90) | ${cols.join(' | ')} |\n|---|${cols.map(() => '---').join('|')}|`);
  const D: [string, string][] = [['renda40', 'salário aos 40'], ['patrimonio40', 'patrimônio aos 40'], ['patrimonio65', 'patrimônio aos 65'], ['saude30', 'saúde aos 30'], ['saude50', 'saúde aos 50'], ['felicidade30', 'felicidade aos 30'], ['felicidade50', 'felicidade aos 50'], ['proximos50', 'pessoas próximas aos 50'], ['memorias50', 'memórias com pessoas aos 50'], ['nivelMax', 'maior nível de carreira'], ['idadeMorte', 'idade ao morrer'], ['ocorrencias', 'acontecimentos na vida'], ['distintas', 'acontecimentos distintos'], ['novas10', 'situações do REWORK 10'], ['ecos', 'ecos que voltaram'], ['decisoes', 'decisões respondidas'], ['apostado', 'total apostado (quem apostou)'], ['saldoApostas', 'saldo das apostas (quem apostou)']];
  for (const [k, rot] of D) console.log(`| ${rot} | ${PERFIS.map(p => dist(por[p[0]][k])).join(' | ')} |`);
  const T: [string, string][] = [['superior30', 'superior completo aos 30'], ['trabalha40', 'trabalhando aos 40'], ['par40', 'com parceria aos 40'], ['antecedentes', 'com antecedentes'], ['preso', 'passou pela prisão'], ['profissional', 'virou atleta profissional']];
  for (const [k, rot] of T) console.log(`| ${rot} | ${PERFIS.map(p => taxa(por[p[0]][k])).join(' | ')} |`);
  // A diversidade das respostas: das decisões que o perfil viu mais de 3 vezes, quantas tiveram 2+ respostas diferentes.
  console.log('\n## Diversidade das respostas\n\n| perfil | situações vistas | respostas distintas | situações vistas 4+ vezes com 2+ respostas | resposta mais repetida |\n|---|---|---|---|---|');
  for (const [nome, rot] of PERFIS) {
    const e = escolhas[nome];
    const porSit: Record<string, Record<string, number>> = {};
    for (const [k, n] of Object.entries(e)) { const [sit, op] = k.split(':'); (porSit[sit] ??= {})[op] = n; }
    const sits = Object.entries(porSit);
    const muitas = sits.filter(([, ops]) => Object.values(ops).reduce((a, b) => a + b, 0) >= 4);
    const variadas = muitas.filter(([, ops]) => Object.keys(ops).length >= 2).length;
    const total = Object.values(e).reduce((a, b) => a + b, 0);
    const [topo, n] = Object.entries(e).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
    console.log(`| ${rot} | ${sits.length} | ${Object.keys(e).length} | ${variadas} de ${muitas.length} | ${topo} (${(100 * n / Math.max(1, total)).toFixed(1)}%) |`);
  }
}
void main();
