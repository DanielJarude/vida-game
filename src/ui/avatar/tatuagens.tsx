/**
 * HOTFIX 11.5.1 — O DESENHO DE CADA TATUAGEM. VIDA 12.6 — o catálogo inteiro (treze estilos), cada desenho na sua
 * CAIXA NATIVA: o lado maior mede 20 e o outro segue a proporção do desenho (`caixaNativa`) — a figura escala sem
 * deformar. A linguagem é a do VIDA (traço e cor chapada), com o que torna cada estilo reconhecível na pele: o contorno
 * grosso e a cor primária do old school; o preto sólido e o espaço negativo do blackwork; o volume em cinza do
 * realismo (camadas de tom, não fotografia); a gravura do oriental; a agulha única do fine line; a simetria da
 * geometria; a letra de verdade no lettering (o texto do jogador); a renda e as contas do ornamental; a mancha da
 * aquarela. `tinta` é o preto já sob a pele; `cor` leva cada cor à tinta escolhida (colorida, cinza ou só preto).
 *
 * Referências: flash sheets do tradicional americano (Sailor Jerry), gravuras ukiyo-e (a onda, as carpas, as nuvens
 * em espiral), o realismo black & grey de estúdio, o lettering de script e de blackletter, a renda e o pingente do
 * ornamental feminino, o koru maori — sempre reinterpretados no traço chapado do jogo.
 */
import type { ReactNode } from 'react';
import { desenhoDeTatuagem, type DesenhoDeTatuagem } from '../../motor/dados/tatuagens';
import { desenho129 } from './tatuagens129';
import { desenho13 } from './tatuagens13';
import { desenho17 } from './tatuagens17';

type Cor = (hex: string) => string;

const VERMELHO = '#b8332e', VERDE = '#3f7a45', AMARELO = '#d9a520', AZUL = '#2f5e8a', LARANJA = '#d8742a', ROSA = '#d36a8a', MARROM = '#6b4a2a', CREME = '#efe2c4', ROXO = '#6b4f8f', TURQUESA = '#2f8f8a';
const CINZA1 = '#4a4f55', CINZA2 = '#7d838a', CINZA3 = '#b3b8bd', BRANCO = '#f2ede0';

/** Os desenhos do 11.5.1 que foram feitos numa caixa 20 × 20 e esticados para a proporção (continuam iguais). */
const ESTICADOS = new Set(['adaga', 'linha_continua', 'ramos', 'carpa', 'bracadeira', 'tribal_faixa', 'simbolo_infinito']);

/** A caixa do desenho: o lado maior é 20; o outro segue a proporção. */
export function caixaNativa(d: Pick<DesenhoDeTatuagem, 'proporcao' | 'tamanho'>): [number, number] {
  const p = d.proporcao ?? 1;
  return p >= 1 ? [20, 20 / p] : [20 * p, 20];
}

const TEXTO_PADRAO: Record<string, string> = { nome: 'Maria', data: 'XII·IV·MMX', frase: 'Respira', iniciais: 'A·M', coordenadas: '23°33′S 46°38′O', numero: '011' };

/** O desenho na caixa nativa. `texto` é o do jogador (lettering); `espelhado` desvira a letra (a letra nunca fica ao contrário). */
export function DesenhoDaTatuagem({ id, tinta, cor, traco = 1, texto, espelhado }: { id: string; tinta: string; cor: Cor; traco?: number; texto?: string; espelhado?: boolean }): ReactNode {
  const d = desenhoDeTatuagem(id);
  const [W, H] = d ? caixaNativa(d) : [20, 20];
  const conteudo = desenho(id, tinta, cor, traco, W, H, texto ?? (d?.texto ? TEXTO_PADRAO[d.texto] : undefined), espelhado);
  if (ESTICADOS.has(id) && (W !== 20 || H !== 20)) return <g transform={`scale(${W / 20} ${H / 20})`}>{conteudo}</g>;
  return conteudo;
}

