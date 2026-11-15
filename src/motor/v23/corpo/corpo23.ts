/**
 * VIDA 23 — O CORPO DE CADA UM: a CONSTITUIÇÃO (as proporções de nascença, em doze eixos) e as MARCAS NATURAIS (pintas,
 * sardas, marcas de nascença, manchas, cicatrizes, estrias, covinhas) e os pelos do corpo.
 *
 * Camadas do corpo desenhado (`ui/avatar/Figura`):
 *   1. a base do gênero (a de sempre);
 *   2. a CONSTITUIÇÃO (`Visual.corpo23`) — estatura, ombros, estrutura óssea, peito, cintura, quadril, braços, coxas,
 *      panturrilhas, comprimento das pernas, barriga e músculo, cada um de −2 a +2 (0 = a base). Ausente = tudo 0: o
 *      corpo de quem veio antes da VIDA 23 não muda;
 *   3. a CONDIÇÃO (`sistemas/silhueta.tipoDeCorpo`: magro, atlético, musculoso, acima do peso...), que a vida muda —
 *      academia, esporte, hábitos, idade. A constituição não substitui a condição: soma-se a ela.
 *
 * Nada aqui escolhe pela pessoa a partir do gênero, da origem ou da condição social: os sorteios são os mesmos para
 * todos (só os pelos do corpo e as sardas seguem a frequência real — a pele clara sardenta, os pelos mais comuns em
 * homens), e qualquer combinação é permitida ao jogador.
 *
 * Módulo-folha (sem importações de tempo de execução): pode ser lido pela identidade, pelo save, pelas telas e pelas
 * ações sem criar ciclo entre pacotes. O sorteio usa um gerador próprio (de uma chave) — não toca o acaso do jogo.
 */
import type { Lado, RegiaoDeTatuagem } from '../../dados/tatuagens';

/* ------------------------------------------------------------------ o gerador próprio */

