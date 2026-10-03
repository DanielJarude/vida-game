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

export function agente(nome: string): Agente {
  if (nome === 'primeira') return primeira;
  if (nome === 'primeira_trabalha') return primeiraTrabalha;
  if (nome === 'prudente') return prudente;
  return estrategia(nome);
}
