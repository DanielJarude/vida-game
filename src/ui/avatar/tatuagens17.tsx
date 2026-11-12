/**
 * VIDA 17 — a arte dos desenhos novos (`dados17/tatuagens/tatuagens17`): rua e periferia, tradição de cadeia e as peças
 * do rosto. Desenhos ORIGINAIS no traço do VIDA (contorno firme, preto e cinza, cor chapada quando colorida), na mesma
 * caixa nativa dos outros lotes (20 de lado; a proporção estica a caixa).
 */
import type { ReactNode } from 'react';
import { atalhos, estrela, f, AMARELO, AZUL, CINZA1, CINZA2, CINZA3, CREME, MARROM, OURO, VERDE, VERMELHO, ROSA, LARANJA, CELESTE, type PincelDaTatuagem13 } from './tatuagens13Base';

const CURSIVA = "'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive";
const GOTICA = "'UnifrakturMaguntia', 'Old English Text MT', 'Engravers MT', Georgia, serif";
const BLOCO = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif";

export function desenho17(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor, W, H } = p;
  const { s, L, C, letra } = atalhos(p);
  const cx = W / 2, cy = H / 2;
  switch (id) {
    /* ================================================================ rua e periferia: as letras */
    case 'letra_vida_loka': return <g>
      {letra('Vida Loka', cx, H * 0.72, H * 0.78, { fonte: CURSIVA, peso: 400, estilo: 'italic', larg: W * 0.86 })}
      <path d={`M${f(W * 0.04)} ${f(H * 0.86)} Q${f(W * 0.3)} ${f(H * 1.0)} ${f(W * 0.62)} ${f(H * 0.84)} T${f(W * 0.97)} ${f(H * 0.7)}`} {...L(0.32)} />
      <path d={`M${f(W * 0.9)} ${f(H * 0.18)} q1.2 -0.8 1.4 0.6 q-0.4 1 -1.6 0.4`} {...L(0.28)} />
    </g>;
    case 'letra_fe_em_deus': return <g>
      {letra('Fé em Deus', cx, H * 0.74, H * 0.74, { fonte: CURSIVA, peso: 400, estilo: 'italic', larg: W * 0.84 })}
      <path d={`M${f(W * 0.2)} ${f(H * 0.06)} V${f(H * 0.3)} M${f(W * 0.2 - 0.7)} ${f(H * 0.13)} H${f(W * 0.2 + 0.7)}`} {...L(0.35)} />
      <path d={`M${f(W * 0.1)} ${f(H * 0.9)} H${f(W * 0.9)}`} {...L(0.2)} strokeDasharray="0.6 0.6" />
    </g>;
    case 'letra_quebrada': {
      const t = (p.texto ?? 'Quebrada').toUpperCase();
      const n = t.length, raio = W * 0.62;
      return <g>
        <defs><path id="arco17q" d={`M${f(cx - raio * 0.78)} ${f(H * 0.78)} A${f(raio)} ${f(raio * 0.62)} 0 0 1 ${f(cx + raio * 0.78)} ${f(H * 0.78)}`} /></defs>
        <g transform={p.espelhado ? `translate(${W} 0) scale(-1 1)` : undefined}>
          <text fontFamily={GOTICA} fontWeight={900} fontSize={f(Math.min(H * 0.42, (W * 1.6) / Math.max(4, n)))} fill={tinta} textAnchor="middle">
            <textPath href="#arco17q" startOffset="50%">{t}</textPath>
          </text>
        </g>
        <path d={estrela(f(W * 0.08), f(H * 0.86), 0.9)} fill={tinta} /><path d={estrela(f(W * 0.92), f(H * 0.86), 0.9)} fill={tinta} />
        <path d={`M${f(W * 0.2)} ${f(H * 0.94)} H${f(W * 0.8)}`} {...L(0.35)} />
      </g>;
    }
    case 'letra_so_deus': return <g>
      {letra('Só Deus pode', cx, H * 0.4, H * 0.42, { fonte: CURSIVA, peso: 400, estilo: 'italic', larg: W * 0.7 })}
      {letra('me julgar', cx, H * 0.82, H * 0.42, { fonte: CURSIVA, peso: 400, estilo: 'italic', larg: W * 0.55 })}
      <path d={`M${f(W * 0.06)} ${f(H * 0.92)} Q${cx} ${f(H * 1.04)} ${f(W * 0.94)} ${f(H * 0.92)}`} {...L(0.25)} />
    </g>;
    case 'letra_deus_e_fiel': return <g>
      {letra('Deus é fiel', cx, H * 0.76, H * 0.72, { fonte: CURSIVA, peso: 400, estilo: 'italic', larg: W * 0.84 })}
      {[-0.5, -0.2, 0.1].map((a, k) => <path key={k} d={`M${f(W * 0.12)} ${f(H * 0.32)} l${f(Math.cos(a - 1.2) * 2.4)} ${f(Math.sin(a - 1.2) * 2.4)}`} {...L(0.22)} />)}
    </g>;
    case 'numero_ddd': case 'numero_rosto': {
      const t = (p.texto ?? '011').slice(0, 5);
      const fino = id === 'numero_rosto';
      return letra(t, cx, H * 0.82, H * 0.86, { fonte: fino ? "Georgia, 'Times New Roman', serif" : BLOCO, peso: fino ? 400 : 900, larg: Math.min(W * 0.92, t.length * H * 0.55), ...(fino ? {} : { contorno: tinta, borda: 0.2 }) });
    }
    /* ================================================================ rua e periferia: os desenhos */
    case 'coroa_rua': return <g>
      <path d={`M${f(W * 0.08)} ${f(H * 0.86)} L${f(W * 0.04)} ${f(H * 0.22)} L${f(W * 0.3)} ${f(H * 0.52)} L${cx} ${f(H * 0.08)} L${f(W * 0.7)} ${f(H * 0.52)} L${f(W * 0.96)} ${f(H * 0.22)} L${f(W * 0.92)} ${f(H * 0.86)} Z`} fill={cor(OURO)} {...C(0.6)} />
      <path d={`M${f(W * 0.08)} ${f(H * 0.72)} H${f(W * 0.92)}`} {...L(0.45)} />
      {[0.04, 0.5, 0.96].map((x, k) => <circle key={k} cx={f(W * x)} cy={f(k === 1 ? H * 0.08 : H * 0.22)} r={f(H * 0.07)} fill={cor(VERMELHO)} {...C(0.35)} />)}
      {[0.28, 0.5, 0.72].map((x, k) => <circle key={`p${k}`} cx={f(W * x)} cy={f(H * 0.8)} r={f(H * 0.05)} fill={cor(k === 1 ? AZUL : VERDE)} />)}
    </g>;
    case 'mascaras_sorria_chore': {
      const mascara = (x: number, feliz: boolean) => <g transform={`translate(${f(x)} ${f(H * 0.08)})`}>
        <path d={`M0 ${f(H * 0.1)} Q${f(W * 0.21)} ${f(-H * 0.06)} ${f(W * 0.42)} ${f(H * 0.1)} Q${f(W * 0.44)} ${f(H * 0.62)} ${f(W * 0.21)} ${f(H * 0.84)} Q${f(-W * 0.02)} ${f(H * 0.62)} 0 ${f(H * 0.1)} Z`} fill={cor(feliz ? CREME : CINZA3)} {...C(0.55)} />
        <path d={`M${f(W * 0.08)} ${f(H * 0.3)} q${f(W * 0.05)} ${feliz ? -1 : 1} ${f(W * 0.1)} 0 M${f(W * 0.24)} ${f(H * 0.3)} q${f(W * 0.05)} ${feliz ? -1 : 1} ${f(W * 0.1)} 0`} {...L(0.55)} />
        <path d={feliz ? `M${f(W * 0.09)} ${f(H * 0.5)} Q${f(W * 0.21)} ${f(H * 0.68)} ${f(W * 0.33)} ${f(H * 0.5)}` : `M${f(W * 0.1)} ${f(H * 0.62)} Q${f(W * 0.21)} ${f(H * 0.48)} ${f(W * 0.32)} ${f(H * 0.62)}`} {...L(0.6)} />
        {!feliz && <path d={`M${f(W * 0.12)} ${f(H * 0.36)} q-0.5 1.2 0 1.8 q0.5 -0.6 0 -1.8 Z`} fill={tinta} />}
      </g>;
      return <g>{mascara(W * 0.04, true)}{mascara(W * 0.54, false)}</g>;
    }
    case 'sao_jorge': return <g>
      <circle cx={f(W * 0.72)} cy={f(H * 0.22)} r={f(W * 0.2)} fill={cor(CREME)} {...C(0.35)} />
      <path d={`M${f(W * 0.18)} ${f(H * 0.78)} Q${f(W * 0.2)} ${f(H * 0.52)} ${f(W * 0.42)} ${f(H * 0.5)} L${f(W * 0.62)} ${f(H * 0.48)} Q${f(W * 0.78)} ${f(H * 0.38)} ${f(W * 0.82)} ${f(H * 0.46)} L${f(W * 0.72)} ${f(H * 0.56)} L${f(W * 0.7)} ${f(H * 0.8)} M${f(W * 0.3)} ${f(H * 0.56)} L${f(W * 0.26)} ${f(H * 0.82)} M${f(W * 0.56)} ${f(H * 0.56)} L${f(W * 0.6)} ${f(H * 0.8)}`} fill={cor(CINZA3)} {...C(0.55)} />
      <path d={`M${f(W * 0.46)} ${f(H * 0.5)} L${f(W * 0.46)} ${f(H * 0.3)} Q${f(W * 0.52)} ${f(H * 0.24)} ${f(W * 0.56)} ${f(H * 0.32)} L${f(W * 0.56)} ${f(H * 0.48)}`} fill={cor(VERMELHO)} {...C(0.45)} />
      <circle cx={f(W * 0.51)} cy={f(H * 0.22)} r={f(W * 0.05)} fill={cor(CREME)} {...C(0.4)} />
      <path d={`M${f(W * 0.36)} ${f(H * 0.08)} L${f(W * 0.12)} ${f(H * 0.9)}`} {...L(0.55)} />
      <path d={`M${f(W * 0.02)} ${f(H * 0.92)} Q${f(W * 0.1)} ${f(H * 0.78)} ${f(W * 0.2)} ${f(H * 0.9)} Q${f(W * 0.3)} ${f(H * 0.98)} ${f(W * 0.4)} ${f(H * 0.88)}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(1.1)} strokeLinecap="round" />
      <path d={`M${f(W * 0.05)} ${f(H * 0.86)} l-0.8 -0.6 M${f(W * 0.05)} ${f(H * 0.86)} l-0.2 -1`} {...L(0.3)} />
    </g>;
    case 'santa_manto': return <g>
      {Array.from({ length: 13 }, (_, k) => { const a = Math.PI * (0.05 + (k / 12) * 0.9); return <path key={k} d={`M${f(cx + Math.cos(Math.PI + a) * W * 0.42)} ${f(H * 0.5 + Math.sin(Math.PI + a) * H * 0.46)} L${f(cx + Math.cos(Math.PI + a) * W * 0.5)} ${f(H * 0.5 + Math.sin(Math.PI + a) * H * 0.54)}`} {...L(0.25)} />; })}
      <path d={`M${cx} ${f(H * 0.1)} Q${f(W * 0.82)} ${f(H * 0.16)} ${f(W * 0.86)} ${f(H * 0.94)} L${f(W * 0.14)} ${f(H * 0.94)} Q${f(W * 0.18)} ${f(H * 0.16)} ${cx} ${f(H * 0.1)} Z`} fill={cor(AZUL)} {...C(0.55)} />
      <ellipse cx={cx} cy={f(H * 0.24)} rx={f(W * 0.14)} ry={f(H * 0.07)} fill={cor(CREME)} {...C(0.4)} />
      <path d={`M${f(cx - W * 0.07)} ${f(H * 0.46)} L${cx} ${f(H * 0.38)} L${f(cx + W * 0.07)} ${f(H * 0.46)} L${cx} ${f(H * 0.56)} Z`} fill={cor(CREME)} {...C(0.35)} />
      <path d={`M${f(W * 0.22)} ${f(H * 0.94)} Q${cx} ${f(H * 0.86)} ${f(W * 0.78)} ${f(H * 0.94)}`} fill="none" stroke={cor(OURO)} strokeWidth={s(0.6)} />
    </g>;
    case 'terco_mao': return <g>
      {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return <circle key={k} cx={f(cx + Math.cos(a) * W * 0.36)} cy={f(H * 0.36 + Math.sin(a) * H * 0.26)} r={f(W * 0.05)} fill={tinta} />; })}
      <path d={`M${cx} ${f(H * 0.62)} V${f(H * 0.72)}`} {...L(0.3)} />
      <path d={`M${cx} ${f(H * 0.72)} V${f(H * 0.98)} M${f(cx - W * 0.12)} ${f(H * 0.8)} H${f(cx + W * 0.12)}`} {...L(0.55)} />
    </g>;
    case 'pipa_laje': return <g>
      <path d={`M${cx} ${f(H * 0.02)} L${f(W * 0.96)} ${f(H * 0.3)} L${cx} ${f(H * 0.66)} L${f(W * 0.04)} ${f(H * 0.3)} Z`} fill={cor(VERMELHO)} {...C(0.5)} />
      <path d={`M${cx} ${f(H * 0.02)} V${f(H * 0.66)} M${f(W * 0.04)} ${f(H * 0.3)} H${f(W * 0.96)}`} {...L(0.3)} />
      <path d={`M${cx} ${f(H * 0.02)} L${f(W * 0.96)} ${f(H * 0.3)} L${cx} ${f(H * 0.3)} Z`} fill={cor(AMARELO)} opacity={0.9} />
      <path d={`M${cx} ${f(H * 0.66)} Q${f(W * 0.2)} ${f(H * 0.76)} ${f(W * 0.5)} ${f(H * 0.84)} T${f(W * 0.4)} ${f(H * 0.99)}`} {...L(0.25)} />
      {[0.76, 0.86, 0.95].map((y, k) => <path key={k} d={`M${f(W * (0.36 + (k % 2) * 0.14))} ${f(H * y)} l1 -0.4 l-0.2 0.9 Z`} fill={cor(k % 2 ? AZUL : VERDE)} />)}
    </g>;
    case 'favela_morro': return <g>
      <circle cx={f(W * 0.78)} cy={f(H * 0.34)} r={f(H * 0.22)} fill={cor(LARANJA)} opacity={0.85} />
      <path d={`M0 ${H} L0 ${f(H * 0.7)} Q${f(W * 0.3)} ${f(H * 0.2)} ${f(W * 0.62)} ${f(H * 0.5)} Q${f(W * 0.82)} ${f(H * 0.66)} ${W} ${f(H * 0.64)} V${H} Z`} fill={cor(CINZA3)} opacity={0.5} />
      {[[0.04, 0.62, 0.14], [0.16, 0.5, 0.13], [0.28, 0.4, 0.14], [0.42, 0.46, 0.12], [0.54, 0.56, 0.14], [0.68, 0.66, 0.13], [0.82, 0.7, 0.14], [0.1, 0.8, 0.16], [0.3, 0.68, 0.15], [0.5, 0.78, 0.15], [0.72, 0.84, 0.15]].map(([x, y, w], k) =>
        <g key={k}><rect x={f(W * x)} y={f(H * y)} width={f(W * w)} height={f(H * 0.18)} fill={cor([CREME, ROSA, CELESTE, AMARELO, VERDE][k % 5])} {...C(0.3)} /><rect x={f(W * x + W * w * 0.3)} y={f(H * y + H * 0.06)} width={f(W * w * 0.3)} height={f(H * 0.06)} fill={tinta} /></g>)}
      <rect x={f(W * 0.3)} y={f(H * 0.3)} width={f(W * 0.06)} height={f(H * 0.08)} fill={cor(AZUL)} {...C(0.25)} />
      <path d={`M${f(W * 0.5)} ${f(H * 0.46)} V${f(H * 0.3)} M${f(W * 0.47)} ${f(H * 0.33)} H${f(W * 0.53)}`} {...L(0.25)} />
    </g>;
    case 'moto_grau': return <g>
      <circle cx={f(W * 0.24)} cy={f(H * 0.82)} r={f(H * 0.16)} {...L(0.7)} /><circle cx={f(W * 0.24)} cy={f(H * 0.82)} r={f(H * 0.04)} fill={tinta} />
      <circle cx={f(W * 0.66)} cy={f(H * 0.3)} r={f(H * 0.16)} {...L(0.7)} /><circle cx={f(W * 0.66)} cy={f(H * 0.3)} r={f(H * 0.04)} fill={tinta} />
      <path d={`M${f(W * 0.24)} ${f(H * 0.82)} L${f(W * 0.42)} ${f(H * 0.52)} L${f(W * 0.66)} ${f(H * 0.3)} M${f(W * 0.36)} ${f(H * 0.62)} L${f(W * 0.56)} ${f(H * 0.46)}`} {...L(0.7)} />
      <path d={`M${f(W * 0.4)} ${f(H * 0.5)} Q${f(W * 0.5)} ${f(H * 0.4)} ${f(W * 0.58)} ${f(H * 0.42)} L${f(W * 0.52)} ${f(H * 0.56)} Z`} fill={cor(VERMELHO)} {...C(0.4)} />
      <path d={`M${f(W * 0.46)} ${f(H * 0.46)} L${f(W * 0.4)} ${f(H * 0.22)} L${f(W * 0.52)} ${f(H * 0.18)}`} {...L(0.6)} />
      <circle cx={f(W * 0.38)} cy={f(H * 0.13)} r={f(H * 0.08)} fill={tinta} />
      <path d={`M${f(W * 0.3)} ${f(H * 0.1)} H${f(W * 0.46)}`} {...L(0.5)} />
      <path d={`M${f(W * 0.02)} ${f(H * 0.98)} H${f(W * 0.5)}`} {...L(0.3)} strokeDasharray="1 0.8" />
    </g>;
    case 'bola_varzea': return <g>
      <circle cx={cx} cy={f(H * 0.42)} r={f(H * 0.36)} fill={cor(CREME)} {...C(0.6)} />
      <path d={`M${cx} ${f(H * 0.28)} L${f(cx + 2.4)} ${f(H * 0.4)} L${f(cx + 1.5)} ${f(H * 0.56)} L${f(cx - 1.5)} ${f(H * 0.56)} L${f(cx - 2.4)} ${f(H * 0.4)} Z`} fill={tinta} />
      <path d={`M${cx} ${f(H * 0.28)} V${f(H * 0.08)} M${f(cx + 2.4)} ${f(H * 0.4)} L${f(cx + 5.6)} ${f(H * 0.34)} M${f(cx - 2.4)} ${f(H * 0.4)} L${f(cx - 5.6)} ${f(H * 0.34)} M${f(cx + 1.5)} ${f(H * 0.56)} L${f(cx + 3)} ${f(H * 0.74)} M${f(cx - 1.5)} ${f(H * 0.56)} L${f(cx - 3)} ${f(H * 0.74)}`} {...L(0.35)} />
      <path d={`M${f(W * 0.04)} ${f(H * 0.7)} L${f(W * 0.96)} ${f(H * 0.7)} L${f(W * 0.9)} ${f(H * 0.84)} L${f(W * 0.96)} ${f(H * 0.98)} L${f(W * 0.04)} ${f(H * 0.98)} L${f(W * 0.1)} ${f(H * 0.84)} Z`} fill={cor(VERDE)} {...C(0.4)} />
      {letra('VÁRZEA', cx, H * 0.92, H * 0.2, { fonte: BLOCO, peso: 900, larg: W * 0.66, fill: cor(CREME) })}
    </g>;
    case 'microfone_rap': return <g>
      <ellipse cx={cx} cy={f(H * 0.18)} rx={f(W * 0.3)} ry={f(H * 0.16)} fill={cor(CINZA2)} {...C(0.55)} />
      {[-1, 0, 1].map(k => <path key={k} d={`M${f(cx - W * 0.26)} ${f(H * (0.16 + k * 0.05))} H${f(cx + W * 0.26)}`} {...L(0.2)} />)}
      <path d={`M${f(cx - W * 0.16)} ${f(H * 0.32)} L${f(cx - W * 0.1)} ${f(H * 0.66)} L${f(cx + W * 0.1)} ${f(H * 0.66)} L${f(cx + W * 0.16)} ${f(H * 0.32)} Z`} fill={tinta} />
      <path d={`M${cx} ${f(H * 0.66)} Q${f(W * 0.9)} ${f(H * 0.76)} ${f(W * 0.4)} ${f(H * 0.86)} T${f(W * 0.7)} ${f(H * 0.98)}`} {...L(0.35)} />
      <path d={estrela(f(W * 0.14), f(H * 0.8), f(W * 0.12))} fill={cor(OURO)} {...C(0.25)} />
    </g>;
    case 'lata_spray': return <g>
      <circle cx={f(W * 0.66)} cy={f(H * 0.16)} r={f(W * 0.18)} fill={cor(ROSA)} opacity={0.75} /><circle cx={f(W * 0.86)} cy={f(H * 0.24)} r={f(W * 0.12)} fill={cor(CELESTE)} opacity={0.75} /><circle cx={f(W * 0.74)} cy={f(H * 0.32)} r={f(W * 0.1)} fill={cor(AMARELO)} opacity={0.75} />
      <rect x={f(W * 0.16)} y={f(H * 0.34)} width={f(W * 0.44)} height={f(H * 0.6)} rx={f(W * 0.08)} fill={cor(VERMELHO)} {...C(0.55)} />
      <path d={`M${f(W * 0.24)} ${f(H * 0.34)} Q${f(W * 0.38)} ${f(H * 0.22)} ${f(W * 0.52)} ${f(H * 0.34)}`} fill={cor(CINZA3)} {...C(0.45)} />
      <rect x={f(W * 0.34)} y={f(H * 0.18)} width={f(W * 0.08)} height={f(H * 0.08)} fill={tinta} />
      <path d={`M${f(W * 0.16)} ${f(H * 0.56)} H${f(W * 0.6)}`} {...L(0.3)} />
      <path d={`M${f(W * 0.48)} ${f(H * 0.94)} q0 0.6 0.4 1.2`} {...L(0.4)} />
    </g>;
    case 'caveira_bandana': return <g>
      <path d={`M${cx} ${f(H * 0.04)} C${f(W * 0.94)} ${f(H * 0.04)} ${f(W * 0.98)} ${f(H * 0.5)} ${f(W * 0.8)} ${f(H * 0.62)} L${f(W * 0.2)} ${f(H * 0.62)} C${f(W * 0.02)} ${f(H * 0.5)} ${f(W * 0.06)} ${f(H * 0.04)} ${cx} ${f(H * 0.04)} Z`} fill={cor(CREME)} {...C(0.6)} />
      <ellipse cx={f(W * 0.32)} cy={f(H * 0.36)} rx={f(W * 0.12)} ry={f(H * 0.1)} fill={tinta} /><ellipse cx={f(W * 0.68)} cy={f(H * 0.36)} rx={f(W * 0.12)} ry={f(H * 0.1)} fill={tinta} />
      <path d={`M${f(W * 0.08)} ${f(H * 0.5)} Q${cx} ${f(H * 0.44)} ${f(W * 0.92)} ${f(H * 0.5)} L${f(W * 0.82)} ${f(H * 0.92)} Q${cx} ${f(H * 1.0)} ${f(W * 0.18)} ${f(H * 0.92)} Z`} fill={cor(VERMELHO)} {...C(0.55)} />
      {[[0.3, 0.66], [0.5, 0.74], [0.7, 0.66], [0.4, 0.84], [0.6, 0.84]].map(([x, y], k) => <circle key={k} cx={f(W * x)} cy={f(H * y)} r={f(W * 0.035)} fill={cor(CREME)} />)}
      <path d={`M${f(W * 0.92)} ${f(H * 0.5)} l1.4 1.4 M${f(W * 0.92)} ${f(H * 0.5)} l1.8 0.2`} {...L(0.4)} />
    </g>;
    case 'amor_de_mae': return <g>
      <path d={`M${cx} ${f(H * 0.9)} C${f(W * 0.02)} ${f(H * 0.52)} ${f(W * 0.08)} ${f(H * 0.06)} ${cx} ${f(H * 0.28)} C${f(W * 0.92)} ${f(H * 0.06)} ${f(W * 0.98)} ${f(H * 0.52)} ${cx} ${f(H * 0.9)} Z`} fill={cor(VERMELHO)} {...C(0.6)} />
      {[0.12, 0.88].map((x, k) => <g key={k}><circle cx={f(W * x)} cy={f(H * 0.66)} r={f(H * 0.13)} fill={cor(ROSA)} {...C(0.4)} /><path d={`M${f(W * x - 1)} ${f(H * 0.66)} q1 -1.2 2 0`} {...L(0.25)} /><path d={`M${f(W * x)} ${f(H * 0.78)} q${k ? 1.4 : -1.4} 0.4 ${k ? 2 : -2} 1.6`} fill={cor(VERDE)} /></g>)}
      <path d={`M${f(W * 0.06)} ${f(H * 0.42)} L${f(W * 0.94)} ${f(H * 0.42)} L${f(W * 0.88)} ${f(H * 0.54)} L${f(W * 0.94)} ${f(H * 0.66)} L${f(W * 0.06)} ${f(H * 0.66)} L${f(W * 0.12)} ${f(H * 0.54)} Z`} fill={cor(CREME)} {...C(0.45)} />
      {letra('MÃE', cx, H * 0.62, H * 0.2, { fonte: BLOCO, peso: 900, larg: W * 0.4 })}
    </g>;
    case 'pomba_ramo': return <g>
      <path d={`M${f(W * 0.2)} ${f(H * 0.56)} Q${f(W * 0.46)} ${f(H * 0.36)} ${f(W * 0.74)} ${f(H * 0.44)} Q${f(W * 0.86)} ${f(H * 0.4)} ${f(W * 0.94)} ${f(H * 0.46)} L${f(W * 0.84)} ${f(H * 0.52)} Q${f(W * 0.66)} ${f(H * 0.74)} ${f(W * 0.36)} ${f(H * 0.7)} L${f(W * 0.06)} ${f(H * 0.84)} Z`} fill={cor(CREME)} {...C(0.55)} />
      <path d={`M${f(W * 0.42)} ${f(H * 0.5)} Q${f(W * 0.3)} ${f(H * 0.06)} ${f(W * 0.62)} ${f(H * 0.08)} Q${f(W * 0.6)} ${f(H * 0.34)} ${f(W * 0.56)} ${f(H * 0.46)}`} fill={cor(CREME)} {...C(0.5)} />
      <circle cx={f(W * 0.84)} cy={f(H * 0.44)} r={0.35} fill={tinta} />
      <path d={`M${f(W * 0.94)} ${f(H * 0.48)} Q${f(W * 1.0)} ${f(H * 0.66)} ${f(W * 0.9)} ${f(H * 0.84)}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.45)} />
      {[0.58, 0.68, 0.78].map((y, k) => <ellipse key={k} cx={f(W * (0.93 + (k % 2 ? -0.03 : 0.02)))} cy={f(H * y)} rx={0.6} ry={0.3} fill={cor(VERDE)} />)}
    </g>;
    case 'correntes_partidas': {
      const elo = (x: number, y: number, a: number) => <rect x={f(x - W * 0.12)} y={f(y - H * 0.18)} width={f(W * 0.24)} height={f(H * 0.36)} rx={f(H * 0.16)} {...L(0.8)} transform={`rotate(${a} ${f(x)} ${f(y)})`} />;
      return <g>{elo(W * 0.16, H * 0.5, -20)}{elo(W * 0.34, H * 0.44, 70)}
        <path d={`M${f(W * 0.48)} ${f(H * 0.3)} l0.8 -1.2 M${f(W * 0.5)} ${f(H * 0.56)} l1.2 0.6 M${f(W * 0.46)} ${f(H * 0.5)} l0.4 1.2`} {...L(0.3)} />
        {elo(W * 0.66, H * 0.5, 64)}{elo(W * 0.84, H * 0.54, -16)}</g>;
    }
    case 'estrela_nautica': {
      const n = 5, R = Math.min(W, H) * 0.46, r = R * 0.42;
      const pontas = Array.from({ length: n }, (_, k) => { const a = -Math.PI / 2 + (k * 2 * Math.PI) / n, b = a + Math.PI / n; return { a, b }; });
      return <g>{pontas.map(({ a, b }, k) => {
        const P = [cx + Math.cos(a) * R, cy + Math.sin(a) * R], Q = [cx + Math.cos(b) * r, cy + Math.sin(b) * r], Q0 = [cx + Math.cos(a - Math.PI / n) * r, cy + Math.sin(a - Math.PI / n) * r];
        return <g key={k}><path d={`M${f(cx)} ${f(cy)} L${f(Q0[0])} ${f(Q0[1])} L${f(P[0])} ${f(P[1])} Z`} fill={cor(VERMELHO)} {...C(0.35)} /><path d={`M${f(cx)} ${f(cy)} L${f(P[0])} ${f(P[1])} L${f(Q[0])} ${f(Q[1])} Z`} fill={tinta} {...C(0.35)} /></g>;
      })}</g>;
    }
    /* ================================================================ tradição de cadeia */
    case 'lagrima': case 'lagrima_cheia': return <path d={`M${cx} ${f(H * 0.04)} C${f(W * 0.92)} ${f(H * 0.52)} ${f(W * 0.96)} ${f(H * 0.96)} ${cx} ${f(H * 0.96)} C${f(W * 0.04)} ${f(H * 0.96)} ${f(W * 0.08)} ${f(H * 0.52)} ${cx} ${f(H * 0.04)} Z`} {...(id === 'lagrima_cheia' ? { fill: tinta } : L(1.6))} />;
    case 'tres_pontos': return <g fill={tinta}><circle cx={cx} cy={f(H * 0.26)} r={f(H * 0.13)} /><circle cx={f(W * 0.24)} cy={f(H * 0.72)} r={f(H * 0.13)} /><circle cx={f(W * 0.76)} cy={f(H * 0.72)} r={f(H * 0.13)} /></g>;
    case 'cinco_pontos': return <g fill={tinta}>{[[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8], [0.5, 0.5]].map(([x, y], k) => <circle key={k} cx={f(W * x)} cy={f(H * y)} r={f(H * 0.11)} />)}</g>;
    case 'teia_aranha': return <g>
      {Array.from({ length: 6 }, (_, k) => { const a = (k / 5) * (Math.PI / 2); return <path key={k} d={`M${f(W * 0.02)} ${f(H * 0.98)} L${f(W * 0.02 + Math.cos(-a) * W * 0.96)} ${f(H * 0.98 + Math.sin(-a) * H * 0.96)}`} {...L(0.45)} />; })}
      {[0.28, 0.5, 0.72, 0.94].map((q, j) => <path key={j} d={Array.from({ length: 6 }, (_, k) => { const a = (k / 5) * (Math.PI / 2); const x = W * 0.02 + Math.cos(-a) * W * q, y = H * 0.98 + Math.sin(-a) * H * q; return `${k ? 'Q' + f(W * 0.02 + Math.cos(-a + 0.16) * W * q * 0.86) + ' ' + f(H * 0.98 + Math.sin(-a + 0.16) * H * q * 0.86) + ' ' : 'M'}${f(x)} ${f(y)}`; }).join(' ')} {...L(0.4)} />)}
      <circle cx={f(W * 0.62)} cy={f(H * 0.5)} r={f(H * 0.06)} fill={tinta} /><path d={`M${f(W * 0.62)} ${f(H * 0.44)} V${f(H * 0.2)}`} {...L(0.2)} />
    </g>;
    case 'relogio_sem_ponteiros': return <g>
      <circle cx={cx} cy={f(H * 0.56)} r={f(H * 0.4)} fill={cor(CREME)} {...C(0.7)} />
      <circle cx={cx} cy={f(H * 0.56)} r={f(H * 0.33)} {...L(0.3)} />
      {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; const r0 = H * (k % 3 ? 0.29 : 0.26); return <path key={k} d={`M${f(cx + Math.cos(a) * r0)} ${f(H * 0.56 + Math.sin(a) * r0)} L${f(cx + Math.cos(a) * H * 0.32)} ${f(H * 0.56 + Math.sin(a) * H * 0.32)}`} {...L(k % 3 ? 0.25 : 0.5)} />; })}
      <circle cx={cx} cy={f(H * 0.56)} r={f(H * 0.03)} fill={tinta} />
      <path d={`M${f(cx - 1)} ${f(H * 0.16)} Q${cx} ${f(H * 0.02)} ${f(cx + 1)} ${f(H * 0.16)} M${cx} ${f(H * 0.08)} V${f(H * 0.16)}`} {...L(0.5)} />
      <path d={`M${f(cx + H * 0.14)} ${f(H * 0.7)} l0.6 0.3 l-0.3 0.5`} {...L(0.2)} opacity={0.6} />
    </g>;
    case 'arame_farpado': return <g>
      <path d={`M0 ${f(H * 0.42)} Q${f(W * 0.125)} ${f(H * 0.2)} ${f(W * 0.25)} ${f(H * 0.42)} T${f(W * 0.5)} ${f(H * 0.42)} T${f(W * 0.75)} ${f(H * 0.42)} T${W} ${f(H * 0.42)}`} {...L(0.45)} />
      <path d={`M0 ${f(H * 0.58)} Q${f(W * 0.125)} ${f(H * 0.8)} ${f(W * 0.25)} ${f(H * 0.58)} T${f(W * 0.5)} ${f(H * 0.58)} T${f(W * 0.75)} ${f(H * 0.58)} T${W} ${f(H * 0.58)}`} {...L(0.45)} />
      {Array.from({ length: 8 }, (_, k) => { const x = W * (0.0625 + k * 0.125); return <path key={k} d={`M${f(x - 0.9)} ${f(H * 0.18)} L${f(x + 0.9)} ${f(H * 0.82)} M${f(x + 0.9)} ${f(H * 0.18)} L${f(x - 0.9)} ${f(H * 0.82)}`} {...L(0.35)} />; })}
    </g>;
    case 'estrela_oito_pontas': return <g>
      <path d={estrela(cx, cy, Math.min(W, H) * 0.47, 8, Math.min(W, H) * 0.2)} fill={cor(CINZA3)} {...C(0.5)} />
      {Array.from({ length: 8 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 4; const R = Math.min(W, H) * 0.47, r = Math.min(W, H) * 0.2; return <path key={k} d={`M${cx} ${cy} L${f(cx + Math.cos(a) * R)} ${f(cy + Math.sin(a) * R)} L${f(cx + Math.cos(a + Math.PI / 8) * r)} ${f(cy + Math.sin(a + Math.PI / 8) * r)} Z`} fill={tinta} />; })}
      <circle cx={cx} cy={cy} r={Math.min(W, H) * 0.08} fill={cor(CREME)} {...C(0.3)} />
    </g>;
    case 'janela_grade': return <g>
      <rect x={f(W * 0.06)} y={f(H * 0.06)} width={f(W * 0.88)} height={f(H * 0.88)} rx={0.6} fill={cor(CELESTE)} opacity={0.35} />
      <circle cx={f(W * 0.72)} cy={f(H * 0.3)} r={f(W * 0.14)} fill={cor(AMARELO)} opacity={0.9} />
      <path d={`M${f(W * 0.26)} ${f(H * 0.3)} q0.8 -0.6 1.6 0 q0.8 -0.6 1.6 0`} {...L(0.3)} />
      <rect x={f(W * 0.06)} y={f(H * 0.06)} width={f(W * 0.88)} height={f(H * 0.88)} rx={0.6} {...L(0.9)} />
      {[0.28, 0.5, 0.72].map((x, k) => <path key={k} d={`M${f(W * x)} ${f(H * 0.06)} V${f(H * 0.94)}`} {...L(0.7)} />)}
      <path d={`M${f(W * 0.06)} ${f(H * 0.5)} H${f(W * 0.94)}`} {...L(0.5)} />
    </g>;
    case 'riscos_dias': return <g>
      {[0, 1, 2].map(g => <g key={g}>{[0, 1, 2, 3].map(k => <path key={k} d={`M${f(W * (0.06 + g * 0.32 + k * 0.055))} ${f(H * 0.12)} V${f(H * 0.88)}`} {...L(0.55)} />)}<path d={`M${f(W * (0.03 + g * 0.32))} ${f(H * 0.8)} L${f(W * (0.26 + g * 0.32))} ${f(H * 0.2)}`} {...L(0.55)} /></g>)}
    </g>;
    case 'letra_liberdade': return <g>
      {letra('Liberdade', W * 0.46, H * 0.8, H * 0.78, { fonte: GOTICA, peso: 900, larg: W * 0.82 })}
      <path d={`M${f(W * 0.9)} ${f(H * 0.24)} q0.8 -0.7 1.6 -0.2 q-0.6 0.2 -0.8 0.8 q-0.4 -0.4 -0.8 -0.6 Z`} fill={tinta} />
    </g>;
    /* ================================================================ o rosto */
    case 'estrela_rosto': return <path d={estrela(cx, cy * 1.04, Math.min(W, H) * 0.48)} fill={tinta} />;
    case 'cruz_rosto': return <path d={`M${cx} ${f(H * 0.04)} V${f(H * 0.96)} M${f(W * 0.12)} ${f(H * 0.32)} H${f(W * 0.88)}`} {...L(2.2)} strokeLinecap="square" />;
    case 'coracao_rosto': return <path d={`M${cx} ${f(H * 0.9)} C${f(W * 0.02)} ${f(H * 0.5)} ${f(W * 0.1)} ${f(H * 0.08)} ${cx} ${f(H * 0.3)} C${f(W * 0.9)} ${f(H * 0.08)} ${f(W * 0.98)} ${f(H * 0.5)} ${cx} ${f(H * 0.9)} Z`} fill={tinta} />;
    case 'frase_testa': {
      const t = p.texto ?? 'Fé';
      return letra(t, cx, H * 0.84, H * 0.9, { fonte: GOTICA, peso: 900, larg: Math.min(W * 0.96, t.length * H * 0.62) });
    }
  }
  void MARROM; void CINZA1;
  return undefined;
}
