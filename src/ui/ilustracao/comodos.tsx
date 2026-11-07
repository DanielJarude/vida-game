/**
 * 12.4.1 — A CENA DO CÔMODO: a parede com a cor (ou o tijolo, o papel, a boiserie) que a pessoa escolheu, o piso
 * (cerâmica, cimento, vinílico, porcelanato, taco, mármore), a luz (a lâmpada no teto, a luz quente, a sanca com
 * pendentes, a automação), a janela — e, no chão, os objetos que estão de fato ali (`lar.coisasPorComodo`), cada um
 * com o desenho e a cor dele, na escala aproximada de verdade (o sofá é maior que o violão). O que todo cômodo tem
 * (a pia e o fogão da cozinha, o chuveiro do banheiro, a grama do jardim) vem desenhado; o resto é o que se comprou.
 *
 * HOTFIX 11.5.1 — 2.5D: a mesma cena, agora com PROFUNDIDADE. Perspectiva de um ponto (o ponto de fuga no meio da
 * parede do fundo): o teto, as duas paredes laterais (mais escuras, uma mais que a outra: a luz vem da janela), a
 * parede do fundo e o piso em trapézio — as tábuas e os rejuntes convergem para o fundo e se apertam com a distância.
 * O rodapé contorna as três paredes; os cantos e o pé da parede têm a sombra que a luz não alcança; a janela, na
 * parede lateral, joga um rastro de luz no chão. Os objetos ficam em duas fileiras — os grandes encostados na parede
 * do fundo (menores: estão mais longe), os outros mais à frente —, cada um com a sombra de contato no piso. Continua
 * a linguagem do VIDA (formas chapadas, um tom de sombra): nada de textura fotográfica.
 */
import { memo, useId, useMemo, type ReactElement } from 'react';
import { hash, Ilustracao, valida, type Amostra } from './nucleo';
import { VARIANTES_DE_DESENHO } from './objetosDaCasa';
import { caixaDaAmostra } from './caixa';
import { comEstiloDaMarca } from './estiloDeMarca';
import { estiloDaMarca } from '../../motor/sistemas/perfilDaMarca';
import { chaoEm, disporComodo, escalaEm, ordemDeDesenho, tela, xEm, zDoDesenho, type Geometria, type Posto } from './disposicao';
import { amostraDoObjeto } from './objetos';
import { blocosDe, corDoCorpo, fatias, partesDoDesenho, passosDoMovel, projetar, referencial, temVolume } from './volumes13';
import { variantesDaCoisa } from '../../motor/dados/pertences';
import { misturar } from '../avatar/cores';
import { opcaoDeAcabamento } from '../../motor/dados/lar';

export interface ObjetoNaCena { coisaId: string; cor?: string; id: string; marca?: string }

interface Props {
  tipo: string;
  parede?: { id: string; cor?: string };
  piso?: { id: string; cor?: string };
  luz?: string;
  /** 12.7: o rodapé (e a moldura do teto) e a cortina da janela. */
  rodape?: string;
  cortina?: string;
  /** 12.7: a luz regulada (temperatura e intensidade 40–100%). */
  luzRegulada?: { temperatura?: 'quente' | 'neutra' | 'fria'; intensidade?: number };
  objetos: ObjetoNaCena[];
  /** VIDA 12.8: a área do cômodo (m²): o tamanho da cena e a escala dos objetos. Ausente: a cena de antes (25 m²). */
  area?: number;
  largura?: number;
  rotulo: string;
}

/** 12.7: o desenho de cada luz (as antigas pelo id; as novas pelo catálogo). */
const TOM_DA_LUZ = { quente: ['#ffd9a0', '#ffb86b'], neutra: ['#fff3d6', '#ffe9c2'], fria: ['#e3f1ff', '#cfe6ff'] } as const;

/** O tamanho de um objeto na tela, pela caixa do desenho (não pelo quadro): a largura real, sem passar da altura real. */
function enquadrar(a: Amostra, larguraTela: number, alturaMax: number) {
  const c = caixaDaAmostra(a);
  const bw = Math.max(1, c.x1 - c.x0), bh = Math.max(1, c.y1 - c.y0);
  let s = larguraTela / bw;
  if (bh * s > alturaMax) s = alturaMax / bh;
  return { s, c, bw, bh };
}

