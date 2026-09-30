/**
 * Simulações dirigidas do FIX pós-REWORK 3 (amostras para regressão, não a
 * de mil vidas):
 *
 *   npx esbuild scripts/sim/fixPosRework3.ts --bundle --platform=node --outfile=/tmp/fpr3.cjs
 *   VIDAS=40 node /tmp/fpr3.cjs            (SO=A,B,C,D,E,F,G para rodar só alguns)
 *
 *   A profissões  — comum · arte · academia · esporte · negócio · crime
 *   B NPCs        — a parceria por 15–30 anos: cargo, renda e texto concordam?
 *   C crime       — não persegue · recebe e recusa · aprofunda (investigação, processo, prisão, saída)
 *   D formação    — segue a área · muda de área · volta a estudar · pós · academia
 *   E patrimônio  — baixa · média · alta · milionário: o que o dinheiro compra de vida
 *   F eventos     — várias vidas: quanto a infância se repete
 *   G calibrações — casa própria aos 40, ajuda da família até 40, proposta ilícita até 45
 *
 * Sempre pelo que o jogador pode fazer (`disponibilidade` → `executar`).
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { estrategia } from './estrategias';
import { ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { negocioAberto, negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { experienciasPossiveis } from '../../src/motor/sistemas/experiencias';
import { modeloVeiculo } from '../../src/motor/dados/bens';
import { catalogoDeVeiculos } from '../../src/motor/sistemas/mercado';
import { garantirFrente } from '../../src/motor/sistemas/frentes';

const N = Number(process.env.VIDAS ?? 40);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am', 'tarauaca-ac', 'campinas-sp'];
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const mediana = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);

type Agente = (v: Vida, r: Rng) => Acao[];

function nascer(semente: number): Vida {
  const r = criarRng(semente);
  return criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: r.chance(0.5) ? 'feminino' : 'masculino', municipioId: CIDADES[semente % CIDADES.length], semente });
}

/** Vive até `ate`, com as ações do agente e a estratégia base decidindo (com preferências na frente). */
function viver(v: Vida, ate: number, base: string, extra: Agente = () => [], prefs: string[] = [], r = criarRng(1)): Vida {
  const e = estrategia(base);
  const decidir = () => {
    const m = v.momento!;
    const livres = m.opcoes.filter(o => !o.bloqueio);
    for (const p of prefs) { const o = livres.find(x => x.id === p); if (o) return o.id; }
    // A prova teórica da autoescola: o jogador simulado acerta metade das vezes.
    if (m.situacaoId === 'cnh_prova') return livres[r.int(0, livres.length - 1)].id;
    return e.decidir(v, m, r);
  };
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  while (!v.morte && idade(v) < ate) {
    for (const a of [...extra(v, r), ...e.agir(v, r)]) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    // Portas que as próprias ações abriram neste ano (o convite depois do teste): o jogador as vê antes de virar o ano.
    for (const a of extra(v, r).filter(x => x.tipo === 'oportunidade')) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida;
    responder();
  }
  return v;
}

const nadaAconteceu = (v: Vida) => v.biografia.filter(b => /Nada aconteceu/.test(b.texto)).length;
const trilhaAtual = (v: Vida) => (v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined);

/* ============================================================ A. Profissões */

