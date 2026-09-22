/**
 * AUDITORIA PÓS-PLAYTEST — Achado 2, medição precisa.
 *
 * DIAGNÓSTICO APENAS.
 *
 * A primeira varredura procurou marcas de desfecho em `evento.descricao` e
 * achou quase nada — porque estava olhando o campo errado. O que o jogador lê
 * na Linha da Vida, num acontecimento automático, é `opcao.descricaoResultado`.
 * `evento.descricao` (a SITUAÇÃO) não é registrada em lugar nenhum:
 * `agingSystem` chama `aplicarConsequenciasEscolha`, e o único log narrativo
 * criado lá vem de `descricaoResultado`.
 *
 * Então o achado do playtest não é "alguns textos ficaram ruins na conversão".
 * É estrutural: TODO acontecimento automático entrega só o desfecho. Alguns
 * desfechos se sustentam sozinhos; outros, não. Este script separa os dois.
 *
 * Uso: npx tsx scripts/audit/narrativaSemContexto.ts
 */

import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { classificacaoDoEvento } from '../../src/systems/events/taxonomia';
import type { GameEvent, EventOption } from '../../src/types';

const eventos = MASTER_EVENTS_LIST as GameEvent[];

function ehAutomatico(e: GameEvent): boolean {
  const t = classificacaoDoEvento(e);
  return t === 'acontecimento_puro' || t === 'marco_testemunhado' || t === 'pequena_memoria';
}

/**
 * O desfecho REFERENCIA algo que só a situação explicaria?
 *
 * Pistas de dependência de contexto, em ordem de força:
 *  - artigo definido sobre um objeto nunca apresentado ("o monstro", "a briga")
 *  - pronome/anáfora sem antecedente no próprio texto ("ele melhorou")
 *  - aspas de ironia, que citam algo dito antes ("o 'monstro'")
 *  - conector de resolução no início ("no fim", "acabou")
 */
const PISTAS: { nome: string; re: RegExp; peso: number }[] = [
  { nome: 'aspas-de-ironia', re: /["'“”][^"'“”]{2,20}["'“”]/, peso: 3 },
  { nome: 'verbo-de-resolução', re: /\b(descobriu que|percebeu que|acabou (sendo|dando|virando))\b/i, peso: 3 },
  { nome: 'anáfora-sem-antecedente', re: /^(ele|ela|eles|elas|isso|aquilo)\b/i, peso: 3 },
  { nome: 'conector-de-fecho', re: /\b(no fim das contas|no final|mesmo assim|ainda assim|por fim)\b/i, peso: 2 },
  { nome: 'emoção-conclusiva', re: /\b(ficou|ficaram) (orgulhos|alivi|felic|alegr|tranquil|satisfeit|content|envergonhad|frustrad)/i, peso: 2 },
  { nome: 'retomada-com-artigo', re: /\b(o|a) (monstro|briga|discussão|problema|situação|assunto|barulho|susto)\b/i, peso: 2 },
  { nome: 'comparativo-implícito', re: /\b(voltou a|de novo|outra vez|como antes)\b/i, peso: 1 },
  { nome: 'atribui-deliberação', re: /\bvocê (decidiu|resolveu|optou|escolheu|encarou|enfrentou|preferiu|recusou|aceitou)\b/i, peso: 3 }
];

type Classe = 'A' | 'B' | 'C' | 'D';

const DESCRICAO: Record<Classe, string> = {
  A: 'narrativa completa — o desfecho se explica sozinho',
  B: 'parece desfecho sem contexto — depende da situação para fazer sentido',
  C: 'atribui ação deliberada ao jogador que ele não escolheu',
  D: 'correto como acontecimento automático (fato observado, sem deliberação)'
};

type Achado = {
  id: string;
  opcaoId: string;
  classe: Classe;
  pontos: number;
  pistas: string[];
  texto: string;
};

const achados: Achado[] = [];
const automaticos = eventos.filter(ehAutomatico);

