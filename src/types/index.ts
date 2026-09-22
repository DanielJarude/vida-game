// Tipos centrais do jogo VIDA

import type { AparenciaAvatar } from '../data/avatar/avatarData';

export type Gender = 'masculino' | 'feminino' | 'nao-binario';

export type LifeStage =
  | 'primeira_infancia' // 0-5
  | 'infancia'          // 6-11
  | 'adolescencia'       // 12-17
  | 'jovem_adulto'      // 18-29
  | 'adulto'            // 30-59
  | 'terceira_idade';   // 60+

export type SocialClass =
  | 'vulneravel'
  | 'trabalhadora'
  | 'classe_media_baixa'
  | 'classe_media'
  | 'classe_alta';

// Atributos Visíveis (0 a 100)
export interface VisibleStats {
  felicidade: number;   // Happiness
  saude: number;        // Health
  inteligencia: number; // Smarts
  aparencia: number;    // Looks
}

// Atributos Ocultos / Internos (0 a 100)
export interface HiddenStats {
  disciplina: number;        // Discipline
  sociabilidade: number;     // Sociability
  empatia: number;           // Empathy
  ambicao: number;           // Ambition
  estresse: number;          // Stress (quanto maior, pior)
  reputacao: number;         // Reputation
  condicionamentoFisico: number; // Fitness
}

// ---------------------------------------------------------------------------
// B2 — Personalidade emergente e memória de escolhas
// Traços são eixos assinados: valores positivos reforçam a tendência; valores
// negativos indicam o polo oposto (ex.: generosidade negativa = egoísmo).
// Uma escolha isolada move poucos pontos; padrões ao longo da vida constroem
// traços fortes. Números crus nunca são exibidos ao jogador.
// ---------------------------------------------------------------------------

export type TracoComportamental =
  | 'empatia'
  | 'generosidade'
  | 'disciplina'
  | 'impulsividade'
  | 'coragem'
  | 'sociabilidade'
  | 'independencia'
  | 'familia';

/** Registro estruturado de uma escolha relevante (memória interna, não a Linha da Vida). */
export interface EscolhaRegistrada {
  eventoId: string;
  opcaoId: string;
  idade: number;
  ano: number;
  /** Tags declaradas na opção escolhida (identificadores estáveis, nunca texto visível). */
  tagsComportamentais: Partial<Record<TracoComportamental, number>>;
  /** Deltas efetivamente aplicados aos traços (pode divergir das tags no futuro). */
  impactos: Partial<Record<TracoComportamental, number>>;
}

/** Estado de personalidade do personagem: intensidades acumuladas + memória de escolhas. */
export interface PersonalityState {
  tracos: Record<TracoComportamental, number>;
  memorias: EscolhaRegistrada[];
}

/**
 * Condição comportamental consultável por eventos e opções (presente e futuro):
 * traço mínimo/máximo, escolha anterior e quantidade de ocorrências de uma tag.
 */
export interface CondicaoComportamental {
  traco?: TracoComportamental;
  intensidadeMinima?: number;
  intensidadeMaxima?: number;
  escolheuAnteriormente?: { eventoId: string; opcaoId?: string };
  minimoOcorrencias?: { tag: TracoComportamental; quantidade: number };
}

export type RelationType =
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'irma'
  | 'namorado'
  | 'namorada'
  | 'noivo'
  | 'noiva'
  | 'esposo'
  | 'esposa'
  | 'filho'
  | 'filha'
  | 'amigo'
  | 'amiga'
  | 'pet'
  // B4-FIX3 item 13 — mundo social fora da família: pessoas que nascem de
  // um evento (colega, paixão secreta, desafeto) e podem persistir,
  // reaparecer e mudar de tipo ao longo da vida (ex.: amigo → namorado,
  // quando idade/regras permitirem).
  | 'rival'
  | 'paixao'
  | 'mentor'
  // F6 — degrau anterior à amizade. Alguém com quem se convive (turma,
  // trabalho, atividade) e que ainda NÃO é amigo. Existe para que amizade
  // não nasça pronta: a progressão é colega -> amigo -> amigo próximo.
  // `temAmigo` (F4) continua exigindo 'amigo'/'amiga', de modo que um colega
  // não satisfaz nenhum pressuposto de amizade.
  | 'colega';

