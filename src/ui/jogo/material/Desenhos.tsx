/**
 * Desenhos da vida material: a casa onde se mora (com gente nas janelas, o
 * bicho no quintal, o carro na frente) e os ícones dos bens. Traço simples,
 * cor só onde significa algo (a luz acesa de quem mora ali).
 *
 * Cada tipo de moradia tem a sua silhueta: o prédio baixo não é a torre de
 * alto padrão, a casa simples de laje não é a casa grande de dois andares, e
 * a casa da família não é a casa de parentes nem o quartinho de favor. O
 * estado também aparece no traço (mancha, rachadura, andaime, pintura nova),
 * sempre com forma e com texto na descrição — nunca só com cor.
 */

import type { ReactNode } from 'react';
import type { FormaDaCasa, LeituraLar } from '../../leituraMaterial';

const TRACO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const FINO = { ...TRACO, strokeWidth: 1 };
const CHAO = 128;

function Janela({ x, y, acesa, l = 14, a = 14 }: { x: number; y: number; acesa: boolean; l?: number; a?: number }) {
  return <rect x={x} y={y} width={l} height={a} rx={1.5} className={acesa ? 'cena__janela cena__janela--acesa' : 'cena__janela'} />;
}

type Pos = [number, number, number?, number?];

/** As janelas acendem com quem mora ali, na ordem dada (a primeira é a sua). */
function janelas(pos: Pos[], acesas: number, l = 14, a = 14) {
  return pos.map(([x, y, pl, pa], k) => <Janela key={k} x={x} y={y} acesa={k < acesas} l={pl ?? l} a={pa ?? a} />);
}

/* ---------------------------------------------------------- Miudezas */

