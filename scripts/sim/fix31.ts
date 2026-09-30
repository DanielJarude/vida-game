/**
 * Simulações dirigidas do FIX 3.1 (pendências pós-REWORK 3): amostras para
 * ver se os caminhos são alcançáveis sem serem garantidos, e para separar
 * bug estrutural de ruído — não a simulação oficial de mil vidas.
 *
 *   npx esbuild scripts/sim/fix31.ts --bundle --platform=node --outfile=/tmp/f31.cjs
 *   VIDAS=40 node /tmp/f31.cjs            (SO=A,B,C,D,E para rodar só alguns)
 *
 *   A medicina    — generalista · especialização (qual) · renda aos 40
 *   B esportes    — futebol · basquete · tênis: perseguir, largar, base, profissional
 *   C arte        — iniciante · intermediária · reconhecida; com e sem agente; cachês bruto/líquido
 *   D patrimônio  — casa própria aos 40: capaz de comprar × comprou, por origem e renda
 *   E ajuda       — ajuda da família até os 40: quem ajudou, com que folga, quantas vezes
 *
 * Sempre pelo que o jogador pode fazer (`disponibilidade` → `executar`).
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { estrategia } from './estrategias';
import { ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { imoveisParaVoce } from '../../src/motor/sistemas/relevancia';
import { modeloMoradia } from '../../src/motor/dados/bens';
import { orcamento } from '../../src/motor/sistemas/dinheiro';
import { especialidadeMedica } from '../../src/motor/sistemas/medicina';
import { SALARIO_MINIMO } from '../../src/motor/sistemas/renda';

const N = Number(process.env.VIDAS ?? 40);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am', 'tarauaca-ac', 'campinas-sp'];
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const mediana = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const reais = (x: number) => `R$ ${Math.round(x).toLocaleString('pt-BR')}`;

type Agente = (v: Vida, r: Rng) => Acao[];

function nascer(semente: number, genero?: 'masculino' | 'feminino'): Vida {
  const r = criarRng(semente);
  return criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: genero ?? (r.chance(0.5) ? 'feminino' : 'masculino'), municipioId: CIDADES[semente % CIDADES.length], semente });
}

/** Vive até `ate`: ações do agente, estratégia base, preferências na frente; `ano` observa cada aniversário. */
function viver(v: Vida, ate: number, base: string, extra: Agente = () => [], prefs: string[] = [], r = criarRng(1), ano?: (v: Vida) => void, filtro: (v: Vida, a: Acao) => boolean = () => true): Vida {
  const e = estrategia(base);
  const decidir = () => {
    const m = v.momento!;
    const livres = m.opcoes.filter(o => !o.bloqueio);
    for (const p of prefs) { const o = livres.find(x => x.id === p); if (o) return o.id; }
    if (m.situacaoId === 'cnh_prova') return livres[r.int(0, livres.length - 1)].id;
    return e.decidir(v, m, r);
  };
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  while (!v.morte && idade(v) < ate) {
    for (const a of [...extra(v, r), ...e.agir(v, r)]) { if (!filtro(v, a) || !tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    // As portas que as próprias ações abriram neste ano (a proposta depois do teste): o jogador as vê antes de virar o ano.
    for (const a of extra(v, r).filter(x => x.tipo === 'oportunidade' || (x.tipo === 'perseguir' && /contrato/.test((x as unknown as { oque: string }).oque)))) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida;
    responder();
    ano?.(v);
  }
  return v;
}

const trilhaAtual = (v: Vida) => (v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined);
const aceitarPortas = (v: Vida, tipos: string[]): Acao[] => v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao));

/* ============================================================ A. Medicina */

