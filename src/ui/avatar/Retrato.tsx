/**
 * Retrato procedural.
 *
 * Local, sem assets, modular. As proporções mudam com a idade — o bebê tem
 * cabeça grande, olhos baixos e quase nenhum cabelo; a criança, rosto
 * redondo; o adolescente alonga; o adulto define o queixo; o idoso ganha
 * rugas, cabelos brancos e, às vezes, entradas. Gênero muda mandíbula,
 * sobrancelha, cílios, lábios e o repertório de cabelo, sem caricatura.
 */

import { memo, type ReactElement } from 'react';
import type { Especie } from '../../motor/tipos';
import { animal, palavraDoBicho } from '../../motor/dados/animais';
import { FiguraCao, FiguraGato, morfologiaCao, morfologiaGato, type Porte } from './caesEGatos';
import type { Genero, Visual } from '../../motor/tipos';

const PELE: Record<string, [string, string]> = {
  p1: ['#f3d7c2', '#e2b99f'], p2: ['#e9c09d', '#d4a27e'], p3: ['#d49f75', '#bd8559'],
  p4: ['#b27b52', '#98643f'], p5: ['#8b5b3a', '#74482c'], p6: ['#5f3c27', '#4b2e1d']
};
const CABELO: Record<string, string> = {
  preto: '#1c1917', castanho_escuro: '#35251c', castanho: '#563a28', castanho_claro: '#86603f', loiro: '#caa25e', ruivo: '#a24a27',
  // Tinta (a partir da adolescência) e o grisalho assumido.
  platinado: '#e6e0cf', vermelho: '#a8232f', azul: '#2f5f9e', rosa: '#d9829e', grisalho: '#a9a39b'
};
const OLHOS: Record<string, string> = {
  castanho_escuro: '#2f1d14', castanho: '#553620', mel: '#86662b', verde: '#56764a', azul: '#4b75a0'
};
/**
 * O fundo do retrato: escolhido para contrastar AO MESMO TEMPO com o cabelo
 * e com a pele (cabelo preto não some no escuro; loiro e grisalho não somem
 * no claro). Entre os que contrastam bem, a semente escolhe — variedade.
 */
const FUNDOS = ['#efe4cf', '#e3ebe2', '#f0dcd6', '#dfe6f0', '#b8c7d4', '#c9b8cf', '#b9ccb8', '#d6bfa5', '#4a5c68', '#5b4b60', '#4a6052', '#6b5642'];
function luminancia(h: string): number {
  const c = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a: string, b: string) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export function fundoDoRetrato(cabelo: string, pele: string, semente: number): string {
  const nota = FUNDOS.map(f => ({ f, n: Math.min(contraste(f, cabelo) * 1.15, contraste(f, pele)) }));
  const melhor = Math.max(...nota.map(x => x.n));
  const bons = nota.filter(x => x.n >= melhor * 0.9);
  return bons[semente % bons.length].f;
}

const ROUPA = ['#4b5a6b', '#6b4f5a', '#4f6b5a', '#7a6248', '#5a5470', '#3f5f66', '#735a4a', '#556048'];
/** O jeito de vestir escolhido muda a paleta e o recorte da roupa (sem virar figurino). */
const ROUPA_ESTILO: Record<string, string[]> = {
  social: ['#2c3440', '#3b3b46', '#29384a'], esportiva: ['#2f6f8f', '#b0493c', '#3f7a52'], alternativa: ['#8a5a2b', '#6b3f73', '#2f6b66'], elegante: ['#1d1f24', '#3a2430', '#1f2d3a']
};

type Fase = 'bebe' | 'crianca' | 'pre' | 'adol' | 'adulto' | 'meia' | 'idoso';

function faseDe(i: number): Fase {
  if (i <= 2) return 'bebe';
  if (i <= 8) return 'crianca';
  if (i <= 12) return 'pre';
  if (i <= 17) return 'adol';
  if (i <= 44) return 'adulto';
  if (i <= 64) return 'meia';
  return 'idoso';
}