export const CenaDoComodo = memo(function CenaDoComodo({ tipo, parede, piso, luz = 'simples', rodape: rodapeId, cortina: cortinaId, luzRegulada, objetos, area, largura = 320, rotulo }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${uid}-${k}`;
  const chaveObjetos = objetos.map(o => `${o.id}:${o.coisaId}:${o.cor ?? ''}:${o.marca ?? ''}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const disp = useMemo(() => disporComodo(tipo, area, objetos, luz), [tipo, area, luz, chaveObjetos]);
  const g = disp.g;
  const { W, H } = g;
  const externo = g.externo;
  const corParede = parede?.cor ?? (externo ? '#bcd7e6' : '#e9e3d8');
  const corPiso = piso?.cor ?? (tipo === 'banheiro' || tipo === 'cozinha' || tipo === 'lavabo' ? '#cfc6b6' : tipo === 'varanda' ? '#b48a5e' : '#b9a68a');
  const detalhe = largura >= 200;
  const dParede = opcaoDeAcabamento('parede', parede?.id)?.desenho ?? (parede?.id === 'tijolo' ? 'tijolo' : parede?.id === 'papel' ? 'papel_floral' : parede?.id === 'boiserie' ? 'boiserie' : 'liso');
  const cor2Parede = opcaoDeAcabamento('parede', parede?.id)?.cor2;
  const dPiso = opcaoDeAcabamento('piso', piso?.id)?.desenho ?? (!piso && (tipo === 'banheiro' || tipo === 'cozinha' || tipo === 'lavabo') ? 'rejunte' : piso || tipo === 'varanda' ? 'tabua' : 'liso');
  const cor2Piso = opcaoDeAcabamento('piso', piso?.id)?.cor2;
  const dLuz = opcaoDeAcabamento('luz', luz)?.desenho ?? 'teto';
  const temperatura = luzRegulada?.temperatura ?? (dLuz === 'teto' || dLuz === 'plafon' ? 'neutra' : 'quente');
  const intensidade = Math.max(40, Math.min(100, luzRegulada?.intensidade ?? 100)) / 100;
  const quente = temperatura === 'quente' && dLuz !== 'teto';
  const [tom1, tom2] = TOM_DA_LUZ[temperatura];
  const oRodape = opcaoDeAcabamento('rodape', rodapeId);
  const oCortina = opcaoDeAcabamento('cortina', cortinaId);
  const janela = !externo && !['cinema', 'banheiro', 'lavabo', 'adega'].includes(tipo);
  const pEsq = misturar(corParede, '#000000', 0.09), pDir = misturar(corParede, '#000000', 0.17), teto = misturar(corParede, '#ffffff', 0.32);
  const pisoFundo = misturar(corPiso, '#000000', 0.16);
  const rodape = oRodape?.cor ?? misturar(corParede, '#000000', 0.22);
  const comPadrao = dParede !== 'liso' && dParede !== 'boiserie';
  const preenchida = comPadrao ? `url(#${id('par')})` : corParede;
  const chaoExterno = tipo === 'garagem' ? '#a8a49d' : tipo === 'quadra' ? '#5d8a6a' : '#86a86f';
  const { fx0: FX0, fx1: FX1, fy0: FY0, fy1: FY1, pf: PF } = g;
  const naBorda = (xFundo: number, yFundo: number, xBorda: number) => PF.y + (yFundo - PF.y) * ((xBorda - PF.x) / (xFundo - PF.x));
  const TETO_E = naBorda(FX0, FY0, 0), TETO_D = naBorda(FX1, FY0, W), CHAO_E = naBorda(FX0, FY1, 0), CHAO_D = naBorda(FX1, FY1, W);
  const pisoPoly = `${FX0},${FY1} ${FX1},${FY1} ${W},${CHAO_D} ${W},${H} 0,${H} 0,${CHAO_E}`;
  const tabuas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => FX0 + (FX1 - FX0) * i / 10);
  const fileiras = [1, 2, 3, 4, 5].map(k => FY1 + (H - FY1) * (k / 5.4) ** 1.5);
  const ponto = (x: number, alt: number, z: number) => tela(g, x, alt, z).map(n => n.toFixed(1)).join(',');
  const quad = (x0: number, x1: number, z0: number, z1: number, alt = 0) => [ponto(x0, alt, z0), ponto(x1, alt, z0), ponto(x1, alt, z1), ponto(x0, alt, z1)].join(' ');
  const pis = disp.piscina;
  const ordem = ordemDeDesenho(disp.postos);
  // VIDA 13: os ids dos desenhos com volume levam a assinatura da cena (duas cenas renderizadas à parte não se confundem).
  const assinatura = hash(`${tipo}|${area}|${chaveObjetos}`).toString(36);
  const semCadeira = disp.postos.some(x => x.coisaId === 'cadeira_ergonomica');

  return (
    <svg className="cena-comodo cena-comodo--25d" viewBox={`0 0 ${W} ${H}`} width={largura} height={Math.round(largura * H / W)} role="img" aria-label={rotulo} data-comodo={tipo} data-parede={parede?.id} data-piso={piso?.id} data-luz={luz} data-cortina={cortinaId} data-rodape={rodapeId} data-temperatura={temperatura} data-intensidade={Math.round(intensidade * 100)} data-largura-m={g.Wm.toFixed(1)} data-fora={disp.fora.join(' ') || undefined}>
      <defs>
        <linearGradient id={id('luz')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tom1} stopOpacity={(temperatura === 'neutra' ? 0.1 : 0.24) * intensidade} />
          <stop offset="1" stopColor={tom2} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id('vinheta')} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.16} />
        </radialGradient>
        <linearGradient id={id('pe')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={id('pisoProf')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={externo ? misturar(chaoExterno, '#000000', 0.12) : pisoFundo} />
          <stop offset="1" stopColor={externo ? chaoExterno : corPiso} />
        </linearGradient>
        <radialGradient id={id('lampada')} cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor={tom1} stopOpacity={0.24 * intensidade} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        {comPadrao && <PadraoDaParede id={id('par')} desenho={dParede} cor={corParede} cor2={cor2Parede} />}
        {PADRAO_DE_PISO.has(dPiso) && <PadraoDoPiso id={id('pis')} desenho={dPiso} cor={corPiso} cor2={cor2Piso} />}
      </defs>

      {externo ? (
        /* Lá fora: o céu, o horizonte, o muro do fundo, o chão em perspectiva (a grama, o piso da garagem, a quadra). */
        <g data-peca="exterior">
          <rect width={W} height={FY1} fill={corParede} />
          <circle cx={262} cy={30} r={13} fill="#f6d77a" opacity={0.9} />
          <path d={`M0 ${FY1 - 22} q 60 -16 120 0 t 120 -4 t 80 2 V ${FY1} H0 Z`} fill="#9fbf8f" opacity={0.6} />
          {tipo !== 'garagem' && <rect data-peca="muro" x={0} y={FY1 - 1.8 * g.k} width={W} height={1.8 * g.k} fill={tipo === 'quadra' ? '#7a7f76' : '#d8cfbf'} opacity={tipo === 'quadra' ? 0.35 : 0.9} />}
          {tipo === 'quadra' && <path d={Array.from({ length: 24 }, (_, i) => `M${i * 14} ${FY1 - 1.8 * g.k}V${FY1}`).join('')} stroke="#4a4f48" strokeWidth={0.5} opacity={0.6} />}
          <polygon points={`0,${FY1} ${W},${FY1} ${W},${H} 0,${H}`} fill={`url(#${id('pisoProf')})`} />
          {detalhe && tipo !== 'garagem' && tipo !== 'quadra' && fileiras.map((y, k) => <path key={k} d={`M0 ${y.toFixed(1)} H${W}`} stroke={misturar(chaoExterno, '#000000', 0.08)} strokeWidth={0.8} />)}
          {tipo === 'garagem' && <g data-peca="portao"><rect x={FX0} y={FY0 + (FY1 - FY0) * 0.12} width={FX1 - FX0} height={(FY1 - FY0) * 0.88} fill="#c9c4bb" stroke="#8f8a82" strokeWidth={2} />{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M${FX0} ${FY0 + (FY1 - FY0) * (0.2 + i * 0.1)} H${FX1}`} stroke="#a9a49b" strokeWidth={1} />)}</g>}
          {tipo === 'quadra' && <g data-peca="quadra"><polygon points={quad(g.Wm * 0.12, g.Wm * 0.88, g.Dv * 0.15, g.Dv * 0.85)} fill="#3f6fa0" /><polygon points={quad(g.Wm * 0.12, g.Wm * 0.88, g.Dv * 0.15, g.Dv * 0.85)} fill="none" stroke="#f4f1ea" strokeWidth={1.4} /><path d={`M${ponto(g.Wm / 2, 0, g.Dv * 0.15)} L${ponto(g.Wm / 2, 0, g.Dv * 0.85)}`} stroke="#f4f1ea" strokeWidth={1} /><path d={`M${ponto(g.Wm * 0.12, 1, g.Dv * 0.5)} L${ponto(g.Wm * 0.88, 1, g.Dv * 0.5)}`} stroke="#2b2826" strokeWidth={1.2} /><path d={`M${ponto(g.Wm * 0.12, 0, g.Dv * 0.5)} L${ponto(g.Wm * 0.12, 1, g.Dv * 0.5)} M${ponto(g.Wm * 0.88, 0, g.Dv * 0.5)} L${ponto(g.Wm * 0.88, 1, g.Dv * 0.5)}`} stroke="#5a5550" strokeWidth={1.2} /></g>}
        </g>
      ) : (
        <g data-peca="paredes">
          <polygon points={`0,${TETO_E} 0,0 ${W},0 ${W},${TETO_D} ${FX1},${FY0} ${FX0},${FY0}`} fill={teto} />
          <polygon points={`0,${TETO_E} ${FX0},${FY0} ${FX0},${FY1} 0,${CHAO_E}`} fill={pEsq} />
          <polygon points={`${W},${TETO_D} ${FX1},${FY0} ${FX1},${FY1} ${W},${CHAO_D}`} fill={pDir} />
          {comPadrao ? <>
            <polygon points={`0,${TETO_E} ${FX0},${FY0} ${FX0},${FY1} 0,${CHAO_E}`} fill={preenchida} />
            <polygon points={`0,${TETO_E} ${FX0},${FY0} ${FX0},${FY1} 0,${CHAO_E}`} fill="#000000" opacity={0.09} />
            <polygon points={`${W},${TETO_D} ${FX1},${FY0} ${FX1},${FY1} ${W},${CHAO_D}`} fill={preenchida} />
            <polygon points={`${W},${TETO_D} ${FX1},${FY0} ${FX1},${FY1} ${W},${CHAO_D}`} fill="#000000" opacity={0.17} />
          </> : null}
          <rect x={FX0} y={FY0} width={FX1 - FX0} height={FY1 - FY0} fill={preenchida} />
          {dParede === 'boiserie' && [0, 1, 2].map(k => { const lw = (FX1 - FX0) / 3; return <g key={k}><rect x={FX0 + 8 + k * lw} y={FY0 + (FY1 - FY0) * 0.13} width={lw - 16} height={(FY1 - FY0) * 0.36} rx={2} fill="none" stroke={cor2Parede ?? misturar(corParede, '#000000', 0.14)} strokeWidth={detalhe ? 1.2 : 1.8} /><rect x={FX0 + 8 + k * lw} y={FY0 + (FY1 - FY0) * 0.57} width={lw - 16} height={(FY1 - FY0) * 0.3} rx={2} fill="none" stroke={cor2Parede ?? misturar(corParede, '#000000', 0.14)} strokeWidth={detalhe ? 1.2 : 1.8} /></g>; })}
          {dParede === 'boiserie' && <path d={`M${FX0} ${FY0 + (FY1 - FY0) * 0.53} H${FX1}`} stroke={cor2Parede ?? misturar(corParede, '#000000', 0.16)} strokeWidth={1.4} />}
          <path d={`M${FX0} ${FY0} V${FY1} M${FX1} ${FY0} V${FY1}`} stroke={misturar(corParede, '#000000', 0.25)} strokeWidth={1} />
          <path d={`M0 ${TETO_E} L${FX0} ${FY0} H${FX1} L${W} ${TETO_D}`} stroke={misturar(corParede, '#000000', 0.15)} strokeWidth={0.8} fill="none" />
          <rect x={FX0} y={FY1 - 14} width={FX1 - FX0} height={14} fill={`url(#${id('pe')})`} />
        </g>
      )}

      {/* A janela: na parede lateral esquerda (em perspectiva), e o rastro de luz no chão. */}
      {janela && (() => {
        const zA = Math.min(g.Dv * 0.75, 1.1 + g.Dv * 0.25), zB = Math.max(0.3, zA - 1.2);
        const [a, t1] = tela(g, 0, 2.15, zA), [b, t2] = tela(g, 0, 2.15, zB);
        const [, b1] = tela(g, 0, 0.95, zA), [, b2] = tela(g, 0, 0.95, zB);
        const m = (a + b) / 2;
        const ym = (x: number, y1: number, y2: number) => y1 + (y2 - y1) * ((x - a) / ((b - a) || 1));
        return (
          <g data-peca="janela">
            <polygon points={`${a.toFixed(1)},${t1.toFixed(1)} ${b.toFixed(1)},${t2.toFixed(1)} ${b.toFixed(1)},${b2.toFixed(1)} ${a.toFixed(1)},${b1.toFixed(1)}`} fill="#cfe3ee" stroke={misturar(pEsq, '#000000', 0.3)} strokeWidth={2.2} strokeLinejoin="round" />
            <path d={`M${m.toFixed(1)} ${ym(m, t1, t2).toFixed(1)} V${ym(m, b1, b2).toFixed(1)}`} stroke={misturar(pEsq, '#000000', 0.3)} strokeWidth={1.4} />
            {detalhe && <path d={`M${(a + 2).toFixed(1)} ${(b1 - 4).toFixed(1)} l 8 -14 l 5 6 l 7 -10 l 4 5 V ${(b2 - 2).toFixed(1)} Z`} fill="#a9c6a0" opacity={0.7} />}
            <polygon points={`${ponto(0.05, 0, zB)} ${ponto(1.4, 0, zB)} ${ponto(2.6, 0, Math.min(g.Dv, zA + 1.6))} ${ponto(0.05, 0, Math.min(g.Dv, zA + 1.6))}`} fill="#fffbe8" opacity={quente ? 0.07 : 0.12} />
            {oCortina && oCortina.desenho !== 'nenhuma' && <Cortina desenho={oCortina.desenho ?? 'tecido'} cor={oCortina.cor ?? '#efe7d6'} detalhe={detalhe} a={a} b={b} y={(x, alt) => { const t = (x - a) / ((b - a) || 1); const z = zA + (zB - zA) * t; return tela(g, 0, alt, z)[1]; }} />}
          </g>
        );
      })()}
      {tipo === 'cinema' && (() => { const [x0, y0] = tela(g, g.Wm * 0.15, 2.5, 0), [x1, y1] = tela(g, g.Wm * 0.85, 0.6, 0); return <g data-peca="tela"><rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#1d2430" stroke="#0f141b" strokeWidth={2.4} /><rect x={x0 + 4} y={y0 + 4} width={x1 - x0 - 8} height={y1 - y0 - 8} fill="#2b3a52" opacity={0.6} /></g>; })()}

      {/* O piso: o trapézio em perspectiva, as tábuas ou os rejuntes convergindo para o fundo. */}
      {!externo && <polygon points={pisoPoly} fill={`url(#${id('pisoProf')})`} />}
      {!externo && <PisoDesenhado desenho={dPiso} cor={corPiso} cor2={cor2Piso} detalhe={detalhe} padrao={PADRAO_DE_PISO.has(dPiso) ? `url(#${id('pis')})` : undefined} tabuas={tabuas} fileiras={fileiras} g={g} pisoPoly={pisoPoly} />}
      {!externo && <path data-peca="rodape" data-rodape={rodapeId ?? 'simples'} d={`M0 ${CHAO_E} L${FX0} ${FY1} H${FX1} L${W} ${CHAO_D}`} stroke={rodape} strokeWidth={oRodape?.desenho === 'alto' || oRodape?.desenho === 'moldura' ? 5 : oRodape?.desenho === 'madeira' ? 3.4 : oRodape?.desenho === 'led' ? 1.6 : 2.6} fill="none" strokeLinejoin="round" />}
      {!externo && oRodape?.desenho === 'led' && <path d={`M0 ${CHAO_E - 2} L${FX0} ${FY1 - 1.5} H${FX1} L${W} ${CHAO_D - 2}`} stroke={tom1} strokeWidth={2.2} opacity={0.55 * intensidade} fill="none" />}
      {!externo && oRodape?.desenho === 'moldura' && <path d={`M0 ${TETO_E + 3} L${FX0} ${FY0 + 2.5} H${FX1} L${W} ${TETO_D + 3}`} stroke={misturar(corParede, '#ffffff', 0.6)} strokeWidth={3.2} fill="none" strokeLinejoin="round" />}
      {tipo === 'varanda' && <path data-peca="guarda-corpo" d={`M0 ${(H - 30).toFixed(1)} H${W} M0 ${(H - 8).toFixed(1)} H${W}${Array.from({ length: 17 }, (_, i) => ` M${i * 20} ${H - 30} V${H - 8}`).join('')}`} stroke="#3a3a3c" strokeWidth={1.6} opacity={0.75} />}

      {/* A piscina: a água em perspectiva, a borda de pedra, o reflexo. */}
      {pis && <g data-peca="piscina"><polygon points={quad(pis.x0 - 0.2, pis.x1 + 0.2, pis.z0 - 0.2, pis.z1 + 0.2)} fill="#e8e4dc" /><polygon points={quad(pis.x0, pis.x1, pis.z0, pis.z1)} fill="#5fb6d6" /><path d={`M${ponto(pis.x0 + 0.5, 0, pis.z0 + 0.6)} q 18 -4 36 0 t 36 0 M${ponto(pis.x0 + 1.4, 0, (pis.z0 + pis.z1) / 2)} q 18 -4 36 0`} stroke="#bfe6f2" strokeWidth={1.4} fill="none" /></g>}

      {/* A luz. */}
      {!externo && <LuzDoComodo desenho={dLuz} tom={tom1} intensidade={intensidade} lampada={id('lampada')} automacao={luz === 'automacao' || luz === 'luminotecnico'} g={g} TETO_E={TETO_E} TETO_D={TETO_D} />}

      {/* Os objetos, cada um no seu lugar: o tapete, a parede, o chão de trás para a frente. */}
      {ordem.map(p => <ObjetoPosto key={p.id} p={p.coisaId === '_abajur' ? { ...p, cor: tom1 } : p} g={g} px={largura / W} semCadeira={semCadeira} postoDe={idp => disp.postos.find(x => x.id === idp)} prefixo={id(`v${assinatura}${p.id.replace(/[^a-zA-Z0-9]/g, '')}`)} />)}

      {intensidade < 1 && <rect width={W} height={H} fill="#0d0b14" opacity={(1 - intensidade) * 0.32} pointerEvents="none" />}
      <rect width={W} height={H} fill={`url(#${id('luz')})`} pointerEvents="none" />
      <rect width={W} height={H} fill={`url(#${id('vinheta')})`} pointerEvents="none" />
    </svg>
  );
});

/** Um objeto no lugar dele: no chão (com a sombra de contato), na parede (do fundo ou da lateral), num tampo, no piso, na água. */
function ObjetoPosto({ p, g, postoDe, prefixo, px, semCadeira }: { p: Posto; g: Geometria; postoDe: (id: string) => Posto | undefined; prefixo: string; px: number; semCadeira: boolean }) {
  const cor = valida(p.cor, valida(variantesDaCoisa(p.coisaId)[0]?.cor, '#a49a8c'));
  if (p.montagem === 'tapete') return <Tapete p={p} g={g} cor={cor} />;
  // 12.8.1: as plantas variam pela semente do objeto (cada conjunto, as suas espécies).
  const nv = VARIANTES_DE_DESENHO[p.coisaId];
  const desenho = p.coisaId === 'camping' && !g.externo ? 'camping_guardado' : nv ? `${p.coisaId}#${hash(p.id) % nv}` : p.coisaId;
  const base = comEstiloDaMarca(amostraDoObjeto(desenho, cor), p.marca ? estiloDaMarca(p.marca) : undefined, `${desenho}|${cor}`);
  // O par (as mesas de cabeceira): cada posto é uma metade do desenho.
  const a: Amostra = p.metade ? metadeDe(base, p.metade) : base;
  const comum = { 'data-coisa': p.coisaId, 'data-montagem': p.montagem, ...(p.parede ? { 'data-parede': p.parede } : {}), ...(p.fixo ? { 'data-fixo': 'sim' } : {}) };
  if (p.montagem === 'parede' && p.parede === 'esq') {
    // 12.9: na parede esquerda, o mesmo paralelogramo, espelhado (quem olha vê o fundo à direita do desenho).
    const c = caixaDaAmostra(a);
    const [ax, ay] = tela(g, 0, p.base + p.h, p.z1), [bx, by] = tela(g, 0, p.base + p.h, p.z0), [, cy] = tela(g, 0, p.base, p.z1);
    const sx = (bx - ax) / (c.x1 - c.x0), skew = (by - ay) / (c.x1 - c.x0), sy = (cy - ay) / (c.y1 - c.y0);
    const m = [sx, skew, 0, sy, ax - c.x0 * sx, ay - c.x0 * skew - c.y0 * sy].map(n => n.toFixed(4)).join(' ');
    return <g data-posto={p.id} {...comum} transform={`matrix(${m})`}><Ilustracao a={a} largura={a.vb[0]} rotulo="" className="cena-comodo__objeto" /></g>;
  }
  if (p.montagem === 'parede' && p.parede === 'dir') {
    // Na parede lateral direita: o desenho vai para o plano da parede (um paralelogramo que acompanha a perspectiva).
    const c = caixaDaAmostra(a);
    const [ax, ay] = tela(g, g.Wm, p.base + p.h, p.z0), [bx, by] = tela(g, g.Wm, p.base + p.h, p.z1), [, cy] = tela(g, g.Wm, p.base, p.z0);
    const sx = (bx - ax) / (c.x1 - c.x0), skew = (by - ay) / (c.x1 - c.x0), sy = (cy - ay) / (c.y1 - c.y0);
    const m = [sx, skew, 0, sy, ax - c.x0 * sx, ay - c.x0 * skew - c.y0 * sy].map(n => n.toFixed(4)).join(' ');
    return <g data-posto={p.id} {...comum} transform={`matrix(${m})`}><Ilustracao a={a} largura={a.vb[0]} rotulo="" className="cena-comodo__objeto" /></g>;
  }
  // VIDA 13: o móvel com volume (de frente ou girado) — as faces que se veem e a frente no plano certo.
  if (temVolume(p)) return <Volume p={p} a={a} g={g} cor={cor} comum={comum} prefixo={prefixo} px={px} semCadeira={semCadeira} />;
  // Sobre um tampo: na profundidade do tampo (o desenho do móvel de baixo); no chão, o fundo do objeto. VIDA 13: no
  // móvel com volume (de frente), no meio do tampo — o tampo agora se vê.
  const host = p.sobre ? postoDe(p.sobre) : undefined;
  const zc = host ? (temVolume(host) && !host.giro ? (host.z0 + host.z1) / 2 : zDoDesenho(host) - 0.02) : zDoDesenho(p);
  const s = escalaEm(g, zc);
  const larguraTela = (p.x1 - p.x0) * g.k * s;
  const alturaMax = p.h * g.k * s * 1.3 + 2;
  const { s: esc, c, bw } = enquadrar(a, larguraTela, alturaMax);
  const xEsq = xEm(g, p.x0, zc) + (larguraTela - bw * esc) / 2;
  const yBase = p.montagem === 'parede' ? chaoEm(g, 0) - p.base * g.k : chaoEm(g, zc) - p.base * g.k * s;
  const tx = xEsq - c.x0 * esc, ty = yBase - c.y1 * esc;
  return (
    <g data-posto={p.id} {...comum}>
      {(p.montagem === 'chao') && <ellipse cx={(xEsq + bw * esc / 2).toFixed(1)} cy={(yBase + 0.5).toFixed(1)} rx={(bw * esc * 0.5).toFixed(1)} ry={(Math.max(1.2, 0.08 * g.k * s)).toFixed(1)} fill="#000000" opacity={0.16} />}
      <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${esc.toFixed(4)})`}>
        <Ilustracao a={a} largura={a.vb[0]} rotulo="" className="cena-comodo__objeto" />
      </g>
    </g>
  );
}

/**
 * VIDA 13 — O MÓVEL COM VOLUME (`volumes13.ts`): a sombra no chão do tamanho dele, as faces que a câmera vê de cada
 * bloco (a lateral, o tampo, a ponta do girado), as peças que ficam em outro plano (o espelho atrás, a banqueta na
 * frente) e a frente desenhada — de frente, numa escala; girado, em fatias, na perspectiva verdadeira do plano que foge
 * para o fundo. `semCadeira`: o cômodo já tem a cadeira de verdade (a da escrivaninha sai do desenho).
 */
function Volume({ p, a, g, cor, comum, prefixo, px, semCadeira }: { p: Posto; a: Amostra; g: Geometria; cor: string; comum: Record<string, string>; prefixo: string; px: number; semCadeira: boolean }) {
  const r = referencial(p, a);
  const todos = blocosDe(p.coisaId, a, cor);
  const blocos = semCadeira ? todos.filter(b => !b.cadeira) : todos;
  const passos = passosDoMovel(g, p, a, corDoCorpo(a, cor), blocos);
  const partes = partesDoDesenho(a, todos, semCadeira);
  const pt = (q: [number, number]) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  const e = 0.03;
  const sombra = [[p.x0 - e, p.z0], [p.x1 + e, p.z0], [p.x1 + e, p.z1 + e], [p.x0 - e, p.z1 + e]].map(([x, z]) => pt(projetar(g, [x, 0, z]))).join(' ');
  /** Um desenho (`sub`, no quadro do móvel) no plano `pf`: uma fatia de frente; no girado, várias. */
  const desenho = (chave: string, sub: Amostra, u0: number, u1: number, v0: number, v1: number, pf: number) => {
    const fs = fatias(g, r, u0, u1, v0, v1, pf, px);
    const idD = `${prefixo}${chave}`;
    const ilu = <Ilustracao a={sub} largura={sub.vb[0]} rotulo="" className="cena-comodo__objeto" semChao />;
    if (fs.length === 1) return <g transform={`matrix(${fs[0].m.map(n => n.toFixed(4)).join(' ')})`}>{ilu}</g>;
    return (
      <>
        <defs><g id={idD}>{ilu}</g></defs>
        {fs.map((f, k) => {
          // as fatias se sobrepõem só um fio (mais que isso, o vidro e o brilho translúcidos dobravam em listras; nada, e
          // aparece a fresta do antisserrilhado); a primeira e a última não cortam a borda do desenho
          const ua = k === 0 ? -200 : f.u0 - 0.06, ub = k === fs.length - 1 ? 400 : f.u1 + 0.06;
          const cid = `${idD}c${k}`;
          return (
            <g key={k} transform={`matrix(${f.m.map(n => n.toFixed(4)).join(' ')})`}>
              <clipPath id={cid}><rect x={ua.toFixed(3)} y={-400} width={(ub - ua).toFixed(3)} height={1000} /></clipPath>
              <g clipPath={`url(#${cid})`}><use href={`#${idD}`} /></g>
            </g>
          );
        })}
      </>
    );
  };
  const c = r.c;
  return (
    <g data-posto={p.id} {...comum} data-volume="sim" {...(p.giro ? { 'data-giro': p.giro } : {})}>
      <polygon data-peca="sombra" points={sombra} fill="#000000" opacity={0.14} />
      {passos.map((s, i) => s.tipo === 'face'
        ? <polygon key={i} data-peca={s.face.tipo} points={s.face.pts.map(pt).join(' ')} fill={s.face.cor} stroke={misturar(s.face.cor, '#000000', 0.32)} strokeWidth={0.35} strokeLinejoin="round" />
        : s.tipo === 'pecas' ? <g key={i} data-peca="plano">{partes.porBloco.get(s.bloco) && desenho(`b${i}`, partes.porBloco.get(s.bloco)!, c.x0, c.x1, c.y0, c.y1, s.bloco.p0)}</g>
          : <g key={i} data-peca="frente">{desenho('f', partes.frente, c.x0, c.x1, c.y0, c.y1, 0)}</g>)}
    </g>
  );
}

