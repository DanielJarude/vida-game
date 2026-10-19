/**
 * REWORK 5 — A PRISÃO COMO CAMADA JOGÁVEL. Antes, a pena era um intervalo: a vida "normal" seguia (comprar carro, mudar
 * de cidade, ir ao cinema com alguém) e a única escolha dentro era o `pri_rotina`. Agora:
 *
 *   a pena tem forma   início, duração, tempo cumprido, regime, o que já foi remido, a disciplina, a saída prevista
 *                      (`leituraDaPena` — a fonte única das telas);
 *   a liberdade some   `bloqueioDaLiberdade` é a porta CENTRAL (as ações a consultam antes de qualquer outra regra):
 *                      o que pede estar na rua não cabe na cela — e o semiaberto devolve só o trabalho de dia;
 *   a rotina é dentro  estudar e trabalhar na unidade (remição: as mesmas marcas que `justica` já lia), conhecer quem
 *                      divide o pavilhão, receber visitas, pedir a defensoria, preparar a saída;
 *   o pavilhão pressiona  a facção que chama, a briga que procura, o motim no pátio: situações ABSTRATAS com respostas
 *                      (nunca instrução de nada), riscos e consequências que ficam — na disciplina, na pena, nas pessoas;
 *   a fuga existe      como escolha abstrata de alto risco: quase sempre dá errado (falta grave, regime fechado, pena
 *                      maior); quando dá certo, a vida vira a de quem foge (`foragido`): sem carteira, sem fronteira,
 *                      com a recaptura possível todo ano — e a opção de se entregar.
 *
 * Os sorteios são derivados (`rngDe`): nada aqui mexe no acaso do resto da vida.
 */

import { machucarNaBriga } from './lesoes';
import { clamp, rngDe } from '../rng';
import type { Pessoa, Vida } from '../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { escrever, idade, lembrarCom, marcarFato, pais, parceiro, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { abalar } from './abalo';
import { marcar } from './marcas';

export type OquePrisao = 'estudar' | 'trabalhar' | 'conviver' | 'visitas' | 'defensoria' | 'preparar_saida' | 'fugir' | 'entregar_se'
  | 'faccao_aceitar' | 'faccao_recusar' | 'briga_evitar' | 'briga_enfrentar' | 'briga_transferencia' | 'motim_ficar' | 'motim_participar';

export const presoAgora = (v: Vida) => !!v.justica?.prisao;
export const foragido = (v: Vida) => !!v.justica?.foragido;

/* --------------------------------------------------- A porta da liberdade */

/** O que só existe na rua: com a pena em curso, nada disso cabe (o semiaberto devolve o trabalho — não a vida lá fora). */
const PEDEM_A_RUA = new Set([
  'sair_de_casa', 'trocar_moradia', 'voltar_pais', 'mudar_cidade', 'migrar', 'naturalizar', 'comprar_veiculo', 'comprar_imovel', 'veiculo',
  'usar_veiculo', 'usar_casa', 'imovel', 'adotar', 'adotar_pet', 'comprar_pet', 'levar_pet', 'entregar_pet', 'veterinario', 'cnh', 'cnh_preparar',
  'cnh_prova', 'habilitacao', 'matricular', 'enem', 'voltar_a_estudar', 'destrancar', 'emprestimo', 'plano_saude', 'experiencia', 'estilo',
  'comprar_coisa', 'presentear', 'rede', 'abrir_negocio', 'horas_extras', 'pedir_aumento', 'oficio', 'formacao', 'atracao', 'renomear'
]);
/** O semiaberto sai de dia para trabalhar: o emprego (e o que é dele) volta a caber. */
const SEMIABERTO_PODE = new Set(['horas_extras', 'pedir_aumento', 'oficio', 'rede']);
/** Quem foge não volta à vida formal: carteira, concurso, fronteira, cartório e banco pedem documento. */
const FORAGIDO_NAO = new Set(['candidatar', 'migrar', 'naturalizar', 'comprar_imovel', 'emprestimo', 'cnh', 'cnh_prova', 'matricular', 'enem', 'abrir_negocio', 'plano_saude', 'politica', 'adotar']);

