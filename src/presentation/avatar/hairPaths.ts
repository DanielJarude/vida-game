/**
 * avatar/hairPaths — cabelo com volume e implantação (Avatar 2.0).
 *
 * O problema que este módulo resolve, dito sem rodeio: o cabelo cacheado
 * anterior era literalmente uma cadeia de seis arcos circulares de mesmo
 * raio (`a6 6 0 1 1 ...`) — bolinhas coladas. E todos os outros estilos
 * eram uma tampa colada no topo do crânio, sem linha de implantação: o
 * cabelo começava onde a cabeça começava, o que nenhum cabelo faz.
 *
 * Três decisões estruturais:
 *
 * 1. **Implantação real.** Todo estilo com cabelo tem uma LINHA DE
 *    IMPLANTAÇÃO desenhada: ela desce nas têmporas, sobe no meio da testa
 *    e deixa a testa à mostra. É o que separa "pessoa com cabelo" de
 *    "pessoa de capacete".
 *
 * 2. **Volume por silhueta contínua.** A massa de cabelo é gerada a partir
 *    da elipse do crânio, com raio variável por amostra e controles que
 *    empurram a curva para fora ENTRE as amostras. O resultado é uma massa
 *    única e ondulada, não formas isoladas grudadas. Cachos e cabelo liso
 *    usam o mesmo gerador — muda só a amplitude e o número de lóbulos.
 *
 * 3. **Cacheado também tem textura interna.** Além da silhueta irregular,
 *    o cacheado recebe traços em S dentro da massa. É a combinação de
 *    contorno irregular com movimento interno que lê como cacho; contorno
 *    redondo com interior liso lê como bolinha, por mais lóbulos que tenha.
 *
 * Tudo é derivado das proporções do rosto: mudou a cabeça, o cabelo
 * acompanha. Puro: sem React, sem cor.
 */

import type { ProporcoesRosto } from './faceProportions';
import type { EstiloBarba, EstiloCabelo } from '../../data/avatar/avatarData';

const CX = 50;
const n = (v: number) => Math.round(v * 100) / 100;

interface Ponto {
  x: number;
  y: number;
}

/** Elipse que aproxima a calota craniana, a partir das medidas do rosto. */
function calota(p: ProporcoesRosto) {
  return {
    cx: CX,
    cy: p.yTempora,
    rx: p.wCranio,
    ry: p.yTempora - p.yTopo
  };
}

function pontoNaElipse(cx: number, cy: number, rx: number, ry: number, ang: number): Ponto {
  return { x: cx + rx * Math.cos(ang), y: cy + ry * Math.sin(ang) };
}

/**
 * Variações de raio dos lóbulos. Fixa e IRREGULAR de propósito: lóbulos de
 * tamanhos diferentes é o que impede a silhueta de virar uma fileira de
 * círculos iguais. Sendo fixa, o mesmo personagem tem sempre o mesmo
 * cabelo — nada é sorteado a cada render.
 */
const VARIACOES = [0.0, 0.14, -0.04, 0.19, 0.05, 0.22, -0.02, 0.16, 0.08, 0.2, 0.03, 0.17, -0.03];

/**
 * Arco superior da massa de cabelo: varre a calota da esquerda para a
 * direita, passando pelo topo.
 *
 * `amplitude` 0 devolve um arco liso; valores altos devolvem uma massa
 * volumosa e ondulada. O controle de cada trecho é empurrado para FORA do
 * maior dos dois raios vizinhos — é esse empurrão que funde os lóbulos numa
 * massa só em vez de deixá-los tangentes como moedas enfileiradas.
 */
