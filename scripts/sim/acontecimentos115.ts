/**
 * REWORK 11.5 — quantas decisões e acontecimentos cada ano tem (Fase B). Vidas inteiras com os perfis de `agentes`;
 * só lê o que existe também na base (`ocorrencias`, `conteudoPorId`, `caminhos.situacoes`), para medir igual nos dois:
 *
 *   decisões/ano     distribuição 0 · 1 · 2 · 3 · 4+ por ano-vida (adulto, 18–70) e por perfil
 *   cenasCarreira    decisões profissionais (cena de carreira + contrato) por temporada de atleta profissional
 *   acontecimentos   acontecimentos de conteúdo por ano
 *   repetidas        a mesma decisão duas vezes no mesmo ano
 *   travou, ms/ano
 *
 *   npx esbuild scripts/sim/acontecimentos115.ts --bundle --platform=node --outfile=<scratch>/a115.cjs && N=6 node <scratch>/a115.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { conteudoPorId } from '../../src/motor/conteudo/motor';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 6);
const ATE = Number(process.env.ATE ?? 70);
const PERFIS = (process.env.PERFIS ?? 'estudioso,trabalhador,esportista,familiar,social,equilibrado,arriscado,aleatorio').split(',');
const CARREIRA = new Set(['car_situacao', 'esp_renovacao', 'esp_proposta', 'esp_doping', 'esp_mercado', 'tec_proposta', 'esp_posicao', 'esp_dispensa', 'esp_fim_carreira']);

async function principal() {
  await carregarMundo();
  const porPerfil: Record<string, number[]> = {};
  const geral = [0, 0, 0, 0, 0];
  let anos = 0, acont = 0, repetidas = 0, travou = 0, ms = 0, temporadas = 0, decCarreira = 0, maior = 0;
  for (const perfil of PERFIS) for (let k = 0; k < N; k++) {
    const semente = 115000 + PERFIS.indexOf(perfil) * 1000 + k;
    let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: k % 2 ? 'feminino' : 'masculino', municipioId: k % 3 ? 'recife-pe' : 'sao-paulo-sp', semente });
    const ag = agente(perfil);
    const r = criarRng(semente);
    const dist = (porPerfil[perfil] ??= [0, 0, 0, 0, 0]);
    const decidir = () => { for (let j = 0; j < 20 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
    try {
      while (!v.morte && idade(v) < ATE) {
        const t0 = performance.now();
        for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; decidir(); }
        decidir();
        const t = v.t;
        const temporadasAntes = v.caminhos.esporte?.fase === 'profissional' ? 1 : 0;
        v = avancarAno(v).vida;
        decidir();
        ms += performance.now() - t0;
        if (idade(v) < 18) continue;
        anos++;
        const doAno = v.ocorrencias.filter(o => o.t === t + 12 || o.t === v.t);
        const dec = doAno.filter(o => conteudoPorId(o.id)?.tipo === 'decisao');
        const ids = dec.map(o => o.id);
        const unicas = new Set(ids).size;
        repetidas += ids.length - unicas;
        acont += doAno.length - dec.length;
        geral[Math.min(4, unicas)]++;
        dist[Math.min(4, unicas)]++;
        maior = Math.max(maior, unicas);
        if (temporadasAntes && v.caminhos.esporte?.fase === 'profissional') { temporadas++; decCarreira += ids.filter(id => CARREIRA.has(id)).length; }
      }
    } catch (e) { travou++; console.error(perfil, k, (e as Error).message); }
  }
  const pct = (d: number[]) => { const s = d.reduce((a, b) => a + b, 0) || 1; return d.map(x => `${Math.round((x / s) * 1000) / 10}%`).join(' · '); };
  console.log(`anos-vida adultos: ${anos}`);
  console.log(`decisões/ano (0 · 1 · 2 · 3 · 4+): ${pct(geral)}; média ${(geral.reduce((s, x, i) => s + x * i, 0) / Math.max(1, anos)).toFixed(2)}; maior ${maior}`);
  for (const p of PERFIS) console.log(`  ${p.padEnd(12)} ${pct(porPerfil[p] ?? [0])}`);
  console.log(`acontecimentos de conteúdo/ano: ${(acont / Math.max(1, anos)).toFixed(2)}`);
  console.log(`decisões profissionais por temporada de atleta: ${(decCarreira / Math.max(1, temporadas)).toFixed(2)} (${temporadas} temporadas)`);
  console.log(`a mesma decisão duas vezes no ano: ${repetidas}; travou: ${travou}; ms/ano ${(ms / Math.max(1, anos)).toFixed(1)}`);
}
principal();
