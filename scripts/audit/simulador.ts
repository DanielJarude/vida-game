/**
 * AUDITORIA DE COERÊNCIA HUMANA — simulador de vidas completas.
 *
 * DIAGNÓSTICO TEMPORÁRIO. Não faz parte do jogo nem da suíte de testes.
 * Roda o PIPELINE REAL (`executarPassagemDeAno`, `aplicarConsequenciasEscolha`,
 * `candidatarEmprego`, `ingressarCurso`, `iniciarNamoro`, `terFilho`,
 * `comprarBem`, ...) — exatamente as funções que `useGame` chama — sob uma
 * fonte de aleatoriedade determinística, com PERFIS de comportamento
 * diferentes, e grava:
 *
 *  - a trajetória completa de cada vida (biografia cronológica legível);
 *  - um razão financeiro linha a linha (de onde veio cada real);
 *  - métricas agregadas por idade/década;
 *  - violações de coerência detectadas automaticamente.
 */

import {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  EventOccurrence,
  FamilyMember,
  Gender,
  LifeLogEntry,
  PersonalityState,
  SocialClass,
  TaxonomiaConteudo
} from '../../src/types';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../src/utils/random';
import { executarPassagemDeAno } from '../../src/systems/agingSystem';
import { aplicarConsequenciasEscolha } from '../../src/systems/eventSystem';
import { criarPersonalidadeInicial } from '../../src/systems/personalitySystem';
import { classificacaoDoEvento } from '../../src/systems/events/taxonomia';
import { criarCalendarioInicial } from '../../src/systems/calendario/tipos';
import { criarEducacaoInicial, definirPosturaEscolar, ingressarCurso } from '../../src/systems/educationSystem';
import { candidatarEmprego, criarCarreiraInicial, escolherBico, pedirAumento, trabalharMais } from '../../src/systems/careerSystem';
import { criarRegistroTemporal, type RegistroTemporal } from '../../src/systems/tempo/registroTemporal';
import { calcularPatrimonioLiquido, comprarBem, criarEconomiaInicial, jogarMegaSena } from '../../src/systems/economySystem';
import { gerarFamiliaInicial } from '../../src/systems/familySystem';
import { gerarCandidatosNamoro, iniciarNamoro, pedirEmCasamento, terFilho } from '../../src/systems/relationshipSystem';
import { getActionAvailability, listarVagasCompativeis } from '../../src/systems/availabilitySystem';
import { CURSOS_DISPONIVEIS } from '../../src/data/coursesData';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../../src/data/assetsData';
import { ATIVIDADES_DISPONIVEIS } from '../../src/data/activitiesData';
import { calcularEfeitoAtividade } from '../../src/systems/activitySystem';
import { MUNICIPIOS_BRASILEIROS } from '../../src/data/locations/municipios';
import { generateId, clamp } from '../../src/utils/random';

export type Perfil =
  | 'estudioso'
  | 'social'
  | 'trabalho'
  | 'passivo'
  | 'arriscado'
  | 'conservador'
  | 'aleatorio';

export const PERFIS: Perfil[] = [
  'estudioso', 'social', 'trabalho', 'passivo', 'arriscado', 'conservador', 'aleatorio'
];

export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LancamentoFinanceiro {
  idade: number;
  ano: number;
  descricao: string;
  delta: number;
  saldoDepois: number;
}

export interface AnoDaVida {
  idade: number;
  ano: number;
  pulso: string;
  motivoRitmo: string;
  logs: { categoria: string; texto: string; tipo?: string; relevancia?: string }[];
  eventoDecisao?: { id: string; titulo: string; opcaoEscolhida: string; taxonomia: TaxonomiaConteudo };
  acontecimento?: { id: string; titulo: string };
  /**
   * F3-FIX — ids de TODAS as ocorrências do ano, na ordem. Um ano de marco
   * pode trazer um acontecimento leve junto, e as auditorias de cobertura e
   * de composição precisam enxergar os dois.
   */
  ocorrenciasDoAno: string[];
  /**
   * F4 — estado do mundo no instante em que o ano foi resolvido. Permite
   * medir se um evento ocorreu pressupondo algo que a vida não tinha.
   */
  contexto?: {
    temPet: boolean; temImovel: boolean; temVeiculo: boolean; temAmigo: boolean;
    emEscola: boolean; empregado: boolean; estudouAlgumaVez: boolean;
  };
  acoesVoluntarias: string[];
  saldo: number;
  dividas: number;
  patrimonio: number;
  escolaridade: string;
  emCurso?: string;
  semestre?: number;
  totalSemestres?: number;
  cargo?: string;
  salarioMensal?: number;
  anosNoCargo: number;
  saude: number;
  familia: { tipo: string; nome: string; idade: number; vivo: boolean }[];
}

export interface Violacao {
  codigo: string;
  idade: number;
  detalhe: string;
}

