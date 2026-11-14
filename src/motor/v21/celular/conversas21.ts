/**
 * VIDA 21 · CONVERSAS QUE FAZEM SENTIDO — a camada de coerência do celular (as falas estão em `dados21/celular/falas21`).
 *
 *   falaDaResposta21   a sua fala no balão pela situação e pela opção (não só pelo tom), no jeito de falar com aquela
 *                      pessoa (a mãe é "mãe", a avó é tratada por "a senhora") e na sua idade (criança fala como criança).
 *   trabalhaHoje       quem desabafa sobre o chefe tem chefe: aposentada de 86 anos não reclama de refazer relatório.
 *   sabeDoFeito        quem comemora um feito seu tem como saber dele: o que aconteceu na escola, quem é da escola ou
 *                      de casa sabe; o resto da vida, a família e os amigos próximos (antes, qualquer um sabia de tudo).
 *   lembrancaNatural   a lembrança dos dois é escrita na voz de quem manda ("Lembra quando você ligou…"), não com o
 *                      rótulo do marco colado ("Lembrei hoje: Ligou para comemorar uma conquista.").
 */
import type { Rng } from '../../rng';
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import { idade, idadePessoa } from '../../nucleo';
import { flex } from '../../texto';
import { papelDe } from '../../sistemas/vinculos';
import { ANIVERSARIO21, CONVITE21, noticiaDeApoio, RESPOSTAS21, SAUDADE21, type Falas21, type Relacao21 } from '../../dados21/celular/falas21';
import type { Msg15 } from '../../dados15/celular/tipos';

/** O vínculo, no jeito de falar. */
export function relacao21(p: Pessoa, vin: Vinculo | undefined): Relacao21 | undefined {
  if (!vin) return undefined;
  const papel = papelDe(p, vin);
  switch (papel) {
    case 'genitor': return 'pais';
    case 'avo': return 'avos';
    case 'irmao': return 'irmao';
    case 'filho': return 'filho';
    case 'parceiro': return 'par';
    case 'amigo': case 'amigo_proximo': return 'amigo';
    case 'colega': return 'colega';
    case 'conhecido': case 'afastado': case 'parente': return 'distante';
  }
  return undefined;
}

/** Como você chama a pessoa (a mãe é "mãe", o avô é "vô"; os outros, pelo nome). */
function tratamento(p: Pessoa, rel: Relacao21 | undefined): string {
  if (rel === 'pais') return flex(p.genero, 'pai', 'mãe', p.nome);
  if (rel === 'avos') return flex(p.genero, 'vô', 'vó', p.nome);
  return p.nome;
}

/** Preenche as marcas de uma fala (quem manda é `p`; você é a vida). */
export function marcas21(v: Vida, p: Pessoa | undefined, s: string, rel?: Relacao21): string {
  const po = p ? flex(p.genero, 'o', 'a', 'e') : 'o';
  return s
    .replace(/\{trat\}/g, p ? tratamento(p, rel) : '')
    .replace(/\{senhor\}/g, p ? flex(p.genero, 'o senhor', 'a senhora', 'você') : 'você')
    .replace(/\{sr\}/g, p ? flex(p.genero, 'senhor', 'senhora', 'senhore') : 'senhor')
    .replace(/\{sv\}/g, p ? flex(p.genero, 'O vô', 'A vó', 'Vó') : '')
    .replace(/\{nome\}/g, p?.nome ?? '')
    .replace(/\{po\}/g, po)
    .replace(/\{o\}/g, flex(v.eu.genero, 'o', 'a', 'e'))
    .replace(/\{eu\}/g, v.eu.nome);
}

function escolherLista(f: Falas21, rel: Relacao21 | undefined, crianca: boolean): string[] {
  if (crianca && f.crianca?.length) return f.crianca;
  if (rel && f[rel]?.length) return f[rel]!;
  return f.geral;
}

/**
 * A sua fala ao responder `m` com a opção `op`. `undefined`: a situação não tem fala própria aqui (fica a do tom);
 * `''`: não há fala (deixar no visto, ignorar).
 */
export function falaDaResposta21(v: Vida, r: Rng, m: Msg15, op: string): string | undefined {
  const p = m.de ? v.pessoas[m.de] : undefined;
  const rel = p ? relacao21(p, v.vinculos[p.id]) : undefined;
  const sit = m.sit17 ?? '';
  const prefixo = sit.split('_')[0];
  const chaves = [
    ...(sit ? [`${sit}:${op}`, `${prefixo}:${op}`] : []),
    ...(m.tipo === 'noticia' && noticiaDeApoio(m.assunto) ? [`noticia_apoio:${op}`] : []),
    `${m.tipo}:${op}`
  ];
  for (const k of chaves) {
    const f = RESPOSTAS21[k];
    if (!f) continue;
    const lista = escolherLista(f, rel, idade(v) < 13);
    if (!lista.length) return '';
    return marcas21(v, p, r.pick(lista), rel).replace(/^"|"$/g, '');
  }
  return undefined;
}

