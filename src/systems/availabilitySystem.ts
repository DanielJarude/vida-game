// Política CENTRAL de elegibilidade por idade e estado do VIDA.
// A UI consulta esta política para exibir/ocultar ações; o motor revalida
// as mesmas regras antes de aplicar efeitos. Ocultar um botão não é proteção.
//
// Estados possíveis (SKILL_AGE_PROGRESSION):
//  - oculto:     a ação não faz sentido na fase atual (não aparece em menu algum; motor recusa)
//  - bloqueado:  faz sentido conhecer, mas falta requisito (aparece com motivo; motor recusa)
//  - disponivel: pode ser executada (motor revalida antes de aplicar efeitos)

import {
  CareerState,
  Character,
  EconomyState,
  EducationLevel,
  EducationState,
  FamilyInteractionType,
  FamilyMember,
  Job,
  PosturaEscolar
} from '../types';
import { ActivityOption, ATIVIDADES_DISPONIVEIS } from '../data/activitiesData';
import { BICOS_DISPONIVEIS, FreelanceOption, TODAS_PROFISSOES } from '../data/careersData';
import { CURSOS_DISPONIVEIS } from '../data/coursesData';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../data/assetsData';
import { formatarDinheiro, getEducationLabel } from '../utils/formatters';
import {
  avaliarCapacidadeInteracao,
  deveOferecerInteracao
} from './interactionCapabilitySystem';
// Fatos-base de trabalho/escolaridade vivem em `politicaTrabalho` (módulo sem
// dependências) e são REEXPORTADOS aqui: este arquivo segue sendo o ponto de
// entrada único da política para todo o resto do jogo.
export {
  HIERARQUIA_EDUCACAO,
  IDADE_MAXIMA_JOVEM_APRENDIZ,
  IDADE_MINIMA_EMPREGO_ADULTO,
  IDADE_MINIMA_TRABALHO_JUVENIL,
  nivelEscolaridade,
  obterJanelaIdadeEmprego
} from './politicaTrabalho';
import { nivelEscolaridade, obterJanelaIdadeEmprego } from './politicaTrabalho';
import {
  avaliarElegibilidadeProfissional,
  podeSeCandidatar
} from './plausibility/elegibilidadeProfissional';
import { podeTentar, type Veredito } from './plausibility/types';

// ---------------------------------------------------------------------------
// Constantes de política — fonte única de verdade para UI e motor
// ---------------------------------------------------------------------------

export const IDADE_MINIMA_COMPRA_BENS = 18;
export const IDADE_MINIMA_NEGOCIAR_BENS = 18;
export const IDADE_MINIMA_INVESTIMENTOS = 18;
export const IDADE_MINIMA_LOTERIA = 18;
export const IDADE_MINIMA_BICOS = 18;
export const IDADE_MINIMA_FACULDADE = 18;
export const IDADE_MINIMA_RELACIONAMENTO_ADULTO = 18;
export const IDADE_MINIMA_CASAMENTO = 18;
export const IDADE_MINIMA_FILHOS = 18;
export const IDADE_MINIMA_PEDIR_DINHEIRO = 6;
export const IDADE_MINIMA_PEDIR_CONSELHO = 6;
export const IDADE_MINIMA_ESCOLA = 6;

/** Distância (em anos) até o desbloqueio que justifica uma prévia "bloqueada" com motivo. */
export const DISTANCIA_PREVIA_ATIVIDADE = 2;



// ---------------------------------------------------------------------------
// Contrato de disponibilidade
// ---------------------------------------------------------------------------

export type Disponibilidade =
  | { kind: 'oculto'; reasonCode: string }
  | { kind: 'bloqueado'; reasonCode: string; motivo: string }
  | { kind: 'disponivel' };

export interface ContextoAcao {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  familia: FamilyMember[];
  acoesRealizadasAno?: string[];
}

export interface ParametrosAcao {
  itemId?: string;                       // comprar_bem / investir / resgatar_investimento
  propId?: string;                       // vender_bem
  jobId?: string;                        // candidatar_emprego
  bicoId?: string;                       // fazer_bico
  cursoId?: string;                      // ingressar_curso
  atividadeId?: string;                  // executar_atividade
  postura?: PosturaEscolar;              // definir_postura_escolar
  membroId?: string;                     // interagir_familia / pedir_casamento / terminar_relacionamento / ter_filho
  tipoInteracao?: FamilyInteractionType; // interagir_familia
}