function arcoDeVolume(
  p: ProporcoesRosto,
  folga: number,
  amplitude: number,
  lobulos: number,
  aberturaLateral = 0.1
): { d: string; inicio: Ponto; fim: Ponto } {
  const { cx, cy, rx, ry } = calota(p);
  const rxBase = rx + folga;
  const ryBase = ry + folga;

  const aIni = Math.PI * (1 - aberturaLateral);
  const aFim = Math.PI * (2 + aberturaLateral);

  const amostras: Ponto[] = [];
  const raios: number[] = [];
  for (let i = 0; i <= lobulos; i++) {
    const t = i / lobulos;
    const ang = aIni + (aFim - aIni) * t;
    const variacao = amplitude === 0 ? 0 : VARIACOES[i % VARIACOES.length] * amplitude;
    const fator = 1 + variacao;
    raios.push(fator);
    amostras.push(pontoNaElipse(cx, cy, rxBase * fator, ryBase * fator, ang));
  }

  const trechos: string[] = [];
  for (let i = 0; i < lobulos; i++) {
    const t = (i + 0.5) / lobulos;
    const ang = aIni + (aFim - aIni) * t;
    // Controle além do maior raio vizinho: a curva estufa entre as amostras.
    const fatorControle = Math.max(raios[i], raios[i + 1]) * (amplitude === 0 ? 1.02 : 1.1);
    const c = pontoNaElipse(cx, cy, rxBase * fatorControle, ryBase * fatorControle, ang);
    trechos.push(`Q ${n(c.x)} ${n(c.y)}, ${n(amostras[i + 1].x)} ${n(amostras[i + 1].y)}`);
  }

  return {
    d: trechos.join(' '),
    inicio: amostras[0],
    fim: amostras[amostras.length - 1]
  };
}

/**
 * Linha de implantação, desenhada da direita para a esquerda (para fechar
 * a massa que veio da esquerda para a direita pelo arco superior).
 *
 * `recuo` de 0 a 1 sobe a linha na testa — é o que dá entradas e, com a
 * idade, um cabelo um pouco mais recuado, sem trocar o penteado.
 * `ondulacao` quebra a linha em pequenos dentes, para que o cacheado tenha
 * implantação irregular em vez de um arco de compasso.
 */
function linhaDeImplantacao(
  p: ProporcoesRosto,
  recuo: number,
  ondulacao: number
): string {
  const { cy, ry } = calota(p);
  const yLateral = cy - ry * 0.1;
  const alturaTesta = p.ySobrancelha - p.yTopo;
  const yTesta = p.yTopo + alturaTesta * (0.3 + recuo * 0.24);
  const xLateral = p.wCranio - 0.4;
  const xEntrada = p.wCranio * (0.66 - recuo * 0.1);

  // Direita → centro → esquerda. O centro desce um pouco (bico de viúva).
  return [
    `L ${n(CX + xLateral)} ${n(yLateral)}`,
    `C ${n(CX + xLateral * 0.98)} ${n(yLateral - ry * 0.3)}, ${n(CX + xEntrada + 1.5)} ${n(yTesta - 1.6 - ondulacao)}, ${n(CX + xEntrada)} ${n(yTesta - 0.6)}`,
    `C ${n(CX + xEntrada * 0.5)} ${n(yTesta + 0.9 + ondulacao)}, ${n(CX + xEntrada * 0.24)} ${n(yTesta + 1.5)}, ${n(CX)} ${n(yTesta + 0.9)}`,
    `C ${n(CX - xEntrada * 0.24)} ${n(yTesta + 1.5)}, ${n(CX - xEntrada * 0.5)} ${n(yTesta + 0.9 + ondulacao)}, ${n(CX - xEntrada)} ${n(yTesta - 0.6)}`,
    `C ${n(CX - xEntrada - 1.5)} ${n(yTesta - 1.6 - ondulacao)}, ${n(CX - xLateral * 0.98)} ${n(yLateral - ry * 0.3)}, ${n(CX - xLateral)} ${n(yLateral)}`
  ].join(' ');
}

