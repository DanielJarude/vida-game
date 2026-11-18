/**
 * VIDA 26 — o CATÁLOGO dos atributos esportivos (nomes, explicações, natureza, de que capacidade ou traço cada um
 * depende, e os conjuntos por modalidade e por posição/função/prova, com o peso de cada atributo na nota). Folha (só
 * tipos importados): a conta mora em `sistemas/atributosEsportivos`.
 */
import type { Posicao } from '../../tipos';
import type { Capacidade26 } from '../corpo/capacidades26';
import type { FuncaoVolei } from '../../sistemas/provas';
import type { FuncaoFutsal } from '../../dados14/esportes/futsal';

export type GrupoDePosicao = 'goleiro' | 'defensor' | 'meio' | 'atacante';

export type AtributoId =
  // técnicos
  | 'passe' | 'passe_longo' | 'cruzamento' | 'finalizacao' | 'drible' | 'controle' | 'desarme' | 'conducao'
  | 'saidas' | 'pes' | 'arremesso' | 'ataque' | 'recepcao' | 'saque' | 'levantamento' | 'devolucao' | 'fundo' | 'forehand' | 'backhand' | 'rede'
  | 'largada' | 'viradas' | 'bracada' | 'tecnica_prova' | 'golpes' | 'solo'
  // táticos
  | 'posicionamento' | 'antecipacao' | 'marcacao' | 'visao' | 'movimentacao' | 'decisao' | 'disciplina' | 'defesa' | 'distancia'
  // físicos
  | 'reflexos' | 'aereo' | 'velocidade' | 'aceleracao' | 'forca' | 'resistencia' | 'agilidade' | 'impulsao' | 'equilibrio' | 'alcance' | 'explosao' | 'rebote' | 'bloqueio'
  // mentais
  | 'concentracao' | 'determinacao' | 'compostura' | 'lideranca' | 'equipe';

export type NaturezaDoAtributo = 'tecnico' | 'tatico' | 'fisico' | 'mental';

export const NOME_ATRIBUTO: Record<AtributoId, string> = {
  passe: 'passe curto', passe_longo: 'passe longo', cruzamento: 'cruzamento', finalizacao: 'finalização', drible: 'drible', controle: 'domínio e primeiro toque',
  desarme: 'desarme', conducao: 'condução de bola', saidas: 'saída do gol e um contra um', pes: 'jogo com os pés e reposição', arremesso: 'arremesso',
  ataque: 'ataque', recepcao: 'recepção e defesa', saque: 'saque', levantamento: 'levantamento', devolucao: 'devolução', fundo: 'jogo de fundo',
  forehand: 'forehand', backhand: 'backhand', rede: 'jogo de rede (voleio)', largada: 'saída do bloco', viradas: 'viradas', bracada: 'técnica de nado',
  tecnica_prova: 'técnica da prova', golpes: 'golpes em pé', solo: 'luta no chão',
  posicionamento: 'posicionamento', antecipacao: 'antecipação e interceptação', marcacao: 'marcação', visao: 'visão de jogo', movimentacao: 'movimentação sem bola',
  decisao: 'tomada de decisão', disciplina: 'disciplina tática', defesa: 'defesa', distancia: 'controle de distância',
  reflexos: 'reflexos', aereo: 'jogo aéreo', velocidade: 'velocidade', aceleracao: 'aceleração', forca: 'força', resistencia: 'resistência', agilidade: 'agilidade',
  impulsao: 'impulsão', equilibrio: 'equilíbrio', alcance: 'alcance', explosao: 'explosão', rebote: 'rebote', bloqueio: 'bloqueio',
  concentracao: 'concentração', determinacao: 'determinação', compostura: 'controle emocional', lideranca: 'liderança', equipe: 'trabalho em equipe'
};

