/**
 * ERAS HISTÓRICAS · O CONTEXTO DO ANO — a pergunta única que os sistemas fazem à camada histórica.
 *
 * Fica embaixo de tudo (só importa tipos, tempo e dados puros): o Celular, as redes, as lojas, os veículos e as
 * profissões perguntam aqui, sem importar o motor da época (`eras/ano`). Para uma vida contemporânea (sem `v.era`),
 * toda pergunta devolve o comportamento de antes — os portões são transparentes.
 */

import type { Vida } from '../../tipos';
/** O ano civil de um instante (sem importar `tempo`: a base histórica não depende de nenhum pacote de cima). */
const anoDe = (t: number) => Math.floor(t / 12);
import { TECNOLOGIA_POR_ID, type MeioDeComunicacao } from './tecnologias';
import { salarioMinimoReal, mesHistoricoCorrente, paisHistoricoCorrente, ladoHistoricoCorrente } from './moedas';
import { pacoteDaEra, type ChegadaNoPais } from './pacote';

/**
 * ERAS v3: os países em que se pode viver uma época, e o primeiro ano de nascimento de cada um (o limite das séries e do
 * conteúdo: ver `docs/eras/FONTES.md`). Lista fixa (não depende de o pacote já ter carregado — o save é validado antes).
 */
export const PAISES_COM_ERA: Readonly<Record<string, number>> = { BR: 1900, US: 1900, GB: 1900, JP: 1900, DE: 1900, AR: 1945 };
export const ULTIMO_ANO_HISTORICO = 2025;

/**
 * O país cuja história a vida vive agora: o da moradia quando ele tem pacote de época (quem emigrou vive a época do país
 * novo); senão, o país em que a época foi escolhida.
 */
export function paisDaEpoca(v: Vida): string {
  const p = mesHistoricoCorrente() !== null ? paisHistoricoCorrente() : undefined;
  return p && (p === 'BR' || pacoteDaEra(p)) ? p : v.era?.pais ?? 'BR';
}

export const ehHistorica = (v: Vida): boolean => !!v.era;

const CLASSE_NIVEL = { vulneravel: 0, trabalhadora: 1, media_baixa: 2, media: 3, alta: 4 } as const;

function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/**
 * A faixa econômica de agora, 0 (pobre) a 4 (rica): enquanto mora com a família, a da família; depois, pelo salário
 * (em salários mínimos da época) e pelo dinheiro guardado.
 */
export function nivelEconomico(v: Vida): number {
  const daFamilia = CLASSE_NIVEL[v.origem.classe] ?? 2;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') return daFamilia;
  const sm = salarioMinimoReal(v.t) ?? 1600;
  const renda = (v.trabalho.atual?.salario ?? 0) / sm;
  const guardado = (v.financas.conta ?? 0) / sm;
  const pelaRenda = renda >= 15 ? 4 : renda >= 6 ? 3 : renda >= 3 ? 2 : renda >= 1.2 ? 1 : 0;
  return Math.max(pelaRenda, guardado >= 600 ? 4 : guardado >= 150 ? 3 : 0, Math.min(daFamilia, 2));
}

export type Acesso = 'indisponivel' | 'rara' | 'comum';

/** Quando a tecnologia chega a ESTA vida (o deslocamento de até um ano é da semente da vida). */
function deslocamento(v: Vida, id: string): number {
  return Math.round((hashUnit(`${v.id}:era:${id}`) - 0.5) * 2);
}

/**
 * A situação da tecnologia no ano corrente para esta vida:
 *   - indisponivel: ainda não chegou (ou já saiu de uso), ou chegou só para quem tem mais renda;
 *   - rara: existe e a pessoa tem acesso, mas é novidade/luxo;
 *   - comum: parte da vida da pessoa.
 * Vida contemporânea: sempre 'comum' (o jogo de hoje).
 */
