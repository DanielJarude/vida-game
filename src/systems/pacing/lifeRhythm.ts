/**
 * pacing/lifeRhythm — o RITMO da vida (B4-FIX4).
 *
 * "A vida acontece. Às vezes você decide."
 *
 * Esta camada responde a UMA pergunta por ano, antes de qualquer sorteio de
 * conteúdo: **o que este ano merece?**
 *
 *   silêncio       → o ano passa. Nada é sorteado, nada é narrado, nenhum
 *                    modal abre, nenhuma linha entra na Linha da Vida.
 *   acontecimento  → algo acontece com a pessoa. O motor resolve e narra.
 *   decisão        → existe uma encruzilhada real. O jogador escolhe.
 *
 * O que ela SUBSTITUI: até o B4-FIX3 essa decisão era `rollChance(75)` —
 * uma porcentagem global, igual aos 0 e aos 80 anos, cega para fase,
 * contexto e para o que o próprio ano já havia produzido. Baixar esse
 * número resolveria a frequência e não resolveria o ritmo: continuaria
 * perguntando ao bebê e continuaria interrompendo um ano que já tinha
 * história própria.
 *
 * Quatro forças decidem o pulso, e nenhuma delas é uma porcentagem global:
 *
 *  1. FATIA DE DECISÃO POR IDADE — quanto do conteúdo interativo é
 *     encruzilhada. Um bebê não decide nada (0%); e mesmo um adulto, com
 *     autonomia plena, nunca passa de metade — decisão é minoria do que
 *     acontece em qualquer idade. Ver a nota longa em `PerfilDeRitmo`:
 *     tratar "autonomia plena" como "pergunta quase sempre" foi o erro da
 *     primeira versão desta camada, e o que o fez virar questionário adulto.
 *  2. DENSIDADE ESTRUTURAL DO ANO — quantos acontecimentos o próprio motor
 *     (educação, carreira, família, economia) já produziu neste ano. Um ano
 *     que já entregou "você se formou" não precisa de interrupção extra.
 *  3. FADIGA — quantos eventos interativos vieram nos últimos anos, com a
 *     fadiga de DECISÃO contada à parte. Três acontecimentos seguidos são
 *     vida acontecendo; três decisões seguidas são um questionário.
 *  4. SECURA — há quantos anos nada acontece. Anos tranquilos são válidos e
 *     necessários; uma década muda não é ritmo, é ausência de vida.
 *
 * Mais um TETO DURO, que não depende de sorte nenhuma: um número máximo de
 * decisões por janela móvel, definido por fase. É o que garante, de forma
 * estrutural e não probabilística, que o jogo nunca vire uma decisão
 * obrigatória por ano.
 *
 * Módulo PURO: sem React, sem estado, sem import de dados de evento. A fonte
 * de aleatoriedade é injetável para que o comportamento seja testável e
 * simulável sem depender de sorte.
 */

import { taxonomiaConsomeCotaDeDecisao, type NaturezaEvento, type TaxonomiaConteudo } from '../../types';
import { valorAleatorio } from '../../utils/random';

/** O que um ano merece. */
export type PulsoDoAno = 'silencio' | 'acontecimento' | 'decisao';

/** Uma ocorrência interativa passada, reduzida ao que o ritmo precisa saber. */
export interface RegistroRitmo {
  idade: number;
  natureza: NaturezaEvento;
  /**
   * F3 — esta ocorrência gastou orçamento de DECISÃO CONTEXTUAL?
   *
   * Separado de `natureza` porque as duas perguntas são diferentes: a
   * natureza diz se o jogador foi consultado, isto diz se a consulta foi
   * uma tomada de posição. Uma escolha biográfica ("qual foi sua primeira
   * palavra?") é consultada e NÃO gasta orçamento — ela não é uma posição
   * sobre nada, então não causa fadiga nem bloqueia decisões posteriores.
   */
  consomeCota: boolean;
}

export interface ContextoRitmo {
  /** Idade que o personagem acabou de completar. */
  idade: number;
  /** Ocorrências interativas já vividas nesta vida (ordem cronológica). */
  historico: RegistroRitmo[];
  /**
   * Quantos acontecimentos ESTRUTURAIS o ano já produziu por conta própria
   * — formatura, emprego novo, nascimento, perda na família, compra de
   * imóvel. São logs que o motor gerou antes de o ritmo ser consultado.
   */
  densidadeEstrutural: number;
}

/**
 * Diagnóstico completo do ano. O `pulso` é o que o motor consome; o resto
 * existe para teste, simulação e depuração — nunca é exibido ao jogador.
 */
