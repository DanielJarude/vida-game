/**
 * Desenhos da vida material: a casa onde se mora (com gente nas janelas, o
 * bicho no quintal, o carro na frente) e os ícones dos bens. Traço simples,
 * cor só onde significa algo (a luz acesa de quem mora ali).
 */

import type { FormaDaCasa, LeituraLar } from '../../leituraMaterial';

const TRACO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Janela({ x, y, acesa, l = 14, a = 14 }: { x: number; y: number; acesa: boolean; l?: number; a?: number }) {
  return <rect x={x} y={y} width={l} height={a} rx={1.5} className={acesa ? 'cena__janela cena__janela--acesa' : 'cena__janela'} />;
}

/** As janelas acendem com quem mora ali. */
function janelas(pos: [number, number][], acesas: number) {
  return pos.map(([x, y], k) => <Janela key={k} x={x} y={y} acesa={k < acesas} />);
}

function Predio({ acesas }: { acesas: number }) {
  const pos: [number, number][] = [];
  for (let andar = 0; andar < 4; andar++) for (let c = 0; c < 3; c++) pos.push([118 + c * 26, 34 + andar * 22]);
  // A sua janela é a do meio, no segundo andar: acende primeiro.
  const ordem = [pos[4], pos[3], pos[5], pos[7], ...pos.filter((_, k) => ![3, 4, 5, 7].includes(k))];
  return (
    <g>
      <rect x={106} y={22} width={100} height={106} rx={2} {...TRACO} className="cena__parede" />
      <path d="M100 22h112" {...TRACO} />
      {janelas(ordem, Math.min(4, acesas))}
      <rect x={148} y={110} width={16} height={18} {...TRACO} />
    </g>
  );
}

function Kitnet({ acesas }: { acesas: number }) {
  return (
    <g>
      <rect x={96} y={30} width={120} height={98} rx={2} {...TRACO} className="cena__parede" />
      {[0, 1, 2].map(a => [0, 1, 2, 3].map(c => <Janela key={`${a}${c}`} x={104 + c * 28} y={38 + a * 26} acesa={a === 1 && c === 1 && acesas > 0} l={12} a={12} />))}
      <rect x={150} y={112} width={12} height={16} {...TRACO} />
    </g>
  );
}

function Casa({ acesas, grande }: { acesas: number; grande?: boolean }) {
  const l = grande ? 150 : 110;
  const x = 156 - l / 2;
  return (
    <g>
      <path d={`M${x - 8} 74 L156 ${grande ? 24 : 34} L${x + l + 8} 74`} {...TRACO} />
      <rect x={x} y={72} width={l} height={56} {...TRACO} className="cena__parede" />
      {janelas(grande ? [[x + 14, 86], [x + 40, 86], [x + l - 54, 86], [x + l - 28, 86]] : [[x + 16, 86], [x + l - 30, 86]], acesas)}
      <rect x={148} y={100} width={16} height={28} {...TRACO} />
      {grande && <path d={`M${x + l + 14} 128v-26h30v26`} {...TRACO} />}
    </g>
  );
}

function Republica({ acesas }: { acesas: number }) {
  return (
    <g>
      <path d="M100 58 L156 26 L212 58" {...TRACO} />
      <rect x={106} y={56} width={100} height={72} {...TRACO} className="cena__parede" />
      {janelas([[116, 66], [140, 66], [164, 66], [188, 66], [116, 94], [188, 94]], Math.max(3, acesas))}
      <rect x={148} y={104} width={16} height={24} {...TRACO} />
    </g>
  );
}

function Favor() {
  return (
    <g>
      <path d="M96 64 L150 30 L204 64" {...TRACO} />
      <rect x={102} y={62} width={96} height={66} {...TRACO} className="cena__parede" />
      <rect x={206} y={92} width={34} height={36} {...TRACO} strokeDasharray="3 3" />
      <Janela x={214} y={100} acesa l={12} a={10} />
      <Janela x={116} y={76} acesa={false} />
      <rect x={144} y={100} width={14} height={28} {...TRACO} />
    </g>
  );
}

