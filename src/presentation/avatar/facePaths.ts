/**
 * avatar/facePaths — a geometria do retrato (Avatar 2.0).
 *
 * Constrói os caminhos SVG do rosto a partir das medidas de
 * `faceProportions`. Nada aqui é uma forma fixa: mude a proporção e todos
 * os traços se reposicionam juntos.
 *
 * O que o renderer anterior não tinha, e que é justamente o que faz um
 * desenho parecer gente:
 *
 * - **mandíbula**: a cabeça não é uma elipse. Crânio largo na têmpora,
 *   maçã do rosto, ângulo de mandíbula e queixo são quatro pontos
 *   distintos ligados por curvas — é essa silhueta que dá idade e caráter.
 * - **orelha com relevo**: hélice e concha, não um círculo.
 * - **olho amendoado**: pálpebra superior mais curva que a inferior, canto
 *   externo levemente mais baixo, cílio superior mais pesado que o
 *   inferior. Olho redondo lê como boneco.
 * - **nariz sugerido**: o traço mais discreto do retrato editorial — asa e
 *   base, nunca um contorno fechado.
 * - **boca com lábios**: arco do cupido no superior, volume no inferior.
 * - **pescoço e ombros**: um rosto flutuando no vazio nunca parece um
 *   retrato; é o busto que transforma "cabeça" em "pessoa".
 *
 * Todas as funções são puras e devolvem strings de path para viewBox
 * 0 0 100 100. Nenhuma conhece React, cor ou CSS.
 */

import type { ProporcoesRosto } from './faceProportions';

const CX = 50;

const n = (v: number) => Math.round(v * 100) / 100;

/* ========================================================================== */
/*                                  CABEÇA                                    */
/* ========================================================================== */

/**
 * Silhueta da cabeça: topo → têmpora → maçã → ângulo da mandíbula → queixo,
 * espelhada. É um caminho fechado único, para que o rosto seja uma massa
 * sólida (e não uma colagem de formas com emendas visíveis).
 */
export function caminhoCabeca(p: ProporcoesRosto): string {
  const {
    yTopo, wCranio, yTempora, wZigo, yZigo,
    wMandibula, yMandibula, wQueixo, yQueixo
  } = p;

  // Cada trecho é uma cúbica cujos controles seguem a direção do traço
  // anterior — é o que evita "bico" nas junções entre crânio, maçã e
  // mandíbula.
  const lado = (s: 1 | -1) => [
    // topo do crânio → têmpora
    `C ${n(CX + s * wCranio * 0.62)} ${n(yTopo)}, ${n(CX + s * wCranio)} ${n(yTempora - (yTempora - yTopo) * 0.44)}, ${n(CX + s * wCranio)} ${n(yTempora)}`,
    // têmpora → maçã do rosto
    `C ${n(CX + s * wCranio)} ${n(yTempora + (yZigo - yTempora) * 0.5)}, ${n(CX + s * (wZigo + 0.9))} ${n(yZigo - (yZigo - yTempora) * 0.28)}, ${n(CX + s * wZigo)} ${n(yZigo)}`,
    // maçã → ângulo da mandíbula
    `C ${n(CX + s * (wZigo - 0.4))} ${n(yZigo + (yMandibula - yZigo) * 0.5)}, ${n(CX + s * (wMandibula + 1.5))} ${n(yMandibula - (yMandibula - yZigo) * 0.3)}, ${n(CX + s * wMandibula)} ${n(yMandibula)}`,
    // mandíbula → queixo
    `C ${n(CX + s * (wMandibula - 0.3))} ${n(yMandibula + (yQueixo - yMandibula) * 0.5)}, ${n(CX + s * (wQueixo + 2.8))} ${n(yQueixo - (yQueixo - yMandibula) * 0.18)}, ${n(CX + s * wQueixo)} ${n(yQueixo)}`
  ].join(' ');

  // Base do queixo: curva curta ligando os dois lados por baixo.
  const baseQueixo = `C ${n(CX - wQueixo * 0.55)} ${n(yQueixo + 1.5)}, ${n(CX + wQueixo * 0.55)} ${n(yQueixo + 1.5)}, ${n(CX + wQueixo)} ${n(yQueixo)}`;

  // Desce pela direita, atravessa o queixo, sobe pela esquerda (invertido).
  const subidaEsquerda = [
    `C ${n(CX - (wQueixo + 2.8))} ${n(yQueixo - (yQueixo - yMandibula) * 0.18)}, ${n(CX - (wMandibula - 0.3))} ${n(yMandibula + (yQueixo - yMandibula) * 0.5)}, ${n(CX - wMandibula)} ${n(yMandibula)}`,
    `C ${n(CX - (wMandibula + 1.5))} ${n(yMandibula - (yMandibula - yZigo) * 0.3)}, ${n(CX - (wZigo - 0.4))} ${n(yZigo + (yMandibula - yZigo) * 0.5)}, ${n(CX - wZigo)} ${n(yZigo)}`,
    `C ${n(CX - (wZigo + 0.9))} ${n(yZigo - (yZigo - yTempora) * 0.28)}, ${n(CX - wCranio)} ${n(yTempora + (yZigo - yTempora) * 0.5)}, ${n(CX - wCranio)} ${n(yTempora)}`,
    `C ${n(CX - wCranio)} ${n(yTempora - (yTempora - yTopo) * 0.44)}, ${n(CX - wCranio * 0.62)} ${n(yTopo)}, ${n(CX)} ${n(yTopo)}`
  ].join(' ');

  return `M ${CX} ${n(yTopo)} ${lado(1)} ${baseQueixo.replace(`${n(CX + wQueixo)} ${n(yQueixo)}`, `${n(CX - wQueixo)} ${n(yQueixo)}`)} ${subidaEsquerda} Z`;
}