export interface DiagnosticoRitmo {
  pulso: PulsoDoAno;
  faixa: FaixaDeRitmo;
  /** Probabilidade final de o ano ter algo interativo (0-1). */
  chanceDeAlgoAcontecer: number;
  /** Probabilidade final de esse algo ser uma decisão, e não acontecimento (0-1). */
  chanceDeSerDecisao: number;
  /** Decisões já vividas dentro da janela móvel. */
  decisoesNaJanela: number;
  /** Anos desde a última ocorrência interativa (Infinity se nunca houve). */
  anosDeSecura: number;
  /** Por que o ritmo decidiu assim (texto técnico, só para teste/log). */
  motivo: string;
}

/* ========================================================================== */
/*                          FAIXAS DE RITMO POR IDADE                         */
/* ========================================================================== */

/**
 * As faixas de ritmo NÃO são as mesmas de `LifeStage`: elas recortam a vida
 * por capacidade de deliberar e por densidade de acontecimentos, não por
 * rótulo social. 12-14 e 15-17 são a mesma adolescência, mas a autonomia
 * de uma pessoa de 13 e de uma de 17 não é a mesma.
 */
export type FaixaDeRitmo =
  | 'bebe'          // 0-2
  | 'primeira'      // 3-5
  | 'infancia'      // 6-11
  | 'adolescencia'  // 12-14
  | 'juventude'     // 15-17
  | 'jovem_adulto'  // 18-29
  | 'adulto'        // 30-59
  | 'madureza';     // 60+

interface PerfilDeRitmo {
  /** Chance-base de o ano ter algo interativo, antes de qualquer modulação. */
  densidadeBase: number;
  /**
   * Fatia do conteúdo interativo que é DECISÃO nesta faixa.
   *
   * CORREÇÃO importante sobre a primeira versão desta camada: o campo se
   * chamava `autonomia` e a faixa adulta valia 0,85, porque "adulto tem
   * autonomia plena". Isso confundia duas coisas diferentes:
   *
   *   1. a pessoa É CAPAZ de deliberar? (capacidade por idade)
   *   2. com que frequência a vida COLOCA uma encruzilhada na frente dela?
   *
   * A primeira é uma regra de coerência etária e continua absoluta — um
   * bebê tem 0 e nada muda isso. A segunda é desenho de ritmo, e 0,85
   * respondia a pergunta errada: um adulto ter autonomia plena sobre as
   * decisões que enfrenta não significa que 85% dos anos notáveis dele
   * sejam encruzilhadas.
   *
   * A simulação de 40 vidas media, por década adulta, 3,0 decisões contra
   * 1,0 acontecimento — o VIDA perguntava três vezes mais do que narrava,
   * exatamente o oposto de "a vida acontece, às vezes você decide". Note
   * que ampliar o acervo adulto de 15 para 35 acontecimentos NÃO mexeu
   * nessa proporção: a natureza do ano é decidida antes de o conteúdo ser
   * consultado. Era parâmetro, não conteúdo.
   *
   * Nenhuma faixa passa de 0,5: decisão é minoria do que acontece em
   * qualquer idade. O que a idade governa é o quanto dessa minoria existe
   * — e o teto por janela, logo abaixo.
   */
  fatiaDeDecisao: number;
  /** Teto duro de decisões dentro da janela móvel. */
  tetoDecisoes: number;
  /** Anos da janela móvel usada para o teto e para a fadiga de decisão. */
  janela: number;
}

/**
 * Autonomia por idade, literal e auditável:
 *
 *  0-2   nenhuma decisão consciente  → fatia 0, teto 0
 *  3-5   poucas decisões simples     → fatia baixa, no máximo 1 por 5 anos
 *  6-11  escola, amigos, interesses  → fatia média
 *  12-14 autonomia social crescente
 *  15-17 preparação para a vida adulta
 *  18+   autonomia adulta plena — o que muda depois dos 18 é o TETO por
 *        janela e a densidade, não a promessa de que a vida vira um
 *        questionário. A fatia de decisão nunca passa de metade.
 *
 * A densidade base cai na vida adulta estável e sobe de novo levemente na
 * juventude e na velhice — não porque "idoso tem mais eventos", mas porque
 * nessas faixas o que acontece tende a ser notável, enquanto a rotina de um
 * adulto de 45 anos empregado é, honestamente, rotina.
 */
