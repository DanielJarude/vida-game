/**
 * Carreira de técnico 2.0 — carreiras longas no banco, pela simulação.
 *
 *   npx esbuild scripts/sim/tecnico.ts --bundle --platform=node --outfile=/tmp/tec.cjs
 *   VIDAS=60 ANOS=25 node /tmp/tec.cjs
 *
 * Metade das vidas é ex-jogador (dez temporadas de futebol profissional antes
 * do banco); metade chega pela comissão sem ter jogado. Todas assumem o
 * comando aos 36 (contratadas como técnico: o jogo escolhe o clube real) e
 * vivem ANOS anos, respondendo às decisões (propostas: aceita a de clube
 * maior; momentos: a estratégia do simulador).
 *
 * Confere: J = V + E + D por temporada, passagem e carreira (inclusive as
 * temporadas parciais de quem chegou no meio do ano); a comissão técnica
 * dos outros esportes nunca vira técnico de futebol; títulos,
 * acessos, rebaixamentos, demissões, clubes; exemplos de linhas da carreira.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { entrarNaBase, encerrarCarreira, fecharTemporada, profissionalizar } from '../../src/motor/sistemas/esporte';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { periodoDaPassagem, comoAcabou, linhaDoTecnico, resumoDaPassagem, resumoDoTecnico } from '../../src/motor/sistemas/tecnico';
import { trajetoriasDaVida } from '../../src/motor/sistemas/legado';
import { estrategia } from './estrategias';

const N = Number(process.env.VIDAS ?? 40);
const ANOS = Number(process.env.ANOS ?? 25);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const dist = (xs: number[]) => `p10 ${quantil(xs, 0.1)} · mediana ${quantil(xs, 0.5)} · p90 ${quantil(xs, 0.9)} · média ${media(xs).toFixed(1)}`;

let invariantes = 0;
const grupos: Record<string, Vida[]> = { 'ex-jogador': [], 'sem passado de jogador': [] };
for (let s = 1; s <= N; s++) {
  const ex = s % 2 === 0;
  const r = criarRng(s * 613);
  let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 5 === 0 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 990000 + s });
  for (let k = 0; k < 24 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
  if (v.morte) continue;
  v = transacao(v, (x, rr) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol');
    garantirFrente(x, 'lideranca');
    if (ex) {
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: 84 + (s % 6), interesse: 90, meses: 200, auge: 86 + (s % 6) });
      entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
      profissionalizar(x, rr, 2 + (s % 3));
      const e = x.caminhos.esporte!;
      for (let k = 0; k < 10; k++) { const t = fecharTemporada(x, rr, e); registrarTemporada(x, rr, e, t); x.t += 12; }
      encerrarCarreira(x, e, 'idade');
    } else {
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: 55, interesse: 80, meses: 120, auge: 60 });
      x.t += 120;
    }
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, rr, ocupacao('tecnico_futebol'), 'oportunidade');
    x.momento = null;
  }).vida;
  const e = estrategia('passivo');
  const decidir = () => { const m = v.momento!; const livres = m.opcoes.filter(o => !o.bloqueio); if (m.situacaoId === 'tec_proposta') return livres.find(o => o.id === 'aceitar')?.id ?? livres[0].id; return e.decidir(v, m, r); };
  for (let k = 0; k < ANOS && !v.morte; k++) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida;
  }
  const c = v.caminhos.tecnico;
  if (!c) continue;
  // Invariantes: J = V + E + D em cada temporada.
  for (const p of c.passagens) for (const t of p.temporadas) if (t.jogos !== t.v + t.e + t.d) invariantes++;
  grupos[ex ? 'ex-jogador' : 'sem passado de jogador'].push(v);
}

console.log(`\n## Carreira de técnico — ${N} vidas, comando aos 36, ${ANOS} anos\n`);
console.log(`Temporadas com J ≠ V + E + D: ${invariantes}\n`);
console.log('| grupo | carreiras | anos no banco | clubes | jogos | V · E · D (média) | aproveitamento | títulos | acessos | rebaixamentos | demissões | renovações | maior divisão | seleção |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const [nome, vs] of Object.entries(grupos)) {
  const rs = vs.map(v => resumoDoTecnico(v.caminhos.tecnico!));
  const anos = vs.map(v => Math.round(v.caminhos.tecnico!.passagens.reduce((a, p) => a + ((p.ate ?? v.t) - p.desde), 0) / 12));
  const maior = vs.map(v => Math.max(...v.caminhos.tecnico!.passagens.map(p => Math.max(p.nivel, ...p.temporadas.map(t => t.nivel)))));
  console.log(`| ${nome} | ${vs.length} | ${quantil(anos, 0.5)} | ${dist(rs.map(x => x.clubes))} | ${dist(rs.map(x => x.jogos))} | ${media(rs.map(x => x.v)).toFixed(0)} · ${media(rs.map(x => x.e)).toFixed(0)} · ${media(rs.map(x => x.d)).toFixed(0)} | ${quantil(rs.map(x => x.aproveitamento), 0.5)}% | ${media(rs.map(x => x.titulos)).toFixed(1)} (${Math.round(rs.filter(x => x.titulos > 0).length / Math.max(1, rs.length) * 100)}% com) | ${media(rs.map(x => x.acessos)).toFixed(1)} | ${media(rs.map(x => x.rebaixamentos)).toFixed(1)} | ${media(rs.map(x => x.demissoes)).toFixed(1)} | ${media(rs.map(x => x.renovacoes)).toFixed(1)} | A ${Math.round(maior.filter(x => x === 4).length / Math.max(1, maior.length) * 100)}% · B ${Math.round(maior.filter(x => x === 3).length / Math.max(1, maior.length) * 100)}% | ${vs.filter(v => v.caminhos.tecnico!.passagens.some(p => p.selecao)).length} |`);
}
console.log('\n### Exemplos\n');
for (const v of [...grupos['ex-jogador'].slice(0, 3), ...grupos['sem passado de jogador'].slice(0, 2)]) {
  const c = v.caminhos.tecnico!;
  console.log(`- CARREIRA COMO TÉCNICO — ${linhaDoTecnico(c)}${c.tFim !== undefined ? ` (encerrada: ${c.motivoFim})` : ''} · convites ${c.convites ?? 0} · reputação ${Math.round(c.reputacao)}`);
  for (const p of c.passagens) { const r = resumoDaPassagem(p); console.log(`  - ${p.clube} · ${periodoDaPassagem(p).de}–${periodoDaPassagem(p).ate ?? 'hoje'} — ${r.jogos} jogos · ${r.v} V · ${r.e} E · ${r.d} D · ${r.aproveitamento}%${r.titulos.length ? ` · ${r.titulos.join(', ')}` : ''} · ${comoAcabou(v, p)}`); }
  if (process.env.DEBUG) console.log('  - saídas do emprego:', v.trabalho.historico.filter(h => h.ocupacaoId === 'tecnico_futebol').map(h => h.motivo).join(' | '), '· agora:', v.trabalho.atual?.ocupacaoId, '· idade', Math.floor((v.t - v.eu.tNasc) / 12));
  const tr = trajetoriasDaVida(v).filter(t => t.area === 'esporte' || t.area === 'tecnico').map(t => `${t.titulo}: ${t.resumo}`);
  for (const t of tr) console.log(`  - legado: ${t}`);
}

// Contratação no meio da temporada: o clube em crise chama quem está sem clube; a primeira temporada conta só os jogos dirigidos.
{
  const todas = Object.values(grupos).flat();
  const meio = todas.flatMap(v => v.caminhos.tecnico!.passagens.filter(p => p.meioDeTemporada));
  let foraDaConta = 0;
  for (const p of meio) { const t = p.temporadas[0]; if (t && (t.jogos !== t.v + t.e + t.d || t.jogos > p.meioDeTemporada!.rodadas - p.meioDeTemporada!.rodada || t.estadual !== undefined)) foraDaConta++; }
  const primeiras = meio.map(p => p.temporadas[0]).filter(Boolean);
  console.log(`\n### Contratação no meio da temporada\n`);
  console.log(`- carreiras com ao menos uma: ${todas.filter(v => v.caminhos.tecnico!.passagens.some(p => p.meioDeTemporada)).length} de ${todas.length} · passagens: ${meio.length} de ${todas.reduce((a, v) => a + v.caminhos.tecnico!.passagens.length, 0)}`);
  if (meio.length) console.log(`- assumiu em: ${dist(meio.map(p => p.meioDeTemporada!.posicao))} (posição) · na rodada ${dist(meio.map(p => p.meioDeTemporada!.rodada + 1))} · jogos na temporada parcial: ${dist(primeiras.map(t => t.jogos))} · terminou em ${dist(primeiras.map(t => t.colocacao ?? 0))} · títulos na parcial: ${primeiras.filter(t => t.titulos?.length).length} · rebaixados: ${primeiras.filter(t => t.rebaixamento).length} · demitidos na parcial: ${primeiras.filter(t => t.parcial).length}`);
  console.log(`- temporadas parciais fora da conta (J ≠ V+E+D, mais jogos que as rodadas restantes, ou estadual): ${foraDaConta}`);
}

// A comissão é da modalidade: ex-atletas de outros esportes que aceitam a comissão técnica e vivem 22 anos pelo motor.
{
  const MODS = ['basquete', 'volei', 'natacao', 'atletismo', 'lutas'] as const;
  const N_MOD = Number(process.env.VIDAS_MOD ?? 6);
  console.log(`\n### Comissão técnica por modalidade — ${N_MOD} ex-atletas por esporte, 22 anos\n`);
  console.log('| esporte | convite (cargo) | chegaram a técnico | cargo de técnico | viraram técnico de futebol | carreira de técnico de futebol |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const m of MODS) {
    let futebol = 0, carreira = 0, tecnicos = 0;
    const convites = new Set<string>(), cargos = new Set<string>();
    for (let s = 1; s <= N_MOD; s++) {
      let v = criarVida({ nome: 'Sim', sobrenome: 'Souza', genero: s % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[s % CIDADES.length], semente: 770000 + s * 31 + m.length });
      for (let k = 0; k < 30 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
      if (v.morte) continue;
      v = transacao(v, (x, rr) => {
        x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined;
        garantirFrente(x, m);
        Object.assign(x.caminhos.frentes[m]!, { habilidade: 80, interesse: 90, meses: 200, auge: 82 });
        entrarNaBase(x, m, x.moradia.municipioId, 'Clube da Cidade');
        profissionalizar(x, rr, 3);
        x.fatos['pos_treinador'] = x.t;
        encerrarCarreira(x, x.caminhos.esporte!, 'idade');
        const op = x.caminhos.oportunidades.find(o => o.ocupacaoId && ocupacao(o.ocupacaoId).trilha === 'treino');
        if (op) { convites.add(op.ocupacaoId!); contratar(x, rr, ocupacao(op.ocupacaoId!), 'oportunidade'); x.trabalho.experiencia['treino'] = 48; }
        x.momento = null;
      }).vida;
      for (let k = 0; k < 22 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
      const empregos = [...v.trabalho.historico, ...(v.trabalho.atual ? [v.trabalho.atual] : [])];
      const ids = empregos.flatMap(e => [...(e.postos ?? []).map(p => p.ocupacaoId), e.ocupacaoId]);
      if (ids.includes('tecnico_futebol')) futebol++;
      if (v.caminhos.tecnico) carreira++;
      const tec = ids.filter(id => /^tecnico_/.test(id) && ocupacao(id).trilha === 'treino');
      if (tec.length) { tecnicos++; tec.forEach(id => cargos.add(id)); }
    }
    console.log(`| ${m} | ${[...convites].join(', ') || '—'} | ${tecnicos} | ${[...cargos].join(', ') || '—'} | ${futebol} | ${carreira} |`);
  }
}