function Parede({ x, y, l, a }: { x: number; y: number; l: number; a: number }) {
  return <rect x={x} y={y} width={l} height={a} rx={1} {...TRACO} className="cena__parede" />;
}
function Porta({ x, y = 100, l = 14, a = CHAO - y }: { x: number; y?: number; l?: number; a?: number }) {
  return <rect x={x} y={y} width={l} height={a} {...TRACO} className="cena__porta" />;
}
/** Tijolo à vista: fiadas desencontradas (a parede sem reboco). */
function Tijolos({ x, y, l, a }: { x: number; y: number; l: number; a: number }) {
  const d: string[] = [];
  for (let k = 0, yy = y + 6; yy < y + a - 1; k++, yy += 6) {
    d.push(`M${x + 1} ${yy}h${l - 2}`);
    for (let xx = x + (k % 2 ? 6 : 12); xx < x + l - 2; xx += 12) d.push(`M${xx} ${yy}v-6`);
  }
  return <path d={d.join('')} {...FINO} className="cena__tijolo" data-detalhe="tijolo" />;
}
function Grade({ x, y, l, a, passo = 4 }: { x: number; y: number; l: number; a: number; passo?: number }) {
  const d: string[] = [];
  for (let xx = x + passo; xx < x + l; xx += passo) d.push(`M${xx} ${y}v${a}`);
  return <path d={d.join('')} {...FINO} />;
}
function Arvore({ x, r = 13, tronco = 16 }: { x: number; r?: number; tronco?: number }) {
  return (
    <g className="cena__arvore">
      <path d={`M${x} ${CHAO}v-${tronco + 2}`} {...TRACO} />
      <circle cx={x} cy={CHAO - tronco - r + 2} r={r} {...TRACO} className="cena__folha" />
    </g>
  );
}
function Palmeira({ x }: { x: number }) {
  const t = CHAO - 38;
  return (
    <g className="cena__arvore">
      <path d={`M${x} ${CHAO}q-3 -20 2 -38`} {...TRACO} />
      <path d={`M${x + 2} ${t}q-10 -4 -16 4M${x + 2} ${t}q10 -4 16 4M${x + 2} ${t}q-4 -10 -12 -10M${x + 2} ${t}q4 -10 12 -10`} {...TRACO} className="cena__folha" />
    </g>
  );
}
function Arbustos({ x, l }: { x: number; l: number }) {
  let d = `M${x} ${CHAO}`;
  for (let xx = x; xx < x + l; xx += 10) d += 'q5 -12 10 0';
  return <path d={d} {...TRACO} className="cena__folha" />;
}
function Vaso({ x }: { x: number }) {
  return (
    <g className="cena__vaso">
      <path d={`M${x} ${CHAO}l2 -7h8l2 7z`} {...TRACO} className="cena__parede" />
      <path d={`M${x + 6} ${CHAO - 7}q-6 -5 -2 -11M${x + 6} ${CHAO - 7}q5 -4 3 -10`} {...TRACO} className="cena__folha" />
    </g>
  );
}
/** Varal com roupa: casa de muita gente (ou de família). */
function Varal({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const meio = (x1 + x2) / 2;
  const pecas = [x1 + 8, x1 + 22, meio + 4, x2 - 16].map((x, k) => (k % 2
    ? <path key={k} d={`M${x} ${y + 3}h9v10h-9z`} {...FINO} className="cena__roupa" />
    : <path key={k} d={`M${x} ${y + 3}l-3 4 2 1v8h8v-8l2 -1 -3 -4z`} {...FINO} className="cena__roupa" />));
  return (
    <g data-detalhe="varal">
      <path d={`M${x1} ${CHAO}V${y - 2}M${x2} ${CHAO}V${y - 2}M${x1} ${y}Q${meio} ${y + 6} ${x2} ${y}`} {...FINO} />
      {pecas}
    </g>
  );
}
function CaixaDagua({ x, y }: { x: number; y: number }) {
  return <g data-detalhe="caixa-dagua"><rect x={x} y={y} width={20} height={13} rx={1} {...TRACO} className="cena__parede" /><path d={`M${x - 2} ${y}l4 -4h16l4 4`} {...TRACO} /></g>;
}

/* ------------------------------------------------------------- Planta */

interface Planta {
  /** A parede principal (onde aparecem mancha, rachadura, andaime). */
  parede: { x: number; y: number; l: number; a: number };
  /** Onde para o veículo (x do carro; moto e bicicleta ajustam). */
  vaga: number;
  /** Onde ficam os bichos. */
  bichos: number;
  /** Casa de alvenaria que pode ter tijolo à vista. */
  tijolo: boolean;
}

const PLANTAS: Record<FormaDaCasa, Planta> = {
  republica: { parede: { x: 98, y: 48, l: 116, a: 80 }, vaga: 34, bichos: 240, tijolo: true },
  kitnet: { parede: { x: 66, y: 62, l: 176, a: 66 }, vaga: 16, bichos: 262, tijolo: false },
  apto_1q: { parede: { x: 118, y: 56, l: 76, a: 72 }, vaga: 34, bichos: 234, tijolo: false },
  apto_2q: { parede: { x: 106, y: 28, l: 100, a: 100 }, vaga: 34, bichos: 232, tijolo: false },
  apto_3q: { parede: { x: 116, y: 8, l: 80, a: 120 }, vaga: 34, bichos: 232, tijolo: false },
  alto_padrao: { parede: { x: 136, y: 10, l: 60, a: 102 }, vaga: 18, bichos: 264, tijolo: false },
  casa_simples: { parede: { x: 120, y: 81, l: 76, a: 47 }, vaga: 34, bichos: 236, tijolo: true },
  casa_2q: { parede: { x: 112, y: 78, l: 84, a: 50 }, vaga: 40, bichos: 236, tijolo: true },
  casa_3q: { parede: { x: 130, y: 74, l: 100, a: 54 }, vaga: 16, bichos: 238, tijolo: true },
  casa_grande: { parede: { x: 62, y: 86, l: 136, a: 42 }, vaga: 10, bichos: 254, tijolo: false },
  sitio: { parede: { x: 100, y: 86, l: 72, a: 42 }, vaga: 52, bichos: 246, tijolo: true },
  familia: { parede: { x: 104, y: 74, l: 104, a: 54 }, vaga: 34, bichos: 236, tijolo: true },
  parente: { parede: { x: 110, y: 88, l: 92, a: 40 }, vaga: 34, bichos: 246, tijolo: true },
  favor: { parede: { x: 98, y: 68, l: 92, a: 60 }, vaga: 34, bichos: 256, tijolo: true },
  funcional: { parede: { x: 146, y: 90, l: 50, a: 38 }, vaga: 12, bichos: 260, tijolo: false }
};

/* ------------------------------------------------------------ Formas */

interface PropsForma { acesas: number; tijolo: boolean }
const p = (f: FormaDaCasa) => PLANTAS[f].parede;

/** Sobrado dividido: muitas janelas pequenas, campainhas, varal na frente. */
function Republica({ acesas, tijolo }: PropsForma) {
  const w = p('republica');
  return (
    <g>
      <path d="M92 50L156 20L220 50" {...TRACO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      <path d="M98 88h116" {...FINO} />
      {janelas([[108, 94], [126, 58], [149, 58], [172, 58], [190, 58], [108, 58], [126, 94], [172, 94], [190, 94]], acesas, 12, 12)}
      <Porta x={149} y={104} />
      <path d="M168 108v.01M168 112v.01M168 116v.01M168 120v.01" {...TRACO} strokeWidth={2.4} data-detalhe="campainhas" />
      <Varal x1={230} x2={296} y={90} />
    </g>
  );
}

/** Corredor de kitnets: portas iguais lado a lado, dois pisos, escada de fora. */
function Kitnet({ acesas }: PropsForma) {
  const w = p('kitnet');
  const unidades: ReactNode[] = [];
  const uw = w.l / 5;
  for (let piso = 0; piso < 2; piso++) for (let u = 0; u < 5; u++) {
    const ux = w.x + u * uw;
    const sua = piso === 0 && u === 1;
    unidades.push(
      <g key={`${piso}${u}`}>
        <rect x={ux + 6} y={piso === 0 ? 72 : 108} width={9} height={piso === 0 ? 16 : 20} {...FINO} />
        <Janela x={ux + 20} y={piso === 0 ? 70 : 104} acesa={sua && acesas > 0} l={9} a={8} />
      </g>
    );
  }
  const grades = Array.from({ length: 16 }, (_, k) => `M${w.x + 5 + k * 11} 88v8`).join('');
  return (
    <g>
      <Parede {...w} />
      <path d={`M${w.x - 4} ${w.y}h${w.l + 8}`} {...TRACO} />
      {unidades}
      <path d={`M${w.x} 96h${w.l}M${w.x} 88h${w.l}${grades}`} {...FINO} data-detalhe="corredor" />
      <path d={`M${w.x + w.l} 96L258 128M${w.x + w.l} 88L262 118`} {...TRACO} />
      <path d="M246 104h5M250 110h5M254 116h5M257 122h5" {...FINO} />
    </g>
  );
}

/** Prédio baixo, três andares, caixa-d'água no alto. */
function Apto1q({ acesas }: PropsForma) {
  const w = p('apto_1q');
  return (
    <g>
      <CaixaDagua x={146} y={43} />
      <Parede {...w} />
      <path d={`M${w.x - 4} ${w.y}h${w.l + 8}`} {...TRACO} />
      {janelas([[170, 84], [128, 84], [128, 64], [170, 64], [128, 106], [170, 106]], acesas, 14, 12)}
      <Grade x={128} y={106} l={14} a={12} />
      <Grade x={170} y={106} l={14} a={12} />
      <Porta x={149} y={108} />
      <Arvore x={214} r={11} tronco={14} />
    </g>
  );
}

/** Prédio médio, cinco andares, marquise na entrada e antena no alto. */
function Apto2q({ acesas }: PropsForma) {
  const w = p('apto_2q');
  const pos: Pos[] = [];
  for (const y of [72, 54, 90, 36]) for (const x of [149, 116, 182]) pos.push([x, y]);
  return (
    <g>
      <path d={`M186 ${w.y}v-12M180 ${w.y - 9}h12`} {...TRACO} />
      <Parede {...w} />
      <path d={`M${w.x - 4} ${w.y}h${w.l + 8}`} {...TRACO} />
      {janelas(pos, acesas, 14, 11)}
      <path d="M134 108h44" {...TRACO} strokeWidth={2.2} data-detalhe="marquise" />
      <Porta x={148} y={110} l={16} />
      <Grade x={112} y={112} l={28} a={16} />
      <Grade x={172} y={112} l={28} a={16} />
    </g>
  );
}

/** Prédio alto com varandas em todos os andares. */
function Apto3q({ acesas }: PropsForma) {
  const w = p('apto_3q');
  const andares = [70, 56, 84, 42, 98, 28, 14];
  const pos: Pos[] = andares.flatMap(y => [[124, y, 22, 9], [166, y, 22, 9]] as Pos[]);
  return (
    <g>
      <Parede {...w} />
      <path d={`M${w.x - 4} ${w.y}h${w.l + 8}`} {...TRACO} />
      {janelas(pos, acesas)}
      {andares.map(y => (
        <g key={y} className="cena__varanda" data-detalhe="varanda">
          <rect x={111} y={y + 7} width={40} height={6} {...FINO} className="cena__parede" />
          <rect x={161} y={y + 7} width={40} height={6} {...FINO} className="cena__parede" />
        </g>
      ))}
      <path d="M140 112h32" {...TRACO} strokeWidth={2.2} />
      <rect x={146} y={114} width={20} height={14} {...TRACO} className="cena__vidro" />
      <path d="M156 114v14" {...FINO} />
    </g>
  );
}

/** Torre envidraçada: portaria com guarita e cancela, piscina, palmeira. */
function AltoPadrao({ acesas }: PropsForma) {
  const w = p('alto_padrao');
  const colunas = 5;
  const linhas = 8;
  const cw = w.l / colunas;
  const ch = w.a / linhas;
  const celulas: Pos[] = [];
  for (const r of [4, 3, 5, 2, 6, 1, 7, 0]) for (const c of [2, 1, 3, 0, 4]) celulas.push([w.x + c * cw + 2, w.y + r * ch + 2, cw - 4, ch - 4]);
  const grade: string[] = [];
  for (let c = 1; c < colunas; c++) grade.push(`M${w.x + c * cw} ${w.y}V${w.y + w.a}`);
  for (let r = 1; r < linhas; r++) grade.push(`M${w.x} ${w.y + r * ch}h${w.l}`);
  return (
    <g>
      <path d={`M${w.x} ${w.y}L${w.x + w.l / 2} ${w.y - 8}L${w.x + w.l} ${w.y}`} {...TRACO} />
      <rect x={w.x} y={w.y} width={w.l} height={w.a} {...TRACO} className="cena__vidro" />
      <path d={grade.join('')} {...FINO} />
      {celulas.slice(0, acesas).map(([x, y, l, a], k) => <Janela key={k} x={x} y={y} acesa l={l} a={a} />)}
      <path d="M124 112h84" {...TRACO} strokeWidth={2.2} />
      <rect x={128} y={112} width={76} height={16} {...TRACO} className="cena__vidro" />
      <path d="M160 112v16M172 112v16" {...FINO} />
      <g data-detalhe="portaria">
        <rect x={94} y={108} width={20} height={20} {...TRACO} className="cena__parede" />
        <path d="M91 108h26" {...TRACO} />
        <rect x={98} y={112} width={12} height={7} rx={1} {...FINO} className="cena__vidro" />
        <path d="M114 118h12M126 116v4" {...TRACO} />
      </g>
      <Palmeira x={78} />
      <g data-detalhe="piscina">
        <rect x={210} y={120} width={48} height={8} rx={2} {...TRACO} className="cena__piscina" />
        <path d="M214 124q3 -2 6 0t6 0t6 0t6 0t6 0t6 0" {...FINO} />
        <path d="M252 120v-7h4v7" {...FINO} />
      </g>
    </g>
  );
}

/** Casa simples de laje: ferro para cima, caixa-d'água, janela com grade, poste com fio. */
function CasaSimples({ acesas, tijolo }: PropsForma) {
  const w = p('casa_simples');
  return (
    <g>
      <CaixaDagua x={150} y={63} />
      <rect x={116} y={76} width={84} height={5} {...TRACO} className="cena__parede" />
      <path d="M122 76v-9M128 76v-7M188 76v-9M194 76v-7" {...TRACO} data-detalhe="ferragem" />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[130, 92, 16, 14]], acesas)}
      <Grade x={130} y={92} l={16} a={14} />
      <Porta x={168} y={100} />
      <path d="M222 128V56M216 60h12M222 60Q206 66 196 86" {...FINO} data-detalhe="poste" />
    </g>
  );
}

