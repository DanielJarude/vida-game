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
import { memo, useId, type ReactElement } from 'react';
import { Ilustracao, valida } from './nucleo';
import { amostraDoObjeto } from './objetos';
import { variantesDaCoisa } from '../../motor/dados/pertences';
import { misturar } from '../avatar/cores';
import { opcaoDeAcabamento } from '../../motor/dados/lar';

export interface ObjetoNaCena { coisaId: string; cor?: string; id: string }

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
/** O que se encosta na parede do fundo (os móveis grandes, a TV, o que fica de pé): o resto vem para a frente. */
const ENCOSTA = new Set(['sofa', 'cama', 'colchao', 'escrivaninha', 'piano', 'tv', 'estacao_musculacao', 'som_hifi', 'home_studio', 'livros', 'livros_estudo', 'maquina_lavar', 'lava_loucas', 'cozinha_equipada', 'ar_condicionado', 'teclado', 'computador', 'mesa_jantar', 'cavalete']);

/* A geometria da perspectiva (a cena tem 320 × 180). */
const W = 320, H = 180;
const FX0 = 46, FX1 = 274, FY0 = 10, FY1 = 116; // a parede do fundo
const PF = { x: 160, y: 50 }; // o ponto de fuga
/** Onde um ponto do fundo vai parar na altura `y` (a reta do ponto de fuga até ele). */
const projetar = (xFundo: number, yFundo: number, y: number) => PF.x + (xFundo - PF.x) * ((y - PF.y) / (yFundo - PF.y));
/** A altura em que a reta do ponto de fuga por um canto do fundo cruza a borda da cena (x = 0 ou x = W). */
const naBorda = (xFundo: number, yFundo: number, xBorda: number) => PF.y + (yFundo - PF.y) * ((xBorda - PF.x) / (xFundo - PF.x));
const TETO_E = naBorda(FX0, FY0, 0), TETO_D = naBorda(FX1, FY0, W), CHAO_E = naBorda(FX0, FY1, 0), CHAO_D = naBorda(FX1, FY1, W);
/** A escala de um objeto apoiado no chão na altura `y` (1 na frente da cena, menor no fundo). */
const escalaNo = (y: number) => (y - PF.y) / (H - 14 - PF.y);

/** 12.7: o desenho de cada luz (as antigas pelo id; as novas pelo catálogo). */
const TOM_DA_LUZ = { quente: ['#ffd9a0', '#ffb86b'], neutra: ['#fff3d6', '#ffe9c2'], fria: ['#e3f1ff', '#cfe6ff'] } as const;

