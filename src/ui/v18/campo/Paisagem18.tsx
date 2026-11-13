/**
 * VIDA 18 · a propriedade desenhada — uma vista 2.5D (o chão em perspectiva, as construções com volume) que mostra o que
 * ela é de verdade: as faixas de lavoura com a cor de cada cultura e o tamanho do talhão, o pasto com o rebanho que há,
 * a reserva de mata, os tanques, a sede, o galpão, o silo, a estufa, o curral, as cocheiras. Nada é enfeite: cada peça
 * só aparece se existe na propriedade. Determinística (a mesma propriedade, o mesmo desenho).
 */
import type { PropriedadeRural18 } from '../../../motor/v18/rural/fazenda18';
import { areaPlantada, areaUtil, qtdEstrutura } from '../../../motor/v18/rural/fazenda18';
import type { CulturaId } from '../../../motor/dados18/rural/catalogo18';

const COR: Record<CulturaId, [string, string]> = {
  soja: ['#c9b75a', '#a6943f'], milho: ['#d8c368', '#9fa64a'], arroz: ['#a9c96a', '#7fa64c'], feijao: ['#8fae5a', '#6d8c43'], algodao: ['#e9e6dc', '#bfb9a6'],
  cana: ['#8cbf5a', '#5f9a3c'], cafe: ['#4f7d3a', '#355a27'], trigo: ['#e2c46e', '#c0a24e'], mandioca: ['#7ea85a', '#5c8442'], frutas: ['#5d9a48', '#e08a3c'],
  horta: ['#6fb35a', '#4f8f3d'], cacau: ['#5a7f3a', '#b0662c'], acai: ['#4d7a3c', '#5b3a6b'], uva: ['#6a8f3e', '#6b3d6e'], eucalipto: ['#5f8f6a', '#3f6a4c'], pinus: ['#3f6a4a', '#2c5038']
};

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

/** Um ponto do chão (u, v em 0..1) na tela: o chão é um trapézio em perspectiva. */
const chao = (u: number, v: number): [number, number] => { const y = 92 + v * 80; const larg = 210 + v * 110; return [160 - larg / 2 + u * larg, y]; };
const quad = (u0: number, v0: number, u1: number, v1: number) => [chao(u0, v0), chao(u1, v0), chao(u1, v1), chao(u0, v1)].map(p => p.join(',')).join(' ');

function Casa({ x, y, e = 1, cor = '#efe3cf', telhado = '#b5523b' }: { x: number; y: number; e?: number; cor?: string; telhado?: string }) {
  const w = 26 * e, h = 14 * e, d = 8 * e;
  return (
    <g className="paisagem18__peca">
      <polygon points={`${x},${y} ${x + w},${y} ${x + w + d},${y - d * 0.6} ${x + d},${y - d * 0.6}`} fill="#000" opacity="0.08" transform={`translate(4 ${h + 1})`} />
      <rect x={x} y={y} width={w} height={h} fill={cor} stroke="#6d5a43" strokeWidth="0.6" />
      <polygon points={`${x + w},${y} ${x + w + d},${y - d * 0.6} ${x + w + d},${y + h - d * 0.6} ${x + w},${y + h}`} fill={cor} stroke="#6d5a43" strokeWidth="0.6" opacity="0.85" />
      <polygon points={`${x - 2},${y} ${x + w / 2},${y - 9 * e} ${x + w + 2},${y}`} fill={telhado} />
      <polygon points={`${x + w / 2},${y - 9 * e} ${x + w / 2 + d},${y - 9 * e - d * 0.6} ${x + w + d + 2},${y - d * 0.6} ${x + w + 2},${y}`} fill={telhado} opacity="0.8" />
      <rect x={x + w * 0.42} y={y + h * 0.45} width={w * 0.16} height={h * 0.55} fill="#7a5a3a" />
      <rect x={x + w * 0.12} y={y + h * 0.3} width={w * 0.18} height={h * 0.3} fill="#9cc6d6" />
      <rect x={x + w * 0.7} y={y + h * 0.3} width={w * 0.18} height={h * 0.3} fill="#9cc6d6" />
    </g>
  );
}

