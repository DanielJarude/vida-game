/**
 * O desenho de cada coisa (REWORK 4): a silhueta do objeto, na COR e no
 * ACABAMENTO que ele tem nesta vida (o violão de madeira escura, a raquete
 * vermelha, o sofá verde). "Interface contida, vida colorida": a cor é do
 * objeto (do motor: `CoisaTida.cor`), não um enfeite da tela.
 */

import { memo, type ReactElement } from 'react';

const escurecer = (hex: string, k = 0.35) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (x: number) => Math.round(x * (1 - k)).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};
const clarear = (hex: string, k = 0.45) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (x: number) => Math.round(x + (255 - x) * k).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

type Forma = (c: string, e: string, l: string) => ReactElement;
const F: Record<string, Forma> = {
  cordas: (c, e, l) => <g><ellipse cx="24" cy="34" rx="10" ry="9" fill={c} stroke={e} /><ellipse cx="24" cy="23" rx="7.5" ry="7" fill={c} stroke={e} /><circle cx="24" cy="29" r="2.6" fill={e} /><rect x="22.6" y="3" width="2.8" height="18" rx="1" fill={e} /><rect x="21.5" y="2" width="5" height="4" rx="1" fill={l} /></g>,
  guitarra: (c, e, l) => <g><path d="M14 40c-4-4-2-11 4-11 1-4 5-6 8-4l2-2 8-18 3 1-7 19c3 3 2 8-2 10-3 7-11 9-16 5z" fill={c} stroke={e} /><circle cx="22" cy="33" r="2" fill={l} /></g>,
  teclado: (c, e, l) => <g><rect x="4" y="18" width="40" height="14" rx="2" fill={c} stroke={e} />{[0, 1, 2, 3, 4, 5, 6, 7].map(k => <rect key={k} x={6 + k * 4.6} y="23" width="4" height="8" fill={l} />)}{[0, 1, 3, 4, 5].map(k => <rect key={`p${k}`} x={9 + k * 4.6} y="23" width="2.2" height="5" fill={e} />)}</g>,
  piano: (c, e, l) => <g><path d="M6 14h30c6 0 8 6 8 10v8H6z" fill={c} stroke={e} /><rect x="6" y="28" width="38" height="5" fill={l} /><rect x="9" y="33" width="3" height="10" fill={e} /><rect x="38" y="33" width="3" height="10" fill={e} /></g>,
  bateria: (c, e, l) => <g><ellipse cx="24" cy="32" rx="12" ry="9" fill={c} stroke={e} /><ellipse cx="24" cy="26" rx="12" ry="3.5" fill={l} stroke={e} /><ellipse cx="9" cy="20" rx="6" ry="2" fill="#d9b44a" stroke={e} /><ellipse cx="39" cy="18" rx="6" ry="2" fill="#d9b44a" stroke={e} /></g>,
  tela: (c, e, l) => <g><rect x="5" y="8" width="38" height="24" rx="2" fill={c} stroke={e} /><rect x="8" y="11" width="32" height="18" fill={l} opacity=".55" /><rect x="20" y="33" width="8" height="5" fill={e} /><rect x="14" y="38" width="20" height="3" rx="1" fill={c} /></g>,
  notebook: (c, e, l) => <g><rect x="9" y="10" width="30" height="20" rx="2" fill={c} stroke={e} /><rect x="12" y="13" width="24" height="14" fill={l} opacity=".6" /><path d="M4 32h40l-3 5H7z" fill={c} stroke={e} /></g>,
  celular: (c, e, l) => <g><rect x="15" y="4" width="18" height="38" rx="4" fill={c} stroke={e} /><rect x="17.5" y="8" width="13" height="27" rx="1.5" fill={l} opacity=".6" /><circle cx="24" cy="38.5" r="1.5" fill={e} /></g>,
  camera: (c, e, l) => <g><rect x="5" y="14" width="38" height="24" rx="3" fill={c} stroke={e} /><rect x="14" y="9" width="12" height="6" rx="1" fill={c} stroke={e} /><circle cx="24" cy="26" r="9" fill={e} /><circle cx="24" cy="26" r="5.5" fill={l} opacity=".7" /></g>,
  controle: (c, e, l) => <g><path d="M8 22c2-6 9-6 12-4h8c3-2 10-2 12 4l3 10c1 5-5 7-8 3l-3-4H16l-3 4c-3 4-9 2-8-3z" fill={c} stroke={e} /><circle cx="33" cy="23" r="1.8" fill={l} /><circle cx="37" cy="26" r="1.8" fill={l} /><rect x="11" y="23" width="7" height="2.2" fill={e} /><rect x="13.4" y="20.6" width="2.2" height="7" fill={e} /></g>,
  som: (c, e, l) => <g><rect x="12" y="6" width="24" height="36" rx="3" fill={c} stroke={e} /><circle cx="24" cy="29" r="7" fill={e} /><circle cx="24" cy="29" r="3" fill={l} /><circle cx="24" cy="14" r="3.5" fill={e} /></g>,
  sofa: (c, e, l) => <g><rect x="4" y="16" width="40" height="14" rx="4" fill={c} stroke={e} /><rect x="2" y="22" width="8" height="14" rx="3" fill={c} stroke={e} /><rect x="38" y="22" width="8" height="14" rx="3" fill={c} stroke={e} /><rect x="9" y="28" width="30" height="8" rx="2" fill={l} stroke={e} /></g>,
  cama: (c, e, l) => <g><rect x="4" y="24" width="40" height="10" rx="2" fill={l} stroke={e} /><rect x="4" y="14" width="6" height="24" rx="1" fill={c} stroke={e} /><rect x="12" y="20" width="10" height="5" rx="2" fill="#f4efe6" stroke={e} /><rect x="6" y="34" width="3" height="6" fill={e} /><rect x="39" y="34" width="3" height="6" fill={e} /></g>,
  eletro: (c, e, l) => <g><rect x="10" y="5" width="28" height="38" rx="3" fill={c} stroke={e} /><circle cx="24" cy="27" r="9" fill={l} stroke={e} /><circle cx="24" cy="27" r="5" fill={e} opacity=".35" /><rect x="14" y="9" width="8" height="3" rx="1" fill={e} /></g>,
  mesa: (c, e) => <g><rect x="4" y="18" width="40" height="5" rx="1" fill={c} stroke={e} /><rect x="7" y="23" width="3" height="18" fill={e} /><rect x="38" y="23" width="3" height="18" fill={e} /><rect x="26" y="23" width="12" height="9" fill={c} stroke={e} /></g>,
  panela: (c, e, l) => <g><path d="M8 20h32v12c0 5-4 8-9 8H17c-5 0-9-3-9-8z" fill={c} stroke={e} /><rect x="6" y="17" width="36" height="4" rx="2" fill={l} stroke={e} /><rect x="1" y="22" width="7" height="3" rx="1.5" fill={e} /><rect x="40" y="22" width="7" height="3" rx="1.5" fill={e} /></g>,
  halter: (c, e) => <g><rect x="12" y="22" width="24" height="4" fill="#9aa0a6" /><rect x="6" y="15" width="7" height="18" rx="2" fill={c} stroke={e} /><rect x="35" y="15" width="7" height="18" rx="2" fill={c} stroke={e} /></g>,
  esteira: (c, e, l) => <g><path d="M4 36l30-6h8v6z" fill={c} stroke={e} /><rect x="32" y="8" width="3" height="24" fill={e} /><rect x="28" y="6" width="12" height="5" rx="1.5" fill={l} stroke={e} /></g>,
  bola: (c, e) => <g><circle cx="24" cy="24" r="15" fill="#f6f3ec" stroke={e} /><path d="M24 15l7 5-3 8h-8l-3-8z" fill={c} /><path d="M9 24l6-2M39 24l-6-2M18 37l2-6M30 37l-2-6M24 9v6" stroke={e} /></g>,
  raquete: (c, e, l) => <g><ellipse cx="20" cy="18" rx="11" ry="13" fill="none" stroke={c} strokeWidth="3.5" /><path d="M12 13h16M11 19h18M13 25h14M17 8v20M23 7v22" stroke={l} strokeWidth=".8" /><rect x="27" y="29" width="4" height="15" rx="1.5" transform="rotate(-35 29 36)" fill={e} /></g>,
  prancha: (c, e, l) => <g><path d="M24 2c8 8 9 30 0 44-9-14-8-36 0-44z" fill={c} stroke={e} /><path d="M24 6v36" stroke={l} strokeWidth="1.4" /></g>,
  barraca: (c, e, l) => <g><path d="M4 40L24 8l20 32z" fill={c} stroke={e} /><path d="M24 8l-6 32h12z" fill={l} opacity=".6" /><path d="M24 22l-3 18h6z" fill={e} /></g>,
  xadrez: (c, e, l) => <g><rect x="6" y="28" width="36" height="12" rx="1" fill={c} stroke={e} />{[0, 1, 2, 3, 4, 5].map(k => <rect key={k} x={6 + k * 6} y="28" width="3" height="12" fill={l} opacity=".35" />)}<path d="M20 26h8l-1-8c3-2 2-7-3-7s-6 5-3 7z" fill="#2a2523" /></g>,
  livros: (c, e, l) => <g>{[0, 1, 2, 3, 4].map(k => <rect key={k} x={6 + k * 7.5} y={10 + (k % 2) * 4} width="6.5" height={30 - (k % 2) * 4} rx="1" fill={k % 2 ? l : c} stroke={e} />)}<rect x="4" y="40" width="40" height="3" fill={e} /></g>,
  arte: (c, e, l) => <g><rect x="6" y="8" width="26" height="32" rx="1" fill="#f4efe6" stroke={e} /><circle cx="15" cy="18" r="4" fill={c} /><path d="M10 34c6-9 12-9 18-4" stroke={c} strokeWidth="3" fill="none" /><rect x="34" y="6" width="4" height="30" rx="2" transform="rotate(12 36 21)" fill={l} stroke={e} /></g>,
  jogos: (c, e, l) => <g><rect x="6" y="16" width="30" height="20" rx="1.5" fill={c} stroke={e} /><rect x="12" y="10" width="30" height="20" rx="1.5" fill={l} stroke={e} /><circle cx="22" cy="20" r="2" fill={e} /><circle cx="30" cy="22" r="2" fill={e} /></g>
};