export interface FamilyMember {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Gender;
  tipo: RelationType;
  idade: number;
  relacionamento: number; // 0 a 100
  vivo: boolean;
  profissao?: string;
  renda?: number;
  personalidade?: string;
  situacaoAtual?: string;
  anoMorte?: number;
  causaMorte?: string;
  // B4-FIX3 item 13 — infraestrutura leve de NPC persistente. Nenhum campo
  // novo é obrigatório: membros de família tradicionais (pai/mãe/irmão)
  // continuam sem precisar declarar nada disso.
  //
  // - `ativo`: a relação continua acontecendo (padrão implícito: true
  //   quando ausente). Uma amizade que "encerrou" fica `ativo: false` sem
  //   apagar a pessoa nem seu histórico — ela pode voltar a aparecer.
  // - `origemEventoId`: qual evento criou esta pessoa, só para depuração/
  //   rastreabilidade; nenhuma regra de jogo depende deste campo.
  ativo?: boolean;
  origemEventoId?: string;
  /**
   * F6 — a HISTÓRIA MÍNIMA de uma relação não familiar. Todos opcionais:
   * saves v5 e membros de família não declaram nada disso, e a ausência é
   * sempre lida como "não se aplica" (nunca como valor default enganoso).
   *
   * - `origemSocial`: de onde a pessoa veio (escola, trabalho, vizinhança...).
   *   É o que impede relação sem causa. Tipado como `string` porque
   *   `types/index.ts` não pode importar de `systems/` — o valor canônico é
   *   `AmbienteSocial`, e há teste garantindo que só ambientes válidos chegam.
   * - `idadeEntrada`: com que idade do JOGADOR essa pessoa entrou na vida.
   * - `ultimoContatoIdade`: idade do jogador no último contato relevante.
   *   Base do afastamento gradual — sem barra drenando por turno.
   * - `estudante`: a pessoa estuda (logo, não tem profissão adulta).
   */
  origemSocial?: string;
  idadeEntrada?: number;
  ultimoContatoIdade?: number;
  estudante?: boolean;
}

export type EducationLevel =
  | 'nenhuma'
  | 'fundamental_incompleto'
  | 'fundamental_completo'
  | 'medio_incompleto'
  | 'medio_completo'
  | 'tecnico'
  | 'superior_incompleto'
  | 'superior_completo'
  | 'pos_graduacao';

export type FamilyInteractionType =
  | 'conversar'
  | 'passar_tempo'
  | 'dar_presente'
  | 'discutir'
  | 'pedir_dinheiro'
  | 'pedir_conselho'
  // Exclusivas de pets (B4-FIX1) — um animal não conversa nem discute;
  // o vínculo com ele acontece por cuidado e presença física.
  | 'fazer_carinho'
  | 'alimentar'
  | 'passear';

export type PosturaEscolar = 'estudar' | 'matar_aula' | 'socializar';

export interface EducationState {
  nivelAtual: EducationLevel;
  emCurso: boolean;
  tipoCurso?: 'fundamental' | 'medio' | 'tecnico' | 'superior' | 'pos';
  nomeCurso?: string;
  instituicao?: string;
  isPublica?: boolean;
  /**
   * Semestre em que o aluno está, 1-based. DERIVADO de `matriculaInicio` +
   * `totalSemestres` a cada passagem de ano; mantido no estado apenas para
   * exibição e compatibilidade com saves anteriores à Fase 2.
   *
   * Não é fonte de verdade: quem decide a conclusão é o tempo decorrido desde
   * `matriculaInicio` (ver `systems/tempo/matricula.ts`). Antes da Fase 2 este
   * campo ERA a fonte de verdade, e foi exatamente isso que produziu o
   * off-by-one em que um curso de 3 semestres formava em 1 ano.
   */
  semestreAtual?: number;
  totalSemestres?: number;
  /**
   * Instante (em semestres, ancorado na IDADE) em que a matrícula começou.
   * Fonte de verdade da duração do curso.
   *
   * Opcional para não invalidar saves anteriores à Fase 2: quando ausente, é
   * reconstruído de forma conservadora a partir do progresso já registrado —
   * ver `reconstruirMatricula` em `educationSystem`.
   */
  matriculaInicio?: number;
  desempenho: number; // 0 a 100 (notas)
  mensalidade?: number;
  anoIngresso?: number;
  // Compromisso do ano corrente; efeitos processados na passagem de ano
  posturaAno?: PosturaEscolar | null;
  /**
   * Resultado do vestibular/ENEM prestado, com o ano de vida em que foi feito.
   *
   * Antes da Fase 2 a nota era sorteada a cada chamada de `ingressarCurso` e
   * descartada — o ENEM era um botão de re-roll, e a auditoria mediu 23
   * aprovações na segunda tentativa do mesmo ano. Persistir a nota é o que
   * torna a prova um FATO da vida do personagem em vez de um sorteio repetível.
   *
   * Ausente = ainda não prestou. Saves antigos caem neste caso.
   */
  vestibular?: {
    /** Idade em que a prova foi prestada. */
    anoDeVida: number;
    /** Nota obtida (350-990). Reusada em toda tentativa do mesmo ano. */
    nota: number;
  };
  cursosConcluidos: {
    nome: string;
    tipo: string;
    anoConclusao: number;
  }[];
}

export interface Job {
  id: string;
  titulo: string;
  setor: string;
  salarioMensal: number;
  escolaridadeMinima: EducationLevel;
  inteligenciaMinima: number;
  experienciaNecessaria: number; // em anos
  horasSemanais: number;
  estresseNivel: number; // 1 a 5
  progressaoPara?: string; // id do proximo cargo
}

