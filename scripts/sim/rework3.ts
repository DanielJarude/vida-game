/**
 * Simulador comparativo do REWORK 3 — origem, formação e vida concreta.
 *
 *   npx esbuild scripts/sim/rework3.ts --bundle --platform=node --outfile=/tmp/r3.cjs
 *   VIDAS=40 node /tmp/r3.cjs
 *
 * Amostra pequena, para erros grosseiros (a de mil vidas vem depois do
 * playtest integrado). Sempre só o que o jogador pode fazer
 * (`disponibilidade` → `executar`), com as mesmas sementes em cada grupo:
 *
 *   A origem    — a mesma pessoa (semente) nascida em casas diferentes, com o
 *                 mesmo jeito de viver: aos 15, 25, 40 e 60;
 *   B formação  — passivo × persegue estudo (atividades, ENEM, faculdade) ×
 *                 técnico (instituto federal) × trabalho + estudo × volta aos 30;
 *   C material  — quando sai de casa, quem volta, aluguel, imóvel, veículo,
 *                 mudança, ajuda da família (dada e recebida);
 *   E crime     — nunca persegue × exposto, recusa × aprofunda.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Classe, Vida } from '../../src/motor/tipos';
import { idade, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { estrategia } from './estrategias';
import { balanco, rendaPropriaMensal } from '../../src/motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { recursosDaFamilia } from '../../src/motor/sistemas/origem';
import { independencia } from '../../src/motor/sistemas/independencia';
import { instituicaoAtual, ROTINA_DA_OFERTA } from '../../src/motor/sistemas/formacao';
import { imagemPublica } from '../../src/motor/sistemas/notoriedade';
import { nivelEsc } from '../../src/motor/sistemas/escola';

const N = Number(process.env.VIDAS ?? 40);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am', 'tarauaca-ac', 'campinas-sp'];
const media = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 100) / 100 : 0);
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const mediana = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

type Agente = (v: Vida, r: Rng) => Acao[];
type Decisor = (v: Vida, r: Rng) => string;

function viverCom(v: Vida, ate: number, agir: Agente, decidir: Decisor, r: Rng): Vida {
  while (!v.morte && idade(v) < ate) {
    for (const a of agir(v, r)) {
      if (!tenta(v, a)) continue;
      v = executar(v, a).vida;
      for (let k = 0; k < 10 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir(v, r) }).vida;
    }
    v = avancarAno(v).vida;
    for (let k = 0; k < 10 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir(v, r) }).vida;
  }
  return v;
}

/** Decide como a estratégia base — com as preferências de cada grupo na frente. */
function decisor(base: string, prefs: string[] = []): Decisor {
  const e = estrategia(base);
  return (v, r) => {
    const m = v.momento!;
    const livres = m.opcoes.filter(o => !o.bloqueio);
    for (const p of prefs) { const o = livres.find(x => x.id === p); if (o) return o.id; }
    return e.decidir(v, m, r);
  };
}

/** Entrar nas atividades da instituição (as que a estratégia de estudo faria). */
function atividadesDaFormacao(v: Vida, quais: string[]): Acao[] {
  const inst = instituicaoAtual(v);
  if (!inst) return [];
  return inst.ofertas.map(o => ROTINA_DA_OFERTA[o]).filter((id): id is string => !!id && quais.includes(id) && !v.rotinas.some(r => r.id === id)).map(id => ({ tipo: 'rotina', id, ativa: true, nivel: 1 }) as Acao);
}
/** Aceitar portas de formação (o convite do professor, a prova do IF). */
function portasDeFormacao(v: Vida, tipos: string[]): Acao[] {
  return v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true }) as Acao);
}

const nascer = (s: number, classe?: Classe) => criarVida({ nome: 'Ana', sobrenome: 'Souza', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: s, classe });

/* ============================================================== A. Origem */