function misturar(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(k => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map(k => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((x, k) => Math.round(x + (pb[k] - x) * t).toString(16).padStart(2, '0')).join('');
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

interface Props {
  visual?: Visual;
  genero: Genero;
  idade: number;
  /** Semente estável para detalhes (cor de roupa, pequenas assimetrias). */
  semente?: string;
  tamanho?: number;
  rotulo?: string;
  especie?: Especie;
  falecido?: boolean;
  /**
   * Como a pessoa está (do estado real, não sorteado): muda boca,
   * sobrancelha, pálpebra e cor do rosto — o mesmo rosto, noutro dia.
   */
  expressao?: Expressao;
  /** Pet: o porte (de `pessoa.pet.porte`) — entra na morfologia do cão. */
  porte?: Porte;
}

export type Expressao = 'bem' | 'neutro' | 'cansado' | 'abatido' | 'tenso' | 'doente';

export const Retrato = memo(function Retrato({ visual, genero, idade, semente = '', tamanho = 64, rotulo, especie, falecido, expressao = 'neutro', porte }: Props) {
  if (especie) return <RetratoPet especie={especie} tamanho={tamanho} rotulo={rotulo} semente={semente} porte={porte} />;
  const v: Visual = visual ?? { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho' };
  const f = faseDe(idade);
  const fem = genero === 'feminino';
  const masc = genero === 'masculino';
  const h = hash(semente || v.pele + v.cabelo);
  const [peleBase, sombraBase] = PELE[v.pele] ?? PELE.p3;
  // Doença tira a cor do rosto; um pouco, sem virar caricatura.
  const pele = expressao === 'doente' ? misturar(peleBase, '#b7b3ab', 0.22) : peleBase;
  const sombra = expressao === 'doente' ? misturar(sombraBase, '#9d978e', 0.2) : sombraBase;
  const x = expressao;

  // Cabelo envelhece (a tinta, não: quem pinta, pinta a raiz também)
  let cor = CABELO[v.corCabelo] ?? CABELO.castanho;
  const tinta = ['platinado', 'vermelho', 'azul', 'rosa', 'grisalho'].includes(v.corCabelo);
  if (f === 'meia' && !tinta) cor = misturar(cor, '#b8b2aa', idade >= 55 ? 0.45 : 0.22);
  if (f === 'idoso' && !tinta) cor = misturar(cor, '#ddd8d0', idade >= 78 ? 0.9 : 0.7);
  if (f === 'bebe' || f === 'crianca') cor = misturar(cor, '#caa25e', v.corCabelo === 'preto' || v.corCabelo === 'castanho_escuro' ? 0.05 : 0.2);

  // Geometria por fase
  const G = {
    bebe:    { w: 46, hh: 44, cy: 52, jaw: 0.34, olho: 3.9, olhoY: 3.5, esp: 9.5, corpo: 0.62 },
    crianca: { w: 42, hh: 46, cy: 48, jaw: 0.3, olho: 3.2, olhoY: 1.5, esp: 8.6, corpo: 0.75 },
    pre:     { w: 39, hh: 47, cy: 46, jaw: 0.26, olho: 2.8, olhoY: 0.5, esp: 8.2, corpo: 0.85 },
    adol:    { w: 36, hh: 47, cy: 45, jaw: 0.22, olho: 2.6, olhoY: -0.5, esp: 7.8, corpo: 0.95 },
    adulto:  { w: 35, hh: 46, cy: 44, jaw: 0.2, olho: 2.5, olhoY: -1, esp: 7.6, corpo: 1 },
    meia:    { w: 35.5, hh: 46, cy: 44, jaw: 0.21, olho: 2.4, olhoY: -1, esp: 7.6, corpo: 1 },
    idoso:   { w: 35.5, hh: 45.5, cy: 45, jaw: 0.22, olho: 2.3, olhoY: -0.5, esp: 7.6, corpo: 0.98 }
  }[f];
  const adultoOuAdol = f === 'adol' || f === 'adulto' || f === 'meia' || f === 'idoso';
  // REWORK 4: os traços modulares herdados (rosto, olhos, nariz, boca, sobrancelha). Ausentes: o desenho de sempre.
  const ro = v.rosto;
  const fw = ro === 'redondo' ? 1.04 : ro === 'longo' ? 0.95 : ro === 'coracao' ? 1.02 : 1;
  const fh = ro === 'longo' ? 1.05 : ro === 'redondo' ? 0.97 : 1;
  const fj = ro === 'quadrado' ? 1.35 : ro === 'redondo' ? 1.2 : ro === 'coracao' ? 0.72 : ro === 'longo' ? 0.9 : 1;
  const w = G.w * (adultoOuAdol && masc ? 1.04 : adultoOuAdol && fem ? 0.97 : 1) * (f === 'bebe' ? 1 : fw);
  const hh = G.hh * (f === 'bebe' ? 1 : fh);
  const cx = 50;
  const cy = G.cy;
  const topo = cy - hh / 2;
  const queixo = cy + hh / 2;
  const jaw = w * (adultoOuAdol ? (masc ? G.jaw + 0.07 : fem ? G.jaw - 0.02 : G.jaw + 0.02) : G.jaw) * (f === 'bebe' ? 1 : fj);
  const formaOlho = f === 'bebe' ? undefined : v.olhosForma;
  const olhoRx = formaOlho === 'puxado' ? 1.22 : formaOlho === 'redondo' ? 1.08 : 1.15;
  const olhoRy = formaOlho === 'puxado' ? 0.62 : formaOlho === 'redondo' ? 1.1 : formaOlho === 'caido' ? 0.88 : 0.95;
  const grossura = v.sobrancelha === 'fina' ? 0.7 : v.sobrancelha === 'grossa' ? 1.45 : 1;

  const rosto = `M ${cx - w / 2} ${cy}
    C ${cx - w / 2} ${cy - hh * 0.63} ${cx + w / 2} ${cy - hh * 0.63} ${cx + w / 2} ${cy}
    C ${cx + w / 2} ${cy + hh * 0.3} ${cx + jaw} ${queixo} ${cx} ${queixo}
    C ${cx - jaw} ${queixo} ${cx - w / 2} ${cy + hh * 0.3} ${cx - w / 2} ${cy} Z`;

  const roupa = f === 'bebe' ? ['#c9d6e3', '#e3cdd6', '#d7e0c8', '#e6dcc4'][h % 4] : v.roupa && ROUPA_ESTILO[v.roupa] ? ROUPA_ESTILO[v.roupa][h % ROUPA_ESTILO[v.roupa].length] : ROUPA[h % ROUPA.length];
  const ombro = 30 * G.corpo * (adultoOuAdol && masc ? 1.12 : 1);
  const pescocoW = f === 'bebe' ? 0 : w * (masc && adultoOuAdol ? 0.36 : 0.3);
  const corpoTopo = queixo + (f === 'bebe' ? -2 : 4);

  const olhoY = cy + G.olhoY;
  const esp = G.esp;
  const iris = OLHOS[v.olhos] ?? OLHOS.castanho;
  const estilo = f === 'bebe' ? 'bebe' : v.cabelo;
  const calvo = f === 'idoso' && masc && (h % 3 !== 0) || (f === 'meia' && masc && h % 5 === 0);

  const fundo = fundoDoRetrato(cor, pele, h);
  return (
    <svg
      className={`retrato retrato--${f}${falecido ? ' retrato--falecido' : ''} retrato--${expressao}`}
      viewBox="10 8 80 80" width={tamanho} height={tamanho} style={{ background: fundo }}
      role="img" aria-label={rotulo ?? 'Retrato'}
    >
      {/* Cabelo de trás */}
      <CabeloAtras estilo={estilo} cor={cor} cx={cx} cy={cy} w={w} hh={hh} fase={f} />

      {/* Corpo */}
      <path d={`M ${cx - ombro} 101 C ${cx - ombro} ${corpoTopo + 10} ${cx - ombro * 0.55} ${corpoTopo + 3} ${cx} ${corpoTopo + 3}
               C ${cx + ombro * 0.55} ${corpoTopo + 3} ${cx + ombro} ${corpoTopo + 10} ${cx + ombro} 101 Z`} fill={roupa} />
      {pescocoW > 0 && (
        <path d={`M ${cx - pescocoW / 2} ${queixo - 6} L ${cx - pescocoW / 2} ${corpoTopo + 5} Q ${cx} ${corpoTopo + 9} ${cx + pescocoW / 2} ${corpoTopo + 5} L ${cx + pescocoW / 2} ${queixo - 6} Z`} fill={sombra} />
      )}
      {f !== 'bebe' && (
        <path d={fem ? `M ${cx - pescocoW * 0.9} ${corpoTopo + 4} Q ${cx} ${corpoTopo + 14} ${cx + pescocoW * 0.9} ${corpoTopo + 4}` : `M ${cx - pescocoW * 0.75} ${corpoTopo + 3.5} L ${cx} ${corpoTopo + 10} L ${cx + pescocoW * 0.75} ${corpoTopo + 3.5}`}
          fill="none" stroke={misturar(roupa, '#000000', 0.25)} strokeWidth={1.4} strokeLinejoin="round" />
      )}
      {/* Gola de camisa (social, elegante) e a faixa do agasalho (esportiva). */}
      {f !== 'bebe' && (v.roupa === 'social' || v.roupa === 'elegante') && (
        <path d={`M ${cx - pescocoW * 0.95} ${corpoTopo + 3} L ${cx - 1.5} ${corpoTopo + 11} L ${cx - pescocoW * 0.2} ${corpoTopo + 3} Z M ${cx + pescocoW * 0.95} ${corpoTopo + 3} L ${cx + 1.5} ${corpoTopo + 11} L ${cx + pescocoW * 0.2} ${corpoTopo + 3} Z`} fill="#eeeae2" opacity={0.92} />
      )}
      {f !== 'bebe' && v.roupa === 'esportiva' && (
        <path d={`M ${cx - ombro * 0.62} ${corpoTopo + 12} L ${cx - ombro * 0.62} 101 M ${cx + ombro * 0.62} ${corpoTopo + 12} L ${cx + ombro * 0.62} 101`} stroke="#f2efe8" strokeWidth={1.6} opacity={0.8} />
      )}

      {/* A joia no pescoço (a corrente), quando é o que está em uso. */}
      {f !== 'bebe' && f !== 'crianca' && (v.joia === 'corrente' || v.joia === 'corrente_ouro') && (
        <path className="retrato__joia" d={`M ${cx - pescocoW * 0.72} ${corpoTopo + 3.6} Q ${cx} ${corpoTopo + 11.5} ${cx + pescocoW * 0.72} ${corpoTopo + 3.6}`} fill="none" stroke={v.joia === 'corrente_ouro' ? '#c9a14a' : '#c9ccd1'} strokeWidth={0.9} strokeLinecap="round" />
      )}

      {/* Orelhas */}
      <ellipse cx={cx - w / 2 + 0.6} cy={olhoY + 3} rx={2.6} ry={4} fill={sombra} />
      <ellipse cx={cx + w / 2 - 0.6} cy={olhoY + 3} rx={2.6} ry={4} fill={sombra} />

      {/* Rosto */}
      <path d={rosto} fill={pele} />
      {/* Brincos: um ponto de luz na ponta da orelha. */}
      {f !== 'bebe' && v.joia === 'brincos' && (
        <g className="retrato__joia" fill="#d8b45a">
          <circle cx={cx - w / 2 + 0.2} cy={olhoY + 7.4} r={1} />
          <circle cx={cx + w / 2 - 0.2} cy={olhoY + 7.4} r={1} />
        </g>
      )}
      {(f === 'bebe' || f === 'crianca') && (
        <>
          <ellipse cx={cx - esp - 2} cy={olhoY + 7} rx={4} ry={2.6} fill="#e8889a" opacity={0.22} />
          <ellipse cx={cx + esp + 2} cy={olhoY + 7} rx={4} ry={2.6} fill="#e8889a" opacity={0.22} />
        </>
      )}

      {/* Sobrancelhas */}
      {f !== 'bebe' && (
        <g stroke={f === 'idoso' ? misturar(cor, '#8a8580', 0.3) : misturar(cor, '#000000', 0.15)} strokeLinecap="round" fill="none"
           strokeWidth={(masc && adultoOuAdol ? 1.9 : 1.25) * grossura}>
          {/* Sobrancelha: o canto de dentro sobe na tristeza, desce na tensão. */}
          <path d={`M ${cx - esp - 3.4} ${olhoY - 4.6 - (x === 'bem' ? 0.5 : 0)} Q ${cx - esp} ${olhoY - 6.2 - (x === 'bem' ? 0.6 : 0)} ${cx - esp + 3.2} ${olhoY - 4.8 + (x === 'tenso' ? 1.1 : x === 'abatido' || x === 'doente' ? -1.3 : 0)}`} />
          <path d={`M ${cx + esp - 3.2} ${olhoY - 4.8 + (x === 'tenso' ? 1.1 : x === 'abatido' || x === 'doente' ? -1.3 : 0)} Q ${cx + esp} ${olhoY - 6.2 - (x === 'bem' ? 0.6 : 0)} ${cx + esp + 3.4} ${olhoY - 4.6 - (x === 'bem' ? 0.5 : 0)}`} />
        </g>
      )}

      {/* Olhos */}
      {[-1, 1].map(lado => (
        <g key={lado}>
          <ellipse cx={cx + lado * esp} cy={olhoY} rx={G.olho * olhoRx} ry={G.olho * (f === 'idoso' ? 0.8 : olhoRy)} fill="#f7f2ea" />
          <circle cx={cx + lado * esp} cy={olhoY + 0.2} r={G.olho * Math.min(0.72, olhoRy * 0.82)} fill={iris} />
          <circle cx={cx + lado * esp} cy={olhoY + 0.2} r={G.olho * Math.min(0.36, olhoRy * 0.42)} fill="#141110" />
          <circle cx={cx + lado * esp + G.olho * 0.28} cy={olhoY - G.olho * 0.3 * olhoRy} r={G.olho * 0.22} fill="#ffffff" opacity={0.85} />
          {/* A pálpebra: puxada (a linha de cima mais longa e reta), caída (o canto de fora desce). */}
          {formaOlho === 'puxado' && <path d={`M ${cx + lado * esp - G.olho * 1.3} ${olhoY - G.olho * 0.45} Q ${cx + lado * esp} ${olhoY - G.olho * 0.9} ${cx + lado * esp + G.olho * 1.35} ${olhoY - G.olho * 0.6}`} fill="none" stroke={misturar(sombra, '#000000', 0.35)} strokeWidth={0.7} strokeLinecap="round" />}
          {formaOlho === 'caido' && <path d={`M ${cx + lado * esp - lado * G.olho * 0.4} ${olhoY - G.olho * 0.95} Q ${cx + lado * esp + lado * G.olho * 0.6} ${olhoY - G.olho * 0.95} ${cx + lado * esp + lado * G.olho * 1.3} ${olhoY - G.olho * 0.2}`} fill="none" stroke={misturar(sombra, '#000000', 0.3)} strokeWidth={0.7} strokeLinecap="round" />}
          {fem && adultoOuAdol && (
            <path d={`M ${cx + lado * (esp + G.olho * 1.05)} ${olhoY - 0.6} l ${lado * 1.6} -1.4`} stroke="#1c1917" strokeWidth={0.9} strokeLinecap="round" />
          )}
        </g>
      ))}

      {/* Cansaço: pálpebra caída e olheira. */}
      {f !== 'bebe' && (x === 'cansado' || x === 'doente' || x === 'abatido') && [-1, 1].map(lado => (
        <g key={`p${lado}`}>
          <path d={`M ${cx + lado * esp - G.olho * 1.25} ${olhoY - G.olho * 0.2} Q ${cx + lado * esp} ${olhoY - G.olho * (x === 'abatido' ? 1.05 : 1.3)} ${cx + lado * esp + G.olho * 1.25} ${olhoY - G.olho * 0.2} L ${cx + lado * esp + G.olho * 1.25} ${olhoY - G.olho * 1.3} L ${cx + lado * esp - G.olho * 1.25} ${olhoY - G.olho * 1.3} Z`} fill={pele} />
          <path d={`M ${cx + lado * esp - G.olho * 1.05} ${olhoY + G.olho * 1.15} q ${G.olho * 1.05} ${G.olho * 0.7} ${G.olho * 2.1} 0`} fill="none" stroke={misturar(sombra, '#4a3a4a', 0.35)} strokeWidth={0.7} opacity={x === 'abatido' ? 0.35 : 0.6} strokeLinecap="round" />
        </g>
      ))}

      {/* Rugas e marcas do tempo */}
      {(f === 'meia' || f === 'idoso') && (
        <g stroke={misturar(sombra, '#000000', 0.2)} strokeWidth={0.6} fill="none" opacity={f === 'idoso' ? 0.75 : 0.45} strokeLinecap="round">
          <path d={`M ${cx - esp - 5.5} ${olhoY + 1.5} q -1.5 1.2 -1.4 2.8`} />
          <path d={`M ${cx + esp + 5.5} ${olhoY + 1.5} q 1.5 1.2 1.4 2.8`} />
          {f === 'idoso' && <path d={`M ${cx - 7} ${topo + hh * 0.2} q 7 -1.6 14 0`} />}
          <path d={`M ${cx - 6.5} ${olhoY + 9} q -1.2 3 0.2 5.5`} />
          <path d={`M ${cx + 6.5} ${olhoY + 9} q 1.2 3 -0.2 5.5`} />
        </g>
      )}

      {/* Nariz */}
      <path d={f === 'bebe' || f === 'crianca'
        ? `M ${cx - 1.6 * (v.nariz === 'largo' ? 1.3 : v.nariz === 'fino' ? 0.8 : 1)} ${olhoY + 6.2} q ${1.6 * (v.nariz === 'largo' ? 1.3 : v.nariz === 'fino' ? 0.8 : 1)} 1.4 ${3.2 * (v.nariz === 'largo' ? 1.3 : v.nariz === 'fino' ? 0.8 : 1)} 0`
        : v.nariz === 'largo' ? `M ${cx - 0.4} ${olhoY + 1.5} L ${cx - 1.4} ${olhoY + 6.6} Q ${cx - 3.4} ${olhoY + 7.6} ${cx - 2.2} ${olhoY + 8.6} Q ${cx} ${olhoY + 9.4} ${cx + 2.2} ${olhoY + 8.6} Q ${cx + 3.4} ${olhoY + 7.6} ${cx + 1.6} ${olhoY + 6.8}`
          : v.nariz === 'fino' ? `M ${cx - 0.3} ${olhoY + 1.5} L ${cx - 1.1} ${olhoY + 7.8} Q ${cx} ${olhoY + 8.6} ${cx + 1.2} ${olhoY + 7.8}`
            : v.nariz === 'arrebitado' ? `M ${cx - 0.4} ${olhoY + 2.5} Q ${cx - 1.8} ${olhoY + 6.4} ${cx - 1.5} ${olhoY + 7.2} Q ${cx} ${olhoY + 7.4} ${cx + 1.7} ${olhoY + 6.6}`
              : `M ${cx - 0.4} ${olhoY + 1.5} L ${cx - 1.6} ${olhoY + 7.6} Q ${cx} ${olhoY + 8.8} ${cx + 1.8} ${olhoY + 7.6}`}
        fill="none" stroke={misturar(sombra, '#000000', 0.12)} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />

      {/* Boca */}
      {f === 'bebe'
        ? <ellipse cx={cx} cy={olhoY + 11} rx={2.4} ry={1.4} fill="#c7707a" />
        : (() => {
            // A boca muda de curva: sorriso, reta de quem aperta os dentes, canto que cai.
            const larg = (fem ? 3.6 : 3.8) * (x === 'tenso' ? 0.85 : x === 'bem' ? 1.08 : 1);
            const curva = x === 'bem' ? (fem ? 3.4 : 2.8) : x === 'tenso' ? 0.3 : x === 'abatido' ? -1.6 : x === 'doente' ? -0.7 : x === 'cansado' ? 0.8 : fem ? 2.4 : 1.6;
            const cantos = olhoY + 12.2 + (x === 'abatido' ? 0.8 : 0);
            const lb = v.boca === 'fina' ? 0.92 : v.boca === 'cheia' ? 1.08 : 1;
            const traco = (fem && adultoOuAdol ? (curva > 1 ? 0.8 : 1.2) : 1.3) * (v.boca === 'fina' ? 0.75 : v.boca === 'cheia' ? 1.15 : 1);
            return (
              <>
                {/* A boca cheia: o lábio de baixo aparece, em qualquer rosto. */}
                {v.boca === 'cheia' && <path d={`M ${cx - larg * lb * 0.8} ${cantos + 0.6} Q ${cx} ${cantos + Math.max(curva, 0.4) + 2.4} ${cx + larg * lb * 0.8} ${cantos + 0.6}`} fill={misturar(sombra, '#a0505a', 0.35)} opacity={0.55} />}
                <path d={`M ${cx - larg * lb} ${cantos} Q ${cx} ${cantos + curva} ${cx + larg * lb} ${cantos}`}
                  fill={fem && adultoOuAdol && curva > 1 ? '#b9606b' : 'none'} stroke={fem && adultoOuAdol ? '#a85460' : misturar(sombra, '#6a2e2e', 0.45)} strokeWidth={traco} strokeLinecap="round" />
              </>
            );
          })()}

      {/* Barba e bigode: de quem tem (a escolha é da pessoa; a barba aparece do fim da adolescência em diante) */}
      {!fem && (f === 'adol' && idade >= 16 || f === 'adulto' || f === 'meia' || f === 'idoso') && v.barba && (
        <Barba tipo={v.barba} bigode={v.bigode !== false} cor={f === 'idoso' ? misturar(cor, '#e6e2dc', 0.3) : misturar(cor, '#000000', 0.05)} cx={cx} olhoY={olhoY} w={w} queixo={queixo} jaw={jaw} />
      )}

      {/* Óculos: os escolhidos; sem escolha, parte dos idosos usa os de leitura */}
      {v.oculos ? <Oculos tipo={v.oculos} cx={cx} olhoY={olhoY} esp={esp} /> : f === 'idoso' && h % 2 === 0 && <Oculos tipo="grau" cx={cx} olhoY={olhoY} esp={esp} />}

      {/* Cabelo da frente */}
      <CabeloFrente estilo={estilo} cor={cor} cx={cx} cy={cy} w={w} hh={hh} fase={f} calvo={calvo} semente={h} fem={fem} />

      {/* O que vai na cabeça */}
      {v.chapeu && f !== 'bebe' && <Chapeu tipo={v.chapeu} cx={cx} cy={cy} w={w} hh={hh} semente={h} />}
    </svg>
  );
});

/* ---------------------------------------------------------------- Cabelo */

interface CabeloProps { estilo: string; cor: string; cx: number; cy: number; w: number; hh: number; fase: Fase }

/** Calota de cabelo com linha de testa configurável. */
function calota(cx: number, cy: number, w: number, hh: number, o: { volume?: number; testa?: number; franja?: number; lado?: number; temporas?: number }) {
  const vol = o.volume ?? 1.5;
  const testaY = cy - hh * (o.testa ?? 0.22);
  const tempY = cy + (o.temporas ?? -hh * 0.02);
  const L = cx - w / 2 - vol * 0.6;
  const R = cx + w / 2 + vol * 0.6;
  const topoY = cy - hh * 0.5 - vol;
  const lado = o.lado ?? 0;
  const franja = o.franja ?? 3;
  return `M ${L} ${tempY}
    C ${L - 0.5} ${topoY + hh * 0.08} ${cx - w * 0.3} ${topoY} ${cx} ${topoY}
    C ${cx + w * 0.3} ${topoY} ${R + 0.5} ${topoY + hh * 0.08} ${R} ${tempY}
    C ${R - 1.8} ${testaY + 2} ${cx + w * 0.25 + lado} ${testaY - 1} ${cx + lado * 2} ${testaY + franja}
    C ${cx - w * 0.25 + lado} ${testaY - 1} ${L + 1.8} ${testaY + 2} ${L} ${tempY} Z`;
}

function CabeloAtras({ estilo, cor, cx, cy, w, hh, fase }: CabeloProps) {
  const escuro = misturar(cor, '#000000', 0.18);
  const topo = cy - hh / 2;
  const longo = (y: number, ondas: boolean) => {
    const L = cx - w / 2 - 3;
    const R = cx + w / 2 + 3;
    const baixo = Math.min(99, y);
    if (!ondas) return `M ${L} ${cy - 4} C ${L - 1} ${topo - 2} ${R + 1} ${topo - 2} ${R} ${cy - 4} L ${R + 2} ${baixo} Q ${cx} ${baixo + 3} ${L - 2} ${baixo} Z`;
    return `M ${L} ${cy - 4} C ${L - 1} ${topo - 2} ${R + 1} ${topo - 2} ${R} ${cy - 4}
      Q ${R + 5} ${cy + 10} ${R + 1} ${cy + 18} Q ${R + 6} ${cy + 28} ${R + 2} ${baixo}
      Q ${cx} ${baixo + 4} ${L - 2} ${baixo} Q ${L - 6} ${cy + 28} ${L - 1} ${cy + 18} Q ${L - 5} ${cy + 10} ${L} ${cy - 4} Z`;
  };
  const curto = fase === 'crianca' || fase === 'pre';
  switch (estilo) {
    case 'longo_liso': return <path d={longo(curto ? cy + 22 : cy + 40, false)} fill={escuro} />;
    case 'longo_ondulado': return <path d={longo(curto ? cy + 22 : cy + 40, true)} fill={escuro} />;
    case 'chanel': return <path d={longo(cy + 14, false)} fill={escuro} />;
    case 'cacheado_longo': return <Cachos cx={cx} cy={cy + 8} rx={w / 2 + 9} ry={hh / 2 + 10} cor={escuro} n={20} r={6.5} />;
    case 'black': return <Cachos cx={cx} cy={cy - 4} rx={w / 2 + 9} ry={hh / 2 + 7} cor={escuro} n={22} r={7} cheio />;
    case 'trancas':
      return (
        <g fill={escuro}>
          {[-1, 1].map(l => <path key={l} d={`M ${cx + l * (w / 2 - 1)} ${cy - 2} q ${l * 4} 20 ${l * 2} ${curto ? 26 : 42} l ${-l * 4} 0 q ${l * 1} -22 ${-l * 2} -40 Z`} />)}
        </g>
      );
    case 'rabo': return <path d={`M ${cx + w / 2 - 2} ${cy - hh * 0.3} q 9 6 6 ${curto ? 20 : 28} q -2 6 -5 2 q 1 -16 -5 -26 Z`} fill={escuro} />;
    case 'coque': return <circle cx={cx} cy={topo - 4} r={7.5} fill={cor} />;
    default: return null;
  }
}

function Cachos({ cx, cy, rx, ry, cor, n, r, cheio, frente }: { cx: number; cy: number; rx: number; ry: number; cor: string; n: number; r: number; cheio?: boolean; frente?: boolean }) {
  const pts = Array.from({ length: n }, (_, k) => {
    const a = Math.PI + (k / (n - 1)) * Math.PI * (cheio ? 1 : 1);
    const ang = cheio ? (k / n) * Math.PI * 2 : a;
    return [cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry * (cheio ? 1 : 1.05)];
  });
  return (
    <g fill={cor}>
      {cheio && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />}
      {!cheio && !frente && <path d={`M ${cx - rx} ${cy + ry * 0.6} Q ${cx - rx - 2} ${cy - ry} ${cx} ${cy - ry} Q ${cx + rx + 2} ${cy - ry} ${cx + rx} ${cy + ry * 0.6} Z`} />}
      {pts.filter(([, y]) => !frente || y < cy - ry * 0.35).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={r * (0.85 + (k % 3) * 0.1)} />)}
    </g>
  );
}

function CabeloFrente({ estilo, cor, cx, cy, w, hh, fase, calvo, semente, fem }: CabeloProps & { calvo: boolean; semente: number; fem: boolean }) {
  const brilho = misturar(cor, '#ffffff', 0.12);
  const topo = cy - hh / 2;
  if (estilo === 'bebe') {
    // Poucos fios: uma mecha e uma penugem.
    return (
      <g fill="none" stroke={cor} strokeLinecap="round" opacity={0.85}>
        <path d={`M ${cx - 3} ${topo + 2} q 3 -5 6 -1`} strokeWidth={1.6} />
        <path d={`M ${cx + 1} ${topo + 1.5} q 3 -4 5 0`} strokeWidth={1.3} />
        <path d={calota(cx, cy, w * 0.92, hh, { volume: -0.5, testa: 0.36, franja: 0 })} fill={cor} stroke="none" opacity={0.18} />
      </g>
    );
  }
  if (calvo) {
    // Entradas ou calvície: sobra a coroa e as laterais.
    return (
      <g fill={cor}>
        <path d={`M ${cx - w / 2 - 0.5} ${cy + 2} C ${cx - w / 2 - 1} ${cy - hh * 0.2} ${cx - w / 2 + 3} ${cy - hh * 0.32} ${cx - w / 2 + 5} ${cy - hh * 0.28} L ${cx - w / 2 + 3} ${cy + 1} Z`} />
        <path d={`M ${cx + w / 2 + 0.5} ${cy + 2} C ${cx + w / 2 + 1} ${cy - hh * 0.2} ${cx + w / 2 - 3} ${cy - hh * 0.32} ${cx + w / 2 - 5} ${cy - hh * 0.28} L ${cx + w / 2 - 3} ${cy + 1} Z`} />
        {semente % 2 === 0 && <path d={`M ${cx - 9} ${topo + 2.5} q 9 -3.5 18 0`} fill="none" stroke={cor} strokeWidth={1.2} opacity={0.5} />}
      </g>
    );
  }
  const curto = fase === 'crianca' || fase === 'pre';
  switch (estilo) {
    case 'raspado':
      return <path d={calota(cx, cy, w, hh, { volume: 0.2, testa: 0.28, franja: 1, temporas: -hh * 0.08 })} fill={cor} opacity={0.82} />;
    case 'curto':
      return <path d={calota(cx, cy, w, hh, { volume: 2.2, testa: 0.24, franja: 2.5 })} fill={cor} />;
    case 'curto_lado':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 2.6, testa: 0.24, franja: 1, lado: -5 })} fill={cor} />
          <path d={`M ${cx - 6} ${topo + 1} q 7 2 14 7`} stroke={brilho} strokeWidth={0.8} fill="none" opacity={0.6} />
        </g>
      );
    case 'ondulado':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 3.2, testa: 0.2, franja: 4, lado: 3 })} />
          <path d={`M ${cx - w / 2 - 1.5} ${cy} q -2 5 0 9 q 3 -3 3 -9 Z M ${cx + w / 2 + 1.5} ${cy} q 2 5 0 9 q -3 -3 -3 -9 Z`} />
        </g>
      );
    case 'crespo_curto':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 3.2, testa: 0.25, franja: 0.5 })} />
          {Array.from({ length: 11 }, (_, k) => {
            const a = Math.PI * (1.05 + (k / 10) * 0.9);
            return <circle key={k} cx={cx + Math.cos(a) * (w / 2 + 1.5)} cy={cy - 2 + Math.sin(a) * (hh / 2 + 2)} r={2.4} />;
          })}
        </g>
      );
    case 'cacheado':
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 2.5} ry={hh / 2 + 1.5} cor={cor} n={13} r={4.2} frente />
          <path d={calota(cx, cy, w, hh, { volume: 3.5, testa: 0.22, franja: 2.5 })} fill={cor} />
        </g>
      );
    case 'black':
      return <path d={calota(cx, cy, w, hh, { volume: 4, testa: 0.24, franja: 1 })} fill={cor} />;
    case 'cacheado_longo':
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 3} ry={hh / 2 + 2} cor={cor} n={14} r={4.6} frente />
          <path d={calota(cx, cy, w, hh, { volume: 3.5, testa: 0.22, franja: 3, lado: 4 })} fill={cor} />
        </g>
      );
    case 'longo_liso':
    case 'longo_ondulado':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 2.5, testa: 0.2, franja: curto ? 5 : 3, lado: fem ? 4 : 2 })} />
          <path d={`M ${cx - w / 2 - 2} ${cy - 4} L ${cx - w / 2 + 2} ${cy + (curto ? 12 : 20)} L ${cx - w / 2 - 3} ${cy + (curto ? 14 : 24)} Z`} />
          <path d={`M ${cx + w / 2 + 2} ${cy - 4} L ${cx + w / 2 - 2} ${cy + (curto ? 12 : 20)} L ${cx + w / 2 + 3} ${cy + (curto ? 14 : 24)} Z`} />
        </g>
      );
    case 'chanel':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 2.6, testa: 0.18, franja: 6 })} />
          <path d={`M ${cx - w / 2 - 2.5} ${cy - 2} L ${cx - w / 2 + 1} ${cy + 12} L ${cx - w / 2 - 3} ${cy + 13} Z M ${cx + w / 2 + 2.5} ${cy - 2} L ${cx + w / 2 - 1} ${cy + 12} L ${cx + w / 2 + 3} ${cy + 13} Z`} />
        </g>
      );
    case 'coque':
    case 'rabo':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 1.2, testa: 0.25, franja: 0.5 })} fill={cor} />
          <path d={`M ${cx - w * 0.3} ${topo + 3} q ${w * 0.3} -4 ${w * 0.6} 0`} stroke={brilho} strokeWidth={0.7} fill="none" opacity={0.5} />
        </g>
      );
    case 'trancas':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 1.6, testa: 0.24, franja: 0.5 })} fill={cor} />
          {[-6, 0, 6].map(dx => <path key={dx} d={`M ${cx + dx} ${topo - 0.5} L ${cx + dx * 1.3} ${cy - hh * 0.2}`} stroke={misturar(cor, '#000000', 0.3)} strokeWidth={0.7} />)}
        </g>
      );
    default:
      return <path d={calota(cx, cy, w, hh, { volume: 2, testa: 0.24, franja: 2 })} fill={cor} />;
  }
}

