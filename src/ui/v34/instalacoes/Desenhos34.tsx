/**
 * VIDA 34 · OS DESENHOS DAS INSTALAÇÕES — vistos de cima, no tamanho que o time tem: o estádio (arquibancadas que
 * crescem do alambrado ao estádio fechado, cadeiras, cobertura, refletores, telão, o gramado cortado), o CT, a base, o
 * ginásio (com as linhas da modalidade) e a gaming house (as salas, os PCs de cada line, o estúdio, os troféus).
 */
import type { Instalacoes34 } from '../../../motor/v33/dono/instalacoes34';

export interface Cores34 { cor1: string; cor2: string; cor3?: string }
const CINZA = '#9aa1a9';
function claro(c: string) { const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return false; const n = parseInt(m[1], 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170; }
/** A cor do assento k da fileira r (o mosaico alterna as duas cores do time). */
function corDaCadeira(i: Instalacoes34, c: Cores34, r: number, k = 0): string {
  switch (i.cadeiras ?? 'time') {
    case 'cor1': return c.cor1;
    case 'cor2': return c.cor2;
    case 'cinza': return CINZA;
    case 'mosaico': return (r + k) % 2 ? c.cor1 : c.cor2;
    default: return r % 3 === 2 ? c.cor2 : c.cor1;
  }
}

function Gramado({ x, y, w, h, tipo }: { x: number; y: number; w: number; h: number; tipo: Instalacoes34['gramado'] }) {
  const A = '#2f8a46', B = '#3a9a52';
  const faixas = [];
  if (tipo === 'listras' || tipo === undefined) for (let k = 0; k < 10; k++) if (k % 2) faixas.push(<rect key={k} x={x + (k * w) / 10} y={y} width={w / 10} height={h} fill={B} />);
  if (tipo === 'xadrez') for (let a = 0; a < 10; a++) for (let b = 0; b < 6; b++) if ((a + b) % 2) faixas.push(<rect key={`${a}-${b}`} x={x + (a * w) / 10} y={y + (b * h) / 6} width={w / 10} height={h / 6} fill={B} />);
  if (tipo === 'circulos') for (let k = 6; k > 0; k--) faixas.push(<ellipse key={k} cx={x + w / 2} cy={y + h / 2} rx={(k * w) / 11} ry={(k * h) / 11} fill={k % 2 ? B : A} />);
  return <g><rect x={x} y={y} width={w} height={h} fill={A} />{faixas}</g>;
}

function LinhasFutebol({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const s = { fill: 'none', stroke: '#ffffff', strokeWidth: 1.2, opacity: 0.9 } as const;
  const ah = h * 0.55, aw = w * 0.14, ph = h * 0.25, pw = w * 0.05;
  return (
    <g>
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} {...s} />
      <line x1={x + w / 2} y1={y + 4} x2={x + w / 2} y2={y + h - 4} {...s} />
      <circle cx={x + w / 2} cy={y + h / 2} r={h * 0.14} {...s} />
      <rect x={x + 4} y={y + (h - ah) / 2} width={aw} height={ah} {...s} /><rect x={x + w - 4 - aw} y={y + (h - ah) / 2} width={aw} height={ah} {...s} />
      <rect x={x + 4} y={y + (h - ph) / 2} width={pw} height={ph} {...s} /><rect x={x + w - 4 - pw} y={y + (h - ph) / 2} width={pw} height={ph} {...s} />
    </g>
  );
}

/** Uma arquibancada: um retângulo com as fileiras (as cadeiras em blocos). */
function Arquibancada({ x, y, w, h, fileiras, vertical, i, c, coberta }: { x: number; y: number; w: number; h: number; fileiras: number; vertical?: boolean; i: Instalacoes34; c: Cores34; coberta?: boolean }) {
  const linhas = [];
  const blocos = vertical ? Math.max(3, Math.round(h / 14)) : Math.max(3, Math.round(w / 14));
  for (let r = 0; r < fileiras; r++)
    for (let k = 0; k < blocos; k++) {
      const fx = vertical ? x + (r * w) / fileiras : x + (k * w) / blocos;
      const fy = vertical ? y + (k * h) / blocos : y + (r * h) / fileiras;
      const fw = vertical ? w / fileiras - 0.8 : w / blocos - 0.8;
      const fh = vertical ? h / blocos - 0.8 : h / fileiras - 0.8;
      linhas.push(<rect key={`${r}-${k}`} x={fx} y={fy} width={fw} height={fh} fill={corDaCadeira(i, c, r, k)} />);
    }
  return <g><rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} fill="#5b636c" />{linhas}{coberta && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="#e8ecef" opacity="0.55" stroke="#ffffff" strokeWidth="0.8" />}</g>;
}

