// ---------------------------------------------------------------------------
// B2 — Personalidade emergente e memória de escolhas
//
// A personalidade NÃO é escolhida em questionário: ela emerge do padrão de
// comportamento acumulado. Cada escolha relevante registra uma memória
// estruturada (ids estáveis, nunca texto visível) e move poucos pontos em
// eixos assinados. Somente a repetição consistente ao longo dos anos produz
// um traço perceptível — e traços podem ser contrabalançados por escolhas
// posteriores de sentido oposto.
//
// Este sistema é puro (sem React, sem localStorage) e não importa nenhum outro
// sistema do jogo: eventSystem/agingSystem consultam-no em uma única direção,
// evitando dependência circular. Condições comportamentais permitem que
// eventos (atuais e futuros) consultem traço mínimo/máximo, escolha anterior
// e quantidade de ocorrências de uma tag.
//
// A memória interna NÃO é a Linha da Vida: registros desta memória jamais são
// despejados na timeline; apenas textos narrativos vão para lá.
// ---------------------------------------------------------------------------

import {
  CondicaoComportamental,
  EscolhaRegistrada,
  Gender,
  PersonalityState,
  TracoComportamental
} from '../types';

/** Taxonomia pequena e coerente (8 eixos). Extensível com parcimônia. */
export const TRACOS_COMPORTAMENTAIS: readonly TracoComportamental[] = [
  'empatia',
  'generosidade',
  'disciplina',
  'impulsividade',
  'coragem',
  'sociabilidade',
  'independencia',
  'familia'
] as const;

/** Intensidade mínima (módulo) para um traço ser "percebido" qualitativamente. */
export const LIMIAR_TRACO_PERCEBIDO = 5;

/** Máximo de traços exibidos simultaneamente (perfis podem combinar e até contradizer). */
export const MAX_TRACOS_PERCEBIDOS = 3;

/** Limite superior de intensidade por eixo (evita crescimento sem fim em vidas muito longas). */
export const LIMITE_INTENSIDADE_TRACO = 100;

/** Teto da memória de escolhas (as mais recentes são preservadas). */
export const LIMITE_MEMORIAS = 120;

/** Impacto máximo absoluto por escolha em um eixo (convenção de conteúdo: efeitos pequenos). */
export const IMPACTO_MAXIMO_POR_ESCOLHA = 5;

// ---------------------------------------------------------------------------
// Estado inicial e normalização
// ---------------------------------------------------------------------------

export function criarPersonalidadeInicial(): PersonalityState {
  const tracos = {} as Record<TracoComportamental, number>;
  for (const traco of TRACOS_COMPORTAMENTAIS) {
    tracos[traco] = 0;
  }
  return { tracos, memorias: [] };
}

function clampIntensidade(valor: number): number {
  return Math.max(-LIMITE_INTENSIDADE_TRACO, Math.min(LIMITE_INTENSIDADE_TRACO, valor));
}

/** Mantém apenas chaves válidas da taxonomia com valores finitos. */
export function sanitizarImpactos(
  impactos: Partial<Record<TracoComportamental, number>> | undefined
): Partial<Record<TracoComportamental, number>> {
  if (!impactos) return {};
  const limpos: Partial<Record<TracoComportamental, number>> = {};
  for (const traco of TRACOS_COMPORTAMENTAIS) {
    const valor = impactos[traco];
    if (typeof valor === 'number' && Number.isFinite(valor) && valor !== 0) {
      limpos[traco] = Math.round(valor);
    }
  }
  return limpos;
}

/** Normaliza um estado de personalidade vindo de save (defensivo contra dados inválidos). */
export function normalizarPersonalidade(bruto: unknown): PersonalityState {
  const base = criarPersonalidadeInicial();
  if (typeof bruto !== 'object' || bruto === null) return base;

  const obj = bruto as { tracos?: unknown; memorias?: unknown };

  if (typeof obj.tracos === 'object' && obj.tracos !== null) {
    const tracosBrutos = obj.tracos as Record<string, unknown>;
    for (const traco of TRACOS_COMPORTAMENTAIS) {
      const valor = tracosBrutos[traco];
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        base.tracos[traco] = clampIntensidade(Math.round(valor));
      }
    }
  }

  if (Array.isArray(obj.memorias)) {
    base.memorias = obj.memorias
      .filter((m): m is EscolhaRegistrada =>
        typeof m === 'object' && m !== null &&
        typeof (m as EscolhaRegistrada).eventoId === 'string' &&
        typeof (m as EscolhaRegistrada).opcaoId === 'string'
      )
      .map(m => ({
        eventoId: m.eventoId,
        opcaoId: m.opcaoId,
        idade: typeof m.idade === 'number' && Number.isFinite(m.idade) ? m.idade : 0,
        ano: typeof m.ano === 'number' && Number.isFinite(m.ano) ? m.ano : 0,
        tagsComportamentais: sanitizarImpactos(m.tagsComportamentais),
        impactos: sanitizarImpactos(m.impactos)
      }))
      .slice(-LIMITE_MEMORIAS);
  }

  return base;
}