function Oculos({ tipo, cx, olhoY, esp }: { tipo: 'grau' | 'redondo' | 'sol'; cx: number; olhoY: number; esp: number }) {
  const lente = tipo === 'sol' ? '#1e2227' : 'none';
  return (
    <g fill={lente} fillOpacity={tipo === 'sol' ? 0.82 : 0} stroke="#2a2522" strokeWidth={tipo === 'redondo' ? 1.1 : 0.9} opacity={0.95}>
      {tipo === 'redondo'
        ? <><circle cx={cx - esp} cy={olhoY} r={4.4} /><circle cx={cx + esp} cy={olhoY} r={4.4} /></>
        : <><rect x={cx - esp - 4.5} y={olhoY - 3.5} width={9} height={tipo === 'sol' ? 7.2 : 6.6} rx={tipo === 'sol' ? 2.6 : 2} /><rect x={cx + esp - 4.5} y={olhoY - 3.5} width={9} height={tipo === 'sol' ? 7.2 : 6.6} rx={tipo === 'sol' ? 2.6 : 2} /></>}
      <path d={`M ${cx - esp + 4.4} ${olhoY - 0.6} Q ${cx} ${olhoY - 2} ${cx + esp - 4.4} ${olhoY - 0.6}`} fill="none" />
    </g>
  );
}