/** Massa de cabelo que cai atrás da cabeça, até a altura pedida. */
function caminhoComprimento(p: ProporcoesRosto, yFim: number, folga: number, curvaPonta: number): string {
  const { cy, ry } = calota(p);
  const xExterno = p.wCranio + folga;
  const yTopoLateral = cy - ry * 0.35;

  return [
    `M ${n(CX - xExterno)} ${n(yTopoLateral)}`,
    `C ${n(CX - xExterno - 1.4)} ${n(yTopoLateral + (yFim - yTopoLateral) * 0.5)}, ${n(CX - xExterno - curvaPonta)} ${n(yFim - 5)}, ${n(CX - xExterno + curvaPonta * 0.3)} ${n(yFim)}`,
    `C ${n(CX - p.wMandibula * 0.8)} ${n(yFim + 1.4)}, ${n(CX + p.wMandibula * 0.8)} ${n(yFim + 1.4)}, ${n(CX + xExterno - curvaPonta * 0.3)} ${n(yFim)}`,
    `C ${n(CX + xExterno + curvaPonta)} ${n(yFim - 5)}, ${n(CX + xExterno + 1.4)} ${n(yTopoLateral + (yFim - yTopoLateral) * 0.5)}, ${n(CX + xExterno)} ${n(yTopoLateral)}`,
    `C ${n(CX + p.wCranio * 0.6)} ${n(cy - ry * 0.9)}, ${n(CX - p.wCranio * 0.6)} ${n(cy - ry * 0.9)}, ${n(CX - xExterno)} ${n(yTopoLateral)}`,
    'Z'
  ].join(' ');
}

/** Costeletas curtas à frente da orelha — detalhe pequeno, efeito grande. */
function caminhoCosteletas(p: ProporcoesRosto, comprimento: number): string[] {
  return [1, -1].map(lado => {
    const x = CX + lado * (p.wCranio - 1.8);
    const yTopo = p.yOrelha - p.rOrelha - 1;
    return [
      `M ${n(x)} ${n(yTopo)}`,
      `L ${n(x - lado * 2.2)} ${n(yTopo)}`,
      `C ${n(x - lado * 2.4)} ${n(yTopo + comprimento * 0.6)}, ${n(x - lado * 1.6)} ${n(yTopo + comprimento)}, ${n(x - lado * 0.4)} ${n(yTopo + comprimento)}`,
      `C ${n(x + lado * 0.4)} ${n(yTopo + comprimento * 0.6)}, ${n(x)} ${n(yTopo + comprimento * 0.3)}, ${n(x)} ${n(yTopo)}`,
      'Z'
    ].join(' ');
  });
}

/** Traços em S dentro da massa: o movimento que transforma volume em cacho. */
function texturaDeCachos(p: ProporcoesRosto): string[] {
  const { cx, cy, rx, ry } = calota(p);
  const traços: string[] = [];
  const posicoes: [number, number][] = [
    [1.12, 0.62], [1.32, 0.5], [1.52, 0.66], [1.72, 0.5], [1.9, 0.64], [1.22, 0.86], [1.78, 0.86]
  ];
  for (const [fatorAngulo, fatorRaio] of posicoes) {
    const ang = Math.PI * fatorAngulo;
    const base = pontoNaElipse(cx, cy, (rx + 3) * fatorRaio, (ry + 3) * fatorRaio, ang);
    const t = 2.3;
    traços.push(
      `M ${n(base.x - t)} ${n(base.y - t * 0.5)} ` +
      `C ${n(base.x - t * 0.2)} ${n(base.y - t * 1.1)}, ${n(base.x + t * 0.2)} ${n(base.y + t * 0.2)}, ${n(base.x + t)} ${n(base.y - t * 0.35)}`
    );
  }
  return traços;
}

/* ========================================================================== */

export interface CaminhosCabelo {
  /** Desenhado ANTES da cabeça (volume e comprimento que aparecem em volta). */
  atras: string[];
  /** Desenhado DEPOIS do rosto (a parte que cobre a testa até a implantação). */
  frente: string[];
  /** Traços finos sobre a massa, para textura (cachos). */
  textura: string[];
}

const VAZIO: CaminhosCabelo = { atras: [], frente: [], textura: [] };

/**
 * Monta o cabelo de um estilo, ajustado às proporções e à idade.
 *
 * O recuo da implantação cresce devagar depois dos 55 — a mesma pessoa
 * envelhecendo, não um penteado diferente.
 */
