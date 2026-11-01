/**
 * VIDA 12.6 — O JEITO DE CADA PESSOA: personalidade, interesses e memória dos NPCs.
 *
 * Nada aqui é sorteado de novo a cada interação. O jeito vem do TEMPERAMENTO que toda pessoa já tem desde que foi criada
 * (os cinco eixos: extroversão, afabilidade, responsabilidade, abertura, estabilidade) — os traços são a leitura dele,
 * estável para sempre, e funcionam também nos saves antigos sem migração. Os INTERESSES vêm do mesmo lugar de sempre
 * (`gostosDe`, o sorteio estável pelo id: o que o jogo já usava nos programas e nos presentes) e ganham um VALOR (o que
 * a pessoa preza), puxado pelo temperamento. A MEMÓRIA é a história do vínculo (`Vinculo.historia`: cada marco com tipo
 * e peso, já guardada e limitada a 30) lida como um CLIMA: a traição pesa muito e demora a passar; a ajuda pesa e fica;
 * a reconciliação desarma o que veio antes dela; quem é rancoroso guarda o ruim por mais tempo, quem é carinhoso guarda o
 * bom. O clima muda o que acontece (o quanto uma aproximação rende, se a pessoa aceita o convite) e o que se lê.
 *
 * Módulo da camada de base (só lê tipos e o gerador estável): o social, as interações, a equipe e os acontecimentos o usam.
 */
import type { Marco, Pessoa, Temperamento, TipoMarco, Vida, Vinculo } from '../tipos';
import { hashMisturado } from '../rng';

/* ------------------------------------------------------------------ os traços */

export type TracoDePessoa =
  | 'timido' | 'extrovertido' | 'carinhoso' | 'ciumento' | 'ambicioso' | 'temperamental' | 'paciente' | 'impulsivo'
  | 'reservado' | 'sociavel' | 'generoso' | 'egoista' | 'rancoroso' | 'leal';

export const NOME_TRACO: Record<TracoDePessoa, [string, string]> = {
  timido: ['tímido', 'tímida'], extrovertido: ['extrovertido', 'extrovertida'], carinhoso: ['carinhoso', 'carinhosa'], ciumento: ['ciumento', 'ciumenta'],
  ambicioso: ['ambicioso', 'ambiciosa'], temperamental: ['de pavio curto', 'de pavio curto'], paciente: ['paciente', 'paciente'], impulsivo: ['impulsivo', 'impulsiva'],
  reservado: ['reservado', 'reservada'], sociavel: ['sociável', 'sociável'], generoso: ['generoso', 'generosa'], egoista: ['egoísta', 'egoísta'],
  rancoroso: ['rancoroso', 'rancorosa'], leal: ['leal', 'leal']
};

/** Quanto cada traço "aparece" no temperamento (0 = nada). A pessoa mostra os mais fortes. */
function forcas(t: Temperamento, id: string): [TracoDePessoa, number][] {
  const g = hashMisturado(`${id}:generoso`) - 0.5; // o quanto a pessoa abre a mão não é só afabilidade
  return [
    ['timido', -t.extroversao - 0.35 + Math.max(0, -t.estabilidade) * 0.2],
    ['extrovertido', t.extroversao - 0.35],
    ['carinhoso', t.afabilidade - 0.38],
    ['ciumento', -t.estabilidade - 0.32 + Math.max(0, t.afabilidade) * 0.15 - Math.max(0, t.abertura) * 0.2],
    ['ambicioso', t.responsabilidade * 0.7 + t.abertura * 0.3 + t.extroversao * 0.2 - 0.38],
    ['temperamental', -t.estabilidade - 0.4 - t.afabilidade * 0.15],
    ['paciente', t.estabilidade * 0.7 + t.afabilidade * 0.3 - 0.35],
    ['impulsivo', -t.responsabilidade - 0.38 + t.extroversao * 0.15],
    ['reservado', -t.extroversao * 0.6 - t.abertura * 0.3 - 0.25],
    ['sociavel', t.extroversao * 0.6 + t.afabilidade * 0.4 - 0.3],
    ['generoso', t.afabilidade * 0.6 + g * 0.6 - 0.3],
    ['egoista', -t.afabilidade * 0.7 - g * 0.4 - 0.32],
    ['rancoroso', -t.afabilidade * 0.5 - t.estabilidade * 0.4 - 0.3],
    ['leal', t.responsabilidade * 0.5 + t.afabilidade * 0.4 - 0.32]
  ];
}
const OPOSTOS: [TracoDePessoa, TracoDePessoa][] = [['timido', 'extrovertido'], ['paciente', 'temperamental'], ['generoso', 'egoista'], ['reservado', 'sociavel'], ['paciente', 'impulsivo']];

