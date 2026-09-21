/**
 * avatar/faceProportions — proporções do rosto por idade (Avatar 2.0).
 *
 * O renderer anterior desenhava uma elipse com dois círculos de olho e
 * dois círculos de orelha, e "envelhecia" só trocando a cor do cabelo aos
 * 65. Não havia mandíbula, pescoço, implantação de cabelo nem mudança de
 * proporção — e as três coisas que mais fazem um retrato parecer humano
 * são exatamente proporção, mandíbula e olhar.
 *
 * Aqui o rosto é descrito por MEDIDAS, não por formas fixas. Isso resolve
 * dois problemas de uma vez:
 *
 * 1. **Envelhecimento contínuo.** As medidas são interpoladas entre
 *    quadros-chave etários, então um rosto aos 34 não é "o rosto adulto":
 *    é o rosto daquela idade. A mesma pessoa atravessa a vida sem trocar
 *    de cara num aniversário.
 * 2. **Reuso.** Cabelo, barba e acessórios são posicionados a partir
 *    dessas medidas, não de números mágicos — mudar a proporção da cabeça
 *    move o cabelo junto, automaticamente.
 *
 * Os quadros-chave seguem crescimento craniofacial real, em traço
 * estilizado: no bebê o crânio é proporcionalmente enorme, a mandíbula é
 * mínima e a linha dos olhos fica ABAIXO da metade da cabeça; na vida
 * adulta a linha dos olhos sobe para perto da metade e a mandíbula ganha
 * definição; na idade avançada o rosto alonga, as maçãs recuam e as
 * orelhas ficam proporcionalmente maiores.
 *
 * Sistema de coordenadas: viewBox 0 0 100 100, centro vertical em x = 50.
 * Puro: sem React, sem SVG, sem cor.
 */

/** Todas as medidas que descrevem um rosto. Distâncias horizontais são SEMI-larguras. */
export interface ProporcoesRosto {
  /** Topo do crânio. */
  yTopo: number;
  /** Semi-largura do crânio na têmpora (o ponto mais largo da cabeça). */
  wCranio: number;
  /** Altura da têmpora. */
  yTempora: number;
  /** Semi-largura na maçã do rosto. */
  wZigo: number;
  yZigo: number;
  /** Semi-largura no ângulo da mandíbula. */
  wMandibula: number;
  yMandibula: number;
  /** Semi-largura do queixo. */
  wQueixo: number;
  yQueixo: number;

  yOlhos: number;
  /** Distância do centro do rosto até o centro de cada olho. */
  sepOlhos: number;
  /** Semi-largura e semi-altura da abertura do olho. */
  wOlho: number;
  hOlho: number;

  ySobrancelha: number;
  yNariz: number;
  wNariz: number;
  yBoca: number;
  wBoca: number;

  /** Raio vertical da orelha e sua altura central. */
  rOrelha: number;
  yOrelha: number;

  /** Semi-largura do pescoço e onde os ombros começam. */
  wPescoco: number;
  yOmbros: number;
}

interface QuadroEtario {
  idade: number;
  proporcoes: ProporcoesRosto;
}

/**
 * Quadros-chave. Entre dois quadros as medidas são interpoladas
 * linearmente; antes do primeiro e depois do último, a medida é constante.
 */