/** O que cada atributo é, em uma frase (a ficha explica; nunca o número interno). */
export const SOBRE_ATRIBUTO: Record<AtributoId, string> = {
  passe: 'Pôr a bola onde o companheiro precisa, no tempo certo.',
  passe_longo: 'A virada de jogo, o lançamento nas costas da defesa.',
  cruzamento: 'A bola na área, na cabeça de quem chega.',
  finalizacao: 'Transformar a chance em ponto ou gol.',
  drible: 'Passar pelo marcador com a bola.',
  controle: 'Matar a bola e já sair jogando: o domínio, o primeiro toque.',
  desarme: 'Tirar a bola no tempo certo, sem falta.',
  conducao: 'Carregar a bola com controle, sob marcação.',
  saidas: 'Sair do gol na hora certa: o cruzamento, o um contra um.',
  pes: 'Jogar com os pés: o passe de saída, a reposição longa.',
  arremesso: 'Converter de média e de longa distância.',
  ataque: 'Pôr a bola no chão do outro lado, contra o bloqueio.',
  recepcao: 'Receber o saque e defender o ataque: a bola na mão do levantador.',
  saque: 'Começar o ponto com vantagem: força, direção, o ace.',
  levantamento: 'Distribuir: a bola certa, para quem está livre, no tempo do atacante.',
  devolucao: 'Neutralizar o saque do outro lado.',
  fundo: 'Construir o ponto da linha de base.',
  forehand: 'O golpe de direita: profundidade, ângulo, a bola que define.',
  backhand: 'O golpe de esquerda: segurar o ponto pelo lado mais difícil.',
  rede: 'Fechar o ponto no voleio.',
  largada: 'A saída do bloco: os centésimos do começo da prova.',
  viradas: 'As viradas nas paredes: o tempo que se ganha (ou perde) a cada volta.',
  bracada: 'A eficiência do nado: cada braçada levando mais longe.',
  tecnica_prova: 'O gesto da prova: a passada, a corrida de aproximação, o giro.',
  golpes: 'Acertar em pé: socos, chutes, a combinação certa.',
  solo: 'A luta no chão: quedas, controle, finalização.',
  posicionamento: 'Estar no lugar certo antes da jogada acontecer.',
  antecipacao: 'Ler o passe antes dele sair — e cortar.',
  marcacao: 'Acompanhar quem ataca e não deixar jogar.',
  visao: 'Enxergar a jogada que os outros não viram.',
  movimentacao: 'Aparecer livre: a diagonal, o espaço entre os marcadores.',
  decisao: 'Escolher bem e rápido: passar, driblar, chutar, segurar.',
  disciplina: 'Cumprir a função no sistema do time, mesmo cansado.',
  defesa: 'Não deixar o adversário pontuar: a guarda, a esquiva, a contestação.',
  distancia: 'Lutar na distância que é sua e tirar o adversário da dele.',
  reflexos: 'A reação no lance que ninguém espera.',
  aereo: 'Ganhar a bola pelo alto: tempo de salto, alcance, cabeceio.',
  velocidade: 'Chegar antes: a velocidade final.',
  aceleracao: 'A arrancada dos primeiros metros.',
  forca: 'Ganhar o corpo a corpo, proteger a bola, aguentar o contato.',
  resistencia: 'Aguentar o jogo inteiro — e a temporada inteira — no mesmo ritmo.',
  agilidade: 'Mudar de direção sem perder o equilíbrio.',
  impulsao: 'O salto: a altura e o tempo para ela.',
  equilibrio: 'Não cair no contato; proteger a bola com o corpo.',
  alcance: 'Chegar mais alto e mais longe com o corpo que se tem.',
  explosao: 'A força em pouco tempo: a saída, o salto, o arremesso.',
  rebote: 'Ganhar a bola que sobra no garrafão.',
  bloqueio: 'Fechar a rede: tempo de salto e leitura do levantamento.',
  concentracao: 'Não desligar: o jogo inteiro na cabeça, do primeiro ao último minuto.',
  determinacao: 'Não desistir do lance, do treino, da temporada.',
  compostura: 'Decidir com a cabeça fria: a final, o pênalti, a vaia.',
  lideranca: 'Puxar o grupo: a voz no vestiário e em campo.',
  equipe: 'Jogar para o time: a ajuda, o passe a mais, o sacrifício.'
};

