/**
 * Identidade das pessoas 2.0 (REWORK 4): nome, aparência e família como uma
 * história, não como sorteios independentes.
 *
 *   contexto populacional (só na 1ª geração: `dados/populacoes`)
 *     → ancestralidade da família (proporções; a mistura é contínua)
 *       → os pais
 *         → o nome e o sobrenome (a tradição da família + o costume do lugar)
 *         → a aparência (traços modulares herdados: pele, textura e cor do
 *           cabelo, olhos, forma dos olhos, nariz, boca, rosto, sobrancelha)
 *           → os filhos, os netos (os PAIS são a fonte; a origem só na 1ª).
 *
 * Regras:
 *   - migrar não muda a ancestralidade nem a aparência genética (nada aqui lê
 *     onde a pessoa mora depois de nascer);
 *   - adotar dá a família, não a genética (a criança adotada tem a origem dela);
 *   - irmãos parecem parentes sem serem clones (cada traço puxa um dos pais,
 *     às vezes um avô — a variação da própria ancestralidade);
 *   - o nome não muda com a mudança de país.
 *
 * Sorteios: SEMPRE derivados (`rngDe`, ou um gerador semeado pelos próprios
 * traços já sorteados) — a sequência do gerador da vida não muda, e vidas de
 * testes antigos seguem iguais no resto.
 */

import type { Genero, Pessoa, Visual } from '../tipos';
import { criarRng, rngDe, type Rng } from '../rng';
import { ORIGENS, PELE_MEDIA, POPULACOES, POPULACOES_POR_REGIAO, TRACOS, type Ancestralidade, type Origem, type PerfilPopulacional } from '../dados/populacoes';
import { paisDoCatalogo, paisesVivenciaveis, existePais, perfilDoPais, temPerfil } from '../mundo/registro';

export type { Ancestralidade };

const PELES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
export const TEXTURAS = ['liso', 'ondulado', 'cacheado', 'crespo'] as const;
const CORES_CABELO = ['preto', 'castanho_escuro', 'castanho', 'castanho_claro', 'loiro', 'ruivo'];
const CORES_OLHOS = ['castanho_escuro', 'castanho', 'mel', 'verde', 'azul'];
export const FORMAS_OLHOS = ['amendoado', 'redondo', 'caido', 'puxado'] as const;
export const NARIZES = ['fino', 'medio', 'largo', 'arrebitado'] as const;
export const BOCAS = ['fina', 'media', 'cheia'] as const;
export const ROSTOS = ['oval', 'redondo', 'quadrado', 'longo', 'coracao'] as const;
export const SOBRANCELHAS = ['fina', 'media', 'grossa'] as const;
const LISTAS: Record<string, readonly string[]> = { textura: TEXTURAS, corCabelo: CORES_CABELO, olhos: CORES_OLHOS, olhosForma: FORMAS_OLHOS, nariz: NARIZES, boca: BOCAS, rosto: ROSTOS, sobrancelha: SOBRANCELHAS };
const CAMPO: Record<string, keyof Visual> = { textura: 'textura', corCabelo: 'corCabelo', olhos: 'olhos', olhosForma: 'olhosForma', nariz: 'nariz', boca: 'boca', rosto: 'rosto', sobrancelha: 'sobrancelha' };
const TINTAS = new Set(['platinado', 'vermelho', 'azul', 'rosa', 'grisalho']);

/** Os penteados que combinam com cada textura (o estilo é da pessoa; a textura, da família). */
const ESTILOS: Record<Genero, Record<(typeof TEXTURAS)[number], string[]>> = {
  masculino: { liso: ['curto', 'curto_lado', 'raspado'], ondulado: ['ondulado', 'curto', 'curto_lado', 'raspado'], cacheado: ['cacheado', 'ondulado', 'raspado'], crespo: ['crespo_curto', 'raspado', 'cacheado'] },
  feminino: { liso: ['longo_liso', 'chanel', 'rabo', 'coque'], ondulado: ['longo_ondulado', 'chanel', 'rabo', 'coque'], cacheado: ['cacheado_longo', 'longo_ondulado', 'coque', 'trancas'], crespo: ['black', 'trancas', 'cacheado_longo', 'coque'] },
  nao_binario: { liso: ['curto', 'chanel', 'rabo'], ondulado: ['ondulado', 'chanel', 'rabo'], cacheado: ['cacheado', 'black'], crespo: ['black', 'cacheado', 'curto'] }
};

/* ------------------------------------------------------------ Ancestralidade */