for (const e of automaticos) {
  for (const o of e.opcoes as EventOption[]) {
    const texto = o.descricaoResultado ?? '';
    if (!texto) continue;

    const pistas: string[] = [];
    let pontos = 0;
    for (const p of PISTAS) {
      if (p.re.test(texto)) {
        pistas.push(p.nome);
        pontos += p.peso;
      }
    }

    const deliberacao = pistas.includes('atribui-deliberação');
    let classe: Classe;
    if (deliberacao) classe = 'C';
    else if (pontos >= 3) classe = 'B';
    else if (pontos >= 1) classe = 'B';
    else classe = 'D';

    achados.push({ id: e.id, opcaoId: o.id, classe, pontos, pistas, texto });
  }
}

console.log('='.repeat(78));
console.log('ACHADO 2 — O QUE O JOGADOR REALMENTE LÊ NUM ACONTECIMENTO AUTOMÁTICO');
console.log('='.repeat(78));
console.log();
console.log('FATO ESTRUTURAL, verificado no código:');
console.log('  agingSystem.resolverAcontecimento -> aplicarConsequenciasEscolha');
console.log('  e o ÚNICO log narrativo criado usa `opcao.descricaoResultado`.');
console.log('  `evento.descricao` (a SITUAÇÃO) nunca chega à Linha da Vida.');
console.log();
console.log(`acontecimentos automáticos ........ ${automaticos.length}`);
console.log(`desfechos possíveis (opções) ...... ${achados.length}`);
console.log();

for (const c of ['C', 'B', 'D'] as Classe[]) {
  const lista = achados.filter((a) => a.classe === c);
  console.log(`CLASSE ${c} — ${DESCRICAO[c]}`);
  console.log(`  ${lista.length} desfechos (${((lista.length / achados.length) * 100).toFixed(1)}%)`);
  console.log();
}

console.log('-'.repeat(78));
console.log('CLASSE C — ATRIBUI DELIBERAÇÃO AO JOGADOR (mais grave)');
console.log('-'.repeat(78));
const classeC = achados.filter((a) => a.classe === 'C');
for (const a of classeC) {
  console.log(`\n· ${a.id} / ${a.opcaoId}`);
  console.log(`  "${a.texto}"`);
}

console.log('\n' + '-'.repeat(78));
console.log('CLASSE B — DESFECHO QUE DEPENDE DA SITUAÇÃO (pontuação >= 3)');
console.log('-'.repeat(78));
const classeBForte = achados.filter((a) => a.classe === 'B' && a.pontos >= 3);
for (const a of classeBForte) {
  const ev = eventos.find((e) => e.id === a.id)!;
  console.log(`\n· ${a.id} / ${a.opcaoId}  [${a.pistas.join(', ')}]`);
  console.log(`  SITUAÇÃO (nunca exibida): "${ev.descricao}"`);
  console.log(`  O JOGADOR LÊ APENAS:      "${a.texto}"`);
}

console.log('\n' + '='.repeat(78));
console.log('RESUMO POR EVENTO (quantos desfechos problemáticos cada um tem)');
console.log('='.repeat(78));
const porEvento = new Map<string, { b: number; c: number; total: number }>();
for (const a of achados) {
  const cur = porEvento.get(a.id) ?? { b: 0, c: 0, total: 0 };
  cur.total++;
  if (a.classe === 'B') cur.b++;
  if (a.classe === 'C') cur.c++;
  porEvento.set(a.id, cur);
}
const criticos = [...porEvento.entries()]
  .filter(([, v]) => v.b + v.c > 0)
  .sort((a, b) => b[1].c - a[1].c || b[1].b - a[1].b);

console.log(`\neventos com ao menos um desfecho classe B ou C: ${criticos.length} de ${automaticos.length}\n`);
for (const [id, v] of criticos) {
  console.log(`  ${id.padEnd(38)} B=${v.b} C=${v.c} de ${v.total}`);
}

console.log('\n' + '='.repeat(78));
console.log('CONTAGEM FINAL');
console.log('='.repeat(78));
console.log(`classe A/D (sustentam-se sozinhos) ... ${achados.filter((a) => a.classe === 'D').length}`);
console.log(`classe B (precisam de contexto) ...... ${achados.filter((a) => a.classe === 'B').length}`);
console.log(`classe C (deliberação indevida) ...... ${classeC.length}`);