export interface CareerState {
  empregado: boolean;
  cargoAtual?: Job;
  anosNoCargo: number;
  desempenhoTrabalho: number; // 0 a 100
  horasExtras: boolean;
  // Bico escolhido como compromisso do ano corrente; pago na passagem de ano
  bicoAtivoId?: string | null;
  aposentado: boolean;
  rendaAposentadoria?: number;
  historicoEmpregos: {
    cargo: string;
    empresa?: string;
    salario: number;
    anoInicio: number;
    anoFim?: number;
    motivoSaida?: string;
  }[];
}

export interface Property {
  id: string;
  tipo: 'imovel' | 'veiculo';
  nome: string;
  valorCompra: number;
  valorAtual: number;
  custoAnualManutencao: number;
  anoCompra: number;
  quitado: boolean;
  parcelasRestantes?: number;
  valorParcela?: number;
}

export interface Investment {
  id: string;
  tipo: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto';
  nome: string;
  saldo: number;
  rendimentoMedioAnual: number; // ex: 0.10 (10%)
  risco: 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto';
}

export interface EconomyState {
  dinheiro: number; // Saldo em conta corrente
  despesasAnuaisPadrao: number;
  padraoDeVida: 'modesto' | 'confortavel' | 'luxuoso';
  propriedades: Property[];
  investimentos: Investment[];
  dividas: number;
}

export type LifeLogCategory =
  | 'geral'
  | 'familia'
  // B4-FIX4 — o mundo social fora da família e o tempo livre existiam no
  // catálogo de eventos (categorias 'amizade', 'comunidade', 'hobby',
  // 'esporte', 'tecnologia') mas não tinham para onde ir na Linha da Vida:
  // caíam todos em 'evento', rotulado "Escolha". Duas categorias novas
  // dão a esses acontecimentos o lugar que já era deles.
  | 'amizade'
  | 'lazer'
  | 'escola'
  | 'carreira'
  | 'amor'
  | 'saude'
  | 'financas'
  | 'evento'
  | 'morte'
  | 'cotidiano';

/**
 * B4-FIX4 — relevância explícita de uma entrada da Linha da Vida.
 *
 * Antes, o que entrava no resumo anual era decidido por heurística sobre
 * `categoria` + `tipo` ("se for cotidiano, ignore"). Isso fazia a curadoria
 * depender de coincidência: um acontecimento real de categoria 'cotidiano'
 * sumia do resumo, e texto de preenchimento de categoria 'geral' entrava.
 *
 * - 'marco'   : muda a trajetória. Sempre aparece, sempre com ênfase.
 * - 'normal'  : aconteceu e vale ser lembrado. O padrão.
 * - 'textura' : rotina de fundo. Fica na Linha da Vida se alguém quiser ler,
 *               mas nunca interrompe nem entra no resumo do ano.
 *
 * Ausente = comportamento anterior (heurística por categoria/tipo), para
 * que nenhuma entrada já persistida mude de sentido ao carregar um save.
 */
export type RelevanciaLog = 'marco' | 'normal' | 'textura';

export interface LifeLogEntry {
  id: string;
  idade: number;
  ano: number;
  categoria: LifeLogCategory;
  texto: string;
  tipo?: 'info' | 'positivo' | 'negativo' | 'importante' | 'alerta';
  relevancia?: RelevanciaLog;
  /**
   * F5-FIX — assunto biográfico, quando esta entrada é uma pequena memória.
   *
   * Existe para que o cooldown temático possa ser reconstruído a partir da
   * própria Linha da Vida, em vez de um contador persistido em paralelo.
   *
   * OPCIONAL de propósito: entradas de saves anteriores (v5) não o têm, e a
   * ausência é tratada como "tema desconhecido" — o que apenas torna a
   * política mais permissiva para o passado, nunca incorreta. Por isso a
   * versão do save NÃO mudou.
   *
   * O tipo é `string` e não `TemaDeMemoria` porque `types/index.ts` não pode
   * importar de `systems/` (dependência circular). A fonte da verdade do
   * vocabulário é `systems/memorias/pequenaMemoria`, e um teste permanente
   * garante que só temas válidos chegam aqui.
   */
  temaDeMemoria?: string;
}