function desenho(id: string, tinta: string, cor: Cor, traco: number, W: number, H: number, texto: string | undefined, espelhado?: boolean): ReactNode {
  const s = (w: number) => w * traco;
  const L = { fill: 'none', stroke: tinta, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  // A letra: ocupa a caixa (o comprimento ajusta à largura) e nunca aparece espelhada.
  const letra = (t: string, fonte: string, peso: number, y: number, tam: number, extra: Record<string, unknown> = {}) => (
    <g transform={espelhado ? `translate(${W} 0) scale(-1 1)` : undefined}>
      <text x={W / 2} y={y} textAnchor="middle" fontSize={tam} fontFamily={fonte} fontWeight={peso} fill={tinta} textLength={Math.min(W - 1, Math.max(4, t.length * tam * 0.55))} lengthAdjust="spacingAndGlyphs" {...extra}>{t}</text>
    </g>
  );
  switch (id) {
    /* ---------------------------------------------------------------- realista (preto e cinza, volume) */
    case 'leao_realista': return <g>
      <path d="M10 1.2 C14 1 18.6 4.6 18.4 9.6 C18.2 14.6 14.6 18.8 10 18.8 C5.4 18.8 1.8 14.6 1.6 9.6 C1.4 4.6 6 1 10 1.2 Z" fill={cor(CINZA1)} />
      {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return <path key={k} d={`M${10 + Math.cos(a) * 5.4} ${10.4 + Math.sin(a) * 5.6} L${10 + Math.cos(a + 0.12) * 8.6} ${10.4 + Math.sin(a + 0.12) * 8.6}`} stroke={cor(CINZA2)} strokeWidth={s(0.7)} strokeLinecap="round" />; })}
      <path d="M10 4.2 C13.4 4.2 15 7 14.8 10.4 C14.6 13.6 12.6 16.2 10 16.2 C7.4 16.2 5.4 13.6 5.2 10.4 C5 7 6.6 4.2 10 4.2 Z" fill={cor(CINZA3)} />
      <path d="M7.4 9 Q8.2 8.2 9 9 M11 9 Q11.8 8.2 12.6 9" {...L} strokeWidth={s(0.7)} />
      <circle cx={8.2} cy={9.2} r={0.45} fill={tinta} /><circle cx={11.8} cy={9.2} r={0.45} fill={tinta} />
      <path d="M8.6 11.6 L11.4 11.6 L10 13 Z" fill={tinta} /><path d="M10 13 V14 M8.4 14.6 Q10 15.4 11.6 14.6" {...L} strokeWidth={s(0.5)} />
      <path d="M6 7 Q8 6 9.2 7.4 M14 7 Q12 6 10.8 7.4" {...L} strokeWidth={s(0.4)} opacity={0.6} />
    </g>;
    case 'lobo_realista': return <g>
      <path d="M3 16 L5 7 L4.4 2.4 L8 5.2 Q11 4.4 13.6 5.8 L18.4 9.4 Q19 10.6 17.6 11 L13.8 11.4 Q12.4 14 9 17.6 Z" fill={cor(CINZA2)} />
      <path d="M5 7 L4.4 2.4 L8 5.2 Z" fill={cor(CINZA1)} /><path d="M13.6 5.8 L18.4 9.4 Q19 10.6 17.6 11 L13.8 11.4 Q12 9 13.6 5.8 Z" fill={cor(CINZA3)} />
      <circle cx={18.2} cy={9.8} r={0.7} fill={tinta} /><path d="M11 7.4 Q12 7 12.6 7.8" {...L} strokeWidth={s(0.6)} /><circle cx={11.9} cy={7.6} r={0.35} fill={tinta} />
      {[0, 1, 2, 3].map(k => <path key={k} d={`M${5 + k * 1.4} ${11 + k * 0.8} q1.2 1.4 0.6 3`} {...L} strokeWidth={s(0.4)} opacity={0.7} />)}
      <path d="M3 16 L5 7 L4.4 2.4 L8 5.2 Q11 4.4 13.6 5.8 L18.4 9.4 Q19 10.6 17.6 11 L13.8 11.4 Q12.4 14 9 17.6 Z" {...L} strokeWidth={s(0.5)} />
    </g>;
    case 'olho_realista': return <g>
      <path d={`M1 ${H / 2} Q10 ${-H * 0.15} 19 ${H / 2} Q10 ${H * 1.05} 1 ${H / 2} Z`} fill={cor(BRANCO)} stroke={tinta} strokeWidth={s(0.8)} />
      <circle cx={10} cy={H / 2} r={H * 0.32} fill={cor(CINZA2)} /><circle cx={10} cy={H / 2} r={H * 0.15} fill={tinta} /><circle cx={11.2} cy={H / 2 - 1.2} r={0.7} fill={cor(BRANCO)} />
      {[3, 5.5, 8, 10.5, 13, 15.5].map((x, k) => <path key={k} d={`M${x} ${H * 0.2 + Math.abs(10 - x) * 0.08} l${(x - 10) * 0.08} -1.6`} {...L} strokeWidth={s(0.45)} />)}
      <path d={`M2.4 ${H * 0.72} Q10 ${H * 0.98} 17.6 ${H * 0.72}`} stroke={cor(CINZA3)} strokeWidth={s(1.2)} fill="none" opacity={0.7} />
    </g>;
    case 'relogio_rosa': return <g>
      <circle cx={11.5} cy={8} r={7} fill={cor(CINZA3)} stroke={tinta} strokeWidth={s(0.9)} /><circle cx={11.5} cy={8} r={5.6} fill={cor(BRANCO)} stroke={tinta} strokeWidth={s(0.4)} />
      {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <path key={k} d={`M${11.5 + Math.cos(a) * 4.6} ${8 + Math.sin(a) * 4.6} L${11.5 + Math.cos(a) * 5.3} ${8 + Math.sin(a) * 5.3}`} stroke={tinta} strokeWidth={s(k % 3 ? 0.3 : 0.6)} />; })}
      <path d="M11.5 8 L11.5 4.4 M11.5 8 L14 9.4" {...L} strokeWidth={s(0.6)} /><circle cx={11.5} cy={0.6} r={0.9} fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.4)} />
      <path d="M2 17 Q2.4 12 6 12.2 Q9.4 12.6 8.6 16 Q7.6 19.4 4.4 19 Q1.8 18.6 2 17 Z" fill={cor(CINZA1)} stroke={tinta} strokeWidth={s(0.6)} />
      <path d="M4 16 Q5 13.6 7 14.6 Q7.4 16.6 5.2 17" {...L} strokeWidth={s(0.45)} stroke={cor(CINZA3)} /><path d="M8.4 17 Q11 18 13 16.4 Q11.4 19.4 8.4 17 Z" fill={cor(CINZA2)} />
    </g>;
    case 'rosa_realista': return <g>
      <path d="M10 15.4 L10.4 19.6" {...L} strokeWidth={s(0.7)} /><path d="M10.2 17.6 Q13.6 16.2 15 18 Q12.6 19.6 10.2 17.6 Z M10.2 16.8 Q7 15.6 5.6 17.2 Q8 18.8 10.2 16.8 Z" fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.4)} />
      <path d="M3.6 9 Q3 14.6 10 15.6 Q17 14.6 16.4 9 Q14 12.4 10 12.6 Q6 12.4 3.6 9 Z" fill={cor(CINZA1)} stroke={tinta} strokeWidth={s(0.5)} />
      <path d="M4.4 7.4 Q4.4 3.4 8.6 4 Q10 6.6 9.6 10.4 Q5.6 10.6 4.4 7.4 Z" fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.5)} />
      <path d="M15.6 7.4 Q15.6 3.4 11.4 4 Q10 6.6 10.4 10.4 Q14.4 10.6 15.6 7.4 Z" fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.5)} />
      <path d="M7.4 6.4 Q10 2.2 12.6 6.4 Q12.8 9.6 10 10 Q7.2 9.6 7.4 6.4 Z" fill={cor(CINZA3)} stroke={tinta} strokeWidth={s(0.5)} />
      <path d="M8.6 6.6 Q10 5 11.4 6.8 Q11 8.4 9.8 8.2" {...L} strokeWidth={s(0.45)} /><path d="M5 12 Q7.6 13.8 10 13.6 M15 12 Q12.4 13.8 10 13.6" {...L} strokeWidth={s(0.35)} opacity={0.6} />
    </g>;
    case 'bussola': return <g>
      <circle cx={10} cy={10} r={9} fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.9)} /><circle cx={10} cy={10} r={7.4} fill={cor(BRANCO)} stroke={tinta} strokeWidth={s(0.4)} />
      <path d="M10 3 L11.3 10 L10 17 L8.7 10 Z" fill={cor(CINZA1)} /><path d="M3 10 L10 8.7 L17 10 L10 11.3 Z" fill={cor(CINZA3)} stroke={tinta} strokeWidth={s(0.3)} />
      <path d="M10 3 L11.3 10 L8.7 10 Z" fill={tinta} /><path d="M5.2 5.2 L10.8 9.2 M14.8 14.8 L9.2 10.8 M14.8 5.2 L10.8 10.8 M5.2 14.8 L9.2 9.2" {...L} strokeWidth={s(0.3)} />
      <circle cx={10} cy={10} r={0.8} fill={tinta} />
    </g>;
    case 'caveira': return <g stroke={tinta} strokeWidth={s(0.8)}><path d="M4 9 Q4 3 10 3 Q16 3 16 9 Q16 12 13.5 13 L13.5 16 L6.5 16 L6.5 13 Q4 12 4 9 Z" fill={cor('#9aa0a6')} /><path d="M5 9 Q5.6 5 10 4.2" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.7)} opacity={0.6} /><circle cx={7.6} cy={9} r={1.6} fill={tinta} /><circle cx={12.4} cy={9} r={1.6} fill={tinta} /><path d="M10 11 L9.2 12.4 H10.8 Z" fill={tinta} /><path d="M8 16 V14 M10 16 V14 M12 16 V14" fill="none" /></g>;
    case 'maos_rezando': { const c = W / 2; return <g>
      <path d={`M${c} 1.6 Q${c - 1.2} 1.2 ${c - 1.8} 3 L${c - 3.6} 10 Q${c - 4.8} 11 ${c - 5} 13.4 Q${c - 4.6} 16.6 ${c - 2.4} 17.6 L${c} 17.6 Z`} fill={cor(CINZA3)} stroke={tinta} strokeWidth={s(0.6)} />
      <path d={`M${c} 1.6 Q${c + 1.2} 1.2 ${c + 1.8} 3 L${c + 3.6} 10 Q${c + 4.8} 11 ${c + 5} 13.4 Q${c + 4.6} 16.6 ${c + 2.4} 17.6 L${c} 17.6 Z`} fill={cor(CINZA2)} stroke={tinta} strokeWidth={s(0.6)} />
      <path d={`M${c - 3.4} 9.6 Q${c - 2.2} 8.4 ${c - 1.4} 10.6 M${c + 3.4} 9.6 Q${c + 2.2} 8.4 ${c + 1.4} 10.6`} {...L} strokeWidth={s(0.45)} />
      {[3.6, 5.6, 7.6].map(y => <path key={y} d={`M${c - 1.6 - (y - 3) * 0.3} ${y} h1.2 M${c + 0.4 + (y - 3) * 0.3} ${y} h1.2`} {...L} strokeWidth={s(0.3)} opacity={0.7} />)}
      <path d={`M${c - 2.4} 17.6 L${c - 2.8} 20 M${c + 2.4} 17.6 L${c + 2.8} 20`} {...L} strokeWidth={s(0.5)} />
      {Array.from({ length: 8 }, (_, k) => <circle key={k} cx={c - 3 + Math.sin(k * 0.55) * 1.2 - k * 0.15} cy={11.4 + k * 1.05} r={0.4} fill={tinta} />)}
      <path d={`M${c - 4.4} 19.2 v1.4 M${c - 5} 19.7 h1.2`} {...L} strokeWidth={s(0.4)} />
    </g>; }

    /* ---------------------------------------------------------------- old school */
    case 'andorinha': return <g><path d="M3 9 Q8 6 12 8 L18 4 L15 9 L19 11 L13 11 Q9 15 4 12 Q6 11 3 9 Z" fill={cor(AZUL)} stroke={tinta} strokeWidth={s(1.1)} strokeLinejoin="round" /><path d="M6 11 Q8 13 10 11.5" fill={cor(VERMELHO)} stroke={tinta} strokeWidth={s(0.6)} /><circle cx={5.4} cy={9.4} r={0.6} fill={tinta} /></g>;
    case 'ancora': return <g {...L} strokeWidth={s(1.6)}><circle cx={10} cy={3.5} r={1.8} /><path d="M10 5.3 V17 M6 8 H14 M4 12 Q5 17 10 17 Q15 17 16 12 M4 12 L3 14 M16 12 L17 14" /></g>;
    case 'rosa_tradicional': return <g><path d="M10 3 Q15 3 15 8 Q15 13 10 13 Q5 13 5 8 Q5 3 10 3 Z" fill={cor(VERMELHO)} stroke={tinta} strokeWidth={s(1.2)} /><path d="M8 6 Q10 4.5 12 6 Q12.5 9 10 9.5 Q8 9 8.5 7.5" {...L} strokeWidth={s(0.8)} /><path d="M6 13 Q3 15 4 18 Q7 17 8 14 Z M14 13 Q17 15 16 18 Q13 17 12 14 Z" fill={cor(VERDE)} stroke={tinta} strokeWidth={s(1)} /></g>;
    case 'coracao_faixa': return <g><path d="M10 17 Q2 11 3.5 6 Q5 2.5 10 6 Q15 2.5 16.5 6 Q18 11 10 17 Z" fill={cor(VERMELHO)} stroke={tinta} strokeWidth={s(1.2)} /><path d="M1 8.6 L19 8.6 L18 12.4 L2 12.4 Z" fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.9)} />{letra(texto ?? 'Mãe', "Georgia, 'Times New Roman', serif", 700, 11.4, 3)}</g>;
    case 'adaga': return <g><path d="M10 1 L12 4 L11.5 12 L8.5 12 L8 4 Z" fill={cor('#c9ccd1')} stroke={tinta} strokeWidth={s(1)} /><path d="M5 12 H15" {...L} strokeWidth={s(1.8)} /><path d="M10 12.5 V17" {...L} strokeWidth={s(2)} /><circle cx={10} cy={18} r={1.2} fill={cor(AMARELO)} stroke={tinta} strokeWidth={s(0.6)} /></g>;
    case 'pantera': return <g><path d="M3 9 Q4 3 10 3 Q16 3 17 9 Q17 15 10 18 Q3 15 3 9 Z" fill={tinta} /><path d="M6 8 L8.5 9 M14 8 L11.5 9" stroke={cor(AMARELO)} strokeWidth={s(1.2)} strokeLinecap="round" /><path d="M7 13 Q10 16 13 13 L12 12 L10 13 L8 12 Z" fill={cor('#f2ede0')} /><path d="M4 4 L6 6 M16 4 L14 6" {...L} strokeWidth={s(1.4)} /></g>;
    case 'navio': return <g>
      <path d="M2 13 L18 13 L15.6 16.4 L4.4 16.4 Z" fill={cor(MARROM)} stroke={tinta} strokeWidth={s(1)} />
      <path d="M7 13 V2.4 M13 13 V4" {...L} strokeWidth={s(0.8)} />
      <path d="M7 3 Q11.6 5.6 7 9.6 Z" fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.8)} /><path d="M7 3 Q2.6 6 7 11.4 Z" fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.8)} /><path d="M13 4.6 Q17 7.4 13 11.4 Z" fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.8)} />
      <path d="M7 2.4 L9.4 1.6 L7 1 Z" fill={cor(VERMELHO)} />
      <path d="M0.6 18.2 Q3 16.6 5.4 18.2 Q7.8 19.8 10.2 18.2 Q12.6 16.6 15 18.2 Q17.4 19.8 19.6 18.2" fill="none" stroke={cor(AZUL)} strokeWidth={s(1.4)} />
    </g>;
    case 'cobra_tradicional': return <g>
      <path d={`M${W * 0.5} 19 Q${W * 0.05} 16 ${W * 0.5} 12.4 Q${W * 0.95} 9 ${W * 0.5} 6.4`} fill="none" stroke={tinta} strokeWidth={s(3.6)} strokeLinecap="round" />
      <path d={`M${W * 0.5} 19 Q${W * 0.05} 16 ${W * 0.5} 12.4 Q${W * 0.95} 9 ${W * 0.5} 6.4`} fill="none" stroke={cor(VERDE)} strokeWidth={s(2.4)} strokeLinecap="round" />
      <path d={`M${W * 0.5} 19 Q${W * 0.05} 16 ${W * 0.5} 12.4 Q${W * 0.95} 9 ${W * 0.5} 6.4`} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.8)} strokeDasharray="0.8 1" />
      <path d={`M${W * 0.5} 6.6 Q${W * 0.1} 4.6 ${W * 0.3} 1.6 Q${W * 0.7} 0.4 ${W * 0.85} 2.8 Q${W * 0.8} 5 ${W * 0.5} 6.6 Z`} fill={cor(VERDE)} stroke={tinta} strokeWidth={s(0.9)} />
      <circle cx={W * 0.55} cy={2.6} r={0.45} fill={tinta} /><path d={`M${W * 0.82} 3.4 l1 1 M${W * 0.82} 3.4 l1.2 0.1`} stroke={cor(VERMELHO)} strokeWidth={s(0.5)} />
    </g>;
    case 'aguia_tradicional': { const y = (f: number) => H * f; const asa = (k: 1 | -1) => `M${10 + k * 1} ${y(0.42)} Q${10 + k * 5} ${y(0.12)} ${10 + k * 9.6} ${y(0.16)} L${10 + k * 8.4} ${y(0.3)} L${10 + k * 9.4} ${y(0.36)} L${10 + k * 7.8} ${y(0.46)} L${10 + k * 8.6} ${y(0.54)} L${10 + k * 6.4} ${y(0.6)} L${10 + k * 6.8} ${y(0.68)} Q${10 + k * 3.6} ${y(0.66)} ${10 + k * 1.4} ${y(0.62)} Z`; return <g>
      <path d={asa(-1)} fill={cor(MARROM)} stroke={tinta} strokeWidth={s(0.8)} strokeLinejoin="round" /><path d={asa(1)} fill={cor(MARROM)} stroke={tinta} strokeWidth={s(0.8)} strokeLinejoin="round" />
      <path d={`M${10 - 6} ${y(0.3)} Q${10 - 3} ${y(0.3)} ${10 - 1.4} ${y(0.5)} M${10 + 6} ${y(0.3)} Q${10 + 3} ${y(0.3)} ${10 + 1.4} ${y(0.5)}`} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.5)} />
      <path d={`M10 ${y(0.18)} Q11.8 ${y(0.3)} 11.4 ${y(0.66)} L10 ${y(0.86)} L8.6 ${y(0.66)} Q8.2 ${y(0.3)} 10 ${y(0.18)} Z`} fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.8)} />
      <path d={`M10 ${y(0.06)} Q12 ${y(0.06)} 12.4 ${y(0.2)} L11 ${y(0.24)} Q10 ${y(0.3)} 9 ${y(0.22)} Q8.4 ${y(0.1)} 10 ${y(0.06)} Z`} fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.7)} />
      <path d={`M11.4 ${y(0.14)} L13 ${y(0.2)} L11.4 ${y(0.24)} Z`} fill={cor(AMARELO)} stroke={tinta} strokeWidth={s(0.4)} /><circle cx={10.6} cy={y(0.14)} r={0.35} fill={tinta} />
      <path d={`M9 ${y(0.86)} l-1 ${y(0.1)} M11 ${y(0.86)} l1 ${y(0.1)}`} stroke={cor(AMARELO)} strokeWidth={s(0.8)} strokeLinecap="round" />
    </g>; }

    /* ---------------------------------------------------------------- blackwork */
    case 'fases_da_lua': { const r = H * 0.3, y = H / 2; return <g>{[2, 6, 10, 14, 18].map((x, k) => <g key={k}>
      <circle cx={x} cy={y} r={r} fill={k === 0 ? tinta : 'none'} stroke={tinta} strokeWidth={s(0.45)} />
      {k === 1 && <path d={`M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} A${r * 0.5} ${r} 0 0 1 ${x} ${y - r} Z`} fill={tinta} />}
      {k === 2 && <path d={`M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} Z`} fill={tinta} />}
      {k === 3 && <path d={`M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} A${r * 0.5} ${r} 0 0 0 ${x} ${y - r} Z`} fill={tinta} />}
    </g>)}</g>; }
    case 'faixa_solida': return <g><rect x={0} y={H * 0.18} width={W} height={H * 0.64} fill={tinta} /><path d={`M0 ${H * 0.06} H${W} M0 ${H * 0.94} H${W}`} stroke={tinta} strokeWidth={s(0.35)} /></g>;
    case 'floresta': return <g fill={tinta}><rect x={0} y={H * 0.82} width={W} height={H * 0.18} />{Array.from({ length: 9 }, (_, k) => { const x = k * 2.4 + 0.6, alto = H * (0.45 + ((k * 37) % 5) * 0.1); return <path key={k} d={`M${x} ${H * 0.86} L${x + 1.2} ${H * 0.86 - alto} L${x + 2.4} ${H * 0.86} Z`} />; })}</g>;
    case 'serpente_negra': return <g>
      <path d={`M${W / 2} 19.6 C${-W * 0.2} 15 ${W * 1.2} 10 ${W / 2} 4.6`} fill="none" stroke={tinta} strokeWidth={s(3.4)} strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, k) => { const t = k / 9, y = 18.6 - t * 13; return <path key={k} d={`M${W / 2 - 0.9 + Math.sin(t * 6) * W * 0.18} ${y} l0.9 0.7 l0.9 -0.7`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} opacity={0.7} />; })}
      <path d={`M${W / 2} 5 Q${W * 0.05} 3.6 ${W * 0.25} 1 Q${W * 0.75} -0.2 ${W * 0.85} 2.4 Q${W * 0.8} 4.4 ${W / 2} 5 Z`} fill={tinta} />
      <path d={`M${W * 0.4} 1.6 a0.4 0.4 0 1 0 0.01 0`} stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
    </g>;
    case 'corvo': return <g fill={tinta}>
      <path d="M3 12 Q4 6.6 9.6 6 Q12 4 14.4 4.6 L17.6 5.4 L14.6 6.4 Q15.6 9.6 13.6 12.4 L18.4 16.2 L12 14.4 Q8 15.6 3 12 Z" />
      <path d="M8 9 Q5 8 3.2 9.8 Q6 10 8 11 Z" fill={cor(CINZA2)} opacity={0.6} /><circle cx={13.6} cy={5.8} r={0.45} fill={cor(BRANCO)} />
      <path d="M9 14.8 L8.4 18.4 M11 14.6 L11.4 18.4 M6.6 18.6 H13" stroke={tinta} strokeWidth={s(0.6)} />
    </g>;
    case 'montanha': return <g {...L} strokeWidth={s(0.8)}><circle cx={14} cy={5} r={2} /><path d="M1 17 L7 6 L10 11 L13 7 L19 17 Z" /><path d="M5 9.5 L7 6 L8.5 8.7 M11.8 9 L13 7 L14.4 9.3" fill={tinta} /><path d="M3 14 H17" strokeDasharray="1.2 1.2" /></g>;

    /* ---------------------------------------------------------------- tribal */
    case 'tribal_polinesio': return <g fill={tinta}><path d="M2 3 Q10 1 18 3 L18 6 Q10 4 2 6 Z" /><path d="M2 8 L4 6.5 L6 8 L8 6.5 L10 8 L12 6.5 L14 8 L16 6.5 L18 8 L18 10 H2 Z" /><path d="M2 12 Q6 10.5 8 13 Q10 16 14 13 Q16 11.5 18 13 L18 15 Q15 13.5 13.5 15.5 Q10 19 6.5 15 Q4.5 13 2 14.5 Z" /><circle cx={6} cy={17.5} r={1} /><circle cx={14} cy={17.5} r={1} /></g>;
    case 'tribal_faixa': return <path d="M0 9 Q4 4 8 8 Q10 3 14 6 Q17 3 20 6 L20 10 Q16 7 14 11 Q11 8 8 12 Q4 9 0 13 Z" fill={tinta} />;
    case 'maori_espiral': return <g>
      <path d="M10 18.6 C3 18.6 1.4 11.6 4.6 7.4 C7.6 3.6 13.8 4.4 14.6 9 C15.2 12.4 12 14.4 9.8 12.8 C8 11.4 9 8.8 10.8 9.4" {...L} strokeWidth={s(2.2)} />
      <path d="M10 18.6 C3 18.6 1.4 11.6 4.6 7.4 C7.6 3.6 13.8 4.4 14.6 9" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} opacity={0.75} />
      <path d="M13 1.4 Q18.6 3 18.6 9.4 M16 1 Q19.8 1.8 19.4 6" {...L} strokeWidth={s(0.9)} /><path d="M2 2 L5 4.4 M3.6 1 L6 3.4" {...L} strokeWidth={s(0.8)} />
    </g>;
    case 'sol_tribal': return <g fill={tinta}>{Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2, b = a + 0.26; return <path key={k} d={`M${10 + Math.cos(a) * 5} ${10 + Math.sin(a) * 5} Q${10 + Math.cos(a + 0.1) * 8} ${10 + Math.sin(a + 0.1) * 8} ${10 + Math.cos(a + 0.34) * 9.6} ${10 + Math.sin(a + 0.34) * 9.6} Q${10 + Math.cos(b) * 7} ${10 + Math.sin(b) * 7} ${10 + Math.cos(b + 0.1) * 5} ${10 + Math.sin(b + 0.1) * 5} Z`} />; })}<circle cx={10} cy={10} r={4.6} /><circle cx={10} cy={10} r={2.6} fill={cor(BRANCO)} opacity={0.85} /><circle cx={10} cy={10} r={1.2} /></g>;

    /* ---------------------------------------------------------------- geométrica */
    case 'mandala': return <g {...L} strokeWidth={s(0.55)}><circle cx={10} cy={10} r={2} fill={tinta} />{[3.5, 5.6, 8.2].map(r => <circle key={r} cx={10} cy={10} r={r} />)}{Array.from({ length: 12 }, (_, k) => { const a = (k * Math.PI) / 6; const x = 10 + Math.cos(a) * 7, y = 10 + Math.sin(a) * 7; return <path key={k} d={`M${10 + Math.cos(a) * 3.5} ${10 + Math.sin(a) * 3.5} Q${x + Math.cos(a + 0.5) * 1.5} ${y + Math.sin(a + 0.5) * 1.5} ${10 + Math.cos(a) * 8.2} ${10 + Math.sin(a) * 8.2}`} />; })}{Array.from({ length: 24 }, (_, k) => <circle key={`p${k}`} cx={10 + Math.cos(k * Math.PI / 12) * 4.6} cy={10 + Math.sin(k * Math.PI / 12) * 4.6} r={0.3} fill={tinta} stroke="none" />)}</g>;
    case 'triangulos': return <g {...L} strokeWidth={s(0.7)}><path d="M10 2 L18 16 H2 Z" /><path d="M10 7 L14.5 15 H5.5 Z" fill={tinta} /><path d="M2 6 H18" strokeDasharray="1 1.4" /></g>;
    case 'bracadeira': return <g {...L} strokeWidth={s(0.7)}><path d="M0 6 H20 M0 14 H20" strokeWidth={s(1.1)} />{[0, 4, 8, 12, 16].map(x => <path key={x} d={`M${x} 10 L${x + 2} 7 L${x + 4} 10 L${x + 2} 13 Z`} fill={x % 8 === 0 ? tinta : 'none'} />)}</g>;
    case 'flor_da_vida': return <g {...L} strokeWidth={s(0.5)}><circle cx={10} cy={10} r={9} strokeWidth={s(0.8)} /><circle cx={10} cy={10} r={3} />{Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2; return <circle key={k} cx={10 + Math.cos(a) * 3} cy={10 + Math.sin(a) * 3} r={3} />; })}{Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; return <circle key={`b${k}`} cx={10 + Math.cos(a) * 5.2} cy={10 + Math.sin(a) * 5.2} r={3} opacity={0.55} />; })}</g>;
    case 'lobo_geometrico': return <g {...L} strokeWidth={s(0.5)}>
      <path d={`M${W / 2} 19 L${W * 0.12} 9 L${W * 0.1} 1 L${W * 0.35} 5.6 L${W * 0.65} 5.6 L${W * 0.9} 1 L${W * 0.88} 9 Z`} strokeWidth={s(0.8)} />
      <path d={`M${W * 0.35} 5.6 L${W / 2} 10 L${W * 0.65} 5.6 M${W * 0.12} 9 L${W * 0.33} 10.4 L${W / 2} 10 L${W * 0.67} 10.4 L${W * 0.88} 9 M${W * 0.33} 10.4 L${W / 2} 19 L${W * 0.67} 10.4 M${W * 0.1} 1 L${W * 0.33} 10.4 M${W * 0.9} 1 L${W * 0.67} 10.4`} />
      <path d={`M${W * 0.33} 10.4 L${W * 0.4} 9 L${W * 0.42} 10.6 Z M${W * 0.67} 10.4 L${W * 0.6} 9 L${W * 0.58} 10.6 Z`} fill={tinta} /><path d={`M${W * 0.44} 16 L${W / 2} 17.4 L${W * 0.56} 16 Z`} fill={tinta} />
    </g>;
    case 'hexagonos': return <g {...L} strokeWidth={s(0.55)}>{[[6, 5], [12, 5], [3, 10.2], [9, 10.2], [15, 10.2], [6, 15.4], [12, 15.4]].map(([x, y], k) => { const p = Array.from({ length: 6 }, (_, j) => { const a = (j / 6) * Math.PI * 2 + Math.PI / 6; return `${(x + Math.cos(a) * 3).toFixed(2)} ${(y + Math.sin(a) * 3).toFixed(2)}`; }).join(' L'); return <path key={k} d={`M${p} Z`} fill={[1, 3, 6].includes(k) ? tinta : 'none'} opacity={k > 4 ? 0.6 : 1} />; })}<circle cx={17.6} cy={17.4} r={0.5} fill={tinta} /><circle cx={2.4} cy={17.8} r={0.4} fill={tinta} /></g>;

    /* ---------------------------------------------------------------- oriental */
    case 'onda': return <g><path d="M1 18 Q2 8 9 5 Q15 3 17 7 Q14 6 13 9 Q16 9 15 12 Q12 10 11 13 Q14 14 12 17 L1 18 Z" fill={cor(AZUL)} stroke={tinta} strokeWidth={s(0.9)} /><path d="M9 5 Q11 4 12 6 M13 9 l1.4 -1.2 M15 12 l1.4 -0.6 M11 13 l1.2 0.4" stroke={cor('#f2ede0')} strokeWidth={s(0.9)} strokeLinecap="round" fill="none" /><circle cx={17} cy={4} r={1.6} fill={cor(VERMELHO)} /></g>;
    case 'carpa': return <g stroke={tinta} strokeWidth={s(0.8)}><path d="M4 16 Q2 10 7 6 Q11 3 15 4 Q13 7 14 10 Q13 14 9 16 Q7 17 4 16 Z" fill={cor(LARANJA)} /><path d="M7 7 Q9 8 9 11 M11 6 Q12 9 11 12" fill="none" /><path d="M15 4 L19 1 L18 6 Z" fill={cor(LARANJA)} /><circle cx={6.5} cy={13.5} r={0.6} fill={tinta} /><path d="M3 18 Q8 19 12 17" fill="none" strokeDasharray="1 1" /></g>;
    case 'cerejeira': return <g>
      <path d="M1 18 Q6 14 9 9 Q11 5 18 2 M9 9 Q13 10 16 13 M6 14 Q5 10 3 8" fill="none" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" />
      {[[16, 3.4], [12, 6], [15.6, 12.6], [4, 9], [8.4, 11.4], [18.2, 6.8]].map(([x, y], k) => <g key={k}>{Array.from({ length: 5 }, (_, j) => { const a = (j / 5) * Math.PI * 2 + k; return <ellipse key={j} cx={x + Math.cos(a) * 1.1} cy={y + Math.sin(a) * 1.1} rx={1} ry={0.75} transform={`rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * 1.1} ${y + Math.sin(a) * 1.1})`} fill={cor(ROSA)} stroke={tinta} strokeWidth={s(0.3)} />; })}<circle cx={x} cy={y} r={0.4} fill={cor(VERMELHO)} /></g>)}
      <ellipse cx={11} cy={16} rx={0.9} ry={0.6} fill={cor(ROSA)} transform="rotate(30 11 16)" /><ellipse cx={14} cy={18.2} rx={0.8} ry={0.55} fill={cor(ROSA)} transform="rotate(-20 14 18.2)" />
    </g>;
    case 'hannya': return <g>
      <path d={`M${W / 2} 2.4 Q${W * 0.9} 2.4 ${W * 0.92} 9 Q${W * 0.92} 16 ${W / 2} 19.4 Q${W * 0.08} 16 ${W * 0.08} 9 Q${W * 0.1} 2.4 ${W / 2} 2.4 Z`} fill={cor(VERMELHO)} stroke={tinta} strokeWidth={s(0.9)} />
      <path d={`M${W * 0.18} 4.6 Q${W * 0.02} 1.8 ${W * 0.1} 0.4 Q${W * 0.24} 2 ${W * 0.3} 3.6 M${W * 0.82} 4.6 Q${W * 0.98} 1.8 ${W * 0.9} 0.4 Q${W * 0.76} 2 ${W * 0.7} 3.6`} fill={cor(CREME)} stroke={tinta} strokeWidth={s(0.8)} />
      <path d={`M${W * 0.22} 8 L${W * 0.42} 9.4 L${W * 0.24} 10.4 Z M${W * 0.78} 8 L${W * 0.58} 9.4 L${W * 0.76} 10.4 Z`} fill={cor(AMARELO)} stroke={tinta} strokeWidth={s(0.6)} />
      <path d={`M${W * 0.2} 6.6 L${W * 0.44} 8 M${W * 0.8} 6.6 L${W * 0.56} 8`} stroke={tinta} strokeWidth={s(1)} />
      <path d={`M${W * 0.24} 13 Q${W / 2} 11.6 ${W * 0.76} 13 Q${W * 0.7} 17.4 ${W / 2} 17.4 Q${W * 0.3} 17.4 ${W * 0.24} 13 Z`} fill={tinta} />
      <path d={`M${W * 0.3} 13.2 L${W * 0.34} 14.8 L${W * 0.38} 13 M${W * 0.62} 13 L${W * 0.66} 14.8 L${W * 0.7} 13.2 M${W * 0.42} 17 L${W / 2} 15.6 L${W * 0.58} 17`} fill={cor(BRANCO)} stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
    </g>;
    case 'dragao_oriental': return <g>
      <path d={`M${W * 0.5} 19.6 C${W * -0.3} 16 ${W * 1.3} 12 ${W * 0.4} 8 C${W * -0.1} 6 ${W * 0.6} 3.4 ${W * 0.6} 3.4`} fill="none" stroke={cor(VERDE)} strokeWidth={s(3)} strokeLinecap="round" />
      <path d={`M${W * 0.5} 19.6 C${W * -0.3} 16 ${W * 1.3} 12 ${W * 0.4} 8 C${W * -0.1} 6 ${W * 0.6} 3.4 ${W * 0.6} 3.4`} fill="none" stroke={tinta} strokeWidth={s(0.5)} strokeDasharray="0.6 0.9" />
      <path d={`M${W * 0.5} 19.6 C${W * -0.3} 16 ${W * 1.3} 12 ${W * 0.4} 8`} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.6)} transform="translate(0.9 0)" />
      <path d={`M${W * 0.6} 3.4 L${W * 0.98} 1.4 L${W * 0.82} 4.2 L${W} 5.4 L${W * 0.6} 5 Z`} fill={cor(VERDE)} stroke={tinta} strokeWidth={s(0.7)} />
      <path d={`M${W * 0.62} 2.4 Q${W * 0.3} 0.2 ${W * 0.1} 1.6 M${W * 0.7} 2.2 Q${W * 0.5} -0.4 ${W * 0.3} 0.4`} {...L} strokeWidth={s(0.4)} />
      <circle cx={W * 0.75} cy={3.4} r={0.4} fill={cor(VERMELHO)} />
      {[[0.15, 13], [0.85, 10]].map(([x, y], k) => <path key={k} d={`M${W * x} ${y} q${k ? 1.6 : -1.6} 0.4 ${k ? 2 : -2} 1.6 M${W * x} ${y} q${k ? 1.6 : -1.6} -0.4 ${k ? 2 : -2} -1`} {...L} strokeWidth={s(0.5)} />)}
    </g>;
    case 'tigre': return <g>
      <path d="M1.6 14 Q3 8.6 8 8.4 L13.4 8 Q16.6 5 19 6.6 Q19.8 9.6 17.4 11 L15 11.4 Q13 14 9 13.6 L5 13.4 L2.4 17.6 Z" fill={cor(LARANJA)} stroke={tinta} strokeWidth={s(0.8)} />
      {[[5, 9], [7.4, 8.6], [10, 8.4], [12.4, 8.6], [8, 13.4], [11, 13.4]].map(([x, y], k) => <path key={k} d={`M${x} ${y} q0.6 1.6 -0.2 3`} {...L} strokeWidth={s(0.75)} />)}
      <path d="M16.4 7 l0.8 -1.8 l0.8 1.6" fill={cor(LARANJA)} stroke={tinta} strokeWidth={s(0.5)} /><circle cx={17.4} cy={8.2} r={0.4} fill={tinta} /><path d="M18.8 9.6 L17.4 10.4" {...L} strokeWidth={s(0.5)} />
      <path d="M17.6 10.4 Q17 11 16 10.8" fill={cor(BRANCO)} stroke={tinta} strokeWidth={s(0.3)} />
      <path d="M9 13.6 L8.4 17.4 M13 13 L14 16.6" {...L} strokeWidth={s(1)} /><path d="M1.6 14 Q0.4 10 1.8 7.6" {...L} strokeWidth={s(0.8)} />
    </g>;
    case 'nuvens': return <g {...L} strokeWidth={s(0.8)}>
      <path d={`M1 ${H * 0.75} Q1 ${H * 0.35} 5 ${H * 0.45} Q6 ${H * 0.1} 10 ${H * 0.3} Q13 ${H * 0.05} 15 ${H * 0.4} Q19 ${H * 0.35} 19 ${H * 0.75} Z`} fill={cor(BRANCO)} />
      <path d={`M5 ${H * 0.6} a1.3 1.3 0 1 1 2 -1 M11 ${H * 0.55} a1.2 1.2 0 1 1 1.8 -1 M15 ${H * 0.62} a1 1 0 1 1 1.6 -0.6`} strokeWidth={s(0.5)} />
      <path d={`M0 ${H * 0.9} H20`} strokeWidth={s(0.5)} />
    </g>;

    /* ---------------------------------------------------------------- minimalista */
    case 'aviao_papel': return <g {...L} strokeWidth={s(0.6)}><path d="M3 11 L17 4 L11 16 L9.4 12.4 Z M9.4 12.4 L17 4" /><path d="M2 16 Q4 13 6.4 14.6" strokeDasharray="0.7 1" /></g>;
    case 'onda_mini': return <g {...L} strokeWidth={s(0.6)}><path d={`M1 ${H * 0.75} Q5 ${H * 0.1} 9 ${H * 0.55} Q12 ${H * 0.85} 15 ${H * 0.55} Q17 ${H * 0.35} 19 ${H * 0.6}`} /><circle cx={15} cy={H * 0.25} r={1.4} /></g>;
    case 'triangulo_mini': return <path d="M10 4 L16 15 H4 Z" {...L} strokeWidth={s(0.7)} />;
    case 'pontos': return <g fill={tinta}>{[4, 10, 16].map(x => <circle key={x} cx={x} cy={H / 2} r={H * 0.18} />)}</g>;
    case 'montanha_mini': return <path d={`M1 ${H * 0.9} L7 ${H * 0.2} L10.6 ${H * 0.6} L13.4 ${H * 0.35} L19 ${H * 0.9}`} {...L} strokeWidth={s(0.6)} />;
    case 'gato_linha': return <g {...L} strokeWidth={s(0.6)}><path d="M6 18 Q4 12 7 9 L6.4 4.6 L9 7.2 Q10 7 11 7.2 L13.6 4.6 L13 9 Q16 12 14 18 Z" /><path d="M14 17 Q18 16 17 12" /><circle cx={8.8} cy={10.6} r={0.3} fill={tinta} /><circle cx={11.2} cy={10.6} r={0.3} fill={tinta} /></g>;

    /* ---------------------------------------------------------------- fine line */
    case 'ramo_fino': return <g {...L} strokeWidth={s(0.45)}><path d="M3 17 Q10 11 17 3" />{[0, 1, 2, 3].map(k => { const x = 5 + k * 3, y = 15 - k * 3; return <g key={k}><path d={`M${x} ${y} q -2 -2 -1 -4 q 2 1 1 4`} /><path d={`M${x + 1} ${y} q 2 0 3 2 q -2 1 -3 -2`} /></g>; })}</g>;
    case 'lua_estrelas': return <g {...L} strokeWidth={s(0.5)}><path d="M12 3 A7 7 0 1 0 12 17 A5.5 5.5 0 1 1 12 3 Z" /><path d="M16 5 l0.5 1.2 l1.2 0.5 l-1.2 0.5 l-0.5 1.2 l-0.5 -1.2 l-1.2 -0.5 l1.2 -0.5 Z M15 13 l0.3 0.8 l0.8 0.3 l-0.8 0.3 l-0.3 0.8 l-0.3 -0.8 l-0.8 -0.3 l0.8 -0.3 Z" /><circle cx={17.5} cy={10} r={0.35} fill={tinta} /></g>;
    case 'linha_continua': return <path d="M12 2 Q8 3 8 7 Q6 8 7 9.5 Q8 10 7.5 11.5 Q9 12 9 14 Q11 15 13 13 M12 2 Q16 4 15 9 Q14 14 10 18" {...L} strokeWidth={s(0.5)} />;
    case 'coracaozinho': return <path d="M10 15 Q4 10.5 5.5 7 Q7 4.5 10 7.5 Q13 4.5 14.5 7 Q16 10.5 10 15 Z" {...L} strokeWidth={s(0.6)} />;
    case 'borboleta': return <g {...L} strokeWidth={s(0.45)}><path d="M10 6 V15" strokeWidth={s(0.7)} /><path d="M10 8 Q4 1 2.4 6 Q2 10 9.6 10 Q3 11 4 15.4 Q6.6 18 9.8 12" /><path d="M10 8 Q16 1 17.6 6 Q18 10 10.4 10 Q17 11 16 15.4 Q13.4 18 10.2 12" /><path d="M10 6 Q9 3.6 7.6 3 M10 6 Q11 3.6 12.4 3" /><circle cx={5.4} cy={6.4} r={0.6} /><circle cx={14.6} cy={6.4} r={0.6} /></g>;
    case 'constelacao': return <g><path d="M2 14 L6.4 9.6 L10.4 11 L13.6 5.6 L18 3.4 M10.4 11 L14 16.4" {...L} strokeWidth={s(0.35)} />{[[2, 14], [6.4, 9.6], [10.4, 11], [13.6, 5.6], [18, 3.4], [14, 16.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k === 3 ? 0.9 : 0.6} fill={tinta} />)}</g>;
    case 'flor_fina': return <g {...L} strokeWidth={s(0.4)}><path d={`M${W / 2} 20 Q${W * 0.3} 13 ${W / 2} 6`} /><path d={`M${W / 2} 14 q${W * 0.45} -1.6 ${W * 0.4} -4.4 q-${W * 0.3} 0.8 -${W * 0.4} 4.4 Z`} />{Array.from({ length: 5 }, (_, k) => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; return <ellipse key={k} cx={W / 2 + Math.cos(a) * 1.6} cy={4 + Math.sin(a) * 1.6} rx={1.4} ry={0.8} transform={`rotate(${(a * 180) / Math.PI} ${W / 2 + Math.cos(a) * 1.6} ${4 + Math.sin(a) * 1.6})`} />; })}<circle cx={W / 2} cy={4} r={0.5} fill={tinta} /></g>;
    case 'beija_flor': return <g><path d="M6 12 Q9 8.6 13 9.6 L19 7.4 L13.6 11 Q10 14.4 6 12 Z" fill={cor(TURQUESA)} stroke={tinta} strokeWidth={s(0.45)} /><path d="M9 10 Q7 3 11.6 1 Q12 6 10.6 9.6" fill="none" stroke={tinta} strokeWidth={s(0.4)} /><path d="M10 10 Q12.6 4 16 3.6 Q14.6 7.6 11.4 10" fill="none" stroke={tinta} strokeWidth={s(0.4)} /><path d="M6 12 L2 15 M5.6 12.4 L3 16.6" stroke={tinta} strokeWidth={s(0.4)} /><circle cx={16.8} cy={8.2} r={0.3} fill={tinta} /><path d="M7 12 Q8.4 13 10 12.4" fill="none" stroke={cor(ROXO)} strokeWidth={s(0.6)} /></g>;

    /* ---------------------------------------------------------------- lettering (a letra de verdade) */
    case 'nome_cursivo': return <g>{letra(texto ?? 'Maria', "'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive", 400, H * 0.74, H * 0.82, { fontStyle: 'italic' })}<path d={`M2 ${H * 0.9} Q10 ${H * 1.02} 18 ${H * 0.86}`} {...L} strokeWidth={s(0.3)} /></g>;
    case 'data_romana': return letra(texto ?? 'XII·IV·MMX', "Georgia, 'Times New Roman', serif", 400, H * 0.78, H * 0.78, { letterSpacing: 0.2 });
    case 'frase': return letra(texto ?? 'Respira', "'Courier New', Courier, monospace", 700, H * 0.7, H * 0.66);
    case 'palavra_gotica': return letra(texto ?? 'Família', "'UnifrakturMaguntia', 'Old English Text MT', 'Engravers MT', Georgia, serif", 900, H * 0.8, H * 0.84);
    case 'iniciais': return <g>{letra(texto ?? 'A·M', "Georgia, 'Times New Roman', serif", 700, H * 0.74, H * 0.74)}<path d={`M3 ${H * 0.92} H17`} {...L} strokeWidth={s(0.3)} /></g>;
    case 'coordenadas': return letra(texto ?? '23°33′S 46°38′O', "'Helvetica Neue', Arial, sans-serif", 400, H * 0.72, H * 0.66, { letterSpacing: 0.15 });

    /* ---------------------------------------------------------------- ornamental */
    case 'lustre': return <g {...L} strokeWidth={s(0.4)}>
      <path d={`M0.4 1 Q${W / 2} 4.4 ${W - 0.4} 1`} /><path d={`M1.6 1.4 Q${W / 2} 7.4 ${W - 1.6} 1.4`} />
      {Array.from({ length: 7 }, (_, k) => <circle key={k} cx={1.6 + k * (W - 3.2) / 6} cy={1.6 + Math.sin((k / 6) * Math.PI) * 3.4} r={0.45} fill={tinta} />)}
      <path d={`M${W / 2} 5 L${W / 2 + 2.6} 9 L${W / 2} 13 L${W / 2 - 2.6} 9 Z`} fill={tinta} /><circle cx={W / 2} cy={9} r={1} fill={cor(BRANCO)} stroke={tinta} />
      <path d={`M${W / 2 - 2.4} 13 Q${W / 2} 16.6 ${W / 2 + 2.4} 13 M${W / 2} 13 V16`} />
      <path d={`M${W / 2} 16 Q${W / 2 + 1.4} 18 ${W / 2} 19.8 Q${W / 2 - 1.4} 18 ${W / 2} 16 Z`} fill={tinta} />
      <path d={`M${W * 0.15} 6 v3 M${W * 0.85} 6 v3`} /><circle cx={W * 0.15} cy={9.6} r={0.6} fill={tinta} /><circle cx={W * 0.85} cy={9.6} r={0.6} fill={tinta} />
    </g>;
    case 'filigrana': return <g {...L} strokeWidth={s(0.4)}><path d={`M0 ${H * 0.15} H20 M0 ${H * 0.85} H20`} />{[0, 5, 10, 15].map(x => <g key={x}><path d={`M${x} ${H / 2} Q${x + 1.2} ${H * 0.15} ${x + 2.5} ${H / 2} Q${x + 3.8} ${H * 0.85} ${x + 5} ${H / 2}`} /><path d={`M${x + 2.5} ${H / 2} a0.9 0.9 0 1 1 0.01 0`} /><circle cx={x + 1.2} cy={H * 0.62} r={0.3} fill={tinta} /><circle cx={x + 3.8} cy={H * 0.38} r={0.3} fill={tinta} /></g>)}</g>;
    case 'renda': return <g {...L} strokeWidth={s(0.35)}><path d={`M0 ${H * 0.12} H20`} strokeWidth={s(0.6)} />{Array.from({ length: 8 }, (_, k) => <g key={k}><path d={`M${k * 2.5} ${H * 0.15} Q${k * 2.5 + 1.25} ${H * 0.95} ${k * 2.5 + 2.5} ${H * 0.15}`} /><circle cx={k * 2.5 + 1.25} cy={H * 0.45} r={0.35} fill={tinta} /><path d={`M${k * 2.5 + 0.6} ${H * 0.3} l1.3 0`} strokeDasharray="0.25 0.35" /></g>)}</g>;
    case 'medalhao': return <g {...L} strokeWidth={s(0.45)}><circle cx={10} cy={10} r={9} /><circle cx={10} cy={10} r={8} strokeDasharray="0.3 0.8" />{Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return <path key={k} d={`M10 10 Q${10 + Math.cos(a - 0.4) * 6} ${10 + Math.sin(a - 0.4) * 6} ${10 + Math.cos(a) * 7.2} ${10 + Math.sin(a) * 7.2} Q${10 + Math.cos(a + 0.4) * 6} ${10 + Math.sin(a + 0.4) * 6} 10 10`} fill={k % 2 ? tinta : 'none'} />; })}<circle cx={10} cy={10} r={2} fill={cor(BRANCO)} stroke={tinta} /><circle cx={10} cy={10} r={0.8} fill={tinta} /></g>;

    /* ---------------------------------------------------------------- floral */
    case 'peonia': return <g stroke={tinta} strokeWidth={s(0.6)}>
      <path d="M2 15.6 Q5 19.6 9.4 17.2 Q6 14.6 2 15.6 Z M18 15.6 Q15 19.6 10.6 17.2 Q14 14.6 18 15.6 Z" fill={cor(VERDE)} />
      <path d="M2.6 11 Q2.4 5.6 7 6.4 Q9 2.6 13 6.4 Q17.6 5.6 17.4 11 Q17 16.4 10 16.6 Q3 16.4 2.6 11 Z" fill={cor(ROSA)} />
      <path d="M4.6 10.4 Q6 7.6 8.6 8.6 Q10 6.4 11.6 8.6 Q14.2 7.6 15.4 10.4 Q13.6 14.4 10 14.4 Q6.4 14.4 4.6 10.4 Z" fill={cor('#e58fa8')} />
      <path d="M7.4 10.6 Q8.6 8.8 10 10 Q11.4 8.8 12.6 10.6 Q11.6 12.6 10 12.6 Q8.4 12.6 7.4 10.6 Z" fill={cor('#f2b8c8')} />
      <path d="M9 10.8 Q10 10 11 10.8" fill="none" strokeWidth={s(0.4)} /><path d="M5 13.6 Q7 15.4 10 15.4 Q13 15.4 15 13.6" fill="none" strokeWidth={s(0.35)} />
    </g>;
    case 'girassol': return <g stroke={tinta} strokeWidth={s(0.6)}>{Array.from({ length: 14 }, (_, k) => { const a = (k * Math.PI * 2) / 14; return <ellipse key={k} cx={10 + Math.cos(a) * 5.5} cy={10 + Math.sin(a) * 5.5} rx={2.4} ry={1.2} transform={`rotate(${(a * 180) / Math.PI} ${10 + Math.cos(a) * 5.5} ${10 + Math.sin(a) * 5.5})`} fill={cor(AMARELO)} />; })}<circle cx={10} cy={10} r={4} fill={cor(MARROM)} />{[0, 1, 2, 3, 4, 5].map(k => <circle key={`s${k}`} cx={8.5 + (k % 3) * 1.5} cy={9 + Math.floor(k / 3) * 2} r={0.35} fill={tinta} stroke="none" />)}</g>;
    case 'ramos': return <g {...L} strokeWidth={s(0.7)}><path d="M2 18 Q8 12 10 2 M10 2 Q12 12 18 18" />{[0, 1, 2, 3].map(k => <g key={k}><path d={`M${4.5 + k * 1.3} ${15 - k * 3.3} q -3 -1 -3.5 -3.5 q 3 0 3.5 3.5 Z`} fill={tinta} /><path d={`M${15.5 - k * 1.3} ${15 - k * 3.3} q 3 -1 3.5 -3.5 q -3 0 -3.5 3.5 Z`} fill={tinta} /></g>)}</g>;
    case 'lirio': return <g stroke={tinta} strokeWidth={s(0.55)}><path d={`M${W / 2} 20 Q${W * 0.45} 14 ${W / 2} 9`} fill="none" /><path d={`M${W / 2} 16 Q${W * 0.95} 14 ${W * 0.95} 11 Q${W * 0.6} 12 ${W / 2} 16 Z`} fill={cor(VERDE)} />
      {[-1, 0, 1].map(k => <path key={k} d={`M${W / 2} 9 Q${W / 2 + k * W * 0.55} ${6 - Math.abs(k) * 0.6} ${W / 2 + k * W * 0.48} ${k ? 1.4 : 0.6} Q${W / 2 + k * W * 0.12} ${4.6} ${W / 2} 9 Z`} fill={cor('#f3e6ef')} />)}
      <path d={`M${W / 2} 8 l-1.2 -3.6 M${W / 2} 8 l0 -4 M${W / 2} 8 l1.2 -3.6`} fill="none" strokeWidth={s(0.3)} />{[-1.2, 0, 1.2].map((dx, k) => <circle key={k} cx={W / 2 + dx} cy={k === 1 ? 3.9 : 4.4} r={0.45} fill={cor(LARANJA)} />)}</g>;
    case 'lavanda': return <g>{[0.25, 0.5, 0.75].map((f, k) => <g key={k}><path d={`M${W * f} 20 Q${W * (f + (k - 1) * 0.08)} 12 ${W * (f + (k - 1) * 0.2)} ${3 + k}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.5)} />{Array.from({ length: 6 }, (_, j) => <ellipse key={j} cx={W * (f + (k - 1) * 0.2) + (j % 2 ? 0.5 : -0.5) - (k - 1) * j * 0.12} cy={3 + k + j * 1.1} rx={0.6} ry={0.75} fill={cor(ROXO)} stroke={tinta} strokeWidth={s(0.2)} />)}</g>)}<path d={`M${W * 0.15} 17 Q${W / 2} 15.4 ${W * 0.85} 17`} stroke={tinta} strokeWidth={s(0.4)} fill="none" /></g>;
    case 'buque': return <g stroke={tinta} strokeWidth={s(0.5)}>
      <path d="M9 19.6 L9.6 11.6 M11 19.6 L10.4 11.6 M10 19.6 V11.6 M8 19.4 L9 12 M12 19.4 L11 12" fill="none" stroke={cor(VERDE)} strokeWidth={s(0.6)} />
      <path d="M8.2 15.4 Q10 16.6 11.8 15.4 L11.8 16.8 Q10 18 8.2 16.8 Z" fill={cor(VERMELHO)} /><path d="M10 16.4 Q8 18.4 7 18 M10 16.4 Q12 18.4 13 18" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.5)} />
      <path d="M2.6 11.4 Q4 8.8 7.4 10.8 Q4.8 13 2.6 11.4 Z M17.4 11.4 Q16 8.8 12.6 10.8 Q15.2 13 17.4 11.4 Z" fill={cor(VERDE)} />
      {[[10, 6.6, 3.2, VERMELHO], [5.6, 9, 2.5, ROSA], [14.4, 9, 2.5, ROSA], [7.4, 3.6, 2.2, AMARELO], [12.8, 3.8, 2.2, VERMELHO]].map(([x, y, r, c], k) => { const X = x as number, Y = y as number, R = r as number; return <g key={k}><circle cx={X} cy={Y} r={R} fill={cor(c as string)} /><path d={`M${X - R * 0.55} ${Y + 0.2} Q${X} ${Y - R * 0.75} ${X + R * 0.55} ${Y + 0.2} M${X - R * 0.3} ${Y + R * 0.45} Q${X} ${Y - R * 0.1} ${X + R * 0.3} ${Y + R * 0.45}`} fill="none" strokeWidth={s(0.4)} /></g>; })}
    </g>;

    /* ---------------------------------------------------------------- simbólica */
    case 'simbolo_infinito': return <path d="M10 10 Q6 5 3.5 7.5 Q1.5 10 3.5 12.5 Q6 15 10 10 Q14 5 16.5 7.5 Q18.5 10 16.5 12.5 Q14 15 10 10 Z" {...L} strokeWidth={s(0.9)} />;
    case 'ponto_e_virgula': return <g fill={tinta}><circle cx={W / 2} cy={5.6} r={W * 0.2} /><circle cx={W / 2} cy={12.6} r={W * 0.2} /><path d={`M${W / 2 + W * 0.18} 13 Q${W / 2 + W * 0.15} 17.6 ${W / 2 - W * 0.3} 19.4 Q${W / 2} 16.4 ${W / 2 - W * 0.05} 14.4 Z`} /></g>;
    case 'arvore_da_vida': return <g {...L} strokeWidth={s(0.55)}><circle cx={10} cy={10} r={9.2} />
      <path d="M10 17 V8 M10 12 Q7 10 5 6 M10 12 Q13 10 15 6 M10 9.4 Q8.6 6.6 9 3.6 M10 9.4 Q11.4 6.6 11 3.6 M7 9 Q5 9 3.4 8 M13 9 Q15 9 16.6 8" />
      <path d="M10 15 Q7 16.6 4.4 16 M10 15 Q13 16.6 15.6 16 M10 16.4 Q9 18 7.4 18.6 M10 16.4 Q11 18 12.6 18.6" />
      {[[5, 5.4], [7.4, 3.6], [12.6, 3.6], [15, 5.4], [3.6, 7.6], [16.4, 7.6], [10, 2.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={1.1} fill={tinta} />)}
    </g>;
    case 'olho_de_horus': return <g {...L} strokeWidth={s(0.8)}>
      <path d={`M2 ${H * 0.45} Q9 ${H * 0.05} 17 ${H * 0.4} Q9 ${H * 0.7} 2 ${H * 0.45} Z`} /><circle cx={9.4} cy={H * 0.42} r={H * 0.16} fill={tinta} />
      <path d={`M1 ${H * 0.18} Q9 ${H * -0.05} 18.6 ${H * 0.22}`} strokeWidth={s(1)} /><path d={`M9 ${H * 0.62} L8 ${H * 0.98}`} /><path d={`M12 ${H * 0.6} Q14 ${H * 0.8} 13 ${H * 0.95} Q11.4 ${H * 1.02} 11.6 ${H * 0.86}`} />
    </g>;
    case 'lotus': return <g {...L} strokeWidth={s(0.55)}>
      <path d={`M10 ${H * 0.9} Q6.6 ${H * 0.5} 10 ${H * 0.05} Q13.4 ${H * 0.5} 10 ${H * 0.9} Z`} />
      <path d={`M10 ${H * 0.9} Q3.4 ${H * 0.75} 3.6 ${H * 0.3} Q7.6 ${H * 0.45} 10 ${H * 0.9} M10 ${H * 0.9} Q16.6 ${H * 0.75} 16.4 ${H * 0.3} Q12.4 ${H * 0.45} 10 ${H * 0.9}`} />
      <path d={`M10 ${H * 0.92} Q2 ${H * 0.95} 0.6 ${H * 0.65} Q5 ${H * 0.6} 8 ${H * 0.88} M10 ${H * 0.92} Q18 ${H * 0.95} 19.4 ${H * 0.65} Q15 ${H * 0.6} 12 ${H * 0.88}`} />
      <path d={`M3 ${H} H17`} strokeDasharray="0.6 0.8" />
    </g>;
    case 'pegadas': return <g fill={tinta}>{[[6.4, 11, -12], [13.4, 7, 10]].map(([x, y, a], k) => <g key={k} transform={`rotate(${a} ${x} ${y})`}><path d={`M${x} ${y - 4} Q${x + 2.6} ${y - 3.6} ${x + 2.2} ${y + 1.2} Q${x + 1.8} ${y + 5.4} ${x} ${y + 5.2} Q${x - 1.8} ${y + 5} ${x - 1.8} ${y + 1} Q${x - 2.2} ${y - 3.8} ${x} ${y - 4} Z`} />{[[-1.5, -5.6, 0.75], [-0.3, -6.3, 0.6], [0.8, -6.3, 0.55], [1.8, -5.8, 0.5], [2.6, -5, 0.45]].map(([dx, dy, r], j) => <circle key={j} cx={x + dx} cy={y + dy} r={r} />)}</g>)}</g>;
    case 'batimento': return <path d={`M0 ${H * 0.6} H6 L7.4 ${H * 0.3} L9 ${H * 0.95} L10.8 ${H * 0.05} L12.4 ${H * 0.75} L13.4 ${H * 0.6} H20`} {...L} strokeWidth={s(0.6)} />;
    case 'cruz': return <path d={`M${W / 2} 1 V19 M${W * 0.12} 6.6 H${W * 0.88}`} {...L} strokeWidth={s(1.4)} />;
    case 'yin_yang': return <g><circle cx={10} cy={10} r={8.6} fill="none" stroke={tinta} strokeWidth={s(0.7)} /><path d="M10 1.4 A8.6 8.6 0 0 1 10 18.6 A4.3 4.3 0 0 1 10 10 A4.3 4.3 0 0 0 10 1.4 Z" fill={tinta} /><circle cx={10} cy={5.7} r={1.2} fill={tinta} /><circle cx={10} cy={14.3} r={1.2} fill={cor(BRANCO)} /></g>;

    /* ---------------------------------------------------------------- abstrata */
    case 'aquarela': return <g>
      <path d="M3 9 Q2 3 8 3.6 Q12 1 15.4 4.4 Q19 6 17.6 11 Q18 16.6 12 16 Q8 19 5 15.4 Q1.4 14 3 9 Z" fill={cor(TURQUESA)} opacity={0.75} />
      <path d="M6 7 Q9 4 13 6.6 Q15.6 9.6 12.6 12.6 Q8 14.4 6.2 11.4 Q4.6 9.4 6 7 Z" fill={cor(ROXO)} opacity={0.65} /><path d="M10 8 Q13 8.6 12.4 11 Q10 12.6 8.6 10.6 Q8.4 8.6 10 8 Z" fill={cor(ROSA)} opacity={0.8} />
      {[[17.4, 16.4, 0.7], [1.6, 17, 0.5], [18.4, 2.6, 0.4], [4, 2.4, 0.35], [14.6, 18.8, 0.45]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(k % 2 ? ROXO : TURQUESA)} />)}
      <path d="M12.6 16 Q12.4 18 12.8 19.6" stroke={cor(TURQUESA)} strokeWidth={s(0.6)} fill="none" opacity={0.7} />
    </g>;
    case 'pinceladas': return <g fill={tinta}>{[[1, H * 0.15, 17, 0.9], [3, H * 0.45, 16, 1.2], [0.6, H * 0.78, 18, 0.7]].map(([x, y, w, h], k) => <path key={k} d={`M${x} ${y} Q${x + w * 0.5} ${y - h * 1.6} ${x + w} ${y + h * 0.2} L${x + w - 0.6} ${y + h * 1.2} Q${x + w * 0.4} ${y + h * 0.4} ${x + 0.4} ${y + h * 1.4} Z`} opacity={0.9 - k * 0.12} />)}{[4, 9, 14].map(x => <path key={x} d={`M${x} ${H * 0.5} l1.6 0.3`} stroke={tinta} strokeWidth={s(0.2)} />)}</g>;
    case 'linhas_fluidas': return <g {...L} strokeWidth={s(0.5)}>{[0, 1, 2, 3].map(k => <path key={k} d={`M${1 + k * 1.2} 20 C${W * 0.1 + k} 13 ${W * 0.9 - k} 9 ${W * 0.4 + k * 0.8} 0`} />)}<circle cx={W * 0.75} cy={14} r={0.6} fill={tinta} /></g>;
    case 'formas': return <g><circle cx={7} cy={7} r={4.6} fill={cor(LARANJA)} /><path d="M13 7 Q17 12 13.6 16 Q10.6 13 13 7 Z" fill={cor(AZUL)} /><path d="M2 16 Q8 12 12 18.6" fill="none" stroke={tinta} strokeWidth={s(0.7)} strokeLinecap="round" /><circle cx={7} cy={7} r={4.6} fill="none" stroke={tinta} strokeWidth={s(0.35)} transform="translate(1 0.8)" /></g>;

    /* ---------------------------------------------------------------- peças inteiras */
    case 'fechamento': return <g stroke={tinta} strokeWidth={s(0.6)}><path d="M0 2 Q5 0 10 2 Q15 4 20 2 V7 Q15 9 10 7 Q5 5 0 7 Z" fill={cor(AZUL)} /><circle cx={6} cy={11} r={2.6} fill={cor(VERMELHO)} /><circle cx={14} cy={12.5} r={2.2} fill={cor(VERMELHO)} /><path d="M0 16 Q4 13 8 16 Q12 19 16 16 Q18 14.5 20 16 V20 H0 Z" fill={tinta} /><path d="M9 9 Q11 10 10 13" fill="none" /></g>;
    case 'dragao_costas': return <g stroke={tinta} strokeWidth={s(0.7)}><path d="M3 4 Q8 1 12 4 Q16 7 12 10 Q8 13 12 16 Q15 18 17 16" fill="none" strokeWidth={s(2.6)} stroke={cor(VERDE)} /><path d="M3 4 Q8 1 12 4 Q16 7 12 10 Q8 13 12 16 Q15 18 17 16" fill="none" strokeDasharray="0.8 1.2" /><path d="M1 3 L4 2 L5 5 Z" fill={cor(VERMELHO)} /><circle cx={3} cy={3.6} r={0.4} fill={tinta} />{[0, 1, 2].map(k => <path key={k} d={`M${5 + k * 4} ${15 - k * 5} q 2 -2 4 0`} fill="none" />)}</g>;
    case 'fenix_costas': { const asa = (k: 1 | -1) => `M${10 + k * 0.8} 6 Q${10 + k * 4} 2 ${10 + k * 9.6} 2.6 Q${10 + k * 8} 4 ${10 + k * 9.2} 5 Q${10 + k * 7.2} 5.8 ${10 + k * 8.4} 7 Q${10 + k * 6.4} 7.4 ${10 + k * 7.2} 8.8 Q${10 + k * 4.4} 8.6 ${10 + k * 1} 10 Z`; return <g stroke={tinta} strokeWidth={s(0.5)}>
      <path d={asa(-1)} fill={cor(LARANJA)} strokeLinejoin="round" /><path d={asa(1)} fill={cor(LARANJA)} strokeLinejoin="round" />
      <path d="M3 3.6 Q6 4.4 9 7 M17 3.6 Q14 4.4 11 7 M4.6 6 Q7 6.6 9.4 8.4 M15.4 6 Q13 6.6 10.6 8.4" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.45)} />
      <path d="M10 3 Q11.6 5 11 10 L10 13 L9 10 Q8.4 5 10 3 Z" fill={cor(VERMELHO)} /><path d="M10 3 L11.6 2.4 L10.4 3.8 Z" fill={cor(AMARELO)} /><circle cx={10.3} cy={3.8} r={0.25} fill={tinta} />
      <path d="M10 13 Q5.6 15 6.6 19.6 M10 13 Q10 16 10 19.8 M10 13 Q14.4 15 13.4 19.6" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(1)} />
      <path d="M10 13 Q7.4 15.4 8 18.4 M10 13 Q12.6 15.4 12 18.4" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.5)} />
    </g>; }
    case 'aguia_peito': return <g fill={tinta}><path d="M10 6 Q8 8 8.5 11 L10 13 L11.5 11 Q12 8 10 6 Z" /><path d="M8.5 9 Q4 6 0 8 Q3 9 1 11 Q4 11 3 13 Q6 12 8.5 11 Z M11.5 9 Q16 6 20 8 Q17 9 19 11 Q16 11 17 13 Q14 12 11.5 11 Z" /><circle cx={10} cy={5} r={1.4} /><path d="M10 4.4 L11.8 5.2 L10 5.6 Z" fill="#c9a14a" /></g>;
    case 'perna_floral': return <g stroke={tinta} strokeWidth={s(0.3)}>
      <path d={`M${W / 2} 20 Q${W * 0.1} 16.6 ${W / 2} 13 Q${W * 0.9} 9.4 ${W / 2} 6 Q${W * 0.15} 3 ${W / 2} 0.4`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.5)} />
      {[[0.5, 2.2, ROSA], [0.62, 8.2, VERMELHO], [0.36, 12.6, ROSA], [0.6, 17.4, VERMELHO]].map(([x, y, c], k) => { const X = W * (x as number), Y = y as number, R = 1.5; return <g key={k}><ellipse cx={X} cy={Y} rx={R} ry={R * 0.9} fill={cor(c as string)} /><path d={`M${X - R * 0.5} ${Y} Q${X} ${Y - R * 0.6} ${X + R * 0.5} ${Y} M${X - R * 0.25} ${Y + R * 0.35} Q${X} ${Y} ${X + R * 0.25} ${Y + R * 0.35}`} fill="none" strokeWidth={s(0.2)} /></g>; })}
      {[[0.2, 5.2, 1], [0.82, 4, -1], [0.18, 10.4, 1], [0.84, 14.8, -1], [0.2, 18.8, 1]].map(([x, y, k], j) => <path key={`f${j}`} d={`M${W * (x as number)} ${y} q${(k as number) * 1.4} -0.5 ${(k as number) * 1.9} -1.8 q${(k as number) * -1.4} 0.1 ${(k as number) * -1.9} 1.8 Z`} fill={cor(VERDE)} />)}
    </g>;
  }
  // VIDA 12.9: os desenhos novos têm a arte em `tatuagens129`.
  const novo = desenho129(id, { tinta, cor, traco, W, H, texto, espelhado });
  if (novo !== undefined) return novo;
  // VIDA 13: os desenhos novos (estilos, temas e a cultura pop nova) têm a arte em `tatuagens13`.
  const de13 = desenho13(id, { tinta, cor, traco, W, H, texto, espelhado });
  if (de13 !== undefined) return de13;
  // VIDA 17: rua e periferia, tradição de cadeia e as peças do rosto (`tatuagens17`).
  const de17 = desenho17(id, { tinta, cor, traco, W, H, texto, espelhado });
  if (de17 !== undefined) return de17;
  return <circle cx={W / 2} cy={H / 2} r={Math.min(W, H) * 0.2} fill="none" stroke={tinta} strokeWidth={s(0.8)} />;
}
