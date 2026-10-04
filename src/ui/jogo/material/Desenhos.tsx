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
import { NOME_FORMA, type FormaVeiculo } from '../../../motor/dados/bens';

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
  if (l.fachada) partes.push(['apto_1q', 'apto_2q', 'apto_3q', 'kitnet', 'alto_padrao', 'funcional'].includes(l.forma) ? `de fachada ${l.fachada.nome}` : `pintada de ${l.fachada.nome}`);
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
  const rotulo = `Desenho: ${descricaoDaCasa(l)}; ${acesas} ${acesas === 1 ? 'janela acesa' : 'janelas acesas'}${l.bichos.length ? `, ${l.bichos.map(b => b.nome).join(' e ')} na frente` : ''}${l.veiculo ? `, ${l.veiculo === 'carro' ? 'um carro' : l.veiculo === 'moto' ? 'uma moto' : 'uma bicicleta'} (${NOME_FORMA[formaNaPorta(l)!]}) na porta` : ''}.`;
  return (
    <svg className={`cena cena--${l.forma} cena--${c.nivel}${l.fachada ? ' cena--colorida' : ''}`} style={l.fachada ? { ['--fachada' as string]: l.fachada.cor } : undefined} viewBox="0 0 312 140" role="img" aria-label={rotulo} data-forma={l.forma}>
      <path d={`M8 ${CHAO}h296`} {...TRACO} className="cena__chao" />
      <Forma acesas={acesas} tijolo={tijolo} />
      {(c.nivel === 'gasta' || c.nivel === 'ruim') && <Mancha x={w.x + w.l * 0.18} y={w.y + 6} />}
      {(c.nivel === 'ruim' || c.nivel === 'problema') && <Rachadura x={w.x + w.l * 0.74} y={w.y} a={w.a} />}
      {c.nivel === 'problema' && <Andaime x={w.x + 4} topo={Math.max(w.y - 2, 20)} />}
      {c.reformaRecente && c.nivel !== 'problema' && <TintaNova x={w.x + w.l - 36} />}
      {l.veiculo && <g transform={`translate(${pl.vaga + (l.veiculo === 'carro' ? 0 : 8)} 107)`} className={`cena__veiculo${l.corVeiculo ? ' desenho-veiculo--colorido' : ''}`} style={l.corVeiculo ? estiloDaLataria(l.corVeiculo) : undefined} data-forma={formaNaPorta(l)}>{desenhoDaForma(formaNaPorta(l)!)}</g>}
      {l.bichos.filter(b => b.especie === 'gato' || b.especie === 'cachorro').slice(0, 2).map((b, k) => (b.especie === 'gato' ? <Gato key={b.id} x={pl.bichos + k * 24} /> : <Cachorro key={b.id} x={pl.bichos + k * 24} />))}
    </svg>
  );
}

/**
 * O desenho de cada FORMA de veículo, por FAMÍLIAS paramétricas (não um
 * carro genérico para tudo, nem um desenho à mão por modelo): o carro sai
 * da carroceria (hatch, sedã de três volumes, SUV compacto/médio/de sete
 * lugares, picape de cabine e caçamba, esportivo baixo) e das proporções
 * (teto, entre-eixos, vão livre, roda, capô); a moto sai da sua leitura
 * (motoneta, scooter, rua, esportiva carenada, trilha de para-lama alto,
 * clássica); a bicicleta, do quadro, do guidão e do pneu. Traço editorial,
 * sem marca nem logotipo — o modelo real, se houver, é só texto; a semente
 * (o id da versão) só mexe um pouco nas proporções, para dois sedãs não
 * saírem idênticos. Chão em y = 21 (a cena da casa conta com isso).
 */
const CHAO_V = 21;
/**
 * FIX pós-playtest humano — "a cor deve pertencer ao objeto": a lataria e o vidro leem a cor do veículo direto do
 * estilo (`--lataria`, `--vidro`, postos por `estiloDaLataria`), não de um seletor de CSS. Sem cor (o ícone da
 * interface), o traço de sempre no tom da área.
 */
