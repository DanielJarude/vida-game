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
import { opcaoDeAcabamento } from '../../motor/dados/lar';

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
  /** VIDA 12.9: a profundidade real do cômodo (m) — a cena mostra só `Dv`, mas o armário encostado na parede lateral
   *  pode seguir para perto de quem olha e sair pela borda da cena (como numa foto do quarto). */
  Dr: number;
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
  return { W, H, fx0: W / 2 - Wm * k / 2, fx1: W / 2 + Wm * k / 2, fy0, fy1, pf, k, Wm, Dv, dist, Dr: Math.max(Dv, Math.min(Dm, Dv + 1.2)), externo };
}

/** 12.9: o trecho da parede esquerda (z0..z1, m) que a janela ocupa — o mesmo que a cena desenha. */
export const janelaEm = (g: Geometria): [number, number] => { const zA = Math.min(g.Dv * 0.75, 1.1 + g.Dv * 0.25); return [Math.max(0.3, zA - 1.2), zA]; };

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
  /** Na parede: a do fundo, a lateral direita ou (12.9) a esquerda, fora da janela. */
  parede?: 'fundo' | 'dir' | 'esq';
  /** O par: esta é a metade esquerda ou a direita do desenho. */
  metade?: 'esq' | 'dir';
  /** Em cima de quê (o id do posto). */
  sobre?: string;
  /** Desenho fixo do cômodo (a bancada, o box, a árvore) — vem com a casa, não foi comprado. */
  fixo?: boolean;
  /** VIDA 12.9: girado 90°, encostado na parede lateral esquerda (`esq`, a frente virada para a direita) ou direita
   *  (`dir`). No chão, x0..x1 é então a profundidade do móvel e z0..z1 a largura dele, ao longo da parede. */
  giro?: 'esq' | 'dir';
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
    out.push(f('_vaso', Math.min(g.Wm - 0.47, x + 0.12), 0.42, 0.68, 0.78));
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
export function disporComodo(tipo: string, area: number | undefined, objetos: ObjetoParaDispor[], luz?: string): Disposicao {
  // 12.8.1: a luminária de pé (a luz "abajur") é um objeto do chão como os outros — ao lado do sofá, da cama ou da
  // poltrona, na perspectiva do cômodo —, não um desenho solto na frente da cena.
  if (!EXTERNOS.has(tipo) && tipo !== 'banheiro' && tipo !== 'lavabo' && opcaoDeAcabamento('luz', luz)?.desenho === 'abajur') objetos = [...objetos, { id: '_abajur', coisaId: '_abajur' }];
  // A âncora no meio é a primeira tentativa; se algo fica de fora, a âncora vai para um lado (como a cama encostada
  // num canto do quarto pequeno) — fica a disposição que deixa menos coisa de fora.
  // 12.8.1: e, sem nada de fora, a que não deixa um móvel alto solto no meio do cômodo (o closet longe da parede).
  let melhor: Disposicao | undefined, nota = Infinity;
  for (const lado of ['meio', 'direita', 'esquerda'] as const) {
    const d = dispor(tipo, area, objetos, lado);
    const n = d.fora.length * 10 + soltos(d);
    if (n < nota) { melhor = d; nota = n; }
    if (!nota) break;
  }
  return melhor!;
}

/** Os móveis altos (armário, vitrine, estante) que ficaram longe da parede do fundo. */
const soltos = (d: Disposicao) => d.g.externo ? 0 : d.postos.filter(p => p.montagem === 'chao' && !p.fixo && !p.giro && p.h > 1.4 && p.z0 > 0.8).length;