function origem(): void {
  console.log('\n## A. Origem (a mesma semente em casas diferentes; estratégia "familiar")\n');
  const idades = [15, 25, 40, 60];
  const linhas: string[] = [];
  const porClasse: Record<string, Record<number, { esc: number[]; renda: number[]; fora: boolean[]; liquido: number[]; humor: number[]; superior: boolean[]; privada: boolean[]; folga: number[] }>> = {};
  for (const classe of ['vulneravel', 'trabalhadora', 'media', 'alta'] as Classe[]) {
    porClasse[classe] = {};
    for (const i of idades) porClasse[classe][i] = { esc: [], renda: [], fora: [], liquido: [], humor: [], superior: [], privada: [], folga: [] };
    const e = estrategia('familiar');
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 13);
      let v = nascer(1000 + s, classe);
      for (const i of idades) {
        v = viverCom(v, i, (x, rr) => e.agir(x, rr), decisor('familiar'), r);
        if (v.morte) break;
        const d = porClasse[classe][i];
        d.esc.push(nivelEsc(v.educacao.escolaridade));
        d.renda.push(rendaPropriaMensal(v));
        d.fora.push(!moraComFamiliaDeOrigem(v));
        d.liquido.push(balanco(v).liquido);
        d.humor.push(v.mente.felicidade);
        d.superior.push(v.educacao.concluidos.some(c => c.nivel === 'superior') || !!v.educacao.matricula);
        d.privada.push(v.fatos['estudou_privada'] !== undefined);
        d.folga.push(recursosDaFamilia(v).folga);
      }
    }
  }
  linhas.push('| origem | idade | escolaridade (0–10) | renda própria mediana | fora de casa | patrimônio líq. mediano | humor | superior (cursando ou feito) | estudou em particular | folga da casa de origem |');
  linhas.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const [c, porIdade] of Object.entries(porClasse)) for (const i of idades) {
    const d = porIdade[i];
    linhas.push(`| ${c} | ${i} | ${media(d.esc)} | ${mediana(d.renda)} | ${pct(d.fora)} | ${mediana(d.liquido)} | ${media(d.humor)} | ${pct(d.superior)} | ${pct(d.privada)} | ${media(d.folga)} |`);
  }
  console.log(linhas.join('\n'));
}

/* ============================================================ B. Formação */

function formacao(): void {
  console.log('\n## B. Formação (mesmas sementes; o que muda é o que a pessoa persegue)\n');
  const grupos: { nome: string; base: string; extra: (v: Vida) => Acao[]; prefs?: string[] }[] = [
    { nome: 'passiva', base: 'passivo', extra: () => [] },
    { nome: 'persegue estudo', base: 'estudioso', extra: v => [...atividadesDaFormacao(v, ['olimpiada', 'reforco', 'projeto_escola', 'clube_ciencias', 'iniciacao', 'monitoria', 'grupo_estudos']), ...portasDeFormacao(v, ['iniciacao', 'selecao_tecnico'])] },
    { nome: 'técnico (IF)', base: 'familiar', extra: v => [...portasDeFormacao(v, ['selecao_tecnico', 'iniciacao']), ...atividadesDaFormacao(v, ['projeto_tecnico'])], prefs: ['curso0', 'curso1', 'curso2', 'area'] },
    { nome: 'trabalho + estudo', base: 'ascensao', extra: v => atividadesDaFormacao(v, ['grupo_estudos']) },
    { nome: 'volta aos 30', base: 'impulsivo', extra: v => (idade(v) >= 30 && !v.educacao.matricula && !v.educacao.concluidos.some(c => c.nivel === 'superior') ? voltarAEstudar(v) : []) }
  ];
  const linhas = ['| trajetória | IF (integrado) | técnico concluído | superior aos 25 | superior aos 40 | vivências/vida | com feito | professor na vida | iniciação científica | estágio/indicação pela formação | renda mediana aos 40 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const e = estrategia(g.base);
    const d = { integrado: [] as boolean[], tecnico: [] as boolean[], sup25: [] as boolean[], sup40: [] as boolean[], viv: [] as number[], feito: [] as boolean[], prof: [] as boolean[], ic: [] as boolean[], porta: [] as boolean[], renda40: [] as number[] };
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 17);
      let v = nascer(2000 + s);
      let integrou = false; let portaFormacao = false;
      const agir: Agente = (x, rr) => { if (x.educacao.basica?.integrado) integrou = true; if (x.caminhos.oportunidades.some(o => o.tipo === 'estagio' && o.pessoaId || o.tipo === 'indicacao' && x.vinculos[o.pessoaId ?? '']?.formacao)) portaFormacao = true; return [...g.extra(x), ...e.agir(x, rr)]; };
      v = viverCom(v, 25, agir, decisor(g.base, g.prefs), r);
      if (v.morte) continue;
      d.sup25.push(v.educacao.concluidos.some(c => c.nivel === 'superior'));
      v = viverCom(v, 40, agir, decisor(g.base, g.prefs), r);
      if (v.morte) continue;
      d.integrado.push(integrou);
      d.tecnico.push(v.educacao.concluidos.some(c => c.nivel === 'tecnico'));
      d.sup40.push(v.educacao.concluidos.some(c => c.nivel === 'superior'));
      const viv = v.educacao.vivencias ?? [];
      d.viv.push(viv.length);
      d.feito.push(viv.some(x => !!x.feito));
      d.prof.push(vinculosVivos(v).some(x => x.vin.formacao && x.vin.formacao.papel !== 'colega'));
      d.ic.push(viv.some(x => x.tipo === 'iniciacao'));
      d.porta.push(portaFormacao);
      d.renda40.push(rendaPropriaMensal(v));
    }
    linhas.push(`| ${g.nome} | ${pct(d.integrado)} | ${pct(d.tecnico)} | ${pct(d.sup25)} | ${pct(d.sup40)} | ${media(d.viv)} | ${pct(d.feito)} | ${pct(d.prof)} | ${pct(d.ic)} | ${pct(d.porta)} | ${mediana(d.renda40)} |`);
  }
  console.log(linhas.join('\n'));
}