/** Casa de dois quartos: telhado de duas águas, muro baixo, portão, árvore no quintal. */
function Casa2q({ acesas, tijolo }: PropsForma) {
  const w = p('casa_2q');
  return (
    <g>
      <Arvore x={226} r={13} tronco={18} />
      <path d="M106 80L154 48L202 80" {...TRACO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[122, 90], [172, 90]], acesas)}
      <Porta x={147} y={100} />
      <g data-detalhe="portao">
        <rect x={92} y={114} width={46} height={14} {...TRACO} className="cena__parede" />
        <rect x={170} y={114} width={46} height={14} {...TRACO} className="cena__parede" />
        <path d="M138 112h32" {...TRACO} />
        <Grade x={138} y={112} l={32} a={16} passo={5} />
      </g>
    </g>
  );
}

/** Casa de três quartos: mais larga, garagem ao lado, árvore grande no quintal. */
function Casa3q({ acesas, tijolo }: PropsForma) {
  const w = p('casa_3q');
  return (
    <g>
      <Arvore x={284} r={16} tronco={18} />
      <path d="M124 76L180 40L236 76" {...TRACO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[140, 88], [206, 88], [160, 88]], acesas)}
      <Porta x={184} y={100} />
      <g data-detalhe="garagem">
        <rect x={70} y={94} width={60} height={34} {...TRACO} className="cena__parede" />
        <path d="M66 94h68" {...TRACO} />
        <rect x={78} y={102} width={44} height={26} {...FINO} />
        <path d="M78 108h44M78 114h44M78 120h44" {...FINO} />
      </g>
    </g>
  );
}

