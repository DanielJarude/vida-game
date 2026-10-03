/**
 * Cães e gatos por MORFOLOGIA, não por cor.
 *
 * Dois cachorros da mesma cor têm que parecer dois bichos diferentes: o
 * desenho sai de um corpo inteiro, de perfil, montado por traços — porte,
 * proporção do corpo, altura da perna, focinho, orelha, cauda e pelagem (no
 * gato: constituição, cabeça, orelha, cauda, pelo e postura). A cor e o
 * padrão (mancha, sela, máscara, listra) variam DENTRO da forma, nunca no
 * lugar dela. Tudo sai da identidade do bicho (o id, o porte e — se um dia
 * existir — a raça), por hash: o mesmo bicho é o mesmo desenho em qualquer
 * tela e depois de recarregar. Vira-lata é o padrão (traços misturados);
 * uma raça, quando houver, só fixa alguns traços.
 */
import type { ReactElement } from 'react';

export type Porte = 'pequeno' | 'medio' | 'grande';

/**
 * Gatos por TIPO (silhueta, não raça): o doméstico de pelo curto (a maioria),
 * o oriental (esguio, cabeça em cunha, orelhão), o persa (cara achatada, pelo
 * longo, orelha pequena), o peludo grande (robusto, tufos na orelha, cauda de
 * espanador) e o britânico (atarracado, cabeça redonda de bochecha). A
 * postura também muda o corpo: sentado, deitado (o "pão") ou em pé.
 */
export type TipoGato = 'domestico' | 'oriental' | 'persa' | 'peludo' | 'britanico';

export interface MorfoGato {
  tipo: TipoGato;
  corpo: 'esguio' | 'medio' | 'robusto';
  cabeca: 'redonda' | 'cunha' | 'achatada';
  orelhas: 'grandes' | 'medias' | 'pequenas' | 'dobradas' | 'tufos';
  cauda: 'longa' | 'peluda' | 'curta';
  /** Sentado com a cauda em volta, sentado com a cauda erguida, deitado ou em pé. */
  postura: 'em_volta' | 'erguida' | 'deitado' | 'em_pe';
  pelo: 'curto' | 'longo';
  cor: string;
  padrao: 'liso' | 'tigrado' | 'bicolor' | 'pontas' | 'manchas';
  olho: string;
  /** Três números em [-1, 1]: a pequena diferença de proporção entre dois bichos do mesmo tipo. */
  ajuste: [number, number, number];
}