function voltarAEstudar(v: Vida): Acao[] {
  if (v.educacao.enem.every(x => x.t < v.t - 12) && tenta(v, { tipo: 'enem' })) return [{ tipo: 'enem' }];
  const ops = opcoesDeCurso(v).map((o, idx) => ({ o, idx })).filter(x => x.o.curso.nivel === 'superior' && podeTentar(x.o.veredito) && (x.o.via === 'ead' || x.o.via === 'sisu' || x.o.via === 'prouni'));
  return ops.length ? [{ tipo: 'matricular', indice: ops[0].idx }] : [];
}

/* =========================================================== C. Material */

function material(): void {
  console.log('\n## C. Vida material (estratégias típicas misturadas)\n');
  const bases = ['familiar', 'ambicioso', 'social', 'economico', 'gastador', 'passivo', 'estudioso', 'impulsivo'];
  const d = { saiu: [] as number[], nunca: [] as boolean[], voltou: [] as boolean[], aluguel40: [] as boolean[], imovel40: [] as boolean[], veiculo40: [] as boolean[], mudou: [] as boolean[], recebeu: [] as boolean[], negado: [] as boolean[], deu: [] as boolean[], pediu: [] as boolean[], fase18: {} as Record<string, number>, fase25: {} as Record<string, number>, fase40: {} as Record<string, number> };
  for (let s = 1; s <= N; s++) {
    const base = bases[s % bases.length];
    const e = estrategia(base);
    const r = criarRng(s * 19);
    let v = nascer(3000 + s);
    let saiu: number | undefined;
    for (const alvo of [18, 25, 40]) {
      while (!v.morte && idade(v) < alvo) {
        v = viverCom(v, idade(v) + 1, (x, rr) => e.agir(x, rr), decisor(base), r);
        if (saiu === undefined && !moraComFamiliaDeOrigem(v)) saiu = idade(v);
      }
      if (v.morte) break;
      const f = independencia(v).fase;
      const m = alvo === 18 ? d.fase18 : alvo === 25 ? d.fase25 : d.fase40;
      m[f] = (m[f] ?? 0) + 1;
    }
    if (v.morte) continue;
    if (saiu !== undefined) d.saiu.push(saiu);
    d.nunca.push(saiu === undefined);
    d.voltou.push((v.fatos['voltas_para_os_pais'] ?? 0) > 0);
    d.aluguel40.push(v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica');
    d.imovel40.push(v.financas.bens.some(b => b.tipo === 'imovel'));
    d.veiculo40.push(v.financas.bens.some(b => b.tipo === 'veiculo'));
    d.mudou.push(v.fatos['chegou_cidade'] !== undefined);
    d.recebeu.push((v.origem.apoios ?? []).some(a => a.sentido === 'recebeu'));
    d.negado.push((v.origem.apoios ?? []).some(a => a.sentido === 'negado'));
    d.deu.push((v.origem.apoios ?? []).some(a => a.sentido === 'deu'));
    d.pediu.push(v.fatos['familia_pediu'] !== undefined);
  }
  console.log(`- Idade em que saiu de casa: mediana ${mediana(d.saiu)}, de ${Math.min(...d.saiu)} a ${Math.max(...d.saiu)}; nunca saiu até os 40: ${pct(d.nunca)}; voltou para a família alguma vez: ${pct(d.voltou)}.`);
  console.log(`- Aos 40: de aluguel ${pct(d.aluguel40)}, com imóvel ${pct(d.imovel40)}, com veículo ${pct(d.veiculo40)}; mudou de cidade alguma vez ${pct(d.mudou)}.`);
  console.log(`- Família: recebeu ajuda ${pct(d.recebeu)}; ouviu um não ${pct(d.negado)}; ajudou a casa de origem ${pct(d.deu)}; a casa de origem pediu ajuda ${pct(d.pediu)}.`);
  const fases = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
  console.log(`- Independência aos 18: ${fases(d.fase18)}.`);
  console.log(`- Independência aos 25: ${fases(d.fase25)}.`);
  console.log(`- Independência aos 40: ${fases(d.fase40)}.`);
}

/* ================================================================ E. Crime */

function crime(): void {
  console.log('\n## E. Caminho criminal (mesmas sementes)\n');
  const grupos: { nome: string; base: string; prefs: string[]; persegue: boolean }[] = [
    { nome: 'vida comum (típica, nunca persegue)', base: 'familiar', prefs: ['recusar_proposta', 'afastar_proposta', 'parar_esquema'], persegue: false },
    { nome: 'exposta (jeito impulsivo), recusa quando aparece', base: 'impulsivo', prefs: ['recusar_proposta', 'afastar_proposta', 'parar_esquema'], persegue: false },
    { nome: 'aprofunda de propósito', base: 'impulsivo', prefs: ['aceitar_proposta', 'fundo', 'seguir_esquema'], persegue: true }
  ];
  const linhas = ['| grupo | teve proposta | entrou | processo | prisão | ganhos medianos (quem entrou) | ainda dentro aos 45 | imagem pública sem motivo |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const e = estrategia(g.base);
    const d = { proposta: [] as boolean[], entrou: [] as boolean[], processo: [] as boolean[], prisao: [] as boolean[], ganhos: [] as number[], dentro: [] as boolean[], imagem: [] as boolean[] };
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 23);
      let v = nascer(4000 + s);
      const agir: Agente = (x, rr) => {
        const out = e.agir(x, rr);
        if (g.persegue && idade(x) >= 16) {
          // Quem persegue vai atrás de quem sabe que anda nisso (a conversa só existe com essa pessoa).
          const quem = vinculosVivos(x).find(y => x.fatos[`sabe_por_fora_${y.p.id}`] !== undefined);
          if (quem) out.unshift({ tipo: 'pessoa', pessoaId: quem.p.id, interacao: 'por_fora' });
        }
        return out;
      };
      v = viverCom(v, 45, agir, decisor(g.base, g.prefs), r);
      d.proposta.push(v.fatos['proposta_ilicita'] !== undefined);
      d.entrou.push(v.fatos['envolveu_se'] !== undefined);
      d.processo.push(!!v.justica?.antecedentes.length || !!v.justica?.processo);
      d.prisao.push(!!v.justica?.antecedentes.some(a => a.desfecho === 'prisao') || !!v.justica?.prisao);
      if (v.caminhos.envolvimento) d.ganhos.push(v.caminhos.envolvimento.ganhos);
      d.dentro.push(!!v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined);
      d.imagem.push(!!imagemPublica(v) && (v.notoriedade?.valor ?? 0) < 20);
    }
    linhas.push(`| ${g.nome} | ${pct(d.proposta)} | ${pct(d.entrou)} | ${pct(d.processo)} | ${pct(d.prisao)} | ${mediana(d.ganhos)} | ${pct(d.dentro)} | ${pct(d.imagem)} |`);
  }
  console.log(linhas.join('\n'));
}

const so = process.env.SO?.split(',');
console.log(`# Simulação REWORK 3 — ${N} vidas por grupo`);
if (!so || so.includes('A')) origem();
if (!so || so.includes('B')) formacao();
if (!so || so.includes('C')) material();
if (!so || so.includes('E')) crime();
