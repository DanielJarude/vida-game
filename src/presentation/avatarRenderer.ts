/**
 * Renderer do retrato — Avatar 2.0.
 *
 * PURO: decide TODAS as formas e cores do retrato a partir de
 * (idade, aparência). Não conhece React nem JSX — devolve dados simples que
 * o componente `AvatarFace` traduz em elementos SVG.
 *
 * O que mudou em relação ao renderer do B4-FIX2, e por quê:
 *
 * | Antes | Agora |
 * | --- | --- |
 * | Rosto = uma elipse | Silhueta com crânio, maçã do rosto, ângulo de mandíbula e queixo |
 * | Orelha = um círculo | Orelha com hélice e concha |
 * | Olho = um círculo da cor escolhida | Abertura amendoada + esclera + íris + pupila + cílio |
 * | Sem nariz, boca em arco de círculo | Nariz sugerido; boca com arco do cupido e lábio inferior |
 * | Sem pescoço, sem ombros | Busto: o retrato tem uma pessoa, não uma cabeça flutuando |
 * | Cabelo colado no topo do crânio | Linha de implantação real, com entradas e costeletas |
 * | Cacheado = 6 arcos circulares iguais | Massa contínua de raio irregular + textura interna em S |
 * | Envelhecer = trocar a cor do cabelo aos 65 | Proporções interpoladas ano a ano + sulcos, pés de galinha e linhas de testa em faixas próprias |
 * | Sem barba | Bigode, cavanhaque e barba cheia, seguindo a mandíbula real |
 *
 * O SCHEMA de `AparenciaAvatar` foi preservado: as mesmas quatro escolhas
 * (tom de pele, estilo e cor do cabelo, cor dos olhos) continuam válidas, e
 * `barba` entrou como campo opcional. Nenhum save precisa ser descartado.
 *
 * Vetorial: nenhum asset externo, nenhuma imagem, nenhuma IA.
 */

import type { AparenciaAvatar } from '../data/avatar/avatarData';
import {
  clarear,
  corHexCabelo,
  corHexOlhos,
  corHexTomPele,
  escurecer,
  normalizarAparencia
} from '../data/avatar/avatarData';
import { obterCategoriaAvatarPessoa, CategoriaAvatar } from './avatarPresentation';
import { proporcoesNaIdade, type ProporcoesRosto } from './avatar/faceProportions';
import {
  caminhoCabeca,
  caminhoConchaOrelha,
  caminhoNariz,
  caminhoOmbros,
  caminhoOrelha,
  caminhoPescoco,
  caminhoSobrancelha,
  caminhoSombraLateral,
  caminhoSombraPescoco,
  geometriaBoca,
  geometriaOlho,
  marcasDeIdade,
  type GeometriaBoca,
  type GeometriaOlho,
  type MarcasDeIdade
} from './avatar/facePaths';
import { construirBarba, construirCabelo, type CaminhosCabelo } from './avatar/hairPaths';

/**
 * Formas do cabelo.
 *
 * Mantém os nomes `atras`/`frente` do renderer anterior (ordem de desenho
 * em relação ao rosto) para não quebrar quem já lia essa estrutura; a
 * diferença é que agora cada um é uma LISTA de caminhos, porque um penteado
 * de verdade não é um path só.
 */
export interface FormaCabelo {
  atras?: string;
  frente?: string;
  /** Todos os caminhos traseiros (volume, comprimento, coque). */
  atrasTodos: string[];
  /** Todos os caminhos frontais (touca, costeletas, mechas). */
  frenteTodos: string[];
  /** Traços finos de textura desenhados por cima da massa (cachos). */
  textura: string[];
}

export interface PaletaRetrato {
  pele: string;
  peleSombra: string;
  peleLuz: string;
  cabelo: string;
  cabeloSombra: string;
  olhos: string;
  esclera: string;
  traco: string;
  tracoSuave: string;
  labios: string;
  roupa: string;
}

export interface EspecificacaoAvatar {
  categoria: CategoriaAvatar;

  // --- Campos preservados do renderer anterior (compatibilidade) ---
  corPele: string;
  corCabelo: string;
  corOlhos: string;
  cabelo: FormaCabelo;
  /** Proporção relativa da cabeça — bebê > criança > adulto. */
  escalaRosto: number;
  /** Há marcas de idade visíveis neste rosto? */
  mostrarRugas: boolean;
  /** Bebê: traços reduzidos ao essencial (sem nariz marcado, sem lábio inferior). */
  simplificado: boolean;

  // --- Avatar 2.0 ---
  proporcoes: ProporcoesRosto;
  paleta: PaletaRetrato;
  cabeca: string;
  sombraLateral: string;
  pescoco: string;
  sombraPescoco: string;
  ombros: string;
  orelhas: { forma: string; concha: string }[];
  olhos: GeometriaOlho[];
  sobrancelhas: string[];
  nariz: string;
  boca: GeometriaBoca;
  barba: string[];
  marcas: MarcasDeIdade;
  /** Espessura base do traço fino do retrato. */
  tracoFino: number;
}