const QUADROS: QuadroEtario[] = [
  {
    // Recém-nascido. A diferença tem de ser GRANDE, não sutil: crânio muito
    // largo, terço inferior curtíssimo, queixo arredondado (não afunilado),
    // olhos grandes e bem abaixo da metade da cabeça, nariz minúsculo.
    idade: 0,
    proporcoes: {
      yTopo: 12, wCranio: 27, yTempora: 32,
      wZigo: 26, yZigo: 50,
      wMandibula: 23, yMandibula: 60,
      wQueixo: 14.5, yQueixo: 69,
      yOlhos: 52, sepOlhos: 12.2, wOlho: 5.3, hOlho: 3.4,
      ySobrancelha: 47, yNariz: 58.5, wNariz: 4.2,
      yBoca: 63.5, wBoca: 7.4,
      rOrelha: 4.6, yOrelha: 50,
      wPescoco: 11.5, yOmbros: 86
    }
  },
  {
    // Criança pequena: a mandíbula começa a existir, o rosto alonga devagar.
    idade: 6,
    proporcoes: {
      yTopo: 13.5, wCranio: 24, yTempora: 33.5,
      wZigo: 22.6, yZigo: 49.5,
      wMandibula: 19, yMandibula: 60.5,
      wQueixo: 10.5, yQueixo: 71.5,
      yOlhos: 50, sepOlhos: 11.3, wOlho: 4.7, hOlho: 3.0,
      ySobrancelha: 45.4, yNariz: 58.5, wNariz: 4.7,
      yBoca: 64.5, wBoca: 8.1,
      rOrelha: 4.2, yOrelha: 49,
      wPescoco: 10, yOmbros: 87
    }
  },
  {
    idade: 14,
    proporcoes: {
      yTopo: 14, wCranio: 22.4, yTempora: 34.5,
      wZigo: 21.2, yZigo: 49,
      wMandibula: 17.4, yMandibula: 61,
      wQueixo: 8.4, yQueixo: 73,
      yOlhos: 48.5, sepOlhos: 10.9, wOlho: 4.3, hOlho: 2.7,
      ySobrancelha: 44.2, yNariz: 58.5, wNariz: 5,
      yBoca: 65.2, wBoca: 8.6,
      rOrelha: 4.0, yOrelha: 48,
      wPescoco: 9.6, yOmbros: 87
    }
  },
  {
    // Adulto. Linha dos olhos perto da metade da cabeça, mandíbula
    // presente, terço inferior compacto — o queixo não é um vazio longo.
    idade: 24,
    proporcoes: {
      yTopo: 14.5, wCranio: 21.8, yTempora: 35,
      wZigo: 20.8, yZigo: 48.5,
      wMandibula: 17, yMandibula: 61,
      wQueixo: 7.8, yQueixo: 74,
      yOlhos: 48, sepOlhos: 10.8, wOlho: 4.2, hOlho: 2.6,
      ySobrancelha: 43.8, yNariz: 58.5, wNariz: 5.2,
      yBoca: 65.5, wBoca: 8.8,
      rOrelha: 4.0, yOrelha: 48,
      wPescoco: 10, yOmbros: 87
    }
  },
  {
    idade: 48,
    proporcoes: {
      yTopo: 14.7, wCranio: 21.6, yTempora: 35.4,
      wZigo: 20.4, yZigo: 49,
      wMandibula: 16.8, yMandibula: 61.6,
      wQueixo: 7.9, yQueixo: 74.8,
      yOlhos: 48, sepOlhos: 10.8, wOlho: 4.1, hOlho: 2.5,
      ySobrancelha: 43.9, yNariz: 59, wNariz: 5.4,
      yBoca: 65.9, wBoca: 8.7,
      rOrelha: 4.3, yOrelha: 48.2,
      wPescoco: 10, yOmbros: 87
    }
  },
  {
    // Idade avançada: rosto mais longo e estreito, maçãs recuadas, orelhas
    // e nariz proporcionalmente maiores, pálpebra mais fechada.
    idade: 75,
    proporcoes: {
      yTopo: 15, wCranio: 21, yTempora: 35.8,
      wZigo: 19.4, yZigo: 49.5,
      wMandibula: 16, yMandibula: 62.2,
      wQueixo: 7.6, yQueixo: 75.6,
      yOlhos: 48.3, sepOlhos: 10.7, wOlho: 3.9, hOlho: 2.2,
      ySobrancelha: 44.3, yNariz: 59.6, wNariz: 5.7,
      yBoca: 66.4, wBoca: 8.4,
      rOrelha: 4.7, yOrelha: 48.5,
      wPescoco: 9.4, yOmbros: 87
    }
  }
];

const CHAVES = Object.keys(QUADROS[0].proporcoes) as (keyof ProporcoesRosto)[];

/**
 * Medidas do rosto nesta idade, interpoladas entre os quadros-chave.
 *
 * É o que dá envelhecimento contínuo: não existe "o rosto de adulto" nem
 * um degrau em que a pessoa muda de cara de um ano para o outro.
 */
export function proporcoesNaIdade(idade: number): ProporcoesRosto {
  const anos = Math.max(0, idade);

  if (anos <= QUADROS[0].idade) return { ...QUADROS[0].proporcoes };
  const ultimo = QUADROS[QUADROS.length - 1];
  if (anos >= ultimo.idade) return { ...ultimo.proporcoes };

  let i = 0;
  while (i < QUADROS.length - 1 && QUADROS[i + 1].idade < anos) i++;

  const a = QUADROS[i];
  const b = QUADROS[i + 1];
  const t = (anos - a.idade) / (b.idade - a.idade);

  const resultado = {} as ProporcoesRosto;
  for (const chave of CHAVES) {
    resultado[chave] = a.proporcoes[chave] + (b.proporcoes[chave] - a.proporcoes[chave]) * t;
  }
  return resultado;
}

/** Altura total da cabeça — base para posicionar cabelo, barba e acessórios. */
export function alturaCabeca(p: ProporcoesRosto): number {
  return p.yQueixo - p.yTopo;
}