export function normalizar(a: Ancestralidade): Ancestralidade {
  const s = ORIGENS.reduce((t, o) => t + (a[o] ?? 0), 0) || 1;
  const out: Ancestralidade = {};
  for (const o of ORIGENS) { const x = (a[o] ?? 0) / s; if (x >= 0.005) out[o] = Math.round(x * 1000) / 1000; }
  return out;
}

/** Filho: metade de cada um (sem o outro, a de quem se conhece). */
export function misturar(a?: Ancestralidade, b?: Ancestralidade): Ancestralidade | undefined {
  if (!a && !b) return undefined;
  const x = a ?? b!, y = b ?? a!;
  const out: Ancestralidade = {};
  for (const o of ORIGENS) { const v = ((x[o] ?? 0) + (y[o] ?? 0)) / 2; if (v) out[o] = v; }
  return normalizar(out);
}

/** A ancestralidade de quem veio de antes do REWORK 4 (sem o campo): uma leitura do tom de pele, só para herdar. */
export function ancestralidadeDe(p: { ancestralidade?: Ancestralidade; visual?: Visual }): Ancestralidade {
  if (p.ancestralidade && Object.keys(p.ancestralidade).length) return p.ancestralidade;
  const k = PELES.indexOf(p.visual?.pele ?? 'p3');
  return k <= 1 ? { eu: 0.85, am: 0.1, af: 0.05 } : k <= 2 ? { eu: 0.55, af: 0.3, am: 0.15 } : k <= 3 ? { eu: 0.35, af: 0.45, am: 0.2 } : { af: 0.8, eu: 0.15, am: 0.05 };
}

/** Os perfis de família que vivem num país (a região, para quem não tem perfil vivível). */
export function populacoesDe(pais: string): PerfilPopulacional[] {
  if (POPULACOES[pais]) return POPULACOES[pais];
  const reg = existePais(pais) ? paisDoCatalogo(pais).regiao : 'america_sul';
  return POPULACOES_POR_REGIAO[reg] ?? POPULACOES_POR_REGIAO.america_sul;
}

/** Um perfil de família para quem nasce (ou chega) num país sem família conhecida. */
export function perfilInicial(r: Rng, pais: string): PerfilPopulacional {
  const lista = populacoesDe(pais);
  return r.weighted(lista, p => p.peso) ?? lista[0];
}

/** A tradição de nomes de um perfil (só países com lista de nomes no jogo). */
export const tradicaoValida = (t?: string) => (t && temPerfil(t) ? t : undefined);

/* --------------------------------------------------------------- Aparência */

function pesoDoTraco(traco: string, anc: Ancestralidade): number[] {
  const n = LISTAS[traco].length;
  const out = new Array(n).fill(0);
  for (const o of ORIGENS) { const w = anc[o] ?? 0; if (!w) continue; const d = TRACOS[traco][o as Origem]; for (let k = 0; k < n; k++) out[k] += w * d[k]; }
  return out;
}
function sortearTraco(r: Rng, traco: string, anc: Ancestralidade): string {
  const pesos = pesoDoTraco(traco, anc);
  const lista = LISTAS[traco];
  return r.weighted([...lista], x => pesos[lista.indexOf(x)] + 0.0001) ?? lista[0];
}
function peleDa(r: Rng, anc: Ancestralidade): string {
  const media = ORIGENS.reduce((s, o) => s + (anc[o] ?? 0) * PELE_MEDIA[o], 0);
  const mistura = 1 - Math.max(...ORIGENS.map(o => anc[o] ?? 0));
  const k = Math.round(media + r.normal() * (0.45 + mistura * 0.6));
  return PELES[Math.max(0, Math.min(5, k))];
}
function estiloPara(r: Rng, genero: Genero, textura: string): string {
  return r.pick(ESTILOS[genero][textura as (typeof TEXTURAS)[number]] ?? ESTILOS[genero].liso);
}

/** A aparência de quem é gerado sem pais conhecidos: pela ancestralidade (o estilo de cabelo e a barba são da pessoa). */
export function visualDaAncestralidade(r: Rng, genero: Genero, anc: Ancestralidade, base?: Visual): Visual {
  const textura = sortearTraco(r, 'textura', anc);
  const v: Visual = {
    ...(base ?? {}),
    pele: peleDa(r, anc),
    corCabelo: sortearTraco(r, 'corCabelo', anc),
    olhos: sortearTraco(r, 'olhos', anc),
    textura, olhosForma: sortearTraco(r, 'olhosForma', anc), nariz: sortearTraco(r, 'nariz', anc), boca: sortearTraco(r, 'boca', anc),
    rosto: sortearTraco(r, 'rosto', anc), sobrancelha: sortearTraco(r, 'sobrancelha', anc),
    cabelo: estiloPara(r, genero, textura)
  } as Visual;
  if (base?.barba !== undefined) v.barba = base.barba;
  return v;
}

