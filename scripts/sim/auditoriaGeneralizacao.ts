/**
 * Auditoria transversal da generalização: uma carreira profissional por
 * modalidade (várias sementes), e tudo o que ela escreve para o jogador —
 * resumo, tabela do histórico, palmarés, momentos de carreira, legado,
 * retrospectiva, Linha da Vida e (FIX final) as decisões de mercado abertas
 * no meio da carreira: renovação, proposta, treinador, pedir para sair,
 * doping, depois do esporte — conferido contra vocabulário de outra
 * modalidade e contra texto quebrado (NaN, undefined, [object …]).
 *
 *   npx esbuild scripts/sim/auditoriaGeneralizacao.ts --bundle --platform=node --outfile=/tmp/aud.cjs
 *   SEMENTES=12 node /tmp/aud.cjs
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { historicoDaCarreira, resumoDaCarreira, perfilDe } from '../../src/motor/sistemas/perfisEsportivos';
import { criarProposta } from '../../src/motor/sistemas/esporte';
import { abrirDecisao, conteudoPorId } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import * as legado from '../../src/motor/sistemas/legado';
import { retrospectiva } from '../../src/motor/sistemas/retrospectiva';

const SEMENTES = Number(process.env.SEMENTES ?? 12);
const MODALIDADES = ['futebol', 'basquete', 'volei', 'tenis', 'natacao', 'atletismo', 'lutas'] as const;
const QUEBRADO = /\bNaN\b|\bundefined\b|\[object |\bnull\b|\{\w+\}/;

/** O que não pode aparecer no texto de cada modalidade (o vocabulário de outra). */
function proibidos(d: string): RegExp[] {
  const p = perfilDe(d as never);
  const r: RegExp[] = [];
  if (d !== 'futebol') r.push(/\bgols?\b/i, /artilh/i, /Série [ABCD]\b/);
  if (d !== 'basquete') r.push(/cestinha/i, ...(d === 'futebol' ? [] : [/\brebotes?\b/i]), /\bNBB\b/, /\bpivô\b/i, /\barmador/i);
  if (d !== 'tenis') r.push(/\branking\b/i, /circuito principal/i, /tie-break/i);
  if (p.estrutura !== 'clube') r.push(/\bclubes?\b/i, /\bseleção do campeonato\b/i);
  if (d === 'tenis') r.push(/\bseleção\b/i);
  // O vocabulário de campo (FIX final): estádio, gramado, chuteira e escalação são do futebol; o banco e o time
  // reserva, das coletivas; a natação não tem quadra; o nadador e o lutador competem, não "jogam".
  if (d !== 'futebol') r.push(/estádio/i, /gramado/i, /chuteira/i, /escalação/i, /\bfutebol\b/i);
  if (p.estrutura !== 'clube') r.push(/\bno banco\b/i, /time reserva/i, /\bescalad/i);
  if (p.estrutura === 'equipe') r.push(/\bjogar\b/i, /\bjogos?\b(?! (continentais|multiesportivos))/i, /\btitular\b/i);
  if (d === 'natacao' || d === 'atletismo' || d === 'lutas') r.push(/\bquadra\b/i);
  return r;
}

/** As decisões de mercado que a carreira abre (e as respostas de cada opção), lidas como o jogador as lê. */
const DECISOES = ['esp_renovacao', 'esp_mercado', 'esp_treinador', 'esp_doping', 'esp_pos', 'esp_pendurar', 'esp_proposta'];
function textosDasDecisoes(v: Vida, d: string): string[] {
  const out: string[] = [];
  for (const id of DECISOES) {
    const c = conteudoPorId(id);
    if (!c || c.tipo !== 'decisao') continue;
    // Uma proposta na mesa para a decisão de proposta (só nas modalidades de clube, que têm mercado de equipe).
    if (id === 'esp_proposta' && perfilDe(d as never).estrutura !== 'clube') continue;
    const base = id === 'esp_proposta' ? transacao(v, x => { const es = x.caminhos.esporte!; criarProposta(x, es, Math.min(4, es.nivel + 1) as 1 | 2 | 3 | 4, 'maior'); }).vida : v;
    if (id === 'esp_proposta' && !base.caminhos.esporte?.proposta) continue;
    const r = criarRng(7);
    let m: { titulo: string; texto: string; opcoes: { id: string; texto: string; bloqueio?: string; detalhe?: string }[] } | undefined;
    transacao(base, x => { m = abrirDecisao(x, c, contexto(x, r)); });
    if (!m) continue;
    out.push(m.titulo, m.texto, ...m.opcoes.flatMap(o => [o.texto, o.bloqueio ?? '', o.detalhe ?? '']));
    // E o que cada opção responde (num clone: a resposta não muda a vida auditada).
    for (const o of c.opcoes) {
      transacao(base, x => {
        const ctx = contexto(x, criarRng(11));
        const disp = o.disponivel ? o.disponivel(ctx) : true;
        if (disp !== true) return;
        const res = o.resolver(ctx) as { texto?: string; memoria?: string | null };
        out.push(res.texto ?? '', res.memoria ?? '');
      });
    }
  }
  // O nome da equipe é nome próprio (pode ter "Clube" no nome): não é vocabulário.
  const nomes = [v.caminhos.esporte?.clube, v.trabalho.atual?.empregador].filter((x): x is string => !!x);
  return out.filter(Boolean).map(t => nomes.reduce((a, n) => a.split(n).join('[equipe]'), t));
}