/** Casa grande: dois andares, sacada, chaminé da churrasqueira, garagem dupla, jardim. */
function CasaGrande({ acesas }: PropsForma) {
  const w = p('casa_grande');
  return (
    <g>
      <rect x={160} y={28} width={9} height={14} {...TRACO} className="cena__parede" />
      <path d="M68 54L92 32H168L192 54" {...TRACO} />
      <rect x={74} y={52} width={112} height={34} {...TRACO} className="cena__parede" />
      <Parede {...w} />
      {janelas([[84, 60], [162, 60], [72, 98, 14, 16], [98, 98, 14, 16], [170, 98, 14, 16], [118, 58, 24, 22]], acesas)}
      <rect x={110} y={76} width={40} height={10} {...FINO} className="cena__parede" data-detalhe="sacada" />
      <path d="M118 76v10M126 76v10M134 76v10M142 76v10" {...FINO} />
      <rect x={124} y={100} width={24} height={28} {...TRACO} className="cena__porta" />
      <path d="M136 100v28" {...FINO} />
      <g data-detalhe="garagem">
        <rect x={198} y={96} width={48} height={32} {...TRACO} className="cena__parede" />
        <path d="M196 96h52" {...TRACO} />
        <rect x={204} y={102} width={36} height={26} {...FINO} />
        <path d="M204 108h36M204 114h36M204 120h36M222 102v26" {...FINO} />
      </g>
      <g data-detalhe="jardim"><Arbustos x={62} l={50} /><Arbustos x={154} l={40} /></g>
    </g>
  );
}