export type ActionId =
  | 'comprar_bem'
  | 'vender_bem'
  | 'investir'
  | 'resgatar_investimento'
  | 'jogar_loteria'
  | 'candidatar_emprego'
  | 'trabalhar_mais'
  | 'pedir_aumento'
  | 'pedir_demissao'
  | 'fazer_bico'
  | 'ingressar_curso'
  | 'definir_postura_escolar'
  | 'iniciar_namoro'
  | 'pedir_casamento'
  | 'ter_filho'
  | 'terminar_relacionamento'
  | 'executar_atividade'
  | 'interagir_familia';

const OCULTO = (reasonCode: string): Disponibilidade => ({ kind: 'oculto', reasonCode });
const BLOQUEADO = (reasonCode: string, motivo: string): Disponibilidade => ({ kind: 'bloqueado', reasonCode, motivo });
const DISPONIVEL: Disponibilidade = { kind: 'disponivel' };

const TIPOS_PARCEIRO = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];

function jaRealizada(ctx: ContextoAcao, idAcao: string): boolean {
  return (ctx.acoesRealizadasAno ?? []).includes(idAcao);
}

function motivoEscolaridadeInsuficiente(nivelExigido: EducationLevel): string {
  return `Você precisa concluir ${getEducationLabel(nivelExigido).replace('Ensino ', 'o Ensino ')}.`;
}

function avaliarRequisitoBico(bico: FreelanceOption, ctx: ContextoAcao): Disponibilidade | null {
  if (!bico.requisito) return null;
  if (bico.requisito === 'veiculo') {
    const temVeiculo = ctx.economia.propriedades.some(p => p.tipo === 'veiculo');
    if (!temVeiculo) {
      return BLOQUEADO('requisito_bico', 'Você precisa possuir um veículo para este bico.');
    }
    return null;
  }
  const nivelExigido = bico.requisito as EducationLevel;
  if (nivelEscolaridade(ctx.educacao.nivelAtual) < nivelEscolaridade(nivelExigido)) {
    return BLOQUEADO('requisito_bico', motivoEscolaridadeInsuficiente(nivelExigido));
  }
  return null;
}

/**
 * Consulta pura: não altera estado, não sorteia resultados.
 * Retorna a disponibilidade da ação para o estado atual.
 */