interface Achado { modalidade: string; semente: number; onde: string; texto: string; regra: string }
const achados: Achado[] = [];
const contagem: Record<string, { vidas: number; textos: number; temporadas: number }> = {};

const sim = (v: Vida) => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; return v; };

for (const d of MODALIDADES) {
  contagem[d] = { vidas: 0, textos: 0, temporadas: 0 };
  for (let s = 1; s <= SEMENTES; s++) {
    const r = criarRng(s * 53);
    const h0 = Math.min(95, 80 + Math.abs(r.normal()) * 6);
    let v = criarVida({ nome: 'Aud', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'fortaleza-ce'][s % 4], semente: 70000 + s * 7 + MODALIDADES.indexOf(d) * 1000 });
    for (let k = 0; k < 18 && !v.morte; k++) v = sim(avancarAno(v).vida);
    if (v.morte) continue;
    v = transacao(v, (x, rr) => {
      garantirFrente(x, d);
      Object.assign(x.caminhos.frentes[d]!, { habilidade: h0, interesse: 90, meses: 120, auge: h0 });
      x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined;
      x.financas.conta += 400000;
      entrarNaBase(x, d, x.moradia.municipioId, d === 'tenis' ? `academia de tênis de ${x.moradia.municipioId}` : 'equipe da prefeitura');
      profissionalizar(x, rr, h0 < 82 ? 1 : h0 < 86 ? 2 : h0 < 90 ? 3 : 4);
    }).vida;
    const t0 = v.biografia.length;
    let decisoes: string[] = [];
    while (!v.morte && idade(v) < 34) {
      v = sim(avancarAno(v).vida);
      // Aos 25, no meio da carreira: as decisões de mercado, como o jogador as lê.
      if (idade(v) === 25 && v.caminhos.esporte?.fase === 'profissional') decisoes = textosDasDecisoes(v, d);
    }
    const e = v.caminhos.esporte?.modalidade === d ? v.caminhos.esporte : (v.caminhos.carreirasEsportivas ?? []).find(c => c.modalidade === d);
    if (!e) continue;
    contagem[d].vidas++;
    contagem[d].temporadas += e.temporadas?.length ?? 0;
    const h = historicoDaCarreira(e);
    const textos: [string, string][] = [
      ['resumo', resumoDaCarreira(e)],
      ['histórico: colunas', h.colunas.join(' · ')],
      ...h.linhas.map(l => ['histórico: linha', l.join(' · ')] as [string, string]),
      ...(v.caminhos.palmares ?? []).filter(p => p.modalidade === d).map(p => ['palmarés', p.texto] as [string, string]),
      ...(v.caminhos.situacoes ?? []).filter(x => x.trajetoria === d).map(x => ['momento', x.texto] as [string, string]),
      ...legado.trajetoriasDaVida(v).filter(t => t.area === 'esporte').flatMap(t => [t.titulo, t.resumo, ...t.realizacoes, ...t.reconhecimento, ...t.detalhe.flatMap(x => [x.titulo, ...x.linhas])].map(x => ['legado', x] as [string, string])),
      ...retrospectiva(v).map(x => ['retrospectiva', typeof x === 'string' ? x : JSON.stringify(x)] as [string, string]),
      ...v.biografia.slice(t0).map(b => ['linha da vida', b.texto] as [string, string]),
      ...decisoes.map(x => ['decisão', x] as [string, string])
    ];
    contagem[d].textos += textos.length;
    for (const [onde, texto] of textos) {
      if (QUEBRADO.test(texto)) achados.push({ modalidade: d, semente: s, onde, texto, regra: 'texto quebrado' });
      // A retrospectiva conta a vida inteira (a escola, outros esportes de infância): só texto quebrado.
      if (onde === 'retrospectiva') continue;
      // A Linha da Vida do período da carreira: o vocabulário estrutural (clube, gol), não o de cada lance.
      const regras = onde === 'linha da vida' ? proibidos(d).filter(re => /clube|gols/.test(String(re))) : proibidos(d);
      for (const re of regras) if (re.test(texto)) achados.push({ modalidade: d, semente: s, onde, texto, regra: String(re) });
    }
  }
}

console.log('| modalidade | carreiras | temporadas | textos conferidos |');
console.log('| --- | --- | --- | --- |');
for (const d of MODALIDADES) console.log(`| ${d} | ${contagem[d].vidas} | ${contagem[d].temporadas} | ${contagem[d].textos} |`);
console.log(`\nAchados: ${achados.length}`);
const vistos = new Set<string>();
for (const a of achados) { const k = `${a.modalidade}|${a.onde}|${a.regra}|${a.texto}`; if (vistos.has(k)) continue; vistos.add(k); console.log(`- [${a.modalidade} #${a.semente}] ${a.onde} · ${a.regra}: ${a.texto}`); }