export function construirCabelo(
  estilo: EstiloCabelo,
  p: ProporcoesRosto,
  idade: number
): CaminhosCabelo {
  const recuo = Math.min(1, Math.max(0, (idade - 55) / 30));
  // Bebê não tem penteado nem costeleta: o cabelo é uma camada rala colada
  // ao crânio. Desenhar volume e costeleta num bebê é o que fazia o retrato
  // de 0 ano parecer um adulto pequeno.
  const bebe = idade < 3;

  const touca = (folga: number, amplitude: number, lobulos: number, ondulacao = 0) => {
    const arco = arcoDeVolume(p, folga, amplitude, lobulos);
    return `M ${n(arco.inicio.x)} ${n(arco.inicio.y)} ${arco.d} ${linhaDeImplantacao(p, recuo, ondulacao)} Z`;
  };

  switch (estilo) {
    case 'careca':
      return VAZIO;

    case 'curto':
      return {
        atras: [],
        frente: bebe ? [touca(0.3, 0, 8)] : [touca(1.1, 0, 8), ...caminhoCosteletas(p, 5.5)],
        textura: []
      };

    case 'medio':
      return {
        atras: [caminhoComprimento(p, p.yMandibula + 4, 1.8, 2.4)],
        frente: [touca(1.6, 0.05, 9), ...caminhoCosteletas(p, 6.5)],
        textura: []
      };

    case 'longo':
      return {
        atras: [caminhoComprimento(p, p.yOmbros + 4, 3.2, 3.6)],
        frente: [touca(1.8, 0.05, 9), ...caminhoCosteletas(p, 7)],
        textura: []
      };

    case 'cacheado':
      // Volume grande e irregular atrás, implantação ondulada à frente e
      // movimento interno por cima. Nenhum círculo em lugar nenhum.
      return {
        atras: [
          (() => {
            const arco = arcoDeVolume(p, 4.6, 0.3, 13, 0.16);
            return [
              `M ${n(arco.inicio.x)} ${n(arco.inicio.y)}`,
              arco.d,
              `C ${n(CX + p.wCranio + 5)} ${n(p.yZigo)}, ${n(CX + p.wCranio + 2)} ${n(p.yMandibula - 1)}, ${n(CX + p.wCranio - 1)} ${n(p.yMandibula - 3)}`,
              `C ${n(CX + p.wCranio * 0.5)} ${n(p.yMandibula - 6)}, ${n(CX - p.wCranio * 0.5)} ${n(p.yMandibula - 6)}, ${n(CX - p.wCranio + 1)} ${n(p.yMandibula - 3)}`,
              `C ${n(CX - p.wCranio - 2)} ${n(p.yMandibula - 1)}, ${n(CX - p.wCranio - 5)} ${n(p.yZigo)}, ${n(arco.inicio.x)} ${n(arco.inicio.y)}`,
              'Z'
            ].join(' ');
          })()
        ],
        frente: [touca(3.4, 0.24, 11, 1.1)],
        textura: texturaDeCachos(p)
      };

    case 'coque': {
      const { cy, ry } = calota(p);
      const rCoque = p.wCranio * 0.36;
      const yCoque = p.yTopo - rCoque * 0.35;
      return {
        atras: [
          // Coque atrás do topo: uma forma oval levemente inclinada, com
          // uma mecha que a envolve — não um círculo solto.
          `M ${n(CX - rCoque)} ${n(yCoque)} ` +
            `C ${n(CX - rCoque * 1.05)} ${n(yCoque - rCoque * 1.15)}, ${n(CX + rCoque * 1.05)} ${n(yCoque - rCoque * 1.15)}, ${n(CX + rCoque)} ${n(yCoque)} ` +
            `C ${n(CX + rCoque * 1.0)} ${n(yCoque + rCoque * 0.95)}, ${n(CX - rCoque * 1.0)} ${n(yCoque + rCoque * 0.95)}, ${n(CX - rCoque)} ${n(yCoque)} Z`
        ],
        frente: [
          touca(1.0, 0, 8),
          // Mechas puxadas para trás, sugerindo o cabelo preso.
          ...[0.45, 0.0, -0.45].map(desvio => {
            const ang = Math.PI * (1.5 + desvio * 0.42);
            const a = pontoNaElipse(CX, cy, p.wCranio + 0.6, ry + 0.6, ang);
            const b = pontoNaElipse(CX, cy, (p.wCranio + 0.6) * 0.3, (ry + 0.6) * 0.72, Math.PI * 1.5);
            return `M ${n(a.x)} ${n(a.y)} C ${n(a.x + (b.x - a.x) * 0.4)} ${n(a.y - 1.2)}, ${n(b.x)} ${n(b.y - 0.8)}, ${n(b.x)} ${n(b.y + 0.6)}`;
          })
        ],
        textura: []
      };
    }
  }
}

