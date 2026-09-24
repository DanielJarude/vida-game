/**
 * Simulador do FIX pós-playtest 2.
 *
 *   npx esbuild scripts/sim/fix2.ts --bundle --platform=node --outfile=/tmp/fix2.cjs
 *   VIDAS=20 SAIDA=/tmp/fix2 node /tmp/fix2.cjs
 *
 * As doze estratégias do simulador geral, mais três comportamentos do FIX
 * (sempre escolhendo entre o que o motor oferece): tomar iniciativa com
 * quem é elegível, cuidar de si quando o estado pede (metade das vidas), e
 * tentar peneiras (quem joga bola). Mede iniciativas e respostas, causas de
 * humor e cabeça, estados ruins sem saída, sobrecarga, entrevistas
 * (repetição, aprovação por preparo, abordagem dominante), peneiras e o
 * tamanho das listas primárias. Grava biografias para leitura.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { ctxPessoa, interacoesPara, interesseDoOutro } from '../../src/motor/sistemas/interacoes';
import { leituraDoEstado } from '../../src/motor/sistemas/estado';
import { sugestoes } from '../../src/motor/sistemas/cuidados';
import { semana } from '../../src/motor/sistemas/semana';
import { atividadesParaVoce, cursosParaVoce, vagasParaVoce } from '../../src/motor/sistemas/relevancia';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { elegibilidade } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { MUNICIPIOS } from '../../src/motor/dados/lugares';
import { estrategia, NOMES_ESTRATEGIAS } from './estrategias';

const VIDAS = Number(process.env.VIDAS ?? 20);
const SAIDA = process.env.SAIDA ?? '/tmp/fix2';
mkdirSync(SAIDA, { recursive: true });

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const faixa = (i: number) => (i < 13 ? '0-12' : i < 18 ? '13-17' : i < 30 ? '18-29' : i < 45 ? '30-44' : i < 60 ? '45-59' : '60+');
const inc = (o: Record<string, number>, k: string, n = 1) => { o[k] = (o[k] ?? 0) + n; };
const med = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
const p90 = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.9)] : 0);

const M = {
  vidas: 0,
  iniciativas: {} as Record<string, Record<string, number>>,
  motivos: {} as Record<string, number>,
  porVinculo: {} as Record<string, { n: number; sim: number }>,
  pediuTempo: { total: 0, sim: 0 },
  namoroDeIniciativa: 0,
  interacoesPorFase: {} as Record<string, number>,
  anosPorFase: {} as Record<string, number>,
  pesaCabeca: {} as Record<string, number>,
  pesaHumor: {} as Record<string, number>,
  semSaida: 0, anosRuins: 0, anosAdultos: 0, anosSobrecarga: 0, anosPressao: 0,
  cuidados: {} as Record<string, number>,
  entrevistas: 0, aprovadas: 0, repetidas: 0, perguntas: {} as Record<string, number>,
  porPreparo: {} as Record<string, { n: number; ok: number }>,
  porResposta: {} as Record<string, { n: number; soma: number }>,
  faltas: {} as Record<string, number>,
  portasDeRetorno: 0,
  peneiras: 0, peneirasOk: 0, peneiraPorHab: {} as Record<string, { n: number; ok: number }>, peneiraRepetida: 0, passouDepoisDeFalhar: 0,
  primarias: { atividades: [] as number[], vagas: [] as number[], cursos: [] as number[] },
  catalogo: { atividades: [] as number[], vagas: [] as number[] }
};

function iniciativa(v: Vida, r: ReturnType<typeof criarRng>): Acao | null {
  if (parceiro(v) || idade(v) < 16 || idade(v) > 60) return null;
  const alvos = vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco).map(x => ({ x, i: interacoesPara(v, x.p.id).find(a => ['flertar', 'declarar', 'convidar'].includes(a.id)) })).filter(y => y.i && tenta(v, { tipo: 'pessoa', pessoaId: y.x.p.id, interacao: y.i.id }));
  const y = r.pick(alvos);
  return y ? { tipo: 'pessoa', pessoaId: y.x.p.id, interacao: y.i!.id } : null;
}

function banda(n: number): string { return n >= 80 ? '80+' : n >= 60 ? '60-79' : n >= 40 ? '40-59' : '<40'; }

let bio = '';
for (let k = 0; k < VIDAS; k++) {
  for (const nome of NOMES_ESTRATEGIAS) {
    const r = criarRng(9000 + k * 97 + nome.length);
    const municipio = MUNICIPIOS[(k * 7 + nome.length) % MUNICIPIOS.length].id;
    let v = criarVida({ nome: 'Sim', sobrenome: nome, genero: (k + nome.length) % 2 ? 'masculino' : 'feminino', municipioId: municipio, semente: 50000 + k * 131 + nome.length * 7 });
    const est = estrategia(nome);
    const cuida = k % 2 === 0 && nome !== 'passivo';
    const atleta = k % 3 === 0 && nome !== 'passivo';
    const perguntasDaVida: string[] = [];
    const falhouPeneira: Record<string, boolean> = {};
    M.vidas++;
    while (!v.morte && idade(v) < 95) {
      const i = idade(v);
      const acoes: Acao[] = [];
      // Quem simula decide por quem se interessa (como o jogador faria), aos 15.
      if (i === 15 && !v.eu.atracao) v = executar(v, { tipo: 'atracao', valor: r.chance(0.9) ? (v.eu.genero === 'masculino' ? 'mulheres' : 'homens') : 'ambos' }).vida;
      if (atleta && i >= 6 && i <= 17) {
        const f = v.rotinas.find(x => x.id === 'futebol');
        const alvo: Acao = { tipo: 'rotina', id: 'futebol', ativa: true, nivel: f ? Math.min(2, (f.nivel ?? 1) + 1) as 1 | 2 : 1 };
        if (!f || (f.nivel ?? 1) < 2) acoes.push(alvo);
        for (const o of v.caminhos.oportunidades) if (o.tipo === 'peneira' || o.tipo === 'seletiva') acoes.push({ tipo: 'oportunidade', id: o.id, aceitar: true });
      }
      acoes.push(...est.agir(v, r));
      if (nome !== 'passivo' && nome !== 'antissocial' && r.chance(0.35)) { const a = iniciativa(v, r); if (a) acoes.push(a); }
      if (cuida && i >= 16) {
        for (const d of ['cabeca', 'humor', 'saude'] as const) {
          const s = sugestoes(v, d, disponibilidade).find(x => x.acao);
          if (s && r.chance(0.6)) { acoes.push(s.acao!); inc(M.cuidados, s.id); }
        }
      }
      for (const a of acoes) {
        if (!tenta(v, a)) continue;
        const antes = a.tipo === 'pessoa' ? structuredClone(v.vinculos[a.pessoaId]) : undefined;
        const vAntes = v;
        const eraPeneira = a.tipo === 'oportunidade' && v.caminhos.oportunidades.find(o => o.id === a.id && (o.tipo === 'peneira' || o.tipo === 'seletiva'));
        const habAntes = eraPeneira ? habilidade(v, eraPeneira.dominio ?? 'futebol') : 0;
        const entrevista = a.tipo === 'candidatar' && !ocupacao(a.ocupacaoId).concurso;
        const base = entrevista ? elegibilidade(v, ocupacao(a.ocupacaoId)).chance ?? 0 : 0;
        const devsAntes = v.caminhos.devolutivas.length;
        v = executar(v, a).vida;
        if (entrevista && v.caminhos.processo) {
          const qs = v.caminhos.processo.etapas.map(e => e.id);
          for (const q of qs) { inc(M.perguntas, q); if (perguntasDaVida.slice(-6).includes(q)) M.repetidas++; }
          perguntasDaVida.push(...qs);
        }
        let guarda = 0;
        while (v.momento && guarda++ < 6) {
          const pr = v.caminhos.processo;
          const escolha = est.decidir(v, v.momento, r);
          if (pr?.tipo === 'entrevista') {
            const e = pr.etapas[pr.atual];
            const res = executar(v, { tipo: 'decidir', opcaoId: escolha });
            const nota = res.vida.caminhos.processo?.etapas[pr.atual]?.nota ?? res.vida.caminhos.devolutivas.length;
            v = res.vida;
            const et = (v.caminhos.processo?.etapas ?? []).find(x => x.id === e.id) ?? e;
            void nota;
            if (et.resposta) { const k2 = `${e.id}:${et.resposta}`; M.porResposta[k2] = M.porResposta[k2] ?? { n: 0, soma: 0 }; M.porResposta[k2].n++; M.porResposta[k2].soma += et.nota ?? 0; }
          } else v = executar(v, { tipo: 'decidir', opcaoId: escolha }).vida;
        }
        if (entrevista && v.caminhos.devolutivas.length > devsAntes) {
          const d = v.caminhos.devolutivas[v.caminhos.devolutivas.length - 1];
          if (d.tipo === 'entrevista') {
            M.entrevistas++;
            const b = base >= 0.6 ? 'preparo alto' : base >= 0.35 ? 'preparo médio' : 'preparo baixo';
            M.porPreparo[b] = M.porPreparo[b] ?? { n: 0, ok: 0 }; M.porPreparo[b].n++;
            if (d.passou) { M.aprovadas++; M.porPreparo[b].ok++; } else inc(M.faltas, d.falta ?? '?');
            if (v.caminhos.oportunidades.some(o => o.titulo.startsWith('Chamaram de novo'))) M.portasDeRetorno++;
          }
        }
        if (eraPeneira && v.caminhos.devolutivas.length > devsAntes) {
          const d = v.caminhos.devolutivas[v.caminhos.devolutivas.length - 1];
          M.peneiras++;
          const hb = habAntes >= 75 ? '75+' : habAntes >= 65 ? '65-74' : habAntes >= 55 ? '55-64' : '<55';
          M.peneiraPorHab[hb] = M.peneiraPorHab[hb] ?? { n: 0, ok: 0 }; M.peneiraPorHab[hb].n++;
          const dom = d.dominio ?? 'futebol';
          if (falhouPeneira[dom]) M.peneiraRepetida++;
          if (d.passou) { M.peneirasOk++; M.peneiraPorHab[hb].ok++; if (falhouPeneira[dom]) M.passouDepoisDeFalhar++; } else falhouPeneira[dom] = true;
        }
        if (a.tipo === 'pessoa' && ['flertar', 'declarar', 'convidar'].includes(a.interacao) && antes) {
          const c0 = ctxPessoa(vAntes, a.pessoaId);
          if (c0) { const io = interesseDoOutro(c0); inc(M.motivos, io.motivo ?? (io.valor >= 58 ? 'interesse alto' : io.valor >= 45 ? 'interesse médio' : 'interesse baixo')); }
        }
        if (a.tipo === 'pessoa' && ['flertar', 'declarar', 'convidar'].includes(a.interacao) && !parceiro(v) && antes) {
          const rom = v.vinculos[a.pessoaId]?.romance;
          const saida = rom?.estagio === 'saindo' ? 'sim' : rom?.pediuTempo !== undefined ? 'pediu tempo' : rom?.estagio === 'interesse' ? 'sinal' : 'não';
          M.iniciativas[a.interacao] = M.iniciativas[a.interacao] ?? {}; inc(M.iniciativas[a.interacao], saida);
          if (a.interacao !== 'flertar') { const bb = banda(antes.proximidade); M.porVinculo[bb] = M.porVinculo[bb] ?? { n: 0, sim: 0 }; M.porVinculo[bb].n++; if (saida === 'sim') M.porVinculo[bb].sim++; }
          if (saida === 'pediu tempo') M.pediuTempo.total++;
        }
      }
      // O ano vivido
      const interacoes = v.anoAtual.acoes.filter(x => x.startsWith('pessoa:')).length;
      inc(M.interacoesPorFase, faixa(i), interacoes); inc(M.anosPorFase, faixa(i));
      const tempoAntes = vinculosVivos(v).filter(x => x.vin.romance?.pediuTempo !== undefined).map(x => x.p.id);
      const namorosAntes = new Set(vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio)).map(x => x.p.id));
      v = avancarAno(v).vida;
      let guarda = 0;
      while (v.momento && guarda++ < 6) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida;
      for (const id of tempoAntes) if (v.vinculos[id]?.romance?.estagio === 'saindo') M.pediuTempo.sim++;
      for (const x of vinculosVivos(v)) if (x.vin.romance && ['namoro'].includes(x.vin.romance.estagio) && !namorosAntes.has(x.p.id) && x.vin.historia.some(h => /Da amizade|primeiro encontro|Depois de pensar/.test(h.texto))) M.namoroDeIniciativa++;
      if (v.morte) break;
      const j = idade(v);
      if (j >= 18) {
        M.anosAdultos++;
        const s = semana(v);
        if (s.ocupado > s.capacidade + 0.01 || s.fixos.reduce((t, f) => t + f.peso, 0) > s.base - 0.5) M.anosSobrecarga++;
        if (v.mente.estresse >= 55) M.anosPressao++;
        const ruim = v.mente.estresse >= 55 || v.mente.felicidade < 40;
        if (ruim) {
          M.anosRuins++;
          const d = v.mente.estresse >= 55 ? 'cabeca' : 'humor';
          if (sugestoes(v, d, disponibilidade).length === 0) M.semSaida++;
        }
        const c = leituraDoEstado(v, 'cabeca').pesando[0]; if (c) inc(M.pesaCabeca, c.id.replace(/^abalo:.*$/, 'acontecimento do ano').replace(/^rotina:/, 'atividade:'));
        const h = leituraDoEstado(v, 'humor').pesando[0]; if (h) inc(M.pesaHumor, h.id.replace(/^abalo:.*$/, 'acontecimento do ano'));
        if (j % 7 === 0) {
          M.primarias.atividades.push(atividadesParaVoce(v).para.length);
          const va = vagasParaVoce(v); M.primarias.vagas.push(va.para.length); M.catalogo.vagas.push(va.para.length + va.resto.length);
          const at = atividadesParaVoce(v); M.catalogo.atividades.push(at.para.length + at.resto.length);
          if (!v.educacao.matricula) M.primarias.cursos.push(cursosParaVoce(v).para.length);
        }
      }
    }
    if (k < 2) {
      bio += `\n\n# ${nome} (${k}) — ${v.eu.nome} ${v.eu.sobrenome}, ${idade(v)} anos${v.morte ? `, ${v.morte.causa}` : ''}\n`;
      let anterior = -1;
      for (const e of v.biografia) { if (e.relevancia === 'tecnico') continue; if (e.idade !== anterior) { bio += `\n${e.idade}: `; anterior = e.idade; } bio += `${e.texto} `; }
      bio += `\n\nDevolutivas: ${v.caminhos.devolutivas.map(d => `${d.titulo} → ${d.texto}`).join(' | ')}`;
    }
  }
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const linhas: string[] = [];
linhas.push(`# FIX pós-playtest 2 — ${M.vidas} vidas (${NOMES_ESTRATEGIAS.length} estratégias × ${VIDAS})`);
linhas.push('\n## Iniciativa romântica');
for (const [k, o] of Object.entries(M.iniciativas)) { const t = Object.values(o).reduce((s, x) => s + x, 0); linhas.push(`- ${k}: ${t} · ${Object.entries(o).map(([s, n]) => `${s} ${pct(n, t)}`).join(' · ')}`); }
linhas.push(`- aceitação por vínculo (convidar/declarar): ${Object.entries(M.porVinculo).sort().map(([b, x]) => `${b}: ${pct(x.sim, x.n)} (n=${x.n})`).join(' · ')}`);
linhas.push(`- como estava o outro lado antes da iniciativa: ${Object.entries(M.motivos).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
linhas.push(`- pediu tempo → sim no ano seguinte: ${M.pediuTempo.sim}/${M.pediuTempo.total}`);
linhas.push(`- namoros nascidos de iniciativa: ${M.namoroDeIniciativa}`);
linhas.push('\n## Interações com pessoas por ano (média)');
linhas.push(Object.keys(M.anosPorFase).map(f => `${f}: ${(M.interacoesPorFase[f] / M.anosPorFase[f]).toFixed(2)}`).join(' · '));
linhas.push('\n## Estado pessoal (anos adultos)');
linhas.push(`- anos adultos: ${M.anosAdultos} · sob pressão (cabeça ≥ 55): ${pct(M.anosPressao, M.anosAdultos)} · semana acima do que cabe: ${pct(M.anosSobrecarga, M.anosAdultos)}`);
linhas.push(`- anos ruins (cabeça ≥ 55 ou humor < 40): ${M.anosRuins} · sem nenhum cuidado possível: ${M.semSaida}`);
linhas.push(`- o que mais pesa na cabeça: ${Object.entries(M.pesaCabeca).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} ${pct(n, M.anosAdultos)}`).join(' · ')}`);
linhas.push(`- o que mais pesa no humor: ${Object.entries(M.pesaHumor).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} ${pct(n, M.anosAdultos)}`).join(' · ')}`);
linhas.push(`- cuidados usados (vidas que cuidam): ${Object.entries(M.cuidados).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
linhas.push('\n## Entrevistas');
linhas.push(`- entrevistas: ${M.entrevistas} · aprovadas ${pct(M.aprovadas, M.entrevistas)} · perguntas distintas usadas: ${Object.keys(M.perguntas).length} · repetição de pergunta entre as 6 anteriores da mesma vida: ${M.repetidas}`);
linhas.push(`- aprovação por preparo: ${Object.entries(M.porPreparo).map(([b, x]) => `${b} ${pct(x.ok, x.n)} (n=${x.n})`).join(' · ')}`);
linhas.push(`- o que pesou nas reprovações: ${Object.entries(M.faltas).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
linhas.push(`- portas reabertas depois de uma entrevista quase: ${M.portasDeRetorno}`);
const porPergunta: Record<string, { id: string; media: number; n: number }[]> = {};
for (const [k, x] of Object.entries(M.porResposta)) { const [q, a] = k.split(':'); (porPergunta[q] = porPergunta[q] ?? []).push({ id: a, media: x.soma / x.n, n: x.n }); }
let dominantes = 0;
for (const [q, rs] of Object.entries(porPergunta)) { const o = rs.filter(x => x.n >= 5).sort((a, b) => b.media - a.media); if (o.length >= 2 && o[0].media - o[1].media > 0.5) dominantes++; void q; }
linhas.push(`- perguntas em que uma abordagem domina as outras por muito (Δ nota média > 0,5): ${dominantes} de ${Object.keys(porPergunta).length}`);
linhas.push('\n## Peneiras');
linhas.push(`- peneiras: ${M.peneiras} · passou ${pct(M.peneirasOk, M.peneiras)} · por habilidade: ${Object.entries(M.peneiraPorHab).sort().map(([b, x]) => `${b} ${pct(x.ok, x.n)} (n=${x.n})`).join(' · ')}`);
linhas.push(`- tentou de novo depois de falhar: ${M.peneiraRepetida} · passou depois de falhar: ${M.passouDepoisDeFalhar}`);
linhas.push('\n## Opções primárias exibidas (mediana / p90 / máx)');
for (const [k, a] of Object.entries(M.primarias)) linhas.push(`- ${k}: ${med(a)} / ${p90(a)} / ${Math.max(0, ...a)}`);
linhas.push(`- catálogo ao alcance (o que ia para a tela antes): atividades ${med(M.catalogo.atividades)} · vagas ${med(M.catalogo.vagas)}`);
const txt = linhas.join('\n');
writeFileSync(`${SAIDA}/metricas.md`, txt);
writeFileSync(`${SAIDA}/biografias.md`, bio);
console.log(txt);
console.log(`\nbiografias em ${SAIDA}/biografias.md`);
