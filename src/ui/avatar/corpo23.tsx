/**
 * VIDA 23 — O CORPO NA FIGURA: as marcas naturais nas regiões do corpo (as mesmas caixas anatômicas das tatuagens, de
 * frente e de costas, recortadas pela parte do corpo — nunca flutuam fora da pele), os pelos do corpo (antebraços,
 * canelas e coxas, o peito) e o desenho do músculo (o deltoide, o bíceps, o peitoral e o abdômen) e o volume do peito.
 * Tudo isso fica na pele, por baixo da roupa: a roupa cobre o que cobre.
 */
import type { ReactElement } from 'react';
import { acaso23, type MarcaNatural } from '../../motor/v23/corpo/corpo23';
import { REGIOES } from '../../motor/dados/tatuagens';
import { caixaDaRegiao, ladoNaTela, visivelNaVista, type GeoDoCorpo } from './tatuagensNaPele';
import { DesenhoDaMarca } from './marcas23';
import { misturar } from './cores';

const n2 = (x: number) => x.toFixed(2);

/** As marcas do corpo (as do rosto, o retrato desenha). */
export function MarcasNaPele({ g, lista, pele, ide, costas, detalhe }: { g: GeoDoCorpo; lista: MarcaNatural[]; pele: string; ide: (k: string) => string; costas: boolean; detalhe: boolean }): ReactElement | null {
  const vis = lista.filter(m => m.t !== 'covinhas' && visivelNaVista(m.r, costas));
  if (!vis.length) return null;
  return (
    <g className="figura__marcas">
      {vis.map((m, k) => {
        const s = REGIOES[m.r].lados ? ladoNaTela(m.l, costas) : 1;
        const c = caixaDaRegiao(g, m.r, s);
        // No meio do corpo, de costas, o lado da marca vira (a mesma pessoa vista por trás).
        const mx = REGIOES[m.r].lados ? s * m.x : costas ? -m.x : m.x;
        const x = c.x + mx * c.w * 0.4, y = c.y + m.y * c.h * 0.4;
        return <g key={k} clipPath={`url(#${ide(c.clip)})`}><DesenhoDaMarca m={m} x={x} y={y} u={1.45} w={c.w} h={c.h} pele={pele} detalhe={detalhe} /></g>;
      })}
    </g>
  );
}

/**
 * Os pelos do corpo (1 a 3) e o desenho do músculo (`def`, 0 a 2). Os pelos: traços curtos na direção do crescimento,
 * na cor do cabelo misturada à pele; mais e mais escuros quanto mais pelos. O músculo: a sombra que separa o deltoide
 * do bíceps, a linha do peitoral e, com muita definição, as linhas do abdômen — na pele à mostra.
 */