const METADES = new WeakMap<Amostra, { esq: Amostra; dir: Amostra }>();
function metadeDe(a: Amostra, lado: 'esq' | 'dir'): Amostra {
  let m = METADES.get(a);
  if (!m) {
    const meio = a.vb[0] / 2;
    m = { esq: { ...a, vb: [meio, a.vb[1]], sombra: undefined }, dir: { ...a, vb: [meio, a.vb[1]], sombra: undefined, pecas: [{ tipo: 'grupo', t: `translate(${-meio} 0)`, pecas: a.pecas }] } };
    METADES.set(a, m);
  }
  return m[lado];
}

/** O tapete: deitado no piso, em perspectiva, com a borda (o persa, com a barra e o medalhão). */
function Tapete({ p, g, cor }: { p: Posto; g: Geometria; cor: string }) {
  const pt = (x: number, z: number) => tela(g, x, 0, z).map(n => n.toFixed(1)).join(',');
  const q = (i: number) => `${pt(p.x0 + i, p.z0 + i)} ${pt(p.x1 - i, p.z0 + i)} ${pt(p.x1 - i, p.z1 - i)} ${pt(p.x0 + i, p.z1 - i)}`;
  const persa = p.coisaId === 'tapete_persa';
  const [cx, cy] = tela(g, (p.x0 + p.x1) / 2, 0, (p.z0 + p.z1) / 2);
  return (
    <g data-posto={p.id} data-coisa={p.coisaId} data-montagem="tapete">
      <polygon points={q(0)} fill={cor} />
      <polygon points={q(0.12)} fill="none" stroke={misturar(cor, persa ? '#f1e6cf' : '#000000', persa ? 0.55 : 0.18)} strokeWidth={persa ? 2 : 1} />
      {persa && <><polygon points={q(0.24)} fill="none" stroke={misturar(cor, '#000000', 0.3)} strokeWidth={1} /><ellipse cx={cx} cy={cy} rx={((p.x1 - p.x0) * g.k * escalaEm(g, (p.z0 + p.z1) / 2) * 0.16).toFixed(1)} ry={((tela(g, 0, 0, p.z1)[1] - tela(g, 0, 0, p.z0)[1]) * 0.22).toFixed(1)} fill={misturar(cor, '#f1e6cf', 0.45)} /></>}
    </g>
  );
}