function medicina(): void {
  console.log('\n## A. Medicina (formados em Medicina, até os 42)\n');
  const grupos: { nome: string; residencia: boolean }[] = [{ nome: 'generalista (não tenta residência)', residencia: false }, { nome: 'tenta residência (qualquer especialidade)', residencia: true }];
  const linhas = ['| grupo | formou em Medicina | residência concluída | especialidades | trabalha na medicina aos 42 | renda mediana aos 42 | vaga de título (cirurgião, MFC) |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const d = { formou: [] as boolean[], res: [] as boolean[], med: [] as boolean[], renda: [] as number[], titulo: [] as boolean[], esp: new Map<string, number>() };
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 17);
      const extra: Agente = v => {
        const i = idade(v); const out: Acao[] = [];
        const formado = v.educacao.concluidos.some(c => c.nivel === 'superior' && c.area === 'medicina');
        // Chegar lá: o objetivo de estudo é Medicina (a estratégia estudiosa faz o resto).
        if (i >= 15 && i <= 30 && !formado && !v.educacao.matricula) { out.push({ tipo: 'objetivo_estudo', cursoId: 'medicina' } as Acao); const k = opcoesDeCurso(v).findIndex(o => o.curso.id === 'medicina' && podeTentar(o.veredito)); if (k >= 0) out.push({ tipo: 'matricular', indice: k } as Acao); }
        if (formado && g.residencia && !v.educacao.concluidos.some(c => c.nivel === 'residencia')) {
          out.push(P('preparar_residencia'));
          const ops = opcoesDeCurso(v).map((o, k) => ({ o, k })).filter(x => x.o.especialidade && podeTentar(x.o.veredito));
          if (ops.length && !v.educacao.matricula && i >= 25) { const x = ops[(s + i) % ops.length]; out.push({ tipo: 'matricular', indice: x.k } as Acao); }
        }
        if (formado && !v.trabalho.atual && !v.educacao.matricula) for (const id of ['cirurgiao', 'medico_familia', 'medico_hospital', 'medico_especialista', 'medico']) out.push({ tipo: 'candidatar', ocupacaoId: id } as Acao);
        out.push(...aceitarPortas(v, ['convite', 'indicacao', 'estagio']));
        return out;
      };
      const v = viver(nascer(20000 + s), 42, 'estudioso', extra, ['aceitar', 'sim', 'mudar', 'deixar'], r);
      if (v.morte) continue;
      const formou = v.educacao.concluidos.some(c => c.nivel === 'superior' && c.area === 'medicina');
      d.formou.push(formou);
      if (!formou) continue;
      const e = especialidadeMedica(v);
      d.res.push(!!e);
      if (e) d.esp.set(e, (d.esp.get(e) ?? 0) + 1);
      d.med.push(trilhaAtual(v) === 'medicina');
      if (trilhaAtual(v) === 'medicina') d.renda.push(v.trabalho.atual!.salario);
      d.titulo.push(['cirurgiao', 'medico_familia'].includes(v.trabalho.atual?.ocupacaoId ?? '') || v.trabalho.historico.some(h => ['cirurgiao', 'medico_familia'].includes(h.ocupacaoId)));
    }
    linhas.push(`| ${g.nome} | ${pct(d.formou)} | ${pct(d.res)} | ${[...d.esp.entries()].map(([k, n]) => `${k} ${n}`).join(', ') || '—'} | ${pct(d.med)} | ${d.renda.length ? reais(mediana(d.renda)) : '—'} | ${pct(d.titulo)} |`);
  }
  console.log(linhas.join('\n'));
}

/* ============================================================ B. Esportes */