const PERFIS: Record<FaixaDeRitmo, PerfilDeRitmo> = {
  bebe:         { densidadeBase: 0.50, fatiaDeDecisao: 0.00, tetoDecisoes: 0, janela: 4 },
  primeira:     { densidadeBase: 0.52, fatiaDeDecisao: 0.15, tetoDecisoes: 1, janela: 5 },
  infancia:     { densidadeBase: 0.55, fatiaDeDecisao: 0.30, tetoDecisoes: 2, janela: 4 },
  adolescencia: { densidadeBase: 0.60, fatiaDeDecisao: 0.40, tetoDecisoes: 2, janela: 4 },
  juventude:    { densidadeBase: 0.62, fatiaDeDecisao: 0.48, tetoDecisoes: 2, janela: 3 },
  jovem_adulto: { densidadeBase: 0.58, fatiaDeDecisao: 0.50, tetoDecisoes: 3, janela: 4 },
  adulto:       { densidadeBase: 0.45, fatiaDeDecisao: 0.46, tetoDecisoes: 3, janela: 4 },
  madureza:     { densidadeBase: 0.48, fatiaDeDecisao: 0.40, tetoDecisoes: 3, janela: 4 }
};

/**
 * Nenhuma faixa pode transformar a vida num questionário. Verificado em
 * teste: decisão é, no máximo, metade do conteúdo interativo — em qualquer
 * idade. É a tradução mecânica de "às vezes você decide".
 */
export const FATIA_MAXIMA_DE_DECISAO = 0.5;

export function obterFaixaDeRitmo(idade: number): FaixaDeRitmo {
  if (idade <= 2) return 'bebe';
  if (idade <= 5) return 'primeira';
  if (idade <= 11) return 'infancia';
  if (idade <= 14) return 'adolescencia';
  if (idade <= 17) return 'juventude';
  if (idade <= 29) return 'jovem_adulto';
  if (idade <= 59) return 'adulto';
  return 'madureza';
}

/**
 * Primeiro ano de uma faixa: a vida muda de estrutura, não só de lista de
 * eventos. É o único empurrão "por idade" que o ritmo dá, e ele existe para
 * que o conteúdo próprio de cada fase tenha chance real de aparecer logo na
 * abertura dela, em vez de depender de sorte por vários anos.
 */
export const IDADES_DE_ABERTURA = [3, 6, 12, 15, 18, 30, 60];

export function ehAberturaDeFase(idade: number): boolean {
  return IDADES_DE_ABERTURA.includes(idade);
}

/* ========================================================================== */
/*                               MODULADORES                                  */
/* ========================================================================== */

/**
 * Um ano que já contou a própria história não precisa de interrupção.
 * Dois ou mais acontecimentos estruturais (formou, foi contratado, nasceu
 * um filho) silenciam o sorteio por completo — essa é a regra que impede o
 * VIDA de empilhar modal em cima de um ano que já estava cheio.
 */
export const SATURACAO_ESTRUTURAL = 2;

/** Janela usada para medir secura e fadiga geral. */
const JANELA_SECURA = 4;

/** A partir de quantos anos calados o ritmo passa a empurrar de volta. */
const SECURA_INCOMODA = 3;

function contarNaJanela(
  historico: RegistroRitmo[],
  idade: number,
  janela: number,
  filtro?: (r: RegistroRitmo) => boolean
): number {
  return historico.filter(
    r => r.idade > idade - janela && r.idade <= idade && (!filtro || filtro(r))
  ).length;
}

function anosDesdeUltimaOcorrencia(historico: RegistroRitmo[], idade: number): number {
  let ultima = -Infinity;
  for (const r of historico) {
    if (r.idade <= idade && r.idade > ultima) ultima = r.idade;
  }
  return ultima === -Infinity ? Infinity : idade - ultima;
}

/* ========================================================================== */
/*                                  RITMO                                     */
/* ========================================================================== */

/**
 * Decide o pulso do ano.
 *
 * `aleatorio` é injetável (0 ≤ x < 1). Em produção usa a fonte central de
 * `utils/random`, que os testes já sabem tornar determinística.
 */
