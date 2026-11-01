/**
 * 12.4.1 — A CENA DO CÔMODO: a parede com a cor (ou o tijolo, o papel, a boiserie) que a pessoa escolheu, o piso
 * (cerâmica, cimento, vinílico, porcelanato, taco, mármore), a luz (a lâmpada no teto, a luz quente, a sanca com
 * pendentes, a automação), a janela — e, no chão, os objetos que estão de fato ali (`lar.coisasPorComodo`), cada um
 * com o desenho e a cor dele, na escala aproximada de verdade (o sofá é maior que o violão). O que todo cômodo tem
 * (a pia e o fogão da cozinha, o chuveiro do banheiro, a grama do jardim) vem desenhado; o resto é o que se comprou.
 *
 * Mesma linguagem das outras ilustrações (REWORK 8, A+B): formas chapadas, um tom de sombra, sombra de contato no chão.
 */
import { memo, useId, type ReactElement } from 'react';
import { Ilustracao, valida } from './nucleo';
import { amostraDoObjeto } from './objetos';
import { variantesDaCoisa } from '../../motor/dados/pertences';
import { misturar } from '../avatar/cores';

export interface ObjetoNaCena { coisaId: string; cor?: string; id: string }

interface Props {
  tipo: string;
  parede?: { id: string; cor?: string };
  piso?: { id: string; cor?: string };
  luz?: string;
  objetos: ObjetoNaCena[];
  largura?: number;
  rotulo: string;
}

/** A largura aproximada de cada objeto, em unidades da cena (a cena tem 320 de largura ≈ 5 m). */
const LARGURA: Record<string, number> = {
  sofa: 120, mesa_jantar: 96, cama: 110, colchao: 100, escrivaninha: 74, poltrona: 52, cozinha_equipada: 90, maquina_lavar: 42, lava_loucas: 40,
  ar_condicionado: 54, tv: 70, piano: 92, bateria: 64, mesa_sinuca: 120, esteira: 80, estacao_musculacao: 76, kit_academia: 50, home_studio: 64,
  computador: 46, notebook: 30, projetor: 28, som_hifi: 44, caixa_som: 26, videogame: 30, camera: 22, tablet: 22, celular_simples: 12, celular_bom: 12, celular_topo: 12,
  violao: 26, guitarra: 26, teclado: 70, violino: 18, cavaquinho: 18, pandeiro: 18, sanfona: 30, saxofone: 18, controladora_dj: 40, discos: 30,
  livros: 50, livros_estudo: 36, material_arte: 30, jogos_tabuleiro: 26, cavalete: 40, torno_ceramica: 46, raquete: 20, prancha: 22, camping: 46, tabuleiro: 24, chuteira_bola: 24,
  aspirador_robo: 22, roupa_de_cama: 40
};
const PADRAO = 34;
const EXTERNOS = new Set(['jardim', 'piscina', 'lazer', 'garagem']);