function esportes(): void {
  console.log('\n## B. Futebol, basquete e tênis (perseguição deliberada, dos 7 aos 32)\n');
  const linhas = ['| modalidade | chegou a base/academia | virou profissional | ainda profissional aos 32 | largou/dispensado | maior nível alcançado (mediana, entre profissionais) | renda do auge (mediana) | lesões (mediana, profissionais) |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const d of ['futebol', 'basquete', 'tenis'] as const) {
    const x = { base: [] as boolean[], pro: [] as boolean[], ainda: [] as boolean[], fim: [] as boolean[], nivel: [] as number[], renda: [] as number[], les: [] as number[] };
    for (let s = 1; s <= N; s++) {
      let maxRenda = 0; let virou = false; let base = false; let maxNivel = 0;
      const extra: Agente = v => {
        const i = idade(v); const out: Acao[] = [];
        if (i >= 7 && i <= 17) { if (!v.rotinas.some(r => r.id === d && (r.nivel ?? 1) >= 2)) out.push({ tipo: 'rotina', id: d, ativa: true, nivel: 2 } as Acao, { tipo: 'rotina', id: d, ativa: true, nivel: 1 } as Acao); out.push(P('treino_fundamentos', d), P('pedir_teste', d)); }
        out.push(...aceitarPortas(v, ['peneira', 'seletiva', 'convite']));
        return out;
      };
      // Perseguição deliberada: na base (ou já profissional), não se procura outro emprego.
      const naCarreira = (w: Vida, a: Acao) => !(w.caminhos.esporte && w.caminhos.esporte.fase !== 'encerrada' && (a.tipo === 'candidatar' || (a.tipo === 'oportunidade' && !['peneira', 'seletiva', 'convite'].includes(w.caminhos.oportunidades.find(o => o.id === (a as { id: string }).id)?.tipo ?? ''))));
      const v = viver(nascer(30000 + s), 32, 'social', extra, ['assinar', 'aceitar', 'renovar', 'sim', 'entrar', 'seguir', 'tentar'], criarRng(s * 7), w => {
        const e = w.caminhos.esporte;
        if (e && e.modalidade === d) { if (e.fase !== 'encerrada') base = true; if (e.fase === 'profissional') { virou = true; maxNivel = Math.max(maxNivel, e.nivel); maxRenda = Math.max(maxRenda, w.trabalho.atual?.salario ?? 0); } }
      }, naCarreira);
      if (v.morte) continue;
      const e = v.caminhos.esporte?.modalidade === d ? v.caminhos.esporte : undefined;
      x.base.push(base); x.pro.push(virou); x.ainda.push(e?.fase === 'profissional'); x.fim.push(base && e?.fase === 'encerrada');
      if (virou) { x.nivel.push(maxNivel); x.renda.push(maxRenda); x.les.push(e?.lesoes ?? 0); }
    }
    linhas.push(`| ${d} | ${pct(x.base)} | ${pct(x.pro)} | ${pct(x.ainda)} | ${pct(x.fim)} | ${x.nivel.length ? mediana(x.nivel) : '—'} | ${x.renda.length ? reais(mediana(x.renda)) : '—'} | ${x.les.length ? mediana(x.les) : '—'} |`);
  }
  console.log(linhas.join('\n'));
}

/* ============================================================ C. Arte */

function arte(): void {
  console.log('\n## C. Atuação: estágios, agente e cachês (dos 10 aos 40)\n');
  const linhas = ['| grupo | teve agente | trabalhos no audiovisual | propostas recusadas/vencidas | cachê bruto (p25 · mediana · p90) | comissão (mediana) | líquido/bruto | maior cachê |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  const todos: number[] = [];
  for (const g of [{ nome: 'sem agente', agente: false }, { nome: 'procura agente', agente: true }]) {
    const x = { teve: [] as boolean[], trabalhos: [] as number[], recusas: [] as number[], brutos: [] as number[], comissoes: [] as number[], razao: [] as number[] };
    for (let s = 1; s <= N; s++) {
      const extra: Agente = v => {
        const i = idade(v); const out: Acao[] = [];
        if (i >= 10 && !v.rotinas.some(r => r.id === 'teatro' && (r.nivel ?? 1) >= 2)) out.push({ tipo: 'rotina', id: 'teatro', ativa: true, nivel: 2 } as Acao);
        if (i >= 14) for (const o of ['apresentar', 'audicao', 'trabalho_pequeno', 'edital']) out.push(P(o));
        if (i >= 16) out.push(P('montar_grupo', 'teatro'));
        if (g.agente) out.push(P('buscar_agente'));
        for (const c of v.caminhos.audiovisual?.contratos ?? []) if (c.status === 'proposta') out.push(P('aceitar_contrato', c.id));
        out.push(...aceitarPortas(v, ['convite', 'edital_cultura']));
        return out;
      };
      const v = viver(nascer(9000 + s), 40, 'social', extra, ['plano_1', 'plano_0', 'pausar', 'aceitar', 'montar', 'sim'], criarRng(s * 31));
      if (v.morte) continue;
      const cs = v.caminhos.audiovisual?.contratos ?? [];
      const feitos = cs.filter(c => c.status === 'concluido');
      x.teve.push(v.biografia.some(b => /passou a representar você/.test(b.texto)));
      x.trabalhos.push(feitos.length);
      x.recusas.push(cs.filter(c => c.status === 'recusado' || c.status === 'expirou').length);
      for (const c of feitos) { x.brutos.push(c.bruto); todos.push(c.bruto); if (c.comissao) x.comissoes.push(c.comissao); x.razao.push((c.bruto - c.comissao - c.despesas) / Math.max(1, c.bruto)); }
    }
    const b = [...x.brutos].sort((p, q) => p - q);
    const q = (f: number) => (b.length ? reais(b[Math.floor((b.length - 1) * f)]) : '—');
    linhas.push(`| ${g.nome} | ${pct(x.teve)} | ${mediana(x.trabalhos)} (total ${x.brutos.length}) | ${mediana(x.recusas)} | ${q(0.25)} · ${q(0.5)} · ${q(0.9)} | ${x.comissoes.length ? reais(mediana(x.comissoes)) : '—'} | ${x.razao.length ? `${Math.round(mediana(x.razao) * 100)}%` : '—'} | ${b.length ? reais(b[b.length - 1]) : '—'} |`);
  }
  console.log(linhas.join('\n'));
  const repetidos = todos.length - new Set(todos).size;
  const moda = [...todos.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<number, number>()).entries()].sort((a, b) => b[1] - a[1])[0];
  console.log(`\n- ${todos.length} cachês de trabalhos concluídos; ${new Set(todos).size} valores distintos (${repetidos} repetições). O valor mais repetido: ${moda ? `${reais(moda[0])} (${moda[1]}×)` : '—'}.`);
}