/** Os traços marcantes de alguém (até três, do mais forte ao mais fraco), estáveis para sempre. */
export function tracosDe(p: Pick<Pessoa, 'id' | 'temperamento'>): TracoDePessoa[] {
  const out: TracoDePessoa[] = [];
  for (const [t] of forcas(p.temperamento, p.id).filter(([, f]) => f > 0).sort((a, b) => b[1] - a[1])) {
    if (OPOSTOS.some(([a, b]) => (a === t && out.includes(b)) || (b === t && out.includes(a)))) continue;
    out.push(t);
    if (out.length === 3) break;
  }
  return out;
}
export const tem = (p: Pick<Pessoa, 'id' | 'temperamento'>, t: TracoDePessoa) => tracosDe(p).includes(t);
export const nomeDoTraco = (p: Pick<Pessoa, 'genero'>, t: TracoDePessoa) => NOME_TRACO[t][p.genero === 'feminino' ? 1 : 0];

/* ------------------------------------------------------------------ os interesses */

/** Os gostos (a mesma lista e o mesmo sorteio estável que o jogo sempre usou nos programas e nos presentes). */
export const GOSTOS = ['desenho', 'futebol', 'música', 'ciências', 'dança', 'leitura', 'xadrez', 'natação', 'cinema', 'cozinha', 'viagem', 'natureza'] as const;
export type Gosto = (typeof GOSTOS)[number];
export function gostosDaPessoa(p: Pick<Pessoa, 'id'>): [Gosto, Gosto] {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = GOSTOS[h % 8];
  const lista = GOSTOS.filter(x => x !== a);
  return [a, lista[Math.floor(hashMisturado(`${p.id}:gosto2`) * lista.length) % lista.length]];
}

export type Valor = 'familia' | 'carreira' | 'liberdade' | 'fe' | 'aventura' | 'estabilidade' | 'amizade' | 'justica';
export const NOME_VALOR: Record<Valor, string> = { familia: 'a família', carreira: 'o trabalho', liberdade: 'a liberdade', fe: 'a fé', aventura: 'a aventura', estabilidade: 'a vida em ordem', amizade: 'os amigos', justica: 'o que é certo' };
/** O que a pessoa preza acima de tudo (puxado pelo temperamento, desempatado pelo id). */
export function valorDe(p: Pick<Pessoa, 'id' | 'temperamento'>): Valor {
  const t = p.temperamento, h = (k: string) => hashMisturado(`${p.id}:valor:${k}`) * 0.45;
  const pesos: [Valor, number][] = [
    ['familia', t.afabilidade * 0.6 + t.estabilidade * 0.2 + h('f')], ['carreira', t.responsabilidade * 0.7 + t.extroversao * 0.1 + h('c')],
    ['liberdade', t.abertura * 0.6 - t.responsabilidade * 0.2 + h('l')], ['fe', -t.abertura * 0.4 + t.afabilidade * 0.2 + h('e')],
    ['aventura', t.abertura * 0.4 + t.extroversao * 0.4 + h('a')], ['estabilidade', t.responsabilidade * 0.4 + t.estabilidade * 0.4 - t.abertura * 0.2 + h('s')],
    ['amizade', t.extroversao * 0.4 + t.afabilidade * 0.3 + h('m')], ['justica', t.responsabilidade * 0.3 - t.afabilidade * 0.1 + t.abertura * 0.2 + h('j')]
  ];
  return pesos.sort((a, b) => b[1] - a[1])[0][0];
}