export interface ResultadoVida {
  seed: number;
  perfil: Perfil;
  nome: string;
  cidade: string;
  estado: string;
  classeSocial: SocialClass;
  genero: Gender;
  anos: AnoDaVida[];
  razao: LancamentoFinanceiro[];
  violacoes: Violacao[];
  idadeFinal: number;
  causaMorte?: string;
  decisoesTotais: number;
  acontecimentosTotais: number;
  anosSilenciosos: number;
  /**
   * Auditoria pós-playtest — quem restou na vida no fim. Necessário para medir
   * vida social (Achado 6): o estado final é a única fonte de quantas pessoas
   * não-familiares a vida acumulou.
   */
  familiaFinal: FamilyMember[];
}

interface Ctx {
  personagem: Character;
  familia: FamilyMember[];
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  personalidade: PersonalityState;
  // Fase 2 — consumo temporal persistente (vestibular, processos seletivos,
  // concepções). Acompanha a vida inteira; não é zerado na virada do ano.
  registroTemporal: RegistroTemporal;
}

/** Perfis: com que frequência o perfil age voluntariamente em cada domínio. */
const POLITICA: Record<Perfil, {
  estudar: number; curso: number; emprego: number; horasExtras: number;
  bico: number; namoro: number; filho: number; comprar: number;
  atividade: number; loteria: number; aumento: number;
}> = {
  estudioso:    { estudar: 0.95, curso: 0.9, emprego: 0.4, horasExtras: 0.2, bico: 0.3, namoro: 0.3, filho: 0.2, comprar: 0.2, atividade: 0.4, loteria: 0.0, aumento: 0.3 },
  social:       { estudar: 0.3,  curso: 0.4, emprego: 0.5, horasExtras: 0.1, bico: 0.3, namoro: 0.9, filho: 0.7, comprar: 0.4, atividade: 0.8, loteria: 0.1, aumento: 0.3 },
  trabalho:     { estudar: 0.5,  curso: 0.5, emprego: 0.95, horasExtras: 0.9, bico: 0.7, namoro: 0.3, filho: 0.3, comprar: 0.5, atividade: 0.2, loteria: 0.0, aumento: 0.9 },
  passivo:      { estudar: 0.05, curso: 0.05, emprego: 0.1, horasExtras: 0.0, bico: 0.05, namoro: 0.05, filho: 0.05, comprar: 0.02, atividade: 0.05, loteria: 0.0, aumento: 0.05 },
  arriscado:    { estudar: 0.2,  curso: 0.3, emprego: 0.6, horasExtras: 0.4, bico: 0.6, namoro: 0.7, filho: 0.6, comprar: 0.8, atividade: 0.6, loteria: 0.9, aumento: 0.6 },
  conservador:  { estudar: 0.7,  curso: 0.6, emprego: 0.8, horasExtras: 0.4, bico: 0.5, namoro: 0.5, filho: 0.5, comprar: 0.05, atividade: 0.3, loteria: 0.0, aumento: 0.4 },
  aleatorio:    { estudar: 0.5,  curso: 0.5, emprego: 0.5, horasExtras: 0.5, bico: 0.5, namoro: 0.5, filho: 0.5, comprar: 0.5, atividade: 0.5, loteria: 0.5, aumento: 0.5 }
};

