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
 * VIDA 24 — OS PELOS DO CORPO como FIOS: cada pelo é um traço curvo (não um ponto), na direção em que cresce em cada
 * lugar — nos antebraços, para baixo e para fora; nas canelas e coxas, para baixo; no peito, abrindo do meio para os
 * lados; no abdômen, a linha do umbigo para baixo; nas costas (muitos), em leque. A quantidade, o comprimento e a
 * espessura sobem com o nível (1 poucos, 2 médios, 3 muitos), e com muitos uma sombra leve da cor do pelo dá a mancha
 * que se lê de longe. A idade (nada antes dos 11; inteiro aos 19) e os cuidados (`fator`, por região: aparado, raspado,
 * laser) entram aqui. O músculo: a sombra que separa o deltoide do bíceps, a linha do peitoral e, com muita definição, o
 * abdômen — na pele à mostra.
 */
export type RegiaoDePeloNaFigura = 'bracos' | 'pernas' | 'peito' | 'abdomen' | 'costas';
export function PelosEMusculo({ g, pelos, def, cabelo, pele, sombra, ide, costas, detalhe, semente, idadeK = 1, fator }: { g: GeoDoCorpo; pelos: number; def: number; cabelo: string; pele: string; sombra: string; ide: (k: string) => string; costas: boolean; detalhe: boolean; semente: string; idadeK?: number; fator?: (r: RegiaoDePeloNaFigura) => number }): ReactElement {
  const r = acaso23(`pelos${semente}`);
  const nivel = Math.max(0, Math.min(3, pelos));
  // O fio na cor do cabelo natural, puxada para a pele só um pouco (o pelo escuro se vê; o claro, menos).
  const corPelo = misturar(cabelo, pele, nivel >= 3 ? 0.12 : nivel === 2 ? 0.18 : 0.22);
  const comp = (nivel >= 3 ? 2.6 : nivel === 2 ? 2.1 : 1.6) * (0.6 + 0.4 * idadeK);
  const larg = nivel >= 3 ? 0.42 : nivel === 2 ? 0.37 : 0.34;
  /** Fios numa caixa: uma grade com sorteio (cobre a região sem amontoar), cada um com a sua curva. */
  const fios = (c: { x: number; y: number; w: number; h: number }, n: number, ang: (x: number, y: number) => number, L: number) => {
    const col = Math.max(1, Math.round(Math.sqrt(n * c.w / Math.max(1, c.h)))), lin = Math.max(1, Math.ceil(n / col));
    const out: string[] = [];
    for (let a = 0; a < lin; a++) for (let b = 0; b < col && out.length < n; b++) {
      const u = (b + 0.2 + r() * 0.6) / col - 0.5, v = (a + 0.2 + r() * 0.6) / lin - 0.5;
      const x = c.x + u * c.w * 0.9, y = c.y + v * c.h * 0.92;
      const t = ((ang(u, v) + (r() - 0.5) * 24) * Math.PI) / 180, l = L * (0.75 + r() * 0.5);
      const ex = Math.cos(t) * l, ey = Math.sin(t) * l, curva = (r() - 0.5) * l * 0.5;
      out.push(`M ${n2(x)} ${n2(y)} q ${n2(ex / 2 - ey / l * curva)} ${n2(ey / 2 + ex / l * curva)} ${n2(ex)} ${n2(ey)}`);
    }
    return out.join(' ');
  };
  type Faixa = { reg: Parameters<typeof caixaDaRegiao>[1]; tipo: RegiaoDePeloNaFigura; n: number; ang: (u: number, v: number, s: number) => number; L?: number; ajuste?: (c: { x: number; y: number; w: number; h: number }) => { x: number; y: number; w: number; h: number }; mancha?: boolean };
  const faixas: Faixa[] = [];
  // Poucos é pouco, mas se vê (o nível 1 vale 1,5: alguns fios nos antebraços e nas canelas).
  const q = idadeK <= 0 ? 0 : (nivel === 1 ? 1.5 : nivel) * idadeK;
  if (q > 0) {
    const k = detalhe ? 1 : 0.6;
    const n = (x: number) => Math.round(x * q * k);
    if (!costas) {
      faixas.push({ reg: 'antebraco', tipo: 'bracos', n: n(7), ang: (_u, _v, s) => 90 - s * 18, mancha: true });
      if (nivel >= 2) faixas.push({ reg: 'biceps', tipo: 'bracos', n: n(2.2), ang: (_u, _v, s) => 90 - s * 10, L: comp * 0.8 });
      faixas.push({ reg: 'canela', tipo: 'pernas', n: n(9), ang: () => 92, mancha: true });
      faixas.push({ reg: 'coxa', tipo: 'pernas', n: n(nivel >= 2 ? 5 : 2.5), ang: () => 95, L: comp * 0.85, ajuste: c => ({ ...c, h: c.h * 0.8, y: c.y + c.h * 0.08 }) });
      if (nivel >= 2) {
        // O peito: do esterno para os lados e para cima (e a mancha no meio, com muitos).
        faixas.push({ reg: 'centro_peito', tipo: 'peito', n: n(nivel >= 3 ? 9 : 5), ang: (u, v) => (u < 0 ? 200 : -20) + v * 40, ajuste: c => ({ ...c, w: g.peito * (nivel >= 3 ? 1.25 : 0.85), h: c.h * 0.62, y: c.y - c.h * 0.08 }), mancha: nivel >= 3 });
        // A linha do umbigo para baixo.
        faixas.push({ reg: 'abdomen', tipo: 'abdomen', n: n(nivel >= 3 ? 4 : 2.4), ang: () => 90, L: comp * 0.9, ajuste: c => ({ ...c, w: nivel >= 3 ? 5.5 : 3.2, h: c.h * 0.85 }) });
      }
    } else {
      faixas.push({ reg: 'antebraco_externo', tipo: 'bracos', n: n(7), ang: (_u, _v, s) => 90 + s * 18, mancha: true });
      faixas.push({ reg: 'panturrilha', tipo: 'pernas', n: n(9), ang: () => 92, mancha: true });
      faixas.push({ reg: 'coxa', tipo: 'pernas', n: n(nivel >= 2 ? 4 : 2), ang: () => 95, L: comp * 0.85 });
      if (nivel >= 3) faixas.push({ reg: 'costas_alta', tipo: 'costas', n: n(4), ang: (u) => (u < 0 ? 230 : -50), L: comp * 0.8, ajuste: c => ({ ...c, w: c.w * 0.6, h: c.h * 0.7 }) });
    }
  }
  const linha = misturar(sombra, '#000000', 0.12);
  return (
    <g className="figura__pelos-musculo" data-pelos={pelos || undefined} data-definicao={def || undefined}>
      {faixas.map(f => ([-1, 1] as const).filter(s => REGIOES[f.reg].lados || s === 1).map(s => {
        const fz = fator ? fator(f.tipo) : 1;
        // O laser terminado (quase nada volta) e o raspado: nenhum fio à vista; aparado: menos e bem curtos.
        if (fz < 0.15 || f.n <= 0) return null;
        const c0 = caixaDaRegiao(g, f.reg, s);
        const c = f.ajuste ? f.ajuste(c0) : c0;
        const nn = Math.max(1, Math.round(f.n * (fz < 1 ? 0.75 : 1)));
        const L = (f.L ?? comp) * (fz < 1 ? Math.max(0.4, fz) : 1);
        return <g key={`${f.reg}${s}`} clipPath={`url(#${ide(c0.clip)})`} data-regiao-pelo={f.tipo}>
          {f.mancha && nivel >= 3 && fz >= 0.9 && <ellipse cx={c.x} cy={c.y} rx={c.w * 0.4} ry={c.h * 0.42} fill={corPelo} opacity={0.1 * idadeK} />}
          <path d={fios(c, nn, (u, v) => f.ang(u, v, s), L)} stroke={corPelo} strokeWidth={larg * (fz < 1 ? 0.85 : 1)} strokeLinecap="round" opacity={0.8} fill="none" />
        </g>;
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
        {def >= 1.4 && <>
          <path d={`M ${n2(g.cx)} ${n2(g.topo + 24)} V ${n2(g.yCint + 6)}`} />
          {[0, 1, 2].map(k => <path key={k} d={`M ${n2(g.cx - 4)} ${n2(g.topo + 28 + k * 6)} h 8`} opacity={0.8} />)}
        </>}
      </g>}
      {def <= 0 && !costas && g.barriga >= 3 && <g clipPath={`url(#${ide('ct')})`} fill="none" stroke={linha} strokeLinecap="round">
        {/* VIDA 24: a barriga de frente — o arco suave abaixo do umbigo (o volume, sem ponta). */}
        <path d={`M ${n2(g.cx - (g.cintura + g.barriga * 0.5) * 0.62)} ${n2(g.yCint + 7)} Q ${n2(g.cx)} ${n2(g.yCint + 7 + Math.min(4, g.barriga * 0.45))} ${n2(g.cx + (g.cintura + g.barriga * 0.5) * 0.62)} ${n2(g.yCint + 7)}`} strokeWidth={0.55} opacity={0.32} />
        <circle cx={g.cx} cy={g.yCint - 1} r={0.55} fill={linha} stroke="none" opacity={0.45} />
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