function dispor(tipo: string, area: number | undefined, objetos: ObjetoParaDispor[], lado: 'meio' | 'direita' | 'esquerda'): Disposicao {
  const g = geometria(tipo, area);
  const postos: Posto[] = [];
  const fora: string[] = [];
  const chao: Retangulo[] = [];
  const paredeFundo: { x0: number; x1: number; b0: number; b1: number }[] = [];
  const paredeDir: { z0: number; z1: number; b0: number; b1: number }[] = [];
  const paredeEsq: { z0: number; z1: number; b0: number; b1: number }[] = [];
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

  // 12.9: o último recurso (`apertado`) deixa um móvel encostado cobrir em parte um pequeno e baixo (a mesa de cabeceira,
  // o pufe) — melhor que o móvel sumir da cena. Nunca um grande sobre outro grande.
  let apertado = false;
  const pequeno = (c: Retangulo) => { const p = c as Posto; return apertado && p.montagem === 'chao' && !p.fixo && (p.x1 - p.x0) * (p.z1 - p.z0) < 0.36 && p.h < 0.9; };
  const livre = (r: Retangulo, ignorar?: Retangulo, fundoMax = g.Dv) =>
    r.x0 >= 0 && r.x1 <= g.Wm && r.z0 >= 0 && r.z1 <= fundoMax && !chao.some(c => c !== ignorar && !pequeno(c) && cruza(c, r));

  const porId = (coisaIds: string[] | undefined) => {
    for (const cid of coisaIds ?? []) { const p = postos.find(x => x.coisaId === cid && x.montagem === 'chao'); if (p) return p; }
    return undefined;
  };

  let rigor = true;
  /** Na tela, um tapa o outro? (a mesma faixa de x, um na frente do outro a menos de 1,6 m, e o de trás se vê por cima) */
  function escondeOuSome(r: Retangulo, h: number, vaoMax: number): boolean {
    if (g.externo) return false;
    return postos.some(q => {
      if (q.montagem !== 'chao') return false;
      const sobre = Math.min(r.x1, q.x1) - Math.max(r.x0, q.x0);
      if (sobre < 0.25 * Math.min(r.x1 - r.x0, q.x1 - q.x0)) return false;
      const [tras, hT, frente, hF] = q.z1 <= r.z0 + 0.02 ? [q, q.h, r, h] : r.z1 <= q.z0 + 0.02 ? [r, h, q, q.h] : [undefined, 0, undefined, 0];
      if (!tras || !frente || frente.z0 - tras.z1 > vaoMax) return false;
      return hT > 1.3 || hF >= hT * 0.6;
    });
  }

  /**
   * VIDA 13 — quanto um lugar esconde (na tela): para cada móvel do chão que fica atrás do outro, a fração da figura
   * dele que o da frente cobre (as caixas dos dois em perspectiva). Sem lugar que não tape nada, fica o que tapa menos
   * (a banheira na frente do box de vidro alto, não na frente do vaso, que sumia inteiro).
   */
  const figura = (r: Retangulo, h: number) => {
    const pts = [r.z0, r.z1].flatMap(z => [r.x0, r.x1].flatMap(x => [tela(g, x, 0, z), tela(g, x, h, z)]));
    return { x0: Math.min(...pts.map(q => q[0])), x1: Math.max(...pts.map(q => q[0])), y0: Math.min(...pts.map(q => q[1])), y1: Math.max(...pts.map(q => q[1])), z: (r.z0 + r.z1) / 2 };
  };
  function custoDeOclusao(r: Retangulo, h: number): number {
    const a = figura(r, h);
    let custo = 0;
    for (const q of postos) {
      if (q.montagem !== 'chao') continue;
      const b = figura(q, q.h);
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix <= 0 || iy <= 0) continue;
      const tras = a.z < b.z ? a : b;
      custo += (ix * iy) / Math.max(1, (tras.x1 - tras.x0) * (tras.y1 - tras.y0));
    }
    return custo;
  }
  /** No modo sem rigor, os lugares possíveis são juntados aqui (em vez de ficar o primeiro). */
  let coletados: Posto[] | undefined;

  /** Tenta pôr no chão, pelas zonas, na ordem. */
  function noChao(o: ObjetoParaDispor, m: Medida): Posto | Posto[] | undefined {
    if (!rigor && !m.par && !coletados) {
      // VIDA 13: o primeiro lugar que cabe pode esconder outro inteiro; junta os possíveis e fica com o que menos tapa
      // (empate: o de antes, na ordem de preferência das zonas).
      coletados = [];
      noChao(o, m);
      const lista = coletados;
      coletados = undefined;
      if (!lista.length) return undefined;
      let melhor = lista[0], nota = custoDeOclusao(melhor, melhor.h);
      for (const c of lista.slice(1, 400)) { const n = custoDeOclusao(c, c.h); if (n < nota - 0.05) { melhor = c; nota = n; } }
      return melhor;
    }
    const w = Math.min(m.w, g.Wm - 0.04), d = Math.min(m.d, g.Dv - 0.04);
    const tenta = (x0: number, z0: number, ignorar?: Retangulo, encostado = false): Posto | undefined => {
      const r = { x0, x1: x0 + w, z0, z1: z0 + d };
      if (!livre(r, ignorar)) return undefined;
      // 12.8.1: o móvel encostado (no fundo, no canto, na lateral) não fica na frente de outro que se veja por trás dele
      // (o aparador tapando a vitrine, a penteadeira na frente do closet), nem atrás de um mais alto que o esconda.
      if (rigor && escondeOuSome(r, m.h, encostado || o.coisaId === '_abajur' ? 1.6 : 0.7)) return undefined;
      // E inteiro à vista: o que fica perto de quem olha não sai pela borda da cena.
      const zd = z0 + Math.min(d, 0.6);
      if (!g.externo && (xEm(g, x0 + w * 0.3, zd) < 1 || xEm(g, x0 + w * 0.7, zd) > g.W - 1 || chaoEm(g, zd) > g.H - 1)) return undefined;
      const p: Posto = { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, ...r, base: 0, h: m.h, montagem: 'chao' };
      if (coletados) { coletados.push(p); return undefined; }
      return p;
    };
    /**
     * 12.9 — GIRADO: o móvel de encostar (a penteadeira, o closet, o armário planejado, a vitrine) vai de lado, encostado
     * numa parede lateral, com a frente virada para o meio do cômodo — como num quarto de verdade —, em vez de ficar de
     * frente no primeiro plano tapando a cama, a ilha ou o sofá. Pode seguir até a profundidade real do cômodo (sai pela
     * borda da cena, perto de quem olha), mas o começo dele fica à vista.
     */
    const girado = (lados: ('esq' | 'dir')[]): Posto | undefined => {
      const gw = Math.min(m.d, g.Wm * 0.45), gd = Math.min(m.w, g.Dr - 0.06);
      for (const z0 of passos(0.02, g.Dr - gd - 0.02, 0.02, 0.1)) {
        // à vista: o primeiro meio metro dele dentro da cena, e pelo menos 40% do comprimento antes da borda
        if (z0 + Math.min(0.5, gd) > g.Dv || (g.Dv - z0) < gd * 0.4) continue;
        for (const lado of lados) {
          const x0 = lado === 'esq' ? 0.02 : g.Wm - gw - 0.02;
          const r = { x0, x1: x0 + gw, z0, z1: z0 + gd };
          if (!livre(r, undefined, g.Dr)) continue;
          if (rigor && escondeOuSome(r, m.h, 1.6)) continue;
          const p: Posto = { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, ...r, base: 0, h: m.h, montagem: 'chao', giro: lado };
          if (coletados) { coletados.push(p); continue; }
          return p;
        }
      }
      return undefined;
    };
    // A janela fica na parede esquerda: o alto vai de preferência para a direita.
    const ladosDoGiro: ('esq' | 'dir')[] = m.h > 1.2 ? ['dir', 'esq'] : ['esq', 'dir'];
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
        // 12.9: diante do móvel girado (a cadeira da escrivaninha encostada na parede lateral): ao lado da frente dele.
        if (a.giro) {
          const x0 = a.giro === 'esq' ? a.x1 + (m.vao ?? 0.4) : a.x0 - w - (m.vao ?? 0.4);
          const p = tenta(Math.max(0.02, Math.min(g.Wm - w - 0.02, x0)), Math.max(0.02, (a.z0 + a.z1) / 2 - d / 2), (m.vao ?? 0) < 0 ? a : undefined);
          if (p) return p;
          continue;
        }
        const z0 = a.z1 + (m.vao ?? 0.4);
        const cx = (a.x0 + a.x1) / 2 - w / 2;
        for (const x0 of passos(0.02, g.Wm - w - 0.02, cx, 0.1).slice(0, 6)) { const p = tenta(x0, Math.max(0.02, z0), (m.vao ?? 0) < 0 ? a : undefined); if (p) return p; }
        continue;
      }
      if (zona === 'fundo') {
        const centro = !m.ancora || lado === 'meio' ? g.Wm / 2 - w / 2 : lado === 'direita' ? g.Wm - w - 0.6 : 0.6;
        for (const x0 of passos(0.02, g.Wm - w - 0.02, centro)) { const p = tenta(x0, 0.02, undefined, true); if (p) return p; }
        continue;
      }
      if (zona === 'canto') {
        for (const [x0, z0] of [[0.02, 0.02], [g.Wm - w - 0.02, 0.02], [g.Wm - w - 0.02, g.Dv - d - 0.1], [0.02, g.Dv - d - 0.1]]) { const p = tenta(x0, z0, undefined, true); if (p) return p; }
        continue;
      }
      if (zona === 'lado') {
        if (giratorio(o.coisaId, m) && !g.externo) { const p = girado(ladosDoGiro); if (p) return p; }
        for (const z0 of passos(0.02, g.Dv - d - 0.1, m.h > 1.5 ? 0.02 : g.Dv * 0.3, 0.1)) {
          const p = tenta(g.Wm - w - 0.02, z0, undefined, true) ?? tenta(0.02, z0, undefined, true);
          if (p) return p;
        }
        continue;
      }
      if (zona === 'centro' || zona === 'frente') {
        const zc = zona === 'centro' ? g.Dv * 0.5 - d / 2 : g.Dv - d - 0.15;
        // 12.9: no meio, não na frente da âncora (a mesa de jogos diante do sofá): vale o vão de 1,6 m, como o encostado.
        for (const z0 of passos(0.3, g.Dv - d - 0.05, zc, 0.15)) for (const x0 of passos(0.02, g.Wm - w - 0.02, g.Wm / 2 - w / 2, 0.15)) { const p = tenta(x0, z0, undefined, true); if (p) return p; }
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
    // 12.9: sem lugar na altura de costume, a TV (e o quadro) sobe — acima da cômoda, da penteadeira, do aparador.
    const p = naParedeEm(o, m, Math.min(m.alt ?? 1.4, ALTURA_PAREDE - m.h - 0.05));
    if (p || (m.alt ?? 1.4) >= 1.3 || ALTURA_PAREDE - m.h - 0.05 < 1.3) return p;
    return naParedeEm(o, m, Math.min(1.55, ALTURA_PAREDE - m.h - 0.05));
  }
  function naParedeEm(o: ObjetoParaDispor, m: Medida, alt: number): Posto | undefined {
    const b0 = alt, b1 = alt + m.h;
    const altosNoFundo = postos.filter(p => p.montagem === 'chao' && p.z0 < 0.35 && p.h > b0 + 0.02);
    const livreFundo = (x0: number) => x0 >= 0.05 && x0 + m.w <= g.Wm - 0.05
      && !paredeFundo.some(q => x0 < q.x1 + 0.08 && q.x0 < x0 + m.w + 0.08 && b0 < q.b1 + 0.05 && q.b0 < b1 + 0.05)
      && !altosNoFundo.some(p => x0 < p.x1 && p.x0 < x0 + m.w)
      // 12.9: a TV não vai por cima da cabeceira (a do quarto fica de frente para a cama, numa lateral).
      && !(m.paredeLado && postos.some(p => CAMAS_SET.has(p.coisaId) && p.z0 < 0.35 && x0 < p.x1 && p.x0 < x0 + m.w));
    const zMax = Math.max(1.6, Math.min(g.Dv * 0.6, g.Dv - 0.2));
    const livreDir = (z0: number) => z0 >= 0.15 && z0 + m.w <= zMax && xEm(g, g.Wm, z0 + m.w) <= g.W - 3
      && !paredeDir.some(q => z0 < q.z1 + 0.08 && q.z0 < z0 + m.w + 0.08 && b0 < q.b1 && q.b0 < b1)
      && !postos.some(p => p.montagem === 'chao' && p.x1 > g.Wm - 0.5 && p.h > b0 + 0.1 && z0 < p.z1 && p.z0 < z0 + m.w);
    const acima = postos.find(p => p.montagem === 'chao' && p.z0 < 0.35 && (p.coisaId.startsWith('sofa') || CAMAS_SET.has(p.coisaId) || p.coisaId === 'aparador' || p.coisaId === 'gabinete' || p.coisaId === 'bancada_marmore' || p.coisaId === '_pia' || p.coisaId === 'lareira') && p.h < b0);
    const ponFundo = (x0: number): Posto => { paredeFundo.push({ x0, x1: x0 + m.w, b0, b1 }); return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0, x1: x0 + m.w, z0: 0, z1: 0.06, base: alt, h: m.h, montagem: 'parede', parede: 'fundo' }; };
    const ponDir = (z0: number): Posto => { paredeDir.push({ z0, z1: z0 + m.w, b0, b1 }); return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0: g.Wm - 0.06, x1: g.Wm, z0, z1: z0 + m.w, base: alt, h: m.h, montagem: 'parede', parede: 'dir' }; };
    const ladoPrimeiro = m.paredeLado && (postos.some(p => p.z0 < 0.35 && p.coisaId.startsWith('sofa')) || postos.some(p => CAMAS_SET.has(p.coisaId)) || tipo === 'cinema');
    const tentaDir = () => { if (g.externo) return undefined; for (const z0 of passos(0.15, zMax - m.w, g.Dv * 0.3, 0.1)) if (livreDir(z0)) return ponDir(z0); return undefined; };
    // 12.9: a parede esquerda (a da janela), no trecho sem janela — a TV do quarto quando a direita tem o closet.
    const [jz0, jz1] = janelaEm(g);
    const livreEsq = (z0: number) => z0 >= 0.15 && z0 + m.w <= zMax && xEm(g, 0, z0 + m.w) >= 3
      && (tipo === 'cinema' || tipo === 'banheiro' || tipo === 'lavabo' || tipo === 'adega' || z0 + m.w < jz0 - 0.1 || z0 > jz1 + 0.1 || b0 > 2.2 || b1 < 0.9)
      && !paredeEsq.some(q => z0 < q.z1 + 0.08 && q.z0 < z0 + m.w + 0.08 && b0 < q.b1 && q.b0 < b1)
      && !postos.some(p => p.montagem === 'chao' && p.x0 < 0.5 && p.h > b0 + 0.1 && z0 < p.z1 && p.z0 < z0 + m.w);
    const ponEsq = (z0: number): Posto => { paredeEsq.push({ z0, z1: z0 + m.w, b0, b1 }); return { id: o.id, coisaId: o.coisaId, cor: o.cor, marca: o.marca, x0: 0, x1: 0.06, z0, z1: z0 + m.w, base: alt, h: m.h, montagem: 'parede', parede: 'esq' }; };
    const tentaEsq = () => { if (g.externo) return undefined; for (const z0 of passos(0.15, zMax - m.w, g.Dv * 0.3, 0.1)) if (livreEsq(z0)) return ponEsq(z0); return undefined; };
    if (ladoPrimeiro) { const p = tentaDir() ?? (m.paredeLado ? tentaEsq() : undefined); if (p) return p; }
    const centro = acima ? (acima.x0 + acima.x1) / 2 - m.w / 2 : g.Wm / 2 - m.w / 2;
    for (const x0 of passos(0.05, g.Wm - m.w - 0.05, centro, 0.1)) if (livreFundo(x0)) return ponFundo(x0);
    return tentaDir() ?? tentaEsq();
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
    if (o.coisaId === '_abajur') return 2999; // a luminária por último no chão: no lugar que sobrar ao lado de quem senta
    // 12.8.1: entre os do chão sem lugar marcado, primeiro o que mais se vê de frente (o armário alto, a vitrine) — o
    // pequeno se ajeita depois no que sobra, em vez de tomar a parede do móvel grande.
    // 12.9: o que vai junto/diante de um móvel que não é âncora (a cadeira da escrivaninha) entra depois dele.
    const deAncora = (m.de ?? []).some(c => ids.has(c) && medidaDe(c).ancora);
    if (m.m === 'chao' && (m.z?.[0] === 'junto' || m.z?.[0] === 'diante') && !deAncora) return 2500 - m.w * m.d * 10;
    if (m.m === 'chao') return (m.ancora ? 0 : m.z?.[0] === 'junto' || m.z?.[0] === 'diante' ? 1 : 2) * 1000 - (g.externo || m.ancora || m.z?.[0] === 'junto' || m.z?.[0] === 'diante' ? m.w * m.d : m.w * m.h) * 10;
    return m.m === 'parede' ? 3000 - (m.paredeLado ? 500 : 0) - m.w * m.h * 10 : m.m === 'superficie' ? 4000 : m.m === 'tapete' ? 5000 : 6000;
  };
  const ordem = [...objetos].sort((a, b) => peso(a) - peso(b) || a.coisaId.localeCompare(b.coisaId) || a.id.localeCompare(b.id));
  for (const o of ordem) {
    const m = medida(o);
    if (m.m === 'chao') {
      // Sem lugar que não tape nada, o cômodo pequeno aceita um na frente do outro (melhor que ficar de fora).
      rigor = true; apertado = false;
      let p = noChao(o, m);
      if (!p && o.coisaId !== '_abajur') { rigor = false; p = noChao(o, m); }
      // 12.9: e, sem lugar nenhum, o encostado pode cobrir em parte um móvel pequeno e baixo — nada some da cena por isso.
      if (!p && o.coisaId !== '_abajur' && giratorio(o.coisaId, m) && !g.externo) { apertado = true; p = noChao(o, m); apertado = false; }
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

  for (const p of postos) if (p.coisaId === '_abajur') p.fixo = true;
  return { g, postos, fora: fora.filter(id => id !== '_abajur'), piscina };
}

/** 12.9: o que vai de lado numa parede lateral — o que tem uma frente de encostar (`Medida.gira`) e cabe na lateral. */
export const giratorio = (_coisaId: string, m: Medida) => m.m === 'chao' && !!m.gira && !m.ancora && !!m.z?.includes('lado');

const CAMAS_SET = new Set(['cama_king', 'colchao_hotel', 'colchao', 'cama_box', 'cama_solteiro', 'beliche', 'sofa_cama']);

/** A ordem de desenho: o tapete, a parede (fundo, depois a lateral), e o chão de trás para a frente (o que está em cima
 *  logo depois do que está embaixo). */
/** A profundidade em que um objeto do chão é desenhado: o fundo dele (até 60 cm) — a cama encosta a cabeceira na parede. */
export const zDoDesenho = (p: Posto) => (p.giro ? p.z0 + 0.3 : p.montagem === 'chao' ? p.z0 + Math.min(p.z1 - p.z0, 0.6) : p.montagem === 'parede' ? 0 : (p.z0 + p.z1) / 2);

export function ordemDeDesenho(postos: Posto[]): Posto[] {
  const rank = (p: Posto) => (p.montagem === 'tapete' ? 0 : p.montagem === 'agua' ? 1 : p.montagem === 'parede' ? (p.parede === 'dir' || p.parede === 'esq' ? 3 : 2) : 4);
  const host = new Map(postos.map(p => [p.id, p]));
  const zDe = (p: Posto): number => (p.sobre && host.get(p.sobre) && host.get(p.sobre)!.montagem !== 'parede' ? zDe(host.get(p.sobre)!) + 0.001 : p.montagem === 'superficie' ? 0.001 : zDoDesenho(p));
  return [...postos].sort((a, b) => rank(a) - rank(b) || (rank(a) === 3 ? b.z0 - a.z0 : 0) || zDe(a) - zDe(b) || a.x0 - b.x0);
}
