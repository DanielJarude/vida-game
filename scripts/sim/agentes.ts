/**
 * Agentes para as simulações de vida inteira (auditoria das dívidas, sucessão).
 *
 *   primeira          — nenhuma ação; a primeira opção livre de cada decisão (o agente
 *                       histórico do `sucessao.ts`). Nunca procura trabalho.
 *   primeira_trabalha — o mesmo, mais o mínimo que qualquer pessoa faz: procura trabalho
 *                       quando não tem e aposenta quando pode. Isola a falta de trabalho.
 *   prudente          — o que uma pessoa comum faz com o dinheiro: trabalha, sai de casa com
 *                       renda, vive no modesto (aperta quando o mês não fecha), guarda o que
 *                       passa de seis meses de despesa, mata o cartão com o guardado,
 *                       renegocia, adianta empréstimo, aposenta quando pode.
 *   (REWORK 10, §20)  — trabalhador, criminoso, financeiro, equilibrado, arriscado: os perfis que faltavam
 *                       (o acadêmico é o `estudioso`; o atleta, o `esportista`; o familiar, o social e o
 *                       aleatório já existiam). Escolhem por preferência e, sem preferência, ao acaso — nunca
 *                       "a primeira opção".
 *   (outros nomes)    — as estratégias do simulador geral (`estrategias.ts`).
 */