export interface EventConsequence {
  stats?: Partial<VisibleStats>;
  hiddenStats?: Partial<HiddenStats>;
  // B2 — sinal comportamental de longo prazo (personalidade emergente); impacto pequeno por escolha
  impactosComportamentais?: Partial<Record<TracoComportamental, number>>;
  dinheiro?: number;
  relacionamentoDelta?: { relationId?: string; relationType?: RelationType; delta: number };
  adicionarFlag?: string;
  removerFlag?: string;
  adicionarLog?: string;
  saudeDelta?: number;
  demissao?: boolean;
  morte?: boolean;
  causaMorte?: string;
  adicionarFamiliar?: Partial<FamilyMember>;
  adicionarDoenca?: string;
  curarDoenca?: string;
  // B4-FIX3 item 13/14 — mundo social: transformar o tipo de uma relação
  // existente (ex.: amigo → namorado, quando um evento de romance
  // encontra uma pessoa já conhecida) e encerrar uma relação sem apagar
  // a pessoa nem seu histórico (fica `ativo: false`, pode reaparecer).
  // Referenciam a pessoa por ID estável OU por `relationType` (mesmo
  // padrão de `relacionamentoDelta`) — nunca por nome/texto.
  // `relationType` é o único jeito de o CONTEÚDO do evento apontar para
  // um NPC criado em tempo de execução, já que o dado do evento não
  // conhece o id gerado; quando houver mais de uma pessoa do mesmo tipo,
  // a mais recentemente adicionada é usada.
  transformarRelacao?: { relationId?: string; relationType?: RelationType; novoTipo: RelationType };
  encerrarRelacao?: { relationId?: string; relationType?: RelationType };
}

export interface EventOption {
  id: string;
  texto: string;
  descricaoResultado?: string;
  /**
   * F5 — como esta experiência fica registrada na BIOGRAFIA, quando o texto
   * de desfecho não se sustenta sozinho.
   *
   * Três textos, três funções distintas:
   *   `descricao`          SITUAÇÃO — o que aconteceu (mostrado ao vivo)
   *   `descricaoResultado` RESULTADO — como terminou (mostrado ao vivo)
   *   `descricaoMemoria`   MEMÓRIA — como isso fica na Linha da Vida
   *
   * POR QUE NÃO BASTA CONCATENAR os dois primeiros: as situações são escritas
   * no PRESENTE, porque são exibidas enquanto acontecem ("o quarto fica
   * escuro"), e os resultados no PASSADO ("você encarou"). Colar um no outro
   * produz texto com tempo verbal quebrado e comprimento de parágrafo numa
   * lista que precisa ser escaneável. Além disso, a memória raramente é a
   * soma: ela é o resumo que sobra depois, e às vezes enfatiza outra coisa.
   *
   * Preencher SÓ quando o resultado for incompreensível isolado — tipicamente
   * quando ele usa artigo definido para algo que só a situação apresentou
   * ("devolveu o tablet", "completou o álbum"). Ausente = o resultado já se
   * explica e vai para a Linha da Vida como está, que é o caso da maioria.
   */
  descricaoMemoria?: string;
  consequencias: EventConsequence;
  /**
   * Peso relativo deste desfecho quando o evento é um ACONTECIMENTO
   * (`natureza: 'acontecimento'`). O motor resolve o desfecho sozinho,
   * sorteando entre as opções por este peso. Ignorado em eventos de
   * DECISÃO — lá quem escolhe é o jogador, não o dado. Ausente = 1.
   */
  peso?: number;
  requisito?: {
    atributo?: keyof VisibleStats | keyof HiddenStats;
    valorMinimo?: number;
    dinheiroMinimo?: number;
    flagNecessaria?: string;
    // B2 — exigência de padrão de comportamento acumulado (ex.: histórico de disciplina)
    condicaoComportamental?: CondicaoComportamental;
    // B4-FIX3 item 7 — o EVENTO pode ser elegível numa idade, mas uma opção
    // específica pode continuar incompatível (ex.: "tentar trabalhar" numa
    // faixa etária que já vai até a vida adulta). Sem isso, cada opção
    // herdava cegamente a janela inteira do evento. Ausente = sem restrição
    // adicional além da janela do evento.
    idadeMinima?: number;
    idadeMaxima?: number;
  };
}

// ---------------------------------------------------------------------------
// B4-FIX2 — taxonomia de repetição de eventos
//
// O playtest humano confirmou eventos reaparecendo sem controle (mesmo
// título, mesma consequência, em anos próximos). A causa raiz: só existia
// `unico?: boolean` — qualquer evento sem essa marca podia ser sorteado
// livremente, ano após ano, sem nenhum intervalo mínimo. `repeticao` é a
// política explícita e coerente; `unico` continua funcionando (mapeado para
// 'unica') para não exigir reescrever eventos que já estavam corretos.
//
// - unica: uma vez na vida inteira (ex.: primeiros passos).
// - cooldown: pode repetir, mas só depois de um intervalo mínimo de idade.
// - recorrente: pode repetir com frequência, mas nunca em anos consecutivos
//   (cooldown mínimo sistêmico de 1 ano já evita a repetição "porta ao
//   lado" mesmo em eventos não auditados individualmente).
// - marco: ligado a uma transição específica da vida; não é sorteado de
//   novo depois de ocorrer (equivalente a 'unica', mas com significado
//   distinto: representa uma passagem, não um acontecimento aleatório).
// ---------------------------------------------------------------------------
export type PoliticaRepeticao = 'unica' | 'cooldown' | 'recorrente' | 'marco';

export interface RepeticaoEvento {
  tipo: PoliticaRepeticao;
  /** Anos mínimos de idade entre duas ocorrências do mesmo id (cooldown/recorrente). */
  cooldownAnos?: number;
}