export const CenaDoComodo = memo(function CenaDoComodo({ tipo, parede, piso, luz = 'simples', objetos, largura = 320, rotulo }: Props) {
  const uid = useId().replace(/:/g, '');
  const W = 320, H = 180, CHAO = 132;
  const externo = EXTERNOS.has(tipo);
  const corParede = parede?.cor ?? (externo ? '#bcd7e6' : '#e9e3d8');
  const corPiso = piso?.cor ?? (tipo === 'banheiro' || tipo === 'cozinha' ? '#cfc6b6' : '#b9a68a');
  const detalhe = largura >= 200;
  // Os objetos no chão, da esquerda para a direita, em escala; se não cabem, todos encolhem juntos.
  const fixos = FIXOS[tipo]?.largura ?? 0;
  const itens = objetos.map(o => ({ ...o, w: LARGURA[o.coisaId] ?? PADRAO })).sort((a, b) => b.w - a.w);
  const livre = W - 24 - fixos;
  const soma = itens.reduce((s, x) => s + x.w + 8, 0);
  const k = soma > livre ? livre / soma : 1;
  let x = 12 + fixos;
  const postos = itens.map(o => {
    const cor = valida(o.cor, valida(variantesDaCoisa(o.coisaId)[0]?.cor, '#a49a8c'));
    const a = amostraDoObjeto(o.coisaId, cor);
    const w = o.w * k;
    const h = w * a.vb[1] / a.vb[0];
    const chaoA = (a.chao ?? a.vb[1]) / a.vb[1] * h;
    const pos = { ...o, cor, w, h, x, y: CHAO + 10 - chaoA };
    x += w + 8 * k;
    return pos;
  });
  const quente = luz === 'quente' || luz === 'planejada' || luz === 'automacao';
  return (
    <svg className="cena-comodo" viewBox={`0 0 ${W} ${H}`} width={largura} height={Math.round(largura * H / W)} role="img" aria-label={rotulo} data-comodo={tipo} data-parede={parede?.id} data-piso={piso?.id} data-luz={luz}>
      <defs>
        <linearGradient id={`${uid}-luz`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={quente ? '#ffd9a0' : '#ffffff'} stopOpacity={quente ? 0.32 : 0.12} />
          <stop offset="1" stopColor={quente ? '#ffb86b' : '#ffffff'} stopOpacity={0} />
        </linearGradient>
        {parede?.id === 'tijolo' && <pattern id={`${uid}-tij`} width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill={corParede} /><path d="M0 9.5 H24 M12 0 V5 M0 5 H24 M6 5 V10 M18 5 V10" stroke={misturar(corParede, '#ffffff', 0.35)} strokeWidth="0.9" /></pattern>}
        {parede?.id === 'papel' && <pattern id={`${uid}-pap`} width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill={corParede} /><path d="M9 3 q3 3 0 6 q-3 -3 0 -6 M0 12 q3 3 0 6 M18 12 q-3 3 0 6" fill={misturar(corParede, '#5b4a2a', 0.35)} /></pattern>}
      </defs>
      {/* Parede (ou o céu, lá fora). */}
      <rect width={W} height={CHAO} fill={parede?.id === 'tijolo' ? `url(#${uid}-tij)` : parede?.id === 'papel' && detalhe ? `url(#${uid}-pap)` : corParede} />
      {parede?.id === 'boiserie' && detalhe && [24, 112, 200].map(bx => <rect key={bx} x={bx} y={44} width={78} height={70} rx={2} fill="none" stroke={misturar(corParede, '#000000', 0.12)} strokeWidth={1.4} />)}
      {externo && <><circle cx={262} cy={34} r={14} fill="#f6d77a" opacity={0.9} /><path d={`M0 ${CHAO - 26} q 60 -18 120 0 t 120 -4 t 80 2 V ${CHAO} H0 Z`} fill="#9fbf8f" opacity={0.6} /></>}
      {/* A janela (dentro de casa). */}
      {!externo && tipo !== 'cinema' && tipo !== 'banheiro' && (
        <g data-peca="janela">
          <rect x={204} y={26} width={84} height={62} rx={2} fill="#cfe3ee" stroke={misturar(corParede, '#000000', 0.3)} strokeWidth={3} />
          <path d="M246 26 V88 M204 57 H288" stroke={misturar(corParede, '#000000', 0.3)} strokeWidth={2} />
          {detalhe && <path d="M212 80 l 18 -20 l 10 10 l 12 -14 l 28 24 Z" fill="#a9c6a0" opacity={0.7} />}
        </g>
      )}
      {tipo === 'cinema' && <rect x={60} y={18} width={200} height={84} fill="#1d2430" stroke="#0f141b" strokeWidth={3} />}
      {/* O piso. */}
      <rect y={CHAO} width={W} height={H - CHAO} fill={externo && tipo !== 'garagem' ? '#86a86f' : corPiso} />
      {!externo && detalhe && (piso?.id === 'madeira' || piso?.id === 'vinilico') && [0, 1, 2, 3].map(i => <path key={i} d={`M0 ${CHAO + 8 + i * 11} H${W}`} stroke={misturar(corPiso, '#000000', 0.18)} strokeWidth={0.8} />)}
      {!externo && detalhe && (piso?.id === 'porcelanato' || piso?.id === 'ceramica' || (!piso && (tipo === 'banheiro' || tipo === 'cozinha'))) && <>{[1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M${i * 40} ${CHAO} L${i * 40 + (i - 4) * 6} ${H}`} stroke={misturar(corPiso, '#000000', 0.12)} strokeWidth={0.8} />)}<path d={`M0 ${CHAO + 22} H${W}`} stroke={misturar(corPiso, '#000000', 0.12)} strokeWidth={0.8} /></>}
      {!externo && detalhe && piso?.id === 'marmore' && <path d={`M20 ${CHAO + 30} q 40 -12 80 4 t 90 -6 M160 ${CHAO + 12} q 30 10 70 2`} stroke="#b9b3a8" strokeWidth={0.9} fill="none" />}
      {!externo && <rect y={CHAO - 3} width={W} height={4} fill={misturar(corParede, '#000000', 0.18)} />}
      {/* O que todo cômodo desse tipo tem. */}
      {FIXOS[tipo]?.desenho(CHAO, corParede)}
      {/* A luz. */}
      {!externo && luz === 'simples' && <g><path d="M160 0 V12" stroke="#5a5550" strokeWidth={1} /><circle cx={160} cy={15} r={4} fill="#fff6d8" /></g>}
      {!externo && luz === 'quente' && <g><path d="M30 60 l 8 -10 h10 l 8 10 Z" fill="#e6b873" /><circle cx={44} cy={62} r={9} fill="#ffcf7a" opacity={0.35} /></g>}
      {!externo && (luz === 'planejada' || luz === 'automacao') && <g><rect x={0} y={0} width={W} height={6} fill={misturar(corParede, '#ffffff', 0.5)} /><path d="M0 6 H320" stroke="#ffcf7a" strokeWidth={2} opacity={0.8} />{[110, 160, 210].map(px => <g key={px}><path d={`M${px} 6 V26`} stroke="#3a3530" strokeWidth={0.8} /><path d={`M${px - 7} 32 l 7 -6 l 7 6 Z`} fill="#2e2b28" /><circle cx={px} cy={33} r={2.4} fill="#ffe2a6" /></g>)}</g>}
      {!externo && luz === 'automacao' && <rect x={14} y={70} width={10} height={14} rx={2} fill="#22262b" stroke="#6fd3ff" strokeWidth={0.8} />}
      {/* Os objetos que estão aqui. */}
      {postos.map(o => (
        <g key={o.id} transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})`}>
          <Ilustracao a={amostraDoObjeto(o.coisaId, o.cor)} largura={o.w} rotulo="" className="cena-comodo__objeto" dados={{ 'data-coisa': o.coisaId }} />
        </g>
      ))}
      <rect width={W} height={H} fill={`url(#${uid}-luz)`} pointerEvents="none" />
    </svg>
  );
});

