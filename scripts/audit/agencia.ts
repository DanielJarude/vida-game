/**
 * AUDITORIA F3 — AGÊNCIA DO JOGADOR, MEDIDA SEM FUNDIR CATEGORIAS.
 *
 * Duas correções de método em relação à primeira versão deste script.
 *
 * 1. "Zero vidas com 0 decisões aos 18" era uma meta semanticamente errada:
 *    para cumpri-la o motor teria de inventar decisões artificiais, que é
 *    exatamente o que o projeto proíbe. A pergunta certa é de CONVERSÃO —
 *    quando havia decisão disponível e o ritmo quis perguntar, ela chegou ao
 *    jogador? Ano sem nada elegível e sem pergunta é um ano correto.
 *
 * 2. Um número agregado de "decisões" escondia o defeito que esta fase
 *    corrige. *A Primeira Palavra* é uma ESCOLHA BIOGRÁFICA: o jogador
 *    participa da biografia sem tomar posição sobre nada. Somada às decisões
 *    contextuais, ela fazia a agência parecer saudável enquanto consumia a
 *    cota de decisão da faixa 3-5 e zerava aquela faixa. Por isso as sete
 *    métricas abaixo são reportadas SEPARADAS, e a visão de AGÊNCIA TOTAL
 *    aparece depois delas, somando sem misturar:
 *
 *      (A) decisões contextuais apresentadas
 *      (B) escolhas biográficas apresentadas
 *      (C) escolhas-chave / marcos com participação do jogador
 *      (D) atividades voluntárias realizadas
 *      (E) oportunidades contextuais elegíveis
 *      (F) oportunidades contextuais apresentadas
 *      (G) taxa de conversão do scheduler
 *
 * Roda o pipeline real, sobre as MESMAS 105 vidas do harness das fases 1-2.
 */

import { PERFIS, Perfil, ResultadoVida, simularVida } from './simulador';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { classificacaoDoEvento } from '../../src/systems/events/taxonomia';
import { taxonomiaConsomeCotaDeDecisao } from '../../src/types';
import { ehConteudoDeMarco } from '../../src/data/calendario/marcosDeVida';

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);
const resultados: ResultadoVida[] = [];
let seed = 1000;
for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    seed += 7919;
    resultados.push(simularVida(seed, perfil as Perfil, 100));
  }
}
const N = resultados.length;
const L = (s = '') => console.log(s);
const pct = (n: number, d: number) => (d === 0 ? '—' : `${((100 * n) / d).toFixed(1)}%`);

const FAIXAS: [string, number, number][] = [
  ['0-2', 0, 2], ['3-5', 3, 5], ['6-11', 6, 11], ['12-14', 12, 14],
  ['15-17', 15, 17], ['18-29', 18, 29], ['30-44', 30, 44],
  ['45-59', 45, 59], ['60+', 60, 200]
];
const faixaDe = (idade: number) => FAIXAS.find(([, a, b]) => idade >= a && idade <= b)![0];

/** Quantas DECISÕES CONTEXTUAIS o catálogo tem para cada idade. */
const contextuaisPorIdade = new Map<number, number>();
for (let idade = 0; idade <= 100; idade++) {
  const n = MASTER_EVENTS_LIST.filter(e => {
    return (
      idade >= e.idadeMinima && idade <= e.idadeMaxima &&
      taxonomiaConsomeCotaDeDecisao(classificacaoDoEvento(e)) &&
      !ehConteudoDeMarco(e.id)
    );
  }).length;
  contextuaisPorIdade.set(idade, n);
}

interface Balde {
  anos: number;
  decisoesContextuais: number;   // (A)
  escolhasBiograficas: number;   // (B)
  marcosComParticipacao: number; // (C)
  atividades: number;            // (D)
  anosComAtividade: number;
  anosComElegivel: number;       // (E)
  ritmoQuisPerguntar: number;
  apresentou: number;            // (F)
  falhasDeScheduler: number;
}
const novo = (): Balde => ({
  anos: 0, decisoesContextuais: 0, escolhasBiograficas: 0, marcosComParticipacao: 0,
  atividades: 0, anosComAtividade: 0, anosComElegivel: 0, ritmoQuisPerguntar: 0,
  apresentou: 0, falhasDeScheduler: 0
});
const baldes = new Map<string, Balde>(FAIXAS.map(([n]) => [n, novo()]));
const total = novo();