function profissoes(): void {
  console.log('\n## A. Profissões (até os 40)\n');
  const grupos: { nome: string; base: string; extra: Agente; alvo: (v: Vida) => boolean; prefs?: string[] }[] = [
    { nome: 'comum', base: 'familiar', extra: () => [], alvo: v => !!v.trabalho.atual },
    { nome: 'arte (teatro) — vive ou viveu de arte',  base: 'social', prefs: ['plano_1', 'plano_0', 'aceitar', 'montar', 'sim'], alvo: v => v.fatos['artista_profissional'] !== undefined || ['cena', 'musica', 'danca'].includes(trilhaAtual(v) ?? '') || ['cena', 'musica', 'danca'].includes(ocupacaoOuNula(v.trabalho.paralela?.ocupacaoId ?? '')?.trilha ?? ''),
      extra: v => { const i = idade(v); const out: Acao[] = []; if (i >= 10 && !v.rotinas.some(x => x.id === 'teatro')) out.push({ tipo: 'rotina', id: 'teatro', ativa: true, nivel: 2 } as Acao); if (i >= 14) for (const o of ['apresentar', 'audicao', 'trabalho_pequeno', 'edital']) out.push(P(o)); if (i >= 16) out.push(P('montar_grupo', 'teatro'), P('mostrar_trabalho')); for (const o of v.caminhos.oportunidades) if (o.tipo === 'convite' || o.tipo === 'edital_cultura') out.push({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao); return out; } },
    { nome: 'academia', base: 'estudioso', prefs: ['aceitar', 'sim'], alvo: v => ['academia', 'pesquisa', 'docencia_superior'].includes(trilhaAtual(v) ?? ''),
      extra: v => { const i = idade(v); const out: Acao[] = []; const tem = (n: string) => v.educacao.concluidos.some(c => c.nivel === n); if (i >= 22 && tem('superior') && !tem('doutorado')) { out.push(P('preparar_pos')); const ops = opcoesDeCurso(v); const k = ops.findIndex(o => (o.curso.id === (tem('mestrado') ? 'doutorado' : 'mestrado')) && podeTentar(o.veredito)); if (k >= 0 && !v.educacao.matricula) out.push({ tipo: 'matricular', indice: k } as Acao); } if (tem('doutorado')) { out.push({ tipo: 'candidatar', ocupacaoId: 'professor_univ' } as Acao, P('bolsa_pesquisa')); if (v.trabalho.atual?.ocupacaoId === 'professor_univ') out.push({ tipo: 'profissao', oque: 'academia', valor: 'projeto' } as unknown as Acao, { tipo: 'profissao', oque: 'academia', valor: 'orientar' } as unknown as Acao); } return out; } },
    { nome: 'esporte (futebol) — chegou a uma base', base: 'social', prefs: ['plano_0', 'aceitar', 'renovar', 'sim', 'entrar'], alvo: v => !!v.caminhos.esporte,
      extra: v => { const i = idade(v); const out: Acao[] = []; if (i >= 7 && i <= 17) { if (!v.rotinas.some(x => x.id === 'futebol' && (x.nivel ?? 1) >= 2)) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 } as Acao); out.push(P('treino_fundamentos', 'futebol'), P('pedir_teste', 'futebol')); } for (const o of v.caminhos.oportunidades) if (['peneira', 'convite'].includes(o.tipo)) out.push({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao); return out; } },
    { nome: 'negócio', base: 'ambicioso', alvo: v => !!negocioAberto(v),
      extra: (v, r) => { const i = idade(v); if (negocioAberto(v) || i < 26 || i > 50) return []; const l = negociosPossiveis(v).filter(x => podeTentar(x.veredito)).sort((a, b) => a.custo - b.custo); return l.length ? [{ tipo: 'abrir_negocio', negocio: r.pick(l.slice(0, 4)).t.id } as Acao] : []; } }
  ];
  const linhas = ['| grupo | no caminho (aos 40; esporte: alguma vez) | paralela | pausada | notoriedade ≥ 10 | currículo (mediana) | objetivos com 2+ tentativas | "Nada aconteceu" |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const d = { alvo: [] as boolean[], par: [] as boolean[], pausa: [] as boolean[], noto: [] as boolean[], curr: [] as number[], obj: [] as boolean[], nada: 0 };
    for (let s = 1; s <= N; s++) {
      const v = viver(nascer(9000 + s), 40, g.base, g.extra, g.prefs ?? [], criarRng(s * 31));
      if (v.morte) continue;
      d.alvo.push(g.alvo(v)); d.par.push(!!v.trabalho.paralela || v.biografia.some(b => /em paralelo/.test(b.texto)));
      d.pausa.push(!!v.trabalho.pausadas?.length || v.biografia.some(b => /em pausa|licença sem salário/.test(b.texto)));
      d.noto.push((v.notoriedade?.valor ?? 0) >= 10); d.curr.push(v.caminhos.curriculo?.length ?? 0);
      d.obj.push((v.caminhos.objetivos ?? []).some(o => o.tentativas >= 2)); d.nada += nadaAconteceu(v);
    }
    linhas.push(`| ${g.nome} | ${pct(d.alvo)} | ${pct(d.par)} | ${pct(d.pausa)} | ${pct(d.noto)} | ${mediana(d.curr)} | ${pct(d.obj)} | ${d.nada} |`);
  }
  console.log(linhas.join('\n'));
}