// ---------------------------------------------------------------------------
// B4-FIX4 — natureza do evento: ACONTECIMENTO × DECISÃO
//
// "A vida acontece. Às vezes você decide." Até o B4-FIX3 o catálogo inteiro
// era decisão: qualquer evento sorteado abria um modal perguntando "o que
// você faz?", inclusive para um bebê de 1 ano diante do próprio reflexo no
// espelho. Isso transformava textura de vida em escolha artificial e fazia
// o jogo perguntar mais do que acontecer.
//
// - 'decisao'        : uma encruzilhada real. O jogador escolhe; a escolha
//                      move a personalidade (impactosComportamentais) e é
//                      registrada na memória de escolhas.
// - 'acontecimento'  : algo que acontece COM a pessoa. O motor resolve
//                      sozinho, sorteando um desfecho entre `opcoes` pelo
//                      `peso` de cada uma, narra na Linha da Vida e NÃO
//                      abre modal. Regra dura: um acontecimento NUNCA
//                      atribui traço comportamental ao jogador — ele não
//                      escolheu nada (ver `events/happenings`).
//
// Ausente = 'decisao', para que todo evento escrito antes deste PR continue
// se comportando exatamente como antes até ser classificado.
// ---------------------------------------------------------------------------
export type NaturezaEvento = 'decisao' | 'acontecimento';

// ---------------------------------------------------------------------------
// F3 — TAXONOMIA DE CONTEÚDO
//
// `NaturezaEvento` responde "o jogador escolhe ou não?". Essa pergunta é
// necessária e continua governando o motor, mas ela é grossa demais para
// duas distinções que a Fase 3 precisa fazer.
//
// PRIMEIRA: escolher NÃO é a mesma coisa que revelar caráter.
//
//   ESCOLHA COMPORTAMENTAL — expressa valor, atitude, intenção ou modo de
//   agir. Colar na prova, emprestar dinheiro a um amigo, devolver uma
//   carteira achada. É EVIDÊNCIA de como a pessoa age, e por isso pode
//   mover `impactosComportamentais`.
//
//   ESCOLHA BIOGRÁFICA — o jogador participa da construção da própria
//   história sem que isso constitua evidência comportamental. Qual foi a
//   primeira palavra; um gosto; um detalhe de memória. Responder "mamãe"
//   em vez de "bola" não torna ninguém mais empático nem mais corajoso.
//   Por padrão NÃO move personalidade — e a regra é imposta pelo motor,
//   não pela boa vontade de quem escreve o catálogo.
//
// Sem essa distinção, o caminho fácil seria supor que todo marco com
// escolha alimenta o `personalitySystem`, e a personalidade emergente
// passaria a ser diluída por escolhas que não dizem nada sobre a pessoa.
//
// SEGUNDA: um MARCO pode não ter escolha nenhuma. Os primeiros passos de
// uma criança de 1 ano são um marco garantido da vida dela e não são uma
// decisão de ninguém — nem do jogador, nem do bebê. O calendário precisa
// sustentar marco COM escolha e marco SEM escolha com a mesma naturalidade.
//
// Ausente = `acontecimento_puro` para acontecimentos e
// `decisao_comportamental` para decisões (o comportamento atual do jogo),
// para que nenhum evento mude de sentido antes de ser classificado.
// ---------------------------------------------------------------------------

export type TaxonomiaConteudo =
  /** A vida acontece; o motor resolve e narra. Nunca move personalidade. */
  | 'acontecimento_puro'
  /** Encruzilhada que revela valor/atitude. Move personalidade. */
  | 'decisao_comportamental'
  /**
   * O jogador define um detalhe da própria história. NÃO move personalidade:
   * participar da biografia não é demonstrar caráter.
   */
  | 'escolha_biografica'
  /** Marco de trajetória sem escolha: acontece e é testemunhado. */
  | 'marco_testemunhado';

/**
 * Esta classificação permite que o jogador escolha?
 *
 * Função de domínio (não de apresentação): o motor usa isto para decidir se
 * abre modal ou resolve sozinho.
 */
export function taxonomiaPermiteEscolha(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomia === 'decisao_comportamental' || taxonomia === 'escolha_biografica';
}

/**
 * Esta classificação pode mover a personalidade?
 *
 * Só uma responde sim. É o ponto único da Revisão 1 e o alvo estável do
 * teste que a protege: quem adicionar uma taxonomia nova no futuro precisa
 * passar por aqui e decidir conscientemente.
 */
export function taxonomiaMovePersonalidade(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomia === 'decisao_comportamental';
}

