/**
 * Desafios de vida: processos em que o desempenho importa.
 *
 * A entrevista de emprego é um processo em etapas (`sistemas/entrevista`):
 * duas ou três perguntas escolhidas para a vaga, respostas que são
 * abordagens, e uma devolutiva com motivo. A conversa do aumento continua
 * sendo uma decisão de uma etapa só.
 */

import type { Conteudo, Ctx, Resultado } from './base';
import type { Rng } from '../rng';
import type { Vida } from '../tipos';
import { OCUPACOES, ocupacao, ocupacaoOuNula, type Ocupacao, type Setor } from '../dados/ocupacoes';
import { contratar, elegibilidade, nomeOcupacao, textoDeContratacao } from '../sistemas/trabalho';
import { avaliar, ctxEntrevista, escolherPerguntas, notaDaResposta, perguntaPorId, reacao, type Pergunta } from '../sistemas/entrevista';
import { registrarDevolutiva } from '../sistemas/devolutivas';
import { novaOportunidade } from '../sistemas/oportunidades';
import { marcar } from '../sistemas/marcas';
import { abalar } from '../sistemas/abalo';
import { podeTentar } from '../plausibilidade';
import { escrever } from '../nucleo';
import { clamp } from '../rng';

/** Como a pessoa chegou à entrevista (guardado como índice num fato). */
export const VIAS = ['curriculo', 'indicacao', 'estagio', 'aprendiz', 'proposta', 'vaga'];

export const vagaDaEntrevista = (c: Ctx): Ocupacao | undefined => OCUPACOES[c.v.fatos['entrevista_oc'] ?? -1];

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Entrevista antiga (save anterior ao FIX): uma pergunta só, pelos fatos. */
function legado(c: Ctx, bonus: number): Resultado {
  const oc = vagaDaEntrevista(c);
  const porta = (c.v.fatos['entrevista_bonus'] ?? 0) / 100;
  const via = VIAS[c.v.fatos['entrevista_via'] ?? 0] ?? 'curriculo';
  delete c.v.fatos['entrevista_oc'];
  delete c.v.fatos['entrevista_bonus'];
  delete c.v.fatos['entrevista_via'];
  if (!oc) return { texto: 'A vaga já tinha sido preenchida.', memoria: null, tom: 'ruim' };
  const base = elegibilidade(c.v, oc).chance ?? 0.4;
  if (c.r.chance(clamp(base + bonus + porta, 0.03, 0.95))) {
    const e = contratar(c.v, c.r, oc, via);
    return { texto: `Ligaram dois dias depois: a vaga é sua. ${cap(nomeOcupacao(c.v, oc))} em ${e.empregador}, R$ ${e.salario.toLocaleString('pt-BR')} por mês.`, memoria: textoDeContratacao(c.v, oc, e), tom: 'bom', relevancia: 'marco' };
  }
  return { texto: 'O e-mail veio educado: "decidimos seguir com outro candidato".', memoria: null, tom: 'ruim' };
}

/* ------------------------------------------------------ Entrevista em etapas */

/** Começa uma entrevista: escolhe as perguntas desta vaga e abre a primeira. */
export function iniciarEntrevista(v: Vida, r: Rng, oc: Ocupacao, bonus: number, via: string): void {
  const perguntas = escolherPerguntas(v, r, oc);
  v.caminhos.processo = { tipo: 'entrevista', ocupacaoId: oc.id, bonus, via, etapas: perguntas.map(id => ({ id })), atual: 0, lugar: r.chance(0.5) ? 'a' : 'o' };
}

function perguntaAtual(c: Ctx): Pergunta | undefined {
  const pr = c.v.caminhos.processo;
  if (!pr || pr.tipo !== 'entrevista') return undefined;
  return perguntaPorId(pr.etapas[pr.atual]?.id ?? '');
}