/** Quem tem trabalho de verdade (para desabafar sobre o chefe): nem aposentado, nem desempregado, nem estudante. */
export function trabalhaHoje(p: Pessoa, ip: number): boolean {
  if (ip < 16 || ip >= 75) return false;
  if (/aposentad|desempregad|estudante|do lar|sem trabalho/i.test(p.ocupacao ?? '')) return false;
  return !!p.ocupacao && (p.renda === undefined || p.renda > 0);
}

/**
 * Quem pode saber de um feito seu. O que aconteceu na escola chega a quem é da escola e a quem mora com você; o resto
 * da vida (o trabalho, a casa, o amor, os filhos, os estudos), à família e a quem é próximo de verdade.
 */
export function sabeDoFeito(v: Vida, p: Pessoa, vin: Vinculo, tema: string): boolean {
  const papel = papelDe(p, vin);
  const emCasa = vin.convivio.includes('casa');
  if (tema === 'escola') return emCasa || vin.convivio.includes('escola') || ((papel === 'genitor' || papel === 'avo') && p.municipioId === v.moradia.municipioId);
  if (emCasa || papel === 'parceiro' || papel === 'genitor' || papel === 'filho' || papel === 'irmao' || papel === 'avo') return true;
  if (papel === 'amigo_proximo') return true;
  return (papel === 'amigo' && vin.proximidade >= 60) || (tema === 'trabalho' && vin.convivio.includes('trabalho'));
}

/**
 * A lembrança dos dois, na voz de quem manda: o marco "Ligou para comemorar uma conquista." vira "você ligou para
 * comemorar uma conquista"; "Saíram juntos depois de um convite." vira "a gente saiu junto depois de um convite". Os
 * marcos que não se deixam reescrever sem errar a concordância ficam de fora (`undefined`).
 */
export function lembrancaNatural(marco: string): string | undefined {
  const t = marco.trim().replace(/[.!?]+$/, '');
  const [primeira, ...resto] = t.split(' ');
  if (!primeira || /-(se|nos|lhe)$/i.test(primeira)) return undefined;
  const corpo = resto.join(' ');
  // Verbo no singular (o marco fala de você na terceira pessoa): "Ligou", "Apareceu", "Pediu".
  if (/^[A-ZÀ-Ú][a-zà-ú]+(ou|eu|iu)$/.test(primeira) && !/^(Seu|Meu|Teu)$/.test(primeira)) return `você ${primeira.toLowerCase()} ${corpo}`.trim();
  // Verbo no plural (vocês dois): "Saíram juntos" → "a gente saiu junto".
  const plural: Record<string, string> = { 'Saíram': 'saiu', 'Fizeram': 'fez', 'Marcaram': 'marcou', 'Voltaram': 'voltou', 'Viajaram': 'viajou', 'Foram': 'foi', 'Passaram': 'passou', 'Ficaram': 'ficou', 'Riram': 'riu', 'Choraram': 'chorou', 'Dançaram': 'dançou', 'Brigaram': 'brigou', 'Moraram': 'morou', 'Estudaram': 'estudou', 'Jogaram': 'jogou', 'Trabalharam': 'trabalhou', 'Cantaram': 'cantou' };
  if (plural[primeira]) return `a gente ${plural[primeira]} ${corpo.replace(/\bjuntos\b/, 'junto').replace(/\bjuntas\b/, 'junto')}`.trim();
  // O marco que começa por um nome ("O reencontro, anos depois") não cabe em "lembra quando…": fica de fora.
  return undefined;
}

/** "E aí, como você está?" no jeito do vínculo (a avó não escreve "e aí, sumida"). */
export function saudade21(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): string {
  const rel = relacao21(p, vin) ?? 'distante';
  const lista = SAUDADE21[rel === 'par' ? 'amigo' : rel];
  return marcas21(v, p, r.pick(lista), rel);
}

/** O convite no jeito de quem chama (amigo, irmão, colega, ou criança). */
export function convite21(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, programa: { verbo: string; nome: string }): string {
  const papel = papelDe(p, vin);
  const k = idade(v) < 13 ? 'crianca' : papel === 'irmao' ? 'irmao' : papel === 'colega' ? 'colega' : 'amigo';
  return marcas21(v, p, r.pick(CONVITE21[k]), relacao21(p, vin)).replace('{v}', programa.verbo).replace('{n}', programa.nome);
}

/**
 * A fala de quem manda numa situação que depende de QUEM é (por ora, o seu aniversário). `undefined`: a do catálogo da
 * VIDA 17 (pelo temperamento) serve.
 */
export function falaDaSituacao21(v: Vida, r: Rng, sit: string, p: Pessoa | undefined): string | undefined {
  if (!p || sit !== 'aniversario') return undefined;
  const rel = relacao21(p, v.vinculos[p.id]);
  const k = idadePessoa(v, p) < 13 ? 'crianca' : rel;
  const lista = k ? ANIVERSARIO21[k] : undefined;
  if (!lista?.length) return undefined;
  return marcas21(v, p, r.pick(lista), rel).replace(/\{idade\}/g, String(idade(v)));
}