/**
 * A porta CENTRAL (chamada por `disponibilidade` antes de qualquer outra regra): o que a pena ou a fuga impedem.
 * Devolve undefined quando a liberdade não está em questão.
 */
export function bloqueioDaLiberdade(v: Vida, tipo: string): Veredito | undefined {
  const j = v.justica;
  if (!j) return undefined;
  if (j.prisao) {
    if (!PEDEM_A_RUA.has(tipo)) return undefined;
    if (j.prisao.regime === 'semiaberto' && SEMIABERTO_PODE.has(tipo)) return undefined;
    return bloqueio('impossivel', j.prisao.regime === 'fechado' ? 'Não enquanto cumpre pena em regime fechado.' : 'No semiaberto, a rua é só para o trabalho: o resto espera a pena acabar.');
  }
  if (j.foragido && FORAGIDO_NAO.has(tipo)) return bloqueio('impossivel', 'Quem está foragido não pode mostrar documento: isso exigiria aparecer.');
  return undefined;
}

/** As conversas que cabem numa visita (ou num telefonema da unidade). O resto — cinema, jantar, viagem, namoro novo — espera. */
const NA_VISITA = new Set(['conversar', 'desabafar', 'desculpas', 'contar_verdade', 'ligar', 'ligar_par', 'chamado_sim', 'chamado_nao', 'reconciliar', 'apoiar', 'aconselhar', 'ex_conversar', 'ex_filhos', 'terminar', 'duvidas', 'afastar', 'perguntar_vida', 'agradecer_professor', 'futuro_casal', 'dinheiro_casal', 'carinho']);
export function interacaoNaPrisao(v: Vida, interacao: string): Veredito | undefined {
  if (!v.justica?.prisao || NA_VISITA.has(interacao)) return undefined;
  return bloqueio('impossivel', 'Da unidade, só cabe o que se faz numa visita ou num telefonema.');
}

/* ---------------------------------------------------------- A pena lida */

export interface LeituraDaPena {
  regime: 'fechado' | 'semiaberto';
  inicio: number;
  /** A pena da sentença, em meses (ou a espera preventiva até o julgamento). */
  pena?: number;
  cumpridos: number;
  /** Meses descontados por estudo e trabalho até agora. */
  remidos: number;
  saida: number;
  disciplina: 'boa' | 'regular' | 'ruim';
  /** O que já vale ou pode valer: progressão, remição, saída temporária... */
  beneficios: string[];
  situacao?: { tipo: string; titulo: string; texto: string; respostas: { oque: OquePrisao; rotulo: string }[] };
  faccao?: 'dentro' | 'recusou';
  rotina: string[];
  preventiva: boolean;
}

export function leituraDaPena(v: Vida): LeituraDaPena | undefined {
  const p = v.justica?.prisao;
  if (!p) return undefined;
  const d = p.disciplina ?? 70;
  const pena = p.penaMeses;
  const cumpridos = Math.max(0, v.t - p.tInicio);
  const beneficios: string[] = [];
  if (p.regime === 'fechado' && pena) beneficios.push(cumpridos >= pena * 0.6 * 0.3 ? 'Progressão para o semiaberto: o tempo já permite — depende do comportamento.' : `Progressão para o semiaberto por volta de ${anoDe(p.tInicio + Math.round((p.tFim - p.tInicio) * 0.6))}, com bom comportamento.`);
  if (p.regime === 'semiaberto') beneficios.push('Trabalho externo de dia; a noite é na unidade.');
  if ((p.remidos ?? 0) > 0) beneficios.push(`${p.remidos} meses já descontados por estudo e trabalho.`);
  if (p.preparouSaida) beneficios.push('A saída está preparada: um curso concluído e uma carta de emprego de um programa de egressos.');
  const rotina = [v.fatos['remicao_estudo'] !== undefined ? 'estuda na unidade' : '', v.fatos['remicao_trabalho'] !== undefined ? 'trabalha na unidade' : ''].filter(Boolean);
  return {
    regime: p.regime, inicio: p.tInicio, pena, cumpridos, remidos: p.remidos ?? 0, saida: p.tFim,
    disciplina: d >= 65 ? 'boa' : d >= 40 ? 'regular' : 'ruim', beneficios, situacao: situacaoDaVez(v), faccao: p.faccao, rotina,
    preventiva: !pena && !!v.justica?.processo
  };
}