export function simularVida(seed: number, perfil: Perfil, idadeMaxima = 100): ResultadoVida {
  const rng = mulberry32(seed);
  definirFonteAleatoria(rng);
  const chance = (p: number) => rng() < p;
  const pol = POLITICA[perfil];

  const municipio = MUNICIPIOS_BRASILEIROS[Math.floor(rng() * MUNICIPIOS_BRASILEIROS.length)];
  const classes: SocialClass[] = ['vulneravel', 'trabalhadora', 'classe_media_baixa', 'classe_media', 'classe_alta'];
  const classeSocial = classes[Math.floor(rng() * classes.length)];
  const genero: Gender = rng() > 0.5 ? 'masculino' : 'feminino';

  const ctx: Ctx = {
    personagem: {
      id: generateId('char'),
      nome: `Sim${seed}`,
      sobrenome: 'Silva',
      genero,
      idade: 0,
      anoAtual: 2026,
      anoNascimento: 2026,
      cidade: municipio.cidade,
      estado: municipio.estado,
      classeSocial,
      stats: {
        felicidade: 70 + Math.floor(rng() * 25),
        saude: 75 + Math.floor(rng() * 20),
        inteligencia: 40 + Math.floor(rng() * 45),
        aparencia: 40 + Math.floor(rng() * 50)
      },
      hiddenStats: {
        disciplina: 35 + Math.floor(rng() * 40),
        sociabilidade: 40 + Math.floor(rng() * 40),
        empatia: 45 + Math.floor(rng() * 40),
        ambicao: 35 + Math.floor(rng() * 45),
        estresse: 5 + Math.floor(rng() * 15),
        reputacao: 50,
        condicionamentoFisico: 40 + Math.floor(rng() * 35)
      },
      doencas: [],
      flags: {},
      marcos: []
    },
    familia: gerarFamiliaInicial('Silva', classeSocial),
    educacao: criarEducacaoInicial(),
    carreira: criarCarreiraInicial(),
    economia: criarEconomiaInicial(classeSocial),
    personalidade: criarPersonalidadeInicial(),
    registroTemporal: criarRegistroTemporal()
  };

  let historicoDisparados: string[] = [];
  let historicoOcorrencias: EventOccurrence[] = [];
  // F3 — o Calendário da Vida atravessa os anos, como no jogo real.
  let calendario = criarCalendarioInicial();
  const anos: AnoDaVida[] = [];
  const razao: LancamentoFinanceiro[] = [];
  const violacoes: Violacao[] = [];
  let decisoesTotais = 0;
  let acontecimentosTotais = 0;
  let anosSilenciosos = 0;
  let causaMorte: string | undefined;

  razao.push({
    idade: 0, ano: ctx.personagem.anoAtual,
    descricao: `saldo inicial (${classeSocial})`,
    delta: ctx.economia.dinheiro, saldoDepois: ctx.economia.dinheiro
  });

  let saldoAnterior = ctx.economia.dinheiro;
  const registrar = (idade: number, ano: number, descricao: string) => {
    const delta = ctx.economia.dinheiro - saldoAnterior;
    if (Math.abs(delta) > 0.5) {
      razao.push({ idade, ano, descricao, delta, saldoDepois: ctx.economia.dinheiro });
    }
    saldoAnterior = ctx.economia.dinheiro;
  };

  while (ctx.personagem.idade < idadeMaxima) {
    const acoesVoluntarias: string[] = [];

    // ================= FASE DE AÇÕES VOLUNTÁRIAS (o "ano do jogador") =======
    const idade = ctx.personagem.idade;
    const ano = ctx.personagem.anoAtual;

    const disponivel = (acao: Parameters<typeof getActionAvailability>[1], params = {}) =>
      getActionAvailability(
        { personagem: ctx.personagem, educacao: ctx.educacao, carreira: ctx.carreira, economia: ctx.economia, familia: ctx.familia, acoesRealizadasAno: [] },
        acao, params
      ).kind === 'disponivel';

    // Postura escolar
    if (ctx.educacao.emCurso && chance(pol.estudar)) {
      const r = definirPosturaEscolar('estudar', ctx.educacao);
      if (r.sucesso && r.educacaoAtualizada) { ctx.educacao = r.educacaoAtualizada; acoesVoluntarias.push('postura:estudar'); }
    }

    // Ingressar em curso
    if (!ctx.educacao.emCurso && idade >= 18 && chance(pol.curso)) {
      const candidatos = CURSOS_DISPONIVEIS.filter(c => disponivel('ingressar_curso', { cursoId: c.id }));
      if (candidatos.length > 0) {
        const curso = candidatos[Math.floor(rng() * candidatos.length)];
        // Tenta pública e depois privada — no máximo 4 tentativas/ano, para
        // MEDIR se o jogo permite re-rolar o vestibular no mesmo ano.
        //
        // CORREÇÃO SEMÂNTICA (Fase 2): a métrica antiga acusava QUALQUER
        // aprovação após a primeira tentativa, mas "não passei na federal e
        // me matriculei na particular" é o caminho real de milhões de
        // estudantes — e usa a MESMA nota. Isso nunca foi exploit.
        //
        // O exploit é re-rolar: insistir na MESMA via até sair nota diferente.
        // É isso que passamos a medir, comparando a nota entre tentativas.
        let notaDaPrimeiraProva: number | undefined;
        const viasTentadas = new Set<string>();

        for (let tentativa = 0; tentativa < 4; tentativa++) {
          const via = tentativa % 2 === 0 ? 'publica' : 'privada';
          const jaTentouEstaVia = viasTentadas.has(via);
          viasTentadas.add(via);

          const r = ingressarCurso(curso, via, ctx.personagem, ctx.educacao, ano);

          // A nota é gravada mesmo na reprovação — propagar é o que faz a
          // próxima tentativa encontrar a prova já prestada.
          if (r.educacaoAtualizada) {
            ctx.educacao = { ...ctx.educacao, ...r.educacaoAtualizada };
          }
          const notaAgora = ctx.educacao.vestibular?.nota;
          if (notaDaPrimeiraProva === undefined) notaDaPrimeiraProva = notaAgora;

          if (notaAgora !== undefined && notaDaPrimeiraProva !== undefined && notaAgora !== notaDaPrimeiraProva) {
            violacoes.push({
              codigo: 'VESTIBULAR_MULTIPLAS_TENTATIVAS_MESMO_ANO',
              idade,
              detalhe: `nota re-sorteada no mesmo ano (${notaDaPrimeiraProva} → ${notaAgora}) em ${curso.nome}`
            });
          }

          if (r.sucesso && r.educacaoAtualizada) {
            acoesVoluntarias.push(`curso:${curso.id}:tentativa${tentativa + 1}`);
            if (jaTentouEstaVia) {
              violacoes.push({
                codigo: 'VESTIBULAR_MULTIPLAS_TENTATIVAS_MESMO_ANO',
                idade,
                detalhe: `aprovado em ${curso.nome} repetindo a via "${via}" no MESMO ano`
              });
            }
            break;
          }
        }
      }
    }

    // Emprego
    if (!ctx.carreira.empregado && !ctx.carreira.aposentado && chance(pol.emprego)) {
      const vagas = listarVagasCompativeis({
        personagem: ctx.personagem, educacao: ctx.educacao, carreira: ctx.carreira,
        economia: ctx.economia, familia: ctx.familia
      });
      // Perfis mais ambiciosos vão atrás da melhor vaga possível.
      const ordenadas = [...vagas].sort((a, b) => b.salarioMensal - a.salarioMensal);
      const alvo = perfil === 'passivo'
        ? ordenadas[ordenadas.length - 1]
        : ordenadas[0];
      if (alvo) {
        // Até 5 candidaturas no mesmo ano (mede se o jogo permite spam)
        for (let t = 0; t < 5; t++) {
          const r = candidatarEmprego(alvo, ctx.personagem, ctx.educacao, ano, ctx.carreira, ctx.registroTemporal);
          if (r.registroTemporalAtualizado) ctx.registroTemporal = r.registroTemporalAtualizado;
          if (r.sucesso && r.novoCargo) {
            const anosExpAnteriores = ctx.carreira.historicoEmpregos.reduce(
              (s, h) => s + ((h.anoFim ?? ano) - h.anoInicio), 0
            );
            ctx.carreira = {
              ...ctx.carreira, empregado: true, cargoAtual: r.novoCargo,
              anosNoCargo: 0, desempenhoTrabalho: 60,
              historicoEmpregos: ctx.carreira.empregado && ctx.carreira.cargoAtual
                ? [...ctx.carreira.historicoEmpregos, {
                    cargo: ctx.carreira.cargoAtual.titulo,
                    salario: ctx.carreira.cargoAtual.salarioMensal,
                    anoInicio: ano - ctx.carreira.anosNoCargo,
                    anoFim: ano, motivoSaida: 'Mudança de emprego'
                  }]
                : ctx.carreira.historicoEmpregos
            };
            acoesVoluntarias.push(`emprego:${alvo.id}:tentativa${t + 1}`);
            // CORREÇÃO SEMÂNTICA (Fase 2) — esta métrica foi escrita ANTES da
            // Fase 1 e não conhecia a faixa `improvavel`.
            //
            // A Fase 1 decidiu deliberadamente (e o relatório documentou) que
            // faltar ATÉ 1 ano de experiência não bloqueia: vira `improvavel`,
            // com a chance multiplicada por 0,75. Uma empresa abrir exceção
            // para quem está a um ano do perfil é comportamento de mercado
            // real, e removê-lo tornaria a carreira mecânica.
            //
            // A métrica antiga contava esses casos como violação. Na Fase 1 ela
            // marcou zero POR ACASO — nenhuma das 105 vidas caiu na faixa. Ao
            // deslocar as trajetórias no tempo, a Fase 2 fez a faixa aparecer,
            // e a métrica passou a acusar como furo um comportamento aprovado.
            //
            // Passa a medir o que a regra de fato proíbe: contratação com
            // experiência faltando MAIS de um ano (grau `requisito`, que
            // bloqueia). A faixa improvável é contada à parte, para não
            // desaparecer da observação.
            const faltando = alvo.experienciaNecessaria - anosExpAnteriores;
            if (faltando > 1) {
              violacoes.push({
                codigo: 'EMPREGO_SEM_EXPERIENCIA_EXIGIDA',
                idade,
                detalhe: `contratado como "${alvo.titulo}" (exige ${alvo.experienciaNecessaria} anos de experiência; tinha ${anosExpAnteriores}) por R$ ${alvo.salarioMensal}/mês`
              });
            } else if (faltando > 0) {
              violacoes.push({
                codigo: 'CONTRATACAO_IMPROVAVEL_POR_EXPERIENCIA',
                idade,
                detalhe: `contratado como "${alvo.titulo}" faltando ${faltando} ano para o perfil (faixa improvável aprovada na Fase 1)`
              });
            }
            if (t > 0) {
              violacoes.push({
                codigo: 'CANDIDATURA_ILIMITADA_MESMO_ANO',
                idade,
                detalhe: `contratado na tentativa ${t + 1} do mesmo ano para "${alvo.titulo}"`
              });
            }
            break;
          }
        }
      }
    }

    if (ctx.carreira.empregado && chance(pol.horasExtras)) {
      const r = trabalharMais(ctx.carreira, ctx.personagem);
      if (r.sucesso && r.carreiraAtualizada) { ctx.carreira = r.carreiraAtualizada; acoesVoluntarias.push('horas_extras'); }
    }
    if (ctx.carreira.empregado && chance(pol.aumento)) {
      const r = pedirAumento(ctx.carreira, ctx.personagem, ano);
      ctx.carreira = r.carreiraAtualizada; ctx.personagem = r.personagemAtualizado;
      if (r.sucesso) acoesVoluntarias.push('aumento');
    }
    if (idade >= 18 && chance(pol.bico)) {
      const bicos = ['bico_entregas', 'bico_aulas', 'bico_freela_design_ti', 'bico_uber'];
      for (const b of bicos) {
        const r = escolherBico(b, ctx.carreira, ctx.personagem, ctx.educacao, ctx.economia);
        if (r.sucesso && r.carreiraAtualizada) { ctx.carreira = r.carreiraAtualizada; acoesVoluntarias.push(`bico:${b}`); break; }
      }
    }

    // Relacionamento / filhos
    const TIPOS_PARCEIRO = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];
    const parceiro = ctx.familia.find(f => f.vivo && TIPOS_PARCEIRO.includes(f.tipo));
    if (!parceiro && idade >= 18 && chance(pol.namoro)) {
      const cands = gerarCandidatosNamoro('todos', idade);
      const r = iniciarNamoro(cands[0], ctx.personagem, ano);
      if (r.sucesso && r.novoMembro && r.personagemAtualizado) {
        ctx.familia = [...ctx.familia, r.novoMembro];
        ctx.personagem = r.personagemAtualizado;
        acoesVoluntarias.push('namoro');
        violacoes.push({
          codigo: 'NAMORO_INSTANTANEO',
          idade,
          detalhe: `relação criada já em "relacionamento 85" no mesmo clique, sem processo de aproximação (${r.novoMembro.nome})`
        });
      }
    }
    if (parceiro && !['esposo', 'esposa'].includes(parceiro.tipo) && chance(0.35)) {
      const r = pedirEmCasamento(parceiro, ctx.personagem, ano);
      if (r.sucesso && r.parceiroAtualizado && r.personagemAtualizado) {
        const anosDeNamoro = ctx.familia.filter(f => f.id === parceiro.id).length ? 0 : 0;
        ctx.familia = ctx.familia.map(f => f.id === parceiro.id ? r.parceiroAtualizado! : f);
        ctx.personagem = r.personagemAtualizado;
        acoesVoluntarias.push('casamento');
        void anosDeNamoro;
      }
    }
    if (parceiro && idade >= 18 && chance(pol.filho)) {
      // Até 3 filhos no mesmo ano (mede se o jogo permite)
      let nascidosNoAno = 0;
      for (let k = 0; k < 3; k++) {
        if (!chance(0.6) && k > 0) break;
        const r = terFilho(parceiro, ctx.personagem, undefined, undefined, ano, ctx.registroTemporal);
        if (r.registroTemporalAtualizado) ctx.registroTemporal = r.registroTemporalAtualizado;
        if (r.sucesso && r.novoFilho && r.personagemAtualizado) {
          ctx.familia = [...ctx.familia, r.novoFilho];
          ctx.personagem = r.personagemAtualizado;
          nascidosNoAno++;
          acoesVoluntarias.push('filho');
        }
      }
      if (nascidosNoAno > 1) {
        violacoes.push({
          codigo: 'MULTIPLOS_FILHOS_MESMO_ANO',
          idade,
          detalhe: `${nascidosNoAno} filhos nascidos no mesmo ano, sem gestação nem intervalo`
        });
      }
      // Idade do parceiro vs idade do jogador
      const p = ctx.familia.find(f => f.id === parceiro.id);
      if (p && Math.abs(p.idade - idade) > 25) {
        violacoes.push({ codigo: 'DIFERENCA_IDADE_EXTREMA_PARCEIRO', idade, detalhe: `parceiro com ${p.idade} anos` });
      }
    }

    // Compras
    if (idade >= 18 && chance(pol.comprar)) {
      const itens = [...IMOVEIS_LOJA, ...VEICULOS_LOJA].filter(i => ctx.economia.dinheiro >= i.preco);
      if (itens.length > 0) {
        const item = itens[Math.floor(rng() * itens.length)];
        const r = comprarBem(item, ctx.economia, ctx.personagem, ano);
        if (r.sucesso && r.economiaAtualizada && r.personagemAtualizado) {
          ctx.economia = r.economiaAtualizada; ctx.personagem = r.personagemAtualizado;
          acoesVoluntarias.push(`compra:${item.id}`);
          registrar(idade, ano, `compra ${item.nome}`);
          if (ctx.economia.dividas > 0) {
            violacoes.push({
              codigo: 'COMPRA_DE_LUXO_COM_DIVIDA',
              idade,
              detalhe: `comprou ${item.nome} (R$ ${item.preco}) tendo R$ ${Math.round(ctx.economia.dividas)} de dívida`
            });
          }
        }
      }
    }

    // Atividades
    if (chance(pol.atividade)) {
      const possiveis = ATIVIDADES_DISPONIVEIS.filter(a => disponivel('executar_atividade', { atividadeId: a.id }));
      if (possiveis.length > 0) {
        const at = possiveis[Math.floor(rng() * possiveis.length)];
        const ef = calcularEfeitoAtividade(at.id);
        ctx.economia = { ...ctx.economia, dinheiro: ctx.economia.dinheiro - at.custo };
        ctx.personagem = {
          ...ctx.personagem,
          stats: {
            felicidade: clamp(ctx.personagem.stats.felicidade + (ef.stats.felicidade ?? 0)),
            saude: clamp(ctx.personagem.stats.saude + (ef.stats.saude ?? 0)),
            aparencia: clamp(ctx.personagem.stats.aparencia + (ef.stats.aparencia ?? 0)),
            inteligencia: clamp(ctx.personagem.stats.inteligencia + (ef.stats.inteligencia ?? 0))
          },
          hiddenStats: {
            ...ctx.personagem.hiddenStats,
            estresse: clamp(ctx.personagem.hiddenStats.estresse + (ef.hiddenStats.estresse ?? 0)),
            sociabilidade: clamp(ctx.personagem.hiddenStats.sociabilidade + (ef.hiddenStats.sociabilidade ?? 0)),
            empatia: clamp(ctx.personagem.hiddenStats.empatia + (ef.hiddenStats.empatia ?? 0)),
            condicionamentoFisico: clamp(ctx.personagem.hiddenStats.condicionamentoFisico + (ef.hiddenStats.condicionamentoFisico ?? 0)),
            reputacao: clamp(ctx.personagem.hiddenStats.reputacao + (ef.hiddenStats.reputacao ?? 0))
          }
        };
        acoesVoluntarias.push(`atividade:${at.id}`);
        registrar(idade, ano, `atividade ${at.nome}`);
        // Doente grave executando atividade física?
        if (ctx.personagem.stats.saude < 20 && ['act_academia', 'act_viagem_exterior', 'act_balada_barzinho'].includes(at.id)) {
          violacoes.push({ codigo: 'ATIVIDADE_INCOMPATIVEL_COM_SAUDE', idade, detalhe: `${at.nome} com saúde ${Math.round(ctx.personagem.stats.saude)}` });
        }
      }
    }

    if (idade >= 18 && chance(pol.loteria)) {
      const r = jogarMegaSena(ctx.economia, ctx.personagem, ano);
      if (r.sucesso && r.economiaAtualizada && r.personagemAtualizado) {
        ctx.economia = r.economiaAtualizada; ctx.personagem = r.personagemAtualizado;
        if (r.ganhou) acoesVoluntarias.push(`loteria_ganhou:${r.premio}`);
        registrar(idade, ano, r.ganhou ? `loteria (prêmio)` : 'loteria (bilhete)');
      }
    }

    // ================= PASSAGEM DE ANO ======================================
    const saldoAntesDoAno = ctx.economia.dinheiro;
    const resultado = executarPassagemDeAno(
      ctx.personagem, ctx.familia, ctx.educacao, ctx.carreira, ctx.economia,
      historicoDisparados, ctx.personalidade, historicoOcorrencias, calendario
    );
    calendario = resultado.calendario;

    ctx.personagem = resultado.personagemAtualizado;
    ctx.familia = resultado.familiaAtualizada;
    ctx.educacao = resultado.educacaoAtualizada;
    ctx.carreira = resultado.carreiraAtualizada;
    ctx.economia = resultado.economiaAtualizada;

    const registroAno: AnoDaVida = {
      idade: ctx.personagem.idade,
      ano: ctx.personagem.anoAtual,
      pulso: resultado.ritmo.pulso,
      motivoRitmo: resultado.ritmo.motivo,
      logs: resultado.novosLogs.map(l => ({ categoria: l.categoria, texto: l.texto, tipo: l.tipo, relevancia: l.relevancia })),
      ocorrenciasDoAno: [],
      contexto: {
        temPet: ctx.familia.some(f => f.vivo && f.tipo === 'pet'),
        temImovel: ctx.economia.propriedades.some(pr => pr.tipo === 'imovel'),
        temVeiculo: ctx.economia.propriedades.some(pr => pr.tipo === 'veiculo'),
        temAmigo: ctx.familia.some(f => f.vivo && (f.tipo === 'amigo' || f.tipo === 'amiga')),
        emEscola: ctx.educacao.emCurso,
        empregado: ctx.carreira.empregado,
        estudouAlgumaVez: ctx.educacao.nivelAtual !== 'nenhuma'
      },
      acoesVoluntarias,
      saldo: Math.round(ctx.economia.dinheiro),
      dividas: Math.round(ctx.economia.dividas),
      patrimonio: Math.round(calcularPatrimonioLiquido(ctx.economia)),
      escolaridade: ctx.educacao.nivelAtual,
      emCurso: ctx.educacao.nomeCurso,
      semestre: ctx.educacao.semestreAtual,
      totalSemestres: ctx.educacao.totalSemestres,
      cargo: ctx.carreira.cargoAtual?.titulo,
      salarioMensal: ctx.carreira.cargoAtual?.salarioMensal,
      anosNoCargo: ctx.carreira.anosNoCargo,
      saude: Math.round(ctx.personagem.stats.saude),
      familia: ctx.familia.map(f => ({ tipo: f.tipo, nome: f.nome, idade: f.idade, vivo: f.vivo }))
    };

    saldoAnterior = saldoAntesDoAno;
    registrar(ctx.personagem.idade, ctx.personagem.anoAtual, 'fechamento anual (salário − despesas ± rendimentos/heranças)');

    if (resultado.ritmo.pulso === 'silencio') anosSilenciosos++;

    registroAno.ocorrenciasDoAno = resultado.ocorrenciasDoAno.map(o => o.eventId);

    if (resultado.acontecimentoResolvido) {
      acontecimentosTotais++;
      registroAno.acontecimento = {
        id: resultado.acontecimentoResolvido.id,
        titulo: resultado.acontecimentoResolvido.titulo
      };
    }

    // F3-FIX — todas as ocorrências do ano, não só a principal: um ano com
    // marco pode trazer um acontecimento leve junto.
    for (const oc of resultado.ocorrenciasDoAno) {
      historicoDisparados = [...historicoDisparados, oc.eventId];
      historicoOcorrencias = [...historicoOcorrencias, oc];
    }

    if (resultado.eventoDisparado) {
      decisoesTotais++;
      const evento = resultado.eventoDisparado;
      // Escolha conforme perfil: primeira opção viável (determinística por seed)
      const opcao = evento.opcoes[Math.floor(rng() * evento.opcoes.length)] ?? evento.opcoes[0];
      registroAno.eventoDecisao = {
        id: evento.id,
        titulo: evento.titulo,
        opcaoEscolhida: opcao?.texto ?? '',
        // F3 — sem isto a auditoria volta a somar escolha biográfica com
        // decisão contextual, que é o erro que a fase inteira corrige.
        taxonomia: classificacaoDoEvento(evento)
      };
      if (opcao) {
        const res = aplicarConsequenciasEscolha(
          opcao, ctx.personagem, ctx.carreira, ctx.educacao, ctx.economia, ctx.familia,
          ctx.personagem.anoAtual, { eventoId: evento.id, personalidade: ctx.personalidade }
        );
        if (!res.recusado) {
          ctx.personagem = res.personagemAtualizado;
          ctx.carreira = res.carreiraAtualizada;
          ctx.educacao = res.educacaoAtualizada;
          ctx.economia = res.economiaAtualizada;
          ctx.familia = res.familiaAtualizada;
          if (res.personalidadeAtualizada) ctx.personalidade = res.personalidadeAtualizada;
          registroAno.logs.push(...res.novosLogs.map(l => ({ categoria: l.categoria, texto: l.texto, tipo: l.tipo, relevancia: l.relevancia })));
          registrar(ctx.personagem.idade, ctx.personagem.anoAtual, `consequência de "${evento.titulo}"`);
          if (res.morreu) { causaMorte = res.causaMorte; anos.push(registroAno); break; }
        }
      }
    }

    anos.push(registroAno);

    // =============== CHECAGENS AUTOMÁTICAS DE COERÊNCIA =====================
    verificarCoerencia(ctx, registroAno, violacoes, anos);

    if (resultado.morreu) { causaMorte = resultado.resumoMorte?.causaMorte; break; }
  }

  resetarFonteAleatoria();

  return {
    seed, perfil,
    nome: ctx.personagem.nome,
    cidade: ctx.personagem.cidade,
    estado: ctx.personagem.estado,
    classeSocial, genero,
    anos, razao, violacoes,
    idadeFinal: ctx.personagem.idade,
    causaMorte,
    decisoesTotais, acontecimentosTotais, anosSilenciosos,
    familiaFinal: ctx.familia
  };
}