const CENARIO: Partial<Record<Setor, string>> = {
  comercio: 'Uma sala nos fundos da loja, entre caixas de estoque.',
  alimentacao: 'Uma mesa do salão vazio, antes do movimento do almoço.',
  beleza: 'Uma cadeira do salão, entre um cliente e outro.',
  saude: 'Uma sala do RH do hospital, com cheiro de álcool em gel.',
  cuidado: 'A sala da coordenação, com a agenda da semana na parede.',
  construcao: 'Um contêiner que serve de escritório da obra, capacete pendurado na parede.',
  industria: 'Uma sala envidraçada que dá para a linha de produção.',
  manutencao: 'O escritório da oficina, com cheiro de graxa.',
  logistica: 'Uma sala ao lado do galpão, empilhadeiras apitando lá fora.',
  agro: 'A varanda do escritório da fazenda.',
  tecnologia: 'Uma chamada de vídeo com duas pessoas — uma de câmera desligada.',
  criativo: 'Um estúdio com o portfólio de alguém espalhado na mesa.',
  comunicacao: 'Uma redação barulhenta, telefone tocando ao fundo.',
  educacao: 'A sala da coordenação da escola, com desenhos de criança na parede.'
};

function textoDaPergunta(c: Ctx): string {
  const pr = c.v.caminhos.processo;
  const p = perguntaAtual(c);
  if (!pr || !p) {
    const oc = vagaDaEntrevista(c);
    const inicio = c.v.trabalho.historico.length === 0 && !c.v.trabalho.atual;
    return `Sala pequena, ar-condicionado forte. ${c.r.chance(0.5) ? 'A entrevistadora' : 'O entrevistador'} folheia seu currículo${inicio ? ' — quase em branco —' : ''} e pergunta por que deveriam escolher você${oc && oc.nivel >= 4 ? ' para liderar' : ''}.`;
  }
  const oc = ocupacaoOuNula(pr.ocupacaoId ?? '');
  const ctx = oc ? ctxEntrevista(c.v, oc) : undefined;
  const pergunta = ctx ? p.texto(ctx) : '';
  const quem = pr.lugar === 'a' ? 'A entrevistadora' : 'O entrevistador';
  if (pr.atual === 0) {
    const cenario = (oc && CENARIO[oc.setor]) ?? 'Sala pequena, ar-condicionado forte.';
    const primeiro = ctx?.primeiro ? ' — quase em branco —' : '';
    const porta = pr.via === 'indicacao' ? ' Alguém de dentro indicou você; isso abre a conversa, não fecha a vaga.' : pr.via === 'estagio' ? ' É a vaga que o curso divulgou.' : '';
    return `${cenario} ${quem} folheia seu currículo${primeiro}.${porta} ${pergunta}`;
  }
  const anterior = pr.etapas[pr.atual - 1];
  return `${reacao(c.r, anterior?.nota ?? 0)} ${pergunta}`;
}

function responder(c: Ctx, k: number): Resultado {
  const pr = c.v.caminhos.processo;
  const p = perguntaAtual(c);
  if (!pr || !p || !pr.ocupacaoId) return { texto: 'A entrevista já tinha acabado.', memoria: null };
  const resp = p.respostas[k];
  const etapa = pr.etapas[pr.atual];
  etapa.resposta = resp.id;
  etapa.nota = notaDaResposta(c.v, ocupacao(pr.ocupacaoId), p.id, resp.id);
  pr.atual += 1;
  if (pr.atual < pr.etapas.length) return { texto: '', memoria: null, reabrir: true };
  return concluirEntrevista(c);
}