/* ============================================================ 12.7 · os acabamentos desenhados */

/** O padrão da parede (o mesmo nas três paredes; nas laterais, escurecido pela sombra). */
function PadraoDaParede({ id, desenho, cor, cor2 }: { id: string; desenho: string; cor: string; cor2?: string }) {
  const escuro = misturar(cor, '#000000', 0.18), claro = misturar(cor, '#ffffff', 0.35), c2 = cor2 ?? escuro;
  const p = (w: number, h: number, filhos: ReactElement) => <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse"><rect width={w} height={h} fill={cor} />{filhos}</pattern>;
  switch (desenho) {
    case 'tijolo': { const junta = misturar(cor, cor === '#ebe6dd' ? '#000000' : '#ffffff', cor === '#ebe6dd' ? 0.12 : 0.35); return p(20, 8, <path d="M0 7.6 H20 M10 0 V4 M0 4 H20 M5 4 V8 M15 4 V8" stroke={junta} strokeWidth="0.8" />); }
    case 'papel_floral': return p(16, 16, <path d="M8 2.5 q2.6 2.6 0 5.2 q-2.6 -2.6 0 -5.2 M0 11 q2.6 2.6 0 5.2 M16 11 q-2.6 2.6 0 5.2" fill={misturar(cor, '#5b4a2a', 0.35)} />);
    case 'papel_listras': return p(12, 12, <rect x={0} width={4} height={12} fill={c2} opacity={0.75} />);
    case 'papel_geometrico': return p(14, 14, <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="none" stroke={c2} strokeWidth={0.9} />);
    case 'papel_damasco': return p(18, 22, <path d="M9 3 q4 4 0 8 q-4 -4 0 -8 M9 11 q5 3 0 8 q-5 -5 0 -8 M0 0 q2 3 0 5 M18 0 q-2 3 0 5" fill={c2} opacity={0.8} />);
    case 'azulejo': return p(14, 7, <path d="M0 6.6 H14 M0 3.3 H14 M7 0 V3.3 M3.5 3.3 V6.6 M10.5 3.3 V6.6" stroke={misturar(cor, '#000000', 0.12)} strokeWidth={0.6} />);
    case 'lambri': return p(10, 6, <path d="M0 5.6 H10" stroke={escuro} strokeWidth={0.8} />);
    case 'ripado': return p(6, 10, <rect x={4.6} width={1.4} height={10} fill={misturar(cor, '#000000', 0.42)} />);
    case 'pedra': return p(24, 14, <path d="M0 5 l7 -1 l5 2 l6 -2 l6 1 M0 11 l4 -1 l6 2 l7 -2 l7 1 M7 4 v8 M18 4 v8" stroke={misturar(cor, '#000000', 0.25)} strokeWidth={0.7} fill="none" />);
    case 'cimento': return p(54, 30, <><ellipse cx={14} cy={8} rx={14} ry={6} fill={claro} opacity={0.12} /><ellipse cx={40} cy={22} rx={15} ry={6} fill={escuro} opacity={0.06} /></>);
    case 'tecido': return p(4, 4, <path d="M0 0 L4 4 M4 0 L0 4" stroke={escuro} strokeWidth={0.3} opacity={0.5} />);
    case 'marmore': return p(48, 36, <path d="M0 10 q12 -6 22 4 t26 -2 M6 30 q10 -10 20 -2 t22 -8" stroke={c2} strokeWidth={0.7} fill="none" opacity={0.85} />);
    default: return p(8, 8, <></>);
  }
}