/* ============================================================ D. Patrimônio */

function patrimonio(): void {
  console.log('\n## D. Casa própria aos 40 (vidas comuns): capaz × comprou\n');
  const bases = ['familiar', 'economico', 'estudioso', 'social', 'ambicioso', 'gastador'];
  const M = N * 3;
  type Linha = { base: string; classe: string; faixa: string; capaz: boolean; comprou: boolean; herdou: boolean; motivo?: string };
  const out: Linha[] = [];
  for (let s = 1; s <= M; s++) {
    const base = bases[s % bases.length];
    let capaz = false; let motivo: string | undefined; let renda35 = 0;
    const v = viver(nascer(40000 + s), 40, base, () => [], ['recusar_proposta', 'afastar_proposta'], criarRng(s), w => {
      const i = idade(w);
      if (i === 35) renda35 = orcamento(w).renda;
      if (i < 28 || capaz || w.financas.bens.some(b => b.tipo === 'imovel')) return;
      // Alguma oferta real da cidade caberia (financiada, para morar)? E, se não, o que pesa na mais barata?
      const { para, resto } = imoveisParaVoce(w, 'venda');
      const cands = [...para.map(x => x.item), ...resto].filter(o => !modeloMoradia(o.modeloId).rural).sort((a, b) => a.preco - b.preco);
      // Capaz = cabe no financiamento e a entrada existe (na conta, ou nas aplicações — a tela oferece tirar de lá).
      for (const o of cands) { const c: Acao = { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true }; if (podeTentar(disponibilidade(w, c)) || podeTentar(disponibilidade(w, { tipo: 'resgatar_e', acao: c } as Acao))) { capaz = true; break; } }
      if (!capaz && cands[0]) motivo = disponibilidade(w, { tipo: 'comprar_imovel', ofertaId: cands[0].id, financiar: true, morar: true }).motivo?.replace(/[\d.]+/g, '#').slice(0, 70);
      if (!cands.length) motivo = 'nenhuma oferta à venda na cidade';
    });
    if (v.morte) continue;
    const imovel = v.financas.bens.filter(b => b.tipo === 'imovel');
    const sm = renda35 / SALARIO_MINIMO;
    out.push({ base, classe: v.origem.classe, faixa: sm < 2 ? 'até 2 SM' : sm < 5 ? '2–5 SM' : sm < 10 ? '5–10 SM' : '10+ SM', capaz, comprou: imovel.some(b => !b.herdado), herdou: imovel.some(b => b.herdado), motivo: capaz ? undefined : motivo });
  }
  const tabela = (chave: (l: Linha) => string, titulo: string) => {
    const grupos = [...new Set(out.map(chave))];
    console.log(`\n| ${titulo} | vidas | capaz de comprar (em algum ano, 28–40) | comprou | entre os capazes, comprou | herdou |\n| --- | --- | --- | --- | --- | --- |`);
    for (const g of grupos) {
      const l = out.filter(x => chave(x) === g);
      const cap = l.filter(x => x.capaz);
      console.log(`| ${g} | ${l.length} | ${pct(l.map(x => x.capaz))} | ${pct(l.map(x => x.comprou))} | ${pct(cap.map(x => x.comprou))} | ${pct(l.map(x => x.herdou))} |`);
    }
  };
  console.log(`- ${out.length} vidas. Casa própria (comprada) aos 40: **${pct(out.map(x => x.comprou))}**; capaz de comprar em algum ano: **${pct(out.map(x => x.capaz))}**.`);
  tabela(x => x.base, 'estratégia');
  tabela(x => x.faixa, 'renda aos 35');
  tabela(x => x.classe, 'origem');
  const motivos = out.filter(x => x.motivo).reduce((m, x) => m.set(x.motivo!, (m.get(x.motivo!) ?? 0) + 1), new Map<string, number>());
  console.log(`\n- Entre quem nunca foi capaz, o que barrava a oferta mais barata: ${[...motivos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `"${k}" (${n})`).join('; ')}.`);
}