import { disponibilidade, opcoesDeAluguel, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { orcamento, rendaPropriaMensal } from '../../src/motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { OCUPACOES } from '../../src/motor/dados/ocupacoes';
import type { Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import { estrategia } from './estrategias';
import { valoresDeAposta } from '../../src/motor/sistemas/apostas';

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

export interface Agente { agir(v: Vida, r: Rng): Acao[]; decidir(v: Vida, m: Momento, r: Rng): string }

const primeira: Agente = { agir: () => [], decidir: (_v, m) => (m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0]).id };

/** O mínimo: procurar trabalho quando não tem (dos 18 aos 65) e aposentar quando pode e não trabalha (ou aos 65). */
function trabalhoMinimo(v: Vida, out: Acao[]): void {
  const i = idade(v);
  if (i < 18) return;
  if (!v.trabalho.atual && !v.trabalho.aposentadoria && i < 66) {
    // A vaga que vale a pena tentar: a chance que a tela mostra × o salário (ninguém manda currículo só para a vaga dos sonhos).
    const vaga = OCUPACOES.filter(o => o.contrato !== 'estagio' && o.contrato !== 'aprendiz')
      .map(o => ({ o, d: disponibilidade(v, { tipo: 'candidatar', ocupacaoId: o.id }) }))
      .filter(x => podeTentar(x.d))
      .sort((a, b) => (b.d.chance ?? 0.5) * b.o.salario - (a.d.chance ?? 0.5) * a.o.salario)[0];
    if (vaga) out.push({ tipo: 'candidatar', ocupacaoId: vaga.o.id });
  }
  if (tenta(v, { tipo: 'aposentar' }) && (!v.trabalho.atual || i >= 65)) out.push({ tipo: 'aposentar' });
}

const primeiraTrabalha: Agente = { decidir: primeira.decidir, agir: v => { const out: Acao[] = []; trabalhoMinimo(v, out); return out; } };

const PREF_PRUDENTE = ['recusar', 'guardar', 'nao', 'sus', 'publica', 'negar', 'desligar', 'ficar', 'cartorio', 'preparo', 'aposentar'];
const prudente: Agente = {
  decidir: (_v, m) => {
    const livres = m.opcoes.filter(o => !o.bloqueio);
    for (const p of PREF_PRUDENTE) { const o = livres.find(x => x.id === p || x.id.startsWith(p)); if (o) return o.id; }
    return (livres[0] ?? m.opcoes[0]).id;
  },
  agir: v => {
    const i = idade(v);
    const out: Acao[] = [];
    if (i < 18) return out;
    trabalhoMinimo(v, out);
    // Casa: sai com renda e com folga.
    if (moraComFamiliaDeOrigem(v) && i >= 25 && v.trabalho.atual && rendaPropriaMensal(v) > 2500) {
      const alvo = opcoesDeAluguel(v).filter(o => podeTentar(o.veredito)).sort((a, b) => a.aluguel - b.aluguel)[0];
      if (alvo) out.push({ tipo: 'sair_de_casa', modeloId: alvo.m.id });
    }
    if (!moraComFamiliaDeOrigem(v)) {
      const o = orcamento(v);
      const quer = o.sobra < 0 ? 'apertado' : 'modesto';
      if (v.financas.estilo !== quer) out.push({ tipo: 'estilo', valor: quer });
    }
    // Dívida cara: o guardado mata o cartão (o fechamento paga com a conta); sem guardado, o acordo.
    const cartao = v.financas.dividas.filter(d => d.tipo === 'cartao').reduce((s, d) => s + d.saldo, 0);
    if (cartao > 0) {
      const ap = v.financas.investimentos.filter(a => !a.tutelaAte).sort((a, b) => b.valor - a.valor)[0];
      if (ap && ap.valor > 1) out.push({ tipo: 'resgatar', origem: ap.produto, valor: Math.round(Math.min(ap.valor, cartao)) });
      else if (tenta(v, { tipo: 'renegociar' })) out.push({ tipo: 'renegociar' });
    }
    // Empréstimo: adianta com o que passa de seis meses de despesa.
    const despesa = Math.max(1, orcamento(v).despesa);
    for (const d of v.financas.dividas.filter(x => x.tipo === 'emprestimo' || x.tipo === 'acordo')) {
      const sobra = v.financas.conta - despesa * 6;
      if (sobra > 500) out.push({ tipo: 'amortizar', dividaId: d.id, valor: Math.round(Math.min(sobra, d.saldo)) });
    }
    // Guarda o que passa de seis meses de despesa.
    const excesso = v.financas.conta - despesa * 6;
    if (excesso > 1000 && cartao === 0) out.push({ tipo: 'investir', destino: 'pos_fixado', valor: Math.round(excesso) });
    return out;
  }
};

/** Decide pela lista de preferências; sem nenhuma delas disponível, ao acaso entre as livres (não "a primeira"). */
const porPreferencia = (pref: string[]) => (_v: Vida, m: Momento, r: Rng) => {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  for (const p of pref) { const o = livres.find(x => x.id === p || x.id.startsWith(p)); if (o) return o.id; }
  return r.pick(livres.length ? livres : m.opcoes).id;
};

/** O trabalhador: a vida de quem trabalha e guarda (o prudente), pede aumento, faz hora extra, assume o que errou. */
const trabalhador: Agente = {
  decidir: porPreferencia(['aceitar', 'assumir', 'dados', 'fazer', 'trabalhar', 'treinar', 'entregas', 'negociar', 'recusar', 'guardar', 'publica']),
  agir: (v, r) => {
    const out = prudente.agir(v, r);
    if (v.trabalho.atual && idade(v) < 64) { if (tenta(v, { tipo: 'pedir_aumento' })) out.push({ tipo: 'pedir_aumento' }); if (r.chance(0.5) && tenta(v, { tipo: 'horas_extras' })) out.push({ tipo: 'horas_extras' }); }
    return out;
  }
};

/** O criminoso: a vida comum por fora; dentro, aceita o que oferecem por fora e segue fundo (o "carreira" de `crime10`). */
const PREF_CRIME = ['aceitar', 'fundo', 'seguir', 'participar', 'enfrentar', 'advogado', 'particular', 'recorrer', 'pagar', 'antigos', 'esconder', 'culpar', 'revidar'];
const criminoso: Agente = {
  decidir: (v, m, r) => /^(ilic|jus|pri|trab_propina|ilic10)/.test(m.situacaoId) ? porPreferencia(PREF_CRIME)(v, m, r) : porPreferencia(['esconder', 'culpar', 'enfrentar', 'celular', 'revidar', 'entrar', 'clicar'])(v, m, r),
  agir: (v, r) => prudente.agir(v, r)
};

/** O financeiro: guarda muito e investe em renda variável; recusa gastos, aceita sociedade só com folga. */
const financeiro: Agente = {
  decidir: porPreferencia(['orcamento', 'guardar', 'negociar', 'recusar', 'metade', 'ligar', 'tentar', 'nao', 'publica', 'sus']),
  agir: (v, r) => {
    const out = prudente.agir(v, r).filter(a => a.tipo !== 'investir');
    if (idade(v) >= 18 && !moraComFamiliaDeOrigem(v)) {
      const despesa = Math.max(1, orcamento(v).despesa);
      const sobra = v.financas.conta - despesa * 4;
      if (sobra > 1000) out.push({ tipo: 'investir', destino: r.chance(0.6) ? 'acoes' : 'pos_fixado', valor: Math.round(sobra) });
    }
    return out;
  }
};

/** O equilibrado: um pouco de tudo — a rotina do social, o dinheiro do prudente, respostas que conversam. */
const SOCIAL = estrategia('social');
const equilibrado: Agente = {
  decidir: porPreferencia(['conversar', 'meio', 'negociar', 'ritual', 'orcamento', 'visitas', 'uma', 'ouvir', 'aconselhar', 'convencer', 'adaptar', 'poupar', 'medico', 'assumir', 'particular']),
  agir: (v, r) => {
    const dinheiro = new Set(['investir', 'estilo', 'resgatar', 'amortizar', 'renegociar']);
    return [...SOCIAL.agir(v, r).filter(a => !dinheiro.has(a.tipo)), ...prudente.agir(v, r).filter(a => dinheiro.has(a.tipo))];
  }
};

/** O arriscado: o impulsivo de sempre, e o cassino — o caça-níquel e a roleta com uma parte da conta, todo ano. */
const IMPULSIVO = estrategia('impulsivo');
const arriscado: Agente = {
  decidir: porPreferencia(['entrar', 'jogar', 'enfrentar', 'clicar', 'emprestar', 'assinar', 'ir', 'escondido', 'revidar', 'continuar', 'proposta', 'bater']),
  agir: (v, r) => {
    const out = IMPULSIVO.agir(v, r);
    if (idade(v) >= 18 && v.financas.conta > 300) {
      const valores = valoresDeAposta(v);
      const valor = valores.filter(x => x <= v.financas.conta * 0.05).pop() ?? valores[0];
      for (let k = 0; k < 6; k++) out.push({ tipo: 'aposta', op: { jogo: 'niquel', valor } });
      for (let k = 0; k < 4; k++) out.push({ tipo: 'aposta', op: { jogo: 'roleta', apostas: [{ tipo: r.pick(['vermelho', 'preto', 'par', 'impar'] as const), valor }] } });
    }
    return out;
  }
};

export function agente(nome: string): Agente {
  if (nome === 'trabalhador') return trabalhador;
  if (nome === 'criminoso') return criminoso;
  if (nome === 'financeiro') return financeiro;
  if (nome === 'equilibrado') return equilibrado;
  if (nome === 'arriscado') return arriscado;
  if (nome === 'primeira') return primeira;
  if (nome === 'primeira_trabalha') return primeiraTrabalha;
  if (nome === 'prudente') return prudente;
  return estrategia(nome);
}
