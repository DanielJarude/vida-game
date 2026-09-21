/**
 * DIAGNÓSTICO TEMPORÁRIO — Fase 3 (proposta).
 * Mede pacing por faixa etária nas MESMAS 105 vidas do harness das Fases 1-2.
 * Não altera produção. Não faz parte da suíte.
 */
import { PERFIS, Perfil, ResultadoVida, simularVida } from './simulador';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';

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
L(`Vidas simuladas: ${N}`);

const FAIXAS: [string, number, number][] = [
  ['0-2', 0, 2], ['3-5', 3, 5], ['6-11', 6, 11], ['12-14', 12, 14],
  ['15-17', 15, 17], ['18-29', 18, 29], ['30-44', 30, 44],
  ['45-59', 45, 59], ['60+', 60, 200]
];

const porId = new Map(MASTER_EVENTS_LIST.map(e => [e.id, e]));

interface B {
  anosVividos: number; decisoes: number; acontecimentos: number;
  silencios: number; anosSemLog: number; logs: number;
  logsMarco: number; logsTextura: number; acoes: number; anosComAcao: number;
}
const novo = (): B => ({ anosVividos: 0, decisoes: 0, acontecimentos: 0, silencios: 0, anosSemLog: 0, logs: 0, logsMarco: 0, logsTextura: 0, acoes: 0, anosComAcao: 0 });
const buckets = new Map<string, B>(FAIXAS.map(([n]) => [n, novo()]));
const faixaDe = (idade: number) => FAIXAS.find(([, a, b]) => idade >= a && idade <= b)![0];

for (const r of resultados) {
  for (const a of r.anos) {
    const b = buckets.get(faixaDe(a.idade))!;
    b.anosVividos++;
    if (a.eventoDecisao) b.decisoes++;
    if (a.acontecimento) b.acontecimentos++;
    if (a.pulso === 'silencio') b.silencios++;
    if (a.logs.length === 0) b.anosSemLog++;
    b.logs += a.logs.length;
    b.logsMarco += a.logs.filter(l => l.relevancia === 'marco').length;
    b.logsTextura += a.logs.filter(l => l.relevancia === 'textura').length;
    b.acoes += a.acoesVoluntarias.length;
    if (a.acoesVoluntarias.length > 0) b.anosComAcao++;
  }
}

const pct = (x: number, t: number) => t === 0 ? '  -  ' : `${(100 * x / t).toFixed(1)}%`;
L('\n===== PACING POR FAIXA ETÁRIA (todas as vidas somadas) =====');
L('faixa | anos | %ano c/ decisão | %ano c/ acontecimento | %pulso silêncio | %ANO SEM NENHUMA LINHA | logs/ano | %ano c/ ação voluntária');
for (const [nome] of FAIXAS) {
  const b = buckets.get(nome)!;
  L([
    nome.padEnd(6), String(b.anosVividos).padStart(5),
    pct(b.decisoes, b.anosVividos).padStart(8),
    pct(b.acontecimentos, b.anosVividos).padStart(10),
    pct(b.silencios, b.anosVividos).padStart(9),
    pct(b.anosSemLog, b.anosVividos).padStart(10),
    (b.logs / Math.max(1, b.anosVividos)).toFixed(2).padStart(7),
    pct(b.anosComAcao, b.anosVividos).padStart(9)
  ].join(' | '));
}

L('\n===== RELEVÂNCIA DAS ENTRADAS DA LINHA DA VIDA =====');
for (const [nome] of FAIXAS) {
  const b = buckets.get(nome)!;
  L(`${nome.padEnd(6)} total ${String(b.logs).padStart(6)} · marco ${String(b.logsMarco).padStart(5)} · textura ${String(b.logsTextura).padStart(5)} · normal/sem rótulo ${b.logs - b.logsMarco - b.logsTextura}`);
}

