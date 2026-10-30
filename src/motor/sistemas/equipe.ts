/**
 * REWORK 12.3 · PILAR E — A EQUIPE DO TRABALHO, COM NOME E TEMPO. Antes, a chefia e os colegas apareciam por acontecimento
 * (um nome novo a cada cena). Agora cada emprego tem a sua gente — quem chefia, os colegas, quem responde a você (nos postos
 * de comando), às vezes um mentor e às vezes um rival — e essa gente envelhece, sai, é promovida, troca de empresa e
 * continua no mundo (o ex-colega vira contato; o colega da escola pode reaparecer na empresa nova).
 *
 *   EQUIPE      montada na entrada (reaproveitando quem já é do trabalho), pelas pessoas de verdade (`Pessoa`)
 *   O ANO       a chefia muda (e a vaga dela não vira promoção automática), colegas saem e viram ex-colegas, o mentor
 *               ensina (o desempenho sobe), o rival disputa (o clima pesa)
 *   CONFLITO    a tensão alta com a chefia ou com um colega abre a conversa (`trab123_conflito`): conversar, negociar,
 *               levar ao RH, pedir transferência, procurar o sindicato ou um advogado, sair — nunca um serviço por fora
 *   SANÇÕES     advertência e suspensão são administrativas (no emprego), diferentes de processo (na Justiça)
 */
import { clamp, rngDe } from '../rng';
import type { Emprego, Pessoa, Vida } from '../tipos';
import { escrever, idadePessoa, lembrarCom } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { ocupacaoOuNula } from '../dados/ocupacoes';

const ambiente = (e: Emprego) => `trabalho:${e.empregador}:${e.tInicio}`;
/** Quem tem equipe: empregos com chefia (não o autônomo, o mandato, o atleta, o bico). */
export function temEquipe(e?: Emprego): e is Emprego {
  if (!e || e.contrato === 'autonomo' || e.contrato === 'informal' || e.posAposentadoria) return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  return !!oc && oc.trilha !== 'atleta' && oc.trilha !== 'politica';
}
const vivo = (v: Vida, id?: string) => !!id && !!v.pessoas[id]?.vivo && !!v.vinculos[id];

function novoColega(v: Vida, e: Emprego, r: ReturnType<typeof rngDe>, papel: 'chefe' | 'colega' | 'subordinado'): Pessoa {
  const i = Math.floor((v.t - v.eu.tNasc) / 12);
  const idade = papel === 'chefe' ? r.int(Math.max(28, i - 2), Math.min(63, i + 18)) : papel === 'subordinado' ? r.int(20, Math.max(22, i - 2)) : r.int(Math.max(20, i - 8), Math.min(62, i + 8));
  const oc = ocupacaoOuNula(e.ocupacaoId);
  const p = criarPessoa(v, r, { idade, municipioId: e.municipioId });
  p.ocupacao = papel === 'chefe' ? (p.genero === 'feminino' ? 'gestora' : 'gestor') : oc ? (p.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : p.ocupacao;
  p.renda = Math.round(e.salario * (papel === 'chefe' ? 1.7 : papel === 'subordinado' ? 0.7 : 1));
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: papel === 'chefe' ? 20 : 28, convivio: ['trabalho'], estagio: 'colega' });
  vin.ambiente = ambiente(e);
  return p;
}

/**
 * A equipe do emprego atual (montada na primeira vez). Reaproveita quem já é do trabalho; e, às vezes, quem você já
 * conhecia (da escola, da faculdade, de um emprego antigo) está lá — o reencontro (F5).
 */