/** Sítio: casa com varanda, cerca, árvores, caixa-d'água na torre e roça. */
function Sitio({ acesas, tijolo }: PropsForma) {
  const w = p('sitio');
  const roca: string[] = [];
  for (let k = 0; k < 3; k++) {
    const y = 126 - k * 5;
    roca.push(`M${246 + k * 4} ${y}H304`);
    for (let x = 250 + k * 4; x < 302; x += 9) roca.push(`M${x} ${y}l-2 -3M${x} ${y}l2 -3`);
  }
  return (
    <g>
      <Arvore x={18} r={12} tronco={20} />
      <Arvore x={38} r={10} tronco={14} />
      <path d="M8 116h40M8 122h40M10 112v16M24 112v16M38 112v16M48 112v16" {...FINO} data-detalhe="cerca" />
      <path d="M94 88L136 60L178 88" {...TRACO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[112, 98]], acesas)}
      <Porta x={150} y={100} />
      <path d="M172 92L204 98M200 97V128" {...TRACO} data-detalhe="varanda" />
      <g data-detalhe="caixa-dagua">
        <path d="M214 128L218 90M232 128L228 90M216 110h14M215 118L230 100" {...FINO} />
        <rect x={211} y={76} width={24} height={14} rx={1} {...TRACO} className="cena__parede" />
      </g>
      <path d={roca.join('')} {...FINO} className="cena__roca" data-detalhe="roca" />
    </g>
  );
}

