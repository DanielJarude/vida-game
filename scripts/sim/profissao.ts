/**
 * Simulador da VIDA PROFISSIONAL (rework do Trabalho) e da VIDA POLÍTICA.
 *
 *   npx esbuild scripts/sim/profissao.ts --bundle --platform=node --outfile=/tmp/prof.cjs
 *   VIDAS=30 SAIDA=/tmp/prof node /tmp/prof.cjs
 *
 * Onze jeitos de viver o trabalho. Cada estratégia só usa o que o motor
 * oferece (`disponibilidade`, as ações contextuais, as decisões abertas):
 * nada é forçado. Pergunta: alguma estratégia domina? Abrir empresa vira a
 * escolha ótima universal? Trabalho excessivo cobra? Preservar a saúde vale?
 * Atletas têm carreira curta? Negócios falham? O desemprego continua
 * possível? A riqueza explode? A política é uma trajetória (com derrotas)?
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS } from '../../src/motor/dados/lugares';
import { patrimonio, rendaPropriaMensal } from '../../src/motor/sistemas/dinheiro';
import { vagasParaVoce } from '../../src/motor/sistemas/relevancia';
import { negocioAtivo, negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { acoesDoTrabalho, modoDoTrabalho } from '../../src/motor/sistemas/profissao';
import { porContaPropria } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { ORDEM_CARGOS, chanceDeVitoria, dificuldade, forcaDaCandidatura } from '../../src/motor/sistemas/politica';
export const DBG: string[] = [];

const VIDAS = Number(process.env.VIDAS ?? 30);
const SAIDA = process.env.SAIDA ?? '/tmp/prof';
const ATE = Number(process.env.ATE ?? 70);
mkdirSync(SAIDA, { recursive: true });

type Nome = 'convencional' | 'puxado' | 'preserva' | 'negociador' | 'empreendedor' | 'empreendedor_cedo' | 'autonomo' | 'atleta_forca' | 'atleta_preserva' | 'politico' | 'politico_tardio';
const ESTRATEGIAS: Nome[] = ['convencional', 'puxado', 'preserva', 'negociador', 'empreendedor', 'empreendedor_cedo', 'autonomo', 'atleta_forca', 'atleta_preserva', 'politico', 'politico_tardio'];

/** O que cada estratégia prefere quando a vida pergunta. */
const PREFERE: Record<Nome, string[]> = {
  convencional: [],
  puxado: ['seguir', 'aceitar', 'sabados', 'responsabilidade', 'ir'],
  preserva: ['normal', 'leve', 'familia', 'recusar', 'ficar', 'medico', 'descansar'],
  negociador: ['resultados', 'vaga', 'responsabilidade', 'condicao', 'negociar', 'aceitar'],
  empreendedor: ['guardado', 'pequeno', 'indicacao', 'experiente', 'insistir', 'bairro', 'qualidade', 'aceitar'],
  empreendedor_cedo: ['emprestimo', 'pequeno', 'guardado', 'jovem', 'insistir', 'preco'],
  autonomo: ['conta', 'formalizar', 'aceitar', 'insistir'],
  atleta_forca: ['ir', 'assinar', 'renovar', 'mercado', 'treinar', 'aceitar', 'recusar'],
  atleta_preserva: ['ir', 'assinar', 'renovar', 'treinador', 'perguntar', 'recusar'],
  politico: ['entrar', 'bairro', 'p0', 'fin_pequenas', 'rua_porta', 'tom_propostas', 'frente', 'promessa', 'recusar', 'nada', 'nao', 'explicar'],
  politico_tardio: ['entrar', 'bairro', 'p1', 'fin_proprio', 'fin_pequenas', 'rua_aliancas', 'tom_propostas', 'tecnica', 'grupo', 'pauta', 'nao']
};

interface Registro {
  estrategia: Nome;
  semente: number;
  vida: Vida;
  pat40?: number; pat60?: number; renda40?: number; saude60?: number;
  estresse: number[];
  desempregado35?: boolean; desempregado50?: boolean;
  limite: number;
}

