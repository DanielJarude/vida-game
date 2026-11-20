/**
 * VIDA 29 · O QUE CORRE SOBRE VOCÊ. Até aqui, cada pessoa só sabia da sua vida o que você contava (ou o que um sistema
 * específico decidia: o crime descoberto pela família, a traição flagrada). Agora as notícias da sua vida CIRCULAM:
 *
 *   QUE NOTÍCIA   o que entrou na História como marco ou biografia e é do tipo que se comenta — casamento, separação,
 *                 filho, emprego, promoção, demissão, prisão, prêmio, dívida, mudança, doença, traição, formatura, fama;
 *   QUEM SABE     começa por quem estava lá (as pessoas da entrada) e por quem mora junto;
 *   COMO ANDA     de quem sabe para quem não sabe, pelos círculos da sua vida (a família conversa entre si; os colegas, entre
 *                 si; os amigos, entre si; a parceria conta para a família), mais rápido quanto mais RELEVANTE a notícia, quanto
 *                 mais FALANTE quem sabe (o sociável espalha; o reservado e o leal guardam) e quanto mais rápida a ÉPOCA
 *                 (carta e visita antes de 1950, o telefone até os anos 1990, a internet, e as redes sociais depois de 2008);
 *                 a notícia grande de quem é famoso sai no jornal e chega a todos;
 *   COMO CHEGA    de boca em boca, às vezes AUMENTADA (a versão torta pesa mais);
 *   O QUE MUDA    quem gosta de você apoia nas notícias ruins e se aproxima nas boas; quem tem atrito sente inveja ou
 *                 desconfia; quem não devia saber (a traição para a parceria, a prisão escondida da família) e soube por
 *                 terceiros reage como quem foi enganado. A pessoa guarda na relação (`historia`) de onde soube.
 *
 * Leve: no máximo 24 notícias vivas (as de mais de oito anos saem), cada uma com o mapa de quem sabe. Sorteios derivados
 * (`rngDe`): a circulação não mexe no resto da vida.
 */
import type { Entrada, Pessoa, Vida, Vinculo } from '../tipos';
import { clamp, rngDe, type Rng } from '../rng';
import { escrever, moraCom, parceiro } from '../nucleo';
import { anoDe } from '../tempo';
import { tem } from './jeito';

export type TipoDeNoticia29 =
  | 'casamento' | 'separacao' | 'filho' | 'gravidez' | 'emprego' | 'promocao' | 'demissao' | 'prisao' | 'premio' | 'divida'
  | 'mudanca' | 'doenca' | 'traicao' | 'formatura' | 'fama' | 'morte_na_familia';

export interface Noticia29 {
  id: string;
  t: number;
  tipo: TipoDeNoticia29;
  /** A notícia em uma frase, na terceira pessoa ("se casou com Ana"). */
  texto: string;
  /** 1 comentário · 2 assunto · 3 notícia grande. */
  peso: 1 | 2 | 3;
  /** Quem não devia saber (a parceria, na traição; a família, na prisão). */
  segredoDe?: string[];
  /** Quem sabe: desde quando, por quem (id, 'voce', 'jornal', 'redes'), e se a versão chegou aumentada. */
  sabem: Record<string, { t: number; via: string; torto?: boolean }>;
}

const BOAS = new Set<TipoDeNoticia29>(['casamento', 'filho', 'gravidez', 'emprego', 'promocao', 'premio', 'formatura', 'fama']);
const PESO: Record<TipoDeNoticia29, 1 | 2 | 3> = { casamento: 2, separacao: 2, filho: 2, gravidez: 2, emprego: 1, promocao: 1, demissao: 2, prisao: 3, premio: 3, divida: 2, mudanca: 1, doenca: 2, traicao: 3, formatura: 1, fama: 2, morte_na_familia: 2 };