/** A casa da família: antiga, com alpendre de colunas, antena, vasos e varal. */
function Familia({ acesas, tijolo }: PropsForma) {
  const w = p('familia');
  return (
    <g>
      <path d="M178 56V38M170 42h16M173 46h10" {...FINO} data-detalhe="antena" />
      <path d="M98 76L156 42L214 76" {...TRACO} />
      <path d="M116 66l8 -5M136 54l8 -5M168 49l8 5M188 61l8 5" {...FINO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[120, 100, 14, 12], [178, 100, 14, 12], [120, 80, 14, 9], [178, 80, 14, 9]], acesas)}
      <Porta x={149} y={100} />
      <path d="M98 94H214" {...TRACO} strokeWidth={2.2} data-detalhe="alpendre" />
      <path d="M108 94V128M204 94V128" {...TRACO} strokeWidth={2.4} />
      <Vaso x={122} />
      <Vaso x={180} />
      <Varal x1={222} x2={294} y={92} />
    </g>
  );
}

/** Casa de parentes: casa de laje com um puxadinho em cima e escada de fora. */
function Parente({ acesas, tijolo }: PropsForma) {
  const w = p('parente');
  const px = { x: 118, y: 58, l: 50, a: 26 };
  return (
    <g>
      <path d="M114 60L172 52" {...TRACO} />
      <rect x={px.x} y={px.y} width={px.l} height={px.a} {...TRACO} className="cena__parede" data-detalhe="puxadinho" />
      <Tijolos {...px} />
      <rect x={106} y={84} width={100} height={4} {...TRACO} className="cena__parede" />
      <path d="M196 84v-8M201 84v-6" {...TRACO} />
      <Parede {...w} />
      {tijolo && <Tijolos {...w} />}
      {janelas([[134, 64, 14, 11], [120, 98], [178, 98]], acesas)}
      <Porta x={150} y={100} />
      <path d="M206 84L236 128" {...TRACO} />
      <path d="M210 92h6M216 100h6M221 108h6M227 116h6M232 123h5" {...FINO} data-detalhe="escada" />
    </g>
  );
}

/** De favor: a casa é dos outros (janelas apagadas); o seu é o quartinho dos fundos. */
function Favor({ acesas }: PropsForma) {
  const w = p('favor');
  return (
    <g>
      <path d="M92 70L144 38L196 70" {...TRACO} />
      <Parede {...w} />
      <Janela x={112} y={82} acesa={false} />
      <Janela x={162} y={82} acesa={false} />
      <Porta x={138} y={100} />
      <g data-detalhe="quartinho">
        <path d="M202 96L248 90" {...TRACO} />
        <rect x={206} y={94} width={38} height={34} {...TRACO} strokeDasharray="3 3" className="cena__parede" />
        <Janela x={212} y={102} acesa={acesas > 0} l={12} a={10} />
        <rect x={230} y={108} width={9} height={20} {...FINO} />
      </g>
      <path d="M192 127h4M198 125h4" {...FINO} />
    </g>
  );
}

/** Moradia funcional: casas iguais da vila (ou do alojamento), mastro com bandeira. */
function Funcional({ acesas }: PropsForma) {
  return (
    <g>
      <path d="M64 128V38" {...TRACO} />
      <path d="M64 40L88 46L64 52z" {...TRACO} className="cena__bandeira" data-detalhe="bandeira" />
      {[92, 146, 200].map((x0, k) => (
        <g key={x0}>
          <path d={`M${x0 - 3} 92L${x0 + 25} 72L${x0 + 53} 92`} {...TRACO} />
          <Parede x={x0} y={90} l={50} a={38} />
          <Janela x={x0 + 6} y={100} acesa={k === 1 && acesas > 0} l={12} a={10} />
          <Janela x={x0 + 34} y={100} acesa={k === 1 && acesas > 1} l={12} a={10} />
          <rect x={x0 + 21} y={106} width={10} height={22} {...FINO} />
        </g>
      ))}
    </g>
  );
}

