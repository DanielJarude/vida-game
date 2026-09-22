/**
 * AUDITORIA PÓS-PLAYTEST — Achado 2 (desfecho sem contexto) e Achado 4
 * (evento pressupõe estado que o motor não valida).
 *
 * DIAGNÓSTICO APENAS. Não altera nada em produção.
 *
 * O método é o mesmo nos dois achados: comparar o que o TEXTO pressupõe com o
 * que o bloco `condicoes` realmente exige. A varredura léxica aqui serve para
 * ENCONTRAR candidatos no catálogo inteiro (134 eventos, longos demais para
 * ler de uma vez); a classificação final de cada caso é feita por leitura
 * humana e registrada no relatório. Regex sozinha não decide nada.
 *
 * Uso: npx tsx scripts/audit/pressupostos.ts
 */

import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import type { GameEvent } from '../../src/types';

const eventos = MASTER_EVENTS_LIST as GameEvent[];

// ---------------------------------------------------------------------------
// Vocabulário que a elegibilidade REALMENTE entende hoje (src/types, bloco
// `condicoes`, avaliado em systems/events/eligibility.ts).
// ---------------------------------------------------------------------------
const PREDICADOS_EXISTENTES = [
  'genero',
  'faseVida',
  'empregado',
  'emEscola',
  'emFaculdade',
  'temParceiro',
  'temFilhos',
  'dinheiroMinimo',
  'dinheiroMaximo',
  'flagsNecessarias',
  'flagsProibidas',
  'saudeMinima',
  'saudeMaxima',
  'personalidade'
] as const;

/**
 * Cada entrada é um ESTADO CONCRETO que um texto pode pressupor, com o
 * predicado que o validaria. `predicado: null` = o motor não tem como exigir
 * isso hoje, nem que o autor do evento quisesse.
 */
const PRESSUPOSTOS: {
  nome: string;
  termos: RegExp;
  predicado: string | null;
  estadoExiste: string;
}[] = [
  {
    nome: 'PET',
    termos: /\b(pet|bichinho|cachorr[oa]|gat[oa]|filhote|veterinári|ração|coleira|late|latido|miado)\b/i,
    predicado: null,
    estadoExiste: "SIM — FamilyMember.tipo === 'pet'"
  },
  {
    nome: 'PARCEIRO',
    termos: /\b(namorad[oa]|noiv[oa]|espos[oa]|cônjuge|marido|mulher|parceir[oa]|casamento|casad[oa])\b/i,
    predicado: 'temParceiro',
    estadoExiste: 'SIM — FamilyMember tipos de parceria'
  },
  {
    nome: 'FILHO',
    termos: /\b(seu filho|sua filha|seus filhos|suas filhas|crianças em casa|paternidade|maternidade)\b/i,
    predicado: 'temFilhos',
    estadoExiste: "SIM — FamilyMember.tipo 'filho'/'filha'"
  },
  {
    nome: 'IRMÃO',
    termos: /\b(irmã[oa]s?|seu irmão|sua irmã)\b/i,
    predicado: null,
    estadoExiste: "SIM — FamilyMember.tipo 'irmao'/'irma'"
  },
  {
    nome: 'PAIS',
    termos: /\b(seus pais|sua mãe|seu pai|em casa com os pais)\b/i,
    predicado: null,
    estadoExiste: "SIM — FamilyMember.tipo 'pai'/'mae'"
  },
  {
    nome: 'EMPREGO',
    termos: /\b(no trabalho|seu chefe|seu emprego|colega de trabalho|escritório|expediente|sal[áa]rio|empresa|reunião)\b/i,
    predicado: 'empregado',
    estadoExiste: 'SIM — CareerState.empregado'
  },
  {
    nome: 'ESCOLA',
    termos: /\b(na escola|professor[a]?|sala de aula|colégio|prova|dever de casa|recreio|boletim)\b/i,
    predicado: 'emEscola',
    estadoExiste: 'SIM — EducationState.emCurso'
  },
  {
    nome: 'FACULDADE',
    termos: /\b(faculdade|universidade|campus|vestibular|trote|tcc|graduação)\b/i,
    predicado: 'emFaculdade',
    estadoExiste: 'SIM — EducationState.tipoCurso'
  },
  {
    nome: 'CARRO',
    termos: /\b(seu carro|do seu carro|dirigindo|volante|garagem|pneu|combustível|estepe|oficina mecânica)\b/i,
    predicado: null,
    estadoExiste: 'PARCIAL — EconomyState.veiculos'
  },
  {
    nome: 'IMÓVEL',
    termos: /\b(seu apartamento|sua casa própria|seu imóvel|condomínio|síndico|vizinho de porta|mudança de casa)\b/i,
    predicado: null,
    estadoExiste: 'PARCIAL — EconomyState.imoveis'
  },
  {
    nome: 'DÍVIDA',
    termos: /\b(dívida|parcela atrasada|cobrança|negativad[oa]|juros|financiamento)\b/i,
    predicado: null,
    estadoExiste: 'PARCIAL — EconomyState.dividas'
  },
  {
    nome: 'AMIGO',
    termos: /\b(seu amigo|sua amiga|seus amigos|melhor amig[oa]|turma de amigos)\b/i,
    predicado: null,
    estadoExiste: "PARCIAL — FamilyMember.tipo 'amigo'"
  },
  {
    nome: 'CIDADE/LOCAL',
    termos: /\b(sua cidade|seu bairro|na capital|interior|mudou de cidade)\b/i,
    predicado: null,
    estadoExiste: 'SIM — Character.cidade/estado'
  }
];

