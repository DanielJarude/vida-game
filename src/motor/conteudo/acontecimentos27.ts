/**
 * VIDA 27 — os acontecimentos novos (manuais: abertos por uma ação, nunca sorteados).
 *
 *   rel27_separacao   Pedir o divórcio / separar de quem mora junto: ANTES de assinar, o resumo da partilha (o que fica
 *                     com cada um, o que se passa, as dívidas, o saldo depois) — `sistemas/partilha.resumoDaPartilha`, o
 *                     mesmo plano que a separação aplica. Dá para seguir ou desistir.
 *   enc27_acaso       O encontro por acaso num lugar (o shopping, a fila do cinema, a praia): PRESENCIAL, aberto pela ação
 *   enc27_fa          que levou ao lugar (antes, chegava como notificação do celular). Conversar deixa um fio: a conversa
 *                     pode voltar por mensagem ("e aquele café?").
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { terminar } from '../sistemas/romance';
import { resumoDaPartilha } from '../sistemas/partilha';
import { divorcioNaEpoca } from '../eras/base/leis';
import { resolverEncontro27, rotuloDoLugar15, textoDoEncontro27 } from '../v15/celular/celular15';

const papelDaSeparacao = Object.assign((v: Vida): Pessoa[] => Object.values(v.vinculos).filter(x => x.romance && ['morando_junto', 'casamento'].includes(x.romance.estagio) && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]), { fixo: true });
const quem = (c: Ctx) => c.p.pessoa;
const encontro = (c: Ctx) => c.v.celular15?.encontro27;
const papelDoEncontro = Object.assign((v: Vida): Pessoa[] => { const e = v.celular15?.encontro27; const p = e?.pid ? v.pessoas[e.pid] : undefined; return p?.vivo ? [p] : []; }, { fixo: true });
const lugarCap = (c: Ctx) => { const l = rotuloDoLugar15(encontro(c)!.lugar); return l.charAt(0).toUpperCase() + l.slice(1); };
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
  },
  {
    id: 'enc27_acaso', tipo: 'decisao', idade: [8, 120], tema: 'amizade', manual: true, repetir: 0,
    papeis: { pessoa: papelDoEncontro },
    quando: c => encontro(c)?.t === c.v.t && !encontro(c)?.fa && !!quem(c),
    titulo: c => lugarCap(c),
    texto: c => textoDoEncontro27(c.v) ?? '',
    opcoes: [
      { id: 'conversar', texto: 'Parar para conversar', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'conversar'); return { texto: t, memoria: null }; } },
      { id: 'cumprimentar', texto: 'Cumprimentar e seguir', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'cumprimentar'); return { texto: t, memoria: null }; } },
      { id: 'desviar', texto: 'Fingir que não viu', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'desviar'); return { texto: t, memoria: null }; } }
    ]
  },
  {
    id: 'enc27_fa', tipo: 'decisao', idade: [14, 120], tema: 'escolha', manual: true, repetir: 0,
    quando: c => encontro(c)?.t === c.v.t && !!encontro(c)?.fa,
    titulo: c => lugarCap(c),
    texto: c => textoDoEncontro27(c.v) ?? '',
    opcoes: [
      { id: 'conversar', texto: 'Tirar a foto, com um sorriso', resolver: c => ({ texto: resolverEncontro27(c.v, c.r, 'conversar'), memoria: null }) },
      { id: 'recusar', texto: 'Recusar com educação', resolver: c => ({ texto: resolverEncontro27(c.v, c.r, 'recusar'), memoria: null }) }
    ]
  }
];