const TATICOS: AtributoId[] = ['posicionamento', 'antecipacao', 'marcacao', 'visao', 'movimentacao', 'decisao', 'disciplina', 'defesa', 'distancia'];
const FISICOS: AtributoId[] = ['reflexos', 'aereo', 'velocidade', 'aceleracao', 'forca', 'resistencia', 'agilidade', 'impulsao', 'equilibrio', 'alcance', 'explosao', 'rebote', 'bloqueio'];
const MENTAIS: AtributoId[] = ['concentracao', 'determinacao', 'compostura', 'lideranca', 'equipe'];
/** A natureza de cada atributo (a ficha agrupa por ela; a fonte do valor depende dela). */
export const GRUPO_DO_ATRIBUTO: Record<AtributoId, NaturezaDoAtributo> = Object.fromEntries((Object.keys(NOME_ATRIBUTO) as AtributoId[]).map(id => [id,
  TATICOS.includes(id) ? 'tatico' : FISICOS.includes(id) ? 'fisico' : MENTAIS.includes(id) ? 'mental' : 'tecnico'])) as Record<AtributoId, NaturezaDoAtributo>;

/** De que capacidades físicas cada atributo depende (e quanto). O que não está aqui não lê o corpo. */
export const CORPO_DO_ATRIBUTO: Partial<Record<AtributoId, [Capacidade26, number][]>> = {
  reflexos: [['agilidade', 0.6], ['aceleracao', 0.4]], aereo: [['impulsao', 0.5], ['alcance', 0.3], ['forca', 0.2]],
  velocidade: [['velocidade', 1]], aceleracao: [['aceleracao', 1]], forca: [['forca', 1]], resistencia: [['resistencia', 0.8], ['recuperacao', 0.2]],
  agilidade: [['agilidade', 1]], impulsao: [['impulsao', 1]], equilibrio: [['equilibrio', 0.7], ['forca', 0.3]], alcance: [['alcance', 1]],
  explosao: [['potencia', 1]], rebote: [['alcance', 0.5], ['impulsao', 0.3], ['forca', 0.2]], bloqueio: [['alcance', 0.5], ['impulsao', 0.5]],
  saidas: [['agilidade', 0.5], ['alcance', 0.5]]
};
/** De que traços de personalidade cada atributo mental depende (o traço vai de −100 a 100). */
export const MENTE_DO_ATRIBUTO: Partial<Record<AtributoId, [string, number][]>> = {
  concentracao: [['disciplina', 0.06], ['impulsividade', -0.04]], determinacao: [['disciplina', 0.05], ['coragem', 0.04]],
  compostura: [['impulsividade', -0.06], ['coragem', 0.02]], lideranca: [['sociabilidade', 0.04], ['coragem', 0.04], ['independencia', 0.02]],
  equipe: [['empatia', 0.04], ['sociabilidade', 0.03], ['generosidade', 0.02]]
};

export type Lista = [AtributoId, number][];
/** Futebol: cada posição com o seu conjunto e o peso de cada atributo na nota (somam 1). Estilos diferentes cabem no mesmo conjunto. */
export const ATRIBUTOS_DA_POSICAO: Record<Posicao, Lista> = {
  goleiro: [['reflexos', 0.2], ['posicionamento', 0.16], ['saidas', 0.12], ['pes', 0.08], ['aereo', 0.08], ['decisao', 0.08], ['concentracao', 0.08], ['agilidade', 0.06], ['compostura', 0.06], ['impulsao', 0.04], ['lideranca', 0.04]],
  zagueiro: [['marcacao', 0.16], ['antecipacao', 0.14], ['desarme', 0.12], ['aereo', 0.12], ['posicionamento', 0.1], ['forca', 0.08], ['passe', 0.06], ['concentracao', 0.06], ['velocidade', 0.05], ['decisao', 0.05], ['impulsao', 0.03], ['lideranca', 0.03]],
  lateral: [['velocidade', 0.12], ['resistencia', 0.12], ['cruzamento', 0.12], ['marcacao', 0.1], ['posicionamento', 0.08], ['desarme', 0.07], ['passe', 0.07], ['aceleracao', 0.07], ['antecipacao', 0.06], ['drible', 0.05], ['movimentacao', 0.05], ['disciplina', 0.05], ['determinacao', 0.04]],
  volante: [['desarme', 0.13], ['passe', 0.13], ['marcacao', 0.12], ['antecipacao', 0.12], ['posicionamento', 0.1], ['resistencia', 0.1], ['visao', 0.07], ['decisao', 0.07], ['forca', 0.05], ['disciplina', 0.05], ['passe_longo', 0.03], ['determinacao', 0.03]],
  meia: [['passe', 0.16], ['visao', 0.15], ['controle', 0.11], ['decisao', 0.11], ['drible', 0.08], ['movimentacao', 0.08], ['passe_longo', 0.07], ['finalizacao', 0.07], ['resistencia', 0.07], ['agilidade', 0.04], ['compostura', 0.03], ['equipe', 0.03]],
  ponta: [['velocidade', 0.14], ['drible', 0.14], ['finalizacao', 0.12], ['aceleracao', 0.1], ['cruzamento', 0.1], ['movimentacao', 0.1], ['controle', 0.08], ['agilidade', 0.07], ['decisao', 0.06], ['passe', 0.05], ['determinacao', 0.04]],
  atacante: [['finalizacao', 0.24], ['movimentacao', 0.14], ['controle', 0.09], ['aereo', 0.09], ['forca', 0.08], ['velocidade', 0.08], ['posicionamento', 0.08], ['compostura', 0.07], ['aceleracao', 0.05], ['decisao', 0.05], ['determinacao', 0.03]]
};
/** Compatibilidade (REWORK 11): o conjunto do GRUPO da posição — o da posição típica de cada grupo. */
export const ATRIBUTOS_DO_GRUPO: Record<GrupoDePosicao, Lista> = { goleiro: ATRIBUTOS_DA_POSICAO.goleiro, defensor: ATRIBUTOS_DA_POSICAO.zagueiro, meio: ATRIBUTOS_DA_POSICAO.meia, atacante: ATRIBUTOS_DA_POSICAO.atacante };