export function garantirEquipe(v: Vida): NonNullable<Emprego['equipe']> | undefined {
  const e = v.trabalho.atual;
  if (!temEquipe(e)) return undefined;
  if (e.equipe) {
    e.equipe.colegas = e.equipe.colegas.filter(id => vivo(v, id));
    return e.equipe;
  }
  const r = rngDe(v.id, 'equipe', e.empregador, e.tInicio);
  const ja = Object.values(v.vinculos).filter(x => x.ambiente === ambiente(e) && vivo(v, x.pessoaId)).map(x => x.pessoaId);
  const eq: NonNullable<Emprego['equipe']> = { colegas: ja.slice(0, 3) };
  eq.chefeId = novoColega(v, e, r, 'chefe').id;
  while (eq.colegas.length < 2) eq.colegas.push(novoColega(v, e, r, 'colega').id);
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (oc && oc.nivel >= 3) eq.subordinados = [novoColega(v, e, r, 'subordinado').id, ...(oc.nivel >= 4 ? [novoColega(v, e, r, 'subordinado').id] : [])];
  // O reencontro: alguém da sua história (escola, faculdade, emprego antigo), vivo, na mesma cidade, trabalha lá também.
  const antigos = Object.values(v.vinculos).filter(x => ['escola', 'faculdade', 'trabalho'].includes(x.origem) && x.ambiente !== ambiente(e) && vivo(v, x.pessoaId) && v.pessoas[x.pessoaId].municipioId === e.municipioId && idadePessoa(v, v.pessoas[x.pessoaId]) >= 18 && !x.parentesco && !x.romance);
  if (antigos.length && r.chance(0.22)) {
    const x = r.pick(antigos);
    const p = v.pessoas[x.pessoaId];
    if (!x.convivio.includes('trabalho')) x.convivio.push('trabalho');
    x.ambiente = ambiente(e);
    eq.colegas.push(p.id);
    const de = x.origem === 'escola' ? 'da sua turma de escola' : x.origem === 'faculdade' ? 'dos tempos de faculdade' : 'de um emprego antigo';
    eq.reencontro = p.id;
    escrever(v, { texto: `${p.nome}, ${de}, trabalha ${e.empregador.replace(/^(uma|a) /, 'na ').replace(/^(um|o) /, 'no ')} também. ${x.tensao >= 40 ? 'O passado entre vocês veio junto.' : 'O mundo é pequeno.'}`, relevancia: 'cotidiano', tema: 'trabalho', pessoas: [p.id] });
    lembrarCom(v, p.id, `Reencontraram-se no trabalho, ${e.empregador}.`, 'antigo', 1);
  }
  // Mentor (quem chega há pouco, às vezes, ganha quem ensine) e rival (quem disputa o mesmo lugar).
  const cand = eq.colegas.map(id => v.pessoas[id]).filter(Boolean);
  const mentor = cand.find(p => p.temperamento.responsabilidade > 0.25 && idadePessoa(v, p) > Math.floor((v.t - v.eu.tNasc) / 12) + 5);
  if (mentor && r.chance(0.5)) eq.mentorId = mentor.id;
  const rival = cand.find(p => p.id !== eq.mentorId && p.temperamento.afabilidade < -0.2);
  if (rival && r.chance(0.6)) { eq.rivalId = rival.id; v.vinculos[rival.id].tensao = Math.max(v.vinculos[rival.id].tensao, 25); }
  e.equipe = eq;
  return eq;
}

