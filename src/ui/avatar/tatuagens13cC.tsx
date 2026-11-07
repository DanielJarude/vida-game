/**
 * VIDA 13 (correção final) — A ARTE DOS PERSONAGENS, lote C (`motor/dados/tatuagens13cC`): a literatura e o folclore
 * brasileiros. O Sítio segue os livros de Lobato e as ilustrações antigas (nunca o visual da TV). Caixa nativa (o lado
 * maior mede 20), contorno em `tinta`, cor por `cor`, como `tatuagens13Pop`.
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA1, CINZA2, CINZA3, CREME, espiral, f, LARANJA, MARROM, ondas, OURO,
  ROSA, ROXO, TERRA, TURQUESA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';

const PELE = '#eab58c', MORENA = '#c48955', BRONZE = '#a06a3c', ESCURA = '#7b4b2e', PORCO = '#eba0a4', BOTO = '#e98aa8', CABELO = '#2e2622', LUA = '#f3e3a0';

export function desenho13cC(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor, W, H } = p;
  const { s, L, C, letra } = atalhos(p);
  /** Um olho aberto (branco e pupila). */
  const olho = (x: number, y: number, r = 0.7, dx = 0, dy = 0) => <g>
    <ellipse cx={x} cy={y} rx={r} ry={r * 1.12} fill={cor(BRANCO)} {...C(0.3)} />
    <circle cx={f(x + dx)} cy={f(y + dy)} r={f(r * 0.5)} fill={tinta} />
    <circle cx={f(x + dx - r * 0.18)} cy={f(y + dy - r * 0.2)} r={f(r * 0.15)} fill={cor(BRANCO)} />
  </g>;
  /** Labareda: uma língua de fogo de (x, y) para cima, altura h. */
  const chama = (x: number, y: number, h: number, w: number, giro = 0) =>
    `M${f(x - w)} ${f(y)} Q${f(x - w * 1.1 + giro * 0.3)} ${f(y - h * 0.55)} ${f(x + giro)} ${f(y - h)} Q${f(x + w * 0.3 + giro * 0.4)} ${f(y - h * 0.5)} ${f(x + w)} ${f(y)} Z`;
  switch (id) {
    /* ================================================================ Sítio do Picapau Amarelo */
    case 'emilia_de_pano': { const c = W / 2; return <g>
      {/* pernas de pano e sapatinhos */}
      {[c - 1.6, c + 1.6].map((x, k) => <g key={k}>
        <path d={`M${x - 0.7} 15.2 L${x - 0.6} 18.4 L${x + 0.6} 18.4 L${x + 0.7} 15.2 Z`} fill={cor(CREME)} {...C(0.4)} />
        <path d={`M${x - 0.65} 16.3 H${x + 0.65} M${x - 0.62} 17.3 H${x + 0.62}`} stroke={cor(VERMELHO)} strokeWidth={s(0.4)} />
        <path d={`M${x - 0.9 + (k ? 0.2 : -0.6)} 19.4 Q${x - 1 + (k ? 0.2 : -0.6)} 18.2 ${x} 18.2 Q${x + 1.1 + (k ? 0.6 : -0.2)} 18.4 ${x + 1 + (k ? 0.6 : -0.2)} 19.4 Z`} fill={tinta} />
      </g>)}
      {/* braços de pano com as mãos na cintura */}
      {[1, -1].map(d => <g key={d}>
        <path d={`M${c - d * 2.2} 9.4 Q${c - d * 5.6} 10.4 ${c - d * 6.2} 12.2 Q${c - d * 5} 13.6 ${c - d * 2.8} 13.2 L${c - d * 3} 12.2 Q${c - d * 4.6} 12.4 ${c - d * 4.8} 11.8 Q${c - d * 4} 11 ${c - d * 2.4} 10.8 Z`} fill={cor(CREME)} {...C(0.45)} />
        <path d={`M${c - d * 5.5} 10.9 l${-d * 0.7} 0.5`} {...L(0.25)} strokeDasharray="0.25 0.3" />
      </g>)}
      {/* o vestido remendado, de bolinhas */}
      <path d={`M${c - 2.2} 9 Q${c} 8.4 ${c + 2.2} 9 L${c + 2.8} 12.6 L${c + 5} 15.6 Q${c} 16.6 ${c - 5} 15.6 L${c - 2.8} 12.6 Z`} fill={cor(AMARELO)} {...C(0.55)} />
      {[[c - 3, 14.6], [c - 1, 15.4], [c + 2.6, 14.4], [c + 0.6, 13.4], [c - 1.4, 12.2], [c + 1, 10.4], [c - 0.9, 9.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.32} fill={cor(VERMELHO)} />)}
      <rect x={c + 0.8} y={11.6} width={1.9} height={1.7} transform={`rotate(-12 ${c + 1.7} 12.4)`} fill={cor(AZUL)} {...C(0.3)} />
      <rect x={c + 1.05} y={11.85} width={1.4} height={1.2} transform={`rotate(-12 ${c + 1.7} 12.4)`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.2)} strokeDasharray="0.25 0.25" />
      <path d={`M${c - 2.8} 12.6 Q${c} 13.4 ${c + 2.8} 12.6`} {...L(0.3)} />
      {/* o cabelo de linha: os cachos em volta da cabeça */}
      {Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (0.92 + k * 0.116); return <circle key={k} cx={f(c + Math.cos(a) * 3.5)} cy={f(5 + Math.sin(a) * 3.3)} r={1.15} fill={cor(CABELO)} {...C(0.35)} />; })}
      <path d={`M${c - 3.6} 5.6 Q${c - 4.6} 8 ${c - 3.8} 9.2 M${c + 3.6} 5.6 Q${c + 4.6} 8 ${c + 3.8} 9.2`} stroke={cor(CABELO)} strokeWidth={s(1)} fill="none" strokeLinecap="round" />
      {/* a cara de pano, a costura em volta */}
      <circle cx={c} cy={5.4} r={3.2} fill={cor(CREME)} {...C(0.55)} />
      <circle cx={c} cy={5.4} r={2.75} fill="none" stroke={tinta} strokeWidth={s(0.22)} strokeDasharray="0.35 0.35" opacity={0.6} />
      {Array.from({ length: 5 }, (_, k) => <circle key={k} cx={f(c - 2.2 + k * 1.1)} cy={f(2.6 + Math.abs(k - 2) * 0.35)} r={0.85} fill={cor(CABELO)} {...C(0.3)} />)}
      {/* os olhos de retrós (botões de linha preta, com a cruz da costura) */}
      {[-1.15, 1.15].map((dx, k) => <g key={k}>
        <circle cx={c + dx} cy={5.3} r={0.66} fill={tinta} />
        <circle cx={c + dx} cy={5.3} r={0.42} fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.12)} />
        <circle cx={c + dx - 0.22} cy={5.08} r={0.17} fill={cor(BRANCO)} />
      </g>)}
      <circle cx={c - 2} cy={6.5} r={0.55} fill={cor(ROSA)} opacity={0.7} /><circle cx={c + 2} cy={6.5} r={0.55} fill={cor(ROSA)} opacity={0.7} />
      {/* a boca aberta, que não para de falar */}
      <path d={`M${c - 0.9} 6.9 Q${c} 8.1 ${c + 0.9} 6.9 Z`} fill={cor(VERMELHO)} {...C(0.3)} />
      {/* o laço no cabelo */}
      <path d={`M${c + 2.4} 2.2 l-1.4 -1 l0.1 2 Z M${c + 2.4} 2.2 l1.5 -0.7 l-0.4 1.9 Z`} fill={cor(VERMELHO)} {...C(0.3)} />
    </g>; }
    case 'visconde_de_sabugosa': { const c = W / 2; return <g>
      {/* pernas de palito */}
      <path d={`M${c - 1.2} 16 L${c - 1.6} 19.2 M${c + 1.2} 16 L${c + 1.6} 19.2`} {...L(0.55)} />
      <path d={`M${c - 2.8} 19.3 H${c - 1.2} M${c + 1.2} 19.3 H${c + 2.8}`} {...L(0.7)} />
      {/* o sabugo de milho, com os grãos */}
      <path d={`M${c - 2.6} 5 Q${c - 3.1} 11 ${c - 2} 15.6 Q${c} 17 ${c + 2} 15.6 Q${c + 3.1} 11 ${c + 2.6} 5 Z`} fill={cor(OURO)} {...C(0.6)} />
      {[9.6, 10.8, 12, 13.2, 14.4].map((y, k) => <path key={k} d={`M${c - 2.75} ${y} Q${c} ${y + 0.5} ${c + 2.75} ${y}`} {...L(0.22)} opacity={0.75} />)}
      {[-1.4, 0, 1.4].map((dx, k) => <path key={k} d={`M${c + dx} 9.2 Q${c + dx * 1.1} 12.6 ${c + dx * 0.8} 15.8`} {...L(0.22)} opacity={0.75} />)}
      {/* a palha do sabugo, como um fraque */}
      <path d={`M${c - 2.3} 11.4 Q${c - 4.6} 14 ${c - 3.6} 17.4 Q${c - 2.2} 15.4 ${c - 1} 16.4 Q${c - 1.6} 13.6 ${c - 2.3} 11.4 Z`} fill={cor(AREIA)} {...C(0.4)} />
      <path d={`M${c + 2.3} 11.4 Q${c + 4.6} 14 ${c + 3.6} 17.4 Q${c + 2.2} 15.4 ${c + 1} 16.4 Q${c + 1.6} 13.6 ${c + 2.3} 11.4 Z`} fill={cor(AREIA)} {...C(0.4)} />
      {/* a cara de sábio: os óculos redondos, o nariz, o bigodinho de cabelo de milho */}
      {[-1.15, 1.15].map((dx, k) => <g key={k}><circle cx={c + dx} cy={7.2} r={0.95} fill={cor(BRANCO)} {...C(0.4)} /><circle cx={c + dx + 0.1} cy={7.3} r={0.36} fill={tinta} /></g>)}
      <path d={`M${c - 0.2} 7.1 h0.4 M${c - 2.1} 7 l-0.6 -0.3 M${c + 2.1} 7 l0.6 -0.3`} {...L(0.3)} />
      <path d={`M${c} 8 l0.35 0.8 h-0.5`} {...L(0.28)} />
      <path d={`M${c - 1.3} 9.3 Q${c} 8.7 ${c + 1.3} 9.3`} stroke={cor(TERRA)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
      {/* a cartola */}
      <rect x={c - 1.9} y={0.8} width={3.8} height={3.8} rx={0.3} fill={tinta} />
      <rect x={c - 1.9} y={3.4} width={3.8} height={0.7} fill={cor(VERMELHO)} />
      <ellipse cx={c} cy={4.7} rx={3.3} ry={0.65} fill={tinta} />
      {/* um braço erguido, o dedo de quem explica; o outro segura o livro grosso */}
      <path d={`M${c - 2.6} 10 Q${c - 4.4} 9.4 ${c - 4.6} 6.6`} {...L(0.45)} /><path d={`M${c - 4.6} 6.6 l-0.1 -1.2 M${c - 4.6} 6.6 l0.6 -0.6`} {...L(0.35)} />
      <g transform={`rotate(-14 ${c + 3.8} 11.4)`}>
        <rect x={c + 2.4} y={9.4} width={3} height={4.2} rx={0.3} fill={cor(VERMELHO)} {...C(0.45)} />
        <path d={`M${c + 2.9} 9.4 V13.6`} {...L(0.25)} /><rect x={c + 3.3} y={10.6} width={1.6} height={0.8} fill={cor(OURO)} />
      </g>
      <path d={`M${c + 2.6} 10.6 Q${c + 3.4} 11.6 ${c + 3} 12.8`} {...L(0.4)} />
    </g>; }
    case 'narizinho_arrebitado': return <g>
      {/* o vestido e a gola */}
      <path d="M4.4 20 Q4.4 15.6 8.6 15.2 L11.6 15.2 Q15.4 15.6 15.6 20 Z" fill={cor(VERMELHO)} {...C(0.55)} />
      <path d="M8.2 15.2 Q9.6 17.4 10.2 15.4 Q11 17.2 12.2 15.2" fill={cor(BRANCO)} {...C(0.35)} />
      {/* o pescoço */}
      <path d="M9.2 12.6 L9 15.4 L11.4 15.4 L11.2 13" fill={cor(PELE)} {...C(0.45)} />
      {/* o cabelo, de franja curta, atrás */}
      <path d="M12.4 4.4 Q10 1.6 6.4 2.6 Q2.6 3.8 2.8 8.4 Q3 12.4 5.2 14 Q7 13 8.8 12.6 Q10.6 10 10.4 7 Z" fill={cor(MARROM)} {...C(0.55)} />
      {/* o rosto de perfil: testa, o nariz arrebitado, a boca e o queixo */}
      <path d="M12.4 4.4 Q13.4 5.6 13.2 7.6 Q13.4 8.4 14.4 9 Q15.4 8.6 15.6 9.1 Q15.2 10.2 13.9 10.4 Q13.8 10.9 14 11.3 Q13.6 11.6 13.9 12 Q13.6 13.4 12.4 13.8 Q10.8 14 9.4 13 Q8.6 11.6 8.4 9.8 Q8.6 6.4 10.4 5.6 Q11.6 5 12.4 4.4 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M14.2 9.2 Q14.9 9.1 15.3 8.9" {...L(0.25)} />
      {/* a franja por cima da testa */}
      <path d="M8 3.4 Q11.4 2.4 13 4.6 Q11.6 4.6 10.8 5.6 Q10.2 4.8 9.2 5.6 Q8.8 4.6 7.8 5.4 Z" fill={cor(MARROM)} {...C(0.4)} />
      {/* o olho, a sobrancelha, a bochecha, a orelha */}
      <path d="M11.5 8.1 Q12.3 7.3 13 8 Q12.3 8.9 11.5 8.1 Z" fill={cor(BRANCO)} {...C(0.25)} />
      <circle cx={12.55} cy={8.05} r={0.36} fill={tinta} />
      <path d="M11.4 6.8 Q12.3 6.3 13 6.8 M12.9 7.9 l0.5 -0.5 M12.7 7.7 l0.3 -0.6" {...L(0.25)} />
      <circle cx={11.8} cy={10.4} r={0.8} fill={cor(ROSA)} opacity={0.6} />
      <path d="M13.9 11.3 Q13.4 11.5 13.9 12" stroke={cor(VERMELHO)} strokeWidth={s(0.4)} fill="none" />
      <path d="M9.6 8.4 Q8.6 8.6 8.8 9.8 Q9 10.8 9.8 10.4" fill={cor(PELE)} {...C(0.35)} />
      {/* o laço grande no alto */}
      <path d="M7.6 2.8 L5 1 L5.2 4.4 Z M7.6 2.8 L10 1.2 L9.8 4.4 Z" fill={cor(VERMELHO)} {...C(0.4)} /><circle cx={7.6} cy={2.8} r={0.55} fill={cor(VERMELHO)} {...C(0.35)} />
      {/* o Príncipe Escamado, peixinho de coroa, diante do nariz */}
      <g transform="rotate(-18 15.6 4.6)">
        <path d="M13.6 4.6 Q15.4 2.6 17.4 4.6 Q15.4 6.6 13.6 4.6 Z" fill={cor(CELESTE)} {...C(0.4)} />
        <path d="M17.2 4.6 L18.6 3.4 L18.6 5.8 Z" fill={cor(CELESTE)} {...C(0.35)} />
        <path d="M15.4 3.8 Q15.9 4.6 15.4 5.4 M16.2 3.9 Q16.6 4.6 16.2 5.3" {...L(0.2)} />
        <circle cx={14.4} cy={4.4} r={0.25} fill={tinta} />
        <path d="M14.2 3.4 L14.4 2.4 L14.9 3 L15.3 2.3 L15.6 3.2 Z" fill={cor(OURO)} {...C(0.25)} />
      </g>
      <circle cx={14.4} cy={7.4} r={0.25} {...L(0.2)} /><circle cx={13.6} cy={6.6} r={0.18} {...L(0.18)} />
    </g>;
    case 'pedrinho_do_bodoque': return <g>
      {/* a camisa e o suspensório */}
      <path d="M1.4 20 Q1.6 14.6 5.4 13.8 L10.2 13.8 Q14 14.6 14.2 20 Z" fill={cor(CREME)} {...C(0.55)} />
      <path d="M5.2 14 L4.6 20 M10.4 14 L11 20" stroke={cor(AZUL)} strokeWidth={s(0.8)} />
      <path d="M6.6 13.8 L7.8 15.4 L9 13.8" {...L(0.35)} />
      <path d="M6.8 12 L6.6 14 L9 14 L8.8 12" fill={cor(PELE)} {...C(0.4)} />
      {/* a cabeça, uma orelha de cada lado */}
      <circle cx={4.6} cy={8.6} r={0.8} fill={cor(PELE)} {...C(0.4)} /><circle cx={11} cy={8.6} r={0.8} fill={cor(PELE)} {...C(0.4)} />
      <ellipse cx={7.8} cy={8.4} rx={3.3} ry={3.6} fill={cor(PELE)} {...C(0.55)} />
      <path d="M4.6 7.4 Q5 5.6 7.8 5.4 Q10.6 5.6 11 7.4 Q9.6 6.4 8.2 6.6 Q6.6 6.2 4.6 7.4 Z" fill={cor(MARROM)} {...C(0.3)} />
      {/* de olho no alvo: um olho fechado, o outro mirando */}
      <path d="M5.6 8.3 Q6.3 8.7 7 8.3" {...L(0.35)} /><path d="M5.5 7.4 l1.4 0.4" {...L(0.3)} />
      {olho(9.2, 8.2, 0.6, 0.15, 0)}<path d="M8.6 7.3 l1.3 -0.3" {...L(0.3)} />
      <path d="M7.8 9 l-0.3 1 h0.6" {...L(0.28)} />
      <path d="M7 11 Q7.8 11.4 8.6 10.8" {...L(0.32)} /><path d="M8.2 11.1 q0.3 0.5 0.6 0" fill={cor(VERMELHO)} {...C(0.2)} />
      {[[5.8, 9.8], [9.8, 9.8], [6.2, 10.2], [9.4, 10.3]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.14} fill={tinta} opacity={0.6} />)}
      {/* o chapéu de palha, a aba desfiada */}
      <path d="M5.2 5.2 Q5.4 1.6 7.8 1.6 Q10.2 1.6 10.4 5.2 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M5.3 4.4 H10.3" stroke={cor(VERMELHO)} strokeWidth={s(0.6)} />
      <ellipse cx={7.8} cy={5.3} rx={5.2} ry={1.1} fill={cor(AREIA)} {...C(0.5)} />
      {[3, 4, 11.4, 12.4].map((x, k) => <path key={k} d={`M${x} ${5.9 + (k % 2) * 0.1} l${k < 2 ? -0.3 : 0.3} 0.6`} {...L(0.25)} />)}
      <path d="M4.2 5.4 Q7.8 4.8 11.4 5.4" {...L(0.2)} opacity={0.6} />
      {/* o braço esticado segurando a forquilha */}
      <path d="M12.6 15 Q14.6 12.4 14.8 9.6" stroke={tinta} strokeWidth={s(1.7)} strokeLinecap="round" fill="none" />
      <path d="M12.6 15 Q14.6 12.4 14.8 9.6" stroke={cor(CREME)} strokeWidth={s(1.05)} strokeLinecap="round" fill="none" />
      <path d="M14.8 9.4 L14.8 6.4 M14.8 6.4 L13.6 3.8 M14.8 6.4 L15.8 3.8" stroke={tinta} strokeWidth={s(1.05)} strokeLinecap="round" />
      <path d="M14.8 9.4 L14.8 6.4 M14.8 6.4 L13.6 3.8 M14.8 6.4 L15.8 3.8" stroke={cor(MARROM)} strokeWidth={s(0.55)} strokeLinecap="round" />
      <circle cx={14.8} cy={8.8} r={0.95} fill={cor(PELE)} {...C(0.4)} />
      {/* o elástico puxado até a bochecha, com a pedrinha */}
      <path d="M13.6 3.8 L11.4 9.6 L15.8 3.8" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.4)} />
      <path d="M13.6 3.8 L11.4 9.6 L15.8 3.8" fill="none" stroke={tinta} strokeWidth={s(0.12)} />
      <path d="M4 15.2 Q8 13.6 10.8 10.8" stroke={tinta} strokeWidth={s(1.7)} strokeLinecap="round" fill="none" />
      <path d="M4 15.2 Q8 13.6 10.8 10.8" stroke={cor(CREME)} strokeWidth={s(1.05)} strokeLinecap="round" fill="none" />
      <circle cx={11.2} cy={10.2} r={0.95} fill={cor(PELE)} {...C(0.4)} />
      <circle cx={11.6} cy={9.3} r={0.42} fill={cor(CINZA2)} {...C(0.25)} />
    </g>;
    case 'marques_de_rabico': return <g>
      <path d={`M1 ${H - 0.8} H19`} {...L(0.35)} opacity={0.5} />
      {/* o rabo enrolado */}
      <path d={espiral(17.8, 8.2, 1.5, 1.6, 3)} {...L(0.45)} />
      {/* as patas */}
      {[6.6, 8.6, 13.6, 15.6].map((x, k) => <g key={k}>
        <path d={`M${x - 0.7} 12 L${x - 0.6} ${H - 1.6} L${x + 0.6} ${H - 1.6} L${x + 0.7} 12 Z`} fill={cor(PORCO)} {...C(0.45)} />
        <path d={`M${x - 0.6} ${H - 1.6} h1.2 v0.6 h-1.2 Z`} fill={tinta} />
      </g>)}
      {/* o corpo redondo de porco guloso */}
      <ellipse cx={11.6} cy={9.4} rx={6.6} ry={4.2} fill={cor(PORCO)} {...C(0.6)} />
      <path d="M8.4 12.6 Q12 14 15.6 12.6" {...L(0.25)} opacity={0.5} />
      <path d="M12 6.2 Q14.6 5.6 16.6 7" stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" opacity={0.6} />
      {/* a cabeça, a orelha caída, o focinho */}
      <circle cx={5.6} cy={8.4} r={3.4} fill={cor(PORCO)} {...C(0.6)} />
      <path d="M6.4 5.2 L8.6 3.6 L8.2 6.6 Z" fill={cor(PORCO)} {...C(0.45)} />
      <ellipse cx={2.4} cy={9.2} rx={1.15} ry={1.4} fill={cor(ROSA)} {...C(0.5)} />
      <ellipse cx={2.1} cy={8.7} rx={0.22} ry={0.35} fill={tinta} /><ellipse cx={2.2} cy={9.7} rx={0.22} ry={0.35} fill={tinta} />
      {/* o olho guloso, meio fechado */}
      <path d="M4.4 6.8 Q5 6.3 5.6 6.8 Q5 7.4 4.4 6.8 Z" fill={tinta} /><path d="M4.2 6.2 Q5 5.6 5.8 6.1" {...L(0.3)} />
      <circle cx={5.4} cy={9.6} r={0.7} fill={cor(ROSA)} opacity={0.6} />
      {/* a espiga roubada na boca */}
      <g transform="rotate(14 3.6 11.4)">
        <ellipse cx={3.4} cy={11.4} rx={2.4} ry={0.8} fill={cor(AMARELO)} {...C(0.4)} />
        <path d="M2 11 V11.8 M3 10.7 V12.1 M4 10.7 V12.1 M5 11 V11.8" {...L(0.18)} />
        <path d="M5.4 11.4 Q6.8 10.4 7.6 11.2 Q6.8 12.4 5.4 11.4 Z" fill={cor(VERDE_CLARO)} {...C(0.3)} />
      </g>
      {/* a coroinha torta de marquês */}
      <g transform="rotate(-16 6 4.4)">
        <path d="M4 5.4 L3.8 3.2 L4.9 4.2 L6 2.6 L7.1 4.2 L8.2 3.2 L8 5.4 Z" fill={cor(OURO)} {...C(0.4)} />
        <circle cx={6} cy={2.5} r={0.35} fill={cor(VERMELHO)} {...C(0.2)} />
        <path d="M4.1 4.8 H7.9" stroke={cor(VERMELHO)} strokeWidth={s(0.3)} />
      </g>
    </g>;
    case 'quindim_rinoceronte': return <g>
      <path d={`M0.8 ${H - 0.6} H19.4`} {...L(0.35)} opacity={0.5} />
      {/* o livro de gramática aberto no chão */}
      <path d={`M0.8 ${H - 1} L1.4 ${H - 2.8} Q2.6 ${H - 3.2} 3.6 ${H - 2.6} Q4.6 ${H - 3.2} 5.8 ${H - 2.8} L6.4 ${H - 1} Q5 ${H - 1.6} 3.6 ${H - 0.9} Q2.2 ${H - 1.6} 0.8 ${H - 1} Z`} fill={cor(BRANCO)} {...C(0.4)} />
      <path d={`M3.6 ${H - 2.6} V${H - 0.9}`} {...L(0.3)} />
      <path d={`M1.6 ${H - 2.2} Q2.6 ${H - 2.5} 3.2 ${H - 2.1} M4 ${H - 2.1} Q4.8 ${H - 2.5} 5.6 ${H - 2.2} M1.5 ${H - 1.7} Q2.5 ${H - 2} 3.2 ${H - 1.6} M4 ${H - 1.6} Q4.9 ${H - 2} 5.7 ${H - 1.7}`} {...L(0.15)} />
      {/* as pernas grossas */}
      {[8.2, 10.6, 14.4, 16.6].map((x, k) => <path key={k} d={`M${x - 1} 9 L${x - 1} ${H - 1.4} Q${x} ${H - 1} ${x + 1} ${H - 1.4} L${x + 1} 9 Z`} fill={cor(CINZA2)} {...C(0.5)} />)}
      {[8.2, 10.6, 14.4, 16.6].map((x, k) => <path key={`u${k}`} d={`M${x - 0.5} ${H - 1.4} v0.4 M${x + 0.5} ${H - 1.4} v0.4`} {...L(0.2)} />)}
      {/* o corpo de couraça, com as dobras */}
      <path d="M6.6 4 Q12 1.6 17.6 3.6 Q19.8 5.6 19.2 8.6 Q18.4 11.6 15 11.4 L9 11.4 Q6.4 11 6 8.4 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M10 3 Q9.2 7 10.4 11.2 M15.6 3 Q16.6 7 15.6 11.4" {...L(0.3)} />
      <path d="M10.6 4.4 Q13 3.6 15 4.2" stroke={cor(CINZA3)} strokeWidth={s(0.5)} fill="none" />
      <path d="M19 5.4 Q20 6.4 19.6 8" {...L(0.3)} />
      {/* a cabeça grande, os dois chifres */}
      <path d="M7.4 4.2 Q5 3.8 3.4 5.4 Q2 6.6 1 8.4 Q1.2 9.8 3 10.2 Q5.6 10.6 7.4 9.6 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M1.4 7.6 Q0.6 5 1.4 2.4 Q2.6 5 3.2 6.6 Z" fill={cor(CREME)} {...C(0.45)} />
      <path d="M3.8 5.4 Q3.6 4 4.2 3.2 Q4.8 4.2 5 5 Z" fill={cor(CREME)} {...C(0.4)} />
      <path d="M6.6 4.2 L6.8 2.4 L7.6 3.8 Z" fill={cor(CINZA2)} {...C(0.4)} />
      {/* o olho manso, a boca de quem sorri */}
      <circle cx={5.4} cy={6.6} r={0.38} fill={tinta} /><path d="M4.8 6 Q5.4 5.7 6 6" {...L(0.22)} />
      <path d="M1.6 9.2 Q2.6 9.6 3.6 9.2" {...L(0.3)} />
      <path d="M2.2 8.1 l0.3 0.2" {...L(0.3)} />
    </g>;
    case 'cuca_cara_de_jacare': return <g>
      {/* a cabeleira desgrenhada atrás */}
      <path d="M9 3.4 Q10.6 0.4 13 1.4 L14.2 0.4 L14.6 1.8 L16.8 1.6 L16 3.4 L17 5.4 L16.2 6.4 L16.9 8.6 L15.8 9.4 L16.4 12 L15 11.6 L15 13.6 L13.4 12.2 Q12 11.6 11 10.6 Z" fill={cor(AREIA)} {...C(0.55)} />
      <path d="M12 2.4 Q14.6 4 15 7 M13.4 6 Q15.4 8.6 14.8 11.6 M11.4 5 Q13 7.6 12.6 10" {...L(0.25)} />
      {/* o xale com franjas e o broche */}
      <path d="M2.6 20 Q3 13.4 9 12.4 Q15.2 12.4 16.4 20 Z" fill={cor(ROXO)} {...C(0.55)} />
      <path d="M4.2 17 L9.6 20 L14.8 16.6" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.45)} />
      {[5.2, 6.6, 8, 11.4, 12.8, 14.2].map((x, k) => <path key={k} d={`M${x} ${k < 3 ? 17.6 + k * 0.8 : 19.3 - (k - 3) * 0.8} l0 0.7`} {...L(0.25)} />)}
      <circle cx={9.6} cy={13.8} r={0.7} fill={cor(OURO)} {...C(0.35)} />
      {/* a cara de jacaré: o focinho comprido, as duas mandíbulas e os dentes */}
      <path d="M12 4.6 Q9 3.2 6.4 5 Q3.6 5.8 1.4 6.6 Q0.6 7.4 1.2 8.2 L7 8.6 Q10.4 8.4 12 8 Z" fill={cor(VERDE)} {...C(0.55)} />
      <path d="M1.4 8.6 L7 9 Q10 9.4 11.8 9 Q12.6 11 11.4 12.4 Q8 12 5.4 10.8 Q2.6 10 1.4 8.6 Z" fill={cor(VERDE)} {...C(0.55)} />
      <path d="M1.4 8.3 L7 8.7 L11.6 8.4" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.55)} />
      <path d="M2 8.2 l0.3 0.6 l0.3 -0.6 l0.3 0.6 l0.3 -0.6 M3.8 8.3 l0.3 0.6 l0.3 -0.6 l0.3 0.6 l0.3 -0.6 l0.3 0.6 l0.3 -0.6 M6.8 8.6 l0.3 -0.6 l0.3 0.6 l0.3 -0.6 l0.3 0.6" fill={cor(BRANCO)} {...C(0.2)} />
      <path d="M1.6 6.6 q0.4 -0.6 0.9 -0.2" {...L(0.3)} />
      {[[5, 5.8], [6.4, 5.3], [7.8, 5], [4, 10.2], [6.4, 11.2]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.25} fill={tinta} opacity={0.5} />)}
      {/* o olho saltado de jacaré */}
      <circle cx={10.4} cy={4.6} r={1.6} fill={cor(VERDE)} {...C(0.5)} />
      <circle cx={10.5} cy={4.6} r={1} fill={cor(AMARELO)} {...C(0.3)} />
      <ellipse cx={10.5} cy={4.6} rx={0.25} ry={0.75} fill={tinta} />
      <path d="M8.8 3.6 Q10.4 2.4 12 3.4" {...L(0.35)} />
      {/* a mão de garras */}
      <path d="M2.4 20 Q2.6 17 3.4 15.6 L5.6 15.6 Q6 17.6 5.6 20 Z" fill={cor(VERDE)} {...C(0.45)} />
      {[[2.6, 15.6, -0.8], [3.6, 15.2, -0.2], [4.6, 15.2, 0.3], [5.6, 15.6, 0.9]].map(([x, y, d], k) => <g key={k}>
        <path d={`M${x} ${y} q${d * 0.4} -1.2 ${d} -2`} stroke={cor(VERDE)} strokeWidth={s(0.85)} strokeLinecap="round" fill="none" />
        <path d={`M${x + d} ${y - 2} l${d * 0.3} -0.9`} stroke={tinta} strokeWidth={s(0.45)} strokeLinecap="round" />
      </g>)}
    </g>;
    case 'saci_de_lobato': { const c = W / 2; return <g>
      {/* o redemoinho */}
      {[[14.2, 5.6, 0.95], [15.8, 4.4, 0.8], [17.2, 3.2, 0.65], [18.4, 2, 0.5]].map(([y, rx, ry], k) => <ellipse key={k} cx={f(c + (k % 2 ? 0.4 : -0.3))} cy={y} rx={rx} ry={ry} {...L(0.4)} strokeDasharray={k % 2 ? '2 0.8' : '3 0.9'} />)}
      <path d={`M${c - 6} 13 Q${c - 6.4} 15 ${c - 4.6} 15.6 M${c + 6} 12.6 Q${c + 6.6} 14.8 ${c + 4.4} 15.8`} {...L(0.35)} opacity={0.7} />
      {[[c - 5, 11.4], [c + 5.4, 11], [c - 2.6, 18.6], [c + 3, 19.2]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l0.7 -0.3 l-0.2 0.6 Z`} fill={cor(VERDE)} {...C(0.2)} />)}
      {/* a perna só, pulando */}
      <path d={`M${c - 0.6} 12.6 Q${c - 0.8} 14.6 ${c - 0.1} 16.4 L${c + 1} 16.3 Q${c + 0.6} 14.4 ${c + 0.8} 12.6 Z`} fill={cor(ESCURA)} {...C(0.45)} />
      <path d={`M${c - 0.2} 16.3 Q${c - 1.4} 16.6 ${c - 1.6} 17.2 L${c + 1.1} 17.1 L${c + 1} 16.3 Z`} fill={cor(ESCURA)} {...C(0.4)} />
      {/* o calção */}
      <path d={`M${c - 2} 10.6 L${c + 2} 10.6 L${c + 1.6} 13 L${c - 1.6} 13 Z`} fill={cor(AREIA)} {...C(0.45)} />
      {/* o corpo e os braços abertos */}
      <path d={`M${c - 1.9} 7.8 Q${c} 7.4 ${c + 1.9} 7.8 L${c + 2} 10.8 L${c - 2} 10.8 Z`} fill={cor(ESCURA)} {...C(0.45)} />
      <path d={`M${c - 1.8} 8.4 Q${c - 4} 8.8 ${c - 5} 6.6`} stroke={tinta} strokeWidth={s(1.25)} strokeLinecap="round" fill="none" />
      <path d={`M${c - 1.8} 8.4 Q${c - 4} 8.8 ${c - 5} 6.6`} stroke={cor(ESCURA)} strokeWidth={s(0.7)} strokeLinecap="round" fill="none" />
      <path d={`M${c + 1.8} 8.4 Q${c + 3.6} 9.6 ${c + 5} 10.6`} stroke={tinta} strokeWidth={s(1.25)} strokeLinecap="round" fill="none" />
      <path d={`M${c + 1.8} 8.4 Q${c + 3.6} 9.6 ${c + 5} 10.6`} stroke={cor(ESCURA)} strokeWidth={s(0.7)} strokeLinecap="round" fill="none" />
      {/* a cabeça, o sorriso de moleque */}
      <circle cx={c} cy={5.2} r={2.5} fill={cor(ESCURA)} {...C(0.5)} />
      {olho(c - 0.9, 4.9, 0.55, 0.15, 0)}{olho(c + 0.9, 4.9, 0.55, 0.15, 0)}
      <path d={`M${c - 1.1} 6.3 Q${c} 7.3 ${c + 1.1} 6.3`} fill={cor(BRANCO)} {...C(0.3)} />
      {/* a carapuça vermelha */}
      <path d={`M${c - 2.6} 4.4 Q${c - 2.2} 2 ${c} 2 Q${c + 3} 1.2 ${c + 4.6} 0.6 Q${c + 4.8} 1.8 ${c + 3.6} 2.6 Q${c + 2.8} 3.4 ${c + 2.6} 4.2 Q${c} 3.2 ${c - 2.6} 4.4 Z`} fill={cor(VERMELHO)} {...C(0.5)} />
      <path d={`M${c - 1.6} 2.8 Q${c} 2.2 ${c + 2.6} 2`} stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" opacity={0.5} />
      {/* o cachimbo aceso e a fumaça */}
      <path d={`M${c + 0.8} 6.6 L${c + 2.8} 7.4`} {...L(0.4)} />
      <path d={`M${c + 2.6} 6.4 L${c + 2.6} 7.6 Q${c + 3.4} 8.2 ${c + 4} 7.6 L${c + 4} 6.4 Z`} fill={cor(MARROM)} {...C(0.4)} />
      <ellipse cx={c + 3.3} cy={6.4} rx={0.7} ry={0.25} fill={cor(LARANJA)} {...C(0.25)} />
      <path d={`M${c + 3.3} 5.8 Q${c + 2.6} 5 ${c + 3.4} 4.4 Q${c + 4.2} 3.8 ${c + 3.6} 3`} {...L(0.3)} opacity={0.7} />
    </g>; }
    /* ================================================================ Folclore brasileiro */
    case 'curupira_pes_virados': return <g>
      {/* as pegadas ao contrário no chão */}
      {[[2.6, 18.8], [5.6, 19.3]].map(([x, y], k) => <g key={k} opacity={0.75}>
        <ellipse cx={x} cy={y} rx={0.9} ry={0.42} fill={tinta} />
        {[0, 1, 2].map(j => <circle key={j} cx={f(x + 1.2)} cy={f(y - 0.38 + j * 0.38)} r={0.17} fill={tinta} />)}
      </g>)}
      <path d="M0.8 17.4 H14.2" {...L(0.3)} opacity={0.4} />
      {/* as pernas, com os pés virados para trás (os calcanhares para frente) */}
      <path d="M6.4 12.6 L6 16.4 M8.6 12.6 L9.6 16.2" stroke={tinta} strokeWidth={s(1.55)} strokeLinecap="round" />
      <path d="M6.4 12.6 L6 16.4 M8.6 12.6 L9.6 16.2" stroke={cor(TERRA)} strokeWidth={s(0.95)} strokeLinecap="round" />
      {[[6, 16.3], [9.6, 16.1]].map(([x, y], k) => <g key={k}>
        <path d={`M${x - 0.9} ${y - 0.3} Q${x - 1.1} ${y + 0.9} ${x} ${y + 0.9} L${x + 2.4} ${y + 0.8} Q${x + 2.8} ${y + 0.2} ${x + 2.2} ${y - 0.1} Q${x + 0.6} ${y - 0.5} ${x - 0.9} ${y - 0.3} Z`} fill={cor(TERRA)} {...C(0.45)} />
        <path d={`M${x + 1.7} ${y - 0.1} v0.9 M${x + 2.2} ${y} v0.8`} {...L(0.2)} />
      </g>)}
      {/* a saia de folhas */}
      <path d="M4.8 10.6 L10.2 10.6 L10.4 12.4 L9.4 13.6 L8.6 12.6 L7.6 13.8 L6.8 12.6 L5.8 13.6 L4.8 12.4 Z" fill={cor(VERDE)} {...C(0.45)} />
      <path d="M5.8 11 L5.8 13.4 M7.6 11 V13.6 M9.4 11 V13.4" {...L(0.2)} opacity={0.6} />
      {/* o corpo, de frente para a esquerda */}
      <path d="M5.2 7.6 Q7.6 7 9.8 7.6 L10.2 10.8 L4.8 10.8 Z" fill={cor(TERRA)} {...C(0.5)} />
      {/* o braço com o porrete erguido */}
      <path d="M5.4 8.2 Q3.6 9 2.6 7.4" stroke={tinta} strokeWidth={s(1.4)} strokeLinecap="round" fill="none" />
      <path d="M5.4 8.2 Q3.6 9 2.6 7.4" stroke={cor(TERRA)} strokeWidth={s(0.8)} strokeLinecap="round" fill="none" />
      <path d="M2.4 8.4 L1.6 2.6" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" />
      <path d="M2.4 8.4 L1.6 2.6" stroke={cor(MARROM)} strokeWidth={s(0.75)} strokeLinecap="round" />
      <circle cx={1.6} cy={2.6} r={0.95} fill={cor(MARROM)} {...C(0.4)} />
      <path d="M9.6 8.2 Q11 9.6 10.6 10.8" stroke={tinta} strokeWidth={s(1.4)} strokeLinecap="round" fill="none" />
      <path d="M9.6 8.2 Q11 9.6 10.6 10.8" stroke={cor(TERRA)} strokeWidth={s(0.8)} strokeLinecap="round" fill="none" />
      {/* o cabelo de fogo */}
      <path d="M5 5 Q3.6 3.4 4.6 1.6 Q5.2 3 6 2.6 Q5.8 0.8 7.4 0.2 Q7.2 1.8 8.2 2 Q8.6 0.6 10.2 0.8 Q9.4 1.8 10 2.6 Q11.4 2 12.4 3 Q11.2 3.4 11.2 4.4 Q12.4 4.8 12.6 6.4 Q11.2 5.8 10.4 6.6 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <path d="M6.4 3.6 Q7 2.4 7.6 2.2 M8.8 3.2 Q9.4 2.4 10 2.6 M10.4 4.4 Q11 4.2 11.6 4.6" stroke={cor(AMARELO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
      {/* a cabeça de perfil, olhando para a esquerda */}
      <path d="M5 5.4 Q5.6 3.6 7.6 3.6 Q9.8 3.8 9.8 6 Q9.6 7.8 7.8 8 Q6.6 8 6 7.4 Q5.4 7.4 5.2 6.9 Q4.4 6.6 4.6 6.2 Q5 6 5 5.4 Z" fill={cor(TERRA)} {...C(0.5)} />
      {olho(6.3, 5.5, 0.45, -0.15, 0)}
      <path d="M5.6 4.7 l1.2 0.1" {...L(0.25)} />
      <path d="M5.3 7 Q5.9 7.2 6.3 6.9" {...L(0.25)} />
      <path d="M8.6 5.6 Q9.2 5.8 8.8 6.6" {...L(0.25)} />
    </g>;
    case 'iara_do_rio': return <g>
      {/* o rio */}
      <path d="M0.4 16 Q4 15.4 8.5 16 Q13 16.6 16.6 16 L16.6 20 L0.4 20 Z" fill={cor(AZUL)} {...C(0.4)} />
      <path d={ondas(1, 7, 17.8, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      <path d={ondas(9, 16, 18.8, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      {/* as vitórias-régias, uma com flor */}
      <ellipse cx={2.8} cy={17.2} rx={2.2} ry={0.7} fill={cor(VERDE_CLARO)} {...C(0.4)} />
      <path d="M2.8 17.2 L4.4 16.9" {...L(0.25)} />
      <ellipse cx={14.4} cy={18.6} rx={1.8} ry={0.55} fill={cor(VERDE_CLARO)} {...C(0.4)} />
      <path d="M2 16.8 Q1.6 15.6 2.4 15.2 Q2.6 16 3 15.1 Q3.6 15.8 3.2 16.8 Z" fill={cor(ROSA)} {...C(0.3)} />
      {/* a pedra */}
      <path d="M3.4 16.6 Q3.6 13.2 7.6 12.8 Q12.6 12.8 13.4 16.2 Q8.6 17.2 3.4 16.6 Z" fill={cor(CINZA3)} {...C(0.5)} />
      <path d="M4.6 15.6 Q5.4 14.6 6.6 14.6" {...L(0.25)} opacity={0.5} />
      {/* a cauda de peixe sobre a pedra, a barbatana na água */}
      <path d="M6.4 11.2 L10.6 11.2 Q11 12.6 12.6 13 Q14 13.2 14.8 12.4 L15.8 14 Q14.2 15 12.4 14.8 Q8.6 14.6 6.8 13.6 Q5.8 12.6 6.4 11.2 Z" fill={cor(TURQUESA)} {...C(0.5)} />
      <path d="M14.8 12.4 Q15.6 10.6 16.6 10 Q16.6 11.8 15.6 13.2 Z M15.8 14 Q16.8 14.6 16.8 16 Q15.4 15.6 15.2 14.4 Z" fill={cor(TURQUESA)} {...C(0.4)} />
      {[[7.6, 12.4], [9.4, 12.6], [8.6, 13.6], [10.6, 13.6], [12.4, 14]].map(([x, y], k) => <path key={k} d={`M${x - 0.5} ${y - 0.25} q0.5 0.6 1 0`} {...L(0.2)} />)}
      {/* os cabelos longos, negros */}
      <path d="M5.8 3.4 Q8.6 1.2 11.2 3.4 Q12.4 6 11.8 9 Q12.6 11.6 11.4 13 Q10.4 11 10.2 9 L6.8 9 Q6.8 11.4 4.8 12.8 Q4.4 10 5.2 8.4 Q4.6 5.6 5.8 3.4 Z" fill={tinta} />
      <path d="M6.4 5 Q6 8 5.4 10.6 M11 5 Q11.4 8 11.4 11" stroke={cor(CINZA2)} strokeWidth={s(0.22)} fill="none" opacity={0.7} />
      {/* o tronco e os braços apoiados na pedra */}
      <path d="M6.6 8 Q8.5 7.4 10.4 8 L10.6 11.6 Q8.5 12.2 6.4 11.6 Z" fill={cor(MORENA)} {...C(0.45)} />
      <path d="M6.6 8.4 Q5 10.4 5.4 12.4 M10.4 8.4 Q12 10.4 11.6 12.4" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" fill="none" />
      <path d="M6.6 8.4 Q5 10.4 5.4 12.4 M10.4 8.4 Q12 10.4 11.6 12.4" stroke={cor(MORENA)} strokeWidth={s(0.75)} strokeLinecap="round" fill="none" />
      {/* o colar de sementes e a mecha que cobre o peito */}
      <path d="M7.2 8.6 Q8.5 9.8 9.8 8.6" stroke={cor(VERMELHO)} strokeWidth={s(0.45)} fill="none" strokeDasharray="0.3 0.25" />
      <path d="M6.9 7.6 Q6.5 9.4 6.9 10.6 Q7.1 11.2 6.7 11.8 M10.1 7.6 Q10.5 9.4 10.1 10.6 Q9.9 11.2 10.3 11.8" stroke={tinta} strokeWidth={s(0.85)} fill="none" strokeLinecap="round" />
      {/* o rosto */}
      <path d="M7.9 6.6 L7.9 8 L9.1 8 L9.1 6.6" fill={cor(MORENA)} {...C(0.35)} />
      <ellipse cx={8.5} cy={5.2} rx={1.75} ry={2.05} fill={cor(MORENA)} {...C(0.45)} />
      <path d="M6.7 4.6 Q8.5 2.4 10.3 4.6 Q9 3.6 8.5 4.2 Q8 3.6 6.7 4.6 Z" fill={tinta} />
      <path d="M7.4 5 Q7.8 4.7 8.1 5 M8.9 5 Q9.2 4.7 9.6 5" {...L(0.25)} />
      <circle cx={7.75} cy={5.2} r={0.2} fill={tinta} /><circle cx={9.25} cy={5.2} r={0.2} fill={tinta} />
      <path d="M8.5 5.4 l-0.15 0.6 h0.3" {...L(0.18)} />
      <path d="M8 6.5 Q8.5 6.8 9 6.5" stroke={cor(VERMELHO)} strokeWidth={s(0.35)} fill="none" strokeLinecap="round" />
      <path d="M10.2 3.8 Q11 3.2 11.4 3.8 Q11 4.6 10.2 4.2 Z" fill={cor(ROSA)} {...C(0.25)} />
    </g>;
    case 'boitata_cobra_de_fogo': { const corpo = 'M4.2 7.4 Q8 4.6 10.6 8 Q13 11.6 16 9.6 Q18.6 7.8 18.8 11.4 Q19 13.6 16.8 14'; return <g>
      {/* a grama do campo */}
      {[[1.6, 14.6], [6, 14.8], [11, 14.9], [14, 14.7]].map(([x, y], k) => <path key={k} d={`M${x - 0.6} ${y} l0.3 -1 M${x} ${y} v-1.3 M${x + 0.6} ${y} l-0.3 -1`} {...L(0.3)} />)}
      {/* as labaredas ao longo do corpo */}
      {[[6.6, 5.8, 2.4, -0.6], [9.2, 6, 2.6, 0.4], [11.8, 9.4, 2.4, -0.4], [14.2, 9.8, 2.6, 0.6], [16.8, 8.6, 2.2, -0.3], [18.4, 10.6, 1.6, 0.6]].map(([x, y, h, g], k) => <g key={k}>
        <path d={chama(x, y, h, 1.1, g)} fill={cor(LARANJA)} {...C(0.4)} />
        <path d={chama(x, y, h * 0.55, 0.5, g * 0.5)} fill={cor(AMARELO)} />
      </g>)}
      {/* o corpo de fogo, serpenteando */}
      <path d={corpo} fill="none" stroke={tinta} strokeWidth={s(3.4)} strokeLinecap="round" />
      <path d={corpo} fill="none" stroke={cor(LARANJA)} strokeWidth={s(2.6)} strokeLinecap="round" />
      <path d={corpo} fill="none" stroke={cor(AMARELO)} strokeWidth={s(1)} strokeLinecap="round" />
      <path d="M16.8 14 Q15.4 14.6 14.4 13.8" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M16.8 14 Q15.4 14.6 14.4 13.8" fill="none" stroke={cor(LARANJA)} strokeWidth={s(0.4)} strokeLinecap="round" />
      {/* a cabeça, os olhos enormes de fogo */}
      <path d="M5.6 6.4 Q4.6 3.8 2 4.2 Q0.4 4.8 0.6 7.2 Q0.8 9.4 3 9.8 Q5 9.8 5.8 8.4 Z" fill={cor(VERMELHO)} {...C(0.55)} />
      <circle cx={2.4} cy={5.8} r={1.35} fill={cor(AMARELO)} {...C(0.4)} /><circle cx={2.6} cy={5.8} r={0.6} fill={cor(BRANCO)} />
      <circle cx={4.4} cy={6} r={1.05} fill={cor(AMARELO)} {...C(0.35)} /><circle cx={4.5} cy={6} r={0.45} fill={cor(BRANCO)} />
      <path d="M0.8 8.4 Q2.4 8.6 3.8 8.2" {...L(0.35)} />
      <path d="M0.8 8.4 L-0.4 9.2 M-0.4 9.2 l-0.4 -0.5 M-0.4 9.2 l-0.2 0.6" stroke={cor(VERMELHO)} strokeWidth={s(0.35)} fill="none" strokeLinecap="round" />
    </g>; }
    case 'mula_sem_cabeca': return <g>
      <path d={`M0.6 ${H - 0.6} H19.4`} {...L(0.3)} opacity={0.4} />
      {/* o rabo ao vento */}
      <path d="M16.6 5.6 Q19 4.6 19.4 2.4 Q19.4 5.6 18.4 7.4 Q19.4 8.2 19.6 9.6 Q17.6 8.6 16.8 7.4 Z" fill={cor(CABELO)} {...C(0.4)} />
      {/* as pernas a galope: as de trás esticadas, as da frente dobradas */}
      {[['M15.4 9.4 L17.6 12.4 L19 13.4', 0], ['M14.4 9.6 L15 12.8 L16.4 14.2', 1], ['M6.6 9.4 L4.4 11.2 L3.4 9.6', 2], ['M7.6 9.6 L5.4 12.6 L3 13.2', 3]].map(([d, k]) => <g key={k as number}>
        <path d={d as string} stroke={tinta} strokeWidth={s(1.65)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={d as string} stroke={cor(MARROM)} strokeWidth={s(1.05)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>)}
      {/* os cascos ferrados, faiscando */}
      {[[19.1, 13.5, 35], [16.5, 14.4, 45], [3.3, 9.5, -150], [2.9, 13.3, -100]].map(([x, y, g], k) => <g key={k} transform={`rotate(${g} ${x} ${y})`}>
        <path d={`M${x - 0.75} ${y - 0.5} L${x + 0.75} ${y - 0.5} L${x + 0.9} ${y + 0.5} L${x - 0.9} ${y + 0.5} Z`} fill={tinta} />
        <path d={`M${x - 0.85} ${y + 0.55} H${x + 0.85}`} stroke={cor(CINZA3)} strokeWidth={s(0.35)} />
      </g>)}
      {[[1.2, 13.8], [1.8, 12.4], [17.8, 14.8], [18.8, 15]].map(([x, y], k) => <path key={`f${k}`} d={`M${x} ${y - 0.5} v1 M${x - 0.5} ${y} h1`} stroke={cor(AMARELO)} strokeWidth={s(0.35)} strokeLinecap="round" />)}
      {/* o corpo */}
      <path d="M6.2 6.4 Q10 5.2 15.6 5.6 Q17.6 6.4 17 8.6 Q16 10.4 13 10 L8.6 10 Q6 10 5.8 8.4 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M9 6.2 Q12 5.8 14.6 6.4" stroke={cor(TERRA)} strokeWidth={s(0.55)} fill="none" />
      {/* a sela e o arreio, que ficaram */}
      <path d="M9.4 5.8 Q11 5.2 12.6 5.8 L12.4 8.2 Q11 8.6 9.6 8.2 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M11 8.4 V10.4" {...L(0.3)} />
      {/* o pescoço que termina em fogo */}
      <path d="M7.4 6 Q5.6 5 4.6 3 L7 1.8 Q7.4 3.8 9 5.6 Z" fill={cor(MARROM)} {...C(0.55)} />
      <path d="M5.2 2.2 Q6 3.8 7.4 5" stroke={cor(CABELO)} strokeWidth={s(0.8)} fill="none" strokeLinecap="round" />
      {[[5.8, 2.6, 3.4, -0.8], [4.4, 3.2, 2.6, -1.2], [7.2, 2, 2.6, 0.4]].map(([x, y, h, g], k) => <g key={k} transform={`rotate(-28 ${x} ${y})`}>
        <path d={chama(x, y, h, 0.9, g)} fill={cor(LARANJA)} {...C(0.4)} />
        <path d={chama(x, y, h * 0.55, 0.45, g * 0.5)} fill={cor(AMARELO)} />
      </g>)}
    </g>;
    case 'boto_de_chapeu': return <g>
      {/* o rio e o respingo */}
      <path d={`M0.4 14.6 Q5 13.8 10 14.6 Q15 15.4 19.6 14.6 L19.6 ${H - 0.4} L0.4 ${H - 0.4} Z`} fill={cor(AZUL)} {...C(0.4)} />
      <path d={ondas(1.4, 8, 16.4, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      <path d={ondas(11, 18.6, 17.2, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      {[[15.2, 12.6], [17.2, 13], [16.4, 11.4], [3.6, 12.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.4} fill={cor(CELESTE)} {...C(0.25)} />)}
      {/* o corpo cor-de-rosa em arco, saltando */}
      <path d="M15.8 14.8 Q16 8 11.4 5.4 Q8.4 4 6.2 5.4 Q5.4 6.4 4.4 7.4 L1.4 9.8 Q1.2 10.6 2.2 10.4 L5.2 9.2 Q6.8 9.4 8 8.6 Q11.6 8.6 12.8 14.8 Z" fill={cor(BOTO)} {...C(0.6)} />
      <path d="M8.2 6.2 Q11.6 6 13.8 9.4" stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" opacity={0.55} />
      {/* a nadadeira e a crista baixa */}
      <path d="M9.6 8.6 Q9.8 10.6 8.4 11.6 Q8.4 10 8.6 8.8 Z" fill={cor(BOTO)} {...C(0.4)} />
      <path d="M12 5.8 Q13.2 5.2 13.8 6.6" {...L(0.4)} />
      {/* o olho pequeno e o sorriso do bico */}
      <circle cx={5.8} cy={7.4} r={0.35} fill={tinta} />
      <path d="M2.2 9.9 Q4 9 5.8 8.6" {...L(0.25)} />
      {/* o chapéu branco que esconde o furo da cabeça */}
      <g transform="rotate(-14 7.4 4.4)">
        <ellipse cx={7.4} cy={4.6} rx={3.4} ry={0.75} fill={cor(BRANCO)} {...C(0.45)} />
        <path d="M5.4 4.6 Q5.4 1.8 7.4 1.8 Q9.4 1.8 9.4 4.6 Z" fill={cor(BRANCO)} {...C(0.45)} />
        <path d="M5.45 3.8 H9.35" stroke={tinta} strokeWidth={s(0.55)} />
        <path d="M6.6 2 Q7.4 2.6 8.2 2" {...L(0.25)} />
      </g>
    </g>;
    case 'lobisomem_lua_cheia': return <g>
      {/* a lua cheia */}
      <circle cx={12.4} cy={6.4} r={5.4} fill={cor(LUA)} {...C(0.45)} />
      <circle cx={14.4} cy={4.6} r={0.9} fill={cor(AREIA)} opacity={0.6} /><circle cx={13.6} cy={8.8} r={1.2} fill={cor(AREIA)} opacity={0.6} /><circle cx={16} cy={7.6} r={0.6} fill={cor(AREIA)} opacity={0.6} />
      {/* a camisa rasgada nos ombros */}
      <path d="M2 20 Q2.4 15 6.6 14 L12 14 Q16.2 15 16.6 20 Z" fill={cor(AZUL)} {...C(0.55)} />
      <path d="M3.4 16.6 l1 0.8 l-0.4 1 l1 0.6 M15 16.4 l-1 0.8 l0.4 0.9 l-1.1 0.7" {...L(0.35)} />
      <path d="M2.6 17.2 l0.8 -0.6 l0.6 0.8 Z M15.8 17 l-0.8 -0.5 l-0.5 0.8 Z" fill={cor(CINZA2)} {...C(0.25)} />
      <path d="M7.8 14 L9.4 16.8 L11 14" fill={cor(CINZA2)} {...C(0.35)} />
      {/* o pescoço peludo */}
      <path d="M6.4 14.4 L5.6 11.6 L4.8 12.4 L5.2 9.6 L8.4 7.6 L11.8 10.6 L12.4 14.2 L11.4 13.4 L10.6 14.6 L9.6 13.6 L8.6 14.8 L7.6 13.6 Z" fill={cor(CINZA1)} {...C(0.5)} />
      {/* a cabeça de lobo erguida, uivando */}
      <path d="M5.2 9.8 Q4 7.4 3.2 4.8 L1.6 2 L3.8 2.8 L5 3 Q7.4 2.6 8.8 4.4 Q10.6 6.2 10.8 8.8 Q9.6 10.8 7.4 10.8 Z" fill={cor(CINZA1)} {...C(0.55)} />
      {/* a boca aberta com as presas */}
      <path d="M1.6 2 L3.6 4.6 L2.4 5.6 L3.4 7.2 Q4.4 6.6 5.4 6.4 L3.8 2.8 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M2.6 3.2 l0.5 0.3 l-0.3 0.4 M3.6 7 l0.3 -0.6 l0.4 0.4" fill={cor(BRANCO)} {...C(0.2)} />
      <circle cx={1.6} cy={2} r={0.35} fill={tinta} />
      {/* as orelhas em pé */}
      <path d="M7.4 3.6 L8.2 0.6 L9.4 3.6 Z M9 4.8 L10.6 2.2 L10.8 5.6 Z" fill={cor(CINZA1)} {...C(0.45)} />
      <path d="M7.9 3.2 L8.2 1.6 L8.8 3.3" fill={cor(ROSA)} opacity={0.7} />
      {/* o olho amarelo */}
      <path d="M5.6 4.4 Q6.4 4 6.9 4.6 Q6.2 5.1 5.6 4.4 Z" fill={cor(AMARELO)} {...C(0.25)} />
      <circle cx={6.3} cy={4.5} r={0.18} fill={tinta} />
      <path d="M5.2 3.6 l1.8 0.4" {...L(0.3)} />
      {/* o pelo arrepiado */}
      <path d="M8.6 7.2 l0.8 0.2 M9.4 8.6 l0.9 0 M6.4 9.4 l0.6 0.6 M4.6 6.4 l0.6 0.2" {...L(0.25)} />
    </g>;
    case 'caipora_no_caititu': return <g>
      <path d={`M0.6 ${H - 0.5} H19.4`} {...L(0.3)} opacity={0.4} />
      {/* as patas finas do porco-do-mato */}
      {[5, 6.8, 13.6, 15.4].map((x, k) => <g key={k}>
        <path d={`M${x} 12.6 L${x + (k % 2 ? 0.4 : -0.3)} ${H - 1.2}`} stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" />
        <path d={`M${x} 12.6 L${x + (k % 2 ? 0.4 : -0.3)} ${H - 1.2}`} stroke={cor(CINZA1)} strokeWidth={s(0.6)} strokeLinecap="round" />
      </g>)}
      {/* o caititu: o corpo de cerdas, o colar claro */}
      <path d="M4.2 9.6 Q6 6.6 11 6.8 Q16.4 6.8 17.4 9.6 Q18 12.6 15 13.4 L7 13.4 Q4.4 12.8 4.2 9.6 Z" fill={cor(CINZA1)} {...C(0.55)} />
      <path d="M5.6 7.6 l0.5 -0.9 l0.4 0.8 l0.6 -1 l0.4 0.9 l0.6 -1 l0.5 0.9 M13.2 6.9 l0.5 -0.8 l0.4 0.8 l0.6 -0.7 l0.4 0.8" {...L(0.3)} />
      <path d="M7.4 7 Q6.8 10 7.8 13.2" stroke={cor(CREME)} strokeWidth={s(0.75)} fill="none" />
      <path d="M17.2 8.8 l0.8 -0.4" {...L(0.4)} />
      {/* a cabeça e o focinho */}
      <path d="M5.4 8 Q3 8 1.4 10.4 L0.8 11.6 Q1.6 12.6 3 12 Q5 11.8 6 11.2 Z" fill={cor(CINZA1)} {...C(0.55)} />
      <ellipse cx={1} cy={11.1} rx={0.5} ry={0.75} fill={cor(ROSA)} {...C(0.35)} />
      <path d="M1.8 11.8 q0.2 0.8 -0.2 1.2" stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" strokeLinecap="round" />
      <circle cx={3.4} cy={9.6} r={0.3} fill={cor(BRANCO)} /><circle cx={3.45} cy={9.6} r={0.15} fill={tinta} />
      <path d="M4.6 8.2 L5.2 6.8 L5.8 8.2 Z" fill={cor(CINZA1)} {...C(0.35)} />
      {/* a Caipora montada: a perna, o corpo, os braços */}
      <path d="M10.4 8.4 Q9.6 10.4 10.6 11.6 L11.6 11.2 Q11 10 11.6 8.6 Z" fill={cor(BRONZE)} {...C(0.4)} />
      <path d="M9.6 7 L13 7 L12.6 8.8 L10 8.8 Z" fill={cor(VERDE)} {...C(0.4)} />
      <path d="M9.6 7.4 L10.2 8.8 M11.3 7.2 V8.8 M12.4 7.4 L12 8.8" {...L(0.2)} />
      <path d="M10 3.6 Q11.3 3.2 12.6 3.6 L13 7.2 L9.6 7.2 Z" fill={cor(BRONZE)} {...C(0.45)} />
      <path d="M10 4.2 Q8.4 5.2 7.6 7.2" stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" fill="none" />
      <path d="M10 4.2 Q8.4 5.2 7.6 7.2" stroke={cor(BRONZE)} strokeWidth={s(0.65)} strokeLinecap="round" fill="none" />
      <path d="M12.6 4.2 Q14.2 4.6 14.6 3.2" stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" fill="none" />
      <path d="M12.6 4.2 Q14.2 4.6 14.6 3.2" stroke={cor(BRONZE)} strokeWidth={s(0.65)} strokeLinecap="round" fill="none" />
      {/* a cabeça, o cabelo vermelho e o cachimbo */}
      <path d="M9.4 1.8 Q9.6 0 11.4 0 Q13 0 13.2 1.6 L13.8 2.6 L12.8 2.4 L12.6 3.4 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <circle cx={11.2} cy={2} r={1.45} fill={cor(BRONZE)} {...C(0.45)} />
      <path d="M9.6 1.6 Q10 0.4 11.4 0.4 Q12.6 0.4 12.8 1.4 Q11.6 1 10.8 1.4 Q10.2 1.2 9.6 1.6 Z" fill={cor(VERMELHO)} {...C(0.3)} />
      <circle cx={10.6} cy={2} r={0.2} fill={tinta} /><circle cx={11.8} cy={2} r={0.2} fill={tinta} />
      <path d="M10.8 2.8 Q11.2 3 11.6 2.8" {...L(0.2)} />
      <path d="M11.6 2.9 L13.2 3.4" {...L(0.3)} /><path d="M13 2.8 v0.9 h0.8 v-0.9 Z" fill={cor(MARROM)} {...C(0.25)} />
      <path d="M13.4 2.6 Q14.4 1.8 14 1 Q13.6 0.4 14.6 0.2" {...L(0.25)} opacity={0.7} />
    </g>;
    case 'mapinguari': { const c = W / 2; return <g>
      {/* as pernas curtas e os pés */}
      <path d={`M${c - 3.6} 16 L${c - 4} 18.8 L${c - 1.4} 18.8 L${c - 1.4} 16 Z M${c + 3.6} 16 L${c + 4} 18.8 L${c + 1.4} 18.8 L${c + 1.4} 16 Z`} fill={cor(MARROM)} {...C(0.5)} />
      <path d={`M${c - 4.6} 19.4 Q${c - 2.6} 18.4 ${c - 0.8} 19.4 M${c + 4.6} 19.4 Q${c + 2.6} 18.4 ${c + 0.8} 19.4`} {...L(0.6)} />
      {/* os braços compridos de garras */}
      {[1, -1].map(d => <g key={d}>
        <path d={`M${c - d * 4.6} 6.6 Q${c - d * 7.4} 9 ${c - d * 7.2} 13.6 L${c - d * 5.4} 13.6 Q${c - d * 5.6} 10.4 ${c - d * 4.2} 9.4 Z`} fill={cor(MARROM)} {...C(0.5)} />
        {[0, 1, 2].map(j => <path key={j} d={`M${c - d * (5.6 + j * 0.7)} 13.6 q${-d * 0.2} 1.4 ${d * 0.5} 2.2`} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeLinecap="round" />)}
      </g>)}
      {/* o corpo enorme e peludo */}
      <path d={`M${c} 1.6 Q${c + 5.2} 1.6 ${c + 5} 7.4 Q${c + 5.4} 13 ${c + 3.8} 16.6 L${c - 3.8} 16.6 Q${c - 5.4} 13 ${c - 5} 7.4 Q${c - 5.2} 1.6 ${c} 1.6 Z`} fill={cor(MARROM)} {...C(0.6)} />
      {[[c - 3.4, 6], [c + 3.2, 5.6], [c - 4, 9.6], [c + 4, 9.2], [c - 2.4, 15.6], [c + 2.8, 15.4], [c - 1.4, 2.8], [c + 1.6, 3]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l${k % 2 ? 0.5 : -0.5} 0.9 M${x + 0.5} ${y - 0.2} l${k % 2 ? 0.5 : -0.5} 0.9`} {...L(0.25)} opacity={0.7} />)}
      {/* o olho único na testa */}
      <ellipse cx={c} cy={4.6} rx={1.5} ry={1.2} fill={cor(AMARELO)} {...C(0.45)} />
      <ellipse cx={c} cy={4.7} rx={0.45} ry={0.9} fill={tinta} />
      <path d={`M${c - 2} 3.4 Q${c} 2.4 ${c + 2} 3.4`} {...L(0.45)} />
      {/* a boca enorme na barriga */}
      <path d={`M${c - 3.2} 10 Q${c} 8.8 ${c + 3.2} 10 Q${c + 2.8} 13.8 ${c} 14 Q${c - 2.8} 13.8 ${c - 3.2} 10 Z`} fill={cor(VERMELHO)} {...C(0.55)} />
      <path d={`M${c - 2.8} 10 l0.5 1 l0.5 -1.1 l0.5 1.1 l0.5 -1.2 l0.5 1.2 l0.5 -1.2 l0.5 1.1 l0.5 -1.1 l0.5 1 l0.4 -0.9`} fill={cor(BRANCO)} {...C(0.25)} />
      <path d={`M${c - 2.2} 13.2 l0.5 -0.9 l0.5 0.9 l0.6 -1 l0.6 1 l0.6 -1 l0.6 1 l0.5 -0.9 l0.5 0.8`} fill={cor(BRANCO)} {...C(0.25)} />
    </g>; }
    /* ================================================================ Macunaíma */
    case 'macunaima_preguica': return <g>
      {/* os dois esteios e as cordas */}
      <path d={`M1 ${H - 0.2} V4 M19 ${H - 0.2} V4`} stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" />
      <path d={`M1 ${H - 0.2} V4 M19 ${H - 0.2} V4`} stroke={cor(MARROM)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d="M1.2 5.4 L3.2 6.8 M18.8 5.4 L16.8 6.8" {...L(0.3)} />
      {/* a perna que escorrega para fora da rede */}
      <path d="M13.6 8.6 Q14.8 10 14.6 11.8" stroke={tinta} strokeWidth={s(1.25)} strokeLinecap="round" fill="none" />
      <path d="M13.6 8.6 Q14.8 10 14.6 11.8" stroke={cor(BRONZE)} strokeWidth={s(0.7)} strokeLinecap="round" fill="none" />
      <path d="M14.2 11.6 Q14 12.6 15.4 12.6 Q15.6 11.9 14.9 11.5 Z" fill={cor(BRONZE)} {...C(0.3)} />
      {/* a rede listrada */}
      <path d="M3.2 6.8 Q10 15.4 16.8 6.8 Q10 11 3.2 6.8 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M4.6 8.4 Q10 13.6 15.4 8.4" stroke={cor(VERMELHO)} strokeWidth={s(0.6)} fill="none" />
      <path d="M6 9.8 Q10 12.8 14 9.8" stroke={cor(VERDE)} strokeWidth={s(0.6)} fill="none" />
      {/* o herói deitado: o peito acima da borda, o joelho dobrado */}
      <path d="M6.6 8.4 Q8 6.6 10.6 7 Q12.4 7.4 13.6 6 Q14.4 6.6 14 8.2 Q12.4 9.6 10 9.6 Q7.6 9.6 6.6 8.4 Z" fill={cor(BRONZE)} {...C(0.45)} />
      <path d="M10.6 9.4 Q12.4 8.4 13.4 6.4" {...L(0.28)} />
      <path d="M10 7.6 Q11.4 7.6 12 8.6 L10.8 9.5 Q10.2 8.6 9.6 8.6 Z" fill={cor(VERMELHO)} {...C(0.3)} />
      {/* a cabeça, o braço atrás da nuca */}
      <path d="M6.4 7.4 Q4.4 6 4 4.6 Q4.8 4.2 5.6 4.8 Q6.6 6 7.4 6.6" stroke={tinta} strokeWidth={s(1.25)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6.4 7.4 Q4.4 6 4 4.6 Q4.8 4.2 5.6 4.8 Q6.6 6 7.4 6.6" stroke={cor(BRONZE)} strokeWidth={s(0.7)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={5.6} cy={6.7} r={1.6} fill={cor(BRONZE)} {...C(0.45)} />
      <path d="M4.1 6.6 Q4.2 5 5.6 5 Q7.1 5 7.2 6.2 Q6.4 5.7 5.7 5.9 Q4.8 5.8 4.1 6.6 Z" fill={tinta} />
      {/* o bocejo da preguiça, os olhos fechados */}
      <path d="M4.8 6.9 Q5.1 7.2 5.4 6.9 M5.9 6.9 Q6.2 7.2 6.5 6.9" {...L(0.2)} />
      <ellipse cx={5.65} cy={7.75} rx={0.34} ry={0.42} fill={cor(VERMELHO)} {...C(0.2)} />
      <path d="M7.6 5.6 q0.4 -0.4 0.8 -0.3 M7.8 6.3 h0.7" {...L(0.22)} />
      {letra('Ai, que preguiça!', 10, 2.6, 2.1, { estilo: 'italic', larg: 14 })}
    </g>;
    /* ================================================================ Machado de Assis */
    case 'bras_cubas_defunto_autor': return <g>
      {/* o papel na mesa, as linhas escritas e o verme */}
      <path d="M1.4 19.4 L3 14.6 L15.6 14.6 L16.4 19.4 Z" fill={cor(CREME)} {...C(0.5)} />
      <path d="M3.6 15.8 H10 M3.2 17 H9 M2.9 18.2 H8.2" {...L(0.25)} opacity={0.7} />
      <path d="M9.6 18.4 Q10.2 17.4 10.8 18.2 Q11.4 19 12 18.1 Q12.5 17.4 13.2 18" stroke={tinta} strokeWidth={s(0.95)} fill="none" strokeLinecap="round" />
      <path d="M9.6 18.4 Q10.2 17.4 10.8 18.2 Q11.4 19 12 18.1 Q12.5 17.4 13.2 18" stroke={cor(ROSA)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
      <circle cx={13.3} cy={17.9} r={0.12} fill={tinta} />
      {/* a casaca preta, o colarinho alto e a gravata */}
      <path d="M2.4 14.6 Q2.6 10.6 6 10 L11 10 Q14.4 10.6 14.6 14.6 Z" fill={tinta} />
      <path d="M6.6 9.6 L8.5 12.6 L10.4 9.6 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M7.4 10.4 L8.5 11 L9.6 10.4 L9.6 11.6 L8.5 11 L7.4 11.6 Z" fill={cor(BRANCO)} {...C(0.3)} />
      <path d="M5.8 10.2 L7.4 13.4 M11.2 10.2 L9.6 13.4" stroke={cor(CINZA2)} strokeWidth={s(0.3)} />
      {/* a caveira de olhos fundos e o sorriso de quem já morreu */}
      <path d="M8.5 1 Q13 1 13 5.4 Q13 7.4 11.6 8.2 L11.4 9.8 L5.6 9.8 L5.4 8.2 Q4 7.4 4 5.4 Q4 1 8.5 1 Z" fill={cor(BRANCO)} {...C(0.55)} />
      <ellipse cx={6.8} cy={5.4} rx={1.15} ry={1.3} fill={tinta} /><ellipse cx={10.2} cy={5.4} rx={1.15} ry={1.3} fill={tinta} />
      <path d="M8.5 6.6 L7.9 7.8 H9.1 Z" fill={tinta} />
      <path d="M6.2 8.6 H10.8 M7 8.2 V9.4 M7.9 8.2 V9.6 M8.8 8.2 V9.6 M9.7 8.2 V9.4" {...L(0.25)} />
      <path d="M10.6 1.8 l-0.4 1 l0.6 0.6" {...L(0.25)} />
      {/* a mão de ossos com a pena */}
      <path d="M14.2 14.6 L12.8 12.4 M14.6 14.4 L13.6 12.2 M13.8 15 L12.4 13.6" stroke={tinta} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d="M14.2 14.6 L12.8 12.4 M14.6 14.4 L13.6 12.2 M13.8 15 L12.4 13.6" stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M12.6 13 L11.2 16.4" {...L(0.4)} />
      <path d="M12.6 13 Q13.4 9.2 16.6 6.8 Q16 10.6 13.2 13.2 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M12.8 12.8 Q14.4 10 16.2 7.4" {...L(0.2)} />
    </g>;
    case 'capitu_olhos_de_ressaca': return <g>
      {/* o mar de ressaca atrás, as vagas se enrolando */}
      <path d={'M0.4 20 V12.6' + [0, 1, 2, 3, 4, 5].map(() => ' q1.4 -2 2.7 0').join('') + ' V20 Z'} fill={cor(TURQUESA)} {...C(0.45)} />
      {[0, 1, 2, 3, 4, 5].map(k => <path key={k} d={`M${f(0.9 + k * 2.7)} 12.4 q0.9 -1 1.6 -0.2 q0.2 0.6 -0.4 0.7`} stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" strokeLinecap="round" />)}
      <path d={ondas(0.8, 5, 15.4, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      <path d={ondas(12, 16.2, 15.4, 0.4, 3)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      <path d={ondas(0.8, 4.4, 17.8, 0.4, 2)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      <path d={ondas(12.6, 16.2, 17.8, 0.4, 2)} stroke={cor(CELESTE)} strokeWidth={s(0.35)} fill="none" />
      {/* o vestido de gola alta e o camafeu */}
      <path d="M3 20 Q3.2 15.4 7 14.6 L10 14.6 Q13.8 15.4 14 20 Z" fill={cor(ROXO)} {...C(0.55)} />
      <path d="M7 12.4 L7 15 Q8.5 15.8 10 15 L10 12.4" fill={cor(BRANCO)} {...C(0.4)} />
      <ellipse cx={8.5} cy={16.6} rx={0.7} ry={0.85} fill={cor(OURO)} {...C(0.3)} />
      {/* as tranças */}
      {[1, -1].map(d => <g key={d}>
        <path d={`M${8.5 - d * 3.2} 7.6 Q${8.5 - d * 4} 11 ${8.5 - d * 3.6} 15.4`} stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" fill="none" />
        {[9.4, 10.8, 12.2, 13.6].map((y, k) => <path key={k} d={`M${8.5 - d * 4.3} ${y} q${d * 0.7} 0.5 ${d * 1.3} 0`} stroke={cor(CINZA2)} strokeWidth={s(0.25)} fill="none" />)}
        <path d={`M${8.5 - d * 3.6} 15.4 l${-d * 0.5} 0.8 M${8.5 - d * 3.6} 15.4 l${d * 0.4} 0.9`} {...L(0.3)} />
      </g>)}
      {/* o rosto */}
      <path d="M7.6 11 L7.4 13.4 L9.6 13.4 L9.4 11" fill={cor(PELE)} {...C(0.4)} />
      <ellipse cx={8.5} cy={7.6} rx={3.2} ry={3.9} fill={cor(PELE)} {...C(0.55)} />
      {/* o cabelo repartido ao meio */}
      <path d="M5.2 8 Q4.8 3.4 8.5 3.4 Q12.2 3.4 11.8 8 Q11.4 5.6 10 5 Q9.2 4.6 8.5 4.2 Q7.8 4.6 7 5 Q5.6 5.6 5.2 8 Z" fill={tinta} />
      <path d="M8.5 4.2 V3.6" stroke={cor(PELE)} strokeWidth={s(0.3)} />
      {/* os olhos de ressaca: as íris em redemoinho */}
      {[6.9, 10.1].map((x, k) => <g key={k}>
        <path d={`M${x - 1.3} 7.4 Q${x} 6.1 ${x + 1.3} 7.4 Q${x} 8.7 ${x - 1.3} 7.4 Z`} fill={cor(BRANCO)} {...C(0.35)} />
        <circle cx={x} cy={7.4} r={0.68} fill={cor(TURQUESA)} />
        <path d={espiral(x, 7.4, 0.66, 1.8, k ? 0 : Math.PI)} fill="none" stroke={tinta} strokeWidth={s(0.2)} />
        <path d={`M${x - 1} 6.4 Q${x} 5.8 ${x + 1} 6.3`} {...L(0.3)} />
      </g>)}
      {/* as ondas que os olhos puxam para dentro */}
      {/* o nariz e a boca */}
      <path d="M8.5 8.2 L8.2 9.4 H8.8" {...L(0.25)} />
      <path d="M7.7 10.2 Q8.5 10.7 9.3 10.2 Q8.5 10.4 7.7 10.2 Z" fill={cor(VERMELHO)} {...C(0.25)} />
    </g>;
    /* ================================================================ José de Alencar */
    case 'iracema_e_a_ara': return <g>
      {/* os cabelos longos, negros, ao vento atrás */}
      <path d="M8.6 2 Q4.4 1.6 3.6 5.6 Q3 9.6 1.6 13.4 Q1 16.6 0.6 19.6 L6.4 19.6 Q5.6 16 6.6 12.6 Q7.4 9.4 7.4 6.4 Z" fill={tinta} />
      <path d="M4.4 5.4 Q3.6 10 2.4 14.6 M5.6 6.4 Q5 11 4.2 16.6" stroke={cor(CINZA2)} strokeWidth={s(0.22)} fill="none" opacity={0.7} />
      {/* os ombros e o colar de sementes */}
      <path d="M3.4 20 Q3.6 15.2 7.4 14.4 L10 14.4 Q12.6 15 13 17 L13.6 20 Z" fill={cor(MORENA)} {...C(0.55)} />
      <path d="M6.6 14.8 Q8.6 17.2 11 15" stroke={cor(VERMELHO)} strokeWidth={s(0.55)} fill="none" strokeDasharray="0.35 0.3" />
      <path d="M8.6 16.6 l-0.3 0.8 l0.6 0 Z" fill={cor(OURO)} {...C(0.2)} />
      <path d="M7.6 11.6 L7.4 14.6 L10 14.6 L9.8 12" fill={cor(MORENA)} {...C(0.45)} />
      {/* o rosto em três quartos, voltado para a direita */}
      <path d="M7 3.4 Q10.6 2.6 11.6 5.6 Q11.8 6.8 12.4 7.6 Q12.2 8 11.8 8 Q12 8.6 11.6 8.9 Q11.8 9.4 11.4 9.6 Q11.2 11.4 9.6 12 Q8 12.2 7 10.6 Q6 8.6 6.4 6 Z" fill={cor(MORENA)} {...C(0.55)} />
      {/* a franja reta e a pena no cabelo */}
      <path d="M6.4 6.4 Q6 2.8 9 2.4 Q11.4 2.4 11.8 5.2 Q10 4.6 8.6 4.8 Q7.4 5.2 6.4 6.4 Z" fill={tinta} />
      <path d="M6.8 3.4 Q5.2 1.4 5.6 -0.2 Q7 1.2 7.4 3 Z" fill={cor(VERMELHO)} {...C(0.35)} />
      <path d="M6.9 3.2 Q6.2 1.6 5.8 0.4" {...L(0.2)} />
      {/* o olho amendoado, a sobrancelha, os lábios de mel */}
      <path d="M9.4 6.8 Q10.2 6.2 10.9 6.8 Q10.2 7.3 9.4 6.8 Z" fill={cor(BRANCO)} {...C(0.25)} />
      <circle cx={10.35} cy={6.78} r={0.3} fill={tinta} />
      <path d="M9.2 5.8 Q10.1 5.4 11 5.8" {...L(0.3)} />
      <path d="M11 9.6 Q11.4 9.8 11.6 9.4 Q11.3 9 11 9.6 Z" fill={cor(OURO)} {...C(0.25)} />
      <path d="M11.8 8 L11.3 8.1" {...L(0.25)} />
      <path d="M7.8 7.2 Q7.2 7.6 7.4 8.6 Q7.6 9.2 8 8.8" {...L(0.3)} />
      {/* a mão erguida e a ará, a periquita verde, pousada nela */}
      <path d="M15.8 12.2 Q16.8 13.6 17.4 16 L16.6 16.2 Q16 14 15.2 12.6 Z" fill={cor(VERDE)} {...C(0.3)} />
      <path d="M12.6 20 Q14 16.8 15 13.4" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" fill="none" />
      <path d="M12.6 20 Q14 16.8 15 13.4" stroke={cor(MORENA)} strokeWidth={s(1)} strokeLinecap="round" fill="none" />
      <path d="M14.2 13.4 Q14.4 12.4 15.2 12.4 Q16.2 12.6 16 13.6 Q15 14 14.2 13.4 Z" fill={cor(MORENA)} {...C(0.4)} />
      <path d="M15 12.6 Q13.6 11.2 14.2 9 Q15 7.6 16.2 8 Q17.2 8.6 16.8 10.4 Q16.4 12 15.6 12.6 Z" fill={cor(VERDE_CLARO)} {...C(0.45)} />
      <path d="M15 12.4 Q14.6 10.4 15.6 9.4" stroke={cor(VERDE)} strokeWidth={s(0.45)} fill="none" />
      <path d="M16.6 8.4 Q17.6 8.4 17.6 9.2 Q17.2 9.2 16.9 9.4 Z" fill={cor(CREME)} {...C(0.3)} />
      <circle cx={16.1} cy={8.7} r={0.2} fill={tinta} />
      <path d="M15.2 12.6 l-0.3 0.6 M15.8 12.6 l0.1 0.6" {...L(0.25)} />
    </g>;
    default: return undefined;
  }
}