/** Basquete: pela função (o armador baixo compensa com condução, passe e decisão; o pivô vive do alcance e do rebote). */
export const ATRIBUTOS_BASQUETE: Record<'armador' | 'ala' | 'pivo', Lista> = {
  armador: [['conducao', 0.16], ['passe', 0.16], ['arremesso', 0.14], ['visao', 0.1], ['decisao', 0.1], ['defesa', 0.08], ['velocidade', 0.08], ['aceleracao', 0.06], ['agilidade', 0.06], ['compostura', 0.06]],
  ala: [['arremesso', 0.22], ['conducao', 0.1], ['rebote', 0.1], ['defesa', 0.1], ['impulsao', 0.08], ['velocidade', 0.08], ['movimentacao', 0.08], ['decisao', 0.08], ['alcance', 0.06], ['agilidade', 0.05], ['compostura', 0.05]],
  pivo: [['rebote', 0.22], ['alcance', 0.14], ['forca', 0.12], ['arremesso', 0.1], ['defesa', 0.1], ['posicionamento', 0.1], ['impulsao', 0.08], ['passe', 0.06], ['equipe', 0.04], ['concentracao', 0.04]]
};
export const ATRIBUTOS_VOLEI: Record<FuncaoVolei, Lista> = {
  levantador: [['levantamento', 0.26], ['decisao', 0.14], ['saque', 0.1], ['recepcao', 0.1], ['agilidade', 0.1], ['compostura', 0.08], ['bloqueio', 0.06], ['lideranca', 0.06], ['concentracao', 0.06], ['posicionamento', 0.04]],
  ponteiro: [['ataque', 0.2], ['recepcao', 0.2], ['saque', 0.12], ['impulsao', 0.1], ['bloqueio', 0.08], ['alcance', 0.08], ['agilidade', 0.06], ['decisao', 0.06], ['compostura', 0.05], ['resistencia', 0.05]],
  oposto: [['ataque', 0.28], ['saque', 0.14], ['bloqueio', 0.12], ['impulsao', 0.12], ['alcance', 0.12], ['compostura', 0.08], ['forca', 0.07], ['decisao', 0.07]],
  central: [['bloqueio', 0.24], ['ataque', 0.16], ['alcance', 0.16], ['impulsao', 0.12], ['posicionamento', 0.1], ['saque', 0.08], ['concentracao', 0.08], ['agilidade', 0.06]],
  libero: [['recepcao', 0.32], ['posicionamento', 0.14], ['agilidade', 0.14], ['concentracao', 0.12], ['compostura', 0.08], ['equipe', 0.08], ['levantamento', 0.06], ['velocidade', 0.06]]
};
const ALA_FUTSAL: Lista = [['drible', 0.16], ['conducao', 0.14], ['passe', 0.12], ['finalizacao', 0.12], ['aceleracao', 0.1], ['agilidade', 0.1], ['marcacao', 0.08], ['decisao', 0.08], ['resistencia', 0.06], ['controle', 0.04]];
export const ATRIBUTOS_FUTSAL: Record<FuncaoFutsal, Lista> = {
  goleiro: [['reflexos', 0.24], ['posicionamento', 0.16], ['saidas', 0.14], ['pes', 0.12], ['agilidade', 0.1], ['concentracao', 0.08], ['decisao', 0.08], ['compostura', 0.08]],
  fixo: [['marcacao', 0.18], ['desarme', 0.14], ['passe', 0.14], ['antecipacao', 0.12], ['posicionamento', 0.1], ['forca', 0.08], ['decisao', 0.08], ['finalizacao', 0.06], ['concentracao', 0.05], ['lideranca', 0.05]],
  ala_esquerda: ALA_FUTSAL, ala_direita: ALA_FUTSAL,
  pivo: [['finalizacao', 0.2], ['controle', 0.14], ['forca', 0.14], ['passe', 0.1], ['movimentacao', 0.1], ['equilibrio', 0.1], ['decisao', 0.08], ['compostura', 0.08], ['drible', 0.06]]
};
export type GrupoDeProva = 'velocidade' | 'fundo' | 'saltos' | 'arremessos';
export const grupoDaProva = (nome?: string): GrupoDeProva => (!nome ? 'velocidade' : /salto/.test(nome) ? 'saltos' : /arremesso|lançamento/.test(nome) ? 'arremessos' : /1\.500|10\.000|maratona/.test(nome) ? 'fundo' : 'velocidade');
export const ATRIBUTOS_ATLETISMO: Record<GrupoDeProva, Lista> = {
  velocidade: [['velocidade', 0.24], ['aceleracao', 0.2], ['explosao', 0.14], ['tecnica_prova', 0.14], ['concentracao', 0.1], ['compostura', 0.1], ['forca', 0.08]],
  fundo: [['resistencia', 0.32], ['determinacao', 0.16], ['tecnica_prova', 0.12], ['velocidade', 0.1], ['concentracao', 0.1], ['decisao', 0.1], ['compostura', 0.1]],
  saltos: [['tecnica_prova', 0.24], ['impulsao', 0.24], ['velocidade', 0.14], ['explosao', 0.12], ['concentracao', 0.1], ['compostura', 0.1], ['alcance', 0.06]],
  arremessos: [['forca', 0.26], ['tecnica_prova', 0.24], ['explosao', 0.2], ['equilibrio', 0.1], ['concentracao', 0.1], ['compostura', 0.1]]
};