/**
 * Sombra de volume: uma faixa suave acompanhando o lado esquerdo da
 * silhueta. Dá profundidade sem gradiente e sem brilho — o retrato
 * continua chapado, que é a linguagem que queremos.
 */
export function caminhoSombraLateral(p: ProporcoesRosto): string {
  const { yTempora, wCranio, wZigo, yZigo, wMandibula, yMandibula, wQueixo, yQueixo } = p;
  return [
    `M ${n(CX - wCranio + 0.4)} ${n(yTempora)}`,
    `C ${n(CX - wCranio + 0.4)} ${n(yTempora + (yZigo - yTempora) * 0.5)}, ${n(CX - wZigo - 0.5)} ${n(yZigo - (yZigo - yTempora) * 0.28)}, ${n(CX - wZigo + 0.4)} ${n(yZigo)}`,
    `C ${n(CX - wZigo)} ${n(yZigo + (yMandibula - yZigo) * 0.5)}, ${n(CX - wMandibula - 1)} ${n(yMandibula - (yMandibula - yZigo) * 0.3)}, ${n(CX - wMandibula + 0.4)} ${n(yMandibula)}`,
    `C ${n(CX - wMandibula)} ${n(yMandibula + (yQueixo - yMandibula) * 0.5)}, ${n(CX - wQueixo - 2)} ${n(yQueixo - (yQueixo - yMandibula) * 0.18)}, ${n(CX - wQueixo)} ${n(yQueixo)}`,
    // fecha subindo por dentro, criando uma faixa de largura variável
    `C ${n(CX - wQueixo - 4.5)} ${n(yQueixo - (yQueixo - yMandibula) * 0.3)}, ${n(CX - wMandibula - 1)} ${n(yMandibula + 2)}, ${n(CX - wMandibula + 3.4)} ${n(yMandibula - 1)}`,
    `C ${n(CX - wZigo + 2)} ${n(yZigo + 4)}, ${n(CX - wCranio + 3.4)} ${n(yTempora + 6)}, ${n(CX - wCranio + 3.4)} ${n(yTempora)}`,
    'Z'
  ].join(' ');
}

/* ========================================================================== */
/*                            PESCOÇO E OMBROS                                */
/* ========================================================================== */