/** A cor natural do cabelo (tinta não passa para filho). */
const corNatural = (x: Visual, natural?: string) => (natural && !TINTAS.has(natural) ? natural : TINTAS.has(x.corCabelo) ? undefined : x.corCabelo);

/**
 * Filho de A e B: cada traço puxa um dos pais (às vezes volta um traço de mais longe — a variação da própria
 * ancestralidade); a pele mistura; a textura de pais diferentes tende ao meio. Nunca um clone.
 */
export function visualDosPais(r: Rng, genero: Genero, anc: Ancestralidade, a?: Visual, b?: Visual, naturais: [string?, string?] = []): Visual {
  if (!a && !b) return visualDaAncestralidade(r, genero, anc);
  const x = a ?? b!, y = b ?? a!;
  const proprio = visualDaAncestralidade(r, genero, anc);
  const de = (traco: string): string => {
    const campo = CAMPO[traco];
    const px = traco === 'corCabelo' ? corNatural(x, naturais[0]) : (x[campo] as string | undefined);
    const py = traco === 'corCabelo' ? corNatural(y, naturais[1]) : (y[campo] as string | undefined);
    const z = r.next();
    if (z < 0.12 || (!px && !py)) return proprio[campo] as string;
    if (z < 0.56) return px ?? py ?? (proprio[campo] as string);
    return py ?? px ?? (proprio[campo] as string);
  };
  const ix = PELES.indexOf(x.pele), iy = PELES.indexOf(y.pele);
  const pele = PELES[Math.max(0, Math.min(5, Math.round((ix + iy) / 2 + (r.next() - 0.5) * 1.2)))];
  let textura = de('textura');
  const tx = TEXTURAS.indexOf((x.textura ?? textura) as never), ty = TEXTURAS.indexOf((y.textura ?? textura) as never);
  if (tx >= 0 && ty >= 0 && Math.abs(tx - ty) >= 2 && r.chance(0.55)) textura = TEXTURAS[Math.round((tx + ty) / 2)];
  const v: Visual = { pele, corCabelo: de('corCabelo'), olhos: de('olhos'), textura, olhosForma: de('olhosForma'), nariz: de('nariz'), boca: de('boca'), rosto: de('rosto'), sobrancelha: de('sobrancelha'), cabelo: estiloPara(r, genero, textura) } as Visual;
  if (genero === 'masculino' && r.chance(0.35)) v.barba = r.pick(['bigode', 'cavanhaque', 'curta', 'cheia']);
  return v;
}

/** O avô e a avó: gente de quem o pai ou a mãe herdou — parecidos com o filho, e um com o outro só pela origem. */
export function visualDeQuemGerou(r: Rng, genero: Genero, anc: Ancestralidade, filho: Visual): Visual {
  const v = visualDaAncestralidade(r, genero, anc);
  // Metade dos traços do filho veio deste lado: leva alguns de volta.
  for (const t of ['corCabelo', 'olhos', 'olhosForma', 'nariz', 'boca', 'rosto', 'sobrancelha', 'textura']) {
    const campo = CAMPO[t];
    if (r.chance(0.5) && filho[campo] && !(t === 'corCabelo' && TINTAS.has(filho.corCabelo))) (v as unknown as Record<string, unknown>)[campo] = filho[campo];
  }
  const k = PELES.indexOf(filho.pele);
  v.pele = PELES[Math.max(0, Math.min(5, k + Math.round(r.normal() * 0.8)))];
  v.cabelo = estiloPara(r, genero, v.textura ?? 'liso');
  return v;
}

/** Os avós de um lado: duas ancestralidades cuja média dá a do filho (quem é misturado teve pais diferentes entre si). */
export function ancestralidadesDosPais(r: Rng, filho: Ancestralidade): [Ancestralidade, Ancestralidade] {
  const ords = ORIGENS.filter(o => (filho[o] ?? 0) > 0.05);
  if (ords.length <= 1) return [filho, filho];
  const a: Ancestralidade = {}, b: Ancestralidade = {};
  for (const o of ORIGENS) {
    const w = filho[o] ?? 0;
    const desvio = Math.min(w, 1 - w) * (0.4 + r.next() * 0.6) * (r.chance(0.5) ? 1 : -1);
    a[o] = Math.max(0, w + desvio); b[o] = Math.max(0, w - desvio);
  }
  return [normalizar(a), normalizar(b)];
}