/** Os pisos que são padrão contínuo (em perspectiva, as tábuas e os rejuntes são desenhados à parte). */
const PADRAO_DE_PISO = new Set(['marmore', 'granito', 'carpete', 'cimento', 'espinha', 'versailles', 'ladrilho']);

function PadraoDoPiso({ id, desenho, cor, cor2 }: { id: string; desenho: string; cor: string; cor2?: string }) {
  const escuro = misturar(cor, '#000000', 0.2), c2 = cor2 ?? escuro;
  const p = (w: number, h: number, filhos: ReactElement) => <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse"><rect width={w} height={h} fill={cor} />{filhos}</pattern>;
  switch (desenho) {
    case 'marmore': return p(80, 40, <path d="M0 14 q20 -10 40 2 t40 -4 M10 34 q14 -8 30 0 t34 -6" stroke={c2} strokeWidth={0.8} fill="none" opacity={0.9} />);
    case 'granito': return p(10, 10, <><circle cx={2} cy={3} r={0.8} fill={c2} /><circle cx={7} cy={7} r={0.6} fill={c2} /><circle cx={6} cy={2} r={0.5} fill="#ffffff" opacity={0.6} /></>);
    case 'carpete': return p(6, 6, <circle cx={3} cy={3} r={0.6} fill={escuro} opacity={0.35} />);
    case 'cimento': return p(70, 34, <><ellipse cx={18} cy={10} rx={20} ry={7} fill="#ffffff" opacity={0.05} /><ellipse cx={52} cy={25} rx={18} ry={6} fill="#000000" opacity={0.035} /><path d="M4 30 q18 -4 30 1" stroke="#000000" strokeWidth={0.3} opacity={0.12} fill="none" /></>);
    case 'espinha': return p(16, 8, <path d="M0 8 L8 0 M8 8 L16 0 M0 0 L8 8 M8 0 L16 8" stroke={escuro} strokeWidth={0.7} />);
    case 'versailles': return p(24, 24, <><rect width={24} height={24} fill="none" stroke={c2} strokeWidth={1} /><path d="M0 12 H24 M12 0 V24 M0 0 L24 24 M24 0 L0 24" stroke={c2} strokeWidth={0.6} /></>);
    case 'ladrilho': return p(14, 14, <><rect width={14} height={14} fill="none" stroke={escuro} strokeWidth={0.5} /><path d="M7 2 L12 7 L7 12 L2 7 Z" fill={c2} opacity={0.8} /><circle cx={7} cy={7} r={1.4} fill={cor} /></>);
    default: return p(8, 8, <></>);
  }
}

