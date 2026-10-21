/**
 * REWORK 10 · BAL-02 e FUT-03 — duas medidas.
 *
 *  BAL-02: adolescentes (13 → 17) com rotinas EQUILIBRADAS — estudo dedicado, um esporte regular ou a sério, nada mais —
 *  comparados com quem só estuda do jeito normal. Mede o estresse médio por ano, a fração de anos com estresse ≥ 70 e as
 *  lesões por pessoa. O que se quer: a dedicação e o treino cobram alguma coisa, mas não fazem de uma rotina equilibrada
 *  uma rotina doente.
 *
 *  FUT-03: quem entra na base aos 14 com habilidade 55/65/75 (e quem vai pelo amador aos 17) — quantos viram
 *  profissionais até os 22. O que se quer: a porta existe para quem é bom, e não é automática para ninguém.
 *
 *   npx esbuild scripts/sim/rotina10.ts --bundle --platform=node --outfile=<scratch>/r10.cjs && N=60 node <scratch>/r10.cjs
 */
import { nova, responder, viverAte } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { transacao } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaBase, entrarPeloAmador } from '../../src/motor/sistemas/esporte';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 40);
const lesoesDe = (v: Vida) => new Set(v.corpo.condicoes.filter(c => c.lesao).map(c => c.id));

const resolverTudo = (v: Vida) => { for (let k = 0; k < 12 && v.momento; k++) v = responder(v); return v; };

function ano(v: Vida): Vida {
  v = avancarAno(v).vida;
  for (let k = 0; k < 12 && v.momento; k++) v = responder(v);
  return v;
}

function bal(config: 'normal' | 'dedicada' | 'dedicada+regular' | 'dedicada+serio' | 'base+dedicada') {
  let soma = 0, anos = 0, altos = 0, lesoes = 0;
  for (let s = 0; s < N; s++) {
    let v = viverAte(nova({ semente: 5000 + s }), 13);
    v = transacao(v, x => {
      x.momento = null;
      x.rotinas = [];
      x.educacao.postura = config === 'normal' ? 'normal' : 'dedicada';
      x.caminhos.frentes.futebol = { interesse: 80, meses: 60, habilidade: 58, tInicio: x.t - 60, tUltimo: x.t, retomadas: 0, auge: 58 };
      if (config === 'dedicada+regular') x.rotinas.push({ id: 'futebol', nivel: 2, tInicio: x.t });
      if (config === 'dedicada+serio') x.rotinas.push({ id: 'futebol', nivel: 3, tInicio: x.t });
      if (config === 'base+dedicada') entrarNaBase(x, 'futebol', x.moradia.municipioId, 'o clube da cidade');
    }).vida;
    const vistas = lesoesDe(v);
    for (let k = 0; k < 4 && !v.morte; k++) {
      v = ano(v);
      if (config !== 'normal') v.educacao.postura = 'dedicada';
      soma += v.mente.estresse; anos++; if (v.mente.estresse >= 70) altos++;
      for (const id of lesoesDe(v)) if (!vistas.has(id)) { vistas.add(id); lesoes++; }
    }
  }
  return `| ${config} | ${(soma / anos).toFixed(1)} | ${(100 * altos / anos).toFixed(1)}% | ${(lesoes / N).toFixed(2)} |`;
}

function fut(rota: 'base' | 'amador', hab: number) {
  let pro = 0;
  for (let s = 0; s < N; s++) {
    let v = viverAte(nova({ semente: 8000 + s + hab * 7, genero: 'masculino' }), rota === 'base' ? 14 : 17);
    v = transacao(v, x => {
      x.momento = null; x.rotinas = [];
      x.caminhos.frentes.futebol = { interesse: 85, meses: 96, habilidade: hab, tInicio: x.t - 96, tUltimo: x.t, retomadas: 0, auge: hab };
      if (rota === 'base') entrarNaBase(x, 'futebol', x.moradia.municipioId, 'o clube da cidade');
      else { entrarPeloAmador(x, 'futebol', x.moradia.municipioId, 'o time amador'); x.rotinas.push({ id: 'futebol', nivel: 3, tInicio: x.t }); }
    }).vida;
    let virou = false;
    while (!v.morte && Math.floor((v.t - v.eu.tNasc) / 12) < 22) {
      v = ano(v);
      if (v.momento) v = transacao(v, x => { x.momento = null; }).vida;
      // O contrato chega como um convite (Caminhos · Trabalho): quem está na sim aceita, como faria o jogador.
      const convite = v.caminhos.oportunidades.find(o => o.dominio === 'futebol' && o.tipo === 'convite');
      if (convite) { v = executar(v, { tipo: 'oportunidade', id: convite.id, aceitar: true }).vida; v = resolverTudo(v); }
      if (v.caminhos.esporte?.fase === 'profissional') virou = true;
    }
    if (virou) pro++;
  }
  return `| ${rota} | ${hab} | ${(100 * pro / N).toFixed(0)}% |`;
}

void (async () => {
  await carregarMundo();
  console.log(`# Rotina e futebol — REWORK 10 (${N} vidas por linha)\n\n## BAL-02 — dos 13 aos 17\n\n| rotina | estresse médio | anos com estresse ≥ 70 | lesões por pessoa |\n|---|---|---|---|`);
  for (const c of ['normal', 'dedicada', 'dedicada+regular', 'dedicada+serio', 'base+dedicada'] as const) console.log(bal(c));
  console.log('\n## FUT-03 — profissional até os 22\n\n| rota | habilidade | viraram profissionais |\n|---|---|---|');
  for (const h of [55, 65, 75]) console.log(fut('base', h));
  for (const h of [60, 75]) console.log(fut('amador', h));
})();