function Chapeu({ tipo, cx, cy, w, hh, semente }: { tipo: 'bone' | 'chapeu' | 'gorro' | 'lenco'; cx: number; cy: number; w: number; hh: number; semente: number }) {
  const topo = cy - hh / 2;
  const cores = { bone: ['#2f4f7a', '#8a2f2f', '#2f6a4a', '#1f1f24'], chapeu: ['#b89a64', '#5a4636', '#2e2a28'], gorro: ['#7a3b3b', '#3b4f7a', '#5d6b3a'], lenco: ['#b0543c', '#3c6e8f', '#8f3c6e'] }[tipo];
  const c = cores[semente % cores.length];
  const escuro = misturar(c, '#000000', 0.25);
  if (tipo === 'bone') return (
    <g>
      <path d={`M ${cx - w / 2 - 1} ${topo + hh * 0.2} C ${cx - w / 2} ${topo - 5} ${cx + w / 2} ${topo - 5} ${cx + w / 2 + 1} ${topo + hh * 0.2} Z`} fill={c} />
      <path d={`M ${cx - w / 2 - 1} ${topo + hh * 0.2} Q ${cx - w * 0.2} ${topo + hh * 0.26} ${cx - w / 2 - 12} ${topo + hh * 0.28} Q ${cx - w / 2 - 6} ${topo + hh * 0.16} ${cx - w / 2 - 1} ${topo + hh * 0.2} Z`} fill={escuro} />
      <circle cx={cx} cy={topo - 2.6} r={1.2} fill={escuro} />
    </g>
  );
  if (tipo === 'chapeu') return (
    <g>
      <ellipse cx={cx} cy={topo + hh * 0.14} rx={w / 2 + 11} ry={3.4} fill={escuro} />
      <path d={`M ${cx - w / 2 + 3} ${topo + hh * 0.14} C ${cx - w / 2 + 3} ${topo - 9} ${cx + w / 2 - 3} ${topo - 9} ${cx + w / 2 - 3} ${topo + hh * 0.14} Z`} fill={c} />
      <path d={`M ${cx - w / 2 + 3.5} ${topo + hh * 0.06} L ${cx + w / 2 - 3.5} ${topo + hh * 0.06}`} stroke={escuro} strokeWidth={2} />
    </g>
  );
  if (tipo === 'gorro') return (
    <g>
      <path d={`M ${cx - w / 2 - 1.5} ${topo + hh * 0.22} C ${cx - w / 2 - 1} ${topo - 9} ${cx + w / 2 + 1} ${topo - 9} ${cx + w / 2 + 1.5} ${topo + hh * 0.22} Z`} fill={c} />
      <rect x={cx - w / 2 - 2} y={topo + hh * 0.14} width={w + 4} height={4.6} rx={2} fill={escuro} />
    </g>
  );
  return (
    <g>
      <path d={`M ${cx - w / 2 - 1} ${topo + hh * 0.24} C ${cx - w / 2} ${topo - 6} ${cx + w / 2} ${topo - 6} ${cx + w / 2 + 1} ${topo + hh * 0.24} Q ${cx} ${topo + hh * 0.12} ${cx - w / 2 - 1} ${topo + hh * 0.24} Z`} fill={c} />
      <path d={`M ${cx + w / 2} ${topo + hh * 0.2} q 5 2 4 8 q -3 -3 -5 -4 Z`} fill={escuro} />
    </g>
  );
}