export function getActionAvailability(
  ctx: ContextoAcao,
  actionId: ActionId,
  params: ParametrosAcao = {}
): Disponibilidade {
  const { personagem, educacao, carreira, economia, familia } = ctx;
  const idade = personagem.idade;

  switch (actionId) {
    case 'comprar_bem': {
      if (idade < IDADE_MINIMA_COMPRA_BENS) {
        if (IDADE_MINIMA_COMPRA_BENS - idade <= 1) {
          return BLOQUEADO('idade_minima', `Compras de imóveis e veículos estão disponíveis aos ${IDADE_MINIMA_COMPRA_BENS} anos.`);
        }
        return OCULTO('acao_adulta');
      }
      const item = [...IMOVEIS_LOJA, ...VEICULOS_LOJA].find(i => i.id === params.itemId);
      if (!item) return BLOQUEADO('item_invalido', 'Item não encontrado na loja.');
      if (economia.dinheiro < item.preco) {
        return BLOQUEADO('saldo_insuficiente', `Saldo insuficiente: ${formatarDinheiro(item.preco)}.`);
      }
      return DISPONIVEL;
    }

    case 'vender_bem': {
      const prop = economia.propriedades.find(p => p.id === params.propId);
      if (!prop) return BLOQUEADO('item_invalido', 'Item não encontrado em seu patrimônio.');
      // Possuir não é poder agir: menor pode manter patrimônio legítimo, mas não negociá-lo.
      if (idade < IDADE_MINIMA_NEGOCIAR_BENS) {
        return BLOQUEADO('idade_minima', 'Você precisa ser maior de idade para negociar bens.');
      }
      return DISPONIVEL;
    }

    case 'investir': {
      if (idade < IDADE_MINIMA_INVESTIMENTOS) return OCULTO('acao_adulta');
      return DISPONIVEL;
    }

    case 'resgatar_investimento': {
      if (idade < IDADE_MINIMA_INVESTIMENTOS) return OCULTO('acao_adulta');
      const inv = economia.investimentos.find(i => i.tipo === params.itemId);
      if (!inv) return BLOQUEADO('item_invalido', 'Investimento não encontrado.');
      return DISPONIVEL;
    }

    case 'jogar_loteria': {
      if (idade < IDADE_MINIMA_LOTERIA) return OCULTO('acao_adulta');
      if (jaRealizada(ctx, 'loteria_mega_sena')) {
        return BLOQUEADO('repeticao_anual', 'Você já apostou na Mega-Sena neste ano.');
      }
      if (economia.dinheiro < 15) {
        return BLOQUEADO('saldo_insuficiente', 'Você precisa de R$ 15 para apostar.');
      }
      return DISPONIVEL;
    }

    case 'candidatar_emprego': {
      const job = TODAS_PROFISSOES.find(j => j.id === params.jobId);
      if (!job) return BLOQUEADO('item_invalido', 'Vaga não encontrada.');

      // A vaga distante da fase da vida continua OCULTA (não polui a tela de
      // uma criança com vagas adultas); o resto é delegado à regra única de
      // elegibilidade, a mesma que o motor revalida na contratação.
      const janela = obterJanelaIdadeEmprego(job.id);
      if (idade < janela.minima && janela.minima - idade > 1) {
        return OCULTO('acao_adulta');
      }

      const veredito = avaliarElegibilidadeProfissional(job, { personagem, educacao, carreira });
      if (podeTentar(veredito)) return DISPONIVEL;

      const faltante = veredito.requisitosFaltantes[0];
      return BLOQUEADO(
        faltante?.codigo ?? 'requisito_nao_atendido',
        veredito.motivo ?? 'Você ainda não reúne os requisitos desta vaga.'
      );
    }

    case 'trabalhar_mais': {
      if (!carreira.empregado || !carreira.cargoAtual) return OCULTO('sem_emprego');
      if (carreira.horasExtras) {
        return BLOQUEADO('repeticao_anual', 'Você já se comprometeu com horas extras neste ano.');
      }
      return DISPONIVEL;
    }

    case 'pedir_aumento': {
      if (!carreira.empregado || !carreira.cargoAtual) return OCULTO('sem_emprego');
      if (jaRealizada(ctx, 'pedir_aumento')) {
        return BLOQUEADO('repeticao_anual', 'Você já pediu aumento neste ano.');
      }
      return DISPONIVEL;
    }

    case 'pedir_demissao': {
      if (!carreira.empregado) return OCULTO('sem_emprego');
      return DISPONIVEL;
    }

    case 'fazer_bico': {
      if (idade < IDADE_MINIMA_BICOS) return OCULTO('acao_adulta');
      const bico = BICOS_DISPONIVEIS.find(b => b.id === params.bicoId);
      if (!bico) return BLOQUEADO('item_invalido', 'Bico não encontrado.');
      const requisito = avaliarRequisitoBico(bico, ctx);
      if (requisito) return requisito;
      if (carreira.bicoAtivoId) {
        return BLOQUEADO('repeticao_anual', 'Você já tem um bico escolhido para este ano.');
      }
      return DISPONIVEL;
    }

    case 'ingressar_curso': {
      if (educacao.emCurso) {
        return BLOQUEADO('ja_matriculado', 'Você já está matriculado em um curso.');
      }
      const curso = CURSOS_DISPONIVEIS.find(c => c.id === params.cursoId);
      const nivelNecessario: EducationLevel =
        curso && curso.tipo === 'pos' ? 'superior_completo' : 'medio_completo';
      if (idade < IDADE_MINIMA_FACULDADE) {
        if (idade >= IDADE_MINIMA_FACULDADE - 1 && nivelEscolaridade(educacao.nivelAtual) >= nivelEscolaridade(nivelNecessario)) {
          return BLOQUEADO('idade_minima', `O vestibular e a faculdade abrem aos ${IDADE_MINIMA_FACULDADE} anos.`);
        }
        return OCULTO('acao_adulta');
      }
      if (nivelEscolaridade(educacao.nivelAtual) < nivelEscolaridade(nivelNecessario)) {
        return BLOQUEADO('escolaridade_insuficiente', motivoEscolaridadeInsuficiente(nivelNecessario));
      }
      return DISPONIVEL;
    }

    case 'definir_postura_escolar': {
      if (!educacao.emCurso) return OCULTO('fora_da_escola');
      if (educacao.posturaAno) {
        return BLOQUEADO('repeticao_anual', 'Você já definiu sua postura para este ano.');
      }
      return DISPONIVEL;
    }

    case 'iniciar_namoro': {
      // Sistema adulto de relacionamentos. Romance adolescente (12–17) não é
      // modelado neste ciclo; registrar como pendência, não abrir o sistema.
      if (idade < IDADE_MINIMA_RELACIONAMENTO_ADULTO) return OCULTO('acao_adulta');
      return DISPONIVEL;
    }

    case 'pedir_casamento': {
      if (idade < IDADE_MINIMA_CASAMENTO) return OCULTO('acao_adulta');
      const membro = familia.find(f => f.id === params.membroId);
      if (!membro || !TIPOS_PARCEIRO.includes(membro.tipo)) {
        return BLOQUEADO('sem_parceiro', 'Você precisa de um parceiro romântico para isso.');
      }
      return DISPONIVEL;
    }

    case 'ter_filho': {
      if (idade < IDADE_MINIMA_FILHOS) return OCULTO('acao_adulta');
      const membro = params.membroId ? familia.find(f => f.id === params.membroId) : undefined;
      if (!membro || !membro.vivo || !TIPOS_PARCEIRO.includes(membro.tipo)) {
        return OCULTO('sem_parceiro');
      }
      return DISPONIVEL;
    }

    case 'terminar_relacionamento': {
      const membro = familia.find(f => f.id === params.membroId);
      if (!membro || !TIPOS_PARCEIRO.includes(membro.tipo)) return OCULTO('sem_parceiro');
      return DISPONIVEL;
    }

    case 'executar_atividade': {
      const atividade = ATIVIDADES_DISPONIVEIS.find(a => a.id === params.atividadeId);
      if (!atividade) return BLOQUEADO('item_invalido', 'Atividade não encontrada.');
      if (idade < atividade.idadeMinima) {
        if (atividade.idadeMinima - idade <= DISTANCIA_PREVIA_ATIVIDADE) {
          return BLOQUEADO('idade_minima', `Disponível aos ${atividade.idadeMinima} anos.`);
        }
        return OCULTO('idade_minima');
      }
      if (jaRealizada(ctx, `atividade:${atividade.id}`)) {
        return BLOQUEADO('repeticao_anual', 'Você já realizou esta atividade neste ano.');
      }
      if (atividade.custo > 0 && economia.dinheiro < atividade.custo) {
        return BLOQUEADO('saldo_insuficiente', `Saldo insuficiente (custa ${formatarDinheiro(atividade.custo)}).`);
      }
      return DISPONIVEL;
    }

    case 'interagir_familia': {
      const membro = familia.find(f => f.id === params.membroId);
      if (!membro) return BLOQUEADO('item_invalido', 'Familiar não encontrado.');
      const tipo = params.tipoInteracao;
      if (!tipo) return BLOQUEADO('item_invalido', 'Interação inválida.');
      const ehPet = membro.tipo === 'pet';
      if (!ehPet && tipo === 'pedir_dinheiro' && idade < IDADE_MINIMA_PEDIR_DINHEIRO) {
        return OCULTO('idade_minima');
      }
      if (!ehPet && tipo === 'pedir_conselho' && idade < IDADE_MINIMA_PEDIR_CONSELHO) {
        return OCULTO('idade_minima');
      }
      // Capacidade por idade: um bebê não conversa, não discute e não
      // presenteia. Um pet não faz nenhuma dessas três em nenhuma idade —
      // o vínculo com ele é carinho, alimentação e passeio. Regra única em
      // `interactionCapabilitySystem`, revalidada pelo motor — esconder o
      // botão não é a proteção.
      if (!deveOferecerInteracao(tipo, idade, ehPet)) {
        return OCULTO('idade_minima');
      }
      const capacidade = avaliarCapacidadeInteracao(tipo, idade, ehPet);
      if (!capacidade.permitido) {
        return BLOQUEADO('idade_minima', capacidade.motivo);
      }
      if (jaRealizada(ctx, `familia:${membro.id}:${tipo}`)) {
        return BLOQUEADO('repeticao_anual', `Você já fez isto com ${membro.nome} neste ano.`);
      }
      if (tipo === 'dar_presente' && membro) {
        // custos conferidos pelo motor antes de debitar
        return DISPONIVEL;
      }
      return DISPONIVEL;
    }

    default:
      return OCULTO('acao_desconhecida');
  }
}