function hashTexto(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Um gerador pequeno (mulberry32) a partir de uma chave: o mesmo resultado para a mesma chave. */
export function acaso23(chave: string): () => number {
  let a = hashTexto(chave) || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const escolher = <T>(r: () => number, lista: readonly T[]): T => lista[Math.floor(r() * lista.length) % lista.length];
function pesado<T>(r: () => number, lista: readonly T[], pesos: readonly number[]): T {
  const tot = pesos.reduce((a, b) => a + b, 0); let x = r() * tot;
  for (let k = 0; k < lista.length; k++) { x -= pesos[k]; if (x <= 0) return lista[k]; }
  return lista[lista.length - 1];
}

/* ------------------------------------------------------------------ a constituição */

export const EIXOS_DO_CORPO = ['estatura', 'ombros', 'estrutura', 'peito', 'cintura', 'quadril', 'bracos', 'coxas', 'panturrilhas', 'pernas', 'barriga', 'musculo'] as const;
export type EixoDoCorpo = (typeof EIXOS_DO_CORPO)[number];
export type Constituicao = Record<EixoDoCorpo, number>;

/** Como cada eixo aparece na tela: o nome, o grupo (para organizar) e as cinco leituras, de −2 a +2. */
export const EIXOS23: Record<EixoDoCorpo, { nome: string; grupo: 'geral' | 'cima' | 'meio' | 'baixo'; niveis: [string, string, string, string, string] }> = {
  estatura: { nome: 'Estatura', grupo: 'geral', niveis: ['bem baixa', 'baixa', 'média', 'alta', 'bem alta'] },
  estrutura: { nome: 'Estrutura óssea', grupo: 'geral', niveis: ['bem fina', 'fina', 'média', 'larga', 'bem larga'] },
  pernas: { nome: 'Comprimento das pernas', grupo: 'geral', niveis: ['bem curtas', 'curtas', 'proporcionais', 'longas', 'bem longas'] },
  musculo: { nome: 'Músculo', grupo: 'geral', niveis: ['pouco', 'leve', 'médio', 'definido', 'muito definido'] },
  ombros: { nome: 'Ombros', grupo: 'cima', niveis: ['bem estreitos', 'estreitos', 'médios', 'largos', 'bem largos'] },
  peito: { nome: 'Peito', grupo: 'cima', niveis: ['bem pouco volume', 'pouco volume', 'médio', 'volumoso', 'bem volumoso'] },
  bracos: { nome: 'Braços', grupo: 'cima', niveis: ['bem finos', 'finos', 'médios', 'cheios', 'bem cheios'] },
  cintura: { nome: 'Cintura', grupo: 'meio', niveis: ['bem fina', 'fina', 'média', 'larga', 'bem larga'] },
  barriga: { nome: 'Barriga', grupo: 'meio', niveis: ['chapada', 'reta', 'leve', 'saliente', 'bem saliente'] },
  quadril: { nome: 'Quadril', grupo: 'baixo', niveis: ['bem estreito', 'estreito', 'médio', 'largo', 'bem largo'] },
  coxas: { nome: 'Coxas', grupo: 'baixo', niveis: ['bem finas', 'finas', 'médias', 'grossas', 'bem grossas'] },
  panturrilhas: { nome: 'Panturrilhas', grupo: 'baixo', niveis: ['bem finas', 'finas', 'médias', 'grossas', 'bem grossas'] }
};
export const GRUPOS23: { id: 'geral' | 'cima' | 'meio' | 'baixo'; nome: string }[] = [
  { id: 'geral', nome: 'O corpo todo' }, { id: 'cima', nome: 'Em cima' }, { id: 'meio', nome: 'No meio' }, { id: 'baixo', nome: 'Embaixo' }
];

export const NEUTRA23: Constituicao = Object.fromEntries(EIXOS_DO_CORPO.map(e => [e, 0])) as Constituicao;
const limitar = (x: number) => Math.max(-2, Math.min(2, Math.round(Number.isFinite(x) ? x : 0)));

/** Lê o que está guardado (12 dígitos de 0 a 4; 2 = a base). Ausente ou estragado: a base (nada muda). */
export function lerCorpo23(s?: string): Constituicao {
  const c = { ...NEUTRA23 };
  if (typeof s !== 'string') return c;
  EIXOS_DO_CORPO.forEach((e, k) => { const d = s.charCodeAt(k) - 48; if (d >= 0 && d <= 4) c[e] = d - 2; });
  return c;
}
/** Guarda a constituição (sem campo quando é a base: o save não cresce à toa). */
export function gravarCorpo23(c: Partial<Constituicao>): string | undefined {
  const s = EIXOS_DO_CORPO.map(e => String(limitar(c[e] ?? 0) + 2)).join('');
  return /^2+$/.test(s) ? undefined : s;
}
export const corpo23Valido = (s: unknown): s is string => typeof s === 'string' && /^[0-4]{12}$/.test(s);

/**
 * As FORMAS DE PARTIDA: atalhos que mexem em vários eixos de uma vez (a pessoa ajusta depois, eixo a eixo). Nenhuma é
 * "de homem" ou "de mulher": valem para qualquer corpo.
 */
export const FORMAS23: { id: string; nome: string; nota: string; c: Partial<Constituicao> }[] = [
  { id: 'base', nome: 'Base', nota: 'Tudo no meio: o ponto de partida.', c: {} },
  { id: 'longilineo', nome: 'Longilíneo', nota: 'Alto, de estrutura fina e pernas longas.', c: { estatura: 2, estrutura: -1, pernas: 1, bracos: -1, coxas: -1, panturrilhas: -1 } },
  { id: 'compacto', nome: 'Compacto', nota: 'Baixo, de estrutura larga e pernas curtas.', c: { estatura: -2, estrutura: 1, pernas: -1, ombros: 1, coxas: 1 } },
  { id: 'triangulo_invertido', nome: 'Ombros largos', nota: 'Ombros e costas largos, quadril estreito.', c: { ombros: 2, peito: 1, quadril: -1, cintura: -1 } },
  { id: 'ampulheta', nome: 'Ampulheta', nota: 'Peito e quadril largos, cintura marcada.', c: { peito: 1, cintura: -2, quadril: 2, coxas: 1 } },
  { id: 'pera', nome: 'Quadril largo', nota: 'Ombros estreitos, quadril e coxas largos.', c: { ombros: -1, quadril: 2, coxas: 2, panturrilhas: 1 } },
  { id: 'retangulo', nome: 'Reto', nota: 'Ombros, cintura e quadril quase na mesma linha.', c: { cintura: 1, quadril: -1, peito: -1 } },
  { id: 'oval', nome: 'Arredondado', nota: 'O volume no meio: cintura larga e barriga saliente.', c: { cintura: 2, barriga: 2, peito: 1, bracos: 1 } },
  { id: 'robusto', nome: 'Robusto', nota: 'Estrutura larga e forte, braços e coxas cheios.', c: { estrutura: 2, ombros: 1, bracos: 1, coxas: 1, musculo: 1 } },
  { id: 'esguio', nome: 'Esguio', nota: 'Estrutura fina, braços e pernas finos.', c: { estrutura: -2, bracos: -1, coxas: -1, panturrilhas: -1, ombros: -1 } },
  { id: 'pernas_fortes', nome: 'Pernas fortes', nota: 'Coxas e panturrilhas grossas, quadril firme.', c: { coxas: 2, panturrilhas: 2, quadril: 1, musculo: 1 } },
  { id: 'tronco_longo', nome: 'Tronco longo', nota: 'Pernas curtas para a altura: o tronco comprido.', c: { pernas: -2, estatura: -1 } },
  { id: 'definido', nome: 'Definido', nota: 'Pouca gordura, o músculo aparecendo.', c: { musculo: 2, barriga: -2, cintura: -1, bracos: 1 } }
];

/** Que forma de partida é esta constituição (a mais parecida, se for exatamente uma delas). */
export function formaDe(c: Constituicao): string | undefined {
  return FORMAS23.find(f => EIXOS_DO_CORPO.every(e => (f.c[e] ?? 0) === c[e]))?.id;
}

/** A frase curta do corpo (os eixos fora do meio, os mais marcantes primeiro). */
export function descreverCorpo23(c: Constituicao, max = 4): string {
  const fora = EIXOS_DO_CORPO.filter(e => c[e] !== 0).sort((a, b) => Math.abs(c[b]) - Math.abs(c[a]));
  if (!fora.length) return 'proporções médias';
  return fora.slice(0, max).map(e => `${EIXOS23[e].nome.toLowerCase()} ${EIXOS23[e].niveis[c[e] + 2]}`).join(' · ');
}

const DIST = [0.07, 0.22, 0.42, 0.22, 0.07];
/**
 * A constituição de quem nasce ou aparece no mundo. Com pais conhecidos, cada eixo puxa a média deles (com variação):
 * a família se parece sem ser cópia. Sem pais, o sorteio largo (a maioria perto do meio, uns poucos nas pontas).
 */
export function sortearCorpo23(chave: string, pais: (string | undefined)[] = []): string | undefined {
  const r = acaso23(`corpo23:${chave}`);
  const ps = pais.filter(corpo23Valido).map(lerCorpo23);
  const c = { ...NEUTRA23 };
  for (const e of EIXOS_DO_CORPO) {
    const livre = pesado(r, [-2, -1, 0, 1, 2], DIST);
    if (ps.length) {
      const media = ps.reduce((s, p) => s + p[e], 0) / ps.length;
      c[e] = limitar(media * 0.7 + livre * 0.55);
    } else c[e] = livre;
  }
  // A estrutura puxa os ombros e os braços um pouco (ossos largos, ombros largos) — sem forçar.
  if (c.estrutura !== 0 && r() < 0.5) c.ombros = limitar(c.ombros + Math.sign(c.estrutura));
  return gravarCorpo23(c);
}

/* ------------------------------------------------------------------ as marcas naturais */

export type TipoDeMarca = 'pinta' | 'pintas' | 'sardas' | 'marca_nascenca' | 'mancha' | 'cicatriz' | 'estrias' | 'covinhas';

/**
 * Uma marca na pele. `r` e `l` são as regiões do corpo das tatuagens (`dados/tatuagens.REGIOES`: as mesmas caixas
 * anatômicas, de frente e de costas, e as do rosto); `x`, `y` (−1 a 1) o lugar dentro da região; `s` o tamanho (1 a 3);
 * `a` o ângulo (graus); `i` a intensidade (1 a 3); `n` quantas (pintas e sardas); `f` a forma; `k` a semente do desenho
 * (o padrão das pintas e sardas, o contorno da mancha); `d` a idade em que aparece (a estria da adolescência, a cicatriz
 * de um tombo aos 9) — antes disso, não se vê.
 */
export interface MarcaNatural {
  t: TipoDeMarca; r: RegiaoDeTatuagem; l?: Lado; x: number; y: number; s: 1 | 2 | 3; a?: number; i?: 1 | 2 | 3; n?: number; f?: string; k?: number; d?: number;
}

const ROSTO: RegiaoDeTatuagem[] = ['testa', 'tempora', 'bochecha', 'nariz', 'queixo', 'sob_olho'];
const TRONCO: RegiaoDeTatuagem[] = ['peitoral', 'centro_peito', 'costelas', 'abdomen', 'costas_alta', 'costas_media', 'costas_baixa'];
const BRACOS: RegiaoDeTatuagem[] = ['ombro', 'biceps', 'triceps', 'antebraco', 'antebraco_externo', 'pulso', 'mao'];
const PERNAS: RegiaoDeTatuagem[] = ['coxa', 'joelho', 'canela', 'panturrilha', 'tornozelo', 'pe'];
export const REGIOES_DO_ROSTO23 = new Set<RegiaoDeTatuagem>([...ROSTO, 'sobrancelha_t']);
const TODAS: RegiaoDeTatuagem[] = [...ROSTO, 'pescoco', 'nuca', ...TRONCO, ...BRACOS, ...PERNAS];

export const MARCAS23: Record<TipoDeMarca, {
  nome: string; nota: string; regioes: RegiaoDeTatuagem[]; formas?: { id: string; nome: string }[]; quantidade?: [number, number]; gira?: boolean; intensidade?: boolean;
}> = {
  pinta: { nome: 'Pinta', nota: 'Um sinal só, plano ou em relevo.', regioes: TODAS, formas: [{ id: 'plana', nome: 'plana' }, { id: 'relevo', nome: 'em relevo' }], intensidade: true },
  pintas: { nome: 'Pintas espalhadas', nota: 'Algumas pintas pela região, cada pessoa no seu desenho.', regioes: TODAS.filter(r => !['nariz', 'pulso', 'mao', 'tornozelo', 'pe', 'sob_olho'].includes(r)), quantidade: [2, 9], intensidade: true },
  sardas: { nome: 'Sardas', nota: 'Pontinhos de sol: no rosto, nos ombros, nos braços, nas costas.', regioes: ['bochecha', 'nariz', 'testa', 'pescoco', 'ombro', 'costas_alta', 'costas_media', 'peitoral', 'centro_peito', 'biceps', 'triceps', 'antebraco', 'antebraco_externo', 'mao', 'coxa', 'canela'], quantidade: [6, 40], intensidade: true },
  marca_nascenca: { nome: 'Marca de nascença', nota: 'A mancha de quem nasceu com ela.', regioes: TODAS.filter(r => r !== 'mao'), formas: [{ id: 'cafe', nome: 'café com leite' }, { id: 'vinho', nome: 'cor de vinho' }, { id: 'rosada', nome: 'rosada' }, { id: 'azulada', nome: 'azulada' }], gira: true },
  mancha: { nome: 'Mancha de pigmento', nota: 'Pele mais clara ou mais escura numa área.', regioes: TODAS, formas: [{ id: 'clara', nome: 'mais clara' }, { id: 'escura', nome: 'mais escura' }], gira: true, intensidade: true },
  cicatriz: { nome: 'Cicatriz', nota: 'De um corte, de uma cirurgia, de uma queimadura, da acne.', regioes: TODAS, formas: [{ id: 'reta', nome: 'reta' }, { id: 'curva', nome: 'curva' }, { id: 'cirurgica', nome: 'de cirurgia (com os pontos)' }, { id: 'queimadura', nome: 'de queimadura' }, { id: 'acne', nome: 'de acne (marquinhas)' }], gira: true, intensidade: true },
  estrias: { nome: 'Estrias', nota: 'As linhas finas de quando a pele esticou rápido.', regioes: ['ombro', 'biceps', 'triceps', 'costelas', 'abdomen', 'costas_baixa', 'coxa', 'joelho', 'panturrilha', 'peitoral'], formas: [{ id: 'claras', nome: 'claras (antigas)' }, { id: 'rosadas', nome: 'rosadas (recentes)' }, { id: 'escuras', nome: 'escuras' }], gira: true, intensidade: true },
  covinhas: { nome: 'Covinhas', nota: 'Na bochecha (de um lado ou dos dois) ou no queixo.', regioes: ['bochecha', 'queixo'] }
};
export const TIPOS_DE_MARCA = Object.keys(MARCAS23) as TipoDeMarca[];
/** O máximo de marcas guardadas por pessoa (o desenho fica limpo e o save pequeno). */
export const MAXIMO_DE_MARCAS = 14;

const num = (x: unknown, a: number, b: number, padrao: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : padrao);
/** Uma marca saneada (o que vem do save ou da tela): fora do catálogo, nada. */
export function marcaValida(m: unknown, regioesValidas?: (r: string) => boolean): MarcaNatural | undefined {
  if (!m || typeof m !== 'object') return undefined;
  const x = m as Record<string, unknown>;
  const t = x.t as TipoDeMarca;
  const def = MARCAS23[t];
  if (!def) return undefined;
  const r = x.r as RegiaoDeTatuagem;
  if (!def.regioes.includes(r) || (regioesValidas && !regioesValidas(r))) return undefined;
  const out: MarcaNatural = { t, r, x: +num(x.x, -1, 1, 0).toFixed(2), y: +num(x.y, -1, 1, 0).toFixed(2), s: Math.round(num(x.s, 1, 3, 1)) as 1 | 2 | 3 };
  if (x.l === 'e' || x.l === 'd') out.l = x.l;
  if (def.gira && x.a !== undefined) out.a = Math.round(num(x.a, 0, 179, 0));
  if (def.intensidade && x.i !== undefined) out.i = Math.round(num(x.i, 1, 3, 2)) as 1 | 2 | 3;
  if (def.quantidade) out.n = Math.round(num(x.n, def.quantidade[0], def.quantidade[1], def.quantidade[0]));
  if (def.formas) out.f = def.formas.some(f => f.id === x.f) ? (x.f as string) : def.formas[0].id;
  if (x.k !== undefined) out.k = Math.round(num(x.k, 0, 99999, 0));
  if (x.d !== undefined) out.d = Math.round(num(x.d, 0, 90, 0));
  return out;
}
export function marcasValidas(lista: unknown): MarcaNatural[] | undefined {
  if (!Array.isArray(lista)) return undefined;
  const out = lista.map(m => marcaValida(m)).filter((m): m is MarcaNatural => !!m).slice(0, MAXIMO_DE_MARCAS);
  return out.length ? out : undefined;
}

const NOME_DO_LADO: Record<Lado, string> = { e: 'esquerdo', d: 'direito' };
const TAMANHO = ['pequena', 'média', 'grande'];
/** A marca em palavras (para a lista da Aparência e o rótulo do desenho). `nomeDaRegiao` vem do catálogo de tatuagens. */
export function descreverMarca(m: MarcaNatural, nomeDaRegiao: (r: RegiaoDeTatuagem) => string): string {
  const def = MARCAS23[m.t];
  const forma = m.f && def.formas ? def.formas.find(f => f.id === m.f)?.nome : undefined;
  const lado = m.l ? ` (lado ${NOME_DO_LADO[m.l]})` : '';
  const qtd = m.n && def.quantidade ? ` · ${m.n}` : '';
  const tam = m.t === 'covinhas' || m.t === 'sardas' || m.t === 'pintas' ? '' : ` · ${TAMANHO[m.s - 1]}`;
  return `${def.nome}${forma ? ` ${forma}` : ''} — ${nomeDaRegiao(m.r)}${lado}${qtd}${tam}`;
}

/**
 * As marcas de quem aparece no mundo: perto de metade das pessoas sem nenhuma marca visível; as outras, uma ou duas
 * coisas suas (uma pinta no rosto, sardas nos ombros, a cicatriz de criança, as estrias da adolescência). Nada depende
 * de personalidade, de renda ou de origem — só as sardas acompanham a pele clara (e quem já tem sardas no rosto).
 */
export function sortearMarcas23(chave: string, pele: string, sardasNoRosto?: string): MarcaNatural[] | undefined {
  const r = acaso23(`marcas23:${chave}`);
  const out: MarcaNatural[] = [];
  const lado = (): Lado | undefined => (r() < 0.5 ? 'e' : 'd');
  const pos = () => +((r() * 2 - 1) * 0.8).toFixed(2);
  const com = (t: TipoDeMarca, regioes: RegiaoDeTatuagem[], extra: Partial<MarcaNatural> = {}) => {
    const reg = escolher(r, regioes);
    const m: MarcaNatural = { t, r: reg, x: pos(), y: pos(), s: pesado(r, [1, 2, 3] as const, [0.6, 0.3, 0.1]), k: Math.floor(r() * 99999), ...extra };
    if (REGIOES_LADO.has(reg) && !m.l && t !== 'covinhas') m.l = lado();
    const v = marcaValida(m);
    if (v) out.push(v);
  };
  if (r() < 0.26) com('pinta', r() < 0.4 ? ['bochecha', 'queixo', 'testa', 'tempora'] : TODAS.filter(x => !ROSTO.includes(x)), { f: r() < 0.3 ? 'relevo' : 'plana', i: pesado(r, [1, 2, 3] as const, [0.3, 0.5, 0.2]) });
  if (r() < 0.13) com('pintas', MARCAS23.pintas.regioes.filter(x => !ROSTO.includes(x)), { n: 2 + Math.floor(r() * 6), s: 1 });
  const clara = pele === 'p1' || pele === 'p2';
  const pSardas = sardasNoRosto && sardasNoRosto !== 'nao' ? 0.6 : clara ? 0.28 : 0.03;
  if (r() < pSardas) com('sardas', ['ombro', 'costas_alta', 'biceps', 'antebraco', 'peitoral'], { n: 10 + Math.floor(r() * 22), s: 1, i: pesado(r, [1, 2, 3] as const, [0.4, 0.4, 0.2]), l: undefined });
  if (r() < 0.08) com('marca_nascenca', TODAS.filter(x => x !== 'mao'), { f: pesado(r, ['cafe', 'vinho', 'rosada', 'azulada'], [0.55, 0.15, 0.2, 0.1]), a: Math.floor(r() * 180) });
  if (r() < 0.04) com('mancha', TODAS, { f: r() < 0.6 ? 'clara' : 'escura', a: Math.floor(r() * 180), i: 2 });
  if (r() < 0.15) com('cicatriz', TODAS, { f: pesado(r, ['reta', 'curva', 'cirurgica', 'queimadura', 'acne'], [0.4, 0.25, 0.12, 0.08, 0.15]), a: Math.floor(r() * 180), i: pesado(r, [1, 2, 3] as const, [0.45, 0.4, 0.15]), d: 3 + Math.floor(r() * 32) });
  if (r() < 0.11) com('estrias', ['coxa', 'abdomen', 'costelas', 'biceps', 'costas_baixa', 'ombro'], { f: pesado(r, ['claras', 'rosadas', 'escuras'], [0.6, 0.25, 0.15]), a: 60 + Math.floor(r() * 60), i: pesado(r, [1, 2, 3] as const, [0.5, 0.35, 0.15]), d: 12 + Math.floor(r() * 18) });
  if (r() < 0.1) com('covinhas', r() < 0.8 ? ['bochecha'] : ['queixo'], r() < 0.75 ? { l: undefined } : {});
  return out.length ? out : undefined;
}
/** As regiões que têm lado (as outras são do meio do corpo). */
const REGIOES_LADO = new Set<RegiaoDeTatuagem>(['tempora', 'bochecha', 'sob_olho', 'sobrancelha_t', 'pescoco', 'peitoral', 'costelas', ...BRACOS, ...PERNAS]);
export const regiaoTemLado = (r: RegiaoDeTatuagem) => REGIOES_LADO.has(r);

/** Os pelos do corpo (0 = quase nenhum … 3 = muitos): aparecem nos antebraços, nas canelas e no peito descoberto. */
export const PELOS23 = ['quase nenhum', 'poucos', 'médios', 'muitos'] as const;
export function sortearPelos23(chave: string, genero: string): number | undefined {
  const r = acaso23(`pelos23:${chave}`);
  const n = genero === 'masculino' ? pesado(r, [0, 1, 2, 3], [0.15, 0.35, 0.33, 0.17]) : pesado(r, [0, 1, 2, 3], [0.7, 0.26, 0.04, 0]);
  return n || undefined;
}