function Carro({ x }: { x: number }) {
  return <g transform={`translate(${x} 110)`}><path d="M2 14h40M6 14V9l6-6h18l7 6h3v5" {...TRACO} /><circle cx={11} cy={15} r={3.5} {...TRACO} /><circle cx={33} cy={15} r={3.5} {...TRACO} /></g>;
}
function Moto({ x }: { x: number }) {
  return <g transform={`translate(${x} 112)`}><circle cx={5} cy={12} r={4.5} {...TRACO} /><circle cx={27} cy={12} r={4.5} {...TRACO} /><path d="M5 12l8-8h7l7 8M13 4l-2-3" {...TRACO} /></g>;
}
function Bicicleta({ x }: { x: number }) {
  return <g transform={`translate(${x} 113)`}><circle cx={5} cy={10} r={4.5} {...TRACO} /><circle cx={23} cy={10} r={4.5} {...TRACO} /><path d="M5 10l6-7h8l4 7M11 3l4 7" {...TRACO} /></g>;
}
function Cachorro({ x }: { x: number }) {
  return <g transform={`translate(${x} 116)`} className="cena__bicho"><path d="M2 12V6l3-3h9l2-3 3 1-1 4v7M5 12V8M15 12V8M1 6l-1-3" {...TRACO} /></g>;
}
function Gato({ x }: { x: number }) {
  return <g transform={`translate(${x} 115)`} className="cena__bicho"><path d="M3 13V6l2-4 2 3h4l2-3 2 4v7M3 13c-3 0-4-3-2-5" {...TRACO} /></g>;
}

const DESCRICAO: Record<FormaDaCasa, string> = {
  predio: 'um prédio', kitnet: 'um prédio de kitnets', casa: 'uma casa', casa_grande: 'uma casa grande', republica: 'uma casa dividida', familia: 'a casa da família', favor: 'um quarto de favor'
};

export function CenaDaCasa({ l }: { l: LeituraLar }) {
  const acesas = Math.max(1, l.janelasAcesas);
  const rotulo = `Desenho: ${DESCRICAO[l.forma]}, ${acesas} ${acesas === 1 ? 'janela acesa' : 'janelas acesas'}${l.bichos.length ? `, ${l.bichos.map(b => b.nome).join(' e ')} na frente` : ''}${l.veiculo ? `, ${l.veiculo === 'carro' ? 'um carro' : l.veiculo === 'moto' ? 'uma moto' : 'uma bicicleta'} na porta` : ''}.`;
  return (
    <svg className={`cena cena--${l.forma}`} viewBox="0 0 312 140" role="img" aria-label={rotulo}>
      <path d="M8 128h296" {...TRACO} className="cena__chao" />
      {l.forma === 'predio' && <Predio acesas={acesas} />}
      {l.forma === 'kitnet' && <Kitnet acesas={acesas} />}
      {(l.forma === 'casa' || l.forma === 'familia') && <Casa acesas={acesas} />}
      {l.forma === 'casa_grande' && <Casa acesas={acesas} grande />}
      {l.forma === 'republica' && <Republica acesas={acesas} />}
      {l.forma === 'favor' && <Favor />}
      {l.veiculo === 'carro' && <Carro x={34} />}
      {l.veiculo === 'moto' && <Moto x={44} />}
      {l.veiculo === 'bicicleta' && <Bicicleta x={48} />}
      {l.bichos.filter(b => b.especie === 'gato' || b.especie === 'cachorro').slice(0, 2).map((b, k) => (b.especie === 'gato' ? <Gato key={b.id} x={232 + k * 26} /> : <Cachorro key={b.id} x={232 + k * 26} />))}
    </svg>
  );
}