// ---------------------------------------------------------------------------
// Registro de escolhas e aplicação de impactos
// ---------------------------------------------------------------------------

export interface RegistroEscolha {
  eventoId: string;
  opcaoId: string;
  idade: number;
  ano: number;
  tagsComportamentais?: Partial<Record<TracoComportamental, number>>;
}

export interface ResultadoRegistro {
  personalidade: PersonalityState;
  /** false quando a escolha já estava registrada (mesmo evento/opção/idade) e foi ignorada. */
  registrada: boolean;
}

/**
 * Registra uma escolha na memória interna e aplica os impactos comportamentais.
 * Idempotente por (eventoId, opcaoId, idade): responder o mesmo evento na mesma
 * idade não duplica memória nem conta duas vezes. O texto visível da opção não
 * participa do registro — apenas ids estáveis e tags.
 */
export function registrarEscolha(
  personalidade: PersonalityState,
  registro: RegistroEscolha
): ResultadoRegistro {
  const duplicada = personalidade.memorias.some(
    m => m.eventoId === registro.eventoId && m.opcaoId === registro.opcaoId && m.idade === registro.idade
  );
  if (duplicada) {
    return { personalidade, registrada: false };
  }

  const tags = sanitizarImpactos(registro.tagsComportamentais);
  const comImpactos = aplicarImpactosComportamentais(personalidade, tags);

  const novaMemoria: EscolhaRegistrada = {
    eventoId: registro.eventoId,
    opcaoId: registro.opcaoId,
    idade: registro.idade,
    ano: registro.ano,
    tagsComportamentais: tags,
    impactos: tags // hoje idênticos; campo separado para futura ponderação (ex.: por fase da vida)
  };

  const memorias = [...comImpactos.memorias, novaMemoria].slice(-LIMITE_MEMORIAS);
  return { personalidade: { tracos: comImpactos.tracos, memorias }, registrada: true };
}

/**
 * Aplica deltas comportamentais aos eixos (função pura; não toca na memória).
 * Escolhas de sentido oposto reduzem/contrabalançam tendências anteriores.
 */
export function aplicarImpactosComportamentais(
  personalidade: PersonalityState,
  impactos: Partial<Record<TracoComportamental, number>>
): PersonalityState {
  const limpos = sanitizarImpactos(impactos);
  const tracos = { ...personalidade.tracos };
  for (const traco of TRACOS_COMPORTAMENTAIS) {
    const delta = limpos[traco];
    if (delta !== undefined) {
      tracos[traco] = clampIntensidade(tracos[traco] + delta);
    }
  }
  return { tracos, memorias: personalidade.memorias };
}

// ---------------------------------------------------------------------------
// Consultas (memória e traços)
// ---------------------------------------------------------------------------

export interface FiltroMemoria {
  eventoId?: string;
  opcaoId?: string;
  traco?: TracoComportamental;
  idadeMinima?: number;
  idadeMaxima?: number;
}

/** Consulta a memória interna por ids, tag ou faixa de idade (nunca por texto). */
export function consultarMemoria(
  personalidade: PersonalityState,
  filtro: FiltroMemoria = {}
): EscolhaRegistrada[] {
  return personalidade.memorias.filter(m => {
    if (filtro.eventoId !== undefined && m.eventoId !== filtro.eventoId) return false;
    if (filtro.opcaoId !== undefined && m.opcaoId !== filtro.opcaoId) return false;
    if (filtro.traco !== undefined && m.tagsComportamentais[filtro.traco] === undefined) return false;
    if (filtro.idadeMinima !== undefined && m.idade < filtro.idadeMinima) return false;
    if (filtro.idadeMaxima !== undefined && m.idade > filtro.idadeMaxima) return false;
    return true;
  });
}

/** Quantas escolhas registradas exibem a tag informada (ocorrências, não soma de pesos). */
export function contarOcorrenciasTag(
  personalidade: PersonalityState,
  tag: TracoComportamental
): number {
  return personalidade.memorias.filter(m => m.tagsComportamentais[tag] !== undefined).length;
}

/** Intensidade atual de um traço (valor assinado; para condições, não para exibição). */
export function obterIntensidade(personalidade: PersonalityState, traco: TracoComportamental): number {
  return personalidade.tracos[traco] ?? 0;
}

// ---------------------------------------------------------------------------
// Traços derivados (camada interpretativa — sem classes rígidas)
// ---------------------------------------------------------------------------

export interface TracoPercebido {
  traco: TracoComportamental;
  /** Rótulo qualitativo em pt-BR, infletido por gênero quando aplicável. */
  rotulo: string;
  intensidade: number;
}

interface DefinicaoTraco {
  /** Rótulo do polo positivo (forma base; infletida por gênero na exibição). */
  positivo: string;
  /** Rótulo do polo negativo, quando faz sentido narrativo. */
  negativo?: string;
  /** Nome do eixo para mensagens (minúsculas). */
  nome: string;
}