/* ================================================================= B. NPCs */

function npcs(): void {
  console.log('\n## B. A parceria por 15–30 anos (cargo, renda e texto concordam?)\n');
  const d = { casais: 0, cargos: [] as number[], demissoes: 0, recolocacoes: 0, violacoes: 0, anos: 0, congelados: 0 };
  for (let s = 1; s <= N; s++) {
    let v = viver(nascer(12000 + s), 28, 'familiar', () => [], ['sim', 'chamar'], criarRng(s));
    if (v.morte) continue;
    const par = parceiro(v);
    if (!par) continue;
    d.casais++;
    const id = par.p.id;
    const cargos = new Set<string>();
    let antes = par.p.renda;
    let rendaIgual = 0;
    for (let k = 0; k < 22 && !v.morte; k++) {
      v = viver(v, idade(v) + 1, 'familiar', () => [], ['sim'], criarRng(s * 7 + k));
      const p = v.pessoas[id];
      if (!p?.vivo || !v.vinculos[id]?.romance) break;
      d.anos++;
      cargos.add(p.ocupacao ?? '');
      if (antes > 0 && p.renda === 0) d.demissoes++;
      if (antes === 0 && p.renda > 0) d.recolocacoes++;
      if (p.renda === antes && p.renda > 0) rendaIgual++;
      const desemp = /desempregad/.test(p.ocupacao ?? '');
      if ((p.renda > 0 && desemp) || (p.renda === 0 && p.ocupacaoId && !desemp && !/aposentad|estudante/.test(p.ocupacao ?? ''))) d.violacoes++;
      antes = p.renda;
    }
    d.cargos.push(cargos.size);
    if (rendaIgual >= 10) d.congelados++;
  }
  console.log(`- ${d.casais} parcerias acompanhadas (${d.anos} anos-pessoa). Cargos diferentes por parceria: mediana ${mediana(d.cargos)}, máximo ${Math.max(0, ...d.cargos)}.`);
  console.log(`- Demissões: ${d.demissoes}; recolocações: ${d.recolocacoes}. Renda congelada por 10+ anos seguidos: ${d.congelados}.`);
  console.log(`- Incoerências (empregado com renda zero, "desempregado" com renda): **${d.violacoes}**.`);
}

/* ================================================================ C. Crime */

