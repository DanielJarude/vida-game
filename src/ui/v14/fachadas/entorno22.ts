/**
 * VIDA 22 — O LUGAR EM VOLTA DA CASA e o que a casa ganhou do lado de fora.
 *
 * ENTORNO     a moradia deixa de ser um lote solto no vazio: os vizinhos aparecem nas divisas (atrás, mais claros — a
 *             atenção fica na casa), e a rua tem o que uma rua daquele lugar tem. Varia pelo bairro do endereço
 *             (`moradia.bairro`, as palavras do mercado), pelo porte da cidade (`municipio.perfil`) e pelo tipo da
 *             moradia:
 *               periferia   casas de laje coladas, de bloco, poste de concreto com a fiação, quase nenhuma árvore;
 *               bairro      casas e sobrados de telha, árvore na calçada, poste, um carro parado na rua;
 *               centro      prédios dos dois lados, poste, carros parados (a cidade grande);
 *               nobre       casas grandes afastadas, calçada larga arborizada, poste de jardim;
 *               condomínio  casas grandes com gramado, sem muro alto, rua sem carro parado, árvores;
 *               pequena     casas térreas espaçadas, árvore grande, o morro ao fundo;
 *               rural       nada de vizinho: pasto, cerca e mata.
 *             Nenhum vizinho fica na frente da casa — eles moram ao lado e atrás.
 *
 * ANEXOS      o que a casa tem do lado de fora, lido dos cômodos dela (`sistemas/lar.comodosDe`: os que vieram com a
 *             planta e os que a pessoa construiu) e das coisas que ela comprou para a área externa: a garagem, a
 *             piscina com deck, a área de lazer com churrasqueira e pergolado, a quadra com alambrado, a varanda; e,
 *             no quintal, a churrasqueira avulsa, o gazebo, a fonte, o playground, a cama elástica, as
 *             espreguiçadeiras, o guarda-sol. Nada inventado: sem o cômodo ou a coisa, não aparece.
 */
import { clarear, escurecer, num, ret, type Peca } from '../../ilustracao/nucleo';
import { COR, arvore, bloco, quatroAguas, frontal, grupo, janela, marcado, noChao, planoDoChao, platibanda, pt, sombraDoBloco, type Bloco, type Vista } from './kit';

export type TipoDeEntorno = 'periferia' | 'bairro' | 'centro' | 'nobre' | 'condominio' | 'pequena' | 'rural';