/** As modalidades sem papel com perfil próprio (e os conjuntos padrão das que têm, quando o papel não é conhecido). */
export const ATRIBUTOS_DA_MODALIDADE: Partial<Record<string, Lista>> = {
  volei: ATRIBUTOS_VOLEI.ponteiro,
  futsal: ALA_FUTSAL,
  tenis: [['saque', 0.16], ['forehand', 0.14], ['devolucao', 0.12], ['backhand', 0.12], ['agilidade', 0.1], ['resistencia', 0.08], ['decisao', 0.08], ['compostura', 0.08], ['rede', 0.06], ['velocidade', 0.06]],
  natacao: [['bracada', 0.26], ['resistencia', 0.14], ['largada', 0.12], ['viradas', 0.1], ['velocidade', 0.1], ['forca', 0.08], ['alcance', 0.08], ['determinacao', 0.06], ['concentracao', 0.06]],
  atletismo: ATRIBUTOS_ATLETISMO.velocidade,
  lutas: [['golpes', 0.18], ['solo', 0.16], ['defesa', 0.14], ['distancia', 0.1], ['resistencia', 0.1], ['forca', 0.08], ['explosao', 0.08], ['agilidade', 0.06], ['decisao', 0.05], ['compostura', 0.05]]
};

export const TATICOS26 = TATICOS, FISICOS26 = FISICOS;
