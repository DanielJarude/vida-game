/**
 * VIDA 27 — os acontecimentos novos (manuais: abertos por uma ação, nunca sorteados).
 *
 *   rel27_separacao   Pedir o divórcio / separar de quem mora junto: ANTES de assinar, o resumo da partilha (o que fica
 *                     com cada um, o que se passa, as dívidas, o saldo depois) — `sistemas/partilha.resumoDaPartilha`, o
 *                     mesmo plano que a separação aplica. Dá para seguir ou desistir.
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { terminar } from '../sistemas/romance';
import { resumoDaPartilha } from '../sistemas/partilha';
import { divorcioNaEpoca } from '../eras/base/leis';

const papelDaSeparacao = Object.assign((v: Vida): Pessoa[] => Object.values(v.vinculos).filter(x => x.romance && ['morando_junto', 'casamento'].includes(x.romance.estagio) && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]), { fixo: true });
const quem = (c: Ctx) => c.p.pessoa;
const estagio = (c: Ctx) => c.v.vinculos[quem(c).id]?.romance?.estagio ?? 'morando_junto';

export const ACONTECIMENTOS_27: Conteudo[] = [
  {
    id: 'rel27_separacao', tipo: 'decisao', idade: [16, 120], tema: 'amor', manual: true, repetir: 0,
    papeis: { pessoa: papelDaSeparacao },
    quando: c => c.v.fatos['separacao_cena'] === c.v.t && !!quem(c),
    titulo: c => (estagio(c) === 'casamento' ? `O divórcio de ${quem(c).nome}` : `A separação de ${quem(c).nome}`),
    texto: c => `Antes de assinar, a conta do que fica com cada um. ${resumoDaPartilha(c.v, quem(c), estagio(c)).linhas.join(' ')}`,
    opcoes: [
      { id: 'seguir', texto: c => (estagio(c) === 'casamento' ? 'Seguir com o divórcio' : 'Seguir com a separação'),
        resolver: c => {
          const p = quem(c);
          const lei = estagio(c) === 'casamento' ? divorcioNaEpoca(c.v) : '';
          return { texto: `Acabou com ${p.nome}.${lei}`, memoria: null, efeito: () => { delete c.v.fatos['separacao_cena']; terminar(c.v, p, c.v.vinculos[p.id], 'jogador'); } };
        } },
      { id: 'desistir', texto: 'Ainda não', resolver: () => ({ texto: 'Você guardou a conversa para outro dia. Nada foi assinado.', memoria: null, efeito: () => {} }) }
    ]
  }
];