/** O entorno de um endereço: o bairro (as palavras do mercado), o porte da cidade e a forma da moradia. */
export function tipoDeEntorno(o: { bairro?: string; perfil?: string; forma: string; padrao: number }): TipoDeEntorno {
  const b = o.bairro ?? '';
  if (o.forma === 'sitio' || /zona rural|fora da mancha/.test(b)) return 'rural';
  if (/condom[ií]nio/.test(b)) return 'condominio';
  if (/nobre|parte alta/.test(b) || o.forma === 'mansao') return o.forma === 'mansao' && !/nobre|parte alta/.test(b) ? 'condominio' : 'nobre';
  if (/periferia|sa[ií]da da cidade|loteamento/.test(b) || (o.padrao <= 1 && o.perfil !== 'pequena')) return 'periferia';
  if (o.perfil === 'pequena') return 'pequena';
  if (/centro|metr[ôo]/.test(b) || ['apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'cobertura', 'kitnet'].includes(o.forma)) return o.perfil === 'metropole' || o.perfil === 'capital' || o.perfil === 'metropolitana' ? 'centro' : 'bairro';
  return 'bairro';
}

/** Um número estável (0..1) para variar os vizinhos sem sorteio. */
function h01(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

const PAREDES = ['#e6dccb', '#d9c8a8', '#cfd8d6', '#e8d2c4', '#d6dccb', '#efe6d6', '#c9c1b4'];
/** O vizinho fica atrás (mais claro e menos contrastado): a casa é o assunto. */
const longe = (c: string) => clarear(c, 0.3);

function casaVizinha(v: Vista, x0: number, l: number, z0: number, tipo: 'laje' | 'telha' | 'sobrado' | 'grande', semente: number): Peca[] {
  const cor = longe(PAREDES[Math.floor(semente * PAREDES.length)]);
  const andares = tipo === 'sobrado' || tipo === 'grande' ? 2 : 1;
  const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + (tipo === 'grande' ? 9 : 7), h1: 2.9 * andares };
  const out: Peca[] = [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor, soclo: 0.3, corSoclo: longe('#8f877a'), textura: tipo === 'laje' && semente > 0.5 ? 'blocos' : undefined })];
  if (tipo === 'laje') out.push(...platibanda(v, b, 0.3, cor));
  else out.push(...quatroAguas(v, b, tipo === 'grande' ? 1.6 : 1.2, { cor: longe(semente > 0.6 ? COR.telhaEscura : COR.telha) }));
  for (let a = 0; a < andares; a++) for (let k = 0; k < Math.max(1, Math.floor(l / 3)); k++) out.push(janela(v, b.z0, x0 + 0.7 + k * 3, a * 2.9 + 0.95, 1.1, 1.1, { acesa: false }));
  return [marcado('cena__vizinho', { 'data-entorno': 'casa' }, out)];
}
function predioVizinho(v: Vista, x0: number, l: number, z0: number, andares: number, semente: number): Peca[] {
  const cor = longe(['#cfc9be', '#bfc6c9', '#d8cfc0', '#a9b2b8'][Math.floor(semente * 4)]);
  const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 10, h1: andares * 2.9 };
  const out: Peca[] = [sombraDoBloco(v, b, b.h1, 0.1), ...bloco(v, b, { cor, corTopo: escurecer(cor, 0.06) })];
  const cols = Math.max(2, Math.floor(l / 2.6));
  for (let a = 0; a < andares; a++) out.push(grupo(frontal(v, x0, z0, a * 2.9 + 2.2), [{ tipo: 'massa', d: Array.from({ length: cols }, (_, k) => ret(0.6 + k * (l - 1.2) / cols, 0, (l - 1.2) / cols - 0.7, 1.2, 0.05)).join(''), cor: longe('#7f9cad'), semVolume: true, marca: 'janelas-vizinho' }]));
  return [marcado('cena__vizinho', { 'data-entorno': 'predio' }, out)];
}
/** O poste: de concreto com a fiação (periferia, bairro), de ferro (centro), de jardim (nobre, condomínio). */
function poste(v: Vista, x: number, tipo: TipoDeEntorno): Peca {
  const z = -0.35, jardim = tipo === 'nobre' || tipo === 'condominio';
  const alt = jardim ? 3.4 : 7.5;
  const [a0, a1] = [pt(v, x, z, 0), pt(v, x, z, alt)];
  const braco = pt(v, x + (jardim ? 0 : 1.2), z, alt - 0.1);
  return marcado('cena__poste', { 'data-entorno': 'poste' }, [
    { tipo: 'linha', d: `M${num(a0[0])} ${num(a0[1])}L${num(a1[0])} ${num(a1[1])}${jardim ? '' : `L${num(braco[0])} ${num(braco[1])}`}`, larg: jardim ? 0.9 : 1.3, cor: jardim ? '#3a3633' : tipo === 'centro' ? '#4a4d50' : '#9a948a' },
    { tipo: 'massa', d: ret(braco[0] - v.S * 0.25, braco[1] - v.S * 0.1, v.S * 0.5, v.S * 0.22, 0.4), cor: '#f2e3b0', semVolume: true, marca: 'luminaria' }
  ]);
}
/** A fiação (periferia e bairro): dois fios atravessando o quadro, presos nos postes. */
function fiacao(v: Vista, xs: number[]): Peca {
  const ps = xs.map(x => pt(v, x, -0.35, 7.3));
  return { tipo: 'linha', d: ps.slice(1).map((p, k) => `M${num(ps[k][0])} ${num(ps[k][1])}Q${num((ps[k][0] + p[0]) / 2)} ${num(p[1] + v.S * 0.4)} ${num(p[0])} ${num(p[1])}`).join(''), larg: 0.4, cor: '#4a4643', marca: 'fiacao' };
}

export interface Entorno { fundo: Peca[]; rua: Peca[] }

/**
 * Os vizinhos (nas divisas, de x < 0 e x > largura, atrás da linha da casa) e a rua (postes, árvores de calçada). `m` é a
 * margem visível de cada lado (em metros). `semente` varia as casas vizinhas entre endereços (sempre a mesma para o mesmo).
 */