function Barba({ tipo, cor, cx, olhoY, w, queixo, jaw, bigode: comBigode = true }: { tipo: string; cor: string; cx: number; olhoY: number; w: number; queixo: number; jaw: number; bigode?: boolean }) {
  const bigode = <path d={`M ${cx - 5} ${olhoY + 11} Q ${cx} ${olhoY + 8.6} ${cx + 5} ${olhoY + 11} Q ${cx} ${olhoY + 10.4} ${cx - 5} ${olhoY + 11} Z`} fill={cor} stroke={cor} strokeWidth={1.4} strokeLinejoin="round" />;
  if (tipo === 'bigode') return bigode;
  if (tipo === 'por_fazer') {
    return (
      <g>
        <path d={`M ${cx - w / 2 + 1.5} ${olhoY + 4} C ${cx - w / 2 + 2} ${olhoY + 14} ${cx - jaw - 1} ${queixo + 0.5} ${cx} ${queixo + 0.8} C ${cx + jaw + 1} ${queixo + 0.5} ${cx + w / 2 - 2} ${olhoY + 14} ${cx + w / 2 - 1.5} ${olhoY + 4} L ${cx + w / 2 - 4} ${olhoY + 5} C ${cx + w / 2 - 4.5} ${olhoY + 12} ${cx + 5} ${olhoY + 16} ${cx} ${olhoY + 16} C ${cx - 5} ${olhoY + 16} ${cx - w / 2 + 4.5} ${olhoY + 12} ${cx - w / 2 + 4} ${olhoY + 5} Z`} fill={cor} opacity={0.22} />
        {comBigode && <g opacity={0.35}>{bigode}</g>}
      </g>
    );
  }
  if (tipo === 'cavanhaque') {
    return (
      <g fill={cor}>
        {bigode}
        <path d={`M ${cx - 3.2} ${olhoY + 15.2} Q ${cx} ${olhoY + 14.4} ${cx + 3.2} ${olhoY + 15.2} L ${cx + 2.4} ${queixo + 0.5} Q ${cx} ${queixo + 2} ${cx - 2.4} ${queixo + 0.5} Z`} />
      </g>
    );
  }
  const cheia = tipo === 'cheia';
  return (
    <g>
      <path d={`M ${cx - w / 2 + 1} ${olhoY + 2} C ${cx - w / 2 + 1.5} ${olhoY + 14} ${cx - jaw - 1} ${queixo + (cheia ? 3 : 0.5)} ${cx} ${queixo + (cheia ? 3.5 : 0.8)}
               C ${cx + jaw + 1} ${queixo + (cheia ? 3 : 0.5)} ${cx + w / 2 - 1.5} ${olhoY + 14} ${cx + w / 2 - 1} ${olhoY + 2}
               L ${cx + w / 2 - 3.5} ${olhoY + 3} C ${cx + w / 2 - 4} ${olhoY + 12} ${cx + 5} ${olhoY + 16} ${cx} ${olhoY + 16}
               C ${cx - 5} ${olhoY + 16} ${cx - w / 2 + 4} ${olhoY + 12} ${cx - w / 2 + 3.5} ${olhoY + 3} Z`}
        fill={cor} opacity={cheia ? 0.95 : 0.45} />
      {comBigode && bigode}
    </g>
  );
}