/** O ano da equipe: quem sai, quem chega, o que o mentor ensina, o que o rival disputa — e o conflito que pede conversa. */
export function processarEquipe(v: Vida): void {
  const e = v.trabalho.atual;
  const eq = garantirEquipe(v);
  if (!e || !eq) return;
  const r = rngDe(v.id, 'equipe_ano', v.t);
  // A chefia: aposenta, sai, é promovida — e quem chega é outra pessoa (a vaga não vira promoção automática sua).
  const chefe = eq.chefeId ? v.pessoas[eq.chefeId] : undefined;
  if (!chefe?.vivo || r.chance(idadePessoa(v, chefe) >= 62 ? 0.3 : 0.08)) {
    const saiu = chefe?.vivo ? chefe : undefined;
    if (saiu && v.vinculos[saiu.id]) v.vinculos[saiu.id].convivio = v.vinculos[saiu.id].convivio.filter(c => c !== 'trabalho');
    const novo = novoColega(v, e, r, 'chefe');
    eq.chefeId = novo.id;
    escrever(v, { texto: `${saiu ? `${saiu.nome} deixou a chefia; ` : ''}quem assumiu foi ${novo.nome}.${saiu && e.desempenho >= 70 ? ' Houve quem achasse que a vaga seria sua.' : ''}`, relevancia: 'cotidiano', tema: 'trabalho', pessoas: [novo.id] });
  }
  // Os colegas: um sai para outra empresa (e continua no mundo, como ex-colega).
  for (const id of [...eq.colegas]) {
    const p = v.pessoas[id];
    if (!p?.vivo || !v.vinculos[id]) { eq.colegas = eq.colegas.filter(x => x !== id); continue; }
    if (r.chance(0.09)) {
      eq.colegas = eq.colegas.filter(x => x !== id);
      v.vinculos[id].convivio = v.vinculos[id].convivio.filter(c => c !== 'trabalho');
      if (eq.rivalId === id) delete eq.rivalId;
      if (eq.mentorId === id) delete eq.mentorId;
      escrever(v, { texto: `${p.nome} saiu para outra empresa. ${v.vinculos[id].proximidade >= 45 ? 'Prometeram manter contato.' : 'A mesa dele ficou vazia por um mês.'}`, relevancia: 'cotidiano', tema: 'trabalho', pessoas: [id] });
    }
  }
  if (eq.colegas.length < 2) eq.colegas.push(novoColega(v, e, r, 'colega').id);
  // O mentor ensina; o rival disputa.
  if (eq.mentorId && vivo(v, eq.mentorId)) { e.desempenho = clamp(e.desempenho + 3); v.vinculos[eq.mentorId].proximidade = clamp(v.vinculos[eq.mentorId].proximidade + 2); if (v.t - e.tInicio >= 48 && r.chance(0.3)) delete eq.mentorId; }
  if (eq.rivalId && vivo(v, eq.rivalId)) { e.clima = clamp((e.clima ?? 50) - 3); v.vinculos[eq.rivalId].tensao = clamp(v.vinculos[eq.rivalId].tensao + 4); }
  // O conflito que pede conversa (a chefia ou um colega, com tensão alta) — no máximo a cada dois anos.
  const alvo = [eq.chefeId, eq.rivalId, ...eq.colegas].filter((x): x is string => !!x && vivo(v, x)).find(id => v.vinculos[id].tensao >= 55);
  if (alvo && !(v.fatos['trab123_conflito'] !== undefined && v.t - v.fatos['trab123_conflito'] < 24)) { v.fatos['trab123_conflito'] = v.t; v.fatos['trab123_conflito_quem'] = Number(alvo.replace(/\D/g, '')) || 0; eq.conflito = alvo; }
  // Sanções administrativas (no emprego, não na Justiça): o desempenho muito baixo, com o clima ruim.
  if (e.desempenho < 25 && (e.clima ?? 50) < 40 && r.chance(0.5)) {
    const recentes = (e.sancoes ?? []).filter(s => v.t - s.t < 24);
    const tipo = recentes.length ? 'suspensao' : 'advertencia';
    (e.sancoes ??= []).push({ t: v.t, tipo, motivo: 'desempenho' });
    escrever(v, { texto: tipo === 'advertencia' ? `Uma advertência por escrito${chefe ? `, assinada por ${v.pessoas[eq.chefeId!]?.nome ?? 'a chefia'}` : ''}: o desempenho não está no que se espera. É administrativo — fica na ficha do emprego, não na da Justiça.` : 'Uma suspensão de alguns dias, depois da advertência. Mais uma, e a conversa vai ser outra.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
}

/** Quem é quem na equipe, para a tela (os nomes, o papel, o clima com cada um). */
export function leituraDaEquipe(v: Vida): { papel: string; nome: string; id: string; tensao: number; proximidade: number }[] {
  const eq = v.trabalho.atual?.equipe;
  if (!eq) return [];
  const linha = (id: string | undefined, papel: string) => (id && vivo(v, id) ? [{ papel, nome: v.pessoas[id].nome, id, tensao: v.vinculos[id].tensao, proximidade: v.vinculos[id].proximidade }] : []);
  return [
    ...linha(eq.chefeId, 'chefia'),
    ...linha(eq.mentorId, 'mentor'),
    ...linha(eq.rivalId, 'rival'),
    ...eq.colegas.filter(id => id !== eq.mentorId && id !== eq.rivalId).flatMap(id => linha(id, eq.reencontro === id ? 'colega (reencontro)' : 'colega')),
    ...(eq.subordinados ?? []).flatMap(id => linha(id, 'responde a você'))
  ];
}