/** O tipo da notícia pela entrada da História (o evento estruturado, ou a frase). */
export function tipoDaNoticia29(e: Pick<Entrada, 'texto' | 'tema' | 'evento' | 'relevancia'>): TipoDeNoticia29 | undefined {
  if (e.relevancia !== 'marco' && e.relevancia !== 'biografia') return undefined;
  const ev = e.evento?.tipo;
  if (ev === 'casamento' || ev === 'uniao') return 'casamento';
  if (ev === 'divorcio' || ev === 'termino') return e.relevancia === 'marco' || ev === 'divorcio' ? 'separacao' : undefined;
  if (ev === 'filho_nasceu') return 'filho';
  if (ev === 'gravidez') return 'gravidez';
  if (ev === 'traicao_descoberta') return 'traicao';
  if (ev === 'morte' || ev === 'viuvez') return 'morte_na_familia';
  const x = e.texto;
  if (/\b(foi preso|foi presa|condenad[oa]|prisão preventiva|algemad)/i.test(x)) return 'prisao';
  if (/\b(demitid[oa]|mandad[oa] embora|perdeu o emprego|dispensad[oa] d[oa] empresa)/i.test(x)) return 'demissao';
  if (/\b(promovid[oa]|a promoção)/i.test(x)) return 'promocao';
  if (/\b(ganhou .*(mega|loteria|sena|prêmio principal)|acertou a (sena|quina da virada))/i.test(x)) return 'premio';
  if (/\b(nome sujo|negativad[oa]|falência|faliu|pediu recuperação judicial)/i.test(x)) return 'divida';
  if (/\b(formou-se|colou grau|a formatura)/i.test(x)) return 'formatura';
  if (/\b(diagnóstico de|internad[oa]|descobriu um câncer|o tratamento d[oa])/i.test(x)) return 'doenca';
  if (/^(Mudou-se|Mudou para|Foi morar em)/.test(x)) return 'mudanca';
  if (/^(Contratad[oa]|Começou a trabalhar|Assinou (o primeiro )?contrato)/.test(x)) return 'emprego';
  return undefined;
}

/** Uma frase curta, na terceira pessoa, a partir da entrada (a primeira oração, sem o ponto). */
function frase(e: Entrada): string {
  const t = e.texto.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, '');
  const curto = t.length > 140 ? `${t.slice(0, 137)}…` : t;
  return curto.charAt(0).toLowerCase() + curto.slice(1);
}

/** O fator da época: quanto a notícia anda num ano (carta, telefone, internet, redes). */
export function velocidadeDaEpoca29(ano: number): number { return ano < 1950 ? 0.6 : ano < 1995 ? 0.8 : ano < 2008 ? 1 : 1.25; }

/** O quanto alguém espalha o que sabe (o sociável fala; o reservado e o leal guardam). */
function falante(p: Pessoa): number {
  let f = 1;
  if (tem(p, 'sociavel') || tem(p, 'extrovertido')) f *= 1.4;
  if (tem(p, 'impulsivo')) f *= 1.2;
  if (tem(p, 'reservado') || tem(p, 'timido')) f *= 0.6;
  if (tem(p, 'leal')) f *= 0.7;
  return f;
}