const DEFINICOES_TRACOS: Record<TracoComportamental, DefinicaoTraco> = {
  empatia: { positivo: 'Empático', negativo: 'Insensível', nome: 'empatia' },
  generosidade: { positivo: 'Generoso', negativo: 'Egoísta', nome: 'generosidade' },
  disciplina: { positivo: 'Disciplinado', negativo: 'Rebelde', nome: 'disciplina' },
  impulsividade: { positivo: 'Impulsivo', negativo: 'Refletivo', nome: 'impulsividade' },
  coragem: { positivo: 'Corajoso', negativo: 'Cauteloso', nome: 'coragem' },
  sociabilidade: { positivo: 'Sociável', negativo: 'Reservado', nome: 'sociabilidade' },
  independencia: { positivo: 'Independente', nome: 'independência' },
  familia: { positivo: 'Ligado à família', negativo: 'Distante da família', nome: 'vida familiar' }
};

/** Inflecte rótulo terminado em "o" para o feminino; demais formas permanecem. */
function infletirRotulo(rotulo: string, genero?: Gender): string {
  if (genero === 'feminino' && rotulo.endsWith('o')) {
    return rotulo.slice(0, -1) + 'a';
  }
  return rotulo;
}

export function getRotuloTracoPercebido(
  traco: TracoComportamental,
  polaridade: 'positiva' | 'negativa',
  genero?: Gender
): string {
  const def = DEFINICOES_TRACOS[traco];
  const base = polaridade === 'positiva' ? def.positivo : def.negativo ?? def.positivo;
  return infletirRotulo(base, genero);
}

/** Nome do eixo para mensagens de requisito (ex.: "histórico de disciplina"). */
export function getNomeTraco(traco: TracoComportamental): string {
  return DEFINICOES_TRACOS[traco].nome;
}

/**
 * Traços suficientemente consolidados para serem percebidos, ordenados pela
 * intensidade (módulo). Perfis podem combinar e até contradizer — não há
 * arquétipo único. Enquanto não há evidência suficiente, retorna [] e a
 * interface mostra "Personalidade ainda em formação.".
 * Números crus nunca são expostos: apenas rótulos qualitativos.
 */
export function obterTracosPercebidos(
  personalidade: PersonalityState,
  genero?: Gender
): TracoPercebido[] {
  return TRACOS_COMPORTAMENTAIS.map(traco => ({ traco, intensidade: obterIntensidade(personalidade, traco) }))
    .filter(t => Math.abs(t.intensidade) >= LIMIAR_TRACO_PERCEBIDO)
    .sort((a, b) => Math.abs(b.intensidade) - Math.abs(a.intensidade))
    .slice(0, MAX_TRACOS_PERCEBIDOS)
    .map(t => ({
      traco: t.traco,
      intensidade: t.intensidade,
      rotulo: getRotuloTracoPercebido(t.traco, t.intensidade >= 0 ? 'positiva' : 'negativa', genero)
    }));
}

// ---------------------------------------------------------------------------
// Condições comportamentais (infraestrutura para eventos futuros)
// ---------------------------------------------------------------------------

/**
 * Avalia uma condição comportamental contra o estado atual:
 * - traco mínimo/máximo (intensidade acumulada);
 * - escolha anterior (por evento e, opcionalmente, opção);
 * - quantidade mínima de ocorrências de uma tag.
 * Sem personalidade informada, condições exigem recusa segura (motor nunca
 * "aprova por falta de dado").
 */
export function atendeCondicaoComportamental(
  personalidade: PersonalityState | undefined | null,
  condicao: CondicaoComportamental
): boolean {
  if (!personalidade) return false;

  if (condicao.traco && (condicao.intensidadeMinima !== undefined || condicao.intensidadeMaxima !== undefined)) {
    const intensidade = obterIntensidade(personalidade, condicao.traco);
    if (condicao.intensidadeMinima !== undefined && intensidade < condicao.intensidadeMinima) return false;
    if (condicao.intensidadeMaxima !== undefined && intensidade > condicao.intensidadeMaxima) return false;
  }

  if (condicao.escolheuAnteriormente) {
    const { eventoId, opcaoId } = condicao.escolheuAnteriormente;
    const fez = personalidade.memorias.some(
      m => m.eventoId === eventoId && (opcaoId === undefined || m.opcaoId === opcaoId)
    );
    if (!fez) return false;
  }

  if (condicao.minimoOcorrencias) {
    const { tag, quantidade } = condicao.minimoOcorrencias;
    if (contarOcorrenciasTag(personalidade, tag) < quantidade) return false;
  }

  return true;
}

/** Avalia uma lista de condições (todas devem ser atendidas). Lista ausente/vazia = sempre true. */
export function atendeCondicoesComportamentais(
  personalidade: PersonalityState | undefined | null,
  condicoes: CondicaoComportamental[] | undefined
): boolean {
  if (!condicoes || condicoes.length === 0) return true;
  return condicoes.every(c => atendeCondicaoComportamental(personalidade, c));
}