/* ============================================================ E. Ajuda */

function ajuda(): void {
  console.log('\n## E. Ajuda da família até os 40 (vidas comuns)\n');
  const bases = ['familiar', 'economico', 'estudioso', 'social', 'impulsivo', 'gastador'];
  const M = N * 3;
  type Linha = { classe: string; base: string; vezes: number; total: number; primeira?: number; porQuem: string[]; folgaDoAjudante: number[] };
  const out: Linha[] = [];
  for (let s = 1; s <= M; s++) {
    const base = bases[s % bases.length];
    const l: Linha = { classe: '', base, vezes: 0, total: 0, porQuem: [], folgaDoAjudante: [] };
    const v = viver(nascer(50000 + s), 40, base, () => [], ['recusar_proposta', 'afastar_proposta'], criarRng(s + 3), w => {
      for (const [k, t] of Object.entries(w.fatos)) {
        if (!k.startsWith('ajudou_') || t !== w.t) continue;
        const p = w.pessoas[k.slice(7)];
        l.vezes++; l.primeira ??= idade(w);
        l.porQuem.push(w.vinculos[p?.id ?? '']?.parentesco ?? '?');
        if (p) l.folgaDoAjudante.push(p.renda / SALARIO_MINIMO);
      }
      for (const a of w.origem.apoios ?? []) if (a.t === w.t && a.sentido === 'recebeu') { l.total += a.valor; if (!Object.keys(w.fatos).some(k => k.startsWith('ajudou_') && w.fatos[k] === w.t)) { l.vezes++; l.primeira ??= idade(w); l.porQuem.push('pedido'); } }
    });
    if (v.morte) continue;
    l.classe = v.origem.classe;
    out.push(l);
  }
  const recebeu = out.filter(x => x.vezes > 0);
  console.log(`- ${out.length} vidas. Recebeu ajuda até os 40: **${pct(out.map(x => x.vezes > 0))}**. Entre elas: vezes (mediana) ${mediana(recebeu.map(x => x.vezes))}, máximo ${Math.max(0, ...recebeu.map(x => x.vezes))}; primeira ajuda (mediana) aos ${mediana(recebeu.map(x => x.primeira ?? 0))}.`);
  const quem = recebeu.flatMap(x => x.porQuem).reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  console.log(`- Quem ajudou: ${[...quem.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}.`);
  const folgas = recebeu.flatMap(x => x.folgaDoAjudante);
  console.log(`- Renda de quem ajudou (em salários mínimos): mediana ${mediana(folgas).toFixed(1)}; ajudantes com menos de 1,5 SM: ${pct(folgas.map(x => x < 1.5))}.`);
  console.log('\n| origem | vidas | recebeu ajuda | vezes (mediana, entre quem recebeu) | 3+ vezes |\n| --- | --- | --- | --- | --- |');
  for (const c of [...new Set(out.map(x => x.classe))]) {
    const l = out.filter(x => x.classe === c); const r = l.filter(x => x.vezes > 0);
    console.log(`| ${c} | ${l.length} | ${pct(l.map(x => x.vezes > 0))} | ${r.length ? mediana(r.map(x => x.vezes)) : '—'} | ${pct(l.map(x => x.vezes >= 3))} |`);
  }
  console.log('\n| estratégia | recebeu ajuda | 3+ vezes |\n| --- | --- | --- |');
  for (const b of bases) { const l = out.filter(x => x.base === b); console.log(`| ${b} | ${pct(l.map(x => x.vezes > 0))} | ${pct(l.map(x => x.vezes >= 3))} |`); }
}

const so = process.env.SO?.split(',');
console.log(`# Simulação FIX 3.1 — ${N} vidas por grupo`);
if (!so || so.includes('A')) medicina();
if (!so || so.includes('B')) esportes();
if (!so || so.includes('C')) arte();
if (!so || so.includes('D')) patrimonio();
if (!so || so.includes('E')) ajuda();