L('\n===== SEQUÊNCIAS SILENCIOSAS (anos consecutivos SEM nenhuma linha) =====');
const todasSeq: number[] = [];
const maiorPorVida: number[] = [];
const maiorAdulto: number[] = [];
for (const r of resultados) {
  let c = 0, maior = 0, cA = 0, maiorA = 0;
  for (const a of r.anos) {
    if (a.logs.length === 0) { c++; maior = Math.max(maior, c); } else { if (c) todasSeq.push(c); c = 0; }
    if (a.idade >= 18) {
      if (a.logs.length === 0) { cA++; maiorA = Math.max(maiorA, cA); } else cA = 0;
    }
  }
  if (c) todasSeq.push(c);
  maiorPorVida.push(maior); maiorAdulto.push(maiorA);
}
const ord = (xs: number[]) => [...xs].sort((a, b) => a - b);
const q = (xs: number[], p: number) => ord(xs)[Math.min(xs.length - 1, Math.floor(xs.length * p))];
L(`sequências: ${todasSeq.length} · mediana ${q(todasSeq, .5)} · p90 ${q(todasSeq, .9)} · máx ${Math.max(...todasSeq)}`);
L(`maior sequência POR VIDA: mediana ${q(maiorPorVida, .5)} · p90 ${q(maiorPorVida, .9)} · máx ${Math.max(...maiorPorVida)}`);
L(`maior sequência POR VIDA (só 18+): mediana ${q(maiorAdulto, .5)} · p90 ${q(maiorAdulto, .9)} · máx ${Math.max(...maiorAdulto)}`);
L(`vidas com sequência >= 5 anos mudos: ${maiorPorVida.filter(x => x >= 5).length}/${N}`);
L(`vidas com sequência >= 8 anos mudos: ${maiorPorVida.filter(x => x >= 8).length}/${N}`);

L('\n===== DECISÕES POR VIDA =====');
const decAte18 = resultados.map(r => r.anos.filter(a => a.idade <= 18 && a.eventoDecisao).length);
const decAdulto = resultados.map(r => r.anos.filter(a => a.idade > 18 && a.eventoDecisao).length);
const decTotal = resultados.map(r => r.decisoesTotais);
const acTotal = resultados.map(r => r.acontecimentosTotais);
const st = (nome: string, xs: number[]) => L(`${nome.padEnd(28)} mín ${Math.min(...xs)} · mediana ${q(xs, .5)} · média ${(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1)} · p90 ${q(xs, .9)} · máx ${Math.max(...xs)}`);
st('decisões até os 18', decAte18);
st('decisões depois dos 18', decAdulto);
st('decisões na vida toda', decTotal);
st('acontecimentos na vida toda', acTotal);
L(`vidas que chegaram aos 18 com ZERO decisões: ${decAte18.filter(x => x === 0).length}/${N}`);
L(`vidas com <= 2 decisões até os 18: ${decAte18.filter(x => x <= 2).length}/${N}`);
L(`razão acontecimento:decisão (vida toda): ${(acTotal.reduce((s, x) => s + x, 0) / Math.max(1, decTotal.reduce((s, x) => s + x, 0))).toFixed(2)}:1`);

L('\n===== ANOS ADULTOS (18+) POR CONTEÚDO =====');
let anos18 = 0, comLog = 0, comDec = 0, comAc = 0, comAcao = 0, soFechamento = 0;
for (const r of resultados) for (const a of r.anos) {
  if (a.idade < 18) continue;
  anos18++;
  if (a.logs.length) comLog++;
  if (a.eventoDecisao) comDec++;
  if (a.acontecimento) comAc++;
  if (a.acoesVoluntarias.length) comAcao++;
  if (!a.eventoDecisao && !a.acontecimento && a.logs.length === 0) soFechamento++;
}
L(`anos adultos: ${anos18} · com alguma linha ${pct(comLog, anos18)} · com decisão ${pct(comDec, anos18)} · com acontecimento ${pct(comAc, anos18)} · com ação voluntária ${pct(comAcao, anos18)} · COMPLETAMENTE VAZIOS ${pct(soFechamento, anos18)}`);