/* ------------------------------------------------------------------ Pets */

/**
 * Os bichos têm a sua própria linguagem, por família, e NUNCA um rosto de
 * gente: nada de dois olhos e uma boca num círculo chapado. O cão e o gato
 * vêm de corpo inteiro, de perfil, montados por morfologia (`caesEGatos`:
 * porte, corpo, perna, focinho, orelha, cauda, pelagem); os pequenos
 * mamíferos, de perfil (focinho, olho do lado, orelha no lugar certo); o
 * hamster é uma bola sem pescoço, de bochechas cheias e patinhas; o
 * porquinho-da-índia, um pão comprido sem pescoço nem rabo; as aves, de
 * perfil num poleiro, cada uma com o seu bico, cauda e marca; os répteis e
 * os peixes, pela silhueta. A semente varia a pelagem (e, no cão e no gato, a forma),
 * nunca a espécie. Sem gradiente, cor contida, olho de conta com um brilho.
 */
const ESCURO = '#141110';
const ROSA = '#d99a94';
/** Olho de conta com brilho; na pelagem escura, um aro claro para não sumir. */
function Olho({ x, y, r = 2.8, aro }: { x: number; y: number; r?: number; aro?: string }) {
  return <g>{aro && <circle cx={x} cy={y} r={r + 0.9} fill={aro} />}<circle cx={x} cy={y} r={r} fill={ESCURO} /><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#ffffff" /></g>;
}
const Sombra = ({ y = 88, rx = 32 }: { y?: number; rx?: number }) => <ellipse cx="50" cy={y} rx={rx} ry="4" fill="#000000" opacity="0.08" />;
const Bigodes = ({ x, y, lado = 1, comp = 14 }: { x: number; y: number; lado?: 1 | -1; comp?: number }) => (
  <path d={`M ${x} ${y} l ${lado * comp} -3 M ${x} ${y + 1.5} l ${lado * comp} 1 M ${x} ${y + 3} l ${lado * (comp - 2)} 4`} stroke={ESCURO} strokeWidth="0.6" opacity="0.55" fill="none" />
);
const aroSe = (pelo: string) => (luminancia(pelo) < 0.06 ? misturar(pelo, '#ffffff', 0.45) : undefined);
const escolha = <T,>(xs: readonly T[], semente: string, sal = 0): T => xs[(hash(semente) >>> sal) % xs.length];

const FUNDO_PET: Record<string, string> = { cao: '#dfe6f0', gato: '#e6e0ea', roedor: '#e9e2d4', coelho: '#e3ebe2', ave: '#e8e4d2', peixe: '#cfe3ea', reptil: '#dfe8d4' };

/**
 * REWORK 4: o fundo do retrato do bicho é escolhido pelo CONTRASTE com a pelagem (o gato branco não some mais num
 * fundo quase branco; o cachorro preto não some num fundo escuro) — a mesma ideia do retrato das pessoas. E um
 * contorno discreto segura a silhueta em qualquer cor.
 */
