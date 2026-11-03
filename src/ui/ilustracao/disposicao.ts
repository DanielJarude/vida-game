/**
 * VIDA 12.8 — A DISPOSIÇÃO DO CÔMODO: onde cada objeto fica, em metros, e como isso vira tela.
 *
 * Antes, a cena punha os objetos em duas fileiras (os grandes no fundo, o resto na frente), na escala de um quadro fixo:
 * a barraca e a chuteira saíam quase do mesmo tamanho, o ar-condicionado ficava no chão, as espreguiçadeiras em fila ao
 * lado das boias. Agora:
 *
 *   O CÔMODO TEM TAMANHO   a área (m²) dá a largura e a profundidade; a parede tem 2,70 m. O lavabo é estreito (as
 *                          paredes laterais aparecem grandes); a sala da mansão é larga (tudo fica menor, mais longe).
 *   CADA COISA TEM MEDIDA  `medidas.ts`: a largura, a profundidade e a altura de verdade, e como fica — no chão, na
 *                          parede (a que altura), em cima de um tampo, deitada no piso, dentro da água.
 *   CADA UMA NO SEU LUGAR  as âncoras primeiro (a cama, o sofá, a mesa de bilhar), no meio da parede do fundo; depois o
 *                          que vai junto delas (a mesa de cabeceira dos dois lados da cama, a mesa de centro na frente do
 *                          sofá, a cadeira encaixada na escrivaninha); depois o resto, pelas zonas de cada um (encostado,
 *                          num canto, junto da parede lateral, no meio). Nada se sobrepõe no chão; na parede, nada se
 *                          sobrepõe nem fica atrás de um armário alto; o pequeno vai para um tampo (e, sem tampo, para
 *                          uma prateleira na parede — o celular não fica no chão).
 *   LÁ FORA                a piscina é um retângulo d'água com deck: as espreguiçadeiras no deck do fundo, o guarda-sol
 *                          ao lado delas, a mesa e o sofá no deck lateral, a cascata na borda, as boias na água, o
 *                          aquecimento solar na parede do fundo.
 *   O QUE NÃO CABE         não se espreme: fica de fora da cena e a tela diz o quê.
 *
 * Puro (sem React): os testes medem sobreposição, escala e montagem; a cena (`comodos.tsx`) só desenha.
 */
import { EXTERNOS, medidaDe, type Medida, type Zona } from './medidas';

/* ================================================================ a geometria */

export interface Geometria {
  W: number; H: number;
  /** A parede do fundo na tela. */
  fx0: number; fx1: number; fy0: number; fy1: number;
  /** O ponto de fuga. */
  pf: { x: number; y: number };
  /** Unidades de tela por metro na parede do fundo. */
  k: number;
  /** A largura do cômodo (m), a profundidade que se vê (m) e a distância da câmera à parede do fundo (m). */
  Wm: number; Dv: number; dist: number;
  externo: boolean;
}

/** A área de referência das cenas antigas (sem área): 5,8 m de largura, a geometria de antes da 12.8. */
export const AREA_PADRAO = 25;
const ALTURA_PAREDE = 2.7, OLHO = 1.65;

export function geometria(tipo: string, area = AREA_PADRAO): Geometria {
  const W = 320, H = 180;
  const externo = EXTERNOS.has(tipo);
  const a = Math.max(2, area);
  // A câmera enquadra no máximo ~7 m de largura num cômodo (12 m lá fora): a sala da mansão é larga, mas a cena mostra
  // a parte mobiliada, não uma maquete miúda.
  const Wm = externo ? Math.min(12, Math.max(4.5, Math.sqrt(a * 1.6))) : Math.min(7.2, Math.max(1.6, Math.sqrt(a * 1.35)));
  const k = Math.min(40, 236 / Wm);
  const fy1 = 116;
  const fy0 = fy1 - ALTURA_PAREDE * k;
  const pf = { x: W / 2, y: fy1 - OLHO * k };
  const sH = (H - pf.y) / (fy1 - pf.y);
  const Dm = a / Wm;
  const Dv = Math.min(externo ? 10 : 5.5, Math.max(1.6, Dm * (externo ? 0.95 : 0.8)));
  const dist = Dv / (1 - 1 / sH);
  return { W, H, fx0: W / 2 - Wm * k / 2, fx1: W / 2 + Wm * k / 2, fy0, fy1, pf, k, Wm, Dv, dist, externo };
}