/** O círculo de uma pessoa na sua vida: família, parceria, trabalho, escola, amigos, vizinhança. */
function circulo(vin: Vinculo): string {
  if (vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(vin.romance.estagio)) return 'parceria';
  if (vin.parentesco && vin.parentesco !== 'pet') return 'familia';
  if (vin.convivio.includes('trabalho')) return 'trabalho';
  if (vin.convivio.includes('escola') || vin.convivio.includes('faculdade')) return 'escola';
  if (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo') return 'amigos';
  if (vin.convivio.includes('vizinhanca')) return 'vizinhanca';
  return 'outros';
}
/** A chance de a notícia passar de um círculo para outro (as pessoas não se conhecem todas: a família conversa entre si). */
function ponte(a: string, b: string): number {
  if (a === b) return a === 'outros' ? 0.08 : 0.5;
  const par = [a, b].sort().join('+');
  return ({ 'familia+parceria': 0.45, 'amigos+parceria': 0.25, 'amigos+escola': 0.2, 'amigos+trabalho': 0.12, 'familia+vizinhanca': 0.2, 'amigos+familia': 0.1 } as Record<string, number>)[par] ?? 0.04;
}

const humanoVivo = (v: Vida, id: string) => { const p = v.pessoas[id]; return !!p && p.vivo && !p.especie && !!v.vinculos[id]; };

/** Registra as notícias novas (as entradas desde a última leitura) e faz cada uma andar um ano. */
export function processarBoatos29(v: Vida): void {
  if (v.morte) return;
  const ano = anoDe(v.t);
  const lista = (v.boatos29 ??= []);
  const desde = v.fatos['boatos29_lido'] ?? v.t - 12;
  const r = rngDe(v.id, 'boatos29', v.t);
  // 1. As notícias do ano.
  for (const e of v.biografia) {
    if (e.t <= desde || e.t > v.t) continue;
    const tipo = tipoDaNoticia29(e);
    if (!tipo || lista.some(n => n.id === e.id)) continue;
    const sabem: Noticia29['sabem'] = {};
    for (const id of e.pessoas ?? []) if (humanoVivo(v, id)) sabem[id] = { t: e.t, via: 'voce' };
    const par = parceiro(v);
    const segredoDe = tipo === 'traicao' && par ? [par.p.id] : tipo === 'prisao' ? Object.keys(v.vinculos).filter(id => v.vinculos[id].parentesco && humanoVivo(v, id) && !(e.pessoas ?? []).includes(id)) : undefined;
    // Quem mora junto sabe (menos o enganado: a traição não se conta em casa).
    for (const p of moraCom(v)) if (!p.especie && v.vinculos[p.id] && !segredoDe?.includes(p.id)) sabem[p.id] ??= { t: e.t, via: 'voce' };
    if (par && !segredoDe?.includes(par.p.id)) sabem[par.p.id] ??= { t: e.t, via: 'voce' };
    lista.push({ id: e.id, t: e.t, tipo, texto: frase(e), peso: PESO[tipo], segredoDe: segredoDe?.length ? segredoDe : undefined, sabem });
  }
  v.fatos['boatos29_lido'] = v.t;
  // 2. Andar: uma ou duas rodadas por ano (a notícia grande corre mais).
  const vel = velocidadeDaEpoca29(ano);
  const famoso = (v.notoriedade?.valor ?? 0) >= 35;
  for (const n of lista) {
    if (v.t - n.t > 36) continue; // notícia velha não anda mais
    const rodadas = n.peso === 3 ? 2 : 1;
    for (let k = 0; k < rodadas; k++) andar(v, n, r, vel, famoso);
  }
  // 3. Limpeza: só as recentes ficam.
  v.boatos29 = lista.filter(n => v.t - n.t <= 96).slice(-24);
}

function andar(v: Vida, n: Noticia29, r: Rng, vel: number, famoso: boolean): void {
  const ids = Object.keys(v.vinculos).filter(id => humanoVivo(v, id));
  const sabe = ids.filter(id => n.sabem[id]);
  const naoSabe = ids.filter(id => !n.sabem[id]);
  // A notícia grande de quem é conhecido sai no jornal (ou nas redes): chega a todo mundo, do mesmo jeito.
  if (famoso && n.peso === 3 && r.chance(0.7)) {
    for (const id of naoSabe) saber(v, n, id, anoDe(v.t) >= 2008 ? 'redes' : 'jornal', false);
    return;
  }
  const base = n.peso === 3 ? 0.7 : n.peso === 2 ? 0.45 : 0.25;
  for (const alvo of naoSabe) {
    const vinA = v.vinculos[alvo];
    const cA = circulo(vinA);
    let melhor: { id: string; chance: number } | undefined;
    for (const de of sabe) {
      const vinD = v.vinculos[de];
      const chance = base * vel * ponte(circulo(vinD), cA) * falante(v.pessoas[de]) * (vinD.ruptura || vinD.estagio === 'rival' ? 1.3 : 1);
      if (!melhor || chance > melhor.chance) melhor = { id: de, chance };
    }
    if (melhor && r.chance(clamp(melhor.chance, 0, 0.9))) {
      // Cada boca aumenta um pouco: a versão chega torta às vezes (mais de quem tem atrito com você).
      const torto = !BOAS.has(n.tipo) && r.chance(v.vinculos[melhor.id].tensao >= 40 ? 0.3 : 0.12);
      saber(v, n, alvo, melhor.id, torto);
    }
  }
}

/** Alguém fica sabendo: a reação de quem gosta, de quem tem atrito e de quem não devia saber. */
function saber(v: Vida, n: Noticia29, id: string, via: string, torto: boolean): void {
  n.sabem[id] = { t: v.t, via, torto: torto || undefined };
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  if (!p || !vin) return;
  const de = via === 'jornal' ? 'pelo jornal' : via === 'redes' ? 'pelas redes' : via !== 'voce' && v.pessoas[via] ? `por ${v.pessoas[via].nome}` : 'por terceiros';
  const marco = (texto: string, tipo: Vinculo['historia'][number]['tipo']) => { vin.historia.push({ t: v.t, texto, tipo, ...(tipo === 'apoio' ? { de: 'ela' as const } : {}) }); if (vin.historia.length > 40) vin.historia.splice(0, vin.historia.length - 40); };
  // Quem não devia saber.
  if (n.segredoDe?.includes(id)) {
    vin.tensao = clamp(vin.tensao + (n.tipo === 'traicao' ? 25 : 12));
    vin.confianca = clamp(vin.confianca - (n.tipo === 'traicao' ? 20 : 10));
    marco(`Soube ${de} — e não por você — que você ${n.texto}.`, n.tipo === 'traicao' ? 'traicao' : 'conflito');
    escrever(v, { texto: `${p.nome} soube ${de} que você ${n.texto}${torto ? ', numa versão ainda pior do que a verdade' : ''}. Não foi você quem contou.`, relevancia: 'biografia', tema: n.tipo === 'traicao' ? 'amor' : 'familia', tom: 'ruim', pessoas: [id] });
    return;
  }
  const perto = vin.proximidade >= 55 && vin.tensao < 40;
  const atrito = vin.tensao >= 45 || vin.estagio === 'rival' || vin.estagio === 'ex_amigo' || tem(p, 'rancoroso');
  if (BOAS.has(n.tipo)) {
    if (perto) { vin.proximidade = clamp(vin.proximidade + 2); marco(`Ficou sabendo ${de} que você ${n.texto}, e ficou feliz por você.`, 'amizade'); }
    else if (atrito) { vin.tensao = clamp(vin.tensao + 3); marco(`Soube ${de} que você ${n.texto}. Não comentou.`, undefined); }
  } else {
    if (perto || tem(p, 'generoso') || tem(p, 'carinhoso')) {
      vin.proximidade = clamp(vin.proximidade + 2);
      marco(`Soube ${de} que você ${n.texto}${torto ? ' (contaram aumentado)' : ''}, e procurou saber como você estava.`, 'apoio');
    } else {
      if (n.tipo === 'prisao' || n.tipo === 'divida' || n.tipo === 'traicao') vin.confianca = clamp(vin.confianca - (torto ? 6 : 3));
      if (atrito) vin.tensao = clamp(vin.tensao + 2);
      marco(`Ouviu ${de} que você ${n.texto}${torto ? ' — numa versão aumentada' : ''}.`, undefined);
    }
  }
  // Quem importa e ficou sabendo por outros: você fica sabendo que ele sabe.
  if ((vin.proximidade >= 60 || vin.parentesco) && via !== 'voce' && n.peso >= 2) {
    escrever(v, { texto: `A notícia de que você ${n.texto} chegou a ${p.nome} ${de}${torto ? ' — aumentada no caminho' : ''}.`, relevancia: 'cotidiano', tema: vin.parentesco ? 'familia' : 'amizade', tom: BOAS.has(n.tipo) ? 'neutro' : 'ruim', pessoas: [id] });
  }
}

/** O que uma pessoa sabe da sua vida pelo que circulou (para a ficha e para a conversa). */
export function oQueSabeDeVoce29(v: Vida, id: string): { texto: string; via: string; torto: boolean; t: number; boa: boolean; peso: number }[] {
  return (v.boatos29 ?? []).filter(n => n.sabem[id]).map(n => {
    const s = n.sabem[id];
    const via = s.via === 'voce' ? 'por você' : s.via === 'jornal' ? 'pelo jornal' : s.via === 'redes' ? 'pelas redes' : v.pessoas[s.via] ? `por ${v.pessoas[s.via].nome}` : 'por terceiros';
    return { texto: n.texto, via, torto: !!s.torto, t: s.t, boa: BOAS.has(n.tipo), peso: n.peso };
  }).sort((a, b) => b.t - a.t);
}

/** A primeira coisa que a pessoa comenta numa conversa: o que soube por outros há pouco (um ano), se soube. */
export function assuntoDaConversa29(v: Vida, id: string): string | undefined {
  // Só a notícia que é assunto (casamento, separação, demissão, prisão, prêmio...): a contratação comum não vira conversa.
  const x = oQueSabeDeVoce29(v, id).find(s => s.via !== 'por você' && v.t - s.t <= 12 && s.peso >= 2);
  if (!x) return undefined;
  const p = v.pessoas[id];
  if (!p) return undefined;
  const fonte = x.via === 'pelo jornal' ? 'Vi no jornal' : x.via === 'pelas redes' ? 'Vi nas redes' : `Fiquei sabendo ${x.via}`;
  return x.boa
    ? `${p.nome} puxou o assunto: "${fonte} que você ${x.texto}. Por que não me contou?"`
    : `${p.nome} baixou a voz: "${fonte} que você ${x.texto}${x.torto ? '… É verdade aquilo tudo que estão dizendo?' : '. Como você está?'}"`;
}

/** Na conversa, você desfaz as versões aumentadas que chegaram a essa pessoa (devolve se havia alguma). */
export function esclarecer29(v: Vida, id: string): boolean {
  let houve = false;
  for (const n of v.boatos29 ?? []) { const s = n.sabem[id]; if (s?.torto) { s.torto = undefined; houve = true; } }
  return houve;
}
