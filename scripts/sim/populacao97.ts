/**
 * REWORK 9.7 · §14 — simulação populacional: vidas inteiras com estratégias variadas, em vários países, classes e
 * gêneros. Mede distribuições (p10 · mediana · p90, extremos), não médias isoladas, e conta o que nunca pode acontecer
 * (atributo fora de 0..100, nota fora da escala, valor não finito, travamento do ano).
 *
 *   npx esbuild scripts/sim/populacao97.ts --bundle --platform=node --outfile=<scratch>/p97.cjs && N=20 node <scratch>/p97.cjs
 *
 *   N           vidas por estratégia (padrão 12)
 *   ATE         idade final (padrão 80)
 *   PERFIS      lista separada por vírgula (padrão: as nove do relatório)
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { criarRng } from '../../src/motor/rng';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { contasAtivas } from '../../src/motor/sistemas/redesBase';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 12);
const ATE = Number(process.env.ATE ?? 80);
const PERFIS = (process.env.PERFIS ?? 'social,estudioso,ambicioso,esportista,familiar,economico,passivo,aleatorio,impulsivo').split(',');
const ROTULO: Record<string, string> = { social: 'equilibrado (social)', estudioso: 'estudos', ambicioso: 'carreira', esportista: 'esportes', familiar: 'relações', economico: 'dinheiro', passivo: 'pouco ativo', aleatorio: 'aleatório', impulsivo: 'arriscado' };
const CLASSES: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
const PAISES = ['BR', 'BR', 'BR', 'PT', 'US', 'AR', 'JP', 'NG', 'DE'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

type Serie = Record<string, number[]>;
const por: Record<string, Serie> = {};
const porGrupo: Record<string, Serie> = {};
const add = (s: Serie, k: string, x: number) => { if (Number.isFinite(x)) (s[k] ??= []).push(x); };
const violacoes: string[] = [];
const contagem: Record<string, number> = {};
const conta = (k: string) => { contagem[k] = (contagem[k] ?? 0) + 1; };
let anos = 0, travou = 0;
const travamentos: string[] = [];

function pct(xs: number[], p: number) { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; }
const f0 = (x: number) => (Number.isFinite(x) ? (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('pt-BR') : (Math.round(x * 10) / 10).toString()) : '—');
const dist = (xs?: number[]) => (xs?.length ? `${f0(pct(xs, 0.1))} · ${f0(pct(xs, 0.5))} · ${f0(pct(xs, 0.9))}` : '—');

function checar(v: Vida, tag: string) {
  const i = idade(v);
  const at: [string, number][] = [['saude', v.corpo.saude], ['forma', v.corpo.forma], ['felicidade', v.mente.felicidade], ['estresse', v.mente.estresse], ['aparencia', v.corpo.aparencia], ['cognicao', v.mente.cognicao]];
  for (const [k, x] of at) if (!Number.isFinite(x) || x < 0 || x > 100) { conta(`atributo_${k}`); if (violacoes.length < 30) violacoes.push(`${tag} ${i}a ${k}=${x}`); }
  const b = v.educacao.basica;
  if (b) {
    if (b.desempenho < 0 || b.desempenho > 100) { conta('desempenho_fora'); violacoes.push(`${tag} ${i}a desempenho=${b.desempenho}`); }
    for (const n of Object.values(b.notas ?? {}) as number[]) if (!(n >= 0 && n <= 10)) { conta('nota_fora'); violacoes.push(`${tag} ${i}a nota=${n}`); }
  }
  if (!Number.isFinite(v.financas.conta)) { conta('conta_nan'); violacoes.push(`${tag} ${i}a conta=${v.financas.conta}`); }
  for (const p of Object.values(v.pessoas)) if (!Number.isFinite(p.renda) || p.renda < 0) { conta('renda_npc'); break; }
}

async function main() {
  await carregarMundo();
  const t0 = Date.now();
  for (const nomePerfil of PERFIS) {
    const s: Serie = (por[nomePerfil] = {});
    for (let k = 0; k < N; k++) {
      const pais = PAISES[k % PAISES.length];
      const cids = pais === 'BR' ? ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'manaus-am'] : cidadesDoPais(pais).slice(0, 6).map(c => c.id);
      const municipioId = cids[k % cids.length];
      const classe = CLASSES[(k * 3 + PERFIS.indexOf(nomePerfil)) % 5];
      const genero = k % 2 ? 'masculino' : 'feminino';
      const semente = 97000 + PERFIS.indexOf(nomePerfil) * 1000 + k * 7;
      const tag = `${nomePerfil}#${k} ${pais}/${classe}/${genero[0]}`;
      const ag = agente(nomePerfil);
      const r = criarRng(semente);
      let v: Vida;
      try { v = criarVida({ nome: 'Sim', sobrenome: 'Ulação', genero, municipioId, semente, classe }); } catch (e) { travou++; travamentos.push(`${tag} criação: ${(e as Error).message}`); continue; }
      const g = (porGrupo[`${pais}`] ??= {}), gc = (porGrupo[`classe:${classe}`] ??= {}), gg = (porGrupo[`genero:${genero}`] ??= {});
      let maxSaude = 0, profissional = false, seg = 0, saltoSeg = 0;
      const notasVida: number[] = [];
      try {
        while (!v.morte && idade(v) < ATE) {
          for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; }
          const segAntes = contasAtivas(v).reduce((m, c) => Math.max(m, c.seguidores), 0);
          v = avancarAno(v).vida; anos++;
          for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
          checar(v, tag);
          const i = idade(v);
          maxSaude = Math.max(maxSaude, v.corpo.saude);
          if (v.caminhos.esporte?.fase === 'profissional') profissional = true;
          seg = contasAtivas(v).reduce((m, c) => Math.max(m, c.seguidores), 0);
          if (segAntes >= 10000 && seg > segAntes * 3) saltoSeg++;
          const ns = Object.values(v.educacao.basica?.notas ?? {}) as number[];
          if (ns.length) notasVida.push(ns.reduce((a, x) => a + x, 0) / ns.length);
          if (i === 18) { add(s, 'cognicao18', v.mente.cognicao); add(s, 'forma18', v.corpo.forma); }
          if (i === 30) { add(s, 'saude30', v.corpo.saude); add(s, 'felicidade30', v.mente.felicidade); add(s, 'cognicao30', v.mente.cognicao); add(g, 'felicidade30', v.mente.felicidade); add(gc, 'felicidade30', v.mente.felicidade); add(gg, 'felicidade30', v.mente.felicidade); }
          if (i === 40) {
            add(s, 'forma40', v.corpo.forma); add(s, 'trabalha40', v.trabalho.atual ? 1 : 0); add(s, 'par40', Object.values(v.vinculos).some(x => x.romance && x.romance.estagio !== 'ex' && !x.romance.secreto) ? 1 : 0);
            const liq = balanco(v).liquido; add(s, 'patrimonio40', liq); add(g, 'patrimonio40', liq); add(gc, 'patrimonio40', liq);
            add(s, 'renda40', v.trabalho.atual?.salario ?? 0); add(g, 'trabalha40', v.trabalho.atual ? 1 : 0); add(gc, 'trabalha40', v.trabalho.atual ? 1 : 0); add(gg, 'trabalha40', v.trabalho.atual ? 1 : 0);
          }
          if (i === 50) { add(s, 'saude50', v.corpo.saude); add(s, 'felicidade50', v.mente.felicidade); }
          if (i === 65) { add(s, 'patrimonio65', balanco(v).liquido); add(s, 'felicidade65', v.mente.felicidade); add(g, 'felicidade65', v.mente.felicidade); }
          if (i === 70) add(s, 'saude70', v.corpo.saude);
        }
      } catch (e) { travou++; travamentos.push(`${tag} ${idade(v!)}a: ${(e as Error).message?.slice(0, 120)}`); continue; }
      add(s, 'maxSaude', maxSaude); add(s, 'chegou100', maxSaude >= 100 ? 1 : 0);
      add(s, 'profissional', profissional ? 1 : 0); add(s, 'seguidoresMax', seg); add(s, 'saltoSeguidores', saltoSeg);
      if (notasVida.length) { add(s, 'notaMedia', notasVida.reduce((a, x) => a + x, 0) / notasVida.length); add(s, 'notaAmplitude', Math.max(...notasVida) - Math.min(...notasVida)); }
      if (v.morte) { add(s, 'idadeMorte', idade(v)); add(g, 'idadeMorte', idade(v)); add(gc, 'idadeMorte', idade(v)); add(gg, 'idadeMorte', idade(v)); }
      else add(s, 'vivoAos' + ATE, 1);
    }
  }
  const ms = (Date.now() - t0) / Math.max(1, anos);
  console.log(`# População REWORK 9.7 — ${PERFIS.length} estratégias × ${N} vidas até ${ATE} (${anos} anos vividos, ${ms.toFixed(1)} ms/ano)\n`);
  console.log(`Travamentos: ${travou}${travamentos.length ? '\n' + travamentos.slice(0, 10).map(x => '  - ' + x).join('\n') : ''}`);
  console.log(`Violações de invariante: ${Object.keys(contagem).length ? JSON.stringify(contagem) : 'nenhuma'}${violacoes.length ? '\n' + violacoes.slice(0, 10).map(x => '  - ' + x).join('\n') : ''}\n`);
  const linhas: [string, string][] = [['notaMedia', 'nota média da escola (0–10)'], ['notaAmplitude', 'amplitude da nota na vida'], ['cognicao18', 'inteligência aos 18'], ['cognicao30', 'inteligência aos 30'], ['forma18', 'físico aos 18'], ['forma40', 'físico aos 40'], ['saude30', 'saúde aos 30'], ['saude50', 'saúde aos 50'], ['saude70', 'saúde aos 70'], ['maxSaude', 'maior saúde da vida'], ['felicidade30', 'felicidade aos 30'], ['felicidade50', 'felicidade aos 50'], ['felicidade65', 'felicidade aos 65'], ['renda40', 'salário aos 40 (bruto)'], ['patrimonio40', 'patrimônio líquido aos 40'], ['patrimonio65', 'patrimônio líquido aos 65'], ['idadeMorte', 'idade ao morrer']];
  console.log(`| medida (p10 · mediana · p90) | ${PERFIS.map(p => ROTULO[p] ?? p).join(' | ')} |\n|---|${PERFIS.map(() => '---').join('|')}|`);
  for (const [k, rot] of linhas) console.log(`| ${rot} | ${PERFIS.map(p => dist(por[p][k])).join(' | ')} |`);
  const taxa = (xs?: number[]) => (xs?.length ? `${Math.round(xs.reduce((a, x) => a + x, 0) / xs.length * 100)}%` : '—');
  for (const [k, rot] of [['chegou100', 'chegou a Saúde 100'], ['trabalha40', 'trabalhando aos 40'], ['par40', 'com parceria aos 40'], ['profissional', 'virou atleta profissional']] as const) console.log(`| ${rot} | ${PERFIS.map(p => taxa(por[p][k])).join(' | ')} |`);
  console.log(`| anos com seguidores ×3 (conta ≥ 10 mil) | ${PERFIS.map(p => f0((por[p].saltoSeguidores ?? []).reduce((a, x) => a + x, 0))).join(' | ')} |`);
  console.log('\n## Por país, classe e gênero\n\n| grupo | n | felicidade aos 30 | trabalhando aos 40 | patrimônio aos 40 | idade ao morrer |\n|---|---|---|---|---|---|');
  for (const [k, s] of Object.entries(porGrupo).sort()) console.log(`| ${k} | ${(s.felicidade30 ?? []).length} | ${dist(s.felicidade30)} | ${taxa(s.trabalha40)} | ${dist(s.patrimonio40)} | ${dist(s.idadeMorte)} |`);
}
void main();