/** Um gerador semeado pelos traços que o gerador principal já sorteou: dá variação sem gastar a sequência da vida. */
export function rngDosTracos(v: Visual, ...extra: (string | number | undefined)[]): Rng {
  return rngDe(v.pele, v.cabelo, v.corCabelo, v.olhos, v.barba ?? '', ...extra.map(x => x ?? ''));
}

/* ---------------------------------------------------------------- A pessoa */

/** Uma identidade inicial (sem família conhecida): o perfil do lugar → a ancestralidade e a tradição de nomes. */
export function identidadeInicial(id: string, pais: string, genero: Genero, base: Visual): { ancestralidade: Ancestralidade; tradicao?: string; visual: Visual } {
  const r = rngDe(id, 'identidade');
  const perfil = perfilInicial(r, pais);
  return { ancestralidade: normalizar(perfil.mix), tradicao: tradicaoValida(perfil.nomes), visual: visualDaAncestralidade(r, genero, normalizar(perfil.mix), base) };
}

/** A ancestralidade e a tradição de uma pessoa (com fallback para quem veio de antes). */
export function origemDaPessoa(p: Pessoa): { ancestralidade: Ancestralidade; tradicao?: string } {
  return { ancestralidade: ancestralidadeDe(p), tradicao: p.tradicao };
}

/** A tradição de nomes de um filho: a do pai, a da mãe — e o lugar, com o tempo (a terceira geração já é daqui). */
export function tradicaoDoFilho(a?: string, b?: string, geracaoNoLugar = 1): string | undefined {
  const t = a ?? b;
  if (!t) return undefined;
  return geracaoNoLugar >= 3 ? undefined : t;
}

/** A chance de o prenome vir da tradição da família (e não do lugar): mais nas gerações antigas e na 1ª geração. */
export function chanceDoNomeDaTradicao(anoNasc: number, primeiraGeracao: boolean): number {
  const antiga = anoNasc < 1975 ? 0.25 : anoNasc < 2000 ? 0.1 : 0;
  return Math.min(0.85, (primeiraGeracao ? 0.55 : 0.22) + antiga);
}

export { criarRng };

/** A tradição de um sobrenome: a do lugar (nada) ou a do país de onde ele vem (um país com lista de nomes no jogo). */
export function tradicaoDoSobrenome(sobrenome: string, pais: string, paises: string[] = paisesVivenciaveis().map(x => x.id)): string | undefined {
  const partes = sobrenome.split(' ').filter(Boolean);
  const tem = (id: string) => perfilDoPais(id).nomes.grupos.some(g => g.sobrenomes.some(s => partes.includes(s)));
  if (!partes.length || (temPerfil(pais) && tem(pais))) return undefined;
  return paises.find(id => id !== pais && temPerfil(id) && tem(id));
}

/**
 * A família da primeira geração (os pais de quem nasce no começo do jogo): o pai pela tradição do sobrenome que o
 * jogador escolheu (ou pelo lugar); a mãe, quase sempre de uma origem próxima — às vezes de outra (famílias
 * misturadas são comuns).
 */
export function familiaInicial(id: string, pais: string, sobrenome: string, paises?: string[]): { pai: { ancestralidade: Ancestralidade; tradicao?: string }; mae: { ancestralidade: Ancestralidade; tradicao?: string } } {
  const r = rngDe(id, 'familia_inicial');
  const trad = tradicaoDoSobrenome(sobrenome, pais, paises);
  let perfilPai: PerfilPopulacional;
  if (trad) perfilPai = populacoesDe(pais).find(p => p.nomes === trad) ?? { peso: 1, mix: populacoesDe(trad)[0].mix, nomes: trad };
  else { perfilPai = perfilInicial(r, pais); for (let k = 0; k < 6 && perfilPai.nomes; k++) perfilPai = perfilInicial(r, pais); }
  const perfilMae = r.chance(0.6) ? perfilPai : perfilInicial(r, pais);
  const pai = { ancestralidade: normalizar(perfilPai.mix), tradicao: tradicaoValida(perfilPai.nomes) };
  const mae = { ancestralidade: normalizar(perfilMae.mix), tradicao: tradicaoValida(perfilMae.nomes) };
  return { pai, mae };
}