export function definirPulsoDoAno(
  ctx: ContextoRitmo,
  aleatorio: () => number = valorAleatorio
): DiagnosticoRitmo {
  const faixa = obterFaixaDeRitmo(ctx.idade);
  const perfil = PERFIS[faixa];

  // Só decisão CONTEXTUAL entra na conta do teto. Escolha biográfica é
  // agência, mas de outra espécie: não disputa este orçamento.
  const decisoesNaJanela = contarNaJanela(
    ctx.historico,
    ctx.idade - 1,
    perfil.janela,
    r => r.consomeCota
  );
  const anosDeSecura = anosDesdeUltimaOcorrencia(ctx.historico, ctx.idade - 1);

  const diagnosticoBase = {
    faixa,
    decisoesNaJanela,
    anosDeSecura
  };

  // ------------------------------------------------ 1. Saturação estrutural
  // Não é probabilidade: é uma regra. O ano já tem história.
  if (ctx.densidadeEstrutural >= SATURACAO_ESTRUTURAL) {
    return {
      ...diagnosticoBase,
      pulso: 'silencio',
      chanceDeAlgoAcontecer: 0,
      chanceDeSerDecisao: 0,
      motivo: `ano saturado (${ctx.densidadeEstrutural} acontecimentos estruturais próprios)`
    };
  }

  // ------------------------------------------------- 2. Chance de algo haver
  let chance = perfil.densidadeBase;
  const razoes: string[] = [`base ${faixa}`];

  // Um único acontecimento estrutural já ocupa parte do ano.
  if (ctx.densidadeEstrutural === 1) {
    chance *= 0.55;
    razoes.push('ano parcialmente ocupado');
  }

  // Fadiga: quanto mais o passado recente falou, menos este ano precisa falar.
  const ocorrenciasRecentes = contarNaJanela(ctx.historico, ctx.idade - 1, JANELA_SECURA);
  if (ocorrenciasRecentes >= 3) {
    chance *= 0.40;
    razoes.push('fadiga alta');
  } else if (ocorrenciasRecentes === 2) {
    chance *= 0.70;
    razoes.push('fadiga moderada');
  }

  // Secura: silêncio longo demais deixa de ser ritmo e vira ausência.
  if (anosDeSecura >= SECURA_INCOMODA) {
    chance = 1 - (1 - chance) * 0.45;
    razoes.push(`${anosDeSecura} anos de silêncio`);
  }

  // Abertura de fase: o conteúdo próprio da nova fase merece chance de entrar.
  if (ehAberturaDeFase(ctx.idade)) {
    chance = 1 - (1 - chance) * 0.65;
    razoes.push('abertura de fase');
  }

  chance = Math.min(0.92, Math.max(0.05, chance));

  if (aleatorio() >= chance) {
    return {
      ...diagnosticoBase,
      pulso: 'silencio',
      chanceDeAlgoAcontecer: chance,
      chanceDeSerDecisao: 0,
      motivo: `ano tranquilo (${razoes.join(', ')})`
    };
  }

  // -------------------------------------------- 3. Acontecimento ou decisão?
  let chanceDecisao = perfil.fatiaDeDecisao;
  const razoesDecisao: string[] = [`fatia de decisão ${faixa}`];

  // Decisão no ano imediatamente anterior espaça a próxima — é o que evita
  // a sensação de interrogatório anual sem precisar de teto artificial.
  const decidiuAnoPassado = ctx.historico.some(
    r => r.idade === ctx.idade - 1 && r.consomeCota
  );
  if (decidiuAnoPassado) {
    chanceDecisao *= 0.40;
    razoesDecisao.push('decidiu no ano anterior');
  }

  // Teto duro: nenhuma rolagem pode furá-lo.
  if (decisoesNaJanela >= perfil.tetoDecisoes) {
    return {
      ...diagnosticoBase,
      pulso: 'acontecimento',
      chanceDeAlgoAcontecer: chance,
      chanceDeSerDecisao: 0,
      motivo: `teto de decisões atingido (${decisoesNaJanela}/${perfil.tetoDecisoes} em ${perfil.janela} anos)`
    };
  }

  const pulso: PulsoDoAno = aleatorio() < chanceDecisao ? 'decisao' : 'acontecimento';

  return {
    ...diagnosticoBase,
    pulso,
    chanceDeAlgoAcontecer: chance,
    chanceDeSerDecisao: chanceDecisao,
    motivo: `${pulso} (${razoesDecisao.join(', ')})`
  };
}

/**
 * Converte o histórico rico de ocorrências no formato mínimo que o ritmo
 * consome. Ocorrências anteriores ao B4-FIX4 não têm `natureza` gravada e
 * são lidas como 'decisao' — que é exatamente o que elas eram quando
 * aconteceram, já que o catálogo inteiro era decisão até aqui.
 *
 * F3 — `consomeCota` é derivado da TAXONOMIA da ocorrência, nunca de um id.
 * Quando a taxonomia não foi gravada (save antigo), cai na natureza, que
 * reproduz o comportamento que aquela ocorrência tinha quando foi criada.
 */
export function historicoDeRitmo(
  ocorrencias: { idade: number; natureza?: NaturezaEvento; taxonomia?: TaxonomiaConteudo }[]
): RegistroRitmo[] {
  return ocorrencias.map(o => {
    const natureza = o.natureza ?? 'decisao';
    return {
      idade: o.idade,
      natureza,
      consomeCota: o.taxonomia
        ? taxonomiaConsomeCotaDeDecisao(o.taxonomia)
        : natureza === 'decisao'
    };
  });
}