export function entornoDaCasa(v: Vista, largura: number, m: number, tipo: TipoDeEntorno, semente: string): Entorno {
  const fundo: Peca[] = [], rua: Peca[] = [];
  const s = (k: string) => h01(`${semente}|${k}`);
  const lados: [number, number][] = [[-m - 0.4, -0.4], [largura + 0.4, largura + m + 0.4]];
  if (tipo === 'rural') {
    for (const [a, b] of lados) {
      fundo.push(marcado('cena__vizinho', { 'data-entorno': 'pasto' }, [noChao(v, a, b, 0, 14, '#a9c47a', 'pasto-vizinho'), arvore(v, (a + b) / 2, 7 + s(`r${a}`) * 3, { alt: 5.5, copa: '#5f8f4e' })]));
    }
    return { fundo, rua };
  }
  for (const [k, [a, b]] of lados.entries()) {
    const l = b - a;
    if (tipo === 'centro') fundo.push(...predioVizinho(v, a + 0.2, l - 0.4, 4.2, 5 + Math.floor(s(`p${k}`) * 6), s(`c${k}`)));
    else if (tipo === 'periferia') { fundo.push(...casaVizinha(v, a + 0.1, l * 0.55, 4.4, 'laje', s(`a${k}`)), ...casaVizinha(v, a + l * 0.58, l * 0.4, 4, s(`b${k}`) > 0.5 ? 'laje' : 'telha', s(`d${k}`))); }
    else if (tipo === 'nobre' || tipo === 'condominio') fundo.push(...casaVizinha(v, k === 0 ? b - Math.min(l, 9) : a + 1.5, Math.min(l - 1.5, 9), 7, 'grande', s(`g${k}`)), arvore(v, k === 0 ? a + 0.8 : b - 0.8, 2.6, { alt: 6, copa: '#4f7f42' }));
    else if (tipo === 'pequena') fundo.push(...casaVizinha(v, k === 0 ? b - Math.min(l, 7.5) - 0.8 : a + 0.8, Math.min(l - 0.8, 7.5), 5, 'telha', s(`t${k}`)));
    else fundo.push(...casaVizinha(v, k === 0 ? b - Math.min(l, 8) - 0.2 : a + 0.2, Math.min(l - 0.2, 8), 4.6, s(`s${k}`) > 0.45 ? 'sobrado' : 'telha', s(`e${k}`)));
  }
  // A rua: os postes (com fiação onde ela é aérea), as árvores da calçada, a grama da calçada nos bairros caros.
  // Nas divisas (nunca na frente da fachada).
  const xsPoste = [-m * 0.55, largura + m * 0.55];
  if (tipo === 'nobre' || tipo === 'condominio') rua.push(noChao(v, -m - 1, largura + m + 1, -1.5, -0.8, COR.grama, 'grama-calcada'));
  for (const x of xsPoste) rua.push(poste(v, x, tipo));
  if (tipo === 'periferia' || tipo === 'bairro' || tipo === 'pequena') rua.push(fiacao(v, [-m - 2, ...xsPoste, largura + m + 2]));
  const arvores = tipo === 'periferia' ? [] : tipo === 'centro' ? [largura + m * 0.4] : tipo === 'pequena' ? [-m * 0.3] : [-m * 0.25, largura + m * 0.6];
  for (const x of arvores) rua.push(marcado('cena__arvore-calcada', { 'data-entorno': 'arvore-calcada' }, [arvore(v, x, -1.05, { alt: tipo === 'nobre' || tipo === 'condominio' ? 6 : 5, copa: tipo === 'pequena' ? '#5f8f4e' : '#4f7f42' })]));
  return { fundo, rua };
}

/* ============================================================== Os anexos da casa */

/** As larguras (m) que cada anexo ocupa no lote, ao lado da casa. */
export const LARGURA_DO_ANEXO: Record<string, number> = { garagem: 3.8, piscina: 7.2, lazer: 6, quadra: 11 };

/** O que vai no quintal: as coisas da área externa que a pessoa tem (o id da coisa → o desenho). */
export const COISAS_DO_QUINTAL = ['churrasqueira', 'espaco_gourmet', 'forno_pizza', 'pergolado', 'gazebo', 'fonte', 'escultura_jardim', 'playground', 'cama_elastica', 'ombrelone', 'guarda_sol', 'espreguicadeira', 'espreguicadeira_teca', 'mesa_externa', 'sofa_externo'] as const;