function crime(): void {
  console.log('\n## C. Caminho criminal (até os 45, mesmas sementes)\n');
  const grupos = [
    { nome: 'não persegue (vida comum)', base: 'familiar', prefs: ['recusar_proposta', 'afastar_proposta', 'parar_esquema'], persegue: false },
    { nome: 'recebe e recusa (jeito impulsivo)', base: 'impulsivo', prefs: ['recusar_proposta', 'afastar_proposta', 'parar_esquema'], persegue: false },
    { nome: 'aprofunda', base: 'impulsivo', prefs: ['aceitar_proposta', 'fundo', 'seguir_esquema'], persegue: true },
    { nome: 'aprofunda, mas fica na moita', base: 'impulsivo', prefs: ['aceitar_proposta', 'moita', 'seguir_esquema'], persegue: true }
  ];
  const linhas = ['| grupo | proposta | entrou | investigado | arquivada | processo | prisão | saiu (parou) | ainda dentro aos 45 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const d = { proposta: [] as boolean[], entrou: [] as boolean[], inv: [] as boolean[], arq: [] as boolean[], proc: [] as boolean[], prisao: [] as boolean[], saiu: [] as boolean[], dentro: [] as boolean[] };
    for (let s = 1; s <= N; s++) {
      const agir: Agente = x => { if (!g.persegue || idade(x) < 16) return []; const quem = vinculosVivos(x).find(y => x.fatos[`sabe_por_fora_${y.p.id}`] !== undefined); return quem ? [{ tipo: 'pessoa', pessoaId: quem.p.id, interacao: 'por_fora' } as Acao] : []; };
      const v = viver(nascer(4000 + s), 45, g.base, agir, g.prefs, criarRng(s * 23));
      if (v.morte) continue;
      const entrou = v.fatos['envolveu_se'] !== undefined;
      d.proposta.push(v.fatos['proposta_ilicita'] !== undefined); d.entrou.push(entrou);
      if (!entrou) continue;
      d.inv.push((v.fatos['investigacoes'] ?? 0) > 0); d.arq.push((v.fatos['investigacoes_arquivadas'] ?? 0) > 0);
      d.proc.push(!!v.justica?.antecedentes.length || !!v.justica?.processo);
      d.prisao.push(!!v.justica?.antecedentes.some(a => a.desfecho === 'prisao') || !!v.justica?.prisao);
      d.saiu.push(v.caminhos.envolvimento?.parou !== undefined);
      d.dentro.push(!!v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined);
    }
    linhas.push(`| ${g.nome} | ${pct(d.proposta)} | ${pct(d.entrou)} | ${pct(d.inv)} | ${pct(d.arq)} | ${pct(d.proc)} | ${pct(d.prisao)} | ${pct(d.saiu)} | ${pct(d.dentro)} |`);
  }
  console.log(linhas.join('\n'));
  console.log('\n(Colunas depois de "entrou": entre quem entrou.)');
}

/* ============================================================== D. Formação */

function formacao(): void {
  console.log('\n## D. Formação e trabalho (aos 35)\n');
  const grupos: { nome: string; base: string; extra: Agente }[] = [
    { nome: 'segue a área', base: 'estudioso', extra: () => [] },
    { nome: 'muda de área (outra graduação depois de formado)', base: 'estudioso', extra: v => { const i = idade(v); if (i < 26 || v.educacao.matricula || v.educacao.concluidos.filter(c => c.nivel === 'superior').length !== 1) return []; const area = v.educacao.concluidos.find(c => c.nivel === 'superior')!.area; const ops = opcoesDeCurso(v); const k = ops.findIndex(o => o.curso.nivel === 'superior' && o.curso.area !== area && podeTentar(o.veredito) && (o.mensalidade < 1200 || o.rede === 'publica')); return k >= 0 ? [{ tipo: 'matricular', indice: k } as Acao] : []; } },
    { nome: 'volta a estudar aos 30 (passivo até lá)', base: 'passivo', extra: v => { const i = idade(v); if (i < 30 || v.educacao.matricula) return []; const ops = opcoesDeCurso(v); const k = ops.findIndex(o => ['superior', 'tecnico'].includes(o.curso.nivel) && podeTentar(o.veredito) && (o.mensalidade < 900 || o.rede === 'publica')); return i === 30 ? [{ tipo: 'enem' } as Acao, ...(k >= 0 ? [{ tipo: 'matricular', indice: k } as Acao] : [])] : k >= 0 ? [{ tipo: 'matricular', indice: k } as Acao] : []; } },
    { nome: 'pós (especialização ou mestrado)', base: 'ambicioso', extra: v => { const tem = (n: string) => v.educacao.concluidos.some(c => c.nivel === n); if (!tem('superior') || v.educacao.matricula || tem('mestrado')) return []; const ops = opcoesDeCurso(v); const k = ops.findIndex(o => ['pos', 'mestrado'].includes(o.curso.nivel) && podeTentar(o.veredito)); return [P('preparar_pos'), ...(k >= 0 ? [{ tipo: 'matricular', indice: k } as Acao] : [])]; } }
  ];
  const linhas = ['| grupo | superior | pós/mestrado | trabalha na área da formação | objetivo de seleção registrado | vagas "para você" da área (1ª posição) |', '| --- | --- | --- | --- | --- | --- |'];
  for (const g of grupos) {
    const d = { sup: [] as boolean[], pos: [] as boolean[], area: [] as boolean[], obj: [] as boolean[] };
    for (let s = 1; s <= N; s++) {
      const v = viver(nascer(15000 + s), 35, g.base, g.extra, ['aceitar', 'sim'], criarRng(s * 13));
      if (v.morte) continue;
      const sup = v.educacao.concluidos.filter(c => c.nivel === 'superior');
      d.sup.push(sup.length > 0); d.pos.push(v.educacao.concluidos.some(c => ['pos', 'mestrado', 'doutorado'].includes(c.nivel)));
      const oc = v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId) : undefined;
      if (sup.length) d.area.push(!!oc?.area && sup.some(c => oc.area!.includes(c.area as never)));
      d.obj.push((v.caminhos.objetivos ?? []).some(o => o.id.startsWith('selecao:')));
    }
    linhas.push(`| ${g.nome} | ${pct(d.sup)} | ${pct(d.pos)} | ${pct(d.area)} | ${pct(d.obj)} | — |`);
  }
  console.log(linhas.join('\n'));
}

