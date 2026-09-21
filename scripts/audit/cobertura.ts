/**
 * AUDITORIA F3 — CONTEÚDO QUE NUNCA APARECE.
 *
 * A meta NÃO é maximizar cobertura. É não ter conteúdo morto sem intenção:
 * um evento que não sai porque a amostra é pequena é aceitável; um evento
 * que ficou inalcançável por acidente é regressão.
 *
 * Para cada evento nunca visto nas 105 vidas, este script informa o que
 * permite decidir entre as duas coisas: faixa, taxonomia, peso, concorrência
 * na mesma faixa, se a faixa é ocupada por marco garantido e quantos anos de
 * oportunidade a faixa oferece.
 */
import { PERFIS, Perfil, ResultadoVida, simularVida } from './simulador';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { classificacaoDoEvento } from '../../src/systems/events/taxonomia';
import { MARCOS_DE_VIDA, ehConteudoDeMarco } from '../../src/data/calendario/marcosDeVida';

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

const vistos = new Set<string>();
for (const r of resultados) {
  for (const a of r.anos) {
    if (a.eventoDecisao) vistos.add(a.eventoDecisao.id);
    if (a.acontecimento) vistos.add(a.acontecimento.id);
  }
}

const naoVistos = MASTER_EVENTS_LIST.filter(e => !vistos.has(e.id));
L(`Vidas simuladas: ${N}`);
L(`catálogo ${MASTER_EVENTS_LIST.length} · vistos ${vistos.size} · NUNCA vistos ${naoVistos.length}\n`);

// Idades cobertas por marco garantido (o calendário silencia o sorteio nesses anos).
const idadesDeMarco = new Set<number>();
for (const m of MARCOS_DE_VIDA) {
  for (let i = m.janela.idadeMinima; i <= m.janela.idadeMaxima; i++) idadesDeMarco.add(i);
}

const concorrentes = (min: number, max: number, taxonomia: string) =>
  MASTER_EVENTS_LIST.filter(e =>
    e.idadeMinima <= max && e.idadeMaxima >= min &&
    classificacaoDoEvento(e) === taxonomia
  );

L('===== EVENTOS NUNCA VISTOS — CLASSIFICAÇÃO INDIVIDUAL =====');
for (const e of naoVistos) {
  const tax = classificacaoDoEvento(e);
  const conc = concorrentes(e.idadeMinima, e.idadeMaxima, tax);
  const pesoTotal = conc.reduce((s, c) => s + c.peso, 0);
  const anosNaFaixa = e.idadeMaxima - e.idadeMinima + 1;
  const marcosNaFaixa = [...idadesDeMarco].filter(i => i >= e.idadeMinima && i <= e.idadeMaxima);
  const chance = pesoTotal > 0 ? e.peso / pesoTotal : 0;
  L('');
  L(`${e.id}  «${e.titulo}»`);
  L(`  faixa ${e.idadeMinima}-${e.idadeMaxima} (${anosNaFaixa} anos) · ${tax} · peso ${e.peso} · categoria ${e.categoria}`);
  L(`  concorre com ${conc.length} eventos da mesma taxonomia nessa faixa (peso somado ${pesoTotal})`);
  L(`  fatia de sorteio se a faixa rolar: ${(100 * chance).toFixed(1)}%`);
  L(`  idades da faixa ocupadas por marco garantido: ${marcosNaFaixa.length ? marcosNaFaixa.join(', ') : 'nenhuma'}`);
  L(`  é conteúdo de marco: ${ehConteudoDeMarco(e.id) ? 'SIM' : 'não'}`);
  const cond = e.condicoes ? Object.keys(e.condicoes) : [];
  L(`  condições declaradas: ${cond.length ? cond.join(', ') : 'nenhuma'}`);
  // Oportunidades esperadas na amostra: anos da faixa × vidas × chance.
  L(`  ocorrências esperadas em ${N} vidas se a faixa sorteasse 1 evento/ano: ${(anosNaFaixa * N * chance).toFixed(1)}`);
}