/** O piso em perspectiva: o padrão (mármore, carpete, espinha…) ou as tábuas e os rejuntes convergindo para o fundo. */
function PisoDesenhado({ desenho, cor, cor2, detalhe, padrao, tabuas, fileiras, g, pisoPoly }: { desenho: string; cor: string; cor2?: string; detalhe: boolean; padrao?: string; tabuas: number[]; fileiras: number[]; g: Geometria; pisoPoly: string }) {
  const { fx0: FX0, fx1: FX1, fy1: FY1, pf: PF, W, H } = g;
  const projetar = (xFundo: number, yFundo: number, y: number) => PF.x + (xFundo - PF.x) * ((y - PF.y) / (yFundo - PF.y));
  const linha = misturar(cor, '#000000', 0.2);
  const radial = (lista: number[]) => lista.map((x, i) => <path key={`v${i}`} d={`M${x.toFixed(1)} ${FY1} L${projetar(x, FY1, H).toFixed(1)} ${H}`} stroke={linha} strokeWidth={detalhe ? 0.7 : 1} opacity={0.8} />);
  const juntas = (lista: number[]) => lista.map((y, k) => <path key={`h${k}`} d={`M${projetar(FX0, FY1, y).toFixed(1)} ${y.toFixed(1)} H${projetar(FX1, FY1, y).toFixed(1)}`} stroke={misturar(cor, '#000000', 0.12)} strokeWidth={detalhe ? 0.7 : 1} />);
  return (
    <g data-peca="piso" data-desenho={desenho}>
      {padrao && <polygon points={pisoPoly} fill={padrao} opacity={0.85} />}
      {desenho === 'tabua' && radial(tabuas)}
      {desenho === 'tabua_larga' && radial(tabuas.filter((_, i) => i % 2 === 0))}
      {(desenho === 'rejunte' || desenho === 'ladrilho') && <>{radial(tabuas.filter((_, i) => i % 2 === 0))}{juntas(fileiras)}</>}
      {desenho === 'grande_formato' && <>{radial(tabuas.filter((_, i) => i % 4 === 0))}{juntas(fileiras.filter((_, k) => k % 2 === 1))}</>}
      {desenho === 'versailles' && radial(tabuas.filter((_, i) => i % 3 === 0))}
      {desenho === 'marmore' && cor2 && <path d={`M40 ${H - 18} q 50 -10 100 2 t 110 -6 M150 ${FY1 + 18} q 30 8 70 2`} stroke={cor2} strokeWidth={0.9} fill="none" />}
      {(desenho === 'marmore' || desenho === 'grande_formato' || desenho === 'granito') && <polygon points={`${FX0 + 40},${FY1 + 4} ${FX1 - 40},${FY1 + 4} ${W - 70},${H} 70,${H}`} fill="#ffffff" opacity={0.06} />}
    </g>
  );
}