/** O que vem com o cômodo (desenhado, não comprado) e quanto do chão ocupa à esquerda. */
const FIXOS: Record<string, { largura: number; desenho: (chao: number, parede: string) => ReactElement }> = {
  cozinha: { largura: 118, desenho: chao => (
    <g data-peca="bancada">
      <rect x={10} y={chao - 44} width={110} height={46} fill="#e9e4da" stroke="#9c958a" strokeWidth={1} />
      <rect x={10} y={chao - 48} width={110} height={5} fill="#8a8178" />
      <rect x={18} y={chao - 36} width={32} height={30} fill="#d8d1c4" stroke="#9c958a" strokeWidth={0.8} /><circle cx={34} cy={chao - 21} r={1.4} fill="#6a635a" />
      <rect x={58} y={chao - 52} width={30} height={5} fill="#3b3835" />{[64, 82].map(cx => <circle key={cx} cx={cx} cy={chao - 50} r={2.4} fill="#1f1d1b" />)}
      <rect x={58} y={chao - 40} width={30} height={34} fill="#4a4743" /><rect x={62} y={chao - 34} width={22} height={14} fill="#2b2927" />
      <path d={`M100 ${chao - 48} v-10 q6 -4 8 2`} stroke="#9aa0a6" strokeWidth={1.6} fill="none" />
      <rect x={14} y={chao - 104} width={100} height={30} fill="#e2dccf" stroke="#9c958a" strokeWidth={0.8} />
    </g>) },
  banheiro: { largura: 140, desenho: chao => (
    <g data-peca="banheiro">
      <rect x={10} y={chao - 112} width={56} height={114} fill="#d9e8ee" opacity={0.55} stroke="#9fb3bb" strokeWidth={1.4} />
      <path d={`M24 ${chao - 112} v 10 q 0 6 8 6`} stroke="#8d969c" strokeWidth={2} fill="none" /><circle cx={34} cy={chao - 94} r={5} fill="#8d969c" />
      <rect x={80} y={chao - 46} width={34} height={8} rx={3} fill="#f4f4f2" stroke="#b7b3aa" strokeWidth={0.8} /><rect x={92} y={chao - 38} width={10} height={40} fill="#ecebe7" />
      <rect x={82} y={chao - 92} width={30} height={36} rx={3} fill="#cfdfe6" stroke="#9fb3bb" strokeWidth={1} />
      <path d={`M122 ${chao} v-22 h22 q6 0 6 8 q0 14 -14 14 Z`} fill="#f4f4f2" stroke="#b7b3aa" strokeWidth={0.8} /><rect x={120} y={chao - 40} width={14} height={20} rx={2} fill="#f4f4f2" stroke="#b7b3aa" strokeWidth={0.8} />
    </g>) },
  quarto: { largura: 0, desenho: () => <></> },
  jardim: { largura: 60, desenho: chao => (
    <g data-peca="arvore"><rect x={30} y={chao - 60} width={8} height={62} fill="#7a5a3a" /><circle cx={34} cy={chao - 70} r={26} fill="#5f8f4e" /><circle cx={20} cy={chao - 60} r={16} fill="#6f9f5c" /></g>) },
  piscina: { largura: 0, desenho: chao => (
    <g data-peca="piscina"><path d={`M30 ${chao + 8} h260 l 18 30 h-296 Z`} fill="#5fb6d6" stroke="#e8e4dc" strokeWidth={4} /><path d={`M70 ${chao + 22} q 20 -6 40 0 t 40 0 M170 ${chao + 28} q 20 -6 40 0`} stroke="#bfe6f2" strokeWidth={1.4} fill="none" /></g>) },
  lazer: { largura: 90, desenho: chao => (
    <g data-peca="churrasqueira"><rect x={14} y={chao - 70} width={70} height={72} fill="#b0654a" /><rect x={26} y={chao - 52} width={46} height={26} fill="#2b2522" /><rect x={34} y={chao - 104} width={30} height={36} fill="#9a5640" /></g>) },
  garagem: { largura: 0, desenho: chao => (
    <g data-peca="portao"><rect x={40} y={chao - 104} width={240} height={106} fill="#c9c4bb" stroke="#8f8a82" strokeWidth={2} />{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M40 ${chao - 92 + i * 12} H280`} stroke="#a9a49b" strokeWidth={1} />)}</g>) }
};
