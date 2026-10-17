/**
 * REWORK 8 (Fase B) — o núcleo da linguagem de ilustração do VIDA: a direção A + B escolhida pelo usuário.
 *
 *   A · Catálogo editorial (a base): formas precisas, cor MATERIAL chapada (a do objeto, nunca a da paleta), contorno
 *       discreto — um fio fino da própria cor escurecida, com espessura constante na tela —, o detalhe que distingue.
 *   B · só o necessário: um volume sutil (a luz de cima, um pouco mais escuro embaixo) e a sombra de contato no chão.
 *
 * Como um desenho é feito: uma AMOSTRA é uma lista de PEÇAS SEMÂNTICAS (massa pintada, vidro, metal, pneu, luz,
 * linha de detalhe, letreiro, grupo). A amostra diz o que cada parte é; este renderizador decide como pintar — por isso
 * todas as famílias (veículos, objetos, lugares, casas) falam a mesma língua. Cada família é feita por PARÂMETROS
 * (um carro é um perfil de números), não por desenhos copiados.
 *
 * Níveis (o pedido §7): 1 · navegação (< 48 px) — só a silhueta e o que a identifica (as linhas finas e os letreiros
 * saem); 2 · identificação (48–140 px); 3 · destaque (≥ 140 px) — com os detalhes `so3`.
 *
 * Nada disto entra no save: a forma sai do dado que o jogo já tem (o modelo, a cor, o acabamento, a semente).
 */
import type { ReactElement } from 'react';

export type Pt = [number, number];

/* ============================================================== Cor */