// (Os atributos ficam — o ícone sem cor e quem lê o desenho os veem; o estilo, quando há cor, prevalece.)
const MASSA = { fill: 'currentColor', fillOpacity: 0.14, style: { fill: 'var(--lataria, currentColor)', fillOpacity: 'var(--lataria-op, 0.14)' } };
const VIDRO = { fill: 'currentColor', fillOpacity: 0.5, style: { fill: 'var(--vidro, currentColor)', fillOpacity: 'var(--vidro-op, 0.5)' }, stroke: 'none' };
/** A pintura no próprio quadro/para-lama (a bicicleta, a moto). */
const PINTADO = { stroke: 'var(--lataria, currentColor)' } as const;
function luminancia(hex: string): number {
  const c = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const escurecer = (hex: string, t: number) => '#' + [1, 3, 5].map(k => Math.round(parseInt(hex.slice(k, k + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
/** O estilo de um veículo com cor: a lataria na cor (opaca), o vidro escuro, o contorno escuro da própria cor — claro
 *  só quando a lataria é escura (o carro preto não some no fundo escuro). */
export function estiloDaLataria(cor: string): Record<string, string | number> {
  const valida = /^#[0-9a-f]{6}$/i.test(cor) ? cor : '#888888';
  const escura = luminancia(valida) < 0.025;
  return { '--cor-veiculo': valida, '--lataria': valida, '--lataria-op': 1, '--vidro': escura ? '#9fb2c2' : '#1f2a33', '--vidro-op': escura ? 0.55 : 0.82, '--pneu': '#181513', '--cubo': '#a8a29a', color: escura ? '#d8d1c4' : escurecer(valida, 0.62) };
}
type Pt = [number, number];
const f1 = (n: number) => Math.round(n * 10) / 10;
/** Polilinha com os cantos arredondados (corta `r` de cada lado do vértice). */
function arredondada(pts: Pt[], r: number): string {
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let k = 1; k < pts.length - 1; k++) {
    const [a, b, c] = [pts[k - 1], pts[k], pts[k + 1]];
    const corte = (p: Pt): Pt => { const dx = p[0] - b[0], dy = p[1] - b[1], n = Math.hypot(dx, dy) || 1, t = Math.min(r, n / 2) / n; return [b[0] + dx * t, b[1] + dy * t]; };
    const [p, q] = [corte(a), corte(c)];
    d += `L${f1(p[0])} ${f1(p[1])}Q${f1(b[0])} ${f1(b[1])} ${f1(q[0])} ${f1(q[1])}`;
  }
  const z = pts[pts.length - 1];
  return d + `L${f1(z[0])} ${f1(z[1])}`;
}
/** Recorta um polígono convexo entre duas verticais (as janelas entre as colunas). */
function entreX(poly: Pt[], x0: number, x1: number): Pt[] {
  const corta = (pts: Pt[], x: number, manter: (p: Pt) => boolean): Pt[] => pts.flatMap((p, k) => {
    const q = pts[(k + 1) % pts.length]; const out: Pt[] = manter(p) ? [p] : [];
    if (manter(p) !== manter(q)) { const t = (x - p[0]) / (q[0] - p[0]); out.push([x, p[1] + (q[1] - p[1]) * t]); }
    return out;
  });
  return corta(corta(poly, x0, p => p[0] >= x0), x1, p => p[0] <= x1);
}
const poligono = (pts: Pt[]) => pts.length ? `M${pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z` : '';
function hashV(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Quatro números em [-1, 1] estáveis por semente (a pequena variação de cada modelo). */
const variacao = (s?: string) => { if (!s) return [0, 0, 0, 0]; const h = hashV(s); return [0, 8, 16, 24].map(k => (((h >>> k) & 255) / 127.5) - 1); };

/** A roda: aro, cubo; o pneu de trilha tem cravos (traço interrompido). */
function Roda({ x, r, grossa = 1.6, cravos }: { x: number; r: number; grossa?: number; cravos?: boolean }) {
  // O pneu é pneu (escuro, cheio) e o cubo, metal — com cor; sem cor (o ícone), o traço de sempre.
  return <g><circle cx={x} cy={CHAO_V - r} r={r - grossa / 2 + 0.8} {...TRACO} style={{ fill: 'var(--pneu, none)' }} strokeWidth={grossa} strokeDasharray={cravos ? '1.3 0.9' : undefined} /><circle cx={x} cy={CHAO_V - r} r={r > 4 ? 1.4 : 1} style={{ fill: 'var(--cubo, currentColor)' }} /></g>;
}

type Traseira = 'hatch' | 'tres' | 'caixa' | 'cacamba' | 'fastback';
interface Carroceria {
  traseira: Traseira;
  x0: number; x1: number; eixoT: number; eixoD: number; r: number;
  /** Vão livre: o quanto a soleira fica acima do centro da roda. */
  folga: number;
  cintura: number; teto: number; capo: number;
  /** Fim do teto na frente e base do para-brisa. */
  tetoD: number; parabrisa: number;
  /** Sedã: fim do porta-malas; picape: fim da cabine; esportivo: início do teto. */
  volume?: number;
  /** As colunas entre as janelas (frações do vão envidraçado). */
  colunas: number[];
  rack?: boolean;
}
const CARROCERIAS: Record<'compacto' | 'hatch' | 'seda' | 'suv' | 'suv_medio' | 'suv_grande' | 'picape' | 'esportivo', Carroceria> = {
  // O compacto de entrada: curto, teto alto, rodas pequenas, quase sem capô (Kwid, Mobi, C3).
  compacto: { traseira: 'hatch', x0: 8.5, x1: 39.5, eixoT: 13.5, eixoD: 33.5, r: 3.2, folga: 1.2, cintura: 12, teto: 4.6, capo: 12.8, tetoD: 24.5, parabrisa: 29.5, colunas: [0.5] },
  hatch: { traseira: 'hatch', x0: 6, x1: 41.5, eixoT: 12.5, eixoD: 34.5, r: 3.6, folga: 0.8, cintura: 12.4, teto: 6, capo: 13.4, tetoD: 24, parabrisa: 30.5, colunas: [0.52] },
  seda: { traseira: 'tres', x0: 2, x1: 46, eixoT: 11.5, eixoD: 37, r: 3.5, folga: 0.6, cintura: 12.6, teto: 6.6, capo: 13.4, tetoD: 26, parabrisa: 33, volume: 11, colunas: [0.5] },
  suv: { traseira: 'caixa', x0: 4.5, x1: 43.5, eixoT: 12, eixoD: 35.5, r: 4.1, folga: 1.6, cintura: 11.2, teto: 4.6, capo: 11.8, tetoD: 26, parabrisa: 32, colunas: [0.5], rack: true },
  suv_medio: { traseira: 'caixa', x0: 3, x1: 45, eixoT: 11, eixoD: 37, r: 4.3, folga: 1.8, cintura: 10.9, teto: 3.9, capo: 11.4, tetoD: 28, parabrisa: 34, colunas: [0.42, 0.78], rack: true },
  suv_grande: { traseira: 'caixa', x0: 1.5, x1: 46.5, eixoT: 10, eixoD: 38.5, r: 4.5, folga: 2, cintura: 10.4, teto: 3, capo: 10.8, tetoD: 30, parabrisa: 35.5, colunas: [0.34, 0.67], rack: true },
  picape: { traseira: 'cacamba', x0: 1.5, x1: 46.5, eixoT: 9.5, eixoD: 38.5, r: 4.4, folga: 2.4, cintura: 10.6, teto: 3.8, capo: 10.8, tetoD: 31, parabrisa: 36, volume: 20, colunas: [0.5] },
  esportivo: { traseira: 'fastback', x0: 3, x1: 45.5, eixoT: 11, eixoD: 37, r: 3.8, folga: 0.1, cintura: 14.2, teto: 9, capo: 15.4, tetoD: 24, parabrisa: 30.5, volume: 16, colunas: [0.64] }
};

function Carro({ c: base, semente }: { c: Carroceria; semente?: string }) {
  const [a, b, d, e] = variacao(semente);
  const c = { ...base, teto: base.teto + 0.45 * a, tetoD: base.tetoD + 0.8 * b, parabrisa: base.parabrisa + 0.6 * b, capo: base.capo + 0.35 * d, r: base.r + 0.15 * e, folga: base.folga + 0.2 * e, x1: base.x1 + 0.4 * d, eixoD: base.eixoD + 0.3 * d };
  const cy = CHAO_V - c.r, sol = cy - c.folga, R = c.r + 1.1;
  const { x0, x1, cintura: ci, teto, capo } = c;
  const v = c.volume ?? 0;
  // O perfil de cima, de trás para a frente; e a "estufa" (o vão envidraçado): base de trás, topo de trás, topo da frente, base da frente.
  const [perfil, estufa]: [Pt[], Pt[]] =
    c.traseira === 'hatch' ? [[[x0, sol], [x0, ci + 0.6], [x0 + 2.4, teto], [c.tetoD, teto]], [[x0 + 1.4, ci], [x0 + 3.2, teto + 1.2]]]
    : c.traseira === 'tres' ? [[[x0, sol], [x0, ci - 0.4], [v, ci - 0.9], [v + 6, teto], [c.tetoD, teto]], [[v + 2.6, ci], [v + 6.6, teto + 1.2]]]
    : c.traseira === 'caixa' ? [[[x0, sol], [x0, teto + 1.4], [x0 + 1.2, teto], [c.tetoD, teto]], [[x0 + 1.4, ci], [x0 + 1.9, teto + 1.2]]]
    : c.traseira === 'cacamba' ? [[[x0, sol], [x0, ci], [v, ci], [v, teto + 0.6], [v + 0.8, teto], [c.tetoD, teto]], [[v + 1.2, ci], [v + 1.4, teto + 1.2]]]
    : [[[x0, sol], [x0, ci + 0.2], [x0 + 3, ci - 1], [v, teto], [c.tetoD, teto]], [[v - 2, ci], [v + 1.4, teto + 1.2]]];
  const cima: Pt[] = [...perfil, [c.parabrisa, ci], [x1 - 1.2, capo], [x1, capo + 1.4], [x1, sol]];
  const ar = (x: number) => `L${f1(x + R)} ${f1(sol)}A${f1(R)} ${f1(R)} 0 0 0 ${f1(x - R)} ${f1(sol)}`;
  const corpo = `${arredondada(cima, 1.3)}${ar(c.eixoD)}${ar(c.eixoT)}L${x0} ${f1(sol)}Z`;
  // As janelas: a estufa recortada pelas colunas.
  const vao: Pt[] = [estufa[0], estufa[1], [c.tetoD - 0.8, teto + 1.2], [c.parabrisa - 1.6, ci]];
  const [xa, xb] = [Math.min(vao[0][0], vao[1][0]), c.parabrisa - 1.6];
  const cortes = [xa, ...c.colunas.map(f => xa + (xb - xa) * f), xb];
  const janelas = cortes.slice(0, -1).map((x, k) => entreX(vao, x + (k ? 0.6 : 0), cortes[k + 1] - (k < cortes.length - 2 ? 0.6 : 0)));
  return (
    <g>
      <path d={corpo} {...TRACO} {...MASSA} />
      {janelas.map((j, k) => <path key={k} d={poligono(j)} {...VIDRO} />)}
      {c.rack && <path d={`M${f1(x0 + 3)} ${f1(teto - 1.1)}H${f1(c.tetoD - 3)}`} {...FINO} />}
      {c.traseira === 'cacamba' && <path d={`M${f1(x0 + 1)} ${f1(ci + 1.4)}H${f1(v - 1)}`} {...FINO} />}
      <path d={`${capo + 2.4 < sol - 0.5 ? `M${f1(x1 - 0.2)} ${f1(capo + 2.4)}h-1.8` : ''}M${f1(x0 + 0.2)} ${f1(Math.max(ci, teto + 2) + 1.2)}v1.6`} {...TRACO} strokeWidth={1.2} />
      <Roda x={c.eixoT} r={c.r} /><Roda x={c.eixoD} r={c.r} />
    </g>
  );
}

const GROSSO = { ...TRACO, strokeWidth: 2.4 };
/** Para-lama colado na roda (arco por cima). */
const paraLama = (x: number, r: number, de = 200, ate = 340, folga = 1.4) => {
  const R = r + folga, cy = CHAO_V - r, p = (g: number) => `${f1(x + R * Math.cos(g * Math.PI / 180))} ${f1(cy + R * Math.sin(g * Math.PI / 180))}`;
  return <path d={`M${p(de)}A${f1(R)} ${f1(R)} 0 0 1 ${p(ate)}`} {...TRACO} {...PINTADO} strokeWidth={2} />;
};

const MOTOS: Record<'cub' | 'scooter' | 'street' | 'esportiva' | 'cruiser' | 'trail', () => ReactNode> = {
  // Motoneta: rodas grandes e finas, escudo de pernas, quadro baixo de passar a perna, banco comprido.
  cub: () => <>
    <Roda x={10} r={4.4} /><Roda x={36.5} r={4.4} />
    <path d="M36.5 16.6L33.8 6M31.4 5.6H36.2" {...TRACO} /><circle cx={35.6} cy={7.6} r={1.1} {...TRACO} />
    <path d="M4.6 11.4L5.4 9.8H19.8C20.8 9.8 21.2 10.6 21.2 11.6C21.2 13.8 21.8 16.4 23.4 16.4H28.6C29.2 13 30.8 9.4 33 7.2L34.4 8C33 10.4 32 13.6 31.8 16.8H22.6C20.6 16.8 19.6 13 17.4 12.6H7.6C6 12.6 4.8 12.4 4.6 11.4Z" {...TRACO} {...MASSA} />
    <path d="M6.4 9.4H19.4" {...GROSSO} />
    {paraLama(36.5, 4.4, 225, 330, 1.2)}
  </>,
  // Scooter: rodas pequenas, assoalho plano, carenagem fechada atrás, escudo na frente.
  scooter: () => <>
    <Roda x={9.5} r={3.3} /><Roda x={37.5} r={3.3} />
    <path d="M3.4 17.4C3 13.4 5.6 10.8 10.4 10.4H20.2L22.6 16.8H30.4C32.2 13.2 32.8 9.6 33 5.8L35.4 5.4C35.8 9.6 37.8 12.4 40.8 13.8C41.2 15 40.4 15.4 39.4 15C37.6 13.6 35.2 13.8 34 16.8L30.4 16.8" {...TRACO} {...MASSA} />
    <path d="M8 10.4H19.4" {...GROSSO} />
    <path d="M31.2 5.6L36.2 4.6M35.4 5.4L36 3" {...TRACO} />
  </>,
  // Rua (naked): tanque em cima do motor à vista, farol redondo, banco reto, rabeta curta.
  street: () => <>
    <Roda x={9.5} r={4.6} /><Roda x={36} r={4.6} />
    <path d="M9.5 16.4L19.6 14.4M20 14L22 9.8L31.2 7.2" {...TRACO} />
    <rect x={18.6} y={12.2} width={7.6} height={5.4} rx={1.2} {...TRACO} {...MASSA} />
    <path d="M21 9.8C22 6.6 27.6 6.2 30.8 7.4L29.6 10.2Z" {...TRACO} {...MASSA} />
    <path d="M11.2 9.8L21 9.8M6.4 8.4L11.2 9.8" {...GROSSO} />
    <path d="M5.6 8.6L11.4 10.6L19.8 10.8L18.6 13.2L10.6 12.4Z" {...TRACO} {...MASSA} />
    <path d="M36 16.4L32.4 5.2M30.6 4.8L34.4 4.2" {...TRACO} /><circle cx={34.6} cy={7.6} r={1.4} {...TRACO} />
    {paraLama(36, 4.6, 215, 310, 1.2)}
  </>,
  // Esportiva: carenagem em cunha cobrindo o motor, bolha, rabeta alta e pontuda.
  esportiva: () => <>
    <Roda x={9.5} r={4.5} /><Roda x={36.5} r={4.5} />
    <path d="M9.5 16.5L18.6 14.6M36.5 16.5L34 8" {...TRACO} />
    <path d="M40.4 11.8C39.6 8.6 37.4 6.4 34 5.4L29.6 7.6L23.4 7.4C21.4 8.8 18.6 8.8 16.4 8.4L5.6 6.2L7.4 8.8L15.2 11C17.4 14.2 20 16.2 24 16.4L33 15C35.8 13.8 38.8 13.4 40.4 11.8Z" {...TRACO} {...MASSA} />
    <path d="M34 5.4L31.8 3.4M17 8.6L23.4 7.4" {...TRACO} /><path d="M31 7.2l-2.6 0.2" {...TRACO} />
  </>,
  // Clássica: tanque gota, farol redondo grande, para-lamas abraçando as rodas, banco baixo, guidão alto.
  cruiser: () => <>
    <Roda x={8.6} r={4.6} /><Roda x={37} r={4.6} />
    {paraLama(8.6, 4.6, 180, 320)}{paraLama(37, 4.6, 205, 345)}
    <path d="M8.6 16.4L18 15M18.4 12.6L21 8.6L32.6 6.6M37 16.4L32.6 5.6C31.2 3.4 29.2 3.4 28.4 4.6" {...TRACO} />
    <ellipse cx={25.4} cy={8.2} rx={4.6} ry={2.3} transform="rotate(-6 25.4 8.2)" {...TRACO} {...MASSA} />
    <path d="M11.4 10C14.6 11.6 18 11.4 20.6 9.6" {...GROSSO} />
    <rect x={18.6} y={11.6} width={7.4} height={5.6} rx={1} {...TRACO} {...MASSA} /><path d="M19.6 13.4h5.4M19.6 15.2h5.4" {...FINO} />
    <circle cx={34.8} cy={7.4} r={1.9} {...TRACO} {...MASSA} /><path d="M10.4 18.8H22" {...TRACO} />
  </>,
  // Trilha: alta, suspensão longa, pneu de cravos, para-lama alto em bico, banco longo e reto.
  trail: () => <>
    <Roda x={9.5} r={5} cravos /><Roda x={36} r={5} cravos />
    <path d="M36 16L32 3.4M29.4 3.2L34.8 2.4M9.5 16L19.8 13.6M14.2 8.6L18.6 13.6M20.6 10L19.8 13.4" {...TRACO} />
    <path d="M32.6 6.4L40 7.8" {...GROSSO} />
    <path d="M21 10C22 6.6 27.8 6 31 6.8L29.2 11Z" {...TRACO} {...MASSA} />
    <rect x={19.4} y={12.2} width={6.4} height={4.4} rx={1} {...TRACO} {...MASSA} />
    <path d="M11 8.2L24.6 7.6M4.4 6.6L11 8.2" {...GROSSO} />
    <path d="M10.6 9L18.8 9.4L18.4 12L12.4 11.2Z M31.6 5.6L41 7.4L39.6 8.8L32.4 7.6Z" {...TRACO} {...MASSA} />
  </>
};

/** A bicicleta: duas rodas finas grandes; o quadro, o guidão e o pneu dizem qual é. */
const BIKE_RODA = 5.4;
const BIKES: Record<'urbana' | 'estrada' | 'mtb' | 'eletrica', () => ReactNode> = {
  // Urbana: quadro aberto (de passar a perna), guidão alto voltado para trás, cestinha, para-lamas.
  urbana: () => <>
    <Roda x={10} r={BIKE_RODA} grossa={1.1} /><Roda x={35} r={BIKE_RODA} grossa={1.1} />
    {paraLama(10, BIKE_RODA, 190, 300, 1)}{paraLama(35, BIKE_RODA, 230, 330, 1)}
    <path className="quadro" style={{ stroke: 'var(--lataria, currentColor)' }} d="M31.2 9C26.4 14.4 23 16.6 20 16.4L10 15.6M20 16.4L16.8 8.4M10 15.6L17.2 10.2M31.2 9L35 15.6M31.2 9L30.6 5.6L27.4 6.4" {...TRACO} strokeWidth={1.3} />
    <path d="M14.6 7.6H18.8" {...GROSSO} />
    <path d="M32.6 6.2H38.8L38 10.2H33.4Z" {...TRACO} strokeWidth={1.2} {...MASSA} />
  </>,
  // Estrada (speed): quadro em diamante de tubo horizontal, guidão curvo para baixo, pneus finos, selim alto.
  estrada: () => <>
    <Roda x={10} r={BIKE_RODA} grossa={0.9} /><Roda x={35} r={BIKE_RODA} grossa={0.9} />
    <path className="quadro" style={{ stroke: 'var(--lataria, currentColor)' }} d="M10 15.6L20 16.4L17.6 7.6H31.2L31.8 10.2L20 16.4M10 15.6L17.6 7.6M31.8 10.2C32.6 12 34 13.6 35 15.6M31.2 7.6L33.6 7.2C36 7.2 36 10.8 33.6 10.6" {...TRACO} strokeWidth={1.2} />
    <path d="M15.4 6.4H19.8" {...GROSSO} />
  </>,
  // Mountain bike: pneus grossos de cravos, garfo de suspensão, tubo superior inclinado, guidão reto largo.
  mtb: () => <>
    <Roda x={10} r={BIKE_RODA} grossa={2.4} cravos /><Roda x={35} r={BIKE_RODA} grossa={2.4} cravos />
    <path className="quadro" style={{ stroke: 'var(--lataria, currentColor)' }} d="M10 15.6L20 16.4L18 8.6L30.4 7.4L31 10.2L20 16.4M10 15.6L18 8.6M30.4 7.4L30 5.6M28 5.6H33" {...TRACO} strokeWidth={1.5} />
    <path d="M31 10.2L32.6 12.6" {...GROSSO} /><path d="M32.6 12.6L35 15.6" {...TRACO} />
    <path d="M15.8 7.4H20" {...GROSSO} />
  </>,
  // Elétrica: quadro urbano com a bateria no tubo de baixo e o motor no cubo traseiro.
  eletrica: () => <>
    <Roda x={10} r={BIKE_RODA} grossa={1.3} /><Roda x={35} r={BIKE_RODA} grossa={1.3} />
    {paraLama(10, BIKE_RODA, 190, 300, 1)}{paraLama(35, BIKE_RODA, 230, 330, 1)}
    <path className="quadro" style={{ stroke: 'var(--lataria, currentColor)' }} d="M10 15.6L20 16.4L17.2 8.4M10 15.6L17.2 10.6L30.6 8.6M31.2 9L35 15.6M30.6 8.6L30 5.6L27.2 6.2" {...TRACO} strokeWidth={1.3} />
    <path d="M20.6 15.2L30.2 9.6" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" />
    <circle cx={10} cy={CHAO_V - BIKE_RODA} r={2} fill="currentColor" />
    <path d="M15 7.4H19.2" {...GROSSO} />
  </>
};

/**
 * A água (marolas) e o leque de espuma: a linha d'água das embarcações.
 */
const Marola = ({ de = 1, ate = 47, y = 21 }: { de?: number; ate?: number; y?: number }) => {
  let d = `M${de} ${y}`;
  for (let x = de; x < ate; x += 6) d += `q1.5 -1 3 0t3 0`;
  return <path d={d} {...TRACO} strokeWidth={0.9} opacity={0.7} />;
};

/**
 * Moto aquática: casco curto em cunha (proa alta, popa rente à água), o
 * capô em corcova na frente, a coluna com o guidão em T, o banco de selim
 * comprido e o jato de espuma saindo da popa. Nada de cabine nem convés.
 */
function JetSki() {
  return <>
    <path d="M9 17.4C6.4 15.6 4.6 12.6 4.2 9M7.6 18.4C4.8 17.6 2.6 15.4 1.6 12.6" {...TRACO} strokeWidth={1} opacity={0.75} />
    <circle cx={3.4} cy={8.2} r={0.6} fill="currentColor" opacity={0.7} /><circle cx={1.4} cy={11} r={0.5} fill="currentColor" opacity={0.6} />
    <path d="M9.2 14.2L11.4 19.2H33.6C36.6 19.2 39.2 17.2 41.4 13.2L36 12.8C33.8 10.6 31.6 9.8 29.8 10.2L27.4 13H11.2Z" {...TRACO} {...MASSA} />
    <path d="M12.6 13C12.6 11.2 13.8 10.2 15.6 10.2H23.4C25.2 10.2 26.6 11.4 27 13Z" fill="currentColor" fillOpacity={0.55} stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
    <path d="M29.6 10.4L28 6.4" {...TRACO} />
    <path d="M26.2 6.2L30.2 5.6" {...GROSSO} />
    <path d="M12 16.4H38.4" {...FINO} opacity={0.6} />
    <Marola de={10} ate={47} />
  </>;
}

/**
 * Os aviões, de perfil (nariz à direita), por família: o que separa um do
 * outro é a posição da asa (no alto do teto, com montante; ou embaixo da
 * cabine, com o trem saindo dela), o número de motores (hélice no nariz;
 * duas naceles na asa e nariz liso; reatores na cauda, sem hélice) e o
 * porte (ultraleve: casulo e cauda em tubo; jato: fuselagem longa de
 * janelinhas redondas e cauda em T). Desenho original, sem copiar modelo.
 */
const HELICE = (x: number, y: number, a: number) => <>
  <ellipse cx={x + 0.9} cy={y} rx={0.7} ry={a} fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={0.5} />
  <ellipse cx={x} cy={y} rx={1.1} ry={1.2} fill="currentColor" />
</>;
const RODINHA = (x: number, r = 1.3) => <circle cx={x} cy={CHAO_V - r} r={r} {...TRACO} strokeWidth={1.1} fill="currentColor" fillOpacity={0.5} />;
/** A asa vista de perto, em leve perspectiva: a meia-asa do nosso lado, chapada. */
const MEIA_ASA = (pts: Pt[]) => <path d={poligono(pts)} fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth={0.9} strokeLinejoin="round" />;

const AVIOES: Record<'ultraleve' | 'monomotor' | 'asa_baixa' | 'bimotor' | 'jato', () => ReactNode> = {
  // Ultraleve: pequeno e leve, de nariz empinado sobre a bequilha (o trem convencional), fuselagem fina de tela, asa alta comprida com montantes em V, hélice grande.
  ultraleve: () => <>
    <g transform="rotate(-9 31 18)">
      <path d="M6.6 11.4L6 5.2H8.8L12.6 10.6" {...TRACO} {...MASSA} strokeWidth={1.2} />
      <path d="M5.6 11.6C5.6 11 6 10.8 6.8 10.8L22 9.4H30.6L33.6 11.2H37.4C38.4 11.6 38.8 12.4 38.8 13.2C38.8 14.2 38.2 14.8 37.2 15L31.6 15.6H23L6.6 12.4C6 12.3 5.6 12 5.6 11.6Z" {...TRACO} {...MASSA} />
      <ellipse cx={8.6} cy={11.6} rx={4} ry={0.8} fill="currentColor" />
      <path d="M24.4 10.6H29.8L32 12.6H24.4Z" {...VIDRO} />
      <path d="M17.4 8.2C17.4 7.4 18 7 19 7H37.4C38.2 7.2 38.2 8.2 37.4 8.4L18.4 9C17.8 9 17.4 8.8 17.4 8.2Z" {...TRACO} {...MASSA} strokeWidth={1.1} />
      <path d="M25.6 15.4L20.6 9M25.6 15.4L32.6 8.6" {...FINO} />
      {HELICE(39.6, 13.2, 5.6)}
      <path d="M30 15.6L31 19.6" {...TRACO} strokeWidth={1.2} />
    </g>
    {RODINHA(31.4, 1.5)}
    <path d="M6.8 17.4L6.4 19.8" {...TRACO} strokeWidth={1} /><circle cx={6.4} cy={20.2} r={0.7} fill="currentColor" />
  </>,
  // Monomotor de asa alta: a asa sobre o teto da cabine, um montante diagonal até a barriga, trem fixo com carenagem, hélice no nariz.
  monomotor: () => <>
    <path d="M4 11.2L5 3.6H8.4L13.4 9.8" {...TRACO} {...MASSA} />
    <path d="M3.4 11.4C3.4 10.6 4 10.2 5 10.4L18.6 8.8H30.2L33.6 11H38.8C40 11.4 40.6 12.4 40.6 13.6C40.6 14.8 40 15.8 38.8 16.2L33 17H19L4.4 13C3.8 12.8 3.4 12.2 3.4 11.4Z" {...TRACO} {...MASSA} />
    <ellipse cx={7.4} cy={11.4} rx={5} ry={0.9} fill="currentColor" />
    <path d="M19.8 10.2H24.4V12.8H19.8ZM25.6 10.2H29.6L32.2 12.4L25.6 12.8Z" {...VIDRO} />
    <path d="M16.4 8C16.4 7 17.2 6.6 18.4 6.6H33.6C34.4 6.8 34.6 7.8 33.8 8.2L17.6 9.2C16.8 9.2 16.4 8.8 16.4 8Z" {...TRACO} {...MASSA} strokeWidth={1.2} />
    <path d="M25.4 8.4L21.6 16.2" {...TRACO} strokeWidth={1.1} />
    <path d="M22.6 17L24 19M36.6 16.4V19" {...TRACO} strokeWidth={1.1} />
    <ellipse cx={24.4} cy={19.2} rx={2} ry={1.4} {...TRACO} strokeWidth={1.1} fill="currentColor" fillOpacity={0.5} />{RODINHA(36.6, 1.2)}
    {HELICE(41, 13.6, 5.4)}
  </>,
  // Monomotor de asa baixa: a cabine é uma capota baixa, a asa sai da barriga (com o trem saindo dela) e a meia-asa aparece por baixo.
  asa_baixa: () => <>
    <path d="M4 11.4L4.8 4.4H8L12.6 10.4" {...TRACO} {...MASSA} />
    <path d="M3.4 11.6C3.4 10.8 4 10.4 5 10.6L18.4 10.4C20.4 8.2 24 7.8 28.4 8.4L33.4 11H38.8C40 11.4 40.6 12.4 40.6 13.6C40.6 14.8 40 15.8 38.8 16.2L33 16.6H19L4.4 13C3.8 12.8 3.4 12.2 3.4 11.6Z" {...TRACO} {...MASSA} />
    <ellipse cx={7.4} cy={11.6} rx={5} ry={0.9} fill="currentColor" />
    <path d="M20.6 10.4C21.8 9.4 23.6 9.2 25.6 9.4V11.4H20.6ZM26.6 9.5C28.8 9.6 30.8 10.4 32 11.4H26.6Z" {...VIDRO} />
    <path d="M17.4 16.4C17.4 15.6 18 15.2 19 15.2H32.4C33.2 15.4 33.2 16.4 32.4 16.6L18.4 17.2C17.8 17.2 17.4 16.8 17.4 16.4Z" {...TRACO} {...MASSA} strokeWidth={1.2} />
    {MEIA_ASA([[19, 16.8], [31.6, 16.4], [27.6, 19.4], [21, 19.4]])}
    <path d="M24.6 17.2V19M36.6 16.4V19" {...TRACO} strokeWidth={1.1} />
    {RODINHA(24.6, 1.2)}{RODINHA(36.6, 1.2)}
    {HELICE(41, 13.6, 5.4)}
  </>,
  // Bimotor: nariz liso e comprido (sem hélice), cabine de várias janelas, asa baixa com a nacele do motor à frente dela e a sua hélice.
  bimotor: () => <>
    <path d="M3.6 10.4L4.2 2.4H7.6L12.6 9.6" {...TRACO} {...MASSA} />
    <path d="M3 10.8C3 10 3.6 9.6 4.6 9.8L15.6 8.8H33L36.2 10.4C40 10.6 43.4 11.6 45.4 13.2C43.6 14.6 40.6 15.2 37 15.2H17L4 12.2C3.4 12 3 11.6 3 10.8Z" {...TRACO} {...MASSA} />
    <ellipse cx={6.8} cy={10.8} rx={4.8} ry={0.9} fill="currentColor" />
    <path d="M36.2 10.4C38 10.6 39.8 11.2 41 12L36.6 12.2Z" {...VIDRO} />
    {[16.4, 20, 23.6].map(x => <rect key={x} x={x} y={10.2} width={2.2} height={1.8} rx={0.8} {...VIDRO} />)}
    <path d="M14.8 15.6C14.8 14.8 15.4 14.4 16.4 14.4H30C30.8 14.6 30.8 15.8 30 16L15.8 16.6C15.2 16.6 14.8 16.2 14.8 15.6Z" {...TRACO} {...MASSA} strokeWidth={1.2} />
    <path d="M24 15.4C24 13.6 25.4 12.6 27.4 12.6H32.6C34.6 12.8 35.8 14 35.8 15.4C35.8 16.8 34.6 17.8 32.6 17.8H27.4C25.4 17.8 24 17 24 15.4Z" fill="currentColor" fillOpacity={0.55} stroke="currentColor" strokeWidth={1.4} />
    {HELICE(36.6, 15.2, 4.2)}
    <path d="M30 17.8V19.4M41 15.2V19.4" {...TRACO} strokeWidth={1.1} />
    {RODINHA(30, 1.1)}{RODINHA(41, 1)}
  </>,
  // Jato executivo: fuselagem longa e fina, nariz em ponta, fileira de janelinhas redondas, cauda alta em T, os reatores colados atrás, asa enflechada.
  jato: () => <>
    <path d="M5.4 9.8L3 2.4H5.6L11.6 9.4" {...TRACO} {...MASSA} />
    <path d="M1 2.6H8.6" {...TRACO} strokeWidth={1.5} />
    <path d="M2.4 10.4C2.4 9.6 3 9.2 4 9.2H36.6C40.4 9.4 44.6 11 46.6 13C44.6 14.8 41 15.4 37 15.4H11L3.6 12C2.8 11.6 2.4 11.2 2.4 10.4Z" {...TRACO} {...MASSA} />
    <path d="M38 10C40.2 10.4 42 11.2 43 12L38.4 12.2Z" {...VIDRO} />
    {[17, 20.2, 23.4, 26.6, 29.8, 33].map(x => <circle key={x} cx={x} cy={11.6} r={0.75} {...VIDRO} />)}
    <path d="M8.6 7.2C8.6 6.2 9.4 5.6 10.6 5.6H17.4C18.4 5.8 18.4 7.6 17.4 7.8H10.6C9.4 7.8 8.6 7.6 8.6 7.2Z" {...TRACO} {...MASSA} strokeWidth={1.2} />
    <path d="M17.6 5.9V7.5" {...TRACO} strokeWidth={1.4} />
    <path d="M13.4 7.8L14.4 9.2" {...TRACO} strokeWidth={1.2} />
    {MEIA_ASA([[20, 15.2], [30, 15.2], [22.4, 18.6], [17, 18.6]])}
    <path d="M22.6 15.4V19.4M39.4 15V19.4" {...TRACO} strokeWidth={1.1} />
    {RODINHA(22.6, 1.1)}{RODINHA(39.4, 1)}
  </>
};

const OUTROS: Record<'jetski' | 'lancha' | 'veleiro', () => ReactNode> = {
  jetski: () => <JetSki />,
  lancha: () => <><path d="M2 13h42l-6 6H8zM15 13l4-5h10l3 5M34 13v-3" {...TRACO} /><path d="M1 21c5-1 10 1 15 0s10-1 15 0 9 1 14 0" {...TRACO} strokeWidth={1} /></>,
  veleiro: () => <><path d="M5 16h34l-5 4H10zM21 16V2M21 3l13 12H21M21 5l-9 10h9" {...TRACO} /></>
};

/** O desenho de uma forma (com a semente, a pequena variação do modelo). */
function desenhoDaForma(forma: FormaVeiculo, semente?: string): ReactNode {
  if (forma in CARROCERIAS) return <Carro c={CARROCERIAS[forma as keyof typeof CARROCERIAS]} semente={semente} />;
  const f = (MOTOS as Record<string, () => ReactNode>)[forma] ?? (BIKES as Record<string, () => ReactNode>)[forma] ?? (OUTROS as Record<string, () => ReactNode>)[forma] ?? (AVIOES as Record<string, () => ReactNode>)[forma];
  return f ? f() : <Carro c={CARROCERIAS.hatch} />;
}

/** A forma do veículo na porta (sem a versão, a forma típica da categoria). */
const formaNaPorta = (l: LeituraLar): FormaVeiculo | undefined => l.formaVeiculo ?? (l.veiculo === 'carro' ? 'hatch' : l.veiculo === 'moto' ? 'street' : l.veiculo === 'bicicleta' ? 'urbana' : undefined);

/**
 * O estado aparece no desenho (FIX pós-REWORK 4), não só no texto: o zero tem brilho na lataria; o usado tem riscos;
 * o cansado, pintura gasta e ferrugem. Sempre com o texto ao lado (nunca só a forma).
 */
function Desgaste({ forma, estado }: { forma: FormaVeiculo; estado: number }) {
  const carro = forma in CARROCERIAS;
  const moto = forma in MOTOS;
  if (estado >= 90 && carro) return <path className="desenho-veiculo__brilho" d="M11 12.6q7-1.1 13-.7" fill="none" stroke="#fffaf0" strokeOpacity={0.6} strokeWidth={0.8} strokeLinecap="round" />;
  if (estado >= 60) return null;
  return (
    <g className="desenho-veiculo__desgaste" data-desgaste={estado < 40 ? 'cansado' : 'usado'}>
      {carro && <path d="M15 15.6l2.4-.7M30.5 14.6l1.9.9M22 16.4l1.2-.3" fill="none" stroke="#fffaf0" strokeOpacity={0.55} strokeWidth={0.6} strokeLinecap="round" />}
      {moto && <path d="M21.5 11.2l1.6-.5" fill="none" stroke="#fffaf0" strokeOpacity={0.55} strokeWidth={0.6} strokeLinecap="round" />}
      {estado < 40 && carro && <><ellipse cx={19.5} cy={16.2} rx={1.5} ry={0.8} fill="#8a5434" fillOpacity={0.9} /><ellipse cx={37.2} cy={15.4} rx={1.1} ry={0.7} fill="#8a5434" fillOpacity={0.85} /></>}
      {estado < 40 && moto && <ellipse cx={24} cy={9.4} rx={1.1} ry={0.6} fill="#8a5434" fillOpacity={0.85} />}
    </g>
  );
}

/** `semente` (o id da versão, opcional): a variação de proporção do modelo — dois sedãs não saem idênticos. */
export function DesenhoVeiculo({ forma, rotulo, largura = 48, semente, cor, estado }: { forma: FormaVeiculo; rotulo?: string; largura?: number; semente?: string; cor?: string; estado?: number }) {
  // REWORK 4: com cor (o veículo desta vida), a lataria ganha a cor dele; o traço continua o da interface.
  return (
    <svg className={`desenho-veiculo desenho-veiculo--${forma}${cor ? ' desenho-veiculo--colorido' : ''}`} style={cor ? estiloDaLataria(cor) : undefined} viewBox="0 0 48 24" width={largura} height={largura / 2} role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true} data-forma={forma}>
      {desenhoDaForma(forma, semente)}
      {cor && estado !== undefined && <Desgaste forma={forma} estado={estado} />}
    </svg>
  );
}

function Cachorro({ x }: { x: number }) {
  return <g transform={`translate(${x} 116)`} className="cena__bicho"><path d="M2 12V6l3-3h9l2-3 3 1-1 4v7M5 12V8M15 12V8M1 6l-1-3" {...TRACO} /></g>;
}
function Gato({ x }: { x: number }) {
  return <g transform={`translate(${x} 115)`} className="cena__bicho"><path d="M3 13V6l2-4 2 3h4l2-3 2 4v7M3 13c-3 0-4-3-2-5" {...TRACO} /></g>;
}

const ICONES: Record<string, string> = {
  // As lojas das coisas da vida (`dados/coisas`).
  eletronicos: 'M3 6h12v9H3zM1 18h16M18 8h4v12h-4zM19.5 17h1',
  eletrodomesticos: 'M5 3h14v18H5zM5 7h14M8 5h1M8 14a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  instrumentos: 'M14 4l6 6M17 7l-6 6M10 12a4 4 0 1 0 1 5a3 3 0 0 0-1-5zM7.5 16.5h.5',
  esportes: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  livraria: 'M4 5c3-1 6-1 8 1c2-2 5-2 8-1v14c-3-1-6-1-8 1c-2-2-5-2-8-1zM12 6v14',
  predio: 'M5 21V4h10v17M15 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1M3 21h18',
  kitnet: 'M4 21V5h16v16M8 9h2M14 9h2M8 13h2M14 13h2M11 21v-4h2v4M2 21h20',
  casa: 'M3 11l9-7 9 7M5 10v11h14V10M10 21v-6h4v6',
  carro: 'M3 16h18M5 16v-4l3-4h8l4 4v4M7.5 18.5a1.5 1.5 0 1 0 0-.01M16.5 18.5a1.5 1.5 0 1 0 0-.01',
  moto: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l5-6h5l4 6M10 11l-1-3h3',
  bicicleta: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l4-7h6l4 7M9 10l3 7',
  nautica: 'M3 15h18l-3 4H6zM12 15V4M12 5l6 8h-6M2 21c3-1 5 1 8 0s5-1 8 0 3 1 4 0',
  aeroclube: 'M2 13h16l4-2M11 13l-4 6M11 13l-4-6M20 11v4M2 11v4',
  banco: 'M3 9l9-5 9 5M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18',
  // A clínica: o prédio com a cruz e o perfil de um rosto (estética, não hospital).
  clinica: 'M4 21V7h10v14M9 10v4M7 12h4M17 9c2 0 3 2 3 4s-1 2-2 2l1 3h-3M2 21h20',
  abrigo: 'M4 12c0-4 3-6 5-6M20 12c0-4-3-6-5-6M7 14c1 4 9 4 10 0M9 9h.01M15 9h.01M12 12v1',
  oficina: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9M7 17l-3 3',
  imobiliaria: 'M4 20V9l6-4 6 4v11M16 12h4v8M8 13h4M8 16h4M2 20h20',
  usados: 'M3 16h18M5 16v-4l3-4h8l4 4v4M12 4v3M10 5h4',
  concessionaria: 'M3 16h18M5 16v-4l3-4h8l4 4v4M4 4h16',
  loja_pets: 'M4 10h16v10H4zM3 10l2-5h14l2 5M9 14c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3-1-3-2M8 12.5h.01M16 12.5h.01',
  loja: 'M3 9h18l-1.5 11h-15zM8 9V7a4 4 0 0 1 8 0v2M5 13a2.5 2.5 0 0 0 5 0M14 13a2.5 2.5 0 0 0 5 0',
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

/**
 * FIX pós-REWORK 4: a miniatura da casa — a MESMA silhueta da cena (o prédio baixo, a torre, a casa de laje, a casa
 * grande), na cor da fachada dela. Na vitrine da imobiliária e entre os bens: reconhecível antes do rótulo.
 */
export function MiniaturaDaCasa({ forma, fachada, rotulo, largura = 104 }: { forma: FormaDaCasa; fachada?: { cor: string; nome: string }; rotulo?: string; largura?: number }) {
  const Forma = FORMAS[forma];
  return (
    <svg className={`cena cena--miniatura cena--${forma}${fachada ? ' cena--colorida' : ''}`} style={{ ...(fachada ? { ['--fachada' as string]: fachada.cor } : {}), width: largura }} viewBox="30 10 252 124" role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true} data-forma={forma}>
      <path d={`M24 ${CHAO}h264`} {...TRACO} className="cena__chao" />
      <Forma acesas={1} tijolo={false} />
    </svg>
  );
}

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