/**
 * Duração declarada do último curso concluído, em semestres.
 *
 * Lê do catálogo pelo nome registrado em `cursosConcluidos` — a mesma ponte
 * que o motor usa. Educação básica não está no catálogo e devolve undefined,
 * caso em que a checagem cai no piso conservador de 2 anos.
 */
function ultimaDuracaoEmSemestres(ctx: Ctx): number | undefined {
  const ultimo = ctx.educacao.cursosConcluidos[ctx.educacao.cursosConcluidos.length - 1];
  if (!ultimo) return undefined;
  const norm = (n: string) => n.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CURSOS_DISPONIVEIS.find(c => norm(c.nome) === norm(ultimo.nome))?.duracaoSemestres;
}

function verificarCoerencia(ctx: Ctx, ano: AnoDaVida, violacoes: Violacao[], historico: AnoDaVida[]) {
  const idade = ano.idade;

  // 1. Formação técnica/superior concluída rápido demais
  for (const log of ano.logs) {
    if (/FORMATURA/i.test(log.texto)) {
      const inicio = ctx.educacao.anoIngresso;
      const anosDeCurso = inicio ? ano.ano - inicio : undefined;
      // CORREÇÃO SEMÂNTICA (Fase 2) — a métrica antiga acusava "rápido demais"
      // sempre que o curso durasse <= 1 ano, o que é um PROXY, não a regra.
      // Com durações ímpares representáveis, um curso legítimo de 3 semestres
      // (1 ano e meio) conclui no 2º ano e um de 1 ano seria válido se
      // existisse — a comparação certa é contra a duração DECLARADA do curso,
      // não contra uma constante. Sem esta correção, a Fase 2 produziria
      // falsos positivos exatamente nos cursos que ela consertou.
      const duracaoDeclarada = ultimaDuracaoEmSemestres(ctx);
      const minimoEsperado = duracaoDeclarada
        ? Math.ceil(duracaoDeclarada / 2)
        : 2;
      if (anosDeCurso !== undefined && anosDeCurso < minimoEsperado) {
        violacoes.push({
          codigo: 'FORMACAO_RAPIDA_DEMAIS',
          idade,
          detalhe: `${log.texto} após ${anosDeCurso} ano(s); duração declarada ${duracaoDeclarada ?? '?'} semestres (mínimo ${minimoEsperado} ano(s))`
        });
      }
    }
  }

  // 2. Cargo incompatível com idade/experiência
  if (ano.cargo && ano.salarioMensal) {
    const experiencia = historico.filter(a => a.cargo).length;
    if (idade <= 20 && ano.salarioMensal >= 5000) {
      violacoes.push({
        codigo: 'SALARIO_ALTO_IDADE_BAIXA',
        idade,
        detalhe: `"${ano.cargo}" a R$ ${ano.salarioMensal}/mês aos ${idade} anos com ${experiencia} ano(s) de carreira`
      });
    }
  }

  // 3. Dinheiro sem origem: saldo cresce muito num ano sem salário/evento
  if (historico.length >= 2) {
    const anterior = historico[historico.length - 2];
    const delta = ano.saldo - anterior.saldo;
    const salarioAnual = (ano.salarioMensal ?? 0) * 13;
    const temEventoDeDinheiro = ano.logs.some(l => l.categoria === 'financas' || /R\$/.test(l.texto));
    if (delta > salarioAnual + 30000 && !temEventoDeDinheiro && !ano.acoesVoluntarias.some(a => a.startsWith('loteria_ganhou'))) {
      violacoes.push({ codigo: 'DINHEIRO_SEM_ORIGEM', idade, detalhe: `saldo saltou R$ ${Math.round(delta)} num ano com salário anual de R$ ${salarioAnual}` });
    }
  }

  // 4. Menor de idade com patrimônio adulto
  if (idade < 18 && ano.saldo > 50000) {
    violacoes.push({ codigo: 'MENOR_COM_PATRIMONIO_ALTO', idade, detalhe: `R$ ${ano.saldo} aos ${idade} anos` });
  }

  // 5. Filho com idade incompatível com a do pai/mãe
  for (const f of ano.familia) {
    if ((f.tipo === 'filho' || f.tipo === 'filha') && f.vivo) {
      const idadeNoNascimento = idade - f.idade;
      if (idadeNoNascimento < 14) {
        violacoes.push({ codigo: 'FILHO_IDADE_IMPOSSIVEL', idade, detalhe: `${f.nome} teria nascido quando o personagem tinha ${idadeNoNascimento} anos` });
      }
    }
  }

  // 6. Doente grave trabalhando em jornada plena
  if (ano.saude < 15 && ano.cargo) {
    violacoes.push({ codigo: 'TRABALHO_COM_SAUDE_CRITICA', idade, detalhe: `trabalhando como "${ano.cargo}" com saúde ${ano.saude}` });
  }

  // 7. Mudança de cidade nunca acontece
  // (verificado no agregado, não aqui)

  // 8. Parceiro/NPC anônimo
  for (const f of ano.familia) {
    if (f.nome === 'Novo Familiar') {
      violacoes.push({ codigo: 'NPC_SEM_NOME', idade, detalhe: `pessoa "${f.nome}" (tipo ${f.tipo}) criada por evento sem nome próprio` });
    }
  }

  // 9. Escolaridade retrocede ou é incoerente com o cargo
  if (ano.cargo && ['nenhuma', 'fundamental_incompleto'].includes(ano.escolaridade) && (ano.salarioMensal ?? 0) > 3000) {
    violacoes.push({ codigo: 'CARGO_SEM_ESCOLARIDADE', idade, detalhe: `"${ano.cargo}" com escolaridade "${ano.escolaridade}"` });
  }

  // 10. Aposentadoria nunca acontece
  if (idade >= 70 && ano.cargo && !ctx.carreira.aposentado) {
    violacoes.push({ codigo: 'SEM_APOSENTADORIA', idade, detalhe: `ainda trabalhando como "${ano.cargo}" aos ${idade} anos, sem sistema de aposentadoria` });
  }
}