/** A garagem anexa (o volume coberto com o portão de enrolar e a rampa até a rua). */
function garagem(v: Vista, x0: number, z0: number, cor: string): Peca[] {
  const g: Bloco = { x0, x1: x0 + 3.4, z0, z1: z0 + 5.5, h1: 2.6 };
  return [marcado(undefined, { 'data-detalhe': 'garagem', 'data-anexo': 'garagem' }, [
    sombraDoBloco(v, g), ...bloco(v, g, { cor: escurecer(cor, 0.04), soclo: 0.3, corSoclo: '#8f877a' }), ...platibanda(v, g, 0.3, escurecer(cor, 0.04)),
    grupo(frontal(v, g.x0 + 0.3, g.z0, g.h1 - 0.3), [{ tipo: 'massa', d: ret(0, 0, 2.8, g.h1 - 0.3, 0.02), cor: '#8d8a85', marca: 'portao-garagem' }, { tipo: 'linha', d: Array.from({ length: 18 }, (_, k) => `M0.03 ${num(0.12 + k * 0.12)}H2.77`).join(''), larg: 0.45, cor: '#6a6662', fino: true }]),
    noChao(v, g.x0 + 0.2, g.x1 - 0.2, 0.18, g.z0, '#aaa398', 'rampa')
  ])];
}
/** A piscina: o deck, a borda e a água, com a escada. */
function piscina(v: Vista, x0: number, z0: number, espreguicadeiras: boolean): Peca[] {
  const out: Peca[] = [noChao(v, x0, x0 + 6.8, z0, z0 + 4.2, '#e3ddd0', 'deck', 0, true), noChao(v, x0 + 0.5, x0 + 6.3, z0 + 0.5, z0 + 3.7, COR.agua, 'agua', 0.02),
    planoDoChao(v, x0 + 0.5, z0 + 0.5, [{ tipo: 'linha', d: 'M0.6 1.1h1.6M2.6 2.2h2M1.2 2.9h1.2', larg: 0.6, cor: '#bfe6f0', marca: 'reflexo' }], 0.03)];
  if (espreguicadeiras) for (const dx of [0.6, 2.2]) out.push(...bloco(v, { x0: x0 + dx, x1: x0 + dx + 1.2, z0: z0 - 0.05, z1: z0 + 0.45, h1: 0.35 }, { cor: '#f2efe8' }));
  return [marcado(undefined, { 'data-detalhe': 'piscina', 'data-anexo': 'piscina' }, out)];
}
/** A área de lazer: o piso, o pergolado (ou a cobertura), a churrasqueira de alvenaria com a chaminé, a mesa comprida. */
function areaDeLazer(v: Vista, x0: number, z0: number): Peca[] {
  const piso: Bloco = { x0, x1: x0 + 5.6, z0, z1: z0 + 4.2, h1: 0.12 };
  const ch: Bloco = { x0: x0 + 4, x1: x0 + 5.3, z0: z0 + 2.8, z1: z0 + 3.8, h1: 1.1 };
  const pil = [[x0 + 0.2, z0 + 0.2], [x0 + 5.2, z0 + 0.2]] as const;
  return [marcado(undefined, { 'data-detalhe': 'area-de-lazer', 'data-anexo': 'lazer' }, [
    ...bloco(v, piso, { cor: '#cbb89a' }),
    ...bloco(v, ch, { cor: '#b06a4c', textura: 'tijolo' }), ...bloco(v, { x0: ch.x0 + 0.35, x1: ch.x0 + 0.95, z0: ch.z0 + 0.3, z1: ch.z0 + 0.8, h0: 1.1, h1: 2.9 }, { cor: '#9a5a40' }),
    ...bloco(v, { x0: x0 + 1, x1: x0 + 3.4, z0: z0 + 1.4, z1: z0 + 2.3, h0: 0.7, h1: 0.8 }, { cor: COR.madeira }),
    ...pil.flatMap(([x, z]) => bloco(v, { x0: x, x1: x + 0.18, z0: z, z1: z + 0.18, h1: 2.6 }, { cor: COR.madeira })),
    { tipo: 'linha', d: Array.from({ length: 8 }, (_, k) => { const a = pt(v, x0 + 0.1 + k * 0.75, z0 + 0.2, 2.65), b = pt(v, x0 + 0.1 + k * 0.75, z0 + 4, 2.65); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}`; }).join('') + (() => { const a = pt(v, x0, z0 + 0.25, 2.65), b = pt(v, x0 + 5.6, z0 + 0.25, 2.65); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}`; })(), larg: 1, cor: COR.madeira, marca: 'pergolado' }
  ])];
}
/** A quadra: o piso, as linhas, o alambrado (no fundo e dos lados). */
function quadra(v: Vista, x0: number, z0: number): Peca[] {
  const l = 10.4, d = 6;
  const cerca = (xa: number, za: number, xb: number, zb: number) => { const a0 = pt(v, xa, za, 0), b0 = pt(v, xb, zb, 0), a1 = pt(v, xa, za, 3), b1 = pt(v, xb, zb, 3); return `M${num(a0[0])} ${num(a0[1])}L${num(a1[0])} ${num(a1[1])}L${num(b1[0])} ${num(b1[1])}L${num(b0[0])} ${num(b0[1])}`; };
  return [marcado(undefined, { 'data-detalhe': 'quadra', 'data-anexo': 'quadra' }, [
    noChao(v, x0, x0 + l, z0, z0 + d, '#3f7f6a', 'quadra'),
    planoDoChao(v, x0, z0, [{ tipo: 'linha', d: `M0.4 0.4H${l - 0.4}V${d - 0.4}H0.4ZM${l / 2} 0.4V${d - 0.4}M0.4 ${d / 2}H${l - 0.4}`, larg: 0.8, cor: '#f2efe8', marca: 'linhas' }], 0.01),
    { tipo: 'linha', d: cerca(x0, z0 + d, x0 + l, z0 + d) + cerca(x0 + l, z0, x0 + l, z0 + d), larg: 0.5, cor: '#6d7578', marca: 'alambrado' },
    { tipo: 'massa', d: (() => { const a = pt(v, x0, z0 + d, 0), b = pt(v, x0 + l, z0 + d, 0), c = pt(v, x0 + l, z0 + d, 3), e = pt(v, x0, z0 + d, 3); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}L${num(c[0])} ${num(c[1])}L${num(e[0])} ${num(e[1])}Z`; })(), cor: '#6d7578', opacidade: 0.12, semVolume: true, semContorno: true }
  ])];
}

/** Uma coisa do quintal, desenhada no ponto (x, z) do lote. */
export function coisaDoQuintal(v: Vista, id: string, x: number, z: number): Peca[] {
  const m = (pecas: Peca[]) => [marcado(undefined, { 'data-detalhe': 'quintal', 'data-coisa': id }, pecas)];
  switch (id) {
    case 'churrasqueira': case 'espaco_gourmet': case 'forno_pizza':
      return m([...bloco(v, { x0: x, x1: x + 1.3, z0: z, z1: z + 0.9, h1: 1.1 }, { cor: id === 'forno_pizza' ? '#c08a5a' : '#b06a4c', textura: 'tijolo' }), ...bloco(v, { x0: x + 0.4, x1: x + 0.9, z0: z + 0.2, z1: z + 0.6, h0: 1.1, h1: 2.4 }, { cor: '#9a5a40' })]);
    case 'gazebo': case 'pergolado': {
      const cs: [number, number][] = [[x, z], [x + 2.6, z], [x, z + 2.4], [x + 2.6, z + 2.4]];
      return m([...cs.flatMap(([a, b]) => bloco(v, { x0: a, x1: a + 0.14, z0: b, z1: b + 0.14, h1: 2.4 }, { cor: id === 'gazebo' ? '#efeae0' : COR.madeira })), id === 'gazebo' ? { tipo: 'massa', d: (() => { const a = pt(v, x - 0.3, z, 2.4), b = pt(v, x + 2.9, z, 2.4), t = pt(v, x + 1.3, z + 1.2, 3.6), c = pt(v, x + 2.9, z + 2.6, 2.4); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}L${num(c[0])} ${num(c[1])}L${num(t[0])} ${num(t[1])}Z`; })(), cor: COR.telhaEscura, marca: 'telhado' } : { tipo: 'linha', d: Array.from({ length: 5 }, (_, k) => { const a = pt(v, x + k * 0.65, z, 2.45), b = pt(v, x + k * 0.65, z + 2.5, 2.45); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}`; }).join(''), larg: 0.9, cor: COR.madeira }]);
    }
    case 'fonte': case 'escultura_jardim':
      return m(id === 'fonte' ? [noChao(v, x, x + 1.6, z, z + 1.4, '#cfc8bb', 'borda', 0, true), noChao(v, x + 0.2, x + 1.4, z + 0.2, z + 1.2, COR.agua, 'agua', 0.15), ...bloco(v, { x0: x + 0.65, x1: x + 0.95, z0: z + 0.55, z1: z + 0.85, h1: 1.1 }, { cor: '#d9d2c4' })] : [...bloco(v, { x0: x, x1: x + 0.6, z0: z, z1: z + 0.6, h1: 0.6 }, { cor: '#d9d2c4' }), { tipo: 'massa', d: (() => { const [a, b] = pt(v, x + 0.3, z + 0.3, 0.6); return `M${num(a - v.S * 0.25)} ${num(b)}Q${num(a - v.S * 0.5)} ${num(b - v.S * 1)} ${num(a)} ${num(b - v.S * 1.4)}Q${num(a + v.S * 0.4)} ${num(b - v.S * 0.6)} ${num(a + v.S * 0.25)} ${num(b)}Z`; })(), cor: '#8a8f92', marca: 'escultura' }]);
    case 'playground':
      return m([{ tipo: 'linha', d: (() => { const a = pt(v, x, z, 0), b = pt(v, x + 0.6, z, 2.2), c = pt(v, x + 2.4, z, 2.2), d = pt(v, x + 3, z, 0), s1 = pt(v, x + 1.1, z, 0.5), s2 = pt(v, x + 1.9, z, 0.5); return `M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}L${num(c[0])} ${num(c[1])}L${num(d[0])} ${num(d[1])}M${num(s1[0])} ${num(b[1])}V${num(s1[1])}M${num(s2[0])} ${num(c[1])}V${num(s2[1])}`; })(), larg: 1, cor: '#c84b31', marca: 'balanco' }, ...bloco(v, { x0: x + 1, x1: x + 2, z0: z - 0.05, z1: z + 0.15, h0: 0.45, h1: 0.55 }, { cor: '#3d5d8f' })]);
    case 'cama_elastica':
      return m([noChao(v, x, x + 2.6, z, z + 2.6, '#2f2f33', 'lona', 0.7), { tipo: 'linha', d: [[x, z], [x + 2.6, z], [x, z + 2.6], [x + 2.6, z + 2.6]].map(([a, b]) => { const p0 = pt(v, a, b, 0), p1 = pt(v, a, b, 0.7); return `M${num(p0[0])} ${num(p0[1])}L${num(p1[0])} ${num(p1[1])}`; }).join(''), larg: 0.8, cor: '#3d5d8f' }]);
    case 'ombrelone': case 'guarda_sol': {
      const [a, b] = pt(v, x, z, 0), [, t] = pt(v, x, z, 2.3);
      return m([{ tipo: 'linha', d: `M${num(a)} ${num(b)}V${num(t)}`, larg: 0.7, cor: '#6b6560' }, { tipo: 'massa', d: `M${num(a - v.S * 1.2)} ${num(t + v.S * 0.4)}Q${num(a)} ${num(t - v.S * 0.7)} ${num(a + v.S * 1.2)} ${num(t + v.S * 0.4)}Z`, cor: id === 'ombrelone' ? '#e8e2d4' : '#c84b31', marca: 'guarda-sol' }]);
    }
    case 'espreguicadeira': case 'espreguicadeira_teca':
      return m([...bloco(v, { x0: x, x1: x + 1.2, z0: z, z1: z + 0.5, h1: 0.35 }, { cor: id === 'espreguicadeira_teca' ? '#9a6a40' : '#f2efe8' })]);
    default:
      return m([...bloco(v, { x0: x, x1: x + 1.4, z0: z, z1: z + 0.8, h1: 0.45 }, { cor: id === 'sofa_externo' ? '#d9d2c4' : COR.madeira })]);
  }
}

/** Os anexos na faixa do lote ao lado da casa (x de `x0` em diante), do fundo para a frente. Devolve o que vai no corpo da cena. */
export function anexosDaCasa(v: Vista, x0: number, zCasa: number, anexos: string[], cor: string, coisas: string[]): Peca[] {
  const out: Peca[] = [];
  let x = x0 + 0.3;
  for (const a of anexos) {
    if (a === 'garagem') out.push(...garagem(v, x, zCasa, cor));
    else if (a === 'piscina') out.push(...piscina(v, x, zCasa + 0.4, coisas.some(c => c.startsWith('espreguicadeira'))));
    else if (a === 'lazer') out.push(...areaDeLazer(v, x, zCasa + 0.6));
    else if (a === 'quadra') out.push(...quadra(v, x, zCasa + 0.2));
    x += LARGURA_DO_ANEXO[a] ?? 0;
  }
  return out;
}