const SITUACOES: Record<NonNullable<NonNullable<Vida['justica']>['prisao']>['pendente'] & string, { titulo: string; texto: (v: Vida) => string; respostas: { oque: OquePrisao; rotulo: string }[] }> = {
  faccao: {
    titulo: 'O convite do pavilhão',
    texto: () => 'Um grupo que manda no pavilhão mandou recado: proteção, cigarro, um lugar melhor na cela — em troca de lealdade, e de favores que ninguém diz quais são. Recusar também tem preço.',
    respostas: [{ oque: 'faccao_recusar', rotulo: 'Recusar, com respeito' }, { oque: 'faccao_aceitar', rotulo: 'Aceitar a proteção' }]
  },
  briga: {
    titulo: 'Alguém procura briga',
    texto: () => 'Um detento resolveu que você é o problema dele. Encarou no pátio, empurrou na fila. Todo mundo está olhando para ver o que você faz.',
    respostas: [{ oque: 'briga_evitar', rotulo: 'Engolir e evitar' }, { oque: 'briga_enfrentar', rotulo: 'Não baixar a cabeça' }, { oque: 'briga_transferencia', rotulo: 'Pedir para mudar de ala' }]
  },
  motim: {
    titulo: 'O pátio virou motim',
    texto: () => 'A comida, a superlotação, uma revista que passou do ponto: o pavilhão parou e não voltou para as celas. Quem fica de fora é visto; quem entra também.',
    respostas: [{ oque: 'motim_ficar', rotulo: 'Ficar na cela, de fora' }, { oque: 'motim_participar', rotulo: 'Ir junto com o pavilhão' }]
  }
};

function situacaoDaVez(v: Vida): LeituraDaPena['situacao'] {
  const p = v.justica?.prisao;
  if (!p?.pendente) return undefined;
  const s = SITUACOES[p.pendente];
  return { tipo: p.pendente, titulo: s.titulo, texto: s.texto(v), respostas: s.respostas };
}

/* --------------------------------------------------------- O que se faz */

export function disponibilidadePrisao(v: Vida, oque: OquePrisao): Veredito {
  const j = v.justica;
  if (oque === 'entregar_se') return j?.foragido ? PERMITIDO : bloqueio('impossivel', 'Não se aplica.');
  const p = j?.prisao;
  if (!p) return bloqueio('impossivel', 'Só para quem cumpre pena.');
  const menor = idade(v) < 18;
  const feito = (k: string) => v.anoAtual.acoes.includes(`prisao:${k}`);
  switch (oque) {
    case 'estudar': return v.fatos['remicao_estudo'] !== undefined ? bloqueio('incompativel', 'Você já estuda na unidade.') : PERMITIDO;
    case 'trabalhar':
      if (menor) return bloqueio('impossivel', 'Na internação, o que existe é a escola.');
      return v.fatos['remicao_trabalho'] !== undefined ? bloqueio('incompativel', 'Você já trabalha na unidade.') : (p.disciplina ?? 70) < 40 ? bloqueio('requisito', 'Com faltas disciplinares, a vaga de trabalho vai para outro.') : PERMITIDO;
    case 'conviver': return feito('conviver') ? bloqueio('incompativel', 'Neste ano você já se aproximou de alguém do pavilhão.') : PERMITIDO;
    case 'visitas': return feito('visitas') ? bloqueio('incompativel', 'O pedido de visitas deste ano já foi feito.') : PERMITIDO;
    case 'defensoria':
      if (menor) return bloqueio('impossivel', 'Na internação, quem acompanha é a equipe da unidade.');
      return p.assistencia !== undefined && v.t - p.assistencia < 12 ? bloqueio('incompativel', 'O pedido deste ano está na fila da defensoria.') : PERMITIDO;
    case 'preparar_saida':
      if (p.preparouSaida) return bloqueio('incompativel', 'A saída já está preparada.');
      return p.tFim - v.t > 18 ? bloqueio('requisito', 'Isso começa no último ano e meio da pena.') : PERMITIDO;
    case 'fugir': return feito('fugir') ? bloqueio('incompativel', 'Não neste ano.') : { grau: 'improvavel', chance: p.regime === 'semiaberto' ? 0.25 : 0.06, motivo: 'Quase sempre dá errado — e o preço é alto.' };
    default: {
      const s = p.pendente ? SITUACOES[p.pendente] : undefined;
      return s?.respostas.some(x => x.oque === oque) ? PERMITIDO : bloqueio('impossivel', 'Não há nada disso acontecendo agora.');
    }
  }
}