/** A escala na profundidade z (m a partir da parede do fundo): 1 na parede, maior perto de quem olha. */
export const escalaEm = (g: Geometria, z: number) => g.dist / Math.max(0.2, g.dist - Math.min(z, g.Dv));
/** A linha do chão (y de tela) na profundidade z. */
export const chaoEm = (g: Geometria, z: number) => g.pf.y + (g.fy1 - g.pf.y) * escalaEm(g, z);
/** O x de tela de um ponto do chão (x em metros, da parede esquerda), na profundidade z. */
export const xEm = (g: Geometria, x: number, z: number) => g.W / 2 + (x - g.Wm / 2) * g.k * escalaEm(g, z);
/** Um ponto (x, altura, z) em metros → tela. */
export const tela = (g: Geometria, x: number, alt: number, z: number): [number, number] => [xEm(g, x, z), chaoEm(g, z) - alt * g.k * escalaEm(g, z)];

/* ================================================================ os postos */

export interface ObjetoParaDispor { id: string; coisaId: string; cor?: string; marca?: string }
export interface Posto {
  id: string;
  coisaId: string;
  cor?: string;
  marca?: string;
  /** No chão (m): x0..x1 (da parede esquerda), z0..z1 (da parede do fundo). */
  x0: number; x1: number; z0: number; z1: number;
  /** Altura do pé (m): a da parede, a do tampo onde está, 0 no chão. */
  base: number;
  h: number;
  montagem: 'chao' | 'parede' | 'superficie' | 'tapete' | 'agua';
  /** Na parede: a do fundo ou a lateral direita. */
  parede?: 'fundo' | 'dir';
  /** O par: esta é a metade esquerda ou a direita do desenho. */
  metade?: 'esq' | 'dir';
  /** Em cima de quê (o id do posto). */
  sobre?: string;
  /** Desenho fixo do cômodo (a bancada, o box, a árvore) — vem com a casa, não foi comprado. */
  fixo?: boolean;
}

export interface Disposicao {
  g: Geometria;
  postos: Posto[];
  /** Os que não couberam (o id do objeto). */
  fora: string[];
  /** A piscina (m), quando há. */
  piscina?: { x0: number; x1: number; z0: number; z1: number };
}

interface Retangulo { x0: number; x1: number; z0: number; z1: number }
const FOLGA = 0.06;
const cruza = (a: Retangulo, b: Retangulo, folga = FOLGA) => a.x0 < b.x1 + folga && b.x0 < a.x1 + folga && a.z0 < b.z1 + folga && b.z0 < a.z1 + folga;
const passos = (min: number, max: number, centro: number, passo = 0.1): number[] => {
  const out: number[] = [];
  if (max < min) return out;
  const c = Math.max(min, Math.min(max, centro));
  out.push(c);
  for (let k = 1; k < 400; k++) {
    const a = c + k * passo, b = c - k * passo;
    if (a > max && b < min) break;
    if (a <= max) out.push(a);
    if (b >= min) out.push(b);
  }
  return out;
};

/** Os fixos de cada cômodo (o que vem com ele, desenhado): a bancada da cozinha, o box, a pia, o vaso, a árvore. */
function fixosDe(tipo: string, g: Geometria, ids: Set<string>): Omit<Posto, 'id'>[] {
  const f = (coisaId: string, x0: number, w: number, d: number, h: number, extra: Partial<Posto> = {}): Omit<Posto, 'id'> => ({ coisaId, x0, x1: x0 + w, z0: 0.02, z1: 0.02 + d, base: 0, h, montagem: 'chao', fixo: true, ...extra });
  const tem = (...xs: string[]) => xs.some(x => ids.has(x));
  if (tipo === 'cozinha') {
    const w = Math.min(1.9, g.Wm * 0.45);
    const out = [f('_bancada', 0.02, w, 0.62, 0.92)];
    if (!tem('fogao', 'cooktop_forno', 'fogao_profissional')) out.push(f('_fogao', 0.02 + w + 0.02, 0.6, 0.62, 0.9));
    return out;
  }
  if (tipo === 'banheiro' || tipo === 'lavabo') {
    const out: Omit<Posto, 'id'>[] = [];
    let x = 0.02;
    if (tipo === 'banheiro' && !tem('ducha')) { out.push(f('_box', x, 0.9, 0.9, 2.0)); x += 0.92; }
    if (!tem('gabinete', 'bancada_marmore')) { out.push(f('_pia', x + 0.05, 0.55, 0.45, 0.85)); x += 0.62; }
    out.push(f('_vaso', Math.min(g.Wm - 0.45, x + 0.12), 0.4, 0.65, 0.8));
    return out;
  }
  if (tipo === 'jardim') return [f('_arvore', 0.15, 1.7, 1.2, 4)];
  if (tipo === 'lazer' && !tem('churrasqueira', 'espaco_gourmet')) return [f('_churrasqueira', 0.2, 1.3, 0.75, 2.1)];
  return [];
}