/**
 * Esta classificação consome o ORÇAMENTO DE DECISÃO CONTEXTUAL do ritmo?
 *
 * Terceira pergunta independente sobre uma interação, e a que faltava. As
 * outras duas já existiam: "permite escolher?" e "move personalidade?". Sem
 * esta, o `lifeRhythm` só sabia perguntar `natureza === 'decisao'` — e para
 * ele *A Primeira Palavra* aos 2 anos era indistinguível de uma encruzilhada
 * moral aos 15.
 *
 * O efeito medido do defeito: a escolha biográfica aos 2 anos consumia a
 * cota da faixa 3-5 (`tetoDecisoes: 1` numa janela de 5 anos), e as decisões
 * daquela faixa caíam de 6,7% para 0%. Um marco garantido apagava, por
 * efeito colateral, toda a agência dos três anos seguintes.
 *
 * A distinção é sistêmica, não cosmética:
 *
 *   - DECISÃO CONTEXTUAL/COMPORTAMENTAL — o jogador toma posição, assume
 *     risco, escolhe entre valores. É a categoria que não pode dominar o
 *     jogo, então é ela que tem orçamento, teto e fadiga.
 *   - ESCOLHA BIOGRÁFICA — o jogador participa da construção da própria
 *     história (qual foi a primeira palavra). É agência real e é registrada
 *     como tal, mas não é uma posição sobre nada: não gasta orçamento, não
 *     causa fadiga e nunca bloqueia uma decisão posterior.
 *
 * Ambas são agência. Elas apenas cumprem funções diferentes no sistema — e é
 * por isso que as métricas de agência as contam separadamente em vez de
 * somá-las num único número de "decisões".
 */
export function taxonomiaConsomeCotaDeDecisao(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomia === 'decisao_comportamental';
}

/**
 * Esta classificação INTERROMPE o jogador?
 *
 * Quarta e última pergunta do modelo de custo, e ela separa duas coisas que
 * o motor vinha tratando como uma só:
 *
 *   DENSIDADE BIOGRÁFICA — o quanto o ano pesa na história da pessoa.
 *   INTERRUPÇÃO/ATENÇÃO  — o quanto o ano exige do jogador agora, em cliques.
 *
 * *Primeiros Passos* é densidade máxima e interrupção zero: acontece, é
 * narrado, entra na Linha da Vida, e o jogador não precisa fazer nada. Uma
 * encruzilhada moral aos 15 é o oposto. Confundir as duas foi o que fez o
 * motor concluir que um marco importante deveria calar o ano inteiro.
 *
 * A regra que esta função sustenta: **um ano tem no máximo UMA interrupção**.
 * Dois conteúdos no mesmo ano não significam dois modais.
 */
export function taxonomiaInterrompe(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomiaPermiteEscolha(taxonomia);
}

/**
 * Depois deste conteúdo, o ano ainda comporta um acontecimento leve?
 *
 * A regressão que motivou esta função: a faixa 0-2 tem dois anos jogáveis e
 * ambos são ocupados por marcos garantidos (*Primeiros Passos* aos 1,
 * *A Primeira Palavra* aos 2). Como o motor tratava "houve marco" como
 * "o ano acabou", o sorteio nunca rodava ali e SETE acontecimentos de bebê
 * ficaram inalcançáveis por acidente — conteúdo morto sem intenção.
 *
 * A resposta não é uma exceção para bebês. O mesmo problema reaparece em
 * toda vida: formatura, casamento, nascimento, mudança, aposentadoria. Um
 * marco é um ponto alto da biografia, não um apagão do mundo ao redor — no
 * ano em que alguém dá os primeiros passos, a família também recebe visita.
 *
 * Por isso a composição é propriedade da TAXONOMIA:
 *
 *   - MARCO (testemunhado ou com escolha biográfica) — é um ponto da
 *     trajetória, não o acontecimento do ano. Comporta companhia.
 *   - ACONTECIMENTO PURO — já É o acontecimento do ano. Não se soma a outro,
 *     senão o ano vira uma lista.
 *   - DECISÃO CONTEXTUAL — gastou a interrupção e o orçamento. Fecha o ano.
 *
 * Isto NÃO garante que o acontecimento extra vá ocorrer: quem decide é o
 * ritmo, com a saturação e os tetos de sempre. Esta função só diz que a
 * porta não está trancada por definição.
 */
export function taxonomiaPermiteComposicao(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomia === 'marco_testemunhado' || taxonomia === 'escolha_biografica';
}

