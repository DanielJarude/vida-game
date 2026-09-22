/**
 * F6-FIX §3 — AUDITORIA DE PRÉ-REQUISITOS DE ESCOLHAS.
 *
 * Classifica TODO requisito de opção do catálogo e, para os que dependem de
 * uma FLAG concedida por outro evento, mede se o jogador teve oportunidade
 * real de construir aquele histórico (LOCK DE TRAJETÓRIA) ou se o antecedente
 * simplesmente nunca apareceu (LOCK DE RNG).
 */
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import type { GameEvent, EventOption } from '../../src/types';

type Classe = 'A_ESTADO' | 'B_ESCOLHA_ANTERIOR' | 'C_SISTEMA' | 'D_RNG_RARO' | 'E_IMPOSSIVEL' | 'F_AMBIGUO';

/** Quem CONCEDE cada flag, e em que janela de idade. */
const concessores = new Map<string, { id: string; min: number; max: number; natureza: string }[]>();
for (const e of MASTER_EVENTS_LIST) {
  for (const o of e.opcoes) {
    const f = o.consequencias.adicionarFlag;
    if (!f) continue;
    if (!concessores.has(f)) concessores.set(f, []);
    concessores.get(f)!.push({ id: e.id, min: e.idadeMinima, max: e.idadeMaxima, natureza: e.natureza ?? 'DECISAO' });
  }
}

interface Achado {
  evento: string; idadeEvento: string; opcao: string; tipo: string; detalhe: string; classe: Classe;
}
const achados: Achado[] = [];

function classificar(e: GameEvent, o: EventOption): Achado[] {
  const r = o.requisito; if (!r) return [];
  const out: Achado[] = [];
  const base = { evento: e.id, idadeEvento: `${e.idadeMinima}-${e.idadeMaxima}`, opcao: o.id };

  if (r.flagNecessaria) {
    const fontes = concessores.get(r.flagNecessaria) ?? [];
    let classe: Classe = 'B_ESCOLHA_ANTERIOR';
    let detalhe = fontes.map(f => `${f.id}(${f.min}-${f.max})`).join(', ');
    if (fontes.length === 0) { classe = 'E_IMPOSSIVEL'; detalhe = 'NENHUM evento concede esta flag'; }
    else if (fontes.length === 1) {
      const f = fontes[0];
      const janela = f.max - f.min + 1;
      // Um único antecedente, numa janela estreita, sorteado entre dezenas de
      // candidatos: a chance de nunca ver é alta. Isso é lock de RNG.
      if (janela <= 6) { classe = 'D_RNG_RARO'; detalhe += ` [fonte única, janela de ${janela} anos]`; }
    }
    out.push({ ...base, tipo: `flag:${r.flagNecessaria}`, detalhe, classe });
  }
  if (r.condicaoComportamental) {
    const c = r.condicaoComportamental;
    out.push({ ...base, tipo: `comportamento:${c.traco}`, detalhe: `min ${c.intensidadeMinima ?? '-'}`, classe: 'C_SISTEMA' });
  }
  if (r.atributo) out.push({ ...base, tipo: `atributo:${r.atributo}`, detalhe: `min ${r.valorMinimo}`, classe: 'A_ESTADO' });
  if (r.dinheiroMinimo !== undefined) out.push({ ...base, tipo: 'dinheiro', detalhe: `${r.dinheiroMinimo}`, classe: 'A_ESTADO' });
  if (r.idadeMinima !== undefined || r.idadeMaxima !== undefined)
    out.push({ ...base, tipo: 'idade', detalhe: `${r.idadeMinima ?? '-'}..${r.idadeMaxima ?? '-'}`, classe: 'A_ESTADO' });
  return out;
}

for (const e of MASTER_EVENTS_LIST) for (const o of e.opcoes) achados.push(...classificar(e, o));

console.log('='.repeat(78));
console.log('F6-FIX §3 — REQUISITOS DE OPÇÃO NO CATÁLOGO');
console.log('='.repeat(78));
console.log(`eventos no catálogo ........... ${MASTER_EVENTS_LIST.length}`);
console.log(`opções totais ................. ${MASTER_EVENTS_LIST.reduce((s, e) => s + e.opcoes.length, 0)}`);
console.log(`opções COM requisito .......... ${new Set(achados.map(a => a.evento + a.opcao)).size}`);
console.log(`requisitos individuais ........ ${achados.length}\n`);

const porClasse = new Map<Classe, Achado[]>();
for (const a of achados) { if (!porClasse.has(a.classe)) porClasse.set(a.classe, []); porClasse.get(a.classe)!.push(a); }
const rotulos: Record<Classe, string> = {
  A_ESTADO: 'A) ESTADO ATUAL (dinheiro, atributo, idade)',
  B_ESCOLHA_ANTERIOR: 'B) CONSEQUÊNCIA DE ESCOLHA ANTERIOR razoavelmente disponível',
  C_SISTEMA: 'C) CONSEQUÊNCIA DE SISTEMA (traço acumulado)',
  D_RNG_RARO: 'D) DEPENDE DE CONTEÚDO ALEATÓRIO RARO  <-- suspeito de LOCK DE RNG',
  E_IMPOSSIVEL: 'E) IMPOSSÍVEL / INALCANÇÁVEL',
  F_AMBIGUO: 'F) AMBÍGUO'
};
for (const k of Object.keys(rotulos) as Classe[]) {
  const l = porClasse.get(k) ?? [];
  console.log(`${rotulos[k]}: ${l.length}`);
  for (const a of l) console.log(`   ${a.evento} [${a.idadeEvento}] · ${a.opcao}\n      ${a.tipo} → ${a.detalhe}`);
  console.log('');
}