/** Os tampos onde as coisas pequenas sentam (com o espaço que ainda sobra em cada um). */
interface Tampo { posto: Posto; topo: number; livre: [number, number][] }
const TOPO_FIXO: Record<string, number> = { _bancada: 0.92, _pia: 0.85, _prateleira: 0 };

/**
 * Dispõe os objetos de um cômodo. Determinística: os mesmos objetos dão a mesma cena (a ordem vem do tamanho e do id,
 * não do acaso). `area` em m² (a do cômodo; lá fora, a da área).
 */
export function disporComodo(tipo: string, area: number | undefined, objetos: ObjetoParaDispor[]): Disposicao {
  // A âncora no meio é a primeira tentativa; se algo fica de fora, a âncora vai para um lado (como a cama encostada
  // num canto do quarto pequeno) — fica a disposição que deixa menos coisa de fora.
  let melhor: Disposicao | undefined;
  for (const lado of ['meio', 'direita', 'esquerda'] as const) {
    const d = dispor(tipo, area, objetos, lado);
    if (!melhor || d.fora.length < melhor.fora.length) melhor = d;
    if (!melhor.fora.length) break;
  }
  return melhor!;
}

function dispor(tipo: string, area: number | undefined, objetos: ObjetoParaDispor[], lado: 'meio' | 'direita' | 'esquerda'): Disposicao {
  const g = geometria(tipo, area);
  const postos: Posto[] = [];
  const fora: string[] = [];
  const chao: Retangulo[] = [];
  const paredeFundo: { x0: number; x1: number; b0: number; b1: number }[] = [];
  const paredeDir: { z0: number; z1: number; b0: number; b1: number }[] = [];
  const ids = new Set(objetos.map(o => o.coisaId));

  // A piscina (lá fora): um retângulo d'água com deck em volta — o deck do fundo é onde se toma sol.
  let piscina: Disposicao['piscina'];
  if (tipo === 'piscina') {
    piscina = { x0: g.Wm * 0.2, x1: g.Wm * 0.82, z0: Math.max(1.9, g.Dv * 0.36), z1: g.Dv * 0.86 };
    chao.push(piscina);
  }
  // A quadra: o piso inteiro é de jogo; os objetos ficam na borda.
  if (tipo === 'quadra') chao.push({ x0: g.Wm * 0.12, x1: g.Wm * 0.88, z0: g.Dv * 0.15, z1: g.Dv * 0.85 });

  for (const [i, f] of fixosDe(tipo, g, ids).entries()) {
    const p: Posto = { ...f, id: `fixo${i}` };
    postos.push(p); chao.push(p);
    if (p.h > 1.2) paredeFundo.push({ x0: p.x0, x1: p.x1, b0: 0, b1: p.h });
  }
  // A tela da sala de cinema ocupa a parede do fundo (o que vai na parede vai para os lados).
  if (tipo === 'cinema') paredeFundo.push({ x0: g.Wm * 0.15, x1: g.Wm * 0.85, b0: 0.6, b1: 2.5 });
  // O portão da garagem é a parede do fundo inteira.
  if (tipo === 'garagem') paredeFundo.push({ x0: g.Wm * 0.1, x1: g.Wm * 0.9, b0: 0, b1: 2.4 });

  const tampos: Tampo[] = postos.filter(p => TOPO_FIXO[p.coisaId]).map(p => ({ posto: p, topo: TOPO_FIXO[p.coisaId], livre: [[p.x0 + 0.05, p.x1 - 0.05]] }));

  // A camping: armada lá fora, guardada dentro (a barraca armada na sala não existe).
  const medida = (o: ObjetoParaDispor): Medida => (o.coisaId === 'camping' && !g.externo ? medidaDe('camping_guardado') : medidaDe(o.coisaId));

  const livre = (r: Retangulo, ignorar?: Retangulo) =>
    r.x0 >= 0 && r.x1 <= g.Wm && r.z0 >= 0 && r.z1 <= g.Dv && !chao.some(c => c !== ignorar && cruza(c, r));

  const porId = (coisaIds: string[] | undefined) => {
    for (const cid of coisaIds ?? []) { const p = postos.find(x => x.coisaId === cid && x.montagem === 'chao'); if (p) return p; }
    return undefined;
  };

  /** Tenta pôr no chão, pelas zonas, na ordem. */
  function noChao(o: ObjetoParaDispor, m: Medida): Posto | Posto[] | undefined {
    const w = Math.min(m.w, g.Wm - 0.04), d = Math.min(m.d, g.Dv - 0.04);
    const tenta = (x0: number, z0: number, ignorar?: Retangulo): Posto | undefined => {
      const r = { x0, x1: x0 + w, z0, z1: z0 + d };
      if (!livre(r, ignorar)) return undefined;
      return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, ...r, base: 0, h: m.h, montagem: 'chao' };
    };
    const pis = piscina;
    for (const zona of (m.z ?? ['canto', 'lado']) as Zona[]) {
      if (zona === 'junto') {
        const a = porId(m.de);
        if (!a) continue;
        if (m.par) {
          const e = tenta(a.x0 - w - 0.08, a.z0), dd = tenta(a.x1 + 0.08, a.z0);
          if (e && dd) return [{ ...e, id: `${o.id}:e`, metade: 'esq' }, { ...dd, id: `${o.id}:d`, metade: 'dir' }];
          if (e || dd) return [{ ...(e ?? dd)!, metade: e ? 'esq' : 'dir' }];
          continue;
        }
        const p = tenta(a.x1 + 0.08, a.z0) ?? tenta(a.x0 - w - 0.08, a.z0) ?? tenta(a.x1 + 0.08, a.z1 - d);
        if (p) return p;
        continue;
      }
      if (zona === 'diante') {
        const a = porId(m.de);
        if (!a) continue;
        const z0 = a.z1 + (m.vao ?? 0.4);
        const cx = (a.x0 + a.x1) / 2 - w / 2;
        for (const x0 of passos(0.02, g.Wm - w - 0.02, cx, 0.1).slice(0, 6)) { const p = tenta(x0, Math.max(0.02, z0), (m.vao ?? 0) < 0 ? a : undefined); if (p) return p; }
        continue;
      }
      if (zona === 'fundo') {
        const centro = !m.ancora || lado === 'meio' ? g.Wm / 2 - w / 2 : lado === 'direita' ? g.Wm - w - 0.6 : 0.6;
        for (const x0 of passos(0.02, g.Wm - w - 0.02, centro)) { const p = tenta(x0, 0.02); if (p) return p; }
        continue;
      }
      if (zona === 'canto') {
        for (const [x0, z0] of [[0.02, 0.02], [g.Wm - w - 0.02, 0.02], [g.Wm - w - 0.02, g.Dv - d - 0.1], [0.02, g.Dv - d - 0.1]]) { const p = tenta(x0, z0); if (p) return p; }
        continue;
      }
      if (zona === 'lado') {
        for (const z0 of passos(0.02, g.Dv - d - 0.1, m.h > 1.5 ? 0.02 : g.Dv * 0.3, 0.1)) {
          const p = tenta(g.Wm - w - 0.02, z0) ?? tenta(0.02, z0);
          if (p) return p;
        }
        continue;
      }
      if (zona === 'centro' || zona === 'frente') {
        const zc = zona === 'centro' ? g.Dv * 0.5 - d / 2 : g.Dv - d - 0.15;
        for (const z0 of passos(0.3, g.Dv - d - 0.05, zc, 0.15)) for (const x0 of passos(0.02, g.Wm - w - 0.02, g.Wm / 2 - w / 2, 0.15)) { const p = tenta(x0, z0); if (p) return p; }
        continue;
      }
      if (!pis) continue;
      if (zona === 'deck') { for (const z0 of passos(0.05, pis.z0 - d - 0.1, pis.z0 - d - 0.2, 0.15)) for (const x0 of passos(0.05, g.Wm - w - 0.05, g.Wm / 2 - w / 2, 0.15)) { const p = tenta(x0, z0); if (p) return p; } continue; }
      if (zona === 'deck_lado') {
        for (const z0 of passos(pis.z0, g.Dv - d - 0.05, pis.z0 + 0.2, 0.15)) { const p = tenta(0.05, z0) ?? tenta(g.Wm - w - 0.05, z0); if (p) return p; }
        continue;
      }
      if (zona === 'borda') { for (const x0 of passos(pis.x0, pis.x1 - w, (pis.x0 + pis.x1) / 2 - w / 2, 0.15)) { const p = tenta(x0, Math.max(0.05, pis.z0 - d - 0.08)); if (p) return p; } continue; }
    }
    return undefined;
  }

  /** Na parede: a do fundo (sobre a âncora, quando há uma ali) ou a lateral direita. */
  function naParede(o: ObjetoParaDispor, m: Medida): Posto | undefined {
    const alt = Math.min(m.alt ?? 1.4, ALTURA_PAREDE - m.h - 0.05);
    const b0 = alt, b1 = alt + m.h;
    const altosNoFundo = postos.filter(p => p.montagem === 'chao' && p.z0 < 0.35 && p.h > b0 + 0.02);
    const livreFundo = (x0: number) => x0 >= 0.05 && x0 + m.w <= g.Wm - 0.05
      && !paredeFundo.some(q => x0 < q.x1 + 0.08 && q.x0 < x0 + m.w + 0.08 && b0 < q.b1 + 0.05 && q.b0 < b1 + 0.05)
      && !altosNoFundo.some(p => x0 < p.x1 && p.x0 < x0 + m.w);
    const zMax = Math.max(1.6, Math.min(g.Dv * 0.6, g.Dv - 0.2));
    const livreDir = (z0: number) => z0 >= 0.15 && z0 + m.w <= zMax
      && !paredeDir.some(q => z0 < q.z1 + 0.08 && q.z0 < z0 + m.w + 0.08 && b0 < q.b1 && q.b0 < b1)
      && !postos.some(p => p.montagem === 'chao' && p.x1 > g.Wm - 0.5 && p.h > b0 + 0.1 && z0 < p.z1 && p.z0 < z0 + m.w);
    const acima = postos.find(p => p.montagem === 'chao' && p.z0 < 0.35 && (p.coisaId.startsWith('sofa') || CAMAS_SET.has(p.coisaId) || p.coisaId === 'aparador' || p.coisaId === 'gabinete' || p.coisaId === 'bancada_marmore' || p.coisaId === '_pia' || p.coisaId === 'lareira') && p.h < b0);
    const ponFundo = (x0: number): Posto => { paredeFundo.push({ x0, x1: x0 + m.w, b0, b1 }); return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0, x1: x0 + m.w, z0: 0, z1: 0.06, base: alt, h: m.h, montagem: 'parede', parede: 'fundo' }; };
    const ponDir = (z0: number): Posto => { paredeDir.push({ z0, z1: z0 + m.w, b0, b1 }); return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0: g.Wm - 0.06, x1: g.Wm, z0, z1: z0 + m.w, base: alt, h: m.h, montagem: 'parede', parede: 'dir' }; };
    const ladoPrimeiro = m.paredeLado && (postos.some(p => p.z0 < 0.35 && p.coisaId.startsWith('sofa')) || postos.some(p => CAMAS_SET.has(p.coisaId)) || tipo === 'cinema');
    const tentaDir = () => { if (g.externo) return undefined; for (const z0 of passos(0.15, zMax - m.w, g.Dv * 0.3, 0.1)) if (livreDir(z0)) return ponDir(z0); return undefined; };
    if (ladoPrimeiro) { const p = tentaDir(); if (p) return p; }
    const centro = acima ? (acima.x0 + acima.x1) / 2 - m.w / 2 : g.Wm / 2 - m.w / 2;
    for (const x0 of passos(0.05, g.Wm - m.w - 0.05, centro, 0.1)) if (livreFundo(x0)) return ponFundo(x0);
    return tentaDir();
  }

  /** Num tampo (o maior espaço livre que caiba); sem tampo, numa prateleira na parede do fundo. */
  function emCima(o: ObjetoParaDispor, m: Medida): Posto | undefined {
    const cabe = (t: Tampo) => t.livre.findIndex(([a, b]) => b - a >= m.w);
    let t = tampos.filter(x => cabe(x) >= 0).sort((a, b) => a.topo - b.topo === 0 ? 0 : (a.topo >= 0.7 ? 0 : 1) - (b.topo >= 0.7 ? 0 : 1))[0];
    if (!t) {
      // A prateleira: uma tábua de 1,2 m na parede do fundo, a 1,25 m (como em toda casa) — só quando não há tampo.
      const sh: Medida = { w: 1.2, d: 0.25, h: 0.04, m: 'parede', alt: 1.25 };
      const p = naParede({ id: `prateleira${postos.length}`, coisaId: '_prateleira' }, sh);
      if (!p) return undefined;
      p.fixo = true;
      postos.push(p);
      t = { posto: p, topo: 1.29, livre: [[p.x0 + 0.04, p.x1 - 0.04]] };
      tampos.push(t);
    }
    const i = cabe(t);
    if (i < 0) return undefined;
    const [a, b] = t.livre[i];
    // Do meio do espaço livre para fora: a primeira coisa no centro do tampo, as outras ao lado.
    const x0 = t.livre.length === 1 && a === t.posto.x0 + 0.05 ? (a + b) / 2 - m.w / 2 : a;
    t.livre.splice(i, 1, ...[[a, x0 - 0.03], [x0 + m.w + 0.03, b]].filter(([p, q]) => q - p > 0.08) as [number, number][]);
    const base = t.posto.montagem === 'parede' ? t.posto.base + t.posto.h : t.topo;
    const z0 = t.posto.montagem === 'parede' ? 0.02 : t.posto.z0 + 0.05;
    return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0, x1: x0 + m.w, z0, z1: z0 + Math.min(m.d, Math.max(0.05, t.posto.z1 - t.posto.z0 - 0.05)), base, h: m.h, montagem: 'superficie', sobre: t.posto.id };
  }

  // A ordem: âncoras (pelo tamanho), depois o que tem lugar marcado (junto/diante), o resto do chão pelo tamanho, a
  // parede, o que fica em cima, o tapete por último (vai sob o que já está), a água.
  const peso = (o: ObjetoParaDispor) => {
    const m = medida(o);
    if (m.m === 'chao') return (m.ancora ? 0 : m.z?.[0] === 'junto' || m.z?.[0] === 'diante' ? 1 : 2) * 1000 - m.w * m.d * 10;
    return m.m === 'parede' ? 3000 - (m.paredeLado ? 500 : 0) - m.w * m.h * 10 : m.m === 'superficie' ? 4000 : m.m === 'tapete' ? 5000 : 6000;
  };
  const ordem = [...objetos].sort((a, b) => peso(a) - peso(b) || a.coisaId.localeCompare(b.coisaId) || a.id.localeCompare(b.id));
  for (const o of ordem) {
    const m = medida(o);
    if (m.m === 'chao') {
      const p = noChao(o, m);
      if (!p) { fora.push(o.id); continue; }
      for (const x of Array.isArray(p) ? p : [p]) {
        postos.push(x); chao.push(x);
        if (m.topo) tampos.push({ posto: x, topo: m.topo, livre: [[x.x0 + 0.04, x.x1 - 0.04]] });
      }
    } else if (m.m === 'parede') {
      const p = naParede(o, m);
      if (p) postos.push(p); else fora.push(o.id);
    } else if (m.m === 'superficie') {
      const p = emCima(o, m);
      if (p) postos.push(p); else fora.push(o.id);
    } else if (m.m === 'tapete') {
      const p = tapete(o, m);
      if (p) postos.push(p); else fora.push(o.id);
    } else if (m.m === 'agua') {
      if (!piscina) { fora.push(o.id); continue; }
      const ja = postos.filter(x => x.montagem === 'agua').length;
      const pw = piscina.x1 - piscina.x0, pd = piscina.z1 - piscina.z0;
      const capa = o.coisaId === 'capa_piscina';
      const w = capa ? pw : Math.min(m.w, pw * 0.3), d = capa ? pd : Math.min(m.d, pd * 0.4);
      const x0 = capa ? piscina.x0 : piscina.x0 + pw * [0.62, 0.18, 0.42][ja % 3];
      const z0 = capa ? piscina.z0 : piscina.z0 + pd * [0.25, 0.5, 0.15][ja % 3];
      postos.push({ id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0, x1: x0 + w, z0, z1: z0 + d, base: 0, h: m.h, montagem: 'agua' });
    }
  }

  /** O tapete: sob a cama ou sob o sofá e a mesa de centro; sem âncora, no meio. */
  function tapete(o: ObjetoParaDispor, m: Medida): Posto | undefined {
    if (postos.some(p => p.montagem === 'tapete')) return undefined;
    const cama = postos.find(p => CAMAS_SET.has(p.coisaId));
    const sofa = postos.find(p => p.coisaId.startsWith('sofa') && p.montagem === 'chao');
    let r: Retangulo;
    if (cama) r = { x0: cama.x0 - 0.45, x1: cama.x1 + 0.45, z0: cama.z0 + 0.55, z1: cama.z1 + 0.5 };
    else if (sofa) { const w = Math.max(m.w, sofa.x1 - sofa.x0 + 0.3); const cx = (sofa.x0 + sofa.x1) / 2; r = { x0: cx - w / 2, x1: cx + w / 2, z0: sofa.z0 + 0.45, z1: sofa.z1 + m.d * 0.75 }; }
    else r = { x0: g.Wm / 2 - m.w / 2, x1: g.Wm / 2 + m.w / 2, z0: g.Dv * 0.45 - m.d / 2, z1: g.Dv * 0.45 + m.d / 2 };
    r = { x0: Math.max(0.1, r.x0), x1: Math.min(g.Wm - 0.1, r.x1), z0: Math.max(0.1, r.z0), z1: Math.min(g.Dv - 0.1, r.z1) };
    if (r.x1 - r.x0 < 0.8 || r.z1 - r.z0 < 0.6) return undefined;
    return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, ...r, base: 0, h: 0.01, montagem: 'tapete' };
  }

  return { g, postos, fora, piscina };
}