/* ============================================================ E. Patrimônio */

function patrimonio(): void {
  console.log('\n## E. Patrimônio: o que o dinheiro compra de vida (dos 30 aos 42)\n');
  const faixas = [{ nome: 'baixa renda', conta: 0 }, { nome: 'média', conta: 60000 }, { nome: 'alta', conta: 400000 }, { nome: 'milionária', conta: 3000000 }];
  const linhas = ['| faixa | experiências vividas (mediana) | 2+ imóveis | veículo de terra | barco ou avião | habilitação rara | experiências oferecidas aos 30 |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const f of faixas) {
    const d = { exp: [] as number[], imoveis: [] as boolean[], terra: [] as boolean[], raro: [] as boolean[], hab: [] as boolean[], ofer: [] as number[] };
    for (let s = 1; s <= N; s++) {
      let v = viver(nascer(20000 + s), 30, 'ambicioso', () => [], [], criarRng(s));
      if (v.morte) continue;
      v.financas.conta += f.conta;
      d.ofer.push(experienciasPossiveis(v).length);
      const extra: Agente = (x, r) => {
        const out: Acao[] = [];
        for (const e of experienciasPossiveis(x)) if (r.chance(0.5)) out.push({ tipo: 'experiencia', id: e } as Acao);
        if (f.conta >= 400000) {
          const cat = catalogoDeVeiculos(x).filter(o => modeloVeiculo(o.modeloId).raro);
          if (cat.length && !x.financas.bens.some(b => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).raro) && r.chance(0.3)) out.push({ tipo: 'comprar_veiculo', ofertaId: cat[0].id, financiar: false } as Acao);
          if (x.financas.bens.some(b => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).habilitacao === 'nautica')) out.push({ tipo: 'habilitacao', qual: 'nautica' } as Acao);
          if (x.financas.bens.filter(b => b.tipo === 'imovel').length < 2 && r.chance(0.3)) out.push({ tipo: 'comprar_imovel', modeloId: 'apto_2q', financiar: false, morar: false } as Acao);
        }
        return out;
      };
      v = viver(v, 42, 'ambicioso', extra, [], criarRng(s * 3));
      if (v.morte) continue;
      d.exp.push(Object.keys(v.fatos).filter(k => k.startsWith('exp_')).length);
      d.imoveis.push(v.financas.bens.filter(b => b.tipo === 'imovel').length >= 2);
      d.terra.push(v.financas.bens.some(b => b.tipo === 'veiculo' && !modeloVeiculo(b.modeloId).raro));
      d.raro.push(v.financas.bens.some(b => b.tipo === 'veiculo' && !!modeloVeiculo(b.modeloId).raro));
      d.hab.push(v.trabalho.licencas.includes('nautica') || v.trabalho.licencas.includes('piloto'));
    }
    linhas.push(`| ${f.nome} | ${mediana(d.exp)} | ${pct(d.imoveis)} | ${pct(d.terra)} | ${pct(d.raro)} | ${pct(d.hab)} | ${mediana(d.ofer)} |`);
  }
  console.log(linhas.join('\n'));
}