/** Decisões contextuais por vida, para a distribuição. */
const contextuaisAte18: number[] = [];
const contextuaisTotal: number[] = [];
const biograficasTotal: number[] = [];

for (const r of resultados) {
  let ate18 = 0, contextuais = 0, biograficas = 0;

  for (const a of r.anos) {
    const b = baldes.get(faixaDe(a.idade))!;
    b.anos++; total.anos++;

    const taxonomia = a.eventoDecisao?.taxonomia;
    const ehContextual = taxonomia === 'decisao_comportamental';
    const ehBiografica = taxonomia === 'escolha_biografica';

    if (ehContextual) {
      b.decisoesContextuais++; total.decisoesContextuais++;
      contextuais++;
      if (a.idade <= 18) ate18++;
    }
    if (ehBiografica) {
      b.escolhasBiograficas++; total.escolhasBiograficas++;
      biograficas++;
    }
    // (C) marco em que o jogador participou: é sempre uma escolha-chave
    // conduzida pelo calendário, não pelo sorteio.
    if (a.eventoDecisao && ehConteudoDeMarco(a.eventoDecisao.id)) {
      b.marcosComParticipacao++; total.marcosComParticipacao++;
    }

    b.atividades += a.acoesVoluntarias.length;
    total.atividades += a.acoesVoluntarias.length;
    if (a.acoesVoluntarias.length > 0) { b.anosComAtividade++; total.anosComAtividade++; }

    // (E) havia decisão CONTEXTUAL no catálogo para esta idade?
    const tinha = (contextuaisPorIdade.get(a.idade) ?? 0) > 0;
    if (tinha) { b.anosComElegivel++; total.anosComElegivel++; }

    const ritmoQuis = a.pulso === 'decisao';
    if (ritmoQuis) { b.ritmoQuisPerguntar++; total.ritmoQuisPerguntar++; }
    if (ehContextual) { b.apresentou++; total.apresentou++; }

    // (G) FALHA DE SCHEDULER: o ritmo quis perguntar, o catálogo tinha o que
    // perguntar, e mesmo assim nada contextual chegou ao jogador.
    if (ritmoQuis && tinha && !ehContextual) {
      b.falhasDeScheduler++; total.falhasDeScheduler++;
    }
  }

  contextuaisAte18.push(ate18);
  contextuaisTotal.push(contextuais);
  biograficasTotal.push(biograficas);
}

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

L(`Vidas simuladas: ${N}\n`);

L('===== (A)(B)(C) AGÊNCIA APRESENTADA, POR FAIXA — CATEGORIAS SEPARADAS =====');
L('Lê-se: em que % dos anos daquela faixa o jogador foi chamado a participar,');
L('e de que espécie foi a participação. As colunas NÃO devem ser somadas aqui.');
L('');
L('faixa  |  anos | (A) decisão contextual | (B) escolha biográfica | (C) marco c/ participação');
for (const [nome] of FAIXAS) {
  const b = baldes.get(nome)!;
  L(
    `${nome.padEnd(6)} | ${String(b.anos).padStart(5)} | ` +
    `${(`${b.decisoesContextuais} (${pct(b.decisoesContextuais, b.anos)})`).padStart(22)} | ` +
    `${(`${b.escolhasBiograficas} (${pct(b.escolhasBiograficas, b.anos)})`).padStart(22)} | ` +
    `${(`${b.marcosComParticipacao} (${pct(b.marcosComParticipacao, b.anos)})`).padStart(25)}`
  );
}

L('\n===== (D) ATIVIDADES VOLUNTÁRIAS =====');
L('Agência que não passa por evento nenhum: o jogador agindo por conta própria.');
L('');
L('faixa  |  anos | atividades | anos com ao menos uma');
for (const [nome] of FAIXAS) {
  const b = baldes.get(nome)!;
  L(
    `${nome.padEnd(6)} | ${String(b.anos).padStart(5)} | ${String(b.atividades).padStart(10)} | ` +
    `${pct(b.anosComAtividade, b.anos).padStart(21)}`
  );
}