/** A cortina (ou a persiana) na janela da parede lateral esquerda — na perspectiva da janela (`y(x, altura)`). */
function Cortina({ desenho, cor, detalhe, a, b, y }: { desenho: string; cor: string; detalhe: boolean; a: number; b: number; y: (x: number, alt: number) => number }) {
  const dobra = misturar(cor, '#000000', 0.18);
  const lw = Math.max(4, (b - a) * 0.28);
  if (desenho === 'tecido') {
    const pano = (x0: number, x1: number) => <polygon points={`${x0.toFixed(1)},${y(x0, 2.45).toFixed(1)} ${x1.toFixed(1)},${y(x1, 2.45).toFixed(1)} ${x1.toFixed(1)},${y(x1, 0.02).toFixed(1)} ${x0.toFixed(1)},${y(x0, 0.02).toFixed(1)}`} fill={cor} stroke={dobra} strokeWidth={0.6} />;
    return <g data-peca="cortina" data-desenho={desenho}>{pano(a - lw * 0.7, a + lw * 0.3)}{pano(b - lw * 0.3, b + lw * 0.6)}{detalhe && [a - lw * 0.4, a, b, b + lw * 0.3].map(x => <path key={x} d={`M${x.toFixed(1)} ${y(x, 2.4).toFixed(1)} V${y(x, 0.05).toFixed(1)}`} stroke={dobra} strokeWidth={0.6} />)}<path d={`M${(a - lw * 0.8).toFixed(1)} ${y(a - lw * 0.8, 2.48).toFixed(1)} L${(b + lw * 0.7).toFixed(1)} ${y(b + lw * 0.7, 2.48).toFixed(1)}`} stroke="#5a5550" strokeWidth={1} /></g>;
  }
  const ate = desenho === 'rolo' ? 1.7 : desenho === 'romana' ? 1.55 : 1.35;
  return (
    <g data-peca="cortina" data-desenho={desenho}>
      <polygon points={`${a.toFixed(1)},${y(a, 2.15).toFixed(1)} ${b.toFixed(1)},${y(b, 2.15).toFixed(1)} ${b.toFixed(1)},${y(b, ate).toFixed(1)} ${a.toFixed(1)},${y(a, ate).toFixed(1)}`} fill={cor} opacity={desenho === 'persiana' ? 0.9 : 1} />
      {desenho === 'persiana' && [2.05, 1.92, 1.79, 1.66, 1.53, 1.4].map(h => <path key={h} d={`M${a.toFixed(1)} ${y(a, h).toFixed(1)} L${b.toFixed(1)} ${y(b, h).toFixed(1)}`} stroke={dobra} strokeWidth={0.6} />)}
      {desenho === 'romana' && [1.95, 1.75].map(h => <path key={h} d={`M${a.toFixed(1)} ${y(a, h).toFixed(1)} L${b.toFixed(1)} ${y(b, h).toFixed(1)}`} stroke={dobra} strokeWidth={1.1} />)}
    </g>
  );
}