// ---------------------------------------------------------------------------
// Achado 2 — texto que soa a DESFECHO em vez de situação.
//
// A pista estrutural: um acontecimento automático deve NARRAR o que aconteceu.
// Quando ele já contém o resultado emocional fechado ("ficou orgulhoso de si
// mesmo") ou atribui deliberação ao jogador ("você decidiu", "você encarou"),
// o texto provavelmente nasceu como `descricaoResultado` de uma decisão.
// ---------------------------------------------------------------------------
const MARCAS_DE_DESFECHO = [
  { nome: 'descobriu-que', re: /\bdescobriu que\b/i },
  { nome: 'ficou-<emoção>', re: /\bficou (orgulhos|felic|alivi|tranquil|satisfeit|content)/i },
  { nome: 'no-fim/no-final', re: /\b(no fim das contas|no final|acabou (sendo|dando))\b/i },
  { nome: 'voltou-a', re: /\bvoltou a\b/i },
  { nome: 'aprendeu-que', re: /\baprendeu que\b/i }
];

const MARCAS_DE_DELIBERACAO = [
  { nome: 'você-decidiu', re: /\bvocê (decidiu|resolveu|optou|escolheu)\b/i },
  { nome: 'você-encarou', re: /\bvocê (encarou|enfrentou|confrontou)\b/i },
  { nome: 'você-preferiu', re: /\bvocê preferiu\b/i }
];

function taxonomiaDe(e: GameEvent): string {
  if (e.taxonomia) return e.taxonomia;
  return e.natureza === 'acontecimento' ? 'acontecimento_puro(inferido)' : 'decisao(inferida)';
}

function ehAutomatico(e: GameEvent): boolean {
  const t = taxonomiaDe(e);
  return t.startsWith('acontecimento') || t === 'marco_testemunhado' || t === 'pequena_memoria';
}

console.log('='.repeat(78));
console.log('ACHADO 4 — EVENTOS QUE PRESSUPÕEM ESTADO CONCRETO');
console.log('='.repeat(78));
console.log();
console.log('Comparação: o que o TEXTO pressupõe  vs  o que `condicoes` exige.');
console.log('"risco" = o evento pode aparecer para quem não tem aquele estado.\n');

type Linha = {
  id: string;
  pressuposto: string;
  predicado: string | null;
  valida: boolean;
  risco: 'ALTO' | 'MÉDIO' | 'NENHUM';
};

const matriz: Linha[] = [];

for (const e of eventos) {
  const texto = [
    e.titulo,
    e.descricao,
    ...e.opcoes.flatMap((o) => [o.texto ?? '', o.descricaoResultado ?? ''])
  ].join(' \n ');

  for (const p of PRESSUPOSTOS) {
    if (!p.termos.test(texto)) continue;

    const cond = (e.condicoes ?? {}) as Record<string, unknown>;
    let valida = false;
    if (p.predicado && cond[p.predicado] !== undefined) valida = true;
    // Uma flag necessária pode cobrir o pressuposto de forma indireta.
    const flags = (cond.flagsNecessarias as string[] | undefined) ?? [];
    if (flags.length > 0) valida = true;

    // Só é risco se o pressuposto for sobre algo que pode NÃO existir.
    // "pais" e "irmãos" quase sempre existem no início da vida; o risco real
    // é menor, mas não é zero (família varia, e pais morrem).
    const quaseSempreExiste = p.nome === 'PAIS' || p.nome === 'IRMÃO';
    const risco: Linha['risco'] = valida
      ? 'NENHUM'
      : quaseSempreExiste
        ? 'MÉDIO'
        : 'ALTO';

    matriz.push({ id: e.id, pressuposto: p.nome, predicado: p.predicado, valida, risco });
  }
}

