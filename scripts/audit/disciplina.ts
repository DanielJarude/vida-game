/**
 * F6-FIX §6/§20 — HISTÓRICO DE DISCIPLINA.
 *
 * "Você ainda não tem histórico suficiente de disciplina." é um lock
 * legítimo SE o jogador teve oportunidades reais de construir disciplina
 * até a idade do evento. Se não teve, é escassez de conteúdo fantasiada
 * de julgamento comportamental.
 */
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { simularVida, PERFIS } from './simulador';

const EVENTO_ALVO = 'ado_cola_prova';
const IDADE_ALVO = 12; // menor idade em que a opção pode aparecer
const EXIGIDO = 5;

console.log('='.repeat(78));
console.log('F6-FIX §6 — COMO SE CONSTRÓI DISCIPLINA');
console.log('='.repeat(78));

const fontes: { evento: string; opcao: string; idade: string; delta: number }[] = [];
for (const e of MASTER_EVENTS_LIST)
  for (const o of e.opcoes) {
    const d = o.consequencias.impactosComportamentais?.disciplina;
    if (d) fontes.push({ evento: e.id, opcao: o.id, idade: `${e.idadeMinima}-${e.idadeMaxima}`, delta: d });
  }

const ateAlvo = fontes.filter(f => Number(f.idade.split('-')[0]) < IDADE_ALVO);
console.log(`\nfontes de disciplina no catálogo inteiro .... ${fontes.length}`);
console.log(`  positivas ................................. ${fontes.filter(f => f.delta > 0).length}`);
console.log(`  disponíveis ANTES dos ${IDADE_ALVO} anos ............. ${ateAlvo.length}`);
console.log(`  positivas antes dos ${IDADE_ALVO} ................... ${ateAlvo.filter(f => f.delta > 0).length}`);
console.log(`\nmáximo teórico acumulável antes dos ${IDADE_ALVO}: ${ateAlvo.filter(f => f.delta > 0).reduce((s, f) => s + f.delta, 0)}`);
console.log(`exigido pela opção opt_estudar_juntos: ${EXIGIDO}\n`);
for (const f of ateAlvo) console.log(`   ${f.delta > 0 ? '+' : ''}${f.delta}  ${f.evento} [${f.idade}] · ${f.opcao}`);

// Medição real
const idsFonte = new Set(ateAlvo.filter(f => f.delta > 0).map(f => f.evento));
let chegaram = 0, comOportunidade = 0, oportunidadesTotais = 0;
const dist: number[] = [];
for (const perfil of PERFIS)
  for (let i = 0; i < 15; i++) {
    const v = simularVida(1000 + i * 37, perfil);
    const antes = v.anos.filter(a => a.idade < IDADE_ALVO);
    const vistos = new Set<string>();
    antes.forEach(a => a.ocorrenciasDoAno.forEach(x => vistos.add(x)));
    const chegouAoAlvo = v.anos.some(a => a.ocorrenciasDoAno.includes(EVENTO_ALVO));
    const n = [...vistos].filter(x => idsFonte.has(x)).length;
    dist.push(n);
    oportunidadesTotais += n;
    if (chegouAoAlvo) { chegaram++; if (n > 0) comOportunidade++; }
  }

console.log('\n' + '-'.repeat(78));
console.log('MEDIDO NAS 105 VIDAS');
console.log('-'.repeat(78));
console.log(`vidas que chegaram a ${EVENTO_ALVO} ......... ${chegaram}`);
console.log(`  destas, com ao menos 1 oportunidade ....... ${comOportunidade}`);
console.log(`  destas, com NENHUMA oportunidade .......... ${chegaram - comOportunidade}`);
console.log(`oportunidades de disciplina vistas antes dos ${IDADE_ALVO}:`);
console.log(`  total .................................... ${oportunidadesTotais}`);
console.log(`  média por vida ........................... ${(oportunidadesTotais / dist.length).toFixed(2)}`);
console.log(`  vidas com 0 .............................. ${dist.filter(n => n === 0).length}/${dist.length}`);