const ESCURO = '#141110';
const ROSA = '#d99a94';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Um sorteio estável por traço: cada traço tem o seu sal (não andam juntos). */
const traco = <T,>(semente: string, sal: string, xs: readonly T[], pesos?: readonly number[]): T => {
  const h = hash(`${semente}#${sal}`);
  if (!pesos) return xs[h % xs.length];
  const tot = pesos.reduce((a, b) => a + b, 0);
  let x = (h % 10000) / 10000 * tot;
  for (let k = 0; k < xs.length; k++) { x -= pesos[k]; if (x < 0) return xs[k]; }
  return xs[xs.length - 1];
};
function misturar(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(k => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map(k => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((x, k) => Math.round(x + (pb[k] - x) * t).toString(16).padStart(2, '0')).join('');
}
function luminancia(h: string): number {
  const c = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** A pequena variação contínua de cada indivíduo (estável pela semente). */
const ajusteDe = (semente: string): [number, number, number] => { const h = hash(`${semente}#ajuste`); return [0, 8, 16].map(k => (((h >>> k) & 255) / 127.5) - 1) as [number, number, number]; };
const n = (x: number) => Math.round(x * 10) / 10;
const P = (...xs: (string | number)[]) => xs.map(x => (typeof x === 'number' ? n(x) : x)).join(' ');

function Olho({ x, y, r, aro }: { x: number; y: number; r: number; aro?: string }) {
  return <g>{aro && <circle cx={n(x)} cy={n(y)} r={n(r + 0.8)} fill={aro} />}<circle cx={n(x)} cy={n(y)} r={n(r)} fill={ESCURO} /><circle cx={n(x + r * 0.3)} cy={n(y - r * 0.35)} r={n(r * 0.32)} fill="#ffffff" /></g>;
}
const aroSe = (pelo: string) => (luminancia(pelo) < 0.06 ? misturar(pelo, '#ffffff', 0.45) : undefined);

/**
 * Franja de pelo comprido: uma faixa em dentes arredondados pendurada de
 * (x0,y) a (x1,y), com `alt` de comprimento (o pelo da barriga, do peito, da cauda).
 */
function franja(x0: number, x1: number, y: number, alt: number, dentes: number, inclina = 0): string {
  const passo = (x1 - x0) / dentes;
  let d = `M${P(x0, y - 2)}`;
  for (let k = 0; k < dentes; k++) {
    const a = x0 + passo * k, b = a + passo, m = (a + b) / 2;
    const yy = y + alt * (0.75 + 0.25 * ((k * 7) % 3) / 2) + inclina * k;
    d += `Q${P(m - passo * 0.1, yy + 1, b, y + alt * 0.35 + inclina * k)}`;
  }
  return d + `L${P(x1, y - 2)}Z`;
}

/* ------------------------------------------------------------------- Cão */

/**
 * FAMÍLIAS MORFOLÓGICAS. Um cachorro não é um sorteio de traços soltos (a
 * orelha de pastor num corpo de buldogue com perna de galgo não parece
 * cachorro nenhum): cada família amarra porte, corpo, cabeça, focinho,
 * orelha, cauda e pelo que andam juntos. São tipos de silhueta, não raças —
 * "retriever" é o cachorrão de cabeça larga e orelha caída, "pastor" o de
 * orelha em pé e dorso inclinado, "galgo" o de peito fundo e cintura fina.
 * O vira-lata (SRD) é o mais comum: mistura duas famílias, traço a traço.
 */
export type FamiliaCao = 'retriever' | 'pastor' | 'terrier' | 'galgo' | 'spitz' | 'braquicefalo' | 'molosso' | 'salsicha' | 'srd';

export interface MorfoCao {
  /** A família de silhueta (o vira-lata é 'srd': a mistura de duas). */
  familia: FamiliaCao;
  porte: Porte;
  corpo: 'compacto' | 'atletico' | 'comprido' | 'robusto';
  pernas: 'curtas' | 'medias' | 'longas';
  focinho: 'curto' | 'medio' | 'longo';
  orelhas: 'empe' | 'dobradas' | 'caidas' | 'longas' | 'rosa';
  cauda: 'enrolada' | 'reta' | 'peluda' | 'foice' | 'curta' | 'fina';
  pelo: 'curto' | 'longo' | 'duro' | 'denso';
  /** O crânio: larga (retriever, molosso), cunha (pastor, spitz), redonda (braquicefálico), quadrada (terrier), fina (galgo). */
  cabeca: 'larga' | 'cunha' | 'redonda' | 'quadrada' | 'fina';
  /** A linha das costas: reta, inclinada para a garupa (pastor) ou arqueada no lombo (galgo). */
  dorso: 'reto' | 'inclinado' | 'arqueado';
  cor: string;
  padrao: 'liso' | 'peito' | 'sela' | 'manchas' | 'mascara';
  coleira: string;
  /** Três números em [-1, 1]: a pequena diferença de proporção entre dois bichos do mesmo tipo. */
  ajuste: [number, number, number];
}

type TracosCao = Omit<MorfoCao, 'familia' | 'porte' | 'cor' | 'padrao' | 'coleira' | 'ajuste'>;
/** Cada traço de uma família: as formas que ela tem, com os pesos (a primeira é a típica). */
type Opcoes<T> = readonly (readonly [T, number])[];
interface Familia {
  portes: Partial<Record<Porte, number>>;
  tracos: { [K in keyof TracosCao]: Opcoes<TracosCao[K]> };
  cores: readonly string[];
  padroes: Opcoes<MorfoCao['padrao']>;
}

const FAMILIAS: Record<Exclude<FamiliaCao, 'srd'>, Familia> = {
  retriever: {
    portes: { grande: 4, medio: 1 },
    tracos: { corpo: [['robusto', 3], ['atletico', 2]], pernas: [['medias', 1]], focinho: [['medio', 3], ['longo', 1]], orelhas: [['caidas', 1]],
      cauda: [['reta', 1]], pelo: [['longo', 1], ['curto', 1]], cabeca: [['larga', 1]], dorso: [['reto', 1]] },
    cores: ['#d4a25a', '#e8d3a8', '#2b2622', '#5a3a24', '#c98a4a'], padroes: [['liso', 5], ['peito', 1]]
  },
  pastor: {
    portes: { grande: 4, medio: 2 },
    tracos: { corpo: [['atletico', 2], ['comprido', 1]], pernas: [['longas', 2], ['medias', 1]], focinho: [['longo', 1]], orelhas: [['empe', 1]],
      cauda: [['peluda', 1]], pelo: [['curto', 2], ['longo', 1]], cabeca: [['cunha', 1]], dorso: [['inclinado', 3], ['reto', 1]] },
    cores: ['#b07a3e', '#c9a46a', '#2b2622', '#8a5a32'], padroes: [['sela', 4], ['mascara', 2], ['liso', 1]]
  },
  terrier: {
    portes: { pequeno: 4, medio: 2 },
    tracos: { corpo: [['compacto', 1]], pernas: [['medias', 3], ['curtas', 1]], focinho: [['medio', 1]], orelhas: [['dobradas', 3], ['empe', 1]],
      cauda: [['curta', 2], ['foice', 1]], pelo: [['duro', 3], ['curto', 1]], cabeca: [['quadrada', 1]], dorso: [['reto', 1]] },
    cores: ['#efe6d8', '#c98a4a', '#6b6560', '#d9c3a0', '#2b2622'], padroes: [['sela', 2], ['liso', 2], ['manchas', 1], ['peito', 1]]
  },
  galgo: {
    portes: { grande: 3, medio: 2 },
    tracos: { corpo: [['atletico', 1]], pernas: [['longas', 1]], focinho: [['longo', 1]], orelhas: [['rosa', 1]],
      cauda: [['fina', 1]], pelo: [['curto', 1]], cabeca: [['fina', 1]], dorso: [['arqueado', 1]] },
    cores: ['#b8aa98', '#6b6560', '#efe6d8', '#c98a4a', '#2b2622'], padroes: [['liso', 3], ['peito', 2], ['manchas', 1]]
  },
  spitz: {
    portes: { pequeno: 3, medio: 2 },
    tracos: { corpo: [['compacto', 1]], pernas: [['medias', 2], ['curtas', 1]], focinho: [['medio', 2], ['curto', 1]], orelhas: [['empe', 1]],
      cauda: [['enrolada', 1]], pelo: [['denso', 1]], cabeca: [['cunha', 1]], dorso: [['reto', 1]] },
    cores: ['#efe6d8', '#e0a050', '#2b2622', '#c9b8a0', '#a8752f'], padroes: [['liso', 3], ['peito', 2]]
  },
  braquicefalo: {
    portes: { pequeno: 3, medio: 2 },
    tracos: { corpo: [['robusto', 2], ['compacto', 1]], pernas: [['curtas', 2], ['medias', 1]], focinho: [['curto', 1]], orelhas: [['rosa', 1], ['empe', 1]],
      cauda: [['curta', 1]], pelo: [['curto', 1]], cabeca: [['redonda', 1]], dorso: [['reto', 1]] },
    cores: ['#d9c3a0', '#2b2622', '#a8752f', '#efe6d8', '#6b6560'], padroes: [['mascara', 3], ['peito', 2], ['manchas', 1]]
  },
  molosso: {
    portes: { grande: 1 },
    tracos: { corpo: [['robusto', 1]], pernas: [['medias', 2], ['longas', 1]], focinho: [['medio', 2], ['curto', 1]], orelhas: [['dobradas', 2], ['caidas', 1]],
      cauda: [['reta', 2], ['curta', 1]], pelo: [['curto', 1]], cabeca: [['larga', 1]], dorso: [['reto', 1]] },
    cores: ['#2b2622', '#8a5a32', '#6b6560', '#c9a46a'], padroes: [['mascara', 2], ['peito', 2], ['liso', 1]]
  },
  salsicha: {
    portes: { pequeno: 1 },
    tracos: { corpo: [['comprido', 1]], pernas: [['curtas', 1]], focinho: [['longo', 1]], orelhas: [['longas', 1]],
      cauda: [['reta', 1]], pelo: [['curto', 3], ['longo', 1], ['duro', 1]], cabeca: [['cunha', 1]], dorso: [['reto', 1]] },
    cores: ['#8a4a28', '#2b2622', '#a8752f', '#5a3a24'], padroes: [['liso', 3], ['mascara', 1]]
  }
};
const NOMES_FAMILIAS = Object.keys(FAMILIAS) as Exclude<FamiliaCao, 'srd'>[];
/** O vira-lata pesa mais em todo porte: é o cachorro da maioria das casas. */
const PESO_SRD: Record<Porte, number> = { pequeno: 5, medio: 8, grande: 4 };
const CORES_SRD = ['#c98a4a', '#a8752f', '#2b2622', '#efe6d8', '#6b6560', '#4a3a2e', '#d9c3a0', '#8a5a32'];
const CORES_COLEIRA = ['#b8442e', '#3f6a8a', '#4f7a4a', '#c9a23a', '#6b4f7a'];

const opcao = <T,>(semente: string, sal: string, o: Opcoes<T>): T => traco(semente, sal, o.map(x => x[0]), o.map(x => x[1]));

/**
 * Os traços do cão, da identidade. A família sai do porte (o porte vem do
 * dado do bicho); dentro dela, cada traço tem as formas que a família tem. O
 * vira-lata herda cada traço de uma de duas famílias possíveis para o porte
 * — e por isso dois vira-latas caramelo não saem iguais.
 */
export function morfologiaCao(semente: string, porte?: Porte, raca?: Partial<MorfoCao>): MorfoCao {
  const pt: Porte = porte ?? raca?.porte ?? traco(semente, 'porte', ['pequeno', 'medio', 'grande'] as const, [3, 4, 3]);
  const possiveis = NOMES_FAMILIAS.filter(f => FAMILIAS[f].portes[pt]);
  const familia: FamiliaCao = raca?.familia ?? traco(semente, 'familia', [...possiveis, 'srd'] as FamiliaCao[], [...possiveis.map(f => FAMILIAS[f].portes[pt] ?? 0), PESO_SRD[pt]]);
  let tracos: TracosCao;
  let cor: string, padrao: MorfoCao['padrao'];
  if (familia === 'srd') {
    const a = FAMILIAS[traco(semente, 'pai', possiveis)], b = FAMILIAS[traco(semente, 'mae', possiveis)];
    const de = <K extends keyof TracosCao>(k: K): TracosCao[K] => opcao(semente, k, (traco(semente, `lado:${k}`, [a, b])).tracos[k]);
    tracos = { corpo: de('corpo'), pernas: de('pernas'), focinho: de('focinho'), cabeca: de('cabeca'), dorso: 'reto',
      // O vira-lata típico: orelha meio dobrada ou em pé, cauda em foice, pelo curto — o resto vem dos pais.
      orelhas: traco(semente, 'srd:orelha', [de('orelhas'), 'dobradas', 'empe'] as const, [2, 2, 1]),
      cauda: traco(semente, 'srd:cauda', [de('cauda'), 'foice'] as const, [2, 3]),
      pelo: traco(semente, 'srd:pelo', [de('pelo'), 'curto'] as const, [1, 3]) };
    if (tracos.pelo === 'denso' && tracos.cauda !== 'enrolada') tracos.pelo = 'longo';
    cor = traco(semente, 'cor', CORES_SRD);
    padrao = traco(semente, 'padrao', ['liso', 'peito', 'manchas', 'mascara', 'sela'] as const, [4, 4, 2, 1, 1]);
  } else {
    const f = FAMILIAS[familia];
    tracos = { corpo: opcao(semente, 'corpo', f.tracos.corpo), pernas: opcao(semente, 'pernas', f.tracos.pernas), focinho: opcao(semente, 'focinho', f.tracos.focinho),
      orelhas: opcao(semente, 'orelhas', f.tracos.orelhas), cauda: opcao(semente, 'cauda', f.tracos.cauda), pelo: opcao(semente, 'pelo', f.tracos.pelo),
      cabeca: opcao(semente, 'cabeca', f.tracos.cabeca), dorso: opcao(semente, 'dorso', f.tracos.dorso) };
    cor = traco(semente, 'cor', f.cores);
    padrao = opcao(semente, 'padrao', f.padroes);
  }
  return { familia, porte: pt, ...tracos, cor, padrao, coleira: traco(semente, 'coleira', CORES_COLEIRA), ajuste: ajusteDe(semente), ...raca };
}

const PERNA = { curtas: 8, medias: 16, longas: 23 };
const CORPO = { compacto: [31, 16, 2], atletico: [37, 17, 6], comprido: [48, 14, 1.5], robusto: [39, 20, 2] } as const;
const ESCALA_CAO = { pequeno: 0.76, medio: 0.86, grande: 1 };
const CRANIO = { larga: 1.12, cunha: 0.96, redonda: 1.14, quadrada: 1, fina: 0.84 };

/** O cão inteiro, de perfil (cabeça à direita), no chão em y = 90. */
export function FiguraCao({ m }: { m: MorfoCao }): ReactElement {
  const c = m.cor;
  const escuro = misturar(c, '#000000', 0.34), longe = misturar(c, '#000000', 0.2);
  const claro = luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.66);
  const marca = m.padrao === 'sela' || m.padrao === 'mascara' ? (luminancia(c) < 0.06 ? '#9a6a3a' : '#2b2622') : escuro;
  const G = 90;
  const [aj1, aj2, aj3] = m.ajuste ?? [0, 0, 0];
  const galgo = m.dorso === 'arqueado' || m.cabeca === 'fina';
  const braqui = m.cabeca === 'redonda' && m.focinho === 'curto';
  const pq = m.porte === 'pequeno';

  // Proporções: o corpo, a perna, o peito e a cintura.
  const L = PERNA[m.pernas] + (galgo ? 3 : 0) + 1.5 * aj2;
  const [B0, D0, tuck0] = CORPO[m.corpo];
  const B = B0 + 2.5 * aj1, D = D0 + (galgo ? 2 : 0) + 1 * aj3;
  const tuck = tuck0 + (galgo ? 5 : 0);
  const W = ({ robusto: 6.6, atletico: galgo ? 3.4 : 4.4, compacto: 5.2, comprido: 5.2 }[m.corpo]) * (m.pernas === 'curtas' ? 1.15 : 1);
  const R = 8.4 * (pq ? 1.3 : m.porte === 'medio' ? 1.12 : 1) * CRANIO[m.cabeca] * (1 + 0.04 * aj3);
  const M = ({ curto: braqui ? 1.6 : 3.2, medio: 7, longo: 11 }[m.focinho] + (galgo ? 3 : 0)) * (pq ? 0.85 : 1);
  const espBase = { larga: 0.95, redonda: 0.9, quadrada: 0.88, cunha: 0.68, fina: 0.48 }[m.cabeca] * R;
  const espPonta = espBase * (m.cabeca === 'cunha' || m.cabeca === 'fina' ? 0.55 : m.cabeca === 'quadrada' ? 0.95 : 0.82);

  // Corpo: cernelha, peito (a proa), barriga até a cintura, coxa, garupa e as costas.
  const cx = 44, x0 = cx - B / 2, x1 = cx + B / 2, yb = G - L, yt = yb - D;
  const queda = m.dorso === 'inclinado' ? 4.5 : 0.5;
  const arco = m.dorso === 'arqueado' ? 4 : 0;
  const yr = yt + queda;
  const corpo = `M${P(x1 - 4, yt)}C${P(x1 + 1, yt + 1, x1 + 4, yt + D * 0.35, x1 + 3.5, yt + D * 0.55)}C${P(x1 + 3, yt + D * 0.88, x1, yb + 0.5, x1 - 5, yb + 0.5)}C${P(x1 - 12, yb + 1, x0 + B * 0.4, yb - tuck * 0.5, x0 + 9, yb - tuck)}C${P(x0 + 3, yb - tuck - 1, x0 - 2, yr + (yb - yr) * 0.55, x0 - 1.5, yr + (yb - yr) * 0.3)}C${P(x0 - 1, yr + 2, x0 + 1, yr, x0 + 5, yr)}C${P(x0 + B * 0.35, yr - arco, x1 - B * 0.3, yt - arco * 0.5, x1 - 4, yt)}Z`;

  // Pescoço e cabeça.
  const pescocoAlto = galgo ? 14 : braqui ? 5 : m.pernas === 'longas' ? 11 : m.pernas === 'curtas' ? 7 : 9;
  const avanco = galgo || m.dorso === 'inclinado' ? 5 : braqui ? 1 : 3;
  const hx = x1 + avanco, hy = yt - pescocoAlto + (braqui ? 0 : 0);
  const grossura = braqui || m.corpo === 'robusto' ? 1.25 : galgo ? 0.75 : 1;
  const pescoco = `M${P(x1 - 9 - 2 * grossura, yt + 2)}C${P(x1 - 8, hy + R * 0.2, hx - R * 0.9, hy - R * 0.2, hx - R * 0.5 * grossura, hy - R * 0.6)}L${P(hx + R * 0.35, hy + R * 0.65)}C${P(x1 + 2, hy + R * 1.6, x1 + 4, yt + D * 0.2, x1 + 3, yt + D * 0.5)}Z`;
  const cranio = m.cabeca === 'quadrada'
    ? <rect x={n(hx - R)} y={n(hy - R * 0.85)} width={n(R * 2)} height={n(R * 1.7)} rx={n(R * 0.4)} fill={c} />
    : <ellipse cx={n(hx)} cy={n(hy)} rx={n(R * (m.cabeca === 'redonda' ? 1.08 : m.cabeca === 'fina' ? 0.95 : 1.02))} ry={n(R * (m.cabeca === 'redonda' ? 1.02 : m.cabeca === 'fina' ? 0.66 : m.cabeca === 'cunha' ? 0.8 : 0.92))} fill={c} />;

  // Focinho: do "stop" à trufa. O braquicefálico quase não tem; o galgo tem um bico longo e fino.
  const sx = hx + R * (braqui ? 0.85 : 0.55);
  const yTopo = hy - R * (m.cabeca === 'cunha' || m.cabeca === 'fina' ? 0.32 : braqui ? 0.05 : 0.18);
  const tx = sx + M, tTopo = yTopo + R * (m.cabeca === 'cunha' || m.cabeca === 'fina' ? 0.16 : 0.04);
  const focinho = `M${P(sx - 2.5, yTopo)}L${P(tx - 1.5, tTopo)}Q${P(tx + 1, tTopo, tx + 0.8, tTopo + espPonta * 0.5)}Q${P(tx + 0.5, tTopo + espPonta, tx - 2, tTopo + espPonta)}L${P(hx + R * 0.15, yTopo + espBase)}Z`;
  const beicos = (m.cabeca === 'larga' || braqui) && m.focinho !== 'longo';
  const corFocinho = m.padrao === 'mascara' ? marca : c;

  // Orelhas, no alto do crânio (as caídas pendem ao lado da cara).
  const ex = hx - R * (m.orelhas === 'caidas' || m.orelhas === 'longas' ? 0.15 : 0.3), ey = hy - R * (m.cabeca === 'fina' ? 0.4 : 0.6);
  const alta = m.orelhas === 'empe' ? (m.cabeca === 'cunha' && !pq ? 1.35 : braqui ? 0.75 : pq ? 0.85 : 1) : 1;
  const comp = m.pelo === 'longo' ? 1.2 : 1;
  const orelha = {
    empe: `M${P(ex - R * 0.42, ey + 2)}L${P(ex - R * 0.1, ey - R * 1.15 * alta)}L${P(ex + R * 0.5, ey + 1)}Z`,
    dobradas: `M${P(ex - R * 0.38, ey + 1.5)}L${P(ex - R * 0.08, ey - R * 0.72)}Q${P(ex + R * 0.45, ey - R * 0.8, ex + R * 0.78, ey - R * 0.05)}L${P(ex + R * 0.45, ey + 1)}Z`,
    caidas: `M${P(ex - R * 0.3, ey + 0.5)}C${P(ex + R * 0.2, ey - R * 0.35, ex + R * 0.6, ey - R * 0.1, ex + R * 0.5, ey + R * 0.4)}C${P(ex + R * 0.45, ey + R * 1.15 * comp, ex - R * 0.1, ey + R * 1.45 * comp, ex - R * 0.42, ey + R * 1.1 * comp)}C${P(ex - R * 0.62, ey + R * 0.7, ex - R * 0.55, ey + R * 0.2, ex - R * 0.3, ey + 0.5)}Z`,
    longas: `M${P(ex - R * 0.35, ey + 0.5)}C${P(ex + R * 0.2, ey - R * 0.35, ex + R * 0.6, ey - R * 0.1, ex + R * 0.5, ey + R * 0.5)}C${P(ex + R * 0.6, ey + R * 1.6 * comp, ex + R * 0.2, ey + R * 2.2 * comp, ex - R * 0.15, ey + R * 2.1 * comp)}C${P(ex - R * 0.65, ey + R * 1.9 * comp, ex - R * 0.7, ey + R * 0.6, ex - R * 0.35, ey + 0.5)}Z`,
    rosa: `M${P(ex + R * 0.1, ey + 1.5)}Q${P(ex - R * 0.35, ey - R * 0.75, ex - R * 1.05, ey - R * 0.2)}Q${P(ex - R * 0.6, ey + R * 0.25, ex - R * 0.05, ey + R * 0.6)}Z`
  }[m.orelhas];
  const corOrelha = m.padrao === 'mascara' || m.padrao === 'sela' ? marca : m.orelhas === 'empe' ? c : escuro;

  // Cauda, na garupa.
  const bx = x0 + 0.5, by = yr + 2.5;
  const cauda = {
    enrolada: { d: `M${P(bx + 1, by)}C${P(bx - 6, by - 6, bx - 1, yr - 14, bx + 7, yr - 11)}C${P(bx + 11, yr - 9, bx + 9, yr - 3, bx + 5, yr - 2.5)}`, w: m.pelo === 'denso' || m.pelo === 'longo' ? 8.5 : 4.2 },
    reta: { d: `M${P(bx, by)}C${P(bx - 6, by + 1, bx - 11, by + 4, bx - 14, by + 8)}`, w: m.corpo === 'robusto' ? 4.4 : 3.4 },
    peluda: { d: `M${P(bx, by)}C${P(bx - 6, by + 3, bx - 10, by + 11, bx - 9, by + 18)}`, w: 7 },
    foice: { d: `M${P(bx, by)}C${P(bx - 4, by - 3, bx - 7, by - 11, bx - 3, by - 16)}`, w: 3.4 },
    curta: { d: braqui ? `M${P(bx + 1, by - 1)}c-2.5 -1.5 -2.5 -4.5 0 -4.5` : `M${P(bx, by)}L${P(bx - 2.5, by - 7)}`, w: braqui ? 3.4 : 4.2 },
    fina: { d: `M${P(bx, by)}C${P(bx - 3, by + 9, bx - 6, by + 19, bx - 12, by + 17)}`, w: 2.2 }
  }[m.cauda];
  const franjaCauda = (m.pelo === 'longo' || m.pelo === 'denso') && (m.cauda === 'reta' || m.cauda === 'peluda' || m.cauda === 'foice' || m.cauda === 'enrolada');

  // Pernas: as da frente são colunas; a de trás tem coxa, joelho e jarrete.
  const fx = x1 - 6, rx = x0 + 7;
  const frente = (x: number) => `M${P(x - W * 0.75, yt + D * 0.55)}L${P(x - W * 0.5, G - 2)}Q${P(x - W * 0.5, G, x + W * 0.2, G)}L${P(x + W * 1.05, G)}Q${P(x + W * 1.15, G - 2.2, x + W * 0.5, G - 2.6)}L${P(x + W * 0.7, yt + D * 0.55)}Z`;
  const joelho = { x: rx + 2.5, y: yb + L * 0.12 }, jarrete = { x: rx - 3, y: G - L * 0.38 };
  const tras = (dx: number) => `M${P(joelho.x + dx, joelho.y)}L${P(jarrete.x + dx, jarrete.y)}L${P(jarrete.x + dx + 0.6, G - 2)}`;
  const coxa = (dx: number, cor: string) => <ellipse cx={n(rx + dx)} cy={n(yr + (yb - yr) * 0.58)} rx={n(W * 1.25 + B * 0.05)} ry={n((yb - yr) * 0.5)} fill={cor} />;
  const pataTras = (dx: number, cor: string) => <ellipse cx={n(jarrete.x + dx + 1.8)} cy={G - 1.3} rx={n(W * 0.65)} ry={1.5} fill={cor} />;

  // O todo cabe no quadro (o porte encolhe a partir do chão).
  const xsCauda = { enrolada: bx - 4, reta: bx - 16, peluda: bx - 13, foice: bx - 8, curta: bx - 4, fina: bx - 14 }[m.cauda];
  const minX = Math.min(xsCauda, x0 - 3, m.orelhas === 'rosa' ? ex - R * 1.1 : x0), maxX = tx + 1.5;
  const topo = Math.min(ey - R * 1.15 * alta - 1, hy - R - 1, m.cauda === 'enrolada' ? yr - 16 : m.cauda === 'foice' ? by - 18 : G);
  const k = Math.min(ESCALA_CAO[m.porte], 92 / (maxX - minX), 84 / (G - topo));
  const dx = 50 - (minX + maxX) / 2;
  const meia = m.padrao === 'peito' && m.pelo !== 'longo';
  const longo = m.pelo === 'longo', denso = m.pelo === 'denso', duro = m.pelo === 'duro';

  return (
    <g data-morfo={`cao:${m.porte}/${m.familia}/${m.corpo}/${m.pernas}/${m.focinho}/${m.orelhas}/${m.cauda}/${m.pelo}/${m.cabeca}`}>
      <ellipse cx="50" cy={G + 0.5} rx={n(Math.min(44, (maxX - minX) * k * 0.45))} ry="3" fill="#000000" opacity="0.08" />
      <g transform={`translate(50 ${G}) scale(${n(k * 100) / 100}) translate(${n(dx - 50)} ${-G})`}>
        {/* do lado de lá */}
        <path d={frente(fx - 5)} fill={longe} />
        {coxa(4, longe)}
        <path d={tras(4)} stroke={longe} strokeWidth={n(W * 0.85)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {pataTras(4, longe)}
        {m.cauda !== 'enrolada' && <path d={cauda.d} stroke={c} strokeWidth={n(cauda.w)} strokeLinecap="round" fill="none" />}
        {franjaCauda && m.cauda !== 'enrolada' && <path d={cauda.d} stroke={c} strokeWidth={n(cauda.w + 4)} strokeLinecap="round" fill="none" opacity="0.55" />}
        {/* juba do spitz, atrás da cabeça */}
        {denso && <ellipse cx={n(hx - R * 0.55)} cy={n(hy + R * 0.75)} rx={n(R * 1.35)} ry={n(R * 1.45)} fill={m.padrao === 'peito' ? claro : c} />}
        {/* corpo */}
        <path d={pescoco} fill={c} />
        <path d={corpo} fill={c} />
        {m.padrao === 'sela' && <path d={`M${P(x0 + 3, yr + 0.5)}C${P(x0 + B * 0.4, yr - 1 - arco, x1 - 12, yt - 0.5, x1 - 6, yt + 0.5)}C${P(x1 - 8, yt + D * 0.62, x0 + 10, yr + D * 0.7, x0 + 1, yr + D * 0.42)}Z`} fill={marca} />}
        {m.padrao === 'manchas' && <><ellipse cx={n(cx - B * 0.15)} cy={n(yt + D * 0.4)} rx={n(B * 0.12)} ry={n(D * 0.25)} fill={escuro} /><ellipse cx={n(cx + B * 0.2)} cy={n(yt + D * 0.3)} rx={n(B * 0.07)} ry={n(D * 0.18)} fill={escuro} /></>}
        {m.padrao === 'peito' && <path d={`M${P(x1 - 2, yt + D * 0.2)}C${P(x1 + 4, yt + D * 0.4, x1 + 1, yb, x1 - 4, yb + 0.5)}C${P(x1 - 8, yb, x1 - 6, yt + D * 0.4, x1 - 2, yt + D * 0.2)}Z`} fill={claro} />}
        {(longo || denso) && <>
          <path d={franja(x0 + 6, x1 - 1, yb - tuck * 0.5, 4 + D * 0.18, 7, -tuck * 0.06)} fill={c} />
          <path d={franja(x1 - 6, x1 + 3, yt + D * 0.72, 5.5, 2)} fill={m.padrao === 'peito' ? claro : c} />
        </>}
        {denso && <path d={franja(x0 - 2, x0 + 8, yb - 2, 5, 3)} fill={c} />}
        {duro && <path d={Array.from({ length: 12 }, (_, i) => { const x = x0 + 4 + i * (B - 9) / 11; return `M${P(x, yr + (yt - yr) * (i / 11) + 0.6)}l${i % 2 ? '-0.6 -1.7' : '-1 -1.2'}`; }).join('')} stroke={c} strokeWidth="1.6" strokeLinecap="round" />}
        {/* pernas de cá */}
        <path d={frente(fx)} fill={c} />
        {meia && <path d={`M${P(fx - W * 0.6, G - L * 0.3)}L${P(fx - W * 0.5, G - 2)}Q${P(fx - W * 0.5, G, fx + W * 0.2, G)}L${P(fx + W * 1.05, G)}Q${P(fx + W * 1.15, G - 2.2, fx + W * 0.5, G - 2.6)}L${P(fx + W * 0.6, G - L * 0.3)}Z`} fill={claro} />}
        {coxa(0, c)}
        <path d={tras(0)} stroke={c} strokeWidth={n(W * 0.9)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {pataTras(0, m.padrao === 'peito' ? claro : c)}
        {longo && m.pernas !== 'curtas' && <path d={franja(fx - W * 0.6, fx + W * 0.2, yb - 1, L * 0.4, 2)} fill={c} opacity="0.9" />}
        {m.cauda === 'enrolada' && <path d={cauda.d} stroke={denso || longo ? (m.padrao === 'peito' ? claro : c) : c} strokeWidth={n(cauda.w)} strokeLinecap="round" fill="none" />}
        {/* cabeça */}
        {(m.orelhas === 'rosa') && <path d={orelha} fill={corOrelha} />}
        {cranio}
        <path d={focinho} fill={corFocinho} />
        {m.padrao === 'peito' && <path d={`M${P(tx - 1.5, tTopo + espPonta - 0.3)}Q${P((tx + hx) / 2, tTopo + espPonta + 1.8, hx + R * 0.2, yTopo + espBase - 0.6)}L${P(hx + R * 0.35, yTopo + espBase - 2.4)}Z`} fill={claro} />}
        {beicos && <path d={`M${P(tx - 1, tTopo + espPonta - 0.5)}Q${P(tx - 1.5, tTopo + espPonta + 3.2, tx - 5, tTopo + espPonta + 2.4)}L${P(tx - 6, tTopo + espPonta - 0.5)}Z`} fill={corFocinho} />}
        {m.padrao === 'mascara' && <ellipse cx={n(hx + R * 0.4)} cy={n(hy - R * 0.05)} rx={n(R * 0.55)} ry={n(R * 0.5)} fill={marca} />}
        {braqui && <path d={`M${P(sx - 1, yTopo + 1)}q2 -1.4 3.4 0.4M${P(sx - 0.5, yTopo + 3)}q2 -1.2 3 0.6`} stroke={escuro} strokeWidth="0.8" fill="none" strokeLinecap="round" />}
        <ellipse cx={n(tx - 0.3)} cy={n(tTopo + 1.3)} rx={n(m.focinho === 'curto' ? 2.6 : 2.1)} ry={1.8} fill={ESCURO} />
        <path d={`M${P(tx - 1, tTopo + espPonta - 0.8)}Q${P((tx + hx) / 2, tTopo + espPonta + 0.2, hx + R * 0.3, yTopo + espBase - 1.5)}`} stroke={ESCURO} strokeWidth="0.9" fill="none" opacity="0.65" />
        {duro && <><path d={`M${P(tx - M * 0.7 - 2, tTopo + espPonta - 1)}Q${P(tx - 1, tTopo + espPonta + 5, tx + 0.8, tTopo + espPonta - 0.8)}Z`} fill={c} /><path d={`M${P(hx + R * 0.1, hy - R * 0.55)}l${P(R * 0.45, -0.6)}`} stroke={escuro} strokeWidth="1.7" strokeLinecap="round" /></>}
        <Olho x={hx + R * (braqui ? 0.45 : 0.32)} y={hy - R * 0.24} r={R * (braqui ? 0.25 : 0.2)} aro={aroSe(c)} />
        {m.orelhas !== 'rosa' && <path d={orelha} fill={corOrelha} />}
        {m.orelhas === 'empe' && <path d={`M${P(ex - R * 0.14, ey + 0.5)}L${P(ex - R * 0.05, ey - R * 0.8 * alta)}L${P(ex + R * 0.3, ey + 0.2)}Z`} fill={ROSA} opacity="0.45" />}
        {longo && (m.orelhas === 'longas' || m.orelhas === 'caidas') && <path d={franja(ex - R * 0.5, ex + R * 0.45, ey + R * (m.orelhas === 'longas' ? 1.95 : 1.25), 3, 3)} fill={corOrelha} />}
        {/* coleira */}
        <path d={`M${P(hx - R * 0.95, hy + R * 0.55)}Q${P(hx - R * 0.3, hy + R * 1.45, x1 + 1, hy + R * 1.1)}`} stroke={m.coleira} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ Gato */

type TracosGato = Pick<MorfoGato, 'corpo' | 'cabeca' | 'orelhas' | 'cauda' | 'pelo'>;
const TIPOS_GATO: Record<TipoGato, { peso: number; tracos: { [K in keyof TracosGato]: Opcoes<TracosGato[K]> }; cores: readonly string[]; padroes: Opcoes<MorfoGato['padrao']>; olhos: readonly string[] }> = {
  domestico: { peso: 10, tracos: { corpo: [['medio', 4], ['esguio', 2], ['robusto', 2]], cabeca: [['redonda', 3], ['cunha', 1]], orelhas: [['medias', 4], ['grandes', 1]], cauda: [['longa', 6], ['curta', 0.5]], pelo: [['curto', 1]] },
    cores: ['#2b2622', '#7d7670', '#c98a43', '#efe6d8', '#8a7a66', '#5a4a3e'], padroes: [['tigrado', 5], ['bicolor', 4], ['liso', 3], ['manchas', 2]], olhos: ['#c9b23a', '#7fa04a', '#d08a2a'] },
  oriental: { peso: 2, tracos: { corpo: [['esguio', 1]], cabeca: [['cunha', 1]], orelhas: [['grandes', 1]], cauda: [['longa', 1]], pelo: [['curto', 1]] },
    cores: ['#efe6d8', '#d9cbb4', '#2b2622', '#7d7670'], padroes: [['pontas', 4], ['liso', 2]], olhos: ['#6a9ac9', '#7fa04a'] },
  persa: { peso: 1.5, tracos: { corpo: [['robusto', 2], ['medio', 1]], cabeca: [['achatada', 1]], orelhas: [['pequenas', 1]], cauda: [['peluda', 1]], pelo: [['longo', 1]] },
    cores: ['#efe6d8', '#b8aa98', '#7d7670', '#c98a43', '#2b2622'], padroes: [['liso', 4], ['bicolor', 2], ['pontas', 1]], olhos: ['#d08a2a', '#6a9ac9'] },
  peludo: { peso: 1.5, tracos: { corpo: [['robusto', 1]], cabeca: [['cunha', 1], ['redonda', 1]], orelhas: [['tufos', 1]], cauda: [['peluda', 1]], pelo: [['longo', 1]] },
    cores: ['#8a7a66', '#5a4a3e', '#7d7670', '#c98a43'], padroes: [['tigrado', 4], ['bicolor', 2], ['liso', 1]], olhos: ['#c9b23a', '#7fa04a'] },
  britanico: { peso: 1.5, tracos: { corpo: [['robusto', 1]], cabeca: [['redonda', 1]], orelhas: [['pequenas', 3], ['dobradas', 2]], cauda: [['longa', 2], ['curta', 1]], pelo: [['curto', 1]] },
    cores: ['#7d8590', '#6b6560', '#b8aa98', '#efe6d8'], padroes: [['liso', 5], ['bicolor', 1]], olhos: ['#d08a2a', '#c9b23a'] }
};
const NOMES_TIPOS_GATO = Object.keys(TIPOS_GATO) as TipoGato[];

/** Os traços do gato, da identidade: o tipo (o doméstico é o mais comum), as formas do tipo e a postura do retrato. */
export function morfologiaGato(semente: string, raca?: Partial<MorfoGato>): MorfoGato {
  const tipo: TipoGato = raca?.tipo ?? traco(semente, 'tipo', NOMES_TIPOS_GATO, NOMES_TIPOS_GATO.map(t => TIPOS_GATO[t].peso));
  const t = TIPOS_GATO[tipo];
  const m: MorfoGato = {
    tipo,
    corpo: opcao(semente, 'corpo', t.tracos.corpo), cabeca: opcao(semente, 'cabeca', t.tracos.cabeca), orelhas: opcao(semente, 'orelhas', t.tracos.orelhas),
    cauda: opcao(semente, 'cauda', t.tracos.cauda), pelo: opcao(semente, 'pelo', t.tracos.pelo),
    postura: traco(semente, 'postura', ['em_volta', 'erguida', 'deitado', 'em_pe'] as const, [3, 2, 2.5, 2.5]),
    cor: traco(semente, 'cor', t.cores), padrao: opcao(semente, 'padrao', t.padroes), olho: traco(semente, 'olho', t.olhos),
    ajuste: ajusteDe(semente)
  };
  return { ...m, ...raca };
}

/** O gato inteiro, de perfil (cabeça à direita): a postura escolhe o corpo; a cabeça é a mesma. */
export function FiguraGato({ m }: { m: MorfoGato }): ReactElement {
  const corpo = m.postura === 'deitado' ? <GatoDeitado m={m} /> : m.postura === 'em_pe' ? <GatoEmPe m={m} /> : <GatoSentado m={m} />;
  return <g data-morfo={`gato:${m.tipo}/${m.corpo}/${m.cabeca}/${m.orelhas}/${m.cauda}/${m.postura}/${m.pelo}`}>{corpo}</g>;
}

/** As cores de um gato (a ponta escura do siamês, o claro do bicolor, o escuro das listras). */
function coresGato(m: MorfoGato) {
  const c = m.cor;
  return {
    c, escuro: misturar(c, '#000000', 0.38), longe: misturar(c, '#000000', 0.18),
    claro: luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.62),
    ponta: m.padrao === 'pontas' ? misturar(c, '#2a1d14', 0.75) : c
  };
}
const RAIO_CABECA_GATO = { esguio: 8.8, medio: 10, robusto: 11.2 };

/** Deitado de bruços, "em pão": o corpo é um domo baixo, as patas da frente aparecem, a cauda contorna o chão. */
function GatoDeitado({ m }: { m: MorfoGato }): ReactElement {
  const { c, escuro, longe, claro, ponta } = coresGato(m);
  const G = 88;
  const [aj1, , aj3] = m.ajuste ?? [0, 0, 0];
  const w = { esguio: 0.86, medio: 1, robusto: 1.15 }[m.corpo] * (1 + 0.04 * aj1);
  const longo = m.pelo === 'longo';
  const comp = 44 * (m.corpo === 'esguio' ? 1.1 : 1) * (longo ? 1.05 : 1), alt = 27 * w + (longo ? 3 : 0);
  const x0 = 22, x1 = x0 + comp;
  const R = RAIO_CABECA_GATO[m.corpo] * (m.cabeca === 'achatada' ? 1.1 : 1) * (1 + 0.05 * aj3);
  const hx = x1 + 2, hy = G - alt * 0.85 - R * 0.35;
  const domo = `M${P(x0, G - 1)}C${P(x0 - 4, G - alt * 0.9, x0 + comp * 0.25, G - alt - 2, x0 + comp * 0.55, G - alt)}C${P(x1 - 4, G - alt + 1, x1 + 4, G - alt * 0.5, x1 + 2, G - 1)}Z`;
  const cauda = m.cauda === 'curta' ? `M${P(x0 + 1, G - 6)}l-3 -1` : `M${P(x0 + 2, G - 3)}C${P(x0 - 8, G - 1, x0 - 6, G + 1, x0 + 6, G - 0.5)}C${P(x0 + 16, G - 1, x0 + 26, G - 1, x0 + 32, G - 3)}`;
  const largCauda = m.cauda === 'curta' ? 6 : m.cauda === 'peluda' ? (longo ? 9 : 7.5) : 4;
  const listras = m.padrao === 'tigrado' ? [0.2, 0.36, 0.52, 0.68].map(f => `M${P(x0 + comp * f, G - alt * (f < 0.3 ? 0.78 : 0.98))}l${P(-1.5, alt * 0.45)}`).join('') : '';
  return (
    <g>
      <ellipse cx={n((x0 + x1) / 2 + 4)} cy={G + 0.5} rx={n(comp * 0.62)} ry="3" fill="#000000" opacity="0.08" />
      <path d={domo} fill={c} />
      {longo && <path d={franja(x0 + 2, x1, G - 3, 3, 8)} fill={c} />}
      {m.padrao === 'bicolor' && <path d={`M${P(x1 - comp * 0.3, G - 1)}C${P(x1 - comp * 0.25, G - alt * 0.5, x1, G - alt * 0.55, x1 + 2, G - alt * 0.3)}L${P(x1 + 2, G - 1)}Z`} fill={claro} />}
      {m.padrao === 'manchas' && <ellipse cx={n(x0 + comp * 0.35)} cy={n(G - alt * 0.7)} rx={n(comp * 0.13)} ry={n(alt * 0.25)} fill={escuro} />}
      {listras && <path d={listras} stroke={escuro} strokeWidth="2" strokeLinecap="round" fill="none" />}
      <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />
      {m.padrao === 'tigrado' && m.cauda !== 'curta' && <path d={cauda} stroke={escuro} strokeWidth={n(largCauda)} strokeDasharray="1.6 4" fill="none" />}
      {/* as patas da frente, esticadas sob o peito */}
      <ellipse cx={n(x1 + 5)} cy={G - 2} rx={n(6 * w)} ry="2.6" fill={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : longe} />
      <ellipse cx={n(x1 + 8)} cy={G - 1.8} rx={n(6 * w)} ry="2.6" fill={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c} />
      <CabecaGato m={m} hx={hx} hy={hy} R={R} />
    </g>
  );
}

/** Em pé, de perfil, andando: costas retas, pernas finas, a cauda em ponto de interrogação. */
function GatoEmPe({ m }: { m: MorfoGato }): ReactElement {
  const { c, escuro, longe, claro, ponta } = coresGato(m);
  const G = 90;
  const [aj1, aj2, aj3] = m.ajuste ?? [0, 0, 0];
  const w = { esguio: 0.85, medio: 1, robusto: 1.18 }[m.corpo] * (1 + 0.04 * aj1);
  const longo = m.pelo === 'longo';
  const perna = (m.corpo === 'esguio' ? 21 : m.corpo === 'robusto' ? 15 : 18) + 1.5 * aj2;
  const comp = m.corpo === 'esguio' ? 40 : m.corpo === 'robusto' ? 36 : 38;
  const alt = 15 * w + (longo ? 2 : 0);
  const x0 = 22, x1 = x0 + comp, yb = G - perna, yt = yb - alt;
  const R = RAIO_CABECA_GATO[m.corpo] * 0.92 * (m.cabeca === 'achatada' ? 1.1 : 1) * (1 + 0.05 * aj3);
  const hx = x1 + 6, hy = yt - R * 0.45;
  const corpo = `M${P(x1 - 2, yt + 1)}C${P(x1 + 5, yt + 2, x1 + 6, yb - 2, x1 - 2, yb)}C${P(x1 - comp * 0.4, yb + 2, x0 + comp * 0.3, yb + (longo ? 3 : 1), x0 + 3, yb - 1)}C${P(x0 - 4, yb - 3, x0 - 4, yt + 1, x0 + 3, yt)}C${P(x0 + comp * 0.4, yt - 3, x1 - comp * 0.3, yt - 1, x1 - 2, yt + 1)}Z`;
  const pescoco = `M${P(x1 - 7, yt + 3)}C${P(x1 - 4, yt - 4, hx - R * 0.6, hy - R * 0.3, hx - R * 0.2, hy)}L${P(hx + R * 0.3, hy + R * 0.7)}C${P(x1 + 4, yt + 4, x1 + 4, yt + alt * 0.5, x1 + 1, yt + alt * 0.6)}Z`;
  const pernaD = (x: number, dx: number) => `M${P(x, yb - 4)}L${P(x + dx, G - 1.5)}`;
  const largPerna = 4.2 * w;
  const cauda = m.cauda === 'curta' ? `M${P(x0 + 1, yt + 3)}l-2.5 -3` : `M${P(x0 + 1, yt + 3)}C${P(x0 - 6, yt - 2, x0 - 6, yt - 16, x0 - 1, yt - 22)}C${P(x0 + 2, yt - 26, x0 + 6, yt - 23, x0 + 4, yt - 19)}`;
  const largCauda = m.cauda === 'curta' ? 6 : m.cauda === 'peluda' ? (longo ? 9 : 7.5) : 4 * (m.corpo === 'esguio' ? 0.8 : 1);
  const patas = m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c;
  const listras = m.padrao === 'tigrado' ? [0.25, 0.42, 0.59, 0.76].map(f => `M${P(x0 + comp * f, yt + 0.5)}l${P(-1, alt * 0.55)}`).join('') : '';
  return (
    <g>
      <ellipse cx="50" cy={G + 0.5} rx={n(comp * 0.7)} ry="3" fill="#000000" opacity="0.08" />
      {/* do lado de lá */}
      <path d={pernaD(x1 - 9, 1.5)} stroke={m.padrao === 'pontas' ? ponta : longe} strokeWidth={n(largPerna)} strokeLinecap="round" />
      <path d={pernaD(x0 + 9, -1)} stroke={m.padrao === 'pontas' ? ponta : longe} strokeWidth={n(largPerna)} strokeLinecap="round" />
      <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />
      {m.padrao === 'tigrado' && m.cauda !== 'curta' && <path d={cauda} stroke={escuro} strokeWidth={n(largCauda)} strokeDasharray="1.6 4" fill="none" />}
      <path d={pescoco} fill={c} />
      <path d={corpo} fill={c} />
      {longo && <path d={franja(x0 + 2, x1 - 2, yb - 1, 4, 7)} fill={c} />}
      {m.padrao === 'bicolor' && <path d={`M${P(x1 + 2, yt + alt * 0.4)}C${P(x1 + 3, yb, x1 - 6, yb + 1, x1 - comp * 0.6, yb)}L${P(x1 - comp * 0.6, yb - alt * 0.3)}C${P(x1 - 8, yb - alt * 0.4, x1 - 2, yt + alt * 0.4, x1 + 2, yt + alt * 0.4)}Z`} fill={claro} />}
      {m.padrao === 'manchas' && <><ellipse cx={n(x0 + comp * 0.35)} cy={n(yt + alt * 0.4)} rx={n(comp * 0.13)} ry={n(alt * 0.3)} fill={escuro} /><ellipse cx={n(x0 + comp * 0.7)} cy={n(yt + alt * 0.3)} rx={3} ry={2.5} fill={escuro} /></>}
      {listras && <path d={listras} stroke={escuro} strokeWidth="2" strokeLinecap="round" fill="none" />}
      {/* coxa e as pernas de cá */}
      <ellipse cx={n(x0 + 6)} cy={n(yt + alt * 0.6)} rx={n(8 * w)} ry={n(alt * 0.55)} fill={c} />
      <path d={`M${P(x0 + 7, yb - 2)}L${P(x0 + 2, G - perna * 0.4)}L${P(x0 + 4, G - 1.5)}`} stroke={patas} strokeWidth={n(largPerna)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={pernaD(x1 - 5, 0.5)} stroke={patas} strokeWidth={n(largPerna)} strokeLinecap="round" />
      <CabecaGato m={m} hx={hx} hy={hy} R={R} />
    </g>
  );
}

/** A cabeça do gato (a mesma em toda postura): crânio, orelhas, focinho, olho, bigode e a juba do pelo longo. */
function CabecaGato({ m, hx, hy, R }: { m: MorfoGato; hx: number; hy: number; R: number }): ReactElement {
  const c = m.cor;
  const escuro = misturar(c, '#000000', 0.38);
  const claro = luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.62);
  const ponta = m.padrao === 'pontas' ? misturar(c, '#2a1d14', 0.75) : c;
  const longo = m.pelo === 'longo';
  const cabeca = {
    redonda: <ellipse cx={n(hx)} cy={n(hy)} rx={n(R * 1.05)} ry={n(R)} fill={c} />,
    cunha: <path d={`M${P(hx - R * 0.95, hy + R * 0.2)}C${P(hx - R, hy - R * 1.1, hx + R * 0.2, hy - R * 1.05, hx + R * 0.7, hy - R * 0.45)}L${P(hx + R * 1.55, hy + R * 0.35)}Q${P(hx + R * 1.6, hy + R * 0.75, hx + R * 1.1, hy + R * 0.8)}C${P(hx + R * 0.2, hy + R * 1.1, hx - R * 0.8, hy + R, hx - R * 0.95, hy + R * 0.2)}Z`} fill={c} />,
    achatada: <path d={`M${P(hx - R * 1.05, hy)}C${P(hx - R * 1.05, hy - R * 1.1, hx + R * 0.7, hy - R * 1.15, hx + R * 0.95, hy - R * 0.35)}C${P(hx + R * 1.05, hy, hx + R * 1.05, hy + R * 0.4, hx + R * 0.85, hy + R * 0.75)}C${P(hx + R * 0.2, hy + R * 1.2, hx - R * 1.05, hy + R * 1.05, hx - R * 1.05, hy)}Z`} fill={c} />
  }[m.cabeca];
  // O focinho: pequeno bico na frente (nada na cara achatada, um pouco mais na cunha).
  const nx = hx + R * (m.cabeca === 'cunha' ? 1.5 : m.cabeca === 'achatada' ? 1.02 : 1.08), ny = hy + R * (m.cabeca === 'achatada' ? 0.12 : 0.3);
  const ex = hx - R * 0.2, ey = hy - R * 0.62;
  const tamOrelha = { grandes: 1.35, medias: 1, pequenas: 0.65, dobradas: 0.5, tufos: 1.25 }[m.orelhas] * (m.cabeca === 'cunha' ? 1.12 : 1);
  const orelha = m.orelhas === 'dobradas'
    ? `M${P(ex - R * 0.35, ey + 1.5)}Q${P(ex, ey - R * 0.55, ex + R * 0.55, ey - R * 0.15)}L${P(ex + R * 0.3, ey + 1.6)}Z`
    : `M${P(ex - R * 0.45, ey + 2)}L${P(ex - R * 0.1 * tamOrelha, ey - R * 0.95 * tamOrelha)}L${P(ex + R * 0.5, ey + 1.2)}Z`;
  return (
      <g>
        {/* juba do pelo longo */}
        {longo && <g fill={m.padrao === 'bicolor' ? claro : c}>
          <path d={`M${P(hx - R * 1.1, hy + R * 0.2)}L${P(hx - R * 0.95, hy + R * 1.35)}L${P(hx - R * 0.6, hy + R * 1.2)}L${P(hx - R * 0.35, hy + R * 1.75)}L${P(hx - R * 0.05, hy + R * 1.35)}L${P(hx + R * 0.25, hy + R * 1.7)}L${P(hx + R * 0.45, hy + R * 1.2)}L${P(hx + R * 0.8, hy + R * 1.3)}L${P(hx + R * 0.75, hy + R * 0.6)}Z`} strokeLinejoin="round" stroke={m.padrao === 'bicolor' ? claro : c} strokeWidth="1.6" />
        </g>}
        {/* cabeça */}
        <path d={orelha} fill={m.padrao === 'pontas' ? ponta : m.orelhas === 'dobradas' ? escuro : c} />
        {m.orelhas !== 'dobradas' && <path d={`M${P(ex - R * 0.2, ey + 1)}L${P(ex - R * 0.08 * tamOrelha, ey - R * 0.6 * tamOrelha)}L${P(ex + R * 0.25, ey + 0.8)}Z`} fill={ROSA} opacity="0.6" />}
        {m.orelhas === 'tufos' && <path d={`M${P(ex - R * 0.1 * tamOrelha, ey - R * 0.9 * tamOrelha)}l-0.6 -3.6`} stroke={escuro} strokeWidth="1.2" strokeLinecap="round" />}
        {cabeca}
        {m.orelhas === 'dobradas' && <path d={orelha} fill={m.padrao === 'pontas' ? ponta : escuro} />}
        {longo && <path d={`M${P(hx - R * 0.9, hy + R * 0.2)}Q${P(hx - R * 1.3, hy + R * 0.9, hx - R * 0.5, hy + R * 1.05)}L${P(hx + R * 0.2, hy + R * 0.9)}Z`} fill={c} />}
        {m.padrao === 'pontas' && <ellipse cx={n(nx - R * 0.35)} cy={n(ny)} rx={n(R * 0.55)} ry={n(R * 0.5)} fill={ponta} />}
        {m.padrao === 'bicolor' && <ellipse cx={n(nx - R * 0.3)} cy={n(ny + R * 0.3)} rx={n(R * 0.5)} ry={n(R * 0.35)} fill={claro} />}
        {m.padrao === 'tigrado' && <path d={`M${P(hx - R * 0.1, hy + R * 0.05)}l4 1`} stroke={escuro} strokeWidth="1.4" strokeLinecap="round" />}
        <path d={`M${P(nx, ny - 1.2)}l0.8 1.4l-1.6 0.4Z`} fill="#d07a7a" />
        <path d={`M${P(nx - R * 0.55, hy - R * 0.08)}q${P(R * 0.22, -R * 0.24, R * 0.48, 0)}q${P(-R * 0.24, R * 0.2, -R * 0.48, 0)}Z`} fill={m.olho} />
        <ellipse cx={n(nx - R * 0.27)} cy={n(hy - R * 0.08)} rx="0.7" ry={n(R * 0.13)} fill={ESCURO} />
        <path d={`M${P(nx - 1.5, ny + 1)}l${P(9, -2)}M${P(nx - 1.5, ny + 1.8)}l${P(9, 1.4)}`} stroke={luminancia(c) < 0.1 ? '#e8e0d4' : ESCURO} strokeWidth="0.5" opacity="0.6" />
      </g>
  );
}

/** Sentado de perfil (cabeça à direita), no chão em y = 91. */
function GatoSentado({ m }: { m: MorfoGato }): ReactElement {
  const c = m.cor;
  const escuro = misturar(c, '#000000', 0.38), longe = misturar(c, '#000000', 0.18);
  const claro = luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.62);
  const ponta = m.padrao === 'pontas' ? misturar(c, '#2a1d14', 0.75) : c;
  const G = 91;
  const [aj1, aj2, aj3] = m.ajuste ?? [0, 0, 0];
  const w = { esguio: 0.84, medio: 1, robusto: 1.18 }[m.corpo] * (1 + 0.04 * aj1);
  const longo = m.pelo === 'longo';
  // Anca (sentada, atrás e embaixo), costas subindo até o ombro, peito em pé, as patas da frente retas.
  const ax = 40, ay = G - 12 * w;
  const alto = { esguio: 44, medio: 38, robusto: 33 }[m.corpo] + 2 * aj2;
  const sx = 58 + (m.corpo === 'robusto' ? 1 : 0), sy = G - alto;
  const R = { esguio: 8.8, medio: 10, robusto: 11.2 }[m.corpo] * (m.cabeca === 'achatada' ? 1.1 : 1) * (1 + 0.05 * aj3);
  const hx = sx + 3 + (m.corpo === 'esguio' ? 2 : 0), hy = sy - R * (m.cabeca === 'achatada' ? 0.55 : 0.75) - (m.corpo === 'esguio' ? 3 : 0);
  const corpo = `M${P(ax - 11 * w, ay - 6 * w)}C${P(ax - 8 * w, ay - 18 * w, sx - 14, sy + 2, sx - 5, sy - 1)}C${P(sx + 1, sy - 3, sx + 4.5 * w, sy + 2, sx + 5 * w, sy + 10)}C${P(sx + 5.5 * w, sy + 16, sx + 5 * w, G - 22, sx + 2 * w, G - 17)}C${P(sx - 4, G - 13, ax + 10 * w, G - 8, ax + 6 * w, G - 4)}Z`;
  // Cauda: enrolada no chão até as patas, ou erguida atrás em gancho.
  const tb = { x: ax - 11 * w, y: G - 4 };
  const cauda = m.cauda === 'curta'
    ? `M${P(tb.x + 1, tb.y - 5)}l-3 -1.5`
    : m.postura === 'em_volta'
      ? `M${P(tb.x + 2, tb.y)}C${P(tb.x - 8, tb.y + 2, tb.x - 2, G + 1, ax + 4, G - 1)}C${P(sx - 6, G - 1.5, sx - 2, G - 3, sx + 1, G - 5)}`
      : `M${P(tb.x + 2, tb.y - 2)}C${P(tb.x - 9, tb.y - 6, tb.x - 10, tb.y - 22, tb.x - 6, tb.y - 34)}C${P(tb.x - 4, tb.y - 39, tb.x + 1, tb.y - 38, tb.x + 1, tb.y - 34)}`;
  const largCauda = m.cauda === 'curta' ? 6 : m.cauda === 'peluda' ? (longo ? 9.5 : 8) : 4 * (m.corpo === 'esguio' ? 0.8 : 1);
  const pataX = sx + 1.6 * w;
  const listra = (x: number, y: number, a: number, inc = 0) => `M${P(x, y)}l${P(inc, a)}`;
  const listras = m.padrao === 'tigrado'
    ? [listra(ax - 10 * w, ay - 8, 7, -1), listra(ax - 4 * w, ay - 11, 7, -1.5), listra(ax + 2, ay - 12, 6, -1.6), listra(sx - 7, sy + 4, 6, -1), listra(hx - R * 0.3, hy - R * 0.85, 4, 0.4), listra(hx + R * 0.05, hy - R * 0.9, 3.6, 0.5)].join('')
    : '';
  const dx = m.postura === 'erguida' ? 4 : 0;

  return (
    <g>
      <ellipse cx="50" cy={G + 0.5} rx="30" ry="3" fill="#000000" opacity="0.08" />
      <g transform={`translate(${dx} 0)`}>
        {m.postura === 'erguida' && <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />}
        {/* a pata de lá */}
        <path d={`M${P(pataX - 3.4, sy + 14)}L${P(pataX - 3.2, G - 1.5)}`} stroke={m.padrao === 'pontas' ? ponta : longe} strokeWidth={n(4.4 * w)} strokeLinecap="round" />
        <path d={corpo} fill={c} />
        
        {m.padrao === 'bicolor' && <path d={`M${P(sx - 2, sy + 4)}C${P(sx + 7 * w, sy + 4, sx + 7, G - 8, sx + 4, G)}L${P(sx - 6, G)}C${P(sx - 5, G - 10, sx - 8, sy + 12, sx - 2, sy + 4)}Z`} fill={claro} />}
        {m.padrao === 'manchas' && <><ellipse cx={n(ax - 6)} cy={n(ay - 4)} rx={n(6 * w)} ry={n(5 * w)} fill={escuro} /><ellipse cx={n(sx - 6)} cy={n(sy + 8)} rx={3} ry={2.6} fill={escuro} /></>}
        {listras && <path d={listras} stroke={escuro} strokeWidth="2" strokeLinecap="round" fill="none" />}
        {/* anca e pata traseira */}
        <ellipse cx={n(ax - 1)} cy={n(ay)} rx={n(13 * w + (longo ? 2 : 0))} ry={n(12 * w + (longo ? 1.5 : 0))} fill={c} />
        {m.padrao === 'tigrado' && <path d={`${listra(ax - 9, ay - 6, 6, 2)}${listra(ax - 3, ay - 8, 6, 2)}`} stroke={escuro} strokeWidth="2" strokeLinecap="round" />}
        <ellipse cx={n(ax + 6 * w)} cy={G - 1.8} rx={n(7 * w)} ry="2.4" fill={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c} />
        {/* a pata de cá */}
        <path d={`M${P(pataX, sy + 14)}L${P(pataX + 0.4, G - 1.5)}`} stroke={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c} strokeWidth={n(4.8 * w)} strokeLinecap="round" />
        {m.postura === 'em_volta' && <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />}
                {m.padrao === 'tigrado' && m.cauda !== 'curta' && m.postura === 'em_volta' && <path d={cauda} stroke={escuro} strokeWidth={n(largCauda)} strokeDasharray="1.6 4" fill="none" />}
        <CabecaGato m={m} hx={hx} hy={hy} R={R} />
      </g>
    </g>
  );
}