const porPressuposto = new Map<string, Linha[]>();
for (const l of matriz) {
  if (!porPressuposto.has(l.pressuposto)) porPressuposto.set(l.pressuposto, []);
  porPressuposto.get(l.pressuposto)!.push(l);
}

console.log(
  'PRESSUPOSTO      | eventos | validam | NÃO validam | predicado disponível hoje'
);
console.log('-'.repeat(78));
for (const p of PRESSUPOSTOS) {
  const linhas = porPressuposto.get(p.nome) ?? [];
  if (linhas.length === 0) continue;
  const ok = linhas.filter((l) => l.valida).length;
  console.log(
    `${p.nome.padEnd(16)} | ${String(linhas.length).padStart(7)} | ${String(ok).padStart(7)} | ` +
      `${String(linhas.length - ok).padStart(11)} | ${p.predicado ?? '— NÃO EXISTE —'}`
  );
}

console.log('\n--- RISCO ALTO: texto pressupõe, motor não valida, estado pode faltar ---\n');
const altos = matriz.filter((l) => l.risco === 'ALTO');
const porPress2 = new Map<string, string[]>();
for (const l of altos) {
  if (!porPress2.has(l.pressuposto)) porPress2.set(l.pressuposto, []);
  porPress2.get(l.pressuposto)!.push(l.id);
}
for (const [nome, ids] of [...porPress2].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${nome} (${ids.length}):`);
  for (const id of ids.sort()) console.log(`   ${id}`);
  console.log();
}

console.log('='.repeat(78));
console.log('ACHADO 2 — ACONTECIMENTO AUTOMÁTICO COM TEXTO DE DESFECHO');
console.log('='.repeat(78));
console.log();
console.log('Só examina conteúdo AUTOMÁTICO (o jogador não escolheu nada).');
console.log('Num evento desses, "você decidiu X" atribui ao jogador uma ação');
console.log('que ele não tomou, e "ficou orgulhoso" entrega o fim sem o meio.\n');

const automaticos = eventos.filter(ehAutomatico);
console.log(`conteúdo automático no catálogo: ${automaticos.length} de ${eventos.length}\n`);

const suspeitos: { id: string; marcas: string[]; descricao: string }[] = [];
for (const e of automaticos) {
  const marcas: string[] = [];
  for (const m of MARCAS_DE_DESFECHO) if (m.re.test(e.descricao)) marcas.push(`desfecho:${m.nome}`);
  for (const m of MARCAS_DE_DELIBERACAO)
    if (m.re.test(e.descricao)) marcas.push(`DELIBERAÇÃO:${m.nome}`);
  if (marcas.length > 0) suspeitos.push({ id: e.id, marcas, descricao: e.descricao });
}

console.log(`candidatos com marca textual de desfecho/deliberação: ${suspeitos.length}\n`);
for (const s of suspeitos) {
  console.log(`· ${s.id}  [${s.marcas.join(', ')}]`);
  console.log(`    "${s.descricao.slice(0, 150)}${s.descricao.length > 150 ? '…' : ''}"`);
}

// Sinal complementar: o acontecimento tem uma única opção cujo texto de
// resultado é o que o jogador realmente lê? Se a descrição e o resultado
// contam a mesma história duas vezes, a conversão deixou resíduo.
console.log('\n--- acontecimento automático com MAIS DE UMA opção (resíduo de decisão) ---\n');
const multiopcao = automaticos.filter((e) => e.opcoes.length > 1);
console.log(`${multiopcao.length} casos`);
for (const e of multiopcao) console.log(`   ${e.id} (${e.opcoes.length} opções)`);

console.log('\n' + '='.repeat(78));
console.log('RESUMO');
console.log('='.repeat(78));
console.log(`catálogo ................................. ${eventos.length}`);
console.log(`conteúdo automático ...................... ${automaticos.length}`);
console.log(`pressupostos detectados (pares) .......... ${matriz.length}`);
console.log(`  · validados pelo motor ................. ${matriz.filter((l) => l.valida).length}`);
console.log(`  · RISCO ALTO ........................... ${altos.length}`);
console.log(`  · risco médio .......................... ${matriz.filter((l) => l.risco === 'MÉDIO').length}`);
console.log(`candidatos a desfecho-sem-contexto ....... ${suspeitos.length}`);
console.log(
  `predicados de elegibilidade existentes ... ${PREDICADOS_EXISTENTES.length} (nenhum cobre pet/carro/imóvel/irmão/amigo/cidade)`
);