/** A luminária: cada tipo de luz com o seu desenho e o seu facho, na cor da temperatura escolhida. */
function LuzDoComodo({ desenho, tom, intensidade, lampada, automacao, g, TETO_E, TETO_D }: { desenho: string; tom: string; intensidade: number; lampada: string; automacao: boolean; g: Geometria; TETO_E: number; TETO_D: number }) {
  const k = intensidade;
  const { fx0: FX0, fx1: FX1, fy0: FY0, fy1: FY1, W, H } = g;
  void H;
  const pendente = (px: number, len = 22) => <g key={px}><path d={`M${px} 0 V${len}`} stroke="#3a3530" strokeWidth={0.8} /><path d={`M${px - 6} ${len + 5} l 6 -5 l 6 5 Z`} fill="#2e2b28" /><circle cx={px} cy={len + 6} r={2.2} fill={tom} /><path d={`M${px - 5} ${len + 7} L${px - 18} ${FY1 - 6} H${px + 18} L${px + 5} ${len + 7} Z`} fill={tom} opacity={0.08 * k} /></g>;
  return (
    <g data-peca="luz" data-desenho={desenho}>
      {desenho === 'teto' && <><path d="M160 0 V12" stroke="#5a5550" strokeWidth={1} /><circle cx={160} cy={15} r={3.4} fill={tom} /><path d={`M156 17 L${FX0 + 30} ${FY1} H${FX1 - 30} L164 17 Z`} fill={`url(#${lampada})`} /></>}
      {desenho === 'plafon' && <><ellipse cx={160} cy={6} rx={16} ry={3.6} fill="#f4f2ec" stroke="#cfcac0" strokeWidth={0.6} /><path d={`M146 8 L${FX0 + 20} ${FY1} H${FX1 - 20} L174 8 Z`} fill={`url(#${lampada})`} /></>}
      {/* 12.8.1: o abajur é a luminária de pé, um objeto do chão posto pela disposição (`_abajur`). */}
      {desenho === 'arandelas' && [FX0 + 34, FX1 - 34].map(x => <g key={x}><rect x={x - 3} y={44} width={6} height={9} rx={1.5} fill="#c9a76a" /><path d={`M${x - 3} 44 L${x - 9} 24 H${x + 9} L${x + 3} 44 Z M${x - 3} 53 L${x - 8} 72 H${x + 8} L${x + 3} 53 Z`} fill={tom} opacity={0.3 * k} /></g>)}
      {desenho === 'pendentes' && [130, 160, 190].map(px => pendente(px, 30))}
      {desenho === 'trilho' && <><path d={`M${FX0 + 30} 4 H${FX1 - 30}`} stroke="#2e2b28" strokeWidth={1.6} />{[100, 140, 180, 220].map(px => <g key={px}><rect x={px - 2.5} y={4} width={5} height={6} fill="#2e2b28" /><path d={`M${px - 2} 10 L${px - 14} ${FY1 - 10} H${px + 10} L${px + 2} 10 Z`} fill={tom} opacity={0.09 * k} /></g>)}</>}
      {(desenho === 'fita' || desenho === 'sanca') && <><path d={`M${FX0} ${FY0 + 1} H${FX1}`} stroke={tom} strokeWidth={2} opacity={0.85 * k} /><path d={`M${FX0} ${FY0 + 3} H${FX1}`} stroke={tom} strokeWidth={6} opacity={0.18 * k} /><path d={`M0 ${TETO_E + 1} L${FX0} ${FY0 + 1} M${FX1} ${FY0 + 1} L${W} ${TETO_D + 1}`} stroke={tom} strokeWidth={2} opacity={0.6 * k} /></>}
      {desenho === 'sanca' && [120, 160, 200].map(px => pendente(px))}
      {desenho === 'destaque' && [FX0 + 50, 160, FX1 - 50].map(x => <g key={x}><circle cx={x} cy={FY0 + 3} r={2} fill="#2e2b28" /><ellipse cx={x} cy={FY0 + 40} rx={20} ry={26} fill={tom} opacity={0.16 * k} /></g>)}
      {(desenho === 'lustre' || desenho === 'lustre_cristal') && (
        <g>
          <path d="M160 0 V14" stroke="#7a6a48" strokeWidth={1} />
          <path d={desenho === 'lustre' ? 'M144 22 Q160 12 176 22' : 'M138 24 Q160 8 182 24'} stroke="#b4935a" strokeWidth={1.6} fill="none" />
          {(desenho === 'lustre' ? [146, 160, 174] : [140, 150, 160, 170, 180]).map(x => <g key={x}><circle cx={x} cy={desenho === 'lustre' ? 22 : 24} r={2.2} fill={tom} />{desenho === 'lustre_cristal' && <path d={`M${x} ${26} v6 M${x - 2} 29 h4`} stroke="#e8f2ff" strokeWidth={0.8} />}</g>)}
          {desenho === 'lustre_cristal' && <path d="M150 30 l10 12 l10 -12" stroke="#e8f2ff" strokeWidth={0.8} fill="none" />}
          <circle cx={160} cy={26} r={desenho === 'lustre' ? 34 : 46} fill={tom} opacity={0.12 * k} />
        </g>
      )}
      {automacao && <rect x={FX1 + 10} y={70} width={8} height={12} rx={2} fill="#22262b" stroke="#6fd3ff" strokeWidth={0.8} />}
    </g>
  );
}