/** Idade a partir da qual o cabelo exibido embranquece, independentemente da escolha. */
export const IDADE_CABELO_GRISALHO = 65;

/**
 * Monta o retrato completo.
 *
 * Regra de envelhecimento preservada do B4-FIX2: o cabelo escolhido na
 * criação continua sendo a preferência registrada (nunca é reescrita), mas
 * a partir dos 65 anos a EXIBIÇÃO usa grisalho — mantendo estilo, tom de
 * pele e olhos idênticos, para "a mesma pessoa mais velha", não alguém
 * diferente. O Avatar 2.0 estende isso: a proporção do rosto e as marcas
 * de idade também mudam, de forma contínua, em vez de um degrau único.
 */
export function construirEspecificacaoAvatar(
  idade: number,
  aparencia: AparenciaAvatar
): EspecificacaoAvatar {
  // Normaliza defensivamente: `barba` é opcional no schema e chamadas
  // antigas não a informam.
  const ap = normalizarAparencia(aparencia);
  const categoria = obterCategoriaAvatarPessoa(idade);
  const idoso = idade >= IDADE_CABELO_GRISALHO;
  const bebe = categoria === 'bebe';

  const proporcoes = proporcoesNaIdade(idade);

  const pele = corHexTomPele(ap.tomPele);
  const cabelo = idoso ? corHexCabelo('grisalho') : corHexCabelo(ap.corCabelo);

  const paleta: PaletaRetrato = {
    pele,
    // Sombra e luz derivam do próprio tom de pele — nunca um preto ou
    // branco translúcido por cima, que acinzentaria peles escuras.
    peleSombra: escurecer(pele, 0.16),
    peleLuz: clarear(pele, 0.14),
    cabelo,
    cabeloSombra: escurecer(cabelo, 0.22),
    olhos: corHexOlhos(ap.corOlhos),
    esclera: clarear(pele, 0.84),
    // O traço precisa de contraste suficiente TAMBÉM na pele mais clara:
    // com 0.62 de escurecimento, um tom claro produzia um bege sobre bege e
    // os traços do rosto quase sumiam.
    traco: escurecer(pele, 0.72),
    tracoSuave: escurecer(pele, 0.42),
    labios: escurecer(pele, 0.34),
    // Roupa NEUTRA, e não derivada da pele: derivando, a camisa mudava de
    // cor junto com o tom de pele (uma pessoa de pele clara ficava de
    // bege, uma de pele escura, de marrom). Um cinza-petróleo dessaturado
    // funciona atrás de qualquer tom e não compete com o rosto.
    roupa: '#2e3f47'
  };

  const caminhosCabelo: CaminhosCabelo =
    // O bebê não recebe penteado adulto: só uma sugestão de cabelo fino,
    // que é o que o gerador produz para 'curto' nas proporções de bebê.
    construirCabelo(bebe && ap.estiloCabelo !== 'careca' ? 'curto' : ap.estiloCabelo, proporcoes, idade);

  const formaCabelo: FormaCabelo = {
    atras: caminhosCabelo.atras[0],
    frente: caminhosCabelo.frente[0],
    atrasTodos: caminhosCabelo.atras,
    frenteTodos: caminhosCabelo.frente,
    textura: caminhosCabelo.textura
  };

  const marcas = marcasDeIdade(proporcoes, idade);
  const temMarcas =
    marcas.nasogenianos.length > 0 ||
    marcas.pesDeGalinha.length > 0 ||
    marcas.testa.length > 0;

  return {
    categoria,
    corPele: pele,
    corCabelo: cabelo,
    corOlhos: paleta.olhos,
    cabelo: formaCabelo,
    // Mantido por compatibilidade: a proporção real agora vive em
    // `proporcoes`, mas este número continua expressando "quanto a cabeça
    // desta fase é maior que a de um adulto".
    escalaRosto: bebe ? 1.12 : categoria === 'crianca' ? 1.05 : 1,
    mostrarRugas: temMarcas,
    simplificado: bebe,

    proporcoes,
    paleta,
    cabeca: caminhoCabeca(proporcoes),
    sombraLateral: caminhoSombraLateral(proporcoes),
    pescoco: caminhoPescoco(proporcoes),
    sombraPescoco: caminhoSombraPescoco(proporcoes),
    ombros: caminhoOmbros(proporcoes),
    orelhas: [1, -1].map(lado => ({
      forma: caminhoOrelha(proporcoes, lado as 1 | -1),
      concha: caminhoConchaOrelha(proporcoes, lado as 1 | -1)
    })),
    olhos: [1, -1].map(lado => geometriaOlho(proporcoes, lado as 1 | -1)),
    sobrancelhas: [1, -1].map(lado =>
      caminhoSobrancelha(proporcoes, lado as 1 | -1, bebe ? 1.5 : idoso ? 2.1 : 2.3)
    ),
    nariz: caminhoNariz(proporcoes),
    boca: geometriaBoca(proporcoes),
    // Pelo facial só existe a partir da idade em que ele é plausível.
    barba: idade >= 16 ? construirBarba(ap.barba ?? 'nenhuma', proporcoes) : [],
    marcas,
    tracoFino: bebe ? 0.85 : 1
  };
}
