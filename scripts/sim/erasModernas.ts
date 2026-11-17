// ERAS MODERNAS — auditoria: vidas nascidas de 1990 a 2025 (com `v.era`), jogadas por agentes, até depois de 2026.
// Conta crashes, invariantes, extrato que não concilia, save que não volta igual (interpretar), dinheiro NaN, era perdida,
// anacronismos no texto (até 2025) e textos com valores "NaN"/"undefined".
// Uso: npx esbuild scripts/sim/erasModernas.ts --bundle --platform=node --format=esm --outfile=X.mjs && N=6 node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { anoDe } from '../../src/motor/tempo';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { interpretar } from '../../src/motor/save';
import { anacronismosNoTexto } from '../../src/motor/eras/base/anacronismos';
import { agente } from './agentes';

await carregarMundo();
const N = Number(process.env.N ?? 6);
const ATE = Number(process.env.ATE ?? 70);
const COORTES = (process.env.COORTES ?? '1990,1993,1997,2001,2004,2008,2012,2016,2020,2023,2025').split(',').map(Number);
const PERFIS = ['aleatorio', 'social', 'ambicioso', 'estudioso', 'impulsivo', 'economico', 'familiar', 'esportista', 'passivo'];
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am', 'fortaleza-ce', 'curitiba-pr', 'rio-de-janeiro-rj'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const cont: Record<string, number> = {};
const ex: Record<string, string[]> = {};
const nota = (k: string, s: string) => { cont[k] = (cont[k] ?? 0) + 1; const l = (ex[k] ??= []); if (l.length < 6) l.push(s); };
let anos = 0;
const t0 = Date.now();

function checar(v: Vida, tag: string) {
  const i = idade(v);
  for (const [k, x] of [['saude', v.corpo.saude], ['forma', v.corpo.forma], ['felicidade', v.mente.felicidade], ['estresse', v.mente.estresse], ['aparencia', v.corpo.aparencia], ['cognicao', v.mente.cognicao]] as [string, number][])
    if (!Number.isFinite(x) || x < 0 || x > 100) nota('atributo', `${tag} ${i}a ${k}=${x}`);
  if (!Number.isFinite(v.financas.conta)) nota('conta_nan', `${tag} ${i}a`);
  for (const d of v.financas.dividas) if (!Number.isFinite(d.saldo)) nota('divida_nan', `${tag} ${i}a`);
  if (v.trabalho.atual && !(Number.isFinite(v.trabalho.atual.salario) && v.trabalho.atual.salario >= 0)) nota('salario', `${tag} ${i}a ${v.trabalho.atual.salario}`);
  for (const p of Object.values(v.pessoas)) if (!Number.isFinite(p.renda) || p.renda < 0) { nota('renda_npc', `${tag} ${i}a`); break; }
  if (!v.era) nota('era_perdida', `${tag} ${i}a`);
  const e = v.financas.extrato;
  if (e && !conciliar(e).ok) nota('extrato', `${tag} ${i}a`);
}

for (const ano of COORTES) {
  for (let k = 0; k < N; k++) {
    const perfil = PERFIS[(k + ano) % PERFIS.length];
    const semente = 61000 + ano * 13 + k;
    const tag = `${ano}#${k}/${perfil}`;
    const ag = agente(perfil);
    const r = criarRng(semente);
    let v: Vida;
    try { v = criarVida({ nome: 'Ana', sobrenome: 'Era', genero: k % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[k % CIDADES.length], semente, ano, era: true } as never); }
    catch (e) { nota('crash_criacao', `${tag}: ${(e as Error).message}`); continue; }
    if (!v.era) { nota('sem_era', tag); continue; }
    let lidos = 0;
    const responder = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
      const m = v.momento!;
      if (anoDe(v.t) <= 2025) for (const s of [m.titulo, m.texto, ...m.opcoes.map(o => o.texto)]) { const a = anacronismosNoTexto(s ?? '', anoDe(v.t)); if (a.length) nota('anacronismo_cena', `${tag} ${anoDe(v.t)} [${a}] ${s.slice(0, 120)}`); }
      v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, m, r) }).vida; } };
    try {
      while (!v.morte && idade(v) < ATE) {
        for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
        v = avancarAno(v).vida; anos++; responder();
        entrarNaVida(v);
        checar(v, tag);
        const bio = v.biografia ?? [];
        for (; lidos < bio.length; lidos++) {
          const b = bio[lidos] as { t: number; texto: string };
          if (/NaN|undefined|\[object|Infinity/.test(b.texto)) nota('texto_quebrado', `${tag} ${anoDe(b.t)}: ${b.texto.slice(0, 160)}`);
          const an = anoDe(b.t);
          if (an <= 2025) { const a = anacronismosNoTexto(b.texto, an); if (a.length) nota('anacronismo_bio', `${tag} ${an} [${a}] ${b.texto.slice(0, 140)}`); }
        }
        if (idade(v) % 10 === 5) {
          const l = interpretar(JSON.stringify(v));
          if (l.tipo !== 'ok') nota('save_invalido', `${tag} ${idade(v)}a ${(l as { motivo?: string }).motivo}`);
          else {
            const w = l.vida;
            if (!w.era || w.era.ano !== v.era!.ano) nota('save_era', `${tag} ${idade(v)}a`);
            if (Math.abs(w.financas.conta - v.financas.conta) > 0.5) nota('save_conta', `${tag} ${idade(v)}a ${v.financas.conta}→${w.financas.conta}`);
            if (w.t !== v.t) nota('save_t', tag);
            // segue jogando com o que voltou do save (como o jogador que fecha e reabre)
            v = w; entrarNaVida(v);
          }
        }
      }
    } catch (e) { nota('crash', `${tag} ${anoDe(v!.t)} ${idade(v!)}a: ${(e as Error).stack?.split('\n').slice(0, 3).join(' | ').slice(0, 300)}`); }
  }
}
console.log(`# Eras modernas — ${COORTES.length} coortes × ${N} vidas até ${ATE} (${anos} anos, ${((Date.now() - t0) / Math.max(1, anos)).toFixed(1)} ms/ano)`);
console.log(Object.keys(cont).length ? Object.entries(cont).map(([k, n]) => `${k}: ${n}\n  - ${ex[k].join('\n  - ')}`).join('\n') : 'nenhum problema');