const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const paraHex = (c: number[]) => `#${c.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
export const valida = (c?: string, padrao = '#9aa0a6') => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : padrao);
export const escurecer = (h: string, k = 0.3) => paraHex(hex(h).map(x => x * (1 - k)));
export const clarear = (h: string, k = 0.35) => paraHex(hex(h).map(x => x + (255 - x) * k));
export const misturar = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return paraHex(A.map((x, k) => x * (1 - t) + B[k] * t)); };
export const luminancia = (h: string) => { const [r, g, b] = hex(h).map(x => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

/** A tinta do contorno: a cor do próprio objeto escurecida e puxada para o grafite (discreta, nunca um preto de ícone). */
const TINTA = '#2b2724';
/**
 * O contorno de uma massa. Objeto quase preto ganha um fio claro (não some no papel escuro — o gato preto, o carro
 * preto); objeto quase branco, um fio mais firme (não some no papel claro — o carro branco, o gato branco).
 */
export function contorno(cor: string): string {
  const l = luminancia(cor);
  if (l < 0.03) return '#857e75';
  if (l > 0.72) return misturar(escurecer(cor, 0.5), TINTA, 0.45);
  return misturar(escurecer(cor, 0.5), TINTA, 0.3);
}

/* ============================================================== Geometria */

const f = (n: number) => Math.round(n * 10) / 10;
export const num = f;
/** Polilinha com cantos arredondados; cada vértice pode trazer o seu raio ([x, y, r]). */
export function cantos(pts: (Pt | [number, number, number])[], fechar = true, rPadrao = 2): string {
  const P = pts.map(p => [p[0], p[1], (p as number[])[2] ?? rPadrao]);
  const n = P.length;
  let d = '';
  for (let k = 0; k < n; k++) {
    const b = P[k];
    const a = P[(k - 1 + n) % n], c = P[(k + 1) % n];
    const aberto = !fechar && (k === 0 || k === n - 1);
    if (aberto || b[2] <= 0) { d += `${k ? 'L' : 'M'}${f(b[0])} ${f(b[1])}`; continue; }
    const corta = (p: number[]) => { const dx = p[0] - b[0], dy = p[1] - b[1], L = Math.hypot(dx, dy) || 1, t = Math.min(b[2], L / 2) / L; return [b[0] + dx * t, b[1] + dy * t]; };
    const [p, q] = [corta(a), corta(c)];
    d += `${k ? 'L' : 'M'}${f(p[0])} ${f(p[1])}Q${f(b[0])} ${f(b[1])} ${f(q[0])} ${f(q[1])}`;
  }
  return d + (fechar ? 'Z' : '');
}
/** Retângulo de cantos arredondados (atalho de `cantos`). */
export const ret = (x: number, y: number, w: number, h: number, r = 1.5) => cantos([[x, y, r], [x + w, y, r], [x + w, y + h, r], [x, y + h, r]]);
/** Curva suave por pontos (Catmull-Rom → Bézier). */
export function suave(pts: Pt[], fechar = true, tensao = 0.5): string {
  const n = pts.length;
  const p = (k: number) => pts[fechar ? (k + n) % n : Math.max(0, Math.min(n - 1, k))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let k = 0; k < (fechar ? n : n - 1); k++) {
    const [p0, p1, p2, p3] = [p(k - 1), p(k), p(k + 1), p(k + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) * tensao / 3, p1[1] + (p2[1] - p0[1]) * tensao / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * tensao / 3, p2[1] - (p3[1] - p1[1]) * tensao / 3];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (fechar ? 'Z' : '');
}
/** Um membro (a perna, a cauda, o braço do instrumento): a linha do meio com a largura de cada ponto → contorno liso. */
export function membro(eixo: Pt[], larg: number[]): string {
  const n = eixo.length;
  const normal = (k: number): Pt => { const a = eixo[Math.max(0, k - 1)], b = eixo[Math.min(n - 1, k + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
  const esq: Pt[] = [], dir: Pt[] = [];
  eixo.forEach((p, k) => { const [nx, ny] = normal(k); const w = larg[k] / 2; esq.push([p[0] + nx * w, p[1] + ny * w]); dir.push([p[0] - nx * w, p[1] - ny * w]); });
  return suave([...esq, ...dir.reverse()], true, 0.45);
}
/** Recorta um polígono convexo entre duas verticais (as janelas entre as colunas). */
export function entreX(poly: Pt[], x0: number, x1: number): Pt[] {
  const corta = (pts: Pt[], x: number, manter: (p: Pt) => boolean): Pt[] => pts.flatMap((pp, k) => {
    const q = pts[(k + 1) % pts.length]; const out: Pt[] = manter(pp) ? [pp] : [];
    if (manter(pp) !== manter(q)) { const t = (x - pp[0]) / (q[0] - pp[0]); out.push([x, pp[1] + (q[1] - pp[1]) * t]); }
    return out;
  });
  return corta(corta(poly, x0, pp => pp[0] >= x0), x1, pp => pp[0] <= x1);
}
export const poligono = (pts: Pt[]) => (pts.length ? `M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z` : '');
export const circulo = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
export const elipse = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;

/** Hash estável de um texto (para a variação de um indivíduo: a mesma semente dá sempre o mesmo desenho). */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
/** Quatro números em [-1, 1] estáveis por semente. */
export const variacao = (s?: string): [number, number, number, number] => { if (!s) return [0, 0, 0, 0]; const h = hash(s); return [0, 8, 16, 24].map(k => (((h >>> k) & 255) / 127.5) - 1) as [number, number, number, number]; };

/* ============================================================== Peças */

interface Comum {
  /** Só aparece no destaque (≥ 140 px): o detalhe que não cabe pequeno. */
  so3?: boolean;
  /** Some na navegação (< 48 px). */
  fino?: boolean;
  /** Marca para os testes e as auditorias (o que é esta parte: 'helice', 'cacamba', 'porta'...). */
  marca?: string;
  /** Classe e atributos extras do elemento (os contratos de antes: `cena__janela--acesa`, `data-condicao`...). */
  classe?: string;
  attrs?: Record<string, string>;
}
export type Peca = Comum & (
  | { tipo: 'massa'; d: string; cor: string; semVolume?: boolean; opacidade?: number }
  | { tipo: 'vidro'; d: string; claro?: boolean }
  | { tipo: 'metal'; d: string; cor?: string }
  | { tipo: 'linha'; d: string; larg?: number; cor?: string }
  | { tipo: 'pneu'; cx: number; cy: number; r: number; aro?: 'raios' | 'liga' | 'bicicleta' | 'cravos' | 'calota'; raios?: number }
  | { tipo: 'luz'; d: string; cor: string }
  | { tipo: 'texto'; x: number; y: number; texto: string; tam: number; cor: string }
  | { tipo: 'grupo'; t: string; pecas: Peca[] }
);

export interface Amostra {
  /** O tamanho do desenho (viewBox). */
  vb: [number, number];
  /** A linha do chão (para a sombra de contato), quando o objeto está no chão. */
  chao?: number;
  /** A sombra de contato: o centro e a meia-largura. */
  sombra?: [number, number];
  pecas: Peca[];
}

/* ============================================================== O renderizador (A + B) */

/**
 * Um cache pequeno para as amostras (os desenhos são funções puras dos dados: o mesmo carro, na mesma cor, é o mesmo
 * desenho). Sem limite de memória: passou do teto, recomeça.
 */
export function lembrar<T>(teto = 600): (chave: string, fazer: () => T) => T {
  const m = new Map<string, T>();
  return (chave, fazer) => {
    let x = m.get(chave);
    if (x === undefined) { if (m.size >= teto) m.clear(); x = fazer(); m.set(chave, x); }
    return x;
  };
}
/** O id dos gradientes vem do PRÓPRIO desenho (o mesmo desenho sai idêntico em qualquer tela), calculado uma vez por amostra. */
const IDS = new WeakMap<Amostra, string>();
function idDaAmostra(a: Amostra): string {
  let id = IDS.get(a);
  if (!id) { id = hash(`${a.vb}|${JSON.stringify(a.pecas)}`).toString(36); IDS.set(a, id); }
  return id;
}

export interface PropsIlustracao {
  a: Amostra;
  largura: number;
  rotulo?: string;
  className?: string;
  /** Atributos para os testes e auditorias (data-forma, data-modelo...). */
  dados?: Record<string, string>;
  /** Sem a sombra no chão (um objeto pendurado, um ícone). */
  semChao?: boolean;
  style?: Record<string, string | number>;
  /** Como o desenho ocupa uma caixa de outra proporção (a fachada que preenche a vitrine: "xMidYMax slice"). */
  ajuste?: string;
  /** A altura em px quando não é a da proporção (com `ajuste`). */
  altura?: number;
}

export function Ilustracao({ a, largura, rotulo, className, dados, semChao, style, ajuste, altura: alturaFixa }: PropsIlustracao): ReactElement {
  const [w, h] = a.vb;
  const altura = alturaFixa ?? Math.round((largura * h) / w);
  const nivel = largura < 48 ? 1 : largura < 140 ? 2 : 3;
  // Dois desenhos iguais na mesma página dividem o id — sem problema: os gradientes são os mesmos.
  const id = `il${idDaAmostra(a)}${nivel}`;
  // O fio é constante NA TELA (non-scaling-stroke): 1 px na miniatura e no destaque, um pouco mais firme no grande.
  const fio = nivel === 3 ? 1.15 : nivel === 2 ? 1 : 0.9;
  const luz = `${id}l`, reflexo = `${id}r`;
  let usaLuz = false, usaReflexo = false;
  const visivel = (p: Peca) => !(p.so3 && nivel < 3) && !(p.fino && nivel < 2) && !(p.tipo === 'texto' && nivel < 2) && !(p.tipo === 'linha' && !p.larg && nivel === 1);
  const desenhar = (lista: Peca[]): ReactElement[] => lista.filter(visivel).map((p, i): ReactElement => {
    const m = { 'data-peca': p.marca ?? p.tipo, ...(p.classe ? { className: p.classe } : {}), ...p.attrs };
    switch (p.tipo) {
      case 'massa': {
        const cor = p.cor;
        const volume = !p.semVolume && nivel > 1;
        if (volume) usaLuz = true;
        return (
          <g key={i} {...m}>
            <path d={p.d} fill={cor} fillOpacity={p.opacidade} stroke={contorno(cor)} strokeWidth={fio} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            {volume && <path d={p.d} fill={`url(#${luz})`} />}
          </g>
        );
      }
      case 'vidro':
        usaReflexo = nivel > 1;
        return (
          <g key={i} {...m}>
            <path d={p.d} fill={p.claro ? '#a7bac6' : '#34434e'} stroke={TINTA} strokeOpacity={0.55} strokeWidth={fio * 0.8} vectorEffect="non-scaling-stroke" />
            {nivel > 1 && <path d={p.d} fill={`url(#${reflexo})`} />}
          </g>
        );
      case 'metal': {
        const cor = p.cor ?? '#b8b4ad';
        usaLuz = usaLuz || nivel > 1;
        return <g key={i} {...m}><path d={p.d} fill={cor} stroke={contorno(cor)} strokeWidth={fio * 0.8} vectorEffect="non-scaling-stroke" />{nivel > 1 && <path d={p.d} fill={`url(#${luz})`} />}</g>;
      }
      case 'linha':
        return <path key={i} {...m} d={p.d} fill="none" stroke={p.cor ?? TINTA} strokeOpacity={p.cor ? 1 : 0.5} strokeWidth={(p.larg ?? 0.8) * fio} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />;
      case 'luz':
        return <path key={i} {...m} d={p.d} fill={p.cor} stroke={contorno(p.cor)} strokeOpacity={0.7} strokeWidth={fio * 0.6} vectorEffect="non-scaling-stroke" />;
      case 'texto':
        return <text key={i} {...m} x={p.x} y={p.y} fontSize={p.tam} fill={p.cor} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight={700} letterSpacing={p.tam * 0.16}>{p.texto}</text>;
      case 'grupo':
        return <g key={i} {...m} transform={p.t}>{desenhar(p.pecas)}</g>;
      case 'pneu': {
        const { cx, cy, r, aro } = p;
        if (aro === 'bicicleta') {
          const n = p.raios ?? 14;
          const raios = nivel > 1 ? Array.from({ length: n }, (_, j) => { const g = (j / n) * Math.PI * 2; return `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(g) * (r - 2.6))} ${f(cy + Math.sin(g) * (r - 2.6))}`; }).join('') : '';
          return (
            <g key={i} {...m}>
              <circle cx={cx} cy={cy} r={r - 1.2} fill="none" stroke="#25221f" strokeWidth={2.4} />
              <circle cx={cx} cy={cy} r={r - 2.6} fill="none" stroke="#a9a59e" strokeWidth={0.8} />
              {raios && <path d={raios} stroke="#8d8a85" strokeWidth={0.45} />}
              <circle cx={cx} cy={cy} r={1.9} fill="#8d8a85" />
            </g>
          );
        }
        const aroCor = '#cdc8bf';
        usaLuz = usaLuz || nivel > 1;
        const n = p.raios ?? (aro === 'liga' ? 5 : 6);
        const desenhoAro = nivel === 1 ? null
          : aro === 'liga' ? <path d={Array.from({ length: n }, (_, j) => { const g = (j / n) * Math.PI * 2 - Math.PI / 2; return `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(g) * r * 0.56)} ${f(cy + Math.sin(g) * r * 0.56)}`; }).join('')} stroke={escurecer(aroCor, 0.4)} strokeWidth={r * 0.13} strokeLinecap="round" />
            : aro === 'raios' ? <path d={Array.from({ length: 16 }, (_, j) => { const g = (j / 16) * Math.PI * 2; return `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(g) * r * 0.62)} ${f(cy + Math.sin(g) * r * 0.62)}`; }).join('')} stroke={escurecer(aroCor, 0.3)} strokeWidth={0.4} />
              : <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke={escurecer(aroCor, 0.25)} strokeWidth={0.6} />;
        return (
          <g key={i} {...m}>
            <circle cx={cx} cy={cy} r={r} fill="#26231f" stroke="#857e75" strokeOpacity={0.55} strokeWidth={fio * 0.7} vectorEffect="non-scaling-stroke" />
            {aro === 'cravos' && nivel > 1 && <circle cx={cx} cy={cy} r={r - 0.8} fill="none" stroke="#45403a" strokeWidth={r * 0.14} strokeDasharray={`${f(r * 0.22)} ${f(r * 0.16)}`} />}
            <circle cx={cx} cy={cy} r={r * (aro === 'raios' ? 0.66 : 0.6)} fill={aroCor} stroke={escurecer(aroCor, 0.45)} strokeWidth={fio * 0.6} vectorEffect="non-scaling-stroke" />
            {nivel > 1 && <circle cx={cx} cy={cy} r={r * 0.6} fill={`url(#${luz})`} />}
            {desenhoAro}
            <circle cx={cx} cy={cy} r={r * 0.15} fill="#6b6660" />
          </g>
        );
      }
    }
  });
  const partes = desenhar(a.pecas);
  const sombra = a.sombra && a.chao !== undefined && !semChao
    ? <ellipse data-peca="sombra" cx={a.sombra[0]} cy={a.chao + 0.6} rx={a.sombra[1]} ry={Math.max(1.6, a.vb[1] * 0.022)} fill="#000000" opacity={0.15} />
    : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={largura} height={altura} preserveAspectRatio={ajuste} className={className} role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true} data-nivel={nivel} style={style} {...dados}>
      {(usaLuz || usaReflexo) && (
        <defs>
          {usaLuz && <linearGradient id={luz} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity={0.26} /><stop offset="0.42" stopColor="#ffffff" stopOpacity={0} /><stop offset="0.7" stopColor="#000000" stopOpacity={0} /><stop offset="1" stopColor="#000000" stopOpacity={0.13} /></linearGradient>}
          {usaReflexo && <linearGradient id={reflexo} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity={0.42} /><stop offset="0.38" stopColor="#ffffff" stopOpacity={0.04} /><stop offset="0.56" stopColor="#ffffff" stopOpacity={0.22} /><stop offset="1" stopColor="#ffffff" stopOpacity={0} /></linearGradient>}
        </defs>
      )}
      {sombra}
      {partes}
    </svg>
  );
}