const FUNDOS_PET = ['#dfe6f0', '#e6e0ea', '#e9e2d4', '#c9d6c4', '#b8c7d4', '#4a5c68', '#5b4b60', '#4a6052', '#6b5642', '#39424a'];
export function fundoDoPet(cor: string | undefined, grupo: string, semente: string): string {
  if (!cor || !/^#[0-9a-f]{6}$/i.test(cor)) return FUNDO_PET[grupo] ?? '#dfe6f0';
  const nota = FUNDOS_PET.map(f => ({ f, n: contraste(f, cor) }));
  const melhor = Math.max(...nota.map(x => x.n));
  const bons = nota.filter(x => x.n >= Math.max(2.2, melhor * 0.82));
  return (bons.length ? bons : nota.sort((x, y) => y.n - x.n).slice(0, 1))[hash(semente) % Math.max(1, bons.length)]?.f ?? FUNDO_PET[grupo];
}

function RetratoPet({ especie, tamanho, rotulo, semente, porte }: { especie: Especie; tamanho: number; rotulo?: string; semente: string; porte?: Porte }) {
  const a = animal(especie);
  const Desenho = DESENHO_PET[especie] ?? DESENHO_PET[a.grupo === 'gato' ? 'gato' : 'cachorro'];
  const cor = a.grupo === 'gato' ? morfologiaGato(semente).cor : a.grupo === 'cao' ? morfologiaCao(semente, porte).cor : undefined;
  const fundo = fundoDoPet(cor, a.grupo, semente);
  const claro = cor ? luminancia(cor) > 0.45 : false;
  return (
    <svg className="retrato retrato--pet" viewBox="0 0 100 100" width={tamanho} height={tamanho} style={{ background: fundo }} role="img" aria-label={rotulo ?? palavraDoBicho(especie, 'masculino', false)} data-especie={especie} data-fundo={fundo}>
      <g style={{ filter: `drop-shadow(0 0 0.7px ${claro ? 'rgba(20,16,12,0.75)' : 'rgba(255,250,240,0.55)'})` }}>
        <Desenho semente={semente} porte={porte} />
      </g>
    </svg>
  );
}

type DesenhoBicho = (p: { semente: string; porte?: Porte }) => ReactElement;

/**
 * Cão e gato: o corpo inteiro, por morfologia (porte, corpo, perna, focinho,
 * orelha, cauda, pelagem — ver `caesEGatos`). A cor é variação dentro da
 * forma; dois vira-latas caramelo não saem iguais.
 */
const Cao: DesenhoBicho = ({ semente, porte }) => <FiguraCao m={morfologiaCao(semente, porte)} />;
const Gato: DesenhoBicho = ({ semente }) => <FiguraGato m={morfologiaGato(semente)} />;

/** Hamster: uma bola sem pescoço, bochechas estufadas, orelhinhas redondas no alto, patinhas no peito. */
const Hamster: DesenhoBicho = ({ semente }) => {
  const c = escolha(['#d9a35f', '#c98a43', '#8a7f74', '#efe6d8'], semente);
  const claro = '#f4ece0', escuro = misturar(c, '#000000', 0.3);
  return (
    <g>
      <Sombra y={90} rx={30} />
      <ellipse cx="50" cy="62" rx="30" ry="28" fill={c} />
      <ellipse cx="27" cy="62" rx="12.5" ry="11.5" fill={c} /><ellipse cx="73" cy="62" rx="12.5" ry="11.5" fill={c} />
      <ellipse cx="29" cy="65" rx="9" ry="8" fill={claro} /><ellipse cx="71" cy="65" rx="9" ry="8" fill={claro} />
      <ellipse cx="50" cy="78" rx="17" ry="12" fill={claro} />
      <circle cx="31" cy="37" r="7" fill={escuro} /><circle cx="69" cy="37" r="7" fill={escuro} />
      <circle cx="31" cy="38" r="3.8" fill={ROSA} /><circle cx="69" cy="38" r="3.8" fill={ROSA} />
      <ellipse cx="50" cy="58" rx="7.5" ry="6" fill={claro} />
      <Olho x={37} y={49} r={3.2} /><Olho x={63} y={49} r={3.2} />
      <ellipse cx="50" cy="54.5" rx="2.4" ry="1.7" fill="#c9707a" />
      <path d="M 50 56 V 58.5 M 50 58.5 l -1.8 1.4 M 50 58.5 l 1.8 1.4" stroke={ESCURO} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <Bigodes x={44} y={56} lado={-1} comp={12} /><Bigodes x={56} y={56} lado={1} comp={12} />
      <ellipse cx="44.5" cy="72" rx="3.2" ry="2.3" fill={ROSA} /><ellipse cx="55.5" cy="72" rx="3.2" ry="2.3" fill={ROSA} />
      <ellipse cx="38" cy="89" rx="5" ry="2.4" fill={ROSA} /><ellipse cx="62" cy="89" rx="5" ry="2.4" fill={ROSA} />
    </g>
  );
};

/** Porquinho-da-índia: de perfil, um pão comprido, sem pescoço e sem rabo, focinho rombudo, orelha de pétala, malhado. */
const Porquinho: DesenhoBicho = ({ semente }) => {
  const [c, mancha] = escolha([['#efe6d8', '#a8642f'], ['#c98a43', '#efe6d8'], ['#2b2622', '#efe6d8'], ['#d9c3a0', '#8a5a32'], ['#a8642f', '#2b2622']] as const, semente);
  const corpo = 'M 11 72 C 11 52 30 40 54 40 C 72 40 84 47 88 59 C 91 69 86 79 75 80 H 21 C 14 80 11 77 11 72 Z';
  return (
    <g>
      <Sombra y={82} rx={40} />
      <path d={corpo} fill={c} />
      <path d="M 11 72 C 11 52 30 40 46 40 C 40 54 38 68 42 80 H 21 C 14 80 11 77 11 72 Z" fill={mancha} />
      {hash(semente) % 2 === 0 && <path d="M 72 41 C 78 46 80 52 79 60 C 84 60 88 62 89 64 C 90 56 86 46 72 41 Z" fill={mancha} opacity="0.9" />}
      <path d="M 62 44 C 60 36 68 32 72 38 C 73 42 68 46 62 44 Z" fill={misturar(c === '#2b2622' ? '#6b5a50' : c, '#c97a6a', 0.45)} />
      <Olho x={75} y={52} r={3} aro={aroSe(c)} />
      <ellipse cx="88" cy="63" rx="1.8" ry="1.4" fill="#8a5a5a" />
      <path d="M 88 65 Q 86 68 82 67.5" stroke={ESCURO} strokeWidth="0.8" fill="none" />
      <Bigodes x={85} y={63} lado={1} comp={11} />
      <ellipse cx="28" cy="80.5" rx="4.5" ry="2" fill={ROSA} /><ellipse cx="72" cy="80.5" rx="4" ry="2" fill={ROSA} />
    </g>
  );
};

/** Coelho: de perfil, sentado, orelhas compridas em pé, rabo de algodão. */
const Coelho: DesenhoBicho = ({ semente }) => {
  const c = escolha(['#8a7a66', '#efe6d8', '#2b2622', '#c9a37a', '#7d7a78'], semente);
  const escuro = misturar(c, '#000000', 0.25), claro = c === '#efe6d8' ? '#ffffff' : misturar(c, '#ffffff', 0.45);
  return (
    <g>
      <Sombra y={88} rx={34} />
      <ellipse cx="47" cy="25" rx="6" ry="19" fill={escuro} transform="rotate(-18 47 25)" />
      <path d="M 17 86 C 9 72 15 52 33 50 C 46 48 57 54 61 63 C 65 73 62 83 56 87 H 24 Z" fill={c} />
      <ellipse cx="64" cy="51" rx="15" ry="13" fill={c} />
      <ellipse cx="57" cy="24" rx="6.5" ry="20" fill={c} transform="rotate(-8 57 24)" />
      <ellipse cx="57.5" cy="25" rx="2.8" ry="15" fill={ROSA} transform="rotate(-8 57 24)" opacity="0.8" />
      <ellipse cx="73" cy="56" rx="6" ry="4.5" fill={claro} />
      <Olho x={67} y={47} r={3} aro={aroSe(c)} />
      <ellipse cx="78.5" cy="53" rx="1.6" ry="1.3" fill="#c9707a" />
      <Bigodes x={76} y={55} lado={1} comp={12} />
      <circle cx="15" cy="72" r="6.5" fill={claro} />
      <ellipse cx="62" cy="87" rx="6.5" ry="3" fill={c} />
    </g>
  );
};

/** Chinchila: sentada, cinza denso, orelhas grandes e redondas, olho grande, rabo felpudo para cima. */
const Chinchila: DesenhoBicho = ({ semente }) => {
  const c = escolha(['#8e8c8a', '#a8a29a', '#c9bfb2'], semente);
  const escuro = misturar(c, '#000000', 0.25), claro = '#efebe4';
  return (
    <g>
      <Sombra y={90} rx={30} />
      <path d="M 34 84 C 18 84 8 70 11 54 C 13 42 22 38 27 44 C 30 48 26 52 25 58 C 24 68 30 76 40 78 Z" fill={escuro} />
      <path d="M 14 50 l -3 -2 M 13 58 l -4 0 M 15 66 l -4 2" stroke={escuro} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="46" cy="68" rx="22" ry="22" fill={c} />
      <ellipse cx="55" cy="74" rx="10" ry="13" fill={claro} />
      <ellipse cx="49" cy="23" rx="10" ry="12.5" fill={escuro} /><ellipse cx="49" cy="24" rx="6" ry="8.5" fill="#d9b8b0" />
      <ellipse cx="60" cy="45" rx="17" ry="15" fill={c} />
      <ellipse cx="67" cy="22" rx="10" ry="12.5" fill={c} /><ellipse cx="67" cy="23" rx="6" ry="8.5" fill="#e3c4bc" />
      <Olho x={67} y={44} r={3.6} />
      <ellipse cx="77" cy="50" rx="1.6" ry="1.2" fill="#c9707a" />
      <Bigodes x={74} y={51} lado={1} comp={18} />
      <ellipse cx="61" cy="64" rx="3.6" ry="2.6" fill={claro} />
      <ellipse cx="40" cy="89" rx="6" ry="2.4" fill={escuro} /><ellipse cx="58" cy="89" rx="5" ry="2.4" fill={escuro} />
    </g>
  );
};

/**
 * Ave: de perfil num poleiro. O mesmo corpo para todas; o que muda é o que se
 * reconhece — o bico (curvo e grande no papagaio, curvo e pequeno com cera no
 * periquito, cônico no canário), a crista e a bochecha laranja da calopsita,
 * a máscara amarela do papagaio, o barrado do periquito, o comprimento da cauda.
 */
interface Plumagem { corpo: string; cabeca: string; asa: string; cauda: 'longa' | 'curta' | 'media'; escala: number; bico: 'gancho' | 'gancho_pequeno' | 'conico' }
const Ave = ({ p, children, enfeite }: { p: Plumagem; children?: ReactElement; enfeite?: ReactElement }) => {
  const caudaD = p.cauda === 'longa' ? 'M 40 70 L 20 100 L 29 100 L 47 76 Z' : p.cauda === 'curta' ? 'M 40 70 L 31 90 L 37 89 L 40 93 L 48 76 Z' : 'M 40 70 L 26 96 L 35 96 L 48 76 Z';
  const bico = p.bico === 'gancho' ? <><path d="M 67 28 C 80 27 85 38 79 48 C 78 43 75 40 69 41 Z" fill="#3a3430" /><path d="M 69 41 L 76 44 L 70 47 Z" fill="#2b2622" /></>
    : p.bico === 'gancho_pequeno' ? <path d="M 68 31 C 75 31 77 37 73 42 C 72 39 70 38 68 38 Z" fill="#cdb98e" />
    : <path d="M 68 33 L 78 36.5 L 68 40 Z" fill="#e0b080" />;
  return (
    <g>
      <path d="M 6 85 H 94" stroke="#7a5a3a" strokeWidth="4.5" strokeLinecap="round" />
      <g transform={`translate(50 84) scale(${p.escala}) translate(-50 -84)`}>
        <path d={caudaD} fill={misturar(p.asa, '#000000', 0.12)} />
        <ellipse cx="51" cy="59" rx="16" ry="23" fill={p.corpo} transform="rotate(18 51 59)" />
        <path d="M 46 45 C 34 52 34 72 40 82 C 49 76 54 62 52 49 Z" fill={p.asa} />
        <circle cx="58" cy="35" r="13" fill={p.cabeca} />
        {children}
        {bico}
        <Olho x={61} y={32} r={2.4} />
        {enfeite}
        <path d="M 48 79 V 86 M 55 78 V 86" stroke="#8a6a4a" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
};
const Papagaio: DesenhoBicho = () => (
  <Ave p={{ corpo: '#3f9b4a', cabeca: '#3f9b4a', asa: '#2f7a3a', cauda: 'curta', escala: 1.05, bico: 'gancho' }}
    enfeite={<circle cx="61" cy="32" r="4.2" fill="none" stroke="#f4ece0" strokeWidth="1.6" />}>
    <g><path d="M 52 23 C 56 20 63 21 67 26 L 58 28 Z" fill="#4a78c8" /><ellipse cx="63" cy="39" rx="7" ry="6" fill="#e8c43a" /><ellipse cx="42" cy="54" rx="4" ry="5" fill="#c8402a" /></g>
  </Ave>
);
const Periquito: DesenhoBicho = ({ semente }) => {
  const azul = hash(semente) % 2 === 1;
  const corpo = azul ? '#5f8fd0' : '#6fb55a';
  return (
    <Ave p={{ corpo, cabeca: azul ? '#f0eee6' : '#ecd85a', asa: misturar(corpo, '#000000', 0.15), cauda: 'longa', escala: 0.92, bico: 'gancho_pequeno' }}
      enfeite={<><ellipse cx="68" cy="31" rx="2.2" ry="1.6" fill={azul ? '#8a6a4a' : '#4a6ac8'} /><circle cx="60" cy="45" r="1.1" fill={ESCURO} /><circle cx="65" cy="45" r="1.1" fill={ESCURO} /></>}>
      <path d="M 47 30 q 3 -2 6 0 M 46 35 q 3 -2 6 0 M 47 40 q 3 -2 6 0 M 41 54 q 4 -2 8 0 M 39 60 q 4 -2 8 0 M 39 66 q 4 -2 8 0 M 40 72 q 3 -2 6 0" stroke={ESCURO} strokeWidth="1.1" fill="none" opacity="0.6" />
    </Ave>
  );
};
const Calopsita: DesenhoBicho = () => (
  <Ave p={{ corpo: '#a8a49c', cabeca: '#ecd85a', asa: '#8e8a82', cauda: 'longa', escala: 0.98, bico: 'gancho_pequeno' }}
    enfeite={<circle cx="63" cy="40" r="4.4" fill="#e0764a" />}>
    <g><path d="M 52 25 C 47 15 49 6 56 1 C 54 9 57 17 61 23 Z" fill="#ecd85a" /><path d="M 56 24 C 54 15 58 8 63 5 C 60 12 62 18 64 24 Z" fill="#d9c44a" /><ellipse cx="45" cy="57" rx="3.4" ry="7.5" fill="#efebe4" transform="rotate(12 45 57)" /></g>
  </Ave>
);
const Canario: DesenhoBicho = () => <Ave p={{ corpo: '#e8c43a', cabeca: '#ecca3e', asa: '#c9a62e', cauda: 'curta', escala: 0.85, bico: 'conico' }} />;

/** Iguana: de perfil, crista de espinhos no dorso, papada sob o queixo, escama redonda na face, rabo comprido anelado. */
const Iguana: DesenhoBicho = () => {
  const c = '#6f9a44', escuro = '#4a6e2c', claro = '#a8c870';
  const espinhos = Array.from({ length: 10 }, (_, k) => { const t = k / 9, x = 64 - t * 40, y = 43 + t * 16; return `L ${x.toFixed(1)} ${(y - 6 + t * 2).toFixed(1)} L ${(x - 2).toFixed(1)} ${(y + 1).toFixed(1)}`; }).join(' ');
  return (
    <g>
      <Sombra y={92} rx={40} />
      <path d="M 26 66 C 8 68 4 90 24 92 C 46 95 72 90 94 80 L 94 85 C 72 96 44 100 22 98 C 0 96 2 64 26 62 Z" fill={c} />
      <path d="M 30 93 l 2 5 M 44 93 l 2 5 M 58 90 l 2 5 M 72 86 l 2 5 M 13 82 l -5 2" stroke={escuro} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 22 66 C 30 54 50 50 64 52 L 66 64 C 52 70 36 72 22 70 Z" fill={c} />
      <path d={`M 66 44 ${espinhos} L 22 62 Z`} fill={escuro} />
      <path d="M 60 44 C 66 36 80 36 88 44 C 92 48 90 54 84 56 L 64 58 Z" fill={c} />
      <path d="M 66 56 C 67 70 75 74 82 56 Z" fill={claro} stroke={escuro} strokeWidth="0.8" />
      <circle cx="70" cy="50" r="3.8" fill={claro} />
      <path d="M 88 50 L 72 53" stroke={escuro} strokeWidth="1" />
      <Olho x={78} y={44} r={2.2} />
      <path d="M 58 62 L 63 74 L 68 76 M 63 74 L 60 78 M 32 70 L 28 80 L 33 83 M 28 80 L 24 82" stroke={c} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
};

/** Jabuti: casco alto em domo com os escudos marcados, cabeça e patas de coluna com as manchas vermelhas. */
const Jabuti: DesenhoBicho = () => {
  const pele = '#4a3c2c', mancha = '#c8502a', casco = '#3a2e22', areola = '#c9922a';
  return (
    <g>
      <Sombra y={86} rx={40} />
      <rect x="21" y="70" width="11" height="14" rx="4" fill={pele} /><rect x="62" y="70" width="11" height="14" rx="4" fill={pele} />
      <circle cx="25" cy="76" r="1.6" fill={mancha} /><circle cx="28" cy="80" r="1.4" fill={mancha} /><circle cx="66" cy="76" r="1.6" fill={mancha} /><circle cx="69" cy="80" r="1.4" fill={mancha} />
      <path d="M 74 70 C 79 64 83 61 88 61 C 94 61 96 66 94 70 C 92 73 86 73 82 72 L 76 74 Z" fill={pele} />
      <circle cx="86" cy="68" r="1.7" fill={mancha} /><circle cx="91" cy="69" r="1.3" fill={mancha} />
      <Olho x={89} y={64.5} r={1.8} />
      <path d="M 12 74 C 12 44 30 31 47 31 C 64 31 80 44 80 74 Z" fill={casco} />
      <path d="M 12 74 H 80" stroke="#5a4632" strokeWidth="3.5" strokeLinecap="round" />
      {([[46, 41, 7, 5], [32, 50, 6, 5], [60, 50, 6, 5], [46, 57, 7, 5], [22, 64, 5, 4], [36, 66, 5, 4], [56, 66, 5, 4], [70, 64, 5, 4]] as const).map(([x, y, rx, ry], k) => <ellipse key={k} cx={x} cy={y} rx={rx} ry={ry} fill={areola} opacity="0.85" />)}
      <path d="M 38 36 L 39 46 L 53 46 L 55 36 M 39 46 L 25 56 M 53 46 L 67 56 M 39 46 L 39 61 L 53 61 L 53 46 M 39 61 L 29 72 M 53 61 L 63 72 M 25 56 L 15 62 M 67 56 L 77 62" stroke="#1e1812" strokeWidth="1.2" fill="none" opacity="0.6" />
    </g>
  );
};

/** Peixinho-dourado: corpo redondo laranja, cauda dupla em leque. */
const Peixe: DesenhoBicho = () => (
  <g>
    <Aquario />
    <path d="M 66 52 C 76 36 90 34 93 41 C 87 47 87 57 93 63 C 90 70 76 68 66 52 Z" fill="#f0a850" />
    <path d="M 36 40 C 42 27 56 28 60 40 Z" fill="#f0a850" />
    <ellipse cx="47" cy="52" rx="22" ry="15" fill="#e8892a" />
    <path d="M 40 42 Q 35 52 40 62" stroke="#c46a1e" strokeWidth="1.4" fill="none" />
    <path d="M 46 60 C 48 68 54 70 56 64 Z" fill="#f0a850" />
    <Olho x={34} y={49} r={3.2} />
    <path d="M 25.5 54 q 2 1.5 4 0" stroke="#8a4a1a" strokeWidth="1" fill="none" />
  </g>
);
/** Betta: corpo fino, nadadeiras enormes caindo como véu. */
const Betta: DesenhoBicho = ({ semente }) => {
  const c = escolha(['#2f4aa8', '#b8323a', '#6a3fa0', '#2b8a8a'], semente);
  const veu = misturar(c, '#ffffff', 0.18);
  return (
    <g>
      <Aquario />
      <path d="M 58 46 C 72 22 96 30 94 50 C 96 72 74 82 58 56 Z" fill={veu} />
      <path d="M 70 40 L 88 36 M 72 50 L 92 50 M 70 60 L 86 68" stroke={c} strokeWidth="1" opacity="0.6" />
      <path d="M 32 43 C 38 26 56 26 60 44 Z" fill={veu} />
      <path d="M 34 57 C 38 76 56 80 62 56 Z" fill={veu} />
      <ellipse cx="45" cy="50" rx="18" ry="8.5" fill={c} />
      <Olho x={32} y={48.5} r={2.6} />
    </g>
  );
};
const Aquario = () => (
  <g>
    <path d="M 22 100 C 18 90 26 84 22 74 M 30 100 C 34 92 28 86 32 78 M 74 100 C 70 92 78 88 74 80" stroke="#5f8f3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="26" cy="30" r="2.2" fill="none" stroke="#ffffff" strokeWidth="0.9" /><circle cx="21" cy="20" r="1.6" fill="none" stroke="#ffffff" strokeWidth="0.9" />
  </g>
);

const DESENHO_PET: Record<string, DesenhoBicho> = {
  cachorro: Cao, gato: Gato, hamster: Hamster, porquinho: Porquinho, coelho: Coelho, chinchila: Chinchila,
  papagaio: Papagaio, periquito: Periquito, calopsita: Calopsita, canario: Canario, iguana: Iguana, jabuti: Jabuti, peixe: Peixe, betta: Betta
};