export const CenaDoComodo = memo(function CenaDoComodo({ tipo, parede, piso, luz = 'simples', rodape: rodapeId, cortina: cortinaId, luzRegulada, objetos, largura = 320, rotulo }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${uid}-${k}`;
  const externo = EXTERNOS.has(tipo);
  const corParede = parede?.cor ?? (externo ? '#bcd7e6' : '#e9e3d8');
  const corPiso = piso?.cor ?? (tipo === 'banheiro' || tipo === 'cozinha' ? '#cfc6b6' : '#b9a68a');
  const detalhe = largura >= 200;
  // 12.7: o desenho de cada acabamento vem do catálogo; a miniatura desenha o mesmo padrão (mais simples), não outro.
  const dParede = opcaoDeAcabamento('parede', parede?.id)?.desenho ?? (parede?.id === 'tijolo' ? 'tijolo' : parede?.id === 'papel' ? 'papel_floral' : parede?.id === 'boiserie' ? 'boiserie' : 'liso');
  const cor2Parede = opcaoDeAcabamento('parede', parede?.id)?.cor2;
  const dPiso = opcaoDeAcabamento('piso', piso?.id)?.desenho ?? (!piso && (tipo === 'banheiro' || tipo === 'cozinha') ? 'rejunte' : piso ? 'tabua' : 'liso');
  const cor2Piso = opcaoDeAcabamento('piso', piso?.id)?.cor2;
  const dLuz = opcaoDeAcabamento('luz', luz)?.desenho ?? 'teto';
  const temperatura = luzRegulada?.temperatura ?? (dLuz === 'teto' || dLuz === 'plafon' ? 'neutra' : 'quente');
  const intensidade = Math.max(40, Math.min(100, luzRegulada?.intensidade ?? 100)) / 100;
  const quente = temperatura === 'quente' && dLuz !== 'teto';
  const [tom1, tom2] = TOM_DA_LUZ[temperatura];
  const oRodape = opcaoDeAcabamento('rodape', rodapeId);
  const oCortina = opcaoDeAcabamento('cortina', cortinaId);
  const janela = !externo && tipo !== 'cinema' && tipo !== 'banheiro';
  // As paredes: a do fundo na cor escolhida; a lateral esquerda (a da janela) um pouco mais escura; a direita, mais.
  const pEsq = misturar(corParede, '#000000', 0.09), pDir = misturar(corParede, '#000000', 0.17), teto = misturar(corParede, '#ffffff', 0.32);
  const pisoFundo = misturar(corPiso, '#000000', 0.16);
  const rodape = oRodape?.cor ?? misturar(corParede, '#000000', 0.22);
  const comPadrao = dParede !== 'liso' && dParede !== 'boiserie';
  const preenchida = comPadrao ? `url(#${id('par')})` : corParede;
  const chaoExterno = tipo === 'garagem' ? '#a8a49d' : '#86a86f';

  /* Os objetos: os que encostam vão para a parede do fundo (até caber); os outros, para a fileira da frente. */
  const fixos = FIXOS[tipo]?.largura ?? 0;
  const itens = objetos.map(o => ({ ...o, w: LARGURA[o.coisaId] ?? PADRAO })).sort((a, b) => b.w - a.w);
  const sF = escalaNo(FY1 + 2); // a escala na parede do fundo
  const livreFundo = (FX1 - FX0 - 12) / sF - fixos;
  const fundo: typeof itens = [], frente: typeof itens = [];
  let usado = 0;
  for (const o of itens) {
    if (ENCOSTA.has(o.coisaId) && usado + o.w + 8 <= livreFundo) { fundo.push(o); usado += o.w + 8; }
    else frente.push(o);
  }
  const yFrente = H - 22;
  const sFr = escalaNo(yFrente);
  const livreFrente = (W - 40) / sFr;
  const somaFrente = frente.reduce((s, x) => s + x.w + 10, 0);
  const kFr = somaFrente > livreFrente ? livreFrente / somaFrente : 1;
  const posicionar = (lista: typeof itens, x0: number, yBase: number, s: number, k: number, gap: number) => {
    let x = x0;
    return lista.map(o => {
      const cor = valida(o.cor, valida(variantesDaCoisa(o.coisaId)[0]?.cor, '#a49a8c'));
      const a = amostraDoObjeto(o.coisaId, cor);
      const w = o.w * s * k;
      const h = w * a.vb[1] / a.vb[0];
      const chaoA = (a.chao ?? a.vb[1]) / a.vb[1] * h;
      const pos = { ...o, cor, w, h, x, y: yBase - chaoA, base: yBase };
      x += w + gap * s * k;
      return pos;
    });
  };
  const larguraFundo = fundo.reduce((s2, o) => s2 + o.w * sF + 8 * sF, 0);
  const x0Fundo = FX0 + 6 + fixos * sF + Math.max(0, (FX1 - FX0 - 12 - fixos * sF - larguraFundo) * (janela ? 0.5 : 0.3));
  const postosFundo = posicionar(fundo, x0Fundo, FY1 + 2, sF, 1, 8);
  // A fileira da frente fica centrada (o meio da sala), mais para a direita quando há o que é fixo à esquerda.
  const larguraFr = frente.reduce((s2, o) => s2 + (o.w + 10) * sFr * kFr, 0);
  const postosFrente = posicionar(frente, Math.max(16, (W - larguraFr) / 2 + (fixos ? 20 : 0)), yFrente, sFr, kFr, 10);

  const pisoPoly = `${FX0},${FY1} ${FX1},${FY1} ${W},${CHAO_D} ${W},${H} 0,${H} 0,${CHAO_E}`;
  const tabuas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => FX0 + (FX1 - FX0) * i / 10);
  const fileiras = [1, 2, 3, 4, 5].map(k => FY1 + (H - FY1) * (k / 5.4) ** 1.5);

  return (
    <svg className="cena-comodo cena-comodo--25d" viewBox={`0 0 ${W} ${H}`} width={largura} height={Math.round(largura * H / W)} role="img" aria-label={rotulo} data-comodo={tipo} data-parede={parede?.id} data-piso={piso?.id} data-luz={luz} data-cortina={cortinaId} data-rodape={rodapeId} data-temperatura={temperatura} data-intensidade={Math.round(intensidade * 100)}>
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
        /* Lá fora: o céu, o horizonte, o chão em perspectiva (a grama ou o piso da garagem). */
        <g data-peca="exterior">
          <rect width={W} height={FY1} fill={corParede} />
          <circle cx={262} cy={30} r={13} fill="#f6d77a" opacity={0.9} />
          <path d={`M0 ${FY1 - 22} q 60 -16 120 0 t 120 -4 t 80 2 V ${FY1} H0 Z`} fill="#9fbf8f" opacity={0.6} />
          <polygon points={`0,${FY1} ${W},${FY1} ${W},${H} 0,${H}`} fill={`url(#${id('pisoProf')})`} />
          {detalhe && tipo !== 'garagem' && fileiras.map((y, k) => <path key={k} d={`M0 ${y.toFixed(1)} H${W}`} stroke={misturar(chaoExterno, '#000000', 0.08)} strokeWidth={0.8} />)}
        </g>
      ) : (
        <g data-peca="paredes">
          {/* O teto, as paredes laterais, a parede do fundo. */}
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
          {dParede === 'boiserie' && [0, 1, 2].map(k => <g key={k}><rect x={FX0 + 10 + k * 74} y={FY0 + 14} width={62} height={38} rx={2} fill="none" stroke={cor2Parede ?? misturar(corParede, '#000000', 0.14)} strokeWidth={detalhe ? 1.2 : 1.8} /><rect x={FX0 + 10 + k * 74} y={FY0 + 60} width={62} height={32} rx={2} fill="none" stroke={cor2Parede ?? misturar(corParede, '#000000', 0.14)} strokeWidth={detalhe ? 1.2 : 1.8} /></g>)}
          {dParede === 'boiserie' && <path d={`M${FX0} ${FY0 + 56} H${FX1}`} stroke={cor2Parede ?? misturar(corParede, '#000000', 0.16)} strokeWidth={1.4} />}
          {/* Os cantos (onde a luz não chega) e as arestas do teto. */}
          <path d={`M${FX0} ${FY0} V${FY1} M${FX1} ${FY0} V${FY1}`} stroke={misturar(corParede, '#000000', 0.25)} strokeWidth={1} />
          <path d={`M0 ${TETO_E} L${FX0} ${FY0} H${FX1} L${W} ${TETO_D}`} stroke={misturar(corParede, '#000000', 0.15)} strokeWidth={0.8} fill="none" />
          <rect x={FX0} y={FY1 - 14} width={FX1 - FX0} height={14} fill={`url(#${id('pe')})`} />
        </g>
      )}

      {/* A janela: na parede lateral esquerda (em perspectiva), e o rastro de luz no chão. */}
      {janela && (
        <g data-peca="janela">
          {/* A janela na parede lateral: as alturas seguem a perspectiva da parede (alta perto, baixa no fundo). */}
          {(() => {
            const a = 10, b = 36;
            const yAt = (x: number, yFundo: number) => PF.y + (yFundo - PF.y) * ((x - PF.x) / (FX0 - PF.x));
            const [t1, t2, b1, b2] = [yAt(a, 34), yAt(b, 34), yAt(a, 84), yAt(b, 84)];
            const m = (a + b) / 2;
            return <>
              <polygon points={`${a},${t1.toFixed(1)} ${b},${t2.toFixed(1)} ${b},${b2.toFixed(1)} ${a},${b1.toFixed(1)}`} fill="#cfe3ee" stroke={misturar(pEsq, '#000000', 0.3)} strokeWidth={2.2} strokeLinejoin="round" />
              <path d={`M${m} ${yAt(m, 34).toFixed(1)} V${yAt(m, 84).toFixed(1)}`} stroke={misturar(pEsq, '#000000', 0.3)} strokeWidth={1.4} />
              {detalhe && <path d={`M${a + 2} ${(b1 - 4).toFixed(1)} l 8 -14 l 5 6 l 7 -10 l 4 5 V ${(b2 - 2).toFixed(1)} Z`} fill="#a9c6a0" opacity={0.7} />}
              <polygon points={`${FX0 - 2},${FY1 + 3} ${FX0 + 60},${FY1 + 5} 200,${H} 20,${H}`} fill="#fffbe8" opacity={quente ? 0.07 : 0.12} />
            </>;
          })()}
        </g>
      )}
      {janela && oCortina && oCortina.desenho !== 'nenhuma' && <Cortina desenho={oCortina.desenho ?? 'tecido'} cor={oCortina.cor ?? '#efe7d6'} detalhe={detalhe} />}
      {tipo === 'cinema' && <g data-peca="tela"><rect x={FX0 + 26} y={FY0 + 8} width={FX1 - FX0 - 52} height={60} fill="#1d2430" stroke="#0f141b" strokeWidth={2.4} /><rect x={FX0 + 30} y={FY0 + 12} width={FX1 - FX0 - 60} height={52} fill="#2b3a52" opacity={0.6} /></g>}

      {/* O piso: o trapézio em perspectiva, as tábuas ou os rejuntes convergindo para o fundo. */}
      {!externo && <polygon points={pisoPoly} fill={`url(#${id('pisoProf')})`} />}
      {!externo && <PisoDesenhado desenho={dPiso} cor={corPiso} cor2={cor2Piso} detalhe={detalhe} padrao={PADRAO_DE_PISO.has(dPiso) ? `url(#${id('pis')})` : undefined} tabuas={tabuas} fileiras={fileiras} />}
      {/* O rodapé, nas três paredes. */}
      {!externo && <path data-peca="rodape" data-rodape={rodapeId ?? 'simples'} d={`M0 ${CHAO_E} L${FX0} ${FY1} H${FX1} L${W} ${CHAO_D}`} stroke={rodape} strokeWidth={oRodape?.desenho === 'alto' || oRodape?.desenho === 'moldura' ? 5 : oRodape?.desenho === 'madeira' ? 3.4 : oRodape?.desenho === 'led' ? 1.6 : 2.6} fill="none" strokeLinejoin="round" />}
      {!externo && oRodape?.desenho === 'led' && <path d={`M0 ${CHAO_E - 2} L${FX0} ${FY1 - 1.5} H${FX1} L${W} ${CHAO_D - 2}`} stroke={tom1} strokeWidth={2.2} opacity={0.55 * intensidade} fill="none" />}
      {!externo && oRodape?.desenho === 'moldura' && <path d={`M0 ${TETO_E + 3} L${FX0} ${FY0 + 2.5} H${FX1} L${W} ${TETO_D + 3}`} stroke={misturar(corParede, '#ffffff', 0.6)} strokeWidth={3.2} fill="none" strokeLinejoin="round" />}

      {/* O que todo cômodo desse tipo tem, na parede do fundo (na escala de lá). */}
      {FIXOS[tipo] && <g transform={`translate(${FX0 + 4} ${FY1 + 2}) scale(${sF.toFixed(3)}) translate(-10 -${CHAO_FIXO})`}>{FIXOS[tipo].desenho(CHAO_FIXO, corParede)}</g>}
      {tipo === 'piscina' && <g data-peca="piscina"><polygon points={`70,${FY1 + 14} 250,${FY1 + 14} 296,${H - 10} 24,${H - 10}`} fill="#5fb6d6" stroke="#e8e4dc" strokeWidth={4} strokeLinejoin="round" /><path d={`M80 ${FY1 + 34} q 24 -6 48 0 t 48 0 M150 ${FY1 + 48} q 24 -6 48 0`} stroke="#bfe6f2" strokeWidth={1.4} fill="none" /></g>}

      {/* A luz. */}
      {!externo && <LuzDoComodo desenho={dLuz} tom={tom1} intensidade={intensidade} lampada={id('lampada')} automacao={luz === 'automacao' || luz === 'luminotecnico'} />}
      {/* 12.7: a intensidade baixa escurece a cena (o dimmer), a alta não mexe. */}
      {intensidade < 1 && <rect width={W} height={H} fill="#0d0b14" opacity={(1 - intensidade) * 0.32} pointerEvents="none" />}

      {/* Os objetos: o fundo primeiro (mais longe), depois a frente — cada um com a sombra de contato no piso. */}
      {[...postosFundo, ...postosFrente].map(o => (
        <g key={o.id} data-fileira={postosFundo.includes(o) ? 'fundo' : 'frente'}>
          <ellipse cx={(o.x + o.w / 2).toFixed(1)} cy={(o.base + 0.5).toFixed(1)} rx={(o.w * 0.5).toFixed(1)} ry={(2.6 * escalaNo(o.base)).toFixed(1)} fill="#000000" opacity={0.16} />
          <g transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})`}>
            <Ilustracao a={amostraDoObjeto(o.coisaId, o.cor)} largura={o.w} rotulo="" className="cena-comodo__objeto" dados={{ 'data-coisa': o.coisaId }} />
          </g>
        </g>
      ))}
      <rect width={W} height={H} fill={`url(#${id('luz')})`} pointerEvents="none" />
      <rect width={W} height={H} fill={`url(#${id('vinheta')})`} pointerEvents="none" />
    </svg>
  );
});