/**
 * O que uma tecnologia exige antes dela (o torpedo exige o celular; o aplicativo de mensagens, o smartphone; a rede
 * social, a internet). O acesso é o menor entre o dela e o das exigências.
 */
const DEPENDE: Readonly<Record<string, string[]>> = {
  // ERAS v3: a casa antes de 1970 — sem luz elétrica não há geladeira, televisão nem computador.
  tv: ['eletricidade'], tv_cores: ['tv'], geladeira: ['eletricidade'], maquina_lavar: ['eletricidade', 'agua_encanada'], computador: ['eletricidade'],
  videogame_cartucho: ['tv'], videocassete: ['tv'],
  sms: ['celular'], smartphone: ['celular'], mensageiro_app: ['smartphone'], app_namoro: ['smartphone'], banco_app: ['smartphone'],
  email: ['internet'], mensageiro_pc: ['internet'], rede_comunidades: ['internet'], redes_modernas: ['internet'], banda_larga: ['internet'],
  streaming: ['banda_larga'], internet_banking: ['internet'], pix: ['internet'], ia_conversa: ['internet']
};
const ORDEM: Record<Acesso, number> = { indisponivel: 0, rara: 1, comum: 2 };

export function tecnologia(v: Vida, id: string, ano = anoDe(v.t)): Acesso {
  if (!v.era) return 'comum';
  let a = tecnologiaSozinha(v, id, ano);
  for (const d of DEPENDE[id] ?? []) { if (a === 'indisponivel') break; const b = tecnologia(v, d, ano); if (ORDEM[b] < ORDEM[a]) a = b; }
  return a;
}

/**
 * ERAS v3: as datas da tecnologia no país da época — o pacote do país (`chega`, `popular`, `massa`, `fim`) ou, no Brasil,
 * as da v1. Uma tecnologia sem data no pacote não chega ao país pelo calendário brasileiro: usa o lançamento mundial com
 * a popularização e a massificação do Brasil deslocadas pela distância (aproximação, e o teste exige cobertura total).
 */
export function datasNoPais(pais: string, id: string): ChegadaNoPais | undefined {
  const x = TECNOLOGIA_POR_ID.get(id);
  if (!x) return undefined;
  if (pais === 'BR') return { chega: x.brasil, popular: x.popular, massa: x.massa, fim: x.fim, fonte: x.fonte };
  const d = pacoteDaEra(pais)?.tecnologias[id];
  // O lado leste (a RDA) tem as datas de lá enquanto durou a divisão; depois, as do país.
  if (d?.leste && ladoHistoricoCorrente() === 'leste' && pais === paisHistoricoCorrente()) return { ...d, ...d.leste };
  if (d) return d;
  return { chega: x.lancada, popular: x.popular, massa: x.massa, fim: x.fim, fonte: 'sem data própria no país (lançamento mundial)' };
}

function tecnologiaSozinha(v: Vida, id: string, ano: number): Acesso {
  const dp = datasNoPais(paisDaEpoca(v), id);
  if (!dp) return 'comum';
  const x = { brasil: dp.chega, popular: dp.popular, massa: dp.massa, fim: dp.fim };
  if (x.fim !== undefined && ano >= x.fim) return 'indisponivel';
  if (ano < x.brasil) return 'indisponivel';
  // ERAS MODERNAS: depois da série (2026 em diante) a vida histórica vive o mundo de hoje — o que ainda existe é de todos,
  // como na vida contemporânea (sem isso, o tablet e o videogame atual, que nunca "viram massa", ficavam fora do alcance
  // de quem tem pouca renda para sempre, mesmo em 2040).
  if (ano > 2025) return 'comum';
  const d = deslocamento(v, id);
  const nivel = nivelEconomico(v);
  if (ano >= x.massa + d) return 'comum';
  if (ano >= x.popular + d) return nivel >= 2 ? 'comum' : nivel >= 1 && ano >= x.popular + d + 2 ? 'rara' : 'indisponivel';
  return nivel >= 4 ? 'rara' : 'indisponivel';
}