/** Uma ocorrência real de evento, registrada com idade e ano (para cooldown). */
export interface EventOccurrence {
  eventId: string;
  idade: number;
  ano: number;
  // B4-FIX3 item 4/16 — categoria do evento no momento em que ocorreu.
  // Permite ao sorteio (events/contextWeighting) enxergar se o histórico
  // recente está dominado por uma única categoria (ex.: só família) sem
  // precisar procurar o evento inteiro de volta em MASTER_EVENTS_LIST.
  // Opcional: ocorrências de saves anteriores a este campo simplesmente
  // não participam da ponderação por contexto (tratadas como neutras).
  categoria?: GameEvent['categoria'];
  // B4-FIX4 — natureza da ocorrência. É o que permite à camada de ritmo
  // (`systems/pacing/lifeRhythm`) medir fadiga de DECISÃO separadamente de
  // densidade de acontecimento: três acontecimentos seguidos são vida
  // acontecendo; três decisões seguidas são um questionário. Opcional:
  // ocorrências de saves anteriores são lidas como 'decisao' (o que elas
  // de fato eram naquele momento do jogo).
  natureza?: NaturezaEvento;
  /**
   * F3 — classificação da ocorrência (ver `TaxonomiaConteudo`).
   *
   * `natureza` diz se o jogador foi consultado; `taxonomia` diz o que aquela
   * consulta SIGNIFICA. A camada de ritmo precisa da segunda para não tratar
   * "qual foi sua primeira palavra?" como uma encruzilhada moral ao cobrar
   * orçamento de decisão.
   *
   * Opcional: ocorrências de saves anteriores caem na derivação por
   * `natureza` (ver `historicoDeRitmo`), que é exatamente o comportamento
   * que elas tinham quando foram gravadas.
   */
  taxonomia?: TaxonomiaConteudo;
}

export interface GameEvent {
  id: string;
  titulo: string;
  descricao: string;
  idadeMinima: number;
  idadeMaxima: number;
  // B4-FIX3 item 2/3 — quatro contextos novos para tirar a vida do
  // personagem de dentro de casa: hobby (interesse pessoal, sem ser
  // esporte nem escola), esporte (competição/atividade física),
  // comunidade (vizinhança, bairro, eventos coletivos fora da escola/
  // família) e tecnologia (internet/redes sociais, apropriado à idade).
  categoria:
    | 'infancia'
    | 'escola'
    | 'adolescencia'
    | 'familia'
    | 'amizade'
    | 'romance'
    | 'trabalho'
    | 'dinheiro'
    | 'saude'
    | 'cotidiano'
    | 'hobby'
    | 'esporte'
    | 'comunidade'
    | 'tecnologia';
  peso: number; // chance relativa
  /**
   * B4-FIX4 — acontecimento (o motor resolve e narra) ou decisão (o jogador
   * escolhe). Ausente = 'decisao'. Ver `NaturezaEvento`.
   */
  natureza?: NaturezaEvento;
  /**
   * F3 — classificação semântica auditada (ver `TaxonomiaConteudo`).
   *
   * Refina `natureza` sem substituí-la: é o que distingue uma escolha que
   * revela caráter de uma que só preenche a biografia. Ausente = derivada de
   * `natureza` (ver `classificacaoDoEvento` em `systems/events/taxonomia`),
   * de modo que evento não classificado se comporta exatamente como hoje.
   */
  taxonomia?: TaxonomiaConteudo;
  unico?: boolean; // apenas uma vez na vida (equivalente a repeticao: { tipo: 'unica' })
  /** Política explícita de repetição (B4-FIX2). Ausente = infere de `unico`, senão 'recorrente'. */
  repeticao?: RepeticaoEvento;
  condicoes?: {
    genero?: Gender;
    faseVida?: LifeStage;
    empregado?: boolean;
    emEscola?: boolean;
    emFaculdade?: boolean;
    temParceiro?: boolean;
    temFilhos?: boolean;
    dinheiroMinimo?: number;
    dinheiroMaximo?: number;
    flagsNecessarias?: string[];
    flagsProibidas?: string[];
    saudeMinima?: number;
    saudeMaxima?: number;
    // B2 — condições sobre personalidade/memória (todas devem ser atendidas)
    personalidade?: CondicaoComportamental[];
    // ---------------------------------------------------------------------
    // F4 — CONTEXTO DO MUNDO.
    //
    // Um evento cujo texto afirma que algo existe precisa poder EXIGIR que
    // aquilo exista. Antes da F4 este vocabulário tinha 14 predicados e
    // nenhum falava de pet, casa, carro, irmão, amigo ou dívida — por isso
    // o jogo narrava a ida do pet ao veterinário para quem nunca teve pet.
    //
    // Todos são DERIVADOS do estado (ver `systems/contexto/contextoDaVida`).
    // Nenhum campo novo é persistido e o save não muda de versão.
    //
    // Estes predicados respondem "o estado necessário existe?" — não
    // "o jogador pode fazer isso". Permissão continua sendo assunto de
    // plausibilidade/elegibilidade profissional (F1) e das regras etárias.
    // ---------------------------------------------------------------------
    /** Animal de estimação vivo na família. */
    temPet?: boolean;
    /** Parceria formalizada (esposo/esposa), mais estrita que `temParceiro`. */
    temConjuge?: boolean;
    /** Irmão ou irmã vivo. */
    temIrmaos?: boolean;
    /** Alguém do tipo amigo/amiga vivo. */
    temAmigos?: boolean;
    /** Possui ao menos um imóvel. */
    temImovel?: boolean;
    /** Possui ao menos um veículo. */
    temVeiculo?: boolean;
    /** Tem dívida em aberto (qualquer valor acima de zero). */
    temDivida?: boolean;
  };
  opcoes: EventOption[];
}

