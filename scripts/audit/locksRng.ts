/**
 * F6-FIX §22 — LOCKS DE TRAJETÓRIA vs LOCKS DE RNG, medidos nas 105 vidas.
 *
 * Um lock é JUSTO quando o jogador viu o evento antecedente e escolheu outro
 * caminho. É INJUSTO quando ele chegou ao evento posterior sem que o jogo
 * jamais tenha apresentado a oportunidade de construir aquele histórico.
 */
import { simularVida, PERFIS } from './simulador';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';

/** pares (evento posterior, opção travada) -> evento antecedente que concede a flag */
const pares: { posterior: string; opcao: string; flag: string; antecedentes: string[] }[] = [];
const concede = new Map<string, string[]>();
for (const e of MASTER_EVENTS_LIST)
  for (const o of e.opcoes) {
    const f = o.consequencias.adicionarFlag;
    if (f) concede.set(f, [...new Set([...(concede.get(f) ?? []), e.id])]);
  }
for (const e of MASTER_EVENTS_LIST)
  for (const o of e.opcoes)
    if (o.requisito?.flagNecessaria)
      pares.push({ posterior: e.id, opcao: o.id, flag: o.requisito.flagNecessaria, antecedentes: concede.get(o.requisito.flagNecessaria) ?? [] });

const stats = new Map<string, { chegou: number; viuAntecedente: number; cumpriu: number }>();
for (const p of pares) stats.set(p.posterior + '|' + p.opcao, { chegou: 0, viuAntecedente: 0, cumpriu: 0 });

let vidas = 0;
for (const perfil of PERFIS) {
  for (let i = 0; i < 15; i++) {
    const v = simularVida(1000 + i * 37, perfil);
    vidas++;
    const vistos = new Set<string>();
    const escolhas = new Map<string, string>();
    for (const a of v.anos) {
      for (const id of a.ocorrenciasDoAno) vistos.add(id);
      if (a.eventoDecisao) escolhas.set(a.eventoDecisao.id, a.eventoDecisao.opcaoEscolhida);
    }
    for (const p of pares) {
      const s = stats.get(p.posterior + '|' + p.opcao)!;
      if (!vistos.has(p.posterior)) continue;
      s.chegou++;
      const viu = p.antecedentes.some(a => vistos.has(a));
      if (viu) s.viuAntecedente++;
      // cumpriu = viu o antecedente E escolheu a opção que concede a flag
      const cumpriu = p.antecedentes.some(a => {
        const esc = escolhas.get(a); if (!esc) return false;
        const ev = MASTER_EVENTS_LIST.find(x => x.id === a);
        return !!ev?.opcoes.find(o => o.id === esc)?.consequencias.adicionarFlag;
      });
      if (cumpriu) s.cumpriu++;
    }
  }
}

console.log('='.repeat(78));
console.log(`F6-FIX §22 — LOCKS DE TRAJETÓRIA vs LOCKS DE RNG (${vidas} vidas)`);
console.log('='.repeat(78));
let totTraj = 0, totRng = 0;
for (const p of pares) {
  const s = stats.get(p.posterior + '|' + p.opcao)!;
  const bloqueadas = s.chegou - s.cumpriu;
  const rng = s.chegou - s.viuAntecedente;      // nunca teve a chance
  const traj = s.viuAntecedente - s.cumpriu;    // teve a chance, escolheu outra coisa
  totTraj += traj; totRng += rng;
  console.log(`\n${p.posterior} · ${p.opcao}`);
  console.log(`  flag exigida ................... ${p.flag}`);
  console.log(`  antecedente(s) ................. ${p.antecedentes.join(', ') || '(nenhum)'}`);
  console.log(`  vidas que CHEGARAM ao evento ... ${s.chegou}`);
  console.log(`  viram o antecedente ............ ${s.viuAntecedente}`);
  console.log(`  cumpriram (opção liberada) ..... ${s.cumpriu}`);
  console.log(`  BLOQUEADAS ..................... ${bloqueadas}`);
  console.log(`     LOCK DE TRAJETÓRIA (justo) .. ${traj}`);
  console.log(`     LOCK DE RNG (injusto) ....... ${rng}`);
}
console.log('\n' + '='.repeat(78));
console.log(`TOTAL LOCKS DE TRAJETÓRIA (justos) .. ${totTraj}`);
console.log(`TOTAL LOCKS DE RNG (no dado) ........ ${totRng}`);
console.log('='.repeat(78));

// F6-FIX — o que o JOGADOR vê. Um lock de RNG continua existindo no
// estado (a flag não está lá), mas deixa de ser APRESENTADO como se fosse
// consequência de uma escolha que ele nunca teve a chance de fazer.
import { avaliarRequisitoOpcao } from '../../src/systems/events/optionRequirements';
import { criarPersonagemTeste } from '../../src/systems/__tests__/fixtures';
import { criarEconomiaInicial } from '../../src/systems/economySystem';

let exibidosComoCulpa = 0, ocultados = 0, exibidosComoTrajetoria = 0;
for (const p of pares) {
  const ev = MASTER_EVENTS_LIST.find(e => e.id === p.posterior)!;
  const op = ev.opcoes.find(o => o.id === p.opcao)!;
  const s2 = stats.get(p.posterior + '|' + p.opcao)!;
  const semAntecedente = s2.chegou - s2.viuAntecedente;
  const comAntecedente = s2.viuAntecedente - s2.cumpriu;

  const rSem = avaliarRequisitoOpcao(op, criarPersonagemTeste({ idade: ev.idadeMinima }), criarEconomiaInicial('classe_media'), undefined, []);
  const rCom = avaliarRequisitoOpcao(op, criarPersonagemTeste({ idade: ev.idadeMinima }), criarEconomiaInicial('classe_media'), undefined, p.antecedentes);
  if (rSem.origemDoBloqueio === 'nunca_oferecido') ocultados += semAntecedente;
  else exibidosComoCulpa += semAntecedente;
  if (rCom.origemDoBloqueio === 'trajetoria') exibidosComoTrajetoria += comAntecedente;
}
console.log('\nO QUE O JOGADOR VÊ (depois da F6-FIX)');
console.log('-'.repeat(78));
console.log(`opções OCULTADAS (antecedente nunca oferecido) .. ${ocultados}`);
console.log(`locks exibidos como trajetória (legítimos) ..... ${exibidosComoTrajetoria}`);
console.log(`locks de RNG exibidos como culpa do jogador .... ${exibidosComoCulpa}`);