// ---------------------------------------------------------------------------
// Derivações para a interface contextual (a UI nunca inventa regras próprias)
// ---------------------------------------------------------------------------

export type TabId = 'timeline' | 'familia' | 'carreira' | 'financas' | 'atividades';

/** Abas visíveis para a fase atual. Categorias sem relevância ficam ocultas. */
export function getAbasDisponiveis(ctx: ContextoAcao): TabId[] {
  const abas: TabId[] = ['timeline', 'familia'];
  const idade = ctx.personagem.idade;

  // Escola começa aos 6; a aba de estudos só faz sentido a partir daí
  if (idade >= IDADE_MINIMA_ESCOLA || ctx.educacao.emCurso || ctx.carreira.empregado) {
    abas.push('carreira');
  }

  // Finanças: adulto, ou menor que já possui patrimônio legítimo (leitura)
  const temPatrimonio = ctx.economia.propriedades.length > 0 || ctx.economia.investimentos.length > 0;
  if (idade >= IDADE_MINIMA_INVESTIMENTOS || temPatrimonio) {
    abas.push('financas');
  }

  abas.push('atividades');
  return abas;
}

export interface AtividadeComDisponibilidade {
  atividade: ActivityOption;
  disponibilidade: Disponibilidade;
}

/** Atividades visíveis por categoria (ocultas são filtradas; categorias vazias desaparecem). */
export function getAtividadesVisiveis(ctx: ContextoAcao): {
  categoria: ActivityOption['categoria'];
  itens: AtividadeComDisponibilidade[];
}[] {
  const categorias: ActivityOption['categoria'][] = ['saude', 'lazer', 'social', 'desenvolvimento'];
  return categorias
    .map(categoria => {
      const itens = ATIVIDADES_DISPONIVEIS.filter(a => a.categoria === categoria)
        .map(atividade => ({
          atividade,
          disponibilidade: getActionAvailability(ctx, 'executar_atividade', { atividadeId: atividade.id })
        }))
        .filter(item => item.disponibilidade.kind !== 'oculto');
      return { categoria, itens };
    })
    .filter(grupo => grupo.itens.length > 0);
}