/** Pescoço: mais estreito que a mandíbula e levemente alargando na base. */
export function caminhoPescoco(p: ProporcoesRosto): string {
  const topo = p.yQueixo - (p.yQueixo - p.yMandibula) * 0.35;
  const base = p.yOmbros + 1;
  return [
    `M ${n(CX - p.wPescoco * 0.82)} ${n(topo)}`,
    `C ${n(CX - p.wPescoco * 0.9)} ${n(topo + (base - topo) * 0.55)}, ${n(CX - p.wPescoco)} ${n(base - 3)}, ${n(CX - p.wPescoco)} ${n(base)}`,
    `L ${n(CX + p.wPescoco)} ${n(base)}`,
    `C ${n(CX + p.wPescoco)} ${n(base - 3)}, ${n(CX + p.wPescoco * 0.9)} ${n(topo + (base - topo) * 0.55)}, ${n(CX + p.wPescoco * 0.82)} ${n(topo)}`,
    'Z'
  ].join(' ');
}

/** Sombra sob o queixo — o que separa cabeça de pescoço sem precisar de linha. */
export function caminhoSombraPescoco(p: ProporcoesRosto): string {
  const y = p.yQueixo - 1;
  return [
    `M ${n(CX - p.wPescoco * 0.85)} ${n(y - 1)}`,
    `C ${n(CX - p.wPescoco * 0.5)} ${n(y + 4.5)}, ${n(CX + p.wPescoco * 0.5)} ${n(y + 4.5)}, ${n(CX + p.wPescoco * 0.85)} ${n(y - 1)}`,
    `C ${n(CX + p.wPescoco * 0.5)} ${n(y + 1.5)}, ${n(CX - p.wPescoco * 0.5)} ${n(y + 1.5)}, ${n(CX - p.wPescoco * 0.85)} ${n(y - 1)}`,
    'Z'
  ].join(' ');
}

/**
 * Busto: ombros e gola.
 *
 * Duas correções em relação à primeira versão do Avatar 2.0: a forma era um
 * monte arredondado no rodapé (lia como a pessoa enterrada até o peito) e a
 * cor derivava do tom de pele — o que fazia a "roupa" mudar de cor conforme
 * a pele. Agora a linha do trapézio sobe dos lados até o pescoço e a
 * abertura da gola é explícita; a cor é neutra e vive na paleta.
 */
export function caminhoOmbros(p: ProporcoesRosto): string {
  const y = p.yOmbros;
  const xGola = p.wPescoco + 1.6;
  return [
    `M -2 102`,
    `C -2 ${n(y + 6)}, ${n(CX - 30)} ${n(y + 1)}, ${n(CX - 20)} ${n(y - 1.5)}`,
    // trapézio subindo até a base do pescoço
    `C ${n(CX - 15)} ${n(y - 3)}, ${n(CX - xGola - 2)} ${n(y - 4)}, ${n(CX - xGola)} ${n(y - 5)}`,
    // abertura da gola
    `C ${n(CX - xGola * 0.55)} ${n(y - 1.2)}, ${n(CX + xGola * 0.55)} ${n(y - 1.2)}, ${n(CX + xGola)} ${n(y - 5)}`,
    `C ${n(CX + xGola + 2)} ${n(y - 4)}, ${n(CX + 15)} ${n(y - 3)}, ${n(CX + 20)} ${n(y - 1.5)}`,
    `C ${n(CX + 30)} ${n(y + 1)}, 102 ${n(y + 6)}, 102 102`,
    'Z'
  ].join(' ');
}

/* ========================================================================== */
/*                                  ORELHAS                                   */
/* ========================================================================== */

/**
 * Orelha: uma hélice arredondada, encaixada no crânio.
 *
 * A cabeça é desenhada DEPOIS e cobre a metade interna — é assim que a
 * orelha se prende ao crânio em vez de ficar colada como um adesivo. A
 * borda interna é curva, nunca reta: um lado reto lê imediatamente como
 * uma aba retangular grudada na cabeça.
 */
export function caminhoOrelha(p: ProporcoesRosto, lado: 1 | -1): string {
  const x = CX + lado * (p.wCranio - 3.2);
  const y = p.yOrelha;
  const r = p.rOrelha;
  return [
    `M ${n(x)} ${n(y - r * 0.92)}`,
    // hélice: sobe pela borda externa e desce até o lóbulo
    `C ${n(x + lado * r * 1.0)} ${n(y - r * 0.95)}, ${n(x + lado * r * 1.15)} ${n(y - r * 0.1)}, ${n(x + lado * r * 0.78)} ${n(y + r * 0.72)}`,
    // lóbulo arredondado
    `C ${n(x + lado * r * 0.6)} ${n(y + r * 1.1)}, ${n(x + lado * r * 0.1)} ${n(y + r * 1.15)}, ${n(x - lado * r * 0.2)} ${n(y + r * 0.8)}`,
    // borda interna, curva, entrando por trás da cabeça
    `C ${n(x - lado * r * 0.55)} ${n(y + r * 0.3)}, ${n(x - lado * r * 0.5)} ${n(y - r * 0.45)}, ${n(x)} ${n(y - r * 0.92)}`,
    'Z'
  ].join(' ');
}