/* ========================================================================== */
/*                            BARBA E BIGODE                                  */
/* ========================================================================== */

/**
 * Pelo facial. Segue a mandíbula real do rosto — por isso muda de forma
 * junto com a idade e não precisa de um desenho por faixa etária.
 */
export function construirBarba(estilo: EstiloBarba, p: ProporcoesRosto): string[] {
  if (estilo === 'nenhuma') return [];

  const bigode =
    `M ${n(CX - p.wBoca * 0.95)} ${n(p.yBoca - 2.6)} ` +
    `C ${n(CX - p.wBoca * 0.5)} ${n(p.yNariz + 0.9)}, ${n(CX + p.wBoca * 0.5)} ${n(p.yNariz + 0.9)}, ${n(CX + p.wBoca * 0.95)} ${n(p.yBoca - 2.6)} ` +
    `C ${n(CX + p.wBoca * 0.55)} ${n(p.yBoca - 1.1)}, ${n(CX - p.wBoca * 0.55)} ${n(p.yBoca - 1.1)}, ${n(CX - p.wBoca * 0.95)} ${n(p.yBoca - 2.6)} Z`;

  if (estilo === 'bigode') return [bigode];

  const cavanhaque =
    `M ${n(CX - p.wBoca * 0.72)} ${n(p.yBoca + 2.4)} ` +
    `C ${n(CX - p.wBoca * 0.85)} ${n(p.yQueixo - 2.2)}, ${n(CX - p.wQueixo * 0.8)} ${n(p.yQueixo + 0.4)}, ${n(CX)} ${n(p.yQueixo + 0.8)} ` +
    `C ${n(CX + p.wQueixo * 0.8)} ${n(p.yQueixo + 0.4)}, ${n(CX + p.wBoca * 0.85)} ${n(p.yQueixo - 2.2)}, ${n(CX + p.wBoca * 0.72)} ${n(p.yBoca + 2.4)} ` +
    `C ${n(CX + p.wBoca * 0.35)} ${n(p.yBoca + 4)}, ${n(CX - p.wBoca * 0.35)} ${n(p.yBoca + 4)}, ${n(CX - p.wBoca * 0.72)} ${n(p.yBoca + 2.4)} Z`;

  if (estilo === 'cavanhaque') return [bigode, cavanhaque];

  // Barba cheia: acompanha a linha da mandíbula, sobe até a costeleta e
  // deixa a boca livre.
  const cheia = [
    `M ${n(CX - p.wCranio + 1.5)} ${n(p.yOrelha + p.rOrelha * 0.3)}`,
    `C ${n(CX - p.wMandibula - 1.5)} ${n(p.yMandibula)}, ${n(CX - p.wQueixo - 4)} ${n(p.yQueixo)}, ${n(CX)} ${n(p.yQueixo + 2.4)}`,
    `C ${n(CX + p.wQueixo + 4)} ${n(p.yQueixo)}, ${n(CX + p.wMandibula + 1.5)} ${n(p.yMandibula)}, ${n(CX + p.wCranio - 1.5)} ${n(p.yOrelha + p.rOrelha * 0.3)}`,
    // borda superior: sobe pelas bochechas, contorna a boca por fora
    `C ${n(CX + p.wZigo * 0.85)} ${n(p.yNariz + 1)}, ${n(CX + p.wBoca * 1.25)} ${n(p.yBoca - 3)}, ${n(CX + p.wBoca * 1.05)} ${n(p.yBoca + 0.5)}`,
    `C ${n(CX + p.wBoca * 0.5)} ${n(p.yBoca + 4.8)}, ${n(CX - p.wBoca * 0.5)} ${n(p.yBoca + 4.8)}, ${n(CX - p.wBoca * 1.05)} ${n(p.yBoca + 0.5)}`,
    `C ${n(CX - p.wBoca * 1.25)} ${n(p.yBoca - 3)}, ${n(CX - p.wZigo * 0.85)} ${n(p.yNariz + 1)}, ${n(CX - p.wCranio + 1.5)} ${n(p.yOrelha + p.rOrelha * 0.3)}`,
    'Z'
  ].join(' ');

  return [cheia, bigode];
}