function Galpao({ x, y }: { x: number; y: number }) {
  return (
    <g className="paisagem18__peca">
      <rect x={x} y={y} width={30} height={15} fill="#a64b3a" stroke="#6e2f24" strokeWidth="0.6" />
      <polygon points={`${x - 2},${y} ${x + 15},${y - 8} ${x + 32},${y}`} fill="#7c3a2c" />
      <rect x={x + 10} y={y + 4} width={10} height={11} fill="#6e2f24" />
      <path d={`M${x + 10} ${y + 4} L${x + 20} ${y + 15} M${x + 20} ${y + 4} L${x + 10} ${y + 15}`} stroke="#e7d6c0" strokeWidth="0.8" />
    </g>
  );
}
function Silo({ x, y }: { x: number; y: number }) {
  return (
    <g className="paisagem18__peca">
      <rect x={x} y={y} width={9} height={22} fill="#cfd4d6" stroke="#8a9296" strokeWidth="0.6" />
      <ellipse cx={x + 4.5} cy={y} rx={4.5} ry={2} fill="#e6eaec" stroke="#8a9296" strokeWidth="0.5" />
      <path d={`M${x} ${y + 7} h9 M${x} ${y + 14} h9`} stroke="#9aa2a6" strokeWidth="0.5" />
    </g>
  );
}
function Estufa({ x, y }: { x: number; y: number }) {
  return <g className="paisagem18__peca"><path d={`M${x} ${y + 10} Q${x + 13} ${y - 6} ${x + 26} ${y + 10} Z`} fill="#dff0f2" stroke="#9cb9bd" strokeWidth="0.6" opacity="0.9" /><path d={`M${x + 6} ${y + 10} v-6 M${x + 13} ${y + 10} v-8 M${x + 20} ${y + 10} v-6`} stroke="#9cb9bd" strokeWidth="0.5" /></g>;
}
function Arvore({ x, y, s = 1, cor = '#4f7f45' }: { x: number; y: number; s?: number; cor?: string }) {
  return <g><rect x={x - 0.6 * s} y={y - 2 * s} width={1.2 * s} height={3 * s} fill="#6b4a2f" /><circle cx={x} cy={y - 4 * s} r={3.4 * s} fill={cor} /></g>;
}
function Pinheiro({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <polygon points={`${x},${y - 9 * s} ${x - 3 * s},${y} ${x + 3 * s},${y}`} fill="#3f6a4a" />;
}
function Animal({ x, y, tipo }: { x: number; y: number; tipo: string }) {
  if (tipo === 'cavalos') return <g><rect x={x} y={y - 3} width={6} height={3} rx={1} fill="#7a4a2a" /><rect x={x + 5} y={y - 6} width={2} height={4} fill="#7a4a2a" /><path d={`M${x + 1} ${y} v2 M${x + 5} ${y} v2`} stroke="#4a2c18" strokeWidth="0.7" /></g>;
  if (tipo === 'ovelhas' || tipo === 'cabras') return <g><ellipse cx={x + 2} cy={y - 1.5} rx={2.4} ry={1.6} fill={tipo === 'ovelhas' ? '#f3efe6' : '#b9a58a'} /><circle cx={x + 4.6} cy={y - 2.2} r={0.9} fill="#3a3a3a" /></g>;
  if (tipo === 'porcos') return <ellipse cx={x + 2} cy={y - 1.4} rx={2.4} ry={1.5} fill="#e9b1a6" />;
  if (tipo === 'galinhas' || tipo === 'frangos') return <circle cx={x} cy={y - 1} r={0.9} fill="#f4f1e8" />;
  const malhado = tipo === 'leite';
  return <g><rect x={x} y={y - 3} width={6} height={3} rx={1} fill={malhado ? '#f4f1ea' : '#cdb79a'} /><rect x={x + 5.3} y={y - 4.3} width={2} height={2.2} fill={malhado ? '#2e2e2e' : '#a88d6c'} />{malhado && <circle cx={x + 2.5} cy={y - 1.8} r={1} fill="#2e2e2e" />}<path d={`M${x + 1} ${y} v1.6 M${x + 5} ${y} v1.6`} stroke="#555" strokeWidth="0.6" /></g>;
}

export function Paisagem18({ p, pequena, vazia }: { p?: PropriedadeRural18; pequena?: boolean; vazia?: boolean }) {
  const semente = hash(p?.id ?? 'vazia');
  const util = p ? Math.max(0.1, areaUtil(p)) : 1;
  const reserva = p ? Math.max(0.12, 1 - util / p.ha) : 0.25;
  const plantada = p ? areaPlantada(p) : 0;
  const tanques = p ? qtdEstrutura(p, 'tanques') : 0;
  // As faixas do chão: lavoura (talhões na ordem), pasto, tanques; a reserva fica no fundo, como mata.
  const faixas: { u0: number; u1: number; cultura?: CulturaId; pasto?: boolean }[] = [];
  let u = 0;
  if (p) for (const t of p.talhoes) { const w = Math.max(0.06, (t.ha / util) * (1 - 0.1)); faixas.push({ u0: u, u1: Math.min(1, u + w), cultura: t.cultura }); u = Math.min(1, u + w); }
  if (u < 1) faixas.push({ u0: u, u1: 1, pasto: true });
  const rebanho = p?.rebanhos.filter(r => r.especie !== 'tilapia' && r.especie !== 'tambaqui') ?? [];
  const animais = rebanho.flatMap(r => Array.from({ length: Math.min(9, Math.max(1, Math.round(Math.log2(r.cabecas + 1) * 1.4))) }, () => r.especie));
  const pasto = faixas.find(f => f.pasto);
  const vb = '0 0 320 180';
  return (
    <svg className={`paisagem18${pequena ? ' paisagem18--pequena' : ''}`} viewBox={vb} role="img" aria-label={p ? `${p.nome}: ${p.talhoes.length ? `${p.talhoes.length} talhões` : 'sem lavoura'}${rebanho.length ? ', com rebanho' : ''}` : 'Campo aberto'} preserveAspectRatio={pequena ? "xMidYMid slice" : "xMidYMax slice"}>
      <defs>
        <linearGradient id={`ceu-${pequena ? 'p' : 'g'}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--p18-ceu-alto)" /><stop offset="1" stopColor="var(--p18-ceu-baixo)" /></linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#ceu-${pequena ? 'p' : 'g'})`} />
      <circle cx={250 - semente * 60} cy="34" r="12" fill="var(--p18-sol)" opacity="0.9" />
      <path d={`M0 92 Q60 ${62 + semente * 10} 120 84 T240 ${74 + semente * 8} T320 86 V100 H0Z`} fill="var(--p18-morro-longe)" />
      <path d={`M0 98 Q80 ${80 + semente * 6} 160 94 T320 92 V104 H0Z`} fill="var(--p18-morro)" />
      {/* A reserva de mata, no fundo do chão. */}
      <polygon points={quad(0, 0, 1, Math.min(0.32, reserva * 0.55))} fill="var(--p18-mata)" />
      {Array.from({ length: 14 }, (_, k) => { const [x, y] = chao((k + 0.5) / 14, Math.min(0.3, reserva * 0.5) * (0.4 + ((k * 7) % 5) / 8)); return <Arvore key={k} x={x} y={y} s={0.9} cor={k % 3 ? 'var(--p18-mata-escura)' : 'var(--p18-mata-clara)'} />; })}
      {/* O chão: faixas de lavoura e o pasto. */}
      {faixas.map((f, k) => {
        const v0 = Math.min(0.32, reserva * 0.55);
        const pts = quad(f.u0, v0, f.u1, 1);
        if (f.pasto) return <polygon key={k} points={pts} fill={vazia ? 'var(--p18-terra)' : 'var(--p18-pasto)'} />;
        const [c1, c2] = COR[f.cultura!];
        return (
          <g key={k}>
            <polygon points={pts} fill={c1} />
            {Array.from({ length: 7 }, (_, j) => { const uu = f.u0 + (f.u1 - f.u0) * (j + 0.5) / 7; const [x0, y0] = chao(uu, v0 + 0.02); const [x1, y1] = chao(uu, 0.98); return <line key={j} x1={x0} y1={y0} x2={x1} y2={y1} stroke={c2} strokeWidth="1.2" opacity="0.7" />; })}
            {(f.cultura === 'eucalipto' || f.cultura === 'pinus' || f.cultura === 'frutas' || f.cultura === 'cafe' || f.cultura === 'cacau' || f.cultura === 'acai') && Array.from({ length: 6 }, (_, j) => { const [x, y] = chao(f.u0 + (f.u1 - f.u0) * ((j % 3) + 0.5) / 3, v0 + 0.25 + Math.floor(j / 3) * 0.35); return f.cultura === 'pinus' ? <Pinheiro key={j} x={x} y={y} /> : <Arvore key={j} x={x} y={y} s={f.cultura === 'eucalipto' ? 1.3 : 0.8} cor={c2} />; })}
          </g>
        );
      })}
      {/* Cercas entre as faixas. */}
      {faixas.slice(1).map((f, k) => { const [x0, y0] = chao(f.u0, Math.min(0.32, reserva * 0.55)); const [x1, y1] = chao(f.u0, 1); return <line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--p18-cerca)" strokeWidth="0.8" strokeDasharray="2 1.5" />; })}
      {/* Tanques de peixe. */}
      {tanques > 0 && Array.from({ length: Math.min(4, tanques) }, (_, k) => { const [x, y] = chao(0.12 + k * 0.2, 0.72); return <ellipse key={k} cx={x} cy={y} rx={14} ry={5} fill="var(--p18-agua)" stroke="var(--p18-agua-borda)" strokeWidth="0.8" />; })}
      {/* O rebanho no pasto. */}
      {pasto && animais.map((a, k) => { const uu = pasto.u0 + (pasto.u1 - pasto.u0) * (0.15 + ((k * 37 + semente * 100) % 70) / 100); const vv = 0.55 + ((k * 23) % 40) / 100; const [x, y] = chao(Math.min(0.97, uu), Math.min(0.97, vv)); return <Animal key={k} x={x} y={y} tipo={a} />; })}
      {/* As construções, à frente, na ordem da estrada. */}
      {p && qtdEstrutura(p, 'sede') > 0 && <Casa x={34} y={120} e={1.15} />}
      {p && (qtdEstrutura(p, 'galpao') > 0 || qtdEstrutura(p, 'aviario') > 0 || qtdEstrutura(p, 'ordenha') > 0 || qtdEstrutura(p, 'pocilga') > 0) && <Galpao x={84} y={128} />}
      {p && qtdEstrutura(p, 'silo') > 0 && <><Silo x={120} y={118} />{qtdEstrutura(p, 'silo') > 1 && <Silo x={131} y={120} />}</>}
      {p && qtdEstrutura(p, 'estufa') > 0 && <Estufa x={250} y={140} />}
      {p && (qtdEstrutura(p, 'curral') > 0 || qtdEstrutura(p, 'cocheiras') > 0) && <path d="M196 150 h40 M196 156 h40 M198 148 v10 M210 148 v10 M222 148 v10 M234 148 v10" stroke="var(--p18-cerca)" strokeWidth="1" />}
      {p && qtdEstrutura(p, 'solar') > 0 && <polygon points="150,150 172,150 176,143 154,143" fill="#2f4f7a" stroke="#b9c7d8" strokeWidth="0.5" />}
      {p && qtdEstrutura(p, 'represa') > 0 && <ellipse cx="292" cy="112" rx="22" ry="6" fill="var(--p18-agua)" />}
      {p && plantada === 0 && rebanho.length === 0 && !vazia && <text x="160" y="160" textAnchor="middle" className="paisagem18__vazio">terra sem produção</text>}
      {/* A estrada de chão. */}
      <path d="M160 180 Q150 150 130 132 T60 112" fill="none" stroke="var(--p18-estrada)" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}