const ele = (v: Vida) => flex(ge(v), 'o', 'a', 'e');
const ajustarDisciplina = (v: Vida, d: number) => { const p = v.justica!.prisao!; p.disciplina = clamp((p.disciplina ?? 70) + d); };

export function executarPrisao(v: Vida, oque: OquePrisao): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const r = rngDe(v.id, 'prisao', oque, v.t);
  v.anoAtual.acoes.push(`prisao:${oque}`);
  const j = v.justica!;
  const p = j.prisao;
  switch (oque) {
    case 'estudar':
      v.fatos['remicao_estudo'] = v.t;
      escrever(v, { texto: idade(v) < 18 ? 'Voltou a frequentar a escola da unidade.' : 'Matriculou-se na escola da unidade: cada ano de estudo desconta meses da pena.', relevancia: 'biografia', tema: 'estudo', escolha: true });
      return { texto: 'A sala é pequena e o professor vem duas vezes por semana. O caderno virou o lugar mais seu da cela — e cada ano assim desconta meses da pena.', tom: 'bom' };
    case 'trabalhar':
      v.fatos['remicao_trabalho'] = v.t;
      escrever(v, { texto: 'Passou a trabalhar na unidade (oficina, cozinha, limpeza): o pecúlio é pouco, os dias contam a menos.', relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'Uma vaga na oficina: pouco dinheiro, as mãos ocupadas e três dias de trabalho descontando um da pena.', tom: 'neutro' };
    case 'conviver': {
      const outro = conhecerNoPavilhao(v, r);
      return { texto: `${outro.nome} divide o pavilhão com você há meses. Uma conversa no banho de sol virou outra, e outra: ${outro.nome} conhece as regras de dentro — e conta da família que espera lá fora.`, tom: 'neutro' };
    }
    case 'visitas': {
      const quem = vinculosVivos(v).filter(x => !x.p.especie && (x.vin.parentesco || x.vin.romance) && x.vin.proximidade >= 35 && x.p.municipioId === v.moradia.municipioId);
      const vieram = quem.filter(x => r.chance(0.35 + x.vin.proximidade / 160));
      for (const x of vieram) { x.vin.proximidade = clamp(x.vin.proximidade + 5); x.vin.tUltimoContato = v.t; }
      if (!vieram.length) { abalar(v, 'a visita que não veio', -4, 4); return { texto: 'Você pôs os nomes na lista de visitas. No domingo, ninguém veio. Na semana seguinte, também não.', tom: 'ruim' }; }
      const nomes = vieram.map(x => x.p.nome);
      lembrarCom(v, vieram[0].p.id, 'Vinha nas visitas, no domingo, com a sacola de sempre.', 'apoio', 2);
      abalar(v, 'as visitas', 4, -4);
      return { texto: `${nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`} ${nomes.length === 1 ? 'veio' : 'vieram'} no domingo. Uma hora de mesa de plástico, a comida da sacola, as notícias de fora — e a volta para a cela, que pesa mais depois.`, tom: 'bom' };
    }
    case 'defensoria': {
      p!.assistencia = v.t;
      const d = p!.disciplina ?? 70;
      const cumpriu = (v.t - p!.tInicio) / Math.max(1, p!.tFim - p!.tInicio);
      if (p!.regime === 'fechado' && p!.penaMeses && cumpriu >= 0.4 && d >= 65 && r.chance(0.55)) {
        p!.regime = 'semiaberto';
        escrever(v, { texto: 'A defensoria conseguiu a progressão para o semiaberto antes do previsto: o comportamento contou.', relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
        return { texto: 'O pedido da defensoria saiu: progressão para o semiaberto. Trabalho de dia, a unidade à noite.', tom: 'bom' };
      }
      if (r.chance(0.3)) {
        const menos = r.int(2, 6);
        p!.tFim = Math.max(v.t + 1, p!.tFim - menos);
        return { texto: `A defensoria revisou o cálculo da pena e achou um erro a seu favor: ${menos} meses a menos.`, tom: 'bom' };
      }
      return { texto: 'O pedido entrou na fila da defensoria. A resposta: ainda não — falta tempo, ou falta o papel do comportamento. Para o ano, de novo.', tom: 'neutro' };
    }
    case 'preparar_saida':
      p!.preparouSaida = v.t;
      marcarFato(v, 'preparou_saida');
      escrever(v, { texto: 'Preparou a saída: concluiu um curso de qualificação na unidade e saiu com uma carta de emprego de um programa de egressos.', relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      return { texto: 'Um curso de qualificação, a carta de um programa de egressos, o endereço de onde ficar: a saída tem um primeiro passo.', tom: 'bom' };
    case 'fugir': return tentarFugir(v, r);
    case 'entregar_se': {
      const f = j.foragido!;
      j.foragido = undefined;
      j.prisao = { tInicio: v.t, tFim: v.t + Math.max(6, f.restante), regime: 'fechado', penaMeses: f.restante, disciplina: 45 };
      escrever(v, { texto: `Entregou-se depois de ${Math.max(1, Math.round((v.t - f.t) / 12))} ano${v.t - f.t >= 24 ? 's' : ''} foragid${ele(v)}. Voltou para cumprir o resto da pena — sem o tempo a mais de quem é recapturado.`, relevancia: 'marco', tema: 'trabalho', tom: 'neutro', escolha: true });
      return { texto: 'Você se apresentou ao fórum. O resto da pena continua — mas sem a conta de quem é pego.', tom: 'neutro' };
    }
    case 'faccao_aceitar':
      p!.faccao = 'dentro'; p!.pendente = undefined;
      ajustarDisciplina(v, -15);
      marcarFato(v, 'faccao_prisao');
      escrever(v, { texto: 'Na prisão, aceitou a proteção de um grupo que mandava no pavilhão.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: 'A cela ficou melhor e ninguém mais encara você no pátio. A dívida não tem número — e não acaba no portão.', tom: 'ruim' };
    case 'faccao_recusar':
      p!.faccao = 'recusou'; p!.pendente = undefined;
      ajustarDisciplina(v, 5);
      if (r.chance(0.35)) { v.corpo.saude = clamp(v.corpo.saude - 6); abalar(v, 'o recado do pavilhão', -6, 10); return { texto: 'Você recusou com respeito. Uma semana depois, a resposta veio no pátio — nada que a enfermaria não costure. Depois, deixaram você em paz.', tom: 'ruim' }; }
      return { texto: 'Você recusou com respeito. Deram de ombros: tem quem não serve para isso. Você seguiu na sua.', tom: 'neutro' };
    case 'briga_evitar':
      p!.pendente = undefined;
      abalar(v, 'a provocação engolida', -3, 6);
      return { texto: 'Você engoliu, mudou de lugar na fila, passou a ir ao pátio em outro horário. Ele achou outra pessoa para provocar.', tom: 'neutro' };
    case 'briga_enfrentar': {
      p!.pendente = undefined;
      ajustarDisciplina(v, -20);
      // REWORK 9.6: a briga machuca de verdade (ou não) — e o machucado tem cuidado, recuperação e sequela.
      machucarNaBriga(v, r, 2);
      if (r.chance(0.5)) { p!.tFim += 3; escrever(v, { texto: 'Uma briga no pátio rendeu falta disciplinar e meses a mais de regime fechado.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); if (p!.regime === 'semiaberto') p!.regime = 'fechado'; return { texto: 'A briga durou segundos; o castigo, semanas de isolamento. Falta grave no prontuário, e a progressão ficou mais longe.', tom: 'ruim' }; }
      return { texto: 'Você não baixou a cabeça. Os agentes separaram antes de piorar — e o pavilhão entendeu o recado. A disciplina anotou.', tom: 'neutro' };
    }
    case 'briga_transferencia':
      p!.pendente = undefined;
      return r.chance(0.6) ? { texto: 'O pedido saiu: outra ala, outros rostos. Recomeçar dentro também cansa.', tom: 'neutro' } : (p!.pendente = 'briga', { texto: 'O pedido foi negado: "não há vaga". A provocação continua lá.', tom: 'ruim' });
    case 'motim_ficar':
      p!.pendente = undefined;
      ajustarDisciplina(v, 6);
      abalar(v, 'o motim', -4, 8);
      return { texto: 'Você ficou na cela, de costas para a grade, até o barulho passar. Na revista do dia seguinte, quem ficou de fora foi anotado — a favor.', tom: 'neutro' };
    case 'motim_participar': {
      p!.pendente = undefined;
      ajustarDisciplina(v, -30);
      v.corpo.saude = clamp(v.corpo.saude - r.int(2, 12));
      p!.tFim += r.int(4, 12); p!.regime = 'fechado';
      delete v.fatos['remicao_trabalho'];
      escrever(v, { texto: 'Participou de um motim na unidade: falta grave, perda do trabalho interno e mais tempo de regime fechado.', relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: 'O pavilhão foi retomado de madrugada. Quem estava junto perdeu o que tinha — o trabalho, o banho de sol, meses de pena.', tom: 'ruim' };
    }
  }
}

function conhecerNoPavilhao(v: Vida, r: ReturnType<typeof rngDe>): Pessoa {
  const p = criarPessoa(v, r, { idade: clamp(idade(v) + r.int(-8, 10), 18, 70), genero: ge(v) === 'feminino' ? 'feminino' : 'masculino', municipioId: v.moradia.municipioId, ocupacao: 'cumpre pena' });
  const vin = vincular(v, p, { origem: 'rotina', proximidade: 38, confianca: 30, estagio: 'conhecido' });
  vin.ambiente = 'prisao';
  lembrarCom(v, p.id, 'Conheceram-se no pavilhão, cumprindo pena.', 'descoberta', 2);
  return p;
}

/** A fuga: uma escolha abstrata (nada de como), com o preço de quase sempre dar errado. */
function tentarFugir(v: Vida, r: ReturnType<typeof rngDe>): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const j = v.justica!;
  const p = j.prisao!;
  const chance = p.regime === 'semiaberto' ? 0.25 : 0.06;
  if (!r.chance(chance)) {
    p.disciplina = clamp((p.disciplina ?? 70) - 35);
    p.regime = 'fechado';
    p.tFim += r.int(8, 18);
    p.remidos = 0;
    delete v.fatos['remicao_trabalho'];
    escrever(v, { texto: 'Tentou fugir da unidade e foi recapturad' + ele(v) + ': falta grave, regime fechado, mais tempo de pena e o que tinha remido perdido.', relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
    marcar(v, 'fracasso', 'A fuga que não deu certo.', 3);
    abalar(v, 'a fuga frustrada', -10, 14);
    return { texto: 'Não passou do muro. O isolamento, a falta grave, a pena maior — e a progressão voltou para o começo da fila.', tom: 'ruim' };
  }
  const restante = Math.max(6, p.tFim - v.t);
  j.prisao = undefined;
  j.foragido = { t: v.t, restante };
  escrever(v, { texto: `${p.regime === 'semiaberto' ? 'Não voltou da saída para o trabalho' : 'Fugiu da unidade'}. Passou a viver foragid${ele(v)}: sem documento, sem carteira, olhando para trás.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
  marcar(v, 'fracasso', 'Foragid' + ele(v) + ' da Justiça.', 3);
  for (const x of pais(v)) { const vin = v.vinculos[x.id]; if (vin) vin.tensao = clamp(vin.tensao + 15); }
  return { texto: 'Você está do lado de fora. Não pode trabalhar com carteira, não pode cruzar uma fronteira, não pode dar o endereço certo para ninguém. E todo ano alguém pode reconhecer você.', tom: 'neutro' };
}

/* ---------------------------------------------------------------- O ano */

/**
 * O ano dentro (depois de `processarJustica`): a disciplina se recupera devagar, o pavilhão pressiona (uma situação de
 * cada vez, com resposta; sem resposta, a vida responde por você), quem tem facção paga a conta, a remição acumula.
 * E o ano de quem fugiu: a recaptura possível.
 */
export function processarPrisao(v: Vida): void {
  const j = v.justica;
  if (!j) return;
  if (j.foragido) { anoForagido(v); return; }
  const p = j.prisao;
  if (!p) return;
  const r = rngDe(v.id, 'prisao_ano', v.t);
  // A situação do ano passado que ficou sem resposta: o pavilhão decide por você.
  if (p.pendente && v.t - (p.tPendente ?? v.t) >= 12) {
    if (p.pendente === 'faccao') { p.faccao = 'recusou'; }
    else if (p.pendente === 'briga') { ajustarDisciplina(v, -8); machucarNaBriga(v, r, 2); }
    p.pendente = undefined;
  }
  const remiu = (v.fatos['remicao_estudo'] !== undefined ? 3 : 0) + (v.fatos['remicao_trabalho'] !== undefined ? 3 : 0);
  if (remiu) p.remidos = (p.remidos ?? 0) + remiu;
  p.disciplina = clamp((p.disciplina ?? 70) + 4);
  if (p.faccao === 'dentro') {
    v.mente.estresse = clamp(v.mente.estresse + 4);
    if (r.chance(0.25)) { ajustarDisciplina(v, -12); escrever(v, { texto: 'O grupo do pavilhão cobrou um favor. Você fez — e a disciplina anotou.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' }); }
  }
  // Os conhecidos do pavilhão envelhecem a amizade (sem convívio fora, ela fica onde estava).
  if (!p.pendente && idade(v) >= 18 && v.t < p.tFim - 3) {
    const opcoes: { id: 'faccao' | 'briga' | 'motim'; peso: number }[] = [
      { id: 'faccao', peso: p.faccao ? 0 : 0.18 },
      { id: 'briga', peso: p.faccao === 'dentro' ? 0.06 : 0.14 },
      { id: 'motim', peso: p.regime === 'fechado' ? 0.07 : 0.02 }
    ];
    const total = opcoes.reduce((s, o) => s + o.peso, 0);
    if (r.chance(total)) {
      const e = r.weighted(opcoes, o => o.peso);
      if (e) { p.pendente = e.id; p.tPendente = v.t; }
    }
  }
}

function anoForagido(v: Vida): void {
  const j = v.justica!;
  const f = j.foragido!;
  const r = rngDe(v.id, 'foragido', v.t);
  v.mente.estresse = clamp(v.mente.estresse + 8);
  if (r.chance(0.3)) {
    j.foragido = undefined;
    j.prisao = { tInicio: v.t, tFim: v.t + f.restante + 12, regime: 'fechado', penaMeses: f.restante + 12, disciplina: 30 };
    if (v.trabalho.atual) v.trabalho.atual = undefined;
    escrever(v, { texto: `Foi recapturad${ele(v)} depois de ${Math.max(1, Math.round((v.t - f.t) / 12))} ano${v.t - f.t >= 24 ? 's' : ''} foragid${ele(v)}. A pena voltou — com um ano a mais e o regime fechado.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    abalar(v, 'a recaptura', -12, 14);
    const par = parceiro(v);
    if (par) par.vin.tensao = clamp(par.vin.tensao + 10);
  }
}

/** Em uma linha, para as telas que só precisam de um aviso (o Você, o Agora). */
export function situacaoDeForagido(v: Vida): string | undefined {
  const f = v.justica?.foragido;
  return f ? `Foragid${ele(v)} desde ${anoDe(f.t)}: sem carteira, sem fronteira; a recaptura pode vir a qualquer ano. Entregar-se encurta a conta.` : undefined;
}