const CAPACIDADE = [0, 4000, 12000, 25000, 45000, 70000];
export const capacidade34 = (nivel: number) => CAPACIDADE[Math.max(1, Math.min(5, nivel))];

/** O estádio de cima: o nível (1 a 5) decide quantas arquibancadas, quantas fileiras, refletores, telão. */
export function Estadio34({ nivel, i, c, sigla, nome }: { nivel: number; i: Instalacoes34; c: Cores34; sigla: string; nome: string }) {
  const n = Math.max(1, Math.min(5, nivel));
  const fx = 70, fy = 52, fw = 180, fh = 106;
  const fil = [0, 3, 4, 5, 6, 7][n];
  const cob = i.cobertura ?? (n >= 5 ? 'total' : 'nenhuma');
  const prof = fil * 5;
  const telao = i.telao ?? n >= 4;
  return (
    <svg viewBox="0 0 320 210" className="inst34__svg" role="img" aria-label={`${nome}: estádio para cerca de ${capacidade34(n).toLocaleString('pt-BR')} pessoas`}>
      <rect width="320" height="210" fill="#cfd6cf" />
      {n >= 5 && <rect x={fx - prof - 12} y={fy - prof - 12} width={fw + 2 * prof + 24} height={fh + 2 * prof + 24} rx="40" fill="#8b939c" />}
      {/* a principal (embaixo) existe sempre; as laterais (atrás dos gols) a partir do 3; a de cima a partir do 2 */}
      <Arquibancada x={fx} y={fy + fh + 6} w={fw} h={prof} fileiras={fil} i={i} c={c} coberta={cob !== 'nenhuma'} />
      {n >= 2 && <Arquibancada x={fx} y={fy - 6 - prof} w={fw} h={prof} fileiras={fil} i={i} c={c} coberta={cob === 'total'} />}
      {n >= 3 && <Arquibancada x={fx - 6 - prof} y={fy} w={prof} h={fh} fileiras={fil} vertical i={i} c={c} coberta={cob === 'total'} />}
      {n >= 3 && <Arquibancada x={fx + fw + 6} y={fy} w={prof} h={fh} fileiras={fil} vertical i={i} c={c} coberta={cob === 'total'} />}
      {n >= 4 && [[fx - 6 - prof, fy - 6 - prof], [fx + fw + 6, fy - 6 - prof], [fx - 6 - prof, fy + fh + 6], [fx + fw + 6, fy + fh + 6]].map(([x, y], k) => <rect key={k} x={x} y={y} width={prof} height={prof} fill={corDaCadeira(i, c, k)} stroke="#5b636c" opacity={cob === 'total' ? 0.7 : 1} />)}
      <rect x={fx - 4} y={fy - 4} width={fw + 8} height={fh + 8} fill="#2a7a3e" />
      <Gramado x={fx} y={fy} w={fw} h={fh} tipo={i.gramado} />
      <LinhasFutebol x={fx} y={fy} w={fw} h={fh} />
      <rect x={fx + 2} y={fy + fh / 2 - 7} width="3" height="14" fill="#ffffff" /><rect x={fx + fw - 5} y={fy + fh / 2 - 7} width="3" height="14" fill="#ffffff" />
      {(i.letreiro ?? true) && <text x={fx + fw / 2} y={fy + fh + 6 + prof / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={claro(i.cadeiras === 'cor2' ? c.cor2 : c.cor1) ? '#111111' : '#ffffff'} fontFamily="system-ui, sans-serif" letterSpacing="2">{sigla}</text>}
      {n >= 2 && [[fx - prof - 10, fy - prof - 10], [fx + fw + prof + 10, fy - prof - 10], [fx - prof - 10, fy + fh + prof + 10], [fx + fw + prof + 10, fy + fh + prof + 10]].map(([x, y], k) => <g key={k}><circle cx={x} cy={y} r="5" fill="#fff8c4" stroke="#6b7280" /><circle cx={x} cy={y} r="11" fill="#fff8c4" opacity="0.25" /></g>)}
      {telao && <g><rect x={fx + fw + prof + 2} y={fy + fh / 2 - 16} width="10" height="32" fill="#111827" /><rect x={fx + fw + prof + 3.5} y={fy + fh / 2 - 14} width="7" height="28" fill={c.cor1} opacity="0.85" /></g>}
    </svg>
  );
}

function Predio({ x, y, w, h, i, c, rotulo }: { x: number; y: number; w: number; h: number; i: Instalacoes34; c: Cores34; rotulo?: string }) {
  const f = i.fachada ?? 'time';
  const fundo = f === 'concreto' ? '#b9bdc2' : f === 'vidro' ? '#8fc3dd' : f === 'tijolo' ? '#a6533a' : c.cor1;
  const janelas = [];
  for (let a = 0; a < Math.floor(w / 12); a++) janelas.push(<rect key={a} x={x + 4 + a * 12} y={y + 5} width="7" height={h - 10 > 14 ? 6 : h - 10} fill={f === 'vidro' ? '#e6f4fb' : '#f3f4f6'} opacity="0.8" />);
  return <g><rect x={x + 2} y={y + 2} width={w} height={h} fill="#000" opacity="0.15" /><rect x={x} y={y} width={w} height={h} fill={fundo} stroke={c.cor2} strokeWidth="1.5" />{janelas}{rotulo && <text x={x + w / 2} y={y + h - 4} textAnchor="middle" fontSize="7" fill={claro(fundo) ? '#111' : '#fff'} fontFamily="system-ui, sans-serif">{rotulo}</text>}</g>;
}

function Campinho({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <g><Gramado x={x} y={y} w={w} h={h} tipo="listras" /><LinhasFutebol x={x} y={y} w={w} h={h} /></g>;
}

/** O centro de treinamento: campos (1 a 5), o prédio, a academia, a piscina, a concentração. */
export function CT34({ nivel, i, c, nome }: { nivel: number; i: Instalacoes34; c: Cores34; nome: string }) {
  const n = Math.max(1, Math.min(5, nivel));
  const campos = [[14, 14], [118, 14], [14, 110], [118, 110], [222, 110]].slice(0, n);
  return (
    <svg viewBox="0 0 320 210" className="inst34__svg" role="img" aria-label={`${nome}: ${n} ${n === 1 ? 'campo' : 'campos'} de treino`}>
      <rect width="320" height="210" fill="#d9ddd3" />
      <path d="M0 102 H320" stroke="#c2c6bd" strokeWidth="6" />
      {campos.map(([x, y], k) => <Campinho key={k} x={x} y={y} w={96} h={80} />)}
      <Predio x={226} y={14} w={80} h={36} i={i} c={c} rotulo={n >= 5 ? 'vestiário e concentração' : 'vestiário'} />
      {n >= 3 && <Predio x={226} y={56} w={38} h={36} i={i} c={c} rotulo="academia" />}
      {n >= 4 && <g><rect x={270} y={58} width={36} height={32} fill="#6cc3e8" stroke="#ffffff" strokeWidth="2" /><path d="M274 66 H302 M274 74 H302 M274 82 H302" stroke="#ffffff" strokeWidth="0.6" /></g>}
    </svg>
  );
}

/** As categorias de base: o alojamento, a escola, os campos menores. */
export function Base34({ nivel, i, c, nome }: { nivel: number; i: Instalacoes34; c: Cores34; nome: string }) {
  const n = Math.max(1, Math.min(5, nivel));
  const campos = Array.from({ length: Math.min(4, n) }, (_, k) => [14 + (k % 2) * 92, 14 + Math.floor(k / 2) * 96]);
  return (
    <svg viewBox="0 0 320 210" className="inst34__svg" role="img" aria-label={`${nome}: base com ${campos.length} ${campos.length === 1 ? 'campo' : 'campos'}${n >= 2 ? ', alojamento' : ''}${n >= 3 ? ' e escola' : ''}`}>
      <rect width="320" height="210" fill="#dcdcd0" />
      {campos.map(([x, y], k) => <Campinho key={k} x={x} y={y} w={84} h={84} />)}
      {n >= 2 && <Predio x={206} y={14} w={100} h={50} i={i} c={c} rotulo="alojamento" />}
      {n >= 3 && <Predio x={206} y={74} w={100} h={40} i={i} c={c} rotulo="escola" />}
      {n >= 4 && <Predio x={206} y={124} w={48} h={34} i={i} c={c} rotulo="médico" />}
      {n >= 5 && <Predio x={258} y={124} w={48} h={34} i={i} c={c} rotulo="análise" />}
      {n === 1 && <text x="250" y="80" textAnchor="middle" fontSize="9" fill="#4b5563" fontFamily="system-ui, sans-serif">só o campo</text>}
    </svg>
  );
}

const PISO: Record<string, [string, string]> = { madeira: ['#e2b77a', '#d5a766'], escura: ['#9a6a3c', '#8a5c31'], azul: ['#3b6fb6', '#2f5f9f'] };

/** O ginásio: a quadra com as linhas da modalidade, as arquibancadas pelo tamanho, o placar. */
export function Ginasio34({ nivel, modalidade, i, c, sigla, nome }: { nivel: number; modalidade: 'basquete' | 'volei' | 'futsal'; i: Instalacoes34; c: Cores34; sigla: string; nome: string }) {
  const n = Math.max(1, Math.min(5, nivel));
  const [p1, p2] = i.piso === 'cores' ? [c.cor1, c.cor2] : PISO[i.piso ?? 'madeira'];
  const x = 70, y = 56, w = 180, h = 98;
  const fil = n + 1, prof = fil * 5;
  const s = { fill: 'none', stroke: claro(p1) ? '#ffffff' : '#f8fafc', strokeWidth: 1.3 } as const;
  const tabuas = []; for (let k = 0; k < 14; k++) if (k % 2) tabuas.push(<rect key={k} x={x} y={y + (k * h) / 14} width={w} height={h / 14} fill={p2} />);
  return (
    <svg viewBox="0 0 320 210" className="inst34__svg" role="img" aria-label={`${nome}: ginásio com ${fil} fileiras de arquibancada`}>
      <rect width="320" height="210" fill="#4b5563" />
      <Arquibancada x={x} y={y + h + 8} w={w} h={prof} fileiras={fil} i={i} c={c} />
      {n >= 2 && <Arquibancada x={x} y={y - 8 - prof} w={w} h={prof} fileiras={fil} i={i} c={c} />}
      {n >= 4 && <Arquibancada x={x - 8 - prof} y={y} w={prof} h={h} fileiras={fil} vertical i={i} c={c} />}
      {n >= 4 && <Arquibancada x={x + w + 8} y={y} w={prof} h={h} fileiras={fil} vertical i={i} c={c} />}
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill={i.piso === 'cores' ? c.cor2 : '#7a5230'} />
      <rect x={x} y={y} width={w} height={h} fill={p1} />{i.piso !== 'cores' && tabuas}
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} {...s} />
      {modalidade === 'basquete' && <g>
        <line x1={x + w / 2} y1={y + 3} x2={x + w / 2} y2={y + h - 3} {...s} /><circle cx={x + w / 2} cy={y + h / 2} r="12" {...s} />
        <rect x={x + 3} y={y + h / 2 - 12} width="30" height="24" fill={c.cor1} opacity="0.75" stroke="#fff" /><rect x={x + w - 33} y={y + h / 2 - 12} width="30" height="24" fill={c.cor1} opacity="0.75" stroke="#fff" />
        <path d={`M${x + 3} ${y + 10} H${x + 18} A40 40 0 0 1 ${x + 18} ${y + h - 10} H${x + 3}`} {...s} /><path d={`M${x + w - 3} ${y + 10} H${x + w - 18} A40 40 0 0 0 ${x + w - 18} ${y + h - 10} H${x + w - 3}`} {...s} />
        <circle cx={x + 9} cy={y + h / 2} r="3" fill="none" stroke="#f26b21" strokeWidth="1.5" /><circle cx={x + w - 9} cy={y + h / 2} r="3" fill="none" stroke="#f26b21" strokeWidth="1.5" />
      </g>}
      {modalidade === 'volei' && <g>
        <rect x={x + 27} y={y + 12} width={w - 54} height={h - 24} fill={c.cor1} opacity="0.55" />
        <rect x={x + 27} y={y + 12} width={w - 54} height={h - 24} {...s} />
        <line x1={x + w / 2 - 21} y1={y + 12} x2={x + w / 2 - 21} y2={y + h - 12} {...s} /><line x1={x + w / 2 + 21} y1={y + 12} x2={x + w / 2 + 21} y2={y + h - 12} {...s} />
        <line x1={x + w / 2} y1={y + 6} x2={x + w / 2} y2={y + h - 6} stroke="#111827" strokeWidth="2.5" />
      </g>}
      {modalidade === 'futsal' && <g>
        <line x1={x + w / 2} y1={y + 3} x2={x + w / 2} y2={y + h - 3} {...s} /><circle cx={x + w / 2} cy={y + h / 2} r="13" {...s} />
        <path d={`M${x + 3} ${y + h / 2 - 28} A28 28 0 0 1 ${x + 3} ${y + h / 2 + 28}`} fill={c.cor1} opacity="0.5" stroke="#fff" /><path d={`M${x + w - 3} ${y + h / 2 - 28} A28 28 0 0 0 ${x + w - 3} ${y + h / 2 + 28}`} fill={c.cor1} opacity="0.5" stroke="#fff" />
        <rect x={x - 3} y={y + h / 2 - 8} width="5" height="16" fill="#ffffff" /><rect x={x + w - 2} y={y + h / 2 - 8} width="5" height="16" fill="#ffffff" />
      </g>}
      <text x={x + w / 2} y={y + h / 2 + (modalidade === 'volei' ? 30 : 4)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff" opacity="0.65" fontFamily="system-ui, sans-serif">{sigla}</text>
      {(i.telao ?? n >= 3) && <g><rect x={x + w / 2 - 22} y="6" width="44" height="18" rx="2" fill="#111827" /><text x={x + w / 2} y="19" textAnchor="middle" fontSize="9" fill="#fbbf24" fontFamily="ui-monospace, monospace">{sigla} 00</text></g>}
    </svg>
  );
}

/** A gaming house: a sala de treino (um PC por jogador de cada line, no arranjo escolhido), os cômodos que a casa tem
 *  (estúdio, criadores, análise, academia, cozinha com chef, psicólogo, fisioterapia, quartos, troféus, lounge). */
export interface Estacao34 { pc: number; monitor: number; perifericos: number; cadeira: number; rgb?: string }
type Sala = { nome: string; fundo: string; tinta: string; icone?: 'mesa' | 'peso' | 'panela' | 'cama' | 'taca' | 'cam' | 'tela' | 'sofa' | 'cruz' | 'conversa' };
const PISO_CASA: Record<string, string> = { madeira: '#d8b98a', escura: '#8a5c31', azul: '#5b7fb8' };
export function GamingHouse34({ pcs, conteudo, trofeus, comodos = [], setups = [], i, c, sigla, nome }: { nivel: number; pcs: number; conteudo: number; trofeus: number; comodos?: string[]; setups?: (Estacao34 | undefined)[]; i: Instalacoes34; c: Cores34; sigla: string; nome: string }) {
  const estilo = i.estilo ?? 'loft';
  const st = setups.filter((x): x is Estacao34 => !!x);
  const mon = st.length ? st.reduce((a, x) => a + x.monitor, 0) / st.length : 0;
  const luz = i.luz ?? st.find(x => x.rgb)?.rgb ?? c.cor2;
  const chao = i.piso === 'cores' ? c.cor2 : i.piso ? PISO_CASA[i.piso] : estilo === 'escritorio' ? '#cfd4da' : estilo === 'casa' ? '#d8c3a0' : '#b8afa6';
  const parede = i.parede === 'grafite' ? '#27272a' : i.parede === 'branca' ? '#d4d4d8' : i.parede === 'tijolo' ? '#a6533a' : i.parede === 'time' ? c.cor1 : estilo === 'escritorio' ? '#8fc3dd' : '#3f3f46';
  const layout = i.layout ?? 'fileiras';
  const n = Math.min(pcs, 18);
  const mw = 14 + mon * 2.5;
  const pos: [number, number, number][] = []; // x, y, rotação
  if (layout === 'fileiras') for (let k = 0; k < n; k++) pos.push([22 + (k % 6) * 26, 30 + Math.floor(k / 6) * 30, 0]);
  else if (layout === 'ilha') for (let k = 0; k < n; k++) { const g = Math.floor(k / 6), m = k % 6; pos.push([24 + (m % 3) * 24 + (g % 2) * 82, 34 + (m < 3 ? 0 : 26) + Math.floor(g / 2) * 46, m < 3 ? 0 : 180]); }
  else for (let k = 0; k < n; k++) { const t = n === 1 ? 0.5 : k / (n - 1); const ang = Math.PI * (0.15 + 0.7 * t); pos.push([96 + Math.cos(ang) * 64 - 11, 100 - Math.sin(ang) * 62, 0]); }
  const mesas = pos.map(([x, y, rot], k) => (
    <g key={k} transform={rot ? `rotate(180 ${x + 11} ${y + 8})` : undefined}>
      <rect x={x} y={y} width="22" height="9" fill="#1f2937" />
      <rect x={x + 11 - mw / 2} y={y + 1} width={mw} height="3" fill={luz} />
      <circle cx={x + 11} cy={y + 16} r="4.5" fill={c.cor1} stroke="#111" strokeWidth="0.6" />
    </g>
  ));
  // As salas que a casa tem, por ordem de importância (as que não cabem no desenho ficam de fora).
  const salas: Sala[] = [];
  if (i.mural ?? true) salas.push({ nome: sigla, fundo: c.cor1, tinta: claro(c.cor1) ? '#111' : '#fff' });
  if (conteudo >= 1 || comodos.includes('estudio')) salas.push({ nome: comodos.includes('estudio') ? 'estúdio pro' : 'estúdio', fundo: '#1f2937', tinta: '#e5e7eb', icone: 'cam' });
  if (conteudo >= 2) salas.push({ nome: 'criadores', fundo: '#312e81', tinta: '#e0e7ff', icone: 'cam' });
  if (comodos.includes('analise')) salas.push({ nome: 'análise', fundo: '#0f172a', tinta: '#e2e8f0', icone: 'tela' });
  if (comodos.includes('academia')) salas.push({ nome: 'academia', fundo: '#e5e7eb', tinta: '#111827', icone: 'peso' });
  salas.push({ nome: comodos.includes('chef') ? 'cozinha · chef' : 'cozinha', fundo: '#f3f4f6', tinta: '#374151', icone: 'panela' });
  if (comodos.includes('psicologo')) salas.push({ nome: 'psicólogo', fundo: '#ecfdf5', tinta: '#065f46', icone: 'conversa' });
  if (comodos.includes('fisio')) salas.push({ nome: 'fisioterapia', fundo: '#eff6ff', tinta: '#1e3a8a', icone: 'cruz' });
  if (estilo !== 'escritorio' || comodos.includes('quartos')) salas.push({ nome: comodos.includes('quartos') ? 'quartos individuais' : 'quartos', fundo: '#ede9fe', tinta: '#4c1d95', icone: 'cama' });
  salas.push({ nome: `troféus · ${trofeus}`, fundo: '#fef3c7', tinta: '#78350f', icone: 'taca' });
  if (i.sofa ?? true) salas.push({ nome: 'lounge', fundo: '#e5e7eb', tinta: '#374151', icone: 'sofa' });
  const slots: [number, number, number, number][] = [[182, 18, 60, 50], [246, 18, 60, 50], [182, 70, 60, 50], [246, 70, 60, 50], [14, 124, 56, 72], [73, 124, 56, 72], [132, 124, 56, 72], [191, 124, 56, 72], [250, 124, 56, 72]];
  const largura = estilo === 'casa' ? 250 : 300;
  const visiveis = slots.filter(([x, , w]) => x + w <= largura + 10).slice(0, salas.length);
  const icone = (t: Sala['icone'], x: number, y: number, cor: string) => {
    switch (t) {
      case 'peso': return <g stroke={cor} strokeWidth="2.5"><path d={`M${x - 9} ${y} h18`} /><path d={`M${x - 9} ${y - 5} v10 M${x + 9} ${y - 5} v10`} /></g>;
      case 'panela': return <g fill="none" stroke={cor} strokeWidth="1.6"><path d={`M${x - 8} ${y - 2} h16 v6 a4 4 0 0 1 -4 4 h-8 a4 4 0 0 1 -4 -4z`} /><path d={`M${x - 11} ${y - 1} h3 M${x + 8} ${y - 1} h3`} /></g>;
      case 'cama': return <g fill={cor} opacity="0.7"><rect x={x - 10} y={y - 6} width="20" height="12" rx="2" /><rect x={x - 9} y={y - 5} width="6" height="4" fill="#fff" /></g>;
      case 'taca': return Array.from({ length: Math.min(5, Math.max(1, Math.ceil(trofeus / 2))) }, (_, k) => <path key={k} d={`M${x - 16 + k * 8} ${y - 6} h6 v3 a3 3 0 0 1 -6 0z M${x - 14 + k * 8} ${y} h2 v4 h-2z`} fill={trofeus ? '#e0b13a' : '#d1d5db'} />);
      case 'cam': return <g><circle cx={x} cy={y} r="6" fill="#ef4444" /><rect x={x - 12} y={y - 12} width="24" height="6" fill={luz} opacity="0.7" /></g>;
      case 'tela': return <g><rect x={x - 14} y={y - 8} width="28" height="14" fill={luz} opacity="0.6" /><path d={`M${x - 10} ${y + 3} l6 -6 5 4 8 -8`} stroke="#fff" fill="none" /></g>;
      case 'sofa': return <g fill={c.cor1} opacity="0.85"><rect x={x - 14} y={y - 4} width="28" height="9" rx="3" /><rect x={x - 14} y={y - 9} width="28" height="5" rx="2" /></g>;
      case 'cruz': return <path d={`M${x - 3} ${y - 9} h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6z`} fill="#3b82f6" />;
      case 'conversa': return <g fill="none" stroke={cor} strokeWidth="1.6"><circle cx={x - 6} cy={y} r="5" /><circle cx={x + 6} cy={y} r="5" /></g>;
      default: return null;
    }
  };
  return (
    <svg viewBox="0 0 320 210" className="inst34__svg" role="img" aria-label={`${nome}: gaming house com ${pcs} PCs de treino${salas.length > 2 ? `, ${salas.slice(1).map(x => x.nome.replace(/ · \d+$/, '')).join(', ')}` : ''}`}>
      <rect width="320" height="210" fill={estilo === 'casa' ? '#9cc58e' : '#d1d5db'} />
      {estilo === 'casa' && <g><rect x="266" y="20" width="44" height="90" rx="8" fill="#6cc3e8" stroke="#fff" strokeWidth="2" /><text x="288" y="125" textAnchor="middle" fontSize="7" fill="#1f2937" fontFamily="system-ui, sans-serif">piscina</text><circle cx="280" cy="160" r="9" fill="#4d7c3f" /><circle cx="300" cy="185" r="7" fill="#4d7c3f" /></g>}
      <rect x="10" y="14" width={largura} height="186" fill={chao} stroke={parede} strokeWidth={estilo === 'escritorio' ? 3 : 5} />
      <rect x="14" y="18" width="164" height="102" fill={chao} stroke={parede} strokeWidth="2" />
      <rect x="14" y="18" width="164" height="102" fill={luz} opacity="0.1" />
      {layout === 'arena' && <rect x="66" y="104" width="60" height="10" fill="#111827" stroke={luz} />}
      {(i.neon ?? false) && <text x="96" y="27" textAnchor="middle" fontSize="8" fontWeight="800" fill={luz} stroke={luz} strokeWidth="0.3" fontFamily="system-ui, sans-serif" letterSpacing="2" opacity="0.95">{sigla}</text>}
      {mesas}
      {(i.plantas ?? false) && [[20, 112], [170, 112], [20, 24], [170, 24]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4.5" fill="#3f7d3a" stroke="#285224" />)}
      <text x="96" y={layout === 'arena' ? 102 : 114} textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="system-ui, sans-serif">sala de treino · {pcs} PCs</text>
      {visiveis.map(([x, y, w, h], k) => {
        const sl = salas[k];
        const ehMural = k === 0 && (i.mural ?? true);
        return (
          <g key={k}>
            <rect x={x} y={y} width={w} height={h} fill={sl.fundo} stroke={parede} strokeWidth="2" />
            {ehMural ? <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={sl.tinta} fontFamily="system-ui, sans-serif">{sl.nome}</text>
              : <>{icone(sl.icone, x + w / 2, y + h / 2 - 4, sl.tinta)}<text x={x + w / 2} y={y + h - 5} textAnchor="middle" fontSize="6.5" fill={sl.tinta} fontFamily="system-ui, sans-serif">{sl.nome}</text></>}
          </g>
        );
      })}
    </svg>
  );
}