const FORMA_DA_COISA: Record<string, string> = {
  violao: 'cordas', violino: 'cordas', guitarra: 'guitarra', teclado: 'teclado', piano: 'piano', bateria: 'bateria',
  tv: 'tela', computador: 'tela', notebook: 'notebook', tablet: 'celular', celular_simples: 'celular', celular_bom: 'celular', celular_topo: 'celular',
  camera: 'camera', videogame: 'controle', caixa_som: 'som', sofa: 'sofa', colchao: 'cama', maquina_lavar: 'eletro', lava_loucas: 'eletro',
  aspirador_robo: 'eletro', ar_condicionado: 'eletro', escrivaninha: 'mesa', cozinha_equipada: 'panela', kit_academia: 'halter', esteira: 'esteira',
  chuteira_bola: 'bola', raquete: 'raquete', prancha: 'prancha', camping: 'barraca', tabuleiro: 'xadrez', livros: 'livros', livros_estudo: 'livros',
  material_arte: 'arte', jogos_tabuleiro: 'jogos'
};

export const DesenhoObjeto = memo(function DesenhoObjeto({ coisaId, cor, tamanho = 48, rotulo }: { coisaId: string; cor?: string; tamanho?: number; rotulo?: string }) {
  const c = cor && /^#[0-9a-f]{6}$/i.test(cor) ? cor : '#a49a8c';
  const forma = F[FORMA_DA_COISA[coisaId] ?? 'jogos'];
  return (
    <svg className="objeto" viewBox="0 0 48 48" width={tamanho} height={tamanho} role="img" aria-label={rotulo ?? coisaId} strokeWidth="1.2" strokeLinejoin="round">
      {forma(c, escurecer(c), clarear(c))}
    </svg>
  );
});