/** Do que o protagonista gosta (o que pratica, o que já fez): para ver o que tem em comum com alguém. */
export function gostosDoProtagonista(v: Vida): Set<Gosto> {
  const f = v.caminhos?.frentes ?? {};
  const pratica = (...ds: string[]) => ds.some(d => { const x = (f as Record<string, { interesse: number; habilidade: number } | undefined>)[d]; return !!x && (x.interesse >= 45 || x.habilidade >= 35); });
  const s = new Set<Gosto>();
  if (pratica('desenho')) s.add('desenho');
  if (pratica('futebol')) s.add('futebol');
  if (pratica('musica')) s.add('música');
  if (pratica('ciencias', 'exatas', 'programacao')) s.add('ciências');
  if (pratica('danca')) s.add('dança');
  if (pratica('linguagens', 'escrita') || v.rotinas?.some(r => r.id === 'leitura')) s.add('leitura');
  if (pratica('xadrez')) s.add('xadrez');
  if (pratica('natacao')) s.add('natação');
  if (pratica('cozinha')) s.add('cozinha');
  if (v.rotinas?.some(r => r.id === 'videogame' || r.id === 'criar_conteudo') || v.eu.gostos) s.add('cinema');
  if (v.biografia.some(e => e.fato?.tipo === 'm_viagem')) s.add('viagem');
  if (v.rotinas?.some(r => ['corrida', 'trilha', 'jardinagem', 'surfe'].includes(r.id))) s.add('natureza');
  return s;
}

/** O que os dois têm em comum (os gostos dela que você também tem). */
export function emComum(v: Vida, p: Pick<Pessoa, 'id'>, meus = gostosDoProtagonista(v)): Gosto[] {
  return gostosDaPessoa(p).filter(g => meus.has(g));
}

/* ------------------------------------------------------------------ a memória */

/** O quanto cada tipo de lembrança pesa (o sinal: bom ou ruim) — o peso do marco multiplica. */
const SINAL: Partial<Record<TipoMarco, number>> = {
  traicao: -3, conflito: -1, distancia: -0.4, promessa_quebrada: -1.5, abandono: -2, perda: 0,
  apoio: 1.2, reconciliacao: 0.8, presente: 0.5, promessa: 1, amizade: 0.4, romance: 0.4, casamento: 0.6, filho: 0.5, ritual: 0.3
};

/** A meia-vida (em anos) de uma lembrança para esta pessoa: quem é rancoroso segura o ruim; quem é carinhoso, o bom. */
function meiaVida(p: Pick<Pessoa, 'id' | 'temperamento'>, ruim: boolean, tipo: TipoMarco): number {
  const tr = tracosDe(p);
  if (ruim) return (tipo === 'traicao' ? 7 : 3) * (tr.includes('rancoroso') ? 2 : 1) * (tr.includes('paciente') ? 0.7 : 1);
  return 6 * (tr.includes('carinhoso') || tr.includes('leal') ? 1.5 : 1);
}

export interface Lembranca { t: number; tipo: TipoMarco; texto: string; peso: number; efeito: number }

/** As lembranças que ainda pesam (a reconciliação desarma metade do ruim que veio antes dela). */
export function lembrancasQuePesam(v: Vida, vin: Vinculo, p: Pick<Pessoa, 'id' | 'temperamento'>): Lembranca[] {
  const hist: Marco[] = vin.historia ?? [];
  const reconc = hist.filter(m => m.tipo === 'reconciliacao').map(m => m.t);
  const out: Lembranca[] = [];
  for (const m of hist) {
    const sinal = m.tipo ? SINAL[m.tipo] : undefined;
    if (!sinal) continue;
    const anos = Math.max(0, (v.t - m.t) / 12);
    const ruim = sinal < 0;
    let efeito = sinal * (m.peso ?? 1) * Math.pow(0.5, anos / meiaVida(p, ruim, m.tipo!));
    if (ruim && reconc.some(t => t > m.t)) efeito *= m.tipo === 'traicao' ? 0.6 : 0.4;
    if (Math.abs(efeito) >= 0.15) out.push({ t: m.t, tipo: m.tipo!, texto: m.texto, peso: m.peso ?? 1, efeito });
  }
  return out.sort((a, b) => Math.abs(b.efeito) - Math.abs(a.efeito));
}