export interface Character {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Gender;
  idade: number;
  anoAtual: number;
  anoNascimento: number;
  cidade: string;
  estado: string;
  classeSocial: SocialClass;
  stats: VisibleStats;
  hiddenStats: HiddenStats;
  doencas: string[];
  flags: Record<string, boolean | number | string>;
  marcos: {
    idade: number;
    titulo: string;
    descricao: string;
  }[];
  // B4-FIX2 — personalização visual escolhida na criação da vida (tom de
  // pele, cabelo, olhos). Puramente cosmética: nunca lida por nenhum
  // sistema de jogo (economia, educação, eventos, personalidade). Opcional
  // para que saves anteriores a este PR continuem válidos — a ausência cai
  // no símbolo automático por fase de vida (fallback do B4-FIX1).
  aparencia?: AparenciaAvatar;
}

export interface GameState {
  // Versão do schema de save; migrações em systems/saveSystem.ts
  versao: number;
  personagem: Character | null;
  familia: FamilyMember[];
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  // B2 — personalidade emergente e memória de escolhas
  personalidade: PersonalityState;
  timeline: LifeLogEntry[];
  eventoAtivo: GameEvent | null;
  historicoEventosDisparados: string[];
  // B4-FIX2 — histórico rico (id + idade + ano) para cooldown/recorrência.
  // `historicoEventosDisparados` continua existindo (compatibilidade de save
  // e checagem de 'unica'); este campo é o que permite calcular intervalo
  // mínimo entre duas ocorrências do mesmo evento. Opcional: estados
  // construídos antes desta mudança (testes, saves antigos) continuam
  // válidos — ausência é tratada como "sem ocorrência anterior conhecida".
  historicoOcorrenciasEventos?: EventOccurrence[];
  // Ações únicas por ano (atividades, apostas, interações); zerada a cada passagem de ano
  acoesRealizadasAno: string[];
  /**
   * Consumo temporal persistente (Fase 2): tentativas de vestibular, processos
   * seletivos já disputados, concepções.
   *
   * Distinto de `acoesRealizadasAno`, que é zerado na virada do ano e serve a
   * limites de conveniência da interface. Este registro NÃO é zerado: cada uso
   * fica carimbado com o instante em que ocorreu, e é isso que impede que
   * recarregar o save devolva uma tentativa já gasta.
   *
   * Opcional: save anterior à Fase 2 é lido como "nada consumido".
   */
  registroTemporal?: { usos: Record<string, number[]> };
  /**
   * Calendário da Vida (Fase 3): marcos já cumpridos e compromissos
   * agendados para o futuro.
   *
   * Opcional porque saves até a v4 não o possuem. Ausência NÃO significa
   * "nenhum marco cumprido": significa "esta vida é anterior ao calendário",
   * e a migração fecha os marcos cujas janelas já passaram em vez de
   * ressuscitá-los (ver `saveSystem.calendarioDoSave`).
   */
  calendario?: {
    // Espelha `CompromissoAgendado` de `systems/calendario/tipos`. A forma é
    // repetida aqui, e não importada, porque aquele módulo importa `types`:
    // importar de volta criaria o ciclo que a Fase 1 gastou tempo quebrando.
    // O typecheck garante que as duas não divirjam — se `CompromissoAgendado`
    // mudar, a atribuição em `saveSystem` para de compilar.
    readonly compromissos: readonly {
      readonly id: string;
      readonly tipo: string;
      readonly alvoId?: string;
      readonly agendadoEm: number;
      readonly venceEm: number;
      readonly expiraEm?: number;
      readonly cumpridoEm?: number;
      readonly dados?: Readonly<Record<string, string | number | boolean>>;
    }[];
    readonly marcosCumpridos: Readonly<Record<string, number>>;
  };
  emJogo: boolean;
  morto: boolean;
  resumoMorte?: PostMortemSummary;
}

export interface PostMortemSummary {
  nomeCompleto: string;
  idadeMorte: number;
  anoNascimento: number;
  anoMorte: number;
  cidade: string;
  estado: string;
  causaMorte: string;
  patrimonioFinal: number;
  dinheiroTotalAcumulado: number;
  profissaoFinal: string;
  nivelEducacao: string;
  quantidadeFilhos: number;
  quantidadeParceiros: number;
  principaisConquistas: string[];
  epitafio: string;
  biografiaResumo: string;
  statsFinais: VisibleStats;
  pontuacaoVida: number;
}

export interface PastLifeRecord {
  id: string;
  nome: string;
  idadeMorte: number;
  cidade: string;
  estado: string;
  profissao: string;
  patrimonio: number;
  pontuacao: number;
  anoJogo: string;
  causaMorte: string;
}

export interface GlobalStats {
  vidasJogadas: number;
  totalAnosVividos: number;
  maiorIdade: number;
  maiorPatrimonio: number;
  totalFilhos: number;
  historicoVidas: PastLifeRecord[];
}