/** A linha do chão em que os fixos são desenhados (eles vão para a parede do fundo pela escala de lá). */
const CHAO_FIXO = 132;

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
      <rect x={10} y={chao + 1} width={110} height={3} fill="#000000" opacity={0.12} />
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
    <g data-peca="arvore"><rect x={30} y={chao - 60} width={8} height={62} fill="#7a5a3a" /><circle cx={34} cy={chao - 70} r={26} fill="#5f8f4e" /><circle cx={20} cy={chao - 60} r={16} fill="#6f9f5c" /><ellipse cx={34} cy={chao + 1} rx={20} ry={3} fill="#000000" opacity={0.15} /></g>) },
  piscina: { largura: 0, desenho: () => <></> },
  lazer: { largura: 90, desenho: chao => (
    <g data-peca="churrasqueira"><rect x={14} y={chao - 70} width={70} height={72} fill="#b0654a" /><rect x={26} y={chao - 52} width={46} height={26} fill="#2b2522" /><rect x={34} y={chao - 104} width={30} height={36} fill="#9a5640" /><rect x={14} y={chao + 1} width={70} height={3} fill="#000000" opacity={0.15} /></g>) },
  garagem: { largura: 0, desenho: chao => (
    <g data-peca="portao"><rect x={40} y={chao - 104} width={240} height={106} fill="#c9c4bb" stroke="#8f8a82" strokeWidth={2} />{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M40 ${chao - 92 + i * 12} H280`} stroke="#a9a49b" strokeWidth={1} />)}</g>) }
};

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
    case 'cimento': return p(30, 20, <><circle cx={8} cy={6} r={5} fill={claro} opacity={0.25} /><circle cx={22} cy={14} r={6} fill={escuro} opacity={0.12} /></>);
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
    case 'cimento': return p(40, 24, <><circle cx={10} cy={8} r={7} fill="#ffffff" opacity={0.12} /><circle cx={30} cy={18} r={8} fill="#000000" opacity={0.07} /></>);
    case 'espinha': return p(16, 8, <path d="M0 8 L8 0 M8 8 L16 0 M0 0 L8 8 M8 0 L16 8" stroke={escuro} strokeWidth={0.7} />);
    case 'versailles': return p(24, 24, <><rect width={24} height={24} fill="none" stroke={c2} strokeWidth={1} /><path d="M0 12 H24 M12 0 V24 M0 0 L24 24 M24 0 L0 24" stroke={c2} strokeWidth={0.6} /></>);
    case 'ladrilho': return p(14, 14, <><rect width={14} height={14} fill="none" stroke={escuro} strokeWidth={0.5} /><path d="M7 2 L12 7 L7 12 L2 7 Z" fill={c2} opacity={0.8} /><circle cx={7} cy={7} r={1.4} fill={cor} /></>);
    default: return p(8, 8, <></>);
  }
}

/** O piso em perspectiva: o padrão (mármore, carpete, espinha…) ou as tábuas e os rejuntes convergindo para o fundo. */
function PisoDesenhado({ desenho, cor, cor2, detalhe, padrao, tabuas, fileiras }: { desenho: string; cor: string; cor2?: string; detalhe: boolean; padrao?: string; tabuas: number[]; fileiras: number[] }) {
  const pisoPoly = `${FX0},${FY1} ${FX1},${FY1} ${W},${CHAO_D} ${W},${H} 0,${H} 0,${CHAO_E}`;
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
      {/* O brilho do piso polido. */}
      {(desenho === 'marmore' || desenho === 'grande_formato' || desenho === 'granito') && <polygon points={`${FX0 + 40},${FY1 + 4} ${FX1 - 40},${FY1 + 4} ${W - 70},${H} 70,${H}`} fill="#ffffff" opacity={0.06} />}
    </g>
  );
}

/** A cortina (ou a persiana) na janela da parede lateral esquerda — na perspectiva da janela. */
function Cortina({ desenho, cor, detalhe }: { desenho: string; cor: string; detalhe: boolean }) {
  const yAt = (x: number, yFundo: number) => PF.y + (yFundo - PF.y) * ((x - PF.x) / (FX0 - PF.x));
  const a = 10, b = 36;
  const dobra = misturar(cor, '#000000', 0.18);
  if (desenho === 'tecido') {
    // Dois panos, um de cada lado da janela, do teto ao chão.
    const pano = (x0: number, x1: number) => <polygon points={`${x0},${yAt(x0, 24).toFixed(1)} ${x1},${yAt(x1, 24).toFixed(1)} ${x1},${yAt(x1, FY1).toFixed(1)} ${x0},${yAt(x0, FY1).toFixed(1)}`} fill={cor} stroke={dobra} strokeWidth={0.6} />;
    return <g data-peca="cortina" data-desenho={desenho}>{pano(a - 7, a + 3)}{pano(b - 3, b + 6)}{detalhe && [a - 4, a, b, b + 3].map(x => <path key={x} d={`M${x} ${yAt(x, 26).toFixed(1)} V${yAt(x, FY1 - 2).toFixed(1)}`} stroke={dobra} strokeWidth={0.6} />)}<path d={`M${a - 8} ${yAt(a - 8, 23).toFixed(1)} L${b + 7} ${yAt(b + 7, 23).toFixed(1)}`} stroke="#5a5550" strokeWidth={1} /></g>;
  }
  const alto = desenho === 'rolo' ? 46 : desenho === 'romana' ? 52 : 60;
  return (
    <g data-peca="cortina" data-desenho={desenho}>
      <polygon points={`${a},${yAt(a, 34).toFixed(1)} ${b},${yAt(b, 34).toFixed(1)} ${b},${yAt(b, alto).toFixed(1)} ${a},${yAt(a, alto).toFixed(1)}`} fill={cor} opacity={desenho === 'persiana' ? 0.9 : 1} />
      {desenho === 'persiana' && [38, 42, 46, 50, 54, 58].map(y => <path key={y} d={`M${a} ${yAt(a, y).toFixed(1)} L${b} ${yAt(b, y).toFixed(1)}`} stroke={dobra} strokeWidth={0.6} />)}
      {desenho === 'romana' && [42, 48].map(y => <path key={y} d={`M${a} ${yAt(a, y).toFixed(1)} L${b} ${yAt(b, y).toFixed(1)}`} stroke={dobra} strokeWidth={1.1} />)}
    </g>
  );
}

/** A luminária: cada tipo de luz com o seu desenho e o seu facho, na cor da temperatura escolhida. */
function LuzDoComodo({ desenho, tom, intensidade, lampada, automacao }: { desenho: string; tom: string; intensidade: number; lampada: string; automacao: boolean }) {
  const k = intensidade;
  const pendente = (px: number, len = 22) => <g key={px}><path d={`M${px} 0 V${len}`} stroke="#3a3530" strokeWidth={0.8} /><path d={`M${px - 6} ${len + 5} l 6 -5 l 6 5 Z`} fill="#2e2b28" /><circle cx={px} cy={len + 6} r={2.2} fill={tom} /><path d={`M${px - 5} ${len + 7} L${px - 18} ${FY1 - 6} H${px + 18} L${px + 5} ${len + 7} Z`} fill={tom} opacity={0.08 * k} /></g>;
  return (
    <g data-peca="luz" data-desenho={desenho}>
      {desenho === 'teto' && <><path d="M160 0 V12" stroke="#5a5550" strokeWidth={1} /><circle cx={160} cy={15} r={3.4} fill={tom} /><path d={`M156 17 L${FX0 + 30} ${FY1} H${FX1 - 30} L164 17 Z`} fill={`url(#${lampada})`} /></>}
      {desenho === 'plafon' && <><ellipse cx={160} cy={6} rx={16} ry={3.6} fill="#f4f2ec" stroke="#cfcac0" strokeWidth={0.6} /><path d={`M146 8 L${FX0 + 20} ${FY1} H${FX1 - 20} L174 8 Z`} fill={`url(#${lampada})`} /></>}
      {desenho === 'abajur' && <><path d={`M${W - 34} ${H - 20} V 82`} stroke="#3a3530" strokeWidth={1.4} /><path d={`M${W - 44} 84 l 10 -12 h 0 l 10 12 Z`} fill="#e6b873" /><circle cx={W - 34} cy={88} r={22} fill={tom} opacity={0.22 * k} /></>}
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