/** O clima da memória (-1 = só mágoa; +1 = só gratidão). */
export function climaDaMemoria(v: Vida, vin: Vinculo, p: Pick<Pessoa, 'id' | 'temperamento'>): number {
  const soma = lembrancasQuePesam(v, vin, p).reduce((s, l) => s + l.efeito, 0);
  return Math.max(-1, Math.min(1, soma / 6));
}

/** A lembrança ruim mais forte que ainda pesa (para a pessoa trazer à tona). */
export const feridaAberta = (v: Vida, vin: Vinculo, p: Pick<Pessoa, 'id' | 'temperamento'>) => lembrancasQuePesam(v, vin, p).find(l => l.efeito <= -1);
/** A lembrança boa mais forte (a gratidão). */
export const gratidao = (v: Vida, vin: Vinculo, p: Pick<Pessoa, 'id' | 'temperamento'>) => lembrancasQuePesam(v, vin, p).find(l => l.efeito >= 1);

/** Uma traição que ainda não passou (sem reconciliação depois, há menos de `anos`). */
export function traicaoQueNaoPassou(v: Vida, vin: Vinculo, anos = 4): Marco | undefined {
  const hist = vin.historia ?? [];
  return hist.find(m => m.tipo === 'traicao' && v.t - m.t <= anos * 12 && !hist.some(x => x.tipo === 'reconciliacao' && x.t > m.t));
}

/* ------------------------------------------------------------------ o jeito na interação */

/** Que tipo de coisa a interação é (para o jeito da pessoa pesar). */
export type GeneroDeInteracao = 'programa_social' | 'a_dois' | 'carinho' | 'conversa' | 'conflito' | 'presente' | 'ajuda' | 'outro';
const GENEROS: Record<string, GeneroDeInteracao> = {
  show: 'programa_social', estadio: 'programa_social', organizar_encontro: 'programa_social', sair_juntos: 'programa_social', festa: 'programa_social', feriado_juntos: 'programa_social',
  cinema: 'a_dois', jantar_fora: 'a_dois', caminhar_junto: 'a_dois', parque: 'a_dois', cozinhar_junto: 'a_dois', tempo: 'a_dois', fim_de_semana: 'a_dois', jantar_romantico: 'a_dois', viajar_juntos: 'a_dois', treinar_junto: 'a_dois',
  carinho: 'carinho', agradecer: 'carinho', elogiar: 'carinho', comemorar: 'carinho', aniversario: 'carinho',
  conversar: 'conversa', perguntar_vida: 'conversa', desabafar: 'conversa', pedir_conselho: 'conversa', ligar: 'conversa', visitar: 'conversa', contar_novidade: 'conversa', falar_futuro: 'conversa',
  discordar: 'conflito', cobrar: 'conflito', provocar: 'conflito', criticar: 'conflito', insultar: 'conflito', acusar: 'conflito', exigir_explicacoes: 'conflito',
  presentear: 'presente', apoiar: 'ajuda', acompanhar_consulta: 'ajuda', medico: 'ajuda'
};
export const generoDaInteracao = (id: string): GeneroDeInteracao => GENEROS[id] ?? 'outro';

/** O que o jeito faz com o que a interação rendeu (o fator sobre o ganho de proximidade e o sobre a perda). */
export function fatorDoJeito(p: Pick<Pessoa, 'id' | 'temperamento'>, id: string): { ganho: number; perda: number } {
  const tr = tracosDe(p), g = generoDaInteracao(id);
  let ganho = 1, perda = 1;
  if (tr.includes('timido')) { if (g === 'programa_social') ganho *= 0.6; if (g === 'a_dois' || g === 'conversa') ganho *= 1.2; }
  if (tr.includes('reservado') && g === 'conversa') ganho *= 0.85;
  if (tr.includes('extrovertido') || tr.includes('sociavel')) { if (g === 'programa_social') ganho *= 1.25; }
  if (tr.includes('carinhoso') && g === 'carinho') ganho *= 1.3;
  if (tr.includes('generoso') && g === 'presente') ganho *= 0.85; // quem dá muito não se impressiona com o que recebe
  if (tr.includes('egoista') && g === 'presente') ganho *= 1.3;
  if (tr.includes('temperamental')) perda *= 1.4;
  if (tr.includes('paciente')) perda *= 0.7;
  if (tr.includes('rancoroso') && g === 'conflito') perda *= 1.3;
  return { ganho, perda };
}