/** Concha da orelha: um traço interno curto que dá relevo. */
export function caminhoConchaOrelha(p: ProporcoesRosto, lado: 1 | -1): string {
  const x = CX + lado * (p.wCranio - 3.0);
  const y = p.yOrelha;
  const r = p.rOrelha;
  return `M ${n(x + lado * r * 0.36)} ${n(y - r * 0.42)} C ${n(x + lado * r * 0.78)} ${n(y - r * 0.12)}, ${n(x + lado * r * 0.62)} ${n(y + r * 0.34)}, ${n(x + lado * r * 0.26)} ${n(y + r * 0.56)}`;
}

/* ========================================================================== */
/*                                   OLHOS                                    */
/* ========================================================================== */

export interface GeometriaOlho {
  /** Contorno amendoado da abertura ocular. */
  abertura: string;
  /** Cílio/pálpebra superior — mais pesado que o resto do traço. */
  palpebraSuperior: string;
  /** Vinco da pálpebra, acima do cílio. */
  vinco: string;
  centroIris: { x: number; y: number };
  raioIris: number;
  raioPupila: number;
}

/**
 * Olho amendoado.
 *
 * Três detalhes fazem a diferença entre "olho" e "bolinha":
 * a pálpebra superior é bem mais curva que a inferior; o canto externo cai
 * um pouco em relação ao interno; e o traço superior é mais pesado — no
 * rosto humano a sombra do cílio é a linha mais escura da região.
 */
export function geometriaOlho(p: ProporcoesRosto, lado: 1 | -1): GeometriaOlho {
  const cx = CX + lado * p.sepOlhos;
  const cy = p.yOlhos;
  const w = p.wOlho;
  const h = p.hOlho;

  const interno = { x: cx - lado * w, y: cy + 0.25 };
  const externo = { x: cx + lado * w, y: cy - 0.35 };

  const abertura = [
    `M ${n(interno.x)} ${n(interno.y)}`,
    `C ${n(cx - lado * w * 0.45)} ${n(cy - h * 1.35)}, ${n(cx + lado * w * 0.45)} ${n(cy - h * 1.25)}, ${n(externo.x)} ${n(externo.y)}`,
    `C ${n(cx + lado * w * 0.5)} ${n(cy + h * 1.0)}, ${n(cx - lado * w * 0.5)} ${n(cy + h * 1.05)}, ${n(interno.x)} ${n(interno.y)}`,
    'Z'
  ].join(' ');

  const palpebraSuperior = [
    `M ${n(interno.x)} ${n(interno.y)}`,
    `C ${n(cx - lado * w * 0.45)} ${n(cy - h * 1.35)}, ${n(cx + lado * w * 0.45)} ${n(cy - h * 1.25)}, ${n(externo.x)} ${n(externo.y)}`
  ].join(' ');

  const vinco = [
    `M ${n(cx - lado * w * 0.75)} ${n(cy - h * 1.5)}`,
    `C ${n(cx - lado * w * 0.2)} ${n(cy - h * 2.25)}, ${n(cx + lado * w * 0.5)} ${n(cy - h * 2.1)}, ${n(cx + lado * w * 0.95)} ${n(cy - h * 1.15)}`
  ].join(' ');

  return {
    abertura,
    palpebraSuperior,
    vinco,
    // A íris fica levemente acima do centro da abertura: olhar para a frente,
    // não para baixo.
    centroIris: { x: n(cx), y: n(cy - h * 0.12) },
    raioIris: n(h * 0.95),
    raioPupila: n(h * 0.42)
  };
}

/* ========================================================================== */
/*                                SOBRANCELHAS                                */
/* ========================================================================== */