const ICONES: Record<string, string> = {
  predio: 'M5 21V4h10v17M15 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1M3 21h18',
  kitnet: 'M4 21V5h16v16M8 9h2M14 9h2M8 13h2M14 13h2M11 21v-4h2v4M2 21h20',
  casa: 'M3 11l9-7 9 7M5 10v11h14V10M10 21v-6h4v6',
  carro: 'M3 16h18M5 16v-4l3-4h8l4 4v4M7.5 18.5a1.5 1.5 0 1 0 0-.01M16.5 18.5a1.5 1.5 0 1 0 0-.01',
  moto: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l5-6h5l4 6M10 11l-1-3h3',
  bicicleta: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l4-7h6l4 7M9 10l3 7',
  banco: 'M3 9l9-5 9 5M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18',
  abrigo: 'M4 12c0-4 3-6 5-6M20 12c0-4-3-6-5-6M7 14c1 4 9 4 10 0M9 9h.01M15 9h.01M12 12v1',
  oficina: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9M7 17l-3 3',
  imobiliaria: 'M4 20V9l6-4 6 4v11M16 12h4v8M8 13h4M8 16h4M2 20h20',
  usados: 'M3 16h18M5 16v-4l3-4h8l4 4v4M12 4v3M10 5h4',
  concessionaria: 'M3 16h18M5 16v-4l3-4h8l4 4v4M4 4h16',
  loja_pets: 'M4 10h16v10H4zM3 10l2-5h14l2 5M9 14c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3-1-3-2M8 12.5h.01M16 12.5h.01',
  republica: 'M3 11l9-7 9 7M5 10v11h14V10M8 13h2M14 13h2M8 17h2M14 17h2',
  casa_simples: 'M4 12l8-6 8 6M6 11v9h12v-9M11 20v-4h2v4',
  casa_2q: 'M3 11l9-7 9 7M5 10v11h14V10M8 14h3M13 14h3M10 21v-3h4v3',
  casa_3q: 'M2 11l7-6 7 6M4 10v11h10V10M14 13l4-3 4 3M16 13v8h5v-8M7 14h4',
  casa_grande: 'M1 11l6-6 6 6 5-4 5 4M3 10v11h18V10M6 14h3M11 14h2M15 14h3M10 21v-4h4v4',
  sitio: 'M3 13l6-5 6 5M5 12v8h8v-8M15 20c0-4 3-7 6-7M17 20c0-3 2-5 4-5M2 20h20',
  apto_1q: 'M7 21V5h10v16M10 9h1M13 9h1M10 13h1M13 13h1M11 21v-3h2v3M4 21h16',
  apto_2q: 'M6 21V4h12v17M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2M3 21h18',
  apto_3q: 'M4 21V3h16v18M7 7h2M11 7h2M15 7h2M7 11h2M11 11h2M15 11h2M7 15h2M15 15h2M11 21v-4h2v4M2 21h20',
  alto_padrao: 'M5 21V2h14v19M8 5h2M14 5h2M8 9h2M14 9h2M8 13h2M14 13h2M3 21h18M9 21v-4h6v4'
};

/** Cada tipo de moradia tem a sua silhueta (e o tamanho aparece no desenho, não só no texto). */
const ICONE_MORADIA: Record<string, string> = { republica: 'republica', kitnet: 'kitnet', casa_simples: 'casa_simples', apto_1q: 'apto_1q', apto_2q: 'apto_2q', casa_2q: 'casa_2q', apto_3q: 'apto_3q', casa_3q: 'casa_3q', casa_grande: 'casa_grande', sitio: 'sitio', alto_padrao: 'alto_padrao' };

export function IconeMoradia({ modeloId, estado }: { modeloId: string; estado?: string }) {
  const nome = ICONE_MORADIA[modeloId] ?? 'casa';
  return (
    <span className={`icone-moradia icone-moradia--${nome}${estado === 'reforma' ? ' icone-moradia--reforma' : ''}`} aria-hidden>
      <Icone nome={nome} tamanho={34} />
      {estado === 'reforma' && <span className="icone-moradia__selo">obra</span>}
      {estado === 'novo' && <span className="icone-moradia__selo">novo</span>}
    </span>
  );
}

export function Icone({ nome, tamanho = 28 }: { nome: string; tamanho?: number }) {
  return (
    <svg className="icone-bem" width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden {...TRACO}>
      <path d={ICONES[nome] ?? ICONES.casa} />
    </svg>
  );
}

/** Linha de evolução (patrimônio, aplicação) — com descrição acessível. */
export function Evolucao({ valores, rotulo, altura = 44 }: { valores: number[]; rotulo: string; altura?: number }) {
  if (valores.length < 2) return null;
  const min = Math.min(0, ...valores);
  const max = Math.max(...valores, 1);
  const w = 200;
  const pts = valores.map((x, k) => `${(k / (valores.length - 1)) * w},${altura - 4 - ((x - min) / (max - min || 1)) * (altura - 8)}`);
  const zero = altura - 4 - ((0 - min) / (max - min || 1)) * (altura - 8);
  return (
    <svg className="evolucao" viewBox={`0 0 ${w} ${altura}`} preserveAspectRatio="none" role="img" aria-label={rotulo}>
      {min < 0 && <line x1={0} x2={w} y1={zero} y2={zero} className="evolucao__zero" />}
      <polyline points={pts.join(' ')} className="evolucao__linha" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export type { LeituraLar };