/** Que lembrança a interação deixa (quando deixa). */
export function lembrancaDaInteracao(id: string, deuCerto: boolean): { tipo: TipoMarco; peso: 1 | 2 } | null {
  const g = generoDaInteracao(id);
  if (g === 'presente' && deuCerto) return { tipo: 'presente', peso: 1 };
  if (g === 'ajuda' && deuCerto) return { tipo: 'apoio', peso: 2 };
  return null;
}

/* ------------------------------------------------------------------ o caso */

/** VIDA 12.6 — o quanto o caso deixou rastro no último ano (o cartão, a viagem, quem viu): soma ao risco da descoberta (0..0.12). */
export function riscoDoRastro(v: Vida, id: string): number {
  const t = v.fatos[`caso_rastro:${id}`];
  if (t === undefined || v.t - t > 12) return 0;
  return Math.min(0.12, (v.fatos[`caso_rastro_peso:${id}`] ?? 0) * 0.04);
}

/* ------------------------------------------------------------------ o chefe */

export type PerfilDeChefe = 'exigente' | 'compreensivo' | 'injusto' | 'incentivador' | 'autoritario' | 'desorganizado' | 'neutro';
export const NOME_PERFIL_CHEFE: Record<PerfilDeChefe, string> = {
  exigente: 'exigente', compreensivo: 'compreensivo', injusto: 'injusto', incentivador: 'incentivador', autoritario: 'autoritário', desorganizado: 'desorganizado', neutro: 'sem grandes manias'
};
/** O jeito de chefiar de alguém (do temperamento, estável): o que mais aparece, se aparece. */
export function perfilDoChefe(p: Pick<Pessoa, 'id' | 'temperamento'>): PerfilDeChefe {
  const t = p.temperamento;
  const pesos: [PerfilDeChefe, number][] = [
    ['desorganizado', -t.responsabilidade - 0.35],
    ['injusto', -t.afabilidade * 0.7 - t.estabilidade * 0.3 - 0.35],
    ['autoritario', t.extroversao * 0.4 - t.afabilidade * 0.6 - 0.3],
    ['exigente', t.responsabilidade * 0.7 - t.afabilidade * 0.2 - 0.3],
    ['incentivador', t.afabilidade * 0.5 + t.abertura * 0.5 - 0.3],
    ['compreensivo', t.afabilidade * 0.6 + t.estabilidade * 0.4 - 0.32]
  ];
  const [melhor, f] = pesos.sort((a, b) => b[1] - a[1])[0];
  return f > 0 ? melhor : 'neutro';
}
/** O que o jeito do chefe faz no ano (o desempenho e o clima puxam um pouco; a chance da promoção e da advertência). */
export const EFEITO_DO_CHEFE: Record<PerfilDeChefe, { desempenho: number; clima: number; promocao: number; sancao: number }> = {
  exigente: { desempenho: 2, clima: -1, promocao: 1.05, sancao: 1.3 },
  compreensivo: { desempenho: 0, clima: 2, promocao: 1, sancao: 0.6 },
  injusto: { desempenho: -1, clima: -3, promocao: 0.75, sancao: 1.5 },
  incentivador: { desempenho: 2, clima: 2, promocao: 1.25, sancao: 0.8 },
  autoritario: { desempenho: 1, clima: -2, promocao: 0.95, sancao: 1.4 },
  desorganizado: { desempenho: -1, clima: -1, promocao: 0.9, sancao: 1 },
  neutro: { desempenho: 0, clima: 0, promocao: 1, sancao: 1 }
};