/**
 * Sobrancelha como forma preenchida com espessura variável — grossa na
 * cabeça (lado interno), afinando na cauda. Um traço de espessura
 * constante lê como risco de caneta; o afinamento é o que dá naturalidade.
 */
export function caminhoSobrancelha(
  p: ProporcoesRosto,
  lado: 1 | -1,
  espessura: number
): string {
  const cx = CX + lado * p.sepOlhos;
  const y = p.ySobrancelha;
  const w = p.wOlho * 1.35;

  const inicio = { x: cx - lado * w * 1.05, y: y + 0.7 };
  const fim = { x: cx + lado * w * 1.1, y: y + 0.35 };

  return [
    `M ${n(inicio.x)} ${n(inicio.y)}`,
    // Borda superior. O arco é DISCRETO de propósito: sobrancelha muito
    // curva dá ao retrato uma expressão permanente de surpresa, que é o
    // erro mais comum em rosto vetorial.
    `C ${n(cx - lado * w * 0.45)} ${n(y - espessura * 0.62)}, ${n(cx + lado * w * 0.4)} ${n(y - espessura * 0.5)}, ${n(fim.x)} ${n(fim.y)}`,
    // borda inferior de volta, mais próxima no fim (cauda fina)
    `C ${n(cx + lado * w * 0.4)} ${n(y + espessura * 0.1)}, ${n(cx - lado * w * 0.45)} ${n(y + espessura * 0.28)}, ${n(inicio.x)} ${n(inicio.y + espessura * 0.55)}`,
    'Z'
  ].join(' ');
}

/* ========================================================================== */
/*                                   NARIZ                                    */
/* ========================================================================== */

/**
 * Nariz sugerido: a asa direita e a base. No retrato editorial o nariz é o
 * traço mais discreto do rosto — contorná-lo inteiro engrossa o desenho e
 * puxa a atenção para o lugar errado.
 */
export function caminhoNariz(p: ProporcoesRosto): string {
  const y = p.yNariz;
  const w = p.wNariz;
  // Começa BAIXO: só o terço final do dorso é sugerido. Um traço que sobe
  // até perto dos olhos alonga o meio do rosto e é o que fazia o retrato
  // parecer esticado.
  const topo = p.yOlhos + (y - p.yOlhos) * 0.62;
  return [
    `M ${n(CX + w * 0.34)} ${n(topo)}`,
    `C ${n(CX + w * 0.58)} ${n(topo + (y - topo) * 0.62)}, ${n(CX + w * 0.92)} ${n(y - 0.9)}, ${n(CX + w * 0.46)} ${n(y)}`,
    `C ${n(CX + w * 0.18)} ${n(y + 0.55)}, ${n(CX - w * 0.18)} ${n(y + 0.55)}, ${n(CX - w * 0.46)} ${n(y - 0.05)}`
  ].join(' ');
}

/* ========================================================================== */
/*                                    BOCA                                    */
/* ========================================================================== */

export interface GeometriaBoca {
  /** Linha de encontro dos lábios — o traço mais definido da boca. */
  linha: string;
  /** Lábio inferior, com volume. */
  labioInferior: string;
  /** Sulco entre nariz e lábio superior. */
  filtro: string;
}

/**
 * Boca fechada com arco do cupido no lábio superior e volume no inferior.
 * Um "sorriso" em arco de círculo — o que havia antes — é a marca mais
 * imediata de desenho infantil, e o VIDA é um simulador adulto.
 */
