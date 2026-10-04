/**
 * As redes sociais do jogo (FIX pós-REWORK 4): o catálogo das plataformas.
 *
 * O REWORK 4 tinha uma plataforma abstrata (o "Mural"). Aqui há sete, e cada
 * uma FUNCIONA de um jeito — não são sete peles do mesmo contador:
 *
 *   Instagram   imagem pública: foto, vídeo curto; marcas pagam por quem confia
 *   YouTube     vídeo que dá trabalho; cresce devagar e o catálogo rende por anos
 *   TikTok      vídeo curto; o algoritmo pode explodir (e esquecer) de um dia pro outro
 *   Twitch      transmissão ao vivo; comunidade fiel; assinaturas e doações
 *   X           frase curta, opinião, resposta; a briga dá alcance — e cobra
 *   Facebook    a rede de todo mundo (mais velha): família, bairro, grupos
 *   OnlyFans    assinatura de conteúdo exclusivo, só para maiores de idade
 *
 * Tudo é simulação interna (offline): nenhuma rede de verdade é tocada, nada de
 * marca ou logotipo — só o nome e uma cor que o mundo associa a ela. Nenhum
 * conteúdo sexual é descrito: o OnlyFans é uma abstração de carreira,
 * reputação e renda.
 */

import type { PlataformaId, TemaPublicacao } from '../tipos';

export type { PlataformaId, TemaPublicacao };

export interface Plataforma {
  id: PlataformaId;
  nome: string;
  /** Uma linha: como ela funciona (o que muda de uma para outra). */
  como: string;
  idadeMin: number;
  /** Como se chama quem acompanha. */
  publico: [string, string];
  /** O verbo de publicar e o nome do que se publica. */
  verbo: string;
  /** A cor que o mundo associa a ela (identidade, não decoração). */
  cor: string;
  /** Quanto do público vê cada publicação (fração dos seguidores). */
  alcance: number;
  /** O alcance de quem ainda é pequeno: os amigos dos amigos, a busca, o algoritmo dando uma chance. */
  piso: number;
  /** Quanto de quem viu passa a seguir. */
  conversao: number;
  /** A chance de viralizar e o tamanho da explosão. */
  viral: [number, number];
  /** Quanto se perde num ano sem publicar (e quanto se perde num ano normal: a rede esquece). */
  esquece: [number, number];
  /** Onde o público está (idade de quem publica): fora da faixa, alcança menos. */
  faixa: [number, number];
  /** O quanto uma opinião vira briga (0..1). */
  briga: number;
  /** O que pede de produção: 0 nada, 1 algum, 2 muito (estresse, equipamento). */
  producao: 0 | 1 | 2;
  /** O que cabe nela (e quanto rende ali: 1 normal, >1 é a cara da rede). */
  temas: Partial<Record<TemaPublicacao, number>>;
  /** Monetizar: o mínimo de público real e de que jeito paga. */
  monetiza: { minimo: number; como: string; /** Renda mensal por mil do público real (unidade do motor, antes do custo local). */ porMil: number };
  /** Verificar: o caminho (a notoriedade, pagar o selo, um documento). */
  verificacao: 'notoriedade' | 'paga' | 'documento';
  /** Quem da vida da pessoa costuma estar lá (idade de quem segue). */
  quem: [number, number];
  /** A chance de detectarem seguidor comprado (por ano). */
  deteccao: number;
}