export function PelosEMusculo({ g, pelos, def, cabelo, pele, sombra, ide, costas, detalhe, semente }: { g: GeoDoCorpo; pelos: number; def: number; cabelo: string; pele: string; sombra: string; ide: (k: string) => string; costas: boolean; detalhe: boolean; semente: string }): ReactElement {
  const r = acaso23(`pelos${semente}`);
  const corPelo = misturar(cabelo, pele, pelos >= 3 ? 0.3 : pelos === 2 ? 0.42 : 0.55);
  const traco = (c: { x: number; y: number; w: number; h: number }, n: number, ang: number, comp: number) =>
    Array.from({ length: n }, () => {
      const x = c.x + (r() - 0.5) * c.w * 0.8, y = c.y + (r() - 0.5) * c.h * 0.85;
      const a = ((ang + (r() - 0.5) * 30) * Math.PI) / 180;
      return `M ${n2(x)} ${n2(y)} l ${n2(Math.cos(a) * comp)} ${n2(Math.sin(a) * comp)}`;
    }).join(' ');
  const regioes: { r: Parameters<typeof caixaDaRegiao>[1]; n: number; ang: number }[] = [];
  if (pelos > 0) {
    const q = pelos * (detalhe ? 6 : 3);
    if (!costas) regioes.push({ r: 'antebraco', n: q, ang: 100 }, { r: 'canela', n: q + 2, ang: 95 }, { r: 'coxa', n: Math.round(q * 0.7), ang: 95 });
    else regioes.push({ r: 'antebraco_externo', n: q, ang: 100 }, { r: 'panturrilha', n: q + 2, ang: 95 });
    if (pelos >= 2 && !costas) regioes.push({ r: 'centro_peito', n: pelos * (detalhe ? 7 : 3), ang: 80 }, { r: 'abdomen', n: pelos * 2, ang: 90 });
  }
  const linha = misturar(sombra, '#000000', 0.12);
  return (
    <g className="figura__pelos-musculo" data-pelos={pelos || undefined} data-definicao={def || undefined}>
      {regioes.map(({ r: reg, n, ang }) => ([-1, 1] as const).filter(s => REGIOES[reg].lados || s === 1).map(s => {
        const c = caixaDaRegiao(g, reg, s);
        const d = reg === 'centro_peito' || reg === 'abdomen' ? { ...c, w: c.w * (reg === 'abdomen' ? 0.25 : 1.6), h: c.h * (reg === 'abdomen' ? 0.8 : 0.7) } : c;
        return <path key={`${reg}${s}`} d={traco(d, n, ang, pelos >= 3 ? 1.1 : 0.8)} clipPath={`url(#${ide(c.clip)})`} stroke={corPelo} strokeWidth={pelos >= 3 ? 0.28 : 0.22} strokeLinecap="round" opacity={0.5 + pelos * 0.1} fill="none" />;
      }))}
      {def > 0 && ([-1, 1] as const).map(s => {
        // O deltoide (a curva do ombro) e o bíceps (a curva do braço), dentro do braço.
        const b = caixaDaRegiao(g, 'biceps', s);
        const x = b.x, w = b.w;
        return <g key={`m${s}`} clipPath={`url(#${ide(`cb${s}`)})`} fill="none" stroke={linha} strokeWidth={0.45} strokeLinecap="round" opacity={0.35 + def * 0.12}>
          <path d={`M ${n2(x - s * w * 0.3)} ${n2(b.y - b.h * 0.35)} q ${n2(s * w * 0.35)} ${n2(b.h * 0.12)} ${n2(s * w * 0.5)} ${n2(-b.h * 0.05)}`} />
          {!costas && <path d={`M ${n2(x - s * w * 0.25)} ${n2(b.y + b.h * 0.3)} q ${n2(s * w * 0.25)} ${n2(-b.h * 0.35)} ${n2(s * w * 0.05)} ${n2(-b.h * 0.6)}`} />}
        </g>;
      })}
      {def > 0 && !costas && <g clipPath={`url(#${ide('ct')})`} fill="none" stroke={linha} strokeWidth={0.5} strokeLinecap="round" opacity={0.3 + def * 0.12}>
        {/* O peitoral: a curva de baixo de cada lado; o abdômen, as linhas (só com muita definição). */}
        {([-1, 1] as const).map(s => <path key={s} d={`M ${n2(g.cx + s * 0.8)} ${n2(g.topo + 21)} q ${n2(s * g.peito * 0.45)} ${n2(3)} ${n2(s * g.peito * 0.82)} ${n2(-3.5)}`} />)}
        {def >= 2 && <>
          <path d={`M ${n2(g.cx)} ${n2(g.topo + 24)} V ${n2(g.yCint + 6)}`} />
          {[0, 1, 2].map(k => <path key={k} d={`M ${n2(g.cx - 4)} ${n2(g.topo + 28 + k * 6)} h 8`} opacity={0.8} />)}
        </>}
      </g>}
    </g>
  );
}

/**
 * O volume do peito por cima da roupa justa (ou na pele): a sombra curta embaixo de cada lado — o peito que a
 * constituição e a condição deram, legível também vestido. Sem volume, nada.
 */
export function VolumeDoPeito({ g, coberto, pele }: { g: GeoDoCorpo & { busto: number }; coberto: boolean; pele: string }): ReactElement | null {
  const v = g.busto;
  if (v < 0.9) return null;
  const y = g.topo + 21 + Math.min(4, v * 0.9), dx = g.peito * 0.46, larg = g.peito * 0.36 + v * 0.4;
  return (
    <g className="figura__peito" data-volume={v.toFixed(1)} fill="none" stroke={coberto ? '#000000' : pele} strokeWidth={0.9} strokeLinecap="round" opacity={coberto ? 0.16 : 0.5}>
      {([-1, 1] as const).map(s => <path key={s} d={`M ${n2(g.cx + s * dx - larg)} ${n2(y - 1.2)} Q ${n2(g.cx + s * dx)} ${n2(y + 1.6 + v * 0.35)} ${n2(g.cx + s * dx + larg)} ${n2(y - 1.2)}`} />)}
    </g>
  );
}