/** A pessoa tem (ou pode ter) a tecnologia agora. */
export const temAcesso = (v: Vida, id: string, ano?: number) => tecnologia(v, id, ano) !== 'indisponivel';

/** Ainda não existe no país da época (independe da renda) — para dizer "ainda não existe" em vez de "não dá". */
export function existeNoBrasil(v: Vida, id: string, ano = anoDe(v.t)): boolean {
  if (!v.era) return true;
  const x = datasNoPais(paisDaEpoca(v), id);
  return !x || (ano >= x.chega && (x.fim === undefined || ano < x.fim));
}
export const existeNoPais = existeNoBrasil;

/** O aparelho com que a pessoa se comunica no ano (a vida contemporânea: o smartphone de sempre). */
export function meioDeComunicacao(v: Vida): MeioDeComunicacao {
  if (!v.era) return 'smartphone';
  // ERAS v3: sem telefone em casa e antes do telefone público na rua (no Brasil, o orelhão de 1972; nos outros países, a
  // cabine pública já existia, mas a vida de quem não tinha telefone em casa era de cartas e visitas).
  if (!temAcesso(v, 'telefone_fixo') && (paisDaEpoca(v) === 'BR' ? anoDe(v.t) < 1972 : anoDe(v.t) < 1950 || !temAcesso(v, 'orelhao'))) return 'cartas';
  // O aparelho é da pessoa: a criança usa o telefone da casa até ganhar o seu (o primeiro celular por volta dos 12; o
  // primeiro smartphone por volta dos 11 — e dos 10, quando ele já é de todo mundo, como na vida contemporânea).
  const i = Math.floor((v.t - v.eu.tNasc) / 12);
  const ano = anoDe(v.t);
  if (temAcesso(v, 'smartphone') && i >= (ano >= 2015 ? 10 : 11)) return 'smartphone';
  if (temAcesso(v, 'celular') && i >= 12) return 'celular';
  return 'fixo';
}

/** O ano de chegada ao país da época (para a frase "só a partir de..."; o Brasil sem vida em processamento). */
export const anoNoBrasil = (id: string, pais = mesHistoricoCorrente() !== null ? paisHistoricoCorrente() : 'BR') => datasNoPais(pais, id)?.chega;
export const nomeDaTecnologia = (id: string) => TECNOLOGIA_POR_ID.get(id)?.nome ?? id;

/**
 * Save: a época é opcional e nunca inventada. Uma `era` malformada (save editado à mão, versão futura) é descartada — a
 * vida volta a ser contemporânea, que é o comportamento de antes; a bem formada só ganha a lista de vistos. Idempotente.
 */
export function normalizarEra(v: Vida): void {
  const e = v.era as unknown as Record<string, unknown> | undefined;
  if (e === undefined) return;
  const desde = typeof e?.pais === 'string' ? PAISES_COM_ERA[e.pais as string] : undefined;
  const ok = !!e && typeof e === 'object' && desde !== undefined && typeof e.ano === 'number' && Number.isFinite(e.ano) && e.ano >= desde && e.ano <= ULTIMO_ANO_HISTORICO && typeof e.decada === 'number';
  if (!ok) { delete v.era; return; }
  // ERAS v3: os campos novos são opcionais; malformados, somem (a vida segue igual).
  const x = v.era!;
  if (x.dia !== undefined && !(Number.isInteger(x.dia) && x.dia >= 1 && x.dia <= 31)) delete x.dia;
  if (x.partilha !== undefined && !(typeof x.partilha === 'number' && x.partilha >= 0 && x.partilha <= 1)) delete x.partilha;
  if (x.guerras !== undefined) { if (!Array.isArray(x.guerras)) delete x.guerras; else x.guerras = x.guerras.filter(g => typeof g === 'string'); }
  if (x.morte !== undefined && !(x.morte && typeof x.morte.t === 'number' && typeof x.morte.causa === 'string')) delete x.morte;
  const c = x.congelado;
  if (c && !(typeof c.valor === 'number' && Number.isFinite(c.valor) && c.valor >= 0 && typeof c.tVolta === 'number' && typeof c.parcelas === 'number' && typeof c.perda === 'number')) delete x.congelado;
  if (!Array.isArray(v.era!.vistos)) v.era!.vistos = [];
  else v.era!.vistos = v.era!.vistos.filter(x => typeof x === 'string');
  const r = v.era!.retido;
  if (r && !(typeof r.valor === 'number' && Number.isFinite(r.valor) && r.valor >= 0 && typeof r.tVolta === 'number' && typeof r.parcelas === 'number')) delete v.era!.retido;
}