function escolher(v: Vida, m: Momento, e: Nome, r: Rng): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  if (!livres.length) return m.opcoes[0].id;
  if (m.situacaoId === 'pol_eleicao' && (e === 'politico' || e === 'politico_tardio')) {
    // Reeleição primeiro; senão, um degrau acima do que já teve; senão, vereador.
    const p = v.caminhos.politica;
    const atual = p?.mandato?.cargo;
    const alvo = atual ? [`cargo_${atual}`, `cargo_${ORDEM_CARGOS[ORDEM_CARGOS.indexOf(atual) + 1] ?? atual}`] : (p?.historico.some(h => h.resultado === 'eleito') ? ['cargo_deputado_estadual', 'cargo_prefeito'] : []);
    for (const id of [...alvo, 'cargo_vereador']) if (livres.some(o => o.id === id)) return id;
  }
  if (m.situacaoId === 'esp_doping') return 'recusar';
  for (const id of PREFERE[e]) if (livres.some(o => o.id === id)) return id;
  return r.pick(livres).id;
}

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, extra: Record<string, string> = {}) => ({ tipo: 'profissao', oque, ...extra } as unknown as Acao);
const POL = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);

/** As ações do ano, pela estratégia (sempre passando pela disponibilidade). */
function agir(v: Vida, e: Nome): Acao[] {
  const i = idade(v);
  const out: Acao[] = [];
  const emp = v.trabalho.atual;
  // Base comum: estudar no ritmo e procurar trabalho quando não há.
  if (!emp && i >= 16 && !v.trabalho.aposentadoria && !v.justica?.prisao) {
    const { para } = vagasParaVoce(v);
    const alvo = e === 'autonomo' ? para.find(x => porContaPropria(x.item.oc)) ?? para[0] : para[0];
    if (alvo) out.push({ tipo: 'candidatar', ocupacaoId: alvo.item.oc.id });
  }
  for (const o of v.caminhos.oportunidades) if (['vaga', 'indicacao', 'aprendiz', 'estagio', 'proposta', 'reinsercao', 'peneira', 'seletiva', 'convite'].includes(o.tipo) && (e.startsWith('atleta') || !['peneira', 'seletiva'].includes(o.tipo))) out.push({ tipo: 'oportunidade', id: o.id, aceitar: true });
  if (i >= 62 && tenta(v, { tipo: 'aposentar' }) && e !== 'politico') out.push({ tipo: 'aposentar' });
  switch (e) {
    case 'puxado':
      out.push(P('ritmo', { valor: 'puxado' }), { tipo: 'horas_extras' });
      break;
    case 'preserva':
      out.push(P('ritmo', { valor: 'leve' }));
      if (v.mente.estresse > 55) out.push({ tipo: 'cuidar', cuidado: 'descansar' });
      break;
    case 'negociador':
      out.push({ tipo: 'pedir_aumento' }, P('promocao'));
      break;
    case 'empreendedor': case 'empreendedor_cedo': {
      const n = negocioAtivo(v);
      if (!n && !v.caminhos.negocio?.passivo && i >= (e === 'empreendedor_cedo' ? 20 : 25) && i <= 58) {
        const lista = negociosPossiveis(v).filter(x => podeTentar(x.veredito) && (e === 'empreendedor_cedo' || x.veredito.grau === 'permitido')).sort((a, b) => a.custo - b.custo);
        if (lista[0]) out.push({ tipo: 'abrir_negocio', negocio: lista[0].t.id });
      }
      if (n) {
        for (const x of acoesDoTrabalho(v, disponibilidade).agora) if (x.acao && ['contratar', 'ampliar', 'unidade', 'retirar', 'estrategia'].includes(x.id)) out.push(x.acao);
        if (n.estado === 'apertado') { const f = n.equipe?.[n.equipe.length - 1]; if (f) out.push(P('demitir', { pessoaId: f.pessoaId })); }
      }
      break;
    }
    case 'autonomo':
      out.push(P('estrutura'), { tipo: 'mei' });
      if ((emp?.clientela ?? 0) >= 62) out.push(P('preco', { valor: 'alto' }));
      if ((emp?.clientela ?? 99) < 28) out.push(P('preco', { valor: 'baixo' }));
      break;
    case 'atleta_forca': case 'atleta_preserva':
      // Como uma criança que joga de verdade: começa na pelada, vira treino, vira a sério.
      if (i >= 7 && i <= 22) { const rot = v.rotinas.find(x => x.id === 'futebol'); if (!rot) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 1 }); else if ((rot.nivel ?? 1) < 3 && i >= 9) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: ((rot.nivel ?? 1) + 1) as 2 | 3 }); }
      if (v.caminhos.esporte?.fase === 'profissional') {
        out.push(P('foco', { valor: e === 'atleta_forca' ? 'forcar' : 'preservar' }));
        if (e === 'atleta_preserva' && i >= 27) out.push(P('pos_carreira'));
        if (v.caminhos.esporte.espaco === 'reserva') out.push(P('treinador'));
      }
      break;
    case 'politico': case 'politico_tardio': {
      const inicio = e === 'politico' ? 24 : 55;
      if (i >= inicio - 4 && !v.rotinas.some(x => x.id === 'voluntariado')) out.push({ tipo: 'rotina', id: 'voluntariado', ativa: true, nivel: 1 });
      if (i >= inicio) out.push(POL('aproximar'), POL('filiar'), POL('comunidade'), POL('prioridade', 'saude'), POL('candidatura'));
      if (v.caminhos.politica?.mandato?.crise) out.push(POL('crise'));
      break;
    }
  }
  return out;
}