const CAMAS_SET = new Set(['cama_king', 'colchao_hotel', 'colchao', 'cama_box', 'cama_solteiro', 'beliche', 'sofa_cama']);

/** A ordem de desenho: o tapete, a parede (fundo, depois a lateral), e o chão de trás para a frente (o que está em cima
 *  logo depois do que está embaixo). */
/** A profundidade em que um objeto do chão é desenhado: o fundo dele (até 60 cm) — a cama encosta a cabeceira na parede. */
export const zDoDesenho = (p: Posto) => (p.montagem === 'chao' ? p.z0 + Math.min(p.z1 - p.z0, 0.6) : p.montagem === 'parede' ? 0 : (p.z0 + p.z1) / 2);

export function ordemDeDesenho(postos: Posto[]): Posto[] {
  const rank = (p: Posto) => (p.montagem === 'tapete' ? 0 : p.montagem === 'agua' ? 1 : p.montagem === 'parede' ? (p.parede === 'dir' ? 3 : 2) : 4);
  const host = new Map(postos.map(p => [p.id, p]));
  const zDe = (p: Posto): number => (p.sobre && host.get(p.sobre) && host.get(p.sobre)!.montagem !== 'parede' ? zDe(host.get(p.sobre)!) + 0.001 : p.montagem === 'superficie' ? 0.001 : zDoDesenho(p));
  return [...postos].sort((a, b) => rank(a) - rank(b) || (rank(a) === 3 ? b.z0 - a.z0 : 0) || zDe(a) - zDe(b) || a.x0 - b.x0);
}