/* ================================================================ F. Eventos */

function eventos(): void {
  console.log('\n## F. A infância se repete? (até os 12, por pares de vidas)\n');
  const vidas: Vida[] = [];
  for (let s = 1; s <= Math.min(N, 30); s++) vidas.push(viver(nascer(30000 + s), 12, 'familiar', () => [], [], criarRng(s)));
  const textos = vidas.map(v => new Set(v.biografia.filter(b => b.t - v.eu.tNasc < 12 * 12).map(b => b.texto.replace(/[A-ZÁÉÍÓÚ][a-záéíóúãõç]+( [A-ZÁÉÍÓÚ][a-záéíóúãõç]+)?/g, 'X'))));
  let pares = 0; let soma = 0;
  for (let a = 0; a < textos.length; a++) for (let b = a + 1; b < textos.length; b++) {
    const A = textos[a]; const B = textos[b];
    const inter = [...A].filter(x => B.has(x)).length;
    soma += inter / Math.max(1, Math.min(A.size, B.size)); pares++;
  }
  const freq = new Map<string, number>();
  for (const t of textos) for (const x of t) freq.set(x, (freq.get(x) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`- ${vidas.length} infâncias. Linhas iguais entre duas vidas quaisquer (nomes trocados por X): **${Math.round(soma / pares * 100)}%** em média.`);
  console.log(`- "A primeira palavra" aparece em ${pct(vidas.map(v => v.biografia.some(b => /primeira palavra/i.test(b.texto))))} das vidas; "primeiros passos" em ${pct(vidas.map(v => v.biografia.some(b => /primeiros passos|Andou pela primeira vez|Aprendeu a andar/.test(b.texto))))}.`);
  console.log(`- As linhas mais repetidas: ${top.map(([t, n]) => `"${t.slice(0, 60)}…" (${n})`).join('; ')}.`);
}

/* =========================================================== G. Calibrações */

function calibracoes(): void {
  console.log('\n## G. Calibrações\n');
  const casa: boolean[] = []; const ajuda: boolean[] = []; const proposta: boolean[] = [];
  const M = N * 2;
  for (let s = 1; s <= M; s++) {
    const base = ['familiar', 'economico', 'estudioso', 'social'][s % 4];
    let v = viver(nascer(40000 + s), 40, base, () => [], ['recusar_proposta', 'afastar_proposta'], criarRng(s));
    if (v.morte) continue;
    casa.push(v.financas.bens.some(b => b.tipo === 'imovel'));
    ajuda.push((v.origem.apoios ?? []).some(a => a.sentido === 'recebeu') || (v.fatos['ajudas_recebidas'] ?? 0) > 0);
    v = viver(v, 45, base, () => [], ['recusar_proposta', 'afastar_proposta'], criarRng(s + 1));
    if (!v.morte) proposta.push(v.fatos['proposta_ilicita'] !== undefined);
  }
  console.log(`- ${M} vidas comuns (familiar, econômica, estudiosa, social). Casa própria aos 40: **${pct(casa)}**. Recebeu ajuda da família até 40: **${pct(ajuda)}**. Proposta ilícita até 45: **${pct(proposta)}**.`);
}

void garantirFrente;
const so = process.env.SO?.split(',');
console.log(`# Simulação FIX pós-REWORK 3 — ${N} vidas por grupo`);
if (!so || so.includes('A')) profissoes();
if (!so || so.includes('B')) npcs();
if (!so || so.includes('C')) crime();
if (!so || so.includes('D')) formacao();
if (!so || so.includes('E')) patrimonio();
if (!so || so.includes('F')) eventos();
if (!so || so.includes('G')) calibracoes();