function concluirEntrevista(c: Ctx): Resultado {
  const pr = c.v.caminhos.processo!;
  c.v.caminhos.processo = undefined;
  c.v.caminhos.entrevistas.feitas += 1;
  const oc = ocupacao(pr.ocupacaoId!);
  const nome = nomeOcupacao(c.v, oc);
  const d = elegibilidade(c.v, oc);
  if (!podeTentar(d)) return { texto: 'Antes de o resultado sair, a vaga foi preenchida por dentro.', memoria: null, tom: 'ruim' };
  const a = avaliar(c.v, oc, d.chance ?? 0.4, pr.bonus, pr.etapas);
  if (c.r.chance(a.chance)) {
    const e = contratar(c.v, c.r, oc, pr.via);
    const elogio = a.melhor ? ` Na ligação, disseram que ${a.melhor.bom}.` : '';
    registrarDevolutiva(c.v, { tipo: 'entrevista', titulo: `Entrevista para ${nome}`, texto: a.melhor ? `Passou. Disseram que ${a.melhor.bom}.` : 'Passou.', passou: true, ocupacaoId: oc.id });
    return { texto: `Ligaram dois dias depois: a vaga é sua. ${nome.charAt(0).toUpperCase() + nome.slice(1)} em ${e.empregador}, R$ ${e.salario.toLocaleString('pt-BR')} por mês.${elogio}`, memoria: textoDeContratacao(c.v, oc, e), tom: 'bom', relevancia: 'marco' };
  }
  const perto = a.chance >= 0.4;
  const motivo = a.falta === 'experiencia' ? 'seguiram com alguém de mais experiência'
    : a.falta === 'formacao' ? 'buscavam alguém formado na área'
      : a.falta === 'entrevista' ? (a.pior ? a.pior.ruim : 'a entrevista não ajudou')
        : 'a vaga era disputada e escolheram outra pessoa';
  let texto = a.falta === 'entrevista'
    ? `Não passou. Pelo retorno, ${motivo}.`
    : a.falta === 'concorrencia' && a.media >= 0.3
      ? `Você foi bem${a.melhor ? ` — ${a.melhor.bom}` : ''}. Mesmo assim, escolheram outra pessoa: a vaga era disputada.`
      : `O e-mail veio educado: ${motivo}.`;
  if (a.pior && a.falta !== 'entrevista') texto += ` Um detalhe pesou: ${a.pior.ruim}.`;
  if (perto && c.r.chance(0.35)) {
    novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: oc.id, meses: 12, chave: `retorno_${oc.id}`, bonus: 0.15, titulo: `Chamaram de novo: ${nome}`, texto: `A empresa da entrevista para ${nome} abriu outra vaga e lembrou de você.` });
    texto += ' Semanas depois, ligaram: abriu outra vaga, e seu nome estava na lista.';
  } else if (perto) texto += ' Disseram que o seu currículo fica guardado.';
  registrarDevolutiva(c.v, { tipo: 'entrevista', titulo: `Entrevista para ${nome}`, texto: `Não passou: ${motivo}.`, passou: false, perto, falta: a.falta, ocupacaoId: oc.id });
  marcar(c.v, 'reprovacao', `Entrevista para ${nome}: não passou (${motivo}).`, 1, { ocupacaoId: oc.id, trilha: oc.trilha });
  abalar(c.v, `a entrevista para ${nome}`, -3, 2);
  // A primeira reprovação entra na Linha da Vida; as seguintes ficam nas devolutivas (não viram ruído).
  const primeira = c.v.caminhos.devolutivas.filter(x => x.tipo === 'entrevista' && !x.passou).length === 1;
  return { texto, memoria: `Fez entrevista para ${nome} e não passou: ${motivo}.`, tom: 'ruim', relevancia: primeira ? 'cotidiano' : 'tecnico' };
}