export const PLATAFORMAS: Record<PlataformaId, Plataforma> = {
  instagram: {
    id: 'instagram', nome: 'Instagram', como: 'Fotos e vídeos curtos: a imagem que você mostra. Marcas pagam por quem é seguido de verdade.',
    idadeMin: 13, publico: ['seguidor', 'seguidores'], verbo: 'Publicar', cor: '#c2408a',
    alcance: 0.32, piso: 250, conversao: 0.04, viral: [0.012, 10], esquece: [0.1, 0.02], faixa: [14, 45], briga: 0.15, producao: 1,
    temas: { cotidiano: 1, viagem: 1.5, pet: 1.4, familia: 1.1, estilo: 1.5, conquista: 1.3, arte: 1.2, esporte: 1.1, receita: 1.1, trabalho: 0.9, bastidores: 1.1, humor: 0.9, opiniao: 0.6, divulgar: 1.1, musica: 1, desculpas: 1, rebater: 0.9 },
    monetiza: { minimo: 10000, como: 'publicidade e parcerias com marcas', porMil: 70 }, verificacao: 'notoriedade', quem: [14, 55], deteccao: 0.22
  },
  youtube: {
    id: 'youtube', nome: 'YouTube', como: 'Vídeos que dão trabalho: cresce devagar, mas o que você já subiu continua sendo visto por anos.',
    idadeMin: 13, publico: ['inscrito', 'inscritos'], verbo: 'Subir um vídeo', cor: '#c4302b',
    alcance: 0.22, piso: 80, conversao: 0.05, viral: [0.006, 14], esquece: [0.06, 0.01], faixa: [12, 60], briga: 0.12, producao: 2,
    temas: { tutorial: 1.6, jogo: 1.4, viagem: 1.2, musica: 1.3, humor: 1.2, opiniao: 0.9, cotidiano: 0.8, esporte: 1, receita: 1.3, estudo: 1.2, trabalho: 0.9, arte: 1.1, divulgar: 1, politica: 0.9, bastidores: 1 },
    monetiza: { minimo: 1000, como: 'anúncios nos vídeos (e o catálogo que continua rendendo)', porMil: 55 }, verificacao: 'notoriedade', quem: [10, 60], deteccao: 0.18
  },
  tiktok: {
    id: 'tiktok', nome: 'TikTok', como: 'Vídeos curtos e algoritmo: qualquer um pode explodir num dia — e ser esquecido no mês seguinte.',
    idadeMin: 13, publico: ['seguidor', 'seguidores'], verbo: 'Postar um vídeo', cor: '#1aa7a8',
    alcance: 0.6, piso: 400, conversao: 0.02, viral: [0.04, 25], esquece: [0.3, 0.12], faixa: [12, 32], briga: 0.2, producao: 1,
    temas: { humor: 1.6, cotidiano: 1.1, musica: 1.4, esporte: 1.2, receita: 1.2, pet: 1.4, estilo: 1.2, trabalho: 1, bastidores: 1.2, opiniao: 0.8, viagem: 1.1, jogo: 1, estudo: 0.9, divulgar: 1, desculpas: 0.9, rebater: 1.1 },
    monetiza: { minimo: 10000, como: 'o fundo de criadores e as publis', porMil: 30 }, verificacao: 'notoriedade', quem: [12, 35], deteccao: 0.25
  },
  twitch: {
    id: 'twitch', nome: 'Twitch', como: 'Transmissões ao vivo: público pequeno e fiel, que volta toda semana. Assinaturas e doações.',
    idadeMin: 13, publico: ['seguidor', 'seguidores'], verbo: 'Fazer uma live', cor: '#7a52c7',
    alcance: 0.12, piso: 15, conversao: 0.12, viral: [0.004, 8], esquece: [0.18, 0.04], faixa: [13, 40], briga: 0.1, producao: 2,
    temas: { jogo: 1.6, conversa: 1.2, musica: 1.2, arte: 1.1, estudo: 1, receita: 0.9, esporte: 0.8 },
    monetiza: { minimo: 500, como: 'assinaturas e doações de quem assiste', porMil: 160 }, verificacao: 'notoriedade', quem: [13, 35], deteccao: 0.15
  },
  x: {
    id: 'x', nome: 'X (Twitter)', como: 'Frases curtas, opinião e resposta. A briga dá alcance — e cobra na reputação.',
    idadeMin: 13, publico: ['seguidor', 'seguidores'], verbo: 'Postar', cor: '#3a3d42',
    alcance: 0.18, piso: 120, conversao: 0.03, viral: [0.02, 12], esquece: [0.12, 0.03], faixa: [16, 60], briga: 0.45, producao: 0,
    temas: { opiniao: 1.5, politica: 1.5, humor: 1.3, trabalho: 1, esporte: 1.2, conquista: 0.9, cotidiano: 0.7, desculpas: 1.1, rebater: 1.4, divulgar: 0.9, estudo: 0.8 },
    monetiza: { minimo: 5000, como: 'a divisão de receita dos anúncios nas respostas', porMil: 12 }, verificacao: 'paga', quem: [16, 60], deteccao: 0.2
  },
  facebook: {
    id: 'facebook', nome: 'Facebook', como: 'A rede de todo mundo: família, bairro, grupos. Público mais velho; a vida da família rende mais que a opinião.',
    idadeMin: 13, publico: ['seguidor', 'seguidores'], verbo: 'Publicar', cor: '#3b5ea6',
    alcance: 0.2, piso: 150, conversao: 0.04, viral: [0.008, 8], esquece: [0.08, 0.02], faixa: [30, 85], briga: 0.3, producao: 0,
    temas: { familia: 1.6, comunidade: 1.5, cotidiano: 1.1, humor: 0.8, pet: 1.1, viagem: 1.1, opiniao: 1, politica: 1.1, conquista: 1.2, receita: 1.1, trabalho: 0.9, divulgar: 1 },
    monetiza: { minimo: 10000, como: 'a página com anúncios e parcerias locais', porMil: 25 }, verificacao: 'notoriedade', quem: [30, 85], deteccao: 0.12
  },
  onlyfans: {
    id: 'onlyfans', nome: 'OnlyFans', como: 'Assinatura de conteúdo exclusivo, só para maiores de idade. Paga por assinante — e o que é público às vezes chega a quem não devia.',
    idadeMin: 18, publico: ['assinante', 'assinantes'], verbo: 'Publicar para assinantes', cor: '#2b8fd6',
    alcance: 0.8, piso: 30, conversao: 0.08, viral: [0, 1], esquece: [0.35, 0.15], faixa: [18, 50], briga: 0, producao: 1,
    temas: { exclusivo: 1, conversa: 0.8, divulgar: 0.9 },
    monetiza: { minimo: 1, como: 'a assinatura mensal de quem acompanha', porMil: 9000 }, verificacao: 'documento', quem: [99, 99], deteccao: 0.3
  }
};

export const ORDEM_PLATAFORMAS: PlataformaId[] = ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'twitch', 'onlyfans'];

export const ehPlataforma = (x: string): x is PlataformaId => x in PLATAFORMAS;

/** As plataformas que contam como "criar conteúdo" de verdade (para a oportunidade de viver disso). */
export const DE_CRIADOR: PlataformaId[] = ['youtube', 'tiktok', 'instagram', 'twitch'];
