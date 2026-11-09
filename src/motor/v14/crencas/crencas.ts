/**
 * VIDA 14 · CRENÇAS — ter ou não uma religião, mudar ao longo da vida, praticar, celebrar.
 *
 * DE ONDE VEM: a crença dos pais é sorteada (gerador derivado do id da pessoa) pela distribuição aproximada do país natal
 * (`dados14/crencas`); quem é jogado começa na crença em que a família criou. Nada disso mexe em personalidade, valores,
 * moral ou comportamento: a crença é uma informação da vida, não um modificador de caráter.
 *
 * O QUE ELA FAZ: a prática regular é a comunidade na semana — a mesma atividade `igreja` da rotina (o tempo da semana, a
 * gente nova do convívio, o alívio da cabeça, a rede de apoio; `sistemas/rotinas`, `estado`, `social`), sem duplicar nada.
 * A ocasional são as datas: as celebrações aparecem no calendário e, de tempos em tempos, viram uma cena com a família. As
 * mudanças (conversão, perda de fé, retomada) são do jogador: pela ação em Você ou pelas decisões `c14_*`, nunca sorteadas.
 */
import type { Pessoa, Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { escrever, idade, idadePessoa, marcarFato, vinculosVivos } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { paisDaCidade } from '../../dados/lugares';
import { anoDe } from '../../tempo';
import { podeComecarRotina } from '../../sistemas/rotinas';
import {
  CELEBRACOES14, CRENCAS14, DISTRIBUICAO14, ORDEM_CRENCAS14,
  type Crenca14, type EstadoCrenca14, type MudancaDeCrenca14, type Pratica14
} from '../../dados14/crencas/crencas';

export { CRENCAS14, CELEBRACOES14, ORDEM_CRENCAS14 };
export type { Crenca14, EstadoCrenca14, Pratica14 };

const chaveDe = (v: Vida) => `${v.eu.nome}|${v.eu.tNasc}`;
const ehCrenca = (x: unknown): x is Crenca14 => typeof x === 'string' && x in CRENCAS14;
export const religiosa = (c: Crenca14) => CRENCAS14[c].grupo !== 'sem';

function sortearDoPais(pais: string, ...semente: (string | number)[]): Crenca14 {
  const d = DISTRIBUICAO14[pais] ?? DISTRIBUICAO14.outro;
  const itens = Object.entries(d) as [Crenca14, number][];
  const total = itens.reduce((s, [, p]) => s + p, 0);
  let x = rngDe('crenca14', ...semente).next() * total;
  for (const [c, p] of itens) { x -= p; if (x < 0) return c; }
  return itens[0][0];
}

const paisDe = (municipioId: string | undefined, v: Vida) => { try { return paisDaCidade(municipioId ?? v.eu.municipioNatal); } catch { return 'outro'; } };
const parentescoDe = (v: Vida, p: Pessoa) => v.vinculos[p.id]?.parentesco;
const deParentesco = (v: Vida, ...ps: string[]) => Object.values(v.vinculos).filter(x => x.parentesco && ps.includes(x.parentesco)).map(x => v.pessoas[x.pessoaId]).filter(Boolean);

/**
 * A crença de uma pessoa da vida (derivada, nada guardado): os pais pelo país natal da vida (o pai acompanha a mãe na
 * maioria das famílias); os filhos pelo combinado da criação e, adultos, com a chance de terem seguido outro caminho; o resto
 * pelo país de onde a pessoa é.
 */
export function crencaDaPessoa(v: Vida, p: Pessoa): Crenca14 {
  const par = parentescoDe(v, p);
  const pais = paisDe(v.eu.municipioNatal, v);
  if (par === 'mae') return sortearDoPais(pais, p.id);
  if (par === 'pai') {
    const m = deParentesco(v, 'mae')[0];
    return m && rngDe('crenca14-casal', p.id).chance(0.75) ? sortearDoPais(pais, m.id) : sortearDoPais(pais, p.id);
  }
  if (par === 'filho') {
    const eu = crencaDe(v);
    const ip = idadePessoa(v, p);
    const r = rngDe('crenca14-filho', p.id);
    const parc = vinculosVivos(v).find(x => x.vin.romance && x.vin.romance.estagio !== 'ex')?.p;
    const daCasa = eu.filhos === 'par' && parc ? crencaDaPessoa(v, parc) : eu.filhos === 'escolha' ? 'sem_religiao' : eu.atual;
    if (ip < 16) return daCasa;
    // Adulto: a maioria segue a da casa; parte segue outro caminho (sem religião, quase sempre).
    const x = r.next();
    return x < 0.7 ? daCasa : x < 0.9 ? 'sem_religiao' : sortearDoPais(paisDe(v.moradia.municipioId, v), p.id, 'adulto');
  }
  return sortearDoPais(paisDe(p.municipioId ?? v.moradia.municipioId, v), p.id);
}

/** A crença em que a família criou: a da mãe (ou a do pai, quando é ele que está); sem pais na vida, a do país natal. */
export function crencaDaFamilia(v: Vida): Crenca14 {
  const m = deParentesco(v, 'mae')[0];
  const p = deParentesco(v, 'pai')[0];
  if (m && p) {
    const cm = crencaDaPessoa(v, m), cp = crencaDaPessoa(v, p);
    if (cm === cp) return cm;
    return rngDe('crenca14-criacao', v.id).chance(0.6) ? cm : cp;
  }
  if (m || p) return crencaDaPessoa(v, (m ?? p)!);
  return sortearDoPais(paisDe(v.eu.municipioNatal, v), v.id, 'sem-pais');
}

/** A crença de agora (a guardada; sem nada guardado — ou depois da sucessão —, a de partida, sem história). */
export function crencaDe(v: Vida): EstadoCrenca14 {
  const e = v.crenca14;
  if (e && e.de === chaveDe(v)) return e;
  // Na sucessão, quem herda veio da casa de quem era jogado: a crença dela pesa (75%).
  const antes = e && ehCrenca(e.atual) ? e.atual : undefined;
  const familia = antes && rngDe('crenca14-heranca', chaveDe(v)).chance(0.75) ? antes : crencaDaFamilia(v);
  const pratica: Pratica14 = !religiosa(familia) ? 'nenhuma' : v.rotinas.some(r => r.id === 'igreja') ? 'regular' : rngDe('crenca14-pratica', v.id, chaveDe(v)).chance(0.6) ? 'ocasional' : 'nenhuma';
  return { de: chaveDe(v), atual: familia, familia, pratica, desde: v.eu.tNasc, historia: [] };
}

/** A prática de agora: a regular é a comunidade na semana (a atividade da rotina) — a rotina manda. */
export function praticaDe(v: Vida): Pratica14 {
  const e = crencaDe(v);
  if (v.rotinas.some(r => r.id === 'igreja')) return 'regular';
  return e.pratica === 'regular' ? 'ocasional' : e.pratica;
}

export function garantirCrenca14(v: Vida): EstadoCrenca14 {
  const e = crencaDe(v);
  if (v.crenca14 !== e) v.crenca14 = e;
  return e;
}

/* ================================================================ Mudar (o jogador) */

export type OpCrenca14 = { oque: 'mudar'; para: Crenca14 } | { oque: 'pratica'; nivel: Pratica14 };

export function disponibilidadeCrenca14(v: Vida, op: OpCrenca14): Veredito {
  const i = idade(v);
  const e = crencaDe(v);
  if (op.oque === 'mudar') {
    if (!ehCrenca(op.para)) return bloqueio('impossivel', 'Essa crença não existe aqui.');
    if (i < 12) return bloqueio('impossivel', 'Nessa idade, a fé é a da casa. A sua escolha vem com o tempo.');
    if (op.para === e.atual) return bloqueio('incompativel', 'Já é a sua.');
    if (v.anoAtual.acoes.includes('crenca14:mudar')) return bloqueio('incompativel', 'Uma mudança dessas leva tempo: este ano você já mudou.');
    return PERMITIDO;
  }
  if (!religiosa(e.atual) && op.nivel !== 'nenhuma') return bloqueio('impossivel', 'Sem religião, não há uma comunidade de fé para frequentar.');
  if (i < 12 && op.nivel !== praticaDe(v)) return bloqueio('impossivel', 'Nessa idade, quem decide a ida à comunidade é a casa.');
  if (op.nivel === praticaDe(v)) return bloqueio('incompativel', 'Já é assim.');
  if (op.nivel === 'regular') {
    const d = podeComecarRotina(v, 'igreja');
    if (d.grau !== 'permitido') return d;
  }
  return PERMITIDO;
}

/** Aplica uma mudança de crença (da ação ou de uma decisão). Devolve o texto do que aconteceu. */
export function mudarCrenca14(v: Vida, para: Crenca14, motivo: MudancaDeCrenca14['motivo']): string {
  const e = garantirCrenca14(v);
  const de = e.atual;
  e.historia.push({ t: v.t, de, para, motivo });
  if (e.historia.length > 30) e.historia.splice(0, e.historia.length - 30);
  e.atual = para;
  e.desde = v.t;
  if (!religiosa(para)) definirPratica(v, 'nenhuma');
  else if (e.pratica === 'nenhuma') e.pratica = 'ocasional';
  const info = CRENCAS14[para];
  const texto = religiosa(para)
    ? (para === e.familia && motivo === 'retomada' ? `Voltou à fé em que foi criad${v.eu.genero === 'feminino' ? 'a' : 'o'}: ${info.nome.toLowerCase()}.` : `Converteu-se ${info.ao}.`)
    : religiosa(de) ? (para === 'ateismo' ? 'Deixou a religião: passou a se considerar ateu, sem crença em deus.' : para === 'agnosticismo' ? 'Deixou a religião: passou a dizer que não sabe — e que ninguém sabe.' : para === 'espiritualidade' ? 'Deixou a religião de instituição, não a espiritualidade.' : 'Deixou a religião.')
      : `Mudou de ideia sobre o que acredita: ${info.nome.toLowerCase()}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'escolha', escolha: true });
  marcarFato(v, 'crenca14_mudou');
  return texto;
}

function definirPratica(v: Vida, nivel: Pratica14): void {
  const e = garantirCrenca14(v);
  e.pratica = nivel;
  const k = v.rotinas.findIndex(r => r.id === 'igreja');
  if (nivel === 'regular' && k < 0) v.rotinas.push({ id: 'igreja', tInicio: v.t, nivel: 1 });
  if (nivel !== 'regular' && k >= 0) v.rotinas.splice(k, 1);
}

export function executarCrenca14(v: Vida, op: OpCrenca14): string {
  if (op.oque === 'mudar') { v.anoAtual.acoes.push('crenca14:mudar'); return mudarCrenca14(v, op.para, 'escolha'); }
  const antes = praticaDe(v);
  definirPratica(v, op.nivel);
  const info = CRENCAS14[crencaDe(v).atual];
  if (op.nivel === 'regular') return `${info.pratica ? info.pratica.charAt(0).toUpperCase() + info.pratica.slice(1) : 'A comunidade'} entrou na sua semana.`;
  if (op.nivel === 'ocasional') return antes === 'regular' ? 'A comunidade saiu da semana: agora, nas datas que importam.' : 'Nas datas que importam, você vai.';
  return 'A prática ficou de lado. A crença continua sua.';
}

/* ================================================================ O calendário */

function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}
/** O calendário islâmico anda ~10,9 dias por ano em relação ao civil (referência: Eid al-Fitr em 10/4/2024). Aproximado. */
function islamico(ano: number, desloc: number): Date {
  let doy = 100 - 10.875 * (ano - 2024) + desloc;
  doy = ((doy % 365.25) + 365.25) % 365.25;
  return new Date(Date.UTC(ano, 0, 1) + Math.round(doy) * 86400000);
}

/** As celebrações da crença de agora no ano (para o calendário). Sem religião: nenhuma. */
export function datasDaCrenca14(v: Vida, ano = anoDe(v.t)): { mes: number; dia?: number; texto: string }[] {
  const e = crencaDe(v);
  return CRENCAS14[e.atual].celebracoes.map(id => {
    const c = CELEBRACOES14[id];
    const d = c.calc === 'pascoa' ? pascoa(ano) : c.calc === 'ramada' ? islamico(ano, -30) : c.calc === 'eid_fitr' ? islamico(ano, 0) : c.calc === 'eid_adha' ? islamico(ano, 70) : undefined;
    return d ? { mes: d.getUTCMonth(), ...(c.aprox ? {} : { dia: d.getUTCDate() }), texto: c.aprox ? `${c.nome} (por volta destes dias)` : c.nome }
      : { mes: c.mes ?? 0, ...(c.dia ? { dia: c.dia } : {}), texto: c.aprox ? `${c.nome} (a data muda a cada ano)` : c.nome };
  });
}

/* ================================================================ O ano */

/** Cenas e decisões da crença: as datas com a família (às vezes) e, raramente, uma decisão `c14_*` (sorteio derivado). */
export function vidaDeCrencas14<C extends { id: string; tipo: string; manual?: boolean; peso?: unknown }, X extends { p: Record<string, { id: string }> }>(
  v: Vida, catalogo: readonly C[], preparar: (c: C, v: Vida, r: ReturnType<typeof rngDe>) => X | null, abrir: (c: C, ctx: X) => boolean
): void {
  if (v.morte) return;
  const i = idade(v);
  const e = garantirCrenca14(v);
  // A rotina manda na prática regular (quem tirou a atividade da semana continua indo nas datas).
  if (e.pratica === 'regular' && !v.rotinas.some(r => r.id === 'igreja')) e.pratica = 'ocasional';
  if (v.rotinas.some(r => r.id === 'igreja') && religiosa(e.atual)) e.pratica = 'regular';
  const r = rngDe(v.id, 'crencas14', v.t);
  const info = CRENCAS14[e.atual];
  // A celebração com a família: uma cena a cada poucos anos (nunca todo ano), para quem pratica.
  if (i >= 4 && info.celebracoes.length && e.pratica !== 'nenhuma' && v.t - (e.cena ?? -999) >= 36 && r.chance(0.3)) {
    const c = CELEBRACOES14[r.pick(info.celebracoes)];
    e.cena = v.t;
    escrever(v, { texto: c.cena, relevancia: 'cotidiano', tema: 'familia' });
    v.mente.felicidade = clamp(v.mente.felicidade + 2);
    const perto = vinculosVivos(v).filter(x => (x.vin.parentesco && ['mae', 'pai', 'avo', 'irmao', 'filho'].includes(x.vin.parentesco)) || (x.vin.romance && x.vin.romance.estagio !== 'ex'));
    if (perto.length) { const x = r.pick(perto); x.vin.proximidade = clamp(x.vin.proximidade + 2); }
  }
  if (i < 12 || !r.chance(0.14)) return;
  if (v.ocorrencias.some(o => o.t === v.t && o.id.startsWith('c14_')) || (v.fila ?? []).some(x => x.id.startsWith('c14_'))) return;
  const lista: { c: C; ctx: X }[] = [];
  for (const c of catalogo) {
    if (!c.manual || !c.id.startsWith('c14_')) continue;
    const ctx = preparar(c, v, r);
    if (ctx) lista.push({ c, ctx });
  }
  const x = r.weighted(lista, y => (typeof y.c.peso === 'number' ? y.c.peso : 1));
  if (!x) return;
  // Com outra decisão aberta, a da fé espera o ano seguinte (não entra na fila: o ano não pode parar por ela).
  if (x.c.tipo === 'decisao' && v.momento) return;
  abrir(x.c, x.ctx);
}

/* ================================================================ Saves */

/** Saves antigos: sem o campo, nada muda (a crença é refeita da família). O que vier torto sai. */
export function normalizarVida14Crencas(v: Vida): void {
  const e = v.crenca14 as EstadoCrenca14 | undefined;
  if (e === undefined) return;
  if (!e || typeof e !== 'object' || !ehCrenca(e.atual) || typeof e.de !== 'string') { delete v.crenca14; return; }
  if (!ehCrenca(e.familia)) e.familia = e.atual;
  if (!['nenhuma', 'ocasional', 'regular'].includes(e.pratica)) e.pratica = 'nenhuma';
  if (typeof e.desde !== 'number') e.desde = v.t;
  e.historia = Array.isArray(e.historia) ? e.historia.filter(h => h && typeof h.t === 'number' && ehCrenca(h.de) && ehCrenca(h.para)) : [];
  if (e.conheceu && !Array.isArray(e.conheceu)) delete e.conheceu;
  if (e.conheceu) e.conheceu = e.conheceu.filter(ehCrenca);
}