/** Vagas compatíveis com escolaridade, inteligência e idade (mercado de trabalho). */
/**
 * Vagas às quais o personagem pode SE CANDIDATAR agora.
 *
 * Usa exatamente a mesma regra que o motor aplica na contratação — esconder
 * uma vaga aqui nunca foi a proteção, e agora as duas pontas consultam a
 * mesma função. Inclui vagas de grau `improvavel`: candidatura arriscada é
 * uma escolha legítima do jogador, e é ela que mantém as histórias
 * improváveis possíveis.
 */
export function listarVagasCompativeis(ctx: ContextoAcao): Job[] {
  const { personagem, educacao, carreira } = ctx;
  return TODAS_PROFISSOES.filter(job =>
    podeSeCandidatar(job, { personagem, educacao, carreira })
  );
}

/**
 * Vagas com o veredito completo — para a interface poder mostrar o que falta
 * em vez de apenas omitir a vaga. Não é usada pelo motor.
 */
export function listarVagasComVeredito(
  ctx: ContextoAcao
): { job: Job; veredito: Veredito }[] {
  const { personagem, educacao, carreira } = ctx;
  return TODAS_PROFISSOES.map(job => ({
    job,
    veredito: avaliarElegibilidadeProfissional(job, { personagem, educacao, carreira })
  }));
}

/** Bicos visíveis para o estado atual (adultos, requisito atendido ou com motivo). */
export function getBicosVisiveis(ctx: ContextoAcao): { bico: FreelanceOption; disponibilidade: Disponibilidade }[] {
  return BICOS_DISPONIVEIS.map(bico => ({
    bico,
    disponibilidade: getActionAvailability(ctx, 'fazer_bico', { bicoId: bico.id })
  })).filter(item => item.disponibilidade.kind !== 'oculto');
}

/** Situação atual coerente com a fase da vida (nunca "Sem ocupação formal" para um bebê). */
export function descreverSituacaoAtual(ctx: ContextoAcao): string {
  const { personagem, educacao, carreira } = ctx;
  const idade = personagem.idade;

  if (carreira.aposentado) return 'Aposentado(a)';
  if (carreira.empregado && carreira.cargoAtual) return carreira.cargoAtual.titulo;
  if (idade <= 2) return 'Bebê — vive com os pais';
  if (idade <= 5) return 'Criança pequena — vive com os pais';
  if (idade <= 17) {
    if (educacao.emCurso) return `Estudante — ${educacao.nomeCurso || 'escola'}`;
    if (educacao.nivelAtual === 'medio_completo') return 'Concluiu o Ensino Médio';
    return 'Vive com os pais';
  }
  if (educacao.emCurso) return `Estudante — ${educacao.nomeCurso || 'curso'}`;
  return 'Desempregado(a)';
}

/** Fase da vida segundo a matriz de design (para apresentação contextual). */
export function getFaseVidaDesign(idade: number): string {
  if (idade <= 2) return 'bebê';
  if (idade <= 5) return 'primeira infância';
  if (idade <= 11) return 'infância';
  if (idade <= 15) return 'adolescência inicial';
  if (idade <= 17) return 'adolescência final';
  if (idade <= 29) return 'jovem adulto';
  if (idade <= 59) return 'adulto';
  return 'terceira idade';
}