L('\n===== (E)(F)(G) OPORTUNIDADE CONTEXTUAL E CONVERSÃO DO SCHEDULER =====');
L('(E) anos em que o catálogo tinha decisão contextual para aquela idade.');
L('(F) anos em que uma decisão contextual foi de fato apresentada.');
L('(G) dos anos em que o ritmo QUIS perguntar e HAVIA o que perguntar,');
L('    em quantos a pergunta chegou. Falha = quis, havia, não chegou.');
L('');
L('faixa  |  anos | (E) c/ elegível | ritmo quis | (F) apresentou | (G) conversão | falhas');
for (const [nome] of FAIXAS) {
  const b = baldes.get(nome)!;
  const oportunidades = b.ritmoQuisPerguntar;
  const convertidas = oportunidades - b.falhasDeScheduler;
  L(
    `${nome.padEnd(6)} | ${String(b.anos).padStart(5)} | ${pct(b.anosComElegivel, b.anos).padStart(15)} | ` +
    `${pct(b.ritmoQuisPerguntar, b.anos).padStart(10)} | ${pct(b.apresentou, b.anos).padStart(14)} | ` +
    `${pct(convertidas, oportunidades).padStart(13)} | ${String(b.falhasDeScheduler).padStart(6)}`
  );
}

L('\n===== AGÊNCIA TOTAL DO JOGADOR =====');
L('Uma visão de conjunto, mantendo as parcelas visíveis. Nenhuma categoria');
L('desaparece dentro de outra: o total existe para mostrar que a vida oferece');
L('participação, as parcelas para mostrar de que tipo ela é.');
L('');
const agenciaPorEvento = total.decisoesContextuais + total.escolhasBiograficas;
L(`(A) decisões contextuais apresentadas ......... ${total.decisoesContextuais}`);
L(`(B) escolhas biográficas apresentadas ......... ${total.escolhasBiograficas}`);
L(`(C) marcos com participação do jogador ........ ${total.marcosComParticipacao}`);
L(`(D) atividades voluntárias realizadas ......... ${total.atividades}`);
L(`     -------------------------------------------------`);
L(`participações em evento (A+B) ................. ${agenciaPorEvento}`);
L(`AGÊNCIA TOTAL, incluindo atividades (A+B+D) ... ${agenciaPorEvento + total.atividades}`);
L('');
L(`(E) anos com decisão contextual elegível ...... ${total.anosComElegivel} (${pct(total.anosComElegivel, total.anos)} de ${total.anos} anos)`);
L(`(F) anos que apresentaram decisão contextual .. ${total.apresentou}`);
L(`(G) TAXA DE CONVERSÃO DO SCHEDULER ............ ${pct(total.ritmoQuisPerguntar - total.falhasDeScheduler, total.ritmoQuisPerguntar)}`);
L(`     falhas de scheduler ...................... ${total.falhasDeScheduler}`);

L('\n===== DISTRIBUIÇÃO POR VIDA =====');
const st = (nome: string, xs: number[]) =>
  L(`${nome.padEnd(38)} mín ${Math.min(...xs)} · mediana ${q(xs, .5)} · média ${(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1)} · p90 ${q(xs, .9)} · máx ${Math.max(...xs)}`);
st('decisões contextuais até os 18', contextuaisAte18);
st('decisões contextuais na vida toda', contextuaisTotal);
st('escolhas biográficas na vida toda', biograficasTotal);
L(`vidas com ZERO decisões contextuais até os 18: ${contextuaisAte18.filter(x => x === 0).length}/${N}`);
L(`vidas com <= 2 decisões contextuais até os 18: ${contextuaisAte18.filter(x => x <= 2).length}/${N}`);
L(`vidas com ZERO participação em evento na vida: ${resultados.filter((_, i) => contextuaisTotal[i] + biograficasTotal[i] === 0).length}/${N}`);