export function geometriaBoca(p: ProporcoesRosto): GeometriaBoca {
  const y = p.yBoca;
  const w = p.wBoca;

  // Os cantos ficam LEVEMENTE acima do centro. Com os cantos abaixo — que
  // é o que sai naturalmente de um arco do cupido desenhado sem cuidado —
  // todo retrato nasce emburrado, e um simulador de vida inteira não pode
  // ter uma única expressão, muito menos essa.
  const linha = [
    `M ${n(CX - w)} ${n(y - 0.55)}`,
    `C ${n(CX - w * 0.55)} ${n(y - 0.95)}, ${n(CX - w * 0.22)} ${n(y - 0.2)}, ${n(CX)} ${n(y)}`,
    `C ${n(CX + w * 0.22)} ${n(y - 0.2)}, ${n(CX + w * 0.55)} ${n(y - 0.95)}, ${n(CX + w)} ${n(y - 0.55)}`
  ].join(' ');

  const labioInferior = [
    `M ${n(CX - w * 0.88)} ${n(y + 0.35)}`,
    `C ${n(CX - w * 0.5)} ${n(y + 2.6)}, ${n(CX + w * 0.5)} ${n(y + 2.6)}, ${n(CX + w * 0.88)} ${n(y + 0.35)}`,
    `C ${n(CX + w * 0.45)} ${n(y + 0.9)}, ${n(CX - w * 0.45)} ${n(y + 0.9)}, ${n(CX - w * 0.88)} ${n(y + 0.35)}`,
    'Z'
  ].join(' ');

  const filtro = `M ${n(CX)} ${n(p.yNariz + 0.8)} L ${n(CX)} ${n(y - 1.2)}`;

  return { linha, labioInferior, filtro };
}

/* ========================================================================== */
/*                            MARCAS DE IDADE                                 */
/* ========================================================================== */

export interface MarcasDeIdade {
  /** Sulco nasogeniano (da asa do nariz ao canto da boca). */
  nasogenianos: string[];
  /** Pés de galinha no canto externo dos olhos. */
  pesDeGalinha: string[];
  /** Linhas horizontais na testa. */
  testa: string[];
  /** Leve marca sob os olhos. */
  olheiras: string[];
}

/**
 * Marcas de idade proporcionais à idade real, não um interruptor aos 65.
 * Cada grupo entra numa faixa própria — é assim que um rosto de 52 difere
 * de um de 78 sem precisar de dois desenhos diferentes.
 */
export function marcasDeIdade(p: ProporcoesRosto, idade: number): MarcasDeIdade {
  const marcas: MarcasDeIdade = { nasogenianos: [], pesDeGalinha: [], testa: [], olheiras: [] };

  if (idade >= 38) {
    for (const lado of [1, -1] as const) {
      const x0 = CX + lado * p.wNariz * 0.95;
      const x1 = CX + lado * p.wBoca * 1.12;
      marcas.nasogenianos.push(
        `M ${n(x0)} ${n(p.yNariz - 0.4)} C ${n(x0 + lado * 2.2)} ${n(p.yNariz + 2.6)}, ${n(x1 + lado * 0.8)} ${n(p.yBoca - 2.4)}, ${n(x1)} ${n(p.yBoca + 0.6)}`
      );
    }
  }

  if (idade >= 50) {
    for (const lado of [1, -1] as const) {
      const x = CX + lado * (p.sepOlhos + p.wOlho + 0.8);
      marcas.pesDeGalinha.push(`M ${n(x)} ${n(p.yOlhos - 0.6)} L ${n(x + lado * 2.4)} ${n(p.yOlhos - 2.1)}`);
      marcas.pesDeGalinha.push(`M ${n(x)} ${n(p.yOlhos + 0.4)} L ${n(x + lado * 2.6)} ${n(p.yOlhos + 0.5)}`);
    }
    marcas.olheiras.push(
      ...[1, -1].map(lado => {
        const cx = CX + lado * p.sepOlhos;
        return `M ${n(cx - p.wOlho * 0.85)} ${n(p.yOlhos + p.hOlho * 1.5)} C ${n(cx - p.wOlho * 0.3)} ${n(p.yOlhos + p.hOlho * 2.3)}, ${n(cx + p.wOlho * 0.3)} ${n(p.yOlhos + p.hOlho * 2.3)}, ${n(cx + p.wOlho * 0.85)} ${n(p.yOlhos + p.hOlho * 1.4)}`;
      })
    );
  }

  if (idade >= 58) {
    const yBase = p.ySobrancelha - 4.5;
    const largura = p.wCranio * 0.52;
    for (let i = 0; i < (idade >= 70 ? 3 : 2); i++) {
      const y = yBase - i * 3.1;
      marcas.testa.push(
        `M ${n(CX - largura)} ${n(y)} C ${n(CX - largura * 0.4)} ${n(y - 1.15)}, ${n(CX + largura * 0.4)} ${n(y - 1.15)}, ${n(CX + largura)} ${n(y)}`
      );
    }
  }

  return marcas;
}