/**
 * ERAS v2 · COMO SE PROCURAVA EMPREGO (a moldura da vaga na vida histórica): os classificados do jornal e o currículo
 * datilografado; o site de empregos e o e-mail (com a internet em casa); a rede profissional e o formulário on-line (com o
 * smartphone). Os meios antigos continuam vivos por um tempo (a escolha entre eles é da semente da vida, por ano).
 * Vida contemporânea: nada (a cena é a de sempre).
 */
export function comoAchouAVaga(v: Vida, ocupacaoId: string): string | undefined {
  if (!v.era) return undefined;
  const ano = anoDe(v.t);
  if (ano > 2025) return undefined;
  const h = hashUnit(`${v.id}:vaga:${ocupacaoId}:${ano}`);
  if (h < 0.18) return 'A vaga veio por indicação: alguém conhecia alguém lá dentro.';
  if (temAcesso(v, 'smartphone') && ano >= 2012 && h < 0.75) return 'A vaga apareceu numa rede profissional; o currículo foi pelo formulário on-line.';
  if (temAcesso(v, 'internet') && ano >= 1999 && h < 0.7) return 'Achou a vaga num site de empregos e mandou o currículo por e-mail.';
  if (ano < 1990) return 'Viu o anúncio nos classificados do jornal de domingo e levou pessoalmente o currículo, datilografado.';
  return 'Viu o anúncio nos classificados do jornal e levou o currículo impresso até lá.';
}

/**
 * ERAS v3 · O CALENDÁRIO JAPONÊS: o Japão conta os anos também pela era do imperador (nengō) — o ano 1 começa no dia da
 * ascensão (Meiji, 1868; Taishō, 30/07/1912; Shōwa, 25/12/1926; Heisei, 08/01/1989; Reiwa, 01/05/2019). O calendário
 * gregoriano é o oficial desde 1873, então a data é a mesma: a era é a segunda contagem (" — ano 6 da era Shōwa").
 * Fonte: Gabinete do Japão (Lei dos Nomes de Era, 1979) e Agência da Casa Imperial. Outros países: nada.
 */
export function eraImperialEm(ano: number, mes: number, dia = 15): { nome: string; ano: number } | undefined {
  const p = pacoteDaEra('JP');
  if (!p?.eras) return undefined;
  const n = ano * 10000 + (mes + 1) * 100 + dia;
  let e: { nome: string; desde: [number, number, number] } | undefined;
  for (const x of p.eras) if (n >= x.desde[0] * 10000 + x.desde[1] * 100 + x.desde[2]) e = x;
  return e ? { nome: e.nome, ano: ano - e.desde[0] + 1 } : undefined;
}

/** " (ano 6 da era Shōwa)" no nascimento de uma vida histórica no Japão; senão, nada. */
export function anoImperial(v: Vida, t = v.t): string {
  if (v.era?.pais !== 'JP' && paisDaEpoca(v) !== 'JP') return '';
  const e = eraImperialEm(anoDe(t), t % 12, v.era?.dia);
  return e ? ` (${e.ano === 1 ? 'primeiro ano' : `ano ${e.ano}`} da era ${e.nome})` : '';
}