function resolverNegociacao(c: Ctx, bonus: number, arriscado: boolean): { texto: string; memoria: string | null; tom: 'bom' | 'ruim' } {
  const e = c.v.trabalho.atual;
  if (!e) return { texto: 'Não havia mais o que negociar.', memoria: null, tom: 'ruim' };
  const chance = clamp((e.desempenho - 40) / 60 + bonus, 0.05, 0.9);
  if (c.r.chance(chance)) {
    const pct = arriscado ? 0.15 : 0.08;
    e.salario = Math.round(e.salario * (1 + pct) / 10) * 10;
    const n = (c.v.fatos['aumentos'] ?? 0) + 1;
    c.v.fatos['aumentos'] = n;
    return { texto: `A chefia pensou dois dias e aprovou: o salário foi para R$ ${e.salario.toLocaleString('pt-BR')}.`, memoria: n === 1 ? `Negociou um aumento e conseguiu: R$ ${e.salario.toLocaleString('pt-BR')}.` : null, tom: 'bom' };
  }
  if (arriscado && c.r.chance(0.35)) {
    e.desempenho = clamp(e.desempenho - 10);
    return { texto: 'A resposta veio seca: "se tem proposta melhor, fique à vontade". O clima azedou.', memoria: null, tom: 'ruim' };
  }
  e.desempenho = clamp(e.desempenho - 2);
  return { texto: 'Disseram que não havia orçamento este ano. Talvez no próximo.', memoria: null, tom: 'ruim' };
}

export const DESAFIOS: Conteudo[] = [
  {
    id: 'trab_negociacao', tipo: 'decisao', idade: [16, 80], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'A conversa do aumento',
    texto: c => `Você marcou quinze minutos com a chefia${c.v.trabalho.atual ? ` em ${c.v.trabalho.atual.empregador}` : ''}. Sala fechada, café frio. É a sua vez de falar.`,
    opcoes: [
      { id: 'resultados', texto: 'Mostrar números: o que você entregou este ano', comportamento: { disciplina: 1 },
        resolver: c => ({ ...resolverNegociacao(c, 0.05 + Math.max(0, c.v.personalidade.tracos.disciplina) / 300, false), relevancia: 'biografia' }) },
      { id: 'proposta', texto: 'Dizer que tem uma proposta de fora', comportamento: { coragem: 1, impulsividade: 1 },
        resolver: c => ({ ...resolverNegociacao(c, c.v.personalidade.tracos.coragem / 250, true), relevancia: 'biografia' }) },
      { id: 'jeito', texto: 'Pedir com jeito, lembrando o tempo de casa', comportamento: { sociabilidade: 1 },
        resolver: c => ({ ...resolverNegociacao(c, c.v.personalidade.tracos.sociabilidade / 300 + Math.min(0.1, (c.v.t - (c.v.trabalho.atual?.tInicio ?? c.v.t)) / 600), false), relevancia: 'biografia' }) }
    ]
  },
  {
    id: 'trab_entrevista', tipo: 'decisao', idade: [14, 80], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => {
      const pr = c.v.caminhos.processo;
      const oc = pr?.ocupacaoId ? ocupacaoOuNula(pr.ocupacaoId) : vagaDaEntrevista(c);
      const nome = oc ? nomeOcupacao(c.v, oc) : 'vaga';
      return pr && pr.tipo === 'entrevista' ? `Entrevista: ${nome} · ${pr.atual + 1} de ${pr.etapas.length}` : `Entrevista: ${nome}`;
    },
    texto: c => textoDaPergunta(c),
    opcoes: [
      ...[0, 1, 2, 3].map(k => ({
        id: `r${k}`,
        texto: (c: Ctx) => perguntaAtual(c)?.respostas[k]?.texto ?? '—',
        disponivel: (c: Ctx) => (perguntaAtual(c)?.respostas[k] ? true : false),
        resolver: (c: Ctx) => responder(c, k)
      })),
      // Saves de antes das etapas: a entrevista de uma pergunta só continua resolvível.
      { id: 'preparo', texto: 'Mostrar que estudou a empresa e a vaga', disponivel: () => false, resolver: c => legado(c, 0.05 + (c.v.mente.cognicao - 50) / 400) },
      { id: 'confianca', texto: 'Vender seu peixe com confiança', disponivel: () => false, resolver: c => legado(c, 0.02 + (c.v.corpo.aparencia - 50) / 300) },
      { id: 'sinceridade', texto: 'Ser sincero sobre o que ainda não sabe', disponivel: () => false, resolver: c => legado(c, (vagaDaEntrevista(c)?.nivel ?? 3) <= 2 ? 0.08 : -0.06) }
    ]
  }
];

void escrever;