L('\n===== COBERTURA DE CONTEÚDO: eventos que NUNCA aparecem =====');
const vistos = new Map<string, number>();
for (const r of resultados) for (const a of r.anos) {
  for (const id of [a.eventoDecisao?.id, a.acontecimento?.id]) if (id) vistos.set(id, (vistos.get(id) ?? 0) + 1);
}
const nunca = MASTER_EVENTS_LIST.filter(e => !vistos.has(e.id));
L(`catálogo: ${MASTER_EVENTS_LIST.length} eventos · vistos ${vistos.size} · NUNCA vistos ${nunca.length}`);
for (const e of nunca) L(`   nunca: ${e.id} (${e.titulo}) ${e.idadeMinima}-${e.idadeMaxima} ${e.natureza ?? 'decisao'}`);
L('mais repetidos:');
for (const [id, n] of [...vistos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  const e = porId.get(id)!;
  L(`   ${String(n).padStart(4)}× ${id} (${e.titulo}) ${e.idadeMinima}-${e.idadeMaxima} ${e.natureza ?? 'decisao'}`);
}

L('\n===== MARCOS DECLARADOS =====');
for (const e of MASTER_EVENTS_LIST.filter(e => e.repeticao?.tipo === 'marco')) {
  let vidas = 0; const idades: number[] = [];
  for (const r of resultados) {
    const a = r.anos.find(x => x.eventoDecisao?.id === e.id || x.acontecimento?.id === e.id);
    if (a) { vidas++; idades.push(a.idade); }
  }
  L(`${e.titulo} (${e.idadeMinima}-${e.idadeMaxima}): ${vidas}/${N} vidas (${(100 * vidas / N).toFixed(0)}%) · idades ${[...new Set(idades)].sort((a, b) => a - b).join(',') || '—'}`);
}

L('\n===== DENSIDADE ESTRUTURAL vs SILÊNCIO (por que o adulto cala) =====');
let satur = 0, silTotal = 0;
const motivos = new Map<string, number>();
for (const r of resultados) for (const a of r.anos) {
  if (a.pulso !== 'silencio') continue;
  silTotal++;
  const chave = a.motivoRitmo.replace(/\(.*\)/, '').trim() + (a.motivoRitmo.includes('saturado') ? ' [saturado]' : '');
  motivos.set(chave, (motivos.get(chave) ?? 0) + 1);
  if (a.motivoRitmo.includes('saturado')) satur++;
}
L(`anos de silêncio: ${silTotal} · por saturação estrutural: ${satur} (${pct(satur, silTotal)})`);
for (const [m, n] of [...motivos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) L(`   ${String(n).padStart(5)}× ${m}`);

L('\n===== COMPOSIÇÃO DOS LOGS (o que enche a Linha da Vida) =====');
const catPorFaixa = new Map<string, Map<string, number>>(FAIXAS.map(([n]) => [n, new Map()]));
const textoNorm = new Map<string, number>();
for (const r of resultados) for (const a of r.anos) {
  const m = catPorFaixa.get(faixaDe(a.idade))!;
  for (const l of a.logs) {
    m.set(l.categoria, (m.get(l.categoria) ?? 0) + 1);
    const chave = l.texto.replace(/\d[\d.,]*/g, '#').replace(/\s+/g, ' ').slice(0, 70);
    textoNorm.set(chave, (textoNorm.get(chave) ?? 0) + 1);
  }
}
for (const [nome] of FAIXAS) {
  const m = catPorFaixa.get(nome)!;
  const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => `${c} ${n}`).join(' · ');
  L(`${nome.padEnd(6)} ${top}`);
}
L('\nTEXTOS MAIS REPETIDOS (números normalizados para #):');
for (const [t, n] of [...textoNorm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  L(`  ${String(n).padStart(5)}× ${t}`);
}

L('\n===== ANOS ADULTOS SÓ COM ROTINA FINANCEIRA =====');
let soFin = 0, adultos = 0;
for (const r of resultados) for (const a of r.anos) {
  if (a.idade < 18) continue;
  adultos++;
  if (a.logs.length > 0 && a.logs.every(l => l.categoria === 'financas' || l.categoria === 'carreira')) soFin++;
}
L(`anos adultos cuja Linha da Vida inteira é finanças/carreira rotineira: ${soFin}/${adultos} (${(100*soFin/adultos).toFixed(1)}%)`);

L('\n===== SATURAÇÃO POR FAIXA E POR CATEGORIA CULPADA =====');
const satPorFaixa = new Map<string, {sil:number; sat:number; anos:number}>(FAIXAS.map(([n])=>[n,{sil:0,sat:0,anos:0}]));
const culpado = new Map<string, number>();
for (const r of resultados) for (const a of r.anos) {
  const s = satPorFaixa.get(faixaDe(a.idade))!;
  s.anos++;
  if (a.pulso === 'silencio') s.sil++;
  if (a.motivoRitmo.includes('saturado')) {
    s.sat++;
    for (const l of a.logs) if (l.categoria !== 'geral' && l.categoria !== 'cotidiano') culpado.set(l.categoria, (culpado.get(l.categoria) ?? 0) + 1);
  }
}
for (const [nome] of FAIXAS) {
  const s = satPorFaixa.get(nome)!;
  L(`${nome.padEnd(6)} anos ${String(s.anos).padStart(5)} · silêncio ${pct(s.sil,s.anos).padStart(7)} · DESTE, saturado ${pct(s.sat,s.anos).padStart(7)} (${s.sat})`);
}
L('categorias que produzem a saturação: ' + [...culpado.entries()].sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c} ${n}`).join(' · '));

L('\n===== CONTRAFACTUAL: e se finanças/carreira ROTINEIRAS não contassem como densidade? =====');
let satSoRotina = 0, satTotal2 = 0;
for (const r of resultados) for (const a of r.anos) {
  if (!a.motivoRitmo.includes('saturado')) continue;
  satTotal2++;
  const estruturais = a.logs.filter(l => l.categoria !== 'geral' && l.categoria !== 'cotidiano');
  const naoRotina = estruturais.filter(l => !(l.categoria === 'financas' || l.categoria === 'carreira'));
  if (naoRotina.length < 2) satSoRotina++;
}
L(`anos saturados: ${satTotal2} · dos quais a saturação vem SÓ de finanças/carreira: ${satSoRotina} (${pct(satSoRotina,satTotal2)})`);

L('\n===== ATIVIDADES DISPONÍVEIS POR IDADE =====');
import('../../src/data/activitiesData').then(async m => {
  const av = await import('../../src/systems/availabilitySystem');
  const base = resultados[0];
  void base;
  const { criarEducacaoInicial } = await import('../../src/systems/educationSystem');
  const { criarCarreiraInicial } = await import('../../src/systems/careerSystem');
  const { criarEconomiaInicial } = await import('../../src/systems/economySystem');
  for (const idade of [1,4,8,13,16,20,25,35,45,55,65,75]) {
    const personagem: any = { id:'x', nome:'A', sobrenome:'B', genero:'masculino', idade, anoAtual:2026+idade, anoNascimento:2026, cidade:'São Paulo', estado:'SP', classeSocial:'classe_media', stats:{felicidade:70,saude:80,inteligencia:70,aparencia:60}, hiddenStats:{disciplina:50,sociabilidade:50,empatia:50,ambicao:50,estresse:10,reputacao:50,condicionamentoFisico:50}, doencas:[], flags:{}, marcos:[] };
    const ctx = { personagem, educacao: criarEducacaoInicial(), carreira: criarCarreiraInicial(), economia: { ...criarEconomiaInicial('classe_media'), dinheiro: 50000 }, familia: [], acoesRealizadasAno: [] };
    const n = m.ATIVIDADES_DISPONIVEIS.filter(a => av.getActionAvailability(ctx as any, 'executar_atividade', { atividadeId: a.id }).kind === 'disponivel').length;
    L(`  idade ${String(idade).padStart(2)}: ${n}/${m.ATIVIDADES_DISPONIVEIS.length} atividades`);
  }
});