// ---------------------------------------------------------------------------
// Diagnóstico complementar: o sorteio chega a rodar nessas faixas?
// ---------------------------------------------------------------------------
L('\n===== O SORTEIO CHEGA A RODAR NAS FAIXAS SUSPEITAS? =====');
const faixasSuspeitas: [string, number, number][] = [['0-2', 0, 2], ['3-5', 3, 5], ['4-5', 4, 5]];
for (const [nome, min, max] of faixasSuspeitas) {
  let anos = 0, comSorteio = 0, silencio = 0, marco = 0;
  const idsVistos = new Map<string, number>();
  for (const r of resultados) for (const a of r.anos) {
    if (a.idade < min || a.idade > max) continue;
    anos++;
    const id = a.eventoDecisao?.id ?? a.acontecimento?.id;
    if (id) {
      comSorteio++;
      idsVistos.set(id, (idsVistos.get(id) ?? 0) + 1);
      if (ehConteudoDeMarco(id)) marco++;
    }
    if (a.pulso === 'silencio') silencio++;
  }
  L(`\n${nome}: ${anos} anos · com evento ${comSorteio} · destes vindos de marco ${marco} · pulso silêncio ${silencio}`);
  const doSorteio = [...idsVistos].filter(([id]) => !ehConteudoDeMarco(id));
  L(`  eventos DO SORTEIO que apareceram: ${doSorteio.length ? doSorteio.map(([id, n]) => `${id}×${n}`).join(' · ') : 'NENHUM'}`);
}

// Duas condições específicas, verificadas na amostra.
L('\n===== CONDIÇÕES RARAS, VERIFICADAS NA AMOSTRA =====');
// hob_banda_garagem exige a flag sabe_tocar_violao, concedida por UMA opção
// de UM evento (inf_aula_musica, 9-11). Cadeia de dois passos improváveis.
let viuAulaMusica = 0, escolheuViolao = 0;
for (const r of resultados) {
  const ano = r.anos.find(a => a.eventoDecisao?.id === 'inf_aula_musica');
  if (ano) {
    viuAulaMusica++;
    if (/violão/i.test(ano.eventoDecisao!.opcaoEscolhida)) escolheuViolao++;
  }
}
L(`vidas em que 'inf_aula_musica' (única origem da flag sabe_tocar_violao) apareceu: ${viuAulaMusica}/${N}`);
L(`  destas, escolheram a opção do violão: ${escolheuViolao}`);

// lat_tempo_que_sobra exige empregado:false a partir dos 60.
let anos60 = 0, anos60Aposentado = 0;
for (const r of resultados) for (const a of r.anos) {
  if (a.idade < 60) continue;
  anos60++;
  if (!a.cargo) anos60Aposentado++;
}
L(`anos 60+ na amostra: ${anos60} · destes SEM cargo (condição empregado:false): ${anos60Aposentado} (${((100*anos60Aposentado)/Math.max(1,anos60)).toFixed(1)}%)`);

L('\n===== FAIXA 0-2, ANO A ANO =====');
for (const idade of [0, 1, 2]) {
  let anos = 0, silencio = 0, acont = 0, dec = 0, comEvento = 0;
  const pulsos = new Map<string, number>();
  for (const r of resultados) for (const a of r.anos) {
    if (a.idade !== idade) continue;
    anos++;
    pulsos.set(a.motivoRitmo, (pulsos.get(a.motivoRitmo) ?? 0) + 1);
    if (a.pulso === 'silencio') silencio++;
    if (a.pulso === 'acontecimento') acont++;
    if (a.pulso === 'decisao') dec++;
    if (a.eventoDecisao || a.acontecimento) comEvento++;
  }
  L(`\nidade ${idade}: ${anos} anos · silêncio ${silencio} · acontecimento ${acont} · decisão ${dec} · com evento ${comEvento}`);
  for (const [motivo, n] of [...pulsos].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    L(`    ${n}× ${motivo}`);
  }
}