const FORMAS: Record<FormaDaCasa, (p: PropsForma) => ReactNode> = {
  republica: Republica, kitnet: Kitnet, apto_1q: Apto1q, apto_2q: Apto2q, apto_3q: Apto3q, alto_padrao: AltoPadrao,
  casa_simples: CasaSimples, casa_2q: Casa2q, casa_3q: Casa3q, casa_grande: CasaGrande, sitio: Sitio,
  familia: Familia, parente: Parente, favor: Favor, funcional: Funcional
};

/* ------------------------------------------------------------ Estado */

function Rachadura({ x, y, a }: { x: number; y: number; a: number }) {
  const s = Math.min(1.4, a / 50);
  return <path d={`M${x} ${y + 3}l-3 ${6 * s}l4 ${5 * s}l-4 ${6 * s}l3 ${5 * s}M${x + 1} ${y + 3 + 11 * s}l5 ${3 * s}l2 ${4 * s}`} {...TRACO} className="cena__rachadura" data-condicao="rachadura" />;
}
function Mancha({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y}c4 -2 9 -1 11 2c3 0 5 3 3 6c1 4 -3 6 -6 4c-3 3 -8 2 -9 -2c-3 -1 -3 -8 1 -10z`} {...FINO} strokeDasharray="2 2" className="cena__mancha" data-condicao="mancha" />;
}
function Andaime({ x, topo }: { x: number; topo: number }) {
  const d: string[] = [`M${x} ${CHAO}V${topo}M${x + 20} ${CHAO}V${topo}`];
  for (let y = CHAO - 16; y > topo; y -= 16) d.push(`M${x - 3} ${y}h26`);
  for (let y = CHAO; y - 16 > topo; y -= 16) d.push(`M${x} ${y}L${x + 20} ${y - 16}`);
  return <path d={d.join('')} {...TRACO} className="cena__andaime" data-condicao="andaime" />;
}
function TintaNova({ x }: { x: number }) {
  return (
    <g className="cena__tinta" data-detalhe="pintura-nova">
      <path d={`M${x} ${CHAO}v-8h9v8M${x} ${CHAO - 8}q4.5 -6 9 0`} {...TRACO} />
      <path d={`M${x + 14} ${CHAO}l8 -14h6M${x + 22} ${CHAO - 14}v-3h8v3`} {...TRACO} />
    </g>
  );
}

const DESCRICAO: Record<FormaDaCasa, string> = {
  republica: 'uma república: sobrado dividido, com muitas janelas pequenas e varal na frente',
  kitnet: 'um corredor de kitnets, portas iguais lado a lado em dois pisos',
  apto_1q: 'um prédio baixo de três andares, com caixa-d\'água em cima',
  apto_2q: 'um prédio de cinco andares, com marquise na entrada',
  apto_3q: 'um prédio alto com varanda em todos os andares',
  alto_padrao: 'uma torre envidraçada de alto padrão, com portaria, piscina e palmeira',
  casa_simples: 'uma casa simples de laje, com ferro para cima e caixa-d\'água, sem garagem',
  casa_2q: 'uma casa de dois quartos, com muro baixo, portão e árvore no quintal',
  casa_3q: 'uma casa de três quartos, com garagem ao lado e quintal',
  casa_grande: 'uma casa grande de dois andares, com sacada, garagem dupla e jardim',
  sitio: 'um sítio: casa com varanda, cerca, árvores, roça e caixa-d\'água na torre',
  familia: 'a casa da família, antiga, com alpendre, vasos de planta e varal',
  parente: 'a casa de parentes, com um puxadinho em cima e escada de fora',
  favor: 'a casa de conhecidos, com um quartinho de favor nos fundos',
  funcional: 'uma moradia funcional: casas iguais da vila, com mastro e bandeira'
};

/** O que o desenho mostra, em palavras (tipo de casa e estado). */
export function descricaoDaCasa(l: LeituraLar): string {
  const c = l.condicao;
  const partes = [DESCRICAO[l.forma]];
  if (c.nivel === 'problema') partes.push(`com andaime e rachadura na parede, pedindo reparo${c.problema ? ` (${c.problema})` : ''}`);
  else if (c.nivel === 'ruim') partes.push('com rachaduras na parede');
  else if (c.nivel === 'gasta') partes.push('com manchas de umidade na parede');
  if (c.reformaRecente && c.nivel !== 'problema') partes.push('com pintura nova');
  else if (PLANTAS[l.forma].tijolo && l.padrao <= 1) partes.push('tijolo à vista');
  return partes.join(', ');
}

export function CenaDaCasa({ l }: { l: LeituraLar }) {
  const acesas = Math.max(1, l.janelasAcesas);
  const pl = PLANTAS[l.forma];
  const w = pl.parede;
  const c = l.condicao;
  const tijolo = pl.tijolo && l.padrao <= 1 && !(c.reformaRecente && c.nivel !== 'problema');
  const Forma = FORMAS[l.forma];
  const rotulo = `Desenho: ${descricaoDaCasa(l)}; ${acesas} ${acesas === 1 ? 'janela acesa' : 'janelas acesas'}${l.bichos.length ? `, ${l.bichos.map(b => b.nome).join(' e ')} na frente` : ''}${l.veiculo ? `, ${l.veiculo === 'carro' ? 'um carro' : l.veiculo === 'moto' ? 'uma moto' : 'uma bicicleta'} na porta` : ''}.`;
  return (
    <svg className={`cena cena--${l.forma} cena--${c.nivel}`} viewBox="0 0 312 140" role="img" aria-label={rotulo} data-forma={l.forma}>
      <path d={`M8 ${CHAO}h296`} {...TRACO} className="cena__chao" />
      <Forma acesas={acesas} tijolo={tijolo} />
      {(c.nivel === 'gasta' || c.nivel === 'ruim') && <Mancha x={w.x + w.l * 0.18} y={w.y + 6} />}
      {(c.nivel === 'ruim' || c.nivel === 'problema') && <Rachadura x={w.x + w.l * 0.74} y={w.y} a={w.a} />}
      {c.nivel === 'problema' && <Andaime x={w.x + 4} topo={Math.max(w.y - 2, 20)} />}
      {c.reformaRecente && c.nivel !== 'problema' && <TintaNova x={w.x + w.l - 36} />}
      {l.veiculo === 'carro' && <Carro x={pl.vaga} />}
      {l.veiculo === 'moto' && <Moto x={pl.vaga + 10} />}
      {l.veiculo === 'bicicleta' && <Bicicleta x={pl.vaga + 14} />}
      {l.bichos.filter(b => b.especie === 'gato' || b.especie === 'cachorro').slice(0, 2).map((b, k) => (b.especie === 'gato' ? <Gato key={b.id} x={pl.bichos + k * 24} /> : <Cachorro key={b.id} x={pl.bichos + k * 24} />))}
    </svg>
  );
}

function Carro({ x }: { x: number }) {
  return <g transform={`translate(${x} 110)`} className="cena__veiculo"><path d="M2 14h40M6 14V9l6-6h18l7 6h3v5" {...TRACO} /><circle cx={11} cy={15} r={3.5} {...TRACO} /><circle cx={33} cy={15} r={3.5} {...TRACO} /></g>;
}
function Moto({ x }: { x: number }) {
  return <g transform={`translate(${x} 112)`} className="cena__veiculo"><circle cx={5} cy={12} r={4.5} {...TRACO} /><circle cx={27} cy={12} r={4.5} {...TRACO} /><path d="M5 12l8-8h7l7 8M13 4l-2-3" {...TRACO} /></g>;
}
function Bicicleta({ x }: { x: number }) {
  return <g transform={`translate(${x} 113)`} className="cena__veiculo"><circle cx={5} cy={10} r={4.5} {...TRACO} /><circle cx={23} cy={10} r={4.5} {...TRACO} /><path d="M5 10l6-7h8l4 7M11 3l4 7" {...TRACO} /></g>;
}
function Cachorro({ x }: { x: number }) {
  return <g transform={`translate(${x} 116)`} className="cena__bicho"><path d="M2 12V6l3-3h9l2-3 3 1-1 4v7M5 12V8M15 12V8M1 6l-1-3" {...TRACO} /></g>;
}
function Gato({ x }: { x: number }) {
  return <g transform={`translate(${x} 115)`} className="cena__bicho"><path d="M3 13V6l2-4 2 3h4l2-3 2 4v7M3 13c-3 0-4-3-2-5" {...TRACO} /></g>;
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