function viver(semente: number, e: Nome): Registro {
  const r = criarRng(semente * 31 + 7);
  const lugar = MUNICIPIOS[semente % MUNICIPIOS.length].id;
  let v = criarVida({ nome: semente % 2 ? 'Ana' : 'Caio', sobrenome: 'Souza', genero: semente % 2 ? 'feminino' : 'masculino', municipioId: lugar, semente });
  const reg: Registro = { estrategia: e, semente, vida: v, estresse: [], limite: 0 };
  const responder = () => { let k = 0; while (v.momento && k++ < 8) { if (v.momento.situacaoId === 'trab_limite') reg.limite++; const antes = v.caminhos.politica?.campanha; v = executar(v, { tipo: 'decidir', opcaoId: escolher(v, v.momento, e, r) }).vida; const c = v.caminhos.politica?.campanha; if (process.env.DBG && c && c.etapa === 4 && antes?.etapa === 3) DBG.push(`${e} ${idade(v)} ${c.cargo} apoio=${Math.round(v.caminhos.politica!.apoio)} rep=${Math.round(v.caminhos.politica!.reputacao)} desg=${Math.round(v.caminhos.politica!.desgaste)} nota=${c.nota.toFixed(1)} forca=${forcaDaCandidatura(v, c.cargo).toFixed(1)} dif=${dificuldade(v, c.cargo)} p=${chanceDeVitoria(v, c.cargo, c.tEleicao).toFixed(2)} aprov=${v.caminhos.politica!.mandato?.aprovacao ?? '-'}`); } };
  while (!v.morte && idade(v) < ATE) {
    for (const a of agir(v, e)) { if (v.momento) break; if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida;
    responder();
    const i = idade(v);
    if (i >= 30 && i <= 60) reg.estresse.push(v.mente.estresse);
    if (i === 40) { reg.pat40 = patrimonio(v); reg.renda40 = rendaPropriaMensal(v); }
    if (i === 60) { reg.pat60 = patrimonio(v); reg.saude60 = v.corpo.saude; }
    if (i === 35) reg.desempregado35 = !v.trabalho.atual && !v.trabalho.pausa;
    if (i === 50) reg.desempregado50 = !v.trabalho.atual && !v.trabalho.pausa && !v.trabalho.aposentadoria;
  }
  reg.vida = v;
  return reg;
}

const mediana = (xs: number[]) => { const s = xs.filter(x => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const pct = (xs: number[], p: number) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };
const media = (xs: number[]) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN;
const k = (x: number) => (Number.isFinite(x) ? `${Math.round(x / 1000)}k` : '—');
const frac = (xs: Registro[], f: (r: Registro) => boolean) => `${xs.filter(f).length}/${xs.length}`;

const todos: Registro[] = [];
const t0 = Date.now();
for (const e of ESTRATEGIAS) for (let n = 0; n < VIDAS; n++) todos.push(viver(1000 + n * 7919 + ESTRATEGIAS.indexOf(e) * 13, e));

const linhas: string[] = [];
const log = (s: string) => { linhas.push(s); console.log(s); };
log(`# Vida profissional — ${todos.length} vidas (${VIDAS} por estratégia, até ${ATE} anos) em ${Math.round((Date.now() - t0) / 1000)}s\n`);
log('## Por estratégia');
log('| estratégia | patrimônio 40 (mediana) | patrimônio 60 (p10 · mediana · p90) | renda 40 | saúde aos 60 | cabeça 30–60 | sem trabalho 35 · 50 | "o corpo deu sinal" |');
log('|---|---|---|---|---|---|---|---|');
for (const e of ESTRATEGIAS) {
  const xs = todos.filter(x => x.estrategia === e);
  log(`| ${e} | ${k(mediana(xs.map(x => x.pat40 ?? NaN)))} | ${k(pct(xs.map(x => x.pat60 ?? NaN), 0.1))} · ${k(mediana(xs.map(x => x.pat60 ?? NaN)))} · ${k(pct(xs.map(x => x.pat60 ?? NaN), 0.9))} | ${k(mediana(xs.map(x => x.renda40 ?? NaN)))} | ${Math.round(media(xs.map(x => x.saude60 ?? NaN).filter(Number.isFinite)))} | ${Math.round(media(xs.flatMap(x => x.estresse)))} | ${frac(xs, x => !!x.desempregado35)} · ${frac(xs, x => !!x.desempregado50)} | ${xs.reduce((s, x) => s + x.limite, 0)} |`);
}

log('\n## Negócios');
for (const e of ['empreendedor', 'empreendedor_cedo', 'convencional'] as Nome[]) {
  const xs = todos.filter(x => x.estrategia === e);
  const abriu = xs.filter(x => x.vida.caminhos.marcas.some(m => m.tipo === 'negocio_aberto'));
  const fechouCedo = abriu.filter(x => { const a = x.vida.caminhos.marcas.find(m => m.tipo === 'negocio_aberto')!; const f = x.vida.caminhos.marcas.find(m => m.tipo === 'negocio_fechado' && m.t > a.t); return f && f.t - a.t <= 60; });
  const cresceu = abriu.filter(x => x.vida.biografia.some(b => /Ampliou|segunda unidade|terceira unidade|virou um negócio grande/.test(b.texto)));
  const equipe = abriu.filter(x => x.vida.biografia.some(b => /começou a trabalhar n[ao] /.test(b.texto)));
  const aprendeu = xs.filter(x => (x.vida.fatos['negocio_aprendizado'] ?? 0) >= 1 && x.vida.caminhos.marcas.filter(m => m.tipo === 'negocio_aberto').length >= 2);
  log(`- ${e}: abriu ${frac(xs, x => abriu.includes(x))} · fechou em até 5 anos ${fechouCedo.length}/${abriu.length} · contratou ${equipe.length}/${abriu.length} · cresceu (ampliou/unidade) ${cresceu.length}/${abriu.length} · tentou de novo depois de fechar ${aprendeu.length}`);
}

log('\n## Esporte');
for (const e of ['atleta_forca', 'atleta_preserva'] as Nome[]) {
  const xs = todos.filter(x => x.estrategia === e);
  const pro = xs.filter(x => x.vida.caminhos.marcas.some(m => m.tipo === 'profissional'));
  const fim = pro.map(x => { const es = x.vida.caminhos.esporte; return es?.tFim ? Math.floor((es.tFim - x.vida.eu.tNasc) / 12) : NaN; }).filter(Number.isFinite);
  const les = pro.map(x => x.vida.caminhos.esporte?.lesoes ?? 0);
  log(`- ${e}: base ${frac(xs, x => x.vida.caminhos.marcas.some(m => m.tipo === 'ingresso' && m.dominio === 'futebol'))} · profissional ${pro.length}/${xs.length} · idade do fim (mediana ${mediana(fim)}, máx ${Math.max(...fim, 0)}) · lesões médias ${media(les).toFixed(1)} · suspensos ${frac(pro, x => x.vida.fatos['suspenso_doping'] !== undefined)} · ${pro.filter(x => x.vida.trabalho.historico.some(h => ['auxiliar_tecnico', 'treinador_escolinha', 'preparador_fisico'].includes(h.ocupacaoId)) || ['auxiliar_tecnico', 'treinador_escolinha', 'preparador_fisico'].includes(x.vida.trabalho.atual?.ocupacaoId ?? '')).length} foram para comissão técnica/escolinha`);
}

log('\n## Vida política');
for (const e of ['politico', 'politico_tardio', 'convencional'] as Nome[]) {
  const xs = todos.filter(x => x.estrategia === e);
  const entrou = xs.filter(x => !!x.vida.caminhos.politica);
  const hist = entrou.flatMap(x => x.vida.caminhos.politica!.historico);
  const eleitos = entrou.filter(x => x.vida.caminhos.politica!.historico.some(h => h.resultado === 'eleito'));
  const cargos: Record<string, number> = {};
  for (const h of hist) if (h.resultado === 'eleito') cargos[h.cargo] = (cargos[h.cargo] ?? 0) + 1;
  const longos = eleitos.filter(x => x.vida.caminhos.politica!.historico.filter(h => h.resultado === 'eleito').length >= 3);
  const derrotaDepoisVitoria = eleitos.filter(x => { const h = x.vida.caminhos.politica!.historico; const i = h.findIndex(y => y.resultado === 'eleito'); return h.slice(i + 1).some(y => y.resultado === 'derrotado'); });
  log(`- ${e}: entrou ${entrou.length}/${xs.length} · candidaturas ${hist.filter(h => h.resultado === 'eleito' || h.resultado === 'derrotado').length} · derrotas ${hist.filter(h => h.resultado === 'derrotado').length} · eleito alguma vez ${eleitos.length} · cargos ${JSON.stringify(cargos)} · 3+ mandatos ${longos.length} · perdeu depois de ter ganho ${derrotaDepoisVitoria.length} · renúncias ${hist.filter(h => h.resultado === 'renunciou').length} · cassados ${hist.filter(h => h.resultado === 'cassado').length} · encerraram ${frac(entrou, x => x.vida.caminhos.politica!.fase === 'encerrada')}`);
}

log('\n## Riqueza (todas as vidas)');
const p60 = todos.map(x => x.pat60 ?? NaN).filter(Number.isFinite);
log(`- patrimônio aos 60: p50 ${k(pct(p60, 0.5))} · p90 ${k(pct(p60, 0.9))} · p99 ${k(pct(p60, 0.99))} · máximo ${k(Math.max(...p60))}`);
const topo = [...todos].filter(x => x.pat60 !== undefined).sort((a, b) => b.pat60! - a.pat60!).slice(0, 5);
log(`- as cinco maiores: ${topo.map(x => `${x.estrategia} ${k(x.pat60!)} (${modoDoTrabalho(x.vida)}, ${x.vida.trabalho.historico.map(h => ocupacao(h.ocupacaoId).nome[0]).slice(-2).join(' → ')})`).join(' · ')}`);

writeFileSync(`${SAIDA}/profissao.md`, linhas.join('\n'));
if (process.env.DBG) writeFileSync(`${SAIDA}/dbg.txt`, DBG.join('\n'));
for (const e of ESTRATEGIAS) {
  const x = todos.find(y => y.estrategia === e)!;
  writeFileSync(`${SAIDA}/bio-${e}-${x.semente}.txt`, x.vida.biografia.filter(b => b.relevancia !== 'tecnico').map(b => `${b.idade}: ${b.texto}`).join('\n'));
}
